# Rota Viva — Plano da Fase 0

POC de agência de viagens com agente conversacional. Marca fictícia, dados mockados,
arquitetura preparada para troca de mock por integração real.

---

## 1. Decisões de arquitetura

| Assunto | Decisão | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TS estrito | pedido |
| Modelo | xAI Grok via `@ai-sdk/openai-compatible` (`XAI_BASE_URL`) | troca de provedor em 1 linha em `lib/ai/provider.ts` |
| Chat | Vercel AI SDK 5 (`streamText` + `tool()` no server, `useChat` no client) | streaming e tool-calling com estados de tool nativos |
| Banco | SQLite + Prisma (`prisma/dev.db`) | zero serviço externo |
| Validação | Zod em toda tool e todo body de rota | pedido |
| PDF | `@react-pdf/renderer` em Route Handler (`/api/bookings/[localizador]/voucher`) | voucher real, não print-screen. Fallback: CSS `@media print` se pesar no build |
| Rate limit | token bucket em memória por IP (`lib/rate-limit.ts`) | POC single-instance; em produção seria Redis/Upstash |

**Regra dura:** nenhuma tool acessa mock diretamente. Toda tool chama uma interface de
`lib/providers/*`. A implementação mock fica em `lib/providers/mock/`. Trocar por GDS real =
escrever `lib/providers/amadeus/flights.ts` e mudar a fábrica em `lib/providers/index.ts`.

### Enums no SQLite

Prisma **não suporta `enum` no provider sqlite**. Todos os campos de status são `String`,
com union types em `lib/types.ts` e validação por Zod na borda.

---

## 2. Estrutura de pastas

```
app/
  (app)/                      # shell com sidebar + painel de contexto
    chat/[[...id]]/page.tsx   # chat (rota raiz do produto)
    reservas/page.tsx
    reservas/[localizador]/page.tsx
    comparador/page.tsx
    roteiro/[id]/page.tsx
    perfil/page.tsx
  (desk)/atendente/page.tsx   # painel do atendente (shell próprio)
  api/
    chat/route.ts             # POST — streaming + tools
    conversations/route.ts    # GET lista | POST cria
    conversations/[id]/route.ts
    bookings/route.ts
    bookings/[localizador]/route.ts
    bookings/[localizador]/voucher/route.ts   # PDF
    itineraries/[id]/route.ts
    favorites/route.ts
    profile/route.ts
    alerts/route.ts
    alerts/run/route.ts       # job manual do alerta de preço
    desk/route.ts             # fila de escalados
    desk/[id]/claim/route.ts
  layout.tsx  globals.css
components/
  chat/          # Composer, MessageList, ToolRunningBadge, MessagePart
  results/       # FlightCard, HotelCard, PackageCard, ItineraryTimeline,
                 # VoucherCard, PolicyCard, DocsCard, TicketCard, InsuranceCard,
                 # TransferCard, TourCard, InstallmentTable, FxCard, AlertCard
  shell/         # Sidebar, Topbar, ContextPanel
  ui/            # shadcn
lib/
  ai/            provider.ts  system-prompt.ts  tools/index.ts  tools/*.ts
  providers/     types.ts  index.ts  mock/{flights,hotels,tours,transfers,
                 insurance,fx,docs,destinations}.ts  mock/data/*.ts
  db/            client.ts  repositories/*.ts
  knowledge/     faq.ts        # leitura + busca em content/faq/*.md
  rate-limit.ts  ids.ts  money.ts  types.ts  errors.ts
content/faq/*.md
prisma/schema.prisma  prisma/seed.ts
docs/  DEMO.md (fase 5)
```

---

## 3. Contratos das tools (19)

Padrão de retorno: **todas** devolvem `{ ok: true, kind, data }` ou
`{ ok: false, erro, sugestao }`. Nenhuma tool lança — erro vira payload que a UI renderiza
com botão "Tentar de novo". O campo `kind` é o que roteia para o componente rico.

### Núcleo

| # | Tool | Input (Zod) | Output |
|---|---|---|---|
| 1 | `buscarVoos` | origem, destino (IATA ou cidade), dataIda, dataVolta?, adultos, criancas?, classe, flexivel(±3d), maxParadas?, ordenar | `OpcaoVoo[]` — id, cia, trechos[], preço, bagagem, escalas, duração, fareId |
| 2 | `buscarHoteis` | cidade, checkIn, checkOut, hospedes, quartos, precoMin/Max?, estrelas?, filtros[] | `OpcaoHotel[]` — id, nome, bairro, estrelas, nota, diária, total, comodidades, política |
| 3 | `montarPacote` | vooId, hotelId, passageiros | `Pacote` — itens, total, totalSeparado, economia, % |
| 4 | `montarRoteiro` | destino, dias, ritmo(leve/normal/intenso), interesses[], comCriancas? | `Roteiro` — dias[] → blocos com atração, horário, deslocamento, refeição |

### Reserva e pós-venda

| # | Tool | Notas |
|---|---|---|
| 5 | `criarReserva` | itens + passageiros + contato → grava, gera localizador `RV-XXXXXX`, devolve voucher. Exige `confirmado: true` |
| 6 | `consultarReserva` | por localizador **ou** e-mail |
| 7 | `alterarReserva` | `simular: true` (default) devolve multa/diferença; `confirmado: true` executa |
| 8 | `cancelarReserva` | idem: simula → confirma. Aplica regra da tarifa (não reembolsável, prazo, multa) |
| 9 | `politicaTarifaria` | fareId ou localizador → explicação em linguagem simples + tabela de regras |
| 10 | `consultarDocumentacao` | nacionalidade, destino, duração → passaporte/visto/vacina/validade + aviso de que é orientação, não garantia consular |
| 11 | `faq` | busca nos markdowns de `content/faq/` (ranking simples por termo) → trechos + fonte |
| 12 | `abrirChamado` | assunto, categoria, prioridade, localizador? → nº do ticket |
| 13 | `escalarParaHumano` | motivo, resumo → marca conversa `ESCALATED`, encerra o turno do agente |

### Extras

`cotarSeguroViagem`, `buscarTransfer` (transfer + aluguel de carro), `buscarPasseios`,
`simularParcelamento`, `converterMoeda`, `custoMedioDestino`, `alertaDePreco`
(criar/listar/remover), `perfilViajante` (ler/gravar preferências — lido a cada turno e
injetado no system prompt).

### Confirmação de ações com consequência

Tools 5, 7 e 8 seguem o mesmo protocolo: a **primeira chamada simula** e devolve
`requerConfirmacao: true` + resumo; a UI renderiza um card com "Confirmar reserva" /
"Confirmar cancelamento"; só a segunda chamada com `confirmado: true` grava. O system prompt
proíbe passar `confirmado: true` sem um "sim" explícito do usuário na mensagem anterior.

### Volume de mocks (mínimo 30 por domínio)

Voos: 40+ rotas × variações de data. Hotéis: 36 (6 cidades × 6). Passeios: 36. Transfers: 30.
Seguros: 6 planos × faixas. Destinos: 12 com custo médio. Documentação: 20 países. FAQ: 12
artigos. Geração **determinística** (seed derivada de origem+destino+data), nunca
`Math.random()` — a mesma busca dá o mesmo resultado, o que é essencial para a demo e para o
alerta de preço funcionar.

---

## 4. Modelo do banco (Prisma / SQLite)

```
Conversation   id, titulo, status(ACTIVE|ESCALATED|HUMAN|CLOSED), atendente?, motivoEscalacao?, timestamps
Message        id, conversationId, role, parts(Json string), createdAt
Traveler       id, email(unique), nome, telefone?, prefs(Json), documentos(Json)
Booking        id, localizador(unique), tipo(FLIGHT|HOTEL|PACKAGE), status(CONFIRMED|CHANGED|CANCELLED),
               travelerId, snapshot(Json), total, moeda, fareId, fareRules(Json)
BookingEvent   id, bookingId, tipo(CREATED|CHANGED|CANCELLED), multa, diferenca, detalhes(Json)
SupportTicket  id, numero(unique), conversationId?, bookingId?, categoria, prioridade, status, assunto, corpo
PriceAlert     id, travelerId, origem, destino, dataAlvo, precoBase, precoAtual, alvo?, status, disparadoEm?
Itinerary      id, conversationId?, destino, dias(Json)
Favorite       id, conversationId, tipo(FLIGHT|HOTEL), refId, snapshot(Json)
```

`Favorite` alimenta o comparador; `Itinerary.dias` guarda o roteiro editável.

---

## 5. Plano de design

### Conceito

> **Uma prancheta de despacho de voo:** a esquerda é o plano, o centro é a mesa onde os
> bilhetes chegam e se empilham, a direita é o canhoto do que já foi decidido.

Vocabulário visual: sinalização de aeródromo e cartografia aeronáutica — códigos IATA,
horários em 24h, marcações de pista, carimbos, coordenadas. Nada de ilustração de avião,
nada de foto de praia, nada de gradiente.

### Paleta (6)

| Nome | Hex | Uso |
|---|---|---|
| `noite-de-voo` | `#0B1524` | tinta principal, fundo do modo escuro |
| `azul-taxiway` | `#1B3A6B` | primário, cabeçalhos, links |
| `nevoa` | `#EDF1F5` | fundo claro |
| `amarelo-pista` | `#F2B705` | ação principal, destaque, marcação |
| `verde-eixo` | `#2E7D5B` | confirmado, disponível |
| `vermelho-lacre` | `#B02E3A` | erro, cancelamento, carimbo |

Contraste: `noite-de-voo` sobre `nevoa` = 15.3:1. `amarelo-pista` sempre com texto
`noite-de-voo` por cima, nunca branco.

### Tipografia

- **Display — Archivo (eixo Expanded, 600/700):** largura de placa de sinalização. Só em
  h1/h2, preços grandes e códigos de rota. Escala 48 / 32 / 24.
- **Texto — IBM Plex Sans (400/500/600):** sotaque técnico sem ser frio. 16 / 14 / 13.
- **Funcional — IBM Plex Mono (400/500):** códigos IATA, localizador, horários e valores em
  tabela, com `font-variant-numeric: tabular-nums`. É parte da identidade, não decoração.

### Elemento assinatura: o canhoto perfurado

Todo resultado que representa um compromisso — opção de voo, hotel escolhido, voucher, linha
do comparador — é um **bilhete**: corpo à esquerda, canhoto estreito à direita, separados por
uma perfuração real (círculos recortados via `radial-gradient` + filete tracejado). No
canhoto: código IATA ou localizador impresso na vertical em mono, e o carimbo de estado
(`EMITIDO`, `ALTERADO`, `CANCELADO`) em `vermelho-lacre` levemente rotacionado.

O mesmo componente aparece no chat, na lista de reservas, no comparador e **no PDF** — é o
que dá continuidade visual ao produto inteiro. A ousadia mora aqui e em nenhum outro lugar:
o resto do layout é sóbrio e ortogonal.

### Piso de qualidade

Responsivo até 375px (painel de contexto vira sheet, sidebar vira barra inferior);
`:focus-visible` com anel `amarelo-pista` de 2px em tudo que é focável; toda animação dentro
de `@media (prefers-reduced-motion: reduce)` reduzida a fade; estados vazios e de erro dizem
a próxima ação ("Nenhuma reserva ainda — peça uma busca de voos no chat").

### Microcópia

Voz ativa. O botão nomeia o efeito ("Confirmar reserva", "Cancelar e pagar multa de R$ 180",
"Salvar preferências") e esse mesmo nome reaparece no toast ("Reserva confirmada —
RV-8H2K1P").

---

## 6. Sequência de execução

- **Fase 1** — scaffold, Tailwind + shadcn com os tokens acima, Prisma, shell (sidebar +
  painel de contexto), chat com streaming sem tools.
- **Fase 2** — `lib/providers` + mocks + tools 1–4 + cards de resultado.
- **Fase 3** — tools 5–13 (reserva, pós-venda, suporte) + painel do atendente + PDF.
- **Fase 4** — extras 14–19 + comparador + roteiro editável + perfil.
- **Fase 5** — polimento, acessibilidade, README, seed de demo, DEMO.md.

Ao final de cada fase: `npm run build`, correção do que quebrar, commit descritivo e
relatório do que entrou.
