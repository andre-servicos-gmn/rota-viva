# Roteiro de demonstração

Doze minutos, sete paradas. Cada bloco tem o que fazer, o que dizer e o que a
pessoa do outro lado precisa notar.

**Antes de começar:**

```bash
npm run db:seed    # deixa o app com histórico
npm run dev
```

Abra `http://localhost:3000` e deixe uma segunda aba em `/atendente`.

> Se `XAI_API_KEY` não estiver configurada, o app roda em modo demonstração e
> entende as frases deste roteiro. Com a chave, o Grok assume e a conversa fica
> livre — o roteiro continua valendo.

---

## 1. A busca (2 min)

**Digite:** `Quero um voo de São Paulo para Lisboa em outubro, 2 pessoas`

**Aponte:**

- O indicador diz **"Buscando voos GRU → LIS"** — a pessoa vê o agente
  trabalhando, não uma barra de progresso genérica.
- O resultado é um **bilhete com canhoto perfurado**, não um bloco de texto.
  Esse desenho volta em toda tela do produto, inclusive no PDF.
- O **calendário de preços** mostra que sair um dia depois pode custar menos.
  Clicável.
- O agente **comenta a diferença** em vez de repetir a lista: mais barata versus
  sem escalas, com recomendação e motivo.

**Frase útil:** "Repare que ele não listou seis opções iguais. Ele disse qual
escolheria e por quê."

## 2. O hotel e a comparação (1 min)

**Digite:** `Preciso de hotel em Lisboa com café da manhã, 5 noites`

**Faça:** clique no **coração** de dois ou três hotéis.

**Vá em Comparador.** As opções salvas aparecem lado a lado, com o **melhor
valor de cada linha destacado em verde** — diária, nota, distância, café da
manhã, cancelamento.

**Frase útil:** "O preço aqui é o que ele viu quando salvou, não uma busca nova."

## 3. A reserva, com freio (2 min)

**Volte ao chat** e clique em **Escolher** num voo.

**Aponte:** aparece um **card de confirmação**, não uma reserva emitida. Ele
mostra o total, os passageiros e — quando a tarifa não é reembolsável — o aviso
de que não haverá devolução.

**Diga:** "A regra das duas etapas está no schema da ferramenta, não no texto do
prompt. Mesmo que o modelo entenda errado, ele não consegue emitir sem o segundo
sim."

**Clique em Confirmar reserva.** Sai o voucher com localizador.

## 4. O voucher em PDF (30 s)

No card do voucher, clique em **PDF**. Abre um PDF de verdade, gerado no
servidor, com o mesmo bilhete: perfuração, canhoto, carimbo **EMITIDO** e as
regras da tarifa por extenso.

**Frase útil:** "Mesmo desenho da tela. Um componente, três destinos: chat,
lista de reservas e papel."

## 5. O pós-venda que diz não (2 min)

**Vá em Minhas reservas → RV-7K2M9P → Cancelar no chat.**

O botão abre o chat com a pergunta já escrita. O agente calcula e mostra:

- valor pago,
- multa da tarifa,
- **quanto volta para você**.

**Aponte:** o botão diz **"Cancelar e pagar multa de R$ 420"**, não "Confirmar".
E quando o reembolso é zero, o agente sugere remarcar em vez de cancelar — ele
não empurra a ação que dá dinheiro à agência.

**Frase útil:** "A regra de multa está em um lugar só. A tela de reservas e o
agente leem o mesmo código, então não existe divergência entre o que o robô diz
e o que o sistema faz."

## 6. Quando o agente não tem alçada (2 min)

**Digite:** `Preciso cancelar sem multa, tenho atestado médico`

O agente explica que não tem alçada e **escala para humano**.

**Vá para a aba `/atendente`.** A conversa está na fila com:

- o **motivo** da escalação,
- um **resumo escrito para o atendente**,
- a **transcrição completa**, incluindo os cards que o cliente viu.

**Clique em Assumir conversa.**

**Frase útil:** "O atendente entra vendo exatamente o que o cliente viu. Ninguém
pede para repetir a história."

## 7. Roteiro, perfil e alertas (2 min)

**Digite:** `Monte um roteiro de 3 dias em Lisboa`

Sai uma linha do tempo por dia, com atrações, refeições, deslocamento e custo
estimado.

**Vá em Roteiro.** Reordene um bloco com as setas, edite um título, remova
outro, clique em **Salvar roteiro**.

**Frase útil:** "Reordenar é por botão, não por arrastar. Funciona no teclado e
no celular — arrastar não funciona em nenhum dos dois."

**Vá em Perfil.** Mostre as preferências (assento, companhia, restrição
alimentar) que entram nas buscas seguintes, e os **alertas de preço** com a
queda destacada. Clique em **Verificar agora**.

**Seja honesto:** "Não há cron rodando numa POC. Esse botão faz o papel do
agendador, e a tela diz isso."

---

## Se perguntarem

**"Os dados são reais?"**
Não, e isso é proposital. Tudo vem de `lib/providers/`, atrás de interfaces.
Trocar por Amadeus é escrever uma implementação e mudar uma linha na fábrica —
nenhuma tela, nenhuma ferramenta muda. As distâncias entre aeroportos são reais,
e os preços foram calibrados contra o mercado brasileiro, para as contas fazerem
sentido durante a demonstração.

**"Está usando qual modelo?"**
xAI, Grok, por endpoint compatível com OpenAI. Trocar de provedor é uma linha em
`lib/ai/provider.ts`. A chave só existe no servidor.

**"E se o modelo alucinar um preço?"**
Ele não tem de onde. O system prompt proíbe responder política, preço ou
documentação de memória, e toda resposta desse tipo passa por ferramenta. Se a
ferramenta falha, a interface mostra o erro com uma saída — não uma invenção.

**"Quanto custaria colocar em produção?"**
O que falta não é interface: é autenticação, integração com fornecedor,
pagamento, e-mail transacional, observabilidade e uma base de regras consulares
licenciada. A arquitetura já está separada para receber isso sem reescrita.

**"Funciona no celular?"**
Sim — 375px em diante. E passa em WCAG 2.1 AA nas sete telas, verificado com
axe-core.
