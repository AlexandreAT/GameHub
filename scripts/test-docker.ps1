[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$rawSecrets = dotnet user-secrets list --project Gamehub.Server --json
$jsonSecrets = ($rawSecrets | Where-Object { $_ -notmatch '^//(BEGIN|END)$' }) -join "`n"
$secrets = $jsonSecrets | ConvertFrom-Json

$secretMappings = @{
    DevNetStoreDatabase__ConnectionString = 'DevNetStoreDatabase:ConnectionString'
    Jwt__SecretKey = 'Jwt:SecretKey'
    Igdb__ClientId = 'Igdb:ClientId'
    Igdb__ClientSecret = 'Igdb:ClientSecret'
    ImgBb__ApiKey = 'ImgBb:ApiKey'
}

foreach ($mapping in $secretMappings.GetEnumerator()) {
    $property = $secrets.PSObject.Properties[$mapping.Value]
    if ($null -eq $property -or [string]::IsNullOrWhiteSpace([string]$property.Value)) {
        throw "Configure o User Secret '$($mapping.Value)' antes de executar este teste."
    }

    Set-Item -Path "Env:$($mapping.Key)" -Value ([string]$property.Value)
}

$env:Cors__AllowedOrigins__0 = 'https://localhost:5173'
$env:Proxy__ForwardedHeadersEnabled = 'true'
$containerName = "gamehub-docker-test-$([Guid]::NewGuid().ToString('N'))"
$viteProcess = $null

try {
    Write-Host 'Iniciando a API Docker com a configuração local protegida...'
    $containerId = docker run --detach --rm --name $containerName `
        --publish 127.0.0.1::8080 `
        --env DevNetStoreDatabase__ConnectionString `
        --env Jwt__SecretKey `
        --env Igdb__ClientId `
        --env Igdb__ClientSecret `
        --env ImgBb__ApiKey `
        --env Cors__AllowedOrigins__0 `
        --env Proxy__ForwardedHeadersEnabled `
        gamehub-api:local

    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível iniciar a API Docker.'
    }

    $apiPort = $null
    $healthStatus = $null
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $portOutput = docker port $containerName 8080/tcp 2>$null
        if ($portOutput -match ':(\d+)$') {
            $apiPort = $Matches[1]
        }

        if ($apiPort) {
            $healthStatus = curl.exe -s -o NUL -w '%{http_code}' `
                -H 'X-Forwarded-Proto: https' "http://127.0.0.1:$apiPort/health"
            if ($healthStatus -eq '200') {
                break
            }
        }

        Start-Sleep -Seconds 1
    }

    if ($healthStatus -ne '200') {
        docker logs $containerName
        throw 'O health check da API Docker não respondeu 200.'
    }

    $atlasPayload = curl.exe -s -H 'X-Forwarded-Proto: https' `
        "http://127.0.0.1:$apiPort/api/Users"
    if ($LASTEXITCODE -ne 0) {
        throw 'A consulta controlada ao Atlas falhou.'
    }

    $atlasUsers = $atlasPayload | ConvertFrom-Json
    $atlasCount = if ($null -eq $atlasUsers) { 0 } else { @($atlasUsers).Count }

    $env:GAMEHUB_DEV_API_TARGET = "http://127.0.0.1:$apiPort"
    $viteProcess = Start-Process -FilePath 'node.exe' `
        -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1') `
        -WorkingDirectory (Resolve-Path 'gamehub.client') `
        -WindowStyle Hidden -PassThru

    $frontendApiStatus = $null
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $frontendApiStatus = curl.exe -k -s -o NUL -w '%{http_code}' `
            'https://127.0.0.1:5173/api/Users'
        if ($frontendApiStatus -eq '200') {
            break
        }

        Start-Sleep -Seconds 1
    }

    $spaStatus = curl.exe -k -s -o NUL -w '%{http_code}' `
        'https://127.0.0.1:5173/register'

    if ($frontendApiStatus -ne '200' -or $spaStatus -ne '200') {
        throw 'O frontend não acessou a API Docker ou não serviu a rota SPA.'
    }

    Write-Host "Docker health: $healthStatus"
    Write-Host "Atlas: leitura de $atlasCount usuário(s), sem alteração de dados"
    Write-Host "Frontend para API Docker: $frontendApiStatus"
    Write-Host "Rota SPA /register: $spaStatus"
}
finally {
    if ($viteProcess -and -not $viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
    }

    docker rm --force $containerName 2>$null | Out-Null

    foreach ($environmentName in $secretMappings.Keys) {
        Remove-Item "Env:$environmentName" -ErrorAction SilentlyContinue
    }

    Remove-Item Env:Cors__AllowedOrigins__0 -ErrorAction SilentlyContinue
    Remove-Item Env:Proxy__ForwardedHeadersEnabled -ErrorAction SilentlyContinue
    Remove-Item Env:GAMEHUB_DEV_API_TARGET -ErrorAction SilentlyContinue
}
