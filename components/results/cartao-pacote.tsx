"use client";

import { PiggyBank } from "lucide-react";
import type { OpcaoHotel, OpcaoVoo } from "@/lib/providers/types";
import { brl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CartaoVoo } from "./cartao-voo";
import { CartaoHotel } from "./cartao-hotel";
import { useAcoes } from "@/components/chat/acoes";

/**
 * Pacote: voo e hotel juntos, com a conta da economia explícita.
 * O que vende um pacote é a diferença — então ela vira o carimbo do bloco.
 */
export function CartaoPacote({
  voo,
  hotel,
  passageiros,
  totalVoo,
  totalHotel,
  totalSeparado,
  total,
  economia,
  percentualEconomia,
}: {
  voo: OpcaoVoo;
  hotel: OpcaoHotel;
  passageiros: number;
  totalVoo: number;
  totalHotel: number;
  totalSeparado: number;
  total: number;
  economia: number;
  percentualEconomia: number;
}) {
  const { perguntar, ocupado } = useAcoes();

  return (
    <section className="space-y-2.5" aria-label="Pacote de viagem">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-[17px] font-semibold">
          Pacote {voo.origem.cidade} → {voo.destino.cidade}
        </h3>
        <span className="rotulo">
          {passageiros} pessoa{passageiros > 1 ? "s" : ""} · {hotel.noites} noite
          {hotel.noites > 1 ? "s" : ""}
        </span>
      </header>

      <CartaoVoo voo={voo} passageiros={passageiros} compacto />
      <CartaoHotel hotel={hotel} compacto />

      <div className="rounded-[4px] border border-linha bg-papel p-4">
        <dl className="space-y-1.5 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">
              Voo ({passageiros} × {brl(voo.precoPorPassageiro)})
            </dt>
            <dd data-valor>{brl(totalVoo)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tinta-2">
              Hotel ({hotel.noites} × {brl(hotel.diaria)})
            </dt>
            <dd data-valor>{brl(totalHotel)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-linha pt-1.5 text-tinta-3">
            <dt>Comprando separado</dt>
            <dd data-valor className="line-through">
              {brl(totalSeparado)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 text-eixo">
            <dt className="flex items-center gap-1.5">
              <PiggyBank size={14} aria-hidden />
              Economia do pacote ({percentualEconomia}%)
            </dt>
            <dd data-valor className="font-semibold">
              − {brl(economia)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-linha pt-3">
          <div>
            <p className="rotulo">Total do pacote</p>
            <p data-valor className="font-display text-secao font-bold leading-none">
              {brl(total)}
            </p>
          </div>
          <Button
            variant="primaria"
            disabled={ocupado}
            onClick={() =>
              perguntar(
                `Quero reservar este pacote: voo ${voo.id} e hotel ${hotel.id}, total ${brl(total)}.`,
              )
            }
          >
            Reservar pacote
          </Button>
        </div>
      </div>
    </section>
  );
}
