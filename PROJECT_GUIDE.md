# GameHub — Guia Técnico, Arquitetural e de Desenvolvimento

## 1. Propósito

Este documento registra o contexto funcional e técnico do GameHub. Ele serve como referência para desenvolvedores, revisões e ferramentas de inteligência artificial.

O README explica instalação e execução. O `DEPLOY.md` concentra auditoria e publicação. Este guia descreve arquitetura, responsabilidades, fluxos, regras e limites do projeto.

## 2. Visão do produto

O GameHub é uma rede social de jogos. Seu objetivo é reunir descoberta de títulos, comunidades e interações sociais em uma única experiência.

Funcionalidades atuais:

- cadastro, login e perfil;
- perfis públicos e conexões entre usuários;
- criação e acompanhamento de comunidades;
- posts gerais, por usuário, comunidade ou jogo;
- comentários, curtidas e descurtidas;
- busca de usuários e comunidades;
- consulta de jogos pela IGDB;
- biblioteca pessoal com status, nota e destaque;
- upload de imagens pelo ImgBB.

## 3. Arquitetura de execução

```text
Navegador
   │
   ├── produção ──> Netlify (React/Vite)
   │                    │
   │                    └── HTTPS ──> Render (ASP.NET Core API)
   │                                         │
   │                                         ├── MongoDB Atlas
   │                                         ├── IGDB/Twitch
   │                                         └── ImgBB
   │
   └── local ─────> Vite :5173 ── proxy /api ──> ASP.NET :7045
```

Frontend e backend possuem ciclos de build e deploy independentes. A API não serve arquivos da SPA e não inicia o Vite.

## 4. Stack

### Frontend

- React 18;
- TypeScript;
- Vite;
- React Router;
- Axios centralizado;
- CSS Modules.

### Backend

- .NET 8 e ASP.NET Core Controllers;
- MongoDB.Driver;
- JWT Bearer;
- BCrypt.Net-Next;
- Swagger/OpenAPI;
- Health Checks e Rate Limiting.

### Serviços externos

- MongoDB Atlas: persistência;
- IGDB/Twitch: catálogo de jogos;
- ImgBB: hospedagem de imagens;
- Render: container da API;
- Netlify: SPA.

## 5. Organização do repositório

```text
Gamehub.Server/
├── Controllers/    contratos HTTP e autorização
├── Dtos/           requests e responses da API
├── Models/         documentos MongoDB e configurações tipadas
├── Security/       hash, claims e nomes de claims JWT
├── Services/       persistência e integrações
├── Program.cs      composição, middleware e comandos administrativos
└── Dockerfile      imagem exclusiva da API

gamehub.client/
├── src/components/ componentes compartilhados
├── src/routes/     páginas e fluxos de navegação
├── src/services/   integrações reutilizáveis do frontend
├── src/utils/      utilitários puros
├── src/axios-config.ts
└── vite.config.ts
```

## 6. Responsabilidades

### Controllers

Devem receber e validar requisições, obter identidade autenticada, chamar serviços e produzir respostas HTTP. Não devem confiar em IDs de usuário enviados pelo cliente para autorizar mutações.

### DTOs

São os contratos externos. Entidades `User` nunca devem ser devolvidas diretamente. Senha e CPF não podem aparecer em responses; e-mail e telefone ficam restritos ao DTO do próprio usuário autenticado.

### Services

Concentram acesso ao MongoDB e integrações. Mudanças novas devem preferir métodos atômicos do MongoDB quando isso evitar substituição completa de documentos ou condições de corrida.

### Frontend

Componentes renderizam interface e estados. Chamadas HTTP devem usar o cliente Axios central. A URL da API não deve ser repetida em componentes.

## 7. Domínios principais

### User

Perfil, autenticação, seguidores, comunidades e biblioteca. O campo persistido de senha contém somente hash BCrypt. `PasswordResetRequired` bloqueia contas antigas até redefinição. `TokenVersion` revoga tokens após mudanças sensíveis.

### Post

Publicação ligada a autor, jogo e opcionalmente comunidade. Pode possuir comentários, likes e dislikes. Exclusão e moderação exigem ownership válido no servidor.

### Community

Grupo criado por um usuário e relacionado opcionalmente a um jogo. Somente o criador pode alterar, excluir ou trocar imagens da comunidade.

### LibraryGame

Representa um jogo salvo no perfil com estado, nota e indicação de destaque. Dados detalhados do título são consultados na IGDB.

## 8. Grupos de endpoints

- `/api/Users`: cadastro, login, perfil, conexões e biblioteca;
- `/api/Posts`: feeds, publicação, comentários e reações;
- `/api/Community`: comunidades, seguidores e imagens;
- `/api/Igdb`: busca e detalhes de jogos;
- `/api/Images`: upload autenticado;
- `/health`: liveness público, independente do banco.

Swagger existe somente em desenvolvimento.

## 9. Autenticação e autorização

- A política padrão exige usuário autenticado;
- endpoints públicos precisam declarar `[AllowAnonymous]` explicitamente;
- o ID autenticado vem da claim `sub` validada;
- JWT valida assinatura, issuer, audience e expiração;
- tokens duram 30 minutos por padrão;
- a versão do token é comparada ao usuário atual no banco;
- alteração de senha revoga tokens anteriores;
- ownership deve ser verificado em toda mutação de recurso existente;
- login, APIs externas e uploads possuem rate limiting.

O token ainda é mantido em cookie acessível pelo JavaScript porque frontend e backend vivem em domínios diferentes. Por isso, conteúdo de usuário nunca deve ser inserido com `dangerouslySetInnerHTML`.

## 10. Configuração

A prioridade de configuração segue o ASP.NET Core:

```text
appsettings.json
  ↓
appsettings.{Environment}.json
  ↓
User Secrets em Development
  ↓
variáveis de ambiente
```

Segredos locais ficam no User Secrets. Segredos de produção ficam no Render. No nome de variáveis de ambiente, `__` representa níveis de JSON, por exemplo:

```text
Jwt__SecretKey
DevNetStoreDatabase__ConnectionString
Cors__AllowedOrigins__0
```

Valores não secretos, como issuer, nomes das collections e duração do token, podem ter defaults versionados.

No frontend, somente dados públicos podem usar `VITE_*`. Atualmente existe apenas `VITE_API_BASE_URL`.

## 11. Ambientes

### Development

- API HTTPS em `7045` e HTTP em `5118`;
- frontend HTTPS em `5173`;
- Vite encaminha `/api` para a API;
- CORS aceita apenas localhost;
- Swagger habilitado;
- segredos obtidos do User Secrets.

### Production

- Render fornece `PORT`;
- Kestrel escuta `0.0.0.0:$PORT`;
- Render encerra TLS e encaminha HTTP ao container;
- forwarded headers são habilitados somente atrás do proxy do Render;
- CORS aceita a origem exata do Netlify;
- Swagger desabilitado;
- exceções usam Problem Details sem detalhes internos;
- segredos vêm de variáveis protegidas.

## 12. Docker e Render

O Dockerfile usa build multi-stage. O SDK existe somente no estágio de build; a imagem final usa o runtime ASP.NET, executa como usuário não root e contém apenas a API publicada.

O `render.yaml`:

- usa `runtime: docker`;
- aponta o contexto para a raiz e o Dockerfile para `Gamehub.Server`;
- configura `/health`;
- usa plano gratuito e região Virginia;
- gera uma chave JWT própria de produção;
- solicita segredos externos sem versioná-los;
- mantém auto-deploy desligado até os smoke tests finais.

## 13. Health check

`GET /health` verifica se o processo está vivo e consegue atender HTTP. Ele não consulta o MongoDB, evitando reinicializações contínuas quando o Atlas estiver temporariamente indisponível.

Uma readiness check separada poderá ser adicionada futuramente para diagnosticar dependências sem controlar diretamente o ciclo de vida do container.

## 14. CORS e proxy

CORS deve listar origens exatas, sem `AllowAnyOrigin`. Novas URLs do Netlify ou domínios próprios devem ser adicionados como novos índices de `Cors__AllowedOrigins`.

Forwarded headers só devem ser habilitados quando a aplicação estiver isolada atrás do proxy confiável do Render. Em desenvolvimento, `Proxy:ForwardedHeadersEnabled` permanece falso.

## 15. Integrações externas

### IGDB

Usa Client ID e Client Secret da aplicação Twitch. Consultas devem ter timeout, limite, escaping e respostas tratadas. Nunca registrar token ou segredo.

### ImgBB

Recebe imagens por serviço autenticado. Chave somente no backend. Uploads devem continuar limitados e validados.

### MongoDB Atlas

Armazena `Users`, `Posts` e `Communities` no banco `GameHub`. A connection string nunca pode aparecer na árvore Git. Mudanças de dados em lote exigem backup antes da execução.

## 16. Princípios de desenvolvimento

- Preserve funcionamento local e de produção;
- não introduza acoplamento entre SPA e API;
- procure contratos e fluxos existentes antes de alterar;
- use DTOs específicos em vez de entidades como entrada;
- mantenha IDs e datas gerados pelo servidor;
- valide ownership no backend;
- centralize acesso HTTP do frontend;
- evite `any`, logs temporários e código morto;
- não esconda falhas de integração;
- não versionar segredos nem artefatos gerados;
- atualize README, guia e deploy quando o fluxo mudar.

## 17. Procedimento para mudanças

Antes:

1. Ler controller, service, model/DTO e telas envolvidas;
2. verificar impacto no contrato e nos dados existentes;
3. conferir segurança, autenticação e ownership;
4. identificar diferenças entre Development e Production.

Depois:

1. Executar build do backend e frontend;
2. testar o fluxo local afetado;
3. validar health check e configuração de produção quando aplicável;
4. executar auditorias de dependências;
5. revisar `git diff --check` e busca por segredos;
6. atualizar documentação;
7. criar commits pequenos, naturais e coerentes.

## 18. Débitos técnicos conhecidos

- warnings de nulabilidade em models e services legados;
- erros antigos de lint e Hooks no frontend;
- ausência de testes automatizados;
- bundle principal do frontend acima de 500 kB;
- recuperação pública por e-mail ainda não implementada;
- token do navegador ainda acessível ao JavaScript;
- operações antigas fazem loops e substituições completas no MongoDB;
- frontend ainda precisa do manifesto final do Netlify e testes de refresh de rotas.

Esses pontos devem ser resolvidos incrementalmente, sem reescrita total do projeto.

## 19. Definition of Done

Uma tarefa está concluída quando os itens aplicáveis forem atendidos:

- comportamento implementado;
- entrada validada e resposta tipada;
- autenticação e ownership revisados;
- compatibilidade local e de produção preservada;
- erros tratados sem exposição interna;
- backend compilando;
- TypeScript e build do frontend funcionando;
- testes do fluxo executados;
- dependências auditadas quando alteradas;
- nenhum segredo ou artefato gerado versionado;
- documentação atualizada;
- commit coerente criado.
