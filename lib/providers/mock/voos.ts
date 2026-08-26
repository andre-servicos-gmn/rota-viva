import type {
  Cabine,
  CriteriosDeVoo,
  OpcaoVoo,
  ProvedorDeVoos,
  RegrasTarifarias,
  ResultadoDeVoos,
  Trecho,
  Aeroporto,
  Companhia,
} from "@/lib/providers/types";
import { geradorDe } from "./aleatorio";
import { distanciaKm, resolverAeroporto, AEROPORTOS } from "./data/lugares";
import {
  AERONAVES_CURTAS,
  AERONAVES_LONGAS,
  COMPANHIAS,
  COMPANHIAS_LONGO_CURSO,
  FAMILIAS_TARIFARIAS,
  MULTIPLICADOR_CABINE,
  MULTIPLICADOR_TARIFA,
} from "./data/companhias";
import {
  HOJE_ISO,
  diaDaSemana,
  diferencaEmDias,
  mes,
  montarHorario,
  somarDias,
  somarMinutos,
} from "@/lib/datas";

/**
 * Busca de voos mockada.
 *
 * Realista onde importa: distância real entre aeroportos define duração e
 * preço; antecedência, dia da semana e temporada mexem no valor; escalas passam
 * por hubs plausíveis. Determinística por construção — a mesma busca devolve
 * sempre o mesmo resultado (ver `aleatorio.ts`).
 */

const VELOCIDADE_KM_H = 830;
const TEMPO_SOLO_MIN = 35;
const OPCOES_GERADAS = 18;

/** Hubs usados como conexão, por região de destino. */
const HUBS = ["GRU", "BSB", "LIS", "MAD", "MIA", "CDG", "EZE", "REC"];

function duracaoDeVoo(km: number) {
  return Math.round((km / VELOCIDADE_KM_H) * 60 + TEMPO_SOLO_MIN);
}

/**
 * Preço base da ida, antes de cabine, tarifa e sazonalidade.
 *
 * Calibrado para cair nas faixas que se vê no mercado brasileiro: São Paulo–Rio
 * na casa dos R$ 400, São Paulo–Lisboa ida e volta entre R$ 4 mil e R$ 6 mil na
 * econômica. O valor por km cai conforme a distância cresce, como na vida real.
 */
function precoBase(km: number) {
  if (km < 800) return 210 + km * 0.5;
  if (km < 3000) return 300 + km * 0.3;
  if (km < 7000) return 620 + km * 0.21;
  return 780 + km * 0.185;
}

function fatorAntecedencia(dias: number) {
  if (dias < 0) return 1.6;
  if (dias <= 3) return 1.58;
  if (dias <= 7) return 1.4;
  if (dias <= 21) return 1.14;
  if (dias <= 60) return 1;
  if (dias <= 120) return 0.93;
  return 0.89;
}

function fatorDiaDaSemana(iso: string) {
  const dia = diaDaSemana(iso);
  if (dia === 5 || dia === 0) return 1.12; // sexta e domingo
  if (dia === 2 || dia === 3) return 0.94; // terça e quarta
  return 1;
}

function fatorTemporada(iso: string) {
  const m = mes(iso);
  if (m === 1 || m === 7 || m === 12) return 1.22; // férias
  if (m === 2 || m === 6) return 1.08;
  if (m === 3 || m === 5 || m === 9) return 0.95;
  return 1;
}

function escolherHub(origem: Aeroporto, destino: Aeroporto, gerador: ReturnType<typeof geradorDe>) {
  const candidatos = AEROPORTOS.filter(
    (a) =>
      HUBS.includes(a.iata) &&
      a.iata !== origem.iata &&
      a.iata !== destino.iata &&
      // Uma conexão que aumenta demais o caminho não é conexão, é passeio: com
      // o limite frouxo anterior, um GRU→LIS chegava a conectar em Buenos Aires,
      // que fica no rumo oposto.
      distanciaKm(origem, a) + distanciaKm(a, destino) <
        distanciaKm(origem, destino) * 1.25 + 350,
  );
  if (candidatos.length === 0) return null;
  return gerador.umDe(candidatos);
}

function montarPerna(
  origem: Aeroporto,
  destino: Aeroporto,
  data: string,
  paradas: number,
  companhia: Companhia,
  gerador: ReturnType<typeof geradorDe>,
): Trecho[] {
  const longo = distanciaKm(origem, destino) > 3500;
  const aeronaves = longo ? AERONAVES_LONGAS : AERONAVES_CURTAS;
  const partidaMin = gerador.inteiro(5, 22) * 60 + gerador.umDe([0, 10, 20, 25, 35, 45, 50]);

  if (paradas === 0) {
    const km = distanciaKm(origem, destino);
    const duracao = duracaoDeVoo(km);
    const partida = montarHorario(data, partidaMin);
    return [
      {
        numeroVoo: `${companhia.codigo} ${gerador.inteiro(1000, 9899)}`,
        companhia,
        origem: origem.iata,
        destino: destino.iata,
        partida,
        chegada: somarMinutos(partida, duracao + (destino.fusoRelativo - origem.fusoRelativo) * 60),
        duracaoMin: duracao,
        aeronave: gerador.umDe(aeronaves),
      },
    ];
  }

  const hub = escolherHub(origem, destino, gerador);
  if (!hub) {
    // Sem conexão plausível, devolve o voo direto em vez de inventar uma rota absurda.
    return montarPerna(origem, destino, data, 0, companhia, gerador);
  }

  const km1 = distanciaKm(origem, hub);
  const km2 = distanciaKm(hub, destino);
  const dur1 = duracaoDeVoo(km1);
  const dur2 = duracaoDeVoo(km2);
  const conexao = gerador.inteiro(55, 195);

  const partida1 = montarHorario(data, partidaMin);
  const chegada1 = somarMinutos(partida1, dur1 + (hub.fusoRelativo - origem.fusoRelativo) * 60);
  const partida2 = somarMinutos(chegada1, conexao);
  const chegada2 = somarMinutos(partida2, dur2 + (destino.fusoRelativo - hub.fusoRelativo) * 60);

  return [
    {
      numeroVoo: `${companhia.codigo} ${gerador.inteiro(1000, 9899)}`,
      companhia,
      origem: origem.iata,
      destino: hub.iata,
      partida: partida1,
      chegada: chegada1,
      duracaoMin: dur1,
      aeronave: gerador.umDe(aeronaves),
    },
    {
      numeroVoo: `${companhia.codigo} ${gerador.inteiro(1000, 9899)}`,
      companhia,
      origem: hub.iata,
      destino: destino.iata,
      partida: partida2,
      chegada: chegada2,
      duracaoMin: dur2,
      aeronave: gerador.umDe(aeronaves),
    },
  ];
}

function duracaoDaPerna(trechos: Trecho[], origem: Aeroporto, destino: Aeroporto) {
  const primeiro = trechos[0];
  const ultimo = trechos[trechos.length - 1];
  if (!primeiro || !ultimo) return 0;
  const minutosVoo = trechos.reduce((soma, t) => soma + t.duracaoMin, 0);
  if (trechos.length === 1) return minutosVoo;
  // Conexões entram no total: é o que separa "3h de voo" de "9h de viagem".
  const conexoes = trechos.slice(1).reduce((soma, t, i) => {
    const anterior = trechos[i]!;
    const espera =
      diferencaEmDias(anterior.chegada.slice(0, 10), t.partida.slice(0, 10)) * 1440 +
      (Number(t.partida.slice(11, 13)) * 60 + Number(t.partida.slice(14, 16))) -
      (Number(anterior.chegada.slice(11, 13)) * 60 + Number(anterior.chegada.slice(14, 16)));
    return soma + Math.max(0, espera);
  }, 0);
  void origem;
  void destino;
  return minutosVoo + conexoes;
}

function gerarOpcoes(criterios: CriteriosDeVoo, origem: Aeroporto, destino: Aeroporto) {
  const cabine: Cabine = criterios.cabine ?? "economica";
  const km = distanciaKm(origem, destino);
  const longo = km > 3500;
  const poolCias = longo ? COMPANHIAS_LONGO_CURSO : COMPANHIAS;
  const passageiros = (criterios.adultos ?? 1) + (criterios.criancas ?? 0);
  const diasAteIda = diferencaEmDias(HOJE_ISO(), criterios.dataIda);

  const opcoes: OpcaoVoo[] = [];

  for (let i = 0; i < OPCOES_GERADAS; i++) {
    const chave = `${origem.iata}-${destino.iata}-${criterios.dataIda}-${
      criterios.dataVolta ?? "so-ida"
    }-${cabine}-${i}`;
    const g = geradorDe(chave);

    const companhia = poolCias[i % poolCias.length]!;

    // Distribuição de escalas: rota curta quase sempre direta; longa costuma parar.
    const maxParadasNaturais = km < 1200 ? 1 : 2;
    const paradas = km < 1200 ? (i % 4 === 3 ? 1 : 0) : i % 3 === 0 ? 0 : g.inteiro(1, maxParadasNaturais);

    const ida = montarPerna(origem, destino, criterios.dataIda, Math.min(paradas, 1), companhia, g);
    const volta = criterios.dataVolta
      ? montarPerna(destino, origem, criterios.dataVolta, Math.min(paradas, 1), companhia, g)
      : [];

    const familia = FAMILIAS_TARIFARIAS[i % FAMILIAS_TARIFARIAS.length]!;
    const tarifa: RegrasTarifarias = {
      ...familia,
      fareId: `${companhia.codigo}-${familia.nome.toUpperCase()}-${cabine.slice(0, 3).toUpperCase()}`,
    };

    const base = precoBase(km);
    const fatorCia = 0.88 + companhia.conforto * 0.055;
    const fatorEscala = paradas === 0 ? 1.13 : paradas === 1 ? 0.94 : 0.86;
    const ruido = g.numero(0.92, 1.1, 3);

    let porPassageiro =
      base *
      fatorAntecedencia(diasAteIda) *
      fatorDiaDaSemana(criterios.dataIda) *
      fatorTemporada(criterios.dataIda) *
      fatorCia *
      fatorEscala *
      ruido *
      (MULTIPLICADOR_CABINE[cabine] ?? 1) *
      (MULTIPLICADOR_TARIFA[familia.nome] ?? 1);

    if (criterios.dataVolta) porPassageiro *= 1.86;

    porPassageiro = Math.round(porPassageiro / 5) * 5;
    const taxas = Math.round(porPassageiro * 0.11);

    opcoes.push({
      id: `V~${origem.iata}~${destino.iata}~${criterios.dataIda}~${
        criterios.dataVolta ?? ""
      }~${cabine}~${i}`,
      origem,
      destino,
      ida,
      volta,
      paradas: Math.max(ida.length - 1, volta.length ? volta.length - 1 : 0),
      duracaoIdaMin: duracaoDaPerna(ida, origem, destino),
      duracaoVoltaMin: volta.length ? duracaoDaPerna(volta, destino, origem) : 0,
      duracaoTotalMin:
        duracaoDaPerna(ida, origem, destino) +
        (volta.length ? duracaoDaPerna(volta, destino, origem) : 0),
      cabine,
      companhiaPrincipal: companhia,
      precoPorPassageiro: porPassageiro,
      precoTotal: porPassageiro * Math.max(1, passageiros),
      taxas,
      moeda: "BRL",
      assentosRestantes: g.inteiro(1, 9),
      tarifa,
      destaques: [],
    });
  }

  return opcoes;
}

function marcarDestaques(opcoes: OpcaoVoo[]) {
  if (opcoes.length === 0) return opcoes;

  const maisBarata = opcoes.reduce((a, b) => (b.precoTotal < a.precoTotal ? b : a));
  const maisRapida = opcoes.reduce((a, b) => (b.duracaoIdaMin < a.duracaoIdaMin ? b : a));

  // Custo-benefício: menor produto normalizado de preço e duração.
  const precoMin = maisBarata.precoTotal;
  const duracaoMin = maisRapida.duracaoIdaMin;
  const equilibrada = opcoes.reduce((a, b) => {
    const nota = (o: OpcaoVoo) =>
      (o.precoTotal / precoMin) * 0.62 + (o.duracaoIdaMin / duracaoMin) * 0.38;
    return nota(b) < nota(a) ? b : a;
  });

  for (const opcao of opcoes) {
    const destaques: string[] = [];
    if (opcao.id === maisBarata.id) destaques.push("mais barato");
    if (opcao.id === maisRapida.id) destaques.push("mais rápido");
    if (opcao.id === equilibrada.id && destaques.length === 0) {
      destaques.push("melhor equilíbrio");
    }
    if (opcao.paradas === 0) destaques.push("sem escalas");
    if (opcao.assentosRestantes <= 3) destaques.push("poucos assentos");
    opcao.destaques = destaques;
  }

  return opcoes;
}

function aplicarFiltros(opcoes: OpcaoVoo[], criterios: CriteriosDeVoo) {
  let filtradas = opcoes;

  if (criterios.maxParadas !== undefined) {
    filtradas = filtradas.filter((o) => o.paradas <= criterios.maxParadas!);
  }
  if (criterios.companhiaPreferida) {
    const alvo = criterios.companhiaPreferida.toLowerCase();
    const preferidas = filtradas.filter(
      (o) =>
        o.companhiaPrincipal.nome.toLowerCase().includes(alvo) ||
        o.companhiaPrincipal.codigo.toLowerCase() === alvo,
    );
    // Preferência não é exclusão: se não houver nenhuma, mantém a lista completa.
    if (preferidas.length > 0) filtradas = preferidas;
  }

  const ordem = criterios.ordenar ?? "preco";
  const ordenadas = [...filtradas].sort((a, b) => {
    if (ordem === "duracao") return a.duracaoIdaMin - b.duracaoIdaMin;
    if (ordem === "partida") return (a.ida[0]?.partida ?? "").localeCompare(b.ida[0]?.partida ?? "");
    if (ordem === "conforto") {
      return (
        b.companhiaPrincipal.conforto - a.companhiaPrincipal.conforto ||
        a.precoTotal - b.precoTotal
      );
    }
    return a.precoTotal - b.precoTotal;
  });

  return ordenadas;
}

function calendarioFlexivel(criterios: CriteriosDeVoo, origem: Aeroporto, destino: Aeroporto) {
  const dias: { data: string; precoMinimo: number; ehMaisBarato: boolean }[] = [];

  for (let delta = -3; delta <= 3; delta++) {
    const data = somarDias(criterios.dataIda, delta);
    if (diferencaEmDias(HOJE_ISO(), data) < 0) continue;

    const opcoes = gerarOpcoes(
      {
        ...criterios,
        dataIda: data,
        dataVolta: criterios.dataVolta
          ? somarDias(criterios.dataVolta, delta)
          : undefined,
      },
      origem,
      destino,
    );

    const minimo = opcoes.reduce(
      (menor, o) => Math.min(menor, o.precoTotal),
      Number.POSITIVE_INFINITY,
    );
    dias.push({ data, precoMinimo: minimo, ehMaisBarato: false });
  }

  const menorDeTodos = dias.reduce(
    (menor, d) => Math.min(menor, d.precoMinimo),
    Number.POSITIVE_INFINITY,
  );
  for (const dia of dias) dia.ehMaisBarato = dia.precoMinimo === menorDeTodos;

  return dias;
}

export const provedorDeVoosMock: ProvedorDeVoos = {
  async buscar(criterios: CriteriosDeVoo): Promise<ResultadoDeVoos> {
    const origem = resolverAeroporto(criterios.origem);
    const destino = resolverAeroporto(criterios.destino);

    if (!origem) throw new Error(`Não conheço a origem "${criterios.origem}".`);
    if (!destino) throw new Error(`Não conheço o destino "${criterios.destino}".`);
    if (origem.iata === destino.iata) {
      throw new Error("Origem e destino são o mesmo aeroporto.");
    }

    // Sem esta guarda, uma data passada cai no fator de "última hora" e devolve
    // uma lista cara e silenciosamente errada em vez de avisar.
    if (diferencaEmDias(HOJE_ISO(), criterios.dataIda) < 0) {
      throw new Error(`A data de ida (${criterios.dataIda}) já passou.`);
    }
    if (criterios.dataVolta && diferencaEmDias(criterios.dataIda, criterios.dataVolta) < 0) {
      throw new Error("A volta não pode ser antes da ida.");
    }

    const todas = marcarDestaques(gerarOpcoes(criterios, origem, destino));
    const ordenadas = aplicarFiltros(todas, criterios);
    const limite = criterios.limite ?? 6;

    return {
      opcoes: ordenadas.slice(0, limite),
      totalEncontrado: ordenadas.length,
      calendario: criterios.flexivel ? calendarioFlexivel(criterios, origem, destino) : [],
    };
  },

  async porId(id: string): Promise<OpcaoVoo | null> {
    // O id carrega os parâmetros da busca: regenerar é mais confiável que
    // guardar estado em memória, que não sobrevive a um restart do servidor.
    const partes = id.split("~");
    if (partes.length !== 7 || partes[0] !== "V") return null;

    const [, origemIata, destinoIata, dataIda, dataVolta, cabine, indice] = partes as [
      string, string, string, string, string, string, string,
    ];

    const origem = resolverAeroporto(origemIata);
    const destino = resolverAeroporto(destinoIata);
    if (!origem || !destino) return null;

    const opcoes = marcarDestaques(
      gerarOpcoes(
        {
          origem: origemIata,
          destino: destinoIata,
          dataIda,
          dataVolta: dataVolta || undefined,
          adultos: 1,
          cabine: cabine as Cabine,
        },
        origem,
        destino,
      ),
    );

    return opcoes[Number(indice)] ?? null;
  },
};
