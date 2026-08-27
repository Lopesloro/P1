/**
 * Autor exclusivo deste arquivo: Eduardo Martins Colmati
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Sobe o sistema no MODO DE DEMONSTRACAO, sem MySQL.
 *
 * Como usar, a partir da pasta backend:
 *
 *   npm install
 *   npm run demo
 *
 * E so. Nao precisa instalar o MySQL, nem criar o banco, nem preencher o
 * arquivo .env. O sistema sobe com os mesmos usuarios, projetos e demandas
 * dos scripts da pasta banco/, guardados na memoria do programa.
 *
 * O que muda em relacao ao `npm run dev`:
 * apenas onde os dados ficam guardados. As telas, as rotas, as regras de
 * status e as permissoes por perfil sao exatamente as mesmas. Como o banco
 * fica na memoria, tudo o que for cadastrado se perde ao desligar o
 * servidor, e a cada `npm run demo` os dados voltam ao estado inicial.
 *
 * Este modo serve para ver e avaliar o sistema. A entrega e a avaliacao
 * final continuam sendo feitas com o MySQL, pelo `npm run dev`.
 *
 * Por que este arquivo existe em vez de uma variavel no comando:
 * escrever a variavel direto no package.json daria certo no Linux e no
 * macOS, mas nao no Windows, onde a sintaxe e outra. Ligando a chave aqui
 * dentro, em JavaScript, o mesmo comando funciona nos tres sistemas.
 */

// Precisa ser ligada ANTES de qualquer import do sistema, porque o arquivo
// configuracao/ambiente.ts le as variaveis de ambiente assim que e
// carregado. Por isso o servidor e carregado com import() la embaixo, e
// nao com um import comum no topo do arquivo.
process.env.MODO_DEMONSTRACAO = '1';

/** Confere se esta versao do Node.js tem o SQLite embutido. */
function conferirVersaoDoNode(): void {
  const [maior, menor] = process.versions.node.split('.').map(Number);
  const temSqliteEmbutido = maior > 22 || (maior === 22 && menor >= 5);

  if (temSqliteEmbutido) {
    return;
  }

  console.error(
    '\n[demonstracao] Esta versao do Node.js nao tem o SQLite embutido.\n' +
      `Versao encontrada: ${process.versions.node}. Necessaria: 22.5 ou superior.\n\n` +
      'Duas saidas:\n' +
      '  1. atualizar o Node.js para a versao LTS mais recente, em nodejs.org;\n' +
      '  2. usar o modo normal, com MySQL: npm run dev\n'
  );

  process.exit(1);
}

conferirVersaoDoNode();

console.log('');
console.log('  MODO DE DEMONSTRACAO');
console.log('  O sistema esta rodando sem MySQL, com os dados na memoria.');
console.log('  Tudo o que for cadastrado se perde ao desligar o servidor.');
console.log('');
console.log('  Usuarios para entrar:');
console.log('    eduardo@time11.com  / admin123    (Administrador)');
console.log('    jose@time11.com     / lider123    (Lider de Projeto)');
console.log('    gabriel@time11.com  / membro123   (Membro da Equipe)');
console.log('');

// Carrega o servidor so agora, com a chave do modo de demonstracao ja ligada.
import('./servidor');
