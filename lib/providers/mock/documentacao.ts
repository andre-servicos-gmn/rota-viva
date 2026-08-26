import type { ExigenciaDeEntrada, ProvedorDeDocumentacao } from "@/lib/providers/types";
import { resolverAeroporto } from "./data/lugares";

/**
 * Exigências de entrada por país, para passaporte brasileiro.
 *
 * ATENÇÃO: conteúdo de demonstração. Regras consulares mudam sem aviso e variam
 * por nacionalidade, motivo da viagem e histórico do viajante. Em produção isto
 * viria de uma base licenciada (IATA Timatic ou equivalente), atualizada
 * diariamente. Toda resposta ao usuário carrega o aviso de que é orientação, e
 * não garantia de embarque — quem decide é o consulado e a companhia aérea.
 */

type Regra = Omit<ExigenciaDeEntrada, "nacionalidade">;

const REGRAS: Record<string, Regra> = {
  BR: {
    pais: "Brasil",
    paisCodigo: "BR",
    passaporte: { obrigatorio: false, validadeMinimaMeses: 0 },
    visto: { necessario: false },
    vacinas: [],
    comprovantes: ["Documento oficial com foto para o embarque doméstico"],
    observacoes: [
      "Para voos domésticos, RG ou CNH dentro da validade bastam.",
      "Menores de 16 anos desacompanhados precisam de autorização judicial ou dos pais.",
    ],
  },
  PT: {
    pais: "Portugal",
    paisCodigo: "PT",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 3 },
    visto: {
      necessario: false,
      observacao:
        "Turismo por até 90 dias dentro do Espaço Schengen dispensa visto. A autorização eletrônica ETIAS está prevista para entrar em vigor — confirme antes de embarcar.",
    },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: [
      "Passagem de volta ou continuação da viagem",
      "Comprovante de hospedagem",
      "Seguro-viagem com cobertura médica mínima de € 30 mil",
      "Meios de subsistência (cerca de € 40 por dia)",
    ],
    observacoes: [
      "A validade mínima de 3 meses conta a partir da data prevista de saída do Espaço Schengen.",
      "O total de 90 dias vale para todo o Schengen em janelas de 180 dias, não só para Portugal.",
    ],
  },
  ES: {
    pais: "Espanha",
    paisCodigo: "ES",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 3 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias no Espaço Schengen." },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passagem de volta", "Comprovante de hospedagem", "Seguro-viagem com cobertura mínima de € 30 mil"],
    observacoes: ["A regra dos 90 dias em 180 vale para o Schengen inteiro."],
  },
  FR: {
    pais: "França",
    paisCodigo: "FR",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 3 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias no Espaço Schengen." },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passagem de volta", "Comprovante de hospedagem", "Seguro-viagem com cobertura mínima de € 30 mil"],
    observacoes: ["Autoridades de fronteira podem pedir comprovação de recursos financeiros."],
  },
  IT: {
    pais: "Itália",
    paisCodigo: "IT",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 3 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias no Espaço Schengen." },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passagem de volta", "Comprovante de hospedagem", "Seguro-viagem com cobertura mínima de € 30 mil"],
    observacoes: [],
  },
  NL: {
    pais: "Países Baixos",
    paisCodigo: "NL",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 3 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias no Espaço Schengen." },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passagem de volta", "Comprovante de hospedagem", "Seguro-viagem com cobertura mínima de € 30 mil"],
    observacoes: [],
  },
  GB: {
    pais: "Reino Unido",
    paisCodigo: "GB",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: {
      necessario: true,
      tipo: "Autorização eletrônica (ETA)",
      observacao:
        "Brasileiros não precisam de visto para turismo de até 6 meses, mas passaram a precisar da autorização eletrônica ETA, solicitada on-line antes do embarque.",
      prazoEstimadoDias: 3,
    },
    vacinas: [],
    permanenciaMaximaDias: 180,
    comprovantes: ["Passagem de volta", "Comprovante de hospedagem", "Comprovação de recursos"],
    observacoes: ["O Reino Unido não faz parte do Espaço Schengen: os 90 dias europeus não valem aqui."],
  },
  US: {
    pais: "Estados Unidos",
    paisCodigo: "US",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: {
      necessario: true,
      tipo: "B1/B2 (turismo e negócios)",
      observacao:
        "Exige entrevista presencial no consulado. A fila costuma ser longa — planeje com meses de antecedência.",
      prazoEstimadoDias: 120,
    },
    vacinas: [],
    comprovantes: ["Visto válido no passaporte", "Endereço de hospedagem", "Passagem de volta"],
    observacoes: [
      "O oficial de imigração decide o tempo de permanência na chegada, não o visto.",
      "Brasil não participa do programa de isenção de visto (Visa Waiver).",
    ],
  },
  MX: {
    pais: "México",
    paisCodigo: "MX",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: {
      necessario: false,
      observacao: "Turismo por até 180 dias sem visto, com preenchimento do formulário migratório.",
    },
    vacinas: [],
    permanenciaMaximaDias: 180,
    comprovantes: ["Passagem de volta", "Comprovante de hospedagem", "Formulário migratório eletrônico"],
    observacoes: ["A imigração mexicana costuma pedir comprovação de hospedagem e de recursos."],
  },
  AR: {
    pais: "Argentina",
    paisCodigo: "AR",
    passaporte: { obrigatorio: false, validadeMinimaMeses: 0 },
    visto: { necessario: false },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["RG em bom estado, emitido há menos de 10 anos, ou passaporte"],
    observacoes: [
      "Países do Mercosul aceitam a carteira de identidade brasileira no lugar do passaporte.",
      "RG danificado ou muito antigo costuma ser recusado na fronteira.",
    ],
  },
  CL: {
    pais: "Chile",
    paisCodigo: "CL",
    passaporte: { obrigatorio: false, validadeMinimaMeses: 0 },
    visto: { necessario: false },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["RG em bom estado ou passaporte"],
    observacoes: ["Não se pode entrar com alimentos frescos, sementes ou produtos de origem animal."],
  },
  UY: {
    pais: "Uruguai",
    paisCodigo: "UY",
    passaporte: { obrigatorio: false, validadeMinimaMeses: 0 },
    visto: { necessario: false },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["RG em bom estado ou passaporte"],
    observacoes: [],
  },
  PE: {
    pais: "Peru",
    paisCodigo: "PE",
    passaporte: { obrigatorio: false, validadeMinimaMeses: 0 },
    visto: { necessario: false },
    vacinas: [
      { nome: "Febre amarela", obrigatoria: false, observacao: "Recomendada para quem vai à Amazônia peruana ou a Machu Picchu por rotas de selva." },
    ],
    permanenciaMaximaDias: 183,
    comprovantes: ["RG em bom estado ou passaporte"],
    observacoes: [],
  },
  CO: {
    pais: "Colômbia",
    paisCodigo: "CO",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: { necessario: false },
    vacinas: [
      { nome: "Febre amarela", obrigatoria: true, observacao: "Exigida para entrada em algumas regiões; o certificado precisa ter mais de 10 dias." },
    ],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passaporte", "Passagem de volta", "Certificado internacional de vacinação"],
    observacoes: [],
  },
  ZA: {
    pais: "África do Sul",
    paisCodigo: "ZA",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias sem visto." },
    vacinas: [
      { nome: "Febre amarela", obrigatoria: true, observacao: "Exigida de quem vem do Brasil ou faz conexão em país de risco." },
    ],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passaporte com duas páginas em branco", "Certificado internacional de febre amarela", "Passagem de volta"],
    observacoes: [
      "Menores de idade precisam de certidão de nascimento traduzida e autorização quando viajam com um só responsável.",
    ],
  },
  AE: {
    pais: "Emirados Árabes Unidos",
    paisCodigo: "AE",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias sem visto, com carimbo na chegada." },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passaporte", "Passagem de volta", "Comprovante de hospedagem"],
    observacoes: ["Normas locais de conduta e vestuário são levadas a sério; leia sobre elas antes de viajar."],
  },
  JP: {
    pais: "Japão",
    paisCodigo: "JP",
    passaporte: { obrigatorio: true, validadeMinimaMeses: 6 },
    visto: { necessario: false, observacao: "Turismo por até 90 dias sem visto para brasileiros." },
    vacinas: [],
    permanenciaMaximaDias: 90,
    comprovantes: ["Passaporte", "Passagem de volta", "Roteiro e hospedagem"],
    observacoes: ["Cartão de desembarque e declaração de alfândega podem ser preenchidos on-line antes do voo."],
  },
};

export const provedorDeDocumentacaoMock: ProvedorDeDocumentacao = {
  async consultar({ destino, nacionalidade = "brasileira" }) {
    const aeroporto = resolverAeroporto(destino);
    const codigo = aeroporto?.paisCodigo ?? destino.toUpperCase().slice(0, 2);
    const regra = REGRAS[codigo];
    if (!regra) return null;

    return { ...regra, nacionalidade };
  },
};

export function paisesComRegra() {
  return Object.values(REGRAS).map((r) => r.pais);
}
