## Plano

Corrigir o bug visual em que o painel do hero aparece, os pontos/HUD aparecem, mas a malha do globo `cobe` não renderiza.

## O que vou alterar

1. **Garantir dimensões reais para o canvas**
   - Remover o uso de `contain: "layout paint size"` no canvas, porque `contain: size` pode fazer o elemento reportar dimensão inválida/zero para bibliotecas canvas.
   - Dar ao wrapper/canvas uma dimensão explícita estável (`aspect-square`, `min-height` responsivo e canvas com `width/height` reais).

2. **Inicialização robusta do `cobe`**
   - Medir o tamanho pelo container (`getBoundingClientRect`) em vez de depender de `canvas.offsetWidth`.
   - Definir `canvas.width` e `canvas.height` antes de chamar `createGlobe`.
   - Usar `ResizeObserver` no container para reinicializar/atualizar o globo quando o tamanho mudar.

3. **Renderização visível do globo original**
   - Manter o visual original dark/network pulse solicitado.
   - Ajustar `width`, `height`, `scale`, `baseColor`, `mapBrightness` e `glowColor` para que a esfera e os continentes fiquem claramente visíveis dentro do card navy.

4. **Validar no preview**
   - Abrir o hero no navegador local e confirmar visualmente que a esfera do globo aparece, não apenas os pontos e HUD.