# RENAME_MAP.md — Phase 1 Identifier-Pass (Vorschlag, zum Abnicken)

Inventur aller 96 Sections gegen die gelockten Konventionen (R1–R9, hardcoded-EN
Labels, Slug-Renames in scope). Stand 2026-06-15. **Nichts ist hier schon
angewandt** — das ist die Review-Vorlage. Anwenden erfolgt tier-weise (siehe
Strategie), jede Section zieht ihre Konsumenten mit (Liquid-Refs, `settings_data.json`,
`templates/*.json`, Section-Groups, geteilte Snippets).

---

## Wichtigste strukturelle Funde (bestimmen die Reihenfolge)

1. **Geteilte Snippets koppeln viele Sections.** `snippets/section-heading.liquid`,
   `style-section.liquid`, `rating-custom.liquid` und `quote-style-*.liquid` lesen
   `des`, `title_top`, `r_type`, `align-heading`, `st_color`, `t_color`, `c_color`,
   `replace_reviews` aus ~25 Sections. **Diese IDs kann man nicht pro-Section
   umbenennen** — nur einmal im Snippet + in allen Konsumenten gemeinsam. → eigener
   koordinierter Pass (Tier 2).
2. **Invalides JSON (Trailing-Commas) ist weit verbreitet** (rule#6) — meist aus dem
   geteilten `replace_reviews`/`paragraph`-Boilerplate. ~25 Sections betroffen. Shopify
   toleriert es, **strenges `JSON.parse` (Summit parse-theme) bricht**. → mechanischer
   Safe-Fix zuerst (Tier 0).
3. **Tippfehler-Labels sind global dupliziert:** „Zoom Out **Feft**" (≈ jede Section),
   „**Feaf**"→Leaf (product-template-1, slideshow-1/2), „Comapre", „Descripion",
   „copryright", „addess", „Midle", „truspilot", „Cricle", „Litmit", „newletter",
   „Botton". → globaler Find-Replace (Tier 0).
4. **Hyphen-IDs sind teils LIVE-BUGS:** `button-text`, `caption-bg` (timeline),
   `pnew-width/height` (pnewsletter), `bg-overlay/bg-opacity` (product-with-image),
   `align-heading` (fleet) — Liquid liest `settings.button-text` als Subtraktion.
   Snake_case-Rename **fixt echte Bugs** (Tier 1).
5. **Resource-Typing (rule#5):** ~13 Sections halten Video-URLs als `text`/`textarea`
   statt `video_url`. Retyping ändert den Rückgabewert (String→Objekt) → braucht
   Liquid-Anpassung + ggf. Daten-Migration. → letzter, separater Tier (Tier 5).
6. **Schema-lose Sections** (main-order, main-wishlist, pickup-availability,
   predictive-search) haben **kein `{% schema %}`** → keine Mapping-Fläche, keep.
7. **App-eigene IDs** (areviews-section, apps) — App-Contract, vorsichtig / bestätigen.

---

## Ausführungs-Strategie (Tiers nach Risiko/Kopplung)

| Tier | Inhalt | Risiko | Mapping-Impact |
|---|---|---|---|
| **0** | Trailing-Commas fixen + alle Label-Typos/-Klarheit (inkl. „Full Width"→„Section Width") | **null** | keiner (nur Labels/JSON) |
| **1** | Hyphen-ID-Bugs → snake_case (`button-text`, `caption-bg`, `pnew-*`, `bg-*`, `align-heading`) | niedrig | fixt Bugs + IDs |
| **2** | Geteilte „Heading-Family"-IDs (`des`→`description`, `title_top`→`subtitle_top`, `r_type`→`reviews_type`, `st/t/c_color`) — Snippet + alle Konsumenten gemeinsam | mittel (koordiniert) | groß, einmalig |
| **3** | Per-Section lokale IDs + Block-Types (`code`→`content`, `Item`→`slide`, …) | niedrig–mittel | section-lokal |
| **4** | Slug/Dateinamen-Renames + Family-Reconcile + Ref-Updates | mittel | Slug = Mapping-Fläche |
| **5** | Resource-Typing (`text`→`video_url`) + Daten-Migration | höher | + Liquid-Logik |

> Tier 0–1 sind sofort gefahrlos und liefern sofort sichtbaren Operator/Kunde-Nutzen.
> Tier 2 ist der koordinierte Hauptbrocken. Tier 4 braucht die Reconcile-Entscheidungen
> unten. Tier 5 ist effektiv schon Schicht-2-Arbeit (Liquid-Logik) — kann auch später.

### Fortschritt
- [x] **T0 — erledigt 2026-06-15.** 69 Sections geändert: **49 invalide JSON-Schemas →
  valide** (string-bewusster Trailing-Comma-Stripper, mit `JSON.parse`-Check pro Datei),
  66× „Zoom Out Feft"→„Zoom Out Left", 17× „Feaf"→„Leaf", „Dot,Line"→„Separator style".
  **0 invalide Schemas übrig.** „Full Width"/„HTML / Description" bewusst nach T2/T3
  verschoben (Kollisionsgefahr Options- vs. Feld-Label).
- [x] **T1 — erledigt 2026-06-15.** Hyphen-IDs → snake_case in 3 Sections (+ Schema-IDs,
  Liquid-Refs, gespeicherte Werte in settings_data.json/page.timeline.json mitgezogen).
  `timeline`: `button-text`→`button_text`, `caption-bg`→`caption_bg`; `pnewsletter`:
  `pnew-width/height`→`popup_width/height` (+ Doppelkomma-Fix); `product-with-image`:
  `bg-overlay`→`bg_overlay_color`, `bg-opacity`→`bg_opacity`. **3 vorher kaputte Settings
  funktionieren wieder.** (`align-heading`/`align-content` bleiben für T2; restliche
  Hyphen-IDs `hero-spacer`/`img-in-hero`/`image-fit`/`border-copryright`/`trust-heading`/
  `padding-left/right` → in ihren T3-Section-Passes.)
- [x] **T2 — erledigt 2026-06-15 (vollständig/SOTA).** Atomarer Rename der 8 geteilten
  „Heading-Family"-IDs über 56 Sections + 3 Snippets (`section-heading`/`style-section`/
  `rating-custom`) + 27 JSON (settings_data + Templates, comment-aware): `des`→`description`,
  `title_top`→`subtitle_top`, `align-heading`→`align_heading`, `st_color`→`subtitle_top_color`,
  `t_color`→**`heading_color`** (statt `title_color` wg. Kollision in 5 Sections),
  `c_color`→`description_color`, `bgsection`→`background_section`, `r_type`→`reviews_type`.
  Dry-Run-Kollisionscheck vorab (0 harte Kollisionen), jede Datei vor Schreiben validiert,
  0 alte IDs/Refs/Keys übrig, 0 invalide Schemas. **Bonus: `align_heading` war via Hyphen-
  Dot ein Latent-Bug (Subtraktion) → Ausrichtung greift jetzt wieder → visuell prüfen.**
- [~] **T3 — in Arbeit.** **T3a ✅** (Labels: „Full Width"→„Section Width" 57×, „HTML / Description"→„Description" 38×, structure-aware). **T3b ✅** (44 kryptische Content-IDs → keyword-tragende Namen → `pool` statt AI-Pass; 37 Sections + 1 Snippet + 38 JSON, Saved-Werte migriert; Dry-Run 0 Kollisionen, word-boundary-safe). Bewusst gelassen: `text`/`name` (mehrdeutig) + Inzidental-Felder (Reviewer-Namen/Daten/Badges/Tabellen-Zellen) — keine Prime-Generierungs-Targets. **T3c VERWORFEN** (Block-Types) — versucht + revertiert (Commit `1cf66c4`): **Shopify wirft bereits platzierte Blocks weg, sobald ein Block-Type umbenannt wird — selbst bei vollständiger Schema+Saved-Migration.** Das Repo war 0-Mismatch-konsistent (saved==schema), der Editor verlor trotzdem die Blocks (Slideshow, Testimonials-Slider u.a.). → **Block-Type-Renames sind TABU** (anders als Setting-/Content-IDs, die nur ein Feld leeren statt einen Block zu droppen). `block:Item:`/`block:image:` etc. bleiben wie sie sind.
  - *Nebenbefund — ERLEDIGT 2026-06-15:* Theme-JSON-Sweep (Templates/Config/Locale). 3 Dateien
    (`templates/page.json`, `config/settings_schema.json`, `locales/en.default.json`) hatten
    vorbestehende Trailing-Commas (Shopify ok, strict `parse-theme` nicht) → gefixt, Kommentare
    erhalten. **Alle 84 Theme-JSON jetzt strict-valide.**
- [x] **T4 — erledigt 2026-06-15.** 24 Section-Slugs → semantisch kebab-case (`git mv`) +
  59 platzierte Section-Instanz-Types migriert (structure-aware, anchor auf Section-ID →
  Block-Types `service`/`line` unberührt). Bsp: `new-faq`→`faq-advanced`, `service`→`icon-list`,
  `line`→`divider`, `page-brands`→`brands`, `pnewsletter`→`newsletter-popup`,
  `brand-carousel/list`→`logo-carousel/list`, `custom_*`→kebab. FC + Slideshow numeriert
  behalten. Jeder Section-Type löst auf eine Datei auf; 0 Block-Mismatches; JSON valide.
  **Deploy-Hinweis:** sicher bei Frisch-Install; bei In-Place-Update eines Bestands-Themes
  müssen die Section-Instanz-Types des Merchants mit-migriert werden (sonst Section-Drop wie T3c-Klasse).
- [x] **Block-`text`-Nachzug — erledigt 2026-06-15.** Die Block-Content-Felder mit id `text`
  (image-with-text Heading/Subheading/Body, image-video-with-text, image-auto-slider, footer-Textspalte)
  trugen kein Keyword → AI-Pass. → `content` (Block-Type trägt die Rolle, z.B. `block:heading:content`).
  **Type-aware:** footers section-level `text` (eine *Farbe*) korrekt unberührt. 6 Schema + 14 Saved-Instanzen.
  Block-Content-Fläche jetzt vollständig vorsortiert (außer Deferred product-template-1/header).
- [ ] T5 — Resource-Typing (separat/später)

---

## Tier 0a — Label-Typos (global, mechanisch)

- `"Zoom Out Feft"` → `"Zoom Out Left"` — Option `zoom-out-left` in ~allen Sections mit AOS-`animation`-Select (Wert bleibt `zoom-out-left`, nur Label).
- `"Feaf"` → `"Leaf"` — Icon-Option in product-template-1 (~10×), slideshow-1, slideshow-2.
- `"Comapre price size"`→`"Compare price size"` (product-template-1) · `"Descripion All Products"`→`"Description (All Products)"` (main-collection-banner) · `"border-copryright"`-Label/`"Contact Infor"`/`"Addess"`/`"Fotter"` (footer) · `"Midle …"`→`"Middle …"` (viele `*position*`-Selects) · `"Show truspilot"`→`"Show trust badge"` (custom_reviews_marquee) · `"Text Cricle"`→`"Circle Text"` (tab-vertical) · `"Litmit Products"`→`"Limit products"` (product-bundle) · `"Write Reviews Botton"`→`"Button"` (areviews) · `"Alignement"`→`"Alignment"` (image-text-product) · trailing-space-Labels global trimmen.

## Tier 0b — Label-Klarheit (global)

- `setwidth`-Label `"Full Width"` → `"Section Width"` (Optionen sind Box/Fluid/Full) — ~25 Sections.
- `"Dot,Line"` → `"Separator style"` (announcement-bar-slide `scroll_dot`).
- `"HTML / Description"` → `"Description"` (überall wo `des`-Label).
- Doppeldeutige Labels eindeutig machen: „Style Button"×2 (cookie-policy) → „Accept …"/„Decline …"; „Color"×n → rollenbenennend.

## Tier 0c — Trailing-Comma-Fix (rule#6, invalides JSON)

Betroffen (Trailing-Comma nach `replace_reviews`-Label und/oder folgendem `paragraph`,
plus Einzelfälle): contact-form, custom-images-tabs, custom-instagram-marquee,
custom-reviews, custom-rounded-progress, custom_comparaison_table,
custom_progress_elements, custom_reviews_marquee, faq-accordion, featured-articles,
featured-articles-2, featured-collections-1, featured-collections-3,
featured-collections-5, featured-products, grid-banner, newsletter, page-brands,
page-gallery, product-template-1 (mehrere), slideshow-1, slideshow-2,
text_images_slider. → alle `},`/`,]`/`,}` vor Schließer entfernen, mit
`JSON.parse`-Check pro Datei verifizieren.

---

## Tier 1 — Hyphen-ID-Bugfixes (snake_case)

| Section | Fix | Bemerkung |
|---|---|---|
| timeline | `button-text`→`button_text`, `caption-bg`→`caption_bg`, `align-heading`→`align_heading` | **Live-Bug:** Liquid las `settings.button-text` als Subtraktion |
| pnewsletter | `pnew-width`→`popup_width`, `pnew-height`→`popup_height` (+ `assign`-Vars!) | **Live-Bug** + Doppelkomma in `render` (L36) |
| product-with-image | `bg-overlay`→`bg_overlay_color`, `bg-opacity`→`bg_opacity` | hyphen-IDs |
| Heading-Family | `align-heading`→`align_heading` (fleet) | gehört zu Tier 2 (Snippet-koordiniert) |

---

## Tier 2 — Geteilte „Heading-Family" (Snippet-koordiniert, einmalig)

Kanonische Umbenennung, **einmal in `section-heading.liquid` / `style-section.liquid` /
`rating-custom.liquid` + in allen Konsumenten gleichzeitig:**

`des`→`description` · `title_top`→`subtitle_top` · `r_type`→`reviews_type` ·
`align-heading`→`align_heading` · `st_color`→`subtitle_top_color` ·
`t_color`→`title_color` · `c_color`→`description_color` · `bgsection`→`background_section`
(`replace_reviews` Label fixen, ID bleibt).

**Konsumenten (≈):** advanced-content, before-after, brand-carousel, brand-list,
contact-booking, contact-form, count-down, faq-accordion, featured-articles,
featured-articles-2, featured-collections-1/3/5, featured-products, grid-banner,
instagram, instagram-customize, newsletter, page-brands, page-gallery, product-list,
product-list-swiper, product-tab, product-with-image, product-wrap-banner, quotes,
quotes-special, quotes-square, recently-viewed, s_team_member, service, shop-the-look.
Plus `quote-style-*.liquid` für `quotes`/`quotes-special` (`author`→`author_name`,
`info`→`author_info_caption`).

---

## Tier 3 — Per-Section: Block-Types + lokale Content-IDs

> Nur Maschinen-Layer-Änderungen (brauchen Konsumenten-Update). Globale Label/JSON-Fixes
> stehen in Tier 0. „keep" = compliant.

### Announcement / Nav / structural
- **announcement-bar-slide**: block `Item`→`slide`; `code`→`content`, `announ_type`→`announcement_type`. In-file: `{% when 'Item' %}`, `{{ block.settings.code }}`×2, `assign type=…announ_type`. Refs: header-group.json(3×), settings_data.json.
- **announcement-bar**: keep slug (Schema-Name „Top Bar " trailing-space trimmen); keine ID-Renames (nur Label-Klarheit).
- **store-messages**: block `Item`→`message_item`; `code`→`message_body`, `text`(color)→`text_color`.
- **scrolling-text**: block `item`→`scroll_item`; `code`→`text_body`, `text`(color)→`text_color`.
- **line** → slug `divider`; `wborder`→`border_width`, `bgborder`→`border_color`.
- **divider_advanced** → slug `divider-advanced` (refs: index.json ×2). IDs keep (typed).
- **header**: viele cryptic content-IDs (`des_menu_banner_*`→`description_…`, `menu_banner_html_*`→`menu_banner_description_*`, `*_btn_*`→`*_button_*`, `font_sizemenu`→`font_size_menu`, `sidebar_bio`→`sidebar_about`); Block-Types snake_case **deferred** (Daten-Risiko). NEEDS-REVIEW (große Fläche, in-file Body-Refs).
- **footer**: `border-copryright`→`border_copyright` (+typo), block contact `contact_addess`→`contact_address`, `contact_des`→`contact_description`, `contact_mail`→`contact_email`.

### Content / Media
- **advanced-content**: blocks `productcustom`→`product_item`, `productlist`→`product_list`; `des`→`description`(Tier2), block `html.code`→`content`, `image.code`→`content`, `html.button`→`button_label`. NEEDS-REVIEW (`limit_product` text-numeric).
- **before-after**: `text_before`→`before_label`, `text_after`→`after_label`, `image2`→`image_after`; `des`→(Tier2).
- **count-down**: `txt_button`→`button_label`, `e_button`→`enable_button`, `e_blur`→`enable_blur`, `size_text`→`heading_size`, `bgsection`→`background_section`, `des`→(Tier2).
- **custom-bundle-section**: `eyebrow`→`eyebrow_subheading`.
- **custom-image-bullets**: keep (nur Label-Caps „right/left").
- **custom-images-tabs**: block `image`→`tab` (4 Presets updaten).
- **custom-instagram-marquee**: blocks `first_row/second_row/third_row/forth_row`→`column_1..4`; `text`→`subheading_top`, `h_sub_color`→`subheading_top_color`, `h_s_color`→`heading_color`, `align-heading`→`heading_alignment`. (12 Preset-Einträge + 4 `block.type`-Guards.)
- **custom-reviews**: `stars_text`→`stars_caption`, `text`→`subheading_top`, `verified_text`→`verified_caption`, `label`→`button_label`, block `name`→`name_caption`; `h_s_color`→`heading_color`, `r_t_color`→`review_caption_color`, `align-heading`→`heading_alignment`.
- **custom-rounded-progress**: `before_badge`→`before_badge_text`, `after_badge`→`after_badge_text`, `r_type`→`reviews_type`, `align-heading`→`heading_alignment`. (`r_type` evtl. dead.)
- **custom_comparaison_table** → slug `custom-comparison-table` (ref: product.json); `h_s_color`→`heading_color`, `h_position`→`highlight_position`, `column_bk`→`column_background`, `highlights_bk`→`highlights_background`, `image-fit`→`image_fit`; block `value_1..10` → NEEDS-REVIEW (`cell_n`?). Dead CSS-Ref `tick_cross_color`.
- **custom_progress_elements** → slug `custom-progress-bars` (ref: product.json); `r_type`→`reviews_type`, `align-heading`→`heading_alignment`, `h_size`→`heading_size`, `color_h`→`heading_color`.
- **custom_reviews_marquee** → slug `custom-reviews-marquee` (refs: index.json, product.json); blocks `first_row`→`review_left`, `second_row`→`review_right`; `reviews_count`→`reviews_count_caption`, `reviews_cout_color`→`reviews_count_color`(typo), block `name`→`name_caption`, `date`→`date_caption`.
- **custom_shoppable_video** → slug `custom-shoppable-video` (keine aktiven Refs); `r_type`→`reviews_type`, `align-heading`→`heading_alignment`; **Tier5:** `video_pick`(text)→`video_url`.
- **image-content** → slug `image-with-text` (FLAG:RECONCILE mit -6); block-heading `text`→`heading_text`, subheading `text`→`subheading_text`, text_block `text`→`description_html`, `answer_content`→`description_content`, `button`→`button_label`.
- **image-content-6** → slug `image-video-with-text` (refs: page.about-us-v1/-v3); `text`→`description_html`, `answer_content`→`description_content`, `button`→`button_label`, `w_image`→`small_image_width`, `pos_image`→`small_image_position`, `e_image`→`small_image_align`, `text_circle`→`circle_caption`.
- **image-text-product** → slug `image-with-icons` (ref: product.json); `block_des`→`block_description`; **Tier5:** `video_pick`(text)→`video_url`.
- **text_images_slider** → slug `image-auto-slider` (ref: product.json); blocks `video`→`media`; `answer_content`→`description`; **Tier5:** `video_pick`(text)→`video_url`. (rule#6 JSON zuerst.)
- **grid-banner**: `colordef`→`color_description`; `des`/`title_top`→(Tier2); **Tier5:** `video_hosted`(text)→`video_url`.
- **backgroundvideo** → slug `background-video` (ref: page.about-us-v2); `paragraph.subtext`→`paragraph`, `button.button`→`button_label`, `hero-spacer`→`hero_spacer`, `img-in-hero`→`img_in_hero`; **Tier5:** `link_video`(text)→`url`/`video_url`.
- **video**: `text_circle`→`circle_caption`, `color`→`text_color`.
- **timeline**: block `time`→`milestone`; `des`→`description_html`, `year`→`year_label`; + Tier1 hyphen-bugs.
- **rich-text**: block `sub_title`→`subtitle`; `paragraph.subtext`→`paragraph_body`, `hero-spacer`→`hero_spacer`, `img-in-hero`→`image_width`; `title_top`→(Tier2).
- **map**: NEEDS-REVIEW — `address`(richtext, kein Keyword)→`address_body`? (sonst compliant).

### FAQ / Collections / Articles
- **faq-accordion**: block `faq_des`→`faq_description`, `title_top`→`subtitle_top`; `des`→(Tier2).
- **new-faq** → slug `faq-advanced` (ref: index.json); `question`→`question_heading`, `response_time`→`response_time_caption`, `setwidth`→`section_width`, `availability_text`→`availability_caption`, block `answer`→`answer_body`.
- **featured-collections-1**: `des`/`title_top`/`align-heading`→(Tier2); `size_text`→keep. (Slug: siehe Reconcile.)
- **featured-collections-3**: block `text_customize`→`custom_text_label`, `perviewDesktop`→`per_view_desktop`, `spaceBetween`→`space_between`, `button`→`button_label`; `des`/`align-heading`→(Tier2).
- **featured-collections-4**: block `Item`→`item_collection`; block `title`→`title_heading`. (Header-Comment-Typo `featured-collection-4`.)
- **featured-collections-5**: block `collection_btn`→`collection_button`; „Midle"-Typos; `des`/`align-heading`→(Tier2).
- **featured-products**: `txtbutton`→`button_label`, `urlbtn`→`button_link`; `des`/`align-heading`→(Tier2).
- **featured-articles**: `des`/`title_top`→(Tier2). FLAG:RECONCILE.
- **featured-articles-2** → slug `featured-articles-special` (0 Refs); `buttonall`→`button_label`, `rangebg`/`bgbefore`→`bg_sub_height`/`bg_sub`, `zindex`→keep.

### Product
- **product-bundle**: `bgsection`→`background_section_color`, `limit_bundle`→`bundle_product_limit`, `btn_add`→`add_button_label`.
- **product-content**: block `related-product`→`related_products`.
- **product-list**: Heading-Family (Tier2) + `bgsection`. NEEDS-REVIEW (snippet-coupled).
- **product-list-swiper**: `perviewDesktop`→`per_view_desktop`, `spaceBetween`→`space_between`, `e_size/e_repeat/e_position`→`bg_size/bg_repeat/bg_position`, `buttonall`→`bottom_button_label`, `des_banner`→`banner_description`, `button_banner`→`banner_button_label`; Heading-Family.
- **product-recommendations**: `spaceBetween`→`space_between`, `perviewDesktop`→`per_view_desktop`.
- **product-suggest**: `text`→`pretext_label`, `verify`→`verified_label`, block `local`→`location_caption`, `time`→`time_caption`.
- **product-tab**: `buttonall`→`bottom_button_label`, `buttonall_link`→`bottom_button_link`, `spaceBetween`→`space_between`; Heading-Family. FLAG:RECONCILE (mit -2).
- **product-tab-2** → slug `product-tab-split` (0 Refs); block `button`→`button_label`, `colortabimage`→`text_color_on_image`.
- **product-template-1**: keep slug; blocks `reviews_start`→`reviews_stars`(typo), `reviews_start_2`→`reviews_stars_alt`, `tabcustom`→`collapsible_row`, `tabfix`→`tab_fix`, `salepoint`→`sale_point`, `fakeviewer`→`fake_viewer`, `shortdesc`→`short_description`, `trust-badge`→`trust_badge`, `related-product`→`related_products`, `list-info`→`list_info`, `shippingtime`→`shipping_time`; viele cryptic typed-IDs (`bk`→`background`, `mix_*`, `cart_*`→`cta_*`, `p_size/p_color`→`price_*`, `Shipping_icon`→`shipping_icon`, `c_icon`→`custom_icon`, `e_label`→`enable_label`, `h_color`→`heading_color`); text-ohne-Keyword (`text_1..4`→`icon_caption_*`, `stars_text`→`stars_caption`, `atc_text`→`atc_button_label`, …). **Tier5:** `video_pick_1..4`→`video_url`. **NEEDS-REVIEW** (3200-Zeilen-Body, dedizierter Pass).
- **product-with-image**: keep slug (Schema-Name→„Product with image"); block `subtext`→`description_body`, `button`→`button_label`, `colortabimage`→`text_color`; Tier1 hyphen + Tier5 `video`→`video_url`; Heading-Family.
- **product-wrap-banner**: keep slug (Schema-Name fixen); `buttonall`→`bottom_button_label`, `des_banner`→`banner_description`, `button_banner`→`banner_button_label`, `perviewDesktop`/`spaceBetween`→snake; Tier5 `video`→`video_url`; Heading-Family. Dead-Ref `enable_first_banner`.

### Reviews / Testimonials / Social / Team
- **quotes**: block `author`→`author_name`, `info`→`author_info_caption` (quote-style-Snippets!); Heading-Family. FLAG:RECONCILE.
- **quotes-special** → slug `quotes-split` (ref: page.about-us-v2); block `author`→`author_name`, `info`→`author_info_caption`; `avatar`-Label→„Avatar". Dead-Ref `rows`.
- **quotes-square**: `f_title`→`first_block_title`, `f_des`→`first_block_description`, `f_bg`→`first_block_background`, `f_color`→`first_block_color`, block `info`→`author_info`; Heading-Family. FLAG:RECONCILE (Testimonials).
- **reviews-slider**: `text`→`subheading`, `label`→`button_label`, `color`→`reviews_stars_color`, `h_s_color`→`heading_color`, `b_bk`→`badges_background`, `b_color`→`badges_color`, block `name`→`author_name`, `name_color`→`author_name_color`, `badge_1/2`→`badge_label_1/2`. FLAG:RECONCILE.
- **s_team_member** → slug `team-member` (refs: page.about-us-v1/-v3, page.team_member.json, settings_data.json); block `position`→`position_title`, `name`→`member_name`; Heading-Family; `image`-Label→„Photo".
- **service** → slug `icon-list` (Refs prüfen); block `service`→`icon_item`; `paddingbox`→`inner_padding`, `iconcolor`→`icon_color`, `titlecolor`→`title_color_items`, `subcolor`→`subtitle_color`, `type_icon`→`icon_type`, `icon`→`icon_code`, `image_icon`→`icon_image`, `bgblock`→`block_background`; Heading-Family.
- **shop-the-look**: block `product_block`→`product`; `dot_color`→`hotspot_color`; Heading-Family.
- **recently-viewed**: Heading-Family only.
- **instagram**: `accesstoken`→`access_token`; Heading-Family. NEEDS-REVIEW (snippet).
- **instagram-customize**: `column`→keep; Heading-Family; **Tier5:** block `video_url`(text)→typed `video_url`.

### Slideshow
- **slideshow-1**: block `image`→`slide`; `e_arrow`→`enable_arrow`, `e_dot`→`enable_dot`, `bgwrap`→`slide_background`, `icon_text_1/2/3`→`icon_label_*`, `rating_count`→`rating_count_text`; **Tier5:** `video_hosted`→`video_url`. (rule#6 JSON zuerst; `visible_if` ist valides Shopify-Feature.)
- **slideshow-2**: block `image`→`slide`; `e_arrow/e_dot`→`enable_*`, `bgwrap`→`slide_background`, `width_imageslide`→`image_width`, `icon_text_*`→`icon_label_*`; **Tier5:** `video_hosted`→`video_url`. Stale-Comment `slideshow-1.liquid`; `slideshow_height` vs `_adapt` (Reconcile).
- **slideshow-3**: block `image`→`slide`; `e_arrow/e_dot`→`enable_*`, `bgwrap`→`slide_background`, `width_image`→`image2_width`. (Sauberste der drei.)

### Password / Main / Funktional
- **password-content**: `newsletter_placeholder`→`newsletter_placeholder_label`.
- **password-footer**: `social_message`→`social_message_heading`.
- **password-header**: `header`→`heading`, `color_pass`→`color_password`, `image_password`→`background_image`.
- **main-404**: `found_html`→`title_404`, `sub_404`→`description_404`, `found_btnleft_text`→`button_label`, `found_btnleft_link`→`button_link`, `found_text_color`→`text_color`.
- **main-collection-banner**: `des_all`→`description_all`, `img_bannercollection`→`all_products_image`.
- **main-search**: `search_perrow`→`search_per_row`.
- **page-brands** → slug `brands` (refs: settings_data.json, page.brands.json); block `title`→`letter`, `linklist`→`link_list`; Heading-Family.
- **page-gallery** → slug `gallery` (ref: settings_data.json); Heading-Family (sonst weitgehend ok).
- **pnewsletter** → slug `newsletter-popup` (ref: settings_data.json); Massen-Typo-Fix `pnewletter`→`newsletter_popup_*`, `pnew_*`→`popup_*`, `*_cl`→`*_color`; + Tier1 hyphen-Bugs.
- **newsletter**: `e_size/e_repeat/e_position`→`background_*`, `newletter_color`→`newsletter_color`(typo), `colorborder`→`border_color_input`; Heading-Family. Dead-Ref `zindex` (in Liquid, nicht im Schema).
- **cookie-policy**: `cookie_url_text`→`cookie_url_label`, `cookie_ok`→`cookie_accept_label`, `decline`→`decline_label`.
- **contact-form**: `title_top`→`subheading_top`, `r_type`→`reviews_type`, `align-heading`→`heading_alignment`, `bgsection`→`background_section`; (Heading-Family-Variante).
- **contact-booking**: NEEDS-REVIEW — block `store`→`budget` (+ `block.type`-Guard + saved blocks in page.book-appointment.json), `store_location`→`budget_label`, `interested_want`→`service_label`.

### COMPLIANT (kein Change nötig)
cart-template, featured-products-subsection, list-collections-template,
main-collection-template, main-login, main-order (schema-los), main-page, main-wishlist
(schema-los), pickup-availability (schema-los), predictive-search (schema-los).

---

## Tier 4 — Slug-Renames Übersicht (mit Ref-Updates)

| von | nach | Ref-Updates |
|---|---|---|
| new-faq | faq-advanced | index.json |
| sticky_video_section | sticky-video-product | settings_data.json |
| custom_comparaison_table | custom-comparison-table | product.json |
| custom_progress_elements | custom-progress-bars | product.json |
| custom_reviews_marquee | custom-reviews-marquee | index.json, product.json |
| custom_shoppable_video | custom-shoppable-video | — |
| text_images_slider | image-auto-slider | product.json |
| image-content | image-with-text | — |
| image-content-6 | image-video-with-text | page.about-us-v1/-v3 |
| image-text-product | image-with-icons | product.json |
| backgroundvideo | background-video | page.about-us-v2 |
| divider_advanced | divider-advanced | index.json |
| line | divider | (prüfen `"type":"line"`) |
| tab-infor | tab-information | — (0 Refs) |
| s_team_member | team-member | page.about-us-v1/-v3, page.team_member.json, settings_data.json |
| page-brands | brands | settings_data.json, page.brands.json |
| page-gallery | gallery | settings_data.json |
| pnewsletter | newsletter-popup | settings_data.json |
| service | icon-list | (prüfen) |
| product-tab-2 | product-tab-split | — (0 Refs) |
| quotes-special | quotes-split | page.about-us-v2 |
| featured-articles-2 | featured-articles-special | — (0 Refs) |

---

## OFFENE ENTSCHEIDUNGEN (Reconcile — brauchen dein OK)

1. **featured-collections-1/3/4/5** — Namen divergieren („Collection list / … Swiper /
   Image Hover / grid"). Nur `-3` ist extern referenziert (5 collection-Templates).
   **Empfehlung: numerierte kebab-Slugs behalten** (niedrigstes Risiko) statt semantisch
   umbenennen.
2. **brand-carousel / brand-list** → `logo-carousel` / `logo-list`? (Schema-Namen sind
   „Logo …", Block-Type ist `logo`). **Empfehlung: ja** (semantisch korrekt).
3. **slideshow-1/2/3** → semantisch (`slideshow-overlay/split/feature`) **oder** numeriert
   behalten? **Empfehlung: für V1 numeriert behalten** (sind schon kebab; semantisch ist
   nice-to-have, weniger Churn).
4. **product-template-1** — Massen-ID-Renames im 3200-Zeilen-Body: jetzt voll mitnehmen
   oder als **dedizierten Einzel-Pass** nach den anderen? **Empfehlung: dedizierter Pass.**
5. **Tier 5 (Resource-Typing video→video_url)** — jetzt mit Phase 1 oder als eigener
   Schicht-2-Schritt (braucht Liquid-Logik + Daten-Migration)? **Empfehlung: separat/später.**
