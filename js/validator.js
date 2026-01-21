/**
 * @swagger
 * ProcessadorLDs - Módulo de Validação
 * 
 * Este módulo contém funções para validar dados e identificar problemas
 */

/**
 * @swagger
 * Campos obrigatórios para validação
 */
const CAMPOS_OBRIGATORIOS = [
  'NO VALE',
  'PREVISTO',
  'PREVISTO 1',
  'PREVISTO 2',
  'FORMATO',
  'PAGS/ FOLHAS',
  'Disciplina',
  'DataPrevisto'
];

/**
 * @swagger
 * Valida uma linha de dados
 * @param {Object} linha - Linha de dados a validar
 * @returns {Object} Objeto com propriedades valida (boolean) e erros (Array)
 */
function validarLinha(linha) {
  const erros = [];
  
  for (const campo of CAMPOS_OBRIGATORIOS) {
    const valor = linha[campo];
    
    if (valor === null || valor === undefined || valor === '') {
      erros.push(`Campo obrigatório "${campo}" não preenchido`);
    } else if (campo === 'DataPrevisto' && !(valor instanceof Date) && !valor) {
      erros.push(`Campo obrigatório "${campo}" (data) inválido`);
    }
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
  
  // Validar nome do arquivo
  if (!validarNomeArquivo(dadosProcessados.nomeArquivo)) {
    problemas.push({
      tipo: 'Nome de arquivo inválido',
      mensagem: 'Nome de arquivo inválido. Verifique nome e Extensão. Deve seguir padrão LD_*_REV_*.xlsx ou DF_*_REV_*.xlsx'
    });
  }
  
  // Se houver erro no processamento
  if (dadosProcessados.erro) {
    problemas.push({
      tipo: 'Erro no processamento',
      mensagem: dadosProcessados.erro
    });
    return problemas;
  }
  
  // Validar linhas
  const linhasInvalidas = [];
  const linhasValidas = [];
  
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
  const totalLinhas = dadosProcessados.totalLinhas || 0;
  const linhasValidas = dadosProcessados.dados ? 
    dadosProcessados.dados.filter(linha => validarLinha(linha).valida).length : 0;
  const linhasIncompletas = totalLinhas - linhasValidas;
  
  let status = 'LD Contabilizada';
  
  if (problemas.length > 0) {
    const problemaCritico = problemas.find(p => 
      p.tipo === 'Erro no processamento' || 
      p.tipo === 'Nome de arquivo inválido' ||
      p.tipo === 'Nenhuma linha contabilizada'
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
    
    if (arquivo.erro) {
      estatisticas.arquivosComErro++;
    } else {
      estatisticas.arquivosProcessados++;
      estatisticas.totalLinhas += arquivo.totalLinhas || 0;
      estatisticas.totalLinhasValidas += status.linhasValidas;
      estatisticas.totalLinhasIncompletas += status.linhasIncompletas;
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
