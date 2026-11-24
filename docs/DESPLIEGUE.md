# Despliegue en Firebase

Proyecto: **zumbo-a4359** (ya configurado en `.firebaserc` y `web/.env.production`).

## 1. Consola de Firebase (una sola vez)

1. Plan **Blaze** (necesario para Cloud Functions). Pon un presupuesto con alerta de 5–10 €.
2. **Firestore** creado en `europe-west1`, modo producción.
3. **Authentication → Método de acceso**: activa **Anónimo**, **Correo electrónico/contraseña** y **Google** (en Google elige un correo de asistencia y guarda).
4. **Authentication → Configuración → Dominios autorizados**: añade `zumbo.es` y `www.zumbo.es` cuando conectes el dominio (si no, el botón de Google falla en ese dominio).

## 2. Herramientas (una sola vez)

```bash
npm install -g firebase-tools
firebase login
```

## 3. Publicar

```bash
npm run setup      # instala la web y, aparte, las funciones
npm run deploy
```

> Consejo: no tengas el proyecto dentro de OneDrive. La sincronización bloquea ficheros de `node_modules` y `npm install` falla con `EPERM`. Mejor en una carpeta como `C:\dev\zumbo`.

Publica las reglas de Firestore, las funciones (`europe-west1`) y la web. Al terminar, la portada está en https://zumbo-a4359.web.app y el juego en https://zumbo-a4359.web.app/jugar/.

## 4. Probar en local con emuladores (opcional)

```bash
cp web/.env.example web/.env     # y descomenta el bloque de emuladores
npm run emulators                 # en una terminal
npm run dev                       # en otra
```

## 5. Dominio zumbo.es

Firebase → Hosting → **Añadir dominio personalizado** → `zumbo.es` (y `www.zumbo.es`). Te dará unos registros DNS (A y TXT) que hay que añadir en el panel de tu registrador. Tarda de minutos a unas horas.

## 6. Mundos patrocinados

Firestore → colección `schedule` → documento con la fecha (`2026-12-24`) → campo `themeId` con el id del tema. Ver `docs/PATROCINIOS.md`.
