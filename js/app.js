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
  
  const modoTeste = document.getElementById('chkModoTeste').checked;
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
      
      // Se modo teste, exibir informações de extração
      if (modoTeste) {
        console.log(`\n=== Teste de Extração: ${arquivo.name} ===`);
        console.log(`LD Extraído: ${resultado.ld || '(não encontrado)'}`);
        console.log(`Revisão Extraída: ${resultado.revisao || '(não encontrada)'}`);
        
        // Extrair esperado do nome do arquivo para comparação
        const match = arquivo.name.match(/LD-8001PZ-F-(\d+)_REV_(\w+)_/);
        if (match) {
          const ldEsperado = `LD_${match[1]}`;
          const revisaoEsperada = match[2];
          console.log(`LD Esperado: ${ldEsperado}`);
          console.log(`Revisão Esperada: ${revisaoEsperada}`);
          console.log(`LD Correto: ${resultado.ld === ldEsperado ? '✅' : '❌'}`);
          console.log(`Revisão Correta: ${resultado.revisao === revisaoEsperada ? '✅' : '❌'}`);
        }
        console.log('=========================================\n');
      }
    }
    
    // Validar resultados
    resultadoValidacao = validarMultiplosArquivos(resultadosProcessamento);
    
    // Exibir resultados
    exibirResultados();
    
    // Se modo teste, exibir resumo no console
    if (modoTeste) {
      exibirResumoTeste();
    }
    
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
 * Exibe resumo dos testes de extração no console
 */
function exibirResumoTeste() {
  console.log('\n📊 RESUMO DOS TESTES DE EXTRAÇÃO');
  console.log('='.repeat(60));
  
  let sucessos = 0;
  let parcial = 0;
  let erros = 0;
  let fonteConteudoLD = 0;
  let fonteNomeLD = 0;
  
  resultadosProcessamento.forEach(resultado => {
    if (resultado.erro) {
      erros++;
      return;
    }
    
    const match = resultado.nomeArquivo.match(/LD-8001PZ-F-(\d+)_REV_(\w+)_/);
    if (match) {
      const ldEsperado = `LD_${match[1]}`;
      const revisaoEsperada = match[2];
      const ldCorreto = resultado.ld === ldEsperado;
      const revisaoCorreta = resultado.revisao === revisaoEsperada;
      
      if (ldCorreto && revisaoCorreta) {
        sucessos++;
      } else {
        parcial++;
      }
    }
  });
  
  console.log(`Total de arquivos: ${resultadosProcessamento.length}`);
  console.log(`✅ Sucessos completos: ${sucessos}`);
  console.log(`⚠️  Extrações parciais: ${parcial}`);
  console.log(`❌ Erros: ${erros}`);
  console.log('='.repeat(60) + '\n');
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
      <td><span class="status-badge ${statusClass}">${status.status}</span></td>
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
  
  // Limpar tabelas
  tableStatus.querySelector('tbody').innerHTML = '';
  tableDados.querySelector('tbody').innerHTML = '';
  problemsList.innerHTML = '';
  statsGrid.innerHTML = '';
}
