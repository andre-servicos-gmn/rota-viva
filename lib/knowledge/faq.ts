import fs from "node:fs";
import path from "node:path";
import { normalizar } from "@/lib/providers/mock/data/lugares";

/**
 * Base de conhecimento local: os markdowns de `content/faq/`.
 *
 * A busca é um BM25 simplificado — pontuação por termo, com peso maior para
 * título e tags. Para uma dúzia de artigos isso funciona melhor que embeddings:
 * é instantâneo, não precisa de serviço externo e o resultado é explicável. Se a
 * base crescer para centenas de artigos, este é o ponto onde entraria uma busca
 * vetorial, sem mexer na tool.
 */

export type Artigo = {
  slug: string;
  titulo: string;
  tags: string[];
  corpo: string;
};

let cache: Artigo[] | null = null;

function pastaDoFaq() {
  return path.join(process.cwd(), "content", "faq");
}

export function carregarArtigos(): Artigo[] {
  // Em produção o conteúdo não muda em tempo de execução; em dev, recarregar a
  // cada chamada evita ter que reiniciar o servidor ao editar um markdown.
  if (cache && process.env.NODE_ENV === "production") return cache;

  const pasta = pastaDoFaq();
  if (!fs.existsSync(pasta)) return [];

  const artigos = fs
    .readdirSync(pasta)
    .filter((arquivo) => arquivo.endsWith(".md"))
    .map((arquivo) => {
      const bruto = fs.readFileSync(path.join(pasta, arquivo), "utf8");
      const frente = /^---\n([\s\S]*?)\n---\n/.exec(bruto);

      const meta: Record<string, string> = {};
      if (frente?.[1]) {
        for (const linha of frente[1].split("\n")) {
          const separador = linha.indexOf(":");
          if (separador > 0) {
            meta[linha.slice(0, separador).trim()] = linha.slice(separador + 1).trim();
          }
        }
      }

      const corpo = frente ? bruto.slice(frente[0].length) : bruto;
      const slug = arquivo.replace(/\.md$/, "");

      return {
        slug,
        titulo: meta.titulo ?? slug,
        tags: (meta.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
        corpo: corpo.trim(),
      };
    });

  cache = artigos;
  return artigos;
}

/** Palavras curtas e vazias não ajudam a distinguir um artigo do outro. */
const VAZIAS = new Set([
  "que", "com", "para", "por", "uma", "dos", "das", "meu", "minha", "quanto",
  "como", "qual", "quais", "sobre", "posso", "tenho", "preciso", "fazer", "quero",
  "the", "and", "não", "sim", "mas", "ser", "está", "estou", "voce", "você",
]);

function termos(texto: string) {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !VAZIAS.has(t));
}

export type Achado = {
  slug: string;
  titulo: string;
  trecho: string;
  pontuacao: number;
};

export function buscarNoFaq(pergunta: string, limite = 3): Achado[] {
  const artigos = carregarArtigos();
  const alvos = termos(pergunta);
  if (alvos.length === 0) return [];

  const achados = artigos
    .map((artigo) => {
      const noTitulo = normalizar(artigo.titulo);
      const nasTags = normalizar(artigo.tags.join(" "));
      const noCorpo = normalizar(artigo.corpo);

      let pontuacao = 0;
      for (const termo of alvos) {
        // Título e tags valem mais: descrevem o assunto, não o mencionam de passagem.
        if (noTitulo.includes(termo)) pontuacao += 6;
        if (nasTags.includes(termo)) pontuacao += 4;

        const ocorrencias = noCorpo.split(termo).length - 1;
        // Saturação logarítmica: 20 menções não valem 20 vezes mais que uma.
        if (ocorrencias > 0) pontuacao += 1 + Math.log2(ocorrencias);
      }

      return {
        slug: artigo.slug,
        titulo: artigo.titulo,
        trecho: extrairTrecho(artigo, alvos),
        pontuacao: Math.round(pontuacao * 10) / 10,
      };
    })
    .filter((a) => a.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao);

  return achados.slice(0, limite);
}

/** Devolve a seção mais relevante do artigo, não o artigo inteiro. */
function extrairTrecho(artigo: Artigo, alvos: string[]) {
  const secoes = artigo.corpo.split(/\n(?=## )/);

  let melhor = secoes[0] ?? artigo.corpo;
  let melhorNota = -1;

  for (const secao of secoes) {
    const texto = normalizar(secao);
    const nota = alvos.reduce((soma, termo) => soma + (texto.includes(termo) ? 1 : 0), 0);
    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = secao;
    }
  }

  const limpo = melhor.trim();
  return limpo.length > 700 ? `${limpo.slice(0, 700).trimEnd()}…` : limpo;
}

export function artigoPorSlug(slug: string) {
  return carregarArtigos().find((a) => a.slug === slug) ?? null;
}

export function listarTitulos() {
  return carregarArtigos().map((a) => ({ slug: a.slug, titulo: a.titulo }));
}
