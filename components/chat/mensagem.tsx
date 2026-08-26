"use client";

import type { UIMessage } from "ai";
import { TextoRico } from "./texto-rico";

/**
 * Uma mensagem no chat.
 *
 * O agente não fala em balão: fala numa faixa de despacho, com filete amarelo à
 * esquerda e o rótulo impresso em mono. A voz do usuário é um cartão de papel.
 * Na fase 2, as parts de tool passam a ser roteadas aqui para os cards ricos.
 */
export function Mensagem({ mensagem }: { mensagem: UIMessage }) {
  const doUsuario = mensagem.role === "user";
  const textos = (mensagem.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();

  if (doUsuario) {
    return (
      <article className="anim-entrada flex justify-end">
        <div className="max-w-[min(560px,88%)]">
          <p className="rotulo mb-1 text-right">Você</p>
          <div className="rounded-[4px] border border-linha bg-papel px-3.5 py-2.5 text-[15px] leading-relaxed">
            {textos}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="anim-entrada flex gap-3">
      <div aria-hidden className="mt-1 w-[3px] shrink-0 rounded-full bg-pista" />
      <div className="min-w-0 flex-1">
        <p className="rotulo mb-1.5">Agente Rota Viva</p>
        {textos ? (
          <TextoRico texto={textos} />
        ) : (
          <p className="text-[15px] text-tinta-3">…</p>
        )}
      </div>
    </article>
  );
}
