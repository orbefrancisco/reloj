// Corre en Node las pruebas escritas para Chrome (vistas.js, v38.js, cierre.js…) con el DOM de mentira de entorno.js.
// Solo valen las que comprueban lógica: las que miden el DOM pintado pueden fallar aquí y pasar en Chrome.
//     node _pruebas/node/antiguas.js [vistas.js v38.js …]
'use strict';
const cargar = require('./entorno');
const APPJS = ['estilo.js', 'anim.js', 'reloj.js', 'analisis.js', 'auditoria.js', 'pantallas.js', 'cargas.js', 'musica.js', 'cierre.js', 'entreno.js', 'rendimiento.js'];
const lista = process.argv.slice(2).length ? process.argv.slice(2) : ['vistas.js', 'v37.js', 'v38.js', 'cierre.js', 'cargas.js', 'entreno.js', 'hoy.js', 'musica.js'];
let fallos = 0;
for (const f of lista) {
  let txt;
  try { const A = cargar({ archivos: ['estilo.js', 'anim.js', '_pruebas/semilla.js', ...APPJS.slice(2), '_pruebas/' + f] });
    const pre = A.creados.find(e => e.id === 'resultado'); txt = pre ? String(pre.textContent) : 'SIN RESULTADO'; }
  catch (e) { txt = 'EXCEPCIÓN al cargar: ' + e.message; }
  const malas = txt.split('\n').filter(l => /^FALLA|EXCEPCI|SIN RESULTADO/.test(l));
  fallos += malas.length;
  console.log(`== ${f}: ${txt.split('\n')[0]}`); malas.forEach(l => console.log('   ' + l.slice(0, 300)));
}
process.exit(fallos ? 1 : 0);
