// v40 · Pruebas del PROGRAMA «HIPERTROFIA INTENSIVA — 28 DÍAS» (programa.js, reglas en PROGRAMA.md) con los scripts REALES de la app
// cargados en Node (entorno.js). Se comprueban las reglas en la CAPA DE ESTADO (pg*), no solo lo que pinta la interfaz.
//     node _pruebas/node/programa.test.js        (sale con código 1 si alguna falla)
'use strict';
const cargar = require('./entorno');
const ARCH = ['estilo.js', 'anim.js', 'reloj.js', 'analisis.js', 'auditoria.js', 'pantallas.js', 'cargas.js', 'musica.js', 'cierre.js', 'entreno.js', 'rendimiento.js', 'programa.js'];
const D = 864e5, H = 36e5, M = 6e4;
const LUN = Date.parse('2026-11-02T00:00:00-04:00');           // lunes 2-nov-2026, 0:00 en Santo Domingo
const T = (dia, h, m = 0) => LUN + (dia - 1) * D + h * H + m * M; // día del programa (1–28) a una hora local de Santo Domingo
const INI = '2026-11-02';
const J = x => JSON.stringify(x);
function app(o = {}) { const A = cargar({ ahora: o.ahora ?? T(1, 9), archivos: ARCH, ls: o.ls, hist: o.hist });
  A.t = o.ahora ?? T(1, 9); A.ir = x => { A.t = x; A.fijaAhora(x); }; A.mas = s => A.ir(A.t + s * 1000); return A; }
const dump = A => { const o = {}; for (let i = 0; i < A.ls.length; i++) { const k = A.ls.key(i); o[k] = A.ls.getItem(k); } return o; };
const recarga = (A, t) => { const B = app({ ahora: t ?? A.t, ls: dump(A) }); return B; };
const ev = (A, s) => A.ev(s);
const activo = (o = {}) => { const A = app({ ahora: o.antes ?? T(0, 10), ls: o.ls, hist: o.hist }); const r = ev(A, `pgActivar('${INI}')`); if (!r.ok) throw new Error('activar: ' + r.txt); A.ir(o.ahora ?? T(1, 9)); return A; };
// una serie con tiempos verosímiles: empezar, dur s de trabajo, terminar, registrar, rest s de descanso
function serie(A, o = {}) { const dur = o.dur ?? 40, rest = o.rest ?? 90;
  A.mas(2); const a = ev(A, 'pgEmpezarSerie()'); if (!a.ok) return a; A.mas(dur); const b = ev(A, 'pgTerminarSerie()'); if (!b.ok) return b; A.mas(1.5);
  const c = PGS(A).cur, I = ev(A, 'pgIntCur()'), s = ev(A, `pgPend(pgIntCur(),${c.ej})`), P = ev(A, `pgPresc(PGS.cur.sid,{int:pgIntCur()})`), E = P.ejs[c.ej];
  const reps = typeof o.reps === 'function' ? o.reps(E, s) : o.reps ?? E.reps[s], kg = typeof o.kg === 'function' ? o.kg(E, s) : 'kg' in o ? o.kg : E.cp ? null : (E.kg ?? 40);
  const r = ev(A, `pgRegistrar(${J({ reps, kg, rir: o.rir ?? '2', olvido: !!o.olvido })})`); A.mas(rest); return r; }
const PGS = A => ev(A, 'PGS');
function sesion(A, sid, o = {}) { const r = ev(A, `pgEntrar('${sid}')`); if (!r.ok) return r; let n = 0;
  while (PGS(A).cur && PGS(A).cur.fase !== 'fin' && n++ < 60) { const x = serie(A, o); if (!x.ok) return x; }
  return o.noFin ? { ok: true } : ev(A, 'pgFinalizar()'); }

const out = []; let ok = 0, n = 0;
function prueba(nombre, fn) { n++; let r;
  try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
  if (r === true) r = { ok: true }; if (!r) r = { ok: false }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); }

// 1 · inicio del programa
prueba('Inicio: se elige un lunes (hoy si es lunes, o uno de los dos siguientes); antes del día 1 no hay bloqueo y se puede desprogramar', () => {
  const A = app({ ahora: T(0, 10) });   // domingo 1-nov
  const op = ev(A, 'pgLunesOpc()'), mal = ev(A, `pgActivar('2026-11-03')`), lejos = ev(A, `pgActivar('2026-11-30')`), bien = ev(A, `pgActivar('${INI}')`);
  const f0 = ev(A, 'pgFase()'), b0 = ev(A, 'pgBloqueaLibre()'), dos = ev(A, `pgActivar('2026-11-09')`);
  A.ir(T(1, 0, 1)); const f1 = ev(A, 'pgFase()'), b1 = ev(A, 'pgBloqueaLibre()'), des = ev(A, 'pgDesprogramar()'), fin = ev(A, 'pgFin(pgA())');
  return { ok: J(op) === J(['2026-11-02', '2026-11-09', '2026-11-16']) && !mal.ok && mal.err === 'lunes' && !lejos.ok && bien.ok && f0 === 'programado' && !b0 && !dos.ok && dos.err === 'ya'
    && f1 === 'activo' && b1 && !des.ok && des.err === 'empezado' && fin === '2026-11-29', d: `${f0}→${f1}, fin ${fin}` }; });
prueba('…y desprogramar antes de empezar deja todo como estaba (sin compromiso todavía)', () => {
  const A = app({ ahora: T(0, 10) }); ev(A, `pgActivar('${INI}')`); const r = ev(A, 'pgDesprogramar()');
  return { ok: r.ok && ev(A, 'PGS.act') === null && !ev(A, 'pgBloqueaLibre()') }; });

// 2 y 3 · calendario
prueba('Se generan exactamente 28 días consecutivos: del lunes 2-nov al domingo 29-nov, semanas 1–4', () => {
  const d = ev(app(), `pgDias('${INI}')`), consec = d.every((x, i) => i === 0 || Date.parse(x.f) - Date.parse(d[i - 1].f) === D);
  return { ok: d.length === 28 && consec && d[0].f === INI && d[27].f === '2026-11-29' && d.every(x => x.sem === Math.floor((x.n - 1) / 7) + 1) && d.every((x, i) => x.n === i + 1), d: `${d[0].f} … ${d[27].f}` }; });
prueba('24 sesiones y 4 descansos, todos en miércoles; cada día de la semana con su plantilla, repetida 4 semanas', () => {
  const A = app(), d = ev(A, `pgDias('${INI}')`), ses = d.filter(x => x.sid), desc = d.filter(x => !x.sid);
  const dow = desc.map(x => ev(A, `pgDow('${x.f}')`)), plan = d.slice(0, 7).map(x => x.pl).join(','), rep = [1, 2, 3].every(w => d.slice(w * 7, w * 7 + 7).map(x => x.pl).join(',') === plan);
  return { ok: ses.length === 24 && desc.length === 4 && dow.every(x => x === 2) && plan === 'EA,PA,,LA,EB,PB,LB' && rep && new Set(ses.map(x => x.sid)).size === 24, d: plan }; });
prueba('Prescripción concreta de las 24 sesiones: orden, series exactas, reps por serie y rango, carga o «pendiente de calibración», RIR, descanso, calentamiento, técnica y volumen', () => {
  const A = app(), V = `{ini:'${INI}',ses:{},rep:{},id:'v'}`; let malas = [];
  for (const x of ev(A, `pgDias('${INI}')`).filter(x => x.sid)) { const P = ev(A, `pgPresc('${x.sid}',{},${V})`);
    for (const e of P.ejs) if (!(e.series >= 1 && e.reps.length === e.series && e.reps.every(r => r >= e.lo && r <= e.hi) && e.rir.length === e.series && e.rest >= 60 && e.cal && e.tec && (e.kg != null || e.fuente === 'calibrar' || e.cp))) malas.push(x.sid + ':' + e.n);
    if (!Object.keys(P.vol.Z).length) malas.push(x.sid + ': sin volumen'); }
  const P1 = ev(A, `pgPresc('d01',{},${V})`), P8 = ev(A, `pgPresc('d08',{},${V})`);
  return { ok: !malas.length && P1.ejs.map(e => e.n).join('|') === 'Jalón al pecho, agarre medio|Remo con pecho apoyado|Jalón unilateral|Curl inclinado de bíceps|Curl martillo'
    && P1.series === 10 && P8.series === 13 && J(P1.ejs[0].rir[0]) === J([2, 3]), d: malas.slice(0, 3).join(', ') || `d01 ${P1.series} series (sem. 1) · d08 ${P8.series} (sem. 2)` }; });
prueba('Semana 1 ≈ 75–80 % del volumen (cada sesión entre 75 % y 80 %); semanas 2–4 el volumen completo', () => {
  const A = app(), r = ['EA', 'PA', 'LA', 'EB', 'PB', 'LB'].map(p => ev(A, `pgSeries('${p}',1).reduce((a,b)=>a+b)/pgSeries('${p}',2).reduce((a,b)=>a+b)`));
  const lat = ev(A, `pgSeries('PB',1)[3]`), full = ['EA', 'PB'].every(p => [2, 3, 4].every(w => ev(A, `J=JSON.stringify,J(pgSeries('${p}',${w}))===J(PG_PLANT['${p}'].ej.map(x=>x[1]))`)));
  return { ok: r.every(x => x >= .75 && x <= .8) && lat === 4 && full, d: r.map(x => Math.round(x * 100) + ' %').join(' ') + ' · laterales sem. 1: ' + lat }; });
prueba('RIR por semana: S1 2–3; S2 compuestos 1–3; S3 sin fallo en compuestos; S4 la última serie de los aislados 0–1 y compuestos 1–2', () => {
  const A = app(), R = (s, t, u) => J(ev(A, `pgRir(${s},'${t}',${u})`));
  return R(1, 'c', true) === '[2,3]' && R(2, 'c', false) === '[1,3]' && R(3, 'c', true) === '[1,2]' && R(4, 'a', true) === '[0,1]' && R(4, 'a', false) === '[1,1]' && R(4, 'c', true) === '[1,2]'; });

// 4 · activación inmediata
prueba('Tocar el entrenamiento del día entra AL INSTANTE en modo entrenamiento: sesión creada y guardada, primer ejercicio, sin series anotadas', () => {
  const A = activo(), r = ev(A, `pgEntrar('d01')`), P = PGS(A), I = ev(A, 'pgIntCur()'), guard = JSON.parse(A.ls.getItem('reloj-anomalo-programa'));
  const h = ev(A, 'pgEntHTML(pgAhora())');
  return { ok: r.ok && P.cur.fase === 'lista' && P.cur.ej === 0 && I.sets.length === 0 && I.est === 'curso' && guard.cur && guard.cur.iid === I.id
    && /Jalón al pecho, agarre medio/.test(h) && /Serie <b>1 de 2<\/b>/.test(h) && /Descanso programado: <b>2:00<\/b>/.test(h) && /data-pg="empezar"/.test(h) && /Sesión iniciada · nada registrado/.test(h),
    d: `fase ${P.cur.fase}, ${I.sets.length} series` }; });
prueba('…la interfaz distingue inicio de sesión, inicio de serie, registro, pausa y finalización', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); const f = [];const fase = () => ev(A, 'pgEntHTML(pgAhora())').match(/class="pgfase"[^>]*><b>([^<]+)/)[1];
  f.push(fase()); A.mas(2); ev(A, 'pgEmpezarSerie()'); f.push(fase()); A.mas(40); ev(A, 'pgTerminarSerie()'); f.push(fase());
  ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`); f.push(fase()); A.mas(2); ev(A, 'pgPausa()'); f.push(fase());
  return { ok: new Set(f).size === 5 && /Serie en curso/.test(f[1]) && /Registra/.test(f[2]) && /Descanso/.test(f[3]) && /pausa/.test(f[4]), d: f.join(' → ') }; });

// 5 · bloqueo
prueba('Bloqueo en la capa de estado: iniciarSesion lanza «programa-activo»; el reloj (pad) no empieza; «retomar», bloque y cierre tampoco', () => {
  const A = activo(); let lanza = '';
  try { ev(A, 'iniciarSesion()'); } catch (e) { lanza = e.message; }
  ev(A, `$('pad').onclick()`); const st = ev(A, 'S.st'), msg = ev(A, 'pgUI.msg');
  ev(A, `retomar={t:Date.now(),S:{...fresh(),st:'rest',id:'x',start:new Date().toISOString(),sets:[]},grupo:'biceps',rutI:0,miaLista:[],rutPos:0,rutEf:0,pila:[]}`); ev(A, 'retomarSesion()');
  const ret = ev(A, 'retomar!==null&&S.st'), otro = ev(A, `pgActivar('2026-11-09')`);
  return { ok: lanza === 'programa-activo' && st === 'idle' && /^Programa de hipertrofia activo\. Tu compromiso de 28 días continúa\. Próxima sesión disponible: lun,? 2 nov\.? · Espalda A \+ bíceps\.$/.test(msg)
    && ret === 'idle' && !otro.ok, d: msg }; });
prueba('…los otros programas se ven pero no arrancan (rutinas, superseries, fuerza y bloques siguen visibles; el reloj queda deshabilitado)', () => {
  const A = activo(); ev(A, 'render()'); const pad = ev(A, `$('pad').getAttribute`) ; const rut = ev(A, `$('rutinas').innerHTML.length`);
  ev(A, `tab='reloj'`); ev(A, 'pgRender()'); const card = ev(A, `$('pgCard').innerHTML`);
  return { ok: rut > 0 && /Programa de hipertrofia activo/.test(card) && /Entrenar ahora: Espalda A/.test(card), d: `rutinas pintadas (${rut} car.)` }; });

// 6 · reinicio con sesión activa
prueba('Reinicio de la app con sesión activa: se reanuda exactamente esa sesión (mismo intento, fase y series) y se vuelve a la pantalla de entrenamiento', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); serie(A); const I0 = ev(A, 'pgIntCur()'), c0 = PGS(A).cur;
  const B = recarga(A), I1 = ev(B, 'pgIntCur()'), c1 = PGS(B).cur, otra = ev(B, `pgEntrar('d01')`), n = ev(B, `pgInts(pgA(),'d01').length`);
  return { ok: I1.id === I0.id && I1.sets.length === 2 && c1.fase === c0.fase && c1.ej === c0.ej && ev(B, 'tab') === 'pgent' && otra.ok && otra.reanuda && n === 1, d: `${I1.sets.length} series · fase ${c1.fase} · tab ${ev(B, 'tab')}` }; });
// 7 · conexión / cierre en mitad de la serie
prueba('Pérdida de conexión o cierre en mitad de una serie: al volver sigue «serie en curso» y la duración se mide desde el toque real de empezar', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); A.mas(5); ev(A, 'pgEmpezarSerie()'); const t0 = A.t;
  const B = recarga(A, t0 + 35000); B.t = t0 + 35000; const f = PGS(B).cur.fase; ev(B, 'pgTerminarSerie()'); const r = ev(B, `pgRegistrar({reps:10,kg:40,rir:'2'})`);
  const sinRed = (() => { try { ev(B, 'pgSincronizar()'); return true; } catch (e) { return false; } })();
  return { ok: f === 'serie' && r.ok && Math.abs(r.row.dur - 35) < .01 && r.row.plaus === 'plausible' && sinRed, d: `fase al volver ${f}, duración ${r.row.dur} s` }; });
prueba('…si el teléfono no deja guardar, se avisa (como el resto de la app) y el estado sigue en memoria', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); ev(A, `localStorage.setItem=()=>{throw new Error('lleno')}`); const r = serie(A);
  return { ok: r.ok && ev(A, `sinEn.has('reloj-anomalo-programa')`) && ev(A, 'pgIntCur().sets.length') === 1 }; });

// 8 · doble toque
prueba('Doble toque rápido: «Registrar» dos veces deja UNA serie; «Empezar» y «Terminar» repetidos en < 0,9 s se ignoran', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); A.mas(3); const e1 = ev(A, 'pgEmpezarSerie()'); A.mas(.3); const e2 = ev(A, 'pgEmpezarSerie()');
  A.mas(.4); const t1 = ev(A, 'pgTerminarSerie()'); A.mas(40); const t2 = ev(A, 'pgTerminarSerie()'); A.mas(.1); const t3 = ev(A, 'pgTerminarSerie()');
  const r1 = ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`), r2 = ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`), r3 = ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`);
  A.mas(.2); const e3 = ev(A, 'pgEmpezarSerie()');
  return { ok: e1.ok && !e2.ok && !t1.ok && t1.err === 'rebote' && t2.ok && !t3.ok && r1.ok && !r2.ok && !r3.ok && !e3.ok && e3.err === 'rebote' && ev(A, 'pgIntCur().sets.length') === 1,
    d: `series: ${ev(A, 'pgIntCur().sets.length')} · ${e2.err}/${t1.err}/${r2.err}/${e3.err}` }; });
prueba('…y el mismo hueco nunca se registra dos veces aunque se fuerce el estado (identificador único por sesión, ejercicio y serie)', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); const I = ev(A, 'pgIntCur()');
  ev(A, `PGS.cur.fase='registro';PGS.cur.ej=0;pgIntCur().omit=[];pgIntCur().plan[0].n=1`); const r = ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`);
  return { ok: !r.ok && r.err === 'dup' && ev(A, 'pgIntCur().sets.length') === 1 && I.sets[0].id === I.id + '-0-0' }; });

// 9 · tiempo imposible
prueba('Sesión entera en tiempo físicamente imposible (series de 1 s): las series no valen y la sesión no se puede dar por completada', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); let k = 0;
  while (PGS(A).cur.fase !== 'fin' && k++ < 20) { A.mas(1); ev(A, 'pgEmpezarSerie()'); A.mas(1); ev(A, 'pgTerminarSerie()'); ev(A, `pgRegistrar({reps:12,kg:40,rir:'2'})`); }
  const I = ev(A, 'pgIntCur()'), R = ev(A, 'pgResumen(pgIntCur())'), f = ev(A, 'pgFinalizar()');
  return { ok: I.sets.length === 10 && I.sets.every(r => r.plaus === 'imposible') && R.validas === 0 && !f.ok && f.err === 'insuficiente', d: `${R.validas}/${R.total} válidas · ${f.err}` }; });
prueba('…y con series «verosímiles» de una en una pero sin descansos (10 series en 2 min), la sesión entera es imposible: no cuenta', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); let k = 0;
  while (PGS(A).cur.fase !== 'fin' && k++ < 20) { A.mas(1); ev(A, 'pgEmpezarSerie()'); A.mas(12); ev(A, 'pgTerminarSerie()'); ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`); }
  const R = ev(A, 'pgResumen(pgIntCur())'), f = ev(A, 'pgFinalizar()'), plaus = ev(A, 'pgIntCur().sets.map(r=>r.plaus)');
  return { ok: plaus.every(p => p === 'plausible') && R.inv && R.validas === 0 && !f.ok && f.err === 'tiempo', d: `inv=${R.inv} · ${f.err}` }; });
prueba('…«Olvidé tocar al empezar» deja la duración desconocida (no se inventa) y solo se puede usar 2 veces por sesión', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); const r = [serie(A, { olvido: true }), serie(A, { olvido: true }), serie(A, { olvido: true })];
  return { ok: r[0].ok && r[0].row.plaus === 'desconocida' && r[0].row.dur === undefined && r[1].ok && !r[2].ok && r[2].err === 'olvido', d: r.map(x => x.ok ? x.row.plaus : x.err).join(', ') }; });

// 10 · simultáneas
prueba('Sesiones simultáneas imposibles: con d01 en curso no entra otra del programa ni una libre; volver a tocar d01 reanuda sin duplicar', () => {
  const A = activo({ ahora: T(1, 23, 30) }); ev(A, `pgEntrar('d01')`); A.ir(T(2, 0, 30)); const o = ev(A, `pgEntrar('d02')`); let libre = '';
  try { ev(A, 'iniciarSesion()'); } catch (e) { libre = e.message; } const re = ev(A, `pgEntrar('d01')`);
  return { ok: !o.ok && o.err === 'otra' && libre === 'programa-activo' && re.ok && re.reanuda && ev(A, `pgInts(pgA(),'d01').length`) === 1, d: o.txt }; });
// 11 · adelantar
prueba('No se puede adelantar: el lunes, la sesión del martes o la del día 28 no entran; tampoco antes del día 1', () => {
  const A = activo({ ahora: T(0, 12) }); const pre = ev(A, `pgEntrar('d01')`); A.ir(T(1, 9)); const a = ev(A, `pgEntrar('d02')`), b = ev(A, `pgEntrar('d28')`);
  return { ok: !pre.ok && pre.err === 'antes' && !a.ok && a.err === 'futura' && !b.ok && b.err === 'futura' && !PGS(A).cur, d: a.txt }; });

// 12 · reloj del teléfono
prueba('Hora atrasada a mano: la marca de agua impide volver a un día pasado (d02 omitido sigue omitido y no se puede entrenar)', () => {
  const A = activo(); A.ir(T(3, 10)); ev(A, 'pgAhora()'); A.ir(T(2, 10)); const t = ev(A, 'pgAhora()'), r = ev(A, `pgEntrar('d02')`), e = ev(A, `pgEstadoSes(pgA(),'d02',pgDiaK(pgAhora()))`);
  return { ok: t >= T(3, 10) && !r.ok && r.err === 'pasada' && e === 'omitido' && ev(A, 'pgAviso') === 'atras', d: `${r.err} · ${e}` }; });
prueba('Hora adelantada con la app abierta (salto sin que pase el tiempo real): se compensa y la sesión de mañana no se desbloquea', () => {
  const A = activo(); let perf = 1e6; A.ctx.performance = { now: () => perf }; ev(A, 'pgAhora()');
  A.ir(A.t + D); perf += 5000; const t = ev(A, 'pgAhora()'), r = ev(A, `pgEntrar('d02')`);
  return { ok: Math.abs(t - (T(1, 9) + 5000)) < 2000 && !r.ok && r.err === 'futura' && ev(A, 'pgAviso') === 'salto', d: `${r.err}` }; });
prueba('Hora adelantada con la app cerrada y sin red: al llegar la hora real de la red, lo registrado queda «hora no verificable» y no cuenta', () => {
  const A = activo(); A.ir(T(2, 9)); ev(A, `pgEntrar('d02')`); serie(A); serie(A); const real = T(1, 9) + 200000;
  ev(A, `pgHoraRed(${real},Date.now())`); const I = ev(A, `pgInts(pgA(),'d02')[0]`); ev(A, `pgSeguridad('imposible')`);
  const e = ev(A, `pgEstadoSes(pgA(),'d02',pgDiaK(pgAhora()))`), ah = ev(A, 'pgAhora()'), h = ev(A, 'hist.filter(x=>x.prog&&x.prog.s==="d02")');
  A.ir(T(2, 9) + 600000); /* ya es martes de verdad: el reloj del teléfono vuelve a la hora correcta */ ev(A, `pgHoraRed(Date.now(),Date.now())`); const r = ev(A, `pgEntrar('d02')`);
  return { ok: I.dud === true && e === 'pendiente' && Math.abs(ah - real) < 5000 && h.every(x => x.prog.d === true) && r.ok, d: `dud=${I.dud}, estado ${e}, nuevo intento ${r.ok}` }; });

// 13 · medianoche
prueba('Sesión que cruza la medianoche: pertenece a su día (d01), se completa el martes 0:40 y el martes queda disponible después', () => {
  const A = activo({ ahora: T(1, 23, 20) }); ev(A, `pgEntrar('d01')`); let k = 0; while (PGS(A).cur.fase !== 'fin' && k++ < 20) serie(A, { rest: 240 });
  const ult = ev(A, 'pgIntCur().sets.slice(-1)[0].t1'), dEnCurso = (A.mas(1), ev(A, `pgEntrar('d02')`)); const f = ev(A, 'pgFinalizar()'), h = ev(A, 'pgDiaK(pgAhora())');
  const e1 = ev(A, `pgEstadoSes(pgA(),'d01',pgDiaK(pgAhora()))`), e2 = ev(A, `pgEstadoSes(pgA(),'d02',pgDiaK(pgAhora()))`), r = ev(A, `pgEntrar('d02')`);
  return { ok: ev(A, `pgDiaK(${Date.parse(ult)})`) === '2026-11-03' && !dEnCurso.ok && f.ok && f.est === 'completado' && h === '2026-11-03' && e1 === 'completado' && e2 === 'hoy' && r.ok, d: `${e1} · martes ${e2}` }; });
prueba('Zona horaria fija (Santo Domingo): las 23:30 del lunes en Santo Domingo son ya martes en UTC y siguen siendo lunes para el programa', () => {
  const A = app(); return ev(A, `pgDiaK(${T(1, 23, 30)})`) === '2026-11-02' && new Date(T(1, 23, 30)).toISOString().slice(0, 10) === '2026-11-03'; });

// 14 · abandono
prueba('Abandono voluntario: exige motivo, la frase exacta y sostener 15 s seguidos (medido en la capa de estado); soltar antes reinicia', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); serie(A); const F = 'ABANDONAR ENTRENAMIENTO';
  const a = ev(A, `pgAbandonar({mot:'',frase:'${F}'})`); const b = ev(A, `pgAbandonar({mot:'sin ganas',frase:'abandonar'})`);
  ev(A, 'pgSostener()'); A.mas(14); const c = ev(A, `pgAbandonar({mot:'sin ganas',frase:'${F}'})`);
  A.mas(2); ev(A, 'pgSoltar()'); const d = ev(A, `pgAbandonar({mot:'sin ganas',frase:'${F}'})`);
  ev(A, 'pgSostener()'); A.mas(15); const e = ev(A, `pgAbandonar({mot:'sin ganas',frase:'${F}'})`), I = ev(A, `pgInts(pgA(),'d01')[0]`);
  return { ok: !a.ok && a.err === 'motivo' && !b.ok && b.err === 'frase' && !c.ok && c.err === 'sostener' && !d.ok && d.err === 'sostener' && e.ok && I.est === 'abandonado' && I.mot === 'sin ganas' && I.fin && I.sets.length === 2 && !PGS(A).cur,
    d: [a, b, c, d].map(x => x.err).join(', ') + ` → ${I.est}` }; });
prueba('…el abandono no habilita otra sesión: d01 no se reabre hoy, d02 sigue en el futuro, lo libre sigue bloqueado y no se reprograma para hoy', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); ev(A, 'pgSostener()'); A.mas(16); ev(A, `pgAbandonar({mot:'cansado',frase:'ABANDONAR ENTRENAMIENTO'})`);
  const r1 = ev(A, `pgEntrar('d01')`), r2 = ev(A, `pgEntrar('d02')`), op = ev(A, `pgOpcRepro('d01')`);
  return { ok: !r1.ok && r1.err === 'cerrada' && !r2.ok && ev(A, 'pgBloqueaLibre()') && !op.includes('2026-11-02') && op.includes('2026-11-04'), d: `opciones: ${op.join(', ')}` }; });
prueba('…la frase y el motivo se guardan escapados: un motivo con HTML no se ejecuta al pintarse', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); ev(A, 'pgSostener()'); A.mas(16); ev(A, `pgAbandonar({mot:'<img src=x onerror=alert(1)>',frase:'ABANDONAR ENTRENAMIENTO'})`);
  ev(A, `pgUI.dia='${INI}'`); const h = ev(A, 'pgPantallaHTML(pgAhora())'); return { ok: !/<img src=x/.test(h) && /&lt;img src=x/.test(h) }; });

// 15 · seguridad
prueba('Salida por seguridad INMEDIATA en cualquier fase (lista, serie, registro, descanso, pausa, fin): sin frase, sin espera, conserva lo hecho', () => {
  const res = [];
  for (const fase of ['lista', 'serie', 'registro', 'descanso', 'pausa', 'fin']) { const A = activo(); ev(A, `pgEntrar('d01')`);
    if (fase !== 'lista') serie(A); if (fase === 'serie') { A.mas(2); ev(A, 'pgEmpezarSerie()'); } if (fase === 'registro') { A.mas(2); ev(A, 'pgEmpezarSerie()'); A.mas(30); ev(A, 'pgTerminarSerie()'); }
    if (fase === 'pausa') ev(A, 'pgPausa()'); if (fase === 'fin') { let k = 0; while (PGS(A).cur.fase !== 'fin' && k++ < 20) serie(A); }
    const f0 = PGS(A).cur.fase, r = ev(A, `pgSeguridad('dolor')`), I = ev(A, `pgInts(pgA(),'d01')[0]`);
    res.push(f0 === fase && r.ok && I.est === 'seguridad' && I.cat === 'dolor' && I.sets.length === (fase === 'lista' ? 0 : fase === 'fin' ? 10 : 1) && !PGS(A).cur && ((fase === 'serie' || fase === 'registro') === !!I.corte)); }
  return { ok: res.every(Boolean), d: res.map(x => x ? '✓' : '✗').join('') }; });
prueba('…ofrece reprogramar compatible con la recuperación (≥ 48 h, miércoles libre sin el mismo grupo al lado) y no finge que se completó', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); const r = ev(A, `pgSeguridad('lesion','tirón en la espalda')`), e = ev(A, `pgEstadoSes(pgA(),'d01',pgDiaK(pgAhora()))`);
  const h = ev(A, 'hist.filter(x=>x.prog&&x.prog.s==="d01")');
  return { ok: r.ok && J(r.opc) === J(['2026-11-04']) && e === 'seguridad' && h.length === 1 && h[0].completa === false && h[0].prog.e === 'seguridad', d: `opciones ${r.opc.join(', ')}` }; });

// 16 · semana con una sesión omitida
prueba('Semana con una sesión omitida: el martes sin registro queda «Omitido» al pasar el día; el calendario lo muestra y nada lo marca como hecho', () => {
  const A = activo(); sesion(A, 'd01'); A.ir(T(3, 12)); const cal = ev(A, 'pgCalendario(pgA(),pgDiaK(pgAhora()))');
  return { ok: cal[0].est === 'completado' && cal[1].est === 'omitido' && cal[2].est === 'descanso' && cal[3].est === 'pendiente' && cal.filter(c => c.est === 'omitido').length === 1, d: cal.slice(0, 4).map(c => c.est).join(', ') }; });

// 17 · reprogramación
prueba('Reprogramación sin doble contabilización: d01 omitido → miércoles; la casilla original dice «Reprogramado», la nueva tiene la sesión una sola vez', () => {
  const A = activo({ ahora: T(2, 10) }); const op = ev(A, `pgOpcRepro('d01')`), r = ev(A, `pgReprogramar('d01','2026-11-04')`), r2 = ev(A, `pgReprogramar('d01','2026-11-11')`);
  const cal = ev(A, 'pgCalendario(pgA(),pgDiaK(pgAhora()))'); A.ir(T(3, 10)); const s = sesion(A, 'd01');
  A.ir(T(4, 10)); const cal2 = ev(A, 'pgCalendario(pgA(),pgDiaK(pgAhora()))'), sesPorFecha = {};
  cal2.forEach(c => { if (c.ses) sesPorFecha[c.f] = (sesPorFecha[c.f] || 0) + 1; });
  const cuenta = cal2.filter(c => c.ses === 'd01').length;
  return { ok: op.includes('2026-11-04') && r.ok && !r2.ok && r2.err === 'ya' && cal[0].est === 'reprogramado' && cal[2].ses === 'd01' && cal[2].est === 'pendiente' && s.ok
    && cal2[0].est === 'reprogramado' && cal2[2].est === 'completado' && cuenta === 1 && Object.values(sesPorFecha).every(x => x === 1), d: `${cal2[0].est} → ${cal2[2].est}` }; });
prueba('…el pecho B del sábado perdido no se puede mover al miércoles siguiente (martes de pecho al lado): queda omitido sin acumular volumen en otro día', () => {
  const A = activo({ ahora: T(8, 10) }); const op = ev(A, `pgOpcRepro('d06')`), r = ev(A, `pgReprogramar('d06','2026-11-11')`), h = (ev(A, `pgUI.dia='2026-11-07'`), ev(A, 'pgPantallaHTML(pgAhora())'));
  const P = ev(A, `pgPresc('d09')`), base = ev(A, `pgSeries('PA',2).reduce((a,b)=>a+b)`);
  return { ok: !op.length && !r.ok && r.err === 'fecha' && /No hay un día compatible/.test(h) && P.series === base, d: `el martes siguiente sigue con ${P.series} series` }; });
prueba('…y el pecho A del martes perdido sí puede ir al miércoles (el martes vecino es ella misma), y como mucho 7 días después de su fecha', () => {
  const A = activo({ ahora: T(3, 10) }); const op = ev(A, `pgOpcRepro('d02')`);
  return { ok: J(op) === J(['2026-11-04']), d: op.join(', ') }; });

// 18 · cargas distintas entre series
prueba('Cargas distintas entre series: cada serie conserva su carga; la progresión no mezcla 50 y 45 kg como si fueran una serie homogénea', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); const kgs = [50, 45];
  serie(A, { reps: 12, kg: 50, rir: '2' }); serie(A, { reps: 12, kg: 45, rir: '2' }); const I = ev(A, 'pgIntCur()').sets.map(r => r.kg);
  let k = 0; while (PGS(A).cur.fase !== 'fin' && k++ < 20) serie(A); ev(A, 'pgFinalizar()');
  const h = ev(A, 'hist.find(x=>x.prog&&x.prog.s==="d01"&&x.g==="espalda").sets.filter(r=>r.ej==="Jalón al pecho, agarre medio").map(r=>r.kg)');
  A.ir(T(8, 9)); const P = ev(A, `pgPresc('d08')`).ejs[0];
  return { ok: J(I) === J(kgs) && J(h) === J(kgs) && P.kg === 50 && P.fuente !== 'sube', d: `historial ${h.join('/')} · próxima ${P.kg} kg (${P.fuente})` }; });
// 19 · progresión
prueba('Progresión sin datos históricos: ninguna carga inventada; todas «pendiente de calibración» y se ve así en la interfaz', () => {
  const A = activo(); const P = ev(A, `pgPresc('d01')`), h = ev(A, `pgUI.dia='${INI}',pgPantallaHTML(pgAhora())`);
  return { ok: P.ejs.every(e => e.kg === null && e.fuente === 'calibrar') && /pendiente de calibración/.test(h), d: P.ejs.map(e => e.fuente).join(',') }; });
prueba('…con un dato real del mismo ejercicio en el historial, la carga inicial sale ESTIMADA y etiquetada (ejercicio, fecha, carga, reps, reserva)', () => {
  const hist = [{ id: 'h1', start: new Date(T(0, 18) - 5 * D).toISOString(), g: 'espalda', grupo: 'Espalda', completa: true, series: 1,
    sets: [{ ex: 'Jalón', ej: 'Jalón al pecho', k: 'act.', reps: '10', rir: '1', kg: 60, P: .5, rest: 90, dur: 30, plaus: 'plausible' }] }];
  const A = activo({ hist }); const e = ev(A, `pgPresc('d01')`).ejs[0];
  return { ok: e.fuente === 'ref' && e.kg > 0 && e.kg < 60 && /estimada de tu historial \(Jalón al pecho/.test(e.ptxt), d: `${e.kg} kg · ${e.ptxt.slice(0, 80)}` }; });
prueba('Doble progresión: tope del rango en todas las series con la reserva pedida → sube un paso y vuelve al mínimo; si no, misma carga y +1 rep', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`);
  let k = 0; while (PGS(A).cur.fase !== 'fin' && k++ < 20) { const ej = PGS(A).cur.ej; serie(A, ej === 0 ? { reps: 12, kg: 50, rir: '2' } : ej === 1 ? { reps: 9, kg: 40, rir: '2' } : {}); }
  ev(A, 'pgFinalizar()'); A.ir(T(8, 9)); const P = ev(A, `pgPresc('d08')`), e0 = P.ejs[0], e1 = P.ejs[1];
  return { ok: e0.fuente === 'sube' && e0.kg === 52.5 && e0.reps.every(r => r === 8) && e1.fuente === 'reps' && e1.kg === 40 && e1.reps.slice(0, 2).every(r => r === 10), d: `jalón ${e0.kg} × ${e0.reps.join('-')} · remo ${e1.kg} × ${e1.reps.join('-')}` }; });
prueba('…si el rendimiento baja con la misma carga, NO se sube: se mantiene y se pide revisar fatiga y descanso (o bajar 5–10 %)', () => {
  const A = activo(); sesion(A, 'd01', { reps: (E, s) => E.i === 0 ? 10 : E.reps[s], kg: (E) => E.i === 0 ? 50 : 40 });
  A.ir(T(8, 9)); sesion(A, 'd08', { reps: (E, s) => E.i === 0 ? 7 : E.reps[s], kg: (E) => E.i === 0 ? 50 : 40, rir: '0' });
  A.ir(T(15, 9)); const e = ev(A, `pgPresc('d15')`).ejs[0];
  return { ok: e.fuente === 'baja' && e.kg === 50 && /no se sube la carga/.test(e.ptxt) && /5–10 %/.test(e.ptxt), d: e.ptxt.slice(0, 90) }; });
prueba('…las series imposibles o improbables no enseñan a la progresión (no contaminan el aprendizaje)', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); A.mas(2); ev(A, 'pgEmpezarSerie()'); A.mas(3); ev(A, 'pgTerminarSerie()'); ev(A, `pgRegistrar({reps:12,kg:80,rir:'3'})`);
  A.mas(90); ev(A, 'pgEmpezarSerie()'); A.mas(4); ev(A, 'pgTerminarSerie()'); ev(A, `pgRegistrar({reps:12,kg:80,rir:'3'})`);
  ev(A, `pgSeguridad('imposible')`); A.ir(T(8, 9)); const e = ev(A, `pgPresc('d08')`).ejs[0], pl = ev(A, `pgInts(pgA(),'d01')[0].sets.map(r=>r.plaus)`);
  return { ok: pl.every(p => p === 'imposible' || p === 'improbable') && e.kg === null && e.fuente === 'calibrar', d: pl.join(',') + ' → ' + e.fuente }; });

// finalización normal y parcial
prueba('Finalización: no basta con abrir los ejercicios; con series pendientes no cierra; omitir con motivo permite cerrar como parcial (≥ 50 %)', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); for (let i = 0; i < 5; i++) ev(A, `pgVer(${i})`); const f0 = ev(A, 'pgFinalizar()');
  for (let i = 0; i < 6; i++) serie(A); ev(A, `pgOmitir(PGS.cur.ej,true,'tiempo')`); while (PGS(A).cur.fase !== 'fin') ev(A, `pgOmitir(PGS.cur.ej,true,'tiempo')`);
  const I = ev(A, 'pgIntCur()'), f = ev(A, 'pgFinalizar()');
  return { ok: !f0.ok && f0.err === 'pendientes' && f.ok && f.est === 'parcial' && I.sets.length === 6 && I.omit.length === 4, d: `${f0.err} → ${f.est} (${I.sets.length} hechas, ${I.omit.length} omitidas)` }; });
prueba('…con menos de la mitad no se puede «finalizar»: hay que abandonar (con su procedimiento) o salir por seguridad', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); while (PGS(A).cur.fase !== 'fin') ev(A, `pgOmitir(PGS.cur.ej,true,'fatiga')`); const f = ev(A, 'pgFinalizar()');
  return { ok: !f.ok && f.err === 'insuficiente' && !!PGS(A).cur, d: f.txt }; });
prueba('Pausa: el tiempo en pausa no cuenta como descanso medido (queda «interrumpido»); la serie en marcha no se puede pausar', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A, { rest: 30 }); ev(A, 'pgPausa()'); A.mas(300); ev(A, 'pgReanudar()'); A.mas(30); ev(A, 'pgEmpezarSerie()');
  const u = ev(A, 'pgIntCur().sets[0]'), p = ev(A, 'pgPausa()');
  return { ok: Math.abs(u.restR - 60) <= 2 && u.restQ === 'interrumpido' && !p.ok, d: `descanso ${u.restR} s (${u.restQ})` }; });

// 20 y 21 · fin del ciclo
prueba('Finalización del día 28: al completar la última sesión el ciclo se cierra con su informe y se desbloquean los demás programas', () => {
  const A = activo(); sesion(A, 'd01'); A.ir(T(28, 10)); const antes = ev(A, 'pgBloqueaLibre()'); const s = sesion(A, 'd28');
  const arch = ev(A, 'PGS.arch'), f = ev(A, 'pgFase()'), b = ev(A, 'pgBloqueaLibre()'); let lanza = ''; try { ev(A, 'S=fresh();iniciarSesion()'); } catch (e) { lanza = e.message; }
  const inf = ev(A, `pgInforme(PGS.arch[0],'terminado',PGS.arch[0].cerr)`), nuevo = ev(A, `pgActivar(pgLunesOpc()[1])`);
  return { ok: antes && s.ok && arch.length === 1 && arch[0].est === 'terminado' && f === 'ninguno' && !b && lanza === '' && inf.hechas === 2 && inf.cuenta.omitido === 22 && nuevo.ok,
    d: `${inf.hechas} hechas, ${inf.cuenta.omitido} omitidas · nuevo programa ${nuevo.ok}` }; });
prueba('Desbloqueo tras el ciclo aunque el día 28 se pierda: el lunes 30 el programa se cierra solo; antes, sigue bloqueado', () => {
  const A = activo(); A.ir(T(28, 23, 50)); const b0 = ev(A, 'pgBloqueaLibre()'); ev(A, 'pgRevisaFin()'); const a0 = ev(A, 'PGS.arch.length');
  A.ir(T(29, 0, 5)); ev(A, 'pgRevisaFin()'); return { ok: b0 && a0 === 0 && ev(A, 'PGS.arch.length') === 1 && !ev(A, 'pgBloqueaLibre()') }; });
prueba('Informe: sesiones, adherencia, volumen semanal por músculo, cargas, reps, RIR, progresión, inválidos, fatiga y recomendaciones; rendimiento ≠ crecimiento', () => {
  const A = activo(); sesion(A, 'd01', { kg: () => 50 }); A.ir(T(8, 9)); sesion(A, 'd08', { kg: () => 52.5 }); A.ir(T(9, 9)); ev(A, `pgEntrar('d09')`); A.mas(2); ev(A, 'pgEmpezarSerie()'); A.mas(1); ev(A, 'pgTerminarSerie()'); ev(A, `pgRegistrar({reps:12,kg:40,rir:'2'})`); ev(A, `pgSeguridad('enfermedad')`);
  A.ir(T(29, 1)); ev(A, 'pgRevisaFin()'); const x = ev(A, `pgInforme(PGS.arch[0],'terminado',PGS.arch[0].cerr)`), h = ev(A, `pgInformeHTML(pgInforme(PGS.arch[0],'terminado',PGS.arch[0].cerr))`);
  return { ok: x.hechas === 2 && x.cuenta.seguridad === 1 && x.semV[0].series > 0 && x.semV[1].series > 0 && x.semV[0].Z.dorsal > 0 && x.ejs.length >= 5 && x.inval.imposible === 1 && x.rec.length >= 2
    && /no demuestran hipertrofia/.test(h) && /No hay medidas al inicio y al final/.test(h) && /Recomendaciones/.test(h), d: `adherencia ${Math.round(x.adh * 100)} % · S1 ${x.semV[0].series} series · ${x.rec.length} recomendaciones` }; });
prueba('Cancelación explícita: sin motivo no; por «otro» exige la frase; por lesión basta confirmar; se archiva con su informe y desbloquea', () => {
  const A = activo(); sesion(A, 'd01'); A.ir(T(2, 9)); ev(A, `pgEntrar('d02')`); serie(A);
  const a = ev(A, `pgCancelar({})`), b = ev(A, `pgCancelar({cat:'otro',mot:'me aburrí',frase:'cancelar'})`), c = ev(A, `pgCancelar({cat:'lesion'})`), d = ev(A, `pgCancelar({cat:'lesion',conf:true})`);
  const ar = ev(A, 'PGS.arch[0]'), I = ar.ses.d02.int[0];
  return { ok: !a.ok && !b.ok && b.err === 'frase' && !c.ok && d.ok && ar.est === 'cancelado' && ar.cat === 'lesion' && I.est === 'cancelado' && I.sets.length === 1 && !ev(A, 'pgBloqueaLibre()'), d: [a.err, b.err, c.err].join(', ') }; });

// 22 · migración
prueba('Migración sin pérdida: el historial anterior queda idéntico; el programa solo añade sus registros (uno por grupo, con prog) y normSes los conserva', () => {
  const viejas = [1, 2, 3].map(i => ({ id: 'v' + i, start: new Date(T(0, 18) - i * 2 * D).toISOString(), g: 'biceps', grupo: 'Bíceps', completa: true, series: 2, efectivas: 2, meta: 6,
    sets: [{ ex: 'Predicador', ej: 'Curl predicador', k: 'act.', reps: '12', rir: '1', kg: 20, P: .5, rest: 90 }, { ex: 'Predicador', ej: 'Curl predicador', k: 'myo', reps: '5', rir: '1', kg: 20, P: .6, rest: 20 }] }));
  const A = activo({ hist: viejas }); const antes = J(ev(A, 'hist.filter(h=>!h.prog)')); sesion(A, 'd01');
  const B = recarga(A), despues = J(ev(B, 'hist.filter(h=>!h.prog)')), prog = ev(B, 'hist.filter(h=>h.prog)');
  return { ok: antes === despues && ev(B, 'hist.length') === 5 && prog.length === 2 && prog.every(h => h.prog.s === 'd01' && h.prog.e === 'completado') && J(prog.map(h => h.g).sort()) === J(['biceps', 'espalda']),
    d: `${ev(B, 'hist.length')} sesiones (3 antiguas idénticas + ${prog.length} del programa)` }; });
prueba('…el volumen semanal, las medallas y la auditoría de siempre siguen funcionando y cuentan las series del programa', () => {
  const A = activo(); sesion(A, 'd01', { rir: '1' }); const v = ev(A, 'volSemana(0)'), dor = ev(A, `volSemana(0).zona('dorsal')`), bi = ev(A, `volSemana(0).grupo('biceps')`);
  const med = ev(A, 'Object.keys(medallasGanadas()).length'); let aud = ''; try { aud = ev(A, 'typeof renderAuditoria==="function"&&(renderAuditoria(),"ok")'); } catch (e) { aud = e.message; }
  return { ok: dor > 0 && bi > 0 && med >= 1 && aud === 'ok', d: `dorsal ${dor} · bíceps ${bi} · medallas ${med}` }; });
prueba('…copia de seguridad: lleva el programa; restaurar una copia NO sustituye el programa de este teléfono (no sirve para borrar incumplimientos)', () => {
  const A = activo(); sesion(A, 'd01'); const copia = J(ev(A, 'pgCopia()'));
  const B = activo(); A.ir(T(2, 9)); const antes = ev(B, 'PGS.act.id'); ev(B, `pgFusiona(${copia})`); const tras = ev(B, 'PGS.act.id');
  const C = app({ ahora: T(0, 10) }); const r = ev(C, `pgFusiona(${copia})`);
  return { ok: antes === tras && ev(C, 'PGS.act') && r.n >= 1 && ev(C, `pgInts(pgA(),'d01').length`) === 1, d: `teléfono con programa: se mantiene ${tras === antes}` }; });

// 23 · seguridad y validaciones
prueba('Validación de lo guardado: un programa manipulado (reps absurdas, ejercicios inexistentes, __proto__, fechas rotas) se normaliza o se descarta', () => {
  const malo = { act: { id: 'pgx', ini: INI, creado: new Date(T(0, 10)).toISOString() }, marca: 'mucho', ses: { __proto__x: 1, d01: { int: [{ id: 'pgx-d01-1', ini: new Date(T(1, 9)).toISOString(), est: 'completado', sem: 1,
    plan: [{ e: 'jalon_medio', n: 2 }, { e: 'no_existe', n: 3 }], sets: [{ id: 'a', e: 0, s: 0, reps: 1e9, t1: new Date(T(1, 9)).toISOString() }, { id: 'b', e: 0, s: 1, reps: 10, kg: -5, t1: new Date(T(1, 9)).toISOString(), plaus: 'inventada' }, { id: 'c', e: 0, s: 1, reps: 11, t1: new Date(T(1, 9)).toISOString() }] }] }, d99: {} }, cur: { sid: 'd03', fase: 'serie' } };
  const A = app({ ahora: T(1, 12), ls: { 'reloj-anomalo-programa': malo } }), P = PGS(A), I = P.ses.d01.int[0];
  return { ok: P.marca >= 0 && !P.ses.d99 && I.plan.length === 1 && I.sets.length === 1 && I.sets[0].id === 'b' && I.sets[0].kg === null && I.sets[0].plaus === 'desconocida' && P.cur === null, d: `${I.sets.length} serie válida` }; });
prueba('…las validaciones de siempre siguen: normSes descarta sesiones sin id ni fecha; plausDe y efectiva sin cambios; importar no crea registros del programa', () => {
  const A = activo(); const s = ev(A, `normSes({start:'x'})`), p = [ev(A, 'plausDe(3,10)'), ev(A, 'plausDe(10,10)'), ev(A, 'plausDe(30,10)')], e = ev(A, `efectiva({k:'act.',reps:'10',rir:'1',plaus:'imposible'})`);
  const imp = ev(A, `sesValida({id:'z',start:new Date().toISOString(),g:'espalda',sets:[],prog:{p:'pg1',s:'d01',i:'pg1-d01-1',e:'completado'}},{mal:0})`), est = ev(A, `pgEstadoSes(pgA(),'d01',pgDiaK(pgAhora()))`);
  return { ok: s === null && J(p) === J(['imposible', 'improbable', 'plausible']) && e === 0 && est === 'hoy', d: `importada: ${imp ? 'sesión válida en el historial' : 'rechazada'}, el programa sigue «${est}»` }; });
prueba('…mapa muscular: «Jalón unilateral» es dorsal (antes caía en deltoide lateral) y las aperturas de abajo hacia arriba van al pecho superior; las laterales siguen igual', () => {
  const A = app(); const m = n => J(ev(A, `musculos('${n}','espalda')`));
  return { ok: m('Jalón unilateral') === J({ dorsal: 1, biceps: .5, trap_inf: .25 }) && J(ev(A, `musculos('Aperturas de polea de abajo hacia arriba','pecho')`)) === J({ pecho_sup: 1, pecho_med: .5 })
    && J(ev(A, `musculos('Elevaciones laterales','hombros')`)) === J({ del_lat: 1 }) && J(ev(A, `musculos('Elevaciones laterales en polea','hombros')`)) === J({ del_lat: 1 }) && J(ev(A, `musculos('Pec deck inverso','hombros')`)) === J({ del_post: 1, trap_med: .5 }) }; });

// 24 · accesibilidad de la salida por seguridad
prueba('Salida por seguridad accesible en TODAS las fases de la pantalla de entrenamiento (botón con nombre accesible) y en el diálogo de abandono', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); const vistas = [];
  const mira = () => vistas.push(/<button type="button" class="pgseg" data-pg="seg" aria-label="Salida por seguridad[^"]*">⚠ Salida por seguridad<\/button>/.test(ev(A, 'pgEntHTML(pgAhora())')));
  mira(); A.mas(2); ev(A, 'pgEmpezarSerie()'); mira(); A.mas(40); ev(A, 'pgTerminarSerie()'); mira(); ev(A, `pgRegistrar({reps:10,kg:40,rir:'2'})`); mira(); ev(A, 'pgPausa()'); mira();
  ev(A, `pgUI.dlg='abandonar'`); const ab = ev(A, 'pgDlgHTML(pgAhora())')[1]; ev(A, `pgUI.dlg='seg'`); const sg = ev(A, 'pgDlgHTML(pgAhora())')[1];
  const motivos = (sg.match(/data-pg="segOk"/g) || []).length;
  return { ok: vistas.every(Boolean) && /data-pg="seg"/.test(ab) && motivos === 5 && !/Mantén pulsado|Escribe/.test(sg), d: `${vistas.filter(Boolean).length}/5 fases · ${motivos} motivos, sin espera ni frase` }; });

// interfaz y textos
prueba('Pantalla del programa: antes de activar se ven las 24 prescripciones y el calendario; activo, el bloqueo con sus fechas y el mensaje exacto', () => {
  const A = app({ ahora: T(0, 10) }); const h0 = ev(A, 'pgPantallaHTML(pgAhora())'); ev(A, `pgActivar('${INI}')`); A.ir(T(1, 9)); const h1 = ev(A, 'pgPantallaHTML(pgAhora())');
  return { ok: (h0.match(/<details class="pgdd"><summary>Día /g) || []).length === 24 && /Activar compromiso de 28 días/.test(h0) && /lun,? 2 nov\.? a las 0:00/.test(h0) && /dom,? 29 nov\.? a las 23:59/.test(h0)
    && /Compromiso activo/.test(h1) && /Tu compromiso de 28 días continúa/.test(h1) && (h1.match(/class="pgdia/g) || []).length === 28 }; });
prueba('Botones separados: el principal ocupa todo el ancho y «Omitir», «Pausa», «Finalizar» y «Abandonar» van en bloques aparte (no se registra una serie por accidente)', () => {
  const A = activo(); ev(A, `pgEntrar('d01')`); serie(A); const h = ev(A, 'pgEntHTML(pgAhora())'); const i = h.indexOf('data-pg="empezar"'), j = h.indexOf('class="pgsec"'), k = h.indexOf('class="pgfin"');
  return { ok: i > 0 && j > i && k > j && /class="pgmain"/.test(h) && ev(A, 'PG_REBOTE') >= 800 }; });
prueba('Las pruebas de rendimiento no se contaminan: con el programa cargado, el texto nunca afirma hipertrofia ni sobreentrenamiento', () => {
  const A = activo(); sesion(A, 'd01'); A.ir(T(29, 1)); ev(A, 'pgRevisaFin()'); const h = ev(A, `pgInformeHTML(pgInforme(PGS.arch[0],'terminado',PGS.arch[0].cerr))`) + ev(A, 'pgPantallaHTML(pgAhora())');
  return { ok: !/sobreentrenamiento|ganaste músculo|creciste|hipertrofia confirmada/i.test(h) }; });

// interfaz: los manejadores REALES de toques (escuchadores de document), sin llamar a pg* directamente
prueba('Interfaz de punta a punta con toques: activar (con la casilla), entrar al tocar el día, empezar, terminar, anotar, registrar (doble toque = 1 serie), salida por seguridad', () => {
  const A = app({ ahora: T(0, 10) }), err = [], toca = (d, x) => err.push(...A.dispara('click', d, x)), escribe = (k, v, x = {}) => err.push(...A.dispara('input', { pgin: k }, { value: v, ...x }));
  ev(A, `tab='programa'`); toca({ pg: 'activar' }); const sinCasilla = !!ev(A, 'PGS.act');
  escribe('conf', null, { type: 'checkbox', checked: true }); toca({ pg: 'activar' }); const act = ev(A, 'PGS.act&&PGS.act.ini');
  A.ir(T(1, 9)); toca({ pg: 'entrar', sid: 'd01' }); const t1 = ev(A, 'tab'), c1 = !!PGS(A).cur;
  A.mas(2); toca({ pg: 'empezar' }); A.mas(40); toca({ pg: 'terminar' }); escribe('reps', '11'); escribe('kg', '45'); toca({ pg: 'rir', r: '2' });
  toca({ pg: 'registrar' }); toca({ pg: 'registrar' }); const sets = ev(A, 'pgIntCur().sets');
  toca({ pg: 'seg' }); const dlg = ev(A, 'pgUI.dlg'); toca({ pg: 'segOk', cat: 'dolor' }); const I = ev(A, `pgInts(pgA(),'d01')[0]`);
  return { ok: !sinCasilla && act === INI && t1 === 'pgent' && c1 && sets.length === 1 && sets[0].reps === 11 && sets[0].kg === 45 && sets[0].rir === '2' && dlg === 'seg' && I.est === 'seguridad' && ev(A, 'tab') === 'programa' && !err.length,
    d: `${sets.length} serie (${sets[0] && sets[0].reps}×${sets[0] && sets[0].kg}, RIR ${sets[0] && sets[0].rir}) · ${I.est}${err.length ? ' · errores: ' + err.join(' | ') : ''}` }; });
prueba('Interfaz: el control de abandono se sostiene con el dedo (pointerdown) y soltarlo (pointerup) borra la cuenta; el teclado (Espacio) también', () => {
  const A = activo(), err = []; ev(A, `pgEntrar('d01')`); A.mas(2);
  err.push(...A.dispara('click', { pg: 'abandonar' })); const dlg = ev(A, 'pgUI.dlg');
  err.push(...A.dispara('pointerdown', { hold: '1' })); const h1 = ev(A, 'PGS.cur.hold'); err.push(...A.dispara('pointerup', {})); const h2 = ev(A, 'PGS.cur.hold');
  err.push(...A.dispara('keydown', { hold: '1' }, { key: ' ' })); const h3 = ev(A, 'PGS.cur.hold'); err.push(...A.dispara('keyup', { hold: '1' }, { key: ' ' })); const h4 = ev(A, 'PGS.cur.hold');
  return { ok: dlg === 'abandonar' && h1 === A.t && h2 === undefined && h3 === A.t && h4 === undefined && !err.length, d: err.join(' | ') }; });
prueba('Interfaz: con el programa activo, tocar el reloj libre no empieza nada y deja el mensaje del compromiso', () => {
  const A = activo(); ev(A, `$('pad').onclick()`); return { ok: ev(A, 'S.st') === 'idle' && /compromiso de 28 días continúa/.test(ev(A, 'pgUI.msg')) }; });

console.log(out.join('\n'));
console.log(`\n${ok} de ${n} pruebas pasan`);
process.exit(ok === n ? 0 : 1);
