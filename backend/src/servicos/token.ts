/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Geracao e leitura do token de login (JWT).
 *
 * Como funciona, de forma simples:
 * 1. O usuario faz login com e-mail e senha.
 * 2. Se estiver correto, o backend gera um token: um texto assinado com uma
 *    chave secreta que so o servidor conhece.
 * 3. O frontend guarda esse token e o envia em toda requisicao seguinte.
 * 4. O backend confere a assinatura. Se alguem tentar alterar o token para
 *    virar administrador, a assinatura deixa de bater e o acesso e negado.
 */

import jwt from 'jsonwebtoken';
import { ambiente } from '../configuracao/ambiente';
import { ErroDaAplicacao, UsuarioAutenticado } from '../tipos';

/** Cria o token que sera devolvido ao usuario depois do login. */
export function gerarToken(usuario: UsuarioAutenticado): string {
  return jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
    ambiente.chaveSecretaToken,
    { expiresIn: ambiente.validadeToken } as jwt.SignOptions
  );
}

/**
 * Confere o token recebido e devolve os dados do usuario.
 * Lanca erro 401 quando o token e invalido ou ja expirou.
 */
export function lerToken(token: string): UsuarioAutenticado {
  try {
    const conteudo = jwt.verify(token, ambiente.chaveSecretaToken) as UsuarioAutenticado;

    return {
      id: conteudo.id,
      nome: conteudo.nome,
      email: conteudo.email,
      perfil: conteudo.perfil,
    };
  } catch {
    throw new ErroDaAplicacao(401, 'Sessao expirada ou invalida. Faca login novamente.');
  }
}
