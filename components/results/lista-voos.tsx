"use client";

import { CalendarRange } from "lucide-react";
import type { DiaDePreco, OpcaoVoo, Aeroporto, Cabine } from "@/lib/providers/types";
import { brl, cn } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { CartaoVoo } from "./cartao-voo";
import { useAcoes } from "@/components/chat/acoes";

/**
 * Resultado completo de `buscarVoos`: cabeçalho da busca, calendário flexível
 * e a lista de bilhetes.
 */
export function ListaDeVoos({
  busca,
  opcoes,
  calendario,
  totalEncontrado,
}: {
  busca: {
    origem: Aeroporto;
    destino: Aeroporto;
    dataIda: string;
    dataVolta?: string;
    passageiros: number;
    cabine: Cabine;
  };
  opcoes: OpcaoVoo[];
  calendario: DiaDePreco[];
  totalEncontrado: number;
}) {
  return (
    <section className="space-y-3" aria-label="Opções de voo">
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="flex items-center gap-2 font-display text-[17px] font-semibold">
          <span className="codigo text-[15px]">{busca.origem.iata}</span>
          <span aria-hidden className="text-tinta-3">
            →
          </span>
          <span className="codigo text-[15px]">{busca.destino.iata}</span>
        </h3>
        <p className="text-[12px] text-tinta-2">
          {busca.origem.cidade} para {busca.destino.cidade} · {dataCurta(busca.dataIda)}
          {busca.dataVolta ? ` – ${dataCurta(busca.dataVolta)}` : " (só ida)"} ·{" "}
          {busca.passageiros} passageiro{busca.passageiros > 1 ? "s" : ""}
        </p>
        <p className="ml-auto text-[12px] text-tinta-3">
          {opcoes.length} de {totalEncontrado}
        </p>
      </header>

      {calendario.length > 0 ? <Calendario dias={calendario} atual={busca.dataIda} /> : null}

      <div className="space-y-2.5">
        {opcoes.map((voo) => (
          <CartaoVoo key={voo.id} voo={voo} passageiros={busca.passageiros} />
        ))}
      </div>
    </section>
  );
}

/** Calendário de preços — as barras mostram onde vale a pena mudar a data. */
function Calendario({ dias, atual }: { dias: DiaDePreco[]; atual: string }) {
  const { perguntar, ocupado } = useAcoes();
  const maximo = Math.max(...dias.map((d) => d.precoMinimo));
  const minimo = Math.min(...dias.map((d) => d.precoMinimo));

  return (
    <div className="rounded-[4px] border border-linha bg-papel p-3">
      <p className="rotulo mb-2 flex items-center gap-1.5">
        <CalendarRange size={12} aria-hidden />
        Preço por dia de saída
      </p>

      <ul className="flex items-end gap-1.5">
        {dias.map((dia) => {
          const altura = 18 + ((dia.precoMinimo - minimo) / Math.max(1, maximo - minimo)) * 30;
          const ehAtual = dia.data === atual;

          return (
            <li key={dia.data} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                data-valor
                className={cn(
                  "text-[10px] tabular-nums",
                  dia.ehMaisBarato ? "font-semibold text-eixo" : "text-tinta-3",
                )}
              >
                {brl(dia.precoMinimo)}
              </span>
              <button
                type="button"
                disabled={ocupado || ehAtual}
                onClick={() => perguntar(`E se eu sair no dia ${dataCurta(dia.data)}?`)}
                aria-label={`Buscar saindo em ${dataCurta(dia.data)} por ${brl(dia.precoMinimo)}`}
                className={cn(
                  "w-full rounded-[2px] transition-colors disabled:cursor-default",
                  dia.ehMaisBarato
                    ? "bg-eixo"
                    : ehAtual
                      ? "bg-noite"
                      : "bg-linha-forte hover:bg-taxiway",
                )}
                style={{ height: `${altura}px` }}
              />
              <span
                className={cn(
                  "text-[10px]",
                  ehAtual ? "font-semibold text-noite" : "text-tinta-3",
                )}
              >
                {dataCurta(dia.data)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
