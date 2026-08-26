import type { UIMessage, UIMessageStreamWriter } from "ai";
import { textoDaMensagem } from "@/lib/repos/conversas";
import { ferramentas } from "@/lib/ai/tools";
import { brl, duracao, emCidade } from "@/lib/utils";
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
    `Montei ${r.dias} dias ${emCidade(r.destino)}, em ritmo ${r.ritmo}.`,
    "",
    `A estimativa é de ${brl(r.custoEstimadoTotal)} por pessoa em passeios e refeições — sem hotel e sem passagem.`,
    "Você pode arrastar, remover ou trocar qualquer bloco na tela de Roteiro.",
  ].join("\n");
}

/* --------------------------------------------------- Fluxo de reserva */

const VIAJANTE_DEMO = {
  nome: "Helena Braga",
  documento: "XX0000000",
  email: "helena.braga@exemplo.com.br",
};

/** Último id de voo ou hotel citado na conversa, do mais recente para o mais antigo. */
function ultimoId(mensagens: UIMessage[], prefixo: "V" | "H") {
  for (let i = mensagens.length - 1; i >= 0; i--) {
    const texto = textoDaMensagem(mensagens[i]);
    const achado = new RegExp(`${prefixo}~[^\\s,.]+`).exec(texto);
    if (achado) return achado[0];
  }
  return undefined;
}

/**
 * Trata emissão, confirmação e cancelamento. Devolve `true` quando assumiu o
 * turno, para que a orquestração não siga para as buscas.
 */
async function tratarReserva(
  writer: UIMessageStreamWriter,
  mensagens: UIMessage[],
  pergunta: string,
): Promise<boolean> {
  const texto = pergunta.toLowerCase();
  const localizador = /RV-[A-Z0-9]{6}/i.exec(pergunta)?.[0]?.toUpperCase();

  // --- confirmações -------------------------------------------------------
  const confirmando = /\b(confirmo|pode emitir|pode confirmar|confirmar)\b/.test(texto);

  if (confirmando && /cancel/.test(texto) && localizador) {
    const r = await chamarFerramenta(writer, "cancelarReserva", {
      localizador,
      confirmado: true,
    });
    await escrever(
      writer,
      (r?.ok
        ? "Cancelamento feito. O comprovante fica na tela de reservas."
        : `${r?.erro ?? "Não consegui cancelar."}`) + AVISO,
    );
    return true;
  }

  if (confirmando && /alter|remarc/.test(texto) && localizador) {
    const data = /(\d{2})\/(\d{2})/.exec(pergunta);
    const r = await chamarFerramenta(writer, "alterarReserva", {
      localizador,
      novaDataIda: data
        ? `${new Date().getFullYear() + 1}-${data[2]}-${data[1]}`
        : detectarDatas(pergunta).ida,
      confirmado: true,
    });
    await escrever(
      writer,
      (r?.ok ? "Alteração feita." : `${r?.erro ?? "Não consegui alterar."}`) + AVISO,
    );
    return true;
  }

  if (confirmando && /reserv|emitir/.test(texto)) {
    const vooId = ultimoId(mensagens, "V");
    const hotelId = ultimoId(mensagens, "H");
    if (!vooId && !hotelId) return false;

    const r = await chamarFerramenta(writer, "criarReserva", {
      vooId,
      hotelId,
      passageiros: [{ nome: VIAJANTE_DEMO.nome, documento: VIAJANTE_DEMO.documento }],
      email: VIAJANTE_DEMO.email,
      confirmado: true,
    });

    await escrever(
      writer,
      (r?.ok
        ? `Reserva emitida. O localizador é **${r.localizador}** — guarde esse código, é ele que identifica a viagem em qualquer atendimento. O voucher em PDF está no botão do card.`
        : `${r?.erro ?? "Não consegui emitir."}`) + AVISO,
    );
    return true;
  }

  // --- primeira etapa: simulação ------------------------------------------
  if (/\b(quero|vou|pode)\s+(reservar|comprar)\b/.test(texto) || /\bid:\s*[VH]~/i.test(pergunta)) {
    const vooId = ultimoId(mensagens, "V");
    const hotelId = ultimoId(mensagens, "H");
    if (!vooId && !hotelId) return false;

    const r = await chamarFerramenta(writer, "criarReserva", {
      vooId,
      hotelId,
      passageiros: [{ nome: VIAJANTE_DEMO.nome, documento: VIAJANTE_DEMO.documento }],
      email: VIAJANTE_DEMO.email,
    });

    await escrever(
      writer,
      (r?.ok
        ? "Confira os dados acima antes de eu emitir. Nada é cobrado enquanto você não confirmar."
        : `${r?.erro ?? "Não consegui montar a reserva."}`) + AVISO,
    );
    return true;
  }

  if (/\bcancel/.test(texto) && localizador) {
    const r = await chamarFerramenta(writer, "cancelarReserva", { localizador });
    await escrever(
      writer,
      (r?.ok
        ? "Veja a conta do cancelamento acima. Só executo depois que você confirmar."
        : `${r?.erro ?? "Não consegui calcular."}`) + AVISO,
    );
    return true;
  }

  if (/\b(remarc|alterar a reserva|mudar a data)/.test(texto) && localizador) {
    const datas = detectarDatas(pergunta);
    const r = await chamarFerramenta(writer, "alterarReserva", {
      localizador,
      novaDataIda: datas.ida,
    });
    await escrever(
      writer,
      (r?.ok
        ? `Calculei para ${dataPorExtenso(datas.ida)}. Se for outra data, me diga qual.`
        : `${r?.erro ?? "Não consegui calcular."}`) + AVISO,
    );
    return true;
  }

  return false;
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

  /*
   * Reserva e cancelamento vêm antes das buscas porque são disparados pelos
   * botões dos cards, com um texto reconhecível ("Id: V~..." ou "Confirmo").
   * O contexto (qual voo, qual hotel) é recuperado varrendo o histórico — é o
   * que o modelo faria lendo a conversa.
   */
  const fluxo = await tratarReserva(writer, mensagens, pergunta);
  if (fluxo) return;

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

  if (intencao === "documentacao") {
    const destino = cidades.unica ?? cidades.destino;
    if (!destino) {
      await escrever(writer, "Para qual país você quer saber as exigências de entrada?" + AVISO);
      return;
    }
    const r = await chamarFerramenta(writer, "consultarDocumentacao", {
      destino,
      nacionalidade: "brasileira",
    });
    await escrever(
      writer,
      (r?.ok
        ? "Confira as exigências acima. Lembre que isso é orientação: quem decide na hora é o consulado e a companhia aérea."
        : `${r?.erro ?? "Não consegui consultar."} ${r?.sugestao ?? ""}`) + AVISO,
    );
    return;
  }

  if (intencao === "faq") {
    const r = await chamarFerramenta(writer, "faq", { pergunta });
    await escrever(
      writer,
      (r?.ok
        ? "Foi isso que encontrei na base de ajuda. Se a sua situação for diferente do que está aí, me conte o caso que eu abro um chamado."
        : `${r?.erro ?? "Nada encontrado."} ${r?.sugestao ?? ""}`) + AVISO,
    );
    return;
  }

  if (intencao === "seguro") {
    const destino = cidades.unica ?? cidades.destino ?? "Lisboa";
    const dias = detectarQuantidadeDias(pergunta);
    const r = await chamarFerramenta(writer, "cotarSeguroViagem", {
      destino,
      dias,
      viajantes: passageiros,
    });
    await escrever(
      writer,
      (r?.ok
        ? `Três planos para ${dias} dias. ${
            r.exigeCoberturaMinima
              ? "Atenção: o Essencial fica abaixo da cobertura mínima que esse destino costuma exigir — para lá, o Completo é o piso."
              : "O Completo costuma ser o equilíbrio entre preço e cobertura."
          }`
        : `${r?.erro ?? "Não consegui cotar."}`) + AVISO,
    );
    return;
  }

  if (intencao === "transfer") {
    const cidade = cidades.unica ?? cidades.destino;
    if (!cidade) {
      await escrever(writer, "Em qual cidade você precisa do transfer?" + AVISO);
      return;
    }
    const r = await chamarFerramenta(writer, "buscarTransfer", {
      cidade,
      passageiros,
      dias: detectarQuantidadeDias(pergunta),
    });
    await escrever(
      writer,
      (r?.ok
        ? "O compartilhado é bem mais barato, mas para até três paradas antes da sua. Com bagagem ou chegada de madrugada, o privativo compensa."
        : `${r?.erro ?? "Não consegui buscar."}`) + AVISO,
    );
    return;
  }

  if (intencao === "custo") {
    const cidade = cidades.unica ?? cidades.destino;
    if (!cidade) {
      await escrever(writer, "De qual cidade você quer saber o custo médio?" + AVISO);
      return;
    }
    const r = await chamarFerramenta(writer, "custoMedioDestino", {
      cidade,
      dias: detectarQuantidadeDias(pergunta),
      pessoas: passageiros,
    });
    await escrever(
      writer,
      (r?.ok
        ? "Esses valores cobrem o dia a dia — comida e transporte. Hospedagem e passeios entram por fora."
        : `${r?.erro ?? "Não consegui levantar."}`) + AVISO,
    );
    return;
  }

  if (intencao === "cambio") {
    const valor = /(\d[\d.]*)/.exec(pergunta.replace(/\./g, ""));
    const r = await chamarFerramenta(writer, "converterMoeda", {
      de: "BRL",
      para: /d[oó]lar|usd/i.test(pergunta) ? "USD" : "EUR",
      valor: valor ? Number(valor[1]) : 1000,
    });
    await escrever(
      writer,
      (r?.ok ? "Cotação de demonstração, fixa nesta POC." : `${r?.erro ?? "Não consegui converter."}`) +
        AVISO,
    );
    return;
  }

  if (intencao === "parcelamento") {
    const valor = /(\d[\d.]*)/.exec(pergunta.replace(/\./g, ""));
    const r = await chamarFerramenta(writer, "simularParcelamento", {
      total: valor ? Number(valor[1]) : 5000,
      entrada: 0,
    });
    await escrever(
      writer,
      (r?.ok
        ? "Até 3x o valor é o mesmo. A partir de 4x entram juros — a coluna da direita mostra quanto custa esperar."
        : `${r?.erro ?? "Não consegui simular."}`) + AVISO,
    );
    return;
  }

  if (intencao === "reservas") {
    const localizador = /RV-[A-Z0-9]{6}/i.exec(pergunta)?.[0];
    const r = await chamarFerramenta(
      writer,
      "consultarReserva",
      localizador ? { localizador } : {},
    );
    await escrever(
      writer,
      (r?.ok
        ? "Achei. Me diga o que você quer fazer: **remarcar** para outra data ou **cancelar**. Eu calculo a multa antes de qualquer coisa."
        : `${r?.erro ?? "Não encontrei reservas."} ${r?.sugestao ?? ""}`) + AVISO,
    );
    return;
  }

  await escrever(writer, textoDeAbertura(intencao) + AVISO);
}

function textoDeAbertura(intencao: string) {
  void intencao;
  return (
    "Oi. Sou o agente da Rota Viva.\n\n" +
    "Posso buscar voos, comparar hotéis e montar um roteiro dia a dia. " +
    "Diga o destino e as datas — por exemplo, *voo de São Paulo para Lisboa em outubro*."
  );
}
