# Despliegue en Firebase

## 1. Proyecto

1. Crea un proyecto en https://console.firebase.google.com (plan **Blaze**, necesario para Cloud Functions; el uso inicial suele quedar dentro de la capa gratuita).
2. Activa **Authentication → Método de acceso → Anónimo**.
3. Crea **Firestore** en `europe-west1`.
4. Registra una **app web** y copia su configuración.

## 2. Configuración local

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc     # pon el id de tu proyecto
cp web/.env.example web/.env           # VITE_BACKEND=firebase y los datos de la app
```

## 3. Probar con emuladores

```bash
# en web/.env: VITE_FIREBASE_EMULATORS=true
npm run emulators      # en una terminal
npm run dev            # en otra
```

## 4. Publicar

```bash
npm run deploy
```

Publica las reglas de Firestore, las funciones (`europe-west1`) y la web en Firebase Hosting.

## 5. Dominio

Hosting → Añadir dominio personalizado, y sigue los pasos de DNS.
