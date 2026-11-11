/*
 * End-to-end test: runs libread-webnovel.crosspoint-plugin/plugin.js UNMODIFIED
 * inside jsdom, hosted by the real CrossPoint plugin-host.js, against a mock
 * device API backed by fixtures captured from live libread.com / freewebnovel.com
 * pages. Drives the actual UI (Browse -> Search -> Download range 1-2), extracts
 * the EPUB the plugin built and uploaded, and verifies it.
 *
 * Usage: node run-test.js     (from test/)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const { createDevice } = require("./mock-device");

const FIX = process.env.LR_FIXTURES || "/tmp/lr-fixtures";
const ART = path.join(__dirname, "..", "artifacts");
const EPUB_OUT = path.join(ART, "Cultivation-Online-2ch.epub");

let failures = 0;
function check(name, cond, detail) {
  const ok = !!cond;
  console.log((ok ? "  PASS  " : "  FAIL  ") + name + (!ok && detail ? "  [" + detail + "]" : ""));
  if (!ok) failures++;
  return ok;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, ms, label, errors) {
  const t0 = Date.now();
  for (;;) {
    let v = null;
    try { v = fn(); } catch (e) { /* keep polling */ }
    if (v) return v;
    if (Date.now() - t0 > ms) {
      throw new Error("timeout waiting for " + label + (errors && errors.length ? "\njsdom errors:\n" + errors.join("\n") : ""));
    }
    await sleep(100);
  }
}

async function main() {
  // ---- fixtures (verbatim live captures)
  cp.execSync("node " + JSON.stringify(path.join(__dirname, "gen-fixtures.js")) + " " + JSON.stringify(FIX), { stdio: "inherit" });
  fs.mkdirSync(ART, { recursive: true });

  // ---- mock device
  const dev = createDevice();
  const { origin } = await dev.listen();
  console.log("Mock device at " + origin);

  // ---- jsdom page hosting the real plugin-host.js + plugin.js
  class LocalLoader extends ResourceLoader {
    fetch(url, options) {
      if (url.startsWith(origin)) return super.fetch(url, options);
      return null; // never reach out to the real internet (card cover <img>s)
    }
  }
  const vc = new VirtualConsole();
  const errors = [];
  vc.on("jsdomError", (e) => errors.push(String((e && e.stack) || e)));
  vc.on("error", (...a) => errors.push("console.error: " + a.map(String).join(" ")));

  const dom = await JSDOM.fromURL(origin + "/", {
    runScripts: "dangerously",
    resources: new LocalLoader(),
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      // jsdom has no fetch; bridge relative device URLs to the mock server and
      // align Blob/FormData/URLSearchParams with Node's (what undici accepts).
      window.fetch = (input, init) => {
        const href = typeof input === "string" ? new URL(input, origin).href
          : input && input.url ? input.url : String(input);
        return fetch(href, init);
      };
      window.FormData = FormData;
      window.Blob = Blob;
      window.URLSearchParams = URLSearchParams;
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
      // jsdom has no setImmediate/MessageChannel; JSZip's bundled scheduler
      // polyfill stalls without one of them, so hand it Node's working versions.
      window.setImmediate = setImmediate;
      window.MessageChannel = MessageChannel;
      window.confirm = () => true;
      window.Element.prototype.scrollIntoView = function () {};
    },
  });
  const doc = dom.window.document;
  const $ = (sel) => doc.querySelector(sel);
  const logText = () => { const el = $("#lr-log"); return el ? el.textContent : ""; };

  try {
    console.log("\n[1] plugin renders");
    await waitFor(() => $("#lr-log"), 20000, "plugin UI", errors);
    check("plugin UI mounted (#lr-log)", true);

    console.log("\n[2] browse listing");
    $("#lr-browse").click();
    await waitFor(() => doc.querySelectorAll("#lr-res .card").length >= 3, 20000, "browse results", errors);
    check("browse shows 3 cards", doc.querySelectorAll("#lr-res .card").length === 3);

    console.log("\n[3] search");
    $("#lr-q").value = "cultivation";
    $("#lr-go").click();
    await waitFor(() => ($("#lr-status").textContent || "").includes("Results for"), 20000, "search results", errors);
    const cards = [...doc.querySelectorAll("#lr-res .card")];
    check("search finds Cultivation Online first", cards.length >= 1 && cards[0].textContent.includes("Cultivation Online"),
      cards[0] && cards[0].textContent.slice(0, 80));
    check("search card shows author + status", cards[0].textContent.includes("Mylittlebrother") && /ongoing/i.test(cards[0].textContent),
      cards[0] && cards[0].textContent.slice(0, 160));

    console.log("\n[4] download chapters 1-2");
    $("#lr-from").value = "1";
    $("#lr-to").value = "2";
    let mark = 0, clicked = false;
    await waitFor(() => {
      const log = logText();
      const tail = log.slice(mark);
      if (tail.includes("Error: ")) return "error";
      if (/Reading the novel page/.test(tail)) return "started";
      if (tail.includes("Already working")) { mark = log.length; clicked = false; }
      if (!clicked && doc.querySelector("#lr-res .card button")) {
        const btn = [...doc.querySelectorAll("#lr-res .card button")].find((b) => b.textContent === "Download");
        if (btn) { mark = logText().length; btn.click(); clicked = true; }
      }
      return null;
    }, 30000, "download to start", errors);
    let outcome;
    try {
      outcome = await waitFor(() => {
        const log = logText();
        if (/Done: \d+ new chapter/.test(log)) return "done";
        if (/^Error: /m.test(log)) return "error";
        return null;
      }, 180000, "sync completion", errors);
    } catch (e) {
      console.log("---- plugin log at timeout ----\n" + logText() +
        "---- end log ----\nvirtual SD: " + [...dev.sd.keys()].join("\n  "));
      throw e;
    }
    check("sync finished: " + (logText().match(/Done: [^\n]*/) || ["<no Done line>"])[0], outcome === "done",
      logText().split("\n").slice(-8).join(" | "));
    if (outcome !== "done") throw new Error("sync failed:\n" + logText());

    console.log("\n[5] device-side artifacts");
    const epubPath = "/LibRead/Cultivation Online.epub";
    const epubBuf = dev.sd.get(epubPath);
    check("EPUB uploaded to " + epubPath, !!epubBuf);
    if (!epubBuf) throw new Error("no epub on virtual SD; keys: " + [...dev.sd.keys()].join(", "));
    check("library.json written", dev.sd.has("/LibRead/library.json"));
    check("no debug page saved (clean run)", !dev.sd.has("/LibRead/debug-last-page.html"));
    fs.writeFileSync(EPUB_OUT, epubBuf);
    console.log("  saved " + EPUB_OUT + " (" + epubBuf.length + " bytes)");

    // ---- unzip and verify the EPUB
    const unpack = path.join(ART, "unzipped");
    fs.rmSync(unpack, { recursive: true, force: true });
    cp.execSync("unzip -o -q " + JSON.stringify(EPUB_OUT) + " -d " + JSON.stringify(unpack));
    const rd = (p) => fs.readFileSync(path.join(unpack, p), "utf8");
    const rdb = (p) => fs.readFileSync(path.join(unpack, p));
    const { DOMParser } = dom.window;
    const parseXml = (s, what) => {
      const d = new DOMParser().parseFromString(s, "application/xml");
      const err = d.querySelector("parsererror");
      check("XML well-formed: " + what, !err, err && err.textContent.slice(0, 200));
      return err ? null : d;
    };

    console.log("\n[6] EPUB structure");
    check("mimetype present", fs.existsSync(path.join(unpack, "mimetype")) && rd("mimetype") === "application/epub+zip");
    const storeMethod = cp.execSync("unzip -v " + JSON.stringify(EPUB_OUT) + " mimetype", { encoding: "utf8" });
    check("mimetype stored uncompressed", /Stored/.test(storeMethod));
    const container = rd("META-INF/container.xml");
    check("container.xml -> OEBPS/content.opf", /full-path="OEBPS\/content\.opf"/.test(container));

    const opfText = rd("OEBPS/content.opf");
    const opf = parseXml(opfText, "content.opf");
    if (opf) {
      check("dc:title", /<dc:title>Cultivation Online<\/dc:title>/.test(opfText));
      check("dc:creator = Mylittlebrother", /<dc:creator>Mylittlebrother<\/dc:creator>/.test(opfText));
      check("dc:source = novel URL", opfText.includes("<dc:source>https://libread.com/libread/cultivation-online-novel-110907</dc:source>"));
      check("cover item has properties=cover-image", /href="cover\.jpg"[^>]*properties="cover-image"/.test(opfText));
      check('meta name="cover"', /<meta name="cover" content="cover-img"\/>/.test(opfText));
      check("nav + ncx + css in manifest", /href="nav\.xml"/.test(opfText) === false && /href="nav\.xhtml"/.test(opfText) &&
        /href="toc\.ncx"/.test(opfText) && /href="style\.css"/.test(opfText));
      const spineIds = [...opf.querySelectorAll("spine itemref")].map((e) => e.getAttribute("idref"));
      check("spine = cover, title, ch1, ch2", JSON.stringify(spineIds) === JSON.stringify(["cover", "title", "c0", "c1"]),
        JSON.stringify(spineIds));
    }

    const cover = rdb("OEBPS/cover.jpg");
    check("cover.jpg is a JPEG (SOI)", cover[0] === 0xff && cover[1] === 0xd8 && cover.length > 5000, cover.length + " bytes");

    const css = rd("OEBPS/style.css");
    check("CSS: chapter title 1.5em bold at top",
      /h1\.chapter-title\{font-size:1\.5em;font-weight:bold;margin-top:0/.test(css) &&
      /page-break-before:avoid/.test(css));

    const navText = rd("OEBPS/nav.xhtml");
    const nav = parseXml(navText, "nav.xhtml");
    if (nav) {
      check("nav has epub:type=toc", /epub:type="toc"/.test(navText));
      const navLinks = [...nav.querySelectorAll("nav a, a")].map((a) => a.getAttribute("href"));
      check("nav lists both chapters", JSON.stringify(navLinks) === JSON.stringify(["ch-0001.xhtml", "ch-0002.xhtml"]),
        JSON.stringify(navLinks));
    }

    const ncxText = rd("OEBPS/toc.ncx");
    const ncx = parseXml(ncxText, "toc.ncx");
    if (ncx) {
      const pts = [...ncx.querySelectorAll("navPoint")];
      check("ncx has 2 navPoints", pts.length === 2, String(pts.length));
      check("ncx labels are the chapter titles",
        pts.length === 2 && pts[0].querySelector("navLabel text").textContent === "Chapter 1 - Cultivation Online" &&
        pts[1].querySelector("navLabel text").textContent === "Chapter 2 - Mysterious Little Girl");
      check("ncx content srcs", pts.length === 2 && pts[0].querySelector("content").getAttribute("src") === "ch-0001.xhtml" &&
        pts[1].querySelector("content").getAttribute("src") === "ch-0002.xhtml");
    }

    const info = JSON.parse(rd("META-INF/libread.json"));
    check("libread.json lists 2 chapters", info.chapters.length === 2 && info.chapters[0].id === "1" && info.chapters[1].id === "2");
    check("libread.json file names", info.chapters[0].file === "ch-0001.xhtml" && info.chapters[1].file === "ch-0002.xhtml");

    // ---- chapter content
    console.log("\n[7] chapter content");
    const expect1 = JSON.parse(fs.readFileSync(path.join(FIX, "expected-ch1.json"), "utf8"));
    const expect2 = JSON.parse(fs.readFileSync(path.join(FIX, "expected-ch2.json"), "utf8"));
    const checkChapter = (file, title, expect) => {
      const text = rd("OEBPS/" + file);
      const d = parseXml(text, file);
      if (!d) return null;
      const body = d.querySelector("body");
      const first = body.firstElementChild;
      check(file + ": first element is h1.chapter-title", first && first.tagName.toLowerCase() === "h1" &&
        first.getAttribute("class") === "chapter-title", first && first.tagName);
      check(file + ": title is bold <b> at the top", first && first.querySelector("b") &&
        first.querySelector("b").textContent === title, first && first.innerHTML.slice(0, 120));
      check(file + ": title appears exactly once in the body",
        (body.textContent.match(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length === 1);
      const headings = [...body.querySelectorAll("h2,h3,h4,h5,h6")];
      check(file + ": no inline headings left", headings.length === 0, headings.map((h) => h.tagName).join(","));
      const section = body.querySelector("section");
      const bodyAll = section ? section.textContent : "";
      for (const bad of ["wait-0", "bg-ssp", "pf-1558", "This story originates", "Sponsored content",
        "Updates by Freewebnovel", "Advertisement", "Posting Rules"]) {
        check(file + ": no '" + bad + "'", !bodyAll.includes(bad));
      }
      check(file + ": no freewebnovel/libread watermark text", !/freewebnovel|libread/i.test(bodyAll));
      const paras = [...(section ? section.querySelectorAll("p") : [])].map((p) => p.textContent);
      const same = paras.length === expect.length && paras.every((p, i) => p === expect[i]);
      if (!same) {
        const firstDiff = paras.findIndex((p, i) => p !== expect[i]);
        check(file + ": verbatim round-trip (" + expect.length + " paragraphs)", false,
          "got " + paras.length + " paras; first diff at " + firstDiff +
          (firstDiff >= 0 ? ": got=" + JSON.stringify(String(paras[firstDiff]).slice(0, 120)) +
            " want=" + JSON.stringify(String(expect[firstDiff]).slice(0, 120)) : ""));
      } else {
        check(file + ": verbatim round-trip (" + expect.length + " paragraphs)", true);
      }
      check(file + ": body starts with the story's first line",
        paras.length > 0 && paras[0].startsWith("\"Brother! I got the game you wanted!\"") ||
        (title.startsWith("Chapter 2") && paras.length > 0 && paras[0].startsWith("\"Character status.\"")),
        paras[0] && paras[0].slice(0, 60));
      return d;
    };
    const d1 = checkChapter("ch-0001.xhtml", "Chapter 1 - Cultivation Online", expect1);
    const d2 = checkChapter("ch-0002.xhtml", "Chapter 2 - Mysterious Little Girl", expect2);
    if (d1) check("ch-0001: contains the system welcome line",
      d1.querySelector("section").textContent.includes("«Welcome to Cultivation Online!»"));
    if (d2) {
      const strong = d2.querySelector("section strong");
      check("ch-0002: literal &lt;strong&gt; decoded to <strong>", strong && strong.textContent === "Name: Yuan",
        strong && strong.textContent);
      check("ch-0002: <sub> watermark removed", d2.querySelector("section sub") === null);
    }

    console.log("\n" + (failures ? failures + " CHECK(S) FAILED" : "ALL CHECKS PASSED"));
    if (failures) process.exitCode = 1;
  } finally {
    try { dom.window.close(); } catch (e) { /* ignore */ }
    await dev.close();
  }
}

main().catch((e) => {
  console.error("\nTEST CRASHED: " + e.message);
  process.exitCode = 1;
});
