(function(){
  if(window.__KF_REACTIONS_V0079__)return;
  window.__KF_REACTIONS_V0079__=true;

  const scriptSrc=(document.currentScript&&document.currentScript.src)||location.href;
  const BASE_URL=new URL('.',scriptSrc);

  function smileUrl(n){
    n=Math.max(1,Math.min(88,Number(n)||1));
    return new URL(`smiles/smile_${String(n).padStart(3,'0')}.gif`,BASE_URL).href;
  }
  function ensureStyles(){
    if(document.getElementById('kf-reactions-0079-style'))return;
    const st=document.createElement('style');
    st.id='kf-reactions-0079-style';
    st.textContent=`
      .kf-reaction-icon-img{display:block;width:32px;height:32px;object-fit:contain;pointer-events:none}.kf-reaction-icon-img.is-broken{font-size:24px;line-height:32px}
      .kf-reaction-count .kf-reaction-icon-img{width:27px;height:27px}
      .kf-reaction-smiles button{display:grid;place-items:center;transition:transform .12s ease,border-color .12s ease}
      .kf-reaction-smiles button:hover{transform:translateY(-2px) scale(1.06);border-color:#ffe2a0}
      .kf-reaction-smiles button:active{transform:scale(.95)}
    `;
    document.head.appendChild(st);
  }
  ensureStyles();

  function markSmileLoaded(img){img.classList.add('is-loaded')}
  function markSmileBroken(img){img.classList.add('is-broken');img.removeAttribute('src');img.alt='🙂'}
  function iconHtml(n){return `<img class="kf-reaction-icon-img" src="${smileUrl(n)}" alt="🙂" data-smile-number="${n}" onload="this.classList.add('is-loaded')" onerror="this.classList.add('is-broken');this.removeAttribute('src')">`}

  async function getUser(){
    if(!window.KFSupabase?.configured)return null;
    try{await KFSupabase.ready;return await KFSupabase.getCurrentProfile()}catch{return null}
  }
  async function getRows(contentKey,entryId){
    if(!window.KFSupabase?.configured)return [];
    await KFSupabase.ready;
    const {data,error}=await KFSupabase.client.from('content_reactions')
      .select('content_key,entry_id,user_id,reaction')
      .eq('content_key',contentKey)
      .eq('entry_id',String(entryId));
    if(error)throw error;
    return data||[];
  }
  async function setReaction(contentKey,entryId,reaction){
    const user=await getUser();
    if(!user)throw new Error('Чтобы поставить реакцию, войдите в аккаунт.');
    const row={content_key:contentKey,entry_id:String(entryId),user_id:user.id,reaction:String(reaction),updated_at:new Date().toISOString()};
    const {error}=await KFSupabase.client.from('content_reactions').upsert(row,{onConflict:'content_key,entry_id,user_id'});
    if(error)throw error;
  }
  async function removeReaction(contentKey,entryId){
    const user=await getUser();if(!user)return;
    const {error}=await KFSupabase.client.from('content_reactions').delete()
      .eq('content_key',contentKey).eq('entry_id',String(entryId)).eq('user_id',user.id);
    if(error)throw error;
  }
  function group(rows){
    const m=new Map();rows.forEach(r=>m.set(r.reaction,(m.get(r.reaction)||0)+1));
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  }

  let picker=null;
  function activatePickerGifs(){
    if(!picker)return;
    picker.querySelectorAll('img[data-smile-src]').forEach(img=>{
      const src=img.dataset.smileSrc;if(!src)return;
      img.removeAttribute('src');
      requestAnimationFrame(()=>{img.src=src});
    });
  }
  function ensurePicker(){
    if(picker)return picker;
    picker=document.createElement('div');picker.className='kf-reaction-picker';
    picker.innerHTML=`<div class="kf-reaction-picker-box"><div class="kf-reaction-picker-head"><b>Выберите реакцию</b><button type="button" data-close>×</button></div><div class="kf-reaction-smiles">${Array.from({length:88},(_,i)=>`<button type="button" data-smile="${i+1}" title="Смайл ${i+1}" aria-label="Смайл ${i+1}"><img class="kf-reaction-icon-img" data-smile-src="${smileUrl(i+1)}" alt="🙂" onerror="this.classList.add('is-broken');this.removeAttribute('src')"></button>`).join('')}</div></div>`;
    picker.querySelector('[data-close]').onclick=()=>picker.classList.remove('open');
    picker.onclick=e=>{if(e.target===picker)picker.classList.remove('open')};
    document.body.appendChild(picker);return picker;
  }

  async function mountSmiles(containerId,contentKey,entryId){
    const el=document.getElementById(containerId);if(!el)return;
    el.classList.add('kf-reactions');el.innerHTML='<span class="kf-reaction-muted">Загрузка реакций...</span>';
    try{
      const [rows,user]=await Promise.all([getRows(contentKey,entryId),getUser()]);
      const grouped=group(rows),my=rows.find(r=>user&&String(r.user_id)===String(user.id));
      const summary=grouped.map(([reaction,count])=>{
        const m=String(reaction||'').match(/^smile:(\d+)$/);if(!m)return '';
        const n=Number(m[1]);if(n<1||n>88)return '';
        return `<span class="kf-reaction-count">${iconHtml(n)} <span>${count}</span></span>`;
      }).join('');
      el.innerHTML=`<div class="kf-reaction-summary">${summary||'<span class="kf-reaction-muted">Пока нет реакций</span>'}</div><button type="button" class="kf-reaction-add">${my?'Изменить реакцию':'Добавить реакцию'}</button>`;
      el.querySelector('.kf-reaction-add').onclick=()=>{
        if(!user){alert('Чтобы поставить реакцию, войдите в аккаунт.');return}
        const p=ensurePicker();p.classList.add('open');activatePickerGifs();
        p.querySelectorAll('[data-smile]').forEach(btn=>{btn.onclick=async()=>{
          const reaction='smile:'+btn.dataset.smile;p.classList.remove('open');
          try{if(my&&my.reaction===reaction)await removeReaction(contentKey,entryId);else await setReaction(contentKey,entryId,reaction);await mountSmiles(containerId,contentKey,entryId)}
          catch(e){alert(e.message||'Не удалось сохранить реакцию.')}
        }})
      };
    }catch(e){console.warn('Reactions:',e);el.innerHTML='<span class="kf-reaction-muted">Реакции временно недоступны.</span>'}
  }

  async function mountCheck(containerId,contentKey,entryId){
    const el=document.getElementById(containerId);if(!el)return;el.classList.add('kf-reactions');
    try{
      const [rows,user]=await Promise.all([getRows(contentKey,entryId),getUser()]);
      const count=rows.filter(x=>x.reaction==='check').length;
      const my=rows.find(r=>user&&String(r.user_id)===String(user.id)&&r.reaction==='check');
      el.innerHTML=`<button type="button" class="kf-check-reaction ${my?'active':''}">✅ <span>${count}</span></button>`;
      el.querySelector('button').onclick=async()=>{if(!user){alert('Чтобы поставить реакцию, войдите в аккаунт.');return}try{if(my)await removeReaction(contentKey,entryId);else await setReaction(contentKey,entryId,'check');await mountCheck(containerId,contentKey,entryId)}catch(e){alert(e.message||'Не удалось сохранить реакцию.')}};
    }catch{el.innerHTML=''}
  }

  window.KFReactions={mountSmiles,mountCheck,getRows,setReaction,removeReaction};
})();
