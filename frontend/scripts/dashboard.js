/**
 * Autor exclusivo deste arquivo: Jose Gabriel Bedani
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Comportamento da tela de Dashboard.
 *
 * Fluxo desta tela:
 * 1. confere se o usuario esta logado;
 * 2. monta o cabecalho;
 * 3. busca os numeros na rota /api/dashboard;
 * 4. desenha os cartoes, as barras e as listas de destaque.
 */

const areaDeMensagemDoDashboard = document.getElementById('areaDeMensagem');
const avisoCarregando = document.getElementById('avisoCarregando');
const conteudoDoDashboard = document.getElementById('conteudoDoDashboard');
const areaDosIndicadores = document.getElementById('areaDosIndicadores');
const areaDePrioridades = document.getElementById('areaDePrioridades');
const areaDeTipos = document.getElementById('areaDeTipos');
const areaDeCriticas = document.getElementById('areaDeCriticas');
const areaDePrazos = document.getElementById('areaDePrazos');

/** Mostra uma mensagem de erro no topo da tela. */
function mostrarErroNoDashboard(texto) {
  areaDeMensagemDoDashboard.textContent = texto;
  areaDeMensagemDoDashboard.className = 'mensagem mensagem--erro';
}

/**
 * Desenha os cartoes com os totais.
 *
 * Recebe o objeto porStatus devolvido pela API, por exemplo:
 *   { ABERTA: 5, EM_ANDAMENTO: 4, EM_REVISAO: 2, CONCLUIDA: 2, CANCELADA: 1 }
 */
function desenharIndicadores(total, porStatus, descricoesDeStatus) {
  // O primeiro cartao e o total geral; os demais vem da lista de status.
  const cartoes = [
    { chave: 'total', rotulo: 'Total de demandas', valor: total },
    ...Object.keys(porStatus).map((status) => ({
      chave: status.toLowerCase(),
      rotulo: descricoesDeStatus[status],
      valor: porStatus[status],
    })),
  ];

  areaDosIndicadores.innerHTML = cartoes
    .map(
      (cartao) => `
        <div class="indicador indicador--${cartao.chave}">
          <div class="indicador__rotulo">${Formatacao.textoSeguro(cartao.rotulo)}</div>
          <div class="indicador__valor">${cartao.valor}</div>
        </div>
      `
    )
    .join('');
}

/**
 * Desenha uma lista de barras proporcionais.
 *
 * A largura de cada barra e a porcentagem em relacao ao maior valor da
 * lista, e nao ao total. Usar o maior valor como referencia faz a barra
 * mais alta ocupar a largura inteira, o que torna a comparacao visual
 * entre os itens muito mais facil de enxergar.
 */
function desenharBarras(area, contagem, descricoes, usarCorPorChave) {
  const chaves = Object.keys(contagem);
  const maiorValor = Math.max(...chaves.map((chave) => contagem[chave]), 1);

  area.innerHTML = chaves
    .map((chave) => {
      const valor = contagem[chave];
      const largura = Math.round((valor / maiorValor) * 100);

      // A cor da barra so muda na lista de prioridades.
      const classeDeCor = usarCorPorChave
        ? `barra-linha__preenchimento--${chave.toLowerCase()}`
        : '';

      return `
        <div class="barra-linha">
          <span class="barra-linha__nome">${Formatacao.textoSeguro(descricoes[chave])}</span>
          <div class="barra-linha__trilho">
            <div class="barra-linha__preenchimento ${classeDeCor}" style="width: ${largura}%"></div>
          </div>
          <span class="barra-linha__valor">${valor}</span>
        </div>
      `;
    })
    .join('');
}

/**
 * Desenha uma lista de demandas em destaque.
 *
 * O parametro mostrarDiasRestantes decide se o aviso de prazo aparece
 * em vermelho quando a demanda esta atrasada ou vence em breve.
 */
function desenharListaDeDestaque(area, demandas, textoQuandoVazio, mostrarDiasRestantes) {
  if (demandas.length === 0) {
    area.innerHTML = `
      <div class="aviso-vazio">
        <p class="aviso-vazio__titulo">Nenhuma demanda nesta situacao</p>
        <p>${Formatacao.textoSeguro(textoQuandoVazio)}</p>
      </div>
    `;
    return;
  }

  area.innerHTML = `
    <ul class="lista-destaque">
      ${demandas
        .map((demanda) => {
          const aviso = Formatacao.avisoDePrazo(demanda.prazoFinalizacao);

          // Fica em vermelho quando ha aviso de atraso ou vencimento proximo.
          const classeDoPrazo =
            mostrarDiasRestantes && aviso
              ? 'lista-destaque__prazo lista-destaque__prazo--atencao'
              : 'lista-destaque__prazo';

          const textoDoPrazo = demanda.prazoFinalizacao
            ? `Prazo: ${Formatacao.formatarData(demanda.prazoFinalizacao)}${aviso ? ` (${aviso})` : ''}`
            : 'Sem prazo definido';

          return `
            <li class="lista-destaque__item">
              <div>
                <a class="lista-destaque__titulo"
                   href="/paginas/demanda-detalhes.html?id=${demanda.id}">
                  ${Formatacao.textoSeguro(demanda.titulo)}
                </a>
                <div class="lista-destaque__projeto">
                  ${Formatacao.textoSeguro(demanda.projeto)}
                </div>
              </div>

              <div class="lista-destaque__direita">
                ${Formatacao.etiquetaStatus(demanda.status, demanda.statusDescricao)}
                <span class="${classeDoPrazo}">${Formatacao.textoSeguro(textoDoPrazo)}</span>
              </div>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

/** Carrega os dados e desenha a tela. */
async function carregarDashboard() {
  try {
    const dados = await Api.obterDashboard();

    desenharIndicadores(dados.total, dados.porStatus, dados.descricoes.status);

    // A lista de prioridades usa cores diferentes por item; a de tipos, nao.
    desenharBarras(areaDePrioridades, dados.porPrioridade, dados.descricoes.prioridade, true);
    desenharBarras(areaDeTipos, dados.porTipo, dados.descricoes.tipo, false);

    desenharListaDeDestaque(
      areaDeCriticas,
      dados.demandasCriticasEmAberto,
      'Nao ha demandas de prioridade critica pendentes no momento.',
      false
    );

    // Ajusta o titulo com a quantidade de dias configurada no backend.
    document.getElementById('tituloProximasDoPrazo').textContent =
      `Demandas proximas do prazo (proximos ${dados.diasParaAlertaDePrazo} dias)`;

    desenharListaDeDestaque(
      areaDePrazos,
      dados.demandasProximasDoPrazo,
      'Nenhuma demanda pendente vence nos proximos dias.',
      true
    );

    // Troca o aviso de carregamento pelo conteudo pronto.
    avisoCarregando.hidden = true;
    conteudoDoDashboard.hidden = false;
  } catch (erro) {
    avisoCarregando.hidden = true;
    mostrarErroNoDashboard(erro.message);
  }
}

/** Ponto de partida da tela. */
(async function iniciarDashboard() {
  const usuario = await Sessao.exigirLogin();

  if (!usuario) {
    // O usuario ja foi redirecionado para a tela de login.
    return;
  }

  Sessao.montarCabecalho(usuario, 'dashboard');

  // Explica de quais projetos sao os numeros mostrados.
  document.getElementById('subtituloDoDashboard').textContent =
    usuario.perfil === 'ADMINISTRADOR'
      ? 'Resumo de todas as demandas cadastradas no sistema.'
      : 'Resumo das demandas dos projetos aos quais voce esta vinculado.';

  await carregarDashboard();
})();
