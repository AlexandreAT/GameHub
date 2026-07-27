# Frontend do GameHub

SPA React, TypeScript e Vite do GameHub.

As instruções completas de configuração e execução estão no [README principal](../README.md). Para desenvolvimento local:

```powershell
npm ci
npm run dev
```

O Vite encaminha `/api` para `https://localhost:7045`. Em produção, configure `VITE_API_BASE_URL` no Netlify com a URL do backend Render seguida de `/api`.

Nunca coloque MongoDB, JWT, IGDB, ImgBB ou qualquer outro segredo em variáveis `VITE_*`.
