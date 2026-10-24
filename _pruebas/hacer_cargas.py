"""Página de pruebas de «Mis cargas» (v31): copia de index.html con rutas file:// y cargas.js de pruebas al final, SIN semilla
(cada prueba empieza con el historial vacío). Abrirla en Chrome sin pantalla con un perfil aparte:
    python3 hacer_cargas.py SALIDA.html
    google-chrome --headless=new --user-data-dir=PERFIL --virtual-time-budget=20000 --dump-dom file://SALIDA.html
Persistencia: abrir dos veces con el MISMO perfil, primero con ?fase=1 y después con ?fase=2."""
import os, re, sys
app = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(app, "index.html"), encoding="utf-8").read()
html = re.sub(r'(src|href)="(?!https?:|data:|#)([^"]+)"', lambda m: f'{m[1]}="file://{app}/{m[2]}"', html)
final = sys.argv[2] if len(sys.argv) > 2 else "cargas.js"   # v33: también musica.js (pruebas de la música)
html = html.replace("</body>", f'<script src="file://{app}/_pruebas/{final}"></script>\n</body>')
open(sys.argv[1], "w", encoding="utf-8").write(html)
print("ok", sys.argv[1])
