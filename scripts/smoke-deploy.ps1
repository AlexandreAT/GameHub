[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackendUrl,

    [Parameter(Mandatory = $true)]
    [string]$FrontendUrl
)

$ErrorActionPreference = 'Stop'

$backendRoot = $BackendUrl.TrimEnd('/')
$frontendRoot = $FrontendUrl.TrimEnd('/')
$backendUri = [Uri]$backendRoot
$frontendUri = [Uri]$frontendRoot

foreach ($uri in @($backendUri, $frontendUri)) {
    $isLocalHttp = $uri.Scheme -eq 'http' -and
        $uri.Host -in @('localhost', '127.0.0.1')

    if ($uri.Scheme -ne 'https' -and -not $isLocalHttp) {
        throw "Use HTTPS para URLs públicas: $uri"
    }
}

$apiBaseUrl = "$backendRoot/api"
$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 12)
$email = "smoke-$suffix@gamehub.test"
$nickname = "smoke$suffix"
$password = "Smoke-$([Guid]::NewGuid().ToString('N'))"
$token = $null
$postId = $null
$userCreated = $false

try {
    Write-Host 'Validando health, frontend e configuração do bundle...'
    $health = Invoke-WebRequest -UseBasicParsing -Uri "$backendRoot/health"
    if ($health.StatusCode -ne 200) {
        throw "Health respondeu $($health.StatusCode)."
    }

    $frontend = Invoke-WebRequest -UseBasicParsing -Uri "$frontendRoot/"
    $directRoute = Invoke-WebRequest -UseBasicParsing -Uri "$frontendRoot/register"
    if ($frontend.StatusCode -ne 200 -or $directRoute.StatusCode -ne 200) {
        throw 'O frontend ou a rota direta /register não respondeu 200.'
    }

    $scriptMatch = [regex]::Match(
        $frontend.Content,
        '<script[^>]+src="([^"]+\.js)"')
    if (-not $scriptMatch.Success) {
        throw 'O bundle JavaScript do frontend não foi localizado.'
    }

    $bundleUri = [Uri]::new($frontendUri, $scriptMatch.Groups[1].Value)
    $bundle = (Invoke-WebRequest -UseBasicParsing -Uri $bundleUri).Content
    if (-not $bundle.Contains($apiBaseUrl)) {
        throw 'O bundle publicado não contém a URL esperada da API Render.'
    }

    if ($bundle.Contains('api.imgbb.com/1/upload?key=')) {
        throw 'O bundle ainda contém uma chave ImgBB e não deve ser publicado.'
    }

    Write-Host 'Validando CORS e fluxo autenticado temporário...'
    $corsResponse = Invoke-WebRequest -UseBasicParsing -Uri "$backendRoot/health" `
        -Headers @{ Origin = $frontendRoot }
    if ($corsResponse.Headers['Access-Control-Allow-Origin'] -ne $frontendRoot) {
        throw 'A API não autorizou a origem exata do frontend no CORS.'
    }

    $registerBody = @{
        name = 'Smoke'
        surname = 'Deploy'
        nickname = $nickname
        email = $email
        password = $password
    } | ConvertTo-Json

    Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/Users" `
        -ContentType 'application/json' -Body $registerBody | Out-Null
    $userCreated = $true

    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/Users/login" `
        -ContentType 'application/json' -Body $loginBody
    $token = $login.token
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw 'O login não retornou JWT.'
    }

    $authorizedHeaders = @{ Authorization = "Bearer $token" }
    $currentUser = Invoke-RestMethod -Uri "$apiBaseUrl/Users/current" `
        -Headers $authorizedHeaders
    if ($currentUser.email -ne $email) {
        throw 'A rota autenticada retornou um usuário inesperado.'
    }

    $postBody = @{
        title = "Smoke $suffix"
        content = 'Publicação temporária criada pelo smoke test de produção.'
    } | ConvertTo-Json

    $post = Invoke-RestMethod -Method Post -Uri "$apiBaseUrl/Posts" `
        -Headers $authorizedHeaders -ContentType 'application/json' -Body $postBody
    $postId = $post.id
    if ([string]::IsNullOrWhiteSpace($postId)) {
        throw 'A criação do post não retornou ID.'
    }

    Invoke-RestMethod -Method Delete -Uri "$apiBaseUrl/Posts/$postId" `
        -Headers $authorizedHeaders | Out-Null
    $postId = $null

    Invoke-RestMethod -Method Delete -Uri "$apiBaseUrl/Users/current" `
        -Headers $authorizedHeaders | Out-Null
    $userCreated = $false
    $token = $null

    Write-Host 'Smoke test aprovado: frontend, API, CORS, MongoDB e autenticação funcionando.'
}
finally {
    if ($token -and $postId) {
        try {
            Invoke-RestMethod -Method Delete -Uri "$apiBaseUrl/Posts/$postId" `
                -Headers @{ Authorization = "Bearer $token" } | Out-Null
        }
        catch {
            Write-Warning "Não foi possível remover o post temporário $postId."
        }
    }

    if ($token -and $userCreated) {
        try {
            Invoke-RestMethod -Method Delete -Uri "$apiBaseUrl/Users/current" `
                -Headers @{ Authorization = "Bearer $token" } | Out-Null
            $userCreated = $false
        }
        catch {
            Write-Warning "Remova manualmente o usuário temporário $email."
        }
    }

    if ($userCreated) {
        Write-Warning "O usuário temporário $email pode precisar de remoção no Atlas."
    }
}
