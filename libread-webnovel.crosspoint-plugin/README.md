# LibRead Web Novels for CrossPoint

A [CrossPoint Reader](https://github.com/crosspoint-reader/crosspoint-plugin) SD-card
plugin that searches and browses [libread.com](https://libread.com), downloads a web
novel as an e-ink-optimized EPUB, and later adds only the new chapters to that same
EPUB. Chapter pages redirect to freewebnovel.com; the plugin follows the redirect and
cleans the text the same way WebToEpub and LNReader do.

## Install

1. Copy this folder (`manifest.json`, `plugin.js`, `README.md`) to
   `/plugins/libread-webnovel/` on the reader's SD card
   (`/.crosspoint/plugins/` and `/.plugins/` work too).
2. On the reader: **Settings → Connectivity → Plugins → Enabled**.
3. Open the reader's web interface (**Home → Plugins**, or the File Manager page)
   in a browser on the same Wi-Fi — the plugin card appears under **Settings/Plugins**
   mounts with its own UI.

The plugin runs in the browser; the reader only serves the generic device endpoints
(`/api/fetch`, `/download`, `/upload`, `/api/relay`, …). Keep the page open and the
reader awake while a download runs.

## Using it

- **Search** — type a title (or paste a `https://libread.com/libread/<slug>-<id>`
  novel link) and press **Search** / Enter. Tap **Download** on a result card.
- **Browse** — pick a list (Latest Release, Completed, Most Popular, per-language) or
  a genre, press **Browse**. Results come from page 1 of that listing; paste a novel
  link for anything deeper.
- **Chapter range** — leave *from*/*to* empty for the whole novel. An empty *to*
  means "up to the latest", so **Update** later only fetches what is missing. The
  range you set is remembered per novel.
- **My novels** — **Check all** reports new chapter counts without downloading;
  **Update all** fetches every novel's missing chapters; **Re-download all** rebuilds
  a book from scratch.
- **Stop** aborts between chapters; partial progress is kept in the EPUB.

Books are saved under `/LibRead/<Title>.epub` on the SD card, with the library index
in `/LibRead/library.json`. When a book is updated, your reading position and
highlights (the reader's `progress.bin` / clippings) are carried over.

## What the EPUB looks like

- One spine file per chapter (`OEBPS/ch-0001.xhtml`, …), each starting with
  `<h1 class="chapter-title"><b>…</b></h1>` — bold, `1.5em`, at the very top of
  page 1 on Xteink X3 (528×792) and X4 (480×800), with embedded CSS on or off.
- Grayscale-friendly layout CSS (`OEBPS/style.css`), baseline JPEG cover
  (`OEBPS/cover.jpg`, declared `cover-image`), title page, EPUB 3 nav + NCX toc.
- Cleaned chapter text: ads (`#pf-*`, `#bg-ssp-*`, `[class*=ads]`), wait-images,
  translate widgets, script/style blocks, `p:nth-last-child()` promo hiders,
  "This story originates from…" watermarks, homoglyph freewebnovel/libread
  watermarks, literal `&lt;strong&gt;` tags (decoded), and the duplicated inline
  chapter heading are all removed; `data-reader-order` content is re-sorted first.
- `META-INF/libread.json` lists the chapters inside, so updates append instead of
  re-downloading.

## Notes & limits

- libread.com's chapter list is read via `?ajax=chapters&page=N&pageSize=200`
  (200 is the site's cap), reconciled with the page's own `ul#idData`.
- Chapter fetches are spaced ~1.2 s apart; HTTP 429/403 retries back off and the
  log shows the site's real status.
- No login/age-gated novels: if the site shows a bot check or paywall, the page is
  saved as `/LibRead/debug-last-page.html` for inspection.

## Credits

Parsing and cleanup follow [WebToEpub](https://github.com/dteviot/WebToEpub)'s
FreeWebNovel parser, [LNReader's readnovelfull plugin](https://github.com/LNReader/lnreader-plugins),
and [lightnovel-crawler's freewebnovel template](https://github.com/dipu-bd/lightnovel-crawler).
Plugin structure follows [PrithirajN/crosspoint-webnovel-plugin](https://github.com/PrithirajN/crosspoint-webnovel-plugin).

## License

MIT. See [LICENSE](../../LICENSE).
