import type { Companhia, RegrasTarifarias } from "@/lib/providers/types";

/**
 * Companhias fictícias.
 *
 * Nenhuma marca real aparece na POC — nem de companhia, nem de hotel, nem de
 * operadora. O que interessa para a demo é o contraste entre elas: uma barata e
 * apertada, uma cara e confortável, uma regional.
 */
export const COMPANHIAS: Companhia[] = [
  { codigo: "AU", nome: "Aurora Linhas Aéreas", conforto: 4, pontualidade: 4 },
  { codigo: "CD", nome: "Cordilheira", conforto: 3, pontualidade: 5 },
  { codigo: "AT", nome: "Atlântico Air", conforto: 5, pontualidade: 3 },
  { codigo: "PM", nome: "Pampa Express", conforto: 2, pontualidade: 4 },
  { codigo: "MR", nome: "Meridiano", conforto: 4, pontualidade: 3 },
  { codigo: "SL", nome: "Solaris", conforto: 3, pontualidade: 4 },
  { codigo: "VN", nome: "Ventania", conforto: 2, pontualidade: 3 },
];

/** Companhias que operam rotas longas — as regionais ficam no continente. */
export const COMPANHIAS_LONGO_CURSO = COMPANHIAS.filter((c) =>
  ["AU", "AT", "MR", "CD"].includes(c.codigo),
);

export const AERONAVES_CURTAS = ["Embraer 195", "Airbus A320", "Boeing 737-800"];
export const AERONAVES_LONGAS = ["Boeing 787-9", "Airbus A350-900", "Airbus A330-200"];

/**
 * Famílias tarifárias.
 *
 * É daqui que saem as regras que o pós-venda aplica: quem comprou Leve paga
 * caro para remarcar e não recebe reembolso. A tool `politicaTarifaria` traduz
 * isto para linguagem comum, e `cancelarReserva` calcula a multa a partir daqui.
 */
export const FAMILIAS_TARIFARIAS: Omit<RegrasTarifarias, "fareId">[] = [
  {
    nome: "Leve",
    reembolsavel: false,
    remarcavel: true,
    multaRemarcacao: 380,
    multaCancelamento: 0, // sem reembolso: cancelar não devolve nada
    prazoLimiteHoras: 24,
    bagagemDespachada: 0,
    bagagemMaoKg: 10,
    marcaAssento: false,
    acumulaMilhas: false,
  },
  {
    nome: "Plus",
    reembolsavel: true,
    remarcavel: true,
    multaRemarcacao: 180,
    multaCancelamento: 420,
    prazoLimiteHoras: 12,
    bagagemDespachada: 1,
    bagagemMaoKg: 10,
    marcaAssento: true,
    acumulaMilhas: true,
  },
  {
    nome: "Flex",
    reembolsavel: true,
    remarcavel: true,
    multaRemarcacao: 0,
    multaCancelamento: 120,
    prazoLimiteHoras: 3,
    bagagemDespachada: 2,
    bagagemMaoKg: 12,
    marcaAssento: true,
    acumulaMilhas: true,
  },
];

/** Quanto cada família encarece a tarifa base. */
export const MULTIPLICADOR_TARIFA: Record<string, number> = {
  Leve: 1,
  Plus: 1.12,
  Flex: 1.31,
};

export const MULTIPLICADOR_CABINE: Record<string, number> = {
  economica: 1,
  premium: 1.75,
  executiva: 3.1,
  primeira: 5.2,
};

export const NOME_CABINE: Record<string, string> = {
  economica: "Econômica",
  premium: "Econômica premium",
  executiva: "Executiva",
  primeira: "Primeira classe",
};
