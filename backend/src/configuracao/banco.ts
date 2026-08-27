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

export const bancoDeDados = mysql.createPool({
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

/**
 * Testa se o banco esta acessivel.
 * Chamado uma vez quando o servidor sobe, para avisar cedo se as
 * configuracoes do .env estiverem erradas.
 */
export async function testarConexaoBanco(): Promise<void> {
  const conexao = await bancoDeDados.getConnection();
  try {
    await conexao.ping();
  } finally {
    // Devolve a conexao para o pool, mesmo se o ping falhar.
    conexao.release();
  }
}
