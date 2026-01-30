# PROJETO.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 26/01/2026

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

5. **Pós-Processamento com CSV Gerencial**
   - Validação de vales contra extrato oficial
   - **Cálculo dinâmico de EMISSAO**: Ordenação customizada de revisões e atribuição automática (FICHA, PRIMEMISSAO, REVISAO)
   - **Cálculo dinâmico de PRIMCERTIFICACAO**: Identificação automática da primeira certificação por vale
   - Verificação de emissão usando EMISSAO calculado (não mais lido do CSV)
   - Comparação de datas (Data GR Rec vs REALIZADO 2)
   - Identificação de discrepâncias
   - Exportação de resultados de validação
   - **Filtragem otimizada**: Considera apenas 'Número Vale' e 'Num. Vale Antigo' para identificar vales
   - **Estrutura de dados**: Armazena múltiplas linhas por vale (necessário para ordenação e cálculos)

6. **Dashboard Profissional**
   - 10 visualizações avançadas
   - Filtros avançados para análise
   - Gráficos temporais, 3D e mapas de calor
   - Análise por disciplina, projeto, empresa
   - Exportação de visualizações

7. **Persistência de Dados**
   - Salvamento automático no navegador
   - Carregamento de dados salvos
   - Gerenciamento de dados persistidos

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
- RF09: Validar dados contra CSV gerencial do sistema oficial
- RF10: Exibir inconsistências no modal de detalhes de cada LD
- RF11: Dashboard com visualizações avançadas
- RF12: Persistir dados no navegador para evitar reprocessamento

### Não Funcionais

- RNF01: Aplicação deve rodar standalone (sem servidor)
- RNF02: Processamento deve ser client-side
- RNF03: Interface responsiva e intuitiva
- RNF04: Suporte a navegadores modernos (Chrome, Firefox, Edge, Safari)
- RNF05: Processamento de arquivos de até 10MB
- RNF06: Processamento de CSV gerencial de até 3GB com otimização de memória
- RNF07: Interface responsiva para dashboard com múltiplas visualizações
- RNF08: Performance otimizada para grandes volumes de dados

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
8. **Conversão**: Converte PREVISTO 2 para DataPrevisto (objeto Date) - aceita formatos dd/MM/yyyy e dd/MM/yy
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
- Aba "Pós-Processamento": Resultados de validação (se disponível)
- Aba "Discrepâncias Data": Lista de discrepâncias de data (se disponível)

### Formato de Exportação do Pós-Processamento

**CSV/JSON/XLSX** com:
- Estatísticas de processamento
- Resultados detalhados por vale:
  - NO VALE, Arquivo, LD, Revisão
  - Encontrado no CSV, Emitido
  - Data GR Rec, REALIZADO 2, Status Data, Diferença (dias)
  - Projeto/SE, Empresa, Título, Fin. Dev, etc.
- Discrepâncias de data (aba separada no Excel)

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
   - Mensagem: "Nenhuma linha foi contabilizada, verifique se está no formato adequado e se o 'previsto' está preenchido corretamente, com datas válidas (dd/MM/yyyy ou dd/MM/yy)"

## CSV Gerencial Consolidado

### O que é o CSV Gerencial

O **CSV Gerencial Consolidado** é um extrato oficial do sistema de gestão de documentos que contém informações detalhadas sobre todos os vales (documentos) processados no sistema. Este arquivo é usado como fonte de verdade para validação dos dados processados das LDs.

**Características:**
- Arquivo CSV de grande porte (pode chegar a 3GB)
- Contém histórico completo de vales e suas revisões
- Inclui informações sobre emissão, certificação e status de cada documento
- É o extrato oficial do sistema (fonte de verdade)

### Colunas Principais do CSV

O sistema extrai e processa as seguintes colunas do CSV gerencial:

**Colunas para Identificação:**
- **Número Vale**: Número principal do vale/documento (usado para matching)
- **Num. Vale Antigo**: Número alternativo do vale (usado como fallback para matching)

**Colunas para Cálculos de Emissão e Certificação:**
- **Revisão**: Revisão do documento (pode ser '-1', alfabética A-Z, ou numérica 0+)
- **Tp. Emissão**: Tipo de emissão (ex: 'B' para bloqueado, outros valores para emitido)
- **Final. Devol**: Finalidade de devolução (ex: 'APR' para aprovado/certificado)

**Colunas de Dados:**
- **Data GR Rec**: Data de recebimento do GR (usada para data de emissão e certificação)
- **Projeto/SE**: Projeto ou SE associado
- **Empresa**: Empresa responsável
- **Title**: Título do documento
- **GR Recebimento**: Número do GR de recebimento
- **Status**: Status atual do documento
- **Fase**: Fase do documento
- **Formato**: Formato do arquivo
- **Responsável**: Responsável pelo documento

**Colunas Removidas do Processamento:**
- **EMISSAO**: Não é lida do CSV (calculada dinamicamente pelo sistema)
- **NUMEROABAIXO**: Não utilizada no processamento
- **GR REC ABAIXO**: Não utilizada no processamento

### Processo de Emissão

O processo de emissão identifica quando um documento foi emitido pela primeira vez usando dados do CSV gerencial.

**Passo 1: Ordenação de Revisões**
- Para cada vale, o sistema ordena todas as linhas do CSV por ordem de revisão:
  - Revisão '-1' → ordem 0 (primeira)
  - Revisões alfabéticas (A-Z) → ordem 1-26
  - Revisões numéricas (0+) → ordem 27+

**Passo 2: Cálculo Dinâmico de EMISSAO**
- Linhas com revisão '-1' → `EMISSAO = 'FICHA'` (documento de ficha, não é emissão)
- Primeira linha não-FICHA → `EMISSAO = 'PRIMEMISSAO'` (primeira emissão)
- Demais linhas não-FICHA → `EMISSAO = 'REVISAO'` (revisões subsequentes)

**Passo 3: Identificação de Documento Emitido**
- Um documento é considerado **emitido** se possui pelo menos uma linha com `EMISSAO = 'PRIMEMISSAO'`
- A **data de emissão** é a `Data GR Rec` da linha com `EMISSAO = 'PRIMEMISSAO'`
- **Precedência**: A data do CSV prevalece sobre a data da LD (CSV é fonte oficial)

**Exemplo:**
```
Vale: 123456-7-A
- Linha 1: Revisão '-1', Data GR Rec: 01/01/2025 → EMISSAO = 'FICHA'
- Linha 2: Revisão '0', Data GR Rec: 15/01/2025 → EMISSAO = 'PRIMEMISSAO' ← Primeira emissão
- Linha 3: Revisão '1', Data GR Rec: 20/02/2025 → EMISSAO = 'REVISAO'

Resultado: Documento emitido em 15/01/2025
```

### Processo de Certificação

O processo de certificação identifica quando um documento foi certificado pela primeira vez usando dados do CSV gerencial.

**Passo 1: Identificação da Primeira Certificação**
- Para cada vale, o sistema percorre as linhas ordenadas até encontrar a primeira que atende aos critérios:
  1. **Revisão numérica**: Revisão deve ser numérica (não alfabética e não '-1')
  2. **Tipo de Emissão**: `Tp. Emissão ≠ 'B'` (não bloqueado)
  3. **Finalidade de Devolução**: `Final. Devol = 'APR'` (aprovado/certificado)

**Passo 2: Cálculo Dinâmico de PRIMCERTIFICACAO**
- A primeira linha que atende aos critérios recebe `PRIMCERTIFICACAO = true`
- Todas as outras linhas recebem `PRIMCERTIFICACAO = false`

**Passo 3: Identificação de Documento Certificado**
- Um documento é considerado **certificado** se possui pelo menos uma linha com `PRIMCERTIFICACAO = true`
- A **data de certificação** é a `Data GR Rec` da linha com `PRIMCERTIFICACAO = true`

**Passo 4: Cálculo de Data Prevista de Certificação**
- A **data prevista de certificação** é calculada como: `Data Previsto (LD) + 14 dias corridos`
- Esta data é usada para comparar com a data real de certificação e calcular atrasos

**Passo 5: Status de Certificação**
- **No Prazo**: Certificado antes ou na data prevista (diferença ≤ 0 dias)
- **Atraso Leve**: Certificado até 7 dias após a data prevista
- **Atraso**: Certificado mais de 7 dias após a data prevista
- **Pendente**: Não certificado e data prevista já passou
- **Aguardando**: Não certificado e data prevista ainda não chegou
- **N/A**: Sem data prevista ou sem dados suficientes

**Exemplo:**
```
Vale: 123456-7-A
- Linha 1: Revisão '0', Tp. Emissão: 'A', Final. Devol: 'REV' → PRIMCERTIFICACAO = false
- Linha 2: Revisão '1', Tp. Emissão: 'A', Final. Devol: 'APR', Data GR Rec: 20/02/2025 → PRIMCERTIFICACAO = true ← Primeira certificação
- Linha 3: Revisão '2', Tp. Emissão: 'A', Final. Devol: 'APR', Data GR Rec: 15/03/2025 → PRIMCERTIFICACAO = false

Data Previsto (LD): 01/02/2025
Data Prevista Certificação: 15/02/2025 (01/02 + 14 dias)
Data Real Certificação: 20/02/2025
Status: Atraso Leve (5 dias de atraso)
```

### Relação entre Emissão e Certificação

- **Emissão** ocorre primeiro (quando o documento é emitido pela primeira vez)
- **Certificação** pode ocorrer após a emissão (quando o documento é aprovado/certificado)
- Um documento pode estar **emitido mas não certificado** (emitido mas ainda não aprovado)
- Um documento **certificado** sempre foi emitido antes (certificação requer emissão prévia)

## Fluxo de Pós-Processamento

1. **Processamento Inicial**: Processar LDs conforme fluxo principal
2. **Carregamento CSV Gerencial**: Selecionar arquivo CSV do sistema oficial
3. **Filtragem Inteligente**: Sistema filtra apenas vales relevantes das LDs processadas (usa apenas 'Número Vale' e 'Num. Vale Antigo')
4. **Armazenamento**: Armazena múltiplas linhas por vale (necessário para ordenação e cálculos)
5. **Cálculo de EMISSAO**: Para cada vale, ordena linhas e calcula EMISSAO dinamicamente (FICHA, PRIMEMISSAO, REVISAO)
6. **Cálculo de PRIMCERTIFICACAO**: Para cada vale, identifica primeira certificação baseado em critérios específicos
7. **Validação**: Verificar cada vale contra o CSV gerencial usando EMISSAO e PRIMCERTIFICACAO calculados
8. **Análise**: Identificar vales não encontrados, não emitidos, não certificados e discrepâncias de data
9. **Visualização**: Exibir resultados em dashboard com múltiplas visualizações incluindo status de certificação
10. **Exportação**: Exportar resultados de validação em múltiplos formatos

## Dashboard de Análise

### Visualizações Disponíveis

1. **Gráfico Temporal**: Previsto vs Realizado ao longo do tempo (barras lado a lado com tabela de resumo)
2. **Mapa de Calor Temporal**: Intensidade por disciplina e período
3. **Distribuição por Disciplina**: Gráfico de rosca com número e percentual + tabela resumo
4. **Visualização 3D**: Disciplina × Projeto × Quantidade com cores por status
5. **Mapa de Calor de Taxa de Emissão**: Taxa de emissão por projeto/disciplina (máximo 100%)
6. **Mapa de Calor de Taxa de Certificação**: Taxa de certificação por projeto/disciplina (máximo 100%)
7. **Barras Empilhadas**: Status por projeto (Certificado, Emitido e não certificado, Não Emitido, Não Encontrado)
8. **Evolução de Documentos por Período**: Timeline multi-linha com status
9. **Acúmulo de Documentos**: Acúmulo previsto (LD) vs realizado (CSV PRIMEMISSAO)
10. **Acúmulo de Certificação**: Certificação prevista (Previsto LD + 14) vs realizado (CSV PRIMCERTIFICACAO)

### Filtros Disponíveis

- Projeto/SE (multiselect)
- Empresa (multiselect)
- LD (multiselect)
- Disciplina (multiselect)
- Formato (multiselect)
- Período (Data Previsto - início e fim)

## Persistência de Dados

### Funcionalidades

- **Salvamento Automático**: Dados são salvos automaticamente após processamento bem-sucedido
- **Salvamento Otimizado (v2.0)**: Dados são compactados removendo campos redundantes
- **Salvamento por LD**: Possibilidade de salvar/carregar LDs específicas individualmente
- **Carregamento**: Restaurar dados salvos sem necessidade de reprocessar
- **Gerenciamento**: Visualizar informações sobre dados salvos e limpar quando necessário
- **Limite**: Sistema valida tamanho (recomendado até 5MB) e alerta se necessário

### Dados Salvos

- Resultado do pós-processamento (otimizado, sem `linhasCSV` redundante)
- Dados das LDs processadas (apenas campos necessários para gráficos)
- Resultado da validação
- Data e hora do processamento
- **Metadados do CSV** (novo):
  - Nome do arquivo CSV utilizado
  - Data de modificação do arquivo CSV
  - Data/hora de carregamento do CSV
  - Total de linhas processadas
  - Quantidade de vales encontrados

### Otimização de Tamanho

O formato v2.0 reduz significativamente o tamanho dos dados salvos:
- Remove `linhasCSV` completo (que continha todas as linhas do CSV para cada vale)
- Substitui por campos pré-calculados: `dataEmissaoCSV` e `dataCertificacaoCSV`
- Mantém apenas campos necessários para regenerar gráficos e tabelas

## Próximos Passos

- Integração com módulos posteriores
- Melhorias na interface
- Suporte a mais formatos
- Processamento em lote otimizado
- Novas visualizações no dashboard
