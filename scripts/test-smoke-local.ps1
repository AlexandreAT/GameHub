[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$networkName = "gamehub-smoke-$([Guid]::NewGuid().ToString('N'))"
$mongoName = "gamehub-smoke-mongo-$([Guid]::NewGuid().ToString('N'))"
$apiName = "gamehub-smoke-api-$([Guid]::NewGuid().ToString('N'))"
$portReservation = [System.Net.Sockets.TcpListener]::new(
    [System.Net.IPAddress]::Loopback,
    0
)
$portReservation.Start()
$frontendPort = $portReservation.LocalEndpoint.Port
$portReservation.Stop()
$frontendUrl = "http://127.0.0.1:$frontendPort"
$frontendOutput = Join-Path $env:TEMP "$networkName-frontend.log"
$frontendErrors = Join-Path $env:TEMP "$networkName-frontend-errors.log"
$viteProcess = $null

try {
    Write-Host 'Construindo a imagem local da API...'
    docker build --file Gamehub.Server/Dockerfile --tag gamehub-api:local . | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'A imagem local da API não foi construída.'
    }

    docker network create $networkName | Out-Null
    docker run --detach --rm --network $networkName --name $mongoName `
        mongo:8.0.12 --bind_ip_all | Out-Null

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $ping = docker exec $mongoName mongosh --quiet `
            --eval 'db.runCommand({ ping: 1 }).ok' 2>$null
        if ($ping -eq '1') {
            break
        }

        Start-Sleep -Seconds 1
    }

    if ($ping -ne '1') {
        throw 'O MongoDB local não iniciou.'
    }

    docker run --detach --rm --network $networkName --name $apiName `
        --publish 127.0.0.1::8080 `
        --env "DevNetStoreDatabase__ConnectionString=mongodb://${mongoName}:27017" `
        --env 'Jwt__SecretKey=GameHub-Smoke-Local-Only-Secret-Key-With-More-Than-32-Bytes' `
        --env 'Igdb__ClientId=smoke-local' `
        --env 'Igdb__ClientSecret=smoke-local' `
        --env 'ImgBb__ApiKey=smoke-local' `
        --env "Cors__AllowedOrigins__0=$frontendUrl" `
        --env 'Proxy__ForwardedHeadersEnabled=false' `
        gamehub-api:local | Out-Null

    $apiPort = $null
    $health = $null
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $portOutput = docker port $apiName 8080/tcp 2>$null
        if ($portOutput -match ':(\d+)$') {
            $apiPort = $Matches[1]
        }

        if ($apiPort) {
            $health = curl.exe -s -o NUL -w '%{http_code}' `
                "http://127.0.0.1:$apiPort/health"
            if ($health -eq '200') {
                break
            }
        }

        Start-Sleep -Seconds 1
    }

    if ($health -ne '200') {
        docker logs $apiName
        throw 'A API local não iniciou.'
    }

    $env:VITE_API_BASE_URL = "http://127.0.0.1:$apiPort/api"
    npm run build --prefix gamehub.client | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'O build local do frontend falhou.'
    }

    $viteProcess = Start-Process -FilePath (Get-Command 'node.exe').Source `
        -ArgumentList @(
            'node_modules/vite/bin/vite.js',
            'preview',
            '--host',
            '127.0.0.1',
            '--port',
            "$frontendPort",
            '--strictPort'
        ) `
        -WorkingDirectory (Resolve-Path 'gamehub.client') `
        -RedirectStandardOutput $frontendOutput `
        -RedirectStandardError $frontendErrors `
        -WindowStyle Hidden -PassThru

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $frontendStatus = curl.exe -s -o NUL -w '%{http_code}' `
            "$frontendUrl/register"
        if ($frontendStatus -eq '200') {
            break
        }

        Start-Sleep -Seconds 1
    }

    if ($frontendStatus -ne '200') {
        Get-Content $frontendOutput, $frontendErrors -ErrorAction SilentlyContinue
        throw 'O frontend local não iniciou.'
    }

    & ./scripts/smoke-deploy.ps1 `
        -BackendUrl "http://127.0.0.1:$apiPort" `
        -FrontendUrl $frontendUrl
}
finally {
    Remove-Item Env:VITE_API_BASE_URL -ErrorAction SilentlyContinue

    if ($viteProcess -and -not $viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue
        $viteProcess.WaitForExit()
    }

    Remove-Item $frontendOutput, $frontendErrors -ErrorAction SilentlyContinue

    docker rm --force $apiName 2>$null | Out-Null
    docker rm --force $mongoName 2>$null | Out-Null
    docker network rm $networkName 2>$null | Out-Null
}
