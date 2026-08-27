/**
 * Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Teste automatizado das cinco telas.
 *
 * Abre o sistema em um navegador de verdade e repete o que um usuario
 * faria: entra, filtra, cadastra, comenta e muda o status. Tambem confere
 * a responsividade em celular e tablet.
 *
 * Requisito: a biblioteca Playwright.
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Como executar:
 *   1. Recriar o banco com os dados de teste
 *   2. Deixar o servidor rodando (npm run dev)
 *   3. Rodar:  node testes/testar-telas.js
 */

const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
let ok = 0, falhou = 0;
const erroDeConsole = [];

function verificar(desc, condicao, extra = '') {
  if (condicao) { console.log(`  OK   | ${desc}`); ok++; }
  else { console.log(`  FALHA| ${desc} ${extra}`); falhou++; }
}

(async () => {
  const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const contexto = await navegador.newContext({ viewport: { width: 1400, height: 950 } });
  const p = await contexto.newPage();

  // Contamos apenas erros reais de JavaScript. Respostas 4xx da API sao
  // esperadas nos testes de validacao (senha errada, prazo em feriado) e
  // o navegador as registra no console como falha de recurso.
  p.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !t.includes('Failed to load resource')) {
      erroDeConsole.push(`${p.url()} :: ${t}`);
    }
  });
  p.on('pageerror', e => erroDeConsole.push(`${p.url()} :: PAGEERROR ${e.message}`));

  // ---------------------------------------------------------------
  console.log('=== TELA 1: LOGIN ===');
  await p.goto(`${BASE}/index.html`);
  await p.waitForTimeout(400);

  // validacao de campo vazio
  await p.click('#botaoEntrar');
  await p.waitForTimeout(300);
  verificar('campos vazios mostram erro', await p.isVisible('#erroEmail.campo__erro--visivel'));

  // email invalido
  await p.fill('#email', 'semarroba');
  await p.fill('#senha', 'x');
  await p.click('#botaoEntrar');
  await p.waitForTimeout(300);
  verificar('email sem arroba e recusado na tela',
    (await p.textContent('#erroEmail')).includes('valido'));

  // senha errada -> mensagem do backend
  await p.fill('#email', 'eduardo@time11.com');
  await p.fill('#senha', 'senhaerrada');
  await p.click('#botaoEntrar');
  await p.waitForTimeout(1200);
  verificar('senha errada mostra mensagem do servidor',
    (await p.textContent('#areaDeMensagem')).includes('incorretos'));
  verificar('senha e limpa apos erro', (await p.inputValue('#senha')) === '');

  // mostrar senha
  await p.fill('#senha', 'admin123');
  await p.click('#botaoMostrarSenha');
  verificar('botao mostrar senha revela o texto',
    (await p.getAttribute('#senha', 'type')) === 'text');
  await p.click('#botaoMostrarSenha');

  // esqueci a senha
  await p.click('#botaoEsqueciSenha');
  await p.waitForTimeout(200);
  verificar('link de senha esquecida orienta o usuario',
    (await p.textContent('#areaDeMensagem')).includes('administrador'));

  // login valido
  await p.fill('#email', 'eduardo@time11.com');
  await p.fill('#senha', 'admin123');
  await p.click('#botaoEntrar');
  await p.waitForURL('**/dashboard.html', { timeout: 10000 });
  verificar('login valido leva ao dashboard', p.url().includes('dashboard'));

  // ---------------------------------------------------------------
  console.log('\n=== TELA 2: DASHBOARD ===');
  await p.waitForSelector('#conteudoDoDashboard:not([hidden])', { timeout: 10000 });
  const qtdIndicadores = await p.locator('.indicador').count();
  verificar('mostra 6 cartoes (total + 5 status)', qtdIndicadores === 6, `(${qtdIndicadores})`);
  verificar('total de demandas aparece',
    /\d+/.test(await p.textContent('.indicador--total .indicador__valor')));
  verificar('barras de prioridade desenhadas',
    (await p.locator('#areaDePrioridades .barra-linha').count()) === 4);
  verificar('barras de tipo desenhadas',
    (await p.locator('#areaDeTipos .barra-linha').count()) === 4);
  verificar('lista de criticas em aberto presente',
    (await p.locator('#areaDeCriticas').textContent()).length > 10);
  verificar('cabecalho mostra o usuario logado',
    (await p.textContent('.cabecalho__usuario-nome')).includes('Eduardo'));
  verificar('cabecalho mostra o perfil',
    (await p.textContent('.cabecalho__usuario-perfil')).includes('Administrador'));
  await p.screenshot({ path: 'tela-dashboard.png', fullPage: true });

  // ---------------------------------------------------------------
  console.log('\n=== TELA 3: LISTAGEM ===');
  await p.click('.cabecalho__link:has-text("Demandas")');
  await p.waitForURL('**/demandas.html');
  await p.waitForSelector('#corpoDaTabela tr td a', { timeout: 10000 });

  const linhasIniciais = await p.locator('#corpoDaTabela tr').count();
  verificar('tabela carregou as demandas', linhasIniciais >= 14, `(${linhasIniciais})`);
  verificar('botao nova demanda visivel para administrador',
    await p.isVisible('#botaoNovaDemanda'));

  // filtro por status
  await p.selectOption('#filtroStatus', 'ABERTA');
  await p.waitForTimeout(900);
  const resumo = await p.textContent('#resumoDaListagem');
  verificar('filtro por status atualiza a lista', resumo.includes('demanda'), `(${resumo})`);
  verificar('filtro fica salvo no endereco', p.url().includes('status=ABERTA'));

  // busca textual
  //
  // A tela nao tem mais o botao "Aplicar filtros": a busca dispara sozinha
  // 400 milissegundos depois da ultima tecla digitada. Por isso o teste
  // apenas escreve no campo e espera, sem clicar em nada.
  await p.selectOption('#filtroStatus', '');
  await p.waitForTimeout(700);
  await p.fill('#busca', 'Safari');
  await p.waitForTimeout(1200);
  verificar('busca por texto filtra sozinha, sem clicar em botao',
    (await p.textContent('#resumoDaListagem')).includes('1 demanda'));

  // limpar
  await p.click('#botaoLimparFiltros');
  await p.waitForTimeout(900);
  verificar('botao limpar restaura a lista completa',
    (await p.locator('#corpoDaTabela tr').count()) >= 14);

  // a linha inteira leva aos detalhes, e nao so o texto do titulo
  await p.click('#corpoDaTabela tr[data-endereco] td[data-rotulo="Status"]');
  await p.waitForTimeout(1200);
  verificar('clique em qualquer ponto da linha abre a demanda',
    p.url().includes('demanda-detalhes'));

  // e o link de voltar devolve a listagem com os filtros de antes
  const linkDeVoltar = await p.getAttribute('.detalhes-voltar', 'href');
  verificar('link de voltar preserva os filtros da listagem',
    linkDeVoltar.includes('ordenarPor='), `(${linkDeVoltar})`);

  await p.goBack();
  await p.waitForTimeout(1200);

  await p.screenshot({ path: 'tela-listagem.png', fullPage: true });

  // ---------------------------------------------------------------
  console.log('\n=== TELA 4: CADASTRO ===');
  await p.click('#botaoNovaDemanda');
  await p.waitForURL('**/demanda-formulario.html');
  await p.waitForTimeout(1200);

  // validacao de obrigatorios
  await p.click('#botaoSalvar');
  await p.waitForTimeout(400);
  verificar('titulo obrigatorio sinalizado', await p.isVisible('#erroTitulo.campo__erro--visivel'));
  verificar('descricao obrigatoria sinalizada', await p.isVisible('#erroDescricao.campo__erro--visivel'));
  verificar('projeto obrigatorio sinalizado', await p.isVisible('#erroProjeto.campo__erro--visivel'));

  // preenche
  await p.fill('#titulo', 'Demanda criada pelo teste de navegador');
  await p.fill('#descricao', 'Cadastro feito automaticamente para validar o fluxo completo da tela.');
  await p.selectOption('#projeto', { index: 1 });
  await p.waitForTimeout(900);
  await p.selectOption('#tipo', 'DEFEITO');
  await p.selectOption('#prioridade', 'ALTA');

  const qtdResponsaveis = await p.locator('#responsavel option').count();
  verificar('responsaveis do projeto carregados', qtdResponsaveis > 1, `(${qtdResponsaveis})`);

  // prazo em feriado -> aviso da API externa
  await p.fill('#prazo', '2026-12-25');
  await p.waitForTimeout(1800);
  const avisoFeriado = await p.textContent('#avisoFeriado');
  verificar('API de feriados avisa na propria tela',
    avisoFeriado.includes('feriado nacional') && avisoFeriado.includes('Natal'), `(${avisoFeriado})`);

  // tenta salvar com feriado -> backend recusa
  await p.click('#botaoSalvar');
  await p.waitForTimeout(1500);
  verificar('backend recusa o cadastro com prazo em feriado',
    (await p.textContent('#areaDeMensagem')).includes('feriado nacional'));

  await p.screenshot({ path: 'tela-formulario.png', fullPage: true });

  // corrige a data e salva
  await p.fill('#prazo', '2026-09-16');
  await p.waitForTimeout(1500);
  verificar('data util confirmada como disponivel',
    (await p.textContent('#avisoFeriado')).includes('disponivel'));

  await p.click('#botaoSalvar');
  await p.waitForURL('**/demanda-detalhes.html*', { timeout: 10000 });
  verificar('cadastro concluido leva aos detalhes', p.url().includes('criado=1'));

  // ---------------------------------------------------------------
  console.log('\n=== TELA 5: DETALHES ===');
  await p.waitForSelector('#conteudoDaDemanda:not([hidden])', { timeout: 10000 });

  verificar('mensagem de sucesso do cadastro aparece',
    (await p.textContent('#areaDeMensagem')).includes('sucesso'));
  verificar('titulo da demanda exibido',
    (await p.textContent('#tituloDaDemanda')).includes('teste de navegador'));
  verificar('etiquetas de status, prioridade e tipo',
    (await p.locator('#etiquetasDaDemanda .etiqueta').count()) === 3);
  verificar('ficha lateral preenchida',
    (await p.locator('.detalhes-ficha__item').count()) === 7);
  verificar('historico registra a criacao',
    (await p.textContent('#listaDoHistorico')).includes('cadastrada'));
  verificar('botao editar visivel para administrador', await p.isVisible('#botaoEditar'));

  // comentario vazio
  await p.click('#botaoComentar');
  await p.waitForTimeout(300);
  verificar('comentario vazio e recusado na tela',
    await p.isVisible('#erroComentario.campo__erro--visivel'));

  // comentario valido
  await p.fill('#textoDoComentario', 'Comentario registrado pelo teste de navegador.');
  await p.click('#botaoComentar');
  await p.waitForTimeout(1800);
  verificar('comentario aparece na lista',
    (await p.textContent('#listaDeComentarios')).includes('teste de navegador'));
  verificar('contador de comentarios atualizado',
    (await p.textContent('#contadorDeComentarios')).includes('1'));

  // mudanca de status
  const botoesDeStatus = await p.locator('#botoesDeStatus button').count();
  verificar('botoes de status disponiveis', botoesDeStatus >= 2, `(${botoesDeStatus})`);

  await p.click('#botoesDeStatus button:has-text("Em andamento")');
  await p.waitForTimeout(1800);
  verificar('status alterado para Em andamento',
    (await p.textContent('#etiquetasDaDemanda')).includes('Em andamento'));
  verificar('historico registrou a mudanca de status',
    (await p.textContent('#listaDoHistorico')).includes('Status alterado'));

  // nao deve existir botao de concluir direto
  const textoDosBotoes = await p.textContent('#botoesDeStatus');
  verificar('nao ha botao de concluir antes da revisao',
    !textoDosBotoes.includes('Concluida'), `(${textoDosBotoes.trim()})`);

  await p.screenshot({ path: 'tela-detalhes.png', fullPage: true });

  // ---------------------------------------------------------------
  console.log('\n=== PERFIL MEMBRO ===');
  await p.click('#botaoSair');
  await p.waitForURL('**/index.html');
  await p.fill('#email', 'gabriel@time11.com');
  await p.fill('#senha', 'membro123');
  await p.click('#botaoEntrar');
  await p.waitForURL('**/dashboard.html', { timeout: 10000 });
  await p.waitForSelector('#conteudoDoDashboard:not([hidden])');
  verificar('membro entra normalmente',
    (await p.textContent('.cabecalho__usuario-perfil')).includes('Membro'));

  await p.goto(`${BASE}/paginas/demandas.html`);
  await p.waitForTimeout(1800);
  verificar('membro nao ve o botao de nova demanda',
    !(await p.isVisible('#botaoNovaDemanda')));

  await p.goto(`${BASE}/paginas/demanda-formulario.html`);
  await p.waitForTimeout(1200);
  verificar('membro que acessa o formulario direto recebe aviso',
    (await p.textContent('#areaDeMensagem')).includes('Membro da Equipe'));

  // ---------------------------------------------------------------
  console.log('\n=== SESSAO ===');
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.goto(`${BASE}/paginas/dashboard.html`);
  await p.waitForURL('**/index.html', { timeout: 10000 });
  verificar('tela interna sem login redireciona para o login', p.url().includes('index.html'));

  // ---------------------------------------------------------------
  console.log('\n=== RESPONSIVIDADE (celular 390x844) ===');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.fill('#email', 'eduardo@time11.com');
  await p.fill('#senha', 'admin123');
  await p.click('#botaoEntrar');
  await p.waitForURL('**/dashboard.html', { timeout: 10000 });
  await p.waitForSelector('#conteudoDoDashboard:not([hidden])');

  let temRolagemHorizontal = await p.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  verificar('dashboard sem rolagem horizontal no celular', !temRolagemHorizontal);
  await p.screenshot({ path: 'celular-dashboard.png', fullPage: true });

  await p.goto(`${BASE}/paginas/demandas.html`);
  await p.waitForTimeout(1800);
  temRolagemHorizontal = await p.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  verificar('listagem sem rolagem horizontal no celular', !temRolagemHorizontal);

  // No celular a tabela vira uma lista de cartoes. Antes so o titulo e o
  // tipo cabiam na tela e o resto ficava escondido atras de uma rolagem
  // lateral. O teste confere que as oito informacoes estao visiveis.
  const celulasVisiveis = await p.$$eval(
    '#corpoDaTabela tr[data-endereco]:first-child td',
    (celulas) => celulas.filter((celula) => celula.offsetWidth > 0).length
  );
  verificar('celular mostra as 8 informacoes da demanda em formato de cartao',
    celulasVisiveis === 8, `(${celulasVisiveis})`);

  await p.screenshot({ path: 'celular-listagem.png', fullPage: true });

  await p.goto(`${BASE}/paginas/demanda-detalhes.html?id=1`);
  await p.waitForTimeout(1800);
  temRolagemHorizontal = await p.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  verificar('detalhes sem rolagem horizontal no celular', !temRolagemHorizontal);
  await p.screenshot({ path: 'celular-detalhes.png', fullPage: true });

  // tablet
  await p.setViewportSize({ width: 820, height: 1180 });
  await p.goto(`${BASE}/paginas/dashboard.html`);
  await p.waitForTimeout(1500);
  temRolagemHorizontal = await p.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  verificar('dashboard sem rolagem horizontal no tablet', !temRolagemHorizontal);

  // ---------------------------------------------------------------
  console.log('\n=== ERROS DE JAVASCRIPT ===');
  verificar('nenhum erro de JavaScript no console',
    erroDeConsole.length === 0, `\n       ${erroDeConsole.join('\n       ')}`);

  console.log('\n===============================================');
  console.log(`  RESULTADO: ${ok} teste(s) OK, ${falhou} falha(s)`);
  console.log('===============================================');

  await navegador.close();
  process.exit(falhou === 0 ? 0 : 1);
})();
