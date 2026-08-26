/**
 * Rate limit simples por IP — token bucket em memória.
 *
 * POC: suficiente para uma instância. Em produção isto vira Redis/Upstash,
 * porque memória de processo não sobrevive a múltiplas instâncias nem a
 * cold start em serverless.
 */

type Balde = { tokens: number; ultimoRefil: number };

const baldes = new Map<string, Balde>();

const CAPACIDADE = 12; // rajada permitida
const REFIL_POR_MINUTO = 12; // reposição por minuto
const LIMPEZA_APOS_MS = 10 * 60_000;

export type ResultadoLimite = {
  permitido: boolean;
  restante: number;
  esperarSegundos: number;
};

export function consumir(chave: string, custo = 1): ResultadoLimite {
  const agora = Date.now();
  const balde = baldes.get(chave) ?? { tokens: CAPACIDADE, ultimoRefil: agora };

  const minutos = (agora - balde.ultimoRefil) / 60_000;
  balde.tokens = Math.min(CAPACIDADE, balde.tokens + minutos * REFIL_POR_MINUTO);
  balde.ultimoRefil = agora;

  if (balde.tokens < custo) {
    baldes.set(chave, balde);
    const faltando = custo - balde.tokens;
    return {
      permitido: false,
      restante: 0,
      esperarSegundos: Math.ceil((faltando / REFIL_POR_MINUTO) * 60),
    };
  }

  balde.tokens -= custo;
  baldes.set(chave, balde);

  // Limpeza oportunista: evita crescer sem limite em sessões longas de demo.
  if (baldes.size > 500) {
    for (const [k, v] of baldes) {
      if (agora - v.ultimoRefil > LIMPEZA_APOS_MS) baldes.delete(k);
    }
  }

  return {
    permitido: true,
    restante: Math.floor(balde.tokens),
    esperarSegundos: 0,
  };
}

/** IP do cliente atrás de proxy, com queda para um valor fixo em dev. */
export function ipDaRequisicao(req: Request) {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]?.trim() || "desconhecido";
  return req.headers.get("x-real-ip") ?? "local";
}
