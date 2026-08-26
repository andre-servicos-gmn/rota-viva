# Rota Viva

Prova de conceito de uma agência de viagens digital com agente conversacional.
O usuário conversa, o agente busca voos e hotéis, monta roteiros, emite
reservas, aplica regras de tarifa no pós-venda e escala para humano quando não
tem alçada.

**Rota Viva é uma marca fictícia.** Voos, hotéis, companhias, preços, políticas
e passageiros são inventados para demonstração. Não há integração com GDS,
nenhuma cobrança acontece e nenhum documento real é usado.

---

## Como rodar

```bash
npm install
cp .env.example .env.local     # variáveis do modelo
cp .env.example .env           # o CLI do Prisma lê o .env
npx prisma db push             # cria prisma/dev.db
npm run db:seed                # popula reservas, roteiro, alertas e a fila do atendente
npm run dev                    # http://localhost:3000
```

O app funciona **sem chave de IA**. Sem `XAI_API_KEY`, ele entra em modo
demonstração: um interpretador de regras lê o pedido e chama as mesmas
ferramentas que o modelo chamaria. Os cards, as buscas e as reservas são reais —
só o raciocínio é substituído. Ver [limitações](#limitações-conhecidas).

## Variáveis

| Variável | Obrigatória | Para quê |
|---|---|---|
| `XAI_API_KEY` | não | Chave da xAI. Sem ela, modo demonstração. |
| `XAI_BASE_URL` | não | Endpoint compatível com OpenAI. Padrão: `https://api.x.ai/v1`. |
| `XAI_MODEL` | não | Modelo. Padrão: `grok-4-fast`. |
| `DATABASE_URL` | sim | SQLite local. Padrão: `file:./dev.db`. |

A chave nunca chega ao navegador: o client fala com `app/api/chat/route.ts`, e
só essa rota fala com o provedor. `.env` e `.env.local` estão no `.gitignore`.

---

## O que o agente faz

19 ferramentas, todas com schema Zod e retorno tipado.

| # | Ferramenta | O que faz |
|---|---|---|
| 1 | `buscarVoos` | Rota, datas, passageiros, cabine, escalas; calendário de preços de ±3 dias |
| 2 | `buscarHoteis` | Cidade, período, hóspedes, faixa de preço, categoria e 9 filtros |
| 3 | `montarPacote` | Junta voo e hotel, calcula a economia contra comprar separado |
| 4 | `montarRoteiro` | Itinerário dia a dia com atrações, refeições e deslocamento |
| 5 | `criarReserva` | Emite, gera localizador e voucher |
| 6 | `consultarReserva` | Por localizador ou e-mail |
| 7 | `alterarReserva` | Calcula multa e diferença de tarifa antes de executar |
| 8 | `cancelarReserva` | Aplica a regra da tarifa e mostra o reembolso |
| 9 | `politicaTarifaria` | Traduz as regras da tarifa para linguagem comum |
| 10 | `consultarDocumentacao` | Passaporte, visto, vacina e comprovantes de 18 países |
| 11 | `faq` | Busca nos 12 artigos de `content/faq/` |
| 12 | `abrirChamado` | Ticket com categoria, prioridade e prazo |
| 13 | `escalarParaHumano` | Marca a conversa e encerra o turno do agente |
| 14 | `cotarSeguroViagem` | Três planos, com aviso de cobertura mínima exigida |
| 15 | `buscarTransfer` | Transfer aeroporto–hotel e aluguel de carro |
| 16 | `buscarPasseios` | Ingressos e tours por categoria |
| 17 | `simularParcelamento` | Até 3x sem juros, 4–12x pela tabela Price |
| 18 | `converterMoeda` / `custoMedioDestino` | Câmbio e custo do dia a dia no destino |
| 19 | `alertaDePreco` / `perfilViajante` | Alertas de rota e preferências persistentes |

### Confirmação antes de agir

`criarReserva`, `alterarReserva` e `cancelarReserva` funcionam em duas etapas: a
primeira chamada **simula** e devolve o resumo com multa, diferença e reembolso;
só a segunda, com `confirmado: true`, grava. A regra vive no schema, não apenas
no prompt — o modelo não consegue emitir uma reserva por ter lido mal a
conversa. O botão diz o efeito exato ("Cancelar e pagar multa de R$ 380").

---

## Arquitetura

```
app/
  (app)/            chat, reservas, comparador, roteiro, perfil, atendente
  api/              chat (streaming + tools), favoritos, perfil, alertas,
                    roteiros, atendente, voucher em PDF
components/
  chat/             composer, mensagens, indicador de ferramenta em execução
  results/          um componente por tipo de resultado (o bilhete e os demais)
  comparador/ roteiro/ perfil/ atendente/ shell/ ui/
lib/
  ai/               provider, system prompt versionado, 19 tools, modo demo
  providers/        contratos do domínio + implementação mock
  repos/            conversas e reservas (regras de multa vivem aqui)
  knowledge/        busca no FAQ
  pdf/              voucher
content/faq/        12 artigos em markdown
prisma/             schema e seed
```

**A camada de fornecedores é a fronteira do sistema.** Nenhuma tool, rota ou
componente sabe de onde vêm os dados: todos falam com as interfaces de
`lib/providers/types.ts`. Trocar mock por integração real é escrever a
implementação e mudar uma linha na fábrica de `lib/providers/index.ts`.

### O que é mock e o que seria real

| Hoje (mock determinístico) | Em produção |
|---|---|
| `lib/providers/mock/voos.ts` | Amadeus, Sabre ou consolidador |
| `lib/providers/mock/hoteis.ts` | Booking, Expedia Partner, Hotelbeds |
| `lib/providers/mock/documentacao.ts` | Base licenciada (IATA Timatic) |
| `lib/providers/mock/extras.ts` (câmbio) | Provedor de câmbio com spread |
| Emissão que grava no SQLite | Emissão no GDS + gateway de pagamento |
| Rate limit em memória | Redis / Upstash |
| Cookie de viajante | Autenticação de verdade |
| Botão "Verificar agora" | Job agendado + notificação |

Os mocks são **determinísticos** por construção (FNV-1a + mulberry32, semente
derivada dos parâmetros da busca). A mesma busca devolve sempre o mesmo
resultado — sem isso, o preço mudaria a cada tecla durante uma demonstração e o
alerta de preço não teria base de comparação.

Distâncias são reais: 35 aeroportos com coordenadas, haversine define duração e
preço. Antecedência, dia da semana e temporada alteram o valor como na vida
real. Os preços foram calibrados contra o mercado brasileiro (São Paulo–Rio na
casa dos R$ 400; São Paulo–Lisboa ida e volta entre R$ 4 mil e R$ 6 mil na
econômica).

---

## Qualidade

- **Acessibilidade:** zero violações WCAG 2.1 AA (axe-core) nas 7 telas, em
  1440px e 375px. Foco de teclado visível em tudo, `prefers-reduced-motion`
  respeitado, nenhuma página rola horizontalmente.
- **Erros:** nenhuma ferramenta lança. Falha vira `{ ok: false, erro, sugestao }`,
  que a interface renderiza com o que houve e o que fazer. `error.tsx` e
  `not-found.tsx` cobrem o resto — nunca há tela em branco.
- **Validação:** Zod em toda entrada de ferramenta e em todo corpo de rota.
- **Rate limit:** token bucket por IP nas rotas de escrita.
- **Tipos:** TypeScript estrito com `noUncheckedIndexedAccess`.

## Limitações conhecidas

1. **Sem autenticação.** O viajante é um cookie e o painel do atendente é uma
   rota aberta, com aviso na tela. Em produção seria sessão + papel.
2. **Modo demonstração não é um modelo.** Sem `XAI_API_KEY`, quem interpreta o
   pedido é um conjunto de heurísticas: entende as frases do roteiro de demo,
   mas não conversa de verdade. Com a chave, o Grok assume.
3. **Sem ESLint configurado.** Foi omitido para acelerar a POC; o typecheck
   estrito faz a maior parte do trabalho.
4. **SQLite sem migrações versionadas.** O schema é aplicado com `db push`.
5. **O job de alerta é manual.** Não há cron: a verificação roda no botão.
6. **Sem testes automatizados.** A verificação foi feita rodando o app: cada
   fase foi aberta no navegador, auditada com axe-core e exercitada via API.
7. **Regras consulares e políticas de tarifa são fictícias**, escritas para
   parecerem plausíveis. Não use como orientação real de viagem.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run db:push` | Aplica o schema no SQLite |
| `npm run db:seed` | Recria os dados de demonstração |
| `npm run db:studio` | Prisma Studio |

## Demonstração

O passo a passo do que mostrar está em [DEMO.md](DEMO.md).
O plano de arquitetura e de design, em [docs/plano-fase-0.md](docs/plano-fase-0.md).
