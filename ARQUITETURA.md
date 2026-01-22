# ARQUITETURA.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 21/01/2026

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
│  │    Bibliotecas Externas (CDN)     │  │
│  │  - SheetJS (xlsx.js)              │  │
│  │  - PapaParse (CSV)                │  │
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
- Conversão de PREVISTO 2 para DataPrevisto (objeto Date)
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
```

## Fluxo de Dados

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
- Cada arquivo possui um botão "Ver Detalhes ProcessarNomeERevisao"
- Ao clicar, exibe:
  - LD Final e Revisão Final
  - Lista completa de fontes LD encontradas
  - Lista completa de fontes de Revisão encontradas
  - Contadores de quantas fontes foram encontradas

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
  - `Papa.parse()` - Parsear CSV
  - `Papa.unparse()` - Converter dados para CSV

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

- Processamento assíncrono para não bloquear UI
- Processamento em chunks para arquivos grandes
- Feedback visual durante processamento
- Limite de tamanho de arquivo: 10MB
- ProcessarNomeERevisao busca em até 200 linhas por fonte para otimizar performance

## Segurança

- Processamento 100% client-side (sem envio de dados)
- Validação de tipos de arquivo
- Sanitização de dados de entrada
- Tratamento de erros robusto

## Extensibilidade

A arquitetura permite:
- Adição de novos formatos de entrada
- Novos tipos de validação
- Novos formatos de exportação
- Integração com APIs futuras
