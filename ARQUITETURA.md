# ARQUITETURA.md - ProcessadorLDs

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
- Identificação de cabeçalho
- Transformação de dados
- Normalização de colunas
- Extração de disciplina
- Filtragem de linhas

**Funções Principais:**

```javascript
/**
 * @swagger
 * Processa um arquivo LD e retorna dados transformados
 * @param {File} arquivo - Arquivo LD a ser processado
 * @returns {Promise<Object>} Dados processados e status
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
 * @param {Array} dados - Dados brutos da planilha
 * @returns {Array} Dados transformados
 */
function transformarDados(dados)

/**
 * @swagger
 * Extrai disciplina do número do vale
 * @param {string} noVale - Número do vale
 * @returns {string|null} Disciplina extraída
 */
function extrairDisciplina(noVale)
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
2. FileReader lê arquivo
   ↓
3. processor.js identifica formato e processa
   ↓
4. validator.js valida dados
   ↓
5. Resultados exibidos na interface
   ↓
6. Usuário pode exportar resultados
   ↓
7. exporter.js gera arquivo de saída
```

## Estrutura de Dados

### Dados Processados

```javascript
{
  nomeArquivo: string,
  revisao: string,
  ld: string,
  linhas: [
    {
      noVale: string,
      previsto: string,
      previsto1: string,
      previsto2: string,
      reprogramado: string,
      reprogramado1: string,
      reprogramado2: string,
      realizado: string,
      realizado1: string,
      realizado2: string,
      formato: string,
      paginas: string,
      disciplina: string,
      acoes: string
    }
  ],
  status: {
    totalLinhas: number,
    linhasValidas: number,
    linhasFiltradas: number,
    problemas: Array
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

## Considerações de Performance

- Processamento assíncrono para não bloquear UI
- Processamento em chunks para arquivos grandes
- Feedback visual durante processamento
- Limite de tamanho de arquivo: 10MB

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
