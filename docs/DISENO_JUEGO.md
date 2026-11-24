# Diseño del juego

## Idea

Un «¿Dónde está Wally?» sobre un mundo infinito con aspecto de satélite. Cada día hay un mundo nuevo, el mismo para todos, y una competición global por tiempo.

## Bucle diario

1. **Postal del día** (gratis): vista de 45 km alrededor del globo, desplazada para que el globo no quede en el centro, y la zona de la isla.
2. **Localizar**: reconocer costa, lagos, bosques y pueblos de la postal en el mapa completo.
3. **Acercarse**: en una zona de 3 km suele haber unos 10 globos.
4. **Comprobar**: los globos se distinguen de cerca. El bueno lleva gajos rosa y blanco y corona amarilla.
5. **Compartir**: resultado al estilo Wordle (`Otea #12 · 2:31 🟥🟨`).

## Puntuación

| Concepto | Valor |
|---|---|
| Tiempo base | Desde que se pulsa «Empezar» hasta tocar el globo bueno |
| Impostor tocado | +5 s (cada impostor solo penaliza una vez) |
| Postal cercana | +20 s |
| Toque en el vacío | Sin penalización |
| Globo demasiado pequeño en pantalla (< 4 px) | No cuenta: «acércate más» |

Una partida por persona y día. Recargar la página no reinicia el reloj.

## Impostores

Rejilla de ~520 m; en cada celda hay un globo con un 30 % de probabilidad. Alrededor del 40 % de los impostores son «casi iguales»:

- Mismos gajos, corona del color de los gajos.
- Mismos gajos, corona de otro color.
- Gajos con el color de la corona.
- Un tono parecido (morado en lugar de rosa).

El resto son globos de otros colores, que dan contexto y realismo.

## Dificultad

Palancas para ajustarla en `shared/src`:

- Tamaño de las postales (`world.js`, `postcards`).
- Densidad de globos (`world.js`, `balloonAt`, umbral `77/256`) y la misma cifra en el shader.
- Proporción de impostores casi iguales (`variant`).
- Penalizaciones (`constants.js`).

Si cambias la densidad o las variantes, cambia también `web/src/engine/world.frag.glsl` (ver ARQUITECTURA).

## Ideas para siguientes versiones

- Equipos y ligas entre amigos.
- Rachas y estadísticas personales.
- Archivo de mundos anteriores (modo práctica, posible parte de pago).
- Modo sala para eventos y empresas (pantalla grande y jugadores con el móvil).
