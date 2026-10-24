// v33 · Pruebas de la música reactiva (musica.js). Se renderiza una sesión simulada con OfflineAudioContext (sin altavoz) y se
// mide el audio de cada fase; además se comprueba qué modo pide el reloj en cada estado. Resultado en <pre id="resultado">.
'use strict';
(async () => {
  const out = []; let ok = 0, n = 0;
  const prueba = async (nombre, fn) => { n++; let r; try { r = await fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message }; }
    if (r === true) r = { ok: true }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); };
  const SR = 22050, db = x => (20 * Math.log10(Math.max(x, 1e-9))).toFixed(1);
  // serie 0–8 s · descanso: calma 8–14 s y subida 14–22 s (termina a los 22 s) · serie siguiente (drop) 22–30 s · fin
  async function sesion(estilo) {
    const ctx = new OfflineAudioContext(1, SR * 32, SR), M = crearMusica(); M.inicia(ctx); M.estilo(estilo); M.vol(.6);
    M.fija('full', 0, 'prueba-' + estilo, 0); M.ciclo(0, 8);
    M.fija('calma', 14, null, 8); M.ciclo(8, 14);
    M.fija('build', 8, null, 14); M.ciclo(14, 22);
    M.fija('full', 0, null, 22); M.ciclo(22, 30);
    M.fija('fin', 0, null, 30); M.ciclo(30, 32);
    // el render va en el hilo de audio; con el «tiempo virtual» de Chrome sin pantalla el hilo principal debe darle tiempo real
    let b = null; ctx.startRendering().then(x => { b = x; });
    for (let k = 0; k < 60 && !b; k++) { let x = 0; for (let i = 0; i < 2e8; i++) x += i; void x; await new Promise(r => setTimeout(r, 0)); }
    if (!b) throw new Error('el render no terminó');
    const d = b.getChannelData(0);
    const rms = (a, z) => { let s = 0; const i0 = Math.floor(a * SR), i1 = Math.floor(z * SR); for (let i = i0; i < i1; i++) s += d[i] * d[i]; return Math.sqrt(s / (i1 - i0)); };
    let pico = 0, nan = 0; for (const v of d) { if (!isFinite(v)) nan++; else pico = Math.max(pico, Math.abs(v)); }
    return { full: rms(1, 7.5), calma: rms(9.5, 13.5), buildIni: rms(14.2, 16.5), buildFin: rms(19.5, 21.9), drop: rms(22.05, 24), sigue: rms(25, 29), fin: rms(31.5, 32), pico, nan };
  }
  for (const e of Object.keys(MUS_ESTILOS)) {
    await prueba(`${MUS_ESTILOS[e].n}: la serie suena, el descanso baja, la subida crece, el drop cae al empezar la serie y no satura`, async () => {
      const r = await sesion(e), m = [];
      if (r.nan) m.push(`${r.nan} muestras no numéricas`);
      if (!(r.full > .02)) m.push('la serie casi no suena');
      if (!(r.calma < r.full * .6)) m.push(`el descanso no baja lo bastante (${db(r.calma)} frente a ${db(r.full)} dB)`);
      if (!(r.buildFin > r.buildIni * 1.25)) m.push(`la subida no crece (${db(r.buildIni)} → ${db(r.buildFin)} dB)`);
      if (!(r.drop > r.calma * 1.6 && r.drop > r.full * .7)) m.push(`el drop no se nota (${db(r.drop)} dB)`);
      if (!(r.drop > r.buildFin)) m.push(`la subida acaba más fuerte que el drop (${db(r.buildFin)} frente a ${db(r.drop)} dB): el golpe se sentiría como una bajada`);
      if (!(r.sigue > r.full * .7)) m.push('tras el drop la música no sigue completa');
      if (!(r.pico <= 1.05)) m.push(`satura: pico ${r.pico.toFixed(2)}`);
      if (!(r.fin < r.full * .25)) m.push('no se apaga al terminar');
      return { ok: !m.length, d: (m.join('; ') || 'ok') + ` · dB: serie ${db(r.full)} · descanso ${db(r.calma)} · subida ${db(r.buildIni)}→${db(r.buildFin)} · drop ${db(r.drop)} · final ${db(r.fin)} · pico ${r.pico.toFixed(2)}` };
    });
  }
  await prueba('El reloj pide el modo correcto en cada estado (y nada si la música está desactivada)', () => {
    const S0 = S, C0 = CFG.musica, m = [];
    try {
      CFG.musica = { on: false, estilo: 'elec', vol: .6 }; S = { ...fresh(), st: 'work', phase: 'act' }; if (musModo()[0] !== 'off') m.push('desactivada suena');
      CFG.musica = { on: true, estilo: 'elec', vol: .6 };
      const caso = (st, extra, esp) => { S = { ...fresh(), st, ...extra }; const [md] = musModo(); if (md !== esp) m.push(`${st}${extra.phase ? '/' + extra.phase : ''}: ${md} (esperado ${esp})`); };
      caso('idle', {}, 'off'); caso('work', { phase: 'act' }, 'full'); caso('work', { phase: 'myo' }, 'full'); caso('work', { phase: 'hold' }, 'medio');
      caso('cal', {}, 'medio'); caso('report', {}, 'medio'); caso('done', {}, 'fin');
      caso('rest', { t0: now() - 5, restDur: 60 }, 'calma'); caso('rest', { t0: now() - 52, restDur: 60 }, 'build');
      caso('rest', { t0: now() - 2, restDur: 12 }, 'calma'); caso('rest', { t0: now() - 6, restDur: 12 }, 'build');   // descanso corto: la subida ocupa el último 60 %
      caso('trans', { t0: now() - 85, restDur: 90 }, 'build');
    } finally { S = S0; CFG.musica = C0; }
    return { ok: !m.length, d: m.join('; ') };
  });
  await prueba('Ajustes: la música viene desactivada y su configuración se valida', () => {
    const a = normCfg({ musica: { on: true, estilo: 'xx', vol: 7 } }), b = normCfg({ musica: { on: true, estilo: 'lofi', vol: .3 } });
    return { ok: a.musica.on === true && a.musica.estilo === 'elec' && a.musica.vol === .6 && b.musica.estilo === 'lofi' && b.musica.vol === .3 && musCfg().on === false && !!$('cMus') && /Música: no/.test($('cMus').textContent),
      d: JSON.stringify({ a: a.musica, b: b.musica }) };
  });
  out.unshift(`${ok} de ${n} pruebas pasan`);
  const p = document.createElement('pre'); p.id = 'resultado'; p.textContent = out.join('\n'); document.body.append(p);
})();
