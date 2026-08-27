/**
 * Autor exclusivo deste arquivo: Enzo Carleti Teixeira
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Comportamento da tela de Listagem de Demandas.
 *
 * Responsabilidades:
 * 1. preencher as listas de projeto e responsavel com os dados da API;
 * 2. montar os filtros escolhidos e pedir a listagem ao backend;
 * 3. desenhar a tabela de resultados;
 * 4. guardar os filtros no endereco da pagina, para que a listagem possa
 *    ser recarregada ou compartilhada mantendo a mesma consulta.
 */

const formularioDeFiltros = document.getElementById('formularioDeFiltros');
const campoBusca = document.getElementById('busca');
const filtroStatus = document.getElementById('filtroStatus');
const filtroPrioridade = document.getElementById('filtroPrioridade');
const filtroTipo = document.getElementById('filtroTipo');
const filtroProjeto = document.getElementById('filtroProjeto');
const filtroResponsavel = document.getElementById('filtroResponsavel');
const campoOrdenarPor = document.getElementById('ordenarPor');
const botaoLimparFiltros = document.getElementById('botaoLimparFiltros');
const corpoDaTabela = document.getElementById('corpoDaTabela');
const resumoDaListagem = document.getElementById('resumoDaListagem');
const areaDeMensagemDaListagem = document.getElementById('areaDeMensagem');

/** Mostra uma mensagem de erro no topo da tela. */
function mostrarErroNaListagem(texto) {
  areaDeMensagemDaListagem.textContent = texto;
  areaDeMensagemDaListagem.className = 'mensagem mensagem--erro';
}

/** Esconde a mensagem de erro. */
function esconderErroNaListagem() {
  areaDeMensagemDaListagem.className = 'mensagem mensagem--erro mensagem--escondida';
}

/** Le os filtros preenchidos na tela e monta um objeto simples. */
function lerFiltrosDaTela() {
  return {
    busca: campoBusca.value.trim(),
    status: filtroStatus.value,
    prioridade: filtroPrioridade.value,
    tipo: filtroTipo.value,
    projetoId: filtroProjeto.value,
    responsavelId: filtroResponsavel.value,
    ordenarPor: campoOrdenarPor.value,
  };
}

/**
 * Guarda os filtros no endereco da pagina.
 *
 * Por que fazer isso: se o usuario recarregar a pagina ou voltar da tela
 * de detalhes, os filtros continuam aplicados. O endereco tambem pode ser
 * copiado e enviado a um colega, que vera exatamente a mesma consulta.
 *
 * O replaceState troca o endereco sem recarregar a pagina.
 */
function guardarFiltrosNoEndereco(filtros) {
  const parametros = new URLSearchParams();

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) {
      parametros.append(chave, valor);
    }
  });

  const consulta = parametros.toString();
  window.history.replaceState(null, '', consulta ? `?${consulta}` : window.location.pathname);
}

/** Preenche os filtros da tela com o que estiver no endereco da pagina. */
function aplicarFiltrosDoEndereco() {
  const parametros = new URLSearchParams(window.location.search);

  campoBusca.value = parametros.get('busca') || '';
  filtroStatus.value = parametros.get('status') || '';
  filtroPrioridade.value = parametros.get('prioridade') || '';
  filtroTipo.value = parametros.get('tipo') || '';
  filtroProjeto.value = parametros.get('projetoId') || '';
  filtroResponsavel.value = parametros.get('responsavelId') || '';
  campoOrdenarPor.value = parametros.get('ordenarPor') || 'prioridade';
}

/** Desenha uma unica linha da tabela. */
function montarLinhaDaTabela(demanda) {
  const enderecoDosDetalhes = `/paginas/demanda-detalhes.html?id=${demanda.id}`;

  // Aviso em vermelho quando a demanda esta atrasada ou vence em breve.
  // Demandas ja concluidas ou canceladas nao recebem o aviso.
  const statusPendente =
    demanda.status !== 'CONCLUIDA' && demanda.status !== 'CANCELADA';
  const aviso = statusPendente ? Formatacao.avisoDePrazo(demanda.prazoFinalizacao) : '';

  const responsavel = demanda.responsavel
    ? Formatacao.textoSeguro(demanda.responsavel.nome)
    : '<span class="tabela__sem-responsavel">Sem responsavel</span>';

  return `
    <tr>
      <td class="tabela__coluna-titulo">
        <a class="tabela__titulo-demanda" href="${enderecoDosDetalhes}">
          ${Formatacao.textoSeguro(demanda.titulo)}
        </a>
      </td>
      <td>${Formatacao.etiquetaTipo(demanda.tipoDescricao)}</td>
      <td>${Formatacao.etiquetaPrioridade(demanda.prioridade, demanda.prioridadeDescricao)}</td>
      <td>${Formatacao.etiquetaStatus(demanda.status, demanda.statusDescricao)}</td>
      <td class="tabela__secundario">${Formatacao.textoSeguro(demanda.projeto.nome)}</td>
      <td>${responsavel}</td>
      <td class="tabela__secundario">${Formatacao.formatarData(demanda.criadoEm)}</td>
      <td>
        ${Formatacao.formatarData(demanda.prazoFinalizacao)}
        ${aviso ? `<span class="tabela__prazo-atencao">${aviso}</span>` : ''}
      </td>
    </tr>
  `;
}

/** Busca as demandas na API e desenha a tabela. */
async function carregarDemandas() {
  esconderErroNaListagem();

  const filtros = lerFiltrosDaTela();
  guardarFiltrosNoEndereco(filtros);

  corpoDaTabela.innerHTML = `
    <tr><td colspan="8"><div class="aviso-vazio">Carregando as demandas...</div></td></tr>
  `;

  try {
    const resposta = await Api.listarDemandas(filtros);

    resumoDaListagem.textContent =
      resposta.total === 1
        ? '1 demanda encontrada.'
        : `${resposta.total} demandas encontradas.`;

    if (resposta.total === 0) {
      corpoDaTabela.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="aviso-vazio">
              <p class="aviso-vazio__titulo">Nenhuma demanda encontrada</p>
              <p>Tente remover algum filtro ou alterar o texto da busca.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    corpoDaTabela.innerHTML = resposta.demandas.map(montarLinhaDaTabela).join('');
  } catch (erro) {
    corpoDaTabela.innerHTML = `
      <tr><td colspan="8"><div class="aviso-vazio">Nao foi possivel carregar a lista.</div></td></tr>
    `;
    resumoDaListagem.textContent = '';
    mostrarErroNaListagem(erro.message);
  }
}

/**
 * Preenche as listas de projeto e de responsavel.
 *
 * As duas listas vem do banco de dados e mudam conforme o perfil do
 * usuario, por isso nao podem ficar escritas direto no HTML.
 */
async function carregarListasDeFiltro() {
  try {
    // As duas consultas sao disparadas ao mesmo tempo, e nao uma depois da
    // outra. Como nenhuma depende da resposta da outra, esperar as duas
    // juntas deixa o carregamento da tela mais rapido.
    const [respostaDeProjetos, respostaDeUsuarios] = await Promise.all([
      Api.listarProjetos(),
      Api.listarUsuarios(),
    ]);

    respostaDeProjetos.projetos.forEach((projeto) => {
      const opcao = document.createElement('option');
      opcao.value = projeto.id;
      opcao.textContent = projeto.nome;
      filtroProjeto.appendChild(opcao);
    });

    respostaDeUsuarios.usuarios.forEach((usuario) => {
      const opcao = document.createElement('option');
      opcao.value = usuario.id;
      opcao.textContent = usuario.nome;
      filtroResponsavel.appendChild(opcao);
    });
  } catch (erro) {
    // A tela continua funcionando com os demais filtros, entao apenas
    // avisamos o usuario em vez de interromper o carregamento.
    mostrarErroNaListagem(
      `Nao foi possivel carregar as listas de projeto e responsavel. ${erro.message}`
    );
  }
}

/** Envio do formulario de filtros. */
formularioDeFiltros.addEventListener('submit', (evento) => {
  evento.preventDefault();
  carregarDemandas();
});

/** Limpa todos os filtros e recarrega a lista completa. */
botaoLimparFiltros.addEventListener('click', () => {
  formularioDeFiltros.reset();
  campoOrdenarPor.value = 'prioridade';
  carregarDemandas();
});

/**
 * Recarrega a lista assim que o usuario troca uma caixa de selecao,
 * sem precisar clicar em "Aplicar filtros". A busca por texto continua
 * exigindo o clique, para nao disparar uma consulta a cada letra digitada.
 */
[filtroStatus, filtroPrioridade, filtroTipo, filtroProjeto, filtroResponsavel, campoOrdenarPor]
  .forEach((campo) => campo.addEventListener('change', carregarDemandas));

/** Ponto de partida da tela. */
(async function iniciarListagem() {
  const usuario = await Sessao.exigirLogin();

  if (!usuario) {
    return;
  }

  Sessao.montarCabecalho(usuario, 'demandas');

  // O botao de cadastro so faz sentido para quem pode cadastrar.
  // Mesmo assim, o backend confere o perfil novamente ao receber o pedido.
  if (usuario.perfil === 'ADMINISTRADOR' || usuario.perfil === 'LIDER') {
    document.getElementById('botaoNovaDemanda').hidden = false;
  }

  await carregarListasDeFiltro();

  // Aplica os filtros que vieram no endereco antes da primeira consulta.
  aplicarFiltrosDoEndereco();

  await carregarDemandas();
})();
