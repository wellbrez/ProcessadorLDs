/**
 * @swagger
 * ProcessadorLDs - Módulo de Pós-Processamento
 * 
 * Este módulo contém a lógica para validar dados das LDs processadas
 * contra um CSV gerencial do sistema oficial
 */

/**
 * @swagger
 * Normaliza número do vale para comparação
 * @param {string|number} noVale - Número do vale
 * @returns {string} Número do vale normalizado
 */
function normalizarNumeroVale(noVale) {
  if (noVale === null || noVale === undefined || noVale === '') {
    return '';
  }
  
  // Converter para string se necessário
  const noValeStr = String(noVale).trim();
  if (!noValeStr) {
    return '';
  }
  
  // Remove espaços e converte para maiúsculas
  let normalizado = noValeStr.toUpperCase();
  
  // Remove espaços extras entre caracteres
  normalizado = normalizado.replace(/\s+/g, '');
  
  // Padroniza separadores (aceita - ou _)
  normalizado = normalizado.replace(/[_\s]/g, '-');
  
  return normalizado;
}

/**
 * @swagger
 * Calcula ordem numérica para ordenação de revisões
 * -1 → 0, A-N → 1-26, 0+ → 27+
 * @param {string|number} revisao - Valor da revisão
 * @returns {number} Ordem numérica para ordenação
 */
function calcularOrdemRevisao(revisao) {
  if (revisao === null || revisao === undefined || revisao === '') {
    return 999; // Valores vazios vão para o final
  }
  
  const revisaoStr = String(revisao).trim();
  
  // -1 → 0
  if (revisaoStr === '-1') {
    return 0;
  }
  
  // Letras (A-Z) → 1 a 26
  const letraMaiuscula = revisaoStr.toUpperCase();
  if (letraMaiuscula.length === 1 && letraMaiuscula >= 'A' && letraMaiuscula <= 'Z') {
    return letraMaiuscula.charCodeAt(0) - 'A'.charCodeAt(0) + 1; // A=1, B=2, ..., Z=26
  }
  
  // Números (0, 1, 2, ...) → 27 + numero
  const numero = parseInt(revisaoStr, 10);
  if (!isNaN(numero) && numero >= 0) {
    return 27 + numero; // 0=27, 1=28, 2=29, ...
  }
  
  // Caso não reconhecido, retornar valor alto para ir para o final
  return 999;
}

/**
 * @swagger
 * Converte string de data do CSV para objeto Date
 * @param {string} dataStr - String de data do CSV
 * @returns {Date|null} Objeto Date ou null se inválido
 */
function converterDataCSV(dataStr) {
  if (!dataStr || typeof dataStr !== 'string') {
    return null;
  }
  
  const dataStrTrimmed = dataStr.trim();
  if (!dataStrTrimmed || dataStrTrimmed === '') {
    return null;
  }
  
  try {
    // Tentar formato ISO (yyyy-MM-dd HH:mm:ss)
    if (dataStrTrimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
      const data = new Date(dataStrTrimmed);
      if (!isNaN(data.getTime()) && data.getFullYear() >= 1900 && data.getFullYear() <= 2100) {
        return data;
      }
    }
    
    // Tentar formato brasileiro (dd/MM/yyyy)
    if (dataStrTrimmed.includes('/')) {
      const partes = dataStrTrimmed.split(/[\s\/]+/);
      if (partes.length >= 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        let ano = parseInt(partes[2], 10);
        
        if (ano >= 0 && ano <= 99) {
          if (ano <= 49) {
            ano = 2000 + ano;
          } else {
            ano = 1900 + ano;
          }
        }
        
        if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano) && 
            dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11 && ano >= 1900 && ano <= 2100) {
          const data = new Date(ano, mes, dia);
          if (data.getDate() === dia && data.getMonth() === mes && data.getFullYear() === ano) {
            return data;
          }
        }
      }
    }
    
    // Tentar parse direto
    const data = new Date(dataStrTrimmed);
    if (!isNaN(data.getTime()) && data.getFullYear() >= 1900 && data.getFullYear() <= 2100) {
      return data;
    }
    
    return null;
  } catch (erro) {
    return null;
  }
}

/**
 * @swagger
 * Calcula EMISSAO para um grupo de linhas do mesmo vale
 * Ordena por Número Vale e Revisão, então calcula PRIMEMISSAO/REVISAO/FICHA
 * @param {Array} linhasCSV - Array de linhas do CSV para um vale
 * @returns {Array} Array de linhas com campo EMISSAO calculado
 */
function calcularEmissaoParaVale(linhasCSV) {
  if (!linhasCSV || !Array.isArray(linhasCSV) || linhasCSV.length === 0) {
    return [];
  }
  
  // Criar cópia das linhas para não modificar o original
  const linhasOrdenadas = linhasCSV.map(linha => ({ ...linha }));
  
  // Ordenar por Número Vale (já agrupado, mas manter para garantir) e depois por Revisão
  linhasOrdenadas.sort((a, b) => {
    const noValeA = normalizarNumeroVale(a['Número Vale'] || a['Num. Vale Antigo'] || '');
    const noValeB = normalizarNumeroVale(b['Número Vale'] || b['Num. Vale Antigo'] || '');
    
    // Primeiro ordenar por número do vale
    if (noValeA !== noValeB) {
      return noValeA.localeCompare(noValeB);
    }
    
    // Depois ordenar por revisão usando calcularOrdemRevisao
    const revisaoA = a['Revisão'] || '';
    const revisaoB = b['Revisão'] || '';
    const ordemA = calcularOrdemRevisao(revisaoA);
    const ordemB = calcularOrdemRevisao(revisaoB);
    
    return ordemA - ordemB;
  });
  
  // Calcular EMISSAO para cada linha
  let primeiraLinhaNaoFicha = true;
  
  for (let i = 0; i < linhasOrdenadas.length; i++) {
    const linha = linhasOrdenadas[i];
    const revisao = String(linha['Revisão'] || '').trim();
    
    // Linhas com revisão -1 são FICHA
    if (revisao === '-1') {
      linha['EMISSAO'] = 'FICHA';
    } else if (primeiraLinhaNaoFicha) {
      // Primeira linha não-FICHA é PRIMEMISSAO
      linha['EMISSAO'] = 'PRIMEMISSAO';
      primeiraLinhaNaoFicha = false;
    } else {
      // Demais linhas não-FICHA são REVISAO
      linha['EMISSAO'] = 'REVISAO';
    }
  }
  
  return linhasOrdenadas;
}

/**
 * @swagger
 * Calcula PRIMCERTIFICACAO para um grupo de linhas do mesmo vale
 * Encontra primeira linha com revisão numérica, tp≠B, Final.Devol=APR
 * @param {Array} linhasCSV - Array de linhas do CSV já ordenadas (deve ter sido processado por calcularEmissaoParaVale)
 * @returns {Array} Array de linhas com campo PRIMCERTIFICACAO calculado
 */
function calcularPrimCertificacaoParaVale(linhasCSV) {
  if (!linhasCSV || !Array.isArray(linhasCSV) || linhasCSV.length === 0) {
    return linhasCSV || [];
  }
  
  // Criar cópia das linhas para não modificar o original
  const linhasComCertificacao = linhasCSV.map(linha => ({ ...linha }));
  
  // Encontrar primeira linha que atende aos critérios
  for (let i = 0; i < linhasComCertificacao.length; i++) {
    const linha = linhasComCertificacao[i];
    const revisao = String(linha['Revisão'] || '').trim();
    const tpEmissao = String(linha['Tp. Emissão'] || '').trim().toUpperCase();
    const finalDevol = String(linha['Final. Devol'] || '').trim().toUpperCase();
    
    // Verificar se revisão é numérica (não alfabética e não -1)
    const revisaoNumero = parseInt(revisao, 10);
    const ehRevisaoNumerica = !isNaN(revisaoNumero) && revisaoNumero >= 0 && revisao !== '-1';
    
    // Verificar critérios para PRIMCERTIFICACAO
    if (ehRevisaoNumerica && tpEmissao !== 'B' && finalDevol === 'APR') {
      linha['PRIMCERTIFICACAO'] = true;
      // Marcar apenas a primeira que atende aos critérios
      break;
    } else {
      linha['PRIMCERTIFICACAO'] = false;
    }
  }
  
  return linhasComCertificacao;
}

/**
 * @swagger
 * Compara Data GR Rec (do CSV) com REALIZADO 2 (da LD)
 * @param {string|Date} dataGRRec - Data GR Rec do CSV
 * @param {string|Date} dataRealizado2 - REALIZADO 2 da LD
 * @returns {Object} Objeto com resultado da comparação
 */
function compararDatas(dataGRRec, dataRealizado2) {
  let dataCSV = null;
  let dataLD = null;
  let realizado2Original = null;
  
  // Converter Data GR Rec do CSV
  if (dataGRRec) {
    if (dataGRRec instanceof Date) {
      dataCSV = dataGRRec;
    } else {
      dataCSV = converterDataCSV(dataGRRec);
    }
  }
  
  // Converter REALIZADO 2 da LD
  if (dataRealizado2) {
    realizado2Original = String(dataRealizado2);
    
    if (dataRealizado2 instanceof Date) {
      dataLD = dataRealizado2;
    } else {
      // Tentar usar a função converterData do processor.js se disponível (mesma lógica usada para PREVISTO 2)
      if (typeof window !== 'undefined' && typeof converterData === 'function') {
        dataLD = converterData(dataRealizado2);
      } else {
        // Fallback: tentar converter manualmente usando mesma lógica
        dataLD = converterDataCSV(dataRealizado2);
      }
    }
  }
  
  // Calcular diferença
  let diferenca = null;
  let iguais = false;
  
  if (dataCSV && dataLD) {
    // Normalizar para comparar apenas a data (sem hora)
    const dataCSVNormalizada = new Date(dataCSV.getFullYear(), dataCSV.getMonth(), dataCSV.getDate());
    const dataLDNormalizada = new Date(dataLD.getFullYear(), dataLD.getMonth(), dataLD.getDate());
    
    diferenca = Math.round((dataLDNormalizada - dataCSVNormalizada) / (1000 * 60 * 60 * 24));
    
    // Considera iguais se diferença <= 1 dia (tolerância)
    iguais = Math.abs(diferenca) <= 1;
  } else if (!dataCSV && !dataLD) {
    // Ambas ausentes - considerar como não comparável
    iguais = null;
  } else {
    // Uma ausente - considerar como discrepância
    iguais = false;
  }
  
  return {
    iguais,
    dataCSV,
    dataLD,
    diferenca,
    realizado2Original
  };
}

/**
 * @swagger
 * Verifica se alguma linha do CSV tem EMISSAO = "PrimEmissao"
 * @param {Array} linhasCSV - Array de linhas do CSV para um vale
 * @returns {Object} Objeto com boolean emitido e linha com PrimEmissao
 */
function verificarEmissao(linhasCSV) {
  // linhasCSV pode ser um objeto único (para economizar memória) ou array
  if (!linhasCSV) {
    return { emitido: false, linhaPrimEmissao: null };
  }
  
  // Se for objeto único (não array), verificar diretamente
  if (!Array.isArray(linhasCSV)) {
    const emissao = linhasCSV['EMISSAO'] || linhasCSV['Emissão'] || linhasCSV['emissao'];
    const temPrimEmissao = emissao && String(emissao).trim().toUpperCase() === 'PRIMEMISSAO';
    return {
      emitido: temPrimEmissao,
      linhaPrimEmissao: temPrimEmissao ? linhasCSV : null
    };
  }
  
  // Se for array (compatibilidade com código antigo)
  if (linhasCSV.length === 0) {
    return { emitido: false, linhaPrimEmissao: null };
  }
  
  const linhaPrimEmissao = linhasCSV.find(linha => {
    const emissao = linha['EMISSAO'] || linha['Emissão'] || linha['emissao'];
    return emissao && String(emissao).trim().toUpperCase() === 'PRIMEMISSAO';
  });
  
  return {
    emitido: !!linhaPrimEmissao,
    linhaPrimEmissao: linhaPrimEmissao || null
  };
}

/**
 * @swagger
 * Verifica se número do vale existe no CSV
 * @param {string} noVale - Número do vale
 * @param {Map} indiceCSV - Índice do CSV por número do vale (armazena arrays de linhas)
 * @returns {Object} Objeto com boolean encontrado e linhas do CSV
 */
function validarValeNoCSV(noVale, indiceCSV) {
  if (!noVale || !indiceCSV) {
    return { encontrado: false, linhasCSV: [] };
  }
  
  const valeNormalizado = normalizarNumeroVale(noVale);
  const linhasCSV = indiceCSV.get(valeNormalizado);
  
  // linhasCSV agora é sempre um array ou undefined
  return {
    encontrado: !!linhasCSV && Array.isArray(linhasCSV) && linhasCSV.length > 0,
    linhasCSV: Array.isArray(linhasCSV) ? linhasCSV : []
  };
}

/**
 * @swagger
 * Extrai dados relevantes de uma linha do CSV
 * @param {Object} linhaCSV - Linha do CSV (pode ser linha completa ou reduzida)
 * @returns {Object} Objeto com dados extraídos
 */
function extrairDadosCSV(linhaCSV) {
  if (!linhaCSV) {
    return {};
  }
  
  // A linha pode vir já reduzida (apenas campos necessários) ou completa
  // EMISSAO agora é calculado dinamicamente, não vem do CSV original
  return {
    dataGRRec: linhaCSV['Data GR Rec'] || linhaCSV['Data GR REC'] || linhaCSV['Data GR Rec.'] || null,
    finDev: linhaCSV['Final. Devol'] || linhaCSV['Finalidade de devolução'] || null,
    projetoSE: linhaCSV['Projeto/SE'] || linhaCSV['Projeto / SE'] || null,
    empresa: linhaCSV['Empresa'] || null,
    title: linhaCSV['Title'] || linhaCSV['Título'] || null,
    emissao: linhaCSV['EMISSAO'] || null, // Campo calculado dinamicamente
    primCertificacao: linhaCSV['PRIMCERTIFICACAO'] === true || false, // Campo calculado dinamicamente
    grRecebimento: linhaCSV['GR Recebimento'] || linhaCSV['GR Receb.'] || null,
    status: linhaCSV['Status'] || null,
    fase: linhaCSV['Fase'] || null,
    formato: linhaCSV['Formato'] || linhaCSV['Formato de Arquivo'] || null,
    responsavel: linhaCSV['Responsável'] || linhaCSV['Responsavel'] || null
  };
}

/**
 * @swagger
 * Coleta todos os números de vale das LDs processadas para filtrar o CSV
 * @param {Array} dadosLDs - Array de dados processados das LDs
 * @returns {Set<string>} Set com todos os números de vale normalizados
 */
function coletarValesDasLDs(dadosLDs) {
  const valesSet = new Set();
  
  dadosLDs.forEach(resultadoLD => {
    if (resultadoLD.dados && Array.isArray(resultadoLD.dados)) {
      resultadoLD.dados.forEach(linha => {
        // Apenas coletar vales de linhas válidas
        if (validarLinha(linha).valida && linha['NO VALE']) {
          const valeNormalizado = normalizarNumeroVale(linha['NO VALE']);
          // Adicionar ao Set apenas se a normalização retornar uma string não vazia
          if (valeNormalizado && valeNormalizado !== '') {
            valesSet.add(valeNormalizado);
          }
        }
      });
    }
  });
  
  return valesSet;
}

/**
 * @swagger
 * Carrega e indexa CSV gerencial usando PapaParse com streaming otimizado
 * Filtra apenas linhas cujo NO VALE está presente nas LDs processadas
 * @param {File} arquivo - Arquivo CSV
 * @param {Set<string>} valesParaBuscar - Set com números de vale normalizados para filtrar
 * @param {Function} callbackProgresso - Função callback para atualizar progresso
 * @returns {Promise<Object>} Promise com índice do CSV e metadados
 */
async function carregarCSVGerencial(arquivo, valesParaBuscar, callbackProgresso) {
  return new Promise((resolve, reject) => {
    const tamanhoMB = arquivo.size / (1024 * 1024);
    const tamanhoGB = arquivo.size / (1024 * 1024 * 1024);
    
    const indiceCSV = new Map();
    let linhaAtual = 0;
    let linhasProcessadas = 0; // Linhas que realmente foram processadas (filtradas)
    let cabecalho = null;
    let totalLinhasEstimado = 0;
    
    // Estimar total de linhas (aproximado)
    if (arquivo.size) {
      // Estimativa: ~200 bytes por linha em média
      totalLinhasEstimado = Math.ceil(arquivo.size / 200);
    }
    
    // Se não há vales para buscar, retornar índice vazio
    if (!valesParaBuscar || valesParaBuscar.size === 0) {
      if (callbackProgresso) {
        callbackProgresso(100, 'Nenhum vale para buscar nas LDs processadas');
      }
      resolve({
        indice: indiceCSV,
        cabecalho: [],
        totalLinhas: 0,
        totalValesUnicos: 0,
        linhasProcessadas: 0,
        valesEncontrados: 0,
        totalValesParaBuscar: 0
      });
      return;
    }
    
    // Contador de vales encontrados (para otimização)
    let valesEncontrados = 0;
    const totalValesParaBuscar = valesParaBuscar.size;
    
    // Função para extrair apenas campos necessários (economiza memória)
    function extrairCamposNecessarios(linha) {
      // Extrair número do vale usando mesma lógica de busca
      let noVale = linha['Número Vale'];
      if (!noVale || String(noVale).trim() === '') {
        noVale = linha['Num. Vale Antigo'];
      }
      
      return {
        'Número Vale': noVale || null,
        'Num. Vale Antigo': linha['Num. Vale Antigo'] || null,
        'Data GR Rec': linha['Data GR Rec'] || linha['Data GR REC'] || linha['Data GR Rec.'] || null,
        'Final. Devol': linha['Final. Devol'] || linha['Finalidade de devolução'] || null,
        'Revisão': linha['Revisão'] || null,
        'Tp. Emissão': linha['Tp. Emissão'] || linha['Tipo Emissão'] || linha['Tipo Emissao'] || null,
        'Projeto/SE': linha['Projeto/SE'] || linha['Projeto / SE'] || null,
        'Empresa': linha['Empresa'] || null,
        'Title': linha['Title'] || linha['Título'] || null,
        'GR Recebimento': linha['GR Recebimento'] || linha['GR Receb.'] || null,
        'Status': linha['Status'] || null,
        'Fase': linha['Fase'] || null,
        'Formato': linha['Formato'] || linha['Formato de Arquivo'] || null,
        'Responsável': linha['Responsável'] || linha['Responsavel'] || null
      };
    }
    
    // Otimização agressiva: Como estamos filtrando apenas vales relevantes, podemos processar
    // chunks muito maiores. A maioria das linhas será ignorada rapidamente (verificação O(1) com Set)
    // Para arquivos grandes (3GB+), usar chunks muito grandes para máxima velocidade
    const chunkSize = tamanhoGB > 1 ? 100000 : (tamanhoMB > 500 ? 50000 : 20000);
    // Pausas mínimas - apenas 1ms para dar chance ao navegador processar eventos de UI
    const pauseTime = 1;
    
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Não converter tipos automaticamente (economiza memória)
      chunkSize: chunkSize, // Chunks menores para arquivos grandes
      step: undefined, // Não usar step, apenas chunk
      chunk: function(results, parser) {
        try {
          // Processar chunk
          if (!cabecalho && results.meta.fields) {
            cabecalho = results.meta.fields;
          }
          
        // Processar linhas do chunk de forma otimizada
        const linhasChunk = results.data;
        const numLinhas = linhasChunk ? linhasChunk.length : 0;
        
        // Incrementar contador de linhas ANTES de processar (para progresso mais preciso)
        linhaAtual += numLinhas;
        
        // Otimização: processar todas as linhas do chunk de uma vez
        // Como estamos filtrando, a maioria será ignorada rapidamente
        for (let i = 0; i < numLinhas; i++) {
          const linha = linhasChunk[i];
          if (!linha) continue;
          
          // Tentar encontrar número do vale - usar apenas 'Número Vale' e 'Num. Vale Antigo'
          let noVale = linha['Número Vale'];
          if (!noVale || String(noVale).trim() === '') {
            noVale = linha['Num. Vale Antigo'];
          }
          
          // Normalizar o vale para comparação
          const valeNormalizado = noVale ? normalizarNumeroVale(noVale) : '';
          
          // FILTRO PRINCIPAL: Só processar se o vale está na lista de vales das LDs
          // Esta verificação é O(1) com Set, muito rápida
          if (valeNormalizado && valeNormalizado !== '' && valesParaBuscar.has(valeNormalizado)) {
            linhasProcessadas++;
            
            // Extrair apenas campos necessários para economizar memória
            const linhaReduzida = extrairCamposNecessarios(linha);
            
            // Armazenar todas as linhas por vale (necessário para ordenação e cálculo de EMISSAO)
            if (!indiceCSV.has(valeNormalizado)) {
              // Primeira linha encontrada para este vale - criar array
              indiceCSV.set(valeNormalizado, [linhaReduzida]);
              valesEncontrados++;
            } else {
              // Adicionar linha ao array existente
              indiceCSV.get(valeNormalizado).push(linhaReduzida);
            }
          }
        }
          
          // Limpar referências do chunk processado para liberar memória imediatamente
          linhasChunk.length = 0; // Limpar array
          results.data = null;
          
          // Atualizar progresso de forma balanceada: frequente o suficiente para feedback visual,
          // mas não tanto a ponto de bloquear o processamento
          // Atualizar a cada X linhas processadas (não baseado em chunks)
          const intervaloUpdateLinhas = tamanhoGB > 1 ? 50000 : (tamanhoMB > 500 ? 25000 : 10000);
          // Atualizar se passou do intervalo OU se encontrou todos os vales OU se está no início
          const ultimaAtualizacao = Math.floor((linhaAtual - numLinhas) / intervaloUpdateLinhas);
          const atualAtualizacao = Math.floor(linhaAtual / intervaloUpdateLinhas);
          const deveAtualizar = (atualAtualizacao > ultimaAtualizacao) || 
                               (valesEncontrados === totalValesParaBuscar) ||
                               linhaAtual <= intervaloUpdateLinhas; // Sempre atualizar no início
          
          if (callbackProgresso && deveAtualizar) {
            const percentual = totalLinhasEstimado > 0 
              ? Math.min(95, Math.round((linhaAtual / totalLinhasEstimado) * 100))
              : Math.min(95, Math.round((linhaAtual / 100000) * 0.1));
            
            // Mostrar progresso com informações de filtragem
            const percentualVales = totalValesParaBuscar > 0 
              ? Math.round((valesEncontrados / totalValesParaBuscar) * 100)
              : 0;
            
            // Texto mais conciso para caber na barra
            const textoProgresso = `${linhaAtual.toLocaleString()} linhas | ${linhasProcessadas.toLocaleString()} filtradas | ${valesEncontrados}/${totalValesParaBuscar} vales (${percentualVales}%)`;
            
            // Usar requestAnimationFrame para atualizar UI de forma não bloqueante
            // Mas não esperar - continuar processamento imediatamente
            requestAnimationFrame(() => {
              callbackProgresso(percentual, textoProgresso);
            });
          }
          
          // Pausa mínima (1ms) apenas para não bloquear UI completamente
          // Como estamos filtrando, a maioria das linhas é ignorada rapidamente (O(1) com Set)
          // Usar setTimeout com delay mínimo para permitir que o navegador processe eventos
          setTimeout(() => {
            parser.resume();
          }, pauseTime);
          
        } catch (erroChunk) {
          console.error('Erro ao processar chunk:', erroChunk);
          // Continuar processamento mesmo com erro em um chunk
          setTimeout(() => parser.resume(), pauseTime);
        }
      },
      complete: function(results) {
        // Processar cada grupo de linhas para calcular EMISSAO e PRIMCERTIFICACAO
        indiceCSV.forEach((linhasVale, valeNormalizado) => {
          // Calcular EMISSAO para este vale
          const linhasComEmissao = calcularEmissaoParaVale(linhasVale);
          
          // Calcular PRIMCERTIFICACAO para este vale
          const linhasComCertificacao = calcularPrimCertificacaoParaVale(linhasComEmissao);
          
          // Atualizar o índice com as linhas processadas
          indiceCSV.set(valeNormalizado, linhasComCertificacao);
        });
        
        // Garantir que o progresso final seja atualizado com o número real de linhas
        if (callbackProgresso) {
          const percentualVales = totalValesParaBuscar > 0 
            ? Math.round((valesEncontrados / totalValesParaBuscar) * 100)
            : 0;
          const textoFinal = `CSV carregado! ${linhaAtual.toLocaleString()} linhas processadas | ${linhasProcessadas.toLocaleString()} filtradas | ${valesEncontrados}/${totalValesParaBuscar} vales encontrados (${percentualVales}%)`;
          callbackProgresso(100, textoFinal);
        }
        
        resolve({
          indice: indiceCSV,
          cabecalho: cabecalho || (results && results.meta && results.meta.fields) || [],
          totalLinhas: linhaAtual,
          totalValesUnicos: indiceCSV.size,
          linhasProcessadas: linhasProcessadas,
          valesEncontrados: valesEncontrados,
          totalValesParaBuscar: totalValesParaBuscar
        });
      },
      error: function(erro) {
        let mensagemErro = `Erro ao processar CSV: ${erro.message || erro}`;
        
        // Adicionar informações sobre o tamanho do arquivo
        if (tamanhoGB >= 1) {
          mensagemErro += `\n\nArquivo: ${tamanhoGB.toFixed(2)} GB`;
        } else {
          mensagemErro += `\n\nArquivo: ${tamanhoMB.toFixed(2)} MB`;
        }
        
        reject(new Error(mensagemErro));
      }
    });
  });
}

/**
 * @swagger
 * Processa pós-processamento de todas as LDs validadas contra o CSV
 * @param {Array} dadosLDs - Array de dados processados das LDs
 * @param {Map} indiceCSV - Índice do CSV por número do vale
 * @param {Function} callbackProgresso - Função callback para atualizar progresso
 * @returns {Object} Objeto consolidado com resultados do pós-processamento
 */
function processarPosProcessamento(dadosLDs, indiceCSV, callbackProgresso) {
  // Validações iniciais
  if (!dadosLDs || !Array.isArray(dadosLDs)) {
    console.error('dadosLDs inválido:', dadosLDs);
    return {
      totalLinhasProcessadas: 0,
      valesEncontrados: 0,
      valesNaoEncontrados: 0,
      valesEmitidos: 0,
      valesNaoEmitidos: 0,
      discrepânciasData: 0,
      resultados: []
    };
  }
  
  if (!indiceCSV || !(indiceCSV instanceof Map)) {
    console.error('indiceCSV inválido:', indiceCSV);
    return {
      totalLinhasProcessadas: 0,
      valesEncontrados: 0,
      valesNaoEncontrados: 0,
      valesEmitidos: 0,
      valesNaoEmitidos: 0,
      discrepânciasData: 0,
      resultados: []
    };
  }
  
  const resultados = [];
  let totalLinhasProcessadas = 0;
  let valesEncontrados = 0;
  let valesNaoEncontrados = 0;
  let valesEmitidos = 0;
  let valesNaoEmitidos = 0;
  let discrepânciasData = 0;
  
  // Coletar todas as linhas válidas de todas as LDs
  const todasLinhasValidas = [];
  
  try {
    dadosLDs.forEach(resultadoLD => {
    if (resultadoLD && resultadoLD.dados && Array.isArray(resultadoLD.dados)) {
      resultadoLD.dados.forEach(linha => {
        // Apenas processar linhas válidas
        // Verificar se validarLinha existe e se a linha tem NO VALE
        if (linha && linha['NO VALE']) {
          let linhaValida = true;
          try {
            if (typeof validarLinha === 'function') {
              const validacao = validarLinha(linha);
              linhaValida = validacao && validacao.valida === true;
            }
          } catch (e) {
            console.warn('Erro ao validar linha:', e);
            linhaValida = true; // Continuar processamento mesmo se validação falhar
          }
          
          if (linhaValida) {
          todasLinhasValidas.push({
            ...linha,
            arquivo: resultadoLD.nomeArquivo,
            ld: resultadoLD.ld || '',
            revisao: resultadoLD.revisao || ''
          });
          }
        }
      });
    }
    });
    
    totalLinhasProcessadas = todasLinhasValidas.length;
    
    // Processar cada linha (será feito em chunks no app.js se necessário)
    todasLinhasValidas.forEach((linha, index) => {
    const noVale = linha['NO VALE'];
    
    // Atualizar progresso a cada 50 linhas para não sobrecarregar
    if (callbackProgresso && index % 50 === 0) {
      const percentual = Math.min(95, Math.round((index / totalLinhasProcessadas) * 100));
      callbackProgresso(percentual, `Processando validação: ${index + 1} / ${totalLinhasProcessadas}...`);
    }
    
    // Verificar se vale existe no CSV
    const validacaoVale = validarValeNoCSV(noVale, indiceCSV);
    
    if (validacaoVale.encontrado) {
      valesEncontrados++;
    } else {
      valesNaoEncontrados++;
    }
    
    // Verificar emissão
    let emissaoInfo = { emitido: false, linhaPrimEmissao: null };
    try {
      if (validacaoVale && validacaoVale.linhasCSV) {
        emissaoInfo = verificarEmissao(validacaoVale.linhasCSV);
      }
    } catch (e) {
      console.warn('Erro ao verificar emissão:', e);
    }
    
    if (emissaoInfo && emissaoInfo.emitido) {
      valesEmitidos++;
    } else if (validacaoVale && validacaoVale.encontrado) {
      valesNaoEmitidos++;
    }
    
    // Comparar datas
    let comparacaoData = { iguais: null, dataCSV: null, dataLD: null, diferenca: null, realizado2Original: null };
    
    // Determinar qual linha usar (PrimEmissao tem prioridade)
    // Agora linhasCSV sempre é um array
    let linhaCSVPrincipal = null;
    if (emissaoInfo && emissaoInfo.linhaPrimEmissao) {
      linhaCSVPrincipal = emissaoInfo.linhaPrimEmissao;
    } else if (validacaoVale && validacaoVale.encontrado && validacaoVale.linhasCSV && Array.isArray(validacaoVale.linhasCSV) && validacaoVale.linhasCSV.length > 0) {
      // Pegar primeira linha do array
      linhaCSVPrincipal = validacaoVale.linhasCSV[0];
    }
    
    if (validacaoVale.encontrado && linhaCSVPrincipal) {
      const dadosCSV = extrairDadosCSV(linhaCSVPrincipal);
      const dataGRRec = dadosCSV.dataGRRec;
      const realizado2 = linha['REALIZADO 2'] || linha['REALIZADO2'] || null;
      
      comparacaoData = compararDatas(dataGRRec, realizado2);
      
      if (comparacaoData.iguais === false) {
        discrepânciasData++;
      }
    }
    
    // Extrair dados do CSV (inclui primCertificacao calculado)
    const dadosCSV = linhaCSVPrincipal ? extrairDadosCSV(linhaCSVPrincipal) : {};
    
    // Adicionar resultado
    resultados.push({
      noVale,
      arquivo: linha.arquivo,
      ld: linha.ld,
      revisao: linha.revisao,
      encontradoNoCSV: validacaoVale.encontrado,
      emitido: emissaoInfo.emitido,
      dadosCSV: {
        dataGRRec: dadosCSV.dataGRRec,
        finDev: dadosCSV.finDev,
        projetoSE: dadosCSV.projetoSE,
        empresa: dadosCSV.empresa,
        title: dadosCSV.title,
        emissao: dadosCSV.emissao, // Campo calculado dinamicamente
        primCertificacao: dadosCSV.primCertificacao, // Campo calculado dinamicamente
        grRecebimento: dadosCSV.grRecebimento,
        status: dadosCSV.status,
        fase: dadosCSV.fase,
        formato: dadosCSV.formato,
        responsavel: dadosCSV.responsavel
      },
      comparacaoData,
      linhasCSV: validacaoVale.linhasCSV,
      realizado2Original: linha['REALIZADO 2'] || linha['REALIZADO2'] || null
    });
    });
    
  } catch (erro) {
    console.error('Erro durante processamento:', erro);
    // Retornar resultados parciais em caso de erro
    return {
      totalLinhasProcessadas,
      valesEncontrados,
      valesNaoEncontrados,
      valesEmitidos,
      valesNaoEmitidos,
      discrepânciasData,
      resultados,
      erro: erro.message
    };
  }
  
  if (callbackProgresso) {
    callbackProgresso(100, 'Validação concluída!');
  }
  
  // Garantir que sempre retorna um objeto válido
  const resultadoFinal = {
    totalLinhasProcessadas,
    valesEncontrados,
    valesNaoEncontrados,
    valesEmitidos,
    valesNaoEmitidos,
    discrepânciasData,
    resultados: Array.isArray(resultados) ? resultados : []
  };
  
  return resultadoFinal;
}
