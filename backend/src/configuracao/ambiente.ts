/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Le as variaveis de ambiente do arquivo .env e as disponibiliza para o
 * restante do sistema em um unico lugar.
 *
 * Por que isso existe:
 * senhas de banco e chaves secretas nunca podem ficar escritas no codigo,
 * porque o codigo vai para o GitHub. Elas ficam no arquivo .env, que nao e
 * enviado ao repositorio (veja o .gitignore).
 */

import dotenv from 'dotenv';

// Carrega o arquivo .env que fica na raiz da pasta backend.
dotenv.config();

/**
 * Busca uma variavel de ambiente obrigatoria.
 * Se ela nao existir, o programa para na inicializacao com uma mensagem
 * clara, em vez de quebrar mais tarde com um erro dificil de entender.
 */
function lerObrigatoria(nome: string): string {
  const valor = process.env[nome];

  if (!valor || valor.trim() === '') {
    throw new Error(
      `A variavel de ambiente ${nome} nao foi definida. ` +
        'Copie o arquivo .env.example para .env e preencha os valores.'
    );
  }

  return valor;
}

/**
 * Diz se o sistema esta rodando no modo de demonstracao, com o banco em
 * memoria em vez do MySQL. Quem liga essa chave e o arquivo
 * src/servidorDemonstracao.ts, executado por `npm run demo`.
 */
const modoDemonstracao = process.env.MODO_DEMONSTRACAO === '1';

/**
 * Busca uma variavel de ambiente opcional, devolvendo um valor padrao
 * quando ela nao foi preenchida.
 */
function lerOpcional(nome: string, valorPadrao: string): string {
  const valor = process.env[nome];
  return valor && valor.trim() !== '' ? valor : valorPadrao;
}

export const ambiente = {
  // Porta em que a API vai responder.
  porta: Number(lerOpcional('PORTA', '3000')),

  // Verdadeiro quando o sistema roda sem MySQL, com o banco em memoria.
  modoDemonstracao,

  banco: {
    host: lerOpcional('BANCO_HOST', 'localhost'),
    porta: Number(lerOpcional('BANCO_PORTA', '3306')),

    /*
     * No modo de demonstracao nao existe MySQL, entao nao ha usuario nem
     * senha de banco a exigir. Fora dele o usuario continua obrigatorio:
     * e melhor o sistema parar na hora, com uma mensagem clara, do que
     * subir e falhar na primeira consulta.
     */
    usuario: modoDemonstracao ? '' : lerObrigatoria('BANCO_USUARIO'),
    senha: lerOpcional('BANCO_SENHA', ''),
    nome: lerOpcional('BANCO_NOME', 'acompanhamento_demandas'),
  },

  /*
   * Chave usada para assinar o token de login. Precisa ser um texto longo
   * e secreto.
   *
   * O modo de demonstracao aceita uma chave fixa porque nao ha nada a
   * proteger: o banco vive na memoria, so tem dados de exemplo e some
   * quando o servidor e desligado. Fora dele a chave continua obrigatoria.
   */
  chaveSecretaToken: modoDemonstracao
    ? 'chave-do-modo-de-demonstracao-sem-valor-de-seguranca'
    : lerObrigatoria('CHAVE_SECRETA_TOKEN'),

  // Por quanto tempo o token de login continua valido.
  validadeToken: lerOpcional('VALIDADE_TOKEN', '8h'),

  // Endereco da API externa que informa os feriados nacionais.
  urlApiFeriados: lerOpcional(
    'URL_API_FERIADOS',
    'https://brasilapi.com.br/api/feriados/v1'
  ),
};
