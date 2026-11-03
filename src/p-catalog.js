/* ---- Mini-catalogue web ---- */
let catT=0;
function catSlug(){let s=state.set.catSlug;if(!s){s=(state.brand.name||'boutique').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)||'boutique';s+='-'+Math.random().toString(36).slice(2,6);state.set.catSlug=s}return s}
const catUrl=()=>new URL('catalogue.html?c='+catSlug(),location.href).href;
const catItems=()=>allRows().filter(r=>r.desc&&num(r.price)>0&&!r.hide).slice(0,500).map(r=>({n:r.desc,p:num(r.price),u:r.uom||'',c:r.cat||'',s:rowStock(r)>0?1:0,i:r.img||''}));
async function catPublish(silent){if(!sb||!CL.shop||!cloudUser||isSeller()){if(!silent)toast(t('catNeedCloud'));return false}
 const sl0=state.set.catSlug;for(let i=0;i<2;i++){let r;try{r=await sb.rpc('publish_catalog',{s:CL.shop,sl:catSlug(),nm:state.brand.name,ph:state.brand.phone||'',cu:state.set.monnaie,it:catItems()})}catch(e){if(!silent)toast(t('cOffl'));return false}
  if(r.error){if(!silent)toast(t('catErr'));return false}
  if(r.data==='slug_pris'){state.set.catSlug='';continue}
  if(r.data==='ok'){if(!state.set.catOn||state.set.catSlug!==sl0){state.set.catOn=true;save()}if(!silent){toast(t('catDone'));log('catPublish','');}renderCatalog();return true}
  if(!silent)toast(t(r.data==='premium'?'premOnly':'catErr'));return false}
 return false}
function catSoon(){try{if(!state.set.catOn||!sb||!CL.shop)return}catch(e){return}clearTimeout(catT);catT=setTimeout(()=>catPublish(true),20000)}
function renderCatalog(){const B=$('#catBox');if(!B)return;
 if(gated()||!CL.shop){B.innerHTML='<div class="mu" style="font-size:.85rem">'+esc(t(CL.shop?'catLock':'catNeedCloud'))+'</div>'+(CL.shop?'<div class="btns" style="margin:8px 0 0"><button class="btn sm" data-act="go" data-arg="premium">'+esc(t('premium'))+'</button></div>':'');return}
 const on=!!state.set.catOn;let s='<div class="mu" style="font-size:.85rem;margin-bottom:8px">'+esc(t('catHint'))+'</div>'+(state.brand.phone?'':'<div class="al w">'+esc(t('catNoPhone'))+'</div>');
 if(!on)s+='<div class="btns" style="margin:0"><button class="btn" data-act="catPublish">'+esc(t('catEnable'))+'</button></div>';
 else s+='<div style="word-break:break-all;font-size:.82rem;margin-bottom:8px" class="up">'+esc(catUrl())+'</div><div class="btns" style="margin:0"><button class="btn sm" data-act="catPublish">'+esc(t('catUpdate'))+'</button><button class="btn sm g2" data-act="catCopy">'+esc(t('rcCopy'))+'</button><button class="btn sm g2" data-act="catShare">WhatsApp</button><button class="btn sm g2" data-act="catOpen">'+esc(t('catOpen'))+'</button><button class="btn sm r" data-act="catOff">'+esc(t('catOff'))+'</button></div>';
 s+='<div class="mu" style="font-size:.78rem;margin:12px 0 4px">'+esc(t('catItems'))+'</div>'+allRows().filter(r=>r.desc).map(r=>'<div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--ln)"><input type="checkbox" style="width:auto" data-act="catHide" data-id="'+esc(r.id)+'"'+(r.hide?'':' checked')+'>'+(r.img?'<img src="'+esc(r.img)+'" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px">':'<span style="width:40px;height:40px;border-radius:8px;background:var(--p2);display:inline-block;flex:none"></span>')+'<span style="flex:1;font-size:.88rem">'+esc(r.desc)+'</span><label class="btn sm g2" style="margin:0;flex:none">'+esc(t('catPhoto'))+'<input type="file" accept="image/*" data-catimg="'+esc(r.id)+'" style="display:none"></label>'+(r.img?'<button class="btn sm r" data-act="catPhotoDel" data-id="'+esc(r.id)+'">×</button>':'')+'</div>').join('');
 B.innerHTML=s}

/* photos : compression puis envoi dans le stockage */
async function catCompress(file){const url=URL.createObjectURL(file);try{const im=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=url});const M=800,k=Math.min(1,M/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
 for(const q of [.75,.6,.45]){const b=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(b&&b.size<=290000)return b}return null}finally{URL.revokeObjectURL(url)}}
const catPath=u=>{const m=String(u||'').match(/\/catalog\/(.+)$/);return m?decodeURIComponent(m[1]):''};
async function catPhotoSet(id,file){const r=allRows().find(x=>x.id===id);if(!r||!file||!sb||!CL.shop||gated()){toast(t('catNeedCloud'));return}
 toast(t('catPhotoWait'));let b;try{b=await catCompress(file)}catch(e){b=null}if(!b){toast(t('catPhotoErr'));return}
 const path=CL.shop+'/'+id+'-'+Date.now().toString(36)+'.jpg';
 try{const u=await sb.storage.from('catalog').upload(path,b,{contentType:'image/jpeg',upsert:true});if(u.error)throw u.error}catch(e){toast(t('catPhotoErr'));return}
 const old=catPath(r.img);r.img=sb.storage.from('catalog').getPublicUrl(path).data.publicUrl;save();if(old){try{await sb.storage.from('catalog').remove([old])}catch(e){}}
 log('catPhoto',r.desc);toast(t('catPhotoOk'));renderCatalog()}
