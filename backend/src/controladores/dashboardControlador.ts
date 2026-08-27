/**
 * Autor exclusivo deste arquivo: Jose Gabriel Bedani
 *
 * Dados da tela inicial (dashboard), conforme o item 2.4 do documento
 * de visao.
 *
 * A tela precisa mostrar:
 * - total de demandas;
 * - quantidade por status (aberta, em andamento, em revisao, concluida, cancelada);
 * - quantidade por prioridade;
 * - quantidade por tipo;
 * - demandas criticas ainda em aberto;
 * - demandas proximas do prazo de finalizacao.
 *
 * Todos os numeros respeitam a permissao do usuario: o Administrador ve
 * o sistema inteiro, enquanto Lider e Membro veem apenas os projetos aos
 * quais estao vinculados.
 */

import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { condicaoDeProjetosVisiveis } from '../servicos/permissoes';
import { rotuloPrioridade, rotuloStatus, rotuloTipo } from '../servicos/rotulos';
import {
  PrioridadeDemanda,
  StatusDemanda,
  TipoDemanda,
} from '../tipos';

/** Quantos dias a frente contam como "proximo do prazo". */
const DIAS_PARA_ALERTA_DE_PRAZO = 7;

/**
 * Transforma o resultado de um GROUP BY em um objeto simples.
 *
 * O banco devolve linhas como:
 *   [{ chave: 'ABERTA', quantidade: 5 }, { chave: 'CONCLUIDA', quantidade: 2 }]
 *
 * E precisamos de:
 *   { ABERTA: 5, EM_ANDAMENTO: 0, EM_REVISAO: 0, CONCLUIDA: 2, CANCELADA: 0 }
 *
 * A lista de valores possiveis entra como parametro para que os status
 * sem nenhuma demanda aparecam com zero, em vez de sumirem da tela.
 */
function montarContagem<T extends string>(
  linhas: RowDataPacket[],
  valoresPossiveis: T[]
): Record<T, number> {
  const contagem = {} as Record<T, number>;

  for (const valor of valoresPossiveis) {
    contagem[valor] = 0;
  }

  for (const linha of linhas) {
    const chave = linha.chave as T;
    if (chave in contagem) {
      contagem[chave] = Number(linha.quantidade);
    }
  }

  return contagem;
}

/**
 * GET /api/dashboard
 *
 * Como testar pelo terminal:
 *   curl http://localhost:3000/api/dashboard -H "Authorization: Bearer SEU_TOKEN"
 */
export async function obterDadosDoDashboard(
  req: Request,
  res: Response
): Promise<void> {
  const usuario = req.usuario!;

  // Condicao que limita os numeros aos projetos visiveis para este usuario.
  const restricao = condicaoDeProjetosVisiveis(usuario);

  // -------------------------------------------------------------------
  // Contagem por status
  // -------------------------------------------------------------------
  const [linhasStatus] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT demandas.status AS chave, COUNT(*) AS quantidade
       FROM demandas
      WHERE ${restricao.sql}
      GROUP BY demandas.status`,
    restricao.valores
  );

  const porStatus = montarContagem<StatusDemanda>(linhasStatus, [
    'ABERTA',
    'EM_ANDAMENTO',
    'EM_REVISAO',
    'CONCLUIDA',
    'CANCELADA',
  ]);

  // -------------------------------------------------------------------
  // Contagem por prioridade
  // -------------------------------------------------------------------
  const [linhasPrioridade] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT demandas.prioridade AS chave, COUNT(*) AS quantidade
       FROM demandas
      WHERE ${restricao.sql}
      GROUP BY demandas.prioridade`,
    restricao.valores
  );

  const porPrioridade = montarContagem<PrioridadeDemanda>(linhasPrioridade, [
    'CRITICA',
    'ALTA',
    'MEDIA',
    'BAIXA',
  ]);

  // -------------------------------------------------------------------
  // Contagem por tipo
  // -------------------------------------------------------------------
  const [linhasTipo] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT demandas.tipo AS chave, COUNT(*) AS quantidade
       FROM demandas
      WHERE ${restricao.sql}
      GROUP BY demandas.tipo`,
    restricao.valores
  );

  const porTipo = montarContagem<TipoDemanda>(linhasTipo, [
    'TAREFA',
    'DEFEITO',
    'MELHORIA',
    'DOCUMENTACAO',
  ]);

  // -------------------------------------------------------------------
  // Demandas criticas que ainda nao foram resolvidas.
  // "Em aberto" aqui significa qualquer status que ainda esteja em
  // andamento no fluxo: aberta, em andamento ou em revisao.
  // -------------------------------------------------------------------
  const [demandasCriticas] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT demandas.id,
            demandas.titulo,
            demandas.status,
            projetos.nome AS projeto_nome,
            demandas.prazo_finalizacao
       FROM demandas
       INNER JOIN projetos ON projetos.id = demandas.projeto_id
      WHERE ${restricao.sql}
        AND demandas.prioridade = 'CRITICA'
        AND demandas.status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_REVISAO')
      ORDER BY demandas.prazo_finalizacao IS NULL,
               demandas.prazo_finalizacao ASC`,
    restricao.valores
  );

  // -------------------------------------------------------------------
  // Demandas proximas do prazo de finalizacao.
  //
  // A condicao pega as demandas cujo prazo cai entre hoje e os proximos
  // sete dias, alem das que ja passaram do prazo e continuam pendentes.
  // CURDATE() e a funcao do MySQL que devolve a data de hoje.
  // -------------------------------------------------------------------
  const [demandasProximasDoPrazo] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT demandas.id,
            demandas.titulo,
            demandas.status,
            demandas.prioridade,
            projetos.nome AS projeto_nome,
            demandas.prazo_finalizacao,
            -- Numero de dias entre hoje e o prazo.
            -- Valor negativo significa que o prazo ja passou.
            DATEDIFF(demandas.prazo_finalizacao, CURDATE()) AS dias_restantes
       FROM demandas
       INNER JOIN projetos ON projetos.id = demandas.projeto_id
      WHERE ${restricao.sql}
        AND demandas.prazo_finalizacao IS NOT NULL
        AND demandas.status IN ('ABERTA', 'EM_ANDAMENTO', 'EM_REVISAO')
        AND demandas.prazo_finalizacao <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY demandas.prazo_finalizacao ASC`,
    [...restricao.valores, DIAS_PARA_ALERTA_DE_PRAZO]
  );

  const total =
    porStatus.ABERTA +
    porStatus.EM_ANDAMENTO +
    porStatus.EM_REVISAO +
    porStatus.CONCLUIDA +
    porStatus.CANCELADA;

  res.json({
    total,
    porStatus,
    porPrioridade,
    porTipo,

    diasParaAlertaDePrazo: DIAS_PARA_ALERTA_DE_PRAZO,

    demandasCriticasEmAberto: demandasCriticas.map((linha) => ({
      id: linha.id,
      titulo: linha.titulo,
      status: linha.status,
      statusDescricao: rotuloStatus[linha.status as StatusDemanda],
      projeto: linha.projeto_nome,
      prazoFinalizacao: linha.prazo_finalizacao,
    })),

    demandasProximasDoPrazo: demandasProximasDoPrazo.map((linha) => ({
      id: linha.id,
      titulo: linha.titulo,
      status: linha.status,
      statusDescricao: rotuloStatus[linha.status as StatusDemanda],
      prioridade: linha.prioridade,
      prioridadeDescricao: rotuloPrioridade[linha.prioridade as PrioridadeDemanda],
      projeto: linha.projeto_nome,
      prazoFinalizacao: linha.prazo_finalizacao,
      diasRestantes: Number(linha.dias_restantes),
    })),

    // Enviado junto para a tela poder montar legendas sem repetir
    // as traducoes no JavaScript do frontend.
    descricoes: {
      status: rotuloStatus,
      prioridade: rotuloPrioridade,
      tipo: rotuloTipo,
    },
  });
}
