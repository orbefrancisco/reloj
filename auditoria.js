// Fase 6 (v29) · Centro de auditoría de datos: SOLO LECTURA. Revisa la integridad del historial y la coherencia de lo que se
// calcula a partir de él, y separa errores reales (algo está mal guardado) de avisos (algo raro que conviene mirar) e información.
// No repara nada: cualquier reparación futura pedirá confirmación y hará antes una copia de seguridad.
// Se carga después de reloj.js y analisis.js.
'use strict';
const AUD_VERSION='aud-3';   // v31: calidad de la carga; v38: integridad física
function auditarDatos(){const E=[],A=[],I=[],ahora=Date.now(),err=(c,t,ids)=>E.push({c,t,ids}),av=(c,t,ids)=>A.push({c,t,ids});
  // --- sesiones ---
  // v37: Map, no {}: un id importado como «constructor» o «hasOwnProperty» chocaba con las propiedades de Object y la auditoría fallaba entera
  const porId=new Map();hist.forEach(h=>{const L=porId.get(h.id);if(L)L.push(h);else porId.set(h.id,[h])});
  const dup=[...porId].filter(([,v])=>v.length>1).map(([k])=>k);if(dup.length)err('id-duplicado',`${dup.length} identificadores de sesión repetidos`,dup);
  const huerf=hist.filter(h=>!gDe(h)||!CAT[gDe(h)]).map(h=>h.id);if(huerf.length)err('huerfana',`${huerf.length} sesiones sin un grupo muscular válido`,huerf);
  const fut=hist.filter(h=>Date.parse(h.start)>ahora+36e5).map(h=>h.id);if(fut.length)err('futuro',`${fut.length} sesiones con fecha en el futuro`,fut);
  const ed=hist.filter(h=>h.creada&&h.editada&&Date.parse(h.editada)<Date.parse(h.creada)).map(h=>h.id);if(ed.length)err('edicion-antes',`${ed.length} sesiones editadas antes de registrarse`,ed);
  const reg=hist.filter(h=>h.creada&&Date.parse(h.creada)<Date.parse(h.start)-6e4).map(h=>h.id);if(reg.length)av('registro-antes',`${reg.length} sesiones registradas antes de su hora de inicio`,reg);
  // estadísticas recalculables: lo guardado en la sesión debe salir de sus series
  const efMal=hist.filter(h=>(h.sets||[]).length&&h.efectivas!=null&&Math.abs(h.efectivas-efDe(h.sets))>.05).map(h=>h.id);
  if(efMal.length)err('efectivas',`${efMal.length} sesiones cuyas series efectivas guardadas no coinciden con las recalculadas de sus series`,efMal);
  const serMal=hist.filter(h=>(h.sets||[]).length&&h.series!==sinCal(h.sets).length).map(h=>h.id);
  if(serMal.length)err('series',`${serMal.length} sesiones cuyo número de series no coincide con sus filas`,serMal);
  const metaMal=hist.filter(h=>h.completa&&h.meta>0&&!metaHechaH(h)).map(h=>h.id);if(metaMal.length)av('completa-sin-meta',`${metaMal.length} sesiones marcadas «Completa» sin llegar a la meta con sus series actuales`,metaMal);
  // --- series ---
  let nSer=0,conKg=0,cens=0,noNum=0,kgRaro=0,lbRaro=0,repet=0;const idsNoNum=new Set(),idsKg=new Set(),idsRep=new Set(),idsLb=new Set();
  hist.forEach(h=>{let prev=null;(h.sets||[]).forEach(r=>{nSer++;if(r.kg!=null)conKg++;if(/\+/.test(r.rir||''))cens++;
    if(r.k!=='isom.'&&r.k!=='cal.'&&!/^\d+$/.test(r.reps||'')&&!/^\d+ s$/.test(r.reps||'')){noNum++;idsNoNum.add(h.id)}
    if(r.kg!=null&&(r.kg<0||r.kg>500)){kgRaro++;idsKg.add(h.id)}
    if(r.kg>0){const lb=r.kg/LB;if(Math.abs(lb*4-Math.round(lb*4))>.02&&Math.abs(r.kg*4-Math.round(r.kg*4))>.02){lbRaro++;idsLb.add(h.id)}}
    if(prev&&['ex','k','reps','rir','kg','P'].every(k=>prev[k]===r[k])){repet++;idsRep.add(h.id)}prev=r})});
  if(noNum)err('reps',`${noNum} series con repeticiones no numéricas`,[...idsNoNum]);
  if(kgRaro)err('kg-rango',`${kgRaro} series con un peso fuera de rango (negativo o más de 500 kg)`,[...idsKg]);
  if(lbRaro)av('kg-lb',`${lbRaro} series cuyo peso no es un múltiplo de ¼ ni en kg ni en lb: posible error de conversión`,[...idsLb]);
  if(repet)av('serie-repetida',`${repet} series idénticas a la anterior en todos sus valores (posible doble toque)`,[...idsRep]);
  // (v38) integridad física: series cuyo tiempo medido no cuadra con sus repeticiones y descansos distintos del planificado. Solo marca.
  let fis={imp:0,impr:0,conf:0,desc:0,salt:0,alar:0,intr:0,med:0,sinT:0};const idsImp=new Set(),idsImpr=new Set(),idsSalt=new Set();
  hist.forEach(h=>{if(!h.fis){if((h.sets||[]).length)fis.sinT++;return}(h.sets||[]).forEach(r=>{if(r.k==='cal.')return;
    if(r.plaus==='imposible'){fis.imp++;idsImp.add(h.id)}else if(r.plaus==='improbable'){fis.impr++;idsImpr.add(h.id)}else if(r.plaus==='confirmada')fis.conf++;else if(r.plaus==='desconocida')fis.desc++;
    if(r.restQ==='saltado'){fis.salt++;idsSalt.add(h.id)}else if(r.restQ==='alargado')fis.alar++;else if(r.restQ==='interrumpido')fis.intr++;else if(r.restQ==='medido')fis.med++})});
  if(fis.imp)av('serie-imposible',`${fis.imp} series con un tiempo imposible para sus repeticiones (menos de ${num(FIS_IMP)} s por repetición): no cuentan en el volumen ni en la meta`,[...idsImp]);
  if(fis.impr)av('serie-improbable',`${fis.impr} series muy rápidas (menos de ${num(FIS_IMPROB)} s por repetición): cuentan, pero no se usan para aprender ni para la progresión`,[...idsImpr]);
  if(fis.salt)av('descanso-saltado',`${fis.salt} descansos saltados (más cortos que el planificado): la mini-serie siguiente no se usa para aprender`,[...idsSalt]);
  // (v31) calidad de la carga: series de trabajo sin carga conocida (no se comparan entre sesiones ni entran en el aprendizaje como verificadas)
  // y ceros dudosos (0 = peso corporal en un ejercicio con carga externa: el antiguo «−» desde vacío). Nada se borra: solo se marca.
  let sinCarga=0,cero=0,conCfg=0,cambiada=0;const idsCero=new Set(),idsCamb=new Set();
  hist.forEach(h=>{const g=gDe(h);(h.sets||[]).forEach(r=>{if(!['act.','myo','parc.','apr.'].includes(r.k))return;
    if(r.kgSrc==='cal')conCfg++;if(r.kgCambio){cambiada++;idsCamb.add(h.id)}
    if(cargaDe(r,g)==null){if(r.kg===0){cero++;idsCero.add(h.id)}else sinCarga++}})});
  if(cero)av('cero-dudoso',`${cero} series con 0 (= peso corporal) en ejercicios con carga externa: se tratan como carga desconocida y no se comparan`,[...idsCero]);
  // sesiones casi simultáneas del mismo grupo (posible duplicado por importación)
  const cerca=[];const H=hist.slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
  for(let i=1;i<H.length;i++)if(gDe(H[i])===gDe(H[i-1])&&Date.parse(H[i].start)-Date.parse(H[i-1].start)<5*6e4)cerca.push(H[i].id);
  if(cerca.length)av('casi-duplicada',`${cerca.length} sesiones del mismo grupo empezadas a menos de 5 min de otra`,cerca);
  // --- medallas y modelo ---
  const gan=medallasGanadas(),vistas=medVistas||{};
  const sinCumplir=Object.keys(vistas).filter(k=>!gan[k]);if(sinCumplir.length)av('medalla',`${sinCumplir.length} medallas guardadas que el historial actual ya no cumple (${sinCumplir.join(', ')}); se siguen mostrando`,[]);
  const fechaDist=Object.keys(vistas).filter(k=>gan[k]&&diaK(Date.parse(gan[k]))!==diaK(Date.parse(vistas[k])));
  if(fechaDist.length)I.push({c:'medalla-fecha',t:`${fechaDist.length} medallas con fecha guardada distinta de la que da el historial actual (${fechaDist.join(', ')}); se muestra la del historial`});
  const R=recEval(),selMal=Object.keys(CAT).filter(g=>(modState.sel[g]||{}).m&&(modState.sel[g].m!==R[g].modelo||Math.abs((modState.sel[g].k||1)-R[g].kUsa)>.02));
  if(selMal.length)av('modelo',`el modelo guardado no coincide con la evaluación actual en ${selMal.length} grupos; se actualizará al cerrar la próxima sesión`,selMal);
  // --- información ---
  const esq={};hist.forEach(h=>{const v=h.esq||1;esq[v]=(esq[v]||0)+1});
  I.push({c:'resumen',t:`${hist.length} sesiones · ${nSer} filas · ${conKg} con peso anotado (${nSer?Math.round(conKg*100/nSer):0} %) · ${cens} con reserva «3+»/«4+» (cotas)`});
  I.push({c:'esquema',t:'versiones de esquema: '+Object.entries(esq).map(([v,n])=>`v${v}: ${n}`).join(' · ')+' (v1 = anterior a v26, sin fechas de registro ni edición)'});
  I.push({c:'modelo',t:`recuperación: ${R._.bien?'aprendido en uso':'modelo fijo'} — ${R._.por}`});
  I.push({c:'fisica',t:`integridad física (v38): ${fis.med} descansos medidos · ${fis.salt} saltados · ${fis.alar} alargados · ${fis.intr} interrumpidos por un cierre · ${fis.desc} series de duración desconocida (retomadas) · ${fis.conf} confirmadas a mano · ${fis.sinT} sesiones anteriores sin tiempos (cuentan la mitad en el aprendizaje)`});
  {const c=R._.cal;I.push({c:'carga',t:`calidad de la carga (v31): ${sinCarga} series de trabajo sin carga conocida (se conservan; no se comparan entre sesiones) · ${conCfg} con la carga de «Mis cargas» · ${cambiada} mini-series con otra carga que su serie principal (${idsCamb.size} sesiones) · aprendizaje: ${c.v} mini-series con carga verificada, ${c.p} presuntas (cuentan ½), ${c.cambio+c.mixta} fuera por cambio o mezcla de carga`})}
  if(typeof cgResumenTxt==='function')I.push({c:'cargas',t:cgResumenTxt()});
  I.push({c:'cuidar',t:lesOn()?`cuidando ${lesQueN()}`:'sin zonas cuidadas activas'});
  const dec=leerJSON(DECKEY,[]);if(Array.isArray(dec)&&dec.length)I.push({c:'decisiones',t:`${dec.length} veces entrenaste contra la recomendación del plan (anotadas)`});
  return {app:'reloj-anomalo',tipo:'auditoria',version:AUD_VERSION,esquema:ESQUEMA,fecha:new Date().toISOString(),errores:E,avisos:A,info:I}}
function audTexto(r){const L=[`Auditoría de datos del Reloj anómalo · ${new Date(r.fecha).toLocaleString('es-DO')} · ${r.version}`,'',
  `ERRORES (${r.errores.length})`,...r.errores.map(x=>`- ${x.t}`),'',`AVISOS (${r.avisos.length})`,...r.avisos.map(x=>`- ${x.t}`),'','INFORMACIÓN',...r.info.map(x=>`- ${x.t}`)];
  return L.join('\n')}
let audUlt=null;
function renderAuditoria(){const el=document.getElementById('hAudit');if(!el)return;const r=audUlt;
  const lista=(L,cls)=>L.length?`<ul class="audl ${cls}">${L.map(x=>`<li>${esc(x.t)}${x.ids&&x.ids.length?` <span class="muted">(${x.ids.slice(0,3).map(esc).join(', ')}${x.ids.length>3?'…':''})</span>`:''}</li>`).join('')}</ul>`:'<p class="hint">Ninguno.</p>';
  el.innerHTML=`<p class="hint">Revisa la integridad de tus datos sin cambiar nada: identificadores, fechas, estadísticas recalculables desde las series, pesos, medallas y el estado del modelo.</p>
    <button type="button" class="btn2" data-aud="run">${r?'Volver a revisar':'Revisar mis datos'}</button>`
    +(r?`<p><b>${r.errores.length?`${r.errores.length} ${r.errores.length===1?'error':'errores'}`:'Sin errores'}</b> · ${r.avisos.length} ${r.avisos.length===1?'aviso':'avisos'}</p>
      <h3>Errores</h3>${lista(r.errores,'err')}<h3>Avisos</h3>${lista(r.avisos,'av')}<h3>Información</h3>${lista(r.info,'inf')}
      <div class="acc"><button type="button" data-aud="json">Exportar informe (JSON)</button><button type="button" data-aud="txt">Exportar informe (texto)</button></div>
      <p class="hint">Solo lectura: no se ha modificado nada. Si algún día se ofrece reparar, pedirá confirmación y hará antes una copia de seguridad.</p>`:'')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-aud]');if(!b)return;const a=b.dataset.aud;
  if(a==='run'){audUlt=auditarDatos();renderAuditoria();return}
  if(!audUlt)return;
  if(a==='json')entregar(`auditoria-reloj-${hoy()}.json`,JSON.stringify(audUlt,null,1),'application/json');
  else if(a==='txt')entregar(`auditoria-reloj-${hoy()}.txt`,audTexto(audUlt),'text/plain')});
