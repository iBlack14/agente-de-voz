# Playwright MCP para inspiracion web

## Configuracion

Servidor MCP recomendado para exploracion visual de sitios reales:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@latest"]
```

Comando equivalente por CLI:

```powershell
codex mcp add playwright -- npx "@playwright/mcp@latest"
```

## Verificacion rapida

1. Confirmar registro en Codex:

```powershell
codex mcp list
codex mcp get playwright
```

2. Confirmar que el servidor inicia localmente:

```powershell
npx @playwright/mcp@latest --help
```

Nota: `list_mcp_resources` y `list_mcp_resource_templates` pueden aparecer vacios. En Playwright MCP eso es normal porque su valor principal esta en herramientas de navegacion/automatizacion, no en recursos estaticos.

## Flujo de trabajo: investigar -> capturar -> convertir a Tailwind

1. Investigar (3 a 5 sitios por estilo)
- Definir estilo objetivo (ejemplo: SaaS limpio, editorial, e-commerce premium).
- Abrir referencias en desktop y mobile.
- Registrar patrones repetidos: hero, navbar, cards, CTA, footer.

2. Capturar
- Guardar capturas de estados clave: landing, seccion de precios, formulario, menu mobile.
- Capturar al menos 1 estado de hover/focus/activo cuando aporte al comportamiento visual.

3. Sintetizar tokens visuales
- Tipografia: escala de tamanos, peso, interlineado.
- Espaciado: ritmo vertical, padding en componentes, gaps en grids.
- Color: fondo base, texto primario/secundario, acento, estados.
- Componentes: radio de borde, sombras, densidad, iconografia.

4. Convertir en UI con Tailwind
- Pasar tokens a `tailwind.config.js` (colores, fuentes, spacing extendido si aplica).
- Implementar primero layout base y jerarquia visual.
- Implementar despues componentes reutilizables (botones, cards, inputs, navbar).
- Revisar responsive real en breakpoints y ajustar densidad.

## Resultado esperado

- Referencias visuales concretas y reproducibles.
- Guia accionable para implementar una version consistente en `HTML/CSS/JS + Tailwind`.
- Menos iteraciones por decisiones visuales ambiguas.
