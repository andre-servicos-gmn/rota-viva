"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { ChevronDown, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Etiqueta, EstadoErro } from "@/components/ui/feedback";
import { ResultadoDeFerramenta } from "@/components/results";
import { isToolUIPart } from "ai";

export type ConversaNaFila = {
  id: string;
  titulo: string;
  status: string;
  atendente: string | null;
  motivo: string | null;
  resumo: string | null;
  escaladaEm: string | null;
  viajante: { nome: string; email: string } | null;
  totalMensagens: number;
  transcricao: UIMessage[];
};

/**
 * Fila de conversas escaladas.
 *
 * Cada item abre a transcrição inteira — inclusive os cards que o agente já
 * mostrou ao cliente. O atendente precisa ver exatamente o que o cliente viu,
 * não um resumo em texto do que aconteceu.
 */
export function FilaDoAtendente({ conversas }: { conversas: ConversaNaFila[] }) {
  const [aberta, setAberta] = React.useState<string | null>(conversas[0]?.id ?? null);
  const [assumindo, setAssumindo] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const router = useRouter();

  async function assumir(id: string) {
    setAssumindo(id);
    setErro(null);
    try {
      const resposta = await fetch(`/api/atendente/${id}/assumir`, { method: "POST" });
      if (!resposta.ok) throw new Error((await resposta.json()).erro ?? "Falhou");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui assumir a conversa.");
    } finally {
      setAssumindo(null);
    }
  }

  return (
    <div className="space-y-2.5">
      {erro ? <EstadoErro detalhe={erro} /> : null}

      {conversas.map((conversa) => {
        const expandida = aberta === conversa.id;
        const emAtendimento = conversa.status === "HUMAN";

        return (
          <article
            key={conversa.id}
            className={cn(
              "rounded-[4px] border bg-papel",
              emAtendimento ? "border-eixo/40" : "border-linha",
            )}
          >
            <header className="flex flex-wrap items-start gap-3 p-3.5">
              <button
                type="button"
                onClick={() => setAberta(expandida ? null : conversa.id)}
                aria-expanded={expandida}
                className="flex min-w-0 flex-1 items-start gap-2 text-left"
              >
                <ChevronDown
                  size={16}
                  aria-hidden
                  className={cn(
                    "mt-0.5 shrink-0 text-tinta-3 transition-transform",
                    expandida && "rotate-180",
                  )}
                />
                <div className="min-w-0">
                  <h3 className="truncate font-display text-[15px] font-semibold">
                    {conversa.titulo}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-tinta-2">
                    {conversa.viajante ? (
                      <span>
                        {conversa.viajante.nome} · {conversa.viajante.email}
                      </span>
                    ) : (
                      <span>Visitante</span>
                    )}
                    <span className="flex items-center gap-1 text-tinta-3">
                      <Clock size={11} aria-hidden />
                      {conversa.escaladaEm
                        ? new Date(conversa.escaladaEm).toLocaleString("pt-BR")
                        : "—"}
                    </span>
                    <span className="text-tinta-3">{conversa.totalMensagens} mensagens</span>
                  </p>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                {emAtendimento ? (
                  <Etiqueta tom="eixo">
                    <UserCheck size={11} aria-hidden />
                    {conversa.atendente ?? "em atendimento"}
                  </Etiqueta>
                ) : (
                  <>
                    <Etiqueta tom="pista">na fila</Etiqueta>
                    <Button
                      variant="primaria"
                      tamanho="sm"
                      disabled={assumindo === conversa.id}
                      onClick={() => assumir(conversa.id)}
                    >
                      {assumindo === conversa.id ? "Assumindo…" : "Assumir conversa"}
                    </Button>
                  </>
                )}
              </div>
            </header>

            {conversa.motivo ? (
              <div className="border-t border-linha bg-papel-2 px-3.5 py-2.5">
                <p className="rotulo mb-1">Por que foi escalada</p>
                <p className="text-[13px]">{conversa.motivo}</p>
                {conversa.resumo ? (
                  <>
                    <p className="rotulo mb-1 mt-2.5">Resumo para o atendente</p>
                    <p className="text-[13px] leading-relaxed">{conversa.resumo}</p>
                  </>
                ) : null}
              </div>
            ) : null}

            {expandida ? (
              <div className="border-t border-linha p-3.5">
                <p className="rotulo mb-2.5">Transcrição</p>
                <Transcricao mensagens={conversa.transcricao} />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

/** A conversa como o cliente viu: texto e cards, na ordem em que aconteceram. */
function Transcricao({ mensagens }: { mensagens: UIMessage[] }) {
  if (mensagens.length === 0) {
    return <p className="text-[13px] text-tinta-3">Sem mensagens registradas.</p>;
  }

  return (
    <ol className="space-y-3">
      {mensagens.map((mensagem, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className={cn(
              "mt-1 h-2 w-2 shrink-0 rounded-full",
              mensagem.role === "user" ? "bg-taxiway" : "bg-pista",
            )}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="rotulo">
              {mensagem.role === "user" ? "Cliente" : "Agente"}
            </p>

            {(mensagem.parts ?? []).map((parte, j) => {
              if (parte.type === "text" && parte.text.trim()) {
                return (
                  <p key={j} className="whitespace-pre-line text-[13px] leading-relaxed">
                    {parte.text}
                  </p>
                );
              }
              if (isToolUIPart(parte) && parte.state === "output-available") {
                return (
                  <div key={j} className="max-w-xl">
                    <ResultadoDeFerramenta saida={parte.output} />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </li>
      ))}
    </ol>
  );
}
