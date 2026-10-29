# Guía Olmos Coaching 6.0: GitHub Pages + Firebase

Tu repo: **https://github.com/alonsoolmos014-hash/Futsal-Coaching**

Tu sitio Firebase: **https://futsal-coaching.web.app/**

## 0. Antes de actualizar

1. En GitHub, descarga `Code → Download ZIP` para tener respaldo del código actual.
2. En Firebase Console → Firestore Database → Rules, copia las reglas actuales a un archivo de respaldo antes de reemplazarlas.
3. Si tienes información importante en la aplicación, usa su función de respaldo/exportación.
4. No pegues claves privadas de OpenAI ni cuentas de servicio en `index.html` o GitHub.

## 1. Actualiza GitHub (sin PowerShell)

1. Descomprime el ZIP de Olmos Coaching 6.0.
2. En tu repositorio, en la rama `main`, usa `Add file → Upload files`.
3. Sube **a la raíz**, no dentro de otra carpeta, estos cinco archivos:
   - `index.html`
   - `pro5.js`
   - `pro5.css`
   - `community.js` **(nuevo)**
   - `community.css` **(nuevo)**
4. Haz **Commit changes**. Si utilizas el workflow de Firebase Hosting, actualiza también `.github/workflows/deploy-firebase-hosting.yml` y `scripts/sync-public.mjs`, porque ahora debe publicar `community.js` y `community.css` además de los archivos anteriores.
5. Abre tu dirección de GitHub Pages y confirma que aparecen **Buscar clubes**, **Mi perfil deportivo** y **Portal del jugador 2.0**.

**GitHub Pages y Firebase Hosting son sitios distintos.** GitHub Pages funciona sin el workflow. Para que `futsal-coaching.web.app` se actualice automáticamente, el workflow debe estar autorizado y terminar en verde.

## 2. Publica las reglas nuevas de Firestore (obligatorio)

Opción A, solo navegador (la más cómoda para ti):

1. Abre **https://console.firebase.google.com/project/futsal-coaching/firestore/rules**.
2. Haz copia del contenido de las reglas actuales.
3. Abre `firestore.rules` del ZIP 6.0 en Bloc de notas, copia TODO su contenido.
4. Pégalo en el editor de reglas y presiona **Publicar**.
5. Si Firebase marca un error de validación, **no cambies a reglas abiertas**. Revisa el error y conserva las reglas anteriores hasta corregirlo.

Opción B, desde la carpeta descomprimida (PowerShell):

```powershell
firebase.cmd login
firebase.cmd use futsal-coaching
firebase.cmd deploy --only firestore:rules
```

La implementación de directorio, solicitudes, perfiles y asistencia depende de estas reglas nuevas. Subir solo `index.html` o `community.js` no basta para activar permisos.

## 3. Activa fotos opcionalmente

**La foto de Google funciona sin Storage**, siempre que la cuenta Google tenga foto disponible. Para subir imágenes nuevas desde el celular:

1. En Firebase Console selecciona el proyecto `futsal-coaching` y abre **Storage**.
2. Crea el bucket o abre el existente. Comprueba si requiere habilitar el plan de facturación. Asegúrate de tener los permisos del titular de la cuenta y revisar los costos antes de activarlo.
3. Copia **el nombre exacto del bucket** que aparece en la pestaña Files: suele terminar en `.firebasestorage.app` o, en proyectos antiguos, `.appspot.com`. **No adivines ese dato**.
4. En el `index.html` de GitHub, busca `storageBucket: ""` y reemplázalo por `storageBucket: "NOMBRE_EXACTO_DEL_BUCKET"`; haz Commit. No modifiques las credenciales privadas.
5. Firebase Console → Storage → Rules → copia `storage.rules` del ZIP 6.0 y pulsa **Publicar**. También puedes hacerlo desde PowerShell con `firebase.cmd deploy --only storage` cuando Storage esté configurado.
6. Abre **Mi perfil deportivo** y sube una imagen JPG, PNG o WebP de máximo 2 MB.

Los archivos solo pueden crearse o modificarse por su propietario autenticado. Evita subir fotografías de otras personas sin autorización.

## 4. Primer flujo de prueba: dos cuentas Google

**Cuenta A — Entrenador/propietario**

1. Entra y selecciona el club creado. Ve a **Buscar clubes → Publicar mi club**.
2. Completa localidad, categoría y descripción, marca **Aparecer en las búsquedas** y confirma.
3. En **Plantillas y acceso** crea al menos un equipo y una ficha deportiva.

**Cuenta B — Jugador**

1. En ventana privada, entra con otra cuenta Google.
2. Abre **Buscar clubes**, encuentra el club, pulsa **Solicitar ingreso** y envía un mensaje breve sin datos sensibles.
3. Vuelve con la cuenta A a **Buscar clubes**. Debajo del directorio revisa **Solicitudes recibidas** y pulsa **Aprobar**.
4. Vuelve a la cuenta B, en la búsqueda pulsa **Ver estado** si no aparece la solicitud y luego **Aceptar invitación**.
5. Con la cuenta A abre **Plantillas y acceso → Vincular ficha** al lado de la cuenta del jugador, selecciona su ficha y equipo.
6. Registra un partido y una estadística de la ficha. Con la cuenta B abre **Portal del jugador 2.0** y revisa que solo vea su información individual.
7. Programa una sesión del club; con B confirma asistencia. Con A revisa las confirmaciones.

Prueba también que B no pueda modificar un partido ni ver fichas de otros jugadores. Si aparece un error `permission-denied`, revisa las reglas publicadas, la pertenencia al club y la vinculación de la ficha, sin abrir la base de datos al público.

## 5. Comandos opcionales de verificación

Desde la carpeta del ZIP en Windows:

```powershell
node -v
npm.cmd test
firebase.cmd use futsal-coaching
firebase.cmd deploy --only hosting
```

El despliegue de Hosting es opcional si utilizas GitHub Actions; para fotos o nuevas reglas hay despliegues independientes. No necesitas Cloud Functions, OpenAI ni un plan de IA para usar esta versión.

## 6. Solución rápida a errores comunes

- **Missing or insufficient permissions:** no se publicaron `firestore.rules`, cuenta suspendida/no vinculada o intentas editar con un rol sin autorización.
- **No aparece el club en el buscador:** su propietario debe publicarlo y marcar la casilla de visibilidad; debe existir una sesión Google activa; búsqueda limitada a 100 publicaciones.
- **No veo mis estadísticas:** solicita al propietario que vincule tu cuenta a la ficha deportiva en **Plantillas y acceso**.
- **No puedo subir foto:** confirma `storageBucket`, habilita Storage y publica `storage.rules`. Mientras tanto puedes usar tu foto Google.
- **La web.app sigue antigua:** revisa GitHub Actions y que el workflow suba `community.js` y `community.css` a `public/` antes de publicar.
