// v31 · Mis cargas: calibración semanal de cargas por ejercicio y modalidad (hipertrofia o fuerza).
// Una vez por semana configuras o confirmas la carga de referencia de cada ejercicio; al entrenar, el reloj ya la sabe: la propone en
// cada serie sin volver a preguntarla y la registra como «de la configuración». «Cambiar peso» la cambia solo para una serie, para el
// resto del ejercicio de hoy o también en la referencia de la semana, y nunca reescribe series ya hechas. El calentamiento se calcula
// con esa carga. Al empezar una semana se revisa la anterior y se proponen cambios (subir, mantener, bajar o recalibrar) con su porqué;
// decides tú. Nunca se inventa un peso ni una reserva: lo que no sabes queda como desconocido o «necesita calibración».
// Se carga al final (después de pantallas.js) y usa reloj.js: S, grupo, hist, CAT, CFG, LB, cargaDe, ratioCarga, guardarObj…
'use strict';
const CGKEY='reloj-anomalo-cargas',CG_SEM_MAX=104;
const CG_UNI=['kg','lb','nivel'],CG_TCS=['mancuerna','total','extra','corporal'],CG_EQS=['mancuernas','barra','maquina','polea','corporal','otro'];
const CG_RIRS=['0','1','2','3','4','5+','ns'],CG_CNS=['sabe','aprox','calibrar'],CG_SRCS=['manual','heredada','sugerida','modificada','confirmada'];
const CG_EQN={mancuernas:'Mancuernas',barra:'Barra',maquina:'Máquina',polea:'Polea',corporal:'Peso corporal',otro:'Otro'};
const CG_CNN={sabe:'Lo sé',aprox:'Es aproximado',calibrar:'Necesito calibrarlo'};
const CG_SRCN={manual:'introducida por ti',heredada:'de la semana pasada, sin confirmar',sugerida:'propuesta aprobada',modificada:'modificada',confirmada:'confirmada'};
const CG_ACC={subir:'Aumentar carga',mantener:'Mantener carga',bajar:'Reducir carga',recal:'Recalibrar: información insuficiente'};
const CG_EST={pend:'Sin configurar',calibrar:'Necesita calibración',heredada:'Por confirmar',carga:'Carga configurada',completa:'Completa'};
// unidad y especificación en un solo desplegable: «lb por mancuerna» no es lo mismo que «lb en total» (el par)
const CG_ESP=[['lb|mancuerna','lb por mancuerna'],['lb|total','lb en total'],['lb|extra','lb de lastre'],['kg|mancuerna','kg por mancuerna'],['kg|total','kg en total'],['kg|extra','kg de lastre'],['nivel|total','nivel de máquina'],['-|corporal','solo peso corporal']];
const CG_ESP_C=[['lb|mancuerna','lb/mancuerna'],['lb|total','lb total'],['lb|extra','lb lastre'],['kg|mancuerna','kg/mancuerna'],['kg|total','kg total'],['kg|extra','kg lastre'],['nivel|total','nivel'],['-|corporal','corporal']];   // corto, para la fila
const CG_RANGOS_F=['1–3','2–4','3–5','3–6','4–6','5–8'],CG_RI=['0–1','1–2','1–3','2–3','2–4'],CG_PASOS=[1,2,2.5,5,10];
const cgKey=(g,n,m)=>g+'|'+n+'|'+m;
const cgRg=v=>typeof v==='string'&&/^\d{1,2}–\d{1,2}$/.test(v)?v:null;
const cgN=x=>String(Math.round(x*100)/100).replace('.',',');

/* ---------- datos: {v, sem: {lunes AAAA-MM-DD: {refs: {g|ejercicio|h·f: ref}, prop: {clave: propuesta}, ini}}, intro}
   ref = {g, n, m (h hipertrofia · f fuerza), u (kg · lb · nivel), tc (mancuerna · total · extra · corporal), eq (equipo), w (carga en SU
   unidad o null = desconocida), r (reps de referencia), rir (0–4, 5+, ns = no sé), cn (sabe · aprox · calibrar), ro (rango objetivo),
   ri (RIR objetivo), paso (salto propio), src (procedencia), ok (confirmada esta semana), t, obs ('sesion': reps y RIR medidos en una serie)}.
   La carga se guarda en la unidad en que la diste: 40 lb son 40 lb (sin ida y vuelta a kg); el motor la pasa a kg solo para calcular. */
function cgNormRef(k,o){if(!esObj(o)||typeof k!=='string'||k.length>200)return null;const p=k.split('|');if(p.length!==3||!esG(p[0])||(p[2]!=='h'&&p[2]!=='f'))return null;
  const n=vTxt(p[1],80);if(!n)return null;const u=CG_UNI.includes(o.u)?o.u:'kg',tc=CG_TCS.includes(o.tc)?o.tc:'total';
  const R={key:k,g:p[0],n,m:p[2],u,tc,eq:CG_EQS.includes(o.eq)?o.eq:'otro',w:tc==='corporal'||o.w==null?null:vNum(o.w,0,u==='nivel'?100:1100),
    r:o.r==null?null:vEnt(o.r,1,200),rir:CG_RIRS.includes(o.rir)?o.rir:null,cn:CG_CNS.includes(o.cn)?o.cn:null,ro:cgRg(o.ro),ri:cgRg(o.ri),
    paso:o.paso==null?null:vNum(o.paso,.25,100),src:CG_SRCS.includes(o.src)?o.src:'manual',ok:o.ok===true,t:vFecha(o.t)};
  if(R.w===0&&tc!=='extra')R.w=null;   // un 0 en una carga externa no es un dato (para «sin carga» está «solo peso corporal»)
  if(o.obs==='sesion')R.obs='sesion';return R}
function cgNormProp(o){if(!esObj(o)||!['subir','mantener','bajar','recal'].includes(o.acc))return null;
  return {acc:o.acc,w:o.w==null?null:vNum(o.w,0,1100),de:o.de==null?null:vNum(o.de,0,1100),por:vTxt(o.por,600)||'',n:vEnt(o.n,0,1000)??0,dec:['ok','mod','no'].includes(o.dec)?o.dec:null}}
function cgNorm(o){const r={v:1,sem:{},intro:null};if(!esObj(o))return r;r.intro=vFecha(o.intro);
  if(esObj(o.sem)){const ks=Object.keys(o.sem).filter(k=>vDia(k)).sort().slice(-CG_SEM_MAX);
    for(const k of ks){const W=o.sem[k];if(!esObj(W))continue;const w={refs:{},prop:{},ini:vFecha(W.ini)};let n=0;
      if(esObj(W.refs))for(const key in W.refs){if(!tiene(W.refs,key)||++n>600)continue;const R=cgNormRef(key,W.refs[key]);if(R)w.refs[key]=R}
      if(esObj(W.prop))for(const key in W.prop){if(!tiene(W.prop,key)||!w.refs[key])continue;const P=cgNormProp(W.prop[key]);if(P)w.prop[key]=P}
      r.sem[k]=w}}
  return r}
let cg=cgNorm(leerJSON(CGKEY,{}));
const cgGuarda=()=>guardarObj(CGKEY,cg);
function cgRecargar(){cg=cgNorm(leerJSON(CGKEY,{}));cgMemo.k=''}
const cgCopia=()=>cg;
// restaurar una copia: se FUSIONA (semanas y ejercicios que este teléfono no tiene); lo que ya tiene no se toca
function cgFusiona(d){const x=cgNorm(d);let n=0,mal=0;
  if(esObj(d)&&esObj(d.sem))for(const k in d.sem){const W=d.sem[k];if(esObj(W)&&esObj(W.refs))mal+=Object.keys(W.refs).length-Object.keys((x.sem[k]||{refs:{}}).refs).length}
  for(const k in x.sem){const W=x.sem[k];if(!cg.sem[k]){cg.sem[k]=W;n+=Object.keys(W.refs).length;continue}
    for(const key in W.refs)if(!cg.sem[k].refs[key]){cg.sem[k].refs[key]=W.refs[key];n++;if(W.prop[key])cg.sem[k].prop[key]=W.prop[key]}}
  if(!cg.intro&&x.intro)cg.intro=x.intro;cgMemo.k='';return {n,mal:Math.max(0,mal),sinEspacio:!cgGuarda()}}

/* ---------- la semana: se crea al abrirla. Sin semanas anteriores, vacía (todo «sin configurar»); si no, hereda la última con datos
   (cada referencia «de la semana pasada, sin confirmar») y guarda la revisión de lo que hiciste desde entonces (propuestas). ---------- */
const cgSemK=(t=Date.now())=>diaK(lunes(t));
function cgSem(){const k=cgSemK();if(cg.sem[k])return cg.sem[k];
  const pk=Object.keys(cg.sem).filter(x=>x<k&&Object.keys(cg.sem[x].refs).length).sort().pop(),W={refs:{},prop:{},ini:new Date().toISOString()};
  if(pk){const P=cg.sem[pk],a=Date.parse(pk+'T00:00:00'),b=lunes(Date.now());
    for(const key in P.refs){W.refs[key]={...P.refs[key],src:'heredada',ok:false};const pr=cgRevisa(P.refs[key],a,b);if(pr)W.prop[key]=pr}}
  cg.sem[k]=W;const ks=Object.keys(cg.sem).sort();while(ks.length>CG_SEM_MAX)delete cg.sem[ks.shift()];cgGuarda();return W}
const cgRef=(g,n,m)=>cgSem().refs[cgKey(g,n,m)]||null;
const cgRefK=k=>cgSem().refs[k]||null;
function cgSemPrev(){const k=cgSemK(),pk=Object.keys(cg.sem).filter(x=>x<k).sort().pop();return pk?cg.sem[pk]:null}
const cgTieneCarga=R=>!!R&&(R.tc==='corporal'||R.w!=null);
function cgEstado(R){if(!R)return 'pend';if(!cgTieneCarga(R))return R.cn==='calibrar'?'calibrar':'pend';if(!R.ok)return 'heredada';
  return R.r!=null&&R.rir&&R.rir!=='ns'?'completa':'carga'}

/* ---------- unidades: la ref está en su unidad; el motor trabaja en kg (lb → kg con 4 decimales, como el resto de la app) ---------- */
const cgAKg=(w,u)=>w==null||u==='nivel'?null:u==='lb'?Math.round(w*LB*1e4)/1e4:Math.round(w*100)/100;
const cgDeKg=(kg,u)=>kg==null?null:u==='lb'?Math.round(kg/LB*100)/100:Math.round(kg*100)/100;
const cgKgRef=R=>R.tc==='corporal'?0:cgAKg(R.w,R.u);
const cgClave=R=>{if(!cgTieneCarga(R))return null;if(R.u==='nivel')return 'n:'+R.w;const k=cgKgRef(R);return k>0?'k:'+Math.round(k*1000)/1000:'c'};
function cgTxtW(w,u,tc){if(tc==='corporal')return 'peso corporal';if(w==null)return 'sin carga';if(u==='nivel')return 'nivel '+cgN(w);
  return `${cgN(w)} ${u}${tc==='mancuerna'?' por mancuerna':tc==='extra'?' de lastre':''}`}
const cgTxt=R=>R?cgTxtW(R.w,R.u,R.tc):'';
// equipo y especificación por defecto según el nombre (se puede cambiar): mancuernas «por mancuerna», el resto carga total
function cgEquipo(n){const t=sinTilde(n);
  if(/lastrad/.test(t))return {eq:'corporal',tc:'extra'};if(esCorporal(n))return {eq:'corporal',tc:'corporal'};
  if(/polea|cuerda|jalon|pushdown|face pull|pallof|cruces/.test(t))return {eq:'polea',tc:'total'};
  if(/mancuerna|goblet|martillo|elevaciones laterales|concentrado|arana/.test(t))return {eq:'mancuernas',tc:'mancuerna'};
  if(/maquina|prensa|pec deck|hack|extension de cuadriceps|curl femoral|predicador|gemelo|talones|abductor|aductor/.test(t))return {eq:'maquina',tc:'total'};
  if(/barra|banca|militar|peso muerto|remo en t|sentadilla/.test(t))return {eq:'barra',tc:'total'};
  return {eq:'otro',tc:'total'}}
// pesos que se pueden elegir: los saltos reales de cada equipo (o el paso propio del ejercicio)
function cgOpc(u,tc,eq,paso){const o=[],add=(a,b,p)=>{for(let i=0,x=a;x<=b+1e-9;i++,x=a+i*p)o.push(Math.round(x*100)/100)};
  const minD=L=>2*Math.min(...L.map(Number).filter(x=>x>0));
  if(paso>0)add(paso,u==='nivel'?100:u==='lb'?600:300,paso);
  else if(u==='nivel')add(1,40,1);
  else if(u==='lb'){if(tc==='mancuerna'){add(2.5,20,2.5);add(25,150,5)}else if(tc==='extra'){add(2.5,20,2.5);add(25,200,5)}
    else if(eq==='barra')add(+CFG.barraLb||45,700,minD(CFG.discosLb&&CFG.discosLb.length?CFG.discosLb:DISCOS_LB));else add(5,500,5)}
  else{if(tc==='mancuerna'){add(1,10,1);add(12,40,2);add(42.5,80,2.5)}else if(tc==='extra'){add(1,10,1);add(12.5,100,2.5)}
    else if(eq==='barra')add(+CFG.barra||20,320,minD(CFG.discos&&CFG.discos.length?CFG.discos:DISCOS_STD));else add(2.5,250,2.5)}
  return o}
function cgOpcR(R,extra){const L=cgOpc(R.u,R.tc,R.eq,R.paso);for(const v of [R.w,extra])if(v!=null&&!L.some(x=>Math.abs(x-v)<1e-9))L.push(v);return L.sort((a,b)=>a-b)}
// siguiente salto real hacia arriba (d > 0) o hacia abajo
function cgPaso(R,d,w=R.w){if(w==null)return null;const L=cgOpcR(R);if(d>0){const x=L.find(v=>v>w+1e-9);return x==null?w:x}
  const y=L.filter(v=>v<w-1e-9).pop();return y==null?w:y}
function cgRedondea(kg,R){const w=cgDeKg(kg,R.u),L=cgOpcR(R);let b=L[0];for(const x of L)if(Math.abs(x-w)<Math.abs(b-w))b=x;return cgAKg(b,R.u)}

/* ---------- qué ejercicios entran en la encuesta: TODOS los de tus grupos (los de cada rutina) en hipertrofia, el compuesto de fuerza
   de cada grupo donde ya entrenaste fuerza o tienes su referencia, y lo que configuraste de otros ejercicios del catálogo ---------- */
let cgMemo={k:'',v:null};
function cgActivos(){const W=cgSem(),k=[hist.length,hist[0]&&hist[0].id,JSON.stringify(misEj).length,Object.keys(W.refs).join('·'),lesAplicada].join('|');
  if(cgMemo.k===k)return cgMemo.v;const L=[],ya=new Set();
  for(const g of Object.keys(CAT))(CAT[g].base||CAT[g].e).forEach(E=>{if(E.levy)return;const key=cgKey(g,E.n,'h');if(!ya.has(key)){ya.add(key);L.push({g,n:E.n,m:'h',key,act:true,r:E.r})}});
  for(const g in FZA_PRIN){if(!hist.some(h=>h.fza&&gDe(h)===g)&&!FZA_PRIN[g].some(n=>W.refs[cgKey(g,n,'f')]))continue;
    let P=null;try{P=planFuerza(g)}catch(e){}if(!P)continue;const n=P.e[0].n,key=cgKey(g,n,'f');if(!ya.has(key)){ya.add(key);L.push({g,n,m:'f',key,act:true,r:P.e[0].r})}}
  for(const key in W.refs)if(!ya.has(key)){const R=W.refs[key];ya.add(key);L.push({g:R.g,n:R.n,m:R.m,key,act:false,r:cgRango(R)})}
  cgMemo={k,v:L};return L}
const cgEjR=(g,n)=>{const E=(CAT[g]&&(CAT[g].base||CAT[g].e).find(x=>x.n===n))||(BASE[g]&&BASE[g].e.find(x=>x.n===n));return E?E.r:SUGEJ[n]?SUGEJ[n].r:'8–12'};
const cgRango=R=>R.ro||(R.m==='f'?'3–6':cgEjR(R.g,R.n));
const cgRirObj=R=>R.ri||(R.m==='f'?'2–3':'1–3');
function cgEstadoSem(){const L=cgActivos().filter(x=>x.act),W=cgSem();let conf=0,her=0,pend=0,cal=0;
  L.forEach(x=>{const e=cgEstado(W.refs[x.key]);if(e==='carga'||e==='completa')conf++;else if(e==='heredada')her++;else if(e==='calibrar')cal++;else pend++});
  const props=Object.entries(W.prop).filter(([k,p])=>!p.dec&&W.refs[k]).length;return {L,conf,her,pend,cal,tot:L.length,props}}

/* ---------- motor: carga de la estación, procedencia de cada serie y referencia completada en una sesión real ---------- */
function cgPrep(E){S.cgK='';S.kgPlan=null;S.niv=null;S.cgOne=null;S.rPre=1;if(!E||E.levy){S.kgSrc='';return}
  const m=S.fza&&E.fz==='p'?'f':'h',R=cgRef(grupo,E.n,m);
  if(!cgTieneCarga(R)){S.kgSrc=S.kg!=null?'hist':'';return}
  S.cgK=R.key;S.kgSrc='cal';if(R.u==='nivel'){S.kg=null;S.niv=R.w}else S.kg=cgKgRef(R);S.kgPlan=S.kg}
function cgFila(row,ph,E){if(ph==='ext'&&E.ext==='flat')return;   // la variante con el cuerpo no lleva carga
  const one=S.cgOne;
  if(one){row.kg=one.kg;if(one.niv!=null)row.niv=one.niv;row.kgSrc='mod';S.cgOne=null;if(S.kgPlan!=null)row.kgPlan=S.kgPlan}
  else{if(S.niv!=null)row.niv=S.niv;if(S.kgSrc)row.kgSrc=S.kgSrc;else if(row.kg!=null)row.kgSrc='man';if(S.kgSrc==='mod'&&S.kgPlan!=null)row.kgPlan=S.kgPlan}
  const R=S.cgK?cgRefK(S.cgK):null;if(R){row.tc=R.tc;row.u=R.u}
  if(S.fza&&E.fz==='p')row.m='f';
  if(ph!=='act'&&cargaDe(row,grupo)!==S.cgA)row.kgCambio=true;   // otra carga que la serie principal: no es fatiga ni recuperación
  if(ph==='act')cgCompleta(row,E)}
// primera serie principal del ejercicio hoy: completa la referencia que faltaba (reps y RIR medidos, o la carga anotada a mano).
// Solo con datos reales de esa serie: una reserva «4+» es una cota y no se guarda como reserva conocida.
function cgCompleta(row,E){if(S.ronda!==1||S.sets.some(r=>r.ej===E.n&&r.k==='act.'))return;
  const m=S.fza&&E.fz==='p'?'f':'h',key=cgKey(grupo,E.n,m),W=cgSem(),ck=cargaDe(row,grupo);if(ck==null)return;
  const rir=row.rir==='4+'?null:row.rir,R0=W.refs[key],t=new Date().toISOString();
  if(cgTieneCarga(R0)){if(cgClave(R0)!==ck||rir==null)return;if(R0.r!=null&&R0.rir&&R0.rir!=='ns'&&R0.cn!=='calibrar')return;
    Object.assign(R0,{r:parseInt(row.reps,10)||null,rir,cn:'sabe',obs:'sesion',t});cgGuarda();
    S.aviso=`Referencia de ${E.s} completada con esta serie: ${R0.r} reps con ${cgTxt(R0)}, reserva ${rir}`;return}
  if(row.kgSrc!=='man')return;   // sin carga configurada: solo una carga que anotaste tú sirve de referencia
  const eq=cgEquipo(E.n),u=row.niv!=null?'nivel':CFG.uni,tc=ck==='c'?'corporal':R0?R0.tc:eq.tc;
  const R=cgNormRef(key,{...(R0||{}),u,tc,eq:R0?R0.eq:eq.eq,w:ck==='c'?null:u==='nivel'?row.niv:cgDeKg(row.kg,u),r:rir!=null?parseInt(row.reps,10):null,rir,cn:'sabe',src:'manual',ok:true,obs:'sesion',t});
  if(!R)return;W.refs[key]=R;cgGuarda();cgMemo.k='';S.cgK=key;S.kgSrc='cal';S.kgPlan=S.kg;row.kgSrc='man';row.tc=R.tc;row.u=R.u;
  S.aviso=`Guardado como tu carga de referencia de esta semana en ${E.s}: ${cgTxt(R)}`}
function cgFzaPlan(g,e0){const R=cgRef(g,e0.n,'f');if(R&&R.ro){e0.r=R.ro;const [lo,hi]=rango(R.ro);e0.d=Math.round((lo+hi)/2)}}
// calentamiento: con la carga de trabajo ya conocida. Primer ejercicio con peso de la sesión: compuesto 50 % × 8, 70 % × 5, 85 % × 2;
// aislado 50 % × 10 y 75 % × 4. Ejercicios siguientes: compuesto 60 % × 5 y 80 % × 2 (el grupo ya está caliente); aislado, ninguna.
// Redondeado a los pesos que existen (tus mancuernas, discos o la placa de la máquina). Nunca cuenta como serie efectiva.
const CG_COMP=/press|sentadilla|peso muerto|remo|dominada|zancada|hip thrust|prensa|fondos|jalon|militar|banca|hack|goblet/;
function cgPlanCal(kg,E,prim){const comp=CG_COMP.test(sinTilde(E.n)),P=prim?(comp?[[.5,8],[.7,5],[.85,2]]:[[.5,10],[.75,4]]):comp?[[.6,5],[.8,2]]:null;if(!P)return null;
  const R=S.cgK?cgRefK(S.cgK):null,out=[];
  for(const [f,r] of P){const k=R&&R.u!=='nivel'&&R.tc!=='corporal'?cgRedondea(kg*f,R):redondeaKg(kg*f,E);if(k>0&&k<kg-1e-6&&!out.some(c=>Math.abs(c.kg-k)<1e-6))out.push({kg:k,reps:r,f})}
  return out.length?out:null}
// una aproximación que terminó cerca del fallo no era ligera: pasa a «aproximación intensa» y cuenta como serie (con su reserva real)
function cgReclasifica(rir){const i=S.sets.map(r=>r.k).lastIndexOf('cal.');if(i<0)return;const r=S.sets[i],R=parseInt(r.reps,10)||0;
  r.k='apr.';r.rir=String(rir);const c=efectiva(r);S.ef+=c;S.efE+=c;
  const e=Math.max(0,now()-S.t0);bump(R,R/(R+rir+1e-9),20,false);S.P0=S.P/Math.exp(-e/TP);S.C0=1-(1-S.C)/Math.exp(-e/S.tauC);   // fatiga de esa serie, sin reiniciar el descanso
  cgUI.recl=false;guardar(false);decir(`Reclasificada: cuenta como serie, ${ef1(c)} efectivas`);render()}

/* ---------- revisión semanal: compara las series de la semana CON LA MISMA CARGA de referencia y reserva conocida.
   Hipertrofia (rango lo–hi, RIR objetivo a–b): primera serie principal de cada sesión. Sube un salto real si llegaste a hi con al menos
   a en reserva en 2 sesiones (o en una con más de b: te sobró); baja si no llegaste a lo al fallo y ninguna sesión llegó; si no, mantén
   (aún hay margen en repeticiones). Fuerza: todas las series principales; sube si todas llegan a hi con a en reserva (2 o más series),
   baja si alguna se quedó por debajo de lo al fallo. Con molestias o en semana de descarga, mantener. Sin series comparables: recalibrar.
   No sube por el paso del tiempo: solo por rendimiento. La técnica no se registra, así que no se valora. ---------- */
function cgModFila(r,h,g){if(r.m==='f')return 'f';const ej=r.ej||nomFila(r,g);return h.fza&&FZA_PRIN[g]&&FZA_PRIN[g].includes(ej)?'f':'h'}
function cgRevisa(R,a,b){const ck=cgClave(R);
  if(!ck)return {acc:'recal',w:null,de:null,por:'sin carga de referencia: configúrala',n:0,dec:null};
  const [lo,hi]=rango(cgRango(R)),[ra,rb]=rango(cgRirObj(R)),comp=[];let otra=0,sin=0,mol=0,desc=0,ef=0;
  hist.filter(h=>{const t=Date.parse(h.start);return t>=a&&t<b&&gDe(h)===R.g}).sort((x,y)=>Date.parse(x.start)-Date.parse(y.start)).forEach(h=>{
    const filas=(h.sets||[]).filter(r=>(r.ej||nomFila(r,R.g))===R.n&&cgModFila(r,h,R.g)===R.m);if(!filas.length)return;
    ef+=filas.reduce((s,r)=>s+efectiva(r),0);if(filas.some(r=>r.mol))mol++;if(h.desc)desc++;
    const pr=filas.filter(r=>r.k==='act.'),usa=R.m==='f'?pr:pr.slice(0,1);
    usa.forEach(r=>{const c=cargaDe(r,R.g);if(c==null||r.rir==='—'){sin++;return}if(c!==ck){otra++;return}
      comp.push({R:parseInt(r.reps,10)||0,rir:rirN(r.rir),t:Date.parse(h.start)})})});
  const W0=R.w,base=`${comp.length} ${comp.length===1?'serie comparable':'series comparables'} con ${cgTxt(R)}`+(comp.length?` (${comp.map(c=>`${c.R} reps · reserva ${c.rir}`).join('; ')})`:'')
    +(otra?` · ${otra} con otra carga`:'')+(sin?` · ${sin} sin carga o reserva anotada`:'')+` · ${ef1(ef)} series efectivas del ejercicio`;
  const P=(acc,w,txt)=>({acc,w,de:W0,por:`${txt}. ${base}.`,n:comp.length,dec:null});
  if(!comp.length)return P('recal',null,'no hay series con la carga de referencia y reserva conocida desde la última revisión: no hay datos para decidir');
  if(mol)return P('mantener',W0,`anotaste molestia en ${mol} ${mol===1?'sesión':'sesiones'}: mejor no subir hasta que pase`);
  if(desc)return P('mantener',W0,'fue semana de descarga: no se progresa');
  const sig=cgPaso(R,1),ant=cgPaso(R,-1),corp=R.tc==='corporal';
  if(R.m==='f'){const todas=comp.length>=2&&comp.every(c=>c.R>=hi&&c.rir>=ra),baja=comp.some(c=>c.R<lo&&c.rir===0);
    if(todas)return corp?P('subir',null,`todas tus series llegaron a ${hi} reps con ${ra}+ en reserva: añade lastre o una variante más difícil`):P('subir',sig,`todas tus series llegaron a ${hi} reps con ${ra} o más en reserva: sube al siguiente salto (${cgTxtW(sig,R.u,R.tc)})`);
    if(baja)return corp?P('bajar',null,`alguna serie se quedó por debajo de ${lo} reps sin reserva: usa una variante más fácil`):P('bajar',ant,`alguna serie se quedó por debajo de ${lo} reps sin reserva: baja un salto (${cgTxtW(ant,R.u,R.tc)})`);
    return P('mantener',W0,`dentro del rango ${lo}–${hi}: repite la carga y busca ${hi} reps en todas las series con ${ra}–${rb} en reserva`)}
  const top=comp.filter(c=>c.R>=hi&&c.rir>=ra).length,sobra=comp.filter(c=>c.R>=hi&&c.rir>rb).length,llega=comp.filter(c=>c.R>=lo).length,fallo=comp.filter(c=>c.R<lo&&c.rir===0).length;
  if(top>=2||sobra>=1){const t=sobra?`llegaste a ${hi} reps (el tope de ${lo}–${hi}) con más de ${rb} en reserva`:`llegaste a ${hi} reps (el tope de ${lo}–${hi}) con ${ra} o más en reserva en ${top} sesiones`;
    return corp?P('subir',null,`${t}: añade lastre o pasa a una variante más difícil`):P('subir',sig,`${t}: sube un salto pequeño (${cgTxtW(sig,R.u,R.tc)})`)}
  if(fallo&&!llega)return corp?P('bajar',null,`no llegaste a ${lo} reps al fallo: usa una variante más fácil`):P('bajar',ant,`no llegaste a ${lo} reps al fallo: baja un salto (${cgTxtW(ant,R.u,R.tc)})`);
  const mx=Math.max(...comp.map(c=>c.R));
  return P('mantener',W0,`aún hay margen en repeticiones (mejor: ${mx} reps): mantén la carga y busca ${hi} con ${ra}–${rb} en reserva`)}
function cgDecide(key,dec){const W=cgSem(),P=W.prop[key],R=W.refs[key];if(!P||!R)return;const t=new Date().toISOString();
  if(dec==='mod'){P.dec='mod';cgUI.sub='enc';cgUI.vista='uno';cgUI.sel=key;cgGuarda();renderCargas();return}
  if(dec==='ok'){if(P.w!=null&&R.tc!=='corporal'&&(R.w==null||Math.abs(P.w-R.w)>1e-9)){R.w=P.w;R.r=null;R.rir=null;delete R.obs}R.src='sugerida';R.ok=true}   // nueva carga: sus reps se miden de nuevo
  else{R.ok=true;if(R.src==='heredada')R.src='confirmada'}
  P.dec=dec;R.t=t;cgGuarda();cgMemo.k='';renderCargas();render()}

/* ---------- edición (encuesta): cada selección se guarda al momento ---------- */
let cgUI={sub:'enc',vista:'lista',agr:'g',q:'',fg:'',sel:'',otro:{},avU:{},abiertas:{},conf:0,peso:{abierto:false,v:null,otro:false},recl:false,msg:''};
// unidad por defecto de un ejercicio nuevo: la última que elegiste en la encuesta (kg o lb); si aún no, la de Ajustes
function cgUltU(){let u=null,t='';for(const R of Object.values(cgSem().refs))if((R.u==='kg'||R.u==='lb')&&R.t&&R.t>t){t=R.t;u=R.u}return u||(CFG.uni==='lb'?'lb':'kg')}
function cgBase(x){const W=cgSem(),R=W.refs[x.key];if(R)return R;const e=cgEquipo(x.n),corp=e.tc==='corporal';
  return {key:x.key,g:x.g,n:x.n,m:x.m,u:cgUltU(),tc:e.tc,eq:e.eq,w:null,r:null,rir:null,cn:null,ro:null,ri:null,paso:null,src:'manual',ok:false,t:null,nuevo:true,corp}}
function cgSet(key,campo,v){const W=cgSem(),p=key.split('|'),x={key,g:p[0],n:p[1],m:p[2]},R0=W.refs[key],b={...cgBase(x)};delete b.nuevo;delete b.corp;
  const antes=R0?{...R0}:null;
  if(campo==='esp'){const [u,tc]=String(v).split('|');if(tc==='corporal'){b.tc='corporal';b.w=null}else{if(antes&&antes.u!==u&&antes.w!=null)cgUI.avU[key]=`${antes.u}→${u}`;b.u=u;b.tc=tc;if(u==='nivel')b.eq='maquina'}}
  else if(campo==='w')b.w=v===''||v==null?null:+v;
  else if(campo==='r')b.r=v===''||v==null?null:+v;
  else if(campo==='rir')b.rir=v||null;
  else if(campo==='cn')b.cn=v||null;
  else if(campo==='eq')b.eq=v;
  else if(campo==='ro')b.ro=v||null;
  else if(campo==='ri')b.ri=v||null;
  else if(campo==='paso')b.paso=v?+v:null;
  // la carga cambió: las reps y la reserva de referencia eran de la otra carga
  if(campo==='w'&&antes&&antes.w!=null&&b.w!=null&&Math.abs(antes.w-b.w)>1e-9&&antes.r!=null){b.r=null;b.rir=null;delete b.obs;cgUI.msg=`${x.n}: al cambiar la carga se vaciaron reps y RIR (eran de ${cgTxt(antes)})`}
  b.src=!R0?'manual':R0.src==='heredada'?'modificada':R0.src==='confirmada'||R0.src==='sugerida'?'modificada':R0.src;b.ok=true;b.t=new Date().toISOString();
  const R=cgNormRef(key,b);if(!R)return;W.refs[key]=R;cgGuarda();cgMemo.k=''}
// un toque: acepta lo heredado (o lo que ya hay) tal cual
function cgConfirma(key){const R=cgRefK(key);if(!R)return;R.ok=true;if(R.src==='heredada')R.src='confirmada';R.t=new Date().toISOString();cgGuarda()}
// datos previos de un ejercicio sin referencia: tu última serie principal con carga conocida (dato real, no inventado)
function cgPrevio(x){const W=cgSem();if(W.refs[x.key])return null;const Wp=cgSemPrev(),Rp=Wp&&Wp.refs[x.key];if(Rp)return {de:'semana',R:Rp};
  for(const h of hist){if(gDe(h)!==x.g)continue;const r=(h.sets||[]).find(r=>(r.ej||nomFila(r,x.g))===x.n&&r.k==='act.'&&cargaDe(r,x.g)!=null&&cgModFila(r,h,x.g)===x.m);
    if(r){const e=cgEquipo(x.n),u=r.niv!=null?'nivel':(r.u&&r.u!=='nivel'?r.u:CFG.uni),tc=cargaDe(r,x.g)==='c'?'corporal':r.tc||e.tc;
      return {de:'hist',t:Date.parse(h.start),R:{u,tc,eq:e.eq,w:tc==='corporal'?null:u==='nivel'?r.niv:cgDeKg(r.kg,u),r:parseInt(r.reps,10)||null,rir:/\+/.test(r.rir)||r.rir==='—'?null:r.rir}}}}
  return null}
function cgUsaPrevio(key){const p=key.split('|'),x={key,g:p[0],n:p[1],m:p[2]},pv=cgPrevio(x);if(!pv)return;const e=cgEquipo(x.n),P=pv.R;
  const R=cgNormRef(key,{u:P.u,tc:P.tc,eq:P.eq||e.eq,w:P.w,r:P.r,rir:P.rir,cn:pv.de==='semana'?P.cn:'sabe',ro:P.ro,ri:P.ri,paso:P.paso,src:pv.de==='semana'?'confirmada':'sugerida',ok:true,t:new Date().toISOString()});
  if(R){cgSem().refs[key]=R;cgGuarda();cgMemo.k=''}}
function cgConfirmaTodos(){const W=cgSem();let n=0;cgActivos().forEach(x=>{const R=W.refs[x.key];if(R&&cgTieneCarga(R)&&!R.ok){R.ok=true;if(R.src==='heredada')R.src='confirmada';R.t=new Date().toISOString();n++}});
  cgGuarda();cgMemo.k='';return n}

/* ---------- textos para otras pantallas ---------- */
function cgCargaS(){const R=S.cgK&&cgRefK(S.cgK);const one=S.cgOne,kg=one?one.kg:S.kg,niv=one?one.niv:S.niv;
  if(!R)return kg!=null?kgTxt(kg):niv!=null?'nivel '+cgN(niv):'sin carga';
  return cgTxtW(R.u==='nivel'?niv:cgDeKg(kg,R.u),R.u,R.tc)+(one?' (solo la próxima serie)':'')}
function cgTxtEj(g,n){const R=cgRef(g,n,'h');return cgTieneCarga(R)?cgTxt(R)+(R.ok?'':' (por confirmar)'):'carga sin configurar'}
function cgResumenTxt(){const s=cgEstadoSem();return `Mis cargas (semana del ${cgSemK()}): ${s.conf} de ${s.tot} ejercicios configurados · ${s.her} heredados sin confirmar · ${s.pend} sin configurar · ${s.cal} por calibrar · ${s.props} propuestas pendientes`}
const cgFSem=()=>new Date(lunes(Date.now())).toLocaleDateString('es-DO',{weekday:'long',day:'numeric',month:'short'});

/* ---------- avisos: Reloj (en reposo) y Hoy ---------- */
function cgBannerHTML(){const s=cgEstadoSem();if(!s.tot||(s.conf===s.tot&&!s.props))return '';const primera=!Object.keys(cgSem().refs).length,pc=Math.round(100*s.conf/s.tot);
  return `<b>${primera?'Configurar las cargas de esta semana':s.her?'Confirma las cargas de esta semana':s.conf<s.tot?'Configurar cargas de esta semana':'Propuestas de progresión'}</b>
    <span>${s.conf} de ${s.tot} ejercicios configurados${s.her?` · ${s.her} de la semana pasada por confirmar`:''}${s.props?` · ${s.props} ${s.props===1?'propuesta':'propuestas'} para revisar`:''}</span>
    <div class="cgbar" aria-hidden="true"><i style="width:${pc}%"></i></div>
    <button type="button" class="btn2" data-cgir="1">${primera?'Configurar ahora':'Revisar mis cargas'}</button>`}
let cgBanK='';
function cgRenderAvisos(){const a=$('cgAviso'),b=$('cgAvisoHoy');const ver=S.st==='idle'&&rutPos===0;
  const k=ver?[cgSemK(),hist.length,Object.values(cgSem().refs).map(R=>R.key+R.ok+R.w).join(),Object.values(cgSem().prop).map(p=>p.dec).join(),JSON.stringify(misEj).length].join('|'):'';
  if(k===cgBanK)return;cgBanK=k;const h=ver?cgBannerHTML():'';
  for(const el of [a,b])if(el){el.hidden=!h;if(el.innerHTML!==h)el.innerHTML=h}}

/* ---------- «Cambiar peso» durante la sesión (y la carga de cada ejercicio en reposo) ---------- */
function cgUnidadS(){const R=S.cgK&&cgRefK(S.cgK);if(R)return {u:R.u,tc:R.tc==='corporal'?'extra':R.tc,eq:R.eq,paso:R.paso,R};
  const E=est(),e=cgEquipo(E.n);return {u:CFG.uni==='lb'?'lb':'kg',tc:esBarra(E)?'total':e.tc==='corporal'?'extra':e.tc,eq:esBarra(E)?'barra':e.eq,paso:null,R:null}}
function cgWAhora(U){const one=S.cgOne;return U.u==='nivel'?(one?one.niv:S.niv):cgDeKg(one?one.kg:S.kg,U.u)}
let cgPesoK='';
function cgRenderPeso(){cgRenderAvisos();const el=$('cgPeso');if(!el)return;const E=est();let h='';
  if(cgUI.peso.abierto&&cgUI.peso.k!==S.id+'|'+S.sec)cgUI.peso.abierto=false;   // otro ejercicio: el cambio a medias no se arrastra
  if(tab==='reloj'&&S.st==='idle'&&!pausaInicio()&&!ssSel.on){const L=CAT[grupo].e.filter(x=>!x.levy),F=fzaActiva()?planFuerza(grupo):null;
    const filas=(F?F.e.map(x=>({n:x.n,m:x.fz==='p'?'f':'h'})):L.map(x=>({n:x.n,m:'h'}))).map(x=>{const R=cgRef(grupo,x.n,x.m);
      return `<li><span>${esc(x.n)}${x.m==='f'?' <span class="muted">· fuerza</span>':''}</span><b>${cgTieneCarga(R)?esc(cgTxt(R))+(R.ok?'':' <span class="muted">(por confirmar)</span>'):'<span class="muted">sin configurar</span>'}</b></li>`}).join('');
    h=`<div class="cgpeso"><div class="top"><span class="lbl">Cargas de esta semana · ${esc(CAT[grupo].n)}</span><button type="button" class="lnk" data-cgir="1">Mis cargas</button></div><ul class="cgl">${filas}</ul></div>`}
  else if(tab==='reloj'&&enCurso()&&E&&!E.levy&&!(S.st==='work'&&(S.phase==='hold'||S.phase==='vac'))&&!(S.phase==='ext'&&E.ext==='flat')&&S.phase!=='vac'){
    const U=cgUnidadS(),P=cgUI.peso,legacy=S.st==='report'&&!S.cgK,mod=S.fza&&E.fz==='p'?'Fuerza':'Hipertrofia';
    const src={cal:'de tu configuración semanal',mod:`cambiada hoy${S.kgPlan!=null&&U.R?' (configurada: '+cgTxtW(cgDeKg(S.kgPlan,U.u),U.u,U.R.tc)+')':''}`,man:'anotada a mano',hist:'sugerida por tu historial'}[S.kgSrc]||'sin anotar';
    // v32: la carga va en grande dentro del reloj; aquí, una línea con su origen y el botón
    const enReloj=!$('padCarga').hidden;   // si la carga ya está en grande en el reloj, aquí solo su origen
    h=`<div class="cgpeso"><div class="cgfila1"><span class="cgc"><b>${esc(E.s)}</b> · ${mod.toLowerCase()}${enReloj?'':` · <span class="cgsr">${esc(cgCargaS())}</span>`} <span class="muted">· ${esc(src)}</span></span>${!legacy&&!P.abierto?'<button type="button" class="btn2" data-cgp="abrir">Cambiar peso</button>':''}</div>`;
    if(S.cgK&&S.kg>0&&esBarra(E)&&S.st==='report'){const k=S.cgOne?S.cgOne.kg:S.kg,d=discTxt(k,E);if(d)h+=`<p class="hint">${esc(d)}</p>${discSVG(k,E)}`}
    if(legacy)h+=`<p class="hint">Este ejercicio no tiene carga configurada esta semana: anótala abajo (se guarda como referencia) o <button type="button" class="lnk" data-cgir="1">configúrala en Mis cargas</button>.</p>`;
    else if(!P.abierto){}
    else{const L=cgOpc(U.u,U.tc,U.eq,U.paso),v=P.v;if(v!=null&&!L.some(x=>Math.abs(x-v)<1e-9)){L.push(v);L.sort((a,b)=>a-b)}
      const rep=S.st==='report';
      h+=`<div class="cgf"><button type="button" class="cgpm" data-cgp="menos" aria-label="Un salto menos">−</button>
        <select class="cgw" data-cgp="sel" aria-label="Nuevo peso">${v==null?'<option value="">— elige</option>':''}${L.map(x=>`<option value="${x}"${v!=null&&Math.abs(x-v)<1e-9?' selected':''}>${esc(cgTxtW(x,U.u,U.tc))}</option>`).join('')}<option value="__otro">Otro peso…</option></select>
        <button type="button" class="cgpm" data-cgp="mas" aria-label="Un salto más">+</button></div>
        ${P.otro?`<input class="in" data-cgp="otro" inputmode="decimal" placeholder="Otro peso (${U.u==='nivel'?'nivel':U.u})" autocomplete="off">`:''}
        <p class="lbl" style="margin:4px 0 0">Aplicar a</p>
        <div class="cgscope"><button type="button" data-cgp="una">${rep?'Solo esta serie':'Solo la próxima serie'}</button><button type="button" data-cgp="resto">${rep?'Esta y el resto de':'El resto de'} ${esc(E.s)} hoy</button><button type="button" data-cgp="semana">Además, mi referencia de esta semana</button></div>
        <button type="button" class="lnk" data-cgp="cancelar">Cancelar</button>`}
    if(S.st==='rest'&&S.calRest&&S.sets.some(r=>r.k==='cal.')){h+=cgUI.recl?`<p class="hint">¿Cuántas te quedaban en reserva en esa aproximación?</p><div class="cgrir">${[0,1,2,3].map(r=>`<button type="button" data-cgrec="${r}">${r}</button>`).join('')}</div><button type="button" class="lnk" data-cgrec="no">Cancelar</button>`
      :`<button type="button" class="lnk" data-cgrec="abrir">Esa aproximación fue casi al fallo</button>`}
    h+='</div>'}
  const k=h;if(k===cgPesoK)return;cgPesoK=k;el.hidden=!h;el.innerHTML=h}
function cgAplicaPeso(alc){const P=cgUI.peso,U=cgUnidadS(),v=P.v,E=est();if(v==null||!E)return;
  const kg=U.u==='nivel'?null:cgAKg(v,U.u),niv=U.u==='nivel'?v:null,rA=S.rPre||1,txt=cgTxtW(v,U.u,U.tc);
  if(alc==='una')S.cgOne={kg,niv};
  else{S.kg=kg;S.niv=niv;S.cgOne=null;S.kgSrc=S.cgK?'mod':'man';
    if(alc==='semana'){const W=cgSem(),m=S.fza&&E.fz==='p'?'f':'h',key=cgKey(grupo,E.n,m),old=W.refs[key],e=cgEquipo(E.n);
      const R=cgNormRef(key,{...(old||{u:U.u,tc:U.tc,eq:U.eq,cn:'sabe'}),u:U.u,tc:U.tc,w:v,...(old&&old.w!=null&&Math.abs(old.w-v)<1e-9?{}:{r:null,rir:null}),src:old?'modificada':'manual',ok:true,t:new Date().toISOString()});
      if(R){W.refs[key]=R;cgGuarda();cgMemo.k='';if(!S.cgK){S.cgK=key;S.kgSrc='cal';S.kgPlan=kg}}}}
  // la mini-serie que viene se recalcula para la nueva carga (Epley con reserva); con nivel o sin cargas conocidas no se puede estimar
  let rec='';if(S.phase==='myo'&&S.st!=='report'){const nk=S.cgOne?S.cgOne.kg:S.kg,r=ratioCarga(S.kgA,nk,S.RTF);
    if(Math.abs(r-rA)>1e-9){S.target=Math.max(1,Math.round(S.target*r/rA));S.rPre=r;rec=`; el objetivo de la mini-serie pasa a ${S.target} reps`}
    else if(nk!==S.kgA||(S.cgOne&&S.cgOne.niv!==S.niv))rec='; el objetivo no se puede recalcular sin las dos cargas en kg o lb'}
  S.aviso=`Carga ${alc==='una'?(S.st==='report'?'de esta serie':'de la próxima serie'):alc==='resto'?'del resto de '+E.s+' hoy':'de '+E.s+' hoy y en tu referencia'}: ${txt}. Las series con otra carga no se comparan directamente con las anteriores${rec}`;
  P.abierto=false;P.otro=false;cgPesoK='';decir(S.aviso);render()}
// clics y cambios
document.addEventListener('click',e=>{const b=e.target.closest('[data-cgir],[data-cgp],[data-cgrec],[data-cgs],[data-cgv],[data-cg],[data-cgw],[data-cgd],[data-cgcomp]');if(!b)return;const d=b.dataset;
  if(d.cgir!=null){irA('cargas');return}
  if(d.cgcomp){cgUI.sub='enc';cgUI.vista='uno';cgUI.sel=d.cgcomp;cgUI.fg='';cgUI.q='';renderCargas();window.scrollTo(0,0);return}
  if(d.cgrec!=null){if(d.cgrec==='abrir')cgUI.recl=true;else if(d.cgrec==='no')cgUI.recl=false;else{cgReclasifica(+d.cgrec);return}cgPesoK='';render();return}
  if(d.cgp){const P=cgUI.peso,U=cgUnidadS(),a=d.cgp;
    if(a==='abrir'){P.abierto=true;P.otro=false;P.v=cgWAhora(U);P.k=S.id+'|'+S.sec}else if(a==='cancelar'){P.abierto=false;P.otro=false}
    else if(a==='menos'||a==='mas'){const L=cgOpc(U.u,U.tc,U.eq,U.paso);if(P.v==null)P.v=L[0];else{const x=a==='mas'?L.find(v=>v>P.v+1e-9):L.filter(v=>v<P.v-1e-9).pop();if(x!=null)P.v=x}}
    else if(['una','resto','semana'].includes(a)){cgAplicaPeso(a);return}
    else return;cgPesoK='';render();return}
  if(d.cgs){cgUI.sub=d.cgs;renderCargas();return}
  if(d.cgv){cgUI.vista=d.cgv;renderCargas();return}
  if(d.cgd){const [k,dec]=[b.closest('[data-k]').dataset.k,d.cgd];if(dec==='todas'){Object.keys(cgSem().prop).forEach(x=>{const p=cgSem().prop[x];if(!p.dec&&cgSem().refs[x])cgDecide(x,'ok')});return}cgDecide(k,dec);return}
  if(d.cgw){const a=d.cgw;if(a==='m'){const p=cgUI.sel.split('|');cgUI.sel=cgKey(p[0],p[1],b.dataset.m);renderCargas();return}
    if(a==='rir'||a==='cn'){cgSet(cgUI.sel,a,b.dataset.v);renderCargas();return}
    if(a==='menos'||a==='mas'){const R=cgBase(cgKeyObj(cgUI.sel)),L=cgOpcR(R);const x=R.w==null?L[0]:a==='mas'?cgPaso(R,1):cgPaso(R,-1);if(x!=null)cgSet(cgUI.sel,'w',x);renderCargas();return}
    if(a==='pend'){const x=cgSigPend(cgUI.sel);if(x){cgUI.sel=x.key;if(cgUI.fg&&x.g!==cgUI.fg)cgUI.fg=''}else cgUI.msg='No queda ningún ejercicio pendiente.';renderCargas();window.scrollTo(0,0);return}
    if(a==='ant'||a==='sig'){const L=cgLista(),i=L.findIndex(x=>x.key===cgUI.sel),j=Math.max(0,Math.min(L.length-1,(i<0?0:i)+(a==='sig'?1:-1)));if(L[j])cgUI.sel=L[j].key;renderCargas();window.scrollTo(0,0);return}
    if(a==='usar'){cgUsaPrevio(cgUI.sel);renderCargas();return}
    if(a==='confirmar'){cgConfirma(cgUI.sel);renderCargas();return}
    if(a==='quitar'){const W=cgSem();if(cgUI.conf!==2){cgUI.conf=2;renderCargas();return}cgUI.conf=0;delete W.refs[cgUI.sel];delete W.prop[cgUI.sel];cgGuarda();cgMemo.k='';renderCargas();return}
    if(a==='luego'){cgUI.msg='';irA('reloj');return}
    if(a==='todos'){if(cgUI.conf!==1){cgUI.conf=1;renderCargas();setTimeout(()=>{if(cgUI.conf===1){cgUI.conf=0;if(tab==='cargas')renderCargas()}},4000);return}
      cgUI.conf=0;const n=cgConfirmaTodos();cgUI.msg=n?`${n} ${n===1?'ejercicio confirmado':'ejercicios confirmados'} con sus cargas actuales.`:'No había nada por confirmar: lo pendiente necesita una carga.';renderCargas();render();return}
    return}
  if(d.cg){const row=b.closest('[data-k]');if(!row)return;const k=row.dataset.k,a=d.cg;
    if(a==='menos'||a==='mas'){const R=cgBase(cgKeyObj(k)),L=cgOpcR(R);const x=R.w==null?L[0]:a==='mas'?cgPaso(R,1):cgPaso(R,-1);if(x!=null)cgSet(k,'w',x)}
    else if(a==='abrir')cgUI.abiertas[k]=true;else if(a==='cerrar')delete cgUI.abiertas[k];
    else if(a==='usar')cgUsaPrevio(k);else if(a==='confirmar'){cgConfirma(k);cgPintaFila(k,true);return}else if(a==='editar'){cgUI.vista='uno';cgUI.sel=k;renderCargas();window.scrollTo(0,0);return}
    cgPintaFila(k);return}});
const cgKeyObj=k=>{const p=k.split('|');return {key:k,g:p[0],n:p[1],m:p[2]}};
document.addEventListener('change',e=>{const s=e.target;
  if(s.matches&&s.matches('[data-cgp="sel"]')){const P=cgUI.peso;if(s.value==='__otro'){P.otro=true}else if(s.value!=='')P.v=+s.value;cgPesoK='';render();return}
  if(s.matches&&s.matches('[data-cgp="otro"]')){const v=parseFloat(s.value.replace(',','.')),U=cgUnidadS();if(v>0&&v<=(U.u==='nivel'?100:U.u==='lb'?1100:500)){cgUI.peso.v=Math.round(v*100)/100;cgUI.peso.otro=false;cgPesoK='';render()}return}
  const c=s.closest&&s.closest('[data-cgf]');if(!c)return;const row=s.closest('[data-k]'),k=row?row.dataset.k:cgUI.sel,f=c.dataset.cgf;
  if(f==='w'&&s.value==='__otro'){cgUI.otro[k]=true;cgRepinta(k);return}
  if(f==='r'&&s.value==='__mas'){cgUI.otro[k+'|r']=true;cgRepinta(k);return}
  if(f==='wotro'||f==='rotro'){const v=parseFloat(String(s.value).replace(',','.')),R=cgBase(cgKeyObj(k)),max=f==='rotro'?200:R.u==='nivel'?100:R.u==='lb'?1100:500;
    if(v>0&&v<=max){cgSet(k,f==='wotro'?'w':'r',f==='rotro'?Math.round(v):Math.round(v*100)/100);delete cgUI.otro[f==='wotro'?k:k+'|r']}cgRepinta(k);return}
  if(f==='g'){cgUI.fg=s.value;const L=cgLista();if(L.length&&!L.some(x=>x.key===cgUI.sel))cgUI.sel=L[0].key;renderCargas();return}
  if(f==='ej'){cgUI.sel=s.value;renderCargas();return}
  if(f==='agr'){cgUI.agr=s.value;renderCargas();return}
  cgSet(k,f,s.value);cgRepinta(k)});
document.addEventListener('input',e=>{const s=e.target;if(!s.matches||!s.matches('[data-cgq]'))return;cgUI.q=s.value;cgFiltra()});
const cgRepinta=k=>{if(cgUI.vista==='uno')renderCargas();else cgPintaFila(k)};

/* ---------- pantalla «Mis cargas» ---------- */
function cgLista(){const q=sinTilde(cgUI.q).trim();return cgActivos().filter(x=>(!cgUI.fg||x.g===cgUI.fg)&&(!q||sinTilde(x.n).includes(q)))}
function cgFiltra(){const q=sinTilde(cgUI.q).trim();
  document.querySelectorAll('#vCargasC .cgrow').forEach(r=>{r.hidden=!!q&&!r.dataset.q.includes(q)});
  document.querySelectorAll('#vCargasC .cgsec').forEach(s=>{s.hidden=![...s.querySelectorAll('.cgrow')].some(r=>!r.hidden)});
  const sel=document.querySelector('#vCargasC [data-cgf="ej"]');if(sel){const L=cgLista();sel.innerHTML=cgEjOpts(L)}}
const cgSel=(f,ops,v,lbl)=>`<label class="cgl2"><span>${lbl}</span><select data-cgf="${f}" aria-label="${esc(lbl)}">${ops.map(([k,n])=>`<option value="${esc(k)}"${String(k)===String(v??'')?' selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
function cgPesoOps(R){const L=cgOpcR(R);return [['','— sin dato'],...L.map(x=>[x,cgTxtW(x,R.u,R.tc)]),['__otro','Otro peso…']]}
const cgRepsOps=R=>{const o=[['','—']];for(let i=1;i<=30;i++)o.push([i,String(i)]);if(R.r>30)o.push([R.r,String(R.r)]);o.push(['__mas','Más de 30…']);return o};
const cgRirOps=[['','—'],['0','0'],['1','1'],['2','2'],['3','3'],['4','4'],['5+','5 o más'],['ns','No sé']];
const cgCnOps=[['','—'],['sabe','Lo sé'],['aprox','Es aproximado'],['calibrar','Necesito calibrarlo']];
const cgEspV=R=>R.tc==='corporal'?'-|corporal':`${R.u}|${R.tc}`;
function cgPrevHTML(x,R,acc){const pv=cgPrevio(x);if(!pv)return '';const P=pv.R,t=`${cgTxtW(P.w,P.u,P.tc)}${P.r?` × ${P.r}`:''}${P.rir?` · RIR ${P.rir==='ns'?'no sé':P.rir}`:''}`;
  return `<p class="cgprev">${pv.de==='semana'?'Semana pasada':'Tu última serie ('+new Date(pv.t).toLocaleDateString('es-DO',{day:'numeric',month:'short'})+')'}: <b>${esc(t)}</b> <button type="button" class="btn2" data-${acc}="usar">Usar estos datos</button></p>`}
function cgPropHTML(key){const W=cgSem(),P=W.prop[key],R=W.refs[key];if(!P||P.dec||!R)return '';
  const de=cgTxtW(P.de,R.u,R.tc),a=P.w!=null?cgTxtW(P.w,R.u,R.tc):'';
  return `<div class="cgprop" data-k="${esc(key)}"><span><b>${esc(CG_ACC[P.acc])}</b>${P.acc==='subir'||P.acc==='bajar'?(a?`: ${esc(de)} → <b>${esc(a)}</b>`:''):''}</span><span class="hint">Por qué: ${esc(P.por)}</span>
    <div class="cgf"><button type="button" class="btn2" data-cgd="ok">${P.acc==='subir'||P.acc==='bajar'?'Aprobar':'De acuerdo'}</button><button type="button" class="btn2" data-cgd="mod">Modificar</button><button type="button" class="btn2" data-cgd="no">Rechazar</button></div></div>`}
function cgAvisos(key,R){const out=[],Wp=cgSemPrev(),Rp=Wp&&Wp.refs[key];
  if(cgUI.avU[key])out.push(`Cambiaste la unidad (${cgUI.avU[key]}): el número no se convierte. Comprueba que ${cgTxt(R)} es correcto.`);
  if(Rp&&Rp.u===R.u&&Rp.tc===R.tc&&Rp.w>0&&R.w!=null&&Math.abs(R.w-Rp.w)/Rp.w>.3)out.push(`Salto grande frente a la semana pasada (${cgTxt(Rp)} → ${cgTxt(R)}): comprueba la unidad y si es por mancuerna o en total.`);
  if(Rp&&Rp.w!=null&&R.w!=null&&(Rp.u!==R.u||Rp.tc!==R.tc))out.push(`La semana pasada era ${cgTxt(Rp)}: ojo, otra unidad o especificación.`);
  return out.map(t=>`<p class="cgwarn">⚠ ${esc(t)}</p>`).join('')}
// resumen de una referencia en una línea: «40 lb por mancuerna × 10 reps · RIR 2 · lo sé»
const cgResTxt=R=>`${cgTxt(R)}${R.r!=null?` × ${R.r} reps`:''}${R.rir?` · RIR ${R.rir==='ns'?'no sé':R.rir}`:''}${R.cn?` · ${CG_CNN[R.cn].toLowerCase()}`:''}`;
// select sin etiqueta visible (la fila es compacta): el nombre va en aria-label y en la primera opción
const cgSelN=(f,ops,v,lbl)=>`<select data-cgf="${f}" aria-label="${esc(lbl)}">${ops.map(([k,n])=>`<option value="${esc(k)}"${String(k)===String(v??'')?' selected':''}>${esc(n)}</option>`).join('')}</select>`;
// Fila de la lista: lo ya configurado (o heredado) se pliega en una línea con «Confirmar» o «Cambiar»; lo pendiente se abre con sus
// desplegables. Así 20–30 ejercicios caben sin desplazarse de más.
function cgFilaHTML(x){const W=cgSem(),R0=W.refs[x.key],R=cgBase(x),e=cgEstado(R0),corp=R.tc==='corporal';
  const cab=`<div class="cgt"><b>${esc(x.n)}</b><span class="cgm ${x.m}">${x.m==='f'?'Fuerza':'Hipertrofia'}</span><span class="cgst ${e}">${CG_EST[e]}</span></div>`;
  if(['carga','completa','heredada'].includes(e)&&!cgUI.abiertas[x.key])
    return `<div class="cgrow cgcomp ${e}${x.act?'':' cgx'}" data-k="${esc(x.key)}" data-q="${esc(sinTilde(x.n))}">${cab}
      <div class="cgres"><span>${esc(cgResTxt(R0))}</span><span class="cgacc">${e==='heredada'?'<button type="button" class="btn2 cgok" data-cg="confirmar">Confirmar</button>':''}<button type="button" class="btn2" data-cg="abrir">Cambiar</button></span></div>
      ${cgAvisos(x.key,R0)}${cgPropHTML(x.key)}</div>`;
  const peso=corp?`<span class="cgcorp">Peso corporal</span>`:`<button type="button" class="cgpm" data-cg="menos" aria-label="Un salto menos">−</button>${cgSelN('w',[['','— peso'],...cgOpcR(R).map(v=>[v,cgN(v)]),['__otro','Otro…']],R.w,'Peso')}<button type="button" class="cgpm" data-cg="mas" aria-label="Un salto más">+</button>`;
  return `<div class="cgrow ${e}${x.act?'':' cgx'}" data-k="${esc(x.key)}" data-q="${esc(sinTilde(x.n))}">${cab}
    <div class="cgf cgp2${corp?' corp':''}">${peso}${cgSelN('esp',CG_ESP_C,cgEspV(R),'Unidad y tipo de carga')}</div>
    ${cgUI.otro[x.key]?`<input class="in" data-cgf="wotro" inputmode="decimal" placeholder="Otro peso (${R.u==='nivel'?'nivel':R.u})" autocomplete="off">`:''}
    <div class="cgf cg3">${cgSel('r',cgRepsOps(R),R.r,'Reps')}${cgSel('rir',cgRirOps,R.rir,'RIR')}${cgSel('cn',cgCnOps,R.cn,'¿Seguro?')}</div>
    ${cgUI.otro[x.key+'|r']?`<input class="in" data-cgf="rotro" inputmode="numeric" placeholder="Repeticiones (más de 30)" autocomplete="off">`:''}
    ${R0?cgAvisos(x.key,R0):cgPrevHTML(x,R,'cg')}${cgPropHTML(x.key)}
    <div class="cgf cgpie">${R0&&!R0.ok&&cgTieneCarga(R0)?'<button type="button" class="btn2 cgok" data-cg="confirmar">Confirmar</button>':''}<button type="button" class="lnk" data-cg="editar">Más opciones</button>${cgTieneCarga(R0)?'<button type="button" class="lnk" data-cg="cerrar">Listo</button>':''}${R0?`<span class="hint">${esc(CG_SRCN[R0.src])}${R0.obs==='sesion'?' · reps y RIR medidos en una sesión':''}</span>`:''}</div></div>`}
function cgPintaFila(k,salta){const el=document.querySelector(`#vCargasC .cgrow[data-k="${CSS.escape(k)}"]`),x=cgActivos().find(y=>y.key===k);if(!el||!x){renderCargas();return}
  const antes=cgEstado(cgSem().refs[k]);el.outerHTML=cgFilaHTML(x);cgPintaCab();render();
  // v32: al quedar configurado, un destello de confirmación y (si se pide) se lleva la vista al siguiente pendiente
  const nuevo=document.querySelector(`#vCargasC .cgrow[data-k="${CSS.escape(k)}"]`),e=cgEstado(cgSem().refs[k]);
  if(nuevo&&(e==='carga'||e==='completa')){nuevo.classList.add('cgflash');if(salta){const p=[...document.querySelectorAll('#vCargasC .cgrow')].find(r=>!r.hidden&&/\b(pend|calibrar|heredada)\b/.test(r.className)&&r!==nuevo);
    if(p)try{p.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}}}
  void antes}
// siguiente ejercicio pendiente (sin configurar, por calibrar o por confirmar) en el orden de la encuesta
const cgSigPend=desde=>{const L=cgLista(),i=L.findIndex(x=>x.key===desde),orden=[...L.slice(i+1),...L.slice(0,Math.max(0,i))];
  return orden.find(x=>x.act&&!['carga','completa'].includes(cgEstado(cgSem().refs[x.key])))}
function cgCabHTML(){const s=cgEstadoSem(),pc=s.tot?Math.round(100*s.conf/s.tot):0,est=!s.tot?'sin ejercicios':s.conf===s.tot?'completo':s.conf||s.her?'en curso':'sin empezar';
  return `<p class="hint">Semana del ${esc(cgFSem())} · test semanal: <b>${est}</b></p>
    <div class="cgbar" role="progressbar" aria-valuemin="0" aria-valuemax="${s.tot}" aria-valuenow="${s.conf}" aria-label="Ejercicios configurados"><i style="width:${pc}%"></i></div>
    <p class="cgprog"><b>${s.conf} de ${s.tot} ejercicios configurados</b> (${pc} %)${s.her?` · ${s.her} por confirmar`:''}${s.pend?` · ${s.pend} sin configurar`:''}${s.cal?` · ${s.cal} por calibrar`:''}${s.props?` · ${s.props} ${s.props===1?'propuesta':'propuestas'}`:''}</p>`}
function cgPintaCab(){const c=$('cgCab');if(c)c.innerHTML=cgCabHTML()}
const cgEjOpts=L=>L.map(x=>{const e=cgEstado(cgSem().refs[x.key]);return `<option value="${esc(x.key)}"${x.key===cgUI.sel?' selected':''}>${e==='carga'||e==='completa'?'✓ ':e==='heredada'?'• ':'○ '}${esc(x.n)}${x.m==='f'?' (fuerza)':''}</option>`}).join('');
function cgUnoHTML(){const L=cgLista();if(!L.length)return '<p class="hint">Ningún ejercicio con ese filtro.</p>';if(!L.some(x=>x.key===cgUI.sel))cgUI.sel=L[0].key;
  const x=cgKeyObj(cgUI.sel);x.act=true;const W=cgSem(),R0=W.refs[x.key],R=cgBase(x),corp=R.tc==='corporal',i=L.findIndex(y=>y.key===x.key),hayF=!!(FZA_PRIN[x.g]&&FZA_PRIN[x.g].includes(x.n))||W.refs[cgKey(x.g,x.n,'f')];
  const rirB=CG_RIRS.map(v=>`<button type="button" data-cgw="rir" data-v="${v}" aria-pressed="${R.rir===v}">${v==='ns'?'No sé':v}</button>`).join('');
  const cnB=CG_CNS.map(v=>`<button type="button" data-cgw="cn" data-v="${v}" aria-pressed="${R.cn===v}">${CG_CNN[v]}</button>`).join('');
  const fz=x.m==='f',ros=fz?CG_RANGOS_F:RANGOS;
  return `<div class="cgwiz" data-k="${esc(x.key)}">
    <div class="cgf cg2">${cgSel('g',[['','Todos los grupos'],...Object.keys(CAT).map(g=>[g,CAT[g].n])],cgUI.fg,'Grupo muscular')}
      <label class="cgl2"><span>Buscar</span><input type="search" class="in" data-cgq="1" value="${esc(cgUI.q)}" placeholder="p. ej. press" autocomplete="off"></label></div>
    <label class="cgl2"><span>Ejercicio (${i+1} de ${L.length})</span><select data-cgf="ej" aria-label="Ejercicio">${cgEjOpts(L)}</select></label>
    <div class="tog" role="group" aria-label="Modalidad"><button type="button" data-cgw="m" data-m="h" aria-pressed="${x.m==='h'}">Hipertrofia</button>${hayF||fz?`<button type="button" data-cgw="m" data-m="f" aria-pressed="${fz}">Fuerza</button>`:''}</div>
    <p class="hint">${fz?'Fuerza: pocas reps pesadas, más reserva y descansos largos (2,5–3,5 min).':'Hipertrofia: estímulo y volumen; mini-series y descansos cortos que decide el reloj.'} Cada modalidad guarda su propia carga.</p>
    <p class="cgest">Estado: <b class="cgst ${cgEstado(R0)}">${CG_EST[cgEstado(R0)]}</b>${R0?` · ${esc(CG_SRCN[R0.src])}`:''}</p>
    ${R0?cgAvisos(x.key,R0):cgPrevHTML(x,R,'cgw')}${cgPropHTML(x.key)}
    ${corp?'<p>Peso corporal (sin carga externa). Para añadir lastre elige «de lastre» en la unidad.</p>':`<div class="cgf cgpf"><button type="button" class="cgpm" data-cgw="menos" aria-label="Un salto menos">−</button>${cgSel('w',cgPesoOps(R),R.w,'Peso que usas')}<button type="button" class="cgpm" data-cgw="mas" aria-label="Un salto más">+</button></div>`}
    ${cgUI.otro[x.key]?`<input class="in" data-cgf="wotro" inputmode="decimal" placeholder="Otro peso (${R.u==='nivel'?'nivel':R.u})" autocomplete="off">`:''}
    ${cgSel('esp',CG_ESP,cgEspV(R),'Unidad y tipo de carga')}
    ${cgSel('r',cgRepsOps(R),R.r,'Repeticiones que haces con ese peso')}
    ${cgUI.otro[x.key+'|r']?`<input class="in" data-cgf="rotro" inputmode="numeric" placeholder="Repeticiones (más de 30)" autocomplete="off">`:''}
    <span class="lbl">RIR al terminar esas repeticiones</span><div class="cgrir">${rirB}</div>
    <span class="lbl">¿Qué tan seguro estás de esa carga?</span><div class="tog cgcn">${cnB}</div>
    <details class="cgmas"><summary>Más opciones</summary>
      ${cgSel('eq',Object.entries(CG_EQN),R.eq,'Equipo')}
      ${fz?cgSel('ro',[['','3–6 (por defecto)'],...ros.map(r=>[r,r])],R.ro,'Rango de reps (fuerza)'):`<p class="hint">Rango de reps: ${esc(cgEjR(x.g,x.n))} (se cambia en el editor de ejercicios del reloj)</p>`}
      ${cgSel('ri',[['',`${fz?'2–3':'1–3'} (por defecto)`],...CG_RI.map(r=>[r,r])],R.ri,'RIR objetivo')}
      ${cgSel('paso',[['','Automático (según el equipo)'],...CG_PASOS.map(p=>[p,`${cgN(p)} ${R.u==='nivel'?'nivel':R.u}`])],R.paso,'Salto entre pesos')}
      ${R0?`<button type="button" class="btn2 peligro" data-cgw="quitar">${cgUI.conf===2?'¿Seguro? Toca otra vez':'Quitar esta referencia'}</button>`:''}</details>
    <div class="cgnav"><button type="button" data-cgw="ant"${i<=0?' disabled':''}>‹ Anterior</button><button type="button" data-cgw="sig"${i>=L.length-1?' disabled':''}>Siguiente ›</button></div>
    ${cgSigPend(x.key)?'<button type="button" class="btn2 cgpend" data-cgw="pend">Siguiente pendiente ›</button>':''}
    ${R0&&!R0.ok&&cgTieneCarga(R0)?'<button type="button" class="btn2" data-cgw="confirmar">Confirmar sin cambios</button>':''}</div>`}
function cgListaHTML(){const L=cgLista(),secs=[];
  if(cgUI.agr==='mod'){for(const m of ['h','f']){const l=L.filter(x=>x.m===m&&x.act);if(l.length)secs.push([m==='f'?'Fuerza':'Hipertrofia',l])}}
  else if(cgUI.agr==='rut'){const ya=new Set();   // cada ejercicio una vez: en la primera rutina que lleva su grupo
    RUTINAS.forEach(R=>{const gs=R.mia?miaLista:R.g;if(!gs||!gs.length)return;const l=L.filter(x=>x.act&&gs.includes(x.g)&&!ya.has(x.key));l.forEach(x=>ya.add(x.key));if(l.length)secs.push([R.mia?'Tu rutina («La mía»)':R.n,l])});
    const r=L.filter(x=>x.act&&!ya.has(x.key));if(r.length)secs.push(['Grupos sueltos (fuera de las rutinas)',r])}
  else Object.keys(CAT).forEach(g=>{const l=L.filter(x=>x.g===g&&x.act);if(l.length)secs.push([CAT[g].n,l])});
  const otros=L.filter(x=>!x.act);if(otros.length)secs.push(['Otros ejercicios configurados (fuera de tus rutinas)',otros]);
  const W=cgSem();return secs.map(([t,l])=>{const c=l.filter(x=>{const e=cgEstado(W.refs[x.key]);return e==='carga'||e==='completa'}).length;
    return `<section class="cgsec"><h3>${esc(t)} <span class="muted">${c} de ${l.length}</span></h3>${l.map(cgFilaHTML).join('')}</section>`}).join('')}
function cgResumenHTML(){const W=cgSem(),Wp=cgSemPrev(),L=cgActivos(),fila=x=>{const R=W.refs[x.key],Rp=Wp&&Wp.refs[x.key],e=cgEstado(R);
    let cmb='';if(R&&cgTieneCarga(R)){if(!Wp)cmb='';else if(!Rp||!cgTieneCarga(Rp))cmb='nueva esta semana';else if(Rp.u!==R.u||Rp.tc!==R.tc)cmb=`antes ${cgTxt(Rp)} (otra unidad)`;else if(R.w==null||Rp.w==null)cmb='igual que la semana pasada';
      else{const d=R.w-Rp.w;cmb=Math.abs(d)<1e-9?'igual que la semana pasada':`${d>0?'+':'−'}${cgN(Math.abs(d))} ${R.u==='nivel'?'niveles':R.u} frente a la semana pasada`}}
    return `<li><span class="cgsn"><b>${esc(x.n)}</b> <span class="cgst ${e}">${CG_EST[e]}</span></span><span>${R&&(cgTieneCarga(R)||R.r!=null||R.rir)?esc(cgResTxt(R)):'<span class="muted">sin datos</span>'}</span>${cmb?`<span class="hint">${esc(cmb)}</span>`:''}</li>`};
  // por grupo muscular, cada ejercicio en dos líneas: legible en el teléfono sin desplazarse a lo ancho
  const tabla=(t,l)=>l.length?`<h3>${t}</h3>`+Object.keys(CAT).filter(g=>l.some(x=>x.g===g)).map(g=>`<div class="cgsum"><span class="lbl">${esc(CAT[g].n)}</span><ul>${l.filter(x=>x.g===g).map(fila).join('')}</ul></div>`).join(''):'';
  const sin=L.filter(x=>{const R=W.refs[x.key],e=cgEstado(R);return x.act&&(e==='pend'||e==='calibrar'||(R&&(R.r==null||!R.rir||R.rir==='ns'||R.cn==='calibrar')))});
  const props=Object.keys(W.prop).filter(k=>W.refs[k]);
  return tabla('Cargas de hipertrofia',L.filter(x=>x.m==='h'))+tabla('Cargas de fuerza',L.filter(x=>x.m==='f'))
    +`<h3>Ejercicios sin datos suficientes</h3>${sin.length?`<ul class="cgsin">${sin.map(x=>{const R=W.refs[x.key],e=cgEstado(R);return `<li>${esc(x.n)}${x.m==='f'?' (fuerza)':''}: ${!cgTieneCarga(R)?'sin carga':R.cn==='calibrar'?'carga por calibrar':'faltan reps o RIR de referencia'} <button type="button" class="lnk" data-cgcomp="${esc(x.key)}">completar</button></li>`}).join('')}</ul><p class="hint">Lo que falte se completa solo con tu primera serie real del ejercicio con esa carga y reserva conocida (una reserva «4+» es una cota y no cuenta).</p>`:'<p class="hint">Todos tienen carga, reps y RIR de referencia.</p>'}`
    +`<h3>Recomendaciones de progresión</h3>${props.length?`<p class="hint">Revisión de lo que hiciste desde la semana anterior, ejercicio por ejercicio, solo con las series hechas con la carga de referencia. Tú decides: aprobar, modificar o rechazar.</p>${props.filter(k=>!W.prop[k].dec).length>1?'<div data-k="_"><button type="button" class="btn2" data-cgd="todas">Aprobar todas las propuestas</button></div>':''}`
      +props.map(k=>{const P=W.prop[k],R=W.refs[k];return P.dec?`<p class="hint">${esc(R.n)}: ${esc(CG_ACC[P.acc])} · ${P.dec==='ok'?'aprobada':P.dec==='mod'?'modificada':'rechazada'}</p>`:`<div class="cgrp"><b>${esc(R.n)}</b>${R.m==='f'?' (fuerza)':''}${cgPropHTML(k)}</div>`}).join('')
      :'<p class="hint">Aún no hay revisión: las propuestas aparecen al empezar la semana siguiente, con lo que entrenes esta semana con tus cargas de referencia.</p>'}
    <p class="hint"><b>Cómo se decide.</b> Hipertrofia: si llegas al tope de tu rango con tu RIR objetivo en 2 sesiones (o te sobran reps), sube el salto real siguiente de tu equipo; si no llegas al mínimo al fallo, baja uno; si no, mantén y busca más reps. Fuerza: con su rango y su RIR objetivo, todas las series. Con molestias o en descarga, mantener; sin series comparables, recalibrar. No sube solo porque pasó una semana. La técnica no se registra, así que no se valora.</p>`}
function renderCargas(){const el=$('vCargasC');if(!el)return;const W=cgSem();
  let h=`<div class="cgtop"><div id="cgCab">${cgCabHTML()}</div>
    <div class="psub" role="tablist" aria-label="Mis cargas"><button type="button" data-cgs="enc" aria-pressed="${cgUI.sub==='enc'}">Encuesta semanal</button><button type="button" data-cgs="res" aria-pressed="${cgUI.sub==='res'}">Resumen y progresión</button></div></div>`;   // v32: cabecera fija al desplazarse
  if(cgUI.msg)h+=`<p class="cgmsg" role="status">${esc(cgUI.msg)}</p>`;
  if(cgUI.sub==='res')h+=cgResumenHTML();
  else{h+=`<p class="hint"><b>RIR</b> = repeticiones en reserva: cuántas más podrías haber hecho antes del fallo técnico. Si no lo sabes, elige «No sé»: no se inventa. Cada selección se guarda al momento.</p>
      ${!Object.keys(W.refs).length?'<p class="hint">Primera vez: elige el peso que ya usas en cada ejercicio. No hace falta ninguna prueba física; lo que no sepas, déjalo para calibrarlo en una sesión.</p>':''}
      <div class="tog" role="group" aria-label="Vista"><button type="button" data-cgv="lista" aria-pressed="${cgUI.vista==='lista'}">Lista completa</button><button type="button" data-cgv="uno" aria-pressed="${cgUI.vista==='uno'}">Uno a uno</button></div>`;
    if(cgUI.vista==='lista')h+=`<div class="cgf cg2"><label class="cgl2"><span>Buscar ejercicio</span><input type="search" class="in" data-cgq="1" value="${esc(cgUI.q)}" placeholder="p. ej. press" autocomplete="off"></label>
        ${cgSel('agr',[['g','Por músculo'],['rut','Por rutina'],['mod','Por modalidad']],cgUI.agr,'Agrupar')}</div>${cgListaHTML()}`;
    else h+=cgUnoHTML();
    h+=`<div class="cgnav cgfin"><button type="button" data-cgw="luego">Guardar y continuar después</button><button type="button" data-cgw="todos" class="${cgUI.conf===1?'peligro':''}">${cgUI.conf===1?'¿Confirmar todo? Toca otra vez':'Confirmar todos'}</button></div>
      <p class="hint">«Confirmar todos» da por buenas las cargas que ya tienen valor (las heredadas de la semana pasada incluidas). Lo que no tiene carga queda pendiente sin bloquear nada: entrenas igual y el reloj la pide en la sesión.</p>`}
  el.innerHTML=h;cgUI.msg='';if(cgUI.q&&cgUI.vista==='lista')cgFiltra()}

/* ---------- arranque: la primera vez (sin ninguna carga guardada) se abre la encuesta ---------- */
cgSem();
if(!cg.intro&&!Object.values(cg.sem).some(W=>Object.keys(W.refs).length)&&S.st==='idle'&&!retomar&&tab==='reloj'){cg.intro=new Date().toISOString();cgGuarda();tab='cargas';renderCargas()}
render();
