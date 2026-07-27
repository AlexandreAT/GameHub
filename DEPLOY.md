# GameHub — auditoria e plano de deploy

Data da auditoria: 26/07/2026.

Este documento descreve o estado encontrado no repositório final, compara a pasta histórica `GameHub Deploy` e define o caminho recomendado para publicar o frontend no Netlify, o backend no Render e manter os dados no MongoDB Atlas.

> Status atual: **Tarefas 1, 2, 3 e 4 concluídas; publicação controlada ainda pendente**. Backend e frontend estão configurados para Render e Netlify, preservando o desenvolvimento local. O próximo passo é configurar as plataformas e executar os testes ponta a ponta.

## 1. Arquitetura encontrada

### Frontend

- React 18 + TypeScript.
- Vite 5.
- React Router 7, Axios, `qs`, React Icons e React Input Mask.
- SPA com páginas de login, cadastro, perfis, comunidades, posts, comentários, busca, biblioteca e integração com jogos.
- Cliente HTTP centralizado em `gamehub.client/src/axios-config.ts`.
- A URL da API vem de `VITE_API_BASE_URL`; no desenvolvimento, o fallback `/api` usa o proxy do Vite.
- Uploads de imagem passam pelo backend; a chave do ImgBB não é mais entregue ao navegador.

### Backend

- ASP.NET Core Web API em .NET 8.
- MongoDB.Driver 3.10.0.
- JWT Bearer.
- Integração com IGDB/Twitch.
- Swagger em ambiente de desenvolvimento.
- Controllers: usuários, posts, comunidades e IGDB.
- Services acessam diretamente as coleções `Users`, `Posts` e `Communities`.
- A API está desacoplada da SPA e possui build, execução e imagem Docker independentes.

### Dados e serviços externos

- MongoDB Atlas: banco `GameHub` e três coleções configuradas em `appsettings.json`.
- IGDB: credenciais lidas da configuração privada do backend.
- ImgBB: chave lida da configuração privada e usada pelo serviço de upload do backend.

### Repositório e automação

- Branch principal: `main`.
- Remote: `AlexandreAT/GameHub` no GitHub.
- Existe um `.gitignore` único na raiz para frontend, backend, IDEs e segredos locais.
- O workflow antigo de Azure App Service foi removido na Tarefa 1.
- Existem `Dockerfile`, `.dockerignore` e `render.yaml` para o backend e `netlify.toml` para o frontend.
- Não foram encontrados testes automatizados.

## 2. Conclusão sobre Render + Atlas

O Render consegue se conectar normalmente ao MongoDB Atlas usando o driver atual e uma connection string `mongodb+srv://`. A configuração correta exige:

1. backend em um Render Web Service com runtime Docker;
2. processo ouvindo em `0.0.0.0` e na porta recebida em `PORT`;
3. connection string guardada como secret do Render;
4. usuário próprio no Atlas com acesso apenas de leitura/escrita ao banco `GameHub`;
5. faixas de IP de saída do serviço Render adicionadas ao IP Access List do Atlas.

O Render publica as faixas de saída de cada serviço em **Connect > Outbound**. É preferível liberar essas faixas no Atlas em vez de deixar `0.0.0.0/0`. O Atlas também exige usuário de banco válido e senha com caracteres especiais corretamente codificados na URI.

## 3. Bloqueadores encontrados

### P0 — corrigir e rotacionar antes de qualquer deploy público

1. **Credenciais versionadas e presentes no histórico Git**

   - URI completa do MongoDB em `Gamehub.Server/appsettings.json`, inclusive duplicada em comentário.
   - Chave de assinatura JWT no mesmo arquivo.
   - Client secret da IGDB repetido em três métodos de `IgdbController.cs`.
   - Chave do ImgBB presente em cinco URLs do frontend.
   - Binários já versionados também contêm cópia de `appsettings.json`.

   Ação: rotacionar senha do usuário MongoDB, segredo IGDB, chave ImgBB e chave JWT. Apenas apagar os valores do commit atual não invalida o que já foi publicado. A limpeza do histórico deve ocorrer somente depois das rotações e com backup, pois reescreve commits.

2. **Senhas de usuários em texto puro**

   - Cadastro salva a senha diretamente no documento MongoDB.
   - Login pesquisa por `email && password` no banco.
   - Atualização de perfil volta a salvar a senha recebida.
   - `GET /api/Users/getPassword` devolve a senha quando email e apelido conferem.

   Ação: remover o endpoint de recuperação, usar hash de senha com salt, nunca retornar senha e invalidar/resetar os registros antigos. Para um banco de demonstração, a opção mais segura é apagar as contas antigas e recriar apenas usuários fictícios.

3. **Dados pessoais expostos**

   - `GET /api/Users` retorna objetos `User` completos, incluindo senha, CPF, email e telefone.
   - Outros endpoints também retornam o modelo de persistência diretamente.

   Ação: criar DTOs de entrada/saída e nunca serializar senha, CPF ou dados privados. Reavaliar se CPF é realmente necessário; para um projeto de portfólio, a recomendação é removê-lo e não armazenar dados reais.

4. **Autorização ausente e IDOR**

   - Nenhuma action usa `[Authorize]`.
   - Alteração/exclusão de usuário, posts, comunidades, follow, biblioteca, imagem, like e comentário confiam em IDs enviados pelo navegador.
   - Um cliente pode tentar alterar recursos de outro usuário apenas trocando o ID.

   Ação: proteger operações privadas com `[Authorize]`, extrair o ID do usuário de claims validadas e verificar propriedade/permissão de cada recurso no servidor.

5. **JWT lido sem validação criptográfica**

   - `GetCurrentUserData` usa `ReadJwtToken`, que apenas decodifica o conteúdo.
   - Não há validação da assinatura, vida útil, issuer ou audience nesse fluxo.
   - O token dura 10 minutos, mas o cookie do frontend dura 7 dias e não existe refresh token.

   Ação: deixar o middleware JWT validar tudo; configurar `issuer`, `audience`, `lifetime` e signing key; remover parsing manual. Definir uma única estratégia de autenticação. Para cookie HttpOnly entre domínios, considerar domínio próprio ou proxy `/api` do Netlify, além de proteção CSRF.

6. **Segredo da IGDB no código e endpoint sem proteção/rate limit**

   Ação: mover `ClientId` e `ClientSecret` para configuração segura, centralizar o cliente e aplicar validação, timeout, cache e limite de requisições.

### Segurança da API implementada em 27/07/2026

- Senhas novas usam BCrypt com salt e fator de trabalho 12.
- As 31 contas legadas tiveram as senhas antigas invalidadas e foram marcadas para redefinição; nenhuma senha em texto puro foi preservada.
- A migração administrativa é idempotente. Em PowerShell local, execute `$env:ASPNETCORE_ENVIRONMENT="Development"` e depois `dotnet run --project Gamehub.Server -- --reset-legacy-passwords`; a segunda execução deve migrar zero contas.
- Para recuperar uma conta legada sem expor um endpoint, execute localmente `dotnet run --project Gamehub.Server -- --reset-user-password usuario@email.com` e digite a nova senha quando solicitado. A senha não aparece na tela nem na linha de comando e os tokens anteriores são revogados.
- O endpoint `getPassword` e os modelos que carregavam senha/CPF foram removidos.
- DTOs distintos controlam cadastro, login, atualização e perfis público/privado; senha e CPF nunca são serializados nas respostas.
- O cadastro deixou de solicitar CPF e o gerador de CPF fictício foi removido. Os valores legados não são expostos, mas só devem ser apagados do Atlas em uma limpeza de dados aprovada separadamente.
- Autenticação passou a ser obrigatória por padrão. Somente actions explicitamente marcadas com `[AllowAnonymous]` são públicas.
- O usuário autenticado é obtido da claim `sub`; IDs enviados pelo frontend não autorizam mutações.
- Alteração/exclusão de usuários, posts, comentários e comunidades verifica ownership no servidor.
- JWT valida assinatura, issuer, audience e expiração de 30 minutos, sem tolerância de relógio. A versão de segurança do usuário revoga tokens antigos após troca de senha.
- Login/cadastro, IGDB e uploads possuem rate limiting e retornam `429` quando o limite é excedido.
- Conteúdo de usuários não usa mais `dangerouslySetInnerHTML`, eliminando o vetor encontrado de XSS armazenado.
- O fluxo público inseguro de recuperação foi desativado. Contas legadas podem ser recuperadas pelo comando administrativo local até existir recuperação por email com token descartável.
- `MongoDB.Driver` foi atualizado para 3.10.0, `IGDB` para 6.1.0 e `Newtonsoft.Json` foi fixado em 13.0.4. A auditoria NuGet não encontra mais pacotes vulneráveis.
- As dependências de produção do frontend foram atualizadas. O único alerta restante do `npm audit --omit=dev` afeta exclusivamente o modo RSC do React Router, que não é usado por esta SPA; não há versão estável corrigida disponível em 27/07/2026.

### P1 — bloqueadores de infraestrutura resolvidos em 27/07/2026

1. **Build do frontend quebra em CI**

   `npm run build` executa o TypeScript, mas o `vite.config.ts` tenta criar e ler certificado HTTPS de desenvolvimento durante qualquer build. Isso falhou localmente e tende a falhar no Netlify.

   Resolvido: o certificado é preparado somente no comando `serve`; o build de produção não depende de `dotnet dev-certs`.

2. **URL do backend fixa no código**

   Resolvido: o Axios usa `VITE_API_BASE_URL` e o fallback `/api` é encaminhado à API local pelo Vite. Variáveis `VITE_*` continuam restritas a dados públicos.

3. **CORS aceita apenas localhost**

   Resolvido: a política lê `Cors:AllowedOrigins`, libera origens exatas por ambiente e rejeita origens desconhecidas.

4. **Backend não escuta a porta do Render**

   Resolvido: quando `PORT` existe, o Kestrel escuta em `http://0.0.0.0:$PORT`; o valor também é validado antes da inicialização.

5. **Ausência de health check**

   Resolvido: `GET /health` é público, não depende do Atlas e está configurado como `healthCheckPath` no Blueprint.

6. **Acoplamento desnecessário entre API e SPA**

   Resolvido: `SpaProxy`, arquivos estáticos, fallback da SPA e referência ao `.esproj` foram removidos do backend.

7. **Configuração antiga do Azure ainda ativa**

   Resolvido na Tarefa 1: o workflow antigo foi removido.

### P2 — qualidade, manutenção e portfólio

- O backend compila com **0 erros e 79 warnings** de nulabilidade legados.
- O lint do frontend possui **0 erros e 39 avisos** de dependências legadas em `useEffect`; os Hooks condicionais foram corrigidos.
- As vulnerabilidades NuGet inicialmente encontradas em `Newtonsoft.Json`, `Snappier` e `SharpCompress` foram eliminadas pela atualização dos pacotes principais.
- A auditoria de produção do npm relata somente o alerta de CSRF do modo RSC do React Router. O GameHub usa SPA declarativa, sem RSC, Server Actions ou SSR; manter a versão atual evita vulnerabilidades mais amplas presentes no downgrade sugerido e o alerta deve ser acompanhado.
- A auditoria completa do npm também aponta vulnerabilidades no toolchain legado de desenvolvimento (ESLint e dependências relacionadas). Elas não entram no bundle de produção e devem ser tratadas junto da modernização de lint/CI.
- .NET 8 entra em fim de suporte em 10/11/2026. Planejar a migração para .NET 10 LTS antes do lançamento definitivo.
- Não há testes automatizados nem CI de build/test/lint para o fluxo novo.
- Consultas e atualizações executam muitos loops e substituições de documentos completos; isso merece revisão após segurança/deploy.

## 4. Higiene do Git

Hoje estão versionados:

- `node_modules` da raiz: 2.135 arquivos, aproximadamente 17,3 MB no working tree;
- `.vs`: 15 entradas rastreadas, aproximadamente 12,4 MB presentes;
- `Gamehub.Server/bin` e `Gamehub.Server/obj`: 74 arquivos, aproximadamente 37,3 MB;
- `Gamehub.Server.csproj.user` e outros arquivos locais de IDE.

O repositório Git local contém cerca de 135 MB de objetos soltos. A correção deve incluir:

1. criar `.gitignore` na raiz para Node, .NET, Visual Studio, builds, publish e arquivos locais de ambiente;
2. remover os artefatos do índice com `git rm --cached`, sem apagar o código-fonte;
3. manter `appsettings.json` versionado apenas como configuração sem segredos;
4. usar `dotnet user-secrets` localmente para o backend;
5. manter `.env*` ignorado, exceto `.env.example` sem valores reais;
6. decidir separadamente se o histórico será reescrito com `git filter-repo`.

A reescrita do histórico exige force-push e invalida clones antigos. Não deve ser feita automaticamente ou antes da rotação das chaves.

## 5. O que aproveitar de `GameHub Deploy`

Itens úteis como referência:

- a regra SPA `/* -> /index.html` com status 200;
- o conceito de um `Dockerfile` multi-stage;
- o bind em `0.0.0.0` usando `PORT`;
- a inclusão do domínio de produção no CORS;
- a antiga URL pública da API em `axios-config.ts`, que confirma a separação entre front e back.

Itens que não devem ser copiados diretamente:

- diretório `publish` e DLLs/SOs/EXEs gerados;
- `appsettings.json` com segredos;
- middleware CORS/preflight manual, que duplica o CORS do ASP.NET;
- Dockerfile com contexto ambíguo para o monorepo e portas fixas 80/5000;
- URL pública fixa no código do frontend;
- packages e solução duplicados dentro da pasta do servidor.

O repositório `GameHub` deve continuar sendo a fonte oficial. A pasta histórica é apenas referência.

## 6. Estrutura de deploy

Arquivos implementados:

```text
GameHub/
├── .gitignore
├── .dockerignore
├── netlify.toml
├── render.yaml
├── DEPLOY.md
├── gamehub.client/
│   ├── package.json
│   ├── .env.example
│   ├── .nvmrc
│   ├── vite.config.ts
│   └── src/
│       ├── auth-storage.ts
│       └── axios-config.ts
└── Gamehub.Server/
    ├── Dockerfile
    ├── Program.cs
    ├── appsettings.json
    └── Gamehub.Server.csproj
```

Fluxo esperado:

```text
Navegador -> Netlify (React/Vite) -> Render (ASP.NET API) -> MongoDB Atlas
                                      |-> IGDB
                                      |-> serviço de imagens, se movido para o backend
```

## 7. Variáveis configuradas

### Render — backend

| Nome | Tipo | Observação |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | comum | `Production` |
| `Proxy__ForwardedHeadersEnabled` | comum | `true`, pois o TLS termina no proxy do Render |
| `DevNetStoreDatabase__ConnectionString` | secret | URI nova do Atlas |
| `DevNetStoreDatabase__DatabaseName` | comum | `GameHub` |
| `DevNetStoreDatabase__UserCollectionName` | comum | `Users` |
| `DevNetStoreDatabase__PostCollectionName` | comum | `Posts` |
| `DevNetStoreDatabase__CommunityCollectionName` | comum | `Communities` |
| `Jwt__SecretKey` | secret gerado | mínimo de 256 bits; rotacionar o atual |
| `Jwt__Issuer` | comum | por exemplo `GameHub.Api` |
| `Jwt__Audience` | comum | `GameHub.Client` |
| `Jwt__ExpirationMinutes` | comum | `30` |
| `Igdb__ClientId` | secret/config | novo Client ID, conforme política do provedor |
| `Igdb__ClientSecret` | secret | novo segredo IGDB |
| `ImgBb__ApiKey` | secret | nova chave ImgBB |
| `Cors__AllowedOrigins__0` | comum | URL exata do site Netlify |

`PORT` é fornecida pelo Render. O ASP.NET Core converte `__` em `:` nas chaves de configuração.

### Netlify — frontend

| Nome | Tipo | Observação |
|---|---|---|
| `VITE_API_BASE_URL` | pública | `https://<servico>.onrender.com/api` |

Não colocar MongoDB, JWT, IGDB ou ImgBB em variáveis `VITE_*`: elas são incorporadas ao JavaScript entregue ao navegador.

## 8. Configuração-alvo das plataformas

### Render

- Tipo: Web Service.
- Runtime: Docker, pois .NET não aparece entre os runtimes nativos do Blueprint atual.
- Dockerfile: `./Gamehub.Server/Dockerfile`.
- Docker context: raiz do repositório.
- Health check: `/health`.
- Auto-deploy: branch `main`, depois que CI e segurança estiverem verdes.
- Segredos: `sync: false` no `render.yaml` ou cadastrados manualmente no dashboard.
- Nunca gravar valores reais no `render.yaml`.

O Render encerra TLS no load balancer e encaminha HTTP ao container. O middleware de forwarded headers precisa rodar antes de redirecionamentos/autenticação que dependam do esquema original.

### MongoDB Atlas

1. Rotacionar ou excluir o usuário comprometido.
2. Criar usuário exclusivo para a aplicação com `readWrite` somente no banco `GameHub`.
3. Criar o Web Service no Render e copiar as faixas em **Connect > Outbound**.
4. Adicionar todas essas faixas em **Network Access > IP Access List** no Atlas.
5. Atualizar `DevNetStoreDatabase__ConnectionString` no Render.
6. Validar DNS SRV, autenticação e uma operação controlada de leitura/escrita.
7. Não usar `0.0.0.0/0` permanentemente.

### Netlify

- Monorepo/base directory: `gamehub.client`.
- Build command: `npm run build`.
- Publish directory: `dist` relativa à base.
- Rewrite de SPA para `/index.html` configurado no `netlify.toml`.
- Node 24 fixado no `netlify.toml`, `.nvmrc` e `package.json`.
- Headers contra framing, MIME sniffing e permissões desnecessárias configurados.
- Assets versionados recebem cache imutável de um ano.
- Cadastrar `VITE_API_BASE_URL` no ambiente de produção.

## 9. Ordem de execução recomendada

### Fase A — contenção

- [x] Rotacionar JWT local e retirar MongoDB, IGDB e ImgBB da árvore atual.
- [x] Rotacionar MongoDB, IGDB e ImgBB nos painéis dos provedores.
- [x] Verificar os dados restaurados no Atlas e criar backup local.
- [ ] Revisar e remover contas ou dados de teste sensíveis antes da publicação.
- [x] Impedir novos deploys do workflow Azure antigo.

### Fase B — segurança do backend

- [x] Hash de senha e migração/reset das contas.
- [x] Remover `getPassword` e o fluxo atual de “esqueci a senha”.
- [x] DTOs sem senha/CPF/dados privados.
- [x] `[Authorize]`, claims validadas e checagem de ownership.
- [x] JWT com issuer/audience/lifetime e estratégia única de armazenamento.
- [x] Segredos apenas por configuração externa.
- [x] Rate limiting nos endpoints de login, busca externa e upload.

### Fase C — build e infraestrutura

- [x] `.gitignore` raiz e limpeza do índice.
- [x] Corrigir `vite.config.ts` para builds sem certificado.
- [x] Tornar a URL da API configurável.
- [x] CORS por configuração.
- [x] Remover acoplamento SPA do backend.
- [x] Adicionar health check, bind de `PORT`, Dockerfile e `.dockerignore`.
- [x] Adicionar `render.yaml`.
- [x] Adicionar a configuração final do Netlify.
- [x] Atualizar dependências vulneráveis do backend e as dependências de produção aplicáveis do frontend.

### Fase D — qualidade e publicação

- [x] Testes unitários e de integração para login, autorização e ownership.
- [x] Corrigir Hooks condicionais e erros de lint.
- [x] Atualizar e auditar a cadeia local de build do frontend.
- [ ] Eliminar os avisos restantes de dependências de `useEffect` no lint estrito.
- [ ] CI com restore, build, test, lint e auditoria de dependências.
- [ ] Deploy privado/controlado no Render.
- [ ] Allowlist das faixas Render no Atlas.
- [ ] Smoke test da API.
- [ ] Deploy Netlify e teste ponta a ponta.
- [ ] Só então habilitar auto-deploy de `main`.

## 10. Checklist de aceite

- [x] Nenhum segredo ativo aparece na árvore atual, build output, imagem Docker ou bundle do Vite.
- [x] `npm ci && npm run build` passa em ambiente limpo.
- [x] `npm run lint` passa sem erro e mantém 39 avisos visíveis; `npm run lint:strict` acompanha a quitação deles.
- [x] `dotnet restore`, `dotnet build` e a suíte de testes passam.
- [x] `dotnet list package --vulnerable --include-transitive` não retorna vulnerabilidades conhecidas.
- [x] Container escuta em `0.0.0.0:$PORT`.
- [ ] `/health` retorna 200 no Render.
- [ ] Atlas aceita o Render e rejeita origens fora do IP Access List.
- [x] Usuário não autenticado não altera dados.
- [x] Usuário autenticado não altera recursos de outra conta.
- [x] APIs nunca retornam senha, hash, CPF desnecessário ou segredo.
- [ ] Rotas do React abrem diretamente e após refresh no Netlify.
- [ ] Login, logout, expiração e renovação de sessão têm comportamento coerente.
- [ ] Integrações IGDB e imagens têm timeout, erro tratado e limites.

## 11. Evidências da auditoria local

- Backend: build isolado concluído com 0 erros e 79 warnings legados.
- Testes: 7/7 passaram contra um MongoDB Docker temporário; login, autorização, DTO público e ownership foram cobertos.
- Frontend: `npm ci`, TypeScript e build Vite 8 de produção concluídos com sucesso.
- Execução local: frontend respondeu em `5173`, API em `7045`, proxy `/api`, CORS local e `/health` foram validados.
- Docker: imagem multi-stage construída; container não root escutou na porta dinâmica e respondeu `/health` com 200.
- Integração: o frontend chamou a API Docker pelo proxy com 200; `/register` respondeu 200.
- Atlas: a API Docker realizou leitura controlada dos 31 usuários e não alterou dados.
- CORS de produção: a origem exata do Netlify foi aceita e uma origem desconhecida não recebeu permissão.
- Lint: 0 erros e 39 avisos de dependências em `useEffect`.
- NuGet: nenhuma vulnerabilidade conhecida após a atualização dos pacotes.
- npm completo: ferramentas de desenvolvimento atualizadas e somente dois registros do mesmo alerta de RSC do React Router permanecem; esse modo não existe nesta SPA.
- Git: nenhum `node_modules`, `.vs`, `bin`, `obj` ou `dist` no índice.
- Segredos: removidos da árvore atual; as versões antigas permanecem no histórico até a limpeza planejada.
- Alterações locais preexistentes do usuário foram preservadas.

## 12. Referências oficiais

- Render Web Services e porta: <https://render.com/docs/web-services>
- Render com Docker: <https://render.com/docs/docker>
- Render Blueprint: <https://render.com/docs/blueprint-spec>
- IPs de saída do Render: <https://render.com/docs/outbound-ip-addresses>
- Netlify em monorepos: <https://docs.netlify.com/build/configure-builds/monorepos/>
- Rewrites/proxy no Netlify: <https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/>
- MongoDB Atlas — conexão e troubleshooting: <https://www.mongodb.com/docs/atlas/troubleshoot-connection/>
- MongoDB Atlas — usuários do banco: <https://www.mongodb.com/docs/atlas/security-add-mongodb-users/>
- Twitch/IGDB — cadastro e novo client secret: <https://dev.twitch.tv/docs/authentication/register-app>
- ImgBB — API e chave de upload: <https://api.imgbb.com/>
- ASP.NET Core — configuração por ambiente: <https://learn.microsoft.com/aspnet/core/fundamentals/configuration/>
- ASP.NET Core atrás de proxy: <https://learn.microsoft.com/aspnet/core/host-and-deploy/proxy-load-balancer/>
- Ciclo de suporte do .NET: <https://dotnet.microsoft.com/platform/support/policy>

## 13. Registro da Tarefa 1 — consolidação e segredos

Concluído em 27/07/2026:

- os metadados Git de `gamehub.client` e `Gamehub.Server` foram removidos do projeto e guardados em `GameHub Git Metadata Backup 20260727-131513`, ao lado da pasta do projeto;
- somente o repositório Git da raiz permanece como fonte oficial;
- o workflow antigo do Azure foi removido;
- o `appsettings.json` passou a conter somente nomes e valores públicos, sem credenciais;
- os valores locais foram migrados para o User Secrets do .NET, fora do repositório;
- um novo segredo JWT local, aleatório e com 512 bits, foi gerado;
- IGDB e JWT passaram a usar configuração tipada e validada na inicialização;
- o upload do ImgBB foi movido do frontend para o backend;
- busca na árvore atual não encontrou URI MongoDB nem credenciais literais de JWT, IGDB ou ImgBB.

Validações concluídas em 27/07/2026:

- o Atlas restaurou o banco `GameHub` com 31 usuários, 13 posts e 5 comunidades;
- um backup BSON compactado foi criado fora do repositório em `GameHub Database Backups`;
- a nova senha do MongoDB foi aplicada e uma leitura autenticada confirmou os dados;
- o novo segredo IGDB autenticou e concluiu uma consulta real;
- a nova chave ImgBB concluiu um upload de teste;
- o segredo IGDB antigo e a chave ImgBB antiga do GameHub foram testados e estão inválidos.

### Decisão sobre o histórico Git

**Decisão: reescrever o histórico, mas somente após a rotação externa.** Como este será um repositório público de portfólio, a limpeza removerá segredos e artefatos antigos dos commits. A ordem obrigatória é:

1. rotacionar MongoDB, IGDB e ImgBB;
2. confirmar que os novos valores funcionam no User Secrets;
3. criar um backup final do repositório;
4. executar `git filter-repo` e fazer force-push coordenado;
5. apagar clones e backups antigos que ainda contenham as credenciais.

Até essa execução, qualquer credencial que já apareceu em commits deve ser considerada comprometida, mesmo não estando mais nos arquivos atuais.

## 14. Registro da Tarefa 3 — backend para Render

Concluído em 27/07/2026:

- API e SPA passaram a ter builds independentes;
- a URL pública do backend ficou configurável por `VITE_API_BASE_URL`, com proxy `/api` no desenvolvimento;
- CORS passou a usar listas diferentes para Development e Production;
- o backend passou a respeitar `PORT` e escutar em todas as interfaces dentro do container;
- forwarded headers ficaram condicionados ao ambiente atrás do proxy do Render;
- foi criado o liveness público `GET /health`;
- dependências do backend foram atualizadas e auditadas;
- foram criados `Dockerfile` multi-stage, `.dockerignore` e `render.yaml` sem segredos;
- README e guia técnico passaram a documentar arquitetura, configuração segura e execução local.

Validações concluídas:

- restore e build do backend com 0 erros;
- build de produção do frontend concluído;
- auditoria NuGet sem vulnerabilidades conhecidas e exceção RSC do npm documentada;
- imagem Docker construída e iniciada com usuário não root;
- bind em `0.0.0.0:$PORT`, `/health`, forwarded headers e CORS testados no container;
- frontend, backend e proxy do Vite testados localmente.

## 15. Registro da Tarefa 4 — frontend para Netlify

Concluído em 27/07/2026:

- o certificado HTTPS de desenvolvimento permanece restrito ao comando `serve` e não participa do build;
- a URL da API usa `VITE_API_BASE_URL` em produção e `/api` com proxy no desenvolvimento;
- o JWT foi centralizado no `sessionStorage`, validado por expiração e removido no logout ou em respostas `401`;
- `js-cookie` e o falso “Lembre-se de mim” foram removidos;
- uploads continuam passando pelo endpoint autenticado do backend, sem chave ImgBB no navegador;
- Hooks condicionais de cadastro e edição de comunidade foram corrigidos;
- erros de lint e usos explícitos de `any` foram eliminados; restam apenas avisos de dependências de efeitos;
- `netlify.toml`, `.nvmrc`, fallback SPA, headers de segurança e cache de assets foram adicionados;
- Node 24 foi alinhado entre desenvolvimento, pacote e Netlify.

Validações concluídas:

- `npm ci`, `npm run lint` e `npm run build` executados em sequência;
- TypeScript e Vite concluíram o build de produção;
- configuração TOML validada por parser;
- frontend local, rota direta `/register`, proxy `/api` e health da API responderam 200;
- busca no frontend não encontrou chave ImgBB, segredo ou acesso direto ao serviço externo;
- tentativa de downgrade do React Router foi rejeitada por introduzir alertas aplicáveis à SPA; a exceção atual afeta somente RSC e permanece documentada.

## 16. Registro da Tarefa 5 — testes locais e integração

Concluído em 27/07/2026:

- foi criado `Gamehub.Server.Tests` com xUnit e `WebApplicationFactory`;
- login válido e inválido, autorização, privacidade de DTOs e ownership de posts ganharam testes HTTP;
- o hash de senha ganhou teste unitário;
- `scripts/test-integration.ps1` passou a iniciar MongoDB 8 isolado, usar um banco aleatório e remover tudo ao finalizar;
- `scripts/test-docker.ps1` passou a carregar User Secrets somente em memória, iniciar a API Docker e validar health, Atlas e proxy do Vite;
- `GAMEHUB_DEV_API_TARGET` permite apontar apenas o proxy de desenvolvimento para uma API Docker;
- Vite, ESLint, TypeScript e plugins de lint foram atualizados em conjunto;
- a rota pública de post agora responde 404 quando o documento não existe.

Validações concluídas:

- 7/7 testes aprovados no MongoDB temporário, sem usar dados oficiais;
- imagem Docker reproduzível construída com sucesso;
- `/health` do container respondeu 200;
- consulta controlada encontrou os 31 usuários do Atlas sem escrita;
- frontend para API Docker e rota SPA `/register` responderam 200;
- `npm ci`, lint e build de produção passaram após a atualização das ferramentas;
- auditorias dos dois projetos .NET ficaram limpas;
- auditoria npm completa caiu de 19 para 2 registros, ambos da exceção RSC já documentada.

A configuração manual do Render, da allowlist do Atlas para o Render e do Netlify foi deliberadamente adiada para depois da Tarefa 6. Nenhuma publicação foi feita nesta etapa.

## 17. Preparação da Tarefa 6 — deploy e validação final

Preparado em 27/07/2026:

- o repositório público `AlexandreAT/GameHub` e a branch remota `main` estão sincronizados;
- o site existente `https://projectgamehub.netlify.app` responde, mas ainda entrega o bundle antigo e não deve ser considerado validado;
- `render.yaml` fixa a branch `main`, mantém o auto-deploy desligado e descreve o backend Docker sem segredos;
- `DEPLOY_RUNBOOK.md` registra o procedimento curto para Atlas, Render, Netlify e Docker;
- `scripts/smoke-deploy.ps1` valida frontend, bundle, health, CORS, Atlas, cadastro, login, JWT e post, removendo os dados temporários;
- o mesmo smoke test passou localmente contra frontend, API Docker e MongoDB descartável;
- a criação dos recursos externos depende dos painéis autenticados do proprietário e permanece pendente;
- o auto-deploy só poderá ser ativado depois que o smoke test público passar.

O histórico remoto ainda contém credenciais antigas, já rotacionadas e inativas. A reescrita continua recomendada para o portfólio, mas exige autorização explícita porque altera os 109 commits e requer force-push.
