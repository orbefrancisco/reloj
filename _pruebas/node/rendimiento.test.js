// v39 · Pruebas del seguimiento de RENDIMIENTO Y RECUPERACIÓN (rendimiento.js, reglas en RENDIMIENTO.md) con los scripts REALES
// de la app cargados en Node (entorno.js). Historiales sintéticos de resultado conocido; «ahora» fijado.
//     node _pruebas/node/rendimiento.test.js        (sale con código 1 si alguna falla)
'use strict';
const cargar = require('./entorno');
const D = 864e5, H = 36e5;
const AHORA = new Date(2026, 9, 22, 18, 0, 0).getTime();   // jueves 22-oct-2026, 18:00 (hora local)
const NOM = { biceps: 'Bíceps', triceps: 'Tríceps', espalda: 'Espalda', pecho: 'Pecho', hombros: 'Hombros', abdominales: 'Abdominales', piernas: 'Piernas' };
let nid = 0;
// una sesión: ejercicios [{ej, kg, reps, rir, n}] → n series principales; la primera con reps/rir dados, las siguientes con 2 reps menos
function ses(g, t, ejs, extra = {}) {
  const sets = [];
  for (const e of ejs) for (let i = 0; i < (e.n ?? 3); i++)
    sets.push({ ex: e.ej.split(' ')[0], ej: e.ej, k: 'act.', reps: String(i ? Math.max(1, e.reps - 2) : e.reps), rir: String(e.rir ?? 1), kg: 'kg' in e ? e.kg : 20, P: .5, rest: 90 });
  return { id: 'p' + (++nid), start: new Date(t).toISOString(), g, grupo: NOM[g], sets, series: sets.length, completa: true, meta: 6, ...extra };
}
const dia = d => AHORA - d * D;   // hace d días
const app = (sesiones, o = {}) => cargar({ ahora: o.ahora ?? AHORA, hist: sesiones.slice().sort((a, b) => Date.parse(b.start) - Date.parse(a.start)), ls: o.ls, archivos: o.archivos });
const CP = 'Curl predicador', EJ = 'biceps|curl predicador';
const base3 = (ej = CP, g = 'biceps', o = {}) => [20, 16, 12].map(d => ses(g, dia(d), [{ ej, kg: 20, reps: 10, rir: 1, ...o }]));
const AVISO = ['incompleta', 'aguda', 'estancamiento'];

const out = []; let ok = 0, n = 0; const textos = [];
function prueba(nombre, fn) { n++; let r;
  try { r = fn(); } catch (e) { r = { ok: false, d: 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1] }; }
  if (r === true) r = { ok: true }; if (!r) r = { ok: false }; if (r.ok) ok++; out.push(`${r.ok ? 'PASA ' : 'FALLA'} ${n}. ${nombre}${r.d ? ' — ' + r.d : ''}`); }
// guarda todo el texto que se muestra (para comprobar al final que nunca se afirma sobreentrenamiento)
function recoge(A) { A.ev('anTab="rend"'); textos.push(A.ev('rdHTML()'));
  for (const g of Object.keys(NOM)) textos.push(A.ev(`(p=>p.mot.join(' | '))(anPlanGrupo('${g}'))`)); }
const est = (A, k = EJ) => A.ev(`(e=>e?{estado:e.estado,vig:e.vig,txt:e.txt,motivos:e.motivos,factores:e.factores.map(f=>f.k),datos:e.datos,segs:e.segs.length,cortes:e.segs.map(s=>s.corte&&s.corte.join('; ')),eps:e.eps.map(x=>x.cierre),resuelta:e.resuelta||null}:null)(rdAnalisis().E['${k}'])`);
const grp = (A, g = 'biceps') => A.ev(`(x=>({estado:x.estado,vig:x.vig,txt:x.txt,n:x.alertas.length}))(rdGrupo('${g}'))`);

// 1 · fatiga acumulada: el caso del problema (la semana cambió, el volumen vuelve a «sin series», la señal sigue)
const fatiga = () => [...base3(), ses('biceps', dia(8), [{ ej: CP, kg: 20, reps: 8, rir: 0, n: 5 }]), ses('biceps', dia(4), [{ ej: CP, kg: 20, reps: 8, rir: 0, n: 5 }])];
prueba('Fatiga acumulada: 2 caídas > 5 % en sesiones comparables separadas ≥ 72 h → recuperación posiblemente incompleta (activa)', () => {
  const A = app(fatiga()), e = est(A), g = grp(A); recoge(A);
  return { ok: e.estado === 'incompleta' && e.vig === 'activa' && g.estado === 'incompleta' && e.datos.length === 2 && e.datos.every(x => x.rel < -.05 && x.cae),
    d: `${e.estado}/${e.vig} · ${e.datos.map(x => (x.rel * 100).toFixed(1) + ' %').join(', ')}` }; });
prueba('…sus razones llevan los datos usados (referencia con fechas, carga, reps, reserva, % de cada sesión) y los factores que coinciden', () => {
  const A = app(fatiga()), e = est(A), m = e.motivos.join(' | ');
  return { ok: /referencia: mediana de 3 sesiones/.test(m) && /20 kg × 8, reserva 0/.test(m) && /−\d/.test(m) && e.factores.includes('series') && e.datos.every(x => x.series === 5 && x.carga === '20 kg' && x.reps === 8 && x.rir === 0 && x.ref > 27),
    d: `factores: ${e.factores.join(', ')}` }; });
prueba('…y es independiente del volumen semanal: esta semana el bíceps está «sin series» (z0) y la tendencia sigue en «posiblemente incompleta»', () => {
  const A = app(fatiga()), vol = A.ev(`estadoVol(volSemana(0).grupo('biceps'),rangoGrupo('biceps'))`), z = A.ev(`rdZona('biceps').estado`);
  return { ok: vol === 'z0' && z === 'incompleta', d: `volumen ${vol} · tendencia zona ${z}` }; });

// 2 · caída aislada → fatiga aguda posible, con la proximidad del estímulo anterior
prueba('Caída aislada tras solo 24 h desde otro estímulo directo → fatiga aguda posible, con el factor «proximidad»', () => {
  const H0 = [...base3(), ses('biceps', dia(3), [{ ej: 'Curl inclinado con mancuernas', kg: 12, reps: 10, rir: 1 }]), ses('biceps', dia(2), [{ ej: CP, kg: 20, reps: 8, rir: 0 }])];
  const A = app(H0), e = est(A); recoge(A);
  return { ok: e.estado === 'aguda' && e.vig === 'activa' && e.factores.includes('proximidad'), d: `${e.estado} · ${e.factores.join(', ')} · ${e.txt}` }; });
prueba('Dos caídas en menos de 72 h → fatiga aguda posible (no «incompleta»)', () => {
  const A = app([...base3(), ses('biceps', dia(3), [{ ej: CP, kg: 20, reps: 8, rir: 0 }]), ses('biceps', dia(2), [{ ej: CP, kg: 20, reps: 8, rir: 0 }])]), e = est(A);
  return { ok: e.estado === 'aguda', d: e.txt }; });

// 3 · cambios voluntarios: no son caídas
prueba('Bajada voluntaria de carga (20 → 15 kg, más reserva): nueva referencia, sin advertencia', () => {
  const A = app([...base3(), ses('biceps', dia(8), [{ ej: CP, kg: 15, reps: 12, rir: 2 }]), ses('biceps', dia(4), [{ ej: CP, kg: 15, reps: 12, rir: 2 }])]), e = est(A); recoge(A);
  return { ok: !AVISO.includes(e.estado) && e.segs === 2 && /bajaste la carga de 20 kg a 15 kg/.test(e.cortes[1]), d: `${e.estado} · ${e.cortes[1]}` }; });
prueba('Cambio voluntario de reserva (1 → 3): no se compara, sin advertencia', () => {
  const A = app([...base3(), ses('biceps', dia(8), [{ ej: CP, kg: 20, reps: 5, rir: 3 }]), ses('biceps', dia(4), [{ ej: CP, kg: 20, reps: 5, rir: 3 }])]), e = est(A);
  return { ok: !AVISO.includes(e.estado) && /reserva buscada distinta/.test(e.cortes[1]), d: `${e.estado} · ${e.cortes[1]}` }; });
prueba('Cambio de ejercicio (predicador → curl con barra, otra escala): el grupo no lo lee como caída', () => {
  const A = app([...base3(), ses('biceps', dia(8), [{ ej: 'Curl con barra', kg: 15, reps: 8, rir: 1 }]), ses('biceps', dia(4), [{ ej: 'Curl con barra', kg: 15, reps: 8, rir: 1 }])]), g = grp(A);
  return { ok: !AVISO.includes(g.estado) && g.n === 0, d: `${g.estado} · ${g.txt}` }; });
prueba('Cambio de orden en la sesión (1.º → 3.º ejercicio): no se compara', () => {
  const pre = [{ ej: 'Curl inclinado con mancuernas', kg: 12, reps: 10, rir: 1 }, { ej: 'Curl martillo', kg: 14, reps: 10, rir: 1 }];
  const A = app([...base3(), ses('biceps', dia(8), [...pre, { ej: CP, kg: 20, reps: 8, rir: 0 }]), ses('biceps', dia(4), [...pre, { ej: CP, kg: 20, reps: 8, rir: 0 }])]), e = est(A);
  return { ok: !AVISO.includes(e.estado) && /orden distinto/.test(e.cortes[1]), d: `${e.estado} · ${e.cortes[1]}` }; });
prueba('Cambio de programa (otra rutina): no se compara', () => {
  const H0 = [...base3().map(s => ({ ...s, rut: { n: 'PPL', pos: 0, de: 3 } })), ...[8, 4].map(d => ses('biceps', dia(d), [{ ej: CP, kg: 20, reps: 8, rir: 0 }], { rut: { n: 'Torso-pierna', pos: 0, de: 2 } }))];
  const A = app(H0), e = est(A);
  return { ok: !AVISO.includes(e.estado) && /programa distinto/.test(e.cortes[1]), d: `${e.estado} · ${e.cortes[1]}` }; });
prueba('Cambio de técnica marcado por ti en la sesión de la primera caída: la señal desaparece (nueva referencia)', () => {
  const A = app(fatiga()); const antes = est(A).estado;
  A.ev(`rdMarcaCambio({t:${dia(8)}-1,ek:'curl predicador',g:'biceps',motivo:'tecnica'})`); const e = est(A);
  return { ok: antes === 'incompleta' && !AVISO.includes(e.estado) && /cambio marcado por ti: técnica/.test(e.cortes[1]) && JSON.parse(A.ls.getItem('reloj-anomalo-rendimiento')).cortes.length === 1,
    d: `${antes} → ${e.estado}` }; });
prueba('Ejercicios equivalentes: «Curl en predicador» declarado igual a «Curl predicador» se compara con él', () => {
  const H0 = [...base3(), ses('biceps', dia(8), [{ ej: 'Curl en predicador', kg: 20, reps: 8, rir: 0 }]), ses('biceps', dia(4), [{ ej: 'Curl en predicador', kg: 20, reps: 8, rir: 0 }])];
  const A = app(H0), sin = grp(A).estado; A.ev(`rdEquivale('Curl en predicador','Curl predicador')`); const con = est(A).estado;
  return { ok: !AVISO.includes(sin) && con === 'incompleta', d: `sin declarar: ${sin} · declarado: ${con}` }; });
prueba('Normalización de nombres: mayúsculas, tildes y «mancuernas/mancuerna» son el mismo ejercicio', () => {
  const A = app([]); return A.ev(`rdEjK('Curl inclinado con MANCUERNAS')===rdEjK('curl inclinado con mancuerna') && rdEjK('Elevación  lateral')===rdEjK('elevacion lateral')`); });

// 4 · descarga voluntaria
prueba('Descarga voluntaria (sesiones desc con menos carga y más reserva): estado «descarga», sin advertencias', () => {
  const H0 = [...base3(), ...[6, 3].map(d => ses('biceps', dia(d), [{ ej: CP, kg: 14, reps: 10, rir: 3 }], { desc: true }))];
  const A = app(H0), e = est(A), g = grp(A); recoge(A);
  return { ok: e.estado === 'descarga' && g.estado === 'descarga' && g.n === 0, d: `${e.estado} · ${g.txt}` }; });
prueba('Descarga activa ahora (manual): todos los grupos muestran «descarga voluntaria» y conservan las señales pendientes', () => {
  const A = app(fatiga(), { ls: { 'reloj-anomalo-descarga': { inicio: new Date(dia(1)).toISOString(), hasta: new Date(dia(-6)).toISOString(), fin: new Date(dia(-6)).toISOString() } } }), g = grp(A);
  return { ok: g.estado === 'descarga' && g.n === 1, d: `${g.estado} · alertas pendientes ${g.n}` }; });
prueba('Caídas, después descarga y después una sesión de vuelta a la referencia → señal resuelta (progreso normal)', () => {
  const H0 = [...fatiga().map(s => ({ ...s, start: new Date(Date.parse(s.start) - 10 * D).toISOString() })), ses('biceps', dia(9), [{ ej: CP, kg: 14, reps: 10, rir: 3 }], { desc: true }),
    ses('biceps', dia(6), [{ ej: CP, kg: 14, reps: 10, rir: 3 }], { desc: true }), ses('biceps', dia(2), [{ ej: CP, kg: 20, reps: 10, rir: 1 }])];
  const A = app(H0), e = est(A); recoge(A);
  return { ok: e.estado === 'normal' && e.eps[0] === 'resuelta' && !!e.resuelta, d: `${e.estado} · ${e.resuelta && e.resuelta.txt}` }; });

// 5 · estancamiento y descenso gradual
prueba('Estancamiento: 8 sesiones idénticas en 35 días → estancamiento prolongado', () => {
  const A = app([35, 30, 25, 20, 15, 10, 5, 1].map(d => ses('biceps', dia(d), [{ ej: CP, kg: 20, reps: 10, rir: 1 }]))), e = est(A); recoge(A);
  return { ok: e.estado === 'estancamiento', d: e.txt }; });
prueba('Progresión (+2,5 kg cada 2 sesiones): progreso normal, nunca estancamiento', () => {
  const A = app([35, 30, 25, 20, 15, 10, 5, 1].map((d, i) => ses('biceps', dia(d), [{ ej: CP, kg: 20 + 2.5 * Math.floor(i / 2), reps: 10, rir: 1 }]))), e = est(A);
  return { ok: e.estado === 'normal', d: e.txt }; });
prueba('Estancamiento corto (solo 15 días sin mejorar): todavía no es «prolongado»', () => {
  const A = app([15, 10, 5, 1].map(d => ses('biceps', dia(d), [{ ej: CP, kg: 20, reps: 10, rir: 1 }]))), e = est(A);
  return { ok: e.estado === 'normal', d: e.txt }; });
prueba('Descenso gradual (−2,5 % por sesión, ninguna caída > 5 % por sí sola) → posiblemente incompleta por descenso acumulado', () => {
  const A = app([28, 24, 20, 16, 12, 8, 4, 1].map((d, i) => ses('biceps', dia(d), [{ ej: CP, kg: 50, reps: [10, 10, 9, 9, 8, 8, 7, 7][i], rir: 1 }]))), e = est(A); recoge(A);
  return { ok: e.estado === 'incompleta' && /descenso gradual/.test(e.txt), d: e.txt }; });

// 6 · recuperación y evolución en el tiempo
prueba('Recuperación: tras las 2 caídas, una sesión de nuevo en la referencia → progreso normal con «señal resuelta»', () => {
  const A = app([...fatiga().map(s => ({ ...s, start: new Date(Date.parse(s.start) - 4 * D).toISOString() })), ses('biceps', dia(2), [{ ej: CP, kg: 20, reps: 10, rir: 1 }])]), e = est(A); recoge(A);
  return { ok: e.estado === 'normal' && e.eps[0] === 'resuelta' && /señal resuelta/.test(e.resuelta.txt), d: e.resuelta && e.resuelta.txt }; });
prueba('Una tercera caída tras la señal la mantiene (y se alarga la racha)', () => {
  const A = app([...fatiga().map(s => ({ ...s, start: new Date(Date.parse(s.start) - 4 * D).toISOString() })), ses('biceps', dia(2), [{ ej: CP, kg: 20, reps: 8, rir: 0 }])]), e = est(A);
  return { ok: e.estado === 'incompleta' && e.datos.length === 3, d: `${e.estado}, ${e.datos.length} caídas` }; });
prueba('No se borra al empezar la semana: domingo 23:00 → lunes 09:00, el volumen vuelve a z0 y la señal sigue igual', () => {
  const dom = new Date(2026, 9, 25, 23, 0, 0).getTime(), H0 = [...[17, 13, 9].map(d => ses('biceps', dom - d * D, [{ ej: CP, kg: 20, reps: 10, rir: 1 }])),
    ses('biceps', dom - 5 * D, [{ ej: CP, kg: 20, reps: 8, rir: 0 }]), ses('biceps', dom - 1 * D, [{ ej: CP, kg: 20, reps: 8, rir: 0 }])];
  const A = app(H0, { ahora: dom }), v1 = A.ev(`estadoVol(volSemana(0).grupo('biceps'),rangoGrupo('biceps'))`), e1 = est(A);
  A.fijaAhora(dom + 10 * H); const v2 = A.ev(`estadoVol(volSemana(0).grupo('biceps'),rangoGrupo('biceps'))`), e2 = est(A);
  return { ok: v1 !== 'z0' && v2 === 'z0' && e1.estado === 'incompleta' && e2.estado === 'incompleta' && e2.vig === 'activa', d: `vol ${v1} → ${v2} · tendencia ${e1.estado} → ${e2.estado}/${e2.vig}` }; });
prueba('El descanso la atenúa sin borrarla: 8 días sin estimular el bíceps → «atenuada», sigue visible con el motivo', () => {
  const A = app(fatiga()); A.fijaAhora(dia(-4)); const e = est(A), g = grp(A);
  return { ok: e.estado === 'incompleta' && e.vig === 'atenuada' && g.vig === 'atenuada' && e.motivos.some(m => /han pasado 8 días/.test(m)), d: `${e.estado}/${e.vig}` }; });
prueba('Fatiga aguda posible se atenúa antes (4 días)', () => {
  const A = app([...base3(), ses('biceps', dia(2), [{ ej: CP, kg: 20, reps: 8, rir: 0 }])]); const a = est(A).vig; A.fijaAhora(dia(-3)); const b = est(A).vig;
  return { ok: a === 'activa' && b === 'atenuada', d: `${a} → ${b}` }; });
prueba('Señal sin confirmar: tras las caídas bajas la carga (cambio voluntario); se conserva como «sin confirmar», no se borra', () => {
  const A = app([...fatiga().map(s => ({ ...s, start: new Date(Date.parse(s.start) - 3 * D).toISOString() })), ses('biceps', dia(1), [{ ej: CP, kg: 15, reps: 12, rir: 2 }])]), e = est(A);
  return { ok: e.estado === 'incompleta' && e.vig === 'sinConfirmar' && e.motivos.some(m => /no se pudo comprobar después: bajaste la carga/.test(m)), d: `${e.estado}/${e.vig}` }; });
prueba('Más de 42 días sin el ejercicio: la vuelta no se compara con lo de antes (sin advertencia)', () => {
  const A = app([...[100, 96, 92].map(d => ses('biceps', dia(d), [{ ej: CP, kg: 20, reps: 10, rir: 1 }])), ...[10, 5].map(d => ses('biceps', dia(d), [{ ej: CP, kg: 20, reps: 7, rir: 1 }]))]), e = est(A);
  return { ok: !AVISO.includes(e.estado) && /días entre las dos sesiones/.test(e.cortes[1]), d: `${e.estado} · ${e.cortes[1]}` }; });

// 7 · umbrales configurables
prueba('Umbral configurable: con 10 % las caídas de 7,3 % ya no cuentan', () => {
  const A = app(fatiga()); A.ev(`rdPonCfg('umbral',.1)`); const e = est(A);
  return { ok: !AVISO.includes(e.estado) && JSON.parse(A.ls.getItem('reloj-anomalo-rendimiento')).cfg.umbral === .1, d: e.estado }; });
prueba('Caídas seguidas configurables: con 3, dos caídas son «fatiga aguda posible»', () => {
  const A = app(fatiga()); A.ev(`rdPonCfg('consecutivas',3)`); return { ok: est(A).estado === 'aguda', d: est(A).estado }; });
prueba('Umbrales fuera de rango o desconocidos se rechazan', () => {
  const A = app([]); return A.ev(`!rdPonCfg('umbral',.9)&&!rdPonCfg('nada',1)&&rd.cfg.umbral===.05&&rdNorm({cfg:{umbral:'x',base:99}}).cfg.base===3`); });

// 8 · peso corporal
prueba('Ejercicio con peso corporal (dominadas, 0 kg): reps al fallo; 2 caídas de 15 % → posiblemente incompleta', () => {
  const A = app([...[20, 16, 12].map(d => ses('espalda', dia(d), [{ ej: 'Dominadas', kg: 0, reps: 12, rir: 1 }])), ...[8, 4].map(d => ses('espalda', dia(d), [{ ej: 'Dominadas', kg: 0, reps: 10, rir: 1 }]))]);
  const e = est(A, 'espalda|dominadas'); recoge(A);
  return { ok: e.estado === 'incompleta' && e.datos.every(x => x.carga === 'peso corporal' && x.medida === 11), d: `${e.estado} · ${e.datos.map(x => x.carga + ' ' + x.medida).join(', ')}` }; });
prueba('Carga sin anotar (kg null en un ejercicio con carga externa): se registra pero no se compara', () => {
  const A = app([20, 16, 12, 8, 4].map((d, i) => ses('biceps', dia(d), [{ ej: CP, kg: null, reps: i < 3 ? 10 : 7, rir: 1 }]))), e = est(A);
  return { ok: e.estado === 'insuficiente' && /carga sin anotar/.test(e.txt), d: e.txt }; });

// 9 · sensaciones opcionales
prueba('Sensaciones: fatiga, dolor y sueño de los días de la caída aparecen como contexto', () => {
  const ls = { 'reloj-anomalo-sensaciones': { [new Date(dia(8)).toISOString().slice(0, 10)]: { fatiga: 4, dolor: { biceps: 2 } } }, 'bienestar-diario': {} };
  const k8 = (t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }), d8 = k8(dia(8)), d4 = k8(dia(4));
  ls['reloj-anomalo-sensaciones'] = { [d8]: { fatiga: 4, dolor: { biceps: 2 } }, [d4]: { fatiga: 5, dolor: { biceps: 3 } } }; ls['bienestar-diario'] = { [d8]: { sueno: 5.5 }, [d4]: { sueno: 4.5 } };
  const A = app(fatiga(), { ls }), e = est(A);
  return { ok: ['fatiga', 'dolor', 'sueno'].every(k => e.factores.includes(k)), d: e.factores.join(', ') }; });
prueba('Sensaciones: se guardan, se validan (fuera de rango o grupo inválido se descarta) y se quitan', () => {
  const A = app([], { ls: { 'reloj-anomalo-sensaciones': { '2026-10-20': { fatiga: 9, dolor: { biceps: 5, foo: 1, piernas: 2 } }, 'malo': { fatiga: 3 } } } });
  const leido = A.ev('JSON.stringify(sen)'); A.ev(`senPon('2026-10-22','fatiga',3);senPon('2026-10-22','dolor',2,'pecho');senPon('2026-10-22','dolor',9,'pecho')`);
  const g1 = JSON.parse(A.ls.getItem('reloj-anomalo-sensaciones'))['2026-10-22']; A.ev(`senPon('2026-10-22','fatiga',null);senPon('2026-10-22','dolor',null,'pecho')`);
  const g2 = JSON.parse(A.ls.getItem('reloj-anomalo-sensaciones'))['2026-10-22'];
  return { ok: leido === '{"2026-10-20":{"dolor":{"piernas":2}}}' && g1.fatiga === 3 && g1.dolor.pecho === 2 && g2 === undefined, d: `leído ${leido} · guardado ${JSON.stringify(g1)}` }; });
prueba('Sueño desde la pantalla: se fusiona en «cómo llegas» sin borrar la energía anotada (clave compartida con Comida)', () => {
  const A = app([], { ls: { 'bienestar-diario': { '2026-10-22': { energia: 4 } } } }); A.ev(`rdPonSueno('2026-10-22',6.5)`);
  const b = JSON.parse(A.ls.getItem('bienestar-diario'))['2026-10-22']; return { ok: b.energia === 4 && b.sueno === 6.5, d: JSON.stringify(b) }; });
prueba('Copia de seguridad: umbrales, cambios marcados y sensaciones viajan y se fusionan sin duplicar', () => {
  const A = app(fatiga()); A.ev(`rdMarcaCambio({t:${dia(8)}-1,ek:'curl predicador',g:'biceps',motivo:'tecnica'});senPon('2026-10-21','fatiga',4)`);
  const copia = A.ev('JSON.stringify(copiaJSONsinFotos=(()=>({rendimiento:rdCopia()}))())'), B = app(fatiga());
  const r1 = B.ev(`rdFusiona(${copia}.rendimiento)`), r2 = B.ev(`rdFusiona(${copia}.rendimiento)`);
  return { ok: r1.n === 2 && r2.n === 0 && B.ev('rd.cortes.length') === 1 && B.ev(`sen['2026-10-21'].fatiga`) === 4 && !['incompleta', 'aguda'].includes(est(B).estado), d: `1.ª ${r1.n}, 2.ª ${r2.n}` }; });

// 10 · ventanas de 7, 14 y 28 días
prueba('Ventanas 7/14/28 d: sesiones, series (las mismas de volumen()) y cambio de rendimiento frente a la referencia anterior a cada ventana', () => {
  const R = { 30: 8, 20: 9, 10: 10, 5: 11, 1: 12 }, A = app(Object.entries(R).map(([d, r]) => ses('biceps', dia(+d), [{ ej: CP, kg: 20, reps: r, rir: 1 }])));
  const W = A.ev(`rdGrupo('biceps').ventanas`), v = r => 20 * (1 + (r + 1) / 30), cerca = (a, b) => Math.abs(a - b) < 1e-9;
  const vol = A.ev(`[7,14,28].map(d=>volumen(Date.now()-d*864e5,Date.now()+1).grupo('biceps'))`);
  return { ok: W.map(w => w.sesiones).join() === '2,3,4' && cerca(W[0].rend, v(12) / v(10) - 1) && cerca(W[1].rend, v(12) / v(9) - 1) && cerca(W[2].rend, v(12) / v(8) - 1) && W.every((w, i) => cerca(w.series, vol[i])),
    d: W.map(w => `${w.dias} d: ${w.sesiones} ses, ${w.series} series, ${(w.rend * 100).toFixed(1)} %`).join(' · ') }; });

// 11 · nunca bloquea, nunca concluye sobreentrenamiento, ninguna «puntuación»
prueba('Con advertencias se entrena igual: iniciarSesion funciona, el plan no aplaza por la señal y el historial no cambia', () => {
  const A = app(fatiga()), antes = A.ev('JSON.stringify(hist)'); A.ev(`rdAnalisis();rdHTML();grupo='biceps';S=fresh();iniciarSesion()`);
  const p = A.ev(`anPlanGrupo('biceps')`), s = A.ev('({id:S.id,meta:S.meta})');
  return { ok: !!s.id && s.meta > 0 && p.acc !== 'aplazar' && A.ev('JSON.stringify(hist)') === antes && p.mot.some(m => /posiblemente incompleta/.test(m)), d: `plan: ${p.acc} · meta ${s.meta}` }; });
prueba('Ninguna pantalla ni motivo afirma sobreentrenamiento (solo aparece negado) ni da una puntuación de recuperación', () => {
  const malos = []; for (const t of textos) { const s = t.replace(/<[^>]+>/g, ' ');
    for (const m of s.matchAll(/[^.]*sobreentren[^.]*/gi)) if (!/no permiten concluir|no indican/.test(m[0])) malos.push(m[0].trim());
    if (/puntuaci[oó]n de recuperaci|recuperaci[oó]n:? \d+ ?(%|\/)/i.test(s)) malos.push('puntuación'); }
  return { ok: textos.length > 20 && !malos.length, d: malos.length ? malos.slice(0, 2).join(' | ') : `${textos.length} textos revisados` }; });
prueba('Ningún texto pintado sale roto (undefined, NaN, [object …]) en ninguno de los escenarios', () => {
  const malos = textos.filter(t => /undefined|NaN|\[object/.test(t.replace(/<[^>]+>/g, ' ')));
  return { ok: !malos.length, d: malos.length ? malos[0].replace(/<[^>]+>/g, ' ').match(/.{0,80}(undefined|NaN|\[object).{0,40}/)[0] : `${textos.length} textos` }; });
prueba('El consejo de descarga ya no afirma «es fatiga acumulada»', () => { const A = app([]); return !/es fatiga acumulada/.test(A.ev('consejoDescarga.toString()')); });

// 12 · compatibilidad: historial antiguo, volumen, medallas, estadísticas
const antiguo = () => [
  ses('biceps', dia(40), []), { id: 'viejo-1', start: new Date(dia(39)).toISOString(), grupo: 'Bíceps', sets: [], efectivas: 4 },   // sin series, solo el total
  { id: 'viejo-2', start: new Date(dia(30)).toISOString(), grupo: 'Bíceps', series: 3, sets: [   // sin «g» ni «ej» (anterior a v15), reservas «3+»
    { ex: 'Predicador', k: 'act.', reps: '10', rir: '3+', kg: 20 }, { ex: 'Predicador', k: 'act.', reps: '12', rir: '1', kg: 20 }, { ex: 'Inclinado', k: 'myo', reps: '5', rir: '0', kg: 10 }] },
  { id: 'viejo-3', start: new Date(dia(25)).toISOString(), grupo: 'Bíceps', series: 2, sets: [{ ex: 'Predicador', k: 'act.', reps: '11', rir: '1', kg: 20 }, { ex: 'Predicador', k: 'act.', reps: '9', rir: '?', kg: 20 }] },
  ...fatiga()];
prueba('Historial antiguo (sin g ni ej, sin series, reservas «3+» y «?»): se analiza sin errores y se reconoce el ejercicio', () => {
  const A = app(antiguo()), e = est(A); recoge(A);
  return { ok: e && e.estado === 'incompleta' && A.ev(`rdAnalisis().E['${EJ}'].obs.length`) === 7, d: `${e.estado} · ${A.ev(`rdAnalisis().E['${EJ}'].obs.length`)} sesiones del ejercicio` }; });
prueba('Volumen, medallas, racha, auditoría y estadísticas idénticos con y sin rendimiento.js', () => {
  const sin = ['estilo.js', 'anim.js', 'reloj.js', 'analisis.js', 'auditoria.js', 'pantallas.js', 'cargas.js', 'musica.js', 'cierre.js', 'entreno.js'];
  const mira = A => A.ev(`JSON.stringify({v:volumen(0,Date.now()+1),s:[0,1,2].map(volSemana).map(V=>V.grupos),m:medallasGanadas(),r:racha(),a:(x=>[x.errores,x.avisos])(auditarDatos()),e:hist.map(efH),h:hist})`);
  const H0 = antiguo(), a = mira(app(H0)), b = mira(app(H0, { archivos: sin }));
  return { ok: a === b, d: a === b ? `${a.length} caracteres idénticos` : 'distintos' }; });
prueba('Pantallas: el mapa muestra los dos estados por zona (punto de volumen + cuadrado de tendencia) y Progreso los dos por grupo', () => {
  const A = app(fatiga()); const mapa = A.ev('mapaSVG()'); A.ev('renderProg()'); const sem = A.els.get('pSem').innerHTML; A.ev(`anTab='rend'`); const an = A.ev('rdHTML()');
  const fila = (mapa.match(/<button type="button" data-m="biceps"[^]*?<\/button>/) || [''])[0];
  return { ok: /mpt z0/.test(fila) && /rdpt rd-incompleta/.test(fila) && /rdchip rd-incompleta/.test(sem) && (an.match(/Volumen semanal/g) || []).length === 7 && (an.match(/Tendencia<\/span>/g) || []).length === 7,
    d: `fila bíceps: ${/mpt z0/.test(fila)}/${/rd-incompleta/.test(fila)} · Progreso ${/rdchip/.test(sem)}` }; });
prueba('La auditoría de datos incluye un resumen del rendimiento (solo lectura)', () => {
  const A = app(fatiga()); return A.ev(`auditarDatos().info.some(x=>x.c==='rendimiento'&&/recuperación posiblemente incompleta 1/.test(x.t))`); });

console.log(out.join('\n'));
console.log(`\n${ok} de ${n} pruebas pasan`);
process.exit(ok === n ? 0 : 1);
