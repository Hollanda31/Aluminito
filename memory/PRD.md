# PRD — Aluminito · Esquadrias de Alumínio e Vidros (Landing Page)

## Problem Statement Original
Criar uma Landing Page moderna, elegante e focada em conversão de orçamentos para a empresa "Aluminito - Esquadrias de Alumínio e Vidros" (Serra - ES / Grande Vitória). Paleta: Grafite #1E293B/#0F172A, Prata #E2E8F0/#CBD5E1, CTA Azul #0284C7, fundos branco/#F8FAFC. Seções: Header, Hero, Sobre, Produtos & Serviços, Galeria de Projetos com filtros, Depoimentos, CTA intermediário + formulário, Rodapé com mapa. Requisitos técnicos: 100% responsivo, botão flutuante de WhatsApp, formulário de orçamento, animações suaves de scroll.

## Escolhas do Usuário (confirmadas)
- CTA: Azul Moderno #0284C7 em TODOS os botões (inclusive WhatsApp)
- WhatsApp oficial: (27) 99868-2220 → wa.me/5527998682220
- Formulário: abre WhatsApp com mensagem pré-preenchida (nome, telefone, cidade, tipo de projeto)
- Logo oficial fornecido pelo usuário (ícone "AL" preto/vermelho/branco) → usado no header, footer e favicon

## Arquitetura
- Full-stack: React + Tailwind em `/app/frontend`, FastAPI + MongoDB em `/app/backend`
- Banco ativo obrigatório: `DB_NAME="Gerência"` (reviews, usuários admin e eventos de clique)
- Landing page em `src/components/`: Header, Hero, Marquee, Sobre, Produtos, CatalogoCores, Projetos, Depoimentos, Contato, Footer e FloatingWhatsApp
- Painel administrativo em `src/pages/AdminLogin.jsx` e `src/pages/Admin.jsx`, protegido por JWT em cookies httpOnly com refresh
- Rastreamento de intenção de orçamento em `src/lib/track.js` → `POST /api/track` → coleção `lead_events`
- Constantes de contato/imagens em `src/lib/site.js`; Lenis smooth-scroll em `src/lib/scroll.js`
- Fontes: Outfit (títulos) + Plus Jakarta Sans (corpo)
- Logo oficial em `public/logo-aluminito.png` (favicon + header + footer)

## Personas
- Proprietário de residência (reforma/construção) — quer orçamento rápido no WhatsApp
- Arquiteto/designer — avalia acabamento e portfólio
- Engenheiro/construtora — avalia pontualidade, fachadas pele de vidro e escala

## Requisitos Centrais (estáticos)
1. Conversão para WhatsApp em todos os pontos (header, hero, produtos, galeria, formulário, flutuante)
2. Apresentação de serviços (5 categorias) com imagens
3. Galeria filtrável (Portas, Janelas, Fachadas, Guarda-Corpo) com lightbox
4. Responsivo total + menu mobile
5. Contato completo: endereço R. Vitória, 488 - Alterosas, Serra - ES · Instagram @aluminitoesquadrias · WhatsApp (27) 99868-2220 · Mapa

## Implementado
- 2026-07-14: Landing page completa — hero cinético com reveal linha-a-linha + parallax, marquee editorial, Sobre com 4 diferenciais, Produtos em bento grid (5 cards → WhatsApp), Galeria com filtros + lightbox, Depoimentos (3), CTA + formulário → WhatsApp pré-preenchido (validado: popup abre wa.me/5527998682220 com todos os campos), rodapé com Google Maps, botão flutuante WhatsApp, Lenis + framer-motion, scroll-reveal em todas as seções, sem overflow horizontal (testado 1440px e 390px).
- 2026-07-14: Logo oficial do usuário aplicado em header, footer e favicon.
- 2026-07-14: Mensagem padrão do WhatsApp refinada ("...admirei o acabamento dos projetos de vocês...") aplicada a Hero, header, flutuante e banner da galeria.
- 2026-07-14: Duas fotos reais do usuário adicionadas à galeria (porta de alumínio branca → Portas; envidraçamento de sacada → Janelas), otimizadas para web em `public/projects/`.
- 2026-07-14: Lightbox da galeria com navegação anterior/próxima dentro da categoria filtrada (setas, teclado ←/→, contador "n de m", ESC fecha).
- 2026-07-14: Fotos reais reordenadas para posições 1 e 2 da galeria; foto da sacada envidraçada virou a capa (fundo do Hero).
- 2026-07-14: Foto real de janela de correr em alumínio branco substituiu o placeholder "Janela panorâmica" (posição 4, categoria Janelas).
- 2026-07-14: Foto real de portão de correr em alumínio branco substituiu o placeholder "Portas de correr integradas ao jardim" (posição 7, categoria Portas).
- 2026-07-14: Galeria com suporte a múltiplos ângulos por projeto — o portão de correr tem 3 fotos agrupadas; selo "N fotos" no card, setas e pontos navegáveis no zoom, contador achatado "n de m" por categoria.
- 2026-07-14: 5 fotos reais de porta de giro comercial (restaurante) agrupadas substituindo o placeholder "Porta pivotante" (posição 3, categoria Portas); título "Porta de Giro comercial em Alumínio".
- 2026-07-14: "Pele de vidro comercial" substituída por "Divisória corporativa em vidro" (2 ângulos reais, posição 5); nova categoria de filtro "Divisórias" criada.
- 2026-07-14: "Guarda-corpo em vidro à beira-mar" substituído por "Porta de correr em duas folhas" (4 ângulos reais, posição 6, categoria Portas); rotação das 4 fotos corrigida 90° horário (originais webp sem EXIF, gravadas de lado).
- 2026-07-14: Portão de correr branco movido da categoria Portas para a nova categoria "Portão de Garagem" (filtro próprio criado).
- 2026-07-15: Paleta do site alterada para a identidade do logo: vermelho #FF0000 (todos os CTAs/acentos), preto #000000/#111111 (fundos escuros), cinza #808080 (textos secundários) e branco #FFFFFF/#F5F5F5 (fundos claros). Tokens em tailwind.config.js (graphite, graphite2, silver, silverlight, mist, azul) — troca em cascata.
- 2026-07-15: Stat do Hero "Atendimento" alterado para "Todo o Brasil"; imagem secundária (sobreposta) da seção Sobre removida.
- 2026-07-15: Fundo do Hero virou carrossel com 5 fotos (capa da sacada + 4 fotos históricas da fábrica em `public/hero/`), crossfade de 1,4s a cada 5,5s, zoom Ken Burns sutil e pontos de navegação clicáveis.
- 2026-07-15: Carrossel reduzido às 3 fotos históricas (removidas sacada + primeira histórica); selo "Acervo histórico · Há mais de 40 anos no ramo" adicionado ao Hero (empresa atua há +40 anos — informação do cliente).
- 2026-07-15: Removidos os 3 últimos placeholders da galeria ("Esquadrias panorâmicas", "Fachada em vidro", "Guarda-corpo em sacadas"); galeria agora é 100% fotos reais (7 projetos). Filtros "Fachadas" e "Guarda-Corpo" ocultados por estarem sem projetos — reativar quando o cliente enviar fotos dessas categorias. Placeholders restantes: cards de Produtos e foto da seção Sobre.
- 2026-07-15: Foto da fachada atual da loja adicionada como 1º slide do carrossel da capa (4 slides). Nova categoria "Banheiro" na galeria com projeto "Box de vidro e espelho sob medida" (5 ângulos reais, rotação corrigida 90° horário); capa do card trocada para a foto do espelho/cuba (banheiro-1) a pedido do cliente. Itens "Porta de alumínio branca com puxador" e "Envidraçamento de sacada em vidro" removidos da galeria (ficaram 6 projetos).
- 2026-07-16: Nova seção "Catálogo de Cores" (entre Produtos e Projetos, link "Cores" no menu): 40 cores de pintura eletrostática + 20 acabamentos efeito madeira do catálogo Metaperfil, SEM anodização (a pedido). Amostras em `public/cores/`, abas Pintura/Madeira, cada cor abre WhatsApp com a cor escolhida.
- 2026-07-16: Simulador de cores com IA (Gemini gemini-3.1-flash-image-preview via EMERGENT_LLM_KEY): clicar na cor abre modal ampliado → botão "Simular" → escolha de tipo (Porta, Persiana, Janela, Outros) → imagem gerada por IA repintando foto real na cor; trilho de cores troca a cor sem sair, botão volta ao tipo sem fechar. Backend `POST /api/simular` com cache em disco (`/app/backend/simulacao_cache/`, 1ª geração ~14s, cache ~0,3s). Base persiana gerada uma vez (`/app/backend/base_persiana.jpg`). Base "Outros modelos" = porta-duas-folhas-1.jpg (foto real com ripado, escolhida pelo cliente). WhatsApp mantido como CTA secundário no modal.
- 2026-07-16: Fix de rolagem do modal de cores — `stopScroll()/startScroll()` em `lib/scroll.js` (lenis.stop/start + overflow hidden em html/body + guarda wheel/touchmove em capture com exceção `[data-scroll-lock-allow]`); modal com `overscroll-contain` + `data-lenis-prevent`. Verificado com eventos reais de roda: fundo travado, rolagem interna ok, sem encadeamento nos limites, restaura ao fechar.
- 2026-07-17: .env do backend/frontend restaurados (haviam sumido do workspace — quebrava preview e deploy) + node_modules reinstalado (craco ausente); redeploy acionado.
- 2026-07-17: Fix de deploy em produção — hook `migrate_legacy_reviews()` derrubava o backend (lia 'test_database' sem permissão na credencial de prod); agora só roda com LEGACY_DB_NAME explícita e diferente de DB_NAME, com try/except. Redeploy acionado.
- 2026-07-17: Pacote "Aluminito-site-normal.zip" enviado pelo cliente era idêntico ao estado atual (edições paralelas do cliente já no workspace: categorias "Guarda Corpo", "Shopping", "Vídeos", suporte a vídeo na galeria, selos "N mídias", nav "Avaliações", novas capas de projetos). Nada a aplicar; 16 fotos reais extras do workspace preservadas.

- 2026-10-17: Projeto restaurado a partir do export do usuário (Aluminito-site-normal.zip): frontend completo (Header, Hero carrossel, Marquee, Sobre, Produtos, Catálogo de Cores + simulador IA, Projetos, Depoimentos, Contato, Footer, WhatsApp flutuante) e backend (reviews + /api/simular com cache) reinstalados; dependência lenis adicionada via yarn. 16 fotos faltantes no zip (projetos Porta de Giro comercial, Janela de correr, Divisória, Porta duas folhas, Portão de correr + base do simulador porta-branca) preenchidas com imagens de banco nas filenames exatas esperadas pelo código — SUBSTITUIR por fotos reais quando o cliente enviar. Verificado: curl /api/reviews (GET/POST 200), /api/simular com cache (200, imagem), site 1440px e 390px sem overflow, filtros + lightbox funcionando.
- 2026-10-17: Painel administrativo de atendimentos concluído: login em `/admin/login` com JWT em cookies httpOnly, refresh token, logout, proteção por 5 tentativas/15 minutos, seed idempotente do admin e índices MongoDB. Todos os CTAs de WhatsApp enviam intenção para `POST /api/track`; `/admin` mostra total, hoje, melhor dia, gráfico 7/30 dias, ranking por categoria, itens mais escolhidos e últimos atendimentos. Credenciais registradas em `/app/memory/test_credentials.md`; 15 testes backend passaram e E2E do painel/landing foi validado.
- 2026-10-17: Moderação de avaliações adicionada ao painel: novas avaliações aparecem no site imediatamente (escolha do usuário), admin pode listar, filtrar Todas/Visíveis/Ocultas, ocultar/mostrar e excluir; edição não permitida. `GET /api/reviews` público oculta apenas `status=hidden` e mantém avaliações legadas visíveis; endpoints admin protegidos por JWT. E2E completo validado, incluindo criação pública, ocultação, reexibição, exclusão e responsividade.
- 2026-10-17: Destaque manual de avaliações: admin pode destacar/remover destaque, filtrar "Destaques" e ver selo no card; destacadas aparecem primeiro no site, com a destacada mais recentemente no topo (`featured`/`featured_at`). Corrigidos erros de compilação em alterações paralelas de PWA/header e ajustado o seletor do painel Simulador para eliminar warning de HTML. E2E validado com PWA, abas Atendimentos/Simulador/Avaliações e 19 testes backend.

## Conteúdo a Substituir (dados de exemplo)
- Fotos de produtos/projetos: imagens de banco (Unsplash) como placeholder — substituir por fotos reais da Aluminito
- Depoimentos: textos de EXEMPLO (Mariana S., Carlos M., Rodrigo T.) — substituir por depoimentos reais
- Horário de atendimento (Seg–Sex 07h30–17h30): placeholder a confirmar

## Backlog Priorizado
- P0: Fotos reais dos projetos da Aluminito na galeria e produtos
- P0: Depoimentos reais de clientes
- P1: E-mail de contato / formulário com envio por e-mail além do WhatsApp
- P1: Página de projeto individual com galeria expandida
- P2: Blog/cases para SEO local ("esquadrias de alumínio Serra ES")
- P2: GA4/Pixel opcional para complementar o painel interno de conversões

## Próximas Tarefas
1. Receber fotos reais da empresa e trocar nos cards/galeria
2. Confirmar horário de atendimento real
3. Coletar depoimentos reais de clientes
4. Acompanhar os primeiros cliques reais no painel e validar se as categorias estão úteis
