/**
 * Autor exclusivo deste arquivo: Enzo Carleti Teixeira
 *
 * Listagem de demandas com filtros, busca por texto e ordenacao.
 *
 * Atende aos itens 2.2.9 e 2.3 do documento de visao:
 * - listar as demandas com as informacoes principais;
 * - filtrar por status, prioridade, tipo, responsavel e projeto;
 * - buscar por texto no titulo ou na descricao;
 * - ordenar por prioridade, data de criacao, prazo ou status.
 *
 * Ponto importante de seguranca:
 * os valores digitados pelo usuario nunca sao colados dentro do texto do
 * SQL. Eles entram como parametros, representados pelos pontos de
 * interrogacao. E assim que o sistema fica protegido contra SQL Injection,
 * que e o ataque em que alguem digita um pedaco de comando SQL dentro de
 * um campo do formulario para tentar ler ou apagar dados.
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

/** Formato de cada linha devolvida pela consulta de listagem. */
interface LinhaDemanda extends RowDataPacket {
  id: number;
  titulo: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  projeto_id: number;
  projeto_nome: string;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  criado_em: string;
  prazo_finalizacao: string | null;
}

/*
 * Colunas pelas quais a listagem pode ser ordenada.
 *
 * Esta lista funciona como uma "lista de permissao": o nome que o usuario
 * envia e apenas uma chave deste objeto, e o que vai para o SQL e o texto
 * escrito por nos. Isso e necessario porque o nome da coluna de ordenacao
 * nao pode entrar como parametro no SQL.
 */
const ordenacoesPermitidas: Record<string, string> = {
  // A coluna prioridade foi declarada no banco na ordem
  // BAIXA, MEDIA, ALTA, CRITICA. Ordenar de forma decrescente
  // coloca as demandas criticas no topo da lista.
  prioridade: 'demandas.prioridade DESC',

  criacao: 'demandas.criado_em DESC',

  // Demandas sem prazo vao para o final da lista.
  prazo: 'demandas.prazo_finalizacao IS NULL, demandas.prazo_finalizacao ASC',

  // A coluna status segue a ordem do fluxo de trabalho.
  status: 'demandas.status ASC',

  titulo: 'demandas.titulo ASC',
};

/**
 * GET /api/demandas
 *
 * Parametros aceitos na URL (todos opcionais):
 *   status       ABERTA | EM_ANDAMENTO | EM_REVISAO | CONCLUIDA | CANCELADA
 *   prioridade   BAIXA | MEDIA | ALTA | CRITICA
 *   tipo         TAREFA | DEFEITO | MELHORIA | DOCUMENTACAO
 *   projetoId    numero do projeto
 *   responsavelId numero do usuario, ou a palavra "sem" para as demandas
 *                 que ainda nao tem responsavel
 *   busca        texto procurado no titulo ou na descricao
 *   ordenarPor   prioridade | criacao | prazo | status | titulo
 *
 * Exemplo:
 *   GET /api/demandas?status=ABERTA&prioridade=CRITICA&ordenarPor=prazo
 */
export async function listarDemandas(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;

  // Comeca com a condicao que limita a consulta aos projetos que este
  // usuario pode enxergar. O administrador enxerga todos.
  const restricaoDeProjetos = condicaoDeProjetosVisiveis(usuario);

  const condicoes: string[] = [restricaoDeProjetos.sql];
  const valores: unknown[] = [...restricaoDeProjetos.valores];

  // ---------------------------------------------------------------------
  // Filtros simples: so entram na consulta quando foram preenchidos.
  // ---------------------------------------------------------------------
  const { status, prioridade, tipo, projetoId, responsavelId, busca, ordenarPor } =
    req.query as Record<string, string | undefined>;

  if (status) {
    condicoes.push('demandas.status = ?');
    valores.push(status);
  }

  if (prioridade) {
    condicoes.push('demandas.prioridade = ?');
    valores.push(prioridade);
  }

  if (tipo) {
    condicoes.push('demandas.tipo = ?');
    valores.push(tipo);
  }

  if (projetoId) {
    condicoes.push('demandas.projeto_id = ?');
    valores.push(Number(projetoId));
  }

  if (responsavelId) {
    // A palavra "sem" filtra as demandas que ainda nao foram atribuidas.
    if (responsavelId === 'sem') {
      condicoes.push('demandas.responsavel_id IS NULL');
    } else {
      condicoes.push('demandas.responsavel_id = ?');
      valores.push(Number(responsavelId));
    }
  }

  // ---------------------------------------------------------------------
  // Busca textual no titulo ou na descricao.
  // O sinal % do LIKE significa "qualquer coisa antes ou depois",
  // entao a busca encontra a palavra em qualquer parte do texto.
  // ---------------------------------------------------------------------
  if (busca && busca.trim() !== '') {
    condicoes.push('(demandas.titulo LIKE ? OR demandas.descricao LIKE ?)');
    const textoProcurado = `%${busca.trim()}%`;
    valores.push(textoProcurado, textoProcurado);
  }

  // ---------------------------------------------------------------------
  // Ordenacao: usa a lista de permissao. Se o valor enviado nao estiver
  // na lista, cai no padrao (mais criticas primeiro).
  // ---------------------------------------------------------------------
  const ordenacao =
    (ordenarPor && ordenacoesPermitidas[ordenarPor]) || ordenacoesPermitidas.prioridade;

  const [linhas] = await bancoDeDados.query<LinhaDemanda[]>(
    `SELECT demandas.id,
            demandas.titulo,
            demandas.tipo,
            demandas.prioridade,
            demandas.status,
            demandas.projeto_id,
            projetos.nome         AS projeto_nome,
            demandas.responsavel_id,
            responsavel.nome      AS responsavel_nome,
            demandas.criado_em,
            demandas.prazo_finalizacao
       FROM demandas
       INNER JOIN projetos
               ON projetos.id = demandas.projeto_id
       -- LEFT JOIN porque a demanda pode nao ter responsavel definido.
       LEFT JOIN usuarios AS responsavel
              ON responsavel.id = demandas.responsavel_id
      WHERE ${condicoes.join(' AND ')}
      ORDER BY ${ordenacao}`,
    valores
  );

  // Converte cada linha do banco no formato que a tela espera,
  // ja com os textos traduzidos para exibicao.
  const demandas = linhas.map((linha) => ({
    id: linha.id,
    titulo: linha.titulo,
    tipo: linha.tipo,
    tipoDescricao: rotuloTipo[linha.tipo],
    prioridade: linha.prioridade,
    prioridadeDescricao: rotuloPrioridade[linha.prioridade],
    status: linha.status,
    statusDescricao: rotuloStatus[linha.status],
    projeto: { id: linha.projeto_id, nome: linha.projeto_nome },
    responsavel: linha.responsavel_id
      ? { id: linha.responsavel_id, nome: linha.responsavel_nome }
      : null,
    criadoEm: linha.criado_em,
    prazoFinalizacao: linha.prazo_finalizacao,
  }));

  res.json({ total: demandas.length, demandas });
}
