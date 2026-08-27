/**
 * Autor exclusivo deste arquivo: Enzo Carleti Teixeira
 * Projeto Integrador II - PI-II-TIME-11
 *
 * Funcoes de formatacao usadas pelas telas: datas, etiquetas coloridas e
 * protecao de texto.
 */

const Formatacao = {
  /**
   * Protege um texto antes de coloca-lo dentro do HTML da pagina.
   *
   * Qual problema isso resolve:
   * o titulo de uma demanda ou o texto de um comentario sao escritos pelo
   * usuario. Se alguem digitasse <script>algo</script> em um comentario e
   * o texto fosse colocado direto na pagina, o navegador executaria esse
   * codigo. Esse ataque se chama XSS (Cross-Site Scripting).
   *
   * Como funciona:
   * trocamos os caracteres especiais do HTML pelo codigo equivalente.
   * O sinal < vira &lt;, por exemplo. O navegador entao mostra o texto
   * como texto, em vez de interpreta-lo como codigo.
   *
   * Exemplo:
   *   textoSeguro('<b>oi</b>')  ->  '&lt;b&gt;oi&lt;/b&gt;'
   *   e a tela mostra literalmente: <b>oi</b>
   */
  textoSeguro(valor) {
    if (valor === null || valor === undefined) {
      return '';
    }

    return String(valor)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  },

  /**
   * Converte a data do banco (2026-09-16) para o formato brasileiro
   * (16/09/2026).
   *
   * A conversao e feita separando o texto, e nao com o objeto Date,
   * de proposito: o Date ajustaria a data para o fuso horario da maquina
   * e o dia poderia aparecer com 24 horas de diferenca.
   */
  formatarData(dataDoBanco) {
    if (!dataDoBanco) {
      return '-';
    }

    const [ano, mes, dia] = dataDoBanco.substring(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  },

  /**
   * Converte data e hora do banco (2026-09-16 14:32:05) para o formato
   * brasileiro com hora (16/09/2026 as 14:32).
   */
  formatarDataHora(dataHoraDoBanco) {
    if (!dataHoraDoBanco) {
      return '-';
    }

    const texto = String(dataHoraDoBanco);
    const data = this.formatarData(texto);
    const hora = texto.substring(11, 16);

    return hora ? `${data} as ${hora}` : data;
  },

  /**
   * Monta a etiqueta colorida de status.
   * A classe CSS e formada a partir do proprio valor, em letras minusculas:
   * EM_ANDAMENTO vira a classe etiqueta--em_andamento.
   */
  etiquetaStatus(status, descricao) {
    const classe = `etiqueta--${String(status).toLowerCase()}`;
    return `<span class="etiqueta ${classe}">${this.textoSeguro(descricao)}</span>`;
  },

  /** Monta a etiqueta colorida de prioridade. */
  etiquetaPrioridade(prioridade, descricao) {
    const classe = `etiqueta--${String(prioridade).toLowerCase()}`;
    return `<span class="etiqueta ${classe}">${this.textoSeguro(descricao)}</span>`;
  },

  /** Monta a etiqueta neutra do tipo da demanda. */
  etiquetaTipo(descricao) {
    return `<span class="etiqueta etiqueta--tipo">${this.textoSeguro(descricao)}</span>`;
  },

  /**
   * Devolve um aviso sobre o prazo da demanda.
   *
   * O que entra: o prazo no formato do banco.
   * O que sai:   um texto curto que a tela mostra ao lado da data,
   *              ou string vazia quando nao ha nada a avisar.
   *
   * Regras:
   *   prazo ja passou   -> "atrasada"
   *   vence hoje        -> "vence hoje"
   *   ate 7 dias        -> "faltam N dias"
   */
  avisoDePrazo(prazo) {
    if (!prazo) {
      return '';
    }

    // Monta as duas datas a meia-noite para comparar apenas os dias.
    const [ano, mes, dia] = prazo.substring(0, 10).split('-').map(Number);
    const dataDoPrazo = new Date(ano, mes - 1, dia);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // 86400000 e a quantidade de milissegundos em um dia.
    const diasRestantes = Math.round((dataDoPrazo - hoje) / 86400000);

    if (diasRestantes < 0) {
      return 'atrasada';
    }

    if (diasRestantes === 0) {
      return 'vence hoje';
    }

    if (diasRestantes <= 7) {
      return `faltam ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;
    }

    return '';
  },
};
