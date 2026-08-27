/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Comunicacao entre o frontend e a API.
 *
 * Todas as telas conversam com o backend por meio das funcoes deste
 * arquivo. Concentrar isso em um unico lugar resolve tres problemas de
 * uma vez:
 *
 * 1. o token de login e enviado automaticamente em toda requisicao;
 * 2. as mensagens de erro chegam sempre no mesmo formato para as telas;
 * 3. quando a sessao expira, o usuario e levado de volta ao login
 *    sem que cada tela precise tratar esse caso.
 */

// Endereco base da API. Como o frontend e servido pelo mesmo servidor,
// basta o caminho relativo.
const ENDERECO_DA_API = '/api';

/**
 * Erro devolvido pelas funcoes deste arquivo.
 *
 * Guarda tambem o codigo HTTP, porque algumas telas precisam saber a
 * diferenca entre "nao encontrado" (404) e "sem permissao" (403).
 */
class ErroDaApi extends Error {
  constructor(mensagem, codigoHttp) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.codigoHttp = codigoHttp;
  }
}

/**
 * Envia uma requisicao para a API.
 *
 * O que entra:
 *   caminho - endereco da rota, por exemplo '/demandas'
 *   opcoes  - { metodo, corpo }
 *
 * O que sai:
 *   o conteudo da resposta ja convertido de JSON para objeto JavaScript.
 *
 * Quando a resposta indica erro, a funcao lanca um ErroDaApi com a
 * mensagem escrita pelo backend, que ja vem pronta para ser mostrada
 * ao usuario.
 */
async function chamarApi(caminho, opcoes = {}) {
  const { metodo = 'GET', corpo = null } = opcoes;

  const cabecalhos = {};
  const token = Sessao.lerToken();

  if (token) {
    cabecalhos['Authorization'] = `Bearer ${token}`;
  }

  if (corpo !== null) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  let resposta;

  try {
    resposta = await fetch(`${ENDERECO_DA_API}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === null ? null : JSON.stringify(corpo),
    });
  } catch (erroDeRede) {
    // Este catch pega apenas falhas de conexao: servidor desligado,
    // internet fora do ar. Erros de regra de negocio chegam como
    // resposta normal, com codigo 400 ou 403, e sao tratados abaixo.
    console.error('[api] Falha de conexao:', erroDeRede);

    throw new ErroDaApi(
      'Nao foi possivel falar com o servidor. Verifique se o sistema esta ' +
        'ligado e tente novamente.',
      0
    );
  }

  // Respostas 204 nao trazem conteudo para converter.
  const textoDaResposta = await resposta.text();
  let dados = null;

  if (textoDaResposta) {
    try {
      dados = JSON.parse(textoDaResposta);
    } catch {
      dados = null;
    }
  }

  if (resposta.ok) {
    return dados;
  }

  /*
   * Sessao expirada ou token invalido.
   * Levamos o usuario de volta ao login, avisando o motivo. A propria
   * tela de login mostra o aviso, lendo o endereco da pagina.
   */
  if (resposta.status === 401) {
    Sessao.encerrar();

    // A tela de login nao redireciona para ela mesma.
    if (!window.location.pathname.endsWith('/') &&
        !window.location.pathname.endsWith('index.html')) {
      window.location.href = '/index.html?sessao=expirada';
    }
  }

  const mensagem =
    (dados && dados.erro) ||
    'Nao foi possivel concluir a operacao. Tente novamente em alguns instantes.';

  throw new ErroDaApi(mensagem, resposta.status);
}

/**
 * Funcoes de acesso a API, uma para cada rota do backend.
 * As telas chamam sempre por aqui, nunca usando fetch diretamente.
 */
const Api = {
  // ----- Autenticacao -----
  entrar(email, senha) {
    return chamarApi('/autenticacao/login', {
      metodo: 'POST',
      corpo: { email, senha },
    });
  },

  conferirSessao() {
    return chamarApi('/autenticacao/eu');
  },

  // ----- Demandas -----

  /**
   * Lista as demandas aplicando os filtros informados.
   *
   * Recebe um objeto simples, por exemplo:
   *   { status: 'ABERTA', busca: 'login', ordenarPor: 'prazo' }
   *
   * Os campos vazios sao descartados para nao virarem filtros em branco
   * no endereco da requisicao.
   */
  listarDemandas(filtros = {}) {
    const parametros = new URLSearchParams();

    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor !== '' && valor !== null && valor !== undefined) {
        parametros.append(chave, valor);
      }
    });

    const consulta = parametros.toString();
    return chamarApi(`/demandas${consulta ? `?${consulta}` : ''}`);
  },

  obterDemanda(id) {
    return chamarApi(`/demandas/${id}`);
  },

  criarDemanda(dados) {
    return chamarApi('/demandas', { metodo: 'POST', corpo: dados });
  },

  editarDemanda(id, dados) {
    return chamarApi(`/demandas/${id}`, { metodo: 'PUT', corpo: dados });
  },

  alterarStatus(id, status) {
    return chamarApi(`/demandas/${id}/status`, {
      metodo: 'PATCH',
      corpo: { status },
    });
  },

  // ----- Comentarios -----
  comentar(demandaId, texto) {
    return chamarApi(`/demandas/${demandaId}/comentarios`, {
      metodo: 'POST',
      corpo: { texto },
    });
  },

  // ----- Dashboard -----
  obterDashboard() {
    return chamarApi('/dashboard');
  },

  // ----- Listas de apoio -----
  listarProjetos() {
    return chamarApi('/projetos');
  },

  listarUsuarios(projetoId = null) {
    return chamarApi(projetoId ? `/usuarios?projetoId=${projetoId}` : '/usuarios');
  },

  // ----- API externa de feriados -----
  verificarFeriado(data) {
    return chamarApi(`/feriados/verificar?data=${data}`);
  },
};
