/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Funcoes de senha.
 *
 * O sistema nunca guarda a senha digitada pelo usuario. Ele guarda um
 * "hash", que e um texto embaralhado gerado pelo algoritmo bcrypt.
 * Nao existe caminho de volta: a partir do hash nao da para descobrir
 * a senha original. Para conferir o login, embaralhamos a senha digitada
 * e comparamos com o hash guardado no banco.
 */

import bcrypt from 'bcryptjs';

// Quantas vezes o algoritmo repete o embaralhamento.
// Quanto maior, mais lento e mais seguro. 10 e o valor recomendado.
const RODADAS = 10;

/** Transforma uma senha em texto puro no hash que sera gravado no banco. */
export async function gerarHashDaSenha(senhaEmTextoPuro: string): Promise<string> {
  return bcrypt.hash(senhaEmTextoPuro, RODADAS);
}

/**
 * Confere se a senha digitada corresponde ao hash guardado no banco.
 * Devolve true quando a senha esta correta.
 */
export async function senhaConfere(
  senhaDigitada: string,
  hashGuardado: string
): Promise<boolean> {
  return bcrypt.compare(senhaDigitada, hashGuardado);
}
