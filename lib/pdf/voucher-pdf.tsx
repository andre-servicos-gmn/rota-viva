import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Reserva } from "@/lib/repos/reservas";
import { brl } from "@/lib/utils";
import { dataPorExtenso, hora } from "@/lib/datas";

/**
 * Voucher em PDF.
 *
 * O mesmo bilhete da tela, redesenhado para o papel: corpo à esquerda, canhoto à
 * direita, perfuração no meio e carimbo de estado. Usa as fontes padrão do PDF
 * (Helvetica e Courier) de propósito — registrar Archivo e IBM Plex exigiria
 * baixar os arquivos em tempo de build, e um voucher precisa gerar mesmo quando
 * a rede não coopera. A identidade é sustentada pelo desenho e pelas cores.
 */

const COR = {
  noite: "#0B1524",
  taxiway: "#1B3A6B",
  nevoa: "#EDF1F5",
  pista: "#F2B705",
  eixo: "#2E7D5B",
  lacre: "#B02E3A",
  linha: "#D3DCE6",
  tinta2: "#4A5B70",
  tinta3: "#6B7C92",
};

const estilos = StyleSheet.create({
  pagina: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COR.noite,
    backgroundColor: "#FFFFFF",
  },

  faixa: { height: 4, backgroundColor: COR.pista, marginBottom: 18 },

  marca: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  submarca: {
    fontSize: 7,
    fontFamily: "Courier",
    color: COR.tinta3,
    letterSpacing: 2,
    marginTop: 3,
    textTransform: "uppercase",
  },

  bilhete: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COR.linha,
    borderRadius: 3,
    marginTop: 20,
  },
  corpo: { flex: 1, padding: 16 },
  picote: { width: 1, backgroundColor: COR.linha, marginVertical: 10 },
  canhoto: { width: 130, padding: 16, alignItems: "center", justifyContent: "center" },

  rotulo: {
    fontSize: 6.5,
    fontFamily: "Courier",
    color: COR.tinta3,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  localizador: { fontSize: 20, fontFamily: "Courier-Bold", letterSpacing: 1 },

  carimbo: {
    borderWidth: 1.5,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 8,
    fontFamily: "Courier-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  secao: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COR.linha },
  rota: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  horario: { fontSize: 17, fontFamily: "Helvetica-Bold" },
  iata: { fontSize: 10, fontFamily: "Courier", color: COR.tinta2, marginTop: 2 },
  tracoRota: { flex: 1, borderBottomWidth: 1, borderBottomColor: COR.linha, borderBottomStyle: "dashed", marginHorizontal: 10, marginBottom: 6 },

  linhaInfo: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  texto: { fontSize: 9.5, color: COR.noite },
  apoio: { fontSize: 8.5, color: COR.tinta2 },

  total: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 2 },

  regras: {
    marginTop: 18,
    padding: 12,
    backgroundColor: COR.nevoa,
    borderRadius: 3,
  },
  tituloRegras: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  itemRegra: { fontSize: 8.5, color: COR.tinta2, marginBottom: 2 },

  rodape: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: COR.linha,
    paddingTop: 8,
    fontSize: 7.5,
    color: COR.tinta3,
  },
});

export function VoucherPDF({ reserva }: { reserva: Reserva }) {
  const { snapshot, regras } = reserva;
  const voo = snapshot.voo;
  const hotel = snapshot.hotel;

  const carimbo = {
    CONFIRMED: { texto: "Emitido", cor: COR.eixo },
    CHANGED: { texto: "Alterado", cor: COR.taxiway },
    CANCELLED: { texto: "Cancelado", cor: COR.lacre },
  }[reserva.status];

  return (
    <Document
      title={`Voucher ${reserva.localizador} — Rota Viva`}
      author="Rota Viva"
      subject="Voucher de viagem (demonstração)"
    >
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.faixa} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={estilos.marca}>ROTA VIVA</Text>
            <Text style={estilos.submarca}>Despacho de viagens</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={estilos.rotulo}>Emitido em</Text>
            <Text style={estilos.texto}>
              {reserva.criadaEm.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------------ bilhete */}
        <View style={estilos.bilhete}>
          <View style={estilos.corpo}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={estilos.rotulo}>Localizador</Text>
                <Text style={estilos.localizador}>{reserva.localizador}</Text>
              </View>
              <Text style={[estilos.carimbo, { color: carimbo.cor, borderColor: carimbo.cor }]}>
                {carimbo.texto}
              </Text>
            </View>

            {voo ? (
              <View style={estilos.secao}>
                <Text style={estilos.rotulo}>
                  {voo.companhiaPrincipal.nome} · {voo.ida[0]?.numeroVoo}
                </Text>
                <View style={estilos.rota}>
                  <View>
                    <Text style={estilos.horario}>{hora(voo.ida[0]!.partida)}</Text>
                    <Text style={estilos.iata}>{voo.origem.iata}</Text>
                  </View>
                  <View style={estilos.tracoRota} />
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={estilos.horario}>
                      {hora(voo.ida[voo.ida.length - 1]!.chegada)}
                    </Text>
                    <Text style={estilos.iata}>{voo.destino.iata}</Text>
                  </View>
                </View>
                <Text style={[estilos.apoio, { marginTop: 6 }]}>
                  {dataPorExtenso(voo.ida[0]!.partida)}
                  {voo.volta.length ? ` · volta em ${dataPorExtenso(voo.volta[0]!.partida)}` : ""}
                  {voo.paradas === 0
                    ? " · voo direto"
                    : ` · ${voo.paradas} escala em ${voo.ida.slice(0, -1).map((t) => t.destino).join(", ")}`}
                </Text>
              </View>
            ) : null}

            {hotel ? (
              <View style={estilos.secao}>
                <Text style={estilos.rotulo}>Hospedagem</Text>
                <Text style={[estilos.texto, { fontFamily: "Helvetica-Bold" }]}>{hotel.nome}</Text>
                <Text style={estilos.apoio}>
                  {hotel.bairro}, {hotel.cidade} · {hotel.noites} noite
                  {hotel.noites > 1 ? "s" : ""} · {hotel.tipoDeQuarto}
                </Text>
              </View>
            ) : null}

            <View style={estilos.secao}>
              <Text style={estilos.rotulo}>
                {snapshot.passageiros.length > 1 ? "Passageiros" : "Passageiro"}
              </Text>
              {snapshot.passageiros.map((p, i) => (
                <View key={i} style={estilos.linhaInfo}>
                  <Text style={estilos.texto}>{p.nome}</Text>
                  {p.documento ? (
                    <Text style={[estilos.apoio, { fontFamily: "Courier" }]}>{p.documento}</Text>
                  ) : null}
                </View>
              ))}
              <Text style={[estilos.apoio, { marginTop: 6 }]}>
                Contato: {snapshot.contato.email}
                {snapshot.contato.telefone ? ` · ${snapshot.contato.telefone}` : ""}
              </Text>
            </View>
          </View>

          <View style={estilos.picote} />

          <View style={estilos.canhoto}>
            <Text style={estilos.rotulo}>Total pago</Text>
            <Text style={estilos.total}>{brl(reserva.total)}</Text>
            <Text style={[estilos.apoio, { marginTop: 10, textAlign: "center" }]}>
              {reserva.viajante.nome}
            </Text>
            <Text style={[estilos.rotulo, { marginTop: 12 }]}>{reserva.localizador}</Text>
          </View>
        </View>

        {/* -------------------------------------------------------- regras */}
        {regras?.nome ? (
          <View style={estilos.regras}>
            <Text style={estilos.tituloRegras}>Regras da tarifa {regras.nome}</Text>
            <Text style={estilos.itemRegra}>
              • {regras.reembolsavel ? "Reembolsável" : "Não reembolsável"}
              {regras.reembolsavel && regras.multaCancelamento > 0
                ? `, com multa de ${brl(regras.multaCancelamento)}`
                : ""}
            </Text>
            <Text style={estilos.itemRegra}>
              • {regras.remarcavel ? "Remarcável" : "Não remarcável"}
              {regras.remarcavel
                ? regras.multaRemarcacao > 0
                  ? `, com multa de ${brl(regras.multaRemarcacao)} mais a diferença de tarifa`
                  : ", sem multa (só a diferença de tarifa)"
                : ""}
            </Text>
            <Text style={estilos.itemRegra}>
              • Alterações até {regras.prazoLimiteHoras} h antes da partida
            </Text>
            <Text style={estilos.itemRegra}>
              • Bagagem: {regras.bagagemMaoKg} kg de mão
              {regras.bagagemDespachada > 0
                ? ` e ${regras.bagagemDespachada} despachada(s) de 23 kg`
                : ", sem despachada inclusa"}
            </Text>
            <Text style={estilos.itemRegra}>
              • Cancelamento em até 24 h da compra, com 7 dias ou mais de antecedência,
              devolve o valor integral
            </Text>
          </View>
        ) : null}

        <Text style={estilos.rodape}>
          Documento de demonstração. Rota Viva é uma marca fictícia criada para prova de
          conceito: nenhuma passagem foi emitida, nenhuma hospedagem foi contratada e
          nenhum pagamento foi processado. Apresentar este voucher não dá direito a
          embarque.
        </Text>
      </Page>
    </Document>
  );
}
