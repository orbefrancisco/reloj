"""Genera la página de pruebas de volumen: copia de index.html con rutas absolutas (file://), semilla.js ANTES de reloj.js
y vistas.js al final. Abrirla en Chrome sin pantalla, con un perfil aparte (los datos sintéticos van a su localStorage):
    python3 hacer_pruebas.py SALIDA.html
    google-chrome --headless=new --user-data-dir=PERFIL_TEMPORAL --virtual-time-budget=8000 --dump-dom file://SALIDA.html
El resultado queda en <pre id="resultado">."""
import os, re, sys
app = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(app, "index.html"), encoding="utf-8").read()
html = re.sub(r'(src|href)="(?!https?:|data:|#)([^"]+)"', lambda m: f'{m[1]}="file://{app}/{m[2]}"', html)
html = html.replace(f'<script src="file://{app}/reloj.js">', f'<script src="file://{app}/_pruebas/semilla.js"></script>\n<script src="file://{app}/reloj.js">')
final = sys.argv[2] if len(sys.argv) > 2 else "vistas.js"   # ver.js = abre Progreso para hacer capturas
html = html.replace("</body>", f'<script src="file://{app}/_pruebas/{final}"></script>\n</body>')
open(sys.argv[1], "w", encoding="utf-8").write(html)
print("ok", sys.argv[1])
