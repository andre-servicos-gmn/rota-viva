/**
 * Datas sem fuso.
 *
 * A POC trabalha com hora local de cada aeroporto, em strings
 * "AAAA-MM-DD" e "AAAA-MM-DDTHH:mm". Usar `Date` com fuso aqui só criaria
 * viagens que partem no dia anterior por causa do horário de Brasília.
 */

export const HOJE_ISO = () => new Date().toISOString().slice(0, 10);

export function ehDataValida(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [a, m, d] = iso.split("-").map(Number) as [number, number, number];
  const data = new Date(Date.UTC(a, m - 1, d));
  return (
    data.getUTCFullYear() === a &&
    data.getUTCMonth() === m - 1 &&
    data.getUTCDate() === d
  );
}

export function somarDias(iso: string, dias: number) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  const data = new Date(Date.UTC(a, m - 1, d));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function diferencaEmDias(de: string, ate: string) {
  const [a1, m1, d1] = de.slice(0, 10).split("-").map(Number) as [number, number, number];
  const [a2, m2, d2] = ate.slice(0, 10).split("-").map(Number) as [number, number, number];
  const inicio = Date.UTC(a1, m1 - 1, d1);
  const fim = Date.UTC(a2, m2 - 1, d2);
  return Math.round((fim - inicio) / 86400000);
}

/** 0 = domingo. */
export function diaDaSemana(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export function mes(iso: string) {
  return Number(iso.slice(5, 7));
}

/** "2026-10-12" + 8h30 + 145min -> "2026-10-12T10:55". */
export function montarHorario(dataIso: string, minutosDoDia: number) {
  const diasExtras = Math.floor(minutosDoDia / 1440);
  const restante = ((minutosDoDia % 1440) + 1440) % 1440;
  const data = diasExtras ? somarDias(dataIso, diasExtras) : dataIso.slice(0, 10);
  const h = String(Math.floor(restante / 60)).padStart(2, "0");
  const m = String(restante % 60).padStart(2, "0");
  return `${data}T${h}:${m}`;
}

export function minutosDoDia(isoDateTime: string) {
  const hora = Number(isoDateTime.slice(11, 13));
  const minuto = Number(isoDateTime.slice(14, 16));
  return hora * 60 + minuto;
}

export function somarMinutos(isoDateTime: string, minutos: number) {
  return montarHorario(isoDateTime.slice(0, 10), minutosDoDia(isoDateTime) + minutos);
}

/**
 * "seg, 12 out" — montado à mão porque o toLocaleDateString do pt-BR devolve
 * "seg., 12 de out." e a abreviação com ponto final vira "out.." no meio de
 * uma frase.
 */
export function dataPorExtenso(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  const data = new Date(a, m - 1, d);
  const semana = data
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(/\.$/, "");
  const mesCurto = data
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(/\.$/, "");
  return `${semana}, ${String(d).padStart(2, "0")} ${mesCurto}`;
}

/** "10:55" a partir de "2026-10-12T10:55". */
export function hora(isoDateTime: string) {
  return isoDateTime.slice(11, 16);
}

/** Diferença de dias entre a partida e a chegada, para o "+1" nos cartões. */
export function viradaDeDia(partida: string, chegada: string) {
  return diferencaEmDias(partida.slice(0, 10), chegada.slice(0, 10));
}
