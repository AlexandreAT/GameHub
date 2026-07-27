# GameHub — Publicação final

Este é o roteiro operacional curto para publicar o GameHub. Execute na ordem. Não crie `.env` com segredos e não cole valores reais em arquivos do repositório.

## 1. MongoDB Atlas — usuário do Render

1. Abra o projeto `GameHub` no Atlas.
2. Vá em **Security → Database & Network Access → Database Users**.
3. Clique em **Add New Database User**.
4. Escolha **Password / SCRAM**.
5. Use o nome `gamehub-render` e gere no seu gerenciador uma senha aleatória com 32 ou mais letras e números. Copie a senha uma única vez.
6. Em privilégios, escolha `readWrite` somente para o banco `GameHub`.
7. Salve em **Add User**.
8. Vá em **Database → Clusters → Cluster0 → Connect → Drivers** e copie a URI.
9. Substitua `<db_username>` por `gamehub-render` e `<db_password>` pela senha. Usando somente letras e números, não é necessário codificá-la para URL.

O usuário usado no desenvolvimento local pode continuar separado. Não use `Atlas Admin`, `readWriteAnyDatabase` ou a conta pessoal da interface.

## 2. Render — criar pelo Blueprint

1. Abra o Dashboard do Render.
2. Clique em **New → Blueprint**.
3. Conecte o GitHub e selecione `AlexandreAT/GameHub`.
4. Use a branch `main`. O Render lerá `render.yaml`.
5. Preencha os quatro campos secretos solicitados:

| Chave | Valor |
|---|---|
| `DevNetStoreDatabase__ConnectionString` | URI criada no passo 1 |
| `Igdb__ClientId` | Twitch Developer Console → `ProjectGameHub` → **Manage** → Client ID |
| `Igdb__ClientSecret` | segredo novo salvo ao clicar em **New Secret** no mesmo painel |
| `ImgBb__ApiKey` | chave atual do GameHub em `api.imgbb.com` → **API** |

As demais variáveis vêm automaticamente do `render.yaml`:

| Chave | Valor |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `DOTNET_EnableDiagnostics` | `0` |
| `Proxy__ForwardedHeadersEnabled` | `true` |
| `Cors__AllowedOrigins__0` | `https://projectgamehub.netlify.app` |
| `Jwt__SecretKey` | gerada automaticamente pelo Render |
| `Jwt__Issuer` | `GameHub.Api` |
| `Jwt__Audience` | `GameHub.Client` |
| `Jwt__ExpirationMinutes` | `30` |
| `DevNetStoreDatabase__DatabaseName` | `GameHub` |
| `DevNetStoreDatabase__UserCollectionName` | `Users` |
| `DevNetStoreDatabase__PostCollectionName` | `Posts` |
| `DevNetStoreDatabase__CommunityCollectionName` | `Communities` |

Não cadastre `PORT`: o Render fornece essa variável. Aguarde o primeiro deploy e copie a URL pública do serviço.

## 3. Atlas — liberar somente o Render

1. No serviço Render, abra **Connect → Outbound**.
2. Copie todos os intervalos CIDR exibidos.
3. No Atlas, vá em **Security → Database & Network Access → IP Access List**.
4. Clique em **Add IP Address** e adicione cada CIDR com a descrição `Render gamehub-api`.
5. Aguarde o status ficar ativo.

Nunca use `0.0.0.0/0` permanentemente.

## 4. Render — primeira validação

Abra, substituindo pela URL real:

```text
https://SEU-SERVICO.onrender.com/health
https://SEU-SERVICO.onrender.com/api/Users
```

O primeiro endereço deve responder `Healthy`; o segundo deve retornar JSON. Se o Atlas foi liberado depois do deploy, use **Manual Deploy → Deploy latest commit**.

## 5. Netlify — publicar o frontend novo

Use o projeto existente `projectgamehub` para preservar a URL.

1. Em **Project configuration → Build & deploy → Continuous deployment**, confirme que o repositório é `AlexandreAT/GameHub`, branch `main`. Se ainda apontar ao repositório antigo do frontend, relacione novamente ao repositório atual.
2. Em **Project configuration → Environment variables**, adicione:

```text
VITE_API_BASE_URL=https://SEU-SERVICO.onrender.com/api
```

Essa URL é pública; não marque como segredo. Use todos os deploy contexts ou, no mínimo, Production.

O `netlify.toml` já define:

| Campo | Valor |
|---|---|
| Base directory | `gamehub.client` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node | `24` |
| Production branch | `main` |

3. Vá em **Deploys → Trigger deploy → Deploy site**.
4. Aguarde `Published` e abra `https://projectgamehub.netlify.app`.

## 6. Smoke test final

Na raiz local do projeto, execute:

```powershell
./scripts/smoke-deploy.ps1 `
  -BackendUrl "https://SEU-SERVICO.onrender.com" `
  -FrontendUrl "https://projectgamehub.netlify.app"
```

O teste valida health, rota direta da SPA, bundle correto, ausência de chave ImgBB, CORS, cadastro, login, JWT, criação e exclusão de post. O usuário temporário é removido ao final.

## 7. Ativar auto-deploy

Somente depois da mensagem `Smoke test aprovado`:

1. Render → serviço `gamehub-api` → **Settings → Build & Deploy → Auto-Deploy**.
2. Selecione **On Commit** para a branch `main`.
3. Atualize também `autoDeployTrigger: off` para `autoDeployTrigger: commit` no `render.yaml` em um commit posterior, mantendo o Blueprint sincronizado.

O Netlify já acompanha a branch de produção quando o repositório está vinculado.

## Docker: local e produção

- Desenvolvimento comum: Docker não é necessário. Use `dotnet run` e `npm run dev`.
- Testes: Docker é usado para criar MongoDB descartável e validar a imagem da API.
- Render: Docker é o runtime do backend. O Render constrói o `Gamehub.Server/Dockerfile`; você não instala nem executa Docker manualmente no servidor.
- Netlify: Docker não participa do frontend.
- Segredos não entram na imagem. O Render injeta as variáveis somente na execução do container.
