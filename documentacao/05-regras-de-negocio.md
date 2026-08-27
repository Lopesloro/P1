# 05 - Regras de negocio

Autor exclusivo deste arquivo: Gustavo de Oliveira de Santana

Perfis de acesso, permissoes e ciclo de vida da demanda.

Estas sao as regras mais importantes do sistema. Todas sao aplicadas no
backend. A tela apenas esconde botoes para ficar mais clara; ela nunca e
a responsavel por impedir uma acao.

---

## 1. Por que a regra fica no backend

Qualquer pessoa consegue abrir as ferramentas do navegador e reexibir um
botao escondido, ou chamar a API diretamente sem passar pela tela.

Por isso o sistema segue esta divisao:

| Camada | Responsabilidade |
|---|---|
| Tela | Mostrar apenas o que faz sentido para o usuario |
| Backend | Decidir de verdade o que pode e o que nao pode |

Exemplo pratico: a tela de listagem esconde o botao "Nova demanda" para
o Membro da Equipe. Se o Membro digitar o endereco do formulario
diretamente, a tela avisa que ele nao tem permissao. E se ele chamar a
rota `POST /api/demandas` por fora, o backend recusa com o codigo 403.
Sao tres barreiras, e a ultima e a que realmente protege.

---

## 2. Perfis de acesso

### 2.1 Administrador

Acesso mais amplo do sistema. Enxerga todos os projetos, todos os
usuarios e todas as demandas, mesmo sem vinculo cadastrado.

Pode:

- visualizar todos os projetos, usuarios e demandas;
- cadastrar demandas em qualquer projeto;
- editar demandas;
- atribuir ou alterar responsavel;
- alterar prioridade e tipo;
- alterar status, em todas as transicoes previstas;
- cancelar demandas;
- registrar comentarios;
- visualizar o historico de alteracoes.

### 2.2 Lider de Projeto

Tem as mesmas acoes do Administrador, porem restritas aos projetos aos
quais esta vinculado na tabela `projeto_usuarios`.

Pode:

- visualizar os projetos aos quais esta vinculado;
- visualizar as demandas desses projetos;
- cadastrar demandas nesses projetos;
- editar demandas desses projetos;
- atribuir ou alterar responsavel;
- alterar prioridade e tipo;
- alterar status, em todas as transicoes previstas;
- cancelar demandas;
- registrar comentarios;
- visualizar o historico de alteracoes.

Nao pode agir em projetos aos quais nao esteja vinculado.

### 2.3 Membro da Equipe

Atua diretamente na execucao das demandas.

Pode:

- visualizar os projetos aos quais esta vinculado;
- visualizar as demandas desses projetos;
- registrar comentarios;
- visualizar o historico de alteracoes;
- alterar o status das demandas atribuidas a ele, apenas de Aberta para
  Em andamento e de Em andamento para Em revisao.

Nao pode:

- cadastrar demandas;
- editar os dados de uma demanda;
- alterar prioridade ou tipo;
- atribuir ou alterar responsavel;
- concluir ou cancelar demandas;
- alterar o status de uma demanda que nao esteja atribuida a ele.

### 2.4 Tabela resumida

| Acao | Administrador | Lider | Membro |
|---|---|---|---|
| Ver todos os projetos | Sim | So os vinculados | So os vinculados |
| Ver demandas | Todas | Dos projetos vinculados | Dos projetos vinculados |
| Cadastrar demanda | Sim | Nos projetos vinculados | Nao |
| Editar demanda | Sim | Nos projetos vinculados | Nao |
| Alterar responsavel | Sim | Sim | Nao |
| Alterar prioridade | Sim | Sim | Nao |
| Iniciar demanda (Aberta para Em andamento) | Sim | Sim | So as dele |
| Enviar para revisao (Em andamento para Em revisao) | Sim | Sim | So as dele |
| Concluir demanda | Sim | Sim | Nao |
| Cancelar demanda | Sim | Sim | Nao |
| Comentar | Sim | Sim | Sim |
| Ver historico | Sim | Sim | Sim |

---

## 3. Como o vinculo com o projeto funciona

A tabela `projeto_usuarios` define quais projetos cada usuario enxerga.

O Administrador nao precisa de vinculo: o sistema o trata como tendo
acesso a tudo.

Para os demais perfis, todas as consultas recebem uma condicao que
limita o resultado. Essa condicao e montada em um unico lugar, na funcao
`condicaoDeProjetosVisiveis`, dentro de
`backend/src/servicos/permissoes.ts`, e reaproveitada pela listagem e
pelo dashboard.

```sql
demandas.projeto_id IN (
  SELECT projeto_id FROM projeto_usuarios WHERE usuario_id = ?
)
```

Para o Administrador, essa condicao vira `1 = 1`, que nao restringe nada.

Escrever essa regra em um lugar so evita o risco de esquece-la em uma
consulta e deixar vazar dados de outro projeto.

---

## 4. Ciclo de vida da demanda

### 4.1 O fluxo

```
                    +-------------+
                    |   ABERTA    |   (toda demanda nasce aqui)
                    +-------------+
                           |
                           v
                    +---------------+
                    | EM ANDAMENTO  |
                    +---------------+
                           |
                           v
                    +---------------+
                    |  EM REVISAO   |
                    +---------------+
                           |
                           v
                    +---------------+
                    |  CONCLUIDA    |   (status final)
                    +---------------+

  Qualquer status ainda nao concluido pode ir para:

                    +---------------+
                    |  CANCELADA    |   (status final)
                    +---------------+
```

### 4.2 Tabela de transicoes

| Status atual | Pode ir para | Nao pode ir para |
|---|---|---|
| ABERTA | EM_ANDAMENTO, CANCELADA | EM_REVISAO, CONCLUIDA |
| EM_ANDAMENTO | EM_REVISAO, CANCELADA | ABERTA, CONCLUIDA |
| EM_REVISAO | CONCLUIDA, EM_ANDAMENTO, CANCELADA | ABERTA |
| CONCLUIDA | nenhum | todos |
| CANCELADA | nenhum | todos |

### 4.3 Regras exigidas pelo Documento de Visao

1. Toda demanda nasce com o status Aberta. O valor padrao esta na
   propria coluna do banco.
2. Uma demanda nao vai de Em andamento direto para Concluida. Ela
   precisa passar por Em revisao, simulando a etapa de conferencia,
   validacao ou teste.
3. Uma demanda nao volta de Em andamento para Aberta.
4. O cancelamento pode acontecer a qualquer momento, desde que a demanda
   ainda nao esteja concluida.
5. O Membro da Equipe realiza apenas duas transicoes: Aberta para Em
   andamento e Em andamento para Em revisao.

### 4.4 Decisao tomada pela equipe: volta de Em revisao para Em andamento

O Documento de Visao nao trata do caso em que a revisao reprova a
demanda. Ele proibe expressamente apenas duas transicoes: de Em
andamento para Concluida e de Em andamento para Aberta.

A equipe decidiu permitir a volta de Em revisao para Em andamento,
apenas para Lider de Projeto e Administrador.

Motivo: se a revisao existe para conferir, validar ou testar, ela precisa
poder reprovar. Sem essa transicao, uma demanda reprovada na revisao so
teria dois caminhos: ser concluida mesmo com problema, ou ser cancelada.
Os dois seriam errados.

Essa transicao nao contraria nenhuma regra do documento e nao esta
disponivel para o Membro da Equipe.

### 4.5 Onde essas regras estao no codigo

Todas as regras de transicao estao em um unico arquivo:

```
backend/src/servicos/regrasDeStatus.ts
```

Ele tem duas funcoes principais:

`verificarTransicaoDeStatus` responde se uma mudanca pode acontecer, e,
quando nao pode, devolve o motivo em linguagem simples.

`listarProximosStatusPossiveis` devolve a lista de status para os quais a
demanda pode ir. E ela que a tela de detalhes usa para desenhar os
botoes, mostrando apenas as opcoes que realmente vao funcionar.

Concentrar tudo em um arquivo tem duas vantagens: a regra e escrita uma
unica vez, e a tela nunca discorda do servidor sobre o que e permitido.

---

## 5. Campos da demanda

Campos obrigatorios no cadastro:

| Campo | Regra |
|---|---|
| titulo | Preenchido, no maximo 150 caracteres |
| descricao | Preenchida, no maximo 5000 caracteres |
| tipo | Um dos quatro tipos previstos |
| prioridade | Uma das quatro prioridades previstas |
| projeto | Um projeto ao qual o usuario esteja vinculado |

Campos opcionais:

| Campo | Regra |
|---|---|
| responsavel | Pode ficar vazio. Quando preenchido, precisa ser um usuario ativo que participe do projeto da demanda |
| prazo de finalizacao | Pode ficar vazio. Quando preenchido, precisa ser uma data valida e nao pode cair em feriado nacional |

Campos preenchidos automaticamente:

| Campo | Como e preenchido |
|---|---|
| status | Sempre ABERTA no cadastro |
| criado_por_id | Usuario logado que cadastrou |
| criado_em | Data e hora do cadastro, definidas pelo banco |
| atualizado_em | Atualizada pelo banco a cada alteracao da linha |

---

## 6. Regras da edicao

- Somente Administrador e Lider de Projeto editam demandas.
- Demandas com status Concluida ou Cancelada nao podem mais ser editadas.
- O projeto da demanda nao pode ser trocado. Mudar a demanda de projeto
  quebraria o vinculo com o responsavel e tornaria o historico confuso.
  Na tela, o campo aparece desabilitado.
- O status nao muda pela edicao. Existe uma rota propria para isso, que
  aplica as regras do ciclo de vida.
- A API de feriados so e consultada quando o prazo realmente mudou.

---

## 7. Regras do historico

O historico e gravado automaticamente pelo backend. O usuario nao
escreve nada nele.

Campos acompanhados:

| Campo | Quando gera registro |
|---|---|
| criacao | No cadastro da demanda |
| status | A cada mudanca de status, inclusive o cancelamento |
| responsavel | Ao atribuir, trocar ou remover o responsavel |
| prioridade | Ao mudar a prioridade |
| tipo | Ao mudar o tipo |
| prazo | Ao definir, alterar ou remover o prazo |

Regras:

- Registros de historico nunca sao apagados, mesmo quando a demanda e
  cancelada.
- Um campo que nao mudou nao gera registro. Salvar a demanda sem alterar
  nada nao suja o historico.
- A gravacao acontece dentro da mesma transacao da alteracao. Ou as duas
  coisas acontecem, ou nenhuma acontece. Nunca fica uma alteracao sem
  registro.

Sobre a transacao, em termos simples: uma transacao e um pacote de
operacoes que o banco trata como se fosse uma so. O programa avisa que
vai comecar (`beginTransaction`), faz as gravacoes e, no final, confirma
tudo (`commit`) ou desfaz tudo (`rollback`). Se o servidor cair no meio,
o banco desfaz sozinho.

---

## 8. Regras dos comentarios

- Todos os perfis podem comentar, inclusive o Membro da Equipe.
- O usuario precisa ter acesso ao projeto da demanda.
- O comentario precisa ter texto e no maximo 2000 caracteres.
- Cada comentario guarda quem escreveu e a data e hora.
- Comentarios nunca sao apagados nem editados.

---

## 9. Regras da exclusao

O Documento de Visao proibe a exclusao fisica de registros. O sistema
aplica isso em tres niveis:

1. Nao existe rota DELETE na API.
2. Cancelar uma demanda e mudar o status para CANCELADA.
3. O usuario de banco criado por `banco/03_criar_usuario_do_sistema.sql`
   recebe apenas SELECT, INSERT e UPDATE. A permissao DELETE nao e
   concedida, entao o proprio banco recusaria um comando de exclusao.

---

## 10. Regras da autenticacao

- A senha nunca e guardada em texto puro, apenas o hash gerado pelo
  bcrypt.
- E-mail inexistente e senha errada devolvem a mesma mensagem, para nao
  revelar quais e-mails estao cadastrados.
- Usuario inativo nao consegue entrar.
- O token vale por 8 horas. Depois disso, o sistema leva o usuario de
  volta ao login e avisa que a sessao expirou.
- A opcao "Lembrar-me" decide onde o token e guardado: marcada, ele fica
  no `localStorage` e sobrevive ao fechamento do navegador; desmarcada,
  fica no `sessionStorage` e e apagado ao fechar a aba.
