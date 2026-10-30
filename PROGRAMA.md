# v40 · Programa «Hipertrofia intensiva — 28 días»

Documento de diseño de `programa.js`. Primero la auditoría de lo que había, después la arquitectura y, al final, las reglas.
El calendario completo y las 24 prescripciones generadas por el motor están en `PROGRAMA_PRESCRIPCIONES.md`
(se regeneran con `node _pruebas/node/ver_programa.js > PROGRAMA_PRESCRIPCIONES.md`).

## 1. Auditoría de la app antes del cambio (v39)

| Pieza | Dónde | Qué hacía | Qué se reutiliza |
|---|---|---|---|
| Almacenamiento | `localStorage` (≈5 MB compartidos con Comida), una clave por módulo; todo se lee con `leerJSON` y un normalizador | Valida campo a campo; lo que no encaja se descarta; aviso de «sin espacio» (`sinSitio`) | Clave nueva `reloj-anomalo-programa`, con su normalizador `pgNorm` y el mismo `guardarObj` (mismo aviso de espacio) |
| Historial | `reloj.js` → `hist`, `normSes`, `escribirHist` | Una sesión por grupo; series con `ex, ej, k, reps, rir, kg, dur, restR, restQ, plaus` | El programa escribe un **espejo** por grupo (como las rutinas) con `prog:{p,s,i,e}`; volumen, medallas, mapa, rendimiento y auditoría lo cuentan sin tocarlos |
| Motor de sesión | `reloj.js` → `S`, `iniciarSesion`, `avanzar` | Motor «anómalo» de un grupo: activación + mini-series hasta una meta de series efectivas | **No** sirve para series rectas prescritas: el programa tiene su propio motor de estado |
| Sesión en curso | `reloj.js` → `guardarEnCurso`, `leerEnCurso` (3 h) | Se guarda en cada cambio de estado; se ofrece retomar | Misma idea: el programa guarda en **cada** acción y, al abrir, vuelve directo a la sesión (sin límite de 3 h; ver «sesión olvidada») |
| Integridad física | `reloj.js` → `plausDe`, `restQDe`, `fisProgresa` (v38) | Duración por repetición: imposible < 0,35 s, improbable < 1,2 s | Se usan tal cual en cada serie del programa |
| Saltos de hora | `reloj.js` → `now()` con `performance.now` | Corrige la duración de la serie si cambia la hora | Misma técnica en `pgAhora`, más marca de agua y hora de la red |
| Progresión | `reloj.js` → `regla`, `cambiaKg`, `e1`; `cargas.js` (Mis cargas) | Doble progresión sobre la primera serie; pasos de carga en kg/lb y discos | `cambiaKg` (paso de carga), `e1` (1RM estimado), referencias de «Mis cargas» como carga inicial etiquetada |
| Mapa muscular | `reloj.js` → `musculos`, `REGLAS_MUS`, `MUS` | Reglas por nombre del ejercicio | Volumen por sesión y por semana del informe. Dos correcciones (abajo) |
| Copia de seguridad | `copiaJSON`, `restaurarCopia` | Un JSON con todo; restaurar fusiona | El programa va en la copia; restaurar **no sustituye** un programa de este teléfono |
| Pruebas | `_pruebas/*.js` (Chrome) y `_pruebas/node/*.test.js` (scripts reales en Node) | Chrome no arranca dentro del sandbox | Pruebas nuevas en Node; el entorno guarda ahora los escuchadores de `document` para simular toques |

Correcciones necesarias del mapa muscular (afectan solo a esos nombres):
- «Jalón **uni**lateral» caía en deltoide lateral porque la regla `/lateral/` encajaba dentro de «unilateral». Ahora la regla exige
  que «lateral» empiece palabra.
- «Aperturas de polea **de abajo hacia arriba**» se contaban como pecho medio; ahora pecho superior (1) y medio (½).
- «Peck deck inverso» se escribe «Pec deck inverso» para que la regla del deltoide posterior lo reconozca.

## 2. Arquitectura

```
index.html ── tarjeta (#pgCard, #pgCardHoy) ── pantalla del programa (#vPrograma) ── modo entrenamiento (#vProgEnt) ── diálogos (#pgDlg)
                                   │ (la interfaz solo llama a pg* y pinta su resultado)
programa.js ── CAPA DE ESTADO: pgActivar · pgEntrar · pgEmpezarSerie · pgTerminarSerie · pgRegistrar · pgOmitir · pgPausa
              · pgFinalizar · pgAbandonar (pgSostener/pgSoltar) · pgSeguridad · pgReprogramar · pgCancelar · pgRevisaFin
              · pgBloqueaLibre (EL bloqueo) · pgAhora (hora del programa) · pgPresc / pgProgresion · pgInforme
              → PGS (estado) → localStorage 'reloj-anomalo-programa' (normalizado con pgNorm al leer)
              → espejo en el historial (pgEspejo) → volumen, medallas, mapa, rendimiento, auditoría de siempre
reloj.js / cierre.js ── iniciarSesion, el reloj (pad), retomar, bloques y cierre de déficits preguntan a pgBloqueaLibre()
```

Cada función de estado devuelve `{ok:true}` o `{ok:false, err, txt}`. Ninguna regla depende de que un botón esté deshabilitado:
`iniciarSesion` lanza `programa-activo` aunque alguien llegue por otra pantalla.

Estado guardado: `{marca, off, offT, act:{id, ini, creado}, ses:{d01:{int:[intentos]}}, rep:{d01:{a, de, t}}, cur, arch:[programas anteriores], log}`.
Un intento guarda `id` único (`pg…-d05-1`), inicio y fin, estado, semana, plan de series fijado al empezar, series, omisiones con motivo,
motivo de cierre y si la hora no es verificable. Cada serie: `id` único por sesión-ejercicio-serie, ejercicio, nº de serie, carga real,
reps reales, RIR (o «?»), inicio y fin (ISO), duración medida, descanso real y su calidad, verosimilitud y carga objetivo.

## 3. El programa

- Calendario fijo: lunes Espalda A + bíceps · martes Pecho A + hombros + tríceps · **miércoles descanso** · jueves Piernas A (cuádriceps)
  · viernes Espalda B + bíceps · sábado Pecho B + hombros + tríceps · domingo Piernas B (femorales y glúteos). 28 días explícitos
  (`pgDias`), 24 sesiones (`d01`…`d28` sin los miércoles) y 4 descansos.
- Periodización:
  - Semana 1 (adaptación y calibración): las series de 3 o más pierden una; si la sesión aún pasa del 80 %, se quita una a la que
    menos se ha recortado (nunca al primer ejercicio). Resultado: 75–80 % por sesión (76,8 % de la semana). RIR 2–3.
  - Semana 2: volumen completo; RIR 1–3 en compuestos, 1–2 en aislados.
  - Semana 3: mismo volumen; compuestos 1–2; aislados 1–2 y la última serie 0–1. La carga solo sube donde se cumplan los criterios.
  - Semana 4: consolidación; compuestos 1–2 (sin fallo técnico); aislados 1 y la última serie 0–1 (puede acercarse al fallo).
- Cada sesión trae: ejercicio y orden, series exactas, reps objetivo por serie y rango, carga objetivo o «pendiente de calibración»,
  RIR por serie, descanso, calentamiento, técnica y volumen muscular (series directas e indirectas ponderadas).
- Los rangos son objetivos de trabajo; el RIR objetivo evita el fallo sistemático.

## 4. Reglas del bloqueo

1. Se elige el lunes de inicio (hoy si es lunes, o uno de los dos siguientes). Antes del día 1 el programa está «programado»:
   no bloquea y se puede desprogramar.
2. **Del día 1 a las 0:00 al día 28 a las 23:59 (hora de Santo Domingo)** y mientras haya una sesión del programa en curso:
   - no se puede empezar ninguna sesión libre del reloj (rutinas, superseries, fuerza, «otro ejercicio hoy», cierre de déficits),
     ni retomar una sesión libre, ni empezar un bloque, ni activar otro programa (`pgBloqueaLibre` → `iniciarSesion` lanza error);
   - no se pueden elegir ejercicios de otra sesión: el modo entrenamiento solo tiene los de la sesión del día;
   - no se pueden adelantar sesiones (`futura`) ni entrenar una fecha pasada (`pasada`);
   - no se puede reiniciar el programa: activar otro devuelve `ya`; cancelar archiva el programa con todos sus datos e
     incumplimientos; restaurar una copia no sustituye el programa del teléfono;
   - cerrar y abrir la app no cambia nada: el estado está guardado y, si hay sesión en curso, se vuelve a ella.
3. Los otros programas se ven, pero el reloj queda deshabilitado con el mensaje: «Programa de hipertrofia activo. Tu compromiso
   de 28 días continúa. Próxima sesión disponible: [fecha y nombre].»
4. Siempre accesibles: datos, ajustes, historial, copias de seguridad, «cuidar una zona» y la salida por seguridad.
5. El ciclo se cierra (informe y desbloqueo) pasado el día 28, o el mismo día 28 cuando todas sus sesiones tienen estado final.
   No es irreversible: existe la cancelación justificada (sección 6).

## 5. Modo entrenamiento y sesión interrumpida

- Tocar «Entrenar ahora» crea la sesión (o la recupera) y entra en modo entrenamiento **sin segunda confirmación**: primer
  ejercicio, series, reps, carga, descanso. No anota nada.
- Fases distintas en pantalla: sesión iniciada → serie en curso (cronómetro) → registro (carga real, reps reales, RIR) → descanso
  (cuenta atrás) → pausa → todas las series resueltas → finalizar.
- Una sola sesión a la vez (`otra`); el mismo hueco no se registra dos veces (`dup`, identificador único); los toques repetidos en
  menos de 0,9 s se ignoran (`rebote`). El botón principal ocupa todo el ancho; omitir, pausa, finalizar y abandonar van aparte.
- Navegar entre ejercicios solo los muestra; «Hacer este ejercicio ahora» cambia el orden; ninguna de las dos cosas los completa.
- **Recuperación**: cada acción se guarda al momento. Al abrir la app con una sesión en curso se vuelve a la pantalla de
  entrenamiento en la misma fase. Si se cerró en mitad de una serie, sigue «serie en curso» y su duración se mide desde el toque
  real de empezar. Si la sesión cruza la medianoche, sigue siendo la de su día.
- **Sesión olvidada**: tras 6 h sin tocar nada aparece «Cerrar como no terminada» (queda abandonada, con lo registrado).

## 6. Opciones de desbloqueo

| Camino | Cuándo | Qué pide | Cómo queda |
|---|---|---|---|
| A. Finalización normal | Todas las series registradas u omitidas con motivo | Nada más | Completada (todas válidas) o completada parcialmente (≥ 50 % válidas). Con menos de la mitad no se puede: hay que abandonar o salir por seguridad |
| B. Abandono voluntario | En cualquier momento | Ver progreso y pendientes, motivo, escribir «ABANDONAR ENTRENAMIENTO» y **sostener 15 s** (medido en la capa de estado; soltar reinicia) | Abandonada con fecha, hora, progreso real y motivo. No reabre la sesión hoy ni habilita otra |
| C. Salida por seguridad | En cualquier fase, también durante una serie o en pausa | Tocar el motivo (lesión, dolor relevante, enfermedad, emergencia, imposibilidad justificada). **Sin demoras, frases ni esperas** | Interrumpida por seguridad; lo hecho se conserva; nunca cuenta como completada; ofrece reprogramar como pronto en 48 h |
| Cancelación del programa | Por causa justificada | Motivo. Por lesión o enfermedad basta confirmarlo; por otro motivo, explicarlo y escribir «CANCELAR PROGRAMA» | Archivado con su informe hasta ese día; se desbloquea todo; nada se borra |

Reprogramación (sesión omitida, abandonada o interrumpida): una vez por sesión, a un miércoles libre del ciclo entre hoy y 7 días
después de su fecha, sin una sesión del mismo grupo principal el día antes ni el día después. Nunca dos sesiones el mismo día ni
volumen acumulado en otra sesión. Si no hay día compatible, queda como estaba.

## 7. Progresión doble

Por ejercicio, con la última aparición en el programa (solo series válidas: sin imposibles ni improbables, hora verificable):
- todas las series programadas al tope del rango **con la misma carga** y la reserva pedida → sube un paso (`cambiaKg`) y reps al mínimo;
- al tope sin anotar la reserva, o con menos reserva de la pedida → repite la carga;
- con la misma carga, la primera serie pierde 2+ reps o el total baja > 10 % → **no sube**: mantén o baja 5–10 % y revisa fatiga y descanso;
- primera serie por debajo del mínimo sin reserva → baja un paso;
- si no → misma carga y +1 rep por serie (hasta el tope).
Las series con cargas distintas no se mezclan: solo cuentan las de la carga de la primera serie. Sin datos: «pendiente de
calibración». Con un dato real del mismo ejercicio (historial de las últimas 10 semanas o «Mis cargas»), una carga **estimada**
y etiquetada con su origen. La carga objetivo se puede ajustar en la sesión (o anotar la real); nunca se reescriben series hechas.

## 8. Hora y calendario

- Zona horaria fija `America/Santo_Domingo` (UTC−4 todo el año), con `Intl` y respaldo fijo.
- `pgAhora`: hora del teléfono + corrección de la red (cabecera `Date` del propio servidor, si hay conexión) + saltos detectados con
  la app abierta (`performance.now`), y **nunca hacia atrás** (marca de agua).
- Hora atrasada a mano: se usa la marca; no se puede volver a un día pasado. Hora adelantada con la app abierta: se compensa.
  Hora adelantada con la app cerrada y sin red: no se puede distinguir del paso del tiempo; en cuanto la red da la hora real, lo
  registrado «en el futuro» queda con la hora no verificable y no cuenta para la adherencia ni la progresión.

## 9. Informe final

Sesiones programadas y realizadas, adherencia (sesiones y series), volumen semanal por músculo, cargas, reps y 1RM estimado por
ejercicio, RIR anotado, sesiones no completadas, registros inválidos (tiempo imposible, improbables, duración desconocida, sesiones
en tiempo imposible, hora no verificable, descansos saltados), fatiga si hay «cómo llegas», medidas si las hay y recomendaciones.
**Rendimiento no es crecimiento**: el informe lo dice explícitamente y solo habla de cambios corporales con medidas al inicio y al final.

## 10. Pruebas

`node _pruebas/node/programa.test.js` (61 pruebas: los 24 casos obligatorios y extras, sobre la capa de estado, la persistencia, la
interfaz generada y los manejadores de toques reales). Regresión: `node _pruebas/node/rendimiento.test.js` y
`node _pruebas/node/antiguas.js` (mismo resultado que antes del cambio). Las pruebas de Chrome las ejecuta el usuario.

## 11. Limitaciones conocidas

- PWA sin servidor propio: sin conexión, una hora adelantada con la app cerrada no se detecta hasta que vuelva la red.
- Quien edite `localStorage` a mano con las herramientas del navegador puede alterar el estado; los datos se validan al leer,
  pero no hay firma criptográfica.
- El historial es un espejo: editar o borrar ahí una sesión del programa no cambia los registros del programa (fuente de verdad).
- No hay versión para reloj inteligente: la app es web.
- La sesión que cruza la medianoche cuenta para su día; la del día siguiente queda disponible al cerrarla (la app no impide
  entrenar dos días seguidos según el calendario, que ya los prevé).
