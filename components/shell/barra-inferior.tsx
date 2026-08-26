"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAVEGACAO } from "./navegacao";

/**
 * Abaixo de lg a sidebar some e vira esta barra. Testada em 375px: cinco alvos
 * de 44px de altura, rótulo curto sob o ícone.
 */
export function BarraInferior() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-noite pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {NAVEGACAO.map((item) => {
          const ativo =
            caminho === item.href || caminho.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] transition-colors",
                  ativo ? "text-pista" : "text-nevoa/60",
                )}
              >
                <item.icone size={18} aria-hidden />
                <span className="truncate">{rotuloCurto(item.rotulo)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function rotuloCurto(rotulo: string) {
  return rotulo === "Minhas reservas" ? "Reservas" : rotulo;
}
