/**
 * @swagger
 * ProcessadorLDs - Módulo de Exportação
 * 
 * Este módulo contém funções para exportar dados em diferentes formatos
 */

/**
 * @swagger
 * Exporta dados para CSV
 * @param {Array} dados - Array de objetos com dados a exportar
 * @param {string} nomeArquivo - Nome do arquivo de saída (sem extensão)
 */
function exportarCSV(dados, nomeArquivo = 'dados_processados') {
  if (!dados || dados.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }
  
  // Obter todas as chaves únicas de todos os objetos
  const chaves = new Set();
  dados.forEach(item => {
    Object.keys(item).forEach(chave => chaves.add(chave));
  });
  
  const colunas = Array.from(chaves);
  
  // Criar CSV
  const linhas = [];
  
  // Cabeçalho
  linhas.push(colunas.map(col => `"${col}"`).join(','));
  
  // Dados
  dados.forEach(item => {
    const valores = colunas.map(col => {
      const valor = item[col];
      if (valor === null || valor === undefined) {
        return '""';
      }
      if (valor instanceof Date) {
        return `"${formatarData(valor)}"`;
      }
      // Escapar aspas e quebras de linha
      const valorStr = String(valor).replace(/"/g, '""');
      return `"${valorStr}"`;
    });
    linhas.push(valores.join(','));
  });
  
  const csv = linhas.join('\n');
  
  // Adicionar BOM para UTF-8 (suporte a acentuação)
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  
  // Download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}.csv`;
  link.click();
  
  URL.revokeObjectURL(link.href);
}

/**
 * @swagger
 * Exporta dados para Excel (XLSX)
 * @param {Object} dados - Objeto com dados a exportar (pode ter múltiplas abas)
 * @param {string} nomeArquivo - Nome do arquivo de saída (sem extensão)
 * @param {Array} linhasComErro - Array de linhas com erro para criar planilha separada
 */
function exportarXLSX(dados, nomeArquivo = 'dados_processados', linhasComErro = []) {
  if (!dados) {
    alert('Nenhum dado para exportar');
    return;
  }
  
  const workbook = XLSX.utils.book_new();
  
  // Aba de dados
  if (dados.dados && dados.dados.length > 0) {
    const worksheetDados = XLSX.utils.json_to_sheet(dados.dados);
    XLSX.utils.book_append_sheet(workbook, worksheetDados, 'Dados');
  }
  
  // Aba de status
  if (dados.status && dados.status.length > 0) {
    const worksheetStatus = XLSX.utils.json_to_sheet(dados.status);
    XLSX.utils.book_append_sheet(workbook, worksheetStatus, 'Status');
  }
  
  // Aba de problemas
  if (dados.problemas && dados.problemas.length > 0) {
    const worksheetProblemas = XLSX.utils.json_to_sheet(dados.problemas);
    XLSX.utils.book_append_sheet(workbook, worksheetProblemas, 'Problemas');
  }
  
  // Aba de linhas com erro
  if (linhasComErro && linhasComErro.length > 0) {
    // Preparar dados para a planilha (remover propriedades internas)
    const dadosLinhasErro = linhasComErro.map(linha => {
      const linhaExport = { ...linha };
      delete linhaExport._camposComErro;
      return linhaExport;
    });
    
    const worksheetErros = XLSX.utils.json_to_sheet(dadosLinhasErro);
    XLSX.utils.book_append_sheet(workbook, worksheetErros, 'Linhas com Erro');
  }
  
  // Aba de pós-processamento (se disponível)
  if (dados.posProcessamento && dados.posProcessamento.resultados && dados.posProcessamento.resultados.length > 0) {
    // Preparar dados de pós-processamento para exportação
    const dadosPosProcessamento = dados.posProcessamento.resultados.map(r => {
      const linha = {
        'NO VALE': r.noVale,
        'Arquivo': r.arquivo,
        'LD': r.ld,
        'Revisão': r.revisao,
        'Encontrado no CSV': r.encontradoNoCSV ? 'Sim' : 'Não',
        'Emitido': r.emitido ? 'Sim' : 'Não',
        'Data GR Rec': r.dadosCSV.dataGRRec ? (r.dadosCSV.dataGRRec instanceof Date ? formatarData(r.dadosCSV.dataGRRec) : String(r.dadosCSV.dataGRRec)) : '',
        'REALIZADO 2': r.comparacaoData.dataLD ? formatarData(r.comparacaoData.dataLD) : (r.realizado2Original || ''),
        'Status Data': r.comparacaoData.iguais === true ? 'OK' : (r.comparacaoData.iguais === false ? `Diferença: ${r.comparacaoData.diferenca} dias` : 'N/A'),
        'Diferença (dias)': r.comparacaoData.diferenca !== null ? r.comparacaoData.diferenca : '',
        'Projeto/SE': r.dadosCSV.projetoSE || '',
        'Empresa': r.dadosCSV.empresa || '',
        'Título': r.dadosCSV.title || '',
        'Fin. Dev': r.dadosCSV.finDev || '',
        'GR Recebimento': r.dadosCSV.grRecebimento || '',
        'Status': r.dadosCSV.status || '',
        'Fase': r.dadosCSV.fase || '',
        'Formato': r.dadosCSV.formato || '',
        'Responsável': r.dadosCSV.responsavel || ''
      };
      return linha;
    });
    
    const worksheetPosProcessamento = XLSX.utils.json_to_sheet(dadosPosProcessamento);
    XLSX.utils.book_append_sheet(workbook, worksheetPosProcessamento, 'Pós-Processamento');
  }
  
  // Aba de discrepâncias de data (se disponível)
  if (dados.posProcessamento && dados.posProcessamento.resultados) {
    const discrepancias = dados.posProcessamento.resultados.filter(r => 
      r.comparacaoData.iguais === false && r.comparacaoData.diferenca !== null
    );
    
    if (discrepancias.length > 0) {
      const dadosDiscrepancias = discrepancias.map(r => {
        return {
          'NO VALE': r.noVale,
          'Arquivo': r.arquivo,
          'Data GR Rec (CSV)': r.comparacaoData.dataCSV ? formatarData(r.comparacaoData.dataCSV) : (r.dadosCSV.dataGRRec ? String(r.dadosCSV.dataGRRec) : ''),
          'REALIZADO 2 (LD)': r.comparacaoData.dataLD ? formatarData(r.comparacaoData.dataLD) : (r.realizado2Original || ''),
          'Diferença (dias)': r.comparacaoData.diferenca,
          'Ação Sugerida': r.comparacaoData.diferenca > 0 
            ? `Ajustar LD: Data GR Rec está ${Math.abs(r.comparacaoData.diferenca)} dias antes`
            : `Ajustar LD: Data GR Rec está ${Math.abs(r.comparacaoData.diferenca)} dias depois`
        };
      });
      
      const worksheetDiscrepancias = XLSX.utils.json_to_sheet(dadosDiscrepancias);
      XLSX.utils.book_append_sheet(workbook, worksheetDiscrepancias, 'Discrepâncias Data');
    }
  }
  
  // Se não houver abas, criar uma com os dados fornecidos
  if (workbook.SheetNames.length === 0) {
    if (Array.isArray(dados)) {
      const worksheet = XLSX.utils.json_to_sheet(dados);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    } else {
      alert('Formato de dados inválido para exportação Excel');
      return;
    }
  }
  
  // Download
  XLSX.writeFile(workbook, `${nomeArquivo}.xlsx`);
}

/**
 * @swagger
 * Exporta dados para JSON
 * @param {Object} dados - Dados a exportar
 * @param {string} nomeArquivo - Nome do arquivo de saída (sem extensão)
 */
function exportarJSON(dados, nomeArquivo = 'dados_processados') {
  if (!dados) {
    alert('Nenhum dado para exportar');
    return;
  }
  
  // Converter datas para string ISO
  const dadosSerializados = JSON.parse(JSON.stringify(dados, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2));
  
  const json = JSON.stringify(dadosSerializados, null, 2);
  
  // Download
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}.json`;
  link.click();
  
  URL.revokeObjectURL(link.href);
}

/**
 * @swagger
 * Formata data para string no formato dd/MM/yyyy
 * @param {Date} data - Data a formatar
 * @returns {string} Data formatada
 */
function formatarData(data) {
  if (!(data instanceof Date) || isNaN(data.getTime())) {
    return '';
  }
  
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}

/**
 * @swagger
 * Exporta dados do pós-processamento
 * @param {Object} resultadoPosProcessamento - Resultado do pós-processamento
 * @param {string} formato - Formato de exportação ('csv', 'xlsx', 'json')
 * @param {string} nomeArquivo - Nome do arquivo de saída (sem extensão)
 */
function exportarPosProcessamentoDados(resultadoPosProcessamento, formato, nomeArquivo = 'pos_processamento') {
  if (!resultadoPosProcessamento || !resultadoPosProcessamento.resultados) {
    alert('Nenhum dado de pós-processamento para exportar');
    return;
  }
  
  // Preparar dados para exportação
  const dadosExportacao = {
    processamento: {
      data: new Date().toISOString(),
      totalLinhasProcessadas: resultadoPosProcessamento.totalLinhasProcessadas || 0,
      valesEncontrados: resultadoPosProcessamento.valesEncontrados || 0,
      valesNaoEncontrados: resultadoPosProcessamento.valesNaoEncontrados || 0,
      valesEmitidos: resultadoPosProcessamento.valesEmitidos || 0,
      valesNaoEmitidos: resultadoPosProcessamento.valesNaoEmitidos || 0,
      discrepânciasData: resultadoPosProcessamento.discrepânciasData || 0
    },
    resultados: resultadoPosProcessamento.resultados.map(r => {
      return {
        'NO VALE': r.noVale,
        'Arquivo': r.arquivo,
        'LD': r.ld,
        'Revisão': r.revisao,
        'Encontrado no CSV': r.encontradoNoCSV ? 'Sim' : 'Não',
        'Emitido': r.emitido ? 'Sim' : 'Não',
        'Data GR Rec': r.dadosCSV.dataGRRec ? (r.dadosCSV.dataGRRec instanceof Date ? formatarData(r.dadosCSV.dataGRRec) : String(r.dadosCSV.dataGRRec)) : '',
        'REALIZADO 2': r.comparacaoData.dataLD ? formatarData(r.comparacaoData.dataLD) : (r.realizado2Original || ''),
        'Status Data': r.comparacaoData.iguais === true ? 'OK' : (r.comparacaoData.iguais === false ? `Diferença: ${r.comparacaoData.diferenca} dias` : 'N/A'),
        'Diferença (dias)': r.comparacaoData.diferenca !== null ? r.comparacaoData.diferenca : '',
        'Projeto/SE': r.dadosCSV.projetoSE || '',
        'Empresa': r.dadosCSV.empresa || '',
        'Título': r.dadosCSV.title || '',
        'Fin. Dev': r.dadosCSV.finDev || '',
        'GR Recebimento': r.dadosCSV.grRecebimento || '',
        'Status': r.dadosCSV.status || '',
        'Fase': r.dadosCSV.fase || '',
        'Formato': r.dadosCSV.formato || '',
        'Responsável': r.dadosCSV.responsavel || ''
      };
    }),
    discrepancias: resultadoPosProcessamento.resultados
      .filter(r => r.comparacaoData.iguais === false && r.comparacaoData.diferenca !== null)
      .map(r => {
        return {
          'NO VALE': r.noVale,
          'Arquivo': r.arquivo,
          'Data GR Rec (CSV)': r.comparacaoData.dataCSV ? formatarData(r.comparacaoData.dataCSV) : (r.dadosCSV.dataGRRec ? String(r.dadosCSV.dataGRRec) : ''),
          'REALIZADO 2 (LD)': r.comparacaoData.dataLD ? formatarData(r.comparacaoData.dataLD) : (r.realizado2Original || ''),
          'Diferença (dias)': r.comparacaoData.diferenca,
          'Ação Sugerida': r.comparacaoData.diferenca > 0 
            ? `Ajustar LD: Data GR Rec está ${Math.abs(r.comparacaoData.diferenca)} dias antes`
            : `Ajustar LD: Data GR Rec está ${Math.abs(r.comparacaoData.diferenca)} dias depois`
        };
      })
  };
  
  switch (formato.toLowerCase()) {
    case 'csv':
      exportarCSV(dadosExportacao.resultados, nomeArquivo);
      break;
    case 'xlsx':
      const workbook = XLSX.utils.book_new();
      
      // Aba de resultados
      if (dadosExportacao.resultados.length > 0) {
        const worksheetResultados = XLSX.utils.json_to_sheet(dadosExportacao.resultados);
        XLSX.utils.book_append_sheet(workbook, worksheetResultados, 'Resultados');
      }
      
      // Aba de discrepâncias
      if (dadosExportacao.discrepancias.length > 0) {
        const worksheetDiscrepancias = XLSX.utils.json_to_sheet(dadosExportacao.discrepancias);
        XLSX.utils.book_append_sheet(workbook, worksheetDiscrepancias, 'Discrepâncias');
      }
      
      // Aba de estatísticas
      const worksheetEstatisticas = XLSX.utils.json_to_sheet([dadosExportacao.processamento]);
      XLSX.utils.book_append_sheet(workbook, worksheetEstatisticas, 'Estatísticas');
      
      XLSX.writeFile(workbook, `${nomeArquivo}.xlsx`);
      break;
    case 'json':
      exportarJSON(dadosExportacao, nomeArquivo);
      break;
    default:
      alert(`Formato "${formato}" não suportado`);
  }
}

/**
 * @swagger
 * Exporta dados consolidados de múltiplos arquivos
 * @param {Object} resultadoValidacao - Resultado da validação de múltiplos arquivos
 * @param {Array} todosDados - Todos os dados processados de todos os arquivos
 * @param {string} formato - Formato de exportação ('csv', 'xlsx', 'json')
 * @param {string} nomeArquivo - Nome do arquivo de saída (sem extensão)
 * @param {Array} linhasComErro - Array de linhas com erro para criar planilha separada (apenas para Excel)
 */
function exportarDadosConsolidados(resultadoValidacao, todosDados, formato, nomeArquivo = 'dados_processados', linhasComErro = []) {
  const dadosExportacao = {
    processamento: {
      data: new Date().toISOString(),
      totalArquivos: resultadoValidacao.estatisticas.totalArquivos,
      arquivosProcessados: resultadoValidacao.estatisticas.arquivosProcessados,
      arquivosComErro: resultadoValidacao.estatisticas.arquivosComErro,
      totalLinhas: resultadoValidacao.estatisticas.totalLinhas,
      totalLinhasValidas: resultadoValidacao.estatisticas.totalLinhasValidas,
      totalLinhasIncompletas: resultadoValidacao.estatisticas.totalLinhasIncompletas
    },
    dados: todosDados,
    status: resultadoValidacao.statusPorArquivo,
    problemas: resultadoValidacao.problemas
  };
  
  // Incluir dados de pós-processamento se disponível (acessar variável global do app.js)
  if (typeof window !== 'undefined' && window.resultadoPosProcessamento) {
    dadosExportacao.posProcessamento = window.resultadoPosProcessamento;
  }
  
  switch (formato.toLowerCase()) {
    case 'csv':
      // Para CSV, incluir dados de pós-processamento nas colunas se disponível
      if (typeof window !== 'undefined' && window.resultadoPosProcessamento && window.resultadoPosProcessamento.resultados && window.resultadoPosProcessamento.resultados.length > 0) {
        const resultadoPosProcessamento = window.resultadoPosProcessamento;
        // Criar mapa de validação por NO VALE
        const validacaoPorVale = new Map();
        resultadoPosProcessamento.resultados.forEach(r => {
          validacaoPorVale.set(r.noVale, r);
        });
        
        // Adicionar colunas de validação aos dados
        const dadosComValidacao = todosDados.map(linha => {
          const validacao = validacaoPorVale.get(linha['NO VALE']);
          if (validacao) {
            return {
              ...linha,
              'Encontrado no CSV': validacao.encontradoNoCSV ? 'Sim' : 'Não',
              'Emitido': validacao.emitido ? 'Sim' : 'Não',
              'Data GR Rec': validacao.dadosCSV.dataGRRec ? (validacao.dadosCSV.dataGRRec instanceof Date ? formatarData(validacao.dadosCSV.dataGRRec) : String(validacao.dadosCSV.dataGRRec)) : '',
              'Status Data': validacao.comparacaoData.iguais === true ? 'OK' : (validacao.comparacaoData.iguais === false ? `Diferença: ${validacao.comparacaoData.diferenca} dias` : 'N/A'),
              'Projeto/SE': validacao.dadosCSV.projetoSE || '',
              'Empresa': validacao.dadosCSV.empresa || '',
              'Título': validacao.dadosCSV.title || ''
            };
          }
          return linha;
        });
        exportarCSV(dadosComValidacao, nomeArquivo);
      } else {
        exportarCSV(todosDados, nomeArquivo);
      }
      break;
    case 'xlsx':
      exportarXLSX(dadosExportacao, nomeArquivo, linhasComErro);
      break;
    case 'json':
      exportarJSON(dadosExportacao, nomeArquivo);
      break;
    default:
      alert(`Formato "${formato}" não suportado`);
  }
}
