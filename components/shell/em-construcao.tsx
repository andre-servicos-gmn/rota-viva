import Link from "next/link";
import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/ui/feedback";
import { Topbar } from "@/components/shell/topbar";

/**
 * Área ainda não construída.
 *
 * Existe para que nenhum link da navegação leve a lugar nenhum durante a
 * construção — e para dizer, sem rodeio, em que fase a tela entra e o que fazer
 * enquanto isso.
 */
export function EmConstrucao({
  titulo,
  fase,
  descricao,
}: {
  titulo: string;
  fase: number;
  descricao: string;
}) {
  return (
    <main id="conteudo" className="flex min-w-0 flex-1 flex-col">
      <Topbar titulo={titulo} sublinha={`Entra na fase ${fase} da construção`} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <EstadoVazio
          icone={<HardHat size={22} />}
          titulo={`${titulo} entra na fase ${fase}`}
          descricao={descricao}
          acao={
            <Button asChild variant="primaria" tamanho="sm">
              <Link href="/chat">Voltar para o chat</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
