/* v39 · RENDIMIENTO Y RECUPERACIÓN: seguimiento LONGITUDINAL, separado del volumen semanal (diseño y reglas: RENDIMIENTO.md).
   El volumen sigue reiniciándose cada lunes (volumen(), estadoVol: no se tocan). Esto es otra cosa: compara cada ejercicio
   consigo mismo entre sesiones comparables y conserva las señales hasta que nuevas sesiones las resuelvan o las confirmen.
   · Todo se recalcula desde el historial (nada se borra al cambiar de semana; editar o borrar una sesión se refleja solo).
   · Señales orientativas, NUNCA diagnósticos: no se concluye sobreentrenamiento ni se da una puntuación de recuperación.
   · No bloquea nada: con cualquier advertencia se entrena igual.
   Se carga después de reloj.js y analisis.js y usa sus datos y funciones (hist, CAT, MUS, volumen, musculos, nomFila, cargaDe…). */
'use strict';
const RDKEY='reloj-anomalo-rendimiento',SENKEY='reloj-anomalo-sensaciones',RD_D=864e5,RD_H=36e5;
// umbrales (configurables en la pantalla; ver RENDIMIENTO.md §3): [por defecto, mínimo, máximo]
const RD_CFG={umbral:[.05,.02,.2],consecutivas:[2,2,4],base:[3,1,5],minBase:[2,1,4],cambioCarga:[.1,.03,.3],cambioReps:[1.5,1.2,3],cambioRir:[2,1,4],
  cambioPos:[2,1,6],maxDiasRef:[42,14,120],horasAguda:[72,24,168],diasAtenuaAguda:[4,1,14],diasAtenuaInc:[7,2,28],estancDias:[28,14,90],estancMin:[4,3,10],
  estancMejora:[.02,.005,.1],diasDescarga:[10,3,21],volSube:[1.3,1.1,2],horasCerca:[48,12,96],semSinDesc:[8,3,20]};
const RD_MOT={tecnica:'técnica',ejercicio:'ejercicio o variante',programa:'programa',otro:'otro cambio'};
const rdCfgDef=()=>Object.fromEntries(Object.entries(RD_CFG).map(([k,[v]])=>[k,v]));
function rdNorm(o){const r={cfg:rdCfgDef(),cortes:[],equiv:{}};if(!esObj(o))return r;
  if(esObj(o.cfg))for(const [k,[,lo,hi]] of Object.entries(RD_CFG)){const v=vNum(o.cfg[k],lo,hi);if(v!=null)r.cfg[k]=['consecutivas','base','minBase','cambioRir','cambioPos','estancMin'].includes(k)?Math.round(v):v}
  if(r.cfg.minBase>r.cfg.base)r.cfg.minBase=r.cfg.base;
  r.cortes=vLista(o.cortes,500,c=>{if(!esObj(c))return null;const t=vNum(c.t,1e12,1e14);if(t==null)return null;
    const x={t,motivo:tiene(RD_MOT,c.motivo)?c.motivo:'otro'};const ek=vTxt(c.ek,100);if(ek)x.ek=ek;if(esG(c.g))x.g=c.g;return x});
  if(esObj(o.equiv)){let n=0;for(const k in o.equiv){if(!tiene(o.equiv,k)||++n>200)continue;const a=vTxt(k,100),b=vTxt(o.equiv[k],100);if(a&&b&&a!==b)r.equiv[a]=b}}
  return r}
// sensaciones opcionales por día: fatiga subjetiva 1 (fresco) – 5 (muy fatigado) y dolor muscular por grupo 0 (nada) – 3 (fuerte)
function senNorm1(x){if(!esObj(x))return null;const o={},f=vEnt(x.fatiga,1,5);if(f!=null)o.fatiga=f;
  if(esObj(x.dolor)){const d={};for(const g in x.dolor)if(esG(g)){const v=vEnt(x.dolor[g],0,3);if(v!=null)d[g]=v}if(Object.keys(d).length)o.dolor=d}
  if(!Object.keys(o).length)return null;const t=vNum(x.t,0,1e14);if(t!=null)o.t=t;return o}
function senNorm(o,cnt){const r={};if(!esObj(o))return r;let n=0;for(const k in o){if(!tiene(o,k)||++n>20000)break;const v=vDia(k)&&senNorm1(o[k]);if(v)r[k]=v;else if(cnt)cnt.mal++}return r}
let rd=rdNorm(leerJSON(RDKEY,{})),sen=senNorm(leerJSON(SENKEY,{})),rdVer=0,rdMemo={k:'',v:null};
const rdGuarda=()=>{rdVer++;rdMemo.k='';return guardarObj(RDKEY,rd)};
const senGuarda=()=>{rdVer++;rdMemo.k='';return guardarObj(SENKEY,sen)};
function senPon(dia,campo,valor,g){if(!vDia(dia))return false;
  if(valor!=null&&(campo==='fatiga'?vEnt(valor,1,5):vEnt(valor,0,3))==null)return false;   // un valor no válido no borra el anotado
  const x={...(sen[dia]||{})};
  if(campo==='fatiga'){if(valor==null)delete x.fatiga;else x.fatiga=valor}
  else if(campo==='dolor'&&esG(g)){const d={...(x.dolor||{})};if(valor==null)delete d[g];else d[g]=valor;if(Object.keys(d).length)x.dolor=d;else delete x.dolor}
  x.t=Date.now();const v=senNorm1(x);if(v)sen[dia]=v;else delete sen[dia];return senGuarda()}
// el sueño vive en «cómo llegas» (clave compartida con Comida): se fusiona, nunca se borra la energía
function rdPonSueno(dia,h){const o=leerBien();o[dia]={...(o[dia]||{}),sueno:h,t:Date.now()};rdVer++;rdMemo.k='';return guardarObj(BKEY,o)}

/* ---------- observaciones: una por sesión y ejercicio ---------- */
const rdEjK=n=>{const k=sinTilde(n).replace(/[^a-z0-9]+/g,' ').replace(/\bmancuernas\b/g,'mancuerna').replace(/\s+/g,' ').trim();return rd.equiv[k]||k};
const RD_RIR=/^[0-3]$/;   // reservas numéricas; «3+»/«4+» son cotas y «—»/«?» no dicen nada
function rdEnDescarga(t){if(!descarga||!descarga.inicio)return false;const a=Date.parse(descarga.inicio),b=Date.parse(descarga.fin||descarga.hasta);return t>=a&&t<b}
function rdObs(H=hist){const out=[];
  H.filter(h=>h&&!isNaN(Date.parse(h.start))).slice().sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).forEach(h=>{
    const g=gDe(h);if(!g||!CAT[g])return;const t=Date.parse(h.start),orden=[],E={};
    (h.sets||[]).forEach(r=>{if(r.k==='cal.')return;const ej=nomFila(r,g);if(!ej||/(^|\s)vacio(\s|$)/.test(sinTilde(ej)))return;const ek=rdEjK(ej);
      if(!E[ek]){E[ek]={ej,pos:orden.length,sets:[]};orden.push(ek)}E[ek].sets.push(r)});
    orden.forEach(ek=>{const e=E[ek],act=e.sets.filter(r=>r.k==='act.'),rirs=e.sets.filter(r=>RD_RIR.test(r.rir||'')).map(r=>+r.rir);
      const o={t,id:h.id,g,ek,ej:e.ej,pos:e.pos,nAct:act.length,nSer:e.sets.length,ef:e.sets.reduce((s,r)=>s+efectiva(r),0),
        rirMed:rirs.length?rirs.reduce((a,b)=>a+b,0)/rirs.length:null,desc:!!h.desc||rdEnDescarga(t),fza:!!h.fza,cuida:!!h.cuida,
        rut:h.rut&&h.rut.n||null,zonas:anMus(e.ej,g),medible:false};
      const r0=act.find(r=>fisProgresa(r)&&RD_RIR.test(r.rir||'')&&parseInt(r.reps,10)>0);
      if(!r0)o.noMed=act.length?'sin serie principal con reserva numérica (0–3) y tiempo verosímil':'sin serie principal';
      else{const ck=cargaDe(r0,g),R=parseInt(r0.reps,10),rir=+r0.rir;Object.assign(o,{R,rir,kg:r0.kg,carga:!ck?'na':ck.startsWith('k:')?'peso':ck});
        if(o.carga==='na')o.noMed='carga sin anotar';else{o.medible=true;o.v=o.carga==='peso'?e1(r0):R+rir}}
      out.push(o)})});
  return out}

/* ---------- comparabilidad entre dos sesiones seguidas del mismo ejercicio: lista de motivos (vacía = comparables) ---------- */
const rdKg=k=>k>0?kgTxt(k):'—';
function rdNoComp(q,p,C=rd.cfg){const m=[];
  if(p.carga!==q.carga)m.push(p.carga.startsWith('n:')&&q.carga.startsWith('n:')?`nivel de máquina distinto (${q.carga.slice(2)} → ${p.carga.slice(2)})`:'tipo de carga distinto (peso, peso corporal o máquina)');
  else if(p.carga==='peso'){const d=(p.kg-q.kg)/q.kg,rr=p.R/q.R;
    if(d<-C.cambioCarga)m.push(`bajaste la carga de ${rdKg(q.kg)} a ${rdKg(p.kg)} (más de un ${Math.round(C.cambioCarga*100)} %)`);
    else if(Math.abs(d)>.001&&(rr>C.cambioReps||rr<1/C.cambioReps))m.push(`carga y repeticiones muy distintas (${rdKg(q.kg)} × ${q.R} → ${rdKg(p.kg)} × ${p.R}): el 1RM estimado no es comparable`)}
  if(Math.abs(p.rir-q.rir)>=C.cambioRir)m.push(`reserva buscada distinta (${q.rir} → ${p.rir})`);
  if(Math.abs(p.pos-q.pos)>=C.cambioPos)m.push(`orden distinto en la sesión (${q.pos+1}.º → ${p.pos+1}.º ejercicio)`);
  if(p.fza!==q.fza)m.push('modalidad distinta (día de fuerza frente a hipertrofia)');
  if(p.cuida!==q.cuida)m.push('cuidando una zona en una de las dos sesiones (ejercicios adaptados)');
  if(p.rut&&q.rut&&p.rut!==q.rut)m.push(`programa distinto (${q.rut} → ${p.rut})`);
  const dd=(p.t-q.t)/RD_D;if(dd>C.maxDiasRef)m.push(`${Math.round(dd)} días entre las dos sesiones (más de ${C.maxDiasRef})`);
  const c=rd.cortes.find(c=>c.t>q.t&&c.t<=p.t&&(c.ek?c.ek===p.ek&&(!c.g||c.g===p.g):c.g?c.g===p.g:true));
  if(c)m.push(`cambio marcado por ti: ${RD_MOT[c.motivo]}${c.ek?'':c.g?` (todo ${CAT[c.g].n.toLowerCase()})`:' (todo el programa)'}`);
  return m}

/* ---------- serie de un ejercicio: tramos comparables, rachas de caída y episodios ---------- */
function rdSerie(L,C=rd.cfg){const segs=[],eps=[];let seg=null;
  for(const o of L){
    if(o.desc||!o.medible)continue;   // la descarga no se compara ni entra en la referencia; lo no medible tampoco
    const q=seg&&seg.pts[seg.pts.length-1],nc=q?rdNoComp(q,o,C):null;
    if(!q||nc.length){if(seg&&seg.racha.length){const ep=seg.racha.ep;ep.fin=o.t;ep.cierre='sinConfirmar';ep.porque=nc}
      seg={pts:[],racha:[],corte:nc,ini:o.t};seg.racha.ep=null;segs.push(seg)}
    const base=seg.pts.slice(0,seg.pts.length-seg.racha.length).slice(-C.base);
    const x={...o,ref:null,rel:null,cae:false,base:base.map(p=>({t:p.t,v:p.v}))};
    if(base.length>=C.minBase){x.ref=anMed(base.map(p=>p.v));x.rel=o.v/x.ref-1;x.cae=x.rel<-C.umbral}
    if(x.cae){if(!seg.racha.length){const ep={ek:o.ek,g:o.g,ej:o.ej,ini:o.t,pts:[],ref:x.ref,cierre:null};eps.push(ep);seg.racha.ep=ep}
      seg.racha.push(x);seg.racha.ep.pts.push(x)}
    else if(seg.racha.length&&x.ref!=null){const ep=seg.racha.ep;ep.fin=o.t;ep.cierre='resuelta';ep.por=x;seg.racha=[];seg.racha.ep=null}
    seg.pts.push(x)}
  return {segs,eps}}
/* mejor nivel MANTENIDO (el menor de dos sesiones seguidas: robusto a un día bueno aislado). i = última vez que se alcanzó (para el
   descenso gradual); i0 = PRIMERA vez que se llegó a menos de «estancMejora» de él (para fechar el estancamiento: repetir la marca
   no es superarla) */
function rdMejor(P,tol){const l=[];for(let k=0;k+1<P.length;k++)l.push(Math.min(P[k].v,P[k+1].v));const v=Math.max(...l);
  return {v,i:l.lastIndexOf(v)+1,i0:l.findIndex(x=>x>=v/(1+tol))+1}}

/* ---------- índice de la zona: cuándo se estimuló directamente cada zona (para el descanso transcurrido y la proximidad) ---------- */
function rdIndiceZonas(obs){const Z={};obs.forEach(o=>{if(!o.nSer)return;for(const [m,f] of Object.entries(o.zonas))if(f>=1)(Z[m]=Z[m]||new Set()).add(o.t)});
  const r={};for(const m in Z)r[m]=[...Z[m]].sort((a,b)=>a-b);return r}
const rdUltAntes=(arr,t)=>{let u=null;for(const x of arr||[]){if(x<t)u=x;else break}return u};
const rdZonasDir=o=>Object.keys(o.zonas).filter(m=>o.zonas[m]>=1&&MUS[m]);

/* ---------- factores que coinciden con una caída (contexto, NO causas) ---------- */
function rdFactores(ep,ctx,C=rd.cfg){const f=[],pts=ep.pts,u=pts[pts.length-1],g=u.g,nG=CAT[g].n.toLowerCase();
  // proximidad: horas desde el estímulo directo anterior de sus zonas
  const cerca=pts.map(p=>{const hs=rdZonasDir(p).map(m=>rdUltAntes(ctx.zt[m],p.t)).filter(x=>x!=null);const h=hs.length?(p.t-Math.max(...hs))/RD_H:null;return {p,h}}).filter(x=>x.h!=null&&x.h<C.horasCerca);
  if(cerca.length)f.push({k:'proximidad',txt:`poco descanso antes de ${cerca.length===pts.length&&pts.length>1?'esas sesiones':cerca.length>1?`${cerca.length} de esas sesiones`:'la sesión del '+anFecha(cerca[0].p.t)}: ${cerca.map(x=>Math.round(x.h)+' h').join(', ')} desde el estímulo directo anterior (referencia ${C.horasCerca} h)`});
  // carga previa: series efectivas de la sesión anterior del grupo frente a la media de las anteriores
  const sesG=ctx.sesG[g]||[],iU=sesG.findIndex(s=>s.t===pts[0].t);
  if(iU>0){const prev=sesG[iU-1],ant=sesG.slice(Math.max(0,iU-7),iU-1).map(s=>s.ef);const med=ant.length>=2?ant.reduce((a,b)=>a+b,0)/ant.length:null;
    if(med!=null&&prev.ef>med*C.volSube)f.push({k:'previa',txt:`la sesión anterior de ${nG} (${anFecha(prev.t)}) tuvo ${ef1(prev.ef)} series efectivas, más que tu media (${ef1(med)})`})}
  // volumen: 7 días frente a la media semanal de los 21 anteriores
  const v7=volumen(u.t-7*RD_D,u.t+1).grupo(g),v21=volumen(u.t-28*RD_D,u.t-7*RD_D).grupo(g)/3;
  if(v21>0&&v7>v21*C.volSube)f.push({k:'volumen',txt:`el volumen de ${nG} subió: ${ef1(v7)} series en los 7 días hasta el ${anFecha(u.t)} frente a ${ef1(v21)} por semana en las 3 anteriores`});
  // esfuerzo: reserva media de las series del grupo en los 7 días previos
  const r7=ctx.obs.filter(o=>o.g===g&&o.t>u.t-7*RD_D&&o.t<=u.t&&o.rirMed!=null);
  if(r7.length){const m=r7.reduce((s,o)=>s+o.rirMed,0)/r7.length;if(m<=1)f.push({k:'esfuerzo',txt:`series muy cerca del fallo en esos 7 días (reserva media ${num(m)})`})}
  // series del propio ejercicio
  const nb=anMed(pts.map(p=>p.nAct)),na=ep.ref!=null?anMed(ctx.porEj[g+'|'+u.ek].filter(o=>o.t<pts[0].t&&o.medible&&!o.desc).slice(-C.base).map(o=>o.nAct)):null;
  if(na!=null&&nb>na)f.push({k:'series',txt:`más series principales de este ejercicio (${num(nb)} frente a ${num(na)})`});
  // semanas sin descarga
  const ud=Math.max(0,...ctx.obs.filter(o=>o.desc&&o.t<=u.t).map(o=>o.t),descarga&&descarga.fin&&Date.parse(descarga.fin)<=u.t?Date.parse(descarga.fin):0),
    ini=ctx.obs.length?ctx.obs[0].t:u.t,sem=Math.floor((u.t-(ud||ini))/(7*RD_D));
  if(sem>=C.semSinDesc)f.push({k:'descarga',txt:`${sem} semanas ${ud?'desde la última descarga':'registradas sin ninguna descarga'}`});
  // lo anotado (opcional): sueño, energía, fatiga subjetiva y dolor del grupo esos días, frente a los días de la referencia
  const B=leerBien(),dias=pts.map(p=>diaK(p.t)),diasB=ctx.porEj[g+'|'+u.ek].filter(o=>o.t<pts[0].t&&o.medible&&!o.desc).slice(-C.base).map(o=>diaK(o.t));
  const med=(L,fn)=>{const v=L.map(fn).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
  const su=med(dias,d=>B[d]&&B[d].sueno!=null?+B[d].sueno:null),sb=med(diasB,d=>B[d]&&B[d].sueno!=null?+B[d].sueno:null);
  if(su!=null&&(su<6||(sb!=null&&su<sb-.5)))f.push({k:'sueno',txt:`dormiste ${num(su)} h esos días${sb!=null?` (frente a ${num(sb)} h en la referencia)`:''}`});
  const eu=med(dias,d=>B[d]&&B[d].energia!=null?+B[d].energia:null),eb=med(diasB,d=>B[d]&&B[d].energia!=null?+B[d].energia:null);
  if(eu!=null&&(eu<=2||(eb!=null&&eu<eb-.5)))f.push({k:'energia',txt:`energía ${num(eu)} de 5 esos días${eb!=null?` (frente a ${num(eb)})`:''}`});
  const fu=med(dias,d=>sen[d]&&sen[d].fatiga!=null?sen[d].fatiga:null);if(fu!=null&&fu>=4)f.push({k:'fatiga',txt:`fatiga subjetiva ${num(fu)} de 5 esos días`});
  const du=med(dias,d=>sen[d]&&sen[d].dolor&&sen[d].dolor[g]!=null?sen[d].dolor[g]:null);if(du!=null&&du>=2)f.push({k:'dolor',txt:`dolor muscular en ${nG} ${num(du)} de 3 esos días`});
  return f}

/* ---------- estado de un ejercicio ahora ---------- */
const RD_EST={incompleta:{n:'Recuperación posiblemente incompleta',c:'recuperación posiblemente incompleta',ic:'!!'},aguda:{n:'Fatiga aguda posible',c:'fatiga aguda posible',ic:'!'},
  estancamiento:{n:'Estancamiento prolongado',c:'estancamiento prolongado',ic:'='},descarga:{n:'Descarga voluntaria',c:'descarga voluntaria',ic:'↓'},
  normal:{n:'Progreso normal',c:'progreso normal',ic:'↗'},referencia:{n:'Nueva referencia',c:'nueva referencia (cambio voluntario)',ic:'↺'},insuficiente:{n:'Datos insuficientes',c:'sin datos suficientes',ic:'·'}};
const RD_ORD=['incompleta','aguda','estancamiento','descarga','normal','referencia','insuficiente'];
const RD_AVISO=new Set(['incompleta','aguda','estancamiento']);
const RD_NOTA='Señal orientativa, no un diagnóstico: los datos de la app no permiten concluir sobreentrenamiento ni medir tu recuperación. Puedes entrenar con normalidad.';
const rdPct=x=>(x>=0?'+':'−')+num(Math.abs(x*100))+' %';
const rdMedida=o=>o.carga==='peso'?`1RM est. ${rdKg(o.v)}`:`${num(o.v)} reps al fallo`;
const rdCargaTxt=o=>o.carga==='peso'?rdKg(o.kg):o.carga==='c'?'peso corporal':o.carga.startsWith('n:')?'nivel '+o.carga.slice(2):'—';
function rdFila(p){return {id:p.id,fecha:p.t,pos:p.pos+1,carga:rdCargaTxt(p),reps:p.R,rir:p.rir,series:p.nAct,medida:p.v,ref:p.ref,rel:p.rel,cae:!!p.cae}}
function rdEjercicio(L,ctx,now,C=rd.cfg){const {segs,eps}=rdSerie(L,C),u=L[L.length-1],r={ek:u.ek,ej:u.ej,g:u.g,zonas:u.zonas,obs:L,segs,eps,ult:u.t,motivos:[],datos:[],factores:[],vig:null};
  const zs=rdZonasDir(u),ultEst=Math.max(u.t,...zs.map(m=>(ctx.zt[m]||[]).filter(t=>t<=now).slice(-1)[0]||0)),descanso=(now-ultEst)/RD_D;r.descanso=descanso;
  const segU=segs[segs.length-1],P=segU?segU.pts:[],ultP=P[P.length-1];
  const fija=(e,txt)=>{r.estado=e;r.txt=txt;return r};
  const vigencia=e=>descanso>=(e==='aguda'?C.diasAtenuaAguda:C.diasAtenuaInc)?'atenuada':'activa';
  const conEpisodio=(ep,e,txt)=>{r.ep=ep;r.vig=ep.cierre==='sinConfirmar'?'sinConfirmar':vigencia(e);r.datos=ep.pts.map(rdFila);r.factores=rdFactores(ep,ctx,C);
    const base=ep.pts[0].base;r.motivos.push(`referencia: mediana de ${base.length} ${base.length===1?'sesión comparable anterior':'sesiones comparables anteriores'} (${base.map(b=>anFecha(b.t)+' '+num(b.v)).join(' · ')}) = ${num(ep.ref)}`);
    r.motivos.push(...ep.pts.map(p=>`${anFecha(p.t)}: ${rdMedida(p)} (${rdCargaTxt(p)} × ${p.R}, reserva ${p.rir}), ${rdPct(p.rel)} frente a la referencia`));
    if(r.vig==='atenuada')r.motivos.push(`han pasado ${Math.floor(descanso)} días sin estimular la zona: puede haberse disipado, pero falta una sesión comparable que lo confirme`);
    if(r.vig==='sinConfirmar')r.motivos.push(`no se pudo comprobar después: ${ep.porque.join('; ')}`);
    return fija(e,txt)};
  if(!P.length){const nm=L.filter(o=>!o.medible&&!o.desc);return fija(L.every(o=>o.desc)?'descarga':'insuficiente',nm.length?`sesiones sin medida comparable: ${[...new Set(nm.map(o=>o.noMed))].join('; ')}`:'solo sesiones de descarga')}
  if(u.desc&&now-u.t<=C.diasDescarga*RD_D){r.pend=eps.filter(e=>!e.cierre||e.cierre==='sinConfirmar');return fija('descarga',`última sesión de descarga el ${anFecha(u.t)}: se usan cargas y esfuerzo menores a propósito, no se comparan`)}
  const rach=segU.racha;
  if(rach.length){const span=(rach[rach.length-1].t-rach[0].t)/RD_H,n=rach.length,e=n>=C.consecutivas&&span>=C.horasAguda?'incompleta':'aguda',ep=rach.ep;
    return conEpisodio(ep,e,e==='incompleta'?`${n} sesiones comparables seguidas más de un ${Math.round(C.umbral*100)} % por debajo de tu referencia, a lo largo de ${Math.round(span/24)} días`
      :n===1?`la última sesión comparable quedó un ${num(-rach[0].rel*100)} % por debajo de tu referencia (una sola vez)`:`${n} caídas seguidas, pero en menos de ${C.horasAguda} h: compatible con fatiga del momento`)}
  // señal que quedó sin confirmar por un cambio voluntario, mientras la nueva referencia no tiene datos
  const prevEp=eps.filter(e=>e.cierre==='sinConfirmar').slice(-1)[0];
  if(prevEp&&P.length<=C.minBase&&now-prevEp.fin<=C.estancDias*RD_D){const n=prevEp.pts.length,span=(prevEp.pts[n-1].t-prevEp.pts[0].t)/RD_H,e=n>=C.consecutivas&&span>=C.horasAguda?'incompleta':'aguda';
    return conEpisodio(prevEp,e,`señal anterior pendiente (${n} ${n===1?'caída':'caídas'} hasta el ${anFecha(prevEp.pts[n-1].t)}) que aún no se puede comprobar`)}
  if(P.length<2)return fija(segU.corte?'referencia':'insuficiente',segU.corte?`nueva referencia desde el ${anFecha(P[0].t)}: ${segU.corte.join('; ')}`:'una sola sesión comparable: hace falta otra para comparar');
  const res=eps.filter(e=>e.cierre==='resuelta').slice(-1)[0];
  if(res&&now-res.fin<=C.estancDias*RD_D)r.resuelta={ini:res.ini,fin:res.fin,txt:`señal resuelta el ${anFecha(res.fin)}: ${rdMedida(res.por)}, de nuevo en tu referencia (${num(res.ref)})`};
  // descenso gradual o estancamiento frente al mejor nivel mantenido del tramo
  if(P.length>=C.estancMin){const b=rdMejor(P,C.estancMejora),m2=anMed(P.slice(-2).map(p=>p.v));
    const tB=P[b.i].t,desp=P.slice(b.i+1);
    if(desp.length>=2&&m2<b.v*(1-C.umbral)){r.vig=vigencia('incompleta');r.datos=P.slice(Math.max(0,b.i-1)).map(rdFila);
      r.motivos.push(`mejor nivel mantenido (dos sesiones seguidas): ${num(b.v)} el ${anFecha(tB)}`,`mediana de las dos últimas: ${num(m2)} (${rdPct(m2/b.v-1)})`,'ninguna sesión cae por sí sola más del umbral, pero el descenso se acumula');
      return fija('incompleta',`descenso gradual: tus últimas sesiones están un ${num((1-m2/b.v)*100)} % por debajo de tu mejor nivel mantenido`)}
    const t0=P[b.i0].t,d0=P.slice(b.i0+1);
    if((ultP.t-t0)>=C.estancDias*RD_D&&d0.length>=2&&d0.every(p=>p.v<=b.v*(1+C.estancMejora))){r.vig='activa';r.datos=P.slice(Math.max(0,b.i0-1)).map(rdFila);
      r.motivos.push(`mejor nivel mantenido: ${num(b.v)}, alcanzado por primera vez el ${anFecha(t0)}`,`${d0.length} sesiones comparables después, ninguna lo supera en más de un ${num(C.estancMejora*100)} %`);
      return fija('estancamiento',`${Math.round((ultP.t-t0)/RD_D)} días sin superar tu mejor nivel mantenido (${d0.length} sesiones comparables)`)}}
  const rel=ultP.v/P[0].v-1;
  return fija('normal',`${P.length} sesiones comparables desde el ${anFecha(P[0].t)}: ${rdPct(rel)}${Math.abs(rel)<C.umbral?' (dentro de la fluctuación normal)':''}`)}

/* ---------- ventanas móviles de 7, 14 y 28 días ---------- */
function rdVentana(E,ctx,now,dias,sel){const a=now-dias*RD_D,V=ctx.VW[dias]||(ctx.VW[dias]=volumen(a,now+1)),ses=new Set(),gaps=[],rirs=[],rels=[];   // VW: una pasada por ventana
  const obs=ctx.obs.filter(o=>o.t>=a&&o.t<=now&&sel(o));obs.forEach(o=>{ses.add(o.t);if(o.rirMed!=null)rirs.push(o.rirMed)});
  const ts=[...ses].sort((x,y)=>x-y);for(let i=1;i<ts.length;i++)gaps.push((ts[i]-ts[i-1])/RD_H);
  E.forEach(e=>{const s=e.segs[e.segs.length-1];if(!s)return;const P=s.pts,en=P.filter(p=>p.t>=a&&p.t<=now);if(!en.length)return;
    const antes=P.filter(p=>p.t<a&&a-p.t<=rd.cfg.maxDiasRef*RD_D).slice(-1)[0],ref=antes||(en.length>=2?en[0]:null);if(ref)rels.push(en[en.length-1].v/ref.v-1)});
  return {dias,sesiones:ses.size,rir:rirs.length?rirs.reduce((x,y)=>x+y,0)/rirs.length:null,horas:gaps.length?anMed(gaps):null,rend:rels.length?anMed(rels):null,nEj:rels.length,V}}

/* ---------- estado de un grupo (o zona) a partir de sus ejercicios ---------- */
function rdAgrega(E,desc){const ord=e=>RD_ORD.indexOf(e.estado)*3+(e.vig==='atenuada'?1:e.vig==='sinConfirmar'?2:0);
  const L=E.slice().sort((x,y)=>ord(x)-ord(y)||y.ult-x.ult),top=L[0],alertas=L.filter(e=>RD_AVISO.has(e.estado));
  if(desc)return {estado:'descarga',vig:null,top,alertas,E:L,txt:desc};
  if(!top)return {estado:'insuficiente',vig:null,top:null,alertas,E:L,txt:'sin ejercicios registrados'};
  const mismos=L.filter(e=>e.estado===top.estado),con=E.filter(e=>e.estado!=='insuficiente').length;
  const txt=RD_AVISO.has(top.estado)?`${mismos.length} de ${con} ${con===1?'ejercicio':'ejercicios'}: ${mismos.map(e=>e.ej).join(', ')}`:top.estado==='normal'?`${mismos.length} de ${con} ${con===1?'ejercicio':'ejercicios'} con progreso normal`:top.txt;
  return {estado:top.estado,vig:top.vig,top,alertas,E:L,txt}}

/* ---------- análisis completo (memoria: se recalcula si cambia el historial, la configuración, lo anotado o la hora) ---------- */
function rdAnalisis(now=Date.now()){const k=[hist.length,hist[0]?hist[0].id+(hist[0].sets||[]).length+(hist[0].editada||''):'',rdVer,Math.floor(now/RD_H),descargaActiva(),JSON.stringify(descarga)].join('|');
  if(rdMemo.k!==k)rdMemo={k,v:rdCalc(now)};return rdMemo.v}
function rdCalc(now=Date.now()){const C=rd.cfg,obs=rdObs(hist).filter(o=>o.t<=now+RD_H),porEj={},sesG={};
  obs.forEach(o=>{(porEj[o.g+'|'+o.ek]=porEj[o.g+'|'+o.ek]||[]).push(o);const L=sesG[o.g]=sesG[o.g]||[];const s=L.find(x=>x.t===o.t);if(s)s.ef+=o.ef;else L.push({t:o.t,ef:o.ef})});
  const ctx={obs,porEj,sesG,zt:rdIndiceZonas(obs),VW:{}},E={};
  for(const k in porEj)E[k]=rdEjercicio(porEj[k],ctx,now,C);
  const Es=Object.values(E),descAhora=descargaActiva();
  const descG=g=>{if(descAhora)return 'descarga activa: las sesiones de estos días no se comparan';const s=(sesG[g]||[]).slice(-1)[0];
    const u=obs.filter(o=>o.g===g&&o.t===(s&&s.t));return u.length&&u.every(o=>o.desc)&&now-u[0].t<=C.diasDescarga*RD_D?`última sesión de descarga el ${anFecha(u[0].t)}`:null};
  const grupos={},zonas={};
  Object.keys(CAT).forEach(g=>{const L=Es.filter(e=>e.g===g),sel=o=>o.g===g;
    grupos[g]={g,...rdAgrega(L,descG(g)),ventanas:[7,14,28].map(d=>{const w=rdVentana(L,ctx,now,d,sel);w.series=w.V.grupo(g);delete w.V;return w})}});
  Object.keys(MUS).forEach(m=>{const L=Es.filter(e=>(e.zonas[m]||0)>=1),sel=o=>(o.zonas[m]||0)>=1,G=MUS[m][1];
    zonas[m]={m,...rdAgrega(L,descG(G)),ventanas:[7,14,28].map(d=>{const w=rdVentana(L,ctx,now,d,sel);w.series=w.V.zona(m);delete w.V;return w})}});
  return {now,E,grupos,zonas,ctx}}
const rdGrupo=g=>rdAnalisis().grupos[g];
const rdZona=m=>rdAnalisis().zonas[m];

/* ---------- cambios voluntarios marcados por ti y equivalencias ---------- */
function rdMarcaCambio(o){const x={t:o.t??Date.now(),motivo:tiene(RD_MOT,o.motivo)?o.motivo:'otro'};if(o.ek)x.ek=o.ek;if(esG(o.g))x.g=o.g;rd.cortes.push(x);rd.cortes=rd.cortes.slice(-500);return rdGuarda()}
function rdEquivale(a,b){a=rdEjK(a);b=rdEjK(b);if(!a||!b||a===b)return false;rd.equiv[a]=b;return rdGuarda()}
function rdPonCfg(k,v){if(!tiene(RD_CFG,k))return false;const [,lo,hi]=RD_CFG[k],x=vNum(v,lo,hi);if(x==null)return false;rd.cfg[k]=x;rd=rdNorm(rd);return rdGuarda()}

/* ---------- copia de seguridad ---------- */
const rdCopia=()=>({rendimiento:rd,sensaciones:sen});
function rdFusiona(d){const r={n:0,mal:0};if(!esObj(d))return r;
  if(esObj(d.sensaciones)){const c={mal:0},x=senNorm(d.sensaciones,c);r.mal+=c.mal;for(const k in x){if(!sen[k]){sen[k]=x[k];r.n++}}}
  if(esObj(d.rendimiento)){const x=rdNorm(d.rendimiento),ya=new Set(rd.cortes.map(c=>c.t+'|'+(c.ek||'')+'|'+(c.g||'')));
    x.cortes.forEach(c=>{const k=c.t+'|'+(c.ek||'')+'|'+(c.g||'');if(!ya.has(k)){rd.cortes.push(c);ya.add(k);r.n++}});
    for(const k in x.equiv)if(!rd.equiv[k]){rd.equiv[k]=x.equiv[k];r.n++}
    if(localStorage.getItem(RDKEY)==null)rd.cfg=x.cfg}   // los umbrales solo se ponen si este teléfono no tiene los suyos
  rd.cortes.sort((a,b)=>a.t-b.t);rdGuarda();senGuarda();return r}
function rdResumenTxt(){const A=rdAnalisis(),c={};Object.values(A.grupos).forEach(x=>c[x.estado]=(c[x.estado]||0)+1);
  return `rendimiento y recuperación (v39): ${Object.entries(c).map(([k,v])=>`${RD_EST[k].c} ${v}`).join(' · ')} · ${Object.keys(A.E).length} ejercicios seguidos · ${rd.cortes.length} cambios marcados · ${Object.keys(sen).length} días con sensaciones anotadas`}

/* ---------- vistas ---------- */
// chip de tendencia (para el mapa, las barras de Progreso y la pantalla de análisis): independiente del color del volumen
function rdChip(x,corto){if(!x)return '';const e=RD_EST[x.estado],v=x.vig==='atenuada'?' atenuada':x.vig==='sinConfirmar'?' sin confirmar':'';
  return `<span class="rdchip rd-${x.estado}${x.vig&&x.vig!=='activa'?' rd-tenue':''}" data-rd="${x.estado}" title="Tendencia de rendimiento y recuperación: ${esc(e.c+v)}"><i aria-hidden="true">${e.ic}</i>${esc(corto?e.c.split(' (')[0]:e.n)}${esc(v)}</span>`}
const rdChipZona=m=>{try{return rdChip(rdZona(m),true)}catch(e){return ''}};
const rdChipGrupo=g=>{try{return rdChip(rdGrupo(g),true)}catch(e){return ''}};
const rdVol=(v,r)=>{const e=estadoVol(v,r);return `<span class="rdvol"><i class="mpt ${e}"></i>${ef1(v)} / ${r.join('–')} · ${esc(EST_MUS[e])}</span>`};
function rdVentanasHTML(W){return `<div class="tbl"><table class="rdw"><thead><tr><th>Ventana</th><th>Sesiones</th><th>Series ef.</th><th>Reserva</th><th>Entre sesiones</th><th>Rendimiento</th></tr></thead><tbody>${W.map(w=>
  `<tr><td>${w.dias} d</td><td>${w.sesiones}</td><td>${ef1(w.series)}</td><td>${w.rir==null?'—':num(w.rir)}</td><td>${w.horas==null?'—':Math.round(w.horas)+' h'}</td><td>${w.rend==null?'—':rdPct(w.rend)+` <small class="muted">(${w.nEj} ej.)</small>`}</td></tr>`).join('')}</tbody></table></div>`}
function rdDatosHTML(D){if(!D.length)return '';return `<div class="tbl"><table class="rdd"><thead><tr><th>Fecha</th><th>Carga</th><th>Reps</th><th>Reserva</th><th>Series</th><th>Orden</th><th>Medida</th><th>Ref.</th><th>Cambio</th></tr></thead><tbody>${D.map(d=>
  `<tr${d.cae?' class="cae"':''}><td>${anFecha(d.fecha)}</td><td>${esc(d.carga)}</td><td>${d.reps}</td><td>${d.rir}</td><td>${d.series}</td><td>${d.pos}.º</td><td>${num(d.medida)}</td><td>${d.ref==null?'—':num(d.ref)}</td><td>${d.rel==null?'—':rdPct(d.rel)}</td></tr>`).join('')}</tbody></table></div>`}
function rdEjHTML(e){const otros=Object.values(rdAnalisis().E).filter(x=>x.g===e.g&&x.ek!==e.ek);
  return `<details class="rdej rd-${e.estado}" data-rdk="e:${esc(e.g+'|'+e.ek)}"><summary><b>${esc(e.ej)}</b> ${rdChip(e,true)}</summary><p class="hint">${esc(e.txt)}.</p>
    ${e.motivos.length?`<ul class="anmot">${e.motivos.map(m=>`<li>${esc(m)}</li>`).join('')}</ul>`:''}
    ${e.factores.length?`<p class="hint"><b>Coincide con</b> (contexto, no causas): ${esc(e.factores.map(f=>f.txt).join('; '))}.</p>`:RD_AVISO.has(e.estado)&&e.estado!=='estancamiento'?'<p class="hint">No hay otros datos que coincidan (descanso, volumen, esfuerzo, sueño o sensaciones).</p>':''}
    ${e.resuelta?`<p class="hint">✓ ${esc(e.resuelta.txt)}.</p>`:''}${e.pend&&e.pend.length?`<p class="hint">Señales pendientes de antes de la descarga: ${e.pend.length}. Se comprobarán con la próxima sesión normal.</p>`:''}
    ${rdDatosHTML(e.datos)}${RD_AVISO.has(e.estado)?`<p class="hint">${RD_NOTA}</p>`:''}
    <p class="hint">¿Cambiaste algo a propósito? Así no se compara con lo anterior:
      ${Object.entries(RD_MOT).map(([k,n])=>`<button type="button" class="chipb" data-rdcorte="${esc(e.g+'|'+e.ek)}" data-rdmot="${k}">${esc(n)}</button>`).join('')}
      <small class="muted">(se aplica desde su última sesión, ${anFecha(e.ult)})</small></p>
    ${otros.length?`<p class="hint">¿Es el mismo ejercicio que otro con otro nombre? <select data-rdeq="${esc(e.g+'|'+e.ek)}" aria-label="Ejercicio equivalente"><option value="">elegir…</option>${otros.map(x=>`<option value="${esc(x.ek)}">${esc(x.ej)}</option>`).join('')}</select></p>`:''}</details>`}
function rdGrupoHTML(g){const x=rdGrupo(g),D=864e5,t=Date.now(),v=volumen(lunes(t),t+D).grupo(g),hoyS=sen[diaK(t)]||{},dol=hoyS.dolor&&hoyS.dolor[g];
  return `<div class="rdg" data-rdg="${g}"><div class="rdgh"><b>${esc(CAT[g].n)}</b></div>
    <div class="rdgs"><span class="muted">Volumen semanal</span>${rdVol(v,rangoGrupo(g))}<span class="muted">Tendencia</span>${rdChip(x)}</div>
    <p class="hint">${esc(x.txt)}${dol>=2?` · hoy anotaste dolor muscular ${dol} de 3`:''}</p>
    <details data-rdk="g:${g}"><summary class="hint">Ventanas de 7, 14 y 28 días y ejercicios</summary>${rdVentanasHTML(x.ventanas)}${x.E.map(rdEjHTML).join('')||'<p class="hint">Sin ejercicios registrados.</p>'}</details></div>`}
const RD_SUE=[['<5',4.5],['5–6',5.5],['6–7',6.5],['7–8',7.5],['8+',8.5]];
function rdHoyHTML(){const d=diaK(Date.now()),b=leerBien()[d]||{},s=sen[d]||{},ch=(attr,val,on,txt)=>`<button type="button" class="chipb" ${attr}="${val}" aria-pressed="${!!on}">${txt}</button>`;
  return `<details class="rdhoy" data-rdk="hoy"><summary><b>Cómo estás hoy</b> <span class="muted">(opcional)</span></summary>
    <p class="hint">Sueño: ${RD_SUE.map(([t,v])=>ch('data-rdsue',v,+b.sueno===v,t)).join('')}</p>
    <p class="hint">Fatiga general: ${[1,2,3,4,5].map(v=>ch('data-rdfat',v,s.fatiga===v,v)).join('')} <small class="muted">1 = fresco · 5 = muy fatigado</small></p>
    <p class="hint">Dolor muscular (0 nada · 1 leve · 2 moderado · 3 fuerte):</p>
    ${Object.keys(CAT).map(g=>`<p class="hint rddol">${esc(CAT[g].n)}: ${[0,1,2,3].map(v=>ch('data-rddol',g+'|'+v,s.dolor&&s.dolor[g]===v,v)).join('')}</p>`).join('')}
    <p class="hint">Se usan solo como contexto de las señales (nunca bloquean ni cambian el volumen). Toca otra vez para quitarlo.</p></details>`}
const RD_CFG_UI=[['umbral','Caída que cuenta',[.03,.05,.07,.1],v=>Math.round(v*100)+' %'],['consecutivas','Caídas seguidas para «posiblemente incompleta»',[2,3],v=>v],
  ['cambioCarga','Bajada de carga que se toma como voluntaria',[.05,.1,.2],v=>Math.round(v*100)+' %'],['estancDias','Días sin superar el mejor nivel para «estancamiento»',[21,28,42],v=>v+' d']];
function rdCfgHTML(){const C=rd.cfg;return `<details class="rdcfg" data-rdk="cfg"><summary class="hint">Umbrales (configurables)</summary>${RD_CFG_UI.map(([k,n,vs,f])=>
  `<p class="hint">${esc(n)}: ${vs.map(v=>`<button type="button" class="chipb" data-rdcfg="${k}" data-rdv="${v}" aria-pressed="${Math.abs(C[k]-v)<1e-9}">${f(v)}</button>`).join('')}</p>`).join('')}
  <p class="hint">Referencia: mediana de las últimas ${C.base} sesiones comparables (mínimo ${C.minBase}). Atenuación sin nuevas sesiones: ${C.diasAtenuaAguda} días (aguda) y ${C.diasAtenuaInc} días (posiblemente incompleta). Reglas completas en RENDIMIENTO.md.</p></details>`}
function rdHTML(){let A;try{A=rdAnalisis()}catch(e){return '<p class="hint">No se pudo calcular el rendimiento.</p>'}
  const n=Object.values(A.grupos).filter(x=>RD_AVISO.has(x.estado)).length;
  return `<p class="hint">Dos estados independientes por grupo: el <b>volumen semanal</b> (se reinicia cada lunes) y la <b>tendencia de rendimiento y recuperación</b>, que compara cada ejercicio consigo mismo entre sesiones comparables (misma carga, reserva, orden y programa) y no se borra al cambiar de semana: se actualiza con el descanso y las sesiones nuevas. ${n?`${n} ${n===1?'grupo con una señal':'grupos con señales'}.`:'Sin señales ahora.'}</p>
    <p class="hint">${RD_NOTA}</p>${rdHoyHTML()}${Object.keys(CAT).map(rdGrupoHTML).join('')}${rdCfgHTML()}`}
// repinta la pestaña conservando los desplegables abiertos
function renderRend(){const el=document.getElementById('pAnal');if(!el||typeof anTab==='undefined'||anTab!=='rend')return;
  const ab=new Set([...el.querySelectorAll('details[open][data-rdk]')].map(d=>d.dataset.rdk));renderAnalisis();
  el.querySelectorAll('details[data-rdk]').forEach(d=>{if(ab.has(d.dataset.rdk))d.open=true})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-rdsue],[data-rdfat],[data-rddol],[data-rdcfg],[data-rdcorte]');if(!b)return;const d=b.dataset,dia=diaK(Date.now()),on=b.getAttribute('aria-pressed')==='true';
  if(d.rdsue!=null){if(!on)rdPonSueno(dia,+d.rdsue)}
  else if(d.rdfat!=null)senPon(dia,'fatiga',on?null:+d.rdfat);
  else if(d.rddol!=null){const [g,v]=d.rddol.split('|');senPon(dia,'dolor',on?null:+v,g)}
  else if(d.rdcfg)rdPonCfg(d.rdcfg,+d.rdv);
  else if(d.rdcorte){const [g,ek]=d.rdcorte.split('|'),E=rdAnalisis().E[g+'|'+ek];if(!E)return;rdMarcaCambio({t:E.ult-1,ek,g,motivo:d.rdmot});if(typeof vibrar==='function')vibrar(30)}
  renderRend()});
document.addEventListener('change',e=>{const s=e.target.closest('[data-rdeq]');if(!s||!s.value)return;const [g,ek]=s.dataset.rdeq.split('|');rdEquivale(ek,s.value);renderRend()});
