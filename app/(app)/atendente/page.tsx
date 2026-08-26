import Link from "next/link";
import { Headset, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { EstadoVazio, Etiqueta } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { FilaDoAtendente } from "@/components/atendente/fila";
import { db } from "@/lib/db";
import { carregarMensagens } from "@/lib/repos/conversas";

export const dynamic = "force-dynamic";

/**
 * Painel do atendente.
 *
 * Área interna sem autenticação nesta POC — o banner diz isso na cara, para que
 * ninguém confunda com um sistema pronto. Em produção seria rota protegida por
 * papel, com sessão e trilha de auditoria de quem assumiu cada conversa.
 */
export default async function PaginaAtendente() {
  const escaladas = await db.conversation.findMany({
    where: { status: { in: ["ESCALATED", "HUMAN"] } },
    orderBy: [{ status: "asc" }, { escaladaEm: "asc" }],
    include: { traveler: true, _count: { select: { mensagens: true } } },
    take: 30,
  });

  const conversas = await Promise.all(
    escaladas.map(async (conversa) => ({
      id: conversa.id,
      titulo: conversa.titulo,
      status: conversa.status,
      atendente: conversa.atendente,
      motivo: conversa.motivoEscalacao,
      resumo: conversa.resumoEscalacao,
      escaladaEm: conversa.escaladaEm?.toISOString() ?? null,
      viajante: conversa.traveler
        ? { nome: conversa.traveler.nome, email: conversa.traveler.email }
        : null,
      totalMensagens: conversa._count.mensagens,
      transcricao: await carregarMensagens(conversa.id),
    })),
  );

  const naFila = conversas.filter((c) => c.status === "ESCALATED");

  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar
        titulo="Painel do atendente"
        sublinha={
          naFila.length > 0
            ? `${naFila.length} conversa${naFila.length === 1 ? "" : "s"} esperando atendimento`
            : "Fila vazia"
        }
        acoes={<Etiqueta tom="lacre">área interna</Etiqueta>}
      />

      <div className="rolagem flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <p className="flex items-start gap-2 rounded-[4px] border border-lacre/30 bg-lacre-fosco p-3 text-[13px] leading-snug">
            <ShieldAlert size={15} aria-hidden className="mt-0.5 shrink-0 text-lacre" />
            <span>
              <strong>Sem autenticação nesta prova de conceito.</strong> Qualquer pessoa
              com o endereço vê a fila e as transcrições. Em produção, esta rota exige
              sessão, papel de atendente e registro de quem abriu cada conversa.
            </span>
          </p>

          {conversas.length === 0 ? (
            <EstadoVazio
              icone={<Headset size={22} />}
              titulo="Nenhuma conversa escalada"
              descricao="Quando o agente passar um caso para humano, ele aparece aqui com a transcrição completa e o resumo do que aconteceu."
              acao={
                <Button asChild variant="contorno" tamanho="sm">
                  <Link href="/chat">Ir para o chat</Link>
                </Button>
              }
            />
          ) : (
            <FilaDoAtendente conversas={conversas} />
          )}
        </div>
      </div>
    </main>
  );
}
