// v34 · Pruebas de «Otro ejercicio hoy» (pantallas.js): solo un ejercicio, añadir, cambiar, que cuente para el grupo y los
// músculos, que el plan de siempre no cambie, retomar, cambio de día e interfaz. Resultado en <pre id="resultado">.
'use strict';
(() => {
  const out = []; let ok = 0, n = 0;
  const prueba = (nombre, fn) => { n++; let r; try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
    if (r === true) r = { ok: true }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  const H0 = hist, S0 = S, g0 = grupo, cfg0 = CFG.cal, LS0 = localStorage.getItem(KEY), ej0 = JSON.stringify(misEj);
  const limpio = fn => { const h = hist; try { hist = []; hoyBorra(); CFG.cal = false; SS = null; rutPos = 0; fzaHoy = false; pila = []; return fn(); }
    finally { hist = h; S = S0; grupo = g0; CFG.cal = cfg0; hoyBorra(); hoyF = null; } };
  const usa = (g, nom, modo, meta, cambia = 0) => { hoyF = { g, n: nom, otro: '', modo, cambia, meta, q: '' }; hoyUsar(); };
  const empieza = () => { S = fresh(); iniciarSesion(); S.st = 'work'; S.t0 = now() - 30; };
  const reporta = (R, rir) => { S.st = 'report'; S.workDur = 30; S.hechas = R; aplicar({ R, rir, dur: 30 }); };
  const PMR = 'Peso muerto rumano';

  prueba('Solo un ejercicio: la sesión es ese ejercicio, con su meta, y se termina sola', () => limpio(() => {
    usa('piernas', PMR, 'solo', 3); const m = [];
    if (!hoyDe('piernas')) m.push('no quedó guardado para hoy');
    empieza(); if (!S.planE || S.planE.length !== 1 || est().n !== PMR || S.meta !== 3 || S.metaE.join() !== '3') m.push('plan ' + JSON.stringify({ n: S.planE && S.planE.map(x => x.n), meta: S.meta, metaE: S.metaE }));
    if (hoyDe('piernas')) m.push('no se consumió al empezar');
    let k = 0; while (S.st !== 'done' && k++ < 40) { if (S.st === 'work' && (S.phase === 'hold' || S.phase === 'vac')) { aplicar({ hold: 30 }); continue; } reporta(S.phase === 'act' ? 10 : Math.max(3, S.target || 5), 1); }
    if (S.st !== 'done') m.push('no terminó: ' + S.st);
    const h = hist[0]; if (!h || h.g !== 'piernas' || !(h.sets || []).every(r => r.ej === PMR)) m.push('sesión guardada ' + JSON.stringify(h && { g: h.g, ejs: [...new Set(h.sets.map(r => r.ej))] }));
    if (!h.completa) m.push('no quedó «Completa» al llegar a la meta');
    return { ok: !m.length, d: m.join('; ') || `${h.sets.length} series de ${PMR}, ${ef1(h.efectivas)} efectivas, completa` };
  }));
  prueba('Cuenta para el volumen del grupo y de sus músculos (isquios, glúteos…)', () => limpio(() => {
    usa('piernas', PMR, 'solo', 2); empieza(); reporta(10, 1); let k = 0; while (S.st !== 'done' && k++ < 30) { if (S.phase === 'hold' || S.phase === 'vac') aplicar({ hold: 30 }); else reporta(Math.max(3, S.target || 5), 1); }
    const V = volSemana(0), isq = V.zona('isquios'), gr = V.grupo('piernas');
    return { ok: gr > 0 && isq > 0, d: `piernas ${ef1(gr)} · isquios ${ef1(isq)} · glúteos ${ef1(V.zona('gluteos'))}` };
  }));
  prueba('El plan de siempre no cambia (ni tus ejercicios guardados)', () => limpio(() => {
    const antes = CAT.piernas.e.map(x => x.n).join(); usa('piernas', PMR, 'cambiar', 9, 1); empieza();
    return { ok: CAT.piernas.e.map(x => x.n).join() === antes && JSON.stringify(misEj) === ej0, d: antes };
  }));
  prueba('Añadirlo a la sesión: tus ejercicios y además ese, con la meta repartida', () => limpio(() => {
    usa('piernas', 'Hip thrust', 'anadir', 12); empieza();
    const ns = S.planE.map(x => x.n), suma = S.metaE.reduce((a, b) => a + b, 0);
    return { ok: ns.length === 4 && ns[3] === 'Hip thrust' && ns.slice(0, 3).join() === CAT.piernas.e.map(x => x.n).join() && suma === 12, d: ns.join(', ') + ' · metas ' + S.metaE.join('+') };
  }));
  prueba('Cambiar uno por este: sustituye el elegido y mantiene los demás en su orden', () => limpio(() => {
    usa('piernas', 'Curl femoral sentado', 'cambiar', 9, 1); empieza(); const ns = S.planE.map(x => x.n);
    return { ok: ns.join() === ['Sentadilla hack o goblet', 'Curl femoral sentado', 'Elevación de talones'].join() && S.planE[1].hoy === true, d: ns.join(', ') };
  }));
  prueba('Un ejercicio escrito a mano (que no está en el catálogo) también vale', () => limpio(() => {
    hoyF = { g: 'piernas', n: '__otro', otro: 'Sentadilla en Smith', otro2: '', modo: 'solo', cambia: 0, meta: 3, q: '' }; hoyUsar(); empieza();
    return { ok: est().n === 'Sentadilla en Smith' && !!musculos('Sentadilla en Smith', 'piernas').cuads, d: JSON.stringify(musculos('Sentadilla en Smith', 'piernas')) };
  }));
  prueba('Retomar una sesión «solo hoy» conserva su plan', () => limpio(() => {
    usa('piernas', PMR, 'solo', 3); empieza(); reporta(10, 1);
    const o = normEnCurso(JSON.parse(JSON.stringify({ t: Date.now(), S, grupo, rutI, miaLista, rutPos, rutEf, pila })));
    return { ok: !!o && o.S.planE && o.S.planE[0].n === PMR, d: o ? JSON.stringify(o.S.planE.map(x => x.n)) : 'no se pudo normalizar' };
  }));
  prueba('Es solo de hoy: un plan guardado ayer no se usa', () => limpio(() => {
    localStorage.setItem(HOYKEY, JSON.stringify({ dia: diaK(Date.now() - 864e5), g: 'piernas', modo: 'solo', e: [{ n: PMR, s: 'Rumano', r: '8–12', ext: 'part', hoy: true }], meta: 3 }));
    return { ok: !hoyDe('piernas'), d: '' };
  }));
  prueba('Interfaz: «＋ Otro ejercicio hoy» visible con todo plegado, la hoja se abre, y las tarjetas y el resumen muestran el plan de hoy', () => limpio(() => {
    tab = 'reloj'; S = fresh(); selAbierto = false; render(); const m = [];
    const b = document.querySelector('#hoyEj [data-hoyej="abrir"]'); if (!b || $('hoyEj').hidden || !$('vReloj').classList.contains('plegado')) return { ok: false, d: 'botón no visible con todo plegado: ' + $('hoyEj').outerHTML.slice(0, 200) + ' · st=' + S.st + ' rutPos=' + rutPos + ' plegado=' + $('vReloj').className };
    b.click(); if (!$('soloDlg').open) m.push('la hoja no se abre');
    const gs = $('soloC').querySelector('[data-hoyf="g"]'); gs.value = 'piernas'; gs.dispatchEvent(new Event('change', { bubbles: true }));
    const sel = $('soloC').querySelector('[data-hoyf="n"]'); sel.value = PMR; sel.dispatchEvent(new Event('change', { bubbles: true }));
    if (hoyF.n !== PMR) m.push('el desplegable de ejercicios de piernas no ofrece ' + PMR);
    $('soloC').querySelector('[data-hoym="solo"]').click(); $('soloC').querySelector('[data-hoya="usar"]').click();
    if ($('soloDlg').open) m.push('la hoja no se cierra al usar');
    render(); if (!/solo hoy/.test($('plan').textContent)) m.push('las tarjetas no marcan «solo hoy»');
    if (!/Rumano|Peso muerto/.test($('selRes').textContent)) m.push('el resumen no muestra el ejercicio: ' + $('selRes').textContent);
    if (!/Volver a lo de siempre/.test($('hoyEj').textContent)) m.push('sin «Volver a lo de siempre»');
    document.querySelector('#hoyEj [data-hoyej="quitar"]').click(); if (hoyDe(grupo)) m.push('no se borró');
    return { ok: !m.length, d: m.join('; ') };
  }));
  // restaurar
  hist = H0; S = S0; grupo = g0; if (LS0 == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, LS0); render();
  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
