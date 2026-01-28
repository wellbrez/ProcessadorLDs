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
  chartDispersao: null,
  chartGantt: null,
  chartAreaAcumulo: null,
  chartMapaCalorTemporal: null,
  chart3D: null,
  chartMapaCalorDiscrepancias: null,
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
          
          // Converter Data GR Rec
          let dataGRRec = null;
          if (posProcessamento.dadosCSV && posProcessamento.dadosCSV.dataGRRec) {
            dataGRRec = posProcessamento.dadosCSV.dataGRRec;
            if (!(dataGRRec instanceof Date) && dataGRRec) {
              if (typeof dataGRRec === 'string') {
                const partes = dataGRRec.split('/');
                if (partes.length === 3) {
                  dataGRRec = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
                } else {
                  dataGRRec = new Date(dataGRRec);
                }
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
            projetoSE: posProcessamento.dadosCSV?.projetoSE || '',
            empresa: posProcessamento.dadosCSV?.empresa || '',
            encontradoNoCSV: posProcessamento.encontradoNoCSV || false,
            emitido: posProcessamento.emitido || false,
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
 * Aplica filtros aos dados mesclados
 * @param {Array} dadosMesclados - Dados mesclados
 * @param {Object} filtros - Objeto com filtros
 * @returns {Array} Dados filtrados
 */
function aplicarFiltros(dadosMesclados, filtros) {
  if (!filtros) return dadosMesclados;
  
  return dadosMesclados.filter(d => {
    // Filtro por projeto
    if (filtros.projetos && filtros.projetos.length > 0 && filtros.projetos[0] !== '') {
      if (!filtros.projetos.includes(d.projetoSE)) return false;
    }
    
    // Filtro por empresa
    if (filtros.empresas && filtros.empresas.length > 0 && filtros.empresas[0] !== '') {
      if (!filtros.empresas.includes(d.empresa)) return false;
    }
    
    // Filtro por LD
    if (filtros.lds && filtros.lds.length > 0 && filtros.lds[0] !== '') {
      if (!filtros.lds.includes(d.ld)) return false;
    }
    
    // Filtro por disciplina
    if (filtros.disciplinas && filtros.disciplinas.length > 0 && filtros.disciplinas[0] !== '') {
      if (!filtros.disciplinas.includes(d.disciplina)) return false;
    }
    
    // Filtro por formato
    if (filtros.formatos && filtros.formatos.length > 0 && filtros.formatos[0] !== '') {
      if (!filtros.formatos.includes(d.formato)) return false;
    }
    
    // Filtro por período
    if (filtros.dataInicio && d.dataPrevisto) {
      if (d.dataPrevisto < new Date(filtros.dataInicio)) return false;
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
  criarMapaCalorDiscrepancias(dadosFiltrados);
  criarGraficoGantt(dadosFiltrados);
  criarGraficoDistribuicao(dadosFiltrados);
  criarGraficoBarrasEmpilhadas(dadosFiltrados);
  criarGraficoDispersao(dadosFiltrados);
  criarMapaCalorEmissao(dadosFiltrados);
  criarGraficoAreaAcumulo(dadosFiltrados);
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
  const plotlyContainers = ['chartMapaCalorTemporal', 'chart3D', 'chartMapaCalorDiscrepancias', 'chartMapaCalorEmissao'];
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
  const comDiscrepancia = dados.filter(d => d.diferencaData !== null && d.diferencaData !== 0).length;
  
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
  
  // Agrupar por período (semana ou mês)
  const agrupamento = {};
  
  dados.forEach(d => {
    if (d.dataPrevisto || d.dataGRRec) {
      // Agrupar por mês
      const mesPrevisto = d.dataPrevisto ? 
        `${d.dataPrevisto.getFullYear()}-${String(d.dataPrevisto.getMonth() + 1).padStart(2, '0')}` : null;
      const mesRealizado = d.dataGRRec ? 
        `${d.dataGRRec.getFullYear()}-${String(d.dataGRRec.getMonth() + 1).padStart(2, '0')}` : null;
      
      if (mesPrevisto) {
        if (!agrupamento[mesPrevisto]) {
          agrupamento[mesPrevisto] = { previsto: 0, realizado: 0 };
        }
        agrupamento[mesPrevisto].previsto++;
      }
      
      if (mesRealizado) {
        if (!agrupamento[mesRealizado]) {
          agrupamento[mesRealizado] = { previsto: 0, realizado: 0 };
        }
        agrupamento[mesRealizado].realizado++;
      }
    }
  });
  
  const periodos = Object.keys(agrupamento).sort();
  const previstos = periodos.map(p => agrupamento[p].previsto);
  const realizados = periodos.map(p => agrupamento[p].realizado);
  
  graficosInstancias.chartTemporal = new Chart(canvas, {
    type: 'line',
    data: {
      labels: periodos,
      datasets: [
        {
          label: 'Previsto',
          data: previstos,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Realizado',
          data: realizados,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
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
        y: {
          beginAtZero: true
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
 * Cria mapa de calor de discrepâncias de data
 * @param {Array} dados - Dados filtrados
 */
function criarMapaCalorDiscrepancias(dados) {
  const container = document.getElementById('chartMapaCalorDiscrepancias');
  if (!container || typeof Plotly === 'undefined') return;
  
  // Filtrar apenas dados com discrepância
  const dadosComDiscrepancia = dados.filter(d => d.diferencaData !== null && d.diferencaData !== 0);
  
  if (dadosComDiscrepancia.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhuma discrepância encontrada</p>';
    return;
  }
  
  // Agrupar por projeto e disciplina
  const agrupamento = {};
  const projetos = [...new Set(dadosComDiscrepancia.map(d => d.projetoSE).filter(p => p))];
  const disciplinas = [...new Set(dadosComDiscrepancia.map(d => d.disciplina).filter(d => d))];
  
  dadosComDiscrepancia.forEach(d => {
    if (d.projetoSE && d.disciplina) {
      if (!agrupamento[d.projetoSE]) {
        agrupamento[d.projetoSE] = {};
      }
      if (!agrupamento[d.projetoSE][d.disciplina]) {
        agrupamento[d.projetoSE][d.disciplina] = { soma: 0, count: 0 };
      }
      agrupamento[d.projetoSE][d.disciplina].soma += Math.abs(d.diferencaData);
      agrupamento[d.projetoSE][d.disciplina].count++;
    }
  });
  
  // Criar matriz de valores (média de dias de atraso)
  const z = disciplinas.map(disciplina => 
    projetos.map(projeto => {
      const item = agrupamento[projeto]?.[disciplina];
      return item ? item.soma / item.count : 0;
    })
  );
  
  const trace = {
    x: projetos,
    y: disciplinas,
    z: z,
    type: 'heatmap',
    colorscale: [[0, 'green'], [0.5, 'yellow'], [1, 'red']],
    showscale: true,
    colorbar: {
      title: 'Atraso Médio (dias)'
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
 * Cria gráfico de Gantt (timeline)
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoGantt(dados) {
  const canvas = document.getElementById('chartGantt');
  if (!canvas) return;
  
  if (graficosInstancias.chartGantt) {
    graficosInstancias.chartGantt.destroy();
  }
  
  // Preparar dados: limitar a 100 documentos para performance
  const dadosLimitados = dados.slice(0, 100);
  
  const labels = dadosLimitados.map(d => d.noVale || 'N/A');
  const previstos = dadosLimitados.map(d => d.dataPrevisto ? d.dataPrevisto.getTime() : null);
  const realizados = dadosLimitados.map(d => d.dataGRRec ? d.dataGRRec.getTime() : null);
  
  // Converter para dias desde uma data base
  const dataBase = Math.min(...previstos.filter(p => p !== null));
  const previstosDias = previstos.map(p => p ? (p - dataBase) / (1000 * 60 * 60 * 24) : null);
  const realizadosDias = realizados.map(r => r ? (r - dataBase) / (1000 * 60 * 60 * 24) : null);
  
  graficosInstancias.chartGantt = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Previsto',
          data: previstosDias,
          backgroundColor: 'rgba(128, 128, 128, 0.5)'
        },
        {
          label: 'Realizado',
          data: realizadosDias,
          backgroundColor: dadosLimitados.map(d => {
            if (!d.dataGRRec) return 'rgba(255, 0, 0, 0.5)';
            if (d.diferencaData && Math.abs(d.diferencaData) > 5) return 'rgba(255, 165, 0, 0.5)';
            return 'rgba(0, 255, 0, 0.5)';
          })
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Dias desde data base'
          }
        }
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
  
  graficosInstancias.chartDistribuicao = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
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
          position: 'bottom'
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
      agrupamento[projeto] = { emitido: 0, naoEmitido: 0, naoEncontrado: 0 };
    }
    if (d.emitido) {
      agrupamento[projeto].emitido++;
    } else if (d.encontradoNoCSV) {
      agrupamento[projeto].naoEmitido++;
    } else {
      agrupamento[projeto].naoEncontrado++;
    }
  });
  
  const projetos = Object.keys(agrupamento);
  const emitidos = projetos.map(p => agrupamento[p].emitido);
  const naoEmitidos = projetos.map(p => agrupamento[p].naoEmitido);
  const naoEncontrados = projetos.map(p => agrupamento[p].naoEncontrado);
  
  graficosInstancias.chartBarrasEmpilhadas = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: projetos,
      datasets: [
        {
          label: 'Emitido',
          data: emitidos,
          backgroundColor: 'rgba(0, 255, 0, 0.8)'
        },
        {
          label: 'Não Emitido',
          data: naoEmitidos,
          backgroundColor: 'rgba(255, 165, 0, 0.8)'
        },
        {
          label: 'Não Encontrado',
          data: naoEncontrados,
          backgroundColor: 'rgba(255, 0, 0, 0.8)'
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
 * Cria gráfico de dispersão: Atraso vs Volume
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoDispersao(dados) {
  const canvas = document.getElementById('chartDispersao');
  if (!canvas) return;
  
  if (graficosInstancias.chartDispersao) {
    graficosInstancias.chartDispersao.destroy();
  }
  
  // Agrupar por projeto ou disciplina
  const agrupamento = {};
  dados.forEach(d => {
    const key = d.projetoSE || d.disciplina || 'N/A';
    if (!agrupamento[key]) {
      agrupamento[key] = { volume: 0, atrasos: [], discrepancias: 0 };
    }
    agrupamento[key].volume++;
    if (d.diferencaData !== null) {
      agrupamento[key].atrasos.push(Math.abs(d.diferencaData));
      if (d.diferencaData !== 0) agrupamento[key].discrepancias++;
    }
  });
  
  const labels = Object.keys(agrupamento);
  const volumes = labels.map(l => agrupamento[l].volume);
  const atrasosMedios = labels.map(l => {
    const atrasos = agrupamento[l].atrasos;
    return atrasos.length > 0 ? atrasos.reduce((a, b) => a + b, 0) / atrasos.length : 0;
  });
  const tamanhos = labels.map(l => agrupamento[l].discrepancias);
  
  graficosInstancias.chartDispersao = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Projetos/Disciplinas',
        data: volumes.map((v, i) => ({ x: v, y: atrasosMedios[i] })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: tamanhos.map(t => Math.max(5, Math.min(20, t + 5)))
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              return `${labels[index]}: Volume=${volumes[index]}, Atraso médio=${atrasosMedios[index].toFixed(1)} dias`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Volume de Documentos'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Atraso Médio (dias)'
          }
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
  
  // Criar matriz de taxas (percentual de emitidos)
  const z = disciplinas.map(disciplina => 
    projetos.map(projeto => {
      const item = agrupamento[projeto]?.[disciplina];
      return item && item.total > 0 ? (item.emitidos / item.total) * 100 : 0;
    })
  );
  
  const trace = {
    x: projetos,
    y: disciplinas,
    z: z,
    type: 'heatmap',
    colorscale: [[0, 'red'], [0.5, 'yellow'], [1, 'green']],
    showscale: true,
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
 * Cria gráfico de área: Acúmulo temporal
 * @param {Array} dados - Dados filtrados
 */
function criarGraficoAreaAcumulo(dados) {
  const canvas = document.getElementById('chartAreaAcumulo');
  if (!canvas) return;
  
  if (graficosInstancias.chartAreaAcumulo) {
    graficosInstancias.chartAreaAcumulo.destroy();
  }
  
  // Agrupar por período
  const agrupamento = {};
  dados.forEach(d => {
    if (d.dataPrevisto) {
      const periodo = `${d.dataPrevisto.getFullYear()}-${String(d.dataPrevisto.getMonth() + 1).padStart(2, '0')}`;
      if (!agrupamento[periodo]) {
        agrupamento[periodo] = { previsto: 0, realizado: 0, emitido: 0, naoEmitido: 0 };
      }
      agrupamento[periodo].previsto++;
      
      if (d.dataGRRec) {
        const periodoRealizado = `${d.dataGRRec.getFullYear()}-${String(d.dataGRRec.getMonth() + 1).padStart(2, '0')}`;
        if (!agrupamento[periodoRealizado]) {
          agrupamento[periodoRealizado] = { previsto: 0, realizado: 0, emitido: 0, naoEmitido: 0 };
        }
        agrupamento[periodoRealizado].realizado++;
        if (d.emitido) {
          agrupamento[periodoRealizado].emitido++;
        } else {
          agrupamento[periodoRealizado].naoEmitido++;
        }
      }
    }
  });
  
  const periodos = Object.keys(agrupamento).sort();
  
  // Calcular acúmulo
  let acumuloPrevisto = 0;
  let acumuloRealizado = 0;
  let acumuloEmitido = 0;
  let acumuloNaoEmitido = 0;
  
  const previstosAcum = [];
  const realizadosAcum = [];
  const emitidosAcum = [];
  const naoEmitidosAcum = [];
  
  periodos.forEach(periodo => {
    acumuloPrevisto += agrupamento[periodo].previsto;
    acumuloRealizado += agrupamento[periodo].realizado;
    acumuloEmitido += agrupamento[periodo].emitido;
    acumuloNaoEmitido += agrupamento[periodo].naoEmitido;
    
    previstosAcum.push(acumuloPrevisto);
    realizadosAcum.push(acumuloRealizado);
    emitidosAcum.push(acumuloEmitido);
    naoEmitidosAcum.push(acumuloNaoEmitido);
  });
  
  graficosInstancias.chartAreaAcumulo = new Chart(canvas, {
    type: 'line',
    data: {
      labels: periodos,
      datasets: [
        {
          label: 'Acúmulo Previsto',
          data: previstosAcum,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true
        },
        {
          label: 'Acúmulo Realizado',
          data: realizadosAcum,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true
        },
        {
          label: 'Acúmulo Emitido',
          data: emitidosAcum,
          borderColor: 'rgb(0, 255, 0)',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          fill: true
        },
        {
          label: 'Acúmulo Não Emitido',
          data: naoEmitidosAcum,
          borderColor: 'rgb(255, 165, 0)',
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          fill: true
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
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
