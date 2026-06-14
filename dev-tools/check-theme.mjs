#!/usr/bin/env node
/*
 * check-theme.mjs — Theme-Health-Checker für Shopify-Themes (v4)
 *
 * Lives in the Summit repo so future Claude sessions can read + extend it
 * without re-discovering the bug taxonomy. Originally a standalone script
 * outside the repo; v4 closes four classes of misses that the v3 silently
 * passed through.
 *
 * Was v4 zusätzlich findet (vs. v3):
 *
 *   1) UN-ESCAPED CONTROL CHARS in JSON-String-Literals
 *      Klassischer Shopify-Export-Bug: Tab / Newline / CR direkt in einem
 *      "..."-Wert statt als "\t" / "\n" / "\r" escaped. JSON.parse rejected
 *      das mit "Bad control character in string literal" — Shopify weigert
 *      sich beim Theme-Import. Trifft fast immer config/settings_schema.json
 *      und mehrere locales/*.json. v3 hat das gemeldet aber nicht gefixt;
 *      v4 escaped die Chars in der --fix-Kopie.
 *
 *   2) HARDCODIERTE LIQUID-SECTION-REFS auf fehlende Sections
 *      `{% section 'xyz' %}` in einem .liquid-Template. v3 hat nur JSONs
 *      gescannt — Liquid-Hardcodes wurden komplett übersehen.
 *
 *   3) ALLE shopify://-Schemas ausgewiesen, nicht nur shopify://files/
 *      v3 hat shop_images / collections / pages stillschweigend als
 *      "harmlos" weggepuffert. Stimmt fast immer — aber nicht IMMER:
 *      Wenn ein Custom-Build hochgeladen wird sind die Demo-Bilder eines
 *      Theme-Store-Themes meist tot. v4 weist sie als WARN aus (nicht
 *      BLOCKER, aber sichtbar) und bietet optional --strip-all-shopify-uri.
 *
 *   4) MISSING-SECTION-FIX-PFADE
 *      v3 hat die fehlenden Sections nur aufgelistet — keinen Fix-Pfad.
 *      v4 bietet zwei optionale Fixes:
 *         --remove-missing-section-refs   : aus templates/*.json die
 *           Section-Slots löschen die auf fehlende sections zeigen.
 *           Brutal aber stellt sicher dass das Template lädt.
 *         --stub-missing-sections         : minimale .liquid-Stubs in
 *           sections/ schreiben (leeres {% schema %} + Kommentar) so
 *           dass die Referenz auflöst und der Operator später die
 *           echte Section nachladen kann.
 *
 * Default-Fix (v4 weicht hier BEWUSST von v3 ab — Header-Bug-Fix: stand
 * früher fälschlich auf ""):
 *   - shopify://files/ → null   (NICHT "" — siehe "CRITICAL #2" am Fix-Code
 *     unten: "" lässt Shopifys settings_data-Importer manche TYPISIERTEN
 *     Settings (video / image_picker / file) das ganze Template ablehnen;
 *     null ist Shopifys kanonischer "leer"-Marker und wird akzeptiert.
 *     Hinweis: "" ist nicht IMMER fatal — bei untypisierten/Text-Settings
 *     lief es empirisch auch durch; null ist die sichere Obermenge.)
 *   - Control-Chars in JSON-Strings escapen
 *
 * Aufruf:
 *   node check-theme.mjs "<Theme-Ordner-oder-ZIP>"
 *   node check-theme.mjs "<...>" --fix "<Out-Pfad>"
 *   node check-theme.mjs "<...>" --fix "<Out>" --remove-missing-section-refs
 *   node check-theme.mjs "<...>" --fix "<Out>" --stub-missing-sections
 *   node check-theme.mjs "<...>" --fix "<Out>" --strip-all-shopify-uri
 *
 * ZIP-Eingabe: v4 akzeptiert auch eine .zip direkt — wird ins OS-Temp
 * entpackt, gescant, und (bei --fix) der gefixte Output als FRISCHE ZIP
 * statt als Ordner geschrieben. So muss der Operator nicht selbst
 * entpacken/re-zippen.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, relative, dirname, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { unzipSync, zipSync } from 'fflate';

// ---------- Argument parsing ----------
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));
const flag = (name) => argv.includes(`--${name}`);
const flagValue = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};
const INPUT = positional[0];
const FIX_OUT = flagValue('fix');
const FIX_REMOVE_MISSING = flag('remove-missing-section-refs');
const FIX_STUB_MISSING = flag('stub-missing-sections');
const FIX_STRIP_ALL_URI = flag('strip-all-shopify-uri');

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', grey: '\x1b[90m',
};

if (!INPUT || !existsSync(INPUT)) {
  console.log(c.red + 'Kein gültiger Theme-Pfad: ' + INPUT + c.reset);
  console.log(c.grey + 'Übergib einen entpackten Theme-Ordner ODER eine .zip-Datei.' + c.reset);
  process.exit(2);
}

// ---------- ZIP unpack (wenn nötig) ----------
//
// All ZIP I/O goes through fflate. Earlier versions shelled out to
// `Compress-Archive` / `unzip` / `zip` — the PowerShell path wrote
// archive entries with Windows-style backslashes (`layout\theme.liquid`)
// instead of the forward-slash paths Shopify's importer requires.
// Symptom: "missing template 'layout/theme.liquid'" rejection even
// though the file IS in the ZIP, just under the wrong path separator.
// fflate is the same library parse-theme uses, so behaviour is
// byte-for-byte the same shape Summit's Edge Function already proved.

function isZip(p) {
  return p.toLowerCase().endsWith('.zip') && statSync(p).isFile();
}

function unzipToDir(zipPath, dst) {
  const bytes = readFileSync(zipPath);
  const entries = unzipSync(new Uint8Array(bytes));
  mkdirSync(dst, { recursive: true });
  for (const [name, data] of Object.entries(entries)) {
    // fflate may emit empty Uint8Array for directory entries
    // ("foo/" with no payload). Skip those — directories are
    // implicit from the file paths we DO write.
    if (name.endsWith('/')) continue;
    const target = join(dst, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(data));
  }
}

let ROOT = INPUT;
let tmpRoot = null;
if (isZip(INPUT)) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'theme-check-'));
  try {
    unzipToDir(INPUT, tmpRoot);
  } catch (e) {
    console.log(c.red + 'ZIP konnte nicht entpackt werden: ' + e.message + c.reset);
    process.exit(2);
  }
  // ZIPs vom Shopify-Editor wrappen alles unter <theme-name>/. Wenn das
  // einzige Top-Level-Item ein Ordner ist, dort einsteigen.
  const top = readdirSync(tmpRoot);
  if (top.length === 1) {
    const inner = join(tmpRoot, top[0]);
    if (statSync(inner).isDirectory()) ROOT = inner;
    else ROOT = tmpRoot;
  } else {
    ROOT = tmpRoot;
  }
} else if (!statSync(INPUT).isDirectory()) {
  console.log(c.red + 'Das ist weder eine .zip noch ein Theme-Ordner: ' + INPUT + c.reset);
  process.exit(2);
}

// ---------- Helpers ----------
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.') || name.startsWith('_')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

// Tolerant JSON parse (block + line comments + trailing commas).
//
// State-machine pass — NOT the naive `replace(/\/\/.../g)` regex.
// Locales-files ship URLs inside string literals
// (`"href=\\\"https://developers.google.com/...\\\""`) and a regex-
// based line-comment stripper would happily eat `//developers.../`
// as if it were a `// line comment`. The v3 tool did exactly that
// and the silent corruption is why summitnewclean.zip still failed
// in Shopify. Reuses the same shape we already proved in
// `_shared/jsonc.ts` for the parse-theme Edge Function.
function stripJsoncArtifacts(raw) {
  // BOM strip first — Shopify-Admin exports sometimes prefix it.
  const s = raw.replace(/^﻿/, '');
  let out = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  while (i < s.length) {
    const c = s[i];
    const next = s[i + 1];
    if (inString) {
      out += c;
      if (c === '\\' && i + 1 < s.length) {
        out += s[i + 1];
        i += 2;
        continue;
      }
      if (c === stringChar) inString = false;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = s.indexOf('*/', i + 2);
      i = end === -1 ? s.length : end + 2;
      continue;
    }
    if (c === '/' && next === '/') {
      const nl = s.indexOf('\n', i + 2);
      i = nl === -1 ? s.length : nl;
      continue;
    }
    // Trailing comma strip — only outside strings.
    if (c === ',') {
      let j = i + 1;
      while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\n' || s[j] === '\r')) j += 1;
      if (j < s.length && (s[j] === '}' || s[j] === ']')) {
        i += 1;
        continue;
      }
    }
    out += c;
    i += 1;
  }
  return out;
}
function posToLineCol(s, pos) {
  const lines = s.slice(0, pos).split('\n');
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

// State-machine pass that escapes unescaped control chars (0x00–0x1F)
// INSIDE string literals. JSON.spec forbids them; Shopify-Exports ship
// them anyway. The pass respects backslash escapes so an already-escaped
// `\n` (two characters, `\` then `n`) passes through untouched.
function escapeStringControlChars(src) {
  let out = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  let edits = 0;
  while (i < src.length) {
    const ch = src[i];
    if (inString) {
      // Backslash-escape: copy both chars verbatim.
      if (ch === '\\' && i + 1 < src.length) {
        out += ch + src[i + 1];
        i += 2;
        continue;
      }
      if (ch === stringChar) {
        out += ch;
        inString = false;
        i += 1;
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        switch (ch) {
          case '\b': out += '\\b'; break;
          case '\t': out += '\\t'; break;
          case '\n': out += '\\n'; break;
          case '\f': out += '\\f'; break;
          case '\r': out += '\\r'; break;
          default:   out += '\\u' + code.toString(16).padStart(4, '0'); break;
        }
        edits += 1;
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
      continue;
    }
    // Outside a string.
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      out += ch;
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return { text: out, edits };
}

// ---------- Index files & inventory ----------
const allFiles = walk(ROOT);
const jsons = allFiles.filter((f) => f.toLowerCase().endsWith('.json'));
const liquids = allFiles.filter((f) => f.toLowerCase().endsWith('.liquid'));

const sectionsDir = join(ROOT, 'sections');
const templatesDir = join(ROOT, 'templates');
const existingSections = new Set(
  existsSync(sectionsDir)
    ? readdirSync(sectionsDir)
        .filter((f) => f.toLowerCase().endsWith('.liquid'))
        .map((f) => f.replace(/\.liquid$/i, ''))
    : [],
);

console.log('');
console.log(c.bold + `Geprüft: ${jsons.length} JSON, ${liquids.length} Liquid, ${existingSections.size} Sections` + c.reset);
console.log(c.grey + '  ' + ROOT + c.reset);
console.log('');

// ---------- 1) JSON validity + control-char hits ----------
const jsonProblems = [];          // structural problems other than control-chars
const controlCharFiles = [];      // files with unescaped control chars
for (const f of jsons) {
  let raw;
  try { raw = readFileSync(f, 'utf8'); }
  catch (e) { jsonProblems.push({ file: f, msg: 'nicht lesbar: ' + e.message }); continue; }
  const tolerant = stripJsoncArtifacts(raw);
  try {
    JSON.parse(tolerant);
  } catch (e) {
    if (/control character/i.test(e.message)) {
      const m = /position (\d+)/.exec(e.message);
      const lc = m ? posToLineCol(tolerant, +m[1]) : null;
      controlCharFiles.push({ file: f, line: lc?.line ?? null, col: lc?.col ?? null });
    } else {
      const m = /position (\d+)/.exec(e.message);
      const lc = m ? posToLineCol(tolerant, +m[1]) : null;
      jsonProblems.push({ file: f, line: lc?.line, msg: e.message.replace(/\s*in JSON.*/, '') });
    }
  }
}

// ---------- 2) shopify:// refs by scheme ----------
// Accept BOTH the literal form (`shopify://files/...`) used by
// liquid + most JSON exports AND the JSON-escaped form
// (`shopify:\/\/files\/...`) Shopify's Customizer auto-export
// writes inside template JSONs. The escaped form was the silent
// killer in v3 — refs were "absent" per a naive grep but very
// much present in the file, so the import keeled over on the
// merchant's Shopify Admin without v3 ever reporting them.
const SHOPIFY_REF_RX = /shopify:[\\\/]+([a-z_]+)[\\\/]+([^"'\s\)]+)/g;
const refsByScheme = {};     // scheme -> count
const fileRefsBlocker = {};  // file -> [shopify://files/...]
const otherUriRefsByFile = {}; // file -> [{scheme, ref}]
for (const f of allFiles) {
  let raw;
  try { raw = readFileSync(f, 'utf8'); } catch { continue; }
  for (const m of raw.matchAll(SHOPIFY_REF_RX)) {
    const scheme = m[1];
    const full = m[0];
    refsByScheme[scheme] = (refsByScheme[scheme] ?? 0) + 1;
    if (scheme === 'files') {
      (fileRefsBlocker[relative(ROOT, f)] ??= []).push(full);
    } else {
      (otherUriRefsByFile[relative(ROOT, f)] ??= []).push({ scheme, full });
    }
  }
}

// ---------- 3) Missing section refs (templates + groups + liquid hardcodes) ----------
const missingRefs = {};            // section_type -> [referencing-file]
for (const f of jsons) {
  const inTemplates = f.startsWith(templatesDir);
  const isGroup = f.startsWith(sectionsDir) && /-group\.json$/i.test(f);
  if (!inTemplates && !isGroup) continue;
  let raw, data;
  try { raw = readFileSync(f, 'utf8'); } catch { continue; }
  try { data = JSON.parse(stripJsoncArtifacts(raw)); } catch { continue; }
  if (!data?.sections) continue;
  for (const key of Object.keys(data.sections)) {
    const t = data.sections[key]?.type;
    if (!t || t.startsWith('shopify://') || t.startsWith('apps/')) continue;
    if (!existingSections.has(t)) {
      (missingRefs[t] ??= []).push(relative(ROOT, f));
    }
  }
}
const missingLiquidRefs = {};
for (const f of liquids) {
  let raw;
  try { raw = readFileSync(f, 'utf8'); } catch { continue; }
  for (const m of raw.matchAll(/\{%-?\s*section\s+['"]([^'"]+)['"]\s*-?%\}/g)) {
    const name = m[1];
    if (!existingSections.has(name)) {
      (missingLiquidRefs[name] ??= []).push(relative(ROOT, f));
    }
  }
}

// ---------- REPORT ----------
let ok = true;

if (controlCharFiles.length) {
  ok = false;
  console.log(c.red + c.bold + `  ✗  CONTROL-CHAR ERRORS in JSON-Strings (${controlCharFiles.length} Datei(en))` + c.reset);
  console.log(c.grey + '     Tab/Newline/CR direkt in "..." statt als \\t/\\n/\\r escaped. Shopify rejected den Import.' + c.reset);
  for (const e of controlCharFiles) {
    const where = e.line ? `  (Zeile ${e.line})` : '';
    console.log(c.red + '  • ' + relative(ROOT, e.file) + c.reset + c.grey + where + c.reset);
  }
  console.log('');
}

const blockerKeys = Object.keys(fileRefsBlocker).sort();
if (blockerKeys.length) {
  ok = false;
  const videoCount = Object.values(fileRefsBlocker).flat().filter((r) => r.includes('/videos/')).length;
  console.log(c.red + c.bold + `  ✗  IMPORT-BLOCKER (${blockerKeys.length} Datei(en)) — tote shopify://files/-Referenzen` + c.reset);
  if (videoCount) console.log(c.grey + `     ${videoCount}× Videos. Shopify lehnt das ZIP ab wenn die referenzierte Datei im Ziel-Store fehlt.` + c.reset);
  for (const f of blockerKeys) {
    const refs = fileRefsBlocker[f];
    const vids = refs.filter((r) => r.includes('/videos/')).length;
    const label = vids ? `${refs.length} refs, davon ${vids} VIDEO` : `${refs.length} refs`;
    console.log(c.red + '  • ' + f + c.reset + c.grey + `   (${label})` + c.reset);
  }
  console.log('');
}

const missKeys = Object.keys(missingRefs).sort();
if (missKeys.length) {
  ok = false;
  console.log(c.red + c.bold + `  ✗  FEHLENDE SECTIONS aus templates/JSON (${missKeys.length})` + c.reset);
  for (const t of missKeys) {
    const refs = [...new Set(missingRefs[t])];
    console.log(c.red + `  • sections/${t}.liquid fehlt` + c.reset + c.grey + `   (${refs.length} Referenz${refs.length > 1 ? 'en' : ''})` + c.reset);
    refs.slice(0, 4).forEach((r) => console.log('        ← ' + r));
  }
  console.log('');
}

const missLiquidKeys = Object.keys(missingLiquidRefs).sort();
if (missLiquidKeys.length) {
  ok = false;
  console.log(c.red + c.bold + `  ✗  FEHLENDE SECTIONS aus Liquid-Hardcodes (${missLiquidKeys.length})` + c.reset);
  console.log(c.grey + '     {% section "x" %} in einer .liquid-Datei aber sections/x.liquid fehlt.' + c.reset);
  for (const t of missLiquidKeys) {
    const refs = [...new Set(missingLiquidRefs[t])];
    console.log(c.red + `  • {% section '${t}' %} ohne sections/${t}.liquid` + c.reset + c.grey + `   (${refs.length} Call-Site${refs.length > 1 ? 's' : ''})` + c.reset);
    refs.slice(0, 4).forEach((r) => console.log('        ← ' + r));
  }
  console.log('');
}

if (jsonProblems.length) {
  ok = false;
  console.log(c.red + c.bold + `  ✗  JSON-STRUKTURFEHLER (${jsonProblems.length})` + c.reset);
  for (const p of jsonProblems) {
    const where = p.line ? ` (Zeile ${p.line})` : '';
    console.log(c.red + '  • ' + relative(ROOT, p.file) + where + c.reset + '  ' + c.yellow + p.msg + c.reset);
  }
  console.log('');
}

// Andere shopify:// schemes: nur info, kein blocker
const otherSchemes = Object.entries(refsByScheme).filter(([s]) => s !== 'files');
if (otherSchemes.length) {
  console.log(c.yellow + c.bold + '  ℹ  Andere shopify://-Referenzen (rendern leer wenn im Ziel-Shop nicht vorhanden, blocken aber den Import NICHT):' + c.reset);
  for (const [s, n] of otherSchemes) console.log(c.grey + `     ${String(n).padStart(4)}× shopify://${s}/` + c.reset);
  console.log('');
}

if (ok) {
  console.log(c.green + c.bold + '  ✓  ALLES OK — keine Blocker, keine fehlenden Sections, kein JSON-Fehler.' + c.reset);
  console.log('');
  if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  if (!FIX_OUT) process.exit(0);
}

// ---------- FIX MODE ----------
if (!FIX_OUT) {
  if (!ok) {
    console.log(c.yellow + c.bold + '  → Mit  --fix "<Out>"  eine import-sichere Kopie bauen.' + c.reset);
    if (missKeys.length || missLiquidKeys.length) {
      console.log(c.grey + '     Bei fehlenden Sections zusätzlich  --stub-missing-sections  oder  --remove-missing-section-refs  setzen.' + c.reset);
    }
    console.log('');
  }
  if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  process.exit(ok ? 0 : 1);
}

// FIX_OUT can be a folder OR a .zip path. Folder is the default;
// .zip path means write a fresh archive instead of an output dir.
const fixOutIsZip = FIX_OUT.toLowerCase().endsWith('.zip');
const stagingDir = fixOutIsZip
  ? mkdtempSync(join(tmpdir(), 'theme-check-fix-'))
  : FIX_OUT;

mkdirSync(stagingDir, { recursive: true });

let stats = {
  filesCopied: 0,
  jsonsRewritten: 0,
  controlCharsEscaped: 0,
  fileRefsEmptied: 0,
  otherUriRefsEmptied: 0,
  templateRefsRemoved: 0,
  stubsCreated: 0,
};

// 1) Copy with transforms
(function copyFix(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === 'node_modules' || name.startsWith('.') || name.startsWith('_')) continue;
    const s = join(src, name);
    const d = join(dst, name);
    const st = statSync(s);
    if (st.isDirectory()) { copyFix(s, d); continue; }
    if (name.toLowerCase().endsWith('.json')) {
      let txt = readFileSync(s, 'utf8');
      // a) shopify://files/ → null
      //
      // CRITICAL: JSON allows forward-slashes to be optionally escaped
      // (`\/`). Shopify's Customizer auto-export USES the escaped form
      // in template JSONs ("video":"shopify:\/\/files\/videos\/...").
      // The earlier `shopify:\/\/files\/` regex only matched the
      // literal form, leaving every escaped video ref intact and
      // killing the Shopify import with FileSaveError. Symptom: theme
      // uploads "successfully" but every page that includes a video
      // section renders 404 because Shopify drops the broken templates.
      //
      // The character classes `[\/\\]` accept either a literal `/` or
      // a JSON-escaped `\/`.
      //
      // CRITICAL #2: replace value with `null`, NOT `""`. Shopify's
      // settings_data importer treats an empty string in a video /
      // file_picker / image_picker setting as "this is supposed to be
      // a URL but it's invalid" and rejects the WHOLE template (not
      // just the setting) — index.json + product.json silently vanish
      // post-import even though their JSON is valid. `null` is the
      // canonical "no value" marker Shopify itself uses on a fresh
      // Customizer-cleared setting, and the importer accepts it.
      const FILE_REF_RX = /"shopify:[\\\/]+files[\\\/][^"]*"/g;
      const beforeFile = txt;
      txt = txt.replace(FILE_REF_RX, 'null');
      if (txt !== beforeFile) stats.fileRefsEmptied += (beforeFile.match(FILE_REF_RX) ?? []).length;
      // b) optional: andere shopify://-uris auch leeren
      if (FIX_STRIP_ALL_URI) {
        const ALL_URI_RX = /"shopify:[\\\/]+[a-z_]+[\\\/][^"]*"/g;
        const beforeAll = txt;
        txt = txt.replace(ALL_URI_RX, 'null');
        if (txt !== beforeAll) stats.otherUriRefsEmptied += (beforeAll.match(ALL_URI_RX) ?? []).length;
      }
      // c) control chars in string literals escapen
      const { text: escaped, edits } = escapeStringControlChars(txt);
      if (edits > 0) stats.controlCharsEscaped += edits;
      txt = escaped;
      // d) optional: Refs auf fehlende Sections aus templates/JSON entfernen
      if (FIX_REMOVE_MISSING && (s.startsWith(templatesDir) || (s.startsWith(sectionsDir) && /-group\.json$/i.test(s)))) {
        try {
          const data = JSON.parse(stripJsoncArtifacts(txt));
          if (data?.sections) {
            const slotsToDrop = [];
            for (const key of Object.keys(data.sections)) {
              const t = data.sections[key]?.type;
              if (t && !t.startsWith('shopify://') && !t.startsWith('apps/') && !existingSections.has(t)) {
                slotsToDrop.push(key);
              }
            }
            if (slotsToDrop.length) {
              for (const key of slotsToDrop) delete data.sections[key];
              if (Array.isArray(data.order)) {
                data.order = data.order.filter((k) => !slotsToDrop.includes(k));
              }
              txt = JSON.stringify(data, null, 2);
              stats.templateRefsRemoved += slotsToDrop.length;
            }
          }
        } catch { /* leave file as-is */ }
      }
      writeFileSync(d, txt);
      stats.jsonsRewritten += 1;
    } else {
      copyFileSync(s, d);
      stats.filesCopied += 1;
    }
  }
})(ROOT, stagingDir);

// 2) Stub-Sections erzeugen (für JSON-template-refs UND liquid-hardcodes)
if (FIX_STUB_MISSING) {
  const stubSectionsDir = join(stagingDir, 'sections');
  if (!existsSync(stubSectionsDir)) mkdirSync(stubSectionsDir, { recursive: true });
  const allMissing = new Set([...Object.keys(missingRefs), ...Object.keys(missingLiquidRefs)]);
  for (const name of allMissing) {
    const stub = join(stubSectionsDir, name + '.liquid');
    if (existsSync(stub)) continue;
    const stubBody = `{%- comment -%}\n  Auto-generierter Stub von check-theme.mjs.\n  Originale sections/${name}.liquid fehlte beim Import.\n  Operator: durch die echte Section ersetzen oder dieses File löschen.\n{%- endcomment -%}\n\n<!-- Missing section stub: ${name} -->\n\n{% schema %}\n{\n  "name": "${name} (Stub)",\n  "settings": [],\n  "presets": [{ "name": "${name} (Stub)" }]\n}\n{% endschema %}\n`;
    writeFileSync(stub, stubBody);
    stats.stubsCreated += 1;
  }
}

// 3) Wenn ZIP-Output gewünscht: stagingDir nach FIX_OUT zippen.
//
// fflate's zipSync expects an entries map keyed by **forward-slash**
// paths. Shopify's importer requires forward-slash paths too — the
// previous PowerShell Compress-Archive path emitted backslash-pathed
// entries on Windows ("layout\theme.liquid") and Shopify rejected the
// import with "missing template 'layout/theme.liquid'" even though the
// file was there. Routing through fflate makes the separator OS-
// independent: we walk the staging directory with Node's path APIs,
// then `.replace(/\\/g, '/')` the relative path before keying into
// the entries map. Wrapper folder mirrors Shopify-Admin export shape.
if (fixOutIsZip) {
  mkdirSync(dirname(resolve(FIX_OUT)), { recursive: true });
  try {
    const wrapper = basename(FIX_OUT, '.zip');
    const entries = {};
    (function walkForZip(dir, prefix) {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        const rel = prefix ? `${prefix}/${name}` : name;
        if (st.isDirectory()) {
          walkForZip(full, rel);
        } else {
          entries[rel] = new Uint8Array(readFileSync(full));
        }
      }
    })(stagingDir, wrapper);
    const zipped = zipSync(entries);
    writeFileSync(FIX_OUT, Buffer.from(zipped));
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }
}

// ---------- FIX-Report ----------
console.log('');
console.log(c.green + c.bold + '  ✓  Import-sichere Kopie geschrieben' + c.reset);
console.log('     ' + c.cyan + FIX_OUT + c.reset);
console.log('');
console.log(c.grey + `     Files copied:           ${stats.filesCopied}` + c.reset);
console.log(c.grey + `     JSONs rewritten:        ${stats.jsonsRewritten}` + c.reset);
console.log(c.grey + `     Control-chars escaped:  ${stats.controlCharsEscaped}` + c.reset);
console.log(c.grey + `     shopify://files/ refs:  ${stats.fileRefsEmptied} geleert` + c.reset);
if (FIX_STRIP_ALL_URI)   console.log(c.grey + `     Andere shopify://-uri:  ${stats.otherUriRefsEmptied} geleert` + c.reset);
if (FIX_REMOVE_MISSING)  console.log(c.grey + `     Missing-section-slots:  ${stats.templateRefsRemoved} aus templates entfernt` + c.reset);
if (FIX_STUB_MISSING)    console.log(c.grey + `     Stub-Sections erzeugt:  ${stats.stubsCreated}` + c.reset);
console.log('');

if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
process.exit(0);
