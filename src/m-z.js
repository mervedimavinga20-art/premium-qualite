/* ---- Clôture de caisse (Rapport Z) ---- */
const gm=g=>(g>0?'+':g<0?'−':'')+money(Math.abs(g));
const pmOf=m=>m.pm||(m.credit?'credit':'cash');
const zScope=()=>isSeller()?(CL.email||''):'*';
function zCalc(date,sc){const o={cash:0,momo:0,credit:0,debt:0};
 state.moves.forEach(m=>{if(m.rid!=='shop'||m.date!==date)return;if(sc!=='*'&&(m.by||'')!==sc)return;o[pmOf(m)]+=m.sold*m.price});
 if(sc==='*')state.pays.forEach(p=>{if(String(p.rid).startsWith('c:')&&p.date===date)o.debt+=num(p.amount)});
 o.total=o.cash+o.momo+o.credit;o.exp=o.cash+o.debt;return o}
function zText(date,o,c){const b=state.brand,L=[t('zTitle')+' — '+b.name,fdate(date),'',t('zCash')+' : '+money(o.cash),t('zMomo')+' : '+money(o.momo),t('zCred')+' : '+money(o.credit),t('zSales')+' : '+money(o.total)];
 if(o.debt)L.push(t('zDebt')+' : '+money(o.debt));L.push(t('zExp')+' : '+money(o.exp));if(c){L.push(t('zCount')+' : '+money(c.counted),t('zGap')+' : '+gm(c.gap),t('zDone',{n:c.by||'—'}))}
 if(b.signature)L.push('',b.signature);return L.join('\n')}
function zGapShow(){const e=$('#zGapV');if(!e)return;const v=$('#zCount').value;if(v===''){e.textContent='';return}const g=num(v)-Z.exp;e.textContent=t('zGap')+' : '+gm(g);e.className=g===0?'up':'dn'}
let Z={exp:0};
function renderZ(){const B=$('#zBody');if(!B)return;if(document.activeElement&&document.activeElement.id==='zCount')return;const D=$('#zDate');if(!D.value)D.value=todayS();const date=D.value,sc=zScope(),o=zCalc(date,sc),c=state.closures.find(x=>x.date===date&&x.scope===sc);Z={exp:o.exp};
 const row=(k,v,cls)=>'<div style="display:flex;justify-content:space-between;padding:4px 0"><span>'+esc(k)+'</span><b class="'+(cls||'')+'">'+esc(v)+'</b></div>';
 let s='<div class="mu" style="font-size:.78rem;margin-bottom:4px">'+esc(t(sc==='*'?'zAll':'zMine'))+'</div>'+row(t('zCash'),money(o.cash))+row(t('zMomo'),money(o.momo))+row(t('zCred'),money(o.credit))+row(t('zSales'),money(o.total),'up')+(o.debt?row(t('zDebt'),money(o.debt)):'')+'<hr style="border:0;border-top:1px solid var(--ln);margin:6px 0">'+row(t('zExp'),money(o.exp));
 if(c){s+=row(t('zCount'),money(c.counted))+row(t('zGap'),gm(c.gap),c.gap===0?'up':'dn')+'<div class="mu" style="font-size:.8rem;margin:6px 0">'+esc(t('zDone',{n:c.by||'—'}))+'</div><div class="btns" style="margin:0"><button class="btn sm g2" data-act="zShare" data-i="zShare">'+esc(t('zShare'))+'</button><button class="btn sm g2" data-act="zPrint">'+esc(t('zPrint'))+'</button><button class="btn sm r" data-own data-act="zReopen">'+esc(t('zReopen'))+'</button></div>'}
 else s+='<div class="fg" style="margin-top:8px"><div><label>'+esc(t('zCount'))+'</label><input id="zCount" type="number" inputmode="decimal" min="0" step="any"></div></div><div id="zGapV" style="font-weight:700;margin:4px 0"></div><div class="btns" style="margin:0"><button class="btn" data-act="zClose">'+esc(t('zDo'))+'</button><button class="btn sm g2" data-act="zShare">'+esc(t('zShare'))+'</button><button class="btn sm g2" data-act="zPrint">'+esc(t('zPrint'))+'</button></div>';
 B.innerHTML=s;const zc=$('#zCount');if(zc)zc.addEventListener('input',zGapShow)}
