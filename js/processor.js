/**
 * @swagger
 * ProcessadorLDs - Módulo de Processamento
 * 
 * Este módulo contém a lógica principal para processar arquivos de LD
 * e transformar os dados conforme o fluxo do Power Query original.
 */

/**
 * @swagger
 * Tabela de conversão de nomes de colunas
 * Normaliza diferentes variações de nomes de colunas para o padrão esperado
 */
const TABELA_CONVERSAO = [
  { old: 'NO VALE', new: 'NO VALE' },
  { old: 'NO  VALE', new: 'NO VALE' },
  { old: 'VALE DOCUMENT NUMBER', new: 'NO VALE' },
  { old: 'PREVISTO', new: 'PREVISTO' },
  { old: 'PREVISTO 1', new: 'PREVISTO 1' },
  { old: 'PREVISTO 2', new: 'PREVISTO 2' },
  { old: 'REPROGRAMADO', new: 'REPROGRAMADO' },
  { old: 'REPROGRAMADO 1', new: 'REPROGRAMADO 1' },
  { old: 'REPROGRAMADO 2', new: 'REPROGRAMADO 2' },
  { old: 'REALIZADO', new: 'REALIZADO' },
  { old: 'REALIZADO 1', new: 'REALIZADO 1' },
  { old: 'REALIZADO 2', new: 'REALIZADO 2' },
  { old: 'FORMATO', new: 'FORMATO' },
  { old: 'PAGS/ FOLHAS', new: 'PAGS/ FOLHAS' },
  { old: 'PAGS / FOLHAS', new: 'PAGS/ FOLHAS' },
  { old: 'AÇÕES', new: 'AÇÕES' },
  { old: 'ACOES', new: 'AÇÕES' }
];

/**
 * @swagger
 * Processa um arquivo LD e retorna dados transformados
 * @param {File} arquivo - Arquivo LD a ser processado (CSV ou XLSX)
 * @returns {Promise<Object>} Objeto com dados processados, status e problemas
 */
async function processarArquivo(arquivo) {
  try {
    const nomeArquivo = arquivo.name;
    const extensao = nomeArquivo.split('.').pop().toLowerCase();
    
    let dadosBrutos;
    
    if (extensao === 'xlsx' || extensao === 'xls') {
      dadosBrutos = await lerArquivoExcel(arquivo);
    } else if (extensao === 'csv') {
      dadosBrutos = await lerArquivoCSV(arquivo);
    } else {
      throw new Error(`Formato não suportado: ${extensao}`);
    }
    
    // Identificar cabeçalho
    const indiceCabecalho = identificarCabecalho(dadosBrutos);
    if (indiceCabecalho === null) {
      throw new Error('Cabeçalho "NO VALE" não encontrado no arquivo');
    }
    
    // Transformar dados
    const dadosTransformados = transformarDados(dadosBrutos, indiceCabecalho);
    
    // Extrair informações do nome do arquivo
    const { ld, revisao } = extrairInfoNomeArquivo(nomeArquivo);
    
    return {
      nomeArquivo,
      ld,
      revisao,
      dados: dadosTransformados,
      totalLinhas: dadosBrutos.length,
      linhasProcessadas: dadosTransformados.length
    };
  } catch (erro) {
    return {
      nomeArquivo: arquivo.name,
      erro: erro.message,
      dados: []
    };
  }
}

/**
 * @swagger
 * Lê um arquivo Excel e retorna dados brutos
 * @param {File} arquivo - Arquivo Excel
 * @returns {Promise<Array>} Array de arrays representando as linhas da planilha
 */
async function lerArquivoExcel(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', raw: true });
        
        // Encontrar primeira planilha ativa (não oculta, não CAPA, não ROSTO, etc.)
        let sheetName = null;
        for (const name of workbook.SheetNames) {
          const sheet = workbook.Sheets[name];
          const upperName = name.toUpperCase();
          
          if (!upperName.includes('CAPA') && 
              !upperName.includes('ROSTO') && 
              !upperName.includes('PREENCHIMENTO') && 
              !upperName.includes('EXTRAS')) {
            sheetName = name;
            break;
          }
        }
        
        if (!sheetName) {
          reject(new Error('Nenhuma planilha válida encontrada'));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const dados = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false 
        });
        
        resolve(dados);
      } catch (erro) {
        reject(new Error(`Erro ao ler arquivo Excel: ${erro.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(arquivo);
  });
}

/**
 * @swagger
 * Lê um arquivo CSV e retorna dados brutos
 * @param {File} arquivo - Arquivo CSV
 * @returns {Promise<Array>} Array de arrays representando as linhas do CSV
 */
async function lerArquivoCSV(arquivo) {
  return new Promise((resolve, reject) => {
    Papa.parse(arquivo, {
      header: false,
      skipEmptyLines: false,
      complete: (resultados) => {
        if (resultados.errors.length > 0) {
          reject(new Error(`Erro ao processar CSV: ${resultados.errors[0].message}`));
        } else {
          resolve(resultados.data);
        }
      },
      error: (erro) => {
        reject(new Error(`Erro ao ler CSV: ${erro.message}`));
      }
    });
  });
}

/**
 * @swagger
 * Identifica o índice da linha do cabeçalho "NO VALE"
 * @param {Array} linhas - Array de linhas da planilha
 * @returns {number|null} Índice da linha do cabeçalho ou null se não encontrado
 */
function identificarCabecalho(linhas) {
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!Array.isArray(linha) || linha.length === 0) continue;
    
    const col1 = String(linha[0] || '').trim().toUpperCase();
    const col2 = String(linha[1] || '').trim().toUpperCase();
    
    if (col1 === 'NO VALE' || col1 === 'NO  VALE' || col1 === 'VALE DOCUMENT NUMBER' ||
        col2 === 'NO VALE' || col2 === 'NO  VALE' || col2 === 'VALE DOCUMENT NUMBER') {
      return i;
    }
  }
  return null;
}

/**
 * @swagger
 * Transforma dados brutos em formato padronizado
 * @param {Array} dadosBrutos - Dados brutos da planilha
 * @param {number} indiceCabecalho - Índice da linha do cabeçalho
 * @returns {Array} Array de objetos com dados transformados
 */
function transformarDados(dadosBrutos, indiceCabecalho) {
  if (indiceCabecalho === null || indiceCabecalho >= dadosBrutos.length) {
    return [];
  }
  
  // Pular até o cabeçalho
  const dadosAposCabecalho = dadosBrutos.slice(indiceCabecalho);
  
  // Primeira linha é o cabeçalho
  const linhaCabecalho = dadosAposCabecalho[0];
  
  // Normalizar cabeçalho
  const cabecalhoNormalizado = linhaCabecalho.map(col => {
    const colUpper = String(col || '').trim().toUpperCase();
    const conversao = TABELA_CONVERSAO.find(c => c.old === colUpper);
    return conversao ? conversao.new : colUpper;
  });
  
  // Processar linhas de dados
  const linhasDados = dadosAposCabecalho.slice(1);
  const dadosTransformados = [];
  
  for (const linha of linhasDados) {
    // Verificar se linha está vazia
    if (!linha || linha.every(cell => !cell || String(cell).trim() === '')) {
      continue;
    }
    
    // Criar objeto com dados da linha
    const linhaObj = {};
    for (let i = 0; i < cabecalhoNormalizado.length; i++) {
      const coluna = cabecalhoNormalizado[i];
      if (coluna) {
        linhaObj[coluna] = linha[i] !== undefined ? String(linha[i] || '').trim() : '';
      }
    }
    
    // Filtrar linhas com AÇÕES = "E"
    if (linhaObj['AÇÕES'] && linhaObj['AÇÕES'].toUpperCase() === 'E') {
      continue;
    }
    
    // Processar PAGS/ FOLHAS
    if (linhaObj['PAGS/ FOLHAS']) {
      linhaObj['PAGS/ FOLHAS'] = linhaObj['PAGS/ FOLHAS']
        .replace(/-/g, '0')
        .replace(/NA/gi, '0');
    }
    
    // Extrair disciplina
    linhaObj['Disciplina'] = extrairDisciplina(linhaObj['NO VALE']);
    
    // Converter PREVISTO 2 para data
    linhaObj['DataPrevisto'] = converterData(linhaObj['PREVISTO 2']);
    
    // Adicionar apenas se tiver NO VALE
    if (linhaObj['NO VALE']) {
      dadosTransformados.push(linhaObj);
    }
  }
  
  return dadosTransformados;
}

/**
 * @swagger
 * Extrai disciplina do número do vale
 * @param {string} noVale - Número do vale
 * @returns {string|null} Disciplina extraída ou null
 */
function extrairDisciplina(noVale) {
  if (!noVale || typeof noVale !== 'string') {
    return null;
  }
  
  try {
    const trimmedValue = noVale.trim();
    const reverseValue = trimmedValue.split('').reverse().join('');
    
    // Extrair valor entre delimitadores "-" e "-" (na string reversa)
    const extractedValue = reverseValue.match(/-([^-]+)-/);
    
    if (extractedValue && extractedValue[1]) {
      const characterCount = extractedValue[1].length;
      if (characterCount === 1) {
        return extractedValue[1];
      }
    }
    
    // Verificar sétimo caractere
    if (trimmedValue.length >= 7) {
      const seventhChar = trimmedValue[6];
      if (seventhChar === '-') {
        return 'J';
      }
    }
    
    return null;
  } catch (erro) {
    return null;
  }
}

/**
 * @swagger
 * Converte string de data para objeto Date
 * @param {string} dataStr - String de data (formato dd/MM/yyyy)
 * @returns {Date|null} Objeto Date ou null se inválido
 */
function converterData(dataStr) {
  if (!dataStr || typeof dataStr !== 'string') {
    return null;
  }
  
  try {
    // Tentar formato dd/MM/yyyy
    const partes = dataStr.trim().split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
      const ano = parseInt(partes[2], 10);
      
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
        const data = new Date(ano, mes, dia);
        if (data.getDate() === dia && data.getMonth() === mes && data.getFullYear() === ano) {
          return data;
        }
      }
    }
    
    // Tentar parse direto
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      return data;
    }
    
    return null;
  } catch (erro) {
    return null;
  }
}

/**
 * @swagger
 * Extrai informações do nome do arquivo (LD e revisão)
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {Object} Objeto com propriedades ld e revisao
 */
function extrairInfoNomeArquivo(nomeArquivo) {
  const nomeUpper = nomeArquivo.toUpperCase();
  
  // Padrão: LD_XXXXX_REV_YY.xlsx ou DF_XXXXX_REV_YY.xlsx
  const match = nomeUpper.match(/^(LD|DF)_([^_]+)_REV_([^.]+)/);
  
  if (match) {
    return {
      ld: match[1] + '_' + match[2],
      revisao: match[3]
    };
  }
  
  return {
    ld: null,
    revisao: null
  };
}
