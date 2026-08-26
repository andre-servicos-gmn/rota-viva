"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVEGACAO, NAV_INTERNA } from "./navegacao";

export type ConversaResumo = {
  id: string;
  titulo: string;
  status: string;
  atualizadaEm: string;
};

export function Sidebar({
  conversas,
  viajante,
}: {
  conversas: ConversaResumo[];
  viajante: { nome: string; email: string };
}) {
  const caminho = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-noite text-nevoa lg:flex">
      <Marca />

      <nav aria-label="Navegação principal" className="px-3 pb-2">
        <ul className="space-y-0.5">
          {NAVEGACAO.map((item) => {
            const ativo =
              caminho === item.href || caminho.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-sm transition-colors",
                    ativo
                      ? "bg-noite-2 text-white"
                      : "text-nevoa/70 hover:bg-noite-2/60 hover:text-white",
                  )}
                >
                  <item.icone size={16} aria-hidden />
                  <span>{item.rotulo}</span>
                  {ativo ? (
                    <span
                      aria-hidden
                      className="ml-auto h-4 w-[3px] rounded-full bg-pista"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-3">
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="rotulo text-nevoa/65!">Conversas</h2>
          <Link
            href="/chat"
            className="flex items-center gap-1 text-[11px] text-pista hover:underline"
          >
            <Plus size={12} aria-hidden />
            Nova
          </Link>
        </div>

        <ul className="rolagem min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {conversas.length === 0 ? (
            <li className="px-2.5 py-2 text-[13px] leading-snug text-nevoa/65">
              Nenhuma conversa ainda. Escreva a primeira mensagem para começar.
            </li>
          ) : (
            conversas.map((conversa) => {
              const ativa = caminho === `/chat/${conversa.id}`;
              return (
                <li key={conversa.id}>
                  <Link
                    href={`/chat/${conversa.id}`}
                    aria-current={ativa ? "page" : undefined}
                    className={cn(
                      "block truncate rounded-[3px] px-2.5 py-1.5 text-[13px] transition-colors",
                      ativa
                        ? "bg-noite-2 text-white"
                        : "text-nevoa/60 hover:bg-noite-2/60 hover:text-white",
                    )}
                    title={conversa.titulo}
                  >
                    {conversa.status === "ESCALATED" ? (
                      <span className="mr-1.5 text-pista" aria-label="Escalada">
                        ▲
                      </span>
                    ) : null}
                    {conversa.titulo}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="border-t border-white/10 p-3">
        <Link
          href={NAV_INTERNA.href}
          className="mb-3 flex items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-[13px] text-nevoa/60 transition-colors hover:bg-noite-2/60 hover:text-white"
        >
          <NAV_INTERNA.icone size={15} aria-hidden />
          {NAV_INTERNA.rotulo}
        </Link>

        <div className="flex items-center gap-2.5 rounded-[3px] bg-noite-2 px-2.5 py-2">
          <span
            aria-hidden
            className="codigo flex h-7 w-7 items-center justify-center rounded-full bg-pista text-[11px] text-noite"
          >
            {iniciais(viajante.nome)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">
              {viajante.nome}
            </p>
            <p className="truncate text-[11px] text-nevoa/70">{viajante.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Marca: o filete de marcação de pista é o único ornamento aqui. A ousadia do
 * projeto está reservada para o bilhete perfurado, não para o logotipo.
 */
function Marca() {
  return (
    <div className="px-4 pb-4 pt-5">
      <div aria-hidden className="faixa-pista mb-3 h-[3px] w-10 rounded-full" />
      <p className="font-display text-[22px] font-bold leading-none tracking-tight text-white">
        ROTA VIVA
      </p>
      <p className="rotulo mt-1.5 text-nevoa/65!">Despacho de viagens</p>
    </div>
  );
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
