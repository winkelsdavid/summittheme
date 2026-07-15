> **Read-only Kopie — Quelle: Summit-Admin-Repo, bei Abweichung dort aktualisieren.**

# METAFIELD_CONTRACT.md — produktspezifische Inhalte am Produkt statt in der Vorlage

**Zweck.** Dies ist der verbindliche Vertrag zwischen **Summit Admin** (Writer)
und dem **Summit-Master-Theme** (`winkelsdavid/summittheme`, Reader) für den
Multi-Produkt-Support: Alle AI-generierten Inhalte, die *pro Produkt*
verschieden sind, wandern aus den Template-/Section-Settings in
**Produkt-Metafields** (Namespace `summit`). Die eine Produktvorlage rendert
damit jedes Produkt mit seinen eigenen Inhalten.

Entstanden 15.07.2026 als Schritt 0 des Plans
`docs/plans/multi-product-backend-implementierung.md` (Entscheidung Metafields
vs. Vorlagen-Duplikate: `docs/plans/niche-stores-multi-product.md`).
**Quelle der Wahrheit für die Mapping-Mechanik ist der Code** — bei Drift
gewinnt der Code; dieses Dokument wird nachgezogen. Eine read-only-Kopie
gehört ins Theme-Repo (Pflege-Regel wie beim `MAPPABILITY_CONTRACT.md`).

**Verhältnis zum MAPPABILITY_CONTRACT:** Metafield-Reads im Liquid sind
**Schicht 2 (Implementierung)** — sie ändern keine Section-Slugs, Setting-IDs
oder Block-Types. Der Theme-Patch ist damit per Definition mapping-sicher;
die Parse-/Klassifizierungs-Fläche bleibt byte-identisch.

---

## 0. Die eine Regel

> Ein Inhalt gehört in ein Metafield, wenn der Prompt, der ihn erzeugt
> (oder dessen Chain-Wurzel), Produkt-Kontext konsumiert:
> `product_name`, `product_description` oder `product_images` in
> `prompts.context_fields`, oder `requires_customer_reference_image`.
> Alles andere (marken-statisch: Trust-Badges, Versand-Icons, Farben,
> Layout) bleibt in der Vorlage.

Mechanisch verifiziert am Live-Bestand (15.07.2026): **alle 9 aktuell auf
Produkt-Sections gemappten Prompts** sind nach dieser Regel produkt-scoped —
die marken-statischen Elemente (Trustpilot-Widget, Zahlungs-Icons, …) sind
gar nicht pool-gemappt und bleiben unberührt.

**Chain-Kante:** Die Signale stehen oft NICHT am Leaf-Prompt, sondern an der
Chain-Wurzel (`chained_from_prompt_id` rückwärts laufen). Beispiel:
`Icon Crop` (leaf, keine context_fields) ← `Icon Design - Image Generation`
← `Icon Design - Prompt Generierung - Base` (product_description). Jede
Scope-Ableitung MUSS die Chain bis zur Wurzel prüfen.

---

## 1. Namespace & Konventionen

- **Namespace:** `summit` (etabliert — `summit.managed` wird heute bereits
  via `productSet` geschrieben: `push-products/_shared/productInputBuilder.ts`).
- **Bündelungs-Regel:** pro Themenblock EIN Metafield (json-Array bzw.
  file-Liste), nie ein Metafield pro Einzelfeld. 96 gemappte/mappbare Felder
  → 8 aktive Definitionen.
- **Key-Schema für künftige Inhalte:** `summit.<themenblock>` — kurz,
  englisch, snake_case. Neue produkt-scoped Mappings auf Produkt-Sections
  bekommen einen neuen Key nach diesem Schema und einen Eintrag in Tabelle 2.
- **Bilder:** immer `file_reference`/`list.file_reference` mit
  MediaImage-GIDs (Upload via bestehendem fileCreate-Pfad,
  `push-products/_shared/imageUploader.ts`) — nie URLs in json.
- **Limits:** json-Werte ≤ 64 KB (bei FAQ/Reviews beim Bündeln validieren);
  Reihenfolge in Arrays/Listen ist bedeutungstragend (index-treu zur
  Pool-Output-Reihenfolge).

## 2. Die Metafield-Definitionen (v1, aus dem Live-Inventar abgeleitet)

| Key (`summit.`) | Typ | Shape / Inhalt | Quelle (Prompt → objectField) |
|---|---|---|---|
| `benefit_icons` | `list.file_reference` | 4 Icons, Reihenfolge = Slot 1–4 | Icon Crop, Outputs 0–3 |
| `benefit_texts` | `json` | `string[]` (4 Beschriftungen, index-gleich zu Icons) | Icon Design Base → `heading`, Outputs 0–3 |
| `usps` | `json` | `string[]` (Häkchen-/Salepoint-Texte) | Image with Bullets → `point` |
| `faq` | `json` | `[{ "q": string, "a": string }]` (bis 12) | FAQs 12 Q&A → `question`/`answer` |
| `reviews` | `json` | `[{ "name": string, "text": string }]` | Name Generation → `name` + Reviews → `review` |
| `review_images` | `list.file_reference` | Bilder index-treu zur Pool-Reihenfolge (heute 7 Outputs) | Review Images, Outputs 0–6 |
| `banner` | `file_reference` | Produktseiten-Banner | Banner Design Product Page, Output 0 |
| `managed` | `boolean` | „Summit verwaltet dieses Produkt“ | existiert bereits (Push) |

**Reserviert (aktuell unmapped, bei Aktivierung diesen Key nutzen):**
`summit.content_tabs` — `json` `[{ "title": string, "content": string }]`
(Product-Content-Tabs).

**Bewusst KEIN Metafield:**
- **Produkt-Titel** — die Vorlage rendert nativ `product.title`
  (der Titel-Prompt speist bereits das Produkt-Resource-Feld `title` →
  productSet). Die heutigen Title-Settings (`title.custom_title` in
  Product Overview, `product` in Product Suggest) entfallen beim Theme-Patch
  zugunsten von `product.title`.
- **Beschreibung** — nativ `product.description` (descriptionHtml via
  productSet, heute schon so).

## 3. Konsumenten-Matrix (für die Theme-Session)

Wo die Vorlage heute statische Setting-Werte rendert und künftig Metafields
liest — exakt aus den Live-Mappings (Feld-Ebene + Block-Type-Mappings der
Version, `resource_block_type_mappings` / `resource_field_definitions`):

| Section | Slot (Setting/Block) | liest künftig |
|---|---|---|
| Product Overview | `icon_1`–`icon_4` (Section-Settings) | `benefit_icons[0..3]` |
| Product Overview | `text_1`–`text_4` (Section-Settings) | `benefit_texts[0..3]` |
| Product Overview | Block `icon_text_box` → `text` | `usps[i]` (i = Block-Index) |
| Product Overview | Block `salepoint` → `free_word` | `usps[i]` |
| Product Overview | Block `tabcustom` → `title_tab` / `answer_content` | `faq[i].q` / `faq[i].a` |
| Product Overview | Block `custom_review` → `name` / `text` | `reviews[i].name` / `reviews[i].text` |
| Product Overview | Block `custom_review` → `image` | `review_images[3 + i]`¹ |
| Product Overview | Block `review_images` → `image_1..3` | `review_images[0..2]` |
| Product Overview | Block `videos` → `image_1..3` | `review_images[4..6]` |
| Product Overview | Block `image` → `image` | `banner` |
| Product Overview | Block `title` → `custom_title` | `product.title` (nativ) |
| Product Suggest | `product` | `product.title` (nativ) |

¹ Die Index-Arithmetik spiegelt die heutigen `outputIndex`-Werte der
Block-Type-Mappings. Die Theme-Session darf sie vereinfachen (z. B. Reviews
und ihre Bilder in EIN `reviews`-json mit `image_index` zusammenziehen) —
dann wird DIESE Tabelle entsprechend aktualisiert; Kontrakt und Theme müssen
identisch rechnen.

## 4. Fallback-Regel (macht den Theme-Patch risikofrei deploybar)

```liquid
{%- assign mf = product.metafields.summit.benefit_texts.value -%}
{%- if mf and mf[0] -%}   … Metafield rendern …
{%- else -%}              … bestehendes Setting rendern (heutiger Stand) …
{%- endif -%}
```

- **Metafield gewinnt, wenn gesetzt; sonst Setting.** Damit rendert das
  gepatchte Theme alle heutigen Ein-Produkt-Stores byte-gleich (dort
  existieren keine `summit.*`-Content-Metafields) und kann VOR dem Backend
  gemerged werden.
- Leere Arrays/Listen zählen als „nicht gesetzt“.
- Kein Mischen innerhalb eines Themenblocks: entweder der ganze Block aus
  dem Metafield oder ganz aus Settings (halb/halb erzeugt Index-Chaos).

## 5. Schreibpfad (Summit-Seite)

- **Voll-Push:** Werte reisen im bestehenden `metafields[]`-Array des
  `productSet` (Upsert per namespace+key — Pfad existiert durch
  `summit.managed`). Bilder vorher via fileCreate → GID.
- **Einzel-Update** (Regenerate / Customer-App-Edit): `metafieldsSet` auf
  das eine Feld — kein Theme-Push, sofort live.
- **Definitionen:** `metafieldDefinitionCreate` idempotent einmal pro Store,
  **gepinnt** — dadurch erscheinen die Felder als Eingabefelder auf der
  Produkt-Detailseite im Shopify-Admin (Fallback-Editor für Kunden).
- **Mutator-Gate:** `themeContentMutator`/`settingsDataBuilder` überspringen
  die Slots aus Tabelle 3 ERST, wenn die Theme-Version den Kontrakt kennt
  (Erkennung beim Parse, Flag an der Version) — sonst schreiben sie wie
  heute weiter. Verhindert die Lücke „Settings leer, Metafields noch nicht
  gelesen“.
- **Ownership:** Summit ist Writer (last-write-wins). Der Shopify-Admin ist
  Fallback-Editor; die beworbene Bearbeitungsfläche ist die Summit App
  (Produkt-Content-Hub: Regenerate + eigener Upload).

## 6. Pflege-Regel

Änderungen an Tabelle 2/3 (neuer Key, geänderte Shape, vereinfachte
Index-Arithmetik) werden HIER committet und die read-only-Kopie im Theme-Repo
im selben Zug aktualisiert — Kontrakt-Drift zwischen Writer und Reader ist
der einzige Weg, wie dieses System kaputt gehen kann.
