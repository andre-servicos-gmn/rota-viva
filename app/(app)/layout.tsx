import { Sidebar } from "@/components/shell/sidebar";
import { BarraInferior } from "@/components/shell/barra-inferior";
import { listarConversas } from "@/lib/repos/conversas";
import { viajanteAtual } from "@/lib/traveler";

// O shell lê banco a cada navegação: nada aqui pode ser estático.
export const dynamic = "force-dynamic";

export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const viajante = await viajanteAtual();
  const conversas = await listarConversas(viajante.id);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        viajante={{ nome: viajante.nome, email: viajante.email }}
        conversas={conversas.map((c) => ({
          id: c.id,
          titulo: c.titulo,
          status: c.status,
          atualizadaEm: c.atualizadaEm.toISOString(),
        }))}
      />

      {/* pb-[52px] abre espaço para a barra inferior no mobile. */}
      <div className="flex min-w-0 flex-1 pb-[52px] lg:pb-0">{children}</div>

      <BarraInferior />
    </div>
  );
}
