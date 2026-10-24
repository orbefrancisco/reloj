// v35 · Pruebas del CIERRE DE DÉFICITS (cierre.js) con semanas sintéticas de volumen conocido por músculo. Resultado en <pre id="resultado">.
'use strict';
(() => {
  const out = []; let ok = 0, n = 0;
  const prueba = (nombre, fn) => { n++; let r; try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    if (r === true) r = { ok: true }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  // un ejercicio aislado por zona (lo que aporta cada uno sale de musculos(), el mismo que usa el mapa)
  const ISO = { biceps: ['Curl predicador', 'biceps'], antebrazo: ['Curl de muñeca', 'biceps'], triceps: ['Pushdown con cuerda', 'triceps'], pecho_sup: ['Press inclinado con mancuernas', 'pecho'],
    pecho_med: ['Aperturas en polea', 'pecho'], abdomen: ['Crunch en polea', 'abdominales'], cuads: ['Extensión de cuádriceps', 'piernas'], pantorrillas: ['Elevación de talones', 'piernas'],
    del_ant: ['Elevaciones frontales', 'hombros'], del_lat: ['Elevaciones laterales', 'hombros'], del_post: ['Pájaros en polea', 'hombros'], trap_sup: ['Encogimientos', 'espalda'],
    trap_med: ['Remo con mancuerna', 'espalda'], trap_inf: ['Jalón al pecho', 'espalda'], dorsal: ['Jalón al pecho', 'espalda'], lumbar: ['Hiperextensiones', 'espalda'],
    gluteos: ['Abductores en máquina', 'piernas'], isquios: ['Curl femoral', 'piernas'] };
  const L = lunes(Date.now()), cuando = Math.max(L + 36e5, Date.now() - 6e4);
  let nid = 0;
  const serie = (ej, k = 'act.') => ({ ex: 's', ej, k, reps: '10', rir: '1', kg: null, P: .4, rest: 60 });
  const sesion = (g, sets, t = cuando, extra = {}) => ({ id: 'ci-' + (++nid), start: new Date(t).toISOString(), g, grupo: CAT[g].n, sets, series: sets.length, completa: true, meta: 6, ...extra });
  // semana cuyo VOLUMEN REAL (con las indirectas que unos ejercicios suman a otros músculos) es el mínimo de cada zona, o lo pedido
  // en z para algunas: se parte del mínimo en directas y se quitan series directas de las zonas pedidas hasta no pasar su objetivo
  // (si las indirectas de otros ejercicios ya lo superan, se queda en eso: las pruebas leen el déficit real calculado)
  function semana(z = {}) { const cnt = {}; for (const m of Object.keys(MUS)) cnt[m] = z[m] != null ? Math.max(rangoZona(m)[0], z[m]) : rangoZona(m)[0];
    const arma = () => { const ses = {}; for (const m of Object.keys(MUS)) { if (!cnt[m]) continue; const [ej, g] = ISO[m]; (ses[g] = ses[g] || []).push(...Array.from({ length: cnt[m] }, () => serie(ej))); }
      return Object.entries(ses).map(([g, s]) => sesion(g, s)); };
    const h0 = hist; try { for (let it = 0; it < 80; it++) { hist = arma(); const V = volumen(L, Date.now() + 1); let cambia = false;
        for (const [m, obj] of Object.entries(z)) if (V.zona(m) > obj + 1e-9 && cnt[m] > 0) { cnt[m]--; cambia = true; }
        if (!cambia) break; } return arma(); } finally { hist = h0; } }
  const conSemana = (H, fn) => { const h0 = hist, c0 = ci, on0 = cierreOn, S0 = S, g0 = grupo, rp0 = rutPos, LS = localStorage.getItem(KEY), LC = localStorage.getItem(CIKEY);
    try { hist = H; ci = ciNorm({}); cierreOn = false; ciMemo.k = ''; anCompMemo = { k: '', v: null }; return fn(); }
    finally { hist = h0; ci = c0; cierreOn = on0; S = S0; grupo = g0; rutPos = rp0; ciMemo.k = ''; ciPrev = null; if (LS == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, LS); if (LC == null) localStorage.removeItem(CIKEY); else localStorage.setItem(CIKEY, LC); } };
  const COMP = { modo: 'completo', min: 120 };   // los casos de lógica, sin la regla de 48 h (las series sintéticas son de hoy)
  const suma = (res, m) => (res.proy[m] || 0) - res.V.zona(m);

  prueba('1. Todos los músculos en objetivo: no hace falta cierre', () => conSemana(semana(), () => { const r = cierreCalc(COMP);
    return { ok: !!r.vacio && !r.items.length, d: Object.keys(r.def).join(', ') || 'sin déficits' }; }));
  prueba('2. Un solo déficit (deltoide posterior −3): un ejercicio que lo trabaja directo, cubierto al 100 %', () => conSemana(semana({ del_post: rangoZona('del_post')[0] - 3 }), () => {
    const r = cierreCalc(COMP), i = r.items;
    return { ok: i.length === 1 && (i[0].c.del_post || 0) >= 1 && r.cubierto >= .999 && !r.pend.length && r.total <= 4, d: i.map(x => `${x.n} ×${x.series}`).join(', ') + ` · ${Math.round(r.cubierto * 100)} %` }; }));
  prueba('3. Varios déficits (bíceps, deltoide posterior, isquios): todos cubiertos con pocos ejercicios', () => conSemana(semana({ biceps: rangoZona('biceps')[0] - 2, del_post: rangoZona('del_post')[0] - 2, isquios: rangoZona('isquios')[0] - 3 }), () => {
    const r = cierreCalc(COMP);
    return { ok: r.cubierto >= .999 && !r.pend.length && r.items.length <= 4, d: r.items.map(x => `${x.n} ×${x.series}`).join(', ') + ` · ${r.total} series` }; }));
  prueba('4. Un ejercicio cubre varios déficits a la vez (trapecio medio, deltoide posterior y bíceps)', () => conSemana(semana({ trap_med: rangoZona('trap_med')[0] - 3, del_post: rangoZona('del_post')[0] - 2, biceps: rangoZona('biceps')[0] - 2 }), () => {
    const r = cierreCalc(COMP), multi = r.items.filter(i => i.cub.length >= 2);
    return { ok: multi.length >= 1 && r.cubierto >= .95, d: r.items.map(x => `${x.n} ×${x.series} (${x.por})`).join(' · ') }; }));
  prueba('5. Un músculo ya muy por encima de su máximo (deltoide anterior): no se le añade trabajo directo', () => conSemana(semana({ del_ant: 20, del_lat: rangoZona('del_lat')[0] - 4 }), () => {
    const r = cierreCalc(COMP), directo = r.items.filter(i => (i.c.del_ant || 0) >= 1);
    return { ok: !directo.length && suma(r, 'del_ant') <= .5 && r.cubierto >= .999, d: r.items.map(x => `${x.n} ×${x.series}`).join(', ') + ` · deltoide anterior +${ef1(suma(r, 'del_ant'))}` }; }));
  prueba('6. Piernas altas en general pero isquios rezagados: aislado de isquios, sin cargar más cuádriceps', () => conSemana(semana({ cuads: 25, gluteos: 14, isquios: 2 }), () => {
    const r = cierreCalc(COMP);
    return { ok: suma(r, 'cuads') === 0 && suma(r, 'isquios') >= rangoZona('isquios')[0] - 2 - .01 && suma(r, 'gluteos') <= .75, d: r.items.map(x => `${x.n} ×${x.series}`).join(', ') + ` · cuádriceps +${ef1(suma(r, 'cuads'))} · glúteos +${ef1(suma(r, 'gluteos'))}` }; }));
  prueba('7. Se activa un viernes para el domingo y se sigue entrenando el sábado: lo planificado no cuenta y el plan avisa que quedó desactualizado', () => conSemana(semana({ del_post: 0, isquios: 0 }), () => {
    const m = [], antes = ciVol().zona('isquios'), r = cierreCalc(COMP);
    ci.plan = { dia: diaK(Date.now() + 2 * 864e5), semana: diaK(L), modo: 'completo', creado: new Date().toISOString(), firma: ciFirma(), estado: 'listo', def: r.def, bloques: r.bloques };
    if (ciVol().zona('isquios') !== antes) m.push('el plan contó como hecho');
    hist = hist.concat([sesion('piernas', Array.from({ length: 4 }, () => serie('Curl femoral')))]);   // «el sábado» entrena isquios
    if (ci.plan.firma === ciFirma()) m.push('no detecta que la semana cambió');
    ci.plan.dia = diaK(Date.now()); cierreEmpezar(false); if (cierreOn) m.push('empezó un plan desactualizado sin avisar');
    const r2 = cierreCalc(COMP); if (!(r2.def.isquios < r.def.isquios)) m.push('al reoptimizar no baja el déficit de isquios');
    return { ok: !m.length, d: m.join('; ') || `isquios: déficit ${ef1(r.def.isquios)} → ${ef1(r2.def.isquios)} tras el sábado` }; }));
  prueba('8. Abandona a mitad: lo hecho cuenta, lo no hecho no; el plan queda «a medias» y se puede reoptimizar', () => conSemana(semana({ del_post: 0, isquios: 0 }), () => {
    const m = [], r = cierreCalc(COMP); ci.plan = { dia: diaK(Date.now()), semana: diaK(L), modo: 'completo', creado: new Date(Date.now() - 1000).toISOString(), firma: ciFirma(), estado: 'listo', def: r.def, bloques: r.bloques };
    CFG.cal = false; cierreEmpezar(false); if (!cierreOn || grupo !== r.bloques[0].g) m.push('no empezó en el primer bloque');
    S = fresh(); iniciarSesion(); if (!S.planE || S.planE[0].n !== r.bloques[0].e[0].n) m.push('el reloj no usa el ejercicio del plan');
    const c0 = ciRestante().cub; S.st = 'report'; S.workDur = 30; S.hechas = 10; aplicar({ R: 10, rir: 1, dur: 30 });
    const c1 = ciRestante().cub; if (!(c1 > c0)) m.push(`la cobertura real no subió tras la serie (${c0} → ${c1})`);
    nuevaConf = 0; $('nueva').onclick(); $('nueva').onclick();
    if (cierreOn) m.push('sigue en modo cierre'); if (ci.plan.estado !== 'parcial') m.push('estado ' + ci.plan.estado);
    const h = hist.find(x => x.cierre); if (!h || h.sets.length < 1) m.push('la serie hecha no se guardó como parte del cierre');
    if (!(ciRestante().cub < 1)) m.push('marca como cubierto lo que no se hizo');
    return { ok: !m.length, d: m.join('; ') || `cubierto ${Math.round(c0 * 100)} % → ${Math.round(c1 * 100)} % con una serie; quedan ${Object.keys(ciRestante().quedan).length} músculos` }; }));
  prueba('9. Volumen pendiente imposible en un día (semana vacía): topes respetados y pendientes con motivo; nunca se pasa en silencio', () => conSemana([], () => {
    const m = [], rc = cierreCalc({ modo: 'completo', min: 300 }), rr = cierreCalc({ modo: 'recuperable', min: 60 });
    if (rc.total > CI_TOPES.completo.total) m.push('completo pasa el tope total');
    if (rr.total > CI_TOPES.recuperable.total) m.push('recuperable pasa el tope total');
    if (!rc.pend.length || !rc.pend.every(p => p.motivo) || !rc.aviso.length) m.push('completo no explica lo que no cabe');
    if (!rr.pend.length || rr.cubierto >= 1) m.push('recuperable dice cubrirlo todo');
    if (rr.min > 60 + 3) m.push(`recuperable se pasa del tiempo (${rr.min} min)`);
    for (const r of [rc, rr]) { const T = CI_TOPES[r.cfg.modo]; for (const z of Object.keys(MUS)) if ((r.dir[z] || 0) + (r.ind[z] || 0) > T.zona + 1.01) m.push(`${r.cfg.modo}: ${z} ${ef1((r.dir[z] || 0) + (r.ind[z] || 0))} > ${T.zona}`); }
    return { ok: !m.length, d: m.join('; ') || `completo: ${rc.total} series, ${Math.round(rc.cubierto * 100)} %, ${rc.pend.length} pendientes · recuperable: ${rr.total} series, ${rr.min} min, ${Math.round(rr.cubierto * 100)} %` }; }));
  prueba('10. Modificar el plan: quitar, cambiar series y sustituir recalculan lo cubierto; el reloj usa lo editado', () => conSemana(semana({ del_post: 0, isquios: 2, biceps: 3 }), () => {
    const m = [], r = cierreCalc(COMP), c0 = r.cubierto, t0 = r.total;
    const quitado = r.items[0]; r.items = r.items.slice(1); ciReevalua(r); if (!(r.cubierto < c0) || !r.pend.length) m.push('quitar no reduce lo cubierto ni lo marca pendiente');
    r.items[0].series += 1; ciReevalua(r); if (r.total !== t0 - quitado.series + 1) m.push('cambiar series no cuadra');
    const alt = ciCandidatos(r.cfg).find(x => x.n !== r.items[0].n && Object.entries(x.c).some(([z, f]) => f >= 1 && (r.items[0].c[z] || 0) >= 1));
    if (alt) { Object.assign(r.items[0], { n: alt.n, g: alt.g, c: alt.c, comp: alt.comp }); ciReevalua(r); if (!r.bloques.some(b => b.e.some(e => e.n === alt.n))) m.push('la sustitución no llega al plan'); }
    ci.plan = { dia: diaK(Date.now()), semana: diaK(L), modo: 'completo', creado: new Date().toISOString(), firma: ciFirma(), estado: 'listo', def: r.def, bloques: r.bloques };
    cierreOn = true; rutPos = 0; grupo = r.bloques[0].g; S = fresh(); iniciarSesion();
    const esperado = r.bloques[0].e.reduce((a, e) => a + e.series, 0); if (S.meta !== esperado) m.push(`meta del bloque ${S.meta} ≠ ${esperado}`);
    return { ok: !m.length, d: m.join('; ') || `cubierto ${Math.round(c0 * 100)} % → ${Math.round(r.cubierto * 100)} % tras editar · ${alt ? 'sustituido por ' + alt.n : ''}` }; }));
  prueba('Recuperable respeta la recuperación: un músculo trabajado directo hoy no recibe series directas', () => conSemana(semana({ del_post: 4 }), () => {   // 1 directa hoy + 3 indirectas del remo
    const r = cierreCalc({ modo: 'recuperable', min: 60 }), dir = r.items.filter(i => (i.c.del_post || 0) >= 1);
    const p = r.pend.find(x => x.m === 'del_post');
    return { ok: !dir.length && !!p && /recuperación/.test(p.motivo), d: p ? p.motivo : 'sin pendiente' }; }));
  prueba('Vista previa y Progreso: «Completar déficits» junto al mapa, día seleccionable, previa con todo lo pedido', () => conSemana(semana({ del_post: 0, isquios: 1 }), () => {
    tab = 'progreso'; renderProg(); const m = [], el = $('pCierre');
    if (!el || el.previousElementSibling !== $('pMapa')) m.push('no está junto al mapa');
    el.querySelector('[data-ci="abrir"]').click(); if (!el.querySelectorAll('[data-cidia]').length) m.push('sin selector de día');
    el.querySelector('[data-ci="calc"]').click(); const t = el.textContent;
    for (const [k, re] of [['rezagados', /Músculos rezagados/], ['ejercicios', /Sesión propuesta/], ['series', /series efectivas/], ['carga', /carga:/], ['RIR', /RIR/], ['tiempo', /min/], ['directas', /Directas e indirectas/], ['porcentaje', /% del déficit/], ['mapa', /Mapa después/]])
      if (!re.test(t)) m.push('falta ' + k);
    if (!el.querySelector('svg.fig')) m.push('sin mapa proyectado');
    el.querySelector('[data-ci="guardar"]').click(); if (!ci.plan) m.push('no se guardó el plan');
    tab = 'reloj'; S = fresh(); render(); if ($('cierreR').hidden || !/Empezar/.test($('cierreR').textContent)) m.push('el reloj no ofrece empezar el cierre de hoy');
    return { ok: !m.length, d: m.join('; ') }; }));
  prueba('Camino real: guardar el plan desde la vista previa, empezar en el reloj, serie principal y mini-serie con números válidos', () => conSemana(semana({ isquios: 1, cuads: 4 }), () => {
    // (modo completo: en recuperable, la regla de 48 h bloquea lo entrenado «hoy»)
    ciUI.abierto = false; ciPrev = null; ci.cfg.modo = 'completo'; tab = 'progreso'; renderProg(); const el = $('pCierre'), m = []; el.querySelector('[data-ci="abrir"]').click(); el.querySelector('[data-ci="calc"]').click();
    const g = el.querySelector('[data-ci="guardar"]'); if (!g) return { ok: false, d: 'sin plan que guardar: ' + el.textContent.slice(0, 200) }; g.click();
    CFG.cal = false; cierreEmpezar(true); S = fresh(); iniciarSesion(); S.st = 'work'; S.t0 = now() - 30; S.st = 'report'; S.workDur = 30; S.hechas = repsSug();
    if (!Number.isFinite(S.hechas)) m.push('reps propuestas: ' + S.hechas);
    aplicar({ R: S.hechas, rir: 1, dur: 30 });
    if (S.phase === 'myo' && !Number.isFinite(S.target)) m.push('objetivo de la mini-serie: ' + S.target);
    if (!(est().d > 0)) m.push('el ejercicio no tiene reps de referencia');
    return { ok: !m.length, d: m.join('; ') || `${est().n}: ${S.hechas} reps propuestas, mini-serie de ${S.target}` }; }));
  prueba('Las series planificadas no cambian el volumen de la semana', () => conSemana(semana({ isquios: 0 }), () => {
    const a = JSON.stringify(Object.keys(MUS).map(z => ciVol().zona(z))); const r = cierreCalc(COMP);
    ci.plan = { dia: diaK(Date.now()), semana: diaK(L), modo: 'completo', creado: new Date().toISOString(), firma: ciFirma(), estado: 'listo', def: r.def, bloques: r.bloques }; ciGuarda();
    return JSON.stringify(Object.keys(MUS).map(z => ciVol().zona(z))) === a && JSON.stringify(Object.keys(MUS).map(z => volSemana(0).zona(z))) === a; }));
  render();
  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
