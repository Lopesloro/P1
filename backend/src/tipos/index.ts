/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Tipos usados em todo o backend.
 * Reunir os tipos em um unico arquivo evita repeticao e deixa claro
 * quais valores cada campo aceita.
 */

/** Perfis de acesso previstos no documento de visao. */
export type PerfilUsuario = 'ADMINISTRADOR' | 'LIDER' | 'MEMBRO';

/** Tipos de demanda previstos no documento de visao. */
export type TipoDemanda = 'TAREFA' | 'DEFEITO' | 'MELHORIA' | 'DOCUMENTACAO';

/** Prioridades previstas no documento de visao. */
export type PrioridadeDemanda = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

/** Status previstos no documento de visao. */
export type StatusDemanda =
  | 'ABERTA'
  | 'EM_ANDAMENTO'
  | 'EM_REVISAO'
  | 'CONCLUIDA'
  | 'CANCELADA';

/** Dados do usuario que ficam guardados dentro do token de login. */
export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

/**
 * Estende o tipo Request do Express para que ele passe a ter o campo
 * "usuario". Esse campo e preenchido pelo middleware de autenticacao
 * depois de conferir o token.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

/**
 * Erro usado quando queremos devolver uma mensagem especifica para o
 * usuario junto com um codigo HTTP escolhido por nos.
 *
 * Exemplo de uso:
 *   throw new ErroDaAplicacao(404, 'Demanda nao encontrada.');
 */
export class ErroDaAplicacao extends Error {
  public readonly codigoHttp: number;

  constructor(codigoHttp: number, mensagem: string) {
    super(mensagem);
    this.codigoHttp = codigoHttp;
    this.name = 'ErroDaAplicacao';
  }
}
