# Zumbo

**Un mundo nuevo cada día. Y Zum, escondido en algún sitio.**

Zumbo es un juego diario de búsqueda. Cada día se genera un mundo con aspecto de satélite, el mismo para todos los jugadores, y en algún punto se esconde **Zum**, un dron diminuto con un solo ojo. Hay que encontrarlo entre drones impostores casi iguales. El zoom va de la isla entera (unos 400 km) hasta el suelo a escala de centímetros.

Web: https://zumbo.es (pendiente de conectar) · Firebase: `zumbo-a4359`

## Cómo se juega

1. Te dan una **postal**: una vista de 45 km de la zona donde está Zum, y la zona de la isla (por ejemplo, «el noroeste»).
2. Encuentras ese sitio en el mapa y te acercas.
3. Tocas a Zum: cuerpo rosa, cuatro hélices, ojo con pupila rosa y luz amarilla. Cada impostor que tocas suma **5 s**.
4. Si te atascas, hay dos postales más cercanas (3,2 km y 300 m). Cada una suma **20 s**.

Gana el tiempo más bajo del día. A medianoche (hora de Madrid) aparece un mundo nuevo.

## Arrancar en local

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173). En `npm run dev` todo funciona en el navegador, con el ranking guardado solo en ese dispositivo.

| Comando | Qué hace |
|---|---|
| `npm test` | Tests del mundo y de las reglas (determinismo, Zum en tierra, toques). |
| `npm run build` | Compila la web (`web/dist`, ya conectada a Firebase) y las funciones (`functions/dist`). |
| `npm run preview` | Sirve la web compilada. |
| `npm run emulators` | Arranca Firebase en local (requiere `firebase-tools`). |
| `npm run deploy` | Publica web, funciones y reglas en Firebase (`zumbo-a4359`). |

Para ver un mundo patrocinado de prueba: `http://localhost:5173/?tema=ejemplo-festival`.

## Estructura

```
shared/      El mundo: semilla diaria, ruido, relieve, drones, reglas y temas. Lo usan web y servidor.
web/         La app (Vite + JavaScript): motor WebGL2, cámara, interfaz y servicios.
functions/   Firebase Cloud Functions: árbitro de cada partida y ranking.
docs/        Diseño, arquitectura, marca, patrocinios, despliegue y hoja de ruta.
prototipos/  Las versiones de un solo fichero de las que sale el proyecto (Tico y Otea).
```

## Documentación

- [Diseño del juego](docs/DISENO_JUEGO.md)
- [Arquitectura técnica](docs/ARQUITECTURA.md)
- [Marca](docs/MARCA.md)
- [Mundos patrocinados](docs/PATROCINIOS.md)
- [Despliegue en Firebase](docs/DESPLIEGUE.md)
- [Hoja de ruta](docs/ROADMAP.md)
