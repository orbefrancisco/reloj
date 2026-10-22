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
  prueba('Detalle de una zona: directas + indirectas = valor de la fila', () => {
    mapaSel = 'biceps'; renderMapa();
    const p = document.querySelector('#pMapa [data-desg="biceps"]'), z = V.zonas.biceps;
    const ok = p && p.textContent.startsWith(`${ef1(z.dir)} directas + ${ef1(z.ind)} indirectas`) && casi(z.dir + z.ind, V.zona('biceps'));
    mapaSel = ''; renderMapa();
    return { ok: !!ok, d: p ? p.textContent.slice(0, 60) : 'sin detalle' };
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
      return el.dataset.est !== estadoVol(V.zona(m), MUS[m][2]) || !el.querySelector('.mr') || el.querySelector('.mr').textContent !== MUS[m][2].join('–'); });
    return { ok: !malos.length, d: malos.join(', ') };
  });
  prueba('Misma magnitud → mismo rango: grupos de una sola zona (tríceps, abdomen) frente a su zona del mapa', () => {
    const conflictos = Object.keys(CAT).filter(g => zonasDe(g).length === 1).map(g => {
      const m = zonasDe(g)[0], rg = semRango(g), rz = MUS[m][2];
      return rg[0] === rz[0] && rg[1] === rz[1] ? null : `${CAT[g].n}: grupo ${rg.join('–')} vs zona ${rz.join('–')} (con ${ef1(V.grupo(g))} serían «${EST_MUS[estadoVol(V.grupo(g), rg)]}» y «${EST_MUS[estadoVol(V.zona(m), rz)]}»)`;
    }).filter(Boolean);
    return { ok: !conflictos.length, d: conflictos.length ? 'PENDIENTE DE DECISIÓN — ' + conflictos.join('; ') : '' };
  });

  // ---------- 7. Los datos originales no se tocan ----------
  prueba('Pintar todas las vistas no modifica las sesiones guardadas', () => localStorage.getItem(KEY) === crudoAntes);

  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
