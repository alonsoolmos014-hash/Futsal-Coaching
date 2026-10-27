// Un único archivo editable por tipo en la raíz (compatibilidad GitHub Pages).
// Copiamos a public/ para Firebase Hosting. No se sincronizan funciones ni secretos.
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
mkdirSync(resolve(root,'public'),{recursive:true});
for(const name of ['index.html','pro5.js','pro5.css']) {
  copyFileSync(resolve(root,name),resolve(root,'public',name));
  console.log(`Preparado public/${name}`);
}
