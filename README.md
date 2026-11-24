# Otea

**Un mundo nuevo cada día. Encuentra el globo antes que nadie.**

Otea es un juego diario de búsqueda. Cada día se genera un mundo con aspecto de satélite, el mismo para todos los jugadores, y hay que encontrar un globo aerostático concreto entre miles de impostores. El zoom va de la isla entera (unos 400 km) hasta el suelo a escala de centímetros.

> *Otear: mirar a lo lejos desde un sitio alto.*

## Cómo se juega

1. Te dan una **postal**: una vista de 45 km de la zona donde está el globo, y la zona de la isla (por ejemplo, «el noroeste»).
2. Encuentras ese sitio en el mapa y te acercas.
3. Tocas el globo correcto (rosa con corona amarilla). Cada impostor que tocas suma **5 s**.
4. Si te atascas, la **postal cercana** (3,2 km) suma **20 s**.

Gana el tiempo más bajo del día. A medianoche (hora de Madrid) aparece un mundo nuevo.

## Arrancar en local

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173). En modo local todo funciona en el navegador, con el ranking guardado solo en ese dispositivo.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Tests del mundo y de las reglas (determinismo, objetivo en tierra, toques). |
| `npm run build` | Compila la web (`web/dist`) y las funciones (`functions/dist`). |
| `npm run preview` | Sirve la web compilada. |
| `npm run emulators` | Arranca Firebase en local (requiere `firebase-tools`). |
| `npm run deploy` | Publica web, funciones y reglas en Firebase. |

Para ver un mundo patrocinado de prueba: `http://localhost:5173/?tema=ejemplo-festival`.

## Estructura

```
shared/      El mundo: semilla diaria, ruido, relieve, globos, reglas y temas. Lo usan web y servidor.
web/         La app (Vite + JavaScript): motor WebGL2, cámara, interfaz y servicios.
functions/   Firebase Cloud Functions: árbitro de cada partida y ranking.
docs/        Diseño, arquitectura, marca, patrocinios, despliegue y hoja de ruta.
prototipos/  Las versiones de un solo fichero de las que sale el proyecto.
```

## Documentación

- [Diseño del juego](docs/DISENO_JUEGO.md)
- [Arquitectura técnica](docs/ARQUITECTURA.md)
- [Marca](docs/MARCA.md)
- [Mundos patrocinados](docs/PATROCINIOS.md)
- [Despliegue en Firebase](docs/DESPLIEGUE.md)
- [Hoja de ruta](docs/ROADMAP.md)
