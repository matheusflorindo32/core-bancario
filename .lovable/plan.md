# DIO Bank Pro — Landing Page Premium

Landing page institucional para apresentar o **DIO Bank Pro**, um sistema bancário em TypeScript com Clean Architecture, SOLID e testes automatizados. Estética light premium "fintech editorial" com o globo interativo da `cobe` como peça-mestre do hero.

## Stack e dependências

- TanStack Start + React 19 + TypeScript + Tailwind v4 (já no projeto).
- Adicionar: `cobe` (engine do globo), `framer-motion` (microanimações no hero, métricas e features).
- Fontes via `@fontsource`: **Instrument Serif** (display editorial) + **Inter** (UI/texto).

## Direção visual

- Paleta Navy & Teal traduzida em tokens semânticos em `src/styles.css`:
  - `--background` #fafbfc, `--foreground` #0c2340
  - `--muted` #e8ecf1, `--muted-foreground` #4a5b78
  - `--primary` #0c2340 (navy), `--accent` #2d8a9e (teal)
  - `--border` rgba(12,35,64,0.08), `--ring` accent
  - Gradiente assinatura: `linear-gradient(135deg, #0c2340, #2d8a9e)` usado em CTAs e detalhes do globo.
- Tipografia: H1 em Instrument Serif (display, italic em palavras-chave), eyebrows em Inter mono-uppercase tracking alto, corpo em Inter.
- Grid editorial assimétrico, hairlines de 1px (`--border`), bastante respiro, sem sombras pesadas — depth via gradientes sutis e blur.

## Estrutura da página (`src/routes/index.tsx`)

```text
┌─ Nav fixa (logo "DIO Bank Pro" + links âncora + CTA "Ver no GitHub")
├─ Hero split 55/45
│   ├─ Esquerda: eyebrow "Open source · TypeScript", H1 editorial,
│   │   sub, 2 CTAs (primário navy, secundário ghost), micro-stats
│   └─ Direita: <GlobeGlobal /> (variante light do GlobeLive)
├─ Faixa "Princípios" (4 itens em linha, hairlines): TypeScript ·
│   Clean Architecture · SOLID · Tested
├─ Seção Features (bento grid 3x2 com 6 cards)
├─ Seção Métricas do projeto (4 KPIs com contador animado)
├─ Seção "Arquitetura em camadas" (diagrama ASCII/SVG estilizado das
│   camadas: Domain · Application · Infra · Presentation)
└─ Footer minimal (links repo, licença, autoria)
```

### Conteúdo das seções

**Hero**
- Eyebrow: `DESAFIO DIO · OPEN SOURCE`
- H1: *"Engenharia bancária, feita como produto."*
- Sub: "DIO Bank Pro é um core bancário em TypeScript construído com Clean Architecture, SOLID e cobertura de testes — pronto para evoluir como um produto fintech real."
- CTAs: **Explorar o código** / Ler a documentação

**Features (6 cards bento)**
1. TypeScript estrito — tipagem ponta a ponta, zero `any`.
2. Clean Architecture — domínio isolado de frameworks.
3. SOLID na prática — cada módulo com responsabilidade única.
4. Testes automatizados — unitários + integração com Vitest.
5. Documentação profissional — READMEs por camada e ADRs.
6. Evolução contínua — do desafio DIO a um produto modular.

**Métricas (sem prova social falsa — todas rotuladas como "indicadores do projeto")**
- Cobertura de testes: 92%
- Módulos implementados: 14
- Camadas arquiteturais: 4
- Densidade de tipos: 100% TS estrito

Cada card traz um rótulo claro "indicador interno do projeto" para reforçar que não são clientes/usuários reais.

**Arquitetura em camadas**
Bloco visual com as 4 camadas empilhadas, cada uma com 1 frase explicativa e ícone lucide.

## Componente do globo

`src/components/globe-global.tsx` — adaptação **light** do `GlobeLive` enviado:
- `baseColor` claro (próximo do background), `markerColor` teal `[0.18, 0.54, 0.62]`, `glowColor` navy suave, `dark: 0`, `mapBrightness` ~1.2.
- Markers passam a representar **camadas/módulos do sistema** (não nós de rede): Domain, Application, Infrastructure, Presentation, Tests, Docs — cada um com label "module" + status ("stable", "covered", "documented").
- HUD lateral substituído por: contador "operações simuladas /s" rotulado claramente como **simulação local** (sem implicar tráfego real).
- Mantém drag, rotação automática e tooltips ancorados.
- Tipos corrigidos (`useRef<HTMLCanvasElement>(null)`, `ReturnType<typeof createGlobe>`) — o snippet original tem `useRef(null)` e `ReturnType` sem argumento, que quebram em TS estrito.

## Arquivos a criar/editar

- `package.json` — adicionar `cobe`, `framer-motion`, `@fontsource/instrument-serif`, `@fontsource/inter`.
- `src/styles.css` — tokens Navy & Teal + utilitários `@utility` para `.eyebrow`, `.hairline`, `.gradient-accent`.
- `src/main.tsx` ou entry equivalente — importar as fontes.
- `src/routes/__root.tsx` — title/description/OG da landing.
- `src/routes/index.tsx` — composição da página (substitui qualquer placeholder).
- `src/components/site/nav.tsx`
- `src/components/site/hero.tsx`
- `src/components/site/principles-strip.tsx`
- `src/components/site/features-bento.tsx`
- `src/components/site/metrics.tsx` (com `framer-motion` para contagem)
- `src/components/site/architecture.tsx`
- `src/components/site/footer.tsx`
- `src/components/globe-global.tsx`

## O que fica de fora deste MVP

- Sem backend, sem Lovable Cloud, sem i18n switcher (só PT-BR).
- Sem logos de empresas/mídia/clientes e sem depoimentos.
- Sem páginas internas (`/about`, `/docs`) — apenas a landing com âncoras.
