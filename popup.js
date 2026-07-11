const btn = document.getElementById('btnExportar');
const statusDiv = document.getElementById('status');

function setLoading(loading) {
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function setStatus(text, type = '') {
  statusDiv.textContent = text;
  statusDiv.className = type; // '', 'loading', 'success', 'error'
}

// Ativa a função de exportação quando o botão é clicado
document.getElementById('btnExportar').addEventListener('click', async () => {
  setLoading(true);
  setStatus('Lendo página...', 'loading');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: rasparDadosSefaz
  }, (resultados) => {
    setLoading(false);
    if (!resultados || resultados.length === 0) {
      setStatus('Erro ao ler a página.', 'error');
      return;
    }
      
      let dadosExtraidos = null;
      
      // Procura o resultado válido em todos os frames
      for (const res of resultados) {
        // Agora verificamos se retornou a nossa lista de "itens" e se ela tem algo dentro
        if (res.result && res.result.itens && res.result.itens.length > 0) {
            dadosExtraidos = res.result;
          break;
        }
      }
  
      if (!dadosExtraidos) {
      setStatus('Nenhum produto encontrado. Tem certeza que é uma NF da SEFAZ?', 'error');
      return;
    }
    setStatus('Gerando planilha Excel...', 'loading');
    gerarPlanilhaExcel(dadosExtraidos);
    setStatus('Planilha baixada com sucesso!', 'success');
  });
});
  
  // =========================================================================
  // Função que roda DENTRO da página da Sefaz
  // =========================================================================
  function rasparDadosSefaz() {
    const linhasProdutos = document.querySelectorAll('#tabResult tr');
    
    // Agora criamos duas variáveis: uma lista para os itens e um objeto para os totais
    const listaItens = []; 
    const resumo = {};
  
    linhasProdutos.forEach((linha) => {
      // 1. Extrai o nome do produto
      const elNome = linha.querySelector('.txtTit');
      if (!elNome) return; // Pula se não for linha de produto
      
      const nomeProduto = elNome.textContent.trim();
  
      // 2. Extrai a Quantidade
      const elQtd = linha.querySelector('.Rqtd');
      let qtd = 0;
      if (elQtd) {
          let textoQtd = elQtd.textContent.replace(/[^\d,.]/g, '');
          let textoLimpo = textoQtd.replace(/\./g, '').replace(',', '.');
          qtd = parseFloat(textoLimpo) || 0;
      }
  
      // 3. Extrai o Valor
      const elValor = linha.querySelector('.valor');
      let valorTotal = 0;
      if (elValor) {
          let textoValor = elValor.textContent.replace(/[^\d,.]/g, '');
          let textoLimpo = textoValor.replace(/\./g, '').replace(',', '.');
          valorTotal = parseFloat(textoLimpo) || 0;
      }
  
      // Se tiver quantidade ou valor, salvamos a linha
      if (qtd > 0 || valorTotal > 0) {
        
        // A) Adiciona na lista detalhada item por item
        listaItens.push({
            nome: nomeProduto,
            qtd: qtd,
            valor: valorTotal
        });
  
        // B) Faz a soma no resumo consolidado
        if (!resumo[nomeProduto]) {
          resumo[nomeProduto] = { litros: 0, financeiro: 0 };
        }
        resumo[nomeProduto].litros += qtd;
        resumo[nomeProduto].financeiro += valorTotal;
      }
    });
  
    // Retorna as duas informações para o popup
    return { 
        itens: listaItens, 
        resumo: resumo 
    };
  }
  
  // =========================================================================
  // Função que monta o arquivo Excel
  // =========================================================================
  function gerarPlanilhaExcel(dados) {
    let conteudoCSV = "\uFEFF"; // Garante que os acentos fiquem corretos no Excel
    
    // --- PARTE 1: LISTA DETALHADA DE ITENS ---
    conteudoCSV += "LISTA DE ITENS DA NOTA\n";
    conteudoCSV += "Produto;Quantidade;Valor (R$)\n";
  
    let somaTotalQtd = 0;
    let somaTotalValor = 0;
  
    // Loop pela lista de itens individuais
    dados.itens.forEach(item => {
      // Combustível costuma ter 3 casas decimais na quantidade
      const qtdFormatada = item.qtd.toFixed(3).replace('.', ',');
      const valorFormatado = item.valor.toFixed(2).replace('.', ',');
      
      conteudoCSV += `${item.nome};${qtdFormatada};${valorFormatado}\n`;
  
      // Vai somando pro total geral
      somaTotalQtd += item.qtd;
      somaTotalValor += item.valor;
    });
  
    conteudoCSV += "\n\n"; // Dá uns "Enters" (linhas em branco) para separar as tabelas
  
    // --- PARTE 2: RESUMO E TOTAIS ---
    conteudoCSV += "RESUMO CONSOLIDADO POR PRODUTO\n";
    conteudoCSV += "Produto;Qtd Acumulada;Valor Acumulado (R$)\n";
  
    for (const produto in dados.resumo) {
      const litrosFormat = dados.resumo[produto].litros.toFixed(3).replace('.', ',');
      const valorFormat = dados.resumo[produto].financeiro.toFixed(2).replace('.', ',');
      conteudoCSV += `${produto};${litrosFormat};${valorFormat}\n`;
    }
  
    conteudoCSV += "\n";
    
    // --- PARTE 3: TOTALZÃO DA NOTA ---
    const totalQtdFormat = somaTotalQtd.toFixed(3).replace('.', ',');
    const totalValorFormat = somaTotalValor.toFixed(2).replace('.', ',');
    conteudoCSV += `TOTAL GERAL DA NOTA;${totalQtdFormat};${totalValorFormat}\n`;
  
    // Baixa o arquivo
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Nota_Combustivel_Sefaz.csv';
    link.click();
  }