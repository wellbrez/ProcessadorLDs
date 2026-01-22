# Fluxo Detalhado de Transformação - Seguindo Power Query

**Autor:** Wellington Bravin  
**Data:** 21/01/2026

## Visão Geral

O Power Query faz uma transformação complexa do cabeçalho para lidar com células mescladas. Este documento detalha cada etapa.

## Etapas do Processamento

### 1. Identificação do Cabeçalho
```
AdicionarIndice → PrimeiraOcorrencia → IndiceMaximo → ResultadoFinal
```
- Adiciona índice (0, 1, 2, ...) a cada linha
- Busca primeira linha com "NO VALE" em Column1 ou Column2
- Pega o maior índice encontrado
- Pula todas as linhas até chegar no cabeçalho (Table.Skip)

### 2. Processamento do Cabeçalho (CRÍTICO)

#### 2.1. Extrair Linha do Cabeçalho
```
Escolher colunas 1 = ResultadoFinal{0}
```
- Pega a PRIMEIRA LINHA após pular (linha do cabeçalho)
- Exemplo: ["NO VALE", "PREVISTO", "", "", "FORMATO", ...]

#### 2.2. Record.ToTable - Converter Linha em Tabela
```
Convertido em tabela = Record.ToTable(Escolher colunas 1)
```
- Converte o record (linha) em uma TABELA
- Cada coluna vira uma LINHA na tabela
- Exemplo:
  ```
  [{Value: "NO VALE", Ind: 0},
   {Value: "PREVISTO", Ind: 1},
   {Value: "", Ind: 2},
   {Value: "", Ind: 3},
   {Value: "FORMATO", Ind: 4}, ...]
  ```

#### 2.3. Normalização de Texto
```
Texto em maiúscula → Texto aparado → Texto limpo
```
- Text.Upper: Converte para maiúscula
- Text.Trim: Remove espaços
- Text.Clean: Remove caracteres de controle

#### 2.4. FillDown - CRUCIAL para Células Mescladas
```
Preenchido abaixo = Table.FillDown(Índice adicionado, {"Value"})
```
- Preenche células vazias com o valor da célula acima
- Exemplo:
  ```
  Antes: ["NO VALE", "PREVISTO", "", "", "FORMATO"]
  Depois: ["NO VALE", "PREVISTO", "PREVISTO", "PREVISTO", "FORMATO"]
  ```

#### 2.5. Group por Value
```
Linhas agrupadas = Table.Group(Preenchido abaixo, {"Value"}, {"Classificado", each _})
```
- Agrupa linhas com mesmo Value
- Mantém ordem original dentro de cada grupo
- Exemplo:
  ```
  Grupo "PREVISTO": [linha1, linha2, linha3] (todas com Value="PREVISTO")
  Grupo "FORMATO": [linha4] (com Value="FORMATO")
  ```

#### 2.6. Adicionar Índice Dentro de Cada Grupo
```
ClassificadoComIndice = Table.AddIndexColumn([Classificado], "indice", 0, 1, Int64.Type)
```
- Dentro de cada grupo, adiciona índice começando de 0
- Exemplo para grupo "PREVISTO":
  ```
  [{Value: "PREVISTO", Ind: 1, indice: 0},
   {Value: "PREVISTO", Ind: 2, indice: 1},
   {Value: "PREVISTO", Ind: 3, indice: 2}]
  ```

#### 2.7. Substituir 0 por null
```
Valor substituído 1 = Table.ReplaceValue(..., 0, null, ..., {"indice"})
```
- Substitui indice=0 por null
- Exemplo:
  ```
  [{Value: "PREVISTO", Ind: 1, indice: null},
   {Value: "PREVISTO", Ind: 2, indice: 1},
   {Value: "PREVISTO", Ind: 3, indice: 2}]
  ```

#### 2.8. CombineColumns - Combinar Value + indice
```
Colunas mescladas = Table.CombineColumns(..., {"Value", "indice"}, Combiner.CombineTextByDelimiter(" ", ...), "Value")
```
- Combina Value + indice com espaço como delimitador
- Se indice é null, não adiciona espaço
- Exemplo:
  ```
  Value="PREVISTO", indice=null → "PREVISTO"
  Value="PREVISTO", indice=1 → "PREVISTO 1"
  Value="PREVISTO", indice=2 → "PREVISTO 2"
  ```

#### 2.9. Join com ConversaoColunas
```
Consultas mescladas = Table.NestedJoin(..., ConversaoColunas, {"Old"}, ...)
Expandido ConversaoColunas = Table.ExpandTableColumn(..., {"New"}, ...)
Personalização adicionada 2 = Value2 = if [New] = null then [Value] else [New]
```
- Faz join com tabela de conversão
- Se encontrar conversão, usa "New", senão usa "Value"
- Exemplo:
  ```
  "PREVISTO 0" → encontra conversão → "PREVISTO"
  "PREVISTO 1" → encontra conversão → "PREVISTO 1"
  "PREVISTO 2" → encontra conversão → "PREVISTO 2"
  ```

#### 2.10. Sort por Ind e Selecionar Value2
```
Linhas classificadas 1 = Table.Sort(..., {"Ind", Order.Ascending})
As outras colunas foram removidas = Table.SelectColumns(..., {"Value2"})
```
- Ordena por Ind (ordem original das colunas)
- Seleciona apenas Value2 (resultado da conversão)

#### 2.11. Transpose - Volta a Ser Linha
```
Tabela transposta = Table.Transpose(As outras colunas foram removidas)
```
- Transpõe a tabela (cada linha vira uma coluna)
- Volta a ser uma LINHA (cabeçalho processado)
- Exemplo:
  ```
  ["NO VALE", "PREVISTO", "PREVISTO 1", "PREVISTO 2", "FORMATO", ...]
  ```

### 3. Combinação com Dados
```
JuntarCabecalhoPlanilha = Table.Combine({Tabela transposta, Table.Skip(ResultadoFinal, 1 ou 2)})
```
- Combina cabeçalho processado com dados
- Pula 1 ou 2 linhas dependendo se primeira célula contém "-"
- PromoteHeaders: primeira linha vira cabeçalho

### 4. Seleção de Colunas
```
Escolher colunas = Table.SelectColumns(..., {"NO VALE", "PREVISTO", "PREVISTO 1", "PREVISTO 2", ...})
```
- Seleciona apenas as colunas necessárias

### 5. Processamento de Dados
- Processa PAGS/ FOLHAS (substitui "-" e "NA" por "0")
- Remove linhas completamente vazias
- Adiciona Disciplina (extraída do NO VALE)
- Converte tipos para text

### 6. Filtro Final (DadosFinais)
- Adiciona DataPrevisto = Date.From(DateTime.From([PREVISTO 2]))
- Filtra linhas onde:
  - [NO VALE] <> null and [NO VALE] <> ""
  - [PREVISTO] <> null and [PREVISTO] <> ""
  - [PREVISTO 1] <> null and [PREVISTO 1] <> ""
  - [FORMATO] <> null and [FORMATO] <> ""
  - [PAGS/ FOLHAS] <> null and [PAGS/ FOLHAS] <> ""
  - [Disciplina] <> null
  - [DataPrevisto] <> null and [DataPrevisto] <> ""

## Pontos Críticos na Implementação

1. **Record.ToTable**: Converter linha em tabela (cada coluna vira linha)
2. **FillDown**: Preencher células vazias com valor acima
3. **Group**: Agrupar por Value mantendo ordem
4. **Index dentro do grupo**: Numeração 0, 1, 2, ... dentro de cada grupo
5. **Substituir 0 por null**: Primeiro item do grupo tem indice=null
6. **CombineColumns**: Combinar Value + indice com espaço
7. **Join com ConversaoColunas**: Converter nomes
8. **Sort por Ind**: Restaurar ordem original
9. **Transpose**: Voltar a ser linha (cabeçalho)

## Problemas Comuns

1. **Ordem incorreta**: Não manter ordem original (Ind) após Group
2. **FillDown incorreto**: Não preencher células vazias corretamente
3. **Group incorreto**: Não agrupar corretamente ou perder ordem
4. **Índice incorreto**: Numeração errada dentro dos grupos
5. **Conversão incorreta**: Tabela de conversão incompleta ou incorreta
6. **Mapeamento incorreto**: Dados não mapeados corretamente para colunas processadas
