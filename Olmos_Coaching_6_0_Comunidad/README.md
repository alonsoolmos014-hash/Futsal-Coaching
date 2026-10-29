# Olmos Coaching 6.0 · Comunidad y alto rendimiento

**Proyecto Firebase:** `futsal-coaching` · **Repositorio:** `alonsoolmos014-hash/Futsal-Coaching` · **Administrador:** `alonsoolmos014@gmail.com`

Esta versión **continúa la versión 5.6**, no sustituye los datos existentes ni exige habilitar la API de OpenAI.

## Novedades

- **Buscar clubes:** ficha pública solo mediante publicación voluntaria del propietario. Personas que ingresan con Google pueden filtrar por nombre, ciudad y categoría, y solicitar ingreso.
- **Solicitudes con revisión:** una cuenta envía una solicitud desde el directorio. El propietario puede aprobarla o rechazarla; al aprobar se genera una invitación privada que solo sirve para el correo Google de esa cuenta. El jugador la acepta, entra al club y el propietario puede vincularlo con una ficha deportiva.
- **Mi perfil deportivo:** nombre visible, ciudad opcional, posición, biografía y foto de Google. Se puede subir una fotografía JPG/PNG/WebP de hasta 2 MB cuando se active Cloud Storage.
- **Portal del jugador 2.0:** estadísticas personales por partido, objetivos individuales, próximas sesiones y confirmación de asistencia. El entrenador ve un resumen de respuestas de su club.
- **Centro de partidos:** mantiene eventos, video por enlace, estadísticas por encuentro y agrega forma reciente y diferencia de goles.
- **Planificador sin IA:** propone una sesión con ejercicios reales del PlayBook, objetivo, categoría, jugadores, material y duración. Permite guardar el borrador en Microciclos. No emplea ninguna API generativa.

## Privacidad

El directorio **no publica perfiles personales, correos, fotos, datos médicos ni estadísticas de menores**. Las fichas de usuario siguen en `/users/{uid}` y las estadísticas del jugador se consultan con sus reglas por `playerId`. El propietario recibe el correo de los solicitantes para gestionar las invitaciones, pero el buscador no lo muestra. Para clubes escolares, valida autorizaciones y normativas aplicables antes de registrar datos.

Una foto de Firebase Storage enlazada por una URL de descarga puede compartirse si alguien obtiene esa URL. No la uses como depósito de información privada o sensible.

## Archivos y publicación

- `index.html`, `pro5.js`, `pro5.css`, `community.js`, `community.css`: son los cinco archivos que GitHub Pages necesita en la raíz.
- `public/`: mismos archivos sincronizados para Firebase Hosting mediante `node scripts/sync-public.mjs`.
- `.github/workflows/deploy-firebase-hosting.yml`: ya preparado para publicar el frontend en Firebase Hosting cuando exista el secreto `FIREBASE_SERVICE_ACCOUNT_FUTSAL_COACHING`.
- `firestore.rules`: **debe publicarse por separado**. GitHub Pages y el workflow de Hosting **no** publican reglas.
- `storage.rules`: reglas opcionales para fotos de perfil. Solo publicarlas cuando hayas creado Cloud Storage.
- `functions/`: backend de IA de versiones anteriores, totalmente opcional; **no es necesario** para las nuevas funciones.

**Consulta [GUIA_PUBLICACION_6_0.md](GUIA_PUBLICACION_6_0.md) antes de publicarlo.** La guía incluye instrucciones desde GitHub y desde PowerShell, además de las pruebas con dos cuentas.

## Pruebas realizadas

`npm test`: comprobación de sintaxis de módulos, sincronización de archivos raíz / `public`, integridad de Firebase y pruebas de lógica local de clubes, partidos, estadísticas y renderizado del directorio.

**No probado en un Firebase real:** autenticación de múltiples cuentas, reglas desplegadas y permisos por rol, aprobación desde dos cuentas y subida a Storage. Esas pruebas son obligatorias antes de incorporar información personal real. Una prueba en navegador mediante el entorno local no estuvo disponible por restricción de acceso de la sesión, no porque se haya verificado un error de la app.
