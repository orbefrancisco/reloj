// Se carga en el <head>, antes de pintar: aplica el estilo (tema) guardado para que la página no parpadee.
// ESTILOS, EKEY, estilo y aplicarEstilo son globales: reloj.js los usa.
// Estilos visuales. art = trabajo, ven = descanso, cap = cambio de fase, amb = aviso / «por debajo»; tienen que distinguirse bien entre sí
// y leerse sobre bg y surface (texto ≥ 4,5:1; barras ≥ 3:1 sobre track/line y soft; los 4 estados con ΔE ≥ 35 entre sí).
// Mapa muscular (v15): cuerpo = figura base, cborde = su contorno, mborde = rayas finas entre músculos (y aro de los puntos de la lista);
// m0 / mlo / mok / mhi = sin series (gris), por debajo (naranja), en rango (verde), te pasaste (amarillo). Cada estado se separa de los otros
// y del cuerpo (ΔE ≥ 25; el gris, ΔE ≥ 8 del cuerpo), los colores contrastan ≥ 3:1 con mborde (el gris ≥ 2:1) y el cuerpo ≥ 1,4:1 con el fondo, así cada músculo y cada punto tiene borde visible aunque el amarillo sea claro.
// Arterial los toma de index.html (claro y oscuro).
const ESTILOS={
 arterial:{n:'Arterial',d:'El original. Claro u oscuro según el teléfono.'},
 medianoche:{n:'Medianoche',d:'Negro puro, colores neón. Ahorra batería en pantallas OLED.',oscuro:1,
  v:{bg:'#000000',surface:'#0b0b0f',fg:'#f5f5f7',muted:'#8e8e9c',line:'#23232d',soft:'#17171f',art:'#ff2d55',ven:'#5ac8fa',cap:'#30d158',amb:'#c98a00',
     cuerpo:'#2c2c35',cborde:'#000000',mborde:'#050507',m0:'#43434f',mlo:'#ff7a33',mok:'#30d158',mhi:'#ffd60a'}},
 hierro:{n:'Hierro',d:'Acero y amarillo de advertencia, esquinas rectas.',oscuro:1,recto:1,
  v:{bg:'#1b1d20',surface:'#24272b',fg:'#ece8df',muted:'#9d998f',line:'#3a3e44',soft:'#2f3337',art:'#ffb800',ven:'#8fa8c4',cap:'#62d394',amb:'#ff7a45',
     cuerpo:'#3e4247',cborde:'#0c0d0f',mborde:'#131518',m0:'#565b62',mlo:'#ff7a45',mok:'#62d394',mhi:'#ffd23f'}},
 oceano:{n:'Océano',d:'Azul profundo con coral.',oscuro:1,
  v:{bg:'#04151f',surface:'#082231',fg:'#e2f3f8',muted:'#80a7b6',line:'#13394b',soft:'#0d2e40',art:'#ff7a59',ven:'#3fb8e0',cap:'#7ee0b5',amb:'#c98a00',
     disp:'"Space Grotesk",system-ui,sans-serif',
     cuerpo:'#1f3a4b',cborde:'#010a10',mborde:'#03111a',m0:'#335466',mlo:'#ff8752',mok:'#5fd9a0',mhi:'#ffd84d'}},
 terminal:{n:'Terminal',d:'Fósforo verde y todo en letra de máquina.',oscuro:1,recto:1,
  v:{bg:'#050805',surface:'#0a110a',fg:'#b9f5b1',muted:'#64935e',line:'#1a331a',soft:'#102010',art:'#39ff14',ven:'#00d1ff',cap:'#ffd23f',amb:'#ff6b35',
     disp:'"IBM Plex Mono",ui-monospace,monospace',body:'"IBM Plex Mono",ui-monospace,monospace',
     cuerpo:'#243324',cborde:'#000000',mborde:'#020402',m0:'#3a503a',mlo:'#ff8c42',mok:'#39ff14',mhi:'#ffe14d'}},
 papel:{n:'Papel',d:'Crema y tinta, letra con serifa.',
  v:{bg:'#f3ecdf',surface:'#faf6ee',fg:'#2a2420',muted:'#6b6155',line:'#dccfbc',soft:'#ebe1cf',art:'#a3352a',ven:'#2f5d73',cap:'#55752f',amb:'#8a5a00',
     disp:'Fraunces,Georgia,serif',
     cuerpo:'#cdc1ad',cborde:'#857760',mborde:'#2b241b',m0:'#e6dccb',mlo:'#cf5a1c',mok:'#4f8a2c',mhi:'#d9a50f'}},
 sol:{n:'Pleno sol',d:'Contraste máximo para leer al aire libre.',
  v:{bg:'#ffffff',surface:'#ffffff',fg:'#000000',muted:'#3a3a3a',line:'#1a1a1a',soft:'#ffe600',art:'#d10000',ven:'#0033cc',cap:'#00703a',amb:'#8f6400',track:'#cfcfcf',cuerpo:'#b5b5b5',cborde:'#000000',mborde:'#000000',m0:'#e8e8e8',mlo:'#f06000',mok:'#00a04a',mhi:'#ffd000'}}
};
const EKEY='reloj-anomalo-estilo';
let estilo='arterial';try{estilo=localStorage.getItem(EKEY)||'arterial'}catch(e){}
function aplicarEstilo(id){
  if(!Object.prototype.hasOwnProperty.call(ESTILOS,id))id='arterial';estilo=id;   // solo estilos propios (no «constructor», «__proto__»…)
  const E=ESTILOS[id],r=document.documentElement;
  ['bg','surface','fg','muted','line','soft','art','ven','cap','amb','track','disp','body','cuerpo','cborde','mborde','m0','mlo','mok','mhi'].forEach(k=>r.style.removeProperty('--'+k));
  Object.entries(E.v||{}).forEach(([k,x])=>r.style.setProperty('--'+k,x));
  r.style.colorScheme=E.v?(E.oscuro?'dark':'light'):'';
  r.toggleAttribute('data-recto',!!E.recto);
  const osc=E.v?E.oscuro:matchMedia('(prefers-color-scheme: dark)').matches;
  document.querySelector('meta[name="theme-color"]').content=E.v?E.v.bg:(osc?'#140d0f':'#f4efef')}
aplicarEstilo(estilo);
