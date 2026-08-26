"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2, Undo2 } from "lucide-react";
import type { BlocoRoteiro, DiaRoteiro } from "@/components/results/roteiro";
import { brl, cn } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Etiqueta, EstadoErro } from "@/components/ui/feedback";

/**
 * Roteiro editável.
 *
 * Reordenar usa botões de subir e descer, não arrastar. Foi decisão consciente:
 * arrastar exige mouse preciso, não funciona por teclado sem trabalho extra e
 * quebra em tela pequena. Os botões movem um bloco em qualquer entrada — mouse,
 * dedo ou Tab + Enter — e comunicam melhor o que está acontecendo.
 *
 * As mudanças ficam locais até "Salvar roteiro": dá para experimentar sem medo,
 * e "Desfazer tudo" volta ao estado salvo.
 */
export function EditorDeRoteiro({
  id,
  titulo,
  destino,
  diasIniciais,
}: {
  id: string;
  titulo: string;
  destino: string;
  diasIniciais: DiaRoteiro[];
}) {
  const [dias, setDias] = React.useState<DiaRoteiro[]>(diasIniciais);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvoEm, setSalvoEm] = React.useState<string | null>(null);

  const alterado = JSON.stringify(dias) !== JSON.stringify(diasIniciais);

  function atualizarDia(indice: number, blocos: BlocoRoteiro[]) {
    setDias((atual) =>
      atual.map((dia, i) =>
        i === indice
          ? {
              ...dia,
              blocos,
              // O custo do dia acompanha os blocos que sobraram.
              custoEstimado: blocos.reduce((soma, b) => soma + (b.preco ?? 0), 0),
            }
          : dia,
      ),
    );
  }

  function mover(diaIndice: number, blocoIndice: number, direcao: -1 | 1) {
    const dia = dias[diaIndice];
    if (!dia) return;
    const destinoIndice = blocoIndice + direcao;
    if (destinoIndice < 0 || destinoIndice >= dia.blocos.length) return;

    const blocos = [...dia.blocos];
    const [movido] = blocos.splice(blocoIndice, 1);
    blocos.splice(destinoIndice, 0, movido!);
    atualizarDia(diaIndice, blocos);
  }

  function remover(diaIndice: number, blocoIndice: number) {
    const dia = dias[diaIndice];
    if (!dia) return;
    atualizarDia(
      diaIndice,
      dia.blocos.filter((_, i) => i !== blocoIndice),
    );
  }

  function adicionar(diaIndice: number) {
    const dia = dias[diaIndice];
    if (!dia) return;
    atualizarDia(diaIndice, [
      ...dia.blocos,
      {
        periodo: "tarde",
        horario: "16:00",
        titulo: "Novo bloco",
        descricao: "Clique no título para descrever o que fazer aqui.",
        tipo: "livre",
      },
    ]);
  }

  function editarCampo(
    diaIndice: number,
    blocoIndice: number,
    campo: "titulo" | "descricao" | "horario",
    valor: string,
  ) {
    const dia = dias[diaIndice];
    if (!dia) return;
    atualizarDia(
      diaIndice,
      dia.blocos.map((bloco, i) => (i === blocoIndice ? { ...bloco, [campo]: valor } : bloco)),
    );
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/roteiros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias }),
      });
      if (!resposta.ok) {
        throw new Error((await resposta.json()).erro ?? "Não consegui salvar.");
      }
      setSalvoEm(new Date().toLocaleTimeString("pt-BR"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar o roteiro.");
    } finally {
      setSalvando(false);
    }
  }

  const total = dias.reduce((soma, dia) => soma + dia.custoEstimado, 0);

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-secao">{titulo}</h2>
          <p className="mt-0.5 text-[13px] text-tinta-2">
            {destino} ·{" "}
            <span data-valor className="font-medium text-noite">
              {brl(total)}
            </span>{" "}
            por pessoa em passeios e refeições
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alterado ? (
            <Button
              variant="fantasma"
              tamanho="sm"
              onClick={() => {
                setDias(diasIniciais);
                setSalvoEm(null);
              }}
            >
              <Undo2 size={14} aria-hidden />
              Desfazer tudo
            </Button>
          ) : null}
          <Button variant="primaria" tamanho="sm" disabled={!alterado || salvando} onClick={salvar}>
            <Save size={14} aria-hidden />
            {salvando ? "Salvando…" : "Salvar roteiro"}
          </Button>
        </div>
      </header>

      {erro ? <EstadoErro detalhe={erro} aoTentarNovamente={salvar} /> : null}

      {salvoEm && !alterado ? (
        <p role="status" className="text-[12px] text-eixo">
          Roteiro salvo às {salvoEm}.
        </p>
      ) : null}

      {alterado ? (
        <p role="status" className="text-[12px] text-tinta-2">
          Você tem alterações não salvas.
        </p>
      ) : null}

      <ol className="space-y-2.5">
        {dias.map((dia, diaIndice) => (
          <li key={dia.numero}>
            <article className="rounded-[4px] border border-linha bg-papel">
              <header className="flex items-baseline justify-between gap-2 border-b border-linha px-3.5 py-2.5">
                <h3 className="flex items-baseline gap-2">
                  <span className="codigo rounded-[2px] bg-noite px-1.5 py-0.5 text-[11px] text-pista">
                    DIA {String(dia.numero).padStart(2, "0")}
                  </span>
                  {dia.data ? (
                    <span className="text-[12px] text-tinta-2">{dataCurta(dia.data)}</span>
                  ) : null}
                </h3>
                <span data-valor className="text-[12px] text-tinta-2">
                  {brl(dia.custoEstimado)}
                </span>
              </header>

              <ol className="divide-y divide-linha">
                {dia.blocos.map((bloco, blocoIndice) => (
                  <li key={blocoIndice} className="flex gap-2 p-3">
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        aria-label={`Mover "${bloco.titulo}" para cima`}
                        disabled={blocoIndice === 0}
                        onClick={() => mover(diaIndice, blocoIndice, -1)}
                        className="rounded-[2px] p-0.5 text-tinta-3 hover:bg-nevoa hover:text-noite disabled:opacity-30"
                      >
                        <ChevronUp size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Mover "${bloco.titulo}" para baixo`}
                        disabled={blocoIndice === dia.blocos.length - 1}
                        onClick={() => mover(diaIndice, blocoIndice, 1)}
                        className="rounded-[2px] p-0.5 text-tinta-3 hover:bg-nevoa hover:text-noite disabled:opacity-30"
                      >
                        <ChevronDown size={14} aria-hidden />
                      </button>
                    </div>

                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 h-[13px] w-[13px] shrink-0 rounded-full border-2 bg-papel",
                        bloco.tipo === "passeio"
                          ? "border-taxiway"
                          : bloco.tipo === "refeicao"
                            ? "border-pista"
                            : "border-linha-forte",
                      )}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={bloco.horario}
                          onChange={(e) =>
                            editarCampo(diaIndice, blocoIndice, "horario", e.target.value)
                          }
                          aria-label={`Horário de "${bloco.titulo}"`}
                          className="codigo w-[52px] rounded-[2px] border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-tinta-2 hover:border-linha focus:border-taxiway"
                        />
                        {bloco.preco ? (
                          <Etiqueta>{brl(bloco.preco)}</Etiqueta>
                        ) : null}
                      </div>

                      <input
                        value={bloco.titulo}
                        onChange={(e) =>
                          editarCampo(diaIndice, blocoIndice, "titulo", e.target.value)
                        }
                        aria-label="Título do bloco"
                        className="mt-0.5 w-full rounded-[2px] border border-transparent bg-transparent px-1 py-0.5 text-[14px] font-medium hover:border-linha focus:border-taxiway"
                      />

                      <textarea
                        value={bloco.descricao}
                        onChange={(e) =>
                          editarCampo(diaIndice, blocoIndice, "descricao", e.target.value)
                        }
                        aria-label={`Descrição de "${bloco.titulo}"`}
                        rows={2}
                        className="mt-0.5 w-full resize-none rounded-[2px] border border-transparent bg-transparent px-1 py-0.5 text-[13px] leading-snug text-tinta-2 hover:border-linha focus:border-taxiway"
                      />
                    </div>

                    <button
                      type="button"
                      aria-label={`Remover "${bloco.titulo}"`}
                      onClick={() => remover(diaIndice, blocoIndice)}
                      className="h-fit shrink-0 rounded-[2px] p-1 text-tinta-3 hover:bg-lacre-fosco hover:text-lacre"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ol>

              <div className="border-t border-linha p-2">
                <Button
                  variant="fantasma"
                  tamanho="sm"
                  className="w-full text-[12px]"
                  onClick={() => adicionar(diaIndice)}
                >
                  <Plus size={13} aria-hidden />
                  Adicionar bloco no dia {dia.numero}
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
