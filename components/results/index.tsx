"use client";

import { AlertTriangle } from "lucide-react";
import { ListaDeVoos } from "./lista-voos";
import { CartaoHotel } from "./cartao-hotel";
import { CartaoPacote } from "./cartao-pacote";
import { TimelineRoteiro } from "./roteiro";
import { dataCurta } from "@/lib/utils";
import { brl } from "@/lib/utils";

/**
 * Roteador de resultados: transforma a saída de uma tool no componente certo.
 *
 * O contrato é o campo `kind`, definido em `lib/ai/tools/comum.ts`. Uma tool que
 * devolve um `kind` sem componente cai no fallback — que mostra o dado cru em
 * vez de sumir, para que o problema apareça durante o desenvolvimento.
 */
export function ResultadoDeFerramenta({ saida }: { saida: unknown }) {
  if (!saida || typeof saida !== "object") return null;
  const dados = saida as Record<string, any>;

  if (dados.ok === false) {
    return <FalhaDeFerramenta erro={dados.erro} sugestao={dados.sugestao} />;
  }

  switch (dados.kind) {
    case "voos":
      return (
        <ListaDeVoos
          busca={dados.busca}
          opcoes={dados.opcoes}
          calendario={dados.calendario ?? []}
          totalEncontrado={dados.totalEncontrado}
        />
      );

    case "hoteis":
      return (
        <section className="space-y-3" aria-label="Opções de hotel">
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="font-display text-[17px] font-semibold">
              Hotéis em {dados.busca.cidade}
            </h3>
            <p className="text-[12px] text-tinta-2">
              {dataCurta(dados.busca.checkIn)} – {dataCurta(dados.busca.checkOut)} ·{" "}
              {dados.busca.noites} noite{dados.busca.noites > 1 ? "s" : ""} ·{" "}
              {dados.busca.hospedes} hóspede{dados.busca.hospedes > 1 ? "s" : ""}
            </p>
            <p className="ml-auto text-[12px] text-tinta-3">
              diárias de {brl(dados.faixaDePreco.minimo)} a {brl(dados.faixaDePreco.maximo)}
            </p>
          </header>

          <div className="space-y-2.5">
            {dados.opcoes.map((hotel: any) => (
              <CartaoHotel key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>
      );

    case "pacote":
      return (
        <CartaoPacote
          voo={dados.voo}
          hotel={dados.hotel}
          passageiros={dados.passageiros}
          totalVoo={dados.totalVoo}
          totalHotel={dados.totalHotel}
          totalSeparado={dados.totalSeparado}
          total={dados.total}
          economia={dados.economia}
          percentualEconomia={dados.percentualEconomia}
        />
      );

    case "roteiro":
      return (
        <TimelineRoteiro
          destino={dados.destino}
          dias={dados.dias}
          roteiro={dados.roteiro}
          custoEstimadoTotal={dados.custoEstimadoTotal}
          observacao={dados.observacao}
        />
      );

    default:
      return <SemComponente kind={String(dados.kind ?? "desconhecido")} dados={dados} />;
  }
}

/** Falha de tool: o que houve e o que fazer, nunca um card vazio. */
export function FalhaDeFerramenta({
  erro,
  sugestao,
}: {
  erro: string;
  sugestao?: string;
}) {
  return (
    <div
      role="status"
      className="flex gap-2.5 rounded-[4px] border border-lacre/30 bg-lacre-fosco p-3"
    >
      <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-lacre" />
      <div className="min-w-0 text-[13px]">
        <p className="font-medium text-lacre">{erro}</p>
        {sugestao ? <p className="mt-0.5 text-tinta-2">{sugestao}</p> : null}
      </div>
    </div>
  );
}

function SemComponente({ kind, dados }: { kind: string; dados: unknown }) {
  return (
    <details className="rounded-[4px] border border-dashed border-linha-forte bg-papel-2 p-3 text-[12px]">
      <summary className="cursor-pointer text-tinta-2">
        Resultado sem componente: <span className="codigo">{kind}</span>
      </summary>
      <pre className="mt-2 overflow-x-auto text-[11px] text-tinta-3">
        {JSON.stringify(dados, null, 2)}
      </pre>
    </details>
  );
}
