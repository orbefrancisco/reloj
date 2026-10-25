// v36 · Pruebas del TIEMPO DE ENTRENAMIENTO TOTAL (entreno.js). Resultado en <pre id="resultado">.
'use strict';
(() => {
  const out = []; let ok = 0, n = 0;
  const prueba = (nombre, fn) => { n++; let r; try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    if (r === true) r = { ok: true }; if (!r) r = { ok: false }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  const MIN = 6e4, T0 = Date.now() - 8 * 36e5;   // las horas de prueba son del pasado (cerrar nunca pasa de «ahora»)
  const serie = (k = 'act.') => ({ ex: 's', ej: 'Curl', k, reps: '10', rir: '1', kg: 20, P: .4, rest: 60 });
  let nid = 0;
  const ses = (t, sets = [serie(), serie()], g = 'biceps') => ({ id: 'en-' + (++nid), start: new Date(t).toISOString(), g, grupo: CAT[g].n, sets, series: sets.length, completa: true, meta: 4 });
  // aislado: cada prueba parte sin entrenamiento y deja todo como estaba (memoria y almacenamiento)
  const con = fn => () => { const e0 = JSON.parse(JSON.stringify(ent)), h0 = hist, S0 = S, r0 = retomar, t0 = tab, g0 = grupo, p0 = pila, LS = {};
    for (const k of [ENTKEY, KEY, ENKEY]) LS[k] = localStorage.getItem(k);
    try { ent = entNorm({}); hist = []; S = fresh(); retomar = null; tab = 'reloj'; entFirma = ''; entConf = 0; return fn(); }
    finally { ent = e0; hist = h0; S = S0; retomar = r0; tab = t0; grupo = g0; pila = p0; entFirma = ''; entConf = 0;
      for (const [k, v] of Object.entries(LS)) { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } } };

  prueba('La primera actividad empieza el entrenamiento; las siguientes lo continúan (mismo entrenamiento)', con(() => {
    entActividad(T0); const id = ent.act && ent.act.id; entActividad(T0 + 10 * MIN); entActividad(T0 + 40 * MIN);
    return { ok: !!id && ent.act.id === id && ent.act.inicio === T0 && ent.act.ultima === T0 + 40 * MIN && !ent.lista.length };
  }));
  prueba('Terminar una sesión NO termina el entrenamiento (sesión «done» y luego 40 min hasta la siguiente)', con(() => {
    entActividad(T0); hist = [ses(T0)]; S.st = 'done';
    const cerro = entCaducar(T0 + 40 * MIN); entActividad(T0 + 40 * MIN); hist.push(ses(T0 + 40 * MIN, undefined, 'triceps'));
    return { ok: !cerro && !!ent.act && entSesiones(ent.act, T0 + 41 * MIN).length === 2, d: `${entSesiones(ent.act, T0 + 41 * MIN).length} sesiones en el mismo entrenamiento` };
  }));
  prueba('Flujo real: series anotadas, «Terminar y guardar» y «Nueva sesión» no cierran el entrenamiento', con(() => {
    CFG.cal = false; S = fresh(); iniciarSesion(); entActividad(Date.parse(S.start)); const id = ent.act.id;
    for (let i = 0; i < 2; i++) { S.st = 'work'; S.t0 = now() - 30; S.st = 'report'; S.workDur = 30; S.hechas = repsSug(); aplicar({ R: S.hechas, rir: 1, dur: 30 }); }
    $('terminar').onclick(); const tras1 = S.st, sigue1 = ent.act && ent.act.id === id;
    nuevaConf = 0; $('nueva').onclick(); const sigue2 = ent.act && ent.act.id === id && S.st === 'idle';
    const r = entResumen({ ...ent.act, fin: null });
    return { ok: (tras1 === 'done' || S.rutTrans || tras1 === 'trans') && sigue1 && sigue2 && r.ss.length === 1 && r.series >= 2, d: `tras terminar: ${tras1}; ${r.ss.length} sesión, ${r.series} series` };
  }));
  prueba('Entre sesiones: 59 min sin actividad sigue abierto; 61 min se cierra solo EN LA ÚLTIMA ACTIVIDAD', con(() => {
    entActividad(T0); hist = [ses(T0)]; entActividad(T0 + 30 * MIN);
    const a = entCaducar(T0 + 89 * MIN), b = entCaducar(T0 + 91 * MIN), e = ent.lista[0];
    return { ok: !a && b && !ent.act && e && e.fin === T0 + 30 * MIN && e.cierre === 'auto' && entDur(e) === 30 * MIN, d: e ? `duración ${durTxt(entDur(e))}, no las horas olvidado` : 'no se guardó' };
  }));
  prueba('Con una sesión en curso (descanso largo, app cerrada) no se cierra hasta 3 h; luego, en la última actividad', con(() => {
    entActividad(T0); hist = [ses(T0)]; S.st = 'rest';
    const a = entCaducar(T0 + 2 * 60 * MIN), b = entCaducar(T0 + 3 * 60 * MIN + MIN);
    return { ok: !a && b && ent.lista[0].fin === T0 };
  }));
  prueba('Con una sesión esperando a retomarse (Android cerró la app) tampoco se cierra a los 60 min', con(() => {
    entActividad(T0); hist = [ses(T0)]; retomar = { S: fresh() };
    return { ok: !entCaducar(T0 + 2 * 60 * MIN) && !!ent.act };
  }));
  prueba('Actividad después de mucho tiempo: cierra el anterior en su última actividad y empieza uno nuevo', con(() => {
    entActividad(T0); hist = [ses(T0)]; const id = ent.act.id; entActividad(T0 + 5 * 60 * MIN);
    return { ok: ent.lista.length === 1 && ent.lista[0].id === id && ent.lista[0].fin === T0 && ent.act && ent.act.id !== id && ent.act.inicio === T0 + 5 * 60 * MIN };
  }));
  prueba('Un entrenamiento sin series guardadas (empezado por error, todo deshecho, solo calentamiento) no se guarda', con(() => {
    entActividad(T0); hist = [ses(T0 + MIN, [serie('cal.'), serie('cal.')])]; entCerrar(T0 + 5 * MIN);
    return { ok: !ent.act && !ent.lista.length };
  }));
  prueba('Las sesiones se cuentan por su hora: las de antes no entran; borrar una sesión se refleja solo', con(() => {
    hist = [ses(T0 - 3 * 60 * MIN), ses(T0 + MIN), ses(T0 + 50 * MIN, undefined, 'pecho')]; entActividad(T0); entActividad(T0 + 30 * MIN); entActividad(T0 + 70 * MIN); entCerrar(T0 + 80 * MIN);
    const e = ent.lista[0], a = entResumen(e).ss.length; hist = hist.filter(h => h.g !== 'pecho'); const b = entResumen(e).ss.length;
    return { ok: a === 2 && b === 1, d: `${a} → ${b} sesiones` };
  }));
  prueba('«Terminar entrenamiento» no aparece con una sesión en curso; con dos toques termina AHORA', con(() => {
    entActividad(Date.now() - 20 * MIN); entActividad(Date.now() - MIN); hist = [ses(Date.now() - 19 * MIN)];
    S.st = 'rest'; entRender(); const conSes = !!$('entBarra').querySelector('[data-ent="terminar"]') || $('entBarra').hidden;
    S.st = 'done'; entFirma = ''; entRender(); const b = $('entBarra').querySelector('[data-ent="terminar"]');
    const reloj = $('entReloj') && /^0:(19|20):\d\d$/.test($('entReloj').textContent);
    b.click(); const pide = /otra vez/.test($('entBarra').textContent) && !!ent.act;
    $('entBarra').querySelector('[data-ent="terminar"]').click();
    const e = ent.lista[0];
    return { ok: !conSes && reloj && pide && !ent.act && e && Math.abs(e.fin - Date.now()) < 2000 && e.cierre === 'manual', d: `reloj ${$('entReloj') ? '' : ''}${e ? durTxt(entDur(e)) : ''}` };
  }));
  prueba('Si la última serie fue hace más de 10 min, pregunta: «Ahora» o «A las …» (cuenta hasta la última serie)', con(() => {
    const u = Date.now() - 25 * MIN; entActividad(u - 40 * MIN); entActividad(u); hist = [ses(u - 39 * MIN)];
    entRender(); $('entBarra').querySelector('[data-ent="terminar"]').click();
    const preg = /¿Cuándo terminaste\?/.test($('entBarra').textContent) && !!ent.act;
    $('entBarra').querySelector('[data-ent="ultima"]').click(); const e = ent.lista[0];
    return { ok: preg && e && e.fin === u && entDur(e) === 40 * MIN, d: e ? 'duración ' + durTxt(entDur(e)) : '' };
  }));
  prueba('«Sigo entrenando» cancela la pregunta y el entrenamiento sigue', con(() => {
    const u = Date.now() - 25 * MIN; entActividad(u - 5 * MIN); entActividad(u); hist = [ses(u)];
    entRender(); $('entBarra').querySelector('[data-ent="terminar"]').click(); $('entBarra').querySelector('[data-ent="no"]').click();
    return { ok: !!ent.act && !ent.lista.length && ent.act.ultima >= Date.now() - 2000 };
  }));
  prueba('Tras terminar se ve el resumen del último entrenamiento (duración, sesiones, series)', con(() => {
    const t = Date.now() - 60 * MIN; entActividad(t); hist = [ses(t + MIN), ses(t + 30 * MIN, undefined, 'triceps')]; entActividad(t + 50 * MIN); entCerrar(t + 55 * MIN);
    entRender(); const tx = $('entBarra').textContent;
    return { ok: !$('entBarra').hidden && /Último entrenamiento/.test(tx) && /55 min/.test(tx) && /2 sesiones/.test(tx) && /4 series/.test(tx), d: tx.replace(/\s+/g, ' ').slice(0, 120) };
  }));
  prueba('Reloj del teléfono hacia atrás: nunca hay duraciones negativas', con(() => {
    entActividad(T0); entActividad(T0 - 2 * 60 * MIN); hist = [ses(T0)]; entCerrar(T0 - 60 * MIN);
    const e = ent.lista[0];
    return { ok: e && entDur(e) >= 0 && e.fin >= e.inicio && entReloj(-5000) === '0:00:00' || (e && entDur(e) >= 0), d: e ? 'duración ' + entDur(e) + ' ms' : 'descartado' };
  }));
  prueba('Se guarda en el teléfono y se recupera igual; lo corrupto se ignora sin romper', con(() => {
    entActividad(T0); hist = [ses(T0)]; entCerrar(T0 + 30 * MIN); entActividad(Date.now() - MIN);
    const leido = entNorm(JSON.parse(localStorage.getItem(ENTKEY)));
    const igual = JSON.stringify(leido) === JSON.stringify(ent);
    const malo = entNorm({ act: { id: 5 }, lista: [{ id: 'x', inicio: 'a', fin: 3 }, { id: 'y', inicio: T0, fin: T0 + 1 }, { id: 'y', inicio: T0, fin: T0 + 2 }, null, 'z'] });
    const nada = entNorm('basura');
    return { ok: igual && !malo.act && malo.lista.length === 1 && !nada.act && !nada.lista.length };
  }));
  prueba('Copia de seguridad: los entrenamientos van en la copia y restaurar dos veces no duplica', con(() => {
    entActividad(T0); hist = [ses(T0)]; entCerrar(T0 + 30 * MIN); const copia = entCopia(); ent = entNorm({});
    const a = entFusiona(copia), b = entFusiona(copia), c = entFusiona([{ id: 'roto' }]);
    return { ok: a.n === 1 && b.n === 0 && c.mal === 1 && ent.lista.length === 1 };
  }));
  prueba('Historial: lista de entrenamientos y tiempo total de la semana', con(() => {
    const t = Math.max(lunes(Date.now()) + MIN, Date.now() - 3 * 60 * MIN); entActividad(t); hist = [ses(t + MIN)]; entCerrar(t + 45 * MIN);
    tab = 'historial'; entRenderHist(); const tx = $('entHist').textContent;
    return { ok: !$('entHist').hidden && /Entrenamientos/.test(tx) && /45 min/.test(tx) && /Bíceps/.test(tx), d: tx.replace(/\s+/g, ' ').slice(0, 140) };
  }));
  prueba('Mirar las pantallas no escribe en el almacenamiento (sin actividad, render no guarda)', con(() => {
    entActividad(T0); hist = [ses(T0)]; entActividad(Date.now() - MIN); const a = localStorage.getItem(ENTKEY);
    for (let i = 0; i < 5; i++) { entRender(); tab = 'historial'; entRender(); tab = 'reloj'; }
    return { ok: localStorage.getItem(ENTKEY) === a };
  }));
  render();
  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
