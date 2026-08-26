import { notFound } from "next/navigation";
import { Chat } from "@/components/chat/chat";
import { PainelContexto } from "@/components/shell/painel-contexto";
import { PainelDoChat } from "@/components/chat/painel-do-chat";
import { Topbar } from "@/components/shell/topbar";
import { Etiqueta } from "@/components/ui/feedback";
import { nomeDoModelo, temCredenciais } from "@/lib/ai/provider";
import { carregarMensagens } from "@/lib/repos/conversas";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PaginaChat({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}) {
  const { id } = await params;
  const conversaId = id?.[0];

  // /chat/algo/coisa não é uma rota nossa.
  if (id && id.length > 1) notFound();

  const conversa = conversaId
    ? await db.conversation.findUnique({ where: { id: conversaId } })
    : null;

  if (conversaId && !conversa) notFound();

  const mensagens = conversa ? await carregarMensagens(conversa.id) : [];
  const comModelo = temCredenciais();

  return (
    <main id="conteudo" className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          titulo={conversa?.titulo ?? "Nova conversa"}
          sublinha={
            conversa?.status === "ESCALATED"
              ? "Conversa na fila do atendimento humano"
              : "Voos, hotéis, roteiros e suporte — dados de demonstração"
          }
          acoes={
            <Etiqueta tom={comModelo ? "eixo" : "pista"}>
              {comModelo ? nomeDoModelo() : "modo demonstração"}
            </Etiqueta>
          }
        />

        <Chat
          key={conversa?.id ?? "nova"}
          conversaId={conversa?.id}
          mensagensIniciais={mensagens}
        />
      </div>

      <PainelContexto titulo="Contexto">
        <PainelDoChat comModelo={comModelo} modelo={nomeDoModelo()} />
      </PainelContexto>
    </main>
  );
}
