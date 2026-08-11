(function(){
  if(window.__KF_DRAFT_RECOVERY_0062__)return;
  window.__KF_DRAFT_RECOVERY_0062__=true;

  const PATH_KEY='kfDraftTextV1:'+location.pathname;
  let saveTimer=null;
  let restoring=false;

  function injectStyle(){
    if(document.getElementById('kfDraftRecoveryStyle'))return;
    const s=document.createElement('style');
    s.id='kfDraftRecoveryStyle';
    s.textContent=`
      .kf-draft-note{display:none;margin:10px 0;padding:10px 11px;border:1px solid rgba(228,180,94,.25);border-radius:10px;background:rgba(228,180,94,.07);color:#dce7eb;font-size:12px;line-height:1.45}
      .kf-draft-note.show{display:block}.kf-draft-note b{color:#ffe2a0}
      .kf-draft-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}
      .kf-draft-actions button{min-height:32px;padding:0 10px;border-radius:7px;border:1px solid rgba(228,180,94,.25);background:#153247;color:#ffe2a0;cursor:pointer;font:inherit;font-size:11px}
      .kf-draft-saved{margin:7px 0 0;color:#8fa8b3;font-size:10px}
    `;
    document.head.appendChild(s);
  }

  function editorBox(){return document.getElementById('editor')||document.querySelector('.editor')}
  function controls(){
    const root=editorBox();
    if(!root)return [];
    return [...root.querySelectorAll('input,textarea,select,[contenteditable="true"]')]
      .filter(el=>el.type!=='file'&&el.type!=='button'&&el.type!=='submit'&&!el.disabled);
  }
  function keyFor(el,index){
    return el.id?`id:${el.id}`:`idx:${index}:${el.tagName.toLowerCase()}:${el.type||''}`;
  }
  function safeRichHtml(el){
    const clone=el.cloneNode(true);
    clone.querySelectorAll?.('img[src^="data:"]').forEach(img=>{
      const span=document.createElement('span');
      span.textContent='[Изображение нужно выбрать заново]';
      img.replaceWith(span);
    });
    return clone.innerHTML.slice(0,750000);
  }
  function capture(){
    const data={savedAt:Date.now(),fields:{}};
    controls().forEach((el,i)=>{
      const key=keyFor(el,i);
      if(el.matches('[contenteditable="true"]'))data.fields[key]={kind:'html',tag:'contenteditable',value:safeRichHtml(el)};
      else if(el.type==='checkbox'||el.type==='radio')data.fields[key]={kind:'checked',tag:el.type,value:!!el.checked};
      else data.fields[key]={kind:'value',tag:el.tagName.toLowerCase(),type:el.type||'',value:String(el.value??'').slice(0,250000)};
    });
    return data;
  }
  function meaningful(data){
    return Object.values(data.fields||{}).some(x=>{
      if(x.kind==='checked'||x.tag==='select')return false;
      if(x.tag==='input' && ['date','datetime-local','number'].includes(x.type||''))return false;
      const v=String(x.value||'')
        .replace(/<br\s*\/?>/gi,'')
        .replace(/<[^>]+>/g,'')
        .replace(/&nbsp;/gi,' ')
        .trim();
      return v.length>=2;
    });
  }
  function store(){
    if(restoring)return;
    const data=capture();
    try{
      if(meaningful(data))localStorage.setItem(PATH_KEY,JSON.stringify(data));
      else localStorage.removeItem(PATH_KEY);
    }catch(e){
      console.warn('Draft recovery storage:',e);
    }
    updateSavedLabel(data.savedAt);
  }
  function schedule(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(store,650);
  }
  function read(){
    try{
      const data=JSON.parse(localStorage.getItem(PATH_KEY)||'null');
      if(data?.savedAt && Date.now()-Number(data.savedAt)>7*24*60*60*1000){
        localStorage.removeItem(PATH_KEY);
        return null;
      }
      return data;
    }catch{return null}
  }
  function restore(data){
    if(!data?.fields)return;
    restoring=true;
    controls().forEach((el,i)=>{
      const row=data.fields[keyFor(el,i)];
      if(!row)return;
      if(row.kind==='html'&&el.matches('[contenteditable="true"]'))el.innerHTML=row.value||'';
      else if(row.kind==='checked')el.checked=!!row.value;
      else if(row.kind==='value')el.value=row.value??'';
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    restoring=false;
    document.getElementById('kfDraftRecoveryNote')?.classList.remove('show');
    schedule();
  }
  function clear(){
    try{localStorage.removeItem(PATH_KEY)}catch{}
    document.getElementById('kfDraftRecoveryNote')?.classList.remove('show');
  }
  function updateSavedLabel(ts){
    const el=document.getElementById('kfDraftSaved');
    if(el&&ts)el.textContent='Черновик сохранён: '+new Date(ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  }
  function install(){
    injectStyle();
    const root=editorBox();
    if(!root)return;

    const note=document.createElement('div');
    note.className='kf-draft-note';
    note.id='kfDraftRecoveryNote';
    note.innerHTML=`<b>Найден восстановительный черновик.</b><br>
      Если страница была случайно закрыта или перезагрузилась, можно вернуть введённый текст и поля.
      <div class="kf-draft-actions">
        <button type="button" id="kfDraftRestore">Восстановить</button>
        <button type="button" id="kfDraftDelete">Удалить черновик</button>
      </div>
      <div class="kf-draft-saved" id="kfDraftSaved"></div>`;
    root.insertBefore(note,root.firstChild);

    const saved=read();
    if(saved&&meaningful(saved)){
      note.classList.add('show');
      updateSavedLabel(saved.savedAt);
    }

    root.addEventListener('input',schedule,true);
    root.addEventListener('change',schedule,true);
    document.getElementById('kfDraftRestore')?.addEventListener('click',()=>restore(read()));
    document.getElementById('kfDraftDelete')?.addEventListener('click',clear);

    const cancel=document.getElementById('cancelBtn');
    if(cancel)cancel.addEventListener('click',()=>setTimeout(clear,0));

    const save=document.getElementById('saveBtn');
    if(save){
      save.addEventListener('click',()=>{
        // Успешные публикации обычно очищают заголовок/редактор через reset().
        [1800,4000,8000].forEach(ms=>setTimeout(()=>{
          const data=capture();
          const textControls=controls().filter(el=>
            el.matches('[contenteditable="true"]') ||
            (['text','search','url','email','number','date','datetime-local'].includes(el.type)) ||
            el.tagName==='TEXTAREA'
          );
          const hasText=textControls.some(el=>{
            const v=el.matches('[contenteditable="true"]')?el.innerText:el.value;
            return String(v||'').trim().length>=2;
          });
          if(!hasText)clear();
        },ms));
      });
    }

    window.addEventListener('beforeunload',store);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  window.KFDraftRecovery={store,read,restore,clear};
})();
