# Bug-Liste Summit Theme — Stand 2026-07-08

Abarbeitung: ein Fix = ein Commit, vorher `git pull --rebase`, alles verifizieren
(Liquid-Parser, Schema-JSON, CSS-Klammern). Nach jedem Punkt Haken setzen +
User klick-testet live.

Status-Legende: `[ ]` offen · `[~]` in Arbeit / wartet auf Klick-Test · `[x]` bestätigt erledigt

---

## 1. Option Type: neue Werte hinzufügen
- [x] Product Overview → Buttons & Variants → "Option Type": neue Optionen
      **Variant Image Round** und **Variant Image Square** hinzufügen.
      → Bereits im Schema vorhanden (product-template-1.liquid:5023-5028). ERLEDIGT.

## 2. Product Tab ohne Kollektion
- [~] Bereich ist fehlerhaft, wenn keine Kollektion hinterlegt ist.
      Muss auch ohne ausgewählte Kollektion fehlerfrei laufen.
      → Fix e9fa5da: Fallback auf collections.all → echte Produkte statt leerer
        Platzhalter. Wartet auf Live-Test.

## 3. Product Card → Item Hover Style → Style 9 = "Button Box"
- [x] Style 9 muss den Button-Stil "Button Box" (btn-theme) verwenden.
      → product-card.liquid:647/724 nutzt btn-theme, kein White-Override in
        theme.css. User hatte "hat geklappt" bestätigt. ERLEDIGT (dd1c7c9).

## 4. Option Type → echte Variant Images
- [~] Variant Image Round / Variant Image Square müssen die echten
      Variantenbilder übernehmen.
      → Render-Kette komplett (productOption.liquid force_image + Fallback,
        theme.css 8487 + Span-Paint global 0955dff). Editor-Preview rendert bei
        Option-Type-Wechsel oft NICHT neu → auf Storefront-URL hart neu laden.
        Wartet auf Live-Test.

## 5. Product List (Carousel) + Product Tab: falsche Produkte
- [~] "Limit Items" und "Display Items" funktionieren nicht richtig.
      → limit + show/perview korrekt verdrahtet; Carousel-Loop-Guard bereits
        gesetzt (theme.js:3154/3238). War Zustand VOR Loop-Guard-Fix. Live-Test.
- [~] Ohne hinterlegte Kollektion wird komplett falsch angezeigt.
      → Fix e9fa5da: collections.all-Fallback in product-tab, product-list,
        product-list-swiper. Wartet auf Live-Test.

## 6. Images with Auto Slider: doppelte Description
- [x] Es werden 2 Descriptions angezeigt. Die "Description" muss gelöscht
      werden, nur die HTML-Description anzeigen. Aktuell ist die HTML-Description
      unsichtbar und zeigt "Legacy - Not Displayed".
      → Nur noch answer_content (richtext "Description") rendert; content-Feld
        aus Schema entfernt. ERLEDIGT (0781caa).

## 7. Advanced Sticky Cart: Responsiveness-Bug
- [x] Gleicher Responsiveness-Bug wie zuvor beheben. ✔ BESTÄTIGT 2026-07-08
      → 81d6453 (Härtung mobil) hatte eine Desktop-REGRESSION erzeugt:
        cart_items width:100% brach die Leiste in 2 Zeilen (User-Screenshot
        2026-07-08). Fix abb4eb8: width:100% nur noch ≤768px, Desktop wieder
        einzeilig Info links / Button rechts.
        Nachtrag: Band 992–1199px brach weiterhin um (alte 1199er-Overrides).
        Fix d05de7c (User-Wahl "einzeilig kompakt"): Overrides nur noch <992px,
        992–1199 = nowrap kompakt (Bild 48px, Titel ellipsiert 230px).
        Vom User BESTÄTIGT (2026-07-08). ✔

## 8. Product Overview → Show Tax Disclaimer
- [~] Text muss direkt UNTER dem Preis stehen, INNERHALB der Price-Box, minimaler Abstand.
      → Root Cause gefunden: .product-single__meta-price ist display:flex mit
        flex-wrap:nowrap (product-template.css:174). Darum blieb das <li> trotz
        display:block/flex:0 0 100% inline neben dem Preis; mobil lief die Zeile
        ueber und verschwand.
      → Zwischenschritt (Block-<div> AUSSERHALB der ul) landete auf eigener Zeile,
        aber ausserhalb der blauen Box - vom User verworfen ("muss in der Box bleiben").
      → Finaler Fix: <li> zurueck in die Preis-ul; .price-{{ section.id }} bekommt
        flex-wrap:wrap, der Disclaimer-<li> flex:0 0 100% + display:block. Ergebnis:
        eigene Zeile direkt unter dem Preis INNERHALB der Box, mobil sichtbar,
        margin-top:2px (product-template-1.liquid). Wartet auf Live-Test.

## 9. Progress Bars: "Progress"-Option
- [~] Die "Progress"-Option wird nicht angezeigt.
      → Fix cc18c5b: Fill-Farbe box_color war bei leerem Wert "background: ;"
        (transparent). Jetzt Fallback auf schwarz. Wartet auf Live-Test.

## 10. Product Overview → Delivery Date: Box 2
- [~] "Icon Color" für Box 2 funktioniert nicht.
- [~] Icon 1 / SVG 1 / Icon Color für Box 2 müssen UNTER "Box 2" erscheinen,
      nicht unter "Box 1".
      → Behoben (5a65440): list-svg parametrisiert (icon_color), Box 2/3 rendern
        mit icon_color_2/3, Schema-Reihenfolge korrigiert. Live-Test.

## 11. Style Button → Button Line White
- [~] Muss ausschließlich weiß sein, auch auf Hover (bleibt weiß beim Hovern).
      Fix darf NUR "Button Line White" betreffen.
      → Behoben (3df77c4): Hover-Selektor .btn-underline.btn-underline-white:hover
        {color:white} + Unterstrich :before/:after weiß. Nur Button Line White
        betroffen. Wartet auf Live-Test.

## 12. Quick Buy
- [~] Quadratische Bilder müssen das ganze linke Feld füllen (ggf. Maße des
      gesamten Quick-View-Menüs anpassen).
- [~] Button wird kleiner, sobald er geklickt wird.
- [~] Arrows müssen identisch mit den Theme-Arrows sein.
      → Behoben (a31930c): Bildspalte = aspect-ratio-Baseline, Bild cover,
        Button flex:1 1 auto + zentrierter Spinner (kein Shrink), qv-nav-Arrows
        wie Theme-Pfeile (weiße Kreise + Border). Live-Test.

## 13. Image with Bullets: Hover Animation entfernen
- [x] "Hover Animation (Legacy — Not Used)" komplett entfernen.
      → hover_style-Setting aus Schema entfernt (f760b58), 0 Treffer im Code.
        ERLEDIGT.

## 14. Contact Form: Eingabefeld-Hintergründe
- [~] Hintergründe der Eingabefelder sind aktuell farbig (vermutlich Branding-/
      Primary-Color). Müssen wie im Ursprungs-Theme sein.
      → Ursache: input_bg ohne Default → --g-input-bg leer → Felder transparent
        → Section-Farbe schien durch. Fix 3aff24c: Weiss-Fallback in
        header-css.liquid (global, alle Formulare). Wartet auf Live-Test.

## 15. Button & Variants: Farb-Swatch bei allen Größen/Typen
- [~] "Enable Swatch Color": Farbe wird aktuell NUR bei
      Type Color = "Square Color Text" + Size = "Small" angezeigt.
- [~] Bei Size "Normal" / "Large" wird Farbe nicht angezeigt.
- [~] Bei Type Color "Circle" / "Square" wird Farbe nicht angezeigt.
      Farbcode kommt aus Theme Settings → "Product Swatch".
      → Ursache gefunden: Label bekam --swatch-bg nur bei Varianten MIT Bild;
        reine Farb-Varianten blieben leer. Fix 0955dff: .st-color-Span global
        sichtbar + gefüllt für round/square (alle Größen). Wartet auf Live-Test.

## 16. Delivery Date → Box 1 Ein/Aus-Toggle (analog Box 2)
- [~] Box 1 (Lieferdatum-Zeile) soll wie Box 2 ("Activate Box 2") einen eigenen
      Ein/Aus-Toggle bekommen, sodass wahlweise nur Box 2 sichtbar bleibt.
      Toggle innerhalb der Box-1-Settings ÜBER "Pulsating Dot".
      → Fix: Schema-Checkbox "Activate Box 1" (enable_box_1, default true) direkt
        unter dem "Box 1"-Header/über pulsating_dot; Rendering von c_order-date in
        {% if block.settings.enable_box_1 %} gewrappt (product-template-1.liquid).
        Wartet auf Live-Test.

---

### Reihenfolge / Notizen
(werden beim Abarbeiten ergänzt: Commit-Hash je Punkt)

**Style 5 "Button Box": vom User BESTÄTIGT (2026-07-08, nach 418ec4e).** ✔

**WICHTIG — Erkenntnis 418ec4e:** Der Shop serviert das gerenderte
`theme.css.liquid` als theme.css (NICHT die statische theme.css). CSS-Fixes
müssen daher IMMER in BEIDE Dateien (theme.css + theme.css.liquid). Style 5,
Swatches (#4/#15) und Button Line White (#11) griffen live erst nach der
Spiegelung in 418ec4e. Style 9 hatte funktioniert, weil 722a515 damals beide
Dateien angefasst hatte.
