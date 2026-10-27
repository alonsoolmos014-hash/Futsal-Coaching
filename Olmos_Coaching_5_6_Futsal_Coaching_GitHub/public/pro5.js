/* Olmos Coaching · Centro de Alto Rendimiento 5.x
 * Datos nuevos: subcolecciones por club, separadas del workspace clásico 4.x.
 * Autenticación: usa el contexto real creado por public/index.html. Nunca simula Google.
 */
const VIEWS=['occlubs','octeam','ocmatches','ocplan','ocmodel','ocscout','ocperformance','ocassistant'];
const KIND={teams:'Equipos',seasons:'Temporadas',players:'Jugadores',matches:'Partidos',events:'Acciones del partido',stats:'Estadísticas',microcycles:'Microciclos',principles:'Principios',scouting:'Informes rivales',loads:'Control de cargas',tactics:'Secuencias tácticas',trainingSessions:'Sesiones del club',developmentPlans:'Planes individuales'};
const state={mode:'demo',user:null,clubId:'',club:null,clubs:[],membership:null,teamId:'',seasonId:'',data:{},unsubs:[],members:[],invites:[],sdk:null,store:null,auth:null,ready:false,openJoin:null,results:[],focus:'Transiciones',frameIndex:0,playing:false,playerFilter:'',aiBusy:false,aiPlan:'',aiError:'',aiParams:{category:'Sub-17',players:12,minutes:75,equipment:'Balones, conos, petos y 2 porterías',notes:''}};
const UI=()=>document.querySelector('.section.active .oc5-app');
const H=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>globalThis.crypto?.randomUUID?.()||('oc'+Date.now().toString(36)+Math.random().toString(36).slice(2));
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const n=v=>Number(v)||0;
const clip=v=>String(v||'').slice(0,1800);
const dateText=v=>v?new Date(v+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}):'Sin fecha';
const url=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
const $=id=>document.getElementById(id);
function note(t){if(window.toast)window.toast(t);else{const x=$('oc5status');if(x)x.textContent=t;}}
function datasetEmpty(){return Object.fromEntries(Object.keys(KIND).map(k=>[k,[]]));}
function demoRead(){try{return JSON.parse(localStorage.getItem('oc5_demo')||'null')}catch{return null}}
function demoWrite(){if(state.mode!=='demo')return;try{localStorage.setItem('oc5_demo',JSON.stringify({clubs:state.clubs,dataByClub:demoClubs,teamId:state.teamId,clubId:state.clubId}))}catch{note('No se pudo guardar el modo demostración')}}
let demoClubs={};const restored=demoRead();if(restored){state.clubs=restored.clubs||[];demoClubs=restored.dataByClub||{};state.clubId=restored.clubId||'';state.teamId=restored.teamId||'';}
function selected(){return state.clubs.find(c=>c.id===state.clubId)||state.club}
function isStaff(){return state.mode==='demo'||(state.membership?.status==='active'&&['owner','head_coach','assistant','analyst'].includes(state.membership?.role))}
function canManage(){return state.mode==='demo'||(state.membership?.status==='active'&&['owner','head_coach','assistant'].includes(state.membership?.role))}
function canOwner(){return state.mode==='demo'||(state.membership?.status==='active'&&state.membership?.role==='owner')}
function canAnalyze(){return isStaff()}
function myPlayer(){return state.membership?.playerId||''}
function get(kind){return state.data[kind]||[]}
function byId(kind,key){return get(kind).find(x=>x.id===key)}
function currentTeamLabel(teamId){return byId('teams',teamId)?.name||'Equipo general'}
function title(view){return ({occlubs:'Organización del club',octeam:'Plantillas y roles',ocmatches:'Centro de partidos',ocplan:'Planificación de temporada',ocmodel:'Identidad táctica',ocscout:'Preparación competitiva',ocperformance:'Rendimiento del jugador',ocassistant:'Asistente metodológico'})[view]||'Gestión deportiva'}
function top(view,description,action=''){return `<div class="oc5-hero"><div><div class="oc5-eyebrow">OLMOS COACHING · ALTO RENDIMIENTO · 5.0–5.4</div><h1>${title(view)}</h1><p>${description}</p></div><div class="oc5-actions">${action}</div></div>`}
function button(label,action,kind='oc5-primary'){return `<button class="${kind}" data-oc-action="${H(action)}">${label}</button>`}
function empty(title,sub='Registra el primer elemento para comenzar.'){return `<div class="oc5-empty"><strong>${H(title)}</strong>${H(sub)}</div>`}
function kpi(num,label){return `<div class="oc5-kpi"><strong>${H(num)}</strong><small>${H(label)}</small></div>`}
function selector(){const choices=state.clubs.map(c=>`<option value="${H(c.id)}" ${c.id===state.clubId?'selected':''}>${H(c.name)}</option>`).join('');const teams=get('teams').map(t=>`<option value="${H(t.id)}" ${state.teamId===t.id?'selected':''}>${H(t.name)}</option>`).join('');return `<div class="oc5-selector"><label>CLUB</label><select id="oc5ClubSelect"><option value="">${state.clubs.length?'Selecciona club':'Aún no tienes clubes'}</option>${choices}</select><label>EQUIPO</label><select id="oc5TeamSelect"><option value="">Todos los equipos</option>${teams}</select><label>TEMPORADA</label><select id="oc5SeasonSelect"><option value="">Todas</option>${get('seasons').map(s=>`<option value="${H(s.id)}" ${state.seasonId===s.id?'selected':''}>${H(s.label)}</option>`).join('')}</select><small id="oc5status" class="oc5-muted">${state.mode==='demo'?'Demostración local · sin sincronización':state.mode==='online'?'Firebase · cuentas reales':'Conectando…'}</small></div>`}
function filtered(kind){return get(kind).filter(x=>(!state.teamId||!x.teamId||x.teamId===state.teamId)&&(!state.seasonId||!x.seasonId||x.seasonId===state.seasonId))}
function toolbar(view,desc,action=''){return top(view,desc,action)+selector()}
function docRow(x,small,actions=''){return `<div class="oc5-listitem"><div><strong>${H(x)}</strong><small>${H(small)}</small></div><div class="oc5-inline">${actions}</div></div>`}
function chip(t){return `<span class="oc5-tag">${H(t)}</span>`}
function secCard(title,content){return `<article class="oc5-card"><h3>${H(title)}</h3>${content}</article>`}
function foot(){return `<div class="oc5-note">${state.mode==='demo'?'Estás en modo demostración sin cuentas Google. Los datos de esta sección se guardan solo en este navegador. Para sincronizarlos configura Firebase y vuelve a crear los registros en tu club real.':'Los datos de esta sección se almacenan por club en Firestore con permisos por rol. Comprueba los permisos y el consentimiento correspondiente antes de gestionar información personal de menores.'}</div>`}
function renderVisible(){const root=UI();if(!root)return;const view=root.dataset.ocView;if(!VIEWS.includes(view))return;if(state.mode==='online'&&state.clubId&&!state.membership){root.innerHTML=empty('Verificando acceso al club','Si tu cuenta fue suspendida, solicita ayuda al propietario.');return}let html='';try{
 if(view==='occlubs')html=renderClubs();else if(view==='octeam')html=renderTeam();else if(view==='ocmatches')html=renderMatches();else if(view==='ocplan')html=renderPlan();else if(view==='ocmodel')html=renderModel();else if(view==='ocscout')html=renderScout();else if(view==='ocperformance')html=renderPerformance();else html=renderAssistant();
 root.innerHTML=html;
 const c=root.querySelector('#oc5ClubSelect');if(c)c.addEventListener('change',e=>chooseClub(e.target.value));const t=root.querySelector('#oc5TeamSelect');if(t)t.addEventListener('change',e=>{state.teamId=e.target.value;demoWrite();renderVisible()});const sea=root.querySelector('#oc5SeasonSelect');if(sea)sea.addEventListener('change',e=>{state.seasonId=e.target.value;renderVisible()});
 root.querySelectorAll('[data-oc-action]').forEach(b=>b.addEventListener('click',()=>handleAction(b.dataset.ocAction)));
 root.querySelectorAll('[data-oc-link]').forEach(b=>b.addEventListener('click',()=>window.open(b.dataset.ocLink,'_blank','noopener,noreferrer')));
 const focus=root.querySelector('#oc5Focus');if(focus)focus.addEventListener('change',e=>{state.focus=e.target.value;renderVisible()});
 const pf=root.querySelector('#oc5PlayerFilter');if(pf)pf.addEventListener('change',e=>{state.playerFilter=e.target.value;renderVisible()});const seeking=root.querySelector('#oc5RivalSearch');if(seeking)seeking.addEventListener('input',()=>filterRival(seeking.value));
}catch(err){console.error('Olmos Pro 5 render',err);root.innerHTML=empty('Se produjo un error al mostrar esta pantalla',err.message||'')+' '+button('Reintentar','refresh','oc5-secondary')}}
window.ocPro={renderVisible};
function clubGate(){if(!state.clubId)return empty('Primero crea o selecciona un club','En Clubes y temporadas podrás comenzar una organización con equipos y temporadas.');return ''}
function renderClubs(){let html=top('occlubs','Administra varias instituciones y sus equipos sin mezclar datos. Cada club tiene temporadas, roles e información independiente.',button('＋ Crear club','new:club'));
 if(state.mode==='online'&&!state.user)return html+empty('Entra con Google para gestionar tus clubes','Inicia sesión en la parte superior derecha.');
 html+=`<div class="oc5-kpis">${kpi(state.clubs.length,'Clubes vinculados')}${kpi(get('teams').length,'Equipos del club')}${kpi(get('seasons').length,'Temporadas')}${kpi(get('matches').length,'Partidos registrados')}</div>`;
 html+=`<div class="oc5-grid">${state.clubs.map(c=>secCard(c.name,`<p>${H(c.city||'Ubicación no especificada')} · ${H(c.description||'Proyecto deportivo')}</p>${chip(c.id===state.clubId?'Club activo':'Seleccionable')}<div class="oc5-inline">${button('Abrir club','select:'+c.id,'oc5-secondary')}</div>`)).join('')}</div>`;
 if(!state.clubId)return html+'<div style="margin-top:15px">'+empty('Tu organización deportiva comienza aquí','Crea el primer club para gestionar tus plantillas y temporada.')+'</div>'+foot();
 html+=`<div class="oc5-grid two" style="margin-top:17px">${secCard('Temporadas',`<div class="oc5-list">${get('seasons').map(x=>docRow(x.label,`${dateText(x.start)} — ${dateText(x.end)} · ${x.objective||''}`,canManage()?button('Editar','edit:seasons:'+x.id,'oc5-ghost'):'' )).join('')||empty('Aún no tienes temporadas')}</div><div style="margin-top:12px">${canManage()?button('＋ Nueva temporada','new:seasons','oc5-secondary'):''}</div>`)}${secCard('Cómo funciona la seguridad',`<p>El propietario invita a otros usuarios por correo Google. Cada invitado acepta un enlace único y recibe exclusivamente su rol dentro del club.</p><p>Los jugadores pueden consultar sus registros personales sin recibir una copia de la base de datos completa.</p><p class="oc5-small oc5-muted">Superadministración y soporte permanecen separados de los datos privados del club.</p>`)}</div>`;
 return html+foot();}
function renderTeam(){let html=toolbar('octeam','Gestiona plantillas, posiciones y permisos. Los jugadores acceden a su propio historial mediante invitaciones verificadas.',canManage()?button('＋ Equipo','new:teams')+button('＋ Jugador','new:players','oc5-secondary')+button('Importar plantilla anterior','importLegacy','oc5-ghost'):'' );if(!state.clubId)return html+clubGate();
 html+=`<div class="oc5-grid two">${secCard('Equipos y categorías',get('teams').length?`<div class="oc5-list">${get('teams').map(t=>docRow(t.name,`${t.category||'Sin categoría'} · ${t.season||'Temporada sin definir'}`,canManage()?button('Editar','edit:teams:'+t.id,'oc5-ghost'):'' )).join('')}</div>`:empty('Sin equipos registrados'))}${secCard('Invitaciones y roles',`<p>Envía un enlace individual a un correo Google autorizado. Puedes asignar entrenador, ayudante, analista o jugador.</p>${canOwner()?button('＋ Invitar usuario','invite','oc5-primary'):''}<div class="oc5-list" style="margin-top:10px">${state.members.map(m=>docRow(m.email||'Usuario',`${m.role||'player'} · ${m.status||'active'}`,canOwner()&&m.uid!==state.user?.uid?button(m.status==='active'?'Suspender':'Reactivar','member:'+m.uid+':'+(m.status==='active'?'suspended':'active'),'oc5-ghost'):'' )).join('')||''}${canOwner()?state.invites.map(i=>docRow(i.email,`Invitación ${i.status} · rol: ${i.role}`,i.status==='pending'?button('Revocar','revoke:'+i.id,'oc5-ghost'):'' )).join(''):''}</div>`)}</div>`;
 if(isStaff())html+=`<div class="oc5-card" style="margin-top:15px"><div class="oc5-space"><h3>Plantilla registrada</h3>${chip(get('players').length+' jugadores')}</div><div class="oc5-tablewrap"><table class="oc5-table"><thead><tr><th>Dorsal</th><th>Jugador</th><th>Posición</th><th>Equipo</th><th>Cuenta vinculada</th><th>Editar</th></tr></thead><tbody>${filtered('players').map(x=>`<tr><td>${H(x.number||'—')}</td><td><strong>${H(x.name)}</strong></td><td>${H(x.position||'—')}</td><td>${H(currentTeamLabel(x.teamId))}</td><td>${H(x.email||'Pendiente')}</td><td>${canManage()?button('Editar','edit:players:'+x.id,'oc5-ghost'):''}</td></tr>`).join('')||'<tr><td colspan="6">Todavía no hay jugadores</td></tr>'}</tbody></table></div></div>`;
 else html+=secCard('Mi ficha',myPlayer()?`<p>${H(byId('players',myPlayer())?.name||'Ficha aún no completada')}</p><p>Tu entrenador administra tu plantilla y puede registrar tus estadísticas por encuentro.</p>`:'<p>Tu cuenta aún no está enlazada con una ficha individual. Consulta al entrenador.</p>');
 return html+foot();}
function renderMatches(){let html=toolbar('ocmatches','Registra partidos y acciones observables por minuto; conecta goles, asistencias y minutos con encuentros reales.',canAnalyze()?button('＋ Partido','new:matches'):'' );if(!state.clubId)return html+clubGate();
 const matches=filtered('matches').sort((a,b)=>(b.date||'').localeCompare(a.date||''));const won=matches.filter(m=>n(m.goalsFor)>n(m.goalsAgainst)).length;const goals=matches.reduce((a,m)=>a+n(m.goalsFor),0);const conceded=matches.reduce((a,m)=>a+n(m.goalsAgainst),0);
 html+=`<div class="oc5-kpis">${kpi(matches.length,'Partidos')}${kpi(won,'Victorias')}${kpi(goals,'Goles a favor')}${kpi(conceded,'Goles recibidos')}</div>`;
 if(matches.length){const recent=matches.slice(0,8).reverse();const mx=Math.max(1,...recent.map(m=>n(m.goalsFor)));html+=secCard('Evolución de goles a favor · últimos partidos',`<div class="oc5-chart">${recent.map(m=>`<div title="${H(m.opponent)}: ${n(m.goalsFor)} a favor y ${n(m.goalsAgainst)} recibidos" style="height:${Math.max(4,n(m.goalsFor)/mx*100)}%"><label>${H((m.opponent||'Rival').slice(0,6))}</label></div>`).join('')}</div><div style="height:16px"></div>`);}
 html+=`<div class="oc5-list">${matches.map(m=>`<div class="oc5-card"><div class="oc5-space"><div><h3>${H(m.goalsFor??'—')} : ${H(m.goalsAgainst??'—')} · ${H(m.opponent)}</h3><p>${dateText(m.date)} · ${H(m.competition||'Competición')} · ${H(currentTeamLabel(m.teamId))}</p></div>${canAnalyze()?`<div class="oc5-inline">${button('Acción','new:event:'+m.id,'oc5-secondary')}${button('Estadística','new:stat:'+m.id,'oc5-secondary')}${button('Editar','edit:matches:'+m.id,'oc5-ghost')}</div>`:''}</div><div class="oc5-inline">${chip('Registro de partido')}${chip(get('events').filter(e=>e.matchId===m.id).length+' acciones')}${chip(get('stats').filter(e=>e.matchId===m.id).length+' fichas estadísticas')}</div><div class="oc5-list" style="margin-top:9px">${get('events').filter(e=>e.matchId===m.id).sort((a,b)=>n(a.minute)-n(b.minute)).map(e=>`<div class="oc5-clip"><time>${H(e.minute||0)}′</time><div><strong>${H(e.type)}</strong><div class="oc5-muted">${H(e.detail||'')}${e.videoUrl?` · <a target="_blank" rel="noopener noreferrer" href="${H(url(e.videoUrl))}">Abrir video ↗</a>`:''}</div></div></div>`).join('')}</div><div class="oc5-inline" style="margin-top:10px">${canAnalyze()?get('stats').filter(e=>e.matchId===m.id).map(s=>button((byId('players',s.playerId)?.name||'Jugador')+' · editar ficha','edit:stats:'+s.id,'oc5-ghost')).join(''):''}</div></div>`).join('')||empty('No hay partidos registrados','Agrega un partido y empieza a observar tendencias por encuentro.')}</div>`;
 return html+foot();}
function renderPlan(){let html=toolbar('ocplan','Construye microciclos según calendario competitivo, objetivos del modelo de juego y carga individual registrada.',canManage()?button('＋ Microciclo','new:microcycles'):'' );if(!state.clubId)return html+clubGate();
 const micros=filtered('microcycles').sort((a,b)=>(b.start||'').localeCompare(a.start||''));
 html+=`<div class="oc5-grid two">${secCard('Microciclos programados',`<div class="oc5-list">${micros.map(m=>docRow(m.name,`${dateText(m.start)} → ${dateText(m.end)} · ${m.objective||''} · ${m.status||'Planificado'}`,canManage()?button('Editar','edit:microcycles:'+m.id,'oc5-ghost'):'' )).join('')||empty('Todavía no hay microciclos')}</div>`)}${secCard('Control de carga interna',`<p>La carga de sesión es duración real × RPE percibido, registrada por la persona. Es un indicador orientativo, no una evaluación médica.</p>${button('Registrar RPE','new:loads','oc5-primary')}<p class="oc5-small oc5-muted">Cada jugador solo puede leer sus propios reportes y el personal autorizado del club puede revisar los registros del equipo.</p>`)}</div>`;
 if(canManage())html+=`<div class="oc5-card" style="margin-top:15px"><div class="oc5-space"><h3>Sesiones del club conectadas al microciclo</h3>${button('＋ Nueva sesión de club','new:trainingSessions','oc5-secondary')}</div><div class="oc5-list">${filtered('trainingSessions').map(s=>docRow(s.name,`${dateText(s.date)} · ${s.duration||'—'} min · ${s.objective||'Objetivo sin definir'} · ${s.tasks?.length||0} tareas`,(s.assistantDraft?button('Ver propuesta IA','viewAI:'+s.id,'oc5-secondary'):'')+button('Editar','edit:trainingSessions:'+s.id,'oc5-ghost'))).join('')||empty('Aún no hay sesiones vinculadas')}</div></div>`;
 if(canAnalyze()){
 const loads=get('loads').slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const sum=loads.reduce((v,r)=>v+n(r.duration)*n(r.rpe),0);
 html+=`<div style="margin-top:16px" class="oc5-card"><div class="oc5-space"><h3>Registros de esfuerzo y sesión</h3>${chip(loads.length+' registros · '+sum+' unidades de carga sumadas')}</div><div class="oc5-tablewrap"><table class="oc5-table"><thead><tr><th>Fecha</th><th>Jugador</th><th>Duración real</th><th>RPE (0–10)</th><th>Carga orientativa</th></tr></thead><tbody>${loads.slice(0,80).map(r=>`<tr><td>${H(r.date)}</td><td>${H(byId('players',r.playerId)?.name||'Jugador')}</td><td>${H(r.duration)} min</td><td>${H(r.rpe)}</td><td>${n(r.duration)*n(r.rpe)}</td></tr>`).join('')||'<tr><td colspan="5">Sin registros</td></tr>'}</tbody></table></div></div>`;
 }
 return html+foot();}
function renderModel(){let html=toolbar('ocmodel','Define los principios de tu equipo antes de planificar tareas: intención, disparadores, consignas y criterios de observación.',canManage()?button('＋ Principio de juego','new:principles'):'' );if(!state.clubId)return html+clubGate();
 const phases=['Ataque organizado','Defensa organizada','Transición ataque–defensa','Transición defensa–ataque','Balón parado'];
 html+=phases.map(phase=>`<div style="margin:0 0 15px"><h3 style="margin:10px 0">${H(phase)}</h3><div class="oc5-grid">${get('principles').filter(p=>p.phase===phase).map(p=>secCard(p.name,`${chip(p.phase)}<p><b>Intención:</b> ${H(p.objective||'—')}</p><p><b>Cuándo:</b> ${H(p.trigger||'—')}</p><p><b>Observar:</b> ${H(p.cues||'—')}</p>${canManage()?button('Editar','edit:principles:'+p.id,'oc5-ghost'):''}`)).join('')||'<div class="oc5-empty">Sin principios definidos</div>'}</div></div>`).join('');
 return html+foot();}
function renderScout(){let html=toolbar('ocscout','Prepara rivales, recopila evidencias con enlaces de video y crea secuencias tácticas por fotogramas.',canAnalyze()?button('＋ Informe rival','new:scouting')+button('＋ Secuencia táctica','new:tactics','oc5-secondary'):'' );if(!state.clubId)return html+clubGate();
 html+=`<div class="oc5-grid two">${secCard('Informes de rival',`<div class="oc5-list">${get('scouting').map(s=>docRow(s.opponent,`${s.system||'Sistema por analizar'} · ${s.plan||'Sin plan estratégico'}`,canAnalyze()?button('Ver / editar','edit:scouting:'+s.id,'oc5-ghost'):'' )).join('')||empty('Sin análisis de rivales')}</div>`)}${secCard('Pizarra secuencial',`<p>Guarda posiciones por fotograma y revisa la secuencia anterior o siguiente. Útil para explicar movimientos, coberturas y rotaciones.</p><div class="oc5-list">${get('tactics').map(t=>docRow(t.name,(t.frames?.length||0)+' fotogramas',button('Abrir','tactic:'+t.id,'oc5-secondary'))).join('')||empty('Sin secuencias guardadas')}</div>`)}</div>`;
 return html+foot();}
function renderPerformance(){let html=toolbar('ocperformance','Consulta registros individuales por partido, tendencias observables y planes de desarrollo. Los jugadores solo reciben acceso a sus propios datos.',canAnalyze()?button('＋ Estadística de partido','new:stats'):'');if(!state.clubId)return html+clubGate();
 const stats=filtered('stats'),playerId=isStaff()?(state.playerFilter||null):myPlayer();let visible=playerId?stats.filter(x=>x.playerId===playerId):stats;
 const sum=k=>visible.reduce((a,b)=>a+n(b[k]),0);
 html+=`<div class="oc5-kpis">${kpi(sum('goals'),'Goles registrados')}${kpi(sum('assists'),'Asistencias')}${kpi(sum('minutes'),'Minutos')}${kpi(visible.length,'Registros por partido')}</div>`;
 if(canAnalyze()){
 const players=filtered('players');html+=`<div class="oc5-card"><div class="oc5-space"><h3>Resumen individual</h3><div class="oc5-inline"><select id="oc5PlayerFilter"><option value="">Toda la plantilla</option>${players.map(p=>`<option value="${H(p.id)}" ${state.playerFilter===p.id?'selected':''}>${H(p.name)}</option>`).join('')}</select>${button('Exportar CSV','csv','oc5-secondary')}${button('Imprimir / PDF','print','oc5-ghost')}</div></div><div class="oc5-tablewrap"><table class="oc5-table"><thead><tr><th>Jugador</th><th>Partidos</th><th>Goles</th><th>Asistencias</th><th>Minutos</th><th>Recuperaciones</th></tr></thead><tbody>${players.map(p=>{const a=stats.filter(s=>s.playerId===p.id);const count=k=>a.reduce((v,r)=>v+n(r[k]),0);return `<tr><td>${H(p.name)}</td><td>${a.length}</td><td>${count('goals')}</td><td>${count('assists')}</td><td>${count('minutes')}</td><td>${count('recoveries')}</td></tr>`}).join('')||'<tr><td colspan="6">Sin plantilla registrada</td></tr>'}</tbody></table></div></div>`;
 }else if(playerId){const p=byId('players',playerId);html+=`<div class="oc5-card"><h3>${H(p?.name||'Mi ficha deportiva')}</h3><div class="oc5-list">${visible.map(r=>docRow(byId('matches',r.matchId)?.opponent||'Partido',`${r.goals||0} goles · ${r.assists||0} asistencias · ${r.minutes||0} min`)).join('')||empty('Sin estadísticas todavía')}</div></div>`;}else html+=empty('Tu ficha aún no está vinculada','Pide al entrenador que te asigne una ficha al enviarte la invitación.');
 html+=`<div class="oc5-card" style="margin-top:16px"><div class="oc5-space"><h3>Objetivos de desarrollo individual</h3>${canManage()?button('＋ Plan de desarrollo','new:developmentPlans','oc5-secondary'):''}</div><div class="oc5-list">${get('developmentPlans').filter(x=>!playerId||x.playerId===playerId).map(x=>docRow((byId('players',x.playerId)?.name||'Jugador')+' · '+x.focus,`${x.objective||''} · ${x.reviewDate||'Revisión pendiente'} · ${x.status||'Activo'}`,canManage()?button('Editar','edit:developmentPlans:'+x.id,'oc5-ghost'):'' )).join('')||empty('Sin planes individuales registrados')}</div></div>`;
 if(playerId&&visible.length){const items=visible.slice().sort((a,b)=>(byId('matches',a.matchId)?.date||'').localeCompare(byId('matches',b.matchId)?.date||'')).slice(-8);const max=Math.max(1,...items.map(x=>n(x.goals)));html+=secCard('Goles por partido · evolución individual',`<p class="oc5-small">Registros manuales, sin comparación entre jugadores.</p><div class="oc5-chart">${items.map(x=>`<div style="height:${Math.max(4,n(x.goals)/max*100)}%" title="${H(byId('matches',x.matchId)?.opponent||'Partido')} · ${n(x.goals)} goles"><label>${H((byId('matches',x.matchId)?.opponent||'Partido').slice(0,6))}</label></div>`).join('')}</div><div style="height:16px"></div>`);}
 return html+foot();}
function matchingExercises(){const x=window.ocProLegacy?.getExercises?.()||[];const focus=state.focus.toLowerCase();const categoryMap={'Transiciones':['Transiciones','Juego reducido'],'Defensa organizada':['Táctico defensivo','Juego reducido'],'Ataque posicional':['Táctico ofensivo','Técnico'],'Preparación física':['Físico','Cognitivo'],'Porteros':['Porteros'],'Balón parado':['Balón parado'],'Toma de decisiones':['Cognitivo','Juego reducido']};let cats=categoryMap[state.focus]||[];const rank=e=>{const t=[e.name,e.objective,e.tags,e.development].join(' ').toLowerCase();let score=cats.includes(e.category)?6:0;for(const word of focus.split(' '))if(word.length>3&&t.includes(word))score+=2;if(e.organization&&e.cues)score+=1;return score};return x.map(e=>({...e,_rank:rank(e)})).filter(e=>e._rank>=6).sort((a,b)=>b._rank-a._rank).slice(0,8)}
function renderAssistant(){
 const opts=['Transiciones','Defensa organizada','Ataque posicional','Preparación física','Porteros','Balón parado','Toma de decisiones'];
 const suggestions=matchingExercises();
 const canAI=state.mode==='online'&&!!state.user&&!!state.clubId&&canManage();
 let html=top('ocassistant','Planifica a partir de ejercicios reales del PlayBook y, si activaste Cloud Functions, solicita un borrador generado con IA.',canManage()&&state.clubId?button('＋ Crear sesión con sugerencias','suggestSession'):'' );
 html+=`<div class="oc5-card"><div class="oc5-grid two"><div class="oc5-field"><label>Objetivo de la sesión</label><select id="oc5Focus">${opts.map(o=>`<option ${state.focus===o?'selected':''}>${o}</option>`).join('')}</select></div><div class="oc5-field"><label>Recomendador local</label><p style="margin:0">Cruza el objetivo con las categorías y las fichas de tus 347 ejercicios. Funciona sin activar IA y no tiene costo por consulta.</p></div></div></div>`;
 html+=`<div style="margin-top:15px" class="oc5-grid">${suggestions.slice(0,6).map(e=>secCard(e.name,`${chip(e.category)}${chip(e.level||'Nivel adaptable')}<p>${H(e.objective||'Trabajar el objetivo del ejercicio.')}</p><p class="oc5-small">${H(e.duration)} min orientativos · ${H(e.players||'')} jugadores</p>${button('Ver en PlayBook','playbook:'+e.id,'oc5-secondary')}`)).join('')||empty('Sin sugerencias con este objetivo','Revisa el PlayBook para añadir o adaptar tareas.')}</div>`;
 html+=`<section class="oc5-card oc5-ai-panel" style="margin-top:18px"><div class="oc5-space"><div><span class="oc5-ai-label">FIREBASE + OPENAI</span><h3 style="margin:5px 0">Asistente de microciclos con IA</h3></div>${chip(canAI?'Cuenta Google conectada':'Requiere entrenador autenticado')}</div><p class="oc5-muted">Propondrá una sesión estructurada usando como referencias los ejercicios visibles de tu PlayBook. No envía la plantilla ni estadísticas de jugadores. Es un borrador que revisas antes de usarlo.</p>
 <div class="oc5-formgrid"><div class="oc5-field"><label for="oc5AiCategory">Categoría</label><input id="oc5AiCategory" maxlength="40" value="${H(state.aiParams.category)}" placeholder="Ej. Sub-17"></div><div class="oc5-field"><label for="oc5AiPlayers">Jugadores disponibles</label><input id="oc5AiPlayers" type="number" min="3" max="30" value="${H(state.aiParams.players)}"></div><div class="oc5-field"><label for="oc5AiMinutes">Duración total (min)</label><input id="oc5AiMinutes" type="number" min="20" max="150" value="${H(state.aiParams.minutes)}"></div><div class="oc5-field"><label for="oc5AiEquipment">Material</label><input id="oc5AiEquipment" maxlength="180" value="${H(state.aiParams.equipment)}"></div><div class="oc5-field" style="grid-column:1/-1"><label for="oc5AiNotes">Consignas metodológicas opcionales (sin datos personales)</label><textarea id="oc5AiNotes" maxlength="350" placeholder="Ej. Foco en reorganización tras pérdida, superficie media cancha">${H(state.aiParams.notes)}</textarea></div></div>
 <div class="oc5-inline" style="margin-top:15px"><button class="oc5-primary" data-oc-action="generateAI" ${!canAI||state.aiBusy?'disabled':''}>${state.aiBusy?'Generando propuesta…':'✦ Generar propuesta con IA'}</button><span class="oc5-small oc5-muted">Máximo 5 solicitudes diarias por cuenta, 1 por minuto. Puede generar costos.</span></div>
 ${!canAI?'<p class="oc5-note">Para generar con IA, entra con Google, selecciona un club y utiliza un perfil con rol de entrenador. También debes desplegar la Cloud Function y cargar la clave de OpenAI como secreto.</p>':''}
 ${state.aiError?`<p class="oc5-ai-error" role="alert">${H(state.aiError)}</p>`:''}
 ${state.aiPlan?`<div class="oc5-ai-answer"><div class="oc5-space"><strong>Propuesta de entrenamiento</strong><span class="oc5-small">Requiere revisión del entrenador</span></div><pre>${H(state.aiPlan)}</pre><div class="oc5-inline"><button class="oc5-secondary" data-oc-action="copyAI">Copiar propuesta</button>${canAI?button('Guardar borrador en sesiones','saveAI'):''}</div></div>`:''}
 </section>`;
 return html;
}
async function runAssistantAI(){
 if(state.aiBusy)return;
 if(state.mode!=='online'||!canManage()||!state.clubId||!state.user){note('Inicia sesión como entrenador y selecciona un club.');return}
 const root=UI();
 const params={category:root.querySelector('#oc5AiCategory')?.value?.trim()||'',players:Number(root.querySelector('#oc5AiPlayers')?.value),minutes:Number(root.querySelector('#oc5AiMinutes')?.value),equipment:root.querySelector('#oc5AiEquipment')?.value?.trim()||'',notes:root.querySelector('#oc5AiNotes')?.value?.trim()||''};
 if(params.category.length<2||!Number.isInteger(params.players)||params.players<3||params.players>30||!Number.isInteger(params.minutes)||params.minutes<20||params.minutes>150){note('Revisa la categoría, 3–30 jugadores y 20–150 minutos.');return}
 state.aiParams=params;state.aiBusy=true;state.aiError='';state.aiPlan='';const invokingUid=state.user.uid,invokingClub=state.clubId;renderVisible();
 try{
  const {getFunctions,httpsCallable}=await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-functions.js');
  const app=state.auth?.app;if(!app)throw new Error('Firebase Auth no está iniciado.');
  const functionCall=httpsCallable(getFunctions(app,'us-central1'),'generateFutsalPlan',{timeout:65000});
  const candidates=matchingExercises().slice(0,8).map(e=>({id:String(e.id||''),name:String(e.name||''),category:String(e.category||''),objective:String(e.objective||''),duration:Number(e.duration)||10}));
  const {data}=await functionCall({clubId:state.clubId,focus:state.focus,...params,candidates});
  if(!data?.plan)throw new Error('La función no devolvió una propuesta.');
  if(state.user?.uid!==invokingUid||state.clubId!==invokingClub)return;state.aiPlan=String(data.plan).slice(0,7500);
 }catch(err){
  const code=err?.code||'';
  const messages={'functions/not-found':'La función de IA no está publicada. Ejecuta firebase.cmd deploy --only functions.','functions/unauthenticated':'Debes iniciar sesión con Google.','functions/permission-denied':'Solo los entrenadores del club pueden utilizar este asistente.','functions/resource-exhausted':'Límite de consultas alcanzado; revisa el intervalo diario o el proveedor.','functions/failed-precondition':'Falta configurar la clave de OpenAI en Firebase o hay un problema con ella.','functions/unavailable':'No se pudo contactar la IA. Intenta más tarde.','functions/deadline-exceeded':'La IA tardó demasiado; prueba otra vez.'};
  state.aiError=messages[code]||('No se pudo generar la propuesta: '+String(err?.message||'Error desconocido').slice(0,160));
  console.warn('Olmos IA:',code||'error');
 }finally{state.aiBusy=false;renderVisible();}
}
async function saveAssistantAI(){
 if(!state.aiPlan||!canManage()||!state.clubId)return;
 const selected=matchingExercises().slice(0,5);
 const tasks=selected.map(e=>({id:e.id,name:e.name,duration:n(e.duration),category:e.category,objective:e.objective}));
 try{
  await writeRecord('trainingSessions',{name:'Borrador IA · '+state.focus,date:today(),objective:state.focus,teamId:state.teamId||'',duration:state.aiParams.minutes,assistantDraft:state.aiPlan,origin:'ai-review-required',tasks,microcycleId:''});
  note('Propuesta IA guardada. En Planificación → Ver propuesta IA puedes revisar el texto completo.');
 }catch(err){state.aiError='No se pudo guardar: '+String(err?.message||err);renderVisible()}
}
function copyAssistantAI(){if(!state.aiPlan)return;navigator.clipboard?.writeText(state.aiPlan).then(()=>note('Propuesta copiada')).catch(()=>note('No se pudo copiar; selecciona el texto manualmente.'))}
const FIELDS={
 club:[['name','Nombre del club','text',true],['city','Ciudad o localidad','text'],['description','Descripción breve','text']],
 seasons:[['label','Nombre de la temporada','text',true],['start','Inicio','date'],['end','Término','date'],['objective','Objetivo general','textarea']],
 teams:[['name','Nombre del equipo','text',true],['category','Categoría','text'],['season','Temporada','text'],['headCoach','Entrenador responsable','text']],
 players:[['name','Nombre deportivo','text',true],['number','Número / dorsal','number'],['position','Posición','select:Portero|Cierre|Ala|Pívot|Universal'],['teamId','Equipo','teams'],['email','Correo Google para vinculación','email']],
 matches:[['opponent','Rival','text',true],['date','Fecha','date',true],['competition','Competición','text'],['teamId','Equipo','teams'],['seasonId','Temporada','seasons'],['homeAway','Condición','select:Local|Visita|Neutral'],['goalsFor','Goles propios','number'],['goalsAgainst','Goles recibidos','number'],['notes','Resumen táctico','textarea']],
 events:[['matchId','Partido','matches',true],['minute','Minuto del partido','number'],['type','Tipo de evento','select:Gol|Ocasión|Recuperación|Pérdida|Transición|Balón parado|Error defensivo|Otro'],['playerId','Jugador (opcional)','players'],['detail','Descripción de la acción','textarea'],['videoUrl','Enlace del video (opcional)','url']],
 stats:[['matchId','Partido','matches',true],['playerId','Jugador','players',true],['goals','Goles','number'],['assists','Asistencias','number'],['minutes','Minutos reales','number'],['shots','Remates','number'],['recoveries','Recuperaciones','number'],['keyPasses','Pases clave','number']],
 microcycles:[['name','Nombre del microciclo','text',true],['start','Inicio','date',true],['end','Final','date',true],['teamId','Equipo','teams'],['seasonId','Temporada','seasons'],['objective','Objetivo principal','textarea'],['loadNote','Gestión de carga / progresión prevista','textarea'],['status','Estado','select:Planificado|En curso|Finalizado']],
 principles:[['name','Nombre del principio','text',true],['phase','Fase del juego','select:Ataque organizado|Defensa organizada|Transición ataque–defensa|Transición defensa–ataque|Balón parado'],['objective','Intención táctica','textarea'],['trigger','Situación que lo activa','textarea'],['cues','Criterios de observación','textarea']],
 scouting:[['opponent','Equipo rival','text',true],['system','Sistema y estructura','text'],['pressing','Comportamiento de presión','textarea'],['strengths','Fortalezas observadas','textarea'],['weaknesses','Situaciones aprovechables','textarea'],['plan','Plan de partido propuesto','textarea'],['videoUrl','Video externo (opcional)','url']],
 loads:[['date','Fecha','date',true],['playerId','Jugador','players',true],['duration','Minutos realizados','number',true],['rpe','Esfuerzo percibido (0–10)','number',true],['note','Observación no médica','textarea']],
 trainingSessions:[['name','Nombre de la sesión','text',true],['date','Fecha','date',true],['teamId','Equipo','teams'],['seasonId','Temporada','seasons'],['microcycleId','Microciclo','microcycles'],['duration','Minutos previstos','number'],['objective','Objetivo concreto','textarea']],
 developmentPlans:[['playerId','Jugador','players',true],['focus','Área de desarrollo','select:Técnico|Táctico|Físico|Cognitivo|Conducta deportiva'],['objective','Objetivo observable','textarea',true],['baseline','Observación inicial','textarea'],['target','Criterio de progreso','textarea'],['reviewDate','Próxima revisión','date'],['status','Estado','select:Activo|En revisión|Alcanzado']],
 tactics:[['name','Nombre de la jugada','text',true]]
};
function fieldHTML([key,label,type,req],obj){const val=obj[key]??(type==='date'?today():'');let input='';if(type==='textarea')input=`<textarea name="${key}" ${req?'required':''}>${H(val)}</textarea>`;
 else if(type.startsWith('select:'))input=`<select name="${key}">${type.slice(7).split('|').map(v=>`<option ${val===v?'selected':''}>${H(v)}</option>`).join('')}</select>`;
 else if(KIND[type]){let list=type==='teams'?get('teams'):type==='players'?get('players'):type==='microcycles'?get('microcycles'):type==='seasons'?get('seasons'):get('matches');input=`<select name="${key}" ${req?'required':''}><option value="">Seleccionar…</option>${list.map(v=>`<option value="${H(v.id)}" ${val===v.id?'selected':''}>${H(v.name||v.opponent)}</option>`).join('')}</select>`;}
 else input=`<input name="${key}" type="${type}" value="${H(val)}" ${req?'required':''} ${type==='number'?'min="0" step="1"':''} ${key==='rpe'?'max="10"':''} maxlength="${type==='text'?220:500}">`;
 return `<div class="oc5-field"><label>${H(label)}${req?' *':''}</label>${input}</div>`;}
function modal(title,html,onSave){document.querySelector('#oc5Dialog')?.remove();const d=document.createElement('dialog');d.id='oc5Dialog';d.className='oc5-dialog';d.innerHTML=`<div class="oc5-dialoghead"><h2>${H(title)}</h2><button class="oc5-ghost" type="button" id="oc5Close">✕</button></div><form id="oc5Form"><div class="oc5-dialogbody">${html}</div><div class="oc5-dialogfoot"><button type="button" class="oc5-ghost" id="oc5Cancel">Cancelar</button><button class="oc5-primary" type="submit" id="oc5Submit">Guardar cambios</button></div></form>`;document.body.append(d);d.showModal();const close=()=>d.close();d.querySelector('#oc5Close').onclick=close;d.querySelector('#oc5Cancel').onclick=close;d.addEventListener('close',()=>d.remove());d.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const b=d.querySelector('#oc5Submit');b.disabled=true;b.textContent='Guardando…';try{await onSave(new FormData(e.target));close();renderVisible()}catch(error){console.error(error);note(error.message||'No se pudo guardar');b.disabled=false;b.textContent='Guardar cambios'}});}
function acl(kind){if(kind==='loads')return state.mode==='demo'||isStaff()||!!myPlayer();if(kind==='stats'||kind==='events'||kind==='scouting'||kind==='tactics')return canAnalyze();return canManage()}
function openForm(kind,preset={},existingId=''){
 if(!acl(kind)){note('No tienes permisos para editar esta sección.');return}
 const original=existingId?byId(kind,existingId)||{}:{};const init={...original,...preset};
 if(kind==='loads'&&!isStaff()){init.playerId=myPlayer();if(!init.playerId){note('Tu entrenador todavía no ha vinculado una ficha deportiva.');return}}
 let fields=FIELDS[kind]||[];if(kind==='loads'&&!isStaff())fields=fields.filter(f=>f[0]!=='playerId');
 const html=`<div class="oc5-form"><p class="oc5-muted oc5-small">${H(KIND[kind]||'Nuevo elemento')} · Los campos se guardarán en el club seleccionado.</p><div class="oc5-formgrid">${fields.map(f=>fieldHTML(f,init)).join('')}</div></div>`;
 modal((existingId?'Editar ':'Crear ')+(KIND[kind]||kind),html,async values=>{
 const obj={};for(const [k,v] of values.entries())obj[k]=String(v).trim();
 if(kind==='loads'&&!isStaff())obj.playerId=myPlayer();
 if(kind==='stats'&&!obj.playerId)throw new Error('Selecciona un jugador');
 if(kind==='loads'){if(n(obj.rpe)>10||n(obj.rpe)<0||n(obj.duration)>300)throw new Error('Revisa la duración (máximo 300) y el RPE (0 a 10)');}
 for(const k of ['goals','assists','minutes','shots','recoveries','keyPasses','goalsFor','goalsAgainst','number','minute','duration','rpe'])if(k in obj)obj[k]=Math.max(0,n(obj[k]));
 for(const k of Object.keys(obj).filter(k=>k.toLowerCase().endsWith('url')))if(obj[k]&&!url(obj[k]))throw new Error('Escribe un enlace http o https válido');
 if(kind==='developmentPlans'&&!obj.playerId)throw Error('Selecciona un jugador para el plan');
 if(kind==='stats'){if(!existingId&&get('stats').some(s=>s.matchId===obj.matchId&&s.playerId===obj.playerId))throw Error('Ya existe una ficha de este jugador para ese partido; edítala desde el partido.');const m=byId('matches',obj.matchId);if(!m)throw new Error('Selecciona un partido registrado');obj.teamId=m.teamId||'';}
 if(kind==='loads'&&!isStaff())obj.uid=state.user.uid;
 if(kind==='loads'&&isStaff()&&obj.playerId){const p=byId('players',obj.playerId);obj.uid=state.members.find(m=>m.playerId===obj.playerId)?.uid||p?.authUid||'';}
 if(kind==='events'){obj.teamId=byId('matches',obj.matchId)?.teamId||'';}
 if(kind==='tactics'&&!existingId)obj.frames=[{dots:defaultDots()}];
 await writeRecord(kind,obj,existingId);
 note(existingId?'Registro actualizado':'Registro creado');
 });
}
async function writeRecord(kind,values,key=''){
 if(!state.clubId)throw new Error('Selecciona un club');
 const c=state.clubId;
 if(state.mode==='demo'){
  const x=demoClubs[c]||(demoClubs[c]=datasetEmpty());
  if(!x[kind])x[kind]=[];const obj={...values,id:key||id(),updatedAt:Date.now()};const i=x[kind].findIndex(r=>r.id===obj.id);if(i<0)x[kind].unshift(obj);else x[kind][i]={...x[kind][i],...obj};state.data=x;demoWrite();renderVisible();return obj.id;
 }
 if(state.mode!=='online')throw new Error('Conecta Google para guardar en Firebase');
 const {doc,collection,addDoc,updateDoc,serverTimestamp}=state.sdk;
 const path=collection(state.store,'clubs',c,kind);
 const v={...values,updatedAt:serverTimestamp()};
 if(key){await updateDoc(doc(path,key),v);return key}
 const ref=await addDoc(path,{...v,createdAt:serverTimestamp()});return ref.id;
}
function handleAction(raw){if(raw==='refresh'){renderVisible();return}if(raw==='new:club'){createClub();return}if(raw==='invite'){invite();return}if(raw==='importLegacy'){importLegacy();return}if(raw.startsWith('member:')){const [_,uid,status]=raw.split(':');changeMember(uid,status);return}if(raw.startsWith('revoke:')){revokeInvite(raw.slice(7));return}if(raw.startsWith('viewAI:')){const saved=byId('trainingSessions',raw.slice(7));if(saved?.assistantDraft){modal('Propuesta IA · '+saved.name,`<div class="oc5-ai-answer"><pre>${H(saved.assistantDraft)}</pre><p class="oc5-muted">Borrador: revisa objetivos, duraciones y tareas antes de aplicarlo.</p></div>`,async()=>{});const btn=document.querySelector('#oc5Submit');if(btn)btn.style.display='none';}return}if(raw==='generateAI'){runAssistantAI();return}if(raw==='saveAI'){saveAssistantAI();return}if(raw==='copyAI'){copyAssistantAI();return}if(raw==='suggestSession'){suggestSession();return}if(raw==='csv'){exportCSV();return}if(raw==='print'){window.print();return}if(raw==='acceptJoin'){acceptJoin();return}if(raw.startsWith('select:')){chooseClub(raw.slice(7));return}if(raw.startsWith('new:event:')){openForm('events',{matchId:raw.slice(10)});return}if(raw.startsWith('new:stat:')){openForm('stats',{matchId:raw.slice(9)});return}if(raw.startsWith('new:')){openForm(raw.slice(4));return}if(raw.startsWith('edit:')){const [,kind,key]=raw.split(':');openForm(kind,{},key);return}if(raw.startsWith('tactic:')){openTactics(raw.slice(7));return}if(raw.startsWith('playbook:')){const drill=raw.slice(9);window.go?.('playbook');window.viewExercise?.(drill);return} }
async function createClub(){if(state.mode==='online'&&!state.user){note('Primero inicia sesión con Google.');return}
 modal('Crear club deportivo',`<div class="oc5-formgrid">${FIELDS.club.map(f=>fieldHTML(f,{})).join('')}</div><p class="oc5-note">El creador del club es su propietario. Podrás agregar entrenadores y jugadores con enlaces de invitación personales.</p>`,async fd=>{
 const obj={name:String(fd.get('name')||'').trim(),city:String(fd.get('city')||'').trim(),description:String(fd.get('description')||'').trim()};if(obj.name.length<3)throw new Error('Escribe el nombre del club');
 const clubId='club_'+id().replaceAll('-','').slice(0,27);
 if(state.mode==='demo'){const c={...obj,id:clubId,ownerUid:'demo',createdAt:Date.now()};state.clubs.push(c);demoClubs[clubId]=datasetEmpty();state.clubId=clubId;state.club=c;state.data=demoClubs[clubId];state.membership={role:'owner'};demoWrite();renderVisible();return}
 const {doc,writeBatch,serverTimestamp}=state.sdk;const b=writeBatch(state.store);const u=state.user.uid;
 b.set(doc(state.store,'clubs',clubId),{...obj,ownerUid:u,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),schemaVersion:6});
 b.set(doc(state.store,'clubs',clubId,'members',u),{uid:u,email:state.user.email.toLowerCase(),role:'owner',status:'active',teamId:'',playerId:'',createdAt:serverTimestamp()});
 b.set(doc(state.store,'users',u,'clubLinks',clubId),{clubId,uid:u,createdAt:serverTimestamp()});
 await b.commit();await chooseClub(clubId);
 });}
async function invite(){if(!canOwner()){note('Solo el propietario puede invitar cuentas');return}
 modal('Invitar a un miembro',`<div class="oc5-formgrid"><div class="oc5-field"><label>Correo Google * (debe coincidir)</label><input type="email" name="email" required></div><div class="oc5-field"><label>Rol</label><select name="role"><option value="player">Jugador</option><option value="head_coach">Entrenador</option><option value="assistant">Ayudante</option><option value="analyst">Analista</option></select></div><div class="oc5-field"><label>Equipo</label><select name="teamId"><option value="">No asignado</option>${get('teams').map(t=>`<option value="${H(t.id)}">${H(t.name)}</option>`).join('')}</select></div><div class="oc5-field"><label>Ficha deportiva (si es jugador)</label><select name="playerId"><option value="">Pendiente de vinculación</option>${get('players').map(p=>`<option value="${H(p.id)}">${H(p.name)}</option>`).join('')}</select></div></div><p class="oc5-note">El enlace solo funcionará cuando la persona abra Google con el correo invitado. Nunca compartas estadísticas privadas mediante enlaces públicos.</p>`,async fd=>{
 const email=String(fd.get('email')||'').trim().toLowerCase();const role=fd.get('role');const teamId=fd.get('teamId')||'';const playerId=role==='player'?fd.get('playerId')||'':'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Correo inválido');
 const code=id().replaceAll('-','').slice(0,26);let link=new URL(location.href);link.searchParams.set('join',state.clubId+':'+code);link.searchParams.delete('club');
 if(state.mode==='online'){
 const {doc,setDoc,serverTimestamp}=state.sdk;
 await setDoc(doc(state.store,'clubs',state.clubId,'invites',code),{email,role,teamId,playerId,status:'pending',createdBy:state.user.uid,createdAt:serverTimestamp()});
 }else {demoClubs[state.clubId].invites=[...(demoClubs[state.clubId].invites||[]),{email,role,teamId,playerId,code}];demoWrite()}
 try{await navigator.clipboard.writeText(link.toString());note('Invitación copiada. Envíala solo al correo indicado.')}catch{prompt('Copia este enlace y envíaselo al jugador:',link.toString())}
 });}
async function acceptJoin(){const pair=state.openJoin||new URL(location.href).searchParams.get('join');if(!pair){note('No hay invitación abierta');return}
 if(state.mode!=='online'||!state.user){note('Inicia sesión con el correo Google que recibió la invitación');return}
 const [clubId,code]=pair.split(':');if(!clubId||!code)throw Error('Invitación inválida');
 const {doc,getDoc,writeBatch,serverTimestamp}=state.sdk;
 const inviteRef=doc(state.store,'clubs',clubId,'invites',code);const invitation=await getDoc(inviteRef);
 if(!invitation.exists())throw Error('El enlace no existe o el correo no coincide');const inv=invitation.data();
 if(inv.email!==state.user.email.toLowerCase()||inv.status!=='pending')throw Error('Esta invitación no está disponible para tu cuenta');
 const m=doc(state.store,'clubs',clubId,'members',state.user.uid),l=doc(state.store,'users',state.user.uid,'clubLinks',clubId);
 const batch=writeBatch(state.store);
 batch.set(m,{uid:state.user.uid,email:state.user.email.toLowerCase(),role:inv.role,teamId:inv.teamId||'',playerId:inv.playerId||'',inviteId:code,status:'active',createdAt:serverTimestamp()});
 batch.set(l,{clubId,uid:state.user.uid,createdAt:serverTimestamp()});
 await batch.commit();state.openJoin=null;const next=new URL(location.href);next.searchParams.delete('join');history.replaceState(null,'',next);note('Te uniste al club correctamente');await chooseClub(clubId);
}
async function suggestSession(){
 if(!canManage()||!state.clubId){note('Selecciona tu club para crear la sesión');return}
 const drills=matchingExercises().slice(0,5);if(!drills.length){note('No hay tareas para ese objetivo');return}
 const date=prompt('Fecha de la nueva sesión (AAAA-MM-DD)',today());if(date===null)return;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){note('Fecha inválida');return}
 const tasks=drills.map(e=>({id:e.id,name:e.name,duration:n(e.duration),category:e.category,objective:e.objective}));
 await writeRecord('trainingSessions',{name:'Sesión · '+state.focus,date,objective:state.focus,teamId:state.teamId||'',duration:tasks.reduce((v,x)=>v+x.duration,0),tasks,microcycleId:''});
 note('Sesión guardada en el club · revisa y adapta cada tarea');window.go?.('ocplan');
}
async function importLegacy(){
 if(!canManage()||!state.clubId)return;
 const before=window.ocProLegacy?.getOwnedPlayers?.()||[];
 if(!before.length){note('Tu espacio personal clásico no tiene jugadores disponibles para importar.');return}
 modal('Importar plantilla desde Olmos 4.x',`<p class="oc5-muted">Se copiarán exclusivamente nombres, dorsales, posiciones y correos de tus ${before.length} fichas anteriores. No se borrarán los datos de origen ni se inventarán estadísticas por partido.</p><div class="oc5-field"><label>Equipo de destino</label><select name="teamId"><option value="">Sin equipo asignado</option>${get('teams').map(t=>`<option value="${H(t.id)}">${H(t.name)}</option>`).join('')}</select></div><p class="oc5-note">Antes de continuar, realiza una exportación JSON de tu versión anterior. Revisa que tienes autorización para gestionar estos datos.</p>`,async fd=>{
 const teamId=String(fd.get('teamId')||'');const existing=new Set(get('players').map(p=>(p.email||p.name||'').trim().toLowerCase()));
 const rows=before.filter(p=>p.name&&(!existing.has((p.email||p.name).trim().toLowerCase()))).slice(0,150).map(p=>({name:String(p.name).slice(0,100),number:n(p.number),position:String(p.position||'Universal'),teamId,email:String(p.email||'').toLowerCase()}));
 if(!rows.length){note('Los jugadores de origen ya existen en este club');return}
 if(state.mode==='demo'){for(const row of rows)await writeRecord('players',row)}
 else{const {writeBatch,collection,doc,serverTimestamp}=state.sdk;const b=writeBatch(state.store);for(const row of rows)b.set(doc(collection(state.store,'clubs',state.clubId,'players')),{...row,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});await b.commit()}
 note('Importación completada: '+rows.length+' jugadores. Sus estadísticas por partido se registran en la nueva versión.');
 });
}
async function changeMember(uid,status){
 if(!canOwner()||uid===state.user?.uid)return;
 if(!confirm((status==='suspended'?'Suspender':'Reactivar')+' este miembro del club?'))return;
 try{if(state.mode==='demo'){note('Control de miembros requiere Google');return}await state.sdk.updateDoc(state.sdk.doc(state.store,'clubs',state.clubId,'members',uid),{status});note('Permiso del miembro actualizado')}
 catch(e){note('No se pudo cambiar el acceso: '+(e.code||e.message))}
}
async function revokeInvite(code){
 if(!canOwner()||state.mode!=='online')return;
 if(!confirm('¿Revocar esta invitación?'))return;
 try{await state.sdk.updateDoc(state.sdk.doc(state.store,'clubs',state.clubId,'invites',code),{status:'revoked'});note('Invitación revocada')}
 catch(e){note('No se pudo revocar: '+(e.code||e.message))}
}
function exportCSV(){const players=filtered('players'),stats=filtered('stats');const rows=[['Jugador','Partidos','Goles','Asistencias','Minutos','Recuperaciones'],...players.map(p=>{const a=stats.filter(s=>s.playerId===p.id);const calc=k=>a.reduce((v,r)=>v+n(r[k]),0);return [p.name,a.length,calc('goals'),calc('assists'),calc('minutes'),calc('recoveries')];})];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='olmos-rendimiento-'+today()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),500)}
function defaultDots(){return [{x:21,y:50,kind:'our',label:'1'},{x:40,y:26,kind:'our',label:'2'},{x:44,y:74,kind:'our',label:'3'},{x:65,y:50,kind:'our',label:'4'},{x:77,y:50,kind:'rival',label:'D'}]}
function openTactics(key){let t=byId('tactics',key);if(!t)return;let frames=JSON.parse(JSON.stringify(t.frames||[{dots:defaultDots()}]));let ix=0;const scene=()=>`<div class="oc5-formation" id="oc5Board5">${frames[ix].dots.map((d,k)=>`<div class="oc5-dot ${d.kind==='rival'?'rival':''}" data-index="${k}" style="left:${n(d.x)}%;top:${n(d.y)}%">${H(d.label||k+1)}</div>`).join('')}</div><p class="oc5-muted oc5-small">Arrastra las fichas para diseñar cada fotograma. Fotograma ${ix+1} de ${frames.length}.</p><div class="oc5-inline"><button type="button" class="oc5-secondary" id="oc5Prev">← Anterior</button><button type="button" class="oc5-secondary" id="oc5Next">Siguiente →</button><button type="button" class="oc5-primary" id="oc5AddFrame">Duplicar fotograma</button></div>`;
 modal('Secuencia táctica · '+t.name,'<div id="oc5TacticBoard">'+scene()+'</div>',async()=>{await writeRecord('tactics',{frames},key);note('Secuencia guardada')});
 const connect=()=>{const root=$('oc5TacticBoard');root.innerHTML=scene();root.querySelector('#oc5Prev').onclick=()=>{ix=Math.max(0,ix-1);connect()};root.querySelector('#oc5Next').onclick=()=>{ix=Math.min(frames.length-1,ix+1);connect()};root.querySelector('#oc5AddFrame').onclick=()=>{frames.splice(ix+1,0,{dots:JSON.parse(JSON.stringify(frames[ix].dots))});ix++;connect()};root.querySelectorAll('.oc5-dot').forEach(el=>{
  el.onpointerdown=e=>{e.preventDefault();const board=root.querySelector('#oc5Board5');const update=evt=>{const rect=board.getBoundingClientRect();const x=Math.max(4,Math.min(96,(evt.clientX-rect.left)/rect.width*100));const y=Math.max(6,Math.min(94,(evt.clientY-rect.top)/rect.height*100));frames[ix].dots[n(el.dataset.index)].x=x;frames[ix].dots[n(el.dataset.index)].y=y;el.style.left=x+'%';el.style.top=y+'%'};el.setPointerCapture(e.pointerId);el.onpointermove=update;el.onpointerup=()=>el.onpointermove=null;};
 });};connect();}
// Firebase bootstrapping: each person keeps a private account, clubs are independent.
function unsubscribeAll(){for(const f of state.unsubs.splice(0)){try{f()}catch{}}}
function setRecords(kind,snapshot){state.data[kind]=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderVisible()}
function listen(ref,callback,name){const unsub=state.sdk.onSnapshot(ref,callback,e=>{console.error('OC5 '+name,e);note('Error de permisos o conexión en '+name+': '+(e.code||e.message||''))});state.unsubs.push(unsub)}
async function chooseClub(clubId){state.aiPlan='';state.aiError='';unsubscribeAll();state.clubId=clubId;state.teamId='';state.seasonId='';state.playerFilter='';state.members=[];state.invites=[];state.membership=null;state.data=datasetEmpty();state.club=state.clubs.find(c=>c.id===clubId)||null;
 if(!clubId){demoWrite();renderVisible();return}
 if(state.mode==='demo'){state.club=state.clubs.find(c=>c.id===clubId);state.data=demoClubs[clubId]||(demoClubs[clubId]=datasetEmpty());state.membership={role:'owner'};demoWrite();renderVisible();return}
 if(!state.user)return;
 const {doc,collection,query,where,getDoc}=state.sdk;const uid=state.user.uid;
 try{
 const c=await getDoc(doc(state.store,'clubs',clubId));const m=await getDoc(doc(state.store,'clubs',clubId,'members',uid));
 if(!c.exists()||!m.exists()||m.data().status!=='active')throw Error('No tienes acceso a este club.');
 state.club={id:clubId,...c.data()};state.membership=m.data();renderVisible();
 listen(doc(state.store,'clubs',clubId,'members',uid),snap=>{if(!snap.exists()||snap.data().status!=='active'){state.membership=null;unsubscribeAll();state.data=datasetEmpty();note('Acceso al club suspendido o revocado');renderVisible();return}state.membership=snap.data();renderVisible()},'Mi permiso de club');
 const col=k=>collection(state.store,'clubs',clubId,k);
 const staff=isStaff();
 const readKinds=staff?['teams','seasons','players','matches','events','stats','microcycles','principles','scouting','loads','tactics','trainingSessions','developmentPlans']
  :['teams','seasons','matches','microcycles','principles','tactics','trainingSessions'];
 for(const k of readKinds)listen(col(k),snap=>setRecords(k,snap),k);
 if(staff){listen(col('members'),snap=>{state.members=snap.docs.map(d=>({uid:d.id,...d.data()}));renderVisible()},'Miembros');if(canOwner())listen(col('invites'),snap=>{state.invites=snap.docs.map(d=>({id:d.id,...d.data()}));renderVisible()},'Invitaciones');}
 else{
  if(m.data().playerId){
   listen(doc(col('players'),m.data().playerId),s=>{state.data.players=s.exists()?[{id:s.id,...s.data()}]:[];renderVisible()},'Mi ficha');
   listen(query(col('stats'),where('playerId','==',m.data().playerId)),s=>setRecords('stats',s),'Mis estadísticas');
  }
  listen(query(col('loads'),where('uid','==',uid)),s=>setRecords('loads',s),'Mis cargas');
  if(m.data().playerId)listen(query(col('developmentPlans'),where('playerId','==',m.data().playerId)),s=>setRecords('developmentPlans',s),'Mis objetivos individuales');
 }
 }catch(e){console.error('OC5 chooseClub',e);note('No se pudo abrir el club: '+(e.code||e.message));state.membership=null;renderVisible()}
}
let linkUnsub=null;
function resetOnline(){state.aiPlan='';state.aiError='';unsubscribeAll();linkUnsub?.();linkUnsub=null;state.user=null;state.clubId='';state.membership=null;state.clubs=[];state.data=datasetEmpty();renderVisible()}
async function loadMemberships(user){if(!user)return;linkUnsub?.();
 const {collection,onSnapshot,getDoc,doc}=state.sdk;
 linkUnsub=onSnapshot(collection(state.store,'users',user.uid,'clubLinks'),async snap=>{
  const ids=snap.docs.map(d=>d.id).slice(0,35),clubs=[];
  for(const clubId of ids){try{const c=await getDoc(doc(state.store,'clubs',clubId));if(c.exists())clubs.push({id:c.id,...c.data()})}catch(e){console.warn('Club sin acceso',clubId,e)}}
  if(state.user?.uid!==user.uid)return;state.clubs=clubs;
  const target=state.clubId&&ids.includes(state.clubId)?state.clubId:ids[0]||'';
  if(target!==state.clubId||!state.membership)await chooseClub(target);else renderVisible();
  if(state.openJoin){if(state.openJoin.includes(':'))renderVisible();}
 },e=>{console.error(e);note('No se pudieron cargar tus clubes: '+(e.code||e.message))});}
let started=false;
async function bootFirebase(ctx){if(started)return;started=true;
 state.auth=ctx.auth;state.store=ctx.store;state.mode='auth';state.clubs=[];state.clubId='';state.membership=null;
 try{const base='https://www.gstatic.com/firebasejs/12.5.0/';state.sdk=await import(base+'firebase-firestore.js');
 const {onAuthStateChanged}=await import(base+'firebase-auth.js');
 onAuthStateChanged(ctx.auth,user=>{
  if(!user){resetOnline();state.mode='auth';renderVisible();return}
  state.user=user;state.mode='online';state.openJoin=new URL(location.href).searchParams.get('join')||null;
  if(window.__ocProfileReady){loadMemberships(user)}
  else{window.addEventListener('oc:profile-ready',()=>{if(state.user?.uid===user.uid)loadMemberships(user)},{once:true})}
  renderVisible();
 });
 }catch(e){console.error(e);state.mode='error';note('Error al cargar Firebase en el módulo avanzado');}
}
window.addEventListener('oc:firebase-ready',e=>bootFirebase(e.detail));
if(window.__ocFirebaseContext)bootFirebase(window.__ocFirebaseContext);
if(state.mode==='demo'&&state.clubId)chooseClub(state.clubId);else renderVisible();
// Show invitation acceptance near user clubs. Link is tied to the invited email.
const oldRenderClubs=renderClubs;
renderClubs=function(){let html=oldRenderClubs();if(state.openJoin){const box=`<div class="oc5-note"><strong>Invitación a un club recibida</strong><p>La invitación debe coincidir con tu correo Google actual. Confirma para vincular tu cuenta.</p>${button('Aceptar invitación','acceptJoin')}</div>`;html=html.replace('<div class="oc5-kpis">',box+'<div class="oc5-kpis">');if(!html.includes('oc5-kpis'))html+=box;}return html;};
// Access to catalog from the classic UI; no 3rd-party AI service receives private information.
window.ocProLegacy=window.ocProLegacy||{getExercises:()=>[]};
