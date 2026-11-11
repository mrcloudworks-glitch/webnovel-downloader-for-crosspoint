#!/usr/bin/env python3
"""Render page 1 of each chapter of the generated EPUB on a 528x792 Xteink X3
preview, driven by the EPUB's own XHTML + style.css (base reader font 16px,
matching CrossPoint's builtin size ladder 12/14/16/18pt).

Verifies programmatically that the chapter title is the first thing on page 1,
in bold and at a bigger font size than the body text, then writes PNGs for
visual inspection.

Usage: /tmp/pil-venv/bin/python render_preview.py [epub]   (from test/)
"""
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw, ImageFont

EPUB = sys.argv[1] if len(sys.argv) > 1 else \
    "/home/user/webnovel-downloader-for-crosspoint/artifacts/Cultivation-Online-2ch.epub"
OUT_DIR = "/home/user/webnovel-downloader-for-crosspoint/artifacts"
NS = "{http://www.w3.org/1999/xhtml}"
W, H = 528, 792            # Xteink X3 screen
BASE_PX = 16               # base reader font (CrossPoint builtin: 12/14/16/18pt)
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
fails = 0


def check(name, cond, detail=""):
    global fails
    print(("  PASS  " if cond else "  FAIL  ") + name + ("" if cond else "  [" + str(detail) + "]"))
    if not cond:
        fails += 1


def css_block(css, selector):
    m = re.search(re.escape(selector) + r"\{([^}]*)\}", css)
    return m.group(1) if m else ""


def em(v, fallback):
    try:
        return float(v.replace("em", ""))
    except (ValueError, AttributeError):
        return fallback


def wrap(text, font, width):
    lines, line = [], ""
    for word in text.split():
        trial = word if not line else line + " " + word
        if font.getlength(trial) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines or [""]


def render(chapter_file, title, out_png):
    print(f"\n--- {chapter_file} -> {out_png.split('/')[-1]} ---")
    with zipfile.ZipFile(EPUB) as z:
        css = z.read("OEBPS/style.css").decode("utf-8")
        root = ET.fromstring(z.read("OEBPS/" + chapter_file))

    body_css = css_block(css, "body")
    h1_css = css_block(css, "h1.chapter-title")
    p_css = css_block(css, "p")

    # --- parse the styles the device would apply
    side = W * em(re.search(r"margin:0 ([\d.]+)%", body_css).group(1), 5) / 100 if re.search(r"margin:0 ([\d.]+)%", body_css) else W * 0.05
    body_lh = em(re.search(r"line-height:([\d.]+)", body_css).group(1), 1.5)
    title_em = em(re.search(r"font-size:([\d.]+)em", h1_css).group(1), 1.5)
    title_px = BASE_PX * title_em
    title_bold = "font-weight:bold" in h1_css
    title_lh = em(re.search(r"line-height:([\d.]+)", h1_css).group(1), 1.25)
    title_mb = em(re.search(r"margin-bottom:([\d.]+)em", h1_css).group(1), 0.85) * BASE_PX
    title_mt = 0.0 if re.search(r"margin-top:0", h1_css) else 4.0
    p_mb = em(re.search(r"margin:0 0 ([\d.]+)em", p_css).group(1), 0.7) * BASE_PX if re.search(r"margin:0 0 ([\d.]+)em", p_css) else 0.7 * BASE_PX

    check("css: h1.chapter-title is 1.5em", abs(title_em - 1.5) < 1e-6, title_em)
    check("css: h1.chapter-title is bold", title_bold)
    check("title font bigger than body", title_px > BASE_PX, f"{title_px} vs {BASE_PX}")
    check("css: title margin-top is 0 (top of page)", "margin-top:0" in h1_css)

    f_title = ImageFont.truetype(f"{FONT_DIR}/DejaVuSans-Bold.ttf" if title_bold else f"{FONT_DIR}/DejaVuSans.ttf", int(title_px))
    f_body = ImageFont.truetype(f"{FONT_DIR}/DejaVuSans.ttf", BASE_PX)

    img = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(img)

    # --- body content in document order: h1.chapter-title first, then section
    body = root.find(NS + "body")
    kids = list(body)
    first = kids[0] if kids else None
    check("first body element is h1.chapter-title",
          first is not None and first.tag == NS + "h1" and first.get("class") == "chapter-title",
          first.tag if first is not None else None)

    draws = []  # (y, text, font) — collected so we can assert order/geometry

    def put(text, font, y, lh):
        for ln in wrap(text, font, W - 2 * side):
            if y > H:
                return y, False
            draws.append((y, ln, font))
            y += lh
        return y, True

    y = float(title_mt)
    title_text = "".join(first.itertext()) if first is not None else ""
    y, _ = put(title_text, f_title, y, title_px * title_lh)
    y += title_mb

    section = body.find(NS + "section")
    if section is None:
        check("section present", False)
        return
    for p in section.findall(NS + "p"):
        y, more = put("".join(p.itertext()), f_body, y, BASE_PX * body_lh)
        if not more:
            break
        y += p_mb

    # --- programmatic page-1 geometry
    check("page 1 starts at y=0 with the title", draws and draws[0][2] is f_title and draws[0][0] <= 2,
          draws[0] if draws else None)
    check("title drawn in bold font", draws and draws[0][2] is f_title and title_bold)
    body_line = next((t for t in draws if t[2] is f_body), None)
    check("body text follows below the title", body_line is not None and body_line[0] > draws[0][0],
          body_line[0] if body_line else None)
    check("some body text fits on page 1", body_line is not None and len(draws) > 3, len(draws))

    for y0, text, font in draws:
        d.text((side, y0), text, font=font, fill=0, anchor="lt")
    img.save(out_png)
    print(f"  drew {len(draws)} lines; title y={draws[0][0]:.1f}px @ {title_px:.0f}px bold, "
          f"first body line y={body_line[0]:.1f}px @ {BASE_PX}px  ->  {out_png}")


# --- cover validity
with zipfile.ZipFile(EPUB) as z:
    cover = z.read("OEBPS/cover.jpg")
open("/tmp/_cover_check.jpg", "wb").write(cover)
cov = Image.open("/tmp/_cover_check.jpg")
cov.load()
print(f"cover.jpg: valid JPEG, {cov.size[0]}x{cov.size[1]}, {len(cover)} bytes")
check("cover.jpg decodes as an image", cov.size[0] > 0 and cov.size[1] > 0)

render("ch-0001.xhtml", "Chapter 1 - Cultivation Online",
       f"{OUT_DIR}/preview-X3-ch1-page1.png")
render("ch-0002.xhtml", "Chapter 2 - Mysterious Little Girl",
       f"{OUT_DIR}/preview-X3-ch2-page1.png")

print("\n" + (f"{fails} CHECK(S) FAILED" if fails else "ALL PREVIEW CHECKS PASSED"))
sys.exit(1 if fails else 0)
