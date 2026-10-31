/* ---- documents ---- */
function showDoc(title,body){const b=state.brand;$('#doc').innerHTML='<div class="doc-page"><div class="dhd"><div style="display:flex;gap:10px;align-items:center">'+(b.logo?'<img class="dlogo" src="'+esc(b.logo)+'" style="width:48px;height:48px;object-fit:cover" alt="">':'')+'<div><div style="font-family:var(--f);font-weight:900;font-size:1.5rem;text-transform:uppercase">'+esc(b.name)+'</div><div>'+esc(b.city)+'</div><div style="font-size:.75rem">'+esc([b.addr,b.phone,b.email].filter(Boolean).join(' · '))+'</div></div></div><div style="text-align:right"><b>'+esc(title)+'</b><br>'+esc(fdate(todayS()))+'</div></div>'+body+'<p style="margin-top:22px;text-align:center;border-top:1px solid #000;padding-top:8px">« '+esc(b.slogan)+' » — <b>'+esc(b.signature)+'</b></p></div>';document.body.classList.add('print-doc');$('#docWrap').style.display='block';scrollTo(0,0)}
function closeDoc(){document.body.classList.remove('print-doc');$('#docWrap').style.display='none'}
const dk=a=>'<div class="dk">'+a.map(x=>'<div>'+esc(x[0])+'<b>'+esc(x[1])+'</b></div>').join('')+'</div>';
const dt=(hd,rows)=>'<div class="dtw"><table class="dt"><thead><tr>'+hd.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function reportDoc(){const a=acct(),bk=cur();let sales=0,paid=0;state.moves.forEach(m=>{sales+=m.sold*m.price;if(m.rid==='shop'&&!m.credit)paid+=m.sold*m.price});state.pays.forEach(p=>paid+=num(p.amount));
 showDoc(t('dRep')+' — '+bk.label,dk([[t('aTotal'),money(a.T)],[t('aCost'),money(a.C)],[t('aProfit'),money(a.B)],[t('aSal',{p:a.pp}),money(a.sal)],[t('aInv',{p:100-a.pp}),money(a.inv)],[t('kPaid'),money(paid)]])+'<h3>'+esc(t('tSheet'))+'</h3>'+dt([t('cDesc'),t('cQty'),t('cPrice'),t('cCost'),t('cProfit'),t('cStock')],bk.rows.map(r=>[r.desc,nf(r.qty),nf(r.price),nf(r.cost),nf(r.qty*r.price-r.qty*r.cost-r.exp),nf(rowStock(r))]))+'<h3 style="margin-top:14px">'+esc(t('tRes'))+'</h3>'+dt([t('reseller'),t('cSold'),t('cDue'),t('cPaid'),t('cRest'),t('cStatus')],state.resellers.map(r=>{const g=agg(r.id);return[r.name,nf(g.s),money(g.due),money(g.paid),money(g.rest),t(stLabel[g.st])]})))}
function statementDoc(id){const r=state.resellers.find(x=>x.id===id),a=agg(id);const ms=state.moves.filter(m=>m.rid===id).sort((x,y)=>(x.date||'').localeCompare(y.date||''));
 showDoc(t('dStmt')+' — '+r.name,dk([[t('cDue'),money(a.due)],[t('cPaid'),money(a.paid)],[t('cRest'),money(a.rest)]])+dt([t('date'),t('cItem'),t('cGiven'),t('cRet'),t('cSold'),t('cValue')],ms.map(m=>[fdate(m.date),m.item,nf(m.given),nf(m.ret),nf(m.sold),money(m.sold*m.price)]))+'<h3 style="margin-top:14px">'+esc(t('pays'))+'</h3>'+dt([t('date'),t('amount'),t('note')],state.pays.filter(p=>p.rid===id).map(p=>[fdate(p.date),money(num(p.amount)),p.note||''])))}
function bonDoc(id){const m=state.moves.find(x=>x.id===id),r=state.resellers.find(x=>x.id===m.rid)||{name:m.rid==='shop'?t('shopL'):'?'};showDoc(t('dBon'),dk([[t('reseller'),r.name],[t('date'),fdate(m.date)],[t('cItem'),m.item]])+dt([t('cItem'),t('cGiven'),t('cRet'),t('cSold'),t('cPrice')],[[m.item,nf(m.given),nf(m.ret),nf(m.sold),money(m.price)]])+'<p style="margin-top:30px">'+esc(t('reseller'))+' : ____________ &nbsp;&nbsp; '+esc(state.set.owner)+' : ____________</p>')}
const waNum=p=>{let d=String(p||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.startsWith('0'))d='243'+d.slice(1);else if(d.length===9)d='243'+d;return d};
function waOpen(id){const r=state.resellers.find(x=>x.id===id),a=agg(id);const msg=t('waHi',{n:r.name,b:state.brand.name,g:nf(a.g-a.rt),s:nf(a.s),p:money(a.paid),r:money(a.rest)});window.open('https://wa.me/'+waNum(r.phone)+'?text='+encodeURIComponent(msg),'_blank')}
/* ---- PIN ---- */
function hsh(s){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
const hp=p=>hsh('kb-pin:'+p);
let pinBuf='',fails=0,lockUntil=0;
const PL=()=>state.set.pinLen||4;
function showLock(){if(!state.set.pin)return;pinBuf='';$('#dots').innerHTML='<i></i>'.repeat(PL());$('#lkName').textContent=state.brand.name;$('#lkMsg').textContent=t('lkEnter');drawDots();$('#lock').classList.add('on')}
function drawDots(){$$('#dots i').forEach((d,i)=>d.classList.toggle('f',i<pinBuf.length))}
function padKey(k){const now=Date.now();if(now<lockUntil){$('#lkMsg').textContent=t('lkWait',{s:Math.ceil((lockUntil-now)/1000)});return}
 if(k==='b')pinBuf=pinBuf.slice(0,-1);else if(pinBuf.length<PL())pinBuf+=k;drawDots();
 if(pinBuf.length===PL()){if(hp(pinBuf)===state.set.pin){fails=0;$('#lock').classList.remove('on');afterUnlock()}else{fails++;pinBuf='';drawDots();if(fails>=5){fails=0;lockUntil=Date.now()+15000;$('#lkMsg').textContent=t('lkWait',{s:15})}else $('#lkMsg').textContent=t('lkBad')}}}
function afterUnlock(){if(!state.set.langDone)langPick()}
function langPick(){const b=$('#langBtns');b.innerHTML='';LANGS.forEach(l=>b.append(h('button',{text:l[1],class:l[0]===LANG?'on':'',data:{act:'setLang',arg:l[0]}})));$('#langOv').classList.add('on')}
let hiddenAt=0;document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(state.set.pin&&hiddenAt&&Date.now()-hiddenAt>60000)showLock()});
/* ---- demo ---- */
function demo(){const rows=[['T-shirt coton',80,12,5,30],['Riz 25 kg',40,30,14,40],['Crème visage',12,22,10,15],['Clous (carton)',50,8,3,10],['Huile 5 L',30,45,22,25]].map((x,i)=>({id:'r'+(i+1),desc:x[0],uom:['Pc','kg','Pc','Carton','L'][i],cat:['Mode','Alimentation','Cosmétiques','Quincaillerie','Alimentation'][i],qty:x[1],date:addDays(todayS(),-40),price:x[2],cost:x[3],exp:x[4],rem:''}));
 const rs=[{id:'p1',name:'Patrick',phone:'0812345678',zone:'Gombe'},{id:'p2',name:'Grace',phone:'0998765432',zone:'Lemba'},{id:'p3',name:'Joël',phone:'0855512345',zone:'Matete'}].map(r=>Object.assign({blocked:false},r));
 const mv=[],P={p1:12,p2:22};const add=(d,rid,aid,item,g,s,pr)=>mv.push({id:uid(),date:addDays(todayS(),-d),rid,aid,item,given:g,ret:0,sold:s,price:pr});
 for(let k=0;k<20;k++){const sp=1+Math.floor(k/3),sj=Math.max(1,3-Math.floor(k/7));const d0=57-3*k;
  if(k%2===0)add(d0,'p1','r1','T-shirt coton',sp+1,sp,12);else{const s=Math.ceil(sp/2);add(d0,'p1','r2','Riz 25 kg',s+1,s,30)}
  if(k<10)add(Math.max(0,d0-1),'p2','r3','Crème visage',1,1,22);else add(Math.max(0,d0-1),'p2','r4','Clous (carton)',3,2,8);
  if(k%2===0)add(Math.max(0,d0-2),'p3','r5','Huile 5 L',sj,sj,45);else add(Math.max(0,d0-2),'p3','r1','T-shirt coton',sj+1,sj,12)}
 const due={};mv.forEach(m=>due[m.rid]=(due[m.rid]||0)+m.sold*m.price);
 const pays=[{id:uid(),date:addDays(todayS(),-3),rid:'p1',amount:Math.round(due.p1*.6),note:''},{id:uid(),date:addDays(todayS(),-2),rid:'p2',amount:due.p2,note:''},{id:uid(),date:addDays(todayS(),-22),rid:'p3',amount:Math.round(due.p3*.4),note:''}];
 state.books=[{id:'b1',label:'Fiche 1',rows}];state.cur='b1';state.resellers=rs;state.moves=mv;state.pays=pays;state.clients=[{id:'c1',name:'Marie K.',phone:'0811111111'},{id:'c2',name:'Jean M.',phone:'0822222222'}];state.cbl=[{id:uid(),cid:'c1',amount:1.5,date:addDays(todayS(),-5)}];state.moves.push({id:uid(),date:addDays(todayS(),-3),rid:'shop',aid:'r2',item:'Riz 25 kg',given:1,ret:0,sold:1,price:30,cid:'c2',credit:true})}
/* ---- actions ---- */
const ACT={
 go(a){closeDoc();showView(a)},undo,redo,langPick,
 setLang(a){LANG=a;state.set.lang=a;state.set.langDone=true;flush();$('#langOv').classList.remove('on');renderAll()},
 basis(a){state.set.basis=a;save();renderHome();renderSheet()},
 gran(a){GRAN=a;renderStats()},selRes(a){STRES=STRES===a?'':a;renderStats()},
 async newBook(){const n=await ask(t('pNewBook'),{input:1,def:'Fiche '+(state.books.length+1)});if(!n)return;const b={id:uid(),label:n,rows:cur().rows.map(r=>({id:uid(),desc:r.desc,cat:r.cat,uom:r.uom,qty:0,date:'',price:r.price,cost:r.cost,exp:0,rem:''}))};state.books.push(b);state.cur=b.id;save();renderSheet();renderHome()},
 async renBook(){const n=await ask(t('pRename'),{input:1,def:cur().label});if(!n)return;cur().label=n;save();renderSheet()},
 async delBook(){if(state.books.length<2)return;if(!await ask(t('cfDelBook'),{danger:1}))return;state.books=state.books.filter(b=>b.id!==state.cur);state.cur=state.books[0].id;save();renderSheet();renderHome()},
 addRow(){if(gated()&&state.books.reduce((n,b)=>n+b.rows.length,0)>=50){toast(t('limitMsg'));showView('premium');return}cur().rows.push({id:uid(),desc:'',cat:'',uom:state.set.units[0]||'Pc',qty:0,date:todayS(),price:0,cost:0,exp:0,rem:''});save();renderSheet()},
 async delRow(a,el){const id=el.dataset.id,linked=state.moves.some(m=>m.aid===id);if(!await ask(t(linked?'cfDelRowM':'cfDelRow'),{danger:1}))return;cur().rows=cur().rows.filter(r=>r.id!==id);state.moves.forEach(m=>{if(m.aid===id)m.aid=''});save();renderSheet()},
 addDirect(){const it=$('#dItem').value.trim(),q=num($('#dQty').value);if(!it||q<=0){toast(t('tNeedD'));return}const r=cur().rows.find(r=>r.desc&&r.desc.toLowerCase()===it.toLowerCase());const pr=num($('#dPrice').value)||(r?r.price:0);state.moves.unshift({id:uid(),date:$('#dDate').value||todayS(),rid:'shop',aid:r?r.id:'',item:it,given:q,ret:0,sold:q,price:pr});['#dItem','#dQty','#dPrice'].forEach(s=>$(s).value='');save();renderSuivi();toast(t('tOk'))},
 addReseller(){const n=$('#rName').value.trim();if(!n){toast(t('tNeed'));return}state.resellers.push({id:uid(),name:n,phone:$('#rPhone').value.trim(),zone:$('#rZone').value.trim(),blocked:false});['#rName','#rPhone','#rZone'].forEach(s=>$(s).value='');save();renderResellers()},
 resEdit(a,el){editRid=el.dataset.id;renderResellers()},resDone(){editRid='';renderResellers()},
 resBlock(a,el){const r=state.resellers.find(x=>x.id===el.dataset.id);r.blocked=!r.blocked;save();renderResellers()},
 async resDel(a,el){if(!await ask(t('cfDelRes'),{danger:1}))return;const id=el.dataset.id;state.resellers=state.resellers.filter(r=>r.id!==id);state.moves=state.moves.filter(m=>m.rid!==id);state.pays=state.pays.filter(p=>p.rid!==id);save();renderResellers()},
 resStatement(a,el){statementDoc(el.dataset.id)},resWA(a,el){waOpen(el.dataset.id)},
 addMove(){if(!state.resellers.length){toast(t('tNeedR'));return}state.moves.unshift({id:uid(),date:todayS(),rid:$('#fRes').value||state.resellers[0].id,aid:'',item:'',given:0,ret:0,sold:0,price:0});save();renderSuivi()},
 async delMove(a,el){if(!await ask(t('cfDelMove'),{danger:1}))return;state.moves=state.moves.filter(m=>m.id!==el.dataset.id);save();renderSuivi()},
 resetFilters(){$('#fText').value='';$('#fRes').value='';renderMoves()},
 addPay(){const am=num($('#pAmt').value),rid=$('#pRes').value;if(!rid||am<=0){toast(t('tNeed'));return}state.pays.push({id:uid(),date:$('#pDate').value||todayS(),rid,amount:am,note:$('#pNote').value.trim()});$('#pAmt').value='';$('#pNote').value='';save();renderSuivi()},
 async delPay(a,el){if(!await ask(t('cfDelPay'),{danger:1}))return;state.pays=state.pays.filter(p=>p.id!==el.dataset.id);save();renderSuivi()},
 bon(a,el){bonDoc(el.dataset.id)},reportDoc,docClose:closeDoc,docPrint(){print()},
 pinSave(){const v=$('#sPin').value;if(!/^\d{6}$/.test(v)){toast(t('tPin4'));return}state.set.pin=hp(v);state.set.pinLen=6;$('#sPin').value='';flush();toast(t('tPin'))},
 pinOff(){state.set.pin='';flush();toast(t('tOk'))},
 async forgot(){if(!await ask(t('cfForgot'),{danger:1}))return;noFlush=true;KEYS.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});location.reload()},
 exportData(){const b=new Blob([JSON.stringify(state,null,1)],{type:'application/json'}),a=h('a',{href:URL.createObjectURL(b),download:'premium-qualite-'+todayS()+'.json'});document.body.append(a);a.click();a.remove();state.set.lastExport=todayS()},
 async shareData(){const f=new File([JSON.stringify(state)],'premium-qualite-'+todayS()+'.json',{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]}))try{await navigator.share({files:[f],title:state.brand.name})}catch(e){}else ACT.exportData()},
 async demo(){if(!await ask(t('cfDemo'),{danger:1}))return;demo();save();renderAll()},
 async wipe(){if(!await ask(t('cfWipe'),{danger:1}))return;const d=DEF();state.books=d.books;state.cur='b1';state.resellers=[];state.moves=[];state.pays=[];state.clients=[];state.cbl=[];save();renderAll()},
 cLogin(){cAuth('in')},cSignup(){cAuth('up')},cSync(){scheduleSync(0)},
 async cOut(){try{if(sb)await sb.auth.signOut()}catch(e){}cloudUser=null;CL={shop:'',rev:0,base:null,role:'',email:''};jq=[];saveCL();cstat='off';applyRole();updCloudUI()},
 async cCreate(){if(!await needSB())return;try{const r=await sb.rpc('create_shop',{n:state.brand.name,d:pack()});if(r.error)throw r.error;CL={shop:r.data,rev:0,base:clone(pack()),role:'owner',email:cloudUser.email};saveCL();subscribe();cstat='ok';log('login',CL.email);toast(t('cMade'));PLN.plan='free';PLN.until=null;updCloudUI();loadPlan()}catch(e){authErr(e)}},
 async cAddMgr(){const m=$('#aMgr').value.trim();if(!m)return;if(gated()){toast(t('premOnly'));showView('premium');return}try{const r=await sb.rpc('add_manager',{s:CL.shop,mail:m,r:$('#aRole').value});if(r.error)throw r.error;toast(t(r.data==='ok'?'mgrOk':r.data==='inconnu'?'mgrUnknown':r.data==='premium'?'premOnly':'mgrDenied'));if(r.data==='ok'){$('#aMgr').value='';log('addMgr',m);loadTeam()}}catch(e){authErr(e)}},
 jReload(){loadJournal()},
 reload(){try{sessionStorage.setItem('pq-upd','1')}catch(e){}location.reload()},updClose(){$('#upd').style.display='none'},
 install(){if(deferred){deferred.prompt();deferred=null;$('#installBtn').style.display='none'}}
};
const NOPE=['delRow','delBook','resDel','delMove','delPay','wipe','demo'];
function describe(k,el){const id=el&&el.dataset&&el.dataset.id;try{if(k==='delRow'){const r=cur().rows.find(x=>x.id===id);return r?r.desc:''}if(k==='delMove'){const m=state.moves.find(x=>x.id===id);return m?m.item+' x'+m.given:''}if(k==='delPay'){const p=state.pays.find(x=>x.id===id);return p?money(num(p.amount)):''}if(k==='resDel'||k==='resBlock'){const r=state.resellers.find(x=>x.id===id);return r?r.name:''}if(k==='addDirect')return $('#dItem').value+' x'+$('#dQty').value+' @'+$('#dPrice').value;if(k==='addPay'){const r=state.resellers.find(x=>x.id===$('#pRes').value);return(r?r.name:'')+' '+$('#pAmt').value}if(k==='addReseller')return $('#rName').value;if(k==='delBook'||k==='renBook')return cur().label}catch(e){}return''}
['addRow','delRow','addReseller','resDel','resBlock','addMove','delMove','addPay','delPay','addDirect','wipe','demo','newBook','renBook','delBook'].forEach(k=>{const o=ACT[k];ACT[k]=async function(a,el){if(isMgr()&&NOPE.includes(k)){toast(t('tOwner'));return}const info=describe(k,el),b=snap();await o.call(ACT,a,el);if(snap()!==b)log(k,info||(k==='newBook'||k==='renBook'?cur().label:''))}});
let deferred=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn').style.display=''});
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const f=ACT[el.dataset.act];if(f)f(el.dataset.arg,el)});
document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('#v-settings,#v-calc,#lock,#dlg,#langOv'))return;if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();undo()}else if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.shiftKey&&e.key.toLowerCase()==='z'))){e.preventDefault();redo()}});
/* ---- binds ---- */
function bind(id,fn){$(id).addEventListener('input',e=>{fn(e.target.value);save();renderBrand();renderHome()});$(id).addEventListener('change',e=>log('settings',id.slice(2)+': '+e.target.value))}
bind('#sBname',v=>state.brand.name=v||'PREMIUM QUALITÉ');bind('#sOwner',v=>state.set.owner=v);bind('#sManager',v=>state.set.manager=v);bind('#sCity',v=>state.brand.city=v);bind('#sSlogan',v=>state.brand.slogan=v);
bind('#sEmail',v=>state.brand.email=v.trim());bind('#sBPhone',v=>state.brand.phone=v);bind('#sAddr',v=>state.brand.addr=v);const lst=v=>v.split(',').map(x=>x.trim()).filter(Boolean);bind('#sUnits',v=>state.set.units=lst(v).length?lst(v):['Pc']);bind('#sCats',v=>state.set.cats=lst(v));
bind('#sMonnaie',v=>state.set.monnaie=v);bind('#sTaux',v=>state.set.taux=num(v));bind('#sLow',v=>state.set.lowStock=num(v));bind('#sLate',v=>state.set.lateDays=Math.max(1,num(v)));bind('#sLoy',v=>state.set.loyaltyPct=Math.min(50,Math.max(0,num(v))));bind('#sSal',v=>state.set.salaryPct=Math.min(100,Math.max(0,num(v))));bind('#sBasis',v=>state.set.basis=v);
$('#sMonnaie').addEventListener('change',e=>{state.set.monnaie=e.target.value;save();renderHome()});$('#sBasis').addEventListener('change',e=>{state.set.basis=e.target.value;save();renderHome()});
$('#sLang').addEventListener('change',e=>ACT.setLang(e.target.value));
$('#bookSel').addEventListener('change',e=>{state.cur=e.target.value;save();renderSheet();renderHome()});
$('#jFilter').addEventListener('change',()=>loadJournal());$('#stockSearch').addEventListener('input',filterRows);$('#fText').addEventListener('input',renderMoves);$('#fRes').addEventListener('change',renderMoves);$('#stRes').addEventListener('change',e=>{STRES=e.target.value;renderStats()});
$('#logoFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),s=Math.min(im.width,im.height);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,96,96);state.brand.logo=c.toDataURL('image/png');save();renderBrand()};im.src=r.result};r.readAsDataURL(f)});
$('#impFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;let txt;try{txt=await f.text();const s=migrate(txt,'x');if(isMgr()){toast(t('tOwner'));return}if(!await ask(t('cfImport'),{danger:1}))return;log('import','');Object.assign(state,s);save();flush();renderAll()}catch(err){toast(t('tBadFile'))}e.target.value=''});
/* ---- calculator ---- */
let ce='';function cEval(){try{if(!/^[0-9+\-*/.() ]*$/.test(ce)||!ce)return'0';const v=Function('"use strict";return('+ce+')')();return isFinite(v)?String(Math.round(v*1e8)/1e8):'Err'}catch(e){return'…'}}
function cPress(k){if(k==='C')ce='';else if(k==='⌫')ce=ce.slice(0,-1);else if(k==='='){ce=cEval();if(ce==='Err'||ce==='…')ce=''}else ce+=({'×':'*','÷':'/','−':'-'})[k]||k;$('#cEx').textContent=ce.replace(/\*/g,'×').replace(/\//g,'÷');$('#cRs').textContent=cEval()}
['C','⌫','÷','×','7','8','9','−','4','5','6','+','1','2','3','=','0','.','(',')'].forEach(k=>$('#keys').append(h('button',{text:k,class:'ck'+('÷×−+='.includes(k)?' op':''),data:{k}})));
$('#keys').addEventListener('click',e=>{const b=e.target.closest('button');if(b)cPress(b.dataset.k)});
document.addEventListener('keydown',e=>{if(state.view!=='calc'||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;if(/^[0-9.()+\-*/]$/.test(e.key))cPress(e.key==='*'?'×':e.key==='/'?'÷':e.key==='-'?'−':e.key);else if(e.key==='Enter'||e.key==='=')cPress('=');else if(e.key==='Backspace')cPress('⌫')});
$('#cvFc').addEventListener('input',e=>{const r=state.set.taux||1;$('#cvUsd').value=e.target.value===''?'':String(Math.round(num(e.target.value)/r*100)/100)});
$('#cvUsd').addEventListener('input',e=>{$('#cvFc').value=e.target.value===''?'':String(Math.round(num(e.target.value)*(state.set.taux||1)))});
/* ---- init ---- */
$('#pad').innerHTML='';['1','2','3','4','5','6','7','8','9','','0','b'].forEach(k=>{const b=h('button',{text:k==='b'?'⌫':k,data:{k}});if(!k)b.style.visibility='hidden';$('#pad').append(b)});
$('#pad').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.k)padKey(b.dataset.k)});
load();loadCL();LANG=state.set.lang||'fr';last=snap();buildTabs();renderAll();applyRole();
if(state.set.pin)showLock();else afterUnlock();
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){const had=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('sw.js').then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update()});setInterval(()=>r.update(),3600000)}).catch(()=>{});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had){let s='';try{s=sessionStorage.getItem('pq-upd')}catch(e){}if(!s)$('#upd').style.display='flex'}})}

try{sessionStorage.removeItem('pq-upd')}catch(e){}
cloudInit();addEventListener('online',()=>{sb?scheduleSync(500):cloudInit()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync(300)});setInterval(()=>scheduleSync(0),60000);
