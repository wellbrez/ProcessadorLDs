# ProcessadorLDs

Aplicativo standalone para processamento de Listas de Documentos (LDs) em diversos formatos.

**Autor:** Wellington Bravin  
**Data:** 26/01/2026

## 📋 Descrição

O ProcessadorLDs é uma aplicação web standalone que processa múltiplas Listas de Documentos (LDs) em formatos CSV, XLSX e outros. O aplicativo extrai, valida e consolida dados de LDs, identificando problemas que impedem o processamento. Além disso, oferece pós-processamento com validação contra CSV gerencial do sistema oficial, dashboard profissional com visualizações avançadas (gráficos 3D e mapas de calor), e persistência de dados no navegador para evitar reprocessamento.

## 🚀 Características

- ✅ Processamento de múltiplos formatos (CSV, XLSX)
- ✅ **ProcessarNomeERevisao**: Extração de LD e revisão de 3 fontes com validação de consistência
- ✅ Transformação de cabeçalho com células mescladas (seguindo lógica do Power Query)
- ✅ Validação automática de dados obrigatórios
- ✅ Identificação de problemas nas LDs (incluindo inconsistências de LD/Revisão)
- ✅ Extração automática de disciplina do número do vale
- ✅ Conversão automática de PREVISTO 2 para DataPrevisto (suporta dd/MM/yyyy e dd/MM/yy)
- ✅ Filtro de linhas com AÇÕES = "E"
- ✅ Exportação em múltiplos formatos (CSV, XLSX, JSON)
- ✅ **Pós-processamento com CSV Gerencial**: Validação contra extrato oficial do sistema
- ✅ **Dashboard Profissional**: Visualizações avançadas com gráficos 3D e mapas de calor
- ✅ **Persistência de Dados**: Salvamento automático no navegador para evitar reprocessamento
- ✅ Interface web standalone (não requer servidor)
- ✅ Processamento 100% client-side
- ✅ Informações detalhadas do ProcessarNomeERevisao disponíveis na interface
- ✅ Otimização para arquivos grandes (até 3GB de CSV)

## 📦 Estrutura do Projeto

```
ProcessadorLDs/
├── index.html              # Aplicação principal
├── js/
│   ├── processor.js       # Lógica de processamento
│   ├── validator.js        # Validações de dados
│   ├── exporter.js         # Exportação de resultados
│   ├── postprocessor.js    # Pós-processamento com CSV gerencial
│   ├── dashboard.js        # Visualizações e gráficos do dashboard
│   └── app.js              # Orquestração da aplicação
├── css/
│   └── styles.css          # Estilos da aplicação
├── README.md
├── PROJETO.md
├── ARQUITETURA.md
├── GUIA-DESENVOLVIMENTO.md
├── GUIA-STARTUP.md
└── .gitignore
```

## 🎯 Funcionalidades Principais

### Processamento de LDs
- **ProcessarNomeERevisao**: Extração de LD e revisão de 3 fontes (nome arquivo, CAPA/ROSTO, folha principal)
- Validação de consistência entre fontes encontradas
- Identificação automática do cabeçalho "NO VALE" ou "VALE DOCUMENT NUMBER"
- **Transformação de cabeçalho com células mescladas** (FillDown + combinação com índice)
- Normalização de nomes de colunas usando tabela de conversão
- Limpeza e padronização de dados
- Extração de disciplina do número do vale
- Conversão de PREVISTO 2 para DataPrevisto (objeto Date) - suporta formatos dd/MM/yyyy e dd/MM/yy

### Validações
- Verificação de dados obrigatórios (NO VALE, PREVISTO, PREVISTO 1, PREVISTO 2, FORMATO, PAGS/ FOLHAS, Disciplina, DataPrevisto)
- Validação de consistência de LD e revisão entre múltiplas fontes
- Identificação de planilhas inconsistentes
- Detecção de LDs fora do padrão
- Validação de formato de arquivo

### Relatórios
- Status de processamento de cada LD
- Lista de problemas encontrados
- Estatísticas de processamento
- Exportação de resultados

### Pós-Processamento com CSV Gerencial
- Validação de vales contra extrato oficial do sistema
- Verificação de emissão (PrimEmissao)
- Comparação de datas (Data GR Rec vs REALIZADO 2)
- Identificação de discrepâncias
- Exportação de resultados de validação

### Dashboard Profissional
- 10 visualizações avançadas (gráficos 2D, 3D e mapas de calor)
- Filtros avançados (Projeto, Empresa, LD, Disciplina, Formato, Período)
- Análise temporal de Previsto vs Realizado
- Visualização 3D de Disciplina × Projeto × Quantidade
- Mapas de calor para análise de discrepâncias e taxas de emissão
- Gráfico de Gantt para timeline de documentos
- Análise de distribuição e dispersão

### Persistência de Dados
- Salvamento automático após processamento
- Carregamento de dados salvos
- Gerenciamento de dados no navegador

## 🛠️ Tecnologias

- HTML5
- JavaScript (ES6+)
- SheetJS (xlsx.js) - Para processamento de Excel
- PapaParse - Para processamento de CSV
- Chart.js 4.4.0 - Para gráficos 2D interativos
- Plotly.js 2.27.0 - Para gráficos 3D e mapas de calor
- CSS3
- LocalStorage API - Para persistência de dados

## 📖 Uso

### Processamento Básico
1. Abra o arquivo `index.html` em um navegador moderno
2. Selecione um ou mais arquivos de LD (CSV ou XLSX)
3. Clique em "Processar"
4. Visualize os resultados e problemas identificados
5. Exporte os dados processados no formato desejado

### Pós-Processamento com CSV Gerencial
1. Após processar as LDs, selecione o arquivo CSV Gerencial Consolidado
2. Aguarde o carregamento (otimizado para arquivos grandes até 3GB)
3. Clique em "Processar Validação"
4. Visualize estatísticas e inconsistências identificadas
5. Exporte resultados de validação (CSV, JSON, XLSX)

### Dashboard de Análise
1. Após o pós-processamento, acesse a aba "Dashboard"
2. Use os filtros para refinar a análise (Projeto, Empresa, LD, Disciplina, etc.)
3. Explore as 10 visualizações disponíveis
4. Interaja com gráficos 3D e mapas de calor
5. Exporte gráficos individuais se necessário

### Dados Salvos
- Os dados são salvos automaticamente após processamento
- Use "Carregar Dados Salvos" para restaurar sem reprocessar
- Gerencie dados salvos através da interface

## 📝 Documentação

Consulte os arquivos de documentação para mais detalhes:
- [PROJETO.md](PROJETO.md) - Visão geral do projeto
- [ARQUITETURA.md](ARQUITETURA.md) - Arquitetura do sistema
- [GUIA-DESENVOLVIMENTO.md](GUIA-DESENVOLVIMENTO.md) - Guia para desenvolvedores
- [GUIA-STARTUP.md](GUIA-STARTUP.md) - Guia de inicialização

## 🔧 Desenvolvimento

Para contribuir com o projeto, consulte o [GUIA-DESENVOLVIMENTO.md](GUIA-DESENVOLVIMENTO.md).

## 📄 Licença

Este projeto é de uso interno.

## 👥 Autor

**Wellington Bravin**  
Desenvolvido em 21/01/2026, atualizado em 26/01/2026 para processamento de Listas de Documentos da Vale.
