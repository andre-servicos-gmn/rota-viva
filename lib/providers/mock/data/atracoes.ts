import type { Passeio } from "@/lib/providers/types";

/**
 * Atrações por cidade.
 *
 * Os lugares são reais — é o que faz um roteiro parecer um roteiro. Preços,
 * horários, notas e operadores são fictícios. Nenhuma operadora real de turismo
 * é citada.
 */

type Atracao = {
  nome: string;
  categoria: Passeio["categoria"];
  horas: number;
  periodo: Passeio["periodo"];
  descricao: string;
  /** Preço em reais; 0 quando a visita é gratuita. */
  preco: number;
};

export const ATRACOES: Record<string, Atracao[]> = {
  Lisboa: [
    { nome: "Torre de Belém e Mosteiro dos Jerónimos", categoria: "cultura", horas: 3.5, periodo: "manha", preco: 180, descricao: "Os dois monumentos manuelinos, com fila prioritária e guia em português." },
    { nome: "Bairro de Alfama a pé", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 120, descricao: "Ruas estreitas, miradouros e a história do bairro que sobreviveu ao terremoto." },
    { nome: "Noite de fado no Chiado", categoria: "noite", horas: 3, periodo: "noite", preco: 260, descricao: "Jantar com três fadistas em casa pequena, longe do circuito de ônibus." },
    { nome: "Sintra e Cabo da Roca", categoria: "natureza", horas: 8, periodo: "dia-inteiro", preco: 420, descricao: "Palácio da Pena, centro de Sintra e o ponto mais ocidental da Europa." },
    { nome: "Aula de pastéis de nata", categoria: "gastronomia", horas: 2, periodo: "manha", preco: 210, descricao: "Massa folhada do zero, com chef local e degustação." },
    { nome: "Elevador de Santa Justa e Baixa", categoria: "cultura", horas: 1.5, periodo: "tarde", preco: 60, descricao: "Vista da cidade do alto da estrutura de ferro e caminhada pela Baixa Pombalina." },
  ],
  Porto: [
    { nome: "Caves do vinho do Porto", categoria: "gastronomia", horas: 2.5, periodo: "tarde", preco: 190, descricao: "Visita a duas caves em Gaia, com prova de três vinhos." },
    { nome: "Livraria e centro histórico", categoria: "cultura", horas: 3, periodo: "manha", preco: 140, descricao: "Caminhada pela Ribeira, Clérigos e a livraria mais fotografada da cidade." },
    { nome: "Cruzeiro das seis pontes", categoria: "natureza", horas: 1, periodo: "tarde", preco: 95, descricao: "Barco tradicional pelo Douro, passando sob todas as pontes da cidade." },
    { nome: "Douro em um dia", categoria: "natureza", horas: 9, periodo: "dia-inteiro", preco: 480, descricao: "Vinhedos em socalcos, almoço em quinta e volta de trem." },
  ],
  "Rio de Janeiro": [
    { nome: "Cristo Redentor pelo trem do Corcovado", categoria: "cultura", horas: 4, periodo: "manha", preco: 190, descricao: "Subida pela Floresta da Tijuca e mirante no horário de menos fila." },
    { nome: "Pão de Açúcar no fim da tarde", categoria: "natureza", horas: 3, periodo: "tarde", preco: 210, descricao: "Bondinho nos dois trechos, com a cidade acendendo as luzes." },
    { nome: "Escadaria Selarón e Santa Teresa", categoria: "cultura", horas: 3, periodo: "manha", preco: 120, descricao: "Bonde, ateliês e almoço no bairro." },
    { nome: "Trilha do Morro Dois Irmãos", categoria: "aventura", horas: 4, periodo: "manha", preco: 150, descricao: "Trilha de dificuldade média com a melhor vista de Ipanema e Leblon." },
    { nome: "Feijoada com samba na Lapa", categoria: "noite", horas: 4, periodo: "noite", preco: 230, descricao: "Roda de samba em casa tradicional, com jantar incluído." },
    { nome: "Jardim Botânico e Parque Lage", categoria: "familia", horas: 3, periodo: "tarde", preco: 80, descricao: "Aleia das palmeiras imperiais e café no casarão do Parque Lage." },
  ],
  "São Paulo": [
    { nome: "MASP e Avenida Paulista", categoria: "cultura", horas: 3, periodo: "tarde", preco: 90, descricao: "Acervo em cavaletes de cristal e caminhada pela avenida." },
    { nome: "Mercado Municipal e centro velho", categoria: "gastronomia", horas: 3.5, periodo: "manha", preco: 160, descricao: "Sanduíche de mortadela, pastel de bacalhau e a arquitetura do centro." },
    { nome: "Beco do Batman e Vila Madalena", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 110, descricao: "Grafite, galerias e bares de bairro." },
    { nome: "Parque Ibirapuera de bicicleta", categoria: "familia", horas: 2, periodo: "manha", preco: 70, descricao: "Volta pelo parque com parada nos museus." },
    { nome: "Noite na Vila Madalena", categoria: "noite", horas: 4, periodo: "noite", preco: 180, descricao: "Três bares com petiscos, guiado por quem mora no bairro." },
  ],
  "Buenos Aires": [
    { nome: "Recoleta e cemitério histórico", categoria: "cultura", horas: 3, periodo: "manha", preco: 130, descricao: "Mausoléus, arquitetura e a história política do país." },
    { nome: "Show de tango em San Telmo", categoria: "noite", horas: 3.5, periodo: "noite", preco: 340, descricao: "Jantar com espetáculo em casa centenária." },
    { nome: "La Boca e Caminito", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 120, descricao: "Casas coloridas, ateliês e o estádio do bairro por fora." },
    { nome: "Parrilla e mercado de Palermo", categoria: "gastronomia", horas: 3, periodo: "noite", preco: 260, descricao: "Corte argentino, vinhos de Mendoza e sobremesa com doce de leite." },
    { nome: "Delta do Tigre de barco", categoria: "natureza", horas: 7, periodo: "dia-inteiro", preco: 290, descricao: "Trem até Tigre e navegação pelos canais do delta." },
  ],
  Paris: [
    { nome: "Louvre com guia", categoria: "cultura", horas: 3.5, periodo: "manha", preco: 320, descricao: "Percurso pelas obras principais, com entrada em horário reservado." },
    { nome: "Torre Eiffel ao pôr do sol", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 280, descricao: "Segundo andar e topo, com a cidade mudando de cor." },
    { nome: "Montmartre e Sacré-Cœur", categoria: "cultura", horas: 3, periodo: "manha", preco: 150, descricao: "Ateliês, a praça dos pintores e a basílica no ponto mais alto." },
    { nome: "Cruzeiro no Sena com jantar", categoria: "noite", horas: 2.5, periodo: "noite", preco: 420, descricao: "Menu de três pratos enquanto passa pelos monumentos iluminados." },
    { nome: "Versalhes em meio dia", categoria: "cultura", horas: 6, periodo: "dia-inteiro", preco: 390, descricao: "Palácio, Galeria dos Espelhos e jardins." },
    { nome: "Mercado e degustação de queijos", categoria: "gastronomia", horas: 2.5, periodo: "manha", preco: 240, descricao: "Feira de bairro, queijaria e padaria premiada." },
  ],
  Roma: [
    { nome: "Coliseu, Fórum e Palatino", categoria: "cultura", horas: 4, periodo: "manha", preco: 300, descricao: "Ingresso combinado com acesso à arena." },
    { nome: "Vaticano e Capela Sistina", categoria: "cultura", horas: 4, periodo: "manha", preco: 340, descricao: "Museus, Sistina e Basílica de São Pedro, com entrada antecipada." },
    { nome: "Trastevere à noite", categoria: "gastronomia", horas: 3.5, periodo: "noite", preco: 260, descricao: "Cinco paradas de comida no bairro mais boêmio da cidade." },
    { nome: "Fontana di Trevi e Panteão a pé", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 110, descricao: "Centro histórico e as praças barrocas." },
    { nome: "Aula de massa fresca", categoria: "gastronomia", horas: 3, periodo: "tarde", preco: 280, descricao: "Cacio e pepe e carbonara com chef romano." },
  ],
  Madri: [
    { nome: "Museu do Prado", categoria: "cultura", horas: 3, periodo: "manha", preco: 180, descricao: "Velázquez, Goya e El Greco com guia de arte." },
    { nome: "Tapas em La Latina", categoria: "gastronomia", horas: 3, periodo: "noite", preco: 220, descricao: "Seis tabernas, uma tapa e uma bebida em cada." },
    { nome: "Palácio Real e Ópera", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 160, descricao: "Salões oficiais e a mudança da guarda." },
    { nome: "Toledo em um dia", categoria: "cultura", horas: 8, periodo: "dia-inteiro", preco: 350, descricao: "Cidade das três culturas, com catedral e vista do mirante." },
  ],
  Barcelona: [
    { nome: "Sagrada Família", categoria: "cultura", horas: 2.5, periodo: "manha", preco: 290, descricao: "Interior, vitrais e a história inacabada da basílica." },
    { nome: "Park Güell", categoria: "cultura", horas: 2, periodo: "tarde", preco: 150, descricao: "Zona monumental com a vista da cidade e do mar." },
    { nome: "Bairro Gótico e Born a pé", categoria: "cultura", horas: 3, periodo: "manha", preco: 130, descricao: "Ruas medievais, catedral e mercado do Born." },
    { nome: "Paella e vinho na Barceloneta", categoria: "gastronomia", horas: 3, periodo: "noite", preco: 250, descricao: "Aula rápida e jantar de frente para a praia." },
  ],
  Londres: [
    { nome: "Torre de Londres e joias da coroa", categoria: "cultura", horas: 3.5, periodo: "manha", preco: 340, descricao: "Fortaleza medieval com guia da própria guarda." },
    { nome: "British Museum", categoria: "cultura", horas: 3, periodo: "tarde", preco: 160, descricao: "Percurso temático pelo acervo, entrada gratuita com guia pago." },
    { nome: "London Eye e South Bank", categoria: "familia", horas: 2, periodo: "tarde", preco: 260, descricao: "Volta na roda-gigante e caminhada pela margem do Tâmisa." },
    { nome: "Pubs históricos de Westminster", categoria: "noite", horas: 3, periodo: "noite", preco: 210, descricao: "Quatro pubs com história política e uma pint em cada." },
  ],
  "Nova York": [
    { nome: "Estátua da Liberdade e Ellis Island", categoria: "cultura", horas: 5, periodo: "manha", preco: 320, descricao: "Balsa, pedestal e o museu da imigração." },
    { nome: "Central Park de bicicleta", categoria: "familia", horas: 2.5, periodo: "tarde", preco: 190, descricao: "Volta guiada pelos pontos do parque." },
    { nome: "Top of the Rock ao entardecer", categoria: "cultura", horas: 2, periodo: "tarde", preco: 280, descricao: "Observatório com vista para o Empire State e o Central Park." },
    { nome: "Jazz no Village", categoria: "noite", horas: 3, periodo: "noite", preco: 340, descricao: "Duas casas históricas, com couvert e primeira bebida." },
    { nome: "Brooklyn e a ponte a pé", categoria: "cultura", horas: 3.5, periodo: "manha", preco: 170, descricao: "Travessia da ponte, Dumbo e o mercado do bairro." },
  ],
  Miami: [
    { nome: "Everglades de aerobarco", categoria: "natureza", horas: 5, periodo: "manha", preco: 380, descricao: "Passeio pelo pântano com jacarés e guia naturalista." },
    { nome: "Art déco em South Beach", categoria: "cultura", horas: 2, periodo: "tarde", preco: 140, descricao: "Fachadas dos anos 30 e a história do bairro." },
    { nome: "Wynwood Walls", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 130, descricao: "Grafite em escala industrial e galerias do bairro." },
    { nome: "Key Biscayne de caiaque", categoria: "aventura", horas: 3, periodo: "manha", preco: 260, descricao: "Remada em águas calmas com parada em banco de areia." },
  ],
  Santiago: [
    { nome: "Cerro San Cristóbal", categoria: "natureza", horas: 3, periodo: "manha", preco: 120, descricao: "Funicular e vista da cordilheira nos dias limpos." },
    { nome: "Vinícolas do Vale do Maipo", categoria: "gastronomia", horas: 6, periodo: "dia-inteiro", preco: 390, descricao: "Duas vinícolas, prova de carménère e almoço." },
    { nome: "Valparaíso e Viña del Mar", categoria: "cultura", horas: 9, periodo: "dia-inteiro", preco: 420, descricao: "Cerros coloridos, ascensores e a costa." },
    { nome: "Mercado Central e centro", categoria: "gastronomia", horas: 3, periodo: "manha", preco: 150, descricao: "Frutos do mar, La Moneda e a praça de armas." },
  ],
  "Cidade do México": [
    { nome: "Teotihuacán", categoria: "cultura", horas: 7, periodo: "dia-inteiro", preco: 380, descricao: "Pirâmides do Sol e da Lua com guia de arqueologia." },
    { nome: "Centro histórico e Zócalo", categoria: "cultura", horas: 3.5, periodo: "manha", preco: 150, descricao: "Catedral, Templo Mayor e os murais do Palácio Nacional." },
    { nome: "Coyoacán e Casa Azul", categoria: "cultura", horas: 3, periodo: "tarde", preco: 220, descricao: "Bairro de Frida Kahlo, com entrada no museu." },
    { nome: "Xochimilco de trajinera", categoria: "familia", horas: 4, periodo: "tarde", preco: 240, descricao: "Canais, mariachi e comida a bordo." },
  ],
  "Cancún": [
    { nome: "Chichén Itzá", categoria: "cultura", horas: 10, periodo: "dia-inteiro", preco: 460, descricao: "Cidade maia, cenote e almoço em Valladolid." },
    { nome: "Isla Mujeres de catamarã", categoria: "natureza", horas: 7, periodo: "dia-inteiro", preco: 420, descricao: "Snorkel no recife e tarde na praia norte." },
    { nome: "Cenotes da Riviera", categoria: "aventura", horas: 6, periodo: "manha", preco: 340, descricao: "Três cenotes com mergulho livre e tirolesa." },
    { nome: "Tulum e praia", categoria: "cultura", horas: 8, periodo: "dia-inteiro", preco: 390, descricao: "Ruínas à beira-mar e tempo livre na praia." },
  ],
  Salvador: [
    { nome: "Pelourinho a pé", categoria: "cultura", horas: 3, periodo: "manha", preco: 110, descricao: "Igrejas barrocas, ladeiras e a história do centro histórico." },
    { nome: "Ilha de Itaparica de escuna", categoria: "natureza", horas: 8, periodo: "dia-inteiro", preco: 260, descricao: "Baía de Todos-os-Santos com parada para banho." },
    { nome: "Aula de percussão", categoria: "cultura", horas: 2, periodo: "tarde", preco: 140, descricao: "Ritmos afro-baianos com percussionistas do bairro." },
    { nome: "Jantar de moqueca no Rio Vermelho", categoria: "gastronomia", horas: 2.5, periodo: "noite", preco: 190, descricao: "Restaurante de bairro com moqueca de peixe e acarajé." },
  ],
  "Foz do Iguaçu": [
    { nome: "Cataratas lado brasileiro", categoria: "natureza", horas: 4, periodo: "manha", preco: 180, descricao: "Trilha panorâmica até a Garganta do Diabo." },
    { nome: "Cataratas lado argentino", categoria: "natureza", horas: 8, periodo: "dia-inteiro", preco: 320, descricao: "Passarelas superiores e inferiores, com trem ecológico." },
    { nome: "Macuco Safari", categoria: "aventura", horas: 3, periodo: "tarde", preco: 390, descricao: "Bote inflável até a base das quedas — você sai molhado." },
    { nome: "Parque das Aves", categoria: "familia", horas: 2.5, periodo: "tarde", preco: 130, descricao: "Viveiros de imersão com araras e tucanos." },
  ],
  "Tóquio": [
    { nome: "Templo Senso-ji e Asakusa", categoria: "cultura", horas: 3, periodo: "manha", preco: 190, descricao: "Templo mais antigo da cidade e a rua de comércio tradicional." },
    { nome: "Mercado de Toyosu e sushi", categoria: "gastronomia", horas: 3.5, periodo: "manha", preco: 420, descricao: "Leilão de atum e café da manhã de sushi." },
    { nome: "Shibuya e Shinjuku à noite", categoria: "noite", horas: 3, periodo: "noite", preco: 240, descricao: "Cruzamento, becos de izakaya e karaokê." },
    { nome: "Monte Fuji e Hakone", categoria: "natureza", horas: 10, periodo: "dia-inteiro", preco: 620, descricao: "Quinta estação, lago Ashi e teleférico." },
  ],
  Dubai: [
    { nome: "Burj Khalifa", categoria: "cultura", horas: 2, periodo: "tarde", preco: 380, descricao: "Observatório no 124º andar com hora marcada." },
    { nome: "Safári no deserto", categoria: "aventura", horas: 6, periodo: "tarde", preco: 450, descricao: "Dunas de 4x4, jantar no acampamento e show." },
    { nome: "Dubai antiga e souks", categoria: "cultura", horas: 3, periodo: "manha", preco: 210, descricao: "Bairro histórico, travessia de abra e mercados de ouro e especiarias." },
  ],
};

/** Cidades sem catálogo próprio recebem um roteiro genérico honesto. */
export const ATRACOES_GENERICAS: Atracao[] = [
  { nome: "Centro histórico a pé", categoria: "cultura", horas: 3, periodo: "manha", preco: 120, descricao: "Caminhada guiada pelos principais pontos do centro." },
  { nome: "Mercado municipal e degustação", categoria: "gastronomia", horas: 2.5, periodo: "manha", preco: 150, descricao: "Produtos locais com prova guiada." },
  { nome: "Mirante da cidade", categoria: "natureza", horas: 2, periodo: "tarde", preco: 90, descricao: "Melhor ponto de vista, com transporte incluído." },
  { nome: "Museu principal", categoria: "cultura", horas: 2.5, periodo: "tarde", preco: 110, descricao: "Acervo permanente com guia local." },
  { nome: "Jantar típico com música ao vivo", categoria: "noite", horas: 3, periodo: "noite", preco: 200, descricao: "Casa tradicional, com prato regional e apresentação." },
];

export const OPERADORES = [
  "Rota Viva Experiências",
  "Bússola Tours",
  "Passo Local",
  "Meridiano Passeios",
  "Cais Turismo",
];
