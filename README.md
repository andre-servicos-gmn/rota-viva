# Rota Viva

Prova de conceito de uma agência de viagens digital com agente conversacional:
o usuário conversa, o agente busca voos e hotéis, monta roteiros, emite reservas
e cuida do pós-venda.

**Rota Viva é uma marca fictícia.** Todos os dados de viagem — voos, hotéis,
preços, políticas, passageiros — são inventados para demonstração. Nenhuma
integração real de GDS, nenhuma cobrança, nenhum dado pessoal verdadeiro.

> Documentação em construção — o README completo (o que é mock, o que seria real
> em produção, limitações conhecidas) fecha na fase 5. O plano de arquitetura e
> de design está em [docs/plano-fase-0.md](docs/plano-fase-0.md).

## Como rodar

```bash
npm install
cp .env.example .env.local     # variáveis do modelo
cp .env.example .env           # o CLI do Prisma lê o .env
npx prisma db push             # cria prisma/dev.db
npm run dev                    # http://localhost:3000
```

## Variáveis

| Variável | Obrigatória | Para quê |
|---|---|---|
| `XAI_API_KEY` | não | Chave da xAI. **Sem ela o app roda em modo demonstração** (respostas locais, sem IA) — a interface, o streaming e o histórico funcionam igual. |
| `XAI_BASE_URL` | não | Endpoint compatível com OpenAI. Padrão: `https://api.x.ai/v1`. |
| `XAI_MODEL` | não | Modelo a usar. Padrão: `grok-4-fast`. |
| `DATABASE_URL` | sim | SQLite local. Padrão: `file:./dev.db`. |

A chave nunca chega ao navegador: o client fala com `app/api/chat/route.ts`, e só
essa rota fala com o provedor.

## Estado da construção

- [x] **Fase 1** — esqueleto: Next 15, Tailwind 4, Prisma, shell, chat com streaming e histórico
- [ ] **Fase 2** — providers, mocks e as tools de busca (voos, hotéis, pacote, roteiro)
- [ ] **Fase 3** — reserva, pós-venda, suporte e painel do atendente
- [ ] **Fase 4** — extras, comparador, roteiro editável e perfil
- [ ] **Fase 5** — polimento, acessibilidade, seed de demonstração e `DEMO.md`

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run db:push` | Aplica o schema no SQLite |
| `npm run db:studio` | Abre o Prisma Studio |
