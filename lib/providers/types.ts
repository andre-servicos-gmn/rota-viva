/**
 * Contratos da camada de fornecedores.
 *
 * Este arquivo é a fronteira entre o app e o mundo. Nenhuma tool, rota ou
 * componente conhece a origem dos dados: todos falam com as interfaces daqui.
 * Hoje a implementação é mock (`lib/providers/mock/`). Trocar por Amadeus,
 * Sabre ou Booking significa escrever outra implementação destas interfaces e
 * mudar a fábrica em `lib/providers/index.ts` — nada além disso.
 *
 * Por isso os tipos descrevem o DOMÍNIO (o que é uma opção de voo), não o
 * formato de nenhum fornecedor específico.
 */

/* ------------------------------------------------------------------ Lugares */

export type Aeroporto = {
  iata: string;
  nome: string;
  cidade: string;
  pais: string;
  /** ISO 3166-1 alfa-2, usado pela consulta de documentação. */
  paisCodigo: string;
  lat: number;
  lon: number;
  moeda: string;
  /** Deslocamento em horas em relação a Brasília, para exibir chegadas. */
  fusoRelativo: number;
};

/* -------------------------------------------------------------------- Voos */

export type Cabine = "economica" | "premium" | "executiva" | "primeira";

export type Companhia = {
  codigo: string;
  nome: string;
  /** Percepção de serviço, de 1 a 5 — usada para explicar trade-offs. */
  conforto: number;
  pontualidade: number;
};

export type Trecho = {
  numeroVoo: string;
  companhia: Companhia;
  origem: string;
  destino: string;
  /** ISO local do aeroporto de origem. */
  partida: string;
  /** ISO local do aeroporto de destino. */
  chegada: string;
  duracaoMin: number;
  aeronave: string;
};

export type RegrasTarifarias = {
  fareId: string;
  nome: string;
  reembolsavel: boolean;
  remarcavel: boolean;
  multaRemarcacao: number;
  multaCancelamento: number;
  /** Horas antes da partida a partir das quais nada mais é permitido. */
  prazoLimiteHoras: number;
  bagagemDespachada: number;
  bagagemMaoKg: number;
  marcaAssento: boolean;
  acumulaMilhas: boolean;
};

export type OpcaoVoo = {
  id: string;
  origem: Aeroporto;
  destino: Aeroporto;
  ida: Trecho[];
  volta: Trecho[];
  paradas: number;
  /** Duração da ida, porta a porta, incluindo conexões. */
  duracaoIdaMin: number;
  /** Duração da volta; 0 quando é só ida. */
  duracaoVoltaMin: number;
  /** Soma das pernas — serve para ordenar, não para exibir. */
  duracaoTotalMin: number;
  cabine: Cabine;
  companhiaPrincipal: Companhia;
  precoPorPassageiro: number;
  precoTotal: number;
  taxas: number;
  moeda: string;
  assentosRestantes: number;
  tarifa: RegrasTarifarias;
  /** Ex.: "mais barato", "menos tempo em voo" — calculado na busca. */
  destaques: string[];
};

export type CriteriosDeVoo = {
  origem: string;
  destino: string;
  dataIda: string;
  dataVolta?: string;
  adultos: number;
  criancas?: number;
  bebes?: number;
  cabine?: Cabine;
  /** Busca também 3 dias antes e depois, e devolve o calendário de preços. */
  flexivel?: boolean;
  maxParadas?: number;
  companhiaPreferida?: string;
  ordenar?: "preco" | "duracao" | "partida" | "conforto";
  limite?: number;
};

export type DiaDePreco = { data: string; precoMinimo: number; ehMaisBarato: boolean };

export type ResultadoDeVoos = {
  opcoes: OpcaoVoo[];
  calendario: DiaDePreco[];
  /** Quantas opções existiam antes de aplicar filtros e limite. */
  totalEncontrado: number;
};

export interface ProvedorDeVoos {
  buscar(criterios: CriteriosDeVoo): Promise<ResultadoDeVoos>;
  /** Recupera uma opção pelo id para reservar sem refazer a busca. */
  porId(id: string): Promise<OpcaoVoo | null>;
}

/* ------------------------------------------------------------------ Hotéis */

export type FiltroDeHotel =
  | "cafe-da-manha"
  | "cancelamento-gratis"
  | "pet-friendly"
  | "piscina"
  | "academia"
  | "wi-fi-gratis"
  | "estacionamento"
  | "acessivel"
  | "ar-condicionado";

export type OpcaoHotel = {
  id: string;
  nome: string;
  bairro: string;
  cidade: string;
  estrelas: number;
  /** Nota de hóspedes, 0 a 10. */
  nota: number;
  avaliacoes: number;
  distanciaCentroKm: number;
  diaria: number;
  total: number;
  taxas: number;
  moeda: string;
  noites: number;
  quartos: number;
  tipoDeQuarto: string;
  comodidades: FiltroDeHotel[];
  cancelamentoGratisAte?: string;
  reembolsavel: boolean;
  quartosRestantes: number;
  destaques: string[];
};

export type CriteriosDeHotel = {
  cidade: string;
  checkIn: string;
  checkOut: string;
  hospedes: number;
  quartos?: number;
  precoMin?: number;
  precoMax?: number;
  estrelasMin?: number;
  filtros?: FiltroDeHotel[];
  ordenar?: "preco" | "nota" | "distancia" | "estrelas";
  limite?: number;
};

export type ResultadoDeHoteis = {
  opcoes: OpcaoHotel[];
  totalEncontrado: number;
  faixaDePreco: { minimo: number; maximo: number; mediana: number };
};

export interface ProvedorDeHoteis {
  buscar(criterios: CriteriosDeHotel): Promise<ResultadoDeHoteis>;
  porId(id: string): Promise<OpcaoHotel | null>;
}

/* --------------------------------------------------------------- Atividades */

export type Passeio = {
  id: string;
  nome: string;
  cidade: string;
  categoria: "cultura" | "natureza" | "gastronomia" | "aventura" | "familia" | "noite";
  duracaoHoras: number;
  preco: number;
  moeda: string;
  nota: number;
  incluiTransporte: boolean;
  idiomas: string[];
  descricao: string;
  /** Melhor período do dia para encaixar no roteiro. */
  periodo: "manha" | "tarde" | "noite" | "dia-inteiro";
};

export interface ProvedorDePasseios {
  buscar(criterios: {
    cidade: string;
    categoria?: Passeio["categoria"];
    precoMax?: number;
    limite?: number;
  }): Promise<Passeio[]>;
  porId(id: string): Promise<Passeio | null>;
}

/* ---------------------------------------------------------------- Transfers */

export type Transfer = {
  id: string;
  tipo: "transfer-privativo" | "transfer-compartilhado" | "aluguel-de-carro";
  fornecedor: string;
  descricao: string;
  origem: string;
  destino: string;
  preco: number;
  moeda: string;
  duracaoMin?: number;
  capacidade: number;
  bagagens: number;
  cancelamentoGratis: boolean;
  /** Só para aluguel de carro. */
  categoriaVeiculo?: string;
  diarias?: number;
};

export interface ProvedorDeTransfers {
  buscar(criterios: {
    cidade: string;
    tipo?: Transfer["tipo"];
    passageiros: number;
    dias?: number;
  }): Promise<Transfer[]>;
}

/* ------------------------------------------------------------------ Seguros */

export type PlanoDeSeguro = {
  id: string;
  nome: string;
  nivel: "essencial" | "completo" | "premium";
  precoTotal: number;
  precoPorDia: number;
  moeda: string;
  coberturas: { item: string; valor: string }[];
  /** Alguns destinos exigem cobertura mínima por acordo internacional. */
  atendeExigenciaLocal: boolean;
  observacao?: string;
};

export interface ProvedorDeSeguros {
  cotar(criterios: {
    destino: string;
    dias: number;
    viajantes: number;
    idadeMaxima?: number;
  }): Promise<PlanoDeSeguro[]>;
}

/* ------------------------------------------------------- Câmbio e custo médio */

export type Cotacao = {
  de: string;
  para: string;
  taxa: number;
  valorConvertido: number;
  atualizadoEm: string;
};

export type CustoMedio = {
  cidade: string;
  moeda: string;
  /** Valores diários por pessoa, em reais. */
  refeicaoSimples: number;
  refeicaoRestaurante: number;
  transportePublico: number;
  taxiPorKm: number;
  diariaMediaHotel: number;
  cafe: number;
  cerveja: number;
  /** Soma sugerida por dia, sem hospedagem. */
  diarioSugerido: number;
};

export interface ProvedorDeCambio {
  converter(de: string, para: string, valor: number): Promise<Cotacao>;
  custoMedio(cidade: string): Promise<CustoMedio | null>;
}

/* ------------------------------------------------------------ Documentação */

export type ExigenciaDeEntrada = {
  pais: string;
  paisCodigo: string;
  nacionalidade: string;
  passaporte: { obrigatorio: boolean; validadeMinimaMeses: number };
  visto: {
    necessario: boolean;
    tipo?: string;
    observacao?: string;
    prazoEstimadoDias?: number;
  };
  vacinas: { nome: string; obrigatoria: boolean; observacao?: string }[];
  permanenciaMaximaDias?: number;
  comprovantes: string[];
  observacoes: string[];
};

export interface ProvedorDeDocumentacao {
  consultar(criterios: {
    destino: string;
    nacionalidade?: string;
  }): Promise<ExigenciaDeEntrada | null>;
}

/* ----------------------------------------------------------------- Catálogo */

export interface ProvedorDeLugares {
  /** Resolve "são paulo", "sao paulo", "GRU", "Sao Paulo/SP" no mesmo aeroporto. */
  resolver(termo: string): Aeroporto | null;
  todos(): Aeroporto[];
}
