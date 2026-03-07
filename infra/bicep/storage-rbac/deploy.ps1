<#
.SYNOPSIS
    Deploys storage-rbac infrastructure to Azure.
.DESCRIPTION
    Creates resource group and deploys Bicep template with what-if validation.
.PARAMETER ResourceGroupName
    Target resource group name.
.PARAMETER Location
    Azure region for deployment.
.PARAMETER Environment
    Target environment (dev/staging/prod).
.PARAMETER SkipWhatIf
    Skip the what-if preview and deploy directly.
#>
[CmdletBinding()]
param(
    [string]$ResourceGroupName = 'rg-storage-rbac-dev',
    [string]$Location = 'swedencentral',
    [string]$Environment = 'dev',
    [switch]$SkipWhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$templateFile = Join-Path $scriptDir 'main.bicep'
$parameterFile = Join-Path $scriptDir 'main.bicepparam'

# ── Banner ──────────────────────────────────────
Write-Host ''
Write-Host '╔══════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║   storage-rbac — Bicep Deployment        ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''
Write-Host "  Resource Group : $ResourceGroupName" -ForegroundColor White
Write-Host "  Location       : $Location" -ForegroundColor White
Write-Host "  Environment    : $Environment" -ForegroundColor White
Write-Host "  Template       : $templateFile" -ForegroundColor White
Write-Host ''

# ── Validate prerequisites ──────────────────────
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error 'Azure CLI (az) not found. Install from https://aka.ms/install-azure-cli'
    exit 1
}

if (-not (Test-Path $templateFile)) {
    Write-Error "Template file not found: $templateFile"
    exit 1
}

# ── Create resource group ───────────────────────
Write-Host '[1/3] Creating resource group...' -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location --output none
if ($LASTEXITCODE -ne 0) { Write-Error 'Failed to create resource group'; exit 1 }
Write-Host "      Resource group '$ResourceGroupName' ready." -ForegroundColor Green

# ── What-If analysis ────────────────────────────
if (-not $SkipWhatIf) {
    Write-Host '[2/3] Running what-if analysis...' -ForegroundColor Yellow
    az deployment group what-if `
        --resource-group $ResourceGroupName `
        --template-file $templateFile `
        --parameters $parameterFile
    if ($LASTEXITCODE -ne 0) { Write-Error 'What-if analysis failed'; exit 1 }

    Write-Host ''
    $confirm = Read-Host 'Proceed with deployment? (y/N)'
    if ($confirm -ne 'y') {
        Write-Host 'Deployment cancelled.' -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host '[2/3] Skipping what-if (SkipWhatIf flag set).' -ForegroundColor Yellow
}

# ── Deploy ──────────────────────────────────────
Write-Host '[3/3] Deploying Bicep template...' -ForegroundColor Yellow
$result = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file $templateFile `
    --parameters $parameterFile `
    --name "storage-rbac-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) { Write-Error 'Deployment failed'; exit 1 }

# ── Output results ──────────────────────────────
Write-Host ''
Write-Host '╔══════════════════════════════════════════╗' -ForegroundColor Green
Write-Host '║   ✅ Deployment Succeeded                 ║' -ForegroundColor Green
Write-Host '╚══════════════════════════════════════════╝' -ForegroundColor Green
Write-Host ''

if ($result.properties.outputs) {
    Write-Host '  Outputs:' -ForegroundColor Cyan
    Write-Host "    Storage Account : $($result.properties.outputs.storageAccountName.value)"
    Write-Host "    Storage ID      : $($result.properties.outputs.storageAccountId.value)"
    Write-Host "    Blob Endpoint   : $($result.properties.outputs.blobEndpoint.value)"
    Write-Host "    Role Assignment : $($result.properties.outputs.roleAssignmentId.value)"
}
Write-Host ''
