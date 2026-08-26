import { z } from "zod";
import { db } from "@/lib/db";
import { consumir, ipDaRequisicao } from "@/lib/rate-limit";

/**
 * Salva o roteiro editado.
 *
 * O corpo é validado inteiro: os blocos vêm de um editor no cliente, e gravar
 * JSON sem forma definida é o tipo de coisa que só dá problema depois, quando a
 * tela tenta renderizar um bloco sem título.
 */
const Bloco = z.object({
  periodo: z.enum(["manha", "tarde", "noite"]),
  horario: z.string().max(10),
  titulo: z.string().min(1).max(160),
  descricao: z.string().max(600),
  duracaoHoras: z.number().min(0).max(24).optional(),
  preco: z.number().min(0).optional(),
  deslocamentoMin: z.number().min(0).max(600).optional(),
  tipo: z.enum(["passeio", "refeicao", "livre", "deslocamento"]),
});

const Corpo = z.object({
  dias: z
    .array(
      z.object({
        numero: z.number().int().min(1).max(60),
        data: z.string().max(10),
        blocos: z.array(Bloco).max(20),
        custoEstimado: z.number().min(0),
      }),
    )
    .min(1)
    .max(30),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const limite = consumir(`roteiro:${ipDaRequisicao(req)}`);
  if (!limite.permitido) {
    return Response.json({ erro: "Espere alguns segundos e salve de novo." }, { status: 429 });
  }

  const { id } = await params;

  let corpo: z.infer<typeof Corpo>;
  try {
    corpo = Corpo.parse(await req.json());
  } catch (e) {
    return Response.json(
      {
        erro: "O roteiro tem um bloco inválido — verifique se todos têm título.",
        detalhe: e instanceof Error ? e.message : undefined,
      },
      { status: 400 },
    );
  }

  const existente = await db.itinerary.findUnique({ where: { id } });
  if (!existente) {
    return Response.json({ erro: "Roteiro não encontrado." }, { status: 404 });
  }

  await db.itinerary.update({
    where: { id },
    data: { dias: JSON.stringify(corpo.dias) },
  });

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.itinerary.deleteMany({ where: { id } });
  return Response.json({ ok: true });
}
