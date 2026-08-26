import { buscarVoos, buscarHoteis, montarPacote, montarRoteiro } from "./busca";
import {
  alterarReserva,
  cancelarReserva,
  consultarReserva,
  criarReserva,
  politicaTarifaria,
} from "./reservas";
import { abrirChamado, consultarDocumentacao, escalarParaHumano, faq } from "./suporte";
import {
  alertaDePreco,
  buscarPasseios,
  buscarTransfer,
  converterMoeda,
  cotarSeguroViagem,
  custoMedioDestino,
  perfilViajante,
  simularParcelamento,
} from "./extras";

/**
 * Registro das 19 tools do agente.
 *
 * A ordem é a ordem em que o modelo as vê: busca primeiro, porque é o que mais
 * se usa; depois reserva e pós-venda; por fim suporte e complementos. Tools com
 * consequência (criar, alterar, cancelar) carregam o protocolo de confirmação
 * no próprio schema — ver `comum.ts`.
 */
export const ferramentas = {
  // Núcleo
  buscarVoos,
  buscarHoteis,
  montarPacote,
  montarRoteiro,

  // Reserva e pós-venda
  criarReserva,
  consultarReserva,
  alterarReserva,
  cancelarReserva,
  politicaTarifaria,

  // Suporte e conhecimento
  consultarDocumentacao,
  faq,
  abrirChamado,
  escalarParaHumano,

  // Complementos
  cotarSeguroViagem,
  buscarTransfer,
  buscarPasseios,
  simularParcelamento,
  converterMoeda,
  custoMedioDestino,
  alertaDePreco,
  perfilViajante,
};

export type Ferramentas = typeof ferramentas;
export type NomeDeFerramenta = keyof Ferramentas;
