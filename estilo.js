// Se carga en el <head>, antes de pintar: aplica el estilo (tema) guardado para que la página no parpadee.
// ESTILOS, EKEY, estilo y aplicarEstilo son globales: reloj.js los usa.
// Estilos visuales. art = trabajo, ven = descanso, cap = cambio de fase, amb = aviso / «por debajo»; tienen que distinguirse bien entre sí
// y leerse sobre bg y surface (texto ≥ 4,5:1; barras ≥ 3:1 sobre track/line y soft; los 4 estados con ΔE ≥ 35 entre sí).
const ESTILOS={
 arterial:{n:'Arterial',d:'El original. Claro u oscuro según el teléfono.'},
 medianoche:{n:'Medianoche',d:'Negro puro, colores neón. Ahorra batería en pantallas OLED.',oscuro:1,
  v:{bg:'#000000',surface:'#0b0b0f',fg:'#f5f5f7',muted:'#8e8e9c',line:'#23232d',soft:'#17171f',art:'#ff2d55',ven:'#5ac8fa',cap:'#30d158',amb:'#c98a00'}},
 hierro:{n:'Hierro',d:'Acero y amarillo de advertencia, esquinas rectas.',oscuro:1,recto:1,
  v:{bg:'#1b1d20',surface:'#24272b',fg:'#ece8df',muted:'#9d998f',line:'#3a3e44',soft:'#2f3337',art:'#ffb800',ven:'#8fa8c4',cap:'#62d394',amb:'#ff7a45'}},
 oceano:{n:'Océano',d:'Azul profundo con coral.',oscuro:1,
  v:{bg:'#04151f',surface:'#082231',fg:'#e2f3f8',muted:'#80a7b6',line:'#13394b',soft:'#0d2e40',art:'#ff7a59',ven:'#3fb8e0',cap:'#7ee0b5',amb:'#c98a00',
     disp:'"Space Grotesk",system-ui,sans-serif'}},
 terminal:{n:'Terminal',d:'Fósforo verde y todo en letra de máquina.',oscuro:1,recto:1,
  v:{bg:'#050805',surface:'#0a110a',fg:'#b9f5b1',muted:'#64935e',line:'#1a331a',soft:'#102010',art:'#39ff14',ven:'#00d1ff',cap:'#ffd23f',amb:'#ff6b35',
     disp:'"IBM Plex Mono",ui-monospace,monospace',body:'"IBM Plex Mono",ui-monospace,monospace'}},
 papel:{n:'Papel',d:'Crema y tinta, letra con serifa.',
  v:{bg:'#f3ecdf',surface:'#faf6ee',fg:'#2a2420',muted:'#6b6155',line:'#dccfbc',soft:'#ebe1cf',art:'#a3352a',ven:'#2f5d73',cap:'#55752f',amb:'#8a5a00',
     disp:'Fraunces,Georgia,serif'}},
 sol:{n:'Pleno sol',d:'Contraste máximo para leer al aire libre.',
  v:{bg:'#ffffff',surface:'#ffffff',fg:'#000000',muted:'#3a3a3a',line:'#1a1a1a',soft:'#ffe600',art:'#d10000',ven:'#0033cc',cap:'#00703a',amb:'#8f6400',track:'#cfcfcf'}}
};
const EKEY='reloj-anomalo-estilo';
let estilo='arterial';try{estilo=localStorage.getItem(EKEY)||'arterial'}catch(e){}
function aplicarEstilo(id){
  if(!Object.prototype.hasOwnProperty.call(ESTILOS,id))id='arterial';estilo=id;   // solo estilos propios (no «constructor», «__proto__»…)
  const E=ESTILOS[id],r=document.documentElement;
  ['bg','surface','fg','muted','line','soft','art','ven','cap','amb','track','disp','body'].forEach(k=>r.style.removeProperty('--'+k));
  Object.entries(E.v||{}).forEach(([k,x])=>r.style.setProperty('--'+k,x));
  r.style.colorScheme=E.v?(E.oscuro?'dark':'light'):'';
  r.toggleAttribute('data-recto',!!E.recto);
  const osc=E.v?E.oscuro:matchMedia('(prefers-color-scheme: dark)').matches;
  document.querySelector('meta[name="theme-color"]').content=E.v?E.v.bg:(osc?'#140d0f':'#f4efef')}
aplicarEstilo(estilo);
