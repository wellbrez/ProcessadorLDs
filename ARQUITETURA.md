# ARQUITETURA.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 26/01/2026

## Arquitetura do Sistema

O ProcessadorLDs é uma aplicação web standalone que roda completamente no cliente (browser), sem necessidade de servidor ou backend.

## Visão Geral

```
┌─────────────────────────────────────────┐
│         Navegador Web (Cliente)          │
│  ┌───────────────────────────────────┐  │
│  │         index.html                 │  │
│  │  (Interface do Usuário)            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │         processor.js              │  │
│  │  (Lógica de Processamento)        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │         validator.js              │  │
│  │  (Validações de Dados)            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │         exporter.js               │  │
│  │  (Exportação de Resultados)      │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      postprocessor.js             │  │
│  │  (Pós-Processamento CSV)          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │        dashboard.js               │  │
│  │  (Visualizações e Gráficos)       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │         app.js                    │  │
│  │  (Orquestração da Aplicação)      │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │    Bibliotecas Externas (CDN)     │  │
│  │  - SheetJS (xlsx.js)              │  │
│  │  - PapaParse (CSV)                │  │
│  │  - Chart.js 4.4.0                 │  │
│  │  - Plotly.js 2.27.0                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Componentes Principais

### 1. Interface (index.html)

**Responsabilidades:**
- Interface do usuário
- Upload de arquivos
- Exibição de resultados
- Controles de exportação

**Tecnologias:**
- HTML5
- CSS3
- JavaScript (ES6+)

### 2. Processador (processor.js)

**Responsabilidades:**
- Leitura de arquivos (CSV, XLSX)
- ProcessarNomeERevisao: Extração de LD e revisão de 3 fontes (nome arquivo, CAPA/ROSTO, folha principal)
- Identificação de cabeçalho "NO VALE"
- Transformação de cabeçalho com células mescladas (FillDown + combinação com índice)
- Transformação de dados
- Normalização de colunas usando tabela de conversão
- Extração de disciplina do número do vale
- Conversão de PREVISTO 2 para DataPrevisto (objeto Date) - suporta formatos dd/MM/yyyy e dd/MM/yy
- Filtragem de linhas com AÇÕES = "E"

**Funções Principais:**

```javascript
/**
 * @swagger
 * Processa Nome e Revisão da LD - Extrai informações de LD e revisão de todas as fontes disponíveis
 * Executado ANTES de identificar cabeçalho, pois não depende do cabeçalho estar presente
 * @param {string} nomeArquivo - Nome do arquivo
 * @param {Object} estruturaArquivo - Estrutura do arquivo com dadosCapa e dadosPrincipal
 * @param {Array} dadosBrutos - Dados brutos da folha principal
 * @returns {Object} Objeto com ldsEncontradas, revisoesEncontradas e informações detalhadas
 */
function ProcessarNomeERevisao(nomeArquivo, estruturaArquivo, dadosBrutos)

/**
 * @swagger
 * Processa um arquivo LD e retorna dados transformados
 * @param {File} arquivo - Arquivo LD a ser processado
 * @returns {Promise<Object>} Dados processados e status, incluindo processarNomeERevisao
 */
async function processarArquivo(arquivo)

/**
 * @swagger
 * Identifica o cabeçalho "NO VALE" na planilha
 * @param {Array} linhas - Linhas da planilha
 * @returns {number} Índice da linha do cabeçalho ou null
 */
function identificarCabecalho(linhas)

/**
 * @swagger
 * Transforma dados brutos em formato padronizado
 * Implementa lógica do Power Query para células mescladas (FillDown + combinação com índice)
 * @param {Array} dadosBrutos - Dados brutos da planilha
 * @param {number} indiceCabecalho - Índice da linha do cabeçalho
 * @returns {Array} Dados transformados
 */
function transformarDados(dadosBrutos, indiceCabecalho)

/**
 * @swagger
 * Extrai disciplina do número do vale
 * @param {string} noVale - Número do vale
 * @returns {string|null} Disciplina extraída
 */
function extrairDisciplina(noVale)

/**
 * @swagger
 * Extrai informações do nome do arquivo (LD e revisão)
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {Object} Objeto com propriedades ld e revisao
 */
function extrairInfoNomeArquivo(nomeArquivo)

/**
 * @swagger
 * Extrai informações do conteúdo da planilha (LD e revisão)
 * @param {Array} dadosBrutos - Dados brutos da planilha
 * @returns {Object} Objeto com propriedades ld e revisao
 */
function extrairInfoDoConteudo(dadosBrutos)
```

### 3. Validador (validator.js)

**Responsabilidades:**
- Validação de dados obrigatórios
- Verificação de formato de arquivo
- Identificação de problemas
- Geração de mensagens de erro

**Funções Principais:**

```javascript
/**
 * @swagger
 * Valida dados obrigatórios de uma linha
 * @param {Object} linha - Linha de dados
 * @returns {Object} Resultado da validação
 */
function validarLinha(linha)

/**
 * @swagger
 * Valida formato do nome do arquivo
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {boolean} true se válido
 */
function validarNomeArquivo(nomeArquivo)

/**
 * @swagger
 * Identifica problemas em uma LD processada
 * @param {Object} dadosProcessados - Dados processados
 * @returns {Array} Lista de problemas encontrados
 */
function identificarProblemas(dadosProcessados)
```

### 4. Exportador (exporter.js)

**Responsabilidades:**
- Exportação para CSV
- Exportação para XLSX
- Exportação para JSON
- Geração de relatórios
- Exportação específica de dados de pós-processamento

**Funções Principais:**

```javascript
/**
 * @swagger
 * Exporta dados para CSV
 * @param {Array} dados - Dados a exportar
 * @param {string} nomeArquivo - Nome do arquivo de saída
 */
function exportarCSV(dados, nomeArquivo)

/**
 * @swagger
 * Exporta dados para XLSX
 * @param {Object} dados - Dados a exportar
 * @param {string} nomeArquivo - Nome do arquivo de saída
 */
function exportarXLSX(dados, nomeArquivo)

/**
 * @swagger
 * Exporta dados para JSON
 * @param {Object} dados - Dados a exportar
 * @param {string} nomeArquivo - Nome do arquivo de saída
 */
function exportarJSON(dados, nomeArquivo)

/**
 * @swagger
 * Exporta dados do pós-processamento
 * @param {Object} resultadoPosProcessamento - Resultado do pós-processamento
 * @param {string} formato - Formato de exportação ('csv', 'xlsx', 'json')
 * @param {string} nomeArquivo - Nome do arquivo de saída
 */
function exportarPosProcessamentoDados(resultadoPosProcessamento, formato, nomeArquivo)
```

### 5. Pós-Processador (postprocessor.js)

**Responsabilidades:**
- Carregamento e processamento de CSV gerencial (otimizado para arquivos grandes)
- Validação de vales contra extrato oficial do sistema
- Cálculo dinâmico de EMISSAO (PRIMEMISSAO, REVISAO, FICHA) baseado em ordenação de revisões
- Cálculo dinâmico de PRIMCERTIFICACAO (primeira certificação por vale)
- Verificação de emissão usando EMISSAO calculado
- Verificação de certificação usando PRIMCERTIFICACAO calculado
- Comparação de datas (Data GR Rec vs REALIZADO 2)
- Coleta de vales das LDs para filtragem prévia

**CSV Gerencial Consolidado:**
- Extrato oficial do sistema de gestão de documentos
- Contém histórico completo de vales e revisões
- Arquivos podem chegar a 3GB
- Colunas principais: Número Vale, Num. Vale Antigo, Revisão, Tp. Emissão, Final. Devol, Data GR Rec, Projeto/SE, Empresa, Title, etc.
- Colunas removidas do processamento: EMISSAO (calculado dinamicamente), NUMEROABAIXO, GR REC ABAIXO

**Funções Principais:**

```javascript
/**
 * @swagger
 * Normaliza número do vale para comparação
 * @param {string} noVale - Número do vale
 * @returns {string} Número do vale normalizado
 */
function normalizarNumeroVale(noVale)

/**
 * @swagger
 * Calcula ordem numérica para ordenação de revisões
 * Ordem: -1 → 0, A-Z → 1-26, 0+ → 27+
 * @param {string|number} revisao - Valor da revisão
 * @returns {number} Ordem numérica para ordenação
 */
function calcularOrdemRevisao(revisao)

/**
 * @swagger
 * Calcula EMISSAO dinamicamente para um grupo de linhas do mesmo vale
 * Ordena linhas por Número Vale e depois por ordem de revisão
 * Atribui: -1 → FICHA, primeira não-FICHA → PRIMEMISSAO, demais → REVISAO
 * @param {Array} linhasCSV - Array de linhas do CSV do mesmo vale
 * @returns {Array} Array de linhas ordenadas com campo EMISSAO calculado
 */
function calcularEmissaoParaVale(linhasCSV)

/**
 * @swagger
 * Calcula PRIMCERTIFICACAO para um grupo de linhas do mesmo vale
 * Encontra primeira linha com revisão numérica, tp≠B, Final.Devol=APR
 * @param {Array} linhasCSV - Array de linhas do CSV já ordenadas (deve ter sido processado por calcularEmissaoParaVale)
 * @returns {Array} Array de linhas com campo PRIMCERTIFICACAO calculado
 */
function calcularPrimCertificacaoParaVale(linhasCSV)

/**
 * @swagger
 * Coleta todos os números de vale das LDs processadas
 * @param {Array} dadosLDs - Array de dados processados das LDs
 * @returns {Set<string>} Set com todos os números de vale normalizados
 */
function coletarValesDasLDs(dadosLDs)

/**
 * @swagger
 * Carrega CSV gerencial de forma otimizada (até 3GB)
 * Filtra apenas vales relevantes durante carregamento
 * Armazena múltiplas linhas por vale (necessário para ordenação e cálculos)
 * @param {File} arquivo - Arquivo CSV gerencial
 * @param {Set<string>} valesParaBuscar - Set de vales para filtrar
 * @param {Function} callbackProgresso - Callback para atualizar progresso
 * @returns {Promise<Map>} Map<valeNormalizado, Array<linhaReduzida>> - Índice do CSV por número do vale
 */
function carregarCSVGerencial(arquivo, valesParaBuscar, callbackProgresso)

/**
 * @swagger
 * Processa pós-processamento de todas as LDs validadas contra o CSV
 * Aplica cálculos dinâmicos de EMISSAO e PRIMCERTIFICACAO
 * @param {Array} dadosLDs - Array de dados processados das LDs
 * @param {Map} indiceCSV - Map<valeNormalizado, Array<linhaReduzida>> do CSV
 * @param {Function} callbackProgresso - Função callback para atualizar progresso
 * @returns {Object} Objeto consolidado com resultados do pós-processamento
 */
function processarPosProcessamento(dadosLDs, indiceCSV, callbackProgresso)
```

**Otimizações para Arquivos Grandes:**
- Filtragem prévia: Processa apenas vales relevantes das LDs
- Identificação de vales: Usa apenas 'Número Vale' e 'Num. Vale Antigo' (desconsidera outras colunas durante filtragem)
- Chunks grandes: 100.000 linhas por chunk para arquivos > 1GB
- Pausas mínimas: 1ms entre chunks para não bloquear UI
- Armazenamento mínimo: Apenas campos necessários por linha (14 campos)
- Múltiplas linhas por vale: Armazena todas as linhas de cada vale (necessário para ordenação e cálculos)

**Campos Extraídos do CSV:**
- Campos para identificação: 'Número Vale', 'Num. Vale Antigo'
- Campos para cálculos: 'Revisão', 'Tp. Emissão', 'Final. Devol'
- Campos removidos do processamento inicial: 'EMISSAO' (calculado dinamicamente), 'NUMEROABAIXO', 'GR REC ABAIXO'
- Outros campos: 'Data GR Rec', 'Projeto/SE', 'Empresa', 'Title', 'GR Recebimento', 'Status', 'Fase', 'Formato', 'Responsável'

**Cálculo Dinâmico de EMISSAO:**
1. Agrupa linhas por vale (Número Vale normalizado)
2. Ordena linhas de cada vale:
   - Primeiro por 'Número Vale' (já agrupado)
   - Depois por ordem de revisão usando `calcularOrdemRevisao()`:
     - Revisão '-1' → ordem 0 (primeira)
     - Revisões alfabéticas (A-Z) → ordem 1-26
     - Revisões numéricas (0+) → ordem 27+
3. Atribui EMISSAO:
   - Linhas com revisão '-1' → 'FICHA'
   - Primeira linha não-FICHA → 'PRIMEMISSAO'
   - Demais linhas não-FICHA → 'REVISAO'

**Cálculo Dinâmico de PRIMCERTIFICACAO:**
1. Para cada grupo de linhas do mesmo vale (já ordenadas):
2. Percorre linhas em ordem até encontrar primeira que atende:
   - Revisão é numérica (não alfabética e não '-1')
   - 'Tp. Emissão' ≠ 'B'
   - 'Final. Devol' = 'APR'
3. Marca essa linha com `PRIMCERTIFICACAO = true`
4. Demais linhas recebem `PRIMCERTIFICACAO = false`

### 6. Dashboard (dashboard.js)

**Responsabilidades:**
- Criação e gerenciamento de visualizações avançadas
- Preparação de dados mesclados (LDs + CSV)
- Aplicação de filtros
- Renderização de gráficos Chart.js e Plotly.js
- Gerenciamento de memória (destruição de gráficos)

**Funções Principais:**

```javascript
/**
 * @swagger
 * Prepara dados mesclados das LDs e do CSV
 * @param {Array} resultadosProcessamento - Dados processados das LDs
 * @param {Object} resultadoPosProcessamento - Resultado do pós-processamento
 * @returns {Array} Array de dados mesclados
 */
function prepararDadosMesclados(resultadosProcessamento, resultadoPosProcessamento)

/**
 * @swagger
 * Aplica filtros aos dados mesclados
 * @param {Array} dadosMesclados - Dados mesclados
 * @param {Object} filtros - Objeto com filtros
 * @returns {Array} Dados filtrados
 */
function aplicarFiltros(dadosMesclados, filtros)

/**
 * @swagger
 * Atualiza todos os gráficos do dashboard
 * @param {Array} dadosFiltrados - Dados filtrados para visualização
 */
function atualizarTodosGraficos(dadosFiltrados)

/**
 * @swagger
 * Destrói todos os gráficos para liberar memória
 */
function destruirGraficos()
```

**Visualizações Implementadas:**
- `criarGraficoTemporal()` - Bar Chart lado a lado com tabela resumo (Chart.js)
- `criarMapaCalorTemporal()` - Heatmap 2D (Plotly.js)
- `criarGraficoDistribuicao()` - Doughnut Chart com número/percentual + tabela resumo (Chart.js)
- `criarGrafico3D()` - 3D Scatter (Plotly.js)
- `criarMapaCalorEmissao()` - Heatmap 2D com máximo 100% (Plotly.js)
- `criarMapaCalorCertificacao()` - Heatmap 2D com máximo 100% (Plotly.js)
- `criarGraficoBarrasEmpilhadas()` - Stacked Bar Chart por status (Chart.js)
- `criarGraficoGantt()` - Multi-line Chart de evolução temporal (Chart.js)
- `criarGraficoAreaAcumulo()` - Line Chart de acúmulo de documentos (Chart.js)
- `criarGraficoAreaAcumuloCertificacao()` - Line Chart de acúmulo de certificação (Chart.js)

### 7. Aplicação Principal (app.js)

**Responsabilidades:**
- Orquestração de todos os módulos
- Gerenciamento de estado da aplicação
- Event listeners e interações do usuário
- Integração de inconsistências no modal de detalhes
- Gerenciamento de tabs do dashboard
- Persistência de dados no navegador

**Funções Principais:**

```javascript
/**
 * @swagger
 * Processa múltiplos arquivos de LD
 */
async function processarArquivos()

/**
 * @swagger
 * Executa pós-processamento com CSV gerencial
 */
async function executarPosProcessamento()

/**
 * @swagger
 * Exibe resultados do pós-processamento
 */
function exibirResultadosPosProcessamento()

/**
 * @swagger
 * Alterna entre abas do dashboard
 */
function alternarAbaDashboard(tabName)

/**
 * @swagger
 * Inicializa o dashboard
 */
function inicializarDashboard()

/**
 * @swagger
 * Salva dados do pós-processamento no navegador
 */
function salvarDadosPosProcessamento()

/**
 * @swagger
 * Carrega dados salvos do pós-processamento
 */
function carregarDadosPosProcessamento()
```

## Fluxo de Dados

### Fluxo Principal (Processamento de LDs)

```
1. Usuário seleciona arquivo(s)
   ↓
2. FileReader lê arquivo (Excel ou CSV)
   ↓
3. processor.js ProcessarNomeERevisao (extrai LD e revisão de 3 fontes)
   ↓
4. processor.js identifica cabeçalho "NO VALE"
   ↓
5. processor.js transforma cabeçalho (FillDown + células mescladas)
   ↓
6. processor.js transforma dados (normalização, limpeza, extração)
   ↓
7. processor.js converte PREVISTO 2 para DataPrevisto
   ↓
8. processor.js filtra linhas com AÇÕES = "E"
   ↓
9. validator.js valida dados obrigatórios
   ↓
10. Resultados exibidos na interface (com detalhes do ProcessarNomeERevisao)
   ↓
11. Usuário pode exportar resultados
   ↓
12. exporter.js gera arquivo de saída
```

### Fluxo de Pós-Processamento

```
1. Após processamento de LDs, usuário seleciona CSV gerencial
   ↓
2. postprocessor.js coleta vales das LDs processadas
   ↓
3. postprocessor.js carrega CSV gerencial em chunks (otimizado)
   - Filtra apenas vales relevantes durante carregamento
   - Processa em chunks de 100.000 linhas (arquivos grandes)
   - Armazena apenas campos necessários
   ↓
4. postprocessor.js processa validação:
   - Verifica se vale existe no CSV
   - Verifica se foi emitido (PrimEmissao)
   - Compara Data GR Rec com REALIZADO 2
   ↓
5. Resultados exibidos na interface
   ↓
6. Dados salvos automaticamente no localStorage
   ↓
7. Usuário pode acessar Dashboard para visualizações
   ↓
8. dashboard.js prepara dados mesclados (LDs + CSV)
   ↓
9. dashboard.js aplica filtros e cria visualizações
   ↓
10. Usuário pode exportar resultados de validação
```

## ProcessarNomeERevisao

### Visão Geral

A função `ProcessarNomeERevisao` é uma etapa crítica do processamento que extrai informações de LD e revisão de múltiplas fontes **antes** de identificar o cabeçalho, pois essas informações não dependem do cabeçalho estar presente.

### Fontes de Extração

1. **Nome do Arquivo**
   - Usa regex para padrões: `LD-8001PZ-F-XXXXX_REV_N` ou `DF-LD-8001PZ-F-XXXXX_REV_N`
   - Extrai o ID completo da LD (ex: `LD_8001PZ-F-11047`)
   - Extrai a revisão (numérica ou alfanumérica)

2. **Folha CAPA/ROSTO**
   - Busca no conteúdo da folha de capa/rosto (se existir)
   - Procura padrões de LD e revisão nas primeiras 200 linhas
   - Aceita padrões iniciando com `DF-LD-` ou `LD-`

3. **Folha Principal da LD**
   - Busca no conteúdo da folha principal
   - Procura padrões de LD e revisão nas primeiras 200 linhas
   - Aceita padrões iniciando com `DF-LD-` ou `LD-`

### Validação de Consistência

- Se múltiplas fontes retornam valores diferentes para LD, adiciona erro: "Inconsistência de LD"
- Se múltiplas fontes retornam valores diferentes para revisão, adiciona erro: "Inconsistência de Revisão"
- Se todas as fontes retornam o mesmo valor, processamento continua normalmente

### Informações Retornadas

```javascript
{
  ldsEncontradas: [
    { fonte: 'Nome do arquivo', valor: 'LD_8001PZ-F-11047' },
    { fonte: 'Folha CAPA/ROSTO', valor: 'LD_8001PZ-F-11047' },
    { fonte: 'Folha da LD', valor: 'LD_8001PZ-F-11047' }
  ],
  revisoesEncontradas: [
    { fonte: 'Nome do arquivo', valor: '0' },
    { fonte: 'Folha CAPA/ROSTO', valor: '0' },
    { fonte: 'Folha da LD', valor: '0' }
  ],
  totalFontesLD: 3,
  totalFontesRevisao: 3,
  ldFinal: 'LD_8001PZ-F-11047',
  revisaoFinal: '0'
}
```

### Exibição na Interface

As informações detalhadas do `ProcessarNomeERevisao` estão disponíveis na tabela de status:
- Cada arquivo possui um botão "Ver Detalhes"
- Ao clicar, exibe modal com:
  - **Identificação da LD**: LD Final e Revisão Final, fontes encontradas
  - **Estatísticas de Processamento**: Colunas processadas, linhas válidas/inválidas
  - **Inconsistências do Pós-Processamento** (se disponível):
    - Vales não encontrados no CSV (com lista de vales)
    - Vales não emitidos (encontrados mas sem PrimEmissao)
    - Discrepâncias de data (Data GR Rec vs REALIZADO 2) com diferença em dias
  - **Linhas com Erro**: Tabela detalhada com erros por linha
- **Status Visual**: Badges coloridos no status da LD indicando inconsistências:
  - ❌ Vermelho: Vales não encontrados no CSV
  - ⚠️ Amarelo: Discrepâncias de data
  - ✅ Verde: Todos os vales validados com sucesso

## Estrutura de Dados

### Dados Processados

```javascript
{
  nomeArquivo: string,
  ld: string,              // LD final (primeira encontrada ou após validação de consistência)
  revisao: string,         // Revisão final (primeira encontrada ou após validação de consistência)
  dados: Array,            // Array de objetos com dados transformados
  totalLinhas: number,
  linhasProcessadas: number,
  problemas: Array,         // Array de problemas encontrados (inconsistências, etc.)
  processarNomeERevisao: { // Informações detalhadas do ProcessarNomeERevisao
    ldsEncontradas: [      // Array de LDs encontradas em cada fonte
      { fonte: string, valor: string }  // fonte: 'Nome do arquivo' | 'Folha CAPA/ROSTO' | 'Folha da LD'
    ],
    revisoesEncontradas: [ // Array de revisões encontradas em cada fonte
      { fonte: string, valor: string }
    ],
    totalFontesLD: number,
    totalFontesRevisao: number,
    ldFinal: string,
    revisaoFinal: string
  }
}
```

### Status de Processamento

```javascript
{
  nomeArquivo: string,
  status: string, // "Processado", "Erro", "Aviso"
  totalLinhas: number,
  linhasValidas: number,
  linhasIncompletas: number,
  problemas: [
    {
      tipo: string,
      mensagem: string
    }
  ]
}
```

## Bibliotecas Externas

### SheetJS (xlsx.js)
- **Uso**: Leitura e escrita de arquivos Excel
- **CDN**: https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js
- **Funções utilizadas**:
  - `XLSX.read()` - Ler arquivo Excel
  - `XLSX.utils.sheet_to_json()` - Converter planilha para JSON
  - `XLSX.utils.json_to_sheet()` - Converter JSON para planilha
  - `XLSX.writeFile()` - Escrever arquivo Excel

### PapaParse
- **Uso**: Leitura e escrita de arquivos CSV
- **CDN**: https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js
- **Funções utilizadas**:
  - `Papa.parse()` - Parsear CSV (com chunk para arquivos grandes)
  - `Papa.unparse()` - Converter dados para CSV

### Chart.js
- **Uso**: Gráficos 2D interativos
- **CDN**: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
- **Tipos utilizados**:
  - Line Chart (temporal, área)
  - Bar Chart (horizontal para Gantt, empilhado)
  - Doughnut Chart (distribuição)
  - Scatter Chart (dispersão)

### Plotly.js
- **Uso**: Gráficos 3D e mapas de calor
- **CDN**: https://cdn.plot.ly/plotly-2.27.0.min.js
- **Tipos utilizados**:
  - Heatmap 2D (mapas de calor)
  - Scatter3D (visualização 3D)

## Transformação de Cabeçalho com Células Mescladas

### Lógica do Power Query

O sistema implementa a mesma lógica do Power Query original para lidar com células mescladas no cabeçalho:

1. **FillDown**: Preenche células vazias com o valor da célula acima
   - Quando há uma célula mesclada "PREVISTO" cobrindo 3 colunas, as células vazias recebem "PREVISTO"

2. **Combinação com Índice**: Cria identificadores únicos para cada coluna
   - "PREVISTO" (primeira coluna) → "PREVISTO 0"
   - "PREVISTO" (segunda coluna) → "PREVISTO 1"
   - "PREVISTO" (terceira coluna) → "PREVISTO 2"

3. **Conversão via Tabela**: Normaliza os nomes
   - "PREVISTO 0" → "PREVISTO"
   - "PREVISTO 1" → "PREVISTO 1"
   - "PREVISTO 2" → "PREVISTO 2"

### Aplicação

Esta lógica se aplica a:
- PREVISTO, PREVISTO 1, PREVISTO 2
- REPROGRAMADO, REPROGRAMADO 1, REPROGRAMADO 2
- REALIZADO, REALIZADO 1, REALIZADO 2

## Considerações de Performance

### Processamento de LDs
- Processamento assíncrono para não bloquear UI
- Processamento em chunks para arquivos grandes
- Feedback visual durante processamento
- Limite de tamanho de arquivo: 10MB
- ProcessarNomeERevisao busca em até 200 linhas por fonte para otimizar performance

### Processamento de CSV Gerencial
- **Filtragem prévia**: Processa apenas vales relevantes das LDs (redução drástica de memória)
- **Chunks adaptativos**: 100.000 linhas por chunk para arquivos > 1GB, 50.000 para > 500MB
- **Pausas mínimas**: 1ms entre chunks para não bloquear UI
- **Armazenamento otimizado**: Apenas 12 campos necessários por linha
- **Uma linha por vale**: Prioriza PrimEmissao quando disponível
- **Limpeza agressiva**: Libera memória após cada chunk
- **Suporte**: Arquivos de até 3GB

### Dashboard
- **Debounce**: Atualizações de gráficos com debounce para evitar sobrecarga
- **Lazy loading**: Gráficos criados apenas quando visíveis
- **Destruição de gráficos**: Libera memória ao trocar de aba
- **Cache de dados**: Evita reprocessamento desnecessário
- **requestAnimationFrame**: Atualizações suaves de UI

## Integração de Inconsistências no Modal de Detalhes

### Funcionalidade

O modal de detalhes de cada LD foi expandido para incluir informações do pós-processamento:

**Seção de Inconsistências do Pós-Processamento:**
- Exibe apenas quando há dados de pós-processamento disponíveis
- Filtra resultados por arquivo/LD específica
- Mostra três tipos de inconsistências:
  1. **Vales Não Encontrados no CSV** (❌ Vermelho)
     - Lista até 10 vales com opção de mostrar mais
  2. **Vales Não Emitidos** (⚠️ Amarelo)
     - Vales encontrados no CSV mas sem PrimEmissao
     - Lista até 10 vales com opção de mostrar mais
  3. **Discrepâncias de Data** (⚠️ Amarelo)
     - Diferença entre Data GR Rec (CSV) e REALIZADO 2 (LD)
     - Mostra diferença em dias
     - Lista até 10 discrepâncias com opção de mostrar mais

**Status Visual na Tabela:**
- Badges coloridos ao lado do status da LD:
  - ❌ + número: Quantidade de vales não encontrados
  - ⚠️ + número: Quantidade de discrepâncias de data
- Classes CSS aplicadas:
  - `status-error`: Vales não encontrados
  - `status-warning`: Discrepâncias de data
  - `status-success`: Todos os vales OK

## Segurança

- Processamento 100% client-side (sem envio de dados)
- Validação de tipos de arquivo
- Sanitização de dados de entrada
- Tratamento de erros robusto
- Dados persistidos apenas localmente (localStorage)

## Persistência de Dados

### LocalStorage
- **Uso**: Armazenamento de dados processados no navegador
- **Estrutura**: JSON serializado com dados completos do processamento
- **Limite**: ~5-10MB (dependendo do navegador)
- **Validação**: Sistema verifica tamanho e alerta se necessário
- **Funcionalidades**:
  - Salvamento automático após processamento
  - Carregamento manual de dados salvos
  - Limpeza de dados salvos
  - Exibição de informações sobre dados salvos

### Dados Persistidos
```javascript
{
  dataProcessamento: string, // ISO timestamp
  resultadoPosProcessamento: Object,
  hashCSV: string,
  resultadosProcessamento: Array,
  resultadoValidacao: Object
}
```

## Extensibilidade

A arquitetura permite:
- Adição de novos formatos de entrada
- Novos tipos de validação
- Novos formatos de exportação
- Novas visualizações no dashboard
- Integração com APIs futuras
- Novos tipos de análise e métricas
