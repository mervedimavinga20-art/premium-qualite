/* ---- Prévision de stock (vélocité des ventes) ---- */
const fcLead=()=>Math.max(0,num(state.set.leadDays)||7),fcMarg=()=>Math.max(0,state.set.marginDays==null?3:num(state.set.marginDays));
function fcList(){const td=todayS(),L=fcLead()+fcMarg(),out=[];
 allRows().forEach(r=>{if(!r.desc)return;let q=0,first=null;state.moves.forEach(m=>{if(m.aid!==r.id||!m.date)return;const d=dayDiff(m.date,td);if(d<0||d>=30)return;const o=num(m.given)-num(m.ret);if(o<=0)return;q+=o;if(first==null||d>first)first=d});
  if(q<=0)return;const win=Math.min(30,Math.max(7,first+1)),vel=q/win,st=rowStock(r),days=st<=0?0:st/vel,need=Math.ceil(vel*L-st);
  out.push({r,vel,st,days,need:need>0?need:0})});
 return out.sort((a,b)=>a.days-b.days)}
function renderForecast(){const C=$('#fcBody');if(!C)return;
 if(gated()){C.innerHTML='<div class="mu" style="font-size:.85rem">'+esc(t('fcLock'))+'</div><div class="btns" style="margin:8px 0 0"><button class="btn sm" data-act="go" data-arg="premium">'+esc(t('premium'))+'</button></div>';return}
 const L=fcLead()+fcMarg(),all=fcList(),soon=all.filter(x=>x.days<=L);
 if(!all.length){C.innerHTML='<div class="mu" style="font-size:.85rem">'+esc(t('fcNone'))+'</div>';return}
 if(!soon.length){C.innerHTML='<div class="mu" style="font-size:.85rem">'+esc(t('fcOk',{n:L}))+'</div>';return}
 C.innerHTML=soon.slice(0,6).map(x=>{const c=x.days<=3?'dn':x.days<=7?'':'mu',lb=x.st<=0?t('fcOut'):t('fcDays',{n:Math.max(1,Math.round(x.days))});return'<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--ln)"><span>'+esc(x.r.desc)+' <span class="mu" style="font-size:.78rem">('+esc(nf(Math.round(x.vel*10)/10))+t('fcPerDay')+')</span></span><b class="'+c+'">'+esc(lb)+'</b></div>'}).join('')+'<div class="btns" style="margin:10px 0 0"><button class="btn sm" data-act="fcOrder">'+esc(t('fcOrder'))+'</button></div><div class="mu" style="font-size:.72rem;margin-top:8px">'+esc(t('fcNote'))+'</div>'}
function fcOrderRows(){return fcList().filter(x=>x.need>0).map(x=>[x.r.desc,nf(x.st),nf(Math.round(x.vel*10)/10)+t('fcPerDay'),nf(x.need)+' '+(x.r.uom||'')])}
