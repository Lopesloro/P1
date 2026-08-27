-- =============================================================================
-- Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
-- Projeto Integrador II - PI-II-TIME-11
-- Arquivo: 03_criar_usuario_do_sistema.sql
--
-- Finalidade: criar um usuario de banco proprio para a aplicacao.
--
-- Por que fazer isso:
-- o usuario root do MySQL pode fazer qualquer coisa em qualquer banco,
-- inclusive apagar tudo. Se a senha do root vazar junto com o arquivo .env,
-- o estrago e grande. O usuario abaixo so enxerga o banco deste projeto e
-- so pode ler e gravar dados, nao pode apagar tabelas.
--
-- Este script e OPCIONAL. Em muitas instalacoes locais o MySQL ja vem
-- configurado com o root acessivel por senha, e o projeto funciona assim.
-- Em algumas instalacoes do Linux, porem, o root do MySQL so aceita conexao
-- pelo terminal, e nesse caso este script passa a ser necessario.
--
-- Como executar:
--   mysql -u root -p < banco/03_criar_usuario_do_sistema.sql
--
-- Depois de executar, ajuste o arquivo backend/.env:
--   BANCO_USUARIO=demandas_app
--   BANCO_SENHA=troque_esta_senha
-- =============================================================================

-- IMPORTANTE: troque a senha abaixo antes de executar.
CREATE USER IF NOT EXISTS 'demandas_app'@'localhost'
  IDENTIFIED BY 'troque_esta_senha';

CREATE USER IF NOT EXISTS 'demandas_app'@'127.0.0.1'
  IDENTIFIED BY 'troque_esta_senha';

-- Permissoes limitadas ao banco do projeto.
-- SELECT le, INSERT grava, UPDATE altera. A permissao DELETE nao foi
-- concedida de proposito: o documento de visao proibe a exclusao fisica
-- de registros, entao a propria configuracao do banco reforca essa regra.
GRANT SELECT, INSERT, UPDATE ON acompanhamento_demandas.*
  TO 'demandas_app'@'localhost';

GRANT SELECT, INSERT, UPDATE ON acompanhamento_demandas.*
  TO 'demandas_app'@'127.0.0.1';

FLUSH PRIVILEGES;
