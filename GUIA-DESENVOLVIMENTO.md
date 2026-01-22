# GUIA-DESENVOLVIMENTO.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 21/01/2026

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
│   └── exporter.js         # Exportação
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

- Tamanho máximo de arquivo: 10MB
- Número máximo de linhas por arquivo: 100.000

## Contribuindo

1. Leia este guia
2. Crie uma branch para sua feature
3. Implemente seguindo os padrões
4. Teste adequadamente
5. Documente mudanças
6. Faça pull request

## Recursos

- [SheetJS Documentation](https://docs.sheetjs.com/)
- [PapaParse Documentation](https://www.papaparse.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
