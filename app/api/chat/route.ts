import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { criarModelo, nomeDoModelo, temCredenciais } from "@/lib/ai/provider";
import { escreverRespostaDemo } from "@/lib/ai/demo";
import { systemPrompt } from "@/lib/ai/system-prompt";
import { ferramentas } from "@/lib/ai/tools";
import { consumir, ipDaRequisicao } from "@/lib/rate-limit";
import { garantirConversa, salvarMensagens } from "@/lib/repos/conversas";
import { viajanteAtual } from "@/lib/traveler";

export const maxDuration = 60;

/**
 * Único caminho até o modelo. A chave da xAI nunca sai daqui: o client fala com
 * esta rota, esta rota fala com o provedor.
 */

// O UIMessage do AI SDK tem parts variadas; validamos a casca e confiamos no SDK
// para o miolo. O que importa checar aqui é forma, tamanho e origem.
const CorpoDoChat = z.object({
  id: z.string().min(1).max(64).optional(),
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.object({ type: z.string() }).passthrough()).default([]),
      }),
    )
    .min(1)
    .max(200),
});

function erro(mensagem: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ erro: mensagem, ...extra }, { status });
}

/**
 * Traduz a falha do provedor para algo acionável.
 *
 * "Tente de novo" é o pior conselho possível quando o problema é falta de
 * crédito ou chave errada: a pessoa repete cinco vezes e conclui que o produto
 * está quebrado. Cada caso aqui diz o que aconteceu e qual é o próximo passo.
 */
function explicarFalhaDoModelo(e: unknown): string {
  const bruto = e as { statusCode?: number; responseBody?: string; message?: string };
  const status = bruto?.statusCode;
  const corpo = String(bruto?.responseBody ?? bruto?.message ?? "");

  if (status === 401) {
    return (
      "A chave da xAI foi recusada. Confira XAI_API_KEY no .env.local e reinicie o " +
      "servidor. Sem chave, o app volta ao modo demonstração e continua funcionando."
    );
  }

  if (status === 403) {
    // A xAI devolve 403 tanto para conta sem crédito quanto para modelo sem acesso.
    if (/credit|licen/i.test(corpo)) {
      return (
        "A conta da xAI não tem créditos. Compre em console.x.ai ou remova a " +
        "XAI_API_KEY do .env.local para voltar ao modo demonstração, que roda sem custo."
      );
    }
    return (
      "A xAI recusou o acesso a este modelo. Verifique se XAI_MODEL é um modelo " +
      "liberado para a sua conta."
    );
  }

  if (status === 404) {
    return `O modelo "${nomeDoModelo()}" não existe nesta conta. Ajuste XAI_MODEL no .env.local.`;
  }

  if (status === 429) {
    return "A xAI limitou a taxa de requisições. Espere alguns segundos e tente de novo.";
  }

  if (status && status >= 500) {
    return "A xAI está com instabilidade no momento. Tente de novo em instantes.";
  }

  return "O modelo falhou no meio da resposta. Tente de novo.";
}

export async function POST(req: Request) {
  const limite = consumir(`chat:${ipDaRequisicao(req)}`);
  if (!limite.permitido) {
    return erro(
      `Muitas mensagens seguidas. Tente de novo em ${limite.esperarSegundos}s.`,
      429,
      { esperarSegundos: limite.esperarSegundos },
    );
  }

  let corpo: z.infer<typeof CorpoDoChat>;
  try {
    corpo = CorpoDoChat.parse(await req.json());
  } catch (e) {
    return erro(
      "Não consegui ler essa mensagem. Recarregue a página e tente de novo.",
      400,
      { detalhe: e instanceof Error ? e.message : undefined },
    );
  }

  const mensagens = corpo.messages as UIMessage[];

  const viajante = await viajanteAtual();
  const conversa = await garantirConversa(corpo.id, viajante.id);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const aoTerminar = async ({ messages }: { messages: UIMessage[] }) => {
    try {
      await salvarMensagens(conversa.id, messages);
    } catch (e) {
      // Falha ao gravar não pode derrubar a resposta que o usuário já está lendo.
      console.error("[chat] falha ao salvar conversa", e);
    }
  };

  // --- Modo demonstração: sem chave, a interface continua inteira de pé. -----
  if (!temCredenciais()) {
    const stream = createUIMessageStream({
      originalMessages: mensagens,
      onFinish: aoTerminar,
      execute: async ({ writer }) => escreverRespostaDemo(writer, mensagens),
      onError: () => "Falha no modo demonstração. Tente de novo.",
    });

    return createUIMessageStreamResponse({
      stream,
      headers: { "x-rota-viva-modo": "demonstracao", "x-conversa": conversa.id },
    });
  }

  // --- Modo real: xAI / Grok ------------------------------------------------
  try {
    const resultado = streamText({
      model: criarModelo(),
      system: systemPrompt({ dataDeHoje: hoje }),
      messages: convertToModelMessages(mensagens),
      tools: ferramentas,
      // O agente precisa de vários passos: buscar, ler o resultado e comentar.
      // Sem isto ele para no primeiro tool call e o usuário vê o card sem análise.
      stopWhen: stepCountIs(6),
    });

    return resultado.toUIMessageStreamResponse({
      originalMessages: mensagens,
      onFinish: aoTerminar,
      headers: { "x-rota-viva-modo": "modelo", "x-conversa": conversa.id },
      onError: (e) => {
        console.error("[chat] erro no stream", e);
        return explicarFalhaDoModelo(e);
      },
    });
  } catch (e) {
    console.error("[chat] erro ao iniciar stream", e);
    return erro(
      "Não consegui falar com o modelo. Verifique XAI_API_KEY e XAI_BASE_URL.",
      502,
    );
  }
}
