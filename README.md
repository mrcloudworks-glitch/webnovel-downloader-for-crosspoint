# webnovel-downloader-for-crosspoint

A [CrossPoint Reader](https://github.com/crosspoint-reader/crosspoint-reader) plugin
that downloads web novels from **[libread.com](https://libread.com)** as EPUBs tuned
for the Xteink X3 (528×792) and X4 (480×800) e-ink screens — search, browse, download,
and later append only the new chapters to the same book.

## Repository layout

| Path | What it is |
|---|---|
| [`libread-webnovel.crosspoint-plugin/`](libread-webnovel.crosspoint-plugin/) | The SD-card plugin: `manifest.json`, `plugin.js`, `README.md` |
| [`test/`](test/) | End-to-end harness: runs `plugin.js` unmodified in jsdom against a mock CrossPoint device API backed by live libread.com page fixtures, and produces a real 2-chapter EPUB |
| `LICENSE` | MIT |

## Install

1. Copy `libread-webnovel.crosspoint-plugin/` to `/plugins/libread-webnovel/` on the
   reader's SD card.
2. Enable **Settings → Connectivity → Plugins** on the reader.
3. Open the reader's web page in a browser and use the **LibRead Web Novels** card.

See the [plugin README](libread-webnovel.crosspoint-plugin/README.md) for usage.

## How it works

The plugin is a browser-side SD-card plugin (the `plugin.js` surface documented in
CrossPoint's `docs/sd-plugins.md`): the reader downloads pages straight to the SD card
via `/api/fetch`, the browser reads them back over `/download`, parses and cleans the
HTML (WebToEpub/LNReader rules), zips an EPUB with the device's bundled JSZip, and
uploads it back. libread.com chapter links redirect to freewebnovel.com; when the
cross-origin hop drops browser headers and the site answers 403/429, the plugin asks
`/api/relay` for the `Location` and refetches the target directly.

## Testing

```sh
cd test
npm install
node run-test.js                          # writes ../artifacts/Cultivation-Online-2ch.epub
python3 -m venv /tmp/pil-venv && /tmp/pil-venv/bin/pip install Pillow
/tmp/pil-venv/bin/python render_preview.py  # renders page 1 of each chapter at 528x792 (X3)
```

The harness mocks the CrossPoint device endpoints (`/api/status`, `/api/fetch`,
`/api/relay`, `/download`, `/upload`, `/mkdir`, `/rename`, `/delete`,
`/api/plugin-fs`, WebSocket-less upload fallback) and serves fixtures captured from
the live site (novel page, `?ajax=chapters` JSON, both chapter pages, search results,
cover image).

## License

MIT. See [LICENSE](LICENSE).
