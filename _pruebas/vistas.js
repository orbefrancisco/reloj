// Pruebas de coherencia del volumen semanal entre vistas (se carga DESPUÉS de reloj.js, con los datos de semilla.js).
// Cada prueba compara magnitudes que deberían ser iguales en dos vistas, o comprueba las identidades que explican
// por qué otras NO deben coincidir (solape entre zonas, sesiones sin detalle). Resultado en <pre id="resultado">.
'use strict';
(() => {
  const out = [];
  let ok = 0, n = 0;
  const prueba = (nombre, fn) => {
    n++;
    let r;
    try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message }; }
    if (r === true) r = { ok: true };
    if (r.ok) ok++;
    out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`);
  };
  const casi = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
  const W = 7 * 864e5, L = lunes(Date.now());
  const crudoAntes = localStorage.getItem(KEY);

  // Copia literal del cálculo ANTERIOR (v18), para comprobar que centralizarlo no cambió ningún número.
  const viejoMus = (a, b) => { const v = {}, de = {};
    hist.forEach(h => { const t = Date.parse(h.start), g = gDe(h); if (!g || !CAT[g] || t < a || t >= b) return;
      (h.sets || []).forEach(r => { const c = efectiva(r); if (!c) return; const nn = nomFila(r, g);
        for (const [m, f] of Object.entries(musculos(nn, g))) { v[m] = (v[m] || 0) + c * f; (de[m] = de[m] || {})[nn] = (de[m][nn] || 0) + c * f; } }); });
    return { v, de }; };
  const viejoFact = (nn, g) => { const o = {}; for (const [m, f] of Object.entries(musculos(nn, g))) if (MUS[m]) { const G = MUS[m][1]; o[G] = Math.max(o[G] || 0, f); } return o; };
  const viejoRango = (a, b) => { const o = {};
    hist.forEach(h => { const t = Date.parse(h.start), g = gDe(h); if (!g || !CAT[g] || t < a || t >= b) return;
      if (!(h.sets || []).length) { o[g] = (o[g] || 0) + efH(h); return; }
      h.sets.forEach(r => { const c = efectiva(r); if (!c) return; const f = viejoFact(nomFila(r, g), g); for (const G in f) o[G] = (o[G] || 0) + c * f[G]; }); });
    return o; };

  const V = volSemana(0), V1 = volSemana(1);
  const ef = (ej) => hist.filter(h => Date.parse(h.start) >= L).flatMap(h => h.sets || []).filter(r => r.ej === ej).reduce((s, r) => s + efectiva(r), 0);

  // ---------- 1. El refactor no cambia ningún número ----------
  for (const [nom, a, b] of [['esta semana', L, L + W], ['semana pasada', L - W, L], ['últimas 4 semanas', L - 3 * W, L + W]]) {
    prueba(`Mismos números que el cálculo anterior (${nom})`, () => {
      const zv = viejoMus(a, b).v, zn = volMusR(a, b).v, gv = viejoRango(a, b), gn = volRango(a, b), malos = [];
      new Set([...Object.keys(zv), ...Object.keys(zn)]).forEach(m => { if (!casi(zv[m] || 0, zn[m] || 0, 1e-9)) malos.push(`zona ${m}: ${zv[m]} → ${zn[m]}`); });
      new Set([...Object.keys(gv), ...Object.keys(gn)]).forEach(g => { if (!casi(gv[g] || 0, gn[g] || 0, 1e-9)) malos.push(`grupo ${g}: ${gv[g]} → ${gn[g]}`); });
      return { ok: !malos.length, d: malos.join('; ') };
    });
  }

  // ---------- 2. Identidades: directas + indirectas, solape y sesiones sin detalle ----------
  prueba('Zona y grupo = directas + indirectas', () => {
    const malos = [];
    for (const m in V.zonas) if (!casi(V.zona(m), V.zonas[m].dir + V.zonas[m].ind)) malos.push(m);
    for (const g in V.grupos) if (!casi(V.grupo(g), V.grupos[g].dir + V.grupos[g].ind)) malos.push(g);
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Σ zonas del grupo = grupo − sin detalle + solape (para todos los grupos)', () => {
    const malos = [];
    for (const g of Object.keys(CAT)) {
      const o = V.grupos[g] || { solape: 0, sinDetalle: 0 }, sz = zonasDe(g).reduce((s, m) => s + V.zona(m), 0);
      if (!casi(sz, V.grupo(g) - o.sinDetalle + o.solape, 1e-9)) malos.push(`${g}: zonas ${sz} vs ${V.grupo(g)} − ${o.sinDetalle} + ${o.solape}`);
    }
    return { ok: !malos.length, d: malos.join('; ') };
  });

  // ---------- 3. Las causas de las discrepancias observadas, cuantificadas ----------
  prueba('Pecho: zonas − grupo = ¼ × series de aperturas (solape medio/superior)', () => {
    const d = zonasDe('pecho').reduce((s, m) => s + V.zona(m), 0) - V.grupo('pecho'), esp = .25 * ef('Aperturas en polea');
    return { ok: casi(d, esp) && esp > 0, d: `diferencia ${ef1(d)}, esperado ${ef1(esp)}` };
  });
  prueba('Hombros: deltoides − grupo = ½ × series de press sentado (solape anterior/lateral)', () => {
    const d = zonasDe('hombros').reduce((s, m) => s + V.zona(m), 0) - V.grupo('hombros'), esp = .5 * ef('Press con mancuernas sentado');
    return { ok: casi(d, esp) && esp > 0, d: `diferencia ${ef1(d)}, esperado ${ef1(esp)}` };
  });
  prueba('Bíceps: grupo − zona bíceps = ½ × martillo + antebrazo-solo + sesiones sin detalle', () => {
    const d = V.grupo('biceps') - V.zona('biceps'), esp = .5 * ef('Curl martillo') + V.grupos.biceps.sinDetalle;
    return { ok: casi(d, esp) && d > 0, d: `diferencia ${ef1(d)} = martillo ${ef1(.5 * ef('Curl martillo'))} + sin detalle ${ef1(V.grupos.biceps.sinDetalle)}` };
  });

  // ---------- 4. Misma magnitud en distintas vistas ----------
  renderProg(); mapaOff = 0; mapaSel = ''; renderMapa();
  prueba('Progreso muestra exactamente el volumen central de cada grupo', () => {
    const malos = Object.keys(CAT).filter(g => { const el = document.querySelector(`#pSem .sem[data-g="${g}"]`);
      return !el || !casi(+el.dataset.v, V.grupo(g)) || !el.querySelector('.val').textContent.startsWith(ef1(V.grupo(g)) + ' '); });
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('El mapa muestra exactamente el volumen central de cada zona', () => {
    const malos = Object.keys(MUS).filter(m => { const el = document.querySelector(`#pMapa .musr[data-m="${m}"]`);
      return !el || !casi(+el.dataset.v, V.zona(m)) || el.querySelector('b').textContent !== ef1(V.zona(m)); });
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Detalle de una zona: directas + indirectas = valor de la fila, mostradas por separado', () => {
    mapaSel = 'biceps'; renderMapa();
    const p = document.querySelector('#pMapa [data-desg="biceps"]'), q = document.querySelector('#pMapa [data-desgi="biceps"]'), z = V.zonas.biceps;
    const ok = p && q && p.textContent.startsWith(`Directas ${ef1(z.dir)}`) && q.textContent.startsWith(`Indirectas ${ef1(z.ind)}`) && /estimación/.test(q.textContent) && casi(z.dir + z.ind, V.zona('biceps'));
    mapaSel = ''; renderMapa();
    return { ok: !!ok, d: p ? p.textContent.slice(0, 40) + ' | ' + q.textContent.slice(0, 40) : 'sin detalle' };
  });
  prueba('«Qué toca», resumen en imagen y medallas usan el mismo número de grupo (semana())', () => {
    const w = semana(0), malos = Object.keys(CAT).filter(g => !casi(w[g] || 0, V.grupo(g)));
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Comparar periodos usa los mismos números de grupo y zona', () => {
    const s = statsP(L, L + W), malos = [];
    Object.keys(CAT).forEach(g => { if (!casi(s.g[g] || 0, V.grupo(g))) malos.push('g:' + g); });
    Object.keys(MUS).forEach(m => { if (!casi(s.z[m] || 0, V.zona(m))) malos.push('z:' + m); });
    return { ok: !malos.length, d: malos.join(', ') };
  });

  // ---------- 5. Rangos de fechas ----------
  prueba('Todas las vistas semanales empiezan el lunes 00:00 y la sesión de la semana pasada solo cuenta allí', () => {
    const pasada = hist.find(h => Date.parse(h.start) < L);
    const enEsta = Object.values(V.zonas).some(z => Object.keys(z.de).includes('Curl inclinado con mancuernas') && z.de['Curl inclinado con mancuernas'] > 3 + 1e-9);
    mapaOff = 1; renderMapa(); const filaB = +document.querySelector('#pMapa .musr[data-m="biceps"]').dataset.v; mapaOff = 0; renderMapa();
    return { ok: !!pasada && !enEsta && casi(filaB, V1.zona('biceps')) && V1.zona('biceps') >= 5, d: `semana pasada: bíceps ${ef1(V1.zona('biceps'))} en el mapa ${ef1(filaB)}` };
  });

  // ---------- 6. Colores: mismo estado → misma clase y mismo color en todas las vistas ----------
  prueba('Barras de Progreso: estado y color salen de estadoVol() y de las variables del mapa', () => {
    const malos = Object.keys(CAT).filter(g => { const el = document.querySelector(`#pSem .sem[data-g="${g}"]`), est = estadoVol(V.grupo(g), semRango(g));
      return el.dataset.est !== est || !el.querySelector('.fill').getAttribute('style').includes(`var(--${EST_VAR[est]})`); });
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Filas del mapa: estado según el rango propio de cada zona', () => {
    const malos = Object.keys(MUS).filter(m => { const el = document.querySelector(`#pMapa .musr[data-m="${m}"]`);
      return el.dataset.est !== estadoVol(V.zona(m), rangoZona(m)) || !el.querySelector('.mr') || el.querySelector('.mr').textContent !== rangoZona(m).join('–'); });
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Misma magnitud → mismo rango: grupos de una sola zona (tríceps, abdomen) frente a su zona del mapa', () => {
    const conflictos = Object.keys(CAT).filter(g => zonasDe(g).length === 1).map(g => {
      const m = zonasDe(g)[0], rg = rangoGrupo(g), rz = rangoZona(m);
      const pg = document.querySelector(`#pSem .sem[data-g="${g}"]`), pm = document.querySelector(`#pMapa .musr[data-m="${m}"]`);
      if (rg[0] !== rz[0] || rg[1] !== rz[1]) return `${CAT[g].n}: grupo ${rg.join('–')} vs zona ${rz.join('–')}`;
      if (pg.dataset.est !== pm.dataset.est) return `${CAT[g].n}: Progreso «${EST_MUS[pg.dataset.est]}» vs mapa «${EST_MUS[pm.dataset.est]}»`;
      return null;
    }).filter(Boolean);
    return { ok: !conflictos.length, d: conflictos.join('; ') || `tríceps ${ef1(V.grupo('triceps'))} → «${EST_MUS[estadoVol(V.grupo('triceps'), rangoGrupo('triceps'))]}» en las dos vistas` };
  });

  // ---------- 6b. Objetivos: fuente única, preparada para configurarse por músculo ----------
  prueba('Objetivos personales: se aplican por grupo y por zona, la zona única sigue a su grupo y lo inválido se ignora', () => {
    const g0 = rangoGrupo('pecho'), z0 = rangoZona('del_lat');
    RANGO_PERSONAL.g.pecho = [10, 18]; RANGO_PERSONAL.z.del_lat = [6, 14]; RANGO_PERSONAL.g.triceps = [9, 15];
    RANGO_PERSONAL.z.biceps = [20, 5]; RANGO_PERSONAL.z.antebrazo = ['4', 10]; RANGO_PERSONAL.g.constructor = [1, 2];
    const r = [rangoGrupo('pecho'), rangoZona('del_lat'), rangoZona('triceps'), rangoZona('biceps'), rangoZona('antebrazo')].map(x => x.join('–'));
    for (const k of ['pecho', 'triceps', 'constructor']) delete RANGO_PERSONAL.g[k];
    for (const k of ['del_lat', 'biceps', 'antebrazo']) delete RANGO_PERSONAL.z[k];
    const ok = r.join('|') === `10–18|6–14|9–15|${MUS.biceps[2].join('–')}|${MUS.antebrazo[2].join('–')}` && rangoGrupo('pecho').join() === g0.join() && rangoZona('del_lat').join() === z0.join();
    return { ok, d: r.join(' · ') };
  });
  prueba('Directas = solo aportes de músculo principal (factor 1); indirectas = el resto; cada lista suma su total', () => {
    const malos = [];
    for (const m in V.zonas) { const z = V.zonas[m], s = o => Object.values(o).reduce((a, b) => a + b, 0);
      if (!casi(s(z.deDir), z.dir) || !casi(s(z.deInd), z.ind)) malos.push(m);
      Object.keys(z.deDir).forEach(e => { const g = hist.find(h => (h.sets || []).some(r => r.ej === e)); if ((musculos(e, gDe(g))[m] || 0) !== 1) malos.push(`${m}:${e}`); }); }
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Se ven los cuatro estados y ninguna etiqueta presenta el objetivo como límite rígido', () => {
    const est = new Set([...document.querySelectorAll('#pMapa .musr')].map(e => e.dataset.est));
    const txt = document.getElementById('pSem').textContent + document.getElementById('pMapa').textContent;
    const ok = ['z0', 'zlo', 'zok', 'zhi'].every(e => est.has(e)) && !/te pasaste|en rango/.test(txt) && /orientativ/.test(txt) && /estimaci/.test(txt);
    return { ok, d: `estados en el mapa: ${[...est].map(e => EST_MUS[e]).join(', ')}` };
  });
  // ---------- 8. Cinco estados del volumen (v22): límites, umbral dinámico del 30 %, fuente única de colores ----------
  const fallan = (rango, casos) => casos.filter(([x, e]) => estadoVol(x, rango) !== e).map(([x, e]) => `[${rango}] ${x}→${estadoVol(x, rango)} (esperado ${e})`);
  prueba('Cinco estados con objetivo 12–20 en enteros: 0 gris · 1–11 ámbar · 12–20 jade · 21–26 azul · 27+ coral', () => {
    const casos = [[0, 'z0'], [1, 'zlo'], [11, 'zlo'], [12, 'zok'], [16, 'zok'], [20, 'zok'], [21, 'zhi'], [26, 'zhi'], [27, 'zal'], [40, 'zal']];
    const m = fallan([12, 20], casos); return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Límites con decimales: se compara el valor mostrado (una decimal), así el color no contradice el número', () => {
    const casos = [[0.04, 'z0'], [0.06, 'zlo'], [11.94, 'zlo'], [11.96, 'zok'], [20.04, 'zok'], [20.06, 'zhi'], [26.04, 'zhi'], [26.06, 'zal']];
    const m = fallan([12, 20], casos); return { ok: !m.length, d: m.join('; ') };
  });
  prueba('El umbral del 30 % se calcula con el máximo de cada rango (no es un número fijo)', () => {
    const m = [...fallan([8, 16], [[16, 'zok'], [16.1, 'zhi'], [20.8, 'zhi'], [20.9, 'zal']]),
      ...fallan([2, 8], [[8, 'zok'], [10.4, 'zhi'], [10.5, 'zal']]),
      ...fallan([6, 12], [[15.6, 'zhi'], [15.7, 'zal']])];
    // y con los rangos reales de la app: grupo y zonas, cada uno con su propio 1,3·máx
    for (const g of Object.keys(CAT)) { const [lo, hi] = rangoGrupo(g), t = Math.round(hi * VOL_ALERTA * 10) / 10;
      if (estadoVol(t, [lo, hi]) !== 'zhi' || estadoVol(t + .1, [lo, hi]) !== 'zal') m.push(`${g}: 1,3·${hi} = ${t}`); }
    for (const z of Object.keys(MUS)) { const [lo, hi] = rangoZona(z), t = Math.round(hi * VOL_ALERTA * 10) / 10;
      if (estadoVol(t, [lo, hi]) !== 'zhi' || estadoVol(t + .1, [lo, hi]) !== 'zal') m.push(`${z}: 1,3·${hi} = ${t}`); }
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Colores de estado: salen de VOL_ESTADOS en el tema principal y en un estilo oscuro y uno claro', () => {
    const m = [], css = () => getComputedStyle(document.documentElement), col = k => css().getPropertyValue('--' + k).trim().toUpperCase();
    const revisa = (nombre, osc) => VOL_ESTADOS.forEach(s => { const esp = (osc ? s.osc : s.claro).toUpperCase(); if (col(s.v) !== esp) m.push(`${nombre} ${s.v}=${col(s.v)} (esperado ${esp})`); });
    const antes = estilo;
    revisa('principal', matchMedia('(prefers-color-scheme: dark)').matches);
    aplicarEstilo('medianoche'); revisa('medianoche', true);
    aplicarEstilo('sol'); revisa('sol', false);
    aplicarEstilo(antes);
    if (new Set(VOL_ESTADOS.map(s => s.osc)).size !== 5 || new Set(VOL_ESTADOS.map(s => s.claro)).size !== 5) m.push('colores repetidos');
    const oscUsuario = { z0: '#7A879B', zlo: '#E5A15B', zok: '#41BFA3', zhi: '#6CA9DD', zal: '#DB6B78' };
    VOL_ESTADOS.forEach(s => { if (s.osc !== oscUsuario[s.k]) m.push(`${s.k} oscuro ${s.osc} ≠ ${oscUsuario[s.k]}`); });
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Leyenda con los cinco estados y su etiqueta; ninguna etiqueta habla de lesión, fatiga ni sobreentrenamiento', () => {
    const ley = [...document.querySelectorAll('#pMapa .mleg span')].map(s => [[...s.querySelector('i').classList].find(c => /^z/.test(c)), s.textContent.trim()]);
    const m = [];
    if (ley.length !== 5 || VOL_ESTADOS.some((s, i) => !ley[i] || ley[i][0] !== s.k || ley[i][1] !== s.n)) m.push(`leyenda: ${JSON.stringify(ley)}`);
    if (VOL_ESTADOS.some(s => /lesi|fatig|sobreentren|peligro|riesgo/i.test(s.n))) m.push('etiqueta con diagnóstico');
    const clases = new Set([...document.querySelectorAll('#mapa [data-m]')].map(p => [...p.classList].find(c => /^z/.test(c))));
    clases.forEach(c => { if (!EST_MUS[c]) m.push(`zona con estado desconocido ${c}`); });
    return { ok: !m.length, d: m.join('; ') || `mapa: ${[...clases].map(c => EST_MUS[c]).join(', ')}` };
  });

  // ---------- 9. v23: arreglos de la ronda 2 y mejoras de uso (solo en memoria: no guardan nada) ----------
  prueba('Meta de una sesión guardada en su propia unidad (efectivas, descarga, fuerza, cuidar una zona)', () => {
    const fila = (k, reps, rir, extra = {}) => ({ k, reps: String(reps), rir: String(rir), kg: 20, ...extra });
    const m = [];
    if (!metaHechaH({ meta: 2, efectivas: 2, sets: [] }) || metaHechaH({ meta: 3, efectivas: 2, sets: [] })) m.push('efectivas');
    if (!metaHechaH({ meta: 2, desc: true, serC: 2 }) || metaHechaH({ meta: 3, desc: true, serC: 2 })) m.push('descarga');
    if (!metaHechaH({ meta: 2, fza: true, serC: 2 })) m.push('fuerza');
    const recta = [fila('act.', 8, 2, { recta: true }), fila('act.', 8, 3, { recta: true })];   // 2 series rectas: cuentan 1 cada una aunque su efectiva sea menor
    if (!metaHechaH({ meta: 2, cuida: 'codo', sets: recta, efectivas: efDe(recta) })) m.push(`cuidar una zona: progLes=${progLes(recta)}`);
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Con barra, «−» y la sugerencia no bajan de la barra sola', () => {
    const E = { n: 'Press con barra', s: 'Press', r: '8–12' }, b = barraU(), m = [];
    const k = cambiaKg(E, deU(b), -1); if (Math.abs(aU(k) - b) > 1e-6) m.push(`− desde la barra: ${aU(k)}`);
    const k2 = cambiaKg(E, deU(b + 10), -1); if (!(aU(k2) < b + 10 && aU(k2) >= b)) m.push(`− desde barra+10: ${aU(k2)}`);
    const r = regla(E, { reps: '5', rir: '0', kg: deU(b) }); if (r.kg !== deU(b) || !/barra sola/.test(r.txt)) m.push(`regla: ${r.txt}`);
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('«Ahora no» en «Cómo llegas hoy» solo vale para ese día', () => {
    const antes = bienOmit; bienOmit = diaK(Date.now()); const hoy = omitHoy();
    bienOmit = diaK(Date.now() - 864e5); const ayer = omitHoy(); bienOmit = antes;
    return { ok: hoy && !ayer, d: `hoy=${hoy} ayer=${ayer}` };
  });
  prueba('Reps propuestas al reportar: las de la última vez con el mismo peso; con otro peso, las del 1RM estimado', () => {
    const S0 = S, m = [];
    try {
      const E = est(), [lo, hi] = rango(E.r), p = { reps: '11', rir: '1', kg: 20 };
      S = { ...fresh(), phase: 'act', ronda: 1, kg: 20, sug: { prev: p } }; if (repsSug() !== 11) m.push(`mismo peso: ${repsSug()}`);
      S = { ...S, kg: 22.5 }; const r = repsSug(), esp = Math.min(hi + 5, Math.max(Math.max(1, lo - 3), Math.round(30 * (e1(p) / 22.5 - 1)) - 1));
      if (r !== esp || r >= 11) m.push(`más peso: ${r} (esperado ${esp})`);
      S = { ...S, sug: null }; if (repsSug() !== E.d) m.push(`sin datos: ${repsSug()}`);
      S = { ...S, phase: 'myo', target: 4 }; if (repsSug() !== 4) m.push(`mini-serie: ${repsSug()}`);
    } finally { S = S0; }
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Un toque suelto no salta el descanso: hace falta un segundo toque; +30 s alarga el descanso', () => {
    const S0 = S, pila0 = pila.slice(), m = [];
    try {
      S = { ...fresh(), st: 'rest', t0: now(), last: now(), restDur: 60, label: 'x', sets: [] }; saltoConf = 0;
      document.getElementById('pad').onclick();   // primer toque: solo avisa
      if (S.st !== 'rest' || !(saltoConf > Date.now())) m.push(`primer toque: st=${S.st}`);
      document.getElementById('mas30').onclick(); if (S.restDur !== 90) m.push(`+30 s: ${S.restDur}`);
    } finally { S = S0; pila = pila0; saltoConf = 0; render(); }
    return { ok: !m.length, d: m.join('; ') };
  });

  // ---------- 10. v24: cuidar una zona por parte y nivel (en memoria; se deja todo como estaba) ----------
  // (v25: lesion = {zs: [...]}; conLes acepta una zona o una lista)
  const conLes = (les, fn) => { const L0 = lesion; try { lesion = { zs: Array.isArray(les) ? les : [les] }; aplicarEjercicios(); return fn(); } finally { lesion = L0; aplicarEjercicios(); } };
  const dentro = (d = 7) => ({ ini: new Date(Date.now() - 864e5).toISOString(), hasta: new Date(Date.now() + d * 864e5).toISOString() });
  prueba('Lo guardado antes de v24 (sin parte ni nivel) sigue igual: zona entera y dolor fuerte', () => {
    const r = normLesion({ z: 'hombro', ...dentro() }).zs[0], r2 = normLesion({ z: 'hombro', p: 'xx', n: 'yy', ...dentro() }).zs[0], r3 = normLesion({ z: 'brazo', ...dentro() }).zs[0];
    const ok = r.p === 'entero' && r.n === 'fuerte' && r2.p === 'entero' && r2.n === 'fuerte' && r3.p === 'biceps_prox';
    return { ok, d: JSON.stringify([r.p, r.n, r2.p, r2.n, r3.p]) };
  });
  prueba('Niveles: molestia no cambia ejercicios; fuerte los cambia; extremo quita o pausa', () => conLes({ z: 'hombro', p: 'del_lat', n: 'leve', ...dentro() }, () => {
    const m = [], base = CAT.hombros.base.map(x => x.n).join('|');
    const nivel = n => { lesion = { zs: [{ ...lesion.zs[0], n }] }; aplicarEjercicios(); return CAT.hombros.e; };
    const L = nivel('leve'); if (L.some(x => x.lesDe) || L.filter(x => !x.levy).map(x => x.n).join('|') !== base.split('|').filter(Boolean).join('|')) m.push('molestia cambió ejercicios');
    if (!L.some(x => x.lesM && x.lesAng)) m.push('molestia sin serie recta en el de carga alta');
    const F = nivel('fuerte'); if (!F.some(x => x.lesDe)) m.push('fuerte no cambió nada');
    nivel('extremo'); if (!enPausa('hombros')) m.push('extremo: hombros debería quedar en pausa (deltoide lateral)');
    if (enPausa('pecho') || enPausa('espalda')) m.push('extremo pausó grupos que no cargan el deltoide lateral');
    return { ok: !m.length, d: m.join('; ') };
  }));
  prueba('En pausa: no se puede empezar, «Qué toca hoy» no lo propone y la rutina lo salta', () => conLes({ z: 'hombro', p: 'del_ant', n: 'extremo', ...dentro() }, () => {
    const m = [], g0 = grupo, r0 = rutI;
    if (!enPausa('pecho')) m.push('pecho no quedó en pausa');
    grupo = 'pecho'; if (!pausaInicio()) m.push('pausaInicio() no bloquea pecho');
    const q = queToca(); if (q.g === 'pecho' || (q.items || []).some(x => x.g === 'pecho')) m.push('Qué toca propone pecho');
    rutI = RUTINAS.findIndex(R => R.g && R.g.includes('pecho') && R.g.includes('triceps')); if (rutLista().includes('pecho')) m.push('la rutina Pecho + Tríceps incluye pecho');
    grupo = g0; rutI = r0;
    return { ok: !m.length, d: m.join('; ') };
  }));
  prueba('La parte cambia el resultado: tríceps afecta a tríceps y no a bíceps; tendón largo del bíceps afecta también a espalda', () => {
    const efecto = (z, p, g) => lesLista(g, CAT[g].base, { z, p, n: 'fuerte' }).some(x => x.lesDe || x.lesM);
    const m = [];
    if (!efecto('brazo', 'triceps', 'triceps') || efecto('brazo', 'triceps', 'biceps')) m.push('tríceps');
    if (!efecto('brazo', 'biceps_prox', 'espalda')) m.push('bíceps proximal no toca espalda');
    if (efecto('hombro', 'del_lat', 'pecho')) m.push('deltoide lateral toca pecho');
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Molestia con parte: se guarda en la serie y se valida al leer', () => {
    const a = normSet({ ex: 'x', k: 'act.', reps: '8', rir: '1', mol: 'hombro', molP: 'manguito' }), b = normSet({ ex: 'x', k: 'act.', reps: '8', rir: '1', mol: 'hombro', molP: 'rodilla' });
    return { ok: a.molP === 'manguito' && !b.molP, d: `${a.molP} / ${b.molP}` };
  });

  // ---------- 11. v25: varias zonas a la vez y mapa de lo que duele / se adapta ----------
  prueba('Varias zonas a la vez: manda la acción más prudente de cada una y se suman sus efectos', () => {
    const del = { z: 'hombro', p: 'del_lat', n: 'extremo', ...dentro() }, cod = { z: 'codo', p: 'posterior', n: 'fuerte', ...dentro() };
    const solo1 = conLes(del, () => ({ ph: enPausa('hombros'), tri: CAT.triceps.e.some(x => x.lesDe || x.lesM) }));
    const solo2 = conLes(cod, () => ({ ph: enPausa('hombros'), tri: CAT.triceps.e.some(x => x.lesDe || x.lesM) }));
    const ambos = conLes([del, cod], () => ({ ph: enPausa('hombros'), tri: CAT.triceps.e.some(x => x.lesDe || x.lesM), n: lesAct().length }));
    const ok = solo1.ph && !solo1.tri && !solo2.ph && solo2.tri && ambos.ph && ambos.tri && ambos.n === 2;
    return { ok, d: JSON.stringify({ solo1, solo2, ambos }) };
  });
  prueba('Añadir una zona no quita la otra; renovar la misma zona y parte no la duplica; terminar una deja la otra', () => {
    const L0 = lesion, m = [], crudo = localStorage.getItem(LESKEY);   // se restaura al final: el perfil de pruebas queda como estaba
    try {
      lesion = { zs: [] };
      try {
        lesEmpezar('hombro', 7, 'manguito', 'fuerte'); lesEmpezar('codo', 14, 'interna', 'leve');
        if (lesAct().length !== 2) m.push(`tras añadir: ${lesAct().length}`);
        lesEmpezar('hombro', 28, 'manguito', 'extremo');
        if (lesAct().length !== 2 || lesAct().find(x => x.z === 'hombro').n !== 'extremo') m.push('renovar duplicó o no cambió el nivel');
        lesNivel('codo|interna', 'fuerte'); if (lesAct().find(x => x.z === 'codo').n !== 'fuerte') m.push('lesNivel por zona');
        lesTerminar('hombro|manguito'); if (lesAct().length !== 1 || lesAct()[0].z !== 'codo') m.push(`terminar una: ${lesAct().map(lesK)}`);
      } finally { if (crudo == null) localStorage.removeItem(LESKEY); else localStorage.setItem(LESKEY, crudo); }
    } finally { lesion = L0; aplicarEjercicios(); }
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Mapa de cuidar: la parte que duele en coral; lo que se deja de entrenar y lo que se adapta, cada uno con su color', () => {
    const e = lesEfecto([{ z: 'hombro', p: 'del_ant', n: 'extremo' }]), m = [];
    if (e.cls('del_ant') !== 'ldu') m.push(`del_ant=${e.cls('del_ant')}`);
    // pecho en pausa: sus zonas o se dejan de entrenar o, si otro grupo aún las trabaja (press cerrado de tríceps), se adaptan; nunca «sin cambios»
    if (!['lqu', 'lad'].includes(e.cls('pecho_med')) || !['lqu', 'lad'].includes(e.cls('pecho_sup'))) m.push(`pecho: ${e.cls('pecho_sup')}/${e.cls('pecho_med')}`);
    if (!Object.keys(MUS).some(k => e.cls(k) === 'lqu')) m.push('ninguna zona «se deja de entrenar»');
    if (e.cls('pantorrillas') !== 'l0') m.push(`pantorrillas=${e.cls('pantorrillas')}`);
    const e2 = lesEfecto([{ z: 'brazo', p: 'biceps_prox', n: 'fuerte' }]); if (e2.cls('dorsal') !== 'lad') m.push(`bíceps proximal → dorsal=${e2.cls('dorsal')}`);
    const svg = lesMapaSVG([{ z: 'hombro', p: 'del_ant', n: 'extremo' }]);
    if (!/class="ldu"/.test(svg) || !/class="lqu"/.test(svg) || !/se deja de entrenar/.test(svg)) m.push('svg o leyenda incompletos');
    return { ok: !m.length, d: m.join('; ') };
  });

  // ---------- 12. v26 · Fase 2: casos de la auditoría inicial (en memoria; todo se restaura) ----------
  const conHist = (H, fn) => { const H0 = hist, S0 = S, g0 = grupo; try { hist = H; return fn(); } finally { hist = H0; S = S0; grupo = g0; } };
  const fil = (g, i, reps, rir, kg, extra = {}) => { const E = CAT[g].base[i]; return { ex: E.s, ej: E.n, k: 'act.', reps: String(reps), rir: String(rir), kg, P: .5, rest: 60, ...extra }; };
  const sesF = (id, g, t, sets) => ({ id, start: new Date(t).toISOString(), g, grupo: CAT[g].n, sets, series: sets.length, completa: true, meta: 6 });
  prueba('Caso 3: con un periodo vacío la actividad no se pinta como mejora y se avisa', () => conHist([sesF('c3', 'pecho', Date.now() - 36e5, [fil('pecho', 0, 10, 1, 30)])], () => {
    const m0 = cmpModo; cmpModo = 'sem'; renderCmp(); cmpModo = m0;
    const t = document.getElementById('pCmp'), verdes = [...t.querySelectorAll('td.up,td.dn')].map(td => td.closest('tr').firstChild.textContent);
    const ok = !verdes.length && /no tiene sesiones/.test(t.textContent);
    return { ok, d: verdes.length ? 'con color: ' + verdes.join(', ') : '' };
  }));
  prueba('Caso 1: la comparación explica que la suma por grupo supera a las series únicas', () => conHist([sesF('c1', 'pecho', Date.now() - 36e5, [fil('pecho', 0, 10, 1, 30), fil('pecho', 1, 10, 1, 20)])], () => {
    const m0 = cmpModo; cmpModo = 'sem'; renderCmp(); cmpModo = m0;
    return { ok: /no es doble conteo/i.test(document.getElementById('pCmp').textContent) };
  }));
  prueba('Caso 5: récord de repeticiones con la misma carga (y con peso corporal); sin línea base o sin peso no hay', () => {
    const m = [];
    const prueba1 = (kg, rirAntes, rirHoy, reps) => conHist([sesF('c5', 'biceps', Date.now() - 2 * 864e5, [fil('biceps', 0, 10, rirAntes, kg)])], () => {
      grupo = 'biceps'; S = { ...fresh(), id: 'hoy', sets: [] }; const r = fil('biceps', 0, reps, rirHoy, kg); return esRecord(r) ? (r.prT || 'e1') : 'no'; });
    if (prueba1(12, 1, 1, 11) === 'no') m.push('12 kg 10→11 reps con RIR igual: debería ser récord');
    if (prueba1(0, 1, 1, 11) !== 'reps') m.push('peso corporal 10→11: debería ser récord de reps');
    if (prueba1(12, 1, 0, 11) === 'reps') m.push('más reps pero con menos reserva (más esfuerzo): no es récord de reps comparable');
    if (prueba1(null, 1, 1, 11) !== 'no') m.push('sin peso anotado no hay carga con qué comparar');
    const sinBase = conHist([], () => { grupo = 'biceps'; S = { ...fresh(), id: 'hoy', sets: [] }; return esRecord(fil('biceps', 0, 20, 1, 12)); });
    if (sinBase) m.push('primera vez: sin línea base no hay récord');
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Caso 6: un ejercicio con molestia anotada en la zona cuidada se cambia o se quita, también con nivel «molestia»', () => {
    const E = CAT.hombros.base[0];
    return conHist([sesF('c6', 'hombros', Date.now() - 2 * 864e5, [fil('hombros', 0, 10, 1, 10, { mol: 'hombro' })])], () => {
      const L = lesLista('hombros', CAT.hombros.base, [{ z: 'hombro', p: 'entero', n: 'leve' }]), x = L[0];
      const ok = !!(x.lesDe || x.lesFuera) && !!x.lesGat && !L.some(y => y.n === E.n && !y.lesFuera);
      return { ok, d: `${E.n} → ${x.lesDe ? 'cambiado por ' + x.n : x.lesFuera ? 'quitado' : 'MANTENIDO'}` };
    });
  });
  prueba('Esquema v26: la sesión guarda versión y fechas de registro/edición; la mini-serie, su predicción y el modelo', () => {
    const s = normSes({ id: 'e', start: new Date().toISOString(), g: 'biceps', sets: [{ ex: 'x', k: 'myo', reps: '5', rir: '1', obj: 5, Cpre: .6, kc: 1, predF: 7.2, mod: 'rec-1' }, { ex: 'x', k: 'act.', reps: '9', rir: '1', pr: true, prT: 'reps' }],
      esq: 2, creada: '2026-10-20T10:00:00.000Z', editada: '2026-10-21T10:00:00.000Z' });
    const ok = s.esq === 2 && s.creada && s.editada && s.sets[0].predF === 7.2 && s.sets[0].mod === 'rec-1' && s.sets[1].prT === 'reps' && MODELO_REC === 'rec-2p';   // v27: procedimiento vigente
    return { ok, d: JSON.stringify({ esq: s.esq, creada: !!s.creada, predF: s.sets[0].predF, prT: s.sets[1].prT }) };
  });

  // ---------- 13. v27 · Fase 4: aprendizaje de recuperación evaluado en orden temporal (datos sintéticos en memoria) ----------
  // sesiones con serie principal (RTF = 12 + 1) y mini-series con predicción guardada (Cpre = 0,7 → 9,1 reps hasta el fallo)
  const sesRec = (n, hechoDe, g = 'biceps') => Array.from({ length: n }, (_, i) => {
    const E = CAT[g].base[0], pf = 13 * .7, obs = hechoDe(pf, i);
    return { id: 'r' + i, start: new Date(Date.now() - (n - i) * 864e5).toISOString(), g, grupo: CAT[g].n, completa: true, meta: 6,
      sets: [{ ex: E.s, ej: E.n, k: 'act.', reps: '12', rir: '1' }, { ex: E.s, ej: E.n, k: 'myo', reps: String(obs - 1), rir: '1', obj: 6, Cpre: .7, kc: 1 }] };
  });
  const conRec = (H, fn) => { const H0 = hist, c0 = calibC; try { hist = H; calibC = {}; recMemo = { k: '', v: null }; return fn(); } finally { hist = H0; calibC = c0; recMemo = { k: '', v: null }; } };
  prueba('Fase 4: sin fuga del futuro — la primera predicción es la del fijo y cada una usa solo las anteriores', () => conRec(sesRec(10, (pf, i) => i < 5 ? Math.round(pf * .7) : 30), () => {
    const ev = evalRec().biceps.ev, m = [];
    if (Math.abs(ev[0].p3 - ev[0].p0) > 1e-9) m.push('la primera ya estaba ajustada');
    if (ev[4].p3 > ev[4].p0) m.push('la quinta (tras 4 por debajo) predijo por encima: usó datos futuros');
    return { ok: !m.length, d: m.join('; ') };
  }));
  prueba('Fase 4: el modelo anterior (reps/objetivo) no aprende si aceptas el número propuesto; el nuevo sí ve el sesgo', () => conRec(sesRec(24, pf => Math.round(pf * .75)).map(h => (h.sets[1].obj = +h.sets[1].reps, h)), () => {
    const R = evalRec().biceps;
    return { ok: Math.abs(R.mae1 - R.mae0) < 1e-9 && R.mae3 < R.mae0, d: `rec-1 ${R.mae1.toFixed(2)} = fijo ${R.mae0.toFixed(2)} · rec-2p ${R.mae3.toFixed(2)}` };
  }));
  prueba('Fase 4: sesgo sistemático con ≥ 20 observaciones → se usa lo aprendido (k < 1) y queda registrado; con el fijo acertando, no', () => {
    const a = conRec(sesRec(24, pf => Math.round(pf * .75)), () => ({ u: evalRec().biceps.usa, k: kDe('biceps'), m: modDe('biceps') }));
    const b = conRec(sesRec(24, (pf, i) => Math.round(pf) + (i % 2 ? 1 : -1)), () => ({ u: evalRec().biceps.usa, k: kDe('biceps') }));
    const pocos = conRec(sesRec(6, pf => Math.round(pf * .75)), () => evalRec()._.bien);
    const ok = a.u && a.k < 1 && a.m === 'rec-2p' && !b.u && b.k === 1 && !pocos;
    return { ok, d: JSON.stringify({ sesgo: a, sinSesgo: b, pocosDatos: pocos }) };
  });
  prueba('Fase 4: estado del modelo validado al leer (k fuera de rango o modelo desconocido se descartan)', () => {
    const r = normModelo({ sel: { biceps: { m: 'rec-2p', k: 5 }, triceps: { m: 'magia', k: .9 }, pecho: { m: 'rec-2p', k: .88 } }, log: [{ t: 'x' }] });
    return { ok: !r.sel.biceps && !r.sel.triceps && r.sel.pecho.k === .88 && r.log.length === 0, d: JSON.stringify(r) };
  });

  // ---------- 14. v28 · Fase 5: estancamiento, preparación, respuesta al volumen y plan (en memoria) ----------
  const pts = v => v.map((x, i) => ({ t: i * 864e5, v: x }));
  prueba('Fase 5: clasificación de tendencias (insuficiente, mejora, caída, estable, variable, estancamiento)', () => {
    const c = v => anClasifica(pts(v)).estado, m = [];
    const casos = [[[10, 11, 12], 'insuficiente'], [[10, 11, 12, 13, 14], 'mejora'], [[14, 13, 12, 11, 10], 'caida'], [[12, 12.2, 11.9, 12.1], 'estable'],
      [[10, 14, 9, 15, 10, 14], 'variable'], [[12, 12.1, 11.9, 12, 12.05, 11.95, 12], 'estancado']];
    casos.forEach(([v, e]) => { if (c(v) !== e) m.push(`${v.join(',')} → ${c(v)} (esperado ${e})`); });
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Fase 5: la pendiente de Theil–Sen no la arrastra un dato raro', () => {
    const a = anTheilSen([10, 11, 12, 13, 14]), b = anTheilSen([10, 11, 40, 13, 14]);
    return { ok: Math.abs(a - 1) < 1e-9 && Math.abs(b - 1) < .6, d: `${a} / ${b}` };
  });
  prueba('Fase 5: rendimiento comparable solo con la misma carga; «3+» no entra; sin peso se comparan reps hasta el fallo', () => conHist([
    sesF('a1', 'biceps', Date.now() - 4 * 864e5, [fil('biceps', 0, 10, 1, 12), fil('biceps', 1, 10, '3+', null)]),
    sesF('a2', 'biceps', Date.now() - 2 * 864e5, [fil('biceps', 0, 11, 1, 12), fil('biceps', 1, 12, 1, null)]),
    sesF('a3', 'biceps', Date.now() - 1 * 864e5, [fil('biceps', 0, 9, 1, 14)])], () => {
    const C = anComparables(), e0 = CAT.biceps.base[0].n, e1n = CAT.biceps.base[1].n;
    const conPeso = C.find(s => s.ej === e0 && s.carga === 'peso'), sinPeso = C.find(s => s.ej === e1n);
    const ok = conPeso && conPeso.pts.length === 3 && sinPeso && sinPeso.pts.length === 1 && sinPeso.pts[0].v === 13;
    return { ok, d: JSON.stringify(C.map(s => [s.ej.slice(0, 12), s.carga, s.pts.length])) };
  }));
  prueba('Fase 5: preparación por zona — cuidar si hay cuidado activo, esperar tras estímulo directo reciente, recuperación nunca inventada', () => conHist([
    sesF('p1', 'biceps', Date.now() - 5 * 36e5, [fil('biceps', 0, 10, 1, 12)])], () => {
    const m = [], z = anZona('biceps');
    if (z.prep.e !== 'espera') m.push(`bíceps entrenado hace 5 h: ${z.prep.e}`);
    if (z.recup.fiable !== false || !/Sin estimación fiable/.test(z.recup.txt)) m.push('recuperación inventada');
    if (anZona('biceps', { reglaH: 4 }).prep.e !== 'listo') m.push('cambiar el supuesto (regla 4 h) no cambia la evaluación');
    const L0 = lesion; try { lesion = { zs: [{ z: 'brazo', p: 'biceps_prox', n: 'leve', ...dentro() }] }; if (anZona('biceps').prep.e !== 'cuidar') m.push('cuidado activo no marca cuidar'); } finally { lesion = L0; }
    return { ok: !m.length, d: m.join('; ') };
  }));
  prueba('Fase 5: respuesta al volumen — sin 4 pares de semanas no hay correlación; Spearman correcto', () => conHist([sesF('v1', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, 30)])], () => {
    const r = anVolumen('pecho'), s1 = anSpearman([1, 2, 3, 4], [10, 20, 30, 40]), s2 = anSpearman([1, 2, 3, 4], [4, 3, 2, 1]);
    return { ok: r.rho === null && Math.abs(s1 - 1) < 1e-9 && Math.abs(s2 + 1) < 1e-9, d: `rho=${r.rho} s1=${s1} s2=${s2}` };
  }));
  prueba('Fase 5: plan — aplazar tras < 48 h o en pausa; mantener sin señales; cada recomendación con motivos', () => {
    const m = [];
    conHist([sesF('q1', 'pecho', Date.now() - 5 * 36e5, [fil('pecho', 0, 10, 1, 30)])], () => { const p = anPlanGrupo('pecho'); if (p.acc !== 'aplazar' || !p.mot.length) m.push(`pecho hace 5 h: ${p.acc}`); });
    conHist([sesF('q2', 'pecho', Date.now() - 4 * 864e5, [fil('pecho', 0, 10, 1, 30)])], () => { const p = anPlanGrupo('pecho'); if (p.acc !== 'mantener') m.push(`pecho hace 4 días: ${p.acc} (${p.mot})`); });
    conLes({ z: 'hombro', p: 'del_lat', n: 'extremo', ...dentro() }, () => conHist([], () => { const p = anPlanGrupo('hombros'); if (p.acc !== 'aplazar') m.push(`hombros en pausa: ${p.acc}`); }));
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Fase 5: las vistas de análisis y la tarjeta del plan se pintan sin textos rotos', () => {
    const m = [], t0 = tab;
    for (const t of ['prep', 'est', 'vol']) { anTab = t; renderAnalisis(); if (/undefined|NaN|\[object/.test(document.getElementById('pAnal').textContent)) m.push(t); }
    anTab = 'prep'; anSelZ = 'pecho_med'; renderAnalisis(); if (/undefined|NaN/.test(document.getElementById('pAnal').textContent)) m.push('detalle'); anSelZ = '';
    tab = 'reloj'; renderPlanHoy(); if (!document.getElementById('planHoy').textContent.includes('Plan para')) m.push('plan'); tab = t0;
    return { ok: !m.length, d: m.join(', ') };
  });

  // ---------- 15. v29 · Fase 6: validación integral (escenarios de la lista; en memoria) ----------
  prueba('Fase 6: usuario nuevo sin historial — nada se rompe y nada se inventa', () => conRec([], () => {
    const m = [], R = evalRec();
    if (R._.bien || kDe('biceps') !== 1) m.push('modelo activo sin datos');
    if (anZona('biceps').prep.e !== 'nada') m.push('preparación inventada');
    if (anComparables().length) m.push('comparables sin datos');
    const a = auditarDatos(); if (a.errores.length) m.push('auditoría con errores: ' + a.errores.map(x => x.c));
    for (const t of ['prep', 'est', 'vol']) { anTab = t; renderAnalisis(); if (/undefined|NaN/.test(document.getElementById('pAnal').textContent)) m.push('vista ' + t); }
    return { ok: !m.length, d: m.join('; ') };
  }));
  prueba('Fase 6: varias sesiones en un día y una después de medianoche cuentan en su día local', () => {
    const d = new Date(); d.setHours(0, 30, 0, 0); const t1 = d.getTime(), t0 = t1 - 864e5 + 22 * 36e5;   // ayer 22:30 y hoy 00:30
    return conHist([sesF('m1', 'pecho', t0, [fil('pecho', 0, 10, 1, 30)]), sesF('m2', 'biceps', t0 + 36e5 / 2, [fil('biceps', 0, 10, 1, 12)]), sesF('m3', 'triceps', t1, [fil('triceps', 0, 10, 1, 10)])], () => {
      const pd = porDia(), k0 = diaK(t0), k1 = diaK(t1);
      const ok = k0 !== k1 && pd[k0] && pd[k0].size === 2 && pd[k1] && pd[k1].size === 1;
      return { ok, d: JSON.stringify(Object.fromEntries(Object.entries(pd).map(([k, v]) => [k, [...v]]))) };
    });
  });
  prueba('Fase 6: kilos y libras — ida y vuelta exacta y sin falsos avisos de conversión', () => {
    const u0 = CFG.uni, m = [];
    try {
      CFG.uni = 'lb'; [45, 50, 52.5, 135, 225].forEach(lb => { if (Math.abs(aU(deU(lb)) - lb) > 1e-6) m.push(`${lb} lb`); });
      const H = [sesF('k1', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, deU(135)), fil('pecho', 1, 10, 1, 20)])];
      conHist(H, () => { if (auditarDatos().avisos.some(x => x.c === 'kg-lb')) m.push('aviso de conversión con pesos válidos'); });
      conHist([sesF('k2', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, 20.123)])], () => { if (!auditarDatos().avisos.some(x => x.c === 'kg-lb')) m.push('no avisa de un peso imposible en kg y en lb'); });
    } finally { CFG.uni = u0; }
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Fase 6: una mini-serie con otra carga que la serie principal no entra en el aprendizaje', () => {
    const E = CAT.biceps.base[0], h = { id: 'cc', start: new Date(Date.now() - 864e5).toISOString(), g: 'biceps', grupo: 'Bíceps', completa: true, meta: 6,
      sets: [{ ex: E.s, ej: E.n, k: 'act.', reps: '12', rir: '1', kg: 12 }, { ex: E.s, ej: E.n, k: 'myo', reps: '6', rir: '1', obj: 6, Cpre: .7, kc: 1, kg: 12 }, { ex: E.s, ej: E.n, k: 'myo', reps: '9', rir: '1', obj: 6, Cpre: .7, kc: 1, kg: 8 }] };
    return conRec([h], () => { const n = obsRec().length; return { ok: n === 1, d: `observaciones: ${n} (esperada 1)` }; });
  });
  prueba('Fase 6: degradación — si tu respuesta cambia y el aprendido empieza a fallar, vuelve al fijo', () => {
    const antes = sesRec(30, pf => Math.round(pf * .75)), despues = sesRec(40, pf => Math.round(pf * 1.15)).map((h, i) => ({ ...h, id: 'd' + i, start: new Date(Date.now() + (i + 1) * 36e5 - 50 * 864e5 + 40 * 864e5).toISOString() }));
    const a = conRec(antes, () => evalRec()._.bien), b = conRec([...antes, ...despues], () => ({ bien: evalRec()._.bien, k: kDe('biceps') }));
    return { ok: a === true && b.bien === false && b.k === 1, d: JSON.stringify({ antes: a, despues: b }) };
  });
  prueba('Fase 6: la auditoría detecta lo que debe (ids repetidos, efectivas que no salen de sus series, fecha futura) y no inventa errores', () => {
    const ok1 = conHist([sesF('z1', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, 30)])], () => auditarDatos().errores.length === 0);
    const malo = [sesF('z2', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, 30)]), sesF('z2', 'pecho', Date.now() - 2 * 864e5, [fil('pecho', 0, 10, 1, 30)]),
      { ...sesF('z3', 'biceps', Date.now() + 5 * 864e5, [fil('biceps', 0, 10, 1, 12)]), efectivas: 9 }];
    const cods = conHist(malo, () => auditarDatos().errores.map(x => x.c));
    const ok = ok1 && ['id-duplicado', 'futuro', 'efectivas'].every(c => cods.includes(c));
    return { ok, d: `limpio=${ok1} · detectados: ${cods.join(', ')}` };
  });
  prueba('Fase 6: retomar — el estado de una sesión interrumpida sobrevive a guardar y leer', () => {
    const S0 = S, raw = localStorage.getItem(ENKEY), m = [];
    try {
      S = { ...fresh(), id: 'int1', start: new Date().toISOString(), st: 'rest', sets: [fil('biceps', 0, 10, 1, 12)], ef: 1, meta: 6, t0: now(), restDur: 60 };
      guardarEnCurso(); const o = leerEnCurso();
      if (!o || o.S.id !== 'int1' || o.S.st !== 'rest' || o.S.sets.length !== 1) m.push(JSON.stringify(o && o.S && { id: o.S.id, st: o.S.st }));
    } finally { S = S0; if (raw == null) localStorage.removeItem(ENKEY); else localStorage.setItem(ENKEY, raw); }
    return { ok: !m.length, d: m.join('; ') };
  });

  // ---------- 16. v30 · Fase 3: navegación y pantallas ----------
  prueba('Fase 3: barra con 5 destinos; cada uno muestra solo su pantalla; Ajustes, Aprendizaje y Auditoría cuelgan de «Más» con vuelta', () => {
    const m = [], t0 = tab, nav = [...document.querySelectorAll('nav button')].map(b => b.id);
    if (nav.join() !== 'tReloj,tHoy,tProg,tHist,tMas') m.push('barra: ' + nav.join());
    const vis = () => ['vReloj', 'vHoy', 'vProg', 'vHist', 'vMas', 'vEstilo', 'vApr', 'vAud'].filter(v => !document.getElementById(v).hidden);
    for (const [b, v] of [['tReloj', 'vReloj'], ['tHoy', 'vHoy'], ['tProg', 'vProg'], ['tHist', 'vHist'], ['tMas', 'vMas'], ['tEstilo', 'vEstilo'], ['tApr', 'vApr'], ['tAud', 'vAud']]) {
      document.getElementById(b).click(); const w = vis(); if (w.join() !== v) m.push(`${b} → ${w.join()}`);
      if (['vEstilo', 'vApr', 'vAud'].includes(v) && document.getElementById('tMas').getAttribute('aria-current') !== 'page') m.push(`${v}: «Más» no resaltado`); }
    document.querySelector('#vApr [data-volver]').click(); if (vis().join() !== 'vMas') m.push('volver de Aprendizaje');
    tab = t0; render();
    return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Fase 3: Progreso con pestañas internas (Resumen, Análisis, Volumen, Por ejercicio)', () => {
    const m = [], t0 = tab; document.getElementById('tProg').click();
    for (const [k, id] of [['anal', 'pgAnal'], ['vol', 'pgVol'], ['ej', 'pgEj'], ['res', 'pgRes']]) {
      document.querySelector(`[data-psub="${k}"]`).click();
      const vis = ['pgRes', 'pgAnal', 'pgVol', 'pgEj'].filter(x => !document.getElementById(x).hidden);
      if (vis.join() !== id) m.push(`${k} → ${vis.join()}`); }
    tab = t0; render(); return { ok: !m.length, d: m.join('; ') };
  });
  prueba('Fase 3: Hoy — plan con «¿por qué?», todos los grupos y preparación; «Entrenar» lleva al reloj con ese grupo', () => conHist([sesF('h1', 'pecho', Date.now() - 4 * 864e5, [fil('pecho', 0, 10, 1, 30)])], () => {
    const m = [], g0 = grupo, t0 = tab; document.getElementById('tHoy').click();
    if (document.querySelectorAll('#hoyGrupos tbody tr').length !== Object.keys(CAT).length) m.push('tabla de grupos');
    if (!document.querySelector('#hoyPrep .fig')) m.push('mapa de preparación');
    const b = document.querySelector('#hoyGrupos [data-entrenar="g:triceps"]'); b.click();
    if (tab !== 'reloj' || grupo !== 'triceps') m.push(`entrenar → tab ${tab}, grupo ${grupo}`);
    grupo = g0; tab = t0; renderGrupos(); render(); return { ok: !m.length, d: m.join('; ') };
  }));
  prueba('Fase 3: Volumen detallado — únicas ≤ suma de atribuciones y el desglose de una fila suma su total', () => conHist([sesF('vd', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, 30), fil('pecho', 1, 10, 1, 20)])], () => {
    const { U, unicas } = psVolumen(7, 'g'), suma = Object.values(U).reduce((s, o) => s + o.dir + o.ind, 0);
    const o = U.pecho, desg = o.filas.reduce((s, x) => s + x.c * x.f, 0);
    const ok = unicas <= suma + 1e-9 && Math.abs(desg - (o.dir + o.ind)) < 1e-9 && Math.abs(unicas - efDe(sesF('x', 'pecho', 0, [fil('pecho', 0, 10, 1, 30), fil('pecho', 1, 10, 1, 20)]).sets)) < 1e-9;
    return { ok, d: `únicas ${unicas} · suma ${suma} · pecho ${o.dir + o.ind} = desglose ${desg}` };
  }));
  prueba('Fase 3: Historial — los filtros y el día del calendario acotan la lista; quitar filtros la recupera', () => conHist([
    sesF('f1', 'pecho', Date.now() - 864e5, [fil('pecho', 0, 10, 1, 30)]), sesF('f2', 'biceps', Date.now() - 3 * 864e5, [fil('biceps', 0, 10, 1, 12)]), sesF('f3', 'biceps', Date.now() - 40 * 864e5, [fil('biceps', 0, 10, 1, 12)])], () => {
    const m = [], F0 = { ...histF };
    try {
      histF = { g: 'biceps', ej: '', k: '', dias: 0, dia: '' }; if (histVisibles().length !== 2) m.push('grupo');
      histF = { g: 'biceps', ej: '', k: '', dias: 28, dia: '' }; if (histVisibles().length !== 1) m.push('periodo');
      histF = { g: '', ej: '', k: '', dias: 0, dia: diaK(Date.now() - 864e5) }; if (histVisibles().length !== 1) m.push('día');
      histF = { g: '', ej: '', k: 'myo', dias: 0, dia: '' }; if (histVisibles().length !== 0) m.push('tipo');
      histF = { g: '', ej: '', k: '', dias: 0, dia: '' }; if (histVisibles().length !== 3) m.push('sin filtros');
    } finally { histF = F0; }
    return { ok: !m.length, d: m.join(', ') };
  }));

  // ---------- 7. Los datos originales no se tocan ----------
  prueba('Pintar todas las vistas no modifica las sesiones guardadas', () => localStorage.getItem(KEY) === crudoAntes);

  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
