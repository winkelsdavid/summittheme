# Bug-Liste Summit Theme — Stand 2026-07-08

Abarbeitung: ein Fix = ein Commit, vorher `git pull --rebase`, alles verifizieren
(Liquid-Parser, Schema-JSON, CSS-Klammern). Nach jedem Punkt Haken setzen +
User klick-testet live.

Status-Legende: `[ ]` offen · `[~]` in Arbeit / wartet auf Klick-Test · `[x]` bestätigt erledigt

---

## Wiederkehrende Fix-Patterns (bei neuen Bugs zuerst prüfen)

**P1 — Bootstrap `.col` vs. Swiper-Slide-Breiten (#52):** Slick baute keinen
Flex-Kontext, Swiper schon — `.col{flex-basis:0;flex-grow:1}` (Bootstrap-Inline
in header-css Zeile 2, lädt NACH der Swiper-CSS) überstimmt an `.swiper-slide`s
die Inline-Breite, die Swiper setzt: Karten kollabieren auf min-content,
Translate-Raster passt nicht mehr (Symptom: Teilkarten/Sliver nebeneinander,
Pfeile überlappen). Gegenmittel global in theme.css + theme.css.liquid:
`.swiper-container-initialized > .swiper-wrapper > .swiper-slide.col{flex:0 0 auto;max-width:none}`
— BEWUSST auf initialisierte Swiper gescoped: featured-collections-1 trägt die
swiper-Klassen auch bei Carousel AUS und baut sein statisches Raster gerade AUS
dem `.col`-Flex (ungescoped → jede Karte width:100%). product-list/product-tab
haben zusätzlich ihre ältere sektionsweise Fassung. Bei NEUEN Swiper-Sektionen:
entweder kein `.col` an Slides (wie quotes*) oder auf die globale Regel bauen.

**P2 — Swiper-Init-Härtung (#30/#52):** Jeder Swiper-Init braucht
`observer:true, observeParents:true, watchOverflow:true, simulateTouch:!!draggable`
— sonst bleibt er bei spät settelnder Containerbreite (Editor-Inject, async
Bildspalten) auf falschen Maßen stehen bzw. zeigt tote Pfeile.

**P3 — BeerSlider/JS-Init-Ketten (#51):** Sektion sieht „doppelt so hoch /
Vor-Init-Zustand" aus → prüfen, ob der zugehörige JS-Init überhaupt läuft
(Registerkette theme.js 3848ff, Konsole auf Fehler früherer Konstruktoren).

**P4 — Undefinierte CSS-Var mit `!important` (#53):** `var(--x)` ohne Definition
macht die Deklaration „invalid at computed-value time" → Property fällt auf
initial UND behält `!important` (schlägt Inline-Styles). Symptom: 0-Höhe-Boxen,
unsichtbare Bilder. Bei `var()`-Nutzung immer Definition mitprüfen.

**P5 — B1-Fallback-Triage „Depot füllt nicht" (#79 + Instagram-Saga 19./20.07.):**
IMMER in dieser Reihenfolge prüfen, NIE beim ersten Verdacht stoppen — hier
lagen ZWEI gestapelte Bugs uebereinander, die sich gegenseitig maskierten:
  (a) GESPEICHERT? Ungespeicherte Customizer-Entwuerfe sind von aussen nicht
      renderbar; Editor rendert frisch injizierte Sektionen zudem mit
      VERALTETEN Metaobject-Daten (erst Preview-Reload zeigt Fallbacks).
      Editor-Saves auf summittheme/main werden vom naechsten Git-Push
      ueberschrieben (templates liegen im Repo!) — Editor-Tests auf
      Summit-Builds machen.
  (b) DATEN? Handle existiert + Felder GEFUELLT + ACTIVE + Definition
      storefront=PUBLIC_READ (GraphQL, read-Token kann alles davon).
      Writer-Kontrakt beachten: erstes Media-Setting (image ODER video)
      in Schema-Reihenfolge = Legacy-Handle `<section>--<block>`; video-
      erste Bloecke tragen dort video_1..N (brand-VIDEO noetig, nicht
      brand-image!); jedes weitere Media-Setting = eigenes Depot
      `...--<settingId>` (je position 1 fuer Setting-Slots).
  (c) SICHTBARKEIT? Wenn HTML das Medium enthaelt, aber nichts zu sehen
      ist: Ratio-Box-Falle. Ratio haengt oft am INSTANZ-Wrapper (z. B.
      `.instagramoff-item a{padding-top:var(--h)}`) und globale Regeln
      setzen img/video absolut — Fallback-Medien ohne Wrapper
      kollabieren auf 0. Fallback-Ausgaben brauchen IMMER eine eigene
      Ratio-Box (Muster `.instagramoff-b1box`: relative + padding-top +
      overflow hidden). Perfides Symptom: mit funktionierenden Daten
      sieht man WENIGER als mit Placeholder (der hat eine eigene Box).
  Beweis-Werkzeuge: Storefront-Render via Puppeteer+Passwort+preview_
  theme_id (HTML nach CDN-Dateien durchsuchen — NIE nach Dateinamen-
  Mustern, Summit re-pusht Pools mit neuen Namen!), Kachel-Hoehen per
  getBoundingClientRect, notfalls temporaere b1-probe per Git-Push
  (Muster in Scratchpad/Historie 47219a5).

**P6 — Gradient-Border-Techniken (#97→#111/#112-Lektionen):**
Standard = maskiertes ::before-Ring-Overlay (inset:-1px, padding:1px,
mask content-box XOR full, mask-composite:exclude, pointer-events none,
border-radius:inherit; Element ggf. position:relative + border 1px
transparent fuer Layout-Paritaet). Innen bleibt exakt die ALT-Deklaration.
  (a) Doppel-Background padding-box/border-box NICHT verwenden: die
      border-box-Layer fuellt die GANZE Flaeche und blutet durch
      halbtransparente Innenfarben (TECH-DARK-Glas) — #112-Repro.
  (b) border-image nur fuer GERADE Linien ohne Radius (folgt border-radius
      nicht); dabei P4 beachten: haelt eine Var/Literal-Basis-Border den
      GRADIENT, ist `1px solid <gradient>` invalid → Breite 0 → border-image
      unsichtbar (#111). Basis-Border im Gradient-Zweig auf `transparent`
      neu setzen. Kanten mit style:none (Breite 0) bleiben automatisch leer.
  (c) box-shadow-Ringe koennen nie Gradient — auf (Standard) umbauen,
      Ring liegt mit inset:-1px genauso 1px AUSSERHALB wie der Spread.
  (d) Multi-Layer-background-Shorthand: nur die LETZTE Layer darf eine
      Farbe sein; var() mit Farb-Fallback in einer Layer macht die GANZE
      Deklaration invalid.

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
      → ECHTE Root Cause gefunden (2026-07-10): Bootstrap .col auf den
        swiper-slides (header-css.liquid: flex-basis:0 + flex-grow:1)
        ueberstimmt die Inline-Breite, die Swiper jedem Slide setzt ->
        "Display Items"/"Items" wirkungslos, alle Karten gleichverteilt in
        einer Zeile (Dots rechnen trotzdem richtig). Slick hatte das per
        Inline-Gesamtbreite auf dem Track zufaellig ueberlebt.
        Fix Product List (Carousel): .customstyleID .swiper-slide.col
        {flex:0 0 auto; max-width:none} in product-list.liquid.
        Product List (Carousel) vom User BESTAETIGT (2026-07-10). ✔
        Product Tab danach gleich gefixt: identische Regel im Inline-Style
        von product-tab.liquid, greift nur im Carousel-Modus (Grid hat
        kein .swiper-slide). Live-Test Product Tab: Enable Carousel AN,
        Items 3 -> exakt 3 Karten ab 1201px, Pfeile blaettern seitenweise;
        Grid-Modus (Carousel AUS) unveraendert.
      → Nachtrag Boxhoehen (2026-07-10): Product List (Carousel) Karten
        unterschiedlich hoch je nach Inhalt (Swatches/Sale) - dem Carousel
        fehlte die Hoehen-Kette, die der Tab hat (.producttab-item
        height:inherit + h-100). Fix: .customstyleID .productlist-item
        {height:inherit} - .product-card (height:100%) fuellt den Slide
        dann direkt. Live-Test: alle sichtbaren Boxen gleich hoch wie
        beim Product Tab.
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
      → Nachtrag Mobile (2026-07-10): Disclaimer schwebte mobil zentriert und
        klebte am Badge. Ursache 1: Zentrier-Regel aus #8 setzte text-align:center
        ueber .small--text-center — die Klasse ist aber eine tote Legacy-Klasse
        ohne jede CSS-Regel im Theme, Preis/Badges bleiben mobil links → nur der
        Disclaimer war zentriert. Ursache 2: margin-top:-6px (Desktop-Kalibrierung)
        zog ihn mobil bis unter die Badge-Pill-Unterkante (Zeilenhoehe kommt vom
        Badge, Text laeuft breit bis darunter). Fix: Zentrier-Regel entfernt
        (immer text-align:left), mobil margin-top:3px statt -6px.
        Live-Test: Mobile → Disclaimer linksbuendig unter dem Preis, mit Luft
        zum Badge; Desktop unveraendert nah am Preis.

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

## 17. i18n Sprach-Default nachziehen (3 Stellen, die der grosse Patch 2f5fac6 ausliess)
- [~] Nachtrag (2026-07-10, 35f5448): Faqs Accordion "Subtitle Top" + "Title"
      aufgenommen - neue Keys general.defaults.faq_subtitle_top ("Noch
      Fragen?") + faq_title ("Haeufig gestellte Fragen") in allen 10 Locales;
      section-heading-Fallback-Parameter genutzt; Schema-Defaults ("Subtitle
      Top"/"Title FAQ") entfernt + Info "Leave empty to use the translated
      default". ACHTUNG Bestands-Instanzen: dort steht der alte Default-TEXT
      im Feld -> Feld einmal leeren, dann greift die Uebersetzung.
- [~] Theme Settings → "Reviews Above Titles": Review-Badge-Texte lokalisieren.
      → rating-custom.liquid: t1_text/t2_text/t3_text/content bekommen {% if blank %}
        -> | t Fallback mit BESTEHENDEN Keys (reviews_start_text_html,
        reviews_start_2_text_html, review_images_text_html, review_images_content;
        de/fr echt uebersetzt). settings_data.json: t1_text + t3_text (exakte
        EN-Defaults) geleert; t2_text ("+149") + content ("Recommended") sind
        abgewandelt -> unangetastet gelassen (strenge Scoping-Regel). Live-Test.
- [~] Slideshow 1 → "Rating Text": leer -> Shop-Sprache.
      → slideshow-1.liquid:1148 {% if blank %} -> | t 'general.defaults.rating_text';
        NEUER Key in allen 10 Locales ("Trusted by thousands." + Uebersetzungen).
        Template-Werte NICHT geleert (teils echte Zahlen wie "5.0"). Live-Test.
- [~] Footer → Menu-Block "Menu Title": leer -> statisch "Information" (alle Sprachen).
      → footer.liquid: linklist.title-Zwischenstufe + uebersetzter Default entfernt;
        override leer => hartkodiert "Information" (User-Entscheidung). Live-Test.

## 18. Produktmedien: Video-Anzeigeformat folgt "Image Ratio"
- [~] Bei gemischter Galerie (Fotos + Videos) soll das Video immer der "Image Ratio"
      (image_size: auto/portrait/square) folgen, nicht seinem eigenen Video-Format.
      → Ursache: Video-<deferred-media> setzte padding-top aus media.aspect_ratio
        (eigenes Format); im 'Adapt To Image'-Modus wich es damit von den Fotos ab.
        Fix (product-media.liquid): video_pt an image_size gekoppelt - square->100%,
        portrait->120%, auto->Ratio des ersten Produktbildes (product.images.first);
        3 Video-Container nutzen video_pt; Scoped-CSS object-fit:cover fuellt die Box.
        Thumbnails unveraendert (eigene image_size-Klassen). Live-Test.

## 19. i18n Textlaengen: lange Uebersetzungen zerstoeren Box-Layout (mobil)
- [~] A (Fokus) — Kurz-Uebersetzungen fuer platzkritische Badge-Keys, Ziel <=115%
      der EN-Laenge: 27 Ersetzungen in de/nl/da/pt-BR/pt-PT/fr/it.
      de: "Ausgezeichnet"->"Exzellent" (4 Keys), "basierend auf"->"aus",
      "Bewertet mit 4,8/5,0 auf"->"4,8/5,0 auf", "Verifizierte Bewertung"->"Verifiziert".
      nl: "op basis van 149+ beoordelingen"->"uit 149+ reviews" (reviews = gaengiges
      NL-E-Commerce-Wort) u.a.; da: "Fremragende"->"Topbedømt" u.a.; pt: "com base em"
      ->"em", "Nota 4,8/5,0"; fr/it: Einzelfaelle. 3 Reststellen bewusst belassen
      (nur 3-4 Zeichen ueber, freie Breite: es/it rated_on, nl rating_text).
- [~] B (Netz) — Ellipsis-Haertung nach dem Typ-1-Muster (Layout bricht NIE um,
      nur Text ellipsiert): layout/theme.liquid mobil <=768px fuer Review Typ 2
      (.rating-excellent-2) + Typ 3 (.review-excellent-2/.review_images_content,
      inkl. innerer <p>, stars flex:none); ad_sticky-cart.liquid
      (.sticky-add-to-cart__rating-text nowrap+ellipsis, alle Breiten).
      Gleiche Klassen in rating-custom.liquid UND product-template-1 -> beide gedeckt.
      Live-Test: de mobil Review-Badges 1-3, Sticky Bar, Testimonials.

## 20. Slideshow 1+2: Pfeile trotz "Enable Arrow" unsichtbar
- [~] Ursache: Positionierung (absolute/top/z-index) kam frueher aus der Slick-CSS
      (.slick-arrow); nach der Swiper-Migration (Track B) tragen die Buttons nur
      noch .slideshow__arrow -> lagen unsichtbar unter den Slides.
      → Fix b30e7be: Positionierungs-Basis in BEIDEN Slideshow-Sections ergaenzt
        (position:absolute, top:50%, z-index:10, flex-zentriert, button-reset);
        swiper-button-lock (1 Slide) versteckt, -disabled gedimmt. Skin (50px rund,
        Color/Background/Opacity-Arrow-Settings) unveraendert. Mobil <992px bleiben
        Pfeile designgemaess aus (Dots/Swipe).
      → Nachtrag (User-Feedback + Referenz-Theme summitfin_vorvanilla_x):
        1. Falsche Icons: generische SVG-Chevrons ersetzt durch Icomoon-Glyphen
           \e903/\e904 (= icon-arrow-left/right, die "smoothen" Theme-Pfeile) via
           :before wie vor der Migration, inkl. animateIcon-Hover (Keyframes
           existieren in theme.css + theme.css.liquid; Font laedt via font-icon.liquid).
        2. Pfeile nur bei >1 Slide: JS-Guard in theme.js (slides.length > 1),
           navigation nur wenn Buttons existieren.
        Live-Test.

## 20b. Slideshow: Transition-Animationen (Zoom/Slide&Fade) nicht wie vor Vanilla
- [~] Ursache 1: Swiper 6 Loop-Modus dupliziert Slides; nach dem Loop-Wrap springt
      loopFix instant vom Duplikat aufs Original -> dessen an .swiper-slide-active
      haengende CSS-Animation (Zoom scale 1.2->1, Slide-Fade translateX) startet
      sichtbar NEU (Ruck bei jedem Wrap; bei 2 Slides jede 2. Transition).
      Ursache 2: Swiper speed 800ms statt Slick-Default 300ms -> traeger.
      → Fix: theme.js _syncShown setzt Klasse 'slide-shown' auf Original UND
        Duplikat gleichzeitig (via data-swiper-slide-index == realIndex); CSS-
        Animationen um .slide-shown-Zwillinge ergaenzt (slideshow-1: zoom +
        slide-fade; slideshow-2: Text-Reveal mit aktiven 0.7s-Transitions).
        Bestehende .swiper-slide-active-Selektoren bleiben als Fallback.
        speed 800 -> 300 (Slick-Default).
      → Runde 2 (User: "springt nach ~1s zurueck" + "Text-Transitions anders"):
        1. RUECKSPRUNG-Ursache: onBlockDeselect rief autoplay.start() OHNE
           Autorotate-Gate -> Swiper startete Rotation mit 3s-DEFAULT-Delay,
           obwohl Auto-Rotate aus (Editor: Block anklicken -> deselektieren ->
           Slideshow laeuft von selbst). Fix: stop/start nur noch wenn
           inst.autorotate (Referenz rief slickPlay auch blind, aber mit 5s
           Section-Speed statt 3s Default - jetzt sauber gegated).
        2. TEXT-TRANSITIONS: Slick-Fade legte den EINGEHENDEN Slide ueber den
           sichtbaren alten (kein Doppel-Crossfade beider Texte). crossFade
           true -> false (= Slick-Look). Kind-Transitions waren auch im
           Referenz-Theme auskommentiert - Text faehrt mit dem Slide-Fade.
        3. fade/zoom/slide-fade jetzt ganz OHNE Swiper-Loop (Slick-fade hatte
           nie Klone): loop nur noch fuer transit 'slide'; Endlos-Wrap manuell
           in den Pfeil-Handlern (isEnd->slideTo(0), isBeginning->letzter);
           Autoplay wickelt via stopOnLastSlide:false selbst zurueck.
           Eliminiert loopFix-/Duplikat-Bugklasse komplett.
        Live-Test im Editor UND Storefront: Slide wechseln -> darf NICHT mehr
        von selbst weiterspringen (ausser Auto-Rotate an); Zoom + Slide&Fade
        mehrere Durchlaeufe inkl. Wrap.

## 22. Slideshow 1: Content-Fade-Animation (Feature, User-Spec 2026-07-09)
- OBSOLET / RUECKABGEWICKELT (2026-07-10, siehe #34): User-Entscheidung -
  Animationen sollen visuell EXAKT dem alten Theme entsprechen. Der
  Content-Fade (Ganzblock-Opacity + Loading-Gate) wurde entfernt und durch
  den reaktivierten Original-Text-Stagger ersetzt.
- [~] (historisch) ALLE Slide-Inhalte (Review-Badge "Reviews Type", Top Title, Heading,
      Texte 1-3, Buttons, "Activate Review Badge"-Rating) blenden weich ein
      (0.5s) - beim Laden der Sektion und bei jedem Slide-Wechsel. Bilder
      behalten ihre "Transition". Der Fade startet erst NACHDEM die Loading
      Animation (Theme Settings) vollstaendig fertig ist.
      → Umsetzung:
        1. slideshow-1.liquid: @keyframes slideshowContentFade; Container
           .slideshow__text-content (traegt ALLE Inhalte) opacity:0 ->
           Animation 0.5s ease both, wenn Slide aktiv (.swiper-slide-active/
           .slide-shown) UND html:not(.loading-anim-wait). Mobile-Panel
           (.slideshow__text-content--mobile, per display umgeschaltet):
           Animation startet bei jedem Sichtbarwerden neu. Scoped per
           data-section-id (Slideshow 2 unberuehrt). no-js-Fallback opacity:1.
        2. loading_animation.liquid: setzt 'loading-anim-wait' auf <html>
           beim PARSEN, entfernt sie erst nach vollstaendigem Ende der
           jeweiligen Variante (V1: 1s Fade / V2: 2.5s / V3: 2s) + Event
           'theme:loading:done' + 8s-Notausstieg. Snippet nicht gerendert
           (deaktiviert/nicht Homepage) -> Klasse existiert nie -> Fade sofort.
           NEBENBEI-FIX: Tippfehler 'fadout' -> Variante 1 poppte hart weg
           statt 1s zu faden.
        3. theme.js: Fail-safe ohne Swiper -> Slide 1 bekommt Aktiv-Klasse.
        Gecheckt: AOS (keep-libs.js + header-oncss) faded das INNERE div
        einmalig bei Load (once:true, endet bei opacity:1) - kollidiert nicht
        mit dem Container-Fade. Live-Test: Load mit/ohne Loading Animation
        (alle 3 Varianten), Slide-Wechsel Desktop + Mobile.

## 23. Default-Uebersetzungen: Sie- -> Du-Form (theme-weit, User 2026-07-09)
- [~] Formelle Anrede auf informell umgestellt. Umfang (User: "Alle"):
      de (51 Strings, Du/Dein GROSS), fr (73: vous/votre + 22 vous-Imperative
      ohne Pronomen -> tu), nl (23: u/uw -> je/jij/jouw). NICHT angefasst:
      es/it/da (schon du-Form), pt-BR/pt-PT ("voce/seu" = Standard, User: so
      lassen), ja (Keigo, User: lassen).
      → Wertbasierte 1:1-Exakt-Ersetzung auf Roh-JSONC (Kommentar-Header +
        Format erhalten; git numstat 51/51, 73/73, 23/23). Verb-Konjugation
        mit-konvertiert (de "Aktivieren Sie"->"Aktiviere"; fr "Inscrivez-vous"
        ->"Inscris-toi", "Utilisez"->"Utilise", "Veuillez X"->"X"-Imperativ).
        Verifikation: 10/10 Locales valide JSON; Rest-formell-Scan = 0 in
        de/fr/nl (inkl. fr -ez/faites/dites/soyez/veuillez). Timer-Ausloeser
        (general.cart.timer_title) in allen 3 erledigt.
      → OFFEN/Nebenbefund: Theme-Setting-Default timer_countdown_text in
        settings_schema.json ist englisch ("We can reserve your order for
        [time] minutes"); der Merchant-Wert kann den Locale-Key ueberschreiben.
        Bei Live-Test pruefen welcher greift; ggf. Setting-Default nachziehen.

## 24. Password Page: "Color" faerbt nicht alle Texte + Label umbenennen
- [~] Setting "Color" (color_pass) soll ALLE Textfarben der Passwortseite steuern
      (Header + Content + Footer + Login-Modal), nicht nur eine enge Element-Liste.
      Label "Color" -> "Text Color".
      → Fix (password-header.liquid): enge Regel (h1-h6,p,a,.text-white,...) ersetzt
        durch .template-password-page *:not(.btn-white):not(.btn-theme):not(input)
        {color:var(--g-pass)!important} + color:var(--g-pass) als Erbbasis auf
        .template-password. Deckt span/li/div/label/Footer/Social-Labels/powered-by/
        Modal-Text. Ausgeschlossen: gefuellte Buttons (btn-white/btn-theme behalten
        Markenfarbe var(--g-btn-outline-color)) und Eingabefelder (Lesbarkeit auf
        hellem Feld). Icons erben currentColor. Schema-Label -> "Text Color"
        (id color_pass unveraendert = kein Wertverlust). Live-Test: Textfarbe
        aendern, alle Bereiche pruefen; ABONNIEREN-Button + Passwortfeld lesbar.
      → Runde 2 (User: Headings blieben rot): Theme malt ALLE h1-h6/.h1-.h6 per
        Gradient-Clip (theme.css ~3284: background:var(--g-color-heading) +
        background-clip:text + -webkit-text-fill-color:transparent) - Glyphen
        sind transparent, color ist dort wirkungslos. Fix: -webkit-text-fill-
        color:var(--g-pass)!important in derselben Regel -> opake Fuellung
        uebermalt den Clip, Headings folgen jetzt ebenfalls der Text Color.
        Live-Test: Shopname, Heading, "We will launch soon.", "Spread the word"
        muessen alle mitgehen. -> Vom User BESTAETIGT ("jetzt klappts").
      → Runde 3 (User: Buttons wieder entkoppeln): -webkit-text-fill-color ist
        VERERBBAR - trotz :not()-Ausnahme erbten Buttons/Inputs die Fuellfarbe
        vom Elternelement (ABONNIEREN + Email-Placeholder folgten der Text
        Color). Fix: explizite Entkopplungs-Regel .btn-theme/.btn-white/input/
        input::placeholder { -webkit-text-fill-color: currentColor !important }
        -> Fuellung haengt wieder an der EIGENEN Buttonfarbe (Markenfarbe).
        Live-Test: ABONNIEREN + Passwort-Submit in Markenfarbe, Placeholder
        grau, alle uebrigen Texte weiter an Text Color gekoppelt.

## 25. Product-Card-Icons werden beim Hovern weiss (theme-weit)
- [~] Warenkorb/Schnellkauf/Wishlist/Compare-Icons auf den Produktkarten sprangen
      beim Hovern auf "Button Text Hover" (#fff2f4, fast weiss) -> unsichtbar auf
      weissem Kreis. Sollen statisch schwarz (Heading-Farbe) bleiben.
      → Ursache: Icon-Buttons tragen .btn-theme -> globale Regel .btn-theme:hover
        {color:var(--g-btn-hover-color)} (theme.css.liquid:2297, fuer echte
        Text-Buttons gedacht) schlaegt .product-card__overlay-btn (Spezifitaet).
        Betroffen: 41 Buttons in product-card.liquid (alle Hover-Styles 1-11) +
        collection-blank + swatch-grid-2, sichtbar an ~20 Renderstellen.
      → Fix: .product-card__overlay-btn:hover/:focus pinnt color auf
        rgba(--g-color-heading-rgb) !important - in BEIDEN Dateien (theme.css +
        theme.css.liquid). Haelt auch gegen hover_2/hover_3-Animationen; globale
        Text-Button-Hover-Regel unangetastet; Style-5 "Button Box" gewinnt weiter
        (hoehere Spezifitaet). Wishlist-Aktiv-Zustand geprueft: existiert nicht,
        keine Nebenwirkung. Live-Test: Karten-Icons hovern (Collection/Listen/
        Megamenu) -> Icon bleibt schwarz; Produktseiten-CTA hovert weiter normal.

## 26. Scratch Newsletter Popup: Logo-Toggle + Theme-Verknuepfung (User 2026-07-10)
     ✔ BESTAETIGT vom User 2026-07-10 ("hat geklappt, perfekt") — alle 3 Punkte.
- [x] 1. "Logo text"-Setting entfernt -> Checkbox "Show shop logo" (default an)
        + image_picker "Logo image" als Override (User-Nachtrag 2026-07-10).
        Logo-Kette: Upload (logo_image) -> B1-Metaobject-Slot 2 ->
        shop.brand.logo (Admin -> Einstellungen -> Marke); Text-Fallback
        shop.name wenn nirgends ein Logo existiert. CSS fuer Logo-Bild
        ergaenzt (max-height 32px). Verwaister logo_text-Wert aus
        settings_data.json entfernt.
     2. Popup-Hintergrund an Theme Settings -> Page -> "Page Background"
        gekoppelt: .scnl__box background: var(--color-body, #F5F2EB).
     3. Typography aus Theme Settings: Basis-Font -> var(--g-font-2) (Body),
        Serif-Elemente (.scnl__serif, Logo-Text) -> var(--g-font-1) (Heading);
        Inputs/Buttons erben (font-family:inherit). Hinweis: Der Text AUF der
        Rubbelfolie ist Canvas-Grafik (kein CSS) und bleibt Helvetica.
        Live-Test: Toggle an/aus, Page Background aendern, Fonts pruefen
        (Scratch- UND Regular-Modus).

## 27. Slideshow 1+2: Bild verschwindet bei deaktiviertem Video-Toggle + Resttext
- [~] Enable Video AUS + Text im "Video"-Feld (video_hosted) -> Slide leer statt
      Bild. Ursache: if/elsif-Kette waehlte den Branch allein nach FELD-INHALT;
      der Toggle wurde erst INNERHALB des video_hosted-Branches geprueft ->
      Branch verbraucht, Bild-Branch nie erreicht. Zudem ignorierte der
      Video-Picker-Branch (block.settings.video) den Toggle komplett.
      → Fix: enable_video in BEIDE Branch-Bedingungen gezogen
        ({% if enable_video and video != blank %} / {% elsif enable_video and
        video_hosted != blank %}); inneres if/endif entfernt. Toggle aus =>
        immer Bild, egal was in den Video-Feldern steht; Toggle gilt jetzt
        auch fuer den Picker. Slideshow 2 (gleiche Weiche, hatte gar keinen
        Toggle): enable_video-Checkbox ergaenzt mit default TRUE (update-
        sicher: Bestands-Slides mit Video spielen weiter). Nebenbei: autoplay-
        Attribut im Picker-Branch nutzte unzugewiesene Variable -> normalisiert.
        Live-Test: Toggle aus + Text im Feld -> Bild erscheint; Toggle an +
        Video -> Video; Slideshow 2 gleiches Verhalten.

## 28. Slideshow 1: Top Title mobil nicht zentriert (bei Replace-Review-Toggle AUS)
- [~] Mobile Zentrierung laeuft ueber explizite Element-Liste mit !important
      (noetig, weil der Wrapper die Desktop-Ausrichtung als Bootstrap text-left
      !important traegt). Die Liste deckte rating-custom (= Badge bei Toggle AN),
      Title, Subtitle, Pills, Buttons - aber NICHT .slideshow__toptitle.
      Toggle AUS -> Top Title statt Badge -> erbt text-left -> klebt links.
      → Fix: .slideshow__toptitle in die Zentrierungs-Liste aufgenommen
        (slideshow-1.liquid, @media max-749px). Nur mobil, Desktop-Ausrichtung
        unveraendert. Live-Test: Replace AUS + Top Title gesetzt -> mobil
        zentriert; Desktop "Middle Left" weiter linksbuendig.

## 29. Promo Sale: Content-Uebersetzungen kuerzen
- [~] "Product Overview" -> "Promo Sale" -> Content-Default (Locale-Key
      products.product.promo_subtitle, Zeile 426 in allen Locale-Dateien)
      lief zu lang und brach in der Promo-Box um. User-Vorgabe (de):
      "Sichere dir deinen Rabatt, solange er gilt:" -> "Sichere dir deinen
      Rabatt:". Muster auf alle Sprachen angewandt (der "solange es gilt"-
      Zusatz ist neben dem Countdown redundant): en "Claim your discount:",
      da "Få din rabat:", es "Aprovecha tu descuento:", fr "Profite de ta
      réduction :", it "Approfitta dello sconto:", nl "Profiteer van je
      korting:", pt-PT "Aproveite o seu desconto:", pt-BR "Garanta seu
      desconto:". ja war bereits kurz -> unveraendert. Alle 10 Dateien
      JSON-geparst OK. Live-Test: Promo-Sale-Block ohne Content-Override
      -> kurzer Text einzeilig ueber dem Countdown.

## 30. Swiper-Sektionen-Audit (Product List Carousel / Swiper / Product Tab)
- [~] Vollaudit aller Settings der 3 Sektionen (2026-07-10), 16 Findings,
      davon 9 auf User-Auswahl gefixt (je 1 Commit):
      F1 6844f0a Draggable wirkte nur auf den Cursor - simulateTouch jetzt
         gekoppelt (Carousel + Tab); Touch-Swipe bleibt an.
      F2 0ea08cf "Rows" war seit Slick-Migration tot - reaktiviert via
         Swiper-6 slidesPerColumn (Fill row). Guards: autoHeight aus bei
         2 Rows (clippte Reihe 2), loop aus (Multirow inkompatibel),
         height:inherit der Slides nur bei 1 Row (Liquid-gated).
      F3 61de54d watchOverflow im SwiperCustom - keine toten Pfeile/
         Scrollbar bei Limit <= Per View (gilt auch product-wrap-banner
         + featured-collections-3, dort nur Verbesserung).
      F4 979b13b a11y im Product List Carousel war als einziges aus -> an.
      F5 ff96212 rating-custom Review Type 3: ':1px solid' ohne Property
         entfernt; Border nur noch bei nicht-transparenter t3_border_color
         (vorher immer 1px, ggf. transparent).
      F6 a06e2ac Breakpoint-Leiter Floor 2: bei Items 3 zeigte 481-992px
         nur 1 Karte, <481px aber 2. Jetzt monoton (2/2/2/3 bzw. 2/3/4/5...).
      F8 01b6e69 Banner-Snap-Versatz: data-spv-auto nur bei Enable Banner ->
         slidesPerView:'auto' misst echte Breiten; Kartenbreiten per CSS
         (>=992: (100%-Banner%-Gaps)/(PerView-1); 750-991: /2; <750 Mobile-
         CSS 74%). Andere swipercustom-Sektionen byte-identisch (Ternary).
      F10 51bc50a Grid Items=5 zeigte 750-991px fuenf Spalten (row-cols-5
         schaltet global erst <750) -> scoped auf 2 Spalten angeglichen.
      F11 75eb0a0 Same Height Default true (Product List Swiper) - gleiche
         Boxhoehen jetzt Standard; Bestands-Instanzen ohne gespeicherten
         Wert wechseln mit (gewollt).
      NICHT gefixt (User-Auswahl): F7 (PerView-Desktop vs. fixe Tablet-
      Breakpoints), F9 (Space Between mobil fix 20px), F12-F16 (Kosmetik:
      nowrap-Naming, tote Slick-Reste, Schema-Defaults, Grid zeigt tote
      Settings, doppelte AOS-Verschachtelung).
      Live-Test: (1) Draggable AUS -> kein Maus-Drag mehr; (2) Rows=2 +
      Carousel -> 2 Reihen, kein Infinite; (3) Swiper-Variante Limit 3 /
      Per View 5 -> Pfeile+Scrollbar weg; (4) Review Type 3 ohne Border-
      Farbe -> randlos; (5) Tablet 481-992 -> 2 Karten statt 1;
      (6) Enable Banner an -> Blaettern rastet sauber; (7) Tab Grid
      Items=5 auf Tablet -> 2 Spalten; (8) Swiper-Variante -> Boxen
      gleich hoch (Same Height default an).

## 31. Slideshow-1-Vollaudit (alle Settings, Desktop + Mobile-Panel)
- [~] Vollaudit 2026-07-10, 21 Findings (S1-S21), S1-S16 auf User-GO gefixt
      (je 1 Commit). Kontext: Mode A = "Show Text Look Like Desktop" AN
      (Desktop-Text auch mobil), Mode B = AUS (separates weisses Panel).
      S1 26b47b6 Panel-Buttons zeigten Stand des LETZTEN Slides (stale
         Liquid-Assigns show_link_button-1/-2 aus dem Desktop-Loop) ->
         pro Panel-Block neu berechnet.
      S2 eea1304 Mobile Height "Adapt To First Image" war tot (Klasse ohne
         CSS -> 100vh) -> Hoehe aus Aspect Ratio des ersten Slides
         (Image Mobile vor Image 1), instanz-scoped.
      S3 6ce57c1 "Text Size Mobile" (Icons) war tot -> --mobile-size wird
         jetzt <=749px konsumiert.
      S4 083424a Review Badge fehlte im Mobile-Panel komplett -> ergaenzt
         (ohne slideshow__btn-Klasse, eigene Gradient-IDs).
      S5 031fa06 Icon "None" renderte leere Icon-Luecke -> Icon-Element
         wird uebersprungen, Text-Pille bleibt (Desktop + Panel).
      S6 4e36cad Arrow-/Dot-Farben + Rotate-Speed lagen auf :root ->
         letzte Instanz gewann fuer alle. Auf data-section-id gescoped.
      S7 eb73b53 mobile-align galt bis 768px, Rest der Sektion bis 749px ->
         Band 750-768 verschob den Desktop-Text. Auf 749 angeglichen.
      S8 384280c aria-describedby zeigte auf nicht existente ID ->
         visually-hidden Info-Element (navigation_instructions, pro
         Instanz); totes data-slide-nav-a11y ersetzt durch data-prev/
         next-label (sections.slideshow.previous/next_slide, in allen
         10 Locales vorhanden), JS nutzt sie fuer die Pfeil-aria-labels.
      S9 514719c Schema-Info: "Enable Arrow" wirkt nur Desktop (<992 hidden).
      S10 1675744 Dots nur bei >1 Slide (wie Pfeil-Guard); pagination-Opt
         haengt jetzt am Element statt am Toggle.
      S11 3711fb5 mobile-align-Klasse am Panel war immer leer (block=nil
         ausserhalb des Loops) -> entfernt; Schema-Info an Text Alignment
         (Mobile): wirkt nur in Mode A.
      S12 e017492 Icons-Zeile (li mit pb-1/mb-lg-4) renderte auch komplett
         leer -> nur wenn mind. ein Selling-Point-Text gesetzt (beide Modi).
      S13 cb82f01 Alle Videos liefen permanent -> _syncVideos spielt nur den
         aktiven Slide (twin-sync wie _syncShown), Rest pausiert;
         prefers-reduced-motion stoppt Autorotate + Videos (WCAG);
         onBlockDeselect-Guard gegen 3s-Default-Delay-Falle erweitert.
      S14 3db320d Align-Case 'right *' mappte auf justify-content-start
         (vom .text-right-!important maskiert) -> -end.
      S15 8754be0 rating-custom im Panel bekam align aus nicht existentem
         section.settings.align_heading -> 'center'.
      S16 aee5705 Panel-Existenz pruefte nur Titel/Subheading/Button 1 ->
         jetzt auch Toptitle/Review-Box/Badge/Button 2/Icons; JS versteckt
         den Panel-Wrapper, wenn der aktive Slide kein Panel hat (vorher
         leere weisse Leiste bei Mehr-Slide-Shows).
      NICHT gefixt (Kosmetik, User-Auswahl): S17 tote Klassen/Regeln
      (transit-*, slideshow__arrows--mobile, leere Regel Z.224), S18 tote
      icons_color-Var + em/rem-Label, S19 Doppel-Fade (AOS + Content-Fade),
      S20 tote section.settings.show_overlay-Referenzen (Z.918/946),
      S21 fehlende rgba-Guards bei mobilen Toptitle-/Subheading-Farben.
      Hinweis: slideshow-2.liquid hat mehrere der gleichen Muster (u.a.
      :root-Vars, aria-describedby) - bewusst nicht angefasst, kommt beim
      Split #21 bzw. auf Zuruf.
      Live-Test: (1) Mode B: Buttons pro Slide korrekt, Badge sichtbar,
      keine leere Leiste bei Slides ohne Panel; (2) Mobile Height adapt
      passt sich dem 1. Bild an; (3) Icons Text Size Mobile wirkt; (4) Icon
      None ohne Luecke; (5) 2 Instanzen mit verschiedenen Pfeil-/Dot-Farben
      bleiben verschieden; (6) 750-768px: Desktop-Text bleibt zentriert;
      (7) Nur aktiver Video-Slide spielt; (8) 1-Slide-Show ohne Dot.

## 32. "Popup Newsletter" restlos entfernt (NICHT Scratch Newsletter)
- [~] Sektion newsletter-popup komplett aus dem Theme entfernt (2026-07-10):
      GELOESCHT: sections/newsletter-popup.liquid, snippets/pnew-1/2/3.liquid,
      snippets/show-newlleter.liquid (Header-Trigger-Button "Get 10% Off").
      BEREINIGT: layout/theme.liquid (section-Aufruf raus, scratch-newsletter
      bleibt), sections/header.liquid (Trigger-Render + enable_popuptext-
      Trennstrich raus), snippets/header-js.liquid (theme.timePopupNewsletter-
      Global raus - las settings.pnewletter_time, das im Schema gar nicht mehr
      existierte), assets/theme.js (Komponente popupNewletter + Registrierung),
      config/settings_schema.json (Header "Text Popup Newsletter" +
      enable_popuptext + enable_popuptext_new), config/settings_data.json
      (Sektions-Instanz "newsletter-popup", Theme-Keys popupnewsletter/
      pnewletter_* und enable_popuptext_* - jeweils in current UND presets),
      theme.css + theme.css.liquid (btn-newletter aus Shared-Selektor,
      modal-dialog--newsletter/pnewsletter-Bloecke/bg-newsletter/
      popup-newsletter--content).
      Verifiziert: JSON-Parses OK, JS-Syntax OK, CSS-Klammern beide Dateien OK,
      check-theme.mjs 95 Sections ohne Missing-Section-Befund, Repo-weite
      Restsuche leer (nur historische dev-tools-Doku erwaehnt sie noch).
      Hinweis: B1-Metaobjekt-Slot 'newsletter-popup' (section_fallback) ist
      jetzt verwaist - kann im Shop-Admin geloescht werden, stoert aber nicht.
      Der Client-Cookie "cookiesNewsletter" bei Bestandsbesuchern laeuft aus.
      Live-Test: Editor oeffnen -> "Popup Newsletter" taucht nirgends mehr auf
      (weder als Sektion noch unter Theme Settings), Scratch Newsletter Popup
      funktioniert unveraendert, Header/Compare-Button ohne Layout-Aenderung.

## 33. Product List (Carousel) + Product Tab: Dots unter die Box
- [x] ✔ BESTÄTIGT vom User (2026-07-10, nach d2b5504). Der "weiterhin
      unsichtbar"-Zwischenbefund kam vom zweiten Shop (Ducky) mit nicht
      aktuellem Theme-Stand; Headless-Browser-Messung hatte Runde 2 als
      korrekt verifiziert (Dots sichtbar, padding 35px, bottom 8px).
      Merke: Bei Tabs/Listen mit <= "Items" Produkten versteckt Swipers
      watchOverflow-Lock Dots UND Pfeile absichtlich (nichts zu blaettern).
- Historie: Dots lagen INNERHALB der Produktbox (Swiper-CSS: bullets absolut
      bottom:10px im Container) statt darunter. Das alte Slick-Pattern
      (dots-negative -> bottom:-25px + Container-Margin 30px) existierte
      noch, zielte aber auf die tote .slick-dots-Klasse. Auf die Swiper-
      Pagination portiert. Runde 1 (bottom:-25px + margin) machte die Dots
      UNSICHTBAR (lagen ausserhalb des Containers -> von Folgesektion
      verdeckt/geclippt, User-Screenshot). Runde 2: Platz IM Container
      reservieren - padding-bottom:35px + position:relative auf dem
      Container (nur bei gerenderten Dots via :has), Bullets bottom:8px an
      der Container-Unterkante. So kein Verdecken/Clipping moeglich. In
      BEIDE CSS-Dateien (theme.css + theme.css.liquid). Live-Test: Dots
      beider Sektionen sichtbar mittig direkt unter den Karten; Dots AUS
      -> kein zusaetzlicher Abstand; Product Tab auch nach Tab-Wechsel.

## 34. Slideshow 1: Original-Animationen wiederhergestellt (Slick-Paritaet)
- [~] User-Auftrag: Animationen visuell EXAKT wie im alten Theme (Referenz:
      old-import-safe.zip, Slick-basiert). Audit ergab 4 Abweichungen:
      D1 Text-Stagger-Reveal war seit dem Juni-Export auskommentiert
         (Loop-Duplikat-Restarts als mutmasslicher Grund) -> Texte poppten
         instant; stattdessen lief der Ganzblock-Content-Fade (#22).
      D2 speed:300 statt Slick-Default 500 (mein Fehlkommentar "Slick-
         Default 300ms" - vendor.js sagt speed:500).
      D3 Loading-Gate (#22) existierte nur neu.
      D4 Button-Hover-Transition (0.4s bg/color/border) mit auskommentiert.
      FIX: (1) Original-Stagger reaktiviert - transform 0.7s
      cubic-bezier(.29,.63,.44,1), Delays Toptitle .1s / Title .3s /
      Subtitle .4s / Button .5s + Button-Farbtransition, Werte 1:1 alt;
      einzige bewusste Abweichung: .slide-shown-Twins zusaetzlich in den
      Selektoren (Loop-Restart-Schutz im Transition-Modus "Slide").
      (2) Content-Fade #22 komplett entfernt (Keyframes, opacity:0-Basis,
      Gate-Regeln, Mobile-Panel-Regel) -> kein Warten auf Loading Animation
      mehr, wie im Original. (3) theme.js speed 300 -> 500.
      Zoom-CSS (1.8s) und Slide&Fade-CSS (0.6s/60ms/10vw) waren bereits
      identisch. Nur slideshow-1; slideshow-2 auf Zuruf.
      Live-Test: alle 4 Transitions durchschalten - Texte wachsen wieder
      zeilenweise gestaffelt von unten aus ihren Masken (~1,2s Dramaturgie),
      Blende/Slide spuerbar ruhiger (500ms), kein Ruecksprung/Restart beim
      Loop-Wrap im Slide-Modus, Texte erscheinen sofort ohne Loading-Warten.
      Nachtrag Badges (2026-07-10): Review-Box (Replace Subtitle Top With
      Review; via gemeinsamer Klasse .reviews-block aller 3 Review-Typen)
      und Selling-Point-Pills (.c_icon_item) in den Stagger eingereiht -
      beide existieren im Alt-Theme nicht (spaetere Erweiterungen), hatten
      also nie eine Animation. Review-Box Delay .1s (Toptitle-Slot), Pills
      .45s (Zwischenslot wie __info in slideshow-2), gleiche 0.7s-Kurve +
      slide-shown-Twins. Der 4.8-Badge (Activate Review Badge) staggerte
      bereits ueber .slideshow__btn. Slideshow 2: bereits auf Paritaet
      (Stagger nie stillgelegt, kein Content-Fade, speed via geteilter
      JS-Komponente) - dort nichts zu tun.

## 35. Slideshow 1: Setting "Badges Animation" (Feature)
- [~] Neues Select direkt unter "Transition" (id anim_badges), steuert NUR
      Review-Box (.reviews-block) + Selling-Point-Pills (.c_icon_item):
      Slide Up (Default, = der Stagger aus #34-Nachtrag), Slide From Right
      (3f431fb: 48px von rechts reinrutschen + Einblenden), Fade (reines
      Einblenden, gleiche 0.7s-Kurve + Delays .1s/.45s), None (statisch,
      keine Regeln emittiert). Liquid-gated im Section-CSS; Default
      slide-up = aktuelles Verhalten fuer Bestands-Instanzen. Live-Test:
      alle 3 Optionen durchschalten (Editor rendert Section-CSS bei
      Setting-Wechsel neu), Text-Stagger der uebrigen Elemente bleibt
      unveraendert.

## 36. Slideshow: Auto-Rotate tot nach Editor-/Vorschau-Refresh
- [~] Symptom: Rotation laeuft beim ersten Oeffnen, nach Refresh nicht mehr
      (Editor UND "normale Vorschau" - die Vollbild-Vorschau aus dem
      Customizer laeuft weiter im Design Mode, gleiche Event-Bruecke).
      Audit: purer Storefront-Reload im Headless-Harness nachweislich sauber
      (autoplay.running true + Weiterdrehen vor UND nach reload). Ursache:
      der Customizer restauriert die Section-/Block-Auswahl nach Refresh und
      feuert shopify:block:select erneut (evt.detail.load === true) ->
      onBlockSelect stoppte Autoplay bedingungslos, Restart erst bei
      manuellem Deselect. Altes Theme hatte dasselbe Verhalten (slickPause
      bedingungslos) - keine Regression, aber stoerend.
      Fix ce74ab6: Load-Restore-Selects (detail.load) stoppen nicht mehr;
      aktive User-Selektion pausiert weiterhin (Editor-UX), Deselect startet.
      Live-Test: Editor mit selektierter Slideshow refreshen -> Rotation
      laeuft; Slide-Block aktiv anklicken -> pausiert; woanders klicken ->
      laeuft weiter. Falls es auf einem echten Share-Preview-Link (ausserhalb
      des Customizers) weiterhin auftritt: Konsolen-Probe aus dem Chat.

## 37. Testimonial Slider Auto: Produkt-Thumbnail oval statt Box-Form
- [~] Thumbnail im Card-Footer (45px) wurde vom globalen "Enable Radius
      Image" (.container img { border-radius: calc(0.2rem*Range) !important },
      header-css.liquid) zur Ellipse gerundet. User-Wunsch: exakt die Form
      der Card-Boxen (5px wie .review_footer/.reviewbox-rating-i).
      Fix 0c972ab: .review_footer img -> 45x45 object-fit:cover,
      border-radius:5px !important (ueberstimmt die globale Regel), flex-fix.
      Gilt auch fuer den B1-Brand-Fallback (gleicher Selektor). Live-Test:
      Thumbnails quadratisch mit 5px-Ecken, Hoch-/Querformat-Bilder sauber
      beschnitten.

## 38. Slideshow 2 nachgezogen (Ports) + Mini-Audit
- [~] PORTIERT (2026-07-10): 0ee7717 "Badges Animation"-Setting (#35) -
      opacity-basiert im Stil der Sektion (Review-Box liegt hier ohne
      li-Maske direkt im ul), Optionen Slide Up (translateY 32px) /
      Slide From Right (translateX 80px, Default - passt zum horizontalen
      Text-Stagger) / Fade (1s) / None; Delays Review .2s, Pills .45s;
      instanz-gescoped + slide-shown-Twins. 48d9003 S6-Port (:root ->
      data-section-id). 51415b8 S8-Port (aria-describedby-Ziel existiert,
      data-prev/next-label statt totem data-slide-nav-a11y).
      Automatisch via geteilter JS: #36 Autoplay-Refresh, S10 Dot-Guard,
      S13 Video-Pause, speed 500, S16-JS (keine leere Panel-Leiste).
- [~] MINI-AUDIT-FINDINGS ALLE GEFIXT (2026-07-10, "Fix alles aus 2"):
      Z3 d31a3ef Icon-None-Luecke; Z4+Z1 4c34fac Icons-Zeile-Gate + Panel-
      Existenz (beide Aenderungen in EINEM Commit gelandet - Z1-Edit war
      beim Z4-Commit bereits gestaged); Z5 c94eb9f rating-custom-align
      (Desktop = Slide-Ausrichtung, Panel = center); Z6 03c93a5 Mobile
      adapt-Hoehe; Z7 e69c4e0 Align-Case right->end; Z8 ecddfb4 Kosmetik.
      Wartet auf Live-Test. Urspruengliche Findings-Liste:
      Z1 (S16-Klon) Panel-Existenz prueft nur Titel/Button 1 (subheading
         ist auskommentiert) - Slides mit nur Toptitle/Review-Box/Pills/
         Button 2 bekommen kein Mobile-Panel.
      Z2 KEIN S1-Bug: Panel-Loop berechnet show_link_button-1/-2 korrekt
         pro Block neu.
      Z3 (S5-Klon) Icon "None" rendert leere Icon-Luecke (list-svg ohne
         none-Zweig).
      Z4 (S12-Klon) Icons-Zeile (li pb-1 mb-lg-3) rendert auch komplett
         leer -> toter Abstand; Mobile-Panel-Pendant ebenso.
      Z5 (S15-Klon) rating-custom align aus nicht existentem
         section.settings.align_heading (Desktop Z.777 + Panel Z.1042).
      Z6 (S2-Klon) Mobile Height "Adapt To First Image" ohne CSS-Regel
         -> 100vh.
      Z7 (S14-Klon) Button-Align-Case 'right' -> -start, maskiert durch
         !important-CSS (Z.38).
      Z8 Kosmetik: auskommentierte Subheading-Bloecke referenzieren nicht
         (mehr) existente Settings; doppelte .c_icon_item-svg-Regel; leere
         vertical-center-Regel; slideshow__arrows--mobile-Reste.
      Hinweis (Design-Differenz, kein Bug): Slideshow 2 zeigt Pfeile auch
      <992px (nur repositioniert), Slideshow 1 versteckt sie dort.

## 39. Testimonial Slider Auto: Footer + Badges sticky unten in der Box
- [~] Inhalt floss von oben - bei kurzen Review-Texten hingen Badges und
      Footer (Bild/Titel/Datum/Verifiziert) pro Karte auf unterschiedlichen
      Hoehen, Leerraum unten (User-Screenshot). Fix: Karte height:100%
      (fuellt den gleich hohen Slide), .cs_review flex:1 (Text dehnt sich
      als Mittelteil), .review_badges margin-top:auto (Anker greift auch
      bei leerem Text). Badges + Footer liegen jetzt in JEDER Karte buendig
      unten. Live-Test: Cards mit kurzem vs. langem Text nebeneinander ->
      Badges-Zeile und Footer-Box auf identischer Hoehe ueber alle Karten.

## 40. Header-Logo: max-height-Absicherung
- [~] site-logo.liquid: .site-header__logo img hatte nur width (Setting
      logo_max_width) - ein hochkant hochgeladenes Logo konnte den Header
      beliebig hoch machen. Fix: max-height:100px + object-fit:contain -
      Box-Breite bleibt (Layout stabil), Logo skaliert proportional rein,
      Header-Hoehe gedeckelt, egal was hochgeladen wird. Live-Test:
      extrem hochformatiges Logo hochladen -> Header bleibt normal hoch,
      Logo proportional; normales Querformat-Logo unveraendert.

## 41. Product Overview Collage 1+2: Spalten-Unterkanten buendig (98bab24)
- [~] Bild- und Infospalte waren unabhaengig hoch - letztes Collage-Bild
      links und Banner (Image-Block) rechts endeten leicht versetzt
      (User-Screenshot, Collage Style 2). Fix (nur Desktop >=768px, pro
      Instanz gescoped, product-template-1.liquid): beide Spalten fuellen
      die Row-Hoehe. Rechts laenger -> Bildzeilen strecken sich
      (align-content:stretch, Wrapper height:100%, img object-fit:cover =
      leichter Crop); links laenger -> letzter Info-Block wird per
      margin-top:auto unten angepinnt (Luecke entsteht dann OBERHALB des
      Banners). Zeilen-Gutter via row-gap statt margin-bottom (kein
      16px-Nachlauf). Trade-off dokumentiert und vom User abgenommen (GO).
      Live-Test: Collage Style 2 mit Banner -> Unterkanten identisch;
      Gegenprobe mit langer Galerie/kurzer Infospalte.

## 42. Testimonial Slider Auto: Karten-Unterkanten immer gleich hoch (7e21daf)
- [~] Karten endeten je nach Textlaenge auf verschiedenen Hoehen. Ursache:
      .review-slider-i (= der Swiper-Slide selbst) hatte height:100% (aus
      #39) - Swipers .swiper-slide{height:100%} laeuft gegen die auto-hohe
      Wrapper-Hoehe ins Leere UND blockiert align-items:stretch der
      Flex-Line -> jede Karte so hoch wie ihr Inhalt. Fix: height:auto ->
      alle Slides strecken sich auf die hoechste Karte; #39-Layout greift
      dann kartenuebergreifend (Badges+Footer unten, .cs_review flex:1 =
      einzige Variable). Headless verifiziert (282/318/444px -> alle 444,
      Footer alle auf 416). Live-Test: kurze vs. lange Reviews -> alle
      Boxen enden auf einer Linie.

## 43. Testimonials Slider (Marquee): Titel h3 + Heading-Tag-Option (24528d9)
- [~] Sektionstitel war hart als h2 gerendert, keine Einstellmoeglichkeit
      (User-Screenshot). Fix custom-reviews-marquee.liquid: Select
      "Heading Tag" (h1-h4, Default h3) unter dem Title-Feld; Render
      nutzt den Tag fuer beide Elemente. Bestands-Instanzen ohne
      gespeicherten Wert fallen automatisch auf h3. Live-Test: Tag im
      Editor umstellen -> Groesse/Semantik wechselt.

## 44. Slideshow 1: Button-2-Hover kippte Textfarbe ins Dunkle (4bae20b)
- [~] Mit global aktivierter Button-Hover-Animation (enable_button_hover,
      live: hover_4) emittiert die Sektion die per-Block-Hover-Farbregeln
      NICHT - Button 2 fiel beim Hover ueber die globale Kaskade auf
      Bootstraps .btn:hover{color:#212529} (dunkel). Fix: neue stilklassen-
      unabhaengige Regel .btn.slideshow__btn-2<id>:hover pinnt die Hover-
      Textfarbe immer ans Setting "Color Button Hover" (Default weiss) -
      Desktop- und Mobile-Panel-Pfad. Headless verifiziert (Failure-Repro
      #212529 -> mit Fix konstant weiss). Hinweis: Button 1 hat dieselbe
      latente Struktur, zeigte das Symptom laut User aber nicht - bewusst
      nicht angefasst (ein Fix = ein Commit).
      Live-Test: Slide mit Button 2, Hover -> Textfarbe bleibt.

## 44b. Slideshow 1+2: Hover-Textfarbe gegen VERSTECKTES Setting absichern
      (b6695cf Slideshow 1, 2e08a40 Slideshow 2)
- [~] Nachtrag zu #44 - der User-Fall war tiefer: "Color Button Hover"
      (Button 1+2) hat im Schema visible_if enable_button_hover==false und
      ist bei aktivierter globaler Hover-Animation (live: an, hover_4) im
      Editor UNSICHTBAR. Der Underline-Pfad (und die #44-Pin-Regel, in
      Slideshow 2 auch Solid/Outline) lasen den unsichtbaren gespeicherten
      Wert trotzdem (!important). Stand dort rgba(0,0,0,0) (geleerter
      Picker), war der Hover-Text unsichtbar und per UI unfixbar
      (User-Screenshots: Button Line "EHEH", Hover -> Text weg, nur Linie).
      Headless verifiziert: rgba(0,0,0,0)-Wert -> computed color transparent.
      Fix: Guard-Variable an allen 8 Emissionsstellen (2 Sektionen x
      Desktop+Panel x Button 1+2): verstecktes Feld ODER leer ODER
      rgba(0,0,0,0) -> Hover-Textfarbe = Basisfarbe (Color Button), sonst
      Settingwert wie bisher. Hover-LINIE (bg_button_hover_*) bewusst
      unveraendert. Live-Test: Button Line mit geleertem Hover-Feld ->
      Text bleibt beim Hover in Basisfarbe; enable_button_hover aus +
      Hover-Farbe gesetzt -> Farbe greift wie vorher.

## 45. Slideshow 1+2: CTA-Button zeitweise nicht klickbar (Auto-Rotate unterm Cursor)
- [~] User: Button manchmal nicht klickbar, Cursor wird nicht zum Pointer.
      Headless vermessen: Nach JEDEM Slide-Wechsel ist die Button-Flaeche
      ~0,5-1s hit-tot - der Stagger (#34) haelt den Button unter der
      overflow-Maske (translateY(110%), Reveal 0.5s + 0.5s Delay); im
      Fade-Modus ist der noch sichtbare ALTE Button (.slide-shown) per
      Swiper-CSS pointer-events:none. Diese Totzeit ist Design (war in
      Slick identisch). Der eigentliche Bug: Slick hatte pauseOnHover:true
      (Default) - Rotation stoppte unterm Cursor; unsere Swiper-Autoplay-
      Config nicht -> Slide wechselt unter der Maus weg und reisst beim
      Zielen immer neue Totzeit-Fenster auf. Fix: pauseOnMouseEnter:true
      in theme.js (theme.Slideshow, gilt fuer Slideshow 1+2).
      Headless verifiziert: pausiert unterm Cursor, rotiert nach
      Mouse-Leave weiter. Live-Test: Maus auf Slideshow -> Rotation
      stoppt, Button klickbar; Maus weg -> Rotation laeuft weiter.
      Rest-Totzeit ~1s nach manuellem Pfeil-Klick bleibt (Stagger-Design;
      Delay-Verkuerzung waere bewusste Abweichung vom Original - offen).
      NACHTRAG: durch #46 REVERTIERT (User-Entscheid, siehe dort).

## 46. Slideshow-1-Reaudit (User-Zweifel an #45) + Befunde A1-A13
- [~] Empirie zu #45: pauseOnMouseEnter fixte nur den Grenzuebertritts-
      Fall; lag der Zeiger beim Laden schon ueber der Slideshow (100vh-
      Hero = Normalfall), feuerte nie mouseenter -> Rotation lief weiter
      (Swiper 6 bindet nur mouseenter/mouseleave).
      USER-ENTSCHEID 2026-07-14: Maus soll die Rotation grundsaetzlich
      NICHT stoppen -> pauseOnMouseEnter revertiert (ca07546); die
      ~0,5-1s Klick-Totzeit nach jedem Slide-Wechsel (Stagger-Maske,
      Slick-identisch) ist damit akzeptiertes Design. Der Revert erledigt
      auch A9 (Swipers mouseleave-run() hebelte Fokus-Pause/Editor-Stop
      aus - ohne pauseOnMouseEnter keine Maus-Listener).
      Gefixt (je eigener Commit):
      A2 6a2b928 Editor-Blockauswahl Fade zeigte immer Slide 1
         (data-swiper-slide-index nur im Loop; Fallback via indexOf).
      A3 5bb5b5e Mobile-Hide-Regeln ungescoped -> Panel-Modus-Instanz
         versteckte mobil Titel/Buttons ALLER Slideshows der Seite.
      A4 a4a21ba Tablet-Band 750-991px: Bild folgte Bootstrap-lg (992)
         statt Sektions-Breakpoint 750 (Desktop-Bild weg, Roh-Bild im
         Fluss, Text rausgeschoben).
      A5 87e3ae3 Liquid error divided by 0 sichtbar im Slide (Image 1
         leer + Image Mobile gesetzt; Rechnung vor dem Guard).
      A6 6469249 + 27a577e (SS2) versteckte Hover-HINTERGRUENDE
         (visible_if) faerbten ungeguarded Sweep-Layer/Underline-Linie/
         Hover-Border - Guard analog #44b, beide Slideshows.
      A7+A11 a65e2d8 toter Code (Overlay-Zweige auf nicht existente
         Section-Settings; .slideshow__link-Vollflaechen-CSS).
      A8 4cf3c79 Typo icons_color -> icon_color.
      A10 996b055 Square-Dot-Progressbalken ignorierte reduced-motion.
      A12 18d502a var()-Fallbacks fuer --height-header & Co. in den
         Full-Screen-Hoehen (calc war bis JS-Init invalid).
      A13 944d52d verklebte data-Attribute im Adapt-Modus.
      GEPARKT A1: swiper-bundle.min.css ist v11, JS v6.7.0 - funktional
         kompensiert durch die v6-CSS inline in header-css.liquid
         (empirisch verifiziert: fade-pointer-events + Dots greifen).
         Asset-Tausch waere riskant fuer ALLE Swiper-Sektionen -> nur
         dokumentiert, nicht angefasst.
      Rest-Notiz A10: Progressbalken laeuft bei Fokus-/Editor-Stop
         weiter (CSS kennt Autoplay-Zustand nicht, kosmetisch).
      Live-Test: Editor-Blockauswahl bei Fade trifft richtigen Slide;
      Tablet-Breite 750-991 mit Image Mobile zeigt Desktop-Bild; Slide
      ohne Image 1 aber mit Image Mobile ohne Fehlertext; 2 Instanzen
      mobil unabhaengig; Maus stoppt Rotation NICHT (gewollt).

## 47. Slideshow 1+2: CTA-Buttons durchgehend klickbar (eb89130)
- [~] Folge-Entscheid zu #45/#46: Rotation laeuft unterm Cursor weiter,
      also mussten die Buttons aus dem Stagger raus. Vorher fuhren sie
      versetzt ein (SS1 aus der Maske translateY(110%), SS2
      translateX(80px)+opacity, je .5s Delay + .5s Dauer) -> nach jedem
      Slide-Wechsel ~1s keine klickbare Flaeche an der Button-Position.
      Fix: CTA-Zeile (.slideshow__btn: Button 1, Button-2-Wrapper,
      Review-Badge) blendet nur noch per Opacity ein (0.3s, ohne Delay) -
      Element steht ab Slide-Aktivierung an der finalen Position, Opacity
      blockiert kein Hit-Testing. Texte/Titel/Badges behalten den
      Original-Stagger (bewusste Mini-Abweichung von Slick nur fuer die
      CTA-Zeile, vom User explizit gewaehlt).
      Headless: 0/80 tote Samples ueber 3 Rotationen (vorher 19-21);
      Klick 80ms nach Wechselbeginn trifft den Button.
      Live-Test: Maus auf Button liegen lassen, mehrere Auto-Wechsel
      abwarten -> Cursor bleibt Pointer, Klick oeffnet Link jederzeit;
      Optik: Buttons erscheinen als sanftes Einblenden statt Hochfahren.

## 48. Before After Stats: lange Labels verschwinden unter den Balken
- [~] sections/custom-rounded-progress.liquid: .bas-stat-label war auf
      94px festgenagelt (min-width UND max-width 94px; ab 1400px nur
      min-width auf 115px erhoeht, max-width 94 blieb). Einzelwoerter wie
      "Fassungsvermoegen" (123px bei 14px Schrift) liefen ueber die Box
      hinaus, und weil .bas-stat-bar position:relative hat, malt der
      Balken UEBER den ueberlaufenden Text -> Text wirkt abgeschnitten.
      Fix (Option 1, User-GO): ul.bas-stats von Flex-Zeilen auf CSS Grid
      (grid-template-columns: max-content 1fr, li display:contents,
      column-gap 10px / row-gap 12px wie vorher) - Labelspalte pro Karte
      so breit wie das laengste Label, alle Balken bleiben buendig.
      max-width entfernt, min-width 94px (115px ab 1400) bleibt als
      Untergrenze; totes flex:1 am Balken entfernt.
      Headless (alt vs neu): Overlap 14px/28px (Viewport 1200/1600,
      elementFromPoint am Textende traf bas-stat-fill) -> 0px, Label
      voll getroffen; Screenshot: Balken buendig.
      Nebenwirkung Editor: li hat durch display:contents keine eigene
      Box mehr -> Klick auf einen Stat-Row-Block in der Editor-Sidebar
      zeichnet evtl. keinen Outline-Rahmen in der Vorschau; Auswahl und
      Settings funktionieren normal.
      Live-Test: Karte mit langem Label (Fassungsvermoegen) pruefen -
      Text komplett sichtbar, Balken aller Zeilen starten auf einer Linie.

## 49. Product Overview: Image-Block unterstuetzt Video-Upload (Feature)
- [~] sections/product-template-1.liquid, Block "image": neues Schema-
      Setting type:video id:video (additiv, keine Renames -> mappability-
      sicher; Upload ueber den Shopify-Video-Picker). Rendering wie im
      Product Wrap Banner: video_tag mit autoplay/loop/muted/controls:false/
      playsinline, class img-fluid w-100 -> gleiches Format wie das Bild;
      globales Radius-CSS greift auch (header-css: .container video).
      Vorrang: Video-Setting > summit.banner-Metafield > Bild-Setting >
      Brand-Fallback (manuellster Input gewinnt; METAFIELD_CONTRACT deckt
      nur den Bild-Slot). Ohne gesetztes Video rendert alles unveraendert.
      Verifiziert: Schema-JSON-Parse, Tag-Balance, @shopify/liquid-html-parser.
      Live-Test: im Editor beim Image-Block ein Video hochladen/waehlen ->
      spielt automatisch stumm in Schleife, volle Breite, gleiche Rundung;
      Video entfernen -> Bild wie vorher.

## 50. Product Overview: Image-Block -> "Advertising Banner" + 21:9 erzwungen
- [~] sections/product-template-1.liquid, Block type:image: Schema-NAME
      auf "Advertising Banner" geaendert (nur das Label; type bleibt
      "image" - Mappability verbietet Type-Renames, Templates referenzieren
      den Type). Bild UND Video werden per CSS hart auf 21:9 gezwungen
      (.safe-checkout-detail img/video: aspect-ratio 21/9, object-fit
      cover, width 100% - Ueberstand wird mittig beschnitten). Gilt auch
      fuer summit.banner-Metafield-Bilder und Brand-Fallback (gleiche
      img-Selektoren). .safe-checkout-detail wird nur von diesem Block
      benutzt (verifiziert per Grep: 1 Renderstelle + 1 CSS-Regel).
      Live-Test: Block zeigt Bild/Video immer im 21:9-Band, unabhaengig
      vom Quellformat; Editor-Sidebar listet "Advertising Banner".

## 51. Before/After Image: Sektion riesig + disfunktional (Init laeuft nicht)
- [ ] sections/before-after.liquid (BeerSlider). Screenshot (Fahko/
      "Nitro mapped - Summit", Startseite): Sektion doppelt so hoch,
      After-Bild ueberzoomt, kein Handle/Slider.
      URSACHE (headless verifiziert, repro-beerslider.js): Das ist exakt
      der Zustand OHNE BeerSlider-JS-Init - ohne Init 1125px statt 563px
      Hoehe (2x, weil Original-CSS .beer-reveal>:first-child width:200%
      setzt und das Theme-CSS .beer-reveal auf position:relative stellt,
      wodurch das Before-Bild die Sektionshoehe bestimmt); Before-Bild
      opacity:0 bis .beer-ready. MIT Init: 563px, Handle, alles korrekt.
      Init-Kette in main ist korrekt und seit theme_start unveraendert
      (theme.js: sections.register("beforeafter") -> new BeerSlider;
      Skript-Reihenfolge defer ok: beerslider.js im Body VOR theme.js).
      Warum der Init auf dem Store nicht laeuft - Verdacht, zu klaeren:
      (1) Zweitshop faehrt veraltete Theme-Kopie (bekanntes Muster) ODER
      (2) ein JS-Fehler eines frueher registrierten Section-Konstruktors
          (Register-Kette theme.js 3848-3863, z.B. slideshow-section VOR
          beforeafter) bricht die Kette ab -> Konsole des Stores pruefen.
      FIX-VORSCHLAG (Haertung, wirkt unabhaengig von der Ursache):
      (a) CSS-Guard in beerslider.css: .beer-reveal>:first-child auf
          width:100% - unintialisiert rendert die Sektion dann in
          normaler Hoehe (nur ohne Slider-Griff, kein Riesenbild);
          nach Init ueberschreibt setImgWidth ohnehin inline (px).
      (b) Selbst-Init-Fallback inline in der Section (DOMContentLoaded,
          mit Guard gegen Doppel-Init via .beer-range-Check) - Slider
          funktioniert dann auch, wenn die theme.js-Registerkette stirbt.
      Wartet auf GO.

## 52. Shop The Look: Swiper-Layout zerschossen
- [x] BESTAETIGT vom User 2026-07-17 (Shop The Look 1 Karte + Pfeile +
      Dots; Collection List und Icons rendern korrekt). Als Pattern P1
      oben aufgenommen.
      NACHSCHAERFUNG nach Vollscan (gleicher Tag): Regel auf
      .swiper-container-initialized > .swiper-wrapper > .swiper-slide.col
      gescoped - die ungescope Fassung haette featured-collections-1
      bei Enable Carousel AUS gebrochen (traegt swiper-Klassen UNGATED,
      statisches Drittel-Raster kommt dort AUS dem .col-Flex; Headless:
      ungescoped 1140px/Karte statt 380px-Drittel, gescoped korrekt in
      allen 4 Faellen inkl. Init-Fall 380px und stl 270px/pl 285px).
      VOLLSCAN-Protokoll (alle swiper-slide-Vorkommen geprueft):
      .col-Slides = shop-the-look, featured-collections-1, icon-list
      (nur Carousel-Zweig), product-list, product-tab (beide zusaetzlich
      mit eigener Section-Regel), instagram (JS-Laufzeit, Container
      bekommt swiper+initialized beim Init -> abgedeckt). OHNE .col
      (kein Handlungsbedarf, Regel = No-Op): quotes, quotes-split,
      quotes-square, announcement-bar-slide, custom-reviews,
      custom-shoppable-video, image-auto-slider, reviews-slider,
      slideshow-1/2, Produktgalerie/Thumbs (theme.js). swiper-container-
      Markup (featured-collections-3, product-list-swiper, product-wrap-
      banner, product-recommendations): keine .col-Slides ->
      unbetroffen; product-recommendations grid__item hat eigenen
      flex-basis:auto!important-Schutz. col-N-Varianten an Swiper-
      Slides: keine (icon-list nutzt col-12/col-6 nur im statischen
      Zweig ohne swiper-Klassen).
      GEFIXT auf User-GO 2026-07-17 (2. Anlauf): globale Regel
      (Selektor s.o.) in theme.css UND theme.css.liquid (nach dem
      dots-negative-Block) - globale Fassung des bestehenden Patterns
      aus product-list/product-tab. Headless verifiziert: shop-the-look
      Slide 270px = Inline-Breite (vorher 116px), genau 1 Karte im
      Container; product-list 285px/4 Karten korrekt; grow 0/basis auto.
- [x] REOPENED 2026-07-17 (User: Haertung half nicht; broken auf
      summittheme/main selbst). ECHTE URSACHE gefunden und headless
      reproduziert (Repro brach erst, als das Bootstrap-Inline-CSS aus
      header-css.liquid Zeile 2 mitgeladen wurde - das fehlte im ersten
      Repro, daher die Fehldiagnose):
      Bootstrap-4-Grid liegt SEIT theme_start inline in header-css
      (Zeile 2) und laedt NACH der Swiper-CSS. Die Slides tragen aus
      der Slick-Zeit noch class "col" -> .col{flex-basis:0;flex-grow:1}
      schlaegt an den Flex-Items der .swiper-wrapper die von Swiper
      gesetzte Inline-Breite (bei flex-basis!=auto ignoriert Flexbox
      width): Slides kollabieren auf min-content (~116px statt 270px),
      Swipers Translate-Raster (270er-Schritte) passt nicht mehr ->
      Teilkarten/Sliver sichtbar, Pfeile ueberlappen (= Screenshot).
      WARUM ALT OK: Slick baut KEINEN Flex-Kontext (slick-track =
      block + floats/eigene Breiten) -> .col-Flexregeln liefen ins
      Leere. Die Swiper-Migration (0d0162e) behielt row/col bei ->
      erst seitdem giftig.
      ALTE FIX-PATTERN GEPRUEFT: Instagram-Carousel (theme.js 3071)
      entfernt beim JS-Init classList.remove("row","mx-n2") vom
      Container (Teil-Pattern; dessen col-Slides fielen nie auf, weil
      ohne Access-Token kein Feed rendert). product-list-swiper setzt
      Kartenbreiten per CSS !important (#30 F8). Ein globales
      Neutralisieren fehlt.
      WIDERSPRUCH AUFGELOEST (User bestaetigt: Product List Carousel
      laeuft): product-list.liquid traegt den Fix BEREITS als Section-
      Style (Zeilen 13-21: .customstyle{{id}} .swiper-slide.col{flex:
      0 0 auto;max-width:none} - mit Kommentar, der exakt diese
      Diagnose beschreibt), ebenso product-tab.liquid (Zeile 59).
      Das Pattern wurde bei der Migration nur bei einem Teil der
      Sektionen eingebaut. Repro brach bei product-list, weil der
      Section-Style-Kopf dort nicht nachgebaut war.
      INVENTUR .col-Slides OHNE Pattern (= kaputt): shop-the-look,
      featured-collections-1, icon-list (Carousel-Modus), instagram
      (JS-generierte col-Slides). OHNE .col (nicht betroffen):
      quotes, quotes-split, quotes-square.
      FIX-VORSCHLAG (Option A, verfeinert): EINE globale Regel in
      theme.css UND theme.css.liquid (laedt als letztes), Praezedenz
      = bestehendes Pattern aus product-list/product-tab:
        .swiper > .swiper-wrapper > .swiper-slide.col{
          flex: 0 0 auto; max-width: none; }
      Matcht NUR col-Slides in initialisierten Swipers (0,4,0 schlaegt
      .col ordnungsunabhaengig); deckt auch Instagrams Laufzeit-Slides;
      No-Op fuer product-list/product-tab (dort doppelt) und alle
      Nicht-col-Slider. col-Gutter-Padding bleibt (Slick-Geometrie).
      Die #52-Haertung (observer/watchOverflow/simulateTouch, c7e60d4)
      bleibt drin - korrekt, aber nicht die Ursache dieses Bugs.
      Wartet auf GO.
      ALTE (unvollstaendige) DIAGNOSE vom 17.07.: theme.js
      slickCarousel-Opts um
      observer:true, observeParents:true, watchOverflow:true,
      simulateTouch:!!s.draggable ergaenzt (#30-Muster). Verifiziert:
      node --check OK; Headless Normalfall unveraendert korrekt (270px/
      1 Karte); Bug-Fall (Init 120px -> Container 270px ohne resize)
      heilt sich mit observer (vorher: Slides blieben 120px, 2 Nachbarn
      sichtbar). Live-Test: Shop The Look im Editor oeffnen/Setting
      aendern -> genau 1 Karte in der 270px-Spalte, Pfeile seitlich,
      kein Karten-Sliver links; gilt ebenso fuer Icon List, Quotes(-Split/
      -Square), Featured Collections 1. Draggable AUS unterbindet jetzt
      auch Maus-Drag (F1-Paritaet, gewollt).
      AUDIT 2026-07-17: Screenshot: Karten mit
      falschen Breiten nebeneinander, Nachbar-Slide ragt links raus,
      Pfeile ueberlappen. Referenz old.zip: alte Version lief mit Slick
      (jQuery/vendor.js) und war ok; Migration auf Swiper in 0d0162e
      (Slice 6a, 9 Display-Carousels).
      BEFUND 1: Aktueller main-Code ist in Isolation KORREKT - Headless-
      Repro mit echten Assets (swiper-bundle v11-CSS + v6-Inline +
      theme.css + Swiper-JS 6.7.0, Init 1:1 wie theme.slickCarousel):
      Container 270px, Slides 270px, 1 Karte sichtbar, Dots ok.
      BEFUND 2 (Ursache des Screenshots): Swiper 6 misst nur beim Init +
      window.resize. Die Shop-The-Look-Breite (.split-p--right max-width
      270px, mx-auto, in 2-Spalten-Row neben async ladender Bildspalte;
      im Editor zusaetzlich Section-Inject) steht beim Init oft noch
      nicht fest. theme.slickCarousel ist der EINZIGE Carousel-Init-Pfad,
      der die #30-Haertung NICHT bekam: kein observer/observeParents,
      kein watchOverflow, kein simulateTouch-Kopplung (F1). Vergleich:
      Producttabs observer+observeParents+watchOverflow+simulateTouch;
      Productlists simulateTouch+watchOverflow; SwiperCustom
      watchOverflow+observer+observeParents.
      BEWEIS (repro-stl-latewidth.js): Init bei 120px, Container settelt
      auf 270px ohne resize -> OHNE observer bleiben Slides 120px, aktive
      Karte fuellt Container nicht, 2 Nachbar-Slides sichtbar (=Screen-
      shot); MIT observer/observeParents heilt es sich (270px, 1 Karte).
      BETROFFEN (gleicher Init-Pfad data-section-type=slickCarousels):
      shop-the-look, icon-list, quotes, quotes-split, quotes-square,
      featured-collections-1.
      FIX-VORSCHLAG: theme.slickCarousel-Opts um observer:true,
      observeParents:true, watchOverflow:true, simulateTouch:
      !!s.draggable ergaenzen (exakt das bewaehrte #30-Muster; wirkt
      auf alle 6 Sektionen gleichmaessig, sonst keine Verhaltensaenderung).
      Zusatzhinweis: Screenshot-Theme "XXXXX PRESET" kann zudem ein
      veralteter Stand sein - Haertung wirkt unabhaengig davon.

## 53. Testimonials Split: Bild trotz Image-Picker unsichtbar (Ratio-Var undefiniert)
- [x] BESTAETIGT vom User 2026-07-17 ("funktioniert"). Als Pattern P4
      oben aufgenommen.
      GEFIXT auf User-GO 2026-07-17: Var-Definition reaktiviert, gescoped
      auf .customstyle{{section.id}} und nur ausgegeben wenn paddingTop
      != blank (Liquid-gated). Verifiziert: Schema/Parser OK; Headless
      square OHNE Fix Wrapper 0px -> MIT Fix paddingTop = 100% der
      Breite, Bild sichtbar; auto unveraendert. Live-Test: Image Ratio
      Square/Portrait/Landscape/Wide -> Bild im gewaehlten Format;
      "Adapt To Image" wie bisher.
      AUDIT 2026-07-17: sections/quotes-split.liquid.
      URSACHE: Die Liquid-Logik berechnet paddingTop (portrait 120% /
      square 100% / landscape 75% / wide 56%), aber die CSS-Definition
      dazu ist SEIT JEHER auskommentiert (Zeilen 17-19, identisch schon
      im alten Slick-Theme old.zip - kein Migrationsschaden). Die vier
      Ratio-Regeln nutzen trotzdem padding-top: var(--g-padding-s-top)
      !important - undefinierte Var => "invalid at computed-value time"
      => padding-top faellt auf 0 UND gewinnt per !important gegen den
      korrekten Inline-Style des Wrappers. Ergebnis: Wrapper 0px hoch +
      overflow:hidden => Bild unsichtbar, sobald Image Ratio NICHT
      "Adapt To Image" ist. Nur mit Ratio "auto" rendert das Bild.
      EMPIRISCH (repro-quotessplit.js, echte Assets inkl. lazysizes +
      Swiper-Init nach #52): auto -> Bild sichtbar (opacity 1,
      lazyloaded); square -> Wrapper paddingTop 0px, Hoehe 0, unsichtbar.
      Lazyload/scale-in und Swiper-Struktur sind NICHT das Problem.
      Nur diese Sektion betroffen (einzige mit --g-padding-s-top).
      FIX-VORSCHLAG: Var-Definition reaktivieren, aber nur wenn
      paddingTop != blank (bei auto waere "--g-padding-s-top: ;"
      invalid): .customstyle{{section.id}}{--g-padding-s-top:...}.
      Instanz-sicher: Ratio-Regeln sind global, die Var loest aber pro
      Section-Scope auf -> mehrere Instanzen mit verschiedenen Ratios
      kollidieren nicht. Kein Schema-/Markup-Eingriff.
      Live-Test: Image Ratio auf Square/Portrait stellen -> Bild
      erscheint im gewaehlten Format; "Adapt To Image" wie bisher.

## 54. Scratch Newsletter Popup: Uebersetzungs-Fallbacks fehlten (i18n)
- [~] GEFIXT auf User-GO 2026-07-17: Die ~30 Text-Settings renderten nur
      ihre englischen Schema-Defaults, ohne | t-Fallback (Luecke im
      theme-weiten i18n-Muster #17/#23; nur das Scratch-Popup betroffen,
      newsletter.liquid nutzt das Muster korrekt).
      Umsetzung: (1) Schema-Defaults der Text-Settings entfernt
      (Setting-IDs unveraendert; discount_code behaelt Default JIMMY15 -
      Codes werden nicht uebersetzt); (2) Liquid-Kopf loest alle Texte
      per s.x | default: ('general.scratch_newsletter.x' | t) auf,
      Renderstellen + JSON-Config (foilText/hintScratch/hintRevealed)
      nutzen die t_-Variablen; (3) 31 Keys in alle 10 Locale-Dateien
      injiziert (en.default/de/da/es/fr/it/ja/nl/pt-BR/pt-PT; de in
      Du-Form gemaess #23), textuell vor "newsletter_form" (Rest der
      Dateien byte-unveraendert), alle per JSON.parse validiert.
      Verhalten: gespeicherte Texte gewinnen weiter; leere Felder =
      Shop-Sprache. Editor-Hinweis-Paragraph im Schema ergaenzt.
      Live-Test: Shop-Sprache Deutsch + Popup mit leeren Textfeldern
      oeffnen (Test mode) -> alle Schritte deutsch (Rubbelkarte, E-Mail,
      Telefon, Erfolg, Fehlermeldungen, Folientext); eigenen Text in
      ein Feld tippen -> gewinnt.

## 55. Logos vom globalen "Enable Radius Image" ausgenommen
- [~] GEFIXT auf User-GO 2026-07-18: Der globale Radius-Block rundete
      per .container img/.full img (!important) auch Logos - sichtbar,
      sobald ein Logo einen weissen/farbigen Hintergrund-Kasten hat.
      Ausnahme am Ende des Radius-Blocks in header-css (Muster wie
      Grid-Banner-Ausnahme a2e59f5): .site-header__logo img (Header +
      Option-Sidebar, gleiches Snippet), .logofooter img + .logofooter
      .image-content__image-wrapper img (Footer-Logo; die spezifischere
      Wrapper-Variante noetig, weil .container .image-content__image-
      wrapper img (0,2,1) sonst gewinnt - im Headless-Test gefunden)
      + Wrapper selbst; Footer-CONTAINER trug bereits .border-radius-0.
      Newsletter-Popup-Logo liegt ausserhalb der Container - unbetroffen.
      Headless verifiziert (Kaskade mit echtem Radius-Block, range=2):
      Header-Logo 0px, Footer-Logo 0px, Wrapper 0px, normales
      .container-Bild bleibt 6.4px gerundet.
      Live-Test: "Enable Radius Image" an + Logo mit farbigem Kasten ->
      Header- und Footer-Logo eckig, Produktbilder weiter gerundet.

## 56. Image With Text: Heading-Size-Default H2 -> H3 (User 2026-07-18)
- [~] sections/image-with-text.liquid, Text-Block size_text: Schema-
      Default von h2 auf h3. Wirkt nur auf NEU hinzugefuegte Sektionen
      bzw. Instanzen ohne gespeicherten Wert; bestehende mit explizit
      gewaehlter Groesse bleiben unveraendert. Live-Test: Sektion neu
      hinzufuegen -> Heading Size steht auf H3.

## 57. Testimonials Split: Text-Size-Default p -> H3 (User 2026-07-18)
- [~] sections/quotes-split.liquid, size_text: Schema-Default von "p"
      (Body) auf h3 - analog #56. Wirkt auf neue Sektionen und
      Instanzen ohne gespeicherten Wert; explizit gewaehlte Groessen
      bleiben. Live-Test: Sektion neu hinzufuegen -> Text Size = H3.

## 58. Button Box: fremdfarbige 1px-Umrandung (CTA-Farbe) [Bug-Sammler 18.07.]
- [x] BESTAETIGT vom User 2026-07-18 ("ja ist gefixt").
      NACHFIX #58b (User: "immer noch da, Primary-Farbe") 2026-07-18:
      ZWEITE Border-Quelle gefunden - .btn-theme:hover (theme.css 2252)
      und :active/:focus (2290) setzen border-color: var(--g-main)
      (Primary); da der Focus nach einem Klick stehen bleibt, blieb der
      Rand dauerhaft sichtbar. Override-Regel mit identischen Selektoren
      (OHNE .btn-outline - dessen Hover-Rand ist gewollt) direkt
      dahinter: border-color transparent; in theme.css UND
      theme.css.liquid. Headless verifiziert: Ruhe/Hover/Geklickt-Focus
      alle transparent, Backgrounds unveraendert.
      WICHTIG Testkontext: die Preset-Themes (FASHION 16:39 etc.) sind
      Snapshots von VOR den Fixes - eindeutiger Marker-Check per Admin-
      API bestaetigt, dass #58 dort fehlt. Test nur auf summittheme/main
      bzw. einem NEUEN Preset-Build aussagekraeftig.
      ERSTFIX: GEFIXT auf User-GO 2026-07-18: .btn-theme-Basisregel in theme.css
      UND theme.css.liquid auf border: 1px solid transparent (statt
      var(--g-cta-button)); background-clip border-box fuellt den
      Randbereich mit der Hintergrundfarbe -> Standard-Optik identisch.
      .btn-primary (Z. 2055) bewusst unveraendert - dort wandert die
      Border beim Hover korrekt mit. Headless verifiziert (CTA orange):
      Standard voll orange, btn-white rein weiss, Sektionsfarbe rein
      schwarz - kein Fremdrand mehr; computed borderColor transparent.
      Live-Test: FASHION-Preset, Button Box (White) -> kein orangener
      Rahmen; Standard-Buttons unveraendert.
      AUDIT: Mechanismus in theme.css bestaetigt:
      .btn-theme traegt border: 1px solid var(--g-cta-button) UND
      background: var(--g-cta-button) - Rand normal unsichtbar. Sobald
      der Hintergrund umgefaerbt wird, bleibt der Rand in der globalen
      CTA-Farbe stehen: (a) .btn-theme.btn-white setzt nur background
      #fff ohne border-color (Z. 2171-2184), (b) Sektionen mit eigenen
      Button-Farbsettings (nur background inline), (c) input.btn-theme
      :hover wechselt background auf --g-main, Rand bleibt CTA.
      FASHION-Preset hat orange CTA-Farbe -> orangener Rahmen.
      FIX-VORSCHLAG: border-color entkoppeln - global .btn-theme
      {border-color: transparent} (Rand war nie als sichtbares
      Gestaltungselement in Benutzung, btn-outline hat eigene Border)
      oder minimal-invasiv nur .btn-theme.btn-white{border-color:#fff}.
      Empfehlung: transparent global, deckt alle drei Pfade.
      OFFEN: Screenshot des Sammlers nicht abrufbar (s. #59) - genauer
      Fundort unbekannt, Mechanismus aber eindeutig.

## 59. Metafield-Bilder "rendern 1:1 statt angepasst" [Bug-Sammler 18.07.]
- [~] GELOEST 2026-07-18 (Fundort vom User: Product Grid Image, Banner-
      Block; Analyse-Zulieferung aus der Summit-Session): B1-Fallback-Ast
      strukturell ungleich zum Picker-Ast - der Fallback rendert das
      Bild in <div class="image-content__image h-100"> OHNE den
      image-content__image-wrapper; das Cover haengt aber am Selektor
      .image-content__image-wrapper img (product-with-image Section-CSS
      Z. 34) -> Fallback-Bild rendert in Quellratio ("1:1 in der Box"),
      Picker-Bild fuellt per object-fit:cover.
      FIX: Fallback strukturgleich zum Picker-Ast (b1_fb in
      image-content__image-wrapper h-100; Placeholder behaelt altes Div)
      in product-with-image, product-wrap-banner, product-list-swiper
      (die 3 h-100-Sites mit identischem Muster).
      Headless bewiesen (echte theme.css + Bootstrap-Inline; 800x800-
      Bild in 420x600-Box): Picker 467x600 cover / alter Fallback
      467x467 Quellratio / neuer Fallback 467x600 = Picker.
      CALLSITE-AUDIT (alle ~50 brand-image-Renderstellen):
      - GEFIXT (h-100-Fill): product-with-image:121, product-wrap-
        banner:213, product-list-swiper:209.
      - GLEICHWERTIG (kein Fix noetig): adapt-to-image-Slots, deren
        Picker-Pfad selbst Quellratio rendert (padding-top aus
        image.aspect_ratio): image-with-text, image-video-with-text,
        image-with-icons, advanced-content(promo), main-login u.a.
      - RANDFALL notiert: quotes-split-Fallback ignoriert Image-Ratio-
        Setting (nur relevant bei leerem Avatar + Ratio != auto; blindes
        Wrappen wuerde dort 0-Hoehe erzeugen - separat behandeln falls
        gemeldet).
      WRITER-SEITE (Summit): "per API injizierte Vorlage erscheint erst
      nach Sektion-neu-hinzufuegen" ist ein Editor-/Push-Thema, kein
      Theme-Bug - an Summit-Session zurueckgemeldet.
      Live-Test: Product Grid Image OHNE Picker-Bild (B1/API-Vorbe-
      fuellung) -> Banner fuellt die Box wie mit Picker-Bild.
      Urspruengliche Blockade: Screenshot-Link des Bug-Sammlers ungueltig (Supabase
      "signature verification failed"; Ordner-Pfad in URL und JWT-Payload
      widersprechen sich -> Briefing-Generator baut die Signed-URL um,
      statt sie 1:1 einzubetten). Ohne Screenshot/Fundort nicht sauber
      diagnostizierbar. HYPOTHESE: AI-generierte summit.banner-Bilder
      sind quadratisch (1024x1024); der Advertising-Banner-Slot erzwingt
      seit #50 (15.07., fddf4b9) 21:9 per CSS - laeuft das FASHION-
      Preset-Theme (version 870bdf44) auf einem Stand VOR #50, rendert
      der Banner nativ quadratisch. Alle uebrigen summit.*-Bild-Slots
      (Side-Icons, Review-Strip, Avatar, Video-Thumbs) croppen per CSS.
      LIVE-ANALYSE 18.07. (Admin-API + Storefront-Preview, read-only):
      Hypothese "Preset zu alt fuer #50" WIDERLEGT - FASHION-Presets und
      Live-Nitro-Theme enthalten #50 + Metafield-Code. Ratio-Audit aller
      CDN-File-Bilder auf der Preset-Produktseite: ALLE summit.*-Slots
      croppen korrekt (Banner=Video 21:9, Avatar/Thumbs/Icons per CSS);
      Icon-Slots sind gewollt quadratisch. AUFFAELLIG einzig die
      PRODUKTGALERIE (product.media, AI-Uploads 1:1): aktiver Slide
      rendert portrait-gecroppt (556x570), uebrige Slides nativ
      quadratisch (262/540) - Galerie wirkt gemischt/1:1. Vermutlich
      ist DAS die Meldung; das waeren aber product.media, nicht
      summit.*-Metafields. NAECHSTER SCHRITT: Operator-Screenshot
      (funktionierender Link) bestaetigt Fundort, dann Fix im Bereich
      product-media (Image-Ratio-Anwendung auf alle Galerie-Slides).

## 60. Rich Text: Image-Block ohne runde Ecken (Logo-Slot) [Bug-Sammler 18.07.]
- [~] GEFIXT 2026-07-18 (Operator-Report chris-admin, PETS-Preset,
      Screenshot: Hammy-Logo mit gerundet beschnittenen Ecken).
      Ursache = #55-Familie: globales "Enable Radius Image" rundet
      Container (.container .image-content__image-container) und Bild
      (.container img !important) des Rich-Text-Image-Blocks.
      Fix: Ausnahme im Radius-Block (header-css, direkt bei der
      #55-Logo-Ausnahme), gescoped auf die blockeigene Klasse
      hero-img__wrap (nur vom Rich-Text-Image-Block genutzt, per Grep
      verifiziert): Container, Wrapper, Wrapper-img und img auf
      border-radius:0 !important (Wrapper-img-Variante gegen die
      spezifischere .container .image-content__image-wrapper img-Regel).
      Headless verifiziert (Kaskaden-Repro, range=2): Rich-Text-Bild
      und -Container 0px; Header-/Footer-Logo-Ausnahmen intakt;
      normales Container-Bild bleibt 6.4px gerundet.
      Live-Test: PETS/Hammy about-us -> Logo im Rich Text eckig,
      Produktbilder weiter gerundet. (Preset braucht frischen Build.)

## 60. Rich Text: Image-Block nie runden (Logo-Slot) [Bug-Sammler 18.07., chris-admin]
- [x] BESTAETIGT vom User 2026-07-18 ("fix hat geklappt").
      GEFIXT 2026-07-18: Operator-Report (verbatim, massgeblich):
      Rich-Text-Image-Block darf keine rounded edges haben, da dort
      Logos eingesetzt werden. Screenshot (PETS/Hammy, aktives Nitro-
      Theme) bestaetigt: Logo mit gerundeten Ecken beschnitten.
      Ursache = #55-Familie: globales "Enable Radius Image" rundet
      .container img (!important) + .image-content__image-container.
      Fix: Ausnahme im Radius-Block (header-css) direkt bei der
      #55-Logo-Ausnahme, gescoped auf .hero-img__wrap (Klasse ist
      exklusiv am Rich-Text-Image-Block, beide Aeste; per Grep
      verifiziert) - Container, Wrapper, Bild; inkl. der spezifischeren
      Wrapper-img-Variante (Lehre aus #55).
      Headless verifiziert (Kaskade, range=2): RichText-Logo 0px,
      Container 0px; Header-/Footer-Logo-Ausnahmen (#55) intakt;
      normales Container-Bild bleibt 6.4px gerundet.
      Live-Test: Rich Text > Image mit Logo + "Enable Radius Image" an
      -> eckig; andere Bilder behalten Rundung. Gilt auf summittheme/
      main sofort; Preset-/Nitro-Builds brauchen frischen Build.

## 61. FAQ-Vorlage: Default-Uebersetzung griff nicht [Bug-Sammler 18.07.]
- [~] GEFIXT 2026-07-18: Screenshot (PETS/Hammy, deutsch): FAQ-Seite
      zeigte "SUBTITLE TOP" + "Frequently Asked Questions." englisch.
      AUDIT: Section faq-accordion hat das #17-i18n-Muster komplett
      (Fallbacks general.defaults.faq_subtitle_top/faq_title verdrahtet,
      Keys in allen 10 Locales - de "Haeufig gestellte Fragen"; Schema
      ohne Defaults + "Leave empty"-Info). Ursache war ALLEIN die
      Vorlage templates/page.faqs.json: hart gespeicherte englische
      Werte (subtitle_top "Subtitle Top", title "Frequently Asked
      Questions.") - gespeicherte Werte schlagen jeden Fallback
      (#54-Nachtrag-Muster). Fix: beide Werte in der Vorlage geleert;
      JSON validiert. Die FAQ-FRAGEN im Screenshot sind AI-Content vom
      Writer (nicht Vorlagen-Defaults) - nicht betroffen.
      Live-Test: FAQ-Seite auf deutschem Shop -> "Haeufig gestellte
      Fragen" (+ uebersetzter Subtitle); eigene Eintraege in den
      Feldern gewinnen weiterhin. Gilt fuer neue Builds/Installationen;
      bestehende Stores mit bereits kopierter Vorlage brauchen das
      Leeren einmal im Editor.

## 62. Image (Video) With Text: doppeltes Description-Feld entfernt [Bug-Sammler 18.07., chris-admin]
- [~] GEFIXT 2026-07-18: Text-Block hatte ZWEI Textfelder, die BEIDE
      untereinander renderten - id content (textarea, Label Description,
      mit engl. Default) und id answer_content (richtext, Label Text
      Content). Screenshot (PETS, aktives Nitro-Theme): AI-Text in
      Description PLUS Richtext-Default darunter = Dopplung.
      Operator (verbatim): description raus, text content wird befuellt.
      Fix: Setting content aus dem Schema entfernt + Renderstelle raus;
      answer_content ist der eine Text-Slot. Setting-ENTFERNUNG, kein
      Rename -> parse-Contract laut Briefing-Reminder unkritisch.
      WICHTIG Writer-Rueckmeldung (Summit-Session): Der Writer befuellte
      bisher offenbar content (Screenshot). Schreibt er weiter dorthin,
      landet der Wert unsichtbar in den Settings - Mapping des Blocks
      auf answer_content umstellen, sonst fehlt der AI-Text in neuen
      Builds. Bestandsinstanzen mit content-Text zeigen diesen nach dem
      Update nicht mehr an (gewollt - war die Dopplung).
      Live-Test: Text-Block zeigt nur noch ein Textfeld (Text Content);
      Frontend rendert den Text einfach statt doppelt.

## 63. Darkmode-Chrome-Schicht Phase 1 (Briefing THEME_BRIEFING_darkmode_chrome.md)
- [~] UMGESETZT auf User-GO 2026-07-19 (P0 + header-oncss + 2 Inline-
      Funde; P1 folgt einzeln zur Abnahme):
      (1) settings_schema: Header "UI Chrome" + color_chrome_bg/text/
          border, bewusst OHNE Defaults (additive IDs, kein Contract-
          Risiko). (2) header-css: konditionaler --g-chrome-*-Block
      (leeres Setting => Variable existiert nicht => Literal-Fallback).
      (3) Codemod (strikt, jede Op exakt 1x, Dry-Run vorab): 68 Er-
      setzungen var(--g-chrome-*, <altes Literal>) in theme.css UND
      theme.css.liquid (je 20 Regeln, Doppelpflege-Auflage 8.1),
      cart-draw (7), component-facets (7), slide-menu (2), template-
      collection (1), header-oncss (8, inkl. Indicator Z1641),
      quickview.liquid (QV-Pfeile inline), product-suggest.liquid
      (Popup, 2 Stellen).
      Abweichungen vom Briefing: .js-qty__adjust:focus ENTFAELLT
      (Literal war bereits auskommentiert); BONUS video-close-X-Icon
      fill:#000 -> chrome-text mitgenommen (sonst black-on-dark).
      VERIFIKATION: settings_schema-JSON + 4 Liquid-Parser OK;
      Headless 32/32: Light computed ALT vs NEU identisch ueber 16
      repraesentative Chrome-Elemente (drawer/cart/qty/option/arrows/
      facets/quickview-loader/...), Dark-Smoke (#181818/#fff/#333)
      kippt alle 16. (Messartefakt BOM beim Alt-Export erkannt und
      neutralisiert - kein echter Diff.)
      ERKENNTNIS aus dem User-Livetest 19.07.: Der CART-/SUCH-DRAWER
      hoert NICHT auf die Chrome-Schicht, sondern auf das seit jeher
      existierende Setting color_drawer_bg (Colors -> "Drawer
      Background", Default #fff) - header-oncss Z417-429 neutralisiert
      die cart-draw-Literale per background:transparent!important und
      setzt {{ settings.color_drawer_bg }}!important auf search-modal/
      mini-cart-content/drawer-crossell. Die gepatchten cart-draw-
      Literale sind darunter toter Code (unschaedlich, Light bewiesen
      unveraendert). KONSEQUENZ Summit-Mapping: color_drawer_bg MUSS
      zusaetzlich zu den 3 Chrome-Feldern im Dark-Preset gemappt werden.
      P1-RUNDE 19.07. (auf User-GO, einzeln auditiert): 34 Ersetzungen
      umgesetzt - product-card-Countdown-Badge, overlay-btn, style4-
      Hover, style5-Overlay-Btn(+:before), cross-item-title (Text),
      split-banner-1(+:before), hotspot-product, pro__ser--box,
      Judge.me-Review-Karte (je in theme.css UND theme.css.liquid);
      PhotoSwipe-Lightbox pswp__bg/arrow(2x)/close + media__poster-
      button (product-template.css - Briefing-Auflage "verifizieren"
      erfuellt: es IST die Lightbox); Giftcard (4 inkl. Nach-Scan-Fund
      amount-wrapper); deferred-media poster+badge; Ajaxinate-Pagination.
      BEGRUENDETE SKIPS (Zeilen-Scanner-Geister/Design):
      - product-card__pricesale: das Briefing-#fff war ein AUSKOMMEN-
        TIERTER Nachbarblock (.template-product .page-container) -
        pricesale selbst hat kein Weiss.
      - style5 overlaybottom .btn: laeuft laengst ueber
        var(--g-cta-button)!important (frueherer Button-Box-Fix).
      - js-countdown--1: beige (#f8ede7) + #000 = gewollter Akzent,
        chrome-text waere dort unlesbar.
      - js-countdown--2: background:white ist toter Code (wird in
        derselben Regel von background-color:transparent ueberschrieben).
      - parallax-banner__meta: hat Section-Setting-Override (bg_box in
        background-video.liquid) - Settings-Route, nicht Chrome.
      VERIFIKATION P1: Headless 32/32 (16 Proben Light alt=neu,
      16 Dark #181818/#fff).
      SUMMIT-STAND (Rueckmeldung 19.07.): color_drawer_bg bereits auf
      secondary (#000000) gemappt; die 3 Chrome-Felder kommen mit dem
      V2.17-Parse und werden auf background/primary_text/border gemappt.
      Live-Test: Customizer -> Colors -> UI Chrome auf #181818/#ffffff/
      #333 -> Cart-/Menu-/Filter-Drawer, Dropdowns, Mengen-Input,
      Quick-View, Pfeile, Such-/Meganav-Panels, Verkaufs-Popup dunkel;
      Settings leeren -> exakt heutiger Light-Mode.

## 64. Darkmode-Nachzuegler: Drawer-X, Verified-Badges, SVG-Hardcodes (Briefing 2)
- [~] UMGESETZT 2026-07-19 (Briefing THEME_BRIEFING_darkmode_chrome_2.md,
      Abschnitt 6 = verbindliche Audit-Korrekturen dieser Session):
      AUDIT-KERNBEFUNDE (Briefing-Korrekturen):
      - #63a Drawer-Close-X: NICHT icon-close-small (rendert nur in
        facets.liquid/Filter-Chips). Echte Ursache: header.liquid Z28-30
        pinnte --g-color-heading:#000 direkt auf den ::before/::after-
        X-Strichen ALLER Modal-Close-X - im Light unauffaellig (schwarz
        auf weiss), im Dark unsichtbar (schwarz auf color_drawer_bg).
      - Klasse-3-Tabelle: block-cart 307/313 + image-auto-slider 296/301
        sind {% comment %}-toter Code; whatsapp:36 ist der Blur-SCHATTEN
        des Marken-Logos (Skip); scratch-newsletter:632 ist ein JS-
        Scratch-Cursor als Data-URI (Skip, currentColor unmoeglich).
        ECHTE Drawer-Qty-Quelle: theme.js:5053 (JS-Template, 2x
        fill="#000") + block-cart.liquid Z29 CSS fill:#000 + theme.css
        .js-qty__adjust .icon fill:#222 (dritte Scanner-Luecke: .js!).
      FIXES (12 Edits, alle als var(--g-chrome-*, <altes Literal>)):
      (1) header.liquid: X-Pin -> var(--g-chrome-text, #000) - DER
          #63a-Fix, wirkt konsistent auf alle Modal-X.
      (2) block-cart.liquid Z29: Selektor um "svg path" erweitert +
          fill:var(--g-chrome-text, #000) - CSS auf dem path schlaegt
          das fill-Attribut aus theme.js; theme.js selbst UNANGETASTET.
      (3) theme.css + theme.css.liquid: .js-qty__adjust .icon
          fill:#222 -> var(--g-chrome-text, #222).
      (4) custom-reviews: Karte background -> chrome-bg (Nebenbefund,
          angenommen; Konsistenz zu Judge.me-Karten aus P1), Badge-CSS
          fill:#9e9e9e -> chrome-text (ENTSCHIEDENE Route statt
          verified_color - Light byte-identisch), Pfeil-Regel
          .custom_slider_items ... svg fill -> chrome-text(#000000) NEU.
      (5) reviews-slider: analog Karte + Badge + Pfeile
          (.slider_items-i-Scope).
      (6) custom-reviews-marquee: Badge-Regel NEU, per .c-{{section.id}}
          gescoped (Klasse .reviewbox-verified-text-i wird mit reviews-
          slider GETEILT - ungescoped wuerden sich die Sektionen auf
          gemeinsamen Seiten gegenseitig faerben).
      (7) custom-shoppable-video: Pfeil-Regel (.custom_video_items).
      SVG-fill-ATTRIBUTE bewusst NICHT auf currentColor umgestellt:
      CSS-Regel schlaegt Praesentationsattribut deterministisch;
      currentColor haette die Farbe an vererbte color-Werte gekoppelt
      (nicht byte-identisch beweisbar). icon-down/up sind bereits
      currentColor (sauber, kein Handlungsbedarf).
      BEKANNTE NUANCE (verifiziert): Marquee+reviews-slider auf EINER
      Seite - bisher leckte die Slider-Badge-Regel (#9e9e9e) in den
      Marquee-Badge; die gescopte Regel stellt das vom Marquee-Attribut
      intendierte Schwarz her (Leck-Korrektur, kein Regressions-Diff).
      VERIFIKATION: Headless 22/22 + Kombi-Check - 11 Proben Light
      computed alt=neu (X-::before, qty-path, icon-222, 2x Karte,
      3x Badge inkl. Marquee-allein, 3x Pfeile), 11 Dark-Smoke
      #181818/#fff kippt alles; Kombi-Fall alt=grau/neu=schwarz wie
      dokumentiert. Liquid-Parser: alle 5 Sektionen OK.
      Live-Test (TECH DARK 2): Drawer-X weiss sichtbar; Qty +/- im
      Drawer weiss; Review-Karten dunkel, Verified-Badges + Slider-
      Pfeile hell; Light-Stores unveraendert.
      NACHTRAG §7 (Davids Qty-"1"-Fund, Halb-Routen-Klasse):
      URSACHE der grauen Ziffer: theme.css Z3779 setzt global
      input/textarea/select auf color:#333 (schlaegt input{color:
      inherit} aus dem Normalize) - Form-Controls haengen also NICHT
      an den Seiten-Vars, sondern an einem Literal, das im Dark grau-
      auf-dunkel steht. FIXES (theme.css + .liquid, Doppelpflege):
      color: var(--g-chrome-text, #333) auf .js-qty__input,
      .product-form__item .js-qty__input, .cart__note (deckt Cart-
      Seite UND Drawer-Notiz - selbe Klasse), .input--content-color
      (Passwort-Seite); color: var(--g-chrome-text, inherit) auf
      .product-card .js-countdown li (Ziffern erben heute die Body-
      Textfarbe - inherit-Fallback beweisbar identisch, chrome-text
      macht sie im Dark crisp-weiss; .countdown-text behaelt bewusst
      sein gedaempftes rgba(body-text)). BONUS-Fund: block-cart Z391
      Gift-Icon inline stroke:#000 auf boxgift (P0-Chrome-Flaeche)
      -> stroke:var(--g-chrome-text, #000).
      DOKUMENTIERTE SKIPS (Text haengt an dark-preset-gemappten
      Settings-Vars, keine Halb-Route): overlay-btn (heading-rgb),
      style4-hover/btn-decline (g-main = CTA-Akzent), style5-btn
      (g-color-heading), split-banner/hotspot/pro__ser (Headings/
      Absaetze = Seiten-Typo), swiper-Pfeile (:after g-color-carousel),
      slick-thumb-Pfeile (chrome-text seit P0), option/video-close/
      drawer (Routen existieren seit P0), Judge.me-KARTENTEXT: Widget-
      CSS bringt eigene Literale mit - Container-color dringt nicht
      durch, Route = Judge.me-App-Einstellungen (an Summit gemeldet).
      NEBENBEFUND (Entscheidung Summit): theme.css Z3779 input/
      textarea/select {background:#f4f4f4; color:#333} ist die letzte
      grosse UNGEROUTETE Formular-Flaeche (Login, Kontakt, Suche,
      Newsletter-Inputs) - Chrome-Route waere konsistent, aber grosser
      Wirkradius; nicht ohne GO angefasst.
      VERIFIKATION §7: Headless 12/12 - 6 Proben Light alt=neu (Form-
      Controls #333 via Global-Regel bewiesen, countdown erbt grauen
      Ancestor durch, Gift-stroke schwarz), 6 Dark alle rgb(255,255,255).
      NACHTRAG 2 (User-GO 19.07.): Formular-GLOBALREGEL theme.css
      Z3779 input/textarea/select -> background var(--g-chrome-bg,
      #f4f4f4) + color var(--g-chrome-text, #333) (beide Dateien) -
      damit sind Login/Kontakt/Newsletter/Suche im Voll-Dark keine
      hellen Fremdkoerper mehr. BEWUSSTER REST: input[disabled]
      {color:#0006} bleibt (Disabled-Kontrast im Dark = eigene
      Entscheidung, an Summit gemeldet). Judge.me = OPERATOR-Aufgabe
      (App-Widget-Farben im Judge.me-Admin), steht auf Summits Dark-
      Preset-Checkliste, kein Theme-Edit.
      VERIFIKATION Nachtrag 2: Headless 24/24 - 12 Proben Light alt=neu
      (Login-/Kontakt-/Newsletter-/Such-Inputs, Textarea, Select je
      bg+color; Regression qty-input; Skip-Beweis disabled), 12 Dark
      #181818/#fff inkl. disabled unveraendert wie dokumentiert.
      Live-Test: TECH DARK Qty-Ziffer weiss (Drawer + Produktseite),
      Cart-Note-Text weiss, Countdown-Ziffern weiss, Gift-Icon im
      Drawer sichtbar; Light: Inputs unveraendert #333 auf #f4f4f4.

## 65. Custom Review(s): Badge-Color-Mapping + Sterne-Gradient
- [~] KORREKTUR 2026-07-19: Der User meinte den BLOCK "Custom Review"
      in Product Overview (product-template-1.liquid, block type
      custom_review) - zuerst wurde die eigenstaendige SEKTION
      "Custom Reviews" gepatcht (Fehlgriff, bleibt als sinnvolles
      Zusatzfeature bestehen). BLOCK-Umsetzung (der eigentliche Auftrag):
      (1) Block-Setting "Verified Badge Color" (badge_color, color,
          ohne Default, info "Empty = classic dark") - Haken-SVG hing
          hart an fill="#202329"; jetzt CSS-Route
          .customer-review-verified path { fill: var(--badge-color,
          #202329) } (CSS schlaegt Praesentationsattribut), Var wird
          am .customer-review-card-style nur bei gesetztem Wert
          emittiert. Leer = exakt bisheriges Dunkel. KEINE Chrome-
          Kaskade hier: die Karte laeuft ueber Operator-Settings
          (--background aus block.settings/branding_color), analog
          parallax-bg_box-Entscheidung.
      (2) stars_color: Typ color -> color_background (ID bleibt -
          gespeicherte Solid-Werte bleiben gueltige Strings; Summit-
          Mapping unveraendert nutzbar, aber Typ-Aenderung im Parse
          beachten). Solid-Pfad unveraendert (--stars-color/fill);
          bei Gradient-Wert ({% if contains 'gradient' %}) Mask-Route
          wie in der Sektionsvariante: fill transparent + background +
          mask(Stern-Pfad 32er-viewBox, identische Geometrie), Regel
          NACH der Solid-Regel (Kaskade), wirkt pro Stern, nur auf
          --filled (leere Sterne bleiben #D8D8D8).
      VERIFIKATION Block: Schema-JSON + alle Tags balanced; Headless
      6/6 (Badge default #202329 / Operator-Farbe gewinnt; Sterne
      solid identisch, Gradient-Fall fill transparent + background +
      mask aktiv).
      Live-Test Block: Produktseite -> Product Overview -> Block
      "Custom Review": "Verified Badge Color" setzen -> Haken folgt;
      "Stars Color" bietet jetzt Verlaufs-Picker -> Sterne im
      Gradient; Solid-Bestandswerte rendern unveraendert.
      SEKTIONS-Variante (Fehlgriff, behalten):
      (1) BLOCK-Setting "Verified Badge Color" (badge_color, type color,
          ohne Default, info "Empty = automatic (light/dark)") - der
          Haken haengt jetzt an der Kaskade
          var(--badge-color, var(--g-chrome-text, #9e9e9e)):
          leer = exakt bisheriges Verhalten (grau im Light, chrome-text
          im Dark), gesetzt = Operator-Farbe schlaegt BEIDE Modi.
          Var wird als style="--badge-color:..." am Verified-Container
          emittiert (nur wenn != blank/rgba(0,0,0,0)) - mappbar via
          Block-Settings (Summit-Writer).
      (2) SECTION-Setting "Reviews Stars Gradient" (color_gradient,
          type color_background, info "Overrides Reviews Stars Color") -
          Sterne-Gradient via CSS-Mask-Technik: SVG-fill kann keine
          CSS-Gradients, daher bei gesetztem Gradient fill:transparent
          + background:<gradient> + mask:url(data:svg Stern-Pfad,
          identische Geometrie wie das gerenderte Icon) center/contain.
          Gradient wirkt PRO Stern. Leer = kein CSS emittiert = exakt
          bisheriges Solid-Verhalten (Setting color).
          SCOPE-Auflage beachtet: .c_testimonial-reviewbox-rating wird
          auch von den HEADER-Sternen genutzt (eigenes SVG-Gradient-
          System) - Gradient-Regel deshalb auf
          .c_testimonial-reviewbox-footer gescoped (nur Karten).
      VERIFIKATION: Schema-JSON + Liquid-Parser OK; Headless 8/8 -
      Badge-Kaskade (default light grau / dark weiss / Operator-Farbe
      gewinnt in beiden Modi), Sterne solid unveraendert, Gradient-Fall
      (fill transparent, background-gradient aktiv, mask aktiv).
      (Harness-Lektion dokumentiert: {{ }}-Interpolationen VOR der
      Klammer-Extraktion ersetzen - "}" im Liquid-Tag truncated sonst
      die Regel und der Solid-Test bestand nur zufaellig via SVG-Attr.)
      Live-Test: Customizer -> Custom Reviews -> Block "Reviews":
      "Verified Badge Color" setzen -> Haken folgt der Farbe (Light
      UND Dark); leeren -> grau/weiss-Automatik. Section-Setting
      "Reviews Stars Gradient" setzen -> Karten-Sterne im Verlauf;
      leeren -> alte Solid-Farbe. Header-Sterne unveraendert.

## 66. Localization-Dropdowns (Header/Footer) auf Chrome-Route (Briefing #66)
- [x] VOM USER BESTAETIGT 2026-07-19 ("hat geklappt").
      UMGESETZT 2026-07-19 (Operator-Report TECH DARK 2: Country-/
      Language-Dropdowns blieben weiss). Befund des Briefings am Source
      verifiziert - das custom .disclosure-Panel lief an #63/#64 vorbei
      (die Formular-Globalregel aus aa55391 greift nur native
      input/textarea/select, nicht das UL-Panel).
      5 IN-PLACE-Edits (theme.css + theme.css.liquid, identisch):
      (1) .disclosure__list-wrapper: background -> var(--g-chrome-bg,
          rgba(var(--color-white),1)), border -> var(--g-chrome-border,
          rgb(var(--g-input-bg))).
      (2) .disclosure__item .disclosure__link: color -> var(--g-chrome-
          text, rgba(var(--color-body-text-rgb),1)) !important.
      (3) __link--active:after: Haken-Borders -> chrome-text-Route
          (Shorthand beibehalten, nur Farbwert getauscht).
      (4) #Header*Form .disclosure__list-wrapper: border ->
          var(--g-chrome-border, var(--g-input-border)).
      (5) .localization-form__select (Footer-Trigger): border ->
          chrome-border-Route.
      NICHT angefasst (Briefing-Auflage, im Test bewiesen): Trigger-
      TEXTFARBEN (--footer-title / --header-linkcolor / --header-text-
      top) und #Header*-Trigger border:transparent - ueberschreiben
      die Basis-Regel weiterhin. noscript-select laeuft ueber die
      aa55391-Globalregel (nichts zu tun).
      VERIFIKATION: Headless 16/16 - 8 Proben Light computed alt=neu
      (mit realistischen Seiten-Vars: Panel weiss, Border input-bg/
      input-border, Link body-text, Haken body-text, Trigger footer-
      title), 8 Dark #181818/#fff/#333 - Panel/Borders/Link/Haken
      kippen, die zwei Nicht-anfassen-Proben bleiben exakt Light-Wert.
      Live-Test (TECH DARK 2): Footer- und Header-Dropdown (Desktop +
      Mobile) oeffnen -> Panel dunkel, Text hell, Border chrome-border,
      Haken hell; Gegenprobe Preset ohne Chrome-Settings -> weiss/
      dunkel wie immer.

## 67. Blog-Karussell: "Mehr Details"-Buttons nicht buendig (Bug-Sammler 19.07., PETS)
- [x] VOM USER BESTAETIGT 2026-07-19 ("Fixes haben beide geklappt").
      UMGESETZT 2026-07-19. Operator: "mehr details immer auf der
      gleichen hoehe". Screenshot = featured-articles-Karussell
      (blogscroll, P6-Scroll-Snap) mit item_style blog-1: 3-zeiliger
      Titel drueckt den Button der dritten Karte tiefer.
      URSACHE: Der blogscroll-Flex-Container streckt die SLIDES gleich
      hoch, aber die innere Kette (.blogscroll-slide > div >
      .blog__item > .blog__content) war block-basiert - der Button
      hing am Textende statt am Kartenende.
      FIX (Section-Style, aufs Karussell gescoped - Blog-SEITEN-Grids
      unangetastet): Kette auf height:100%, .blog__item + .blog__content
      als Flex-Spalte, Button margin-top:auto + align-self:flex-start
      (align-self statt align-items, damit Titel/Text volle Breite
      behalten und der Button nicht auf Spaltenbreite streckt).
      Nur blog-grid-1 betroffen: grid-6/7 loesen es bereits selbst
      per mt-auto, grid-3 hat keinen Button.
      VERIFIKATION: Headless - ALT reproduziert Versatz (Unterkanten
      224/242/260 bei 1/2/3-zeiligen Titeln), NEU buendig (268 x3),
      Button bleibt shrink-to-fit (156px von 441px Spalte);
      Liquid-Parser OK.
      Live-Test: PETS-Homepage "Ratgeber"-Sektion - alle drei
      Mehr-Details-Buttons auf gleicher Hoehe, auch beim Sliden.

## 68. Comparison Table: B1-Bild-Fallback fehlte (THEME-Briefing "#67", 19.07.)
- [x] VOM USER BESTAETIGT 2026-07-19 ("Fixes haben beide geklappt").
      UMGESETZT 2026-07-19. Operator: "Wenn neu hinzugefuegt, werden
      gemappte Bilder nicht angezeigt." Briefing-Befund am Source
      bestaetigt: custom-comparison-table renderte das Spalten-Bild
      nur bei {% if block.settings.image != blank %} OHNE else -
      frisch hinzugefuegte Sektion = leere Blocks = kein Bild, obwohl
      das section_fallback-Metaobject (custom-comparison-table--table,
      image_1/2) gefuellt ist. Schwester-Sektionen waren laengst an
      brand-image angeschlossen.
      FIX: else-Zweig in der table-Block-Schleife nach Briefing-Muster
      (tab-vertical): brand-image mit position: loop_i (zaehlt 1-basiert
      NUR table-Blocks = exakte Position-Semantik), width 1000, in
      identischem table_media/media_image-Wrapper; Badge-Logik in den
      Fallback-Zweig GESPIEGELT (Auflage erlaubte es - Highlight-Spalte
      zeigt ihr Badge auch am Fallback-Bild). Bestehender if-Zweig
      byte-identisch. Keine Renames (parse-Contract unberuehrt).
      Hinweis aus dem Briefing: pool_size=2 - ein drittes table-Bild
      wrappt modulo auf image_1 (Datenlage, kein Theme-Problem).
      VERIFIKATION: Liquid-Parser OK (schema/for/if/capture balanced),
      brand-image-Callsite verdrahtet (Z343).
      Live-Test: Customizer -> Comparison Table NEU hinzufuegen ->
      Spalte 1 Produktbild, Spalte 2 Competitor-Chart (Metaobject);
      Sektion mit manuell gesetzten Bildern rendert unveraendert.

## 69. Before/After: Seitenverhaeltnis erzwingen (THEME-Briefing #69)
- [~] UMGESETZT 2026-07-19. Operator 18.07.: "Before/After bilder fucked.
      Sind nicht 16:9" - Primaerursache 1:1-Generierung fixt Summit;
      Theme wird zusaetzlich formatstabil.
      UMSETZUNG (before-after.liquid, Section-Style + Schema):
      - Neues Schema-Select "Aspect Ratio" (id aspect: 16/9 default,
        5/3, auto = heutiges Verhalten). NEUES Setting = parse-safe.
      - Bei aspect != auto: aspect-ratio auf .beer-slider + beide
        Bild-Ebenen auf cover.
      ZWEI ABWEICHUNGEN vom Briefing-CSS (beide verifiziert noetig):
      (1) Reveal-Bild MUSS width:200% behalten (nicht 100% wie im
          Briefing) - der Reveal-Clip zeigt sonst eine gequetschte
          linke Haelfte statt derselben Bildgeometrie wie die
          Nach-Ebene (Vendor-200%-Trick).
      (2) beerslider.css biegt .beer-reveal auf position:relative -
          dadurch waechst die Box mit der natuerlichen Bildhoehe an
          der aspect-ratio VORBEI und height:100% loest sich nicht
          auf. Im Ratio-Modus wird die Vendor-Geometrie
          wiederhergestellt (.beer-reveal absolute/top/left/height:100%,
          Breite bleibt JS-inline). NEBENEFFEKT: Die Ratio-Box deckelt
          damit auch das #51-Doppelhoehen-Symptom (uninitialisiert) -
          der tote Griff ohne Init bleibt #51.
      VERIFIKATION: Headless 4/4 - 1:1-Testbilder: AUTO folgt Bildhoehe
      (0.97, heutiges Verhalten), 16/9 erzwingt 1.778, Nach-Bild fuellt
      Box exakt, Vor-Ebene deckungsgleich (1000x563 == 1000x563, Init-
      Zustand mit width:50% simuliert wie von beerslider.js gesetzt);
      Schema-JSON + Liquid OK.
      Live-Test: Sektion mit 1:1-Bildern -> rendert 16:9 mit Crop,
      Griff laeuft ueber volle Breite, Mobile gleiche Ratio; Setting
      auf "Auto" -> exakt altes Verhalten.

## 70. B1-Verdrahtung Welle 1 + 3 (Freigabe auf B1_WIRING_AUDIT.md)
- [~] UMGESETZT 2026-07-19 auf User-GO ("Welle 1 + 3 freigegeben. Go").
      WELLE 1 (Handle liegt im Store, reine Theme-Fixes):
      (1) product-tab-split: BEIDE Placeholder-Zweige (mit/ohne
          Kollektion) -> brand-image product-tab-split--collection,
          position forloop.index, h-100-Wrapper wie if-Zweig.
      (2) count-down: BEIDE bgset-Zweige (bg_full/inline) -> else mit
          brand-image-src Slot 1 als inline background-image.
      (3) featured-collections-4: else-Ast setzt img_url jetzt via
          brand-image-src (position forloop.index); Element bekommt
          im Fallback-Fall style= statt data-bgset.
      (4) faq-accordion: Section-Root bgset + Slot-1-src-Fallback als
          style (Slot 2 = image_right war schon verdrahtet -
          Schema-Reihenfolge bestaetigt: image_bg ist Picker #1).
      (5) footer: image_bg-else -> brand-image Slot 1 (img_bg--footer;
          Schema-Reihenfolge: image_bg #1, imgpayment #2 bleibt BEWUSST).
      WELLE 3 (Code jetzt, Handles pusht Summit nach):
      (6) collection-grid-item: neue Param-Route b1_handle/b1_position
          (Muster quote-style) vor dem Placeholder; Klasse konditional
          (auto = Flow, sonst image-content__image cover).
          fc-1 reicht featured-collections-1--collection durch.
      (7) fc-3/fc-5: NUTZEN das Snippet NICHT (Audit-Korrektur -
          inline-Markup) -> eigener else-Ast vor dem Placeholder,
          Handles featured-collections-3/5--collection.
      (8) announcement-bar-slide: statischer 2. Zweig (Marquee) ->
          else wie Swiper-Zweig (--slide, forloop.index).
      (9) logo-list (inline) + logo-carousel-item (Snippet, neuer
          Param b1_position von beiden Callsites): logo-list--logo /
          logo-carousel--logo.
      (10) quotes + quotes-square: image_bg style-Attribut elsif-Route
          ueber brand-image-src Slot 1 (Handles quotes/quotes-square).
      (11) tab-vertical: Section-bgset + Slot-1-src-Fallback (faq-
          accordion-Muster); Handle tab-vertical.
      (12) map: else-Ast vor Onboarding-Placeholder, src Slot 1.
      (13) brand-video: neuer optionaler position-Param (video_<pos>,
          Fallback video_1 - rueckwaerts-kompatibel); custom-shoppable-
          video: table-Zaehler b1_pos_v + brand-video-Fallback im
          Placeholder-Ast (gleiche Wrapper-Struktur, Controls intakt).
      NICHT umgesetzt: Welle 4 (Sekundaer-Picker-Kontrakt) nicht
      freigegeben.
      NACHTRAG Header-Slots (Summit-Klaerung 19.07.):
      - logo_white = Slot 2 im BESTEHENDEN header-Handle (Section-Level
        hat exakt 2 Picker) -> site-logo.liquid verdrahtet: else-Zweig
        bei gesetztem Dark-Logo + Anhang im B1-Logo-Zweig; BEWUSST ohne
        logo_fallback (dunkles Markenlogo waere auf transparentem
        Header falsch). Audit korrigiert: kein Welle-4-Fall.
      - Slide-Menu-Banner lv1/lv2 -> Handles header--level_1/--level_2,
        Position = Nter Block des Typs: typ-gescopte Zaehler in beiden
        Titel-Match-Schleifen (slide-menu.liquid), B1-else vor beiden
        Placeholdern. Daten kommen mit Summits Sammel-Push.
      - KORREKTUR an Summit: sidebar_image_1..6 rendert NIRGENDS
        (wie menu_banner_*) - kein header--option-sidebar noetig,
        sidebar_image_2..6 auch kein Welle-4-Fall. Audit korrigiert.
      DATEN-NACHTRAG an Summit (Welle-3-Handles fehlen im Store):
      featured-collections-1/3/5--collection, announcement-bar-slide
      --slide (Welle 2), logo-list--logo, logo-carousel--logo, quotes,
      quotes-square, tab-vertical, map, custom-shoppable-video--product
      (video_1..N!).
      VERIFIKATION: 16 Sektionen + 3 Snippets Liquid-parse OK (schema/
      if/for/case/capture balanced), Marker-Check aller 19 Dateien
      (fc-1/logo-carousel korrekt 0 direkte Calls = Param-Route).
      Live-Test: Customizer, Sektion FRISCH hinzufuegen (leere
      Settings) -> Welle-1-Sektionen zeigen sofort B1-Bilder; Welle-3-
      Sektionen zeigen B1 sobald Summit die Handles gepusht hat (bis
      dahin unveraendert Placeholder); Sektionen mit manuell gesetzten
      Bildern byte-identisch.

## 71. Divider: Gradient-Option fuer Border Divider (Bug-Sammler 19.07., TECH DARK 2)
- [~] UMGESETZT 2026-07-19. Operator (chris-admin): "fuer diese farbe
      option fuer gradient einfuegen" - Screenshot: Divider-Sektion
      (Footer Group), Setting "Border Divider".
      UMSETZUNG (divider.liquid, Muster #65 stars_color):
      - Schema: bgborder Typ color -> color_background (ID bleibt,
        Default #dddddd bleibt; gespeicherte Solid-Werte gueltig -
        Summit-Parse: Typ-Wechsel beachten wie bei stars_color).
      - CSS-Verzweigung: bei Gradient-Wert border-top:0 !important +
        height:{{ wborder }} + background:{{ gradient }} (border-color
        kann keine Verlaeufe - Linie wird zur Flaeche in Border-Staerke);
        Solid-Zweig byte-identisch wie bisher.
      VERIFIKATION: Headless 5/5 - Solid alt=neu identisch (3px,
      #ddd, Bootstrap-.border-top ueberstimmt), Gradient-Fall border
      0px / Hoehe 3px / linear-gradient aktiv; Schema+Liquid OK.
      Live-Test: Divider-Setting "Border Divider" bietet Verlaufs-
      Picker; Verlauf waehlen -> Linie im Gradient (Staerke = Width
      Border); Bestands-Divider mit Solid-Farbe unveraendert.

## 72. Testimonial Slider Auto: Card-Background-Setting mit Gradient (Bug-Sammler 19.07.)
- [~] UMGESETZT 2026-07-19. Operator (chris-admin): "Option einfuegen
      den Hintergrund ... mit gradient anzupassen" - Screenshot zeigt
      die Review-KARTEN (.review-slider-i) der Sektion "Testimonial
      Slider Auto" (= reviews-slider.liquid).
      UMSETZUNG: Neues Section-Setting "Card Background"
      (card_background, color_background, info "Empty = automatic
      (light/dark)") - Kaskade: Operator-Wert (Solid ODER Gradient)
      > chrome-bg-Automatik (#64) > weiss. Konditionale Regel wird NACH
      der Basis-Regel emittiert (gleiche Spezifitaet, spaeter gewinnt);
      leeres Setting emittiert GAR KEIN CSS = byte-identisch inkl.
      Dark-Chrome-Verhalten.
      VERIFIKATION: Headless 4/4 - leer: light weiss + dark #181818
      exakt wie alt; Solid #ff00aa schlaegt chrome; Gradient aktiv.
      Schema + Liquid OK. (Harness: Liquid-Stub VOR Klammer-Extraktion,
      Conditional aus Roh-Source - die {{ }}-Lektion greift weiter.)
      Live-Test: Testimonial Slider Auto -> "Card Background" mit
      Verlauf setzen -> Karten im Gradient (beide Modi); leeren ->
      alte Light/Dark-Automatik.

## 73. Announcement Bar Slide: Animation-Setting entfernt (Bug-Sammler 19.07.)
- [~] UMGESETZT 2026-07-20. Operator (chris-admin): "Option 'Animation'
      rausnehmen" - Screenshot bestaetigt: das AOS-Dropdown unter
      "Enable" (NICHT "Scroll Animation" From Left/Right - das bleibt).
      Schema-Select animation entfernt + Nutzung bereinigt (data-aos +
      data-aos-duration vom Wrapper). Setting-ENTFERNUNG = parse-safe
      (#62-Praezedenz); gespeicherte animation-Werte in Presets werden
      schlicht ignoriert. VERIFIKATION: Schema OK, 0 Rest-Referenzen.
      Live-Test: Sektion anwaehlen -> kein "Animation"-Dropdown mehr;
      Bar rendert ohne AOS-Attribut wie vorher mit "None".

## 74. Product Overview Collapsible Row: Divider-Linienfarbe (Bug-Sammler 19.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Farbe dieser linie anpassbar
      machen" - Screenshot: Trennlinien unter den Collapsible Rows
      (block tabcustom, border-bottom 1px var(--g-input-border) aus
      product-template.css Z125).
      Neues Block-Setting "Divider Line Color" (divider_color, color,
      ohne Default, info "Empty = theme default") nach "Disable Border";
      Emission nur bei gesetztem Wert als border-bottom-color im
      vorhandenen .accordion_{{block.id}}-Style (hoehere Spezifitaet
      als Basis; no_border-Checkbox gewinnt weiter via !important).
      Leer = byte-identisch. VERIFIKATION: Schema + Liquid OK.
      Live-Test: Product Overview -> Collapsible Row -> Farbe setzen
      -> Linie dieser Row faerbt sich; andere Rows unveraendert.

## 75. Image with Text: Text Alignment wirkte nicht auf Review Type 1-3 (Bug-Sammler 19.07.)
- [~] UMGESETZT 2026-07-20. Operator: Review-Box bleibt links trotz
      "Text Alignment: Right".
      URSACHE: rating-custom wurde mit align: section.settings.
      align_heading gerendert - das Setting EXISTIERT im Schema von
      image-with-text nicht (Copy-Paste aus Sektionen, die es haben)
      -> leere text-Klasse -> die fit-content-Box blieb links. Die
      Ausricht-Mechanik existiert laengst (.reviews-block.text-center/
      right mit margin-auto in theme.liquid Z296ff).
      FIX: align : block.settings.align (das "Text Alignment" des
      Blocks, Werte left/center/right passen 1:1).
      VERIFIKATION: Headless 4/4 - leere Klasse (alt) = links, left =
      links, center = mittig (307/307), right = rechts (614/0);
      Liquid OK. Live-Test: Text-Block mit Review Type 1-3 ->
      Alignment Left/Center/Right verschiebt die Review-Box mit.

## 76. Reviews Stars (Product Overview): Stars Color mit Gradient (User 20.07.)
- [~] UMGESETZT 2026-07-20. User: "Stars Color Feld von 'Reviews Stars'
      Block in Product Overview soll auch gradient unterstuetzen wie
      die Sterne in 'Custom Review'".
      Block = reviews_start_2 in product-template-1 (5 Einzel-SVGs mit
      TEILFUELLUNG ueber linearGradient-stop currentColor - Stars
      Rating 3..5 in 0.1-Schritten!).
      UMSETZUNG (#65-Mask-Muster + Teilfuellungs-Erweiterung):
      - Schema: stars_color color -> color_background (ID bleibt,
        Solid-Bestandswerte gueltig; Parse-Hinweis Typ-Wechsel wie
        stars_color/#65 und bgborder/#71).
      - Gradient-Fall: pro Stern 3-Span-Stack - aeussere Box in
        Sterngroesse, CLIP-Ebene mit width=fill% (uebernimmt die
        +3-Offset-Semantik des SVG-Stops, gedeckelt auf 100), innere
        PAINT-Ebene in voller Sternbreite mit background=Verlauf +
        Stern-Mask (Data-URI, identischer 24er-Pfad) - so bleibt die
        Mask-Geometrie beim Teil-Clip stabil. CSS nur im Gradient-Fall
        emittiert; Solid-Zweig byte-identisch (git-diff: einzige
        geloeschte Zeile = Schema-Typ).
      VERIFIKATION: Headless 6/6 - Boxen 21px, volle Sterne Clip 21px,
      4.5-Rating-Halbstern Clip 11px (~53%), Paint bleibt 21px,
      Gradient + Mask aktiv; Schema/Liquid balanced.
      Live-Test: Product Overview -> Reviews Stars -> "Stars Color"
      bietet Verlaufs-Picker; Verlauf setzen -> Sterne im Gradient
      inkl. korrektem Halbstern bei Rating 4.5; Solid-Werte (#FFD900)
      rendern exakt wie bisher.

## 77. Reviews Stars: Font Size ohne Wirkung (Bug-Sammler 19.07., winkels)
- [~] UMGESETZT 2026-07-20. Operator: "review start 2 font size
      funktioniert nicht, es aendert sich nichts".
      URSACHE: Selektor-Mismatch in layout/theme.liquid - die Regel
      zielte auf .rating-excellent-2 p (Richtext-Content), aber der
      Locale-FALLBACK-Text (products.product.reviews_start_2_text_html
      = "<strong>4,8/5</strong> aus 149+ Bewertungen") hat KEIN <p>
      -> bei leerem Content-Feld (Default-Zustand!) griff weder
      Font Size noch Mobile Font Size noch TEXT COLOR (haengt an
      derselben Regel). Typ 1 nutzt .rating-excellent * und war
      deshalb nie betroffen.
      FIX: Selektor auf ".rating-excellent-2, .rating-excellent-2 p"
      erweitert (Desktop + Mobile-Media-Query) - Fallback-Text folgt
      jetzt Setting, Custom-<p>-Content unveraendert.
      VERIFIKATION: Headless 4/4 - ALT reproduziert 16px/schwarz trotz
      --font_size:20px; NEU 20px/Settingfarbe am Fallback, Custom-<p>
      identisch, Mobile 14px greift. (Harness-Randnotiz: theme.liquid
      lokal CRLF - Extraktions-Needles normalisieren.)
      Live-Test: Reviews Stars mit LEEREM Content -> Font-Size-Slider
      skaliert den Text neben den Sternen, Text Color faerbt ihn;
      mit eigenem Content unveraendert.

## 78. Reviews Stars Trustpilot: "4,8 von 5" ignorierte Text Color (User 20.07.)
- [~] UMGESETZT 2026-07-20. User: "das '4,8 von 5' muss immer die Farbe
      von 'Text Color' uebernehmen".
      URSACHE: Gleiche Klasse wie #77, Typ-1-Variante - Locale-Text ist
      "<strong>Exzellent</strong> 4,8 von 5"; ".rating-excellent *"
      faerbt nur ELEMENTE (das strong), der nackte Textknoten "4,8
      von 5" erbte die Umgebungsfarbe (auf dem Badge-Hintergrund).
      FIX (layout/theme.liquid): Selektor auf ".rating-excellent,
      .rating-excellent *" erweitert - Textknoten + strong folgen
      Text Color, Font Size wirkt jetzt ebenfalls auf den ganzen Text.
      VERIFIKATION: Headless 4/4 - ALT: Textknoten weiss (Umgebung)/
      strong Setting; NEU: beide Setting-Farbe, Font Size 18px greift
      am Textknoten. Live-Test: Reviews Stars Trustpilot -> Text Color
      aendern -> "Exzellent" UND "4,8 von 5" faerben sich gemeinsam.

## 79. B1 Welle-4-Leseseite: Video-Depots + Sekundaer-Kontrakt (Briefing "#70", 20.07.)
- [~] UMGESETZT 2026-07-20. NEUER Writer-Kontrakt (generalisiert, laeuft
      bei jedem Push): erstes Media-Setting (image_picker ODER video)
      in Schema-Reihenfolge = Legacy-Handle <section>--<block>; jedes
      weitere Media-Setting = <section>--<block>--<settingId>. Folge:
      video-erste Bloecke tragen im Legacy jetzt video_1..N.
      DATENLAGE VERIFIZIERT (56 Handles): instagram-customize--video
      = video_1(+pool 1), --video--image_poster = image_1; pt1
      --review_images nur noch image_1 (image_2/3 in eigenen Depots!),
      --videos analog, --image--video = video_1; slideshow-1/2
      --slide--image(+--image_mobile) NEU; tab-vertical--tab--image2
      (image_1..3, pool 3); ivwt --image_block--image2.
      UMBAUTEN (7 Dateien):
      (1) brand-video: pool_size-Modulo wie brand-image (position ->
          video_<idx>, Fallback video_1) - rueckwaerts-kompatibel.
      (2) instagram-customize video-Block: Flip auf brand-video
          (Legacy, position b1_pos_v) -> Poster via brand-image
          (--image_poster) -> Placeholder.
      (3+4) slideshow-1/2: Bild-Fallback-Handle auf --slide--image
          (Legacy gehoert dem video-Setting; hielt nur Alt-Bilder und
          bricht beim naechsten Writer-Lauf).
      (5) pt1 videos-Block: Setting-Position -> Handle-Mapping
          (pos1=Legacy, pos2/3=--videos--image_2/3, je position 1) -
          vorher lief pos2/3 per Modulo IMMER auf image_1.
      (6) pt1 review_images: NEUE ri2/ri3-else-Zweige auf
          --review_images--image_2/3 (hatten nie Fallbacks).
      (7) tab-vertical image2 + ivwt image2: Sekundaer-Anschluss
          (else vor Placeholder, Muster Big-Image bzw. Container).
      KEIN FLIP (verifiziert Bild-first, Daten belegen es):
      image-auto-slider--video traegt weiterhin image_1..4 (Poster
      ist erstes Media-Setting) - bestehender brand-image-Call korrekt.
      custom-shoppable-video: Code laeuft schon auf brand-video ✓.
      RUECKMELDUNGEN AN SUMMIT: Depots fehlen weiterhin fuer
      custom-shoppable-video--product und sticky-video-product;
      slideshow-1--slide Legacy haelt Alt-Bilder mit inkonsistenter
      pool_size(2)/6 Bildern - beim naechsten Writer-Lauf klaeren;
      pt1 --image--video (video_1) noch NICHT angeschlossen (Video-
      Sekundaer am pt1-Banner-Block = eigener Folgeauftrag falls
      gewuenscht). Editor-Preview-Artefakt dokumentiert: frisch
      injizierte Sektionen rendern im Customizer mit veralteten
      Metaobject-Daten - erst Preview-Reload zeigt Fallbacks;
      Kundenfall nicht betroffen (Bild-Pfad E2E-bewiesen).
      VERIFIKATION: 6 Sektionen Liquid-parse OK, brand-video
      tag-balanced, Marker-Check alle 7 Dateien; Live-E2E via
      Probe-Sektion auf der Sync-Homepage (b1_ig_probe) nach Push.
      Live-Test: Instagram Customize frisch -> 3 Bild-Kacheln
      (Depot) + 3 Video-Kacheln (video_1, autoplay muted); tab-
      vertical/ivwt ohne Zweitbild -> Depot-Bild statt Placeholder.
      NACHTRAG Hoehen-Falle (User-Fund "keine Kacheln mehr"):
      Die Ratio-Box der Kacheln haengt am <a> der INSTANZ-Pfade
      (.instagramoff-item a{padding-top:var(--h-image-insta)}) und
      theme.css macht JEDES img/video im Item absolut (Z9805) - die
      B1-Fallback-Medien ohne <a>-Wrapper kollabierten auf 0 Hoehe
      (Placeholder-DIV hatte dagegen eine eigene Box; deshalb sah
      man mit Depot-Daten WENIGER als ohne!). FIX: .instagramoff-b1box
      (position relative + padding-top var + overflow hidden) um alle
      drei Fallback-Ausgaben (Bild, Video, Poster). Memory-Regel
      bestaetigt: Fallback-Container brauchen IMMER eigene Ratio.
      VERIFIKATION Nachtrag: Headless 3/3 - ALT Item 0px (Kollaps
      reproduziert), NEU 300px-Box, Bild cover 300x300; Liquid OK.

## 80. "In den Warenkorb legen" theme-weit gekuerzt (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator (chris-admin): de -> "Warenkorb",
      "ggf fuer alle Sprachen verkuerzen" (lange Button-Texte sprengen
      Layouts - i18n-Textlaengen-Klasse wie #19/#29).
      INVENTUR: 2 Theme-Keys (general.quickview.addtocart +
      products.product.add_to_cart) in 10 Locales; pagefly.* =
      App-Namespace, NICHT angefasst. Nutzung = reine Button-Labels/
      Tooltips/JS-Strings, keine Satz-Einbettung (Kleinschreibung in
      de/es/pt war Altbestand ohne Funktion).
      KUERZUNGEN (Substantiv-Form analog Operator-Vorgabe): de
      Warenkorb, da Kurv, es Cesta, fr Panier, it Carrello, nl
      Winkelkar (deren Vokabular), pt-BR/PT Carrinho. UNVERAENDERT:
      en "Add to Cart" + ja (bereits kurz).
      HYGIENE: minimal-invasive String-Replaces statt JSON-Reserialisierung
      (die sortierte 404-Bloecke um) - Diff exakt 16 Zeilen, alle 10
      JSONs validiert.
      HINWEIS: Gespeicherte Button-Text-SETTINGS in Presets/Templates
      schlagen Locale-Defaults - wo Operatoren eigene Texte gesetzt
      haben, greift die Kuerzung nicht (bekanntes i18n-Muster).
      Live-Test: Produktkarte/Sticky-Cart/Quickview auf de ->
      "Warenkorb"; Sprachwechsel fr/es/it -> kurze Nomen.

## 81. Image With Tabs: Preset 4 -> 3 Bloecke (Bug-Sammler 20.07., FASHION)
- [~] UMGESETZT 2026-07-20. Operator: "darf nur mit 3 bloecken kommen,
      nicht 4" (Screenshot: 4. Block "Title" durchgestrichen).
      FIX: custom-images-tabs.liquid Preset-blocks von 4x tab auf 3x
      tab. Rein additiv-subtraktives Schema (kein Rename, parse-safe);
      Bestandsinstanzen unberuehrt (Presets wirken nur beim
      Neu-Hinzufuegen). VERIFIKATION: Schema OK.
      Live-Test: Sektion neu hinzufuegen -> genau 3 Image-Bloecke.

## 82. Slideshow: Icon-Pills erbten "Slide Font Transform" Uppercase (Bug-Sammler 18.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Icons aus den slideshows
      duerften nicht 'Uppercase' aus den Theme Settings uebernehmen.
      Es ist body font."
      URSACHE: Das Icon-Pill-<li> traegt selbst die Klasse
      slideshow__title (slideshow-1 Z1130, slideshow-2 Z886 -
      Layout-/Abstands-Kette) und erbte damit die komplette
      Title-Typo inkl. text-transform: var(--g-slide-font-transform)
      (Theme-Setting "Slide Font Transform" unter Title Slideshow).
      FIX (minimal-invasiv, beide Slideshows): Override
      li.icons_cont.slideshow__title { text-transform: none; } direkt
      nach der Title-Regel - nur das gemeldete Symptom, restliche
      Pill-Typo (Groesse/Spacing ueber c_icon_item) unangetastet.
      VERIFIKATION: Headless 4/4 - ALT: Titel uppercase + Pill ERBT
      uppercase (Repro); NEU: Titel uppercase, Pill none. Liquid OK.
      Live-Test: Theme Settings -> Title Slideshow -> Slide Font
      Transform "Uppercase" -> Titel gross, Pills behalten
      Body-Schreibweise (Desktop + Mobile, Slideshow 1 UND 2).

## 83. Scratch Newsletter Popup: Dark-Mode (Texte unsichtbar + weisser Backdrop) (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator (split 2/2): "Texte im dark mode
      nicht sichtbar. Hintergrund ... weisses overlay, muss dunkel."
      PATTERN: Darkmode-Chrome-Klasse (#63/#64) - Popup war
      "separat-entscheiden"-Zone aus Briefing 1, jetzt explizit
      angefordert.
      URSACHE: Box-BG folgt --color-body (Page Background, im Dark-
      Preset dunkel -> Box wird schwarz), aber Texte HART #14120F
      (dunkel-auf-dunkel) + muted-Grays; Backdrop hart
      rgba(252,251,247,.82) weiss. --color-body-text als Route
      SCHEIDET AUS (immer definiert -> wuerde die Light-Muting-
      Hierarchie #8A8375/#6E6759 auf Body-Text vereinheitlichen).
      FIX (Chrome-Route, Fallback = altes Literal): 8 Ersetzungen -
      dialog.scnl Basisfarbe (h-main erbt sie), .scnl__close,
      .scnl__logo, .scnl__h-top, .scnl__sub, .scnl__legal,
      .scnl__hint auf var(--g-chrome-text, <lit>); ::backdrop auf
      var(--g-chrome-bg, rgba(252,251,247,.82)) - Light byte-identisch
      (Chrome-Vars nur im Dark-Preset gesetzt), Dark -> Text weiss +
      Backdrop #181818 (opak statt transluzent-weiss = sauberer).
      BEWUSST NICHT: Weisses Input-Feld (#FFFFFF, im Dark lesbarer
      Kontrast, Operator ok laut Screenshot) + dunkler CTA-Button
      (#14120F Flaeche/weisser Text: Label bleibt lesbar, Flaeche
      geht im Dark unter - als Folge-Beobachtung notiert, nicht
      ungefragt umgebaut). Muted-Grays werden im Dark voll-weiss
      (Hierarchie-Verlust) - konsistent mit #64-Badge-Entscheidung.
      VERIFIKATION: Headless 10/10 - 5 Proben Light computed alt=neu
      (Basis/h-main-Erbe/2x muted/Backdrop), 5 Dark kippen (#fff /
      #181818); Liquid OK.
      Live-Test: TECH DARK -> Scratch Popup oeffnen -> Texte hell
      lesbar, Backdrop dunkel; Default-Preset -> unveraendert.

## 84. Image With Auto Slider: "Style Button" wird nicht uebernommen (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: Style Button "Button Box"
      gewaehlt, Button rendert aber nackt/als Umriss.
      URSACHE (per Admin-API im Template gelesen, NICHT geraten): der
      GESPEICHERTE style_btn-Wert ist ein LEERER String "" (vom Preset-
      Mapping geschrieben, nicht der Schema-Default). Das Schema hat
      keine Leer-Option -> Shopify-Editor zeigt als Fallback die 1.
      Option "Button Box" an, gerendert kam aber class="btn " (nackt).
      Panel-Anzeige und Render widersprachen sich -> "wird nicht
      uebernommen". KEIN CSS-/Markup-Bug.
      FIX: {{ style_btn | default: 'btn-theme' }} in allen 3 identischen
      Markup-Stellen (image-auto-slider, image-with-text, product-with-
      image - gleiche Copy-Paste-Kette, gleiche latente Luecke). Liquid-
      default greift bei leerem String (verifiziert) -> Render == Panel-
      Anzeige (1. Option); echte Werte passieren unveraendert.
      VERIFIKATION: Liquid-default-Semantik (""->btn-theme, sonst
      pass-through) + 3 Sektionen Liquid-parse OK.
      RUECKMELDUNG SUMMIT: Preset-Mapping schreibt leere style_btn -
      idealerweise den Schema-Default (btn-theme) statt "" setzen.
      Live-Test: Image With Auto Slider Text-Block -> Button gefuellt
      (Button Box); andere Styles bleiben waehlbar.

## 85. Quick View: weisse Modal-Flaeche -> Content unsichtbar im Dark (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Quick View hintergrund ist
      weiss daher content unsichtbar" (Titel/Preis/Optionen weiss-auf-
      weiss im Dark-Preset). PATTERN: Chrome-Klasse (#63/#64, Modal wie
      Drawer).
      URSACHE: Die weisse Flaeche kommt vom INLINE-BOOTSTRAP
      (.modal-content{background:#fff} im 154KB-Blob header-css Z2) -
      Text erbt --color-body-text (im Dark hell) -> weiss auf weiss.
      FIX (QV-gescoped, im quickview.liquid-Style-Block - Bootstrap-Blob
      NICHT angefasst): #jsQuickview .modal-content background ->
      var(--g-chrome-bg, #fff); dazu die 2 weissen Fade-Gradienten
      (.qv-content:after Verlauf + .qv-product-description:after) auf
      chrome-bg (Verlauf-Start auf transparent). Andere Modals
      (Upsell etc.) unberuehrt.
      VERIFIKATION: Headless 4/4 - modal-content + desc-fade Light
      #fff (mit Bootstrap-Basis, byte-identisch), Dark #181818.
      Live-Test: TECH DARK -> Quick View oeffnen -> Panel dunkel,
      Titel/Preis/Optionen hell lesbar; Default-Preset -> weiss.

## 86. Kollektionsseite: View-Mode-Icons + Filter-Checkboxen unsichtbar im Dark (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Kollektionsseiten: Elemente
      aus Screenshot nicht sichtbar" - View-Mode-Toggle (3 leere Kaesten)
      + Filter-Checkbox-Rahmen ohne Kontrast im TECH DARK. PATTERN:
      Chrome/Dark (#63/#64).
      URSACHE:
      (1) View-Icons (.js-btn-view, theme.css Z8412): der Button
          HARDCODET lokal --g-color-heading-rgb:0,0,0 -> die Icon-
          Striche (rgba(var(--g-color-heading-rgb),0.2) + aktive
          box-shadows) sind IMMER schwarz, im Dark unsichtbar; nur der
          graue Rahmen #E0E0E0 = die sichtbare leere Box.
      (2) Checkbox-Rahmen (.checkbox__label:before Z11600): border
          rgba(heading,0.2) - im Dark hell@20% zu schwach.
      FIX (theme.css + theme.css.liquid):
      (1) Den lokalen --g-color-heading-rgb:0,0,0-Hardcode ENTFERNT ->
          Striche folgen den Theme-Heading-Vars (Dark hell = sichtbar).
          Kopplung wie #82/#64; Light minimal (reines #000 -> Heading-
          Farbe @0.2 auf 2px-Strich, bei den ueblichen schwarzen
          Headings identisch).
      (2) Checkbox-border -> var(--g-chrome-border, <altes rgba>) -
          Light byte-identisch (Chrome-Var nur im Dark gesetzt), Dark
          ueber den Border-Token (#333). Generische .checkbox betroffen
          (Facets/Cart/etc.), Light unveraendert.
      VERIFIKATION: Headless 5/5 - Checkbox Light identisch + Dark
      chrome-border #333; View-Icon Light Heading-gekoppelt, Dark hell,
      ALT-Dark bleibt schwarz (Repro).
      HINWEIS SUMMIT: chrome-border(#333) auf #181818 ist bewusst
      subtil - falls Checkboxen deutlicher sein sollen, ist das ein
      chrome-border-Tuning (Settings), keine Theme-Logik.
      Live-Test: TECH DARK Kollektion -> View-Toggle-Striche hell
      sichtbar, Checkbox-Rahmen erkennbar; Default -> unveraendert.

## 87. Search-Drawer "Suchen nach"-Button unsichtbar im Dark (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: "dark mode search unsichtbar".
      URSACHE: .predictive-search__item--term ist ein <button> OHNE
      explizite background/color -> UA-Default-hellgrau; im echten
      Drawer erbt der Button die helle Drawer-Textfarbe -> hell-auf-
      hellgrau unsichtbar (Light: dunkler UA-Button-Text war lesbar).
      FIX (component-predictive-search.css): background-color
      rgba(var(--color-foreground),0.04) + color rgb(var(--color-
      foreground)) - koppelt an die Theme-Foreground-Var (kippt mit
      Preset), subtile Bar-Optik wie die vorgesehene Hover-Regel;
      component-CSS laedt nach theme.css -> gewinnt deterministisch.
      VERIFIKATION: Headless - NEU dark Kontrast 18.2, light 17.3
      (beide klar lesbar, komponiert ueber Body-BG).
      Live-Test: TECH DARK -> Suche oeffnen, tippen -> "Suchen nach"-
      Bar hell lesbar; Default -> unveraendert.

## 88. Delivery Date: "Box 2 Font Size Mobile" wirkungslos (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: Setting aendert nichts,
      "denke bei allen presets". URSACHE: Der Mobile-Media-Query
      setzte .c_fast-delivery span HART auf font-size:12px - der
      sichtbare Text steckt in diesem span, und .c_fast-delivery span
      (Spezifitaet 0,1,1) ueberstimmt die Setting-Regel .c_fast-
      delivery (0,1,0) bei box_2_font_size_mobile. Desktop war ok
      (kein span-Font-Override).
      FIX: das harte 12px auf {{ block.settings.box_2_font_size_mobile
      }}px geroutet. VERIFIKATION: Headless - mobile span = 5px
      (Setting-Wert); Liquid OK.
      Live-Test: Delivery Date -> Box 2 Font Size Mobile -> Text der
      unteren Box (Versand/Checkout) skaliert mobil.

## 89. Promo Sale: im Tablet-View nicht zentriert (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: "fuer tablet view zentrieren,
      auf allen presets". URSACHE: Die Zentrier-Regel galt
      @media (max-width:1049px) AND (min-width:768px) - die Spanne
      553-767px (u.a. Shopifys 749px-Tablet-Preview!) war ungedeckt
      -> dort space-between/linksbuendig.
      FIX: untere Grenze (min-width:768) entfernt -> ganzer Sub-Desktop-
      Bereich <=1049px zentriert; Desktop (>=1050) unveraendert
      space-between.
      VERIFIKATION: Headless - Promo @749/@900 justify-content:center,
      @1300 bleibt space-between.
      Live-Test: Tablet-Preview -> Promo-Box (Copy + Countdown)
      mittig; Desktop -> Copy links / Countdown rechts wie gehabt.

## 90. Slider-Navigations-Pfeile unsichtbar im Dark (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Dark Mode: Arrows unsichtbar,
      auch Testimonials Trustpilot, vermutlich noch anderswo". PATTERN:
      Chrome/Dark (#63/#64). Screenshot = Blog Posts (weisse Kreise
      ohne sichtbaren Pfeil).
      URSACHE: --g-color-carousel = color_body_headings (im Dark hell).
      Die GLOBALE Swiper-Flaeche ist seit #63 chrome-routed (dunkler
      Kreis -> heller Glyph sichtbar), ABER SECHS Arrow-Flaechen waren
      HART weiss -> im Dark hell-auf-hell:
      - 3 Scroll-Snap-Arrows (background:#fff + glyph var(--g-color-
        carousel)): featured-articles (blogscroll), instagram-customize
        (instascroll), logo-carousel (logoscroll).
      - 3 _r-Swiper-Arrows (background-color:white + svg fill chrome-
        text): custom-reviews (= Testimonials Trustpilot!), reviews-
        slider, custom-shoppable-video. NB: #64 hatte hier nur den
        Glyph (SVG-fill) auf chrome-text geroutet, die FLAECHE blieb
        weiss - Halb-Fix; jetzt komplett.
      FIX: alle 6 Arrow-Flaechen background -> var(--g-chrome-bg,
      <weiss>). Light byte-identisch (Chrome-Var nur im Dark gesetzt),
      Dark dunkle Kreise -> heller Glyph/SVG sichtbar.
      VERIFIKATION: Headless 12/12 - je Sektion Light-Flaeche #fff
      identisch + Dark #000; alle 6 Sektionen Liquid OK.
      Live-Test: TECH DARK -> Blog Posts / Testimonials Trustpilot /
      Instagram / Logo-Carousel -> Pfeile sichtbar (dunkler Kreis,
      heller Pfeil); Default -> weisse Kreise wie gehabt.

## 91. Collapsible Row: Divider Line Color mit Gradient (Bug-Sammler 20.07., Folge zu #74)
- [~] UMGESETZT 2026-07-20. Operator: "Gradient Funktion hinzufuegen
      fuer Divider Line Color". PATTERN: color_background + Gradient
      (#71/#76).
      UMSETZUNG: divider_color (tabcustom-Block) color -> color_background
      (Parse-Hinweis: 4. Typ-Wechsel neben stars_color/bgborder).
      CSS-Verzweigung: bei Gradient border-image: {{ gradient }} 1
      (border-color kann keine Verlaeufe; :before/:after sind vom
      +/- -Toggle-Icon belegt -> kein Pseudo frei; border-image
      rendert nur auf der Bottom-Kante, die als einzige Breite hat).
      Solid-Fall unveraendert (border-bottom-color, #74-identisch).
      WICHTIG: ganzer Divider-Block in {% unless no_border %} gewrappt -
      border-image ist NICHT Teil der border-Kurzform, wuerde also von
      .no-border{border:unset!important} NICHT gekillt -> Leak-Schutz.
      VERIFIKATION: Headless 5/5 - Solid border-bottom-color=Setting
      (img none), Gradient border-image aktiv + Bottom 1px bleibt,
      no_border+Gradient KEIN Leak (border-image none), leer=Theme-
      Default; Schema+Liquid OK.
      Live-Test: Collapsible Row -> Divider Line Color -> Verlaufs-
      Picker -> Trennlinie im Gradient; Solid + Disable Border wie
      gehabt.

## 92. Collection Image Hover: Preset 3 -> 2 Bloecke (Bug-Sammler 18.07., PETS)
- [~] UMGESETZT 2026-07-20. Operator: "Wenn neu hinzugefuegt, 3 Bloecke,
      sollen 2 sein, bei allen Presets." Section = featured-collections-4
      (Editor-Label "Collection Image Hover"). Preset-blocks von 3x auf
      2x item_collection. Parse-safe (kein Rename), Bestandsinstanzen
      unberuehrt. VERIFIKATION: Schema OK, Preset zaehlt 2.
      Live-Test: Sektion neu hinzufuegen -> 2 Bloecke.

## 93. Tab Vertical: nur erstes Bild gerendert (Bug-Sammler 19.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Image gemapped, im theme nur
      das erste angezeigt". NICHT dieselbe Baustelle wie #70/#79 (die
      waren nur B1-Fallback-Verdrahtung) - Pattern-Check bestaetigt
      neuer Bug. Depot-Daten korrekt (image_1/2/3 distinct, pool 3).
      URSACHE: Der block.settings.image-Pfad nutzt das lazysizes-Muster
      (src=1x1-Platzhalter, data-src=echtes Bild, .lazyload). Inaktive
      Tab-Panes sind display:none, es gibt KEIN shown.bs.tab-Re-Init in
      theme.js -> lazysizes enthuellt die Bilder in Tab 2/3 nie (bleiben
      1x1). Nur Tab 1 (aktiv beim Laden) laedt. Daher: VOR dem Mappen
      (leer->B1, plain <img>, laedt sofort) zeigten alle; NACH dem
      Mappen (->lazysizes) nur der erste. Big- UND Small-Bild betroffen.
      FIX: beide Bilder auf echten src + scale-in lazyloaded (wie der
      B1-Pfad, laedt unabhaengig von Sichtbarkeit) statt src=1x1/
      data-src/.lazyload; srcset+sizes fuer Responsivitaet.
      Memory-Regel beachtet: scale-in NIE bare -> scale-in lazyloaded.
      VERIFIKATION: Headless 4/4 - ALT in display:none nur 1x1 geladen
      (Repro), NEU echtes Bild (300px) + opacity 1 (lazyloaded); ALT
      bare scale-in opacity 0. Liquid OK.
      Live-Test: Tab Vertical mit 3 gemappten Bildern -> jeder Tab
      zeigt sein Bild (auch nach Klick auf Tab 2/3).

## 94+95. Booking Form: Description-Default + englische Defaults (Bug-Sammler 19.07.)
- [~] UMGESETZT 2026-07-20. Operator: "Booking Form komplett
      uebersetzen, Description per default leer." Section =
      contact-booking.liquid.
      #94: answer_content (richtext, Label "Description") hatte
      Lorem-Default -> geleert (Default-Key entfernt). Das zweite
      "Description"-Feld (id description, textarea) war schon leer.
      #95: VOLLER i18n-Fallback in ALLEN 10 Locales (Nachbesserung auf
      User-Hinweis "in allen Sprachen wie immer" - erste Fassung setzte
      nur dt. Schema-Defaults). Shopify-Schema-default-WERTE koennen
      KEIN t: (nur label/info/content), daher Render-| t-Fallback:
      - 3 neue Keys sections.booking.title / .budget_label /
        .interested_default in de/en/fr/es/it/nl/da/ja/pt-BR/pt-PT
        (de in Du-Form).
      - Schema-Defaults der 3 Felder GELEERT; leer -> uebersetzter
        Fallback: title via section-heading fallback_title-Param;
        store_label + interested via {%- assign fb = 'key' | t -%}
        dann | default: fb. interested-Guard auf iw umgestellt (blank
        -> Fallback, sonst Merchant-Wert). store_location "Budget 1"
        bleibt (neutrales Nummern-Placeholder). contact.form.*-Felder
        waren schon lokalisiert.
      FILTER-ORDER-FALLE (vor Push gefangen): {{ x | default: 'key'
        | t }} wendet | t auf das default-ERGEBNIS an -> gesetzte
        Merchant-Werte wuerden zu "translation missing". Fix: Key
        ZUERST per assign uebersetzen, dann default: <var>. Mit
        liquidjs-Mock bewiesen (gesetzt=Merchant-Wert, leer=Fallback).
      VERIFIKATION: Schema-JSON valide, 3/3 Keys in allen 10 Locales,
      Liquid OK, Filter-Order-Beweis.
      Live-Test: Booking Form neu je Storefront-Sprache -> Ueberschrift/
      Budget-Label/Radio-Optionen in der jeweiligen Sprache; Merchant-
      Override bleibt erhalten; Description leer.

## 96. Grid Banner: ungewollte Default-Texte beim Hinzufuegen (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (dd05d11). Operator (PETS-Preset): neu
      hinzugefuegte Grid-Banner-Sektion zeigt 3 statt 2 Bilder + Default-
      Text ueber der Sektion + Subtitle auf den Bannern. Section =
      grid-banner.liquid.
      BLOCK-COUNT 3->2: Theme-Basispreset war BEREITS 2 (presets[0].
      blocks). Die 3 Blocks stammen aus Summits PETS-Preset (Builder-
      seitig, NICHT im Repo) -> Summit-Folgepunkt, nicht theme-fixbar.
      TEXT-DEFAULTS (das Repo-fixbare): 3 Schema-Defaults lecken durch,
      wenn ein Preset die Banner befuellt aber diese Felder leer laesst:
      subtitle_top="Subtitle Top", section title="Grid banner", block
      subtitle="Subtitle". Alle drei Default-Werte GELEERT (Key entfernt)
      -> Felder starten leer. Block-title "Image with text" + desc
      "Lorem" bewusst NICHT angefasst (Operator-Scope = Subtitle +
      Section-Headings; AI-Summary bestaetigt selbe 3 Felder).
      VERIFIKATION: Schema-JSON valide, preset=2 Blocks, 3 Defaults
      undefined.
      Live-Test: neue Grid-Banner-Sektion (Basis-Add) -> keine
      "Subtitle Top"/"Grid banner"/"Subtitle"-Platzhalter mehr.

## 97. Gradient-Option fuer 5 Border-Farben + fehlende Border-Option (Bug-Sammler 20.07., 2 Splits = 1 Report)
- [~] UMGESETZT 2026-07-20 (868f593). Operator: Gradient fuer "Border
      Color" in Custom Review (Product Overview), "Stars Border Color"
      (Testimonial Slider Auto = reviews-slider), "Bullet Card Border"
      (Image With Bullets = custom-image-bullets), "FAQ Divider Border"
      (FAQ Advanced); im Testimonials Slider (= custom-reviews-marquee)
      fehlt die Border-Color-Option KOMPLETT.
      SCHEMA: 4x color -> color_background (Custom-Review-Block
      border_color; stars_border_color; card_border_color; faq
      border_color). Marquee: NEUES Setting quote_box_border
      (color_background, default #ffffff = alter Hardcode ->
      Bestandsinstanzen byte-gleich). KEIN Rename -> parse-safe;
      color_background im Theme etabliert. Summit-Folge: 5 Typwechsel/
      Neu-Setting in Summits Parse nachziehen (zu den 4 offenen aus
      #65/#71/#72/#76/#91).
      RENDER: 4 Karten (radius-faehig) via Doppel-Background
      padding-box/border-box + border:transparent im Gradient-Branch;
      SHORTHAND-FALLE headless gefangen: nur die LETZTE Background-
      Layer darf eine Farbe sein - solide Innenfarbe MUSS als
      linear-gradient(c,c) gewrappt werden, sonst wird die GANZE
      Deklaration verworfen (backgroundImage:none). FAQ-Divider
      (gerade border-bottom-Linie) via border-image wie #91.
      Solid-/Leer-Pfad = alte Deklarationen im else-Branch.
      VERIFIKATION: 14/14 liquidjs (solid=ALT je Stelle; gradient-
      Branch; PT1 mit bg solid/leer->branding/gradient), 3/3 Edge
      headless (2-Layer-Background aktiv, Border transparent,
      border-image-Source) + Pixel-Screenshot: weisse Karte mit
      rot->blau-Ring (Radius erhalten) + Gradient-Linie.
      Live-Test: je Sektion Border-Setting auf einen Gradient stellen
      -> Rahmen/Linie zeigt Verlauf, Karteninneres behaelt seine
      Farbe; Solid-Werte und Bestandsinstanzen unveraendert.

## 98. Product Overview: Thumbnail-Pfeile abgeschnitten (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (aa0cde8). Operator (alle Presets): Arrows am
      Thumbnail-Slider abgeschnitten. URSACHE doppelt: theme.css setzt
      global .swiper-button-* 44px !important und ueberstimmt die 32px
      der Snippet-Regeln (product-media.liquid = laut theme.css-Kommentar
      single source of truth); zusaetzlich left/right:-4px AUS dem
      .swiper-Container (overflow:hidden) heraus -> Kreis gekappt.
      FIX im Snippet: 32px !important, left/right +4px, :after 12px
      !important. Headless-Repro (echte Schichten swiper-bundle ->
      theme.css -> Snippet): VOR 44px+Ueberstand, NACH 32px, 4/4
      Clip-Checks false + Screenshot.
      Live-Test: Produktseite mit >6 Medien -> beide Thumb-Pfeile
      vollstaendig rund sichtbar.

## 99. Timeline: 4->3 Preset-Bloecke + Neben-Datum/READ-MORE leer (Bug-Sammler 20.07., 2 Splits)
- [~] UMGESETZT 2026-07-20 (81a684b). Kreis-Jahr "1920" bleibt (orange
      markiert). Preset: 4. milestone raus, "time"+"link" aus den 3
      verbleibenden. Schema: button_text-Default "Read more" +
      Block-link-Default "/collections/all" geleert. Render-Guard:
      Anchor nur wenn link UND button_text (sonst leerer btn-underline).
      Live-Test: neue Timeline -> 3 Bloecke, keine Jan/Feb-Daten,
      kein READ MORE.

## 100. Rich Text: Platzhalter-Defaults leer (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (b277794). Defaults "Subtitle Top" /
      "Talk about your brand" / "<p>Use this text...</p>" entfernt;
      blank-Guards vorhanden, Preset setzt nichts.
      Live-Test: neue Rich-Text-Sektion -> alle 3 Felder leer.

## 101. Collection List Swiper: "All Products"-Button uebersetzen (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (fa5ceaf). Sektion = featured-collections-3.
      Muster #95: Default geleert, Render-| t-Fallback (Key vorab
      uebersetzt wegen Filter-Order-Falle). Neuer Key
      sections.collection_list.all_products in allen 10 Locales.
      TRADE-OFF (wie #95): leer -> uebersetzter Text; Button laesst
      sich nicht mehr durch Leeren ausblenden.
      Live-Test: Sektion neu je Storefront-Sprache -> Button in
      Landessprache; eigener Text gewinnt.

## 102. Bundle Selection: komplett uebersetzen (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (117877d). custom-bundle-section: 6 Schema-
      Defaults geleert -> vorab uebersetzte Fallback-Assigns (Muster #95);
      limit_error mit count=max_items, description mit count=min_items
      interpoliert ("15% OFF" der alten Defaults war Beispieltext ohne
      Setting -> Fallbacks generisch "und spare"). Hardcodes uebersetzt:
      Your bundle, No-products-Hinweis, JS Adding.../Fetch-Fehler
      (| t | json, quote-sicher), aria Remove item. 11 Keys
      sections.bundle.* in 10 Locales (nl "winkelkar" wie #80).
      Gleicher Trade-off wie #101 (heading/desc/eyebrow nicht mehr
      per Leeren ausblendbar).
      Live-Test: Sektion je Sprache -> alle Texte lokalisiert;
      Fehlermeldungen mit korrekter Max-Zahl.

## 103. Contact Form: Inputs rosa (FASHION) — KEIN Theme-Bug, Preset-Daten
- [x] DIAGNOSE 2026-07-20, kein Theme-Commit. Operator: "Eingabefelder
      uebernehmen eine Farbe... warum kloppt der da ne farbe rein?"
      URSACHE: Kontakt-Inputs (.field.form-group > .form-control) ziehen
      background: var(--g-input-bg) = Theme-Setting "Background Input"
      (Gruppe "--- Input", header-css.liquid Z.232, Default weiss seit
      #14). Das FASHION-Preset befuellt dieses Setting mit dem
      Brand-Rosa -> Theme rendert korrekt, was das Setting sagt.
      Die Chrome-Route aus #64 (input/textarea/select global) ist NICHT
      die Quelle (wird von der spezifischeren form-group-Regel
      ueberstimmt) - erster Verdacht widerlegt, Umbau (neues
      color_input_bg-Setting) verworfen/zurueckgebaut: haette mit dem
      BESTEHENDEN --g-input-bg kollidiert (immer gesetzt, Default #fff)
      und die Dark-Kette ausgehebelt.
      SINNVOLLE FARBE: Setting leeren (= Weiss) oder bewusst Weiss.
      FIX-ORT: Summit-Preset-Daten (FASHION u.a.): "Background Input"
      NICHT mit Brandfarbe befuellen; Operator kann sofort im
      Customizer Theme Settings -> Input -> Background Input leeren.

## 104. Contact Form: reCAPTCHA-Hinweis als Description-Default (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (07278ff). Operator: "Text muss immer der
      text aus dem screenshot sein per default" (reCAPTCHA-Disclaimer).
      Feld = answer_content (richtext, Label "Description"), hatte
      Lorem-Default. Statt engl. Hardcode: Default geleert + Render-
      Fallback auf Shopifys System-Key shopify.online_store.
      spam_detection.disclaimer_html (von Shopify in ALLEN Sprachen
      gepflegt, inkl. Privacy/Terms-Links); Key vorab uebersetzt
      (Filter-Order, Muster #95). Merchant-Text gewinnt. Schema-info
      dokumentiert. Nebeneffekt gewollt: Bestandsinstanzen mit
      unangetastetem Lorem zeigen jetzt den Disclaimer.
      Live-Test: neue Contact-Form-Sektion je Sprache -> Disclaimer
      lokalisiert unterm Formular; eigener Text ersetzt ihn.

## Redeliveries 20.07. (Bug-Sammler liefert alte Beobachtungsstaende nach)
- [x] Timeline 4->3 + Texte (reported 19.07. 15:29) = DUBLETTE #99
      (gefixt 81a684b 20.07.); Preset heute 3 Bloecke, verifiziert.
- [x] Image With Auto Slider Button-Style (reported 19.07. 12:09,
      Theme-Push 11:54) = DUBLETTE #84 (Fix ef16dcc erst 20.07. 12:39).
      Screenshot zeigt exakt das #84-Symptom: Dropdown zeigt "Button
      Box" fuer den leeren Preset-Wert, gerendert nur nackter .btn.
- [x] Promo Sale Tablet "fucked" (reported 18.07. 20:57) = DUBLETTE #89
      (Fix c290139 20.07. 14:19): Countdown linksgedraengt = Tablet-
      Regeln griffen im 553-767px-Gap (Shopify-Preview 749px) nicht;
      #89 erweiterte die Query genau darauf, headless-verifiziert.

## 107. Image With Text: Style-Button-Default Line White -> Button Box (Summit-Briefing 20.07.)
- [~] UMGESETZT 2026-07-20 (b434dfd). Als SUMMIT/push-Bug gemeldet
      ("Mapping sagt Button Box, neu hinzugefuegt zeigt Line White"),
      tatsaechlich THEME-Schema: beim manuellen Customizer-Add greift
      NUR der Schema-Default (Mapping wirkt nur auf gepushte Template-
      Sektionen). Text-Block-Default war "btn-underline btn-underline-
      white" (weiss, auf hellen Presets unlesbar) -> "btn-theme"
      (Button Box), konsistent mit Mapping + #84-Fallback.
      Nebenwirkung gewollt: Bestandsbloecke ohne gespeicherten
      Style-Wert rendern kuenftig Button Box.
      HINWEIS Schwester-Sektionen: image-auto-slider, grid-banner
      (u.a.) haben denselben Line-White-Default - nicht angefasst
      (Report-Scope nur Image With Text); bei Folge-Reports gleiches
      Muster anwenden.
      Live-Test: Image With Text neu hinzufuegen -> Style Button
      steht auf "Button Box", Button dunkel/lesbar.

## 108. Slideshow 1+2: Hover-Textfarbe pro Button bei aktiver Hover-Animation (User-Feature 20.07.)
- [~] UMGESETZT 2026-07-20 (0366507). WARUM: Bei enable_button_hover
      sind die Block-Hover-Settings versteckt+neutralisiert (#44b/A6);
      Hover-Zustand = globale Farben (var(--g-btn-hover-color), Sweep
      var(--g-main)) bzw. #44-Pins auf Basisfarbe. Zwei Buttons pro
      Slide (Solid hell + Outline weiss) koennen mit EINEM globalen
      Wert nie beide kontrastieren.
      NEU: color_button_hover_anim (+_2) je Button in SS1+SS2,
      visible_if NUR bei Animation an (komplementaer zu Legacy-
      Settings; SS2-Legacy-visible_if nachgezogen). Render: 8 Style-
      bloecke, am Ende .btn.slideshow__btn*:hover{color:X !important}
      (!important wegen #44-Underline-Pins; leer/transparent/Animation-
      aus = byte-genau ALT).
      SUMMIT-FOLGE: 2 NEUE Block-Settings je Sektion im Parse
      nachziehen (color_button_hover_anim, color_button_hover_anim_2
      in Slideshow 1 + Slideshow 2).
      VERIFIKATION: Schema-JSON, liquidjs 8x4 Faelle, Edge headless
      echte Kaskade (hover_1): Setting-Farbe gewinnt auch gegen
      !important-Pin; ohne Setting ALT-Verhalten.
      Live-Test: TECH DARK 2, Slideshow-Block: "Color Button Hover"
      (bei aktiver Animation sichtbar) je Button setzen -> Hover-Text
      nimmt die Farbe an; Feld leer -> wie bisher.

## 109. Scratch-Newsletter: Dark-Backdrop deckend schwarz -> halbtransparent (User 20.07.)
- [~] UMGESETZT 2026-07-20 (33c25c0). #83 hatte dialog.scnl::backdrop
      aufs OPAKE --g-chrome-bg geroutet -> im Dark-Preset komplett
      schwarz, Seite unsichtbar (Light-Original: rgba(252,251,247,0.82)).
      FIX: Light-Logik uebertragen - color_modify: 'alpha', 0.82 auf
      settings.color_chrome_bg zur Renderzeit (dark -> rgba(0,0,0,0.82));
      ohne/transparentes Chrome-Setting = Light-Original byte-gleich.
      MERKE: --g-chrome-bg ist opak - fuer Overlay-/Backdrop-Flaechen
      NICHT direkt verwenden, sondern Alpha per color_modify (vgl. #83-
      Backdrop war die einzige solche Flaeche mit voller Deckung).
      VERIFIKATION: liquidjs 3 Faelle (dark/leer/transparent).
      Live-Test: TECH DARK 2 -> Scratch-Popup oeffnen -> Seite hinter
      dem Modal bleibt abgedunkelt sichtbar; Light unveraendert.

## 110. Testimonial Slider Auto: Gradient fuer Box Border Color (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (6c41e33). border_color (Karten-Ring; #97
      hatte nur stars_border_color) color -> color_background. Ring war
      box-shadow 0 0 0 1px (kann kein Gradient) -> Gradient-Branch mit
      border transparent + padding-box/border-box (#97-Technik).
      ZWEI FALLEN: (a) Innen-Layer darf kein var() mit Farb-Fallback
      sein (Multi-Layer-Shorthand wird sonst KOMPLETT verworfen) ->
      card_background bzw. color_chrome_bg/#ffffff als Literal +
      linear-gradient(c,c)-Wrap; (b) card_background-Override-Regel
      bei Gradient-Border NICHT emittieren (uebermalte sonst den Ring).
      Solid/leer byte-genau ALT. Summit-Folge: Typwechsel nachziehen.
      VERIFIKATION: liquidjs 6 Faelle.
      Live-Test: Box Border Color auf Verlauf -> Ring zeigt Gradient,
      Karteninneres behaelt Farbe (auch mit gesetztem Card Background).

## 111. FAQ Advanced: Gradient-Divider unsichtbar (Bug-Sammler 20.07., #97-Folgebug)
- [~] UMGESETZT 2026-07-20 (bb59dd8). P4: --accordion-border hielt den
      Gradient -> "1px solid var(<grad>)" invalid -> Breite 0 ->
      border-image ohne Flaeche. #97-Test hatte Solid-Literal statt
      echter Var-Pipeline (Luecke geschlossen). FIX: im Gradient-Zweig
      border-bottom 1px transparent VOR border-image. Headless: ALT
      0px (Repro), NEU 1px+Gradient, Solid unveraendert.
      Live-Test: FAQ-Divider auf Verlauf -> Linie sichtbar.

## 112. Gradient-Border-Familienfix: Mask-Ring statt Doppel-Background (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (db0457e). Operator: Custom-Review-Border
      "ueberschreibt ganzen background". URSACHE: border-box-Layer der
      #97/#110-Doppel-Background-Technik fuellt die GANZE Flaeche ->
      blutet durch halbtransparente Innen (TECH-DARK-Glas). FIX an
      allen 5 Stellen: maskiertes ::before-Ring-Overlay (P6), Innen
      exakt ALT (Wrap-Hacks + var-Verbote entfallen; reviews-slider
      card_background-Override wieder unconditional): customer-review-
      card, rating-custom-2, review-slider-i, iwb-bullet-item,
      review_marquee_item. Keine Schema-Aenderungen.
      Verifiziert: liquidjs 10 Faelle + Headless-Screenshot
      (ALT=Karte komplett rot, NEU=Glas + 1px-Ring).
      Live-Test: TECH DARK 2 Custom Review, Border-Gradient setzen ->
      nur Ring farbig, Karten-Glas bleibt.

## 113. Border Color mit Gradient ADD: Image With 4 Icons + Testimonials Trustpilot (Bug-Sammler 20.07., 2 Splits)
- [~] UMGESETZT 2026-07-20 (113a Icons, 113b in 4f7ad80-Serie).
      image-with-icons: neues border_color (color_background, leer =
      Automatik abgedunkeltes Block-BG); solid via --g-border-block-
      Override, Gradient via border-image auf den odd/even-Trennlinien
      (gerade Linien; last-child style:none blendet weiter aus).
      custom-reviews: neues card_border_color (leer = kein Border wie
      ALT); solid = border 1px, Gradient = P6-Mask-Ring.
      Summit-Folge: 2 neue Settings. Verifiziert: liquidjs je 3 Faelle.
      Live-Test: je Sektion Border auf Verlauf -> Linien/Ring im
      Gradient; leer = wie vorher.

## 114. Product Overview: Border Color (Sektionsrahmen) mit Gradient (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (8e03736). Report ohne Screenshot ->
      als Rahmen um die GESAMTE Sektion interpretiert (additiv,
      leer = kein Rahmen). section_border_color (color_background)
      auf #ProductSection-<id>: solid border 1px, Gradient P6-Ring
      (z-index 2, pointer-events none). Summit-Folge: neues Setting.
      Live-Test: Setting fuellen -> Rahmen um die Sektion; falls der
      Operator etwas ANDERES meinte (z.B. Media-Border), Follow-up
      mit Screenshot abwarten.

## 115. Testimonials Trustpilot: Card Background eigene Option (Bug-Sammler 20.07.)
- [~] UMGESETZT 2026-07-20 (mit #113b committed). card_background
      (color_background, leer = Chrome-Automatik wie ALT, Muster #83)
      als spaetere Regel ueber der Chrome-Basis; Solid UND Gradient.
      Summit-Folge: neues Setting.
      Live-Test: Card Background setzen -> Karten eigene Farbe/Verlauf;
      leer -> Chrome wie bisher.

## 116. Newsletter: Background Color wirkungslos + Opacity Background (Bug-Sammler 20.07., 2 Splits)
- [~] UMGESETZT 2026-07-20 (e2fe178). BUG: background_section
      ("Background Color") existierte NUR im Schema - kein Render-
      Konsument -> Farbe wirkte nie. FEATURE: "Opacity Background"
      direkt darunter. Render: background-color auf .newsletter-
      section-<id> (Grundfarbe UNTER Bild/B1 + Overlay; fuer Toenung
      UEBER dem Bild weiterhin Background/Opacity Overlay), Deckkraft
      via color_modify-Alpha (#109-Muster); opacity_background
      (0-1, default 1). Leer/transparent = ALT. Schema-info erklaert
      Sichtbarkeits-Semantik (Farbe hinter Cover-Bild unsichtbar).
      Summit-Folge: neues Setting. Verifiziert: liquidjs 4 Faelle.
      Live-Test: Newsletter OHNE Hintergrundbild -> Farbe sichtbar,
      Opacity-Regler daempft sie; mit Bild -> Bild verdeckt (gewollt).

## 21. [GEPARKT bis alle Bugs durch] Slideshow 1 in 2 Section-Typen splitten
- [ ] User-Entscheidung 2026-07-09: Erst alle Bugs fixen (Fixes gelten dann fuer
      beide Instanzen), DANACH Slideshow 1 splitten - Variante ohne den Schema-
      Hinweistext "You can choose between two slideshow layouts..." fuer die
      Nicht-Sticky-Instanz (Vorlage), Sticky-Instanz behaelt ihn. Hintergrund:
      Schema-Paragraph gilt pro Section-TYP, pro Instanz nicht steuerbar.

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
