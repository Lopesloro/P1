/**
 * Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
 *
 * Cadastro, edicao, mudanca de status e cancelamento de demandas.
 *
 * Atende ao item 2.2.8 do documento de visao.
 *
 * Regra que vale para todo o arquivo: demanda nunca e apagada do banco.
 * Quando ela nao e mais necessaria, recebe o status CANCELADA. Isso
 * preserva o historico das atividades do projeto.
 *
 * Sobre transacoes:
 * alterar uma demanda envolve duas gravacoes, a demanda em si e o
 * historico. Se a segunda falhasse depois da primeira, o banco ficaria
 * com uma alteracao sem registro. Para evitar isso, as duas acontecem
 * dentro de uma transacao: no final damos COMMIT, que confirma tudo, ou
 * ROLLBACK, que desfaz tudo.
 */

import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { bancoDeDados } from '../configuracao/banco';
import { validarPrazoDeFinalizacao } from '../servicos/feriados';
import { AlteracaoRegistrada, compararValores, registrarAlteracoes } from '../servicos/historico';
import {
  podeCriarDemanda,
  podeEditarDemanda,
  usuarioTemAcessoAoProjeto,
} from '../servicos/permissoes';
import { verificarTransicaoDeStatus } from '../servicos/regrasDeStatus';
import { rotuloPrioridade, rotuloStatus, rotuloTipo } from '../servicos/rotulos';
import {
  ErroDaAplicacao,
  PrioridadeDemanda,
  StatusDemanda,
  TipoDemanda,
} from '../tipos';

/** Valores aceitos em cada campo de escolha. */
const TIPOS_VALIDOS: TipoDemanda[] = ['TAREFA', 'DEFEITO', 'MELHORIA', 'DOCUMENTACAO'];
const PRIORIDADES_VALIDAS: PrioridadeDemanda[] = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const STATUS_VALIDOS: StatusDemanda[] = [
  'ABERTA',
  'EM_ANDAMENTO',
  'EM_REVISAO',
  'CONCLUIDA',
  'CANCELADA',
];

/** Linha da tabela demandas usada nas verificacoes antes de alterar. */
interface LinhaDemandaAtual extends RowDataPacket {
  id: number;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  projeto_id: number;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  prazo_finalizacao: string | null;
}

/**
 * Busca a demanda pelo codigo e interrompe com erro 404 quando ela
 * nao existe. Usada por todas as operacoes de alteracao.
 */
async function buscarDemandaOuFalhar(demandaId: number): Promise<LinhaDemandaAtual> {
  const [linhas] = await bancoDeDados.query<LinhaDemandaAtual[]>(
    `SELECT demandas.id,
            demandas.titulo,
            demandas.descricao,
            demandas.tipo,
            demandas.prioridade,
            demandas.status,
            demandas.projeto_id,
            demandas.responsavel_id,
            responsavel.nome AS responsavel_nome,
            demandas.prazo_finalizacao
       FROM demandas
       LEFT JOIN usuarios AS responsavel
              ON responsavel.id = demandas.responsavel_id
      WHERE demandas.id = ?
      LIMIT 1`,
    [demandaId]
  );

  if (linhas.length === 0) {
    throw new ErroDaAplicacao(404, 'Demanda nao encontrada.');
  }

  return linhas[0];
}

/**
 * Confere se o texto foi preenchido e respeita o tamanho maximo.
 * Devolve o texto ja sem espacos sobrando nas pontas.
 */
function validarTexto(
  valor: unknown,
  nomeDoCampo: string,
  tamanhoMaximo: number
): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErroDaAplicacao(400, `O campo ${nomeDoCampo} e obrigatorio.`);
  }

  const textoLimpo = valor.trim();

  if (textoLimpo.length > tamanhoMaximo) {
    throw new ErroDaAplicacao(
      400,
      `O campo ${nomeDoCampo} deve ter no maximo ${tamanhoMaximo} caracteres.`
    );
  }

  return textoLimpo;
}

/** Confere se o valor recebido esta entre as opcoes aceitas. */
function validarOpcao<T extends string>(
  valor: unknown,
  opcoesAceitas: T[],
  nomeDoCampo: string
): T {
  if (typeof valor !== 'string' || !opcoesAceitas.includes(valor as T)) {
    throw new ErroDaAplicacao(
      400,
      `O campo ${nomeDoCampo} deve ser um destes valores: ${opcoesAceitas.join(', ')}.`
    );
  }

  return valor as T;
}

/**
 * Confere o formato da data do prazo.
 * Aceita vazio, porque o prazo pode ser definido depois.
 */
function validarFormatoDaData(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErroDaAplicacao(
      400,
      'O prazo de finalizacao deve ser uma data valida no formato dia/mes/ano.'
    );
  }

  /*
   * Conferir apenas o formato nao basta: 2026-02-31 tem o formato certo,
   * mas 31 de fevereiro nao existe.
   *
   * O JavaScript nao ajuda aqui. Ao receber uma data inexistente ele nao
   * acusa erro, apenas avanca para o dia seguinte do mes seguinte: o
   * 31 de fevereiro vira 3 de marco. Por isso montamos a data e conferimos
   * se ela continua com o mesmo dia, mes e ano que foram digitados.
   * Se mudou, a data original nao existia.
   */
  const [ano, mes, dia] = valor.split('-').map(Number);

  // Date.UTC evita que o fuso horario da maquina desloque o dia.
  const dataMontada = new Date(Date.UTC(ano, mes - 1, dia));

  const dataExiste =
    dataMontada.getUTCFullYear() === ano &&
    dataMontada.getUTCMonth() === mes - 1 &&
    dataMontada.getUTCDate() === dia;

  if (!dataExiste) {
    throw new ErroDaAplicacao(400, 'O prazo de finalizacao informado nao e uma data valida.');
  }

  return valor;
}

/**
 * Confere se o usuario escolhido como responsavel existe, esta ativo e
 * participa do projeto da demanda.
 */
async function validarResponsavel(
  responsavelId: number | null,
  projetoId: number
): Promise<void> {
  if (responsavelId === null) {
    return;
  }

  const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT usuarios.id
       FROM usuarios
      WHERE usuarios.id = ?
        AND usuarios.ativo = 1
      LIMIT 1`,
    [responsavelId]
  );

  if (linhas.length === 0) {
    throw new ErroDaAplicacao(400, 'O responsavel escolhido nao existe ou esta inativo.');
  }

  // O administrador pode nao estar vinculado a nenhum projeto, entao
  // aceitamos qualquer usuario com perfil ADMINISTRADOR como responsavel.
  const [vinculo] = await bancoDeDados.query<RowDataPacket[]>(
    `SELECT 1
       FROM usuarios
       LEFT JOIN projeto_usuarios
              ON projeto_usuarios.usuario_id = usuarios.id
             AND projeto_usuarios.projeto_id = ?
      WHERE usuarios.id = ?
        AND (projeto_usuarios.usuario_id IS NOT NULL
             OR usuarios.perfil = 'ADMINISTRADOR')
      LIMIT 1`,
    [projetoId, responsavelId]
  );

  if (vinculo.length === 0) {
    throw new ErroDaAplicacao(
      400,
      'O responsavel escolhido nao participa do projeto desta demanda.'
    );
  }
}

/**
 * POST /api/demandas
 *
 * Cadastra uma nova demanda. Somente Administrador e Lider de Projeto.
 * A demanda sempre nasce com o status ABERTA.
 *
 * Recebe:
 *   {
 *     "titulo": "...", "descricao": "...",
 *     "tipo": "TAREFA", "prioridade": "ALTA",
 *     "projetoId": 1, "responsavelId": 4 ou null,
 *     "prazoFinalizacao": "2026-09-30" ou null
 *   }
 */
export async function criarDemanda(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;

  if (!podeCriarDemanda(usuario.perfil)) {
    throw new ErroDaAplicacao(
      403,
      'Seu perfil de acesso nao permite cadastrar demandas.'
    );
  }

  // 1. Valida o formato de cada campo recebido.
  const titulo = validarTexto(req.body.titulo, 'titulo', 150);
  const descricao = validarTexto(req.body.descricao, 'descricao', 5000);
  const tipo = validarOpcao(req.body.tipo, TIPOS_VALIDOS, 'tipo');
  const prioridade = validarOpcao(req.body.prioridade, PRIORIDADES_VALIDAS, 'prioridade');
  const prazoFinalizacao = validarFormatoDaData(req.body.prazoFinalizacao);

  const projetoId = Number(req.body.projetoId);
  if (!Number.isInteger(projetoId) || projetoId <= 0) {
    throw new ErroDaAplicacao(400, 'Escolha o projeto ao qual a demanda pertence.');
  }

  const responsavelId =
    req.body.responsavelId === undefined ||
    req.body.responsavelId === null ||
    req.body.responsavelId === ''
      ? null
      : Number(req.body.responsavelId);

  // 2. Confere se o usuario pode cadastrar demandas neste projeto.
  const temAcesso = await usuarioTemAcessoAoProjeto(usuario, projetoId);
  if (!temAcesso) {
    throw new ErroDaAplicacao(
      403,
      'Voce nao esta vinculado a este projeto e nao pode cadastrar demandas nele.'
    );
  }

  await validarResponsavel(responsavelId, projetoId);

  // 3. Consulta a API externa de feriados. Interrompe o cadastro se a
  //    data do prazo cair em um feriado nacional.
  await validarPrazoDeFinalizacao(prazoFinalizacao);

  // 4. Grava a demanda e a primeira linha do historico dentro de uma transacao.
  const conexao = await bancoDeDados.getConnection();

  try {
    await conexao.beginTransaction();

    const [resultado] = await conexao.query<ResultSetHeader>(
      `INSERT INTO demandas
         (titulo, descricao, tipo, prioridade, status,
          projeto_id, responsavel_id, criado_por_id, prazo_finalizacao)
       VALUES (?, ?, ?, ?, 'ABERTA', ?, ?, ?, ?)`,
      [
        titulo,
        descricao,
        tipo,
        prioridade,
        projetoId,
        responsavelId,
        usuario.id,
        prazoFinalizacao,
      ]
    );

    const demandaId = resultado.insertId;

    await registrarAlteracoes(conexao, demandaId, usuario.id, [
      { campoAlterado: 'criacao', valorAnterior: null, valorNovo: 'Demanda cadastrada' },
    ]);

    await conexao.commit();

    res.status(201).json({
      mensagem: 'Demanda cadastrada com sucesso.',
      demandaId,
    });
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

/**
 * PUT /api/demandas/:id
 *
 * Edita os dados da demanda. Somente Administrador e Lider de Projeto.
 * O status nao e alterado por aqui: para isso existe a rota propria de
 * mudanca de status, que aplica as regras do ciclo de vida.
 */
export async function editarDemanda(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;
  const demandaId = Number(req.params.id);

  if (!podeEditarDemanda(usuario.perfil)) {
    throw new ErroDaAplicacao(
      403,
      'Seu perfil de acesso nao permite editar os dados da demanda. ' +
        'O Membro da Equipe pode apenas alterar o status das demandas atribuidas a ele.'
    );
  }

  const demandaAtual = await buscarDemandaOuFalhar(demandaId);

  const temAcesso = await usuarioTemAcessoAoProjeto(usuario, demandaAtual.projeto_id);
  if (!temAcesso) {
    throw new ErroDaAplicacao(403, 'Voce nao esta vinculado ao projeto desta demanda.');
  }

  // Demandas concluidas ou canceladas ficam congeladas.
  if (demandaAtual.status === 'CONCLUIDA' || demandaAtual.status === 'CANCELADA') {
    throw new ErroDaAplicacao(
      400,
      `Esta demanda esta ${rotuloStatus[demandaAtual.status].toLowerCase()} e nao pode mais ser editada.`
    );
  }

  const titulo = validarTexto(req.body.titulo, 'titulo', 150);
  const descricao = validarTexto(req.body.descricao, 'descricao', 5000);
  const tipo = validarOpcao(req.body.tipo, TIPOS_VALIDOS, 'tipo');
  const prioridade = validarOpcao(req.body.prioridade, PRIORIDADES_VALIDAS, 'prioridade');
  const prazoFinalizacao = validarFormatoDaData(req.body.prazoFinalizacao);

  const responsavelId =
    req.body.responsavelId === undefined ||
    req.body.responsavelId === null ||
    req.body.responsavelId === ''
      ? null
      : Number(req.body.responsavelId);

  await validarResponsavel(responsavelId, demandaAtual.projeto_id);

  // So consulta a API de feriados quando o prazo realmente mudou.
  // Isso evita chamadas desnecessarias a um servico externo.
  if (prazoFinalizacao !== demandaAtual.prazo_finalizacao) {
    await validarPrazoDeFinalizacao(prazoFinalizacao);
  }

  // Descobre o nome do novo responsavel para gravar no historico
  // um texto que faca sentido para quem le.
  let nomeDoNovoResponsavel: string | null = null;
  if (responsavelId !== null) {
    const [linhas] = await bancoDeDados.query<RowDataPacket[]>(
      'SELECT nome FROM usuarios WHERE id = ? LIMIT 1',
      [responsavelId]
    );
    nomeDoNovoResponsavel = (linhas[0]?.nome as string) ?? null;
  }

  // Monta a lista de alteracoes relevantes para o historico.
  // A funcao compararValores devolve null quando o campo nao mudou.
  const alteracoes: AlteracaoRegistrada[] = [
    compararValores(
      'prioridade',
      rotuloPrioridade[demandaAtual.prioridade],
      rotuloPrioridade[prioridade]
    ),
    compararValores('tipo', rotuloTipo[demandaAtual.tipo], rotuloTipo[tipo]),
    compararValores('responsavel', demandaAtual.responsavel_nome, nomeDoNovoResponsavel),
    compararValores('prazo', demandaAtual.prazo_finalizacao, prazoFinalizacao),
  ].filter((alteracao): alteracao is AlteracaoRegistrada => alteracao !== null);

  const conexao = await bancoDeDados.getConnection();

  try {
    await conexao.beginTransaction();

    await conexao.query(
      `UPDATE demandas
          SET titulo = ?,
              descricao = ?,
              tipo = ?,
              prioridade = ?,
              responsavel_id = ?,
              prazo_finalizacao = ?
        WHERE id = ?`,
      [titulo, descricao, tipo, prioridade, responsavelId, prazoFinalizacao, demandaId]
    );

    await registrarAlteracoes(conexao, demandaId, usuario.id, alteracoes);

    await conexao.commit();

    res.json({ mensagem: 'Demanda atualizada com sucesso.' });
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

/**
 * PATCH /api/demandas/:id/status
 *
 * Muda apenas o status da demanda, respeitando o ciclo de vida e o
 * perfil de quem esta pedindo a mudanca.
 *
 * Recebe: { "status": "EM_ANDAMENTO" }
 *
 * O cancelamento tambem passa por aqui, enviando status CANCELADA.
 */
export async function atualizarStatus(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;
  const demandaId = Number(req.params.id);

  const statusNovo = validarOpcao(req.body.status, STATUS_VALIDOS, 'status');

  const demandaAtual = await buscarDemandaOuFalhar(demandaId);

  const temAcesso = await usuarioTemAcessoAoProjeto(usuario, demandaAtual.projeto_id);
  if (!temAcesso) {
    throw new ErroDaAplicacao(403, 'Voce nao esta vinculado ao projeto desta demanda.');
  }

  // Aplica as regras do ciclo de vida descritas no documento de visao.
  const ehResponsavel = demandaAtual.responsavel_id === usuario.id;
  const verificacao = verificarTransicaoDeStatus(
    demandaAtual.status,
    statusNovo,
    usuario.perfil,
    ehResponsavel
  );

  if (!verificacao.permitido) {
    throw new ErroDaAplicacao(400, verificacao.motivo!);
  }

  const conexao = await bancoDeDados.getConnection();

  try {
    await conexao.beginTransaction();

    await conexao.query('UPDATE demandas SET status = ? WHERE id = ?', [
      statusNovo,
      demandaId,
    ]);

    await registrarAlteracoes(conexao, demandaId, usuario.id, [
      {
        campoAlterado: 'status',
        valorAnterior: rotuloStatus[demandaAtual.status],
        valorNovo: rotuloStatus[statusNovo],
      },
    ]);

    await conexao.commit();

    res.json({
      mensagem: `Status alterado para ${rotuloStatus[statusNovo]}.`,
      status: statusNovo,
    });
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}
