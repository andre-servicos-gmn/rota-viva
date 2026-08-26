"use client";

import Link from "next/link";
import { Download, Mail, Plane, Building2 } from "lucide-react";
import { brl, cn } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { hora, dataPorExtenso } from "@/lib/datas";
import { Button } from "@/components/ui/button";

/**
 * Voucher emitido — o bilhete no seu estado final.
 *
 * É aqui que o carimbo aparece: EMITIDO, ALTERADO ou CANCELADO, torto como
 * carimbo de balcão. O mesmo desenho vale para o PDF, para a tela de reservas e
 * para o painel do atendente.
 */
export function Voucher({
  localizador,
  status = "CONFIRMED",
  voo,
  hotel,
  passageiros,
  contato,
  total,
  emitidaEm,
  compacto = false,
}: {
  localizador: string;
  status?: "CONFIRMED" | "CHANGED" | "CANCELLED";
  voo?: any;
  hotel?: any;
  passageiros: { nome: string; documento?: string }[];
  contato?: { email: string; telefone?: string };
  total: number;
  emitidaEm?: string;
  compacto?: boolean;
}) {
  const carimbo = {
    CONFIRMED: { texto: "Emitido", classe: "carimbo--emitido" },
    CHANGED: { texto: "Alterado", classe: "carimbo--alterado" },
    CANCELLED: { texto: "Cancelado", classe: "carimbo--cancelado" },
  }[status];

  return (
    <article
      className={cn(
        "bilhete anim-entrada",
        status === "CANCELLED" && "opacity-75",
      )}
    >
      <div className="min-w-0 p-4">
        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="rotulo">Localizador</p>
            <p className="codigo font-display text-[22px] font-bold leading-none text-noite">
              {localizador}
            </p>
          </div>
          <span className={cn("carimbo", carimbo.classe)}>{carimbo.texto}</span>
        </header>

        {voo ? (
          <div className="border-t border-dashed border-linha pt-3">
            <p className="rotulo mb-1.5 flex items-center gap-1.5">
              <Plane size={12} aria-hidden />
              {voo.companhiaPrincipal.nome} · {voo.ida[0]?.numeroVoo}
            </p>
            <div className="flex items-baseline gap-3">
              <div>
                <p data-valor className="font-display text-[19px] font-bold leading-none">
                  {hora(voo.ida[0].partida)}
                </p>
                <p className="codigo mt-0.5 text-[12px] text-tinta-2">{voo.origem.iata}</p>
              </div>
              <span aria-hidden className="flex-1 border-t border-dashed border-linha-forte" />
              <div className="text-right">
                <p data-valor className="font-display text-[19px] font-bold leading-none">
                  {hora(voo.ida[voo.ida.length - 1].chegada)}
                </p>
                <p className="codigo mt-0.5 text-[12px] text-tinta-2">{voo.destino.iata}</p>
              </div>
            </div>
            <p className="mt-1.5 text-[12px] text-tinta-2">
              {dataPorExtenso(voo.ida[0].partida)}
              {voo.volta?.length ? ` · volta ${dataPorExtenso(voo.volta[0].partida)}` : ""}
              {" · "}
              tarifa {voo.tarifa.nome}
            </p>
          </div>
        ) : null}

        {hotel ? (
          <div className="mt-3 border-t border-dashed border-linha pt-3">
            <p className="rotulo mb-1.5 flex items-center gap-1.5">
              <Building2 size={12} aria-hidden />
              Hospedagem
            </p>
            <p className="text-[15px] font-medium leading-tight">{hotel.nome}</p>
            <p className="mt-0.5 text-[12px] text-tinta-2">
              {hotel.bairro}, {hotel.cidade} · {hotel.noites} noite
              {hotel.noites > 1 ? "s" : ""} · {hotel.tipoDeQuarto}
            </p>
          </div>
        ) : null}

        <div className="mt-3 border-t border-dashed border-linha pt-3">
          <p className="rotulo mb-1">
            {passageiros.length > 1 ? "Passageiros" : "Passageiro"}
          </p>
          <ul className="text-[13px]">
            {passageiros.map((p, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                <span>{p.nome}</span>
                {p.documento ? (
                  <span className="codigo text-[11px] text-tinta-3">{p.documento}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {!compacto && contato ? (
          <p className="mt-3 flex items-center gap-1.5 border-t border-linha pt-2.5 text-[12px] text-tinta-2">
            <Mail size={12} aria-hidden />
            Voucher enviado para {contato.email}
          </p>
        ) : null}
      </div>

      <div aria-hidden className="bilhete__picote" />

      <div className="bilhete__canhoto w-[128px] shrink-0 sm:w-[148px]">
        <span className="bilhete__vertical hidden sm:block" aria-hidden>
          {localizador}
        </span>

        <div className="flex w-full flex-col items-center gap-2 text-center">
          <div>
            <p className="rotulo">total pago</p>
            <p data-valor className="font-display text-[19px] font-bold leading-tight">
              {brl(total)}
            </p>
            {emitidaEm ? (
              <p className="mt-0.5 text-[10px] text-tinta-3">
                em {dataCurta(emitidaEm.slice(0, 10))}
              </p>
            ) : null}
          </div>

          {!compacto ? (
            <div className="flex w-full flex-col gap-1.5">
              <Button asChild variant="contorno" tamanho="sm" className="w-full">
                <Link href={`/reservas/${localizador}`}>Abrir</Link>
              </Button>
              <Button asChild variant="fantasma" tamanho="sm" className="w-full text-[12px]">
                <a href={`/api/reservas/${localizador}/voucher`} target="_blank" rel="noreferrer">
                  <Download size={12} aria-hidden />
                  PDF
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
