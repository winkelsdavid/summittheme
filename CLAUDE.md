# Summit Theme — Hinweise für Claude

- **Shopify Admin-API:** Token liegt in `.env` (gitignored; Scopes: Themes lesen).
  Nur lesende Zugriffe (Themes listen, Dateien gepushter Themes ziehen);
  Token niemals in Ausgaben/Commits/Logs ausgeben.
- **Deploys:** ausschließlich über den GitHub-Sync (Push auf `main` =
  Live-Deploy zu nitrothemex). Live-Store-Mutationen (Admin-API-Writes,
  Browser-Automation gegen den Store) weiterhin nur nach expliziter Freigabe.
