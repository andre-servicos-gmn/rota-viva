import { cn } from "@/lib/utils";

/**
 * Cabeçalho da área principal. Em telas estreitas ele também carrega a marca,
 * já que a sidebar está escondida.
 */
export function Topbar({
  titulo,
  sublinha,
  acoes,
  className,
}: {
  titulo: string;
  sublinha?: string;
  acoes?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-linha bg-papel px-4 py-3 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="rotulo lg:hidden">Rota Viva</p>
        <h1 className="truncate text-[19px] leading-tight sm:text-secao">{titulo}</h1>
        {sublinha ? (
          <p className="mt-0.5 truncate text-[13px] text-tinta-2">{sublinha}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </header>
  );
}
