# GameHub

Rede social voltada a jogos, comunidades e descoberta de títulos. Usuários podem criar um perfil, publicar, comentar, reagir, seguir pessoas e comunidades e organizar uma biblioteca pessoal de jogos.

O frontend é uma SPA React hospedada separadamente no Netlify. A API ASP.NET Core roda no Render e utiliza MongoDB Atlas. As decisões arquiteturais, regras de segurança e fluxos internos estão detalhados em [PROJECT_GUIDE.md](./PROJECT_GUIDE.md). O histórico e o checklist operacional do deploy ficam em [DEPLOY.md](./DEPLOY.md).

## Stack

- Frontend: React 18, TypeScript, Vite e React Router;
- Backend: ASP.NET Core 8, C# e Controllers;
- Banco: MongoDB Atlas;
- Autenticação: JWT Bearer e BCrypt;
- Integrações: IGDB/Twitch e ImgBB;
- Infraestrutura: Docker, Render e Netlify.

## Estrutura

```text
GameHub/
├── Gamehub.Server/       API, domínio, serviços e Dockerfile
├── gamehub.client/       SPA React/Vite
├── render.yaml           infraestrutura do backend no Render
├── DEPLOY.md             auditoria, decisões e checklist de deploy
├── PROJECT_GUIDE.md      guia técnico e arquitetural
└── Gamehub.sln           solução para desenvolvimento local
```

Frontend e backend são aplicações independentes. Em desenvolvimento, o Vite encaminha `/api` para a API local. Em produção, o frontend usa `VITE_API_BASE_URL` para chamar o Render.

## Requisitos

- .NET SDK 8;
- Node.js 24;
- npm;
- acesso a um projeto MongoDB Atlas;
- credenciais da IGDB/Twitch e ImgBB;
- Docker Desktop apenas para validar a imagem Docker.

## Configuração local do backend

Os segredos locais são armazenados pelo .NET User Secrets e não entram no Git. Na raiz do repositório, configure:

```powershell
dotnet user-secrets set --project Gamehub.Server "DevNetStoreDatabase:ConnectionString" "mongodb+srv://USUARIO:SENHA@CLUSTER/"
dotnet user-secrets set --project Gamehub.Server "Igdb:ClientId" "SEU_CLIENT_ID"
dotnet user-secrets set --project Gamehub.Server "Igdb:ClientSecret" "SEU_CLIENT_SECRET"
dotnet user-secrets set --project Gamehub.Server "ImgBb:ApiKey" "SUA_CHAVE"
```

Gere uma chave JWT local e salve-a:

```powershell
$jwtSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
dotnet user-secrets set --project Gamehub.Server "Jwt:SecretKey" $jwtSecret
```

Para conferir a configuração local:

```powershell
dotnet user-secrets list --project Gamehub.Server
```

Esse comando também exibe os valores. Não compartilhe a saída e não copie os segredos para `appsettings.json`, `.env`, README, commits ou mensagens.

## Executando localmente

Abra dois terminais na raiz do projeto.

Na primeira configuração da máquina, confie no certificado HTTPS local:

```powershell
dotnet dev-certs https --trust
```

Terminal 1 — backend:

```powershell
dotnet restore Gamehub.Server/Gamehub.Server.csproj
dotnet run --project Gamehub.Server/Gamehub.Server.csproj --launch-profile https
```

A API ficará disponível em `https://localhost:7045`, com Swagger em `https://localhost:7045/swagger` e liveness em `https://localhost:7045/health`.

Terminal 2 — frontend:

```powershell
cd gamehub.client
npm ci
npm run dev
```

Abra `https://localhost:5173`. Nenhuma variável é necessária para o fluxo local padrão: o Vite envia `/api` para `https://localhost:7045`.

Após o login, o JWT fica no `sessionStorage` da aba atual. O Axios adiciona o Bearer automaticamente, remove tokens expirados ou rejeitados e o logout encerra a sessão. Fechar a aba também remove o token.

Para apontar o frontend a outro backend, copie `gamehub.client/.env.example` para `gamehub.client/.env.local` e altere:

```dotenv
VITE_API_BASE_URL=https://seu-backend/api
```

Somente a URL pública da API pode usar prefixo `VITE_`. Segredos nunca podem estar no frontend.

## Contas antigas

As senhas legadas em texto puro foram invalidadas. Para redefinir localmente uma conta existente sem criar endpoint administrativo:

```powershell
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run --project Gamehub.Server/Gamehub.Server.csproj -- --reset-user-password usuario@email.com
```

A senha é digitada sem aparecer no terminal, e tokens anteriores são revogados.

## Build e verificações

```powershell
dotnet restore Gamehub.Server/Gamehub.Server.csproj
dotnet build Gamehub.Server/Gamehub.Server.csproj --no-restore
dotnet list Gamehub.Server/Gamehub.Server.csproj package --vulnerable --include-transitive

cd gamehub.client
npm ci
npm run lint
npm run build
npm audit --omit=dev
```

O lint comum não possui erros, mas ainda informa dependências legadas de `useEffect`. Use `npm run lint:strict` para acompanhar esse débito até não restar nenhum aviso. A exceção atual do `npm audit --omit=dev` é restrita ao modo RSC do React Router, que não é utilizado por esta SPA, e está registrada em [DEPLOY.md](./DEPLOY.md).

## Docker

A imagem contém somente a API:

```powershell
docker build -f Gamehub.Server/Dockerfile -t gamehub-api .
```

O container usa a porta `8080` por padrão. No Render, a aplicação lê `PORT` e passa a escutar automaticamente em `0.0.0.0:$PORT`.

## Deploy

- Backend: o [render.yaml](./render.yaml) cria um Web Service Docker com `/health`, região `virginia` e auto-deploy inicialmente desligado;
- Frontend: o [netlify.toml](./netlify.toml) define base, build, publicação, Node 24, fallback SPA, cache e headers de segurança;
- Banco: MongoDB Atlas;
- Segredos: variáveis protegidas nos painéis de cada provedor.

No Netlify, a única configuração manual do frontend é `VITE_API_BASE_URL=https://URL-DO-RENDER/api`. Essa URL é pública; não coloque nenhum segredo em variáveis `VITE_*`.

O passo a passo de publicação e todas as variáveis estão em [DEPLOY.md](./DEPLOY.md).

## Estado atual

- Repositório consolidado e sem segredos ativos versionados;
- Autenticação, claims e ownership protegidos;
- API e SPA desacopladas;
- Desenvolvimento local preservado;
- Backend preparado para build Docker e Render;
- Deploy público ainda deve seguir o checklist controlado do `DEPLOY.md`.
