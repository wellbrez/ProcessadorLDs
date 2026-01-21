# GUIA-STARTUP.md - ProcessadorLDs

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
- **Problemas**: Lista de problemas encontrados

### 5. Exportar Resultados

1. Selecione o formato de exportação:
   - **CSV**: Arquivo CSV simples
   - **Excel**: Arquivo XLSX com múltiplas abas
   - **JSON**: Arquivo JSON (recomendado para integração)

2. Clique em "Exportar"
3. O arquivo será baixado automaticamente

## Formato de Arquivo LD

### Estrutura Esperada

O arquivo LD deve conter:

1. **Cabeçalho**: Linha contendo "NO VALE" ou "VALE DOCUMENT NUMBER"
2. **Colunas**: As seguintes colunas devem estar presentes:
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
   - AÇÕES (opcional)

### Nome do Arquivo

O nome do arquivo deve seguir o padrão:
- `LD_XXXXX_REV_YY.xlsx` ou
- `DF_XXXXX_REV_YY.xlsx`

Onde:
- `XXXXX`: Identificador da LD
- `YY`: Número da revisão

**Exemplos válidos:**
- `LD_001_REV_01.xlsx`
- `DF_123_REV_05.xlsx`

## Problemas Comuns

### Arquivo não é processado

**Possíveis causas:**
1. Nome do arquivo não segue o padrão
2. Cabeçalho "NO VALE" não encontrado
3. Arquivo corrompido
4. Formato não suportado

**Soluções:**
1. Verifique o nome do arquivo
2. Verifique se o cabeçalho existe
3. Tente abrir o arquivo no Excel para verificar se está íntegro
4. Certifique-se de que é CSV ou XLSX

### Dados não aparecem

**Possíveis causas:**
1. Todas as linhas foram filtradas (AÇÕES = "E")
2. Dados obrigatórios não preenchidos
3. Formato de data inválido

**Soluções:**
1. Verifique se há linhas com AÇÕES diferente de "E"
2. Verifique se todas as colunas obrigatórias estão preenchidas
3. Verifique se as datas estão no formato dd/MM/yyyy

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

## Próximos Passos

Após processar as LDs:

1. Revise os dados processados
2. Corrija problemas identificados nas LDs originais
3. Exporte os dados no formato desejado
4. Integre com os próximos módulos do sistema
