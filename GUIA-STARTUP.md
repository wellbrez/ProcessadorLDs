# GUIA-STARTUP.md - ProcessadorLDs

**Autor:** Wellington Bravin  
**Data:** 26/01/2026

## Guia de Inicialização

Este guia fornece instruções para iniciar e usar o ProcessadorLDs pela primeira vez.

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge ou Safari)
- Arquivos de LD para processar (opcional para teste)

## Instalação

### Opção 1: Uso Local

1. Baixe ou clone o repositório
2. Navegue até a pasta do projeto
3. Abra o arquivo `index.html` em um navegador

**Não é necessária instalação de dependências!** O aplicativo usa bibliotecas via CDN.

### Opção 2: Servidor Local (Opcional)

Se preferir usar um servidor local:

```bash
# Python 3
python -m http.server 8000

# Node.js (com http-server)
npx http-server

# PHP
php -S localhost:8000
```

Acesse: `http://localhost:8000`

## Primeiro Uso

### 1. Abrir a Aplicação

1. Abra `index.html` no navegador
2. A interface será carregada automaticamente

### 2. Selecionar Arquivos

1. Clique em "Selecionar Arquivos" ou arraste arquivos para a área de upload
2. Selecione um ou mais arquivos de LD (CSV ou XLSX)
3. Arquivos válidos devem seguir o padrão: `LD_*_REV_*.xlsx` ou `DF_*_REV_*.xlsx`

### 3. Processar

1. Clique no botão "Processar"
2. Aguarde o processamento (barra de progresso será exibida)
3. Resultados serão exibidos automaticamente

### 4. Visualizar Resultados

A interface exibirá:

- **Estatísticas**: Total de arquivos, processados, com erro
- **Dados Processados**: Tabela com dados extraídos
- **Status por Arquivo**: Status de cada LD processada
  - Cada arquivo possui um botão "Ver Detalhes" que mostra:
    - LD Final e Revisão Final extraídas
    - Lista de todas as fontes LD encontradas (Nome arquivo, CAPA/ROSTO, Folha LD)
    - Lista de todas as fontes de Revisão encontradas
    - Contadores de quantas fontes foram encontradas
    - **Inconsistências do Pós-Processamento** (após validação):
      - Vales não encontrados no CSV gerencial
      - Vales não emitidos (encontrados mas sem PrimEmissao)
      - Discrepâncias de data (Data GR Rec vs REALIZADO 2)
    - Estatísticas de processamento
    - Linhas com erro (se houver)
  - Badges visuais no status indicando inconsistências do pós-processamento
- **Problemas**: Lista de problemas encontrados (incluindo inconsistências de LD/Revisão)

### 5. Exportar Resultados

1. Selecione o formato de exportação:
   - **CSV**: Arquivo CSV simples
   - **Excel**: Arquivo XLSX com múltiplas abas
   - **JSON**: Arquivo JSON (recomendado para integração)

2. Clique em "Exportar"
3. O arquivo será baixado automaticamente

### 6. Pós-Processamento com CSV Gerencial

1. Após processar as LDs, você verá a seção "Pós-Processamento com CSV Gerencial"
2. Clique na área de upload e selecione o arquivo **CSV Gerencial Consolidado**
   - **O que é**: Extrato oficial do sistema de gestão de documentos
   - Arquivo esperado: `RELATORIO_GERENCIAL_CONSOLIDADO_*.csv`
   - Sistema aceita arquivos de até 3GB com otimização automática
   - Contém histórico completo de vales e suas revisões
3. Aguarde o carregamento (barra de progresso será exibida)
   - Sistema filtra automaticamente apenas vales das LDs processadas
   - Processamento otimizado em chunks para arquivos grandes
4. Clique em "Processar Validação"
5. O sistema realiza automaticamente:
   - **Cálculo de EMISSAO**: Ordena revisões e identifica primeira emissão (PRIMEMISSAO)
   - **Cálculo de PRIMCERTIFICACAO**: Identifica primeira certificação baseado em critérios
   - **Validação**: Compara dados das LDs com dados do CSV
6. Visualize:
   - Estatísticas de validação (vales encontrados, emitidos, certificados)
   - Status de certificação (No Prazo, Atraso Leve, Atraso, Pendente)
   - Exportação de resultados (CSV, JSON, XLSX)
   - Discrepâncias de data identificadas

**Processo de Emissão:**
- Sistema ordena revisões de cada vale (-1 → A-Z → 0+)
- Identifica primeira emissão (PRIMEMISSAO) excluindo fichas (revisão -1)
- Data de emissão: Data GR Rec da linha com PRIMEMISSAO (prevalece CSV sobre LD)

**Processo de Certificação:**
- Sistema identifica primeira linha que atende: revisão numérica, Tp. Emissão ≠ 'B', Final. Devol = 'APR'
- Data de certificação: Data GR Rec da linha com PRIMCERTIFICACAO = true
- Data prevista: Data Previsto (LD) + 14 dias corridos
- Status calculado comparando data real vs prevista

### 7. Dashboard de Análise

1. Após o pós-processamento, clique na aba "Dashboard"
2. Use os filtros para refinar a análise:
   - Projeto/SE
   - Empresa
   - LD
   - Disciplina
   - Formato
   - Período (Data Previsto)
3. Explore as 10 visualizações disponíveis:
   - Gráficos temporais
   - Mapas de calor
   - Visualização 3D
   - Gráfico de Gantt
   - E mais...
4. Interaja com os gráficos (zoom, pan, hover)
5. Exporte gráficos individuais se necessário

### 8. Dados Salvos

- Os dados são salvos automaticamente após processamento bem-sucedido
- Use "Carregar Dados Salvos" para restaurar sem reprocessar
- Visualize informações sobre dados salvos (data do último processamento)
- Use "Limpar Dados Salvos" para remover dados antigos

## Formato de Arquivo LD

### Estrutura Esperada

O arquivo LD deve conter:

1. **Cabeçalho**: Linha contendo "NO VALE" ou "VALE DOCUMENT NUMBER"
   - O cabeçalho pode ter células mescladas (ex: "PREVISTO" cobrindo 3 colunas)
   - O sistema automaticamente transforma células mescladas em PREVISTO, PREVISTO 1, PREVISTO 2
2. **Colunas**: As seguintes colunas devem estar presentes:
   - NO VALE (obrigatório)
   - PREVISTO (obrigatório) - pode vir de célula mesclada
   - PREVISTO 1 (obrigatório) - pode vir de célula mesclada
   - PREVISTO 2 (obrigatório) - pode vir de célula mesclada, usado para gerar DataPrevisto
   - REPROGRAMADO (opcional) - pode vir de célula mesclada
   - REPROGRAMADO 1 (opcional) - pode vir de célula mesclada
   - REPROGRAMADO 2 (opcional) - pode vir de célula mesclada
   - REALIZADO (opcional) - pode vir de célula mesclada
   - REALIZADO 1 (opcional) - pode vir de célula mesclada
   - REALIZADO 2 (opcional) - pode vir de célula mesclada
   - FORMATO (obrigatório)
   - PAGS/ FOLHAS (obrigatório)
   - AÇÕES (opcional, valores "E" são filtrados)
   - Disciplina (obrigatório, extraído automaticamente do NO VALE)
   - DataPrevisto (obrigatório, convertido automaticamente de PREVISTO 2)

### Nome do Arquivo

O nome do arquivo pode seguir padrões como:
- `LD-8001PZ-F-XXXXX_REV_N_NOME.xlsx`
- `DF-LD-8001PZ-F-XXXXX_REV_N_NOME.xlsx`
- `LD_XXXXX_REV_YY.xlsx`
- `DF_XXXXX_REV_YY.xlsx`

**Nota**: O sistema extrai LD e revisão do nome do arquivo, mas também busca no conteúdo (CAPA/ROSTO e folha principal). Se houver inconsistência entre as fontes, será reportado como problema.

**Exemplos válidos:**
- `LD-8001PZ-F-11046_REV_10_ATKINS.xlsx`
- `LD-8001PZ-F-11047_REV_0_JOTAELE.xlsx`
- `DF-LD-8001PZ-F-11050_REV_5_EXEMPLO.xlsx`

## Problemas Comuns

### Arquivo não é processado

**Possíveis causas:**
1. Cabeçalho "NO VALE" não encontrado
2. Arquivo corrompido
3. Formato não suportado
4. Células mescladas no cabeçalho não estão sendo processadas corretamente

**Soluções:**
1. Verifique se o cabeçalho "NO VALE" existe na planilha
2. Verifique se há células mescladas no cabeçalho (o sistema deve processá-las automaticamente)
3. Tente abrir o arquivo no Excel para verificar se está íntegro
4. Certifique-se de que é CSV ou XLSX
5. Use o botão "Ver Detalhes ProcessarNomeERevisao" para verificar se LD e revisão foram extraídas corretamente

### Dados não aparecem

**Possíveis causas:**
1. Todas as linhas foram filtradas (AÇÕES = "E")
2. Dados obrigatórios não preenchidos (NO VALE, PREVISTO, PREVISTO 1, PREVISTO 2, FORMATO, PAGS/ FOLHAS, Disciplina, DataPrevisto)
3. Formato de data inválido em PREVISTO 2
4. Células mescladas no cabeçalho não foram transformadas corretamente

**Soluções:**
1. Verifique se há linhas com AÇÕES diferente de "E"
2. Verifique se todas as colunas obrigatórias estão preenchidas
3. Verifique se PREVISTO 2 está no formato dd/MM/yyyy ou dd/MM/yy (usado para gerar DataPrevisto)
4. Verifique se o cabeçalho tem células mescladas e se foram processadas corretamente
5. Consulte os detalhes do ProcessarNomeERevisao para verificar extração de LD e revisão

### Dashboard não carrega gráficos

**Possíveis causas:**
1. Bibliotecas Chart.js ou Plotly.js não carregadas
2. Dados de pós-processamento não disponíveis
3. Filtros muito restritivos (nenhum dado para exibir)

**Soluções:**
1. Verifique o console do navegador para erros de carregamento
2. Certifique-se de que processou o CSV gerencial antes de acessar o dashboard
3. Limpe os filtros e tente novamente
4. Recarregue a página (Ctrl+F5 ou Cmd+Shift+R)

### Erro ao carregar CSV gerencial grande

**Possíveis causas:**
1. Memória insuficiente no navegador
2. Arquivo muito grande (> 3GB)
3. Muitas abas abertas no navegador

**Soluções:**
1. Feche outras abas e aplicações
2. Reinicie o navegador
3. Use um navegador 64-bit com mais memória
4. O sistema já otimiza automaticamente, mas pode levar alguns minutos para arquivos muito grandes

### Erro ao exportar

**Possíveis causas:**
1. Navegador bloqueando download
2. Muitos dados para processar

**Soluções:**
1. Permita downloads no navegador
2. Tente exportar em formato diferente (JSON é mais leve)

## Dicas de Uso

### Processamento em Lote

- Você pode selecionar múltiplos arquivos de uma vez
- Todos serão processados sequencialmente
- Resultados serão consolidados

### Validação de Dados

- Sempre verifique a aba "Problemas" após processar
- Corrija problemas antes de exportar
- Use os dados processados apenas se não houver problemas críticos

### Exportação

- **JSON** é recomendado para integração com outros sistemas
- **Excel** é melhor para análise manual
- **CSV** é útil para importação em outras ferramentas

## Suporte

Para problemas ou dúvidas:

1. Consulte a documentação (README.md, PROJETO.md, etc.)
2. Verifique o console do navegador para erros
3. Entre em contato com a equipe de desenvolvimento

## Atualizações

O aplicativo é atualizado periodicamente. Para obter a versão mais recente:

1. Baixe a versão mais recente do repositório
2. Substitua os arquivos antigos
3. Recarregue a página no navegador (Ctrl+F5 ou Cmd+Shift+R)

## Fluxo Completo Recomendado

### Passo a Passo Completo

1. **Processar LDs**
   - Selecione e processe arquivos de LD
   - Revise problemas identificados
   - Corrija problemas nas LDs originais se necessário

2. **Pós-Processamento**
   - Carregue o CSV Gerencial Consolidado
   - Processe a validação
   - Revise inconsistências identificadas:
     - Vales não encontrados no CSV
     - Vales não emitidos
     - Discrepâncias de data

3. **Análise no Dashboard**
   - Acesse a aba "Dashboard"
   - Use filtros para análise específica
   - Explore visualizações para insights
   - Identifique padrões e tendências

4. **Exportação**
   - Exporte dados processados
   - Exporte resultados de validação
   - Use formato apropriado para seu caso

5. **Persistência**
   - Dados são salvos automaticamente
   - Use "Carregar Dados Salvos" em sessões futuras
   - Evite reprocessamento desnecessário

## Próximos Passos

Após processar as LDs e realizar pós-processamento:

1. Revise os dados processados e inconsistências identificadas
2. Corrija problemas identificados nas LDs originais
3. Use o Dashboard para análise detalhada
4. Exporte os dados no formato desejado
5. Integre com os próximos módulos do sistema
6. Aproveite a persistência de dados para análises futuras
