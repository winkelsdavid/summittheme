# SUMMIT_PATCH_REQUIREMENTS.md — Theme-Modernisierung

Patch-Liste für das Summit-Reference-Theme. Basis: Direktinspektion von
`summitnewclean.zip`, gegenverifiziert in zwei unabhängigen Code-Audits
(Stand 2026-06-06). Quellpfade unten beziehen sich auf den entpackten
Theme-Root.

Ziel: Lighthouse-Performance ~40 → 75+ mobil, Core-Web-Vitals grün,
keine SEO-Penalty mehr, saubere App-Block-Kompatibilität — durch
**gezielten Cleanup**, nicht durch Rebuild.

Diese Datei ist KEINE Roadmap für Nitro-Admin. Sie ist Input für den
Customer-App-Pfad: Summit ist das Theme, das Nitro an Kunden
ausliefert. Wenn Summit Legacy-Ballast trägt, leiden alle generierten
Shops mit.

---

## Theme-Store-Gate — warum dieser Cleanup Pflicht ist

> Das Gate: Themes brauchen einen durchschnittlichen Lighthouse-
> Performance-Score von mindestens 60 über Produkt-, Collection- und
> Home-Page, für Desktop UND Mobile; dazu einen Accessibility-Score
> von mindestens 90. Und Navigation und Produktformular müssen mit
> deaktiviertem JavaScript funktionieren. Summits aktueller ~40er-Score
> + das jQuery-abhängige theme.js → fällt durch. Heißt: der Cleanup
> ist keine Kür, sondern die Eintrittskarte für den Premium-Kanal.

### JS-off-Audit gegen die Gate-Anforderung (Stand: aktuelle ZIP)

| Komponente | JS off | Befund |
|---|---|---|
| Top-Level-Header-Nav (Desktop) | ✓ | Native `<a href>`-Links in `snippets/header-content.liquid` und Varianten |
| Produkt-Formular | ✓ | `{% form 'product' %}` rendert nativen `<form action="/cart/add" method="post">` in `sections/product-template-1.liquid:2056`. Variant-Picker hat `<select name="id" class="no-js">` als Fallback (Z.2103); CSS-Switch über `html.no-js`-Klasse (`assets/theme.css:4893`). Knapp bestanden. |
| Cart-Page | ✓ | `<form action="/cart" method="post">` (`sections/cart-template.liquid:51`); Remove-Links als native `<a href="/cart/change?line=…&quantity=0">` |
| **Mobile-Burger-Menü** | **✗** | `snippets/button-toggle-menu-mobile.liquid` rendert `<button class="js-drawer-open-left">` ohne Link, ohne Form, ohne `<details>`. **Auf Mobile ist die Navigation ohne JS unzugänglich** → Gate-Killer. |
| **Drawer-Sub-Menüs** | **✗** | `snippets/drawer-nav.liquid:17` nutzt Bootstrap `data-toggle="collapse"` für die `+`-Toggles. jQuery-Bootstrap-abhängig. Hauptlink ist `<a href>` (geht), aber alle Sublevel-Items bleiben verborgen. |
| Predictive-Search | ✗ | JS-only, kein `<form>`-Fallback auf `/search` |
| Cart-Drawer | ✗ | JS-only — Fallback ist die Cart-Page (akzeptabel, Drawer ist Komfort) |
| Slideshow / Carousel | ⚠ | Swiper-Slides ohne JS oft in unbrauchbaren Stack-Zuständen (kein Carousel-Tier-State sichtbar) |

**Verdict:** Produkt-Formular ✓. Navigation ✗ — Mobile-Burger fällt durch.
Damit bestätigt der Code-Audit, dass Summit aktuell die JS-off-Klausel
des Theme-Store-Gates verletzt.

---

## Diagnose — Hybrid, kein Slate-Theme

Summit ist **kein Slate-Era-Theme**. Es hat ein modernes Online-Store-
2.0-Fundament, auf dem zusätzlich ein jQuery/Slate-Legacy-Layer parallel
mitläuft. Die Patches sind **Cleanup, kein Greenfield** — die Ziel-
Architektur existiert schon im Theme und muss nicht aufgebaut werden.

### Modernes Fundament (bleibt)

| Befund | Verifikation |
|---|---|
| 36 `customElements.define` in 22 Files | Web-Components Dawn-Style |
| 138× natives `loading="lazy"` in 76 Files | Browser-native Lazy bereits flächendeckend |
| 418× `image_url` in 94 Files | Moderner responsiver Filter dominant (~3.2× häufiger als `img_url`) |
| 67 JSON-Templates | Online Store 2.0 ✓ |
| `global.js` mit Vanilla + a11y-Patterns (`trapFocus`, `aria-expanded`) | Modernes Skript-Fundament läuft bereits parallel |

### Legacy-Layer (raus)

| Befund | Verifikation |
|---|---|
| jQuery (87 KB) + vendor.js (357 KB) | Render-blocking-Vendor-Stack |
| `theme.js` (202 KB) | ~552 `$(`-Calls, davon 62 spezifische jQuery-Marker (`$(document)`, `$(window)`, `$.ajax`, `jQuery(`) — aktiv geladen via `snippets/header-js.liquid:104` |
| swiper-bundle (145 KB) + swiper-bundle.css (23 KB) | Carousel-Lib |
| photoswipe (54 KB) | Lightbox-Lib |
| flatpickr (50 KB) | Datepicker-Lib |
| lazysizes (27 KB) | 156 Treffer in 84 Files — Parallel-Polyfill zum nativen Lazy |
| 129× `img_url` in 50 Files | Deprecated-Filter-Reste — Cleanup, kein systemisches Problem |
| `theme.css.liquid` (269 KB) | Liquid-CSS-Kompilation pro Request, nicht cache-bar |
| Preconnect-Typos `theme.liquid:14-15` (`https//...`) | Die Optimierungs-Hints laufen ins Leere |
| Inline-Styles + auskommentiertes CSS im `<head>` (Z.52-56, 69+) | Code-Smell, nicht performance-relevant |

### Was beim End-Kunden ankommt

| Symptom | Ursache | Impact |
|---|---|---|
| Lighthouse 30–50 mobil | ~700 KB Vendor-JS render-blockierend, theme.js 202 KB jQuery-Code parallel | Sichtbar lahmer Erstaufbau |
| Schlechte Core Web Vitals | Vendor-Bundle-Parse-Budget killt INP, kein `fetchpriority` aufs Hero | **Google-Ranking-Penalty seit CWV 2021** |
| Verzögerte Cart/Quick-Add | `$.ajax`-Pattern in theme.js statt `fetch` + optimistic UI | 200–400 ms sichtbare Pause |
| App-Block-Reibung | `window.theme.Sections` Slate-Constructor kollidiert teilweise mit modernen App-Block-Patterns | Manche Apps integrieren nicht clean |

### Was NICHT veraltet ist

- **Section-Schemas:** Sauberes 2.0-Format → Nitro's parse-theme +
  Field-Mapping bleiben kompatibel
- **JSON-Templates** (67/69) → Theme-Editor + Sections-überall funktioniert
- **Web-Components-Architektur** → Migrationsziel existiert bereits,
  jQuery-Code wandert in vorhandene Strukturen
- **`global.js`** → Vanilla-Code mit Accessibility ist da, fungiert als
  Hot-Path neben dem Legacy-Layer

---

## P1 — Legacy-Layer entfernen (Hauptarbeit)

### P1.1 `theme.js` → Vanilla migrieren + jQuery rauswerfen

**Was.** `assets/theme.js` (202 KB, 552 `$(`-Calls) blockweise in
Vanilla migrieren. Slate-`window.theme.Sections` Pattern ist entlang der
Constructor-Grenzen sauber zerlegbar — pro Block die Funktionalität
entweder als Web-Component in das bestehende `customElements`-Set
einpflanzen ODER als kleines Modul in `global.js` falten.

**Migrationspfad konkret:**
1. `theme.js` in funktionale Blöcke aufteilen (Section-Loader,
   AJAX-Cart, Drawer, Slideshow, Predictive-Search, etc.) — die
   Slate-Konstruktoren markieren die Grenzen
2. Pro Block: Ziel-Surface wählen (existing Web-Component erweitern vs
   neues kleines Modul in global.js)
3. Block-für-Block migrieren; jQuery als Compat-Shim parallel laufen
   lassen, bis alle Konsumenten weg sind
4. `vendor.js` + `jquery.js` aus assets/ löschen → -440 KB initialer JS
5. `header-js.liquid:104` `theme.js`-Tag entfernen

**Warum.** Größter Speed-Hebel (~50 % des Lighthouse-Gains). Vendor-JS
ist render-blockierend bzw. parse-budget-killend selbst mit `defer`.

**Risk.** Mittel — bounded weil Web-Components + global.js als
Landeplatz bereits stehen. Kein Rebuild aufs grüne Feld.

### P1.2 lazysizes entfernen

**Was.** `assets/lazysizes.min.js` löschen. Die 156 lazysizes/lazyload-
Verwendungen in 84 Files mechanisch durch native `loading="lazy"` +
`decoding="async"` ersetzen. Größte Verursacher: `snippets/bgset.liquid`
(10 Treffer), `snippets/product-media.liquid`, `sections/product-template-1.liquid`.

**Warum.** Native Lazy ist seit 2019/2022 in allen Zielbrowsern, läuft
schon parallel (138× im Theme), lazysizes ist reine Doppelung. Spart
27 KB JS + räumt einen Konzept-Duplikat-Layer auf.

**Risk.** Niedrig — drop-in. `bgset` (CSS-background-image lazy-load)
muss manuell migriert werden via IntersectionObserver-Snippet, aber
das ist ein einzelnes Snippet.

### P1.3 `img_url` → `image_url`

**Was.** Mechanischer Replace `img_url:` → `image_url: width:` in
den 129 verbliebenen Treffern. `sections/product-template-1.liquid`
(15 Treffer) ist der größte Verursacher.

**Warum.** `img_url` ist von Shopify 2021 deprecatet. `image_url` liefert
WebP automatisch + responsive `widths:`-Arrays + bessere LCP. Niedrige
Schwere weil `image_url` ohnehin schon 3.2× dominant ist — es ist
Rest-Cleanup.

**Risk.** Niedrig — beide Filter koexistieren, Migration mechanisch.

### P1.4 Progressive Enhancement: Mobile-Nav + Drawer-Sub-Menus

**Was.** Zwei Komponenten unter JS-off bedienbar machen:

1. **Mobile-Burger** (`snippets/button-toggle-menu-mobile.liquid`) auf
   `<details><summary>`-Pattern umstellen oder Checkbox-Hack (`<input
   type="checkbox">` + `:checked`-CSS). Damit öffnet der Burger das
   Drawer-Menü ohne JavaScript. Web-Component kann die a11y-Patterns
   (focus-trap, ESC-close, aria-expanded-Sync) on-top layern.
2. **Drawer-Sub-Menus** (`snippets/drawer-nav.liquid:17` Bootstrap
   `data-toggle="collapse"`) auf `<details><summary>` umstellen oder
   denselben Checkbox-Hack. Sublevel-Items sind dann ohne JS aufklappbar.

**Warum.** Theme-Store-Gate-Klausel: "Navigation und Produktformular
müssen mit deaktiviertem JavaScript funktionieren." Das Produkt-
Formular ist OK (native `{% form %}` + Select-Fallback); die Navigation
fällt aktuell durch.

**Risk.** Niedrig–mittel. `<details>` ist seit 2020 cross-browser; das
einzige Friction-Point ist die optische Angleichung des nativen
Disclosure-Markers an das bestehende Design. Web-Components für
Animation/Transitions können on-top sitzen, ohne den No-JS-Pfad zu
brechen.

**Side-Effects.** Predictive-Search, Cart-Drawer, Slideshow bleiben
JS-only — diese sind NICHT Teil der Gate-Klausel (Navigation +
Produktformular sind die expliziten Kriterien). Cart-Drawer fällt
sinnvoll auf die Cart-Page-Route zurück, das reicht.

---

## P2 — CWV-Feinschliff (1 Woche zusätzlich)

### P2.1 Hero-Image priorisieren

**Was.** Above-the-Fold-Hero: `loading="eager"` + `fetchpriority="high"`.
Alle anderen Bilder bleiben lazy.

**Warum.** LCP ist die teuerste CWV-Metrik. Eager + High-Prio aufs Hero
bringt LCP um 500–1500 ms runter.

### P2.2 Swiper minimieren

**Was.** `swiper-bundle.min.js` (145 KB) + `swiper-bundle.min.css`
(23 KB) wo möglich durch CSS `scroll-snap-type: x mandatory` +
`scroll-snap-align: start` ersetzen. Restliche 20 % der Use-Cases
(echtes Touch-Drag mit Inertia, Pagination-Dots, etc.) ggf. mit
embla-carousel (~10 KB) ersetzen.

**Warum.** Browser-natives scroll-snap deckt 80 % der Summit-Carousel-
Use-Cases (Brand-Carousel, Product-Carousel, Galerien). Spart ~135 KB.

### P2.3 Photoswipe + Flatpickr auditieren

**Was.** Prüfen ob `photoswipe.min.js` (54 KB) und `flatpickr.js`
(50 KB) wirklich gebraucht werden. Native `<dialog>` deckt Lightbox ab;
`<input type="date">` reicht oft für Datepicker.

**Warum.** ~100 KB sparen wenn Native reicht.

**Risk.** Mittel — Flatpickr hat oft custom Date-Range-Logik. Wenn
nötig: behalten und nur lazy-load.

### P2.4 Preconnect-Typos fixen

**Was.** `layout/theme.liquid:14-15` — `https//` → `https://`.

**Warum.** 10 Sekunden Arbeit. Aktuell läuft jeder Pageload-First-Paint
ohne den `cdn.shopify.com`-Preconnect, weil die URL malformed ist.
Z.16 hat zufällig einen funktionierenden Fallback für fonts, aber
`cdn.shopify.com` läuft ins Leere.

---

## P3 — Wartbarkeit (~2 Wochen Refactoring)

### P3.1 `theme.css.liquid` auflösen

**Was.** Dynamische Werte aus `assets/theme.css.liquid` (269 KB) in
`<style>:root { --color-…: {{ settings.color }}; }</style>` im
`theme.liquid` `<head>` ausziehen. CSS-Datei wird statisch und cache-bar.

**Warum.** `.css.liquid`-Dateien werden bei JEDEM Request server-seitig
neu compiliert. 269 KB pro Pageload neu rendern statt einmalig CDN-cachen.

### P3.2 Slate-Globals entfernen

**Was.** `window.theme` und `window.slate` Namespaces eliminieren
sobald `theme.js` migriert ist. Section-Init läuft dann ausschließlich
über `customElements`-Lifecycle.

**Warum.** Globaler Namespace blockt Tree-Shaking und macht Hot-Reload
unzuverlässig. Vorbild: Dawn 14+.

### P3.3 Inline-Styles im `<head>` aufräumen

**Was.** `layout/theme.liquid:52-56, 69+` — auskommentierte CSS-Blöcke
löschen, Inline-Styles in statische CSS-Files überführen.

**Warum.** Code-Smell. Erschwert Code-Review + minimal Render-Tree-
Overhead.

### P3.4 Naming-Konsistenz

**Was.** `snippets/blogSidebar.liquid` → `snippets/blog-sidebar.liquid`
+ Sweep über alle Snippet-/Section-Files.

**Warum.** Mixed-case bricht case-sensitive Filesystems (Linux-CI) und
ist in Nitro's parse-theme inkonsistent gemapped.

---

## Aufwandschätzung

| Phase | Aufwand (1 Theme-Dev erfahren) | Erwarteter Lighthouse-Gain mobil |
|---|---|---|
| P1.1 theme.js → Vanilla + jQuery raus | 3–4 Wochen | 40 → 65 |
| P1.2 lazysizes raus | 2–3 Tage | +3 |
| P1.3 img_url → image_url | 1 Tag | +2 |
| P1.4 Mobile-Nav + Drawer-Sub-Menus no-JS-fähig | 2–3 Tage | a11y-relevant, kein direkter Lighthouse-Gain |
| P2 (Hero, Swiper, Photoswipe, Typos) | 1 Woche | 70 → 78 |
| P3 (Architektur-Cleanup) | 2 Wochen | 78 → 85 |
| **Total** | **6–8 Wochen** | **40 → 80–85** |

P1.4 ist Pflicht für die Theme-Store-Gate-Klausel und unabhängig vom
Performance-Track umsetzbar — kann parallel zu P1.1 laufen.

P1.1 ist der Hauptbrocken (3–4 Wochen für die theme.js-Migration). Aber
bounded — die Ziel-Architektur existiert bereits im Theme.

---

## Entscheidungs-Heuristik

**Bestehender Live-Shop mit Summit:** P1 nur wenn Mobile-Conversion
messbar leidet oder Google CWV-Penalty Sales drückt. Sonst Side-Quest
ohne Notfall-Charakter.

**Neukunde heute onboarden:** Summit als Basis-Theme ist nach P1
brauchbar. Aktueller Stand (mit Legacy-Layer) liefert ein veraltetes
Performance-Profil aus — nicht empfehlenswert ohne mindestens P1.1 +
P1.2 vorzuschalten.

**Nitro-Customer-App Output:** P1 ist Voraussetzung, bevor Nitro Summit-
Themes an End-Kunden ausliefert. Sonst landen die generierten Shops mit
Lighthouse 40 beim Kunden und Nitro's Wertversprechen („fertiger Shop
in 45 Sekunden") wird durch ein langsames Theme untergraben.

**Vergleich zu Shrine:** Summit nach P1-Cleanup ist Shrine vorzuziehen,
weil Shrine zwar Dawn-basierte Architektur hat, aber `main.js`
obfuskiert ausliefert (`a0_0x...`-Variablen, string-rotation IIFE).
Nicht wartbar für Nitro's Mapping- und Build-Pipeline. Summit ist
vollständig parsebar — auch unmodifiziert.
