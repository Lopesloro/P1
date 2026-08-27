/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Comportamento da tela de Login.
 *
 * O que este arquivo faz:
 * 1. valida os campos antes de enviar;
 * 2. envia e-mail e senha para a API;
 * 3. guarda o token devolvido pelo servidor;
 * 4. leva o usuario para o dashboard;
 * 5. mostra mensagens claras quando algo da errado.
 */

// Elementos da tela, buscados uma unica vez.
const formularioDeLogin = document.getElementById('formularioDeLogin');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const campoLembrar = document.getElementById('lembrar');
const botaoEntrar = document.getElementById('botaoEntrar');
const botaoMostrarSenha = document.getElementById('botaoMostrarSenha');
const botaoEsqueciSenha = document.getElementById('botaoEsqueciSenha');
const areaDeMensagem = document.getElementById('areaDeMensagem');
const erroEmail = document.getElementById('erroEmail');
const erroSenha = document.getElementById('erroSenha');

/**
 * Mostra uma mensagem no topo do formulario.
 * O parametro tipo aceita 'erro', 'sucesso' ou 'alerta'.
 */
function mostrarMensagem(texto, tipo = 'erro') {
  areaDeMensagem.textContent = texto;
  areaDeMensagem.className = `mensagem mensagem--${tipo}`;
}

/** Esconde a mensagem do topo do formulario. */
function esconderMensagem() {
  areaDeMensagem.className = 'mensagem mensagem--erro mensagem--escondida';
  areaDeMensagem.textContent = '';
}

/** Mostra o erro de um campo especifico e o marca em vermelho. */
function marcarErroNoCampo(campo, areaDoErro, texto) {
  campo.classList.add('campo__entrada--invalido');
  areaDoErro.textContent = texto;
  areaDoErro.classList.add('campo__erro--visivel');
}

/** Limpa a marcacao de erro de um campo. */
function limparErroDoCampo(campo, areaDoErro) {
  campo.classList.remove('campo__entrada--invalido');
  areaDoErro.textContent = '';
  areaDoErro.classList.remove('campo__erro--visivel');
}

/**
 * Confere os campos antes de chamar a API.
 * Devolve true quando esta tudo preenchido corretamente.
 *
 * Esta validacao serve para dar uma resposta rapida ao usuario. Ela nao
 * substitui a validacao do backend, que e a que realmente protege o
 * sistema, porque qualquer pessoa consegue burlar o JavaScript da pagina.
 */
function formularioEstaValido() {
  let estaValido = true;

  limparErroDoCampo(campoEmail, erroEmail);
  limparErroDoCampo(campoSenha, erroSenha);

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  if (email === '') {
    marcarErroNoCampo(campoEmail, erroEmail, 'Informe seu e-mail.');
    estaValido = false;
  } else if (!email.includes('@') || !email.includes('.')) {
    // Verificacao simples de formato: precisa ter arroba e ponto.
    marcarErroNoCampo(
      campoEmail,
      erroEmail,
      'Digite um e-mail valido, por exemplo nome@dominio.com.'
    );
    estaValido = false;
  }

  if (senha === '') {
    marcarErroNoCampo(campoSenha, erroSenha, 'Informe sua senha.');
    estaValido = false;
  }

  return estaValido;
}

/** Envio do formulario. */
formularioDeLogin.addEventListener('submit', async (evento) => {
  // Impede que o navegador recarregue a pagina, que e o
  // comportamento padrao ao enviar um formulario.
  evento.preventDefault();

  esconderMensagem();

  if (!formularioEstaValido()) {
    mostrarMensagem(
      'Nao foi possivel entrar. Verifique os campos destacados e tente novamente.'
    );
    return;
  }

  // Desliga o botao para evitar que o usuario clique duas vezes
  // e o sistema envie duas requisicoes iguais.
  botaoEntrar.disabled = true;
  botaoEntrar.textContent = 'Entrando...';

  try {
    const resposta = await Api.entrar(campoEmail.value.trim(), campoSenha.value);

    // Guarda o token. O local depende da opcao "Lembrar-me".
    Sessao.iniciar(resposta.token, resposta.usuario, campoLembrar.checked);

    window.location.href = '/paginas/dashboard.html';
  } catch (erro) {
    // A mensagem vem pronta do backend, ja em linguagem simples.
    mostrarMensagem(erro.message);

    // Limpa a senha para o usuario digitar de novo, mantendo o e-mail.
    campoSenha.value = '';
    campoSenha.focus();
  } finally {
    botaoEntrar.disabled = false;
    botaoEntrar.textContent = 'Entrar';
  }
});

/** Botao que mostra ou esconde a senha digitada. */
botaoMostrarSenha.addEventListener('click', () => {
  const estaEscondida = campoSenha.type === 'password';

  campoSenha.type = estaEscondida ? 'text' : 'password';
  botaoMostrarSenha.textContent = estaEscondida ? 'Ocultar' : 'Mostrar';
  botaoMostrarSenha.setAttribute(
    'aria-label',
    estaEscondida ? 'Ocultar senha' : 'Mostrar senha'
  );
});

/**
 * Link de senha esquecida.
 *
 * Neste projeto os usuarios sao cadastrados diretamente no banco de dados,
 * conforme o documento de visao permite. Por isso nao existe recuperacao
 * automatica de senha. Em vez de deixar um link que nao faz nada, o botao
 * explica ao usuario o caminho correto.
 */
botaoEsqueciSenha.addEventListener('click', () => {
  mostrarMensagem(
    'Os usuarios deste sistema sao cadastrados pelo administrador. ' +
      'Procure o administrador do sistema para redefinir sua senha.',
    'alerta'
  );
});

/** Limpa a marcacao de erro assim que o usuario corrige o campo. */
campoEmail.addEventListener('input', () => limparErroDoCampo(campoEmail, erroEmail));
campoSenha.addEventListener('input', () => limparErroDoCampo(campoSenha, erroSenha));

/**
 * Executado ao abrir a tela.
 *
 * Avisa quando o usuario chegou aqui porque a sessao expirou. O aviso e
 * enviado pelo arquivo api.js por meio do endereco da pagina
 * (/index.html?sessao=expirada).
 */
(function aoAbrirATela() {
  const parametros = new URLSearchParams(window.location.search);

  if (parametros.get('sessao') === 'expirada') {
    mostrarMensagem(
      'Sua sessao expirou por inatividade. Entre novamente para continuar.',
      'alerta'
    );
  }

  campoEmail.focus();
})();
