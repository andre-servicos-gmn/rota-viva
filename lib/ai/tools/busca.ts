import { tool } from "ai";
import { z } from "zod";
import { provedores } from "@/lib/providers";
import { db } from "@/lib/db";
import type { Passeio } from "@/lib/providers/types";
import { diferencaEmDias, somarDias } from "@/lib/datas";
import {
  cabineSchema,
  dataFutura,
  falha,
  falhaDe,
  filtrosDeHotelSchema,
  ok,
} from "./comum";

/**
 * Tools do núcleo: buscar voos, buscar hotéis, montar pacote e montar roteiro.
 *
 * Cada uma devolve dados prontos para o componente rico correspondente — o `kind`
 * é o que o chat usa para escolher entre card de voo, card de hotel e timeline.
 */

/* ------------------------------------------------------------ 1. buscarVoos */

export const buscarVoos = tool({
  description:
    "Busca opções de voo entre duas cidades. Use sempre que o usuário falar em passagem, " +
    "voo, ida e volta ou datas de viagem. Aceita cidade por nome ou código IATA. " +
    "Com `flexivel: true` devolve também o calendário de preços de 3 dias antes e depois.",
  inputSchema: z.object({
    origem: z.string().min(2).describe("Cidade ou código IATA de origem"),
    destino: z.string().min(2).describe("Cidade ou código IATA de destino"),
    dataIda: dataFutura,
    dataVolta: dataFutura.optional().describe("Ausente para só ida"),
    adultos: z.number().int().min(1).max(9).default(1),
    criancas: z.number().int().min(0).max(8).default(0),
    cabine: cabineSchema.default("economica"),
    flexivel: z.boolean().default(false).describe("Buscar também 3 dias antes e depois"),
    maxParadas: z.number().int().min(0).max(2).optional(),
    companhiaPreferida: z.string().optional(),
    ordenar: z.enum(["preco", "duracao", "partida", "conforto"]).default("preco"),
  }),
  async execute(entrada) {
    try {
      if (entrada.dataVolta && diferencaEmDias(entrada.dataIda, entrada.dataVolta) < 0) {
        return falha(
          "A data de volta está antes da ida.",
          "Confirme com o usuário qual é a volta correta.",
        );
      }

      const resultado = await provedores.voos.buscar({ ...entrada, limite: 6 });

      if (resultado.opcoes.length === 0) {
        return falha(
          "Nenhum voo atende a esses filtros.",
          "Sugira afrouxar o número de escalas ou mudar a data.",
        );
      }

      return ok("voos", {
        busca: {
          origem: resultado.opcoes[0]!.origem,
          destino: resultado.opcoes[0]!.destino,
          dataIda: entrada.dataIda,
          dataVolta: entrada.dataVolta,
          passageiros: entrada.adultos + entrada.criancas,
          cabine: entrada.cabine,
        },
        opcoes: resultado.opcoes,
        calendario: resultado.calendario,
        totalEncontrado: resultado.totalEncontrado,
      });
    } catch (e) {
      return falhaDe(e, "Confirme a cidade de origem, o destino e as datas.");
    }
  },
});

/* ---------------------------------------------------------- 2. buscarHoteis */

export const buscarHoteis = tool({
  description:
    "Busca hotéis numa cidade para um período. Use quando o usuário falar em hospedagem, " +
    "hotel, pousada ou onde ficar. Filtros disponíveis: café da manhã, cancelamento grátis, " +
    "pet friendly, piscina, academia, wi-fi, estacionamento, acessibilidade e ar-condicionado.",
  inputSchema: z.object({
    cidade: z.string().min(2),
    checkIn: dataFutura,
    checkOut: dataFutura,
    hospedes: z.number().int().min(1).max(12).default(2),
    quartos: z.number().int().min(1).max(6).default(1),
    precoMin: z.number().min(0).optional().describe("Diária mínima em reais"),
    precoMax: z.number().min(0).optional().describe("Diária máxima em reais"),
    estrelasMin: z.number().int().min(1).max(5).optional(),
    filtros: z.array(filtrosDeHotelSchema).default([]),
    ordenar: z.enum(["preco", "nota", "distancia", "estrelas"]).default("preco"),
  }),
  async execute(entrada) {
    try {
      const resultado = await provedores.hoteis.buscar({ ...entrada, limite: 6 });

      if (resultado.opcoes.length === 0) {
        return falha(
          "Nenhum hotel atende a essa combinação de filtros.",
          `As diárias na cidade vão de R$ ${resultado.faixaDePreco.minimo} a R$ ${resultado.faixaDePreco.maximo}. Sugira afrouxar o preço, a categoria ou algum filtro.`,
        );
      }

      return ok("hoteis", {
        busca: {
          cidade: resultado.opcoes[0]!.cidade,
          checkIn: entrada.checkIn,
          checkOut: entrada.checkOut,
          noites: resultado.opcoes[0]!.noites,
          hospedes: entrada.hospedes,
          quartos: entrada.quartos,
        },
        opcoes: resultado.opcoes,
        faixaDePreco: resultado.faixaDePreco,
        totalEncontrado: resultado.totalEncontrado,
      });
    } catch (e) {
      return falhaDe(e, "Confirme a cidade e as datas de entrada e saída.");
    }
  },
});

/* ---------------------------------------------------------- 3. montarPacote */

export const montarPacote = tool({
  description:
    "Junta um voo e um hotel já encontrados num pacote, com o total e a economia em " +
    "relação a comprar separado. Use os ids exatos devolvidos por buscarVoos e buscarHoteis.",
  inputSchema: z.object({
    vooId: z.string().describe("id de uma opção devolvida por buscarVoos"),
    hotelId: z.string().describe("id de uma opção devolvida por buscarHoteis"),
    passageiros: z.number().int().min(1).max(9).default(1),
  }),
  async execute({ vooId, hotelId, passageiros }) {
    try {
      const [voo, hotel] = await Promise.all([
        provedores.voos.porId(vooId),
        provedores.hoteis.porId(hotelId),
      ]);

      if (!voo) return falha("Não encontrei esse voo.", "Refaça a busca de voos e use um id da lista.");
      if (!hotel) return falha("Não encontrei esse hotel.", "Refaça a busca de hotéis e use um id da lista.");

      const totalVoo = voo.precoPorPassageiro * passageiros;
      const totalHotel = hotel.total;
      const totalSeparado = totalVoo + totalHotel;

      // Desconto de pacote: cresce com o valor, limitado a 12%.
      const percentual = Math.min(0.12, 0.05 + totalSeparado / 400000);
      const economia = Math.round((totalSeparado * percentual) / 5) * 5;

      return ok("pacote", {
        voo,
        hotel,
        passageiros,
        totalVoo,
        totalHotel,
        totalSeparado,
        total: totalSeparado - economia,
        economia,
        percentualEconomia: Math.round(percentual * 1000) / 10,
      });
    } catch (e) {
      return falhaDe(e);
    }
  },
});

/* --------------------------------------------------------- 4. montarRoteiro */

type BlocoRoteiro = {
  periodo: "manha" | "tarde" | "noite";
  horario: string;
  titulo: string;
  descricao: string;
  duracaoHoras?: number;
  preco?: number;
  deslocamentoMin?: number;
  tipo: "passeio" | "refeicao" | "livre" | "deslocamento";
};

const RITMOS = {
  leve: { porDia: 1, folga: "Tarde livre para descansar ou repetir o que gostou." },
  normal: { porDia: 2, folga: "Fim de tarde livre no bairro do hotel." },
  intenso: { porDia: 3, folga: "Noite livre para jantar sem hora marcada." },
} as const;

function montarDia(
  numero: number,
  data: string,
  passeios: Passeio[],
  ritmo: keyof typeof RITMOS,
  custoRefeicao: { simples: number; restaurante: number },
): { numero: number; data: string; blocos: BlocoRoteiro[]; custoEstimado: number } {
  const blocos: BlocoRoteiro[] = [];
  let custo = 0;

  const doDia = passeios.slice(0, RITMOS[ritmo].porDia);
  const manha = doDia.find((p) => p.periodo === "manha" || p.periodo === "dia-inteiro");
  const tarde = doDia.find((p) => p !== manha && p.periodo !== "noite");
  const noite = doDia.find((p) => p.periodo === "noite");

  blocos.push({
    periodo: "manha",
    horario: "08:00",
    titulo: "Café da manhã",
    descricao: "No hotel ou numa padaria do bairro.",
    preco: custoRefeicao.simples,
    tipo: "refeicao",
  });
  custo += custoRefeicao.simples;

  if (manha) {
    blocos.push({
      periodo: "manha",
      horario: "09:30",
      titulo: manha.nome,
      descricao: manha.descricao,
      duracaoHoras: manha.duracaoHoras,
      preco: manha.preco,
      deslocamentoMin: manha.incluiTransporte ? 0 : 25,
      tipo: "passeio",
    });
    custo += manha.preco;
  }

  blocos.push({
    periodo: "tarde",
    horario: manha && manha.duracaoHoras >= 5 ? "13:30" : "12:30",
    titulo: "Almoço",
    descricao: "Restaurante local perto do passeio da manhã.",
    preco: custoRefeicao.restaurante,
    tipo: "refeicao",
  });
  custo += custoRefeicao.restaurante;

  if (tarde && tarde !== manha) {
    blocos.push({
      periodo: "tarde",
      horario: "15:00",
      titulo: tarde.nome,
      descricao: tarde.descricao,
      duracaoHoras: tarde.duracaoHoras,
      preco: tarde.preco,
      deslocamentoMin: tarde.incluiTransporte ? 0 : 20,
      tipo: "passeio",
    });
    custo += tarde.preco;
  } else if (!manha || manha.duracaoHoras < 5) {
    blocos.push({
      periodo: "tarde",
      horario: "15:00",
      titulo: "Tempo livre",
      descricao: RITMOS[ritmo].folga,
      tipo: "livre",
    });
  }

  if (noite && noite !== manha && noite !== tarde) {
    blocos.push({
      periodo: "noite",
      horario: "20:00",
      titulo: noite.nome,
      descricao: noite.descricao,
      duracaoHoras: noite.duracaoHoras,
      preco: noite.preco,
      tipo: "passeio",
    });
    custo += noite.preco;
  } else {
    blocos.push({
      periodo: "noite",
      horario: "20:00",
      titulo: "Jantar",
      descricao: "Sugestão: um restaurante de bairro, longe da praça principal.",
      preco: custoRefeicao.restaurante,
      tipo: "refeicao",
    });
    custo += custoRefeicao.restaurante;
  }

  void numero;
  void data;
  return { numero, data, blocos, custoEstimado: custo };
}

export const montarRoteiro = tool({
  description:
    "Monta um roteiro dia a dia para um destino, com atrações, refeições e tempo de " +
    "deslocamento. Use quando o usuário pedir o que fazer, quantos dias ficar ou um roteiro.",
  inputSchema: z.object({
    destino: z.string().min(2),
    dias: z.number().int().min(1).max(21),
    dataInicio: dataFutura.optional().describe("Se souber; melhora a apresentação"),
    ritmo: z
      .enum(["leve", "normal", "intenso"])
      .default("normal")
      .describe("leve = 1 passeio por dia, intenso = 3"),
    interesses: z
      .array(z.enum(["cultura", "natureza", "gastronomia", "aventura", "familia", "noite"]))
      .default([]),
    comCriancas: z.boolean().default(false),
  }),
  async execute({ destino, dias, dataInicio, ritmo, interesses, comCriancas }) {
    try {
      const todos = await provedores.passeios.buscar({ cidade: destino, limite: 99 });
      if (todos.length === 0) {
        return falha(
          `Ainda não tenho passeios cadastrados para "${destino}".`,
          "Sugira um destino próximo ou pergunte que tipo de programa o usuário prefere.",
        );
      }

      const custo = await provedores.cambio.custoMedio(destino);
      const refeicoes = {
        simples: custo?.refeicaoSimples ?? 45,
        restaurante: custo?.refeicaoRestaurante ?? 120,
      };

      // Interesses e crianças reordenam a fila; nada é descartado, porque um
      // roteiro de 5 dias precisa de mais passeios do que a filtragem deixaria.
      const pontuar = (p: Passeio) => {
        let nota = p.nota;
        if (interesses.includes(p.categoria)) nota += 5;
        if (comCriancas && p.categoria === "familia") nota += 3;
        if (comCriancas && (p.categoria === "noite" || p.categoria === "aventura")) nota -= 4;
        return nota;
      };

      const fila = [...todos].sort((a, b) => pontuar(b) - pontuar(a));

      const roteiro = [];
      for (let d = 0; d < dias; d++) {
        // Repete o catálogo quando os dias passam do número de passeios, mas
        // sempre a partir de um ponto diferente da fila.
        const doDia = [];
        const porDia = RITMOS[ritmo].porDia;
        for (let k = 0; k < porDia; k++) {
          doDia.push(fila[(d * porDia + k) % fila.length]!);
        }
        roteiro.push(
          montarDia(
            d + 1,
            dataInicio ? somarDias(dataInicio, d) : "",
            doDia,
            ritmo,
            refeicoes,
          ),
        );
      }

      // Persistir aqui é o que permite editar o roteiro depois na tela própria:
      // sem isso, o resultado viveria só dentro da conversa.
      const salvo = await db.itinerary.create({
        data: {
          destino: todos[0]!.cidade,
          titulo: `${dias} dias em ${todos[0]!.cidade}`,
          dias: JSON.stringify(roteiro),
        },
      });

      return ok("roteiro", {
        id: salvo.id,
        destino: todos[0]!.cidade,
        dias,
        ritmo,
        dataInicio,
        roteiro,
        custoEstimadoTotal: roteiro.reduce((s, d) => s + d.custoEstimado, 0),
        observacao:
          "Estimativa por pessoa, sem hospedagem e sem passagem. Ingressos podem variar conforme o dia da semana.",
      });
    } catch (e) {
      return falhaDe(e, "Confirme o destino com o usuário.");
    }
  },
});
