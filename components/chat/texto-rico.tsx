import * as React from "react";

/**
 * Renderizador de texto do agente.
 *
 * Deliberadamente mínimo: parágrafos, listas, negrito e código inline. Não
 * interpreta HTML — o texto vem de um modelo, e injetar HTML de modelo em página
 * é como colar `dangerouslySetInnerHTML` num campo de formulário.
 */
export function TextoRico({ texto }: { texto: string }) {
  const blocos = texto.split(/\n{2,}/);

  return (
    <div className="space-y-3">
      {blocos.map((bloco, i) => {
        const linhas = bloco.split("\n");
        const ehLista = linhas.every((l) => /^\s*[-*]\s+/.test(l));

        if (ehLista) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {linhas.map((linha, j) => (
                <li key={j} className="flex gap-2 text-[15px] leading-relaxed">
                  <span aria-hidden className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-taxiway" />
                  <span>{inline(linha.replace(/^\s*[-*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-[15px] leading-relaxed">
            {linhas.map((linha, j) => (
              <React.Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(linha)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Negrito (**), código inline (`) — nada além disso. */
function inline(trecho: string): React.ReactNode[] {
  const partes = trecho.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);

  return partes.filter(Boolean).map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-noite">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    // Itálico usa asterisco, não sublinhado: com `_texto_`, o primeiro
    // sublinhado de um nome como XAI_API_KEY fechava o itálico no lugar errado.
    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) {
      return (
        <em key={i} className="text-tinta-2">
          {parte.slice(1, -1)}
        </em>
      );
    }
    if (parte.startsWith("`") && parte.endsWith("`") && parte.length > 2) {
      return (
        <code
          key={i}
          className="rounded-[2px] bg-nevoa px-1 py-0.5 font-mono text-[13px] text-taxiway"
        >
          {parte.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{parte}</React.Fragment>;
  });
}
