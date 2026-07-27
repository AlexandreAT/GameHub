[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$containerName = "gamehub-tests-$([Guid]::NewGuid().ToString('N'))"
$mongoImage = 'mongo:8.0.12'

try {
    Write-Host 'Iniciando MongoDB isolado para os testes...'
    $containerId = docker run --detach --rm --name $containerName `
        --publish 127.0.0.1::27017 $mongoImage --bind_ip_all

    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível iniciar o MongoDB de testes.'
    }

    $publishedPort = $null
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $portOutput = docker port $containerName 27017/tcp 2>$null
        if ($portOutput -match ':(\d+)$') {
            $publishedPort = $Matches[1]
        }

        $ping = docker exec $containerName mongosh --quiet `
            --eval 'db.runCommand({ ping: 1 }).ok' 2>$null
        if ($ping -eq '1' -and $publishedPort) {
            break
        }

        Start-Sleep -Seconds 1
    }

    if (-not $publishedPort -or $ping -ne '1') {
        throw 'O MongoDB de testes não ficou pronto dentro do tempo esperado.'
    }

    $env:GAMEHUB_TEST_MONGODB_URI = "mongodb://127.0.0.1:$publishedPort"
    dotnet test Gamehub.Server.Tests/Gamehub.Server.Tests.csproj

    if ($LASTEXITCODE -ne 0) {
        throw 'Os testes de integração falharam.'
    }
}
finally {
    Remove-Item Env:GAMEHUB_TEST_MONGODB_URI -ErrorAction SilentlyContinue
    docker rm --force $containerName 2>$null | Out-Null
}
