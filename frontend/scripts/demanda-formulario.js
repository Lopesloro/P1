/**
 * Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Comportamento da tela de Cadastro e Edicao de Demanda.
 *
 * A tela funciona em dois modos, decididos pelo endereco da pagina:
 *   /paginas/demanda-formulario.html         -> cadastro
 *   /paginas/demanda-formulario.html?id=12   -> edicao da demanda 12
 */

const formularioDaDemanda = document.getElementById('formularioDaDemanda');
const campoTitulo = document.getElementById('titulo');
const campoDescricao = document.getElementById('descricao');
const campoProjeto = document.getElementById('projeto');
const campoTipo = document.getElementById('tipo');
const campoPrioridade = document.getElementById('prioridade');
const campoResponsavel = document.getElementById('responsavel');
const campoPrazo = document.getElementById('prazo');
const botaoSalvar = document.getElementById('botaoSalvar');
const avisoFeriado = document.getElementById('avisoFeriado');
const areaDeMensagemDoFormulario = document.getElementById('areaDeMensagem');

/*
 * Codigo da demanda em edicao.
 * Fica null quando a tela esta cadastrando uma demanda nova.
 */
const demandaEmEdicao = new URLSearchParams(window.location.search).get('id');
const estaEditando = demandaEmEdicao !== null;

/** Mostra uma mensagem no topo da tela. */
function mostrarMensagemNoFormulario(texto, tipo = 'erro') {
  areaDeMensagemDoFormulario.textContent = texto;
  areaDeMensagemDoFormulario.className = `mensagem mensagem--${tipo}`;

  // Leva a tela de volta ao topo para o usuario enxergar o aviso.
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Esconde a mensagem do topo. */
function esconderMensagemDoFormulario() {
  areaDeMensagemDoFormulario.className = 'mensagem mensagem--erro mensagem--escondida';
}

/** Marca um campo como invalido e mostra o motivo abaixo dele. */
function marcarErro(campo, idDoErro, texto) {
  campo.classList.add('campo__entrada--invalido', 'campo__selecao--invalido', 'campo__area--invalido');

  const areaDoErro = document.getElementById(idDoErro);
  areaDoErro.textContent = texto;
  areaDoErro.classList.add('campo__erro--visivel');
}

/** Limpa a marcacao de erro de todos os campos. */
function limparErros() {
  [campoTitulo, campoDescricao, campoProjeto, campoPrazo].forEach((campo) => {
    campo.classList.remove(
      'campo__entrada--invalido',
      'campo__selecao--invalido',
      'campo__area--invalido'
    );
  });

  ['erroTitulo', 'erroDescricao', 'erroProjeto', 'erroPrazo'].forEach((id) => {
    const areaDoErro = document.getElementById(id);
    areaDoErro.textContent = '';
    areaDoErro.classList.remove('campo__erro--visivel');
  });
}

/**
 * Confere os campos obrigatorios antes de enviar.
 * Devolve true quando o formulario pode ser enviado.
 *
 * Esta validacao existe para dar uma resposta imediata ao usuario.
 * O backend refaz todas essas conferencias, porque a validacao da tela
 * pode ser contornada por quem chamar a API diretamente.
 */
function formularioDaDemandaEstaValido() {
  limparErros();
  let estaValido = true;

  if (campoTitulo.value.trim() === '') {
    marcarErro(campoTitulo, 'erroTitulo', 'Informe o titulo da demanda.');
    estaValido = false;
  }

  if (campoDescricao.value.trim() === '') {
    marcarErro(campoDescricao, 'erroDescricao', 'Descreva o que precisa ser feito.');
    estaValido = false;
  }

  if (campoProjeto.value === '') {
    marcarErro(campoProjeto, 'erroProjeto', 'Selecione o projeto da demanda.');
    estaValido = false;
  }

  return estaValido;
}

/**
 * Consulta a API externa de feriados quando o usuario escolhe uma data.
 *
 * Este aviso serve apenas para o usuario descobrir o problema antes de
 * salvar. A verificacao que realmente impede a gravacao acontece no
 * backend, no momento do cadastro ou da edicao.
 */
async function conferirSeODiaEFeriado() {
  const data = campoPrazo.value;

  if (!data) {
    avisoFeriado.className = 'formulario__aviso-feriado';
    return;
  }

  avisoFeriado.textContent = 'Conferindo se a data e feriado nacional...';
  avisoFeriado.className =
    'formulario__aviso-feriado formulario__aviso-feriado--visivel formulario__aviso-feriado--consultando';

  try {
    const resultado = await Api.verificarFeriado(data);

    if (resultado.ehFeriado) {
      avisoFeriado.textContent =
        `${Formatacao.formatarData(data)} e feriado nacional (${resultado.nomeDoFeriado}). ` +
        'Escolha outra data.';
      avisoFeriado.className =
        'formulario__aviso-feriado formulario__aviso-feriado--visivel formulario__aviso-feriado--feriado';
    } else {
      avisoFeriado.textContent = 'Data disponivel, nao e feriado nacional.';
      avisoFeriado.className =
        'formulario__aviso-feriado formulario__aviso-feriado--visivel formulario__aviso-feriado--livre';
    }
  } catch (erro) {
    // Sem internet a conferencia nao acontece agora, mas o backend
    // continuara conferindo no momento de salvar.
    avisoFeriado.textContent = erro.message;
    avisoFeriado.className =
      'formulario__aviso-feriado formulario__aviso-feriado--visivel formulario__aviso-feriado--consultando';
  }
}

/**
 * Preenche a lista de responsaveis com os participantes do projeto
 * escolhido. Chamada ao abrir a tela e sempre que o projeto muda.
 */
async function carregarResponsaveisDoProjeto(projetoId, responsavelSelecionado = '') {
  // Mantem apenas a primeira opcao ("Sem responsavel definido").
  campoResponsavel.length = 1;

  if (!projetoId) {
    return;
  }

  try {
    const resposta = await Api.listarUsuarios(projetoId);

    resposta.usuarios.forEach((usuario) => {
      const opcao = document.createElement('option');
      opcao.value = usuario.id;
      opcao.textContent = `${usuario.nome} (${usuario.perfilDescricao})`;
      campoResponsavel.appendChild(opcao);
    });

    campoResponsavel.value = responsavelSelecionado || '';
  } catch (erro) {
    mostrarMensagemNoFormulario(
      `Nao foi possivel carregar a lista de responsaveis. ${erro.message}`
    );
  }
}

/** Preenche a lista de projetos. */
async function carregarProjetos() {
  const resposta = await Api.listarProjetos();

  resposta.projetos.forEach((projeto) => {
    const opcao = document.createElement('option');
    opcao.value = projeto.id;
    opcao.textContent = projeto.nome;
    campoProjeto.appendChild(opcao);
  });
}

/** Carrega os dados da demanda que esta sendo editada. */
async function carregarDemandaParaEdicao() {
  const resposta = await Api.obterDemanda(demandaEmEdicao);
  const demanda = resposta.demanda;

  // O backend so permite editar quem tem perfil de Administrador ou Lider
  // e apenas enquanto a demanda nao esta concluida ou cancelada.
  if (!resposta.acoesPermitidas.podeEditar) {
    formularioDaDemanda.hidden = true;
    mostrarMensagemNoFormulario(
      'Esta demanda nao pode ser editada. Ou ela ja foi concluida ou cancelada, ' +
        'ou seu perfil de acesso nao permite essa acao.',
      'alerta'
    );
    return;
  }

  campoTitulo.value = demanda.titulo;
  campoDescricao.value = demanda.descricao;
  campoTipo.value = demanda.tipo;
  campoPrioridade.value = demanda.prioridade;
  campoPrazo.value = demanda.prazoFinalizacao || '';

  campoProjeto.value = demanda.projeto.id;

  /*
   * O projeto nao pode ser trocado na edicao: mudar a demanda de projeto
   * bagunçaria o vinculo com o responsavel e com o historico.
   * O campo fica desabilitado, mas continua visivel para o usuario saber
   * a qual projeto a demanda pertence.
   */
  campoProjeto.disabled = true;

  await carregarResponsaveisDoProjeto(
    demanda.projeto.id,
    demanda.responsavel ? demanda.responsavel.id : ''
  );

  // Mostra o status atual, apenas para leitura.
  document.getElementById('areaDoStatus').hidden = false;
  document.getElementById('statusAtual').innerHTML = Formatacao.etiquetaStatus(
    demanda.status,
    demanda.statusDescricao
  );

  // Ajusta os textos da tela para o modo de edicao.
  document.title = 'Editar demanda | Acompanhamento de Demandas';
  document.getElementById('tituloDaTela').textContent = 'Editar demanda';
  document.getElementById('subtituloDaTela').textContent =
    `Demanda numero ${demanda.id} - ${demanda.projeto.nome}`;
  botaoSalvar.textContent = 'Salvar alteracoes';
  document.getElementById('botaoCancelar').href =
    `/paginas/demanda-detalhes.html?id=${demanda.id}`;
}

/** Envio do formulario: cadastra ou salva a edicao. */
formularioDaDemanda.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagemDoFormulario();

  if (!formularioDaDemandaEstaValido()) {
    mostrarMensagemNoFormulario(
      'Nao foi possivel salvar. Verifique os campos destacados e tente novamente.'
    );
    return;
  }

  const dados = {
    titulo: campoTitulo.value.trim(),
    descricao: campoDescricao.value.trim(),
    tipo: campoTipo.value,
    prioridade: campoPrioridade.value,
    projetoId: Number(campoProjeto.value),
    responsavelId: campoResponsavel.value === '' ? null : Number(campoResponsavel.value),
    prazoFinalizacao: campoPrazo.value === '' ? null : campoPrazo.value,
  };

  botaoSalvar.disabled = true;
  botaoSalvar.textContent = 'Salvando...';

  try {
    if (estaEditando) {
      await Api.editarDemanda(demandaEmEdicao, dados);
      window.location.href = `/paginas/demanda-detalhes.html?id=${demandaEmEdicao}&salvo=1`;
    } else {
      const resposta = await Api.criarDemanda(dados);
      window.location.href = `/paginas/demanda-detalhes.html?id=${resposta.demandaId}&criado=1`;
    }
  } catch (erro) {
    mostrarMensagemNoFormulario(erro.message);

    // Quando o erro fala do prazo, destacamos o campo da data para que o
    // usuario encontre rapidamente o que precisa corrigir.
    if (erro.message.toLowerCase().includes('feriado') ||
        erro.message.toLowerCase().includes('prazo')) {
      marcarErro(campoPrazo, 'erroPrazo', 'Escolha outra data para o prazo.');
    }

    botaoSalvar.disabled = false;
    botaoSalvar.textContent = estaEditando ? 'Salvar alteracoes' : 'Cadastrar demanda';
  }
});

/** Ao trocar o projeto, a lista de responsaveis precisa ser refeita. */
campoProjeto.addEventListener('change', () => {
  carregarResponsaveisDoProjeto(campoProjeto.value);
});

/** Ao escolher uma data, consultamos a API de feriados. */
campoPrazo.addEventListener('change', conferirSeODiaEFeriado);

/** Ponto de partida da tela. */
(async function iniciarFormulario() {
  const usuario = await Sessao.exigirLogin();

  if (!usuario) {
    return;
  }

  Sessao.montarCabecalho(usuario, 'demandas');

  // O Membro da Equipe nao cadastra nem edita demandas.
  if (usuario.perfil === 'MEMBRO') {
    formularioDaDemanda.hidden = true;
    mostrarMensagemNoFormulario(
      'O perfil Membro da Equipe nao cadastra nem edita demandas. ' +
        'Voce pode acompanhar as demandas atribuidas a voce, comentar e ' +
        'atualizar o andamento delas.',
      'alerta'
    );
    return;
  }

  try {
    await carregarProjetos();

    if (estaEditando) {
      await carregarDemandaParaEdicao();
    }
  } catch (erro) {
    mostrarMensagemNoFormulario(erro.message);
  }
})();
