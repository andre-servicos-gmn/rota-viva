import { renderToBuffer } from "@react-pdf/renderer";
import { VoucherPDF } from "@/lib/pdf/voucher-pdf";
import { buscarPorLocalizador, lerReserva } from "@/lib/repos/reservas";

export const runtime = "nodejs";

/**
 * Voucher em PDF.
 *
 * Gerado no servidor com @react-pdf/renderer — um PDF de verdade, não uma
 * captura de tela nem um HTML pedindo para imprimir. Reaproveita o desenho do
 * bilhete: perfuração, canhoto e carimbo.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ localizador: string }> },
) {
  const { localizador } = await params;

  if (!/^RV-[A-Z0-9]{6}$/i.test(localizador)) {
    return Response.json({ erro: "Localizador inválido." }, { status: 400 });
  }

  const encontrada = await buscarPorLocalizador(localizador);
  if (!encontrada) {
    return Response.json(
      { erro: `Reserva ${localizador.toUpperCase()} não encontrada.` },
      { status: 404 },
    );
  }

  const reserva = lerReserva(encontrada);

  try {
    const pdf = await renderToBuffer(VoucherPDF({ reserva }));

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        // inline: abre no visualizador do navegador em vez de baixar direto.
        "Content-Disposition": `inline; filename="voucher-${reserva.localizador}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[voucher] falha ao gerar PDF", e);
    return Response.json(
      { erro: "Não consegui gerar o PDF agora. Tente de novo em instantes." },
      { status: 500 },
    );
  }
}
