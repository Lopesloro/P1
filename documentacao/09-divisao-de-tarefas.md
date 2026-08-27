# 09 - Divisao de tarefas e autoria

Autor exclusivo deste arquivo: Enzo Carleti Teixeira

Registro da responsabilidade de cada integrante e da autoria de cada
arquivo do projeto.

O Documento de Visao (item 4.5) exige que cada arquivo tenha, no topo, a
identificacao do autor exclusivo. A Reuniao 2 exige que a participacao
individual seja evidente. Este documento reune essa informacao em um
unico lugar.

---

## 1. Responsabilidade por tela

Distribuicao seguindo a sugestao da Reuniao 2, item 3.

| # | Integrante | Tela | Area do backend |
|---|---|---|---|
| 1 | Eduardo Martins Colmati | Tela de Login | Autenticacao, permissoes e servidor |
| 2 | Jose Gabriel Bedani | Dashboard | Dashboard e listas de apoio |
| 3 | Enzo Carleti Teixeira | Listagem de Demandas | Listagem, filtros, rotas e tratamento de erros |
| 4 | Gustavo de Oliveira de Santana | Cadastro/Edicao de Demanda | Cadastro, ciclo de vida, feriados e banco de dados |
| 5 | Gabriel Lopes Londe Rodrigues | Detalhes da Demanda | Comentarios, historico e comunicacao com a API |

Cada integrante ficou responsavel pela tela inteira: o HTML, o CSS
proprio dela, o JavaScript e as rotas de backend que ela consome. Assim
a contribuicao de cada um pode ser demonstrada de ponta a ponta, e nao
apenas na parte visual.

---

## 2. Autoria de cada arquivo

### Eduardo Martins Colmati

Tela de Login, autenticacao e configuracao do sistema.

| Arquivo | Conteudo |
|---|---|
| `frontend/index.html` | Tela de Login |
| `frontend/estilos/login.css` | Estilos da tela de Login |
| `frontend/scripts/login.js` | Validacao e envio do formulario de login |
| `frontend/scripts/sessao.js` | Controle da sessao e montagem do cabecalho |
| `backend/src/servidor.ts` | Ponto de partida do sistema |
| `backend/src/configuracao/ambiente.ts` | Leitura das variaveis de ambiente |
| `backend/src/configuracao/banco.ts` | Conexao com o MySQL |
| `backend/src/tipos/index.ts` | Tipos usados em todo o backend |
| `backend/src/servicos/senhas.ts` | Hash e conferencia de senha |
| `backend/src/servicos/token.ts` | Geracao e leitura do token |
| `backend/src/servicos/permissoes.ts` | Regras de permissao por perfil |
| `backend/src/middlewares/autenticacao.ts` | Middleware de login e de perfil |
| `backend/src/controladores/autenticacaoControlador.ts` | Rotas de login e sessao |
| `backend/tsconfig.json` | Configuracao do TypeScript |
| `backend/package.json` | Dependencias e comandos do projeto |
| `backend/.env.example` | Modelo de configuracao |
| `README.md` | Documentacao principal do repositorio |

### Jose Gabriel Bedani

Dashboard e padrao visual do grupo.

| Arquivo | Conteudo |
|---|---|
| `frontend/paginas/dashboard.html` | Tela de Dashboard |
| `frontend/estilos/dashboard.css` | Estilos do Dashboard |
| `frontend/scripts/dashboard.js` | Montagem dos cartoes, barras e listas |
| `frontend/estilos/base.css` | Padrao visual: cores, tipografia e estrutura |
| `frontend/favicon.svg` | Icone da aba do navegador |
| `backend/src/controladores/dashboardControlador.ts` | Numeros do dashboard |
| `backend/src/controladores/apoioControlador.ts` | Listas de projetos e usuarios |
| `documentacao/07-design-e-interface.md` | Documentacao do padrao visual |

### Enzo Carleti Teixeira

Listagem, filtros e organizacao das rotas.

| Arquivo | Conteudo |
|---|---|
| `frontend/paginas/demandas.html` | Tela de Listagem |
| `frontend/estilos/demandas.css` | Estilos da Listagem |
| `frontend/scripts/demandas.js` | Filtros, busca e montagem da tabela |
| `frontend/estilos/componentes.css` | Botoes, campos, cards, tabelas e etiquetas |
| `frontend/scripts/formatacao.js` | Formatacao de datas e etiquetas |
| `backend/src/controladores/demandasListagemControlador.ts` | Listagem com filtros e ordenacao |
| `backend/src/rotas/index.ts` | Mapa de todas as rotas da API |
| `backend/src/middlewares/tratarErros.ts` | Tratamento central de erros |
| `documentacao/04-api.md` | Documentacao da API |
| `documentacao/09-divisao-de-tarefas.md` | Este documento |

### Gustavo de Oliveira de Santana

Cadastro, ciclo de vida da demanda e banco de dados.

| Arquivo | Conteudo |
|---|---|
| `frontend/paginas/demanda-formulario.html` | Tela de Cadastro e Edicao |
| `frontend/estilos/formulario.css` | Estilos do formulario |
| `frontend/scripts/demanda-formulario.js` | Validacao, cadastro e edicao |
| `backend/src/controladores/demandasCadastroControlador.ts` | Cadastro, edicao e mudanca de status |
| `backend/src/controladores/feriadosControlador.ts` | Rota de consulta de feriado |
| `backend/src/servicos/regrasDeStatus.ts` | Regras do ciclo de vida da demanda |
| `backend/src/servicos/feriados.ts` | Integracao com a API externa |
| `banco/01_criar_tabelas.sql` | Criacao do banco e das tabelas |
| `banco/02_inserir_dados_iniciais.sql` | Dados de teste |
| `banco/03_criar_usuario_do_sistema.sql` | Usuario de banco da aplicacao |
| `documentacao/03-banco-de-dados.md` | Documentacao do banco |
| `documentacao/05-regras-de-negocio.md` | Documentacao das regras |
| `documentacao/06-api-externa-feriados.md` | Documentacao da integracao externa |

### Gabriel Lopes Londe Rodrigues

Detalhes da demanda, comentarios, historico e testes.

| Arquivo | Conteudo |
|---|---|
| `frontend/paginas/demanda-detalhes.html` | Tela de Detalhes |
| `frontend/estilos/detalhes.css` | Estilos da tela de Detalhes |
| `frontend/scripts/demanda-detalhes.js` | Acoes de status, comentarios e historico |
| `frontend/scripts/api.js` | Comunicacao entre as telas e a API |
| `backend/src/controladores/demandasDetalhesControlador.ts` | Detalhes, comentarios e historico |
| `backend/src/controladores/comentariosControlador.ts` | Registro de comentarios |
| `backend/src/servicos/historico.ts` | Gravacao do historico de alteracoes |
| `backend/src/servicos/rotulos.ts` | Traducao dos valores do banco para a tela |
| `testes/testar-api.sh` | Teste automatizado da API |
| `testes/testar-telas.js` | Teste automatizado das telas |
| `.gitignore` | Arquivos que nao vao para o GitHub |
| `documentacao/01-analise-inicial.md` | Analise inicial do projeto |
| `documentacao/02-tecnologias.md` | Documentacao das tecnologias |
| `documentacao/08-testes.md` | Documentacao dos testes |

---

## 3. Resumo por integrante

| Integrante | Arquivos |
|---|---|
| Eduardo Martins Colmati | 17 |
| Gabriel Lopes Londe Rodrigues | 14 |
| Gustavo de Oliveira de Santana | 13 |
| Enzo Carleti Teixeira | 10 |
| Jose Gabriel Bedani | 8 |

---

## 4. Arquivos compartilhados

Alguns arquivos sao usados por todas as telas, mas cada um tem um unico
autor, conforme o Documento de Visao exige.

| Arquivo | Autor | Por que ficou com esse integrante |
|---|---|---|
| `frontend/estilos/base.css` | Jose Gabriel Bedani | Define o padrao visual do grupo, tema do trabalho dele |
| `frontend/estilos/componentes.css` | Enzo Carleti Teixeira | Os componentes mais complexos, tabela e etiquetas, sao da tela dele |
| `frontend/scripts/api.js` | Gabriel Lopes Londe Rodrigues | A tela de detalhes e a que mais usa rotas diferentes |
| `frontend/scripts/sessao.js` | Eduardo Martins Colmati | Sessao e cabecalho pertencem a area de autenticacao |
| `frontend/scripts/formatacao.js` | Enzo Carleti Teixeira | A formatacao de datas e etiquetas nasceu na tela de listagem |
| `backend/src/rotas/index.ts` | Enzo Carleti Teixeira | Organizacao geral das rotas |
| `backend/src/tipos/index.ts` | Eduardo Martins Colmati | Criado junto com a configuracao inicial do backend |

---

## 5. Uso do Git e do GitHub

Conforme a Reuniao 2, itens 5 e 6:

- O desenvolvimento acontece em branch propria, e nao diretamente na
  branch principal.
- Cada integrante faz seus proprios commits, com mensagens que
  identificam o que foi desenvolvido.
- A autoria individual fica registrada no historico do GitHub.
- As atividades sao registradas no GitHub Projects, com responsavel,
  status e tempo gasto.

### Cards sugeridos para o GitHub Projects

Um card por integrante, conforme os exemplos da Reuniao 2:

| Card | Responsavel |
|---|---|
| Desenvolver tela de Login em HTML/CSS | Eduardo Martins Colmati |
| Desenvolver Dashboard em HTML/CSS | Jose Gabriel Bedani |
| Desenvolver Listagem de Demandas em HTML/CSS | Enzo Carleti Teixeira |
| Desenvolver Cadastro/Edicao de Demanda em HTML/CSS | Gustavo de Oliveira de Santana |
| Desenvolver Detalhes da Demanda em HTML/CSS | Gabriel Lopes Londe Rodrigues |

Cards das demais etapas do projeto:

| Card | Responsavel |
|---|---|
| Definir padrao visual do grupo | Jose Gabriel Bedani |
| Modelar e criar o banco de dados | Gustavo de Oliveira de Santana |
| Implementar autenticacao e permissoes | Eduardo Martins Colmati |
| Implementar regras do ciclo de vida da demanda | Gustavo de Oliveira de Santana |
| Implementar listagem com filtros e busca | Enzo Carleti Teixeira |
| Implementar comentarios e historico | Gabriel Lopes Londe Rodrigues |
| Implementar dashboard | Jose Gabriel Bedani |
| Integrar API externa de feriados | Gustavo de Oliveira de Santana |
| Testar o sistema de ponta a ponta | Gabriel Lopes Londe Rodrigues |
| Escrever a documentacao do projeto | Todos, cada um na sua area |

Cada card precisa ser preenchido com o tempo efetivamente gasto. Esses
registros servem de base para a Ficha de Atividades Autonomas, de 38
horas, conforme o item 4.6 do Documento de Visao.

---

## 6. Pendencias antes da entrega final

Itens que dependem de acao da equipe no GitHub e nao podem ser
resolvidos pelo codigo:

1. **Renomear o repositorio** para `PI-II-TIME-11`, conforme o item 4.1
   do Documento de Visao. Penalidade de 1,0 ponto se nao for feito.

2. **Registrar os cards no GitHub Projects**, com responsavel, status e
   tempo gasto por cada integrante. O item 4.6 preve desclassificacao em
   caso de apontamento displicente.

3. **Confirmar que todos os integrantes constam como membros do
   repositorio** desde o inicio do projeto. O item 4.2 preve reprovacao
   individual de quem nao estiver.

4. **Convidar o docente orientador** para o repositorio. Os membros da
   banca so devem ser convidados quando o orientador autorizar, conforme
   o item 4.8.

5. **Criar a TAG de release** `1.0.0-final` na entrega final. Penalidade
   de 1,0 ponto se nao existir, conforme o item 4.3.

   ```
   git tag -a 1.0.0-final -m "Entrega final do Projeto Integrador II"
   git push origin 1.0.0-final
   ```

6. **Preencher a Ficha de Atividades Autonomas** com base nos registros
   do GitHub Projects.
