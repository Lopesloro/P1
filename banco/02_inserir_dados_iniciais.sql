-- =============================================================================
-- Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana
-- Projeto Integrador II - PI-II-TIME-11
-- Arquivo: 02_inserir_dados_iniciais.sql
-- Finalidade: insere os usuarios, projetos e demandas usados para testar
--             o sistema. O documento de visao permite que usuarios e projetos
--             sejam cadastrados diretamente no banco.
--
-- Como executar (rodar sempre DEPOIS do 01_criar_tabelas.sql):
--   mysql -u root -p < banco/02_inserir_dados_iniciais.sql
-- =============================================================================

USE acompanhamento_demandas;

-- -----------------------------------------------------------------------------
-- USUARIOS
-- As senhas nao sao gravadas em texto puro. A coluna senha_hash guarda o
-- resultado do algoritmo bcrypt, que e o mesmo usado pelo backend na hora
-- de conferir o login.
--
-- Senhas para teste:
--   perfil ADMINISTRADOR .. admin123
--   perfil LIDER .......... lider123
--   perfil MEMBRO ......... membro123
-- -----------------------------------------------------------------------------
INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES
  ('Eduardo Martins Colmati',
   'eduardo@time11.com',
   '$2a$10$UoTKIRw0a52tFYfENxhEfeOD8wE2lD7VaPL.nzTknmRvdzDcjKqXS',
   'ADMINISTRADOR'),

  ('Jose Gabriel Bedani',
   'jose@time11.com',
   '$2a$10$ECbX2kD7lIEBPdQJDeLMwuIws0W5a9rRzvZvu5H.2DzYAdVQHAGtC',
   'LIDER'),

  ('Enzo Carleti Teixeira',
   'enzo@time11.com',
   '$2a$10$ECbX2kD7lIEBPdQJDeLMwuIws0W5a9rRzvZvu5H.2DzYAdVQHAGtC',
   'LIDER'),

  ('Gustavo de Oliveira de Santana',
   'gustavo@time11.com',
   '$2a$10$4t3fJQJcdOXfOl/hOPUviu7HhZrMJ3AXkexDeMqoJUSFmeolQgToS',
   'MEMBRO'),

  ('Gabriel Lopes Londe Rodrigues',
   'gabriel@time11.com',
   '$2a$10$4t3fJQJcdOXfOl/hOPUviu7HhZrMJ3AXkexDeMqoJUSFmeolQgToS',
   'MEMBRO');


-- -----------------------------------------------------------------------------
-- PROJETOS
-- -----------------------------------------------------------------------------
INSERT INTO projetos (nome, descricao) VALUES
  ('Portal do Aluno',
   'Sistema web de consulta de notas, faltas e historico academico.'),

  ('Aplicativo de Biblioteca',
   'Aplicativo para reserva e renovacao de emprestimo de livros.'),

  ('Site Institucional',
   'Reformulacao do site publico da instituicao.');


-- -----------------------------------------------------------------------------
-- VINCULO ENTRE PROJETOS E USUARIOS
-- Define quais projetos cada usuario enxerga.
-- O ADMINISTRADOR enxerga tudo, entao nao precisa de vinculo, mas foi
-- incluido no primeiro projeto para facilitar os testes.
-- -----------------------------------------------------------------------------
INSERT INTO projeto_usuarios (projeto_id, usuario_id) VALUES
  -- Portal do Aluno
  (1, 1),  -- Eduardo (administrador)
  (1, 2),  -- Jose (lider)
  (1, 4),  -- Gustavo (membro)
  (1, 5),  -- Gabriel (membro)

  -- Aplicativo de Biblioteca
  (2, 3),  -- Enzo (lider)
  (2, 4),  -- Gustavo (membro)

  -- Site Institucional
  (3, 2),  -- Jose (lider)
  (3, 5);  -- Gabriel (membro)


-- -----------------------------------------------------------------------------
-- DEMANDAS
-- Foram cadastradas demandas em todos os status, tipos e prioridades para
-- que o dashboard e os filtros possam ser testados com dados reais.
--
-- Observacao sobre as datas: os prazos abaixo foram escolhidos em dias uteis
-- comuns, porque o sistema recusa prazos que caiam em feriado nacional.
-- -----------------------------------------------------------------------------
INSERT INTO demandas
  (titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, criado_por_id, prazo_finalizacao)
VALUES
  ('Corrigir erro ao salvar nota do aluno',
   'Ao lancar uma nota com virgula o sistema apresenta erro e nao grava o registro.',
   'DEFEITO', 'CRITICA', 'ABERTA', 1, 4, 1, '2026-09-10'),

  ('Criar tela de consulta de faltas',
   'Desenvolver a tela que lista as faltas do aluno por disciplina e por periodo.',
   'TAREFA', 'ALTA', 'EM_ANDAMENTO', 1, 5, 2, '2026-09-18'),

  ('Melhorar desempenho da listagem de notas',
   'A listagem demora mais de cinco segundos quando o aluno tem muitas disciplinas.',
   'MELHORIA', 'MEDIA', 'EM_REVISAO', 1, 4, 2, '2026-09-25'),

  ('Documentar rotas da API do portal',
   'Escrever a documentacao de todas as rotas da API utilizada pelo portal.',
   'DOCUMENTACAO', 'BAIXA', 'CONCLUIDA', 1, 5, 1, '2026-08-20'),

  ('Validar login com e-mail invalido',
   'O sistema aceita e-mail sem arroba e permite o envio do formulario.',
   'DEFEITO', 'ALTA', 'ABERTA', 1, NULL, 2, '2026-09-05'),

  ('Ajustar layout do menu no celular',
   'O menu lateral fica sobreposto ao conteudo em telas menores que 600 pixels.',
   'DEFEITO', 'MEDIA', 'CANCELADA', 1, 5, 1, NULL),

  ('Implementar reserva de livro',
   'Permitir que o aluno reserve um livro que esteja emprestado no momento.',
   'TAREFA', 'CRITICA', 'ABERTA', 2, 4, 3, '2026-09-08'),

  ('Enviar aviso de devolucao por e-mail',
   'Enviar um aviso automatico tres dias antes da data de devolucao.',
   'MELHORIA', 'MEDIA', 'EM_ANDAMENTO', 2, 4, 3, '2026-10-02'),

  ('Corrigir contagem de exemplares disponiveis',
   'A quantidade exibida na busca nao considera os livros reservados.',
   'DEFEITO', 'ALTA', 'EM_REVISAO', 2, NULL, 3, '2026-09-15'),

  ('Escrever manual do bibliotecario',
   'Manual em PDF explicando o cadastro de exemplares e a baixa de emprestimos.',
   'DOCUMENTACAO', 'BAIXA', 'ABERTA', 2, NULL, 3, NULL),

  ('Trocar imagens da pagina inicial',
   'Substituir as fotos da pagina inicial pelas novas imagens enviadas pelo marketing.',
   'TAREFA', 'BAIXA', 'CONCLUIDA', 3, 5, 2, '2026-08-14'),

  ('Adicionar formulario de contato',
   'Criar o formulario de contato com nome, e-mail, assunto e mensagem.',
   'TAREFA', 'MEDIA', 'EM_ANDAMENTO', 3, 5, 2, '2026-09-30'),

  ('Revisar textos da pagina de cursos',
   'Corrigir erros de digitacao e padronizar os titulos da pagina de cursos.',
   'MELHORIA', 'BAIXA', 'ABERTA', 3, NULL, 2, '2026-10-15'),

  ('Falha ao abrir o site no navegador Safari',
   'A pagina inicial nao carrega as imagens quando aberta pelo Safari.',
   'DEFEITO', 'CRITICA', 'EM_ANDAMENTO', 3, 5, 2, '2026-09-03');


-- -----------------------------------------------------------------------------
-- COMENTARIOS DE EXEMPLO
-- -----------------------------------------------------------------------------
INSERT INTO comentarios (demanda_id, usuario_id, texto) VALUES
  (1, 2, 'O erro acontece porque o campo espera ponto no lugar da virgula.'),
  (1, 4, 'Consegui reproduzir aqui. Vou comecar a correcao hoje.'),
  (2, 5, 'Tela pronta na parte visual, falta ligar com a API.'),
  (3, 2, 'Depois da alteracao a consulta caiu para menos de um segundo.'),
  (7, 4, 'Precisamos definir por quantos dias a reserva fica valida.');


-- -----------------------------------------------------------------------------
-- HISTORICO DE ALTERACOES DE EXEMPLO
-- O historico real e gravado automaticamente pelo backend. As linhas abaixo
-- existem apenas para que a tela de detalhes ja tenha conteudo na primeira
-- execucao do sistema.
-- -----------------------------------------------------------------------------
INSERT INTO historico_alteracoes (demanda_id, usuario_id, campo_alterado, valor_anterior, valor_novo) VALUES
  (2, 2, 'responsavel', NULL, 'Gabriel Lopes Londe Rodrigues'),
  (2, 5, 'status', 'Aberta', 'Em andamento'),
  (3, 2, 'status', 'Aberta', 'Em andamento'),
  (3, 4, 'status', 'Em andamento', 'Em revisao'),
  (4, 1, 'status', 'Em revisao', 'Concluida'),
  (6, 1, 'status', 'Aberta', 'Cancelada');
