import type { Aeroporto } from "@/lib/providers/types";

/**
 * Catálogo de destinos da POC.
 *
 * Códigos IATA e coordenadas são reais — é o que faz duração de voo, fuso e
 * distância saírem plausíveis. Preços, disponibilidade e horários, não: são
 * gerados. Trocar por um provedor real significa substituir este arquivo por
 * uma consulta ao catálogo do fornecedor.
 */
export const AEROPORTOS: Aeroporto[] = [
  // Brasil
  { iata: "GRU", nome: "Guarulhos", cidade: "São Paulo", pais: "Brasil", paisCodigo: "BR", lat: -23.43, lon: -46.47, moeda: "BRL", fusoRelativo: 0 },
  { iata: "GIG", nome: "Galeão", cidade: "Rio de Janeiro", pais: "Brasil", paisCodigo: "BR", lat: -22.81, lon: -43.25, moeda: "BRL", fusoRelativo: 0 },
  { iata: "BSB", nome: "Presidente Juscelino Kubitschek", cidade: "Brasília", pais: "Brasil", paisCodigo: "BR", lat: -15.87, lon: -47.92, moeda: "BRL", fusoRelativo: 0 },
  { iata: "SSA", nome: "Deputado Luís Eduardo Magalhães", cidade: "Salvador", pais: "Brasil", paisCodigo: "BR", lat: -12.91, lon: -38.33, moeda: "BRL", fusoRelativo: 0 },
  { iata: "REC", nome: "Guararapes", cidade: "Recife", pais: "Brasil", paisCodigo: "BR", lat: -8.13, lon: -34.92, moeda: "BRL", fusoRelativo: 0 },
  { iata: "FOR", nome: "Pinto Martins", cidade: "Fortaleza", pais: "Brasil", paisCodigo: "BR", lat: -3.78, lon: -38.53, moeda: "BRL", fusoRelativo: 0 },
  { iata: "POA", nome: "Salgado Filho", cidade: "Porto Alegre", pais: "Brasil", paisCodigo: "BR", lat: -29.99, lon: -51.17, moeda: "BRL", fusoRelativo: 0 },
  { iata: "CWB", nome: "Afonso Pena", cidade: "Curitiba", pais: "Brasil", paisCodigo: "BR", lat: -25.53, lon: -49.17, moeda: "BRL", fusoRelativo: 0 },
  { iata: "FLN", nome: "Hercílio Luz", cidade: "Florianópolis", pais: "Brasil", paisCodigo: "BR", lat: -27.67, lon: -48.55, moeda: "BRL", fusoRelativo: 0 },
  { iata: "MCZ", nome: "Zumbi dos Palmares", cidade: "Maceió", pais: "Brasil", paisCodigo: "BR", lat: -9.51, lon: -35.79, moeda: "BRL", fusoRelativo: 0 },
  { iata: "MAO", nome: "Eduardo Gomes", cidade: "Manaus", pais: "Brasil", paisCodigo: "BR", lat: -3.04, lon: -60.05, moeda: "BRL", fusoRelativo: -1 },
  { iata: "BEL", nome: "Val de Cans", cidade: "Belém", pais: "Brasil", paisCodigo: "BR", lat: -1.38, lon: -48.48, moeda: "BRL", fusoRelativo: 0 },
  { iata: "NAT", nome: "Aluízio Alves", cidade: "Natal", pais: "Brasil", paisCodigo: "BR", lat: -5.77, lon: -35.37, moeda: "BRL", fusoRelativo: 0 },
  { iata: "IGU", nome: "Cataratas", cidade: "Foz do Iguaçu", pais: "Brasil", paisCodigo: "BR", lat: -25.6, lon: -54.49, moeda: "BRL", fusoRelativo: 0 },

  // América do Sul e Central
  { iata: "EZE", nome: "Ezeiza", cidade: "Buenos Aires", pais: "Argentina", paisCodigo: "AR", lat: -34.82, lon: -58.54, moeda: "ARS", fusoRelativo: 0 },
  { iata: "SCL", nome: "Arturo Merino Benítez", cidade: "Santiago", pais: "Chile", paisCodigo: "CL", lat: -33.39, lon: -70.79, moeda: "CLP", fusoRelativo: 0 },
  { iata: "MVD", nome: "Carrasco", cidade: "Montevidéu", pais: "Uruguai", paisCodigo: "UY", lat: -34.84, lon: -56.03, moeda: "UYU", fusoRelativo: 0 },
  { iata: "LIM", nome: "Jorge Chávez", cidade: "Lima", pais: "Peru", paisCodigo: "PE", lat: -12.02, lon: -77.11, moeda: "PEN", fusoRelativo: -2 },
  { iata: "BOG", nome: "El Dorado", cidade: "Bogotá", pais: "Colômbia", paisCodigo: "CO", lat: 4.7, lon: -74.15, moeda: "COP", fusoRelativo: -2 },
  { iata: "CUN", nome: "Cancún", cidade: "Cancún", pais: "México", paisCodigo: "MX", lat: 21.04, lon: -86.87, moeda: "MXN", fusoRelativo: -2 },
  { iata: "MEX", nome: "Benito Juárez", cidade: "Cidade do México", pais: "México", paisCodigo: "MX", lat: 19.44, lon: -99.07, moeda: "MXN", fusoRelativo: -3 },

  // América do Norte
  { iata: "MIA", nome: "Miami International", cidade: "Miami", pais: "Estados Unidos", paisCodigo: "US", lat: 25.79, lon: -80.29, moeda: "USD", fusoRelativo: -1 },
  { iata: "JFK", nome: "John F. Kennedy", cidade: "Nova York", pais: "Estados Unidos", paisCodigo: "US", lat: 40.64, lon: -73.78, moeda: "USD", fusoRelativo: -1 },
  { iata: "LAX", nome: "Los Angeles International", cidade: "Los Angeles", pais: "Estados Unidos", paisCodigo: "US", lat: 33.94, lon: -118.41, moeda: "USD", fusoRelativo: -4 },

  // Europa
  { iata: "LIS", nome: "Humberto Delgado", cidade: "Lisboa", pais: "Portugal", paisCodigo: "PT", lat: 38.77, lon: -9.13, moeda: "EUR", fusoRelativo: 4 },
  { iata: "OPO", nome: "Francisco Sá Carneiro", cidade: "Porto", pais: "Portugal", paisCodigo: "PT", lat: 41.24, lon: -8.68, moeda: "EUR", fusoRelativo: 4 },
  { iata: "MAD", nome: "Barajas", cidade: "Madri", pais: "Espanha", paisCodigo: "ES", lat: 40.47, lon: -3.56, moeda: "EUR", fusoRelativo: 5 },
  { iata: "BCN", nome: "El Prat", cidade: "Barcelona", pais: "Espanha", paisCodigo: "ES", lat: 41.3, lon: 2.08, moeda: "EUR", fusoRelativo: 5 },
  { iata: "CDG", nome: "Charles de Gaulle", cidade: "Paris", pais: "França", paisCodigo: "FR", lat: 49.01, lon: 2.55, moeda: "EUR", fusoRelativo: 5 },
  { iata: "FCO", nome: "Fiumicino", cidade: "Roma", pais: "Itália", paisCodigo: "IT", lat: 41.8, lon: 12.25, moeda: "EUR", fusoRelativo: 5 },
  { iata: "LHR", nome: "Heathrow", cidade: "Londres", pais: "Reino Unido", paisCodigo: "GB", lat: 51.47, lon: -0.45, moeda: "GBP", fusoRelativo: 4 },
  { iata: "AMS", nome: "Schiphol", cidade: "Amsterdã", pais: "Países Baixos", paisCodigo: "NL", lat: 52.31, lon: 4.76, moeda: "EUR", fusoRelativo: 5 },

  // Outros
  { iata: "JNB", nome: "O. R. Tambo", cidade: "Joanesburgo", pais: "África do Sul", paisCodigo: "ZA", lat: -26.13, lon: 28.24, moeda: "ZAR", fusoRelativo: 5 },
  { iata: "DXB", nome: "Dubai International", cidade: "Dubai", pais: "Emirados Árabes Unidos", paisCodigo: "AE", lat: 25.25, lon: 55.36, moeda: "AED", fusoRelativo: 7 },
  { iata: "NRT", nome: "Narita", cidade: "Tóquio", pais: "Japão", paisCodigo: "JP", lat: 35.77, lon: 140.39, moeda: "JPY", fusoRelativo: 12 },
];

/** Sinônimos que aparecem quando alguém escreve à mão no chat. */
const APELIDOS: Record<string, string> = {
  sp: "GRU",
  "sao paulo": "GRU",
  "s paulo": "GRU",
  guarulhos: "GRU",
  congonhas: "GRU",
  rio: "GIG",
  "rio de janeiro": "GIG",
  galeao: "GIG",
  bh: "BSB",
  df: "BSB",
  brasilia: "BSB",
  floripa: "FLN",
  "buenos aires": "EZE",
  baires: "EZE",
  ny: "JFK",
  "nova iorque": "JFK",
  "new york": "JFK",
  "nova york": "JFK",
  la: "LAX",
  eua: "MIA",
  lisboa: "LIS",
  madrid: "MAD",
  paris: "CDG",
  roma: "FCO",
  londres: "LHR",
  amsterda: "AMS",
  toquio: "NRT",
  "cidade do mexico": "MEX",
  mexico: "MEX",
};

/** Remove acento e baixa a caixa — "Brasília" e "brasilia" viram a mesma chave. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function resolverAeroporto(termo: string): Aeroporto | null {
  if (!termo) return null;
  const alvo = normalizar(termo);

  const porIata = AEROPORTOS.find((a) => a.iata.toLowerCase() === alvo);
  if (porIata) return porIata;

  const apelido = APELIDOS[alvo];
  if (apelido) {
    const encontrado = AEROPORTOS.find((a) => a.iata === apelido);
    if (encontrado) return encontrado;
  }

  const porCidade = AEROPORTOS.find((a) => normalizar(a.cidade) === alvo);
  if (porCidade) return porCidade;

  // Última tentativa: a cidade contém o termo ("rio de janeiro / rj").
  return (
    AEROPORTOS.find(
      (a) => normalizar(a.cidade).includes(alvo) || alvo.includes(normalizar(a.cidade)),
    ) ?? null
  );
}

/** Distância em km pela fórmula de haversine — base da duração e do preço. */
export function distanciaKm(a: Aeroporto, b: Aeroporto) {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}
