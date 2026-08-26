import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const BRL_CENTAVOS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata em reais. Sem centavos por padrão — preço de passagem não precisa deles. */
export function brl(valor: number, comCentavos = false) {
  return comCentavos ? BRL_CENTAVOS.format(valor) : BRL.format(valor);
}

/** "1h 45min" a partir de minutos. */
export function duracao(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Preposição certa antes do nome da cidade: "em Lisboa", mas "no Rio de
 * Janeiro". Sem isto o agente escreve "3 dias em Rio de Janeiro", que soa como
 * tradução automática e derruba a confiança no resto da resposta.
 */
const CIDADES_COM_ARTIGO: Record<string, string> = {
  "Rio de Janeiro": "no",
  Porto: "no",
  Recife: "no",
  Cairo: "no",
  Havre: "no",
  "Cidade do México": "na",
  "Foz do Iguaçu": "em",
};

export function emCidade(cidade: string) {
  const preposicao = CIDADES_COM_ARTIGO[cidade] ?? "em";
  return `${preposicao} ${cidade}`;
}

/** Plural de palavras terminadas em -l ("hotel" → "hotéis"). */
export function plural(quantidade: number, singular: string, pluralExplicito?: string) {
  if (quantidade === 1) return `${quantidade} ${singular}`;
  return `${quantidade} ${pluralExplicito ?? `${singular}s`}`;
}

/** "12 mar" — data curta em pt-BR a partir de ISO (sem fuso, para não deslocar o dia). */
export function dataCurta(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
