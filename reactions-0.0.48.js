(function(){
  if(window.__KF_REACTIONS_V0071__)return;
  window.__KF_REACTIONS_V0071__=true;

  const COLS=11,ROWS=8;
  const scriptSrc=(document.currentScript&&document.currentScript.src)||location.href;
  const SPRITE_URL=new URL('reaction-sprite.webp',new URL('.',scriptSrc)).href;

  function ensureStyles(){
    if(document.getElementById('kf-reactions-0071-style'))return;
    const s=document.createElement('style');
    s.id='kf-reactions-0071-style';
    s.textContent=`
      .kf-reaction-icon{display:inline-block;flex:0 0 auto;width:32px;height:32px;background-image:url("${SPRITE_URL}");background-repeat:no-repeat;background-size:${COLS*100}% ${ROWS*100}%;vertical-align:middle}
      .kf-reaction-count .kf-reaction-icon{width:25px;height:25px}
      .kf-reaction-smiles .kf-reaction-icon{width:32px;height:32px;pointer-events:none}
      .kf-reaction-smiles button{display:grid;place-items:center}
    `;
    document.head.appendChild(s);
  }
  ensureStyles();

  function iconStyle(n){
    n=Math.max(1,Math.min(88,Number(n)||1));
    const i=n-1,col=i%COLS,row=Math.floor(i/COLS);
    const x=COLS<=1?0:(col/(COLS-1))*100;
    const y=ROWS<=1?0:(row/(ROWS-1))*100;
    return `background-position:${x}% ${y}%`;
  }
  function iconHtml(n){return `<span class="kf-reaction-icon" style="${iconStyle(n)}" aria-hidden="true"></span>`}

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
  function ensurePicker(){
    if(picker)return picker;
    picker=document.createElement('div');picker.className='kf-reaction-picker';
    picker.innerHTML=`<div class="kf-reaction-picker-box"><div class="kf-reaction-picker-head"><b>Выберите реакцию</b><button type="button" data-close>×</button></div><div class="kf-reaction-smiles">${Array.from({length:88},(_,i)=>`<button type="button" data-smile="${i+1}" title="Смайл ${i+1}" aria-label="Смайл ${i+1}">${iconHtml(i+1)}</button>`).join('')}</div></div>`;
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
        const p=ensurePicker();p.classList.add('open');
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
