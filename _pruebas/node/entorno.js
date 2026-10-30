// Carga los scripts REALES de la app en Node (vm) con un DOM mínimo de mentira: los elementos aceptan cualquier propiedad o
// llamada y no pintan nada. Sirve para probar la lógica (historial, volumen, medallas, rendimiento) sin navegador.
// Uso: const app = require('./entorno')({ ahora, hist, ls });  app.ev('expresión') evalúa en el ámbito global de la app.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const APP = process.env.RELOJ_APP ? path.resolve(process.env.RELOJ_APP) : path.resolve(__dirname, '..', '..');   // otra copia de la app, para comparar
function elemento() {
  const datos = { style: new Proxy({}, { get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? () => '' : undefined), set: (o, k, v) => { o[k] = v; return true; } }), dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, children: [], hidden: false,
    innerHTML: '', textContent: '', value: '', checked: false, options: [], files: [] };
  return new Proxy(datos, {
    get(o, k) { if (k in o) return o[k]; if (typeof k === 'symbol') return undefined;
      return (...a) => (/^(querySelector|closest|getContext|appendChild|cloneNode|insertBefore)$/.test(k) ? elemento() : k === 'querySelectorAll' ? [] : undefined); },
    set(o, k, v) { o[k] = v; return true; } });
}
module.exports = function cargar(o = {}) {
  const ahora = o.ahora ?? Date.now(), mem = new Map();
  const localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); },
    key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; }, clear: () => mem.clear() };
  if (o.hist) localStorage.setItem('reloj-anomalo-sesiones', JSON.stringify(o.hist));
  for (const [k, v] of Object.entries(o.ls || {})) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  const els = new Map(), creados = [], oyentes = {};   // v40: los escuchadores de document se guardan para simular toques (dispara)
  const document = { getElementById: id => { if (!els.has(id)) els.set(id, elemento()); return els.get(id); },
    querySelector: () => elemento(), querySelectorAll: () => [], createElement: () => { const e = elemento(); creados.push(e); return e; },
    addEventListener(tipo, f) { (oyentes[tipo] = oyentes[tipo] || []).push(f); }, removeEventListener() {},
    body: elemento(), documentElement: elemento(), head: elemento(), visibilityState: 'visible', hidden: false, fonts: { ready: Promise.resolve() } };
  // Date con el «ahora» fijado (pruebas deterministas); fijaAhora() lo mueve
  const RealDate = Date; let t = ahora;
  class FDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(t); } static now() { return t; } }
  const ctx = { console, localStorage, sessionStorage: localStorage, document, Date: FDate, Math, JSON, Intl, Promise, Map, Set, WeakMap, WeakSet, Proxy, Reflect, Symbol, Array, Object,
    Number, String, Boolean, RegExp, Error, TypeError, RangeError, isFinite, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
    Uint8Array, Float32Array, Float64Array, ArrayBuffer, Blob: class {}, URL, atob: s => Buffer.from(s, 'base64').toString('binary'), btoa: s => Buffer.from(s, 'binary').toString('base64'),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, queueMicrotask,
    navigator: { vibrate() {}, userAgent: 'node', language: 'es-DO' }, location: { href: 'file:///', search: '', hash: '', origin: 'file://', pathname: '/', reload() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), performance: { now: () => t },
    addEventListener() {}, removeEventListener() {}, getComputedStyle: () => ({ getPropertyValue: () => '' }), screen: {}, innerWidth: 400, innerHeight: 800, devicePixelRatio: 1,
    Image: class {}, FileReader: class {}, alert() {}, confirm: () => true, prompt: () => null, scrollTo() {} };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  const archivos = o.archivos || ['estilo.js', 'anim.js', 'reloj.js', 'analisis.js', 'auditoria.js', 'pantallas.js', 'cargas.js', 'musica.js', 'cierre.js', 'entreno.js', 'rendimiento.js', 'programa.js'];
  // como en la página: un script por archivo en el mismo contexto (comparten el ámbito léxico global: los const/let de uno se ven en
  // los siguientes, y la función de un archivo posterior aún no existe mientras corre uno anterior)
  for (const f of archivos) if (fs.existsSync(path.join(APP, f))) vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), ctx, { filename: f });
  // los const/let globales no son propiedades del objeto global: se exponen con un evaluador en ese mismo ámbito
  vm.runInContext('globalThis.__ev = s => eval(s);', ctx);
  // dispara(tipo, datos): un toque en un elemento con esos data-* (closest('[data-x]') lo encuentra si tiene data-x); devuelve los errores de los escuchadores
  const dispara = (tipo, datos = {}, extra = {}) => { const el = { dataset: datos, getAttribute: k => (k === 'aria-disabled' ? datos.ariaDisabled ?? null : null), type: extra.type, checked: extra.checked, value: extra.value };
    el.closest = sel => { const m = /\[data-([a-z-]+)\]/g; let x; while ((x = m.exec(sel))) if (x[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase()) in datos) return el; return null; };
    const e = { target: el, key: extra.key, repeat: false, preventDefault() {} }, errores = [];
    for (const f of oyentes[tipo] || []) try { f(e); } catch (err) { errores.push(err.message); }
    return errores; };
  return { ctx, ev: s => ctx.__ev(s), ls: localStorage, els, creados, dispara, fijaAhora: x => { t = x; } };
};
