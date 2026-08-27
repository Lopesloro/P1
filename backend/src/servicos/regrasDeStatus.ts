/**
 * Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
 *
 * Regras do ciclo de vida da demanda.
 *
 * Este arquivo concentra a resposta para uma unica pergunta:
 * "este usuario pode mudar esta demanda deste status para aquele status?"
 *
 * Ciclo previsto no documento de visao:
 *
 *   Aberta  ->  Em andamento  ->  Em revisao  ->  Concluida
 *      |              |               |
 *      +--------------+---------------+---->  Cancelada
 *
 * Regras obrigatorias:
 * - Toda demanda nasce como Aberta.
 * - Nao e permitido ir de Em andamento direto para Concluida.
 *   A demanda precisa passar por Em revisao.
 * - Nao e permitido voltar de Em andamento para Aberta.
 * - O cancelamento pode acontecer a qualquer momento, desde que a
 *   demanda ainda nao esteja concluida.
 * - O Membro da Equipe so pode fazer duas transicoes:
 *   Aberta -> Em andamento e Em andamento -> Em revisao.
 *
 * Decisao tomada pelo grupo: permitimos a volta de Em revisao para
 * Em andamento, apenas para Lider e Administrador. Isso representa a
 * revisao que foi reprovada e precisa de correcao. O documento de visao
 * nao proibe essa transicao e ela e necessaria para o fluxo funcionar.
 */

import { PerfilUsuario, StatusDemanda } from '../tipos';
import { rotuloStatus } from './rotulos';

/**
 * Lista de para onde cada status pode ir.
 * Concluida e Cancelada nao aparecem como origem porque sao status finais.
 */
const transicoesPermitidas: Record<StatusDemanda, StatusDemanda[]> = {
  ABERTA: ['EM_ANDAMENTO', 'CANCELADA'],
  EM_ANDAMENTO: ['EM_REVISAO', 'CANCELADA'],
  EM_REVISAO: ['CONCLUIDA', 'EM_ANDAMENTO', 'CANCELADA'],

  // Status finais: a demanda nao muda mais de situacao.
  CONCLUIDA: [],
  CANCELADA: [],
};

/** As unicas duas transicoes que o Membro da Equipe pode realizar. */
const transicoesDoMembro: Array<{ de: StatusDemanda; para: StatusDemanda }> = [
  { de: 'ABERTA', para: 'EM_ANDAMENTO' },
  { de: 'EM_ANDAMENTO', para: 'EM_REVISAO' },
];

/** Resposta da verificacao: aprovada ou reprovada com o motivo. */
export interface ResultadoDaVerificacao {
  permitido: boolean;
  motivo?: string;
}

/**
 * Verifica se a mudanca de status pode acontecer.
 *
 * O que entra:
 *   statusAtual  - situacao em que a demanda esta agora
 *   statusNovo   - situacao para onde o usuario quer levar a demanda
 *   perfil       - perfil de acesso de quem esta pedindo a mudanca
 *   ehResponsavel - se o usuario e o responsavel pela demanda
 *
 * O que sai:
 *   { permitido: true } quando a mudanca pode acontecer, ou
 *   { permitido: false, motivo: '...' } com o texto que sera mostrado
 *   ao usuario.
 */
export function verificarTransicaoDeStatus(
  statusAtual: StatusDemanda,
  statusNovo: StatusDemanda,
  perfil: PerfilUsuario,
  ehResponsavel: boolean
): ResultadoDaVerificacao {
  // Mudar para o mesmo status nao faz sentido.
  if (statusAtual === statusNovo) {
    return {
      permitido: false,
      motivo: `A demanda ja esta com o status ${rotuloStatus[statusAtual]}.`,
    };
  }

  // Status finais nao podem mais ser alterados.
  if (statusAtual === 'CONCLUIDA' || statusAtual === 'CANCELADA') {
    return {
      permitido: false,
      motivo:
        `A demanda esta ${rotuloStatus[statusAtual].toLowerCase()} e nao pode ` +
        'mais ter o status alterado.',
    };
  }

  // Confere se o caminho existe no ciclo de vida.
  if (!transicoesPermitidas[statusAtual].includes(statusNovo)) {
    // Mensagem especifica para o erro mais comum: tentar concluir
    // uma demanda que ainda nao passou pela revisao.
    if (statusAtual === 'EM_ANDAMENTO' && statusNovo === 'CONCLUIDA') {
      return {
        permitido: false,
        motivo:
          'A demanda precisa passar pelo status Em revisao antes de ser concluida.',
      };
    }

    if (statusAtual === 'EM_ANDAMENTO' && statusNovo === 'ABERTA') {
      return {
        permitido: false,
        motivo: 'Uma demanda em andamento nao pode voltar para o status Aberta.',
      };
    }

    return {
      permitido: false,
      motivo:
        `Nao e possivel mudar de ${rotuloStatus[statusAtual]} para ` +
        `${rotuloStatus[statusNovo]}.`,
    };
  }

  // O Membro da Equipe tem uma lista fechada de transicoes.
  if (perfil === 'MEMBRO') {
    const podeFazerEssaTransicao = transicoesDoMembro.some(
      (transicao) => transicao.de === statusAtual && transicao.para === statusNovo
    );

    if (!podeFazerEssaTransicao) {
      return {
        permitido: false,
        motivo:
          'O perfil Membro da Equipe pode apenas iniciar a demanda e enviar ' +
          'para revisao. Concluir ou cancelar e responsabilidade do Lider ' +
          'de Projeto ou do Administrador.',
      };
    }

    // Alem disso, o membro so mexe nas demandas atribuidas a ele.
    if (!ehResponsavel) {
      return {
        permitido: false,
        motivo:
          'O perfil Membro da Equipe so pode alterar o status das demandas ' +
          'atribuidas a ele.',
      };
    }
  }

  return { permitido: true };
}

/**
 * Devolve a lista de status para os quais a demanda pode ir,
 * considerando o perfil de quem esta olhando a tela.
 *
 * A tela de detalhes usa esta funcao para montar os botoes de acao,
 * mostrando apenas as opcoes que realmente vao funcionar.
 */
export function listarProximosStatusPossiveis(
  statusAtual: StatusDemanda,
  perfil: PerfilUsuario,
  ehResponsavel: boolean
): StatusDemanda[] {
  return transicoesPermitidas[statusAtual].filter(
    (statusNovo) =>
      verificarTransicaoDeStatus(statusAtual, statusNovo, perfil, ehResponsavel)
        .permitido
  );
}
