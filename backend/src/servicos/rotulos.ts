/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 *
 * Traducao dos valores tecnicos guardados no banco para o texto que
 * aparece na tela.
 *
 * No banco gravamos EM_ANDAMENTO porque e um valor simples, sem acento e
 * sem espaco. Para o usuario, porem, precisamos mostrar "Em andamento".
 * Reunir essa traducao em um unico arquivo evita que cada tela escreva
 * o texto de um jeito diferente.
 */

import {
  PerfilUsuario,
  PrioridadeDemanda,
  StatusDemanda,
  TipoDemanda,
} from '../tipos';

export const rotuloStatus: Record<StatusDemanda, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  EM_REVISAO: 'Em revisao',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada',
};

export const rotuloTipo: Record<TipoDemanda, string> = {
  TAREFA: 'Tarefa',
  DEFEITO: 'Defeito',
  MELHORIA: 'Melhoria',
  DOCUMENTACAO: 'Documentacao',
};

export const rotuloPrioridade: Record<PrioridadeDemanda, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Critica',
};

export const rotuloPerfil: Record<PerfilUsuario, string> = {
  ADMINISTRADOR: 'Administrador',
  LIDER: 'Lider de Projeto',
  MEMBRO: 'Membro da Equipe',
};
