# v39 · Rendimiento y recuperación (seguimiento longitudinal)

Documento de diseño. Primero la auditoría de lo que había, después los datos disponibles y, al final, las reglas que aplica
`rendimiento.js`. Todo es orientativo: **ninguna regla diagnostica sobreentrenamiento, lesión ni recuperación**.

## 1. Auditoría de la estructura actual (v38b)

| Pieza | Dónde | Qué hace | Problema para este objetivo |
|---|---|---|---|
| Volumen semanal por zona y grupo | `reloj.js` → `volumen(a,b)`, `volSemana`, `volMus`, `estadoVol` | Suma series efectivas desde el lunes 00:00 y las compara con un objetivo orientativo (gris, ámbar, verde, azul, rojo) | El color **es el único estado** del mapa y de las barras. El lunes vuelve a gris («sin series») aunque el rendimiento haya bajado: no hay memoria. |
| Rendimiento comparable | `analisis.js` → `anComparables`, `anClasifica` | Primera serie principal de cada sesión y ejercicio; 1RM estimado (Epley con reserva) o reps al fallo; tendencia de Theil–Sen | Una sola clasificación global por ejercicio (necesita 4 sesiones), sin ventanas de 7/14/28 días, sin detectar caídas consecutivas, sin distinguir cambios voluntarios de carga, reserva, orden o programa. |
| Plan de hoy | `analisis.js` → `anPlanGrupo` | Recomienda mantener, reducir, modificar o aplazar con motivos | Usa la «caída sostenida» anterior. No bloquea (salvo pausa por dolor extremo, que es de «cuidar»). |
| Descarga | `reloj.js` → `descargaActiva`, `estancados`, `consejoDescarga` | Semana de descarga manual o del bloque; las sesiones guardan `desc:true` | El consejo decía «es fatiga acumulada», una conclusión que los datos no permiten. |
| Bienestar diario | clave compartida `bienestar-diario` | Sueño (h) y energía (1–5) por día | No hay dolor muscular ni fatiga subjetiva. |
| Medallas, estadísticas, auditoría, copia | `reloj.js`, `auditoria.js` | Se recalculan del historial | Deben quedar intactas. |

## 2. Datos disponibles en cada sesión guardada

- Sesión: `start` (fecha), `g` (grupo), `desc` (descarga), `fza` (día de fuerza), `cuida` (zona cuidada: ejercicios adaptados),
  `rut.n` (rutina = programa), `fis` (tiempos medidos, desde v38). Las sesiones antiguas pueden no tener `ej` en sus series
  (se reconoce el ejercicio con `nomFila`) ni `fis`.
- Serie: `ej`, `k` (`act.` principal, `myo` mini-serie, `cal.` calentamiento…), `reps`, `rir` (`0`–`3`, `3+`/`4+` = cotas, `—`),
  `kg` (o `niv` nivel de máquina; 0 = peso corporal solo en ejercicios corporales: `cargaDe`), `kgSrc`, `kgCambio`, `plaus`.
- Del orden de las filas sale la **posición** de cada ejercicio en la sesión.
- Lo que **no** hay: técnica, tempo real, dolor por músculo (hasta ahora), marcadores fisiológicos. Por eso no se calcula ninguna
  «puntuación de recuperación»: no hay forma validada de estimarla con estos datos.

## 3. Reglas de evaluación

### 3.1 Observación por sesión y ejercicio
Una por ejercicio y sesión: fecha, posición, número de series principales y totales, series efectivas, reserva media y la
**medida comparable** de la primera serie principal verosímil con reserva numérica (`0`–`3`): 1RM estimado si hay peso,
reps hasta el fallo (reps + reserva) con peso corporal o nivel de máquina. Sin carga conocida, con reserva `3+`/`4+`/`—`
o con la serie marcada imposible/improbable, la sesión se registra pero no se mide.

Ejercicios equivalentes: el nombre se normaliza (mayúsculas, tildes, signos, «mancuernas» = «mancuerna») y se pueden declarar
equivalencias (`rd.equiv`). Cada ejercicio se compara **solo consigo mismo**; el grupo combina ejercicios por sus cambios
relativos, así que cambiar de ejercicio no se lee como una caída.

### 3.2 Condiciones comparables (dos sesiones seguidas del mismo ejercicio)
No se comparan, y la segunda empieza una **nueva referencia**, si:

| Cambio | Regla (configurable) |
|---|---|
| Tipo de carga o nivel de máquina | distinto |
| Bajada voluntaria de carga | más de un 10 % menos de peso |
| Carga y repeticiones a la vez | peso distinto y repeticiones ×1,5 o ÷1,5 (Epley pierde precisión) |
| Reserva buscada | diferencia ≥ 2 |
| Orden en la sesión | se mueve ≥ 2 puestos |
| Modalidad | día de fuerza frente a hipertrofia |
| Cuidar una zona | en una sí y en otra no |
| Programa | rutina distinta |
| Tiempo | más de 42 días entre las dos |
| Cambio marcado por ti | técnica, ejercicio, programa u otro (en la última sesión o desde la próxima) |

Las sesiones de **descarga** no se comparan ni entran en la referencia; la siguiente sesión normal se compara con la última
anterior a la descarga.

### 3.3 Caída y racha
Referencia = mediana de las últimas 3 sesiones comparables anteriores a la racha (hacen falta al menos 2).
Una sesión **cae** si su medida queda más de un **5 %** por debajo de la referencia. Racha = sesiones comparables
consecutivas que caen. La racha termina («señal resuelta») con una sesión comparable que vuelve a la referencia, o queda
**sin confirmar** si se rompe la comparabilidad (cambio voluntario o tiempo).

### 3.4 Clasificación por ejercicio
1. **Descarga voluntaria**: la última sesión del ejercicio fue de descarga (hace ≤ 10 días) o hay una descarga activa.
2. **Recuperación posiblemente incompleta**: racha de ≥ 2 caídas que abarca ≥ 72 h; o descenso gradual: la mediana de las dos
   últimas sesiones queda > 5 % por debajo del mejor nivel mantenido en dos sesiones seguidas, con ≥ 2 sesiones después.
3. **Fatiga aguda posible**: racha de 1 caída, o de varias dentro de 72 h.
4. **Estancamiento prolongado**: el mejor nivel mantenido (dos sesiones seguidas) tiene ≥ 28 días, con ≥ 4 sesiones
   comparables y ninguna lo supera en más de un 2 %.
5. **Progreso normal**: el resto, con al menos 2 sesiones comparables (incluye mejoría y fluctuación normal).
6. Neutros: **nueva referencia** (cambio voluntario reciente, aún sin comparación) y **datos insuficientes**.

### 3.5 Tiempo y nuevas evidencias (nada se borra por cambiar de semana)
Las señales no dependen de la semana: se recalculan desde el historial. Con el descanso pasan de **activa** a **atenuada**
(4 días sin estimular la zona tras una fatiga aguda posible, 7 tras una recuperación posiblemente incompleta), pero **siguen
visibles** hasta que una sesión comparable las resuelva (vuelves a la referencia) o las confirme (vuelve a caer). Una señal cuya
comparabilidad se rompió queda **sin confirmar** mientras la nueva referencia no tenga datos.

### 3.6 Contexto mostrado con cada señal (factores que coinciden, no causas)
Proximidad (horas desde el estímulo directo anterior de la zona, < 48 h), carga previa (series efectivas de la sesión anterior
del grupo frente a su media), volumen (7 días frente a la media semanal de los 21 anteriores, ≥ ×1,3), esfuerzo (reserva media
≤ 1 en 7 días), semanas sin descarga (≥ 8), series del ejercicio, y lo anotado opcionalmente: sueño, energía, fatiga
subjetiva (1–5) y dolor muscular por grupo (0–3).

### 3.7 Grupo muscular y zona
Estado = el más relevante de sus ejercicios (incompleta > aguda > estancamiento > descarga > normal > nueva referencia >
insuficiente; activa antes que atenuada), con el número de ejercicios afectados. Si hay una descarga activa, el grupo muestra
«Descarga voluntaria» y conserva las señales pendientes. Ventanas de 7, 14 y 28 días: sesiones, series efectivas (`volumen()`,
la misma cuenta que el mapa), reserva media, horas medianas entre sesiones y cambio de rendimiento (mediana, sobre los
ejercicios, del cambio de cada uno frente a su referencia).

### 3.8 Lo que el sistema nunca hace
- No concluye sobreentrenamiento ni da una puntuación fisiológica de recuperación.
- No bloquea: con cualquier advertencia se entrena igual. El plan de hoy solo sugiere «reducir volumen» ante una recuperación
  posiblemente incompleta activa.
- No toca el volumen semanal, sus colores, las medallas, las estadísticas ni las sesiones guardadas.

## 4. Persistencia y compatibilidad
- `reloj-anomalo-rendimiento`: umbrales, cambios marcados y equivalencias. `reloj-anomalo-sensaciones`: fatiga y dolor por día.
  El sueño sigue en `bienestar-diario` (compartido con Comida). Ambas claves van en la copia de seguridad y se fusionan al
  restaurar.
- El historial no cambia de formato: todo se deduce de las sesiones que ya existen (también las antiguas).

## 5. Pruebas
`node _pruebas/node/rendimiento.test.js` carga los scripts reales de la app en Node (`_pruebas/node/entorno.js`) y comprueba:
fatiga acumulada, caída aislada, bajada voluntaria de carga, cambio de reserva, de ejercicio, de orden y de técnica, descarga,
estancamiento, descenso gradual, recuperación, persistencia entre semanas, atenuación por descanso, umbrales configurables,
ejercicios con peso corporal, sensaciones, ventanas, que nada bloquea, que nunca se afirma sobreentrenamiento y que el volumen,
las medallas y el historial antiguo no cambian.
