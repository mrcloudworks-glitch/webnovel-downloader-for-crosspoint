/*
 * Mock CrossPoint device API + libread/freewebnovel fixture server for the e2e
 * harness. Implements the endpoints plugin.js touches, with the firmware's
 * documented semantics:
 *   GET  /api/status          -> {device:"X3", ...}
 *   POST /api/fetch           -> downloads a URL to the virtual SD (follows up to
 *                                5 redirects; cross-origin hops drop caller headers
 *                                and use the default "CrossPoint" UA -> the
 *                                freewebnovel fixture answers 403 to that UA)
 *   POST /api/relay           -> does NOT follow redirects; 3xx comes back with
 *                                X-Relay-Status / X-Relay-Headers (location)
 *   GET  /download?path=      -> read a virtual SD file
 *   POST /upload?path=        -> multipart write (400 if the name exists, like firmware)
 *   POST /rename /delete /mkdir
 *   POST /api/plugin-fs       -> api.writeFile() target (multipart, absolute path)
 *   GET  /api/plugins, /plugin, /js/*, /        -> the hosting web page
 *
 * Virtual SD files are exposed as `sd` (Map<path, Buffer>) for assertions.
 */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const FIX = process.env.LR_FIXTURES || "/tmp/lr-fixtures";
const REPO = path.join(__dirname, "..");
const PLUGIN_DIR = path.join(REPO, "libread-webnovel.crosspoint-plugin");
const HOST_JS = "/tmp/ref-crosspoint/src/network/html/js";

const BROWSER_UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";

const fixture = (name) => fs.readFileSync(path.join(FIX, name));

// ---------------------------------------------------------------- upstream (site) emulation
function serveLibread(u) {
  if (u.pathname === "/" || u.pathname === "/index.html") return { status: 200, body: fixture("search.html"), type: "text/html; charset=utf-8" };
  if (u.pathname === "/search") return { status: 200, body: fixture("search.html"), type: "text/html; charset=utf-8" };
  if (/ajax=chapters/.test(u.search)) return { status: 200, body: fixture("chapters.json"), type: "application/json" };
  if (/^\/libread\/cultivation-online-novel-110907\/?$/.test(u.pathname)) return { status: 200, body: fixture("novel.html"), type: "text/html; charset=utf-8" };
  if (/^\/libread\/cultivation-online-novel-110907\/chapter-\d+$/.test(u.pathname)) {
    // libread chapter -> 301 to freewebnovel (the plugin's redirect case)
    const n = parseInt(u.pathname.match(/chapter-(\d+)/)[1], 10);
    return { status: 301, headers: [["location", `https://freewebnovel.com/novel/cultivation-online-novel/chapter-${n}`]], body: Buffer.alloc(0) };
  }
  if (/^\/files\/article\/image\/1\/1427\/1427s\.jpg$/.test(u.pathname)) return { status: 200, body: fixture("1427s.jpg"), type: "image/jpeg" };
  if (/^\/sort\/|^\/genre\/|^\/most-popular/.test(u.pathname)) return { status: 200, body: fixture("browse.html"), type: "text/html; charset=utf-8" };
  return { status: 404, body: Buffer.from("not found"), type: "text/plain" };
}
function serveFw(u, headers) {
  // freewebnovel refuses the firmware's default UA (this is what the plugin's
  // relay-Location fallback exists for)
  const ua = headers["User-Agent"] || headers["user-agent"] || "";
  if (!/Mozilla/.test(ua)) return { status: 403, body: Buffer.from("Forbidden"), type: "text/plain" };
  const m = u.pathname.match(/\/chapter-(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 2) return { status: 200, body: fixture(`chapter-${n}.html`), type: "text/html; charset=utf-8" };
    return { status: 404, body: Buffer.from("no fixture"), type: "text/plain" };
  }
  return { status: 404, body: Buffer.from("not found"), type: "text/plain" };
}
// follow: /api/fetch follows redirects (cross-origin hop drops headers, default UA);
// no-follow: /api/relay returns the 3xx verbatim
function upstream(url, headers, follow) {
  let u;
  try { u = new URL(url); } catch (e) { return { status: 400, body: Buffer.from("bad url"), type: "text/plain" }; }
  let hops = 0;
  for (;;) {
    let r;
    if (u.hostname === "libread.com" || u.hostname === "www.libread.com") r = serveLibread(u);
    else if (u.hostname === "freewebnovel.com" || u.hostname === "www.freewebnovel.com") r = serveFw(u, headers);
    else return { status: 502, body: Buffer.from("unknown host"), type: "text/plain" };
    if (r.status >= 300 && r.status < 400 && r.headers) {
      if (!follow) return r;
      const loc = (r.headers.find((h) => h[0] === "location") || [])[1];
      if (!loc) return r;
      if (++hops > 5) return { status: 502, body: Buffer.from("too many redirects"), type: "text/plain" };
      const next = new URL(loc, u);
      const cross = next.origin !== u.origin;
      u = next;
      if (cross) headers = { "User-Agent": "CrossPoint" }; // firmware behavior
      continue;
    }
    return r;
  }
}

// ---------------------------------------------------------------- virtual SD + helpers
function createDevice() {
  const sd = new Map(); // absolute path -> Buffer
  const set = (p, buf) => sd.set(p, buf);
  const del = (p) => sd.delete(p);

  function parseMultipart(buf, contentType) {
    const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
    if (!m) return [];
    const delim = Buffer.from("--" + (m[1] || m[2]));
    const parts = [];
    let start = buf.indexOf(delim);
    if (start < 0) return [];
    start += delim.length;
    while (start < buf.length) {
      if (buf.slice(start, start + 2).toString() === "--") break;
      if (buf.slice(start, start + 2).toString() === "\r\n") start += 2;
      const headEnd = buf.indexOf("\r\n\r\n", start);
      if (headEnd < 0) break;
      const headers = buf.slice(start, headEnd).toString();
      const next = buf.indexOf(delim, headEnd + 4);
      const body = buf.slice(headEnd + 4, next > 0 ? next - 2 : buf.length);
      const fn = /filename="([^"]*)"/i.exec(headers);
      parts.push({ filename: fn && fn[1], body });
      if (next < 0) break;
      start = next + delim.length;
    }
    return parts;
  }

  async function handle(req, res, rawBody) {
    const u = new URL(req.url, "http://mock");
    const send = (status, body, headers) => {
      const h = Object.assign({ "Content-Type": "text/plain; charset=utf-8" }, headers || {});
      if (Buffer.isBuffer(body)) h["Content-Length"] = body.length;
      res.writeHead(status, h);
      res.end(body);
    };
    const json = (status, obj) => send(status, Buffer.from(JSON.stringify(obj)), { "Content-Type": "application/json" });
    const form = () => Object.fromEntries(u.searchParams.entries());
    const readForm = () => {
      const p = new URLSearchParams(rawBody.toString("utf8"));
      return Object.fromEntries(p.entries());
    };

    // ---- hosting page
    if (req.method === "GET" && u.pathname === "/") {
      return send(200, Buffer.from(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CrossPoint — Plugins</title>
<script src="/js/jszip.min.js"></script>
<script src="/js/plugin-host.js"></script></head>
<body><div id="plugin-container"></div><script>loadPlugins("settings");</script></body></html>`),
        { "Content-Type": "text/html; charset=utf-8" });
    }
    if (req.method === "GET" && u.pathname === "/js/plugin-host.js")
      return send(200, fs.readFileSync(path.join(HOST_JS, "plugin-host.js")), { "Content-Type": "application/javascript" });
    if (req.method === "GET" && u.pathname === "/js/jszip.min.js")
      return send(200, fs.readFileSync(path.join(HOST_JS, "jszip.min.js")), { "Content-Type": "application/javascript" });
    if (req.method === "GET" && u.pathname === "/api/plugins")
      return json(200, [{ name: "libread-webnovel", title: "LibRead Web Novels", mount: "settings", dir: "/plugins/libread-webnovel" }]);
    if (req.method === "GET" && u.pathname === "/plugin") {
      const file = u.searchParams.get("file") || "plugin.js";
      if (!/^[\w.-]+$/.test(file)) return send(400, "bad file");
      try { return send(200, fs.readFileSync(path.join(PLUGIN_DIR, file)), { "Content-Type": "application/javascript" }); }
      catch (e) { return send(404, "no such file"); }
    }

    // ---- device status
    if (req.method === "GET" && u.pathname === "/api/status")
      return json(200, { version: "1.0.0-test", firmwareFamily: "crosspoint", pluginApi: 1, device: "X3", ip: "127.0.0.1", mode: "STA", rssi: -40, uptime: 1 });

    // ---- outbound fetch (download URL -> virtual SD)
    if (req.method === "POST" && u.pathname === "/api/fetch") {
      let body;
      try { body = JSON.parse(rawBody.toString("utf8")); } catch (e) { return json(400, { error: "bad json" }); }
      const { url, dest, headers } = body;
      if (!url || !dest || dest.includes("..")) return json(400, { error: "bad url/dest" });
      const r = upstream(url, headers || {}, true);
      if (r.status >= 200 && r.status < 300) {
        set(dest, r.body);
        return json(200, { status: 200, bytes: r.body.length, complete: true, total: r.body.length });
      }
      // failed transfer: error set, file not installed (firmware semantics)
      return json(200, { status: r.status, bytes: 0, complete: false, error: r.status === 404 ? "http status" : "http status" });
    }

    // ---- relay (no redirect following)
    if (req.method === "POST" && u.pathname === "/api/relay") {
      let body;
      try { body = JSON.parse(rawBody.toString("utf8")); } catch (e) { return json(400, { error: "bad json" }); }
      if (!body.url) return json(400, { error: "missing plugin/url" });
      const r = upstream(body.url, body.headers || {}, false);
      const hdrs = r.headers || [];
      return send(200, r.body, {
        "Content-Type": r.type || "application/octet-stream",
        "X-Relay-Status": String(r.status),
        "X-Relay-Headers": JSON.stringify(hdrs),
      });
    }

    // ---- SD file access
    if (req.method === "GET" && u.pathname === "/download") {
      const p = form().path;
      const buf = sd.get(p);
      if (!buf) return send(404, "not found");
      const type = p.endsWith(".epub") ? "application/epub+zip" : p.endsWith(".json") ? "application/json" : "application/octet-stream";
      return send(200, buf, { "Content-Type": type });
    }
    if (req.method === "POST" && u.pathname === "/upload") {
      const dir = (form().path || "/").replace(/\/+$/, "");
      const parts = parseMultipart(rawBody, req.headers["content-type"]);
      if (!parts.length || !parts[0].filename) return send(400, "missing file part");
      const target = dir + "/" + parts[0].filename;
      if (sd.has(target)) return send(400, "File already exists: " + parts[0].filename);
      set(target, parts[0].body);
      return send(200, "File uploaded successfully: " + parts[0].filename);
    }
    if (req.method === "POST" && u.pathname === "/rename") {
      const f = readForm();
      if (!f.path || !f.name) return send(400, "bad path/name");
      if (!sd.has(f.path)) return send(404, "not found");
      const target = f.path.slice(0, f.path.lastIndexOf("/")) + "/" + f.name;
      if (sd.has(target)) return send(400, "File already exists: " + f.name);
      set(target, sd.get(f.path)); del(f.path);
      return send(200, "ok");
    }
    if (req.method === "POST" && u.pathname === "/delete") {
      const f = readForm();
      let paths = [];
      if (f.paths) { try { paths = JSON.parse(f.paths); } catch (e) { return send(400, "bad paths"); } }
      else if (f.path) paths = [f.path];
      else return send(400, "missing path");
      for (const p of paths) del(p);
      return send(200, "ok");
    }
    if (req.method === "POST" && u.pathname === "/mkdir") return send(200, "ok"); // dirs are implicit in the Map
    if (req.method === "POST" && u.pathname === "/api/plugin-fs") {
      const p = u.searchParams.get("path");
      if (!p || p.includes("..")) return send(400, { error: "bad path" }, { "Content-Type": "application/json" });
      const parts = parseMultipart(rawBody, req.headers["content-type"]);
      if (!parts.length) return json(400, { error: "missing file part" });
      set(p, parts[0].body);
      return json(200, { ok: true, bytes: parts[0].body.length });
    }

    return send(404, "no route: " + req.method + " " + u.pathname);
  }

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      Promise.resolve(handle(req, res, Buffer.concat(chunks))).catch((e) => {
        try { res.writeHead(500); res.end("mock error: " + e.message); } catch (x) { /* already sent */ }
      });
    });
  });

  // Reserve port and port+1 (the plugin's WebSocket upload probes port+1 and must
  // get a clean refusal so it falls back to HTTP /upload).
  function listen() {
    return new Promise((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        const probe = http.createServer();
        probe.once("error", () => { // port+1 busy: retry with a fresh server
          server.close(() => listen().then(resolve, reject));
        });
        probe.listen(port + 1, "127.0.0.1", () => {
          probe.close(() => resolve({ port, origin: "http://127.0.0.1:" + port }));
        });
      });
      server.once("error", reject);
    });
  }
  return { listen, sd, close: () => new Promise((r) => server.close(r)) };
}

module.exports = { createDevice };
