import { db } from "@/lib/db";
import type { OpcaoHotel, OpcaoVoo, RegrasTarifarias } from "@/lib/providers/types";
import { HOJE_ISO, diferencaEmDias } from "@/lib/datas";

/**
 * Reservas: emissão, consulta, alteração e cancelamento.
 *
 * As regras de multa vivem aqui, não nas tools — assim a tela de "Minhas
 * reservas" e o agente aplicam exatamente a mesma política, e uma mudança de
 * regra acontece num lugar só.
 */

export type Passageiro = {
  nome: string;
  documento?: string;
  nascimento?: string;
};

export type SnapshotReserva = {
  voo?: OpcaoVoo;
  hotel?: OpcaoHotel;
  passageiros: Passageiro[];
  contato: { email: string; telefone?: string };
  extras?: { descricao: string; valor: number }[];
};

/** Sem 0/O e 1/I: localizador é lido em voz alta por telefone. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarLocalizador() {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return `RV-${codigo}`;
}

export function gerarNumeroDeChamado() {
  return `CH-${String(Date.now()).slice(-6)}`;
}

/* --------------------------------------------------------------- Políticas */

export type Politica = {
  podeAlterar: boolean;
  podeCancelar: boolean;
  multaAlteracao: number;
  multaCancelamento: number;
  valorReembolsado: number;
  reembolsavel: boolean;
  motivo: string;
  horasParaEmbarque: number | null;
};

/**
 * Aplica a regra da tarifa a uma reserva concreta.
 *
 * Três coisas decidem: a família tarifária comprada, o prazo até o embarque e o
 * tempo desde a emissão (arrependimento de 24 h, previsto no Código de Defesa do
 * Consumidor para compras a distância feitas com 7 dias ou mais de antecedência).
 */
export function calcularPolitica(
  regras: RegrasTarifarias,
  total: number,
  dataDaPartida: string | undefined,
  emitidaEm: Date,
): Politica {
  const horasDesdeEmissao = (Date.now() - emitidaEm.getTime()) / 3_600_000;
  const diasAtePartida = dataDaPartida
    ? diferencaEmDias(HOJE_ISO(), dataDaPartida.slice(0, 10))
    : null;
  const horasParaEmbarque = diasAtePartida !== null ? diasAtePartida * 24 : null;

  // Arrependimento: devolve tudo, sem multa.
  if (horasDesdeEmissao <= 24 && (diasAtePartida === null || diasAtePartida >= 7)) {
    return {
      podeAlterar: true,
      podeCancelar: true,
      multaAlteracao: 0,
      multaCancelamento: 0,
      valorReembolsado: total,
      reembolsavel: true,
      motivo:
        "Dentro das 24 horas de arrependimento: cancelamento sem multa, com devolução integral.",
      horasParaEmbarque,
    };
  }

  if (horasParaEmbarque !== null && horasParaEmbarque < regras.prazoLimiteHoras) {
    return {
      podeAlterar: false,
      podeCancelar: false,
      multaAlteracao: 0,
      multaCancelamento: 0,
      valorReembolsado: 0,
      reembolsavel: false,
      motivo: `A tarifa ${regras.nome} não permite mudanças a menos de ${regras.prazoLimiteHoras} h do embarque. Nesse prazo, só a companhia no aeroporto pode ajudar.`,
      horasParaEmbarque,
    };
  }

  const multaCancelamento = regras.reembolsavel ? regras.multaCancelamento : total;
  const reembolso = Math.max(0, total - multaCancelamento);

  return {
    podeAlterar: regras.remarcavel,
    podeCancelar: true,
    multaAlteracao: regras.multaRemarcacao,
    multaCancelamento,
    valorReembolsado: reembolso,
    reembolsavel: regras.reembolsavel,
    motivo: regras.reembolsavel
      ? `Tarifa ${regras.nome}: cancelamento com multa de R$ ${regras.multaCancelamento}, o restante volta em até 30 dias.`
      : `Tarifa ${regras.nome}: não reembolsável. Cancelar libera o assento, mas não devolve o valor pago.`,
    horasParaEmbarque,
  };
}

/* ------------------------------------------------------------- Persistência */

export async function criarReserva(dados: {
  travelerId: string;
  tipo: "FLIGHT" | "HOTEL" | "PACKAGE";
  snapshot: SnapshotReserva;
  total: number;
  fareId?: string;
  fareRules: RegrasTarifarias | Record<string, never>;
}) {
  const localizador = gerarLocalizador();

  const reserva = await db.booking.create({
    data: {
      localizador,
      tipo: dados.tipo,
      status: "CONFIRMED",
      travelerId: dados.travelerId,
      snapshot: JSON.stringify(dados.snapshot),
      total: dados.total,
      moeda: "BRL",
      fareId: dados.fareId,
      fareRules: JSON.stringify(dados.fareRules),
      eventos: {
        create: {
          tipo: "CREATED",
          detalhes: JSON.stringify({ total: dados.total }),
        },
      },
    },
    include: { eventos: true, traveler: true },
  });

  return reserva;
}

export async function buscarPorLocalizador(localizador: string) {
  return db.booking.findUnique({
    where: { localizador: localizador.toUpperCase().trim() },
    include: { eventos: { orderBy: { criadoEm: "asc" } }, traveler: true },
  });
}

export async function listarPorEmail(email: string) {
  return db.booking.findMany({
    where: { traveler: { email: email.toLowerCase().trim() } },
    orderBy: { criadaEm: "desc" },
    include: { eventos: true, traveler: true },
  });
}

export async function listarDoViajante(travelerId: string) {
  return db.booking.findMany({
    where: { travelerId },
    orderBy: { criadaEm: "desc" },
    include: { eventos: { orderBy: { criadoEm: "asc" } }, traveler: true },
  });
}

export async function registrarCancelamento(bookingId: string, multa: number, reembolso: number) {
  return db.$transaction([
    db.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } }),
    db.bookingEvent.create({
      data: {
        bookingId,
        tipo: "CANCELLED",
        multa,
        detalhes: JSON.stringify({ reembolso }),
      },
    }),
  ]);
}

export async function registrarAlteracao(
  bookingId: string,
  multa: number,
  diferenca: number,
  detalhes: Record<string, unknown>,
) {
  return db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: "CHANGED", total: { increment: multa + diferenca } },
    }),
    db.bookingEvent.create({
      data: {
        bookingId,
        tipo: "CHANGED",
        multa,
        diferenca,
        detalhes: JSON.stringify(detalhes),
      },
    }),
  ]);
}

/* ------------------------------------------------------------------ Leitura */

export type ReservaCompleta = Awaited<ReturnType<typeof buscarPorLocalizador>>;

/** Desserializa uma reserva do banco para uso na UI e nas tools. */
export function lerReserva(reserva: NonNullable<ReservaCompleta>) {
  const snapshot = JSON.parse(reserva.snapshot) as SnapshotReserva;
  const regras = JSON.parse(reserva.fareRules) as RegrasTarifarias;

  const partida = snapshot.voo?.ida[0]?.partida;
  const entrada = snapshot.hotel ? `${snapshot.hotel.id.split("~")[2]}` : undefined;

  return {
    id: reserva.id,
    localizador: reserva.localizador,
    tipo: reserva.tipo as "FLIGHT" | "HOTEL" | "PACKAGE",
    status: reserva.status as "CONFIRMED" | "CHANGED" | "CANCELLED",
    total: reserva.total,
    moeda: reserva.moeda,
    criadaEm: reserva.criadaEm,
    snapshot,
    regras,
    /** Primeira data relevante da viagem — usada para prazo de multa. */
    dataDeInicio: partida ?? entrada,
    viajante: {
      nome: reserva.traveler.nome,
      email: reserva.traveler.email,
    },
    eventos: reserva.eventos.map((e) => ({
      tipo: e.tipo,
      multa: e.multa,
      diferenca: e.diferenca,
      criadoEm: e.criadoEm,
      detalhes: JSON.parse(e.detalhes) as Record<string, unknown>,
    })),
  };
}

export type Reserva = ReturnType<typeof lerReserva>;
