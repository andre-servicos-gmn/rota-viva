import Link from "next/link";
import { Columns3 } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { EstadoVazio } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { TabelaComparativa } from "@/components/comparador/tabela";
import { db } from "@/lib/db";
import { plural } from "@/lib/utils";
import { viajanteAtual } from "@/lib/traveler";

export const dynamic = "force-dynamic";

/**
 * Comparador: o que o usuário favoritou no chat, lado a lado.
 *
 * Compara o snapshot guardado no momento do favorito, não uma busca nova — é o
 * preço que ele viu quando decidiu salvar.
 */
export default async function PaginaComparador() {
  const viajante = await viajanteAtual();

  const favoritos = await db.favorite.findMany({
    where: { conversation: { travelerId: viajante.id } },
    orderBy: { criadoEm: "desc" },
    take: 12,
  });

  const voos = favoritos
    .filter((f) => f.tipo === "FLIGHT")
    .map((f) => ({ id: f.id, refId: f.refId, dados: JSON.parse(f.snapshot) }));
  const hoteis = favoritos
    .filter((f) => f.tipo === "HOTEL")
    .map((f) => ({ id: f.id, refId: f.refId, dados: JSON.parse(f.snapshot) }));

  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar
        titulo="Comparador"
        sublinha={
          favoritos.length > 0
            ? `${plural(voos.length, "voo")} e ${plural(hoteis.length, "hotel", "hotéis")} salvos`
            : "Nada salvo ainda"
        }
      />

      <div className="rolagem flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {favoritos.length === 0 ? (
            <EstadoVazio
              icone={<Columns3 size={22} />}
              titulo="Nenhuma opção salva"
              descricao="No chat, clique no coração de um voo ou hotel para guardá-lo aqui. Depois compare tudo lado a lado, com o preço que você viu na hora."
              acao={
                <Button asChild variant="primaria" tamanho="sm">
                  <Link href="/chat">Buscar opções</Link>
                </Button>
              }
            />
          ) : (
            <TabelaComparativa voos={voos} hoteis={hoteis} />
          )}
        </div>
      </div>
    </main>
  );
}
