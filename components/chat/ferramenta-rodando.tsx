"use client";

import { Esqueleto } from "@/components/ui/feedback";

/**
 * Indicador de tool em execução.
 *
 * Diz o que está acontecendo em português — "buscando voos de GRU para LIS" — em
 * vez do nome técnico da função. Quando dá para saber, mostra os parâmetros:
 * é assim que o usuário percebe que o agente entendeu o pedido antes mesmo do
 * resultado chegar.
 */

const ROTULOS: Record<string, string> = {
  buscarVoos: "Buscando voos",
  buscarHoteis: "Buscando hotéis",
  montarPacote: "Montando o pacote",
  montarRoteiro: "Montando o roteiro",
  criarReserva: "Emitindo a reserva",
  consultarReserva: "Procurando a reserva",
  alterarReserva: "Calculando a alteração",
  cancelarReserva: "Calculando o cancelamento",
  politicaTarifaria: "Lendo as regras da tarifa",
  consultarDocumentacao: "Consultando exigências de entrada",
  faq: "Procurando na base de ajuda",
  abrirChamado: "Abrindo o chamado",
  escalarParaHumano: "Chamando um atendente",
  cotarSeguroViagem: "Cotando o seguro",
  buscarTransfer: "Buscando transfers",
  buscarPasseios: "Buscando passeios",
  simularParcelamento: "Simulando o parcelamento",
  converterMoeda: "Convertendo a moeda",
  custoMedioDestino: "Levantando o custo médio",
  alertaDePreco: "Configurando o alerta",
  perfilViajante: "Lendo seu perfil",
};

function detalhar(nome: string, entrada: unknown): string | null {
  if (!entrada || typeof entrada !== "object") return null;
  const e = entrada as Record<string, any>;

  switch (nome) {
    case "buscarVoos":
      return e.origem && e.destino ? `${e.origem} → ${e.destino}` : null;
    case "buscarHoteis":
      return e.cidade ?? null;
    case "montarRoteiro":
      return e.destino ? `${e.destino}, ${e.dias ?? "?"} dias` : null;
    case "buscarPasseios":
    case "buscarTransfer":
    case "custoMedioDestino":
      return e.cidade ?? e.destino ?? null;
    case "consultarDocumentacao":
      return e.destino ?? null;
    case "consultarReserva":
      return e.localizador ?? e.email ?? null;
    case "cancelarReserva":
    case "alterarReserva":
      return e.localizador ?? null;
    case "faq":
      return e.pergunta ? `"${String(e.pergunta).slice(0, 40)}"` : null;
    default:
      return null;
  }
}

export function FerramentaRodando({
  nome,
  entrada,
}: {
  nome: string;
  entrada: unknown;
}) {
  const rotulo = ROTULOS[nome] ?? "Trabalhando";
  const detalhe = detalhar(nome, entrada);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[4px] border border-linha bg-papel-2 p-3"
    >
      <p className="flex items-center gap-2 text-[13px] text-tinta-2">
        <span aria-hidden className="anim-pulso h-1.5 w-1.5 shrink-0 rounded-full bg-pista" />
        <span>
          {rotulo}
          {detalhe ? (
            <>
              {" "}
              <span className="codigo text-[12px] text-noite">{detalhe}</span>
            </>
          ) : null}
          …
        </span>
      </p>

      {/* Esqueleto com a silhueta do bilhete, para a troca não dar solavanco. */}
      <div className="mt-2.5 flex gap-2" aria-hidden>
        <div className="flex-1 space-y-1.5">
          <Esqueleto className="h-3 w-1/3" />
          <Esqueleto className="h-6 w-full" />
        </div>
        <Esqueleto className="h-[52px] w-[92px]" />
      </div>
    </div>
  );
}
