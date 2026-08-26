import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/* ---------------------------------------------------------------- Etiqueta */

const tons = {
  neutro: "border-linha-forte text-tinta-2 bg-papel-2",
  taxiway: "border-taxiway/30 text-taxiway bg-taxiway/5",
  eixo: "border-eixo/30 text-eixo bg-eixo-fosco",
  pista: "border-pista/50 text-[#7a5c00] bg-pista-fosco",
  lacre: "border-lacre/30 text-lacre bg-lacre-fosco",
} as const;

export function Etiqueta({
  tom = "neutro",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tom?: keyof typeof tons }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 text-[11px] font-medium",
        tons[tom],
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------- Carregando */

export function Esqueleto({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("anim-pulso rounded-[3px] bg-linha", className)}
      aria-hidden
      {...props}
    />
  );
}

/* ------------------------------------------------------------ Estado vazio */

/**
 * Estado vazio que diz o que fazer em seguida — nunca só "nada por aqui".
 */
export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
  className,
}: {
  icone?: React.ReactNode;
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed border-linha-forte bg-papel-2 px-6 py-12 text-center",
        className,
      )}
    >
      {icone ? <div className="text-tinta-3">{icone}</div> : null}
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-noite">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-tinta-2">{descricao}</p>
      </div>
      {acao}
    </div>
  );
}

/* --------------------------------------------------------- Estado de erro */

/**
 * Erro sempre com saída: diz o que houve e oferece tentar de novo.
 * Usado tanto para falha do modelo quanto para falha de tool.
 */
export function EstadoErro({
  titulo = "Algo falhou aqui",
  detalhe,
  aoTentarNovamente,
  className,
}: {
  titulo?: string;
  detalhe?: string;
  aoTentarNovamente?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-[4px] border border-lacre/30 bg-lacre-fosco p-4",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-lacre">
          {titulo}
        </p>
        {detalhe ? (
          <p className="text-sm text-noite/80">{detalhe}</p>
        ) : null}
      </div>
      {aoTentarNovamente ? (
        <div>
          <Button tamanho="sm" variant="contorno" onClick={aoTentarNovamente}>
            Tentar de novo
          </Button>
        </div>
      ) : null}
    </div>
  );
}
