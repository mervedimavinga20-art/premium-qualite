const KEY='premium-qualite-v1',KEYS=[KEY];
const LANGS=[['fr','Français','fr-FR'],['en','English','en-US'],['es','Español','es-ES'],['pt','Português','pt-PT']];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:0};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayS=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const dayDiff=(a,b)=>Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/864e5);
function h(tag,p,kids){const e=document.createElement(tag);for(const k in(p||{})){const v=p[k];if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k==='data')for(const d in v)e.dataset[d]=v[d];else if(k==='style')e.style.cssText=v;else if(k==='aria')for(const a in v)e.setAttribute('aria-'+a,v[a]);else if(k==='attr')for(const a in v)e.setAttribute(a,v[a]);else e[k]=v}(kids||[]).forEach(c=>c!=null&&e.append(c.nodeType?c:document.createTextNode(c)));return e}
/* ---- i18n ---- */
let LANG='fr';
const LI=()=>Math.max(0,LANGS.findIndex(l=>l[0]===LANG));
const LOC=()=>LANGS[LI()][2];
function t(k,p){const a=D[k];let s=a?(a[LI()]||a[0]):k;if(p)for(const x in p)s=s.split('{'+x+'}').join(p[x]);return s}
function applyI18n(){document.documentElement.lang=LANG;$$('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));$$('[data-ph]').forEach(e=>e.placeholder=t(e.dataset.ph));$$('[data-ti]').forEach(e=>{e.title=t(e.dataset.ti);e.setAttribute('aria-label',t(e.dataset.ti))});$('#bLang').textContent=LANG.toUpperCase()}
/* ---- state ---- */
const DEF=()=>({v:3,brand:{name:'PREMIUM QUALITÉ',slogan:'Gérez. Vendez. Encaissez.',signature:'Propulsé par PREMIUM QUALITÉ',logo:'',city:'',email:'',phone:'',addr:''},set:{owner:'',units:['Pc','kg','L','Carton'],cats:['Mode','Alimentation','Cosmétiques','Quincaillerie'],manager:'',monnaie:'$',taux:2800,lowStock:5,lateDays:14,salaryPct:20,loyaltyPct:2,basis:'prevu',pin:'',lang:'fr',langDone:false,pinLen:4},books:[{id:'b1',label:'Fiche 1',rows:[]}],cur:'b1',resellers:[],moves:[],pays:[],clients:[],cbl:[],view:'home'});
let state=DEF(),noFlush=false;
function fixup(s){const d=DEF();s.brand=Object.assign(d.brand,s.brand||{});s.set=Object.assign(d.set,s.set||{});s.v=3;
 if(!Array.isArray(s.books)||!s.books.length)s.books=d.books;
 s.books.forEach(b=>{b.id=b.id||uid();b.label=b.label||'Fiche';b.rows=(b.rows||[]).map(r=>{r.id=r.id||uid();if(r.cost==null){r.cost=Math.max(0,num(r.price)-num(r.gain||0));delete r.gain}r.exp=num(r.exp);r.cost=num(r.cost);r.qty=num(r.qty);r.price=num(r.price);r.desc=r.desc||'';r.uom=r.uom||'Pc';r.cat=r.cat||'';r.code=r.code||'';r.date=r.date||'';r.rem=r.rem||'';return r})});
 if(!s.books.some(b=>b.id===s.cur))s.cur=s.books[0].id;
 s.resellers=(s.resellers||[]).map(r=>Object.assign({id:uid(),name:'',phone:'',zone:'',blocked:false},r));
 s.moves=(s.moves||[]).map(m=>{m.id=m.id||uid();m.given=num(m.given);m.ret=num(m.ret);m.sold=num(m.sold);m.price=num(m.price);m.item=m.item||'';if(m.aid==null){const r=s.books.flatMap(b=>b.rows).find(r=>r.desc&&r.desc.toLowerCase()===m.item.toLowerCase());m.aid=r?r.id:''}return m});
 s.pays=s.pays||[];s.clients=(s.clients||[]).map(c=>Object.assign({id:uid(),name:'',phone:''},c));s.cbl=s.cbl||[];if(!s.view||s.view==='calc')s.view='home';return s}
function migrate(raw,key){let s=JSON.parse(raw);if(key==='stock-vetements-v1'||s.info){const i=s.info||{};const n={set:{monnaie:i.monnaie||'$',taux:i.taux||2800,manager:i.manager||''},books:[{id:'b1',label:i.mois||'Fiche 1',rows:s.rows||[]}],cur:'b1',resellers:s.resellers||[],moves:[],pays:[]};(s.suivi||[]).forEach(m=>{n.moves.push({id:m.id,date:m.date,rid:m.rid,item:m.item,given:m.given,ret:0,sold:m.sold,price:m.price});if(num(m.paid)>0)n.pays.push({id:uid(),date:m.date,rid:m.rid,amount:num(m.paid),note:''})});s=n}return fixup(s)}
function load(){for(const k of KEYS){try{const r=localStorage.getItem(k);if(r){state=migrate(r,k);return}}catch(e){}}state=fixup(DEF())}
let svT=0;
let sb=null,CL={shop:'',rev:0,base:null,role:'',email:''},cloudUser=null,syncing=false,syncAgain=false,syncT=0,jq=[],jT=0,chan=null,cstat='off';
function save(){touch();scheduleSync(1500);clearTimeout(svT);svT=setTimeout(flush,300)}
function flush(){if(noFlush)return;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
addEventListener('pagehide',flush);
/* ---- undo / redo ---- */
const snap=()=>JSON.stringify({books:state.books,cur:state.cur,resellers:state.resellers,moves:state.moves,pays:state.pays,clients:state.clients,cbl:state.cbl});
let last='',lastT=0,UND=[],RED=[],restoring=false;
function touch(){if(restoring)return;const s=snap();if(s===last)return;const n=Date.now();if(n-lastT>700){UND.push(last);if(UND.length>100)UND.shift()}lastT=n;last=s;RED=[];updUR()}
function updUR(){$('#bUndo').disabled=!UND.length;$('#bRedo').disabled=!RED.length}
function restore(s){restoring=true;Object.assign(state,JSON.parse(s));lastT=0;last=s;flush();renderAll();restoring=false;updUR()}
function undo(){if(!UND.length)return;RED.push(last);restore(UND.pop());toast(t('tUndo'))}
function redo(){if(!RED.length)return;UND.push(last);restore(RED.pop());toast(t('tRedo'))}
/* ---- ui helpers ---- */
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}}
try{if(JSON.parse(localStorage.getItem('pq-cloud')||'{}').shop){document.body.classList.add('booting');setTimeout(()=>document.body.classList.remove('booting'),5000)}}catch(e){}
let toT=0;function toast(m){const e=$('#toast');e.textContent=m;e.style.display='block';clearTimeout(toT);toT=setTimeout(()=>e.style.display='none',2200)}
function ask(msg,o){o=o||{};return new Promise(res=>{const ov=$('#dlg'),inp=$('#dlgIn');$('#dlgMsg').textContent=msg;inp.style.display=o.input?'block':'none';inp.value=o.def||'';$('#dlgYes').textContent=o.yes||t(o.input?'ok':'yes');$('#dlgNo').textContent=o.no||t(o.input?'cancel':'no');$('#dlgYes').className='btn'+(o.danger?' r':'');ov.classList.add('on');setTimeout(()=>(o.input?inp:$('#dlgNo')).focus(),30);const fin=v=>{ov.classList.remove('on');$('#dlgYes').onclick=$('#dlgNo').onclick=null;ov.onkeydown=null;res(v)};$('#dlgYes').onclick=()=>fin(o.input?inp.value:true);$('#dlgNo').onclick=()=>fin(o.input?null:false);ov.onkeydown=e=>{if(e.key==='Escape')fin(o.input?null:false);if(e.key==='Enter'&&o.input)fin(inp.value)}})}
const cur=()=>state.books.find(b=>b.id===state.cur)||state.books[0];
const money=n=>{n=Math.round(n*100)/100;const s=n.toLocaleString(LOC(),{maximumFractionDigits:2});return state.set.monnaie==='$'?'$'+s:s+' FC'};
const nf=n=>(Math.round(n*100)/100).toLocaleString(LOC(),{maximumFractionDigits:2});
const fdate=s=>s?new Date(s+'T00:00:00').toLocaleDateString(LOC()):'';
const compact=n=>{const a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e3?(n/1e3).toFixed(a>=1e4?0:1)+'k':String(Math.round(n))};
/* ---- accounting ---- */
const rowOut=r=>state.moves.reduce((s,m)=>m.aid===r.id?s+m.given-m.ret:s,0);
const rowStock=r=>r.qty-rowOut(r);
function acct(b){b=b||cur();let T=0,A=0,E=0,R=0;b.rows.forEach(r=>{T+=r.qty*r.price;A+=r.qty*r.cost;E+=r.exp;const uc=r.qty>0?r.cost+r.exp/r.qty:r.cost;state.moves.forEach(m=>{if(m.aid===r.id)R+=m.sold*(m.price-uc)})});
 const C=A+E,B=T-C,base=state.set.basis==='realise'?R:B,pp=Math.min(100,Math.max(0,state.set.salaryPct)),sal=Math.max(0,base)*pp/100,inv=Math.max(0,base)-sal;return{T,A,E,C,B,R,base,pp,sal,inv}}
function agg(rid){let g=0,rt=0,s=0,due=0,paid=0,first='',lastP='';state.moves.forEach(m=>{if(m.rid===rid){g+=m.given;rt+=m.ret;s+=m.sold;due+=m.sold*m.price;if(m.date&&(!first||m.date<first))first=m.date}});state.pays.forEach(p=>{if(p.rid===rid){paid+=num(p.amount);if(p.date&&p.date>lastP)lastP=p.date}});
 const rest=due-paid,ref=lastP||first,late=rest>0&&ref&&dayDiff(ref,todayS())>state.set.lateDays;const r=state.resellers.find(x=>x.id===rid)||{};
 const st=r.blocked?'bloque':rest<=0?'ok':late?'retard':'cours';return{g,rt,s,due,paid,rest,left:g-rt-s,st}}
const stLabel={ok:'stOk',cours:'stCours',retard:'stLate',bloque:'stBlock'};
/* ---- market series ---- */
let GRAN='d';
function bucketKey(d){if(GRAN==='d')return d;if(GRAN==='m')return d.slice(0,7);const x=new Date(d+'T00:00:00Z');const w=(x.getUTCDay()+6)%7;x.setUTCDate(x.getUTCDate()-w);return x.toISOString().slice(0,10)}
function nextKey(k){if(GRAN==='d')return addDays(k,1);if(GRAN==='w')return addDays(k,7);const[y,m]=k.split('-').map(Number);return m===12?(y+1)+'-01':y+'-'+String(m+1).padStart(2,'0')}
function series(rid,gran){const old=GRAN;GRAN=gran||GRAN;const N=GRAN==='d'?14:12;const map={};state.moves.forEach(m=>{if(m.date&&(!rid||m.rid===rid)){const k=bucketKey(m.date);map[k]=(map[k]||0)+m.sold*m.price}});let end=bucketKey(todayS());const keys=[];let k=end;for(let i=0;i<N;i++){keys.unshift(k);k=GRAN==='d'?addDays(k,-1):GRAN==='w'?addDays(k,-7):(()=>{const[y,m]=k.split('-').map(Number);return m===1?(y-1)+'-12':y+'-'+String(m-1).padStart(2,'0')})()}
 const out=keys.map(k=>({k,v:map[k]||0}));GRAN=old;return out}
function delta(vals){const n=vals.length,w=Math.max(1,Math.floor(n/3));const sm=(x,y)=>vals.slice(x,y).reduce((s,v)=>s+v,0);const a=sm(n-2*w,n-w),b=sm(n-w,n);if(a===0)return b>0?100:0;return(b-a)/a*100}
const dChip=d=>'<span class="chip '+(d<0?'dn':'')+'">'+(d<0?'▼ ':'▲ ')+(d>=0?'+':'')+Math.round(d)+'%</span>';
function spark(vals){const W=84,H=28,mx=Math.max(1,...vals);const p=vals.map((v,i)=>[2+(W-4)*(vals.length>1?i/(vals.length-1):.5),H-3-(H-6)*v/mx]);const up=delta(vals)>=0;return'<svg viewBox="0 0 '+W+' '+H+'"><polyline fill="none" stroke-width="2" style="stroke:var(--'+(up?'up':'dn')+')" points="'+p.map(a=>a[0].toFixed(1)+','+a[1].toFixed(1)).join(' ')+'"/></svg>'}
function marketChart(box,d){const W=360,H=190,pl=8,pr=56,pt=14,pb=22;const vs=d.map(x=>x.v),mx=Math.max(1,...vs);const X=i=>pl+(W-pl-pr)*(d.length>1?i/(d.length-1):.5),Y=v=>pt+(H-pt-pb)*(1-v/mx);
 const up=delta(vs)>=0,col=up?'var(--up)':'var(--dn)';let s='<svg viewBox="0 0 '+W+' '+H+'" role="img"><defs><linearGradient id="ag'+(box.id||'')+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+col+'" stop-opacity=".35"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></linearGradient></defs>';
 for(let i=0;i<=3;i++){const y=pt+(H-pt-pb)*i/3;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="#272c26" stroke-width="1"/><text x="'+(W-pr+5)+'" y="'+(y+3)+'" fill="#8f968d" font-size="9">'+compact(mx*(1-i/3))+'</text>'}
 const pts=d.map((x,i)=>[X(i),Y(x.v)]);s+='<polygon fill="url(#ag'+(box.id||'')+')" points="'+pts.map(p=>p.join(',')).join(' ')+' '+X(d.length-1)+','+(H-pb)+' '+X(0)+','+(H-pb)+'"/>';
 for(let i=1;i<pts.length;i++){const u=vs[i]>=vs[i-1];s+='<line x1="'+pts[i-1][0].toFixed(1)+'" y1="'+pts[i-1][1].toFixed(1)+'" x2="'+pts[i][0].toFixed(1)+'" y2="'+pts[i][1].toFixed(1)+'" stroke-width="2.4" stroke-linecap="round" style="stroke:var(--'+(u?'up':'dn')+')"/>'}
 const L=pts[pts.length-1];s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+L[1]+'" y2="'+L[1]+'" stroke="'+col+'" stroke-dasharray="3 3" opacity=".6"/><rect x="'+(W-pr+1)+'" y="'+(L[1]-8)+'" width="'+(pr-3)+'" height="16" fill="'+col+'"/><text x="'+(W-pr+4)+'" y="'+(L[1]+4)+'" fill="#000" font-size="10" font-weight="800">'+compact(vs[vs.length-1])+'</text>';
 s+='<circle cx="'+L[0]+'" cy="'+L[1]+'" r="3.5" fill="'+col+'"/><circle class="pulse" cx="'+L[0]+'" cy="'+L[1]+'" r="3.5" fill="'+col+'"/>';
 [0,Math.floor((d.length-1)/2),d.length-1].forEach((i,j)=>{s+='<text x="'+X(i)+'" y="'+(H-6)+'" fill="#8f968d" font-size="9" text-anchor="'+(j===0?'start':j===2?'end':'middle')+'">'+esc(lab(d[i].k))+'</text>'});
 s+='<line id="cx" y1="'+pt+'" y2="'+(H-pb)+'" stroke="#8f968d" style="display:none"/></svg><div class="tip"></div>';box.innerHTML=s;
 const svg=box.querySelector('svg'),tip=box.querySelector('.tip'),cx=box.querySelector('#cx');
 function mv(e){const r=svg.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*W;let bi=0,bd=1e9;pts.forEach((p,i)=>{const dd=Math.abs(p[0]-x);if(dd<bd){bd=dd;bi=i}});cx.setAttribute('x1',pts[bi][0]);cx.setAttribute('x2',pts[bi][0]);cx.style.display='';tip.style.display='block';tip.innerHTML='<b>'+esc(lab(d[bi].k))+'</b><br>'+money(d[bi].v);tip.style.left=Math.min(r.width-110,Math.max(0,pts[bi][0]/W*r.width-40))+'px';tip.style.top='0px'}
 svg.addEventListener('pointermove',mv);svg.addEventListener('pointerdown',mv);svg.addEventListener('pointerleave',()=>{cx.style.display='none';tip.style.display='none'})}
function lab(k){if(k.length===7)return new Date(k+'-01T00:00:00').toLocaleDateString(LOC(),{month:'short',year:'2-digit'});return new Date(k+'T00:00:00').toLocaleDateString(LOC(),{day:'2-digit',month:'short'})}
