/* ---- Multi-boutiques : changement de boutique, tableau de bord central, transferts ---- */
let SHOPS=[];
const shopName=id=>{const s=SHOPS.find(x=>x.id===id);return s?s.name:'?'};
const trName=rid=>shopName(String(rid).slice(3));
async function loadShops(){if(!sb||!cloudUser)return;try{const r=await sb.from('members').select('shop_id,role,email').eq('user_id',cloudUser.id);if(r.error||!r.data)return;
 const out=[];for(const m of r.data){let nm='?';try{const g=await sb.from('shops').select('id,name').eq('id',m.shop_id).single();if(g.data&&g.data.name)nm=g.data.name}catch(e){}out.push({id:m.shop_id,role:m.role,name:nm})}
 SHOPS=out}catch(e){}renderShopBar()}
function renderShopBar(){const bar=$('#shopBar');if(!bar)return;const on=!!(sb&&cloudUser&&CL.shop);bar.style.display=on?'':'none';if(!on)return;
 const sel=$('#shopSel');sel.innerHTML='';SHOPS.forEach(s=>sel.append(h('option',{value:s.id,text:s.name})));sel.value=CL.shop;sel.style.display=SHOPS.length>1?'':'none';
 $('#bMulti').style.display=SHOPS.length>1&&CL.role==='owner'?'':'none';$('#bNewShop').style.display=CL.role==='owner'?'':'none';const hb=$('#homeMulti');if(hb)hb.style.display=SHOPS.length>1&&CL.role==='owner'?'':'none'}
async function switchShop(id){if(!id||id===CL.shop||!sb||!cloudUser)return;const m=SHOPS.find(x=>x.id===id);if(!m)return;
 clearTimeout(syncT);for(let i=0;i<30&&syncing;i++)await new Promise(r=>setTimeout(r,100));await sync();await flushJ();
 const sh=await sb.from('shops').select('data,rev').eq('id',id).single();if(sh.error||!sh.data){toast(t('cErr',{e:sh.error?sh.error.message:'?'}));renderShopBar();return}
 const has=sh.data.data&&sh.data.data.books;CL={shop:id,rev:sh.data.rev,base:has?clone(sh.data.data):null,role:m.role,email:cloudUser.email};jq=[];
 if(has)setDoc(sh.data.data);saveCL();applyRole();subscribe();await sync();loadPlan();updCloudUI();renderAll();renderShopBar();toast(t('shopSwitched',{n:m.name}))}
async function newShop(){if(!await needSB())return;if(!CL.shop||CL.role!=='owner')return;if(gated()){toast(t('shopNeedPrem'));showView('premium');return}
 const n=await ask(t('newShopQ'),{input:1});if(!n||!n.trim())return;
 const d=DEF(),cur=pack();const doc={brand:Object.assign({},d.brand,{name:n.trim(),phone:'',email:'',addr:'',city:'',logo:cur.brand.logo||''}),set:Object.assign({},cur.set,{catOn:false,catSlug:''}),books:d.books,resellers:[],moves:[],pays:[],clients:[],cbl:[],closures:[]};
 try{const r=await sb.rpc('create_shop',{n:n.trim(),d:doc});if(r.error)throw r.error;await loadShops();toast(t('shopMade'));await switchShop(r.data)}catch(e){if(e&&/premium_requis/.test(e.message||'')){toast(t('shopNeedPrem'));showView('premium')}else authErr(e)}}
/* tableau de bord central */
function docCalc(d){const td=todayS(),mv=d.moves||[],out={};mv.forEach(m=>{if(m.aid)out[m.aid]=(out[m.aid]||0)+num(m.given)-num(m.ret)});
 let sales=0,cd=0;mv.forEach(m=>{if(m.rid==='shop'&&m.date===td)sales+=num(m.sold)*num(m.price);if(m.credit&&m.cid)cd+=num(m.sold)*num(m.price)});(d.pays||[]).forEach(p=>{if(String(p.rid).startsWith('c:'))cd-=num(p.amount)});
 const low=num((d.set||{}).lowStock),items=[];let nl=0,val=0;(d.books||[]).forEach(b=>(b.rows||[]).forEach(r=>{if(!r.desc)return;const st=num(r.qty)-(out[r.id]||0);items.push({key:String(r.code||r.desc).toLowerCase(),name:r.desc,st,id:r.id,uom:r.uom||''});if(st<=low)nl++;val+=Math.max(0,st)*num(r.price)}));
 return{sales,cd:Math.max(0,cd),nl,val,items,cur:(d.set||{}).monnaie||'$'}}
const fm=(n,c)=>{n=Math.round(n*100)/100;const s=n.toLocaleString(LOC(),{maximumFractionDigits:2});return c==='$'?'$'+s:s+' FC'};
let MULTI=null;
async function renderMulti(){const B=$('#multiBox');B.innerHTML='<div class="sk" style="height:90px;margin-bottom:10px"></div><div class="sk" style="height:140px"></div>';
 if(!sb||!cloudUser||SHOPS.length<2){B.innerHTML='<div class="empty">'+esc(t('mNone'))+'</div>';return}
 const rs=[];for(const s of SHOPS){try{let d;if(s.id===CL.shop)d=pack();else{const g=await sb.from('shops').select('data').eq('id',s.id).single();d=g.data&&g.data.data&&g.data.data.books?g.data.data:{books:[],moves:[],pays:[],set:{}}}rs.push({s,c:docCalc(d)})}catch(e){}}
 MULTI=rs;let h1=rs.map(x=>'<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><h2 style="margin:0">'+esc(x.s.name)+'</h2>'+(x.s.id===CL.shop?'<span class="bd ok">'+esc(t('mActive'))+'</span>':'<button class="btn sm g2" data-act="switchTo" data-id="'+esc(x.s.id)+'">'+esc(t('catOpen'))+'</button>')+'</div><div class="rg" style="grid-template-columns:repeat(2,1fr);margin-top:8px"><div class="mu">'+esc(t('mSales'))+'<b class="up">'+esc(fm(x.c.sales,x.c.cur))+'</b></div><div class="mu">'+esc(t('mDebt'))+'<b class="'+(x.c.cd>0?'dn':'')+'">'+esc(fm(x.c.cd,x.c.cur))+'</b></div><div class="mu">'+esc(t('mLow'))+'<b class="'+(x.c.nl?'dn':'')+'">'+x.c.nl+'</b></div><div class="mu">'+esc(t('mVal'))+'<b>'+esc(fm(x.c.val,x.c.cur))+'</b></div></div></div>').join('');
 const keys={};rs.forEach((x,i)=>x.c.items.forEach(it=>{const k=keys[it.key]||(keys[it.key]={name:it.name,v:{}});k.v[i]=(k.v[i]||0)+it.st;if(x.s.id===CL.shop)k.id=it.id}));
 const act=rs.findIndex(x=>x.s.id===CL.shop),rows=Object.keys(keys).sort();
 h1+='<div class="card"><h2>'+esc(t('mCross'))+'</h2><div class="tw"><table><thead><tr><th>'+esc(t('cDesc'))+'</th>'+rs.map(x=>'<th>'+esc(x.s.name)+'</th>').join('')+'<th></th></tr></thead><tbody>'+rows.map(k=>{const o=keys[k];return'<tr><td>'+esc(o.name)+'</td>'+rs.map((x,i)=>{const v=o.v[i];return'<td class="n'+(v!=null&&v<=0?' dn':'')+'">'+(v==null?'—':esc(nf(v)))+'</td>'}).join('')+'<td>'+(o.id&&o.v[act]>0?'<button class="btn sm g2" data-act="trfStart" data-id="'+esc(o.id)+'">'+esc(t('mTrf'))+'</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div></div>';
 B.innerHTML=h1}
async function trfRemote(r,q,destId){const key=r.code?String(r.code):'';
 for(let n=0;n<3;n++){const g=await sb.from('shops').select('data,rev').eq('id',destId).single();if(g.error)throw g.error;if(!g.data.data||!g.data.data.books)throw new Error('empty');const d=clone(g.data.data);let tg=null;
  d.books.forEach(b=>(b.rows||[]).forEach(x=>{if(!tg&&((key&&String(x.code||'')===key)||(!key&&String(x.desc).toLowerCase()===String(r.desc).toLowerCase())))tg=x}));
  if(tg)tg.qty=num(tg.qty)+q;else d.books[0].rows.push({id:uid(),desc:r.desc,code:r.code||'',cat:r.cat||'',uom:r.uom||'',qty:q,price:r.price,cost:r.cost,exp:0});
  const u=await sb.from('shops').update({data:d,rev:g.data.rev+1,updated_at:new Date().toISOString()}).eq('id',destId).eq('rev',g.data.rev).select('rev');if(u.error)throw u.error;if(u.data&&u.data.length)return true}
 throw new Error('conflit')}
async function trfStart(id){const r=allRows().find(x=>x.id===id);if(!r||CL.role!=='owner')return;const others=SHOPS.filter(s=>s.id!==CL.shop);if(!others.length)return;
 const q=num(await ask(t('mTrfQ',{n:r.desc,s:nf(rowStock(r))}),{input:1,def:'1'}));if(!q||q<=0)return;if(q>rowStock(r)){toast(t('posStockLow',{n:r.desc,q:nf(rowStock(r))}));return}
 let dest=others[0];if(others.length>1){const a=await ask(t('mTrfTo',{l:others.map((s,i)=>(i+1)+') '+s.name).join('  ')}),{input:1,def:'1'});const i=Math.round(num(a))-1;if(!others[i])return;dest=others[i]}
 try{await trfRemote(r,q,dest.id)}catch(e){toast(t('mTrfErr'));return}
 state.moves.unshift({id:uid(),date:todayS(),rid:'tr:'+dest.id,aid:r.id,item:r.desc,given:q,ret:0,sold:0,price:num(r.price)});save();log('transfer',r.desc+' x'+q+' → '+dest.name);
 try{await sb.from('journal').insert([{shop_id:dest.id,email:cloudUser.email,role:'owner',action:'transferIn',detail:r.desc+' x'+q+' ← '+shopName(CL.shop)}])}catch(e){}
 toast(t('mTrfOk'));renderMulti()}
