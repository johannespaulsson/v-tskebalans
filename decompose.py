from pathlib import Path
from bs4 import BeautifulSoup

# Stig till originalfilen
original_file = Path("index.html")

# Skapa ny mapp
output_dir = original_file.parent / "new_folder"
output_dir.mkdir(exist_ok=True)

# Läs in HTML
html = original_file.read_text(encoding="utf-8")
soup = BeautifulSoup(html, "html.parser")

# --- Extrahera CSS ---
styles = []
for style_tag in soup.find_all("style"):
    styles.append(style_tag.string or "")
    style_tag.decompose()

css_content = "\n\n".join(styles)
(output_dir / "styles.css").write_text(css_content, encoding="utf-8")

# Lägg till länk till CSS i <head>
link_tag = soup.new_tag("link", rel="stylesheet", href="./new_folder/styles.css")
soup.head.append(link_tag)

# --- Extrahera JS ---
scripts = []
for script_tag in soup.find_all("script"):
    if script_tag.string:  # Endast inline, inte externa länkar
        scripts.append(script_tag.string)
        script_tag.decompose()

js_content = "\n\n".join(scripts)
(output_dir / "script.js").write_text(js_content, encoding="utf-8")

# Lägg till script-tag längst ned i <body>
new_script_tag = soup.new_tag("script", src="./new_folder/script.js")
soup.body.append(new_script_tag)

# --- Skriv uppdaterad index.html ---
(output_dir / "index.html").write_text(soup.prettify(), encoding="utf-8")

print("Filer skapade i", output_dir)
