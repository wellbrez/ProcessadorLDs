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
let indiceCSVGerencial = null;
let resultadoPosProcessamento = null;

// Tornar resultadoPosProcessamento acessível globalmente para exportação
if (typeof window !== 'undefined') {
  window.resultadoPosProcessamento = null;
}

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

// Elementos DOM - Pós-Processamento
const uploadCSVArea = document.getElementById('uploadCSVArea');
const csvInput = document.getElementById('csvInput');
const btnPosProcessar = document.getElementById('btnPosProcessar');
const posProcessamentoResultados = document.getElementById('posProcessamentoResultados');
const posStatsGrid = document.getElementById('posStatsGrid');
const tableDiscrepancias = document.getElementById('tableDiscrepancias');
const discrepanciasContainer = document.getElementById('discrepanciasContainer');
const csvLoadingStatus = document.getElementById('csvLoadingStatus');
const csvLoadingDetails = document.getElementById('csvLoadingDetails');

// Verificar se elementos existem (podem não existir se HTML não foi carregado ainda)
if (!csvLoadingStatus || !csvLoadingDetails) {
  // Elementos serão buscados novamente quando necessário
}

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
btnProcessar.addEventListener('click', processarArquivos);
btnLimpar.addEventListener('click', limparTudo);
btnExportar.addEventListener('click', exportarResultados);

// Event Listeners - Pós-Processamento
if (uploadCSVArea) {
  uploadCSVArea.addEventListener('click', () => csvInput.click());
}
if (csvInput) {
  csvInput.addEventListener('change', handleCSVSelect);
}
if (btnPosProcessar) {
  btnPosProcessar.addEventListener('click', executarPosProcessamento);
}

// Event Listener para exportação do pós-processamento
const btnExportarPosProcessamento = document.getElementById('btnExportarPosProcessamento');
const exportPosProcessamentoFormat = document.getElementById('exportPosProcessamentoFormat');
if (btnExportarPosProcessamento) {
  btnExportarPosProcessamento.addEventListener('click', exportarPosProcessamento);
}

// Event Listeners para Dashboard (será executado quando DOM estiver pronto)
function inicializarEventListenersDashboard() {
  // Tabs do dashboard
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      alternarAbaDashboard(tabName);
    });
  });
  
  // Filtros do dashboard
  const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
  const btnLimparFiltros = document.getElementById('btnLimparFiltros');
  
  if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener('click', aplicarFiltrosDashboard);
  }
  if (btnLimparFiltros) {
    btnLimparFiltros.addEventListener('click', limparFiltrosDashboard);
  }
  
  // Event listeners para botões de toggle período (Mensal/Semanal)
  inicializarTogglePeriodo();
}

/**
 * @swagger
 * Inicializa os event listeners para os botões de toggle de período (Mensal/Semanal)
 */
function inicializarTogglePeriodo() {
  // Toggle para gráfico Evolução de Documentos por Período (Gantt)
  const btnGanttMensal = document.getElementById('btnGanttMensal');
  const btnGanttSemanal = document.getElementById('btnGanttSemanal');
  
  if (btnGanttMensal && btnGanttSemanal) {
    btnGanttMensal.addEventListener('click', () => alternarPeriodoGrafico('gantt', 'mensal'));
    btnGanttSemanal.addEventListener('click', () => alternarPeriodoGrafico('gantt', 'semanal'));
  }
  
  // Toggle para gráfico Acúmulo de Documentos
  const btnAcumuloMensal = document.getElementById('btnAcumuloMensal');
  const btnAcumuloSemanal = document.getElementById('btnAcumuloSemanal');
  
  if (btnAcumuloMensal && btnAcumuloSemanal) {
    btnAcumuloMensal.addEventListener('click', () => alternarPeriodoGrafico('acumulo', 'mensal'));
    btnAcumuloSemanal.addEventListener('click', () => alternarPeriodoGrafico('acumulo', 'semanal'));
  }
  
  // Toggle para gráfico Acúmulo de Certificação
  const btnAcumuloCertMensal = document.getElementById('btnAcumuloCertMensal');
  const btnAcumuloCertSemanal = document.getElementById('btnAcumuloCertSemanal');
  
  if (btnAcumuloCertMensal && btnAcumuloCertSemanal) {
    btnAcumuloCertMensal.addEventListener('click', () => alternarPeriodoGrafico('acumuloCert', 'mensal'));
    btnAcumuloCertSemanal.addEventListener('click', () => alternarPeriodoGrafico('acumuloCert', 'semanal'));
  }
}

/**
 * @swagger
 * Alterna o período de um gráfico entre mensal e semanal
 * @param {string} grafico - Nome do gráfico ('gantt', 'acumulo', 'acumuloCert')
 * @param {string} periodo - 'mensal' ou 'semanal'
 */
function alternarPeriodoGrafico(grafico, periodo) {
  // Verificar se há dados disponíveis
  if (!resultadoPosProcessamento || !resultadosProcessamento) {
    console.warn('Dados não disponíveis para atualizar gráfico');
    return;
  }
  
  // Atualizar configuração global (se disponível no dashboard.js)
  if (typeof configPeriodoGraficos !== 'undefined') {
    configPeriodoGraficos[grafico] = periodo;
  }
  
  // Atualizar estilo dos botões
  const mapeamentoBotoes = {
    'gantt': { mensal: 'btnGanttMensal', semanal: 'btnGanttSemanal' },
    'acumulo': { mensal: 'btnAcumuloMensal', semanal: 'btnAcumuloSemanal' },
    'acumuloCert': { mensal: 'btnAcumuloCertMensal', semanal: 'btnAcumuloCertSemanal' }
  };
  
  const botoes = mapeamentoBotoes[grafico];
  if (botoes) {
    const btnMensal = document.getElementById(botoes.mensal);
    const btnSemanal = document.getElementById(botoes.semanal);
    
    if (btnMensal && btnSemanal) {
      if (periodo === 'mensal') {
        btnMensal.classList.add('active');
        btnMensal.style.background = 'var(--color-primary)';
        btnMensal.style.color = 'white';
        btnSemanal.classList.remove('active');
        btnSemanal.style.background = 'white';
        btnSemanal.style.color = 'var(--color-primary)';
      } else {
        btnSemanal.classList.add('active');
        btnSemanal.style.background = 'var(--color-primary)';
        btnSemanal.style.color = 'white';
        btnMensal.classList.remove('active');
        btnMensal.style.background = 'white';
        btnMensal.style.color = 'var(--color-primary)';
      }
    }
  }
  
  // Preparar dados mesclados e filtrados
  const coletarFiltro = typeof coletarValoresFiltro === 'function' 
    ? coletarValoresFiltro 
    : function(select) {
        if (!select) return null;
        const values = Array.from(select.selectedOptions).map(o => o.value).filter(v => v);
        const temTodos = Array.from(select.selectedOptions).some(o => o.value === '');
        return (temTodos || values.length === 0) ? null : values;
      };
  
  const filtros = {
    projetos: coletarFiltro(document.getElementById('filterProjeto')),
    empresas: coletarFiltro(document.getElementById('filterEmpresa')),
    lds: coletarFiltro(document.getElementById('filterLD')),
    disciplinas: coletarFiltro(document.getElementById('filterDisciplina')),
    formatos: coletarFiltro(document.getElementById('filterFormato')),
    dataInicio: document.getElementById('filterDataInicio')?.value || null,
    dataFim: document.getElementById('filterDataFim')?.value || null
  };
  
  if (typeof prepararDadosMesclados === 'function' && typeof aplicarFiltros === 'function') {
    const dadosMesclados = prepararDadosMesclados(resultadosProcessamento, resultadoPosProcessamento);
    const dadosFiltrados = aplicarFiltros(dadosMesclados, filtros);
    
    // Atualizar apenas o gráfico específico
    switch (grafico) {
      case 'gantt':
        if (typeof criarGraficoGantt === 'function') {
          criarGraficoGantt(dadosFiltrados, periodo);
        }
        break;
      case 'acumulo':
        if (typeof criarGraficoAreaAcumulo === 'function') {
          criarGraficoAreaAcumulo(dadosFiltrados, periodo);
        }
        break;
      case 'acumuloCert':
        if (typeof criarGraficoAreaAcumuloCertificacao === 'function') {
          criarGraficoAreaAcumuloCertificacao(dadosFiltrados, periodo);
        }
        break;
    }
  }
}

// Executar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarEventListenersDashboard);
} else {
  inicializarEventListenersDashboard();
}

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
  // Garantir que a barra esteja visível
  if (progressContainer) {
    progressContainer.classList.add('active');
    progressContainer.style.display = 'block';
  }
  
  // Atualizar largura da barra
  if (progressFill) {
    progressFill.style.width = `${Math.max(0, Math.min(100, percentual))}%`;
    
    // Atualizar texto - mostrar percentual e descrição
    const percentualTexto = `${Math.round(percentual)}%`;
    const textoCompleto = texto 
      ? `${percentualTexto} - ${texto}` 
      : percentualTexto;
    
    progressFill.textContent = textoCompleto;
    
    // Adicionar título para tooltip (útil para textos longos)
    progressFill.title = textoCompleto;
  }
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
  
  // Mostrar seção de pós-processamento
  const sectionPosProcessamento = document.getElementById('sectionPosProcessamento');
  if (sectionPosProcessamento) {
    sectionPosProcessamento.classList.remove('hidden');
  }
  
  if (resultadoValidacao.problemas.length > 0) {
    document.getElementById('sectionProblemas').classList.remove('hidden');
  }
  
  // Tabela de dados processados fica oculta por padrão
  // if (resultadoValidacao.estatisticas.totalLinhasValidas > 0) {
  //   document.getElementById('sectionDados').classList.remove('hidden');
  // }
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
    
    // Buscar informações detalhadas do ProcessarNomeERevisao e processamento
    const resultado = resultadosProcessamento.find(r => r.nomeArquivo === status.nomeArquivo);
    const infoProcessarNomeERevisao = resultado?.processarNomeERevisao;
    const detalhesProcessamento = resultado?.detalhesProcessamento;
    
    // Verificar inconsistências do pós-processamento
    let temInconsistenciasPosProcessamento = false;
    let badgeInconsistencias = '';
    if (resultadoPosProcessamento && resultadoPosProcessamento.resultados) {
      const resultadosArquivo = resultadoPosProcessamento.resultados.filter(r => 
        r.arquivo === status.nomeArquivo || r.ld === infoProcessarNomeERevisao?.ldFinal
      );
      
      if (resultadosArquivo.length > 0) {
        const valesNaoEncontrados = resultadosArquivo.filter(r => !r.encontradoNoCSV).length;
        const discrepanciasData = resultadosArquivo.filter(r => 
          r.comparacaoData.iguais === false && r.comparacaoData.diferenca !== null
        ).length;
        
        if (valesNaoEncontrados > 0) {
          statusClass = 'status-error';
          temInconsistenciasPosProcessamento = true;
          badgeInconsistencias += ` <span style="color: var(--color-error); font-size: 0.9em;" title="${valesNaoEncontrados} vale(s) não encontrado(s) no CSV">❌ ${valesNaoEncontrados}</span>`;
        } else if (discrepanciasData > 0) {
          if (statusClass === 'status-success') {
            statusClass = 'status-warning';
          }
          temInconsistenciasPosProcessamento = true;
          badgeInconsistencias += ` <span style="color: var(--color-warning); font-size: 0.9em;" title="${discrepanciasData} discrepância(s) de data">⚠️ ${discrepanciasData}</span>`;
        }
      }
    }
    
    // Criar botão para abrir modal de detalhes
    let btnToggleHtml = '';
    if (infoProcessarNomeERevisao) {
      btnToggleHtml = '<button class="btn-toggle-detalhes">Ver Detalhes</button>';
    }
    
    tr.innerHTML = `
      <td>
        <div style="font-weight: 500; display: flex; align-items: center; gap: 12px;">
          <span>${status.nomeArquivo}</span>
          ${btnToggleHtml}
        </div>
      </td>
      <td>
        <span class="status-badge ${statusClass}">${status.status}</span>
        ${badgeInconsistencias}
      </td>
    `;
    
    // Adicionar evento para abrir modal com detalhes
    const btnToggle = tr.querySelector('.btn-toggle-detalhes');
    if (btnToggle && infoProcessarNomeERevisao) {
      btnToggle.addEventListener('click', function() {
        abrirModalDetalhes(status.nomeArquivo, infoProcessarNomeERevisao, detalhesProcessamento);
      });
    }
    
    tbody.appendChild(tr);
  });
}

/**
 * @swagger
 * Abre modal com detalhes do processamento
 */
function abrirModalDetalhes(nomeArquivo, infoProcessarNomeERevisao, detalhesProcessamento) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');
  const modalTitle = document.querySelector('.modal-title');
  
  // Atualizar título do modal
  modalTitle.textContent = `Detalhes: ${nomeArquivo}`;
  
  // Verificar se há inconsistência nas LDs
  const ldsValoresUnicos = infoProcessarNomeERevisao.ldsEncontradas.length > 1
    ? [...new Set(infoProcessarNomeERevisao.ldsEncontradas.map(l => l.valor))]
    : [];
  const temInconsistenciaLD = ldsValoresUnicos.length > 1;
  
  // Verificar se há inconsistência nas Revisões
  const revsValoresUnicos = infoProcessarNomeERevisao.revisoesEncontradas.length > 1
    ? [...new Set(infoProcessarNomeERevisao.revisoesEncontradas.map(r => r.valor))]
    : [];
  const temInconsistenciaRevisao = revsValoresUnicos.length > 1;
  
  // Construir conteúdo do modal
  const ldsInfo = infoProcessarNomeERevisao.ldsEncontradas.length > 0 
    ? infoProcessarNomeERevisao.ldsEncontradas.map(ld => {
        const cor = temInconsistenciaLD ? 'error' : 'success';
        return `<li><span class="${cor}">${ld.fonte}: <strong>${ld.valor}</strong></span></li>`;
      }).join('')
    : '<li>Nenhuma LD encontrada</li>';
  const revsInfo = infoProcessarNomeERevisao.revisoesEncontradas.length > 0
    ? infoProcessarNomeERevisao.revisoesEncontradas.map(rev => {
        const cor = temInconsistenciaRevisao ? 'error' : 'success';
        return `<li><span class="${cor}">${rev.fonte}: <strong>${rev.valor}</strong></span></li>`;
      }).join('')
    : '<li>Nenhuma revisão encontrada</li>';
  
  // Adicionar aviso se houver inconsistência
  let avisoInconsistencia = '';
  if (temInconsistenciaLD || temInconsistenciaRevisao) {
    const avisos = [];
    if (temInconsistenciaLD) {
      avisos.push('⚠️ <strong>Inconsistência de LD:</strong> Valores diferentes encontrados nas fontes.');
    }
    if (temInconsistenciaRevisao) {
      avisos.push('⚠️ <strong>Inconsistência de Revisão:</strong> Valores diferentes encontrados nas fontes.');
    }
    avisoInconsistencia = `
      <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-left: 4px solid var(--color-warning); border-radius: 4px;">
        ${avisos.join('<br>')}
      </div>
    `;
  }
  
  let detalhesProcessamentoHtml = '';
  if (detalhesProcessamento) {
    const colunasObrigatoriasInfo = `${detalhesProcessamento.colunasObrigatoriasEncontradas} / ${detalhesProcessamento.totalColunasObrigatorias}`;
    const colunasObrigatoriasClass = detalhesProcessamento.colunasObrigatoriasEncontradas === detalhesProcessamento.totalColunasObrigatorias ? 'success' : 'warning';
    
    let colunasAdicionaisHtml = '';
    if (detalhesProcessamento.colunasAdicionais && detalhesProcessamento.colunasAdicionais.length > 0) {
      colunasAdicionaisHtml = `
        <div class="colunas-adicionais-box">
          <div class="detalhes-item-label">Colunas Adicionais (${detalhesProcessamento.colunasAdicionais.length})</div>
          <div class="colunas-adicionais-tags">
            ${detalhesProcessamento.colunasAdicionais.map(col => `<span class="colunas-adicionais-tag">${col}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    const percentualClass = detalhesProcessamento.percentualValidas >= 90 ? 'success' : detalhesProcessamento.percentualValidas >= 50 ? 'warning' : 'error';
    const totalLinhas = detalhesProcessamento.linhasValidas + detalhesProcessamento.linhasInvalidas;
    
    detalhesProcessamentoHtml = `
      <div class="detalhes-section">
        <div class="detalhes-section-title">📊 Estatísticas de Processamento</div>
        <div class="detalhes-grid">
          <div class="detalhes-item">
            <div class="detalhes-item-label">Colunas Processadas</div>
            <div class="detalhes-item-value">
              <span class="${colunasObrigatoriasClass}">${colunasObrigatoriasInfo}</span>
              ${detalhesProcessamento.colunasObrigatoriasFaltando && detalhesProcessamento.colunasObrigatoriasFaltando.length > 0 
                ? `<br><small style="color: var(--color-error); font-size: 0.85em;">Faltando: ${detalhesProcessamento.colunasObrigatoriasFaltando.join(', ')}</small>` 
                : ''}
            </div>
          </div>
          <div class="detalhes-item">
            <div class="detalhes-item-label">Total de Linhas</div>
            <div class="detalhes-item-value">${totalLinhas}</div>
          </div>
          <div class="detalhes-item">
            <div class="detalhes-item-label">Linhas Válidas</div>
            <div class="detalhes-item-value"><span class="success">${detalhesProcessamento.linhasValidas}</span></div>
          </div>
          <div class="detalhes-item">
            <div class="detalhes-item-label">Linhas Inválidas</div>
            <div class="detalhes-item-value"><span class="error">${detalhesProcessamento.linhasInvalidas}</span></div>
          </div>
          <div class="detalhes-item">
            <div class="detalhes-item-label">Percentual de Validade</div>
            <div class="detalhes-item-value"><span class="${percentualClass}">${detalhesProcessamento.percentualValidas}%</span></div>
          </div>
        </div>
        ${colunasAdicionaisHtml}
      </div>
    `;
  }
  
  // Tabela de linhas com erro
  let tabelaErrosHtml = '';
  if (detalhesProcessamento && detalhesProcessamento.linhasComErro && detalhesProcessamento.linhasComErro.length > 0) {
    const colunasObrigatorias = ['NO VALE', 'PREVISTO', 'PREVISTO 1', 'PREVISTO 2', 'FORMATO', 'PAGS/ FOLHAS', 'Disciplina', 'DataPrevisto'];
    
    tabelaErrosHtml = `
      <div class="detalhes-section tabela-erros-container">
        <div class="tabela-erros-header">
          ❌ Linhas com Erro (${detalhesProcessamento.linhasComErro.length}${detalhesProcessamento.linhasComErro.length >= 100 ? '+' : ''})
        </div>
        <div class="tabela-erros-wrapper">
          <table class="tabela-erros">
            <thead>
              <tr>
                <th>Linha</th>
                ${colunasObrigatorias.map(col => `<th>${col}</th>`).join('')}
                <th>Erros</th>
              </tr>
            </thead>
            <tbody>
              ${detalhesProcessamento.linhasComErro.map(linhaErro => {
                const camposComErroSet = new Set(linhaErro.camposComErro);
                const temErros = linhaErro.erros.length > 0;
                return `
                  <tr class="${temErros ? 'erro-linha' : ''}">
                    <td style="font-weight: 600;">${linhaErro.numeroLinha}</td>
                    ${colunasObrigatorias.map(col => {
                      const valor = linhaErro.dados[col];
                      const temErro = camposComErroSet.has(col);
                      let displayValor = '';
                      let classes = '';
                      
                      if (valor === null || valor === undefined) {
                        displayValor = '(null)';
                        classes = 'celula-erro-null';
                      } else if (valor === '') {
                        displayValor = '(vazio)';
                        classes = 'celula-erro-null';
                      } else if (valor instanceof Date) {
                        displayValor = valor.toLocaleDateString('pt-BR');
                      } else {
                        const strValor = String(valor);
                        displayValor = strValor.length > 30 ? strValor.substring(0, 30) + '...' : strValor;
                      }
                      
                      if (temErro) {
                        classes += ' celula-erro';
                      }
                      
                      return `<td class="${classes}">${displayValor}</td>`;
                    }).join('')}
                    <td>
                      <ul class="lista-erros">
                        ${linhaErro.erros.map(erro => `<li>${erro}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  // Seção de inconsistências do pós-processamento
  let inconsistenciasPosProcessamentoHtml = '';
  if (resultadoPosProcessamento && resultadoPosProcessamento.resultados) {
    // Filtrar resultados por arquivo/LD
    const resultadosArquivo = resultadoPosProcessamento.resultados.filter(r => 
      r.arquivo === nomeArquivo || r.ld === infoProcessarNomeERevisao.ldFinal
    );
    
    if (resultadosArquivo.length > 0) {
      const valesNaoEncontrados = resultadosArquivo.filter(r => !r.encontradoNoCSV);
      const valesNaoEmitidos = resultadosArquivo.filter(r => r.encontradoNoCSV && !r.emitido);
      const discrepanciasData = resultadosArquivo.filter(r => 
        r.comparacaoData.iguais === false && r.comparacaoData.diferenca !== null
      );
      
      const temInconsistencias = valesNaoEncontrados.length > 0 || 
                                 valesNaoEmitidos.length > 0 || 
                                 discrepanciasData.length > 0;
      
      if (temInconsistencias) {
        let inconsistenciasLista = [];
        
        if (valesNaoEncontrados.length > 0) {
          inconsistenciasLista.push(`
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: var(--color-error); font-size: 1.2em;">❌</span>
                <strong style="color: var(--color-error);">Vales Não Encontrados no CSV (${valesNaoEncontrados.length})</strong>
              </div>
              <ul style="margin-left: 24px; color: var(--color-text);">
                ${valesNaoEncontrados.slice(0, 10).map(r => `<li>${r.noVale || 'N/A'}</li>`).join('')}
                ${valesNaoEncontrados.length > 10 ? `<li><em>... e mais ${valesNaoEncontrados.length - 10} vales</em></li>` : ''}
              </ul>
            </div>
          `);
        }
        
        if (valesNaoEmitidos.length > 0) {
          inconsistenciasLista.push(`
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: var(--color-warning); font-size: 1.2em;">⚠️</span>
                <strong style="color: var(--color-warning);">Vales Não Emitidos (${valesNaoEmitidos.length})</strong>
              </div>
              <ul style="margin-left: 24px; color: var(--color-text);">
                ${valesNaoEmitidos.slice(0, 10).map(r => `<li>${r.noVale || 'N/A'}</li>`).join('')}
                ${valesNaoEmitidos.length > 10 ? `<li><em>... e mais ${valesNaoEmitidos.length - 10} vales</em></li>` : ''}
              </ul>
            </div>
          `);
        }
        
        if (discrepanciasData.length > 0) {
          inconsistenciasLista.push(`
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: var(--color-warning); font-size: 1.2em;">⚠️</span>
                <strong style="color: var(--color-warning);">Discrepâncias de Data (${discrepanciasData.length})</strong>
              </div>
              <ul style="margin-left: 24px; color: var(--color-text);">
                ${discrepanciasData.slice(0, 10).map(r => {
                  const diferenca = r.comparacaoData.diferenca;
                  const sinal = diferenca > 0 ? '+' : '';
                  return `<li>${r.noVale || 'N/A'}: Diferença de ${sinal}${diferenca} dias</li>`;
                }).join('')}
                ${discrepanciasData.length > 10 ? `<li><em>... e mais ${discrepanciasData.length - 10} discrepâncias</em></li>` : ''}
              </ul>
            </div>
          `);
        }
        
        inconsistenciasPosProcessamentoHtml = `
          <div class="detalhes-section" style="border-left: 4px solid var(--color-warning); background: #fff3cd20;">
            <div class="detalhes-section-title">🔍 Inconsistências do Pós-Processamento</div>
            <div style="padding: 12px;">
              ${inconsistenciasLista.join('')}
            </div>
          </div>
        `;
      } else {
        inconsistenciasPosProcessamentoHtml = `
          <div class="detalhes-section" style="border-left: 4px solid var(--color-success); background: #d4edda20;">
            <div class="detalhes-section-title">✅ Validação do Pós-Processamento</div>
            <div style="padding: 12px; color: var(--color-success);">
              <strong>Todos os vales foram validados com sucesso!</strong>
              <ul style="margin-top: 8px; margin-left: 24px;">
                <li>✓ Todos os vales encontrados no CSV</li>
                <li>✓ Todos os vales emitidos (PrimEmissao)</li>
                <li>✓ Nenhuma discrepância de data</li>
              </ul>
            </div>
          </div>
        `;
      }
    }
  }
  
  // Montar conteúdo completo
  const conteudoModal = `
    <div class="processar-nome-revisao-detalhes">
      <div class="detalhes-content">
        <div class="detalhes-section">
          <div class="detalhes-section-title">🔍 Identificação da LD</div>
          <div class="detalhes-grid">
            <div class="detalhes-item">
              <div class="detalhes-item-label">LD Final</div>
              <div class="detalhes-item-value">
                <span class="${infoProcessarNomeERevisao.ldFinal ? 'success' : 'error'}">
                  ${infoProcessarNomeERevisao.ldFinal || '(não encontrado)'}
                </span>
              </div>
            </div>
            <div class="detalhes-item">
              <div class="detalhes-item-label">Revisão Final</div>
              <div class="detalhes-item-value">
                <span class="${infoProcessarNomeERevisao.revisaoFinal ? 'success' : 'error'}">
                  ${infoProcessarNomeERevisao.revisaoFinal || '(não encontrada)'}
                </span>
              </div>
            </div>
          </div>
          <div style="margin-top: 16px;">
            <div class="detalhes-item-label" style="margin-bottom: 8px;">Fontes LD encontradas (${infoProcessarNomeERevisao.totalFontesLD})</div>
            <ul class="detalhes-lista">${ldsInfo}</ul>
          </div>
          <div style="margin-top: 16px;">
            <div class="detalhes-item-label" style="margin-bottom: 8px;">Fontes Revisão encontradas (${infoProcessarNomeERevisao.totalFontesRevisao})</div>
            <ul class="detalhes-lista">${revsInfo}</ul>
          </div>
          ${avisoInconsistencia}
        </div>
        ${detalhesProcessamentoHtml}
        ${inconsistenciasPosProcessamentoHtml}
        ${tabelaErrosHtml}
      </div>
    </div>
  `;
  
  modalContent.innerHTML = conteudoModal;
  modalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevenir scroll do body
}

/**
 * @swagger
 * Fecha o modal de detalhes
 */
function fecharModalDetalhes() {
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.style.display = 'none';
  document.body.style.overflow = ''; // Restaurar scroll do body
}

// Event listeners para fechar modal
document.addEventListener('DOMContentLoaded', function() {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  
  if (modalClose) {
    modalClose.addEventListener('click', fecharModalDetalhes);
  }
  
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        fecharModalDetalhes();
      }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modalOverlay.style.display !== 'none') {
        fecharModalDetalhes();
      }
    });
  }
});

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
  // Consolidar todas as linhas com erro de todos os arquivos
  const todasLinhasComErro = [];
  
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
    
    // Coletar linhas com erro do detalhesProcessamento
    if (resultado.detalhesProcessamento && resultado.detalhesProcessamento.linhasComErro) {
      resultado.detalhesProcessamento.linhasComErro.forEach(linhaErro => {
        todasLinhasComErro.push({
          ...linhaErro.dados,
          Arquivo: resultado.nomeArquivo,
          LD: resultado.ld || '',
          Revisao: resultado.revisao || '',
          NumeroLinha: linhaErro.numeroLinha,
          Erros: linhaErro.erros.join('; '),
          CamposComErro: linhaErro.camposComErro.join(', '),
          // Manter referência aos campos com erro para formatação
          _camposComErro: linhaErro.camposComErro
        });
      });
    }
  });
  
  const formato = exportFormat.value;
  const nomeArquivo = `dados_processados_${new Date().toISOString().split('T')[0]}`;
  
  exportarDadosConsolidados(resultadoValidacao, todosDados, formato, nomeArquivo, todasLinhasComErro);
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
  
  // Limpar pós-processamento
  indiceCSVGerencial = null;
  resultadoPosProcessamento = null;
  if (typeof window !== 'undefined') {
    window.resultadoPosProcessamento = null;
  }
  if (csvInput) csvInput.value = '';
  if (posProcessamentoResultados) posProcessamentoResultados.classList.add('hidden');
  if (posStatsGrid) posStatsGrid.innerHTML = '';
  if (tableDiscrepancias) tableDiscrepancias.querySelector('tbody').innerHTML = '';
  if (discrepanciasContainer) discrepanciasContainer.classList.add('hidden');
  if (btnPosProcessar) btnPosProcessar.disabled = true;
  if (csvLoadingStatus) csvLoadingStatus.classList.add('hidden');
  if (csvLoadingDetails) csvLoadingDetails.textContent = '';
  if (document.getElementById('sectionPosProcessamento')) {
    document.getElementById('sectionPosProcessamento').classList.add('hidden');
  }
  if (document.getElementById('csvUploadText')) {
    document.getElementById('csvUploadText').textContent = 'Selecione o CSV Gerencial Consolidado';
  }
  
  // Limpar tabelas
  tableStatus.querySelector('tbody').innerHTML = '';
  tableDados.querySelector('tbody').innerHTML = '';
  problemsList.innerHTML = '';
  statsGrid.innerHTML = '';
}

/**
 * @swagger
 * Manipula seleção de arquivo CSV gerencial
 */
async function handleCSVSelect(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) {
    return;
  }
  
  if (!arquivo.name.toLowerCase().endsWith('.csv')) {
    alert('Por favor, selecione um arquivo CSV.');
    csvInput.value = '';
    return;
  }
  
  // Verificar se há LDs processadas
  if (!resultadosProcessamento || resultadosProcessamento.length === 0) {
    alert('Por favor, processe as LDs primeiro antes de carregar o CSV gerencial.');
    csvInput.value = '';
    return;
  }
  
  // Coletar todos os NO VALE das LDs processadas para filtrar o CSV
  atualizarProgresso(0, 'Coletando números de vale das LDs processadas...');
  const valesParaBuscar = coletarValesDasLDs(resultadosProcessamento);
  
  if (valesParaBuscar.size === 0) {
    alert('Nenhum vale válido encontrado nas LDs processadas. Processe as LDs primeiro.');
    csvInput.value = '';
    progressContainer.classList.remove('active');
    return;
  }
  
  // Verificar tamanho do arquivo (apenas informativo)
  const tamanhoMB = arquivo.size / (1024 * 1024);
  const tamanhoGB = arquivo.size / (1024 * 1024 * 1024);
  
  // Aviso informativo para arquivos muito grandes (mas permitir)
  if (tamanhoGB >= 1) {
    const confirmar = confirm(
      `📊 Arquivo grande detectado (${tamanhoGB.toFixed(2)} GB).\n\n` +
      `O sistema irá filtrar apenas os ${valesParaBuscar.size.toLocaleString()} vales presentes nas LDs.\n\n` +
      `Isso reduzirá drasticamente o uso de memória e tempo de processamento.\n\n` +
      `Deseja continuar?`
    );
    
    if (!confirmar) {
      csvInput.value = '';
      progressContainer.classList.remove('active');
      return;
    }
  }
  
  btnPosProcessar.disabled = true;
  
  // Mostrar status de carregamento (buscar elemento se não existir)
  const loadingStatus = document.getElementById('csvLoadingStatus');
  const loadingDetails = document.getElementById('csvLoadingDetails');
  
  if (loadingStatus) {
    loadingStatus.classList.remove('hidden');
  }
  
  // Garantir que a barra de progresso esteja visível
  progressContainer.classList.add('active');
  progressContainer.style.display = 'block';
  
  try {
    const tamanhoTexto = tamanhoGB >= 1 
      ? `${tamanhoGB.toFixed(2)} GB` 
      : `${tamanhoMB.toFixed(2)} MB`;
    
    // Atualizar progresso inicial imediatamente
    const textoInicial = `Iniciando... ${tamanhoTexto} | ${valesParaBuscar.size.toLocaleString()} vales para buscar`;
    atualizarProgresso(0, textoInicial);
    
    if (loadingDetails) {
      loadingDetails.textContent = textoInicial;
    }
    
    // Pequeno delay para garantir que a UI seja atualizada
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const resultado = await carregarCSVGerencial(arquivo, valesParaBuscar, (percentual, texto) => {
      // Atualizar progresso com animação suave
      atualizarProgresso(percentual, texto);
      
      // Atualizar detalhes de carregamento (buscar elemento novamente para garantir)
      const detailsEl = document.getElementById('csvLoadingDetails');
      if (detailsEl) {
        detailsEl.textContent = texto || `${Math.round(percentual)}%`;
      }
    });
    
    indiceCSVGerencial = resultado.indice;
    
    // Salvar metadados do CSV para persistência
    metadadosCSV = {
      nomeArquivo: arquivo.name,
      dataModificacao: arquivo.lastModified ? new Date(arquivo.lastModified).toISOString() : null,
      dataCarregamento: new Date().toISOString(),
      totalLinhas: resultado.totalLinhas,
      valesEncontrados: resultado.valesEncontrados,
      tamanhoBytes: arquivo.size
    };
    
    console.log('📋 Metadados do CSV salvos:', metadadosCSV);
    
    // Atualizar interface com informações detalhadas
    const infoText = resultado.valesEncontrados === resultado.totalValesParaBuscar
      ? `CSV carregado: ${resultado.totalLinhas.toLocaleString()} linhas lidas, ${resultado.linhasProcessadas.toLocaleString()} filtradas, ${resultado.valesEncontrados.toLocaleString()}/${resultado.totalValesParaBuscar.toLocaleString()} vales encontrados (100%)`
      : `CSV carregado: ${resultado.totalLinhas.toLocaleString()} linhas lidas, ${resultado.linhasProcessadas.toLocaleString()} filtradas, ${resultado.valesEncontrados.toLocaleString()}/${resultado.totalValesParaBuscar.toLocaleString()} vales encontrados (${Math.round((resultado.valesEncontrados / resultado.totalValesParaBuscar) * 100)}%)`;
    
    document.getElementById('csvUploadText').textContent = infoText;
    
    // Aviso se nem todos os vales foram encontrados
    if (resultado.valesEncontrados < resultado.totalValesParaBuscar) {
      const valesNaoEncontrados = resultado.totalValesParaBuscar - resultado.valesEncontrados;
      console.warn(`⚠️ ${valesNaoEncontrados} vales das LDs não foram encontrados no CSV gerencial.`);
    }
    
    btnPosProcessar.disabled = false;
    
    atualizarProgresso(100, 'CSV carregado com sucesso!');
    
    const detailsEl = document.getElementById('csvLoadingDetails');
    if (detailsEl) {
      detailsEl.textContent = `✅ Carregado: ${resultado.valesEncontrados}/${resultado.totalValesParaBuscar} vales encontrados`;
    }
    
    // Ocultar status de carregamento após um delay
    setTimeout(() => {
      const statusEl = document.getElementById('csvLoadingStatus');
      if (statusEl) {
        statusEl.classList.add('hidden');
      }
      progressContainer.classList.remove('active');
    }, 2000);
    
  } catch (erro) {
    console.error('Erro ao carregar CSV:', erro);
    
    let mensagemErro = erro.message || 'Erro desconhecido ao carregar CSV';
    
    // Tratar erros específicos de memória
    const tamanhoTexto = tamanhoGB >= 1 
      ? `${tamanhoGB.toFixed(2)} GB` 
      : `${tamanhoMB.toFixed(2)} MB`;
    
    if (mensagemErro.includes('memory') || mensagemErro.includes('Memory') || 
        mensagemErro.includes('out of memory') || mensagemErro.includes('Out of memory')) {
      mensagemErro = 
        `❌ Erro de memória ao processar CSV.\n\n` +
        `O arquivo (${tamanhoTexto}) pode estar excedendo a capacidade do navegador.\n\n` +
        `Soluções:\n` +
        `1. Feche outras abas e aplicações para liberar memória\n` +
        `2. Reinicie o navegador e tente novamente\n` +
        `3. Use um navegador 64-bit com mais memória disponível\n` +
        `4. Se possível, filtre o CSV antes (apenas vales relevantes)\n` +
        `5. Considere dividir o arquivo se o problema persistir\n\n` +
        `Tamanho do arquivo: ${tamanhoTexto}`;
    }
    
    alert(mensagemErro);
    csvInput.value = '';
    progressContainer.classList.remove('active');
    btnPosProcessar.disabled = true;
    
    // Ocultar status de carregamento
    const statusEl = document.getElementById('csvLoadingStatus');
    const detailsEl = document.getElementById('csvLoadingDetails');
    if (statusEl) {
      statusEl.classList.add('hidden');
    }
    if (detailsEl) {
      detailsEl.textContent = '';
    }
    
    // Limpar referências para liberar memória
    indiceCSVGerencial = null;
    if (document.getElementById('csvUploadText')) {
      document.getElementById('csvUploadText').textContent = 'Selecione o CSV Gerencial Consolidado';
    }
  }
}

/**
 * @swagger
 * Processa pós-processamento validando LDs contra CSV gerencial
 */
async function executarPosProcessamento() {
  if (!indiceCSVGerencial) {
    alert('Por favor, carregue o CSV gerencial primeiro.');
    return;
  }
  
  if (!resultadosProcessamento || resultadosProcessamento.length === 0) {
    alert('Por favor, processe as LDs primeiro.');
    return;
  }
  
  btnPosProcessar.disabled = true;
  progressContainer.classList.add('active');
  posProcessamentoResultados.classList.add('hidden');
  
  try {
    atualizarProgresso(0, 'Processando validação...');
    
    // Processar em chunks para não bloquear UI
    setTimeout(() => {
      try {
        // Chamar função do postprocessor.js (que é síncrona e retorna um objeto diretamente)
        // Como postprocessor.js é carregado antes de app.js, a função está no escopo global
        // Verificar se a função existe e não é a função async de app.js (que foi renomeada)
        if (typeof processarPosProcessamento !== 'function') {
          throw new Error('Função processarPosProcessamento não encontrada. Verifique se postprocessor.js foi carregado.');
        }
        
        // Verificar se não é a função async (que tem 0 parâmetros)
        // A função do postprocessor.js tem 3 parâmetros
        if (processarPosProcessamento.length !== 3) {
          throw new Error('Função processarPosProcessamento incorreta. Esperada função com 3 parâmetros do postprocessor.js');
        }
        
        // Chamar a função síncrona do postprocessor.js
        resultadoPosProcessamento = processarPosProcessamento(
          resultadosProcessamento,
          indiceCSVGerencial,
          (percentual, texto) => {
            atualizarProgresso(percentual, texto);
          }
        );
        
        // Verificar se o resultado é uma Promise (não deveria ser, mas verificar por segurança)
        if (resultadoPosProcessamento && typeof resultadoPosProcessamento.then === 'function') {
          console.error('Erro: processarPosProcessamento retornou uma Promise quando deveria retornar um objeto');
          console.error('Tipo do resultado:', typeof resultadoPosProcessamento);
          console.error('Resultado:', resultadoPosProcessamento);
          throw new Error('A função de processamento retornou uma Promise inesperadamente. Verifique se está chamando a função correta.');
        }
        
        // Verificar se o resultado é válido
        if (!resultadoPosProcessamento) {
          throw new Error('Resultado do pós-processamento é inválido');
        }
        
        // Garantir que resultados seja um array
        if (!Array.isArray(resultadoPosProcessamento.resultados)) {
          console.error('Resultado inválido:', resultadoPosProcessamento);
          // Se não é array, tentar criar um array vazio
          if (resultadoPosProcessamento && typeof resultadoPosProcessamento === 'object') {
            resultadoPosProcessamento.resultados = [];
          } else {
            throw new Error('Resultado do pós-processamento não é um objeto válido');
          }
        }
        
        // Tornar acessível globalmente para exportação
        if (typeof window !== 'undefined') {
          window.resultadoPosProcessamento = resultadoPosProcessamento;
        }
        
        // Exibir resultados
        exibirResultadosPosProcessamento();
        
        atualizarProgresso(100, 'Validação concluída!');
        
        // Salvar dados automaticamente após um pequeno delay para garantir que tudo está pronto
        setTimeout(() => {
          salvarDadosPosProcessamento();
        }, 500);
        
        setTimeout(() => {
          progressContainer.classList.remove('active');
        }, 1000);
      } catch (erro) {
        console.error('Erro ao processar pós-processamento:', erro);
        alert(`Erro ao processar validação: ${erro.message}`);
        progressContainer.classList.remove('active');
        btnPosProcessar.disabled = false;
      }
    }, 100);
    
  } catch (erro) {
    console.error('Erro ao processar pós-processamento:', erro);
    alert(`Erro ao processar validação: ${erro.message}`);
    progressContainer.classList.remove('active');
  } finally {
    btnPosProcessar.disabled = false;
  }
}

/**
 * @swagger
 * Exibe resultados do pós-processamento
 */
function exibirResultadosPosProcessamento() {
  if (!resultadoPosProcessamento) {
    return;
  }
  
  // Exibir estatísticas
  exibirEstatisticasPosProcessamento();
  
  // Exibir discrepâncias de data
  exibirDiscrepanciasData();
  
  // Mover conteúdo para a aba de resultados do dashboard
  const posProcessamentoResultadosTab = document.getElementById('posProcessamentoResultadosTab');
  if (posProcessamentoResultadosTab) {
    // Clonar conteúdo
    const statsClone = posStatsGrid ? posStatsGrid.cloneNode(true) : null;
    const exportSection = posProcessamentoResultados ? posProcessamentoResultados.querySelector('.export-section') : null;
    const exportClone = exportSection ? exportSection.cloneNode(true) : null;
    const discrepanciasClone = discrepanciasContainer ? discrepanciasContainer.cloneNode(true) : null;
    
    posProcessamentoResultadosTab.innerHTML = '';
    if (statsClone) posProcessamentoResultadosTab.appendChild(statsClone);
    if (exportClone) posProcessamentoResultadosTab.appendChild(exportClone);
    if (discrepanciasClone) posProcessamentoResultadosTab.appendChild(discrepanciasClone);
    
    // Reatribuir event listeners para botões clonados
    const btnExportarClonado = posProcessamentoResultadosTab.querySelector('#btnExportarPosProcessamento');
    if (btnExportarClonado) {
      btnExportarClonado.addEventListener('click', exportarPosProcessamento);
    }
  }
  
  // Mostrar seção de resultados (original, será ocultada quando dashboard estiver ativo)
  posProcessamentoResultados.classList.remove('hidden');
  
  // Mostrar seção de dashboard
  const sectionDashboard = document.getElementById('sectionDashboard');
  if (sectionDashboard) {
    sectionDashboard.classList.remove('hidden');
  }
  
  // Inicializar dashboard se a aba estiver ativa
  const tabDashboard = document.getElementById('tabDashboard');
  if (tabDashboard && !tabDashboard.classList.contains('hidden')) {
    inicializarDashboard();
  }
}

/**
 * @swagger
 * Exibe estatísticas do pós-processamento
 */
function exibirEstatisticasPosProcessamento() {
  const stats = resultadoPosProcessamento;
  
  posStatsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${stats.totalLinhasProcessadas}</div>
      <div class="stat-label">Total Processado</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.valesEncontrados}</div>
      <div class="stat-label">Vales Encontrados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.valesNaoEncontrados}</div>
      <div class="stat-label">Vales Não Encontrados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.valesEmitidos}</div>
      <div class="stat-label">Vales Emitidos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.discrepânciasData}</div>
      <div class="stat-label">Discrepâncias de Data</div>
    </div>
  `;
}

/**
 * @swagger
 * Exporta resultados do pós-processamento
 */
function exportarPosProcessamento() {
  if (!resultadoPosProcessamento) {
    alert('Nenhum resultado de pós-processamento para exportar. Processe a validação primeiro.');
    return;
  }
  
  const formato = exportPosProcessamentoFormat ? exportPosProcessamentoFormat.value : 'json';
  const nomeArquivo = `pos_processamento_${new Date().toISOString().split('T')[0]}`;
  
  if (typeof exportarPosProcessamentoDados === 'function') {
    exportarPosProcessamentoDados(resultadoPosProcessamento, formato, nomeArquivo);
  } else {
    alert('Função de exportação não disponível. Verifique se exporter.js foi carregado.');
  }
}

/**
 * @swagger
 * Alterna entre abas do dashboard
 * @param {string} tabName - Nome da aba ('resultados' ou 'dashboard')
 */
function alternarAbaDashboard(tabName) {
  const tabResultados = document.getElementById('tabResultados');
  const tabDashboard = document.getElementById('tabDashboard');
  const tabButtons = document.querySelectorAll('.tab-button');
  
  // Atualizar botões
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Mostrar/ocultar conteúdo
  if (tabName === 'resultados') {
    if (tabResultados) {
      tabResultados.classList.remove('hidden');
      tabResultados.classList.add('active');
    }
    if (tabDashboard) {
      tabDashboard.classList.add('hidden');
      tabDashboard.classList.remove('active');
      // Destruir gráficos ao sair do dashboard
      if (typeof destruirGraficos === 'function') {
        destruirGraficos();
      }
    }
    // Mostrar seção original de resultados
    if (posProcessamentoResultados) {
      posProcessamentoResultados.classList.remove('hidden');
    }
  } else if (tabName === 'dashboard') {
    if (tabResultados) {
      tabResultados.classList.remove('hidden');
      tabResultados.classList.add('active');
    }
    if (tabDashboard) {
      tabDashboard.classList.remove('hidden');
      tabDashboard.classList.add('active');
      // Ocultar seção original de resultados
      if (posProcessamentoResultados) {
        posProcessamentoResultados.classList.add('hidden');
      }
      // Inicializar dashboard
      inicializarDashboard();
    }
  }
}

/**
 * @swagger
 * Inicializa o dashboard
 */
function inicializarDashboard() {
  if (!resultadoPosProcessamento || !resultadosProcessamento) {
    console.warn('Dados não disponíveis para dashboard');
    return;
  }
  
  // Preparar dados mesclados
  if (typeof prepararDadosMesclados === 'function') {
    const dadosMesclados = prepararDadosMesclados(resultadosProcessamento, resultadoPosProcessamento);
    
    // Popular filtros
    popularFiltrosDashboard(dadosMesclados);
    
    // Aplicar filtros iniciais e atualizar gráficos
    aplicarFiltrosDashboard();
  } else {
    console.error('Função prepararDadosMesclados não encontrada');
  }
}

/**
 * @swagger
 * Popula os filtros do dashboard com valores disponíveis
 * @param {Array} dadosMesclados - Dados mesclados
 */
function popularFiltrosDashboard(dadosMesclados) {
  const projetos = [...new Set(dadosMesclados.map(d => d.projetoSE).filter(p => p))].sort();
  const empresas = [...new Set(dadosMesclados.map(d => d.empresa).filter(e => e))].sort();
  const lds = [...new Set(dadosMesclados.map(d => d.ld).filter(l => l))].sort();
  const disciplinas = [...new Set(dadosMesclados.map(d => d.disciplina).filter(d => d))].sort();
  const formatos = [...new Set(dadosMesclados.map(d => d.formato).filter(f => f))].sort();
  
  // Popular select de projetos
  const filterProjeto = document.getElementById('filterProjeto');
  if (filterProjeto) {
    filterProjeto.innerHTML = '<option value="">Todos</option>' + 
      projetos.map(p => `<option value="${p}">${p}</option>`).join('');
  }
  
  // Popular select de empresas
  const filterEmpresa = document.getElementById('filterEmpresa');
  if (filterEmpresa) {
    filterEmpresa.innerHTML = '<option value="">Todos</option>' + 
      empresas.map(e => `<option value="${e}">${e}</option>`).join('');
  }
  
  // Popular select de LDs
  const filterLD = document.getElementById('filterLD');
  if (filterLD) {
    filterLD.innerHTML = '<option value="">Todos</option>' + 
      lds.map(l => `<option value="${l}">${l}</option>`).join('');
  }
  
  // Popular select de disciplinas
  const filterDisciplina = document.getElementById('filterDisciplina');
  if (filterDisciplina) {
    filterDisciplina.innerHTML = '<option value="">Todos</option>' + 
      disciplinas.map(d => `<option value="${d}">${d}</option>`).join('');
  }
  
  // Popular select de formatos
  const filterFormato = document.getElementById('filterFormato');
  if (filterFormato) {
    filterFormato.innerHTML = '<option value="">Todos</option>' + 
      formatos.map(f => `<option value="${f}">${f}</option>`).join('');
  }
}

/**
 * @swagger
 * Aplica filtros do dashboard e atualiza gráficos
 */
function aplicarFiltrosDashboard() {
  if (!resultadoPosProcessamento || !resultadosProcessamento) return;
  
  // Coletar valores dos filtros usando função melhorada (se disponível)
  const coletarFiltro = typeof coletarValoresFiltro === 'function' 
    ? coletarValoresFiltro 
    : function(select) {
        if (!select) return null;
        const values = Array.from(select.selectedOptions)
          .map(o => o.value)
          .filter(v => v);
        const temTodos = Array.from(select.selectedOptions).some(o => o.value === '');
        return (temTodos || values.length === 0) ? null : values;
      };
  
  const filtros = {
    projetos: coletarFiltro(document.getElementById('filterProjeto')),
    empresas: coletarFiltro(document.getElementById('filterEmpresa')),
    lds: coletarFiltro(document.getElementById('filterLD')),
    disciplinas: coletarFiltro(document.getElementById('filterDisciplina')),
    formatos: coletarFiltro(document.getElementById('filterFormato')),
    dataInicio: document.getElementById('filterDataInicio')?.value || null,
    dataFim: document.getElementById('filterDataFim')?.value || null
  };
  
  // Preparar dados mesclados
  if (typeof prepararDadosMesclados === 'function' && typeof aplicarFiltros === 'function') {
    const dadosMesclados = prepararDadosMesclados(resultadosProcessamento, resultadoPosProcessamento);
    const dadosFiltrados = aplicarFiltros(dadosMesclados, filtros);
    
    // Mostrar mensagem se nenhum resultado encontrado
    if (dadosFiltrados.length === 0 && dadosMesclados.length > 0) {
      console.warn('Nenhum resultado encontrado com os filtros aplicados');
      // Opcional: mostrar mensagem ao usuário
      const statsContainer = document.getElementById('dashboardStats');
      if (statsContainer) {
        statsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Nenhum resultado encontrado com os filtros aplicados</div>';
      }
    }
    
    // Atualizar gráficos
    if (typeof atualizarTodosGraficos === 'function') {
      atualizarTodosGraficos(dadosFiltrados);
    }
  }
}

/**
 * @swagger
 * Limpa filtros do dashboard
 */
function limparFiltrosDashboard() {
  const filterProjeto = document.getElementById('filterProjeto');
  const filterEmpresa = document.getElementById('filterEmpresa');
  const filterLD = document.getElementById('filterLD');
  const filterDisciplina = document.getElementById('filterDisciplina');
  const filterFormato = document.getElementById('filterFormato');
  const filterDataInicio = document.getElementById('filterDataInicio');
  const filterDataFim = document.getElementById('filterDataFim');
  
  if (filterProjeto) filterProjeto.selectedIndex = 0;
  if (filterEmpresa) filterEmpresa.selectedIndex = 0;
  if (filterLD) filterLD.selectedIndex = 0;
  if (filterDisciplina) filterDisciplina.selectedIndex = 0;
  if (filterFormato) filterFormato.selectedIndex = 0;
  if (filterDataInicio) filterDataInicio.value = '';
  if (filterDataFim) filterDataFim.value = '';
  
  // Reaplicar filtros (vazios)
  aplicarFiltrosDashboard();
}

// Variável global para armazenar metadados do CSV
let metadadosCSV = null;

/**
 * @swagger
 * Otimiza dados do pós-processamento para salvamento
 * Remove dados redundantes e extrai apenas o necessário para regenerar gráficos
 * @param {Object} posProcessamento - Resultado do pós-processamento original
 * @returns {Object} Dados otimizados para salvamento
 */
function otimizarDadosPosProcessamento(posProcessamento) {
  if (!posProcessamento || !posProcessamento.resultados) {
    return posProcessamento;
  }
  
  // Criar cópia otimizada dos resultados
  const resultadosOtimizados = posProcessamento.resultados.map(resultado => {
    // Extrair apenas datas necessárias de linhasCSV
    let dataEmissao = null;
    let dataCertificacao = null;
    
    if (resultado.linhasCSV && Array.isArray(resultado.linhasCSV)) {
      // Encontrar linha com PRIMEMISSAO para data de emissão
      const linhaPrimEmissao = resultado.linhasCSV.find(l => 
        String(l['EMISSAO'] || '').trim().toUpperCase() === 'PRIMEMISSAO'
      );
      if (linhaPrimEmissao) {
        dataEmissao = linhaPrimEmissao['Data GR Rec'] || null;
      }
      
      // Encontrar linha com PRIMCERTIFICACAO para data de certificação
      const linhaPrimCertificacao = resultado.linhasCSV.find(l => 
        l['PRIMCERTIFICACAO'] === true
      );
      if (linhaPrimCertificacao) {
        dataCertificacao = linhaPrimCertificacao['Data GR Rec'] || null;
      }
    }
    
    // Retornar objeto otimizado SEM linhasCSV completo
    return {
      noVale: resultado.noVale,
      arquivo: resultado.arquivo,
      ld: resultado.ld,
      revisao: resultado.revisao,
      encontradoNoCSV: resultado.encontradoNoCSV,
      emitido: resultado.emitido,
      dadosCSV: resultado.dadosCSV, // Manter dados extraídos do CSV
      comparacaoData: resultado.comparacaoData,
      realizado2Original: resultado.realizado2Original,
      // Novos campos pré-calculados (substituem linhasCSV)
      dataEmissaoCSV: dataEmissao,
      dataCertificacaoCSV: dataCertificacao
    };
  });
  
  return {
    totalLinhasProcessadas: posProcessamento.totalLinhasProcessadas,
    valesEncontrados: posProcessamento.valesEncontrados,
    valesNaoEncontrados: posProcessamento.valesNaoEncontrados,
    valesEmitidos: posProcessamento.valesEmitidos,
    valesNaoEmitidos: posProcessamento.valesNaoEmitidos,
    discrepânciasData: posProcessamento.discrepânciasData,
    resultados: resultadosOtimizados
  };
}

/**
 * @swagger
 * Otimiza dados de processamento das LDs para salvamento
 * Remove campos não utilizados nos gráficos
 * @param {Array} processamento - Resultados do processamento das LDs
 * @returns {Array} Dados otimizados para salvamento
 */
function otimizarDadosProcessamento(processamento) {
  if (!processamento || !Array.isArray(processamento)) {
    return processamento;
  }
  
  return processamento.map(resultado => ({
    nomeArquivo: resultado.nomeArquivo,
    ld: resultado.ld,
    revisao: resultado.revisao,
    // Otimizar dados: manter apenas campos necessários para gráficos
    dados: (resultado.dados || []).map(linha => ({
      'NO VALE': linha['NO VALE'],
      'Disciplina': linha['Disciplina'],
      'FORMATO': linha['FORMATO'],
      'DataPrevisto': linha['DataPrevisto'],
      'PREVISTO 2': linha['PREVISTO 2'],
      'REALIZADO 2': linha['REALIZADO 2']
    })),
    // Manter estatísticas básicas
    totalLinhas: resultado.totalLinhas,
    linhasProcessadas: resultado.linhasProcessadas
  }));
}

/**
 * @swagger
 * Lista todas as LDs salvas no localStorage
 * @returns {Array} Array de objetos com informações das LDs salvas
 */
function listarLDsSalvas() {
  const ldsSalvas = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.startsWith('posProcessamento_LD_')) {
      try {
        const dados = JSON.parse(localStorage.getItem(chave));
        const ldNome = chave.replace('posProcessamento_LD_', '').replace(/_/g, '-');
        ldsSalvas.push({
          chave: chave,
          ld: dados.ldEspecifica || ldNome,
          dataProcessamento: dados.dataProcessamento,
          totalDocs: dados.resultadoPosProcessamento?.totalLinhasProcessadas || 0,
          tamanhoKB: (new Blob([localStorage.getItem(chave)]).size / 1024).toFixed(1)
        });
      } catch (e) {
        console.warn('Erro ao ler LD salva:', chave, e);
      }
    }
  }
  
  return ldsSalvas;
}

/**
 * @swagger
 * Salva dados do pós-processamento no navegador
 * @param {string} ldEspecifica - (Opcional) Nome da LD específica para salvar, ou null para salvar todas
 */
function salvarDadosPosProcessamento(ldEspecifica = null) {
  // Verificar dados mínimos necessários (resultadoValidacao é opcional)
  if (!resultadoPosProcessamento || !resultadosProcessamento) {
    const mensagem = 'Dados não disponíveis para salvar. É necessário processar as LDs e realizar o pós-processamento primeiro.';
    console.warn('Dados não disponíveis para salvar:', {
      temPosProcessamento: !!resultadoPosProcessamento,
      temResultadosProcessamento: !!resultadosProcessamento,
      temResultadoValidacao: !!resultadoValidacao
    });
    alert(mensagem);
    return;
  }
  
  try {
    // Filtrar por LD específica se solicitado
    let posProcessamentoParaSalvar = resultadoPosProcessamento;
    let processamentoParaSalvar = resultadosProcessamento;
    
    if (ldEspecifica) {
      // Filtrar resultados da LD específica
      posProcessamentoParaSalvar = {
        ...resultadoPosProcessamento,
        resultados: resultadoPosProcessamento.resultados.filter(r => r.ld === ldEspecifica)
      };
      processamentoParaSalvar = resultadosProcessamento.filter(r => r.ld === ldEspecifica);
    }
    
    // Otimizar dados antes de salvar (remover campos desnecessários)
    const posProcessamentoOtimizado = otimizarDadosPosProcessamento(posProcessamentoParaSalvar);
    const processamentoOtimizado = otimizarDadosProcessamento(processamentoParaSalvar);
    
    // Construir objeto com metadados do CSV
    const infoCSV = {
      nomeArquivo: metadadosCSV?.nomeArquivo || null,
      dataModificacao: metadadosCSV?.dataModificacao || null,
      dataCarregamento: metadadosCSV?.dataCarregamento || new Date().toISOString(),
      totalLinhasCSV: metadadosCSV?.totalLinhas || null,
      valesEncontradosNoCSV: metadadosCSV?.valesEncontrados || null
    };
    
    const dadosParaSalvar = {
      versao: '2.0', // Versão do formato de dados
      dataProcessamento: new Date().toISOString(),
      ldEspecifica: ldEspecifica || null, // Identificar se é salvamento parcial
      infoCSV: infoCSV,
      resultadoPosProcessamento: posProcessamentoOtimizado,
      resultadosProcessamento: processamentoOtimizado,
      resultadoValidacao: resultadoValidacao || null
    };
    
    // Serializar dados
    const dadosSerializados = JSON.stringify(dadosParaSalvar);
    
    // Verificar tamanho (limite do localStorage é ~5-10MB dependendo do navegador)
    const tamanhoBytes = new Blob([dadosSerializados]).size;
    const tamanhoMB = tamanhoBytes / (1024 * 1024);
    const tamanhoKB = tamanhoBytes / 1024;
    
    console.log(`📊 Tamanho dos dados para salvar: ${tamanhoMB >= 1 ? tamanhoMB.toFixed(2) + ' MB' : tamanhoKB.toFixed(2) + ' KB'}`);
    
    if (tamanhoMB > 5) {
      console.warn('Dados muito grandes para salvar no localStorage:', tamanhoMB.toFixed(2), 'MB');
      const continuar = confirm(
        `⚠️ Aviso: Os dados são grandes (${tamanhoMB.toFixed(2)} MB).\n\n` +
        `Limite recomendado: 5 MB.\n\n` +
        `Sugestões:\n` +
        `• Salvar apenas LDs específicas (use o botão "Salvar LD")\n` +
        `• Limpar dados salvos antigos\n\n` +
        `Deseja continuar mesmo assim?`
      );
      if (!continuar) {
        return;
      }
    }
    
    // Definir chave de armazenamento
    const chaveStorage = ldEspecifica 
      ? `posProcessamento_LD_${ldEspecifica.replace(/[^a-zA-Z0-9]/g, '_')}`
      : 'posProcessamento_dados';
    
    // Salvar no localStorage
    localStorage.setItem(chaveStorage, dadosSerializados);
    
    // Atualizar interface
    exibirInfoDadosSalvos();
    verificarDadosSalvosInicio();
    
    // Feedback visual
    const btnSalvar = document.getElementById('btnSalvarDadosAtuais');
    if (btnSalvar) {
      const textoOriginal = btnSalvar.textContent;
      btnSalvar.textContent = '✓ Salvo!';
      btnSalvar.style.backgroundColor = '#28a745';
      setTimeout(() => {
        btnSalvar.textContent = textoOriginal;
        btnSalvar.style.backgroundColor = '';
      }, 2000);
    }
    
    const msgSucesso = ldEspecifica 
      ? `Dados da LD "${ldEspecifica}" salvos com sucesso (${tamanhoKB.toFixed(1)} KB)`
      : `Dados salvos com sucesso (${tamanhoMB >= 1 ? tamanhoMB.toFixed(2) + ' MB' : tamanhoKB.toFixed(1) + ' KB'})`;
    console.log('✅ ' + msgSucesso);
    
  } catch (erro) {
    console.error('Erro ao salvar dados:', erro);
    if (erro.name === 'QuotaExceededError') {
      alert(
        'Erro: Espaço insuficiente no navegador.\n\n' +
        'Sugestões:\n' +
        '• Limpe dados salvos antigos\n' +
        '• Salve apenas LDs específicas\n' +
        '• Use outro navegador com mais espaço'
      );
    } else {
      alert(`Erro ao salvar dados: ${erro.message}`);
    }
  }
}

/**
 * @swagger
 * Reconstrói dados de linhasCSV a partir dos campos otimizados
 * Necessário para compatibilidade com funções que esperam linhasCSV
 * @param {Object} resultado - Resultado otimizado do pós-processamento
 * @returns {Array} Array de linhasCSV reconstruído
 */
function reconstruirLinhasCSV(resultado) {
  const linhasCSV = [];
  
  // Se já tem linhasCSV, usar diretamente
  if (resultado.linhasCSV && Array.isArray(resultado.linhasCSV)) {
    return resultado.linhasCSV;
  }
  
  // Reconstruir a partir dos campos otimizados
  if (resultado.dataEmissaoCSV) {
    linhasCSV.push({
      'Data GR Rec': resultado.dataEmissaoCSV,
      'EMISSAO': 'PRIMEMISSAO',
      'PRIMCERTIFICACAO': false
    });
  }
  
  if (resultado.dataCertificacaoCSV) {
    // Verificar se já adicionamos uma linha com mesma data (emissão = certificação)
    const jaAdicionou = linhasCSV.find(l => 
      l['Data GR Rec'] === resultado.dataCertificacaoCSV && l['EMISSAO'] === 'PRIMEMISSAO'
    );
    
    if (jaAdicionou) {
      // Atualizar a linha existente
      jaAdicionou['PRIMCERTIFICACAO'] = true;
    } else {
      // Adicionar nova linha
      linhasCSV.push({
        'Data GR Rec': resultado.dataCertificacaoCSV,
        'EMISSAO': 'REVISAO',
        'PRIMCERTIFICACAO': true
      });
    }
  }
  
  return linhasCSV;
}

/**
 * @swagger
 * Carrega dados salvos do pós-processamento
 * @param {string} ldEspecifica - (Opcional) Nome da LD específica para carregar, ou null para carregar todos
 */
function carregarDadosPosProcessamento(ldEspecifica = null) {
  try {
    // Determinar chave de armazenamento
    const chaveStorage = ldEspecifica 
      ? `posProcessamento_LD_${ldEspecifica.replace(/[^a-zA-Z0-9]/g, '_')}`
      : 'posProcessamento_dados';
    
    const dadosSalvos = localStorage.getItem(chaveStorage);
    if (!dadosSalvos) {
      if (ldEspecifica) {
        alert(`Nenhum dado salvo encontrado para a LD "${ldEspecifica}".`);
      } else {
        alert('Nenhum dado salvo encontrado.');
      }
      return;
    }
    
    const dados = JSON.parse(dadosSalvos);
    
    // Validar estrutura dos dados
    if (!dados.resultadoPosProcessamento || !dados.resultadosProcessamento) {
      alert('Erro: Dados salvos estão incompletos ou corrompidos.');
      console.error('Dados incompletos:', dados);
      return;
    }
    
    // Verificar versão dos dados e reconstruir linhasCSV se necessário
    if (dados.versao === '2.0') {
      // Dados otimizados - reconstruir linhasCSV para compatibilidade
      dados.resultadoPosProcessamento.resultados = dados.resultadoPosProcessamento.resultados.map(resultado => ({
        ...resultado,
        linhasCSV: reconstruirLinhasCSV(resultado)
      }));
      
      console.log('📊 Dados carregados no formato otimizado (v2.0)');
    } else {
      console.log('📊 Dados carregados no formato original (v1.x)');
    }
    
    // Restaurar dados
    resultadoPosProcessamento = dados.resultadoPosProcessamento;
    resultadosProcessamento = dados.resultadosProcessamento;
    resultadoValidacao = dados.resultadoValidacao || null;
    
    // Restaurar metadados do CSV se disponíveis
    if (dados.infoCSV) {
      metadadosCSV = {
        nomeArquivo: dados.infoCSV.nomeArquivo,
        dataModificacao: dados.infoCSV.dataModificacao,
        dataCarregamento: dados.infoCSV.dataCarregamento,
        totalLinhas: dados.infoCSV.totalLinhasCSV,
        valesEncontrados: dados.infoCSV.valesEncontradosNoCSV
      };
    }
    
    // Tornar global
    if (typeof window !== 'undefined') {
      window.resultadoPosProcessamento = resultadoPosProcessamento;
      window.resultadosProcessamento = resultadosProcessamento;
      if (resultadoValidacao) {
        window.resultadoValidacao = resultadoValidacao;
      }
    }
    
    // Atualizar interface
    exibirResultados();
    exibirResultadosPosProcessamento();
    
    // Garantir que dashboard seja inicializado se necessário
    const sectionDashboard = document.getElementById('sectionDashboard');
    if (sectionDashboard && !sectionDashboard.classList.contains('hidden')) {
      if (typeof inicializarDashboard === 'function') {
        inicializarDashboard();
      }
    }
    
    // Atualizar informações dos dados salvos
    exibirInfoDadosSalvos();
    verificarDadosSalvosInicio();
    
    // Mostrar mensagem de sucesso
    const dataProcessamento = new Date(dados.dataProcessamento);
    const totalDocs = dados.resultadoPosProcessamento?.totalLinhasProcessadas || 0;
    
    let mensagem = `Dados carregados com sucesso!\n\nProcessados em: ${dataProcessamento.toLocaleString('pt-BR')}\nTotal de documentos: ${totalDocs}`;
    
    // Adicionar informações do CSV se disponíveis
    if (dados.infoCSV && dados.infoCSV.nomeArquivo) {
      mensagem += `\n\nCSV utilizado: ${dados.infoCSV.nomeArquivo}`;
      if (dados.infoCSV.dataCarregamento) {
        const dataCSV = new Date(dados.infoCSV.dataCarregamento);
        mensagem += `\nCSV carregado em: ${dataCSV.toLocaleString('pt-BR')}`;
      }
    }
    
    if (ldEspecifica) {
      mensagem = `Dados da LD "${ldEspecifica}" carregados!\n\n` + mensagem.split('\n\n').slice(1).join('\n\n');
    }
    
    alert(mensagem);
    
    console.log('✅ Dados carregados com sucesso do localStorage');
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
    alert(`Erro ao carregar dados salvos: ${erro.message}\n\nOs dados podem estar corrompidos.`);
  }
}

/**
 * @swagger
 * Limpa dados salvos do pós-processamento
 * @param {string} ldEspecifica - (Opcional) Nome da LD específica para limpar, ou null para limpar todos
 */
function limparDadosSalvos(ldEspecifica = null) {
  const mensagem = ldEspecifica 
    ? `Tem certeza que deseja limpar os dados salvos da LD "${ldEspecifica}"?`
    : 'Tem certeza que deseja limpar TODOS os dados salvos? Esta ação não pode ser desfeita.';
  
  if (confirm(mensagem)) {
    try {
      if (ldEspecifica) {
        // Limpar apenas LD específica
        const chave = `posProcessamento_LD_${ldEspecifica.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.removeItem(chave);
        alert(`Dados da LD "${ldEspecifica}" removidos com sucesso.`);
      } else {
        // Limpar dados consolidados
        localStorage.removeItem('posProcessamento_dados');
        
        // Também limpar LDs individuais se desejado
        const ldsSalvas = listarLDsSalvas();
        if (ldsSalvas.length > 0) {
          const limparTodas = confirm(`Existem ${ldsSalvas.length} LDs salvas individualmente. Deseja limpar também?`);
          if (limparTodas) {
            ldsSalvas.forEach(ld => {
              localStorage.removeItem(ld.chave);
            });
            alert(`Dados consolidados e ${ldsSalvas.length} LDs individuais foram removidos.`);
          } else {
            alert('Dados consolidados removidos. LDs individuais mantidas.');
          }
        } else {
          alert('Dados salvos foram removidos com sucesso.');
        }
      }
      
      exibirInfoDadosSalvos();
      verificarDadosSalvosInicio();
    } catch (erro) {
      console.error('Erro ao limpar dados:', erro);
      alert('Erro ao limpar dados salvos.');
    }
  }
}

/**
 * @swagger
 * Abre modal para selecionar LD para salvar individualmente
 */
function abrirSeletorSalvarLD() {
  if (!resultadosProcessamento || resultadosProcessamento.length === 0) {
    alert('Nenhuma LD processada para salvar.');
    return;
  }
  
  // Coletar LDs únicas
  const ldsDisponiveis = [...new Set(resultadosProcessamento.map(r => r.ld).filter(l => l))];
  
  if (ldsDisponiveis.length === 0) {
    alert('Nenhuma LD identificada nos dados processados.');
    return;
  }
  
  // Criar lista de opções
  const opcoes = ldsDisponiveis.map((ld, index) => `${index + 1}. ${ld}`).join('\n');
  
  const escolha = prompt(
    `Selecione a LD para salvar individualmente (digite o número):\n\n${opcoes}\n\n` +
    `(Salvar individualmente permite carregar apenas essa LD depois)`
  );
  
  if (escolha) {
    const indice = parseInt(escolha, 10) - 1;
    if (indice >= 0 && indice < ldsDisponiveis.length) {
      salvarDadosPosProcessamento(ldsDisponiveis[indice]);
    } else {
      alert('Opção inválida.');
    }
  }
}

/**
 * @swagger
 * Abre modal para selecionar LD salva para carregar
 */
function abrirSeletorCarregarLD() {
  const ldsSalvas = listarLDsSalvas();
  
  if (ldsSalvas.length === 0) {
    alert('Nenhuma LD salva individualmente encontrada.');
    return;
  }
  
  // Criar lista de opções
  const opcoes = ldsSalvas.map((ld, index) => {
    const data = new Date(ld.dataProcessamento);
    return `${index + 1}. ${ld.ld} (${ld.totalDocs} docs, ${ld.tamanhoKB} KB - ${data.toLocaleDateString('pt-BR')})`;
  }).join('\n');
  
  const escolha = prompt(
    `Selecione a LD para carregar (digite o número):\n\n${opcoes}\n\n` +
    `Ou digite 0 para carregar os dados consolidados (todas as LDs)`
  );
  
  if (escolha) {
    const indice = parseInt(escolha, 10);
    if (indice === 0) {
      carregarDadosPosProcessamento();
    } else if (indice >= 1 && indice <= ldsSalvas.length) {
      carregarDadosPosProcessamento(ldsSalvas[indice - 1].ld);
    } else {
      alert('Opção inválida.');
    }
  }
}

/**
 * @swagger
 * Abre modal para selecionar LD salva para limpar
 */
function abrirSeletorLimparLD() {
  const ldsSalvas = listarLDsSalvas();
  
  if (ldsSalvas.length === 0) {
    alert('Nenhuma LD salva individualmente encontrada.');
    return;
  }
  
  // Criar lista de opções
  const opcoes = ldsSalvas.map((ld, index) => {
    const data = new Date(ld.dataProcessamento);
    return `${index + 1}. ${ld.ld} (${ld.totalDocs} docs, ${ld.tamanhoKB} KB)`;
  }).join('\n');
  
  const escolha = prompt(
    `Selecione a LD para REMOVER (digite o número):\n\n${opcoes}\n\n` +
    `Ou digite 0 para limpar TODOS os dados (consolidados + LDs individuais)`
  );
  
  if (escolha) {
    const indice = parseInt(escolha, 10);
    if (indice === 0) {
      limparDadosSalvos();
    } else if (indice >= 1 && indice <= ldsSalvas.length) {
      limparDadosSalvos(ldsSalvas[indice - 1].ld);
    } else {
      alert('Opção inválida.');
    }
  }
}

/**
 * @swagger
 * Exibe informações sobre dados salvos
 */
function exibirInfoDadosSalvos() {
  const container = document.getElementById('dadosSalvosContainer');
  const info = document.getElementById('dadosSalvosInfo');
  
  if (!container || !info) return;
  
  try {
    const dadosSalvos = localStorage.getItem('posProcessamento_dados');
    const ldsSalvas = listarLDsSalvas();
    
    if (dadosSalvos || ldsSalvas.length > 0) {
      container.style.display = 'block';
      let htmlInfo = '';
      
      // Informações do salvamento principal
      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        const dataProcessamento = new Date(dados.dataProcessamento);
        const totalDocs = dados.resultadoPosProcessamento?.totalLinhasProcessadas || 0;
        const tamanhoBytes = new Blob([dadosSalvos]).size;
        const tamanhoMB = tamanhoBytes / (1024 * 1024);
        const tamanhoKB = tamanhoBytes / 1024;
        const tamanhoTexto = tamanhoMB >= 1 ? `${tamanhoMB.toFixed(2)} MB` : `${tamanhoKB.toFixed(1)} KB`;
        
        htmlInfo += `
          <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
            <strong style="color: var(--color-primary);">📦 Dados Consolidados</strong><br>
            <strong>Processado em:</strong> ${dataProcessamento.toLocaleString('pt-BR')}<br>
            <strong>Total de documentos:</strong> ${totalDocs}<br>
            <strong>Tamanho:</strong> ${tamanhoTexto}
        `;
        
        // Adicionar informações do CSV se disponíveis (formato v2.0)
        if (dados.infoCSV && dados.infoCSV.nomeArquivo) {
          htmlInfo += `<br><strong>CSV:</strong> ${dados.infoCSV.nomeArquivo}`;
          if (dados.infoCSV.dataCarregamento) {
            const dataCSV = new Date(dados.infoCSV.dataCarregamento);
            htmlInfo += ` <span style="color: #666;">(${dataCSV.toLocaleDateString('pt-BR')})</span>`;
          }
        }
        
        // Indicar versão dos dados
        if (dados.versao) {
          htmlInfo += `<br><span style="color: #999; font-size: 0.85em;">Formato: v${dados.versao}</span>`;
        }
        
        htmlInfo += '</div>';
      }
      
      // Informações das LDs salvas individualmente
      if (ldsSalvas.length > 0) {
        htmlInfo += `
          <div style="margin-top: 8px;">
            <strong style="color: var(--color-primary);">📋 LDs Salvas Individualmente (${ldsSalvas.length})</strong>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
        `;
        
        ldsSalvas.forEach(ld => {
          const dataLD = new Date(ld.dataProcessamento);
          htmlInfo += `<li><strong>${ld.ld}</strong> - ${ld.totalDocs} docs (${ld.tamanhoKB} KB) - ${dataLD.toLocaleDateString('pt-BR')}</li>`;
        });
        
        htmlInfo += '</ul></div>';
      }
      
      info.innerHTML = htmlInfo;
    } else {
      container.style.display = 'none';
    }
  } catch (erro) {
    console.error('Erro ao exibir info de dados salvos:', erro);
    container.style.display = 'none';
  }
}

// Event Listeners para dados salvos
function inicializarEventListenersDadosSalvos() {
  // Botões da seção de pós-processamento (existentes)
  const btnCarregarDadosSalvos = document.getElementById('btnCarregarDadosSalvos');
  const btnSalvarDadosAtuais = document.getElementById('btnSalvarDadosAtuais');
  const btnLimparDadosSalvos = document.getElementById('btnLimparDadosSalvos');
  
  if (btnCarregarDadosSalvos) {
    btnCarregarDadosSalvos.addEventListener('click', () => carregarDadosPosProcessamento());
  }
  if (btnSalvarDadosAtuais) {
    btnSalvarDadosAtuais.addEventListener('click', () => salvarDadosPosProcessamento());
  }
  if (btnLimparDadosSalvos) {
    btnLimparDadosSalvos.addEventListener('click', () => limparDadosSalvos());
  }
  
  // Botões da seção inicial de dados salvos (novos)
  const btnCarregarDadosInicio = document.getElementById('btnCarregarDadosInicio');
  const btnCarregarLDEspecifica = document.getElementById('btnCarregarLDEspecifica');
  const btnLimparDadosInicio = document.getElementById('btnLimparDadosInicio');
  
  if (btnCarregarDadosInicio) {
    btnCarregarDadosInicio.addEventListener('click', () => carregarDadosPosProcessamento());
  }
  if (btnCarregarLDEspecifica) {
    btnCarregarLDEspecifica.addEventListener('click', abrirSeletorCarregarLD);
  }
  if (btnLimparDadosInicio) {
    btnLimparDadosInicio.addEventListener('click', abrirSeletorLimparLD);
  }
  
  // Verificar e exibir dados salvos ao carregar página
  exibirInfoDadosSalvos();
  verificarDadosSalvosInicio();
}

/**
 * @swagger
 * Verifica se há dados salvos e mostra a seção inicial se houver
 */
function verificarDadosSalvosInicio() {
  const sectionDadosSalvosInicio = document.getElementById('sectionDadosSalvosInicio');
  const infoDadosSalvosInicio = document.getElementById('dadosSalvosInfoInicio');
  
  if (!sectionDadosSalvosInicio || !infoDadosSalvosInicio) return;
  
  try {
    const dadosConsolidados = localStorage.getItem('posProcessamento_dados');
    const ldsSalvas = listarLDsSalvas();
    
    // Mostrar seção se houver dados salvos
    if (dadosConsolidados || ldsSalvas.length > 0) {
      sectionDadosSalvosInicio.style.display = 'block';
      
      let htmlInfo = '';
      
      // Informações dos dados consolidados
      if (dadosConsolidados) {
        const dados = JSON.parse(dadosConsolidados);
        const dataProcessamento = new Date(dados.dataProcessamento);
        const totalDocs = dados.resultadoPosProcessamento?.totalLinhasProcessadas || 0;
        const tamanhoBytes = new Blob([dadosConsolidados]).size;
        const tamanhoKB = tamanhoBytes / 1024;
        const tamanhoMB = tamanhoBytes / (1024 * 1024);
        const tamanhoTexto = tamanhoMB >= 1 ? `${tamanhoMB.toFixed(2)} MB` : `${tamanhoKB.toFixed(1)} KB`;
        
        htmlInfo += `
          <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
            <div style="background: white; padding: 12px 18px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size: 1.5em; font-weight: bold; color: var(--color-primary);">${totalDocs.toLocaleString()}</div>
              <div style="font-size: 0.85em; color: var(--color-text-light);">documentos</div>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <div><strong>Processado em:</strong> ${dataProcessamento.toLocaleString('pt-BR')}</div>
              <div><strong>Tamanho:</strong> ${tamanhoTexto}</div>
        `;
        
        // Informações do CSV se disponíveis
        if (dados.infoCSV && dados.infoCSV.nomeArquivo) {
          const nomeCSV = dados.infoCSV.nomeArquivo.length > 40 
            ? dados.infoCSV.nomeArquivo.substring(0, 40) + '...' 
            : dados.infoCSV.nomeArquivo;
          htmlInfo += `<div><strong>CSV:</strong> ${nomeCSV}</div>`;
        }
        
        htmlInfo += '</div></div>';
      }
      
      // Informações das LDs individuais
      if (ldsSalvas.length > 0) {
        htmlInfo += `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,126,122,0.2);">
            <strong style="color: var(--color-primary);">📋 ${ldsSalvas.length} LD(s) salva(s) individualmente</strong>
            <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
        `;
        
        ldsSalvas.slice(0, 5).forEach(ld => {
          htmlInfo += `<span style="background: white; padding: 4px 10px; border-radius: 15px; font-size: 0.85em; border: 1px solid rgba(0,126,122,0.3);">${ld.ld}</span>`;
        });
        
        if (ldsSalvas.length > 5) {
          htmlInfo += `<span style="padding: 4px 10px; font-size: 0.85em; color: var(--color-text-light);">+${ldsSalvas.length - 5} mais</span>`;
        }
        
        htmlInfo += '</div></div>';
      }
      
      infoDadosSalvosInicio.innerHTML = htmlInfo;
    } else {
      sectionDadosSalvosInicio.style.display = 'none';
    }
  } catch (erro) {
    console.error('Erro ao verificar dados salvos:', erro);
    sectionDadosSalvosInicio.style.display = 'none';
  }
}

// Executar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarEventListenersDadosSalvos);
} else {
  inicializarEventListenersDadosSalvos();
}

/**
 * @swagger
 * Converte valor para Date se for string ou já for Date
 * @param {*} valor - Valor a ser convertido
 * @returns {Date|null} Objeto Date ou null
 */
function converterParaDate(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === 'string') {
    const data = new Date(valor);
    return isNaN(data.getTime()) ? null : data;
  }
  return null;
}

/**
 * @swagger
 * Formata data para exibição em pt-BR
 * @param {*} valor - Valor da data (Date, string ou null)
 * @param {string} fallback - Valor de fallback para exibição
 * @returns {string} Data formatada ou fallback
 */
function formatarDataParaExibicao(valor, fallback = 'N/A') {
  const data = converterParaDate(valor);
  if (data) {
    return data.toLocaleDateString('pt-BR');
  }
  if (valor && typeof valor === 'string') {
    return valor; // Retornar string original se não conseguir converter
  }
  return fallback;
}

/**
 * @swagger
 * Exibe tabela de discrepâncias de data
 */
function exibirDiscrepanciasData() {
  const discrepancias = resultadoPosProcessamento.resultados.filter(r => 
    r.comparacaoData && r.comparacaoData.iguais === false && r.comparacaoData.diferenca !== null
  );
  
  if (discrepancias.length === 0) {
    discrepanciasContainer.classList.add('hidden');
    return;
  }
  
  discrepanciasContainer.classList.remove('hidden');
  const tbody = tableDiscrepancias.querySelector('tbody');
  tbody.innerHTML = '';
  
  discrepancias.forEach(resultado => {
    const tr = document.createElement('tr');
    
    // Formatar data GR Rec (usando função segura de conversão)
    let dataGRRecText = formatarDataParaExibicao(
      resultado.comparacaoData?.dataCSV, 
      resultado.dadosCSV?.dataGRRec || 'N/A'
    );
    
    // Formatar REALIZADO 2 (usando função segura de conversão)
    let realizado2Text = formatarDataParaExibicao(
      resultado.comparacaoData?.dataLD, 
      resultado.realizado2Original || 'N/A'
    );
    
    // Sugestão de ação
    let acaoSugerida = 'Verificar';
    if (resultado.comparacaoData.diferenca > 0) {
      acaoSugerida = `Ajustar LD: Data GR Rec está ${Math.abs(resultado.comparacaoData.diferenca)} dias antes`;
    } else if (resultado.comparacaoData.diferenca < 0) {
      acaoSugerida = `Ajustar LD: Data GR Rec está ${Math.abs(resultado.comparacaoData.diferenca)} dias depois`;
    }
    
    tr.innerHTML = `
      <td>${resultado.noVale || ''}</td>
      <td>${resultado.arquivo || ''}</td>
      <td>${dataGRRecText}</td>
      <td>${realizado2Text}</td>
      <td style="font-weight: 600; color: var(--color-error);">${resultado.comparacaoData.diferenca} dias</td>
      <td>${acaoSugerida}</td>
    `;
    
    tbody.appendChild(tr);
  });
}
