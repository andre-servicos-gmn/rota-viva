import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Ponto único de contato com o provedor de modelo.
 *
 * Hoje: xAI (Grok) pelo endpoint compatível com OpenAI.
 * Trocar de provedor é trocar as três linhas de `criarModelo()` — nada mais no
 * app importa o SDK do provedor. A chave só existe no servidor: este arquivo
 * nunca pode ser importado por um Client Component.
 */

export const MODELO_PADRAO = "grok-4-fast";
const BASE_URL_PADRAO = "https://api.x.ai/v1";

export function nomeDoModelo() {
  return process.env.XAI_MODEL?.trim() || MODELO_PADRAO;
}

/**
 * Sem chave configurada o app não quebra: entra em modo demonstração
 * (respostas locais, sem IA). Ver `lib/ai/demo.ts`.
 */
export function temCredenciais() {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function criarModelo(): LanguageModel {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "XAI_API_KEY ausente. Defina em .env.local ou use o modo demonstração.",
    );
  }

  const xai = createOpenAICompatible({
    name: "xai",
    baseURL: process.env.XAI_BASE_URL?.trim() || BASE_URL_PADRAO,
    apiKey,
  });

  return xai(nomeDoModelo());
}
