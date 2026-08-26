"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, BellRing, Minus, RefreshCw, Trash2 } from "lucide-react";
import { brl, cn } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Etiqueta, EstadoErro, EstadoVazio } from "@/components/ui/feedback";

export type Alerta = {
  id: string;
  origem: string;
  destino: string;
  dataAlvo: string;
  precoBase: number;
  precoAtual: number;
  alvo: number | null;
  status: string;
  disparadoEm: string | null;
};

/**
 * Alertas de preço com verificação manual.
 *
 * Numa POC não há job agendado rodando: o botão "Verificar agora" faz o papel
 * do cron. Isso é dito na tela, para ninguém achar que existe um serviço
 * observando preços em segundo plano.
 */
export function PainelDeAlertas({ alertas }: { alertas: Alerta[] }) {
  const router = useRouter();
  const [verificando, setVerificando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [resultado, setResultado] = React.useState<string | null>(null);

  async function verificar() {
    setVerificando(true);
    setErro(null);
    setResultado(null);
    try {
      const resposta = await fetch("/api/alertas/verificar", { method: "POST" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Falhou");

      setResultado(
        dados.caiu > 0
          ? `${dados.caiu} de ${dados.verificados} baixaram de preço.`
          : `Nenhuma queda entre os ${dados.verificados} alertas verificados.`,
      );
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui verificar agora.");
    } finally {
      setVerificando(false);
    }
  }

  async function remover(id: string) {
    await fetch(`/api/alertas/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (alertas.length === 0) {
    return (
      <EstadoVazio
        icone={<BellRing size={22} />}
        titulo="Nenhum alerta de preço"
        descricao="Peça no chat: 'me avise se o voo para Lisboa em outubro baixar'. Guardo o preço de hoje e comparo quando você mandar verificar."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="contorno" tamanho="sm" disabled={verificando} onClick={verificar}>
          <RefreshCw size={14} aria-hidden className={cn(verificando && "anim-pulso")} />
          {verificando ? "Verificando…" : "Verificar agora"}
        </Button>
        <p className="text-[12px] text-tinta-3">
          Nesta demonstração não há job automático — a verificação roda quando você clica.
        </p>
      </div>

      {erro ? <EstadoErro detalhe={erro} aoTentarNovamente={verificar} /> : null}
      {resultado ? (
        <p role="status" className="text-[13px] text-eixo">
          {resultado}
        </p>
      ) : null}

      <ul className="space-y-2">
        {alertas.map((alerta) => {
          const diferenca = alerta.precoAtual - alerta.precoBase;
          const caiu = diferenca < 0;
          const igual = diferenca === 0;

          return (
            <li
              key={alerta.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[4px] border bg-papel p-3",
                caiu ? "border-eixo/40 bg-eixo-fosco" : "border-linha",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="codigo text-[14px] font-semibold">
                  {alerta.origem} → {alerta.destino}
                </p>
                <p className="mt-0.5 text-[12px] text-tinta-2">
                  saída em {dataCurta(alerta.dataAlvo)}
                  {alerta.alvo ? ` · avisar abaixo de ${brl(alerta.alvo)}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="rotulo">quando salvou</p>
                <p data-valor className="text-[13px] text-tinta-2 line-through">
                  {brl(alerta.precoBase)}
                </p>
              </div>

              <div className="text-right">
                <p className="rotulo">agora</p>
                <p
                  data-valor
                  className={cn(
                    "font-display text-[17px] font-bold leading-none",
                    caiu ? "text-eixo" : igual ? "" : "text-lacre",
                  )}
                >
                  {brl(alerta.precoAtual)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Etiqueta tom={caiu ? "eixo" : igual ? "neutro" : "lacre"}>
                  {caiu ? (
                    <ArrowDown size={11} aria-hidden />
                  ) : igual ? (
                    <Minus size={11} aria-hidden />
                  ) : (
                    <ArrowUp size={11} aria-hidden />
                  )}
                  {igual ? "sem mudança" : brl(Math.abs(diferenca))}
                </Etiqueta>

                <button
                  type="button"
                  aria-label={`Remover alerta ${alerta.origem} para ${alerta.destino}`}
                  onClick={() => remover(alerta.id)}
                  className="rounded-[2px] p-1 text-tinta-3 hover:bg-lacre-fosco hover:text-lacre"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
