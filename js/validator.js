/**
 * @swagger
 * ProcessadorLDs - Módulo de Validação
 * 
 * Este módulo contém funções para validar dados e identificar problemas
 */

/**
 * @swagger
 * Campos obrigatórios para validação - seguindo EXATAMENTE a lógica do Power Query original
 * No Power Query (DadosFinais), o filtro exige:
 * - [NO VALE] <> null and [NO VALE] <> ""
 * - [PREVISTO] <> null and [PREVISTO] <> ""
 * - [PREVISTO 1] <> null and [PREVISTO 1] <> ""
 * - [FORMATO] <> null and [FORMATO] <> ""
 * - [PAGS/ FOLHAS] <> null and [PAGS/ FOLHAS] <> ""
 * - [Disciplina] <> null
 * - [DataPrevisto] <> null and [DataPrevisto] <> ""
 * 
 * NOTA IMPORTANTE: 
 * - PREVISTO 2 NÃO é validado diretamente no filtro final
 * - Mas DataPrevisto é criado de PREVISTO 2 usando: Date.From(DateTime.From([PREVISTO 2]))
 * - Se PREVISTO 2 não tiver valor válido ou não puder ser convertido, DataPrevisto será null
 * - Linhas com DataPrevisto null são filtradas no DadosFinais
 */
const CAMPOS_OBRIGATORIOS = [
  'NO VALE',
  'PREVISTO',
  'PREVISTO 1',
  'FORMATO',
  'PAGS/ FOLHAS',
  'Disciplina',
  'DataPrevisto'
];

/**
 * @swagger
 * Valida uma linha de dados - seguindo a lógica do Power Query original
 * @param {Object} linha - Linha de dados a validar
 * @returns {Object} Objeto com propriedades valida (boolean) e erros (Array)
 */
function validarLinha(linha) {
  const erros = [];
  
  // Validar campos obrigatórios conforme Power Query original (DadosFinais)
  // O filtro do Power Query verifica: [Campo] <> null and [Campo] <> ""
  // Isso significa que o campo não pode ser null E não pode ser string vazia
  for (const campo of CAMPOS_OBRIGATORIOS) {
    const valor = linha[campo];
    
    // Verificar se é null ou undefined
    if (valor === null || valor === undefined) {
      erros.push(`Campo obrigatório "${campo}" não preenchido (null/undefined)`);
      continue;
    }
    
    // Verificar se é string vazia (após trim)
    if (typeof valor === 'string' && valor.trim() === '') {
      erros.push(`Campo obrigatório "${campo}" não preenchido (string vazia)`);
      continue;
    }
    
    // Validação especial para DataPrevisto - deve ser objeto Date válido
    if (campo === 'DataPrevisto') {
      if (!(valor instanceof Date) || isNaN(valor.getTime())) {
        erros.push(`Campo obrigatório "${campo}" (data) inválido. Verifique se PREVISTO 2 contém uma data válida no formato dd/MM/yyyy`);
      }
    }
    // Validação especial para Disciplina - pode ser null se não conseguir extrair, mas se existe NO VALE deve ter valor
    else if (campo === 'Disciplina') {
      // Disciplina pode ser null se extração falhar, mas se NO VALE existe, deve tentar extrair
      // No Power Query, Disciplina é extraída e se falhar retorna null, mas o filtro exige <> null
      if (valor === null || valor === undefined || valor === '') {
        erros.push(`Campo obrigatório "${campo}" não preenchido`);
      }
    }
    // Validação padrão para outros campos (NO VALE, PREVISTO, PREVISTO 1, FORMATO, PAGS/ FOLHAS)
    // Já verificamos null/undefined e string vazia acima, então se chegou aqui está OK
  }
  
  return {
    valida: erros.length === 0,
    erros
  };
}

/**
 * @swagger
 * Valida o formato do nome do arquivo
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {boolean} true se o nome é válido
 */
function validarNomeArquivo(nomeArquivo) {
  if (!nomeArquivo || typeof nomeArquivo !== 'string') {
    return false;
  }
  
  const nomeUpper = nomeArquivo.toUpperCase();
  
  // Padrão: LD_*_REV_*.xlsx ou DF_*_REV_*.xlsx
  const padrao = /^(LD|DF)_[^_]+_REV_[^.]+\.(XLSX|XLS|CSV)$/;
  
  return padrao.test(nomeUpper);
}

/**
 * @swagger
 * Identifica problemas em dados processados
 * @param {Object} dadosProcessados - Dados processados de um arquivo
 * @returns {Array} Array de objetos com problemas identificados
 */
function identificarProblemas(dadosProcessados) {
  const problemas = [];
  
  // Não validar mais o nome do arquivo - informações são extraídas do conteúdo
  
  // Se houver erro no processamento
  if (dadosProcessados.erro) {
    problemas.push({
      tipo: 'Erro no processamento',
      mensagem: dadosProcessados.erro
    });
    return problemas;
  }
  
  // Verificar problemas de inconsistência de revisão
  if (dadosProcessados.problemas && dadosProcessados.problemas.length > 0) {
    problemas.push(...dadosProcessados.problemas);
  }
  
  // Validar linhas - usar detalhesProcessamento se disponível (mais preciso)
  let linhasInvalidas = [];
  let linhasValidas = [];
  
  if (dadosProcessados.detalhesProcessamento && dadosProcessados.detalhesProcessamento.linhasComErro) {
    // Usar dados já calculados durante o processamento
    linhasInvalidas = dadosProcessados.detalhesProcessamento.linhasComErro.map(le => ({
      linha: le.dados,
      erros: le.erros
    }));
    linhasValidas = dadosProcessados.dados ? 
      dadosProcessados.dados.filter(linha => validarLinha(linha).valida) : [];
  } else {
    // Fallback: validar todas as linhas
    for (const linha of dadosProcessados.dados || []) {
      const validacao = validarLinha(linha);
      if (validacao.valida) {
        linhasValidas.push(linha);
      } else {
        linhasInvalidas.push({
          linha,
          erros: validacao.erros
        });
      }
    }
  }
  
  // Adicionar problema se houver linhas inválidas
  if (linhasInvalidas.length > 0) {
    problemas.push({
      tipo: 'Linhas incompletas',
      mensagem: `${linhasInvalidas.length} linhas possuem células obrigatórias sem preenchimento`,
      detalhes: linhasInvalidas
    });
  }
  
  // Verificar se nenhuma linha foi contabilizada
  if (linhasValidas.length === 0 && linhasInvalidas.length === 0) {
    problemas.push({
      tipo: 'Nenhuma linha contabilizada',
      mensagem: 'Nenhuma linha foi contabilizada, verifique se está no formato adequado e se o \'previsto\' está preenchido corretamente, com datas válidas dd/MM/yyyy'
    });
  }
  
  return problemas;
}

/**
 * @swagger
 * Gera status de processamento para um arquivo
 * @param {Object} dadosProcessados - Dados processados
 * @param {Array} problemas - Lista de problemas identificados
 * @returns {Object} Objeto com status de processamento
 */
function gerarStatus(dadosProcessados, problemas) {
  // Usar informações de detalhesProcessamento se disponível (mais preciso)
  let linhasValidas = 0;
  let linhasIncompletas = 0;
  const totalLinhas = dadosProcessados.totalLinhas || 0;
  
  if (dadosProcessados.detalhesProcessamento) {
    // Usar dados do detalhesProcessamento que são calculados durante o processamento
    linhasValidas = dadosProcessados.detalhesProcessamento.linhasValidas || 0;
    linhasIncompletas = dadosProcessados.detalhesProcessamento.linhasInvalidas || 0;
  } else {
    // Fallback: calcular a partir dos dados processados
    linhasValidas = dadosProcessados.dados ? 
      dadosProcessados.dados.filter(linha => validarLinha(linha).valida).length : 0;
    linhasIncompletas = dadosProcessados.dados ? 
      dadosProcessados.dados.filter(linha => !validarLinha(linha).valida).length : 0;
  }
  
  let status = 'LD Contabilizada';
  
  if (problemas.length > 0) {
    const problemaCritico = problemas.find(p => 
      p.tipo === 'Erro no processamento' || 
      p.tipo === 'Nenhuma linha contabilizada' ||
      p.tipo === 'Inconsistência de Revisão' ||
      p.tipo === 'Inconsistência de LD'
    );
    
    if (problemaCritico) {
      status = problemaCritico.mensagem;
    } else if (linhasIncompletas > 0) {
      status = `${linhasIncompletas} linhas possuem células obrigatórias sem preenchimento`;
    }
  }
  
  return {
    nomeArquivo: dadosProcessados.nomeArquivo,
    status,
    totalLinhas,
    linhasValidas,
    linhasIncompletas,
    problemas: problemas.length
  };
}

/**
 * @swagger
 * Valida múltiplos arquivos processados
 * @param {Array} arquivosProcessados - Array de dados processados
 * @returns {Object} Objeto com estatísticas e problemas consolidados
 */
function validarMultiplosArquivos(arquivosProcessados) {
  const estatisticas = {
    totalArquivos: arquivosProcessados.length,
    arquivosProcessados: 0,
    arquivosComErro: 0,
    totalLinhas: 0,
    totalLinhasValidas: 0,
    totalLinhasIncompletas: 0
  };
  
  const problemasConsolidados = [];
  const statusPorArquivo = [];
  
  for (const arquivo of arquivosProcessados) {
    const problemas = identificarProblemas(arquivo);
    const status = gerarStatus(arquivo, problemas);
    
    statusPorArquivo.push(status);
    
    // Verificar se arquivo tem erro ou problemas
    const temErro = arquivo.erro || problemas.length > 0;
    
    if (arquivo.erro) {
      // Arquivo com erro de processamento
      estatisticas.arquivosComErro++;
    } else {
      // Arquivo processado com sucesso (pode ter problemas de validação)
      estatisticas.arquivosProcessados++;
      estatisticas.totalLinhas += arquivo.totalLinhas || 0;
      estatisticas.totalLinhasValidas += status.linhasValidas;
      estatisticas.totalLinhasIncompletas += status.linhasIncompletas;
      
      // Se tem problemas de validação, também conta como arquivo com erro
      if (problemas.length > 0) {
        estatisticas.arquivosComErro++;
      }
    }
    
    problemasConsolidados.push(...problemas.map(p => ({
      arquivo: arquivo.nomeArquivo,
      tipo: p.tipo,
      mensagem: p.mensagem
    })));
  }
  
  return {
    estatisticas,
    statusPorArquivo,
    problemas: problemasConsolidados
  };
}
