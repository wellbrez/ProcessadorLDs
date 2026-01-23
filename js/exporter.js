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
 * @param {Array} linhasComErro - Array de linhas com erro para criar planilha separada com formatação
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
  
  // Aba de linhas com erro (com formatação de células)
  if (linhasComErro && linhasComErro.length > 0) {
    // Preparar dados para a planilha (remover propriedades internas)
    const dadosLinhasErro = linhasComErro.map(linha => {
      const linhaExport = { ...linha };
      // Remover propriedade interna _camposComErro (será usada apenas para formatação)
      delete linhaExport._camposComErro;
      return linhaExport;
    });
    
    const worksheetErros = XLSX.utils.json_to_sheet(dadosLinhasErro);
    
    // Aplicar formatação de cor de fundo rosa claro nas células com erro
    // Usando xlsx-js-style que suporta formatação de células
    const range = XLSX.utils.decode_range(worksheetErros['!ref'] || 'A1');
    
    // Obter cabeçalhos (primeira linha) e mapear nome da coluna para índice
    const headersMap = new Map();
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheetErros[cellAddress];
      if (cell && cell.v) {
        headersMap.set(cell.v, col);
      }
    }
    
    // Aplicar formatação nas células com erro
    // Cor rosa claro: RGB(255, 228, 225) = #FFE4E1 em formato ARGB Excel: FFE4E1FF
    // Mas o formato correto é: FF (alpha) + E4E1FF (RGB invertido) = FFE4E1FF
    // Na verdade, o formato é ARGB: Alpha-Red-Green-Blue
    // Rosa claro RGB(255, 228, 225) = FF E4 E1 em hex
    // ARGB: FF (alpha) + FF (red) + E4 (green) + E1 (blue) = FFFFE4E1
    
    linhasComErro.forEach((linha, linhaIndex) => {
      const camposComErro = linha._camposComErro || [];
      const row = linhaIndex + 1; // +1 porque a primeira linha é cabeçalho
      
      // Aplicar formatação em cada campo com erro
      camposComErro.forEach(campo => {
        const col = headersMap.get(campo);
        if (col !== undefined) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          
          // Garantir que a célula existe e tem valor
          if (!worksheetErros[cellAddress]) {
            // Obter o valor original da linha para este campo
            const valor = linha[campo];
            worksheetErros[cellAddress] = {
              t: typeof valor === 'number' ? 'n' : 's',
              v: valor !== null && valor !== undefined ? valor : ''
            };
          }
          
          // Aplicar estilo usando xlsx-js-style
          // Rosa claro: RGB(255, 228, 225) = #FFE4E1
          // Formato ARGB: FF (alpha) + FF (red) + E4 (green) + E1 (blue) = FFFFE4E1
          // Alternativa sem alpha: FFE4E1 (alguns exemplos usam apenas 6 dígitos)
          if (!worksheetErros[cellAddress].s) {
            worksheetErros[cellAddress].s = {};
          }
          
          worksheetErros[cellAddress].s.fill = {
            patternType: 'solid',
            fgColor: { rgb: 'FFFFE4E1' } // Rosa claro em formato ARGB completo
          };
          
          // Garantir que font e alignment também estão definidos
          if (!worksheetErros[cellAddress].s.font) {
            worksheetErros[cellAddress].s.font = {};
          }
          worksheetErros[cellAddress].s.font.color = { rgb: 'FF000000' }; // Texto preto
          
          if (!worksheetErros[cellAddress].s.alignment) {
            worksheetErros[cellAddress].s.alignment = {};
          }
          worksheetErros[cellAddress].s.alignment.vertical = 'center';
          worksheetErros[cellAddress].s.alignment.horizontal = 'left';
        }
      });
    });
    
    // Garantir que o worksheet tem a propriedade de estilos configurada
    // Isso é necessário para xlsx-js-style processar os estilos corretamente
    if (!worksheetErros['!styles']) {
      worksheetErros['!styles'] = {};
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheetErros, 'Linhas com Erro');
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
  
  switch (formato.toLowerCase()) {
    case 'csv':
      exportarCSV(todosDados, nomeArquivo);
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
