# 06 - Integracao com a API externa de feriados

Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana

Documentacao da unica integracao externa do sistema.

---

## 1. Por que ela existe

O Documento de Visao, item 2.2.5, determina:

> Sera obrigatorio o uso de uma API externa para verificar se a data
> inserida no prazo de finalizacao e um feriado nacional e, no caso
> afirmativo, apresentar uma mensagem de erro e impedir o cadastro ou
> atualizacao desse prazo.

Ou seja: prazo de finalizacao nao pode cair em feriado nacional, e quem
informa quais sao os feriados precisa ser um servico externo.

---

## 2. API escolhida

**Nome:** BrasilAPI  
**Endereco:** `https://brasilapi.com.br/api/feriados/v1/{ano}`  
**Documentacao:** `https://brasilapi.com.br/docs`  
**Custo:** gratuita  
**Cadastro:** nao exige  
**Chave de acesso:** nao exige

Motivos da escolha:

- devolve exatamente os feriados nacionais brasileiros, que e o que o
  documento pede;
- nao exige cadastro nem chave, o que simplifica a instalacao do projeto
  em qualquer maquina da equipe e da banca;
- e mantida por uma comunidade ativa e tem documentacao publica;
- a resposta e simples de ler.

---

## 3. Como configurar

Nao ha chave de acesso a cadastrar. O endereco fica no arquivo `.env`:

```
URL_API_FERIADOS=https://brasilapi.com.br/api/feriados/v1
```

O endereco esta no `.env`, e nao dentro do codigo, para que possa ser
trocado sem alterar o programa. Esse mesmo recurso foi usado durante os
testes, apontando para um servidor local que devolve os feriados no
mesmo formato.

Se a variavel nao for preenchida, o sistema usa o endereco da BrasilAPI
como padrao.

---

## 4. Quais dados sao enviados

Apenas o ano, dentro do proprio endereco:

```
GET https://brasilapi.com.br/api/feriados/v1/2026
```

O sistema nao envia nenhum dado do usuario, nem da demanda, nem do
banco. Nenhuma informacao pessoal sai do sistema.

---

## 5. Quais dados sao recebidos

Uma lista com todos os feriados nacionais do ano:

```json
[
  { "date": "2026-01-01", "name": "Confraternizacao mundial", "type": "national" },
  { "date": "2026-04-21", "name": "Tiradentes",               "type": "national" },
  { "date": "2026-09-07", "name": "Independencia do Brasil",  "type": "national" },
  { "date": "2026-12-25", "name": "Natal",                    "type": "national" }
]
```

O sistema usa dois campos: `date`, para comparar com o prazo, e `name`,
para escrever a mensagem que o usuario vai ler.

---

## 6. Onde esta no codigo

```
backend/src/servicos/feriados.ts        Chamada e verificacao
backend/src/controladores/feriadosControlador.ts   Rota de consulta usada pela tela
frontend/scripts/demanda-formulario.js  Aviso na tela ao escolher a data
```

O arquivo `feriados.ts` tem tres funcoes:

`buscarFeriadosDoAno` chama a API e guarda o resultado na memoria.

`verificarSeEhFeriado` responde se uma data e feriado e qual o nome dele.

`validarPrazoDeFinalizacao` interrompe o cadastro ou a edicao quando a
data cai em feriado. E esta que garante a exigencia do documento.

---

## 7. Como a verificacao acontece

A conferencia acontece em dois momentos, com finalidades diferentes.

**Na tela, ao escolher a data.** Assim que o usuario seleciona um prazo,
a tela chama `GET /api/feriados/verificar` e mostra o resultado embaixo
do campo. Serve para o usuario descobrir o problema antes de preencher o
resto do formulario. Esta verificacao e apenas um aviso.

**No servidor, ao salvar.** No cadastro e na edicao, o backend consulta
os feriados novamente e recusa a gravacao se a data for feriado. Esta e
a verificacao que realmente vale.

A verificacao da tela poderia ser contornada por quem chamasse a API
diretamente. Por isso ela nunca substitui a do servidor.

Fluxo completo:

```
USUARIO escolhe a data
   |
   v
TELA chama /api/feriados/verificar  -> aviso imediato embaixo do campo
   |
   v
USUARIO clica em salvar
   |
   v
BACKEND valida os campos
   |
   v
BACKEND consulta os feriados          -> se for feriado, recusa (400)
   |
   v
BANCO grava a demanda
   |
   v
TELA mostra o resultado
```

---

## 8. Memoria dos anos ja consultados

A lista de feriados de um ano nao muda. Consultar a API a cada cadastro
seria desperdicio e deixaria o sistema mais lento.

Por isso, na primeira vez que um ano e consultado, o resultado fica
guardado na memoria do servidor. As proximas consultas daquele ano nao
geram chamada externa.

A memoria e limpa quando o servidor e reiniciado, o que e suficiente
para este projeto.

---

## 9. O que acontece quando a API falha

Situacoes possiveis: maquina sem internet, BrasilAPI fora do ar, ou
resposta demorando demais.

O sistema espera no maximo 8 segundos pela resposta. Depois disso a
requisicao e cancelada.

Em qualquer falha, acontecem duas coisas:

1. O erro tecnico e gravado no console do servidor, para o desenvolvedor:

```
[feriados] Falha ao consultar a API externa: <detalhe tecnico>
```

2. O usuario recebe uma mensagem simples, com o codigo HTTP 503:

```
Nao foi possivel verificar os feriados nacionais no momento.
Verifique sua conexao com a internet e tente novamente.
```

### Por que o sistema recusa a gravacao em vez de deixar passar

Esta foi uma decisao consciente da equipe.

A alternativa seria gravar o prazo mesmo sem conseguir conferir, para
nao travar o usuario. A equipe descartou essa opcao porque o Documento
de Visao trata a verificacao como obrigatoria. Deixar passar sem
conferir descumpriria a regra justamente quando ela nao pode ser
verificada.

Vale registrar o efeito colateral: sem internet, nao e possivel cadastrar
uma demanda com prazo. O cadastro sem prazo continua funcionando
normalmente, e o prazo pode ser preenchido depois, quando a conexao
voltar.

---

## 10. Como testar

Com o servidor rodando e um token valido:

```
curl "http://localhost:3000/api/feriados/verificar?data=2026-12-25" \
  -H "Authorization: Bearer SEU_TOKEN"
```

Resposta esperada:

```json
{ "data": "2026-12-25", "ehFeriado": true, "nomeDoFeriado": "Natal" }
```

Um dia util:

```
curl "http://localhost:3000/api/feriados/verificar?data=2026-09-16" \
  -H "Authorization: Bearer SEU_TOKEN"
```

```json
{ "data": "2026-09-16", "ehFeriado": false, "nomeDoFeriado": null }
```

Pela tela: abrir o cadastro de demanda, escolher 25/12/2026 no prazo e
observar o aviso em vermelho embaixo do campo. Ao tentar salvar, o
servidor recusa com a mensagem que informa o nome do feriado.

Datas uteis para testar em 2026:

| Data | Resultado esperado |
|---|---|
| 01/01/2026 | Feriado (Confraternizacao mundial) |
| 21/04/2026 | Feriado (Tiradentes) |
| 01/05/2026 | Feriado (Dia do trabalho) |
| 07/09/2026 | Feriado (Independencia do Brasil) |
| 12/10/2026 | Feriado (Nossa Senhora Aparecida) |
| 02/11/2026 | Feriado (Finados) |
| 15/11/2026 | Feriado (Proclamacao da Republica) |
| 25/12/2026 | Feriado (Natal) |
| 16/09/2026 | Dia util, aceito |

---

## 11. Observacao sobre feriados estaduais e municipais

A BrasilAPI devolve apenas os feriados nacionais. Feriados estaduais e
municipais nao entram na verificacao.

Isso atende ao Documento de Visao, que fala especificamente em feriado
nacional. Se no futuro for preciso considerar feriados locais, seria
necessario trocar a API ou complementar a lista, e o unico arquivo a ser
alterado seria `backend/src/servicos/feriados.ts`.
