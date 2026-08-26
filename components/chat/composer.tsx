"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Campo de escrita. Enter envia, Shift+Enter quebra linha — o comportamento que
 * quem usa chat já espera. A altura acompanha o texto até um teto.
 */
export function Composer({
  onEnviar,
  onParar,
  ocupado,
}: {
  onEnviar: (texto: string) => void;
  onParar: () => void;
  ocupado: boolean;
}) {
  const [valor, setValor] = React.useState("");
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const ajustarAltura = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  const enviar = () => {
    const texto = valor.trim();
    if (!texto || ocupado) return;
    onEnviar(texto);
    setValor("");
    requestAnimationFrame(ajustarAltura);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
      className="border-t border-linha bg-papel px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[4px] border border-linha-forte bg-papel-2 p-2 focus-within:border-taxiway">
        <label htmlFor="mensagem" className="sr-only">
          Escreva para o agente
        </label>
        <textarea
          id="mensagem"
          ref={ref}
          rows={1}
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            ajustarAltura();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Para onde você quer ir?"
          className="max-h-[180px] min-h-[36px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-tinta-3"
        />

        {ocupado ? (
          <Button
            type="button"
            variant="contorno"
            tamanho="icone"
            onClick={onParar}
            aria-label="Parar a resposta"
            title="Parar a resposta"
          >
            <Square size={14} aria-hidden />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primaria"
            tamanho="icone"
            disabled={!valor.trim()}
            aria-label="Enviar mensagem"
            title="Enviar mensagem"
          >
            <ArrowUp size={16} aria-hidden />
          </Button>
        )}
      </div>

      <p className="mx-auto mt-2 max-w-3xl text-[11px] text-tinta-3">
        Enter envia · Shift + Enter quebra linha · dados de demonstração, sem cobrança real
      </p>
    </form>
  );
}
