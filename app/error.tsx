"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Nenhuma falha vira tela em branco: diz o que houve e oferece a próxima ação.
 */
export default function ErroDaRota({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[rota-viva] erro de renderização", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-nevoa p-6">
      <div className="w-full max-w-md">
        <div aria-hidden className="faixa-pista mb-5 h-[3px] w-12 rounded-full" />
        <p className="rotulo">Falha na tela</p>
        <h1 className="mt-1 text-secao">Alguma coisa quebrou aqui</h1>
        <p className="mt-2 text-[15px] text-tinta-2">
          A página não conseguiu carregar. Tentar de novo costuma resolver; se
          insistir, verifique o terminal onde o servidor está rodando.
        </p>
        {error.digest ? (
          <p className="codigo mt-3 text-[12px] text-tinta-3">
            id do erro: {error.digest}
          </p>
        ) : null}
        <div className="mt-5">
          <Button variant="primaria" onClick={reset}>
            Tentar de novo
          </Button>
        </div>
      </div>
    </main>
  );
}
