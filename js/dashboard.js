/**
 * @swagger
 * ProcessadorLDs - Módulo de Dashboard
 * 
 * Este módulo contém funções para criar e gerenciar visualizações avançadas
 */

// Armazenar instâncias de gráficos para poder destruí-los
const graficosInstancias = {
  chartTemporal: null,
  chartDistribuicao: null,
  chartBarrasEmpilhadas: null,
  chartAreaAcumuloCertificacao: null,
  chartGantt: null,
  chartAreaAcumulo: null,
  chartMapaCalorTemporal: null,
  chart3D: null,
  chartMapaCalorCertificacao: null,
  chartMapaCalorEmissao: null
};

// Cache de dados processados
let dadosProcessadosCache = null;

/**
 * @swagger
 * Prepara dados mesclados das LDs e do CSV
 * @param {Array} resultadosProcessamento - Dados processados das LDs
 * @param {Object} resultadoPosProcessamento - Resultado do pós-processamento
 * @returns {Array} Array de dados mesclados
 */
function prepararDadosMesclados(resultadosProcessamento, resultadoPosProcessamento) {
  if (!resultadosProcessamento || !Array.isArray(resultadosProcessamento)) {
    return [];
  }
  
  // Criar mapa de resultados do pós-processamento por NO VALE
  const mapaPosProcessamento = new Map();
  if (resultadoPosProcessamento && resultadoPosProcessamento.resultados) {
    resultadoPosProcessamento.resultados.forEach(r => {
      mapaPosProcessamento.set(r.noVale, r);
    });
  }
  
  // Mesclar dados
  const dadosMesclados = [];
  
  resultadosProcessamento.forEach(resultadoLD => {
    if (resultadoLD.dados && Array.isArray(resultadoLD.dados)) {
      resultadoLD.dados.forEach(linha => {
        // Verificar se linha é válida (verificar campos obrigatórios básicos)
        const linhaValida = linha && linha['NO VALE'] && linha['NO VALE'].toString().trim() !== '';
        if (linhaValida) {
          const posProcessamento = mapaPosProcessamento.get(linha['NO VALE']) || {};
          
          // Converter DataPrevisto se for string
          let dataPrevisto = linha['DataPrevisto'];
          if (!(dataPrevisto instanceof Date) && dataPrevisto) {
            if (typeof dataPrevisto === 'string') {
              dataPrevisto = new Date(dataPrevisto);
            }
          }
          
          // Converter PREVISTO 2 se DataPrevisto não existir
          if (!dataPrevisto && linha['PREVISTO 2']) {
            const previsto2 = linha['PREVISTO 2'];
            if (typeof previsto2 === 'string') {
              // Tentar converter formato dd/MM/yyyy
              const partes = previsto2.split('/');
              if (partes.length === 3) {
                dataPrevisto = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
              } else {
                dataPrevisto = new Date(previsto2);
              }
            } else if (previsto2 instanceof Date) {
              dataPrevisto = previsto2;
            }
          }
          
          // Função auxiliar para converter data
          const converterData = (dataStr) => {
            if (!dataStr) return null;
            if (dataStr instanceof Date) return dataStr;
            if (typeof dataStr === 'string') {
              const partes = dataStr.split('/');
              if (partes.length === 3) {
                return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
              }
              return new Date(dataStr);
            }
            return null;
          };
          
          // Converter Data GR Rec (genérica)
          let dataGRRec = null;
          if (posProcessamento.dadosCSV && posProcessamento.dadosCSV.dataGRRec) {
            dataGRRec = converterData(posProcessamento.dadosCSV.dataGRRec);
          }
          
          // Buscar linha com PRIMEMISSAO para data de emissão (prevalece CSV)
          let dataEmissao = null;
          if (posProcessamento.linhasCSV && Array.isArray(posProcessamento.linhasCSV)) {
            const linhaPrimEmissao = posProcessamento.linhasCSV.find(l => {
              const emissao = l['EMISSAO'] || '';
              return String(emissao).trim().toUpperCase() === 'PRIMEMISSAO';
            });
            if (linhaPrimEmissao && linhaPrimEmissao['Data GR Rec']) {
              dataEmissao = converterData(linhaPrimEmissao['Data GR Rec']);
            }
          }
          
          // Se não encontrou PRIMEMISSAO, usar dataGRRec genérica se emitido
          if (!dataEmissao && posProcessamento.emitido && dataGRRec) {
            dataEmissao = dataGRRec;
          }
          
          // Buscar linha com PRIMCERTIFICACAO para data de certificação
          let dataCertificacao = null;
          if (posProcessamento.linhasCSV && Array.isArray(posProcessamento.linhasCSV)) {
            const linhaPrimCertificacao = posProcessamento.linhasCSV.find(l => {
              return l['PRIMCERTIFICACAO'] === true;
            });
            if (linhaPrimCertificacao && linhaPrimCertificacao['Data GR Rec']) {
              dataCertificacao = converterData(linhaPrimCertificacao['Data GR Rec']);
            }
          }
          
          // Calcular data prevista de certificação (Previsto + 14 dias)
          let dataPrevistoCertificacao = null;
          if (dataPrevisto) {
            dataPrevistoCertificacao = new Date(dataPrevisto);
            dataPrevistoCertificacao.setDate(dataPrevistoCertificacao.getDate() + 14);
          }
          
          // Calcular status de certificação
          let statusCertificacao = 'N/A';
          if (dataPrevistoCertificacao) {
            if (dataCertificacao) {
              const diasAtraso = Math.round((dataCertificacao - dataPrevistoCertificacao) / (1000 * 60 * 60 * 24));
              if (diasAtraso <= 0) {
                statusCertificacao = 'No Prazo';
              } else if (diasAtraso <= 7) {
                statusCertificacao = 'Atraso Leve';
              } else {
                statusCertificacao = 'Atraso';
              }
            } else {
              const hoje = new Date();
              const diasAtraso = Math.round((hoje - dataPrevistoCertificacao) / (1000 * 60 * 60 * 24));
              if (diasAtraso > 0) {
                statusCertificacao = 'Pendente';
              } else {
                statusCertificacao = 'Aguardando';
              }
            }
          }
          
          dadosMesclados.push({
            noVale: linha['NO VALE'],
            arquivo: resultadoLD.nomeArquivo,
            ld: resultadoLD.ld || '',
            revisao: resultadoLD.revisao || '',
            disciplina: linha['Disciplina'] || '',
            formato: linha['FORMATO'] || '',
            dataPrevisto: dataPrevisto,
            dataGRRec: dataGRRec,
            dataEmissao: dataEmissao, // Data GR REC quando EMISSAO = 'PRIMEMISSAO' (prevalece CSV)
            dataCertificacao: dataCertificacao, // Data GR REC quando PRIMCERTIFICACAO = true
            dataPrevistoCertificacao: dataPrevistoCertificacao, // Previsto + 14 dias
            statusCertificacao: statusCertificacao, // Status calculado
            projetoSE: posProcessamento.dadosCSV?.projetoSE || '',
            empresa: posProcessamento.dadosCSV?.empresa || '',
            encontradoNoCSV: posProcessamento.encontradoNoCSV || false,
            emitido: posProcessamento.emitido || false,
            certificado: !!dataCertificacao, // Boolean indicando se foi certificado
            diferencaData: posProcessamento.comparacaoData?.diferenca || null,
            statusData: posProcessamento.comparacaoData?.iguais === true ? 'OK' : 
                       (posProcessamento.comparacaoData?.iguais === false ? 'Diferente' : 'N/A')
          });
        }
      });
    }
  });
  
  return dadosMesclados;
}

/**
 * @swagger
 * Coleta valores de um select múltiplo, tratando "Todos" corretamente
 * @param {HTMLSelectElement} selectElement - Elemento select
 * @returns {Array|null} Array de valores selecionados ou null se "Todos" estiver selecionado
 */
function coletarValoresFiltro(selectElement) {
  if (!selectElement) return null; // null = não filtrar este campo
  
  const selectedOptions = Array.from(selectElement.selectedOptions);
  
  // Verificar se "Todos" (valor vazio) está selecionado
  const temTodos = selectedOptions.some(o => o.value === '');
  
  // Se "Todos" estiver selecionado OU nenhuma opção estiver selecionada, não filtrar
  if (temTodos || selectedOptions.length === 0) {
    return null; // null = não filtrar este campo
  }
  
  // Retornar apenas valores não vazios
  return selectedOptions
    .map(o => o.value)
    .filter(v => v !== null && v !== undefined && v !== '');
}

/**
 * @swagger
 * Aplica filtros aos dados mesclados
 * @param {Array} dadosMesclados - Dados mesclados
 * @param {Object} filtros - Objeto com filtros (null = não filtrar)
 * @returns {Array} Dados filtrados
 */
function aplicarFiltros(dadosMesclados, filtros) {
  if (!filtros) return dadosMesclados;
  
  return dadosMesclados.filter(d => {
    // Filtro por projeto (null = não filtrar)
    if (filtros.projetos !== null && filtros.projetos !== undefined) {
      if (filtros.projetos.length > 0 && !filtros.projetos.includes(d.projetoSE)) {
        return false;
      }
    }
    
    // Filtro por empresa (null = não filtrar)
    if (filtros.empresas !== null && filtros.empresas !== undefined) {
      if (filtros.empresas.length > 0 && !filtros.empresas.includes(d.empresa)) {
        return false;
      }
    }
    
    // Filtro por LD (null = não filtrar)
    if (filtros.lds !== null && filtros.lds !== undefined) {
      if (filtros.lds.length > 0 && !filtros.lds.includes(d.ld)) {
        return false;
      }
    }
    
    // Filtro por disciplina (null = não filtrar)
    if (filtros.disciplinas !== null && filtros.disciplinas !== undefined) {
      if (filtros.disciplinas.length > 0 && !filtros.disciplinas.includes(d.disciplina)) {
        return false;
      }
    }
    
    // Filtro por formato (null = não filtrar)
    if (filtros.formatos !== null && filtros.formatos !== undefined) {
      if (filtros.formatos.length > 0 && !filtros.formatos.includes(d.formato)) {
        return false;
      }
    }
    
    // Filtro por período
    if (filtros.dataInicio && d.dataPrevisto) {
      const dataInicio = new Date(filtros.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      if (d.dataPrevisto < dataInicio) return false;
    }
    if (filtros.dataFim && d.dataPrevisto) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      if (d.dataPrevisto > dataFim) return false;
    }
    
    return true;
  });
}

/**
 * @swagger
 * Atualiza todos os gráficos do dashboard
 * @param {Array} dadosFiltrados - Dados filtrados para visualização
 */
function atualizarTodosGraficos(dadosFiltrados) {
  if (!dadosFiltrados || dadosFiltrados.length === 0) {
    console.warn('Nenhum dado para visualizar');
    return;
  }
  
  // Atualizar estatísticas
  atualizarEstatisticasDashboard(dadosFiltrados);
  
  // Criar/atualizar gráficos
  criarGraficoTemporal(dadosFiltrados);
  criarMapaCalorTemporal(dadosFiltrados);
  criarGrafico3D(dadosFiltrados);
  criarGraficoGantt(dadosFiltrados);
  criarGraficoDistribuicao(dadosFiltrados);
  criarGraficoBarrasEmpilhadas(dadosFiltrados);
  criarMapaCalorEmissao(dadosFiltrados);
  criarMapaCalorCertificacao(dadosFiltrados);
  criarGraficoAreaAcumulo(dadosFiltrados);
  criarGraficoAreaAcumuloCertificacao(dadosFiltrados);
}

/**
 * @swagger
 * Destrói todos os gráficos para liberar memória
 */
function destruirGraficos() {
  // Destruir gráficos Chart.js
  Object.keys(graficosInstancias).forEach(key => {
    if (graficosInstancias[key] && typeof graficosInstancias[key].destroy === 'function') {
      graficosInstancias[key].destroy();
      graficosInstancias[key] = null;
    }
  });
  
  // Limpar containers Plotly
  const plotlyContainers = ['chartMapaCalorTemporal', 'chart3D', 'chartMapaCalorEmissao', 'chartMapaCalorCertificacao'];
  plotlyContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container && typeof Plotly !== 'undefined') {
      Plotly.purge(container);
      container.innerHTML = '';
    }
  });
  
  dadosProcessadosCache = null;
}

/**
 * @swagger
 * Atualiza estatísticas do dashboard
 * @param {Array} dados - Dados filtrados
 */
function atualizarEstatisticasDashboard(dados) {
  const statsContainer = document.getElementById('dashboardStats');
  if (!statsContainer) return;
  
  const total = dados.length;
  const encontrados = dados.filter(d => d.encontradoNoCSV).length;
  const emitidos = dados.filter(d => d.emitido).length;
  const certificados = dados.filter(d => d.certificado).length;
  const comDiscrepancia = dados.filter(d => d.diferencaData !== null && d.diferencaData !== 0).length;
  const certificacaoPendente = dados.filter(d => d.statusCertificacao === 'Pendente').length;
  
  statsContainer.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${total}</div>
      <div class="stat-label">Total de Documentos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${encontrados}</div>
      <div class="stat-label">Encontrados no CSV</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${emitidos}</div>
      <div class="stat-label">Emitidos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${certificados}</div>
      <div class="stat-label">Certificados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${certificacaoPendente}</div>
      <div class="stat-label">Certificação Pendente</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${comDiscrepancia}</div>
      <div class="stat-label">Com Discrepância</div>
    </div>
  `;
}

/**
 * @swagger
 * Cria gráfico temporal de Previsto vs Realizado
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoTemporal(dados) {
  const canvas = document.getElementById('chartTemporal');
  if (!canvas) return;
  
  // Destruir gráfico anterior se existir
  if (graficosInstancias.chartTemporal) {
    graficosInstancias.chartTemporal.destroy();
  }
  
  // Agrupar por período (mês)
  const agrupamento = {};
  
  dados.forEach(d => {
    if (d.dataPrevisto || d.dataEmissao) {
      // Agrupar por mês
      const mesPrevisto = d.dataPrevisto ? 
        `${d.dataPrevisto.getFullYear()}-${String(d.dataPrevisto.getMonth() + 1).padStart(2, '0')}` : null;
      const mesEmissao = d.dataEmissao ? 
        `${d.dataEmissao.getFullYear()}-${String(d.dataEmissao.getMonth() + 1).padStart(2, '0')}` : null;
      
      if (mesPrevisto) {
        if (!agrupamento[mesPrevisto]) {
          agrupamento[mesPrevisto] = { previsto: 0, emitido: 0, certificado: 0 };
        }
        agrupamento[mesPrevisto].previsto++;
      }
      
      if (mesEmissao) {
        if (!agrupamento[mesEmissao]) {
          agrupamento[mesEmissao] = { previsto: 0, emitido: 0, certificado: 0 };
        }
        agrupamento[mesEmissao].emitido++;
        if (d.certificado) {
          agrupamento[mesEmissao].certificado++;
        }
      }
    }
  });
  
  const periodos = Object.keys(agrupamento).sort();
  const previstos = periodos.map(p => agrupamento[p].previsto);
  const realizados = periodos.map(p => agrupamento[p].emitido);
  
  // Calcular totais para tabela de resumo
  const totalPrevisto = previstos.reduce((a, b) => a + b, 0);
  const totalEmitido = realizados.reduce((a, b) => a + b, 0);
  const totalCertificado = dados.filter(d => d.certificado).length;
  const totalEmitidoSemCertificar = totalEmitido - totalCertificado;
  
  // Criar tabela de resumo
  const container = canvas.parentElement.parentElement; // chart-container
  let resumoTable = container.querySelector('.temporal-resumo-table');
  if (!resumoTable) {
    // Procurar div ao lado do canvas
    const canvasWrapper = canvas.parentElement;
    const resumoDiv = canvasWrapper.nextElementSibling;
    if (resumoDiv) {
      resumoTable = document.createElement('div');
      resumoTable.className = 'temporal-resumo-table';
      resumoTable.style.cssText = 'padding: 15px; background: #f8f9fa; border-radius: 8px;';
      resumoDiv.appendChild(resumoTable);
    } else {
      // Fallback: criar após o container
      resumoTable = document.createElement('div');
      resumoTable.className = 'temporal-resumo-table';
      resumoTable.style.cssText = 'margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;';
      container.appendChild(resumoTable);
    }
  }
  resumoTable.innerHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: var(--color-primary); color: white;">
          <th style="padding: 10px; text-align: left;">Métrica</th>
          <th style="padding: 10px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Previsto</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd; font-weight: 600;">${totalPrevisto}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total Emitido (sem certificar)</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd; font-weight: 600;">${totalEmitidoSemCertificar}</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Total Certificado</td>
          <td style="padding: 8px; text-align: right; font-weight: 600;">${totalCertificado}</td>
        </tr>
      </tbody>
    </table>
  `;
  
  graficosInstancias.chartTemporal = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: periodos,
      datasets: [
        {
          label: 'Previsto',
          data: previstos,
          backgroundColor: 'rgba(75, 192, 192, 0.8)'
        },
        {
          label: 'Realizado',
          data: realizados,
          backgroundColor: 'rgba(255, 99, 132, 0.8)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantidade de Documentos'
          }
        }
      }
    }
  });
}

/**
 * @swagger
 * Cria mapa de calor temporal por disciplina
 * @param {Array} dados - Dados filtrados
 */
function criarMapaCalorTemporal(dados) {
  const container = document.getElementById('chartMapaCalorTemporal');
  if (!container || typeof Plotly === 'undefined') return;
  
  // Agrupar por período e disciplina
  const agrupamento = {};
  const disciplinas = [...new Set(dados.map(d => d.disciplina).filter(d => d))];
  const periodos = [];
  
  dados.forEach(d => {
    if (d.dataPrevisto) {
      const periodo = `${d.dataPrevisto.getFullYear()}-${String(d.dataPrevisto.getMonth() + 1).padStart(2, '0')}`;
      if (!periodos.includes(periodo)) periodos.push(periodo);
      
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = {};
      }
      if (!agrupamento[periodo][d.disciplina]) {
        agrupamento[periodo][d.disciplina] = 0;
      }
      agrupamento[periodo][d.disciplina]++;
    }
  });
  
  periodos.sort();
  
  // Criar matriz de valores
  const z = disciplinas.map(disciplina => 
    periodos.map(periodo => agrupamento[periodo]?.[disciplina] || 0)
  );
  
  const trace = {
    x: periodos,
    y: disciplinas,
    z: z,
    type: 'heatmap',
    colorscale: 'Viridis',
    showscale: true
  };
  
  const layout = {
    title: '',
    xaxis: { title: 'Período' },
    yaxis: { title: 'Disciplina' }
  };
  
  Plotly.newPlot(container, [trace], layout, {responsive: true});
}

/**
 * @swagger
 * Cria gráfico 3D de Disciplina × Projeto × Quantidade
 * @param {Array} dados - Dados filtrados
 */
function criarGrafico3D(dados) {
  const container = document.getElementById('chart3D');
  if (!container || typeof Plotly === 'undefined') return;
  
  // Agrupar por disciplina e projeto
  const agrupamento = {};
  dados.forEach(d => {
    if (d.disciplina && d.projetoSE) {
      const key = `${d.disciplina}|${d.projetoSE}`;
      if (!agrupamento[key]) {
        agrupamento[key] = { disciplina: d.disciplina, projeto: d.projetoSE, quantidade: 0, status: [] };
      }
      agrupamento[key].quantidade++;
      if (d.emitido) agrupamento[key].status.push('Emitido');
      else if (d.encontradoNoCSV) agrupamento[key].status.push('Não Emitido');
      else agrupamento[key].status.push('Não Encontrado');
    }
  });
  
  const disciplinas = [];
  const projetos = [];
  const quantidades = [];
  const cores = [];
  
  Object.values(agrupamento).forEach(item => {
    disciplinas.push(item.disciplina);
    projetos.push(item.projeto);
    quantidades.push(item.quantidade);
    
    // Cor baseada no status predominante
    const emitidos = item.status.filter(s => s === 'Emitido').length;
    const naoEmitidos = item.status.filter(s => s === 'Não Emitido').length;
    if (emitidos > naoEmitidos) {
      cores.push(0); // Verde
    } else if (naoEmitidos > 0) {
      cores.push(1); // Amarelo
    } else {
      cores.push(2); // Vermelho
    }
  });
  
  const trace = {
    x: disciplinas,
    y: projetos,
    z: quantidades,
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: quantidades.map(q => Math.max(5, Math.min(20, q))),
      color: cores,
      colorscale: [[0, 'green'], [0.5, 'yellow'], [1, 'red']],
      showscale: true,
      colorbar: {
        title: 'Status',
        tickvals: [0, 1, 2],
        ticktext: ['Emitido', 'Não Emitido', 'Não Encontrado']
      }
    }
  };
  
  const layout = {
    title: '',
    scene: {
      xaxis: { title: 'Disciplina' },
      yaxis: { title: 'Projeto/SE' },
      zaxis: { title: 'Quantidade' }
    }
  };
  
  Plotly.newPlot(container, [trace], layout, {responsive: true});
}


/**
 * @swagger
 * Cria gráfico de timeline melhorado (substitui Gantt)
 * Mostra distribuição de documentos por período com status
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoGantt(dados) {
  const canvas = document.getElementById('chartGantt');
  if (!canvas) return;
  
  if (graficosInstancias.chartGantt) {
    graficosInstancias.chartGantt.destroy();
  }
  
  // Agrupar por período (semana ou mês) e contar documentos
  const agrupamento = {};
  const periodos = [];
  
  dados.forEach(d => {
    if (d.dataPrevisto) {
      // Agrupar por mês para melhor visualização
      const data = d.dataPrevisto;
      const periodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = {
          total: 0,
          emitido: 0,
          naoEmitido: 0,
          naoEncontrado: 0,
          certificado: 0,
          certificacaoPendente: 0,
          comDiscrepancia: 0
        };
        if (!periodos.includes(periodo)) {
          periodos.push(periodo);
        }
      }
      
      agrupamento[periodo].total++;
      if (d.emitido) {
        agrupamento[periodo].emitido++;
      } else if (d.encontradoNoCSV) {
        agrupamento[periodo].naoEmitido++;
      } else {
        agrupamento[periodo].naoEncontrado++;
      }
      
      if (d.certificado) {
        agrupamento[periodo].certificado++;
      }
      
      if (d.statusCertificacao === 'Pendente') {
        agrupamento[periodo].certificacaoPendente++;
      }
      
      if (d.diferencaData !== null && d.diferencaData !== 0) {
        agrupamento[periodo].comDiscrepancia++;
      }
    }
  });
  
  periodos.sort();
  
  const totais = periodos.map(p => agrupamento[p].total);
  const emitidos = periodos.map(p => agrupamento[p].emitido);
  const naoEmitidos = periodos.map(p => agrupamento[p].naoEmitido);
  const naoEncontrados = periodos.map(p => agrupamento[p].naoEncontrado);
  const certificados = periodos.map(p => agrupamento[p].certificado);
  const certificacaoPendente = periodos.map(p => agrupamento[p].certificacaoPendente);
  const comDiscrepancia = periodos.map(p => agrupamento[p].comDiscrepancia);
  
  graficosInstancias.chartGantt = new Chart(canvas, {
    type: 'line',
    data: {
      labels: periodos,
      datasets: [
        {
          label: 'Total de Documentos',
          data: totais,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
          fill: true
        },
        {
          label: 'Emitidos',
          data: emitidos,
          borderColor: 'rgba(0, 255, 0, 1)',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          tension: 0.1
        },
        {
          label: 'Certificados',
          data: certificados,
          borderColor: 'rgba(0, 200, 255, 1)',
          backgroundColor: 'rgba(0, 200, 255, 0.2)',
          tension: 0.1
        },
        {
          label: 'Certificação Pendente',
          data: certificacaoPendente,
          borderColor: 'rgba(255, 140, 0, 1)',
          backgroundColor: 'rgba(255, 140, 0, 0.2)',
          tension: 0.1
        },
        {
          label: 'Não Emitidos',
          data: naoEmitidos,
          borderColor: 'rgba(255, 165, 0, 1)',
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          tension: 0.1
        },
        {
          label: 'Não Encontrados',
          data: naoEncontrados,
          borderColor: 'rgba(255, 0, 0, 1)',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          tension: 0.1
        },
        {
          label: 'Com Discrepância',
          data: comDiscrepancia,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        title: {
          display: true,
          text: 'Evolução de Documentos por Período'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Quantidade de Documentos'
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });
}

/**
 * @swagger
 * Cria gráfico de distribuição por disciplina
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoDistribuicao(dados) {
  const canvas = document.getElementById('chartDistribuicao');
  if (!canvas) return;
  
  if (graficosInstancias.chartDistribuicao) {
    graficosInstancias.chartDistribuicao.destroy();
  }
  
  // Contar por disciplina
  const contagem = {};
  dados.forEach(d => {
    const disc = d.disciplina || 'N/A';
    contagem[disc] = (contagem[disc] || 0) + 1;
  });
  
  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);
  const total = valores.reduce((a, b) => a + b, 0);
  
  // Criar labels com número e percentual
  const labelsComPercentual = labels.map((label, index) => {
    const valor = valores[index];
    const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
    return `${label}\n${valor} (${percentual}%)`;
  });
  
  // Criar tabela de resumo
  const container = canvas.parentElement;
  let resumoTable = container.querySelector('.distribuicao-resumo-table');
  if (!resumoTable) {
    resumoTable = document.createElement('div');
    resumoTable.className = 'distribuicao-resumo-table';
    resumoTable.style.cssText = 'margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; max-height: 300px; overflow-y: auto;';
    container.appendChild(resumoTable);
  }
  
  const tabelaHTML = labels.map((label, index) => {
    const valor = valores[index];
    const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
    return `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">${label}</td>
        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd; font-weight: 600;">${valor}</td>
        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #ddd;">${percentual}%</td>
      </tr>
    `;
  }).join('');
  
  resumoTable.innerHTML = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
      <thead>
        <tr style="background: var(--color-primary); color: white;">
          <th style="padding: 8px; text-align: left;">Disciplina</th>
          <th style="padding: 8px; text-align: right;">Quantidade</th>
          <th style="padding: 8px; text-align: right;">Percentual</th>
        </tr>
      </thead>
      <tbody>
        ${tabelaHTML}
      </tbody>
    </table>
  `;
  
  graficosInstancias.chartDistribuicao = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labelsComPercentual,
      datasets: [{
        data: valores,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = labels[context.dataIndex];
              const valor = valores[context.dataIndex];
              const percentual = total > 0 ? ((valor / total) * 100).toFixed(1) : 0;
              return `${label}: ${valor} (${percentual}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * @swagger
 * Cria gráfico de barras empilhadas por projeto
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoBarrasEmpilhadas(dados) {
  const canvas = document.getElementById('chartBarrasEmpilhadas');
  if (!canvas) return;
  
  if (graficosInstancias.chartBarrasEmpilhadas) {
    graficosInstancias.chartBarrasEmpilhadas.destroy();
  }
  
  // Agrupar por projeto
  const agrupamento = {};
  dados.forEach(d => {
    const projeto = d.projetoSE || 'N/A';
    if (!agrupamento[projeto]) {
      agrupamento[projeto] = { 
        certificado: 0,
        emitidoNaoCertificado: 0,
        naoEmitido: 0,
        naoEncontrado: 0
      };
    }
    
    // Classificar documento
    if (d.certificado) {
      // Certificado (verde)
      agrupamento[projeto].certificado++;
    } else if (d.emitido) {
      // Emitido mas não certificado (laranja)
      agrupamento[projeto].emitidoNaoCertificado++;
    } else if (d.encontradoNoCSV) {
      // Não emitido (amarelo)
      agrupamento[projeto].naoEmitido++;
    } else {
      // Não encontrado (vermelho)
      agrupamento[projeto].naoEncontrado++;
    }
  });
  
  const projetos = Object.keys(agrupamento);
  const certificados = projetos.map(p => agrupamento[p].certificado);
  const emitidoNaoCertificado = projetos.map(p => agrupamento[p].emitidoNaoCertificado);
  const naoEmitidos = projetos.map(p => agrupamento[p].naoEmitido);
  const naoEncontrados = projetos.map(p => agrupamento[p].naoEncontrado);
  
  graficosInstancias.chartBarrasEmpilhadas = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: projetos,
      datasets: [
        {
          label: 'Emitido e não certificado',
          data: emitidoNaoCertificado,
          backgroundColor: 'rgba(255, 165, 0, 0.8)' // Laranja
        },
        {
          label: 'Certificado',
          data: certificados,
          backgroundColor: 'rgba(0, 126, 122, 0.8)' // Verde #007E7A
        },
        {
          label: 'Não Emitido',
          data: naoEmitidos,
          backgroundColor: 'rgba(255, 255, 0, 0.8)' // Amarelo
        },
        {
          label: 'Não Encontrado',
          data: naoEncontrados,
          backgroundColor: 'rgba(255, 0, 0, 0.8)' // Vermelho
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  });
}


/**
 * @swagger
 * Cria mapa de calor de taxa de emissão
 * @param {Array} dados - Dados filtrados
 */
function criarMapaCalorEmissao(dados) {
  const container = document.getElementById('chartMapaCalorEmissao');
  if (!container || typeof Plotly === 'undefined') return;
  
  // Agrupar por projeto e disciplina
  const agrupamento = {};
  const projetos = [...new Set(dados.map(d => d.projetoSE).filter(p => p))];
  const disciplinas = [...new Set(dados.map(d => d.disciplina).filter(d => d))];
  
  dados.forEach(d => {
    if (d.projetoSE && d.disciplina) {
      if (!agrupamento[d.projetoSE]) {
        agrupamento[d.projetoSE] = {};
      }
      if (!agrupamento[d.projetoSE][d.disciplina]) {
        agrupamento[d.projetoSE][d.disciplina] = { total: 0, emitidos: 0 };
      }
      agrupamento[d.projetoSE][d.disciplina].total++;
      if (d.emitido) agrupamento[d.projetoSE][d.disciplina].emitidos++;
    }
  });
  
  // Criar matriz de taxas (percentual de emitidos) - máximo 100%
  const z = disciplinas.map(disciplina => 
    projetos.map(projeto => {
      const item = agrupamento[projeto]?.[disciplina];
      const taxa = item && item.total > 0 ? (item.emitidos / item.total) * 100 : 0;
      return Math.min(100, taxa); // Garantir máximo de 100%
    })
  );
  
  const trace = {
    x: projetos,
    y: disciplinas,
    z: z,
    type: 'heatmap',
    colorscale: [[0, 'red'], [0.5, 'yellow'], [1, 'green']],
    showscale: true,
    zmin: 0,
    zmax: 100, // Máximo de 100%
    colorbar: {
      title: 'Taxa de Emissão (%)'
    }
  };
  
  const layout = {
    title: '',
    xaxis: { title: 'Projeto/SE' },
    yaxis: { title: 'Disciplina' }
  };
  
  Plotly.newPlot(container, [trace], layout, {responsive: true});
}

/**
 * @swagger
 * Cria mapa de calor de taxa de certificação
 * @param {Array} dados - Dados filtrados
 */
function criarMapaCalorCertificacao(dados) {
  const container = document.getElementById('chartMapaCalorCertificacao');
  if (!container || typeof Plotly === 'undefined') return;
  
  // Agrupar por projeto e disciplina
  const agrupamento = {};
  const projetos = [...new Set(dados.map(d => d.projetoSE).filter(p => p))];
  const disciplinas = [...new Set(dados.map(d => d.disciplina).filter(d => d))];
  
  dados.forEach(d => {
    if (d.projetoSE && d.disciplina) {
      if (!agrupamento[d.projetoSE]) {
        agrupamento[d.projetoSE] = {};
      }
      if (!agrupamento[d.projetoSE][d.disciplina]) {
        agrupamento[d.projetoSE][d.disciplina] = { total: 0, certificados: 0 };
      }
      agrupamento[d.projetoSE][d.disciplina].total++;
      if (d.certificado) agrupamento[d.projetoSE][d.disciplina].certificados++;
    }
  });
  
  // Criar matriz de taxas (percentual de certificados) - máximo 100%
  const z = disciplinas.map(disciplina => 
    projetos.map(projeto => {
      const item = agrupamento[projeto]?.[disciplina];
      const taxa = item && item.total > 0 ? (item.certificados / item.total) * 100 : 0;
      return Math.min(100, taxa); // Garantir máximo de 100%
    })
  );
  
  const trace = {
    x: projetos,
    y: disciplinas,
    z: z,
    type: 'heatmap',
    colorscale: [[0, 'red'], [0.5, 'yellow'], [1, 'green']],
    showscale: true,
    zmin: 0,
    zmax: 100, // Máximo de 100%
    colorbar: {
      title: 'Taxa de Certificação (%)'
    }
  };
  
  const layout = {
    title: '',
    xaxis: { title: 'Projeto/SE' },
    yaxis: { title: 'Disciplina' }
  };
  
  Plotly.newPlot(container, [trace], layout, {responsive: true});
}

/**
 * @swagger
 * Cria gráfico de área: Acúmulo temporal
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoAreaAcumulo(dados) {
  const canvas = document.getElementById('chartAreaAcumulo');
  if (!canvas) return;
  
  if (graficosInstancias.chartAreaAcumulo) {
    graficosInstancias.chartAreaAcumulo.destroy();
  }
  
  // Agrupar por período usando dataPrevisto (LD) e dataEmissao (CSV PRIMEMISSAO)
  const agrupamento = {};
  const periodosSet = new Set();
  
  dados.forEach(d => {
    // Acúmulo Previsto (LD)
    if (d.dataPrevisto) {
      const periodo = `${d.dataPrevisto.getFullYear()}-${String(d.dataPrevisto.getMonth() + 1).padStart(2, '0')}`;
      periodosSet.add(periodo);
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = { previsto: 0, realizado: 0 };
      }
      agrupamento[periodo].previsto++;
    }
    
    // Acúmulo Realizado (CSV DATA GR REC PRIMEMISSAO)
    if (d.dataEmissao) {
      const periodo = `${d.dataEmissao.getFullYear()}-${String(d.dataEmissao.getMonth() + 1).padStart(2, '0')}`;
      periodosSet.add(periodo);
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = { previsto: 0, realizado: 0 };
      }
      agrupamento[periodo].realizado++;
    }
  });
  
  const periodos = Array.from(periodosSet).sort();
  
  // Calcular acúmulo
  let acumuloPrevisto = 0;
  let acumuloRealizado = 0;
  
  const previstosAcum = [];
  const realizadosAcum = [];
  
  periodos.forEach(periodo => {
    acumuloPrevisto += agrupamento[periodo]?.previsto || 0;
    acumuloRealizado += agrupamento[periodo]?.realizado || 0;
    
    previstosAcum.push(acumuloPrevisto);
    realizadosAcum.push(acumuloRealizado);
  });
  
  graficosInstancias.chartAreaAcumulo = new Chart(canvas, {
    type: 'line',
    data: {
      labels: periodos,
      datasets: [
        {
          label: 'Acúmulo Previsto (LD)',
          data: previstosAcum,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1
        },
        {
          label: 'Acúmulo Realizado (CSV PRIMEMISSAO)',
          data: realizadosAcum,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Acúmulo de Documentos'
          }
        }
      }
    }
  });
}

/**
 * @swagger
 * Cria gráfico de área: Acúmulo de Certificação
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoAreaAcumuloCertificacao(dados) {
  const canvas = document.getElementById('chartAreaAcumuloCertificacao');
  if (!canvas) return;
  
  if (graficosInstancias.chartAreaAcumuloCertificacao) {
    graficosInstancias.chartAreaAcumuloCertificacao.destroy();
  }
  
  // Agrupar por período usando dataPrevistoCertificacao (Previsto LD + 14) e dataCertificacao (CSV PRIMCERTIFICACAO)
  const agrupamento = {};
  const periodosSet = new Set();
  
  dados.forEach(d => {
    // Certificação Prevista (Previsto LD + 14 dias)
    if (d.dataPrevistoCertificacao) {
      const periodo = `${d.dataPrevistoCertificacao.getFullYear()}-${String(d.dataPrevistoCertificacao.getMonth() + 1).padStart(2, '0')}`;
      periodosSet.add(periodo);
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = { previsto: 0, realizado: 0 };
      }
      agrupamento[periodo].previsto++;
    }
    
    // Acúmulo Realizado (CSV DATA GR REC PRIMCERTIFICACAO)
    if (d.dataCertificacao) {
      const periodo = `${d.dataCertificacao.getFullYear()}-${String(d.dataCertificacao.getMonth() + 1).padStart(2, '0')}`;
      periodosSet.add(periodo);
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = { previsto: 0, realizado: 0 };
      }
      agrupamento[periodo].realizado++;
    }
  });
  
  const periodos = Array.from(periodosSet).sort();
  
  // Calcular acúmulo
  let acumuloPrevisto = 0;
  let acumuloRealizado = 0;
  
  const previstosAcum = [];
  const realizadosAcum = [];
  
  periodos.forEach(periodo => {
    acumuloPrevisto += agrupamento[periodo]?.previsto || 0;
    acumuloRealizado += agrupamento[periodo]?.realizado || 0;
    
    previstosAcum.push(acumuloPrevisto);
    realizadosAcum.push(acumuloRealizado);
  });
  
  graficosInstancias.chartAreaAcumuloCertificacao = new Chart(canvas, {
    type: 'line',
    data: {
      labels: periodos,
      datasets: [
        {
          label: 'Certificação Prevista (Previsto LD + 14)',
          data: previstosAcum,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1
        },
        {
          label: 'Acúmulo Realizado (CSV PRIMCERTIFICACAO)',
          data: realizadosAcum,
          borderColor: 'rgba(0, 126, 122, 1)',
          backgroundColor: 'rgba(0, 126, 122, 0.2)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Período'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Acúmulo de Certificações'
          }
        }
      }
    }
  });
}
