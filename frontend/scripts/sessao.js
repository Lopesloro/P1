/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Controle da sessao do usuario e montagem do cabecalho.
 *
 * Onde o token fica guardado:
 * quando o usuario marca "Lembrar-me" no login, o token vai para o
 * localStorage, que continua existindo depois de fechar o navegador.
 * Quando ele nao marca, o token vai para o sessionStorage, que e apagado
 * ao fechar a aba. E assim que a opcao "Lembrar-me" realmente funciona.
 *
 * Observacao de seguranca: esconder um botao pelo perfil serve apenas
 * para deixar a tela mais clara. Quem decide de verdade o que pode ou
 * nao ser feito e o backend, que confere o perfil em toda requisicao.
 */

const CHAVE_TOKEN = 'pi2_token';
const CHAVE_USUARIO = 'pi2_usuario';

const Sessao = {
  /**
   * Guarda o token e os dados do usuario depois do login.
   * O parametro lembrar decide onde a informacao sera gravada.
   */
  iniciar(token, usuario, lembrar) {
    // Limpa os dois lugares antes de gravar, para nao sobrar
    // informacao de um login anterior.
    this.encerrar();

    const deposito = lembrar ? window.localStorage : window.sessionStorage;
    deposito.setItem(CHAVE_TOKEN, token);
    deposito.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  },

  /** Devolve o token guardado, ou null quando nao existe. */
  lerToken() {
    return (
      window.localStorage.getItem(CHAVE_TOKEN) ||
      window.sessionStorage.getItem(CHAVE_TOKEN)
    );
  },

  /** Devolve os dados do usuario logado, ou null quando nao existem. */
  lerUsuario() {
    const guardado =
      window.localStorage.getItem(CHAVE_USUARIO) ||
      window.sessionStorage.getItem(CHAVE_USUARIO);

    if (!guardado) {
      return null;
    }

    try {
      return JSON.parse(guardado);
    } catch {
      // Se o conteudo estiver corrompido, tratamos como sessao inexistente.
      return null;
    }
  },

  /** Apaga os dados da sessao dos dois depositos. */
  encerrar() {
    window.localStorage.removeItem(CHAVE_TOKEN);
    window.localStorage.removeItem(CHAVE_USUARIO);
    window.sessionStorage.removeItem(CHAVE_TOKEN);
    window.sessionStorage.removeItem(CHAVE_USUARIO);
  },

  /** Encerra a sessao e leva o usuario de volta a tela de login. */
  sair() {
    this.encerrar();
    window.location.href = '/index.html';
  },

  /**
   * Protege uma tela interna.
   *
   * Chamada no inicio de cada pagina. Se nao houver token, o usuario e
   * enviado direto para o login. Se houver, conferimos com o servidor se
   * o token continua valido, porque ele pode ter expirado.
   *
   * Devolve os dados do usuario logado.
   */
  async exigirLogin() {
    if (!this.lerToken()) {
      window.location.href = '/index.html';
      return null;
    }

    try {
      const resposta = await Api.conferirSessao();
      return resposta.usuario;
    } catch {
      // O proprio arquivo api.js ja redireciona quando o token expira.
      return null;
    }
  },

  /**
   * Monta o cabecalho com o menu e os dados do usuario.
   *
   * Cada tela tem uma <div id="cabecalho"></div> vazia no HTML, que e
   * preenchida por esta funcao. Escrever o cabecalho uma unica vez evita
   * que as cinco telas fiquem com menus diferentes entre si.
   *
   * O parametro paginaAtual recebe 'dashboard' ou 'demandas' e serve
   * para destacar o item de menu correspondente.
   */
  montarCabecalho(usuario, paginaAtual) {
    const area = document.getElementById('cabecalho');
    if (!area || !usuario) {
      return;
    }

    // A funcao textoSeguro protege contra a insercao de HTML pelo nome
    // do usuario. Veja a explicacao em scripts/formatacao.js.
    const nome = Formatacao.textoSeguro(usuario.nome);
    const perfil = Formatacao.textoSeguro(usuario.perfilDescricao || usuario.perfil);

    // Primeira letra do nome, usada no circulo do canto direito.
    const inicial = Formatacao.textoSeguro(usuario.nome.trim().charAt(0).toUpperCase());

    area.innerHTML = `
      <header class="cabecalho">
        <div class="cabecalho__interno">
          <div class="cabecalho__marca">Acompanhamento de <span>Demandas</span></div>

          <nav class="cabecalho__navegacao" aria-label="Menu principal">
            <a class="cabecalho__link ${paginaAtual === 'dashboard' ? 'cabecalho__link--ativo' : ''}"
               href="/paginas/dashboard.html">Dashboard</a>
            <a class="cabecalho__link ${paginaAtual === 'demandas' ? 'cabecalho__link--ativo' : ''}"
               href="/paginas/demandas.html">Demandas</a>
          </nav>

          <div class="cabecalho__usuario">
            <div class="cabecalho__usuario-dados">
              <div class="cabecalho__usuario-nome">${nome}</div>
              <div class="cabecalho__usuario-perfil">${perfil}</div>
            </div>
            <div class="cabecalho__inicial" aria-hidden="true">${inicial}</div>
            <button type="button" class="botao botao--secundario botao--pequeno" id="botaoSair">
              Sair
            </button>
          </div>
        </div>
      </header>
    `;

    document.getElementById('botaoSair').addEventListener('click', () => this.sair());
  },
};
