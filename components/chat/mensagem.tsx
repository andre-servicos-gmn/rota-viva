"use client";

import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { TextoRico } from "./texto-rico";
import { ResultadoDeFerramenta, FalhaDeFerramenta } from "@/components/results";
import { FerramentaRodando } from "./ferramenta-rodando";

/**
 * Uma mensagem no chat.
 *
 * O agente não fala em balão: fala numa faixa de despacho, com filete amarelo à
 * esquerda. As partes de tool viram componentes ricos — quando a busca de voos
 * responde, aparece o bilhete, não um bloco de JSON nem um resumo em texto.
 */
export function Mensagem({ mensagem }: { mensagem: UIMessage }) {
  const doUsuario = mensagem.role === "user";
  const partes = mensagem.parts ?? [];

  if (doUsuario) {
    const texto = partes
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n")
      .trim();

    return (
      <article className="anim-entrada flex justify-end">
        <div className="max-w-[min(560px,88%)]">
          <p className="rotulo mb-1 text-right">Você</p>
          <div className="rounded-[4px] border border-linha bg-papel px-3.5 py-2.5 text-[15px] leading-relaxed">
            {texto}
          </div>
        </div>
      </article>
    );
  }

  const temConteudo = partes.some(
    (p) => (p.type === "text" && p.text.trim()) || isToolUIPart(p),
  );

  return (
    <article className="anim-entrada flex gap-3">
      <div aria-hidden className="mt-1 w-[3px] shrink-0 rounded-full bg-pista" />
      <div className="min-w-0 flex-1 space-y-3">
        <p className="rotulo">Agente Rota Viva</p>

        {partes.map((parte, i) => {
          if (parte.type === "text") {
            return parte.text.trim() ? (
              <TextoRico key={i} texto={parte.text} />
            ) : null;
          }

          if (isToolUIPart(parte)) {
            const nome = getToolName(parte);

            switch (parte.state) {
              case "input-streaming":
              case "input-available":
                return <FerramentaRodando key={i} nome={nome} entrada={parte.input} />;

              case "output-available":
                return <ResultadoDeFerramenta key={i} saida={parte.output} />;

              case "output-error":
                return (
                  <FalhaDeFerramenta
                    key={i}
                    erro="A busca não completou."
                    sugestao={parte.errorText ?? "Peça para tentar de novo."}
                  />
                );

              default:
                return null;
            }
          }

          return null;
        })}

        {!temConteudo ? <p className="text-[15px] text-tinta-3">…</p> : null}
      </div>
    </article>
  );
}
