# MAPPABILITY_CONTRACT.md — was ein Section macht, damit Summit es sauber mappt

**Zweck.** Dies ist die *Tool-Seite* der Section-Authoring-Konvention für das
Summit-Master-Theme (`winkelsdavid/summittheme`). Es beschreibt die Regeln, die
eine Shopify-Section erfüllen muss, damit **Summit Admin** sie **deterministisch
parst, klassifiziert und mappt** — ohne AI-Rätselraten und ohne manuelle
Operator-Nacharbeit.

Die Theme-Session liefert das Shopify-Handwerk (Liquid, Schema-Struktur,
Performance). Dieses Dokument liefert *was das Tool braucht*. Zusammen ergeben
sie die Section-Konvention. **Quelle der Wahrheit für die Klassifizierungs-
Mechanik ist der Code**, zitiert pro Regel — nicht dieses Dokument; bei Drift
gewinnt der Code.

> Geltung: **Summit v1.** Aktuelle Test-Mappings sind Wegwerf — das Theme wird
> vor Launch einmal sauber aufgebaut und komplett neu gemappt. Dieses Dokument
> ist zugleich der **Authoring-Standard für jede künftige Section**: wer ihm
> folgt, ist automatisch mappbar.

---

## 0. Das eine Prinzip: Identifier = Mapping-Oberfläche

Summit mappt auf den Pfad **`sec_<section-slug>:[block:<block-type>:]<setting-id>`**.
Das ist gleichzeitig Shopifys Maschinen-ID *und* Summits Mapping-Oberfläche —
**dasselbe Ding**. Daraus folgt die Zwei-Schichten-Trennung, die alles steuert:

| Schicht | Beispiele | Sieht Summit? | Rename nach Launch |
|---|---|---|---|
| **1 — Identifier** (Section-Slug, Setting-ID, Block-Type) | `hero-banner`, `heading`, `slide` | **JA** — das ist die Mapping-Fläche | **destruktiv** (live `settings_data.json` verwaist) |
| **2 — Implementierung** (JS, CSS, Liquid-Logik, jQuery, Perf, Dateistruktur) | `theme.js`, `theme.css.liquid` | **NEIN** | jederzeit, auch post-launch |

**Konsequenz:** Identifier sind *jetzt* gratis änderbar, *nach Launch* destruktiv —
und sind die **einzige** Schicht, die das Mapping betrifft. Sie haben ein
Ablaufdatum (Launch); die Implementierung nicht. Pre-Launch-Fenster gehört
komplett den Identifiern. (Implementierungs-Track = `SUMMIT_PATCH_REQUIREMENTS.md`
im Theme-Repo, läuft separat/später.)

---

## 1. Wie Summit ein Feld klassifiziert (die Mechanik, an der du dich ausrichtest)

`parse-theme` liest das `{% schema %}`, mappt den Shopify-Typ auf einen
Universal-Typ und legt eine `resource_field_definitions`-Row an. Dann sortiert
`classify-fields` jedes Feld in eine `mappingCategory` (pool / static / color_role
/ image_role / system / unmapped) — **die einfachen 60-80% deterministisch per
Heuristik**, der ambigue Rest geht in einen AI-Pass.

### 1a. Zwei Klassifizierungs-Regime

**Typ-getrieben** — bucketet automatisch, **egal wie kryptisch der Name**:
([`classify-fields/_shared/heuristic.ts`](supabase/functions/classify-fields/_shared/heuristic.ts), `switch (type)`)

| Shopify-Typ → Universal ([`shopifySchema.ts`](supabase/functions/parse-theme/_shared/shopifySchema.ts)) | Auto-Kategorie |
|---|---|
| `image_picker` → `image` | `image_role` |
| `video_url` → `url` | `image_role` (wenn Label Video-Keyword) sonst mappbarer Link |
| `color` → `color` | `color_role` |
| `range`/`number` → `number`, `checkbox` → `boolean` | `static` (nicht-mappbar) |
| `product`/`collection`/`collection_list` → `reference` | `system` (Shopify-managed, read-only) |
| `richtext` → `rich_text` | `pool` |

→ Für diese Typen ist Naming **zweitrangig** — der Typ rettet sie. `t_color`,
`st_color` mit `type:color` werden trotzdem korrekt `color_role`.

**Keyword-getrieben** — `text` und `textarea`. Hier **hängt alles am Namen**.
Das ist die **Content-Oberfläche** (Headings, Body, CTAs) und der einzige Ort,
wo Naming über deterministisch-vs-AI entscheidet:

- Label/ID matcht `CONTENT_KEYWORDS` → `pool` (mappbar, KI-Content)
- Label/ID matcht `DESIGN_KEYWORDS` (auch via Section-Name) → `static` (raus aus Mapping)
- Label/ID matcht `STATIC_KEYWORDS` (`note`/`instruction`/`hint`) → `static`
- Label/ID matcht `INTAKE_RULES` (`phone`/`email`/`address`/…) → Brand-Facts-Slot
- **matcht nichts → AI-Pass** (langsam, kostet, fehleranfällig)

Die aktuell wirksamen Keyword-Listen (verifizieren am Code, ändern sich):
```
CONTENT_KEYWORDS = heading, title, subtitle, subheading, tagline, description,
                   body, content, paragraph, caption, quote, cta, button, label
DESIGN_KEYWORDS  = size, width, height, padding, margin, spacing, radius, border,
                   opacity, shadow, gap, columns, rows, align, position, layout
STATIC_KEYWORDS  = note, instruction, hint
```

---

## 2. Die Regeln (der Contract)

| # | Regel | Warum (vom Tool aus) |
|---|---|---|
| **R1** | **Text-Content-IDs tragen ein `CONTENT_KEYWORD`**: `heading`, `subheading`, `body`, `description`, `button_label`, `quote` … | Heuristik → `pool`, kein AI-Pass |
| **R2** | **Text-Design/Config-IDs tragen ein `DESIGN_`/`STATIC_KEYWORD`**: `padding_top`, `columns`, `align_heading`, `note_*` | Heuristik → `static` → **aus der Mapping-Oberfläche raus** |
| **R3** | **Keine kryptischen Abkürzungen** bei Text-Settings: `des`→`description`, `r_type`→`review_type`, `t_color` (wenn `type:text`!)→`text_color` | Sonst matcht kein Keyword → AI rät |
| **R4** | **Section-Slug ist semantisch + kebab-case**: `hero-banner`, `featured-products` — nicht `advanced-content`, `custom_comparaison_table` (Tippfehler im Slug = Tippfehler in der Maschinen-ID) | Slug fließt in den Design-Check ein + disambiguiert das vielfach wiederholte `title` über Sections |
| **R5** | **Setting-IDs durchgängig snake_case, Slugs/Dateinamen durchgängig kebab-case** (Shopify-Best-Practice, kein Hack) | Mixed-case (`setwidth`, `align-heading` neben `padding_top`) bricht Keyword-Match + case-sensitive CI |
| **R6** | **Block-Types semantisch + konsistent** (`slide`, `item`, `column`) | Per-Instanz-Fan-Out + Overrides keyen auf `block:<type>` |
| **R7** | **`{% schema %}` statisch + Standard** — keine berechneten/dynamischen Setting-IDs, kein Tool-spezifisches Schema (`nitro_bind_*` ist **verboten**) | `parse-theme` liest das Literal; das Theme bleibt ein sauberes Standard-Shopify-Theme, das Tool liest den Standard |
| **R8** | **Echte Ressourcen-Settings sind getypt** (`type:product`/`collection`/`image_picker`/`video_url`), nicht als freier `text`-Link gebaut | Typ-getriebene Auto-Klassifizierung (system/image_role) statt Rateweg |
| **R9** | **`label` ist klar + rollenbenennend + via Übersetzungs-Key** (`"label": "t:sections.hero-banner.settings.heading.label"` → „Heading"), nicht kryptisch/leer/Doppel | (a) Das ist, was **Operator UND Customer im Shopify-Editor sehen** („was ist dieses Feld"); (b) der Classifier liest `label` mit, also hilft ein gutes Label auch der Auto-Klassifizierung; (c) die Summit-Admin-Mapping-UI zeigt primär das Label |

**Wichtigste Falle (R7):** „Tool zum Standard biegen" heißt **nicht** „Naming
schlampig lassen und das Tool zwingen". Es heißt: das Theme wird ein sauberes
konventionelles Shopify-Theme, und der Resolver liest diesen Standard. Mapping-
Eindeutigkeit ist der **Nebeneffekt sauberer Standards**, nicht Selbstzweck.

### `id` vs. `label` — Maschine vs. Mensch (zwei Namen, beide sauber)

Jedes Setting hat ZWEI Namen — bewusst trennen:

| | `id` (R1-R3) | `label` (R9) |
|---|---|---|
| Wofür | Maschinen-ID — Summits Klassifizierung + Mapping-Pfad (`sec_x:setting_id`) | Menschen-Text — Anzeige |
| Wer sieht es | das Tool (parse/classify/resolver) | **Operator + Customer im Shopify-Editor**; Operator in der Summit-Mapping-UI |
| Bei Live-Rename | **destruktiv** (Schicht 1) | gefahrlos (nur Anzeige) |

Beide müssen sauber sein, aber aus verschiedenen Gründen: **`id` sauber → Summit mappt automatisch richtig. `label` sauber → der Mensch versteht im Shopify-Editor sofort, was das Feld ist.** Der Classifier liest beide, also verstärken sie sich — aber „der Customer weiß im Editor, was welches Feld ist" kommt vom **`label`**, nicht von der `id`.

---

## 3. Content-vs-Design-Trennung — der Operator-Hebel

Das Theme hat ~1145 Setting-IDs. Die **allermeisten sind Design** (padding, color,
align, font-size) — die soll der Operator **nie** mappen (Marke/Design läuft über
`color_role` + Theme-Defaults). Die Mapping-Oberfläche ist die **~10% Content-
Settings** (heading, body, image, link).

Sauberes Naming sortiert diese Trennung **automatisch**:
- getypte Settings (color/number/image) → bucketen per Typ
- Text-Content (R1) → `pool`, sichtbar als Mapping-Ziel
- Text-Design (R2) → `static`, **unsichtbar** in der Mapping-UI

→ Ergebnis: der Operator sieht eine **vorsortierte ~10%-Content-Fläche** statt
1145 Felder. **Das** ist operator-freundlich. Kryptisches Naming kippt alles in
den AI-Pass → der Operator korrigiert ein Chaos.

---

## 4. Der „Summit-mappable Section"-Check

Eine Section erfüllt den Contract, wenn:

- [ ] Slug semantisch + kebab-case (R4)
- [ ] Alle Setting-IDs snake_case, keine Abkürzungen (R3, R5)
- [ ] Jedes **Text-Content**-Setting trägt ein `CONTENT_KEYWORD` (R1)
- [ ] Jedes **Text-Design/Config**-Setting trägt ein `DESIGN_`/`STATIC_KEYWORD` (R2)
- [ ] Ressourcen (Produkt/Collection/Bild/Video) sind **getypt**, nicht Text-Link (R8)
- [ ] Block-Types semantisch (R6)
- [ ] Jedes Setting hat ein **klares, rollenbenennendes `label`** via Übersetzungs-Key (R9) — der Mensch im Shopify-Editor versteht es ohne Raten
- [ ] `{% schema %}` statisch, kein `nitro_*`/Tool-Schema (R7)
- [ ] Section gehört zum **aktiven Satz** (siehe §5)

Gate: `node scripts/check-theme.mjs "<theme-zip>"` (läuft auf der Summit-Admin-
Seite gegen das Theme-ZIP). Re-parse + Mapping-Klassifizierung zeigen empirisch,
wie viele Felder deterministisch landen vs. in den AI-Pass fallen — das ist die
messbare Abnahme.

---

## 5. Aktiver Section-Satz — gemeinsame Entscheidung, nicht im Vakuum

Welche der 95 Sections geshippt werden, ist **keine reine Theme-Entscheidung**:
**Mapping-Oberfläche = Generierungs-Oberfläche.** Eine Section, die kein Prompt/
Pool befüllt, ist tote Mapping-Fläche; eine gelöschte Section, die ein Prompt
befüllt, generiert ins Leere.

→ Der aktive Satz wird **gemeinsam** bestimmt (Theme-Seite: was Brand/Theme-Store
braucht; Summit-Admin-Seite: welche Sections die Prompts/Pools tatsächlich
befüllen). Nicht-aktive Sections löschen = kleineres/schnelleres Theme + kleinere
Mapping-Fläche + weniger Rename-Aufwand. **Erst aktiven Satz bestimmen, dann nur
den sauber machen.**

---

## 6. Was der Contract NICHT verlangt

Schicht 2 ist dem Mapping egal — **nicht** Voraussetzung für sauberes Mapping:
jQuery-Rewrite, JS-Abspecken, `theme.css.liquid`-Auflösen, Lazyload, Swiper/
Photoswipe, Datei-Struktur. Das ist der Performance/Wartbarkeits-Track
(`SUMMIT_PATCH_REQUIREMENTS.md`), zählt fürs Theme-Store-Lighthouse-Ziel, läuft
separat/parallel/später — auch nach Launch. **Nicht** mit dem knappen
Pre-Launch-Identifier-Fenster vermischen.

---

## 7. Reihenfolge (woraus dieser Contract folgt)

1. **Konvention + aktiver-Satz-Audit** (Doc, kein Code) — dieser Contract + die
   Theme-Authoring-Konvention + die aktive-Section-Liste (§5).
2. **Identifier-Rename-Pass** über den aktiven Satz, gegen die Regeln §2.
3. **Mapping-Rebuild** gegen die sauberen IDs — Greenfield, pre-launch gefahrlos
   (kein Live-Store, Test-Mappings sind Wegwerf). `parse-theme`/Resolver-**Code**
   ändert sich nicht — nur die Mapping-**Daten** werden neu gebaut.
4. **Implementierungs-Track** — separat (Schicht 2), feeds Lighthouse.

---

*Dieses Dokument lebt im Summit-Admin-Repo, weil es Tool-Wissen ist
(`classify-fields` / `parse-theme` / Resolver). Die Theme-Session konsumiert es
als Eingabe — kein Duplikat ins Theme-Repo (Drift). Bei Änderung der
Klassifizierungs-Mechanik (Keyword-Listen, Typ-Mapping) hier nachziehen.*
