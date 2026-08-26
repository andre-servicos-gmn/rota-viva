import { z } from "zod";
import { db } from "@/lib/db";
import { viajanteAtual } from "@/lib/traveler";

/** Preferências do viajante — as mesmas que a tool `perfilViajante` lê e grava. */
const Corpo = z.object({
  telefone: z.string().max(30).optional(),
  preferencias: z.object({
    assento: z.enum(["corredor", "janela", "indiferente"]).optional(),
    ciaPreferida: z.string().max(60).nullable().optional(),
    restricaoAlimentar: z.string().max(120).nullable().optional(),
    ritmoDeViagem: z.enum(["leve", "normal", "intenso"]).optional(),
    fidelidade: z.array(z.string().max(60)).max(10).optional(),
    orcamentoTipico: z.number().min(0).nullable().optional(),
  }),
});

export async function PATCH(req: Request) {
  let corpo: z.infer<typeof Corpo>;
  try {
    corpo = Corpo.parse(await req.json());
  } catch {
    return Response.json({ erro: "Dados de perfil inválidos." }, { status: 400 });
  }

  const viajante = await viajanteAtual();
  const atuais = JSON.parse(viajante.prefs || "{}");

  await db.traveler.update({
    where: { id: viajante.id },
    data: {
      telefone: corpo.telefone ?? viajante.telefone,
      // Mescla: salvar o assento não pode apagar o que foi dito no chat.
      prefs: JSON.stringify({ ...atuais, ...corpo.preferencias }),
    },
  });

  return Response.json({ ok: true });
}
