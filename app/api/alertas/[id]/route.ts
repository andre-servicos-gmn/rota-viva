import { db } from "@/lib/db";
import { viajanteAtual } from "@/lib/traveler";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const viajante = await viajanteAtual();

  await db.priceAlert.deleteMany({ where: { id, travelerId: viajante.id } });
  return Response.json({ ok: true });
}
