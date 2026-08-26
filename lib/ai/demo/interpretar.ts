import { AEROPORTOS, normalizar } from "@/lib/providers/mock/data/lugares";
import { HOJE_ISO, somarDias } from "@/lib/datas";

/**
 * Interpretador de regras do modo demonstração.
 *
 * Não é um modelo: é um conjunto de heurísticas que lê a frase do usuário e
 * decide qual tool chamar e com quais parâmetros. Existe para que a POC possa
 * ser demonstrada por inteiro — com cards, reservas e roteiro — antes de a chave
 * da xAI ser configurada. Com a chave, quem faz este trabalho é o Grok, e este
 * arquivo deixa de ser usado.
 */

export type Intencao =
  | "voos"
  | "hoteis"
  | "roteiro"
  | "pacote"
  | "documentacao"
  | "seguro"
  | "passeios"
  | "transfer"
  | "cambio"
  | "custo"
  | "parcelamento"
  | "reservas"
  | "faq"
  | "conversa";

const PADROES: [Intencao, RegExp][] = [
  ["reservas", /\b(minha[s]? reserva|localizador|remarc|cancel|alterar a reserva|voucher)\b/],
  ["documentacao", /\b(visto|passaporte|document|vacina|imigra)/],
  ["seguro", /\bseguro\b/],
  ["parcelamento", /\b(parcel|prestaç|dividir|entrada de)/],
  ["cambio", /\b(c[aâ]mbio|converter|d[oó]lar|euro|moeda|quanto d[aá])/],
  ["custo", /\b(custo m[eé]dio|quanto custa|or[cç]amento|gastar por dia)/],
  ["transfer", /\b(transfer|traslado|alugar carro|aluguel de carro|do aeroporto)/],
  ["passeios", /\b(passeio|tour|ingresso|atraç|o que fazer em)/],
  ["roteiro", /\b(roteiro|itiner[aá]rio|programaç|dias em|o que fazer)/],
  ["pacote", /\b(pacote|voo \+ hotel|voo e hotel|tudo junto)/],
  ["hoteis", /\b(hotel|hot[eé]is|hospedag|pousada|onde ficar|di[aá]ria)/],
  ["voos", /\b(voo|voos|passagem|passagens|voar|a[eé]rea|ida e volta|decolar)/],
  ["faq", /\b(bagagem|check-?in|reembolso|no.?show|franquia|mala)/],
];

export function detectarIntencao(texto: string): Intencao {
  const t = normalizar(texto);
  for (const [intencao, padrao] of PADROES) {
    if (padrao.test(t)) return intencao;
  }
  return "conversa";
}

/* --------------------------------------------------------------- Lugares */

export type CidadesDetectadas = { origem?: string; destino?: string; unica?: string };

/**
 * Procura cidades conhecidas na frase. Quando há duas, usa as preposições para
 * decidir quem é origem e quem é destino ("de São Paulo para Lisboa").
 */
export function detectarCidades(texto: string): CidadesDetectadas {
  const t = normalizar(texto);

  const achados: { iata: string; cidade: string; posicao: number }[] = [];
  for (const aeroporto of AEROPORTOS) {
    const alvo = normalizar(aeroporto.cidade);
    const posicao = t.indexOf(alvo);
    if (posicao >= 0) achados.push({ iata: aeroporto.iata, cidade: aeroporto.cidade, posicao });
    else {
      // Também aceita o código IATA escrito à mão.
      const porCodigo = new RegExp(`\\b${aeroporto.iata.toLowerCase()}\\b`).exec(t);
      if (porCodigo) achados.push({ iata: aeroporto.iata, cidade: aeroporto.cidade, posicao: porCodigo.index });
    }
  }

  // Uma cidade contida em outra ("Porto" dentro de "Porto Alegre") não conta.
  const filtrados = achados.filter(
    (a) =>
      !achados.some(
        (b) => b !== a && normalizar(b.cidade).includes(normalizar(a.cidade)) && b.cidade.length > a.cidade.length,
      ),
  );

  filtrados.sort((a, b) => a.posicao - b.posicao);

  if (filtrados.length === 0) return {};
  if (filtrados.length === 1) return { unica: filtrados[0]!.cidade, destino: filtrados[0]!.cidade };

  const primeira = filtrados[0]!;
  const segunda = filtrados[1]!;

  // "para/até/rumo a X" indica destino; na dúvida, a primeira é origem.
  const antesDaSegunda = t.slice(Math.max(0, segunda.posicao - 14), segunda.posicao);
  const segundaEhDestino = /\b(para|ate|at[eé]|rumo|destino|->|a)\s*$/.test(antesDaSegunda);

  return segundaEhDestino
    ? { origem: primeira.cidade, destino: segunda.cidade, unica: segunda.cidade }
    : { origem: primeira.cidade, destino: segunda.cidade, unica: segunda.cidade };
}

/* ----------------------------------------------------------------- Datas */

const MESES: Record<string, number> = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4,
  maio: 5, mai: 5, junho: 6, jun: 6, julho: 7, jul: 7, agosto: 8, ago: 8,
  setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11,
  dezembro: 12, dez: 12,
};

/**
 * Extrai ida e volta da frase. Quando não há data, assume daqui a 45 dias por
 * uma semana — e quem chama avisa o usuário de que assumiu.
 */
export function detectarDatas(texto: string): { ida: string; volta?: string; assumido: boolean } {
  const t = normalizar(texto);
  const hoje = HOJE_ISO();
  const anoAtual = Number(hoje.slice(0, 4));

  // "12/10" ou "12/10/2026"
  const numerica = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(t);
  if (numerica) {
    const dia = Number(numerica[1]);
    const mes = Number(numerica[2]);
    const ano = numerica[3] ? Number(numerica[3].length === 2 ? `20${numerica[3]}` : numerica[3]) : anoAtual;
    const ida = montar(ano, mes, dia);
    if (ida) return { ida: ajustarParaFuturo(ida, hoje), volta: undefined, assumido: false };
  }

  // "12 de outubro" / "12 de out"
  const porExtenso = /\b(\d{1,2})\s+de\s+([a-z]{3,9})/.exec(t);
  if (porExtenso) {
    const mes = MESES[porExtenso[2]!];
    if (mes) {
      const ida = montar(anoAtual, mes, Number(porExtenso[1]));
      if (ida) {
        const futuro = ajustarParaFuturo(ida, hoje);
        return { ida: futuro, volta: detectarDuracao(t, futuro), assumido: false };
      }
    }
  }

  // Só o mês: "em outubro"
  for (const [nome, numero] of Object.entries(MESES)) {
    if (nome.length < 4) continue;
    if (new RegExp(`\\b${nome}\\b`).test(t)) {
      const ida = ajustarParaFuturo(montar(anoAtual, numero, 12) ?? hoje, hoje);
      return { ida, volta: detectarDuracao(t, ida), assumido: true };
    }
  }

  if (/\bpr[oó]xim[ao] semana\b/.test(t)) {
    const ida = somarDias(hoje, 7);
    return { ida, volta: detectarDuracao(t, ida), assumido: false };
  }
  if (/\bpr[oó]ximo m[eê]s\b/.test(t)) {
    const ida = somarDias(hoje, 30);
    return { ida, volta: detectarDuracao(t, ida), assumido: false };
  }

  const ida = somarDias(hoje, 45);
  return { ida, volta: detectarDuracao(t, ida) ?? somarDias(ida, 7), assumido: true };
}

/** "5 dias", "uma semana", "10 noites" → data de volta. */
export function detectarDuracao(texto: string, ida: string): string | undefined {
  const t = normalizar(texto);
  const dias = /\b(\d{1,2})\s*(dias?|noites?)\b/.exec(t);
  if (dias) return somarDias(ida, Number(dias[1]));
  if (/\buma semana\b/.test(t)) return somarDias(ida, 7);
  if (/\bduas semanas\b/.test(t)) return somarDias(ida, 14);
  if (/\bum m[eê]s\b/.test(t)) return somarDias(ida, 30);
  if (/\bfim de semana\b/.test(t)) return somarDias(ida, 3);
  return undefined;
}

export function detectarQuantidadeDias(texto: string): number {
  const t = normalizar(texto);
  const dias = /\b(\d{1,2})\s*(dias?|noites?)\b/.exec(t);
  if (dias) return Math.min(21, Math.max(1, Number(dias[1])));
  if (/\bfim de semana\b/.test(t)) return 3;
  if (/\buma semana\b/.test(t)) return 7;
  return 4;
}

export function detectarPassageiros(texto: string): number {
  const t = normalizar(texto);
  const explicito = /\b(\d{1,2})\s*(pessoas?|adultos?|passageiros?|h[oó]spedes?)\b/.exec(t);
  if (explicito) return Math.min(9, Math.max(1, Number(explicito[1])));
  if (/\b(casal|minha esposa|meu marido|namorad|dois de n[oó]s|a dois)\b/.test(t)) return 2;
  if (/\bfam[ií]lia\b/.test(t)) return 4;
  if (/\bsozinh[oa]\b/.test(t)) return 1;
  return 1;
}

export function detectarCabine(texto: string) {
  const t = normalizar(texto);
  if (/\bprimeira classe\b/.test(t)) return "primeira" as const;
  if (/\b(executiv|business)/.test(t)) return "executiva" as const;
  if (/\bpremium\b/.test(t)) return "premium" as const;
  return "economica" as const;
}

function montar(ano: number, mes: number, dia: number) {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Data no passado quase sempre significa o ano que vem. */
function ajustarParaFuturo(iso: string, hoje: string) {
  if (iso >= hoje) return iso;
  const ano = Number(iso.slice(0, 4)) + 1;
  return `${ano}${iso.slice(4)}`;
}
