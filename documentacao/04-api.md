# 04 - Documentacao da API

Autor exclusivo deste arquivo: Enzo Carleti Teixeira

Todas as rotas do backend: metodo, endereco, quem pode chamar, dados
enviados, resposta e erros possiveis.

Endereco base: `http://localhost:3000/api`

---

## Informacoes gerais

### Autenticacao

Todas as rotas, com excecao do login, exigem o token recebido no momento
do login. O token vai no cabecalho da requisicao:

```
Authorization: Bearer <token>
```

O token vale por 8 horas, tempo configurado em `VALIDADE_TOKEN` no
arquivo `.env`.

### Formato das respostas

Sucesso: o conteudo pedido, em JSON.

Erro: sempre no mesmo formato, com a mensagem ja escrita em linguagem
simples, pronta para ser exibida ao usuario.

```json
{ "erro": "A demanda precisa passar pelo status Em revisao antes de ser concluida." }
```

### Codigos HTTP usados

| Codigo | Significado |
|---|---|
| 200 | Deu certo |
| 201 | Registro criado |
| 400 | Dados invalidos ou regra de negocio nao atendida |
| 401 | Sem login, ou token invalido ou vencido |
| 403 | Logado, mas sem permissao para esta acao |
| 404 | Registro ou endereco nao encontrado |
| 500 | Erro inesperado no servidor |
| 503 | A API externa de feriados nao respondeu |

---

## 1. Autenticacao

### POST /api/autenticacao/login

Entra no sistema. Unica rota que nao exige token.

Dados enviados:

```json
{
  "email": "eduardo@time11.com",
  "senha": "admin123"
}
```

Resposta (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "nome": "Eduardo Martins Colmati",
    "email": "eduardo@time11.com",
    "perfil": "ADMINISTRADOR",
    "perfilDescricao": "Administrador"
  }
}
```

Erros possiveis:

| Codigo | Quando acontece | Mensagem |
|---|---|---|
| 400 | E-mail nao informado | Informe o e-mail para entrar no sistema. |
| 400 | Senha nao informada | Informe a senha para entrar no sistema. |
| 401 | E-mail nao existe ou senha errada | E-mail ou senha incorretos. Confira os dados e tente novamente. |
| 403 | Usuario inativo | Este usuario esta inativo. Procure o administrador do sistema. |

Observacao de seguranca: e-mail inexistente e senha errada devolvem
exatamente a mesma mensagem. Se fossem diferentes, seria possivel
descobrir quais e-mails estao cadastrados testando um por um.

Como testar:

```
curl -X POST http://localhost:3000/api/autenticacao/login \
  -H "Content-Type: application/json" \
  -d '{"email":"eduardo@time11.com","senha":"admin123"}'
```

### GET /api/autenticacao/eu

Confere se o token continua valido e devolve os dados do usuario logado.
Usada pelo frontend ao abrir cada tela.

Resposta (200):

```json
{
  "usuario": {
    "id": 1,
    "nome": "Eduardo Martins Colmati",
    "email": "eduardo@time11.com",
    "perfil": "ADMINISTRADOR",
    "perfilDescricao": "Administrador"
  }
}
```

Erro: 401 quando o token esta ausente, invalido ou vencido.

---

## 2. Demandas

### GET /api/demandas

Lista as demandas que o usuario pode enxergar.

Quem pode chamar: todos os perfis logados. O Administrador ve todas as
demandas; os demais veem apenas as dos projetos aos quais estao
vinculados.

Parametros na URL, todos opcionais:

| Parametro | Valores aceitos | Efeito |
|---|---|---|
| `status` | ABERTA, EM_ANDAMENTO, EM_REVISAO, CONCLUIDA, CANCELADA | Filtra por status |
| `prioridade` | BAIXA, MEDIA, ALTA, CRITICA | Filtra por prioridade |
| `tipo` | TAREFA, DEFEITO, MELHORIA, DOCUMENTACAO | Filtra por tipo |
| `projetoId` | numero | Filtra por projeto |
| `responsavelId` | numero ou `sem` | Filtra por responsavel. O valor `sem` traz as demandas ainda nao atribuidas |
| `busca` | texto | Procura no titulo e na descricao |
| `ordenarPor` | prioridade, prazo, criacao, status, titulo | Ordena o resultado. Padrao: prioridade |

Resposta (200):

```json
{
  "total": 2,
  "demandas": [
    {
      "id": 1,
      "titulo": "Corrigir erro ao salvar nota do aluno",
      "tipo": "DEFEITO",
      "tipoDescricao": "Defeito",
      "prioridade": "CRITICA",
      "prioridadeDescricao": "Critica",
      "status": "ABERTA",
      "statusDescricao": "Aberta",
      "projeto": { "id": 1, "nome": "Portal do Aluno" },
      "responsavel": { "id": 4, "nome": "Gustavo de Oliveira de Santana" },
      "criadoEm": "2026-08-27 00:12:41",
      "prazoFinalizacao": "2026-09-10"
    }
  ]
}
```

O campo `responsavel` vem como `null` quando a demanda ainda nao tem
responsavel.

Como testar:

```
curl "http://localhost:3000/api/demandas?status=ABERTA&prioridade=CRITICA" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### GET /api/demandas/:id

Detalhes completos de uma demanda, com comentarios, historico e as acoes
que o usuario logado pode realizar.

Quem pode chamar: todos os perfis logados, desde que tenham acesso ao
projeto da demanda.

Resposta (200):

```json
{
  "demanda": {
    "id": 1,
    "titulo": "Corrigir erro ao salvar nota do aluno",
    "descricao": "Ao lancar uma nota com virgula o sistema apresenta erro.",
    "tipo": "DEFEITO",
    "tipoDescricao": "Defeito",
    "prioridade": "CRITICA",
    "prioridadeDescricao": "Critica",
    "status": "ABERTA",
    "statusDescricao": "Aberta",
    "projeto": { "id": 1, "nome": "Portal do Aluno" },
    "responsavel": { "id": 4, "nome": "Gustavo de Oliveira de Santana" },
    "criadoPor": "Eduardo Martins Colmati",
    "criadoEm": "2026-08-27 00:12:41",
    "atualizadoEm": "2026-08-27 00:12:41",
    "prazoFinalizacao": "2026-09-10"
  },
  "comentarios": [
    {
      "id": 1,
      "texto": "O erro acontece porque o campo espera ponto no lugar da virgula.",
      "criadoEm": "2026-08-27 00:12:41",
      "autor": { "id": 2, "nome": "Jose Gabriel Bedani" }
    }
  ],
  "historico": [
    {
      "id": 1,
      "campoAlterado": "criacao",
      "valorAnterior": null,
      "valorNovo": "Demanda cadastrada",
      "criadoEm": "2026-08-27 00:12:41",
      "autor": "Eduardo Martins Colmati"
    }
  ],
  "acoesPermitidas": {
    "podeEditar": true,
    "proximosStatus": [
      { "valor": "EM_ANDAMENTO", "descricao": "Em andamento" },
      { "valor": "CANCELADA", "descricao": "Cancelada" }
    ]
  }
}
```

O campo `acoesPermitidas` diz a tela quais botoes desenhar. As regras
ficam apenas no backend, e a tela nao precisa repeti-las.

Erros possiveis:

| Codigo | Quando acontece |
|---|---|
| 400 | O codigo informado nao e um numero valido |
| 403 | O usuario nao tem acesso ao projeto da demanda |
| 404 | A demanda nao existe |

### POST /api/demandas

Cadastra uma nova demanda. Ela sempre nasce com o status ABERTA.

Quem pode chamar: Administrador e Lider de Projeto, e apenas em projetos
aos quais estao vinculados.

Dados enviados:

```json
{
  "titulo": "Criar tela de consulta de faltas",
  "descricao": "Desenvolver a tela que lista as faltas do aluno.",
  "tipo": "TAREFA",
  "prioridade": "ALTA",
  "projetoId": 1,
  "responsavelId": 5,
  "prazoFinalizacao": "2026-09-18"
}
```

Os campos `responsavelId` e `prazoFinalizacao` aceitam `null`.

Resposta (201):

```json
{ "mensagem": "Demanda cadastrada com sucesso.", "demandaId": 15 }
```

Erros possiveis:

| Codigo | Quando acontece | Mensagem |
|---|---|---|
| 400 | Titulo vazio | O campo titulo e obrigatorio. |
| 400 | Descricao vazia | O campo descricao e obrigatorio. |
| 400 | Titulo com mais de 150 caracteres | O campo titulo deve ter no maximo 150 caracteres. |
| 400 | Tipo ou prioridade invalidos | O campo tipo deve ser um destes valores: ... |
| 400 | Projeto nao informado | Escolha o projeto ao qual a demanda pertence. |
| 400 | Data em formato errado | O prazo de finalizacao deve ser uma data valida no formato dia/mes/ano. |
| 400 | Data inexistente, como 31 de fevereiro | O prazo de finalizacao informado nao e uma data valida. |
| 400 | Prazo cai em feriado nacional | A data informada e um feriado nacional (Natal). Escolha outra data. |
| 400 | Responsavel nao participa do projeto | O responsavel escolhido nao participa do projeto desta demanda. |
| 403 | Perfil Membro da Equipe | Seu perfil de acesso nao permite cadastrar demandas. |
| 403 | Lider sem vinculo com o projeto | Voce nao esta vinculado a este projeto. |
| 503 | API de feriados fora do ar | Nao foi possivel verificar os feriados nacionais no momento. |

### PUT /api/demandas/:id

Edita os dados da demanda. O status nao muda por aqui.

Quem pode chamar: Administrador e Lider de Projeto vinculado ao projeto.

Dados enviados: os mesmos do cadastro.

Resposta (200):

```json
{ "mensagem": "Demanda atualizada com sucesso." }
```

Erros possiveis: os mesmos do cadastro, mais:

| Codigo | Quando acontece | Mensagem |
|---|---|---|
| 400 | Demanda concluida ou cancelada | Esta demanda esta concluida e nao pode mais ser editada. |
| 404 | Demanda nao existe | Demanda nao encontrada. |

Detalhe de funcionamento: a API externa de feriados so e consultada
quando o prazo realmente mudou. Salvar a demanda sem alterar a data nao
gera chamada externa.

### PATCH /api/demandas/:id/status

Muda o status da demanda. O cancelamento tambem passa por aqui.

Quem pode chamar: todos os perfis, respeitadas as regras do ciclo de
vida descritas em `05-regras-de-negocio.md`.

Dados enviados:

```json
{ "status": "EM_ANDAMENTO" }
```

Resposta (200):

```json
{ "mensagem": "Status alterado para Em andamento.", "status": "EM_ANDAMENTO" }
```

Erros possiveis:

| Codigo | Quando acontece | Mensagem |
|---|---|---|
| 400 | Status invalido | O campo status deve ser um destes valores: ... |
| 400 | Mesmo status atual | A demanda ja esta com o status Aberta. |
| 400 | Demanda concluida ou cancelada | A demanda esta concluida e nao pode mais ter o status alterado. |
| 400 | Em andamento para Concluida | A demanda precisa passar pelo status Em revisao antes de ser concluida. |
| 400 | Em andamento para Aberta | Uma demanda em andamento nao pode voltar para o status Aberta. |
| 400 | Membro tentando concluir ou cancelar | O perfil Membro da Equipe pode apenas iniciar a demanda e enviar para revisao. |
| 400 | Membro em demanda que nao e dele | O perfil Membro da Equipe so pode alterar o status das demandas atribuidas a ele. |
| 403 | Sem vinculo com o projeto | Voce nao esta vinculado ao projeto desta demanda. |
| 404 | Demanda nao existe | Demanda nao encontrada. |

Nao existe rota DELETE para demandas. O Documento de Visao proibe a
exclusao fisica dos registros.

---

## 3. Comentarios

### POST /api/demandas/:id/comentarios

Registra um comentario em uma demanda.

Quem pode chamar: todos os perfis com acesso ao projeto da demanda,
inclusive o Membro da Equipe.

Dados enviados:

```json
{ "texto": "Consegui reproduzir o erro aqui." }
```

Resposta (201):

```json
{
  "mensagem": "Comentario registrado com sucesso.",
  "comentario": {
    "id": 6,
    "texto": "Consegui reproduzir o erro aqui.",
    "criadoEm": "2026-08-27 00:33:10",
    "autor": { "id": 5, "nome": "Gabriel Lopes Londe Rodrigues" }
  }
}
```

Erros possiveis:

| Codigo | Quando acontece | Mensagem |
|---|---|---|
| 400 | Texto vazio | Escreva o comentario antes de enviar. |
| 400 | Mais de 2000 caracteres | O comentario deve ter no maximo 2000 caracteres. |
| 403 | Sem acesso ao projeto | Voce nao tem acesso as demandas deste projeto. |
| 404 | Demanda nao existe | Demanda nao encontrada. |

---

## 4. Dashboard

### GET /api/dashboard

Numeros da tela inicial. Todos os valores respeitam o perfil do usuario.

Quem pode chamar: todos os perfis logados.

Resposta (200), resumida:

```json
{
  "total": 14,
  "porStatus": {
    "ABERTA": 5, "EM_ANDAMENTO": 4, "EM_REVISAO": 2,
    "CONCLUIDA": 2, "CANCELADA": 1
  },
  "porPrioridade": { "CRITICA": 3, "ALTA": 3, "MEDIA": 4, "BAIXA": 4 },
  "porTipo": { "TAREFA": 4, "DEFEITO": 5, "MELHORIA": 3, "DOCUMENTACAO": 2 },
  "diasParaAlertaDePrazo": 7,
  "demandasCriticasEmAberto": [
    {
      "id": 14,
      "titulo": "Falha ao abrir o site no navegador Safari",
      "status": "EM_ANDAMENTO",
      "statusDescricao": "Em andamento",
      "projeto": "Site Institucional",
      "prazoFinalizacao": "2026-09-03"
    }
  ],
  "demandasProximasDoPrazo": [
    {
      "id": 14,
      "titulo": "Falha ao abrir o site no navegador Safari",
      "status": "EM_ANDAMENTO",
      "statusDescricao": "Em andamento",
      "prioridade": "CRITICA",
      "prioridadeDescricao": "Critica",
      "projeto": "Site Institucional",
      "prazoFinalizacao": "2026-09-03",
      "diasRestantes": 7
    }
  ],
  "descricoes": { "status": {}, "prioridade": {}, "tipo": {} }
}
```

Explicacoes:

- `demandasCriticasEmAberto` traz as demandas de prioridade CRITICA que
  ainda estao em Aberta, Em andamento ou Em revisao.
- `demandasProximasDoPrazo` traz as demandas pendentes cujo prazo cai nos
  proximos 7 dias, incluindo as que ja passaram do prazo. O campo
  `diasRestantes` vem negativo quando a demanda esta atrasada.
- `descricoes` traz os textos de exibicao, para que o frontend nao
  precise repetir as traducoes.

---

## 5. Listas de apoio

### GET /api/projetos

Lista os projetos visiveis para o usuario.

Resposta (200):

```json
{
  "projetos": [
    { "id": 1, "nome": "Portal do Aluno", "descricao": "Sistema web de consulta de notas." }
  ]
}
```

### GET /api/usuarios

Lista os usuarios ativos, usada para preencher o campo de responsavel e
o filtro por responsavel.

Parametro opcional na URL:

| Parametro | Efeito |
|---|---|
| `projetoId` | Traz apenas os usuarios vinculados ao projeto informado |

Resposta (200):

```json
{
  "usuarios": [
    {
      "id": 4,
      "nome": "Gustavo de Oliveira de Santana",
      "email": "gustavo@time11.com",
      "perfil": "MEMBRO",
      "perfilDescricao": "Membro da Equipe"
    }
  ]
}
```

Sem o parametro `projetoId`, o Administrador recebe todos os usuarios e
os demais perfis recebem apenas quem participa dos mesmos projetos que
eles. Isso evita que um usuario comum liste todas as pessoas cadastradas
no sistema.

---

## 6. API externa de feriados

### GET /api/feriados/verificar

Confere se uma data e feriado nacional. Usada pelo formulario para
avisar o usuario antes de salvar.

Parametro obrigatorio na URL:

| Parametro | Formato |
|---|---|
| `data` | AAAA-MM-DD, por exemplo 2026-12-25 |

Resposta (200):

```json
{ "data": "2026-12-25", "ehFeriado": true, "nomeDoFeriado": "Natal" }
```

Erros possiveis:

| Codigo | Quando acontece | Mensagem |
|---|---|---|
| 400 | Data em formato errado | Informe a data no formato ano-mes-dia, por exemplo 2026-12-25. |
| 503 | API externa fora do ar | Nao foi possivel verificar os feriados nacionais no momento. |

Detalhes da integracao em `06-api-externa-feriados.md`.

---

## 7. Rota de verificacao

### GET /api/saude

Confere rapidamente se o servidor esta no ar. Nao exige token.

Resposta (200):

```json
{ "situacao": "ok", "mensagem": "API do PI-II-TIME-11 esta funcionando." }
```

---

## 8. Endereco inexistente

Qualquer endereco desconhecido dentro de `/api` devolve 404 com uma
mensagem que informa o que foi chamado:

```json
{ "erro": "O endereco GET /api/inexistente nao existe nesta API." }
```
