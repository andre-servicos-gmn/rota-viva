"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Compass } from "lucide-react";
import { Mensagem } from "./mensagem";
import { Composer } from "./composer";
import { EstadoErro } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProvedorDeAcoes, type ItemFavorito } from "./acoes";

const SUGESTOES = [
  "Voo de São Paulo para Lisboa em outubro",
  "Hotel em Buenos Aires com café da manhã",
  "Monte um roteiro de 5 dias no Rio",
  "Preciso remarcar uma reserva",
];

export function Chat({
  conversaId: idExistente,
  mensagensIniciais,
  perguntaInicial,
}: {
  /** Ausente numa conversa nova: o id nasce no cliente. */
  conversaId?: string;
  mensagensIniciais: UIMessage[];
  /** Vem de /chat?q=... — os botões "remarcar" e "cancelar" das reservas. */
  perguntaInicial?: string;
}) {
  const router = useRouter();

  /*
   * O id precisa ser estável pela vida inteira do componente.
   *
   * Antes ele era gerado no servidor a cada render; quando o `router.refresh()`
   * do fim do stream rodava, vinha um id novo, o React remontava o chat pela
   * key e a conversa inteira sumia da tela — as mensagens ainda estavam sendo
   * gravadas no banco e voltavam vazias. Gerando aqui, refresh nenhum mexe nele.
   */
  const [conversaId] = React.useState(
    () => idExistente ?? globalThis.crypto.randomUUID(),
  );
  const jaSincronizou = React.useRef(Boolean(idExistente));

  const { messages, sendMessage, status, error, regenerate, stop, clearError } =
    useChat({
      id: conversaId,
      messages: mensagensIniciais,
      transport: new DefaultChatTransport({ api: "/api/chat" }),
      onFinish: () => {
        // A primeira resposta é o que cria a conversa no banco: só aí vale
        // atualizar a sidebar e trocar a URL, sem remontar o componente.
        if (!jaSincronizou.current) {
          jaSincronizou.current = true;
          window.history.replaceState(null, "", `/chat/${conversaId}`);
        }
        /*
         * O servidor grava a conversa no onFinish do stream, que corre em
         * paralelo com este callback. Sem a folga, o refresh chega antes do
         * commit e a sidebar continua dizendo "nenhuma conversa ainda".
         */
        setTimeout(() => router.refresh(), 400);
      },
    });

  const ocupado = status === "submitted" || status === "streaming";
  const fim = React.useRef<HTMLDivElement>(null);

  // Favoritos vivem no banco (alimentam o comparador), mas a lista de ids fica
  // aqui para o botão responder na hora, sem esperar o ida e volta.
  const [favoritados, setFavoritados] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelado = false;
    fetch("/api/favoritos")
      .then((r) => (r.ok ? r.json() : { favoritos: [] }))
      .then((dados: { favoritos?: { refId: string }[] }) => {
        if (!cancelado) {
          setFavoritados(new Set((dados.favoritos ?? []).map((f) => f.refId)));
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  const acoes = React.useMemo(
    () => ({
      ocupado,
      favoritados,
      perguntar: (texto: string) => {
        if (!ocupado) void sendMessage({ text: texto });
      },
      favoritar: (item: ItemFavorito) => {
        const jaEstava = favoritados.has(item.refId);

        // Otimista: o coração responde imediatamente e volta atrás se falhar.
        setFavoritados((atual) => {
          const proximo = new Set(atual);
          if (jaEstava) proximo.delete(item.refId);
          else proximo.add(item.refId);
          return proximo;
        });

        fetch("/api/favoritos", {
          method: jaEstava ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, conversationId: conversaId }),
        })
          .then((r) => {
            if (!r.ok) throw new Error("falhou");
            router.refresh();
          })
          .catch(() => {
            setFavoritados((atual) => {
              const proximo = new Set(atual);
              if (jaEstava) proximo.add(item.refId);
              else proximo.delete(item.refId);
              return proximo;
            });
          });
      },
    }),
    [ocupado, favoritados, sendMessage, conversaId, router],
  );

  /*
   * Pergunta que veio pela URL: enviada uma única vez, e a URL é limpa em
   * seguida para que um F5 não reenvie a mesma coisa.
   */
  const jaEnviouInicial = React.useRef(false);
  React.useEffect(() => {
    if (jaEnviouInicial.current) return;
    if (!perguntaInicial || mensagensIniciais.length > 0) return;
    jaEnviouInicial.current = true;
    window.history.replaceState(null, "", "/chat");
    void sendMessage({ text: perguntaInicial });
  }, [perguntaInicial, mensagensIniciais.length, sendMessage]);

  React.useEffect(() => {
    // Sem mensagens não há o que acompanhar — e rolar aqui moveria o ponto de
    // partida da tabulação, fazendo o primeiro Tab pular o "Ir para o conteúdo".
    if (messages.length === 0) return;
    fim.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const vazio = messages.length === 0;

  return (
    <ProvedorDeAcoes valor={acoes}>
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="rolagem flex flex-1 flex-col overflow-y-auto">
        <div
          className={cn(
            "mx-auto w-full max-w-3xl px-4 py-6 sm:px-6",
            // Conversa vazia: o convite fica no meio da tela, não encostado no
            // topo com um vão embaixo.
            vazio && "flex flex-1 flex-col justify-center",
          )}
        >
          {vazio ? (
            <Abertura aoEscolher={(texto) => sendMessage({ text: texto })} />
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <Mensagem key={m.id} mensagem={m} />
              ))}
            </div>
          )}

          {status === "submitted" ? (
            <p className="mt-6 flex items-center gap-2 text-[13px] text-tinta-2">
              <span aria-hidden className="anim-pulso h-1.5 w-1.5 rounded-full bg-pista" />
              O agente está escrevendo…
            </p>
          ) : null}

          {error ? (
            <EstadoErro
              className="mt-6"
              titulo="A resposta não chegou"
              detalhe={mensagemDeErro(error)}
              aoTentarNovamente={() => {
                clearError();
                void regenerate();
              }}
            />
          ) : null}

          <div ref={fim} />
        </div>
      </div>

      <Composer
        ocupado={ocupado}
        onParar={() => void stop()}
        onEnviar={(texto) => void sendMessage({ text: texto })}
      />
    </div>
    </ProvedorDeAcoes>
  );
}

function Abertura({ aoEscolher }: { aoEscolher: (texto: string) => void }) {
  return (
    <div className="py-6">
      <div className="mb-6 flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[3px] bg-noite text-pista"
        >
          <Compass size={18} />
        </span>
        <div>
          <h2 className="text-secao">Para onde vamos?</h2>
          <p className="mt-1 max-w-md text-[15px] text-tinta-2">
            Diga a cidade, as datas e quantas pessoas viajam. Eu procuro voo,
            hotel e monto o roteiro — e explico o porquê de cada escolha.
          </p>
        </div>
      </div>

      <p className="rotulo mb-2">Comece por aqui</p>
      <ul className="flex flex-wrap gap-2">
        {SUGESTOES.map((sugestao) => (
          <li key={sugestao}>
            <Button
              variant="contorno"
              tamanho="sm"
              onClick={() => aoEscolher(sugestao)}
              className="text-left font-normal"
            >
              {sugestao}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function mensagemDeErro(erro: Error) {
  const bruto = erro.message ?? "";
  if (bruto.includes("429")) {
    return "Muitas mensagens seguidas. Espere alguns segundos e tente de novo.";
  }
  if (bruto.toLowerCase().includes("fetch")) {
    return "O servidor não respondeu. Verifique se o app está rodando e tente de novo.";
  }
  return bruto || "Falha inesperada ao falar com o agente.";
}
