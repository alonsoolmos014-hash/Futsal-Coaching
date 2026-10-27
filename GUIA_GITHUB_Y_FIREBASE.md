# Olmos Coaching 5.6 — GitHub + Firebase, sin perder Google Login

Esta versión **mantiene** la configuración web de Firebase del proyecto `futsal-coaching`, tu correo administrador `alonsoolmos014@gmail.com`, los módulos 5.5 y el asistente de IA pendiente de activar con Cloud Functions. No incluye ningún secreto privado.

## La distinción más importante

- **GitHub** guarda tu código. **GitHub Pages** puede publicar la aplicación en `https://USUARIO.github.io/REPOSITORIO/`.
- **Firebase Hosting** publica la otra dirección `https://futsal-coaching.web.app/`.
- **Firebase Authentication, Firestore y Cloud Functions** funcionan como servicios de backend con cualquiera de los dos sitios, si configuras los dominios autorizados y las reglas.
- **Subir index.html a GitHub NO actualiza `web.app` automáticamente** si no conectas GitHub Actions con Firebase Hosting.

## OPCIÓN A — Quiero seguir subiendo archivos a GitHub, sin PowerShell para la web

1. En GitHub, crea un repositorio (o utiliza el que ya usas), preferentemente **privado** mientras pruebas datos y permisos. Si usas GitHub Pages, verifica qué opciones de publicación admite tu plan para repositorios privados.
2. Sube al nivel raíz del repositorio **estos 3 archivos juntos**: `index.html`, `pro5.js`, `pro5.css`. Si falta uno, la interfaz nueva no funcionará correctamente. Conserva los demás archivos del proyecto en el repositorio si después activarás la IA.
3. Abre **Settings → Pages → Build and deployment → Deploy from a branch**, elige `main` y la carpeta `/ (root)`, y guarda. La URL será similar a `https://TU_USUARIO.github.io/NOMBRE_REPO/`.
4. En Firebase Console → **Authentication → Settings → Authorized domains**, agrega **solo el nombre de host**, `TU_USUARIO.github.io` (sin `https://`, rutas ni nombre del repo). Comprueba también que Google siga habilitado en **Sign-in method**.
5. Abre tu URL de GitHub Pages e inicia sesión con Google. Comprueba los permisos antes de agregar datos reales. **No necesitas PowerShell para actualizar este frontend**: GitHub Pages publica al guardar cambios en la rama configurada.

**Advertencia**: en esta opción el sitio principal actualizado será GitHub Pages; `futsal-coaching.web.app` conservará su contenido anterior hasta desplegarlo por otra vía. Si quieres conservar la dirección `web.app` para todos, usa la opción B.

## OPCIÓN B — Recomendada: edito en GitHub y el mismo cambio actualiza Firebase Hosting

Este paquete trae el flujo de GitHub Actions:

`.github/workflows/deploy-firebase-hosting.yml`

Cuando guardes una modificación en `index.html`, `pro5.js` o `pro5.css` de la rama **main**, el flujo:

1. Ejecutará `node scripts/sync-public.mjs` para copiar esos 3 archivos a `public/`.
2. Verificará que se está usando el proyecto Firebase correcto.
3. Publicará **Firebase Hosting** en `https://futsal-coaching.web.app/`.

Solo falta **autorizar una vez a GitHub para publicar**. No incluyas credenciales en el código.

### B1. Preparar el repositorio (una vez)

1. Sube **toda la carpeta del proyecto**, incluida `.github/workflows/`, `scripts/`, `public/`, `.firebaserc`, `firebase.json` y los archivos del frontend, a la **raíz** de tu repositorio GitHub. GitHub no acepta subir el ZIP como proyecto ejecutable: descomprímelo primero.
2. Comprueba que la rama principal de tu repo se llame `main`. Si se llama `master`, cambia el campo `branches` del flujo de GitHub Actions a `master`.
3. No subas ninguna clave de OpenAI, archivo `.env`, claves JSON de cuentas de servicio ni credenciales privadas. El archivo `firebaseConfig` del navegador **sí** puede estar en el código; su `apiKey` identifica la app web y las reglas Firestore deben proteger los datos.

### B2. Conectar Firebase con GitHub (solo una vez; recomendado: asistente oficial)

1. En Windows, descomprime el proyecto. En la carpeta con `firebase.json`, presiona **Alt+D**, escribe `powershell` y Enter.
2. Ejecuta `firebase.cmd login` e inicia sesión con la cuenta Google que administra `futsal-coaching`.
3. Ejecuta `firebase.cmd init hosting:github`.
4. Autoriza GitHub, selecciona **tu usuario/repositorio**, y acepta la creación de una cuenta de servicio para la publicación. El asistente crea en GitHub un **secret privado** y archivos de workflow. **No pegues ese secreto en el repositorio**.
5. En **GitHub → repositorio → Settings → Secrets and variables → Actions**, comprueba el nombre que ha creado Firebase. El archivo incluido en este paquete espera **`FIREBASE_SERVICE_ACCOUNT_FUTSAL_COACHING`**. Si el asistente usó un nombre distinto, cambia el nombre referenciado en `.github/workflows/deploy-firebase-hosting.yml` (o el nombre del secreto, copiando su valor en GitHub sin publicarlo).
6. Firebase puede generar otro workflow llamado `firebase-hosting-merge.yml`: **no dejes dos flujos de publicación en vivo**. Conserva el archivo `deploy-firebase-hosting.yml` incluido aquí y elimina o desactiva el workflow redundante, si se creó.
7. Si los archivos se generaron solo en tu PC, súbelos a tu repositorio. No subas ninguna clave de cuenta de servicio descargada.
8. En GitHub ve a **Actions → Olmos Coaching · GitHub a Firebase Hosting → Run workflow** para publicar la primera vez; luego cada cambio a `main` se publicará automáticamente.
9. Ve a `https://futsal-coaching.web.app/` y actualiza con Ctrl+F5. Un ícono verde ✓ en **Actions** indica publicación exitosa, pero igualmente debes comprobar Google Login y las reglas.

**Importante**: el asistente `firebase init hosting:github` **no significa que ya se hayan publicado las reglas Firestore o Cloud Functions**. El workflow entregado solo publica Hosting: es intencional, porque las reglas y las funciones requieren permisos y revisión específicos.

### B3. Alternativa sin asistente CLI para el Hosting

Si no puedes ejecutar el asistente, un administrador autorizado puede crear una **cuenta de servicio con permisos mínimos necesarios para Firebase Hosting** en Google Cloud, descargar su clave JSON y guardarla solamente como **secreto cifrado del repositorio GitHub** con el nombre `FIREBASE_SERVICE_ACCOUNT_FUTSAL_COACHING`. El workflow utilizará ese secreto al publicar. No subas ni compartas jamás ese JSON. La [guía oficial de la acción](https://github.com/FirebaseExtended/action-hosting-deploy/blob/main/docs/service-account.md) describe los permisos y pasos. Es más técnica que el asistente y conviene contar con ayuda de un administrador de Google Cloud.

## OPCIÓN C — PowerShell desde cero (publicación manual y controlada)

1. Instala **Node.js LTS** desde https://nodejs.org/ y luego instala Firebase CLI en PowerShell con `npm.cmd install -g firebase-tools`.
2. Extrae este ZIP. En el Explorador, **entra a la carpeta que contiene `firebase.json`** (no a `public`), presiona **Alt+D**, escribe `powershell` y Enter.
3. En PowerShell ejecuta los siguientes comandos **uno a uno**:

   ```powershell
   node -v
   firebase.cmd --version
   firebase.cmd login
   firebase.cmd use
   node scripts/sync-public.mjs
   node scripts/verify-project.mjs
   firebase.cmd deploy --only hosting
   ```

4. Asegúrate de que `firebase.cmd use` indique el proyecto `futsal-coaching`. Si no, ejecuta `firebase.cmd use futsal-coaching`.
5. La URL pública será https://futsal-coaching.web.app/ y **sí quedará en internet** cuando `firebase deploy` termine exitosamente. PowerShell solo es la herramienta que sube los archivos, no aloja la página.
6. Si editas algo en la raíz del proyecto, vuelve a ejecutar `node scripts/sync-public.mjs` antes del próximo despliegue.

Si aparece error `firebase.ps1` bloqueado, usa **`firebase.cmd`**; si aparece `could not locate firebase.json`, estás en la carpeta incorrecta.

## Activar IA — Es independiente de dónde publiques el HTML

GitHub Pages **no** puede ejecutar por sí solo la Cloud Function que guarda de forma secreta la clave de IA. **Sí puedes alojar la interfaz en GitHub y usar Firebase como backend para la IA**:

1. En Firebase Console confirma que puedes usar Cloud Functions (generalmente plan Blaze; puede generar cobros). Si hay requisitos de facturación o edad, pide ayuda a un adulto responsable.
2. Obtén y configura una clave de la API de OpenAI **para servidor**, con presupuesto y límites. **No la pongas en GitHub ni en el navegador**. ChatGPT Pro no incluye automáticamente la API.
3. Abre PowerShell **una sola vez** en la carpeta del proyecto (o usa Cloud Shell, si has subido los archivos):

   ```powershell
   firebase.cmd login
   firebase.cmd functions:secrets:set OPENAI_API_KEY
   cd functions
   npm.cmd install
   cd ..
   firebase.cmd deploy --only firestore:rules,functions
   ```

4. Mantén el control de acceso: inicia sesión como entrenador en un club de Olmos Coaching; los usuarios sin permisos no deben poder invocar IA.
5. Prueba **Asistente metodológico → Generar propuesta con IA**. Si aparece un error, comprueba el registro de Cloud Functions mediante `firebase.cmd functions:log --only generateFutsalPlan`.

El servidor de IA comprueba identidad y rol y tiene una cuota de solicitudes por usuario. **No envíes datos personales de menores** en las instrucciones. Una cuenta API suele implicar costos adicionales. Para cambios futuros a `functions/` o `firestore.rules` deberás desplegar esas partes de nuevo, aunque el HTML ya se publique automáticamente desde GitHub.

## Archivos clave

| Archivo | Dónde se usa |
|---|---|
| `index.html`, `pro5.js`, `pro5.css` | GitHub Pages, editables directamente en el repositorio |
| `public/` | Copia usada por Firebase Hosting; el flujo la actualiza automáticamente |
| `.github/workflows/deploy-firebase-hosting.yml` | Publica el frontend en Firebase al editar GitHub |
| `scripts/sync-public.mjs` | Sincroniza cambios del frontend, incluso desde PowerShell |
| `functions/` | Servidor de IA, **NO se ejecuta en GitHub Pages** |
| `firestore.rules` | Permisos de datos; se publican aparte |
| `.firebaserc`, `firebase.json` | Proyecto y configuración de Firebase |

## Diagnóstico rápido

- **Cambios en GitHub pero no en `web.app`**: revisa el workflow en GitHub Actions y el secret; GitHub solo no actualiza Firebase.
- **En GitHub Pages solo se ve la versión antigua**: verifica que los 3 archivos estén en raíz y que Pages use `main` / root.
- **No aparece parte de la interfaz**: revisa que también subiste `pro5.js` y `pro5.css`.
- **Google no inicia sesión en GitHub Pages**: autoriza `TU_USUARIO.github.io` en Authentication → Settings → Authorized domains; no incluyas `/repo`.
- **El frontend funciona pero IA dice “no disponible”**: revisa deploy de Cloud Functions, facturación y Secret Manager; subir el HTML no activa el backend.
- **Firebase Rules bloquea funciones de una cuenta**: comprueba el rol real en el club y que la nueva versión de `firestore.rules` se haya publicado, luego realiza pruebas con dos usuarios distintos.
- **Datos antiguos no aparecen**: puede que estés en otro espacio o en el modelo 4.x/5.x; no borres ni migres automáticamente sin respaldo.

**Esta versión NO se publicó en tu GitHub ni en Firebase desde aquí.** Requiere que configures autorización y hagas el despliegue inicial. No he usado ni necesito una clave privada de tu proyecto.
