"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoErro } from "@/components/ui/feedback";

/**
 * Preferências do viajante.
 *
 * O que é gravado aqui entra no system prompt a cada turno — é o que faz o
 * agente parar de perguntar "corredor ou janela?" toda vez.
 */

type Preferencias = {
  assento?: string;
  ciaPreferida?: string | null;
  restricaoAlimentar?: string | null;
  ritmoDeViagem?: string;
  fidelidade?: string[];
  orcamentoTipico?: number | null;
};

export function FormularioDePerfil({
  nome,
  email,
  telefone,
  preferencias,
  documentos,
}: {
  nome: string;
  email: string;
  telefone: string;
  preferencias: Preferencias;
  documentos: { tipo: string; numero: string; validade?: string }[];
}) {
  const router = useRouter();
  const [dados, setDados] = React.useState({
    telefone,
    assento: preferencias.assento ?? "indiferente",
    ciaPreferida: preferencias.ciaPreferida ?? "",
    restricaoAlimentar: preferencias.restricaoAlimentar ?? "",
    ritmoDeViagem: preferencias.ritmoDeViagem ?? "normal",
    fidelidade: (preferencias.fidelidade ?? []).join(", "),
  });
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvo, setSalvo] = React.useState(false);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);
    setSalvo(false);

    try {
      const resposta = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: dados.telefone,
          preferencias: {
            assento: dados.assento,
            ciaPreferida: dados.ciaPreferida || null,
            restricaoAlimentar: dados.restricaoAlimentar || null,
            ritmoDeViagem: dados.ritmoDeViagem,
            fidelidade: dados.fidelidade
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean),
          },
        }),
      });

      if (!resposta.ok) {
        throw new Error((await resposta.json()).erro ?? "Não consegui salvar.");
      }

      setSalvo(true);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui salvar as preferências.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <section className="rounded-[4px] border border-linha bg-papel">
        <header className="border-b border-linha px-4 py-2.5">
          <h2 className="font-display text-[15px] font-semibold">Viajante</h2>
        </header>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Campo rotulo="Nome" valor={nome} somenteLeitura />
          <Campo rotulo="E-mail" valor={email} somenteLeitura />
          <Campo
            rotulo="Telefone"
            valor={dados.telefone}
            onChange={(v) => setDados({ ...dados, telefone: v })}
          />
        </div>
      </section>

      <section className="rounded-[4px] border border-linha bg-papel">
        <header className="border-b border-linha px-4 py-2.5">
          <h2 className="font-display text-[15px] font-semibold">Preferências de viagem</h2>
          <p className="mt-0.5 text-[12px] text-tinta-2">
            O agente usa isto nas buscas em vez de perguntar de novo.
          </p>
        </header>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Selecao
            rotulo="Assento"
            valor={dados.assento}
            onChange={(v) => setDados({ ...dados, assento: v })}
            opcoes={[
              ["indiferente", "Tanto faz"],
              ["corredor", "Corredor"],
              ["janela", "Janela"],
            ]}
          />
          <Selecao
            rotulo="Ritmo de viagem"
            valor={dados.ritmoDeViagem}
            onChange={(v) => setDados({ ...dados, ritmoDeViagem: v })}
            opcoes={[
              ["leve", "Leve — 1 passeio por dia"],
              ["normal", "Normal — 2 por dia"],
              ["intenso", "Intenso — 3 por dia"],
            ]}
          />
          <Campo
            rotulo="Companhia preferida"
            valor={dados.ciaPreferida}
            placeholder="Aurora, Cordilheira…"
            onChange={(v) => setDados({ ...dados, ciaPreferida: v })}
          />
          <Campo
            rotulo="Restrição alimentar"
            valor={dados.restricaoAlimentar}
            placeholder="Vegetariana, sem glúten…"
            onChange={(v) => setDados({ ...dados, restricaoAlimentar: v })}
          />
          <Campo
            rotulo="Programas de fidelidade"
            valor={dados.fidelidade}
            placeholder="Separe por vírgula"
            onChange={(v) => setDados({ ...dados, fidelidade: v })}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-[4px] border border-linha bg-papel">
        <header className="border-b border-linha px-4 py-2.5">
          <h2 className="font-display text-[15px] font-semibold">Documentos</h2>
        </header>
        <div className="p-4">
          {documentos.length === 0 ? (
            <p className="flex items-start gap-2 text-[13px] leading-snug text-tinta-2">
              <ShieldAlert size={15} aria-hidden className="mt-0.5 shrink-0 text-pista" />
              <span>
                Nenhum documento cadastrado. Esta é uma prova de conceito:{" "}
                <strong>não cadastre documentos reais aqui</strong>. Os vouchers de
                demonstração usam números fictícios.
              </span>
            </p>
          ) : (
            <ul className="space-y-1 text-[13px]">
              {documentos.map((doc, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{doc.tipo}</span>
                  <span className="codigo text-tinta-2">{doc.numero}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {erro ? <EstadoErro detalhe={erro} /> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primaria" disabled={salvando}>
          <Save size={15} aria-hidden />
          {salvando ? "Salvando…" : "Salvar preferências"}
        </Button>
        {salvo ? (
          <p role="status" className="text-[13px] text-eixo">
            Preferências salvas.
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  somenteLeitura,
  className,
}: {
  rotulo: string;
  valor: string;
  onChange?: (valor: string) => void;
  placeholder?: string;
  somenteLeitura?: boolean;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="rotulo mb-1 block">
        {rotulo}
      </label>
      <input
        id={id}
        value={valor}
        placeholder={placeholder}
        readOnly={somenteLeitura}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-9 w-full rounded-[3px] border border-linha bg-papel-2 px-2.5 text-[14px] read-only:text-tinta-2 focus:border-taxiway"
      />
    </div>
  );
}

function Selecao({
  rotulo,
  valor,
  onChange,
  opcoes,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  opcoes: [string, string][];
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="rotulo mb-1 block">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-[3px] border border-linha bg-papel-2 px-2 text-[14px] focus:border-taxiway"
      >
        {opcoes.map(([v, texto]) => (
          <option key={v} value={v}>
            {texto}
          </option>
        ))}
      </select>
    </div>
  );
}
