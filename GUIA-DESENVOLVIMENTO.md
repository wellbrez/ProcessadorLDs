# GUIA-DESENVOLVIMENTO.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 26/01/2026

## Guia para Desenvolvedores

Este guia fornece informações para desenvolvedores que desejam contribuir ou entender o código do ProcessadorLDs.

## Pré-requisitos

- Editor de código (VS Code recomendado)
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conhecimento de HTML, CSS e JavaScript (ES6+)

## Estrutura do Código

```
ProcessadorLDs/
├── index.html              # Interface principal
├── js/
│   ├── processor.js       # Lógica de processamento
│   ├── validator.js        # Validações
│   ├── exporter.js         # Exportação
│   ├── postprocessor.js    # Pós-processamento com CSV
│   ├── dashboard.js        # Visualizações e gráficos
│   └── app.js              # Orquestração da aplicação
├── css/
│   └── styles.css          # Estilos
└── docs/                   # Documentação adicional
```

## Padrões de Código

### JavaScript

- Use ES6+ (arrow functions, async/await, destructuring)
- Sempre adicione comentários JSDoc/Swagger
- Use nomes descritivos para variáveis e funções
- Trate erros adequadamente
- Valide entradas de dados

**Exemplo:**

```javascript
/**
 * @swagger
 * Processa um arquivo LD
 * @param {File} arquivo - Arquivo a ser processado
 * @returns {Promise<Object>} Dados processados
 * @throws {Error} Se o arquivo não puder ser processado
 */
async function processarArquivo(arquivo) {
  try {
    // Validação
    if (!arquivo) {
      throw new Error('Arquivo não fornecido');
    }

    // Processamento
    const dados = await lerArquivo(arquivo);
    return transformarDados(dados);
  } catch (erro) {
    console.error('Erro ao processar arquivo:', erro);
    throw erro;
  }
}
```

### HTML

- Use HTML5 semântico
- Adicione atributos `aria-*` para acessibilidade
- Mantenha estrutura clara e organizada

### CSS

- Use classes descritivas
- Organize por componentes
- Use variáveis CSS para cores e espaçamentos

## Processo de Desenvolvimento

### 1. Setup do Ambiente

1. Clone o repositório
2. Abra `index.html` em um navegador
3. Use o console do navegador para debug

### 2. Desenvolvimento

1. Crie uma branch para sua feature
2. Implemente a funcionalidade
3. Teste localmente
4. Documente mudanças
5. Faça commit e push

### 3. Testes

- Teste com arquivos reais
- Valide diferentes formatos
- Teste casos de erro
- Verifique performance

## Funções Principais

### processor.js

#### `processarArquivo(arquivo)`
Processa um arquivo LD e retorna dados transformados.

**Parâmetros:**
- `arquivo` (File): Arquivo a processar

**Retorna:**
- `Promise<Object>`: Dados processados

**Exemplo:**
```javascript
const resultado = await processarArquivo(arquivoSelecionado);
console.log(resultado.dados);
```

#### `identificarCabecalho(linhas)`
Identifica a linha do cabeçalho "NO VALE".

**Parâmetros:**
- `linhas` (Array): Linhas da planilha

**Retorna:**
- `number|null`: Índice da linha ou null

#### `ProcessarNomeERevisao(nomeArquivo, estruturaArquivo, dadosBrutos)`
Extrai informações de LD e revisão de todas as fontes disponíveis. Executado ANTES de identificar cabeçalho.

**Parâmetros:**
- `nomeArquivo` (string): Nome do arquivo
- `estruturaArquivo` (Object): Estrutura com dadosCapa e dadosPrincipal
- `dadosBrutos` (Array): Dados brutos da folha principal

**Retorna:**
- `Object`: `{ ldsEncontradas: Array, revisoesEncontradas: Array, totalFontesLD: number, totalFontesRevisao: number }`

**Fontes de extração:**
1. Nome do arquivo (regex para padrões LD-8001PZ-F-XXXXX_REV_N)
2. Folha CAPA/ROSTO (se existir)
3. Folha principal da LD

#### `transformarDados(dadosBrutos, indiceCabecalho)`
Transforma dados brutos em formato padronizado. Implementa lógica do Power Query para células mescladas.

**Parâmetros:**
- `dadosBrutos` (Array): Dados brutos da planilha
- `indiceCabecalho` (number): Índice da linha do cabeçalho

**Retorna:**
- `Array`: Dados transformados

**Lógica de transformação do cabeçalho:**
1. FillDown: Preenche células vazias com valor acima (para células mescladas)
2. Combinação com índice: Cria "PREVISTO 0", "PREVISTO 1", "PREVISTO 2" a partir de célula mesclada
3. Conversão: "PREVISTO 0" → "PREVISTO", "PREVISTO 1" → "PREVISTO 1", etc.

#### `converterData(dataStr)`
Converte string ou número para objeto Date. Suporta múltiplos formatos de data.

**Parâmetros:**
- `dataStr` (string|number): Data a converter (pode ser string no formato dd/MM/yyyy, dd/MM/yy, ou número serial do Excel)

**Retorna:**
- `Date|null`: Objeto Date ou null se não conseguir converter

**Formatos suportados:**
1. dd/MM/yyyy (ex: 21/01/2026)
2. dd/MM/yy (ex: 21/01/26 → 2026, 21/01/99 → 1999)
   - Anos 00-49 são interpretados como 2000-2049
   - Anos 50-99 são interpretados como 1950-1999
3. Números seriais do Excel (ex: 44301)
4. yyyy-MM-dd (ISO)
5. Outros formatos genéricos do JavaScript Date

**Lógica:**
1. Verifica primeiro se contém barras (formato de data) antes de tentar como número serial
2. Para anos de 2 dígitos, aplica regra de conversão (00-49 → 2000-2049, 50-99 → 1950-1999)
3. Valida se a data resultante é válida e está no range 1900-2100

#### `extrairDisciplina(noVale)`
Extrai disciplina do número do vale.

**Parâmetros:**
- `noVale` (string): Número do vale

**Retorna:**
- `string|null`: Disciplina ou null

**Lógica:**
1. Reverte a string
2. Extrai valor entre delimitadores "-" e "-"
3. Se tamanho = 1, retorna esse valor
4. Se sétimo caractere = "-", retorna "J"
5. Caso contrário, retorna null

### validator.js

#### `validarLinha(linha)`
Valida dados obrigatórios de uma linha.

**Parâmetros:**
- `linha` (Object): Linha de dados

**Retorna:**
- `Object`: `{ valida: boolean, erros: Array }`

**Campos obrigatórios** (seguindo lógica do Power Query original):
- NO VALE
- PREVISTO (pode vir de célula mesclada no cabeçalho)
- PREVISTO 1 (pode vir de célula mesclada no cabeçalho)
- PREVISTO 2 (pode vir de célula mesclada no cabeçalho, usado para gerar DataPrevisto)
- FORMATO
- PAGS/ FOLHAS
- Disciplina (extraído do NO VALE)
- DataPrevisto (convertido de PREVISTO 2, objeto Date) - aceita formatos dd/MM/yyyy e dd/MM/yy

#### `validarNomeArquivo(nomeArquivo)`
Valida formato do nome do arquivo.

**Parâmetros:**
- `nomeArquivo` (string): Nome do arquivo

**Retorna:**
- `boolean`: true se válido

**Padrão:** `LD_*_REV_*.xlsx` ou `DF_*_REV_*.xlsx`

#### `identificarProblemas(dadosProcessados)`
Identifica problemas em dados processados.

**Parâmetros:**
- `dadosProcessados` (Object): Dados processados

**Retorna:**
- `Array`: Lista de problemas

### exporter.js

#### `exportarCSV(dados, nomeArquivo)`
Exporta dados para CSV.

**Parâmetros:**
- `dados` (Array): Dados a exportar
- `nomeArquivo` (string): Nome do arquivo

#### `exportarXLSX(dados, nomeArquivo)`
Exporta dados para XLSX.

**Parâmetros:**
- `dados` (Object): Dados a exportar (com múltiplas abas)
- `nomeArquivo` (string): Nome do arquivo

#### `exportarJSON(dados, nomeArquivo)`
Exporta dados para JSON.

**Parâmetros:**
- `dados` (Object): Dados a exportar
- `nomeArquivo` (string): Nome do arquivo

#### `exportarPosProcessamentoDados(resultadoPosProcessamento, formato, nomeArquivo)`
Exporta dados do pós-processamento em formato específico.

**Parâmetros:**
- `resultadoPosProcessamento` (Object): Resultado do pós-processamento
- `formato` (string): 'csv', 'xlsx' ou 'json'
- `nomeArquivo` (string): Nome do arquivo de saída

**Retorna:**
- Arquivo baixado automaticamente

### postprocessor.js

#### `coletarValesDasLDs(dadosLDs)`
Coleta todos os números de vale das LDs processadas para filtragem prévia do CSV.

**Parâmetros:**
- `dadosLDs` (Array): Array de dados processados das LDs

**Retorna:**
- `Set<string>`: Set com números de vale normalizados

#### `calcularOrdemRevisao(revisao)`
Calcula ordem numérica para ordenação de revisões.

**Parâmetros:**
- `revisao` (string|number): Valor da revisão

**Retorna:**
- `number`: Ordem numérica (-1 → 0, A-Z → 1-26, 0+ → 27+)

#### `calcularEmissaoParaVale(linhasCSV)`
Calcula EMISSAO dinamicamente para um grupo de linhas do mesmo vale.

**Parâmetros:**
- `linhasCSV` (Array): Array de linhas do CSV do mesmo vale

**Retorna:**
- `Array`: Linhas ordenadas com campo EMISSAO calculado (FICHA, PRIMEMISSAO, REVISAO)

**Lógica:**
1. Ordena por ordem de revisão (usando `calcularOrdemRevisao`)
2. Linhas com revisão '-1' → 'FICHA'
3. Primeira linha não-FICHA → 'PRIMEMISSAO'
4. Demais linhas não-FICHA → 'REVISAO'

#### `calcularPrimCertificacaoParaVale(linhasCSV)`
Calcula PRIMCERTIFICACAO para um grupo de linhas do mesmo vale.

**Parâmetros:**
- `linhasCSV` (Array): Array de linhas já ordenadas (deve ter sido processado por `calcularEmissaoParaVale`)

**Retorna:**
- `Array`: Linhas com campo PRIMCERTIFICACAO calculado (boolean)

**Critérios para PRIMCERTIFICACAO:**
- Revisão numérica (não alfabética e não '-1')
- 'Tp. Emissão' ≠ 'B'
- 'Final. Devol' = 'APR'
- Primeira linha que atende aos critérios recebe `true`

#### `carregarCSVGerencial(arquivo, valesParaBuscar, callbackProgresso)`
Carrega CSV gerencial de forma otimizada, filtrando apenas vales relevantes.

**Parâmetros:**
- `arquivo` (File): Arquivo CSV gerencial
- `valesParaBuscar` (Set<string>): Set de vales para filtrar
- `callbackProgresso` (Function): Função para atualizar progresso

**Retorna:**
- `Promise<Map>`: Map<valeNormalizado, Array<linhaReduzida>> - Múltiplas linhas por vale

**Otimizações:**
- Chunks de 100.000 linhas para arquivos > 1GB
- Armazena apenas campos necessários (14 campos)
- Múltiplas linhas por vale (necessário para ordenação e cálculos)
- Filtragem prévia durante carregamento
- Identificação de vales usa apenas 'Número Vale' e 'Num. Vale Antigo'
- Campos removidos: 'EMISSAO' (calculado dinamicamente), 'NUMEROABAIXO', 'GR REC ABAIXO'

#### `processarPosProcessamento(dadosLDs, indiceCSV, callbackProgresso)`
Processa validação de todas as LDs contra o CSV gerencial.

**Parâmetros:**
- `dadosLDs` (Array): Dados processados das LDs
- `indiceCSV` (Map): Map<valeNormalizado, Array<linhaReduzida>> do CSV
- `callbackProgresso` (Function): Callback para atualizar progresso

**Retorna:**
- `Object`: Resultado com validações e discrepâncias

**Processamento:**
1. Para cada vale, aplica `calcularEmissaoParaVale()` para calcular EMISSAO dinamicamente
2. Aplica `calcularPrimCertificacaoParaVale()` para calcular PRIMCERTIFICACAO
3. Usa linhas com EMISSAO='PRIMEMISSAO' para verificação de emissão
4. Usa linhas com PRIMCERTIFICACAO=true para verificação de certificação

### dashboard.js

#### `prepararDadosMesclados(resultadosProcessamento, resultadoPosProcessamento)`
Combina dados das LDs com dados do CSV em um dataset unificado.

**Parâmetros:**
- `resultadosProcessamento` (Array): Dados processados das LDs
- `resultadoPosProcessamento` (Object): Resultado do pós-processamento

**Retorna:**
- `Array`: Dados mesclados com todos os campos necessários

#### `aplicarFiltros(dadosMesclados, filtros)`
Aplica filtros aos dados mesclados.

**Parâmetros:**
- `dadosMesclados` (Array): Dados mesclados
- `filtros` (Object): Objeto com filtros (projetos, empresas, lds, disciplinas, formatos, dataInicio, dataFim)

**Retorna:**
- `Array`: Dados filtrados

#### `atualizarTodosGraficos(dadosFiltrados)`
Atualiza todos os gráficos do dashboard com dados filtrados.

**Parâmetros:**
- `dadosFiltrados` (Array): Dados filtrados para visualização

#### `destruirGraficos()`
Destrói todos os gráficos para liberar memória.

### app.js

#### `executarPosProcessamento()`
Executa o pós-processamento com CSV gerencial.

#### `exibirResultadosPosProcessamento()`
Exibe resultados do pós-processamento na interface.

#### `alternarAbaDashboard(tabName)`
Alterna entre abas "Resultados" e "Dashboard".

**Parâmetros:**
- `tabName` (string): 'resultados' ou 'dashboard'

#### `inicializarDashboard()`
Inicializa o dashboard com dados disponíveis.

#### `salvarDadosPosProcessamento()`
Salva dados do pós-processamento no localStorage.

#### `carregarDadosPosProcessamento()`
Carrega dados salvos do localStorage.

## Tabela de Conversão de Colunas

O sistema usa uma tabela de conversão para normalizar nomes de colunas. Esta tabela deve ser mantida atualizada conforme novos formatos são identificados.

**Localização:** `js/processor.js` (constante `TABELA_CONVERSAO`)

**Formato:**
```javascript
const TABELA_CONVERSAO = [
  { old: 'NO VALE', new: 'NO VALE' },
  { old: 'VALE DOCUMENT NUMBER', new: 'NO VALE' },
  { old: 'PREVISTO', new: 'PREVISTO' },
  { old: 'PREVISTO 0', new: 'PREVISTO' }, // Célula mesclada - primeira coluna
  { old: 'PREVISTO 1', new: 'PREVISTO 1' },
  { old: 'PREVISTO 2', new: 'PREVISTO 2' },
  // ... mais conversões
];
```

**Nota**: A tabela inclui conversões para células mescladas (ex: "PREVISTO 0" → "PREVISTO") que são criadas durante a transformação do cabeçalho.

## Tratamento de Erros

Sempre trate erros adequadamente:

```javascript
try {
  const resultado = await processarArquivo(arquivo);
  // Sucesso
} catch (erro) {
  if (erro.tipo === 'FORMATO_INVALIDO') {
    // Tratar erro de formato
  } else if (erro.tipo === 'CABECALHO_NAO_ENCONTRADO') {
    // Tratar erro de cabeçalho
  } else {
    // Erro genérico
  }
}
```

## Debugging

### Console do Navegador

Use `console.log()`, `console.error()`, `console.warn()` para debug.

### Breakpoints

Use as ferramentas de desenvolvedor do navegador para adicionar breakpoints.

### Validação de Dados

Adicione logs para validar transformações:

```javascript
console.log('Dados antes da transformação:', dadosBrutos);
const dadosTransformados = transformarDados(dadosBrutos);
console.log('Dados após transformação:', dadosTransformados);
```

## Performance

### Otimizações

- Processe arquivos grandes em chunks
- Use `requestAnimationFrame` para atualizar UI
- Evite processamento síncrono bloqueante

### Limites

- Tamanho máximo de arquivo LD: 10MB
- Tamanho máximo de CSV gerencial: 3GB (com otimizações)
- Número máximo de linhas por arquivo LD: 100.000
- Número máximo de linhas no CSV gerencial: Ilimitado (com filtragem prévia)
- Limite de localStorage: ~5-10MB (dependendo do navegador)

## Estrutura de Dados do Pós-Processamento

### Resultado do Pós-Processamento

```javascript
{
  totalLinhasProcessadas: number,
  valesEncontrados: number,
  valesNaoEncontrados: number,
  valesEmitidos: number,
  valesNaoEmitidos: number,
  discrepânciasData: number,
  resultados: [
    {
      noVale: string,
      arquivo: string,
      ld: string,
      revisao: string,
      encontradoNoCSV: boolean,
      emitido: boolean,
      dadosCSV: {
        dataGRRec: Date,
        finDev: string,
        projetoSE: string,
        empresa: string,
        title: string,
        // ... outros campos
      },
      comparacaoData: {
        iguais: boolean | null,
        dataCSV: Date | null,
        dataLD: Date | null,
        diferenca: number | null
      },
      realizado2Original: string | null
    }
  ]
}
```

## Contribuindo

1. Leia este guia
2. Crie uma branch para sua feature
3. Implemente seguindo os padrões
4. Teste adequadamente
5. Documente mudanças
6. Faça pull request

## Notas sobre Performance

### Processamento de CSV Grande

Ao trabalhar com arquivos grandes (3GB+), considere:
- Filtragem prévia é essencial (coletar vales das LDs primeiro)
- Chunks grandes reduzem overhead
- Pausas mínimas mantêm UI responsiva
- Armazenamento mínimo economiza memória

### Dashboard

- Gráficos são destruídos ao trocar de aba para liberar memória
- Use `destruirGraficos()` antes de criar novos
- Cache dados processados para evitar reprocessamento
- Implemente debounce para atualizações de filtros

## Novos Módulos

### Pós-Processamento (postprocessor.js)

Este módulo adiciona validação contra um CSV gerencial do sistema oficial.

**Principais funcionalidades:**
- Carregamento otimizado de CSVs grandes (até 3GB)
- Filtragem prévia baseada em vales das LDs
- Validação de emissão (PrimEmissao)
- Comparação de datas (Data GR Rec vs REALIZADO 2)

**Otimizações implementadas:**
- Processamento em chunks grandes (100.000 linhas)
- Armazenamento mínimo (apenas campos necessários)
- Filtragem durante carregamento
- Pausas mínimas para não bloquear UI

### Dashboard (dashboard.js)

Módulo dedicado para criação e gerenciamento de visualizações avançadas.

**Bibliotecas utilizadas:**
- Chart.js 4.4.0 para gráficos 2D
- Plotly.js 2.27.0 para gráficos 3D e mapas de calor

**Visualizações disponíveis:**
- 6 gráficos Chart.js (temporal com barras, distribuição com tabela, barras empilhadas, evolução temporal, acúmulo de documentos, acúmulo de certificação)
- 4 visualizações Plotly.js (mapa de calor temporal, 3D, mapa de calor de emissão, mapa de calor de certificação)

**Gerenciamento de memória:**
- Destruição de gráficos ao trocar de aba
- Cache de dados processados
- Lazy loading de gráficos

## Recursos

- [SheetJS Documentation](https://docs.sheetjs.com/)
- [PapaParse Documentation](https://www.papaparse.com/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
