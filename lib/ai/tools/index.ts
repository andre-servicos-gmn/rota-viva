import { buscarVoos, buscarHoteis, montarPacote, montarRoteiro } from "./busca";

/**
 * Registro das tools do agente.
 *
 * A ordem aqui é a ordem em que o modelo as vê. Tools de busca vêm primeiro
 * porque são as mais usadas; as de consequência (reservar, cancelar) ficam
 * depois, junto do protocolo de confirmação que as protege.
 */
export const ferramentas = {
  buscarVoos,
  buscarHoteis,
  montarPacote,
  montarRoteiro,
};

export type Ferramentas = typeof ferramentas;
