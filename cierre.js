// v35 · CIERRE DE DÉFICITS SEMANALES: una sesión, en el día que elijas, que completa lo que falta de la semana en cada músculo.
// No crea otra cuenta de volumen: los déficits salen de volumen() (solo series REALIZADAS y guardadas), los objetivos de
// rangoZona() (los del mapa muscular) y lo que aporta cada ejercicio de musculos() (directas = 1, indirectas = fracción).
// Las series planificadas nunca cuentan como hechas. La sesión se ejecuta en el reloj normal como una secuencia de bloques por
// grupo (igual que una rutina): cada bloque se guarda con su grupo y sigue usando cargas, récords, recuperación y molestias.
// Todo lo que es estimación (fatiga, tiempo, aportes indirectos, límites por sesión) se presenta como estimación orientativa.
'use strict';
const CIKEY='reloj-anomalo-cierre';
// límites por sesión (heurísticos y prudentes, no umbrales científicos): por zona, total, ejercicios y series por ejercicio
const CI_TOPES={completo:{zona:12,total:30,ej:8,serie:6},recuperable:{zona:8,total:20,ej:6,serie:5}};
const CI_EQ=[['mancuernas','Mancuernas'],['barra','Barra'],['maquina','Máquinas'],['polea','Poleas'],['corporal','Peso corporal']];
const CI_DIAS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
function ciNorm(o){const r={cfg:{modo:'recuperable',min:60,eq:CI_EQ.map(x=>x[0]),pref:true},plan:null};if(!esObj(o))return r;const c=esObj(o.cfg)?o.cfg:{};
  if(['completo','recuperable'].includes(c.modo))r.cfg.modo=c.modo;{const m=vEnt(c.min,15,240);if(m!=null)r.cfg.min=m}
  if(Array.isArray(c.eq))r.cfg.eq=c.eq.filter(x=>CI_EQ.some(e=>e[0]===x));if(typeof c.pref==='boolean')r.cfg.pref=c.pref;
  const p=o.plan;if(esObj(p)&&vDia(p.dia)&&vDia(p.semana)&&Array.isArray(p.bloques)){
    const bl=vLista(p.bloques,8,b=>{if(!esObj(b)||!esG(b.g))return null;const e=vLista(b.e,EST_MAX+3,x=>{const v=normEjHoy(x);if(!v)return null;v.series=vEnt(x.series,1,12)??1;return v});return e.length?{g:b.g,e}:null});
    if(bl.length)r.plan={dia:p.dia,semana:p.semana,modo:p.modo==='completo'?'completo':'recuperable',creado:vFecha(p.creado)||new Date().toISOString(),firma:vTxt(p.firma,400)||'',
      estado:['listo','en curso','parcial','hecho'].includes(p.estado)?p.estado:'listo',def:esObj(p.def)?Object.fromEntries(Object.entries(p.def).filter(([m,v])=>MUS[m]&&vNum(v,0,100)!=null)):{},bloques:bl}}
  return r}
let ci=ciNorm(leerJSON(CIKEY,{})),cierreOn=false,ciPrev=null,ciUI={dia:'',abierto:false,msg:''};
const ciGuarda=()=>guardarObj(CIKEY,ci);

/* ---------- datos de la semana: SOLO lo realizado hasta el momento (volumen() no conoce los planes) ---------- */
const ciLunes=t=>lunes(t);
function ciVol(t=Date.now()){const a=ciLunes(t);return volumen(a,Math.min(t,Date.now())+1)}
// firma de lo hecho esta semana: si cambia (entrenaste después de crear el plan), el plan se avisa como desactualizado
function ciFirma(t=Date.now()){const a=ciLunes(t);return hist.filter(h=>{const x=Date.parse(h.start);return x>=a&&x<a+7*864e5}).map(h=>h.id+':'+(h.sets||[]).length).sort().join(',')}
function ciDeficits(V){const D={};for(const m of Object.keys(MUS)){const [lo]=rangoZona(m),f=Math.max(0,lo-V.zona(m));if(f>.05)D[m]=Math.round(f*10)/10}return D}
// minutos por serie efectiva según TUS sesiones (descansos + ~35 s por serie), si hay al menos 3; si no, 2,2 min (estimación)
function ciMinPorEf(){const v=[];for(const h of hist.slice(0,12)){const s=h.sets||[],ef=efDe(s);if(ef<1||!s.length)continue;v.push((s.reduce((a,r)=>a+(+r.rest||0),0)+35*s.length)/60/ef)}
  if(v.length<3)return {m:2.2,de:'estimación por defecto'};const md=mediana(v);return {m:Math.min(4,Math.max(1.2,md)),de:`mediana de tus últimas ${v.length} sesiones`}}

/* ---------- candidatos: catálogo, tu plan y alternativas, con su equipo y lo que aporta cada serie ---------- */
function ciEquipo(n,eqTxt){const t=sinTilde((eqTxt||'')+' '+n);
  if(/polea/.test(t))return 'polea';if(/maquina|prensa|smith|hack|pec deck|contractora/.test(t))return 'maquina';
  if(/dominadas|paralelas|suelo|colchoneta|peso corporal|escalon|rueda|flexion|fondos|colgad|plancha|nordico/.test(t)&&!/barra con discos|mancuerna/.test(t))return 'corporal';
  if(/mancuerna|pesa rusa|kettlebell/.test(t))return 'mancuernas';if(/barra/.test(t))return 'barra';
  const e=cgEquipo(n).eq;return e==='otro'?'maquina':e}
function ciCandidatos(cfg){const vistos=new Map(),zs=lesAct(),caida=new Set(anComparables().filter(s=>anClasifica(s.pts).estado==='caida').map(s=>s.ej));
  const pon=(n,g,eq,fuente)=>{if(!n||vistos.has(n)||!CAT[g])return;const c={};for(const [m,f] of Object.entries(musculos(n,g)))if(MUS[m])c[m]=f;if(!Object.keys(c).length)return;
    const equipo=ciEquipo(n,eq),plan=(CAT[g].base||CAT[g].e).some(x=>x.n===n);
    vistos.set(n,{n,g,c,equipo,plan,fuente,cuida:zs.length?lesAcc(n,g,zs).v:0,caida:caida.has(n),comp:Object.values(c).filter(f=>f>=.5).length>=2})};
  for(const g of Object.keys(CAT))(CAT[g].base||CAT[g].e).forEach(x=>{if(!x.levy)pon(x.n,g,'','plan')});
  ANIM.lista.forEach(d=>{if(d.id!=='vacio'&&d.id!=='generico')pon(d.n,d.g,d.eq,'catálogo')});
  for(const g in ALT)ALT[g].forEach(n=>pon(n,g,'','catálogo'));
  return [...vistos.values()].filter(x=>cfg.eq.includes(x.equipo)&&x.cuida<3)}   // equipo que tienes; nada que «cuidar una zona» quitaría

/* ---------- el optimizador: voraz, serie efectiva a serie efectiva ----------
   En cada paso añade UNA serie efectiva del ejercicio con mejor puntuación:
     ganancia = Σ_m min(lo que falta en m, aporte de una serie a m)        (cubrir varios déficits a la vez suma)
     − penalización por sobrecargar: aporte a zonas que ya pasarían de su máximo (×1; más de +30 %: ×2), ya en objetivo (×0,15),
       sin recuperar o sobre el tope de la sesión (indirecto ×1; directo: prohibido), rendimiento en caída (−0,5)
     − coste de abrir un ejercicio nuevo (0,6; +0,3 si es compuesto)   + preferencia por tus ejercicios (+0,15)
   Así un aislado gana a un compuesto cuando el compuesto cargaría músculos ya altos, y un compuesto gana cuando cubre varios
   déficits. Para cuando no queda ganancia útil o se llega a un tope (zona, total, ejercicios, series por ejercicio, tiempo). */
function cierreCalc(o){const cfg={...ci.cfg,...(o||{})},t=cfg.t||Date.now(),V=ciVol(t),D=ciDeficits(V),T=CI_TOPES[cfg.modo]||CI_TOPES.recuperable;
  const mpe=ciMinPorEf(),res={def:D,V,cfg,mpe,items:[],pend:[],alertas:[],aviso:[],t};
  const zonas=Object.keys(MUS),R={...D},plan={},sesZ={};let total=0;
  // recuperación (regla prudente de 48 h tras un estímulo directo y zonas con molestias o cuidadas), con los mismos criterios que «Hoy»
  const bloq={};for(const m of Object.keys(D)){const z=anZona(m),e=z&&z.prep?z.prep.e:'';if(e==='cuidar'||e==='espera')bloq[m]=z.prep.txt}
  if(!Object.keys(D).length){res.vacio=true;return res}
  const C=ciCandidatos(cfg),tiempoMax=cfg.min,ejMin=n=>1.5+((C.find(x=>x.n===n)||{}).comp?2:0);   // cambio de máquina y, en compuestos, calentamiento
  const minutos=()=>Object.keys(plan).reduce((a,n)=>a+ejMin(n),0)+total*mpe.m;
  const recuperable=cfg.modo==='recuperable';
  for(let it=0;it<200&&total<T.total;it++){let best=null;
    for(const x of C){const nP=plan[x.n]||0;if(!nP&&Object.keys(plan).length>=T.ej)continue;if(nP>=T.serie)continue;
      let gan=0,pen=0,prohib=false;
      for(const [m,f] of Object.entries(x.c)){const tras=V.zona(m)+(sesZ[m]||0)+f,[lo,hi]=rangoZona(m);
        if(R[m]>0)gan+=Math.min(R[m],f);
        if(recuperable&&bloq[m]){if(f>=1){prohib=true;break}pen+=f}
        if((sesZ[m]||0)+f>T.zona){if(f>=1){prohib=true;break}pen+=f*.8}
        if(tras>hi*VOL_ALERTA)pen+=f*2;else if(tras>hi)pen+=f;else if(!(R[m]>0))pen+=f*.15}
      if(prohib||gan<.25)continue;
      const sc=gan-pen-(nP?0:.6+(x.comp?.3:0))+(cfg.pref&&x.plan?.15:0)-(x.caida?.5:0);
      if(recuperable&&minutos()+mpe.m+(nP?0:ejMin(x.n))>tiempoMax)continue;
      if(!best||sc>best.sc)best={x,sc}}
    if(!best||best.sc<=0)break;const x=best.x;plan[x.n]=(plan[x.n]||0)+1;total++;
    for(const [m,f] of Object.entries(x.c)){sesZ[m]=(sesZ[m]||0)+f;if(R[m]>0)R[m]=Math.max(0,R[m]-f)}}
  // resultado: ejercicios (con su justificación), lo que queda pendiente y por qué, proyección del mapa y alertas
  const CN=Object.fromEntries(C.map(x=>[x.n,x]));
  res.items=Object.entries(plan).map(([n,s])=>{const x=CN[n],cub=Object.entries(x.c).filter(([m])=>D[m]).map(([m,f])=>({m,v:s*f,dir:f>=1}));
    return {n,g:x.g,series:s,c:x.c,equipo:x.equipo,comp:x.comp,plan:x.plan,cub,por:cub.length?`cubre ${cub.map(o=>`${MUS[o.m][3]} ${ef1(o.v)}${o.dir?'':' (indirecta)'}`).join(', ')}`:'apoyo'}});
  res.proy={};res.dir={};res.ind={};for(const m of zonas)res.proy[m]=V.zona(m);
  res.items.forEach(i=>{for(const [m,f] of Object.entries(i.c)){res.proy[m]+=i.series*f;if(f>=1)res.dir[m]=(res.dir[m]||0)+i.series*f;else res.ind[m]=(res.ind[m]||0)+i.series*f}});
  const sumD=Object.values(D).reduce((a,b)=>a+b,0),cubierto=Object.keys(D).reduce((a,m)=>a+Math.min(D[m],res.proy[m]-V.zona(m)),0);
  res.cubierto=sumD?Math.min(1,cubierto/sumD):1;res.total=total;res.min=Math.round(minutos());
  const eqZ=m=>C.some(x=>(x.c[m]||0)>=1);
  for(const m of Object.keys(D)){const falta=Math.round((rangoZona(m)[0]-res.proy[m])*10)/10;if(falta<=.05)continue;
    const motivo=falta<.5?'resto de menos de media serie: no compensa otra serie entera':recuperable&&bloq[m]?`recuperación: ${bloq[m]}`:!eqZ(m)?'ningún ejercicio disponible con tu equipamiento (o que «cuidar una zona» permita) la trabaja directamente'
      :(sesZ[m]||0)+1>T.zona?`tope de ${T.zona} series efectivas por zona en una sesión`:total>=T.total?`tope de ${T.total} series efectivas por sesión`
      :recuperable&&minutos()+mpe.m>tiempoMax-1?`tiempo disponible (${tiempoMax} min)`:'cubrirla sobrecargaría músculos que ya están en su objetivo o por encima';
    res.pend.push({m,falta,motivo})}
  for(const m of zonas){const [lo,hi]=rangoZona(m),antes=V.zona(m),p=res.proy[m];if(p>hi&&p-antes>.05)res.alertas.push(`${MUS[m][0]}: quedaría en ${ef1(p)}, por encima de su máximo orientativo (${hi})${p>hi*VOL_ALERTA?' — más de +30 %':''}`);
    if((sesZ[m]||0)>8)res.alertas.push(`${MUS[m][0]}: ${ef1(sesZ[m])} series efectivas en una sesión; por encima de ~8 suele rendir menos (orientativo)`);
    if(!recuperable&&bloq[m]&&(sesZ[m]||0)>0)res.alertas.push(`${MUS[m][0]}: ${bloq[m]}; el cierre completo la incluye igual`)}
  if(res.min>cfg.min)res.alertas.push(`Tiempo estimado ${res.min} min, más que los ${cfg.min} disponibles`);
  if(total>=20)res.alertas.push(`${total} series efectivas en un día es mucho volumen: fatiga alta y peor calidad al final (orientativo)`);
  const piernas=res.items.filter(i=>i.g==='piernas'&&i.comp).length,espalda=res.items.filter(i=>(i.c.lumbar||0)>0).length;
  if(piernas&&espalda)res.alertas.push('Compuestos de pierna y ejercicios con carga lumbar en la misma sesión: interferencia probable en la espalda baja');
  res.items.filter(i=>CN[i.n].caida).forEach(i=>res.alertas.push(`${i.n}: rendimiento reciente en caída (posible fatiga)`));
  if(!recuperable&&res.pend.length)res.aviso.push('El cierre completo no es viable en un día con límites de seguridad: lo pendiente queda indicado con su motivo.');
  // bloques por grupo (en el orden: más series primero; dentro, compuestos antes)
  const porG={};res.items.forEach(i=>(porG[i.g]=porG[i.g]||[]).push(i));
  res.bloques=Object.entries(porG).sort((a,b)=>b[1].reduce((s,i)=>s+i.series,0)-a[1].reduce((s,i)=>s+i.series,0))
    .map(([g,L])=>({g,e:L.sort((a,b)=>(b.comp?1:0)-(a.comp?1:0)).map(i=>({...ciEjE(i.n,g),series:i.series}))}));
  return res}
function ciEjE(n,g){const c=(CAT[g].base||CAT[g].e).find(x=>x.n===n);if(c)return {...normEjHoy(c)};return hoyEj(n,g)}   // hoyEj: pantallas.js (v34)
// edición del plan: cambia series, quita o sustituye un ejercicio y recalcula lo cubierto con los MISMOS déficits (sin reoptimizar)
function ciReevalua(res){const V=res.V,D=res.def;res.proy={};res.dir={};res.ind={};for(const m of Object.keys(MUS))res.proy[m]=V.zona(m);let total=0;
  res.items.forEach(i=>{total+=i.series;i.c=i.c||Object.fromEntries(Object.entries(musculos(i.n,i.g)).filter(([m])=>MUS[m]));for(const [m,f] of Object.entries(i.c)){res.proy[m]+=i.series*f;if(f>=1)res.dir[m]=(res.dir[m]||0)+i.series*f;else res.ind[m]=(res.ind[m]||0)+i.series*f}
    const cub=Object.entries(i.c).filter(([m])=>D[m]).map(([m,f])=>({m,v:i.series*f,dir:f>=1}));i.por=cub.length?`cubre ${cub.map(o=>`${MUS[o.m][3]} ${ef1(o.v)}${o.dir?'':' (indirecta)'}`).join(', ')}`:'no cubre ningún déficit'});
  const sumD=Object.values(D).reduce((a,b)=>a+b,0);res.cubierto=sumD?Math.min(1,Object.keys(D).reduce((a,m)=>a+Math.min(D[m],res.proy[m]-V.zona(m)),0)/sumD):1;res.total=total;
  res.min=Math.round(res.items.reduce((a,i)=>a+1.5+(i.comp?2:0),0)+total*res.mpe.m);
  res.pend=Object.keys(D).map(m=>({m,falta:Math.round((rangoZona(m)[0]-res.proy[m])*10)/10,motivo:'quitado o reducido al editar el plan'})).filter(p=>p.falta>.05);
  const porG={};res.items.forEach(i=>(porG[i.g]=porG[i.g]||[]).push(i));
  res.bloques=Object.entries(porG).map(([g,L])=>({g,e:L.map(i=>({...ciEjE(i.n,g),series:i.series}))}));res.editado=true;return res}

/* ---------- ejecución en el reloj: una «rutina» de bloques por grupo, solo cuando la empiezas ---------- */
function cierreGrupos(){return cierreOn&&ci.plan?ci.plan.bloques.map(b=>b.g):null}
function cierreTomar(g){if(!cierreOn||!ci.plan)return null;const b=ci.plan.bloques[rutPos];if(!b||b.g!==g)return null;
  // cada ejercicio, normalizado (reps de referencia d, factor k…): el plan recién guardado aún no pasó por ciNorm
  return {e:b.e.map(x=>{const c=!x.hoy&&CAT[g].e.find(c=>c.n===x.n);return c?{...c,series:x.series}:{...normEjHoy(x),series:x.series}}),meta:b.e.reduce((a,x)=>a+(x.levy?0:x.series),0)}}
function cierreEmpezar(forzar){const p=ci.plan;if(!p||enCurso())return;
  if(typeof pgBloqueaLibre==='function'&&pgBloqueaLibre()){pgSay(pgMsgBloqueo());render();return}   // v40: programa de 28 días activo
  if(!forzar&&p.firma!==ciFirma()){ciUI.msg='desactualizado';tab='progreso';progSub='res';renderProg();renderProgSub();render();return}
  if(ssSel.on){ssSel.on=false;guardarObj(SSKEY,ssSel)}fzaHoy=false;cierreOn=true;rutPos=0;rutEf=0;grupo=p.bloques[0].g;p.estado='en curso';ciGuarda();
  S=fresh();$('save').textContent='Sin guardar aún';selAbierto=false;tab='reloj';lastG=null;renderGrupos();render();window.scrollTo(0,0)}
// estado real durante el cierre (tras cada serie guardada): déficits que quedan respecto a los del plan; memorizado
let ciMemo={k:'',v:null};
function ciRestante(){const p=ci.plan;if(!p)return null;const k=hist.length+':'+(hist[0]?hist[0].id+(hist[0].sets||[]).length:'');if(ciMemo.k===k)return ciMemo.v;
  const V=ciVol(),D0=p.def,quedan={};let s0=0,s1=0;for(const m in D0){s0+=D0[m];const f=Math.max(0,rangoZona(m)[0]-V.zona(m));s1+=Math.min(D0[m],f);if(f>.05)quedan[m]=Math.round(f*10)/10}
  ciMemo={k,v:{quedan,cub:s0?1-s1/s0:1}};return ciMemo.v}
function renderCierreReloj(){const el=$('cierreR');if(!el)return;const p=ci.plan,hoyDia=diaK(Date.now());
  let h='';
  if(cierreOn&&p){const r=ciRestante(),q=Object.entries(r.quedan);
    h=`<b>Cierre de déficits</b> · bloque ${Math.min(rutPos+1,p.bloques.length)} de ${p.bloques.length} · cubierto ${Math.round(r.cub*100)} % (series realizadas)${q.length?` · quedan: ${q.map(([m,v])=>`${esc(MUS[m][3])} ${ef1(v)}`).join(', ')}`:' · ¡todo cubierto!'}`}
  else if(p&&p.dia===hoyDia&&p.estado!=='hecho'&&S.st==='idle'&&rutPos===0){const n=p.bloques.reduce((a,b)=>a+b.e.length,0);
    h=`<span><b>Cierre de déficits de hoy</b> · ${n} ${n===1?'ejercicio':'ejercicios'} en ${p.bloques.length} ${p.bloques.length===1?'grupo':'grupos'}${p.estado==='parcial'?' · quedó a medias':''}</span><span class="hoyb"><button type="button" class="btn2" data-ci="empezar" style="border:2px solid var(--cap);color:var(--cap)">Empezar</button><button type="button" class="btn2" data-ci="ver">Ver y editar</button></span>`}
  el.hidden=!h;if(el.innerHTML!==h)el.innerHTML=h}
// fin del cierre: al terminar el último bloque se marca hecho; si lo cortas antes, queda «a medias» (lo hecho cuenta, lo no hecho no)
function ciVigila(abandono){if(!cierreOn||!ci.plan)return;const ult=rutPos>=ci.plan.bloques.length-1;
  if(S.st==='done'&&ult){cierreOn=false;ci.plan.estado='hecho';ciGuarda();ciMemo.k=''}
  // abandono: solo tras «Nueva sesión» (al empezar el cierre también se está en reposo)
  else if(abandono&&S.st==='idle'&&!S.id){cierreOn=false;ci.plan.estado=hist.some(h=>h.cierre&&Date.parse(h.start)>=Date.parse(ci.plan.creado))?'parcial':'listo';ciGuarda()}}

/* ---------- Progreso → junto al mapa muscular: «Completar déficits», vista previa y edición ---------- */
const ciPct=x=>Math.round(x*100)+' %';
function ciDiasSemana(){const L=lunes(Date.now()),hoyK=diaK(Date.now());return CI_DIAS.map((n,i)=>{const k=diaK(L+i*864e5+36e5);return {k,n,pasado:k<hoyK,hoy:k===hoyK}})}
function ciCfgHTML(){const c=ci.cfg,d=ciUI.dia||diaK(Date.now());
  return `<span class="lbl">Día de la sesión</span><div class="tog ciDias">${ciDiasSemana().map(x=>`<button type="button" data-cidia="${x.k}" aria-pressed="${x.k===d}"${x.pasado?' disabled':''}>${x.n.slice(0,3)}${x.hoy?' (hoy)':''}</button>`).join('')}</div>
    <span class="lbl">Modalidad</span><div class="tog"><button type="button" data-cimodo="recuperable" aria-pressed="${c.modo==='recuperable'}">Recuperable</button><button type="button" data-cimodo="completo" aria-pressed="${c.modo==='completo'}">Completo</button></div>
    <p class="hint">${c.modo==='recuperable'?'Cubre todo lo posible respetando recuperación (48 h tras un estímulo directo, molestias), tu tiempo y un tope de 8 series efectivas por músculo y 20 por sesión.':'Intenta cubrirlo todo hoy con topes de seguridad (12 por músculo, 30 por sesión); avisa de todo lo que se pase y lo que no quepa.'}</p>
    <div class="cg2"><label class="cgl2"><span>Tiempo disponible</span><select data-cimin="1">${[30,45,60,75,90,120].map(m=>`<option value="${m}"${m===c.min?' selected':''}>${m} min</option>`).join('')}</select></label>
    <label class="cgl2"><span>Preferencia</span><select data-cipref="1"><option value="1"${c.pref?' selected':''}>Preferir mis ejercicios</option><option value="0"${c.pref?'':' selected'}>Cualquiera del catálogo</option></select></label></div>
    <span class="lbl">Equipamiento disponible</span><div class="chips">${CI_EQ.map(([k,n])=>`<button type="button" data-cieq="${k}" aria-pressed="${c.eq.includes(k)}">${n}</button>`).join('')}</div>`}
function ciMapa(res){const zona=(m,d)=>`<path d="${d}" class="${estadoVol(res.proy[m]||0,rangoZona(m))}"><title>${esc(MUS[m][0])}: ${ef1(res.V.zona(m))} → ${ef1(res.proy[m]||0)} (objetivo ${rangoZona(m).join('–')})</title></path>`;
  return figuraSVG({aria:'Mapa muscular proyectado si haces la sesión de cierre',zona})}
function ciCarga(i){const R=cgRef(i.g,i.n,'h');if(cgTieneCarga(R))return cgTxt(R);const E=(CAT[i.g].base||CAT[i.g].e).find(x=>x.n===i.n),s=E&&sugerir(i.g,E);return s&&s.kg!=null?kgTxt(s.kg)+' (historial)':'sin carga registrada'}
function ciPreviaHTML(res){if(res.vacio)return '<p class="cimsg ok">Todos tus músculos están ya en su objetivo semanal: no hace falta cierre. 👍</p>';
  const D=res.def,zs=Object.keys(D).sort((a,b)=>D[b]-D[a]),E=(ej)=>ej;void E;
  const alt=i=>ciCandidatos(res.cfg).filter(x=>x.n!==i.n&&Object.entries(x.c).some(([m,f])=>f>=1&&(i.c[m]||0)>=1)).slice(0,12);
  return `<h3>Músculos rezagados</h3><ul class="cil">${zs.map(m=>`<li><span>${esc(MUS[m][0])}</span><span>${ef1(res.V.zona(m))} de ${rangoZona(m)[0]} · <b>faltan ${ef1(D[m])}</b></span></li>`).join('')}</ul>
    <p class="hint">Solo series realizadas y guardadas hasta ahora (semana del lunes ${new Date(lunes(res.t)).toLocaleDateString('es-DO',{day:'numeric',month:'short'})}); lo planificado no cuenta hasta que lo hagas.</p>
    <h3>Sesión propuesta${res.editado?' (editada)':''}</h3>
    <div class="cires"><span><b>${ciPct(res.cubierto)}</b> del déficit cubierto</span><span><b>${res.total}</b> series efectivas</span><span>≈ <b>${res.min} min</b></span></div>
    ${res.items.length?res.bloques.map(b=>`<div class="cib"><span class="lbl">${esc(CAT[b.g].n)}</span>${b.e.map(e=>{const i=res.items.find(x=>x.n===e.n);return `<div class="cii" data-cin="${esc(i.n)}">
      <div class="cgt"><b>${esc(i.n)}</b><span class="cgm">${esc(CI_EQ.find(q=>q[0]===i.equipo)[1].toLowerCase())}${i.comp?' · compuesto':' · aislado'}</span></div>
      <div class="cgf"><button type="button" class="cgpm" data-ciser="-1" aria-label="Una serie menos">−</button><span class="ciser"><b>${i.series}</b> series efectivas</span><button type="button" class="cgpm" data-ciser="1" aria-label="Una serie más">+</button>
        <select data-cirep="1" aria-label="Sustituir por"><option value="">Sustituir…</option>${alt(i).map(x=>`<option value="${esc(x.n)}">${esc(x.n)}</option>`).join('')}</select><button type="button" class="lnk" data-ciquita="1">Quitar</button></div>
      <p class="hint">${esc(i.por)} · reps ${esc(e.r)} · carga: ${esc(ciCarga(i))} · RIR 1 en la serie principal y mini-series hasta 0–1 (como siempre)</p></div>`}).join('')}</div>`).join(''):'<p class="cimsg">No hay ningún ejercicio útil con estas condiciones.</p>'}
    ${res.pend.length?`<h3>Quedaría pendiente</h3><ul class="cil">${res.pend.map(p=>`<li><span>${esc(MUS[p.m][0])} · faltarían ${ef1(p.falta)}</span><span class="hint">${esc(p.motivo)}</span></li>`).join('')}</ul>`:''}
    ${res.aviso.map(a=>`<p class="cgwarn">${esc(a)}</p>`).join('')}${res.alertas.length?`<h3>Alertas</h3>${res.alertas.map(a=>`<p class="cgwarn">⚠ ${esc(a)}</p>`).join('')}`:''}
    <h3>Directas e indirectas previstas</h3><div class="tbl"><table class="cit"><thead><tr><th>Músculo</th><th>Ahora</th><th>Directas</th><th>Indirectas</th><th>Después</th></tr></thead><tbody>${Object.keys(MUS).filter(m=>res.dir[m]||res.ind[m]).map(m=>`<tr><td>${esc(MUS[m][3])}</td><td>${ef1(res.V.zona(m))}</td><td>${ef1(res.dir[m]||0)}</td><td>${ef1(res.ind[m]||0)}</td><td><span class="mpt ${estadoVol(res.proy[m],rangoZona(m))}"></span> ${ef1(res.proy[m])}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint">Indirectas: estimación ponderada de lo que ayudan los ejercicios a otros músculos (las mismas fracciones del mapa); no equivalen a series directas. Tiempo: ${esc(res.mpe.de)} (${num(res.mpe.m)} min por serie efectiva) más cambios y calentamiento.</p>
    <h3>Mapa después de la sesión (proyección)</h3>${ciMapa(res)}<div class="mleg">${Object.entries(EST_MUS).map(([k,t])=>`<span><i class="mpt ${k}"></i>${t}</span>`).join('')}</div>
    ${res.items.length?`<div class="acc"><button type="button" data-ci="guardar" style="border:2px solid var(--cap);color:var(--cap);font-weight:600">Usar este plan (${esc(ciNomDia(ciUI.dia||diaK(Date.now())))})</button><button type="button" data-ci="recalc">Recalcular</button></div>`:''}`}
const ciNomDia=k=>{const x=ciDiasSemana().find(d=>d.k===k);return x?x.n.toLowerCase()+(x.hoy?', hoy':''):k};
function ciPlanHTML(){const p=ci.plan;if(!p)return '';const r=ciRestante(),hoyK=diaK(Date.now()),des=p.firma!==ciFirma()&&p.estado!=='hecho';
  return `<div class="ciplan"><p><b>Plan guardado</b> para el ${esc(ciNomDia(p.dia))} · ${p.modo} · ${p.bloques.map(b=>`${esc(CAT[b.g].n)} (${b.e.map(e=>esc(e.s)+' ×'+e.series).join(', ')})`).join(' → ')}</p>
    <p class="hint">Estado: ${esc(p.estado)} · cubierto con lo realizado: ${ciPct(r.cub)}${Object.keys(r.quedan).length?' · quedan '+Object.entries(r.quedan).map(([m,v])=>`${esc(MUS[m][3])} ${ef1(v)}`).join(', '):''}</p>
    ${des?`<p class="cgwarn">⚠ Entrenaste después de crear el plan: tus déficits cambiaron. El plan no se cambia solo.</p>`:''}
    <div class="tog">${p.dia===hoyK&&p.estado!=='hecho'&&!enCurso()?`<button type="button" data-ci="empezar"${des?' data-forzar="1"':''}>${des?'Empezar igual':'Empezar ahora'}</button>`:''}<button type="button" data-ci="reopt">Reoptimizar lo que queda</button><button type="button" data-ci="borrar">${ciUI.borrar?'¿Seguro? Toca otra vez':'Descartar plan'}</button></div></div>`}
function renderCierre(){const el=$('pCierre');if(!el)return;
  let h=`<div class="top"><b>Cierre de déficits semanales</b>${!ciUI.abierto?'<button type="button" class="btn2" data-ci="abrir">Completar déficits</button>':'<button type="button" class="lnk" data-ci="cerrar">Cerrar</button>'}</div>`;
  if(!ciUI.abierto){const D=ciDeficits(ciVol()),n=Object.keys(D).length;h+=`<p class="hint">${n?`${n} ${n===1?'músculo por debajo':'músculos por debajo'} de su mínimo esta semana (${ef1(Object.values(D).reduce((a,b)=>a+b,0))} series efectivas). Genera una sesión, el día que quieras, que los complete.`:'Todos tus músculos están en su objetivo esta semana.'}</p>`+ciPlanHTML()}
  else{h+=ciPlanHTML()+ciCfgHTML()+(ciUI.msg==='desactualizado'?'<p class="cgwarn">Tus déficits cambiaron desde que creaste el plan (entrenaste después). Recalcula, o empieza el plan igual.</p>':'')+(ciPrev?ciPreviaHTML(ciPrev):'<div class="acc"><button type="button" data-ci="calc" style="border:2px solid var(--cap);color:var(--cap);font-weight:600">Calcular la sesión</button></div>')}
  el.innerHTML=h}
function ciCalcular(){ciPrev=cierreCalc({t:Date.now()});ciUI.msg=''}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ci],[data-cidia],[data-cimodo],[data-cieq],[data-ciser],[data-ciquita]');if(!b)return;const d=b.dataset;
  if(d.ci==='abrir'){ciUI.abierto=true;ciUI.dia=ciUI.dia||diaK(Date.now());ciPrev=null;renderCierre();return}
  if(d.ci==='cerrar'){ciUI.abierto=false;ciPrev=null;ciUI.msg='';renderCierre();return}
  if(d.ci==='calc'||d.ci==='recalc'){ciCalcular();renderCierre();return}
  if(d.ci==='guardar'&&ciPrev){ci.plan={dia:ciUI.dia||diaK(Date.now()),semana:diaK(lunes(Date.now())),modo:ciPrev.cfg.modo,creado:new Date().toISOString(),firma:ciFirma(),estado:'listo',def:ciPrev.def,
    bloques:ciPrev.bloques.map(bq=>({g:bq.g,e:bq.e.map(x=>({n:x.n,s:x.s,r:x.r,ext:x.ext,extN:x.extN,extH:x.extH,tempo:x.tempo,series:x.series,...(x.hoy?{hoy:true}:{})}))}))};
    ciGuarda();ciPrev=null;ciUI.abierto=false;ciMemo.k='';renderCierre();render();return}
  if(d.ci==='empezar'){cierreEmpezar(!!d.forzar);return}
  if(d.ci==='ver'){tab='progreso';progSub='res';ciUI.abierto=true;renderProg();renderProgSub();render();setTimeout(()=>{const x=$('pCierre');if(x)x.scrollIntoView({block:'start'})},30);return}
  if(d.ci==='reopt'){ciUI.abierto=true;ciUI.dia=ci.plan?ci.plan.dia:diaK(Date.now());ciCalcular();renderCierre();return}   // con lo realizado hasta ahora: solo cuando lo pides
  if(d.ci==='borrar'){if(!ciUI.borrar){ciUI.borrar=true;renderCierre();setTimeout(()=>{ciUI.borrar=false;renderCierre()},4000);return}ciUI.borrar=false;ci.plan=null;cierreOn=false;ciGuarda();renderCierre();render();return}
  if(d.cidia){ciUI.dia=d.cidia;renderCierre();return}
  if(d.cimodo){ci.cfg.modo=d.cimodo;ciGuarda();if(ciPrev)ciCalcular();renderCierre();return}
  if(d.cieq){const s=new Set(ci.cfg.eq);s.has(d.cieq)?s.delete(d.cieq):s.add(d.cieq);ci.cfg.eq=[...s];ciGuarda();if(ciPrev)ciCalcular();renderCierre();return}
  const row=b.closest('[data-cin]');if(!row||!ciPrev)return;const i=ciPrev.items.find(x=>x.n===row.dataset.cin);if(!i)return;
  if(d.ciser){i.series=Math.max(1,Math.min(CI_TOPES[ciPrev.cfg.modo].serie+2,i.series+(+d.ciser)));ciReevalua(ciPrev);renderCierre();return}
  if(d.ciquita!=null){ciPrev.items=ciPrev.items.filter(x=>x!==i);ciReevalua(ciPrev);renderCierre()}});
document.addEventListener('change',e=>{const s=e.target;if(!s.closest||!s.closest('#pCierre'))return;
  if(s.matches('[data-cimin]')){ci.cfg.min=+s.value;ciGuarda();if(ciPrev)ciCalcular();renderCierre();return}
  if(s.matches('[data-cipref]')){ci.cfg.pref=s.value==='1';ciGuarda();if(ciPrev)ciCalcular();renderCierre();return}
  if(s.matches('[data-cirep]')&&s.value&&ciPrev){const row=s.closest('[data-cin]'),i=ciPrev.items.find(x=>x.n===row.dataset.cin),x=ciCandidatos(ciPrev.cfg).find(c=>c.n===s.value);
    if(i&&x){Object.assign(i,{n:x.n,g:x.g,c:x.c,equipo:x.equipo,comp:x.comp,plan:x.plan});ciReevalua(ciPrev);renderCierre()}}});
// «Nueva sesión» a mitad del cierre: lo hecho cuenta, el resto no; el plan queda «a medias» para retomarlo o reoptimizarlo
{const n0=$('nueva').onclick;$('nueva').onclick=()=>{n0();ciVigila(true)}}
{const rp=renderProg;renderProg=function(){rp();renderCierre()}}   // junto al mapa muscular
renderCierre();
