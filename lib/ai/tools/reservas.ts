import { tool } from "ai";
import { z } from "zod";
import { provedores } from "@/lib/providers";
import type { RegrasTarifarias } from "@/lib/providers/types";
import { db } from "@/lib/db";
import { viajanteAtual } from "@/lib/traveler";
import {
  buscarPorLocalizador,
  calcularPolitica,
  criarReserva as gravarReserva,
  lerReserva,
  listarDoViajante,
  listarPorEmail,
  registrarAlteracao,
  registrarCancelamento,
  type SnapshotReserva,
} from "@/lib/repos/reservas";
import { brl } from "@/lib/utils";
import { dataFutura, confirmacao, falha, falhaDe, ok } from "./comum";

/**
 * Tools 5 a 9 — reserva e pós-venda.
 *
 * Todas as três ações com consequência (emitir, alterar, cancelar) seguem o
 * mesmo protocolo: a chamada sem `confirmado` apenas SIMULA e devolve o resumo
 * com valores; só a chamada seguinte, com `confirmado: true`, grava. A regra
 * vive no schema, não apenas no prompt — assim o modelo não emite uma reserva
 * por ter interpretado mal a conversa.
 */

const passageiroSchema = z.object({
  nome: z.string().min(3).describe("Nome completo como no documento"),
  documento: z.string().optional().describe("Documento fictício; nunca peça um real"),
  nascimento: z.string().optional(),
});

/* --------------------------------------------------------- 5. criarReserva */

export const criarReserva = tool({
  description:
    "Emite uma reserva de voo, hotel ou pacote. SEMPRE chame primeiro sem `confirmado` " +
    "para ver o resumo e mostrá-lo ao usuário; só chame com `confirmado: true` depois de " +
    "um sim explícito dele. Use os ids exatos devolvidos pelas buscas.",
  inputSchema: z.object({
    vooId: z.string().optional(),
    hotelId: z.string().optional(),
    passageiros: z.array(passageiroSchema).min(1).max(9),
    email: z.string().email().describe("E-mail de contato para o voucher"),
    telefone: z.string().optional(),
    confirmado: confirmacao,
  }),
  async execute(entrada) {
    try {
      if (!entrada.vooId && !entrada.hotelId) {
        return falha(
          "Preciso de pelo menos um voo ou um hotel para reservar.",
          "Faça a busca antes e use o id da opção escolhida.",
        );
      }

      const [voo, hotel] = await Promise.all([
        entrada.vooId ? provedores.voos.porId(entrada.vooId) : null,
        entrada.hotelId ? provedores.hoteis.porId(entrada.hotelId) : null,
      ]);

      if (entrada.vooId && !voo) {
        return falha("Esse voo não existe mais.", "Refaça a busca e escolha outra opção.");
      }
      if (entrada.hotelId && !hotel) {
        return falha("Esse hotel não existe mais.", "Refaça a busca e escolha outra opção.");
      }

      const quantidade = entrada.passageiros.length;
      const totalVoo = voo ? voo.precoPorPassageiro * quantidade : 0;
      const totalHotel = hotel ? hotel.total : 0;
      const total = totalVoo + totalHotel;

      const tipo = voo && hotel ? "PACKAGE" : voo ? "FLIGHT" : "HOTEL";

      const resumo = {
        tipo,
        voo,
        hotel,
        passageiros: entrada.passageiros,
        contato: { email: entrada.email, telefone: entrada.telefone },
        totalVoo,
        totalHotel,
        total,
      };

      // Primeira passada: simula e devolve para confirmação.
      if (!entrada.confirmado) {
        return ok("confirmar-reserva", {
          ...resumo,
          requerConfirmacao: true,
          acao: "criar",
          aviso:
            voo && !voo.tarifa.reembolsavel
              ? `A tarifa ${voo.tarifa.nome} não é reembolsável: se cancelar depois, não há devolução.`
              : undefined,
          mensagemDeConfirmacao: `Confirmar reserva de ${brl(total)}`,
        });
      }

      const viajante = await viajanteAtual();

      // O contato informado passa a valer para o viajante da POC.
      if (entrada.email !== viajante.email) {
        await db.traveler.update({
          where: { id: viajante.id },
          data: { telefone: entrada.telefone ?? viajante.telefone },
        });
      }

      const regras: RegrasTarifarias | Record<string, never> = voo
        ? voo.tarifa
        : hotel
          ? {
              fareId: `HOTEL-${hotel.reembolsavel ? "FLEX" : "RIGIDA"}`,
              nome: hotel.reembolsavel ? "Flexível" : "Não reembolsável",
              reembolsavel: hotel.reembolsavel,
              remarcavel: hotel.reembolsavel,
              multaRemarcacao: hotel.reembolsavel ? 0 : hotel.diaria,
              multaCancelamento: hotel.reembolsavel ? 0 : hotel.total,
              prazoLimiteHoras: 48,
              bagagemDespachada: 0,
              bagagemMaoKg: 0,
              marcaAssento: false,
              acumulaMilhas: false,
            }
          : ({} as Record<string, never>);

      const snapshot: SnapshotReserva = {
        voo: voo ?? undefined,
        hotel: hotel ?? undefined,
        passageiros: entrada.passageiros,
        contato: { email: entrada.email, telefone: entrada.telefone },
      };

      const reserva = await gravarReserva({
        travelerId: viajante.id,
        tipo,
        snapshot,
        total,
        fareId: voo?.tarifa.fareId,
        fareRules: regras,
      });

      return ok("voucher", {
        localizador: reserva.localizador,
        emitidaEm: reserva.criadaEm.toISOString(),
        status: "CONFIRMED",
        tipo,
        voo,
        hotel,
        passageiros: entrada.passageiros,
        contato: { email: entrada.email, telefone: entrada.telefone },
        total,
        regras,
      });
    } catch (e) {
      return falhaDe(e, "Tente de novo; se persistir, abra um chamado para o suporte.");
    }
  },
});

/* ------------------------------------------------------ 6. consultarReserva */

export const consultarReserva = tool({
  description:
    "Procura reservas por localizador (RV-XXXXXX) ou por e-mail. Use antes de qualquer " +
    "alteração ou cancelamento, e quando o usuário perguntar sobre uma viagem já comprada.",
  inputSchema: z.object({
    localizador: z.string().optional().describe("Formato RV-XXXXXX"),
    email: z.string().email().optional(),
  }),
  async execute({ localizador, email }) {
    try {
      if (localizador) {
        const encontrada = await buscarPorLocalizador(localizador);
        if (!encontrada) {
          return falha(
            `Não encontrei a reserva ${localizador.toUpperCase()}.`,
            "Confirme o localizador ou peça o e-mail usado na compra.",
          );
        }
        return ok("reservas", { reservas: [serializar(lerReserva(encontrada))] });
      }

      const reservas = email
        ? await listarPorEmail(email)
        : await listarDoViajante((await viajanteAtual()).id);

      if (reservas.length === 0) {
        return falha(
          "Nenhuma reserva encontrada.",
          "Ofereça buscar voos ou hotéis para começar uma viagem nova.",
        );
      }

      return ok("reservas", { reservas: reservas.map((r) => serializar(lerReserva(r))) });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ----------------------------------------------------- 7 e 8. pós-venda */

export const politicaTarifaria = tool({
  description:
    "Explica em linguagem simples as regras da tarifa de uma reserva: se é reembolsável, " +
    "quanto custa remarcar, até quando dá para mexer e o que está incluído.",
  inputSchema: z.object({
    localizador: z.string().describe("Formato RV-XXXXXX"),
  }),
  async execute({ localizador }) {
    try {
      const encontrada = await buscarPorLocalizador(localizador);
      if (!encontrada) {
        return falha(`Não encontrei a reserva ${localizador.toUpperCase()}.`);
      }

      const reserva = lerReserva(encontrada);
      const politica = calcularPolitica(
        reserva.regras,
        reserva.total,
        reserva.dataDeInicio,
        reserva.criadaEm,
      );

      return ok("politica", {
        localizador: reserva.localizador,
        tarifa: reserva.regras,
        politica,
        total: reserva.total,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

export const alterarReserva = tool({
  description:
    "Simula e executa a alteração de data de uma reserva. Chame primeiro sem `confirmado` " +
    "para calcular multa e diferença de tarifa, mostre ao usuário e só então confirme.",
  inputSchema: z.object({
    localizador: z.string(),
    novaDataIda: dataFutura,
    novaDataVolta: dataFutura.optional(),
    confirmado: confirmacao,
  }),
  async execute({ localizador, novaDataIda, novaDataVolta, confirmado }) {
    try {
      const encontrada = await buscarPorLocalizador(localizador);
      if (!encontrada) return falha(`Não encontrei a reserva ${localizador.toUpperCase()}.`);

      const reserva = lerReserva(encontrada);
      if (reserva.status === "CANCELLED") {
        return falha(
          "Essa reserva já foi cancelada.",
          "Ofereça emitir uma reserva nova.",
        );
      }

      const politica = calcularPolitica(
        reserva.regras,
        reserva.total,
        reserva.dataDeInicio,
        reserva.criadaEm,
      );

      if (!politica.podeAlterar) {
        return ok("politica", {
          localizador: reserva.localizador,
          tarifa: reserva.regras,
          politica,
          total: reserva.total,
          bloqueio: politica.motivo,
        });
      }

      // A diferença de tarifa vem de uma busca nova na data pedida.
      let diferenca = 0;
      const voo = reserva.snapshot.voo;
      if (voo) {
        const nova = await provedores.voos.buscar({
          origem: voo.origem.iata,
          destino: voo.destino.iata,
          dataIda: novaDataIda,
          dataVolta: novaDataVolta,
          adultos: reserva.snapshot.passageiros.length,
          cabine: voo.cabine,
          limite: 1,
        });
        const novoPreco = nova.opcoes[0]?.precoTotal ?? reserva.total;
        diferenca = Math.max(0, novoPreco - reserva.total);
      }

      const custoTotal = politica.multaAlteracao + diferenca;

      if (!confirmado) {
        return ok("confirmar-alteracao", {
          localizador: reserva.localizador,
          requerConfirmacao: true,
          acao: "alterar",
          dataAtual: reserva.dataDeInicio,
          novaDataIda,
          novaDataVolta,
          multa: politica.multaAlteracao,
          diferencaTarifa: diferenca,
          custoTotal,
          totalAtual: reserva.total,
          novoTotal: reserva.total + custoTotal,
          motivo: politica.motivo,
          mensagemDeConfirmacao:
            custoTotal > 0
              ? `Confirmar alteração e pagar ${brl(custoTotal)}`
              : "Confirmar alteração sem custo",
        });
      }

      await registrarAlteracao(reserva.id, politica.multaAlteracao, diferenca, {
        de: reserva.dataDeInicio,
        para: novaDataIda,
      });

      const atualizada = await buscarPorLocalizador(localizador);
      return ok("alteracao-feita", {
        localizador: reserva.localizador,
        novaDataIda,
        novaDataVolta,
        multa: politica.multaAlteracao,
        diferencaTarifa: diferenca,
        custoTotal,
        novoTotal: atualizada?.total ?? reserva.total + custoTotal,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

export const cancelarReserva = tool({
  description:
    "Simula e executa o cancelamento de uma reserva, aplicando a regra da tarifa. Chame " +
    "primeiro sem `confirmado` para mostrar multa e valor de reembolso; só confirme depois " +
    "que o usuário disser sim vendo esses números.",
  inputSchema: z.object({
    localizador: z.string(),
    motivo: z.string().optional().describe("Motivo declarado pelo usuário, se houver"),
    confirmado: confirmacao,
  }),
  async execute({ localizador, motivo, confirmado }) {
    try {
      const encontrada = await buscarPorLocalizador(localizador);
      if (!encontrada) return falha(`Não encontrei a reserva ${localizador.toUpperCase()}.`);

      const reserva = lerReserva(encontrada);
      if (reserva.status === "CANCELLED") {
        return falha("Essa reserva já está cancelada.", "Não há o que fazer aqui.");
      }

      const politica = calcularPolitica(
        reserva.regras,
        reserva.total,
        reserva.dataDeInicio,
        reserva.criadaEm,
      );

      if (!politica.podeCancelar) {
        return ok("politica", {
          localizador: reserva.localizador,
          tarifa: reserva.regras,
          politica,
          total: reserva.total,
          bloqueio: politica.motivo,
        });
      }

      if (!confirmado) {
        return ok("confirmar-cancelamento", {
          localizador: reserva.localizador,
          requerConfirmacao: true,
          acao: "cancelar",
          total: reserva.total,
          multa: politica.multaCancelamento,
          reembolso: politica.valorReembolsado,
          reembolsavel: politica.reembolsavel,
          motivo: politica.motivo,
          motivoDoUsuario: motivo,
          mensagemDeConfirmacao:
            politica.multaCancelamento > 0
              ? `Cancelar e pagar multa de ${brl(politica.multaCancelamento)}`
              : "Confirmar cancelamento sem multa",
        });
      }

      await registrarCancelamento(
        reserva.id,
        politica.multaCancelamento,
        politica.valorReembolsado,
      );

      return ok("cancelamento-feito", {
        localizador: reserva.localizador,
        multa: politica.multaCancelamento,
        reembolso: politica.valorReembolsado,
        prazoReembolsoDias: politica.valorReembolsado > 0 ? 30 : 0,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/** Reduz a reserva ao que a UI e o modelo precisam ver. */
function serializar(reserva: ReturnType<typeof lerReserva>) {
  const politica = calcularPolitica(
    reserva.regras,
    reserva.total,
    reserva.dataDeInicio,
    reserva.criadaEm,
  );

  return {
    localizador: reserva.localizador,
    tipo: reserva.tipo,
    status: reserva.status,
    total: reserva.total,
    criadaEm: reserva.criadaEm.toISOString(),
    dataDeInicio: reserva.dataDeInicio,
    viajante: reserva.viajante,
    passageiros: reserva.snapshot.passageiros,
    voo: reserva.snapshot.voo,
    hotel: reserva.snapshot.hotel,
    regras: reserva.regras,
    politica,
    eventos: reserva.eventos.map((e) => ({
      tipo: e.tipo,
      multa: e.multa,
      diferenca: e.diferenca,
      criadoEm: e.criadoEm.toISOString(),
    })),
  };
}
