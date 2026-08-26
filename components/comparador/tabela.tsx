"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { brl, cn, duracao } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { hora } from "@/lib/datas";
import { Button } from "@/components/ui/button";
import { Etiqueta } from "@/components/ui/feedback";

type Item = { id: string; refId: string; dados: any };

/**
 * Tabela comparativa.
 *
 * O melhor valor de cada linha ganha destaque verde — é a informação que a
 * pessoa procura quando abre um comparador, e ficar procurando o menor número
 * numa tabela é trabalho que a interface pode fazer por ela.
 *
 * Rola horizontalmente em telas estreitas, com a coluna de rótulos fixa.
 */
export function TabelaComparativa({ voos, hoteis }: { voos: Item[]; hoteis: Item[] }) {
  return (
    <div className="space-y-6">
      {voos.length > 0 ? <ComparaVoos itens={voos} /> : null}
      {hoteis.length > 0 ? <ComparaHoteis itens={hoteis} /> : null}
    </div>
  );
}

function useRemover() {
  const router = useRouter();
  const [removendo, setRemovendo] = React.useState<string | null>(null);

  return {
    removendo,
    remover: async (refId: string) => {
      setRemovendo(refId);
      try {
        await fetch("/api/favoritos", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refId }),
        });
        router.refresh();
      } finally {
        setRemovendo(null);
      }
    },
  };
}

function ComparaVoos({ itens }: { itens: Item[] }) {
  const { remover, removendo } = useRemover();

  const menorPreco = Math.min(...itens.map((i) => i.dados.precoTotal));
  const menorDuracao = Math.min(...itens.map((i) => i.dados.duracaoIdaMin));
  const menosEscalas = Math.min(...itens.map((i) => i.dados.paradas));

  const linhas: { rotulo: string; valor: (v: any) => React.ReactNode; melhor?: (v: any) => boolean }[] = [
    {
      rotulo: "Preço total",
      valor: (v) => brl(v.precoTotal),
      melhor: (v) => v.precoTotal === menorPreco,
    },
    { rotulo: "Por passageiro", valor: (v) => brl(v.precoPorPassageiro) },
    {
      rotulo: "Duração da ida",
      valor: (v) => duracao(v.duracaoIdaMin),
      melhor: (v) => v.duracaoIdaMin === menorDuracao,
    },
    {
      rotulo: "Escalas",
      valor: (v) => (v.paradas === 0 ? "direto" : `${v.paradas} escala`),
      melhor: (v) => v.paradas === menosEscalas,
    },
    {
      rotulo: "Horário",
      valor: (v) => `${hora(v.ida[0].partida)} → ${hora(v.ida[v.ida.length - 1].chegada)}`,
    },
    { rotulo: "Tarifa", valor: (v) => v.tarifa.nome },
    {
      rotulo: "Bagagem despachada",
      valor: (v) =>
        v.tarifa.bagagemDespachada > 0 ? `${v.tarifa.bagagemDespachada} peça(s)` : "não inclusa",
      melhor: (v) => v.tarifa.bagagemDespachada > 0,
    },
    {
      rotulo: "Reembolsável",
      valor: (v) => (v.tarifa.reembolsavel ? "sim" : "não"),
      melhor: (v) => v.tarifa.reembolsavel,
    },
    { rotulo: "Multa de remarcação", valor: (v) => (v.tarifa.multaRemarcacao > 0 ? brl(v.tarifa.multaRemarcacao) : "sem multa") },
  ];

  return (
    <section aria-label="Comparação de voos">
      <h2 className="mb-2 font-display text-[17px] font-semibold">Voos salvos</h2>
      <Tabela
        itens={itens}
        linhas={linhas}
        cabecalho={(v) => (
          <>
            <p className="codigo text-[13px] text-noite">
              {v.origem.iata} → {v.destino.iata}
            </p>
            <p className="mt-0.5 text-[12px] font-normal text-tinta-2">
              {v.companhiaPrincipal.nome}
            </p>
            <p className="mt-0.5 text-[11px] font-normal text-tinta-3">
              {dataCurta(v.ida[0].partida)}
            </p>
          </>
        )}
        acao={(item) => (
          <div className="flex flex-col gap-1.5">
            <Button asChild variant="primaria" tamanho="sm">
              <Link
                href={`/chat?q=${encodeURIComponent(
                  `Quero reservar o voo da ${item.dados.companhiaPrincipal.nome}, ${brl(item.dados.precoTotal)}. Id: ${item.refId}`,
                )}`}
              >
                Reservar
              </Link>
            </Button>
            <Button
              variant="fantasma"
              tamanho="sm"
              className="text-[12px]"
              disabled={removendo === item.refId}
              onClick={() => remover(item.refId)}
            >
              <Trash2 size={12} aria-hidden />
              Remover
            </Button>
          </div>
        )}
      />
    </section>
  );
}

function ComparaHoteis({ itens }: { itens: Item[] }) {
  const { remover, removendo } = useRemover();

  const menorDiaria = Math.min(...itens.map((i) => i.dados.diaria));
  const maiorNota = Math.max(...itens.map((i) => i.dados.nota));
  const menorDistancia = Math.min(...itens.map((i) => i.dados.distanciaCentroKm));

  const linhas = [
    { rotulo: "Diária", valor: (h: any) => brl(h.diaria), melhor: (h: any) => h.diaria === menorDiaria },
    { rotulo: "Total da estadia", valor: (h: any) => brl(h.total) },
    { rotulo: "Nota", valor: (h: any) => `${h.nota} (${h.avaliacoes})`, melhor: (h: any) => h.nota === maiorNota },
    { rotulo: "Categoria", valor: (h: any) => "★".repeat(h.estrelas) },
    {
      rotulo: "Distância do centro",
      valor: (h: any) => `${h.distanciaCentroKm} km`,
      melhor: (h: any) => h.distanciaCentroKm === menorDistancia,
    },
    { rotulo: "Quarto", valor: (h: any) => h.tipoDeQuarto },
    {
      rotulo: "Café da manhã",
      valor: (h: any) => (h.comodidades.includes("cafe-da-manha") ? "incluso" : "não incluso"),
      melhor: (h: any) => h.comodidades.includes("cafe-da-manha"),
    },
    {
      rotulo: "Cancelamento grátis",
      valor: (h: any) => (h.reembolsavel ? "sim" : "não"),
      melhor: (h: any) => h.reembolsavel,
    },
  ];

  return (
    <section aria-label="Comparação de hotéis">
      <h2 className="mb-2 font-display text-[17px] font-semibold">Hotéis salvos</h2>
      <Tabela
        itens={itens}
        linhas={linhas}
        cabecalho={(h) => (
          <>
            <p className="text-[13px] leading-tight text-noite">{h.nome}</p>
            <p className="mt-0.5 text-[12px] font-normal text-tinta-2">{h.bairro}</p>
            <p className="mt-0.5 text-[11px] font-normal text-tinta-3">
              {h.noites} noite{h.noites > 1 ? "s" : ""}
            </p>
          </>
        )}
        acao={(item) => (
          <div className="flex flex-col gap-1.5">
            <Button asChild variant="primaria" tamanho="sm">
              <Link
                href={`/chat?q=${encodeURIComponent(
                  `Quero reservar o ${item.dados.nome}, ${brl(item.dados.total)}. Id: ${item.refId}`,
                )}`}
              >
                Reservar
              </Link>
            </Button>
            <Button
              variant="fantasma"
              tamanho="sm"
              className="text-[12px]"
              disabled={removendo === item.refId}
              onClick={() => remover(item.refId)}
            >
              <Trash2 size={12} aria-hidden />
              Remover
            </Button>
          </div>
        )}
      />
    </section>
  );
}

/** Estrutura comum: rótulos na primeira coluna, uma coluna por item salvo. */
function Tabela({
  itens,
  linhas,
  cabecalho,
  acao,
}: {
  itens: Item[];
  linhas: { rotulo: string; valor: (d: any) => React.ReactNode; melhor?: (d: any) => boolean }[];
  cabecalho: (d: any) => React.ReactNode;
  acao: (item: Item) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-linha bg-papel">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr>
            <th scope="col" className="w-[160px] border-b border-linha p-3 text-left align-top">
              <span className="rotulo">Comparando</span>
            </th>
            {itens.map((item) => (
              <th
                key={item.id}
                scope="col"
                className="border-b border-l border-linha p-3 text-left align-top font-semibold"
              >
                {cabecalho(item.dados)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.rotulo} className="border-b border-linha last:border-0">
              <th scope="row" className="p-3 text-left font-normal text-tinta-2">
                {linha.rotulo}
              </th>
              {itens.map((item) => {
                const ehMelhor = linha.melhor?.(item.dados) ?? false;
                return (
                  <td
                    key={item.id}
                    data-valor
                    className={cn(
                      "border-l border-linha p-3",
                      ehMelhor && "bg-eixo-fosco font-semibold text-eixo",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {linha.valor(item.dados)}
                      {ehMelhor ? (
                        <Etiqueta tom="eixo" className="shrink-0 px-1 py-0 text-[10px]">
                          melhor
                        </Etiqueta>
                      ) : null}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th scope="row" className="p-3 text-left font-normal text-tinta-2">
              Ação
            </th>
            {itens.map((item) => (
              <td key={item.id} className="border-l border-linha p-3 align-top">
                {acao(item)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
