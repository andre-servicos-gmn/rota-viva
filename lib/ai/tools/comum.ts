import { z } from "zod";
import { HOJE_ISO, ehDataValida } from "@/lib/datas";

/**
 * Peças compartilhadas por todas as tools.
 *
 * Regra que vale para as 19: **nenhuma tool lança**. Falha vira payload
 * `{ ok: false, erro, sugestao }`, porque uma exceção no meio do stream some da
 * tela e deixa o usuário olhando para o nada. Como payload, a UI renderiza um
 * card de erro com o que houve e um botão de tentar de novo, e o modelo lê o
 * texto e pode se corrigir sozinho — pedir a data que faltou, por exemplo.
 */

export type Sucesso<K extends string, D> = { ok: true; kind: K } & D;
export type Falha = { ok: false; erro: string; sugestao?: string };
export type Resultado<K extends string, D> = Sucesso<K, D> | Falha;

export function ok<K extends string, D extends object>(kind: K, dados: D): Sucesso<K, D> {
  return { ok: true, kind, ...dados };
}

export function falha(erro: string, sugestao?: string): Falha {
  return { ok: false, erro, sugestao };
}

/**
 * Converte qualquer exceção de provedor em falha legível. As mensagens dos
 * provedores já são escritas para o usuário final ("A data de ida já passou"),
 * então passam direto; o resto vira uma mensagem genérica.
 */
export function falhaDe(e: unknown, sugestao?: string): Falha {
  const mensagem = e instanceof Error ? e.message : "";
  return falha(
    mensagem || "Não consegui completar essa busca agora.",
    sugestao,
  );
}

/* ------------------------------------------------------------ Schemas base */

export const dataISO = z
  .string()
  .describe("Data no formato AAAA-MM-DD")
  .refine(ehDataValida, "Use o formato AAAA-MM-DD com uma data que exista.");

export const dataFutura = dataISO.refine(
  (d) => d >= HOJE_ISO(),
  "Essa data já passou. Confirme o ano com o usuário.",
);

export const cabineSchema = z
  .enum(["economica", "premium", "executiva", "primeira"])
  .describe("Classe da cabine");

export const filtrosDeHotelSchema = z.enum([
  "cafe-da-manha",
  "cancelamento-gratis",
  "pet-friendly",
  "piscina",
  "academia",
  "wi-fi-gratis",
  "estacionamento",
  "acessivel",
  "ar-condicionado",
]);

/**
 * Confirmação explícita para ações com consequência (reservar, alterar,
 * cancelar). A regra vive no schema, e não só no prompt: assim o modelo não
 * consegue emitir uma reserva por engano, mesmo que interprete mal a conversa.
 */
export const confirmacao = z
  .boolean()
  .default(false)
  .describe(
    "Só true depois que o usuário confirmou explicitamente, na mensagem anterior, " +
      "vendo o resumo com valores. Nunca presuma o sim.",
  );
