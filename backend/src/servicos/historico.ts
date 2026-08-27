/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 *
 * Gravacao do historico de alteracoes das demandas.
 *
 * Exigencia do documento de visao (item 2.2.7): o sistema precisa registrar
 * automaticamente as mudancas relevantes de cada demanda, e esses registros
 * nunca podem ser apagados, mesmo quando a demanda e cancelada.
 *
 * Campos acompanhados:
 *   status, responsavel, prioridade, prazo de finalizacao e tipo.
 *
 * O historico e sempre gravado dentro da mesma transacao da alteracao.
 * Assim, ou a demanda muda e o historico e gravado, ou nada acontece.
 * Nunca fica um sem o outro.
 */

import { PoolConnection } from 'mysql2/promise';

/** Uma linha do historico, ja com os textos prontos para exibicao. */
export interface AlteracaoRegistrada {
  campoAlterado: string;
  valorAnterior: string | null;
  valorNovo: string | null;
}

/**
 * Grava uma lista de alteracoes no historico de uma demanda.
 *
 * O que entra:
 *   conexao    - a conexao da transacao em andamento
 *   demandaId  - qual demanda foi alterada
 *   usuarioId  - quem fez a alteracao
 *   alteracoes - lista de campos que mudaram
 *
 * Quando a lista vem vazia, nada e gravado. Isso acontece, por exemplo,
 * quando o usuario abre a tela de edicao e salva sem mudar nada.
 */
export async function registrarAlteracoes(
  conexao: PoolConnection,
  demandaId: number,
  usuarioId: number,
  alteracoes: AlteracaoRegistrada[]
): Promise<void> {
  if (alteracoes.length === 0) {
    return;
  }

  for (const alteracao of alteracoes) {
    await conexao.query(
      `INSERT INTO historico_alteracoes
         (demanda_id, usuario_id, campo_alterado, valor_anterior, valor_novo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        demandaId,
        usuarioId,
        alteracao.campoAlterado,
        alteracao.valorAnterior,
        alteracao.valorNovo,
      ]
    );
  }
}

/**
 * Compara o valor antigo com o novo e devolve a alteracao a ser gravada,
 * ou null quando o valor nao mudou.
 *
 * Usar esta funcao evita encher o historico com linhas do tipo
 * "prioridade mudou de Alta para Alta".
 *
 * Exemplo:
 *   compararValores('prioridade', 'Alta', 'Critica')
 *   -> { campoAlterado: 'prioridade', valorAnterior: 'Alta', valorNovo: 'Critica' }
 *
 *   compararValores('prioridade', 'Alta', 'Alta')
 *   -> null
 */
export function compararValores(
  campoAlterado: string,
  valorAnterior: string | null,
  valorNovo: string | null
): AlteracaoRegistrada | null {
  if (valorAnterior === valorNovo) {
    return null;
  }

  return { campoAlterado, valorAnterior, valorNovo };
}
