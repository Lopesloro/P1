# 02 - Tecnologias utilizadas

Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues

Para cada ferramenta: o que ela faz, por que foi escolhida, como se
integra ao projeto, como instalar e como usar.

Regra seguida pela equipe: se uma solucao simples resolve o problema
corretamente, ela e preferida. Nenhuma biblioteca foi adicionada sem
necessidade real.

---

## 1. Node.js

**O que faz.** Executa codigo JavaScript fora do navegador, no servidor.

**Por que foi escolhido.** Exigencia do Documento de Visao (item 3).

**Como se integra.** E o programa que roda todo o backend.

**Como instalar.** Baixar a versao LTS em `https://nodejs.org`.
Conferir com `node -v`.

**Uso basico.** `npm run dev` dentro da pasta `backend`.

---

## 2. TypeScript

**O que faz.** E o JavaScript com anotacao de tipos. O programador diz
qual tipo de dado cada variavel guarda, e um verificador aponta os erros
antes de o programa ser executado.

**Por que foi escolhido.** Exigencia do Documento de Visao. Na pratica,
ele evitou varios erros durante o desenvolvimento. Um exemplo: o tipo
`StatusDemanda` so aceita os cinco status previstos, entao escrever
`'CONCLUIDO'` no lugar de `'CONCLUIDA'` vira erro na hora, e nao um bug
descoberto na apresentacao.

**Como se integra.** Todo o backend e escrito em TypeScript. A
configuracao esta em `backend/tsconfig.json`, com `strict: true`, que
liga todas as verificacoes.

**Como instalar.** Vem junto com `npm install`.

**Uso basico.**

```
npm run verificar-tipos   Confere os tipos sem executar o programa
npm run build             Gera o JavaScript na pasta dist
```

---

## 3. Express

**O que faz.** Recebe as requisicoes HTTP, descobre qual funcao deve
responder cada endereco e devolve a resposta.

**Por que foi escolhido.** Exigencia do Documento de Visao. E tambem a
biblioteca mais usada e mais documentada do Node.js, o que facilita
encontrar ajuda.

**Como se integra.** O servidor e criado em `backend/src/servidor.ts`.
As rotas estao em `backend/src/rotas/index.ts`.

**Uso basico.** Cada rota tem esta forma:

```typescript
rotas.get('/demandas', exigirLogin, capturarErros(listarDemandas));
//        endereco     roda antes    funcao que responde
```

---

## 4. MySQL 8

**O que faz.** Guarda os dados em tabelas relacionadas entre si.

**Por que foi escolhido.** O Documento de Visao permite apenas MySQL ou
Oracle. Entre os dois, o MySQL foi escolhido porque:

- a instalacao e simples no Windows, no Linux e no macOS;
- e gratuito e sem licenca;
- a documentacao em portugues e abundante;
- e o banco mais usado em projetos web, o que ajuda quem for estudar o
  codigo depois.

**Como se integra.** Os scripts de criacao estao na pasta `banco`. A
conexao e feita em `backend/src/configuracao/banco.ts`.

**Como instalar.** Baixar em `https://dev.mysql.com/downloads/`.
No Ubuntu: `sudo apt install mysql-server`.

**Uso basico.**

```
mysql -u root -p < banco/01_criar_tabelas.sql
```

---

## 5. mysql2

**O que faz.** Conecta o Node.js ao MySQL e executa as consultas.

**Por que foi escolhido.** E o driver mais usado, aceita a forma moderna
de escrever codigo assincrono (`async` e `await`) e suporta consultas
parametrizadas, que sao a defesa contra SQL Injection.

**Por que nao um ORM.** Ferramentas como Prisma e TypeORM escrevem o SQL
sozinhas. Isso deixaria o codigo mais curto, mas esconderia justamente o
conteudo de banco de dados que o projeto pretende exercitar. Com o
mysql2 as consultas ficam visiveis e podem ser lidas e testadas
diretamente no MySQL.

**Como se integra.** Um pool de conexoes e criado uma unica vez e
reaproveitado por todo o sistema.

**Uso basico.**

```typescript
const [linhas] = await bancoDeDados.query(
  'SELECT * FROM demandas WHERE status = ?',
  [status]
);
```

Os valores digitados pelo usuario entram no lugar dos pontos de
interrogacao. Eles nunca sao colados dentro do texto do comando.

---

## 6. bcryptjs

**O que faz.** Transforma a senha em um texto embaralhado, chamado hash.
Nao existe caminho de volta: a partir do hash nao se descobre a senha.

**Por que foi escolhido.** Guardar senha em texto puro e uma falha grave.
Se o banco vazar, todas as senhas vazam junto. O bcrypt e o algoritmo
mais recomendado para senhas, porque e propositalmente lento, o que
dificulta ataques de tentativa e erro.

**Como se integra.** Usado em `backend/src/servicos/senhas.ts`, no
cadastro e na conferencia do login.

**Uso basico.**

```typescript
const hash = await gerarHashDaSenha('minhasenha');
const confere = await senhaConfere('minhasenha', hash);  // true ou false
```

---

## 7. jsonwebtoken

**O que faz.** Gera um token assinado com uma chave secreta e confere
essa assinatura depois.

**Por que foi escolhido.** Depois do login, o servidor precisa saber quem
esta chamando cada rota. O token resolve isso sem que o servidor precise
guardar o estado da sessao.

Se alguem tentar alterar o token para virar administrador, a assinatura
deixa de bater e o acesso e negado.

**Como se integra.** `backend/src/servicos/token.ts` gera e le o token.
O middleware `exigirLogin` confere o token em toda rota protegida.

**Uso basico.** O frontend envia o token no cabecalho:

```
Authorization: Bearer <token>
```

---

## 8. dotenv

**O que faz.** Le um arquivo `.env` e disponibiliza os valores para o
programa.

**Por que foi escolhido.** Senha de banco e chave secreta nao podem ficar
escritas no codigo, porque o codigo vai para o GitHub. Com o dotenv elas
ficam em um arquivo separado, que nao e enviado ao repositorio.

**Como se integra.** `backend/src/configuracao/ambiente.ts` le tudo em um
unico lugar. Se uma variavel obrigatoria faltar, o programa para na
inicializacao com uma mensagem clara, em vez de quebrar depois.

**Uso basico.** Copiar `.env.example` para `.env` e preencher.

---

## 9. cors

**O que faz.** Autoriza o navegador a chamar a API.

**Por que foi escolhido.** Como o frontend e servido pelo mesmo endereco
da API, o CORS quase nao e necessario. Ele foi mantido para o caso de
alguem abrir o HTML direto do disco ou usar outra porta durante os
testes, situacao em que o navegador bloquearia a chamada sem aviso claro.

---

## 10. tsx

**O que faz.** Executa arquivos TypeScript diretamente e reinicia o
servidor sozinho quando um arquivo e salvo.

**Por que foi escolhido.** Sem ele seria preciso compilar o projeto a
cada alteracao. E usado apenas durante o desenvolvimento.

**Uso basico.** `npm run dev`.

---

## 11. HTML5, CSS3 e JavaScript

**O que fazem.** Constroem as telas do sistema.

**Por que foram escolhidos.** Exigencia do Documento de Visao e da
Reuniao 2.

**Como se integram.** Estao na pasta `frontend`, divididos por tela.

---

## 12. Por que a equipe nao usou Bootstrap

O Documento de Visao recomenda o Bootstrap, mas nao o exige. A equipe
optou por escrever o CSS proprio pelos seguintes motivos:

1. **A identidade visual e escura e personalizada.** A paleta definida
   pelo grupo tem fundo preto e destaque laranja. O Bootstrap vem com
   aparencia clara por padrao, e adapta-lo exigiria sobrescrever muitas
   regras, resultando em mais CSS, e nao menos.

2. **Quem le o codigo aprende mais.** Com CSS proprio, o aluno que abrir
   `estilos/componentes.css` ve exatamente como um botao foi construido.
   Com Bootstrap, veria apenas o nome de uma classe pronta.

3. **Uma dependencia a menos.** O sistema nao depende de baixar nenhum
   arquivo externo para funcionar.

O CSS foi organizado com variaveis, entao mudar a cor principal do
sistema inteiro exige alterar uma unica linha em `estilos/base.css`.

---

## 13. Por que a equipe nao usou framework de frontend

React, Vue e Angular resolvem bem sistemas com muitas telas e muito
estado compartilhado. Este sistema tem cinco telas e nenhuma delas
depende do estado de outra.

Usar um framework acrescentaria uma etapa de compilacao, uma pasta de
dependencias e um conjunto de conceitos novos, sem resolver nenhum
problema que o projeto realmente tem. Alem disso, o Documento de Visao
e a Reuniao 2 pedem HTML, CSS e JavaScript.

---

## 14. BrasilAPI

**O que faz.** Informa os feriados nacionais brasileiros de um ano.

**Por que foi escolhida.** O Documento de Visao (item 2.2.5) obriga o uso
de uma API externa para conferir se o prazo cai em feriado nacional. A
BrasilAPI foi escolhida porque:

- e gratuita e nao exige cadastro nem chave de acesso;
- devolve os feriados nacionais brasileiros, exatamente o que o
  documento pede;
- e mantida por uma comunidade ativa e tem documentacao publica.

**Como se integra.** `backend/src/servicos/feriados.ts`. Os detalhes
estao em `06-api-externa-feriados.md`.

---

## 15. Ferramentas de apoio

| Ferramenta | Uso |
|---|---|
| Git | Controle de versao |
| GitHub | Repositorio remoto |
| GitHub Projects | Registro das atividades e das horas |
| Visual Studio Code / WebStorm | Edicao do codigo |

---

## 16. Bibliotecas que foram avaliadas e descartadas

| Biblioteca | Por que nao foi usada |
|---|---|
| Bootstrap | Explicado no item 12 |
| React, Vue, Angular | Explicado no item 13 |
| Prisma, TypeORM | Esconderiam o SQL, que e conteudo do curso |
| Zod, Joi | A validacao necessaria e simples e coube em funcoes proprias, faceis de ler |
| Axios | O `fetch` ja vem pronto no navegador e no Node.js |
| Moment.js, date-fns | As datas do sistema sao simples e a formatacao coube em poucas linhas |
| Winston, Pino | Para o tamanho do projeto, `console.log` e `console.error` bastam |
| Nodemon | O tsx ja reinicia o servidor sozinho |
