import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-nevoa p-6">
      <div className="w-full max-w-md">
        <div aria-hidden className="faixa-pista mb-5 h-[3px] w-12 rounded-full" />
        <p className="rotulo">Erro 404</p>
        <h1 className="mt-1 text-secao">Essa página não existe</h1>
        <p className="mt-2 text-[15px] text-tinta-2">
          O endereço pode ter mudado, ou a conversa que você procura foi apagada.
        </p>
        <div className="mt-5">
          <Button asChild variant="primaria">
            <Link href="/chat">Voltar para o chat</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
