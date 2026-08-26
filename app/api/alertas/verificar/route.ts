import { db } from "@/lib/db";
import { provedores } from "@/lib/providers";
import { viajanteAtual } from "@/lib/traveler";
import { consumir, ipDaRequisicao } from "@/lib/rate-limit";
import { HOJE_ISO, diferencaEmDias } from "@/lib/datas";

/**
 * Job de alerta de preço, disparado manualmente pela UI.
 *
 * Em produção isto seria um cron: percorre os alertas ativos, refaz a busca e
 * notifica por e-mail ou push quando o preço cai. Aqui o botão faz o papel do
 * agendador — e a tela diz isso ao usuário, para não simular o que não existe.
 *
 * Como os mocks são determinísticos, uma segunda verificação no mesmo dia
 * devolveria sempre o mesmo número. Por isso a busca considera a proximidade da
 * data: conforme os dias passam, o fator de antecedência muda o preço de
 * verdade — o mesmo mecanismo que faz passagem encarecer perto da viagem.
 */
export async function POST(req: Request) {
  const limite = consumir(`alertas:${ipDaRequisicao(req)}`, 2);
  if (!limite.permitido) {
    return Response.json(
      { erro: `Espere ${limite.esperarSegundos}s para verificar de novo.` },
      { status: 429 },
    );
  }

  const viajante = await viajanteAtual();
  const alertas = await db.priceAlert.findMany({
    where: { travelerId: viajante.id, status: "ATIVO" },
  });

  let caiu = 0;
  let verificados = 0;

  for (const alerta of alertas) {
    // Alerta de data já vencida não faz sentido continuar consultando.
    if (diferencaEmDias(HOJE_ISO(), alerta.dataAlvo) < 0) {
      await db.priceAlert.update({
        where: { id: alerta.id },
        data: { status: "EXPIRADO" },
      });
      continue;
    }

    try {
      const busca = await provedores.voos.buscar({
        origem: alerta.origem,
        destino: alerta.destino,
        dataIda: alerta.dataAlvo,
        adultos: 1,
        limite: 1,
      });

      const preco = busca.opcoes[0]?.precoTotal;
      if (!preco) continue;

      verificados += 1;
      const baixou = preco < alerta.precoAtual;
      const atingiuAlvo = alerta.alvo !== null && preco <= alerta.alvo;
      if (baixou) caiu += 1;

      await db.priceAlert.update({
        where: { id: alerta.id },
        data: {
          precoAtual: preco,
          disparadoEm: baixou || atingiuAlvo ? new Date() : alerta.disparadoEm,
        },
      });
    } catch (e) {
      console.error("[alertas] falha ao verificar", alerta.id, e);
    }
  }

  return Response.json({ ok: true, verificados, caiu });
}
