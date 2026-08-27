/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 *
 * Detalhes de uma demanda.
 *
 * Esta rota reune, em uma unica resposta, tudo o que a tela de detalhes
 * precisa mostrar:
 * - os dados da demanda;
 * - a lista de comentarios;
 * - o historico de alteracoes;
 * - e quais mudancas de status o usuario logado pode realizar agora.
 *
 * Buscar tudo de uma vez evita que a tela precise fazer varias chamadas
 * seguidas ao servidor, o que deixaria o carregamento mais lento.
 */

import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { usuarioTemAcessoAoProjeto } from '../servicos/permissoes';
import { listarProximosStatusPossiveis } from '../servicos/regrasDeStatus';
import {
  rotuloPrioridade,
  rotuloStatus,
  rotuloTipo,
} from '../servicos/rotulos';
import {
  ErroDaAplicacao,
  PrioridadeDemanda,
  StatusDemanda,
  TipoDemanda,
} from '../tipos';

interface LinhaDetalhe extends RowDataPacket {
  id: number;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  projeto_id: number;
  projeto_nome: string;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  criado_por_nome: string;
  criado_em: string;
  atualizado_em: string;
  prazo_finalizacao: string | null;
}

interface LinhaComentario extends RowDataPacket {
  id: number;
  texto: string;
  criado_em: string;
  usuario_id: number;
  usuario_nome: string;
}

interface LinhaHistorico extends RowDataPacket {
  id: number;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  criado_em: string;
  usuario_nome: string;
}

/**
 * GET /api/demandas/:id
 *
 * Como testar pelo terminal (troque o token pelo recebido no login):
 *   curl http://localhost:3000/api/demandas/1 \
 *     -H "Authorization: Bearer SEU_TOKEN"
 */
export async function obterDetalhesDaDemanda(
  req: Request,
  res: Response
): Promise<void> {
  const usuario = req.usuario!;
  const demandaId = Number(req.params.id);

  if (!Number.isInteger(demandaId) || demandaId <= 0) {
    throw new ErroDaAplicacao(400, 'O codigo da demanda informado nao e valido.');
  }

  // 1. Busca os dados principais da demanda.
  const [linhasDemanda] = await bancoDeDados.query<LinhaDetalhe[]>(
    `SELECT demandas.id,
            demandas.titulo,
            demandas.descricao,
            demandas.tipo,
            demandas.prioridade,
            demandas.status,
            demandas.projeto_id,
            projetos.nome        AS projeto_nome,
            demandas.responsavel_id,
            responsavel.nome     AS responsavel_nome,
            autor.nome           AS criado_por_nome,
            demandas.criado_em,
            demandas.atualizado_em,
            demandas.prazo_finalizacao
       FROM demandas
       INNER JOIN projetos
               ON projetos.id = demandas.projeto_id
       INNER JOIN usuarios AS autor
               ON autor.id = demandas.criado_por_id
       LEFT JOIN usuarios AS responsavel
              ON responsavel.id = demandas.responsavel_id
      WHERE demandas.id = ?
      LIMIT 1`,
    [demandaId]
  );

  const demanda = linhasDemanda[0];

  if (!demanda) {
    throw new ErroDaAplicacao(404, 'Demanda nao encontrada.');
  }

  // 2. Confere se o usuario pode enxergar o projeto desta demanda.
  const temAcesso = await usuarioTemAcessoAoProjeto(usuario, demanda.projeto_id);
  if (!temAcesso) {
    throw new ErroDaAplicacao(
      403,
      'Voce nao tem acesso as demandas deste projeto.'
    );
  }

  // 3. Busca os comentarios, do mais antigo para o mais recente,
  //    que e a ordem natural de leitura de uma conversa.
  const [comentarios] = await bancoDeDados.query<LinhaComentario[]>(
    `SELECT comentarios.id,
            comentarios.texto,
            comentarios.criado_em,
            comentarios.usuario_id,
            usuarios.nome AS usuario_nome
       FROM comentarios
       INNER JOIN usuarios
               ON usuarios.id = comentarios.usuario_id
      WHERE comentarios.demanda_id = ?
      ORDER BY comentarios.criado_em ASC`,
    [demandaId]
  );

  // 4. Busca o historico, do mais recente para o mais antigo,
  //    para que a ultima alteracao apareca no topo.
  const [historico] = await bancoDeDados.query<LinhaHistorico[]>(
    `SELECT historico_alteracoes.id,
            historico_alteracoes.campo_alterado,
            historico_alteracoes.valor_anterior,
            historico_alteracoes.valor_novo,
            historico_alteracoes.criado_em,
            usuarios.nome AS usuario_nome
       FROM historico_alteracoes
       INNER JOIN usuarios
               ON usuarios.id = historico_alteracoes.usuario_id
      WHERE historico_alteracoes.demanda_id = ?
      ORDER BY historico_alteracoes.criado_em DESC, historico_alteracoes.id DESC`,
    [demandaId]
  );

  // 5. Calcula quais botoes de mudanca de status a tela deve mostrar.
  const ehResponsavel = demanda.responsavel_id === usuario.id;
  const proximosStatus = listarProximosStatusPossiveis(
    demanda.status,
    usuario.perfil,
    ehResponsavel
  ).map((status) => ({ valor: status, descricao: rotuloStatus[status] }));

  // O Membro da Equipe nao edita os dados da demanda.
  const podeEditar =
    (usuario.perfil === 'ADMINISTRADOR' || usuario.perfil === 'LIDER') &&
    demanda.status !== 'CONCLUIDA' &&
    demanda.status !== 'CANCELADA';

  res.json({
    demanda: {
      id: demanda.id,
      titulo: demanda.titulo,
      descricao: demanda.descricao,
      tipo: demanda.tipo,
      tipoDescricao: rotuloTipo[demanda.tipo],
      prioridade: demanda.prioridade,
      prioridadeDescricao: rotuloPrioridade[demanda.prioridade],
      status: demanda.status,
      statusDescricao: rotuloStatus[demanda.status],
      projeto: { id: demanda.projeto_id, nome: demanda.projeto_nome },
      responsavel: demanda.responsavel_id
        ? { id: demanda.responsavel_id, nome: demanda.responsavel_nome }
        : null,
      criadoPor: demanda.criado_por_nome,
      criadoEm: demanda.criado_em,
      atualizadoEm: demanda.atualizado_em,
      prazoFinalizacao: demanda.prazo_finalizacao,
    },

    comentarios: comentarios.map((comentario) => ({
      id: comentario.id,
      texto: comentario.texto,
      criadoEm: comentario.criado_em,
      autor: { id: comentario.usuario_id, nome: comentario.usuario_nome },
    })),

    historico: historico.map((registro) => ({
      id: registro.id,
      campoAlterado: registro.campo_alterado,
      valorAnterior: registro.valor_anterior,
      valorNovo: registro.valor_novo,
      criadoEm: registro.criado_em,
      autor: registro.usuario_nome,
    })),

    // Informacoes que a tela usa para decidir quais acoes exibir.
    acoesPermitidas: {
      podeEditar,
      proximosStatus,
    },
  });
}
