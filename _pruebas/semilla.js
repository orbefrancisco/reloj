// Datos sintéticos para las pruebas de volumen (se cargan ANTES de reloj.js, solo en la página de pruebas y en un perfil de
// navegador aparte: nunca tocan las sesiones reales). Reproducen las fuentes de discrepancia vistas en el teléfono:
// curl martillo (bíceps ½ / antebrazo 1), aperturas (pecho medio 1 + superior ¼), press sentado (deltoide anterior 1 + lateral ½),
// tríceps entre 8 y 12, una sesión vieja sin series detalladas y una sesión de la semana pasada.
'use strict';
(() => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const L = d.getTime(), H = 36e5;
  const iso = t => new Date(t).toISOString();
  const serie = (ex, ej, reps, rir) => ({ ex, ej, k: 'act.', reps: String(reps), rir: String(rir), kg: 20, P: .5, rest: 60 });
  const rep = (n, f) => Array.from({ length: n }, f);
  let id = 0;
  const ses = (g, grupo, t, sets, extra = {}) => ({ id: 'prueba-' + (++id), start: iso(t), g, grupo, sets, series: sets.length, reps: 0, tuc: 0, iso: 0, completa: true, ...extra });
  const S = [
    ses('triceps', 'Tríceps', L + 19 * H, [
      ...rep(3, () => serie('Sobre la cabeza', 'Extensión sobre la cabeza', 10, 0)),
      ...rep(3, () => serie('Pushdown', 'Pushdown con cuerda', 12, 1)),
      ...rep(2, () => serie('Fondos', 'Fondos o flexiones cerradas', 10, 2))]),
    ses('pecho', 'Pecho', L + 34 * H, [
      ...rep(3, () => serie('Inclinado', 'Press inclinado con mancuernas', 8, 1)),
      ...rep(4, () => serie('Aperturas', 'Aperturas en polea', 12, 1)),
      ...rep(2, () => serie('Fondos', 'Fondos con torso inclinado', 10, 2))]),
    ses('biceps', 'Bíceps', L + 42 * H, [
      ...rep(3, () => serie('Inclinado', 'Curl inclinado con mancuernas', 10, 1)),
      ...rep(3, () => serie('Predicador', 'Curl predicador', 12, 2)),
      ...rep(4, () => serie('Martillo', 'Curl martillo', 11, 0))]),
    ses('biceps', 'Bíceps', L + 55 * H, [], { efectivas: 2.5 }),                      // registro viejo: solo el total
    ses('hombros', 'Hombros', L + 66 * H, [
      ...rep(4, () => serie('Laterales', 'Elevaciones laterales', 15, 1)),
      ...rep(4, () => serie('Press', 'Press con mancuernas sentado', 9, 1)),
      ...rep(3, () => serie('Pájaros', 'Pájaros en polea', 15, 3))]),
    ses('hombros', 'Hombros', L + 68 * H, rep(12, () => serie('Laterales', 'Elevaciones laterales', 15, 0))),   // deltoide lateral por encima del objetivo
    ses('espalda', 'Espalda', L + 70 * H, [
      ...rep(3, () => serie('Jalón', 'Jalón al pecho', 10, 1)),
      ...rep(3, () => serie('Remo', 'Remo con mancuerna', 10, 1))]),
    ses('biceps', 'Bíceps', L - 3 * 24 * H, rep(5, () => serie('Inclinado', 'Curl inclinado con mancuernas', 10, 0)))   // semana pasada
  ];
  // la app guarda lo más nuevo primero
  localStorage.setItem('reloj-anomalo-sesiones', JSON.stringify(S.sort((a, b) => Date.parse(b.start) - Date.parse(a.start))));
})();
