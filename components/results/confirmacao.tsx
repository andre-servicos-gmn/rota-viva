"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { brl } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAcoes } from "@/components/chat/acoes";

/**
 * Card de confirmação — o freio antes de qualquer ação com consequência.
 *
 * Mostra o que vai acontecer, quanto custa e o que não tem volta, e só então
 * oferece o botão. O botão diz exatamente o efeito ("Cancelar e pagar multa de
 * R$ 420"), e esse mesmo texto vai como mensagem ao agente — nada é executado
 * sem que o usuário tenha lido o número.
 */
export function CartaoConfirmacao({
  acao,
  titulo,
  linhas,
  destaque,
  aviso,
  textoDoBotao,
  mensagemAoConfirmar,
}: {
  acao: "criar" | "alterar" | "cancelar";
  titulo: string;
  linhas: { rotulo: string; valor: string; forte?: boolean; tom?: "eixo" | "lacre" }[];
  destaque?: { rotulo: string; valor: string };
  aviso?: string;
  textoDoBotao: string;
  mensagemAoConfirmar: string;
}) {
  const { perguntar, ocupado } = useAcoes();

  return (
    <section
      className="rounded-[4px] border-2 border-pista bg-papel"
      aria-labelledby="titulo-confirmacao"
    >
      <header className="flex items-center gap-2 border-b border-linha bg-pista-fosco px-4 py-2.5">
        <ShieldCheck size={15} aria-hidden className="shrink-0 text-[#7a5c00]" />
        <h3 id="titulo-confirmacao" className="font-display text-[15px] font-semibold">
          {titulo}
        </h3>
        <span className="rotulo ml-auto">confirmação</span>
      </header>

      <div className="p-4">
        <dl className="space-y-1.5 text-[13px]">
          {linhas.map((linha) => (
            <div key={linha.rotulo} className="flex justify-between gap-4">
              <dt className="text-tinta-2">{linha.rotulo}</dt>
              <dd
                data-valor
                className={
                  linha.tom === "eixo"
                    ? "text-eixo"
                    : linha.tom === "lacre"
                      ? "text-lacre"
                      : linha.forte
                        ? "font-semibold"
                        : ""
                }
              >
                {linha.valor}
              </dd>
            </div>
          ))}
        </dl>

        {destaque ? (
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-linha pt-3">
            <p className="rotulo">{destaque.rotulo}</p>
            <p data-valor className="font-display text-secao font-bold leading-none">
              {destaque.valor}
            </p>
          </div>
        ) : null}

        {aviso ? (
          <p className="mt-3 flex gap-2 rounded-[3px] bg-lacre-fosco p-2.5 text-[12px] leading-snug text-noite">
            <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0 text-lacre" />
            {aviso}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={acao === "cancelar" ? "perigo" : "primaria"}
            disabled={ocupado}
            onClick={() => perguntar(mensagemAoConfirmar)}
          >
            {textoDoBotao}
          </Button>
          <Button
            variant="contorno"
            disabled={ocupado}
            onClick={() => perguntar("Não, deixa como está.")}
          >
            Deixar como está
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ Adaptadores por tipo de ação */

export function ConfirmarReserva({ dados }: { dados: Record<string, any> }) {
  const linhas: { rotulo: string; valor: string; forte?: boolean }[] = [];

  if (dados.voo) {
    linhas.push({
      rotulo: `Voo ${dados.voo.origem.iata} → ${dados.voo.destino.iata}`,
      valor: brl(dados.totalVoo),
    });
  }
  if (dados.hotel) {
    linhas.push({
      rotulo: `${dados.hotel.nome} · ${dados.hotel.noites} noites`,
      valor: brl(dados.totalHotel),
    });
  }
  linhas.push({
    rotulo: `Passageiros (${dados.passageiros.length})`,
    valor: dados.passageiros.map((p: any) => p.nome).join(", "),
  });
  linhas.push({ rotulo: "Voucher enviado para", valor: dados.contato.email });

  return (
    <CartaoConfirmacao
      acao="criar"
      titulo="Revise antes de emitir"
      linhas={linhas}
      destaque={{ rotulo: "Total", valor: brl(dados.total) }}
      aviso={dados.aviso}
      textoDoBotao={`Confirmar reserva de ${brl(dados.total)}`}
      mensagemAoConfirmar={`Confirmo. Pode emitir a reserva de ${brl(dados.total)}.`}
    />
  );
}

export function ConfirmarCancelamento({ dados }: { dados: Record<string, any> }) {
  return (
    <CartaoConfirmacao
      acao="cancelar"
      titulo={`Cancelar a reserva ${dados.localizador}`}
      linhas={[
        { rotulo: "Valor pago", valor: brl(dados.total) },
        {
          rotulo: "Multa da tarifa",
          valor: dados.multa > 0 ? `− ${brl(dados.multa)}` : "sem multa",
          tom: dados.multa > 0 ? "lacre" : "eixo",
        },
        {
          rotulo: "Volta para você",
          valor: brl(dados.reembolso),
          tom: dados.reembolso > 0 ? "eixo" : "lacre",
          forte: true,
        },
      ]}
      aviso={
        dados.reembolso === 0
          ? `${dados.motivo} Cancelar não devolve nada — se ainda houver chance de viajar, remarcar sai melhor.`
          : dados.motivo
      }
      textoDoBotao={
        dados.multa > 0
          ? `Cancelar e pagar multa de ${brl(dados.multa)}`
          : "Confirmar cancelamento sem multa"
      }
      mensagemAoConfirmar={`Confirmo o cancelamento da reserva ${dados.localizador}.`}
    />
  );
}

export function ConfirmarAlteracao({ dados }: { dados: Record<string, any> }) {
  return (
    <CartaoConfirmacao
      acao="alterar"
      titulo={`Alterar a reserva ${dados.localizador}`}
      linhas={[
        {
          rotulo: "Data atual",
          valor: dados.dataAtual ? dataCurta(dados.dataAtual) : "—",
        },
        { rotulo: "Nova data", valor: dataCurta(dados.novaDataIda), forte: true },
        {
          rotulo: "Multa de remarcação",
          valor: dados.multa > 0 ? brl(dados.multa) : "sem multa",
          tom: dados.multa > 0 ? "lacre" : "eixo",
        },
        {
          rotulo: "Diferença de tarifa",
          valor: dados.diferencaTarifa > 0 ? brl(dados.diferencaTarifa) : "sem diferença",
          tom: dados.diferencaTarifa > 0 ? "lacre" : "eixo",
        },
      ]}
      destaque={{ rotulo: "A pagar agora", valor: brl(dados.custoTotal) }}
      aviso={dados.motivo}
      textoDoBotao={
        dados.custoTotal > 0
          ? `Confirmar alteração e pagar ${brl(dados.custoTotal)}`
          : "Confirmar alteração sem custo"
      }
      mensagemAoConfirmar={`Confirmo a alteração da reserva ${dados.localizador} para ${dataCurta(dados.novaDataIda)}.`}
    />
  );
}
