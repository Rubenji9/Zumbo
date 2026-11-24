# Arquitectura

## Visión general

```
           ┌────────────── shared/ ──────────────┐
           │ semilla diaria · ruido · relieve     │
           │ drones · reglas · temas              │
           └──────┬───────────────────────┬──────┘
                  │                       │
        web/ (navegador)          functions/ (Firebase)
   shader WebGL2 + cámara +       árbitro: startRun, tap,
   interfaz + servicios           useHint, getMyRun
                  │                       │
                  └──── Firestore ────────┘
          leaderboards/{día}/entries · runs · schedule
```

## El mundo es una función

No hay imágenes ni teselas. Todo sale de la fecha:

1. `worldSeed(fecha, tema)` → semilla de 30 bits.
2. El relieve es ruido de gradiente fractal con 26 octavas (de 133 km a 8 mm por celda), con deformación de dominio y «erosión» por derivadas.
3. Biomas, campos, árboles, pueblos, carreteras, agua y nubes se calculan en el shader a partir de ese relieve y de otros ruidos.
4. Zum es una posición calculada para el día. Los drones impostores están en una rejilla y su posición y aspecto salen de un hash de la celda.

### Precisión con zoom extremo

Un `float` de GPU solo tiene unos 7 dígitos, y a 1 cm por píxel en un mundo de 400 km hacen falta 8. La solución: para cada octava, la CPU (en doble precisión) calcula la celda entera y la fracción de la cámara (`uOI`, `uOF`). La GPU solo suma un desplazamiento pequeño en píxeles. Así todas las octavas son exactas a cualquier zoom.

### Gemelo CPU / GPU

`shared/src/noise.js` es una copia exacta del hash y del ruido de `web/src/engine/world.frag.glsl`. El hash usa solo multiplicaciones enteras de 32 bits, que dan el mismo resultado en JavaScript (`Math.imul`) y en GLSL (`uint`). Gracias a eso, el servidor sabe dónde está cada dron sin pintar nada.

**Regla de oro:** cualquier cambio en `hsh`, `nz`, `terrain`, la rejilla de drones o `variant` hay que hacerlo en los dos sitios. Los tests de `shared/test` cubren la parte de la CPU.

## Rendimiento

- Solo se evalúan las octavas mayores que ~0,8 px.
- Mientras te mueves se pinta a media resolución; al parar, a resolución completa (`main.js`, `HI`/`LO`).
- La resolución máxima se limita a ~2,4 millones de píxeles.
- El shader solo calcula campos, árboles, pueblos, olas y drones cuando su escala es visible.

## Backend

Modo `local` (por defecto): `web/src/services/localServer.js` aplica las mismas reglas en el navegador.

Modo `firebase`: el cliente nunca escribe su tiempo.

| Función | Qué hace |
|---|---|
| `startRun` | Crea `runs/{día}_{uid}` con la hora de inicio del servidor. |
| `tap` | Juzga el toque con `judgeTap`, suma impostores y, si acierta, publica el resultado en `leaderboards/{día}/entries/{uid}`. |
| `useHint` | Desbloquea la siguiente postal (máximo 2). |
| `getMyRun` | Devuelve la partida en curso o el resultado. |

Autenticación anónima. Las reglas de Firestore solo permiten leer el ranking y el calendario, y cada jugador solo lee su partida.

### Limitación conocida (antitrampas)

El cliente necesita saber dónde está Zum para pintarlo, así que alguien con conocimientos podría sacarlo del código. Lo que sí está protegido: el tiempo lo mide el servidor y no se puede escribir el ranking a mano. Mejoras posibles en `ROADMAP.md`.

## Temas

`shared/src/themes.js` define los colores de Zum (cuerpo, pupila, luz), la pupila de los impostores casi iguales, un tinte de tierra y agua, densidad de pueblos y nubes. El tema cambia también la semilla, así que un mundo patrocinado es distinto del normal del mismo día.
