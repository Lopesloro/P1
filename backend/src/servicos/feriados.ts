/**
 * Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
 *
 * Integracao com a API externa de feriados nacionais.
 *
 * Exigencia do documento de visao (item 2.2.5):
 * o prazo de finalizacao da demanda nao pode cair em um feriado nacional.
 * A verificacao precisa ser feita por uma API externa.
 *
 * API utilizada: BrasilAPI - https://brasilapi.com.br/docs
 * Endereco: GET https://brasilapi.com.br/api/feriados/v1/{ano}
 * Nao exige cadastro nem chave de acesso.
 *
 * Exemplo de resposta:
 *   [
 *     { "date": "2026-01-01", "name": "Confraternizacao mundial", "type": "national" },
 *     { "date": "2026-04-21", "name": "Tiradentes",               "type": "national" }
 *   ]
 *
 * Para evitar chamar a API a cada cadastro, guardamos os feriados de cada
 * ano na memoria do servidor. A lista de feriados de um ano nao muda, entao
 * basta buscar uma vez por ano consultado.
 */

import { ambiente } from '../configuracao/ambiente';
import { ErroDaAplicacao } from '../tipos';

/** Formato de cada feriado devolvido pela API externa. */
interface FeriadoDaApi {
  date: string;
  name: string;
  type: string;
}

/**
 * Memoria dos anos ja consultados.
 * A chave e o ano e o valor e um mapa de "data -> nome do feriado".
 */
const feriadosPorAno = new Map<number, Map<string, string>>();

/** Quanto tempo esperamos pela resposta da API antes de desistir. */
const TEMPO_LIMITE_EM_MILISSEGUNDOS = 8000;

/**
 * Busca na API externa todos os feriados nacionais de um ano.
 * Guarda o resultado na memoria para as proximas consultas.
 */
async function buscarFeriadosDoAno(ano: number): Promise<Map<string, string>> {
  // Se ja consultamos este ano antes, devolvemos o que esta na memoria.
  const jaConsultado = feriadosPorAno.get(ano);
  if (jaConsultado) {
    return jaConsultado;
  }

  // O AbortController cancela a requisicao se a API demorar demais.
  const cancelador = new AbortController();
  const disparoDoTempoLimite = setTimeout(
    () => cancelador.abort(),
    TEMPO_LIMITE_EM_MILISSEGUNDOS
  );

  try {
    const resposta = await fetch(`${ambiente.urlApiFeriados}/${ano}`, {
      signal: cancelador.signal,
    });

    if (!resposta.ok) {
      throw new Error(`A API de feriados respondeu com o codigo ${resposta.status}.`);
    }

    const listaDeFeriados = (await resposta.json()) as FeriadoDaApi[];

    // Monta o mapa "2026-01-01" -> "Confraternizacao mundial".
    const mapaDeFeriados = new Map<string, string>();
    for (const feriado of listaDeFeriados) {
      mapaDeFeriados.set(feriado.date, feriado.name);
    }

    feriadosPorAno.set(ano, mapaDeFeriados);
    return mapaDeFeriados;
  } catch (erro) {
    // Registramos o erro tecnico no console, para o desenvolvedor,
    // e devolvemos uma mensagem simples para o usuario.
    console.error('[feriados] Falha ao consultar a API externa:', erro);

    throw new ErroDaAplicacao(
      503,
      'Nao foi possivel verificar os feriados nacionais no momento. ' +
        'Verifique sua conexao com a internet e tente novamente.'
    );
  } finally {
    clearTimeout(disparoDoTempoLimite);
  }
}

/** Resultado da verificacao de uma data. */
export interface ResultadoFeriado {
  ehFeriado: boolean;
  nomeDoFeriado?: string;
}

/**
 * Verifica se uma data e feriado nacional.
 *
 * O que entra: a data no formato AAAA-MM-DD, por exemplo '2026-12-25'.
 * O que sai:   { ehFeriado: true, nomeDoFeriado: 'Natal' } ou
 *              { ehFeriado: false }
 *
 * Como testar pelo terminal, com o servidor rodando:
 *   curl "http://localhost:3000/api/feriados/verificar?data=2026-12-25"
 */
export async function verificarSeEhFeriado(data: string): Promise<ResultadoFeriado> {
  // O ano fica nos quatro primeiros caracteres de '2026-12-25'.
  const ano = Number(data.substring(0, 4));

  const feriadosDoAno = await buscarFeriadosDoAno(ano);
  const nomeDoFeriado = feriadosDoAno.get(data);

  if (nomeDoFeriado) {
    return { ehFeriado: true, nomeDoFeriado };
  }

  return { ehFeriado: false };
}

/**
 * Confere o prazo informado e interrompe a operacao quando a data
 * cai em um feriado nacional.
 *
 * Usada pelo cadastro e pela edicao de demandas.
 * Quando o prazo vem vazio, nao ha o que validar.
 */
export async function validarPrazoDeFinalizacao(
  prazo: string | null | undefined
): Promise<void> {
  if (!prazo) {
    return;
  }

  const resultado = await verificarSeEhFeriado(prazo);

  if (resultado.ehFeriado) {
    throw new ErroDaAplicacao(
      400,
      `A data informada e um feriado nacional (${resultado.nomeDoFeriado}). ` +
        'Escolha outra data para o prazo de finalizacao.'
    );
  }
}
