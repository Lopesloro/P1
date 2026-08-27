/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 *
 * Ponto de partida do backend.
 *
 * Este arquivo:
 * 1. cria o servidor Express;
 * 2. liga os middlewares que valem para todas as rotas;
 * 3. entrega os arquivos do frontend (HTML, CSS e JavaScript);
 * 4. registra as rotas da API;
 * 5. testa a conexao com o banco e sobe o servidor.
 *
 * Servir o frontend pelo mesmo servidor da API deixa o projeto mais simples
 * de rodar: um unico comando (npm run dev) coloca o sistema inteiro no ar.
 */

import path from 'node:path';
import cors from 'cors';
import express from 'express';

import { ambiente } from './configuracao/ambiente';
import { testarConexaoBanco } from './configuracao/banco';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros';
import { rotas } from './rotas';

const aplicacao = express();

// Permite que o navegador chame a API. Como o frontend e servido pelo mesmo
// endereco, o CORS so e necessario se alguem abrir o HTML direto do disco
// ou usar outra porta durante os testes.
aplicacao.use(cors());

// Ensina o Express a ler o corpo das requisicoes no formato JSON.
// O limite evita que alguem envie um texto gigante para derrubar o servidor.
aplicacao.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Arquivos do frontend
// ---------------------------------------------------------------------------
// __dirname aponta para a pasta deste arquivo. Subimos dois niveis para
// chegar na raiz do projeto e entrar na pasta frontend.
const pastaDoFrontend = path.join(__dirname, '..', '..', 'frontend');
aplicacao.use(express.static(pastaDoFrontend));

// ---------------------------------------------------------------------------
// Rotas da API
// ---------------------------------------------------------------------------
aplicacao.use('/api', rotas);

// Rota simples para conferir rapidamente se o servidor esta no ar.
aplicacao.get('/api/saude', (_req, res) => {
  res.json({ situacao: 'ok', mensagem: 'API do PI-II-TIME-11 esta funcionando.' });
});

// ---------------------------------------------------------------------------
// Tratamento de erros
// ---------------------------------------------------------------------------
// Precisam ser os ultimos da lista: o Express percorre os middlewares na
// ordem em que foram registrados.
aplicacao.use('/api', rotaNaoEncontrada);
aplicacao.use(tratarErros);

/** Sobe o servidor depois de conferir que o banco esta acessivel. */
async function iniciarServidor(): Promise<void> {
  try {
    await testarConexaoBanco();

    console.log(
      ambiente.modoDemonstracao
        ? '[banco] Banco de demonstracao criado na memoria, sem MySQL.'
        : '[banco] Conexao com o MySQL estabelecida.'
    );
  } catch (erro) {
    console.error('[banco] Nao foi possivel conectar ao MySQL.');
    console.error('Confira os dados do arquivo .env e se o servico do MySQL esta ligado.');
    console.error(erro);

    // Encerra o programa: sem banco o sistema nao funciona.
    process.exit(1);
  }

  aplicacao.listen(ambiente.porta, () => {
    console.log(`[servidor] Sistema disponivel em http://localhost:${ambiente.porta}`);
  });
}

iniciarServidor();
