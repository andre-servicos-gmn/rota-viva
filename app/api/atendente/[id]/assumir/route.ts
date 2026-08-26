import { db } from "@/lib/db";
import { consumir, ipDaRequisicao } from "@/lib/rate-limit";

/**
 * Atendente assume uma conversa escalada.
 *
 * Sem autenticação nesta POC: o nome do atendente é fixo. Em produção, viria da
 * sessão, e a rota exigiria papel de atendimento — é o ponto onde entraria o
 * controle de acesso.
 */
const ATENDENTE_DEMO = "Marcos Aguiar";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limite = consumir(`atendente:${ipDaRequisicao(req)}`);
  if (!limite.permitido) {
    return Response.json({ erro: "Espere alguns segundos." }, { status: 429 });
  }

  const { id } = await params;

  const conversa = await db.conversation.findUnique({ where: { id } });
  if (!conversa) {
    return Response.json({ erro: "Conversa não encontrada." }, { status: 404 });
  }
  if (conversa.status === "HUMAN") {
    return Response.json(
      { erro: `Esta conversa já está com ${conversa.atendente ?? "outro atendente"}.` },
      { status: 409 },
    );
  }

  await db.conversation.update({
    where: { id },
    data: { status: "HUMAN", atendente: ATENDENTE_DEMO },
  });

  return Response.json({ ok: true, atendente: ATENDENTE_DEMO });
}
