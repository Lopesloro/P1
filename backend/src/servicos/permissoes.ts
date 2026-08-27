/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Regras de permissao por perfil de usuario.
 *
 * Resumo das permissoes descritas no documento de visao:
 *
 *   ADMINISTRADOR  Ve todos os projetos, usuarios e demandas.
 *                  Cria, edita, cancela, atribui responsavel,
 *                  altera prioridade e status.
 *
 *   LIDER          Mesmas acoes do administrador, porem restritas aos
 *                  projetos aos quais ele esta vinculado.
 *
 *   MEMBRO         Somente leitura das demandas dos projetos aos quais
 *                  esta vinculado, mais comentarios e a mudanca de status
 *                  das demandas atribuidas a ele.
 *
 * Estas funcoes rodam no backend. Nunca confiamos apenas no que a tela
 * mostra ou esconde, porque qualquer pessoa consegue chamar a API
 * diretamente sem passar pelo navegador.
 */

import { RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { PerfilUsuario, UsuarioAutenticado } from '../tipos';

/** O administrador enxerga o sistema inteiro. */
export function ehAdministrador(perfil: PerfilUsuario): boolean {
  return perfil === 'ADMINISTRADOR';
}

/** Somente Administrador e Lider cadastram novas demandas. */
export function podeCriarDemanda(perfil: PerfilUsuario): boolean {
  return perfil === 'ADMINISTRADOR' || perfil === 'LIDER';
}

/**
 * Somente Administrador e Lider editam os dados da demanda
 * (titulo, descricao, tipo, prioridade, responsavel e prazo).
 * O Membro da Equipe altera apenas o status das demandas dele.
 */
export function podeEditarDemanda(perfil: PerfilUsuario): boolean {
  return perfil === 'ADMINISTRADOR' || perfil === 'LIDER';
}

/**
 * Verifica se o usuario esta vinculado a um projeto.
 * O administrador sempre tem acesso, mesmo sem vinculo cadastrado.
 */
export async function usuarioTemAcessoAoProjeto(
  usuario: UsuarioAutenticado,
  projetoId: number
): Promise<boolean> {
  if (ehAdministrador(usuario.perfil)) {
    return true;
  }

  const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT 1
       FROM projeto_usuarios
      WHERE projeto_id = ?
        AND usuario_id = ?
      LIMIT 1`,
    [projetoId, usuario.id]
  );

  return linhas.length > 0;
}

/**
 * Monta o trecho de SQL que limita a consulta aos projetos que o usuario
 * pode enxergar.
 *
 * Por que isso e necessario:
 * a listagem de demandas e o dashboard precisam filtrar por projeto em
 * varias consultas diferentes. Em vez de repetir a mesma condicao em cada
 * uma delas, geramos o trecho aqui e reaproveitamos.
 *
 * Devolve um objeto com o texto da condicao e os valores que serao
 * colocados no lugar dos pontos de interrogacao.
 *
 * Para o administrador a condicao e "1 = 1", que significa "sem restricao".
 */
export function condicaoDeProjetosVisiveis(usuario: UsuarioAutenticado): {
  sql: string;
  valores: unknown[];
} {
  if (ehAdministrador(usuario.perfil)) {
    return { sql: '1 = 1', valores: [] };
  }

  return {
    sql: `demandas.projeto_id IN (
            SELECT projeto_id
              FROM projeto_usuarios
             WHERE usuario_id = ?
          )`,
    valores: [usuario.id],
  };
}
