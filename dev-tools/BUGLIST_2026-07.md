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
