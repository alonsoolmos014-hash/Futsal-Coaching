// Verifica que Firebase Authentication NO dependa de habilitar Storage.
const assert=require('node:assert/strict');
const fs=require('fs');
const vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const from=html.indexOf('const firebaseConfig = {');
const until=html.indexOf('if (!configured)',from);
assert.ok(from>=0 && until>from,'No se encontró la inicialización Firebase');
const fragment=html.slice(from,until);
function check(source){return vm.runInNewContext(`(()=>{${source};return {configured,config:firebaseConfig};})()`,{});}
const original=check(fragment);
assert.equal(original.config.projectId,'futsal-coaching');
assert.equal(original.config.storageBucket,'');
assert.equal(original.config.authDomain,'futsal-coaching.firebaseapp.com');
assert.equal(original.configured,true,'Google Login debe funcionar sin storageBucket');
const invalid=check(fragment.replace(/apiKey: "[^"]+"/,'apiKey: "PEGA_TU_API_KEY"'));
assert.equal(invalid.configured,false,'No se aceptan claves de ejemplo');
console.log('OK · Google Login activo sin Storage opcional; credenciales inválidas rechazadas.');
