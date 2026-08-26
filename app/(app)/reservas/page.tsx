import Link from "next/link";
import { Ticket } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { EstadoVazio } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Voucher } from "@/components/results/voucher";
import { listarDoViajante, lerReserva } from "@/lib/repos/reservas";
import { viajanteAtual } from "@/lib/traveler";
import { brl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaginaReservas() {
  const viajante = await viajanteAtual();
  const reservas = (await listarDoViajante(viajante.id)).map(lerReserva);

  const ativas = reservas.filter((r) => r.status !== "CANCELLED");
  const canceladas = reservas.filter((r) => r.status === "CANCELLED");
  const totalInvestido = ativas.reduce((soma, r) => soma + r.total, 0);

  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar
        titulo="Minhas reservas"
        sublinha={
          reservas.length > 0
            ? `${ativas.length} ativa${ativas.length === 1 ? "" : "s"} · ${brl(totalInvestido)} no total`
            : "Nenhuma reserva emitida ainda"
        }
      />

      <div className="rolagem flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {reservas.length === 0 ? (
            <EstadoVazio
              icone={<Ticket size={22} />}
              titulo="Nenhuma reserva ainda"
              descricao="Quando você fechar uma viagem no chat, o voucher aparece aqui — com o PDF e os botões de alterar e cancelar."
              acao={
                <Button asChild variant="primaria" tamanho="sm">
                  <Link href="/chat">Buscar uma viagem</Link>
                </Button>
              }
            />
          ) : null}

          {ativas.length > 0 ? (
            <section className="space-y-2.5">
              <h2 className="rotulo">Ativas</h2>
              {ativas.map((reserva) => (
                <Voucher
                  key={reserva.localizador}
                  localizador={reserva.localizador}
                  status={reserva.status}
                  voo={reserva.snapshot.voo}
                  hotel={reserva.snapshot.hotel}
                  passageiros={reserva.snapshot.passageiros}
                  contato={reserva.snapshot.contato}
                  total={reserva.total}
                  emitidaEm={reserva.criadaEm.toISOString()}
                />
              ))}
            </section>
          ) : null}

          {canceladas.length > 0 ? (
            <section className="space-y-2.5">
              <h2 className="rotulo">Canceladas</h2>
              {canceladas.map((reserva) => (
                <Voucher
                  key={reserva.localizador}
                  localizador={reserva.localizador}
                  status={reserva.status}
                  voo={reserva.snapshot.voo}
                  hotel={reserva.snapshot.hotel}
                  passageiros={reserva.snapshot.passageiros}
                  total={reserva.total}
                  emitidaEm={reserva.criadaEm.toISOString()}
                  compacto
                />
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
