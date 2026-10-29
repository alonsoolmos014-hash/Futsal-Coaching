# Olmos Coaching 6.0.1 — Corrección de modo demo y Google Login

## Error solucionado

La versión 6.0 comprobaba incorrectamente el campo opcional `storageBucket` como obligatorio. Al estar vacío, marcaba Firebase como no configurado y activaba demo. La versión 6.0.1 **solo valida `apiKey`, `authDomain`, `projectId` y `appId`**. La subida manual de fotos continúa siendo opcional.

## Actualizar desde GitHub (sin PowerShell)

1. Entra a https://github.com/alonsoolmos014-hash/Futsal-Coaching/blob/main/index.html
2. Pulsa **Edit this file** (ícono de lápiz).
3. Busca `const configured = Object.values(firebaseConfig)` y reemplaza la condición vieja por:

```js
const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const configured = requiredFirebaseKeys.every(key => {
  const value = firebaseConfig[key];
  return typeof value === 'string' && value.trim().length > 0 && !value.startsWith('PEGA_TU_');
}) && OWNER_EMAIL.includes('@') && OWNER_EMAIL !== 'tu_correo@gmail.com';
```

4. Guarda en `main` con **Commit changes**. O, si prefieres, reemplaza el archivo `index.html` por el del ZIP 6.0.1.
5. Abre tu sitio GitHub Pages y recarga con **Ctrl + F5**. El mensaje “demo” debería desaparecer y aparecer Google Login.

## Configuración adicional que puede bloquear Google Login

En Firebase Console → Authentication → Settings → **Authorized domains** asegúrate de incluir:

- `alonsoolmos014-hash.github.io` (sin `https://`, sin `/Futsal-Coaching/`).
- `futsal-coaching.web.app` si también usas ese sitio.

En Authentication → Sign-in method, habilita **Google**.

Si Google deja ingresar pero los módulos muestran **Missing or insufficient permissions**, es otro problema: publica las reglas `firestore.rules` (ya incluidas en el ZIP) desde Firebase Console. No uses reglas públicas.

**No reemplaces la configuración de Firebase por claves de ejemplo ni publiques claves privadas de servidor.**

No se tocaron tus cuentas ni los datos existentes de Firestore; esta corrección solo modifica la validación de inicialización del navegador. Actualizar GitHub Pages no actualiza automáticamente Firebase Hosting, salvo que GitHub Actions esté configurado y se ejecute correctamente.
