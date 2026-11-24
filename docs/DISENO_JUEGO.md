# Diseño del juego

## Idea

Un «¿Dónde está Wally?» sobre un mundo infinito con aspecto de satélite. Cada día hay un mundo nuevo, el mismo para todos, con Zum escondido, y una competición global por tiempo.

## Bucle diario

1. **Postal del día** (gratis): vista de 45 km alrededor de Zum, desplazada para que no quede en el centro, y la zona de la isla.
2. **Localizar**: reconocer costa, lagos, bosques y pueblos de la postal en el mapa completo.
3. **Acercarse**: Zum mide unos 3 m, así que hay que bajar hasta ver árboles y tejados.
4. **Comprobar**: los drones se distinguen de cerca. Zum: cuerpo rosa, cuatro hélices, pupila rosa, luz amarilla.
5. **Compartir**: resultado al estilo Wordle (`Zumbo #12 · 2:31 🟥🟨`).

## Puntuación

| Concepto | Valor |
|---|---|
| Tiempo base | Desde que se pulsa «Empezar» hasta tocar a Zum |
| Impostor tocado | +5 s (cada impostor solo penaliza una vez) |
| Postal cercana (3,2 km) | +20 s |
| Postal muy cercana (300 m) | +20 s |
| Toque en el vacío | Sin penalización |
| Dron demasiado pequeño en pantalla (< 4 px) | No cuenta: «acércate más» |

Una partida por persona y día. Recargar la página no reinicia el reloj.

## Impostores

Rejilla de ~260 m; en cada celda hay un dron con un 45 % de probabilidad (unos 6–7 por km²). Alrededor del 45 % son «casi iguales»:

- Pupila de otro color.
- Tres hélices en lugar de cuatro.
- Con antena.
- Luz roja en lugar de amarilla.

El resto son drones de otros colores, que dan contexto y despistan desde lejos.

## Dificultad

Palancas en `shared/src`:

- Tamaño de las postales (`world.js`, `POSTCARD_WIDTHS`).
- Densidad de drones (`constants.js`, `DRONE_DENSITY`) y el mismo número en el shader (`115u`).
- Proporción de impostores casi iguales (`variant`), igual en el shader.
- Penalizaciones (`constants.js`).

Si cambias la densidad o las variantes, cambia también `web/src/engine/world.frag.glsl` (ver ARQUITECTURA).

## Siguientes pasos de diseño

- Esconder a Zum en sitios con historia: tejados, playas, barcos, plazas.
- Escenas con gracia repartidas por el mapa (la clave de Wally).
- Un barrio futurista como prueba de estilo (ciudad densa con neones, drones por todas partes).
- Equipos, ligas entre amigos y rachas.
- Modo sala para eventos y empresas.
