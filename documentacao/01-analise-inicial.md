# 01 - Analise inicial do projeto

Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues

Documento escrito antes do inicio do desenvolvimento, conforme a etapa de
analise prevista no planejamento do trabalho.

---

## 1. Ponto de partida

O repositorio da equipe estava vazio no momento da analise. Nao havia
frontend, backend, banco de dados, arquivos de configuracao nem
documentacao. O projeto foi construido do zero.

Isso significa que nao houve tecnologia anterior a ser mantida ou
substituida, e nenhuma escolha tecnica precisou ser revertida.

| Item | Situacao encontrada |
|---|---|
| Frontend | Nao existia |
| Backend | Nao existia |
| Banco de dados | Nao existia |
| API | Nao existia |
| Autenticacao | Nao existia |
| Sistema de usuarios | Nao existia |
| Arquivos de configuracao | Nao existiam |
| Documentacao | Nao existia |

---

## 2. Fontes usadas na analise

Tres documentos definiram o que precisava ser construido:

**Documento de Visao (Documento_Escopo_PI_II)**  
Define o sistema, os perfis de usuario, as entidades, o ciclo de vida da
demanda, as funcionalidades obrigatorias e as tecnologias exigidas.

**Reuniao 2 (Projeto_Integrador_II_Reuniao_2)**  
Define a etapa atual: cinco telas em HTML e CSS, uma por integrante, com
padrao visual unico, autoria individual identificavel no Git e registro
das atividades no GitHub Projects.

**Plano de Ensino**  
Define o contexto academico do componente curricular.

---

## 3. O que o Documento de Visao exige

Exigencias que nao podem ser negociadas:

- Backend em Node.js LTS com TypeScript.
- Frontend em HTML5, CSS3 e JavaScript. Bootstrap e opcional.
- Banco de dados relacional: MySQL ou Oracle.
- Git, GitHub e GitHub Projects.
- No minimo tres perfis: Administrador, Lider de Projeto e Membro da Equipe.
- Quatro tipos de demanda: Tarefa, Defeito, Melhoria e Documentacao.
- Quatro prioridades: Critica, Alta, Media e Baixa.
- Cinco status: Aberta, Em andamento, Em revisao, Concluida e Cancelada.
- Toda demanda nasce com o status Aberta.
- Uma demanda nao vai de Em andamento direto para Concluida.
- Uma demanda nao volta de Em andamento para Aberta.
- Proibida a exclusao fisica de registros no banco.
- Comentarios vinculados a demanda e a um usuario, com data e hora.
- Historico automatico de alteracoes, que nunca e apagado.
- Filtros por no minimo dois criterios, mais busca textual e ordenacao.
- Dashboard com dez informacoes minimas.
- Uso obrigatorio de uma API externa para verificar se o prazo de
  finalizacao cai em um feriado nacional.
- README.md na raiz do repositorio.
- Comentarios explicativos no codigo e identificacao do autor no topo de
  cada arquivo.

---

## 4. Decisoes tomadas na analise

### 4.1 Banco de dados: MySQL

O Documento de Visao permite apenas MySQL ou Oracle. Entre os dois, a
equipe escolheu MySQL porque a instalacao e simples nos tres sistemas
operacionais, a documentacao e farta em portugues, e nao exige licenca.

O Oracle atenderia a exigencia, mas a instalacao e mais pesada e o
aprendizado necessario seria maior sem trazer nenhum ganho para um
sistema deste tamanho.

Bancos como SQLite, PostgreSQL ou MongoDB nao foram considerados porque
o documento nao os permite.

A analise que confirma a necessidade de um banco relacional esta em
`03-banco-de-dados.md`.

### 4.2 Sem Bootstrap

O Documento de Visao recomenda o Bootstrap, mas nao o torna obrigatorio.
A equipe optou por CSS proprio. O motivo esta explicado em
`02-tecnologias.md`.

### 4.3 Sem framework de frontend

React, Vue e Angular nao foram usados. O documento pede HTML, CSS e
JavaScript, e o sistema tem cinco telas. Um framework acrescentaria uma
etapa de compilacao e um conjunto de conceitos que nao sao necessarios
para o tamanho do projeto.

### 4.4 Sem ORM no backend

Ferramentas como Prisma ou TypeORM escrevem o SQL no lugar do
programador. Como o projeto tambem serve para exercitar o conteudo de
banco de dados, as consultas foram escritas em SQL, usando o driver
mysql2 com consultas parametrizadas.

### 4.5 Frontend servido pelo backend

O Express entrega os arquivos do frontend. Assim um unico comando
(`npm run dev`) coloca o sistema inteiro no ar, o que reduz o risco de
problemas na apresentacao para a banca.

---

## 5. Ordem de desenvolvimento adotada

A ordem seguiu a dependencia entre as partes: nada foi construido antes
daquilo de que precisava.

1. Banco de dados: tabelas, relacionamentos e dados de teste.
2. Configuracao do backend: leitura do `.env` e conexao com o MySQL.
3. Autenticacao: senha em hash, token e middleware de login.
4. Regras de negocio: permissoes por perfil e ciclo de vida da demanda.
5. Rotas de demandas: listagem, detalhes, cadastro, edicao e status.
6. Comentarios e historico.
7. Dashboard.
8. Integracao com a API externa de feriados.
9. Padrao visual: paleta de cores, componentes e estrutura de pagina.
10. As cinco telas, uma por integrante.
11. Testes de ponta a ponta.
12. Documentacao.

Cada etapa foi testada antes do inicio da seguinte.

---

## 6. Riscos identificados no inicio

| Risco | Como foi tratado |
|---|---|
| API externa de feriados fora do ar | O sistema avisa o usuario em linguagem simples e nao grava um prazo que nao pode ser conferido. As datas ja consultadas ficam guardadas na memoria do servidor. |
| Regras de status espalhadas pelo codigo | Todas as regras de transicao ficaram em um unico arquivo: `servicos/regrasDeStatus.ts`. |
| Permissao conferida so na tela | Toda permissao e conferida no backend. Esconder botoes serve apenas para deixar a tela mais clara. |
| Perda do historico ao cancelar demanda | O cancelamento e uma mudanca de status. Nenhum registro e apagado, e o banco da aplicacao nem sequer recebe permissao de DELETE. |
| Autoria individual nao identificavel | Cada arquivo tem um unico autor, declarado no topo. |
