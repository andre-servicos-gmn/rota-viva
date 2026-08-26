import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, XCircle } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Button } from "@/components/ui/button";
import { Voucher } from "@/components/results/voucher";
import { CartaoPolitica } from "@/components/results/complementos";
import { buscarPorLocalizador, calcularPolitica, lerReserva } from "@/lib/repos/reservas";
import { brl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Detalhe da reserva.
 *
 * Os botões de alterar e cancelar não executam nada aqui: eles abrem o chat com
 * a pergunta já escrita. A decisão continua passando pelo agente, que mostra
 * multa e reembolso antes de qualquer confirmação — um caminho só, uma regra só.
 */
export default async function PaginaReserva({
  params,
}: {
  params: Promise<{ localizador: string }>;
}) {
  const { localizador } = await params;
  const encontrada = await buscarPorLocalizador(localizador);
  if (!encontrada) notFound();

  const reserva = lerReserva(encontrada);
  const politica = calcularPolitica(
    reserva.regras,
    reserva.total,
    reserva.dataDeInicio,
    reserva.criadaEm,
  );

  const cancelada = reserva.status === "CANCELLED";

  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar
        titulo={`Reserva ${reserva.localizador}`}
        sublinha={`${reserva.viajante.nome} · ${brl(reserva.total)}`}
        acoes={
          <Button asChild variant="fantasma" tamanho="sm">
            <Link href="/reservas">
              <ArrowLeft size={14} aria-hidden />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="rolagem flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <Voucher
            localizador={reserva.localizador}
            status={reserva.status}
            voo={reserva.snapshot.voo}
            hotel={reserva.snapshot.hotel}
            passageiros={reserva.snapshot.passageiros}
            contato={reserva.snapshot.contato}
            total={reserva.total}
            emitidaEm={reserva.criadaEm.toISOString()}
            compacto
          />

          {!cancelada ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="contorno">
                <a href={`/api/reservas/${reserva.localizador}/voucher`} target="_blank" rel="noreferrer">
                  <Download size={15} aria-hidden />
                  Baixar voucher em PDF
                </a>
              </Button>

              <Button asChild variant="taxiway" tamanho="md">
                <Link
                  href={`/chat?q=${encodeURIComponent(
                    `Quero remarcar a reserva ${reserva.localizador}.`,
                  )}`}
                >
                  <CalendarClock size={15} aria-hidden />
                  Remarcar no chat
                </Link>
              </Button>

              <Button asChild variant="perigo">
                <Link
                  href={`/chat?q=${encodeURIComponent(
                    `Quero cancelar a reserva ${reserva.localizador}.`,
                  )}`}
                >
                  <XCircle size={15} aria-hidden />
                  Cancelar no chat
                </Link>
              </Button>
            </div>
          ) : (
            <p className="rounded-[4px] border border-linha bg-papel-2 p-3 text-[13px] text-tinta-2">
              Esta reserva foi cancelada. Para uma viagem nova,{" "}
              <Link href="/chat" className="text-taxiway underline">
                comece uma busca no chat
              </Link>
              .
            </p>
          )}

          <CartaoPolitica
            dados={{
              localizador: reserva.localizador,
              tarifa: reserva.regras,
              politica,
            }}
          />

          <section className="rounded-[4px] border border-linha bg-papel">
            <header className="border-b border-linha px-4 py-2.5">
              <h2 className="font-display text-[15px] font-semibold">Histórico</h2>
            </header>
            <ol className="p-4">
              {reserva.eventos.map((evento, i) => (
                <li key={i} className="flex gap-3 pb-3 last:pb-0">
                  <span
                    aria-hidden
                    className={
                      evento.tipo === "CANCELLED"
                        ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-lacre"
                        : evento.tipo === "CHANGED"
                          ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-taxiway"
                          : "mt-1 h-2 w-2 shrink-0 rounded-full bg-eixo"
                    }
                  />
                  <div className="min-w-0 text-[13px]">
                    <p className="font-medium">
                      {
                        {
                          CREATED: "Reserva emitida",
                          CHANGED: "Reserva alterada",
                          CANCELLED: "Reserva cancelada",
                        }[evento.tipo as string]
                      }
                    </p>
                    <p className="text-[12px] text-tinta-2">
                      {evento.criadoEm.toLocaleString("pt-BR")}
                      {evento.multa > 0 ? ` · multa de ${brl(evento.multa)}` : ""}
                      {evento.diferenca > 0 ? ` · diferença de ${brl(evento.diferenca)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
