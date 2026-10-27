import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { strict as assert } from 'node:assert';
const root=resolve(import.meta.dirname,'..');
const read=n=>readFileSync(resolve(root,n));
const html=read('index.html').toString();
const hosting=JSON.parse(read('firebase.json'));
const project=JSON.parse(read('.firebaserc'));
assert.equal(hosting.hosting.public,'public','Hosting debe servir public');
assert.equal(project.projects.default,'futsal-coaching','Proyecto Firebase inesperado');
assert.match(html,/futsal-coaching\.firebaseapp\.com/,'Falta authDomain Firebase');
assert.match(html,/alonsoolmos014@gmail\.com/,'Falta correo de administración');
assert.match(html,/pro5\.js/,'Falta módulo de alto rendimiento');
for(const name of ['index.html','pro5.js','pro5.css']) {
  assert.deepEqual(read(name),read(`public/${name}`),`${name}: ejecutar node scripts/sync-public.mjs`);
}
console.log('OK · GitHub Pages y Firebase Hosting comparten los mismos archivos.');
