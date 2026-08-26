import Link from "next/link";
import { Route } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { EstadoVazio } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { EditorDeRoteiro } from "@/components/roteiro/editor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PaginaRoteiro({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const roteiros = await db.itinerary.findMany({
    orderBy: { atualizadoEm: "desc" },
    take: 10,
  });

  const atual = id ? roteiros.find((r) => r.id === id) ?? null : roteiros[0] ?? null;

  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar
        titulo="Roteiro"
        sublinha={atual ? atual.titulo : "Nenhum roteiro montado ainda"}
      />

      <div className="rolagem flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {!atual ? (
            <EstadoVazio
              icone={<Route size={22} />}
              titulo="Nenhum roteiro ainda"
              descricao="Peça um roteiro no chat — por exemplo, 'monte 4 dias em Lisboa' — e ele aparece aqui para você editar dia a dia."
              acao={
                <Button asChild variant="primaria" tamanho="sm">
                  <Link href="/chat">Montar um roteiro</Link>
                </Button>
              }
            />
          ) : (
            <>
              {roteiros.length > 1 ? (
                <nav aria-label="Outros roteiros" className="flex flex-wrap gap-1.5">
                  {roteiros.map((roteiro) => (
                    <Button
                      key={roteiro.id}
                      asChild
                      variant={roteiro.id === atual.id ? "escura" : "contorno"}
                      tamanho="sm"
                    >
                      <Link href={`/roteiro?id=${roteiro.id}`}>{roteiro.titulo}</Link>
                    </Button>
                  ))}
                </nav>
              ) : null}

              <EditorDeRoteiro
                id={atual.id}
                titulo={atual.titulo}
                destino={atual.destino}
                diasIniciais={JSON.parse(atual.dias)}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
