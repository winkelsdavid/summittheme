# Backlog

## Farb-Settings: Inline-Styles durch CSS-Custom-Property-Kaskade ersetzen (theme-weit)

**Status:** Offen · **Prio:** Mittel · **Angelegt:** 2026-07-02

### Problem

Das Theme setzt Farb-Settings an vielen Stellen als Inline-Style direkt auf Elemente
(`style="background-color: {{ settings.… }}"`). Inline-Styles schlagen jede
Stylesheet-Regel — dadurch entstehen drei wiederkehrende Fehlerklassen:

1. **Block-/Section-Overrides greifen nicht oder nur scheinbar.**
   Konkreter Fall (2026-07 behoben, Price-Block in `sections/product-template-1.liquid`):
   Badge Background als Hex gesetzt → wirkungslos, weil das Inline-`background-color`
   (Theme-Setting `sale_label_bg_product`) gewinnt. Als **Gradient** gesetzt →
   funktioniert scheinbar, weil ein Gradient `background-image` ist und die Inline-
   `background-color` nur übermalt. Ergebnis: Hex und Gradient verhalten sich
   unterschiedlich, obwohl es dasselbe Setting ist.
2. **`!important`-Flickenteppich.** Wo das Problem auffiel, wurde punktuell
   `!important` ergänzt (z. B. `color:…!important` im Price-Block) — beim
   `background` daneben aber vergessen. Nicht wartbar.
3. **Leere Settings erzeugen ungültiges CSS** (`background:;`), das still verworfen
   wird — der tatsächliche Fallback ist dann Zufall (nächste Regel in der Kaskade).

### State-of-the-art-Zielbild (Muster wie Dawn)

Farbwerte nie direkt als Property setzen — weder inline noch mit `!important`.
Stattdessen dreistufige Custom-Property-Kette, aufgelöst an genau einer Stelle:

```liquid
{%- comment -%} 1. Global-/Theme-Setting: nur als Variable, guarded {%- endcomment -%}
<div class="product-tag"
  {% if settings.sale_label_bg_product != blank %}style="--badge-bg-global: {{ settings.sale_label_bg_product }}"{% endif %}>
```

```css
/* 2. Block-/Section-Override: eigene Variable (nie derselbe Name wie inline!) */
.price-SECTION .product-tag {
  {% if block.settings.b_bk != blank and block.settings.b_bk != "rgba(0,0,0,0)" %}--badge-bg-block: {{ block.settings.b_bk }};{% endif %}
}

/* 3. Eine konsumierende Regel, background-Shorthand (Hex UND Gradient) */
.product-tag {
  background: var(--badge-bg-block, var(--badge-bg-global, var(--g-label-hot)));
}
```

Eigenschaften des Musters:

- Hex und Gradient verhalten sich identisch (immer `background`-Shorthand).
- Priorität steckt in der `var()`-Fallback-Reihenfolge, nicht in Spezifität/`!important`.
- Leere/transparente Settings definieren die Variable gar nicht erst → sauberer
  Fallback statt `background:;`.
- Wichtig: Inline-Variable und Stylesheet-Variable brauchen **getrennte Namen**,
  sonst schlägt die Inline-Variable den Stylesheet-Override wieder.
- Transparent-Konvention des Themes beibehalten: `rgba(0,0,0,0)` == „nicht gesetzt"
  → Fallback auf `settings.branding_color` (etabliertes Muster, siehe
  `sections/announcement-bar.liquid`, `sections/custom-reviews.liquid`,
  `snippets/checkmark-*.liquid`).

### Referenz-Implementierung

Price-Block-Badges in `sections/product-template-1.liquid` (Suche nach `--badge-bg`
bzw. `--badge2-bg`): Inline-`background-color` entfernt, Block-Setting als guarded
Variable, Fallback auf `settings.branding_color`, zuletzt `var(--g-label-hot)`.

### Offene Stellen (Inline-Background aus Theme-Settings, Stand 2026-07-02)

Gefunden mit `style="…background…{{ settings.` — jeweils auf das Muster umstellen:

- `snippets/product-label.liquid` — Zeilen 4, 49, 67, 76 (Sale-/New-/Custom-/Soldout-Label;
  gleiche Badge-Logik wie der behobene Price-Block, höchste Priorität)
- `sections/product-bundle.liquid` — Zeile 182
- `snippets/block-cart.liquid` — Zeilen 195, 214, 551, 570
- `snippets/loading_animation.liquid` — Zeilen 107, 141
- `snippets/rating-custom.liquid` — Zeile 79
- `sections/custom-progress-bars.liquid` — Zeile 126 (hat bereits Blank-Guard, aber inline)
- außerdem: `assets/theme.css:5941` (`.product-tag { background-color: var(--g-label-hot) }`)
  als globale Konsum-Regel auf die var()-Kette umziehen, sobald die Label-Snippets
  umgestellt sind

Danach `!important`-Altlasten abbauen (z. B. `color:…!important` im Price-Block)
und die Farbwerte perspektivisch in `color_scheme_group` (Shopify Color Schemes)
überführen.
