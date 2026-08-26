import type { UIMessage, UIMessageStreamWriter } from "ai";
import { textoDaMensagem } from "@/lib/repos/conversas";

/**
 * Modo demonstração — o app roda sem `XAI_API_KEY`.
 *
 * Não é um modelo: é um roteiro local que faz streaming de uma resposta escrita
 * à mão, para que a interface inteira (streaming, persistência, cards) possa ser
 * demonstrada antes de a chave da xAI existir. Quando a chave entra no
 * .env.local, a rota /api/chat passa a usar o Grok e este arquivo deixa de ser
 * chamado — nada mais muda.
 *
 * Nas fases seguintes este roteiro também dispara tools por palavra-chave, para
 * que a demo funcione fim a fim sem IA.
 */

const AVISO_MODO_DEMO =
  "Estou em **modo demonstração**: a chave da xAI ainda não foi configurada, " +
  "então não há um modelo pensando por trás desta resposta. A interface, o " +
  "streaming e o histórico são reais — só o raciocínio está desligado.\n\n" +
  "Para ligar: coloque `XAI_API_KEY` no arquivo `.env.local` e reinicie o servidor.";

function roteiro(pergunta: string): string {
  const p = pergunta.toLowerCase();

  if (/voo|passagem|voar|aére|aere/.test(p)) {
    return (
      "Busca de voos entra na **fase 2** desta POC, junto com a camada de " +
      "provedores e o card de resultado.\n\n" +
      AVISO_MODO_DEMO
    );
  }

  if (/hotel|hospedagem|pousada|hosped/.test(p)) {
    return (
      "Busca de hotéis entra na **fase 2**, com filtros de categoria, café da " +
      "manhã e cancelamento grátis.\n\n" +
      AVISO_MODO_DEMO
    );
  }

  if (/reserva|localizador|cancel|alter/.test(p)) {
    return (
      "Reserva, alteração e cancelamento entram na **fase 3**, com regra de " +
      "tarifa e confirmação explícita antes de qualquer cobrança.\n\n" +
      AVISO_MODO_DEMO
    );
  }

  return (
    "Oi. Sou o agente da Rota Viva.\n\n" +
    "Nesta fase eu ainda não busco voo nem hotel de verdade — o esqueleto do " +
    "produto é que está de pé: chat com streaming, histórico salvo em banco e a " +
    "interface completa.\n\n" +
    AVISO_MODO_DEMO
  );
}

/** Escreve a resposta no stream, em pedaços, imitando a cadência de um modelo. */
export async function escreverRespostaDemo(
  writer: UIMessageStreamWriter,
  mensagens: UIMessage[],
) {
  const ultima = [...mensagens].reverse().find((m) => m.role === "user");
  const texto = roteiro(textoDaMensagem(ultima));

  const id = "demo-texto";
  writer.write({ type: "text-start", id });

  for (const pedaco of texto.match(/\S+\s*/g) ?? [texto]) {
    writer.write({ type: "text-delta", id, delta: pedaco });
    await new Promise((r) => setTimeout(r, 18));
  }

  writer.write({ type: "text-end", id });
}
