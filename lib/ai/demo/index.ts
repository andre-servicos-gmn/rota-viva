import type { UIMessage, UIMessageStreamWriter } from "ai";
import { textoDaMensagem } from "@/lib/repos/conversas";
import { ferramentas } from "@/lib/ai/tools";
import { brl, duracao } from "@/lib/utils";
import { dataPorExtenso } from "@/lib/datas";
import {
  detectarCabine,
  detectarCidades,
  detectarDatas,
  detectarIntencao,
  detectarPassageiros,
  detectarQuantidadeDias,
} from "./interpretar";

/**
 * Modo demonstração — o app inteiro funciona sem `XAI_API_KEY`.
 *
 * Aqui as tools são chamadas de verdade e os cards aparecem de verdade; o que
 * falta é o raciocínio do modelo, substituído por regras. Serve para demonstrar
 * a POC antes de conectar a xAI e para desenvolver a interface sem gastar token.
 *
 * Quando a chave existe, `app/api/chat/route.ts` nem chega neste arquivo.
 */

const AVISO =
  "\n\n*Modo demonstração: sem chave da xAI configurada, quem interpretou seu " +
  "pedido foi um conjunto de regras, não um modelo. As buscas e os cards acima " +
  "são reais — vêm das mesmas tools que o Grok usaria.*";

let contador = 0;
function novoId() {
  contador += 1;
  return `demo-${contador}-${Date.now().toString(36)}`;
}

/** Executa uma tool e emite no stream os mesmos chunks que o modelo emitiria. */
async function chamarFerramenta(
  writer: UIMessageStreamWriter,
  nome: keyof typeof ferramentas,
  entrada: Record<string, unknown>,
) {
  const toolCallId = novoId();
  const ferramenta = ferramentas[nome];

  writer.write({ type: "tool-input-start", toolCallId, toolName: nome });
  writer.write({ type: "tool-input-available", toolCallId, toolName: nome, input: entrada });

  try {
    // A tool valida a própria entrada: passar pelo schema aqui é o que garante
    // que o modo demonstração exercite exatamente o mesmo caminho do modo real.
    const validada = ferramenta.inputSchema
      ? // @ts-expect-error o schema é um ZodObject; o tipo genérico do SDK não expõe parse
        ferramenta.inputSchema.parse(entrada)
      : entrada;

    const saida = await ferramenta.execute!(validada, {
      toolCallId,
      messages: [],
    });

    writer.write({ type: "tool-output-available", toolCallId, output: saida });
    return saida as Record<string, unknown>;
  } catch (e) {
    const texto = e instanceof Error ? e.message : "Falha ao executar a busca.";
    writer.write({ type: "tool-output-error", toolCallId, errorText: texto });
    return null;
  }
}

/** Escreve texto no stream em pedaços, imitando a cadência de um modelo. */
async function escrever(writer: UIMessageStreamWriter, texto: string) {
  const id = novoId();
  writer.write({ type: "text-start", id });
  for (const pedaco of texto.match(/\S+\s*/g) ?? [texto]) {
    writer.write({ type: "text-delta", id, delta: pedaco });
    await new Promise((r) => setTimeout(r, 12));
  }
  writer.write({ type: "text-end", id });
}

/* ------------------------------------------------- Comentários por resultado */

type QualquerResultado = Record<string, any>;

function comentarVoos(r: QualquerResultado, assumiuData: boolean) {
  const opcoes = r.opcoes as QualquerResultado[];
  const maisBarato = opcoes[0]!;
  const semEscala = opcoes.find((o) => o.paradas === 0);
  const rapido = [...opcoes].sort((a, b) => a.duracaoIdaMin - b.duracaoIdaMin)[0]!;

  const partes: string[] = [];
  partes.push(
    `Encontrei ${r.totalEncontrado} opções de ${r.busca.origem.cidade} para ${r.busca.destino.cidade}. Estas são as seis melhores.`,
  );

  if (assumiuData) {
    partes.push(
      `Assumi ida em ${dataPorExtenso(r.busca.dataIda)}${
        r.busca.dataVolta ? ` e volta em ${dataPorExtenso(r.busca.dataVolta)}` : ""
      }. Me diga as datas certas que eu refaço.`,
    );
  }

  const linhas: string[] = [];
  linhas.push(
    `**Mais barata:** ${maisBarato.companhiaPrincipal.nome}, ${brl(maisBarato.precoTotal)} no total — ${
      maisBarato.paradas === 0 ? "e ainda é direta" : `com ${maisBarato.paradas} escala`
    }, ${duracao(maisBarato.duracaoIdaMin)} de viagem na ida.`,
  );

  if (semEscala && semEscala.id !== maisBarato.id) {
    const diferenca = semEscala.precoTotal - maisBarato.precoTotal;
    linhas.push(
      `**Sem escalas:** ${semEscala.companhiaPrincipal.nome} por ${brl(semEscala.precoTotal)} — ${brl(
        diferenca,
      )} a mais, mas economiza ${duracao(maisBarato.duracaoIdaMin - semEscala.duracaoIdaMin)} de viagem.`,
    );
  }

  if (rapido.id !== maisBarato.id && rapido.id !== semEscala?.id) {
    linhas.push(
      `**Mais rápida:** ${rapido.companhiaPrincipal.nome}, ${duracao(rapido.duracaoIdaMin)} por ${brl(rapido.precoTotal)}.`,
    );
  }

  const recomendada = semEscala && semEscala.precoTotal - maisBarato.precoTotal < 600 ? semEscala : maisBarato;
  linhas.push(
    `\nEu ficaria com a da **${recomendada.companhiaPrincipal.nome}**: ${
      recomendada === semEscala
        ? "a diferença de preço é pequena perto de cortar a escala"
        : "é a mais barata e a diferença de tempo não compensa o valor a mais"
    }.`,
  );

  if (r.calendario?.length) {
    const barato = (r.calendario as QualquerResultado[]).find((d) => d.ehMaisBarato);
    if (barato && barato.data !== r.busca.dataIda) {
      linhas.push(
        `Sair em ${dataPorExtenso(barato.data)} sai por ${brl(barato.precoMinimo)} — veja o calendário no card.`,
      );
    }
  }

  return `${partes.join(" ")}\n\n${linhas.join("\n")}`;
}

function comentarHoteis(r: QualquerResultado) {
  const opcoes = r.opcoes as QualquerResultado[];
  const barato = opcoes[0]!;
  const bemAvaliado = [...opcoes].sort((a, b) => b.nota - a.nota)[0]!;
  const central = [...opcoes].sort((a, b) => a.distanciaCentroKm - b.distanciaCentroKm)[0]!;

  const linhas = [
    `${r.totalEncontrado} hotéis em ${r.busca.cidade} para ${r.busca.noites} noite${r.busca.noites > 1 ? "s" : ""}, ${r.busca.hospedes} hóspede${r.busca.hospedes > 1 ? "s" : ""}.`,
    "",
    `**Mais barato:** ${barato.nome}, ${brl(barato.diaria)} a diária (${brl(barato.total)} no total), ${barato.estrelas} estrelas em ${barato.bairro}, a ${barato.distanciaCentroKm} km do centro.`,
  ];

  if (bemAvaliado.id !== barato.id) {
    linhas.push(
      `**Melhor avaliado:** ${bemAvaliado.nome}, nota ${bemAvaliado.nota} com ${bemAvaliado.avaliacoes} avaliações, ${brl(bemAvaliado.diaria)} a diária.`,
    );
  }
  if (central.id !== barato.id && central.id !== bemAvaliado.id) {
    linhas.push(
      `**Mais central:** ${central.nome}, a ${central.distanciaCentroKm} km do centro, ${brl(central.diaria)} a diária.`,
    );
  }

  const comCancelamento = opcoes.filter((o) => o.reembolsavel).length;
  linhas.push(
    `\n${comCancelamento} deles têm cancelamento grátis. Se as datas ainda podem mudar, vale pagar um pouco mais por essa flexibilidade.`,
  );

  return linhas.join("\n");
}

function comentarRoteiro(r: QualquerResultado) {
  return [
    `Montei ${r.dias} dias em ${r.destino}, em ritmo ${r.ritmo}.`,
    "",
    `A estimativa é de ${brl(r.custoEstimadoTotal)} por pessoa em passeios e refeições — sem hotel e sem passagem.`,
    "Você pode arrastar, remover ou trocar qualquer bloco na tela de Roteiro.",
  ].join("\n");
}

/* ------------------------------------------------------------- Orquestração */

export async function escreverRespostaDemo(
  writer: UIMessageStreamWriter,
  mensagens: UIMessage[],
) {
  const ultima = [...mensagens].reverse().find((m) => m.role === "user");
  const pergunta = textoDaMensagem(ultima);
  const intencao = detectarIntencao(pergunta);
  const cidades = detectarCidades(pergunta);
  const datas = detectarDatas(pergunta);
  const passageiros = detectarPassageiros(pergunta);

  if (intencao === "voos" || intencao === "pacote") {
    if (!cidades.destino) {
      await escrever(
        writer,
        "Para buscar o voo eu preciso saber o destino. Para onde você quer ir?" + AVISO,
      );
      return;
    }

    const resultado = await chamarFerramenta(writer, "buscarVoos", {
      origem: cidades.origem ?? "São Paulo",
      destino: cidades.destino,
      dataIda: datas.ida,
      dataVolta: datas.volta,
      adultos: passageiros,
      criancas: 0,
      cabine: detectarCabine(pergunta),
      flexivel: true,
      ordenar: "preco",
    });

    if (!resultado?.ok) {
      await escrever(
        writer,
        `${resultado?.erro ?? "A busca falhou."} ${resultado?.sugestao ?? ""}${AVISO}`,
      );
      return;
    }

    const semOrigem = !cidades.origem;
    let texto = comentarVoos(resultado, datas.assumido);
    if (semOrigem) texto += "\n\nAssumi saída de São Paulo. Se for de outra cidade, me diga qual.";
    await escrever(writer, texto + AVISO);
    return;
  }

  if (intencao === "hoteis") {
    const cidade = cidades.unica ?? cidades.destino;
    if (!cidade) {
      await escrever(writer, "Em qual cidade você quer se hospedar?" + AVISO);
      return;
    }

    const filtros: string[] = [];
    const t = pergunta.toLowerCase();
    if (/café|cafe da manhã|breakfast/.test(t)) filtros.push("cafe-da-manha");
    if (/cancelamento|flexív|flexiv/.test(t)) filtros.push("cancelamento-gratis");
    if (/pet|cachorro|gato/.test(t)) filtros.push("pet-friendly");
    if (/piscina/.test(t)) filtros.push("piscina");

    const resultado = await chamarFerramenta(writer, "buscarHoteis", {
      cidade,
      checkIn: datas.ida,
      checkOut: datas.volta ?? datas.ida,
      hospedes: passageiros,
      quartos: 1,
      filtros,
      ordenar: "preco",
    });

    if (!resultado?.ok) {
      await escrever(writer, `${resultado?.erro ?? "A busca falhou."} ${resultado?.sugestao ?? ""}${AVISO}`);
      return;
    }

    await escrever(writer, comentarHoteis(resultado) + AVISO);
    return;
  }

  if (intencao === "roteiro" || intencao === "passeios") {
    const cidade = cidades.unica ?? cidades.destino;
    if (!cidade) {
      await escrever(writer, "Para qual destino você quer o roteiro?" + AVISO);
      return;
    }

    const resultado = await chamarFerramenta(writer, "montarRoteiro", {
      destino: cidade,
      dias: detectarQuantidadeDias(pergunta),
      ritmo: "normal",
      interesses: [],
      comCriancas: /criança|filho|filha|kids/i.test(pergunta),
    });

    if (!resultado?.ok) {
      await escrever(writer, `${resultado?.erro ?? "Não consegui montar o roteiro."}${AVISO}`);
      return;
    }

    await escrever(writer, comentarRoteiro(resultado) + AVISO);
    return;
  }

  await escrever(writer, textoDeAbertura(intencao) + AVISO);
}

function textoDeAbertura(intencao: string) {
  if (intencao === "reservas" || intencao === "documentacao" || intencao === "seguro") {
    return (
      "Essa parte entra nas próximas fases da POC. Por enquanto eu já sei buscar **voos**, " +
      "**hotéis** e montar **roteiros** — todos com dados de demonstração."
    );
  }

  return (
    "Oi. Sou o agente da Rota Viva.\n\n" +
    "Posso buscar voos, comparar hotéis e montar um roteiro dia a dia. " +
    "Diga o destino e as datas — por exemplo, *voo de São Paulo para Lisboa em outubro*."
  );
}
