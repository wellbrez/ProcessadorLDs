# Fluxo Lógico do Power Query - Transformar o arquivo

**Autor:** Wellington Bravin  
**Data:** 21/01/2026

Baseado na análise do DB_LDS_POSTADAS.json

## Etapas do Processamento

### 1. Preparação Inicial
- **Erros substituídos**: Table.ReplaceErrorValues - substitui erros por null
- **AdicionarIndice**: Adiciona coluna de índice (0, 1, 2, ...)

### 2. Identificação do Cabeçalho
- **PrimeiraOcorrencia**: Busca primeira linha com "NO VALE" ou "VALE DOCUMENT NUMBER" em Column1 ou Column2
- **IndiceMaximo**: Pega o maior índice encontrado
- **ResultadoFinal**: Pula todas as linhas até chegar no cabeçalho (Table.Skip)

### 3. Processamento do Cabeçalho (CRÍTICO)
- **Escolher colunas 1** = ResultadoFinal{0} - Pega a PRIMEIRA LINHA após pular (linha do cabeçalho)
- **Convertido em tabela** = Record.ToTable - Converte o record (linha) em uma TABELA onde cada coluna vira uma LINHA
  - Exemplo: Se a linha tem [Column1="NO VALE", Column2="PREVISTO", Column3="", Column4=""]
  - Vira uma tabela com 4 linhas: [{Value="NO VALE"}, {Value="PREVISTO"}, {Value=""}, {Value=""}]
- **Escolher colunas 2** = Seleciona apenas a coluna "Value"
- **Texto em maiúscula** = Text.Upper em cada Value
- **Texto aparado** = Text.Trim em cada Value
- **Texto limpo** = Text.Clean em cada Value
- **Índice adicionado** = AddIndexColumn com "Ind" (0, 1, 2, ...) - mantém ordem original das colunas
- **Preenchido abaixo** = FillDown na coluna "Value" - CRUCIAL! Preenche células vazias com valor acima
  - Se Value[0]="PREVISTO", Value[1]="", Value[2]=""
  - Após FillDown: Value[0]="PREVISTO", Value[1]="PREVISTO", Value[2]="PREVISTO"
- **Linhas agrupadas** = Group por "Value" - agrupa linhas com mesmo valor
  - Todas as linhas com "PREVISTO" ficam juntas
- **ClassificadoComIndice** = Dentro de cada grupo, adiciona índice "indice" (0, 1, 2, ...)
  - Grupo "PREVISTO" com 3 linhas: indice[0]=0, indice[1]=1, indice[2]=2
- **Expandido ClassificadoComIndice** = Expande a tabela aninhada
- **Valor substituído 1** = Substitui indice=0 por null
  - indice[0]=null, indice[1]=1, indice[2]=2
- **Colunas mescladas** = CombineColumns(Value + indice, delimitador=" ")
  - Se Value="PREVISTO" e indice=null → "PREVISTO"
  - Se Value="PREVISTO" e indice=1 → "PREVISTO 1"
  - Se Value="PREVISTO" e indice=2 → "PREVISTO 2"
- **Texto aparado 1** = Trim no resultado
- **Consultas mescladas** = Join com ConversaoColunas (tabela de conversão)
- **Expandido ConversaoColunas** = Expande a coluna "New" da conversão
- **Personalização adicionada 2** = Value2 = se New não é null então New, senão Value
- **Colunas removidas 2** = Remove colunas desnecessárias
- **Linhas classificadas 1** = Sort por "Ind" (ordem original)
- **As outras colunas foram removidas** = Seleciona apenas "Value2"
- **Tabela transposta** = Table.Transpose - CRUCIAL! Volta a ser uma LINHA (cabeçalho)
  - Agora temos: ["NO VALE", "PREVISTO", "PREVISTO 1", "PREVISTO 2", ...]

### 4. Combinação com Dados
- **JuntarCabecalhoPlanilha** = Combina a tabela transposta (cabeçalho) com os dados
  - Se ResultadoFinal{1}[Column1] contém "-", pula 1 linha, senão pula 2 linhas
  - Isso remove linhas de separação/decoração
- **Cabeçalhos promovidos** = PromoteHeaders - primeira linha vira cabeçalho

### 5. Seleção e Processamento de Colunas
- **Escolher colunas** = Seleciona apenas: NO VALE, PREVISTO, PREVISTO 1, PREVISTO 2, REPROGRAMADO, REPROGRAMADO 1, REPROGRAMADO 2, REALIZADO, REALIZADO 1, REALIZADO 2, FORMATO, PAGS/ FOLHAS, AÇÕES
- **AlterarTipoColPags** = Converte PAGS/ FOLHAS para text
- **SubstituirTracoZero** = Substitui "-" por "0" em PAGS/ FOLHAS
- **SubstituirNAZero** = Substitui "NA" por "0" em PAGS/ FOLHAS
- **Linhas em branco removidas** = Remove linhas completamente vazias
- **Personalização adicionada** = Adiciona coluna "Disciplina" (extraída do NO VALE)
- **Tipo de coluna alterado** = Converte todas as colunas para text

### 6. Filtro Final (DadosFinais)
- Adiciona "DataPrevisto" = Date.From(DateTime.From([PREVISTO 2]))
- Filtra linhas onde:
  - [NO VALE] <> null and [NO VALE] <> ""
  - [PREVISTO] <> null and [PREVISTO] <> ""
  - [PREVISTO 1] <> null and [PREVISTO 1] <> ""
  - [FORMATO] <> null and [FORMATO] <> ""
  - [PAGS/ FOLHAS] <> null and [PAGS/ FOLHAS] <> ""
  - [Disciplina] <> null
  - [DataPrevisto] <> null and [DataPrevisto] <> ""

## Pontos Críticos

1. **Record.ToTable**: Converte linha (record) em tabela (cada coluna vira linha)
2. **FillDown**: Preenche células vazias com valor acima (essencial para células mescladas)
3. **Group + Index**: Agrupa valores iguais e numera dentro do grupo
4. **CombineColumns**: Combina Value + índice com espaço
5. **Transpose**: Volta a ser uma linha (cabeçalho processado)
6. **Join com ConversaoColunas**: Converte nomes usando tabela de conversão
