# GUIA-DESENVOLVIMENTO.md - ProcessadorLDs

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

#### `transformarDados(dados)`
Transforma dados brutos em formato padronizado.

**Parâmetros:**
- `dados` (Array): Dados brutos

**Retorna:**
- `Array`: Dados transformados

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

**Campos obrigatórios:**
- NO VALE
- PREVISTO
- PREVISTO 1
- PREVISTO 2
- FORMATO
- PAGS/ FOLHAS
- Disciplina
- DataPrevisto (calculado de PREVISTO 2)

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
  // ... mais conversões
];
```

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
