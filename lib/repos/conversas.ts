import type { UIMessage } from "ai";
import { db } from "@/lib/db";

/**
 * Persistência do chat.
 *
 * As mensagens são gravadas no formato UIMessage do AI SDK (as `parts` viram
 * JSON). Guardar as parts inteiras — e não só o texto — é o que permite
 * recarregar uma conversa antiga com os cards de voo, hotel e voucher já
 * renderizados, em vez de um resumo em texto.
 */

export async function garantirConversa(id: string | undefined, travelerId: string) {
  if (id) {
    const existente = await db.conversation.findUnique({ where: { id } });
    if (existente) return existente;
  }
  return db.conversation.create({
    data: { id, travelerId, titulo: "Nova conversa" },
  });
}

export async function carregarMensagens(conversationId: string): Promise<UIMessage[]> {
  const linhas = await db.message.findMany({
    where: { conversationId },
    orderBy: { criadaEm: "asc" },
  });

  return linhas.map((linha) => ({
    id: linha.id,
    role: linha.role as UIMessage["role"],
    parts: seguroParse(linha.parts),
  }));
}

/**
 * Regrava a conversa inteira. Em POC com histórico curto isso é mais simples e
 * mais seguro que reconciliar mensagem a mensagem (o AI SDK pode reescrever a
 * última mensagem do assistente durante o stream).
 */
export async function salvarMensagens(conversationId: string, mensagens: UIMessage[]) {
  await db.$transaction([
    db.message.deleteMany({ where: { conversationId } }),
    db.message.createMany({
      data: mensagens.map((m, indice) => ({
        conversationId,
        role: m.role,
        parts: JSON.stringify(m.parts ?? []),
        // Ordem estável mesmo quando várias mensagens caem no mesmo milissegundo.
        criadaEm: new Date(Date.now() + indice),
      })),
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { atualizadaEm: new Date() },
    }),
  ]);

  await titularSeNecessario(conversationId, mensagens);
}

/** Primeiro pedido do usuário vira o título da conversa na sidebar. */
async function titularSeNecessario(conversationId: string, mensagens: UIMessage[]) {
  const conversa = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversa || conversa.titulo !== "Nova conversa") return;

  const primeira = mensagens.find((m) => m.role === "user");
  const texto = textoDaMensagem(primeira);
  if (!texto) return;

  const titulo = texto.length > 48 ? `${texto.slice(0, 48).trimEnd()}…` : texto;
  await db.conversation.update({ where: { id: conversationId }, data: { titulo } });
}

export function textoDaMensagem(mensagem?: UIMessage) {
  if (!mensagem) return "";
  return (mensagem.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

export async function listarConversas(travelerId: string) {
  return db.conversation.findMany({
    // Conversas sem mensagem ficam para trás quando um stream é abortado (o
    // usuário fecha a aba antes da resposta terminar). Não são conversas de
    // verdade e não devem sujar a lista.
    where: { travelerId, mensagens: { some: {} } },
    orderBy: { atualizadaEm: "desc" },
    take: 40,
    select: { id: true, titulo: true, status: true, atualizadaEm: true },
  });
}

function seguroParse(bruto: string): UIMessage["parts"] {
  try {
    const valor = JSON.parse(bruto);
    return Array.isArray(valor) ? valor : [];
  } catch {
    // Mensagem corrompida não pode derrubar a tela inteira.
    return [{ type: "text", text: "" }];
  }
}
