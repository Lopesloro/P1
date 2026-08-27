# 08 - Testes realizados

Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues

Registro dos testes feitos no sistema e dos problemas encontrados e
corrigidos durante o desenvolvimento.

---

## 1. Como o sistema foi testado

Cada funcionalidade so foi considerada concluida depois de passar por
tres verificacoes:

1. **Fluxo normal.** A funcionalidade faz o que deveria fazer.
2. **Dados invalidos.** Campos vazios, valores errados, codigos que nao
   existem.
3. **Integracao completa.** Tela, backend, banco e resposta de volta na
   tela.

Os testes foram automatizados em dois arquivos, para que possam ser
repetidos a qualquer momento, principalmente antes da apresentacao para
a banca.

| Arquivo | O que testa | Como executar |
|---|---|---|
| `testes/testar-api.sh` | As regras de negocio, chamando a API diretamente | `bash testes/testar-api.sh` |
| `testes/testar-telas.js` | As cinco telas em um navegador de verdade | `node testes/testar-telas.js` |

Antes de rodar qualquer um deles, o banco precisa ser recriado com os
dados de teste e o servidor precisa estar no ar:

```
mysql -u root -p < banco/01_criar_tabelas.sql
mysql -u root -p < banco/02_inserir_dados_iniciais.sql
cd backend && npm run dev
```

---

## 2. Resultado

| Conjunto | Testes | Resultado |
|---|---|---|
| API (regras de negocio) | 67 | Todos aprovados |
| Telas (navegador) | 50 | Todos aprovados |
| Verificacao de tipos do TypeScript | - | Sem erros |

---

## 3. Testes da API

### 3.1 Autenticacao

| Teste | Resultado esperado |
|---|---|
| Login com dados corretos | Devolve token e dados do usuario |
| Login com senha errada | Recusado, mensagem generica |
| Login com e-mail inexistente | Recusado, mesma mensagem da senha errada |
| Login com e-mail vazio | Recusado, pede o e-mail |
| Rota protegida sem token | Recusado com codigo 401 |
| Rota protegida com token adulterado | Recusado com codigo 401 |

### 3.2 Listagem, filtros e busca

| Teste | Resultado esperado |
|---|---|
| Listagem sem filtros | Traz todas as demandas visiveis |
| Filtro por status | Traz apenas as do status escolhido |
| Filtro por prioridade | Traz apenas as da prioridade escolhida |
| Dois filtros combinados | Aplica os dois ao mesmo tempo |
| Filtro "sem responsavel" | Traz apenas as ainda nao atribuidas |
| Busca por texto no titulo | Encontra a demanda |
| Busca por texto na descricao | Encontra a demanda |
| Ordenacao por prioridade | Criticas aparecem primeiro |
| Ordenacao com valor invalido | Usa a ordenacao padrao, sem quebrar |
| Tentativa de SQL Injection na busca | Tratada como texto comum, nao retorna tudo |

Sobre o teste de SQL Injection: foi enviado o texto `' OR 1=1 --` no
campo de busca. Se as consultas estivessem montadas com concatenacao de
texto, esse comando faria a consulta devolver todas as demandas do
sistema. Como o valor entra como parametro, ele foi tratado como texto
comum e o resultado foi zero demandas, que e o correto.

### 3.3 Permissoes por perfil

| Teste | Resultado esperado |
|---|---|
| Membro lista demandas | Ve apenas os projetos aos quais esta vinculado |
| Membro tenta cadastrar demanda | Recusado com codigo 403 |
| Membro tenta editar demanda | Recusado com codigo 403 |
| Membro acessa demanda de projeto que nao participa | Recusado com codigo 403 |
| Lider cadastra em projeto que nao participa | Recusado com codigo 403 |

### 3.4 Ciclo de vida da demanda

| Teste | Resultado esperado |
|---|---|
| Aberta direto para Concluida | Recusado |
| Em andamento direto para Concluida | Recusado, com a mensagem sobre Em revisao |
| Em andamento de volta para Aberta | Recusado |
| Alterar status de demanda concluida | Recusado |
| Alterar status de demanda cancelada | Recusado |
| Membro altera demanda que nao e dele | Recusado |
| Membro envia sua demanda para revisao | Permitido |
| Membro tenta concluir demanda | Recusado |
| Lider conclui apos a revisao | Permitido |
| Lider cancela demanda aberta | Permitido |
| Demanda cancelada continua no banco | Confirmado |

### 3.5 Cadastro e validacoes

| Teste | Resultado esperado |
|---|---|
| Sem titulo | Recusado |
| Sem descricao | Recusado |
| Tipo invalido | Recusado |
| Sem projeto | Recusado |
| Data em formato errado (31/12/2026) | Recusado |
| Data inexistente (2026-02-31) | Recusado |
| Responsavel que nao participa do projeto | Recusado |
| Cadastro valido | Aceito, com status inicial ABERTA |
| Historico registra a criacao | Confirmado |

### 3.6 Edicao e historico

| Teste | Resultado esperado |
|---|---|
| Edicao valida | Aceita |
| Mudanca de prioridade registrada no historico | Confirmado |
| Mudanca de responsavel registrada no historico | Confirmado |
| Valor realmente alterado no banco | Confirmado |

### 3.7 Comentarios

| Teste | Resultado esperado |
|---|---|
| Comentario vazio | Recusado |
| Membro registra comentario | Aceito |
| Comentario aparece nos detalhes | Confirmado |

### 3.8 Dashboard

| Teste | Resultado esperado |
|---|---|
| Total de demandas | Confere com o banco |
| Contagem por status, prioridade e tipo | Presentes e corretas |
| Demandas criticas em aberto | Presentes |
| Demandas proximas do prazo | Presentes |
| Dashboard do Membro | Conta apenas os projetos dele |

### 3.9 API externa de feriados

| Teste | Resultado esperado |
|---|---|
| Consulta ao dia 25/12/2026 | Identificado como feriado (Natal) |
| Consulta a um dia util | Identificado como nao feriado |
| Data em formato invalido | Recusada |
| Cadastro com prazo em feriado | Bloqueado, com o nome do feriado na mensagem |
| Edicao com prazo em feriado | Bloqueada |

### 3.10 Rota inexistente

| Teste | Resultado esperado |
|---|---|
| Endereco desconhecido | Codigo 404 com mensagem explicativa |

---

## 4. Testes das telas

Executados em um navegador real, repetindo o que um usuario faria.

### 4.1 Tela de Login

| Teste | Resultado esperado |
|---|---|
| Enviar com campos vazios | Campos marcados em vermelho, com o motivo |
| E-mail sem arroba | Recusado antes de chamar o servidor |
| Senha errada | Mensagem do servidor exibida na tela |
| Campo de senha limpo apos erro | Confirmado, com o e-mail preservado |
| Botao de mostrar senha | Alterna entre texto e senha |
| Link de senha esquecida | Orienta a procurar o administrador |
| Login valido | Leva ao dashboard |

### 4.2 Tela de Dashboard

| Teste | Resultado esperado |
|---|---|
| Seis cartoes (total mais cinco status) | Confirmado |
| Numeros preenchidos | Confirmado |
| Barras de prioridade e de tipo | Quatro linhas em cada |
| Lista de criticas em aberto | Preenchida |
| Cabecalho mostra nome e perfil | Confirmado |

### 4.3 Tela de Listagem

| Teste | Resultado esperado |
|---|---|
| Tabela carrega as demandas | Confirmado |
| Botao "Nova demanda" para Administrador | Visivel |
| Filtro por status | Atualiza a lista sozinho |
| Filtro salvo no endereco da pagina | Confirmado |
| Busca por texto | Encontra a demanda |
| Botao Limpar | Restaura a lista completa |

### 4.4 Tela de Cadastro

| Teste | Resultado esperado |
|---|---|
| Campos obrigatorios vazios | Todos marcados de uma vez |
| Lista de responsaveis do projeto | Carregada apos escolher o projeto |
| Escolher data de feriado | Aviso em vermelho embaixo do campo |
| Tentar salvar com feriado | Servidor recusa e a tela mostra o motivo |
| Escolher dia util | Aviso confirma que a data esta disponivel |
| Cadastro concluido | Leva a tela de detalhes com mensagem de sucesso |

### 4.5 Tela de Detalhes

| Teste | Resultado esperado |
|---|---|
| Mensagem de sucesso do cadastro | Exibida |
| Titulo, etiquetas e ficha | Preenchidos |
| Historico mostra a criacao | Confirmado |
| Botao editar para Administrador | Visivel |
| Comentario vazio | Recusado na tela |
| Comentario valido | Aparece na lista, com contador atualizado |
| Botoes de status | Apenas as transicoes permitidas |
| Mudanca de status | Aplicada e registrada no historico |
| Botao de concluir antes da revisao | Nao existe |

### 4.6 Perfil Membro da Equipe

| Teste | Resultado esperado |
|---|---|
| Login do Membro | Funciona, perfil correto no cabecalho |
| Botao "Nova demanda" | Nao aparece |
| Acesso direto ao formulario | Aviso explicando que o perfil nao cadastra |

### 4.7 Sessao

| Teste | Resultado esperado |
|---|---|
| Abrir tela interna sem login | Redireciona para o login |

### 4.8 Responsividade

| Teste | Resultado esperado |
|---|---|
| Dashboard no celular (390x844) | Sem rolagem horizontal |
| Listagem no celular | Sem rolagem horizontal na pagina; a tabela rola sozinha |
| Detalhes no celular | Sem rolagem horizontal |
| Dashboard no tablet (820x1180) | Sem rolagem horizontal |

### 4.9 Console do navegador

| Teste | Resultado esperado |
|---|---|
| Erros de JavaScript | Nenhum |

---

## 5. Problemas encontrados e corrigidos

Os tres problemas abaixo foram encontrados pelos testes automatizados e
corrigidos antes da entrega.

### 5.1 Data inexistente era aceita

**Onde:** validacao do prazo de finalizacao, no cadastro e na edicao.

**O que acontecia:** a data 2026-02-31 passava pela validacao. O formato
estava correto, e a verificacao usava o objeto `Date` do JavaScript
esperando que ele acusasse erro.

**Causa:** o JavaScript nao acusa erro em data inexistente. Ele avanca
para o dia seguinte do mes seguinte. O 31 de fevereiro vira 3 de marco
silenciosamente.

**Correcao:** a data e montada e depois conferida. Se o dia, o mes ou o
ano mudarem em relacao ao que foi digitado, a data original nao existia
e e recusada.

**Arquivo:** `backend/src/controladores/demandasCadastroControlador.ts`,
funcao `validarFormatoDaData`.

### 5.2 Botao restrito aparecia para o perfil sem permissao

**Onde:** botao "Nova demanda", na tela de listagem.

**O que acontecia:** o botao continuava visivel para o Membro da Equipe,
mesmo estando marcado com o atributo `hidden` do HTML.

**Causa:** o navegador tem uma regra propria que esconde elementos com o
atributo `hidden`. Acontece que qualquer `display` escrito por nos tem
prioridade sobre essa regra. Como a classe `.botao` define
`display: inline-flex`, o `hidden` era anulado.

**Impacto:** era um problema de tela, e nao de seguranca. O backend
continuava recusando o cadastro pelo perfil Membro, o que foi confirmado
pelos testes da API. Ainda assim, mostrar uma acao que o usuario nao pode
executar e um defeito.

**Correcao:** foi acrescentada uma regra global que garante o
funcionamento do `hidden` em qualquer elemento.

```css
[hidden] {
  display: none !important;
}
```

**Arquivo:** `frontend/estilos/base.css`.

### 5.3 Conexao ao banco recusada com o usuario root

**Onde:** inicializacao do backend.

**O que acontecia:** o servidor nao conectava, com a mensagem
`Access denied for user 'root'@'localhost'`.

**Causa:** em varias instalacoes do Linux, o usuario root do MySQL e
configurado para aceitar conexao apenas pelo terminal, e nao por senha.

**Correcao:** foi criado o script
`banco/03_criar_usuario_do_sistema.sql`, que cria um usuario proprio para
a aplicacao, com permissoes limitadas ao banco do projeto. O README
explica quando ele e necessario.

Essa correcao trouxe um ganho de seguranca: o usuario criado recebe
apenas SELECT, INSERT e UPDATE. Sem a permissao DELETE, o proprio banco
passa a reforcar a regra que proibe a exclusao de registros.

---

## 6. Observacao sobre o ambiente de teste

Os testes da API externa de feriados foram executados de duas formas.

Na maquina de desenvolvimento com internet, a chamada foi feita
diretamente a BrasilAPI.

No ambiente onde os testes automatizados rodaram, o acesso a internet
estava bloqueado. Para conseguir testar a integracao mesmo assim, a
variavel `URL_API_FERIADOS` foi apontada para um servidor local que
devolve os feriados no mesmo formato da BrasilAPI.

Isso foi possivel porque o endereco da API fica no arquivo `.env`, e nao
escrito dentro do codigo. O codigo testado e exatamente o mesmo que roda
em producao: a unica coisa que mudou foi o endereco consultado.

---

## 7. Como repetir os testes antes da banca

```
# 1. Recriar o banco com os dados de teste
mysql -u root -p < banco/01_criar_tabelas.sql
mysql -u root -p < banco/02_inserir_dados_iniciais.sql

# 2. Subir o servidor (deixar rodando neste terminal)
cd backend
npm run dev

# 3. Em outro terminal, na raiz do projeto:
npx tsc --noEmit --project backend    # verificacao de tipos
bash testes/testar-api.sh             # regras de negocio
node testes/testar-telas.js           # telas no navegador
```

O teste das telas precisa da biblioteca Playwright:

```
npm install playwright
npx playwright install chromium
```

Os numeros esperados nos testes consideram o banco recem populado. Se o
banco tiver sido alterado manualmente, recrie-o antes de rodar.
