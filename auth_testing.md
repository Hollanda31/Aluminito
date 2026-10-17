# Teste de autenticação do painel administrativo

## Etapa 1 — MongoDB
- Confirmar que o banco ativo é o valor de `DB_NAME` do backend.
- Confirmar que existe exatamente um usuário administrador com o e-mail configurado em `ADMIN_EMAIL`.
- Confirmar que `password_hash` começa com `$2b$`.
- Confirmar índices: `users.email` único, `login_attempts.identifier` e `password_reset_tokens.expires_at` com TTL.

## Etapa 2 — API
- `POST /api/auth/login` com credenciais inválidas deve retornar 401.
- Após 5 tentativas inválidas pelo mesmo IP/e-mail, deve retornar 429 por até 15 minutos.
- Limpar o bloqueio de teste no MongoDB após validar o 429.
- `POST /api/auth/login` com as credenciais corretas deve retornar o usuário e definir cookies `access_token` e `refresh_token` como httpOnly.
- `GET /api/auth/me` sem cookie deve retornar 401.
- `GET /api/auth/me` com cookie deve retornar o usuário.
- `POST /api/auth/refresh` com cookie de refresh deve renovar o cookie de acesso.
- `POST /api/auth/logout` autenticado deve remover os cookies.

## Etapa 3 — Rastreamento e painel
- `POST /api/track` deve aceitar `{ grupo, item, origem }` e salvar em `lead_events` sem exigir autenticação.
- `GET /api/admin/stats` sem autenticação deve retornar 401.
- Após login, `GET /api/admin/stats?periodo=semana` e `periodo=mes` devem retornar total, hoje, por_dia, por_grupo, por_item e ultimos.
- Um clique de teste enviado pelo frontend deve aparecer nas estatísticas e na lista de últimos atendimentos.

## Etapa 4 — Frontend
- `/admin/login` deve redirecionar para `/admin` após login válido.
- `/admin` sem sessão deve redirecionar para `/admin/login`.
- `/admin` deve exibir gráficos, ranking, itens mais escolhidos e últimos atendimentos.
- Botões de período, atualizar e sair devem funcionar.
- A landing page `/` deve continuar funcionando com rolagem suave, âncoras, galeria, catálogo e WhatsApp.
