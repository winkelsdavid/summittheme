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
- [~] ALLE Slide-Inhalte (Review-Badge "Reviews Type", Top Title, Heading,
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
