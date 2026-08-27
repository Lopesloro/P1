# Sistema de Acompanhamento de Demandas de Desenvolvimento

Autor exclusivo deste arquivo: Eduardo Martins Colmati

Projeto Integrador II - Curso de Engenharia de Software  
Pontificia Universidade Catolica de Campinas - 2026  
Equipe: PI-II-TIME-11

---

## AVISO IMPORTANTE SOBRE O NOME DO REPOSITORIO

O Documento de Visao (item 4.1) exige que o repositorio se chame
exatamente `PI-II-TIME-11`, em letras maiusculas, igual ao nome do time no
CANVAS. O repositorio atual ainda se chama `P1`.

Renomear o repositorio precisa ser feito no proprio GitHub, por um membro
com permissao de administrador:

```
Repositorio > Settings > General > Repository name > PI-II-TIME-11 > Rename
```

Enquanto isso nao for feito, a equipe fica sujeita a penalidade de 1,0
ponto na nota final de todos os integrantes.

---

## 1. Sobre o projeto

### O que e

Sistema web para registrar e acompanhar as demandas de desenvolvimento de
um projeto de software. Uma demanda pode ser uma tarefa, um defeito, uma
melhoria ou uma atividade de documentacao.

### Qual problema resolve

Equipes de desenvolvimento precisam saber, a qualquer momento, o que
esta sendo feito, por quem, com qual urgencia e ate quando. Sem uma
ferramenta, essa informacao fica espalhada em conversas, planilhas e
mensagens, e se perde.

O sistema reune essas informacoes em um unico lugar e registra
automaticamente o historico de tudo o que mudou em cada demanda.

### O que o sistema faz

- Login com tres perfis de acesso: Administrador, Lider de Projeto e
  Membro da Equipe.
- Cadastro, consulta, edicao e cancelamento de demandas.
- Controle do ciclo de vida da demanda, com regras de transicao de status.
- Filtros, busca por texto e ordenacao na listagem.
- Comentarios em cada demanda.
- Historico automatico de alteracoes, que nunca e apagado.
- Dashboard com o resumo das demandas.
- Verificacao do prazo de finalizacao contra os feriados nacionais,
  usando uma API externa.

Demandas nunca sao apagadas do banco de dados. Quando deixam de ser
necessarias, recebem o status Cancelada.

---

## 2. Equipe e divisao do trabalho

Cada integrante ficou responsavel por uma tela do sistema e pelos
arquivos de backend correspondentes. O nome do autor exclusivo esta
escrito no topo de cada arquivo do projeto.

| Integrante | Tela sob responsabilidade |
|---|---|
| Eduardo Martins Colmati | Tela de Login e autenticacao |
| Jose Gabriel Bedani | Dashboard e padrao visual |
| Enzo Carleti Teixeira | Listagem de Demandas, filtros e busca |
| Gustavo de Oliveira de Santana | Cadastro/Edicao de Demanda e banco de dados |
| Gabriel Lopes Londe Rodrigues | Detalhes da Demanda, comentarios e historico |

A lista completa de arquivos por autor esta em
`documentacao/09-divisao-de-tarefas.md`.

---

## 3. Tecnologias utilizadas

| Tecnologia | Para que serve | Onde e usada |
|---|---|---|
| Node.js (LTS) | Executa o codigo JavaScript no servidor | Backend |
| TypeScript | JavaScript com verificacao de tipos, que aponta erros antes de executar | Backend |
| Express | Biblioteca que recebe as requisicoes HTTP e organiza as rotas da API | `backend/src/rotas` |
| MySQL 8 | Banco de dados relacional onde ficam guardados usuarios, projetos e demandas | `banco/` |
| mysql2 | Driver que conecta o Node.js ao MySQL | `backend/src/configuracao/banco.ts` |
| bcryptjs | Transforma as senhas em hash, para nunca guarda-las em texto puro | `backend/src/servicos/senhas.ts` |
| jsonwebtoken | Gera e confere o token de login | `backend/src/servicos/token.ts` |
| dotenv | Le as senhas e chaves do arquivo `.env`, mantendo-as fora do codigo | `backend/src/configuracao/ambiente.ts` |
| cors | Permite que o navegador chame a API | `backend/src/servidor.ts` |
| tsx | Executa TypeScript direto, sem precisar compilar a cada alteracao | Ambiente de desenvolvimento |
| HTML5, CSS3 e JavaScript | Constroem as telas do sistema | `frontend/` |
| BrasilAPI | API externa que informa os feriados nacionais | `backend/src/servicos/feriados.ts` |

A justificativa de cada escolha esta em
`documentacao/02-tecnologias.md`.

O frontend foi feito com HTML, CSS e JavaScript puros, sem Bootstrap e
sem nenhuma biblioteca de interface. O motivo esta explicado no
documento de tecnologias.

---

## 4. Requisitos para executar

- Node.js na versao LTS vigente (versao 20 ou superior).
- npm (instalado junto com o Node.js).
- MySQL 8 instalado e em execucao.
- Um editor de codigo: Visual Studio Code ou JetBrains WebStorm.
- Acesso a internet, usado apenas pela verificacao de feriados nacionais.

Para conferir se o Node.js e o npm estao instalados:

```
node -v
npm -v
```

---

## 5. Instalacao passo a passo

### Passo 1 - Baixar o projeto

```
git clone https://github.com/Lopesloro/P1.git
cd P1
```

### Passo 2 - Criar o banco de dados

Rode os scripts na ordem, a partir da pasta raiz do projeto:

```
mysql -u root -p < banco/01_criar_tabelas.sql
mysql -u root -p < banco/02_inserir_dados_iniciais.sql
```

O primeiro script cria o banco `acompanhamento_demandas` e todas as
tabelas. O segundo insere os usuarios, os projetos e as demandas usados
para teste.

Se o usuario root do seu MySQL nao aceitar conexao com senha, rode
tambem o terceiro script, que cria um usuario proprio para a aplicacao.
Abra o arquivo antes e troque a senha de exemplo:

```
mysql -u root -p < banco/03_criar_usuario_do_sistema.sql
```

### Passo 3 - Instalar as dependencias do backend

```
cd backend
npm install
```

### Passo 4 - Configurar as variaveis de ambiente

Ainda dentro da pasta `backend`, copie o arquivo de exemplo:

```
cp .env.example .env
```

No Windows:

```
copy .env.example .env
```

Abra o arquivo `.env` e preencha:

```
BANCO_USUARIO=root
BANCO_SENHA=a_senha_do_seu_mysql
CHAVE_SECRETA_TOKEN=um_texto_longo_e_aleatorio_qualquer
```

O arquivo `.env` guarda senhas e nao e enviado ao GitHub. Ele ja esta
listado no `.gitignore`.

### Passo 5 - Executar o sistema

```
npm run dev
```

O terminal deve mostrar:

```
[banco] Conexao com o MySQL estabelecida.
[servidor] Sistema disponivel em http://localhost:3000
```

Abra `http://localhost:3000` no navegador.

O mesmo servidor entrega a API e as telas, entao um unico comando coloca
o sistema inteiro no ar.

---

## 6. Usuarios para teste

Os usuarios abaixo sao criados pelo script
`banco/02_inserir_dados_iniciais.sql`.

| E-mail | Senha | Perfil |
|---|---|---|
| eduardo@time11.com | admin123 | Administrador |
| jose@time11.com | lider123 | Lider de Projeto |
| enzo@time11.com | lider123 | Lider de Projeto |
| gustavo@time11.com | membro123 | Membro da Equipe |
| gabriel@time11.com | membro123 | Membro da Equipe |

Estas senhas existem apenas para o ambiente de teste do projeto
academico. Em um sistema real elas seriam definidas por cada usuario.

---

## 7. Estrutura do projeto

```
P1/
|
+-- banco/                      Scripts SQL do banco de dados
|   +-- 01_criar_tabelas.sql          Cria o banco e as tabelas
|   +-- 02_inserir_dados_iniciais.sql Insere dados para teste
|   +-- 03_criar_usuario_do_sistema.sql Cria um usuario de banco (opcional)
|
+-- backend/                    API em Node.js com TypeScript
|   +-- src/
|   |   +-- servidor.ts               Ponto de partida do sistema
|   |   +-- configuracao/             Leitura do .env e conexao com o banco
|   |   +-- rotas/                    Lista de todos os enderecos da API
|   |   +-- controladores/            Funcoes que respondem a cada rota
|   |   +-- servicos/                 Regras de negocio e integracoes
|   |   +-- middlewares/              Autenticacao e tratamento de erros
|   |   +-- tipos/                    Tipos usados em todo o backend
|   +-- .env.example                  Modelo de configuracao, sem senhas
|   +-- package.json
|
+-- frontend/                   Telas em HTML, CSS e JavaScript
|   +-- index.html                    Tela de Login
|   +-- paginas/                      Demais telas do sistema
|   +-- estilos/                      Arquivos CSS
|   +-- scripts/                      Arquivos JavaScript
|
+-- documentacao/               Documentacao completa do projeto
+-- README.md
+-- .gitignore
```

Explicacao das pastas principais:

- `banco` reune tudo que cria e alimenta o banco de dados.
- `backend/src/rotas` diz quais enderecos existem e quem pode acessar cada um.
- `backend/src/controladores` recebe a requisicao, conversa com o banco e
  devolve a resposta.
- `backend/src/servicos` guarda as regras que nao dependem de HTTP, como
  o ciclo de vida da demanda e a consulta de feriados. Sao as regras mais
  importantes do sistema.
- `backend/src/middlewares` roda antes dos controladores, conferindo o
  login e tratando os erros.
- `frontend/estilos` e `frontend/scripts` sao divididos por tela, mais os
  arquivos comuns a todas elas.

---

## 8. Banco de dados

Banco escolhido: MySQL 8.

O sistema tem seis tabelas com relacionamentos entre elas: usuarios,
projetos, projeto_usuarios, demandas, comentarios e historico_alteracoes.

O modelo completo, com todos os campos, tipos, chaves e relacionamentos,
esta documentado em `documentacao/03-banco-de-dados.md`.

---

## 9. Funcionalidades concluidas

Autenticacao e acesso:

- Login com e-mail e senha, com senha guardada em hash.
- Opcao "Lembrar-me", que mantem a sessao apos fechar o navegador.
- Tres perfis de acesso com permissoes diferentes.
- Protecao de todas as rotas internas.
- Encerramento automatico da sessao quando o token expira.

Demandas:

- Cadastro de demanda, sempre iniciando no status Aberta.
- Listagem com as informacoes principais.
- Detalhes completos da demanda.
- Edicao dos dados da demanda.
- Mudanca de status seguindo o ciclo de vida.
- Cancelamento, sem exclusao fisica do registro.

Filtros e busca:

- Filtros por status, prioridade, tipo, projeto e responsavel.
- Busca por texto no titulo e na descricao.
- Ordenacao por prioridade, prazo, data de criacao, status e titulo.
- Filtros preservados no endereco da pagina.

Comentarios e historico:

- Registro de comentarios com autor, data e hora.
- Historico automatico das alteracoes de status, responsavel,
  prioridade, tipo e prazo.
- Historico preservado mesmo apos o cancelamento da demanda.

Dashboard:

- Total de demandas e total por status.
- Distribuicao por prioridade e por tipo.
- Demandas criticas em aberto.
- Demandas proximas do prazo de finalizacao.

Integracao externa:

- Verificacao do prazo contra os feriados nacionais, com aviso na tela
  e bloqueio da gravacao no servidor.

Interface:

- Padrao visual unico nas cinco telas.
- Funcionamento em computador, tablet e celular.
- Mensagens de erro escritas em linguagem simples.

---

## 10. API

A API responde no endereco `http://localhost:3000/api`.

Resumo das rotas:

| Metodo | Endereco | Para que serve |
|---|---|---|
| POST | `/api/autenticacao/login` | Entrar no sistema |
| GET | `/api/autenticacao/eu` | Conferir a sessao |
| GET | `/api/demandas` | Listar demandas com filtros |
| GET | `/api/demandas/:id` | Detalhes, comentarios e historico |
| POST | `/api/demandas` | Cadastrar demanda |
| PUT | `/api/demandas/:id` | Editar demanda |
| PATCH | `/api/demandas/:id/status` | Mudar status ou cancelar |
| POST | `/api/demandas/:id/comentarios` | Registrar comentario |
| GET | `/api/dashboard` | Numeros do dashboard |
| GET | `/api/projetos` | Listar projetos |
| GET | `/api/usuarios` | Listar usuarios |
| GET | `/api/feriados/verificar` | Conferir se uma data e feriado |

A documentacao completa, com os dados enviados, as respostas e os erros
possiveis de cada rota, esta em `documentacao/04-api.md`.

Nao existe rota DELETE para demandas, porque o Documento de Visao proibe
a exclusao fisica dos registros.

---

## 11. Documentacao completa

| Arquivo | Conteudo |
|---|---|
| `documentacao/01-analise-inicial.md` | Analise do ponto de partida e ordem de desenvolvimento |
| `documentacao/02-tecnologias.md` | Cada tecnologia e o motivo da escolha |
| `documentacao/03-banco-de-dados.md` | Modelo de dados completo |
| `documentacao/04-api.md` | Todas as rotas da API |
| `documentacao/05-regras-de-negocio.md` | Perfis, permissoes e ciclo de vida |
| `documentacao/06-api-externa-feriados.md` | Integracao com a API de feriados |
| `documentacao/07-design-e-interface.md` | Paleta de cores e padrao visual |
| `documentacao/08-testes.md` | Testes realizados e problemas corrigidos |
| `documentacao/09-divisao-de-tarefas.md` | Autoria de cada arquivo |

---

## 12. Solucao de problemas

**"Nao foi possivel conectar ao MySQL"**  
O servico do MySQL nao esta ligado ou os dados do `.env` estao errados.
Confira `BANCO_USUARIO` e `BANCO_SENHA`. Se o root nao aceitar conexao
com senha, rode `banco/03_criar_usuario_do_sistema.sql`.

**"A variavel de ambiente ... nao foi definida"**  
O arquivo `.env` nao foi criado. Volte ao Passo 4 da instalacao.

**"Nao foi possivel verificar os feriados nacionais no momento"**  
A maquina esta sem acesso a internet ou a BrasilAPI esta fora do ar.
O cadastro de demandas sem prazo continua funcionando normalmente.

**Table 'acompanhamento_demandas.usuarios' doesn't exist**  
Os scripts do banco nao foram executados. Volte ao Passo 2.

**A porta 3000 ja esta em uso**  
Altere o valor de `PORTA` no arquivo `.env`.
