## Objetivo

Trocar o `GlobeGlobal` adaptado (light, navy/teal, com markers de camadas) pela versão **original do 21st.dev** (`shuding/cobe-globe-live`) — globo escuro com pulsos de rede animados — mantendo a landing **DIO Bank Pro** ao redor (nav, hero copy, princípios, bento, métricas, arquitetura, footer).

## O que muda

### 1. Componente do globo
- Substituir `src/components/globe-global.tsx` por uma versão fiel ao `GlobeLive` do 21st.dev:
  - Esfera **escura** (`baseColor` navy profundo, `dark: 1`, `glowColor` sutil).
  - **Markers de rede** em 8–10 cidades (NY, SP, Londres, Tóquio, Singapura, Sydney, Frankfurt, SF, Mumbai, São Paulo).
  - **Pulsos animados** (rings concêntricos que expandem e desvanecem) sobre os markers a cada ~1.5–3s, simulando tráfego de rede.
  - **HUD "live"**: contador de eventos/s e badge "● LIVE" pulsando — substitui o HUD atual "ops/s · simulação local".
  - Rotação automática + drag para girar (igual hoje).
  - Mantém o `ResizeObserver` boot para nunca renderizar com width 0.

### 2. Hero
- Trocar o fundo do lado direito do hero para um **"poço escuro"** (card navy `bg-foreground` ou um wrapper com `bg-[hsl(var(--navy))]`) para o globo escuro contrastar — o resto da landing continua light.
- Caption sob o globo passa a refletir o componente original: "Rede global · 24 regiões · 99,99% uptime simulado".

### 3. Limpeza
- Remover a lógica de "markers = camadas Clean Arch" e o glow teal central — eram adaptações do globo light.
- Manter intactos: nav, copy do hero, principles-strip, features-bento, metrics, architecture, footer.

## Detalhes técnicos

- `cobe` e `framer-motion` já instalados — sem novas deps.
- Pulsos implementados via overlay SVG/CSS posicionado por projeção 3D→2D simples (lat/long → x/y na esfera renderizada), com `framer-motion` animando `scale` + `opacity` em loop. Alternativa mais simples e fiel ao original: pulsos como `<div>` absolutos posicionados em coordenadas pré-calculadas dos markers visíveis na face frontal, com `animation-delay` escalonado.
- Globo escuro precisa de um container com fundo escuro local — uso `<div className="rounded-3xl bg-[hsl(var(--navy))] p-8 ring-1 ring-[hsl(var(--navy))]/10 shadow-2xl">` envolvendo o canvas, sem mudar o tema global da página.
- Tokens: continuo usando os tokens semânticos do projeto (`--navy`, `--teal`, `--bg-soft`) — sem hex hardcoded em componentes.

## Fora de escopo

- Não mexer em outras seções da landing.
- Não trocar paleta global nem fontes.
- Sem backend / dados reais — pulsos continuam sendo simulação visual.