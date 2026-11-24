# Mundos patrocinados

## Qué se vende

Un día del calendario con un mundo hecho para una marca: sus colores en el globo objetivo, un tinte propio del paisaje y su nombre en pantalla («Mundo patrocinado por…»). El jugador pasa varios minutos mirando el mapa con atención, que es justo lo que interesa a un anunciante.

Formatos posibles:

- **Mundo del día**: una fecha concreta.
- **Semana temática**: varios días seguidos (lanzamientos, festivales).
- **Globo de marca**: el objetivo con los colores de la marca en un día normal.
- **Mundo privado**: para eventos o empresas, con su propio ranking.

Métricas que se pueden enseñar: jugadores únicos, tiempo medio en el mapa, resultados compartidos.

## Cómo crear uno

1. En `shared/src/themes.js`, copia `ejemplo-festival` con un `id` nuevo y cambia:
   - `name`, `sponsor` (nombre, url, mensaje).
   - `target`: `label`, `c1` (gajos), `c2` (gajos alternos), `crown` (corona), `decoyCrown` (corona de los impostores casi iguales).
   - `world`: `landTint` y `waterTint` (multiplicadores RGB, cerca de 1), `townDensity` (0,05–0,3), `cloudCover` (0–0,3).
2. Pruébalo en local: `http://localhost:5173/?tema=tu-id`.
3. Despliega (`npm run deploy`).
4. En la consola de Firestore, crea el documento `schedule/AAAA-MM-DD` con el campo `themeId: "tu-id"`.

Ese día, web y servidor usarán el tema y la semilla del patrocinador.

## Pendiente para hacerlo vendible

- Kit de ventas (una página con ejemplos y métricas).
- Posibilidad de colocar el logo de la marca en un tejado o campo del mapa.
- Panel interno para programar temas sin tocar la consola.
