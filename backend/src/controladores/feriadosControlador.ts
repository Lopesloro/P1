/**
 * Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
 *
 * Rota de consulta de feriado nacional.
 *
 * O formulario de demanda usa esta rota para avisar o usuario no momento
 * em que ele escolhe a data, antes de tentar salvar. A validacao que
 * realmente impede a gravacao continua sendo feita no cadastro e na
 * edicao da demanda, porque a verificacao do frontend serve apenas para
 * dar um aviso rapido e pode ser contornada.
 */

import { Request, Response } from 'express';
import { verificarSeEhFeriado } from '../servicos/feriados';
import { ErroDaAplicacao } from '../tipos';

/**
 * GET /api/feriados/verificar?data=2026-12-25
 *
 * Devolve:
 *   { "data": "2026-12-25", "ehFeriado": true, "nomeDoFeriado": "Natal" }
 */
export async function verificarFeriado(req: Request, res: Response): Promise<void> {
  const data = req.query.data;

  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new ErroDaAplicacao(
      400,
      'Informe a data no formato ano-mes-dia, por exemplo 2026-12-25.'
    );
  }

  const resultado = await verificarSeEhFeriado(data);

  res.json({
    data,
    ehFeriado: resultado.ehFeriado,
    nomeDoFeriado: resultado.nomeDoFeriado ?? null,
  });
}
