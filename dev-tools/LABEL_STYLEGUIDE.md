# LABEL_STYLEGUIDE.md — Editor-Label-Konvention (Phase 2)

**Geltungsbereich.** Anzeige-Labels in `sections/*.liquid` (`{% schema %}`): Section-/Block-
`name`, Setting-`label`, Select/Radio-Option-`label`, `header`-`content` (Gruppen-Titel).
**Nicht** betroffen: `id`, `value`, `default`, `type`, `paragraph`-`content` (Hilfetext-Sätze),
Liquid-Code. Reine Display-Strings → **kein** Identifier-/Mapping-/Migrations-Impact, auch
post-launch gefahrlos. Storefront-Mehrsprachigkeit bleibt über `locales/*.json` (R9 via klare Labels).

**Konvention festgelegt 2026-06-15: Variante A — Title Case überall.**

## Regeln

1. **Casing = Title Case** für *alle* Labels/Namen/Header (jedes Wort groß), mit Ausnahmen:
   - **Akronyme bleiben groß**: HTML, CSS, URL, CTA, FAQ, SEO, AI, API, RSS, SVG, GIF, ID, USP,
     PDP, PLP, UI, UX, RGBA, UTM, H1–H6.
   - **Eigennamen** in korrekter Schreibweise: Instagram, Google, YouTube, TikTok, Facebook,
     Pinterest, WhatsApp, Shopify, iOS.
   - **Jedes Wort groß** (auch and/of/with/to) — keine Small-Word-Ausnahme. Begründung:
     Verbindungswörter sind im Theme meist Richtungen/Bedeutungsträger („Zoom In", „Fade Up").
   - Bindestrich-Teile einzeln title-casen: „No-repeat" → „No-Repeat".
2. **Noun-first, Filler-Verben raus** bei Selects/Inputs: „Select Animation" → „Animation",
   „Align Heading" → „Heading Alignment". **Ausnahme Toggles** (checkbox): „Enable …" / „Show …"
   bleibt (Shopify-Pattern).
3. **Keine kryptischen Kürzel, keine Trailing-/Doppel-Spaces.** „Sub Title" → „Subtitle";
   kryptische via `id`/Liquid-Nutzung auflösen, **nicht raten** (z. B. `bgbefore`=`::before`-Overlay
   → „Overlay Color").
4. **Einheitliche Begriffe** themenweit: durchgängig **„Heading"** (nicht mal „Title" mal
   „Headline"), **„Color"** ausgeschrieben, **„Subtitle"**, **„Button"**, **„Image"**.
5. **Familien gleich strukturieren**: `Background Color / Image / Size / Repeat / Position`.

## Rollout (2-Pässe)

- **2a — Maschinell (Casing):** `_labelpass.py` title-cased alle `label`/`name`-Werte
  deterministisch. Dry-Run → Diff-Review → Apply. Trifft den Großteil, null Semantik-Risiko.
- **2b — Judgment (Semantik):** Verb-Drop (Regel 2), kryptische Auflösung (Regel 3),
  Terminologie-Vereinheitlichung (Regel 4). Pro Section, mit Review.

`advanced-content` dient als Referenz-Section (beide Pässe vorgeführt).
