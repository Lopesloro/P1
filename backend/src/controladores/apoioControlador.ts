/**
 * Autor exclusivo deste arquivo: Jose Gabriel Bedani
 *
 * Consultas de apoio usadas para preencher as listas de escolha das telas:
 * projetos e usuarios.
 *
 * O documento de visao permite que projetos e usuarios sejam cadastrados
 * diretamente no banco, entao aqui existe apenas leitura. Nao ha cadastro,
 * edicao nem exclusao dessas duas entidades.
 */

import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { ehAdministrador } from '../servicos/permissoes';
import { rotuloPerfil } from '../servicos/rotulos';
import { ErroDaAplicacao, PerfilUsuario } from '../tipos';

/**
 * GET /api/projetos
 *
 * Lista os projetos que o usuario logado pode enxergar.
 * O Administrador ve todos; os demais veem apenas aqueles aos quais
 * estao vinculados na tabela projeto_usuarios.
 */
export async function listarProjetos(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;

  // O administrador enxerga todos os projetos ativos.
  if (ehAdministrador(usuario.perfil)) {
    const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
      `SELECT id, nome, descricao
         FROM projetos
        WHERE ativo = 1
        ORDER BY nome ASC`
    );

    res.json({ projetos: linhas });
    return;
  }

  // Os demais perfis enxergam apenas os projetos vinculados a eles.
  const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT projetos.id, projetos.nome, projetos.descricao
       FROM projetos
       INNER JOIN projeto_usuarios
               ON projeto_usuarios.projeto_id = projetos.id
      WHERE projeto_usuarios.usuario_id = ?
        AND projetos.ativo = 1
      ORDER BY projetos.nome ASC`,
    [usuario.id]
  );

  res.json({ projetos: linhas });
}

/**
 * GET /api/usuarios
 *
 * Lista os usuarios ativos, usada para preencher o campo "responsavel"
 * do formulario de demanda e o filtro por responsavel da listagem.
 *
 * Parametro opcional na URL:
 *   projetoId - devolve apenas os usuarios vinculados ao projeto informado.
 *
 * Exemplo:
 *   GET /api/usuarios?projetoId=1
 */
export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;
  const projetoId = req.query.projetoId ? Number(req.query.projetoId) : null;

  if (projetoId !== null && (!Number.isInteger(projetoId) || projetoId <= 0)) {
    throw new ErroDaAplicacao(400, 'O codigo do projeto informado nao e valido.');
  }

  // Quando o projeto e informado, filtramos pelos participantes dele.
  if (projetoId !== null) {
    const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
      `SELECT usuarios.id, usuarios.nome, usuarios.email, usuarios.perfil
         FROM usuarios
         INNER JOIN projeto_usuarios
                 ON projeto_usuarios.usuario_id = usuarios.id
        WHERE projeto_usuarios.projeto_id = ?
          AND usuarios.ativo = 1
        ORDER BY usuarios.nome ASC`,
      [projetoId]
    );

    res.json({ usuarios: montarResposta(linhas) });
    return;
  }

  /*
   * Sem o projeto informado, o Administrador ve todos os usuarios e os
   * demais perfis veem apenas quem participa dos mesmos projetos que eles.
   * Isso evita que um usuario comum consiga listar todas as pessoas
   * cadastradas no sistema.
   */
  if (ehAdministrador(usuario.perfil)) {
    const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
      `SELECT id, nome, email, perfil
         FROM usuarios
        WHERE ativo = 1
        ORDER BY nome ASC`
    );

    res.json({ usuarios: montarResposta(linhas) });
    return;
  }

  const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT DISTINCT usuarios.id, usuarios.nome, usuarios.email, usuarios.perfil
       FROM usuarios
       INNER JOIN projeto_usuarios AS vinculo_do_colega
               ON vinculo_do_colega.usuario_id = usuarios.id
      WHERE usuarios.ativo = 1
        AND vinculo_do_colega.projeto_id IN (
              SELECT projeto_id
                FROM projeto_usuarios
               WHERE usuario_id = ?
            )
      ORDER BY usuarios.nome ASC`,
    [usuario.id]
  );

  res.json({ usuarios: montarResposta(linhas) });
}

/** Acrescenta a descricao do perfil em cada usuario da lista. */
function montarResposta(linhas: RowDataPacket[]) {
  return linhas.map((linha) => ({
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    perfil: linha.perfil,
    perfilDescricao: rotuloPerfil[linha.perfil as PerfilUsuario],
  }));
}
