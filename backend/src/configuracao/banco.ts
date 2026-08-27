/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Cria a conexao com o banco de dados MySQL.
 *
 * Usamos um "pool" de conexoes. Um pool e um conjunto de conexoes ja abertas
 * que ficam prontas para uso. Isso e melhor do que abrir e fechar uma conexao
 * a cada consulta, porque abrir conexao e uma operacao lenta.
 */

import mysql from 'mysql2/promise';
import { ambiente } from './ambiente';
import { criarBancoDeDemonstracao } from './bancoDemonstracao';

/**
 * Cria o pool de conexoes com o MySQL.
 *
 * Fica dentro de uma funcao para nao ser executado no modo de
 * demonstracao, em que nao existe MySQL nenhum para conectar.
 */
function criarPoolDoMysql() {
  return mysql.createPool({
    host: ambiente.banco.host,
    port: ambiente.banco.porta,
    user: ambiente.banco.usuario,
    password: ambiente.banco.senha,
    database: ambiente.banco.nome,

    // Quantas conexoes podem ficar abertas ao mesmo tempo.
    connectionLimit: 10,

    // Se todas as conexoes estiverem ocupadas, a proxima consulta espera
    // na fila em vez de dar erro imediatamente.
    waitForConnections: true,
    queueLimit: 0,

    // Faz o driver devolver datas como texto no formato do banco.
    // Sem isso o JavaScript converte para o fuso horario local e a data
    // do prazo pode aparecer com um dia de diferenca.
    dateStrings: true,
  });
}

/**
 * Banco de dados usado por todo o sistema.
 *
 * No modo normal e o MySQL. No modo de demonstracao, ligado por
 * `npm run demo`, e um banco SQLite em memoria que responde as mesmas
 * chamadas. Os controladores nao percebem a diferenca: continuam usando
 * bancoDeDados.query e bancoDeDados.getConnection do mesmo jeito.
 */
export const bancoDeDados = (
  ambiente.modoDemonstracao ? criarBancoDeDemonstracao() : criarPoolDoMysql()
) as mysql.Pool;

/**
 * Testa se o banco esta acessivel.
 * Chamado uma vez quando o servidor sobe, para avisar cedo se as
 * configuracoes do .env estiverem erradas.
 */
export async function testarConexaoBanco(): Promise<void> {
  // O banco de demonstracao vive na memoria do proprio programa: se
  // chegou ate aqui, ele ja esta pronto e nao ha conexao a testar.
  if (ambiente.modoDemonstracao) {
    return;
  }

  const conexao = await bancoDeDados.getConnection();
  try {
    await conexao.ping();
  } finally {
    // Devolve a conexao para o pool, mesmo se o ping falhar.
    conexao.release();
  }
}
