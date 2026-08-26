import { z } from "zod";
import { db } from "@/lib/db";
import { viajanteAtual } from "@/lib/traveler";
import { consumir, ipDaRequisicao } from "@/lib/rate-limit";

/**
 * Favoritos do chat — o que alimenta o comparador.
 *
 * Guardamos o snapshot inteiro da opção, não só o id: no comparador o usuário
 * precisa ver o preço que ele viu quando favoritou, mesmo que a busca mude.
 */

const Entrada = z.object({
  tipo: z.enum(["FLIGHT", "HOTEL"]),
  refId: z.string().min(3).max(200),
  snapshot: z.unknown(),
  conversationId: z.string().max(64).optional(),
});

export async function GET() {
  const viajante = await viajanteAtual();

  const favoritos = await db.favorite.findMany({
    where: { conversation: { travelerId: viajante.id } },
    orderBy: { criadoEm: "desc" },
    take: 40,
  });

  return Response.json({
    favoritos: favoritos.map((f) => ({
      id: f.id,
      tipo: f.tipo,
      refId: f.refId,
      snapshot: JSON.parse(f.snapshot),
      criadoEm: f.criadoEm,
    })),
  });
}

export async function POST(req: Request) {
  const limite = consumir(`fav:${ipDaRequisicao(req)}`, 0.5);
  if (!limite.permitido) {
    return Response.json({ erro: "Espere um instante e tente de novo." }, { status: 429 });
  }

  let entrada: z.infer<typeof Entrada>;
  try {
    entrada = Entrada.parse(await req.json());
  } catch {
    return Response.json({ erro: "Dados inválidos para favoritar." }, { status: 400 });
  }

  const viajante = await viajanteAtual();

  // O favorito precisa de uma conversa: se a informada não existir, cria uma
  // avulsa para não perder o item que o usuário acabou de salvar.
  let conversationId = entrada.conversationId;
  if (conversationId) {
    const existe = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!existe) conversationId = undefined;
  }
  if (!conversationId) {
    const nova = await db.conversation.create({
      data: { travelerId: viajante.id, titulo: "Comparação" },
    });
    conversationId = nova.id;
  }

  const favorito = await db.favorite.upsert({
    where: { conversationId_refId: { conversationId, refId: entrada.refId } },
    update: { snapshot: JSON.stringify(entrada.snapshot) },
    create: {
      conversationId,
      tipo: entrada.tipo,
      refId: entrada.refId,
      snapshot: JSON.stringify(entrada.snapshot),
    },
  });

  return Response.json({ ok: true, id: favorito.id });
}

export async function DELETE(req: Request) {
  let entrada: { refId?: string };
  try {
    entrada = await req.json();
  } catch {
    return Response.json({ erro: "Dados inválidos." }, { status: 400 });
  }

  if (!entrada.refId) {
    return Response.json({ erro: "Informe o refId." }, { status: 400 });
  }

  const viajante = await viajanteAtual();
  await db.favorite.deleteMany({
    where: { refId: entrada.refId, conversation: { travelerId: viajante.id } },
  });

  return Response.json({ ok: true });
}
