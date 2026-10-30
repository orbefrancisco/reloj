// v40 · PROGRAMA «HIPERTROFIA INTENSIVA — 28 DÍAS» (reglas y decisiones en PROGRAMA.md).
// Plan de cuatro semanas con calendario fijo (24 sesiones y 4 miércoles de descanso), compromiso de 28 días que bloquea el resto de
// entrenamientos, modo entrenamiento con series medidas una a una, abandono deliberado, salida por seguridad inmediata, reprogramación
// sin duplicar, progresión doble por ejercicio e informe final.
// Se carga al final (después de rendimiento.js) y usa reloj.js: hist, CAT, MUS, musculos, plausDe, restQDe, fisProgresa, efDe, repsDe,
// cambiaKg, redondeaKg, planCal, e1, rirN, kgTxt, aU, deU, uTxt, num, fmt, esc, vTxt, vNum, vEnt, vDia, vFecha, esObj, guardarObj, leerJSON…
// TODAS las reglas (bloqueo, disponibilidad, duplicados, tiempos, abandono, seguridad, reprogramación, cancelación) se comprueban aquí,
// en la capa de estado (funciones pg* que devuelven {ok} o {ok:false, err, txt}). La interfaz solo las llama y pinta el resultado:
// un botón deshabilitado nunca es la única barrera.
'use strict';
const PG_KEY='reloj-anomalo-programa',PG_NOMBRE='Hipertrofia intensiva — 28 días',PG_TZ='America/Santo_Domingo',PG_TZ_OFF=-4*36e5,PG_D=864e5;
const PG_FRASE_AB='ABANDONAR ENTRENAMIENTO',PG_FRASE_CAN='CANCELAR PROGRAMA';
// sostener 15 s; rebote entre toques; «completado parcialmente» desde la mitad de las series; «olvidé tocar al empezar» como mucho 2 veces
// por sesión; una sesión sin tocar en 6 h se puede cerrar sin el procedimiento; ≥ 20 s por serie de media en toda la sesión; salto de hora > 1 min
const PG_HOLD=15000,PG_REBOTE=900,PG_PARCIAL=.5,PG_OLV_MAX=2,PG_OLVIDADA_H=6,PG_SEG_MIN=20,PG_SALTO=6e4,PG_ARCH_MAX=20,PG_LOG_MAX=300;

/* ---------- ejercicios y plantillas ----------
   t: c = compuesto (descanso largo, sin fallo técnico), a = aislado. rest: descanso entre series (s). cp: con el propio cuerpo.
   al: el MISMO ejercicio con otro nombre en tu historial o en «Mis cargas» (solo equivalentes exactos): sirve para proponer una carga
   inicial etiquetada como estimada, nunca para inventar rendimiento. */
const PG_EJ={
 jalon_medio:{n:'Jalón al pecho, agarre medio',s:'Jalón',g:'espalda',t:'c',rest:120,al:['Jalón al pecho'],tec:'Pecho alto y hombros lejos de las orejas; tira con los codos hacia las costillas; 2–3 s de subida controlada.'},
 remo_apoyado:{n:'Remo con pecho apoyado',s:'Remo apoyado',g:'espalda',t:'c',rest:120,al:[],tec:'Pecho pegado al apoyo todo el recorrido; tira con los codos y pausa 1 s atrás sin despegar el pecho.'},
 jalon_uni:{n:'Jalón unilateral',s:'Jalón 1 brazo',g:'espalda',t:'a',rest:90,al:[],tec:'Estira el dorsal arriba y lleva el codo hacia la cadera sin girar el torso. Anota el peso y las reps de un lado.'},
 curl_incl:{n:'Curl inclinado de bíceps',s:'Curl inclinado',g:'biceps',t:'a',rest:90,al:['Curl inclinado con mancuernas'],tec:'Banco a 45–60°, codos detrás del torso; sin balanceo; 3 s de bajada. Peso de una mancuerna.'},
 curl_mart:{n:'Curl martillo',s:'Martillo',g:'biceps',t:'a',rest:75,al:['Curl martillo'],tec:'Agarre neutro, codos quietos junto al cuerpo; sube sin impulso.'},
 press_incl_smith:{n:'Press inclinado en Smith',s:'Inclinado Smith',g:'pecho',t:'c',rest:150,al:[],tec:'Banco a 30°; baja la barra al pecho alto en 2–3 s, sin rebote; escápulas juntas y abajo.'},
 press_maq:{n:'Press horizontal en máquina',s:'Press máquina',g:'pecho',t:'c',rest:120,al:['Press en máquina'],tec:'Escápulas atrás y abajo; recorrido completo sin golpear los codos al estirar.'},
 apert_baja:{n:'Aperturas de polea de abajo hacia arriba',s:'Aperturas bajas',g:'pecho',t:'a',rest:75,al:[],tec:'Poleas abajo; sube en arco hasta la altura de la clavícula con los codos suaves; aprieta arriba.'},
 lat:{n:'Elevaciones laterales',s:'Laterales',g:'hombros',t:'a',rest:60,al:['Elevaciones laterales'],tec:'Sin impulso; sube hasta la altura del hombro con el codo un poco delante; 2 s de bajada.'},
 pd_inv:{n:'Pec deck inverso',s:'Pec deck inv.',g:'hombros',t:'a',rest:60,al:[],tec:'Brazos casi rectos a la altura del hombro; abre con los codos sin encoger los hombros.'},
 tri_cab:{n:'Extensión de tríceps sobre la cabeza',s:'Tríceps cabeza',g:'triceps',t:'a',rest:75,al:['Extensión sobre la cabeza','Extensión sobre la cabeza en polea'],tec:'Codos hacia arriba y quietos; baja hasta estirar el tríceps; 2–3 s de bajada.'},
 tri_cuerda:{n:'Tríceps con cuerda',s:'Cuerda',g:'triceps',t:'a',rest:60,al:['Pushdown con cuerda'],tec:'Codos pegados al cuerpo; extiende del todo y abre la cuerda al final.'},
 hack:{n:'Sentadilla hack o Smith',s:'Hack/Smith',g:'piernas',t:'c',rest:150,al:[],tec:'Profundidad que controles con la espalda apoyada; 2–3 s abajo, sin rebote; sin bloquear arriba.'},
 prensa:{n:'Prensa de piernas',s:'Prensa',g:'piernas',t:'c',rest:120,al:['Prensa'],tec:'Baja hasta justo antes de que la pelvis se despegue; sin bloquear las rodillas arriba.'},
 ext_cuad:{n:'Extensión de cuádriceps',s:'Extensión',g:'piernas',t:'a',rest:75,al:['Extensión de cuádriceps'],tec:'Pausa de 1 s arriba con la rodilla estirada; baja controlado.'},
 fem_sent:{n:'Curl femoral sentado',s:'Femoral sentado',g:'piernas',t:'a',rest:90,al:['Curl femoral sentado'],tec:'Cadera pegada al respaldo; flexiona del todo y baja en 2–3 s.'},
 pant_pie:{n:'Pantorrillas de pie',s:'Pantorrilla pie',g:'piernas',t:'a',rest:60,al:['Elevación de talones'],tec:'Pausa de 1–2 s abajo en estiramiento; sube del todo; sin rebote.'},
 abs_polea:{n:'Abdominales en polea',s:'Abs polea',g:'abdominales',t:'a',rest:60,al:['Crunch en polea'],tec:'Enrolla la columna llevando las costillas a la pelvis; la cadera no se mueve; exhala al cerrar.'},
 remo_horiz:{n:'Remo horizontal con pecho apoyado',s:'Remo horizontal',g:'espalda',t:'c',rest:120,al:[],tec:'Pecho apoyado; codos a unos 45°; pausa atrás apretando la espalda media.'},
 jalon_neutro:{n:'Jalón neutro',s:'Jalón neutro',g:'espalda',t:'c',rest:120,al:['Jalón con agarre neutro'],tec:'Agarre neutro; codos hacia abajo y atrás; estira del todo arriba.'},
 remo_polea:{n:'Remo sentado en polea',s:'Remo polea',g:'espalda',t:'c',rest:90,al:['Remo en polea sentado'],tec:'Torso casi quieto; tira hacia el ombligo; estira la espalda al volver sin perder la postura.'},
 curl_pred:{n:'Curl predicador',s:'Predicador',g:'biceps',t:'a',rest:75,al:['Curl predicador'],tec:'Axila pegada al apoyo; baja casi hasta estirar, sin rebote; 2 s de bajada.'},
 curl_polea:{n:'Curl en polea',s:'Curl polea',g:'biceps',t:'a',rest:60,al:['Curl en polea'],tec:'Codos quietos; aprieta arriba; tensión constante.'},
 press_incl_manc:{n:'Press inclinado con mancuernas',s:'Inclinado manc.',g:'pecho',t:'c',rest:120,al:['Press inclinado con mancuernas'],tec:'Banco a 30°; baja a los lados del pecho alto en 2–3 s; sin chocar arriba. Peso de una mancuerna.'},
 apert_polea:{n:'Aperturas en polea',s:'Aperturas',g:'pecho',t:'a',rest:75,al:['Aperturas en polea'],tec:'Codos suaves y fijos; abre hasta estirar el pecho; cierra apretando.'},
 lat_polea:{n:'Elevaciones laterales en polea',s:'Laterales polea',g:'hombros',t:'a',rest:60,al:['Elevaciones laterales en polea'],tec:'Polea baja; sube hasta la altura del hombro sin impulso; un brazo cada vez (anota las reps de un lado).'},
 press_hombro:{n:'Press de hombros en máquina',s:'Press hombro',g:'hombros',t:'c',rest:120,al:['Press de hombro en máquina'],tec:'Espalda apoyada; baja hasta la altura de las orejas; no bloquees los codos arriba.'},
 tri_cuerda_ext:{n:'Extensión de tríceps con cuerda',s:'Tríceps cuerda',g:'triceps',t:'a',rest:60,al:['Pushdown con cuerda'],tec:'Codos pegados al cuerpo; extiende del todo y abre la cuerda al final.'},
 rumano:{n:'Peso muerto rumano',s:'Rumano',g:'piernas',t:'c',rest:150,al:['Peso muerto rumano'],tec:'Cadera atrás con la espalda neutra; baja hasta sentir el femoral sin redondear; 2–3 s abajo.'},
 fem_acost:{n:'Curl femoral acostado',s:'Femoral acostado',g:'piernas',t:'a',rest:90,al:[],tec:'Cadera pegada al banco; flexiona del todo; 2–3 s de bajada.'},
 smith_sent:{n:'Sentadilla Smith',s:'Sentadilla Smith',g:'piernas',t:'c',rest:120,al:[],tec:'Pies un poco adelantados; baja con control hasta la profundidad que mantengas con la espalda neutra.'},
 bulgara:{n:'Sentadilla búlgara',s:'Búlgara',g:'piernas',t:'c',rest:90,al:['Zancada búlgara'],tec:'Pie trasero apoyado; torso algo inclinado; anota las reps de UNA pierna (haz las dos).'},
 pant_sent:{n:'Pantorrillas sentado',s:'Pantorrilla sent.',g:'piernas',t:'a',rest:60,al:['Gemelo sentado'],tec:'Pausa abajo en estiramiento; sube del todo.'},
 elev_piernas:{n:'Elevaciones de piernas',s:'Elev. piernas',g:'abdominales',t:'a',rest:60,al:[],cp:true,tec:'Retroversión de la pelvis al subir; sin balanceo; baja controlado. Peso corporal: deja la carga vacía.'}};
// plantillas: [ejercicio, series (volumen completo), reps mínimas, reps máximas]. foco: el grupo principal (reprogramación compatible)
const PG_PLANT={
 EA:{n:'Espalda A + bíceps',foco:'espalda',ej:[['jalon_medio',3,8,12],['remo_apoyado',3,8,12],['jalon_uni',2,10,15],['curl_incl',3,8,12],['curl_mart',2,10,15]]},
 PA:{n:'Pecho A + hombros + tríceps',foco:'pecho',ej:[['press_incl_smith',3,6,10],['press_maq',3,8,12],['apert_baja',2,12,15],['lat',5,12,20],['pd_inv',2,12,20],['tri_cab',3,10,15],['tri_cuerda',2,10,15]]},
 LA:{n:'Piernas A · prioridad cuádriceps',foco:'piernas',ej:[['hack',3,6,10],['prensa',3,10,15],['ext_cuad',2,12,20],['fem_sent',3,8,12],['pant_pie',3,8,15],['abs_polea',2,10,15]]},
 EB:{n:'Espalda B + bíceps',foco:'espalda',ej:[['remo_horiz',3,8,12],['jalon_neutro',3,8,12],['remo_polea',2,10,15],['curl_pred',3,8,12],['curl_polea',2,10,15]]},
 PB:{n:'Pecho B + hombros + tríceps',foco:'pecho',ej:[['press_incl_manc',3,8,12],['press_maq',2,8,12],['apert_polea',2,12,15],['lat_polea',5,12,20],['pd_inv',2,12,20],['press_hombro',2,8,12],['tri_cuerda_ext',3,10,15],['tri_cab',2,10,15]]},
 LB:{n:'Piernas B · prioridad femorales y glúteos',foco:'piernas',ej:[['rumano',3,6,10],['fem_acost',3,10,15],['smith_sent',3,8,12],['bulgara',2,10,12],['pant_sent',3,12,20],['elev_piernas',2,12,20]]}};
const PG_SEMANA=['EA','PA',null,'LA','EB','PB','LB'];   // lunes … domingo; el miércoles, descanso
const PG_DOW=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const PG_SEM_NOTA={1:'Semana 1 · adaptación y calibración: ~75–80 % del volumen y 2–3 en reserva. Busca la carga y la técnica: lo que anotes será la referencia.',
 2:'Semana 2 · volumen completo: todas las series, reserva habitual 1–3. Progresa cuando la ejecución lo permita.',
 3:'Semana 3 · sobrecarga progresiva: el mismo volumen. Sube carga o repeticiones solo donde se cumplan los criterios, no todo a la vez.',
 4:'Semana 4 · consolidación: mantén o mejora tus marcas. En los aislados la última serie puede acercarse al fallo (reserva 0–1); en los compuestos, sin fallo técnico.'};
const PG_ESTN={pendiente:'Pendiente',hoy:'Disponible hoy',curso:'En progreso',completado:'Completado',parcial:'Completado parcialmente',omitido:'Omitido',
 abandonado:'Abandonado',seguridad:'Interrumpido por seguridad',descanso:'Descanso',reprogramado:'Reprogramado',cancelado:'No realizado (programa cancelado)'};
const PG_SEG={lesion:'Lesión',dolor:'Dolor relevante',enfermedad:'Enfermedad',emergencia:'Emergencia',imposible:'Imposibilidad justificada de entrenar'};
const PG_OMIT={maquina:'Máquina o material no disponible',molestia:'Técnica o molestia',fatiga:'Fatiga',tiempo:'Sin tiempo',otro:'Otro motivo'};
const PG_CAN={lesion:'Lesión',enfermedad:'Enfermedad',fuerza:'Fuerza mayor (viaje, trabajo, familia)',otro:'Otro motivo'},PG_CAN_SALUD=['lesion','enfermedad'];
const PG_EST=['curso','completado','parcial','abandonado','seguridad','cancelado'],PG_FASES=['lista','serie','registro','descanso','pausa','fin'],PG_RIRS=['0','1','2','3','4+','?'];

// Series de la semana. Semana 1 (≈ 75–80 %): las de 3 o más pierden una; si aún pasa del 80 %, se quita una a la que menos se ha
// recortado (empate: la más tardía), nunca al primer ejercicio ni por debajo de 1. Semanas 2–4: el volumen completo.
function pgSeries(pl,sem){const b=PG_PLANT[pl].ej.map(x=>x[1]);if(sem>1)return b;
  const s=b.map(n=>n>=3?n-1:n),lim=Math.floor(.8*b.reduce((a,x)=>a+x,0));let tot=s.reduce((a,x)=>a+x,0);
  while(tot>lim){let k=-1;for(let i=1;i<s.length;i++)if(s[i]>1&&(k<0||s[i]/b[i]>=s[k]/b[k]))k=i;if(k<0)break;s[k]--;tot--}
  return s}
// reserva (RIR) objetivo [mín, máx] según la semana, el tipo y si es la última serie del ejercicio
function pgRir(sem,t,ultima){if(sem<=1)return [2,3];if(sem===2)return t==='c'?[1,3]:[1,2];if(t==='c')return [1,2];return ultima?[0,1]:sem===4?[1,1]:[1,2]}
const pgRirTxt=r=>r[0]===r[1]?String(r[0]):r[0]+'–'+r[1];

/* ---------- fechas: zona horaria fija (America/Santo_Domingo, UTC−4 todo el año) ---------- */
let pgFmt=null;try{pgFmt=new Intl.DateTimeFormat('en-CA',{timeZone:PG_TZ,year:'numeric',month:'2-digit',day:'2-digit'})}catch(e){}
function pgDiaK(ms){if(pgFmt)try{const s=pgFmt.format(new Date(ms));if(DIA_RE.test(s))return s}catch(e){}return new Date(ms+PG_TZ_OFF).toISOString().slice(0,10)}
const pgKN=k=>Date.parse(k+'T00:00:00Z');                                   // día civil → número (solo para contar días)
const pgSuma=(k,n)=>new Date(pgKN(k)+n*PG_D).toISOString().slice(0,10);
const pgEntre=(a,b)=>Math.round((pgKN(b)-pgKN(a))/PG_D);
const pgDow=k=>(new Date(pgKN(k)).getUTCDay()+6)%7;                         // 0 = lunes
const pgFTxt=k=>{try{return new Date(pgKN(k)).toLocaleDateString('es-DO',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})}catch(e){return k}};
const pgHTxt=ms=>{try{return new Date(ms).toLocaleTimeString('es-DO',{hour:'numeric',minute:'2-digit',timeZone:PG_TZ})}catch(e){return ''}};

/* ---------- estado guardado: {v, marca, off, offT, act, ses, rep, cur, arch, log} ----------
   act = el programa programado o en curso {id, ini (lunes AAAA-MM-DD), creado}; ses = {d01: {int: [intentos]}} por sesión (día original);
   rep = {d01: {a: fecha nueva, de, t}}; cur = la sesión en curso; arch = programas terminados o cancelados (con todos sus datos);
   log = eventos (activación, abandono, seguridad, reprogramación, avisos de la hora). Se valida campo por campo como el resto de la app. */
function pgNormRow(r,plan){if(!esObj(r))return null;const e=vEnt(r.e,0,19),s=vEnt(r.s,0,19),reps=vEnt(r.reps,1,100),id=vTxt(r.id,140),t1=vFecha(r.t1);
  if(e==null||s==null||reps==null||!id||!t1||!plan[e]||s>=plan[e].n)return null;
  const o={id,e,s,reps,rir:PG_RIRS.includes(r.rir)?r.rir:'?',kg:r.kg==null||r.kg===''?null:vNum(r.kg,0,1000),t1,plaus:PLAUS.includes(r.plaus)?r.plaus:'desconocida'};
  const t0=vFecha(r.t0),d=vNum(r.dur,0,3600),rr=vNum(r.restR,0,36000),ko=vNum(r.kgObj,0,1000);
  if(t0)o.t0=t0;if(d!=null)o.dur=d;if(rr!=null){o.restR=rr;if(RESTQ.includes(r.restQ))o.restQ=r.restQ}if(ko!=null)o.kgObj=ko;return o}
function pgNormInt(x){if(!esObj(x))return null;const id=vTxt(x.id,120),ini=vFecha(x.ini),sem=vEnt(x.sem,1,4);
  const plan=vLista(x.plan,20,p=>esObj(p)&&tiene(PG_EJ,p.e)&&vEnt(p.n,1,10)!=null?{e:p.e,n:+p.n}:null);
  if(!id||!ini||sem==null||!plan.length||!PG_EST.includes(x.est))return null;
  const o={id,ini,fin:vFecha(x.fin),est:x.est,sem,plan,sets:[],omit:[]},ya=new Set();
  for(const r of vLista(x.sets,200,r=>pgNormRow(r,plan))){const k=r.e+'|'+r.s;if(ya.has(k)||o.sets.some(q=>q.id===r.id))continue;ya.add(k);o.sets.push(r)}
  for(const m of vLista(x.omit,200,m=>esObj(m)&&vEnt(m.e,0,19)!=null&&vEnt(m.s,0,19)!=null&&tiene(PG_OMIT,m.por)?{e:+m.e,s:+m.s,por:m.por}:null)){
    const k=m.e+'|'+m.s;if(ya.has(k)||!plan[m.e]||m.s>=plan[m.e].n)continue;ya.add(k);o.omit.push(m)}
  const mot=vTxt(x.mot,300);if(mot)o.mot=mot;if(tiene(PG_SEG,x.cat)||tiene(PG_CAN,x.cat))o.cat=x.cat;
  if(x.dud===true)o.dud=true;if(x.corte===true)o.corte=true;if(x.fh==='red'||x.fh==='disp')o.fh=x.fh;return o}
function pgNormSes(o,ini){const r={};if(!esObj(o))return r;for(const k in o){if(!tiene(o,k)||!/^d\d\d$/.test(k)||!pgSidOk(k))continue;
  const I=vLista(esObj(o[k])?o[k].int:null,10,pgNormInt);if(I.length)r[k]={int:I}}return r}
function pgNormRep(o,ini){const r={};if(!esObj(o))return r;for(const k in o){if(!tiene(o,k)||!pgSidOk(k)||!esObj(o[k]))continue;
  const a=vDia(o[k].a),t=vFecha(o[k].t);if(a&&t&&(!ini||(a>=ini&&a<=pgSuma(ini,27))))r[k]={a,t,de:vDia(o[k].de)||null}}return r}
const pgSidOk=k=>{const m=/^d(\d\d)$/.exec(k);return !!m&&+m[1]>=1&&+m[1]<=28&&!!PG_SEMANA[(+m[1]-1)%7]};
function pgNormCur(c,ses){if(!esObj(c)||!pgSidOk(c.sid)||!PG_FASES.includes(c.fase))return null;const iid=vTxt(c.iid,120),I=ses[c.sid]&&ses[c.sid].int.find(x=>x.id===iid);
  if(!I||I.est!=='curso')return null;const n=k=>vNum(c[k],0,1e14);
  const o={sid:c.sid,iid,fase:c.fase,ej:vEnt(c.ej,0,I.plan.length-1)??0,ver:vEnt(c.ver,0,I.plan.length-1)??0,ult:n('ult')||0,olv:vEnt(c.olv,0,PG_OLV_MAX)??0,descPz:n('descPz')||0};
  for(const k of ['ser0','fin0','desc0','hold'])if(n(k))o[k]=n(k);const dp=vNum(c.descPlan,0,600);if(dp!=null)o.descPlan=dp;
  if(PG_FASES.includes(c.prev))o.prev=c.prev;
  if(esObj(c.pausa)&&PG_FASES.includes(c.pausa.de)&&n2(c.pausa.t))o.pausa={de:c.pausa.de,t:+c.pausa.t};
  if(esObj(c.kgAj)){o.kgAj={};for(const k in c.kgAj){const i=vEnt(k,0,19),v=vNum(c.kgAj[k],0,1000);if(i!=null&&v!=null)o.kgAj[i]=v}}
  if(o.fase==='pausa'&&!o.pausa)o.fase='lista';return o}
const n2=v=>vNum(v,1,1e14)!=null;
function pgNormAct(a){if(!esObj(a))return null;const id=vTxt(a.id,40),ini=vDia(a.ini),cr=vFecha(a.creado);return id&&ini&&pgDow(ini)===0&&cr?{id,ini,creado:cr}:null}
function pgNorm(o){const r={v:1,marca:0,off:0,offT:0,act:null,ses:{},rep:{},cur:null,arch:[],log:[]};if(!esObj(o))return r;
  r.marca=vNum(o.marca,0,1e14)||0;r.off=vNum(o.off,-1e12,1e12)||0;r.offT=vNum(o.offT,0,1e14)||0;
  r.act=pgNormAct(o.act);if(r.act){r.ses=pgNormSes(o.ses);r.rep=pgNormRep(o.rep,r.act.ini);r.cur=pgNormCur(o.cur,r.ses)}
  r.arch=vLista(o.arch,PG_ARCH_MAX,a=>{const A=pgNormAct(a);if(!A||!['terminado','cancelado'].includes(a.est))return null;
    const x={...A,est:a.est,cerr:vFecha(a.cerr)||A.creado,ses:pgNormSes(a.ses),rep:pgNormRep(a.rep,A.ini)};const m=vTxt(a.mot,300);if(m)x.mot=m;if(tiene(PG_CAN,a.cat))x.cat=a.cat;return x});
  r.log=vLista(o.log,PG_LOG_MAX,l=>esObj(l)&&vFecha(l.t)&&vTxt(l.k,20)?{t:l.t,k:l.k,x:vTxt(l.x,300)||''}:null);
  // una sesión «en curso» que no es la de cur (cierre a medias): se conserva tal cual, pero ya no está en curso
  for(const sid in r.ses)for(const I of r.ses[sid].int)if(I.est==='curso'&&!(r.cur&&r.cur.iid===I.id)){I.est='abandonado';I.mot=I.mot||'Sesión que quedó abierta sin estado válido al leer los datos';if(!I.fin)I.fin=I.sets.length?I.sets[I.sets.length-1].t1:I.ini}
  return r}
let PGS=pgNorm(leerJSON(PG_KEY,{}));
const pgGuarda=()=>guardarObj(PG_KEY,PGS);
function pgRecargar(){PGS=pgNorm(leerJSON(PG_KEY,{}))}
const pgLog=(t,k,x)=>{PGS.log.push({t:new Date(t).toISOString(),k,x:String(x||'').slice(0,300)});if(PGS.log.length>PG_LOG_MAX)PGS.log.splice(0,PGS.log.length-PG_LOG_MAX)};
const pgErr=(err,txt)=>({ok:false,err,txt});

/* ---------- la hora del programa ----------
   pgAhora = hora del teléfono + corrección de la red (off) + saltos detectados con la app abierta (pgSalto), y nunca hacia atrás:
   · Con conexión, la cabecera Date del propio servidor da la hora real (pgHoraRed): si el teléfono se desvía más de 2 min, se corrige.
   · Con la app abierta y visible, performance.now (monótono) contra Date.now: un salto de más de 1 min es un cambio de hora, no tiempo.
   · Marca de agua (marca): la mayor hora vista. Si la del teléfono queda por detrás (hora atrasada a mano), se usa la marca: no se
     puede volver a un día pasado para entrenarlo ni para borrar un incumplimiento.
   · Una hora adelantada con la app cerrada y sin red no se distingue del paso del tiempo. Lo registrado así queda marcado como «hora no
     verificable» en cuanto la red da la hora real (pgRevisaDudas) y no cuenta para la adherencia ni la progresión. */
let pgRel=null,pgSalto=0,pgOculta=false;
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pgOculta=true});
// Solo es un cambio de hora si la app estuvo VISIBLE entre las dos lecturas: con la app en segundo plano el teléfono puede dormir y
// performance.now se detiene mientras la hora real sigue (eso es tiempo de verdad: el descanso debe seguir corriendo). pgOculta se
// marca al ocultarse y solo se borra con la primera lectura ya visible, que no compensa nada.
function pgAhora(){const d=Date.now(),p=typeof performance!=='undefined'&&performance.now?performance.now():NaN,vis=!document.hidden;
  if(pgRel&&isFinite(p)&&vis&&!pgOculta){const dT=d-pgRel.d,dP=p-pgRel.p;if(dP>=0&&Math.abs(dT-dP)>PG_SALTO){pgSalto-=dT-dP;pgAviso='salto'}}
  pgRel={d,p};if(vis)pgOculta=false;else pgOculta=true;
  let t=d+(PGS.off||0)+pgSalto;
  if(t<PGS.marca){if(PGS.marca-t>PG_SALTO)pgAviso='atras';t=PGS.marca}else PGS.marca=t;
  return t}
let pgAviso='';   // 'atras' | 'salto' | 'red': lo que se dice en pantalla sobre la hora
// srv: hora de la red (ms) tomada cuando el teléfono marcaba «local»
function pgHoraRed(srv,local=Date.now()){if(!(srv>1.5e12))return false;const off=srv-local;PGS.off=Math.abs(off)<12e4?0:off;PGS.offT=srv;pgSalto=0;
  if(PGS.off)pgAviso='red';const real=srv+(Date.now()-local);
  // la red manda: una marca por delante de la hora real venía de un reloj adelantado
  if(PGS.marca>real+12e4){pgLog(real,'hora',`La hora del teléfono iba adelantada ${Math.round((PGS.marca-real)/6e4)} min respecto a la red`);PGS.marca=real}
  pgRevisaDudas(real);pgGuarda();return true}
// lo registrado «en el futuro» respecto a la hora real queda con la hora no verificable
function pgRevisaDudas(real){const lim=real+12e4,marca=I=>{if(I.dud)return;const ts=[Date.parse(I.ini),...I.sets.map(r=>Date.parse(r.t1))];
    if(ts.some(x=>x>lim)){I.dud=true;pgLog(real,'hora',`Sesión ${I.id} registrada con el reloj adelantado: no cuenta para la adherencia ni la progresión`);pgEspejo(I)}};
  for(const sid in PGS.ses)PGS.ses[sid].int.forEach(marca)}
async function pgSincronizar(){if(typeof fetch!=='function'||typeof location==='undefined'||!/^https?:/.test(location.protocol)||navigator.onLine===false)return;
  try{const a=Date.now(),r=await fetch('manifest.json?hora='+a,{method:'HEAD',cache:'no-store'}),b=Date.now(),h=r.headers.get('Date'),srv=h?Date.parse(h):NaN;
    if(isFinite(srv)&&b-a<5000){pgHoraRed(srv+500,(a+b)/2);pgPinta()}}catch(e){}}   // la cabecera va en segundos enteros: +0,5 s
const pgFuenteHora=t=>PGS.offT&&Math.abs(t-PGS.offT)<PG_D?'red':'disp';

/* ---------- calendario ---------- */
const pgA=()=>PGS.act?{id:PGS.act.id,ini:PGS.act.ini,ses:PGS.ses,rep:PGS.rep}:null;   // el programa activo como «vista»
function pgDias(ini){const out=[];for(let i=0;i<28;i++){const pl=PG_SEMANA[i%7];out.push({n:i+1,f:pgSuma(ini,i),sem:Math.floor(i/7)+1,dw:i%7,pl,sid:pl?'d'+String(i+1).padStart(2,'0'):null})}return out}
const pgDiaSid=(A,sid)=>{const m=/^d(\d\d)$/.exec(sid||'');return A&&m?pgDias(A.ini)[+m[1]-1]:null};
const pgSids=A=>pgDias(A.ini).filter(d=>d.sid).map(d=>d.sid);
const pgFechaSes=(A,sid)=>(A.rep[sid]&&A.rep[sid].a)||pgDiaSid(A,sid).f;
const pgInts=(A,sid)=>(A.ses[sid]&&A.ses[sid].int)||[];
const pgFin=A=>pgSuma(A.ini,27);
// estado de una sesión el día «hoy» (los intentos con la hora no verificable no cuentan; tras reprogramar, solo los intentos posteriores)
function pgEstadoSes(A,sid,hoy,cancel){if(PGS.cur&&PGS.act&&A.id===PGS.act.id&&PGS.cur.sid===sid)return 'curso';
  const r=A.rep[sid],I=pgInts(A,sid).filter(x=>!x.dud&&x.est!=='curso'&&(!r||Date.parse(x.ini)>=Date.parse(r.t))),u=I[I.length-1];
  if(u)return u.est;const f=pgFechaSes(A,sid);if(cancel&&f>=cancel)return 'cancelado';return f>hoy?'pendiente':f===hoy?'hoy':'omitido'}
// las 28 casillas: el día con su sesión (la original o la que se movió aquí) o el descanso
function pgCalendario(A,hoy,cancel){const dias=pgDias(A.ini),movidas={};for(const sid in A.rep)movidas[A.rep[sid].a]=sid;
  return dias.map(d=>{const c={...d,hoy:d.f===hoy};const aqui=movidas[d.f];
    if(d.sid&&A.rep[d.sid]){c.est='reprogramado';c.a=A.rep[d.sid].a;c.antes=pgEstadoAntes(A,d.sid)}
    else if(d.sid){c.est=pgEstadoSes(A,d.sid,hoy,cancel);c.ses=d.sid}
    else if(aqui){c.ses=aqui;c.est=pgEstadoSes(A,aqui,hoy,cancel);c.movida=true}
    else c.est='descanso';
    return c})}
function pgEstadoAntes(A,sid){const r=A.rep[sid],I=pgInts(A,sid).filter(x=>!x.dud&&r&&Date.parse(x.ini)<Date.parse(r.t));return I.length?I[I.length-1].est:'omitido'}
function pgFase(t=pgAhora()){const a=PGS.act;if(!a)return 'ninguno';const h=pgDiaK(t);return h<a.ini?'programado':h>pgFin(a)?'vencido':'activo'}
// EL BLOQUEO: con una sesión del programa en curso, o con el programa empezado (hasta que se cierre con su informe o se cancele)
function pgBloqueaLibre(t=pgAhora()){return !!PGS.cur||(!!PGS.act&&pgDiaK(t)>=PGS.act.ini)}
function pgProxima(t=pgAhora()){const A=pgA();if(!A)return null;const h=pgDiaK(t);
  return pgSids(A).map(sid=>({sid,f:pgFechaSes(A,sid),est:pgEstadoSes(A,sid,h)})).filter(x=>x.est==='curso'||x.est==='hoy'||x.est==='pendiente').sort((a,b)=>a.f<b.f?-1:a.f>b.f?1:0)[0]||null}
function pgMsgBloqueo(t=pgAhora()){const p=pgProxima(t),A=pgA();
  const que=p?`${pgFTxt(p.f)} · ${PG_PLANT[pgDiaSid(A,p.sid).pl].n}${p.est==='curso'?' (en curso)':''}`:'ninguna (el ciclo se está cerrando)';
  return `Programa de hipertrofia activo. Tu compromiso de 28 días continúa. Próxima sesión disponible: ${que}.`}

/* ---------- activar, desprogramar, cerrar el ciclo y cancelar ---------- */
function pgLunesOpc(t=pgAhora()){const h=pgDiaK(t),d=pgDow(h),p=d===0?h:pgSuma(h,7-d);return [p,pgSuma(p,7),pgSuma(p,14)]}
function pgActivar(ini,t=pgAhora()){if(PGS.act)return pgErr('ya','Ya hay un programa programado o activo.');
  if(!vDia(ini)||pgDow(ini)!==0)return pgErr('lunes','El programa empieza siempre un lunes.');
  if(!pgLunesOpc(t).includes(ini))return pgErr('fecha','Elige uno de los próximos tres lunes (hoy, si es lunes).');
  if(typeof enCurso==='function'&&enCurso()||typeof retomar!=='undefined'&&retomar)return pgErr('libre','Termina o descarta antes la sesión libre del reloj.');
  PGS.act={id:'pg'+Math.floor(t).toString(36),ini,creado:new Date(t).toISOString()};PGS.ses={};PGS.rep={};PGS.cur=null;
  pgLog(t,'activar',`Programado del ${ini} al ${pgFin(PGS.act)}`);pgGuarda();return {ok:true}}
// antes del primer día no hay compromiso todavía: se puede desprogramar sin más
function pgDesprogramar(t=pgAhora()){if(!PGS.act)return pgErr('sin','No hay programa.');if(pgDiaK(t)>=PGS.act.ini)return pgErr('empezado','El programa ya empezó: para dejarlo hay que cancelarlo con su procedimiento.');
  pgLog(t,'desprogramar',PGS.act.ini);PGS.act=null;PGS.ses={};PGS.rep={};pgGuarda();return {ok:true}}
function pgArchiva(est,t,extra){const A=PGS.act;PGS.arch.push({...A,est,cerr:new Date(t).toISOString(),ses:PGS.ses,rep:PGS.rep,...extra});
  if(PGS.arch.length>PG_ARCH_MAX)PGS.arch.splice(0,PGS.arch.length-PG_ARCH_MAX);PGS.act=null;PGS.ses={};PGS.rep={};PGS.cur=null}
// el ciclo se cierra (informe y desbloqueo) pasado el día 28, o el mismo día 28 cuando todas sus sesiones ya tienen estado final
function pgRevisaFin(t=pgAhora()){const A=pgA();if(!A||PGS.cur)return false;const h=pgDiaK(t),f=pgFin(A);if(h<f)return false;
  if(h===f&&pgSids(A).some(sid=>['hoy','pendiente'].includes(pgEstadoSes(A,sid,h))))return false;
  pgLog(t,'fin',`Ciclo ${A.id} terminado`);pgArchiva('terminado',t);pgGuarda();pgVerInforme=PGS.arch[PGS.arch.length-1].id;return true}
// cancelar el compromiso: motivo obligatorio; por lesión o enfermedad basta confirmarlo (sin frase ni espera); por otro motivo, la frase
function pgCancelar(o,t=pgAhora()){if(!PGS.act)return pgErr('sin','No hay programa.');o=o||{};
  if(pgDiaK(t)<PGS.act.ini)return pgDesprogramar(t);
  if(!tiene(PG_CAN,o.cat))return pgErr('motivo','Elige el motivo de la cancelación.');
  const salud=PG_CAN_SALUD.includes(o.cat),mot=String(o.mot||'').trim().slice(0,300);
  if(salud){if(o.conf!==true)return pgErr('conf','Confirma la cancelación.')}
  else{if(mot.length<3)return pgErr('texto','Escribe el motivo.');if(String(o.frase||'').trim()!==PG_FRASE_CAN)return pgErr('frase',`Escribe exactamente «${PG_FRASE_CAN}».`)}
  if(PGS.cur){const I=pgIntCur();pgCierra(I,'cancelado',{mot:'Programa cancelado durante la sesión',corte:PGS.cur.fase==='serie'},t,true)}
  pgLog(t,'cancelar',`${PG_CAN[o.cat]}${mot?': '+mot:''}`);pgArchiva('cancelado',t,{cat:o.cat,...(mot?{mot}:{})});pgGuarda();pgVerInforme=PGS.arch[PGS.arch.length-1].id;return {ok:true}}

/* ---------- la sesión de entrenamiento ---------- */
const pgIntCur=()=>PGS.cur&&pgInts(pgA(),PGS.cur.sid).find(x=>x.id===PGS.cur.iid)||null;
const pgHecha=(I,i,s)=>I.sets.some(r=>r.e===i&&r.s===s),pgOmitida=(I,i,s)=>I.omit.some(o=>o.e===i&&o.s===s);
function pgPend(I,i){for(let s=0;s<I.plan[i].n;s++)if(!pgHecha(I,i,s)&&!pgOmitida(I,i,s))return s;return -1}
function pgSigEj(I,desde){const n=I.plan.length;for(let k=0;k<n;k++){const i=(desde+k)%n;if(pgPend(I,i)>=0)return i}return -1}
// una serie vale si su tiempo es posible, la hora es verificable y la sesión entera no se hizo en un tiempo imposible
function pgResumen(I){const total=I.plan.reduce((a,p)=>a+p.n,0),hechas=I.sets.length,omit=I.omit.length;
  const ok=I.sets.filter(r=>r.plaus!=='imposible');let inv=false;
  if(ok.length>1){const a=Math.min(...ok.map(r=>Date.parse(r.t0||r.t1))),b=Math.max(...ok.map(r=>Date.parse(r.t1)));inv=(b-a)/1000<ok.length*PG_SEG_MIN}
  const validas=I.dud||inv?0:ok.length;return {total,hechas,validas,omit,pend:total-hechas-omit,frac:total?validas/total:0,inv,imposibles:hechas-ok.length}}
const pgValida=(r,I,R)=>r.plaus!=='imposible'&&!I.dud&&!(R||pgResumen(I)).inv;
// tocar el entrenamiento del día: crea (o recupera) la sesión y entra en modo entrenamiento, sin segunda confirmación ni series anotadas
function pgEntrar(sid,t=pgAhora()){pgRevisaFin(t);const A=pgA();
  if(PGS.cur){if(PGS.cur.sid===sid)return {ok:true,reanuda:true};return pgErr('otra','Ya hay una sesión del programa en curso: termínala antes.')}
  if(!A)return pgErr('sin','No hay ningún programa activo.');
  if(typeof enCurso==='function'&&enCurso())return pgErr('libre','Hay una sesión libre del reloj en curso.');
  const d=pgDiaSid(A,sid);if(!d||!d.sid)return pgErr('sid','Esa sesión no existe.');
  const h=pgDiaK(t);if(h<A.ini)return pgErr('antes',`El programa empieza el ${pgFTxt(A.ini)}.`);
  const f=pgFechaSes(A,sid);if(f>h)return pgErr('futura',`Esa sesión es del ${pgFTxt(f)}: no se puede adelantar.`);
  if(f<h)return pgErr('pasada','Esa fecha ya pasó: no se puede entrenar con otra fecha. Mira si se puede reprogramar.');
  const e=pgEstadoSes(A,sid,h);if(e!=='hoy')return pgErr('cerrada',`Esa sesión ya está: ${PG_ESTN[e].toLowerCase()}.`);
  const plan=pgSeries(d.pl,d.sem).map((n,i)=>({e:PG_PLANT[d.pl].ej[i][0],n})),id=`${A.id}-${sid}-${pgInts(A,sid).length+1}`;
  (PGS.ses[sid]||(PGS.ses[sid]={int:[]})).int.push({id,ini:new Date(t).toISOString(),fin:null,est:'curso',sem:d.sem,plan,sets:[],omit:[],fh:pgFuenteHora(t)});
  PGS.cur={sid,iid:id,fase:'lista',ej:0,ver:0,ult:t,olv:0,descPz:0};
  pgLog(t,'inicio',`${sid} · ${PG_PLANT[d.pl].n}`);pgGuarda();return {ok:true}}
const pgCurOk=()=>PGS.cur&&pgIntCur()?null:pgErr('sin','No hay una sesión del programa en curso.');
function pgEmpezarSerie(t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur,I=pgIntCur();
  if(!['lista','descanso'].includes(c.fase))return pgErr('fase','Ahora no se puede empezar una serie.');
  if(t-c.ult<PG_REBOTE)return pgErr('rebote','Toque repetido ignorado.');
  if(pgPend(I,c.ej)<0){const j=pgSigEj(I,c.ej);if(j<0)return pgErr('nada','No quedan series pendientes.');c.ej=j}
  if(c.fase==='descanso'&&I.sets.length&&c.desc0){const u=I.sets[I.sets.length-1],real=Math.max(0,(t-c.desc0-(c.descPz||0))/1000);
    u.restR=Math.round(real);u.restQ=c.descPz>0?'interrumpido':restQDe(real,c.descPlan||PG_EJ[I.plan[u.e].e].rest)}
  Object.assign(c,{prev:c.fase,fase:'serie',ser0:t,ult:t,descPz:0});c.ver=c.ej;pgGuarda();return {ok:true}}
function pgTerminarSerie(t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur;
  if(c.fase!=='serie')return pgErr('fase','No hay una serie en marcha.');if(t-c.ult<PG_REBOTE)return pgErr('rebote','Toque repetido ignorado.');
  Object.assign(c,{fase:'registro',fin0:t,ult:t});pgGuarda();return {ok:true}}
// empezada sin querer: vuelve atrás sin anotar nada
function pgCancelarSerie(t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur;if(!['serie','registro'].includes(c.fase))return pgErr('fase','No hay una serie que cancelar.');
  c.fase=c.prev==='descanso'?'descanso':'lista';delete c.ser0;delete c.fin0;c.ult=t;pgGuarda();return {ok:true}}
// REGISTRO EFECTIVO de una serie: lo que hiciste de verdad (carga, reps, reserva) con su duración medida; una vez por hueco
function pgRegistrar(o,t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur,I=pgIntCur();o=o||{};
  if(c.fase!=='registro')return pgErr('fase','Primero empieza y termina la serie.');
  const s=pgPend(I,c.ej);if(s<0)return pgErr('dup','Esa serie ya está registrada.');
  const reps=vEnt(o.reps,0,100);if(reps==null)return pgErr('reps','Anota las repeticiones (un número entero).');
  if(reps===0)return pgErr('cero','Con 0 repeticiones no hubo serie: cancélala u omítela.');
  const E=PG_EJ[I.plan[c.ej].e],kg=o.kg==null||o.kg===''?null:vNum(o.kg,0,1000);
  if(o.kg!=null&&o.kg!==''&&kg==null)return pgErr('kg','La carga no es válida.');
  if(kg==null&&!E.cp&&o.sinCarga!==true)return pgErr('kgfalta','Anota la carga (o marca que no la sabes).');
  const rir=PG_RIRS.includes(String(o.rir))?String(o.rir):'?',olv=o.olvido===true;
  if(olv&&c.olv>=PG_OLV_MAX)return pgErr('olvido',`«Olvidé tocar al empezar» solo se puede usar ${PG_OLV_MAX} veces por sesión.`);
  const id=`${I.id}-${c.ej}-${s}`;if(I.sets.some(r=>r.id===id))return pgErr('dup','Esa serie ya está registrada.');
  const dur=olv||!c.ser0?null:Math.max(0,(c.fin0-c.ser0)/1000),R=pgPresc(PGS.cur.sid,{int:I});
  const row={id,e:c.ej,s,reps,rir,kg,t1:new Date(c.fin0||t).toISOString(),plaus:dur==null?'desconocida':plausDe(dur,reps)};
  if(c.ser0&&!olv)row.t0=new Date(c.ser0).toISOString();if(dur!=null)row.dur=Math.round(dur*10)/10;
  const ko=R&&R.ejs[c.ej]?R.ejs[c.ej].kg:null;if(ko!=null)row.kgObj=ko;if(olv)c.olv++;
  I.sets.push(row);
  Object.assign(c,{fase:'descanso',desc0:c.fin0||t,descPlan:E.rest,descPz:0,ult:t});delete c.ser0;delete c.fin0;
  if(pgPend(I,c.ej)<0){const j=pgSigEj(I,c.ej+1);if(j<0)c.fase='fin';else c.ej=j}c.ver=c.ej;
  pgEspejo(I);pgGuarda();return {ok:true,row}}
// omitir de forma honesta: una serie o lo que queda del ejercicio, con motivo (no suma volumen ni reps)
function pgOmitir(i,todo,por,t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur,I=pgIntCur();
  if(!['lista','descanso','fin','pausa'].includes(c.fase))return pgErr('fase','Termina o cancela antes la serie en marcha.');
  if(!tiene(PG_OMIT,por))return pgErr('motivo','Elige el motivo.');i=vEnt(i,0,I.plan.length-1);if(i==null)return pgErr('ej','Ejercicio no válido.');
  let s=pgPend(I,i);if(s<0)return pgErr('nada','Ese ejercicio no tiene series pendientes.');
  do{I.omit.push({e:i,s,por});s=pgPend(I,i)}while(todo&&s>=0);
  if(pgPend(I,c.ej)<0){const j=pgSigEj(I,c.ej);if(j<0&&c.fase!=='pausa')c.fase='fin';else if(j>=0)c.ej=j}c.ver=c.ej;c.ult=t;pgGuarda();return {ok:true}}
// navegar entre ejercicios NO los completa: ver solo cambia lo que se mira; «hacer este ahora» cambia el orden
function pgVer(i){if(!PGS.cur)return;const I=pgIntCur(),v=vEnt(i,0,I.plan.length-1);if(v!=null)PGS.cur.ver=v}
function pgCambiarEj(i,t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur,I=pgIntCur();if(!['lista','descanso'].includes(c.fase))return pgErr('fase','Ahora no.');
  const v=vEnt(i,0,I.plan.length-1);if(v==null||pgPend(I,v)<0)return pgErr('nada','Ese ejercicio no tiene series pendientes.');c.ej=v;c.ver=v;c.ult=t;pgGuarda();return {ok:true}}
function pgAjustaKg(i,kg){const e=pgCurOk();if(e)return e;const I=pgIntCur(),v=vEnt(i,0,I.plan.length-1),k=vNum(kg,0,1000);if(v==null||k==null)return pgErr('kg','Carga no válida.');
  (PGS.cur.kgAj||(PGS.cur.kgAj={}))[v]=k;pgGuarda();return {ok:true}}
function pgPausa(t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur;if(!['lista','descanso','fin'].includes(c.fase))return pgErr('fase','Termina o cancela antes la serie en marcha.');
  c.pausa={de:c.fase,t};c.fase='pausa';c.ult=t;pgGuarda();return {ok:true}}
function pgReanudar(t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur;if(c.fase!=='pausa'||!c.pausa)return pgErr('fase','No está en pausa.');
  if(c.pausa.de==='descanso')c.descPz=(c.descPz||0)+Math.max(0,t-c.pausa.t);c.fase=c.pausa.de;delete c.pausa;c.ult=t;pgGuarda();return {ok:true}}
function pgCierra(I,est,extra,t,sinGuardar){Object.assign(I,{est,fin:new Date(t).toISOString()},extra||{});PGS.cur=null;pgEspejo(I);
  pgLog(t,est,`${I.id}${extra&&extra.mot?' · '+extra.mot:''}`);if(!sinGuardar){pgGuarda();pgRevisaFin(t)}}
// A · FINALIZACIÓN NORMAL: todas las series resueltas (registradas u omitidas con motivo); completada con todas válidas, parcial desde la mitad
function pgFinalizar(t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur,I=pgIntCur();
  if(['serie','registro'].includes(c.fase))return pgErr('fase','Registra o cancela antes la serie en marcha.');
  const R=pgResumen(I);if(R.pend>0)return pgErr('pendientes',`Quedan ${R.pend} series sin registrar ni omitir.`,R);
  if(R.inv)return pgErr('tiempo','Las series se registraron en un tiempo físicamente imposible para la sesión entera: no cuentan como hechas. Puedes abandonar o salir por seguridad.');
  if(R.frac<PG_PARCIAL)return pgErr('insuficiente',`Solo ${R.validas} de ${R.total} series válidas: para cerrar con menos de la mitad usa «Abandonar» (con su procedimiento) o la salida por seguridad.`);
  const est=R.validas>=R.total?'completado':'parcial';pgCierra(I,est,null,t);return {ok:true,est,R}}
// B · ABANDONO VOLUNTARIO: motivo + la frase + sostener 15 s (medido aquí: pgSostener al apretar, pgSoltar al soltar)
function pgSostener(t=pgAhora()){if(!PGS.cur)return pgErr('sin','No hay sesión.');PGS.cur.hold=t;return {ok:true}}
function pgSoltar(){if(PGS.cur)delete PGS.cur.hold}
function pgAbandonar(o,t=pgAhora()){const e=pgCurOk();if(e)return e;const c=PGS.cur,I=pgIntCur();o=o||{};
  const mot=String(o.mot||'').trim().slice(0,300);if(mot.length<3)return pgErr('motivo','Escribe el motivo del abandono.');
  if(String(o.frase||'').trim()!==PG_FRASE_AB)return pgErr('frase',`Escribe exactamente «${PG_FRASE_AB}».`);
  if(!c.hold||t-c.hold<PG_HOLD)return pgErr('sostener','Mantén pulsado el control 15 segundos seguidos.');
  pgCierra(I,'abandonado',{mot,...(c.fase==='serie'||c.fase==='registro'?{corte:true}:{})},t);return {ok:true}}
// sesión olvidada: tras 6 h sin tocar nada se puede cerrar como abandonada sin el procedimiento (ya no es un impulso)
function pgCerrarOlvidada(t=pgAhora()){const e=pgCurOk();if(e)return e;if(t-PGS.cur.ult<PG_OLVIDADA_H*36e5)return pgErr('reciente','La sesión no lleva 6 h sin actividad.');
  const I=pgIntCur();pgCierra(I,'abandonado',{mot:`Sesión no cerrada: sin actividad desde ${pgHTxt(PGS.cur.ult)} del ${pgFTxt(pgDiaK(PGS.cur.ult))}`},t);return {ok:true}}
// C · SALIDA POR SEGURIDAD: inmediata, en cualquier fase, sin demoras, frases ni esperas. Conserva lo hecho y ofrece reprogramar.
function pgSeguridad(cat,nota,t=pgAhora()){const e=pgCurOk();if(e)return e;if(!tiene(PG_SEG,cat))cat='imposible';const c=PGS.cur,I=pgIntCur(),sid=c.sid;
  const n=String(nota||'').trim().slice(0,300);pgCierra(I,'seguridad',{cat,mot:PG_SEG[cat]+(n?': '+n:''),...(c.fase==='serie'||c.fase==='registro'?{corte:true}:{})},t);
  return {ok:true,sid,opc:pgOpcRepro(sid,t)}}

/* ---------- reprogramación: una vez por sesión, a un miércoles libre del ciclo, sin el mismo grupo el día antes ni el día después ---------- */
function pgOpcRepro(sid,t=pgAhora()){const A=pgA();if(!A||!pgDiaSid(A,sid)||A.rep[sid])return [];const h=pgDiaK(t),est=pgEstadoSes(A,sid,h);
  if(!['omitido','abandonado','seguridad'].includes(est))return [];
  const foco=PG_PLANT[pgDiaSid(A,sid).pl].foco,cal=pgCalendario(A,h),ocup=new Set(Object.values(A.rep).map(r=>r.a)),out=[];
  const hoyCerrado=pgInts(A,sid).some(x=>pgDiaK(Date.parse(x.ini))===h);   // abandonada o interrumpida hoy: hoy no se reabre
  const lejos=est==='seguridad'?pgSuma(h,2):h,tope=pgSuma(pgDiaSid(A,sid).f,7);   // tras una salida por seguridad, como pronto en 48 h; como mucho 7 días después de su fecha
  for(const c of cal){if(c.pl||c.f<h||c.f<lejos||c.f>tope||ocup.has(c.f)||(c.f===h&&hoyCerrado))continue;
    const vec=[cal[c.n-2],cal[c.n]].filter(Boolean).map(x=>x.ses&&!['omitido','reprogramado','cancelado'].includes(x.est)?PG_PLANT[pgDiaSid(A,x.ses).pl].foco:null);
    if(vec.includes(foco))continue;out.push(c.f)}
  return out}
function pgReprogramar(sid,f,t=pgAhora()){const A=pgA();if(!A)return pgErr('sin','No hay programa.');if(A.rep[sid])return pgErr('ya','Esa sesión ya se reprogramó una vez.');
  const op=pgOpcRepro(sid,t);if(!op.includes(f))return pgErr('fecha','Esa fecha no es compatible (solo miércoles libres sin el mismo grupo el día antes ni el día después).');
  PGS.rep[sid]={a:f,t:new Date(t).toISOString(),de:pgDiaSid(A,sid).f};pgLog(t,'reprogramar',`${sid} → ${f}`);pgGuarda();return {ok:true}}

/* ---------- motor de progresión (doble progresión por ejercicio) ---------- */
// apariciones anteriores del ejercicio en el programa (intentos con hora verificable y sesión posible), de la más antigua a la más reciente;
// solo las series válidas para progresar (fisProgresa: sin imposibles ni improbables)
function pgOcurrencias(A,eid,antes,excl){const out=[];if(!A)return out;
  for(const sid in A.ses)for(const I of A.ses[sid].int){if(I.dud||I.id===excl||Date.parse(I.ini)>=antes)continue;const R=pgResumen(I);if(R.inv)continue;
    I.plan.forEach((p,i)=>{if(p.e!==eid)return;const rows=I.sets.filter(r=>r.e===i&&fisProgresa(r)).sort((a,b)=>a.s-b.s);if(rows.length)out.push({t:Date.parse(I.ini),sem:I.sem,n:p.n,rows,iid:I.id})})}
  return out.sort((a,b)=>a.t-b.t)}
const pgClave=kg=>kg==null?'c':String(Math.round(kg*1000));
// referencia de fuera del programa (último dato real del mismo ejercicio en las últimas 10 semanas o en «Mis cargas»): carga estimada
let pgRefMemo={k:'',v:{}};
function pgReferencia(eid,lo,hi,t){const k=hist.length+'|'+(hist[0]?hist[0].id+(hist[0].sets||[]).length:'')+'|'+Math.floor(t/36e5)+'|'+(typeof cg==='object'&&cg?Object.keys(cg.sem||{}).length:0);
  if(pgRefMemo.k!==k)pgRefMemo={k,v:{}};const c=eid+'|'+lo+'|'+hi;if(!(c in pgRefMemo.v))pgRefMemo.v[c]=pgReferencia1(eid,lo,hi,t);return pgRefMemo.v[c]}
function pgReferencia1(eid,lo,hi,t){const E=PG_EJ[eid],noms=[E.n,...E.al],obj=Math.round((lo+hi)/2),lim=t-70*PG_D;if(E.cp)return null;
  const H=hist.filter(h=>!(h.prog&&h.prog.d)&&Date.parse(h.start)>=lim&&Date.parse(h.start)<t).sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));
  for(const h of H){const r=(h.sets||[]).find(x=>noms.includes(x.ej)&&x.k==='act.'&&x.kg>0&&fisProgresa(x)&&parseInt(x.reps,10)>0&&['0','1','2','3','3+','4+'].includes(x.rir));
    if(r){const k=pgRedAbajo(e1(r)/(1+(obj+2.5)/30),E);if(!(k>0))continue;
      return {kg:k,fuente:'ref',txt:`estimada de tu historial (${r.ej}, ${pgFTxt(pgDiaK(Date.parse(h.start)))}: ${kgTxt(r.kg)} × ${r.reps}, reserva ${r.rir}${r.tc==='mancuerna'?', por mancuerna':''}) para ~${obj} reps con 2–3 en reserva. Confírmala en la primera serie`}}}
  if(typeof cg==='object'&&cg&&esObj(cg.sem)){for(const k of Object.keys(cg.sem).sort().reverse())for(const n of noms){const R=cg.sem[k].refs[cgKey(E.g,n,'h')];
    if(R&&R.w!=null&&R.u!=='nivel'&&R.tc!=='corporal'&&R.tc!=='extra'){const kg=cgAKg(R.w,R.u);if(kg>0)return {kg,fuente:'ref',txt:`de «Mis cargas» (${n}, semana del ${pgFTxt(k)}: ${cgTxt(R)}). Confírmala en la primera serie`}}}}
  return null}
function pgRedAbajo(x,E){if(!(x>0))return 0;let k=redondeaKg(x,{n:E.n});if(k>x+1e-6)k=cambiaKg({n:E.n},k,-1);return k}
// {kg (null = pendiente de calibración o peso corporal), reps [objetivo por serie], fuente, txt}
function pgProgresion(A,eid,lo,hi,n,antes,excl){const E=PG_EJ[eid],O=pgOcurrencias(A,eid,antes,excl),u=O[O.length-1],mid=Math.round((lo+hi)/2),fill=v=>Array.from({length:n},()=>v);
  if(!u){if(E.cp)return {kg:null,reps:fill(mid),fuente:'cp',txt:'peso corporal: progresa en repeticiones'};
    const r=pgReferencia(eid,lo,hi,isFinite(antes)?antes:Date.now());return r?{...r,reps:fill(mid)}:{kg:null,reps:fill(mid),fuente:'calibrar',txt:'pendiente de calibración: elige una carga con la que harías ~'+mid+' reps dejando 2–3 en reserva'}}
  const k0=u.rows[0].kg,m=u.rows.filter(r=>pgClave(r.kg)===pgClave(k0)),prev=m.map(r=>r.reps),cl=v=>Math.min(hi,Math.max(lo,v));
  const per=f=>Array.from({length:n},(_,i)=>cl(f(prev[Math.min(i,prev.length-1)])));
  const rmin=pgRir(u.sem,E.t,false)[0],conRir=m.every(r=>r.rir!=='?'),sum=rs=>rs.reduce((a,r)=>a+r.reps,0);
  const ant=O.slice(0,-1).reverse().find(o=>pgClave(o.rows[0].kg)===pgClave(k0));
  if(ant){const a=ant.rows.filter(r=>pgClave(r.kg)===pgClave(k0)),q=Math.min(a.length,m.length);
    if(q&&(a[0].reps-m[0].reps>=2||sum(m.slice(0,q))<.9*sum(a.slice(0,q))))
      return {kg:k0,reps:per(v=>v),fuente:'baja',txt:`rendimiento por debajo de la vez anterior (${m.slice(0,q).map(r=>r.reps).join('-')} frente a ${a.slice(0,q).map(r=>r.reps).join('-')} con ${kgTxt(k0)}): no se sube la carga. Revisa sueño, descanso entre series y fatiga; mantén ${kgTxt(k0)} o bájala un 5–10 %`}}
  const tope=m.length>=u.n&&m.every(r=>r.reps>=hi);
  if(tope&&k0>0){if(!conRir)return {kg:k0,reps:per(v=>v),fuente:'rir',txt:`llegaste a ${hi} en todas las series con ${kgTxt(k0)} pero sin anotar la reserva: repite la carga y anótala para decidir la subida`};
    if(m.every(r=>rirN(r.rir)>=rmin)){const k=cambiaKg({n:E.n},k0,1);return {kg:k,reps:fill(lo),fuente:'sube',txt:`sube a ${kgTxt(k)}: la última vez hiciste ${hi} o más en todas las series con ${kgTxt(k0)} y reserva ≥ ${rmin}`}}
    return {kg:k0,reps:per(v=>v),fuente:'rir',txt:`llegaste a ${hi} pero con menos reserva de la pedida (${rmin}): repite ${kgTxt(k0)} con mejor técnica`}}
  if(tope)return {kg:k0,reps:fill(hi),fuente:'tope',txt:'llegaste al tope del rango: añade carga o una variante más difícil'};
  if(k0>0&&m[0].reps<lo&&m[0].rir==='0'){const k=cambiaKg({n:E.n},k0,-1);if(k<k0)return {kg:k,reps:fill(lo),fuente:'bajar',txt:`la última vez no llegaste a ${lo} en la primera serie sin reserva: baja a ${kgTxt(k)}`}}
  return {kg:k0,reps:per(v=>v+1),fuente:'reps',txt:k0>0?`mantén ${kgTxt(k0)} y suma una repetición por serie (hasta ${hi})`:`suma una repetición por serie (hasta ${hi})`}}

/* ---------- prescripción concreta de una sesión ---------- */
function pgCalent(E,i,kg,vistos){const nuevo=!vistos.has(E.g);vistos.add(E.g);
  if(i===0){const c=kg>0?planCal(kg,{n:E.n}):null;return '5 min de movilidad o cardio suave y aproximaciones: '+(c?c.map(x=>`${kgTxt(x.kg)} × ${x.reps}`).join(', '):'≈50 % × 10, 70 % × 5 y 85 % × 2–3 de la carga de trabajo (calíbrala en la primera aproximación)')}
  if(E.t==='c'&&nuevo)return '1–2 aproximaciones: ≈60 % × 8 y 80 % × 3';
  if(E.t==='c')return '1 aproximación: ≈70 % × 5';
  return nuevo?'1 serie ligera de 12–15 (≈50 %)':'Sin calentamiento específico: el músculo ya está caliente'}
function pgVolumen(ejs){const Z={},G={};for(const e of ejs){const m=musculos(e.n,e.g),porG={};
    for(const [z,f] of Object.entries(m)){const o=Z[z]||(Z[z]={dir:0,ind:0});if(f>=1)o.dir+=e.series*f;else o.ind+=e.series*f;if(MUS[z])(porG[MUS[z][1]]=porG[MUS[z][1]]||[]).push(f)}
    for(const g in porG){const mx=Math.max(...porG[g]),o=G[g]||(G[g]={dir:0,ind:0});if(mx>=1)o.dir+=e.series*mx;else o.ind+=e.series*mx}}
  return {Z,G}}
// o.int: el intento (series fijadas al empezar; su propia progresión se calcula sin él). Sin intento: lo que se sabe hoy.
function pgPresc(sid,o={},A=pgA()){const d=pgDiaSid(A,sid);if(!d||!d.sid)return null;const PL=PG_PLANT[d.pl],I=o.int||null,ns=I?I.plan.map(p=>p.n):pgSeries(d.pl,d.sem);
  const antes=I?Date.parse(I.ini):(o.antes??Infinity),vistos=new Set();
  const ejs=PL.ej.map(([eid,,lo,hi],i)=>{const E=PG_EJ[eid],n=ns[i],pr=pgProgresion(A,eid,lo,hi,n,antes,I&&I.id);
    const aj=I&&PGS.cur&&PGS.cur.iid===I.id&&PGS.cur.kgAj&&PGS.cur.kgAj[i]!=null?PGS.cur.kgAj[i]:null,kg=aj!=null?aj:pr.kg;
    return {i,eid,n:E.n,s:E.s,g:E.g,t:E.t,cp:!!E.cp,lo,hi,series:n,reps:pr.reps,rir:Array.from({length:n},(_,s)=>pgRir(d.sem,E.t,s===n-1)),kg,aj:aj!=null,
      fuente:pr.fuente,ptxt:pr.txt,rest:E.rest,tec:E.tec,cal:pgCalent(E,i,kg,vistos)}});
  return {sid,d,pl:d.pl,nom:PL.n,sem:d.sem,ejs,vol:pgVolumen(ejs),nota:PG_SEM_NOTA[d.sem],series:ejs.reduce((a,e)=>a+e.series,0)}}

/* ---------- espejo en el historial: un registro por grupo (como las rutinas), con prog = {p, s, i, e}. El programa es la fuente de verdad. ---------- */
function pgFilaHist(r,E){const o={ex:E.s,ej:E.n,k:'act.',reps:String(r.reps),rir:r.rir,kg:r.kg,P:0,rest:E.rest,kgSrc:'man',plaus:r.plaus};
  if(r.dur!=null)o.dur=r.dur;if(r.restR!=null){o.restR=r.restR;if(r.restQ)o.restQ=r.restQ}return o}
function pgEspejo(I,pid){if(typeof hist==='undefined')return;const porG={},sid=(/-(d\d\d)-\d+$/.exec(I.id)||[])[1]||'',p=pid||(/^(pg[0-9a-z]+)-/.exec(I.id)||[])[1]||'';
  I.sets.forEach(r=>{const E=PG_EJ[I.plan[r.e].e];(porG[E.g]=porG[E.g]||[]).push(pgFilaHist(r,E))});
  const ahora=new Date().toISOString(),ents=[];
  for(const g in porG){const id=I.id+'-'+g,prev=hist.find(h=>h.id===id),sets=porG[g],meta=I.plan.reduce((a,q)=>a+(PG_EJ[q.e].g===g?q.n:0),0);
    ents.push({id,start:I.ini,g,grupo:CAT[g].n,series:sets.length,reps:repsDe(sets),tuc:0,iso:0,completa:I.est==='completado',sets,efectivas:Math.round(efDe(sets)*100)/100,meta,
      esq:ESQUEMA,creada:prev&&prev.creada||ahora,fis:{v:1},prog:{p,s:sid,i:I.id,e:I.est,...(I.dud?{d:true}:{})}})}
  hist=ents.concat(hist.filter(h=>!String(h.id).startsWith(I.id+'-')));hist.sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));
  escribirHist();if(typeof pintarHist==='function')pintarHist()}

/* ---------- informe final ---------- */
const pgSemDe=(A,ms)=>Math.min(4,Math.max(1,Math.floor(pgEntre(A.ini,pgDiaK(ms))/7)+1));
function pgInforme(A,est,cerr,cat){const fin=pgFin(A),hoy=est==='cancelado'?pgDiaK(Date.parse(cerr)):pgSuma(fin,1),cancel=est==='cancelado'?hoy:null;
  const sids=pgSids(A),cuenta={},estados={};sids.forEach(sid=>{const e=pgEstadoSes(A,sid,hoy,cancel);estados[sid]=e;cuenta[e]=(cuenta[e]||0)+1});
  const prog=sids.reduce((a,sid)=>{const d=pgDiaSid(A,sid);return a+pgSeries(d.pl,d.sem).reduce((x,y)=>x+y,0)},0);
  const sem=[1,2,3,4].map(()=>({Z:{},series:0,rir:[],conRir:0,validas:0})),ej={},inval={imposible:0,improbable:0,desconocida:0,dudosas:0,tiempo:0,saltado:0},bajas=[];
  for(const sid of sids)for(const I of pgInts(A,sid)){const R=pgResumen(I);if(I.dud)inval.dudosas++;if(R.inv)inval.tiempo++;
    for(const r of I.sets){if(r.plaus in inval)inval[r.plaus]++;if(r.restQ==='saltado')inval.saltado++;if(!pgValida(r,I,R))continue;
      const E=PG_EJ[I.plan[r.e].e],w=pgSemDe(A,Date.parse(r.t1)),S=sem[w-1];S.series++;S.validas++;if(r.rir!=='?'){S.rir.push(rirN(r.rir));S.conRir++}
      for(const [z,f] of Object.entries(musculos(E.n,E.g)))S.Z[z]=(S.Z[z]||0)+f;
      const o=ej[I.plan[r.e].e]||(ej[I.plan[r.e].e]={n:E.n,oc:{}});(o.oc[I.id]||(o.oc[I.id]={t:Date.parse(I.ini),f:pgDiaK(Date.parse(I.ini)),rows:[]})).rows.push(r)}}
  const ejs=Object.entries(ej).map(([eid,o])=>{const oc=Object.values(o.oc).sort((a,b)=>a.t-b.t).map(x=>{x.rows.sort((a,b)=>a.s-b.s);const k=x.rows[0].kg;
      return {f:x.f,kg:k,reps:x.rows.map(r=>r.reps),kgs:x.rows.map(r=>r.kg),rir:x.rows.map(r=>r.rir),e1:Math.max(...x.rows.map(r=>r.kg>0?r.kg*(1+(r.reps+(r.rir==='?'?0:rirN(r.rir)))/30):0))}});
    const a=oc[0],b=oc[oc.length-1],de=a&&b&&a.e1>0?(b.e1/a.e1-1):null;
    const mism=oc.filter(x=>pgClave(x.kg)===pgClave(b.kg)),dr=mism.length>1?mism[mism.length-1].reps.reduce((s,v)=>s+v,0)-mism[0].reps.reduce((s,v)=>s+v,0):null;
    let estanc=false;if(oc.length>=3){const u=oc.slice(-3);estanc=u[2].e1>0&&u[2].e1<=Math.max(u[0].e1,u[1].e1)*1.01}
    for(let i=1;i<oc.length;i++){const p=oc[i-1],c=oc[i];if(pgClave(p.kg)===pgClave(c.kg)&&p.reps[0]-c.reps[0]>=2)bajas.push(`${o.n} (${pgFTxt(c.f)})`)}
    return {eid,n:o.n,oc,de,dr,dkg:a&&b&&a.kg!=null&&b.kg!=null?b.kg-a.kg:null,estanc}});
  const semV=sem.map((S,i)=>({w:i+1,series:S.validas,rir:S.rir.length?S.rir.reduce((a,x)=>a+x,0)/S.rir.length:null,pctRir:S.validas?S.conRir/S.validas:null,Z:S.Z}));
  // fatiga: «cómo llegas» (sueño y energía) de los días del ciclo, si los anotaste
  const B=typeof leerBien==='function'?leerBien():{},fat=[1,2,3,4].map(w=>{const v=Object.keys(B).filter(k=>k>=pgSuma(A.ini,(w-1)*7)&&k<=pgSuma(A.ini,w*7-1)).map(k=>B[k]);
    const m=(a)=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;return {w,n:v.length,sueno:m(v.filter(b=>b.sueno!=null).map(b=>+b.sueno)),energia:m(v.filter(b=>b.energia!=null).map(b=>+b.energia))}});
  // medidas corporales (lo único que se acerca a «crecimiento»): la más cercana al inicio y la más cercana al final (±7 días)
  const M=(typeof medidas!=='undefined'?medidas:[]).slice().sort((a,b)=>a.f<b.f?-1:1),cerca=(k)=>M.filter(m=>Math.abs(pgEntre(k,m.f))<=7).sort((a,b)=>Math.abs(pgEntre(k,a.f))-Math.abs(pgEntre(k,b.f)))[0];
  const m0=cerca(A.ini),m1=cerca(est==='cancelado'?hoy:fin),med=m0&&m1&&m0.f!==m1.f?{a:m0,b:m1}:null;
  const hechas=(cuenta.completado||0)+(cuenta.parcial||0),validas=semV.reduce((a,s)=>a+s.series,0);
  const rec=pgRecomienda({cuenta,hechas,validas,prog,ejs,semV,inval,bajas,fat,est});
  return {id:A.id,ini:A.ini,fin,est,cerr,cat,cuenta,estados,hechas,adh:hechas/24,adhC:(cuenta.completado||0)/24,prog,validas,adhS:prog?validas/prog:0,semV,ejs,inval,bajas,fat,med,rec}}
function pgRecomienda(x){const r=[],z=(m,w)=>x.semV[w]&&x.semV[w].Z[m]||0;
  if(x.est==='cancelado')r.push('El ciclo se canceló antes de terminar: los datos sirven como referencia de cargas, pero no para juzgar el programa.');
  if(x.hechas/24<.75)r.push(`Adherencia de ${Math.round(100*x.hechas/24)} %: antes de añadir volumen, ajusta el calendario o el tiempo por sesión para poder cumplirlo.`);
  const sube=x.ejs.filter(e=>(e.de!=null&&e.de>.02)||(e.dkg>0)).map(e=>e.n),est=x.ejs.filter(e=>e.estanc).map(e=>e.n);
  if(sube.length)r.push(`Progresaron (carga o 1RM estimado): ${sube.join(', ')}. Mantén esos ejercicios y parte de las cargas de la semana 4.`);
  if(est.length)r.push(`Sin mejora en sus tres últimas apariciones: ${est.join(', ')}. Prueba una variante del mismo patrón, otro rango de repeticiones o revisa técnica y descanso.`);
  if(x.bajas.length>=3)r.push(`Hubo ${x.bajas.length} caídas de rendimiento con la misma carga: empieza el siguiente mesociclo con una semana de descarga (≈50 % del volumen, lejos del fallo).`);
  else r.push('Tras cuatro semanas exigentes conviene una semana de descarga (≈50 % del volumen, 3+ en reserva) antes del siguiente mesociclo.');
  const pr=x.semV.filter(s=>s.series).map(s=>s.pctRir);if(pr.length&&Math.min(...pr)<.7)r.push('Anota la reserva en más series: sin ella la progresión no puede decidir subidas de carga.');
  for(const [m,lo,n] of [['dorsal',10,'dorsal (anchura de espalda)'],['del_lat',8,'deltoide lateral'],['pecho_sup',6,'pecho superior']]){const w=[1,2,3].map(i=>z(m,i)).filter(v=>v>0);
    if(w.length&&Math.max(...w)<lo)r.push(`El ${n} se quedó en ${num(Math.max(...w))} series semanales como máximo (orientativo ≥ ${lo}): si la recuperación lo permite, añade 2–3 series.`)}
  if(x.inval.imposible||x.inval.tiempo||x.inval.dudosas)r.push(`Hubo registros que no contaron (${x.inval.imposible} series con tiempo imposible, ${x.inval.tiempo} sesiones en tiempo imposible, ${x.inval.dudosas} con la hora no verificable): toca «Empezar» al empezar cada serie.`);
  const f=x.fat.filter(s=>s.energia!=null);if(f.length>=2&&f[f.length-1].energia<f[0].energia-.75)r.push('Tu energía anotada bajó a lo largo del ciclo: prioriza sueño y descarga antes de subir volumen.');
  return r}

/* ---------- interfaz ---------- */
let pgUI={msg:'',msgT:0,dia:null,dlg:null,form:{},verInf:null,conf:false,iniSel:null,omitTodo:false,repro:null,canc:{cat:'',mot:'',frase:'',conf:false},ab:{mot:'',frase:''},finR:null,segR:null};
let pgVerInforme=null;
const pgMemo={};
const pgPon=(id,h)=>{const el=$(id);if(!el)return;if(pgMemo[id]!==h){pgMemo[id]=h;el.innerHTML=h}};
const pgSay=(m)=>{pgUI.msg=m;pgUI.msgT=Date.now()+6000};
const pgChip=e=>`<span class="pgest pg-${e}">${PG_ESTN[e]||e}</span>`;
const pgKgTxt=e=>e.cp?'peso corporal':e.kg!=null?kgTxt(e.kg):'<b class="pgcal">pendiente de calibración</b>';
function pgCardHTML(t){const f=pgFase(t);
  if(f==='ninguno'){const u=PGS.arch[PGS.arch.length-1];return `<div class="card pgcard"><div class="pgcard-h"><b>${PG_NOMBRE.toUpperCase()}</b></div><p class="hint">4 semanas · 24 sesiones y 4 descansos · progresión doble. Consúltalo y actívalo cuando quieras.</p><div class="tog"><button type="button" class="btn2" data-pg="abrir">Ver el programa</button>${u?`<button type="button" class="btn2" data-pg="informe" data-id="${esc(u.id)}">Último informe</button>`:''}</div></div>`}
  const A=pgA();
  if(f==='programado')return `<div class="card pgcard"><div class="pgcard-h"><b>${PG_NOMBRE.toUpperCase()}</b>${pgChip('pendiente')}</div><p>Empieza el <b>${pgFTxt(A.ini)}</b>. El bloqueo empezará ese día a las 0:00 y terminará el ${pgFTxt(pgFin(A))} a las 23:59 (hora de Santo Domingo).</p><button type="button" class="btn2" data-pg="abrir">Ver el programa</button></div>`;
  const h=pgDiaK(t),dn=pgEntre(A.ini,h)+1,sem=Math.min(4,Math.ceil(dn/7));
  if(PGS.cur){const d=pgDiaSid(A,PGS.cur.sid);return `<div class="card pgcard pgon"><div class="pgcard-h"><b>Sesión en curso</b>${pgChip('curso')}</div><p>${esc(PG_PLANT[d.pl].n)} · día ${d.n} de 28</p><button type="button" class="pgmain" data-pg="volver">Volver al entrenamiento</button></div>`}
  const hoy=pgSids(A).find(sid=>pgFechaSes(A,sid)===h),eh=hoy?pgEstadoSes(A,hoy,h):'descanso';
  const bot=hoy&&eh==='hoy'?`<button type="button" class="pgmain" data-pg="entrar" data-sid="${hoy}">Entrenar ahora: ${esc(PG_PLANT[pgDiaSid(A,hoy).pl].n)}</button>`:'';
  return `<div class="card pgcard pgon"><div class="pgcard-h"><b>Día ${Math.min(28,dn)} de 28 · semana ${sem}</b>${pgChip(eh)}</div><p class="pglock">${esc(pgMsgBloqueo(t))}</p>${bot}<button type="button" class="lnk" data-pg="abrir">Calendario y prescripciones</button></div>`}
function pgCalHTML(A,h,cancel){const cal=pgCalendario(A,h,cancel);
  return `<div class="pgcal7">${PG_DOW.map(d=>`<span class="pgdw">${d.slice(0,2)}</span>`).join('')}${cal.map(c=>{const nom=c.ses?PG_PLANT[pgDiaSid(A,c.ses).pl]:null;
    const sub=c.est==='reprogramado'?'→ '+pgFTxt(c.a):c.est==='descanso'?'Descanso':nom?nom.n.split(' ')[0]+' '+(nom.n.split(' ')[1]||''):'';
    return `<button type="button" class="pgdia pg-${c.est}${c.hoy?' pghoy':''}${pgUI.dia===c.f?' pgsel':''}" data-pg="dia" data-f="${c.f}" aria-label="Día ${c.n}, ${pgFTxt(c.f)}: ${esc(sub)} · ${PG_ESTN[c.est]}"><b>${c.n}</b><small>${esc(sub)}</small></button>`}).join('')}</div>
    <p class="hint pgley">${['hoy','curso','completado','parcial','omitido','abandonado','seguridad','reprogramado','descanso'].map(pgChip).join(' ')}</p>`}
function pgPrescHTML(P,abierto){if(!P)return '';const vol=Object.entries(P.vol.Z).filter(([,o])=>o.dir>0).sort((a,b)=>b[1].dir-a[1].dir).map(([z,o])=>`${esc(MUS[z]?MUS[z][3]:z)} ${num(o.dir)}${o.ind?` (+${num(o.ind)})`:''}`).join(' · ');
  return `<div class="pgpres"><p class="hint">${esc(P.nota)} · ${P.series} series programadas.</p>${P.ejs.map((e,i)=>`<details class="pgejd"${abierto?' open':''}><summary><b>${i+1}. ${esc(e.n)}</b> · ${e.series} × ${e.lo}–${e.hi}</summary>
    <ul class="pgul"><li>Repeticiones objetivo por serie: <b>${e.reps.join(' · ')}</b> (rango permitido ${e.lo}–${e.hi})</li><li>Carga objetivo: ${pgKgTxt(e)}${e.ptxt&&e.fuente!=='calibrar'?` <span class="hint">— ${esc(e.ptxt)}</span>`:''}</li>
    <li>Reserva (RIR) por serie: ${e.rir.map(pgRirTxt).join(' · ')}</li><li>Descanso entre series: ${fmt(e.rest)}</li><li>Calentamiento: ${esc(e.cal)}</li><li>Técnica: ${esc(e.tec)}</li></ul></details>`).join('')}
    <p class="hint"><b>Volumen de la sesión</b> (series directas y, entre paréntesis, indirectas ponderadas): ${vol}</p></div>`}
function pgPantallaHTML(t){const h=pgDiaK(t),A=pgA();let out='';
  if(pgUI.msg&&Date.now()<pgUI.msgT)out+=`<div class="aviso-d" role="status">${esc(pgUI.msg)}</div>`;
  if(pgVerInforme){const a=PGS.arch.find(x=>x.id===pgVerInforme);if(a)return out+pgInformeHTML(pgInforme(a,a.est,a.cerr,a.cat))+`<button type="button" class="btn2" data-pg="cerrarInf">Volver</button>`}
  out+=`<h2>${PG_NOMBRE}</h2><p class="hint">Máximo desarrollo recuperable con prioridad en anchura de espalda, deltoide lateral y pecho superior; piernas equilibradas. Lunes espalda A · martes pecho A · miércoles descanso · jueves piernas A · viernes espalda B · sábado pecho B · domingo piernas B, cuatro semanas.</p>`;
  if(pgAviso==='atras')out+=`<div class="aviso-d">La hora del teléfono va por detrás de la última hora vista: se usa la última conocida. Pon el teléfono en hora automática.</div>`;
  if(!A){const op=pgLunesOpc(t),sel=pgUI.iniSel&&op.includes(pgUI.iniSel)?pgUI.iniSel:op[0];
    out+=`<div class="card"><h2>Activar</h2><label class="lbl" for="pgIni">Primer día (siempre lunes)</label><select id="pgIni" data-pgin="iniSel">${op.map(k=>`<option value="${k}"${k===sel?' selected':''}>${pgFTxt(k)}${k===h?' (hoy)':''}</option>`).join('')}</select>
      <p>Bloqueo: del <b>${pgFTxt(sel)} a las 0:00</b> al <b>${pgFTxt(pgSuma(sel,27))} a las 23:59</b> (hora de Santo Domingo).</p>
      <p class="hint">Durante esos 28 días no podrás iniciar otros entrenamientos ni programas del reloj, adelantar sesiones ni reiniciar el programa. Siempre podrás: salir por seguridad al instante, cancelar el compromiso por causa justificada, ver tus datos y ajustes y hacer copias.</p>
      <label class="pgchk"><input type="checkbox" data-pgin="conf"${pgUI.conf?' checked':''}> Entiendo el compromiso de 28 días</label>
      <button type="button" class="pgmain" data-pg="activar"${pgUI.conf?'':' aria-disabled="true"'}>Activar compromiso de 28 días</button></div>`;
    const V={ini:op[0],ses:{},rep:{},id:'vista'};out+=`<h2>Calendario (vista previa)</h2>${pgCalHTML(V,h)}`;
    out+=`<h2>Las 24 prescripciones</h2>`+pgDias(op[0]).filter(d=>d.sid).map(d=>`<details class="pgdd"><summary>Día ${d.n} · ${PG_DOW[d.dw]} · semana ${d.sem} · ${esc(PG_PLANT[d.pl].n)}</summary>${pgPrescHTML(pgPresc(d.sid,{},V))}</details>`).join('');
    if(PGS.arch.length)out+=`<h2>Programas anteriores</h2><div class="card">${PGS.arch.slice().reverse().map(a=>`<button type="button" class="btn2" data-pg="informe" data-id="${esc(a.id)}">${pgFTxt(a.ini)} · ${a.est==='cancelado'?'cancelado':'terminado'} · ver informe</button>`).join('')}</div>`;
    return out}
  const f=pgFase(t);
  out+=`<div class="card"><p><b>${f==='programado'?'Programado':'Compromiso activo'}</b>: del ${pgFTxt(A.ini)} (0:00) al ${pgFTxt(pgFin(A))} (23:59), hora de Santo Domingo.</p>${f==='programado'?'':`<p class="pglock">${esc(pgMsgBloqueo(t))}</p>`}
    ${f==='programado'?'<button type="button" class="btn2" data-pg="desprog">Desprogramar (aún no ha empezado)</button>':''}</div>`;
  out+=pgCalHTML(A,h);
  const sel=pgUI.dia||h,c=pgCalendario(A,h).find(x=>x.f===sel)||null;
  if(c){out+=`<div class="card pgdetalle"><h2>Día ${c.n} · ${pgFTxt(c.f)}</h2>`;
    if(c.est==='descanso')out+=`<p>Descanso: sin series de fuerza ni de hipertrofia. Camina, duerme y come bien.</p>`;
    else if(c.est==='reprogramado')out+=`<p>${pgChip('reprogramado')} Esta sesión se movió al ${pgFTxt(c.a)} (antes: ${PG_ESTN[c.antes].toLowerCase()}).</p>`;
    else{const sid=c.ses,e=c.est,d=pgDiaSid(A,sid);out+=`<p>${pgChip(e)} <b>${esc(PG_PLANT[d.pl].n)}</b> · semana ${d.sem}${c.movida?` · reprogramada desde el ${pgFTxt(d.f)}`:''}</p>`;
      if(e==='hoy')out+=`<button type="button" class="pgmain" data-pg="entrar" data-sid="${sid}">Entrenar ahora</button>`;
      if(e==='curso')out+=`<button type="button" class="pgmain" data-pg="volver">Volver al entrenamiento</button>`;
      const op=pgOpcRepro(sid,t);if(['omitido','abandonado','seguridad'].includes(e)&&!A.rep[sid])out+=op.length?`<p class="hint">Reprogramar (una vez, a un miércoles libre sin el mismo grupo el día antes ni el después):</p><div class="tog">${op.map(k=>`<button type="button" class="btn2" data-pg="repro" data-sid="${sid}" data-f="${k}">${pgFTxt(k)}</button>`).join('')}</div>`
        :`<p class="hint">No hay un día compatible para reprogramarla sin poner el mismo grupo dos días seguidos o quitar un descanso necesario: queda como ${PG_ESTN[e].toLowerCase()}. No se acumula su volumen en otra sesión.</p>`;
      const I=pgInts(A,sid);if(I.length)out+=`<p class="hint">Registros: ${I.map(x=>{const R=pgResumen(x);return `${pgHTxt(Date.parse(x.ini))} ${PG_ESTN[x.est]||x.est} · ${R.validas}/${R.total} series válidas${x.mot?' · '+esc(x.mot):''}${x.dud?' · hora no verificable':''}`}).join(' | ')}</p>`;
      out+=pgPrescHTML(pgPresc(sid,{int:I.find(x=>x.est==='curso')||null}),false)}
    out+=`</div>`}
  out+=`<details class="pgdd"><summary>Las 24 prescripciones</summary>${pgDias(A.ini).filter(d=>d.sid).map(d=>`<details class="pgdd"><summary>Día ${d.n} · ${pgFTxt(d.f)} · ${esc(PG_PLANT[d.pl].n)}</summary>${pgPrescHTML(pgPresc(d.sid))}</details>`).join('')}</details>`;
  out+=`<div class="card"><h2>Cancelar el compromiso</h2><p class="hint">Por causa justificada. Queda registrado con su motivo y los datos se conservan. Por lesión o enfermedad basta confirmarlo.</p><button type="button" class="btn2" data-pg="cancelar">Cancelar el programa…</button></div>`;
  return out}
function pgEntHTML(t){const A=pgA(),c=PGS.cur;if(!A||!c)return '<p>No hay sesión en curso.</p><button type="button" class="btn2" data-pg="abrir">Ver el programa</button>';
  const I=pgIntCur(),d=pgDiaSid(A,c.sid),P=pgPresc(c.sid,{int:I}),R=pgResumen(I),v=c.fase==='serie'||c.fase==='registro'?c.ej:c.ver,E=P.ejs[v],s=pgPend(I,v),actual=v===c.ej;
  const F={lista:R.hechas||R.omit?'Lista para la siguiente serie':'Sesión iniciada · nada registrado todavía',serie:'Serie en curso',registro:'Registra lo que hiciste',descanso:'Descanso',pausa:'En pausa',fin:'Todas las series resueltas · finaliza la sesión'}[c.fase];
  const sig=I.plan.map((_,i)=>i).find(i=>i!==c.ej&&pgPend(I,i)>=0&&i>c.ej)??I.plan.map((_,i)=>i).find(i=>i!==c.ej&&pgPend(I,i)>=0);
  let h='';if(pgUI.msg&&Date.now()<pgUI.msgT)h+=`<div class="aviso-d" role="status">${esc(pgUI.msg)}</div>`;
  if(t-c.ult>=PG_OLVIDADA_H*36e5)h+=`<div class="aviso-d">Esta sesión lleva más de ${PG_OLVIDADA_H} h sin actividad. Continúa o ciérrala como no terminada (quedará como abandonada, con lo que registraste). <button type="button" class="btn2" data-pg="olvidada">Cerrar como no terminada</button></div>`;
  h+=`<div class="pgtop"><div><b>${esc(P.nom)}</b><span class="hint">Día ${d.n} de 28 · semana ${d.sem}${A.rep[c.sid]?' · reprogramada':''}</span></div>
    <button type="button" class="pgseg" data-pg="seg" aria-label="Salida por seguridad: lesión, dolor, enfermedad o emergencia">⚠ Salida por seguridad</button></div>
    <div class="pgbarra" role="progressbar" aria-label="Progreso de la sesión" aria-valuemin="0" aria-valuemax="${R.total}" aria-valuenow="${R.hechas+R.omit}"><i style="width:${Math.round(100*(R.hechas+R.omit)/Math.max(1,R.total))}%"></i></div>
    <p class="pgfase" aria-live="polite"><b>${F}</b> · ${R.hechas} registradas · ${R.omit} omitidas · ${R.pend} pendientes de ${R.total}</p>`;
  h+=`<div class="card pgej"><div class="lbl">Ejercicio ${v+1} de ${P.ejs.length}${actual?'':' · solo consulta'}</div><h2>${esc(E.n)}</h2>`;
  if(s>=0){const kgO=E.kg;h+=`<p class="pgobj">Serie <b>${s+1} de ${E.series}</b> · objetivo <b>${E.reps[s]} reps</b> (rango ${E.lo}–${E.hi}) · reserva <b>${pgRirTxt(E.rir[s])}</b></p>
      <p>Carga objetivo: ${pgKgTxt(E)}${E.aj?' (ajustada hoy)':''}${E.ptxt?`<br><span class="hint">${esc(E.ptxt)}</span>`:''}</p><p>Descanso programado: <b>${fmt(E.rest)}</b></p>`}
  else h+=`<p>Ejercicio resuelto: ${I.sets.filter(r=>r.e===v).map(r=>`${r.reps}×${r.kg!=null?kgTxt(r.kg):'—'}`).join(', ')||'—'}${I.omit.some(o=>o.e===v)?' · con series omitidas':''}</p>`;
  h+=`<div class="pgcrono" id="pgCrono" aria-live="off">${pgCronoTxt(t)}</div>`;
  if(actual||c.fase==='serie'||c.fase==='registro'){
    if(c.fase==='lista'||c.fase==='descanso')h+=`<button type="button" class="pgmain" data-pg="empezar">Empezar serie ${s+1}</button>`;
    if(c.fase==='serie')h+=`<button type="button" class="pgmain pgwork" data-pg="terminar">Terminar serie</button><button type="button" class="lnk" data-pg="cancSerie">La empecé sin querer: cancelar</button>`;
    if(c.fase==='registro'){const f=pgUI.form;if(f.k!==I.id+v+s){const prevKg=I.sets.filter(r=>r.e===v).map(r=>r.kg).pop();Object.assign(f,{k:I.id+v+s,reps:E.reps[s],kg:prevKg!==undefined?prevKg:E.kg,rir:null,olvido:false,sinCarga:false})}
      h+=`<div class="pgreg"><div class="pgcampo"><label class="lbl" for="pgReps">Repeticiones hechas</label><div class="pgstep"><button type="button" class="btn2" data-pg="menos" data-c="reps" aria-label="Una repetición menos">−</button><input id="pgReps" inputmode="numeric" data-pgin="reps" value="${esc(f.reps??'')}"><button type="button" class="btn2" data-pg="mas" data-c="reps" aria-label="Una repetición más">+</button></div></div>
        ${E.cp?'':`<div class="pgcampo"><label class="lbl" for="pgKg">Carga real (${uTxt()})</label><div class="pgstep"><button type="button" class="btn2" data-pg="menos" data-c="kg" aria-label="Menos carga">−</button><input id="pgKg" inputmode="decimal" data-pgin="kg" value="${f.kg!=null?esc(num(aU(f.kg))):''}"><button type="button" class="btn2" data-pg="mas" data-c="kg" aria-label="Más carga">+</button></div>
          <label class="pgchk"><input type="checkbox" data-pgin="sinCarga"${f.sinCarga?' checked':''}> No sé la carga</label></div>`}
        <div class="pgcampo"><span class="lbl">Reserva (RIR)</span><div class="tog">${PG_RIRS.map(r=>`<button type="button" class="btn2" data-pg="rir" data-r="${r}" aria-pressed="${f.rir===r}">${r==='?'?'No sé':r}</button>`).join('')}</div></div>
        <label class="pgchk"><input type="checkbox" data-pgin="olvido"${f.olvido?' checked':''}> Olvidé tocar «Empezar» (duración desconocida; ${PG_OLV_MAX-c.olv} restantes)</label>
        <button type="button" class="pgmain" data-pg="registrar">Registrar serie ${s+1}</button><button type="button" class="lnk" data-pg="cancSerie">No la hice: cancelar</button></div>`}
  }else if(s>=0&&['lista','descanso'].includes(c.fase))h+=`<button type="button" class="btn2" data-pg="hacer" data-i="${v}">Hacer este ejercicio ahora</button>`;
  h+=`<details><summary>Técnica y calentamiento</summary><p>${esc(E.tec)}</p><p class="hint">Calentamiento: ${esc(E.cal)}</p></details></div>`;
  h+=`<p class="pgnext">Próximo: ${sig!=null?esc(P.ejs[sig].n)+` · ${P.ejs[sig].series} × ${P.ejs[sig].lo}–${P.ejs[sig].hi}`:'—'}</p>`;
  h+=`<div class="pgsec">${c.fase==='pausa'?'<button type="button" class="btn2" data-pg="reanudar">Reanudar</button>':['lista','descanso','fin'].includes(c.fase)?'<button type="button" class="btn2" data-pg="pausa">Pausa</button>':''}
    ${['lista','descanso','fin','pausa'].includes(c.fase)&&s>=0?`<button type="button" class="btn2" data-pg="omitir" data-i="${v}">Omitir serie…</button>`:''}</div>`;
  h+=`<div class="card"><span class="lbl">Ejercicios (tocar uno solo lo muestra; no lo completa)</span><div class="pglista">${P.ejs.map((e,i)=>{const hc=I.sets.filter(r=>r.e===i).length,om=I.omit.filter(o=>o.e===i).length;
    return `<button type="button" class="pgli${i===v?' pgsel':''}${i===c.ej?' pgact':''}" data-pg="ver" data-i="${i}" aria-current="${i===v}"><b>${i+1}. ${esc(e.s)}</b><small>${hc}/${e.series}${om?` · ${om} omit.`:''}</small></button>`}).join('')}</div></div>`;
  if(I.sets.length)h+=`<div class="card"><span class="lbl">Series registradas</span><table class="pgtab"><tr><th>Ejercicio</th><th>Reps</th><th>${uTxt()}</th><th>RIR</th><th>Dur.</th><th>Desc.</th></tr>${I.sets.slice().reverse().map(r=>`<tr${r.plaus==='imposible'?' class="pginv"':''}><td>${esc(P.ejs[r.e].s)} ${r.s+1}</td><td>${r.reps}</td><td>${r.kg!=null?num(aU(r.kg)):'—'}</td><td>${r.rir}</td><td>${r.dur!=null?num(r.dur)+' s':'?'}</td><td>${r.restR!=null?fmt(r.restR):'—'}</td></tr>`).join('')}</table>${R.imposibles?`<p class="hint">${R.imposibles} serie(s) con un tiempo imposible para sus repeticiones: no cuentan.</p>`:''}</div>`;
  h+=`<div class="pgfin"><button type="button" class="btn2 pgfinb" data-pg="finalizar">Finalizar sesión</button><button type="button" class="lnk" data-pg="abandonar">Abandonar entrenamiento…</button></div>`;
  return h}
function pgCronoTxt(t){const c=PGS.cur;if(!c)return '';
  if(c.fase==='serie')return `<small>Serie</small> ${fmt((t-c.ser0)/1000)}`;
  if(c.fase==='registro')return `<small>Serie terminada en</small> ${fmt((c.fin0-c.ser0)/1000)}`;
  if(c.fase==='descanso'){const e=(t-c.desc0-(c.descPz||0))/1000,r=(c.descPlan||0)-e;return r>0?`<small>Descanso · quedan</small> ${fmt(r)}`:`<small>Descanso cumplido · +</small>${fmt(-r)}`}
  if(c.fase==='pausa')return `<small>En pausa</small> ${fmt((t-c.pausa.t)/1000)}`;
  return `<small>Sesión</small> ${fmt((t-Date.parse(pgIntCur().ini))/1000)}`}
function pgInformeHTML(x){const p=v=>Math.round(100*v)+' %',z=Object.keys(MUS);
  const tabla=`<table class="pgtab"><tr><th>Músculo</th>${x.semV.map(s=>`<th>S${s.w}</th>`).join('')}</tr>${z.filter(m=>x.semV.some(s=>s.Z[m])).map(m=>`<tr><td>${esc(MUS[m][3])}</td>${x.semV.map(s=>`<td>${s.Z[m]?num(s.Z[m]):'—'}</td>`).join('')}</tr>`).join('')}</table>`;
  return `<div class="card pginf"><h2>Informe · ${pgFTxt(x.ini)} – ${pgFTxt(x.fin)}</h2><p>${x.est==='cancelado'?`<b>Cancelado</b> el ${pgFTxt(pgDiaK(Date.parse(x.cerr)))}${x.cat?' ('+esc(PG_CAN[x.cat])+')':''}.`:'<b>Ciclo terminado.</b>'}</p>
    <p><b>Sesiones:</b> 24 programadas · ${x.hechas} realizadas (${x.cuenta.completado||0} completas, ${x.cuenta.parcial||0} parciales) · ${x.cuenta.omitido||0} omitidas · ${x.cuenta.abandonado||0} abandonadas · ${x.cuenta.seguridad||0} interrumpidas por seguridad${x.cuenta.cancelado?` · ${x.cuenta.cancelado} sin hacer por la cancelación`:''}.</p>
    <p><b>Adherencia:</b> ${p(x.adh)} de las sesiones (${p(x.adhC)} completas) · ${p(x.adhS)} de las series programadas (${x.validas} válidas de ${x.prog}).</p>
    <h3>Volumen semanal por músculo</h3><p class="hint">Series válidas: 1 al músculo principal y la fracción habitual a los que ayudan.</p>${tabla}
    <h3>Reserva (RIR) anotada</h3><p>${x.semV.map(s=>`S${s.w}: ${s.rir!=null?num(s.rir):'—'}${s.pctRir!=null?` (${p(s.pctRir)} con reserva)`:''}`).join(' · ')}</p>
    <h3>Progresión por ejercicio</h3>${x.ejs.length?`<table class="pgtab"><tr><th>Ejercicio</th><th>Cargas</th><th>Reps</th><th>1RM est.</th></tr>${x.ejs.map(e=>`<tr><td>${esc(e.n)}${e.estanc?' · estancado':''}</td><td>${e.oc.map(o=>o.kg!=null?num(aU(o.kg)):'c').join('→')}</td><td>${e.oc.map(o=>o.reps.join('-')).join(' | ')}</td><td>${e.de!=null?(e.de>=0?'+':'')+Math.round(e.de*100)+' %':'—'}</td></tr>`).join('')}</table>`:'<p>Sin series válidas.</p>'}
    <h3>Sesiones no completadas</h3><p>${Object.entries(x.estados).filter(([,e])=>!['completado','parcial'].includes(e)).map(([sid,e])=>`${sid}: ${PG_ESTN[e]}`).join(' · ')||'Ninguna.'}</p>
    <h3>Registros inválidos detectados</h3><p>${x.inval.imposible} series con tiempo imposible · ${x.inval.improbable} improbables (cuentan pero no progresan) · ${x.inval.desconocida} con duración desconocida · ${x.inval.tiempo} sesiones en tiempo imposible · ${x.inval.dudosas} con la hora no verificable · ${x.inval.saltado} descansos más cortos de lo programado.</p>
    <h3>Fatiga</h3><p>${x.fat.some(s=>s.n)?x.fat.map(s=>`S${s.w}: ${s.n?`sueño ${s.sueno!=null?num(s.sueno)+' h':'—'}, energía ${s.energia!=null?num(s.energia)+'/5':'—'}`:'sin datos'}`).join(' · '):'Sin datos de «cómo llegas» en estas semanas.'}${x.bajas.length?` · Caídas de rendimiento con la misma carga: ${esc(x.bajas.join(', '))}.`:''}</p>
    <h3>Rendimiento no es crecimiento</h3><p>Este informe mide rendimiento (cargas, repeticiones, reserva) y cumplimiento. Más peso o más repeticiones no demuestran hipertrofia: puede ser técnica, coordinación o adaptación neural. Para hablar de crecimiento hacen falta medidas.${x.med?` Tus medidas: ${MED_K.filter(k=>x.med.a[k]!=null&&x.med.b[k]!=null).map(k=>`${k} ${num(x.med.a[k])} → ${num(x.med.b[k])} cm`).join(' · ')||'sin la misma medida al inicio y al final'} (${pgFTxt(x.med.a.f)} → ${pgFTxt(x.med.b.f)}; la variación diaria y de la cinta puede ser de ±0,5–1 cm).`:' No hay medidas al inicio y al final del ciclo: no se puede afirmar crecimiento muscular.'}</p>
    <h3>Recomendaciones para el siguiente mesociclo</h3><ul class="pgul">${x.rec.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`}
// diálogos
function pgDlgHTML(t){const k=pgUI.dlg,c=PGS.cur,I=pgIntCur();
  if(k==='seg'){if(pgUI.segR){const r=pgUI.segR,A=pgA();return ['Salida por seguridad',`<p><b>Sesión interrumpida por seguridad.</b> Se conserva lo que hiciste y no cuenta como completada.</p>
      <p class="hint">Prioriza la recuperación. Ante dolor fuerte, lesión o síntomas de enfermedad, consulta a un profesional sanitario antes de volver a entrenar esa zona. Si es una molestia localizada, «Cuidar una zona» (Ajustes) adapta los ejercicios.</p>
      ${r.opc&&r.opc.length?`<p>Puedes reprogramarla (como pronto en 48 h):</p><div class="tog">${r.opc.map(f=>`<button type="button" class="btn2" data-pg="repro" data-sid="${r.sid}" data-f="${f}">${pgFTxt(f)}</button>`).join('')}</div>`:`<p class="hint">No hay un día compatible para reprogramarla dentro del ciclo: quedará como interrumpida, sin acumular su volumen en otra sesión.</p>`}
      <button type="button" class="btn2" data-pg="cerrarDlg">Entendido</button>`]}
    return ['Salida por seguridad',`<p>Toca el motivo y sales <b>ahora mismo</b>, sin esperas ni frases. Lo que ya hiciste se conserva.</p><div class="pgsegl">${Object.entries(PG_SEG).map(([k,n])=>`<button type="button" class="pgsegb" data-pg="segOk" data-cat="${k}">${n}</button>`).join('')}</div>`]}
  if(!c&&k!=='cancelar'&&k!=='fin')return null;
  if(k==='omitir'){const v=+pgUI.omitI,E=PG_EJ[I.plan[v].e];return ['Omitir',`<p>${esc(E.n)}: la serie no se hizo. No sumará volumen ni repeticiones.</p>
    <label class="pgchk"><input type="checkbox" data-pgin="omitTodo"${pgUI.omitTodo?' checked':''}> Omitir todas las series pendientes de este ejercicio</label><p class="lbl">Motivo</p><div class="pgsegl">${Object.entries(PG_OMIT).map(([q,n])=>`<button type="button" class="btn2" data-pg="omitirOk" data-por="${q}">${n}</button>`).join('')}</div>`]}
  if(k==='abandonar'){const R=pgResumen(I),pend=I.plan.map((p,i)=>{const n=p.n-I.sets.filter(r=>r.e===i).length-I.omit.filter(o=>o.e===i).length;return n>0?`${PG_EJ[p.e].s} ${n}`:''}).filter(Boolean);
    return ['Abandonar entrenamiento',`<p><b>Progreso:</b> ${R.hechas} de ${R.total} series registradas (${R.validas} válidas) · ${R.omit} omitidas.</p><p><b>Pendientes:</b> ${esc(pend.join(' · '))||'ninguna'}</p>
      <p class="hint">Quedará registrada como abandonada con fecha, hora, progreso real y motivo. No habilita otra sesión hoy. ¿Es por dolor, lesión o enfermedad? Usa la salida por seguridad: es inmediata.</p>
      <button type="button" class="pgseg" data-pg="seg">⚠ Es por seguridad</button>
      <label class="lbl" for="pgAbM">Motivo</label><textarea id="pgAbM" data-pgin="abMot" maxlength="300" rows="2">${esc(pgUI.ab.mot)}</textarea>
      <label class="lbl" for="pgAbF">Escribe «${PG_FRASE_AB}»</label><input id="pgAbF" data-pgin="abFrase" autocomplete="off" autocapitalize="characters" value="${esc(pgUI.ab.frase)}">
      <button type="button" id="pgHold" class="pghold" data-hold="1" aria-describedby="pgHoldT"><i id="pgHoldBar"></i><span>Mantén pulsado 15 s para abandonar</span></button><p id="pgHoldT" class="hint">Si sueltas antes, vuelve a empezar. También con la tecla Espacio o Intro mantenida.</p>`]}
  if(k==='fin'&&pgUI.finR){const r=pgUI.finR;return ['Sesión cerrada',`<p>${pgChip(r.est)} ${r.R.validas} de ${r.R.total} series válidas.</p>${r.est==='parcial'?'<p class="hint">Completada parcialmente: solo cuenta lo que hiciste de verdad.</p>':''}<button type="button" class="btn2" data-pg="cerrarDlg">Volver al programa</button>`]}
  if(k==='cancelar'){const C=pgUI.canc,salud=PG_CAN_SALUD.includes(C.cat);return ['Cancelar el programa',`<p>El programa se cerrará con su informe hasta hoy. Los datos se conservan; nada se borra.</p>
      <label class="lbl" for="pgCanC">Motivo</label><select id="pgCanC" data-pgin="canCat"><option value="">Elige…</option>${Object.entries(PG_CAN).map(([q,n])=>`<option value="${q}"${C.cat===q?' selected':''}>${n}</option>`).join('')}</select>
      ${salud?`<label class="pgchk"><input type="checkbox" data-pgin="canConf"${C.conf?' checked':''}> Confirmo que cancelo por ${PG_CAN[C.cat].toLowerCase()}</label>`
        :C.cat?`<label class="lbl" for="pgCanM">Explica el motivo</label><textarea id="pgCanM" data-pgin="canMot" rows="2" maxlength="300">${esc(C.mot)}</textarea><label class="lbl" for="pgCanF">Escribe «${PG_FRASE_CAN}»</label><input id="pgCanF" data-pgin="canFrase" autocomplete="off" value="${esc(C.frase)}">`:''}
      <button type="button" class="btn2 peligro" data-pg="cancelarOk">Cancelar el programa</button>`]}
  return null}
const pgDlgMsg=()=>pgUI.dlgMsg?`<div class="aviso-d" role="alert">${esc(pgUI.dlgMsg)}</div>`:'';
function pgAbreDlg(k){pgUI.dlg=k;pgUI.dlgMsg='';const r=pgDlgHTML(pgAhora()),d=$('pgDlg');if(!r||!d){pgUI.dlg=null;return}$('pgDlgT').textContent=r[0];pgMemo.pgDlgC=null;pgPon('pgDlgC',r[1]);try{if(!d.open)d.showModal()}catch(e){d.setAttribute('open','')}}
function pgCierraDlg(){pgUI.dlg=null;pgUI.dlgMsg='';pgUI.segR=null;pgUI.finR=null;pgSoltar();pgHoldFin();const d=$('pgDlg');try{if(d&&d.open)d.close()}catch(e){}}
function pgRepintaDlg(){if(!pgUI.dlg)return;const r=pgDlgHTML(pgAhora());if(r){$('pgDlgT').textContent=r[0];pgPon('pgDlgC',pgDlgMsg()+r[1])}}
let pgLastFase='';
function pgRender(){const t=pgAhora(),bl=pgBloqueaLibre(t),pad=$('pad');
  if(pad&&pad.setAttribute){pad.setAttribute('aria-disabled',String(bl));if(pad.classList)pad.classList.toggle('pglibre',bl)}
  {const el=$('pgCard'),h=tab==='reloj'?pgCardHTML(t):'';if(el){el.hidden=!h;pgPon('pgCard',h)}}
  {const el=$('pgCardHoy'),h=tab==='hoy'?pgCardHTML(t):'';if(el){el.hidden=!h;pgPon('pgCardHoy',h)}}
  if(tab==='programa')pgPon('vProgramaC',pgPantallaHTML(t));
  if(tab==='pgent')pgPon('vProgEntC',pgEntHTML(t));
  {const el=$('pgVolverAv');if(el){const v=!!PGS.cur&&tab!=='pgent';el.hidden=!v;pgPon('pgVolverAv',v?'<button type="button" class="pgmain" data-pg="volver">Sesión del programa en curso · volver</button>':'')}}}
const pgPinta=()=>{if(typeof render==='function')render();else pgRender()};
function pgResp(r,ok){if(!r)return;if(!r.ok){if(r.err!=='rebote'){pgSay(r.txt);if(pgUI.dlg){pgUI.dlgMsg=r.txt;pgRepintaDlg()}}vibrar(80)}else if(ok)ok(r);pgPinta()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-pg]');if(!b)return;const d=b.dataset,a=d.pg,t=pgAhora();
  if(b.getAttribute('aria-disabled')==='true'&&a!=='activar')return;
  switch(a){
    case 'abrir':pgVerInforme=null;tab='programa';pgPinta();window.scrollTo(0,0);break;
    case 'volver':tab='pgent';pgPinta();window.scrollTo(0,0);break;
    case 'entrar':pgResp(pgEntrar(d.sid,t),()=>{tab='pgent';pgUI.form={};beep(880,.15);vibrar(120);decir('Modo entrenamiento');window.scrollTo(0,0)});break;
    case 'empezar':pgResp(pgEmpezarSerie(t),()=>{beep(1320,.2);vibrar(200)});break;
    case 'terminar':pgResp(pgTerminarSerie(t),()=>vibrar(60));break;
    case 'cancSerie':pgResp(pgCancelarSerie(t));break;
    case 'registrar':{const f=pgUI.form,kg=f.sinCarga?null:f.kg;pgResp(pgRegistrar({reps:f.reps,kg,rir:f.rir??'?',olvido:f.olvido,sinCarga:f.sinCarga},t),r=>{pgUI.form={};vibrar([60,40,60]);if(PGS.cur&&PGS.cur.fase==='fin')decir('Todas las series resueltas');else decir('Serie registrada. Descanso')});break}
    case 'rir':pgUI.form.rir=d.r;pgMemo.vProgEntC=null;pgPinta();break;
    case 'mas':case 'menos':{const f=pgUI.form,sg=a==='mas'?1:-1;if(d.c==='reps')f.reps=Math.max(0,Math.min(100,(parseInt(f.reps,10)||0)+sg));
      else{const I=pgIntCur(),E=PG_EJ[I.plan[PGS.cur.ej].e],k=f.kg>0?f.kg:0;f.kg=sg>0?cambiaKg({n:E.n},k,1):Math.max(0,cambiaKg({n:E.n},k,-1));f.sinCarga=false}
      pgMemo.vProgEntC=null;pgPinta();break}
    case 'pausa':pgResp(pgPausa(t));break;
    case 'reanudar':pgResp(pgReanudar(t));break;
    case 'ver':pgVer(d.i);pgGuarda();pgPinta();break;
    case 'hacer':pgResp(pgCambiarEj(d.i,t));break;
    case 'omitir':pgUI.omitI=d.i;pgUI.omitTodo=false;pgAbreDlg('omitir');break;
    case 'omitirOk':{const r=pgOmitir(pgUI.omitI,pgUI.omitTodo,d.por,t);pgCierraDlg();pgResp(r);break}
    case 'finalizar':{const r=pgFinalizar(t);if(r.ok){pgUI.finR=r;tab='programa';pgAbreDlg('fin')}pgResp(r);break}
    case 'abandonar':pgUI.ab={mot:'',frase:''};pgAbreDlg('abandonar');break;
    case 'seg':pgUI.segR=null;if(!PGS.cur){pgSay('No hay sesión en curso.');pgPinta();break}pgAbreDlg('seg');break;
    case 'segOk':{const r=pgSeguridad(d.cat,'',t);if(r.ok){pgUI.segR=r;tab='programa';pgRepintaDlg();decir('Sesión interrumpida por seguridad')}pgResp(r);break}
    case 'olvidada':pgResp(pgCerrarOlvidada(t),()=>{tab='programa'});break;
    case 'dia':pgUI.dia=d.f;pgPinta();break;
    case 'repro':{const r=pgReprogramar(d.sid,d.f,t);if(r.ok){pgSay(`Reprogramada al ${pgFTxt(d.f)}.`);pgCierraDlg()}pgResp(r);break}
    case 'activar':if(!pgUI.conf){pgSay('Marca que entiendes el compromiso.');pgPinta();break}
      {const sel=pgUI.iniSel&&pgLunesOpc(t).includes(pgUI.iniSel)?pgUI.iniSel:pgLunesOpc(t)[0];pgResp(pgActivar(sel,t),()=>{pgUI.conf=false;pgSay(`Programa activado: del ${pgFTxt(sel)} al ${pgFTxt(pgSuma(sel,27))}.`)})}break;
    case 'desprog':pgResp(pgDesprogramar(t));break;
    case 'cancelar':pgUI.canc={cat:'',mot:'',frase:'',conf:false};pgAbreDlg('cancelar');break;
    case 'cancelarOk':{const C=pgUI.canc,r=pgCancelar({cat:C.cat,mot:C.mot,frase:C.frase,conf:C.conf},t);if(r.ok){pgCierraDlg();tab='programa'}else{pgRepintaDlg()}pgResp(r);break}
    case 'informe':pgVerInforme=d.id;tab='programa';pgPinta();window.scrollTo(0,0);break;
    case 'cerrarInf':pgVerInforme=null;pgPinta();break;
    case 'cerrarDlg':pgCierraDlg();pgPinta();break}});
document.addEventListener('input',e=>{const el=e.target.closest&&e.target.closest('[data-pgin]');if(!el)return;const k=el.dataset.pgin,v=el.type==='checkbox'?el.checked:el.value;
  if(k==='reps')pgUI.form.reps=v;else if(k==='kg'){const x=parseFloat(String(v).replace(',','.'));pgUI.form.kg=isFinite(x)?deU(x):null}
  else if(k==='sinCarga'||k==='olvido')pgUI.form[k]=v;else if(k==='conf'||k==='iniSel'){pgUI[k]=v;pgMemo.vProgramaC=null;pgPinta()}
  else if(k==='omitTodo')pgUI.omitTodo=v;else if(k==='abMot')pgUI.ab.mot=v;else if(k==='abFrase')pgUI.ab.frase=v;
  else if(k==='canCat'){pgUI.canc.cat=v;pgRepintaDlg()}else if(k==='canMot')pgUI.canc.mot=v;else if(k==='canFrase')pgUI.canc.frase=v;else if(k==='canConf')pgUI.canc.conf=v});
// sostener 15 s: lo mide la capa de estado (pgSostener / pgSoltar); aquí solo se dibuja la barra y, al cumplirse, se intenta abandonar
let pgHoldIv=0,pgSost=false;
function pgHoldFin(){pgSost=false;if(pgHoldIv){clearInterval(pgHoldIv);pgHoldIv=0}const b=$('pgHoldBar');if(b&&b.style)b.style.width='0%'}
function pgHoldIni(){if(!PGS.cur||pgSost)return;pgSost=true;pgSostener();vibrar(30);pgHoldIv=setInterval(()=>{if(!PGS.cur||!PGS.cur.hold){pgHoldFin();return}
  const e=pgAhora()-PGS.cur.hold,b=$('pgHoldBar');if(b&&b.style)b.style.width=Math.min(100,100*e/PG_HOLD)+'%';
  if(e>=PG_HOLD){pgHoldFin();const r=pgAbandonar({mot:pgUI.ab.mot,frase:pgUI.ab.frase});if(r.ok){pgCierraDlg();tab='programa';pgSay('Sesión registrada como abandonada.');decir('Sesión abandonada')}else{pgSoltar();pgSay(r.txt);pgUI.dlgMsg=r.txt;pgRepintaDlg()}pgPinta()}},100)}
function pgHoldSuelta(){pgSoltar();pgHoldFin()}
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('[data-hold]')){e.preventDefault();pgHoldIni()}});
['pointerup','pointercancel','pointerleave'].forEach(ev=>document.addEventListener(ev,e=>{if(pgSost&&(ev!=='pointerleave'||(e.target.dataset&&e.target.dataset.hold)))pgHoldSuelta()},true));
document.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&e.target.closest&&e.target.closest('[data-hold]')){e.preventDefault();if(!e.repeat)pgHoldIni()}});
document.addEventListener('keyup',e=>{if((e.key===' '||e.key==='Enter')&&e.target.closest&&e.target.closest('[data-hold]'))pgHoldSuelta()});
{const d=$('pgDlg');if(d&&d.addEventListener)d.addEventListener('close',()=>{if(pgUI.dlg){pgUI.dlg=null;pgSoltar();pgHoldFin();pgPinta()}})}
// cronómetro (solo el número; el resto se repinta al cambiar el estado), cambio de día y cierre del ciclo
let pgDiaVisto='',pgDescAvisado='';
setInterval(()=>{const t=pgAhora(),h=pgDiaK(t);
  if(PGS.cur&&tab==='pgent'){const el=$('pgCrono');if(el)el.innerHTML=pgCronoTxt(t);const c=PGS.cur;
    if(c.fase==='descanso'&&c.desc0){const r=(c.descPlan||0)-(t-c.desc0-(c.descPz||0))/1000,k=c.iid+c.desc0;if(r<=0&&pgDescAvisado!==k){pgDescAvisado=k;beep(660,.15);vibrar([80,60,80])}}}
  if(h!==pgDiaVisto){pgDiaVisto=h;if(pgRevisaFin(t))pgSay('Ciclo terminado: informe listo y programas desbloqueados.');pgMemo.pgCard=null;pgMemo.vProgramaC=null;pgPinta()}},1000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pgSincronizar()});
// copia de seguridad: va entera; al restaurar NO sustituye un programa de este teléfono (no sirve para reiniciarlo ni borrar incumplimientos)
const pgCopia=()=>PGS;
function pgFusiona(d){const x=pgNorm(d),r={n:0,mal:0};
  const ya=new Set(PGS.arch.map(a=>a.id).concat(PGS.act?[PGS.act.id]:[]));
  for(const a of x.arch)if(!ya.has(a.id)){PGS.arch.push(a);ya.add(a.id);r.n++}
  if(x.act&&!PGS.act&&!ya.has(x.act.id)){PGS.act=x.act;PGS.ses=x.ses;PGS.rep=x.rep;PGS.cur=x.cur;r.n++}
  else if(x.act&&PGS.act&&x.act.id===PGS.act.id){for(const sid in x.ses){const L=PGS.ses[sid]||(PGS.ses[sid]={int:[]});for(const I of x.ses[sid].int)if(!L.int.some(y=>y.id===I.id)&&I.est!=='curso'){L.int.push(I);r.n++}L.int.sort((a,b)=>Date.parse(a.ini)-Date.parse(b.ini))}}
  PGS.marca=Math.max(PGS.marca,x.marca);if(r.n)pgGuarda();return r}
// al abrir: con una sesión del programa en curso se vuelve directamente a ella
{const t=pgAhora();pgDiaVisto=pgDiaK(t);pgRevisaFin(t);if(PGS.cur)tab='pgent';pgGuarda();pgPinta();pgSincronizar()}
