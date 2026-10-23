// Fase 5 (v28) · análisis del entrenamiento: rendimiento comparable, estancamiento, preparación por zona, respuesta al volumen y plan de hoy.
// Se carga después de reloj.js y usa sus datos y funciones (hist, CAT, MUS, volumen, musculos, nomFila, efectiva, queToca…).
// Todo se recalcula desde los registros originales; nada se inventa: con pocos datos, cada función lo dice («insuficiente»).
// Distingue lo OBSERVADO (series, reps, fechas), lo ESTIMADO (tendencias, con su incertidumbre) y lo que es una REGLA (48 h, umbrales).
'use strict';
const AN_MIN=4,AN_DIAS_MOL=14,AN_REGLA_H=48,DECKEY='reloj-anomalo-decisiones';
const anMed=v=>{if(!v.length)return null;const s=v.slice().sort((a,b)=>a-b),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2};
const anMad=v=>{const m=anMed(v);return m==null?null:anMed(v.map(x=>Math.abs(x-m)))};
// pendiente de Theil–Sen (mediana de las pendientes entre pares): robusta a un dato raro
function anTheilSen(y){const s=[];for(let i=0;i<y.length;i++)for(let j=i+1;j<y.length;j++)s.push((y[j]-y[i])/(j-i));return s.length?anMed(s):0}
const anFecha=t=>new Date(t).toLocaleDateString('es-DO',{day:'numeric',month:'short'});

/* ---------- rendimiento comparable ----------
   Una medida por sesión y ejercicio: la PRIMERA serie principal del ejercicio (la más fresca y comparable).
   Con peso anotado: 1RM estimado (Epley con la reserva). Sin peso: reps hasta el fallo (reps + reserva), que solo se comparan entre
   sesiones con la misma carga (peso corporal con peso corporal, mismo nivel de máquina). (v31) Las series SIN carga conocida (sin anotar,
   o un 0 en un ejercicio con carga externa: ver cargaDe) siguen en la lista pero NO se comparan entre sí: no se sabe si la carga fue la misma.
   Reservas «3+»/«4+» son cotas: no entran en la tendencia. */
let anCompMemo={k:'',v:null};
function anComparables(){const k=hist.length+':'+(hist[0]?hist[0].id+(hist[0].sets||[]).length+(hist[0].editada||''):'');   // memoria: se usa mucho
  if(anCompMemo.k!==k)anCompMemo={k,v:anComparablesCalc()};return anCompMemo.v}
function anComparablesCalc(){const S={};
  hist.slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).forEach(h=>{const g=gDe(h);if(!g||!CAT[g])return;const vistos=new Set();
    (h.sets||[]).forEach(r=>{if(r.k!=='act.')return;const ej=nomFila(r,g);if(!ej||vistos.has(ej))return;vistos.add(ej);
      if(/\+/.test(r.rir||''))return;const R=parseInt(r.reps,10);if(!(R>0))return;
      const ck=cargaDe(r,g),conPeso=!!ck&&ck.startsWith('k:'),carga=conPeso?'peso':ck==='c'?'pc':ck?ck:'na',v=conPeso?e1(r):R+rirN(r.rir);
      const k=ej+'|'+carga;(S[k]=S[k]||{ej,g,carga,pts:[]}).pts.push({t:Date.parse(h.start),v,R,rir:rirN(r.rir),kg:r.kg,id:h.id})})});
  const L=Object.values(S);L.forEach(s=>{if(s.carga==='na')s.pts.nc=true});return L}   // nc: no comparables entre sí
// clasificación de una serie temporal de rendimiento comparable
function anClasifica(pts){const n=pts.length,y=pts.map(p=>p.v);
  if(pts.nc)return {estado:'insuficiente',n,txt:`carga sin anotar en ${n} ${n===1?'sesión':'sesiones'}: no se comparan entre sí porque no se sabe si usaste la misma carga`};
  if(n<AN_MIN)return {estado:'insuficiente',n,txt:`solo ${n} ${n===1?'sesión comparable':'sesiones comparables'} (hacen falta ${AN_MIN})`};
  const med=anMed(y),sl=anTheilSen(y),rel=sl*(n-1)/med,cv=1.4826*anMad(y)/med,thr=Math.max(.04,cv);
  const ini=anMed(y.slice(0,2)),ult=y.slice(-2),bajan=ult.every(v=>v<ini),suben=ult.every(v=>v>ini);
  const base={n,rel,cv,pend:sl,thr};
  if(cv>.2&&Math.abs(rel)<thr)return {...base,estado:'variable',txt:`variabilidad alta (±${Math.round(cv*100)} %) sin tendencia clara`};
  if(rel>=thr&&sl>0&&suben)return {...base,estado:'mejora',txt:`mejoría sostenida: ${rel>0?'+':''}${Math.round(rel*100)} % en ${n} sesiones`};
  if(rel<=-thr&&sl<0&&bajan)return {...base,estado:'caida',txt:`caída sostenida: ${Math.round(rel*100)} % en ${n} sesiones`};
  if(n>=6&&Math.abs(rel)<Math.min(thr,.03))return {...base,estado:'estancado',txt:`estancamiento probable: ${n} sesiones sin cambio claro (±${Math.round(Math.abs(rel)*100)} %)`};
  return {...base,estado:'estable',txt:`cambios dentro de la fluctuación normal (${rel>=0?'+':''}${Math.round(rel*100)} %, ruido ±${Math.round(cv*100)} %)`}}
// posibles factores (no causas) cuando el rendimiento cae: volumen reciente del grupo, sueño y energía, molestias, esfuerzo declarado
function anFactores(s){const f=[],D=864e5,t1=s.pts[s.pts.length-1].t,vol=(a,b)=>volumen(a,b).grupo(s.g);
  const v14=vol(t1-14*D,t1+D),v14a=vol(t1-28*D,t1-14*D);
  if(v14a>0&&v14>v14a*1.2)f.push(`el volumen de ${CAT[s.g].n.toLowerCase()} subió de ${ef1(v14a)} a ${ef1(v14)} series en 14 días`);
  const B=leerBien(),dia=t=>B[diaK(t)]||{},ul=s.pts.slice(-2).map(p=>dia(p.t)),pr=s.pts.slice(0,-2).map(p=>dia(p.t));
  const m=(L,k)=>{const v=L.map(x=>+x[k]).filter(x=>x>0);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
  const su=m(ul,'sueno'),sp=m(pr,'sueno'),eu=m(ul,'energia'),ep=m(pr,'energia');
  if(su!=null&&sp!=null&&su<sp-.4)f.push(`dormiste menos esos días (${num(su)} h frente a ${num(sp)} h)`);
  if(eu!=null&&ep!=null&&eu<ep-.4)f.push(`energía más baja (${num(eu)} frente a ${num(ep)} de 5)`);
  const mol=hist.filter(h=>Date.parse(h.start)>=t1-14*D).flatMap(h=>h.sets||[]).filter(r=>r.ej===s.ej&&r.mol).length;
  if(mol)f.push(`anotaste molestia en este ejercicio ${mol} ${mol===1?'vez':'veces'} en 14 días`);
  return f}

/* ---------- preparación por zona del mapa ----------
   Separa cuatro cosas que no son lo mismo: volumen acumulado (observado), fatiga declarada (sueño/energía, general), recuperación
   estimada (solo si hay datos comparables tras distintos descansos; si no, «sin estimación fiable») y preparación para entrenar,
   que es una REGLA prudente (cuidado activo o molestias → cuidar; estímulo directo hace < N h → esperar; si no, sin señales en contra). */
// caché de músculos por ejercicio (musculos() evalúa reglas de texto; el mapa la llamaba miles de veces)
const anMusC=new Map();function anMus(ej,g){const k=g+'|'+ej;if(!anMusC.has(k))anMusC.set(k,musculos(ej,g));return anMusC.get(k)}
function anZona(m,o={}){const D=864e5,ahora=Date.now(),dias=o.dias||7,reglaH=o.reglaH||AN_REGLA_H,musculos=anMus;
  let ult=0,ultDir=0,n=0,conKg=0,rirs=[],dir=0,ind=0;const ejs={};
  hist.forEach(h=>{const g=gDe(h),t=Date.parse(h.start);if(!g||!CAT[g])return;(h.sets||[]).forEach(r=>{const c=efectiva(r);if(!c)return;const ej=nomFila(r,g),f=musculos(ej,g)[m];if(!f)return;
    if(t>ult)ult=t;if(f>=1&&t>ultDir)ultDir=t;
    if(t>=ahora-dias*D){n++;if(r.kg!=null)conKg++;if(!/\+|—/.test(r.rir||''))rirs.push(rirN(r.rir));if(f>=1)dir+=c*f;else ind+=c*f;if(f>=1)ejs[ej]=g}})});
  const vol=d=>(o.VW&&o.VW[d]?o.VW[d]:volumen(ahora-d*D,ahora+D)).zona(m);   // VW: volúmenes ya calculados para todas las zonas
  const rend=anComparables().filter(s=>ejs[s.ej]||Object.entries(musculos(s.ej,s.g)).some(([k,f])=>k===m&&f>=1)).map(s=>({ej:s.ej,carga:s.carga,c:anClasifica(s.pts)}));
  // molestias anotadas en partes que caen en esta zona (o zona entera) y cuidados activos que la cubren
  const zonaDe=(z,p)=>LES_MUS[z+'|'+(p||'entero')]||LES_MUS[z+'|'+(LES_P[z]||[])[0]]||[];
  const mol=hist.filter(h=>Date.parse(h.start)>=ahora-AN_DIAS_MOL*D).flatMap(h=>h.sets||[]).filter(r=>LES_Z.includes(r.mol)&&zonaDe(r.mol,r.molP).includes(m)).length;
  const cuida=lesAct().filter(x=>zonaDe(x.z,x.p).includes(m));
  const B=leerBien(),hoy=B[diaK(ahora)]||null;
  const hDir=ultDir?(ahora-ultDir)/36e5:null;
  const prep=cuida.length?{e:'cuidar',txt:`cuidando ${lesQue(cuida)}`}:mol>=2?{e:'cuidar',txt:`${mol} molestias anotadas en ${AN_DIAS_MOL} días`}
    :!ult?{e:'nada',txt:'sin registros'}:hDir!=null&&hDir<reglaH?{e:'espera',txt:`estímulo directo hace ${Math.round(hDir)} h (regla: ${reglaH} h)`}
    :{e:'listo',txt:'sin señales en contra'};
  return {m,ult,ultDir,hDir,n,dir,ind,rir:rirs.length?rirs.reduce((a,b)=>a+b,0)/rirs.length:null,v7:vol(7),v14:vol(14),v28:vol(28),v90:vol(90),
    rend,mol,cuida,bien:hoy,calidad:{n,conKg,rirNum:rirs.length},prep,
    recup:{fiable:false,txt:'Sin estimación fiable: haría falta comparar tu rendimiento en esta zona tras distintos días de descanso, y aún no hay suficientes sesiones comparables.'}}}

/* ---------- respuesta al volumen por grupo ----------
   Semana a semana: series efectivas del grupo, sesiones, reserva media y un índice de rendimiento (mediana, sobre sus ejercicios,
   de la medida comparable de esa semana frente a la primera de cada ejercicio). Relación volumen → rendimiento de la semana siguiente
   solo con ≥ 4 pares de semanas, como correlación de rangos (Spearman), que NO prueba causa. Rendimiento no es hipertrofia. */
function anSpearman(x,y){const rk=v=>{const o=v.map((a,i)=>[a,i]).sort((p,q)=>p[0]-q[0]),r=Array(v.length);o.forEach(([,i],k)=>r[i]=k+1);return r};
  const a=rk(x),b=rk(y),n=x.length,ma=(n+1)/2;let s=0,sa=0,sb=0;for(let i=0;i<n;i++){s+=(a[i]-ma)*(b[i]-ma);sa+=(a[i]-ma)**2;sb+=(b[i]-ma)**2}return sa&&sb?s/Math.sqrt(sa*sb):0}
function anVolumen(g,semanas=12){const W=7*864e5,L0=lunes(Date.now()),comp=anComparables().filter(s=>s.g===g&&s.pts.length>=2),filas=[];
  for(let k=semanas-1;k>=0;k--){const a=L0-k*W,b=a+W,hs=hist.filter(h=>gDe(h)===g&&Date.parse(h.start)>=a&&Date.parse(h.start)<b);
    const sets=hs.flatMap(h=>h.sets||[]).filter(r=>r.k==='act.'&&!/\+/.test(r.rir||''));
    const rel=comp.map(s=>{const p=s.pts.filter(p=>p.t>=a&&p.t<b);return p.length?anMed(p.map(x=>x.v))/s.pts[0].v-1:null}).filter(v=>v!=null);
    filas.push({a,vol:volumen(a,b).grupo(g),ses:hs.length,rir:sets.length?sets.reduce((s,r)=>s+rirN(r.rir),0)/sets.length:null,rend:rel.length?anMed(rel):null})}
  const pares=[];for(let i=0;i+1<filas.length;i++)if(filas[i].vol>0&&filas[i].rend!=null&&filas[i+1].rend!=null)pares.push([filas[i].vol,filas[i+1].rend-filas[i].rend]);
  return {filas:filas.filter(f=>f.ses||f.vol),pares:pares.length,rho:pares.length>=AN_MIN?anSpearman(pares.map(p=>p[0]),pares.map(p=>p[1])):null}}

/* ---------- plan de hoy ----------
   Parte de «Qué toca hoy» y, por grupo, propone: aplazar (en pausa por cuidar), modificar (cuidado activo que cambia ejercicios o
   molestias repetidas sin cuidar), reducir (bienestar bajo hoy, volumen de 7 días por encima de +30 %, o caídas sostenidas) o mantener.
   Cada recomendación lleva sus motivos («¿por qué?»). Tú decides: la app no bloquea salvo un grupo en pausa por dolor extremo. */
function anPlanGrupo(g){const mot=[],D=864e5,[lo,hi]=rangoGrupo(g),v7=volumen(Date.now()-7*D,Date.now()+D).grupo(g);let acc='mantener';
  const sube=a=>{const o=['mantener','reducir','modificar','aplazar'];if(o.indexOf(a)>o.indexOf(acc))acc=a};
  if(enPausa(g)){sube('aplazar');mot.push(`en pausa: cuidando ${lesQue()} con dolor extremo, no queda ningún ejercicio que no la cargue`)}
  const u=ultimaVez(g),hU=u?(Date.now()-u)/36e5:Infinity;
  if(hU<AN_REGLA_H){sube('aplazar');mot.push(`lo entrenaste hace ${Math.round(hU)} h (regla prudente: ${AN_REGLA_H} h entre sesiones del mismo grupo; no es una medida de tu recuperación)`)}
  const cambios=CAT[g].e.filter(x=>x.lesDe||x.lesM||x.lesFuera);if(cambios.length&&!enPausa(g)){sube('modificar');mot.push(`cuidando ${lesQue()}: ${cambios.length} ${cambios.length===1?'ejercicio adaptado':'ejercicios adaptados'}`)}
  const ult3=hist.filter(h=>gDe(h)===g).slice(0,3),conMol=ult3.filter(h=>(h.sets||[]).some(r=>r.mol)).length;
  if(conMol>=2&&!lesOn()){sube('modificar');mot.push(`molestia anotada en ${conMol} de tus últimas ${ult3.length} sesiones de este grupo: plantéate cuidar la zona`)}
  if(bajaHoy()){sube('reducir');mot.push('dormiste poco o tienes poca energía hoy: la meta ya baja un 25 %')}
  if(v7>hi*VOL_ALERTA){sube('reducir');mot.push(`${ef1(v7)} series en 7 días, más de +30 % sobre tu objetivo orientativo (${lo}–${hi})`)}
  const caidas=anComparables().filter(s=>s.g===g).map(s=>({s,c:anClasifica(s.pts)})).filter(x=>x.c.estado==='caida');
  if(caidas.length){sube('reducir');mot.push(`rendimiento en caída en ${caidas.map(x=>x.s.ej).join(', ')} (posible fatiga acumulada; no es la única explicación)`)}
  if(!mot.length)mot.push('sin señales en contra con los datos que hay');
  return {g,acc,mot,meta:metaHoy(g),ej:CAT[g].e.filter(x=>!x.levy&&!x.lesFuera).map(x=>x.n)}}
function anPlan(){const q=queToca();if(q.descanso)return {descanso:true,txt:q.txt};
  const gs=(q.items||[]).map(x=>x.g);return {descanso:false,grupos:gs.map(anPlanGrupo),rut:q.rut}}
// decisiones contra la recomendación: se registran (empezar un grupo que se recomendaba aplazar o reducir)
function anRegistraDecision(g){try{const p=anPlanGrupo(g);if(p.acc==='mantener'||p.acc==='modificar')return;
  const L=leerJSON(DECKEY,[]),x=Array.isArray(L)?L:[];x.push({t:new Date().toISOString(),g,rec:p.acc,hizo:'entrenar',por:p.mot.join('; ').slice(0,300)});
  guardarObj(DECKEY,x.slice(-200))}catch(e){}}

/* ---------- vistas ---------- */
const AN_PREP={listo:['lpl','sin señales en contra'],espera:['lpe','esperar (regla de horas)'],cuidar:['lpc','cuidar o molestias'],nada:['lpn','sin registros']};
let anTab='est',anSelZ='',anDias=7,anRegla=AN_REGLA_H,anSelG='biceps',anPlanVer=false;
function anPrepHTML(){const Z={},D=864e5,t=Date.now(),VW={};[7,14,28,90].forEach(d=>VW[d]=volumen(t-d*D,t+D));   // 4 pasadas para las 18 zonas
  Object.keys(MUS).forEach(m=>Z[m]=anZona(m,{dias:anDias,reglaH:anRegla,VW}));
  const zona=(m,d)=>`<path d="${d}" data-anz="${m}" class="${AN_PREP[Z[m].prep.e][0]}${m===anSelZ?' sel':''}"><title>${esc(MUS[m][0])}: ${esc(Z[m].prep.txt)}</title></path>`;
  let h=`<p class="hint">Toca una zona. Preparación = regla prudente, no una medida de recuperación. Periodo del volumen:
    ${[7,14,28,90].map(d=>`<button type="button" class="chipb" data-andias="${d}" aria-pressed="${d===anDias}">${d} d</button>`).join('')}
    · regla de espera tras estímulo directo: ${[24,48,72].map(x=>`<button type="button" class="chipb" data-anregla="${x}" aria-pressed="${x===anRegla}">${x} h</button>`).join('')}</p>`
    +figuraSVG({aria:'Preparación por zona',zona,sel:anSelZ})+`<div class="mleg">${Object.values(AN_PREP).map(([k,t])=>`<span><i class="mpt ${k}"></i>${t}</span>`).join('')}</div>`;
  if(anSelZ&&Z[anSelZ]){const x=Z[anSelZ],cal=x.calidad,ff=t=>t?`${anFecha(t)} (hace ${Math.round((Date.now()-t)/36e5)} h)`:'nunca';
    h+=`<div class="andet"><p><b>${esc(MUS[anSelZ][0])}</b> · preparación: <b>${esc(x.prep.txt)}</b></p><table class="ant"><tbody>
      <tr><td>Último estímulo</td><td>directo ${ff(x.ultDir)} · cualquiera ${ff(x.ult)}</td></tr>
      <tr><td>Series (${anDias} d)</td><td>directas ${ef1(x.dir)} · indirectas ponderadas ${ef1(x.ind)} · filas ${x.n}</td></tr>
      <tr><td>Cerca del fallo</td><td>${x.rir==null?'sin reservas numéricas':`reserva media ${num(x.rir)}`}</td></tr>
      <tr><td>Volumen</td><td>7 d ${ef1(x.v7)} · 14 d ${ef1(x.v14)} · 28 d ${ef1(x.v28)} · 90 d ${ef1(x.v90)} (objetivo orientativo ${rangoZona(anSelZ).join('–')}/sem)</td></tr>
      <tr><td>Rendimiento comparable</td><td>${x.rend.length?x.rend.map(r=>`${esc(r.ej)}${r.carga==='na'?' (carga sin anotar)':''}: ${esc(r.c.txt)}`).join('<br>'):'sin ejercicios con medidas comparables'}</td></tr>
      <tr><td>Fatiga declarada</td><td>${x.bien?`hoy: ${esc(bienTxt(x.bien))} (general, no por músculo)`:'hoy sin anotar'}</td></tr>
      <tr><td>Molestias</td><td>${x.mol?`${x.mol} en ${AN_DIAS_MOL} días`:'ninguna anotada'}${x.cuida.length?` · cuidando ${esc(lesQue(x.cuida))}`:''}</td></tr>
      <tr><td>Recuperación estimada</td><td>${esc(x.recup.txt)}</td></tr>
      <tr><td>Datos usados</td><td>${cal.n} filas en ${anDias} d · ${cal.conKg} con peso anotado · ${cal.rirNum} con reserva numérica</td></tr></tbody></table></div>`}
  return h}
const AN_EST={mejora:'mejoría sostenida',caida:'caída sostenida',estancado:'estancamiento probable',variable:'variabilidad alta',estable:'fluctuación normal',insuficiente:'datos insuficientes'};
function anEstHTML(){const L=anComparables().map(s=>({s,c:anClasifica(s.pts)})).sort((a,b)=>b.s.pts.length-a.s.pts.length);
  if(!L.length)return '<p class="hint">Aún no hay series principales con reps y reserva para comparar.</p>';
  const cnt={};L.forEach(x=>cnt[x.c.estado]=(cnt[x.c.estado]||0)+1);
  let h=`<p class="hint">Cada ejercicio se compara consigo mismo con la misma carga: primera serie principal de cada sesión (1RM estimado con peso; reps hasta el fallo sin peso). Hacen falta ${AN_MIN} sesiones comparables. Resumen: ${Object.entries(cnt).map(([k,v])=>`${AN_EST[k]} ${v}`).join(' · ')}.</p>`;
  h+=L.map(({s,c})=>{const vals=s.pts.map(p=>`${anFecha(p.t)} ${num(p.v)}`).join(' · '),fac=c.estado==='caida'?anFactores(s):[];
    return `<details class="anest ${c.estado}"><summary><b>${esc(s.ej)}</b> <span class="muted">${s.carga==='peso'?'1RM est.':s.carga==='pc'?'peso corporal, reps al fallo':s.carga==='na'?'carga sin anotar: no comparable':'nivel '+esc(s.carga.slice(2))+' de máquina, reps al fallo'}</span> — ${esc(AN_EST[c.estado])}</summary>
      <p class="hint">${esc(c.txt)}.${s.carga==='na'?' Configura su carga en «Mis cargas» (o anótala) para poder comparar sesiones.':''}</p><p class="hint">Datos: ${esc(vals)}</p>
      ${c.estado==='caida'?`<p class="hint"><b>Hipótesis, no conclusiones.</b> ${fac.length?'Factores que coinciden: '+esc(fac.join('; '))+'.':'No hay otros datos que coincidan.'} La fatiga acumulada es una posible explicación, pero los datos no permiten identificar una causa. Muchas series por sí solas no indican sobreentrenamiento.</p>`:''}</details>`}).join('');
  return h}
function anVolHTML(){const R=anVolumen(anSelG);
  let h=`<p class="hint">${Object.keys(CAT).map(g=>`<button type="button" class="chipb" data-ang="${g}" aria-pressed="${g===anSelG}">${CAT[g].n}</button>`).join('')}</p>
    <p class="hint">Semana a semana: series efectivas, sesiones, reserva media y un índice de rendimiento (medida comparable frente a la primera de cada ejercicio). Es rendimiento (fuerza o reps), no hipertrofia: para eso harían falta medidas.</p>`;
  h+=R.filas.length?`<div class="tbl"><table><thead><tr><th>Semana</th><th>Series</th><th>Sesiones</th><th>Reserva</th><th>Rendimiento</th></tr></thead><tbody>${R.filas.map(f=>`<tr><td>${anFecha(f.a)}</td><td>${ef1(f.vol)}</td><td>${f.ses}</td><td>${f.rir==null?'—':num(f.rir)}</td><td>${f.rend==null?'—':(f.rend>=0?'+':'')+Math.round(f.rend*100)+' %'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Sin sesiones de este grupo.</p>';
  h+=`<p class="hint">${R.rho==null?`Relación volumen → rendimiento: datos insuficientes (${R.pares} ${R.pares===1?'par':'pares'} de semanas comparables; hacen falta ${AN_MIN}).`
    :`Correlación de rangos entre el volumen de una semana y el cambio de rendimiento de la siguiente: ${num2(R.rho)} con ${R.pares} pares. Es una asociación, no una causa, y con tan pocos datos puede ser casualidad.`}</p>`;
  return h}
function renderAnalisis(){const el=document.getElementById('pAnal');if(!el)return;
  // (v30) la preparación por zona vive en la pantalla Hoy; aquí, estancamiento y respuesta al volumen
  if(anTab==='prep')anTab='est';
  const T=[['est','Estancamiento'],['vol','Respuesta al volumen']];
  el.innerHTML=`<div class="antabs">${T.map(([k,n])=>`<button type="button" data-antab="${k}" aria-pressed="${k===anTab}">${n}</button>`).join('')}</div>`
    +(anTab==='est'?anEstHTML():anVolHTML())}
function renderPrep(){const el=document.getElementById('hoyPrep');if(el)el.innerHTML=anPrepHTML()}
// tarjeta del reloj en reposo: plan de hoy con «¿por qué?»
const AN_ACC={mantener:'mantener',reducir:'reducir volumen',modificar:'modificar ejercicios',aplazar:'aplazar'};
// render() se llama a menudo: el plan se recalcula solo si cambia algo de lo que depende
let anPlanMemo={k:'',p:null};
function renderPlanHoy(){const el=document.getElementById('planHoy');if(!el)return;const v=S.st==='idle'&&tab==='reloj';el.hidden=!v;if(!v)return;
  const k=[grupo,hist.length,hist[0]?hist[0].id+(hist[0].sets||[]).length:'',lesKey(),bajaHoy(),diaK(Date.now()),Object.keys(CAT).map(enPausa).join()].join('|');
  if(anPlanMemo.k!==k)anPlanMemo={k,p:anPlanGrupo(grupo)};
  const p=anPlanMemo.p,h=`<div class="top"><span><b>Plan para ${esc(CAT[grupo].n)}:</b> ${AN_ACC[p.acc]} · meta ${p.meta} series</span><button type="button" class="lnk" data-anpor="1">${anPlanVer?'Ocultar':'¿Por qué?'}</button></div>`
    +(anPlanVer?`<ul class="anmot">${p.mot.map(m=>`<li>${esc(m)}</li>`).join('')}</ul><p class="hint">Recomendación con reglas y tus datos; decides tú. Si entrenas igual un grupo que se recomendaba aplazar o reducir, queda anotado para poder revisar después cómo te fue.</p>`:'');
  el.className='card anplan '+p.acc;if(el.innerHTML!==h)el.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('[data-antab],[data-anz],[data-andias],[data-anregla],[data-ang],[data-anpor]');if(!b)return;const d=b.dataset;
  if(d.anpor){anPlanVer=!anPlanVer;renderPlanHoy();return}
  if(d.antab)anTab=d.antab;else if(d.anz)anSelZ=anSelZ===d.anz?'':d.anz;else if(d.andias)anDias=+d.andias;else if(d.anregla)anRegla=+d.anregla;else if(d.ang)anSelG=d.ang;
  if(d.anz||d.andias||d.anregla)renderPrep();else renderAnalisis()});
