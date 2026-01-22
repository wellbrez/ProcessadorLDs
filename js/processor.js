/**
 * @swagger
 * ProcessadorLDs - Módulo de Processamento
 * 
 * Este módulo contém a lógica principal para processar arquivos de LD
 * e transformar os dados conforme o fluxo do Power Query original.
 */

/**
 * @swagger
 * Processa Nome e Revisão da LD - Extrai informações de LD e revisão de todas as fontes disponíveis
 * @param {string} nomeArquivo - Nome do arquivo
 * @param {Object} estruturaArquivo - Estrutura do arquivo com dadosCapa e dadosPrincipal
 * @param {Array} dadosBrutos - Dados brutos da folha principal
 * @returns {Object} Objeto com ldsEncontradas, revisoesEncontradas e informações detalhadas
 */
function ProcessarNomeERevisao(nomeArquivo, estruturaArquivo, dadosBrutos) {
  const ldsEncontradas = [];
  const revisoesEncontradas = [];
  
  // 1. Buscar no nome do arquivo
  const infoDoNome = extrairInfoNomeArquivo(nomeArquivo);
  if (infoDoNome.ld) {
    ldsEncontradas.push({ fonte: 'Nome do arquivo', valor: infoDoNome.ld });
  }
  if (infoDoNome.revisao) {
    revisoesEncontradas.push({ fonte: 'Nome do arquivo', valor: infoDoNome.revisao });
  }
  
  // 2. Buscar na folha CAPA/ROSTO
  if (estruturaArquivo && estruturaArquivo.dadosCapa && estruturaArquivo.dadosCapa.length > 0) {
    const infoDaCapa = extrairInfoDoConteudo(estruturaArquivo.dadosCapa);
    if (infoDaCapa.ld) {
      ldsEncontradas.push({ fonte: 'Folha CAPA/ROSTO', valor: infoDaCapa.ld });
    }
    if (infoDaCapa.revisao) {
      revisoesEncontradas.push({ fonte: 'Folha CAPA/ROSTO', valor: infoDaCapa.revisao });
    }
  }
  
  // 3. Buscar na própria folha da LD
  if (dadosBrutos && dadosBrutos.length > 0) {
    const infoDaFolhaLD = extrairInfoDoConteudo(dadosBrutos);
    if (infoDaFolhaLD.ld) {
      ldsEncontradas.push({ fonte: 'Folha da LD', valor: infoDaFolhaLD.ld });
    }
    if (infoDaFolhaLD.revisao) {
      revisoesEncontradas.push({ fonte: 'Folha da LD', valor: infoDaFolhaLD.revisao });
    }
  }
  
  return {
    ldsEncontradas,
    revisoesEncontradas,
    totalFontesLD: ldsEncontradas.length,
    totalFontesRevisao: revisoesEncontradas.length
  };
}

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
  { old: 'PREVISTO 0', new: 'PREVISTO' }, // Célula mesclada - primeira coluna
  { old: 'PREVISTO 1', new: 'PREVISTO 1' },
  { old: 'PREVISTO 2', new: 'PREVISTO 2' },
  { old: 'REPROGRAMADO', new: 'REPROGRAMADO' },
  { old: 'REPROGRAMADO 0', new: 'REPROGRAMADO' }, // Célula mesclada - primeira coluna
  { old: 'REPROGRAMADO 1', new: 'REPROGRAMADO 1' },
  { old: 'REPROGRAMADO 2', new: 'REPROGRAMADO 2' },
  { old: 'REALIZADO', new: 'REALIZADO' },
  { old: 'REALIZADO 0', new: 'REALIZADO' }, // Célula mesclada - primeira coluna
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
    let estruturaArquivo;
    
    if (extensao === 'xlsx' || extensao === 'xls') {
      estruturaArquivo = await lerArquivoExcel(arquivo);
      dadosBrutos = estruturaArquivo.dadosPrincipal;
    } else if (extensao === 'csv') {
      dadosBrutos = await lerArquivoCSV(arquivo);
      estruturaArquivo = {
        dadosPrincipal: dadosBrutos,
        dadosCapa: null,
        nomePlanilhaPrincipal: 'CSV',
        nomePlanilhaCapa: null
      };
    } else {
      throw new Error(`Formato não suportado: ${extensao}`);
    }
    
    // Processar Nome e Revisão - Extrair informações de LD e revisão ANTES de identificar o cabeçalho
    // porque essas informações não dependem do cabeçalho estar presente
    const resultadoProcessarNomeERevisao = ProcessarNomeERevisao(nomeArquivo, estruturaArquivo, dadosBrutos);
    const { ldsEncontradas, revisoesEncontradas, totalFontesLD, totalFontesRevisao } = resultadoProcessarNomeERevisao;
    
    // Agora identificar cabeçalho e transformar dados
    const indiceCabecalho = identificarCabecalho(dadosBrutos);
    
    let dadosTransformados = [];
    let cabecalhoProcessado = [];
    let colunasObrigatorias = ['NO VALE', 'PREVISTO', 'PREVISTO 1', 'PREVISTO 2', 'REPROGRAMADO', 'REPROGRAMADO 1', 'REPROGRAMADO 2', 'REALIZADO', 'REALIZADO 1', 'REALIZADO 2', 'FORMATO', 'PAGS/ FOLHAS', 'AÇÕES'];
    
    if (indiceCabecalho !== null) {
      const resultadoTransformacao = transformarDados(dadosBrutos, indiceCabecalho);
      // transformarDados agora retorna { dados, cabecalho }
      if (resultadoTransformacao && typeof resultadoTransformacao === 'object' && 'dados' in resultadoTransformacao) {
        dadosTransformados = resultadoTransformacao.dados || [];
        cabecalhoProcessado = resultadoTransformacao.cabecalho || [];
      } else {
        // Fallback para compatibilidade (caso ainda retorne array diretamente)
        dadosTransformados = Array.isArray(resultadoTransformacao) ? resultadoTransformacao : [];
        // Extrair cabeçalho dos dados se disponível
        if (dadosTransformados.length > 0) {
          cabecalhoProcessado = Object.keys(dadosTransformados[0]);
        }
      }
    }
    
    // Identificar colunas obrigatórias encontradas e colunas adicionais
    const colunasObrigatoriasEncontradas = colunasObrigatorias.filter(col => cabecalhoProcessado.includes(col));
    const colunasAdicionais = cabecalhoProcessado.filter(col => !colunasObrigatorias.includes(col));
    
    // Validar cada linha e coletar informações detalhadas
    const linhasComErro = [];
    let linhasValidas = 0;
    let linhasInvalidas = 0;
    
    dadosTransformados.forEach((linha, indice) => {
      const validacao = validarLinha(linha);
      if (validacao.valida) {
        linhasValidas++;
      } else {
        linhasInvalidas++;
        // Armazenar informações da linha com erro
        linhasComErro.push({
          numeroLinha: indice + 1, // Linha 1-indexed para exibição
          dados: linha,
          erros: validacao.erros,
          camposComErro: validacao.erros.map(erro => {
            // Extrair campo do erro (ex: "Campo obrigatório \"PREVISTO\"" -> "PREVISTO")
            const match = erro.match(/Campo obrigatório\s+"([^"]+)"/);
            return match ? match[1] : null;
          }).filter(campo => campo !== null)
        });
      }
    });
    
    const percentualValidas = dadosTransformados.length > 0 
      ? Math.round((linhasValidas / dadosTransformados.length) * 100) 
      : 0;
    
    // Validar consistência
    const problemas = [];
    
    // Validar LDs
    if (ldsEncontradas.length > 1) {
      const valoresUnicos = [...new Set(ldsEncontradas.map(l => l.valor))];
      if (valoresUnicos.length > 1) {
        problemas.push({
          tipo: 'Inconsistência de LD',
          mensagem: `LD encontrada em múltiplas fontes com valores diferentes: ${ldsEncontradas.map(l => `${l.fonte}="${l.valor}"`).join(', ')}. Verifique a consistência do documento.`
        });
      }
    }
    
    // Validar Revisões
    if (revisoesEncontradas.length > 1) {
      const valoresUnicos = [...new Set(revisoesEncontradas.map(r => r.valor))];
      if (valoresUnicos.length > 1) {
        problemas.push({
          tipo: 'Inconsistência de Revisão',
          mensagem: `Revisão encontrada em múltiplas fontes com valores diferentes: ${revisoesEncontradas.map(r => `${r.fonte}="${r.valor}"`).join(', ')}. Verifique se o documento está atualizado.`
        });
      }
    }
    
    // Usar o valor encontrado (se houver apenas um, ou o primeiro se todos forem iguais)
    // Se não encontrou em nenhuma fonte, usar null (não undefined)
    const ldFinal = ldsEncontradas.length > 0 ? ldsEncontradas[0].valor : null;
    const revisaoFinal = revisoesEncontradas.length > 0 ? revisoesEncontradas[0].valor : null;
    
    return {
      nomeArquivo,
      ld: ldFinal,
      revisao: revisaoFinal,
      dados: dadosTransformados,
      totalLinhas: dadosBrutos.length,
      linhasProcessadas: dadosTransformados.length,
      problemas: problemas.length > 0 ? problemas : undefined,
      // Informações detalhadas do ProcessarNomeERevisao
      processarNomeERevisao: {
        ldsEncontradas: ldsEncontradas.length > 0 ? ldsEncontradas : [],
        revisoesEncontradas: revisoesEncontradas.length > 0 ? revisoesEncontradas : [],
        totalFontesLD,
        totalFontesRevisao,
        ldFinal,
        revisaoFinal
      },
      // Informações detalhadas de processamento e validação
      detalhesProcessamento: {
        colunasProcessadas: cabecalhoProcessado.length,
        colunasObrigatoriasEncontradas: colunasObrigatoriasEncontradas.length,
        totalColunasObrigatorias: colunasObrigatorias.length,
        colunasObrigatoriasFaltando: colunasObrigatorias.filter(col => !colunasObrigatoriasEncontradas.includes(col)),
        colunasAdicionais: colunasAdicionais,
        linhasValidas,
        linhasInvalidas,
        percentualValidas,
        linhasComErro: linhasComErro.slice(0, 100) // Limitar a 100 linhas para não sobrecarregar a UI
      }
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
        
        // Encontrar planilhas
        let sheetName = null;
        let sheetCapa = null;
        
        for (const name of workbook.SheetNames) {
          const upperName = name.toUpperCase();
          
          // Identificar planilha CAPA/ROSTO para buscar metadados
          if ((upperName.includes('CAPA') || upperName.includes('ROSTO')) && !sheetCapa) {
            sheetCapa = name;
          }
          
          // Identificar planilha principal (dados)
          if (!sheetName && 
              !upperName.includes('CAPA') && 
              !upperName.includes('ROSTO') && 
              !upperName.includes('PREENCHIMENTO') && 
              !upperName.includes('EXTRAS')) {
            sheetName = name;
          }
        }
        
        if (!sheetName) {
          reject(new Error('Nenhuma planilha válida encontrada'));
          return;
        }
        
        // Ler planilhas separadamente
        // IMPORTANTE: Usar defval: null para manter células vazias como null
        // Isso é crucial para identificar cabeçalhos corretamente
        const worksheet = workbook.Sheets[sheetName];
        const dados = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: null,  // Mudado de '' para null para melhor identificação de células vazias
          raw: false 
        });
        
        let dadosCapa = null;
        if (sheetCapa) {
          const worksheetCapa = workbook.Sheets[sheetCapa];
          dadosCapa = XLSX.utils.sheet_to_json(worksheetCapa, { 
            header: 1, 
            defval: null,  // Mudado de '' para null
            raw: false 
          });
        }
        
        // Retornar objeto com dados separados
        resolve({
          dadosPrincipal: dados,
          dadosCapa: dadosCapa,
          nomePlanilhaPrincipal: sheetName,
          nomePlanilhaCapa: sheetCapa
        });
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
  // Seguindo lógica do Power Query: busca "NO VALE" em Column1 ou Column2
  // No Power Query: Text.Trim(Text.Upper([Column1])) = "NO VALE" or ...
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!Array.isArray(linha) || linha.length === 0) continue;
    
    // Verificar Column1 (índice 0)
    const col1 = linha[0] !== null && linha[0] !== undefined 
      ? String(linha[0]).trim().toUpperCase() 
      : '';
    
    // Verificar Column2 (índice 1) se existir
    const col2 = linha[1] !== null && linha[1] !== undefined 
      ? String(linha[1]).trim().toUpperCase() 
      : '';
    
    // Verificar se alguma das colunas contém "NO VALE" ou "VALE DOCUMENT NUMBER"
    // Aceitar variações: "NO VALE", "NO  VALE" (com espaços duplos), "VALE DOCUMENT NUMBER"
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
  
  // Pular até o cabeçalho (equivalente a Table.Skip no Power Query)
  const dadosAposCabecalho = dadosBrutos.slice(indiceCabecalho);
  
  // Primeira linha é o cabeçalho (ResultadoFinal{0} no Power Query)
  const linhaCabecalho = dadosAposCabecalho[0];
  
  // SEGUINDO EXATAMENTE A LÓGICA DO POWER QUERY:
  // 1. Record.ToTable - Converter linha (record) em tabela (cada coluna vira uma linha)
  const tabelaCabecalho = [];
  for (let i = 0; i < linhaCabecalho.length; i++) {
    tabelaCabecalho.push({
      Value: String(linhaCabecalho[i] || '').trim(),
      Ind: i  // Índice original para manter ordem
    });
  }
  
  // 2. Text.Upper, Text.Trim, Text.Clean
  for (const row of tabelaCabecalho) {
    let valor = row.Value;
    // Clean remove caracteres de controle
    valor = valor.replace(/[\x00-\x1F\x7F]/g, '');
    valor = valor.trim().toUpperCase();
    row.Value = valor;
  }
  
  // 3. FillDown - Preencher células vazias com valor acima
  let ultimoValorNaoVazio = '';
  for (const row of tabelaCabecalho) {
    if (!row.Value || row.Value === '') {
      row.Value = ultimoValorNaoVazio;
    } else {
      ultimoValorNaoVazio = row.Value;
    }
  }
  
  // 4. Group por Value (agrupa linhas com mesmo valor)
  // IMPORTANTE: O Group no Power Query mantém a ordem original dentro de cada grupo
  // O Group cria uma tabela aninhada para cada valor único
  const grupos = {};
  const ordemGrupos = []; // Manter ordem de primeira aparição
  for (const row of tabelaCabecalho) {
    const value = row.Value || ''; // Garantir que não seja undefined
    if (!grupos[value]) {
      grupos[value] = [];
      ordemGrupos.push(value);
    }
    grupos[value].push(row);
  }
  
  // 5. Adicionar índice dentro de cada grupo (indice: 0, 1, 2, ...)
  // No Power Query: Table.AddIndexColumn([Classificado], "indice", 0, 1, Int64.Type)
  // 6. Substituir 0 por null (ReplaceValue com 0 → null)
  // 7. CombineColumns(Value + indice, delimitador=" ")
  const tabelaProcessada = [];
  for (const value of ordemGrupos) {
    const grupo = grupos[value];
    // Dentro de cada grupo, adicionar índice começando de 0
    grupo.forEach((row, idx) => {
      const indice = idx === 0 ? null : idx; // Substitui 0 por null (como no Power Query)
      // CombineColumns: combina Value + indice com espaço
      // Se indice é null, não adiciona espaço (fica só Value)
      // No Power Query: Combiner.CombineTextByDelimiter(" ", QuoteStyle.None)
      const valorCombinado = indice === null ? value : `${value} ${indice}`;
      tabelaProcessada.push({
        Value: valorCombinado.trim(),
        Ind: row.Ind  // Manter índice original (Ind) para ordenar depois
      });
    });
  }
  
  // 8. Sort por Ind (ordem original)
  tabelaProcessada.sort((a, b) => a.Ind - b.Ind);
  
  // 9. Aplicar tabela de conversão (Join com ConversaoColunas)
  const cabecalhoNormalizado = tabelaProcessada.map(row => {
    const valorOriginal = row.Value;
    const valorTrimmed = valorOriginal.trim();
    
    // Buscar conversão exata
    let conversao = TABELA_CONVERSAO.find(c => c.old.toUpperCase() === valorTrimmed);
    
    // Se não encontrou, buscar por padrão (para "PREVISTO 0", "PREVISTO 1", etc)
    if (!conversao) {
      for (const conv of TABELA_CONVERSAO) {
        const oldUpper = conv.old.toUpperCase();
        if (valorTrimmed.startsWith(oldUpper)) {
          const resto = valorTrimmed.substring(oldUpper.length).trim();
          if (resto === '' || /^\d+$/.test(resto)) {
            conversao = conv;
            break;
          }
        }
      }
    }
    
    // Value2 = se New não é null então New, senão Value
    if (conversao) {
      const sufixo = valorTrimmed.substring(conversao.old.toUpperCase().length).trim();
      if (sufixo && /^\d+$/.test(sufixo)) {
        const num = parseInt(sufixo);
        if (num === 0) {
          return conversao.new; // "PREVISTO 0" → "PREVISTO"
        } else {
          return conversao.new + ' ' + num; // "PREVISTO 1" → "PREVISTO 1"
        }
      }
      return conversao.new;
    }
    
    return valorTrimmed;
  });
  
  // 10. Transpose - Volta a ser uma linha (cabeçalho processado)
  // (Já temos cabecalhoNormalizado como array, que é equivalente)
  
  // DEBUG: Verificar se cabeçalho tem todas as colunas necessárias
  const colunasEsperadas = ['NO VALE', 'PREVISTO', 'PREVISTO 1', 'PREVISTO 2', 'FORMATO', 'PAGS/ FOLHAS'];
  const colunasFaltando = colunasEsperadas.filter(col => !cabecalhoNormalizado.includes(col));
  if (colunasFaltando.length > 0) {
    console.warn('Cabeçalho processado não contém todas as colunas esperadas. Faltando:', colunasFaltando);
    console.log('Cabeçalho processado:', cabecalhoNormalizado);
  }
  
  // 11. JuntarCabecalhoPlanilha - Combinar cabeçalho processado com dados
  // No Power Query: if Text.Contains(ResultadoFinal{1}[Column1] ?? "", "-") then Table.Skip(ResultadoFinal, 1) else Table.Skip(ResultadoFinal, 2)
  // Isso significa: se a primeira célula da linha seguinte contém "-", pula 1 linha, senão pula 2 linhas
  let linhasParaPular = 1; // Padrão: pular 1 linha (cabeçalho já foi processado em ResultadoFinal{0})
  if (dadosAposCabecalho.length > 1) {
    const primeiraCelulaProximaLinha = String(dadosAposCabecalho[1][0] || '').trim();
    if (primeiraCelulaProximaLinha.includes('-')) {
      linhasParaPular = 1; // Pula 1 linha adicional (total: 1 linha após cabeçalho)
    } else {
      linhasParaPular = 2; // Pula 2 linhas adicionais (total: 2 linhas após cabeçalho)
    }
  }
  
  // Processar linhas de dados (após pular linhas de separação)
  const linhasDados = dadosAposCabecalho.slice(linhasParaPular);
  const dadosTransformados = [];
  
  for (const linha of linhasDados) {
    // Verificar se linha está vazia
    if (!linha || linha.every(cell => !cell || String(cell).trim() === '')) {
      continue;
    }
    
    // Criar objeto com dados da linha
    // IMPORTANTE: Seguir a lógica do Power Query que mantém null quando apropriado
    // No Power Query, valores vazios podem ser null ou string vazia, mas o filtro verifica ambos
    const linhaObj = {};
    for (let i = 0; i < Math.max(cabecalhoNormalizado.length, linha.length); i++) {
      const coluna = cabecalhoNormalizado[i];
      if (coluna) {
        // Mapear valor da linha para a coluna correspondente
        // No Power Query, valores são mantidos como estão (podem ser null, string, etc)
        // Mas depois são convertidos para text no "Tipo de coluna alterado"
        const valorOriginal = linha[i];
        if (valorOriginal === null || valorOriginal === undefined) {
          linhaObj[coluna] = null;
        } else {
          const valorStr = String(valorOriginal).trim();
          // Se após trim ficar vazio, manter como string vazia (não null)
          // Pois o Power Query verifica tanto null quanto "" no filtro
          linhaObj[coluna] = valorStr === '' ? '' : valorStr;
        }
      }
    }
    
    // Filtrar linhas com AÇÕES = "E"
    if (linhaObj['AÇÕES'] && linhaObj['AÇÕES'].toUpperCase() === 'E') {
      continue;
    }
    
    // Processar PAGS/ FOLHAS - seguindo Power Query: SubstituirTracoZero e SubstituirNAZero
    // No Power Query: Table.ReplaceValue(..., "-", "0", Replacer.ReplaceText, {"PAGS/ FOLHAS"})
    // Depois: Table.ReplaceValue(..., "NA", "0", Replacer.ReplaceText, {"PAGS/ FOLHAS"})
    if (linhaObj['PAGS/ FOLHAS'] !== null && linhaObj['PAGS/ FOLHAS'] !== undefined) {
      let valorPags = String(linhaObj['PAGS/ FOLHAS'] || '');
      valorPags = valorPags.replace(/-/g, '0').replace(/NA/gi, '0');
      linhaObj['PAGS/ FOLHAS'] = valorPags;
    }
    
    // Extrair disciplina - seguindo lógica do Power Query
    // No Power Query: Disciplina é extraída do NO VALE usando lógica específica
    // Se NO VALE existe mas extração falha, Disciplina pode ser null, mas o filtro exige <> null
    if (linhaObj['NO VALE'] && linhaObj['NO VALE'] !== null && linhaObj['NO VALE'] !== '') {
      linhaObj['Disciplina'] = extrairDisciplina(linhaObj['NO VALE']);
      // Se extração falhar, Disciplina será null, o que causará erro na validação
      // Mas isso está correto conforme Power Query
    } else {
      linhaObj['Disciplina'] = null;
    }
    
    // Converter PREVISTO 2 para data - seguindo lógica do Power Query
    // No Power Query: DataPrevisto = Date.From(DateTime.From([PREVISTO 2]))
    // Se PREVISTO 2 não puder ser convertido, DataPrevisto será null
    // IMPORTANTE: PREVISTO 2 pode ser string, número (serial Excel), ou null/undefined
    const previsto2 = linhaObj['PREVISTO 2'];
    if (previsto2 !== null && previsto2 !== undefined && previsto2 !== '') {
      // Tentar converter (aceita string, número serial Excel, etc)
      linhaObj['DataPrevisto'] = converterData(previsto2);
    } else {
      linhaObj['DataPrevisto'] = null;
    }
    
    // Adicionar apenas se tiver NO VALE (conforme Power Query que filtra linhas vazias)
    // No Power Query: Remove linhas completamente vazias antes de adicionar Disciplina
    // Mas aqui já filtramos linhas vazias antes, então se chegou aqui e tem NO VALE, adiciona
    if (linhaObj['NO VALE'] && linhaObj['NO VALE'] !== null && linhaObj['NO VALE'] !== '') {
      dadosTransformados.push(linhaObj);
    }
  }
  
  // Retornar dados transformados junto com informações do cabeçalho
  return {
    dados: dadosTransformados,
    cabecalho: cabecalhoNormalizado
  };
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
  // Seguindo lógica do Power Query: Date.From(DateTime.From([PREVISTO 2]))
  // DateTime.From tenta converter string para DateTime, depois Date.From extrai apenas a data
  
  // Se for null ou undefined, retornar null
  if (dataStr === null || dataStr === undefined) {
    return null;
  }
  
  // Se for número (pode ser serial do Excel), converter
  if (typeof dataStr === 'number') {
    // Excel usa 1 de janeiro de 1900 como base (mas tem bug do ano bissexto 1900)
    // Então serial 1 = 1900-01-01, serial 2 = 1900-01-02, etc.
    // JavaScript usa 1970-01-01 como base, então precisamos ajustar
    // Diferença: 25569 dias (número de dias entre 1900-01-01 e 1970-01-01, considerando o bug)
    const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899 (base do Excel)
    const jsEpoch = new Date(1970, 0, 1);
    const diasDiferenca = Math.round((jsEpoch - excelEpoch) / (1000 * 60 * 60 * 24));
    
    // Converter serial do Excel para milissegundos do JavaScript
    const data = new Date(excelEpoch.getTime() + (dataStr - 1) * 24 * 60 * 60 * 1000);
    
    // Verificar se a data é válida e está em um range razoável
    if (!isNaN(data.getTime()) && data.getFullYear() >= 1900 && data.getFullYear() <= 2100) {
      return data;
    }
    return null;
  }
  
  // Se for string, processar
  if (typeof dataStr !== 'string') {
    return null;
  }
  
  const dataStrTrimmed = dataStr.trim();
  if (!dataStrTrimmed || dataStrTrimmed === '') {
    return null;
  }
  
  try {
    // PRIORIDADE 1: Tentar formato dd/MM/yyyy ou dd/MM/yy (formato brasileiro comum)
    // Verificar PRIMEIRO se tem barras para evitar interpretar como número serial
    if (dataStrTrimmed.includes('/')) {
      const partes = dataStrTrimmed.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
        let ano = parseInt(partes[2], 10);
        
        // Se o ano tem 2 dígitos, converter para 4 dígitos
        // Assumir que anos 00-49 são 2000-2049 e anos 50-99 são 1950-1999
        if (ano >= 0 && ano <= 99) {
          if (ano <= 49) {
            ano = 2000 + ano; // 00-49 → 2000-2049
          } else {
            ano = 1900 + ano; // 50-99 → 1950-1999
          }
        }
        
        if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && 
            dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11 && ano >= 1900 && ano <= 2100) {
          const data = new Date(ano, mes, dia);
          // Verificar se a data é válida (evita datas inválidas como 31/02)
          if (data.getDate() === dia && data.getMonth() === mes && data.getFullYear() === ano) {
            return data;
          }
        }
      }
    }
    
    // PRIORIDADE 2: Verificar se é um número serial do Excel em formato string (ex: "44301")
    // Só tentar se NÃO contém barras (já processado acima)
    if (!dataStrTrimmed.includes('/') && !dataStrTrimmed.includes('-')) {
      const numeroSerial = parseFloat(dataStrTrimmed);
      if (!isNaN(numeroSerial) && numeroSerial > 0 && numeroSerial < 1000000) {
        // Pode ser serial do Excel, tentar converter
        const excelEpoch = new Date(1899, 11, 30);
        const data = new Date(excelEpoch.getTime() + (numeroSerial - 1) * 24 * 60 * 60 * 1000);
        if (!isNaN(data.getTime()) && data.getFullYear() >= 1900 && data.getFullYear() <= 2100) {
          return data;
        }
      }
    }
    
    // Tentar formato yyyy-MM-dd (ISO)
    if (dataStrTrimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
      const data = new Date(dataStrTrimmed);
      if (!isNaN(data.getTime()) && data.getFullYear() >= 1900 && data.getFullYear() <= 2100) {
        return data;
      }
    }
    
    // Tentar parse direto (aceita vários formatos)
    const data = new Date(dataStrTrimmed);
    if (!isNaN(data.getTime()) && data.getFullYear() >= 1900 && data.getFullYear() <= 2100) {
      return data;
    }
    
    return null;
  } catch (erro) {
    return null;
  }
}

// Função removida - agora a extração é feita diretamente em processarArquivo
// Mantida apenas para compatibilidade se necessário

/**
 * @swagger
 * Extrai informações de LD e revisão do conteúdo do documento
 * Busca nas primeiras linhas por padrões como "LD:", "LISTA DE DOCUMENTOS", "REV:", "REVISÃO", etc.
 * @param {Array} dadosBrutos - Dados brutos da planilha
 * @returns {Object} Objeto com propriedades ld e revisao
 */
function extrairInfoDoConteudo(dadosBrutos) {
  let ld = null;
  let revisao = null;
  
  if (!dadosBrutos || !Array.isArray(dadosBrutos) || dadosBrutos.length === 0) {
    return { ld: null, revisao: null };
  }
  
  // Buscar nas primeiras 100 linhas (geralmente essas informações estão no início)
  const linhasParaBuscar = Math.min(100, dadosBrutos.length);
  
  // Primeiro, buscar revisão (que fica em célula abaixo de "REV")
  // Buscar em todas as linhas, incluindo planilha CAPA se houver
  for (let i = 0; i < linhasParaBuscar - 1; i++) {
    const linha = dadosBrutos[i];
    
    if (!Array.isArray(linha)) continue;
    
    // Buscar "REV" na linha atual
    for (let j = 0; j < linha.length; j++) {
      const cellStr = String(linha[j] || '').trim().toUpperCase();
      
      // Verificar se esta célula contém "REV" (mas não "REVISÃO" completo)
      // Aceitar "REV", "REV.", "REVISÕES" mas não "REVISÃO" completo
      if (cellStr.includes('REV') && 
          !cellStr.match(/REVIS[ÃA]O\s*$/) && 
          cellStr !== 'REVISÕES') {
        
        // Verificar se há contexto de tipo de emissão na mesma linha
        const temTipoEmissao = linha.some((cell, idx) => {
          const cellVal = String(cell || '').trim().toUpperCase();
          return idx !== j && (cellVal.includes('TIPO') || cellVal.includes('EMISSÃO') || cellVal === 'TE');
        });
        
        // Buscar nas células abaixo (mesma coluna), pulando células vazias
        // Aumentar limite para 15 linhas abaixo para pegar casos mais distantes
        // Coletar todas as revisões possíveis e pegar a última (ou a numérica se houver)
        const revisoesEncontradas = [];
        
        for (let k = i + 1; k < Math.min(i + 15, dadosBrutos.length); k++) {
          const linhaAbaixo = dadosBrutos[k];
          if (!Array.isArray(linhaAbaixo)) continue;
          
          if (j < linhaAbaixo.length) {
            const valorAbaixo = String(linhaAbaixo[j] || '').trim();
            
            // Se a célula não estiver vazia, verificar se pode ser revisão
            if (valorAbaixo) {
              const valorUpper = valorAbaixo.toUpperCase();
              
              // Ignorar valores que claramente não são revisões
              if (valorUpper === 'TE' || valorUpper === 'TIPO' || valorUpper === 'EMISSÃO') {
                continue;
              }
              
              // Se for número, sempre é revisão válida
              if (/^\d+$/.test(valorAbaixo)) {
                revisoesEncontradas.push({ tipo: 'numero', valor: valorAbaixo, linha: k });
              }
              // Se for letra única
              else if (/^[A-Z]$/.test(valorUpper)) {
                // Se não tem contexto de tipo de emissão, ou se é claramente coluna de revisão
                if (!temTipoEmissao || cellStr === 'REV' || cellStr === 'REV.') {
                  revisoesEncontradas.push({ tipo: 'letra', valor: valorUpper, linha: k });
                }
              }
              // Combinações
              else if (/^\d+[A-Z]$/.test(valorUpper) || /^[A-Z]\d+$/.test(valorUpper)) {
                revisoesEncontradas.push({ tipo: 'combinacao', valor: valorUpper, linha: k });
              }
            }
          }
        }
        
        // Se encontrou revisões, escolher a melhor
        if (revisoesEncontradas.length > 0) {
          // Priorizar números sobre letras
          const numeros = revisoesEncontradas.filter(r => r.tipo === 'numero');
          if (numeros.length > 0) {
            // Pegar o último número (mais recente)
            revisao = numeros[numeros.length - 1].valor;
          } else {
            // Se não tem números, pegar a última revisão (letra ou combinação)
            revisao = revisoesEncontradas[revisoesEncontradas.length - 1].valor;
          }
          break;
        }
      }
    }
    
    if (revisao) break;
  }
  
  // Buscar ID completo da LD (8001PZ-F-11046, não apenas 11046)
  // Expandir busca para mais linhas se necessário - agora incluindo CAPA
  // Aumentar para 200 linhas para garantir que encontra mesmo em arquivos grandes
  const linhasParaBuscarLD = Math.min(200, dadosBrutos.length);
  
  for (let i = 0; i < linhasParaBuscarLD; i++) {
    const linha = dadosBrutos[i];
    if (!Array.isArray(linha)) continue;
    
    for (let cellIdx = 0; cellIdx < linha.length; cellIdx++) {
      const cell = linha[cellIdx];
      const cellStr = String(cell || '').trim();
      
      // Ignorar células vazias
      if (!cellStr) continue;
      
      // Prioridade 1: Padrão completo DF-LD-8001PZ-F-XXXXX, LD-8001PZ-F-XXXXX ou 8001PZ-F-XXXXX
      // Aceitar: DF-LD-8001PZ-F-XXXXX, LD-8001PZ-F-XXXXX, 8001PZ-F-XXXXX
      // IMPORTANTE: Aceitar tanto no início da célula quanto em qualquer lugar
      // Remover o ^ para buscar em qualquer posição
      const matchDFLD = cellStr.match(/(?:DF[-_]?LD[-_]?|LD[-_]?)(\d{4}PZ[-_]?[A-Z][-_]?\d{4,})/i);
      if (matchDFLD) {
        const idCompleto = matchDFLD[1].replace(/[-_\s]/g, '-').toUpperCase();
        ld = `LD_${idCompleto}`;
        break;
      }
      
      // Prioridade 2: Padrão sem prefixo LD (apenas 8001PZ-F-XXXXX)
      // Buscar em qualquer lugar da célula, mas só se não encontrou com prefixo
      // IMPORTANTE: Aceitar também células que começam com o padrão (sem ^)
      if (!ld) {
        const matchSemLD = cellStr.match(/(\d{4}PZ[-_]?[A-Z][-_]?\d{4,})/i);
        if (matchSemLD) {
          const idCompleto = matchSemLD[1].replace(/[-_\s]/g, '-').toUpperCase();
          ld = `LD_${idCompleto}`;
          break;
        }
      }
      
      // Prioridade 4: Buscar apenas o número de 5 dígitos (11047, 11054, etc.) se não encontrou o padrão completo
      // Só fazer isso se não tiver encontrado ainda e se estiver em uma célula que parece ser identificador
      if (!ld) {
        const match5Dig = cellStr.match(/^(11\d{3})$/);
        if (match5Dig) {
          const num = parseInt(match5Dig[1]);
          if (num >= 11000 && num <= 12000) {
            // Tentar construir o ID completo assumindo padrão 8001PZ-F-XXXXX
            ld = `LD_8001PZ-F-${match5Dig[1]}`;
            break;
          }
        }
      }
    }
    
    if (ld) break;
  }
  
  // Se não encontrou o ID completo, tentar buscar no texto completo das linhas
  // Expandir para mais linhas (até 50) para garantir que encontra
  if (!ld) {
    for (let i = 0; i < Math.min(50, dadosBrutos.length); i++) {
      const linha = dadosBrutos[i];
      if (!Array.isArray(linha)) continue;
      
      const linhaTexto = linha.map(cell => String(cell || '').trim()).join(' ');
      
      // Buscar padrão completo DF-LD-8001PZ-F-XXXXX, LD-8001PZ-F-XXXXX ou 8001PZ-F-XXXXX
      const matchDFLDTexto = linhaTexto.match(/(?:DF[-_]?LD[-_]?|LD[-_]?)(\d{4}PZ[-_\s]?[A-Z][-_\s]?\d{4,})/i);
      if (matchDFLDTexto) {
        const idCompleto = matchDFLDTexto[1].replace(/[-_\s]/g, '-').toUpperCase();
        ld = `LD_${idCompleto}`;
        break;
      }
      
      // Buscar padrão sem prefixo (apenas 8001PZ-F-XXXXX)
      if (!ld) {
        const match8001 = linhaTexto.match(/(\d{4}PZ[-_\s]?[A-Z][-_\s]?\d{4,})/i);
        if (match8001) {
          const idCompleto = match8001[1].replace(/[-_\s]/g, '-').toUpperCase();
          ld = `LD_${idCompleto}`;
          break;
        }
      }
      
      // Buscar número de 5 dígitos no texto
      if (!ld) {
        const match5Dig = linhaTexto.match(/\b(11\d{3})\b/);
        if (match5Dig) {
          const num = parseInt(match5Dig[1]);
          if (num >= 11000 && num <= 12000) {
            ld = `LD_8001PZ-F-${match5Dig[1]}`;
            break;
          }
        }
      }
    }
  }
  
  return { ld, revisao };
}

/**
 * @swagger
 * Extrai informações do nome do arquivo (LD e revisão) - usado como fallback
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {Object} Objeto com propriedades ld e revisao
 */
function extrairInfoNomeArquivo(nomeArquivo) {
  if (!nomeArquivo || typeof nomeArquivo !== 'string') {
    return { ld: null, revisao: null };
  }
  
  const nomeUpper = nomeArquivo.toUpperCase();
  
  // Padrão 1: DF-LD-8001PZ-F-11046_REV_10_ATKINS.xlsx
  const matchDFLD = nomeUpper.match(/DF[-_]LD[-_](\d{4}PZ[-_]?[A-Z][-_]?\d{4,})[-_]REV[-_](\d+|[A-Z])[-_.]/);
  if (matchDFLD) {
    const idCompleto = matchDFLD[1].replace(/[-_]/g, '-');
    return {
      ld: `LD_${idCompleto}`,
      revisao: matchDFLD[2]
    };
  }
  
  // Padrão 2: LD-8001PZ-F-11046_REV_10_ATKINS.xlsx ou LD-8001PZ-F-11047_REV_0_JOTAELE.xlsx
  const matchLD = nomeUpper.match(/LD[-_](\d{4}PZ[-_]?[A-Z][-_]?\d{4,})[-_]REV[-_](\d+|[A-Z])[-_.]/);
  if (matchLD) {
    const idCompleto = matchLD[1].replace(/[-_]/g, '-');
    return {
      ld: `LD_${idCompleto}`,
      revisao: matchLD[2]
    };
  }
  
  // Padrão 3: LD-8001PZ-F-11046_REV_10.xlsx (sem sufixo após revisão)
  const matchLD2 = nomeUpper.match(/LD[-_](\d{4}PZ[-_]?[A-Z][-_]?\d{4,})[-_]REV[-_](\d+|[A-Z])\./);
  if (matchLD2) {
    const idCompleto = matchLD2[1].replace(/[-_]/g, '-');
    return {
      ld: `LD_${idCompleto}`,
      revisao: matchLD2[2]
    };
  }
  
  // Padrão 4: DF-LD-8001PZ-F-11046_REV_10.xlsx (sem sufixo)
  const matchDFLD2 = nomeUpper.match(/DF[-_]LD[-_](\d{4}PZ[-_]?[A-Z][-_]?\d{4,})[-_]REV[-_](\d+|[A-Z])\./);
  if (matchDFLD2) {
    const idCompleto = matchDFLD2[1].replace(/[-_]/g, '-');
    return {
      ld: `LD_${idCompleto}`,
      revisao: matchDFLD2[2]
    };
  }
  
  // Padrão alternativo genérico: LD_XXXXX_REV_YY.xlsx ou DF_XXXXX_REV_YY.xlsx
  const match = nomeUpper.match(/^(LD|DF)[-_]([^_]+)[-_]REV[-_](\w+)/);
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
