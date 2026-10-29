const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../community.js','utf8');
const ctx={console,Date,Number,String,Math,JSON,URL,crypto:{randomUUID:()=> '12345678-1234-1234-1234-1234567890ab'},location:{href:'https://test.web.app'},window:{addEventListener(){},ocPro:{getContext:()=>({clubId:'c1',club:{id:'c1',name:'Club test'},role:'owner',membership:{role:'owner',teamId:'t1',playerId:''},clubs:[{id:'c1'}],teams:[],players:[],matches:[],stats:[],sessions:[],members:[]})}},document:{querySelector:()=>null},navigator:{},confirm:()=>true};
vm.createContext(ctx);vm.runInContext(source,ctx);
const run=code=>vm.runInContext(code,ctx);
assert.equal(run('C6H(`<img src=x onerror="alert(1)">`)'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.equal(run('C6u("javascript:alert(1)")'),'');
assert.match(run('C6renderDirectory()'),/cuenta Google/);
run("C6.user={uid:'u1',email:'user@gmail.com',displayName:'Jugador',photoURL:'https://accounts.google.com/photo.jpg'}");
run("C6.clubs=[{id:'c2',name:'Club FutSal',city:'Rancagua',category:'Formativo',description:'Entrenamiento'}]");
assert.match(run('C6renderDirectory()'),/Buscar clubes|Encuentra tu club/);
assert.match(run('C6renderProfile()'),/Jugador/);
assert.match(run('C6renderPortal()'),/Portal|Mi espacio deportivo/);
run("C6.profile={displayName:'Alba',profilePosition:'Ala',profileBio:'Practicar'}");
assert.match(run('C6renderProfile()'),/Alba/);
const rules=fs.readFileSync(__dirname+'/../firestore.rules','utf8');
for(const token of ['match /clubDirectory/{clubId}','match /joinRequests/{applicantUid}','match /attendance/{attendanceId}','allow list: if clubOwner(clubId)'])assert.ok(rules.includes(token),token);
assert.ok(!source.includes("window.__publicUserDirectory")); // No exposición pública de cuentas
console.log('OK · render comunidad, HTML escapado, perfiles privados, directorio y bloques de reglas presentes');
