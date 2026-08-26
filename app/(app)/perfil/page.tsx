import { Topbar } from "@/components/shell/topbar";
import { FormularioDePerfil } from "@/components/perfil/formulario";
import { PainelDeAlertas } from "@/components/perfil/alertas";
import { db } from "@/lib/db";
import { viajanteAtual } from "@/lib/traveler";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const viajante = await viajanteAtual();
  const alertas = await db.priceAlert.findMany({
    where: { travelerId: viajante.id },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar
        titulo="Perfil"
        sublinha="Preferências usadas nas buscas e alertas de preço"
      />

      <div className="rolagem flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <FormularioDePerfil
            nome={viajante.nome}
            email={viajante.email}
            telefone={viajante.telefone ?? ""}
            preferencias={JSON.parse(viajante.prefs || "{}")}
            documentos={JSON.parse(viajante.documentos || "[]")}
          />

          <section id="alertas">
            <h2 className="mb-2 font-display text-[17px] font-semibold">Alertas de preço</h2>
            <PainelDeAlertas
              alertas={alertas.map((a) => ({
                id: a.id,
                origem: a.origem,
                destino: a.destino,
                dataAlvo: a.dataAlvo,
                precoBase: a.precoBase,
                precoAtual: a.precoAtual,
                alvo: a.alvo,
                status: a.status,
                disparadoEm: a.disparadoEm?.toISOString() ?? null,
              }))}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
