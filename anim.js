// Biblioteca de animaciones por ejercicio (v17): el muñeco hace cada ejercicio, dibujado aquí (SVG + CSS), sin imágenes ni internet.
// Se carga antes de reloj.js. Expone ANIM (global): buscar(nombre, grupo), svg(id, opciones), lista, porId.
//
// Cómo funciona
// · Un esqueleto 2D (vista lateral mirando a la derecha, o frontal) con huesos anidados: pelvis → lumbar → pecho → cabeza / brazos,
//   pelvis → muslos → piernas → pies. Cada hueso es un <g> con transform="translate(enganche) rotate(ángulo relativo)" y se dibuja
//   a lo largo de su eje x local (de 0 a su largo). El lado +y local es el «frente» del hueso (pecho, cara).
// · Cada ejercicio es una función pose(u): u = 0 posición estirada (inicio), u = 1 contraída. Devuelve ángulos en el mundo
//   (0 = derecha, 90 = abajo) y, si hace falta, resuelve con cinemática inversa (manos fijas en la barra, pies fijos en el suelo…).
// · Al construir el SVG se muestrea pose(u) a lo largo de una repetición (subida más rápida, bajada más lenta, pausas cortas)
//   y se generan @keyframes por hueso. El navegador anima solo transforms: nada se recalcula mientras corre.
// · Capas: el mismo hueso se puede repetir en varias capas (con la misma animación) para dibujar delante o detrás según convenga.
// · Sin animación (prefers-reduced-motion, miniaturas del catálogo) queda la pose del atributo transform: la mitad del recorrido.
'use strict';
const ANIM=(()=>{
const RAD=Math.PI/180,cs=a=>Math.cos(a*RAD),sn=a=>Math.sin(a*RAD),ang=(y,x)=>Math.atan2(y,x)/RAD;
const mix=(a,b,u)=>a+(b-a)*u,add=(p,a,l)=>[p[0]+l*cs(a),p[1]+l*sn(a)],dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const M=a=>180-a;   // espejo izquierda-derecha (vista frontal)
const LL=11,LC=14,LU=15,LF=13,LT=21,LS=20,AH=3,SUELO=94;
const r1=v=>Math.round(v*100)/100;

/* ---------- esqueleto ---------- */
// [id, padre]; el ángulo en el mundo de cada hueso sale de la pose (h, mano y equipo heredan si no se dan).
const ARBOL=[['r',null],['c','r'],['h','c'],['uF','c'],['fF','uF'],['hF','fF'],['xF','hF'],['uN','c'],['fN','uN'],['hN','fN'],['xN','hN'],
  ['tF','r'],['sF','tF'],['pF','sF'],['tN','r'],['sN','tN'],['pN','sN']];
const PADRE=Object.fromEntries(ARBOL);
const LARGO={r:LL,c:LC,h:0,uN:LU,uF:LU,fN:LF,fF:LF,hN:2,hF:2,xN:0,xF:0,tN:LT,tF:LT,sN:LS,sF:LS,pN:0,pF:0};
function base(v){return {v:v||'lat',x:58,y:50,l:-90,c:-90,h:null,el:0,uN:90,fN:90,hN:null,xN:null,uF:90,fF:90,hF:null,xF:null,
  tN:90,sN:90,pN:0,tF:90,sF:90,pF:0,k:{},ex:{}}}
function mundo(p,id){const a=p[{r:'l'}[id]||id];if(a!=null)return a;
  if(id==='h')return p.c;if(id[0]==='h')return mundo(p,'f'+id[1]);if(id[0]==='x')return mundo(p,'h'+id[1]);return 0}
function enganche(p,id){const fr=p.v==='fr',s=id[1]==='N'?1:-1;
  switch(id[0]){case 'c':return [LL,0];case 'h':return [LC,0];case 'u':return [LC-1+(p.el||0),fr?8*s:0];
    case 'f':return [LU,0];case 'x':return [2,0];case 't':return [0,fr?4.5*s:0];case 's':return [LT,0];case 'p':return [LS,0]}
  return [0,0]}
const kDe=(p,id)=>p.k&&p.k[id]!=null?p.k[id]:1;
// posiciones en el mundo del origen de cada hueso (la articulación) — la misma composición que el dibujo
function fk(p){const O={},A={};
  for(const [id,par] of ARBOL){A[id]=mundo(p,id);
    if(!par){O[id]=[p.x,p.y];continue}
    const e=enganche(p,id),kx=e[0]*kDe(p,par),pa=A[par],o=O[par];
    O[id]=[o[0]+kx*cs(pa)-e[1]*sn(pa),o[1]+kx*sn(pa)+e[1]*cs(pa)]}
  const pt={...O};
  pt.P=O.r;pt.W=O.c;pt.N=O.h;pt.SN=O.uN;pt.SF=O.uF;pt.EN=O.fN;pt.EF=O.fF;pt.GN=O.xN;pt.GF=O.xF;pt.HN=O.tN;pt.HF=O.tF;pt.KN=O.sN;pt.KF=O.sF;pt.AN=O.pN;pt.AF=O.pF;
  pt.cab=add(add(O.h,A.h,8.4),A.h+90,.5);
  const pie=(o,a)=>[o[0]+8*cs(a)-AH*sn(a),o[1]+8*sn(a)+AH*cs(a)];pt.TN=pie(O.pN,A.pN);pt.TF=pie(O.pF,A.pF);
  pt.A=A;return pt}
// dos eslabones de A a B; pref(J) puntúa la articulación (codo, rodilla) y se queda con la mejor de las dos soluciones
function ik(A,B,l1,l2,pref){let d=dist(A,B);d=Math.min(l1+l2-1e-3,Math.max(Math.abs(l1-l2)+1e-3,d));
  const b=ang(B[1]-A[1],B[0]-A[0]),al=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))))/RAD;
  const o=[b+al,b-al].map(a1=>{const J=add(A,a1,l1);return [a1,ang(B[1]-J[1],B[0]-J[0]),J]});
  return pref(o[0][2])>=pref(o[1][2])?o[0]:o[1]}
// brazo hasta el agarre G (el agarre está 2 más allá de la muñeca, en la línea del antebrazo)
function brazo(p,lado,G,pref){const pt=fk(p),S=pt['S'+lado],[a,b]=ik(S,G,LU*kDe(p,'u'+lado),LF*kDe(p,'f'+lado)+2,pref);p['u'+lado]=a;p['f'+lado]=b;return p}
function pierna(p,lado,A,pref){const pt=fk(p),H=pt['H'+lado],[a,b]=ik(H,A,LT*kDe(p,'t'+lado),LS*kDe(p,'s'+lado),pref);p['t'+lado]=a;p['s'+lado]=b;return p}
// mueve todo el cuerpo para que el punto q (de fk) quede en Q
function llevar(p,q,Q){const pt=fk(p),d=[Q[0]-pt[q][0],Q[1]-pt[q][1]];p.x+=d[0];p.y+=d[1];return p}
const delante=J=>J[0],detras=J=>-J[0],arriba=J=>-J[1],abajo=J=>J[1];

/* ---------- formas ---------- */
const f1=v=>Math.round(v*10)/10;
// cápsula de 0 a L, radios r0 → r1, abultada bp por el lado +y y bm por el −y (en la fracción f del largo)
function cap(L,r0,r1,bp=0,bm=0,f=.45){const m=(r0+r1)/2,x=f1(f*L);
  return `<path d="M0 ${f1(-r0)}Q${x} ${f1(-(m+2*bm))} ${L} ${f1(-r1)}A${r1} ${r1} 0 0 1 ${L} ${r1}Q${x} ${f1(m+2*bp)} 0 ${r0}A${r0} ${r0} 0 0 1 0 ${f1(-r0)}Z"/>`}
const circ=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}"/>`,elip=(x,y,rx,ry)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
const CUERPO={lat:{
  r:cap(LL,6.2,5.2,.6,.3)+circ(1.2,-2.4,5.4),
  c:cap(LC,5.2,6,1.3,.8,.55)+elip(LC*.66,2.4,5.2,4.2)+elip(LC*.6,-1.9,5.6,3.8),
  h:cap(3.6,2.5,2.3)+circ(8.4,.5,5.3)+circ(8.2,5.3,1.2),
  u:circ(.4,0,4.1)+cap(LU,3.4,2.5,1,.9),f:cap(LF,2.8,1.8,.6,.6,.3),hd:circ(1.8,0,2.3),
  t:cap(LT,5.3,3.5,.8,1.4),s:cap(LS,3.4,2,1.7,.3,.3),
  p:`<path d="M-2.6 -1.2C-3.4 .4 -3.4 2.2 -2.4 ${AH}H7.4C8.6 ${AH} 8.8 1.4 7.6 1.1L2 -1.6Z"/>`},
 fr:{
  r:`<path d="M-1 -7.6Q5 -8.6 ${LL} -6.4V6.4Q5 8.6 -1 7.6A7.6 7.6 0 0 1 -1 -7.6Z"/>`,
  c:`<path d="M0 -6.4Q${LC*.55} -7.8 ${LC-1} -10.8A2.6 2.6 0 0 1 ${LC+1.4} -8.6Q${LC+2} 0 ${LC+1.4} 8.6A2.6 2.6 0 0 1 ${LC-1} 10.8Q${LC*.55} 7.8 0 6.4Z"/>`,
  h:cap(3.6,2.6,2.6)+circ(8.4,0,5.3),
  u:circ(.4,0,4.1)+cap(LU,3.4,2.5,.9,.9),f:cap(LF,2.8,1.8,.6,.6,.3),hd:circ(1.8,0,2.3),
  t:cap(LT,5,3.4,.6,.6),s:cap(LS,3.4,2,1,1,.3),p:elip(1,AH-.6,3.2,2)}};
function forma(v,id){const C=CUERPO[v]||CUERPO.lat,t=id[0];return id==='r'?C.r:id==='c'?C.c:id==='h'?C.h:t==='u'?C.u:t==='f'?C.f:t==='h'?C.hd:t==='t'?C.t:t==='s'?C.s:t==='p'?C.p:''}

/* ---------- equipo (en el marco del agarre: origen en la mano, x = eje del objeto) ---------- */
const EQ={
  disco:`<g class="eq-m">${circ(0,0,4.4)}</g><g class="eq-h">${circ(0,0,1.6)}</g>`,          // mancuerna vista de punta
  pesa:`<g class="eq-m"><rect x="-1.2" y="-5.8" width="2.4" height="11.6" rx="1"/><rect x="-3" y="-10" width="6" height="5.2" rx="1.4"/><rect x="-3" y="4.8" width="6" height="5.2" rx="1.4"/></g>`, // mancuerna de lado (agarre neutro)
  colgada:`<g class="eq-m"><rect x="-3.4" y="-4" width="5" height="8" rx="1.4"/><rect x="1" y="-1.1" width="8" height="2.2" rx="1"/><rect x="8.4" y="-4" width="5" height="8" rx="1.4"/></g>`, // mancuerna vertical que cuelga de las manos
  barra:`<g class="eq-m">${circ(0,0,9)}</g><g class="eq-h">${circ(0,0,2.2)}</g>`,              // disco de la barra (va detrás del cuerpo)
  eje:`<g class="eq-m">${circ(0,0,1.5)}</g>`,                                                 // punta de la barra en la mano de delante
  cuerda:`<g class="eq-m"><path d="M-.6 -1.4L5.4 -2.2M-.6 1.4L5.4 2.2" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round"/>${circ(5.6,-2.2,1.5)}${circ(5.6,2.2,1.5)}</g>`,
  asa:`<g class="eq-m"><path d="M-2.6 0A2.8 2.8 0 0 1 2.6 0" fill="none" stroke-width="1.4" stroke="currentColor"/>${circ(0,0,1.6)}</g>`,
  mango:`<g class="eq-m"><rect x="-1.8" y="-1.8" width="3.6" height="3.6" rx="1"/></g>`,
  almoN:`<g class="eq-p"><rect x="-15" y="-6.4" width="16" height="3.4" rx="1.6"/></g>`,almoF:`<g class="eq-p"><rect x="-15" y="3" width="16" height="3.4" rx="1.6"/></g>`,
  rueda:`<g class="eq-m">${circ(0,0,4.6)}</g><g class="eq-h">${circ(0,0,1.6)}</g>`};

/* ---------- tiempo de una repetición ---------- */
// [t, u]: pausa abajo, subida (concéntrica, ~38 %), pausa arriba, bajada (excéntrica, ~48 %), pausa
const suave=x=>x*x*(3-2*x);
const MUESTRAS=(()=>{const o=[[0,0],[.04,0]];for(let i=1;i<=9;i++)o.push([.04+.36*i/9,suave(i/9)]);o.push([.48,1]);
  for(let i=1;i<=12;i++)o.push([.48+.48*i/12,1-suave(i/12)]);o.push([1,0]);return o})();

/* ---------- construcción del SVG ---------- */
const CAPAS_LAT=['fondo','trasF','brazoF','piernaF','tras','torso','piernaN','frente0','brazoN','enlaces','frente'];
const CAPAS_FR=['fondo','trasF','tras','piernaF','piernaN','torso','frente0','brazoF','brazoN','enlaces','frente'];
const GRUPOS={brazoF:['uF','fF','hF','xF'],brazoN:['uN','fN','hN','xN'],piernaF:['tF','sF','pF'],piernaN:['tN','sN','pN'],torso:['r','c','h']};
const ESQ={brazoF:'F',piernaF:'F'};
let NSVG=0;
function rel(p,id){const par=PADRE[id];return par?mundo(p,id)-mundo(p,par):mundo(p,id)}
function tfNodo(p,id,ang){const par=PADRE[id];if(!par)return [p.x,p.y,ang];const e=enganche(p,id);return [e[0]*kDe(p,par),e[1],ang]}
const tfTxt=(t,css)=>css?`translate(${r1(t[0])}px,${r1(t[1])}px) rotate(${r1(t[2])}deg)`:`translate(${r1(t[0])} ${r1(t[1])}) rotate(${r1(t[2])})`;
const desenv=(a,prev)=>{if(prev==null)return a;while(a-prev>180)a-=360;while(a-prev<-180)a+=360;return a};
// puntos de un enlace (cable, palanca, barra entre manos): [x,y] fijo, nombre de fk o 'mid:A,B'
function punto(pt,s){if(Array.isArray(s))return s;if(s.startsWith('mid:')){const [a,b]=s.slice(4).split(',');return [(pt[a][0]+pt[b][0])/2,(pt[a][1]+pt[b][1])/2]}return pt[s]}
function tfEnlace(pt,L){let A=punto(pt,L.de),B=punto(pt,L.a);const a=ang(B[1]-A[1],B[0]-A[0]);
  if(L.ext){A=add(A,a+180,L.ext);B=add(B,a,L.ext)}return [A[0],A[1],a,Math.max(.01,dist(A,B))]}
const CL_ENL={cable:'eq-c',palanca:'eq-l',barra:'eq-l',cuerda:'eq-c'};
/* opciones: {u: número → dibujo quieto en esa u; rango:[a,b] parte del recorrido; clase extra} */
function svg(def,o){o=o||{};const id='an'+(++NSVG),[ra,rb]=o.rango||[0,1],T=def.T||2.8,quieto=o.u!=null;
  const muestras=quieto?[[0,o.u]]:MUESTRAS.map(([t,u])=>[t,ra+(rb-ra)*u]);
  const poses=muestras.map(([t,u])=>def.pose(u)),pts=poses.map(fk),medio=quieto?poses[0]:def.pose((ra+rb)/2),ptm=fk(medio);
  const anim={},css=[];
  // transform de cada hueso en cada muestra
  const tfs={};for(const [nid] of ARBOL){let prev=null;tfs[nid]=poses.map(p=>{const a=desenv(rel(p,nid),prev);prev=a;return tfNodo(p,nid,a)})}
  const ks={};for(const [nid] of ARBOL)ks[nid]=poses.map(p=>kDe(p,nid));
  const varia=L=>L.some(x=>JSON.stringify(x)!==JSON.stringify(L[0]));
  const usaK=nid=>ks[nid].some(k=>k!==1)||kDe(medio,nid)!==1;
  if(!quieto){for(const [nid] of ARBOL){
      if(varia(tfs[nid].map(t=>t.map(r1))))css.push(kf(id,'b-'+nid,tfs[nid].map(t=>tfTxt(t,1))));
      if(usaK(nid)&&varia(ks[nid].map(r1)))css.push(kf(id,'k-'+nid,ks[nid].map(k=>`scale(${r1(k)},1)`)))}}
  const enl=def.enlaces||[];
  if(!quieto)enl.forEach((L,i)=>{const t=pts.map(pt=>tfEnlace(pt,L));if(varia(t.map(x=>x.map(r1))))css.push(kf(id,'e-'+i,t.map(x=>`translate(${r1(x[0])}px,${r1(x[1])}px) rotate(${r1(x[2])}deg) scale(${r1(x[3])},1)`)))});
  const extras=def.extras||[];
  if(!quieto)extras.forEach((X,i)=>{const t=poses.map((p,j)=>X.tf(p,pts[j]));if(varia(t))css.push(kf(id,'x-'+i,t.map(s=>s.replace(/translate\(([-\d.]+) ([-\d.]+)\)/g,'translate($1px,$2px)').replace(/rotate\(([-\d.]+)\)/g,'rotate($1deg)').replace(/scale\(([-\d.]+) ([-\d.]+)\)/g,'scale($1,$2)'))))});
  function kf(id,cl,frames){const nm=id+'-'+cl;let s=`@keyframes ${nm}{`;let last='';
    muestras.forEach(([t],i)=>{if(frames[i]===last&&i<muestras.length-1&&frames[i+1]===last)return;s+=`${r1(t*100)}%{transform:${frames[i]}}`;last=frames[i]});
    s+='}';return s+`#${id} .${cl}{animation:${nm} ${T}s linear infinite}`}
  // dibujo de un subárbol para una capa: solo los huesos de «quiero» llevan contenido
  const v=medio.v==='fr'?'fr':'lat';
  function arbol(nid,quiero,contenido){const hijos=ARBOL.filter(x=>x[1]===nid).map(x=>x[0]);
    const dentro=hijos.map(h=>sub(h,quiero,contenido)).filter(Boolean).join('');
    const mio=quiero.includes(nid)?contenido(nid):'';
    if(!mio&&!dentro)return '';
    const t=tfTxt(tfNodo(medio,nid,rel(medio,nid)),0),k=kDe(medio,nid);
    const forma=mio?(usaK(nid)?`<g class="k-${nid}" transform="scale(${r1(k)} 1)">${mio}</g>`:mio):'';
    // en la mano, el equipo (hijo) va detrás del puño
    return `<g class="b-${nid}" transform="${t}">${/^h[NF]$/.test(nid)?dentro+forma:forma+dentro}</g>`}
  const sub=(nid,q,c)=>{const tiene=(n)=>q.includes(n)||ARBOL.some(x=>x[1]===n&&tiene(x[0]));return tiene(nid)?arbol(nid,q,c):''};
  const oculto=new Set(def.ocultar||[]);
  const cuerpo=nid=>{if(oculto.has(nid))return '';
    if(nid[0]==='x')return def.mano&&def.mano[nid[1]]?EQ[def.mano[nid[1]]]||'':'';
    const f=forma(v,nid);return f?`<g class="ab-o">${f}</g><g class="ab-f">${f}</g>`:''};
  const capa=(c)=>{
    if(c==='fondo'||c==='frente')return typeof def[c]==='function'?def[c](ptm,medio):(def[c]||'');
    if(c==='enlaces')return enl.map((L,i)=>{const x=tfEnlace(ptm,L);return `<g class="e-${i}" transform="translate(${r1(x[0])} ${r1(x[1])}) rotate(${r1(x[2])}) scale(${r1(x[3])} 1)"><path class="${CL_ENL[L.t||'cable']}" d="M0 0H1" vector-effect="non-scaling-stroke"/></g>`}).join('')
      +extras.map((X,i)=>`<g class="x-${i}" transform="${X.tf(medio,ptm)}">${X.svg}</g>`).join('');
    if(c==='tras'||c==='frente0'||c==='trasF'){const m=def[{tras:'pegadoTras',frente0:'pegado',trasF:'pegadoF'}[c]]||{};const ids=Object.keys(m);if(!ids.length)return '';
      return sub('r',ids,n=>m[n]||'')}
    const g=GRUPOS[c];if(!g)return '';
    return sub('r',g.filter(n=>!oculto.has(n)),cuerpo)};
  const capas=(def.capas||(v==='fr'?CAPAS_FR:CAPAS_LAT)).map(c=>{const h=capa(c);if(!h)return '';return ESQ[c]&&v==='lat'?`<g class="lejos">${h}</g>`:h}).join('');
  const zoom=def.zoom&&def.zoom!==1?`translate(60 ${def.zoomY||50}) scale(${def.zoom}) translate(-60 -${def.zoomY||50})`:'';
  const sueloL=def.sinSuelo?'':`<path class="eq-s" d="M4 ${SUELO+.8}H116"/>`;
  return {id,css:quieto?'':css.join(''),
    html:`<svg ${quieto?'':`id="${id}" `}class="anim${o.clase?' '+o.clase:''}" viewBox="0 0 120 100" aria-hidden="true">${quieto?'':`<style>${css.join('')}</style>`}<g${zoom?` transform="${zoom}"`:''}>${sueloL}${capas}</g></svg>`}}

return {fk,ik,brazo,pierna,llevar,base,mix,add,dist,ang,M,svg,EQ,delante,detras,arriba,abajo,
  L:{LL,LC,LU,LF,LT,LS,AH,SUELO}};
})();

/* ======================= los ejercicios ======================= */
(()=>{
const A=ANIM,{fk,brazo,pierna,llevar,base,mix,add,M,delante,detras,arriba,abajo}=A,{SUELO,LL,LC,LU,LF,LT,LS,AH}=A.L;
const n1=v=>Math.round(v*10)/10;
const g=(cl,s)=>`<g class="${cl}">${s}</g>`;
const rect=(x,y,w,h,rx=1.6)=>`<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${rx}"/>`;
const linea=(...p)=>`<path d="M${p.map(q=>n1(q[0])+' '+n1(q[1])).join('L')}"/>`;
// banco plano: tablero de x0 a x1 con la cara de arriba en y
const banco=(x0,x1,y)=>g('eq-b',rect(x0,y,x1-x0,4.6,2))+g('eq-t',linea([x0+5,y+4.6],[x0+5,SUELO])+linea([x1-5,y+4.6],[x1-5,SUELO]));
// cojín (respaldo, apoyo) desde A en dirección a, largo l; la cara de apoyo es la línea A→…; grosor gr hacia el lado +90° de a (negativo: −90°)
const cojin=(A,a,l,gr=4.4)=>g('eq-b',`<rect x="0" y="${Math.min(0,gr)}" width="${n1(l)}" height="${Math.abs(gr)}" rx="2" transform="translate(${n1(A[0])} ${n1(A[1])}) rotate(${n1(a)})"/>`);
// cojín sobre la espalda / el frente del tronco de la pose (de la pelvis hacia los hombros), con margen m antes y largo l
const respaldo=(pt,lado,l,m=4,sep=6.2)=>{const a=pt.A.c,s=lado==='atras'?-1:1,A0=add(add(pt.P,a+90*s,sep),a,-m);return cojin(A0,a,l,4.4*s)};
const pata=(x,y)=>g('eq-t',linea([x,y],[x,SUELO]));
const polea=(x,y)=>g('eq-m',`<circle cx="${n1(x)}" cy="${n1(y)}" r="2.6"/>`);
const torre=(x,y)=>g('eq-t',linea([x,y-4],[x,SUELO]))+polea(x,y);
const barraFija=(x0,x1,y)=>g('eq-t',linea([x0,y],[x1,y])+linea([x0,y],[x0,SUELO])+linea([x1,y],[x1,SUELO]));
// pila de pesas que sube cuando el cable se alarga (la polea multiplica: sube la mitad)
const pila=(x,i,ref)=>({svg:g('eq-p',rect(x-4,SUELO-14,8,13,1)+rect(x-4,SUELO-20,8,5,1)),tf:(p,pt)=>`translate(0 ${n1(-Math.max(0,cableLargo(pt,ref)-ref.min)*.5)})`});
function cableLargo(pt,ref){const B=pt[ref.a]||ref.a;return Math.hypot(B[0]-ref.de[0],B[1]-ref.de[1])}
const LISTA=[];
function def(id,n,gr,eq,tips,o){LISTA.push(Object.assign({id,n,g:gr,eq,tips},o))}
const B=()=>base('lat'),BF=()=>base('fr');
const sim=(p)=>{p.uF=p.uN;p.fF=p.fN;if(p.hN!=null)p.hF=p.hN;if(p.xN!=null)p.xF=p.xN;if(p.k.uN!=null)p.k.uF=p.k.uN;if(p.k.fN!=null)p.k.fF=p.k.fN;return p};
const espejo=(p)=>{p.uF=M(p.uN);p.fF=M(p.fN);if(p.hN!=null)p.hF=M(p.hN);if(p.xN!=null)p.xF=M(p.xN);if(p.k.uN!=null)p.k.uF=p.k.uN;if(p.k.fN!=null)p.k.fF=p.k.fN;return p};
const piernasFr=(p,ab=3)=>{p.tN=90-ab;p.tF=M(p.tN);p.sN=90;p.sF=90;return p};
// sentado de frente: muslos hacia ti (acortados), piernas abajo
const sentadoFr=(p,ab=10)=>{p.k.tN=p.k.tF=.42;p.tN=90-ab;p.tF=M(p.tN);p.sN=p.sF=90;return p};

/* ---------------- BÍCEPS ---------------- */
function curl(postura,impl){
  const mano={mancuerna:{N:'disco',F:'disco'},martillo:{N:'pesa',F:'pesa'},barra:{N:'eje',F:'barra'},polea:{N:'eje',F:'eje'},cuerda:{N:'cuerda',F:'cuerda'},una:{N:'disco'}}[impl];
  const o={mano};let fondo='';const enl=[];
  if(postura==='pie'||postura==='polea'){o.pose=u=>{const p=B();p.x=54;p.uN=mix(93,80,u);p.fN=mix(84,-52,u);if(impl==='cuerda'||impl==='polea'){p.l=p.c=-87}return sim(p)}}
  if(postura==='inclinado'){const seat=[52,68];
    o.pose=u=>{const p=B();p.l=p.c=-128;p.h=-110;p.x=52;p.y=63;pierna(p,'N',[84,91],delante);pierna(p,'F',[80,91],delante);p.uN=91;p.fN=mix(86,-38,u);return sim(p)};
    const pt=fk(o.pose(0));fondo=respaldo(pt,'atras',40)+banco(36,70,66.5)+pata(50,70);}
  if(postura==='predicador'){o.pose=u=>{const p=B();p.l=-84;p.c=-74;p.x=46;p.y=62;pierna(p,'N',[66,91],delante);pierna(p,'F',[62,91],delante);p.uN=46;p.fN=mix(52,-82,u);return sim(p)};
    const pt=fk(o.pose(0));fondo=banco(30,58,66.5);o.pegado={uN:cojin([2,8],0,LU+1,4.5).replace('eq-b','eq-b apoyo')};
    o.fondoExtra=g('eq-t',linea(add(pt.EN,90,8),[pt.EN[0]+2,SUELO]))}
  if(postura==='concentrado'){o.pose=u=>{const p=B();p.l=-62;p.c=-38;p.h=-20;p.x=42;p.y=63;pierna(p,'N',[72,91],delante);pierna(p,'F',[66,91],delante);
      p.uN=94;p.fN=mix(92,-58,u);p.uF=60;p.fF=82;return p};fondo=banco(24,56,67)}
  if(postura==='arana'){o.pose=u=>{const p=B();p.l=p.c=-42;p.h=-30;p.x=42;p.y=58;pierna(p,'N',[22,91],delante);pierna(p,'F',[19,91],delante);p.uN=90;p.fN=mix(88,-40,u);return sim(p)};
    const pt=fk(o.pose(0));fondo=respaldo(pt,'frente',26,3,8.4)+g('eq-t',linea(add(pt.W,48,12),[pt.W[0]+14,SUELO]))}
  if(postura==='bayes'){o.pose=u=>{const p=B();p.l=-86;p.c=-82;p.x=58;pierna(p,'N',[70,91],delante);pierna(p,'F',[46,91],delante);p.uN=112;p.fN=mix(116,-10,u);p.uF=80;p.fF=70;return p};
    o.mano={N:'asa'};fondo=torre(10,84);enl.push({de:[10,84],a:'GN'})}
  if(postura==='polea'){fondo=torre(104,84);enl.push({de:[104,84],a:'GN'})}
  o.fondo=fondo;o.enlaces=enl;return o}
const TC=['Codos quietos pegados al cuerpo','Sube sin balancear el tronco','Baja en 2–3 s hasta estirar el brazo'];
def('curl_mancuernas','Curl con mancuernas','biceps','mancuernas',TC,curl('pie','mancuerna'));
def('curl_barra','Curl con barra','biceps','una barra (recta o Z) con discos',['Agarre al ancho de hombros, palmas arriba','Codos quietos; no eches la cadera adelante','Baja controlado hasta casi estirar'],curl('pie','barra'));
def('curl_martillo','Curl martillo','biceps','mancuernas',['Palmas mirándose todo el recorrido','Codos quietos junto al cuerpo','Sin impulso: 2 s para bajar'],curl('pie','martillo'));
def('curl_inclinado','Curl inclinado con mancuernas','biceps','banco inclinable y mancuernas',['Respaldo a 45–60°, brazos colgando atrás','No adelantes los codos al subir','Estira del todo abajo, sin rebote'],curl('inclinado','mancuerna'));
def('curl_predicador','Curl predicador','biceps','banco predicador y barra Z (o mancuerna)',['Axila pegada al borde del apoyo','Baja lento hasta casi estirar, sin rebotar','No despegues los codos del cojín'],curl('predicador','barra'));
def('curl_concentrado','Curl concentrado','biceps','banco y una mancuerna',['Codo apoyado en la cara interna del muslo','Sube girando el meñique hacia arriba','Baja hasta estirar sin soltar la tensión'],curl('concentrado','una'));
def('curl_polea','Curl en polea','biceps','polea baja con barra corta',['Codos pegados, cuerpo quieto','Aprieta arriba un instante','El cable tira siempre: baja despacio'],curl('polea','polea'));
def('curl_cuerda','Curl martillo con cuerda','biceps','polea baja con cuerda',['Palmas mirándose, codos quietos','Separa un poco la cuerda arriba','Baja controlado'],curl('polea','cuerda'));
def('curl_arana','Curl araña','biceps','banco inclinado y mancuernas (o barra Z)',['Pecho apoyado en el respaldo','Brazos colgando en vertical','Aprieta arriba sin mover los codos'],curl('arana','mancuerna'));
def('curl_bayes','Curl Bayesian en polea','biceps','polea baja con agarre',['De espaldas a la polea, brazo atrás','El codo no se mueve hacia delante','Estira del todo atrás en cada rep'],curl('bayes'));

/* ---------------- PECHO (press) ---------------- */
function pressBanco(incl,impl){
  // incl: grados de respaldo (0 plano, + inclinado, − declinado)
  const mano=impl==='barra'?{N:'eje',F:'barra'}:{N:'disco',F:'disco'},o={mano};
  const tor=180+incl;
  o.pose=u=>{const p=B();p.l=p.c=p.h=tor;p.x=incl>0?64:incl<0?70:76;p.y=incl>0?66:incl<0?60:60;
    if(incl<0){p.y=56}
    const pt=fk(p),S=pt.SN,fr=add(S,tor+90,1);
    const G0=add(add(S,tor+90,9.5),tor+180,-3),G1=[S[0]+(incl>0?3:2),S[1]-29.5];
    p.k.uN=mix(.62,1,u);brazo(p,'N',[mix(G0[0],G1[0],u),mix(G0[1],G1[1],u)],abajo);
    if(incl<0){pierna(p,'N',[98,74],abajo);pierna(p,'F',[96,74],abajo);p.pN=p.pF=-20}
    else{pierna(p,'N',[98,91],arriba);pierna(p,'F',[95,91],arriba)}
    return sim(p)};
  const pt=fk(o.pose(0));
  if(incl===0)o.fondo=banco(22,90,66);
  else if(incl>0){o.fondo=respaldo(pt,'atras',36,6)+banco(60,90,70.5)+g('eq-t',linea(add(pt.P,90,8),[pt.P[0]-6,SUELO]))}
  else{o.fondo=respaldo(pt,'atras',44,8)+g('eq-t',linea(add(pt.P,90,9),[pt.P[0],SUELO])+linea([40,72],[40,SUELO]))+g('eq-p',`<circle cx="99" cy="70" r="3.4"/>`)}
  return o}
const TP=['Omóplatos atrás y abajo, pies firmes','Baja controlado hasta rozar el pecho','Empuja sin rebotar ni despegar la cadera'];
def('press_banca','Press banca con barra','pecho','banco plano, barra y discos (mejor en rack)',TP,pressBanco(0,'barra'));
def('press_mancuernas','Press con mancuernas en banco plano','pecho','banco plano y mancuernas',['Mancuernas a la altura del pecho, codos a 45°','Baja hasta sentir el estiramiento','Sube juntándolas sin chocar'],pressBanco(0,'mancuerna'));
def('press_inclinado_mancuernas','Press inclinado con mancuernas','pecho','banco inclinable (30–45°) y mancuernas',['Respaldo a 30–45°, omóplatos atrás','Baja en 3 s hasta la parte alta del pecho','Empuja hacia arriba sin bloquear de golpe'],pressBanco(35,'mancuerna'));
def('press_inclinado_barra','Press inclinado con barra','pecho','banco inclinable y barra con discos',['Baja la barra a la parte alta del pecho','Codos algo cerrados, no a 90°','Sin rebote abajo'],pressBanco(35,'barra'));
def('press_declinado','Press declinado','pecho','banco declinable y barra',['Piernas bien sujetas en los rodillos','Baja a la parte baja del pecho','Pide ayuda o usa topes con mucho peso'],pressBanco(-18,'barra'));
def('press_cerrado','Press cerrado','triceps','banco plano y barra',['Manos al ancho de hombros, no más juntas','Codos pegados al cuerpo al bajar','Baja a la parte baja del pecho'],pressBanco(0,'barra'));

/* ---------------- HOMBROS ---------------- */
def('elev_laterales','Elevaciones laterales','hombros','mancuernas',['Sube hasta la altura de los hombros, no más','Codos un poco flexionados y por delante','Sin impulso: baja en 2 s'],
  {v:'fr',mano:{N:'disco',F:'disco'},pose:u=>{const p=BF();p.x=60;piernasFr(p);p.uN=mix(80,-4,u);p.fN=p.uN+14;return espejo(p)}});

/* ---------------- ESPALDA ---------------- */
def('jalon','Jalón al pecho','espalda','máquina de jalón (polea alta) con barra larga',['Pecho arriba y algo inclinado atrás','Lleva los codos abajo y atrás, a los costados','Sube lento hasta estirar los brazos'],
  {v:'fr',mano:{N:'mango',F:'mango'},zoom:.94,zoomY:70,pose:u=>{const p=BF();p.x=60;p.y=60;sentadoFr(p);const pt=fk(p);
    const G=[mix(pt.SN[0]+13,pt.SN[0]+11,u),mix(pt.SN[1]-26,pt.SN[1]+6.5,u)];brazo(p,'N',G,J=>J[0]+.3*J[1]);return espejo(p)},
   enlaces:[{de:'GF',a:'GN',t:'barra',ext:5},{de:[60,2],a:'mid:GN,GF'}],
   fondo:g('eq-t',linea([30,2],[90,2]))+polea(60,2)+banco(40,80,66)+g('eq-b',rect(44,70.5,32,4.4,2))});

/* ---------------- PIERNAS ---------------- */
function sentadilla(impl){const mano={barra:{N:'eje',F:'eje'},goblet:{N:'colgada',F:'colgada'}}[impl]||{};
  const o={mano};
  o.pose=u=>{const p=B();const A0=[60,91];
    const prof=mix(1,0,u);   // u=0 abajo
    p.l=mix(-90,-62,prof);p.c=mix(-88,impl==='goblet'?-66:-52,prof);
    p.x=mix(58,42,prof);p.y=mix(50.5,72,prof);
    pierna(p,'N',A0,delante);pierna(p,'F',[A0[0]-2,91],delante);
    const pt=fk(p);
    if(impl==='barra'){const Bp=add(add(pt.SN,p.c,1),p.c-90,4.2);brazo(p,'N',Bp,detras);p.ex.barra=Bp}
    if(impl==='goblet'){const G=add(add(pt.SN,p.c+90,8),p.c+180,5);brazo(p,'N',G,abajo);p.xN=90}
    return sim(p)};
  if(impl==='barra')o.pegadoF={c:g('eq-m',`<circle cx="${LC}" cy="-4.2" r="9"/>`)+g('eq-h',`<circle cx="${LC}" cy="-4.2" r="2.2"/>`)};
  return o}
def('sentadilla_barra','Sentadilla con barra','piernas','rack, barra y discos',['Barra sobre los trapecios, pies al ancho de hombros','Baja con la cadera atrás y las rodillas en línea con los pies','Espalda neutra; sube empujando el suelo'],sentadilla('barra'));
def('sentadilla_goblet','Sentadilla goblet','piernas','una mancuerna o pesa rusa',['Pesa pegada al pecho, codos abajo','Baja entre las rodillas con el tronco erguido','Talones apoyados todo el tiempo'],sentadilla('goblet'));

/* ---------------- ABDOMEN ---------------- */
def('crunch_suelo','Crunch en el suelo','abdominales','una colchoneta',['Enrolla la columna: costillas hacia la pelvis','La zona lumbar no se despega','Exhala al subir; el cuello relajado'],
  {pose:u=>{const p=B();p.l=mix(180,190,u);p.c=mix(180,222,u);p.h=p.c+mix(0,8,u);p.x=72;p.y=87.5;
    pierna(p,'N',[94,90.5],arriba);pierna(p,'F',[92,90.5],arriba);
    p.uN=p.c+150;p.fN=p.uN+170;return sim(p)},fondo:g('eq-b',rect(20,91.5,84,2.6,1.3))});

/* ---------------- TRÍCEPS ---------------- */
function pushdown(impl){return {mano:impl==='cuerda'?{N:'cuerda',F:'cuerda'}:{N:'eje',F:'eje'},
  pose:u=>{const p=B();p.x=56;p.l=-84;p.c=-80;p.h=-86;pierna(p,'N',[62,91],delante);pierna(p,'F',[52,91],delante);p.uN=86;p.fN=mix(-38,86,u);if(impl==='cuerda')p.xN=p.fN-0;return sim(p)},
  fondo:torre(100,8)+'',enlaces:[{de:[100,8],a:'GN'}]}}
def('pushdown_cuerda','Pushdown con cuerda','triceps','polea alta con cuerda',['Codos pegados a los costados, quietos','Abajo, separa la cuerda y aprieta','Sube solo hasta que el antebrazo pase la horizontal'],pushdown('cuerda'));

/* ---------------- más TRÍCEPS ---------------- */
def('pushdown_barra','Pushdown con barra','triceps','polea alta con barra recta o V',['Codos pegados y quietos','Baja hasta estirar del todo y aprieta','Sube despacio hasta 90° o algo más'],pushdown('barra'));
function sobreCabeza(impl){const o={mano:impl==='polea'?{N:'cuerda',F:'cuerda'}:{N:'colgada',F:'colgada'},
  pose:u=>{const p=B();p.x=impl==='polea'?60:56;p.l=-90;p.c=impl==='polea'?-80:-88;pierna(p,'N',[p.x+(impl==='polea'?10:3),91],delante);pierna(p,'F',[p.x-(impl==='polea'?10:3),91],delante);
    p.uN=-96;p.fN=mix(-248,-94,u);if(impl!=='polea')p.xN=90;return sim(p)}};
  if(impl==='polea'){o.fondo=g('eq-t',linea([12,84],[12,SUELO]))+polea(12,84);o.enlaces=[{de:[12,84],a:'GN'}]}
  return o}
def('sobre_cabeza','Extensión sobre la cabeza','triceps','una mancuerna (o barra Z)',['Codos apuntando al techo, cerca de la cabeza','Baja detrás de la nuca hasta estirar bien','Sube sin abrir los codos ni arquear la espalda'],sobreCabeza('mancuerna'));
def('sobre_cabeza_polea','Extensión sobre la cabeza en polea','triceps','polea baja con cuerda',['De espaldas a la polea, codos arriba','Estira detrás de la cabeza sin abrir codos','Extiende del todo y vuelve lento'],sobreCabeza('polea'));
const tumbado=(p,x=76)=>{p.l=p.c=p.h=180;p.x=x;p.y=60;pierna(p,'N',[x+22,91],arriba);pierna(p,'F',[x+19,91],arriba);return p};
def('frances','Press francés','triceps','banco plano y barra Z',['Brazos casi verticales, codos quietos','Baja la barra hacia la frente o detrás de la cabeza','Extiende sin abrir los codos'],
  {mano:{N:'eje',F:'barra'},pose:u=>{const p=tumbado(B());p.uN=-102;p.fN=mix(-228,-96,u);return sim(p)},fondo:banco(22,90,66)});
// apoyo en banco: rodilla y mano del lado lejano encima, pierna cercana en el suelo
function apoyoBanco(p){p.l=p.c=-6;p.h=-4;p.x=40;p.y=52.5;const pt=fk(p);
  brazo(p,'F',[pt.SF[0]+2,64.5],detras);p.tF=76;p.sF=182;p.pF=150;pierna(p,'N',[p.x+8,91],delante);return p}
def('patada','Patada de tríceps con mancuerna','triceps','banco plano y una mancuerna',['Brazo pegado al cuerpo y paralelo al suelo','Estira el codo hasta el final y aprieta','Solo se mueve el antebrazo'],
  {mano:{N:'disco'},pose:u=>{const p=apoyoBanco(B());p.uN=174;p.fN=mix(92,174,u);return p},fondo:banco(22,82,66)});
def('patada_polea','Patada en polea','triceps','polea baja con agarre',['Tronco inclinado, brazo pegado al costado','Estira el codo atrás del todo','Vuelve sin mover el brazo'],
  {mano:{N:'asa'},pose:u=>{const p=B();p.x=50;p.y=56;p.l=-40;p.c=-34;p.h=-20;pierna(p,'N',[60,91],delante);pierna(p,'F',[42,91],delante);
    const pt=fk(p);brazo(p,'F',add(pt.KN,-60,4),abajo);p.uN=158;p.fN=mix(80,158,u);return p},fondo:torre(104,86),enlaces:[{de:[104,86],a:'GN'}]});
function fondos(tor){const G=[60,49];return {mano:{},capas:['fondo','brazoF','piernaF','torso','piernaN','brazoN','frente'],
  pose:u=>{const p=B();p.l=tor;p.c=tor;p.h=tor<-80?-90:-60;p.tN=p.tF=100;p.sN=p.sF=196;p.pN=p.pF=120;
    const S=[mix(G[0]+(tor<-80?-1:3),G[0]+1,u),mix(G[1]-8,G[1]-29.3,u)];llevar(p,'SN',S);brazo(p,'N',G,detras);return sim(p)},
  fondo:g('eq-t',linea([G[0]-24,G[1]+2.4],[G[0]+20,G[1]+2.4])+linea([G[0]-20,G[1]+2.4],[G[0]-20,SUELO])+linea([G[0]+16,G[1]+2.4],[G[0]+16,SUELO]))}}
def('fondos_triceps','Fondos en paralelas','triceps','paralelas (o dos bancos)',['Tronco vertical y codos hacia atrás','Baja hasta que el brazo quede paralelo al suelo','Sube hasta estirar sin encoger los hombros'],fondos(-88));
def('fondos_pecho','Fondos con torso inclinado','pecho','paralelas',['Inclina el tronco hacia delante','Baja hasta sentir el estiramiento en el pecho','Codos algo abiertos; sin rebotar abajo'],fondos(-64));
def('fondos_maquina','Fondos en máquina','triceps','máquina de fondos sentado',['Espalda contra el respaldo','Empuja hacia abajo hasta estirar los codos','Sube lento sin dejar que los hombros se adelanten'],
  {mano:{N:'mango',F:'mango'},pose:u=>{const p=B();p.x=46;p.y=63;p.l=p.c=-92;pierna(p,'N',[72,91],delante);pierna(p,'F',[69,91],delante);const S=fk(p).SN;
    brazo(p,'N',[mix(S[0]-3,S[0]+2,u),mix(S[1]+10,S[1]+28.5,u)],detras);return sim(p)},
   fondo:g('eq-b',rect(30,68.5,30,4.6,2))+g('eq-t',linea([36,73],[36,SUELO]))+cojin([37,64],-92,32,-4.4),enlaces:[{de:[16,66],a:'GN',t:'palanca'}]});
function flexion(tipo){const A0=[24,85.5],o={mano:{}};
  o.pose=u=>{const p=B();p.pN=p.pF=70;
    if(tipo==='pica'){const P=[mix(55,50,u),mix(55,46,u)];p.x=P[0];p.y=P[1];p.l=p.c=mix(64,48,u);p.h=p.c+10;pierna(p,'N',[30,85.5],detras);pierna(p,'F',[29,85.5],detras);
      brazo(p,'N',[78,91.6],J=>-J[0]-J[1]);return sim(p)}
    const th=mix(-2,-21.5,u);p.l=p.c=p.h=th;p.tN=p.tF=p.sN=p.sF=th+180;const H=add(A0,th,LT+LS);p.x=H[0];p.y=H[1];
    brazo(p,'N',[24+65*Math.cos(21.5*Math.PI/180)+(tipo==='cerrada'?-1:0),91.6],J=>-J[0]-J[1]);return sim(p)};
  if(tipo==='lastrada')o.pegado={c:g('eq-m',rect(1,-9.6,12,2.6,1))};
  return o}
def('flexiones','Flexiones','pecho','solo el suelo',['Cuerpo recto de talones a cabeza','Manos algo más anchas que los hombros','Baja hasta casi tocar el suelo con el pecho'],flexion('normal'));
def('flexiones_lastradas','Flexiones lastradas','pecho','un disco sobre la espalda (o chaleco)',['Que alguien te coloque el disco entre los omóplatos','Cuerpo recto, abdomen firme','Baja controlado hasta casi tocar el suelo'],flexion('lastrada'));
def('flexiones_cerradas','Flexiones cerradas (diamante)','triceps','solo el suelo',['Manos juntas bajo el pecho','Codos pegados al cuerpo al bajar','Cuerpo recto; si no puedes, apoya rodillas'],flexion('cerrada'));
def('flexiones_pica','Flexiones pica','hombros','solo el suelo',['Cadera alta: el cuerpo forma una V invertida','Baja la cabeza hacia delante de las manos','Empuja de vuelta sin bajar la cadera'],flexion('pica'));

/* ---------------- más PECHO ---------------- */
def('press_maquina','Press en máquina','pecho','máquina de press de pecho',['Asiento con los agarres a la altura del pecho','Empuja sin bloquear los codos de golpe','Vuelve despacio hasta sentir el estiramiento'],
  {mano:{N:'mango',F:'mango'},pose:u=>{const p=B();p.x=40;p.y=63;p.l=p.c=-94;pierna(p,'N',[68,91],delante);pierna(p,'F',[65,91],delante);const S=fk(p).SN;
    p.k.uN=mix(.6,1,u);brazo(p,'N',[mix(S[0]+7,S[0]+28.5,u),S[1]+4],abajo);return sim(p)},
   fondo:(pt)=>respaldo(pt,'atras',30,2)+g('eq-b',rect(28,68.5,26,4.6,2))+g('eq-t',linea([34,73],[34,SUELO])),enlaces:[{de:[50,8],a:'GN',t:'palanca'}]});
// tumbado visto desde los pies (para aperturas): tronco en corte, cabeza detrás
const desdePies=()=>g('eq-b',rect(48,68,24,5,1.6))+g('eq-t',linea([60,73],[60,SUELO]))+g('ab-o',`<circle cx="60" cy="54.5" r="5.3"/><ellipse cx="60" cy="62" rx="13" ry="6.4"/>`)+g('ab-f',`<circle cx="60" cy="54.5" r="5.3"/><ellipse cx="60" cy="62" rx="13" ry="6.4"/>`);
def('aperturas_mancuernas','Aperturas con mancuernas','pecho','banco plano y mancuernas',['Codos algo flexionados y fijos','Abre en arco hasta sentir el estiramiento','Cierra «abrazando un árbol», sin chocar las pesas'],
  {v:'fr',mano:{N:'disco',F:'disco'},ocultar:['r','c','h','tN','sN','pN','tF','sF','pF'],vista:'desde los pies',
   pose:u=>{const p=BF();p.x=60;p.y=61;p.k.r=0;p.k.c=0;const th=mix(100,8,u);p.uN=-90+th;p.fN=p.uN-20;return espejo(p)},fondo:desdePies()});
def('cruces_polea','Cruces en polea','pecho','dos poleas altas con agarres',['Un paso adelante, tronco algo inclinado','Codos suaves y fijos; junta las manos abajo','Vuelve lento hasta abrir el pecho'],
  {v:'fr',mano:{N:'asa',F:'asa'},pose:u=>{const p=BF();p.x=60;piernasFr(p,4);const S=fk(p).SN;p.k.uN=p.k.fN=mix(1,.72,u);
    brazo(p,'N',[mix(S[0]+24,62,u),mix(S[1]-8,S[1]+22,u)],J=>J[0]-J[1]*.4);return espejo(p)},
   fondo:g('eq-t',linea([6,10],[6,SUELO])+linea([114,10],[114,SUELO]))+polea(8,14)+polea(112,14),enlaces:[{de:[112,14],a:'GN'},{de:[8,14],a:'GF'}]});
const marcoFr=()=>g('eq-t',linea([38,6],[82,6])+linea([60,6],[60,20]))+g('eq-b',rect(44,66,32,4.6,2))+g('eq-t',linea([60,70.6],[60,SUELO]));
def('pec_deck','Pec deck','pecho','máquina de aperturas (pec deck)',['Codos a la altura de los hombros','Junta los brazos delante y aprieta un segundo','Abre despacio hasta notar el estiramiento'],
  {v:'fr',mano:{N:'almoN',F:'almoF'},pose:u=>{const p=BF();p.x=60;p.y=60;sentadoFr(p);p.uN=0;p.k.uN=mix(1,-.3,u);p.fN=-90;return espejo(p)},fondo:marcoFr()});

/* ---------------- más ESPALDA ---------------- */
def('jalon_neutro','Jalón con agarre neutro','espalda','polea alta con agarre en V o neutro',['Inclínate un poco atrás, pecho arriba','Lleva el agarre a la parte alta del pecho','Sube lento hasta estirar del todo'],
  {mano:{N:'asa',F:'asa'},pose:u=>{const p=B();p.x=48;p.y=63;p.l=-96;p.c=-102;pierna(p,'N',[74,91],delante);pierna(p,'F',[71,91],delante);const S=fk(p).SN;
    brazo(p,'N',[mix(S[0]+5,S[0]+9,u),mix(S[1]-29,S[1]+5,u)],J=>J[1]-J[0]*.4);return sim(p)},
   fondo:pt=>g('eq-t',linea([40,3],[64,3]))+polea(52,3)+g('eq-b',rect(32,68.5,30,4.6,2))+g('eq-t',linea([42,73],[42,SUELO]))+g('eq-p',`<circle cx="${n1(pt.KN[0]-2)}" cy="${n1(pt.KN[1]-7.6)}" r="3.4"/>`),enlaces:[{de:[52,3],a:'GN'}]});
def('dominadas','Dominadas','espalda','barra de dominadas',['Agarre algo más ancho que los hombros','Sube llevando el pecho a la barra, sin balanceo','Baja del todo hasta estirar los brazos'],
  {v:'fr',mano:{N:'mango',F:'mango'},zoom:.9,zoomY:12,pose:u=>{const p=BF();p.tN=88;p.tF=92;p.k.sN=p.k.sF=.5;p.sN=95;p.sF=85;
    llevar(p,'SN',[68,mix(39.8,17,u)]);brazo(p,'N',[79,12],J=>J[0]);brazo(p,'F',[41,12],J=>-J[0]);return p},
   fondo:g('eq-t',linea([16,12],[104,12])+linea([18,12],[18,SUELO])+linea([102,12],[102,SUELO]))});
def('remo_invertido','Remo invertido','espalda','una barra baja (en rack o Smith)',['Cuerpo recto de talones a hombros','Lleva el pecho a la barra','Baja controlado hasta estirar los brazos'],
  {mano:{N:'mango',F:'mango'},pose:u=>{const p=B();const A0=[100,91],al=mix(6,24,u);p.l=p.c=p.h=180+al;p.tN=p.tF=p.sN=p.sF=al;p.pN=p.pF=al-80;
    const H=add(A0,180+al,LT+LS);p.x=H[0];p.y=H[1];brazo(p,'N',[43.6,58],abajo);return sim(p)},
   fondo:g('eq-t',linea([47,58],[47,SUELO])),frente:g('eq-m',`<circle cx="43.6" cy="58" r="2.2"/>`)});
def('remo_mancuerna','Remo con mancuerna','espalda','banco plano y una mancuerna',['Espalda recta, paralela al suelo','Lleva el codo hacia la cadera','Pausa arriba y baja hasta estirar'],
  {mano:{N:'disco'},pose:u=>{const p=apoyoBanco(B());const S=fk(p).SN;brazo(p,'N',[mix(S[0]+1,S[0]-7,u),mix(S[1]+28.5,S[1]+7,u)],arriba);return p},fondo:banco(22,82,66)});
function remoInclinado(impl){const o={mano:impl==='T'?{N:'mango',F:'barra'}:{N:'eje',F:'barra'}};
  o.pose=u=>{const p=B();p.x=46;p.y=56;p.l=-30;p.c=-28;p.h=-10;pierna(p,'N',[56,91],delante);pierna(p,'F',[54,91],delante);
    const pt=fk(p),S=pt.SN,V=add(pt.W,p.c+90,7);brazo(p,'N',[mix(S[0]+.5,V[0]+2,u),mix(S[1]+29,V[1]+2,u)],arriba);return sim(p)};
  if(impl==='T')o.enlaces=[{de:[10,92],a:'GN',t:'palanca'}];return o}
def('remo_barra','Remo con barra','espalda','barra con discos',['Cadera atrás, espalda recta a unos 45°','Lleva la barra al ombligo','Baja controlado sin perder la postura'],remoInclinado('barra'));
def('remo_t','Remo en T','espalda','barra T (o barra en esquina) con discos',['Pecho fuera, espalda neutra','Lleva el agarre al abdomen','Baja hasta estirar sin encorvarte'],remoInclinado('T'));
def('remo_polea','Remo en polea sentado','espalda','polea baja con agarre en V',['Pecho arriba, rodillas algo flexionadas','Lleva el agarre al abdomen y junta omóplatos','Estira adelante sin redondear la espalda'],
  {mano:{N:'asa',F:'asa'},pose:u=>{const p=B();p.x=40;p.y=71.5;p.l=mix(-76,-92,u);p.c=mix(-70,-94,u);p.h=p.c;pierna(p,'N',[80,79],arriba);pierna(p,'F',[78,79],arriba);p.pN=p.pF=-72;
    const S=fk(p).SN;brazo(p,'N',[mix(S[0]+29,S[0]+7,u),mix(S[1]+5,S[1]+12,u)],J=>-J[0]+J[1]*.3);return sim(p)},
   fondo:g('eq-b',rect(22,76.5,34,4.6,2))+g('eq-t',linea([28,81],[28,SUELO])+linea([90,70],[90,SUELO]))+polea(96,84),enlaces:[{de:[96,84],a:'GN'}]});
def('remo_maquina','Remo en máquina','espalda','máquina de remo con apoyo de pecho',['Pecho apoyado, no lo despegues','Tira con los codos hacia atrás','Estira adelante sin soltar la tensión'],
  {mano:{N:'mango',F:'mango'},pose:u=>{const p=B();p.x=40;p.y=63;p.l=p.c=-88;pierna(p,'N',[66,91],delante);pierna(p,'F',[63,91],delante);const S=fk(p).SN;
    brazo(p,'N',[mix(S[0]+28,S[0]-2,u),mix(S[1]+5,S[1]+11,u)],J=>-J[0]+J[1]);return sim(p)},
   fondo:g('eq-b',rect(28,68.5,26,4.6,2))+g('eq-t',linea([34,73],[34,SUELO]))+cojin([49,50],-90,18,4.4)+g('eq-t',linea([51,50],[51,SUELO])),enlaces:[{de:[72,10],a:'GN',t:'palanca'}]});
def('pullover_polea','Pullover en polea','espalda','polea alta con barra recta o cuerda',['Brazos casi rectos todo el recorrido','Baja la barra hasta los muslos con la espalda','Sube lento hasta estirar los dorsales'],
  {mano:{N:'eje',F:'eje'},pose:u=>{const p=B();p.x=50;p.y=52;p.l=-74;p.c=-70;p.h=-60;pierna(p,'N',[58,91],delante);pierna(p,'F',[52,91],delante);p.uN=mix(-46,74,u);p.fN=p.uN-8;return sim(p)},
   fondo:torre(106,6),enlaces:[{de:[106,6],a:'GN'}]});
def('pullover_mancuerna','Pullover con mancuerna','espalda','banco plano y una mancuerna',['Cadera firme, codos un poco flexionados','Baja la pesa detrás de la cabeza hasta estirar','Súbela en arco hasta encima del pecho'],
  {mano:{N:'colgada',F:'colgada'},pose:u=>{const p=tumbado(B());p.uN=mix(172,268,u);p.fN=p.uN-8;p.xN=90;return sim(p)},fondo:banco(22,90,66)});
def('encogimientos','Encogimientos','espalda','mancuernas (o barra)',['Brazos estirados y sueltos','Sube los hombros hacia las orejas','Pausa arriba; no gires los hombros'],
  {mano:{N:'disco',F:'disco'},pose:u=>{const p=B();p.x=56;p.el=mix(0,3.6,u);return sim(p)}});

/* ---------------- más HOMBROS ---------------- */
def('press_militar','Press militar con barra','hombros','barra con discos (mejor en rack)',['Glúteos y abdomen firmes, sin arquear','La barra sube pegada a la cara','Arriba, mete la cabeza entre los brazos'],
  {mano:{N:'eje',F:'barra'},pose:u=>{const p=B();p.x=52;p.h=mix(-80,-90,u);const S=fk(p).SN;brazo(p,'N',[mix(S[0]+9.5,S[0]+1.5,u),mix(S[1]-.5,S[1]-29.5,u)],J=>J[1]+J[0]);return sim(p)}});
function pressHombroFr(impl){return {v:'fr',mano:impl==='maquina'?{N:'mango',F:'mango'}:{N:'pesa',F:'pesa'},
  pose:u=>{const p=BF();p.x=60;p.y=60;sentadoFr(p);const S=fk(p).SN;brazo(p,'N',[mix(S[0]+6,S[0]+1.5,u),mix(S[1]-4,S[1]-29.5,u)],J=>J[0]);p.xN=-90;return espejo(p)},
  fondo:g('eq-b',rect(49,26,22,40,2))+g('eq-b',rect(42,66,36,4.6,2))+g('eq-t',linea([60,70.6],[60,SUELO])+(impl==='maquina'?linea([34,6],[34,SUELO])+linea([86,6],[86,SUELO]):''))}}
def('press_hombro_mancuernas','Press con mancuernas sentado','hombros','banco con respaldo vertical y mancuernas',['Espalda pegada al respaldo','Baja hasta la altura de las orejas','Sube sin chocar las pesas ni bloquear de golpe'],pressHombroFr('mancuerna'));
def('press_hombro_maquina','Press de hombro en máquina','hombros','máquina de press de hombro',['Agarres a la altura de los hombros','Empuja arriba sin arquear la espalda','Baja lento hasta la altura de las orejas'],pressHombroFr('maquina'));
def('elev_lateral_polea','Elevación lateral en polea','hombros','polea baja con agarre',['La polea al otro lado del brazo que trabaja','Sube hasta la altura del hombro','Baja lento: la polea tira todo el recorrido'],
  {v:'fr',mano:{N:'asa'},pose:u=>{const p=BF();p.x=62;piernasFr(p);p.uN=mix(100,-4,u);p.fN=p.uN+12;p.uF=148;p.fF=172;return p},
   fondo:g('eq-t',linea([12,8],[12,SUELO]))+polea(12,86),enlaces:[{de:[12,86],a:'GN'}]});
def('elev_lateral_maquina','Elevación lateral en máquina','hombros','máquina de elevaciones laterales',['Hombros alineados con el eje de la máquina','Empuja con los codos hasta la horizontal','Baja despacio sin soltar'],
  {v:'fr',mano:{},pose:u=>{const p=BF();p.x=60;p.y=60;sentadoFr(p);p.uN=mix(84,0,u);p.fN=p.uN+60;p.k.fN=.55;return espejo(p)},
   pegado:{uN:cojin([LU-9,-3.6],0,9,-3.2),uF:cojin([LU-9,3.6],0,9,3.2)},capas:['fondo','piernaF','piernaN','torso','brazoF','brazoN','frente0','frente'],fondo:marcoFr()});
def('elev_frontales','Elevaciones frontales','hombros','mancuernas (o un disco)',['Brazos casi rectos, sin balanceo','Sube hasta la altura de los ojos','Baja en 2 s'],
  {mano:{N:'disco',F:'disco'},pose:u=>{const p=B();p.x=52;p.uN=mix(84,-6,u);p.fN=p.uN-6;return sim(p)}});
def('pajaros_mancuernas','Pájaros con mancuernas','hombros','mancuernas',['Tronco inclinado casi paralelo al suelo','Abre los brazos con los codos algo flexionados','Sube hasta la altura de los hombros, sin impulso'],
  {v:'fr',mano:{N:'disco',F:'disco'},ocultar:['h'],vista:'de frente, inclinado',pose:u=>{const p=BF();p.x=60;p.y=58;p.k.r=p.k.c=.45;p.tN=86;p.tF=94;p.sN=93;p.sF=87;p.uN=mix(86,4,u);p.fN=p.uN+12;return espejo(p)},
   frente:g('ab-o','<circle cx="60" cy="45.5" r="5.3"/>')+g('ab-f','<circle cx="60" cy="45.5" r="5.3"/>')});
function pajarosRecto(impl){const o={v:'fr',mano:impl==='polea'?{N:'asa',F:'asa'}:{N:'mango',F:'mango'},
  pose:u=>{const p=BF();p.x=60;if(impl==='maquina'){p.y=60;sentadoFr(p)}else piernasFr(p);p.uN=impl==='polea'?-4:0;p.fN=p.uN;p.k.uN=p.k.fN=mix(-.5,1,u);return espejo(p)}};
  if(impl==='polea'){o.fondo=g('eq-t',linea([6,8],[6,SUELO])+linea([114,8],[114,SUELO]))+polea(8,27)+polea(112,27);o.enlaces=[{de:[8,27],a:'GN'},{de:[112,27],a:'GF'}]}
  else o.fondo=marcoFr();return o}
def('pajaros_polea','Pájaros en polea','hombros','dos poleas a la altura del hombro (cables cruzados)',['Cables cruzados delante del pecho','Abre con los codos hasta formar una T','Vuelve lento sin encoger los hombros'],pajarosRecto('polea'));
def('pajaros_maquina','Pájaros en máquina (pec deck inverso)','hombros','máquina pec deck en posición inversa',['Pecho contra el respaldo','Abre los brazos hacia atrás a la altura del hombro','Vuelve lento sin dejar que choquen las pesas'],pajarosRecto('maquina'));
def('face_pull','Face pull','hombros','polea a la altura de la cara con cuerda',['Tira de la cuerda hacia la frente','Separa las manos y saca los codos altos y atrás','Vuelve lento con los brazos estirados'],
  {mano:{N:'cuerda',F:'cuerda'},pose:u=>{const p=B();p.x=48;p.l=-90;p.c=-93;pierna(p,'N',[58,91],delante);pierna(p,'F',[40,91],delante);p.uN=mix(-6,-4,u);p.k.uN=mix(1,.22,u);p.fN=mix(-6,-84,u);return sim(p)},
   fondo:g('eq-t',linea([106,6],[106,SUELO]))+polea(106,20),enlaces:[{de:[106,20],a:'GN'}]});
def('remo_menton','Remo al mentón','hombros','barra (o mancuernas, o polea)',['Manos a algo más del ancho de hombros','Sube con los codos, hasta el pecho, no más','Si molesta el hombro, sube menos'],
  {v:'fr',mano:{N:'eje',F:'eje'},pose:u=>{const p=BF();p.x=60;piernasFr(p);const S=fk(p).SN;brazo(p,'N',[65,mix(S[1]+27.5,S[1]+3,u)],J=>J[0]-J[1]*.3);return espejo(p)},
   enlaces:[{de:'GF',a:'GN',t:'barra',ext:6}]});

/* ---------------- más ABDOMEN ---------------- */
const brazosCabeza=p=>{p.uN=p.c+60;p.fN=p.uN-150;return sim(p)};
def('crunch_polea','Crunch en polea','abdominales','polea alta con cuerda',['De rodillas, la cuerda junto a la cabeza','Enrolla el tronco: costillas hacia la pelvis','La cadera no se mueve; exhala al bajar'],
  {mano:{N:'cuerda',F:'cuerda'},pose:u=>{const p=B();p.x=60;p.y=68.5;p.tN=p.tF=92;p.sN=p.sF=180;p.pN=p.pF=150;p.l=mix(-80,-48,u);p.c=mix(-70,20,u);p.h=p.c+20;return brazosCabeza(p)},
   fondo:torre(106,8),enlaces:[{de:[106,8],a:'GN'}]});
def('crunch_maquina','Crunch en máquina','abdominales','máquina de crunch abdominal',['Ajusta el asiento: el pecho contra el cojín','Enrolla el tronco hacia las piernas','Vuelve lento sin soltar la tensión'],
  {mano:{N:'mango',F:'mango'},pose:u=>{const p=B();p.x=44;p.y=63;p.l=mix(-88,-72,u);p.c=mix(-86,-24,u);p.h=p.c+14;pierna(p,'N',[70,91],delante);pierna(p,'F',[67,91],delante);return brazosCabeza(p)},
   pegado:{c:cojin([LC-6,7],0,8,3.6)},fondo:(pt)=>respaldo(pt,'atras',22,1)+g('eq-b',rect(30,68.5,28,4.6,2))+g('eq-t',linea([36,73],[36,SUELO]))});
function colgado(rod){return {mano:{N:'mango',F:'mango'},zoom:.88,zoomY:6,
  pose:u=>{const p=B();p.l=mix(-90,-114,u);p.c=mix(-90,-98,u);p.uN=p.fN=-90;
    if(rod){p.tN=mix(95,-28,u);p.sN=mix(95,78,u)}else{p.tN=mix(93,-4,u);p.sN=p.tN}p.pN=p.sN-90;
    llevar(p,'SN',[58,36]);p.tF=p.tN;p.sF=p.sN;p.pF=p.pN;return sim(p)},
  fondo:g('eq-t',linea([30,6],[86,6])+linea([84,6],[84,SUELO]))}}
def('elev_colgado','Elevaciones colgado','abdominales','barra de dominadas',['Cuélgate quieto, sin balanceo','Sube las piernas rotando la pelvis hacia arriba','Baja lento sin soltar el abdomen'],colgado(false));
def('rodillas_colgado','Rodillas al pecho colgado','abdominales','barra de dominadas',['Sin balanceo: empieza quieto','Lleva las rodillas al pecho redondeando la espalda baja','Baja controlado'],colgado(true));
def('elev_banco','Elevación de piernas en banco','abdominales','banco plano',['Agárrate al banco detrás de la cabeza','Sube las piernas rectas hasta la vertical','Baja sin que la zona lumbar se arquee'],
  {pose:u=>{const p=B();p.l=p.c=p.h=180;p.x=76;p.y=60;p.tN=p.sN=mix(2,-86,u);p.pN=p.sN-90;p.tF=p.tN;p.sF=p.sN;p.pF=p.pN;p.uN=176;p.fN=100;return sim(p)},fondo:banco(22,86,66)});
def('rueda','Rueda abdominal','abdominales','rueda abdominal y una colchoneta',['De rodillas, abdomen firme y pelvis metida','Rueda adelante solo hasta donde controles','Vuelve tirando con el abdomen, no con la cadera'],
  {mano:{N:'rueda',F:'rueda'},pose:u=>{const p=B();const K=[38,90.4],ak=mix(-24,-80,u),H=add(K,ak,LT);p.x=H[0];p.y=H[1];p.tN=p.tF=ak+180;p.sN=p.sF=180;p.pN=p.pF=200;
    p.l=p.c=mix(-8,-38,u);p.h=p.c+15;const S=fk(p).SN,al=Math.asin(Math.min(1,(89.4-S[1])/30))*180/Math.PI;p.uN=al-4;p.fN=al+4;return sim(p)},
   fondo:g('eq-b',rect(26,91.5,18,2.6,1.3))});
def('plancha','Plancha','abdominales','una colchoneta',['Antebrazos bajo los hombros','Cuerpo recto: aprieta glúteos y abdomen','Respira sin dejar caer la cadera'],
  {T:4,pose:u=>{const p=B();const A0=[22,85.5],th=mix(-8.2,-9.4,u);p.pN=p.pF=70;p.l=p.c=th;p.h=th+4;p.tN=p.tF=p.sN=p.sF=th+180;const H=add(A0,th,LT+LS);p.x=H[0];p.y=H[1];p.uN=90;p.fN=-2;return sim(p)},
   fondo:g('eq-b',rect(14,91.5,92,2.6,1.3))});
def('crunch_inverso','Crunch inverso','abdominales','una colchoneta o banco',['Rodillas a 90°, brazos en el suelo','Despega la cadera llevando las rodillas al pecho','Baja lento sin dejar caer las piernas'],
  {pose:u=>{const p=B();p.c=p.h=180;p.l=mix(180,146,u);p.tN=p.tF=mix(-88,-150,u);p.sN=p.sF=p.tN+92;p.pN=p.pF=p.sN-10;p.uN=2;p.fN=0;llevar(p,'SN',[38,87.5]);return sim(p)},
   fondo:g('eq-b',rect(18,91.5,84,2.6,1.3))});
def('vacio','Vacío del transverso','abdominales','nada',['Exhala todo el aire','Mete el ombligo hacia la columna y sostén','Respira corto sin soltar; empieza con 15 s'],
  {T:4.4,pose:u=>{const p=B();p.x=56;p.ex.panza=mix(1.25,.35,u);return p},
   extras:[{svg:'<g class="ab-o"><ellipse cx="0" cy="0" rx="3.6" ry="6.4"/></g><g class="ab-f"><ellipse cx="0" cy="0" rx="3.6" ry="6.4"/></g>',tf:p=>`translate(61.5 42.5) scale(${Math.round(p.ex.panza*100)/100} 1)`}],
   capas:['fondo','brazoF','piernaF','torso','enlaces','piernaN','brazoN','frente']});
def('pallof','Pallof press','abdominales','polea a la altura del pecho (de lado)',['De lado a la polea, pies al ancho de cadera','Empuja las manos al frente sin dejar girar el tronco','Vuelve al pecho despacio'],
  {mano:{N:'asa',F:'asa'},pose:u=>{const p=B();p.x=50;pierna(p,'N',[56,91],delante);pierna(p,'F',[44,91],delante);const S=fk(p).SN;brazo(p,'N',[mix(S[0]+7,S[0]+28.5,u),mix(S[1]+9,S[1]+7,u)],abajo);return sim(p)},
   fondo:g('eq-t',linea([58,6],[58,SUELO]))+polea(58,35),enlaces:[{de:[58,35],a:'GN'}],vista:'la polea queda a tu lado'});

/* ---------------- más PIERNAS ---------------- */
def('sentadilla_hack','Sentadilla hack','piernas','máquina hack (o prensa vertical)',['Espalda y hombros pegados a los cojines','Baja hasta que el muslo pase la horizontal','Empuja con todo el pie, sin bloquear arriba'],
  {mano:{},pose:u=>{const p=B();const d=mix(23,0,u),P0=[58,47.5],P=add(P0,112,d);p.x=P[0];p.y=P[1];p.l=p.c=p.h=-112;
    pierna(p,'N',[72,85],delante);pierna(p,'F',[70,85],delante);p.pN=p.pF=-18;const S=fk(p).SN;brazo(p,'N',add(add(S,p.c+90,4),p.c,3),abajo);return sim(p)},
   pegadoTras:{c:cojin([-LL-1,-6.2],0,LL+LC+3,-4.4)},fondo:g('eq-t',linea(add([58,47.5],-68,28),add([58,47.5],112,46)))+cojin([62,89.5],-18,22,3.6)});
def('prensa','Prensa','piernas','prensa de piernas',['Espalda y cadera pegadas al respaldo','Baja hasta que las rodillas se acerquen al pecho sin despegar la cadera','Empuja sin bloquear las rodillas'],
  {mano:{},pose:u=>{const p=B();p.x=46;p.y=74;p.l=p.c=-152;p.h=-130;const A0=add([46,74],-42,mix(23,39.5,u));pierna(p,'N',A0,arriba);pierna(p,'F',[A0[0]-1.5,A0[1]+1],arriba);p.pN=p.pF=-132;
    p.uN=96;p.fN=40;return sim(p)},
   pegado:{pN:cojin([-5,AH],0,16,2.8)},fondo:(pt)=>respaldo(pt,'atras',36,8,7.4)+cojin([30,80.5],-14,22,4.4)+g('eq-t',linea(add([46,74],-42,18).map((v,i)=>v+(i?5:3)),add([46,74],-42,52).map((v,i)=>v+(i?5:3)))+linea([40,82],[40,SUELO])+linea([84,46],[84,SUELO]))});
function zancada(tipo){const o={mano:{N:'disco',F:'disco'}};
  o.pose=u=>{const p=B();p.x=mix(55,52,u);p.y=mix(71,52.5,u);p.l=p.c=-86;p.h=-88;
    pierna(p,'N',[74,91],delante);if(tipo==='bulgara'){pierna(p,'F',[30,65.5],abajo);p.pF=200}else{pierna(p,'F',[31,86],abajo);p.pF=58}
    p.uN=p.fN=92;return sim(p)};
  if(tipo==='bulgara')o.fondo=banco(10,40,69.5);return o}
def('zancada_bulgara','Zancada búlgara','piernas','un banco y mancuernas',['Pie de atrás apoyado en el banco','Baja recto hasta que la rodilla de atrás casi toque el suelo','Empuja con el talón de delante'],zancada('bulgara'));
def('zancada','Zancada','piernas','mancuernas (opcional)',['Paso largo, tronco erguido','Baja hasta que ambas rodillas formen 90°','Empuja con la pierna de delante para subir'],zancada('normal'));
function pesoMuerto(tipo){const R=tipo==='rumano';return {mano:{N:'eje',F:'barra'},
  pose:u=>{const p=B();p.x=mix(R?43:42,56,u);p.y=mix(R?55:66,50.5,u);p.l=p.c=mix(R?-14:-28,-88,u);p.h=p.c+mix(R?30:25,0,u);
    pierna(p,'N',[59,91],delante);pierna(p,'F',[57,91],delante);p.uN=p.fN=90;return sim(p)}}}
def('peso_muerto_rumano','Peso muerto rumano','piernas','barra con discos (o mancuernas)',['Rodillas algo flexionadas y fijas','Lleva la cadera atrás con la espalda recta','Baja pegando la barra a las piernas hasta notar los femorales'],pesoMuerto('rumano'));
def('peso_muerto','Peso muerto','piernas','barra con discos',['Barra sobre la mitad del pie, espalda neutra','Empuja el suelo y extiende cadera y rodillas a la vez','Baja con la barra pegada a las piernas'],pesoMuerto('conv'));
const piernasSim=p=>{p.tF=p.tN;p.sF=p.sN;p.pF=p.pN;return p};
def('ext_cuadriceps','Extensión de cuádriceps','piernas','máquina de extensión de cuádriceps',['Rodilla alineada con el eje de la máquina','Estira del todo y aprieta un segundo','Baja despacio sin dejar caer el peso'],
  {mano:{},pose:u=>{const p=B();p.x=46;p.y=63.5;p.l=p.c=-100;p.tN=-4;p.sN=mix(100,-2,u);p.pN=p.sN-90;p.uN=96;p.fN=30;return sim(piernasSim(p))},
   pegado:{sN:g('eq-l',linea([0,-4.6],[LS-2.4,-4.6]))+g('eq-p',`<circle cx="${LS-2.4}" cy="-5" r="3"/>`)},
   fondo:(pt)=>respaldo(pt,'atras',28,3)+g('eq-b',rect(30,69.5,38,4.6,2))+g('eq-t',linea([38,74],[38,SUELO])+linea([62,74],[62,SUELO]))});
def('curl_femoral','Curl femoral tumbado','piernas','máquina de curl femoral tumbado',['Cadera pegada al banco','Lleva los talones hacia los glúteos','Baja en 2–3 s sin estirar de golpe'],
  {mano:{},pose:u=>{const p=B();p.x=46;p.y=58.5;p.l=p.c=-2;p.h=-14;p.tN=180;p.sN=mix(182,292,u);p.pN=p.sN-90;p.uN=100;p.fN=20;return sim(piernasSim(p))},
   pegado:{sN:g('eq-l',linea([0,4.6],[LS-2.4,4.6]))+g('eq-p',`<circle cx="${LS-2.4}" cy="5" r="3"/>`)},fondo:banco(24,88,64.5)});
def('curl_femoral_sentado','Curl femoral sentado','piernas','máquina de curl femoral sentado',['Rodilla alineada con el eje, muslo sujeto','Lleva el talón hacia abajo y atrás','Vuelve lento hasta casi estirar'],
  {mano:{},pose:u=>{const p=B();p.x=40;p.y=62;p.l=p.c=-100;p.tN=-6;p.sN=mix(-4,96,u);p.pN=p.sN-90;p.uN=96;p.fN=30;return sim(piernasSim(p))},
   pegado:{sN:g('eq-p',`<circle cx="${LS-2.4}" cy="5" r="3"/>`),tN:cojin([LT-9,-5.4],0,10,-3.6)},
   fondo:(pt)=>respaldo(pt,'atras',28,3)+g('eq-b',rect(24,68,36,4.6,2))+g('eq-t',linea([32,72.6],[32,SUELO])+linea([56,72.6],[56,SUELO]))});
def('hip_thrust','Hip thrust','piernas','banco, barra con discos y una almohadilla',['Parte alta de la espalda en el borde del banco','Sube la cadera hasta alinear tronco y muslos','Aprieta glúteos arriba; barbilla al pecho'],
  {mano:{N:'eje'},pose:u=>{const p=B();p.l=p.c=mix(-134,-180,u);p.h=p.c+mix(40,60,u);llevar(p,'SN',[40,58]);pierna(p,'N',[86,91],arriba);pierna(p,'F',[83,91],arriba);
    const pt=fk(p),Bp=add(add(pt.P,p.l+90,7),p.l,1.5);brazo(p,'N',Bp,abajo);return sim(p)},
   pegadoF:{r:g('eq-m',`<circle cx="1.5" cy="7" r="9"/>`)+g('eq-h',`<circle cx="1.5" cy="7" r="2.2"/>`)},fondo:banco(12,40,62.5)});
def('talones_pie','Elevación de talones de pie','piernas','un escalón (y peso si quieres)',['La punta del pie en el borde del escalón','Baja el talón hasta estirar bien la pantorrilla','Sube a puntillas y pausa arriba'],
  {mano:{N:'disco',F:'disco'},pose:u=>{const p=B();const pa=mix(-24,32,u),Bl=[62,84.5],A0=[Bl[0]-(5*Math.cos(pa*Math.PI/180)-AH*Math.sin(pa*Math.PI/180)),Bl[1]-(5*Math.sin(pa*Math.PI/180)+AH*Math.cos(pa*Math.PI/180))];
    p.pN=p.pF=pa;p.x=A0[0];p.y=A0[1]-LT-LS;return sim(p)},fondo:g('eq-b',rect(61,85,30,9.4,1.6))});
def('talones_sentado','Elevación de talones sentado','piernas','máquina de gemelo sentado (o mancuerna sobre las rodillas)',['Rodillas bajo el cojín, punta del pie en el borde','Baja el talón hasta estirar','Sube del todo y pausa'],
  {mano:{},pose:u=>{const p=B();p.x=38;p.y=62;p.l=p.c=-90;const pa=mix(-24,30,u),Bl=[66,84.5],A0=[Bl[0]-(5*Math.cos(pa*Math.PI/180)-AH*Math.sin(pa*Math.PI/180)),Bl[1]-(5*Math.sin(pa*Math.PI/180)+AH*Math.cos(pa*Math.PI/180))];
    pierna(p,'N',A0,arriba);p.pN=pa;p.uN=60;p.fN=10;return sim(piernasSim(p))},
   pegado:{tN:cojin([LT-8,-5.4],0,10,-3.6)},fondo:g('eq-b',rect(24,68,26,4.6,2)+rect(65,85,14,9.4,1.6))+g('eq-t',linea([30,72.6],[30,SUELO]))});
function abduccion(ab){return {v:'fr',mano:{N:'mango',F:'mango'},
  pose:u=>{const p=BF();p.x=60;p.y=60;sentadoFr(p);p.k.tN=p.k.tF=.5;const a=ab?mix(84,28,u):mix(28,84,u);p.tN=a;p.tF=M(a);p.uN=96;p.fN=96;p.uF=84;p.fF=84;return p},
  pegado:ab?{sN:cojin([0,-3.4],0,9,-3),sF:cojin([0,3.4],0,9,3)}:{sN:cojin([0,3.4],0,9,3),sF:cojin([0,-3.4],0,9,-3)},capas:['fondo','torso','piernaF','piernaN','frente0','brazoF','brazoN','frente'],fondo:marcoFr()}}
def('abductores','Abductores en máquina','piernas','máquina de abductores',['Espalda apoyada, cadera quieta','Abre las rodillas contra los cojines','Cierra despacio sin que choquen las pesas'],abduccion(true));
def('aductores','Aductores en máquina','piernas','máquina de aductores',['Espalda apoyada','Junta las rodillas apretando','Abre lento solo hasta donde sea cómodo'],abduccion(false));
def('hiperextension','Hiperextensión','piernas','banco de hiperextensiones a 45°',['Cadera sobre el cojín, tobillos sujetos','Baja con la espalda neutra doblando la cadera','Sube hasta alinear el tronco con las piernas, sin pasarte'],
  {pose:u=>{const p=B();p.x=52;p.y=50;p.tN=p.tF=p.sN=p.sF=146;p.pN=p.pF=70;p.l=p.c=mix(74,-34,u);p.h=p.c+10;p.uN=p.c+150;p.fN=p.c-60;return sim(p)},
   fondo:cojin(add([52,50],56,6.4),-34,12,4)+g('eq-t',linea(add([52,50],56,11),[60,SUELO])+linea([60,SUELO],[20,SUELO]))+g('eq-p',`<circle cx="${n1(52+41*Math.cos(146*Math.PI/180)+3)}" cy="${n1(50+41*Math.sin(146*Math.PI/180)+4.5)}" r="3"/>`)});
def('nordico','Curl nórdico','piernas','algo que sujete los tobillos y una colchoneta',['Cuerpo recto de rodillas a cabeza','Déjate caer lo más lento posible','Frena con las manos y vuelve con ayuda si hace falta'],
  {pose:u=>{const p=B();const K=[48,90.4],b=mix(58,0,u),H=add(K,-90+b,LT);p.x=H[0];p.y=H[1];p.tN=p.tF=90+b;p.sN=p.sF=180;p.pN=p.pF=200;p.l=p.c=p.h=-90+b;p.uN=p.c+130;p.fN=p.uN-50;return sim(p)},
   fondo:g('eq-b',rect(34,91.5,24,2.6,1.3))+g('eq-p','<circle cx="29" cy="84.6" r="3"/>')});
def('patada_gluteo','Patada de glúteo en polea','piernas','polea baja con tobillera',['Agárrate a la máquina, tronco quieto','Lleva la pierna atrás apretando el glúteo','Sin arquear la zona lumbar'],
  {mano:{},pose:u=>{const p=B();p.x=56;p.l=p.c=-82;p.uN=-8;p.fN=-4;p.tF=92;p.sF=90;p.tN=mix(96,138,u);p.sN=p.tN+12;p.pN=p.sN-80;return sim(p)},
   fondo:g('eq-t',linea([96,6],[96,SUELO]))+polea(96,88),enlaces:[{de:[96,88],a:'AN'}]});
def('sentadilla_frontal','Sentadilla frontal','piernas','rack, barra y discos',['Barra sobre los hombros delanteros, codos altos','Tronco muy erguido al bajar','Rodillas hacia delante en línea con los pies'],
  (()=>{const o=sentadilla('frontal');o.mano={};o.pegado={c:g('eq-m',`<circle cx="${LC-1}" cy="7" r="9"/>`)+g('eq-h',`<circle cx="${LC-1}" cy="7" r="2.2"/>`)};
    const pz=o.pose;o.pose=u=>{const p=pz(u);p.c=mix(-74,-88,u);const pt=fk(p);brazo(p,'N',add(add(pt.SN,p.c,0),p.c+90,7),abajo);p.uN=p.uN;return sim(p)};return o})());

/* ---------------- genérica ---------------- */
def('generico','Ejercicio sin animación propia','','—',['Usa un peso que puedas controlar','Recorrido completo y sin impulso','Baja más lento de lo que subes'],
  {pose:u=>{const p=B();p.x=56;p.uN=mix(88,60,u);p.fN=mix(84,-20,u);return sim(p)},generica:true});

const POR_ID=Object.fromEntries(LISTA.map(d=>[d.id,d]));

/* ---------------- nombre → animación ----------------
   Por palabras clave sobre el nombre en minúsculas y sin tildes; gana la primera regla que encaja (las específicas van antes).
   Una regla puede ser [regex, id] o [regex, función(nombre) → id]. Si nada encaja: la típica del grupo, marcada «aprox». */
const sinT=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const con=(re,si,no)=>t=>re.test(t)?si:no;
const REGLAS=[
 [/(^|\s)vacio(s)?(\s|$)|transverso|stomach vacuum|hipopresiv/,'vacio'],
 [/pallof/,'pallof'],
 [/plancha(?! de brazos)|plank/,'plancha'],
 [/rueda|ab ?wheel|rollout/,'rueda'],
 [/crunch inverso|reverse crunch|elevacion de (la )?cadera tumbad/,'crunch_inverso'],
 [/(crunch|abdominal).*(polea|cuerda|cable)|cable crunch|crunch arrodillad|crunch de rodillas/,'crunch_polea'],
 [/(crunch|abdominal).*maquina|ab machine/,'crunch_maquina'],
 [/rodillas al pecho|knee raise|rodillas colgad|encogimiento de piernas colgad/,'rodillas_colgado'],
 [/(elevacion|levantamiento)(es)? de piernas.*(banco|suelo|tumbad|acostad)|lying leg raise|leg raise.*(bench|floor)/,'elev_banco'],
 [/colgad|hanging|(elevacion|levantamiento)(es)? de piernas|toes to bar/,'elev_colgado'],
 [/crunch|abdominal|sit ?ups?\b|encogimiento de abdomen/,'crunch_suelo'],
 [/nordic/,'nordico'],
 [/((curl|flexion) (femoral|de (piernas?|isquios?|femoral))|femoral|leg curl).*sentad|seated leg curl/,'curl_femoral_sentado'],
 [/femoral|isquio|leg curl|curl (de |con )?piernas?/,'curl_femoral'],
 [/talon|gemelo|pantorrilla|calf|soleo/,con(/sentad|seated/,'talones_sentado','talones_pie')],
 [/extension (de )?(cuadricep|pierna|rodilla)|leg extension|^cuadriceps?\b/,'ext_cuadriceps'],
 [/abductor|abduccion|abduction/,'abductores'],
 [/aductor|aduccion|adduction/,'aductores'],
 [/hip thrust|puente de gluteo|glute bridge|empuje de cadera/,'hip_thrust'],
 [/(patada|kickback|extension de cadera).*gluteo|glute kick|patada trasera/,'patada_gluteo'],
 [/hiperextensi|lumbar|back extension|buenos dias|good morning/,'hiperextension'],
 [/rumano|romanian|\brdl\b|piernas rigidas|stiff/,'peso_muerto_rumano'],
 [/peso muerto|deadlift/,'peso_muerto'],
 [/bulgara|bulgarian|split squat/,'zancada_bulgara'],
 [/zancada|estocada|lunge|desplante|step ?up|subida al (banco|cajon)/,'zancada'],
 [/prensa|leg press/,'prensa'],
 [/hack|pendulo|maquina de sentadilla/,'sentadilla_hack'],
 [/goblet|sentadilla con mancuerna|sumo/,'sentadilla_goblet'],
 [/sentadilla frontal|front squat/,'sentadilla_frontal'],
 [/sentadilla|squat/,'sentadilla_barra'],
 [/fondos? en maquina|dip machine|maquina de fondos/,'fondos_maquina'],
 [/fondos?.*(inclinad|pecho)|chest dips?/,'fondos_pecho'],
 [/fondo|\bdips?\b|paralelas/,'fondos_triceps'],
 [/diamante|flexion(es)? cerrada|flexion(es)? de triceps|close.?grip push/,'flexiones_cerradas'],
 [/pica|pike/,'flexiones_pica'],
 [/flexion(es)? lastrad|weighted push/,'flexiones_lastradas'],
 [/flexion(es)?( de brazos| de pecho)?$|flexion(es)? (de brazos|de pecho|en el suelo|normales|inclinadas|declinadas)|^flexiones|lagartija|push ?ups?\b|plancha de brazos/,'flexiones'],
 [/press frances|frances|rompecraneos|skull ?crusher|extension (de triceps )?(tumbad|acostad)/,'frances'],
 [/patada|kickback/,con(/polea|cable/,'patada_polea','patada')],
 [/((extension|triceps).*(sobre|tras|detras de) la cabeza|overhead (triceps|extension)|triceps overhead).*(polea|cuerda|cable)|(polea|cable).*sobre la cabeza/,'sobre_cabeza_polea'],
 [/(extension|triceps).*(sobre|tras|detras de) la (cabeza|nuca)|tras nuca|overhead (triceps|extension)|triceps overhead|extension de triceps con mancuerna/,'sobre_cabeza'],
 [/pushdown|push down|jalon de triceps|extension (de triceps )?en polea|triceps (en|con) polea|extension.*(cuerda|polea)|triceps.*cuerda/,con(/cuerda|rope/,'pushdown_cuerda','pushdown_barra')],
 [/press cerrado|close.?grip bench|banca (con )?agarre cerrado/,'press_cerrado'],
 [/^triceps?$/,'pushdown_cuerda'],
 [/(martillo|hammer).*(cuerda|polea|cable)|curl con cuerda|rope curl/,'curl_cuerda'],
 [/bayes|curl.*(de espaldas|tras el cuerpo|detras del cuerpo)/,'curl_bayes'],
 [/martillo|hammer/,'curl_martillo'],
 [/arana|spider/,'curl_arana'],
 [/predicador|scott|preacher/,'curl_predicador'],
 [/concentrad|concentration/,'curl_concentrado'],
 [/curl.*inclinad|incline (dumbbell )?curl/,'curl_inclinado'],
 [/curl.*(polea|cable)|cable curl/,'curl_polea'],
 [/curl.*barra|barbell curl|ez curl|curl z\b/,'curl_barra'],
 [/curl|bicep/,'curl_mancuernas'],
 [/face ?pull|jalon a la cara|tiron a la cara/,'face_pull'],
 [/remo al menton|remo vertical|upright row/,'remo_menton'],
 [/pajaro|posterior|reverse (pec )?fly|rear delt|(pec deck|peck deck|aperturas?) invers|deltoides? posterior/,con(/polea|cable/,'pajaros_polea',null)],
 [/elevacion(es)? lateral.*(polea|cable)|lateral(es)? (en|con) polea|cable lateral/,'elev_lateral_polea'],
 [/elevacion(es)? lateral.*maquina|lateral raise machine/,'elev_lateral_maquina'],
 [/lateral/,'elev_laterales'],
 [/frontal|front raise/,'elev_frontales'],
 [/press militar|militar|overhead press|press de pie|\bohp\b/,'press_militar'],
 [/press (de |del )?hombros?.*maquina|shoulder press machine|maquina de (press de )?hombros?/,'press_hombro_maquina'],
 [/press (de |del )?hombros?|arnold|press con mancuernas sentado|shoulder press|press sentado/,'press_hombro_mancuernas'],
 [/encogimiento|shrug|trapecio/,'encogimientos'],
 [/dominada|pull ?ups?\b|chin ?ups?\b|barra fija/,'dominadas'],
 [/remo invertido|australian|inverted row|remo con (el )?cuerpo/,'remo_invertido'],
 [/(jalon|pulldown).*(neutro|cerrado|\bv\b|triangulo|estrecho)|close.?grip pulldown/,'jalon_neutro'],
 [/jalon|pulldown|polea al pecho|lat pull/,'jalon'],
 [/pull ?over/,con(/polea|cuerda|cable/,'pullover_polea','pullover_mancuerna')],
 [/remo en t\b|t.?bar|remo (con|en) barra t|landmine/,'remo_t'],
 [/remo.*(polea|cable|gironda|sentado)|seated (cable )?row|cable row/,'remo_polea'],
 [/remo.*maquina|machine row|remo con apoyo|chest.?supported/,'remo_maquina'],
 [/remo.*mancuerna|dumbbell row|remo a una mano|serrucho/,'remo_mancuerna'],
 [/remo|\brow\b/,'remo_barra'],
 [/pec ?deck|peck ?deck|contractor|mariposa|butterfly|aperturas? en maquina/,'pec_deck'],
 [/cruce|crossover|aperturas? (en|con) polea|cable fly/,'cruces_polea'],
 [/apertura|\bfly\b|\bflyes?\b/,'aperturas_mancuernas'],
 [/declinad|decline/,'press_declinado'],
 [/(press|banca|bench).*inclinad|incline (bench|press)/,con(/mancuerna|dumbbell/,'press_inclinado_mancuernas','press_inclinado_barra')],
 [/press.*maquina|chest press|press de pecho en maquina/,'press_maquina'],
 [/(press|banca|bench).*mancuerna|dumbbell (bench )?press/,'press_mancuernas'],
 [/press banca|banca|bench press|press de pecho|press plano/,'press_banca']];
const POR_GRUPO={biceps:'curl_mancuernas',triceps:'pushdown_cuerda',espalda:'remo_barra',pecho:'press_banca',hombros:'elev_laterales',abdominales:'crunch_suelo',piernas:'sentadilla_barra'};
const PAJAROS={hombros:'pajaros_mancuernas'};
// → {d: definición, aprox: true si no se reconoció el nombre (se muestra la típica del grupo o la genérica)}
function buscar(nombre,grupo){const t=sinT(nombre);
  for(const [re,x] of REGLAS){if(!re.test(t))continue;let id=typeof x==='function'?x(t):x;
    if(id===null)id=/maquina|pec ?deck|peck/.test(t)?'pajaros_maquina':'pajaros_mancuernas';
    if(id&&POR_ID[id])return {d:POR_ID[id],aprox:false}}
  const id=POR_GRUPO[grupo];return {d:POR_ID[id||'generico'],aprox:true}}

A.lista=LISTA;A.porId=POR_ID;A.buscar=buscar;A.sinT=sinT;A.reglas=REGLAS.length;
})();
