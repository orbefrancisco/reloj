// Muestra en texto plano lo que la pestaña «Rendimiento y recuperación» pinta para el bíceps en el escenario de fatiga acumulada.
//     node _pruebas/node/ver_texto.js
'use strict';
const cargar = require('./entorno');
const T = new Date(2026, 9, 22, 18).getTime(), D = 864e5; let n = 0;
const s = (d, reps, rir, ns = 3) => ({ id: 'x' + (++n), start: new Date(T - d * D).toISOString(), g: 'biceps', grupo: 'Bíceps',
  sets: Array.from({ length: ns }, (_, i) => ({ ex: 'P', ej: 'Curl predicador', k: 'act.', reps: String(i ? reps - 2 : reps), rir: String(rir), kg: 20 })) });
const A = cargar({ ahora: T, hist: [s(20, 10, 1), s(16, 10, 1), s(12, 10, 1), s(8, 8, 0, 5), s(4, 8, 0, 5)].reverse() });
A.ev('anTab="rend"');
const plano = h => h.replace(/<\/(p|li|tr|summary|div)>/g, '\n').replace(/<td>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/\n\s*\n+/g, '\n');
console.log(plano(A.ev('rdGrupoHTML("biceps")')));
console.log('--- plan de hoy:\n' + A.ev('anPlanGrupo("biceps").mot.join("\\n")'));
