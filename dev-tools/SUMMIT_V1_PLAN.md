# SUMMIT_V1_PLAN.md — Master-Plan Pre-Launch

**Ziel.** Summit-Reference-Theme als sauberes, optimales **V1**: mappbar für den
Operator, klar für den Kunden, gut gelabelt, schnell. Pre-Launch, kein
Zeitdruck — daher wird **nichts übersprungen**, aber strikt nach Abhängigkeit
geordnet.

**Status.** Theme ist Online-Store-2.0-Fundament mit aufgesetztem
jQuery/Slate-Legacy-Layer + Schlamperei (messy gecodet). Cleanup, **kein
Rebuild** — die Ziel-Architektur (Web-Components, `global.js`) existiert schon.

**Quellen.** Identität/Mapping-Regeln → [`MAPPABILITY_CONTRACT.md`](MAPPABILITY_CONTRACT.md)
(R1–R9). Performance/Cleanup → [`SUMMIT_PATCH_REQUIREMENTS.md`](SUMMIT_PATCH_REQUIREMENTS.md)
(P1–P3). Gate → `node dev-tools/check-theme.mjs <zip>`.

**Stand (2026-06-15).** **Track A abgeschlossen** — Phase 0 ✓, Phase 1 (Identifier T0–T4) ✓,
Phase 2 (Labeling 2a+2b) ✓, Phase 3 (Parse + DB-Verifikation) ✓. Offen in Track A nur:
Operator-Mapping (Operator-Task, pre-launch) · **T5** Video-Resource-Typing (bewusst deferred)
· optional `Title→Heading` global. **Track B (Phasen 4–7) noch nicht gestartet** = der gesamte
verbleibende V1-Aufwand (Perf/a11y/CWV/jQuery-raus). HEAD: `bb15444`.

---

## Leitprinzip der Reihenfolge

```
Scope → Maschinen-ID → Mensch-Label → Mapping → Speed → Politur → Verifikation
```

Erst die Schicht, die **nach Launch destruktiv** wird (Identifier/Mapping →
verwaist live `settings_data.json`), dann die **gefahrlose** (Perf/Politur, auch
post-launch machbar). Alles, was IDs anfasst, passiert **vor** allem, was darauf
aufbaut.

**Zwei Tracks:**

| Track | Inhalt | Eigenschaft | Phasen |
|---|---|---|---|
| **A — Identität & Content** | Slugs, Setting-IDs, Block-Types, Labels, Mapping | **destruktiv-nach-Launch** → Pre-Launch-Fenster | 0–3 |
| **B — Implementierung** | jQuery raus, Perf, a11y, Wartbarkeit | **nicht-destruktiv**, jederzeit | 4–6 |

**Parallelisierung:** Phase **0.1** (aktiver Satz) ist der einzige globale
Blocker. Danach kann Track B (4→5→6) *neben* Track A (1→2→3) laufen — verschiedene
Schichten. Seriell gilt: **A vor B**, weil A das destruktive Fenster hat.

---

## Phase 0 — Scope & Sofort-Bugs · *Foundation, blockt alles*

- [x] **0.1 Aktiver Section-Satz festgelegt** (2026-06-15): **alle 98 Sections behalten,
  nichts droppen.** Begründung: Drop ist non-destruktiv und jederzeit nachholbar — kein
  Risiko, einen Summit-Generierungs-Target zu löschen. **Konsequenz:** Phase 1–2
  (Identifier + Label) laufen über den **vollen** Satz. Optionaler späterer Drop-Pass:
  siehe **Anhang A**.
- [x] **0.2 Harte Bugs killen:** — erledigt 2026-06-15
  - [x] invalides JSON in `sticky_video_section` (Trailing-Comma entfernt → Schema valide, 6 settings)
  - [x] Preconnect-Typos `layout/theme.liquid:14-15` (`https//` → `https://`)

*Warum zuerst:* Tote Sections aufräumen wäre Verschwendung; echte Bugs haben
kein Argument zu warten.

---

## Phase 1 — Identifier-Pass · *Track A, destruktiv* · R1–R8

**Entscheidung 2026-06-15:** Slug-/Dateinamen-Renames sind **in scope** (jetzt — einziges
gefahrloses Fenster, da nach Launch destruktiv).

**Vollständige Rename-Map:** [`RENAME_MAP.md`](RENAME_MAP.md) (96 Sections inventarisiert).
Anwendung **tier-weise** nach Risiko/Kopplung: **T0** JSON-Fixes + Label-Typos (null Risiko) →
**T1** Hyphen-ID-Bugfixes → **T2** geteilte „Heading-Family" (Snippet-koordiniert) →
**T3** per-Section Block-Types + lokale IDs → **T4** Slug-Renames + Reconcile →
**T5** Resource-Typing (`video`→`video_url`, separat/später).

**Status: abgeschlossen** (2026-06-15) über den vollen Satz, pro Section. Detail-Tracker:
[`RENAME_MAP.md`](RENAME_MAP.md). Tier-weise nach Risiko/Kopplung umgesetzt:

- [x] **T0** — 49 invalide Schemas repariert + Label-Typos + Trailing-Comma-JSON (`ead68bd`,`1ee4c3b`,`7848ffd`)
- [x] **T1** — Hyphen-ID-Bugfixes (timeline / pnewsletter / product-with-image) (`9458631`)
- [x] **T2** — geteilte „Heading-Family"-IDs, Snippet-koordiniert (`85569b5`)
- [x] **T3a** — geteilte Labels geklärt: `setwidth`-Label „Full Width"→„Section Width" (57×),
  „HTML / Description"→„Description" (38×) (`047701a`)
- [x] **T3b** — 44 kryptische Content-IDs → keyword-tragend (→ `pool` statt AI-Pass), Saved-Werte
  migriert, 0 Kollisionen (`5936c56`); + Block-`text`→`content`-Gap in 4 Sections (`614b1bd`)
- [x] **T3c** — 18 Block-Types → semantisch snake_case (`Item`→`slide`, `first_row`→`column_1`…),
  82 Instanzen structure-aware migriert; revert + korrekt neu angewandt, **auf Frisch-Install
  verifiziert** (`fabce3a`). Lektion: Shopify droppt Blocks **nicht** bei Type-Rename — die App
  muss beim Theme-Update nur die Saved-Daten mit-migrieren (Frisch-Install ist atomar).
- [x] **T4** — 24 Section-Slugs → semantisch kebab-case + alle Ref-Updates (`48f9cbc`)
- [x] **product-template-1 + header** — verbleibende statische Content-IDs keyword-tragend (`dcd1e66`,`4df8156`,`64c9160`)
- [x] **Konsumenten mitgezogen:** Liquid-Refs (`{% when %}`, `section/block.settings.x`),
  `settings_data.json`, `templates/*.json`, Section-Groups — alles reconciled, JSON strict-valid
- [ ] **T5 deferred** — Resource-Typing (`video`→`video_url`, R8): fragiler Type-Change
  (MP4-CDN-URLs werden abgelehnt, manche Felder rendern via `video_tag`), moderater Mapping-Wert.
  Non-destruktiv genug für später.

*Warum hier:* nach Launch destruktiv; Labels und Mapping keyen auf stabile IDs. **In der DB
verifiziert** (Phase 3): Paths = Contract R1, keine Alt-IDs.

---

## Phase 2 — Labeling · *Track A, Mensch* · R9

**Entscheidung 2026-06-15:** Editor-Labels bleiben **sauberes, klares Hardcoded-Englisch**
(rollenbenennend) — **keine** `t:`-Key-Migration, **keine** `*.schema.json`-Files.
*Begründung:* Storefront/Kunde ist über die **10 bestehenden `locales/*.json`** +
Shopify-Content-Translation bereits mehrsprachig; `t:`-Keys würden nur die *Editor*-Seite
lokalisieren (6853 Labels × 10 ≈ 68k Strings) — kein V1-Mehrwert. R9 wird über **klare
Labels** erfüllt, nicht über den Key-Mechanismus.

- [x] **Konvention festgelegt** (2026-06-15): Variante A — Title Case überall →
  [`LABEL_STYLEGUIDE.md`](LABEL_STYLEGUIDE.md). Auslöser: DB-Parse zeigte gemischtes Casing
  („Featured products" vs „Product Content") + 3 Label-Kollisionen.
- [x] **2a Maschinell** (`commit bdc916a`): 1531 Labels auf Title Case (`_labelpass.py`,
  Akronyme/Eigennamen/Einheiten erhalten, Trailing-Spaces getrimmt).
- [x] **2b Targeted Semantik** (`commit ad05f98`): 348 Änderungen — „Sub Title"→„Subtitle",
  Verb-Drop (Select/Choose), „Align X"→„X Alignment", kryptisch→klar („Background Section"→
  „Background Color", Overlay-Labels via id/type verifiziert), Typo „Midle"→„Middle".
- [x] **3 Label-Kollisionen** vorab gefixt (`commit f82c70a`): Header/Footer/Product Grid eindeutig.
- [ ] *Bewusst ausgelassen (targeted scope):* `Title`→`Heading` global (287, „Title" meist korrekt);
  exhaustives Durchwortern jedes Labels. Non-destruktiv, jederzeit nachholbar.

*Warum hier:* „aufgeräumt für Operator (Summit-UI & Shopify-Editor)". Hängt an stabilen
IDs aus Phase 1.

---

## Phase 3 — Mapping-Rebuild · *Summit-Admin-Seite, Greenfield*

- [x] **Theme geparst** → `summitthemd` v1 in Summit/Nitro-DB: **92 Sections / 3165 Felder**
  (5 System-Sections korrekt übersprungen = 0 Settings; kein Datenverlust).
- [x] **DB-Verifikation der Identität-Schicht** (2026-06-15, read-only via Management API):
  Renames 1:1 in der DB — Slug `sec_announcement_bar_slide`, Block-Type `slide`, Feld
  `block:slide:content`; Path-Format = Contract R1; keine Alt-IDs. Auto-Klassifizierung:
  11 `color_role` aus der Brand-Palette (`color_primary`→primary …) — semantische Color-IDs
  greifen. **3 Label-Kollisionen** gefunden → gefixt (`f82c70a`).
- [ ] **Operator-Mapping** auf die sauberen IDs (aktuell `completeness=0%`, alles `unmapped` —
  korrekt: Operator-Task, pre-launch gefahrlos).
- [ ] **Finale ROI-Messung:** % deterministisch (pool/role/static) vs. AI-Pass — materialisiert
  erst nach dem Mapping. Strukturelle Fläche schon vermessen: **~52 %** Config (number/select/
  boolean) · **~20 %** Text (Pool-Kandidaten) · **~19 %** Color · **~5 %** Media · ~4 % Refs.

*Warum hier:* validiert die Identität-Schicht; muss vor Launch stehen. Strukturell bestätigt,
Mapping-Coverage offen.

---

## Phase 4 — Gate-Pflicht: JS-off-Nav + a11y · *Track B, Kunde, binär* · P1.4 + Lücke

- [ ] **Mobile-Burger** (`snippets/button-toggle-menu-mobile.liquid`) →
  `<details>/<summary>` oder Checkbox-Hack (no-JS bedienbar)
- [ ] **Drawer-Sub-Menüs** (`snippets/drawer-nav.liquid:17`, Bootstrap
  `data-toggle="collapse"`) → `<details>/<summary>`
- [ ] a11y-Web-Component (focus-trap, ESC, aria-expanded) on-top, ohne No-JS-Pfad zu brechen
- [ ] **a11y-Audit → Score ≥ 90** (Kontrast, Labels, Fokus-Reihenfolge,
  Alt-Texte) — zweite Gate-Achse, die das Patch-Doc nicht abdeckt

*Warum hier:* binäres Theme-Store-Gate-Pass/Fail, kundenseitig, billig (Tage),
unabhängig vom Perf-Brocken. Kann sofort nach Phase 0 parallel starten.

---

## Phase 5 — Performance-Kern · *Track B, Speed* · P1.1–1.3

- [ ] **`theme.js` (203 KB, 558 `$(`) → Vanilla** migrieren (Web-Components /
  `global.js` als Landeplatz)
- [ ] **jQuery (85 KB) + vendor.js (348 KB) raus** (−~440 KB initial JS),
  Tag `snippets/header-js.liquid:104` entfernen
- [ ] **`lazysizes` (26 KB) raus** → native `loading="lazy"` + `decoding="async"`;
  `bgset` via IntersectionObserver
- [ ] **`img_url` → `image_url`** (129 Treffer / 50 Files)

*Warum hier:* größter Speed-Hebel (~50 % Lighthouse-Gain), mapping-neutral.
Hauptbrocken (3–4 Wo), aber bounded.

---

## Phase 6 — CWV + Wartbarkeit · *Track B, Politur* · P2 + P3

- [ ] Hero `loading="eager"` + `fetchpriority="high"` (LCP)
- [ ] Swiper (142+22 KB) → CSS `scroll-snap` wo möglich (−~135 KB), Rest ggf. embla
- [ ] Photoswipe (52 KB) / Flatpickr (49 KB) auf Native (`<dialog>` / `<input type=date>`) prüfen
- [ ] `theme.css.liquid` (281 KB, pro Request kompiliert) → statisch + `:root`-Vars
- [ ] Slate-Globals (`window.theme` / `window.slate`) raus
- [ ] Inline-/auskommentiertes CSS im `<head>` (`theme.liquid:52-56, 69+`) weg
- [ ] **Filename-Sweep** kebab-case (`blogSidebar` → `blog-sidebar`, …) — geteilt mit R5

---

## Phase 7 — Final-Verifikation / Gate

- [ ] `node dev-tools/check-theme.mjs <zip>` grün
- [ ] Lighthouse-Schnitt (Home / Collection / Product × Desktop + Mobile) ≥ 60 (Ziel 80+)
- [ ] a11y-Score ≥ 90
- [ ] JS-off: Navigation + Produktformular manuell ✓
- [ ] Re-parse: Mapping-Coverage stabil, AI-Pass minimal

---

## Definition of Done (V1)

- [~] Aktiver Satz **sauber gemappt** — IDs/Labels parse-verifiziert ✓; Operator-Mapping +
  finale ROI-Messung (vorsortierte Content-Fläche, minimaler AI-Pass) noch offen
- [x] Alle Labels **klar** (2a Title Case + 2b Semantik) — i18n über `locales/*.json` (Storefront)
- [ ] **Gate bestanden:** Perf ≥ 60 (Ziel 80+) · a11y ≥ 90 · JS-off ✓ — *Track B, offen*
- [ ] **Kein jQuery / Legacy-Ballast** mehr im initialen Load — *Track B, offen*

---

## Anhang A — Optionaler Drop-Pass (nach dem Cleanup, non-destruktiv)

Entscheidung 2026-06-15: **nichts droppen, alles behalten.** Diese Liste bleibt nur als
Referenz für einen optionalen späteren Aufräum-Pass (z. B. wenn das Mapping empirisch
zeigt, welche Sections tote Fläche sind). Drop = Datei löschen + Refs aus
`settings_data.json` / `locales` ziehen. Stand des Scans: committed Repo (Source of Truth).
⚠️ **Slug-Namen unten sind pre-T4** (vor den Slug-Renames `48f9cbc`, z. B. `custom_comparaison`,
`tab-infor`, `new-faq`) — vor einem echten Drop-Pass neu scannen.

**Aktuell nicht platzierte Sections** (orphan, alle mit `presets` → im Editor wählbar, nur
nirgends eingesetzt):
`areviews-section`, `count-down`, `custom-bundle-section`, `custom_shoppable_video`,
`featured-articles-2`, `featured-collections-1`, `featured-collections-4`,
`featured-collections-5`, `instagram`, `product-list`, `product-tab-2`,
`product-with-image`, `product-wrap-banner`, `quotes-square`, `reviews-slider`,
`shop-the-look`, `tab-infor`, `tab-vertical`.

**Shopify-funktional** (orphan, aber NICHT droppen — von Shopify/JS gerendert):
`apps`, `predictive-search`, `pickup-availability`.

**Konsolidierungs-Kandidaten** (platziert, aber redundant): Testimonials laufen über 4
aktive Sections (`custom-reviews`, `custom_reviews_marquee`, `quotes`, `quotes-special`)
+ 3 orphans → ggf. später auf 1–2 reduzieren. `slideshow-1/2/3` → ggf. zu einer Section
mit Settings zusammenziehen.
