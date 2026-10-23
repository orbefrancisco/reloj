// Fase 3 (v30) · pantallas: Hoy (mi entrenamiento), Progreso → Volumen detallado y Por ejercicio, Historial con filtros y calendario,
// y la navegación de «Más». Se carga al final: usa reloj.js, analisis.js y auditoria.js. Todo se calcula desde los registros.
'use strict';
const PS_TIPOS=[['act.','serie principal'],['myo','mini-serie'],['parc.','parcial'],['final','variante final'],['isom.','isometría'],['cal.','calentamiento']];
const psTipo=k=>(PS_TIPOS.find(t=>t[0]===k)||[k,k])[1];
const psHace=t=>{if(!t)return 'nunca';const h=(Date.now()-t)/36e5;return h<48?`hace ${Math.round(h)} h`:`hace ${Math.round(h/24)} días`};
const psF=t=>new Date(t).toLocaleDateString('es-DO',{day:'numeric',month:'short'});

/* ---------- navegación ---------- */
let progSub='res';
function irA(t){tab=t;if(t==='hoy')renderHoy();if(t==='aprendizaje')renderCalib();if(t==='auditoria')renderAuditoria();if(t==='estilo')renderEstilos();render();window.scrollTo(0,0)}
{const tp=$('tProg').onclick;$('tProg').onclick=()=>{tp();renderProgSub()}}   // Progreso abre en su subpestaña actual
$('tHoy').onclick=()=>irA('hoy');$('tMas').onclick=()=>irA('mas');$('tApr').onclick=()=>irA('aprendizaje');$('tAud').onclick=()=>irA('auditoria');
function renderProgSub(){document.querySelectorAll('[data-psub]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.psub===progSub));
  [['res','pgRes'],['anal','pgAnal'],['vol','pgVol'],['ej','pgEj']].forEach(([k,id])=>{const el=$(id);if(el)el.hidden=k!==progSub});
  if(progSub==='anal')renderAnalisis();else if(progSub==='vol')renderVolDet();else if(progSub==='ej')renderEjDet()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-psub],[data-volver],[data-entrenar]');if(!b)return;const d=b.dataset;
  if(d.psub){progSub=d.psub;renderProgSub();return}
  if(d.volver){irA('mas');return}
  if(d.entrenar){if(enCurso()){irA('reloj');return}const [k,v]=d.entrenar.split(':');tab='reloj';
    if(k==='r'){const x=document.querySelector(`#rutinas [data-r="${v}"]`);if(x)x.click()}
    else{const r0=document.querySelector('#rutinas [data-r="0"]');if(r0&&rutI!==0)r0.click();const x=document.querySelector(`#grupos [data-g="${v}"]`);if(x)x.click()}
    render();window.scrollTo(0,0)}});

/* ---------- Hoy: mi entrenamiento ---------- */
// alternativas de un ejercicio: del mismo grupo, que trabajen lo mismo y que ninguna zona cuidada obligue a cambiar
function psAlternativas(g,E,n=2){const mE=musculos(E.n,g),zs=lesAct();
  return ANIM.lista.filter(d=>d.g===g&&d.n!==E.n&&d.id!=='vacio'&&d.id!=='generico'&&!(zs.length&&lesAcc(d.n,g,zs).v>=3))
    .map(d=>{const m=musculos(d.n,g);let s=0;for(const k in mE)if(m[k])s+=Math.min(mE[k],m[k]);return {n:d.n,s}}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.n)}
let hoyVer={};
function renderHoy(){const P=anPlan(),D=864e5;
  let h='';
  if(P.descanso)h=`<p><b>Hoy toca descansar.</b> ${esc(P.txt)}</p><p class="hint">Es una regla prudente (48 h entre sesiones del mismo grupo y tu rango semanal); si entrenas igual, decides tú.</p>`;
  else{const gs=P.grupos;
    h=`<p class="hint">Propuesta para hoy a partir de lo que llevas esta semana, tus descansos, tus molestias y tu rendimiento. Cada recomendación tiene su «¿por qué?»; el reloj no te impide entrenar otra cosa.</p>`
      +gs.map(p=>{const E=CAT[p.g].e.filter(x=>!x.levy&&!x.lesFuera),abierto=hoyVer[p.g];
        return `<div class="hoyg ${p.acc}"><div class="top"><b>${esc(CAT[p.g].n)}</b><span class="hoyacc">${AN_ACC[p.acc]}</span></div>
          <p class="hint" style="margin:2px 0">Volumen recomendado: <b>${p.meta} series efectivas</b> en ${E.length} ${E.length===1?'ejercicio':'ejercicios'}</p>
          <ul class="hoyej">${E.map(x=>{const al=psAlternativas(p.g,x);return `<li>${esc(x.n)}${x.lesDe?` <span class="muted">(en lugar de ${esc(x.lesDe)})</span>`:''}${al.length?`<br><span class="muted">alternativas: ${al.map(esc).join(' · ')}</span>`:''}</li>`}).join('')}</ul>
          <div class="acc"><button type="button" data-entrenar="${P.rut!=null&&gs.length>1?'r:'+P.rut:'g:'+p.g}">${P.rut!=null&&gs.length>1?'Entrenar la rutina':'Entrenar '+esc(CAT[p.g].n.toLowerCase())}</button><button type="button" data-hoypor="${p.g}">${abierto?'Ocultar':'¿Por qué?'}</button></div>
          ${abierto?`<ul class="anmot">${p.mot.map(m=>`<li>${esc(m)}</li>`).join('')}</ul>`:''}</div>`}).join('')}
  $('hoyPlan').innerHTML=h;
  // todos los grupos: último estímulo, volumen de 7 días frente al objetivo, acción y molestias
  const V=volumen(Date.now()-7*D,Date.now()+D);
  $('hoyGrupos').innerHTML=`<div class="tbl"><table class="hoyt"><thead><tr><th>Grupo</th><th>Último</th><th>7 días</th><th>Recomendación</th></tr></thead><tbody>${Object.keys(CAT).map(g=>{const p=anPlanGrupo(g),[lo,hi]=rangoGrupo(g),v=V.grupo(g);
    return `<tr><td>${esc(CAT[g].n)}${enPausa(g)?' <small>pausa</small>':''}</td><td>${psHace(ultimaVez(g))}</td><td><span class="mpt ${estadoVol(v,[lo,hi])}"></span> ${ef1(v)} / ${lo}–${hi}</td><td><button type="button" class="lnk" data-entrenar="g:${g}">${AN_ACC[p.acc]}</button></td></tr>`}).join('')}</tbody></table></div>
    <p class="hint">7 días: series efectivas atribuidas al grupo (directas e indirectas ponderadas) frente a su objetivo orientativo semanal. Toca la recomendación para entrenar ese grupo.</p>`;
  renderPrep()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-hoypor]');if(!b)return;const g=b.dataset.hoypor;hoyVer[g]=!hoyVer[g];renderHoy()});

/* ---------- Progreso → Volumen detallado ----------
   Cada fila (grupo o zona) se puede tocar para ver las series que la originan. Distingue series únicas (cada serie efectiva cuenta
   una vez) de atribuciones (una serie suma, ponderada, a varios grupos o zonas): la suma de atribuciones puede superar a las únicas.
   Cada tipo de serie aporta según su propia regla de efectivas (principal hasta 1, mini-serie hasta ½, isometría hasta ½…). */
let volDias=7,volNivel='g',volSel='';
function psVolumen(dias,nivel){const D=864e5,b=Date.now()+D,a=Date.now()-dias*D,U={},filas=[];let unicas=0;
  hist.forEach(h=>{const g=gDe(h),t=Date.parse(h.start);if(!g||!CAT[g]||t<a||t>=b)return;
    (h.sets||[]).forEach(r=>{const c=efectiva(r);if(!c)return;const ej=nomFila(r,g),ms=musculos(ej,g),porU={};
      for(const [m,f] of Object.entries(ms)){if(!MUS[m])continue;const u=nivel==='g'?MUS[m][1]:m;porU[u]=Math.max(porU[u]||0,f)}
      if(!Object.keys(porU).length)return;unicas+=c;
      for(const [u,f] of Object.entries(porU)){const o=U[u]=U[u]||{dir:0,ind:0,tipos:{},dias:new Set(),filas:[]};if(f>=1)o.dir+=c*f;else o.ind+=c*f;
        o.tipos[r.k]=(o.tipos[r.k]||0)+1;o.dias.add(diaK(t));o.filas.push({t,ej,k:r.k,reps:r.reps,rir:r.rir,kg:r.kg,c,f})}})});
  return {U,unicas}}
function renderVolDet(){const el=$('pVolDet');if(!el)return;const {U,unicas}=psVolumen(volDias,volNivel),claves=volNivel==='g'?Object.keys(CAT):Object.keys(MUS);
  const nom=k=>volNivel==='g'?CAT[k].n:MUS[k][0],rango=k=>volNivel==='g'?rangoGrupo(k):rangoZona(k),esc7=volDias/7;
  const suma=claves.reduce((s,k)=>s+(U[k]?U[k].dir+U[k].ind:0),0);
  let h=`<p class="hint">${[7,14,28,90].map(d=>`<button type="button" class="chipb" data-vold="${d}" aria-pressed="${d===volDias}">${d} días</button>`).join('')}
    · ${[['g','grupos'],['z','zonas']].map(([k,n])=>`<button type="button" class="chipb" data-voln="${k}" aria-pressed="${k===volNivel}">${n}</button>`).join('')}</p>
    <div class="tbl"><table><thead><tr><th style="text-align:left">${volNivel==='g'?'Grupo':'Zona'}</th><th>Directas</th><th>Indirectas</th><th>Total</th><th>Objetivo</th><th>Días</th></tr></thead><tbody>`
    +claves.map(k=>{const o=U[k]||{dir:0,ind:0,dias:new Set()},[lo,hi]=rango(k),tot=o.dir+o.ind;
      return `<tr data-vols="${k}" style="cursor:pointer"${volSel===k?' class="on"':''}><td style="text-align:left;white-space:normal">${esc(nom(k))}</td><td>${ef1(o.dir)}</td><td>${ef1(o.ind)}</td><td><span class="mpt ${estadoVol(tot/esc7,[lo,hi])}"></span> ${ef1(tot)}</td><td>${ef1(lo*esc7)}–${ef1(hi*esc7)}</td><td>${o.dias.size}</td></tr>`}).join('')
    +`</tbody></table></div><p class="hint">Series únicas en el periodo: <b>${ef1(unicas)}</b> · suma de atribuciones: <b>${ef1(suma)}</b>. ${suma>unicas+.05?`La diferencia (${ef1(suma-unicas)}) son aportes de una misma serie a varios ${volNivel==='g'?'grupos':'músculos'}; no es doble conteo de series.`:''} El objetivo es orientativo y se escala al periodo (${volDias} días); el color compara con el semanal.</p>`;
  if(volSel&&U[volSel]){const o=U[volSel],tip=Object.entries(o.tipos).map(([k,n])=>`${psTipo(k)} ${n}`).join(' · ');
    h+=`<div class="andet"><p><b>${esc(nom(volSel))}</b>: ${o.filas.length} series en ${o.dias.size} días · ${tip}</p>
      <div class="tbl"><table class="psdet"><thead><tr><th style="text-align:left">Fecha · ejercicio · tipo</th><th>Reps · reserva</th><th>Aporte</th></tr></thead><tbody>${o.filas.slice().sort((a,b)=>b.t-a.t).slice(0,80).map(x=>
        `<tr><td style="text-align:left;white-space:normal">${psF(x.t)} · ${esc(x.ej)}<br><span class="muted">${psTipo(x.k)}</span></td><td>${esc(x.reps)}${x.kg>0?' × '+num(aU(x.kg)):''} · ${esc(x.rir)}</td><td title="efectiva ${num2(x.c)} × fracción ${num2(x.f)}">${num2(x.c)} × ${num2(x.f)}<br><b>${num2(x.c*x.f)}</b></td></tr>`).join('')}</tbody></table></div>
      <p class="hint">Aporte = efectiva × fracción. Efectiva: cuánto cuenta esa serie según su tipo y su reserva (principal y parciales hasta 1, mini-serie hasta ½, isometría hasta ½; reserva 4+ no cuenta). Fracción: cuánto trabaja ${volNivel==='g'?'este grupo':'esta zona'} (1 = músculo principal). Más recientes primero.</p></div>`}
  el.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-vold],[data-voln],[data-vols]');if(!b)return;const d=b.dataset;
  if(d.vold)volDias=+d.vold;else if(d.voln){volNivel=d.voln;volSel=''}else if(d.vols)volSel=volSel===d.vols?'':d.vols;renderVolDet()});

/* ---------- Progreso → Por ejercicio ----------
   Por sesión: carga, reps, reserva, 1RM estimado (con peso) o reps hasta el fallo, trabajo (reps × carga), series, descanso previo
   a la primera serie y récords. Tendencias de fuerza (1RM) y de resistencia (reps con la misma carga) con el detector de la Fase 5. */
let ejSel='';
function psEjercicios(){const c={};hist.forEach(h=>{const g=gDe(h);if(!g||!CAT[g])return;(h.sets||[]).forEach(r=>{if(r.k==='act.'){const ej=nomFila(r,g);c[ej]=(c[ej]||0)+1}})});
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([n])=>n)}
function renderEjDet(){const el=$('pEjDet');if(!el)return;const L=psEjercicios();if(!L.length){el.innerHTML='<p class="hint">Aún no hay series principales registradas.</p>';return}
  if(!L.includes(ejSel))ejSel=L[0];
  const ses=hist.slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).map(h=>{const g=gDe(h);if(!g||!CAT[g])return null;const S2=h.sets||[],ix=S2.findIndex(r=>nomFila(r,g)===ejSel&&r.k==='act.');if(ix<0)return null;
    const filas=S2.filter(r=>nomFila(r,g)===ejSel&&r.k!=='cal.'),r=S2[ix],prev=ix>0?S2[ix-1]:null,trab=filas.reduce((s,x)=>s+(x.kg>0?x.kg*(parseInt(x.reps,10)||0):0),0);
    return {t:Date.parse(h.start),r,n:filas.length,trab,desc:prev&&prev.rest?prev.rest:null,pr:filas.some(x=>x.pr),e1:r.kg>0?e1(r):null,rtf:/\+/.test(r.rir||'')?null:(parseInt(r.reps,10)||0)+rirN(r.rir)}}).filter(Boolean);
  const comp=anComparables().filter(s=>s.ej===ejSel),cl=comp.map(s=>({s,c:anClasifica(s.pts)}));
  const mejor=ses.reduce((m,x)=>x.e1!=null&&(m==null||x.e1>m)?x.e1:m,null);
  let h=`<p class="hint"><select id="ejSel" aria-label="Ejercicio">${L.map(n=>`<option${n===ejSel?' selected':''}>${esc(n)}</option>`).join('')}</select></p>
    <div class="tbl"><table class="psdet"><thead><tr><th style="text-align:left">Fecha</th><th>Carga × reps · reserva</th><th>Medida</th><th>Series · desc.</th></tr></thead><tbody>${ses.slice().reverse().map(x=>
      `<tr><td style="text-align:left">${psF(x.t)}${x.pr?' ★':''}</td><td>${x.r.kg>0?num(aU(x.r.kg))+' '+uTxt():x.r.kg===0?'corporal':'sin carga'} × ${esc(x.r.reps)} · ${esc(x.r.rir)}</td>`
      +`<td>${x.e1!=null?`1RM ${num(aU(x.e1))}${x.e1===mejor?' ↑':''}`:x.rtf!=null?`${x.rtf} al fallo`:'—'}${x.trab?`<br><span class="muted">trabajo ${num(aU(x.trab))}</span>`:''}</td><td>${x.n}${x.desc?` · ${x.desc} s`:''}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint">Primera serie principal de cada sesión. Medida: 1RM estimado si hay peso; si no, reps al fallo (reps + reserva; con «3+»/«4+» no se calcula). Trabajo = reps × carga de todas sus series con peso. Series del ejercicio en la sesión · descanso antes de la primera. ★ récord · ↑ mejor 1RM estimado.</p>`;
  h+=cl.length?cl.map(({s,c})=>`<p><b>${s.carga==='peso'?'Fuerza (1RM estimado)':s.carga==='pc'?'Resistencia con peso corporal (reps al fallo)':'Reps al fallo con carga sin anotar'}:</b> ${esc(AN_EST[c.estado])} — ${esc(c.txt)}${c.cv!=null?` · variabilidad ±${Math.round(c.cv*100)} %`:''}.</p>`+psGraf(s.pts)).join('')
    :'<p class="hint">Sin medidas comparables todavía.</p>';
  el.innerHTML=h;const s=$('ejSel');if(s)s.onchange=()=>{ejSel=s.value;renderEjDet()}}
// gráfico de una serie comparable: puntos observados y línea de tendencia (Theil–Sen) en otro estilo: lo estimado no se confunde con lo medido
function psGraf(pts){if(pts.length<2)return '';const W=300,H=110,P=24,ys=pts.map(p=>p.v),mn=Math.min(...ys)*.95,mx=Math.max(...ys)*1.05||1,
  x=i=>P+i*(W-P-8)/(pts.length-1),y=v=>H-16-(v-mn)/(mx-mn||1)*(H-26),sl=anTheilSen(ys),med=anMed(ys.map((v,i)=>v-sl*i));
  return `<svg viewBox="0 0 ${W} ${H}" class="psg" role="img" aria-label="Evolución observada y tendencia estimada">
    <line x1="${x(0)}" y1="${y(med)}" x2="${x(pts.length-1)}" y2="${y(med+sl*(pts.length-1))}" stroke="var(--muted)" stroke-dasharray="4 3"/>
    <polyline fill="none" stroke="var(--art)" stroke-width="1.6" points="${pts.map((p,i)=>`${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}"/>
    ${pts.map((p,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="2.6" fill="var(--art)"><title>${psF(p.t)}: ${num(p.v)}</title></circle>`).join('')}
    <text x="${P}" y="${H-3}" class="rect">${psF(pts[0].t)}</text><text x="${W-8}" y="${H-3}" text-anchor="end" class="rect">${psF(pts[pts.length-1].t)}</text></svg>
    <p class="hint" style="margin-top:0">Línea continua: observado · discontinua: tendencia estimada.</p>`}

/* ---------- Historial: filtros, calendario y exportación de lo filtrado ---------- */
let histF={g:'',ej:'',k:'',dias:0,dia:''},hCalOff=0;
function histVisibles(){const a=histF.dias?Date.now()-histF.dias*864e5:0;
  return hist.filter(h=>{const g=gDe(h),t=Date.parse(h.start),S2=h.sets||[];
    return (!histF.g||g===histF.g)&&(!histF.ej||S2.some(r=>nomFila(r,g)===histF.ej))&&(!histF.k||S2.some(r=>r.k===histF.k))&&(!a||t>=a)&&(!histF.dia||diaK(t)===histF.dia)})}
function renderFiltrosHist(){const el=$('hFiltros');if(!el)return;const ejs=[...new Set(hist.flatMap(h=>{const g=gDe(h);return g&&CAT[g]?(h.sets||[]).map(r=>nomFila(r,g)):[]}))].filter(Boolean).sort();
  const sel=(id,ops,v,txt)=>`<label class="hfl">${txt}<select data-hf="${id}">${ops.map(([k,n])=>`<option value="${esc(k)}"${String(k)===String(v)?' selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
  const base=new Date();base.setDate(1);base.setHours(0,0,0,0);base.setMonth(base.getMonth()+hCalOff);const y=base.getFullYear(),mo=base.getMonth(),n=new Date(y,mo+1,0).getDate(),ini=(base.getDay()+6)%7;
  const cuenta={};hist.forEach(h=>{const k=diaK(Date.parse(h.start));cuenta[k]=(cuenta[k]||0)+1});
  let cal='<div class="hcal">'+['L','M','X','J','V','S','D'].map(d=>`<span class="hd">${d}</span>`).join('')+'<span></span>'.repeat(ini);
  for(let d=1;d<=n;d++){const k=diaK(new Date(y,mo,d).getTime()),c=cuenta[k]||0;cal+=`<button type="button" data-hdia="${k}" class="${c?'con':''}${histF.dia===k?' on':''}"${c?'':' disabled'}>${d}${c>1?`<sup>${c}</sup>`:''}</button>`}
  cal+='</div>';
  const vis=histVisibles(),filtrado=histF.g||histF.ej||histF.k||histF.dias||histF.dia;
  el.innerHTML=`<div class="calnav"><button type="button" data-hcal="-1" aria-label="Mes anterior">‹</button><b>${base.toLocaleDateString('es-DO',{month:'long',year:'numeric'})}</b><button type="button" data-hcal="1" aria-label="Mes siguiente"${hCalOff>=0?' disabled':''}>›</button></div>${cal}
    <div class="hfil">${sel('g',[['','Todos los grupos'],...Object.keys(CAT).map(g=>[g,CAT[g].n])],histF.g,'Grupo')}${sel('ej',[['','Todos los ejercicios'],...ejs.map(e=>[e,e])],histF.ej,'Ejercicio')}
    ${sel('k',[['','Todas las series'],...PS_TIPOS.map(([k,n])=>[k,n])],histF.k,'Tipo de serie')}${sel('dias',[[0,'Todo'],[7,'7 días'],[14,'14 días'],[28,'28 días'],[90,'90 días']],histF.dias,'Periodo')}</div>
    <p class="hint">${vis.length} de ${hist.length} sesiones${histF.dia?` · día ${esc(histF.dia)}`:''}.${filtrado?' <button type="button" class="lnk" data-hfx="1">Quitar filtros</button>':''}
    ${vis.length?` <button type="button" class="lnk" data-hexp="json">Exportar estas (JSON)</button> <button type="button" class="lnk" data-hexp="csv">Exportar sus series (CSV)</button>`:''}</p>`}
document.addEventListener('change',e=>{const s=e.target.closest('[data-hf]');if(!s)return;const k=s.dataset.hf;histF[k]=k==='dias'?+s.value:s.value;renderHist()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-hdia],[data-hcal],[data-hfx],[data-hexp]');if(!b)return;const d=b.dataset;
  if(d.hdia)histF.dia=histF.dia===d.hdia?'':d.hdia;else if(d.hcal)hCalOff=Math.min(0,hCalOff+(+d.hcal));else if(d.hfx)histF={g:'',ej:'',k:'',dias:0,dia:''};
  else if(d.hexp){const L=histVisibles();
    if(d.hexp==='json')entregar(`sesiones-filtradas-${hoy()}.json`,JSON.stringify({app:'reloj-anomalo',v:1,exportado:new Date().toISOString(),filtros:histF,sesiones:L},null,1),'application/json');
    else{const q=v=>`"${String(v??'').replace(/"/g,'""')}"`,fil=[['fecha','grupo','sesion','n','ejercicio','tipo','reps','reserva','kg','efectiva','molestia']];
      L.slice().reverse().forEach(h=>(h.sets||[]).forEach((r,i)=>{if(histF.k&&r.k!==histF.k)return;const g=gDe(h),ej=nomFila(r,g);if(histF.ej&&ej!==histF.ej)return;
        fil.push([new Date(h.start).toLocaleString('es-DO'),h.grupo,h.id,i+1,ej,r.k,r.reps,r.rir,r.kg??'',num2(efectiva(r)),r.mol||''])}));
      entregar(`series-filtradas-${hoy()}.csv`,'﻿'+fil.map(f=>f.map(q).join(',')).join('\n'),'text/csv')}
    return}
  renderHist()});
