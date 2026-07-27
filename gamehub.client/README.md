# Frontend do GameHub

SPA React, TypeScript e Vite do GameHub.

As instruções completas de configuração e execução estão no [README principal](../README.md). Para desenvolvimento local:

```powershell
npm ci
npm run lint
npm run dev
```

O Vite encaminha `/api` para `https://localhost:7045`. Em produção, configure `VITE_API_BASE_URL` no Netlify com a URL do backend Render seguida de `/api`.

O JWT é mantido apenas no `sessionStorage` da aba e enviado como Bearer pelo cliente Axios central. Fechar a aba ou receber `401` encerra a sessão.

Nunca coloque MongoDB, JWT, IGDB, ImgBB ou qualquer outro segredo em variáveis `VITE_*`.
