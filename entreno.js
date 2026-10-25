/* v36 · TIEMPO DE ENTRENAMIENTO TOTAL. Un entrenamiento agrupa todas las sesiones de una visita al gimnasio: terminar una sesión
   (o pulsar «Nueva sesión», pasar al siguiente grupo de la rutina, cambiar de lado en la superserie) NO termina el entrenamiento.
   · Empieza al empezar la primera sesión (no al abrir la app ni al contestar «cómo llegas»).
   · Termina con «Terminar entrenamiento» (dos toques), o solo, por inactividad: 60 min sin actividad y sin sesión en curso, o
     RETOMAR_H horas con una sesión a medio hacer (lo mismo que dura la oferta de retomarla). Al cerrarse solo, termina en la
     ÚLTIMA ACTIVIDAD, no cuando vuelves a abrir la app: las horas olvidado no cuentan.
   · El reloj sale de la hora de inicio guardada (Date.now): sigue bien aunque la app se cierre, se recargue o Android la mate.
   · Las sesiones de un entrenamiento se deducen del historial por su hora de inicio: editar o borrar una sesión se refleja solo,
     y un entrenamiento que termina sin ninguna serie guardada (empezado por error, todo deshecho) no se guarda.
   · Un cambio de hora del teléfono hacia atrás nunca da duraciones negativas.
   v36c · Reparto del tiempo medido en vivo según el estado del reloj: en serie (trabajo, calentamiento y anotar), descansando
   (descansos y transiciones dentro de la sesión) y entre sesiones. Cada tramo se asigna al estado en que se estaba durante él
   (con la pantalla apagada en un descanso, ese tiempo es descanso). Al cerrar, el reparto se ajusta a la duración exacta. */
const ENTKEY='reloj-anomalo-entreno',ENT_INACT_MIN=60,ENT_PREGUNTA_MIN=10,ENT_MAX=3000,ENT_MARGEN=6e4,ENT_CATS=['serie','desc','entre'];
const entT0=()=>({serie:0,desc:0,entre:0});
const entNormT=x=>{const o=entT0();if(esObj(x))for(const k of ENT_CATS)o[k]=vNum(x[k],0,1e9)??0;return o};
const entNorm1=x=>{if(!esObj(x))return null;const id=vTxt(x.id,40),inicio=vNum(x.inicio,1e12,1e14),fin=x.fin==null?null:vNum(x.fin,1e12,1e14),ultima=vNum(x.ultima??x.fin??x.inicio,1e12,1e14);
  if(!id||inicio==null||ultima==null||(x.fin!=null&&fin==null))return null;const o={id,inicio,ultima:Math.max(ultima,inicio),t:entNormT(x.t)};
  if(fin!=null){o.fin=Math.max(fin,inicio);o.cierre=x.cierre==='auto'?'auto':'manual'}
  else{o.marca=vNum(x.marca,1e12,1e14)??o.ultima;o.est=ENT_CATS.includes(x.est)?x.est:'entre'}return o};
function entNorm(o){const r={act:null,lista:[]};if(!esObj(o))return r;const a=entNorm1(o.act);if(a&&a.fin==null)r.act=a;
  const ids=new Set();r.lista=(Array.isArray(o.lista)?o.lista:[]).map(entNorm1).filter(e=>e&&e.fin!=null&&!ids.has(e.id)&&ids.add(e.id)).slice(-ENT_MAX);return r}
let ent=entNorm(leerJSON(ENTKEY,null)),entConf=0,entFirma='',entAbierto=false;
const entGuarda=()=>guardarObj(ENTKEY,ent);
/** Estado del reloj ahora: en serie, descansando o entre sesiones. */
const entCat=()=>['work','cal','report'].includes(S.st)?'serie':['rest','shift','trans'].includes(S.st)?'desc':'entre';
/** Asigna el tiempo transcurrido desde la última muestra al estado en que se estaba. No escribe en el almacenamiento. */
function entMuestrea(t=Date.now()){const a=ent.act;if(!a)return;const d=t-a.marca;
  if(d>0)a.t[a.est]+=d;if(d>0||d<-6e4)a.marca=t;a.est=entCat()}
/** Sesiones (con series de trabajo) de un entrenamiento, por su hora de inicio. */
function entSesiones(e,hasta){const a=e.inicio-ENT_MARGEN,b=(hasta??e.fin??Date.now())+1000;
  return hist.filter(h=>{const t=Date.parse(h.start);return t>=a&&t<=b&&sinCal(h.sets||[]).length>0})}
const entDur=(e,t=Date.now())=>Math.max(0,(e.fin??t)-e.inicio);
const entReloj=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`};
const entMS=ms=>{const s=Math.max(0,Math.round(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
const entHora=t=>new Date(t).toLocaleTimeString('es-DO',{hour:'numeric',minute:'2-digit'});
/** Reparto del tiempo ajustado a la duración: lo que sobra (muestras después del final) se quita de «entre sesiones», luego del
    descanso; lo que falta (tramos sin muestra) es «entre sesiones». En curso, se suma el tramo actual al estado actual. */
function entReparto(e,t=Date.now()){const r={...e.t},dur=entDur(e,t);
  if(e.fin==null){const d=t-e.marca;if(d>0)r[e.est]+=d}
  let sum=r.serie+r.desc+r.entre;
  for(const k of ['entre','desc','serie']){if(sum<=dur)break;const q=Math.min(r[k],sum-dur);r[k]-=q;sum-=q}
  if(sum<dur)r.entre+=dur-sum;return r}
/** Algo se hizo (empezar una sesión o una serie, guardar, retomar): empieza el entrenamiento si no hay uno, o lo mantiene vivo. */
function entActividad(t=Date.now()){if(!Number.isFinite(t))t=Date.now();entCaducar(t);
  if(!ent.act){ent.act={id:'e'+t+Math.random().toString(36).slice(2,6),inicio:t,ultima:t,t:entT0(),marca:t,est:entCat()};entGuarda();return}
  entMuestrea(Math.max(t,ent.act.marca));
  if(t>ent.act.ultima+15e3||t<ent.act.ultima-6e4){ent.act.ultima=t;entGuarda()}   // como mucho una escritura cada 15 s (o si el reloj del teléfono retrocedió)
  else if(t>ent.act.ultima)ent.act.ultima=t}
/** Umbral de inactividad: con una sesión en curso (o esperando a retomarse), el de retomar; si no, ENT_INACT_MIN. */
const entUmbral=()=>(enCurso()||(typeof retomar!=='undefined'&&retomar)?RETOMAR_H*60:ENT_INACT_MIN)*6e4;
/** Si lleva demasiado sin actividad, se cierra en la última actividad. Devuelve true si cerró. */
function entCaducar(t=Date.now()){const a=ent.act;if(!a||t-a.ultima<=entUmbral())return false;return entCerrar(a.ultima,'auto')}
/** Cierra el entrenamiento en curso en el instante fin. Sin series guardadas no se guarda (se descarta). */
function entCerrar(fin,cierre='manual'){const a=ent.act;if(!a)return false;entMuestrea(Math.max(a.marca,Math.min(Date.now(),Math.max(fin,a.marca))));
  ent.act=null;entConf=0;
  const e={id:a.id,inicio:a.inicio,ultima:a.ultima,fin:Math.max(a.inicio,Math.min(fin,Math.max(Date.now(),a.ultima))),cierre,t:a.t};
  e.t=entReparto(e);
  if(entSesiones(e).length){ent.lista.push(e);if(ent.lista.length>ENT_MAX)ent.lista=ent.lista.slice(-ENT_MAX)}
  entGuarda();entFirma='';return true}
/** Cifras de un entrenamiento, todas del historial guardado (las mismas fuentes que el resto de la app). */
function entResumen(e,t=Date.now()){const ss=entSesiones(e,e.fin==null?t:undefined);let series=0,reps=0,ton=0,ef=0;
  for(const h of ss){ef+=efH(h);for(const r of sinCal(h.sets||[])){series++;const n=parseInt(r.reps,10)||0;if(r.k!=='isom.'){reps+=n;if(r.kg>0)ton+=r.kg*n}}}
  const dur=entDur(e,t);
  const grupos=ss.slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).map(h=>({n:h.grupo||'',ef:efH(h),meta:h.meta,ok:!!h.completa}));
  return {ss,series,reps,ton,ef,dur,grupos,ritmo:series?dur/series:0}}
/** Media de duración de los últimos 5 entrenamientos terminados (sin contar uno dado). */
function entMedia(salvo){const L=ent.lista.filter(e=>e.id!==salvo).slice(-5);return L.length>=2?L.reduce((n,e)=>n+entDur(e),0)/L.length:null}
function entSemana(t=Date.now()){const L=lunes(t),ls=ent.lista.filter(e=>e.inicio>=L),n=ls.length+(ent.act&&ent.act.inicio>=L?1:0);
  return {n,tot:ls.reduce((s,e)=>s+entDur(e),0)+(ent.act&&ent.act.inicio>=L?entDur(ent.act,t):0)}}
/* ---------- pantalla ---------- */
const entPct=(v,d)=>d>0?Math.round(100*v/d):0;
const ENT_ETQ={serie:'Series',desc:'Descanso',entre:'Entre sesiones'};
function entBarraHTML(r,dur,id=''){return `<div class="ent-split" role="img" aria-label="Reparto del tiempo">${ENT_CATS.map(k=>`<i class="s-${k}"${id?` id="${id}B${k}"`:''} style="width:${dur?100*r[k]/dur:0}%"></i>`).join('')}</div>`}
function entLeyendaHTML(r,dur,id=''){return `<div class="ent-leg">${ENT_CATS.map(k=>`<span><i class="s-${k}"></i>${ENT_ETQ[k]} <b${id?` id="${id}L${k}"`:''}>${entMS(r[k])} · ${entPct(r[k],dur)} %</b></span>`).join('')}</div>`}
function entKpiHTML(R,id=''){const k=(n,v,i)=>`<div class="ent-k"><b${i?` id="${i}"`:''}>${v}</b><span>${n}</span></div>`;
  return `<div class="ent-kpi">${k('sesiones',R.ss.length)}${k('series',R.series)}${k('efectivas',ef1(R.ef))}${k('reps',R.reps)}${k('tonelaje ('+uTxt()+')',R.ton?String(Math.round(aU(R.ton))).replace(/\B(?=(\d{3})+(?!\d))/g,' '):'—')}${k('min por serie',R.series?entMS(R.ritmo):'—',id?id+'Ritmo':'')}</div>`}
function entGruposHTML(G){return G.length?`<div class="ent-g">${G.map(g=>`<span class="${g.ok?'ok':''}">${esc(g.n)} <b>${ef1(g.ef)}/${g.meta??'—'}</b>${g.ok?' ✓':''}</span>`).join('')}</div>`:''}
function entRender(){const el=$('entBarra');if(!el)return;const t=Date.now();entCaducar(t);entMuestrea(t);const a=ent.act;
  if(tab!=='reloj'){if(tab==='historial')entRenderHist();return}
  if(a){const R=entResumen(a,t),libre=!enCurso(),gap=t-a.ultima,pregunta=libre&&gap>ENT_PREGUNTA_MIN*6e4,conf=entConf>t,rp=entReparto(a,t),dur=R.dur,est=entCat();
    const compacto=!libre&&!entAbierto;   // con una sesión en marcha, una línea: el botón grande del reloj sigue a la vista
    const firma=['a',a.id,R.ss.length,R.series,R.ef,libre,conf,pregunta,est,compacto].join('|');
    if(firma!==entFirma){entFirma=firma;el.hidden=false;el.className='ent'+(compacto?' ent-c':'');const med=entMedia();
      const pill=`<span class="ent-pill on"><i></i>${est==='serie'?'En serie':est==='desc'?'Descansando':'Entre sesiones'}</span>`;
      el.innerHTML=compacto?`<button type="button" class="ent-h ent-tg" data-ent="ver" aria-expanded="false" aria-label="Entrenamiento: ver el detalle"><span class="ent-t">Total</span><b id="entReloj">${entReloj(dur)}</b>${pill}<span class="ent-v">▾</span></button>${entBarraHTML(rp,dur,'ent')}`
        :`<div class="ent-h"><span class="ent-t">Entrenamiento</span>${pill}${!libre?'<button type="button" class="ent-v" data-ent="ver" aria-expanded="true" aria-label="Plegar">▴</button>':''}</div>
        <div class="ent-big"><b id="entReloj">${entReloj(dur)}</b><span>desde las ${entHora(a.inicio)}${med?`<br>tu media: ${durTxt(med)}`:''}</span></div>
        ${entBarraHTML(rp,dur,'ent')}${entLeyendaHTML(rp,dur,'ent')}${entKpiHTML(R,'ent')}${entGruposHTML(R.grupos)}
        <p class="ent-nota" id="entNota"></p>`
        +(libre?(conf&&pregunta?`<div class="ent-p"><span>Tu última serie fue a las ${entHora(a.ultima)}. ¿Cuándo terminaste?</span><div class="tog"><button type="button" class="btn2" data-ent="ahora">Ahora</button><button type="button" class="btn2" data-ent="ultima">A las ${entHora(a.ultima)}</button><button type="button" class="btn2" data-ent="no">Sigo entrenando</button></div></div>`
          :`<button type="button" class="btn2 ent-b${conf?' conf':''}" data-ent="terminar">${conf?'Toca otra vez para terminar el entrenamiento':'Terminar entrenamiento'}</button>`):'')}
    // lo que cambia cada segundo, sin reconstruir el recuadro (un toque en el botón no se pierde)
    const c=$('entReloj');if(c)c.textContent=entReloj(dur);
    for(const k of ENT_CATS){const b=$('entB'+k),l=$('entL'+k);if(b)b.style.width=(dur?100*rp[k]/dur:0)+'%';if(l)l.textContent=`${entMS(rp[k])} · ${entPct(rp[k],dur)} %`}
    const ri=$('entRitmo');if(ri)ri.textContent=R.series?entMS(R.ritmo):'—';
    const no=$('entNota');if(no)no.textContent=R.series?(libre?`Última serie hace ${durTxt(gap)}`:`${ef1(R.ef*36e5/Math.max(dur,6e4))} series efectivas por hora`):'Aún no hay series guardadas';
    return}
  // sin entrenamiento: el resumen del último si terminó hace menos de 12 h; si no, en cero con el resumen de la semana
  const u=ent.lista[ent.lista.length-1],W=entSemana(t);
  if(u&&t-u.fin<12*36e5){const R=entResumen(u),firma='u|'+u.id+'|'+R.ss.length+'|'+R.series+'|'+R.ef;
    if(firma!==entFirma){entFirma=firma;el.hidden=false;el.className='ent ent-fin';const rp=u.t,med=entMedia(u.id),dif=med?R.dur-med:null;
      el.innerHTML=`<div class="ent-h"><span class="ent-t">Último entrenamiento</span><span class="ent-pill">Terminado</span></div>
        <div class="ent-big"><b>${entReloj(R.dur)}</b><span>${entHora(u.inicio)}–${entHora(u.fin)}${u.cierre==='auto'?'<br>cerrado solo tras la última serie':''}${dif!=null&&Math.abs(dif)>=6e4?`<br>${dif>0?'+':'−'}${durTxt(Math.abs(dif))} frente a tu media`:''}</span></div>
        ${entBarraHTML(rp,R.dur)}${entLeyendaHTML(rp,R.dur)}${entKpiHTML(R)}${entGruposHTML(R.grupos)}`}}
  else{const firma='0|'+W.n+'|'+Math.round(W.tot/6e4);
    if(firma!==entFirma){entFirma=firma;el.hidden=false;el.className='ent ent-fin';const med=entMedia();
      el.innerHTML=`<div class="ent-h"><span class="ent-t">Entrenamiento</span><span class="ent-pill">Sin empezar</span></div>
        <div class="ent-big"><b>0:00:00</b><span>empieza con tu primera serie</span></div>
        <div class="ent-kpi">${[['esta semana',W.n],['tiempo semanal',W.tot?durTxt(W.tot):'—'],['duración media',med?durTxt(med):'—']].map(([n,v])=>`<div class="ent-k"><b>${v}</b><span>${n}</span></div>`).join('')}</div>
        <p class="ent-nota">Sigue contando entre sesiones; termina con «Terminar entrenamiento» o solo tras ${ENT_INACT_MIN} min sin actividad.</p>`}}}
function entRenderHist(){const el=$('entHist');if(!el)return;const L=ent.lista.slice(-10).reverse();
  if(!L.length&&!ent.act){el.hidden=true;return}el.hidden=false;
  const W=entSemana(),med=entMedia();
  const h=`<div class="ent-h"><span class="ent-t">Entrenamientos</span>${ent.act?'<span class="ent-pill on"><i></i>En curso</span>':''}</div>
    <div class="ent-kpi">${[['esta semana',W.n],['tiempo semanal',W.tot?durTxt(W.tot):'—'],['duración media',med?durTxt(med):'—']].map(([n,v])=>`<div class="ent-k"><b>${v}</b><span>${n}</span></div>`).join('')}</div>`
    +L.map(e=>{const R=entResumen(e),d=new Date(e.inicio);return `<div class="ent-f"><div class="ent-fh"><span>${d.toLocaleDateString('es-DO',{weekday:'short',day:'numeric',month:'short'})} · ${entHora(e.inicio)}–${entHora(e.fin)}</span><b>${durTxt(R.dur)}</b></div>${entBarraHTML(e.t,R.dur)}<span class="muted">${R.series} series · ${ef1(R.ef)} efectivas · ${R.grupos.map(g=>esc(g.n)).join(', ')||'—'}${e.cierre==='auto'?' · cerrado solo':''}</span></div>`}).join('');
  if(el.innerHTML!==h)el.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ent]');if(!b||!ent.act)return;const k=b.dataset.ent,t=Date.now();
  if(k==='ver'){entAbierto=!entAbierto;entRender();return}   // desplegar o plegar el detalle durante una sesión (no escribe nada)
  if(k==='terminar'){if(enCurso())return;if(entConf<=t){entConf=t+(t-ent.act.ultima>ENT_PREGUNTA_MIN*6e4?30e3:5e3);entRender();setTimeout(entRender,5100);return}entCerrar(t)}
  else if(k==='ahora')entCerrar(t);
  else if(k==='ultima')entCerrar(ent.act.ultima);
  else if(k==='no'){entConf=0;entActividad(t)}
  vibrar(60);entFirma='';render()});
// al salir de la app (pantalla apagada en un descanso, otra app) se guarda el reparto hasta ese momento
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(ent.act){entMuestrea();entGuarda()}}else entRender()});
setInterval(entRender,1000);
/* ---------- copia de seguridad ---------- */
const entCopia=()=>ent.lista.slice();
function entFusiona(L){const r={n:0,mal:0};if(!Array.isArray(L))return r;const ids=new Set(ent.lista.map(e=>e.id));
  for(const x of L.slice(0,ENT_MAX)){const e=entNorm1(x);if(!e||e.fin==null){r.mal++;continue}if(!ids.has(e.id)){ent.lista.push(e);ids.add(e.id);r.n++}}
  if(r.n){ent.lista.sort((a,b)=>a.inicio-b.inicio);entGuarda()}return r}
entCaducar();entRender();
