# GameHub — auditoria e plano de deploy

Data da auditoria: 26/07/2026.

Este documento descreve o estado encontrado no repositório final, compara a pasta histórica `GameHub Deploy` e define o caminho recomendado para publicar o frontend no Netlify, o backend no Render e manter os dados no MongoDB Atlas.

> Status atual: **Tarefa 1 concluída no código; ainda não publicar**. Os segredos foram retirados da árvore atual, mas as credenciais externas precisam ser rotacionadas e os bloqueadores de autenticação das próximas tarefas ainda precisam ser corrigidos.

## 1. Arquitetura encontrada

### Frontend

- React 18 + TypeScript.
- Vite 5.
- React Router 6, Axios, `js-cookie`, `qs`, React Icons e React Input Mask.
- SPA com páginas de login, cadastro, perfis, comunidades, posts, comentários, busca, biblioteca e integração com jogos.
- Cliente HTTP centralizado em `gamehub.client/src/axios-config.ts`.
- A URL da API está fixa em `https://localhost:7045/api` no repositório final.
- Uploads de imagem passam pelo backend; a chave do ImgBB não é mais entregue ao navegador.

### Backend

- ASP.NET Core Web API em .NET 8.
- MongoDB.Driver 2.24.
- JWT Bearer.
- Integração com IGDB/Twitch.
- Swagger em ambiente de desenvolvimento.
- Controllers: usuários, posts, comunidades e IGDB.
- Services acessam diretamente as coleções `Users`, `Posts` e `Communities`.
- O projeto ainda mantém acoplamento de template SPA com o frontend por `SpaProxy`, `SpaRoot` e `ProjectReference`, embora o frontend seja publicado separadamente.

### Dados e serviços externos

- MongoDB Atlas: banco `GameHub` e três coleções configuradas em `appsettings.json`.
- IGDB: credenciais lidas da configuração privada do backend.
- ImgBB: chave lida da configuração privada e usada pelo serviço de upload do backend.

### Repositório e automação

- Branch principal: `main`.
- Remote: `AlexandreAT/GameHub` no GitHub.
- Existe um `.gitignore` único na raiz para frontend, backend, IDEs e segredos locais.
- O workflow antigo de Azure App Service foi removido na Tarefa 1.
- Não existem `Dockerfile`, `render.yaml` ou `netlify.toml` no repositório final.
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

### P1 — bloqueia o deploy confiável

1. **Build do frontend quebra em CI**

   `npm run build` executa o TypeScript, mas o `vite.config.ts` tenta criar e ler certificado HTTPS de desenvolvimento durante qualquer build. Isso falhou localmente e tende a falhar no Netlify.

   Ação: criar certificado somente quando o Vite estiver no comando `serve`, ou simplificar o desenvolvimento local para HTTP. O build de produção não pode depender de `dotnet dev-certs`.

2. **URL do backend fixa no código**

   Ação: trocar por `import.meta.env.VITE_API_BASE_URL`, com fallback apenas para desenvolvimento. Variáveis `VITE_*` ficam públicas no bundle; somente a URL da API pode ficar nelas, nunca segredos.

3. **CORS aceita apenas localhost**

   Ação: ler a lista de origens da configuração e liberar exatamente a URL de produção do Netlify e, se necessário, o domínio customizado. Não copiar o middleware manual de preflight da pasta histórica.

4. **Backend não escuta a porta do Render**

   O `Program.cs` atual não usa `PORT`. O Render exige bind em `0.0.0.0`; recomenda a porta da variável `PORT` e usa `10000` como padrão.

   Ação: configurar Kestrel/`UseUrls` para `http://0.0.0.0:${PORT}` em produção ou definir configuração equivalente segura no container.

5. **Ausência de health check**

   Ação: adicionar `GET /health` e configurar `healthCheckPath: /health` no Render. Um liveness check simples deve subir mesmo durante uma indisponibilidade temporária do Atlas; a conectividade do banco pode ser verificada separadamente como readiness.

6. **Acoplamento desnecessário entre API e SPA**

   `SpaProxy`, `UseStaticFiles`, `MapFallbackToFile` e a referência ao `.esproj` não são necessários no backend quando o frontend vive no Netlify.

   Ação: desacoplar o `.csproj` da SPA e publicar somente a API no container.

7. **Configuração antiga do Azure ainda ativa**

   Ação: remover/desabilitar o workflow ao migrar. Caso contrário, todo push em `main` continuará tentando executar o deploy antigo, usando actions obsoletas e possivelmente falhando em paralelo.

### P2 — qualidade, manutenção e portfólio

- O backend compila com **0 erros e 121 warnings** de nulabilidade e uso de APIs obsoletas.
- O lint do frontend acusa **79 erros e 42 avisos**, inclusive Hooks condicionais.
- Foram detectadas dependências transitivas NuGet vulneráveis:
  - `Newtonsoft.Json 11.0.1` — alta;
  - `Snappier 1.0.0` — alta;
  - `SharpCompress 0.30.1` — moderada.
- Pacotes principais estão defasados: IGDB 5.1, MongoDB.Driver 2.24, Swagger 6.4 e dependências antigas do frontend.
- O `npm audit` não pôde concluir porque o endpoint do registro devolveu uma resposta comprimida inválida; repetir em CI/ambiente limpo.
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

## 6. Estrutura-alvo de deploy

Arquivos a criar/alterar na fase de implementação:

```text
GameHub/
├── .gitignore
├── .env.example
├── netlify.toml
├── render.yaml
├── DEPLOY.md
├── gamehub.client/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       └── axios-config.ts
└── Gamehub.Server/
    ├── Dockerfile
    ├── .dockerignore
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

## 7. Variáveis planejadas

### Render — backend

| Nome | Tipo | Observação |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | comum | `Production` |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | comum | `true`, pois o TLS termina no proxy do Render |
| `DevNetStoreDatabase__ConnectionString` | secret | URI nova do Atlas |
| `DevNetStoreDatabase__DatabaseName` | comum | `GameHub` |
| `DevNetStoreDatabase__UserCollectionName` | comum | `Users` |
| `DevNetStoreDatabase__PostCollectionName` | comum | `Posts` |
| `DevNetStoreDatabase__CommunityCollectionName` | comum | `Communities` |
| `Jwt__SecretKey` | secret gerado | mínimo de 256 bits; rotacionar o atual |
| `Jwt__Issuer` | comum | por exemplo `GameHub.Api` |
| `Jwt__Audience` | comum | `GameHub.Client` |
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
- Configurar rewrite de SPA para `/index.html`.
- Fixar uma versão de Node suportada em `.nvmrc`, `.node-version` ou `NODE_VERSION` após validar a atualização de dependências.
- Cadastrar `VITE_API_BASE_URL` no ambiente de produção.
- Manter a regra de SPA depois de qualquer regra específica de `/api`, caso seja adotado proxy do Netlify.

## 9. Ordem de execução recomendada

### Fase A — contenção

- [x] Rotacionar JWT local e retirar MongoDB, IGDB e ImgBB da árvore atual.
- [x] Rotacionar MongoDB, IGDB e ImgBB nos painéis dos provedores.
- [ ] Verificar se existem dados reais no Atlas; remover contas/dados de teste sensíveis.
- [x] Impedir novos deploys do workflow Azure antigo.

### Fase B — segurança do backend

- [ ] Hash de senha e migração/reset das contas.
- [ ] Remover `getPassword` e o fluxo atual de “esqueci a senha”.
- [ ] DTOs sem senha/CPF/dados privados.
- [ ] `[Authorize]`, claims validadas e checagem de ownership.
- [ ] JWT com issuer/audience/lifetime e estratégia única de armazenamento.
- [ ] Segredos apenas por configuração externa.
- [ ] Rate limiting nos endpoints de login, busca externa e upload.

### Fase C — build e infraestrutura

- [ ] `.gitignore` raiz e limpeza do índice.
- [ ] Corrigir `vite.config.ts` para builds sem certificado.
- [ ] Tornar a URL da API configurável.
- [ ] CORS por configuração.
- [ ] Remover acoplamento SPA do backend.
- [ ] Adicionar health check, bind de `PORT`, Dockerfile e `.dockerignore`.
- [ ] Adicionar `render.yaml` e `netlify.toml`.
- [ ] Atualizar dependências vulneráveis.

### Fase D — qualidade e publicação

- [ ] Testes unitários e de integração para login, autorização e ownership.
- [ ] Corrigir Hooks condicionais e erros de lint.
- [ ] CI com restore, build, test, lint e auditoria de dependências.
- [ ] Deploy privado/controlado no Render.
- [ ] Allowlist das faixas Render no Atlas.
- [ ] Smoke test da API.
- [ ] Deploy Netlify e teste ponta a ponta.
- [ ] Só então habilitar auto-deploy de `main`.

## 10. Checklist de aceite

- [ ] Nenhum segredo aparece em `git grep`, build output, imagem Docker ou bundle do Vite.
- [ ] `npm ci && npm run build` passa em ambiente limpo.
- [ ] `npm run lint` passa sem erro.
- [ ] `dotnet restore`, `dotnet build` e `dotnet test` passam.
- [ ] `dotnet list package --vulnerable --include-transitive` não retorna vulnerabilidades conhecidas.
- [ ] Container escuta em `0.0.0.0:$PORT`.
- [ ] `/health` retorna 200 no Render.
- [ ] Atlas aceita o Render e rejeita origens fora do IP Access List.
- [ ] Usuário não autenticado não altera dados.
- [ ] Usuário autenticado não altera recursos de outra conta.
- [ ] APIs nunca retornam senha, hash, CPF desnecessário ou segredo.
- [ ] Rotas do React abrem diretamente e após refresh no Netlify.
- [ ] Login, logout, expiração e renovação de sessão têm comportamento coerente.
- [ ] Integrações IGDB e imagens têm timeout, erro tratado e limites.

## 11. Evidências da auditoria local

- Backend: build isolado concluído com 0 erros e 121 warnings.
- Frontend: TypeScript compilou; build Vite falhou na criação do certificado HTTPS.
- Lint: 79 erros e 42 warnings.
- NuGet: 3 vulnerabilidades transitivas conhecidas.
- Git: 2.354 arquivos rastreados; 2.224 deles são `node_modules`, `.vs`, `bin` ou `obj`.
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
