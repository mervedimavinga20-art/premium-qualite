/* ---- cloud (Supabase) : comptes, synchro, rôles, journal ---- */
const SB_URL='https://rizfkydkxjxlicyrfyvy.supabase.co',SB_KEY='sb_publishable_eaAGJ39GCfOf39NtIr3JRg_UJ_AB38X';
const LOCALK=['pin','pinLen','lang','langDone','lastExport'];
const isMgr=()=>!!CL.shop&&(CL.role==='manager'||CL.role==='seller');
const isSeller=()=>!!CL.shop&&CL.role==='seller';
const roleLbl=r=>t(r==='owner'?'cRoleO':r==='seller'?'cRoleS':'cRoleM');
const SELL_OK=['pos','sheet','settings'];
function loadCL(){try{const r=localStorage.getItem('pq-cloud');if(r)Object.assign(CL,JSON.parse(r))}catch(e){}try{jq=JSON.parse(localStorage.getItem('pq-jq')||'[]')}catch(e){}}
function saveCL(){try{localStorage.setItem('pq-cloud',JSON.stringify(CL));localStorage.setItem('pq-jq',JSON.stringify(jq.slice(-500)))}catch(e){}}
function pack(){const set=Object.assign({},state.set);LOCALK.forEach(k=>delete set[k]);return JSON.parse(JSON.stringify({brand:state.brand,set,books:state.books,resellers:state.resellers,moves:state.moves,pays:state.pays,clients:state.clients,cbl:state.cbl}))}
function flat(d){const c={books:{},rows:{},resellers:{},moves:{},pays:{},clients:{},cbl:{},kv:{}};(d.books||[]).forEach(b=>{const x=Object.assign({},b);delete x.rows;c.books[b.id]=JSON.stringify(x);(b.rows||[]).forEach(r=>c.rows[r.id]=JSON.stringify(Object.assign({},r,{bid:b.id})))});['resellers','moves','pays','clients','cbl'].forEach(k=>(d[k]||[]).forEach(x=>c[k][x.id]=JSON.stringify(x)));['brand','set'].forEach(g=>Object.keys(d[g]||{}).forEach(k=>c.kv[g+'.'+k]=JSON.stringify(d[g][k])));return c}
function m3(b,l,r){const o={};new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)]).forEach(id=>{const v=l[id]===b[id]?r[id]:l[id];if(v!==undefined)o[id]=v});return o}
function sameMap(a,b){const k=Object.keys(a);return k.length===Object.keys(b).length&&k.every(x=>a[x]===b[x])}
function sameFlat(a,b){return Object.keys(a).every(c=>sameMap(a[c],b[c]))}
function mergeDocs(base,loc,rem){const B=flat(base),L=flat(loc),R=flat(rem),M={};Object.keys(B).forEach(c=>M[c]=m3(B[c],L[c],R[c]));
 const ord=(key)=>{const seen=[];[rem,loc].forEach(d=>(d[key]||[]).forEach(x=>{if(!seen.includes(x.id))seen.push(x.id)}));return seen};
 const doc={brand:{},set:{},books:[],resellers:[],moves:[],pays:[],clients:[],cbl:[]};
 Object.keys(M.kv).forEach(k=>{const i=k.indexOf('.');doc[k.slice(0,i)][k.slice(i+1)]=JSON.parse(M.kv[k])});
 ord('books').forEach(id=>{if(M.books[id])doc.books.push(Object.assign(JSON.parse(M.books[id]),{rows:[]}))});
 const rowIds=[];[rem,loc].forEach(d=>(d.books||[]).forEach(b=>(b.rows||[]).forEach(r=>{if(!rowIds.includes(r.id))rowIds.push(r.id)})));
 rowIds.forEach(id=>{if(!M.rows[id])return;const r=JSON.parse(M.rows[id]),b=doc.books.find(x=>x.id===r.bid);if(b){delete r.bid;b.rows.push(r)}});
 ['resellers','moves','pays','clients','cbl'].forEach(k=>ord(k).forEach(id=>{if(M[k][id])doc[k].push(JSON.parse(M[k][id]))}));return doc}
const clone=o=>JSON.parse(JSON.stringify(o));
function setDoc(d){d=clone(d);restoring=true;const keep={};LOCALK.forEach(k=>keep[k]=state.set[k]);const cur0=state.cur;state.brand=Object.assign({},d.brand);state.set=Object.assign({},d.set,keep);state.books=d.books;state.resellers=d.resellers;state.moves=d.moves;state.pays=d.pays;state.clients=d.clients||[];state.cbl=d.cbl||[];state.cur=cur0;fixup(state);last=snap();flush();restoring=false}
const typing=()=>{const a=document.activeElement;return a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)&&!a.closest('#dlg,#lock')&&a.closest('#app')};
const hasLocalData=()=>state.books.some(b=>b.rows.length)||state.resellers.length||state.moves.length||state.pays.length;
function scheduleSync(ms){if(!sb||!CL.shop||!cloudUser)return;clearTimeout(syncT);syncT=setTimeout(sync,ms||0)}
async function sync(){if(!sb||!CL.shop||!cloudUser)return;if(syncing){syncAgain=true;return}syncing=true;cstat='sync';updCloudUI();
 try{for(let n=0;n<3;n++){const r0=await sb.from('shops').select('data,rev').eq('id',CL.shop).single();if(r0.error)throw r0.error;const rem=r0.data.data&&r0.data.data.books?r0.data.data:null,loc=pack();
   const merged=rem?mergeDocs(CL.base||rem,loc,rem):loc;
   if(!rem||!sameFlat(flat(merged),flat(rem))){const u=await sb.from('shops').update({data:merged,rev:r0.data.rev+1,updated_at:new Date().toISOString()}).eq('id',CL.shop).eq('rev',r0.data.rev).select('rev');if(u.error)throw u.error;if(!u.data||!u.data.length)continue;CL.rev=r0.data.rev+1}else CL.rev=r0.data.rev;
   if(!sameFlat(flat(pack()),flat(merged))){if(typing()){syncAgain=true;break}if(!sameFlat(flat(pack()),flat(loc))){syncAgain=true;break}setDoc(merged);CL.base=clone(merged);saveCL();renderAll()}else{CL.base=clone(merged);saveCL()}
   cstat='ok';break}}
 catch(e){cstat='err';if(e&&/limite_gratuite/.test(e.message||''))toast(t('limitMsg'))}finally{syncing=false;updCloudUI();if(syncAgain){syncAgain=false;syncT=setTimeout(sync,1500)}}flushJ()}
/* journal */
function log(a,d){if(!CL.shop)return;jq.push({a,d:String(d||'').slice(0,300)});saveCL();clearTimeout(jT);jT=setTimeout(flushJ,800)}
async function flushJ(){if(!sb||!cloudUser||!CL.shop||!jq.length)return;const b=jq.slice(0,50);try{const r=await sb.from('journal').insert(b.map(x=>({shop_id:CL.shop,email:cloudUser.email,role:CL.role,action:x.a,detail:x.d})));if(!r.error){jq=jq.slice(b.length);saveCL();if(jq.length)flushJ()}}catch(e){}}
async function loadJournal(){const body=$('#jBody');$('#jHead').innerHTML=['jWhen','jWho','jWhat','jDetail'].map(k=>'<th>'+esc(t(k))+'</th>').join('');
 if(!sb||!CL.shop){body.innerHTML='<tr><td colspan="4" class="empty">'+esc(t('jEmpty'))+'</td></tr>';return}await flushJ();
 const r=await sb.from('journal').select('at,email,role,action,detail').eq('shop_id',CL.shop).order('at',{ascending:false}).limit(300);const rows=(r.data||[]);const f=$('#jFilter'),fv=f.value;f.innerHTML='<option value="">'+esc(t('jAll'))+'</option>';[...new Set(rows.map(x=>x.email))].forEach(e=>f.append(h('option',{value:e,text:e})));f.value=fv;
 const sh=rows.filter(x=>!f.value||x.email===f.value);body.innerHTML=sh.length?sh.map(x=>'<tr><td>'+esc(new Date(x.at).toLocaleString(LOC()))+'</td><td>'+esc(x.email)+' <span class="mu">('+esc(roleLbl(x.role))+')</span></td><td>'+esc(D['ja_'+x.action]?t('ja_'+x.action):x.action)+'</td><td style="white-space:normal;min-width:180px">'+esc(x.detail||'')+'</td></tr>').join(''):'<tr><td colspan="4" class="empty">'+esc(t('jEmpty'))+'</td></tr>'}
/* comptes */
function loadSB(){return new Promise((res,rej)=>{if(window.supabase)return res();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';s.onload=res;s.onerror=()=>rej('offline');document.head.append(s)})}
async function cloudInit(){try{await loadSB()}catch(e){cstat='err';updCloudUI();return}
 sb=window.supabase.createClient(SB_URL,SB_KEY);const s=await sb.auth.getSession();cloudUser=s.data&&s.data.session?s.data.session.user:null;
 sb.auth.onAuthStateChange((ev,ss)=>{cloudUser=ss?ss.user:null});if(cloudUser)await attach();updCloudUI()}
function subscribe(){try{if(chan)sb.removeChannel(chan);chan=sb.channel('shop-'+CL.shop).on('postgres_changes',{event:'UPDATE',schema:'public',table:'shops',filter:'id=eq.'+CL.shop},()=>scheduleSync(300)).subscribe()}catch(e){}}
function applyRole(){document.body.classList.toggle('role-manager',isMgr());document.body.classList.toggle('role-seller',isSeller());if(isSeller()&&!SELL_OK.includes(state.view))showView('pos')}
async function attach(){const r=await sb.from('members').select('shop_id,role,email').eq('user_id',cloudUser.id);if(r.error){cstat='err';return}
 const m=r.data&&r.data[0];if(!m){CL.shop='';CL.role='';CL.email=cloudUser.email;saveCL();applyRole();cstat='noshop';return}
 if(CL.shop!==m.shop_id){const sh=await sb.from('shops').select('data,rev').eq('id',m.shop_id).single();if(sh.error){cstat='err';return}
  const has=sh.data.data&&sh.data.data.books;if(has&&hasLocalData()&&!await ask(t('cfJoin'),{danger:1})){await ACT.cOut();return}
  CL={shop:m.shop_id,rev:sh.data.rev,base:has?clone(sh.data.data):null,role:m.role,email:cloudUser.email};if(has){setDoc(sh.data.data)}saveCL();renderAll()}
 CL.role=m.role;CL.email=cloudUser.email;saveCL();applyRole();subscribe();log('login',CL.email);await sync();loadPlan()}
async function loadTeam(){const e=$('#team');if(!CL.shop||!sb){e.textContent='';return}const r=await sb.from('members').select('email,role').eq('shop_id',CL.shop);e.textContent=(r.data||[]).map(x=>x.email+' ('+roleLbl(x.role)+')').join('  ·  ')}
function updCloudUI(){if(!$('#accSt'))return;const on=!!(sb&&cloudUser),sh=!!CL.shop;const st=cstat==='sync'?t('cSyncing'):cstat==='ok'?t('cSyncOk'):cstat==='err'?t('cSyncErr'):'';
 $('#accOut').style.display=on?'none':'';$('#accIn').style.display=on?'':'none';$('#bCreate').style.display=on&&!sh&&cstat!=='err'?'':'none';$('#ownTeam').style.display=on&&sh&&CL.role==='owner'?'':'none';
 $('#planLine').textContent=sh?planText():'';$('#accSt').textContent=!on?(CL.email&&CL.shop?t('cOn',{e:CL.email,r:roleLbl(CL.role),s:t('cSyncErr')}):t('cOff')):sh?t('cOn',{e:CL.email,r:roleLbl(CL.role),s:st}):t('cNoShop');
 const c=$('#bCloud');c.className='ib '+(!on&&!sh?'off':cstat==='err'?'err':'ok');$('#cloudBanner').style.display=sh?'none':'';$('#homeJ').style.display=sh?'':'none';applyRole();if(on&&sh)loadTeam()}
const authErr=e=>toast(t('cErr',{e:(e&&e.message)||String(e)}));
async function needSB(){if(!sb)await cloudInit();if(!sb){toast(t('cOffl'));return false}return true}
async function cAuth(kind){const em=$('#aMail').value.trim(),pw=$('#aPass').value;if(!em||pw.length<6){toast(t('tAuthNeed'));return}if(!await needSB())return;
 try{const r=kind==='up'?await sb.auth.signUp({email:em,password:pw}):await sb.auth.signInWithPassword({email:em,password:pw});if(r.error)throw r.error;if(!r.data.session&&kind==='up'){const r2=await sb.auth.signInWithPassword({email:em,password:pw});if(r2.error)throw r2.error;cloudUser=r2.data.user}else cloudUser=r.data.user;$('#aPass').value='';await attach();updCloudUI()}catch(e){authErr(e)}}
