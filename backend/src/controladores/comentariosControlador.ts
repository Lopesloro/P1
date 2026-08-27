/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 *
 * Registro de comentarios em uma demanda (item 2.2.6 do documento de visao).
 *
 * Todos os perfis podem comentar nas demandas dos projetos aos quais
 * estao vinculados. O comentario guarda quem escreveu e a data e hora,
 * e nunca e apagado.
 */

import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { usuarioTemAcessoAoProjeto } from '../servicos/permissoes';
import { ErroDaAplicacao } from '../tipos';

const TAMANHO_MAXIMO_DO_COMENTARIO = 2000;

/**
 * POST /api/demandas/:id/comentarios
 *
 * Recebe:  { "texto": "..." }
 * Devolve: o comentario recem gravado, ja com autor e data,
 *          para que a tela possa exibi-lo sem recarregar a pagina.
 */
export async function criarComentario(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;
  const demandaId = Number(req.params.id);

  if (!Number.isInteger(demandaId) || demandaId <= 0) {
    throw new ErroDaAplicacao(400, 'O codigo da demanda informado nao e valido.');
  }

  // Validacao do texto do comentario.
  const texto = req.body.texto;

  if (typeof texto !== 'string' || texto.trim() === '') {
    throw new ErroDaAplicacao(400, 'Escreva o comentario antes de enviar.');
  }

  const textoLimpo = texto.trim();

  if (textoLimpo.length > TAMANHO_MAXIMO_DO_COMENTARIO) {
    throw new ErroDaAplicacao(
      400,
      `O comentario deve ter no maximo ${TAMANHO_MAXIMO_DO_COMENTARIO} caracteres.`
    );
  }

  // Confere se a demanda existe e a qual projeto ela pertence.
  const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
    'SELECT projeto_id FROM demandas WHERE id = ? LIMIT 1',
    [demandaId]
  );

  if (linhas.length === 0) {
    throw new ErroDaAplicacao(404, 'Demanda nao encontrada.');
  }

  const projetoId = linhas[0].projeto_id as number;

  const temAcesso = await usuarioTemAcessoAoProjeto(usuario, projetoId);
  if (!temAcesso) {
    throw new ErroDaAplicacao(
      403,
      'Voce nao tem acesso as demandas deste projeto.'
    );
  }

  const [resultado] = await bancoDeDados.query<ResultSetHeader>(
    `INSERT INTO comentarios (demanda_id, usuario_id, texto)
     VALUES (?, ?, ?)`,
    [demandaId, usuario.id, textoLimpo]
  );

  // Le a data gravada pelo banco para devolver o valor exato que
  // ficou salvo, em vez de calcular a data no JavaScript.
  const [comentarioGravado] = await bancoDeDados.query<RowDataPacket[]>(
    'SELECT criado_em FROM comentarios WHERE id = ? LIMIT 1',
    [resultado.insertId]
  );

  res.status(201).json({
    mensagem: 'Comentario registrado com sucesso.',
    comentario: {
      id: resultado.insertId,
      texto: textoLimpo,
      criadoEm: comentarioGravado[0].criado_em,
      autor: { id: usuario.id, nome: usuario.nome },
    },
  });
}
