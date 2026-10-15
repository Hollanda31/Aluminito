# PRD — Aluminito · Esquadrias de Alumínio e Vidros (Landing Page)

## Problem Statement Original
Criar uma Landing Page moderna, elegante e focada em conversão de orçamentos para a empresa "Aluminito - Esquadrias de Alumínio e Vidros" (Serra - ES / Grande Vitória). Paleta: Grafite #1E293B/#0F172A, Prata #E2E8F0/#CBD5E1, CTA Azul #0284C7, fundos branco/#F8FAFC. Seções: Header, Hero, Sobre, Produtos & Serviços, Galeria de Projetos com filtros, Depoimentos, CTA intermediário + formulário, Rodapé com mapa. Requisitos técnicos: 100% responsivo, botão flutuante de WhatsApp, formulário de orçamento, animações suaves de scroll.

## Escolhas do Usuário (confirmadas)
- CTA: Azul Moderno #0284C7 em TODOS os botões (inclusive WhatsApp)
- WhatsApp oficial: (27) 99868-2220 → wa.me/5527998682220
- Formulário: abre WhatsApp com mensagem pré-preenchida (nome, telefone, cidade, tipo de projeto)
- Logo oficial fornecido pelo usuário (ícone "AL" preto/vermelho/branco) → usado no header, footer e favicon

## Arquitetura
- Frontend-only (React + Tailwind, padrão Emergent) em `/app/frontend`
- Sem backend/BD: toda conversão ocorre via links wa.me (nenhum dado é persistido)
- Componentes em `src/components/`: Header, Hero, Marquee, Sobre, Produtos, Projetos, Depoimentos, Contato, Footer, FloatingWhatsApp, Logo, Reveal, icons
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
- 2026-07-14: 5 fotos reais de porta de correr comercial (restaurante) agrupadas substituindo o placeholder "Porta pivotante" (posição 3, categoria Portas).

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
- P2: Pixel/GA4 para medir conversão de cliques no WhatsApp

## Próximas Tarefas
1. Receber fotos reais da empresa e trocar nos cards/galeria
2. Confirmar horário de atendimento real
3. Coletar depoimentos reais de clientes
