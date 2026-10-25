/* v36 · TIEMPO DE ENTRENAMIENTO TOTAL. Un entrenamiento agrupa todas las sesiones de una visita al gimnasio: terminar una sesión
   (o pulsar «Nueva sesión», pasar al siguiente grupo de la rutina, cambiar de lado en la superserie) NO termina el entrenamiento.
   · Empieza al empezar la primera sesión (no al abrir la app ni al contestar «cómo llegas»).
   · Termina con «Terminar entrenamiento» (dos toques), o solo, por inactividad: 60 min sin actividad y sin sesión en curso, o
     RETOMAR_H horas con una sesión a medio hacer (lo mismo que dura la oferta de retomarla). Al cerrarse solo, termina en la
     ÚLTIMA ACTIVIDAD, no cuando vuelves a abrir la app: las horas olvidado no cuentan.
   · El reloj sale de la hora de inicio guardada (Date.now): sigue bien aunque la app se cierre, se recargue o Android la mate.
   · Las sesiones de un entrenamiento se deducen del historial por su hora de inicio: editar o borrar una sesión se refleja solo,
     y un entrenamiento que termina sin ninguna serie guardada (empezado por error, todo deshecho) no se guarda.
   · Un cambio de hora del teléfono hacia atrás nunca da duraciones negativas. */
const ENTKEY='reloj-anomalo-entreno',ENT_INACT_MIN=60,ENT_PREGUNTA_MIN=10,ENT_MAX=3000,ENT_MARGEN=6e4;
const entNorm1=x=>{if(!esObj(x))return null;const id=vTxt(x.id,40),inicio=vNum(x.inicio,1e12,1e14),fin=x.fin==null?null:vNum(x.fin,1e12,1e14),ultima=vNum(x.ultima??x.fin??x.inicio,1e12,1e14);
  if(!id||inicio==null||ultima==null||(x.fin!=null&&fin==null))return null;const o={id,inicio,ultima:Math.max(ultima,inicio)};
  if(fin!=null){o.fin=Math.max(fin,inicio);o.cierre=x.cierre==='auto'?'auto':'manual'}return o};
function entNorm(o){const r={act:null,lista:[]};if(!esObj(o))return r;const a=entNorm1(o.act);if(a&&a.fin==null)r.act=a;
  const ids=new Set();r.lista=(Array.isArray(o.lista)?o.lista:[]).map(entNorm1).filter(e=>e&&e.fin!=null&&!ids.has(e.id)&&ids.add(e.id)).slice(-ENT_MAX);return r}
let ent=entNorm(leerJSON(ENTKEY,null)),entConf=0,entFirma='';
const entGuarda=()=>guardarObj(ENTKEY,ent);
/** Sesiones (con series de trabajo) de un entrenamiento, por su hora de inicio. */
function entSesiones(e,hasta){const a=e.inicio-ENT_MARGEN,b=(hasta??e.fin??Date.now())+1000;
  return hist.filter(h=>{const t=Date.parse(h.start);return t>=a&&t<=b&&sinCal(h.sets||[]).length>0})}
const entDur=(e,t=Date.now())=>Math.max(0,(e.fin??t)-e.inicio);
const entReloj=ms=>{const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`};
const entHora=t=>new Date(t).toLocaleTimeString('es-DO',{hour:'numeric',minute:'2-digit'});
/** Algo se hizo (empezar una sesión o una serie, guardar, retomar): empieza el entrenamiento si no hay uno, o lo mantiene vivo. */
function entActividad(t=Date.now()){if(!Number.isFinite(t))t=Date.now();entCaducar(t);
  if(!ent.act){ent.act={id:'e'+t+Math.random().toString(36).slice(2,6),inicio:t,ultima:t};entGuarda();return}
  if(t>ent.act.ultima+15e3||t<ent.act.ultima-6e4){ent.act.ultima=t;entGuarda()}   // como mucho una escritura cada 15 s (o si el reloj del teléfono retrocedió)
  else if(t>ent.act.ultima)ent.act.ultima=t}
/** Umbral de inactividad: con una sesión en curso (o esperando a retomarse), el de retomar; si no, ENT_INACT_MIN. */
const entUmbral=()=>(enCurso()||(typeof retomar!=='undefined'&&retomar)?RETOMAR_H*60:ENT_INACT_MIN)*6e4;
/** Si lleva demasiado sin actividad, se cierra en la última actividad. Devuelve true si cerró. */
function entCaducar(t=Date.now()){const a=ent.act;if(!a||t-a.ultima<=entUmbral())return false;return entCerrar(a.ultima,'auto')}
/** Cierra el entrenamiento en curso en el instante fin. Sin series guardadas no se guarda (se descarta). */
function entCerrar(fin,cierre='manual'){const a=ent.act;if(!a)return false;ent.act=null;entConf=0;
  const e={...a,fin:Math.max(a.inicio,Math.min(fin,Math.max(Date.now(),a.ultima))),cierre};
  if(entSesiones(e).length){ent.lista.push(e);if(ent.lista.length>ENT_MAX)ent.lista=ent.lista.slice(-ENT_MAX)}
  entGuarda();entFirma='';return true}
function entResumen(e){const ss=entSesiones(e),series=ss.reduce((n,h)=>n+sinCal(h.sets||[]).length,0),ef=ss.reduce((n,h)=>n+efH(h),0);
  return {ss,series,ef,dur:entDur(e)}}
/* ---------- pantalla: barra del entrenamiento en el reloj y lista en el historial ---------- */
function entRender(){const el=$('entBarra');if(!el)return;const t=Date.now();entCaducar(t);const a=ent.act;
  if(tab!=='reloj'){if(tab==='historial')entRenderHist();return}
  if(a){const r=entResumen({...a,fin:null}),libre=!enCurso(),gap=t-a.ultima,pregunta=libre&&gap>ENT_PREGUNTA_MIN*6e4;
    const conf=entConf>t;
    const firma=['a',a.id,r.ss.length,r.series,libre,conf,pregunta&&Math.floor(gap/6e4)].join('|');
    if(firma!==entFirma){entFirma=firma;el.hidden=false;el.className='ent';
      el.innerHTML=`<div class="ent-l"><span class="ent-t">Entrenamiento</span><b id="entReloj">${entReloj(entDur(a,t))}</b><span class="ent-d">desde las ${entHora(a.inicio)} · ${r.ss.length} ${r.ss.length===1?'sesión':'sesiones'} · ${r.series} ${r.series===1?'serie':'series'}</span></div>`
        +(libre?(conf&&pregunta?`<div class="ent-p"><span>Tu última serie fue a las ${entHora(a.ultima)}. ¿Cuándo terminaste?</span><div class="tog"><button type="button" class="btn2" data-ent="ahora">Ahora</button><button type="button" class="btn2" data-ent="ultima">A las ${entHora(a.ultima)}</button><button type="button" class="btn2" data-ent="no">Sigo entrenando</button></div></div>`
          :`<button type="button" class="btn2 ent-b" data-ent="terminar">${conf?'Toca otra vez para terminar el entrenamiento':'Terminar entrenamiento'}</button>`):'')}
    else{const c=$('entReloj');if(c)c.textContent=entReloj(entDur(a,t))}
    return}
  // sin entrenamiento: el resumen del último, si terminó hace menos de 12 h
  const u=ent.lista[ent.lista.length-1];
  if(u&&t-u.fin<12*36e5&&S.st==='idle'){const r=entResumen(u),firma='u|'+u.id+'|'+r.ss.length+'|'+r.series;
    if(firma!==entFirma){entFirma=firma;el.hidden=false;el.className='ent ent-fin';
      el.innerHTML=`<div class="ent-l"><span class="ent-t">Último entrenamiento</span><b>${durTxt(r.dur)}</b><span class="ent-d">${entHora(u.inicio)}–${entHora(u.fin)}${u.cierre==='auto'?' (cerrado solo tras la última serie)':''} · ${r.ss.length} ${r.ss.length===1?'sesión':'sesiones'} · ${r.series} series · ${ef1(r.ef)} efectivas</span></div>`}}
  else if(!el.hidden||entFirma){entFirma='';el.hidden=true;el.innerHTML=''}}
function entRenderHist(){const el=$('entHist');if(!el)return;const L=ent.lista.slice(-10).reverse();
  if(!L.length&&!ent.act){el.hidden=true;return}el.hidden=false;
  const semana=lunes(Date.now()),tot=ent.lista.filter(e=>e.inicio>=semana).reduce((n,e)=>n+entDur(e),0)+(ent.act&&ent.act.inicio>=semana?entDur(ent.act):0);
  const h=`<h3 style="margin:0">Entrenamientos</h3><p class="muted" style="margin:0;font-size:13px">Tiempo total entrenando esta semana: <b>${durTxt(tot)}</b>${ent.act?' (incluye el de ahora)':''}</p>`
    +L.map(e=>{const r=entResumen(e),d=new Date(e.inicio);return `<div class="ent-f"><span>${d.toLocaleDateString('es-DO',{weekday:'short',day:'numeric',month:'short'})} · ${entHora(e.inicio)}–${entHora(e.fin)}</span><b>${durTxt(r.dur)}</b><span class="muted">${r.ss.map(s=>esc(s.grupo)).join(', ')||'—'}${e.cierre==='auto'?' · cerrado solo':''}</span></div>`}).join('');
  if(el.innerHTML!==h)el.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ent]');if(!b||!ent.act)return;const k=b.dataset.ent,t=Date.now();
  if(k==='terminar'){if(enCurso())return;if(entConf<=t){entConf=t+(t-ent.act.ultima>ENT_PREGUNTA_MIN*6e4?30e3:5e3);entRender();setTimeout(entRender,5100);return}entCerrar(t)}
  else if(k==='ahora')entCerrar(t);
  else if(k==='ultima')entCerrar(ent.act.ultima);
  else if(k==='no'){entConf=0;entActividad(t)}
  vibrar(60);entFirma='';render()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')entRender()});
setInterval(entRender,1000);
/* ---------- copia de seguridad ---------- */
const entCopia=()=>ent.lista.slice();
function entFusiona(L){const r={n:0,mal:0};if(!Array.isArray(L))return r;const ids=new Set(ent.lista.map(e=>e.id));
  for(const x of L.slice(0,ENT_MAX)){const e=entNorm1(x);if(!e||e.fin==null){r.mal++;continue}if(!ids.has(e.id)){ent.lista.push(e);ids.add(e.id);r.n++}}
  if(r.n){ent.lista.sort((a,b)=>a.inicio-b.inicio);entGuarda()}return r}
entCaducar();entRender();
