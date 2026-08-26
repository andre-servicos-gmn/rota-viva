import { PrismaClient } from "@prisma/client";
import { provedorDeVoosMock } from "../lib/providers/mock/voos";
import { provedorDeHoteisMock } from "../lib/providers/mock/hoteis";
import { HOJE_ISO, somarDias } from "../lib/datas";

/**
 * Dados de demonstração.
 *
 * Deixa o app com histórico logo na primeira abertura: reservas emitidas, uma
 * conversa esperando atendente, roteiro salvo, alertas de preço e favoritos
 * para comparar. Sem isso, quem abre a POC encontra cinco telas vazias e
 * precisa construir tudo antes de ver qualquer coisa funcionando.
 *
 * Todos os dados são fictícios. As datas são relativas a hoje, para que a demo
 * não envelheça: rodar o seed em qualquer dia produz uma viagem no futuro.
 */

const db = new PrismaClient();

const VIAJANTE = {
  email: "helena.braga@exemplo.com.br",
  nome: "Helena Braga",
  telefone: "+55 11 90000-0000",
};

async function principal() {
  console.log("Limpando dados anteriores…");
  await db.bookingEvent.deleteMany();
  await db.supportTicket.deleteMany();
  await db.booking.deleteMany();
  await db.message.deleteMany();
  await db.favorite.deleteMany();
  await db.itinerary.deleteMany();
  await db.conversation.deleteMany();
  await db.priceAlert.deleteMany();
  await db.traveler.deleteMany();

  const viajante = await db.traveler.create({
    data: {
      ...VIAJANTE,
      prefs: JSON.stringify({
        assento: "corredor",
        ciaPreferida: "Aurora Linhas Aéreas",
        restricaoAlimentar: "vegetariana",
        ritmoDeViagem: "normal",
        fidelidade: ["Rota Viva Clube"],
      }),
      documentos: JSON.stringify([
        { tipo: "Passaporte (fictício)", numero: "XX0000000", validade: "2031-04-12" },
      ]),
    },
  });

  /* ---------------------------------------------------------- reservas */

  const ida = somarDias(HOJE_ISO(), 62);
  const volta = somarDias(HOJE_ISO(), 72);

  const buscaLisboa = await provedorDeVoosMock.buscar({
    origem: "GRU",
    destino: "LIS",
    dataIda: ida,
    dataVolta: volta,
    adultos: 2,
    limite: 3,
  });
  const vooLisboa = buscaLisboa.opcoes[1] ?? buscaLisboa.opcoes[0]!;

  const buscaHotel = await provedorDeHoteisMock.buscar({
    cidade: "Lisboa",
    checkIn: ida,
    checkOut: volta,
    hospedes: 2,
    limite: 4,
  });
  const hotelLisboa = buscaHotel.opcoes[2] ?? buscaHotel.opcoes[0]!;

  const pacote = await db.booking.create({
    data: {
      localizador: "RV-7K2M9P",
      tipo: "PACKAGE",
      status: "CONFIRMED",
      travelerId: viajante.id,
      total: vooLisboa.precoPorPassageiro * 2 + hotelLisboa.total,
      moeda: "BRL",
      fareId: vooLisboa.tarifa.fareId,
      fareRules: JSON.stringify(vooLisboa.tarifa),
      snapshot: JSON.stringify({
        voo: vooLisboa,
        hotel: hotelLisboa,
        passageiros: [
          { nome: "Helena Braga", documento: "XX0000000" },
          { nome: "Rafael Braga", documento: "XX0000001" },
        ],
        contato: { email: VIAJANTE.email, telefone: VIAJANTE.telefone },
      }),
      // Emitida há 6 dias: fora da janela de arrependimento de 24 h, o que faz
      // a demo de cancelamento mostrar multa de verdade.
      criadaEm: new Date(Date.now() - 6 * 86400000),
      eventos: {
        create: {
          tipo: "CREATED",
          detalhes: JSON.stringify({ canal: "chat" }),
          criadoEm: new Date(Date.now() - 6 * 86400000),
        },
      },
    },
  });

  const buscaRio = await provedorDeVoosMock.buscar({
    origem: "GRU",
    destino: "GIG",
    dataIda: somarDias(HOJE_ISO(), 15),
    adultos: 1,
    limite: 2,
  });

  await db.booking.create({
    data: {
      localizador: "RV-3XQ8TB",
      tipo: "FLIGHT",
      status: "CANCELLED",
      travelerId: viajante.id,
      total: buscaRio.opcoes[0]!.precoTotal,
      fareId: buscaRio.opcoes[0]!.tarifa.fareId,
      fareRules: JSON.stringify(buscaRio.opcoes[0]!.tarifa),
      snapshot: JSON.stringify({
        voo: buscaRio.opcoes[0],
        passageiros: [{ nome: "Helena Braga", documento: "XX0000000" }],
        contato: { email: VIAJANTE.email },
      }),
      criadaEm: new Date(Date.now() - 20 * 86400000),
      eventos: {
        create: [
          { tipo: "CREATED", criadoEm: new Date(Date.now() - 20 * 86400000), detalhes: "{}" },
          {
            tipo: "CANCELLED",
            multa: 380,
            criadoEm: new Date(Date.now() - 12 * 86400000),
            detalhes: JSON.stringify({ motivo: "mudança de planos" }),
          },
        ],
      },
    },
  });

  /* -------------------------------------------------------- chamado aberto */

  await db.supportTicket.create({
    data: {
      numero: "CH-408217",
      assunto: "Bagagem não chegou em Lisboa",
      corpo:
        "Desembarquei ontem e a mala despachada não apareceu na esteira. Registrei a " +
        "ocorrência no balcão com o número LIS-88213 e estou sem roupas de trabalho.",
      categoria: "bagagem",
      prioridade: "ALTA",
      status: "ABERTO",
      bookingId: pacote.id,
    },
  });

  /* --------------------------------------------- conversa escalada para humano */

  const conversa = await db.conversation.create({
    data: {
      titulo: "Preciso cancelar sem multa por motivo médico",
      status: "ESCALATED",
      travelerId: viajante.id,
      motivoEscalacao: "Pedido de exceção de política que o agente não pode conceder",
      resumoEscalacao:
        "Cliente comprou tarifa Leve (não reembolsável) e precisa cancelar por cirurgia " +
        "marcada para a semana da viagem. Tem atestado. A política não prevê isenção " +
        "automática; precisa de decisão humana sobre abono da multa.",
      escaladaEm: new Date(Date.now() - 2 * 3600000),
    },
  });

  const mensagens = [
    {
      role: "user",
      parts: [
        {
          type: "text",
          text: "Oi, preciso cancelar a reserva RV-7K2M9P. Vou fazer uma cirurgia na semana da viagem.",
        },
      ],
    },
    {
      role: "assistant",
      parts: [
        {
          type: "text",
          text:
            "Sinto muito pela situação. Vou verificar as regras da sua tarifa antes de " +
            "falar qualquer valor.",
        },
      ],
    },
    {
      role: "user",
      parts: [
        {
          type: "text",
          text: "Tenho atestado médico. Consigo cancelar sem pagar multa?",
        },
      ],
    },
    {
      role: "assistant",
      parts: [
        {
          type: "text",
          text:
            "A tarifa comprada não prevê isenção de multa por motivo médico, e eu não " +
            "tenho alçada para abrir exceção. Vou passar seu caso para um atendente " +
            "humano com tudo o que você já me contou — você não vai precisar repetir nada.",
        },
      ],
    },
  ];

  await db.message.createMany({
    data: mensagens.map((m, i) => ({
      conversationId: conversa.id,
      role: m.role,
      parts: JSON.stringify(m.parts),
      criadaEm: new Date(Date.now() - (4 - i) * 300000),
    })),
  });

  /* ------------------------------------------------------------- roteiro */

  const roteiro = [1, 2, 3].map((numero) => ({
    numero,
    data: somarDias(ida, numero - 1),
    custoEstimado: 0,
    blocos: [
      {
        periodo: "manha",
        horario: "08:00",
        titulo: "Café da manhã",
        descricao: "No hotel ou numa padaria do bairro.",
        preco: 67,
        tipo: "refeicao",
      },
      {
        periodo: "manha",
        horario: "09:30",
        titulo:
          numero === 1
            ? "Torre de Belém e Mosteiro dos Jerónimos"
            : numero === 2
              ? "Bairro de Alfama a pé"
              : "Sintra e Cabo da Roca",
        descricao:
          numero === 1
            ? "Os dois monumentos manuelinos, com fila prioritária e guia em português."
            : numero === 2
              ? "Ruas estreitas, miradouros e a história do bairro que sobreviveu ao terremoto."
              : "Palácio da Pena, centro de Sintra e o ponto mais ocidental da Europa.",
        duracaoHoras: numero === 3 ? 8 : 3,
        preco: numero === 1 ? 180 : numero === 2 ? 120 : 420,
        tipo: "passeio",
      },
      {
        periodo: "tarde",
        horario: "13:00",
        titulo: "Almoço",
        descricao: "Restaurante local perto do passeio da manhã.",
        preco: 211,
        tipo: "refeicao",
      },
      {
        periodo: "noite",
        horario: "20:00",
        titulo: numero === 2 ? "Noite de fado no Chiado" : "Jantar",
        descricao:
          numero === 2
            ? "Jantar com três fadistas em casa pequena, longe do circuito de ônibus."
            : "Sugestão: um restaurante de bairro, longe da praça principal.",
        preco: numero === 2 ? 260 : 211,
        tipo: numero === 2 ? "passeio" : "refeicao",
      },
    ],
  }));

  for (const dia of roteiro) {
    dia.custoEstimado = dia.blocos.reduce((soma, b) => soma + (b.preco ?? 0), 0);
  }

  await db.itinerary.create({
    data: {
      destino: "Lisboa",
      titulo: "3 dias em Lisboa",
      dias: JSON.stringify(roteiro),
    },
  });

  /* ------------------------------------------------------------- alertas */

  const rotasDeAlerta = [
    { origem: "GRU", destino: "SCL", dias: 95 },
    { origem: "GRU", destino: "MIA", dias: 130 },
  ];

  for (const rota of rotasDeAlerta) {
    const data = somarDias(HOJE_ISO(), rota.dias);
    const busca = await provedorDeVoosMock.buscar({
      origem: rota.origem,
      destino: rota.destino,
      dataIda: data,
      adultos: 1,
      limite: 1,
    });
    const preco = busca.opcoes[0]!.precoTotal;

    await db.priceAlert.create({
      data: {
        travelerId: viajante.id,
        origem: rota.origem,
        destino: rota.destino,
        dataAlvo: data,
        // Base um pouco acima do preço atual para que a demo abra já mostrando
        // uma queda — é o estado interessante da tela.
        precoBase: Math.round(preco * 1.14),
        precoAtual: preco,
        alvo: Math.round(preco * 0.9),
        status: "ATIVO",
      },
    });
  }

  /* ----------------------------------------------------------- favoritos */

  const conversaFavoritos = await db.conversation.create({
    data: { titulo: "Comparando voos para Lisboa", travelerId: viajante.id },
  });

  for (const opcao of buscaLisboa.opcoes.slice(0, 3)) {
    await db.favorite.create({
      data: {
        conversationId: conversaFavoritos.id,
        tipo: "FLIGHT",
        refId: opcao.id,
        snapshot: JSON.stringify(opcao),
      },
    });
  }

  for (const opcao of buscaHotel.opcoes.slice(0, 2)) {
    await db.favorite.create({
      data: {
        conversationId: conversaFavoritos.id,
        tipo: "HOTEL",
        refId: opcao.id,
        snapshot: JSON.stringify(opcao),
      },
    });
  }

  console.log(`
Pronto.

  Viajante   ${VIAJANTE.nome} <${VIAJANTE.email}>
  Reservas   RV-7K2M9P (pacote Lisboa, ativa) e RV-3XQ8TB (voo Rio, cancelada)
  Chamado    CH-408217, bagagem extraviada, prioridade alta
  Atendente  1 conversa na fila esperando humano
  Roteiro    3 dias em Lisboa, editável
  Alertas    2 rotas, ambas com queda de preço
  Favoritos  3 voos e 2 hotéis para comparar
`);
}

principal()
  .catch((e) => {
    console.error("Falha ao popular o banco:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
