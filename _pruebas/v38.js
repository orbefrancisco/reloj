// v38 · Pruebas de la INTEGRIDAD FÍSICA (Lab anómalo, INTEGRIDAD_FISICA.md P2–P7, opción b para el historial anterior).
// Resultado en <pre id="resultado">.
'use strict';
(() => {
  const out = []; let ok = 0, n = 0;
  const prueba = (nombre, fn) => { n++; let r; try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    if (r === true) r = { ok: true }; if (!r) r = { ok: false }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  const ahora = Date.now(), iso = t => new Date(t).toISOString();
  // aislado: memoria y almacenamiento como estaban
  const con = fn => () => { const h0 = hist, S0 = S, p0 = pila, c0 = calibC, LS = {}; for (const k of [KEY, ENKEY, MODKEY]) LS[k] = localStorage.getItem(k);
    try { hist = []; S = fresh(); pila = []; calibC = {}; recMemo = { k: '', v: null }; CFG.cal = false; return fn(); }
    finally { hist = h0; S = S0; pila = p0; calibC = c0; recMemo = { k: '', v: null }; for (const [k, v] of Object.entries(LS)) { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } render(); } };
  // una serie de trabajo hecha de verdad: work durante dur s y reportar R reps con reserva rir
  const serie = (R, dur, rir = 1) => { S.st = 'work'; S.t0 = now() - dur; S.st = 'report'; S.workDur = dur; S.hechas = R; aplicar({ R, rir, dur }); return S.sets[S.sets.length - 1]; };
  const nueva = () => { S = fresh(); iniciarSesion(); };

  prueba('Serie normal (10 reps en 30 s): se guarda su duración, es plausible y cuenta', con(() => {
    nueva(); const r = serie(10, 30), ef = S.ef;
    return { ok: r.dur === 30 && r.plaus === 'plausible' && ef > 0 && efectiva(r) > 0, d: `dur ${r.dur} s, ${r.plaus}, ${ef1(ef)} efectivas` };
  }));
  prueba('Serie imposible (10 reps en 2 s): se guarda marcada y NO cuenta (efectivas, volumen, récord)', con(() => {
    nueva(); const r = serie(10, 2), v = volumen(lunes(ahora), ahora + 1).grupo(grupo);
    return { ok: r.plaus === 'imposible' && efectiva(r) === 0 && S.ef === 0 && v === 0 && !r.pr && hist[0] && hist[0].efectivas === 0, d: `${r.plaus}, efectivas ${S.ef}, volumen ${v}` };
  }));
  prueba('«Sí, la hice»: la imposible confirmada cuenta (y queda como confirmada)', con(() => {
    nueva(); S.confImp = true; const r = serie(10, 2);
    return { ok: r.plaus === 'confirmada' && efectiva(r) > 0 && S.ef > 0 && !S.confImp, d: `${r.plaus}, ${ef1(S.ef)} efectivas` };
  }));
  prueba('Serie improbable (10 reps en 8 s): cuenta, pero no es récord ni referencia de progresión', con(() => {
    nueva(); const r = serie(10, 8), ej = r.ej, g = grupo;
    return { ok: r.plaus === 'improbable' && efectiva(r) > 0 && !previas(g, ej, '').length && !fisProgresa(r), d: `${r.plaus}, ${ef1(efectiva(r))} efectivas, previas ${previas(g, ej, '').length}` };
  }));
  prueba('Pantalla de anotar: avisa de la imposible con «Sí, la hice» y de la improbable sin botón; nada en una normal', con(() => {
    nueva(); S.st = 'report'; S.workDur = 2; S.hechas = 10; render(); const a = $('fisAv').textContent, b = !!$('fisAv').querySelector('[data-fis="si"]');
    $('fisAv').querySelector('[data-fis="si"]').click(); const conf = S.confImp && /Confirmada/.test($('fisAv').textContent);
    S.confImp = false; S.workDur = 8; render(); const c = $('fisAv').textContent, d = !!$('fisAv').querySelector('[data-fis]');
    S.workDur = 30; render(); const e = $('fisAv').hidden;
    return { ok: /no es posible/.test(a) && b && conf && /muy rápido/.test(c) && !d && e, d: a.slice(0, 60) };
  }));
  prueba('Descanso real: saltado, medido y alargado quedan en la serie anterior (restR, restQ); rest sigue siendo el planificado', con(() => {
    nueva(); const q = [];
    for (const f of [d => 2, d => d, d => d * 3]) { const r = serie(10, 30); const plan = S.restDur; S.t0 = now() - f(plan); empezar(); q.push(`${r.restQ}:${r.restR}/${Math.round(plan)}`); if (r.rest !== Math.round(plan) && r.rest !== 0 && Math.abs(r.rest - plan) > 1) return { ok: false, d: 'rest cambió' }; }
    return { ok: /^saltado:2\//.test(q[0]) && /^medido:/.test(q[1]) && /^alargado:/.test(q[2]), d: q.join(' · ') };
  }));
  prueba('Retomar tras un cierre en mitad de una serie: duración «desconocida» (no inventada) y no enseña', con(() => {
    nueva(); S.st = 'work'; S.t0 = now() - 600; retomar = { S: clon(S), grupo, rutI, miaLista, rutPos: 0, rutEf: 0, pila: [] }; retomarSesion();
    const inv = S.durInv; S.hechas = 10; aplicar({ R: 10, rir: 1, dur: S.workDur }); const r = S.sets[S.sets.length - 1];
    return { ok: inv && r.plaus === 'desconocida' && r.dur == null && efectiva(r) > 0 && !fisEnsena(r), d: `${r.plaus}, dur ${r.dur}` };
  }));
  prueba('Retomar en mitad de un descanso: ese descanso queda «interrumpido»', con(() => {
    nueva(); const r = serie(10, 30); retomar = { S: clon(S), grupo, rutI, miaLista, rutPos: 0, rutEf: 0, pila: [] }; retomarSesion();
    S.t0 = now() - S.restDur; empezar(); const u = S.sets[S.sets.length - 1];
    return { ok: u.restQ === 'interrumpido', d: u.restQ };
  }));
  prueba('Se guarda y se lee igual: la sesión lleva fis:{v:1} y las series sus campos; los valores raros se descartan', con(() => {
    nueva(); serie(10, 30); const r = serie(10, 2); S.t0 = now() - 5; empezar();
    const h = normSes(JSON.parse(JSON.stringify(hist[0]))), x = normSet({ ex: 'a', k: 'act.', reps: '5', rir: '1', dur: -3, restR: 'x', restQ: 'raro', plaus: 'magia' });
    return { ok: h.fis && h.fis.v === 1 && h.sets.some(s => s.plaus === 'imposible') && h.sets[0].dur === 30 && x.dur == null && x.restR == null && x.restQ == null && x.plaus == null, d: JSON.stringify(h.sets.map(s => [s.plaus, s.dur, s.restQ])) };
  }));
  // historial sintético para el aprendizaje: mini-series con objetivo y capacidad prevista guardados
  const act = (x = {}) => ({ ex: 'Curl', ej: 'Curl predicador', k: 'act.', reps: '10', rir: '1', kg: 20, P: .5, rest: 30, ...x });
  const myo = (x = {}) => ({ ex: 'Curl', ej: 'Curl predicador', k: 'myo', reps: '4', rir: '1', kg: 20, P: .6, rest: 30, obj: 4, Cpre: .6, kc: 1, mod: 'fijo', ...x });
  const ses = (id, d, sets, fis) => ({ id, start: iso(ahora - d * 864e5), g: 'biceps', grupo: 'Bíceps', sets, series: sets.length, completa: true, meta: 6, ...(fis ? { fis: { v: 1 } } : {}) });
  prueba('Aprendizaje: con tiempos, solo entran mini-series plausibles, con principal plausible y descanso previo medido', con(() => {
    const M = { plaus: 'plausible', dur: 12, restQ: 'medido', restR: 30 }, A = { plaus: 'plausible', dur: 30, restQ: 'medido', restR: 30 };
    hist = [ses('a', 5, [act(A), myo(M)], true), ses('b', 4, [act(A), myo({ ...M, plaus: 'imposible' })], true), ses('c', 3, [act({ ...A, restQ: 'saltado' }), myo(M)], true),
      ses('d', 2, [act({ ...A, plaus: 'improbable' }), myo(M)], true), ses('e', 1, [act(A), myo({ ...M, plaus: 'desconocida' })], true)];
    const O = obsRec(), x = O.excl;
    return { ok: O.length === 1 && O[0].hv === 1 && x.serie === 2 && x.descanso === 1 && x.principal === 1, d: `entran ${O.length}; fuera: serie ${x.serie}, principal ${x.principal}, descanso ${x.descanso}` };
  }));
  prueba('Opción (b): el historial anterior (sin tiempos) entra con la mitad de peso; lo medido, entero', con(() => {
    hist = [ses('v', 6, [act(), myo()], false), ses('n', 1, [act({ plaus: 'plausible', dur: 30, restQ: 'medido' }), myo({ plaus: 'plausible', dur: 12, restQ: 'medido' })], true)];
    const O = obsRec(), v = O.find(o => o.hv < 1), m = O.find(o => o.hv === 1);
    return { ok: O.length === 2 && v && m && pesoObs(v) === .5 && pesoObs(m) === 1 && nEf(O) === 1.5, d: `pesos ${O.map(pesoObs).join(' + ')} = ${nEf(O)}` };
  }));
  prueba('Lo anterior a v38 no cambia: sin plaus, sus efectivas y su volumen son los de siempre', con(() => {
    const s = ses('viejo', 1, [act(), act({ rir: '0' }), myo()], false); hist = [s];
    const ef = efDe(s.sets), base = s.sets.reduce((a, r) => a + efectivaBase(r), 0), v = volumen(lunes(ahora) - 7 * 864e5, ahora + 1).grupo('biceps');
    return { ok: ef === base && ef > 0 && v > 0, d: `efectivas ${ef1(ef)}` };
  }));
  prueba('Recuperación prudente: una serie imposible sigue contando como estímulo de la zona', con(() => {
    hist = [ses('imp', 0, [act({ plaus: 'imposible', dur: 1, ej: 'Curl predicador' })], true)];
    const z = anZona('biceps', {});
    return { ok: efectiva(hist[0].sets[0]) === 0 && z && z.ult > 0, d: `estímulo hace ${z && z.ult ? Math.round((Date.now() - z.ult) / 36e5) + ' h' : '—'}` };
  }));
  prueba('Auditoría: avisa de series imposibles e improbables y de descansos saltados; resumen de integridad física', con(() => {
    hist = [ses('x', 1, [act({ plaus: 'imposible', dur: 1, restQ: 'saltado', restR: 2 }), act({ plaus: 'improbable', dur: 8 }), act({ plaus: 'plausible', dur: 30, restQ: 'medido' })], true), ses('y', 2, [act()], false)];
    const A = auditarDatos(), av = (A.avisos || []).map(a => a.c), inf = (A.info || []).find(i => i.c === 'fisica');
    return { ok: av.includes('serie-imposible') && av.includes('serie-improbable') && av.includes('descanso-saltado') && inf && /1 sesiones anteriores sin tiempos/.test(inf.t), d: inf && inf.t.slice(0, 120) };
  }));
  prueba('Aprendizaje (pantalla): explica cuántas mini-series quedan fuera y que el historial anterior cuenta la mitad', con(() => {
    hist = [ses('v', 6, [act(), myo()], false)]; renderCalib(); const t = $('cCalib').textContent;
    return { ok: /Integridad física \(v38\)/.test(t) && /cuentan la mitad/.test(t), d: t.match(/Integridad física[^.]*\./)?.[0] };
  }));
  // casos que encontró la campaña del laboratorio sobre v38
  prueba('Hora atrasada justo antes de tocar (sin tick en medio): duración no negativa y la serie queda «desconocida»', con(() => {
    nueva(); const real = Date.now; let r;
    try { S.st = 'work'; S.t0 = now() - 40; S.last = now(); Date.now = () => real() - 36e5; $('pad').onclick(); const dur = S.workDur; S.hechas = 10; aplicar({ R: 10, rir: 1, dur }); r = S.sets[S.sets.length - 1];
      return { ok: dur >= 39 && dur <= 41 && r.plaus === 'desconocida' && r.dur == null, d: `medido ${dur.toFixed(1)} s, ${r.plaus}` };
    } finally { Date.now = real; now(); }
  }));
  prueba('Hora adelantada con la pantalla encendida en un descanso: no lo da por terminado y queda «interrumpido»', con(() => {
    nueva(); const r = serie(10, 30), real = Date.now; let e;
    try { Date.now = () => real() + 3600e3; e = now() - S.t0; Date.now = real; }
    finally { Date.now = real; }
    const e2 = now() - S.t0; S.t0 = now() - S.restDur; empezar();
    return { ok: e < 5 && r.restQ === 'interrumpido', d: `transcurrido tras el salto ${e.toFixed(1)} s · ${r.restQ}` };
  }));
  prueba('«+30 s» alarga el descanso: queda «alargado» (la predicción de la mini-serie suponía el planificado) y no enseña', con(() => {
    nueva(); const r = serie(10, 30), plan = r.rest; $('mas30').onclick(); $('mas30').onclick(); S.t0 = now() - S.restDur; empezar();
    return { ok: r.restQ === 'alargado' && r.restR >= plan + 55, d: `plan ${plan} s, real ${r.restR} s → ${r.restQ}` };
  }));
  prueba('Terminar la sesión en mitad de un descanso también lo mide', con(() => {
    nueva(); serie(10, 30); const r = serie(10, 30); S.t0 = now() - 12; $('terminar').onclick();
    return { ok: r.restR === 12 && r.restQ === 'saltado', d: `${r.restR} s · ${r.restQ}` };
  }));
  prueba('El descanso real se guarda en el teléfono al acabar el descanso (no espera a la serie siguiente)', con(() => {
    nueva(); const r = serie(10, 30); S.t0 = now() - S.restDur; empezar();
    const g = JSON.parse(localStorage.getItem(KEY)).find(h => h.id === S.id);
    return { ok: g && g.sets[0].restR === r.restR && g.sets[0].restQ === r.restQ, d: g ? `${g.sets[0].restR} s · ${g.sets[0].restQ}` : 'no guardado' };
  }));
  prueba('Teléfono lleno: si el entrenamiento no se pudo guardar, el aviso sigue aunque el historial sí se guarde', con(() => {
    const set = Storage.prototype.setItem;
    try { Storage.prototype.setItem = function (k, v) { if (k === ENTKEY) throw new DOMException('lleno', 'QuotaExceededError'); return set.call(this, k, v); };
      guardarObj(ENTKEY, { x: 1 }); escribirHist(); const a = !$('cuotaAv').hidden;
      Storage.prototype.setItem = set; guardarObj(ENTKEY, { x: 1 }); const b = $('cuotaAv').hidden;
      return { ok: a && b, d: `con el entrenamiento sin guardar: aviso ${a ? 'visible' : 'oculto'}; al poder guardarlo: ${b ? 'se quita' : 'sigue'}` };
    } finally { Storage.prototype.setItem = set; sinEn.clear(); sinEspacio = false; renderAlmacen(); }
  }));
  prueba('Medallas: una sesión hecha solo de series imposibles no cuenta como sesión; una mixta sí', con(() => {
    hist = [ses('solo', 2, [act({ plaus: 'imposible', dur: 1 }), act({ plaus: 'imposible', dur: 1 })], true)]; const a = medallasGanadas();
    hist.push(ses('mixta', 1, [act({ plaus: 'imposible', dur: 1 }), act({ plaus: 'plausible', dur: 30 })], true)); const b = medallasGanadas();
    hist.push(ses('vieja', 3, [act()], false)); const c = medallasGanadas();
    return { ok: !a.ses1 && b.ses1 === hist[1].start && c.ses1 === hist[2].start, d: `solo imposibles: ${a.ses1 ? 'medalla' : 'sin medalla'}; mixta: ${b.ses1 ? 'medalla' : '—'}` };
  }));
  prueba('CSV: lleva duración, descanso real, su calidad y la verosimilitud de cada serie', con(() => {
    hist = [ses('c', 1, [act({ plaus: 'plausible', dur: 30, restQ: 'medido', restR: 31 })], true), ses('o', 2, [act()], false)];
    let csv = ''; const e0 = window.entregar; window.entregar = (n, t) => { csv = t };
    try { $('expCsv').onclick(); } finally { window.entregar = e0; }
    const L = csv.split('\n');
    return { ok: /duracion_s,descanso_real_s,descanso_calidad,verosimilitud/.test(L[0]) && L.some(l => /,30,31,"medido","plausible"$/.test(l)) && L.some(l => /"sin_tiempos"$/.test(l)), d: L[1] && L[1].slice(-60) };
  }));
  render();
  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
