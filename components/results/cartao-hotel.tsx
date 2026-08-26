"use client";

import { Heart, MapPin, Star } from "lucide-react";
import type { OpcaoHotel } from "@/lib/providers/types";
import { ROTULO_COMODIDADE } from "@/lib/providers/mock/hoteis";
import { brl, cn } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Etiqueta } from "@/components/ui/feedback";
import { useAcoes } from "@/components/chat/acoes";

/**
 * Hotel no mesmo formato de bilhete do voo — corpo, perfuração e canhoto.
 * A consistência é proposital: no comparador as duas coisas ficam lado a lado.
 */
export function CartaoHotel({
  hotel,
  compacto = false,
}: {
  hotel: OpcaoHotel;
  compacto?: boolean;
}) {
  const { perguntar, favoritar, favoritados, ocupado } = useAcoes();
  const favoritado = favoritados.has(hotel.id);

  return (
    <article className="bilhete anim-entrada">
      <div className="min-w-0 p-3.5 sm:p-4">
        <header className="mb-2 flex flex-wrap items-start gap-x-2 gap-y-1">
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-[17px] font-semibold leading-tight">
              {hotel.nome}
            </h4>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-tinta-2">
              <span className="flex items-center gap-1">
                <span aria-label={`${hotel.estrelas} estrelas`} className="text-pista">
                  {"★".repeat(hotel.estrelas)}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} aria-hidden />
                {hotel.bairro} · {hotel.distanciaCentroKm} km do centro
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1">
            {!compacto ? (
              <button
                type="button"
                aria-pressed={favoritado}
                aria-label={favoritado ? "Remover da comparação" : "Comparar este hotel"}
                title={favoritado ? "Remover da comparação" : "Comparar este hotel"}
                onClick={() => favoritar({ tipo: "HOTEL", refId: hotel.id, snapshot: hotel })}
                className={cn(
                  "order-last rounded-[2px] p-1 transition-colors hover:bg-nevoa",
                  favoritado ? "text-lacre" : "text-tinta-3",
                )}
              >
                <Heart size={14} aria-hidden fill={favoritado ? "currentColor" : "none"} />
              </button>
            ) : null}
            {hotel.destaques.map((destaque) => (
              <Etiqueta
                key={destaque}
                tom={
                  destaque === "mais barato"
                    ? "eixo"
                    : destaque === "últimos quartos"
                      ? "lacre"
                      : "taxiway"
                }
              >
                {destaque}
              </Etiqueta>
            ))}
          </div>
        </header>

        <div className="flex items-center gap-2 text-[12px]">
          <span className="flex items-center gap-1 rounded-[2px] bg-taxiway px-1.5 py-0.5 font-semibold text-white">
            <Star size={11} aria-hidden fill="currentColor" />
            <span data-valor>{hotel.nota.toFixed(1)}</span>
          </span>
          <span className="text-tinta-3">{hotel.avaliacoes} avaliações</span>
          <span className="text-tinta-3">·</span>
          <span className="text-tinta-2">{hotel.tipoDeQuarto}</span>
        </div>

        {!compacto ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {hotel.comodidades.slice(0, 5).map((comodidade) => (
              <li
                key={comodidade}
                className="rounded-[2px] border border-linha bg-papel-2 px-1.5 py-0.5 text-[11px] text-tinta-2"
              >
                {ROTULO_COMODIDADE[comodidade]}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 border-t border-linha pt-2.5 text-[12px]">
          {hotel.reembolsavel ? (
            <span className="text-eixo">
              Cancelamento grátis até {dataCurta(hotel.cancelamentoGratisAte ?? "")}
            </span>
          ) : (
            <span className="text-tinta-2">Tarifa não reembolsável</span>
          )}
        </p>
      </div>

      <div aria-hidden className="bilhete__picote" />

      <div className="bilhete__canhoto w-[124px] shrink-0 sm:w-[140px]">
        <span className="bilhete__vertical hidden sm:block" aria-hidden>
          {hotel.noites} noite{hotel.noites > 1 ? "s" : ""}
        </span>

        <div className="flex w-full flex-col items-center gap-2 text-center">
          <div>
            <p className="rotulo">diária</p>
            <p data-valor className="font-display text-[19px] font-bold leading-tight">
              {brl(hotel.diaria)}
            </p>
            <p className="mt-0.5 text-[11px] text-tinta-3">
              {brl(hotel.total)} no total
            </p>
          </div>

          {!compacto ? (
            <Button
              variant="primaria"
              tamanho="sm"
              disabled={ocupado}
              className="w-full"
              onClick={() =>
                perguntar(
                  `Quero reservar o ${hotel.nome} em ${hotel.bairro}, ${brl(hotel.total)} no total. Id: ${hotel.id}`,
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
