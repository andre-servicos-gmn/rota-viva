/**
 * Aleatoriedade determinística.
 *
 * `Math.random()` está proibido nos mocks: a mesma busca precisa devolver
 * sempre o mesmo resultado. Sem isso, o preço muda a cada tecla numa demo, o
 * alerta de preço não tem base de comparação e reservar uma opção que já não
 * existe vira erro. Tudo aqui parte de uma semente derivada dos parâmetros da
 * própria busca.
 */

/** FNV-1a — hash estável de string para semente de 32 bits. */
export function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — gerador pequeno, rápido e reproduzível. */
export function geradorDe(chave: string) {
  let estado = semente(chave);

  const proximo = () => {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    /** Fração em [0, 1). */
    fracao: proximo,
    /** Inteiro em [min, max]. */
    inteiro: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
    /** Número em [min, max] com casas decimais. */
    numero: (min: number, max: number, casas = 2) => {
      const valor = min + proximo() * (max - min);
      const f = 10 ** casas;
      return Math.round(valor * f) / f;
    },
    /** Um item do array. */
    umDe: <T,>(itens: readonly T[]): T => itens[Math.floor(proximo() * itens.length)]!,
    /** Verdadeiro com a probabilidade dada. */
    talvez: (probabilidade: number) => proximo() < probabilidade,
    /** N itens distintos, na ordem original. */
    algunsDe: <T,>(itens: readonly T[], quantidade: number): T[] => {
      const copia = [...itens];
      const escolhidos: T[] = [];
      const total = Math.min(quantidade, copia.length);
      for (let i = 0; i < total; i++) {
        const indice = Math.floor(proximo() * copia.length);
        escolhidos.push(copia.splice(indice, 1)[0]!);
      }
      return escolhidos;
    },
  };
}

export type Gerador = ReturnType<typeof geradorDe>;
