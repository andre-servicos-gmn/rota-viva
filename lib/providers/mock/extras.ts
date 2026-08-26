import type {
  Cotacao,
  CustoMedio,
  Passeio,
  PlanoDeSeguro,
  ProvedorDeCambio,
  ProvedorDePasseios,
  ProvedorDeSeguros,
  ProvedorDeTransfers,
  Transfer,
} from "@/lib/providers/types";
import { geradorDe } from "./aleatorio";
import { resolverAeroporto } from "./data/lugares";
import { ATRACOES, ATRACOES_GENERICAS } from "./data/atracoes";
import { DIARIA_BASE } from "./data/hoteis";

/**
 * Provedores dos serviços complementares: passeios, transfers, seguro e câmbio.
 *
 * Mesma regra dos demais mocks — determinismo por chave, nenhuma marca real,
 * valores plausíveis para o mercado brasileiro.
 */

function cidadeDe(termo: string) {
  return resolverAeroporto(termo)?.cidade ?? null;
}

/* ---------------------------------------------------------------- Passeios */

export const provedorDePasseiosMock: ProvedorDePasseios = {
  async buscar({ cidade, categoria, precoMax, limite }) {
    const nomeCidade = cidadeDe(cidade);
    if (!nomeCidade) throw new Error(`Não conheço a cidade "${cidade}".`);

    const catalogo = ATRACOES[nomeCidade] ?? ATRACOES_GENERICAS;

    let passeios: Passeio[] = catalogo.map((atracao, i) => {
      const g = geradorDe(`P-${nomeCidade}-${i}`);
      return {
        id: `P~${nomeCidade}~${i}`,
        nome: atracao.nome,
        cidade: nomeCidade,
        categoria: atracao.categoria,
        duracaoHoras: atracao.horas,
        preco: atracao.preco,
        moeda: "BRL",
        nota: g.numero(7.8, 9.8, 1),
        incluiTransporte: atracao.horas >= 5 || g.talvez(0.35),
        idiomas: g.talvez(0.6) ? ["português", "inglês", "espanhol"] : ["português", "inglês"],
        descricao: atracao.descricao,
        periodo: atracao.periodo,
      };
    });

    if (categoria) passeios = passeios.filter((p) => p.categoria === categoria);
    if (precoMax !== undefined) passeios = passeios.filter((p) => p.preco <= precoMax);

    return passeios.slice(0, limite ?? 8);
  },

  async porId(id) {
    const partes = id.split("~");
    if (partes.length !== 3 || partes[0] !== "P") return null;
    const cidade = partes[1]!;
    const todos = await provedorDePasseiosMock.buscar({ cidade, limite: 99 });
    return todos.find((p) => p.id === id) ?? null;
  },
};

/* --------------------------------------------------------------- Transfers */

const FORNECEDORES_TRANSFER = ["Via Direta", "Cais Mobilidade", "Trilho Urbano", "Ponto a Ponto"];
const CATEGORIAS_CARRO = [
  { nome: "Compacto", capacidade: 4, bagagens: 2, fator: 1 },
  { nome: "Sedã", capacidade: 5, bagagens: 3, fator: 1.35 },
  { nome: "SUV", capacidade: 5, bagagens: 4, fator: 1.8 },
  { nome: "Minivan 7 lugares", capacidade: 7, bagagens: 5, fator: 2.2 },
];

export const provedorDeTransfersMock: ProvedorDeTransfers = {
  async buscar({ cidade, tipo, passageiros, dias }) {
    const aeroporto = resolverAeroporto(cidade);
    if (!aeroporto) throw new Error(`Não conheço a cidade "${cidade}".`);

    const nomeCidade = aeroporto.cidade;
    // O custo de vida local também puxa o preço do transporte.
    const base = (DIARIA_BASE[nomeCidade] ?? 320) / 3.2;
    const opcoes: Transfer[] = [];

    for (let i = 0; i < 4; i++) {
      const g = geradorDe(`T-${nomeCidade}-compartilhado-${i}`);
      const privativo = i % 2 === 0;
      const capacidade = privativo ? (i === 0 ? 3 : 6) : 8;
      if (capacidade < passageiros) continue;

      opcoes.push({
        id: `T~${nomeCidade}~${privativo ? "priv" : "comp"}~${i}`,
        tipo: privativo ? "transfer-privativo" : "transfer-compartilhado",
        fornecedor: g.umDe(FORNECEDORES_TRANSFER),
        descricao: privativo
          ? `Carro exclusivo do ${aeroporto.nome} até o hotel, com motorista aguardando no desembarque`
          : `Van compartilhada do ${aeroporto.nome}, com até 3 paradas antes do seu hotel`,
        origem: aeroporto.iata,
        destino: `Hotéis em ${nomeCidade}`,
        preco: Math.round((base * (privativo ? 1.9 : 0.85) * g.numero(0.9, 1.2, 2)) / 5) * 5,
        moeda: "BRL",
        duracaoMin: g.inteiro(25, 75) + (privativo ? 0 : 25),
        capacidade,
        bagagens: capacidade,
        cancelamentoGratis: g.talvez(0.7),
      });
    }

    for (const [i, categoria] of CATEGORIAS_CARRO.entries()) {
      if (categoria.capacidade < passageiros) continue;
      const g = geradorDe(`T-${nomeCidade}-carro-${i}`);
      const diarias = dias ?? 3;
      const diaria = Math.round((base * 1.6 * categoria.fator * g.numero(0.9, 1.15, 2)) / 5) * 5;

      opcoes.push({
        id: `T~${nomeCidade}~carro~${i}`,
        tipo: "aluguel-de-carro",
        fornecedor: g.umDe(FORNECEDORES_TRANSFER),
        descricao: `${categoria.nome} com quilometragem livre, retirada e devolução no aeroporto`,
        origem: aeroporto.iata,
        destino: aeroporto.iata,
        preco: diaria * diarias,
        moeda: "BRL",
        capacidade: categoria.capacidade,
        bagagens: categoria.bagagens,
        cancelamentoGratis: true,
        categoriaVeiculo: categoria.nome,
        diarias,
      });
    }

    return tipo ? opcoes.filter((o) => o.tipo === tipo) : opcoes;
  },
};

/* ----------------------------------------------------------------- Seguros */

const COBERTURAS_BASE = [
  { item: "Despesas médicas e hospitalares", essencial: "US$ 20 mil", completo: "US$ 60 mil", premium: "US$ 150 mil" },
  { item: "Bagagem extraviada", essencial: "US$ 600", completo: "US$ 1.200", premium: "US$ 2.500" },
  { item: "Cancelamento de viagem", essencial: "não incluso", completo: "US$ 1.500", premium: "US$ 5.000" },
  { item: "Atraso de voo", essencial: "US$ 150", completo: "US$ 400", premium: "US$ 800" },
  { item: "Traslado médico", essencial: "incluso", completo: "incluso", premium: "incluso" },
  { item: "Prática esportiva", essencial: "não incluso", completo: "amadora", premium: "amadora e radical" },
];

/** Destinos que exigem cobertura médica mínima por acordo internacional. */
const EXIGEM_SEGURO = ["ES", "PT", "FR", "IT", "NL", "GB"];

export const provedorDeSegurosMock: ProvedorDeSeguros = {
  async cotar({ destino, dias, viajantes, idadeMaxima }) {
    const aeroporto = resolverAeroporto(destino);
    const paisCodigo = aeroporto?.paisCodigo ?? "BR";
    const internacional = paisCodigo !== "BR";
    const exigeCobertura = EXIGEM_SEGURO.includes(paisCodigo);

    const niveis: PlanoDeSeguro["nivel"][] = ["essencial", "completo", "premium"];
    const precoDiaBase = internacional ? 34 : 16;
    const fatorIdade = idadeMaxima && idadeMaxima >= 71 ? 2.1 : idadeMaxima && idadeMaxima >= 61 ? 1.5 : 1;

    return niveis.map((nivel, i) => {
      const fator = [1, 1.55, 2.4][i]!;
      const precoPorDia = Math.round(precoDiaBase * fator * fatorIdade);
      const atende = nivel !== "essencial" || !exigeCobertura;

      return {
        id: `S~${paisCodigo}~${nivel}`,
        nome: `Rota Viva ${nivel[0]!.toUpperCase()}${nivel.slice(1)}`,
        nivel,
        precoPorDia,
        precoTotal: precoPorDia * Math.max(1, dias) * Math.max(1, viajantes),
        moeda: "BRL",
        coberturas: COBERTURAS_BASE.map((c) => ({ item: c.item, valor: c[nivel] })),
        atendeExigenciaLocal: atende,
        observacao: !atende
          ? "Este destino costuma exigir cobertura médica mínima de US$ 30 mil por acordo internacional; confirme a exigência atual antes de embarcar."
          : undefined,
      };
    });
  },
};

/* ------------------------------------------------------- Câmbio e custo médio */

/** Taxas fixas de demonstração — em produção viria de um provedor de câmbio. */
const TAXAS_PARA_BRL: Record<string, number> = {
  BRL: 1,
  USD: 5.42,
  EUR: 5.88,
  GBP: 6.9,
  ARS: 0.0052,
  CLP: 0.0057,
  UYU: 0.13,
  PEN: 1.44,
  COP: 0.0013,
  MXN: 0.29,
  ZAR: 0.29,
  AED: 1.48,
  JPY: 0.035,
};

export const provedorDeCambioMock: ProvedorDeCambio = {
  async converter(de, para, valor) {
    const origem = TAXAS_PARA_BRL[de.toUpperCase()];
    const destino = TAXAS_PARA_BRL[para.toUpperCase()];
    if (!origem || !destino) {
      throw new Error(
        `Não tenho cotação para ${de.toUpperCase()}→${para.toUpperCase()}. Moedas disponíveis: ${Object.keys(TAXAS_PARA_BRL).join(", ")}.`,
      );
    }

    const taxa = origem / destino;
    return {
      de: de.toUpperCase(),
      para: para.toUpperCase(),
      taxa: Math.round(taxa * 10000) / 10000,
      valorConvertido: Math.round(valor * taxa * 100) / 100,
      atualizadoEm: new Date().toISOString(),
    };
  },

  async custoMedio(cidade) {
    const aeroporto = resolverAeroporto(cidade);
    if (!aeroporto) return null;

    const nomeCidade = aeroporto.cidade;
    const diaria = DIARIA_BASE[nomeCidade] ?? 320;
    const g = geradorDe(`C-${nomeCidade}`);
    // O custo de vida acompanha a diária média de hotel da cidade.
    const escala = diaria / 320;

    const refeicaoSimples = Math.round(38 * escala * g.numero(0.85, 1.2, 2));
    const refeicaoRestaurante = Math.round(105 * escala * g.numero(0.85, 1.2, 2));
    const transportePublico = Math.round(6 * escala * g.numero(0.8, 1.3, 2));
    const cafe = Math.round(9 * escala * g.numero(0.8, 1.3, 2));

    const custo: CustoMedio = {
      cidade: nomeCidade,
      moeda: aeroporto.moeda,
      refeicaoSimples,
      refeicaoRestaurante,
      transportePublico,
      taxiPorKm: Math.round(5 * escala * g.numero(0.8, 1.3, 2) * 10) / 10,
      diariaMediaHotel: diaria,
      cafe,
      cerveja: Math.round(14 * escala * g.numero(0.8, 1.25, 2)),
      diarioSugerido: 0,
    };

    // Dia típico: duas refeições simples, uma no restaurante, transporte e um café.
    custo.diarioSugerido =
      refeicaoSimples * 2 + refeicaoRestaurante + transportePublico * 3 + cafe;

    return custo;
  },
};

export function moedasSuportadas() {
  return Object.keys(TAXAS_PARA_BRL);
}

export function converterParaBRL(valor: number, moeda: string) {
  const taxa = TAXAS_PARA_BRL[moeda.toUpperCase()] ?? 1;
  return Math.round(valor * taxa * 100) / 100;
}

/** Exposto para o cartão de câmbio mostrar a cotação sem refazer a conta. */
export { TAXAS_PARA_BRL };
