// Se carga en el <head>, antes de pintar: aplica el estilo (tema) guardado para que la página no parpadee.
// ESTILOS, EKEY, estilo, aplicarEstilo, PRINCIPAL, VOL_ESTADOS y VOL_ALERTA son globales: reloj.js los usa.
//
// FUENTE ÚNICA DE LA PALETA (v22, estética de instrumentación):
//  · PRINCIPAL = colores del tema por defecto («Instrumental», id 'arterial'), en claro y en oscuro según el teléfono.
//  · VOL_ESTADOS = los cinco estados del volumen semanal frente a su objetivo orientativo, con su color en fondo oscuro y en fondo claro.
//    Los usan el mapa anatómico, su leyenda y su lista, las barras de Progreso y el resumen en imagen (variables --m0…--mal).
//    Son referencias orientativas de volumen: NO diagnostican recuperación, eficacia, lesión ni sobreentrenamiento.
//  · VOL_ALERTA = 1,30: por encima del máximo y hasta 1,30 × máximo es «por encima»; más allá, «muy por encima». Se calcula
//    con el máximo de cada grupo o zona (ver estadoVol en reloj.js).
// Comprobado con auditorias/Reloj_2026-10-23/paleta/paleta.py: estados con ΔE ≥ 20 entre sí (≥ 10 con protanopia y deuteranopia),
// ≥ 3:1 con el fondo y la tarjeta, ≥ 2,4:1 con las rayas del mapa; texto ≥ 4,5:1.
const VOL_ALERTA=1.3;
const VOL_ESTADOS=[
  {k:'z0', v:'m0', n:'sin series',         osc:'#7A879B',claro:'#788599'},   // gris pizarra
  {k:'zlo',v:'mlo',n:'por debajo',         osc:'#E5A15B',claro:'#B57733'},   // ámbar suave
  {k:'zok',v:'mok',n:'en objetivo',        osc:'#41BFA3',claro:'#0A957C'},   // verde jade
  {k:'zhi',v:'mhi',n:'por encima (≤ +30 %)',osc:'#6CA9DD',claro:'#4188BD'},  // azul acero
  {k:'zal',v:'mal',n:'más de +30 %',       osc:'#DB6B78',claro:'#C25563'}];  // rojo coral
const PRINCIPAL={
  // art = acento (trabajo, botón activo, foco), ven = descanso, cap = cambio de fase, amb = aviso; cuerpo/cborde/mborde = figura del mapa
  oscuro:{bg:'#0B1A33',surface:'#152949',fg:'#E9E5DB',muted:'#ADB9CC',line:'#24395C',soft:'#1C3357',art:'#CBA96B',ven:'#8DB4DE',cap:'#5FC4AC',amb:'#E5A15B',
          cuerpo:'#33476A',cborde:'#050D1A',mborde:'#081224'},
  claro:{bg:'#F3F5F8',surface:'#FFFFFF',fg:'#0B1A33',muted:'#4A5872',line:'#D3DAE4',soft:'#E6EBF2',art:'#8A6A2F',ven:'#2F5F93',cap:'#1F7F6B',amb:'#9A5B12',
         cuerpo:'#C3CBD7',cborde:'#7D8796',mborde:'#1E2A3D'}};
// Los otros estilos conservan su identidad (fondo, acentos y figura del mapa) y toman los colores de estado de VOL_ESTADOS
// (variante oscura o clara según el estilo), para que los cinco estados signifiquen lo mismo en todas las pantallas.
const ESTILOS={
 arterial:{n:'Instrumental',d:'Azul noche y dorado. Claro u oscuro según el teléfono.'},
 medianoche:{n:'Medianoche',d:'Negro puro, colores neón. Ahorra batería en pantallas OLED.',oscuro:1,
  v:{bg:'#000000',surface:'#0b0b0f',fg:'#f5f5f7',muted:'#8e8e9c',line:'#23232d',soft:'#17171f',art:'#ff2d55',ven:'#5ac8fa',cap:'#30d158',amb:'#c98a00',
     cuerpo:'#2c2c35',cborde:'#000000',mborde:'#050507'}},
 hierro:{n:'Hierro',d:'Acero y amarillo de advertencia, esquinas rectas.',oscuro:1,recto:1,
  v:{bg:'#1b1d20',surface:'#24272b',fg:'#ece8df',muted:'#9d998f',line:'#3a3e44',soft:'#2f3337',art:'#ffb800',ven:'#8fa8c4',cap:'#62d394',amb:'#ff7a45',
     cuerpo:'#3e4247',cborde:'#0c0d0f',mborde:'#131518'}},
 oceano:{n:'Océano',d:'Azul profundo con coral.',oscuro:1,
  v:{bg:'#04151f',surface:'#082231',fg:'#e2f3f8',muted:'#80a7b6',line:'#13394b',soft:'#0d2e40',art:'#ff7a59',ven:'#3fb8e0',cap:'#7ee0b5',amb:'#c98a00',
     disp:'"Space Grotesk",system-ui,sans-serif',
     cuerpo:'#1f3a4b',cborde:'#010a10',mborde:'#03111a'}},
 terminal:{n:'Terminal',d:'Fósforo verde y todo en letra de máquina.',oscuro:1,recto:1,
  v:{bg:'#050805',surface:'#0a110a',fg:'#b9f5b1',muted:'#64935e',line:'#1a331a',soft:'#102010',art:'#39ff14',ven:'#00d1ff',cap:'#ffd23f',amb:'#ff6b35',
     disp:'"IBM Plex Mono",ui-monospace,monospace',body:'"IBM Plex Mono",ui-monospace,monospace',
     cuerpo:'#243324',cborde:'#000000',mborde:'#020402'}},
 papel:{n:'Papel',d:'Crema y tinta, letra con serifa.',
  v:{bg:'#f3ecdf',surface:'#faf6ee',fg:'#2a2420',muted:'#6b6155',line:'#dccfbc',soft:'#ebe1cf',art:'#a3352a',ven:'#2f5d73',cap:'#55752f',amb:'#8a5a00',
     disp:'Fraunces,Georgia,serif',
     cuerpo:'#cdc1ad',cborde:'#857760',mborde:'#2b241b'}},
 sol:{n:'Pleno sol',d:'Contraste máximo para leer al aire libre.',
  v:{bg:'#ffffff',surface:'#ffffff',fg:'#000000',muted:'#3a3a3a',line:'#1a1a1a',soft:'#ffe600',art:'#d10000',ven:'#0033cc',cap:'#00703a',amb:'#8f6400',track:'#cfcfcf',cuerpo:'#b5b5b5',cborde:'#000000',mborde:'#000000'}}
};
const EKEY='reloj-anomalo-estilo';
let estilo='arterial';try{estilo=localStorage.getItem(EKEY)||'arterial'}catch(e){}
const colVol=oscuro=>Object.fromEntries(VOL_ESTADOS.map(s=>[s.v,oscuro?s.osc:s.claro]));
const VARS=['bg','surface','fg','muted','line','soft','art','ven','cap','amb','track','disp','body','cuerpo','cborde','mborde',...VOL_ESTADOS.map(s=>s.v)];
// tema principal y estados como hoja de estilo: claro por defecto y oscuro con prefers-color-scheme (sigue al teléfono sin JS)
(()=>{const css=o=>Object.entries(o).map(([k,x])=>`--${k}:${x}`).join(';');
  const st=document.createElement('style');st.id='paleta';
  st.textContent=`:root{${css({...PRINCIPAL.claro,...colVol(false)})}}@media (prefers-color-scheme: dark){:root{${css({...PRINCIPAL.oscuro,...colVol(true)})};color-scheme:dark}}`;
  document.head.prepend(st)})();
function aplicarEstilo(id){
  if(!Object.prototype.hasOwnProperty.call(ESTILOS,id))id='arterial';estilo=id;   // solo estilos propios (no «constructor», «__proto__»…)
  const E=ESTILOS[id],r=document.documentElement;
  VARS.forEach(k=>r.style.removeProperty('--'+k));
  if(E.v)Object.entries({...E.v,...colVol(!!E.oscuro)}).forEach(([k,x])=>r.style.setProperty('--'+k,x));
  r.style.colorScheme=E.v?(E.oscuro?'dark':'light'):'';
  r.toggleAttribute('data-recto',!!E.recto);
  const osc=E.v?E.oscuro:matchMedia('(prefers-color-scheme: dark)').matches;
  document.querySelector('meta[name="theme-color"]').content=E.v?E.v.bg:(osc?PRINCIPAL.oscuro.bg:PRINCIPAL.claro.bg)}
aplicarEstilo(estilo);
