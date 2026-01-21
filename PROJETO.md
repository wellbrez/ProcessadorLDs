# PROJETO.md - ProcessadorLDs

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
2. **Leitura**: Sistema lê o arquivo e identifica o formato
3. **Identificação**: Localiza o cabeçalho "NO VALE" ou "VALE DOCUMENT NUMBER"
4. **Transformação**: Normaliza e limpa os dados
5. **Extração**: Extrai colunas relevantes e disciplina
6. **Filtragem**: Remove linhas com AÇÕES = "E"
7. **Validação**: Verifica dados obrigatórios
8. **Consolidação**: Agrupa dados de múltiplas LDs
9. **Relatório**: Gera status e lista de problemas
10. **Exportação**: Permite exportar resultados

## Dados de Entrada

### Formato de Arquivo LD

- Extensão: .xlsx ou .csv
- Nome: Deve seguir padrão LD_*_REV_*.xlsx ou DF_*_REV_*.xlsx
- Estrutura: Planilha com cabeçalho contendo "NO VALE" ou "VALE DOCUMENT NUMBER"

### Colunas Esperadas

- NO VALE (obrigatório)
- PREVISTO (obrigatório)
- PREVISTO 1 (obrigatório)
- PREVISTO 2 (obrigatório)
- REPROGRAMADO (opcional)
- REPROGRAMADO 1 (opcional)
- REPROGRAMADO 2 (opcional)
- REALIZADO (opcional)
- REALIZADO 1 (opcional)
- REALIZADO 2 (opcional)
- FORMATO (obrigatório)
- PAGS/ FOLHAS (obrigatório)
- AÇÕES (opcional, valores "E" são filtrados)

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
      "nomeArquivo": "LD_001_REV_01.xlsx",
      "revisao": "01",
      "ld": "LD_001",
      "noVale": "123456-7-A",
      "previsto": "01/01/2025",
      "previsto1": "Janeiro",
      "previsto2": "2025-01-01",
      "reprogramado": null,
      "formato": "PDF",
      "paginas": "10",
      "disciplina": "A"
    }
  ],
  "problemas": [
    {
      "arquivo": "LD_002_REV_01.xlsx",
      "tipo": "Linhas incompletas",
      "mensagem": "5 linhas possuem células obrigatórias sem preenchimento"
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

5. **Linhas Incompletas**
   - Células obrigatórias sem preenchimento
   - Mensagem: "X linhas possuem células obrigatórias sem preenchimento"

6. **Nenhuma Linha Contabilizada**
   - Nenhuma linha válida após filtros
   - Mensagem: "Nenhuma linha foi contabilizada, verifique se está no formato adequado e se o 'previsto' está preenchido corretamente, com datas válidas dd/MM/yyyy"

## Próximos Passos

- Integração com módulos posteriores
- Melhorias na interface
- Suporte a mais formatos
- Processamento em lote otimizado
