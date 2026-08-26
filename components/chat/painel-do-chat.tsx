import { Check, Circle } from "lucide-react";
import { Etiqueta } from "@/components/ui/feedback";

/**
 * Conteúdo do painel de contexto na tela de chat.
 *
 * Na fase 1 ele mostra o estado do agente e o que já está de pé — informação
 * honesta durante a construção. Nas fases seguintes vira o lugar dos favoritos,
 * do resumo da busca em andamento e do carrinho do pacote.
 */

const ENTREGAS = [
  { fase: 1, titulo: "Chat, streaming e histórico", pronto: true },
  { fase: 2, titulo: "Voos, hotéis, pacote e roteiro", pronto: false },
  { fase: 3, titulo: "Reserva, pós-venda e suporte", pronto: false },
  { fase: 4, titulo: "Comparador, perfil e extras", pronto: false },
  { fase: 5, titulo: "Polimento e roteiro de demo", pronto: false },
];

export function PainelDoChat({
  comModelo,
  modelo,
}: {
  comModelo: boolean;
  modelo: string;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="rotulo mb-2">Agente</h3>
        <div className="rounded-[4px] border border-linha bg-papel p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-tinta-2">Modelo</span>
            <Etiqueta tom={comModelo ? "eixo" : "pista"}>
              {comModelo ? "conectado" : "desligado"}
            </Etiqueta>
          </div>
          <p className="codigo mt-1.5 text-[13px] text-noite">{modelo}</p>
          {!comModelo ? (
            <p className="mt-2 text-[12px] leading-snug text-tinta-2">
              Sem <span className="codigo text-[11px]">XAI_API_KEY</span> no{" "}
              <span className="codigo text-[11px]">.env.local</span>, as respostas
              são locais. A interface e o histórico funcionam do mesmo jeito.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="rotulo mb-2">Construção da POC</h3>
        <ul className="space-y-1.5">
          {ENTREGAS.map((entrega) => (
            <li key={entrega.fase} className="flex items-start gap-2 text-[13px]">
              <span
                aria-hidden
                className={
                  entrega.pronto ? "mt-0.5 text-eixo" : "mt-0.5 text-linha-forte"
                }
              >
                {entrega.pronto ? <Check size={14} /> : <Circle size={14} />}
              </span>
              <span className={entrega.pronto ? "text-noite" : "text-tinta-3"}>
                <span className="codigo mr-1.5 text-[11px]">F{entrega.fase}</span>
                {entrega.titulo}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="rotulo mb-2">Aviso</h3>
        <p className="text-[12px] leading-snug text-tinta-2">
          Prova de conceito. Voos, hotéis, preços e regras são fictícios; nenhuma
          reserva real é emitida e nenhum pagamento é processado.
        </p>
      </section>
    </div>
  );
}
