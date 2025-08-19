from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path.cwd()
ASSETS = ROOT / "static"
FULL_INDEX = ROOT / "index.html" # output: full inlined file at project root

# Below are the paths to the partial files
INDEX = ASSETS / "index.html"
CSS = ASSETS / "styles.css"
JS  = ASSETS / "script.js"

# Check if all required files and directories exist
for p in (ASSETS, INDEX, CSS, JS):
    if not p.exists():
        raise FileNotFoundError(f"Required file or directory does not exist: {p}")

html = INDEX.read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

# --- Inline CSS ---
for link in list(soup.find_all("link", rel=lambda v: v and "stylesheet" in v, href=True)):
    href = link["href"]
    if Path(href).name == "styles.css":
        style_tag = soup.new_tag("style")
        style_tag.string = CSS.read_text(encoding="utf-8").strip()
        link.decompose()
        soup.head.append(style_tag)
        break  # assume a single styles.css is enough

# --- Inline JS ---
for s in list(soup.find_all("script", src=True)):
    src = s["src"]
    if Path(src).name == "script.js":
        inline_script = soup.new_tag("script")
        inline_script.string = JS.read_text(encoding="utf-8").strip()
        soup.body.append(inline_script)  # last in <body>
        s.decompose()
        break  # assume a single script.js is enough

# --- Write full inlined file ---
FULL_INDEX.write_text(soup.prettify(), encoding="utf-8")
print(f"Inlined CSS/JS and updated: {FULL_INDEX}")
