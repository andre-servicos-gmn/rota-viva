import type {
  ProvedorDeCambio,
  ProvedorDeDocumentacao,
  ProvedorDeHoteis,
  ProvedorDePasseios,
  ProvedorDeSeguros,
  ProvedorDeTransfers,
  ProvedorDeVoos,
} from "./types";
import { provedorDeVoosMock } from "./mock/voos";
import { provedorDeHoteisMock } from "./mock/hoteis";
import { provedorDeDocumentacaoMock } from "./mock/documentacao";
import {
  provedorDeCambioMock,
  provedorDePasseiosMock,
  provedorDeSegurosMock,
  provedorDeTransfersMock,
} from "./mock/extras";

/**
 * Fábrica de provedores — o único lugar do app que decide de onde vêm os dados.
 *
 * Para ligar um fornecedor real, escreva a implementação (por exemplo
 * `lib/providers/amadeus/voos.ts` cumprindo `ProvedorDeVoos`) e troque a linha
 * correspondente aqui. Nenhuma tool, rota ou componente precisa mudar, porque
 * ninguém além deste arquivo importa uma implementação concreta.
 *
 * Um passo além seria escolher por variável de ambiente:
 *   voos: process.env.AMADEUS_API_KEY ? provedorDeVoosAmadeus : provedorDeVoosMock
 * Deixei explícito de propósito: numa POC, esconder qual fonte está ativa atrás
 * de uma env var só cria dúvida sobre o que está sendo demonstrado.
 */
export const provedores = {
  voos: provedorDeVoosMock satisfies ProvedorDeVoos,
  hoteis: provedorDeHoteisMock satisfies ProvedorDeHoteis,
  passeios: provedorDePasseiosMock satisfies ProvedorDePasseios,
  transfers: provedorDeTransfersMock satisfies ProvedorDeTransfers,
  seguros: provedorDeSegurosMock satisfies ProvedorDeSeguros,
  cambio: provedorDeCambioMock satisfies ProvedorDeCambio,
  documentacao: provedorDeDocumentacaoMock satisfies ProvedorDeDocumentacao,
};

/** Verdadeiro enquanto tudo vier de mock — a UI usa isto para avisar o usuário. */
export const TUDO_MOCKADO = true;

export * from "./types";
