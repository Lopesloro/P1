/**
 * Autor exclusivo deste arquivo: Enzo Carleti Teixeira
 *
 * Mapa de todas as rotas da API.
 *
 * Reunir as rotas em um unico arquivo deixa claro, de uma olhada, quais
 * enderecos existem, qual metodo HTTP cada um aceita, quem pode chamar e
 * qual controlador responde.
 *
 * Leitura de cada linha, da esquerda para a direita:
 *   metodo, endereco, middlewares que rodam antes, controlador.
 */

import { Router } from 'express';

import { fazerLogin, usuarioLogado } from '../controladores/autenticacaoControlador';
import { listarProjetos, listarUsuarios } from '../controladores/apoioControlador';
import { criarComentario } from '../controladores/comentariosControlador';
import {
  atualizarStatus,
  criarDemanda,
  editarDemanda,
} from '../controladores/demandasCadastroControlador';
import { obterDetalhesDaDemanda } from '../controladores/demandasDetalhesControlador';
import { listarDemandas } from '../controladores/demandasListagemControlador';
import { obterDadosDoDashboard } from '../controladores/dashboardControlador';
import { verificarFeriado } from '../controladores/feriadosControlador';
import { exigirLogin, exigirPerfil } from '../middlewares/autenticacao';
import { capturarErros } from '../middlewares/tratarErros';

export const rotas = Router();

// ---------------------------------------------------------------------------
// Autenticacao
// ---------------------------------------------------------------------------

// Unica rota publica do sistema: e por ela que o usuario recebe o token.
rotas.post('/autenticacao/login', capturarErros(fazerLogin));

// Confere se o token guardado no navegador ainda e valido.
rotas.get('/autenticacao/eu', exigirLogin, capturarErros(usuarioLogado));

// ---------------------------------------------------------------------------
// Demandas
// ---------------------------------------------------------------------------

// Listagem com filtros, busca e ordenacao. Todos os perfis logados.
rotas.get('/demandas', exigirLogin, capturarErros(listarDemandas));

// Detalhes de uma demanda, com comentarios e historico.
rotas.get('/demandas/:id', exigirLogin, capturarErros(obterDetalhesDaDemanda));

// Cadastro e edicao: apenas Administrador e Lider de Projeto.
// A verificacao de perfil aparece duas vezes de proposito: aqui, para
// barrar a chamada antes de tocar no banco, e dentro do controlador,
// junto com a verificacao de vinculo com o projeto.
rotas.post(
  '/demandas',
  exigirLogin,
  exigirPerfil('ADMINISTRADOR', 'LIDER'),
  capturarErros(criarDemanda)
);

rotas.put(
  '/demandas/:id',
  exigirLogin,
  exigirPerfil('ADMINISTRADOR', 'LIDER'),
  capturarErros(editarDemanda)
);

/*
 * Mudanca de status, incluindo o cancelamento.
 *
 * Esta rota aceita todos os perfis porque o Membro da Equipe tambem
 * altera status. Quais mudancas cada perfil pode fazer e decidido pelas
 * regras do ciclo de vida, no arquivo servicos/regrasDeStatus.ts.
 *
 * Nao existe rota DELETE para demandas: o documento de visao proibe a
 * exclusao fisica dos registros. Cancelar e mudar o status para CANCELADA.
 */
rotas.patch('/demandas/:id/status', exigirLogin, capturarErros(atualizarStatus));

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------
rotas.post('/demandas/:id/comentarios', exigirLogin, capturarErros(criarComentario));

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
rotas.get('/dashboard', exigirLogin, capturarErros(obterDadosDoDashboard));

// ---------------------------------------------------------------------------
// Listas de apoio para os formularios e filtros
// ---------------------------------------------------------------------------
rotas.get('/projetos', exigirLogin, capturarErros(listarProjetos));
rotas.get('/usuarios', exigirLogin, capturarErros(listarUsuarios));

// ---------------------------------------------------------------------------
// API externa de feriados
// ---------------------------------------------------------------------------
rotas.get('/feriados/verificar', exigirLogin, capturarErros(verificarFeriado));
