# ProcessadorLDs

Aplicativo standalone para processamento de Listas de Documentos (LDs) em diversos formatos.

## 📋 Descrição

O ProcessadorLDs é uma aplicação web standalone que processa múltiplas Listas de Documentos (LDs) em formatos CSV, XLSX e outros. O aplicativo extrai, valida e consolida dados de LDs, identificando problemas que impedem o processamento.

## 🚀 Características

- ✅ Processamento de múltiplos formatos (CSV, XLSX)
- ✅ Validação automática de dados obrigatórios
- ✅ Identificação de problemas nas LDs
- ✅ Extração automática de disciplina do número do vale
- ✅ Filtro de linhas com AÇÕES = "E"
- ✅ Exportação em múltiplos formatos (CSV, XLSX, JSON)
- ✅ Interface web standalone (não requer servidor)
- ✅ Processamento 100% client-side

## 📦 Estrutura do Projeto

```
ProcessadorLDs/
├── index.html              # Aplicação principal
├── js/
│   ├── processor.js       # Lógica de processamento
│   ├── validator.js        # Validações de dados
│   └── exporter.js         # Exportação de resultados
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
- Identificação automática do cabeçalho "NO VALE" ou "VALE DOCUMENT NUMBER"
- Normalização de nomes de colunas
- Limpeza e padronização de dados
- Extração de disciplina do número do vale

### Validações
- Verificação de dados obrigatórios
- Identificação de planilhas inconsistentes
- Detecção de LDs fora do padrão
- Validação de formato de arquivo

### Relatórios
- Status de processamento de cada LD
- Lista de problemas encontrados
- Estatísticas de processamento
- Exportação de resultados

## 🛠️ Tecnologias

- HTML5
- JavaScript (ES6+)
- SheetJS (xlsx.js) - Para processamento de Excel
- PapaParse - Para processamento de CSV
- CSS3

## 📖 Uso

1. Abra o arquivo `index.html` em um navegador moderno
2. Selecione um ou mais arquivos de LD (CSV ou XLSX)
3. Clique em "Processar"
4. Visualize os resultados e problemas identificados
5. Exporte os dados processados no formato desejado

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

Desenvolvido para processamento de Listas de Documentos da Vale.
# ProcessadorLDs
