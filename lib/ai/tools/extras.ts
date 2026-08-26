import { tool } from "ai";
import { z } from "zod";
import { provedores } from "@/lib/providers";
import { moedasSuportadas } from "@/lib/providers/mock/extras";
import { db } from "@/lib/db";
import { viajanteAtual } from "@/lib/traveler";
import { dataFutura, falha, falhaDe, ok } from "./comum";

/**
 * Tools 14 a 19 — os serviços que transformam uma busca de passagem numa viagem
 * inteira: seguro, transfer, passeios, parcelamento, câmbio, custo médio,
 * alerta de preço e perfil do viajante.
 */

/* ------------------------------------------------- 14. cotarSeguroViagem */

export const cotarSeguroViagem = tool({
  description:
    "Cota planos de seguro-viagem por destino e duração. Ofereça sempre em viagem " +
    "internacional, principalmente para a Europa, onde há exigência de cobertura mínima.",
  inputSchema: z.object({
    destino: z.string().min(2),
    dias: z.number().int().min(1).max(365),
    viajantes: z.number().int().min(1).max(9).default(1),
    idadeMaxima: z.number().int().min(0).max(110).optional().describe("Idade do mais velho"),
  }),
  async execute(entrada) {
    try {
      const planos = await provedores.seguros.cotar(entrada);
      const exigeCobertura = planos.some((p) => !p.atendeExigenciaLocal);

      return ok("seguro", {
        destino: entrada.destino,
        dias: entrada.dias,
        viajantes: entrada.viajantes,
        planos,
        exigeCoberturaMinima: exigeCobertura,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ---------------------------------------------------- 15. buscarTransfer */

export const buscarTransfer = tool({
  description:
    "Busca transfer entre aeroporto e hotel (privativo ou compartilhado) e aluguel de " +
    "carro na cidade. Use quando o usuário perguntar como chegar do aeroporto ou como " +
    "se locomover no destino.",
  inputSchema: z.object({
    cidade: z.string().min(2),
    passageiros: z.number().int().min(1).max(9).default(2),
    tipo: z
      .enum(["transfer-privativo", "transfer-compartilhado", "aluguel-de-carro"])
      .optional(),
    dias: z.number().int().min(1).max(60).optional().describe("Diárias do aluguel de carro"),
  }),
  async execute(entrada) {
    try {
      const opcoes = await provedores.transfers.buscar(entrada);

      if (opcoes.length === 0) {
        return falha(
          "Nenhuma opção de transporte para esse número de passageiros.",
          "Sugira dividir o grupo em dois carros.",
        );
      }

      return ok("transfers", { cidade: entrada.cidade, opcoes });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ---------------------------------------------------- 16. buscarPasseios */

export const buscarPasseios = tool({
  description:
    "Busca passeios, ingressos e tours no destino, com preço, duração e categoria. " +
    "Use quando o usuário perguntar o que fazer, ou para complementar um roteiro.",
  inputSchema: z.object({
    cidade: z.string().min(2),
    categoria: z
      .enum(["cultura", "natureza", "gastronomia", "aventura", "familia", "noite"])
      .optional(),
    precoMax: z.number().min(0).optional(),
  }),
  async execute(entrada) {
    try {
      const passeios = await provedores.passeios.buscar({ ...entrada, limite: 8 });

      if (passeios.length === 0) {
        return falha(
          "Nenhum passeio com esses filtros.",
          "Sugira tirar o filtro de categoria ou aumentar o teto de preço.",
        );
      }

      return ok("passeios", { cidade: passeios[0]!.cidade, passeios });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ----------------------------------------------- 17. simularParcelamento */

export const simularParcelamento = tool({
  description:
    "Simula o parcelamento de um valor no cartão: até 3x sem juros, de 4x a 12x com " +
    "1,99% ao mês. Use antes de fechar qualquer compra de valor alto.",
  inputSchema: z.object({
    total: z.number().min(1).describe("Valor total em reais"),
    entrada: z.number().min(0).default(0).describe("Valor pago à vista"),
    parcelas: z.number().int().min(1).max(12).optional().describe("Se ausente, mostra a tabela"),
  }),
  async execute({ total, entrada, parcelas }) {
    try {
      if (entrada >= total) {
        return falha(
          "A entrada cobre o valor inteiro — não há o que parcelar.",
          "Confirme se o usuário quis dizer outro valor.",
        );
      }

      const financiado = total - entrada;
      const JUROS = 0.0199;

      const calcular = (n: number) => {
        if (n <= 3) {
          const parcela = Math.round((financiado / n) * 100) / 100;
          return { parcelas: n, valorParcela: parcela, totalPago: financiado, juros: 0, semJuros: true };
        }
        // Price: parcela fixa com juros compostos.
        const fator = (financiado * JUROS) / (1 - Math.pow(1 + JUROS, -n));
        const parcela = Math.round(fator * 100) / 100;
        const totalPago = Math.round(parcela * n * 100) / 100;
        return {
          parcelas: n,
          valorParcela: parcela,
          totalPago,
          juros: Math.round((totalPago - financiado) * 100) / 100,
          semJuros: false,
        };
      };

      const opcoes = parcelas
        ? [calcular(parcelas)]
        : [1, 2, 3, 6, 10, 12].map(calcular);

      return ok("parcelamento", {
        total,
        entrada,
        financiado,
        jurosAoMes: JUROS * 100,
        opcoes,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ------------------------------------- 18. converterMoeda e custoMedioDestino */

export const converterMoeda = tool({
  description:
    "Converte valores entre moedas com a cotação de demonstração. Use quando o usuário " +
    "perguntar quanto vale algo em reais ou quanto levar de dinheiro.",
  inputSchema: z.object({
    de: z.string().length(3).describe("Código ISO, ex.: BRL"),
    para: z.string().length(3).describe("Código ISO, ex.: EUR"),
    valor: z.number().min(0),
  }),
  async execute({ de, para, valor }) {
    try {
      const cotacao = await provedores.cambio.converter(de, para, valor);
      return ok("cambio", { cotacao, moedasDisponiveis: moedasSuportadas() });
    } catch (e) {
      return falhaDe(e, `Moedas disponíveis: ${moedasSuportadas().join(", ")}.`);
    }
  },
});

export const custoMedioDestino = tool({
  description:
    "Mostra quanto custa comer, se locomover e se hospedar num destino, por dia. Use " +
    "quando o usuário perguntar quanto levar ou quanto vai gastar além da passagem.",
  inputSchema: z.object({
    cidade: z.string().min(2),
    dias: z.number().int().min(1).max(90).optional(),
    pessoas: z.number().int().min(1).max(9).default(1),
  }),
  async execute({ cidade, dias, pessoas }) {
    try {
      const custo = await provedores.cambio.custoMedio(cidade);
      if (!custo) {
        return falha(`Não tenho dados de custo médio para "${cidade}".`);
      }

      return ok("custo-medio", {
        custo,
        dias,
        pessoas,
        totalEstimado: dias ? custo.diarioSugerido * dias * pessoas : undefined,
        observacao:
          "Valores por pessoa, sem hospedagem e sem passeios. Servem para dimensionar o " +
          "dinheiro do dia a dia, não como orçamento fechado.",
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ---------------------------------------------------- 19. alertaDePreco */

export const alertaDePreco = tool({
  description:
    "Cria, lista ou remove alertas de preço para uma rota. O usuário é avisado quando o " +
    "preço cair. Nesta demonstração a verificação é disparada manualmente pelo botão " +
    "'Verificar agora' na tela de alertas.",
  inputSchema: z.object({
    acao: z.enum(["criar", "listar", "remover"]).default("criar"),
    origem: z.string().optional(),
    destino: z.string().optional(),
    dataAlvo: dataFutura.optional(),
    precoAlvo: z.number().min(0).optional().describe("Avisar quando ficar abaixo disto"),
    id: z.string().optional().describe("Para remover"),
  }),
  async execute({ acao, origem, destino, dataAlvo, precoAlvo, id }) {
    try {
      const viajante = await viajanteAtual();

      if (acao === "listar") {
        const alertas = await db.priceAlert.findMany({
          where: { travelerId: viajante.id },
          orderBy: { criadoEm: "desc" },
        });
        return ok("alertas", { alertas });
      }

      if (acao === "remover") {
        if (!id) return falha("Preciso do id do alerta para remover.");
        await db.priceAlert.deleteMany({ where: { id, travelerId: viajante.id } });
        return ok("alertas", {
          alertas: await db.priceAlert.findMany({ where: { travelerId: viajante.id } }),
          removido: id,
        });
      }

      if (!origem || !destino || !dataAlvo) {
        return falha(
          "Para criar um alerta preciso de origem, destino e data.",
          "Pergunte o que estiver faltando — uma coisa por vez.",
        );
      }

      // O preço de hoje vira a linha de base da comparação.
      const busca = await provedores.voos.buscar({
        origem,
        destino,
        dataIda: dataAlvo,
        adultos: 1,
        limite: 1,
      });

      const precoBase = busca.opcoes[0]?.precoTotal;
      if (!precoBase) {
        return falha("Não consegui achar preço para essa rota agora.");
      }

      const alerta = await db.priceAlert.create({
        data: {
          travelerId: viajante.id,
          origem: busca.opcoes[0]!.origem.iata,
          destino: busca.opcoes[0]!.destino.iata,
          dataAlvo,
          precoBase,
          precoAtual: precoBase,
          alvo: precoAlvo,
          status: "ATIVO",
        },
      });

      return ok("alerta-criado", {
        alerta,
        precoBase,
        explicacao:
          "Guardei o preço de hoje como referência. Na tela de alertas há um botão para " +
          "verificar agora — nesta demonstração o job é manual.",
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* -------------------------------------------------- 19b. perfilViajante */

const prefsSchema = z.object({
  assento: z.enum(["corredor", "janela", "indiferente"]).optional(),
  ciaPreferida: z.string().nullable().optional(),
  restricaoAlimentar: z.string().nullable().optional(),
  fidelidade: z.array(z.string()).optional(),
  orcamentoTipico: z.number().nullable().optional(),
  ritmoDeViagem: z.enum(["leve", "normal", "intenso"]).optional(),
});

export const perfilViajante = tool({
  description:
    "Lê ou grava as preferências do viajante: assento, companhia preferida, restrição " +
    "alimentar, programas de fidelidade e ritmo de viagem. Leia no começo da conversa e " +
    "use nas buscas seguintes sem precisar perguntar de novo.",
  inputSchema: z.object({
    acao: z.enum(["ler", "gravar"]).default("ler"),
    preferencias: prefsSchema.optional(),
  }),
  async execute({ acao, preferencias }) {
    try {
      const viajante = await viajanteAtual();
      const atuais = JSON.parse(viajante.prefs || "{}") as Record<string, unknown>;

      if (acao === "ler") {
        return ok("perfil", {
          nome: viajante.nome,
          email: viajante.email,
          preferencias: atuais,
          vazio: Object.keys(atuais).length === 0,
        });
      }

      if (!preferencias) {
        return falha("Nada para gravar.", "Pergunte qual preferência o usuário quer salvar.");
      }

      // Mescla em vez de substituir: gravar o assento não pode apagar a
      // restrição alimentar informada três mensagens atrás.
      const novas = { ...atuais, ...preferencias };

      await db.traveler.update({
        where: { id: viajante.id },
        data: { prefs: JSON.stringify(novas) },
      });

      return ok("perfil", {
        nome: viajante.nome,
        email: viajante.email,
        preferencias: novas,
        salvo: true,
        vazio: false,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});
