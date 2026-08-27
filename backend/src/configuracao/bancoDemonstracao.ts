/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 * Projeto Integrador II - PI-II-TIME-11
 *
 * MODO DE DEMONSTRACAO: banco em memoria, para rodar o sistema sem MySQL.
 *
 * Para que serve
 * --------------
 * O sistema de verdade guarda os dados no MySQL. Instalar e configurar o
 * MySQL leva tempo, e nem sempre quem precisa apenas VER as telas tem o
 * banco instalado na maquina: um professor avaliando o trabalho, um colega
 * entrando no projeto, ou o proprio time em um computador emprestado.
 *
 * Este arquivo resolve isso criando um banco de dados dentro da propria
 * memoria do programa, usando o SQLite que ja vem junto com o Node.js.
 * Nao instala nada, nao abre porta nenhuma e nao grava arquivo no disco.
 *
 * O que ele NAO e
 * ---------------
 * Nao e uma copia do sistema, nem um conjunto de telas falsas. As rotas,
 * os controladores, as regras de status, as permissoes por perfil e a
 * consulta de feriados sao exatamente os mesmos do modo normal. A unica
 * peca trocada e o banco embaixo deles.
 *
 * Consequencia importante: como os dados vivem na memoria, tudo o que for
 * cadastrado se perde ao desligar o servidor. A cada `npm run demo` o
 * banco volta ao estado inicial dos scripts da pasta banco/.
 *
 * Por que traduzir o SQL em vez de reescreve-lo
 * ---------------------------------------------
 * O MySQL e o SQLite falam dialetos parecidos, mas nao iguais. Em vez de
 * manter uma segunda copia das tabelas e dos dados, que sairia do ar
 * sincronizada com a pasta banco/ na primeira alteracao, este arquivo le
 * os mesmos scripts .sql do projeto e converte os poucos trechos que os
 * dois bancos escrevem de forma diferente. A pasta banco/ continua sendo
 * a unica fonte da verdade.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/** Pasta onde ficam os scripts SQL do projeto. */
const PASTA_DO_BANCO = path.join(__dirname, '..', '..', '..', 'banco');

/**
 * Ordem das prioridades e dos status, usada para ordenar a listagem.
 *
 * No MySQL essas colunas sao do tipo ENUM, e o banco sabe sozinho que
 * CRITICA vem depois de ALTA. O SQLite guarda o valor como texto simples,
 * e ordenaria em ordem alfabetica: ALTA, BAIXA, CRITICA, MEDIA. As duas
 * listas abaixo devolvem a posicao correta de cada valor e sao registradas
 * como funcoes do banco mais adiante.
 *
 * A ordem e a mesma declarada em banco/01_criar_tabelas.sql.
 */
const ORDEM_DAS_PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const ORDEM_DOS_STATUS = [
  'ABERTA',
  'EM_ANDAMENTO',
  'EM_REVISAO',
  'CONCLUIDA',
  'CANCELADA',
];

/**
 * Converte a criacao das tabelas do dialeto do MySQL para o do SQLite.
 *
 * O que muda, e por que:
 *
 *   CREATE DATABASE / USE      o SQLite tem um banco so, entao nao existem
 *   INT AUTO_INCREMENT         no SQLite se escreve INTEGER ... AUTOINCREMENT
 *   ENUM('A','B')              o SQLite nao tem ENUM; vira TEXT com CHECK,
 *                              que faz a mesma conferencia de valor
 *   TINYINT(1)                 vira INTEGER
 *   DEFAULT CURRENT_TIMESTAMP  no SQLite devolve o horario de Londres;
 *                              trocamos pelo horario local, como no MySQL
 *   ON UPDATE CURRENT_TIMESTAMP o SQLite nao tem; e recriado com um gatilho
 *   ENGINE = InnoDB            e uma opcao que so existe no MySQL
 */
function traduzirCriacaoDeTabelas(sqlDoMysql: string): string {
  return (
    sqlDoMysql
      // Comandos que so fazem sentido em um servidor com varios bancos.
      .replace(/CREATE\s+DATABASE[\s\S]*?;/gi, '')
      .replace(/^\s*USE\s+\w+\s*;/gim, '')

      // Chave primaria que se numera sozinha.
      .replace(/\bINT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi,
        'INTEGER PRIMARY KEY AUTOINCREMENT')

      // ENUM('A', 'B') vira TEXT com a mesma lista de valores aceitos.
      // O $1 e a lista de valores capturada entre os parenteses.
      .replace(/\bENUM\s*\(([^)]*)\)/gi, 'TEXT CHECK (VALOR_DA_COLUNA IN ($1))')

      .replace(/\bTINYINT\s*\(\s*1\s*\)/gi, 'INTEGER')

      // Horario de criacao no fuso do computador, e nao em UTC.
      .replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, "DEFAULT (datetime('now','localtime'))")

      // Recriado logo abaixo com um gatilho.
      .replace(/\s*ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '')

      .replace(/\)\s*ENGINE\s*=\s*InnoDB\s*;/gi, ');')
  );
}

/**
 * Completa a conversao dos ENUM.
 *
 * A troca anterior deixou a marca VALOR_DA_COLUNA no lugar do nome da
 * coluna, porque uma expressao regular sozinha nao consegue olhar para
 * tras e descobrir a qual coluna aquele ENUM pertencia. Esta funcao
 * percorre o texto linha a linha, ve o nome da coluna no comeco da linha
 * e coloca esse nome no lugar da marca.
 *
 * Exemplo:
 *   perfil  TEXT CHECK (VALOR_DA_COLUNA IN ('ADMINISTRADOR', ...))
 *   vira
 *   perfil  TEXT CHECK (perfil IN ('ADMINISTRADOR', ...))
 */
function nomearAsColunasDosEnum(sql: string): string {
  return sql
    .split('\n')
    .map((linha) => {
      if (!linha.includes('VALOR_DA_COLUNA')) {
        return linha;
      }

      const nomeDaColuna = linha.trim().split(/\s+/)[0];
      return linha.replace('VALOR_DA_COLUNA', nomeDaColuna);
    })
    .join('\n');
}

/**
 * Converte uma consulta do dialeto do MySQL para o do SQLite.
 *
 * Esta funcao roda em toda consulta feita pelos controladores. Sao poucos
 * casos, porque o restante do SQL do projeto e comum aos dois bancos.
 */
export function traduzirConsulta(sqlDoMysql: string): string {
  return (
    sqlDoMysql
      // "daqui a N dias". Precisa vir antes da troca de CURDATE, senao o
      // CURDATE de dentro seria trocado primeiro e o padrao nao casaria.
      // O ? continua sendo o mesmo parametro, agora somado ao texto.
      .replace(
        /DATE_ADD\s*\(\s*CURDATE\s*\(\s*\)\s*,\s*INTERVAL\s+\?\s+DAY\s*\)/gi,
        "date('now','localtime','+' || ? || ' days')"
      )

      // Diferenca em dias entre uma data e hoje.
      .replace(
        /DATEDIFF\s*\(\s*([\w.]+)\s*,\s*CURDATE\s*\(\s*\)\s*\)/gi,
        "CAST(julianday($1) - julianday(date('now','localtime')) AS INTEGER)"
      )

      // A data de hoje.
      .replace(/CURDATE\s*\(\s*\)/gi, "date('now','localtime')")

      // Ordenacao por prioridade e por status: usam as funcoes registradas
      // em criarBancoDeDemonstracao, que devolvem a posicao de cada valor.
      .replace(
        /ORDER\s+BY\s+demandas\.prioridade\s+DESC/gi,
        'ORDER BY ordem_da_prioridade(demandas.prioridade) DESC'
      )
      .replace(
        /ORDER\s+BY\s+demandas\.status\s+ASC/gi,
        'ORDER BY ordem_do_status(demandas.status) ASC'
      )
  );
}

/**
 * Deixa os parametros no formato que o SQLite aceita.
 *
 * O driver do MySQL e tolerante e converte sozinho valores como true,
 * false e undefined. O SQLite recusa esses valores com erro, entao a
 * conversao precisa ser feita aqui.
 */
function prepararParametros(parametros: unknown[]): unknown[] {
  return parametros.map((valor) => {
    if (valor === undefined) {
      return null;
    }

    if (typeof valor === 'boolean') {
      return valor ? 1 : 0;
    }

    if (valor instanceof Date) {
      return valor.toISOString().slice(0, 19).replace('T', ' ');
    }

    return valor;
  });
}

/**
 * Cria o banco de demonstracao e devolve um objeto que se comporta como o
 * pool de conexoes do MySQL.
 *
 * Por que imitar o pool do MySQL: assim nenhum controlador precisa saber
 * em qual modo o sistema esta rodando. Todos continuam chamando
 * bancoDeDados.query da mesma forma.
 */
export function criarBancoDeDemonstracao() {
  const banco = new DatabaseSync(':memory:');

  // Faz o SQLite conferir as chaves estrangeiras, como o MySQL ja faz.
  banco.exec('PRAGMA foreign_keys = ON;');

  // Funcoes de ordenacao usadas na traducao das consultas.
  banco.function('ordem_da_prioridade', (valor: unknown) =>
    ORDEM_DAS_PRIORIDADES.indexOf(String(valor))
  );
  banco.function('ordem_do_status', (valor: unknown) =>
    ORDEM_DOS_STATUS.indexOf(String(valor))
  );

  // Cria as tabelas a partir do script oficial do projeto.
  const criacao = readFileSync(
    path.join(PASTA_DO_BANCO, '01_criar_tabelas.sql'),
    'utf8'
  );
  banco.exec(nomearAsColunasDosEnum(traduzirCriacaoDeTabelas(criacao)));

  /*
   * Gatilho que substitui o ON UPDATE CURRENT_TIMESTAMP do MySQL.
   *
   * Toda vez que uma demanda e alterada, este gatilho grava o horario da
   * alteracao na coluna atualizado_em. A tela de detalhes mostra esse
   * valor no campo "Ultima atualizacao".
   */
  banco.exec(`
    CREATE TRIGGER tg_demandas_atualizado_em
    AFTER UPDATE ON demandas
    FOR EACH ROW
    BEGIN
      UPDATE demandas
         SET atualizado_em = datetime('now','localtime')
       WHERE id = OLD.id;
    END;
  `);

  // Insere os dados de exemplo, tambem do script oficial.
  const dadosIniciais = readFileSync(
    path.join(PASTA_DO_BANCO, '02_inserir_dados_iniciais.sql'),
    'utf8'
  );
  banco.exec(dadosIniciais.replace(/^\s*USE\s+\w+\s*;/gim, ''));

  /**
   * Executa uma consulta e devolve o resultado no mesmo formato do MySQL.
   *
   * O driver do MySQL devolve sempre um par: o resultado e a descricao das
   * colunas. Os controladores leem so o primeiro item, com
   * `const [linhas] = await bancoDeDados.query(...)`.
   *
   * Em um SELECT o primeiro item e a lista de linhas encontradas.
   * Em um INSERT, um UPDATE ou um DELETE, e um resumo com o codigo da
   * linha inserida (insertId) e quantas linhas foram afetadas.
   */
  async function consultar(sql: string, parametros: unknown[] = []) {
    const sqlTraduzido = traduzirConsulta(sql);
    const comando = banco.prepare(sqlTraduzido);
    const valores = prepararParametros(parametros);

    // O primeiro comando do texto decide o tipo de resposta.
    const ehLeitura = /^\s*(--[^\n]*\n|\s)*SELECT/i.test(sqlTraduzido);

    if (ehLeitura) {
      return [comando.all(...(valores as never[])), []];
    }

    const resultado = comando.run(...(valores as never[]));

    return [
      {
        insertId: Number(resultado.lastInsertRowid),
        affectedRows: Number(resultado.changes),
      },
      [],
    ];
  }

  /*
   * Imitacao de uma conexao reservada do pool.
   *
   * Os controladores usam getConnection quando precisam de uma transacao,
   * que e um conjunto de comandos que so vale se todos derem certo. O
   * cadastro de demanda usa isso: grava a demanda e o primeiro registro do
   * historico juntos, ou nao grava nenhum dos dois.
   *
   * Aqui existe uma unica conexao, porque o banco esta na memoria do
   * proprio programa. release nao precisa fazer nada.
   */
  const conexao = {
    query: consultar,
    beginTransaction: async () => {
      banco.exec('BEGIN');
    },
    commit: async () => {
      banco.exec('COMMIT');
    },
    rollback: async () => {
      banco.exec('ROLLBACK');
    },
    release: () => {},
  };

  return {
    query: consultar,
    execute: consultar,
    getConnection: async () => conexao,
    end: async () => banco.close(),
  };
}
