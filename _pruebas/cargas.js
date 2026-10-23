// v31 · Pruebas de «Mis cargas» (cargas.js) y de la calidad de la carga en el motor y el aprendizaje. Se cargan DESPUÉS de toda la app,
// en un perfil de navegador aparte (datos sintéticos). Cada prueba deja el estado como estaba. Resultado en <pre id="resultado">.
// Con ?fase=1 deja datos guardados y con ?fase=2 (otra carga de la página, mismo perfil) comprueba que siguen ahí: persistencia real.
'use strict';
(() => {
  const out = [], fase = new URLSearchParams(location.search).get('fase');
  let ok = 0, n = 0;
  const prueba = (nombre, fn) => { n++; let r;
    try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    if (r === true) r = { ok: true }; if (r === false) r = { ok: false };
    if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  const fin = () => { out.unshift(`${ok} de ${n} pruebas pasan`); const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p); };
  const LBK = x => Math.round(x * LB * 1e4) / 1e4, casi = (a, b, e = 1e-6) => a != null && b != null && Math.abs(a - b) <= e;
  const PI = 'Press inclinado con mancuernas', KPI = cgKey('pecho', PI, 'h'), KPF = cgKey('pecho', PI, 'f');

  if (fase === '2') {   // ---------- segunda carga de la página: lo guardado en la primera sigue ahí ----------
    prueba('20b. Persistencia después de reiniciar: la referencia, la semana y la serie con su procedencia siguen guardadas', () => {
      const R = cgRef('pecho', PI, 'h'), h = hist.find(x => x.id === 'persist-1'), r = h && h.sets[0];
      const okR = R && R.w === 42.5 && R.u === 'lb' && R.tc === 'mancuerna' && R.r === 9 && R.rir === '2' && R.cn === 'aprox' && R.ok;
      const okS = r && r.kgSrc === 'cal' && r.tc === 'mancuerna' && r.u === 'lb' && casi(r.kg, LBK(42.5)) && r.kgPlan == null;
      return { ok: !!(okR && okS), d: `ref ${JSON.stringify(R)} · serie ${JSON.stringify(r)}` }; });
    fin(); return;
  }

  // ---------- estado: todo se restaura al final ----------
  const LS0 = {}; for (const k of [KEY, CGKEY, MODKEY, MEDKEY, ENKEY]) LS0[k] = localStorage.getItem(k);
  const H0 = hist, cg0 = cg, CFG0 = JSON.parse(JSON.stringify(CFG)), tab0 = tab, g0 = grupo, S0 = S;
  const limpio = (fn, cgIni = {}) => { const h = hist, c = cg, s = S, g = grupo, cfg = JSON.parse(JSON.stringify(CFG));
    try { hist = []; cg = cgNorm(cgIni); cgMemo.k = ''; recMemo = { k: '', v: null }; CFG.cal = false; CFG.uni = 'lb'; SS = null; rutPos = 0; fzaHoy = false; pila = []; return fn(); }
    finally { hist = h; cg = c; cgMemo.k = ''; S = s; grupo = g; Object.assign(CFG, cfg); recMemo = { k: '', v: null }; cgUI.peso = { abierto: false, v: null, otro: false }; } };
  const nueva = (g, x) => { grupo = g; SS = null; rutPos = 0; S = fresh(); iniciarSesion(x); S.st = 'work'; S.t0 = now() - 30; return S; };
  const reporta = (R, rir) => { S.st = 'report'; S.workDur = 30; S.hechas = R; aplicar({ R, rir, dur: 30 }); return S.sets[S.sets.length - 1]; };
  const refPI = (w = 40, extra = {}) => { cgSet(KPI, 'esp', 'lb|mancuerna'); cgSet(KPI, 'w', w); for (const [k, v] of Object.entries(extra)) cgSet(KPI, k, v); return cgRefK(KPI); };
  const sesH = (id, g, t, sets) => ({ id, start: new Date(t).toISOString(), g, grupo: CAT[g].n, sets, series: sets.length, completa: true, meta: 6 });
  const act = (ej, reps, rir, kg, x = {}) => ({ ex: 's', ej, k: 'act.', reps: String(reps), rir: String(rir), kg, P: .5, rest: 0, ...x });
  const myo = (ej, reps, rir, kg, x = {}) => ({ ex: 's', ej, k: 'myo', reps: String(reps), rir: String(rir), kg, P: .6, rest: 20, obj: 5, Cpre: .6, kc: 1, ...x });

  // 1
  prueba('1. Primera semana sin datos: se puede configurar ya, todo «sin configurar», sin pesos inventados', () => limpio(() => {
    const W = cgSem(), s = cgEstadoSem(), m = [];
    if (Object.keys(W.refs).length) m.push('la semana nace con referencias');
    if (s.tot !== 20 || s.conf !== 0 || s.pend !== 20) m.push(`estado ${JSON.stringify(s)}`);
    if (!/Configurar las cargas de esta semana/.test(cgBannerHTML())) m.push('sin aviso de configurar');
    renderCargas(); if (Object.keys(cgSem().refs).length) m.push('pintar la encuesta creó referencias');
    if (document.querySelectorAll('#vCargasC .cgrow').length !== 20) m.push('la lista no muestra los 20 ejercicios');
    nueva('pecho'); if (S.cgK || S.kg != null) m.push(`carga inventada al entrenar: ${S.kg}`);
    return { ok: !m.length, d: m.join('; ') || `${s.tot} ejercicios activos, 0 configurados` }; }));
  // 2
  prueba('2. Configuración masiva de todos los ejercicios activos (desplegables de la lista, guardado al momento)', () => limpio(() => {
    cgUI.vista = 'lista'; cgUI.q = ''; renderCargas();
    const filas = [...document.querySelectorAll('#vCargasC .cgrow')];
    filas.forEach(row => { const s = row.querySelector('select[data-cgf="w"]'); if (!s) return; const o = [...s.options].find(o => o.value && o.value !== '__otro'); s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); });
    const s1 = cgEstadoSem(), guardado = cgNorm(JSON.parse(localStorage.getItem(CGKEY) || '{}')), W = guardado.sem[cgSemK()];
    const corp = cgActivos().filter(x => cgBase(x).tc === 'corporal').map(x => x.key);
    corp.forEach(k => cgSet(k, 'esp', '-|corporal'));
    const s2 = cgEstadoSem();
    return { ok: s2.conf === s2.tot && s2.tot === 20 && W && Object.keys(W.refs).length >= 20 - corp.length && /20 de 20/.test(cgCabHTML()),
      d: `con la lista: ${s1.conf} de ${s1.tot}; + ${corp.length} de peso corporal: ${s2.conf} de ${s2.tot}` }; }));
  // 3
  prueba('3. Fuerza e hipertrofia separadas: misma máquina, carga y rango propios; cada sesión usa la suya', () => limpio(() => {
    refPI(40); cgSet(KPF, 'esp', 'lb|mancuerna'); cgSet(KPF, 'w', 60); cgSet(KPF, 'ro', '3–5');
    const h = cgRefK(KPI), f = cgRefK(KPF), m = [];
    if (h.w !== 40 || f.w !== 60) m.push('referencias mezcladas');
    nueva('pecho'); if (!casi(S.kg, LBK(40))) m.push(`hipertrofia usa ${S.kg}`);
    const F = planFuerza('pecho'); if (F.e[0].n !== PI) m.push('el plan de fuerza eligió otro ejercicio: ' + F.e[0].n);
    if (F.e[0].r !== '3–5') m.push('el rango de fuerza no es el de la referencia: ' + F.e[0].r);
    S = fresh(); grupo = 'pecho'; iniciarSesion({ fza: F }); if (!casi(S.kg, LBK(60)) || S.cgK !== KPF) m.push(`fuerza usa ${S.kg} (${S.cgK})`);
    S.st = 'work'; const r = reporta(4, 2); if (r.m !== 'f' || !casi(r.kg, LBK(60))) m.push('la serie de fuerza no queda marcada con su carga');
    return { ok: !m.length, d: m.join('; ') }; }));
  // 4
  prueba('4. Peso sugerido asumido por defecto: sin preguntarlo, se registra como «de la configuración»', () => limpio(() => {
    refPI(40); nueva('pecho'); tab = 'reloj'; S.st = 'report'; render();
    const pregunta = !$('kgFila').hidden, enReloj = $('padCarga').textContent, panel = 'reloj: ' + enReloj + ' | ' + $('cgPeso').textContent;   // v32: la carga va dentro del reloj
    const r = reporta(10, 1);
    const ok = !pregunta && /carga sugerida/i.test(enReloj) && /40 lb por mancuerna/.test(enReloj) && /Cambiar peso/.test(panel) && r.kgSrc === 'cal' && casi(r.kg, LBK(40)) && r.tc === 'mancuerna' && r.u === 'lb' && r.kgPlan == null;
    return { ok, d: `pide peso: ${pregunta} · panel «${panel.trim().slice(0, 90)}» · serie ${JSON.stringify({ kg: r.kg, kgSrc: r.kgSrc, tc: r.tc })}` }; }));
  // 5
  prueba('5. Cambio de peso en una sola serie: solo esa serie cambia y queda la carga planificada', () => limpio(() => {
    refPI(40); nueva('pecho'); S.st = 'report'; cgUI.peso = { abierto: true, v: 45, otro: false, k: S.id + '|' + S.sec }; cgAplicaPeso('una');
    const r1 = reporta(9, 1), m = [];
    if (!casi(r1.kg, LBK(45)) || r1.kgSrc !== 'mod' || !casi(r1.kgPlan, LBK(40))) m.push('la serie cambiada: ' + JSON.stringify(r1));
    if (!casi(S.kg, LBK(40))) m.push('el resto del ejercicio también cambió');
    if (S.phase === 'myo') { const r2 = reporta(5, 1); if (!casi(r2.kg, LBK(40)) || r2.kgSrc !== 'cal' || !r2.kgCambio) m.push('la siguiente: ' + JSON.stringify(r2)); }
    if (cgRefK(KPI).w !== 40) m.push('la referencia cambió');
    return { ok: !m.length, d: m.join('; ') }; }));
  // 6
  prueba('6. Cambio para el resto del ejercicio de hoy: series siguientes con la nueva carga, referencia intacta, siguiente ejercicio con la suya', () => limpio(() => {
    refPI(40); cgSet(cgKey('pecho', 'Aperturas en polea', 'h'), 'esp', 'lb|total'); cgSet(cgKey('pecho', 'Aperturas en polea', 'h'), 'w', 30);
    nueva('pecho'); S.st = 'report'; cgUI.peso = { abierto: true, v: 45, otro: false, k: S.id + '|' + S.sec }; cgAplicaPeso('resto');
    const r1 = reporta(9, 1), m = [];
    const r2 = S.phase === 'myo' ? reporta(5, 1) : null;
    if (!casi(r1.kg, LBK(45)) || r1.kgSrc !== 'mod') m.push('principal ' + JSON.stringify(r1));
    if (r2 && (!casi(r2.kg, LBK(45)) || r2.kgCambio)) m.push('mini-serie ' + JSON.stringify(r2));
    if (cgRefK(KPI).w !== 40) m.push('la referencia cambió');
    S.sec = 0; siguienteEstacion({}); if (!casi(S.kg, LBK(30)) || S.kgSrc !== 'cal') m.push(`siguiente ejercicio con ${S.kg} (${S.kgSrc})`);
    return { ok: !m.length, d: m.join('; ') }; }));
  // 7
  prueba('7. Actualizar también la referencia de la semana: se guarda, procedencia «modificada», reps y RIR de la carga vieja se vacían', () => limpio(() => {
    refPI(40, { r: 10, rir: '2', cn: 'sabe' }); nueva('pecho'); S.st = 'rest'; cgUI.peso = { abierto: true, v: 45, otro: false, k: S.id + '|' + S.sec }; cgAplicaPeso('semana');
    const R = cgRefK(KPI), G = cgNorm(JSON.parse(localStorage.getItem(CGKEY))).sem[cgSemK()].refs[KPI];
    return { ok: R.w === 45 && R.src === 'modificada' && R.r == null && R.rir == null && G && G.w === 45 && casi(S.kg, LBK(45)) && S.kgSrc === 'mod',
      d: JSON.stringify({ w: R.w, src: R.src, r: R.r, rir: R.rir, guardado: G && G.w }) }; }));
  // 8
  prueba('8. Series con el mismo peso: la mini-serie es una observación VERIFICADA del aprendizaje', () => limpio(() => {
    hist = [sesH('m1', 'pecho', Date.now() - 864e5, [act(PI, 10, 1, LBK(40)), myo(PI, 6, 1, LBK(40))])]; recMemo = { k: '', v: null };
    const O = obsRec(); return { ok: O.length === 1 && O[0].q === 'v' && O.excl.cambio === 0, d: JSON.stringify(O.map(o => o.q)) }; }));
  // 9
  prueba('9. Series con pesos distintos (40 lb × 8 · RIR 2 → 50 lb × 3 · RIR 1): no se toma por fatiga', () => limpio(() => {
    hist = [sesH('m2', 'pecho', Date.now() - 864e5, [act(PI, 8, 2, LBK(40)), myo(PI, 3, 1, LBK(50))])];
    const O = obsRec(), m = [];
    if (O.length || O.excl.cambio !== 1) m.push('el aprendizaje la usó: ' + JSON.stringify(O));
    const rr = ratioCarga(LBK(40), LBK(50), 10); if (!(rr < .5 && rr > .05)) m.push('factor de carga ' + rr);
    // en vivo: la mini-serie con 50 lb no dispara el cambio a la variante por «caída de reps» (8 → 3 se explica por la carga)
    refPI(40); nueva('pecho'); const a = reporta(8, 2);
    if (S.phase === 'myo') { const tg = S.target; S.st = 'rest'; cgUI.peso = { abierto: true, v: 50, otro: false, k: S.id + '|' + S.sec }; cgAplicaPeso('una');
      if (!(S.target < tg)) m.push(`objetivo no recalculado: ${tg} → ${S.target}`);
      const r = reporta(3, 1); if (!r.kgCambio) m.push('mini-serie no marcada');
      // la regla «menos de la mitad de reps que la principal → variante» ya no salta por la carga: 3 < ½·8 sí, 3 < ½·8·factor no
      if (3 < .5 * 8 * ratioCarga(LBK(40), LBK(50), 10)) m.push('la caída de 8 a 3 se sigue leyendo como fatiga');
      if (!(r.predF < 10 * .6)) m.push('predicción sin la carga: ' + r.predF); } else m.push('no hubo mini-serie');
    return { ok: !m.length, d: m.join('; ') || `factor ${num2(rr)}` }; }));
  // 10
  prueba('10. Peso desconocido y RIR desconocido: nada se inventa (ni 0 kg ni RIR 2)', () => limpio(() => {
    const m = [];
    cgSet(KPI, 'rir', 'ns'); let R = cgRefK(KPI); if (cgEstado(R) !== 'pend' || R.w != null || R.rir !== 'ns') m.push('sin peso: ' + cgEstado(R));
    cgSet(KPI, 'cn', 'calibrar'); if (cgEstado(cgRefK(KPI)) !== 'calibrar') m.push('no queda «por calibrar»');
    cgSet(KPI, 'w', 40); R = cgRefK(KPI); if (cgEstado(R) !== 'carga') m.push('con peso y RIR «no sé» debería ser solo carga: ' + cgEstado(R));
    if (cgNormRef(KPI, { tc: 'total', w: 0 }).w !== null) m.push('0 en carga total no es desconocido');
    if (!cgTieneCarga(cgNormRef(KPI, { tc: 'corporal' }))) m.push('peso corporal sin carga');
    if (cgNormRef(KPI, { tc: 'extra', w: 0 }).w !== 0) m.push('lastre 0 perdido');
    // en la sesión, una reserva «4+» es una cota: no completa la referencia; una reserva real sí
    nueva('pecho'); reporta(12, 4); if (cgRefK(KPI).rir !== 'ns') m.push('«4+» se guardó como reserva');
    nueva('pecho'); reporta(11, 2); R = cgRefK(KPI); if (R.rir !== '2' || R.r !== 11 || R.obs !== 'sesion') m.push('no se completó con una serie real: ' + JSON.stringify(R));
    // el «−» del reporte ya no convierte «sin anotar» en 0 = peso corporal en un ejercicio con carga externa
    cg = cgNorm({}); cgMemo.k = ''; nueva('pecho'); S.st = 'report'; S.kg = null; $('kgMenos').onclick(); if (S.kg !== null) m.push('«−» puso ' + S.kg);
    return { ok: !m.length, d: m.join('; ') }; }));
  // 11
  prueba('11. Calentamiento con la carga conocida, redondeado a tus mancuernas, fuera del volumen efectivo', () => limpio(() => {
    CFG.cal = true; refPI(40); nueva('pecho'); S.st = 'idle';
    const cal = S.cal || [], lb = cal.map(c => cgDeKg(c.kg, 'lb')), m = [];
    if (lb.join() !== '20,30,35') m.push('aproximaciones ' + lb.join(', '));
    S.st = 'cal'; S.t0 = now() - 20; $('pad').onclick(); S.st = 'cal'; $('pad').onclick(); S.st = 'cal'; $('pad').onclick();
    const filas = S.sets.filter(r => r.k === 'cal.');
    if (filas.length !== 3) m.push(`${filas.length} filas de calentamiento`);
    if (efDe(S.sets) !== 0 || S.ef !== 0) m.push('el calentamiento sumó efectivas');
    hist = [sesH('c1', 'pecho', Date.now(), S.sets.slice())]; if (volSemana(0).grupo('pecho') !== 0) m.push('suma al volumen semanal');
    // segundo ejercicio aislado: sin aproximaciones; compuesto: dos
    S.calHecho = true; S.sets.push(act(PI, 10, 1, LBK(40))); const iso = cgPlanCal(LBK(30), CAT.pecho.e[1], false), comp = cgPlanCal(LBK(100), { n: 'Press banca con barra' }, false);
    if (iso) m.push('aislado posterior con aproximaciones'); if (!comp || comp.length !== 2) m.push('compuesto posterior sin sus 2');
    return { ok: !m.length, d: m.join('; ') || `aproximaciones ${lb.join(', ')} lb` }; }));
  // 12
  prueba('12. Aproximación intensa reclasificada: pasa a contar como serie, con su reserva real', () => limpio(() => {
    CFG.cal = true; refPI(40); nueva('pecho'); S.st = 'cal'; $('pad').onclick();
    const ef0 = S.ef; cgReclasifica(1); const r = S.sets.find(x => x.k === 'apr.');
    const ok = !!r && r.rir === '1' && efectiva(r) > 0 && casi(S.ef, ef0 + efectiva(r)) && !previas('pecho', PI).length && sinCal(S.sets).length === 1;
    return { ok, d: r ? `tipo ${r.k} · RIR ${r.rir} · efectiva ${num2(efectiva(r))}` : 'no reclasificada' }; }));
  // 13
  prueba('13. Rest-pause con carga constante: todas las mini-series con la carga de la principal, comparables', () => limpio(() => {
    refPI(40); nueva('pecho'); reporta(10, 1); let k = 0; while (S.phase === 'myo' && k++ < 4) reporta(Math.max(3, S.target), 1);
    const myos = S.sets.filter(r => r.k === 'myo'), m = [];
    if (!myos.length) m.push('sin mini-series');
    if (myos.some(r => !casi(r.kg, LBK(40)) || r.kgCambio || r.kgSrc !== 'cal')) m.push('alguna con otra carga');
    hist = [sesH('rp', 'pecho', Date.now() - 864e5, S.sets.slice())]; const O = obsRec();
    if (O.length !== myos.length || O.some(o => o.q !== 'v')) m.push(`aprendizaje: ${O.length} de ${myos.length} verificadas`);
    return { ok: !m.length, d: m.join('; ') || `${myos.length} mini-series a 40 lb, todas verificadas` }; }));
  // 14
  prueba('14. Rest-pause con cambio de carga: objetivo recalculado, mini-serie marcada y fuera del aprendizaje', () => limpio(() => {
    refPI(40); nueva('pecho'); reporta(10, 1); const m = [];
    if (S.phase !== 'myo') return { ok: false, d: 'no hubo mini-serie' };
    const t0 = S.target; S.st = 'rest'; cgUI.peso = { abierto: true, v: 30, otro: false, k: S.id + '|' + S.sec }; cgAplicaPeso('resto');
    if (!(S.target > t0)) m.push(`con menos carga el objetivo debería subir: ${t0} → ${S.target}`);
    const r = reporta(S.target, 1); if (!r.kgCambio || !casi(r.kg, LBK(30))) m.push('mini-serie ' + JSON.stringify(r));
    hist = [sesH('rp2', 'pecho', Date.now() - 864e5, S.sets.slice())]; const O = obsRec(); if (O.length || O.excl.cambio < 1) m.push('entró al aprendizaje');
    return { ok: !m.length, d: m.join('; ') || `objetivo ${t0} → recalculado para 30 lb` }; }));
  // 15
  prueba('15. Revisión semanal con datos suficientes: propone subir el salto real (40 → 45 lb), explica por qué y decides tú', () => limpio(() => {
    const L = lunes(Date.now()), Lp = L - 7 * 864e5, kp = diaK(Lp), m = [];
    cg = cgNorm({ sem: { [kp]: { refs: { [KPI]: { u: 'lb', tc: 'mancuerna', eq: 'mancuernas', w: 40, r: 10, rir: '2', cn: 'sabe', src: 'manual', ok: true } } } } });
    hist = [sesH('w1', 'pecho', Lp + 864e5, [act(PI, 12, 2, LBK(40)), myo(PI, 5, 1, LBK(40))]), sesH('w2', 'pecho', Lp + 3 * 864e5, [act(PI, 12, 1, LBK(40))])];
    const W = cgSem(), P = W.prop[KPI], R = W.refs[KPI];
    if (!P || P.acc !== 'subir' || P.w !== 45 || !/12/.test(P.por)) m.push('propuesta ' + JSON.stringify(P));
    if (R.src !== 'heredada' || R.ok || R.w !== 40) m.push('la semana nueva no hereda sin confirmar');
    // con molestia, mantener; al fallo por debajo del rango, bajar
    const conMol = cgRevisa({ ...R, src: 'manual' }, Lp, L), mol = (hist[1].sets[0].mol = 'hombro', cgRevisa(R, Lp, L)); delete hist[1].sets[0].mol;
    if (mol.acc !== 'mantener') m.push('con molestia no mantiene');
    hist = [sesH('w3', 'pecho', Lp + 864e5, [act(PI, 6, 0, LBK(40))])]; const baja = cgRevisa(R, Lp, L); if (baja.acc !== 'bajar' || baja.w !== 35) m.push('bajar ' + JSON.stringify(baja));
    hist = [sesH('w4', 'pecho', Lp + 864e5, [act(PI, 10, 2, LBK(40))])]; if (cgRevisa(R, Lp, L).acc !== 'mantener') m.push('con margen en reps no mantiene');
    cgDecide(KPI, 'ok'); const R2 = cgRefK(KPI); if (R2.w !== 45 || R2.src !== 'sugerida' || !R2.ok || R2.r != null || W.prop[KPI].dec !== 'ok') m.push('aprobar ' + JSON.stringify(R2));
    return { ok: !m.length && conMol.acc === 'subir', d: m.join('; ') || P.por.slice(0, 140) }; }));
  // 16
  prueba('16. Revisión semanal con datos insuficientes: «recalibrar», sin cambiar la carga', () => limpio(() => {
    const L = lunes(Date.now()), Lp = L - 7 * 864e5, kp = diaK(Lp);
    cg = cgNorm({ sem: { [kp]: { refs: { [KPI]: { u: 'lb', tc: 'mancuerna', w: 40, ok: true } } } } });
    hist = [sesH('i1', 'pecho', Lp + 864e5, [act(PI, 12, 2, null)]), sesH('i2', 'pecho', Lp + 2 * 864e5, [act(PI, 12, 2, LBK(35))])];
    const W = cgSem(), P = W.prop[KPI];
    return { ok: !!P && P.acc === 'recal' && P.w == null && W.refs[KPI].w === 40 && /otra carga/.test(P.por) && /sin carga/.test(P.por), d: P && P.por }; }));
  // 17
  prueba('17. Registros históricos incompletos: se marcan y se conservan; sin peso no se comparan entre sesiones', () => limpio(() => {
    const t = Date.now() - 864e5, m = [];
    hist = [sesH('h1', 'pecho', t, [act(PI, 11, 2, null), myo(PI, 6, 0, 0), myo(PI, 6, 0, null)]),
      sesH('h2', 'pecho', t - 864e5, [act(PI, 10, 1, null), myo(PI, 5, 1, LBK(40))])];
    for (let i = 0; i < 5; i++) hist.push(sesH('h3' + i, 'pecho', t - (2 + i) * 864e5, [act(PI, 10 + i % 2, 1, null)]));
    const O = obsRec(); if (O.length !== 2 || O.some(o => o.q !== 'p') || O.excl.mixta !== 1) m.push('aprendizaje ' + JSON.stringify({ q: O.map(o => o.q), ex: O.excl }));
    anCompMemo = { k: '', v: null }; const s = anComparables().find(x => x.ej === PI); const c = s && anClasifica(s.pts);
    if (!s || s.carga !== 'na' || c.estado !== 'insuficiente' || !/no se sabe/.test(c.txt)) m.push('análisis ' + JSON.stringify(c));
    const A = auditarDatos(); if (!A.avisos.some(a => a.c === 'cero-dudoso')) m.push('auditoría sin el 0 dudoso');
    if (hist.length !== 7 || hist[0].sets.length !== 3) m.push('se borró algo');
    return { ok: !m.length, d: m.join('; ') || `${O.length} presuntas, 1 mixta fuera; tendencia «${c.txt}»` }; }));
  // 18
  prueba('18. Aprendizaje sin contaminación por cambios de carga; las presuntas pesan la mitad', () => limpio(() => {
    const base = [], t = Date.now() - 30 * 864e5;
    for (let i = 0; i < 12; i++) base.push(sesH('a' + i, 'pecho', t + i * 864e5, [act(PI, 10, 1, LBK(40)), myo(PI, 6, 1, LBK(40), { Cpre: .6 })]));
    hist = base.slice(); recMemo = { k: '', v: null }; const k1 = kPool(obsRec(), 'pecho').k;
    hist = base.concat([sesH('ax', 'pecho', t + 20 * 864e5, [act(PI, 10, 1, LBK(40)), myo(PI, 1, 0, LBK(60), { Cpre: .9 })])]); const k2 = kPool(obsRec(), 'pecho').k;
    const sinPeso = base.map(h => ({ ...h, sets: h.sets.map(r => ({ ...r, kg: null })) }));
    hist = sinPeso; const k3 = kPool(obsRec(), 'pecho').k;
    const ok = casi(k1, k2, 1e-12) && k1 !== 1 && Math.abs(Math.log(k3)) < Math.abs(Math.log(k1)) - 1e-6;
    return { ok, d: `k verificadas ${num2(k1)} · con una mini-serie de otra carga ${num2(k2)} (igual) · las mismas sin peso, presuntas ${num2(k3)} (más cerca de 1)` }; }));
  // 19
  prueba('19. Conversión kg/lb sin deriva y «por mancuerna» no es el par', () => limpio(() => {
    const m = [];
    for (const w of [2.5, 25, 40, 42.5, 135, 225]) { const k = cgAKg(w, 'lb'); if (cgDeKg(k, 'lb') !== w || aU(k) !== w) m.push(`${w} lb → ${k} kg → ${cgDeKg(k, 'lb')}`); }
    refPI(40); nueva('pecho'); const r = reporta(10, 1);
    if (!casi(r.kg, 18.1437, 1e-4)) m.push('40 lb por mancuerna se guardó como ' + r.kg + ' kg (¿el par?)');
    if (cgTxt(cgRefK(KPI)) !== '40 lb por mancuerna') m.push(cgTxt(cgRefK(KPI)));
    CFG.uni = 'kg'; const K = cgKey('pecho', 'Aperturas en polea', 'h'); cgSet(K, 'esp', 'kg|total'); cgSet(K, 'w', 20); if (cgRefK(K).u !== 'kg' || cgKgRef(cgRefK(K)) !== 20) m.push('ref en kg');
    cgSet(K, 'esp', 'lb|total'); if (cgRefK(K).w !== 20 || !/no se convierte/.test(cgAvisos(K, cgRefK(K)))) m.push('cambio de unidad sin aviso');
    return { ok: !m.length, d: m.join('; ') }; }));
  // 20
  prueba('20. Respaldo y restauración: la copia lleva «Mis cargas» y las series con su procedencia; restaurar en un teléfono vacío lo recupera', () => limpio(() => {
    refPI(40, { r: 10, rir: '2', cn: 'sabe' }); nueva('pecho'); const r = reporta(10, 1); const m = [];
    const ses = JSON.parse(JSON.stringify(hist)), copia = JSON.parse(JSON.stringify({ sesiones: ses, cargas: cgCopia() }));
    const r2 = normSes(copia.sesiones[0]).sets[0]; for (const k of ['kgSrc', 'tc', 'u']) if (r2[k] !== r[k]) m.push('serie pierde ' + k);
    const a = normSet({ ...r, kgPlan: 18, niv: 7, kgCambio: true, m: 'f' }); if (a.kgPlan !== 18 || a.niv !== 7 || !a.kgCambio || a.m !== 'f') m.push('normSet pierde campos v31');
    cg = cgNorm({}); localStorage.removeItem(CGKEY); cgMemo.k = '';
    const f = cgFusiona(copia.cargas); const R = cgRef('pecho', PI, 'h');
    if (!f.n || !R || R.w !== 40 || R.r !== 10) m.push('restaurar ' + JSON.stringify(f));
    const guardado = cgNorm(JSON.parse(localStorage.getItem(CGKEY))); if (!guardado.sem[cgSemK()].refs[KPI]) m.push('no quedó en el teléfono');
    // fusionar no pisa lo que el teléfono ya tiene
    cgSet(KPI, 'w', 45); cgFusiona(copia.cargas); if (cgRefK(KPI).w !== 45) m.push('la copia pisó una referencia existente');
    return { ok: !m.length, d: m.join('; ') }; }));

  // ---------- interfaz en el teléfono (412 px): sin desplazamiento lateral, controles para el dedo ----------
  prueba('21. Encuesta en pantalla de teléfono: sin desbordar a lo ancho y con controles de 40 px o más', () => limpio(() => {
    tab = 'cargas'; render(); const m = [], main = document.querySelector('main'), mw0 = main.style.maxWidth;
    refPI(40); cgSet(KPI, 'r', 10);   // una fila con datos y la otra vacía
    try { for (const w of [412, 360]) { main.style.maxWidth = w + 'px';
      for (const v of ['lista', 'uno']) { cgUI.vista = v; renderCargas(); render();
        const ancho = document.documentElement.scrollWidth, vw = window.innerWidth; if (ancho > vw + 1) m.push(`${w}/${v}: página ${ancho} > ${vw}`);
        const anchos = [...document.querySelectorAll('#vCargasC .cgrow, #vCargasC .cgwiz')].filter(e => e.scrollWidth > e.clientWidth + 1);
        if (anchos.length) m.push(`${w}/${v}: ${anchos.length} tarjetas desbordan`);
        if (main.scrollWidth > main.clientWidth + 1) m.push(`${w}/${v}: el contenido desborda (${main.scrollWidth} > ${main.clientWidth})`);
        const chicos = [...document.querySelectorAll('#vCargasC select, #vCargasC .cgpm, #vCargasC .cgrir button, #vCargasC .cgnav button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40);
        if (chicos.length) m.push(`${w}/${v}: ${chicos.length} controles de menos de 40 px`); } } }
    finally { main.style.maxWidth = mw0; }
    return { ok: !m.length, d: m.join('; ') || 'a 412 y 360 px de ancho' }; }));
  prueba('22. Uno a uno: desplegable de grupo filtra los ejercicios, la búsqueda filtra, «Siguiente» avanza y cada toque se guarda', () => limpio(() => {
    tab = 'cargas'; cgUI.vista = 'uno'; cgUI.fg = ''; cgUI.q = ''; cgUI.sel = ''; renderCargas(); const m = [];
    const g = document.querySelector('#vCargasC select[data-cgf="g"]'); g.value = 'pecho'; g.dispatchEvent(new Event('change', { bubbles: true }));
    const ops = [...document.querySelectorAll('#vCargasC select[data-cgf="ej"] option')].map(o => o.value); if (!ops.length || ops.some(k => !k.startsWith('pecho|'))) m.push('el filtro de grupo: ' + ops.join());
    document.querySelector('#vCargasC [data-cgw="rir"][data-v="2"]').click(); if ((cgRefK(cgUI.sel) || {}).rir !== '2') m.push('RIR no guardado');
    const k0 = cgUI.sel; document.querySelector('#vCargasC [data-cgw="sig"]').click(); if (cgUI.sel === k0) m.push('«Siguiente» no avanza');
    const q = document.querySelector('#vCargasC [data-cgq]'); q.value = 'apert'; q.dispatchEvent(new Event('input', { bubbles: true }));
    const ops2 = [...document.querySelectorAll('#vCargasC select[data-cgf="ej"] option')].map(o => o.textContent); if (ops2.length !== 1 || !/Aperturas/.test(ops2[0])) m.push('búsqueda: ' + ops2.join());
    return { ok: !m.length, d: m.join('; ') }; }));

  // ---------- fase 1 de la prueba de persistencia: deja datos para la segunda carga ----------
  if (fase === '1') {
    cg = cgNorm({}); cgSem(); cgSet(KPI, 'esp', 'lb|mancuerna'); cgSet(KPI, 'w', 42.5); cgSet(KPI, 'r', 9); cgSet(KPI, 'rir', '2'); cgSet(KPI, 'cn', 'aprox');
    const s = { ex: 'Inclinado', ej: PI, k: 'act.', reps: '9', rir: '2', kg: LBK(42.5), P: .4, rest: 0, kgSrc: 'cal', tc: 'mancuerna', u: 'lb' };
    hist = [sesH('persist-1', 'pecho', Date.now() - 36e5, [s])]; escribirHist(); fin(); return;
  }

  // ---------- restaurar ----------
  hist = H0; cg = cg0; cgMemo.k = ''; Object.assign(CFG, CFG0); tab = tab0; grupo = g0; S = S0; recMemo = { k: '', v: null };
  for (const [k, v] of Object.entries(LS0)) { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }
  prueba('Las pruebas dejan los datos guardados como estaban', () => localStorage.getItem(KEY) === LS0[KEY] && localStorage.getItem(CGKEY) === LS0[CGKEY]);
  render(); fin();
})();
