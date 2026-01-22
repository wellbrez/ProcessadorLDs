# PROJETO.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 21/01/2026

## Visão Geral

O ProcessadorLDs é um aplicativo standalone desenvolvido para processar Listas de Documentos (LDs) de forma automatizada, substituindo o processo manual realizado anteriormente via Power Query.

## Objetivo

Processar múltiplas LDs em diversos formatos (CSV, XLSX), extrair dados relevantes, validar informações e identificar problemas que impedem o processamento adequado.

## Escopo

### Funcionalidades Principais

1. **Processamento de Arquivos**
   - Suporte a múltiplos formatos (CSV, XLSX)
   - Processamento em lote
   - Identificação automática de estrutura

2. **Extração de Dados**
   - Número do Vale (NO VALE)
   - Datas previstas (PREVISTO, PREVISTO 1, PREVISTO 2)
   - Datas reprogramadas (REPROGRAMADO, REPROGRAMADO 1, REPROGRAMADO 2)
   - Datas realizadas (REALIZADO, REALIZADO 1, REALIZADO 2)
   - Formato do documento
   - Páginas/Folhas
   - Ações
   - Disciplina (extraída do número do vale)

3. **Validações**
   - Verificação de dados obrigatórios
   - Validação de formato de arquivo
   - Identificação de planilhas inconsistentes
   - Detecção de conteúdo não processável

4. **Relatórios**
   - Status de processamento por LD
   - Lista de problemas encontrados
   - Estatísticas de processamento
   - Exportação de resultados

## Requisitos

### Funcionais

- RF01: Processar arquivos CSV e XLSX
- RF02: Identificar automaticamente o cabeçalho "NO VALE"
- RF03: Extrair dados das colunas especificadas
- RF04: Filtrar linhas com AÇÕES = "E"
- RF05: Validar dados obrigatórios
- RF06: Extrair disciplina do número do vale
- RF07: Gerar relatório de status
- RF08: Exportar resultados em CSV, XLSX ou JSON

### Não Funcionais

- RNF01: Aplicação deve rodar standalone (sem servidor)
- RNF02: Processamento deve ser client-side
- RNF03: Interface responsiva e intuitiva
- RNF04: Suporte a navegadores modernos (Chrome, Firefox, Edge, Safari)
- RNF05: Processamento de arquivos de até 10MB

## Fluxo de Processamento

1. **Entrada**: Usuário seleciona um ou mais arquivos de LD
2. **Leitura**: Sistema lê o arquivo e identifica o formato (Excel ou CSV)
3. **ProcessarNomeERevisao** (executado ANTES de identificar cabeçalho):
   - Extrai LD e revisão do nome do arquivo (regex)
   - Extrai LD e revisão da folha CAPA/ROSTO (se existir)
   - Extrai LD e revisão da folha principal da LD
   - Valida consistência entre as fontes encontradas
   - Retorna informações detalhadas para log/relatório
4. **Identificação**: Localiza o cabeçalho "NO VALE" ou "VALE DOCUMENT NUMBER"
5. **Transformação do Cabeçalho** (lógica do Power Query):
   - Aplica FillDown para células mescladas (preenche células vazias com valor acima)
   - Combina com índice para criar "PREVISTO 0", "PREVISTO 1", "PREVISTO 2" a partir de célula mesclada
   - Converte usando tabela: "PREVISTO 0" → "PREVISTO", "PREVISTO 1" → "PREVISTO 1", etc.
6. **Transformação**: Normaliza e limpa os dados
7. **Extração**: Extrai colunas relevantes e disciplina
8. **Conversão**: Converte PREVISTO 2 para DataPrevisto (objeto Date)
9. **Filtragem**: Remove linhas com AÇÕES = "E"
10. **Validação**: Verifica dados obrigatórios (NO VALE, PREVISTO, PREVISTO 1, PREVISTO 2, FORMATO, PAGS/ FOLHAS, Disciplina, DataPrevisto)
11. **Consolidação**: Agrupa dados de múltiplas LDs
12. **Relatório**: Gera status e lista de problemas, incluindo informações detalhadas do ProcessarNomeERevisao
13. **Exportação**: Permite exportar resultados

## Dados de Entrada

### Formato de Arquivo LD

- Extensão: .xlsx ou .csv
- Nome: Deve seguir padrão LD_*_REV_*.xlsx ou DF_*_REV_*.xlsx
- Estrutura: Planilha com cabeçalho contendo "NO VALE" ou "VALE DOCUMENT NUMBER"

### Colunas Esperadas

- NO VALE (obrigatório)
- PREVISTO (obrigatório) - pode vir de célula mesclada no cabeçalho
- PREVISTO 1 (obrigatório) - pode vir de célula mesclada no cabeçalho
- PREVISTO 2 (obrigatório) - pode vir de célula mesclada no cabeçalho, usado para gerar DataPrevisto
- REPROGRAMADO (opcional) - pode vir de célula mesclada no cabeçalho
- REPROGRAMADO 1 (opcional) - pode vir de célula mesclada no cabeçalho
- REPROGRAMADO 2 (opcional) - pode vir de célula mesclada no cabeçalho
- REALIZADO (opcional) - pode vir de célula mesclada no cabeçalho
- REALIZADO 1 (opcional) - pode vir de célula mesclada no cabeçalho
- REALIZADO 2 (opcional) - pode vir de célula mesclada no cabeçalho
- FORMATO (obrigatório)
- PAGS/ FOLHAS (obrigatório)
- AÇÕES (opcional, valores "E" são filtrados)
- Disciplina (obrigatório, extraído do NO VALE)
- DataPrevisto (obrigatório, convertido de PREVISTO 2)

## Dados de Saída

### Formato JSON (Recomendado)

```json
{
  "processamento": {
    "data": "2025-01-21T10:00:00Z",
    "totalArquivos": 5,
    "arquivosProcessados": 4,
    "arquivosComErro": 1
  },
  "dados": [
    {
      "nomeArquivo": "LD-8001PZ-F-11047_REV_0_JOTAELE.xlsx",
      "ld": "LD_8001PZ-F-11047",
      "revisao": "0",
      "processarNomeERevisao": {
        "ldsEncontradas": [
          { "fonte": "Nome do arquivo", "valor": "LD_8001PZ-F-11047" },
          { "fonte": "Folha CAPA/ROSTO", "valor": "LD_8001PZ-F-11047" },
          { "fonte": "Folha da LD", "valor": "LD_8001PZ-F-11047" }
        ],
        "revisoesEncontradas": [
          { "fonte": "Nome do arquivo", "valor": "0" },
          { "fonte": "Folha CAPA/ROSTO", "valor": "0" },
          { "fonte": "Folha da LD", "valor": "0" }
        ],
        "totalFontesLD": 3,
        "totalFontesRevisao": 3,
        "ldFinal": "LD_8001PZ-F-11047",
        "revisaoFinal": "0"
      },
      "dados": [
        {
          "NO VALE": "123456-7-A",
          "PREVISTO": "01/01/2025",
          "PREVISTO 1": "Janeiro",
          "PREVISTO 2": "01/01/2025",
          "DataPrevisto": "2025-01-01T00:00:00.000Z",
          "REPROGRAMADO": null,
          "FORMATO": "PDF",
          "PAGS/ FOLHAS": "10",
          "Disciplina": "A"
        }
      ],
      "totalLinhas": 100,
      "linhasProcessadas": 95
    }
  ],
  "problemas": [
    {
      "arquivo": "LD_002_REV_01.xlsx",
      "tipo": "Linhas incompletas",
      "mensagem": "5 linhas possuem células obrigatórias sem preenchimento"
    },
    {
      "arquivo": "LD_003_REV_02.xlsx",
      "tipo": "Inconsistência de Revisão",
      "mensagem": "Revisão encontrada em múltiplas fontes com valores diferentes: Nome do arquivo=\"2\", Folha da LD=\"3\". Verifique se o documento está atualizado."
    }
  ]
}
```

### Formato CSV

Arquivo CSV com todas as colunas processadas, uma linha por documento válido.

### Formato Excel

Arquivo XLSX com:
- Aba "Dados": Dados processados
- Aba "Status": Status de cada LD
- Aba "Problemas": Lista de problemas encontrados

## Problemas Identificados

### Tipos de Problemas

1. **Planilhas Inconsistentes**
   - Mais de 1 planilha ativa (além de F. Rosto)
   - Mensagem: "A LD só deve possuir duas planilhas ativas, a 'F. Rosto' e a planilha da LD em si"

2. **LD Fora do Padrão**
   - Não consegue identificar cabeçalho
   - Não consegue transformar dados
   - Mensagem: Erro específico da transformação

3. **Conteúdo Não Processado**
   - Arquivo corrompido
   - Rótulo de confidencialidade
   - Mensagem: "Arquivo não processado, verifique rótulo de confidencialidade ou se está corrompido"

4. **Nome de Arquivo Inválido**
   - Não segue padrão LD_*_REV_*.xlsx ou DF_*_REV_*.xlsx
   - Mensagem: "Nome de arquivo inválido. Verifique nome e Extensão"

5. **Inconsistência de LD**
   - LD encontrada em múltiplas fontes com valores diferentes
   - Mensagem: "LD encontrada em múltiplas fontes com valores diferentes: [fonte1]=\"valor1\", [fonte2]=\"valor2\". Verifique se o documento está atualizado."

6. **Inconsistência de Revisão**
   - Revisão encontrada em múltiplas fontes com valores diferentes
   - Mensagem: "Revisão encontrada em múltiplas fontes com valores diferentes: [fonte1]=\"valor1\", [fonte2]=\"valor2\". Verifique se o documento está atualizado."

7. **Linhas Incompletas**
   - Células obrigatórias sem preenchimento
   - Mensagem: "X linhas possuem células obrigatórias sem preenchimento"

8. **Nenhuma Linha Contabilizada**
   - Nenhuma linha válida após filtros
   - Mensagem: "Nenhuma linha foi contabilizada, verifique se está no formato adequado e se o 'previsto' está preenchido corretamente, com datas válidas dd/MM/yyyy"

## Próximos Passos

- Integração com módulos posteriores
- Melhorias na interface
- Suporte a mais formatos
- Processamento em lote otimizado
