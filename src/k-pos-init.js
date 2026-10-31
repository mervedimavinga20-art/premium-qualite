Object.assign(ACT,{
 posMode(a){POS.mode=a;renderPos()},
 scanStart(){scanStart()},scanStop(){scanStop()},
 posAdd(){const v=$('#posCode').value;if(v.trim())onCode(v,false)},
 cartQ(a,el){const l=POS.cart.find(x=>x.id===el.dataset.id);if(!l)return;if(a==='x')POS.cart=POS.cart.filter(x=>x!==l);else{const r=allRows().find(x=>x.id===l.id);const nq=l.q+num(a);if(nq<=0)POS.cart=POS.cart.filter(x=>x!==l);else if(r&&nq>rowStock(r))toast(t('posStockLow',{n:r.desc,q:nf(rowStock(r))}));else l.q=nq}renderPos()},
 posClear(){POS.cart=[];renderPos()},
 posNewClient(){return newClientQ()},
 posPayMode(a){POS.pay=a;renderPos()},
 posPay(){if(!POS.cart.length)return;const cl=state.clients.find(x=>x.id===$('#posClient').value),credit=POS.pay==='credit';
  if(credit&&!cl){toast(t('needClient'));return}if((cl||credit)&&lockedPrem()){toast(t('premOnly'));showView('premium');return}
  for(const l of POS.cart){const r=allRows().find(x=>x.id===l.id);if(r&&l.q>rowStock(r)){toast(t('posStockLow',{n:r.desc,q:nf(rowStock(r))}));return}}
  const lines=[],ex={cid:cl?cl.id:'',credit:credit,by:CL.shop?CL.email:''};let gross=0;
  POS.cart.forEach(l=>{const r=allRows().find(x=>x.id===l.id);if(!r)return;state.moves.unshift(Object.assign({id:uid(),date:todayS(),rid:'shop',aid:r.id,item:r.desc,given:l.q,ret:0,sold:l.q,price:l.p},ex));gross+=l.q*l.p;lines.push({d:r.desc,q:l.q,p:l.p})});
  let disc=0;if(cl&&$('#posCb').checked){disc=Math.min(cCb(cl.id),gross);if(disc>0){state.moves.unshift(Object.assign({id:uid(),date:todayS(),rid:'shop',aid:'',item:t('cbLine'),given:0,ret:0,sold:1,price:-disc},ex));state.cbl.push({id:uid(),cid:cl.id,amount:-disc,date:todayS()})}}
  const net=gross-disc;let earned=0;if(cl){earned=Math.round(net*num(state.set.loyaltyPct)/100*100)/100;if(earned>0)state.cbl.push({id:uid(),cid:cl.id,amount:earned,date:todayS()})}
  const txt=receiptText({lines,disc,net,credit,due:cl?Math.max(0,cDue(cl.id)):0,cl});POS.rc={text:txt,phone:cl?cl.phone:''};
  save();log('sale',lines.map(x=>x.d+' x'+x.q).join(', ')+' = '+money(net)+(cl?' · '+cl.name:'')+(credit?' (crédit)':''));
  $('#rcText').textContent=txt;$('#rcCard').style.display='';$('#posLast').textContent='';toast(t('posSold',{t:money(net)}));if(navigator.vibrate)try{navigator.vibrate([40,40,40])}catch(e){}
  POS.cart=[];POS.pay='cash';renderPos();renderHome()},
 rcWA(){if(!POS.rc)return;window.open('https://wa.me/'+(POS.rc.phone?waNum(POS.rc.phone):'')+'?text='+encodeURIComponent(POS.rc.text),'_blank')},
 async rcCopy(){if(!POS.rc)return;try{await navigator.clipboard.writeText(POS.rc.text);toast(t('copied'))}catch(e){const r=document.createRange();r.selectNodeContents($('#rcText'));const s=getSelection();s.removeAllRanges();s.addRange(r)}},
 addClient(){if(lockedPrem()){toast(t('premOnly'));showView('premium');return}const n=$('#cName').value.trim();if(!n){toast(t('tNeed'));return}state.clients.push({id:uid(),name:n,phone:$('#cPhone').value.trim()});$('#cName').value='';$('#cPhone').value='';save();log('addClient',n);renderClients()},
 async clientPay(a,el){if(lockedPrem()){toast(t('premOnly'));showView('premium');return}const c=state.clients.find(x=>x.id===el.dataset.id);if(!c)return;const v=await ask(t('cAmountAsk',{n:c.name}),{input:1,def:String(Math.max(0,Math.round(cDue(c.id)*100)/100))});const am=num(v);if(!am||am<=0)return;state.pays.push({id:uid(),date:todayS(),rid:'c:'+c.id,amount:am,note:'client'});save();log('clientPay',c.name+' '+money(am));renderClients();renderHome()},
 clientWA(a,el){const c=state.clients.find(x=>x.id===el.dataset.id);if(!c)return;const msg=t('rcRemind',{n:c.name,r:money(Math.max(0,cDue(c.id))),b:state.brand.name});window.open('https://wa.me/'+(c.phone?waNum(c.phone):'')+'?text='+encodeURIComponent(msg),'_blank')},
 async delClient(a,el){if(!await ask(t('cfDelClient'),{danger:1}))return;const id=el.dataset.id;state.clients=state.clients.filter(x=>x.id!==id);state.moves.forEach(m=>{if(m.cid===id)m.cid=''});save();log('delClient','');renderClients()}
});
$('#posCode').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ACT.posAdd()}});
$('#posClient').addEventListener('change',renderPos);
