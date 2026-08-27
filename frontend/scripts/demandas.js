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

/* Nome da chave onde os filtros ficam guardados para a tela de detalhes.
   O mesmo nome e lido em scripts/demanda-detalhes.js. */
const CHAVE_DOS_FILTROS_DA_LISTAGEM = 'pi2_filtros_da_listagem';

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
  const enderecoDaListagem = consulta ? `?${consulta}` : window.location.pathname;

  window.history.replaceState(null, '', enderecoDaListagem);

  /*
   * Guarda a consulta tambem no sessionStorage.
   *
   * Qual problema isso resolve:
   * o usuario filtrava a lista, abria uma demanda e clicava em "Voltar para
   * a listagem". A listagem reabria sem nenhum filtro, e ele tinha de
   * escolher tudo de novo. A tela de detalhes le esta chave e monta o link
   * de voltar com os mesmos filtros.
   *
   * O sessionStorage e apagado ao fechar a aba, que e exatamente o tempo de
   * vida que faz sentido para uma consulta em andamento.
   */
  window.sessionStorage.setItem(CHAVE_DOS_FILTROS_DA_LISTAGEM, consulta);
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

/**
 * Desenha uma unica linha da tabela.
 *
 * Cada celula recebe o atributo data-rotulo com o nome da sua coluna.
 * Em telas estreitas a tabela vira uma lista de cartoes, e o CSS usa esse
 * atributo para escrever o nome da coluna ao lado do valor. Sem isso, no
 * celular apareceriam valores soltos sem indicacao do que sao.
 *
 * A linha inteira guarda o endereco dos detalhes em data-endereco, lido
 * pelo tratador de clique mais abaixo.
 */
function montarLinhaDaTabela(demanda) {
  const enderecoDosDetalhes = `/paginas/demanda-detalhes.html?id=${demanda.id}`;

  // Aviso em vermelho quando a demanda esta atrasada ou vence em breve.
  // Demandas ja concluidas ou canceladas nao recebem o aviso.
  const statusPendente =
    demanda.status !== 'CONCLUIDA' && demanda.status !== 'CANCELADA';
  const aviso = statusPendente ? Formatacao.avisoDePrazo(demanda.prazoFinalizacao) : '';

  const nomeDoResponsavel = demanda.responsavel ? demanda.responsavel.nome : '';

  const responsavel = demanda.responsavel
    ? `<span class="tabela__texto-cortado" title="${Formatacao.textoSeguro(nomeDoResponsavel)}"
        >${Formatacao.textoSeguro(nomeDoResponsavel)}</span>`
    : '<span class="tabela__sem-responsavel">Sem responsavel</span>';

  return `
    <tr data-endereco="${enderecoDosDetalhes}" data-prioridade="${Formatacao.textoSeguro(demanda.prioridade)}">
      <td class="tabela__coluna-titulo">
        <a class="tabela__titulo-demanda"
           href="${enderecoDosDetalhes}"
           title="${Formatacao.textoSeguro(demanda.titulo)}">
          ${Formatacao.textoSeguro(demanda.titulo)}
        </a>
      </td>
      <td class="tabela__coluna-tipo" data-rotulo="Tipo">
        ${Formatacao.etiquetaTipo(demanda.tipoDescricao)}
      </td>
      <td class="tabela__coluna-prioridade" data-rotulo="Prioridade">
        ${Formatacao.etiquetaPrioridade(demanda.prioridade, demanda.prioridadeDescricao)}
      </td>
      <td class="tabela__coluna-status" data-rotulo="Status">
        ${Formatacao.etiquetaStatus(demanda.status, demanda.statusDescricao)}
      </td>
      <td class="tabela__coluna-projeto tabela__secundario" data-rotulo="Projeto">
        <span class="tabela__texto-cortado" title="${Formatacao.textoSeguro(demanda.projeto.nome)}"
          >${Formatacao.textoSeguro(demanda.projeto.nome)}</span>
      </td>
      <td class="tabela__coluna-responsavel" data-rotulo="Responsavel">${responsavel}</td>
      <td class="tabela__coluna-criacao tabela__secundario" data-rotulo="Criacao">
        ${Formatacao.formatarData(demanda.criadoEm)}
      </td>
      <td class="tabela__coluna-prazo" data-rotulo="Prazo">
        <span>
          ${Formatacao.formatarData(demanda.prazoFinalizacao)}
          ${aviso ? `<span class="tabela__prazo-atencao">${aviso}</span>` : ''}
        </span>
      </td>
    </tr>
  `;
}

/**
 * Monta linhas cinzas no formato da tabela, exibidas durante a consulta.
 *
 * Antes esta area mostrava apenas a frase "Carregando as demandas...".
 * O problema era que a tabela encolhia para uma linha so e voltava a
 * crescer quando os dados chegavam, fazendo a pagina saltar a cada
 * filtro aplicado. Desenhando linhas do mesmo tamanho das reais, a altura
 * da tabela quase nao muda e a troca fica suave.
 */
function montarLinhasDeCarregamento(quantidade) {
  const celulas = Array.from({ length: 8 })
    .map(() => '<td><span class="esqueleto"></span></td>')
    .join('');

  return Array.from({ length: quantidade })
    .map(() => `<tr aria-hidden="true">${celulas}</tr>`)
    .join('');
}

/*
 * Numero da consulta mais recente.
 *
 * Como a busca agora dispara sozinha enquanto o usuario digita, duas
 * consultas podem estar em andamento ao mesmo tempo. Se a primeira
 * demorar mais que a segunda, ela chegaria depois e sobrescreveria o
 * resultado certo com um resultado velho. Cada consulta recebe um numero;
 * quando a resposta chega, so desenha a tela se ainda for a mais recente.
 */
let numeroDaConsultaAtual = 0;

/** Busca as demandas na API e desenha a tabela. */
async function carregarDemandas() {
  esconderErroNaListagem();

  const filtros = lerFiltrosDaTela();
  guardarFiltrosNoEndereco(filtros);

  numeroDaConsultaAtual += 1;
  const numeroDestaConsulta = numeroDaConsultaAtual;

  // Mantem a quantidade de linhas atual, para a tabela nao mudar de altura.
  const linhasVisiveis = corpoDaTabela.querySelectorAll('tr').length;
  corpoDaTabela.innerHTML = montarLinhasDeCarregamento(Math.min(Math.max(linhasVisiveis, 5), 10));

  try {
    const resposta = await Api.listarDemandas(filtros);

    // Chegou uma resposta antiga: outra consulta ja foi disparada depois
    // desta, entao o resultado dela e que vale.
    if (numeroDestaConsulta !== numeroDaConsultaAtual) {
      return;
    }

    resumoDaListagem.textContent =
      resposta.total === 1
        ? '1 demanda encontrada.'
        : `${resposta.total} demandas encontradas.`;

    if (resposta.total === 0) {
      corpoDaTabela.innerHTML = `
        <tr class="tabela__linha-aviso">
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
    if (numeroDestaConsulta !== numeroDaConsultaAtual) {
      return;
    }

    corpoDaTabela.innerHTML = `
      <tr class="tabela__linha-aviso">
        <td colspan="8"><div class="aviso-vazio">Nao foi possivel carregar a lista.</div></td>
      </tr>
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

/** Envio do formulario, disparado ao apertar Enter dentro da busca. */
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
 * sem precisar clicar em nenhum botao.
 */
[filtroStatus, filtroPrioridade, filtroTipo, filtroProjeto, filtroResponsavel, campoOrdenarPor]
  .forEach((campo) => campo.addEventListener('change', carregarDemandas));

/**
 * BUSCA ENQUANTO O USUARIO DIGITA
 *
 * Antes, a busca por texto so acontecia ao clicar em "Aplicar filtros".
 * As caixas de selecao ja filtravam sozinhas, entao a tela se comportava
 * de dois jeitos diferentes e quem digitava e esperava nao via nada mudar.
 *
 * Agora a busca dispara sozinha, mas nao a cada tecla: o temporizador
 * abaixo espera o usuario parar de digitar por 400 milissegundos antes de
 * chamar a API. Essa tecnica se chama debounce. Sem ela, digitar uma
 * palavra de dez letras geraria dez consultas ao banco de dados; com ela,
 * gera uma so.
 *
 * O botao "Aplicar filtros" deixou de ser necessario e foi retirado da
 * tela. Apertar Enter no campo continua funcionando, para quem prefere.
 */
const ESPERA_DA_BUSCA_EM_MILISSEGUNDOS = 400;
let temporizadorDaBusca = null;

campoBusca.addEventListener('input', () => {
  window.clearTimeout(temporizadorDaBusca);
  temporizadorDaBusca = window.setTimeout(carregarDemandas, ESPERA_DA_BUSCA_EM_MILISSEGUNDOS);
});

/**
 * CLIQUE EM QUALQUER PONTO DA LINHA
 *
 * O ouvinte fica no corpo da tabela, e nao em cada linha. Como as linhas
 * sao redesenhadas a cada consulta, registrar um ouvinte por linha exigiria
 * registra-los de novo toda vez. Com um unico ouvinte no elemento pai, o
 * clique e capturado quando sobe pela arvore. Isso se chama delegacao de
 * eventos.
 */
corpoDaTabela.addEventListener('click', (evento) => {
  // Cliques em um link ja funcionam sozinhos; nao interferimos neles.
  if (evento.target.closest('a')) {
    return;
  }

  const linha = evento.target.closest('tr[data-endereco]');

  if (!linha) {
    return;
  }

  // Quem esta selecionando um texto da linha nao quer navegar.
  if (window.getSelection().toString()) {
    return;
  }

  window.location.href = linha.dataset.endereco;
});

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
