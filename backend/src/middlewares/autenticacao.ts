/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Middleware de autenticacao.
 *
 * Um middleware e uma funcao que roda antes do controlador. Este aqui
 * confere o token de login e, se estiver tudo certo, coloca os dados do
 * usuario dentro da requisicao (req.usuario) para que os controladores
 * saibam quem esta chamando a rota.
 *
 * Todas as rotas protegidas passam por aqui. Se o token estiver ausente,
 * vencido ou adulterado, a requisicao e recusada com o codigo 401 e o
 * controlador nem chega a ser executado.
 */

import { NextFunction, Request, Response } from 'express';
import { lerToken } from '../servicos/token';
import { ErroDaAplicacao, PerfilUsuario } from '../tipos';

/**
 * Exige que a requisicao traga um token valido.
 *
 * O frontend envia o token no cabecalho Authorization, assim:
 *   Authorization: Bearer <token>
 */
export function exigirLogin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    throw new ErroDaAplicacao(401, 'E necessario estar logado para acessar esta area.');
  }

  // Remove a palavra "Bearer " e fica apenas com o token.
  const token = cabecalho.substring('Bearer '.length).trim();

  // lerToken lanca erro 401 quando o token nao e valido.
  req.usuario = lerToken(token);

  // Chama a proxima etapa: outro middleware ou o controlador.
  next();
}

/**
 * Exige que o usuario logado tenha um dos perfis informados.
 *
 * Exemplo de uso em uma rota:
 *   router.post('/projetos', exigirLogin, exigirPerfil('ADMINISTRADOR'), criar);
 */
export function exigirPerfil(...perfisAceitos: PerfilUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Este middleware sempre roda depois do exigirLogin,
    // entao req.usuario ja deve estar preenchido.
    if (!req.usuario) {
      throw new ErroDaAplicacao(401, 'E necessario estar logado para acessar esta area.');
    }

    if (!perfisAceitos.includes(req.usuario.perfil)) {
      throw new ErroDaAplicacao(
        403,
        'Seu perfil de acesso nao permite realizar esta acao.'
      );
    }

    next();
  };
}
