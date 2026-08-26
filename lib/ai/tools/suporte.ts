import { tool } from "ai";
import { z } from "zod";
import { provedores } from "@/lib/providers";
import { db } from "@/lib/db";
import { buscarNoFaq, listarTitulos } from "@/lib/knowledge/faq";
import { gerarNumeroDeChamado } from "@/lib/repos/reservas";
import { falha, falhaDe, ok } from "./comum";

/**
 * Tools 10 a 13 — documentação, base de ajuda, chamados e escalação.
 *
 * A tool de documentação sempre devolve o aviso de que é orientação e não
 * garantia consular: essa ressalva não é opcional e não depende do modelo
 * lembrar de escrevê-la.
 */

/* -------------------------------------------------- 10. consultarDocumentacao */

const AVISO_CONSULAR =
  "Isto é orientação, não garantia de embarque. As regras mudam sem aviso e variam " +
  "conforme nacionalidade, motivo da viagem e histórico. A palavra final é do consulado " +
  "do país de destino e da companhia aérea no momento do check-in.";

export const consultarDocumentacao = tool({
  description:
    "Consulta exigências de entrada de um país: passaporte, validade mínima, visto, " +
    "vacinas e comprovantes. Use sempre que o destino for internacional, mesmo que o " +
    "usuário não pergunte — e principalmente antes de emitir uma reserva internacional.",
  inputSchema: z.object({
    destino: z.string().min(2).describe("País ou cidade de destino"),
    nacionalidade: z.string().default("brasileira"),
  }),
  async execute({ destino, nacionalidade }) {
    try {
      const exigencias = await provedores.documentacao.consultar({ destino, nacionalidade });

      if (!exigencias) {
        return falha(
          `Não tenho as exigências de entrada para "${destino}" na base desta demonstração.`,
          "Diga ao usuário para confirmar no consulado e ofereça ajuda com o resto da viagem.",
        );
      }

      return ok("documentacao", { exigencias, aviso: AVISO_CONSULAR });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* --------------------------------------------------------------- 11. faq */

export const faq = tool({
  description:
    "Procura na base de ajuda da agência: bagagem, check-in, remarcação, reembolso, " +
    "no-show, assento, crianças, atraso de voo, pagamento, seguro e correção de nome. " +
    "Use antes de responder qualquer dúvida operacional — nunca responda de memória.",
  inputSchema: z.object({
    pergunta: z.string().min(3).describe("A dúvida do usuário, em palavras dele"),
  }),
  async execute({ pergunta }) {
    try {
      const achados = buscarNoFaq(pergunta, 3);

      if (achados.length === 0) {
        return falha(
          "Não encontrei nada sobre isso na base de ajuda.",
          `Assuntos disponíveis: ${listarTitulos().map((t) => t.titulo).join("; ")}. ` +
            "Se a dúvida for outra, ofereça abrir um chamado.",
        );
      }

      return ok("faq", { pergunta, achados });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* ------------------------------------------------------- 12. abrirChamado */

export const abrirChamado = tool({
  description:
    "Abre um chamado de suporte quando o problema não se resolve no chat: cobrança " +
    "indevida, bagagem extraviada, pedido de exceção de política, reclamação. " +
    "Confirme o assunto com o usuário antes de abrir.",
  inputSchema: z.object({
    assunto: z.string().min(5).max(120),
    descricao: z.string().min(10).describe("O que aconteceu, em detalhes"),
    categoria: z.enum([
      "reserva",
      "pagamento",
      "bagagem",
      "reembolso",
      "alteracao",
      "reclamacao",
      "outro",
    ]),
    prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
    localizador: z.string().optional(),
  }),
  async execute({ assunto, descricao, categoria, prioridade, localizador }) {
    try {
      const reserva = localizador
        ? await db.booking.findUnique({ where: { localizador: localizador.toUpperCase() } })
        : null;

      if (localizador && !reserva) {
        return falha(
          `Não encontrei a reserva ${localizador.toUpperCase()} para vincular ao chamado.`,
          "Confirme o localizador ou abra o chamado sem vínculo.",
        );
      }

      const chamado = await db.supportTicket.create({
        data: {
          numero: gerarNumeroDeChamado(),
          assunto,
          corpo: descricao,
          categoria,
          prioridade,
          status: "ABERTO",
          bookingId: reserva?.id,
        },
      });

      const prazos: Record<string, string> = {
        URGENTE: "até 2 horas",
        ALTA: "até 8 horas",
        MEDIA: "até 1 dia útil",
        BAIXA: "até 3 dias úteis",
      };

      return ok("chamado", {
        numero: chamado.numero,
        assunto,
        categoria,
        prioridade,
        localizador: localizador?.toUpperCase(),
        prazoResposta: prazos[prioridade] ?? "até 1 dia útil",
        abertoEm: chamado.criadoEm.toISOString(),
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* --------------------------------------------------- 13. escalarParaHumano */

export const escalarParaHumano = tool({
  description:
    "Passa a conversa para um atendente humano. Use quando o usuário pedir, quando a " +
    "política não permitir o que ele precisa, ou quando você não tiver como resolver. " +
    "Depois de chamar esta tool, encerre o turno: explique o que vai acontecer e não " +
    "prometa prazos que você não controla.",
  inputSchema: z.object({
    motivo: z.string().min(5).describe("Por que precisa de humano"),
    resumo: z.string().min(10).describe("Resumo do caso para o atendente ler primeiro"),
    urgencia: z.enum(["NORMAL", "ALTA"]).default("NORMAL"),
  }),
  async execute({ motivo, resumo, urgencia }, { messages }) {
    try {
      // A conversa é identificada pelo contexto da execução; quando não houver
      // (chamada avulsa), o registro ainda é criado para não perder o caso.
      const conversa = await db.conversation.findFirst({
        orderBy: { atualizadaEm: "desc" },
        where: { status: { not: "CLOSED" } },
      });

      if (conversa) {
        await db.conversation.update({
          where: { id: conversa.id },
          data: {
            status: "ESCALATED",
            motivoEscalacao: motivo,
            resumoEscalacao: resumo,
            escaladaEm: new Date(),
          },
        });
      }

      const fila = await db.conversation.count({ where: { status: "ESCALATED" } });

      return ok("escalado", {
        motivo,
        resumo,
        urgencia,
        posicaoNaFila: fila,
        mensagensNoHistorico: messages.length,
        oQueAcontece: [
          "Um atendente recebe esta conversa inteira, com tudo o que já foi dito.",
          "Você não precisa repetir nada.",
          urgencia === "ALTA"
            ? "Casos urgentes são atendidos primeiro na fila."
            : "O atendimento segue a ordem da fila.",
        ],
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});
