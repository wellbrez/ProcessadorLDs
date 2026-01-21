/**
 * @swagger
 * ProcessadorLDs - Aplicação Principal
 * 
 * Este arquivo contém a lógica da interface e orquestração do processamento
 */

// Estado da aplicação
let arquivosSelecionados = [];
let resultadosProcessamento = [];
let resultadoValidacao = null;

// Elementos DOM
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const btnProcessar = document.getElementById('btnProcessar');
const btnLimpar = document.getElementById('btnLimpar');
const btnExportar = document.getElementById('btnExportar');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const statsGrid = document.getElementById('statsGrid');
const tableStatus = document.getElementById('tableStatus');
const tableDados = document.getElementById('tableDados');
const problemsList = document.getElementById('problemsList');
const exportFormat = document.getElementById('exportFormat');

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
btnProcessar.addEventListener('click', processarArquivos);
btnLimpar.addEventListener('click', limparTudo);
btnExportar.addEventListener('click', exportarResultados);

/**
 * @swagger
 * Manipula evento de drag over
 */
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.add('dragover');
}

/**
 * @swagger
 * Manipula evento de drag leave
 */
function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove('dragover');
}

/**
 * @swagger
 * Manipula evento de drop
 */
function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove('dragover');
  
  const files = Array.from(e.dataTransfer.files);
  adicionarArquivos(files);
}

/**
 * @swagger
 * Manipula seleção de arquivos
 */
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  adicionarArquivos(files);
}

/**
 * @swagger
 * Adiciona arquivos à lista de processamento
 */
function adicionarArquivos(files) {
  const arquivosValidos = files.filter(file => {
    const extensao = file.name.split('.').pop().toLowerCase();
    return ['csv', 'xlsx', 'xls'].includes(extensao);
  });
  
  if (arquivosValidos.length === 0) {
    alert('Nenhum arquivo válido selecionado. Use CSV ou XLSX.');
    return;
  }
  
  arquivosSelecionados = [...arquivosSelecionados, ...arquivosValidos];
  atualizarInterfaceUpload();
  btnProcessar.disabled = arquivosSelecionados.length === 0;
}

/**
 * @swagger
 * Atualiza interface de upload
 */
function atualizarInterfaceUpload() {
  if (arquivosSelecionados.length > 0) {
    const nomes = arquivosSelecionados.map(f => f.name).join(', ');
    uploadArea.querySelector('.upload-text').textContent = 
      `${arquivosSelecionados.length} arquivo(s) selecionado(s): ${nomes.substring(0, 100)}${nomes.length > 100 ? '...' : ''}`;
  } else {
    uploadArea.querySelector('.upload-text').textContent = 
      'Arraste arquivos aqui ou clique para selecionar';
  }
}

/**
 * @swagger
 * Processa todos os arquivos selecionados
 */
async function processarArquivos() {
  if (arquivosSelecionados.length === 0) {
    alert('Selecione pelo menos um arquivo para processar');
    return;
  }
  
  btnProcessar.disabled = true;
  progressContainer.classList.add('active');
  resultadosProcessamento = [];
  
  try {
    for (let i = 0; i < arquivosSelecionados.length; i++) {
      const arquivo = arquivosSelecionados[i];
      const progresso = ((i + 1) / arquivosSelecionados.length) * 100;
      
      atualizarProgresso(progresso, `Processando ${arquivo.name}...`);
      
      const resultado = await processarArquivo(arquivo);
      resultadosProcessamento.push(resultado);
    }
    
    // Validar resultados
    resultadoValidacao = validarMultiplosArquivos(resultadosProcessamento);
    
    // Exibir resultados
    exibirResultados();
    
    atualizarProgresso(100, 'Processamento concluído!');
    
    setTimeout(() => {
      progressContainer.classList.remove('active');
    }, 1000);
    
  } catch (erro) {
    console.error('Erro ao processar arquivos:', erro);
    alert(`Erro ao processar arquivos: ${erro.message}`);
    progressContainer.classList.remove('active');
  } finally {
    btnProcessar.disabled = false;
  }
}

/**
 * @swagger
 * Atualiza barra de progresso
 */
function atualizarProgresso(percentual, texto) {
  progressFill.style.width = `${percentual}%`;
  progressFill.textContent = texto || `${Math.round(percentual)}%`;
}

/**
 * @swagger
 * Exibe resultados do processamento
 */
function exibirResultados() {
  // Estatísticas
  exibirEstatisticas();
  
  // Status por arquivo
  exibirStatus();
  
  // Problemas
  exibirProblemas();
  
  // Dados processados
  exibirDados();
  
  // Mostrar seções
  document.getElementById('sectionEstatisticas').classList.remove('hidden');
  document.getElementById('sectionStatus').classList.remove('hidden');
  document.getElementById('sectionExportacao').classList.remove('hidden');
  
  if (resultadoValidacao.problemas.length > 0) {
    document.getElementById('sectionProblemas').classList.remove('hidden');
  }
  
  if (resultadoValidacao.estatisticas.totalLinhasValidas > 0) {
    document.getElementById('sectionDados').classList.remove('hidden');
  }
}

/**
 * @swagger
 * Exibe estatísticas
 */
function exibirEstatisticas() {
  const stats = resultadoValidacao.estatisticas;
  
  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalArquivos}</div>
      <div class="stat-label">Total de Arquivos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.arquivosProcessados}</div>
      <div class="stat-label">Arquivos Processados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.arquivosComErro}</div>
      <div class="stat-label">Arquivos com Erro</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalLinhasValidas}</div>
      <div class="stat-label">Linhas Válidas</div>
    </div>
  `;
}

/**
 * @swagger
 * Exibe status por arquivo
 */
function exibirStatus() {
  const tbody = tableStatus.querySelector('tbody');
  tbody.innerHTML = '';
  
  resultadoValidacao.statusPorArquivo.forEach(status => {
    const tr = document.createElement('tr');
    
    let statusClass = 'status-success';
    if (status.problemas > 0 || status.status !== 'LD Contabilizada') {
      statusClass = 'status-error';
    }
    
    tr.innerHTML = `
      <td>${status.nomeArquivo}</td>
      <td><span class="status-badge ${statusClass}">${status.status}</span></td>
      <td>${status.totalLinhas}</td>
      <td>${status.linhasValidas}</td>
      <td>${status.linhasIncompletas}</td>
    `;
    
    tbody.appendChild(tr);
  });
}

/**
 * @swagger
 * Exibe problemas identificados
 */
function exibirProblemas() {
  problemsList.innerHTML = '';
  
  resultadoValidacao.problemas.forEach(problema => {
    const li = document.createElement('li');
    li.className = problema.tipo.includes('Erro') ? 'error' : '';
    
    li.innerHTML = `
      <div class="problem-type">${problema.tipo}</div>
      <div class="problem-message"><strong>Arquivo:</strong> ${problema.arquivo}</div>
      <div class="problem-message">${problema.mensagem}</div>
    `;
    
    problemsList.appendChild(li);
  });
}

/**
 * @swagger
 * Exibe dados processados
 */
function exibirDados() {
  const tbody = tableDados.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Consolidar todos os dados
  const todosDados = [];
  resultadosProcessamento.forEach(resultado => {
    if (resultado.dados && resultado.dados.length > 0) {
      resultado.dados.forEach(linha => {
        if (validarLinha(linha).valida) {
          todosDados.push({
            ...linha,
            Arquivo: resultado.nomeArquivo,
            LD: resultado.ld || '',
            Revisao: resultado.revisao || ''
          });
        }
      });
    }
  });
  
  todosDados.forEach(linha => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${linha.Arquivo || ''}</td>
      <td>${linha.LD || ''}</td>
      <td>${linha.Revisao || ''}</td>
      <td>${linha['NO VALE'] || ''}</td>
      <td>${linha['PREVISTO'] || ''}</td>
      <td>${linha['PREVISTO 1'] || ''}</td>
      <td>${linha['PREVISTO 2'] || ''}</td>
      <td>${linha['REPROGRAMADO'] || linha['REPROGRAMADO 1'] || linha['REPROGRAMADO 2'] || ''}</td>
      <td>${linha['FORMATO'] || ''}</td>
      <td>${linha['PAGS/ FOLHAS'] || ''}</td>
      <td>${linha['Disciplina'] || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * @swagger
 * Exporta resultados
 */
function exportarResultados() {
  if (!resultadoValidacao) {
    alert('Nenhum resultado para exportar. Processe os arquivos primeiro.');
    return;
  }
  
  // Consolidar todos os dados válidos
  const todosDados = [];
  resultadosProcessamento.forEach(resultado => {
    if (resultado.dados && resultado.dados.length > 0) {
      resultado.dados.forEach(linha => {
        if (validarLinha(linha).valida) {
          todosDados.push({
            ...linha,
            Arquivo: resultado.nomeArquivo,
            LD: resultado.ld || '',
            Revisao: resultado.revisao || ''
          });
        }
      });
    }
  });
  
  const formato = exportFormat.value;
  const nomeArquivo = `dados_processados_${new Date().toISOString().split('T')[0]}`;
  
  exportarDadosConsolidados(resultadoValidacao, todosDados, formato, nomeArquivo);
}

/**
 * @swagger
 * Limpa tudo e reseta a interface
 */
function limparTudo() {
  arquivosSelecionados = [];
  resultadosProcessamento = [];
  resultadoValidacao = null;
  
  fileInput.value = '';
  atualizarInterfaceUpload();
  btnProcessar.disabled = true;
  progressContainer.classList.remove('active');
  
  // Ocultar seções
  document.getElementById('sectionEstatisticas').classList.add('hidden');
  document.getElementById('sectionStatus').classList.add('hidden');
  document.getElementById('sectionProblemas').classList.add('hidden');
  document.getElementById('sectionDados').classList.add('hidden');
  document.getElementById('sectionExportacao').classList.add('hidden');
  
  // Limpar tabelas
  tableStatus.querySelector('tbody').innerHTML = '';
  tableDados.querySelector('tbody').innerHTML = '';
  problemsList.innerHTML = '';
  statsGrid.innerHTML = '';
}
