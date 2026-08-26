import type {
  CriteriosDeHotel,
  FiltroDeHotel,
  OpcaoHotel,
  ProvedorDeHoteis,
  ResultadoDeHoteis,
} from "@/lib/providers/types";
import { geradorDe, semente } from "./aleatorio";
import { resolverAeroporto } from "./data/lugares";
import { BAIRROS, DIARIA_BASE, NOMES_DE_HOTEL, TIPOS_DE_QUARTO } from "./data/hoteis";
import { HOJE_ISO, diferencaEmDias, mes, somarDias } from "@/lib/datas";

/**
 * Busca de hotéis mockada.
 *
 * Doze opções por cidade, com variação real de categoria, bairro, nota e preço
 * — é o que permite ao agente dizer "esse é mais barato, mas fica a 6 km do
 * centro" em vez de listar tudo igual. Determinística pela cidade e pelas datas.
 */

const OPCOES_POR_CIDADE = 12;

const COMODIDADES_POSSIVEIS: FiltroDeHotel[] = [
  "cafe-da-manha",
  "cancelamento-gratis",
  "pet-friendly",
  "piscina",
  "academia",
  "wi-fi-gratis",
  "estacionamento",
  "acessivel",
  "ar-condicionado",
];

export const ROTULO_COMODIDADE: Record<FiltroDeHotel, string> = {
  "cafe-da-manha": "Café da manhã",
  "cancelamento-gratis": "Cancelamento grátis",
  "pet-friendly": "Aceita pet",
  piscina: "Piscina",
  academia: "Academia",
  "wi-fi-gratis": "Wi-Fi grátis",
  estacionamento: "Estacionamento",
  acessivel: "Acessível",
  "ar-condicionado": "Ar-condicionado",
};

function fatorTemporadaHotel(iso: string) {
  const m = mes(iso);
  if (m === 1 || m === 7 || m === 12) return 1.35;
  if (m === 2 || m === 6) return 1.12;
  if (m === 3 || m === 5) return 0.92;
  return 1;
}

function resolverCidade(termo: string) {
  const aeroporto = resolverAeroporto(termo);
  if (!aeroporto) return null;
  return aeroporto.cidade;
}

function gerarHoteis(cidade: string, checkIn: string, checkOut: string, hospedes: number, quartos: number) {
  const noites = Math.max(1, diferencaEmDias(checkIn, checkOut));
  const base = DIARIA_BASE[cidade] ?? 320;
  const bairros = BAIRROS[cidade] ?? ["Centro"];
  const antecedencia = diferencaEmDias(HOJE_ISO(), checkIn);

  const opcoes: OpcaoHotel[] = [];

  for (let i = 0; i < OPCOES_POR_CIDADE; i++) {
    const g = geradorDe(`H-${cidade}-${checkIn}-${checkOut}-${i}`);

    // Distribuição de categorias: a maioria 3 e 4 estrelas, poucas pontas.
    const estrelas = i < 2 ? 2 : i < 5 ? 3 : i < 9 ? 4 : 5;
    const bairro = bairros[i % bairros.length]!;
    // O deslocamento vem do hash da cidade: com `cidade.length`, duas cidades de
    // mesmo tamanho recebiam exatamente a mesma lista de nomes.
    // Passo coprimo com o tamanho da lista para percorrê-la inteira sem repetir,
    // e passo + deslocamento derivados da cidade para que duas cidades não
    // recebam a mesma sequência de nomes.
    const passos = [5, 7, 11, 13, 17, 19, 23];
    const passo = passos[semente(cidade) % passos.length]!;
    const deslocamento = semente(`${cidade}-nomes`) % NOMES_DE_HOTEL.length;
    const nome = NOMES_DE_HOTEL[(i * passo + deslocamento) % NOMES_DE_HOTEL.length]!;

    const fatorEstrelas = { 2: 0.62, 3: 1, 4: 1.5, 5: 2.4 }[estrelas] ?? 1;
    const fatorAntecedencia = antecedencia < 7 ? 1.18 : antecedencia < 30 ? 1.04 : 0.96;
    const distancia = g.numero(0.3, 9.5, 1);
    // Longe do centro é mais barato — e o agente usa isso para explicar a escolha.
    const fatorDistancia = distancia > 6 ? 0.82 : distancia > 3 ? 0.93 : 1.05;

    const diaria = Math.round(
      (base *
        fatorEstrelas *
        fatorTemporadaHotel(checkIn) *
        fatorAntecedencia *
        fatorDistancia *
        g.numero(0.88, 1.14, 3) *
        // Quarto para mais de 2 pessoas custa mais.
        (hospedes > 2 ? 1.25 : 1)) /
        5,
    ) * 5;

    const quantasComodidades = estrelas >= 4 ? g.inteiro(5, 7) : g.inteiro(2, 5);
    const comodidades = g.algunsDe(COMODIDADES_POSSIVEIS, quantasComodidades);
    // Hotel 4+ estrelas sem wi-fi seria estranho.
    if (estrelas >= 4 && !comodidades.includes("wi-fi-gratis")) comodidades.push("wi-fi-gratis");

    const reembolsavel = comodidades.includes("cancelamento-gratis");
    const total = diaria * noites * quartos;

    opcoes.push({
      id: `H~${cidade}~${checkIn}~${checkOut}~${i}`,
      nome,
      bairro,
      cidade,
      estrelas,
      nota: g.numero(estrelas >= 4 ? 8 : 6.6, estrelas >= 4 ? 9.7 : 8.8, 1),
      avaliacoes: g.inteiro(48, 3200),
      distanciaCentroKm: distancia,
      diaria,
      total,
      taxas: Math.round(total * 0.05),
      moeda: "BRL",
      noites,
      quartos,
      tipoDeQuarto: g.umDe(TIPOS_DE_QUARTO),
      comodidades,
      reembolsavel,
      cancelamentoGratisAte: reembolsavel ? somarDias(checkIn, -3) : undefined,
      quartosRestantes: g.inteiro(1, 12),
      destaques: [],
    });
  }

  return opcoes;
}

function marcarDestaques(opcoes: OpcaoHotel[]) {
  if (opcoes.length === 0) return opcoes;

  const maisBarato = opcoes.reduce((a, b) => (b.total < a.total ? b : a));
  const melhorNota = opcoes.reduce((a, b) => (b.nota > a.nota ? b : a));
  const maisPerto = opcoes.reduce((a, b) =>
    b.distanciaCentroKm < a.distanciaCentroKm ? b : a,
  );

  for (const hotel of opcoes) {
    const destaques: string[] = [];
    if (hotel.id === maisBarato.id) destaques.push("mais barato");
    if (hotel.id === melhorNota.id) destaques.push("melhor avaliado");
    if (hotel.id === maisPerto.id) destaques.push("mais perto do centro");
    if (hotel.quartosRestantes <= 2) destaques.push("últimos quartos");
    hotel.destaques = destaques;
  }

  return opcoes;
}

export const provedorDeHoteisMock: ProvedorDeHoteis = {
  async buscar(criterios: CriteriosDeHotel): Promise<ResultadoDeHoteis> {
    const cidade = resolverCidade(criterios.cidade);
    if (!cidade) throw new Error(`Não conheço a cidade "${criterios.cidade}".`);

    if (diferencaEmDias(HOJE_ISO(), criterios.checkIn) < 0) {
      throw new Error(`A data de entrada (${criterios.checkIn}) já passou.`);
    }
    if (diferencaEmDias(criterios.checkIn, criterios.checkOut) < 1) {
      throw new Error("A saída precisa ser pelo menos um dia depois da entrada.");
    }

    const quartos = criterios.quartos ?? 1;
    const todos = marcarDestaques(
      gerarHoteis(cidade, criterios.checkIn, criterios.checkOut, criterios.hospedes, quartos),
    );

    let filtrados = todos;
    if (criterios.precoMin !== undefined) {
      filtrados = filtrados.filter((h) => h.diaria >= criterios.precoMin!);
    }
    if (criterios.precoMax !== undefined) {
      filtrados = filtrados.filter((h) => h.diaria <= criterios.precoMax!);
    }
    if (criterios.estrelasMin !== undefined) {
      filtrados = filtrados.filter((h) => h.estrelas >= criterios.estrelasMin!);
    }
    if (criterios.filtros?.length) {
      filtrados = filtrados.filter((h) =>
        criterios.filtros!.every((f) => h.comodidades.includes(f)),
      );
    }

    const ordem = criterios.ordenar ?? "preco";
    const ordenados = [...filtrados].sort((a, b) => {
      if (ordem === "nota") return b.nota - a.nota;
      if (ordem === "distancia") return a.distanciaCentroKm - b.distanciaCentroKm;
      if (ordem === "estrelas") return b.estrelas - a.estrelas || a.total - b.total;
      return a.total - b.total;
    });

    const precos = todos.map((h) => h.diaria).sort((a, b) => a - b);

    return {
      opcoes: ordenados.slice(0, criterios.limite ?? 6),
      totalEncontrado: ordenados.length,
      faixaDePreco: {
        minimo: precos[0] ?? 0,
        maximo: precos[precos.length - 1] ?? 0,
        mediana: precos[Math.floor(precos.length / 2)] ?? 0,
      },
    };
  },

  async porId(id: string): Promise<OpcaoHotel | null> {
    const partes = id.split("~");
    if (partes.length !== 5 || partes[0] !== "H") return null;
    const [, cidade, checkIn, checkOut, indice] = partes as [string, string, string, string, string];

    const opcoes = marcarDestaques(gerarHoteis(cidade, checkIn, checkOut, 2, 1));
    return opcoes[Number(indice)] ?? null;
  },
};
