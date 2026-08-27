# 03 - Banco de dados

Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana

Documentacao completa do modelo de dados do sistema.

---

## 1. O projeto precisa de banco de dados?

Analise feita antes de escolher a tecnologia:

| Pergunta | Resposta |
|---|---|
| Quais informacoes precisam ser salvas? | Usuarios, projetos, demandas, comentarios e historico de alteracoes. |
| Existem relacoes entre as informacoes? | Sim. Toda demanda pertence a um projeto e pode ter um responsavel. Todo comentario pertence a uma demanda e a um usuario. |
| Existem usuarios? | Sim, com login e senha. |
| Existem permissoes? | Sim, tres perfis com permissoes diferentes. |
| Havera historico? | Sim, e ele nunca pode ser apagado. |
| Os dados precisam continuar salvos apos fechar o sistema? | Sim. Um sistema de acompanhamento que perde os dados ao ser fechado nao serve para nada. |
| Havera grande volume de dados? | Nao neste projeto, mas o modelo suporta crescimento. |
| Sao necessarias consultas complexas? | Sim. O dashboard agrupa e conta demandas por status, prioridade e tipo, e a listagem combina varios filtros. |

Conclusao: o sistema precisa de banco de dados.

---

## 2. SQL ou NoSQL?

A escolha entre banco relacional e nao relacional foi decidida pela
natureza dos dados.

**Os dados sao fortemente relacionados.** Uma demanda aponta para um
projeto, para um responsavel e para quem a cadastrou. Comentarios e
historico apontam para uma demanda e para um usuario. Esse tipo de
ligacao e exatamente o que um banco relacional faz com chaves
estrangeiras.

**Os dados sao repetidos entre registros.** O nome de um usuario aparece
como responsavel de varias demandas, como autor de comentarios e como
autor de alteracoes no historico. Em um banco de documentos, esse nome
seria copiado em varios lugares e, ao ser corrigido, precisaria ser
atualizado em todos eles. No modelo relacional o nome fica gravado uma
unica vez, na tabela `usuarios`.

**As consultas somam e agrupam.** O dashboard precisa contar demandas
por status, por prioridade e por tipo. `GROUP BY` e `COUNT` resolvem isso
em uma linha de SQL.

**O formato dos dados e sempre o mesmo.** Toda demanda tem os mesmos
campos. Nao existe demanda com estrutura diferente, situacao em que um
banco de documentos seria vantajoso.

Alem disso, o Documento de Visao (item 3) exige banco relacional.

**Decisao: banco relacional, MySQL 8.** A escolha entre MySQL e Oracle
esta justificada em `02-tecnologias.md`.

---

## 3. Visao geral do modelo

Seis tabelas:

```
usuarios ----------+-----------------------------+
   |               |                             |
   |               | (responsavel)               | (criado_por)
   |               v                             v
   |          +---------+                   +---------+
   |          | demandas|<------------------|         |
   |          +---------+                   +---------+
   |               |    ^
   |               |    |
   |               |    +---- projetos
   |               |
   |          +----+----+
   |          |         |
   v          v         v
projeto_  comentarios  historico_alteracoes
usuarios
```

| Tabela | Guarda |
|---|---|
| `usuarios` | Quem pode entrar no sistema e com qual perfil |
| `projetos` | Os projetos que agrupam as demandas |
| `projeto_usuarios` | Quais usuarios participam de quais projetos |
| `demandas` | A entidade principal do sistema |
| `comentarios` | Observacoes escritas dentro de uma demanda |
| `historico_alteracoes` | Registro automatico das mudancas |

---

## 4. Relacionamentos

| Relacionamento | Tipo | Como e feito |
|---|---|---|
| projetos e usuarios | Muitos para muitos | Tabela de ligacao `projeto_usuarios` |
| projeto e demandas | Um para muitos | `demandas.projeto_id` |
| usuario e demandas (responsavel) | Um para muitos | `demandas.responsavel_id`, pode ficar vazio |
| usuario e demandas (autor) | Um para muitos | `demandas.criado_por_id` |
| demanda e comentarios | Um para muitos | `comentarios.demanda_id` |
| usuario e comentarios | Um para muitos | `comentarios.usuario_id` |
| demanda e historico | Um para muitos | `historico_alteracoes.demanda_id` |
| usuario e historico | Um para muitos | `historico_alteracoes.usuario_id` |

Explicacao do muitos para muitos entre projetos e usuarios: um usuario
pode participar de varios projetos, e um projeto tem varios usuarios.
Como nenhum dos dois lados comporta a informacao sozinho, foi criada uma
terceira tabela, `projeto_usuarios`, com a chave primaria composta pelas
duas colunas. Essa chave composta impede que o mesmo usuario seja
vinculado duas vezes ao mesmo projeto.

---

## 5. Dicionario de dados

### TABELA: usuarios

Guarda quem pode entrar no sistema e o nivel de acesso de cada um.

```
id
- Tipo: inteiro (INT), incrementado automaticamente
- Chave primaria
- Identificador unico do usuario

nome
- Tipo: texto (VARCHAR 120)
- Obrigatorio
- Nome completo do usuario, exibido nas telas

email
- Tipo: texto (VARCHAR 160)
- Obrigatorio
- Unico
- Usado para fazer login. Nao pode se repetir

senha_hash
- Tipo: texto (VARCHAR 255)
- Obrigatorio
- Resultado do algoritmo bcrypt aplicado a senha.
  A senha em texto puro nunca e gravada

perfil
- Tipo: ENUM('ADMINISTRADOR', 'LIDER', 'MEMBRO')
- Obrigatorio
- Define o que o usuario pode fazer no sistema

ativo
- Tipo: inteiro pequeno (TINYINT), padrao 1
- Obrigatorio
- 1 permite login, 0 bloqueia. Permite desativar um usuario
  sem apagar o registro dele

criado_em
- Tipo: data e hora (DATETIME), padrao a data atual
- Obrigatorio
- Momento do cadastro
```

### TABELA: projetos

```
id
- Tipo: inteiro (INT), incrementado automaticamente
- Chave primaria
- Identificador unico do projeto

nome
- Tipo: texto (VARCHAR 120)
- Obrigatorio
- Unico
- Nome do projeto

descricao
- Tipo: texto longo (TEXT)
- Opcional
- Explicacao do que e o projeto

ativo
- Tipo: inteiro pequeno (TINYINT), padrao 1
- Obrigatorio
- Permite encerrar um projeto sem apagar o registro

criado_em
- Tipo: data e hora (DATETIME), padrao a data atual
- Obrigatorio
- Momento do cadastro
```

### TABELA: projeto_usuarios

Tabela de ligacao. Define quais projetos cada usuario enxerga.

```
projeto_id
- Tipo: inteiro (INT)
- Chave primaria (junto com usuario_id)
- Chave estrangeira para projetos.id

usuario_id
- Tipo: inteiro (INT)
- Chave primaria (junto com projeto_id)
- Chave estrangeira para usuarios.id

vinculado_em
- Tipo: data e hora (DATETIME), padrao a data atual
- Obrigatorio
- Momento em que o usuario entrou no projeto
```

### TABELA: demandas

Entidade principal do sistema.

```
id
- Tipo: inteiro (INT), incrementado automaticamente
- Chave primaria
- Numero da demanda, exibido nas telas

titulo
- Tipo: texto (VARCHAR 150)
- Obrigatorio
- Resumo da demanda em uma frase

descricao
- Tipo: texto longo (TEXT)
- Obrigatorio
- Explicacao detalhada

tipo
- Tipo: ENUM('TAREFA', 'DEFEITO', 'MELHORIA', 'DOCUMENTACAO')
- Obrigatorio
- Natureza da atividade

prioridade
- Tipo: ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')
- Obrigatorio
- Urgencia da demanda.
  A ordem de declaracao vai da menor para a maior urgencia,
  o que permite ordenar pela coluna sem calculo adicional

status
- Tipo: ENUM('ABERTA', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA', 'CANCELADA')
- Obrigatorio
- Padrao: ABERTA
- Situacao atual no fluxo de trabalho.
  A ordem de declaracao segue o fluxo de trabalho

projeto_id
- Tipo: inteiro (INT)
- Obrigatorio
- Chave estrangeira para projetos.id
- Projeto ao qual a demanda pertence

responsavel_id
- Tipo: inteiro (INT)
- Opcional
- Chave estrangeira para usuarios.id
- Quem vai executar a demanda.
  Pode ficar vazio na criacao e ser atribuido depois

criado_por_id
- Tipo: inteiro (INT)
- Obrigatorio
- Chave estrangeira para usuarios.id
- Quem cadastrou a demanda

prazo_finalizacao
- Tipo: data (DATE)
- Opcional
- Data prevista para conclusao.
  Conferida contra os feriados nacionais antes de ser gravada

criado_em
- Tipo: data e hora (DATETIME), padrao a data atual
- Obrigatorio
- Preenchido automaticamente no cadastro

atualizado_em
- Tipo: data e hora (DATETIME)
- Obrigatorio
- Padrao a data atual, com ON UPDATE CURRENT_TIMESTAMP.
  O proprio MySQL atualiza esta coluna sempre que a linha muda,
  sem que o programa precise fazer nada
```

### TABELA: comentarios

```
id
- Tipo: inteiro (INT), incrementado automaticamente
- Chave primaria

demanda_id
- Tipo: inteiro (INT)
- Obrigatorio
- Chave estrangeira para demandas.id

usuario_id
- Tipo: inteiro (INT)
- Obrigatorio
- Chave estrangeira para usuarios.id
- Quem escreveu o comentario

texto
- Tipo: texto longo (TEXT)
- Obrigatorio
- Conteudo do comentario

criado_em
- Tipo: data e hora (DATETIME), padrao a data atual
- Obrigatorio
- Data e hora do registro, exigidas pelo Documento de Visao
```

### TABELA: historico_alteracoes

```
id
- Tipo: inteiro (INT), incrementado automaticamente
- Chave primaria

demanda_id
- Tipo: inteiro (INT)
- Obrigatorio
- Chave estrangeira para demandas.id

usuario_id
- Tipo: inteiro (INT)
- Obrigatorio
- Chave estrangeira para usuarios.id
- Quem fez a alteracao

campo_alterado
- Tipo: texto (VARCHAR 60)
- Obrigatorio
- Nome do campo que mudou: status, responsavel, prioridade,
  tipo, prazo ou criacao

valor_anterior
- Tipo: texto (VARCHAR 255)
- Opcional
- Valor antes da mudanca. Vazio significa que o campo
  nao tinha valor antes

valor_novo
- Tipo: texto (VARCHAR 255)
- Opcional
- Valor depois da mudanca

criado_em
- Tipo: data e hora (DATETIME), padrao a data atual
- Obrigatorio
- Momento da alteracao
```

---

## 6. Indices

Indices aceleram as consultas que filtram ou ordenam por uma coluna.

| Indice | Coluna | Para que serve |
|---|---|---|
| `ix_demandas_status` | demandas.status | Filtro por status e contagens do dashboard |
| `ix_demandas_prioridade` | demandas.prioridade | Filtro e ordenacao por prioridade |
| `ix_demandas_tipo` | demandas.tipo | Filtro por tipo |
| `ix_demandas_projeto` | demandas.projeto_id | Filtro por projeto e permissoes |
| `ix_demandas_responsavel` | demandas.responsavel_id | Filtro por responsavel |
| `ix_demandas_prazo` | demandas.prazo_finalizacao | Ordenacao por prazo e alerta do dashboard |
| `ix_comentarios_demanda` | comentarios.demanda_id | Busca dos comentarios de uma demanda |
| `ix_historico_demanda` | historico_alteracoes.demanda_id | Busca do historico de uma demanda |

---

## 7. Decisoes de modelagem

### 7.1 Por que ENUM e nao uma tabela separada

Status, prioridade, tipo e perfil poderiam ser tabelas com chave
estrangeira. A equipe usou ENUM porque:

- os valores sao fixos e definidos pelo Documento de Visao. Nao ha
  previsao de o usuario cadastrar um novo status;
- o proprio banco recusa um valor invalido, o que e uma protecao a mais;
- a consulta fica mais simples de ler, sem um JOIN a cada campo;
- a ordem de declaracao do ENUM serve para ordenar. Como prioridade foi
  declarada de BAIXA para CRITICA, `ORDER BY prioridade DESC` ja coloca
  as criticas no topo.

Se no futuro os status passarem a ser configuraveis pelo usuario, o ENUM
deixa de servir e uma tabela separada passa a ser a escolha correta.

### 7.2 Por que nao existe exclusao

O Documento de Visao (item 2.2.8) proibe a exclusao fisica de demandas.
O sistema aplica essa regra em tres niveis:

1. Nao existe rota DELETE na API.
2. Cancelar e mudar o status para CANCELADA.
3. O usuario de banco criado em `03_criar_usuario_do_sistema.sql` nao
   recebe permissao de DELETE. Mesmo que alguem escrevesse um comando de
   exclusao por engano, o proprio banco recusaria.

### 7.3 Por que dateStrings na conexao

O driver mysql2 foi configurado com `dateStrings: true`. Sem essa opcao,
o JavaScript converteria as datas para o fuso horario da maquina, e o
prazo gravado como 16 de setembro poderia aparecer como 15 de setembro
na tela.

### 7.4 Por que o historico guarda texto e nao codigo

A coluna `valor_anterior` guarda "Em andamento", e nao "EM_ANDAMENTO".
Assim a tela exibe o historico sem precisar traduzir nada, e o registro
continua legivel mesmo que os nomes dos status mudem no futuro.

---

## 8. Como criar o banco

A partir da pasta raiz do projeto:

```
mysql -u root -p < banco/01_criar_tabelas.sql
mysql -u root -p < banco/02_inserir_dados_iniciais.sql
```

O script `01` pode ser executado novamente a qualquer momento: ele apaga
as tabelas antes de recria-las. Isso apaga todos os dados, entao so deve
ser usado durante o desenvolvimento.

O script `03_criar_usuario_do_sistema.sql` e opcional e cria um usuario
de banco com permissoes limitadas.

---

## 9. Consultas usadas no sistema

Exemplo do dashboard, contagem por status:

```sql
SELECT demandas.status AS chave, COUNT(*) AS quantidade
  FROM demandas
 WHERE demandas.projeto_id IN (
         SELECT projeto_id FROM projeto_usuarios WHERE usuario_id = ?
       )
 GROUP BY demandas.status;
```

A subconsulta limita o resultado aos projetos do usuario. Para o
administrador, essa condicao e trocada por `1 = 1`, que nao restringe
nada.

Exemplo da listagem, com JOIN:

```sql
SELECT demandas.id,
       demandas.titulo,
       projetos.nome     AS projeto_nome,
       responsavel.nome  AS responsavel_nome
  FROM demandas
 INNER JOIN projetos
         ON projetos.id = demandas.projeto_id
  LEFT JOIN usuarios AS responsavel
         ON responsavel.id = demandas.responsavel_id
 WHERE demandas.status = ?;
```

O `INNER JOIN` com projetos so traz demandas que tem projeto, o que
sempre acontece porque o campo e obrigatorio.

O `LEFT JOIN` com usuarios traz a demanda mesmo quando ela ainda nao tem
responsavel. Se fosse `INNER JOIN`, as demandas sem responsavel
desapareceriam da listagem.
