# 07 - Design e interface

Autor exclusivo deste arquivo: Jose Gabriel Bedani

Padrao visual do grupo, paleta de cores e decisoes de interface.

---

## 1. Padrao visual do grupo

A Reuniao 2 pede que o grupo combine um padrao visual antes do
desenvolvimento, para que as cinco telas tenham unidade.

O padrao foi definido em dois arquivos, usados por todas as telas:

| Arquivo | Conteudo |
|---|---|
| `frontend/estilos/base.css` | Cores, tipografia, espacamentos, cabecalho e estrutura de pagina |
| `frontend/estilos/componentes.css` | Botoes, campos, cards, tabelas, etiquetas e mensagens |

Cada tela tem, alem desses dois, um arquivo proprio com o que e
exclusivo dela.

Nenhuma tela escreve um codigo de cor diretamente. Todas usam as
variaveis definidas em `base.css`. Por isso, mudar a cor principal do
sistema inteiro exige alterar uma unica linha.

---

## 2. Paleta de cores

### 2.1 Cores base

A paleta foi definida pelo grupo com cinco cores:

| Codigo | Cor | Uso no sistema |
|---|---|---|
| `#000000` | Preto | Fundo da aplicacao |
| `#14213D` | Azul escuro | Superficies: cards, cabecalho, campos |
| `#FCA311` | Laranja | Cor de acao e destaque |
| `#E5E5E5` | Cinza claro | Textos secundarios |
| `#FFFFFF` | Branco | Textos principais |

### 2.2 Cores acrescentadas por necessidade

Duas cores de apoio foram acrescentadas porque a paleta original nao
permitia diferenciar uma confirmacao de um problema:

| Codigo | Cor | Uso |
|---|---|---|
| `#2FBF71` | Verde | Mensagens de sucesso e status Concluida |
| `#EF4D4D` | Vermelho | Mensagens de erro, prioridade Critica e prazo vencido |

Sem essas duas cores, o aviso "Demanda cadastrada com sucesso" e o aviso
"Nao foi possivel salvar" apareceriam iguais, o que confundiria o
usuario. Elas sao usadas apenas nesses casos, e nao como cores de
decoracao.

### 2.3 Tons derivados

Alguns tons intermediarios foram calculados a partir das cores base para
dar profundidade a interface escura, como o fundo dos cards, o fundo dos
campos e as bordas. Todos partem do azul `#14213D`.

Cores adicionais foram usadas apenas para diferenciar os status entre si
(azul para Aberta, roxo para Em revisao), sempre acompanhadas do texto
escrito.

---

## 3. Onde cada cor e aplicada

| Elemento | Cor |
|---|---|
| Fundo da pagina | Preto |
| Cards e cabecalho | Azul escuro |
| Botao principal | Laranja com texto escuro |
| Botao secundario | Transparente com borda |
| Botao de cancelar demanda | Transparente com borda e texto vermelhos |
| Titulos e textos principais | Branco |
| Textos de apoio | Cinza azulado |
| Links e itens selecionados | Laranja |
| Mensagem de sucesso | Verde |
| Mensagem de erro | Vermelho |
| Mensagem de alerta | Laranja |
| Campo com erro | Borda vermelha |
| Prazo vencido ou proximo | Vermelho |

### Consistencia

O mesmo elemento tem a mesma aparencia em todas as telas:

- Botoes: mesma altura, mesmo arredondamento, mesmas tres variacoes.
- Campos: mesma altura, mesma borda, e a borda fica laranja ao receber o
  foco.
- Cards: mesmo fundo, mesma borda, mesmo arredondamento.
- Etiquetas: mesmo formato arredondado, com bolinha colorida e texto.
- Mensagens: mesmo formato nas cinco telas.
- Tabelas: mesmo cabecalho em maiusculas e mesmo destaque ao passar o
  mouse.

---

## 4. Tipografia

Fonte: a fonte do proprio sistema operacional (Segoe UI no Windows,
Helvetica Neue no macOS, Arial como alternativa).

Motivo: nao depende de baixar nenhum arquivo externo, carrega
instantaneamente e ja e a fonte com que o usuario esta acostumado a ler.

Tamanhos definidos:

| Nome | Tamanho | Uso |
|---|---|---|
| pequeno | 13px | Textos de apoio, etiquetas, datas |
| normal | 15px | Texto padrao do sistema |
| medio | 17px | Titulos de card |
| grande | 22px | Titulos em telas menores |
| titulo | 28px | Titulo principal da pagina |

---

## 5. Acessibilidade

Cuidados aplicados:

**Cor nunca e a unica informacao.** Toda etiqueta de status ou prioridade
mostra o texto escrito junto da cor. Quem nao distingue cores continua
entendendo pela palavra.

**Contraste.** Texto branco sobre fundo preto e texto escuro sobre o
laranja, ambos com contraste alto.

**Navegacao por teclado.** Elementos em foco recebem um contorno laranja
visivel, definido pela regra `:focus-visible`.

**Rotulos ligados aos campos.** Todo campo tem `<label for="...">`, o que
permite clicar no rotulo para focar o campo e faz o leitor de tela
anunciar o nome correto.

**Mensagens anunciadas.** As areas de mensagem usam `role="alert"`, o que
faz o leitor de tela ler o aviso assim que ele aparece.

**Marcacao semantica.** A pagina usa `<header>`, `<nav>`, `<main>`,
`<section>`, `<aside>`, `<table>` e `<dl>` conforme o significado de cada
parte.

**Icones decorativos ocultos.** Icones e iniciais recebem
`aria-hidden="true"`, para nao serem lidos duas vezes.

---

## 6. Responsividade

O sistema funciona em computador, tablet e celular. A responsividade foi
verificada durante o desenvolvimento, e nao apenas no final.

Pontos de quebra:

| Largura | Ajustes |
|---|---|
| Ate 1000px | A barra lateral da tela de detalhes desce para baixo do conteudo |
| Ate 900px | Espacamentos e titulos reduzidos |
| Ate 820px | As duas colunas do dashboard viram uma |
| Ate 640px | Menu em linha propria, filtros e campos empilhados, botoes ocupando a largura toda |
| Ate 480px | Ajustes finais da tela de login |

Solucoes usadas:

**Grades que se ajustam sozinhas.** Os cartoes do dashboard e os filtros
usam `repeat(auto-fit, minmax(...))`. O navegador encaixa quantos couberem
e quebra o resto, sem precisar de uma regra para cada tamanho de tela.

**Tabela com rolagem propria.** A tabela de demandas tem oito colunas e
nao caberia em um celular. Em vez de espremer as colunas, ela fica dentro
de uma area com rolagem horizontal. A tabela rola, a pagina nao.

**Botoes maiores no celular.** No celular os botoes ocupam a largura toda
e ficam empilhados, o que facilita o toque com o dedo.

**Formulario mais acima no celular.** Na tela de login, o formulario sobe
para deixar espaco ao teclado que aparece ao tocar em um campo.

Verificacao automatizada: os testes de navegador conferem, em 390x844
(celular) e 820x1180 (tablet), que nenhuma tela produz rolagem horizontal
na pagina.

---

## 7. Decisoes de interface

### 7.1 Tema escuro

A paleta definida pelo grupo tem o preto como cor de fundo. O tema escuro
tambem faz sentido para um sistema de acompanhamento de demandas, que
costuma ficar aberto por muito tempo.

### 7.2 O que foi retirado do desenho inicial

O desenho de referencia da tela de login trazia botoes de entrada com
Google, Apple e GitHub.

Esses botoes nao foram incluidos. O sistema nao tem integracao com
nenhum desses servicos, e o Documento de Visao nao pede login social. Um
botao que nao faz nada seria um elemento apenas visual, e o principio
adotado no projeto e nao deixar nada simulado na interface.

Pelo mesmo motivo, o link "Esqueceu a senha?" nao virou um link vazio.
Como os usuarios sao cadastrados diretamente no banco, o link explica ao
usuario que ele deve procurar o administrador. Assim o elemento existe e
tem funcao real.

### 7.3 Botao de mostrar a senha

Acrescentado ao campo de senha. Reduz o erro de digitacao, que e a causa
mais comum de falha no login.

### 7.4 Botoes de status calculados pelo servidor

A tela de detalhes nao decide quais botoes mostrar. Ela recebe do
backend a lista `proximosStatus` e desenha um botao para cada item.

Assim a tela nunca oferece uma acao que o servidor vai recusar, e as
regras ficam escritas em um lugar so.

### 7.5 Filtros guardados no endereco da pagina

Os filtros da listagem ficam no endereco (por exemplo,
`?status=ABERTA&ordenarPor=prazo`).

Isso permite recarregar a pagina sem perder os filtros, voltar da tela de
detalhes com a consulta preservada e copiar o endereco para enviar a um
colega.

### 7.6 Filtros aplicados na hora

Trocar uma caixa de selecao recarrega a lista imediatamente. A busca por
texto exige clicar no botao, para nao disparar uma consulta a cada letra
digitada.

### 7.7 Confirmacao ao cancelar

O cancelamento pede confirmacao, porque e a acao mais dificil de
desfazer. A mensagem explica que a demanda nao sera apagada e que o
historico sera mantido.

---

## 8. Mensagens ao usuario

Regra adotada: o usuario nunca ve mensagem tecnica. Detalhes de banco de
dados e nomes de tabela ficam no console do servidor, para o
desenvolvedor.

Exemplos:

| Situacao | O que o sistema mostra |
|---|---|
| Campo obrigatorio vazio | Nao foi possivel salvar. Verifique os campos destacados e tente novamente. |
| Senha errada | E-mail ou senha incorretos. Confira os dados e tente novamente. |
| Prazo em feriado | A data informada e um feriado nacional (Natal). Escolha outra data para o prazo de finalizacao. |
| Transicao de status invalida | A demanda precisa passar pelo status Em revisao antes de ser concluida. |
| Servidor fora do ar | Nao foi possivel falar com o servidor. Verifique se o sistema esta ligado e tente novamente. |
| Sessao expirada | Sua sessao expirou por inatividade. Entre novamente para continuar. |
| Erro inesperado | Ocorreu um erro inesperado no servidor. Tente novamente em alguns instantes. |

Cada mensagem diz o que aconteceu e, quando possivel, o que o usuario
deve fazer.

---

## 9. As cinco telas

| Tela | Arquivo | Responsavel |
|---|---|---|
| Login | `frontend/index.html` | Eduardo Martins Colmati |
| Dashboard | `frontend/paginas/dashboard.html` | Jose Gabriel Bedani |
| Listagem de Demandas | `frontend/paginas/demandas.html` | Enzo Carleti Teixeira |
| Cadastro/Edicao de Demanda | `frontend/paginas/demanda-formulario.html` | Gustavo de Oliveira de Santana |
| Detalhes da Demanda | `frontend/paginas/demanda-detalhes.html` | Gabriel Lopes Londe Rodrigues |

O cabecalho com o menu e os dados do usuario e montado por
`frontend/scripts/sessao.js` e usado por todas as telas internas. Assim
as cinco telas nunca ficam com menus diferentes entre si.

---

## 10. Observacao sobre o campo de data

O campo de prazo usa `<input type="date">`, que e o seletor de data do
proprio navegador.

O formato exibido depende do idioma configurado no navegador: em
portugues aparece dd/mm/aaaa, e em ingles aparece mm/dd/aaaa. Esse
comportamento e do navegador, e nao do sistema.

O valor enviado ao servidor e sempre o mesmo, no formato aaaa-mm-dd,
independentemente do idioma. Todas as datas exibidas pelo sistema em
outros lugares seguem o formato brasileiro dd/mm/aaaa, aplicado pela
funcao `Formatacao.formatarData`.
