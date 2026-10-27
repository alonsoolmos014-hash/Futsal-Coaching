const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../pro5.js','utf8');
const store=new Map();
const context={console,Date,Number,String,Math,JSON,URL,Blob,history:{replaceState(){}},location:{href:'https://example.com/'},
localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
window:{addEventListener(){},ocProLegacy:{getExercises:()=>[
{id:'x1',name:'Repliegue tras pérdida',category:'Transiciones',objective:'Reorganizarse',duration:12,players:'8'},
{id:'x2',name:'Posesión',category:'Técnico',objective:'Control',duration:10,players:'6'}]}},
document:{querySelector:()=>null,getElementById:()=>null},
navigator:{},setTimeout,clearTimeout};
vm.createContext(context);vm.runInContext(source,context);
async function run(){
  assert.equal(vm.runInContext('H(`<img src=x onerror="alert(1)">`)',context),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(vm.runInContext('url("javascript:alert(1)")',context),'');
  vm.runInContext(`state.clubs=[{id:'club_demo',name:'Club prueba',ownerUid:'demo'}];demoClubs.club_demo=datasetEmpty()`,context);
  await vm.runInContext("chooseClub('club_demo')",context);
  await vm.runInContext("writeRecord('teams',{name:'Sub 17',category:'Sub-17'})",context);
  await vm.runInContext("writeRecord('players',{name:'Jugador A',position:'Ala',teamId:get('teams')[0].id})",context);
  await vm.runInContext("writeRecord('matches',{opponent:'Rival',date:'2026-10-26',goalsFor:3,goalsAgainst:2})",context);
  await vm.runInContext("writeRecord('stats',{playerId:get('players')[0].id,matchId:get('matches')[0].id,goals:2,minutes:30})",context);
  assert.equal(vm.runInContext('get("players").length',context),1);
  assert.equal(vm.runInContext('get("matches").length',context),1);
  assert.match(vm.runInContext('renderClubs()',context),/Club prueba/);
  assert.match(vm.runInContext('renderTeam()',context),/Jugador A/);
  assert.match(vm.runInContext('renderMatches()',context),/Rival/);
  assert.match(vm.runInContext('renderPerformance()',context),/2/);
  assert.match(vm.runInContext('renderAssistant()',context),/Repliegue tras pérdida/);
  assert.equal(vm.runInContext('matchingExercises()[0].name',context),'Repliegue tras pérdida');
  assert.ok(store.has('oc5_demo'));
  console.log('OK · HTML seguro, clubes, equipo, jugador, partido, estadísticas, asistente y persistencia local');
}
run().catch(e=>{console.error(e);process.exit(1)});
