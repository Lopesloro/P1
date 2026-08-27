/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Controlador de autenticacao: login e consulta do usuario logado.
 *
 * Um controlador e a funcao que responde a uma rota. Ele recebe a
 * requisicao, chama as regras de negocio, conversa com o banco e devolve
 * a resposta em JSON.
 */

import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { senhaConfere } from '../servicos/senhas';
import { gerarToken } from '../servicos/token';
import { rotuloPerfil } from '../servicos/rotulos';
import { ErroDaAplicacao, PerfilUsuario } from '../tipos';

/** Formato da linha lida da tabela usuarios. */
interface LinhaUsuario extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: PerfilUsuario;
  ativo: number;
}

/**
 * POST /api/autenticacao/login
 *
 * Recebe:  { "email": "...", "senha": "..." }
 * Devolve: { "token": "...", "usuario": { ... } }
 *
 * Como testar pelo terminal:
 *   curl -X POST http://localhost:3000/api/autenticacao/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"eduardo@time11.com","senha":"admin123"}'
 */
export async function fazerLogin(req: Request, res: Response): Promise<void> {
  const { email, senha } = req.body as { email?: string; senha?: string };

  // Validacao dos campos obrigatorios. O frontend tambem valida, mas
  // a validacao do backend e a que realmente protege o sistema.
  if (!email || email.trim() === '') {
    throw new ErroDaAplicacao(400, 'Informe o e-mail para entrar no sistema.');
  }

  if (!senha || senha.trim() === '') {
    throw new ErroDaAplicacao(400, 'Informe a senha para entrar no sistema.');
  }

  const [linhas] = await bancoDeDados.query<LinhaUsuario[]>(
    `SELECT id, nome, email, senha_hash, perfil, ativo
       FROM usuarios
      WHERE email = ?
      LIMIT 1`,
    [email.trim().toLowerCase()]
  );

  const usuario = linhas[0];

  /*
   * Detalhe de seguranca: quando o e-mail nao existe e quando a senha
   * esta errada, devolvemos exatamente a mesma mensagem. Se a mensagem
   * fosse diferente, alguem poderia descobrir quais e-mails estao
   * cadastrados no sistema testando um por um.
   */
  const mensagemDeErroDeLogin = 'E-mail ou senha incorretos. Confira os dados e tente novamente.';

  if (!usuario) {
    throw new ErroDaAplicacao(401, mensagemDeErroDeLogin);
  }

  if (usuario.ativo !== 1) {
    throw new ErroDaAplicacao(
      403,
      'Este usuario esta inativo. Procure o administrador do sistema.'
    );
  }

  const senhaEstaCorreta = await senhaConfere(senha, usuario.senha_hash);

  if (!senhaEstaCorreta) {
    throw new ErroDaAplicacao(401, mensagemDeErroDeLogin);
  }

  const dadosDoUsuario = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };

  res.json({
    token: gerarToken(dadosDoUsuario),
    usuario: {
      ...dadosDoUsuario,
      perfilDescricao: rotuloPerfil[usuario.perfil],
    },
  });
}

/**
 * GET /api/autenticacao/eu
 *
 * Devolve os dados do usuario logado. O frontend usa esta rota ao abrir
 * cada tela para confirmar que o token guardado ainda e valido.
 */
export async function usuarioLogado(req: Request, res: Response): Promise<void> {
  // O middleware exigirLogin ja garantiu que req.usuario existe.
  const usuario = req.usuario!;

  res.json({
    usuario: {
      ...usuario,
      perfilDescricao: rotuloPerfil[usuario.perfil],
    },
  });
}
