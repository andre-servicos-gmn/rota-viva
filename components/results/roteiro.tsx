"use client";

import { Clock, Footprints, MapPin, Utensils } from "lucide-react";
import { brl, cn } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";

export type BlocoRoteiro = {
  periodo: "manha" | "tarde" | "noite";
  horario: string;
  titulo: string;
  descricao: string;
  duracaoHoras?: number;
  preco?: number;
  deslocamentoMin?: number;
  tipo: "passeio" | "refeicao" | "livre" | "deslocamento";
};

export type DiaRoteiro = {
  numero: number;
  data: string;
  blocos: BlocoRoteiro[];
  custoEstimado: number;
};

const PERIODOS: Record<BlocoRoteiro["periodo"], string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

/**
 * Roteiro em linha do tempo.
 *
 * O fio vertical pontilhado é o mesmo traço da rota no bilhete — a viagem
 * continua sendo desenhada como um percurso, não como uma lista.
 */
export function TimelineRoteiro({
  destino,
  dias,
  roteiro,
  custoEstimadoTotal,
  observacao,
  compacto = false,
}: {
  destino: string;
  dias: number;
  roteiro: DiaRoteiro[];
  custoEstimadoTotal: number;
  observacao?: string;
  compacto?: boolean;
}) {
  return (
    <section className="space-y-3" aria-label={`Roteiro de ${dias} dias em ${destino}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-[17px] font-semibold">
          {dias} dias em {destino}
        </h3>
        <p className="text-[12px] text-tinta-2">
          <span data-valor className="font-medium text-noite">
            {brl(custoEstimadoTotal)}
          </span>{" "}
          por pessoa em passeios e refeições
        </p>
      </header>

      <ol className="space-y-2.5">
        {roteiro.map((dia) => (
          <li key={dia.numero}>
            <Dia dia={dia} compacto={compacto} />
          </li>
        ))}
      </ol>

      {observacao ? (
        <p className="text-[11px] leading-snug text-tinta-3">{observacao}</p>
      ) : null}
    </section>
  );
}

function Dia({ dia, compacto }: { dia: DiaRoteiro; compacto: boolean }) {
  return (
    <article className="rounded-[4px] border border-linha bg-papel">
      <header className="flex items-baseline justify-between gap-2 border-b border-linha px-3.5 py-2.5">
        <h4 className="flex items-baseline gap-2">
          <span className="codigo rounded-[2px] bg-noite px-1.5 py-0.5 text-[11px] text-pista">
            DIA {String(dia.numero).padStart(2, "0")}
          </span>
          {dia.data ? (
            <span className="text-[12px] text-tinta-2">{dataCurta(dia.data)}</span>
          ) : null}
        </h4>
        <span data-valor className="text-[12px] text-tinta-2">
          {brl(dia.custoEstimado)}
        </span>
      </header>

      <ol className="px-3.5 py-3">
        {dia.blocos.map((bloco, i) => (
          <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
            {/* Fio da linha do tempo — some no último bloco. */}
            {i < dia.blocos.length - 1 ? (
              <span
                aria-hidden
                className="absolute bottom-0 left-[7px] top-5 w-px bg-[repeating-linear-gradient(to_bottom,var(--color-linha-forte)_0_3px,transparent_3px_7px)]"
              />
            ) : null}

            <span
              aria-hidden
              className={cn(
                "mt-1 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 bg-papel",
                bloco.tipo === "passeio"
                  ? "border-taxiway"
                  : bloco.tipo === "refeicao"
                    ? "border-pista"
                    : "border-linha-forte",
              )}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span data-valor className="codigo text-[12px] text-tinta-2">
                  {bloco.horario}
                </span>
                <span className="rotulo">{PERIODOS[bloco.periodo]}</span>
              </div>

              <p className="mt-0.5 flex items-center gap-1.5 text-[14px] font-medium leading-snug">
                {bloco.tipo === "refeicao" ? (
                  <Utensils size={13} aria-hidden className="shrink-0 text-tinta-3" />
                ) : bloco.tipo === "passeio" ? (
                  <MapPin size={13} aria-hidden className="shrink-0 text-tinta-3" />
                ) : null}
                {bloco.titulo}
              </p>

              {!compacto ? (
                <p className="mt-0.5 text-[13px] leading-snug text-tinta-2">
                  {bloco.descricao}
                </p>
              ) : null}

              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-tinta-3">
                {bloco.duracaoHoras ? (
                  <span className="flex items-center gap-1">
                    <Clock size={11} aria-hidden />
                    {bloco.duracaoHoras}h
                  </span>
                ) : null}
                {bloco.deslocamentoMin ? (
                  <span className="flex items-center gap-1">
                    <Footprints size={11} aria-hidden />
                    {bloco.deslocamentoMin} min até lá
                  </span>
                ) : null}
                {bloco.preco ? <span data-valor>{brl(bloco.preco)}</span> : null}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
