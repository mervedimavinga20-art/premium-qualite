Object.assign(ACT,{
 async payRequest(){if(!sb||!cloudUser||!CL.shop||CL.role!=='owner'){toast(t('needShop'));return}const tx=$('#pqTx').value.trim();if(tx.length<4){toast(t('tNeedTx'));return}
  const r=await sb.rpc('request_payment',{s:CL.shop,m:num($('#pqMonths').value)||1,t:tx,p:$('#pqPhone').value.trim()});if(r.error){authErr(r.error);return}
  if(r.data==='ok'){$('#pqTx').value='';toast(t('reqSent'));await loadPlan()}else toast(t(prRes(r.data),{e:r.data}))},
 async payApprove(a,el){const r=await sb.rpc('approve_payment',{rid:num(el.dataset.id)});if(r.error){authErr(r.error);return}toast(t('payDone'));await loadPlan()},
 async payReject(a,el){const r=await sb.rpc('reject_payment',{rid:num(el.dataset.id)});if(r.error){authErr(r.error);return}toast(t('payDone'));await loadPlan()}});
$('#pqMonths').addEventListener('change',renderPremium);
