-- =============================================================================
-- Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
-- Projeto Integrador II - PI-II-TIME-11
-- Arquivo: 01_criar_tabelas.sql
-- Finalidade: cria o banco de dados e todas as tabelas do sistema.
--
-- Como executar:
--   mysql -u root -p < banco/01_criar_tabelas.sql
-- =============================================================================

-- Cria o banco somente se ele ainda nao existir.
-- utf8mb4 permite acentos e caracteres especiais do portugues.
CREATE DATABASE IF NOT EXISTS acompanhamento_demandas
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE acompanhamento_demandas;

-- Remove as tabelas na ordem inversa das dependencias.
-- Isso permite rodar o script novamente durante o desenvolvimento.
DROP TABLE IF EXISTS historico_alteracoes;
DROP TABLE IF EXISTS comentarios;
DROP TABLE IF EXISTS demandas;
DROP TABLE IF EXISTS projeto_usuarios;
DROP TABLE IF EXISTS projetos;
DROP TABLE IF EXISTS usuarios;


-- -----------------------------------------------------------------------------
-- TABELA: usuarios
-- Guarda quem pode entrar no sistema e qual o nivel de permissao de cada um.
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL,
  senha_hash    VARCHAR(255)  NOT NULL,
  perfil        ENUM('ADMINISTRADOR', 'LIDER', 'MEMBRO') NOT NULL,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- O e-mail e usado para fazer login, entao nao pode se repetir.
  CONSTRAINT uk_usuarios_email UNIQUE (email)
) ENGINE = InnoDB;


-- -----------------------------------------------------------------------------
-- TABELA: projetos
-- Cada projeto agrupa varias demandas.
-- -----------------------------------------------------------------------------
CREATE TABLE projetos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(120)  NOT NULL,
  descricao     TEXT          NULL,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uk_projetos_nome UNIQUE (nome)
) ENGINE = InnoDB;


-- -----------------------------------------------------------------------------
-- TABELA: projeto_usuarios
-- Tabela de ligacao (muitos para muitos) entre projetos e usuarios.
-- Um usuario pode participar de varios projetos e um projeto tem varios usuarios.
-- E ela que define quais projetos o LIDER e o MEMBRO conseguem enxergar.
-- -----------------------------------------------------------------------------
CREATE TABLE projeto_usuarios (
  projeto_id    INT NOT NULL,
  usuario_id    INT NOT NULL,
  vinculado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- A chave primaria composta impede que o mesmo usuario seja
  -- vinculado duas vezes ao mesmo projeto.
  PRIMARY KEY (projeto_id, usuario_id),

  CONSTRAINT fk_projeto_usuarios_projeto
    FOREIGN KEY (projeto_id) REFERENCES projetos (id),
  CONSTRAINT fk_projeto_usuarios_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE = InnoDB;


-- -----------------------------------------------------------------------------
-- TABELA: demandas
-- Entidade principal do sistema. Cada linha e uma tarefa, defeito,
-- melhoria ou documentacao dentro de um projeto.
-- -----------------------------------------------------------------------------
CREATE TABLE demandas (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  titulo              VARCHAR(150) NOT NULL,
  descricao           TEXT         NOT NULL,
  tipo                ENUM('TAREFA', 'DEFEITO', 'MELHORIA', 'DOCUMENTACAO') NOT NULL,
  prioridade          ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL,

  -- Toda demanda nasce com status ABERTA (exigencia do documento de visao).
  status              ENUM('ABERTA', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDA', 'CANCELADA')
                      NOT NULL DEFAULT 'ABERTA',

  projeto_id          INT      NOT NULL,

  -- Pode ficar em branco na criacao e ser preenchido depois.
  responsavel_id      INT      NULL,

  -- Quem cadastrou a demanda. Usado no historico e para auditoria.
  criado_por_id       INT      NOT NULL,

  -- Data prevista para conclusao. Validada contra feriados nacionais
  -- por uma API externa antes de ser gravada.
  prazo_finalizacao   DATE     NULL,

  criado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- O proprio MySQL atualiza esta coluna sempre que a linha muda.
  atualizado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_demandas_projeto
    FOREIGN KEY (projeto_id) REFERENCES projetos (id),
  CONSTRAINT fk_demandas_responsavel
    FOREIGN KEY (responsavel_id) REFERENCES usuarios (id),
  CONSTRAINT fk_demandas_criado_por
    FOREIGN KEY (criado_por_id) REFERENCES usuarios (id)
) ENGINE = InnoDB;

-- Indices para acelerar os filtros e a ordenacao da tela de listagem.
CREATE INDEX ix_demandas_status      ON demandas (status);
CREATE INDEX ix_demandas_prioridade  ON demandas (prioridade);
CREATE INDEX ix_demandas_tipo        ON demandas (tipo);
CREATE INDEX ix_demandas_projeto     ON demandas (projeto_id);
CREATE INDEX ix_demandas_responsavel ON demandas (responsavel_id);
CREATE INDEX ix_demandas_prazo       ON demandas (prazo_finalizacao);


-- -----------------------------------------------------------------------------
-- TABELA: comentarios
-- Observacoes escritas pelos usuarios dentro de uma demanda.
-- -----------------------------------------------------------------------------
CREATE TABLE comentarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id    INT      NOT NULL,
  usuario_id    INT      NOT NULL,
  texto         TEXT     NOT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_comentarios_demanda
    FOREIGN KEY (demanda_id) REFERENCES demandas (id),
  CONSTRAINT fk_comentarios_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE = InnoDB;

CREATE INDEX ix_comentarios_demanda ON comentarios (demanda_id);


-- -----------------------------------------------------------------------------
-- TABELA: historico_alteracoes
-- Registro automatico das mudancas importantes de cada demanda.
-- Estas linhas nunca sao apagadas, nem quando a demanda e cancelada.
-- -----------------------------------------------------------------------------
CREATE TABLE historico_alteracoes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  demanda_id      INT          NOT NULL,

  -- Quem fez a alteracao.
  usuario_id      INT          NOT NULL,

  -- Nome do campo alterado, por exemplo: status, responsavel, prioridade.
  campo_alterado  VARCHAR(60)  NOT NULL,

  -- Guardamos o texto ja pronto para exibicao na tela de detalhes.
  -- NULL no valor_anterior significa que o campo estava vazio antes.
  valor_anterior  VARCHAR(255) NULL,
  valor_novo      VARCHAR(255) NULL,

  criado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_historico_demanda
    FOREIGN KEY (demanda_id) REFERENCES demandas (id),
  CONSTRAINT fk_historico_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE = InnoDB;

CREATE INDEX ix_historico_demanda ON historico_alteracoes (demanda_id);
