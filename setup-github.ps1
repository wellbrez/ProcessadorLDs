# Script de Setup do Repositório GitHub
# Execute este script para configurar o repositório Git e fazer o push inicial

Write-Host "=== Setup do Repositório GitHub ===" -ForegroundColor Cyan

# Verificar se git está instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Erro: Git não está instalado. Por favor, instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se já existe um repositório git
if (Test-Path .git) {
    Write-Host "Repositório Git já existe." -ForegroundColor Yellow
    $continuar = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continuar -ne "s" -and $continuar -ne "S") {
        exit 0
    }
} else {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Cyan
    git init
}

# Adicionar arquivos
Write-Host "Adicionando arquivos ao repositório..." -ForegroundColor Cyan
git add .

# Fazer commit inicial
Write-Host "Fazendo commit inicial..." -ForegroundColor Cyan
git commit -m "first commit"

# Renomear branch para main
Write-Host "Renomeando branch para main..." -ForegroundColor Cyan
git branch -M main

# Adicionar remote origin
Write-Host "Adicionando remote origin..." -ForegroundColor Cyan
Write-Host "URL do repositório: git@github.com:wellbrez/ProcessadorLDs.git" -ForegroundColor Yellow
$confirmar = Read-Host "Confirma esta URL? (s/n)"
if ($confirmar -eq "s" -or $confirmar -eq "S") {
    git remote add origin git@github.com:wellbrez/ProcessadorLDs.git
    Write-Host "Remote origin adicionado." -ForegroundColor Green
} else {
    Write-Host "Remote origin não foi adicionado. Adicione manualmente com:" -ForegroundColor Yellow
    Write-Host "git remote add origin git@github.com:wellbrez/ProcessadorLDs.git" -ForegroundColor Yellow
}

# Push para GitHub
Write-Host "Deseja fazer push para o GitHub agora? (s/n)" -ForegroundColor Cyan
$fazerPush = Read-Host
if ($fazerPush -eq "s" -or $fazerPush -eq "S") {
    Write-Host "Fazendo push para GitHub..." -ForegroundColor Cyan
    git push -u origin main
    Write-Host "Push concluído!" -ForegroundColor Green
} else {
    Write-Host "Push não realizado. Execute manualmente com:" -ForegroundColor Yellow
    Write-Host "git push -u origin main" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Concluído ===" -ForegroundColor Green
Write-Host "Repositório configurado com sucesso!" -ForegroundColor Green
