// v37 · Pruebas de los arreglos de los hallazgos verificados del Lab anómalo (VERIFICACION_HALLAZGOS.md: H1–H6, H9, H10).
// Resultado en <pre id="resultado">.
'use strict';
(async () => {
  const out = []; let ok = 0, n = 0;
  const prueba = async (nombre, fn) => { n++; let r; try { r = await fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    if (r === true) r = { ok: true }; if (!r) r = { ok: false }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  const ahora = Date.now(), iso = t => new Date(t).toISOString();
  const ses = (id, sets, extra = {}) => ({ id, start: iso(ahora - 36e5), g: 'biceps', grupo: 'Bíceps', sets, series: sets.length, completa: true, meta: 6, ...extra });
  const serie = (reps, rir = '1', extra = {}) => ({ ex: 'Curl', ej: 'Curl predicador', k: 'act.', reps, rir, kg: 20, P: .5, rest: 60, ...extra });
  const con = (H, fn) => { const g = hist; try { hist = H; return fn(); } finally { hist = g; } };

  await prueba('H1 · La auditoría funciona con ids de sesión como «hasOwnProperty», «constructor», «toString», «__proto__»', () => {
    const H = ['hasOwnProperty', 'constructor', 'toString', '__proto__', 'valueOf'].map(id => sesValida(ses(id, [serie('10')]))).filter(Boolean);
    const A = con(H, () => auditarDatos());
    return { ok: H.length >= 4 && !!A, d: `${H.length} sesiones raras auditadas sin fallo` };
  });
  await prueba('H1 · Dos sesiones con el mismo id raro se detectan como duplicadas', () => {
    const v = sesValida(ses('constructor', [serie('10')])), A = con([v, { ...v }], () => auditarDatos()), E = A.E || A.errores || [];
    return { ok: E.some(e => e.c === 'id-duplicado'), d: (E.find(e => e.c === 'id-duplicado') || {}).t };
  });
  await prueba('H2/H3 · Importar descarta las series con repeticiones negativas o no numéricas y las cuenta como no válidas', () => {
    const c = { mal: 0 }, v = sesValida(ses('imp', [serie('-3', '0'), serie('3+'), serie('abc'), serie('10'), serie('30 s', '—', { k: 'isom.' })]), c);
    return { ok: v && v.sets.length === 2 && c.mal === 3 && v.sets.every(r => /^\d{1,3}( s)?$/.test(r.reps)), d: `quedan ${v && v.sets.map(r => r.reps).join(', ')}; descartadas ${c.mal}` };
  });
  await prueba('H2 · Ya no hay volumen negativo por importar', () => {
    const v = sesValida(ses('neg', [serie('-3', '0'), serie('8', '0')]), { mal: 0 }), vol = con([v], () => volumen(lunes(ahora), ahora + 1)).grupo('biceps');
    return { ok: vol >= 0, d: 'volumen ' + vol };
  });
  await prueba('H2 · Una serie con reps negativas ya guardada (datos viejos) no resta: efectiva ∈ [0, 1]', () => {
    const v = [{ k: 'act.', reps: '-3', rir: '0' }, { k: 'myo', reps: '-9', rir: '1' }, { k: 'isom.', reps: '-30 s', rir: '—' }].map(efectiva);
    return { ok: v.every(x => x >= 0 && x <= 1), d: v.join(', ') };
  });
  await prueba('H2 · Una sesión importada sin ninguna serie válida no entra', () => ({ ok: sesValida(ses('vacia', [serie('-1'), serie('x')]), { mal: 0 }) === null }));
  await prueba('H4 · Al importar, las efectivas se recalculan de las series (una sola fuente)', () => {
    const v = sesValida(ses('ef', [serie('10', '4+'), serie('10', '1')], { efectivas: 9, series: 7, reps: 999 }), { mal: 0 });
    return { ok: v.efectivas === Math.round(efDe(v.sets) * 100) / 100 && efH(v) === v.efectivas && v.series === 2 && v.reps === repsDe(v.sets), d: `efectivas ${v.efectivas}, series ${v.series}, reps ${v.reps}` };
  });
  await prueba('H4 · Sesiones antiguas sin series detalladas conservan sus números al importar', () => {
    const v = sesValida({ id: 'vieja', start: iso(ahora - 9e8), g: 'pecho', grupo: 'Pecho', series: 6, reps: 60, efectivas: 5, completa: true }, { mal: 0 });
    return { ok: v && v.series === 6 && v.efectivas === 5 && v.reps === 60 };
  });
  await prueba('H5 · normSes es idempotente con reservas raras (números enormes, texto, 5, «4+»)', () => {
    const casos = [1e308, 'abc', 5, '4+', '3+', '?', '—', 2, '2', null, -1].map((rir, i) => serie('10', rir));
    const a = normSes(ses('idem', casos)), b = normSes(JSON.parse(JSON.stringify(a)));
    return { ok: JSON.stringify(a) === JSON.stringify(b) && a.sets.every(r => RIR_OK.includes(r.rir)), d: a.sets.map(r => r.rir).join(' ') };
  });
  await prueba('H5 · Las reservas válidas no cambian (0, 1, 2, 3, 3+, 4+, —, ?)', () => {
    const v = ['0', '1', '2', '3', '3+', '4+', '—', '?'], a = normSes(ses('rv', v.map(x => serie('10', x))));
    return { ok: a.sets.map(r => r.rir).join() === v.join() };
  });
  await prueba('H6 · Un rango escrito al revés («12-8», «15–10») se ordena', () => ({ ok: rango('12-8').join() === '8,12' && rango('15–10').join() === '10,15' && rango('8–12').join() === '8,12' && rango('raro').join() === '8,12' && dDe('12-8') === 10 }));
  await prueba('H9 · Si la sesión en curso no cabe en el almacenamiento, avisa (como el historial)', () => {
    const S0 = S, f0 = firmaEC, set = Storage.prototype.setItem, e0 = sinEspacio;
    try { S = { ...fresh(), st: 'work', id: 'x', start: iso(ahora), sets: [] };
      Storage.prototype.setItem = function (k, v) { if (k === ENKEY) throw new DOMException('lleno', 'QuotaExceededError'); return set.call(this, k, v); };
      firmaEC = ''; guardarEnCurso();
      return { ok: sinEspacio && !$('cuotaAv').hidden && firmaEC === '', d: $('cuotaAv').textContent.slice(0, 70) };
    } finally { Storage.prototype.setItem = set; S = S0; firmaEC = f0; sinEn.clear(); sinEspacio = e0; renderAlmacen(); }
  });
  await prueba('H10 · Hora del teléfono atrasada una semana en mitad de un descanso: P y C siguen en [0, 1] y el descanso sigue bien', () => {
    const S0 = S, real = Date.now;
    try { S = { ...fresh(), st: 'rest', P0: .6, C0: .5, P: .6, C: .5, restDur: 90 }; const t = now(); S.t0 = t - 30; S.last = t;
      Date.now = () => real() - 7 * 864e5 * 1000 / 1000 * 1;   // una semana atrás
      tick(); const e = now() - S.t0;
      return { ok: S.P >= 0 && S.P <= 1 && S.C >= 0 && S.C <= 1 && isFinite(S.P) && isFinite(S.C) && e >= 29 && e <= 31 && !/Infinity|NaN/.test($('vReloj').textContent), d: `P ${S.P.toFixed(3)}, C ${S.C.toFixed(3)}, descanso transcurrido ${e.toFixed(1)} s` };
    } finally { Date.now = real; S = S0; render(); }
  });
  await prueba('H10 · Hora atrasada en mitad de una serie: la duración medida es la real, no negativa', () => {
    const S0 = S, real = Date.now;
    try { S = { ...fresh(), st: 'work', P: .3, C: .9 }; const t = now(); S.t0 = t - 25; S.last = t;
      Date.now = () => real() - 36e5; tick(); const dur = now() - S.t0;
      return { ok: dur >= 24 && dur <= 26, d: `duración ${dur.toFixed(1)} s (real 25 s)` };
    } finally { Date.now = real; S = S0; render(); }
  });
  await prueba('H10 · bump con una duración negativa no sube la capacidad por encima de 1', () => {
    const S0 = S; try { S = { ...fresh(), P: .2, C: .8, tauC: 35 }; bump(10, .9, -600000, false); return { ok: S.C <= 1 && S.C >= 0, d: 'C ' + S.C }; } finally { S = S0; } });
  // una copia real (se inyecta en local como window.COPIA_REAL; nunca va al repositorio): importarla no descarta nada
  const real = window.COPIA_REAL || null;
  await prueba('Copia real: importarla con la validación nueva conserva todas las sesiones y series', () => {
    if (!real) return { ok: true, d: 'sin copia real inyectada (se comprueba en local con _pruebas/tmp/con_copia.py)' };
    const c = { mal: 0 }, V = real.sesiones.map(s => sesValida(s, c)).filter(Boolean), n0 = real.sesiones.reduce((a, s) => a + (s.sets || []).length, 0), n1 = V.reduce((a, s) => a + s.sets.length, 0);
    return { ok: V.length === real.sesiones.length && n1 === n0 && !c.mal, d: `${V.length} sesiones, ${n1} de ${n0} series` };
  });
  render();
  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
