# Partner-Änderungen nacharbeiten — präzise Checkliste

**Kontext:** Das Zip `summitx4.zip` basiert auf einer **anderen/älteren Theme-Variante** (vor der Vanilla-Migration, kein `native-ui.js`, theme.js noch mit Slick). Ein direkter Import würde die komplette Vanilla-Arbeit zurücksetzen **und** das Theme verfälschen. Darum: **die Änderungen im Shopify-Editor auf dem aktuellen Theme (`main`) nachbauen.**

## ⚠️ Wichtig: 5 Sektionen aus dem Zip existieren bei uns NICHT → Ersatz nutzen

| Zip-Sektion | bei uns? | **Ersatz im aktuellen Theme** |
|---|---|---|
| `image-content` | ❌ | **Image with text** (`image-with-text`) |
| `divider_advanced` | ❌ | **Divider** (`divider`) |
| `line` | ❌ | **Divider** (`divider`) |
| `s_team_member` | ❌ | **Team member** (`team-member`) |
| `new-faq` | ❌ | **FAQ accordion** (`faq-accordion`, Items ergänzen) |
| main-page, rich-text, slideshow-1, quotes, map, contact-form, faq-accordion, article-template, featured-articles, footer | ✅ | identisch |

---

## Soll-Aufbau pro Seite (im Editor so anordnen)

### 1. Seite „About Us v3" (`page.about-us-v3.json`)
1. Main page
2. **Image with text** _(Zip: image-content — Block: Text + Bild)_
3. **Divider** _(Zip: divider_advanced)_
4. Rich text _(Überschrift + Absatz)_
5. **Image with text** _(Zip: image-content — Block: Bild + Text)_
6. Slideshow 1 _(1 Bild)_
7. Quotes _(4 Zitate)_
8. **Team member** _(deaktiviert; 3 Mitglieder)_ _(Zip: s_team_member)_
9. Map
10. Contact form _(deaktiviert)_

_Ggü. unserem aktuellen Stand raus: 3× image-with-text (alt), 2× logo-carousel, 1× image-video-with-text, 1× team-member (alt), 1× icon-list, 1× rich-text — und durch obige Anordnung ersetzen._

### 2. Seite „Contact" (`page.contact.json`)
1. Main page
2. **Divider** _(Zip: line)_
3. Contact form

_Raus ggü. aktuell: image-with-text, icon-list, divider, map, faq-accordion._

### 3. Seite „FAQs" (`page.faqs.json`)
1. Main page
2. FAQ accordion _(3 FAQs)_
3. **Divider** _(Zip: divider_advanced)_
4. **FAQ accordion** mit 6 Items _(Zip: new-faq — als zweites FAQ-accordion nachbauen)_
5. Slideshow 1 _(1 Bild)_
6. Rich text _(Überschrift + Absatz + Button)_

### 4. Seite „Team Member" (`page.team_member.json`)
1. **Team member** _(5 Mitglieder)_ _(Zip: s_team_member)_

### 5. Seite „Store" (`page.store.json`)
1. Main page
2. Rich text
3. **Image with text** _(Zip: image-content — Bild + Text)_
4. **Image with text** _(Zip: image-content — Text + Bild)_

_Raus ggü. aktuell: 2× image-with-text (alte Variante) → durch die zwei obigen ersetzen._

### 6. Blog-Artikel-Layout (`article.json`)
1. Article template
2. **Divider** _(Zip: line)_
3. Featured articles

### Footer (`footer-group.json`)
**Keine Aktion** — identisch zu unserem Stand (footer mit Newsletter + 3 Menüs + Contact).

---

## Hinweis für den Merge
- Die Sektions-**Inhalte/Einstellungen** (Texte, Bilder, Links) müssen aus dem alten Theme manuell übernommen werden — sie stecken im Zip in den jeweiligen `templates/page.*.json` unter `sections[...].settings` / `blocks`, falls Detailwerte gebraucht werden.
- **Nicht** das Zip importieren. Nur im Editor nachbauen → Shopify synct sauber nach `main`, über die Vanilla-Arbeit gelegt.
