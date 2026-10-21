// Reloj anómalo: toda la lógica de la app. Se carga al final del <body> (después de estilo.js).
const $=id=>document.getElementById(id);
const CAT={
 biceps:{n:'Bíceps',e:[
  {s:'Inclinado',n:'Curl inclinado con mancuernas',r:'8–12',d:10,tempo:'codos atrás · 3 s abajo',ext:'part',k:1.6,extN:'Parciales en la mitad baja',extH:'brazo estirado, sube solo hasta 90°'},
  {s:'Predicador',n:'Curl predicador',r:'10–15',d:12,tempo:'sin rebote abajo · 2 s abajo',ext:'hold',k:1,extN:'Isometría casi abajo',extH:'codo casi extendido, sostén hasta que cedas'},
  {s:'Martillo',n:'Curl martillo',r:'10–12',d:11,tempo:'agarre neutro, sin balanceo',ext:'part',k:1.5,extN:'Parciales de martillo',extH:'recorrido corto desde abajo'}]},
 triceps:{n:'Tríceps',e:[
  {s:'Sobre cabeza',n:'Extensión sobre la cabeza',r:'8–12',d:10,tempo:'codo profundo · 3 s abajo',ext:'part',k:1.6,extN:'Parciales en la mitad estirada',extH:'desde el fondo hasta medio recorrido'},
  {s:'Cuerda',n:'Pushdown con cuerda',r:'12–15',d:13,tempo:'abre la cuerda al final',ext:'part',k:1.5,extN:'Parciales arriba',extH:'mitad superior, codo flexionado'},
  {s:'Fondos',n:'Fondos o flexiones cerradas',r:'8–15',d:10,tempo:'torso vertical, baja a 90°',ext:'flat',k:1.0,extN:'Flexiones diamante',extH:'codos pegados, hasta el fallo'}]},
 espalda:{n:'Espalda',e:[
  {s:'Jalón',n:'Jalón al pecho',r:'10–12',d:11,tempo:'pecho arriba · 3 s de subida',ext:'part',k:1.5,extN:'Parciales en la mitad estirada',extH:'desde brazos extendidos hasta la frente'},
  {s:'Remo',n:'Remo con mancuerna',r:'10–12',d:11,tempo:'codo hacia la cadera · pausa arriba',ext:'hold',k:1,extN:'Isometría con el codo atrás',extH:'escápula apretada, sostén hasta que cedas'},
  {s:'Pullover',n:'Pullover en polea',r:'12–15',d:13,tempo:'brazos casi rectos',ext:'flat',k:1.3,extN:'Remo invertido',extH:'con el cuerpo, hasta el fallo'}]},
 pecho:{n:'Pecho',e:[
  {s:'Inclinado',n:'Press inclinado con mancuernas',r:'8–12',d:10,tempo:'3 s abajo, sin rebote',ext:'part',k:1.5,extN:'Parciales abajo',extH:'mitad estirada del recorrido'},
  {s:'Aperturas',n:'Aperturas en polea',r:'12–15',d:13,tempo:'codos suaves · aprieta al cerrar',ext:'hold',k:1,extN:'Isometría abierta',extH:'brazos abiertos en estiramiento, sostén'},
  {s:'Fondos',n:'Fondos con torso inclinado',r:'8–12',d:10,tempo:'baja hasta sentir el pecho',ext:'flat',k:1.4,extN:'Flexiones',extH:'manos anchas, hasta el fallo'}]},
 hombros:{n:'Hombros',e:[
  {s:'Laterales',n:'Elevaciones laterales',r:'12–20',d:15,tempo:'sin impulso · 2 s abajo',ext:'part',k:1.6,extN:'Parciales hasta 45°',extH:'recorrido corto desde abajo'},
  {s:'Press',n:'Press con mancuernas sentado',r:'8–12',d:10,tempo:'baja a la altura de la oreja',ext:'flat',k:1.3,extN:'Flexiones pica',extH:'cadera alta, hasta el fallo'},
  {s:'Posterior',n:'Pájaros en polea',r:'12–15',d:13,tempo:'abre con los codos',ext:'hold',k:1,extN:'Isometría en cruz',extH:'brazos a la altura del hombro, sostén'}]},
 abdominales:{n:'Abdomen',e:[
  {s:'Crunch',n:'Crunch en polea',r:'10–15',d:13,tempo:'enrolla la columna · exhala al cerrar',ext:'flat',k:1.5,extN:'Crunch en el suelo',extH:'exhala al subir, hasta el fallo'},
  {s:'Colgado',n:'Elevaciones colgado',r:'8–12',d:10,tempo:'rota la pelvis, sin balanceo',ext:'flat',k:1.4,extN:'Rodillas al pecho',extH:'colgado, hasta el fallo'},
  {s:'Vacío',n:'Vacío del transverso',r:'15–50 s',d:0,levy:true}]},
 piernas:{n:'Piernas',e:[
  {s:'Sentadilla',n:'Sentadilla hack o goblet',r:'10–15',d:12,tempo:'3 s abajo · sin bloquear arriba',ext:'part',k:1.5,extN:'Parciales abajo',extH:'mitad baja del recorrido'},
  {s:'Femoral',n:'Curl femoral',r:'10–15',d:12,tempo:'cadera pegada · 2 s abajo',ext:'hold',k:1,extN:'Isometría a 90°',extH:'rodilla a 90°, sostén hasta que cedas'},
  {s:'Gemelo',n:'Elevación de talones',r:'12–20',d:15,tempo:'pausa abajo en estiramiento',ext:'part',k:1.6,extN:'Parciales en estiramiento',extH:'mitad baja, sin rebote'}]}
};
const TP=110,MAXMYO=5,SHIFT=10,KEY='reloj-anomalo-sesiones';
// Meta de series efectivas por sesión (hipertrofia, cada grupo 2–3 veces por semana); más de 10 por sesión apenas suma.
const META_DEF={biceps:6,triceps:6,espalda:8,pecho:8,hombros:8,abdominales:6,piernas:9},META_MIN=4,META_MAX=12,MAXRONDA=3,MKEY='reloj-anomalo-metas';
// Ejercicios propios: se puede cambiar nombre y rango de cada estación; la forma de llegar al fallo se conserva.
const BASE=JSON.parse(JSON.stringify(CAT)),EJKEY='reloj-anomalo-ejercicios',AKEY='reloj-anomalo-ajustes',DKEY='reloj-anomalo-descarga',RKEY='reloj-anomalo-rutina';
const ALT={
 biceps:['Curl con barra','Curl con barra Z','Curl en polea','Curl concentrado','Curl araña','Curl Bayesian en polea','Curl martillo con cuerda'],
 triceps:['Press francés','Extensión en polea alta con barra','Patada en polea','Press cerrado','Extensión sobre la cabeza en polea','Fondos en máquina'],
 espalda:['Dominadas','Remo con barra','Remo en polea sentado','Remo en máquina','Jalón con agarre neutro','Remo en T','Pullover con mancuerna'],
 pecho:['Press banca con barra','Press inclinado con barra','Press en máquina','Pec deck','Cruces en polea','Press declinado','Flexiones lastradas'],
 hombros:['Press militar con barra','Press de hombro en máquina','Elevaciones laterales en polea','Face pull','Pájaros con mancuernas','Elevación lateral en máquina'],
 abdominales:['Crunch en máquina','Rueda abdominal','Elevación de piernas en banco','Crunch inverso','Pallof press'],
 piernas:['Sentadilla con barra','Prensa','Zancada búlgara','Peso muerto rumano','Extensión de cuádriceps','Curl femoral sentado','Hip thrust','Gemelo sentado']};
const RANGOS=['5–8','6–10','8–12','10–15','12–20','15–25'];
const rango=r=>{const m=String(r).match(/(\d+)\D+(\d+)/);return m?[+m[1],+m[2]]:[8,12]};
/* 2 a 5 estaciones por grupo. misEj[g] = {0:{n,s,r},…: cambios de las originales (como siempre), x:[…]: agregadas, q:[i]: originales quitadas}.
   Orden: originales que quedan, luego las agregadas y el vacío siempre al final. b = índice original, xi = índice en x. */
const EST_MIN=2,EST_MAX=5,KEXT={part:1.5,hold:1,flat:1.3};
/* ---------- validación de datos ----------
   Todo lo que se lee del teléfono (localStorage e IndexedDB se comparten con las otras apps del mismo sitio) o de un archivo
   importado se NORMALIZA aquí antes de usarlo: números finitos y en rango, textos con largo máximo, fechas válidas y listas
   acotadas. Lo que no encaja se descarta (al importar se cuenta y se avisa). Además, todo texto que no sea del propio código
   y se pinte con innerHTML pasa por esc(). Nada de lo leído se ejecuta nunca. */
const TXT_MAX=200,SETS_MAX=400,SES_MAX=20000,MED_MAX=5000,FOTOS_MAX=2000,FOTO_MAX=12e6;
const esObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
const tiene=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const esG=g=>tiene(CAT,g);   // grupo válido (sin «constructor», «__proto__», …)
const vTxt=(v,max=TXT_MAX)=>typeof v==='string'?v.slice(0,max):typeof v==='number'&&isFinite(v)?String(v):null;
const vNum=(v,lo,hi)=>{const x=typeof v==='number'?v:typeof v==='string'&&v.trim()!==''&&v.length<40?+v:NaN;return isFinite(x)&&x>=lo&&x<=hi?x:null};
const vEnt=(v,lo,hi)=>{const x=vNum(v,lo,hi);return x!=null&&Number.isInteger(x)?x:null};
const vFecha=v=>typeof v==='string'&&v.length<=40&&!isNaN(Date.parse(v))?v:null;
const DIA_RE=/^\d{4}-\d\d-\d\d$/,vDia=v=>typeof v==='string'&&DIA_RE.test(v)&&!isNaN(Date.parse(v+'T12:00:00'))?v:null;
const vLista=(v,max,f)=>(Array.isArray(v)?v:[]).slice(0,max).map(f).filter(x=>x!=null);
// «cómo llegas» de un día: sueño en horas (0–14), energía entera 1–5; si falta lo uno y lo otro, no vale
function normBien1(b){if(!esObj(b))return null;const o={},su=vNum(b.sueno,0,14),en=vEnt(b.energia,1,5),t=vNum(b.t,0,1e14);
  if(su!=null)o.sueno=su;if(en!=null)o.energia=en;if(su==null&&en==null)return null;if(t!=null)o.t=t;return o}
function normBienMapa(o,cnt){const out={};if(!esObj(o))return out;let n=0;
  for(const k in o){if(!tiene(o,k))continue;if(++n>20000)break;const b=vDia(k)&&normBien1(o[k]);if(b)out[k]=b;else if(cnt)cnt.mal++}return out}
// una serie
function normSet(r){if(!esObj(r))return null;const o={ex:vTxt(r.ex)??'',k:vTxt(r.k,40)??'',reps:vTxt(r.reps,20)??'',rir:vTxt(r.rir,5)??'—'};
  const ej=vTxt(r.ej);if(ej!=null)o.ej=ej;
  if('kg' in r)o.kg=r.kg==null||r.kg===''?null:vNum(r.kg,0,1000);
  o.P=vNum(r.P,0,10)??0;o.rest=vNum(r.rest,0,36000)??0;
  for(const [k,hi] of [['obj',1000],['Cpre',10],['kc',10]]){const v=vNum(r[k],0,hi);if(v!=null)o[k]=v}
  if(r.pr===true)o.pr=true;const mol=r.mol?vTxt(r.mol,40):null;if(mol)o.mol=mol;
  return o}
// una sesión del historial: hace falta id y fecha válidos; las series raras se descartan
function normSes(s){if(!esObj(s))return null;const id=vTxt(s.id,80),start=vFecha(s.start);
  if(!id||!start||(s.sets!=null&&!Array.isArray(s.sets)))return null;
  const sets=vLista(s.sets,SETS_MAX,normSet),g=esG(s.g)?s.g:Object.keys(CAT).find(k=>CAT[k].n===s.grupo);
  const o={id,start,g,grupo:vTxt(s.grupo,60)??(g?CAT[g].n:''),series:vEnt(s.series,0,1e4)??sets.filter(r=>r.k!=='cal.').length,
    reps:vNum(s.reps,0,1e6)??0,tuc:vNum(s.tuc,0,1e7)??0,iso:vNum(s.iso,0,1e7)??0,completa:s.completa===true,sets};
  const ef=vNum(s.efectivas,0,1e4),me=vNum(s.meta,0,100),sc=vEnt(s.serC,0,1e4),bi=normBien1(s.bien),no=vTxt(s.nota);
  if(ef!=null)o.efectivas=ef;if(me!=null)o.meta=me;if(bi){delete bi.t;o.bien=bi}if(no)o.nota=no;
  if(s.antes===true)o.antes=true;if(s.desc===true)o.desc=true;if(sc!=null)o.serC=sc;
  if(esObj(s.rut)){const n=vTxt(s.rut.n,40),pos=vEnt(s.rut.pos,0,20),de=vEnt(s.rut.de,1,20);if(n!=null&&pos!=null&&de!=null)o.rut={n,pos,de}}
  return o}
function normHist(a,cnt){const out=[],ids=new Set();(Array.isArray(a)?a:[]).slice(0,SES_MAX).forEach(s=>{const v=normSes(s);
  if(v&&!ids.has(v.id)){out.push(v);ids.add(v.id)}else if(cnt)cnt.mal++});return out}
// ejercicios propios: {grupo: {0:{n,s,r}, …, x:[{n,s,r,ext,extN,extH,tempo}], q:[índices quitados]}}
const EXTS=['part','hold','flat'];
function normEjercicio(m,extra){if(!esObj(m))return null;const n=vTxt(m.n,80);if(!n)return null;const o={n,s:vTxt(m.s,40)??n.split(' ')[0],r:vTxt(m.r,20)??'8–12'};
  if(extra){o.ext=EXTS.includes(m.ext)?m.ext:'part';for(const [k,mx] of [['extN',40],['extH',60],['tempo',50]]){const v=vTxt(m[k],mx);if(v)o[k]=v}}
  return o}
function normMisEj(o){const out={};if(!esObj(o))return out;
  for(const g in BASE){if(!tiene(o,g)||!esObj(o[g]))continue;const M=o[g],m={};
    BASE[g].e.forEach((_,i)=>{const v=normEjercicio(M[i],false);if(v)m[i]=v});
    const x=vLista(M.x,EST_MAX,v=>normEjercicio(v,true));if(x.length)m.x=x;
    const q=[...new Set(vLista(M.q,10,v=>vEnt(v,0,BASE[g].e.length-1)))];if(q.length)m.q=q;
    if(Object.keys(m).length)out[g]=m}
  return out}
// ajustes: solo las claves conocidas y con su tipo
const vDiscos=v=>[...new Set(vLista(v,40,d=>vNum(d,0.01,500)))];
function normCfg(o){const c={};if(!esObj(o))return c;
  for(const k of ['voz','vibra','cal','rel','resPeso'])if(typeof o[k]==='boolean')c[k]=o[k];
  for(const k of ['barra','barraLb']){const v=vNum(o[k],0.5,1000);if(v!=null)c[k]=v}
  for(const k of ['discos','discosX','discosLb','discosXLb'])if(Array.isArray(o[k]))c[k]=vDiscos(o[k]);
  if(o.uni==='kg'||o.uni==='lb')c.uni=o.uni;
  const pt=vNum(o.persistT,0,1e14);if(pt!=null)c.persistT=pt;
  if(esObj(o.barraEj)){c.barraEj={};let n=0;for(const k in o.barraEj)if(tiene(o.barraEj,k)&&typeof o.barraEj[k]==='boolean'&&k.length<=TXT_MAX&&++n<=500)c.barraEj[k]=o.barraEj[k]}
  if(esObj(o.tempo)){const T={};if(typeof o.tempo.on==='boolean')T.on=o.tempo.on;if(typeof o.tempo.voz==='boolean')T.voz=o.tempo.voz;
    const p=typeof o.tempo.t==='string'&&/^\d-\d-\d-\d$/.test(o.tempo.t)?o.tempo.t.split('-').map(Number):null;if(p&&p[0]+p[2]>0)T.t=o.tempo.t;c.tempo=T}
  return c}
const normMetas=o=>{const m={};if(esObj(o))for(const g in META_DEF){const v=vNum(o[g],1,100);if(v!=null)m[g]=Math.min(META_MAX,Math.max(META_MIN,Math.round(v)))}return m};
const normFechas=(ks)=>o=>{const r={};if(esObj(o))ks.forEach(k=>{const v=vFecha(o[k]);if(v)r[k]=v});return r};
const normDescarga=normFechas(['inicio','hasta','fin']),normCalib=normFechas(['desde']);
const normBloque=o=>{const d=esObj(o)&&vDia(o.inicio),s=esObj(o)&&vEnt(o.sem,4,6);return d&&s!=null?{inicio:d,sem:s}:{}};
const normCopiaC=o=>{const r={};if(!esObj(o))return r;const f=vFecha(o.fecha),p=vNum(o.pos,0,1e14);if(f)r.fecha=f;if(p!=null)r.pos=p;return r};
const normRut=o=>esObj(o)?{i:vEnt(o.i,0,RUTINAS.length-1)??0,mia:[...new Set(vLista(o.mia,10,g=>esG(g)?g:null))]}:{i:0,mia:[]};
const MED_K=['brazo','pecho','cintura','muslo'];
function normMedida(m){if(!esObj(m))return null;const f=vDia(m.f);if(!f)return null;const o={f};let n=0;
  MED_K.forEach(k=>{const v=vNum(m[k],10,250);if(v!=null){o[k]=v;n++}});return n?o:null}
function normMedidas(a,cnt){const out=[],fs=new Set();(Array.isArray(a)?a:[]).slice(0,MED_MAX).forEach(m=>{const v=normMedida(m);
  if(v&&!fs.has(v.f)){out.push(v);fs.add(v.f)}else if(cnt)cnt.mal++});return out}
// leer una clave JSON del teléfono sin que un valor roto tumbe la app
const leerJSON=(k,def)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?def:v}catch(e){return def}};
let misEj=normMisEj(leerJSON(EJKEY,{}));
const SUGEJ={'Hip thrust':{s:'Hip thrust',r:'8–12',ext:'hold',extN:'Isometría arriba',extH:'cadera arriba, aprieta el glúteo y sostén',tempo:'pausa arriba · 2 s abajo'},
 'Peso muerto rumano':{s:'Rumano',r:'8–12',ext:'part',extN:'Parciales abajo',extH:'mitad estirada, espalda neutra',tempo:'cadera atrás · 3 s abajo'},
 'Extensión de cuádriceps':{s:'Extensión',r:'12–15',ext:'hold',extN:'Isometría arriba',extH:'rodilla estirada, sostén',tempo:'pausa arriba · 2 s abajo'},
 'Prensa':{s:'Prensa',r:'10–15',ext:'part',extN:'Parciales abajo',extH:'mitad baja del recorrido',tempo:'3 s abajo · sin bloquear'},
 'Zancada búlgara':{s:'Búlgara',r:'8–12',ext:'flat',extN:'Zancada sin peso',extH:'cuerpo solo, hasta el fallo',tempo:'3 s abajo'},
 'Curl con barra Z':{s:'Barra Z',r:'8–12',ext:'part',extN:'Parciales abajo',extH:'mitad baja, sin balanceo',tempo:'2 s abajo'},
 'Curl en polea':{s:'Polea',r:'10–15',ext:'hold',extN:'Isometría a 90°',extH:'codo a 90°, sostén',tempo:'aprieta arriba'},
 'Press francés':{s:'Francés',r:'8–12',ext:'part',extN:'Parciales estirado',extH:'mitad estirada',tempo:'codos quietos · 3 s abajo'},
 'Patada en polea':{s:'Patada',r:'12–15',ext:'hold',extN:'Isometría estirado',extH:'brazo recto atrás, sostén',tempo:'pausa atrás'},
 'Remo en polea sentado':{s:'Remo polea',r:'10–12',ext:'part',extN:'Parciales estirado',extH:'mitad estirada',tempo:'pecho arriba · pausa atrás'},
 'Dominadas':{s:'Dominadas',r:'6–10',ext:'flat',extN:'Remo invertido',extH:'con el cuerpo, hasta el fallo',tempo:'3 s de bajada'},
 'Press banca con barra':{s:'Banca',r:'6–10',ext:'flat',extN:'Flexiones',extH:'manos anchas, hasta el fallo',tempo:'3 s abajo, sin rebote'},
 'Cruces en polea':{s:'Cruces',r:'12–15',ext:'hold',extN:'Isometría cerrada',extH:'manos juntas, aprieta',tempo:'codos suaves'},
 'Face pull':{s:'Face pull',r:'12–20',ext:'hold',extN:'Isometría atrás',extH:'manos junto a las orejas, sostén',tempo:'abre los codos'},
 'Elevaciones laterales en polea':{s:'Lat. polea',r:'12–20',ext:'part',extN:'Parciales abajo',extH:'recorrido corto desde abajo',tempo:'sin impulso'},
 'Rueda abdominal':{s:'Rueda',r:'8–12',ext:'flat',extN:'Plancha',extH:'hasta el fallo',tempo:'lento al salir'},
 'Pallof press':{s:'Pallof',r:'10–15',ext:'hold',extN:'Isometría al frente',extH:'brazos estirados, no rotes',tempo:'2 s al frente'}};
const SUG_DEF={biceps:'Curl con barra Z',triceps:'Press francés',espalda:'Remo en polea sentado',pecho:'Cruces en polea',hombros:'Face pull',abdominales:'Pallof press',piernas:'Hip thrust'};
const dDe=r=>Math.round((rango(r)[0]+rango(r)[1])/2);
function aplicarEjercicios(){for(const g in BASE){const M=misEj[g]||{},q=new Set((M.q||[]).map(Number));
  const base=BASE[g].e.map((x,i)=>{const m=M[i];return m?{...x,...m,d:dDe(m.r),b:i}:{...x,b:i}});
  const ex=(Array.isArray(M.x)?M.x:[]).filter(m=>m&&m.n).map((m,j)=>({tempo:'controlado · 2–3 s abajo',ext:'part',extN:'Parciales',extH:'mitad del recorrido',...m,k:KEXT[m.ext]||1.5,d:dDe(m.r),xi:j}));
  let ok=base.filter(x=>!q.has(x.b));
  if(ok.length+ex.length<EST_MIN||!ok.concat(ex).some(x=>!x.levy))ok=base;   // nunca menos de 2 ni sin ejercicio con series
  CAT[g].e=[...ok.filter(x=>!x.levy),...ex,...ok.filter(x=>x.levy)]}}
aplicarEjercicios();
const DISCOS_STD=[25,20,15,10,5,2.5,1.25],BARRAS=[20,15,10,7],DISCOS_LB=[45,35,25,10,5,2.5],BARRAS_LB=[45,35,25,15];
let CFG={voz:true,vibra:true,cal:true,barra:20,discos:DISCOS_STD.slice(),discosX:[],barraEj:{},tempo:{on:false,t:'3-0-1-0',voz:false},rel:false,
  uni:'kg',barraLb:45,discosLb:DISCOS_LB.slice(),discosXLb:[],resPeso:false};Object.assign(CFG,normCfg(leerJSON(AKEY,{})));
let descarga=normDescarga(leerJSON(DKEY,{}));
// Calibración de la recuperación ({desde}: solo cuenta lo posterior), plan por bloques ({inicio:'AAAA-MM-DD' lunes, sem:4|5|6}) y última copia ({fecha, pos}).
const CKEY='reloj-anomalo-calib',BQKEY='reloj-anomalo-bloque',COPKEY='reloj-anomalo-copia';
const leerObj=(k,norm)=>norm(leerJSON(k,{}));
const guardarObj=(k,o)=>{try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}};
let calibC=leerObj(CKEY,normCalib),bloque=leerObj(BQKEY,normBloque),copiaC=leerObj(COPKEY,normCopiaC);
// Rutinas: varios grupos seguidos; al cerrar uno, 2 min de cambio y empieza el siguiente.
const RUTINAS=[{n:'Un grupo'},{n:'Pecho + Tríceps',g:['pecho','triceps']},{n:'Espalda + Bíceps',g:['espalda','biceps']},{n:'Brazos',g:['biceps','triceps']},
 {n:'Piernas + Abdomen',g:['piernas','abdominales']},{n:'Hombros + Abdomen',g:['hombros','abdominales']},{n:'La mía',mia:1}];
let rutI=0,miaLista=[],rutPos=0,rutEf=0;
{const r=normRut(leerJSON(RKEY,{}));rutI=r.i;miaLista=r.mia}
const rutLista=()=>{const R=RUTINAS[rutI];return R.mia?miaLista:R.g||[]};
const enRutina=()=>rutLista().length>1;
const guardarRut=()=>{try{localStorage.setItem(RKEY,JSON.stringify({i:rutI,mia:miaLista}))}catch(e){}};
const now=()=>Date.now()/1000;
const num=x=>String(Math.round(x*10)/10).replace('.',',');
const num2=x=>String(Math.round(x*100)/100).replace('.',',');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sinTilde=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
/* Cómo llegas hoy: clave COMPARTIDA con la app Comida, {"AAAA-MM-DD": {sueno: horas, energia: 1–5, t}}. Se fusiona, nunca se borra. */
const BKEY='bienestar-diario',SUENO=[['<5',4.5],['5–6',5.5],['6–7',6.5],['7–8',7.5],['8+',8.5]];
const leerBien=()=>normBienMapa(leerJSON(BKEY,{}));   // validado: sueño 0–14 h, energía entera 1–5; lo demás se descarta
// lo anotado hoy (puede faltar el sueño o la energía: Comida los anota por separado) y lo anotado completo
const bienDia=()=>{const b=leerBien()[diaK(Date.now())];return b&&typeof b==='object'&&(b.sueno!=null||b.energia!=null)?b:null};
const bienHoy=()=>{const b=bienDia();return b&&b.sueno!=null&&b.energia!=null?b:null};
const bienDe=b=>b?{...(b.sueno!=null?{sueno:+b.sueno}:{}),...(b.energia!=null?{energia:+b.energia}:{})}:null;
const bienTxt=b=>[b.sueno!=null?sueTxt(+b.sueno)+' de sueño':'',b.energia!=null?`energía ${b.energia}/5`:''].filter(Boolean).join(' · ');
function guardarBien(sueno,energia){const o=leerBien(),k=diaK(Date.now());o[k]={...(o[k]||{}),sueno,energia,t:Date.now()};try{localStorage.setItem(BKEY,JSON.stringify(o))}catch(e){}}
const sueTxt=v=>v===4.5?'menos de 5 h':v===8.5?'8 h o más':(SUENO.find(s=>s[1]===v)||[num(v)])[0]+' h';
const bajaHoy=()=>{const b=bienDia();return !!b&&((b.sueno!=null&&+b.sueno<6)||(b.energia!=null&&+b.energia<=2))};   // basta con uno de los dos
let bienEd=null,pideBien=false,bienOmit=false,bienSueno=false;   // bienEd: respuesta a medias mientras se elige; bienSueno: cambiar el sueño ya anotado
/* Unidad de peso: TODO se guarda en kg; la pantalla muestra y edita en kg o en libras (Ajustes). En libras el kg se guarda con 4 decimales
   para que la ida y vuelta lb → kg → lb no se mueva (225 lb = 102,0583 kg → 225 lb). */
const LB=.45359237,esLb=()=>CFG.uni==='lb',uTxt=()=>esLb()?'lb':'kg';
const aU=kg=>esLb()?Math.round(kg/LB*100)/100:kg;                      // kg → unidad de la pantalla
const deU=u=>esLb()?Math.round(u*LB*1e4)/1e4:Math.round(u*100)/100;    // unidad de la pantalla → kg
const kgTxt=k=>k==null?'—':k>0?num(aU(k))+' '+uTxt():'corporal';
const kgVoz=k=>num(aU(k))+(esLb()?' libras':' kilos');
let vozEs=null;
function decir(t){if(!CFG.voz||!t||!window.speechSynthesis)return;try{const sp=speechSynthesis;
  if(!vozEs){const vs=sp.getVoices();vozEs=vs.find(v=>/^es[-_](US|MX|DO|419)/i.test(v.lang))||vs.find(v=>/^es/i.test(v.lang))||null}
  sp.cancel();const u=new SpeechSynthesisUtterance(t.replace(/–/g,' a ').replace(/·/g,',').replace(/\breps\b/g,'repeticiones'));
  u.lang=vozEs?vozEs.lang:'es-ES';if(vozEs)u.voice=vozEs;u.rate=1.05;sp.speak(u)}catch(e){}}
const vibrar=pt=>{if(CFG.vibra)try{navigator.vibrate&&navigator.vibrate(pt)}catch(e){}};
const fmt=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const levy=()=>{const a=2.2,lo=15,hi=50,u=Math.random();return Math.round(lo*Math.pow(1-u*(1-Math.pow(lo/hi,a-1)),-1/(a-1)))};
const recC=(C,tauC,t)=>1-(1-C)*Math.exp(-t/tauC);
let audio=null,lock=null;
function beep(f,d){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();
  o.frequency.value=f;g.gain.setValueAtTime(.25,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);
  o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch(e){}}
/* ---------- tempo guiado: metrónomo en la activación, las mini-series y los parciales (nunca en isometría, vacío ni descanso) ---------- */
const TEMPOS=['3-0-1-0','2-0-1-0','4-1-1-0'],TEMPO_INI=2,TFREC={abajo:440,arriba:990};
const tempoCfg=()=>({on:false,t:'3-0-1-0',voz:false,...(CFG.tempo||{})});
const tempoP=t=>{const p=String(t).split('-').map(Number);return p.length===4&&p.every(x=>Number.isInteger(x)&&x>=0&&x<=9)&&p[0]+p[2]>0?p:[3,0,1,0]};
// pitidos (segundos desde que empieza la serie) en [ini, fin): «abajo» al empezar la bajada y «arriba» al empezar la subida
function tempoEventos(t,ini,fin){const [a,b,c,d]=tempoP(t),L=a+b+c+d,out=[];
  for(let k=Math.max(0,Math.floor((ini-TEMPO_INI)/L)-1);TEMPO_INI+k*L<fin;k++){const x=TEMPO_INI+k*L;
    if(x>=ini&&x<fin)out.push({t:x,tipo:'abajo'});if(x+a+b>=ini&&x+a+b<fin)out.push({t:x+a+b,tipo:'arriba'})}
  return out}
const tempoActivo=()=>{if(!tempoCfg().on||S.st!=='work')return false;const E=est();return S.phase==='act'||S.phase==='myo'||(S.phase==='ext'&&E.ext==='part')};
const tempoSub=()=>tempoActivo()?` · tempo ${tempoCfg().t}`:'';
function beepEn(f,d,dt){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain(),t0=audio.currentTime+Math.max(0,dt);
  o.frequency.value=f;g.gain.setValueAtTime(.3,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);o.connect(g).connect(audio.destination);o.start(t0);o.stop(t0+d)}catch(e){}}
// En cada tick se programan con el reloj del audio los pitidos del próximo medio segundo: suenan a tiempo aunque el tick vaya a saltos.
function tempoTick(){if(!tempoActivo())return;const T=tempoCfg(),e=now()-S.t0,hasta=e+.5;
  tempoEventos(T.t,Math.max(S.tempoHasta||0,e-.05),hasta).forEach(ev=>{beepEn(TFREC[ev.tipo],ev.tipo==='abajo'?.14:.08,ev.t-e);
    if(T.voz)setTimeout(()=>{if(tempoActivo())decir(ev.tipo)},Math.max(0,(ev.t-e)*1000))});
  S.tempoHasta=hasta}

let grupo='biceps',tab='reloj',hist=[],S;
const descLeer={mal:0};hist=normHist(leerJSON(KEY,[]),descLeer);   // registros guardados que no tienen un formato válido (se ignoran)
let metas={...META_DEF};
Object.assign(metas,normMetas(leerJSON(MKEY,{})));
function fresh(){return {st:'idle',P:0,C:1,tauC:35,P0:0,C0:1,sec:0,nIn:0,R1:0,RTF:0,target:0,phase:'act',levyN:0,levyT:0,
  t0:0,last:0,restDur:0,lastSec:-1,workDur:0,hechas:0,label:'',sets:[],tuc:0,iso:0,id:null,start:null,
  meta:0,metaE:[],ef:0,efE:0,ronda:1,esRonda:false,kg:null,sug:null,aviso:'',pr:0,prTxt:'',prK:'',rutTrans:false,
  cal:null,calI:0,calHecho:false,calRest:false,molAv:'',molDicho:false,molR:null,nota:'',bien:null,kRec:1,Cpre:null,tempoHasta:0,
  desc:false,serE:0,antes:false}}   // desc: sesión en modo descarga; serE: series completas del ejercicio; antes: terminada antes de la meta
S=fresh();
const est=()=>CAT[grupo].e[S.sec];
const enCurso=()=>S.st!=='idle'&&S.st!=='done';

function restStar(){const A=1-S.C,ts=A>S.tauC/(S.tauC+TP)?S.tauC*Math.log(A*(S.tauC+TP)/S.tauC):10;return Math.min(110,Math.max(10,ts*Math.exp(.1*gauss())))}
function bump(R,p,dur,ext){const g=.6*(R/(R+8))*(.5+.5*p);S.P=S.P+(1-S.P)*g;
  const D=(.3+.7*p**3)*(.6+.4*Math.min(1,dur/35))*(ext?.75:1);S.C*=1-D;S.tauC*=1.04}
function etiqueta(){const E=est();
  if(S.phase==='vac')return `Vacío ${S.levyN+1}/3 · objetivo ${S.levyT} s`;
  if(S.phase==='act')return `${E.n}: ${E.r} reps`+(S.kg!=null?` · ${kgTxt(S.kg)}`:'');
  if(S.phase==='hold')return `${E.extN} hasta el fallo`;
  if(S.phase==='ext')return `${E.extN}: ${S.target} reps`;
  return `${E.s}: ${S.target} reps · ${E.tempo}`}

function empezar(){const t=now();beep(1320,.25);vibrar(250);
  const c=!!S.cal&&S.calI<S.cal.length;let f=c?fraseCal():fraseTrabajo();
  if(S.molAv&&!S.molDicho&&(c||S.phase==='act')){f=S.molAv+'. '+f;S.molDicho=true}
  Object.assign(S,{st:c?'cal':'work',t0:t,last:t,aviso:'',rutTrans:false,calRest:false,tempoHasta:0});decir(f);render()}
function fraseCal(){const c=S.cal[S.calI];return `Calentamiento ${S.calI+1} de ${S.cal.length}: ${c.reps} repeticiones con ${kgVoz(c.kg)}`}
function fraseTrabajo(){const E=est(),kg=S.kg>0?`, con ${kgVoz(S.kg)}`:'';
  if(S.phase==='act')return `${E.n}. ${E.r} reps${kg}`;
  if(S.phase==='myo')return `Mini serie de ${S.target}`;
  if(S.phase==='ext')return `${E.extN}, ${S.target}`;
  if(S.phase==='hold')return `${E.extN}, hasta el fallo`;
  return `Vacío, ${S.levyT} segundos`}
function fraseDescanso(mode){
  if(mode==='rest')return `Descanso, ${Math.round(S.restDur)} segundos`;
  if(mode==='shift')return `Cambio ya: ${S.label}`;
  return S.esRonda?`Otra ronda. Descansa ${Math.round(S.restDur)} segundos`:`Siguiente: ${S.label}`}
/* ---------- peso y progresión ---------- */
const rirN=r=>r==='4+'?4:(parseInt(r,10)||0);
const e1=r=>(+r.kg||0)*(1+((parseInt(r.reps,10)||0)+rirN(r.rir))/30);   // 1RM estimado (Epley con reserva)
const incDe=kg=>kg<10?1:kg<40?2:2.5;
const incU=u=>esLb()?(u<25?2.5:5):incDe(u);   // paso en la unidad de la pantalla
const gDe=h=>h.g||Object.keys(CAT).find(k=>CAT[k].n===h.grupo);
// Por sesión anterior de un ejercicio (de la más reciente a la más antigua): su primera serie principal y el mejor 1RM estimado.
function previas(g,n,excl){const out=[];
  for(const h of hist){if(h.id===excl||gDe(h)!==g)continue;
    const r=(h.sets||[]).filter(x=>x.ej===n&&x.k==='act.'&&x.kg!=null);
    if(r.length)out.push({...r[0],mejor:Math.max(...r.map(e1)),fecha:h.start})}
  return out}
const descargaManual=()=>!!descarga.hasta&&Date.now()<Date.parse(descarga.hasta);
// descarga = la manual de 7 días o la última semana del bloque (la manual prevalece)
const descargaActiva=()=>descargaManual()||!!(bloqueSem()||{}).desc;
// Regla de doble progresión sobre la primera serie del ejercicio.
function regla(E,r){const [lo,hi]=rango(E.r),R=parseInt(r.reps,10)||0,n=rirN(r.rir),kg=+r.kg||0;
  if(descargaActiva())return {kg,txt:`semana de descarga: ${kgTxt(kg)} y para lejos del fallo`,cambio:false};
  if(kg>0&&(n>=4||(R>=hi&&n>=1))){const k=cambiaKg(E,kg,1);return {kg:k,txt:`sube a ${kgTxt(k)}`,cambio:true}}
  if(kg>0&&R<lo&&n===0){const k=cambiaKg(E,kg,-1);return {kg:k,txt:`baja a ${kgTxt(k)}`,cambio:true}}
  if(kg===0&&(n>=4||R>=hi+3))return {kg,txt:'añade peso o pasa a una variante más difícil',cambio:true};
  return {kg,txt:R>=hi?`repite ${kgTxt(kg)}`:`repite ${kgTxt(kg)} y busca ${hi} reps`,cambio:false}}
function sugerir(g,E){if(E.levy)return null;const p=previas(g,E.n)[0];return p?{...regla(E,p),prev:p}:null}
function prepEstacion(){const E=est();S.sug=sugerir(grupo,E);S.kg=S.sug?S.sug.kg:null;S.molAv=avisoMolestia(grupo,E);S.molDicho=false;
  // calentamiento solo antes del primer ejercicio con peso conocido del grupo en esta sesión
  S.cal=CFG.cal&&S.phase==='act'&&!E.levy&&S.kg>0&&!S.calHecho&&!S.sets.some(r=>r.k==='act.'&&r.kg>0)?planCal(S.kg,E):null;S.calI=0}
/* ---------- calentamiento y discos ---------- */
const CALP=[[.5,10],[.7,5],[.85,2]];
// discos y barra en la unidad de la pantalla (cada unidad tiene su lista)
const discosOk=()=>{const d=((esLb()?CFG.discosLb:CFG.discos)||[]).map(Number).filter(x=>x>0).sort((a,b)=>b-a);return d.length?d:esLb()?DISCOS_LB:DISCOS_STD};
const barraU=()=>esLb()?+CFG.barraLb||45:+CFG.barra||20;
const esBarra=E=>!!E&&!E.levy&&(CFG.barraEj&&E.n in CFG.barraEj?!!CFG.barraEj[E.n]:/barra/i.test(E.n));
const pasoBarra=()=>2*Math.min(...discosOk());
/* Un paso arriba (d > 0) o abajo. En kg, como siempre: 1 / 2 / 2,5 kg o, con barra, un par de los discos más pequeños.
   En libras, al siguiente múltiplo del paso (2,5 lb por debajo de 25 lb y 5 lb de ahí en adelante; con barra, desde la barra). */
function cambiaKg(E,kg,d){const u=aU(kg),bar=esBarra(E);let n;
  if(!esLb())n=d>0?u+(bar?pasoBarra():incDe(u)):u-(bar?pasoBarra():incDe(u-.01));
  else{const p=bar?pasoBarra():incU(d>0?u:u-.01),b=bar?barraU():0;
    n=d>0?b+(Math.floor((u-b)/p+1e-6)+1)*p:b+(Math.ceil((u-b)/p-1e-6)-1)*p;if(bar&&d>0)n=Math.max(n,b)}
  return Math.max(0,deU(Math.round(n*100)/100))}
function redondeaKg(x,E){const u=aU(x);let r;if(esBarra(E)){const b=barraU(),p=pasoBarra();r=u<=b?b:b+Math.round((u-b)/p)*p}else{const i=incU(u);r=Math.round(u/i)*i}return deU(r)}
function planCal(kg,E){const out=CALP.map(([f,r])=>({kg:redondeaKg(kg*f,E),reps:r,f})).filter(c=>c.kg>0&&c.kg<kg);return out.length?out:null}
/* Discos por lado: reparto EXACTO con el menor número de discos (hay pares de sobra de cada uno), por programación dinámica en centésimas
   y, a igual número, los más grandes. Si no cuadra exacto, el más cercano por debajo y cuánto falta. En la unidad de la pantalla. */
let discMemo={k:'',v:null};
function discosLado(kg){const D=discosOk(),r=(aU(kg)-barraU())/2,k=D.join()+'|'+r;if(discMemo.k===k)return discMemo.v;
  const F=100,N=Math.floor(r*F+1e-6),d=D.map(x=>Math.round(x*F)),out=[];let v=0;
  if(N>0){const best=new Int32Array(N+1).fill(1e9);best[0]=0;
    for(let i=1;i<=N;i++)for(const x of d)if(x>0&&x<=i&&best[i-x]+1<best[i])best[i]=best[i-x]+1;
    v=N;while(v>0&&best[v]>=1e9)v--;
    for(let w=v;w>0;){const j=d.findIndex(x=>x>0&&x<=w&&best[w-x]===best[w]-1);out.push(D[j]);w-=d[j]}}
  const res={out,falta:Math.max(0,Math.round((r-v/F)*1e4)/1e4)};discMemo={k,v:res};return res}
function discTxt(kg,E){if(!esBarra(E)||!(kg>0))return '';const b=barraU(),u=aU(kg),U=uTxt();
  if(u<b-.01)return `Menos que la barra sola (${num2(b)} ${U})`;if(Math.abs(u-b)<.01)return `Solo la barra (${num2(b)} ${U})`;
  const {out,falta}=discosLado(kg),g=[];out.forEach(d=>{const l=g[g.length-1];if(l&&l.d===d)l.n++;else g.push({d,n:1})});
  return `Por lado: ${g.map(x=>num2(x.d)+(x.n>1?' ×'+x.n:'')).join(' + ')||'nada'}${falta>.01?` y faltan ${num2(falta)} ${U}: con tus discos no cuadra exacto (es lo más cercano por debajo)`:''} · barra ${num2(b)}`}
/* ---------- molestias ---------- */
const ZONAS=['hombro','codo','muñeca','espalda baja','rodilla','otra'];
// Aviso si el ejercicio tuvo molestia en 2 de sus últimas 3 sesiones.
function avisoMolestia(g,E){if(!E||E.levy)return '';const ses=[];
  for(const h of hist){if(h.id===S.id||gDe(h)!==g)continue;const r=(h.sets||[]).filter(x=>x.ej===E.n);if(r.length)ses.push(r);if(ses.length>=3)break}
  const con=ses.filter(r=>r.some(x=>x.mol));if(con.length<2)return '';
  const z=[...new Set(con.flatMap(r=>r.filter(x=>x.mol).map(x=>x.mol)).filter(z=>z!=='sin zona'&&z!=='otra'))];
  return `Ojo: molestia${z.length?' en '+z.join(' y '):''} en ${con.length} de tus últimas ${ses.length} sesiones de ${E.s.toLowerCase()}. Baja el peso o cámbialo en el editor`}
function esRecord(row){if(row.k!=='act.'||!(row.kg>0))return false;
  const antes=previas(grupo,row.ej,S.id).map(p=>p.mejor);if(!antes.length)return false;
  const hoy=S.sets.filter(r=>r.ej===row.ej&&r.k==='act.'&&r.kg>0).map(e1);
  return e1(row)>Math.max(...antes,...hoy)*1.005}
function fanfarria(){beep(880,.12);setTimeout(()=>beep(1175,.12),140);setTimeout(()=>beep(1568,.35),280);vibrar([60,40,60,40,200])}
// Primero el bloque (multiplicador de la semana, dentro de META_MIN–META_MAX; descarga = la mitad), luego el ajuste por cómo llegas.
const metaBase=g=>{if(descargaActiva())return Math.max(2,Math.ceil(metas[g]/2));const b=bloqueSem();
  return b?Math.min(META_MAX,Math.max(META_MIN,Math.round(metas[g]*b.mult))):metas[g]};
// Si dormiste menos de 6 h o llegas con energía 1–2, la meta de hoy baja ~25 % (mínimo 2). Con energía 5 no sube.
const metaHoy=g=>bajaHoy()?Math.max(2,Math.round(metaBase(g)*.75)):metaBase(g);
function iniciarSesion(){const E0=CAT[grupo].e[0],b=bienDia();
  Object.assign(S,{id:'s'+Date.now()+Math.random().toString(36).slice(2,6),start:new Date().toISOString(),phase:E0.levy?'vac':'act',levyT:E0.levy?levy():0,
    meta:metaHoy(grupo),metaE:repartir(grupo),bien:bienDe(b),kRec:kDe(grupo),desc:descargaActiva()});prepEstacion()}
// En rutina: al cerrar un grupo, guarda y pasa al siguiente tras 2 min.
function sigueRutina(pre=''){const L=rutLista();if(!enRutina()||rutPos>=L.length-1)return false;
  rutEf+=S.ef;rutPos++;grupo=L[rutPos];S=fresh();iniciarSesion();const t=now();
  Object.assign(S,{st:'trans',t0:t,last:t,restDur:120,lastSec:-1,rutTrans:true});S.label=`${CAT[grupo].n}: ${etiqueta()}`;
  $('save').textContent='Sin guardar aún';beep(660,.2);vibrar([200,100,200]);decir(pre+`Grupo terminado. Sigue ${CAT[grupo].n}. Descansa dos minutos`);render();return true}
/* Serie efectiva (modelo de reps efectivas): serie completa con 5+ reps vale 1 a RIR 0–1, ¾ a RIR 2, ¼ a RIR 3 y 0 a RIR 4+
   (una serie suave no suma); mini-serie = la mitad; isometría hasta el fallo = ½ si dura 30 s; los vacíos no cuentan.
   El historial anterior guardaba «3+»: se cuenta como RIR 3. */
const PESO_RIR={'0':1,'1':1,'2':.75,'3':.25,'3+':.25,'4+':0};
function efectiva(r){
  if(r.rir==='—')return r.k==='isom.'?.5*Math.min(1,(parseInt(r.reps,10)||0)/30):0;
  const R=parseInt(r.reps,10)||0,q=PESO_RIR[r.rir]??0;
  return r.k==='myo'?q*.5*Math.min(1,R/4):q*Math.min(1,R/5)}
const efDe=sets=>sets.reduce((a,r)=>a+efectiva(r),0);
const ef1=x=>(Math.round(x*10)/10).toString().replace('.',',');
// reparte la meta del grupo entre sus ejercicios con series (los vacíos no llevan meta)
function repartir(g){const e=CAT[g].e,idx=e.map((x,i)=>x.levy?-1:i).filter(i=>i>=0),m=metaHoy(g),out=e.map(()=>0);
  idx.forEach((i,j)=>out[i]=Math.floor(m/idx.length)+(j<m%idx.length?1:0));return out}
const faltaE=()=>S.metaE[S.sec]-S.efE>.05;
// otra ronda del mismo ejercicio: descanso hasta recuperar ~85 % de la capacidad (60–180 s)
function otraRonda(row){
  S.ronda++;S.nIn=0;S.phase='act';S.esRonda=true;
  const r=Math.min(180,Math.max(60,S.tauC/(S.kRec||1)*Math.log(Math.max(1.01,(1-S.C)/.15))));row.rest=Math.round(r);
  return {row,mode:'trans',rest:r}}
const cerrarEstacion=row=>faltaE()&&S.ronda<MAXRONDA?otraRonda(row):siguienteEstacion(row);
function siguienteEstacion(row){
  if(S.sec>=CAT[grupo].e.length-1)return {row,mode:'done',rest:0};
  S.sec++;S.nIn=0;S.R1=0;S.RTF=0;S.efE=0;S.serE=0;S.ronda=1;S.esRonda=false;const E=est();
  if(E.levy){S.phase='vac';S.levyN=0;S.levyT=levy()}else S.phase='act';
  prepEstacion();
  const r=E.levy?45:90;row.rest=r;return {row,mode:'trans',rest:r}}
function avanzar(ev){
  const E=est(),ph=S.phase;
  if(ev.hold!=null){
    const sg=ev.hold;bump(sg/2.5,1,sg,false);S.iso+=sg;
    const row={ex:ph==='vac'?'Vacío':E.s,ej:E.n,k:ph==='vac'?`obj ${S.levyT} s`:'isom.',reps:Math.round(sg)+' s',rir:'—',P:S.P,rest:0};
    const c=efectiva(row);S.efE+=c;S.ef+=c;
    if(ph==='vac'){S.levyN++;if(S.levyN<3){S.levyT=levy();const r=30+15*Math.random();row.rest=Math.round(r);return {row,mode:'rest',rest:r}}
      return siguienteEstacion(row)}
    return cerrarEstacion(row)}
  const R=ev.R,rir=ev.rir,p=R/(R+rir+1e-9);
  if(ph==='act'){S.R1=R;S.RTF=R+rir}
  bump(R,p,ev.dur,ph==='ext');S.nIn++;
  const row={ex:E.s,ej:E.n,k:ph==='act'?'act.':ph==='ext'?(E.ext==='part'?'parc.':'final'):'myo',reps:String(R),rir:rir>=4?'4+':String(rir),
    kg:ph==='ext'&&E.ext==='flat'?null:S.kg,P:S.P,rest:0};
  // para calibrar: objetivo que dio el motor, capacidad prevista y factor de recuperación usado
  if(ph==='myo'&&S.Cpre!=null){row.obj=S.target;row.Cpre=Math.round(S.Cpre*1000)/1000;row.kc=S.kRec||1}
  const c=efectiva(row);S.efE+=c;S.ef+=c;
  if(ph==='act'&&row.kg!=null&&S.ronda===1){const rg=regla(E,row);if(rg.cambio)S.aviso=`Próxima vez en ${E.s}: ${rg.txt}`}
  if(S.desc)return avanzarDescarga(R,row);
  if(ph==='ext')return cerrarEstacion(row);
  if(!faltaE())return siguienteEstacion(row);
  if(ph==='act'&&S.ronda>1&&c<1/3)return siguienteEstacion(row);
  // recuperación aprendida (k = 1 sin datos): el descanso se estira ×1/k y la capacidad prevista se escala ×k
  const kr=S.kRec||1,ts=kr===1?restStar():Math.min(150,Math.max(10,restStar()/kr)),Cp=kr*recC(S.C,S.tauC,ts),pred=S.RTF*Cp;
  if((ph==='myo'&&R<.5*S.R1)||pred*.65<3||S.nIn>MAXMYO){
    row.rest=SHIFT;
    if(E.ext==='hold')S.phase='hold';
    else{S.phase='ext';S.target=Math.max(5,Math.round(S.RTF*E.k*recC(S.C,S.tauC,SHIFT)*.9))}
    return {row,mode:'shift',rest:SHIFT}}
  S.phase='myo';S.target=Math.max(3,Math.round(pred*(.65+.25*Math.random())));S.Cpre=Cp;row.rest=Math.round(ts);
  return {row,mode:'rest',rest:ts}}
/* Semana de descarga (S.desc, fijado al empezar): series rectas, sin mini-series, parciales, variante ni isometría al fallo; 2–3 en reserva;
   descanso fijo de 2 min (o el t* si fuera mayor) y la meta del ejercicio en SERIES COMPLETAS (5 reps o más, cualquier reserva), sin otras rondas.
   Si una serie no llega a 5 reps no cuenta; como mucho 2 intentos de más por ejercicio. Sin descarga el motor no pasa por aquí. */
const DESC_REST=120,serDe=sets=>(sets||[]).filter(r=>r.k==='act.'&&(parseInt(r.reps,10)||0)>=5).length;
function avanzarDescarga(R,row){if(R>=5)S.serE++;const m=S.metaE[S.sec]||0;
  if(S.serE>=m||S.nIn>=m+2)return siguienteEstacion(row);
  const kr=S.kRec||1,ts=Math.max(DESC_REST,kr===1?restStar():restStar()/kr);row.rest=Math.round(ts);
  return {row,mode:'rest',rest:ts}}
// meta alcanzada: efectivas (o, en descarga, series completas)
const metaHecha=()=>S.desc?serDe(S.sets)>=S.meta:S.ef>=S.meta-.05;
/* ---------- deshacer: antes de cada serie se guarda una copia profunda del motor (y de lo que una rutina cambia al pasar de grupo) ---------- */
const PILA_MAX=5;let pila=[],rirPrev=null;   // rirPrev: la reserva que habías marcado en la serie deshecha
const clon=o=>typeof structuredClone==='function'?structuredClone(o):JSON.parse(JSON.stringify(o));
function deshacer(){const p=pila.pop();if(!p)return;const idAhora=S.id;
  S=clon(p.S);grupo=p.grupo;rutPos=p.rutPos;rutEf=p.rutEf;
  medVistas=clon(p.med);try{localStorage.setItem(MEDKEY,JSON.stringify(medVistas))}catch(e){}
  if(idAhora&&idAhora!==S.id)hist=hist.filter(h=>h.id!==idAhora);   // el grupo siguiente de la rutina aún no tenía nada propio
  const t=now();
  if(p.ev.hold!=null){S.t0=t-p.ev.hold;S.last=t}   // isometría o vacío: sigue contando desde donde la soltaste
  else rirPrev=p.ev.rir;
  if(sinCal(S.sets).length)guardar(false);else{hist=hist.filter(h=>h.id!==S.id);escribirHist();$('save').textContent='Sin guardar aún';pintarHist()}
  decir(p.ev.hold!=null?'Deshecho. Sigue':'Serie deshecha. Corrige el reporte');renderGrupos();render()}
$('deshacer').onclick=deshacer;
function aplicar(ev){
  pila.push({S:clon(S),grupo,rutPos,rutEf,med:clon(medVistas||{}),ev:{R:ev.R,rir:ev.rir,hold:ev.hold}});if(pila.length>PILA_MAX)pila.shift();rirPrev=null;
  const mol=S.molR;S.molR=null;
  const o=avanzar(ev),t=now(),pr=esRecord(o.row);if(pr)o.row.pr=true;if(mol!=null)o.row.mol=mol||'sin zona';S.sets.push(o.row);
  Object.assign(S,{P0:S.P,C0:S.C,t0:t,last:t,restDur:o.rest,lastSec:-1});
  if(pr){S.pr=t+6;S.prK='¡Récord personal!';S.prTxt=`${o.row.ex}: ${kgTxt(o.row.kg)} × ${o.row.reps}`;fanfarria()}
  const yaPr=pr?'¡Récord personal! ':'';
  if(o.mode==='done'){S.st='done';guardar(true);const md=revisarMedallas(),pre=yaPr+fraseMed(md);
    if(sigueRutina(pre)){celebrar(md,t);return}celebrar(md,t);
    if(!pr&&!md.length){beep(660,.2);setTimeout(()=>beep(990,.35),220)}vibrar([200,100,200]);
    decir(pre+(rutPos>0?`Rutina terminada. ${ef1(rutEf+S.ef)} series efectivas en total`:S.desc?`Sesión de descarga terminada. ${serDe(S.sets)} series completas`:`Sesión terminada. ${ef1(S.ef)} series efectivas`));render();return}
  S.st=o.mode;S.label=etiqueta();vibrar([80,60,80]);guardar(false);const md=revisarMedallas();celebrar(md,t);
  decir(yaPr+fraseMed(md)+(S.aviso?S.aviso+'. ':'')+fraseDescanso(o.mode));render()}
function repsDe(sets){return sets.reduce((a,r)=>a+(r.rir!=='—'?parseInt(r.reps,10)||0:0),0)}
const sinCal=sets=>(sets||[]).filter(r=>r.k!=='cal.');   // las series de calentamiento no cuentan como series
function guardar(completa){
  if(!S.id||!sinCal(S.sets).length)return;
  const ent={id:S.id,start:S.start,g:grupo,grupo:CAT[grupo].n,series:sinCal(S.sets).length,reps:repsDe(S.sets),tuc:Math.round(S.tuc),iso:Math.round(S.iso),completa:!!completa,sets:S.sets,
    efectivas:Math.round(efDe(S.sets)*100)/100,meta:S.meta,bien:S.bien||undefined,nota:S.nota||undefined,
    antes:!completa&&S.antes||undefined,desc:S.desc||undefined,serC:S.desc?serDe(S.sets):undefined,
    rut:enRutina()?{n:RUTINAS[rutI].mia?'La mía':RUTINAS[rutI].n,pos:rutPos,de:rutLista().length}:undefined};
  hist=[ent].concat(hist.filter(h=>h.id!==S.id));   // sin tope: nunca se borran sesiones viejas
  $('save').textContent=escribirHist()?'Guardado ✓':'Sin espacio: no se guardó (mira el aviso)';
  if(persistE==null)pedirPersist();pintarHist()}
/* ---------- almacenamiento: historial completo en localStorage (compartido con Comida, ~5 millones de caracteres por origen).
   Si no cabe NO se borra nada: queda en memoria, se avisa y se sugiere la copia de seguridad completa (que lo lleva entero). ---------- */
const LS_MAX=5.2e6;let sinEspacio=false,persistE=null,histSucio=false;
function escribirHist(){try{localStorage.setItem(KEY,JSON.stringify(hist));if(sinEspacio){sinEspacio=false;renderAlmacen()}return true}
  catch(e){sinEspacio=true;renderAlmacen();return false}}
const usoLS=()=>{let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=k.length+(localStorage.getItem(k)||'').length}}catch(e){}return n};
// El navegador decide solo (no sale ningún cuadro). Se pide una vez; si lo niega, se vuelve a pedir como mucho una vez por semana.
async function pedirPersist(){const st=navigator.storage;if(!st||!st.persisted){persistE=false;renderAlmacen();return}
  try{persistE=await st.persisted();
    if(!persistE&&st.persist&&hist.length&&!(CFG.persistT&&Date.now()-CFG.persistT<7*864e5)){CFG.persistT=Date.now();guardarCfg();persistE=await st.persist()}}catch(e){persistE=false}
  renderAlmacen()}
function renderAlmacen(){const u=usoLS(),pc=Math.round(100*u/LS_MAX),lleno=pc>=70;
  $('almacen').innerHTML=`Guardado en este teléfono: <b>${hist.length} ${hist.length===1?'sesión':'sesiones'}</b>, sin límite · ${Math.round(u/1024)} KB de unos ${Math.round(LS_MAX/1048576)} MB que el navegador da a esta app y a Comida (${pc} %)`
    +` · almacenamiento ${persistE?'<b>persistente</b> ✓ (el navegador no lo borra por falta de espacio)':persistE===false?'no persistente: si el teléfono se queda sin espacio, el navegador podría borrarlo; instalar la app ayuda y la copia de seguridad te protege':'sin comprobar'}.`
    +(lleno&&!sinEspacio?' <b>Se está llenando:</b> haz una copia de seguridad completa.':'')
    +(descLeer.mal?` ${descLeer.mal} ${descLeer.mal===1?'registro guardado no tenía':'registros guardados no tenían'} un formato válido y se ${descLeer.mal===1?'ignoró':'ignoraron'}.`:'');
  const el=$('cuotaAv');el.hidden=!sinEspacio;
  if(sinEspacio)el.innerHTML=`<span><b>El teléfono no deja guardar más en esta app</b> (${pc} % del espacio del navegador, compartido con Comida). Lo último que hiciste sigue en pantalla, pero <b>no quedó guardado</b>. No se borró nada: haz ahora una copia de seguridad completa y guárdala fuera del teléfono.</span><button type="button" class="btn2" data-cuota="1">Hacer copia de seguridad</button>`}
document.addEventListener('click',e=>{if(e.target.closest('[data-cuota]'))hacerCopia($('cuotaAv').querySelector('span'))});
// El historial solo se redibuja si está a la vista (con muchas sesiones cuesta); si no, al abrir la pestaña.
function pintarHist(){if(tab==='historial')renderHist();else histSucio=true}

/* «Bajo congestión» = tiempo con P > 0,5. En los descansos se integra con P0·e^(−t/τP): con P0 > 0,5 dura τP·ln(P0/0,5) desde el inicio,
   así que suma bien aunque los tics se duerman con la pantalla apagada. En la serie (y el calentamiento) P no cambia. */
function tick(){
  if(['work','cal','rest','shift','trans'].indexOf(S.st)<0)return;
  const t=now(),t1=S.last||t;S.last=t;
  if(S.st!=='work'&&S.st!=='cal'){
    const e=t-S.t0;S.P=S.P0*Math.exp(-e/TP);S.C=recC(S.C0,S.tauC,e);
    const rem=Math.ceil(S.restDur-e);if(rem!==S.lastSec){S.lastSec=rem;if(rem>=1&&rem<=3){beep(660,.08);vibrar(40)}if(rem===10&&S.restDur>=25)decir('Faltan diez segundos')}
    if(S.P0>.5){const th=TP*Math.log(S.P0/.5);S.tuc+=Math.max(0,S.t0-t1)+Math.max(0,Math.min(e,th)-Math.max(0,t1-S.t0))}
    if(e>=S.restDur){empezar();return}
  }else{if(S.P>.5)S.tuc+=Math.max(0,t-t1);tempoTick()}
  render()}
setInterval(tick,200);

const activarAudio=()=>{try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch(e){}};
const sinGrupo=()=>!!RUTINAS[rutI].mia&&!miaLista.length;
$('pad').onclick=async()=>{
  activarAudio();
  try{lock=lock||await navigator.wakeLock?.request('screen')}catch(e){}
  const t=now();
  if(S.st==='idle'){
    if(sinGrupo()){render();return}   // «La mía» sin grupos: no empieza
    // antes de la primera sesión del día: cómo llegas (un segundo toque empieza igual). Si Comida ya anotó el sueño, solo pregunta la energía.
    if(!bienHoy()&&!bienOmit&&!pideBien){pideBien=true;bienEd=bienEd||bienDe(bienDia())||{};render();$('bien').scrollIntoView?.({block:'nearest',behavior:'smooth'});return}
    if(retomar)descartarRetomar();
    pideBien=false;$('editor').hidden=true;if(rutPos===0)rutEf=0;pila=[];rirPrev=null;iniciarSesion();empezar()}
  else if(S.st==='cal'){const E=est(),c=S.cal[S.calI];
    S.calI++;const fin=S.calI>=S.cal.length,r=fin?75:45;if(fin)S.calHecho=true;
    S.sets.push({ex:E.s,ej:E.n,k:'cal.',reps:String(c.reps),rir:'—',kg:c.kg,P:S.P,rest:r});
    Object.assign(S,{st:'rest',P0:S.P,C0:S.C,t0:t,last:t,restDur:r,lastSec:-1,calRest:true});
    const sg=fin?null:S.cal[S.calI];S.label=fin?etiqueta():`Calentamiento ${S.calI+1}/${S.cal.length}: ${kgTxt(sg.kg)} × ${sg.reps}`;
    vibrar([80,60,80]);decir(fin?`Calentamiento listo. Descansa ${r} segundos y va la serie de trabajo`:`Descansa ${r} segundos. Sigue ${sg.reps} con ${kgVoz(sg.kg)}`);render()}
  else if(S.st==='work'){const dur=t-S.t0;
    if(S.phase==='hold'||S.phase==='vac'){aplicar({hold:dur});return}
    Object.assign(S,{st:'report',workDur:dur,hechas:S.phase==='act'?est().d:S.target,molR:null});render()}
  else if(['rest','shift','trans'].indexOf(S.st)>=0)empezar();
};
$('calSalta').onclick=()=>{if(!S.cal)return;const ya=S.st==='cal'||(S.st==='rest'&&S.calRest);S.cal=null;S.calHecho=true;
  if(ya)empezar();else render()};
$('minus').onclick=()=>{S.hechas=Math.max(1,S.hechas-1);render()};
$('plus').onclick=()=>{S.hechas=Math.min(80,S.hechas+1);render()};
document.querySelectorAll('.rir button').forEach(b=>b.onclick=()=>{if(S.st==='report')aplicar({R:S.hechas,rir:+b.dataset.r,dur:S.workDur})});
$('molB').onclick=e=>{const b=e.target.closest('button');if(!b||S.st!=='report')return;const z=b.dataset.z;
  if(z==='')S.molR=S.molR==null?'':null;else S.molR=S.molR===z?'':z;render()};
// «Completa» solo si llegaste a la meta; si no, «Terminada antes (x de y)».
$('terminar').onclick=()=>{if(sinCal(S.sets).length&&S.st!=='done'){const ok=metaHecha();S.st='done';S.antes=!ok;guardar(ok);const md=revisarMedallas(),t=now();
  if(sigueRutina(fraseMed(md))){celebrar(md,t);return}celebrar(md,t);if(md.length)decir(fraseMed(md));render()}};
// Con una sesión en curso pide un segundo toque (5 s) dentro de la página; lo ya reportado queda guardado como «Parcial».
let nuevaConf=0;
$('nueva').onclick=()=>{if(enCurso()&&Date.now()>nuevaConf){nuevaConf=Date.now()+5000;render();setTimeout(render,5100);return}
  nuevaConf=0;rutPos=0;rutEf=0;pideBien=false;pila=[];rirPrev=null;if(enRutina())grupo=rutLista()[0];S=fresh();$('save').textContent='Sin guardar aún';renderGrupos();render();intentaRecarga()};
// Peso: − y + dan un paso; tocando el número se escribe (en blanco = sin anotar, 0 = peso corporal). Sin peso previo, + empieza en la barra o en un paso.
$('kgMas').onclick=()=>{const E=est();S.kg=S.kg==null?deU(esBarra(E)?barraU():incU(0)):cambiaKg(E,S.kg,1);render()};
$('kgMenos').onclick=()=>{const E=est();if(S.kg==null)S.kg=0;else S.kg=cambiaKg(E,S.kg,-1);render()};
$('kgv').addEventListener('input',()=>{const t=$('kgv').value.trim().replace(',','.');if(S.st!=='report')return;
  if(t===''){S.kg=null;render();return}const v=parseFloat(t);if(/^\d*\.?\d*$/.test(t)&&v>=0&&v<=(esLb()?1100:500)){S.kg=deU(v);render()}});
$('kgv').addEventListener('focus',()=>{try{$('kgv').select()}catch(e){}});
$('kgv').addEventListener('keydown',e=>{if(e.key==='Enter')$('kgv').blur()});
$('barraT').onclick=()=>{const E=est();CFG.barraEj={...(CFG.barraEj||{}),[E.n]:!esBarra(E)};guardarCfg();render()};
$('notaOk').onclick=()=>{S.nota=$('notaIn').value.trim().slice(0,140);guardar(true);$('notaMsg').textContent=S.nota?'Nota guardada ✓':'Nota borrada'};
$('tProg').onclick=()=>{tab='progreso';renderProg();render()};
$('cVoz').onclick=()=>{CFG.voz=!CFG.voz;guardarCfg();if(CFG.voz)decir('Voz activada')};
$('cVib').onclick=()=>{CFG.vibra=!CFG.vibra;guardarCfg();vibrar(200)};
$('cProbar').onclick=()=>{vibrar([80,60,80]);decir(CFG.voz?'Descanso, noventa segundos. Faltan diez segundos.':'')};
function guardarCfg(){try{localStorage.setItem(AKEY,JSON.stringify(CFG))}catch(e){}renderCfg()}
function renderCfg(){$('cVoz').setAttribute('aria-pressed',CFG.voz);$('cVib').setAttribute('aria-pressed',CFG.vibra);
  $('cVoz').textContent=CFG.voz?'Voz: sí':'Voz: no';$('cVib').textContent=CFG.vibra?'Vibración: sí':'Vibración: no';
  $('cCal').setAttribute('aria-pressed',!!CFG.cal);$('cCal').textContent=CFG.cal?'Calentamiento: sí':'Calentamiento: no';
  $('cUni').querySelectorAll('[data-u]').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.u==='lb')===esLb()));
  $('cBarra').innerHTML=(esLb()?BARRAS_LB:BARRAS).map(b=>`<button type="button" data-b="${b}" aria-pressed="${barraU()===b}">${num2(b)} ${uTxt()}</button>`).join('');
  $('cDiscoN').placeholder=`Otro disco (${uTxt()})`;
  const todos=[...new Set([...(esLb()?DISCOS_LB:DISCOS_STD),...(CFG[kX()]||[]),...misDiscos()].map(Number))].sort((a,b)=>b-a),on=new Set(misDiscos());
  $('cDiscos').innerHTML=todos.map(d=>`<button type="button" data-d="${d}" aria-pressed="${on.has(d)}">${num2(d)}</button>`).join('');
  const T=tempoCfg();$('cTempo').setAttribute('aria-pressed',T.on);$('cTempo').textContent=T.on?'Tempo: sí':'Tempo: no';
  $('cTempoVoz').setAttribute('aria-pressed',T.voz);$('cTempoVoz').textContent=T.voz?'Contar en voz: sí':'Contar en voz: no';
  $('cTempos').innerHTML=[...new Set([...TEMPOS,T.t])].map(t=>`<button type="button" data-t="${esc(t)}" aria-pressed="${t===T.t}">${esc(t)}</button>`).join('');
  $('resPeso').setAttribute('aria-pressed',!!CFG.resPeso);$('resPeso').textContent=CFG.resPeso?'Incluir peso corporal: sí':'Incluir peso corporal: no';
  renderCalib()}
const fijarTempo=o=>{CFG.tempo={...tempoCfg(),...o};guardarCfg()};
$('cTempo').onclick=()=>fijarTempo({on:!tempoCfg().on});
$('cTempoVoz').onclick=()=>fijarTempo({voz:!tempoCfg().voz});
$('cTempos').onclick=e=>{const b=e.target.closest('[data-t]');if(b)fijarTempo({t:b.dataset.t})};
$('cTempoAdd').onclick=()=>{const v=$('cTempoN').value.trim().replace(/[\s/.,]+/g,'-');const p=v.split('-').map(Number);
  if(p.length!==4||String(tempoP(v))!==String(p)){$('cTempoN').value='';$('cTempoN').placeholder='4 números de 0 a 9, p. ej. 3-1-2-0';return}
  $('cTempoN').value='';fijarTempo({t:p.join('-'),on:true})};
/* ---------- recuperación aprendida: k_g = mediana de (reps hechas / objetivo sin calibrar) de las mini-series del grupo ---------- */
const CALIB_MIN=8;
function calib(){const r={};Object.keys(CAT).forEach(g=>r[g]=[]);const desde=calibC.desde?Date.parse(calibC.desde):0;
  hist.forEach(h=>{const g=gDe(h);if(!r[g]||(desde&&Date.parse(h.start)<=desde))return;
    (h.sets||[]).forEach(x=>{const R=parseInt(x.reps,10);if(x.k==='myo'&&+x.obj>0&&R>=0)r[g].push(R/x.obj*(+x.kc||1))})});   // ×kc: deshace la calibración ya aplicada
  const out={};for(const g in r){const v=r[g].sort((a,b)=>a-b),n=v.length,med=n?(n%2?v[(n-1)/2]:(v[n/2-1]+v[n/2])/2):1;
    // acotada a 0,7–1,3 y encogida hacia 1 según cuántos datos hay (con 8 pesa la mitad)
    const mc=Math.min(1.3,Math.max(.7,med)),k=n>=CALIB_MIN?Math.min(1.3,Math.max(.7,1+(mc-1)*n/(n+CALIB_MIN))):1;out[g]={k:Math.round(k*1000)/1000,n,med}}
  return out}
const kDe=g=>(calib()[g]||{k:1}).k;
let calibBorrar=false;
function renderCalib(){const c=calib(),pc=k=>Math.round(Math.abs(1/k-1)*100);
  $('cCalib').innerHTML=`<p class="muted" style="font-size:13px;margin:0 0 6px">El reloj compara las reps que haces en cada mini-serie con las que esperaba. Si sueles hacer menos, alarga el descanso y baja el objetivo; si haces más, lo acorta. Hacen falta ${CALIB_MIN} mini-series por grupo.</p>
    <div class="tbl"><table><thead><tr><th>Grupo</th><th>Factor</th><th>Datos</th><th style="text-align:left;padding-left:10px">Qué significa</th></tr></thead><tbody>${Object.keys(CAT).map(g=>{const x=c[g];
      const q=x.n<CALIB_MIN?`faltan ${CALIB_MIN-x.n} mini-series`:Math.abs(x.k-1)<.005?'te recuperas como predice':x.k<1?`descansos ${pc(x.k)} % más largos, objetivo más bajo`:`descansos ${pc(x.k)} % más cortos, objetivo más alto`;
      return `<tr><td>${CAT[g].n}</td><td>${num2(x.k)}</td><td>${x.n}</td><td style="text-align:left;padding-left:10px;white-space:normal">${q}</td></tr>`}).join('')}</tbody></table></div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px"><button id="calibRes" type="button" class="btn2${calibBorrar?' peligro':''}">${calibBorrar?'¿Seguro? Toca otra vez':'Reiniciar calibración'}</button>
    <span class="hint">${calibC.desde?'Cuenta desde el '+new Date(calibC.desde).toLocaleDateString('es-DO',{day:'numeric',month:'short',year:'numeric'}):'Cuenta todas tus sesiones'}</span></div>`;
  $('calibRes').onclick=()=>{if(!calibBorrar){calibBorrar=true;renderCalib();return}calibBorrar=false;calibC={desde:new Date().toISOString()};guardarObj(CKEY,calibC);renderCalib()}}
$('cCal').onclick=()=>{CFG.cal=!CFG.cal;guardarCfg()};
$('cBarra').onclick=e=>{const b=e.target.closest('[data-b]');if(b){CFG[esLb()?'barraLb':'barra']=+b.dataset.b;guardarCfg()}};
const kD=()=>esLb()?'discosLb':'discos',kX=()=>esLb()?'discosXLb':'discosX',misDiscos=()=>(CFG[kD()]||(esLb()?DISCOS_LB:[])).map(Number);
$('cDiscos').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;const d=+b.dataset.d,L=misDiscos();
  CFG[kD()]=L.includes(d)?L.filter(x=>x!==d):[...L,d];guardarCfg()};
$('cDiscoAdd').onclick=()=>{const d=parseFloat($('cDiscoN').value.replace(',','.'));if(!(d>0&&d<=(esLb()?100:50)))return;
  CFG[kX()]=[...new Set([...(CFG[kX()]||[]),d])];CFG[kD()]=[...new Set([...misDiscos(),d])];$('cDiscoN').value='';guardarCfg()};
$('cUni').onclick=e=>{const b=e.target.closest('[data-u]');if(b){CFG.uni=b.dataset.u;guardarCfg();lastPlan='';render()}};   // solo cambia la vista: se puede en cualquier momento
/* ---------- editor de ejercicios: cambiar, agregar (hasta 5) y quitar (mínimo 2) ---------- */
let edI=-1,edModo='';   // 'base' (original), 'extra' (agregado), 'nuevo' o 'vacio'
const opts=L=>[...new Set(L)].map(n=>`<option value="${esc(n)}">`).join('');
const catGeneral=()=>[...Object.keys(SUGEJ),...Object.values(BASE).flatMap(G=>G.e.filter(e=>!e.levy).map(e=>e.n)),...Object.values(ALT).flat()];
const edMi=()=>misEj[grupo]=misEj[grupo]||{};
function formaUI(){const f=$('edF').value;$('edFNl').textContent=f==='part'?'Nombre de los parciales':f==='hold'?'Nombre de la isometría':'Nombre de la variante fácil'}
function llenarEd(o){$('edN').value=o.n||'';$('edS').value=o.s||'';const r=o.r||'8–12',rs=RANGOS.includes(r)?RANGOS:[r,...RANGOS];
  $('edR').innerHTML=rs.map(x=>`<option${x===r?' selected':''}>${esc(x)}</option>`).join('');
  $('edF').value=o.ext||'part';$('edFN').value=o.extN||'';$('edFH').value=o.extH||'';$('edTe').value=o.tempo&&o.tempo!=='controlado · 2–3 s abajo'?o.tempo:'';formaUI()}
function abrirEditor(i){if(enCurso())return;const G=CAT[grupo],E=i==null?null:G.e[i],N=G.e.length,conSeries=G.e.filter(x=>!x.levy).length;
  if(i!=null&&!E)return;edI=i==null?-1:i;edModo=!E?'nuevo':E.levy?'vacio':E.xi!=null?'extra':'base';
  if(edModo==='nuevo'&&N>=EST_MAX)return;
  const gn=G.n.toLowerCase();
  if(edModo==='base'){$('edT').textContent=`Cambiar ${E.s.toLowerCase()} (${gn})`;llenarEd(E);$('edL').innerHTML=opts([BASE[grupo].e[E.b].n,...ALT[grupo]])}
  else if(edModo==='vacio')$('edT').textContent=`${E.n} (${gn})`;
  else{const ya=new Set(G.e.map(x=>x.n)),n=edModo==='nuevo'?[SUG_DEF[grupo],...ALT[grupo].filter(x=>SUGEJ[x]),...ALT[grupo]].find(x=>!ya.has(x))||'':'';$('edT').textContent=edModo==='nuevo'?`Agregar ejercicio (${gn})`:`Editar ${E.s.toLowerCase()} (${gn})`;
    llenarEd(edModo==='nuevo'?{n,...(SUGEJ[n]||{})}:E);$('edL').innerHTML=opts([...ALT[grupo],...catGeneral()])}
  $('edCampos').hidden=edModo==='vacio';$('edX').hidden=!(edModo==='nuevo'||edModo==='extra');
  $('edRes').hidden=edModo!=='base';$('edOk').hidden=edModo==='vacio';
  $('edQu').hidden=edModo==='nuevo'||N<=EST_MIN||(!E.levy&&conSeries<=1);
  $('edHint').textContent=edModo==='base'?'Se conserva la forma de llegar al fallo de la estación original (parciales, isometría o variante fácil).'
    :edModo==='vacio'?'El vacío no se edita: siempre cierra el abdomen con 3 vacíos. Puedes quitarlo.'
    :`Al final de cada ejercicio, cuando ya no da, el reloj cambia a la forma que elijas para llegar al fallo. De ${EST_MIN} a ${EST_MAX} ejercicios por grupo.`;
  $('editor').hidden=false;if(edModo!=='vacio')$('edN').focus()}
$('edN').addEventListener('change',()=>{const sg=SUGEJ[$('edN').value.trim()];if(sg&&(edModo==='nuevo'||edModo==='extra'))llenarEd({n:$('edN').value.trim(),...sg})});
$('edF').onchange=formaUI;
function guardarEj(){const M=misEj[grupo];if(M){if(M.x&&!M.x.length)delete M.x;if(M.q&&!M.q.length)delete M.q;if(!Object.keys(M).length)delete misEj[grupo]}
  try{localStorage.setItem(EJKEY,JSON.stringify(misEj))}catch(e){}aplicarEjercicios();$('editor').hidden=true;renderMeta();render()}
$('edOk').onclick=()=>{const n=$('edN').value.trim();if(!n)return;
  const s=($('edS').value.trim()||n.split(' ')[0]).slice(0,14),r=$('edR').value,E=CAT[grupo].e[edI];
  if(edModo==='base'){const b=BASE[grupo].e[E.b];
    if(n===b.n&&s===b.s&&r===b.r)delete edMi()[E.b];else edMi()[E.b]={n,s,r};return guardarEj()}
  const f=$('edF').value,dflt={part:'Parciales',hold:'Isometría',flat:'Variante fácil'}[f];
  const o={n,s,r,ext:f,extN:$('edFN').value.trim().slice(0,40)||dflt,extH:$('edFH').value.trim().slice(0,60)||'hasta el fallo',tempo:$('edTe').value.trim().slice(0,50)||'controlado · 2–3 s abajo'};
  const M=edMi();M.x=Array.isArray(M.x)?M.x:[];if(edModo==='extra')M.x[E.xi]=o;else if(CAT[grupo].e.length<EST_MAX)M.x.push(o);guardarEj()};
$('edRes').onclick=()=>{const E=CAT[grupo].e[edI];if(misEj[grupo]&&E)delete misEj[grupo][E.b];guardarEj()};
$('edQu').onclick=()=>{const E=CAT[grupo].e[edI];if(!E||CAT[grupo].e.length<=EST_MIN)return;const M=edMi();
  if(E.xi!=null)M.x.splice(E.xi,1);else M.q=[...new Set([...(M.q||[]),E.b])];guardarEj()};
$('edNo').onclick=()=>{$('editor').hidden=true};
$('plan').onclick=e=>{const b=e.target.closest('[data-i]');if(b&&S.st==='idle')abrirEditor(+b.dataset.i)};
// Debajo del plan: agregar y recuperar las originales que quitaste.
function renderPlanX(){const el=$('planX');if(S.st!=='idle'){el.innerHTML='';el.hidden=true;return}
  const M=misEj[grupo]||{},N=CAT[grupo].e.length,q=(M.q||[]).filter(b=>BASE[grupo].e[b]&&!CAT[grupo].e.some(x=>x.b===b));
  el.hidden=false;el.innerHTML=(N<EST_MAX?'<button type="button" class="btn2" data-padd="1">+ Agregar ejercicio</button>':`<span class="hint">${EST_MAX} ejercicios: el máximo.</span>`)
    +(N<EST_MAX?q.map(b=>`<button type="button" class="lnk" data-prec="${esc(b)}">Recuperar ${esc(((M[b]||{}).n)||BASE[grupo].e[b].n)}</button>`).join(''):'')}
$('planX').onclick=e=>{if(S.st!=='idle')return;const a=e.target.closest('[data-padd]'),r=e.target.closest('[data-prec]');
  if(a)abrirEditor(null);
  if(r){const M=edMi();M.q=(M.q||[]).filter(b=>b!==+r.dataset.prec);guardarEj()}};
/* ---------- descarga ---------- */
const diaK=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const diasEntrenados=dias=>new Set(hist.filter(h=>Date.now()-Date.parse(h.start)<dias*864e5).map(h=>diaK(Date.parse(h.start)))).size;
// Ejercicios cuyo 1RM estimado bajó en las 3 últimas sesiones (de las 4 últimas semanas y después de la última descarga).
function estancados(){const desde=Math.max(descarga.fin?Date.parse(descarga.fin):0,Date.now()-28*864e5),out=[];
  const vistos=new Set();
  for(const h of hist){const g=gDe(h);for(const r of h.sets||[]){if(!r.ej||r.k!=='act.'||!(r.kg>0))continue;const k=g+'|'+r.ej;if(vistos.has(k))continue;vistos.add(k);
    const p=previas(g,r.ej).filter(x=>Date.parse(x.fecha)>desde&&x.mejor>0).slice(0,3);if(p.length<3)continue;
    const [c,b,a]=p.map(x=>x.mejor);if(b<=a&&c<b&&c<=a*.97)out.push(r.ej)}}
  return out}
function semanasSinDescarga(){if(!hist.length)return 0;
  const desde=Math.max(descarga.fin?Date.parse(descarga.fin):0,Date.parse(hist[hist.length-1].start));return Math.floor((Date.now()-desde)/(7*864e5))}
function consejoDescarga(){if(descargaActiva())return null;const e=estancados(),w=semanasSinDescarga();
  if(e.length>=2)return `Rindes menos desde hace 3 sesiones en <b>${e.slice(0,3).map(esc).join(', ')}</b>: es fatiga acumulada, no falta de ganas.`;
  if(w>=8&&diasEntrenados(14)>=6)return `Llevas <b>${w} semanas</b> entrenando fuerte sin una semana suave.`;
  return null}
function bannerDesc(){
  if(!descargaManual()&&descargaActiva()){const b=bloqueSem();
    return `<div class="aviso-d"><span><b>Semana de descarga del bloque</b> (${b.i+1} de ${b.n}). Meta de series a la mitad, el mismo peso y deja 2–3 en reserva. La semana que viene puedes empezar el bloque siguiente.</span></div>`}
  if(descargaActiva()){const f=new Date(descarga.hasta).toLocaleDateString('es-DO',{weekday:'long',day:'numeric',month:'short'});
    return `<div class="aviso-d"><span><b>Semana de descarga</b> hasta el ${f}. Meta de series a la mitad, el mismo peso y deja 2–3 en reserva. Así se recupera el músculo y después vuelves más fuerte.</span><button type="button" data-desc="fin">Terminar la descarga</button></div>`}
  const c=consejoDescarga();
  return c?`<div class="aviso-d"><span>${c} Te sugiero una <b>semana de descarga</b>: la mitad de las series, el mismo peso y lejos del fallo.</span><button type="button" data-desc="ini">Empezar descarga de 7 días</button></div>`:''}
document.addEventListener('click',e=>{const b=e.target.closest('[data-desc]');if(!b)return;
  const t=new Date().toISOString();
  if(b.dataset.desc==='ini'){const h=new Date(Date.now()+7*864e5).toISOString();descarga={inicio:t,hasta:h,fin:h}}
  else descarga={...descarga,hasta:t,fin:t};
  try{localStorage.setItem(DKEY,JSON.stringify(descarga))}catch(err){}
  if(S.st==='idle')S=fresh();renderGrupos();renderProg();render()});
/* ---------- plan por bloques (mesociclo): la meta sube semana a semana y la última es de descarga ---------- */
const BQMULT={4:[.85,1,1.1,0],5:[.8,.9,1,1.1,0],6:[.8,.9,1,1.05,1.1,0]};   // 0 = descarga (½ meta, 2–3 en reserva)
const bloqueI=(t=Date.now())=>Math.round((lunes(t)-lunes(Date.parse(bloque.inicio+'T12:00:00')))/(7*864e5));
function bloqueSem(t=Date.now()){const n=+bloque.sem;if(!BQMULT[n]||!bloque.inicio)return null;const i=bloqueI(t);
  if(i<0||i>=n)return null;const m=BQMULT[n][i];return {i,n,mult:m||.5,desc:!m}}
const bloqueTerminado=()=>!!BQMULT[+bloque.sem]&&!!bloque.inicio&&bloqueI()>=+bloque.sem;
const multTxt=n=>BQMULT[n].map(m=>m?num2(m):'descarga').join(' · ');
let bqFin=false;
function bloqueHTML(prog){const b=bloqueSem(),bot=n=>`<button type="button" class="btn2" data-bq="${n}">${n} semanas</button>`;
  if(b){const seg=BQMULT[b.n].map((m,j)=>`<i class="${j<b.i?'on':j===b.i?'cur':''}${m?'':' d'}" title="Semana ${j+1}: ${m?'×'+num2(m):'descarga'}"></i>`).join('');
    return `<div class="top"><b>Semana ${b.i+1} de ${b.n} del bloque</b><span class="muted" style="font-family:var(--mono);font-size:12px">${b.desc?'descarga':'meta ×'+num2(b.mult)}</span></div>
      <div class="seg" style="grid-template-columns:repeat(${b.n},minmax(0,1fr))">${seg}</div>
      ${prog?`<p class="hint">Multiplicador de la meta de series por semana: ${multTxt(b.n)}. Empezó el ${fCorta(bloque.inicio)}. Una descarga manual prevalece; luego se aplica el ajuste por cómo llegas.</p>
      <button type="button" class="btn2" data-bq="fin">${bqFin?'¿Seguro? Toca otra vez para terminarlo':'Terminar el bloque'}</button>`:''}`}
  if(bloque.inicio&&BQMULT[+bloque.sem]&&bloqueI()<0)return `<div class="top"><b>Bloque de ${esc(bloque.sem)} semanas</b><span class="muted" style="font-family:var(--mono);font-size:12px">empieza el lunes ${fCorta(bloque.inicio)}</span></div>
    <p class="hint" style="margin:0">Esta semana sigue con tu meta normal.</p>${prog?`<button type="button" class="btn2" data-bq="fin">${bqFin?'¿Seguro? Toca otra vez para cancelarlo':'Cancelar el bloque'}</button>`:''}`;
  if(bloqueTerminado())return `<div class="top"><b>Bloque de ${esc(bloque.sem)} semanas terminado ✓</b></div><p class="hint" style="margin:0">¿Empiezas el siguiente? La meta vuelve a subir desde abajo.</p><div class="tog">${[4,5,6].map(bot).join('')}</div>`;
  return prog?`<p class="hint" style="margin:0">Un bloque sube la meta de series poco a poco y termina con una semana de descarga: 4 semanas (${multTxt(4)}), 5 (${multTxt(5)}) o 6 (${multTxt(6)}). Si lo empiezas de lunes a jueves cuenta desde esta semana; de viernes a domingo, desde el lunes que viene.</p><div class="tog">${[4,5,6].map(bot).join('')}</div>`:''}
function renderBloque(){const r=$('bloqueR'),h=S.st==='idle'&&rutPos===0?bloqueHTML(false):'';r.hidden=!h;if(r.innerHTML!==h)r.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-bq]');if(!b)return;const v=b.dataset.bq;
  if(v==='fin'){if(!bqFin){bqFin=true;$('pBloque').innerHTML=bloqueHTML(true);return}bqFin=false;bloque={}}
  else{const d=new Date(lunes(Date.now()));if((new Date().getDay()+6)%7>=4)d.setDate(d.getDate()+7);bloque={inicio:diaK(d),sem:+v};bqFin=false}
  guardarObj(BQKEY,bloque);if(S.st==='idle')S=fresh();renderGrupos();renderProg();render()});
/* ---------- recordatorio de copia: ≥7 días desde la última (o desde la primera sesión) y sesiones nuevas desde entonces ---------- */
function necesitaCopia(t=Date.now()){if(!hist.length||(copiaC.pos&&t<copiaC.pos))return false;
  const ult=copiaC.fecha?Date.parse(copiaC.fecha):Math.min(...hist.map(h=>Date.parse(h.start)||t));
  return t-ult>=7*864e5&&hist.some(h=>Date.parse(h.start)>(copiaC.fecha?ult:ult-1))}
function renderCopiaAv(){const el=$('copiaAv'),v=S.st==='idle'&&rutPos===0&&necesitaCopia();el.hidden=!v;if(!v)return;
  const d=copiaC.fecha?Math.floor((Date.now()-Date.parse(copiaC.fecha))/864e5):null,n=hist.filter(h=>!copiaC.fecha||Date.parse(h.start)>Date.parse(copiaC.fecha)).length;
  const h=`<span>${d!=null?`Tu última copia fue hace <b>${d} días</b>`:'Aún no has hecho una <b>copia de seguridad</b>'} · ${n} ${n===1?'sesión nueva':'sesiones nuevas'}.</span><button type="button" class="btn2" data-copia="hacer">Hacer copia</button><button type="button" class="lnk" data-copia="luego">Luego</button>`;
  if(el.innerHTML!==h)el.innerHTML=h}
$('copiaAv').onclick=e=>{const b=e.target.closest('[data-copia]');if(!b)return;
  if(b.dataset.copia==='luego'){copiaC={...copiaC,pos:Date.now()+3*864e5};guardarObj(COPKEY,copiaC);render();return}
  hacerCopia($('copiaAv').querySelector('span'))};
$('tReloj').onclick=()=>{tab='reloj';render()};
$('tHist').onclick=()=>{tab='historial';if(histSucio)renderHist();else renderAlmacen();render()};
$('tEstilo').onclick=()=>{tab='estilo';renderEstilos();render()};
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>aplicarEstilo(estilo));
function renderEstilos(){
  const fb={bg:'#f4efef',fg:'#1d1416',muted:'#78676b',line:'#e3d8d9',art:'#b3172c',ven:'#2e4a8c',cap:'#1d7658'};
  const osc=matchMedia('(prefers-color-scheme: dark)').matches?{bg:'#140d0f',fg:'#f2e7e9',muted:'#a8959a',line:'#2e2225',art:'#f0435a',ven:'#7f9be2',cap:'#4fc99d'}:fb;
  $('estilos').innerHTML=Object.entries(ESTILOS).map(([id,E])=>{const v={...osc,...(E.v||{})};
    const st=`--e-bg:${v.bg};--e-fg:${v.fg};--e-muted:${v.muted};--e-line:${v.line};--e-art:${v.art};--e-disp:${v.disp||'"Big Shoulders Display",Impact,sans-serif'};--e-body:${v.body||'"IBM Plex Sans",system-ui,sans-serif'}${E.recto?';border-radius:3px':''}`;
    return `<button type="button" class="est" data-e="${id}" aria-pressed="${id===estilo}" style='${st}'><span class="en">${E.n}</span><span class="eb">1:24</span>
      <span class="ed"><i style="background:${v.art}"></i><i style="background:${v.ven}"></i><i style="background:${v.cap}"></i></span><span class="ex">${E.d}</span></button>`}).join('');
  $('estilos').querySelectorAll('.est').forEach(b=>b.onclick=()=>{aplicarEstilo(b.dataset.e);try{localStorage.setItem(EKEY,estilo)}catch(e){}renderEstilos()})}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')lock=null});

function renderGrupos(){
  const L=rutLista(),bloq=enCurso()||(S.st==='done'&&rutPos>0)?'disabled':'';
  $('rutinas').innerHTML=RUTINAS.map((R,i)=>`<button type="button" data-r="${i}" aria-pressed="${i===rutI}" ${bloq}>${R.n}</button>`).join('');
  $('grupos').innerHTML=Object.keys(CAT).map(id=>{const k=L.indexOf(id),on=L.length>1||RUTINAS[rutI].mia?k>=0:id===grupo;
    return `<button type="button" data-g="${id}" aria-pressed="${on}" ${bloq}>${CAT[id].n}${on&&L.length>1?`<sup>${k+1}</sup>`:''}</button>`}).join('');
  $('rutHint').hidden=!RUTINAS[rutI].mia||S.st!=='idle';
  $('rutHint').textContent=miaLista.length?'Toca un grupo para quitarlo o agregarlo al final.':'Toca los grupos en el orden en que los quieres hacer.';
  $('rutinas').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(enCurso())return;rutI=+b.dataset.r;rutPos=0;rutEf=0;guardarRut();
    if(rutLista().length)grupo=rutLista()[0];S=fresh();$('save').textContent='Sin guardar aún';renderGrupos();render()});
  $('grupos').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(enCurso())return;const g=b.dataset.g;
    if(RUTINAS[rutI].mia){const k=miaLista.indexOf(g);if(k>=0)miaLista.splice(k,1);else miaLista.push(g);guardarRut();grupo=miaLista[0]||g}
    else{if(enRutina()){rutI=0;guardarRut()}grupo=g}
    rutPos=0;rutEf=0;S=fresh();$('save').textContent='Sin guardar aún';renderGrupos();render()});
  renderMeta()}
function renderMeta(){
  const m=metas[grupo],mh=metaHoy(grupo),rep=repartir(grupo).filter(x=>x>0).join(' + ');
  $('meta').hidden=S.st!=='idle';$('desc').hidden=S.st!=='idle';$('desc').innerHTML=bannerDesc();
  $('meta').innerHTML=`<span>Meta${enRutina()?' de '+CAT[grupo].n.toLowerCase():' de hoy'}</span><button id="mMenos" type="button" aria-label="Una serie efectiva menos">−</button><b>${mh}</b><button id="mMas" type="button" aria-label="Una serie efectiva más">+</button><span>${descargaActiva()?'series completas':'series efectivas'} (${rep})</span>`
    +(descargaActiva()?`<span class="aviso">Descarga: la mitad de tu meta normal (${m}), contada en series completas de 5 reps o más. Series rectas con 2 min de descanso y 2–3 en reserva: sin mini-series ni fallo.</span>`:'')
    +(()=>{const b=bloqueSem();return b&&!descargaActiva()&&b.mult!==1?`<span class="aviso">Bloque, semana ${b.i+1} de ${b.n}: meta ×${num2(b.mult)} (la normal es ${m}).</span>`:''})()
    +(()=>{const b=bienDia(),mb=metaBase(grupo);if(!b)return '';
      const q=[b.sueno!=null?`dormiste ${sueTxt(+b.sueno)}`:'',b.energia!=null?`llegas con energía ${esc(b.energia)} de 5`:''].filter(Boolean).join(' y ');
      if(mh<mb)return `<span class="aviso">${q.charAt(0).toUpperCase()+q.slice(1)}: hoy la meta baja de ${mb} a ${mh}. Recuperarte también hace crecer el músculo.</span>`;
      return +b.energia===5&&+b.sueno>=7?'<span class="aviso">Dormiste bien y llegas a tope: aprovéchalo en la calidad de cada serie (la meta no sube).</span>':''})()
    +(m>10?'<span class="aviso">Más de 10 en una sesión apenas suma músculo: sobre todo acumula fatiga.</span>':'');
  const fijar=d=>{metas[grupo]=Math.min(META_MAX,Math.max(META_MIN,metas[grupo]+d));
    try{localStorage.setItem(MKEY,JSON.stringify(metas))}catch(e){}renderMeta();render()};
  $('mMenos').onclick=()=>fijar(-1);$('mMas').onclick=()=>fijar(1)}
/* ---------- historial: cada sesión se puede abrir para corregir reps, kg, reserva y molestia, borrar series o borrarla entera ---------- */
let histEd=null,histDraft=null,histBorrar=false;
const estadoSes=h=>h.completa?'Completa':h.antes?`Terminada antes (${h.desc?esc(h.serC||0)+' de '+esc(h.meta)+' series':ef1(efH(h))+' de '+esc(h.meta)})`:'Parcial';
function renderHist(){histSucio=false;renderAlmacen();
  $('hist').innerHTML=hist.length?hist.map(h=>`<div class="card" data-hid="${esc(h.id)}"><div class="top"><span class="g">${esc(h.grupo)}</span><span class="muted" style="font-family:var(--mono);font-size:12px">${new Date(h.start).toLocaleString('es-DO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>
    <div class="meta"><span>${esc(h.series)} series</span>${h.desc?`<span>${esc(h.serC||0)}${h.meta?' / '+esc(h.meta):''} series de descarga</span><span>${ef1(efH(h))} efectivas</span>`:`<span>${ef1(efH(h))}${h.meta?' / '+esc(h.meta):''} efectivas</span>`}<span>${esc(h.reps)} reps</span><span>${fmt(h.tuc)} bajo congestión</span><span class="muted">${estadoSes(h)}</span></div>${histExtra(h)}
    ${histEd===h.id?editorSesion(h):`<button type="button" class="lnk" data-hed="abrir" style="align-self:flex-start">${h.id===S.id&&enCurso()?'En curso':'Abrir y editar'}</button>`}</div>`).join('')
    :'<p class="muted" style="font-size:14px;margin:0">Aún no hay sesiones. Cada sesión se guarda sola al reportar la primera serie.</p>'}
const RIRS=['0','1','2','3','4+'];
function editorSesion(h){const d=histDraft;
  const filas=d.map((r,i)=>{const seg=r.rir==='—',v=parseInt(r.reps,10)||0;
    const ro=seg?`<select disabled aria-label="Reserva"><option>—</option></select>`:`<select data-f="rir" aria-label="Reserva">${[...new Set([...RIRS,r.rir])].map(x=>`<option${x===r.rir?' selected':''}>${esc(x)}</option>`).join('')}</select>`;
    return `<div class="hr" data-i="${i}"><div class="t"><span>${i+1}. ${esc(r.ex)} <span class="muted">${esc(r.k)}</span> · ef. ${ef1(efectiva(r))}</span><button type="button" class="x" data-hed="quitar" aria-label="Borrar la serie ${i+1}">✕</button></div>
      <label>${seg&&r.k!=='cal.'?'Segundos':'Reps'}<input class="in" data-f="reps" inputmode="numeric" value="${v}"></label>
      <label>${esLb()?'Lb':'Kg'}<input class="in" data-f="kg" inputmode="decimal" value="${r.kg!=null?esc(String(aU(r.kg)).replace('.',',')):''}" placeholder="—"></label>
      <label>Reserva${ro}</label>
      <label>Molestia<select data-f="mol"><option value="">no</option>${['sin zona',...ZONAS].map(z=>`<option${r.mol===z?' selected':''}>${z}</option>`).join('')}</select></label></div>`}).join('');
  return `<div class="he">${filas||'<p class="hint">Sin series: al guardar se borra la sesión.</p>'}
    <span class="hint" id="heMsg" aria-live="polite">Las efectivas, series y reps se recalculan al guardar.</span>
    <div class="btns"><button type="button" class="btn2" data-hed="guardar" style="border:2px solid var(--cap);color:var(--cap)">Guardar cambios</button><button type="button" class="btn2" data-hed="cancelar">Cancelar</button>
    <button type="button" class="btn2 peligro" data-hed="borrar">${histBorrar?'¿Borrar la sesión entera? Toca otra vez':'Borrar sesión'}</button></div></div>`}
// lee los campos del editor en el borrador (valores inválidos se ignoran)
function leerDraft(card){card.querySelectorAll('.hr').forEach(el=>{const r=histDraft[+el.dataset.i];if(!r)return;
  const v=parseInt(el.querySelector('[data-f="reps"]').value,10);if(v>=0&&v<=999)r.reps=r.rir==='—'&&r.k!=='cal.'?v+' s':String(v);
  const k=el.querySelector('[data-f="kg"]').value.trim().replace(',','.');   // en la unidad de la pantalla; si no lo tocaste, el valor guardado no cambia
  if(k==='')r.kg=r.kg==null?null:r.kg;else if(+k>=0&&+k<=(esLb()?1100:500)&&(r.kg==null||Math.abs(aU(r.kg)-(+k))>1e-9))r.kg=deU(+k);
  const ri=el.querySelector('[data-f="rir"]');if(ri)r.rir=ri.value;const m=el.querySelector('[data-f="mol"]').value;if(m)r.mol=m;else delete r.mol})}
function guardarHist(){escribirHist();
  if(pila.some(p=>!hist.some(h=>h.id===p.S.id))||!hist.some(h=>h.id===S.id))pila=[];   // no se puede deshacer hacia una sesión borrada
  revisarMedallas();renderHist();if(tab==='progreso')renderProg()}
$('hist').addEventListener('click',e=>{const b=e.target.closest('[data-hed]');if(!b)return;const card=b.closest('[data-hid]'),id=card.dataset.hid,h=hist.find(x=>x.id===id);if(!h)return;
  const a=b.dataset.hed;
  if(a==='abrir'){if(h.id===S.id&&enCurso())return;histEd=id;histDraft=clon(h.sets||[]);histBorrar=false;renderHist();return}
  if(a==='cancelar'){histEd=null;histDraft=null;renderHist();return}
  if(a==='quitar'){leerDraft(card);histDraft.splice(+b.closest('.hr').dataset.i,1);renderHist();return}
  if(a==='borrar'){if(!histBorrar){histBorrar=true;leerDraft(card);renderHist();return}
    hist=hist.filter(x=>x.id!==id);histEd=null;histDraft=null;histBorrar=false;if(S.id===id&&!enCurso()){S=fresh();$('save').textContent='Sin guardar aún'}guardarHist();$('ioMsg').textContent='Sesión borrada.';return}
  if(a==='guardar'){leerDraft(card);const sets=histDraft;if(id===S.id||pila.some(p=>p.S.id===id))pila=[];
    if(!sinCal(sets).length){hist=hist.filter(x=>x.id!==id);if(S.id===id&&!enCurso())S=fresh();$('ioMsg').textContent='Sesión borrada: no le quedaban series.'}
    else{Object.assign(h,{sets,series:sinCal(sets).length,reps:repsDe(sets),efectivas:Math.round(efDe(sets)*100)/100});
      if(S.id===id&&S.st==='done'){S.sets=clon(sets);S.ef=efDe(sets)}$('ioMsg').textContent='Cambios guardados ✓'}
    histEd=null;histDraft=null;histBorrar=false;guardarHist()}});
// Notas, molestias y cómo llegaste, debajo de cada sesión del historial (sesiones viejas: no muestra nada).
function histExtra(h){const mols=[...new Map((h.sets||[]).filter(r=>r.mol).map(r=>[r.ej+r.mol,`${r.mol==='sin zona'?'sí':esc(r.mol)} (${esc(r.ex)})`])).values()];
  const x=[h.bien&&bienTxt(h.bien)?`Cómo llegaste: ${esc(bienTxt(h.bien))}`:'',mols.length?`<b>Molestia:</b> ${mols.join(', ')}`:'',
    h.nota?`<b>Nota:</b> ${esc(h.nota)}`:'',(h.sets||[]).some(r=>r.k==='cal.')?'Con calentamiento':''].filter(Boolean);
  return x.length?`<div class="hist-x">${x.join('<br>')}</div>`:''}
let lastG=null,lastEn=null,lastPlan='',lastRows='';
function subInicio(E){const s=sugerir(grupo,E);
  return s?`${E.n} · última vez ${kgTxt(s.prev.kg)} × ${s.prev.reps} (reserva ${s.prev.rir}) → ${s.txt}`:`${E.n} · peso con el que ${E.r} reps te dejen a 1 del fallo`}
function render(){
  const G=CAT[grupo],E=est(),e=Math.max(0,now()-S.t0),pad=$('pad');
  [['vReloj','tReloj','reloj'],['vProg','tProg','progreso'],['vHist','tHist','historial'],['vEstilo','tEstilo','estilo']].forEach(([v,t,k])=>{
    $(v).hidden=tab!==k;$(v).style.display=tab===k?'flex':'none';$(t).setAttribute('aria-current',tab===k?'page':'false')});
  $('gnom').textContent=G.n+(enRutina()?` ${rutPos+1}/${rutLista().length}`:'');
  const NE=G.e.length;
  $('blk').textContent=S.st==='idle'?`${NE} estaciones`:S.st==='done'?(S.antes?'Terminada antes':'Completa'):`Estación ${S.sec+1}/${NE} · ${E.s}`
    +(S.desc?(S.metaE[S.sec]?` · ${S.serE}/${S.metaE[S.sec]} series`:'')+' · descarga':(S.metaE[S.sec]?` · ${ef1(S.efE)}/${S.metaE[S.sec]} ef.`:'')+(S.ronda>1?` · ronda ${S.ronda}`:''));
  $('meta').hidden=S.st!=='idle';$('desc').hidden=S.st!=='idle';$('planHint').hidden=S.st!=='idle';if(S.st!=='idle')$('editor').hidden=true;
  $('terminar').textContent=enRutina()&&rutPos<rutLista().length-1&&enCurso()?'Terminar grupo y seguir':'Terminar y guardar';
  const nc=enCurso()&&nuevaConf>Date.now(),nt=nc?'¿Seguro? Toca otra vez':'Nueva sesión';if($('nueva').textContent!==nt){$('nueva').textContent=nt;$('nueva').classList.toggle('peligro',nc)}
  if(lastG!==grupo||lastEn!==enCurso()){renderGrupos();lastG=grupo;lastEn=enCurso()}
  const planKey=S.st+'|'+S.sec+'|'+grupo+'|'+JSON.stringify(misEj[grupo]||{});
  if(planKey!==lastPlan){lastPlan=planKey;const tag=S.st==='idle'?'button':'div';
    $('plan').className=NE===2||NE===4?'n'+NE:'';
    $('plan').innerHTML=G.e.map((x,i)=>`<${tag} ${tag==='button'?`type="button" data-i="${i}"`:''} class="pb${S.st==='done'||(enCurso()&&i<S.sec)?' ok':enCurso()&&i===S.sec?' on':''}"><b>${esc(x.s)}</b><span>${x.levy?'3 vacíos · 15–50 s':esc(x.n)} · ${esc(x.r)}${x.xi!=null?' · agregado':misEj[grupo]&&misEj[grupo][x.b]?' · propio':''}</span></${tag}>`).join('');
    renderPlanX()}
  let kind=enRutina()?`Rutina ${RUTINAS[rutI].mia?'propia':RUTINAS[rutI].n} · toca para empezar`:'Toca para empezar',big='—',sub=G.e[0].levy?'':subInicio(G.e[0]),cls='',bar=0,disc='',pav='';
  if(S.st==='idle'){if(!G.e[0].levy){const p=sugerir(grupo,G.e[0]);disc=p?discTxt(p.kg,G.e[0]):'';pav=avisoMolestia(grupo,G.e[0])}
    if(pideBien){kind='Antes de empezar';sub=bienDia()?'Falta tu energía de hoy (arriba) o toca otra vez para empezar ya':'Cuéntame cómo llegas hoy (arriba) o toca otra vez para empezar ya'}
    if(sinGrupo()){kind='Elige al menos un grupo';sub='Rutina «La mía»: toca arriba los grupos en el orden en que los quieres hacer.';disc='';pav=''}
    else if(descargaActiva()&&!pideBien)kind+=' · semana de descarga'}
  if(S.st==='work'){cls='work';
    if(S.phase==='act'&&S.desc){const m=Math.max(1,S.metaE[S.sec]||0);kind=`${E.s} · descarga · serie ${Math.min(S.nIn+1,m+2)}${S.nIn<m?' de '+m:''} · ${fmt(e)}`;big=E.r;
      sub=`${E.n} · serie recta: deja 2–3 en reserva, sin llegar al fallo`+(S.kg!=null?` · ${kgTxt(S.kg)}`:'')+(S.sug&&S.nIn===0?` (última vez ${kgTxt(S.sug.prev.kg)} × ${S.sug.prev.reps})`:'')+tempoSub();
      disc=discTxt(S.kg,E);if(S.nIn===0)pav=S.molAv}
    else if(S.phase==='act'){kind=`${E.s} · activación · ${fmt(e)}`;big=E.r;sub=`${E.n} · ${E.tempo} · deja 1 en reserva`
      +(S.kg!=null?` · ${kgTxt(S.kg)}`:'')+(S.sug&&S.ronda===1?` (última vez ${kgTxt(S.sug.prev.kg)} × ${S.sug.prev.reps})`:'')+tempoSub();
      disc=discTxt(S.kg,E);if(S.ronda===1)pav=S.molAv}
    else if(S.phase==='myo'){kind=`Mini-serie ${S.nIn} · ${E.s} · ${fmt(e)}`;big=S.target;sub=`${E.tempo} · toca al terminar`+tempoSub()}
    else if(S.phase==='ext'){kind=`${E.extN} · ${fmt(e)}`;big=S.target;sub=`${E.extH} · llega a 0–1 en reserva`+tempoSub()}
    else if(S.phase==='hold'){kind=E.extN;big=Math.floor(e);sub=`${E.extH} · toca al soltar`}
    else{kind=`Vacío ${S.levyN+1}/3 · objetivo ${S.levyT} s`;big=Math.floor(e);sub=e>=S.levyT?'Objetivo cumplido · suelta cuando quieras y toca':'Exhala todo, ombligo a la columna · toca al soltar'}}
  else if(S.st==='cal'){const c=S.cal[S.calI];cls='work cal';kind=`Calentamiento ${S.calI+1}/${S.cal.length} · ${Math.round(c.f*100)} % · ${fmt(e)}`;big=c.reps;
    sub=`${E.n} · ${kgTxt(c.kg)} × ${c.reps} · suave, lejos del fallo · toca al terminar`;disc=discTxt(c.kg,E);pav=S.molAv}
  else if(S.st==='report'){cls='report';kind=`Serie terminada · ${fmt(S.workDur)}`;big='?';sub='Reporta reps y reserva abajo'}
  else if(['rest','shift','trans'].indexOf(S.st)>=0){cls=S.st;big=Math.max(0,Math.ceil(S.restDur-e));bar=Math.min(100,100*e/Math.max(1,S.restDur));
    kind=S.calRest?'Calentamiento · descanso':S.st==='rest'&&S.desc?`Descarga · descanso de ${Math.round(S.restDur)} s · ${S.serE} de ${S.metaE[S.sec]||0} series`:S.st==='rest'?`Descanso óptimo · t* = ${Math.round(S.restDur)} s`:S.st==='shift'?'Cambio mecánico · ya':S.rutTrans?`Rutina · sigue ${G.n}`:S.esRonda?`Otra ronda · faltan ${ef1(S.metaE[S.sec]-S.efE)} efectivas`:'Cambio de estación';
    sub=(S.aviso?S.aviso+' · ':'')+S.label+' · toca para saltar';
    if(S.cal&&S.calI<S.cal.length)disc='Primero calentamiento: '+S.cal.map(c=>`${num(aU(c.kg))}×${c.reps}`).join(', ')+' '+uTxt()}
  else if(S.st==='done'){cls='done';kind='Sesión terminada · bajo congestión';big=fmt(S.tuc);const ok=metaHecha();
    sub=(rutPos>0?`Rutina: ${ef1(rutEf+S.ef)} efectivas en total · `:'')+(S.desc?`Descarga: ${serDe(S.sets)} de ${S.meta} series completas${ok?' ✓':' (no alcanzada)'} · ${ef1(S.ef)} efectivas`
      :`${ef1(S.ef)} de ${S.meta} series efectivas${ok?' ✓':' (no alcanzada)'}`)+` · ${sinCal(S.sets).length} series · ${Math.round(S.iso)} s de isometría · guardada${S.antes?' como «terminada antes»':''}`}
  if(S.pr&&now()<S.pr){cls+=' record';kind=(S.prK||'¡Récord personal!')+' · '+S.prTxt}
  pad.className=cls;pad.dataset.fase=S.st==='work'?S.phase:'';$('kind').textContent=kind;$('big').textContent=big;$('sub').textContent=sub;$('bar').style.width=bar+'%';
  pad.dataset.mov=(S.st==='work'&&S.phase!=='hold'&&S.phase!=='vac')||S.st==='cal'?tipoMov(E.n):'';
  $('disc').hidden=!disc;$('disc').textContent=disc;$('pav').hidden=!pav;$('pav').textContent=pav?'⚠ '+pav:'';
  $('calSalta').hidden=!(S.cal&&S.calI<S.cal.length&&['cal','rest','trans'].includes(S.st));
  const pu=pila[pila.length-1],du=!!pu&&['rest','shift','trans','done','report','work'].includes(S.st);$('deshacer').hidden=!du;
  if(du){const t=S.st==='report'?'Deshacer la serie anterior':'Deshacer última serie',og=pu.grupo!==grupo?` (vuelve a ${CAT[pu.grupo].n})`:'';
    if($('deshacer').textContent!==t+og)$('deshacer').textContent=t+og}
  document.querySelectorAll('.rir button').forEach(b=>b.setAttribute('aria-pressed',S.st==='report'&&rirPrev!=null&&+b.dataset.r===Math.min(4,rirPrev)));
  renderBloque();renderCopiaAv();
  $('report').hidden=S.st!=='report';$('done').textContent=S.hechas;
  $('kgFila').hidden=S.phase==='ext'&&E&&E.ext==='flat';
  if(document.activeElement!==$('kgv'))$('kgv').value=S.kg==null?'':num(aU(S.kg));
  $('kgU').textContent=S.kg==null?`${uTxt()} · sin anotar`:S.kg>0?uTxt():'peso corporal';$('thKg').textContent=esLb()?'Lb':'Kg';
  if(S.st==='report'){const dt=discTxt(S.kg,E),barra=!$('kgFila').hidden&&!E.levy;$('discos').hidden=!barra;
    $('discosT').textContent=dt||(esBarra(E)?'Anota el peso total con la barra':'');$('barraT').textContent=esBarra(E)?'Con barra ✓':'¿Es con barra?';
    $('molB').innerHTML=`<button type="button" data-z="" aria-pressed="${S.molR!=null}">Molestia${S.molR!=null?':':''}</button>`
      +(S.molR!=null?ZONAS.map(z=>`<button type="button" data-z="${z}" aria-pressed="${S.molR===z}">${z}</button>`).join(''):'')}
  $('hoyCard').hidden=S.st!=='idle'||rutPos>0;if(!$('hoyCard').hidden)renderHoy();
  renderBien();
  const ci=$('cierre');ci.hidden=S.st!=='done'||!S.id;if(!ci.hidden&&ci.dataset.id!==S.id){ci.dataset.id=S.id;$('notaIn').value=S.nota||'';$('notaMsg').textContent=''}
  $('fP').style.width=(S.P*100)+'%';$('vP').textContent=S.P.toFixed(2);
  $('fC').style.width=(S.C*100)+'%';$('vC').textContent=S.C.toFixed(2);
  $('tuc').textContent=fmt(S.tuc);$('tot').textContent=repsDe(S.sets);$('iso').textContent=Math.round(S.iso)+' s';
  $('efv').textContent=S.st==='idle'?`meta ${metaHoy(grupo)}${descargaActiva()?' series completas':''}`:S.desc?`${ef1(S.ef)} · ${serDe(S.sets)} / ${S.meta} series completas`:`${ef1(S.ef)} / ${S.meta}`;
  const rows=S.sets.slice().reverse().map(r=>`<tr><td>${r.pr?'★ ':''}${r.mol?'⚠ ':''}${esc(r.ex)} <span class="muted">${esc(r.k)}</span></td><td>${esc(r.reps)}</td><td>${r.kg!=null?(r.kg>0?num(aU(r.kg)):'c'):'—'}</td><td>${esc(r.rir)}</td><td>${(+r.P||0).toFixed(2)}</td><td>${r.rest?esc(r.rest)+' s':'—'}</td><td>${ef1(efectiva(r))}</td></tr>`).join('');
  const rh=rows||'<tr><td colspan="7" class="muted" style="text-align:left">Las series aparecen aquí al reportarlas.</td></tr>';
  if(rh!==lastRows){lastRows=rh;$('rows').innerHTML=rh}   // la tabla solo se reescribe cuando cambia
  renderRetomar();guardarEnCurso();
}
/* ---------- el muñeco hace tu ejercicio: tipo de movimiento por palabras del nombre (el primero que encaja; si ninguno, curl) ---------- */
const MOVS=[[/fondo/,'fon'],[/talon|gemelo|pantorrilla/,'tal'],[/femoral|isquio|nordico|curl (de |con )?piernas?/,'fem'],
 [/crunch|abdominal|rueda|colgad|rodillas al pecho|elevacion(es)? de piernas|pallof|plancha/,'cru'],
 [/cuadricep|sentadilla|prensa|zancada|bulgara|peso muerto|hip thrust|goblet|hack|pierna|hiperextensi|lumbar|abductor|aductor|gluteo/,'sent'],
 [/lateral|pajaro|posterior|face pull|apertura|cruce|pec deck|en cruz|frontal/,'lat'],
 [/tricep|extension|pushdown|frances|patada|copa/,'tri'],
 [/curl/,'curl'],
 [/press|flexion|militar|banca|empuje/,'press'],
 [/remo|jalon|dominada|pullover|pull|tiron|traccion/,'tiron']];
const tipoMov=n=>{const s=sinTilde(n),m=MOVS.find(([r])=>r.test(s));return m?m[1]:'curl'};
/* ---------- qué toca hoy: lo que falta de la semana y lo descansado que está cada grupo ---------- */
const ultimaVez=g=>hist.reduce((m,h)=>gDe(h)===g?Math.max(m,Date.parse(h.start)||0):m,0);
function queToca(){const w=semana(0),ahora=Date.now();
  const info=Object.keys(CAT).map(g=>{const v=w[g]||0,[lo,hi]=semRango(g),u=ultimaVez(g),h=u?(ahora-u)/36e5:Infinity;
    // primero lo que falta para el mínimo semanal; a igualdad, mejor 48–72 h de descanso
    return {g,v,lo,hi,h,ok:h>=48&&v<hi,s:Math.max(0,lo-v)/lo+(h>=48&&h<=72?.25:h>72?.15:0)}});
  const c=info.filter(x=>x.ok).sort((a,b)=>b.s-a.s);
  if(!c.length){const pend=info.filter(x=>x.v<x.hi).sort((a,b)=>b.h-a.h)[0];
    return {descanso:true,txt:pend?`${CAT[pend.g].n} vuelve a estar listo en ${Math.ceil(48-pend.h)} h: entrenado hace menos de 48 h.`:'Todos los grupos ya pasaron su rango de la semana.'}}
  const b=c[0];let rut=null;
  if(b.v<b.lo)RUTINAS.forEach((R,i)=>{if(!R.g||!R.g.includes(b.g))return;const o=info.find(x=>x.g===R.g.find(y=>y!==b.g));
    if(o&&o.ok&&o.v<o.lo&&(!rut||o.s>rut.o.s))rut={i,o}});
  return {g:rut?RUTINAS[rut.i].g[0]:b.g,rut:rut?rut.i:null,items:rut?RUTINAS[rut.i].g.map(g=>info.find(x=>x.g===g)):[b]}}
const razon=x=>`${CAT[x.g].n}: ${ef1(x.v)} de ${x.lo} esta semana${x.v>=x.lo?' (mínimo cumplido)':''}, `
  +(x.h===Infinity?'sin registros aún':`${Math.floor(x.h/24)} días de descanso`);
function renderHoy(){const q=queToca(),el=$('hoyCard');el.classList.toggle('descanso',!!q.descanso);
  if(q.descanso){el.removeAttribute('aria-pressed');el.dataset.g='';el.innerHTML=`<span class="lbl">Qué toca hoy</span><b>Descanso</b><span class="r">${q.txt}</span><span class="a">Si igual entrenas, elige abajo</span>`;return}
  const sel=q.rut!=null?rutI===q.rut:!enRutina()&&!RUTINAS[rutI].mia&&grupo===q.g;
  el.dataset.g=q.g;el.dataset.rut=q.rut!=null?q.rut:'';el.setAttribute('aria-pressed',sel);
  el.innerHTML=`<span class="lbl">Qué toca hoy</span><b>${q.rut!=null?RUTINAS[q.rut].n:CAT[q.g].n}</b><span class="r">${q.items.map(razon).join(' · ')}</span>
    <span class="a">${sel?'Elegido ✓ · toca el reloj para empezar':'Toca para elegirlo'}</span>`}
$('hoyCard').onclick=()=>{const el=$('hoyCard');if(S.st!=='idle'||!el.dataset.g)return;
  rutI=el.dataset.rut!==''?+el.dataset.rut:0;grupo=el.dataset.g;rutPos=0;rutEf=0;guardarRut();S=fresh();$('save').textContent='Sin guardar aún';renderGrupos();render()};
/* ---------- cómo llegas hoy (antes de empezar) ---------- */
const bajaTxt=()=>`la meta de ${CAT[grupo].n.toLowerCase()} baja de ${metaBase(grupo)} a ${metaHoy(grupo)}`;
function renderBien(){const el=$('bien');el.hidden=S.st!=='idle'||rutPos>0;if(el.hidden)return;const b=bienHoy(),p=bienDia();el.classList.toggle('pide',pideBien);
  if(b&&!bienEd){const m=bajaHoy()?`Hoy ${bajaTxt()}: descansar también hace crecer.`:+b.energia===5&&+b.sueno>=7?'Llegas a tope: aprovéchalo en la calidad de cada serie.':'Meta normal.';
    el.innerHTML=`<div class="top"><span class="lbl">Cómo llegas hoy</span><button type="button" class="lnk" data-bien="cambiar">Cambiar</button></div><p>Dormiste <b>${esc(sueTxt(+b.sueno))}</b> · energía <b>${esc(b.energia)} de 5</b>. ${m}</p>`;return}
  if(!b&&bienOmit&&!bienEd){el.innerHTML=`<div class="top"><span class="lbl">Cómo llegas hoy</span><button type="button" class="lnk" data-bien="cambiar">Anotar</button></div><p class="muted">${p?esc(bienTxt(p))+' anotado hoy; falta '+(p.sueno==null?'el sueño':'la energía')+'.'+(bajaHoy()?' Con eso '+bajaTxt()+'.':''):'Sin anotar hoy.'}</p>`;return}
  const d=bienEd||bienDe(p)||{},soloE=!!p&&p.sueno!=null&&p.energia==null&&d.sueno===+p.sueno&&!bienSueno;   // el sueño ya lo anotó Comida: solo falta la energía
  el.innerHTML=`<div class="top"><span class="lbl">Cómo llegas hoy</span>${b?'<button type="button" class="lnk" data-bien="listo">Dejarlo así</button>':'<button type="button" class="lnk" data-bien="omitir">Ahora no</button>'}</div>
    ${soloE?`<p>Dormiste <b>${esc(sueTxt(+p.sueno))}</b> (ya anotado hoy) · <button type="button" class="lnk" data-bien="sueno">cambiar</button></p>`
      :`<span class="bq">Horas de sueño</span><div class="opc">${SUENO.map(([t,v])=>`<button type="button" data-sueno="${v}" aria-pressed="${d.sueno===v}">${t}</button>`).join('')}</div>`}
    <span class="bq">Energía</span><div class="opc">${[1,2,3,4,5].map(v=>`<button type="button" data-energia="${v}" aria-pressed="${d.energia===v}">${v}</button>`).join('')}</div>
    <p class="hint">1 = agotado · 5 = a tope. Si dormiste menos de 6 h o tu energía es 1–2, la meta de hoy baja cerca de un 25&nbsp;% (mínimo 2).</p>`}
$('bien').onclick=e=>{const t=e.target.closest('button');if(!t)return;const a=t.dataset.bien;
  if(a==='cambiar'){bienEd=bienDe(bienDia())||{};render();return}
  if(a==='sueno'){bienSueno=true;render();return}
  if(a==='listo'){bienEd=null;bienSueno=false;render();return}
  if(a==='omitir'){bienOmit=true;bienEd=null;const p=pideBien;pideBien=false;render();if(p)$('pad').onclick();return}
  bienEd=bienEd||bienDe(bienDia())||{};if(t.dataset.sueno)bienEd.sueno=+t.dataset.sueno;if(t.dataset.energia)bienEd.energia=+t.dataset.energia;
  if(bienEd.sueno!=null&&bienEd.energia!=null){guardarBien(bienEd.sueno,bienEd.energia);bienEd=null;bienSueno=false;renderMeta();
    if(pideBien){pideBien=false;render();$('pad').onclick();return}}
  render()};
/* ---------- progreso ---------- */
const SEM={abdominales:[8,16]},semRango=g=>SEM[g]||[12,20];   // series efectivas por semana para hipertrofia
const CORTO={biceps:'Bí',triceps:'Tr',espalda:'Es',pecho:'Pe',hombros:'Ho',abdominales:'Ab',piernas:'Pi'};
const lunes=t=>{const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()};
const efH=h=>h.efectivas!=null?h.efectivas:efDe(h.sets||[]);
// Series efectivas por grupo de la semana (off = semanas atrás), contando los músculos secundarios igual que el mapa (ver volGrupo).
function semana(off){return volGrupo(off)}
function porDia(){const m={};hist.forEach(h=>{const k=diaK(Date.parse(h.start));(m[k]=m[k]||new Set()).add(gDe(h))});return m}
const nDia=k=>Math.round(Date.parse(k+'T12:00:00')/864e5);
// Racha: días entrenados seguidos sin descansar más de 2 días entre uno y otro.
function racha(){const d=Object.keys(porDia()).sort().reverse();if(!d.length||nDia(diaK(Date.now()))-nDia(d[0])>3)return 0;   // hace 3 días = 2 libres: sigue
  let n=1;for(let i=1;i<d.length&&nDia(d[i-1])-nDia(d[i])<=3;i++)n++;return n}
let calOff=0,grafSel='';
function renderProg(){
  $('pDesc').innerHTML=bannerDesc();
  const w=semana(0),w1=semana(1),dias=new Set(hist.filter(h=>Date.parse(h.start)>=lunes(Date.now())).map(h=>diaK(Date.parse(h.start)))).size;
  $('pSem').innerHTML=`<p class="hint">Series efectivas desde el lunes · ${dias} ${dias===1?'día':'días'} entrenados. Para ganar músculo: ${semRango('pecho').join('–')} por grupo (abdomen ${semRango('abdominales').join('–')}). La raya marca ese rango.</p>
    <p class="hint"><b>Cómo se cuenta:</b> cada serie suma al grupo del músculo principal y la fracción de los que ayudan, como en el mapa (press inclinado: pecho 1, hombros ½, tríceps ½).</p>`
    +Object.keys(CAT).map(g=>{const v=w[g]||0,[lo,hi]=semRango(g),tope=hi*1.3,col=v<lo?'var(--amb)':v<=hi?'var(--cap)':'var(--art)';
      return `<div class="sem"><span>${CAT[g].n}</span><div class="track"><span class="banda" style="left:${100*lo/tope}%;width:${100*(hi-lo)/tope}%"></span><div class="fill" style="width:${Math.min(100,100*v/tope)}%;background:${col}"></div></div>
        <span class="val">${ef1(v)} <small>/ ${lo}–${hi}</small></span></div>`}).join('')
    +`<p class="hint">Semana pasada: ${Object.keys(CAT).filter(g=>w1[g]).map(g=>`${CAT[g].n.toLowerCase()} ${ef1(w1[g])}`).join(' · ')||'sin entrenos'}.</p>`;
  // constancia
  const pd=porDia(),r=racha(),base=new Date();base.setDate(1);base.setMonth(base.getMonth()+calOff);
  const y=base.getFullYear(),m=base.getMonth(),n=new Date(y,m+1,0).getDate(),ini=(new Date(y,m,1).getDay()+6)%7,hoyK=diaK(Date.now());
  let mes=0,celdas='';for(let i=0;i<ini;i++)celdas+='<span></span>';
  for(let d=1;d<=n;d++){const k=diaK(new Date(y,m,d)),gs=pd[k];if(gs)mes++;
    celdas+=`<span class="d${gs?' on':''}${k===hoyK?' hoy':''}">${d}${gs?`<small>${[...gs].filter(Boolean).map(g=>CORTO[g]).join(' ')}</small>`:''}</span>`}
  $('pCal').innerHTML=`<div style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap"><div><div class="big2">${r}</div><span class="hint">${r===1?'día':'días'} de racha</span></div>
      <div><div class="big2">${mes}</div><span class="hint">entrenados en el mes</span></div></div>
    <p class="hint">La racha cuenta los días entrenados sin descansar más de 2 días seguidos.</p>
    <div class="calnav"><button type="button" data-cal="-1" aria-label="Mes anterior">‹</button><b>${base.toLocaleDateString('es-DO',{month:'long',year:'numeric'})}</b><button type="button" data-cal="1" aria-label="Mes siguiente" ${calOff>=0?'disabled':''}>›</button></div>
    <div class="cal">${['L','M','X','J','V','S','D'].map(x=>`<span class="h">${x}</span>`).join('')}${celdas}</div>`;
  $('pCal').querySelectorAll('[data-cal]').forEach(b=>b.onclick=()=>{calOff=Math.min(0,calOff+ +b.dataset.cal);renderProg()});
  // récords
  const rec={};
  hist.forEach(h=>{const g=gDe(h);(h.sets||[]).forEach(x=>{if(!x.ej||x.k!=='act.'||!(x.kg>0))return;const k=g+'|'+x.ej;
    if(!rec[k]||e1(x)>e1(rec[k].r))rec[k]={g,r:x,f:h.start}})});
  const rs=Object.values(rec).sort((a,b)=>(a.g||'').localeCompare(b.g||'')||e1(b.r)-e1(a.r));
  // fuerza relativa: 1RM estimado / peso corporal de ese día (app Comida)
  const PC=pesosComida(),hayP=tienePeso(PC),rel=hayP&&!!CFG.rel;
  const relB=hayP?`<div class="tog"><button type="button" data-rel="1" aria-pressed="${rel}">Relativa al peso corporal${rel?': sí':''}</button></div>`
    :'<p class="hint">Para ver la fuerza relativa al peso corporal, anota tu peso en la app Comida.</p>';
  $('pRec').innerHTML=rs.length?relB+`<div class="tbl"><table><thead><tr><th>Ejercicio</th><th>Mejor serie</th><th>${rel?'× peso corporal':'1RM est. ('+uTxt()+')'}</th><th>Fecha</th></tr></thead><tbody>`
    +rs.map(x=>{const bw=rel?pesoDe(x.f,PC):null;return `<tr><td style="white-space:normal">${esc(x.r.ej)} <span class="muted">${CAT[x.g]?CAT[x.g].n.toLowerCase():''}</span></td><td>${num(aU(x.r.kg))} × ${esc(x.r.reps)}</td><td>${rel?`${bw?num2f(e1(x.r)/bw):'—'}<br><small class="muted">1RM ${kgTxt(e1(x.r))}</small>`:num(aU(e1(x.r)))}</td><td>${new Date(x.f).toLocaleDateString('es-DO',{day:'2-digit',month:'short'})}</td></tr>`}).join('')
    +'</tbody></table></div>'+(rel?'<p class="hint">× peso corporal = 1RM estimado ÷ tu peso de ese día (o el anterior más cercano; si no hay, el de tus ajustes de Comida).</p>':''):'<p class="hint">Aún no hay récords: aparecen cuando anotas el peso de la primera serie de cada ejercicio.</p>';
  // gráfica
  const ks=Object.keys(rec);if(!ks.includes(grafSel))grafSel=ks[0]||'';
  $('pGraf').innerHTML=ks.length?`${hayP?relB:''}<select id="gSel" aria-label="Ejercicio">${ks.map(k=>`<option value="${esc(k)}"${k===grafSel?' selected':''}>${esc(k.split('|')[1])}</option>`).join('')}</select><div id="graf"></div>
    <div class="leg"><span><i style="background:var(--art)"></i>1RM estimado${rel?' × peso corporal':''}</span><span><i style="background:var(--ven)"></i>peso de la primera serie${rel?' × peso corporal':''}</span></div>`
    :'<p class="hint">La gráfica aparece cuando tengas el peso anotado en al menos una sesión.</p>';
  if(ks.length){$('gSel').onchange=e=>{grafSel=e.target.value;renderProg()};dibujarGraf(grafSel,rel?PC:null)}
  $('pBloque').innerHTML=bloqueHTML(true);renderCmp();
  renderMapa();renderMedallas();renderMedidas();renderFotos()}
document.addEventListener('click',e=>{if(!e.target.closest('[data-rel]'))return;CFG.rel=!CFG.rel;guardarCfg();renderProg()});
const num2f=x=>x.toFixed(2).replace('.',',');
/* ---------- comparar periodos: A (anterior) contra B (actual) ---------- */
let cmpModo='sem',cmpF=null;
const CMPS=[['sem','Esta semana vs la anterior'],['4sem','Últimas 4 semanas vs las 4 previas'],['mes','Este mes vs el anterior'],['mano','Fechas a mano']];
const dK=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).getTime()};
function periodos(){const L=lunes(Date.now()),W=7*864e5,d=new Date(),y=d.getFullYear(),m=d.getMonth(),M=(a,b)=>new Date(a,b,1).getTime();
  if(cmpModo==='4sem')return [[L-7*W,L-3*W],[L-3*W,L+W]];
  if(cmpModo==='mes')return [[M(y,m-1),M(y,m)],[M(y,m),M(y,m+1)]];
  if(cmpModo==='mano'){if(!cmpF)cmpF={a1:diaK(L-7*W),a2:diaK(L-3*W-864e5),b1:diaK(L-3*W),b2:diaK(Date.now())};
    const r=(x,z)=>{let a=dK(x),b=dK(z);if(b<a)[a,b]=[b,a];return [a,new Date(b).setDate(new Date(b).getDate()+1)]};return [r(cmpF.a1,cmpF.a2),r(cmpF.b1,cmpF.b2)]}
  return [[L-W,L],[L,L+W]]}
function statsP(a,b){const hs=hist.filter(h=>{const t=Date.parse(h.start);return t>=a&&t<b}),best={};
  hs.forEach(h=>(h.sets||[]).forEach(r=>{if(r.k!=='act.'||!(r.kg>0)||!r.ej)return;const v=e1(r);if(!best[r.ej]||v>best[r.ej])best[r.ej]=v}));
  return {ses:hs.length,dias:new Set(hs.map(h=>diaK(Date.parse(h.start)))).size,g:volRango(a,b),z:volMusR(a,b).v,
    recs:hs.reduce((n,h)=>n+(h.sets||[]).filter(r=>r.pr).length,0),ef:hs.reduce((n,h)=>n+efH(h),0),best}}
// flecha y color: bueno = 1 si subir es mejor, −1 si bajar es mejor (cintura), 0 neutro (peso corporal)
function delta(d,txt,bueno=1){if(Math.abs(d)<.05)return '<td class="eq">=</td>';const up=d>0,cl=!bueno?'eq':(up===(bueno>0))?'up':'dn';return `<td class="${cl}">${up?'↑':'↓'} ${txt}</td>`}
const fRango=([a,b])=>{const o={day:'numeric',month:'short'};return `${new Date(a).toLocaleDateString('es-DO',o)} – ${new Date(b-1).toLocaleDateString('es-DO',o)}`};
function renderCmp(){const [PA,PB]=periodos(),A=statsP(...PA),B=statsP(...PB),enCursoB=PB[1]>Date.now();
  const fila=(n,a,b,fmtv=ef1,bueno=1,dt)=>`<tr><td style="white-space:normal">${n}</td><td>${a==null?'—':fmtv(a)}</td><td>${b==null?'—':fmtv(b)}</td>${a==null||b==null?'<td class="eq">—</td>':delta(b-a,dt!=null?dt:(b-a>0?'+':'−')+fmtv(Math.abs(b-a)),bueno)}</tr>`;
  const th=(x,y,z)=>`<thead><tr><th>${x}</th><th>${y}</th><th>${z}</th><th>Cambio</th></tr></thead>`;
  const ent=v=>String(Math.round(v));
  let h=`<select id="cmpSel" aria-label="Periodos a comparar">${CMPS.map(([k,n])=>`<option value="${k}"${k===cmpModo?' selected':''}>${n}</option>`).join('')}</select>`;
  if(cmpModo==='mano')h+=`<div class="cmpf"><label>A desde<input class="in" type="date" data-cf="a1" value="${esc(cmpF.a1)}"></label><label>A hasta<input class="in" type="date" data-cf="a2" value="${esc(cmpF.a2)}"></label>
    <label>B desde<input class="in" type="date" data-cf="b1" value="${esc(cmpF.b1)}"></label><label>B hasta<input class="in" type="date" data-cf="b2" value="${esc(cmpF.b2)}"></label></div>`;
  h+=`<p class="hint">A: ${fRango(PA)} · B: ${fRango(PB)}${enCursoB?' (en curso)':''}. Flecha verde: mejora; ámbar: baja.</p>`;
  h+=`<div class="tbl"><table>${th('General','A','B')}<tbody>${fila('Sesiones',A.ses,B.ses,ent)}${fila('Días entrenados',A.dias,B.dias,ent)}${fila('Series efectivas',A.ef,B.ef)}${fila('Récords',A.recs,B.recs,ent)}</tbody></table></div>`;
  h+=`<h3>Series efectivas por grupo</h3><div class="tbl"><table>${th('Grupo','A','B')}<tbody>${Object.keys(CAT).map(g=>fila(CAT[g].n,A.g[g]||0,B.g[g]||0)).join('')}</tbody></table></div>`;
  const zs=Object.keys(MUS).map(m=>[m,(B.z[m]||0)-(A.z[m]||0)]).filter(x=>Math.abs(x[1])>=.05).sort((x,y)=>Math.abs(y[1])-Math.abs(x[1])).slice(0,5);
  h+=`<h3>Zonas con más cambio</h3>`+(zs.length?`<div class="tbl"><table>${th('Zona','A','B')}<tbody>${zs.map(([m])=>fila(MUS[m][0],A.z[m]||0,B.z[m]||0)).join('')}</tbody></table></div>`:'<p class="hint">Sin cambios por zona.</p>');
  const ej=Object.keys(B.best).filter(k=>A.best[k]).map(k=>[k,A.best[k],B.best[k],100*(B.best[k]/A.best[k]-1)]).sort((x,y)=>Math.abs(y[3])-Math.abs(x[3]));
  h+=`<h3>Mejor 1RM estimado por ejercicio (${uTxt()})</h3>`+(ej.length?`<div class="tbl"><table>${th('Ejercicio','A','B')}<tbody>${ej.map(([k,a,b,pc])=>fila(esc(k),aU(a),aU(b),num,1,(pc>0?'+':'−')+num(Math.abs(pc))+' %')).join('')}</tbody></table></div>`
    :'<p class="hint">Ningún ejercicio con peso anotado en los dos periodos.</p>');
  // medidas y peso corporal: el primer dato y el último de todo el tramo A + B
  const k0=diaK(Math.min(PA[0],PB[0])),k1=diaK(Math.max(PA[1],PB[1])-1),ms=medidas.filter(m=>m.f>=k0&&m.f<=k1),PC=pesosComida(),ps=PC.ps.filter(([k])=>k>=k0&&k<=k1);
  const ini=(L,k)=>{const x=L.find(m=>m[k]>0);return x?x[k]:null},fin=(L,k)=>{const x=L.slice().reverse().find(m=>m[k]>0);return x?x[k]:null};
  const fm=MEDIDAS.filter(([k])=>ini(ms,k)!=null).map(([k,n])=>fila(n+' (cm)',ini(ms,k),fin(ms,k),num,k==='cintura'?-1:1));
  if(ps.length)fm.push(fila('Peso corporal (kg)',ps[0][1],ps[ps.length-1][1],num,0));
  h+=`<h3>Medidas y peso corporal</h3>`+(fm.length?`<div class="tbl"><table>${th('','Al inicio','Al final')}<tbody>${fm.join('')}</tbody></table></div>`:'<p class="hint">Sin medidas ni peso anotados en estas fechas.</p>');
  $('pCmp').innerHTML=h;
  $('cmpSel').onchange=e=>{cmpModo=e.target.value;renderCmp()};
  $('pCmp').querySelectorAll('[data-cf]').forEach(i=>i.onchange=()=>{if(i.value){cmpF[i.dataset.cf]=i.value;renderCmp()}})}
function pesosComida(){let C=null;try{C=JSON.parse(localStorage.getItem('comida-v1')||'null')}catch(e){}if(!C||typeof C!=='object')return {ps:[],cfg:null};
  const ps=esObj(C.pesos)?Object.entries(C.pesos).filter(([k,v])=>vDia(k)&&vNum(v,1,700)!=null).map(([k,v])=>[k,+v]).sort((x,y)=>x[0].localeCompare(y[0])):[];
  return {ps,cfg:esObj(C.cfg)&&vNum(C.cfg.peso,1,700)!=null?+C.cfg.peso:null}}
const tienePeso=P=>P.ps.length>0||P.cfg!=null;
// peso corporal de un día: el registro más cercano anterior o igual; si no hay, el peso de los ajustes de Comida
function pesoDe(f,P=pesosComida()){const k=/^\d{4}-\d\d-\d\d$/.test(f)?f:diaK(Date.parse(f));let v=null;for(const [d,x] of P.ps){if(d<=k)v=x;else break}return v!=null?v:P.cfg}
/* ---------- mapa muscular por zonas: cada serie efectiva suma 1 al músculo principal del ejercicio y una fracción a los secundarios ---------- */
// zona: [nombre, grupo, rango semanal de series efectivas (contando fracciones), nombre en la lista]. El orden es el de la lista
// (las 8 primeras van en la columna izquierda). v15: recto+oblicuos → abdomen, gemelos → pantorrillas, «espalda media» → trapecio sup/medio/inf.
const MUS={biceps:['Bíceps','biceps',[8,16],'Bíceps'],antebrazo:['Braquial y antebrazo','biceps',[4,10],'Antebrazo'],triceps:['Tríceps','triceps',[8,16],'Tríceps'],
 pecho_sup:['Pecho superior','pecho',[6,12],'Pecho superior'],pecho_med:['Pecho medio e inferior','pecho',[6,12],'Pecho medio'],
 abdomen:['Abdomen (recto y oblicuos)','abdominales',[6,16],'Abdomen'],cuads:['Cuádriceps','piernas',[10,18],'Cuádriceps'],pantorrillas:['Pantorrillas (gemelos y sóleo)','piernas',[6,12],'Pantorrillas'],
 del_ant:['Deltoide anterior','hombros',[6,12],'Deltoide anterior'],del_lat:['Deltoide lateral','hombros',[8,16],'Deltoide lateral'],del_post:['Deltoide posterior','hombros',[6,12],'Deltoide posterior'],
 trap_sup:['Trapecio superior','espalda',[4,10],'Trapecio sup.'],trap_med:['Trapecio medio y romboides','espalda',[6,12],'Trapecio medio'],trap_inf:['Trapecio inferior','espalda',[3,8],'Trapecio inf.'],
 dorsal:['Dorsal ancho','espalda',[10,18],'Dorsal'],lumbar:['Lumbar','espalda',[2,8],'Lumbar'],gluteos:['Glúteos','piernas',[6,12],'Glúteos'],isquios:['Isquiotibiales','piernas',[6,12],'Isquios']};
// Reglas por nombre del ejercicio (sin tildes, en orden: gana la primera). Una función recibe el grupo.
/* Nombres de pierna, espalda baja y otros habituales van ANTES de «curl», «extension», «press» y «elevaciones» (si no, «Curl de piernas» sería bíceps).
   Aductores: el mapa no tiene zona propia; el muslo interno se pinta en cuádriceps (convención). Abductores: glúteo medio → glúteos. */
const REGLAS_MUS=[
 [/pallof|oblicu|rotaci|lenador/,{abdomen:1}],
 [/hiperextensi|extensi(on|ones) lumbar|lumbares|buenos dias/,{lumbar:1,gluteos:.5}],
 [/femoral|isquio|nordico|curl (de |con )?piernas?/,{isquios:1}],
 [/cuadriceps|extensi(on|ones) (de )?(piernas?|rodillas?)/,{cuads:1}],[/peso muerto|rumano/,{isquios:1,gluteos:.5,lumbar:.5}],
 [/abductor|abduccion/,{gluteos:1}],[/aductor|aduccion/,{cuads:1}],
 [/hip thrust|gluteo/,{gluteos:1,isquios:.25}],[/zancada|bulgara|estocada/,{cuads:1,gluteos:.75}],
 [/sentadilla|prensa|hack|goblet|press (de |en )?piernas?/,{cuads:1,gluteos:.5}],[/talon|gemelo|pantorrilla/,{pantorrillas:1}],
 [/encogimient|shrug/,{trap_sup:1}],[/frontal/,{del_ant:1}],
 [/muneca|antebrazo/,{antebrazo:1}],
 [/martillo/,{antebrazo:1,biceps:.5}],[/curl/,{biceps:1,antebrazo:.25}],
 [/press frances|extension|pushdown|patada|triceps/,{triceps:1}],[/press cerrado/,{triceps:1,pecho_med:.5,del_ant:.25}],
 [/fondos/,g=>g==='triceps'?{triceps:1,pecho_med:.5,del_ant:.25}:{pecho_med:1,triceps:.5,del_ant:.25}],
 [/flexiones? (diamante|cerrad)/,{triceps:1,pecho_med:.5}],
 [/face pull|pajaro|posterior|cruce inverso/,{del_post:1,trap_med:.5}],[/menton/,{del_lat:1,trap_sup:.5}],[/lateral/,{del_lat:1}],
 [/jalon|dominada|pullover/,{dorsal:1,biceps:.5,trap_inf:.25}],[/remo/,{trap_med:1,dorsal:.5,del_post:.5,biceps:.5}],
 [/inclinad.*(press|banca)|(press|banca).*inclinad/,{pecho_sup:1,del_ant:.5,triceps:.5}],
 [/militar|press.*(hombro|sentado)|arnold/,{del_ant:1,del_lat:.5,triceps:.5,trap_sup:.25}],
 [/press|banca|flexion|declinad/,g=>g==='hombros'?{del_ant:1,del_lat:.5,triceps:.5,trap_sup:.25}:{pecho_med:1,del_ant:.5,triceps:.5}],
 [/apertura|pec deck|cruce|contractora/,{pecho_med:1,pecho_sup:.25}],
 [/crunch|rueda|elevaci.*pierna|colgad|rodillas al pecho|plancha/,{abdomen:1}]];
const MUS_DEF={biceps:{biceps:1},triceps:{triceps:1},espalda:{dorsal:1},pecho:{pecho_med:1},hombros:{del_lat:1},abdominales:{abdomen:1},piernas:{cuads:1}};
function musculos(n,g){const t=sinTilde(n);if(/(^|\s)vacio(\s|$)/.test(t))return {};   // ojo: «elevaciones» contiene «vacio»
  for(const [re,m] of REGLAS_MUS)if(re.test(t))return typeof m==='function'?m(g):m;return MUS_DEF[g]||{}}
// Nombre del ejercicio de una fila (las sesiones viejas sin «ej» se reconocen por el nombre corto de la estación).
const nomFila=(r,g)=>r.ej||(CAT[g].e.find(e=>e.s===r.ex)||BASE[g].e.find(e=>e.s===r.ex)||{}).n||'';
// Series efectivas por zona en [a, b) y de qué ejercicio vino cada aporte; volMus(off) = la semana off.
function volMusR(a,b){const v={},de={};
  hist.forEach(h=>{const t=Date.parse(h.start),g=gDe(h);if(!g||!CAT[g]||t<a||t>=b)return;
    (h.sets||[]).forEach(r=>{const c=efectiva(r);if(!c)return;const n=nomFila(r,g);
      for(const [m,f] of Object.entries(musculos(n,g))){v[m]=(v[m]||0)+c*f;(de[m]=de[m]||{})[n]=(de[m][n]||0)+c*f}})});
  return {v,de}}
function volMus(off){const a=lunes(Date.now())-off*7*864e5;return volMusR(a,a+7*864e5)}
/* Series por grupo con secundarios: cada serie suma su efectiva × el MAYOR factor entre las zonas de cada grupo que trabaja
   (press inclinado: pecho 1, hombros ½, tríceps ½; remo: espalda 1, hombros ½, bíceps ½). Así barras, «qué toca», resumen y medallas cuadran con el mapa. */
const factGrupo=(n,g)=>{const o={};for(const [m,f] of Object.entries(musculos(n,g)))if(MUS[m]){const G=MUS[m][1];o[G]=Math.max(o[G]||0,f)}return o};
function volRango(a,b){const o={};
  hist.forEach(h=>{const t=Date.parse(h.start),g=gDe(h);if(!g||!CAT[g]||t<a||t>=b)return;
    if(!(h.sets||[]).length){o[g]=(o[g]||0)+efH(h);return}   // sesión sin series detalladas: solo su total
    h.sets.forEach(r=>{const c=efectiva(r);if(!c)return;const f=factGrupo(nomFila(r,g),g);for(const G in f)o[G]=(o[G]||0)+c*f[G]})});
  return o}
function volGrupo(off){const a=lunes(Date.now())-off*7*864e5;return volRango(a,a+7*864e5)}
let mapaOff=0,mapaSel='',figD=null;
// estado de una zona → clase de color (variables --m0/--mlo/--mok/--mhi de cada estilo, ver estilo.js)
const estMus=(m,v)=>{const x=v[m]||0,[lo,hi]=MUS[m][2];return x<=0?'z0':x<lo?'zlo':x<=hi?'zok':'zhi'};
const EST_MUS={z0:'sin series',zlo:'por debajo',zok:'en rango',zhi:'te pasaste'};
/* Figura (dibujada a mano, frente y espalda): cada forma es una lista de puntos «x,y» de la mitad izquierda (eje en x = 60) que se une con curvas
   suaves (Catmull-Rom → Bézier) y se refleja (x → 120 − x); una «c» delante = forma centrada, sin reflejo. FIG_B = cuerpo base (cabeza, cuello,
   tronco, brazos, manos, piernas, pies), FIG_D = dedos. En FIG cada forma es [zona, puntos]; zona '' = parte neutra que no se cuenta. */
const FIG_B='c60,4.8 65.5,6.2 69,11.7 69.2,18.1 67.4,24.6 63.7,29.6 60,31 56.3,29.6 52.6,24.6 50.8,18.1 51,11.7 54.5,6.2|52.2,24 60,24 60,43.1 48,43.1 51.6,33.2|60,33.2 51.6,33.8 40.8,37.6 30,40.4 21.6,44.2 17.4,51.9 18,60.7 24.2,66.2 31.1,68.4 34.2,78.3 38.7,91.5 40.7,102.5 37.6,111.3 39.1,113.5 49.4,125.6 60,127.8|22.7,45.3 29,51.9 31.2,65.1 29.7,78.3 26.9,89.3 17.8,92.6 12.1,84.9 11,69.5 13.3,55.2 17.9,47.5|26.2,87.1 26.5,95.9 22.6,106.9 16.3,119 8.4,119 6.3,111.3 7.7,99.2 11.6,88.2|15.8,114.6 17,121.8 15.9,129.8 4.6,130.7 2.3,124.5 2.6,117.9 8.1,113.8|34.3,106.9 45,111.3 56.8,121.2 59.5,130 57.3,148.7 55.2,164.1 54.6,175.1 42.9,176.2 38.6,164.1 33.8,144.3 32.2,126.7|41.8,170.7 54.6,170.7 56.8,181.7 55.7,197.1 52.5,212.5 52,216.9 46.1,216.9 45.6,212.5 40.7,199.3 38.1,186.1 39.1,176.2|46.1,212.5 51.7,212.5 52.7,219.1 55.3,225.2 55.3,229.9 49.3,231.4 42.9,231 41,228.8 42.7,223.5 44.6,218',FIG_D='1.9,119.1 -0.3,129 0.7,130.4 2.2,129.7 5.2,120 3.9,118.2|4.7,129.5 4.6,140.5 5.8,141.6 7.1,140.6 7.5,129.6 6.1,128.5|7.5,130 7.6,143.4 8.9,144.5 10.2,143.4 10.3,130 8.9,128.9|10.2,130 10.7,142.5 12,143.5 13.3,142.4 13.1,130 11.6,128.9|12.9,129.4 13.6,138.9 14.9,139.8 16,138.7 15.6,129.3 14.2,128.3';
const FIG={F:[['trap_sup','52.6,27.6 54.5,37.2 44.3,38.9 33.5,40.7 40.5,35.4 48.1,30.8'],
 ['del_ant','35.6,39.7 39.4,43.8 38.1,53.1 33.7,61.8 29.2,65.9 26,58.9 26.7,48.4 30.5,42'],
 ['del_lat','29.1,40.7 25.3,47.2 24.7,57.7 27.2,65.2 22.2,64.6 17.1,57.7 17.1,49.5 21.5,43.1'],
 ['pecho_sup','59.6,39.2* 59.6,49.3* 49.3,49.9 39.8,53.4 35.6,50.5 38.5,44.1 46.8,40.6'],
 ['pecho_med','59.6,50.3* 59.6,64.3* 54.6,68.3 44.6,68.9 36.1,65.4 31.6,60.2 32.3,55.5 38.6,54.1 48.2,51'],
 ['biceps','27.5,63.3 30.7,69.2 29.9,80.8 26.2,89.6 25.3,78.5 27,69.2'],
 ['biceps','25.3,61 26.8,69.2 25.1,80.9 22.7,90.2 16.9,87.9 13.4,77.4 14.5,66.9 18.9,61'],
 ['antebrazo','17.9,89.7 23.1,90.9 20.9,101.4 14.9,115.4 10.5,116.6 8.2,108.4 10.4,96.7 13.4,90.9'],
 ['antebrazo','24.7,90.2 26.2,95.4 22.7,105.9 16.6,117 13.4,116.4 17.5,105.9 21.7,95.4'],
 ['abdomen','50.6,69.8 59.6,69* 59.6,79.1* 50.9,79.7'],
 ['abdomen','50.9,80.8 59.6,80.4* 59.6,90.7* 51.2,91'],
 ['abdomen','51.3,92.1 59.6,91.9* 59.6,102.2* 51.5,102.6'],
 ['abdomen','51.4,103.4 59.6,103.3* 59.6,124* 56.3,120.5 52.5,112.4'],
 ['abdomen','49.3,69.4 50.2,86.9 50.8,103.2 48.8,113.1 44.4,111.3 41.8,103.2 39.7,89.2 38.1,75.2 41.7,68.8'],
 ['','52.2,25.3 55.2,26.3 59.6,36.1* 58.1,38.4 55.8,37.8'],
 ['','33.7,110.1 37.6,111.8 37,116.3 33.2,118'],
 ['','34,66.7 38.7,69.5 37,72.9 33.8,70.6'],
 ['','35.3,72.7 37.7,75 37.1,79.5 35.1,77.2'],
 ['','36.9,79.9 39.1,81.9 39,86.1 37,83.8'],
 ['cuads','33.2,118.6 38.1,116.9 41.5,132.6 42.7,151.3 43.4,168.8 40.9,175.2 36.9,165.3 33.6,146.6 32.5,127.9'],
 ['cuads','39.9,112.5 46.1,115.4 50.1,128.2 51.2,144.6 49.3,159.7 46.1,167.3 44.5,160.9 43.6,144.6 41.8,125.9'],
 ['cuads','51.5,138.8 55.8,146.9 56.7,158.6 54.9,169.1 50.9,174.3 46.2,172 46.1,165.6 48.7,156.3 49.9,146.9'],
 ['','49.2,118.6 58.5,126.5 58.5,136.7 55.8,144.6 51.9,142.4 50,131'],
 ['pantorrillas','39.6,177.1 43.9,178.8 45,188.1 44.3,199.8 43,209.1 40.7,202.1 37.5,189.3 37.7,182.3'],
 ['pantorrillas','50.6,176.4 54.2,179.9 56.6,188.1 55.7,197.4 52.5,206.7 50.5,209.1 49.8,195.1 50,183.4'],
 ['','45.2,176.8 49.6,177.3 49.1,194.9 47.6,211.9 45.8,211.9 45.6,194.9']],
E:[['trap_sup','59.6,20.3* 59.6,37.8* 50.5,39 39.1,41.1 31.5,41.3 39.1,36.1 49.3,30.9 55,24'],
 ['trap_med','59.6,38.4* 59.6,58* 52.4,57.4 44.1,52.7 37.7,45.2 42.8,41.2 50.5,39.6'],
 ['trap_inf','59.6,58.6* 59.6,86* 56.9,79 51.7,68.5 45.8,57.5 44.9,54 52.2,58.1'],
 ['del_post','34.4,41.4 37.5,44.9 36.3,53.1 31.8,61.8 28.6,65.3 26.1,58.9 26.7,48.4 30.5,42.6'],
 ['del_lat','29.1,40.7 25.3,47.2 24.7,57.7 27.2,65.2 22.2,64.6 17.1,57.7 17.1,49.5 21.5,43.1'],
 ['','42,52.8 46.1,60.2 46.1,65.6 40.3,66.4 35.2,60.2 36.5,51.1'],
 ['dorsal','32.4,65.7 40.7,66.9 50.1,66.9 54.7,73.3 56.8,83.8 55.8,92 51.8,100.1 45.7,106 41.2,99 36.8,85'],
 ['lumbar','58,88.4 59.6,93.1* 59.6,116.4* 54.1,117.6 51.5,108.2 53.3,101.2'],
 ['triceps','19.6,59.9 23.5,62.2 24.4,73.9 22.7,85.6 18.9,90.2 14.3,84.4 12.7,71.6 15.1,63.4'],
 ['triceps','25,61 28.9,64.5 30.8,73.8 28.1,85.5 22.4,90.7 24.5,82 25.9,71.5'],
 ['antebrazo','17.9,89.7 23.1,90.9 20.9,101.4 14.9,115.4 10.5,116.6 8.2,108.4 10.4,96.7 13.4,90.9'],
 ['antebrazo','24.7,90.2 26.2,95.4 22.7,105.9 16.6,117 13.4,116.4 17.5,105.9 21.7,95.4'],
 ['gluteos','42.3,106 52,108.9 59.6,113* 59.6,134* 52.9,138.1 43.4,135.8 36.1,129.4 34.4,117.7 37.8,108.9'],
 ['isquios','34,129.8 43.9,136.2 46.2,151.9 45.3,169.4 41.9,175.3 36.9,163.6 33.3,144.9'],
 ['isquios','46.9,138.5 55.9,138.5 58.9,148.4 57.1,162.4 51.4,174 47.1,164.7 46.6,150.7'],
 ['pantorrillas','39.5,174.3 45.9,176.1 47.2,186 45.9,197.7 43.5,205.2 39.1,196.5 36.8,186 37.5,179'],
 ['pantorrillas','47.3,175.9 53.7,173.6 57.5,181.2 57.8,190.5 54.8,199.8 50.8,206.8 48,203.9 47.1,189.4'],
 ['pantorrillas','41.5,205 52.8,206.2 50.8,214.3 46.5,215.5 44.2,214.3']]};
// fibras (curvas finas dentro de cada músculo, calculadas de sus formas): «inicio control fin», mitad izquierda
const FIG_FIB={F:'54.4,34.3 52.8,36.1 51.1,38|53.7,32.9 50.3,35.5 47,38.1|52.2,32 44.3,35.9 36.4,39.8|53,30.1 50,30.9 47,31.7|53,28.8 51.7,28.9 50.4,28.9|28.7,64.4 27.5,59.1 26.3,53.8|29.5,63.7 29.2,54.9 28.9,46.1|30.6,63.2 32.2,52.8 33.7,42.4|31.8,62.9 35,53.8 38.2,44.8|23.2,64.2 20.2,59.1 17.3,54|24.3,63.8 21.8,56 19.3,48.1|24.4,52.9 24,48 23.6,43.2|26.3,65.5 26.5,64.4 26.6,63.3|37.8,46.1 42.9,43.5 48,40.8|38.4,47.1 47.8,44.2 57.2,41.2|38.2,48.4 47.7,47.1 57.2,45.8|37,49.5 42.4,49.7 47.8,49.9|36.4,50.3 39.8,51 43.2,51.7|36.3,51.2 38.4,52 40.6,52.9|33.8,55.9 42.9,53.5 51.9,51.1|34.2,57 45.5,55.9 56.8,54.8|34.1,58.2 45.4,58.9 56.8,59.7|34,59.3 45.1,61.9 56.1,64.5|33.6,60.4 42.4,64 51.1,67.7|33.1,61.4 38.5,64.8 43.8,68.1|26.6,85.9 25.3,76.5 27.8,67.2|28.5,83.2 30.3,76 29.4,68.7|15.2,81.2 14.1,73.8 15.9,66.6|17.2,84.3 15.8,74.6 18.2,65.1|19.4,85.8 17.8,75 20.4,64.5|21.5,86.4 24.2,75.5 22.6,64.4|23.8,84.6 26.3,74.7 24.8,64.7|9.4,108.8 10.1,100.6 13.8,93.2|10.9,112.1 11.7,102.2 16.1,93.4|12.9,113.5 17.6,104 18.5,93.5|15.7,112 20.1,103.2 20.9,93.4|15.8,114.2 17.9,103.5 23.7,94.5|17.8,113.8 23,105.8 24.8,96.4|44.2,70 47.6,74.2 49.2,79.4|40.9,74.1 46.4,80.8 48.9,89.2|40,82.6 42.9,92 49,99.7|41.6,95.8 43.7,102.9 48.4,108.6|38.8,124 44.3,142.3 42.6,161.4|36.9,124.2 43.2,144.8 41.3,166.2|35.1,125.2 33.3,146.2 39.4,166.5|33.4,126.8 31.8,144.5 37,161.5|48.2,124.2 51.5,136.5 50,149.2|46.1,121.3 50.5,137.8 48.4,154.8|44.1,120.3 41.7,139.6 46.7,158.4|42.1,119.6 39.7,139.4 44.8,158.8|47.6,170.1 46.8,161.9 49.1,154.1|49.7,169.4 48.4,156.7 52.1,144.5|51.7,169.7 54.9,158.6 53.8,147.1|53.8,168.5 56.4,159.7 55.5,150.6|42.6,180.6 44.9,188.9 43.9,197.6|40.7,181.4 43.9,192.8 42.5,204.6|38.8,181.7 37.9,189.7 40,197.5|51.3,204.8 49.2,193 51.6,181.2|53.1,201.6 55.1,192 53.3,182.3|54.9,197.9 56.2,191.2 55,184.4',
E:'58.5,23 54.2,30.2 49.8,37.5|59.3,21.4 58,22 56.7,22.6|58.9,49.6 56.2,53.1 53.6,56.6|58.1,48.8 52.1,50.7 46.1,52.6|57.7,47.5 50.2,45.1 42.6,42.7|59,46.8 56.4,43.5 53.8,40.1|59.2,71.1 57.5,73.3 55.9,75.5|59,70.3 56.6,71.1 54.1,71.9|58.7,69.6 55.3,68.5 51.9,67.5|58.7,68.2 54.9,63.3 51.2,58.4|28.2,63.8 27.3,58.6 26.3,53.4|28.9,63.3 28.8,55 28.6,46.7|29.8,62.8 31.1,53.2 32.5,43.7|30.9,62.2 33.5,53.7 36.1,45.3|23.2,64.2 20.2,59.1 17.3,54|24.3,63.8 21.8,56 19.3,48.1|24.4,52.9 24,48 23.6,43.2|26.3,65.5 26.5,64.4 26.6,63.3|42.4,67.4 47.6,69.3 52.7,71.2|35.5,66 44.5,70.9 53.6,75.9|35.1,67 44.7,74.4 54.4,81.8|34.8,68.3 44.3,78.2 53.8,88.1|34.5,69.9 43,82 51.5,94.1|34.3,72.5 41,86.2 47.8,99.8|53.2,112.7 52.6,105.8 54.6,99.1|55.3,113.8 58.5,103.5 57.5,92.6|57.6,114.3 60,106.1 59.3,97.5|14.5,81.9 13.2,74.3 14.7,66.9|16.4,84.5 14.7,74.8 16.7,65.1|18.3,85.8 16.4,75 18.7,64.3|20.3,85.6 22.6,74.8 20.7,64|22.3,83.1 24.3,73.8 22.6,64.4|23.9,88.9 23.6,85.2 24.7,81.7|26.1,85.1 28.8,76.2 27.9,67|28.1,83.3 30.1,76.5 29.5,69.5|9.4,108.8 10.1,100.6 13.8,93.2|10.9,112.1 11.7,102.2 16.1,93.4|12.9,113.5 17.6,104 18.5,93.5|15.7,112 20.1,103.2 20.9,93.4|15.8,114.2 17.9,103.5 23.7,94.5|17.8,113.8 23,105.8 24.8,96.4|36.8,114.7 41.6,110.8 47.4,109|37.5,120.8 44.4,115.2 53,112.5|39,126.5 48.5,123.6 56.2,117.3|41.9,131.4 50.1,128.9 56.7,123.5|46.8,135.3 52.7,133.5 57.5,129.6|42.9,138 46.2,147.7 45.6,157.9|40.7,137.3 45.2,150.8 44.4,165|38.5,136.6 43.7,152.1 42.7,168.5|36.3,135.9 35.3,152.6 40.6,168.5|34.2,135.9 33.3,150 37.8,163.3|47.8,162.9 46,152.2 48.3,141.7|49.8,167.6 47.7,154.8 50.5,142.1|51.9,168.6 54.8,155.6 52.6,142.4|54.2,165.8 56.8,154.2 54.8,142.4|56.5,161.2 58.4,152.3 56.9,143.4|44.7,177.8 46.8,185.2 46,192.9|42.6,178.3 45.5,188.5 44.4,199.2|40.4,178.4 39.3,189.5 42.3,200.2|38.4,179.5 37.5,187.9 39.8,196|47.8,196.7 46.4,187.1 48.8,177.7|49.4,202 47.8,189.8 50.7,178|51.4,201.9 49.7,189.8 52.7,178|53.5,199.1 56.1,189 54.6,178.7|55.7,195.3 57.5,188.2 56.5,181|51,206.2 52,208.4 52,210.8|49,206.1 50.4,209.4 50.5,213|47,206 48.6,209.8 48.7,213.9|45,205.9 45.1,210.1 46.7,214|43,206.1 43.1,210.2 44.7,213.9'};
function trazo(s){const c=s[0]==='c',P=(c?s.slice(1):s).split(' ').map(p=>{const q=p.split(',').map(parseFloat);q[2]=p.endsWith('*');return q}),f=x=>+x.toFixed(1);
  const sub=Q=>{if(Q.reduce((a,p,i)=>{const q=Q[(i+1)%Q.length];return a+p[0]*q[1]-q[0]*p[1]},0)<0)Q=Q.slice().reverse();   // misma orientación: sin huecos al unir
    const n=Q.length;let d=`M${f(Q[0][0])} ${f(Q[0][1])}`;
    for(let i=0;i<n;i++){const a=Q[(i+n-1)%n],b=Q[i],q=Q[(i+1)%n],e=Q[(i+2)%n],c1=b[2]?b:[b[0]+(q[0]-a[0])/6,b[1]+(q[1]-a[1])/6],c2=q[2]?q:[q[0]-(e[0]-b[0])/6,q[1]-(e[1]-b[1])/6];   // «*» = esquina
      d+=`C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(q[0])} ${f(q[1])}`}return d+'Z'};
  return sub(P)+(c?'':sub(P.map(([x,y,k])=>[120-x,y,k])))}
const fibra=s=>{const [a,c,b]=s.split(' ').map(p=>p.split(',').map(Number)),q=(A,C,B)=>`M${A[0]} ${A[1]}Q${C[0]} ${C[1]} ${B[0]} ${B[1]}`,m=([x,y])=>[+(120-x).toFixed(1),y];return q(a,c,b)+q(m(a),m(c),m(b))};
const figTr=()=>figD||(figD={b:FIG_B.split('|').map(trazo).join(''),d:FIG_D.split('|').map(trazo).join(''),F:FIG.F.map(([m,s])=>[m,trazo(s)]),E:FIG.E.map(([m,s])=>[m,trazo(s)]),
  fF:FIG_FIB.F.split('|').map(fibra).join(''),fE:FIG_FIB.E.split('|').map(fibra).join('')});
const semNom=o=>o===0?'Esta semana':o===1?'Semana pasada':'Semana del '+new Date(lunes(Date.now())-o*7*864e5).toLocaleDateString('es-DO',{day:'numeric',month:'short'});
function mapaSVG(){
  const {v,de}=volMus(mapaOff),T=figTr();
  const zona=(m,d)=>`<path d="${d}" data-m="${m}" class="${estMus(m,v)}${m===mapaSel?' sel':''}"><title>${esc(MUS[m][0])}: ${ef1(v[m]||0)} de ${MUS[m][2].join('–')}</title></path>`;
  // capas: cuerpo (contorno + relleno + luz), músculos (clicables), volumen por músculo, fibras y, encima, el borde de la zona elegida; lo decorativo no captura toques
  const fig=(V,dx,lab)=>`<g transform="translate(${dx} 0)"><path class="cb" d="${T.b}"/><path class="cf" d="${T.b}"/><path class="mluz" d="${T.b}"/><path class="zn" d="${T.d}"/>`
    +T[V].map(([m,d])=>m&&MUS[m]?zona(m,d):`<path class="zn" d="${d}"/>`).join('')
    +T[V].map(([,d])=>`<path class="mvol" d="${d}"/>`).join('')+`<path class="mfib" d="${T['f'+V]}"/>`
    +T[V].filter(([m])=>m&&m===mapaSel).map(([,d])=>`<path class="selb" d="${d}"/>`).join('')
    +`<text x="60" y="247" text-anchor="middle">${lab}</text></g>`;
  let det='<p class="hint" style="text-align:center">Toca una zona para ver de qué ejercicios vienen sus series.</p>';
  if(mapaSel&&MUS[mapaSel]){const [n,,r]=MUS[mapaSel],x=v[mapaSel]||0,ap=Object.entries(de[mapaSel]||{}).sort((a,b)=>b[1]-a[1]);
    det=`<p style="margin:0;font-size:14px"><b>${esc(n)}</b>: ${ef1(x)} de ${r.join('–')} series efectivas · ${x<=0?'sin series':x<r[0]?`faltan ${ef1(r[0]-x)}`:x<=r[1]?'en rango':'te pasaste'}</p>
      <p class="hint">${ap.length?'Vienen de: '+ap.map(([e,c])=>`${esc(e)} ${ef1(c)}`).join(' · '):'Ningún ejercicio de esta semana la trabajó.'}</p>`}
  const ks=Object.keys(MUS),fila=m=>`<button type="button" data-m="${m}" class="musr${m===mapaSel?' on':''}" aria-pressed="${m===mapaSel}"><i class="mpt ${estMus(m,v)}"></i><span>${esc(MUS[m][3])}</span><b>${ef1(v[m]||0)}</b><span class="chev" aria-hidden="true">›</span></button>`;
  return `<div class="calnav mnav"><button type="button" data-moff="1" aria-label="Semana anterior" ${mapaOff>=8?'disabled':''}>‹</button>
    <span class="msel"><span class="mlab" aria-hidden="true">${esc(semNom(mapaOff))}<i>▾</i></span><select id="mSem" aria-label="Semana del mapa">${Array.from({length:9},(_,o)=>`<option value="${o}"${o===mapaOff?' selected':''}>${esc(semNom(o))}</option>`).join('')}</select></span>
    <button type="button" data-moff="-1" aria-label="Semana siguiente" ${mapaOff<=0?'disabled':''}>›</button></div>
    <svg id="mapa" viewBox="0 0 244 252" role="img" aria-label="Mapa muscular por zonas, frente y espalda"><defs><linearGradient id="mluz" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient><radialGradient id="mvol" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient></defs>${fig('F',0,'FRENTE')}${fig('E',124,'ESPALDA')}</svg>
    <div class="mleg">${Object.entries(EST_MUS).map(([k,t])=>`<span><i class="mpt ${k}"></i>${t}</span>`).join('')}</div>
    ${det}<p class="lbl" style="margin:6px 0 0">Volumen semanal por grupo muscular</p>
    <div class="musl"><div>${ks.slice(0,8).map(fila).join('')}</div><div>${ks.slice(8).map(fila).join('')}</div></div>
    <p class="hint">Cada serie efectiva suma 1 al músculo principal del ejercicio y una fracción a los que ayudan (por ejemplo, el press inclinado suma ½ al deltoide anterior y ½ al tríceps). Las barras por grupo de arriba usan la misma cuenta.</p>`}
function renderMapa(){$('pMapa').innerHTML=mapaSVG()}
$('pMapa').addEventListener('click',e=>{const o=e.target.closest('[data-moff]');if(o){mapaOff=Math.max(0,Math.min(8,mapaOff+ +o.dataset.moff));renderMapa();return}
  const m=e.target.closest('[data-m]');if(m){mapaSel=mapaSel===m.dataset.m?'':m.dataset.m;renderMapa()}});
$('pMapa').addEventListener('change',e=>{if(e.target.id!=='mSem')return;mapaOff=Math.max(0,Math.min(8,+e.target.value||0));renderMapa();$('mSem').focus()});
/* ---------- medallas: se calculan del historial; las ya vistas se recuerdan para avisar solo las nuevas ---------- */
const MEDKEY='reloj-anomalo-medallas';
const MEDALLAS=[
 {id:'ses1',ic:'1',n:'Primera sesión',d:'Guarda tu primera sesión.'},
 {id:'meta',ic:'✓',n:'Meta cumplida',d:'Llega a la meta de series efectivas en una sesión.'},
 {id:'rut1',ic:'R',n:'Rutina completa',d:'Termina todos los grupos de una rutina.'},
 {id:'ses10',ic:'10',n:'10 sesiones',d:'Guarda 10 sesiones.'},
 {id:'ses50',ic:'50',n:'50 sesiones',d:'Guarda 50 sesiones.'},
 {id:'ef100',ic:'100',n:'100 efectivas',d:'Acumula 100 series efectivas.'},
 {id:'pr1',ic:'★',n:'Primer récord',d:'Supera tu mejor 1RM estimado en un ejercicio.'},
 {id:'pr10',ic:'★10',n:'10 récords',d:'Consigue 10 récords personales.'},
 {id:'pr25',ic:'★25',n:'25 récords',d:'Consigue 25 récords personales.'},
 {id:'racha7',ic:'7',n:'Racha de 7',d:'7 días entrenados sin descansar más de 2 días seguidos.'},
 {id:'racha14',ic:'14',n:'Racha de 14',d:'14 días entrenados sin descansar más de 2 días seguidos.'},
 {id:'racha30',ic:'30',n:'Racha de 30',d:'30 días entrenados sin descansar más de 2 días seguidos.'},
 {id:'sem4',ic:'4×',n:'Mes en rango',d:'4 semanas seguidas con todos los grupos en su mínimo semanal.'},
 {id:'desc1',ic:'↓',n:'Descarga hecha',d:'Completa una semana de descarga de 7 días.'}];
const normMedVistas=o=>{const r={};if(esObj(o))MEDALLAS.forEach(m=>{const v=vFecha(o[m.id]);if(v)r[m.id]=v});return r};
let medVistas=leerJSON(MEDKEY,null);if(medVistas!=null)medVistas=normMedVistas(medVistas);
function medallasGanadas(){const H=hist.filter(h=>h&&h.start).slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)),g={};
  const pon=(id,f)=>{if(!g[id]&&f)g[id]=f};
  H.forEach((h,i)=>{if(i===0)pon('ses1',h.start);if(i===9)pon('ses10',h.start);if(i===49)pon('ses50',h.start)});
  pon('meta',(H.find(h=>h.meta>0&&(h.desc?(h.serC||0)>=h.meta:efH(h)>=h.meta-.05))||{}).start);
  pon('rut1',(H.find(h=>h.rut&&h.completa&&h.rut.pos>=h.rut.de-1)||{}).start);
  let nPr=0,acum=0;H.forEach(h=>{(h.sets||[]).forEach(r=>{if(!r.pr)return;nPr++;if(nPr===1)pon('pr1',h.start);if(nPr===10)pon('pr10',h.start);if(nPr===25)pon('pr25',h.start)});
    const a0=acum;acum+=efH(h);if(a0<100&&acum>=99.95)pon('ef100',h.start)});
  const dias=[...new Set(H.map(h=>diaK(Date.parse(h.start))))].sort();let run=0;
  dias.forEach((k,i)=>{run=i&&nDia(k)-nDia(dias[i-1])<=3?run+1:1;[7,14,30].forEach(n=>{if(run===n)pon('racha'+n,k+'T12:00:00')})});
  const sem={};H.forEach(h=>{if(!gDe(h))return;const l=lunes(Date.parse(h.start));sem[l]=h.start});   // por semana: fecha de la última sesión
  let seg=0,prev=null;Object.keys(sem).map(Number).sort((a,b)=>a-b).forEach(l=>{const v=volRango(l,l+7*864e5),ok=Object.keys(CAT).every(x=>(v[x]||0)>=semRango(x)[0]);
    seg=ok?(prev!=null&&Math.round((l-prev)/(7*864e5))===1&&seg?seg+1:1):0;prev=l;if(seg===4)pon('sem4',sem[l])});
  if(descarga.inicio&&descarga.fin&&Date.parse(descarga.fin)-Date.parse(descarga.inicio)>=6*864e5&&Date.now()>=Date.parse(descarga.fin))pon('desc1',descarga.fin);
  return g}
function revisarMedallas(){const g=medallasGanadas(),nuevas=Object.keys(g).filter(id=>!medVistas[id]);
  nuevas.forEach(id=>medVistas[id]=g[id]);if(nuevas.length)try{localStorage.setItem(MEDKEY,JSON.stringify(medVistas))}catch(e){}
  return nuevas.map(id=>MEDALLAS.find(m=>m.id===id)).filter(Boolean)}
if(!medVistas){medVistas={};revisarMedallas()}   // primera vez: lo ya ganado se marca sin anunciar
const fraseMed=md=>md.length?`Nueva medalla: ${md.map(m=>m.n).join(', ')}. `:'';
function celebrar(md,t){if(!md.length)return;const n=md.map(m=>m.n).join(' · ');
  if(S.pr>t){S.prK='¡Récord y medalla!';S.prTxt+=' · '+n}else{S.pr=t+6;S.prK='¡Medalla nueva!';S.prTxt=n;fanfarria()}}
function renderMedallas(){const g={...medallasGanadas(),...medVistas},n=MEDALLAS.filter(m=>g[m.id]).length;
  const f=x=>new Date(x).toLocaleDateString('es-DO',{day:'numeric',month:'short',year:'2-digit'});
  $('pMed').innerHTML=`<p class="hint">${n} de ${MEDALLAS.length} ganadas. Las grises dicen qué falta.</p><div class="meds">`+MEDALLAS.map(m=>`<div class="med${g[m.id]?'':' no'}"><span class="disco">${m.ic}</span><b>${m.n}</b><small>${g[m.id]?f(g[m.id]):m.d}</small></div>`).join('')+'</div>'}
/* ---------- medidas (cm) ---------- */
const MDKEY='reloj-anomalo-medidas',MEDIDAS=[['brazo','Brazo'],['pecho','Pecho'],['cintura','Cintura'],['muslo','Muslo']];
let medidas=normMedidas(leerJSON(MDKEY,[]),descLeer);
const guardarMedidas=()=>{medidas.sort((a,b)=>a.f.localeCompare(b.f));try{localStorage.setItem(MDKEY,JSON.stringify(medidas))}catch(e){}};
const fCorta=k=>new Date(k+'T12:00:00').toLocaleDateString('es-DO',{day:'numeric',month:'short'});
function spark(k,n){const p=medidas.filter(m=>m[k]>0);if(!p.length)return `<div class="mg"><span>${n}</span><span class="hint">sin datos</span><span></span></div>`;
  const ys=p.map(m=>m[k]),lo=Math.min(...ys),hi=Math.max(...ys),W=120,H=30,X=i=>p.length<2?W/2:4+(W-8)*i/(p.length-1),Y=v=>hi===lo?H/2:3+(H-6)*(1-(v-lo)/(hi-lo));
  const d=ys[ys.length-1]-ys[0],sg=d>0?'+':d<0?'−':'±';
  return `<div class="mg"><span>${n}</span><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--ven)" stroke-width="2" vector-effect="non-scaling-stroke" points="${ys.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}"/>${ys.map((v,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2" fill="var(--ven)"/>`).join('')}</svg>
    <span class="val">${num(ys[ys.length-1])} cm${p.length>1?` <small>${sg}${num(Math.abs(d))} desde ${fCorta(p[0].f)}</small>`:''}</span></div>`}
function renderMedidas(){const el=$('pMedidas');
  el.innerHTML=`<p class="hint">En centímetros, mejor en ayunas y siempre en el mismo punto. Deja vacío lo que no midas.</p>
    <div class="mform"><label>Fecha<input id="mdF" class="in" type="date" value="${diaK(Date.now())}" max="${diaK(Date.now())}"></label>
    ${MEDIDAS.map(([k,n])=>`<label>${n} (cm)<input id="md_${k}" class="in" inputmode="decimal" autocomplete="off" placeholder="—"></label>`).join('')}</div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button id="mdOk" type="button" class="btn2">Guardar medidas</button><span id="mdMsg" class="hint" aria-live="polite"></span></div>
    ${MEDIDAS.map(([k,n])=>spark(k,n)).join('')}
    ${medidas.length?`<div class="tbl"><table><thead><tr><th>Fecha</th>${MEDIDAS.map(x=>`<th>${x[1]}</th>`).join('')}<th></th></tr></thead><tbody>${medidas.slice(-6).reverse().map(m=>`<tr><td>${fCorta(m.f)}</td>${MEDIDAS.map(([k])=>`<td>${m[k]>0?num(m[k]):'—'}</td>`).join('')}<td><button type="button" class="lnk" data-mdx="${esc(m.f)}" aria-label="Quitar medidas del ${fCorta(m.f)}">quitar</button></td></tr>`).join('')}</tbody></table></div>`:''}`;
  $('mdOk').onclick=()=>{const f=$('mdF').value||diaK(Date.now()),e={};let n=0,mal=0;
    MEDIDAS.forEach(([k])=>{const s=$('md_'+k).value.trim();if(!s)return;const v=parseFloat(s.replace(',','.'));if(v>=10&&v<=250){e[k]=Math.round(v*10)/10;n++}else mal++});
    if(!n){$('mdMsg').textContent=mal?'Revisa los números: van en centímetros (10–250).':'Escribe al menos una medida.';return}
    const i=medidas.findIndex(m=>m.f===f);if(i>=0)medidas[i]={...medidas[i],...e};else medidas.push({f,...e});guardarMedidas();renderMedidas();$('mdMsg').textContent='Guardado ✓'};
  el.querySelectorAll('[data-mdx]').forEach(b=>b.onclick=()=>{medidas=medidas.filter(m=>m.f!==b.dataset.mdx);guardarMedidas();renderMedidas()})}
/* ---------- fotos de progreso: solo en este teléfono (IndexedDB); no van en el historial exportado, solo en la copia de seguridad completa ---------- */
const FDB='reloj-anomalo-fotos';let fdb=null,fotoURLs=[],fotoA=null,fotoB=null,fotoBorrar=null;
// (si el navegador no responde en 4 s —p. ej. algunos abren archivos locales sin IndexedDB— se avisa en vez de esperar para siempre)
function abrirFotos(){return fdb||(fdb=new Promise((ok,mal)=>{let listo=false;const no=e=>{if(listo)return;listo=true;fdb=null;mal(e)};
  setTimeout(()=>no(new Error('sin IndexedDB')),4000);
  try{const q=indexedDB.open(FDB,1);q.onupgradeneeded=()=>q.result.createObjectStore('fotos',{keyPath:'id',autoIncrement:true});
    q.onsuccess=()=>{if(listo)return;listo=true;ok(q.result)};q.onerror=()=>no(q.error)}catch(e){no(e)}}))}
const fotoTx=(modo,fn)=>abrirFotos().then(db=>new Promise((ok,mal)=>{const tx=db.transaction('fotos',modo),r=fn(tx.objectStore('fotos'));
  tx.oncomplete=()=>ok(r&&r.result);tx.onerror=()=>mal(tx.error)}));
// Reduce a ≤1080 px por lado y JPEG 0,8.
async function comprimir(file){const url=URL.createObjectURL(file);
  try{const img=await new Promise((ok,mal)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>mal(new Error('imagen'));i.src=url});
    const k=Math.min(1,1080/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.round(img.naturalWidth*k),h=Math.round(img.naturalHeight*k);
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
    return {blob:await new Promise(ok=>c.toBlob(ok,'image/jpeg',.8)),w,h}}finally{URL.revokeObjectURL(url)}}
async function agregarFoto(file,f){const r=await comprimir(file);if(!r.blob)throw new Error('canvas');
  await fotoTx('readwrite',st=>st.add({f:f||diaK(Date.now()),t:Date.now(),blob:r.blob,w:r.w,h:r.h}))}
async function renderFotos(){const el=$('pFotos');let fs=[];
  try{fs=await fotoTx('readonly',st=>st.getAll())||[]}catch(e){el.innerHTML='<p class="hint">Este navegador no deja guardar fotos aquí.</p>';return}
  fs=fs.filter(x=>esObj(x)&&Number.isInteger(x.id)&&vDia(x.f)&&x.blob instanceof Blob);
  fotoURLs.forEach(u=>URL.revokeObjectURL(u));fotoURLs=[];fs.sort((a,b)=>a.f.localeCompare(b.f)||a.id-b.id);
  const url=new Map(fs.map(x=>{const u=URL.createObjectURL(x.blob);fotoURLs.push(u);return [x.id,u]}));
  if(!fs.some(x=>x.id===fotoA))fotoA=fs.length?fs[0].id:null;if(!fs.some(x=>x.id===fotoB))fotoB=fs.length?fs[fs.length-1].id:null;
  const opt=sel=>fs.map(x=>`<option value="${esc(x.id)}"${x.id===sel?' selected':''}>${fCorta(x.f)} ${new Date(x.f+'T12:00:00').getFullYear()}</option>`).join('');
  const fig=id=>{const x=fs.find(y=>y.id===id);return x?`<figure><img src="${url.get(id)}" alt="Foto del ${fCorta(x.f)}"><figcaption>${fCorta(x.f)}</figcaption></figure>`:''};
  el.innerHTML=`<p class="hint">Las fotos se quedan solo en este teléfono: no se suben a ningún lado ni van en el historial exportado; solo en la copia de seguridad completa (Historial), si la haces.</p>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="btn2">Tomar o elegir foto<input id="fIn" type="file" accept="image/*" capture="environment" hidden></label>
    <input id="fF" class="in" type="date" value="${diaK(Date.now())}" max="${diaK(Date.now())}" aria-label="Fecha de la foto"></div><span id="fMsg" class="hint" aria-live="polite"></span>
    ${fs.length>=2?`<span class="lbl">Comparar</span><div class="fcmp"><select id="fA" aria-label="Foto de la izquierda">${opt(fotoA)}</select><select id="fB" aria-label="Foto de la derecha">${opt(fotoB)}</select></div><div class="fpar">${fig(fotoA)}${fig(fotoB)}</div>`:''}
    ${fs.length?`<span class="lbl">Todas (${fs.length})</span><div class="fgal">${fs.slice().reverse().map(x=>`<figure><img src="${url.get(x.id)}" alt="Foto del ${fCorta(x.f)}" loading="lazy"><figcaption>${fCorta(x.f)}<button type="button" data-fdel="${esc(x.id)}">${fotoBorrar===x.id?'¿Borrar?':'✕'}</button></figcaption></figure>`).join('')}</div>`
      :'<p class="hint">Aún no hay fotos. Tómalas con la misma luz, ropa y postura para comparar.</p>'}`;
  $('fIn').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;$('fMsg').textContent='Guardando…';
    try{await agregarFoto(f,$('fF').value);fotoB=null;await renderFotos();$('fMsg').textContent='Foto guardada en el teléfono ✓'}catch(err){$('fMsg').textContent='No se pudo guardar esa foto.'}};
  if($('fA')){$('fA').onchange=e=>{fotoA=+e.target.value;renderFotos()};$('fB').onchange=e=>{fotoB=+e.target.value;renderFotos()}}
  el.querySelectorAll('[data-fdel]').forEach(b=>b.onclick=async()=>{const id=+b.dataset.fdel;
    if(fotoBorrar!==id){fotoBorrar=id;b.textContent='¿Borrar?';return}fotoBorrar=null;await fotoTx('readwrite',st=>st.delete(id)).catch(()=>{});renderFotos()})}
/* ---------- resumen de la semana en imagen (1080×1350), con los colores del estilo activo ---------- */
// conPeso: el peso corporal solo va en la imagen si lo activas (por defecto no)
function datosComida(a,b,conPeso=!!CFG.resPeso){let C=null;try{C=JSON.parse(localStorage.getItem('comida-v1')||'null')}catch(e){}if(!C||typeof C!=='object')return null;
  const out={},logs=(Array.isArray(C.logs)?C.logs:[]).filter(l=>esObj(l)&&+l.t>=a&&+l.t<b);
  if(logs.length){const d={};logs.forEach(l=>{const k=diaK(+l.t);d[k]=(d[k]||0)+(vNum(l.p,0,1000)||0)});const ks=Object.keys(d);
    out.prot=ks.reduce((s,k)=>s+d[k],0)/ks.length;out.diasP=ks.length;const cf=esObj(C.cfg)?C.cfg:{};if(vNum(cf.peso,1,700)!=null)out.meta=Math.round(+cf.peso*(vNum(cf.factor,.5,4)||1.8))}
  if(conPeso&&esObj(C.pesos)){const ps=Object.entries(C.pesos).filter(([k,v])=>vDia(k)&&vNum(v,1,700)!=null).sort((x,y)=>x[0].localeCompare(y[0]));
    const ka=diaK(a),kb=diaK(b),en=ps.filter(([k])=>k>=ka&&k<kb),antes=ps.filter(([k])=>k<ka);
    if(en.length){const i=antes.length?antes[antes.length-1]:en[0],f=en[en.length-1];out.peso={ini:+i[1],fin:+f[1],fi:i[0],ff:f[0]}}}
  return out.prot!=null||out.peso?out:null}
async function resumenImagen(){const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const cs=getComputedStyle(document.documentElement),v=k=>cs.getPropertyValue('--'+k).trim();
  const C={bg:v('bg')||'#140d0f',fg:v('fg')||'#f2e7e9',muted:v('muted')||'#999',line:v('line')||'#333',soft:v('soft')||'#222',art:v('art')||'#f0435a',ven:v('ven')||'#7f9be2',cap:v('cap')||'#4fc99d',amb:v('amb')||'#c98a00'};
  const fD=v('disp')||'Impact,sans-serif',fB=v('body')||'system-ui,sans-serif',fM=v('mono')||'monospace';
  try{await Promise.all([`800 90px ${fD}`,`600 34px ${fB}`,`500 28px ${fM}`].map(f=>document.fonts.load(f)))}catch(e){}
  const a=lunes(Date.now()),b=a+7*864e5,w=semana(0),hs=hist.filter(h=>{const t=Date.parse(h.start);return t>=a&&t<b});
  const dias=new Set(hs.map(h=>diaK(Date.parse(h.start)))).size,tot=hs.reduce((s,h)=>s+efH(h),0);   // total real; las barras cuentan secundarios
  const txt=(s,X,Y,font,color,al='left')=>{x.font=font;x.fillStyle=color;x.textAlign=al;x.fillText(s,X,Y)};
  const rr=(X,Y,w2,h2,r,color)=>{x.fillStyle=color;x.beginPath();x.roundRect?x.roundRect(X,Y,w2,h2,r):x.rect(X,Y,w2,h2);x.fill()};
  x.fillStyle=C.bg;x.fillRect(0,0,W,H);x.fillStyle=C.art;x.fillRect(0,0,W,12);
  const M=72,fd=t=>new Date(t).toLocaleDateString('es-DO',{day:'numeric',month:'short'}).replace('.','');
  txt('RESUMEN DE LA SEMANA',M,104,`500 30px ${fM}`,C.muted);
  txt(`${fd(a)} – ${fd(b-864e5)} ${new Date(a).getFullYear()}`.toUpperCase(),M,196,`800 88px ${fD}`,C.fg);
  const st=[[hs.length,[hs.length===1?'sesión':'sesiones'],C.art],[dias,[dias===1?'día':'días','entrenados'],C.ven],[ef1(tot),['series','efectivas'],C.cap],[racha(),['días','de racha'],C.amb]];
  st.forEach(([n,l,c],i)=>{const X=M+i*((W-2*M)/4);txt(String(n),X,318,`800 104px ${fD}`,c);l.forEach((s2,j)=>txt(s2,X,354+j*28,`500 24px ${fM}`,C.muted))});
  const comida=datosComida(a,b),recs=[],sep=comida?30:40,tit=comida?50:58;   // con datos de Comida todo va más junto
  x.fillStyle=C.line;x.fillRect(M,414,W-2*M,2);
  let y=414+tit;txt('SERIES EFECTIVAS POR GRUPO',M,y,`500 26px ${fM}`,C.muted);y+=20;
  hs.forEach(h=>(h.sets||[]).forEach(r=>{if(r.pr&&r.kg>0)recs.push(r)}));
  const mejores=[...new Map(recs.sort((p,q)=>e1(q)-e1(p)).map(r=>[r.ej,r])).values()].slice(0,comida?2:4);
  const fila=comida?50:62,X0=M+230,X1=W-M-225;
  Object.keys(CAT).forEach(g=>{const val=w[g]||0,[lo,hi]=semRango(g),tope=hi*1.3,c=val<lo?C.amb:val<=hi?C.cap:C.art;y+=fila;
    txt(CAT[g].n,M,y,`600 34px ${fB}`,C.fg);rr(X0,y-24,X1-X0,24,12,C.soft);
    x.strokeStyle=C.muted;x.lineWidth=3;[lo,hi].forEach(q=>{const X=X0+(X1-X0)*q/tope;x.beginPath();x.moveTo(X,y-32);x.lineTo(X,y+8);x.stroke()});
    if(val>0)rr(X0,y-24,Math.max(24,(X1-X0)*Math.min(1,val/tope)),24,12,c);
    txt(`${ef1(val)} / ${lo}–${hi}`,W-M,y,`500 30px ${fM}`,val>0?C.fg:C.muted,'right')});
  y+=sep;x.fillStyle=C.line;x.fillRect(M,y,W-2*M,2);y+=tit;
  txt('RÉCORDS DE LA SEMANA',M,y,`500 26px ${fM}`,C.muted);
  if(!mejores.length){y+=46;txt('Sin récords nuevos esta semana: la constancia también cuenta.',M,y,`500 30px ${fB}`,C.muted)}
  mejores.forEach(r=>{y+=46;txt('★',M,y,`800 34px ${fD}`,C.amb);txt(r.ej.length>34?r.ej.slice(0,33)+'…':r.ej,M+44,y,`600 32px ${fB}`,C.fg);txt(`${num(aU(r.kg))} ${uTxt()} × ${r.reps}`,W-M,y,`500 30px ${fM}`,C.fg,'right')});
  if(comida){y+=sep;x.fillStyle=C.line;x.fillRect(M,y,W-2*M,2);y+=tit;txt('COMIDA',M,y,`500 26px ${fM}`,C.muted);
    if(comida.prot!=null){y+=48;const p=Math.round(comida.prot);txt('Proteína',M,y,`600 34px ${fB}`,C.fg);
      txt(comida.meta?`${p} g/día de ${comida.meta} g`:`${p} g/día`,W-M,y,`500 30px ${fM}`,C.fg,'right');
      if(comida.meta){y+=18;rr(M,y,W-2*M,16,8,C.soft);rr(M,y,Math.max(16,(W-2*M)*Math.min(1,p/comida.meta)),16,8,p>=comida.meta*.95?C.cap:C.amb);y+=8}
      y+=36;txt(`promedio de ${comida.diasP} ${comida.diasP===1?'día anotado':'días anotados'}`,M,y,`500 24px ${fM}`,C.muted)}
    if(comida.peso){const p=comida.peso,d=p.fin-p.ini;y+=48;txt('Peso corporal',M,y,`600 34px ${fB}`,C.fg);
      txt(p.fi===p.ff?`${num(p.fin)} kg`:`${num(p.ini)} → ${num(p.fin)} kg (${d>0?'+':d<0?'−':'±'}${num(Math.abs(d))})`,W-M,y,`500 30px ${fM}`,C.fg,'right')}}
  x.fillStyle=C.line;x.fillRect(M,H-82,W-2*M,2);
  txt('RELOJ ANÓMALO',W-M,H-34,`800 34px ${fD}`,C.art,'right');txt('efectivas = series cerca del fallo',M,H-36,`500 22px ${fM}`,C.muted);
  return cv}
$('resPeso').onclick=()=>{CFG.resPeso=!CFG.resPeso;guardarCfg()};
$('compartir').onclick=async()=>{$('compMsg').textContent='Preparando la imagen…';
  try{const cv=await resumenImagen(),blob=await new Promise(ok=>cv.toBlob(ok,'image/png')),p=$('resPrev');
    if(p.src)URL.revokeObjectURL(p.src);p.src=URL.createObjectURL(blob);p.hidden=false;
    await entregarBlob(`resumen-semana-${diaK(lunes(Date.now()))}.png`,blob,$('compMsg'))}catch(e){$('compMsg').textContent='No se pudo crear la imagen.'}};
// PC (pesos de Comida) = gráfica relativa al peso corporal: 1RM y peso de la serie divididos por el peso de ese día.
function dibujarGraf(k,PC){const [g,n]=k.split('|');let pts=previas(g,n).filter(p=>p.kg>0).reverse();
  if(PC){pts=pts.map(p=>{const bw=pesoDe(p.fecha,PC);return bw?{...p,mejor:p.mejor/bw,kg:+p.kg/bw,bw}:null}).filter(Boolean)}
  else pts=pts.map(p=>({...p,mejor:aU(p.mejor),kg:aU(+p.kg)}));   // en la unidad de la pantalla
  pts=pts.slice(-24);const fv=PC?num2f:num,uni=PC?' × peso corporal':' '+uTxt();
  if(!pts.length){$('graf').innerHTML=`<p class="hint">${PC?'Sin peso corporal para esas fechas.':'Sin datos de peso en la primera serie.'}</p>`;return}
  if(pts.length<2){$('graf').innerHTML=`<p class="hint">Una sola sesión: ${PC?`1RM ${num2f(pts[0].mejor)} × peso corporal`:`${pts[0].kg>0?num(pts[0].kg)+' '+uTxt():'corporal'} × ${esc(pts[0].reps)}`}. La línea aparece desde la segunda.</p>`;return}
  const W=340,H=180,L=34,R=8,T=10,B=24,ys=pts.flatMap(p=>[p.mejor,+p.kg]),q=PC?100:1,lo=Math.floor(Math.min(...ys)*.92*q)/q,hi=Math.ceil(Math.max(...ys)*1.05*q)/q;
  const X=i=>L+(W-L-R)*i/(pts.length-1),Y=v=>T+(H-T-B)*(1-(v-lo)/Math.max(PC?.01:1,hi-lo));
  const linea=(f,c)=>`<polyline fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p,i)=>X(i).toFixed(1)+','+Y(f(p)).toFixed(1)).join(' ')}"/>`
    +pts.map((p,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(f(p)).toFixed(1)}" r="3.2" fill="${c}"/>`).join('');
  let grid='';for(let j=0;j<=3;j++){const v=lo+(hi-lo)*j/3;grid+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-5}" y="${Y(v)+4}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">${PC?num2f(v):Math.round(v)}</text>`}
  const f=p=>new Date(p.fecha).toLocaleDateString('es-DO',{day:'2-digit',month:'2-digit'});
  const ult=pts[pts.length-1],pri=pts[0],dif=ult.mejor-pri.mejor;
  $('graf').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Progreso de ${esc(n)}">${grid}${linea(p=>p.mejor,'var(--art)')}${linea(p=>+p.kg,'var(--ven)')}
    <text x="${L}" y="${H-6}" font-size="10" fill="var(--muted)" font-family="var(--mono)">${f(pri)}</text><text x="${W-R}" y="${H-6}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">${f(ult)}</text></svg>
    <p class="hint">${pts.length} sesiones · 1RM estimado ${PC?`${num2f(pri.mejor)} → ${num2f(ult.mejor)}${uni}`:`${dif>=0?'+':''}${fv(dif)}${uni}`} (${dif>=0?'+':''}${Math.round(100*dif/pri.mejor)} %) desde ${f(pri)}.</p>`}
/* ---------- exportar / importar ---------- */
const hoy=()=>diaK(Date.now());   // fecha LOCAL (con toISOString, de 20:00 a 23:59 en RD salía la de mañana)
async function entregarBlob(nombre,blob,msg=$('ioMsg')){
  const f=new File([blob],nombre,{type:blob.type});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:nombre});msg.textContent='Listo: '+nombre;return true}}
  catch(e){if(e&&e.name==='AbortError'){msg.textContent='Cancelado.';return false}}
  const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=nombre;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  msg.textContent='Descargado: '+nombre;return true
}
async function entregar(nombre,texto,tipo){return entregarBlob(nombre,new Blob([texto],{type:tipo}))}
$('expJson').onclick=()=>{
  if(!hist.length){$('ioMsg').textContent='No hay sesiones que exportar.';return}
  entregar(`entrenamientos-${hoy()}.json`,JSON.stringify({app:'reloj-anomalo',v:1,exportado:new Date().toISOString(),sesiones:hist,medidas},null,1),'application/json');
};
$('expCsv').onclick=()=>{
  if(!hist.length){$('ioMsg').textContent='No hay sesiones que exportar.';return}
  const q=v=>{let t=String(v);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'};   // sin fórmulas de Excel
  const filas=[['fecha','grupo','sesion','serie_n','estacion','ejercicio','tipo','reps_o_segundos','kg','rir','congestion_P','descanso_s','efectiva','molestia','sueno_h','energia','nota_sesion'].join(',')];
  hist.slice().reverse().forEach(h=>(h.sets||[]).forEach((r,i)=>filas.push([q(new Date(h.start).toLocaleString('es-DO')),q(h.grupo),q(h.id),i+1,q(r.ex),q(r.ej||''),q(r.k),q(r.reps),r.kg!=null?r.kg:'',q(r.rir),(+r.P).toFixed(3),r.rest||0,efectiva(r).toFixed(2),q(r.mol||''),h.bien?h.bien.sueno:'',h.bien?h.bien.energia:'',q(h.nota||'')].join(','))));
  entregar(`series-${hoy()}.csv`,'﻿'+filas.join('\n'),'text/csv');
};
$('impJson').onclick=()=>$('impFile').click();
// Una sesión importada se acepta si tiene id, fecha válida y series en una lista (ver normSes: cada campo con su tipo y rango).
const sesValida=normSes;
const IMP_MAX=30e6,COPIA_MAX=150e6;   // tamaño máximo del archivo (caracteres): historial y copia completa con fotos
const malTxt=n=>n?` ${n} ${n===1?'dato no válido se descartó':'datos no válidos se descartaron'}.`:'';
$('impFile').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{
    if(f.size>IMP_MAX){$('ioMsg').textContent='Ese archivo es demasiado grande para ser un historial del Reloj anómalo.';return}
    const d=JSON.parse(await f.text()),ses=Array.isArray(d)?d:esObj(d)?d.sesiones:null;
    if(!Array.isArray(ses))throw new Error('formato');
    const ids=new Set(hist.map(h=>h.id));let n=0,nm=0,mal=Math.max(0,ses.length-SES_MAX);
    ses.slice(0,SES_MAX).forEach(s=>{const v=sesValida(s);if(!v){mal++;return}if(!ids.has(v.id)){hist.push(v);ids.add(v.id);n++}});
    hist.sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));
    const okLS=escribirHist();
    // medidas: solo agrega las fechas que no tienes
    if(esObj(d)&&Array.isArray(d.medidas)){const fs=new Set(medidas.map(m=>m.f)),c={mal:0};normMedidas(d.medidas,c).forEach(m=>{if(!fs.has(m.f)){medidas.push(m);fs.add(m.f);nm++}});mal+=c.mal+Math.max(0,d.medidas.length-MED_MAX);if(nm)guardarMedidas()}
    revisarMedallas();pintarHist();$('ioMsg').textContent=(n?`Importadas ${n} sesiones nuevas.`:'Ninguna sesión nueva: ya tenías todas.')+(nm?` Y ${nm} fechas de medidas.`:'')+malTxt(mal)
      +(okLS?'':' Ojo: el teléfono no tiene espacio para guardarlas; mira el aviso arriba y haz una copia de seguridad.');
  }catch(err){$('ioMsg').textContent='Ese archivo no es un historial del Reloj anómalo.'}
};

/* ---------- copia de seguridad completa: un solo JSON con todo, fotos incluidas (data URL JPEG) ---------- */
const blobAData=b=>new Promise((ok,mal)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>mal(r.error);r.readAsDataURL(b)});
// solo fotos JPEG o PNG en base64 y de tamaño razonable
const FOTO_RE=/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/;
function dataABlob(u){const m=typeof u==='string'&&u.length<=FOTO_MAX?FOTO_RE.exec(u):null;if(!m)throw new Error('foto');const bin=atob(m[2]),a=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m[1]})}
async function copiaJSON(){let fs=null;try{fs=await fotoTx('readonly',st=>st.getAll())||[]}catch(e){}
  const fotos=[];for(const x of fs||[]){let b=x.blob;if(b&&b.type!=='image/jpeg')try{b=(await comprimir(b)).blob}catch(e){}
    if(b)fotos.push({f:x.f,t:x.t,w:x.w,h:x.h,data:await blobAData(b)})}
  return {app:'reloj-anomalo',tipo:'copia-completa',v:2,exportado:new Date().toISOString(),sesiones:hist,metas,ajustes:CFG,ejercicios:misEj,
    rutina:{i:rutI,mia:miaLista},descarga,medidas,bienestar:leerBien(),medallas:medVistas||{},calibracion:calibC,bloque,estilo,fotos,...(fs?{}:{sinFotos:true})}}
async function hacerCopia(msg=$('copiaMsg')){msg.textContent='Preparando la copia…';
  try{const d=await copiaJSON(),nombre=`reloj-anomalo-copia-${hoy()}.json`;
    const ok=await entregarBlob(nombre,new Blob([JSON.stringify(d)],{type:'application/json'}),msg);
    if(ok){copiaC={fecha:new Date().toISOString()};guardarObj(COPKEY,copiaC);msg.textContent+=` · ${d.sesiones.length} sesiones y ${d.fotos.length} fotos${d.sinFotos?' (este navegador no dejó leer las fotos)':''}`;renderCopiaAv()}}
  catch(e){msg.textContent='No se pudo crear la copia.'}}
$('copiaBtn').onclick=()=>hacerCopia();
// Restaurar fusiona: sesiones por id, medidas y «cómo llegas» por fecha, medallas por id, fotos por fecha+hora.
// Metas, ajustes, ejercicios, rutina, descarga, calibración, bloque y estilo solo se ponen si este teléfono no los tiene.
async function restaurarCopia(d){if(!esObj(d)||!Array.isArray(d.sesiones))throw new Error('formato');
  const r={ses:0,med:0,bien:0,fotos:0,mal:0,puestos:[],mant:[]},ids=new Set(hist.map(h=>h.id));
  r.mal+=Math.max(0,d.sesiones.length-SES_MAX);
  d.sesiones.slice(0,SES_MAX).forEach(s=>{const v=sesValida(s);if(!v){r.mal++;return}if(!ids.has(v.id)){hist.push(v);ids.add(v.id);r.ses++}});
  hist.sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));r.sinEspacio=!escribirHist();
  if(Array.isArray(d.medidas)){const fs=new Set(medidas.map(m=>m.f)),c={mal:0};normMedidas(d.medidas,c).forEach(m=>{if(!fs.has(m.f)){medidas.push(m);fs.add(m.f);r.med++}});r.mal+=c.mal+Math.max(0,d.medidas.length-MED_MAX);if(r.med)guardarMedidas()}
  if(esObj(d.bienestar)){const o=leerBien(),c={mal:0},nb=normBienMapa(d.bienestar,c);r.mal+=c.mal;
    for(const k in nb){if(!o[k])r.bien++;o[k]={...nb[k],...(o[k]||{})}}try{localStorage.setItem(BKEY,JSON.stringify(o))}catch(e){}}
  if(esObj(d.medallas)){const nm=normMedVistas(d.medallas);r.mal+=Object.keys(d.medallas).length-Object.keys(nm).length;
    medVistas={...nm,...(medVistas||{})};try{localStorage.setItem(MEDKEY,JSON.stringify(medVistas))}catch(e){}}
  // cada clave se valida con su normalizador; lo que no tiene ningún dato válido no se pone
  const sol=(k,v,n,norm)=>{if(v==null)return;if(!esObj(v)){r.mal++;return}const x=norm(v);if(!Object.keys(x).length){if(Object.keys(v).length)r.mal++;return}
    if(localStorage.getItem(k)!=null){r.mant.push(n);return}try{localStorage.setItem(k,JSON.stringify(x));r.puestos.push(n)}catch(e){}};
  sol(MKEY,d.metas,'metas',normMetas);sol(AKEY,d.ajustes,'ajustes',normCfg);sol(EJKEY,d.ejercicios,'ejercicios',normMisEj);sol(RKEY,d.rutina,'rutina',normRut);
  sol(DKEY,d.descarga,'descarga',normDescarga);sol(CKEY,d.calibracion,'calibración',normCalib);sol(BQKEY,d.bloque,'bloque',normBloque);
  if(d.estilo!=null&&!(typeof d.estilo==='string'&&tiene(ESTILOS,d.estilo)))r.mal++;
  else if(d.estilo!=null&&localStorage.getItem(EKEY)==null){try{localStorage.setItem(EKEY,d.estilo)}catch(e){}aplicarEstilo(d.estilo);r.puestos.push('estilo')}
  recargar();
  if(Array.isArray(d.fotos)&&d.fotos.length){const ya=await fotoTx('readonly',st=>st.getAll())||[],k=new Set(ya.map(x=>x.f+'|'+x.t));
    r.mal+=Math.max(0,d.fotos.length-FOTOS_MAX);
    for(const x of d.fotos.slice(0,FOTOS_MAX)){
      // foto válida: fecha AAAA-MM-DD (o ninguna), hora numérica, data URL JPEG/PNG en base64 de tamaño acotado
      const f=esObj(x)&&x.f!=null?vDia(x.f):diaK(Date.now()),t=esObj(x)&&x.t!=null?vNum(x.t,0,1e14):Date.now();
      let blob=null;try{blob=esObj(x)&&f&&t!=null?dataABlob(x.data):null}catch(e){}
      if(!blob){r.mal++;continue}if(k.has(f+'|'+t))continue;
      await fotoTx('readwrite',st=>st.add({f,t,blob,w:vEnt(x.w,1,20000)??undefined,h:vEnt(x.h,1,20000)??undefined}));k.add(f+'|'+t);r.fotos++}}
  return r}
// vuelve a leer lo guardado en el teléfono (después de restaurar)
function recargar(){metas={...META_DEF,...normMetas(leerJSON(MKEY,{}))};
  Object.assign(CFG,normCfg(leerJSON(AKEY,{})));
  misEj=normMisEj(leerJSON(EJKEY,{}));aplicarEjercicios();
  {const x=normRut(leerJSON(RKEY,{}));rutI=x.i;miaLista=x.mia}
  descarga=leerObj(DKEY,normDescarga);calibC=leerObj(CKEY,normCalib);bloque=leerObj(BQKEY,normBloque);
  if(S.st==='idle'){rutPos=0;rutEf=0;if(enRutina())grupo=rutLista()[0];S=fresh()}lastPlan='';renderGrupos();renderCfg();pintarHist();revisarMedallas();render()}
$('restBtn').onclick=()=>{if(enCurso()){$('copiaMsg').textContent='Termina la sesión en curso antes de restaurar.';return}$('restFile').click()};
$('restFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const msg=$('copiaMsg');
  if(f.size>COPIA_MAX){msg.textContent='Ese archivo es demasiado grande para ser una copia del Reloj anómalo.';return}msg.textContent='Restaurando…';
  let d;try{d=JSON.parse(await f.text())}catch(err){msg.textContent='Ese archivo no es una copia del Reloj anómalo.';return}
  try{const r=await restaurarCopia(d);
    msg.textContent=`Restaurado: ${r.ses} sesiones nuevas, ${r.med} fechas de medidas, ${r.bien} días de «cómo llegas» y ${r.fotos} fotos.`
      +(r.puestos.length?` Se pusieron: ${r.puestos.join(', ')}.`:'')+(r.mant.length?` Se mantuvieron los de este teléfono: ${r.mant.join(', ')}.`:'')
      +malTxt(r.mal)+(r.sinEspacio?' Ojo: el teléfono no tiene espacio para guardar todas las sesiones; mira el aviso del reloj.':'');
    if(tab==='progreso')renderProg()}
  catch(err){msg.textContent=err&&err.message==='formato'?'Ese archivo no es una copia del Reloj anómalo.':'Se restauró a medias: '+(err&&err.message||err)}};

/* ---------- sesión en curso: se guarda en cada cambio de estado (no en cada tic) para retomarla si Android cierra la app ---------- */
const ENKEY='reloj-anomalo-en-curso',RETOMAR_H=3,ESTADOS_EC=['work','cal','rest','shift','trans','report'];
let retomar=null,firmaEC='';
function guardarEnCurso(){if(retomar)return;   // mientras se ofrece retomar la anterior, no se toca
  if(!enCurso()){if(firmaEC){firmaEC='';try{localStorage.removeItem(ENKEY)}catch(e){}}return}
  const f=[S.id,S.st,S.sec,S.phase,S.sets.length,S.calI,S.ronda,S.levyN,grupo,rutPos,S.kg,S.hechas,S.molR,S.nIn,pila.length,S.cal?S.cal.length:-1].join('|');
  if(f===firmaEC)return;firmaEC=f;
  try{localStorage.setItem(ENKEY,JSON.stringify({t:Date.now(),S,grupo,rutI,miaLista,rutPos,rutEf,pila}))}catch(e){}}
/* Lo guardado se valida campo por campo contra el estado inicial (fresh): mismos tipos, números finitos, textos acotados, series
   con normSet, y la pila de «deshacer» igual. Si algo esencial no encaja, no se ofrece retomar. */
const FASES=['act','myo','ext','hold','vac'];
function normS(x){if(!esObj(x))return null;const f=fresh(),o={};
  for(const k in f){const d=f[k],v=x[k];if(v===undefined)continue;
    if(typeof d==='number'){const n=vNum(v,-1e13,1e13);if(n!=null)o[k]=n}
    else if(typeof d==='boolean')o[k]=v===true;
    else if(typeof d==='string'){const t=vTxt(v,300);if(t!=null)o[k]=t}}
  o.id=vTxt(x.id,80);o.start=vFecha(x.start);o.kg=x.kg==null?null:vNum(x.kg,0,1000);
  if(!o.id||!o.start||!Array.isArray(x.sets)||!FASES.includes(o.phase??'act'))return null;
  o.sets=vLista(x.sets,SETS_MAX,normSet);o.metaE=vLista(x.metaE,EST_MAX,v=>vNum(v,0,100)??0);
  const cal=vLista(x.cal,5,c=>esObj(c)&&vNum(c.kg,0,1000)!=null&&vNum(c.reps,0,100)!=null?{kg:+c.kg,reps:+c.reps,f:vNum(c.f,0,1)??.5}:null);o.cal=cal.length?cal:null;
  const p=esObj(x.sug)&&esObj(x.sug.prev)?normSet(x.sug.prev):null;
  o.sug=p?{kg:vNum(x.sug.kg,0,1000)??0,txt:vTxt(x.sug.txt)??'',cambio:x.sug.cambio===true,prev:{...p,mejor:vNum(x.sug.prev.mejor,0,1e5)??0,fecha:vFecha(x.sug.prev.fecha)}}:null;
  o.molR=x.molR==null?null:vTxt(x.molR,40);o.bien=x.bien==null?null:normBien1(x.bien);o.Cpre=x.Cpre==null?null:vNum(x.Cpre,0,10);
  return o}
function normEnCurso(o){if(!esObj(o)||!esG(o.grupo))return null;const t=vNum(o.t,1,1e14),S1=normS(o.S);if(t==null||!S1)return null;
  const pila=vLista(o.pila,PILA_MAX,p=>{if(!esObj(p)||!esG(p.grupo))return null;const S2=normS(p.S);if(!S2)return null;const ev=esObj(p.ev)?p.ev:{},e={};
    for(const [k,hi] of [['R',1000],['rir',10],['hold',1e5]]){const v=vNum(ev[k],0,hi);if(v!=null)e[k]=v}
    return {S:S2,grupo:p.grupo,rutPos:vEnt(p.rutPos,0,20)??0,rutEf:vNum(p.rutEf,0,1e4)??0,med:normMedVistas(p.med),ev:e}});
  return {t,S:S1,grupo:o.grupo,rutI:vEnt(o.rutI,0,RUTINAS.length-1)??0,miaLista:vLista(o.miaLista,10,g=>esG(g)?g:null),
    rutPos:vEnt(o.rutPos,0,20)??0,rutEf:vNum(o.rutEf,0,1e4)??0,pila}}
function leerEnCurso(){const o=normEnCurso(leerJSON(ENKEY,null));
  const ok=o&&Date.now()-o.t<RETOMAR_H*36e5&&ESTADOS_EC.includes(o.S.st)&&CAT[o.grupo].e[o.S.sec];
  if(!ok){try{localStorage.removeItem(ENKEY)}catch(e){}return null}return o}
const durTxt=ms=>{const m=Math.max(0,Math.round(ms/6e4));return m<60?`${m} min`:`${Math.floor(m/60)} h ${m%60} min`};
function renderRetomar(){const el=$('retomarAv'),v=!!retomar&&S.st==='idle'&&tab==='reloj';el.hidden=!v;if(!v)return;const o=retomar,x=o.S,n=sinCal(x.sets).length;
  const ini=Date.parse(x.start),hh=isNaN(ini)?'':new Date(ini).toLocaleTimeString('es-DO',{hour:'numeric',minute:'2-digit'});
  const h=`<span><b>Tienes una sesión sin terminar</b>: ${CAT[o.grupo].n}${(o.rutPos||0)>0||(RUTINAS[o.rutI]||{}).g?' (rutina)':''}${hh?`, empezó a las ${hh} (hace ${durTxt(Date.now()-ini)})`:''}; la dejaste hace ${durTxt(Date.now()-o.t)} · ${n} ${n===1?'serie':'series'} · ${x.desc?serDe(x.sets)+' de '+esc(x.meta)+' series completas':ef1(x.ef||0)+' de '+esc(x.meta)+' efectivas'}.</span>
    <div class="tog"><button type="button" class="btn2" data-ret="si" style="border:2px solid var(--cap);color:var(--cap)">Retomar sesión</button><button type="button" class="btn2" data-ret="no">Descartar</button></div>`;
  if(el.innerHTML!==h)el.innerHTML=h}
function descartarRetomar(){retomar=null;firmaEC='';try{localStorage.removeItem(ENKEY)}catch(e){}}
function retomarSesion(){const o=retomar;retomar=null;if(!o)return;
  S={...fresh(),...o.S};grupo=o.grupo;rutI=o.rutI;miaLista=o.miaLista;
  rutPos=o.rutPos;rutEf=o.rutEf;pila=o.pila;   // ya validados en normEnCursorirPrev=null;nuevaConf=0;
  const t=now();
  if(S.st==='work'){if(S.phase==='hold'||S.phase==='vac')S.t0=t;   // la isometría o el vacío vuelven a empezar
    else Object.assign(S,{st:'report',workDur:Math.min(60,Math.max(5,t-S.t0)),hechas:S.phase==='act'?est().d:S.target,molR:null});S.last=t}   // la serie seguramente la terminaste: repórtala
  else if(S.st==='cal'){S.t0=t;S.last=t}
  else if(['rest','shift','trans'].includes(S.st))S.restDur=Math.max(S.restDur,t-S.t0+10);   // si el descanso ya pasó, 10 s para volver (P, C y «bajo congestión» siguen con el tiempo real)
  S.tempoHasta=0;S.lastSec=-1;firmaEC='';activarAudio();$('save').textContent=hist.some(h=>h.id===S.id)?'Guardado ✓':'Sin guardar aún';
  lastPlan='';lastG=null;renderGrupos();render();decir('Sesión retomada')}
$('retomarAv').onclick=e=>{const b=e.target.closest('[data-ret]');if(!b)return;if(b.dataset.ret==='si')retomarSesion();else{descartarRetomar();render()}};
/* ---------- versión nueva: se recarga sola solo sin sesión, sin el resumen final a la vista y sin estar escribiendo ---------- */
let recargaPend=false;
function intentaRecarga(oculta){if(!recargaPend)return;const a=document.activeElement,escribe=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  if(S.st==='idle'&&!retomar&&(oculta||!escribe))location.reload()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')intentaRecarga(true)});
/* ---------- copia local para usar sin internet (solo cuando se sirve por https) ---------- */
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  const habia=!!navigator.serviceWorker.controller;
  // si llega una versión nueva se recarga sola, pero solo cuando no estorba (ver intentaRecarga)
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(habia){recargaPend=true;intentaRecarga()}});
  navigator.serviceWorker.register('sw.js').then(r=>{document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')r.update().catch(()=>{})})}).catch(()=>{});
}

if(enRutina())grupo=rutLista()[0];retomar=leerEnCurso();renderHist();renderGrupos();renderCfg();render();if(hist.length)pedirPersist();else renderAlmacen();
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{vozEs=null};
