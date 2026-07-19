# B1-Bild-Fallback-Verdrahtung — Voll-Audit (THEME-Briefing #68)

**Stand:** 2026-07-19, Code-Stand `4f09d9e` · **Modus: NUR AUDIT — keine Fixes.**
**Datenbasis:** 57 Sektionen mit 158 image_picker/video-Settings (Schema-Parse),
Verdrahtungs-Scan (brand-image / brand-image-src / brand-video / placeholder je
Render-Zweig), **44 section_fallback-Handles live aus dem Store gelesen**
(GraphQL, read-only; alle ACTIVE, alle mit image_1..12 + pool_size).

Statuslegende:
- **VOLL** = jeder Render-Zweig hat den B1-Fallback; **Code✓/Daten✗** = Theme
  verdrahtet, aber der Handle existiert im Store NICHT (Summit-Pipeline-Task,
  kein Theme-Edit); **TEILW** = nur ein Teil der Zweige/Picker; **NICHT** =
  kein Fallback; **BEWUSST** = begründet ohne; **UNGENUTZT** = Setting wird
  nirgends gerendert (toter Schema-Ballast).

## Tabelle (Auftrag 1+2)

| Datei | Setting (Pfad) | Render-Pfad | Status | Handle? | Fix-Vorschlag | Aufwand |
|---|---|---|---|---|---|---|
| advanced-content | section.image_bg | bgset (BG) | NICHT | ✗ (`advanced-content`) | brand-image-src + Handle pushen | S |
| advanced-content | block image.image / promo.image / video.cover_image | img | Code✓/Daten✗ | ✗ (`--image/--promo/--video`) | Handles pushen | Daten |
| announcement-bar-slide | block slide.image (Swiper-Zweig) | img | Code✓/Daten✗ | ✗ (`--slide`) | Handle pushen | Daten |
| announcement-bar-slide | block slide.image (statischer 2. Zweig Z143ff) | img | TEILW | ✗ | else-Zweig nachziehen (Muster Zweig 1) | S |
| background-video | block image.image | img | Code✓/Daten✗ | ✗ (`--image`) | Handle pushen | Daten |
| background-video | section.video | video | BEWUSST | – | Video-Slot = v1-Kontraktlücke (s. Auftrag 3) | – |
| before-after | section.image (Slot 1) + image2 (Slot 2) | img | VOLL | ✓ | – (Muster für Sekundär-Picker via Slots!) | – |
| count-down | section.image_bg (BEIDE Zweige bg_full/inline) | bgset (BG) | **NICHT** | **✓** | brand-image-src, Slot 1, je Zweig | S |
| custom-comparison-table | block table.image | img | VOLL (seit #68/4f09d9e) | ✓ | – | – |
| custom-comparison-table | block heading.icon_1..icon_10 | – | UNGENUTZT | – | Schema-Ballast, nichts tun | – |
| custom-image-bullets | section.image | img | VOLL | ✓ | – | – |
| custom-images-tabs | block tab.image | img | VOLL | ✓ | – | – |
| custom-images-tabs | block tab.icon | img (Tab-Icon) | NICHT | – | Sekundär-Picker → Kontrakt (Auftrag 3) | M |
| custom-instagram-marquee | video, main_image, column_1..4.image | video/img | VOLL | ✓ (5 Handles) | – | – |
| custom-progress-bars | block image.image | img | VOLL | ✓ | – | – |
| custom-reviews | block review.image | img | VOLL | ✓ | – | – |
| custom-shoppable-video | block product.video | video | NICHT | ✗ | Video-Kontrakt (brand-video) + Handle | M |
| faq-accordion | section.image_right (Slot 2) | img | VOLL | ✓ (`faq-accordion`) | – | – |
| faq-accordion | section.image_bg | bgset (BG) | **NICHT** | **✓** | brand-image-src, Slot 1 | S |
| faq-advanced | section.team_image (beide Zweige) | img | VOLL | ✓ | – | – |
| featured-articles / blog-* | – (Blog-Bilder = article.image) | img | BEWUSST | – | CMS-Daten, kein Settings-Slot | – |
| featured-collections-1 | block collection.image | img (via collection-grid-item) | NICHT | ✗ | Snippet-Param-Route (Muster quote-style: b1_handle/b1_position durchreichen) | M |
| featured-collections-3 | block collection.image | img (via collection-grid-item) | NICHT | ✗ | wie fc-1 | M |
| featured-collections-4 | block item_collection.image | data-bgset (BG) | **NICHT** | **✓** | brand-image-src im else-Ast (img_url='') | S |
| featured-collections-5 | block collection.image | img (via collection-grid-item) | NICHT | ✗ | wie fc-1 | M |
| footer | block text.logofooter | img (Logo) | VOLL | ✓ (`footer--text`, logo_fallback) | – | – |
| footer | section.image_bg | img (Footer-Banner) | NICHT | ✓ (`footer`) | brand-image, Slot nach Schema-Reihenfolge prüfen | S |
| footer | section.imgpayment | img (Payment-Icons) | BEWUSST | – | Operator-spezifisch (Zahlarten) | – |
| gallery | block photo.image | img | Code✓/Daten✗ | ✗ (`gallery--photo`) | Handle pushen | Daten |
| grid-banner | block banner.image | img | VOLL | ✓ | – | – |
| grid-banner | block banner.image_mobile / video | img/video | BEWUSST | – | Mobile-Override optional; Desktop-Bild fällt durch | – |
| header | section.logo (via snippets/site-logo) | img | VOLL | ✓ (`header`, Slot 1, logo_fallback) | – | – |
| header | section.logo_white | img | VOLL (seit Nachtrag 19.07.) | ✓ (`header`, Slot 2 — Summit-Klärung: Section-Level hat genau 2 Picker) | – (KORRIGIERT: kein Welle-4-Fall) | – |
| header | menu_banner_image_1..6 (2 Blocktypen) | – | UNGENUTZT | – | wird nirgends gerendert | – |
| header | block level_1.image_menu_lv1 / level_2.image_menu_lv2 (slide-menu-Banner) | img | Code✓/Daten✗ (seit Nachtrag 19.07.) | ✗ (`header--level_1` / `header--level_2`) | Handles pushen (Position = Nter Block des Typs) | Daten |
| header | block option-sidebar.sidebar_image_1..6 | – | UNGENUTZT | – | KORREKTUR zur Summit-Klärung: rendert nirgends (wie menu_banner) — kein Handle nötig, sidebar_image_2..6 auch KEIN Welle-4-Fall | – |
| icon-list | block icon_item.image_icon (beide Zweige) | img | VOLL | ✓ | – | – |
| image-auto-slider | block video.image (Poster) | img | VOLL | ✓ (`--video`) | – | – |
| image-auto-slider | block video.video | video | BEWUSST | – | Bild-Fallback deckt den Slot | – |
| image-video-with-text | block image_block.image | img | VOLL | ✓ | – | – |
| image-video-with-text | block image_block.image2 | img | NICHT | – | Sekundär-Picker → Kontrakt | M |
| image-with-icons | section_image, video, text_icon.icon_image | img/video | VOLL | ✓ (2 Handles) | – | – |
| image-with-text | block image_block.image | img | VOLL | ✓ | – | – |
| instagram-customize | block image.image | img | VOLL | ✓ (`--image`) | – | – |
| instagram-customize | block video.image_poster (+video) | video+poster | Code✓/Daten✗ | ✗ (`--video`) | Handle pushen | Daten |
| logo-carousel | block logo.image (via logo-carousel-item) | img | NICHT | ✗ | Prio niedrig (Marken-Logos) | S |
| logo-list | block logo.image | img | NICHT | ✗ | Prio niedrig (Marken-Logos) | S |
| main-404 | section.image_404 | img | Code✓/Daten✗ | ✗ (`main-404`) | Handle pushen | Daten |
| main-collection-banner | section.img_bannercollection | img | Code✓/Daten✗ | ✗ | Handle pushen | Daten |
| main-login | section.image | img | Code✓/Daten✗ | ✗ | Handle pushen | Daten |
| map | section.background_image | bgset (BG) | NICHT | ✗ | Prio niedrig (hinter Karte) | S |
| newsletter | section.image_bg | BG (style/src) | VOLL | ✓ | – | – |
| password-header | image_password (src) + logo | BG+img | Code✓/Daten✗ | ✗ (`password-header`) | Handle pushen | Daten |
| product-list-swiper | image_bg (Slot 1, src) + image_banner (Slot 2) | BG+img | Code✓/Daten✗ | ✗ (`product-list-swiper`) | Handle pushen | Daten |
| product-tab-split | block collection.image (BEIDE Zweige mit/ohne Kollektion) | img | **NICHT** | **✓** (`--collection`) | brand-image, position je table-Zähler, beide Zweige | S |
| product-template-1 | review_images/custom_review/banner (metafield+B1) | img | VOLL | ✓ (4 Handles) | – | – |
| product-template-1 | block videos.video_1..4, buttons.tier_*_image | – | UNGENUTZT | – | prüfen ob Block-Feature tot | – |
| product-template-1 | Icon-Picker (icon_1/2, promo.icon, salepoint, tabcustom, …) | img (Icons) | BEWUSST | – | dekorativ, SVG-Default vorhanden | – |
| product-template-1 | block trust-badge.image | img | BEWUSST | – | Operator-Trust-Logos | – |
| product-with-image | block banner.image | img | VOLL | ✓ | – | – |
| product-wrap-banner | section.image_banner | img | VOLL | ✓ | – | – |
| quotes / quotes-square / quotes-split | block quote.avatar | img (via quote-style-1/2/3, b1_handle-Param) | VOLL | ✓ (3 Handles) | – | – |
| quotes / quotes-square | section.image_bg | BG (style+bgset) | NICHT | ✗ (Section-Handles) | brand-image-src + Handles | S |
| reviews-slider | block review.image | img | VOLL | ✓ | – | – |
| rich-text | block image.image | img | VOLL | ✓ | – | – |
| scratch-newsletter | popup_image (Slot 1) + logo_image (Slot 2, logo_fallback) | img | VOLL | ✓ | (Scanner-Hinweis: `s.`-Alias) | – |
| scrolling-text | block scroll_item.image | img | VOLL | ✓ | – | – |
| shop-the-look | section.image | img | Code✓/Daten✗ | ✗ (`shop-the-look`) | Handle pushen | Daten |
| slideshow-1 | block slide.image (leer UND image_mobile leer ⇒ B1) | img | VOLL | ✓ | – | – |
| slideshow-1 | block slide.image2 (Split), image_mobile, video, c_icon_1..3 | img/video | BEWUSST/UNGENUTZT | – | image2 = Sekundär (Kontrakt); icons ungenutzt | – |
| slideshow-2 | block slide.image (src-Route) | BG | VOLL | ✓ | – | – |
| slideshow-2 | Code liest `image_mobile`, Schema hat es nicht | – | Randnotiz | – | totes Code-Read, harmlos | – |
| sticky-video-product | section.video (direkter metaobjects-Read `video_1`) | video | Code✓/Daten✗ | ✗ (`sticky-video-product`) | Eintrag pushen (Video-Feld!) | Daten |
| tab-information | block tab.image | img | VOLL | ✓ | – | – |
| tab-vertical | block tab.image | img | VOLL | ✓ | – | – |
| tab-vertical | block tab.image2 | img | **NICHT** | – | Sekundär-Picker → Kontrakt (Auftrag 3, Seed 5) | M |
| tab-vertical | section.image_bg | bgset (BG) | NICHT | ✗ (Section-Handle) | brand-image-src + Handle | S |
| tab-vertical | block tab.video | video | BEWUSST | – | Bild-Fallback deckt den Slot | – |
| team-member | block member.image | img | Code✓/Daten✗ | ✗ (`team-member--member`) | Handle pushen | Daten |
| timeline | block milestone.image | – | UNGENUTZT | – | Sektion ohnehin aus Presets entfernt | – |
| video | section.cover_image (Slot 1) | img | Code✓/Daten✗ | ✗ (`video`) | Handle pushen | Daten |

## Zusammenfassung

- **VOLL (Code + Daten): 28 Slot-Gruppen** — der Kernbestand (alle Reviews/
  Quotes/Tabs/Banner-Hauptslots, beide Slideshows, Header-/Footer-Logo,
  Newsletter, Scratch, Marquee, Comparison seit #68).
- **Code ✓ / Daten ✗ (NUR Summit-Push nötig, kein Theme-Edit): 15 Handles** —
  advanced-content(×4 inkl. Section-BG-Handle), announcement-bar-slide,
  background-video--image, gallery--photo, instagram-customize--video,
  main-404, main-collection-banner, main-login, password-header,
  product-list-swiper, shop-the-look, sticky-video-product (Video-Feld!),
  team-member--member, video.
- **NICHT verdrahtet mit VORHANDENEM Handle (sichtbarste Theme-Fixes): 5** —
  product-tab-split (beide Zweige), count-down (beide Zweige),
  featured-collections-4 (bgset), faq-accordion image_bg, footer image_bg.
- **NICHT verdrahtet ohne Handle (Code+Daten): 8** — featured-collections-1/3/5
  (Snippet-Route), quotes/quotes-square image_bg, tab-vertical image_bg, map,
  logo-list/logo-carousel (Prio niedrig), custom-shoppable-video (Video),
  announcement-bar Zweig 2, header slide-menu-Bilder (Slot-Klärung).
- **Sekundäre Picker (Kontraktlücke, Auftrag 3): 6 aktive Fälle** + Slideshow-
  Ausnahmen. **BEWUSST ohne: 12** (Icons, Payment, Mobile-Overrides, optionale
  Videos mit Bild-Fallback). **UNGENUTZT: ~30 Settings** (comparison icon_1-10,
  header menu_banner ×9, pt1 videos/tier, slideshow c_icons, timeline).

## Priorisierte Fix-Reihenfolge (nach Freigabe, in Wellen)

1. **Welle 1 — Theme-Fixes, Handle liegt bereit (S, sofort sichtbar):**
   product-tab-split (Briefing-Seed 1) → count-down (Seed 3) →
   featured-collections-4 (Seed 4) → faq-accordion image_bg → footer image_bg.
2. **Welle 2 — reine Daten (Summit-Pipeline, kein Theme-Edit):** die 15
   fehlenden Handles pushen; sticky-video-product braucht als einziger ein
   VIDEO-Feld (video_1) statt image_*.
3. **Welle 3 — Code + Daten:** featured-collections-1/3/5 über
   collection-grid-item (Param-Route nach dem quote-style-Muster: b1_handle +
   b1_position durchreichen — EIN Snippet-Edit deckt 3 Sektionen),
   announcement-bar Zweig 2, quotes/quotes-square/tab-vertical image_bg,
   header slide-menu-Bilder (Slot-Zuordnung mit Summit klären), map/logo-*.
4. **Welle 4 — Kontrakt-Erweiterung sekundäre Picker** (erst nach Abstimmung,
   s. u.).

## Auftrag 3 — Kontraktlücke „sekundäre Picker" (NUR dokumentiert)

Block-Typen mit ≥2 image_pickern, deren Nicht-Primär-Picker im v1-Kontrakt
keinen Datenslot haben:

| Block | Primär (gedeckt) | Sekundär (ungedeckt) |
|---|---|---|
| tab-vertical `tab` | image | **image2** (kleines Zweitbild) |
| image-video-with-text `image_block` | image | **image2** |
| custom-images-tabs `tab` | image | **icon** |
| ~~header (Section-Level): logo_white~~ | — | GESTRICHEN 19.07.: logo_white = Slot 2 im header-Handle, verdrahtet |
| slideshow-1 `slide` | image | image2 (Split), image_mobile — als bewusste Operator-Overrides vertretbar |
| grid-banner `banner` | image | image_mobile — bewusster Override |
| instagram-customize `video` | image_poster (via `--video`) | – (video-file selbst = Video-Kontrakt) |

**Skizze Kontrakt-Erweiterung (Abstimmung über David, Summit schreibt die
Metaobjects):**
- **Variante A (empfohlen):** zusätzliche Handles
  `<basename>--<block.type>--<setting_id>` (z. B. `tab-vertical--tab--image2`,
  `custom-images-tabs--tab--icon`, `header--logo_white`) mit denselben Feldern
  image_1..N + pool_size. Vorteil: Position-Semantik bleibt exakt die des
  Blocks; kein Umbau bestehender Handles; brand-image kann unverändert benutzt
  werden. Nachteil: mehr Handles.
- **Variante B:** Sekundär-Picker als weitere Slots im bestehenden
  Block-Handle (image_1..N = primär, image_N+1.. = sekundär). Nachteil:
  Slot-Arithmetik im Theme (pool_size-Versatz), fehleranfällig bei
  Pool-Änderungen — nicht empfohlen.
- Für **Video-Slots** (background-video, custom-shoppable-video,
  sticky-video-product als Präzedenz): Felder `video_1..N` im selben Handle +
  Konsum über brand-video bzw. direkten metaobjects-Read (Muster
  sticky-video-product).

## Scanner-Hinweise (für künftige Audits)

- `{{ }}`-Interpolationen enthalten `}` — nie naive Klammer-Extraktion.
- Alias-Assigns (`assign s = section.settings`, quotes-Familie `b1_handle`-
  Param, scratch-newsletter `s.`) machen reine settings.<id>-Greps blind —
  Snippet-Parameter-Routen immer mitprüfen.
- Dieselbe Setting-ID rendert in mehreren Zweigen (Desktop/Mobile, mit/ohne
  Kollektion, Swiper/statisch) — jeder Zweig zählt einzeln.
