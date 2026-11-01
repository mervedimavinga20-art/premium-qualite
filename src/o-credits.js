/* ---- Bilansi : créances, ancienneté, rappels ---- */
const DEBT={tone:1,sent:{}};
function cAge(id){const ms=state.moves.filter(m=>m.cid===id&&m.credit&&m.date).sort((a,b)=>a.date.localeCompare(b.date));let P=state.pays.reduce((s,p)=>p.rid==='c:'+id?s+num(p.amount):s,0);for(const m of ms){const v=m.sold*m.price,left=v-Math.min(v,Math.max(0,P));P-=v;if(left>0.005)return Math.max(0,dayDiff(m.date,todayS()))}return -1}
function remindMsg(c){const d=Math.max(0,cAge(c.id)),r=money(Math.max(0,cDue(c.id))),b=state.brand,k=DEBT.tone,p={n:c.name,r,b:b.name,d,p:b.phone?(' '+b.phone):''};return t(k===1?'rcRemind':k===2?'rm2':'rm3',p)}
function sendRemind(c){if(!c.phone){toast(t('noPhone'));return false}c.rem=todayS();save();log('remind',c.name+' '+money(cDue(c.id)));window.open('https://wa.me/'+waNum(c.phone)+'?text='+encodeURIComponent(remindMsg(c)),'_blank');return true}
function renderDebts(){const B=$('#debtBox');if(!B)return;const dues=state.clients.map(c=>({c,d:cDue(c.id),a:cAge(c.id)})).filter(x=>x.d>0.005);
 if(!dues.length){B.innerHTML='<div class="mu" style="font-size:.85rem">'+esc(t('debtNone'))+'</div>';return}
 const sum=f=>dues.filter(f).reduce((s,x)=>s+x.d,0),tot=sum(()=>true),row=(l,v,cls)=>'<div style="display:flex;justify-content:space-between;padding:3px 0"><span>'+esc(l)+'</span><b class="'+(cls||'')+'">'+esc(money(v))+'</b></div>';
 const todo=dues.filter(x=>x.c.phone&&!DEBT.sent[x.c.id]).length;
 B.innerHTML=row(t('debtTotal'),tot,'dn')+row(t('debtB1'),sum(x=>x.a<=7))+row(t('debtB2'),sum(x=>x.a>7&&x.a<=30))+row(t('debtB3'),sum(x=>x.a>30),'dn')+'<div class="mu" style="font-size:.78rem;margin:8px 0 4px">'+esc(t('toneL'))+'</div><div class="seg" id="toneSeg">'+[1,2,3].map(k=>'<button data-act="debtTone" data-arg="'+k+'" class="'+(DEBT.tone===k?'on':'')+'">'+esc(t('tone'+k))+'</button>').join('')+'</div><div class="btns" style="margin:10px 0 0"><button class="btn" data-act="debtNext">'+esc(t('debtNext'))+' ('+todo+')</button></div>'}
