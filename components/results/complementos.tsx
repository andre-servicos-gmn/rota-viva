"use client";

import {
  BadgeCheck,
  BookOpen,
  Car,
  Coins,
  CreditCard,
  FileText,
  Headset,
  LifeBuoy,
  Stamp,
  Ticket,
  Wallet,
  XCircle,
} from "lucide-react";
import { brl, cn, duracao } from "@/lib/utils";
import { dataCurta } from "@/lib/utils";
import { Etiqueta } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { useAcoes } from "@/components/chat/acoes";

/**
 * Cards dos resultados complementares.
 *
 * Todos seguem a mesma gramática: um cabeçalho com rótulo em mono, corpo em
 * papel e valores tabulares. Só o bilhete (voo, hotel, voucher) usa a perfuração
 * — se tudo fosse bilhete, nada seria.
 */

function Bloco({
  icone,
  titulo,
  sufixo,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  sufixo?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="anim-entrada rounded-[4px] border border-linha bg-papel">
      <header className="flex flex-wrap items-center gap-2 border-b border-linha px-4 py-2.5">
        <span aria-hidden className="text-tinta-3">
          {icone}
        </span>
        <h3 className="font-display text-[15px] font-semibold">{titulo}</h3>
        {sufixo ? <div className="ml-auto">{sufixo}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------- Política */

export function CartaoPolitica({ dados }: { dados: Record<string, any> }) {
  const { tarifa, politica, bloqueio } = dados;

  return (
    <Bloco
      icone={<FileText size={15} />}
      titulo={`Regras da tarifa ${tarifa.nome}`}
      sufixo={<span className="codigo text-[12px] text-tinta-2">{dados.localizador}</span>}
    >
      <p className="mb-3 text-[14px] leading-relaxed">{politica.motivo}</p>

      {bloqueio ? (
        <p className="mb-3 rounded-[3px] bg-lacre-fosco p-2.5 text-[13px] text-noite">
          {bloqueio}
        </p>
      ) : null}

      <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
        <Linha rotulo="Reembolsável" valor={tarifa.reembolsavel ? "sim" : "não"} tom={tarifa.reembolsavel ? "eixo" : "lacre"} />
        <Linha rotulo="Remarcável" valor={tarifa.remarcavel ? "sim" : "não"} tom={tarifa.remarcavel ? "eixo" : "lacre"} />
        <Linha rotulo="Multa de remarcação" valor={tarifa.multaRemarcacao > 0 ? brl(tarifa.multaRemarcacao) : "sem multa"} />
        <Linha rotulo="Multa de cancelamento" valor={politica.multaCancelamento > 0 ? brl(politica.multaCancelamento) : "sem multa"} />
        <Linha rotulo="Prazo limite" valor={`${tarifa.prazoLimiteHoras} h antes do voo`} />
        <Linha rotulo="Bagagem despachada" valor={tarifa.bagagemDespachada > 0 ? `${tarifa.bagagemDespachada} peça(s)` : "não inclusa"} />
        <Linha rotulo="Bagagem de mão" valor={`${tarifa.bagagemMaoKg} kg`} />
        <Linha rotulo="Marcação de assento" valor={tarifa.marcaAssento ? "inclusa" : "paga à parte"} />
      </dl>

      {politica.valorReembolsado > 0 ? (
        <p className="mt-3 border-t border-linha pt-2.5 text-[13px]">
          Cancelando hoje, voltariam{" "}
          <span data-valor className="font-semibold text-eixo">
            {brl(politica.valorReembolsado)}
          </span>{" "}
          em até 30 dias.
        </p>
      ) : null}
    </Bloco>
  );
}

function Linha({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: string;
  tom?: "eixo" | "lacre";
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-linha pb-1 last:border-0">
      <dt className="text-tinta-2">{rotulo}</dt>
      <dd
        data-valor
        className={cn(
          "text-right",
          tom === "eixo" && "text-eixo",
          tom === "lacre" && "text-lacre",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

/* --------------------------------------------------------- Documentação */

export function CartaoDocumentacao({ dados }: { dados: Record<string, any> }) {
  const e = dados.exigencias;

  return (
    <Bloco
      icone={<Stamp size={15} />}
      titulo={`Entrada em ${e.pais}`}
      sufixo={<span className="rotulo">passaporte {e.nacionalidade}</span>}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Etiqueta tom={e.visto.necessario ? "lacre" : "eixo"}>
            {e.visto.necessario ? `Visto: ${e.visto.tipo}` : "Sem visto para turismo"}
          </Etiqueta>
          <Etiqueta tom={e.passaporte.obrigatorio ? "taxiway" : "neutro"}>
            {e.passaporte.obrigatorio
              ? `Passaporte válido por ${e.passaporte.validadeMinimaMeses} meses`
              : "Passaporte dispensado"}
          </Etiqueta>
          {e.permanenciaMaximaDias ? (
            <Etiqueta>Até {e.permanenciaMaximaDias} dias</Etiqueta>
          ) : null}
        </div>

        {e.visto.observacao ? (
          <p className="text-[13px] leading-relaxed">{e.visto.observacao}</p>
        ) : null}

        {e.vacinas.length > 0 ? (
          <div>
            <p className="rotulo mb-1">Vacinas</p>
            <ul className="space-y-1 text-[13px]">
              {e.vacinas.map((v: any) => (
                <li key={v.nome}>
                  <span className={v.obrigatoria ? "font-medium text-lacre" : ""}>
                    {v.nome}
                  </span>
                  {v.obrigatoria ? " (obrigatória)" : " (recomendada)"}
                  {v.observacao ? ` — ${v.observacao}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {e.comprovantes.length > 0 ? (
          <div>
            <p className="rotulo mb-1">Leve com você</p>
            <ul className="space-y-0.5 text-[13px]">
              {e.comprovantes.map((c: string) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-taxiway" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {e.observacoes.length > 0 ? (
          <ul className="space-y-1 text-[13px] text-tinta-2">
            {e.observacoes.map((o: string) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        ) : null}

        {/* A ressalva não é opcional: sai do provedor, não do modelo. */}
        <p className="rounded-[3px] border border-pista/40 bg-pista-fosco p-2.5 text-[12px] leading-snug">
          {dados.aviso}
        </p>
      </div>
    </Bloco>
  );
}

/* ----------------------------------------------------------------- FAQ */

export function CartaoFaq({ dados }: { dados: Record<string, any> }) {
  return (
    <Bloco icone={<BookOpen size={15} />} titulo="Da base de ajuda">
      <div className="space-y-3">
        {dados.achados.map((achado: any) => (
          <article key={achado.slug} className="border-b border-dashed border-linha pb-3 last:border-0 last:pb-0">
            <h4 className="text-[14px] font-semibold">{achado.titulo}</h4>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-tinta-2">
              {achado.trecho.replace(/^#+ /gm, "").replace(/\*\*/g, "")}
            </p>
          </article>
        ))}
      </div>
    </Bloco>
  );
}

/* -------------------------------------------------------------- Chamado */

export function CartaoChamado({ dados }: { dados: Record<string, any> }) {
  const tons: Record<string, "eixo" | "pista" | "lacre" | "neutro"> = {
    BAIXA: "neutro",
    MEDIA: "taxiway" as never,
    ALTA: "pista",
    URGENTE: "lacre",
  };

  return (
    <Bloco
      icone={<LifeBuoy size={15} />}
      titulo="Chamado aberto"
      sufixo={<span className="codigo text-[13px] font-semibold">{dados.numero}</span>}
    >
      <p className="text-[14px] font-medium">{dados.assunto}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Etiqueta tom={tons[dados.prioridade] ?? "neutro"}>
          prioridade {dados.prioridade.toLowerCase()}
        </Etiqueta>
        <Etiqueta>{dados.categoria}</Etiqueta>
        {dados.localizador ? (
          <span className="codigo text-[12px] text-tinta-2">{dados.localizador}</span>
        ) : null}
      </div>
      <p className="mt-3 border-t border-linha pt-2.5 text-[13px] text-tinta-2">
        Resposta prevista em <span className="font-medium text-noite">{dados.prazoResposta}</span>,
        no e-mail do seu cadastro.
      </p>
    </Bloco>
  );
}

/* ------------------------------------------------------------- Escalado */

export function CartaoEscalado({ dados }: { dados: Record<string, any> }) {
  return (
    <section className="anim-entrada rounded-[4px] border-2 border-taxiway bg-papel">
      <header className="flex items-center gap-2 border-b border-linha bg-taxiway/5 px-4 py-2.5">
        <Headset size={15} aria-hidden className="text-taxiway" />
        <h3 className="font-display text-[15px] font-semibold text-taxiway">
          Conversa enviada para atendimento humano
        </h3>
      </header>
      <div className="p-4">
        <p className="text-[14px] leading-relaxed">{dados.resumo}</p>
        <ul className="mt-3 space-y-1.5 text-[13px] text-tinta-2">
          {dados.oQueAcontece.map((item: string) => (
            <li key={item} className="flex gap-2">
              <BadgeCheck size={14} aria-hidden className="mt-0.5 shrink-0 text-eixo" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-linha pt-2.5 text-[12px] text-tinta-3">
          Posição na fila: {dados.posicaoNaFila}. Nesta demonstração, a fila fica visível
          em <span className="codigo text-[11px]">/atendente</span>.
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Seguro */

export function CartaoSeguro({ dados }: { dados: Record<string, any> }) {
  const { perguntar, ocupado } = useAcoes();

  return (
    <Bloco
      icone={<LifeBuoy size={15} />}
      titulo={`Seguro para ${dados.destino}`}
      sufixo={
        <span className="rotulo">
          {dados.dias} dias · {dados.viajantes} pessoa{dados.viajantes > 1 ? "s" : ""}
        </span>
      }
    >
      <div className="space-y-2.5">
        {dados.planos.map((plano: any) => (
          <article
            key={plano.id}
            className={cn(
              "rounded-[3px] border p-3",
              plano.atendeExigenciaLocal ? "border-linha" : "border-lacre/40 bg-lacre-fosco",
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-[14px] font-semibold">{plano.nome}</h4>
              <p data-valor className="font-display text-[17px] font-bold">
                {brl(plano.precoTotal)}
              </p>
            </div>
            <p className="mt-0.5 text-[12px] text-tinta-3">
              {brl(plano.precoPorDia)} por dia, por pessoa
            </p>

            <ul className="mt-2 grid gap-x-4 gap-y-0.5 text-[12px] sm:grid-cols-2">
              {plano.coberturas.slice(0, 4).map((c: any) => (
                <li key={c.item} className="flex justify-between gap-2">
                  <span className="text-tinta-2">{c.item}</span>
                  <span data-valor className="text-right">{c.valor}</span>
                </li>
              ))}
            </ul>

            {plano.observacao ? (
              <p className="mt-2 text-[12px] leading-snug text-lacre">{plano.observacao}</p>
            ) : null}

            <Button
              variant="contorno"
              tamanho="sm"
              className="mt-2.5"
              disabled={ocupado}
              onClick={() => perguntar(`Quero incluir o ${plano.nome} por ${brl(plano.precoTotal)}.`)}
            >
              Incluir este plano
            </Button>
          </article>
        ))}
      </div>
    </Bloco>
  );
}

/* ------------------------------------------------------------ Transfers */

export function CartaoTransfers({ dados }: { dados: Record<string, any> }) {
  const transfers = dados.opcoes.filter((o: any) => o.tipo !== "aluguel-de-carro");
  const carros = dados.opcoes.filter((o: any) => o.tipo === "aluguel-de-carro");

  return (
    <Bloco icone={<Car size={15} />} titulo={`Transporte em ${dados.cidade}`}>
      <div className="space-y-4">
        {transfers.length > 0 ? (
          <div>
            <p className="rotulo mb-1.5">Aeroporto ↔ hotel</p>
            <ul className="space-y-2">
              {transfers.map((t: any) => (
                <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-linha pb-2 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">
                      {t.tipo === "transfer-privativo" ? "Privativo" : "Compartilhado"} ·{" "}
                      {t.fornecedor}
                    </p>
                    <p className="text-[12px] leading-snug text-tinta-2">{t.descricao}</p>
                    <p className="mt-0.5 text-[11px] text-tinta-3">
                      até {t.capacidade} pessoas · {t.duracaoMin} min
                      {t.cancelamentoGratis ? " · cancelamento grátis" : ""}
                    </p>
                  </div>
                  <p data-valor className="font-display text-[16px] font-bold">
                    {brl(t.preco)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {carros.length > 0 ? (
          <div>
            <p className="rotulo mb-1.5">Aluguel de carro</p>
            <ul className="space-y-1.5">
              {carros.map((c: any) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[13px]">
                    {c.categoriaVeiculo}
                    <span className="text-tinta-3">
                      {" "}
                      · {c.capacidade} lugares, {c.bagagens} malas · {c.diarias} diárias
                    </span>
                  </span>
                  <span data-valor className="text-[14px] font-medium">
                    {brl(c.preco)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Bloco>
  );
}

/* ------------------------------------------------------------- Passeios */

export function CartaoPasseios({ dados }: { dados: Record<string, any> }) {
  const { perguntar, ocupado } = useAcoes();

  return (
    <Bloco icone={<Ticket size={15} />} titulo={`Passeios em ${dados.cidade}`}>
      <ul className="space-y-2.5">
        {dados.passeios.map((p: any) => (
          <li
            key={p.id}
            className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-dashed border-linha pb-2.5 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium leading-snug">{p.nome}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-tinta-2">{p.descricao}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-tinta-3">
                <span>{p.categoria}</span>
                <span>{duracao(p.duracaoHoras * 60)}</span>
                <span>nota {p.nota}</span>
                {p.incluiTransporte ? <span>transporte incluído</span> : null}
              </p>
            </div>
            <div className="text-right">
              <p data-valor className="font-display text-[16px] font-bold">
                {brl(p.preco)}
              </p>
              <Button
                variant="fantasma"
                tamanho="sm"
                disabled={ocupado}
                className="mt-0.5 text-[12px]"
                onClick={() => perguntar(`Quero incluir o passeio "${p.nome}" no roteiro.`)}
              >
                Incluir
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Bloco>
  );
}

/* --------------------------------------------------------- Parcelamento */

export function CartaoParcelamento({ dados }: { dados: Record<string, any> }) {
  return (
    <Bloco
      icone={<CreditCard size={15} />}
      titulo="Parcelamento"
      sufixo={<span className="rotulo">{brl(dados.financiado)} no cartão</span>}
    >
      {dados.entrada > 0 ? (
        <p className="mb-2 text-[13px] text-tinta-2">
          Entrada de <span data-valor>{brl(dados.entrada)}</span> e o restante parcelado.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-linha text-left">
              <th className="rotulo pb-1.5 font-normal">Parcelas</th>
              <th className="rotulo pb-1.5 text-right font-normal">Valor</th>
              <th className="rotulo pb-1.5 text-right font-normal">Total</th>
              <th className="rotulo pb-1.5 text-right font-normal">Juros</th>
            </tr>
          </thead>
          <tbody>
            {dados.opcoes.map((o: any) => (
              <tr key={o.parcelas} className="border-b border-dashed border-linha last:border-0">
                <td className="py-1.5">
                  {o.parcelas}x{" "}
                  {o.semJuros ? <span className="text-eixo">sem juros</span> : null}
                </td>
                <td data-valor className="py-1.5 text-right font-medium">
                  {brl(o.valorParcela, true)}
                </td>
                <td data-valor className="py-1.5 text-right text-tinta-2">
                  {brl(o.totalPago)}
                </td>
                <td data-valor className={cn("py-1.5 text-right", o.juros > 0 ? "text-lacre" : "text-eixo")}>
                  {o.juros > 0 ? brl(o.juros) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-tinta-3">
        Juros de {dados.jurosAoMes}% ao mês a partir de 4 parcelas. Simulação, não é oferta de crédito.
      </p>
    </Bloco>
  );
}

/* -------------------------------------------------------- Câmbio e custo */

export function CartaoCambio({ dados }: { dados: Record<string, any> }) {
  const c = dados.cotacao;
  return (
    <Bloco icone={<Coins size={15} />} titulo="Conversão">
      <p className="font-display text-secao font-bold leading-none">
        <span data-valor>{c.valorConvertido.toLocaleString("pt-BR")}</span>{" "}
        <span className="codigo text-[16px] text-tinta-2">{c.para}</span>
      </p>
      <p className="mt-1.5 text-[13px] text-tinta-2">
        1 {c.de} = <span data-valor>{c.taxa}</span> {c.para}
      </p>
      <p className="mt-2 text-[11px] text-tinta-3">
        Cotação de demonstração, fixa. Em produção viria de um provedor de câmbio, com spread.
      </p>
    </Bloco>
  );
}

export function CartaoCustoMedio({ dados }: { dados: Record<string, any> }) {
  const c = dados.custo;
  const itens = [
    ["Refeição simples", c.refeicaoSimples],
    ["Refeição em restaurante", c.refeicaoRestaurante],
    ["Transporte público", c.transportePublico],
    ["Táxi por km", c.taxiPorKm],
    ["Café", c.cafe],
    ["Cerveja", c.cerveja],
    ["Diária média de hotel", c.diariaMediaHotel],
  ] as const;

  return (
    <Bloco
      icone={<Wallet size={15} />}
      titulo={`Custo médio em ${c.cidade}`}
      sufixo={
        dados.totalEstimado ? (
          <span className="rotulo">
            {dados.dias} dias · {dados.pessoas} pessoa{dados.pessoas > 1 ? "s" : ""}
          </span>
        ) : null
      }
    >
      <dl className="grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
        {itens.map(([rotulo, valor]) => (
          <Linha key={rotulo} rotulo={rotulo} valor={brl(valor, valor < 10)} />
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-linha pt-3">
        <div>
          <p className="rotulo">Por dia, sem hotel</p>
          <p data-valor className="font-display text-[19px] font-bold leading-none">
            {brl(c.diarioSugerido)}
          </p>
        </div>
        {dados.totalEstimado ? (
          <div className="text-right">
            <p className="rotulo">Estimativa da viagem</p>
            <p data-valor className="font-display text-[19px] font-bold leading-none">
              {brl(dados.totalEstimado)}
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-tinta-3">{dados.observacao}</p>
    </Bloco>
  );
}

/* -------------------------------------------------------------- Alertas */

export function CartaoAlerta({ dados }: { dados: Record<string, any> }) {
  const alerta = dados.alerta ?? dados.alertas?.[0];
  if (!alerta) {
    return (
      <Bloco icone={<Coins size={15} />} titulo="Alertas de preço">
        <p className="text-[13px] text-tinta-2">Nenhum alerta ativo no momento.</p>
      </Bloco>
    );
  }

  return (
    <Bloco
      icone={<Coins size={15} />}
      titulo="Alerta de preço criado"
      sufixo={
        <span className="codigo text-[12px]">
          {alerta.origem} → {alerta.destino}
        </span>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="rotulo">Preço de hoje</p>
          <p data-valor className="font-display text-[19px] font-bold leading-none">
            {brl(alerta.precoBase)}
          </p>
          <p className="mt-1 text-[12px] text-tinta-2">
            para {dataCurta(alerta.dataAlvo)}
            {alerta.alvo ? ` · aviso abaixo de ${brl(alerta.alvo)}` : ""}
          </p>
        </div>
        <Button asChild variant="contorno" tamanho="sm">
          <a href="/perfil#alertas">Ver alertas</a>
        </Button>
      </div>
      {dados.explicacao ? (
        <p className="mt-3 border-t border-linha pt-2.5 text-[12px] leading-snug text-tinta-2">
          {dados.explicacao}
        </p>
      ) : null}
    </Bloco>
  );
}

/* --------------------------------------------------------------- Perfil */

export function CartaoPerfil({ dados }: { dados: Record<string, any> }) {
  const p = dados.preferencias ?? {};
  const itens: [string, string][] = [];

  if (p.assento) itens.push(["Assento", p.assento]);
  if (p.ciaPreferida) itens.push(["Companhia preferida", p.ciaPreferida]);
  if (p.restricaoAlimentar) itens.push(["Restrição alimentar", p.restricaoAlimentar]);
  if (p.ritmoDeViagem) itens.push(["Ritmo de viagem", p.ritmoDeViagem]);
  if (p.fidelidade?.length) itens.push(["Fidelidade", p.fidelidade.join(", ")]);
  if (p.orcamentoTipico) itens.push(["Orçamento típico", brl(p.orcamentoTipico)]);

  return (
    <Bloco
      icone={<BadgeCheck size={15} />}
      titulo={dados.salvo ? "Preferências salvas" : "Seu perfil"}
      sufixo={<span className="rotulo">{dados.nome}</span>}
    >
      {itens.length === 0 ? (
        <p className="text-[13px] text-tinta-2">
          Nenhuma preferência salva ainda. Diga como você gosta de viajar — assento,
          companhia, restrição alimentar — e eu uso isso nas próximas buscas.
        </p>
      ) : (
        <dl className="grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
          {itens.map(([rotulo, valor]) => (
            <Linha key={rotulo} rotulo={rotulo} valor={String(valor)} />
          ))}
        </dl>
      )}
    </Bloco>
  );
}

/* --------------------------------------------- Resultados de pós-venda */

export function CartaoCancelamentoFeito({ dados }: { dados: Record<string, any> }) {
  return (
    <section className="anim-entrada rounded-[4px] border border-lacre/30 bg-papel">
      <header className="flex items-center gap-2 border-b border-linha bg-lacre-fosco px-4 py-2.5">
        <XCircle size={15} aria-hidden className="text-lacre" />
        <h3 className="font-display text-[15px] font-semibold">
          Reserva {dados.localizador} cancelada
        </h3>
      </header>
      <div className="p-4 text-[13px]">
        <dl className="space-y-1.5">
          <Linha
            rotulo="Multa aplicada"
            valor={dados.multa > 0 ? brl(dados.multa) : "sem multa"}
            tom={dados.multa > 0 ? "lacre" : "eixo"}
          />
          <Linha
            rotulo="Reembolso"
            valor={dados.reembolso > 0 ? brl(dados.reembolso) : "sem reembolso"}
            tom={dados.reembolso > 0 ? "eixo" : "lacre"}
          />
        </dl>
        {dados.prazoReembolsoDias > 0 ? (
          <p className="mt-3 border-t border-linha pt-2.5 text-tinta-2">
            O valor volta pelo mesmo meio de pagamento em até {dados.prazoReembolsoDias} dias.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function CartaoAlteracaoFeita({ dados }: { dados: Record<string, any> }) {
  return (
    <section className="anim-entrada rounded-[4px] border border-taxiway/30 bg-papel">
      <header className="flex items-center gap-2 border-b border-linha bg-taxiway/5 px-4 py-2.5">
        <BadgeCheck size={15} aria-hidden className="text-taxiway" />
        <h3 className="font-display text-[15px] font-semibold">
          Reserva {dados.localizador} alterada
        </h3>
      </header>
      <div className="p-4 text-[13px]">
        <dl className="space-y-1.5">
          <Linha rotulo="Nova data" valor={dataCurta(dados.novaDataIda)} />
          <Linha rotulo="Multa" valor={dados.multa > 0 ? brl(dados.multa) : "sem multa"} />
          <Linha
            rotulo="Diferença de tarifa"
            valor={dados.diferencaTarifa > 0 ? brl(dados.diferencaTarifa) : "sem diferença"}
          />
          <Linha rotulo="Novo total da reserva" valor={brl(dados.novoTotal)} />
        </dl>
      </div>
    </section>
  );
}
