// v40 · Imprime en Markdown el calendario de 28 días y las 24 prescripciones tal como las genera programa.js (sin historial:
// las cargas salen «pendiente de calibración»).   node _pruebas/node/ver_programa.js [AAAA-MM-DD lunes]
'use strict';
const cargar = require('./entorno');
const ini = process.argv[2] || '2026-11-02';
const A = cargar({ ahora: Date.parse(ini + 'T10:00:00-04:00') - 864e5 });
const V = `{ini:'${ini}',ses:{},rep:{},id:'v'}`, ev = s => A.ev(s);
const dias = ev(`pgDias('${ini}')`), L = [];
L.push(`## Calendario (${ini} → ${ev(`pgSuma('${ini}',27)`)})`, '', '| Semana | Lun | Mar | Mié | Jue | Vie | Sáb | Dom |', '|---|---|---|---|---|---|---|---|');
for (let w = 0; w < 4; w++) L.push(`| ${w + 1} | ` + dias.slice(w * 7, w * 7 + 7).map(d => `${d.n} · ${d.f.slice(8)}/${d.f.slice(5, 7)}<br>${d.pl ? ev(`PG_PLANT['${d.pl}'].n`) : 'DESCANSO'}`).join(' | ') + ' |');
L.push('', '## Las 24 prescripciones', '');
for (const d of dias.filter(x => x.sid)) {
  const P = ev(`pgPresc('${d.sid}',{},${V})`);
  L.push(`### Día ${d.n} · ${ev(`PG_DOW[${d.dw}]`)} ${d.f} · semana ${d.sem} · ${P.nom} (${P.series} series)`, '',
    '| # | Ejercicio | Series × reps objetivo (rango) | Carga | RIR por serie | Descanso | Calentamiento |', '|---|---|---|---|---|---|---|');
  P.ejs.forEach((e, i) => L.push(`| ${i + 1} | ${e.n} | ${e.series} × ${e.reps.join('/')} (${e.lo}–${e.hi}) | ${e.cp ? 'peso corporal' : e.kg != null ? e.kg + ' kg' : 'pendiente de calibración'} | ${e.rir.map(r => r[0] === r[1] ? r[0] : r[0] + '–' + r[1]).join(' · ')} | ${Math.floor(e.rest / 60)}:${String(e.rest % 60).padStart(2, '0')} | ${e.cal} |`));
  const vol = Object.entries(P.vol.Z).filter(([, o]) => o.dir > 0).sort((a, b) => b[1].dir - a[1].dir).map(([z, o]) => `${ev(`MUS['${z}'][3]`)} ${o.dir}${o.ind ? ` (+${Math.round(o.ind * 100) / 100})` : ''}`).join(' · ');
  L.push('', `Volumen: ${vol}`, '');
}
L.push('## Notas de técnica', '', ...Object.values(ev('PG_EJ')).map(e => `- **${e.n}**: ${e.tec}`));
console.log(L.join('\n'));
