"use client";

import * as React from "react";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CHAVE = "rv:painel-contexto";

/**
 * Painel de contexto à direita.
 *
 * Em telas largas ele encolhe para uma faixa clicável (nunca some por completo,
 * para não virar um botão órfão). Abaixo de xl vira uma gaveta sobreposta,
 * fechável por Esc e por clique fora.
 */
export function PainelContexto({
  titulo = "Contexto",
  children,
}: {
  titulo?: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = React.useState(true);
  const [gavetaAberta, setGavetaAberta] = React.useState(false);

  React.useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo !== null) setAberto(salvo === "1");
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(CHAVE, aberto ? "1" : "0");
  }, [aberto]);

  React.useEffect(() => {
    if (!gavetaAberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGavetaAberta(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [gavetaAberta]);

  return (
    <>
      {/* Botão de abrir a gaveta — só abaixo de xl. */}
      <div className="fixed bottom-[68px] right-3 z-30 xl:hidden">
        <Button
          variant="escura"
          tamanho="sm"
          onClick={() => setGavetaAberta(true)}
          aria-expanded={gavetaAberta}
        >
          <PanelRightOpen size={15} aria-hidden />
          {titulo}
        </Button>
      </div>

      {/* Gaveta (telas estreitas) */}
      {gavetaAberta ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Fechar contexto"
            className="absolute inset-0 bg-noite/50"
            onClick={() => setGavetaAberta(false)}
          />
          <div
            role="dialog"
            aria-label={titulo}
            className="absolute inset-y-0 right-0 flex w-[min(340px,90vw)] flex-col border-l border-linha bg-papel-2"
          >
            <div className="flex items-center justify-between border-b border-linha px-4 py-3">
              <h2 className="rotulo">{titulo}</h2>
              <Button
                variant="fantasma"
                tamanho="icone"
                onClick={() => setGavetaAberta(false)}
                aria-label="Fechar contexto"
              >
                <X size={16} aria-hidden />
              </Button>
            </div>
            <div className="rolagem flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      ) : null}

      {/* Painel fixo (xl para cima) */}
      <aside
        className={cn(
          "hidden shrink-0 border-l border-linha bg-papel-2 xl:flex xl:flex-col",
          aberto ? "w-[320px]" : "w-[52px]",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-linha px-3 py-3",
            aberto ? "justify-between" : "justify-center",
          )}
        >
          {aberto ? <h2 className="rotulo pl-1">{titulo}</h2> : null}
          <Button
            variant="fantasma"
            tamanho="icone"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-label={aberto ? "Recolher painel de contexto" : "Abrir painel de contexto"}
          >
            {aberto ? (
              <PanelRightClose size={16} aria-hidden />
            ) : (
              <PanelRightOpen size={16} aria-hidden />
            )}
          </Button>
        </div>

        {aberto ? (
          <div className="rolagem flex-1 overflow-y-auto p-4">{children}</div>
        ) : (
          <p className="bilhete__vertical mt-4 self-center" aria-hidden>
            {titulo}
          </p>
        )}
      </aside>
    </>
  );
}
