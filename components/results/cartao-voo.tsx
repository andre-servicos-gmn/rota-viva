"use client";

import { Luggage, Plane, Star, Heart } from "lucide-react";
import type { OpcaoVoo, Trecho } from "@/lib/providers/types";
import { brl, cn, duracao } from "@/lib/utils";
import { dataPorExtenso, hora, viradaDeDia } from "@/lib/datas";
import { NOME_CABINE } from "@/lib/providers/mock/data/companhias";
import { Button } from "@/components/ui/button";
import { Etiqueta } from "@/components/ui/feedback";
import { useAcoes } from "@/components/chat/acoes";

/**
 * O bilhete — elemento assinatura da interface.
 *
 * Corpo à esquerda com a rota, canhoto à direita com o preço, separados por uma
 * perfuração real (ver `.bilhete` em globals.css). O mesmo desenho reaparece na
 * lista de reservas, no comparador e no voucher em PDF: é o que dá unidade ao
 * produto inteiro. Toda a ousadia visual do projeto mora aqui.
 */
export function CartaoVoo({
  voo,
  passageiros = 1,
  compacto = false,
}: {
  voo: OpcaoVoo;
  passageiros?: number;
  compacto?: boolean;
}) {
  const { perguntar, favoritar, favoritados, ocupado } = useAcoes();
  const favoritado = favoritados.has(voo.id);

  return (
    <article className="bilhete anim-entrada">
      {/* -------------------------------------------------------- corpo */}
      <div className="min-w-0 p-3.5 sm:p-4">
        <header className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="codigo rounded-[2px] bg-noite px-1.5 py-0.5 text-[11px] text-nevoa">
            {voo.companhiaPrincipal.codigo}
          </span>
          <span className="text-[13px] font-medium">{voo.companhiaPrincipal.nome}</span>
          <span className="rotulo">{NOME_CABINE[voo.cabine] ?? voo.cabine}</span>

          <div className="ml-auto flex flex-wrap items-center gap-1">
            {!compacto ? (
              <button
                type="button"
                aria-pressed={favoritado}
                aria-label={favoritado ? "Remover da comparação" : "Comparar este voo"}
                title={favoritado ? "Remover da comparação" : "Comparar este voo"}
                onClick={() => favoritar({ tipo: "FLIGHT", refId: voo.id, snapshot: voo })}
                className={cn(
                  "order-last rounded-[2px] p-1 transition-colors hover:bg-nevoa",
                  favoritado ? "text-lacre" : "text-tinta-3",
                )}
              >
                <Heart size={14} aria-hidden fill={favoritado ? "currentColor" : "none"} />
              </button>
            ) : null}
            {voo.destaques.map((destaque) => (
              <Etiqueta
                key={destaque}
                tom={
                  destaque === "mais barato"
                    ? "eixo"
                    : destaque === "poucos assentos"
                      ? "lacre"
                      : destaque === "sem escalas"
                        ? "taxiway"
                        : "pista"
                }
              >
                {destaque}
              </Etiqueta>
            ))}
          </div>
        </header>

        <Perna trechos={voo.ida} rotulo="Ida" duracaoMin={voo.duracaoIdaMin} />

        {voo.volta.length > 0 ? (
          <>
            <div aria-hidden className="my-3 border-t border-dashed border-linha" />
            <Perna trechos={voo.volta} rotulo="Volta" duracaoMin={voo.duracaoVoltaMin} />
          </>
        ) : null}

        {!compacto ? (
          <footer className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-linha pt-3 text-[12px] text-tinta-2">
            <span className="flex items-center gap-1.5">
              <Luggage size={13} aria-hidden />
              {voo.tarifa.bagagemDespachada === 0
                ? `Só bagagem de mão (${voo.tarifa.bagagemMaoKg} kg)`
                : `${voo.tarifa.bagagemDespachada} despachada${voo.tarifa.bagagemDespachada > 1 ? "s" : ""} + ${voo.tarifa.bagagemMaoKg} kg de mão`}
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={13} aria-hidden />
              Tarifa {voo.tarifa.nome}
              {voo.tarifa.reembolsavel ? " · reembolsável" : " · não reembolsável"}
            </span>
            {voo.assentosRestantes <= 4 ? (
              <span className="text-lacre">
                {voo.assentosRestantes} assento{voo.assentosRestantes > 1 ? "s" : ""} nesta tarifa
              </span>
            ) : null}
          </footer>
        ) : null}
      </div>

      {/* --------------------------------------------------- perfuração */}
      <div aria-hidden className="bilhete__picote" />

      {/* ------------------------------------------------------ canhoto */}
      <div className="bilhete__canhoto w-[124px] shrink-0 sm:w-[140px]">
        <span className="bilhete__vertical hidden sm:block" aria-hidden>
          {voo.origem.iata} · {voo.destino.iata}
        </span>

        <div className="flex w-full flex-col items-center gap-2 text-center">
          <div>
            <p className="rotulo">
              {passageiros > 1 ? `${passageiros} pessoas` : "total"}
            </p>
            <p
              data-valor
              className="font-display text-[19px] font-bold leading-tight text-noite"
            >
              {brl(passageiros > 1 ? voo.precoTotal : voo.precoPorPassageiro)}
            </p>
            {passageiros > 1 ? (
              <p className="text-[11px] text-tinta-3">{brl(voo.precoPorPassageiro)} cada</p>
            ) : null}
          </div>

          {!compacto ? (
            <Button
              variant="primaria"
              tamanho="sm"
              disabled={ocupado}
              className="w-full"
              onClick={() =>
                perguntar(
                  `Quero reservar o voo ${voo.ida[0]?.numeroVoo ?? ""} da ${voo.companhiaPrincipal.nome}, ${brl(voo.precoTotal)}. Id: ${voo.id}`,
                )
              }
            >
              Escolher
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Uma perna da viagem: partida, escalas e chegada. */
function Perna({
  trechos,
  rotulo,
  duracaoMin,
}: {
  trechos: Trecho[];
  rotulo: string;
  duracaoMin: number;
}) {
  const primeiro = trechos[0];
  const ultimo = trechos[trechos.length - 1];
  if (!primeiro || !ultimo) return null;

  const escalas = trechos.length - 1;
  const virada = viradaDeDia(primeiro.partida, ultimo.chegada);

  return (
    <div>
      <p className="rotulo mb-1.5">
        {rotulo} · {dataPorExtenso(primeiro.partida)}
      </p>

      <div className="flex items-start gap-2 sm:gap-3">
        <Ponta iata={primeiro.origem} horario={hora(primeiro.partida)} />

        {/* Trilho da rota: o traço vira o mapa de escalas. */}
        <div className="min-w-0 flex-1 pt-2.5">
          <div className="flex items-center gap-1">
            <span aria-hidden className="h-[3px] w-[3px] shrink-0 rounded-full bg-taxiway" />
            <span
              aria-hidden
              className="h-px flex-1 bg-[repeating-linear-gradient(to_right,var(--color-linha-forte)_0_4px,transparent_4px_8px)]"
            />
            <Plane size={13} aria-hidden className="shrink-0 text-taxiway" />
            <span
              aria-hidden
              className="h-px flex-1 bg-[repeating-linear-gradient(to_right,var(--color-linha-forte)_0_4px,transparent_4px_8px)]"
            />
            <span aria-hidden className="h-[3px] w-[3px] shrink-0 rounded-full bg-taxiway" />
          </div>

          <p className="mt-1 text-center text-[11px] text-tinta-2">
            <span className="tabular">{duracao(duracaoMin)}</span>
            {" · "}
            {escalas === 0 ? (
              <span className="text-eixo">direto</span>
            ) : (
              <>
                {escalas} escala{escalas > 1 ? "s" : ""} em{" "}
                <span className="codigo text-[10px]">
                  {trechos.slice(0, -1).map((t) => t.destino).join(", ")}
                </span>
              </>
            )}
          </p>
        </div>

        <Ponta iata={ultimo.destino} horario={hora(ultimo.chegada)} virada={virada} alinharDireita />
      </div>
    </div>
  );
}

function Ponta({
  iata,
  horario,
  virada = 0,
  alinharDireita = false,
}: {
  iata: string;
  horario: string;
  virada?: number;
  alinharDireita?: boolean;
}) {
  return (
    <div className={cn("shrink-0", alinharDireita && "text-right")}>
      <p data-valor className="font-display text-[21px] font-bold leading-none">
        {horario}
        {virada > 0 ? (
          <sup className="ml-0.5 text-[11px] font-semibold text-lacre">+{virada}</sup>
        ) : null}
      </p>
      <p className="codigo mt-1 text-[13px] text-tinta-2">{iata}</p>
    </div>
  );
}
