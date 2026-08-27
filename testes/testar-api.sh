#!/bin/bash
# =============================================================================
# Autor exclusivo deste arquivo: Gabriel Lopes Londe Rodrigues
# Projeto Integrador II - PI-II-TIME-11
#
# Teste automatizado da API.
#
# Confere as regras de negocio chamando as rotas do backend diretamente,
# sem passar pela tela. E assim que se descobre se a regra esta mesmo no
# servidor, e nao apenas escondida na interface.
#
# Como executar:
#   1. Recriar o banco com os dados de teste:
#        mysql -u root -p < banco/01_criar_tabelas.sql
#        mysql -u root -p < banco/02_inserir_dados_iniciais.sql
#   2. Deixar o servidor rodando em outro terminal (npm run dev)
#   3. Rodar:  bash testes/testar-api.sh
#
# Os numeros esperados nos testes consideram o banco recem populado.
# =============================================================================
API="http://localhost:3000/api"
C="curl -s --noproxy *"

ok=0; falhou=0
verificar() { # $1 descricao  $2 esperado  $3 obtido
  if [[ "$3" == *"$2"* ]]; then echo "  OK   | $1"; ok=$((ok+1));
  else echo "  FALHA| $1"; echo "       esperado conter: $2"; echo "       obtido: $3"; falhou=$((falhou+1)); fi
}

login() {
  $C -X POST "$API/autenticacao/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"senha\":\"$2\"}" | node -e "
      let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
        try{console.log(JSON.parse(d).token||'')}catch(e){console.log('')}})"
}

echo "=== 1. AUTENTICACAO ==="
ADMIN=$(login eduardo@time11.com admin123)
LIDER=$(login jose@time11.com lider123)
MEMBRO=$(login gabriel@time11.com membro123)
[[ -n "$ADMIN" ]] && verificar "login administrador" "" "ok" || verificar "login administrador" "token" "vazio"
[[ -n "$LIDER" ]] && verificar "login lider" "" "ok" || verificar "login lider" "token" "vazio"
[[ -n "$MEMBRO" ]] && verificar "login membro" "" "ok" || verificar "login membro" "token" "vazio"

r=$($C -X POST "$API/autenticacao/login" -H "Content-Type: application/json" -d '{"email":"eduardo@time11.com","senha":"errada"}')
verificar "senha errada e recusada" "incorretos" "$r"
r=$($C -X POST "$API/autenticacao/login" -H "Content-Type: application/json" -d '{"email":"naoexiste@x.com","senha":"x"}')
verificar "email inexistente da a mesma mensagem" "incorretos" "$r"
r=$($C -X POST "$API/autenticacao/login" -H "Content-Type: application/json" -d '{"email":"","senha":"x"}')
verificar "email vazio e recusado" "Informe o e-mail" "$r"
r=$($C "$API/demandas")
verificar "rota protegida sem token" "necessario estar logado" "$r"
r=$($C "$API/demandas" -H "Authorization: Bearer token_falso")
verificar "token adulterado e recusado" "Sessao expirada ou invalida" "$r"

echo
echo "=== 2. LISTAGEM, FILTROS E BUSCA ==="
r=$($C "$API/demandas" -H "Authorization: Bearer $ADMIN")
verificar "admin lista todas as demandas" '"total":14' "$r"
r=$($C "$API/demandas?status=ABERTA" -H "Authorization: Bearer $ADMIN")
verificar "filtro por status" '"total":5' "$r"
r=$($C "$API/demandas?prioridade=CRITICA" -H "Authorization: Bearer $ADMIN")
verificar "filtro por prioridade" '"total":3' "$r"
r=$($C "$API/demandas?tipo=DEFEITO&status=ABERTA" -H "Authorization: Bearer $ADMIN")
verificar "dois filtros combinados" '"total":2' "$r"
r=$($C "$API/demandas?responsavelId=sem" -H "Authorization: Bearer $ADMIN")
verificar "filtro sem responsavel" '"total":4' "$r"
r=$($C "$API/demandas?busca=Safari" -H "Authorization: Bearer $ADMIN")
verificar "busca textual no titulo" '"total":1' "$r"
r=$($C "$API/demandas?busca=virgula" -H "Authorization: Bearer $ADMIN")
verificar "busca textual na descricao" '"total":1' "$r"
r=$($C "$API/demandas?ordenarPor=prioridade" -H "Authorization: Bearer $ADMIN" | head -c 200)
verificar "ordenacao por prioridade traz CRITICA primeiro" 'CRITICA' "$r"
r=$($C "$API/demandas?ordenarPor=comando_invalido" -H "Authorization: Bearer $ADMIN")
verificar "ordenacao invalida nao quebra" '"total":14' "$r"
r=$($C "$API/demandas?busca=%27%20OR%201%3D1%20--" -H "Authorization: Bearer $ADMIN")
verificar "tentativa de sql injection nao retorna tudo" '"total":0' "$r"

echo
echo "=== 3. PERMISSOES POR PERFIL ==="
r=$($C "$API/demandas" -H "Authorization: Bearer $MEMBRO")
verificar "membro ve apenas projetos vinculados (projetos 1 e 3)" '"total":10' "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" \
  -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1}')
verificar "membro nao cadastra demanda" "nao permite" "$r"
r=$($C -X PUT "$API/demandas/1" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" \
  -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA"}')
verificar "membro nao edita demanda" "nao permite" "$r"
r=$($C "$API/demandas/7" -H "Authorization: Bearer $MEMBRO")
verificar "membro nao acessa demanda de outro projeto" "nao tem acesso" "$r"

echo
echo "=== 4. CICLO DE VIDA DA DEMANDA ==="
# demanda 5 esta ABERTA sem responsavel, projeto 1
r=$($C -X PATCH "$API/demandas/5/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"CONCLUIDA"}')
verificar "aberta nao vai direto para concluida" "Nao e possivel mudar" "$r"
r=$($C -X PATCH "$API/demandas/2/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"CONCLUIDA"}')
verificar "em andamento nao vai direto para concluida" "precisa passar pelo status Em revisao" "$r"
r=$($C -X PATCH "$API/demandas/2/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"ABERTA"}')
verificar "em andamento nao volta para aberta" "nao pode voltar" "$r"
r=$($C -X PATCH "$API/demandas/4/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"EM_ANDAMENTO"}')
verificar "concluida nao muda mais de status" "nao pode" "$r"
r=$($C -X PATCH "$API/demandas/6/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"EM_ANDAMENTO"}')
verificar "cancelada nao muda mais de status" "nao pode" "$r"
# membro: demanda 5 nao e dele
r=$($C -X PATCH "$API/demandas/5/status" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" -d '{"status":"EM_ANDAMENTO"}')
verificar "membro nao mexe em demanda que nao e dele" "atribuidas a ele" "$r"
# demanda 2 e do gabriel (id 5) e esta EM_ANDAMENTO -> EM_REVISAO permitido
r=$($C -X PATCH "$API/demandas/2/status" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" -d '{"status":"EM_REVISAO"}')
verificar "membro envia sua demanda para revisao" "Em revisao" "$r"
r=$($C -X PATCH "$API/demandas/2/status" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" -d '{"status":"CONCLUIDA"}')
verificar "membro nao conclui demanda" "Concluir ou cancelar" "$r"
r=$($C -X PATCH "$API/demandas/2/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"CONCLUIDA"}')
verificar "lider conclui apos revisao" "Concluida" "$r"
r=$($C -X PATCH "$API/demandas/5/status" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"status":"CANCELADA"}')
verificar "lider cancela demanda aberta" "Cancelada" "$r"
r=$($C "$API/demandas/5" -H "Authorization: Bearer $ADMIN")
verificar "demanda cancelada continua existindo no banco" '"id":5' "$r"

echo
echo "=== 5. CADASTRO E VALIDACOES ==="
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"descricao":"y","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1}')
verificar "titulo obrigatorio" "titulo e obrigatorio" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1}')
verificar "descricao obrigatoria" "descricao e obrigatorio" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","descricao":"y","tipo":"INVENTADO","prioridade":"BAIXA","projetoId":1}')
verificar "tipo invalido recusado" "deve ser um destes valores" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA"}')
verificar "projeto obrigatorio" "Escolha o projeto" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA","projetoId":2}')
verificar "lider nao cadastra em projeto que nao participa" "nao esta vinculado" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1,"prazoFinalizacao":"31/12/2026"}')
verificar "data em formato errado recusada" "formato dia/mes/ano" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1,"prazoFinalizacao":"2026-02-31"}')
verificar "data inexistente recusada" "nao e uma data valida" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" -d '{"titulo":"x","descricao":"y","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1,"responsavelId":3}')
verificar "responsavel fora do projeto recusado" "nao participa do projeto" "$r"

# cadastro valido
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" \
  -d '{"titulo":"Demanda criada no teste automatizado","descricao":"Verificacao do fluxo completo.","tipo":"MELHORIA","prioridade":"ALTA","projetoId":1,"responsavelId":5,"prazoFinalizacao":"2026-09-16"}')
verificar "cadastro valido" "cadastrada com sucesso" "$r"
NOVA=$(echo "$r" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).demandaId)}catch(e){console.log('')}})")
r=$($C "$API/demandas/$NOVA" -H "Authorization: Bearer $ADMIN")
verificar "demanda nova nasce com status ABERTA" '"status":"ABERTA"' "$r"
verificar "demanda nova registra criacao no historico" '"campoAlterado":"criacao"' "$r"

echo
echo "=== 6. EDICAO E HISTORICO ==="
r=$($C -X PUT "$API/demandas/$NOVA" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" \
  -d '{"titulo":"Demanda criada no teste automatizado","descricao":"Verificacao do fluxo completo.","tipo":"MELHORIA","prioridade":"CRITICA","projetoId":1,"responsavelId":4,"prazoFinalizacao":"2026-09-16"}')
verificar "edicao valida" "atualizada com sucesso" "$r"
r=$($C "$API/demandas/$NOVA" -H "Authorization: Bearer $ADMIN")
verificar "historico registrou mudanca de prioridade" '"campoAlterado":"prioridade"' "$r"
verificar "historico registrou mudanca de responsavel" '"campoAlterado":"responsavel"' "$r"
verificar "prioridade foi realmente alterada" '"prioridade":"CRITICA"' "$r"

echo
echo "=== 7. COMENTARIOS ==="
r=$($C -X POST "$API/demandas/$NOVA/comentarios" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" -d '{"texto":""}')
verificar "comentario vazio recusado" "Escreva o comentario" "$r"
r=$($C -X POST "$API/demandas/$NOVA/comentarios" -H "Authorization: Bearer $MEMBRO" -H "Content-Type: application/json" -d '{"texto":"Comentario do teste automatizado."}')
verificar "membro registra comentario" "registrado com sucesso" "$r"
r=$($C "$API/demandas/$NOVA" -H "Authorization: Bearer $ADMIN")
verificar "comentario aparece nos detalhes" "Comentario do teste automatizado" "$r"

echo
echo "=== 8. DASHBOARD ==="
r=$($C "$API/dashboard" -H "Authorization: Bearer $ADMIN")
verificar "dashboard traz total" '"total":15' "$r"
verificar "dashboard traz contagem por status" '"porStatus"' "$r"
verificar "dashboard traz contagem por prioridade" '"porPrioridade"' "$r"
verificar "dashboard traz contagem por tipo" '"porTipo"' "$r"
verificar "dashboard traz criticas em aberto" '"demandasCriticasEmAberto"' "$r"
verificar "dashboard traz proximas do prazo" '"demandasProximasDoPrazo"' "$r"
r=$($C "$API/dashboard" -H "Authorization: Bearer $MEMBRO")
verificar "dashboard do membro conta so os projetos dele" '"total":11' "$r"

echo
echo "=== 9. LISTAS DE APOIO ==="
r=$($C "$API/projetos" -H "Authorization: Bearer $ADMIN")
verificar "admin ve os 3 projetos" 'Site Institucional' "$r"
r=$($C "$API/projetos" -H "Authorization: Bearer $MEMBRO")
verificar "membro nao ve projeto de outro time" "$(echo -n '')" "$r"
r=$($C "$API/usuarios?projetoId=1" -H "Authorization: Bearer $ADMIN")
verificar "usuarios do projeto 1" "Gustavo" "$r"

echo
echo "=== 10. ROTA INEXISTENTE ==="
r=$($C "$API/nao_existe" -H "Authorization: Bearer $ADMIN")
verificar "rota inexistente devolve 404 explicado" "nao existe nesta API" "$r"

echo
echo "=== 11. API EXTERNA DE FERIADOS ==="
r=$($C "$API/feriados/verificar?data=2026-12-25" -H "Authorization: Bearer $ADMIN")
verificar "consulta identifica o Natal como feriado" '"ehFeriado":true' "$r"
r=$($C "$API/feriados/verificar?data=2026-09-16" -H "Authorization: Bearer $ADMIN")
verificar "dia util nao e feriado" '"ehFeriado":false' "$r"
r=$($C "$API/feriados/verificar?data=25/12/2026" -H "Authorization: Bearer $ADMIN")
verificar "formato de data invalido recusado" "formato ano-mes-dia" "$r"
r=$($C -X POST "$API/demandas" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" \
  -d '{"titulo":"Teste de feriado","descricao":"Prazo em feriado nacional.","tipo":"TAREFA","prioridade":"BAIXA","projetoId":1,"prazoFinalizacao":"2026-09-07"}')
verificar "cadastro com prazo em feriado e bloqueado" "feriado nacional (Independencia do Brasil)" "$r"
r=$($C -X PUT "$API/demandas/$NOVA" -H "Authorization: Bearer $LIDER" -H "Content-Type: application/json" \
  -d '{"titulo":"Demanda criada no teste automatizado","descricao":"Verificacao do fluxo completo.","tipo":"MELHORIA","prioridade":"CRITICA","projetoId":1,"responsavelId":4,"prazoFinalizacao":"2026-12-25"}')
verificar "edicao com prazo em feriado e bloqueada" "feriado nacional (Natal)" "$r"


echo
echo "==============================================="
echo "  RESULTADO: $ok teste(s) OK, $falhou falha(s)"
echo "==============================================="
[[ $falhou -eq 0 ]]
