# Olmos Coaching — Guía para TU repositorio de GitHub

**Repositorio:** https://github.com/alonsoolmos014-hash/Futsal-Coaching  
**Archivo que me compartiste:** https://github.com/alonsoolmos014-hash/Futsal-Coaching/blob/main/index.html  
**Rama:** `main`  
**Firebase Hosting:** https://futsal-coaching.web.app/  
**Firebase project ID:** `futsal-coaching`  
**Cuenta administradora configurada:** `alonsoolmos014@gmail.com`

## Primero: no pierdas lo que ya funciona

Antes de reemplazar nada, entra a https://github.com/alonsoolmos014-hash/Futsal-Coaching, pulsa **Code → Download ZIP** y guarda una copia de tu repositorio. Si tienes datos de entrenamientos en la app, utiliza también la opción de **Respaldar/exportar** dentro de la aplicación, ya que descargar GitHub no respalda Firestore.

La actualización de `index.html` **no borra por sí sola** los datos de Firestore. Sin embargo, si además cambias las reglas o la estructura de los documentos, puede cambiar qué usuarios pueden leerlos. Prueba primero con cuentas de prueba y evita publicar `firestore.rules` sin revisarlas.

## A. Método más fácil: seguir actualizando desde GitHub

Este método actualiza **GitHub Pages** sin usar PowerShell. Si además quieres que se actualice `futsal-coaching.web.app`, lee la sección B.

1. Descarga y descomprime el ZIP que te entregué.
2. Entra a https://github.com/alonsoolmos014-hash/Futsal-Coaching y comprueba que estés en la rama **main**.
3. Presiona **Add file → Upload files**.
4. Arrastra **el contenido de la carpeta** `Olmos_Coaching_5_6_Futsal_Coaching_GitHub`, NO la carpeta exterior como una subcarpeta nueva del repositorio. Para la web son indispensables estos tres archivos **en la raíz**:
   - `index.html`
   - `pro5.js`
   - `pro5.css`
5. Confirma los archivos con **Commit changes**. GitHub guardará el cambio en el historial.
6. Ve a **Settings → Pages** y verifica: **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
7. Comprueba la web de GitHub Pages en: `https://alonsoolmos014-hash.github.io/Futsal-Coaching/` (esta es la URL esperada si Pages está habilitado; no he podido verificar en vivo que ya esté activo).
8. Para Google Login por GitHub Pages, verifica **Firebase Console → Authentication → Settings → Authorized domains** y agrega `alonsoolmos014-hash.github.io` (solo el host, sin `https://` ni `/Futsal-Coaching/`) si no está presente.

**Desde ahora podrás editar `index.html` en GitHub.** No borres los archivos `pro5.js` y `pro5.css`: la versión 5.6 los necesita.

### Si GitHub no sube las carpetas que comienzan con punto

El workflow está en `.github/workflows/deploy-firebase-hosting.yml`. Si no aparece en el repositorio después de subir, créalo manualmente con **Add file → Create new file**, escribe exactamente `.github/workflows/deploy-firebase-hosting.yml` como nombre y pega el contenido del archivo del ZIP. Es importante que esté en esa ruta, no dentro de otra carpeta.

## B. Mantener GitHub como editor y publicar automáticamente en Firebase Hosting

Con esta opción editarás en GitHub como ahora, pero **cada cambio confirmado en `main`** a `index.html`, `pro5.js`, `pro5.css` o scripts activará el flujo de **GitHub Actions** para publicar `https://futsal-coaching.web.app/`.

El paquete ya trae:
- `firebase.json` con Hosting apuntando a `public/`.
- `.firebaserc` con proyecto `futsal-coaching`.
- `.github/workflows/deploy-firebase-hosting.yml` personalizado.
- `scripts/sync-public.mjs` que copia los tres archivos editables de la raíz a `public/` antes de publicar.

### Lo único que falta: autorizar GitHub a publicar (una vez)

GitHub necesita una credencial privada guardada como **secreto del repositorio**. Nunca se incluye en `index.html` ni se sube a GitHub como archivo normal.

**Forma guiada desde Windows:**

1. Instala Node.js LTS si todavía no lo tienes.
2. Descomprime el ZIP en tu computador.
3. Abre el Explorador de archivos dentro de la carpeta que contiene `firebase.json`. Presiona **Alt + D**, escribe `powershell` y pulsa Enter.
4. Ejecuta **uno por uno**:

   ```powershell
   npm.cmd install -g firebase-tools
   firebase.cmd login
   firebase.cmd use futsal-coaching
   firebase.cmd init hosting:github
   ```

5. Cuando pregunte qué repositorio conectar, escribe **`alonsoolmos014-hash/Futsal-Coaching`**.
6. Autoriza GitHub con la cuenta propietaria del repositorio. El asistente configurará una credencial en **GitHub → Settings → Secrets and variables → Actions**.
7. El workflow incluido espera exactamente el secreto `FIREBASE_SERVICE_ACCOUNT_FUTSAL_COACHING`. Revisa el nombre creado; si difiere, cambia **solo la referencia al secreto en el workflow**, no pegues valores privados en los archivos.
8. Si el asistente crea workflows adicionales, evita duplicados que publiquen a `live`. Conserva un único workflow de despliegue principal, preferentemente `.github/workflows/deploy-firebase-hosting.yml`.
9. Sube a GitHub los archivos del proyecto y el workflow, si aún no aparecen allí.
10. Abre https://github.com/alonsoolmos014-hash/Futsal-Coaching/actions y entra al flujo **Futsal-Coaching · Publicar en Firebase Hosting**. Elige **Run workflow** en la rama `main` (o confirma un commit de cambios).
11. Espera a que aparezca el estado **verde** y abre https://futsal-coaching.web.app/ con recarga forzada (`Ctrl + F5`).

**Importante:** `firebase init hosting:github` conecta GitHub pero no hace que la IA se active automáticamente. El flujo de este paquete publica **solo Hosting**. Esto evita desplegar reglas y funciones inesperadamente cada vez que edites la página.

### Si aparece error en Actions

- `Falta el secreto...`: revisa **Settings → Secrets and variables → Actions** y el nombre exacto del secreto.
- `Permission denied` o `403`: la cuenta de servicio no tiene permisos suficientes en Firebase/Google Cloud o la credencial quedó revocada; revisa el asistente de conexión.
- La web no cambia: revisa si el workflow terminó con ✓, que editaste la rama `main` y que `index.html` está en la raíz. Firebase sirve los archivos de la carpeta `public`, que el workflow genera automáticamente antes de publicar.
- Google no inicia sesión en GitHub Pages: revisa `alonsoolmos014-hash.github.io` entre los dominios autorizados de Firebase Authentication.

## C. Si prefieres publicar manualmente con PowerShell, desde cero

No necesitas dejar PowerShell abierto: el comando **publica en internet** y luego puedes cerrar la ventana.

En la carpeta que contiene `firebase.json`:

```powershell
npm.cmd install -g firebase-tools
firebase.cmd login
firebase.cmd use futsal-coaching
node scripts/sync-public.mjs
node scripts/verify-project.mjs
firebase.cmd deploy --only hosting
```

Al terminar debería mostrar `Deploy complete!` y la URL de Hosting. Después de editar en tu PC, repite desde `node scripts/sync-public.mjs`.

## D. Inteligencia artificial y Firebase (opcional)

La web ya incluye la interfaz de asistente y el código de `functions/`, pero la **IA real no funcionará hasta desplegar esa función**. Puedes seguir editando la web en GitHub aun si la función está pendiente.

1. En una cuenta habilitada para servicios con facturación, configura Cloud Functions de Firebase. Revisa requisitos de pago y pide ayuda de un adulto responsable cuando corresponda.
2. Configura la API del proveedor en un **secreto de Firebase**, nunca en GitHub, `index.html` o en un chat.
3. Desde la carpeta con `firebase.json`, en PowerShell:

   ```powershell
   firebase.cmd functions:secrets:set OPENAI_API_KEY
   cd functions
   npm.cmd install
   cd ..
   firebase.cmd deploy --only functions
   ```

4. Si no habías desplegado las nuevas reglas, revísalas cuidadosamente y publícalas por separado con `firebase.cmd deploy --only firestore:rules` únicamente cuando estés seguro de las consecuencias. No es un cambio automático.
5. Prueba el asistente con un entrenador autorizado y datos de ejemplo. **No subas credenciales privadas a GitHub**.

## Arquitectura rápida

```text
GitHub: alonsoolmos014-hash/Futsal-Coaching (main)
  ├─ index.html + pro5.js + pro5.css        ← tú los editas
  ├─ .github/workflows/...                 ← publica al confirmar cambios
  ├─ scripts/sync-public.mjs              ← prepara public/
  ├─ firebase.json + .firebaserc          ← proyecto y Hosting
  ├─ firestore.rules                      ← permisos (revisar antes de publicar)
  ├─ functions/                           ← IA del servidor (despliegue aparte)
  └─ public/                              ← salida que utiliza Firebase Hosting

         ├─ GitHub Pages (opcional)
         └─ Firebase Hosting → futsal-coaching.web.app
                                  ├─ Google Authentication
                                  ├─ Firestore
                                  └─ Cloud Functions (IA cuando la actives)
```

**Nota sobre la revisión:** el enlace fue aportado por ti, pero no pude descargar el contenido actual del repositorio desde esta sesión. Por eso este paquete es un reemplazo propuesto con respaldo y pruebas locales, no un parche aplicado ni verificado contra el último commit de GitHub.
