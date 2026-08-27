/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Comportamento da tela de Detalhes da Demanda.
 *
 * Fluxo desta tela:
 * 1. le o codigo da demanda no endereco da pagina;
 * 2. busca os dados, os comentarios e o historico em uma unica chamada;
 * 3. desenha a tela;
 * 4. permite mudar o status, cancelar e comentar.
 */

const avisoCarregandoDetalhes = document.getElementById('avisoCarregando');
const conteudoDaDemanda = document.getElementById('conteudoDaDemanda');
const areaDeMensagemDosDetalhes = document.getElementById('areaDeMensagem');
const formularioDeComentario = document.getElementById('formularioDeComentario');
const textoDoComentario = document.getElementById('textoDoComentario');
const botaoComentar = document.getElementById('botaoComentar');
const erroComentario = document.getElementById('erroComentario');

// Codigo da demanda, lido do endereco: /paginas/demanda-detalhes.html?id=12
const codigoDaDemanda = new URLSearchParams(window.location.search).get('id');

/** Mostra uma mensagem no topo da tela. */
function mostrarMensagemNosDetalhes(texto, tipo = 'erro') {
  areaDeMensagemDosDetalhes.textContent = texto;
  areaDeMensagemDosDetalhes.className = `mensagem mensagem--${tipo}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Monta uma linha da ficha de informacoes. */
function linhaDaFicha(rotulo, valor, classeExtra = '') {
  const conteudo =
    valor === null || valor === undefined || valor === ''
      ? '<dd class="detalhes-ficha__valor detalhes-ficha__valor--vazio">Nao informado</dd>'
      : `<dd class="detalhes-ficha__valor ${classeExtra}">${valor}</dd>`;

  return `
    <div class="detalhes-ficha__item">
      <dt class="detalhes-ficha__rotulo">${Formatacao.textoSeguro(rotulo)}</dt>
      ${conteudo}
    </div>
  `;
}

/** Desenha a ficha lateral com os dados da demanda. */
function desenharFicha(demanda) {
  // Aviso de prazo apenas para demandas ainda pendentes.
  const pendente = demanda.status !== 'CONCLUIDA' && demanda.status !== 'CANCELADA';
  const aviso = pendente ? Formatacao.avisoDePrazo(demanda.prazoFinalizacao) : '';

  const textoDoPrazo = demanda.prazoFinalizacao
    ? `${Formatacao.formatarData(demanda.prazoFinalizacao)}${aviso ? ` (${aviso})` : ''}`
    : '';

  document.getElementById('fichaDaDemanda').innerHTML = [
    linhaDaFicha('Numero', `#${demanda.id}`),
    linhaDaFicha('Projeto', Formatacao.textoSeguro(demanda.projeto.nome)),
    linhaDaFicha(
      'Responsavel',
      demanda.responsavel ? Formatacao.textoSeguro(demanda.responsavel.nome) : ''
    ),
    linhaDaFicha('Cadastrada por', Formatacao.textoSeguro(demanda.criadoPor)),
    linhaDaFicha('Data de criacao', Formatacao.formatarDataHora(demanda.criadoEm)),
    linhaDaFicha('Ultima atualizacao', Formatacao.formatarDataHora(demanda.atualizadoEm)),
    linhaDaFicha(
      'Prazo de finalizacao',
      textoDoPrazo,
      aviso ? 'detalhes-ficha__valor--atencao' : ''
    ),
  ].join('');
}

/**
 * Desenha os botoes de mudanca de status.
 *
 * A lista de status possiveis vem pronta do backend, ja considerando o
 * ciclo de vida da demanda e o perfil do usuario. A tela apenas desenha
 * o que recebeu, sem repetir as regras aqui.
 */
function desenharAcoesDeStatus(acoes, demanda) {
  const areaDeAcoes = document.getElementById('areaDeAcoes');
  const areaDosBotoes = document.getElementById('botoesDeStatus');
  const ajuda = document.getElementById('ajudaDasAcoes');

  if (acoes.proximosStatus.length === 0) {
    // Demandas concluidas e canceladas nao tem mais acoes.
    if (demanda.status === 'CONCLUIDA' || demanda.status === 'CANCELADA') {
      areaDeAcoes.hidden = false;
      areaDosBotoes.innerHTML = '';
      ajuda.textContent =
        `Esta demanda esta ${demanda.statusDescricao.toLowerCase()} e nao ` +
        'recebe mais alteracoes de status. O historico abaixo continua disponivel.';
    }
    return;
  }

  areaDeAcoes.hidden = false;
  ajuda.textContent = `Status atual: ${demanda.statusDescricao}. Escolha o proximo passo.`;

  areaDosBotoes.innerHTML = acoes.proximosStatus
    .map((status) => {
      // O cancelamento recebe aparencia de acao de atencao.
      const classe =
        status.valor === 'CANCELADA'
          ? 'botao botao--perigo botao--empilha-no-celular'
          : 'botao botao--principal botao--empilha-no-celular';

      const texto =
        status.valor === 'CANCELADA' ? 'Cancelar demanda' : `Mover para ${status.descricao}`;

      return `<button type="button" class="${classe}" data-status="${status.valor}">${texto}</button>`;
    })
    .join('');

  // Liga cada botao a acao de mudar o status.
  areaDosBotoes.querySelectorAll('button').forEach((botao) => {
    botao.addEventListener('click', () => alterarStatus(botao.dataset.status, botao));
  });
}

/** Desenha a lista de comentarios. */
function desenharComentarios(comentarios) {
  document.getElementById('contadorDeComentarios').textContent =
    comentarios.length === 0 ? '' : `(${comentarios.length})`;

  const area = document.getElementById('listaDeComentarios');

  if (comentarios.length === 0) {
    area.innerHTML = `
      <div class="aviso-vazio">
        <p class="aviso-vazio__titulo">Nenhum comentario ainda</p>
        <p>Seja o primeiro a registrar uma observacao nesta demanda.</p>
      </div>
    `;
    return;
  }

  area.innerHTML = comentarios
    .map(
      (comentario) => `
        <article class="comentario">
          <div class="comentario__inicial" aria-hidden="true">
            ${Formatacao.textoSeguro(comentario.autor.nome.trim().charAt(0).toUpperCase())}
          </div>
          <div class="comentario__conteudo">
            <div class="comentario__topo">
              <span class="comentario__autor">${Formatacao.textoSeguro(comentario.autor.nome)}</span>
              <span class="comentario__data">${Formatacao.formatarDataHora(comentario.criadoEm)}</span>
            </div>
            <p class="comentario__texto">${Formatacao.textoSeguro(comentario.texto)}</p>
          </div>
        </article>
      `
    )
    .join('');
}

/**
 * Monta a frase de uma linha do historico.
 *
 * O backend grava o campo alterado e os valores antigo e novo. Aqui
 * transformamos isso em uma frase que uma pessoa entenda ao ler.
 */
function fraseDoHistorico(registro) {
  const novo = `<span class="historico__valor">${Formatacao.textoSeguro(registro.valorNovo)}</span>`;
  const anterior = registro.valorAnterior
    ? `<span class="historico__valor">${Formatacao.textoSeguro(registro.valorAnterior)}</span>`
    : null;

  // A criacao da demanda e o unico registro sem valor anterior por natureza.
  if (registro.campoAlterado === 'criacao') {
    return 'Demanda cadastrada no sistema';
  }

  if (registro.campoAlterado === 'prazo') {
    const prazoNovo = registro.valorNovo
      ? `<span class="historico__valor">${Formatacao.formatarData(registro.valorNovo)}</span>`
      : '<span class="historico__valor">sem prazo</span>';

    const prazoAnterior = registro.valorAnterior
      ? `<span class="historico__valor">${Formatacao.formatarData(registro.valorAnterior)}</span>`
      : '<span class="historico__valor">sem prazo</span>';

    return `Prazo alterado de ${prazoAnterior} para ${prazoNovo}`;
  }

  // Nomes dos campos como aparecem para o usuario.
  const nomeDoCampo = {
    status: 'Status',
    responsavel: 'Responsavel',
    prioridade: 'Prioridade',
    tipo: 'Tipo',
  }[registro.campoAlterado] || Formatacao.textoSeguro(registro.campoAlterado);

  // Quando nao havia valor anterior, a frase muda de "alterado de X para Y"
  // para "definido como Y", que soa natural.
  if (!anterior) {
    return `${nomeDoCampo} definido como ${novo}`;
  }

  return `${nomeDoCampo} alterado de ${anterior} para ${novo}`;
}

/** Desenha a linha do tempo do historico. */
function desenharHistorico(historico) {
  const area = document.getElementById('listaDoHistorico');

  if (historico.length === 0) {
    area.innerHTML = '<div class="aviso-vazio">Nenhuma alteracao registrada.</div>';
    return;
  }

  area.innerHTML = `
    <ul class="historico">
      ${historico
        .map(
          (registro) => `
            <li class="historico__item">
              <div class="historico__descricao">${fraseDoHistorico(registro)}</div>
              <div class="historico__rodape">
                ${Formatacao.textoSeguro(registro.autor)} &middot;
                ${Formatacao.formatarDataHora(registro.criadoEm)}
              </div>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

/** Busca a demanda na API e desenha a tela inteira. */
async function carregarDemanda() {
  try {
    const resposta = await Api.obterDemanda(codigoDaDemanda);
    const demanda = resposta.demanda;

    document.title = `${demanda.titulo} | Acompanhamento de Demandas`;
    document.getElementById('tituloDaDemanda').textContent = demanda.titulo;
    document.getElementById('descricaoDaDemanda').textContent = demanda.descricao;

    document.getElementById('etiquetasDaDemanda').innerHTML = [
      Formatacao.etiquetaStatus(demanda.status, demanda.statusDescricao),
      Formatacao.etiquetaPrioridade(demanda.prioridade, demanda.prioridadeDescricao),
      Formatacao.etiquetaTipo(demanda.tipoDescricao),
    ].join('');

    desenharFicha(demanda);
    desenharAcoesDeStatus(resposta.acoesPermitidas, demanda);
    desenharComentarios(resposta.comentarios);
    desenharHistorico(resposta.historico);

    // Botao de editar, apenas quando o backend informa que e permitido.
    if (resposta.acoesPermitidas.podeEditar) {
      const botaoEditar = document.getElementById('botaoEditar');
      botaoEditar.href = `/paginas/demanda-formulario.html?id=${demanda.id}`;
      botaoEditar.hidden = false;
    }

    avisoCarregandoDetalhes.hidden = true;
    conteudoDaDemanda.hidden = false;
  } catch (erro) {
    avisoCarregandoDetalhes.hidden = true;
    mostrarMensagemNosDetalhes(erro.message);
  }
}

/**
 * Muda o status da demanda.
 *
 * O cancelamento pede confirmacao, porque e a acao mais dificil de
 * desfazer: uma demanda cancelada nao volta atras.
 */
async function alterarStatus(novoStatus, botao) {
  if (novoStatus === 'CANCELADA') {
    const confirmou = window.confirm(
      'Deseja realmente cancelar esta demanda?\n\n' +
        'A demanda nao sera apagada: ela continuara no sistema com o status ' +
        'Cancelada e o historico sera mantido. Essa acao nao pode ser desfeita.'
    );

    if (!confirmou) {
      return;
    }
  }

  botao.disabled = true;
  const textoOriginal = botao.textContent;
  botao.textContent = 'Salvando...';

  try {
    const resposta = await Api.alterarStatus(codigoDaDemanda, novoStatus);

    mostrarMensagemNosDetalhes(resposta.mensagem, 'sucesso');

    // Recarrega os dados para atualizar as etiquetas, os botoes
    // disponiveis e o historico.
    await carregarDemanda();
  } catch (erro) {
    mostrarMensagemNosDetalhes(erro.message);
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

/** Envio de um novo comentario. */
formularioDeComentario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const texto = textoDoComentario.value.trim();

  erroComentario.textContent = '';
  erroComentario.classList.remove('campo__erro--visivel');
  textoDoComentario.classList.remove('campo__area--invalido');

  if (texto === '') {
    textoDoComentario.classList.add('campo__area--invalido');
    erroComentario.textContent = 'Escreva o comentario antes de enviar.';
    erroComentario.classList.add('campo__erro--visivel');
    return;
  }

  botaoComentar.disabled = true;
  botaoComentar.textContent = 'Enviando...';

  try {
    await Api.comentar(codigoDaDemanda, texto);

    textoDoComentario.value = '';

    // Recarrega para trazer o comentario ja gravado no banco,
    // com a data e a hora exatas do servidor.
    await carregarDemanda();
  } catch (erro) {
    mostrarMensagemNosDetalhes(erro.message);
  } finally {
    botaoComentar.disabled = false;
    botaoComentar.textContent = 'Enviar comentario';
  }
});

/** Ponto de partida da tela. */
(async function iniciarDetalhes() {
  const usuario = await Sessao.exigirLogin();

  if (!usuario) {
    return;
  }

  Sessao.montarCabecalho(usuario, 'demandas');

  // Sem o codigo da demanda no endereco nao ha o que mostrar.
  if (!codigoDaDemanda) {
    avisoCarregandoDetalhes.hidden = true;
    mostrarMensagemNosDetalhes(
      'Nenhuma demanda foi informada. Volte para a listagem e escolha uma demanda.'
    );
    return;
  }

  await carregarDemanda();

  /*
   * Confirmacoes vindas da tela de formulario.
   * Sao enviadas pelo endereco da pagina (?criado=1 ou ?salvo=1) porque
   * o navegador troca de pagina depois de salvar, e a mensagem precisa
   * aparecer aqui.
   */
  const parametros = new URLSearchParams(window.location.search);

  if (parametros.get('criado') === '1') {
    mostrarMensagemNosDetalhes('Demanda cadastrada com sucesso.', 'sucesso');
  } else if (parametros.get('salvo') === '1') {
    mostrarMensagemNosDetalhes('Alteracoes salvas com sucesso.', 'sucesso');
  }
})();
