/**
 * Autor exclusivo deste arquivo: Enzo Carleti Teixeira
 *
 * Tratamento central de erros.
 *
 * Em vez de escrever try/catch com resposta de erro dentro de cada
 * controlador, todos os erros sobem para este arquivo. Aqui decidimos
 * qual codigo HTTP devolver e qual mensagem o usuario vai ler.
 *
 * Regra importante de seguranca: o usuario nunca recebe a mensagem tecnica
 * do erro. Detalhes de banco de dados, nomes de tabela ou trechos de
 * consulta podem ajudar alguem a atacar o sistema. O detalhe tecnico e
 * gravado no console do servidor, para o desenvolvedor; o usuario recebe
 * um texto simples e compreensivel.
 */

import { NextFunction, Request, Response } from 'express';
import { ErroDaAplicacao } from '../tipos';

/**
 * Envolve um controlador assincrono para que erros lancados dentro dele
 * cheguem ao tratador de erros do Express.
 *
 * Sem isso, um erro dentro de uma funcao async seria ignorado e a
 * requisicao ficaria travada sem resposta.
 *
 * Uso:
 *   router.get('/demandas', capturarErros(listarDemandas));
 */
export function capturarErros(
  controlador: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    controlador(req, res, next).catch(next);
  };
}

/** Rota nao encontrada: devolve 404 com uma mensagem clara. */
export function rotaNaoEncontrada(req: Request, res: Response): void {
  res.status(404).json({
    erro: `O endereco ${req.method} ${req.originalUrl} nao existe nesta API.`,
  });
}

/**
 * Tratador de erros do Express.
 *
 * O Express reconhece esta funcao como tratador de erros porque ela tem
 * quatro parametros. O parametro _next precisa existir mesmo sem ser usado.
 */
export function tratarErros(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erros que nos mesmos criamos ja trazem o codigo e a mensagem prontos
  // para o usuario ler.
  if (erro instanceof ErroDaAplicacao) {
    res.status(erro.codigoHttp).json({ erro: erro.message });
    return;
  }

  // Qualquer outro erro e inesperado. Registramos o detalhe tecnico
  // no console e devolvemos uma mensagem generica.
  console.error('[erro inesperado]', erro);

  res.status(500).json({
    erro:
      'Ocorreu um erro inesperado no servidor. Tente novamente em alguns ' +
      'instantes. Se o problema continuar, avise o responsavel pelo sistema.',
  });
}
