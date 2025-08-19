from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path.cwd()
ASSETS = ROOT / "static"
FULL_INDEX = ROOT / "index.html"      # output: full inlined file at project root
INDEX = ASSETS / "index.html"         # input: partial file with links
CSS = ASSETS / "styles.css"
JS  = ASSETS / "script.js"

html = INDEX.read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

# --- Inline CSS ---
for link in list(soup.find_all("link", rel=lambda v: v and "stylesheet" in v, href=True)):
    href = link["href"]
    if Path(href).name == "styles.css":
        css_path = (INDEX.parent / href)
        if not css_path.exists():
            css_path = CSS
        style_tag = soup.new_tag("style")
        style_tag.string = css_path.read_text(encoding="utf-8").strip()
        link.decompose()
        soup.head.append(style_tag)
        break  # assume a single styles.css is enough

# --- Inline JS ---
js_chunks = []
for s in list(soup.find_all("script", src=True)):
    src = s["src"]
    if Path(src).name == "script.js":
        js_path = (INDEX.parent / src)
        if not js_path.exists():
            js_path = JS
        js_chunks.append(js_path.read_text(encoding="utf-8").strip())
        s.decompose()

if js_chunks:
    inline_script = soup.new_tag("script")
    inline_script.string = "\n\n".join(js_chunks)
    soup.body.append(inline_script)  # last in <body>

# --- Write full inlined file ---
FULL_INDEX.write_text(soup.prettify(), encoding="utf-8")
print(f"Inlined CSS/JS and updated: {FULL_INDEX}")
