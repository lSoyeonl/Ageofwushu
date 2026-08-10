(function(){
  if(window.__KF_DRAFT_RECOVERY_0069__)return;
  window.__KF_DRAFT_RECOVERY_0069__=true;

  const PATH_KEY='kfDraftTextV1:'+location.pathname;
  const DB_NAME='kungfuDraftsV2',STORE='drafts',MANUAL_KEY='manual:'+location.pathname;
  let saveTimer=null,restoring=false;

  function injectStyle(){
    if(document.getElementById('kfDraftRecoveryStyle'))return;
    const s=document.createElement('style');s.id='kfDraftRecoveryStyle';s.textContent=`
      .kf-draft-note{display:none;margin:10px 0;padding:10px 11px;border:1px solid rgba(228,180,94,.25);border-radius:10px;background:rgba(228,180,94,.07);color:#dce7eb;font-size:12px;line-height:1.45}
      .kf-draft-note.show{display:block}.kf-draft-note b{color:#ffe2a0}.kf-draft-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}.kf-draft-actions button{min-height:32px;padding:0 10px;border-radius:7px;border:1px solid rgba(228,180,94,.25);background:#153247;color:#ffe2a0;cursor:pointer;font:inherit;font-size:11px}.kf-draft-saved{margin:7px 0 0;color:#8fa8b3;font-size:10px}`;document.head.appendChild(s)
  }
  function editorBox(){return document.getElementById('editor')||document.querySelector('.editor')}
  function controls(){const root=editorBox();if(!root)return [];return [...root.querySelectorAll('input,textarea,select,[contenteditable="true"]')].filter(el=>el.type!=='file'&&el.type!=='button'&&el.type!=='submit'&&!el.disabled)}
  function keyFor(el,index){return el.id?`id:${el.id}`:`idx:${index}:${el.tagName.toLowerCase()}:${el.type||''}`}
  function safeRichHtml(el){return el.innerHTML.slice(0,2500000)}
  function capture(){const data={savedAt:Date.now(),fields:{}};controls().forEach((el,i)=>{const key=keyFor(el,i);if(el.matches('[contenteditable="true"]'))data.fields[key]={kind:'html',tag:'contenteditable',value:safeRichHtml(el)};else if(el.type==='checkbox'||el.type==='radio')data.fields[key]={kind:'checked',tag:el.type,value:!!el.checked};else data.fields[key]={kind:'value',tag:el.tagName.toLowerCase(),type:el.type||'',value:String(el.value??'').slice(0,500000)}});return data}
  function meaningful(data){return Object.values(data?.fields||{}).some(x=>{if(x.kind==='checked'||x.tag==='select')return false;if(x.tag==='input'&&['date','datetime-local','number'].includes(x.type||''))return false;const v=String(x.value||'').replace(/<br\s*\/?>/gi,'').replace(/<[^>]+>/g,'').replace(/&nbsp;/gi,' ').trim();return v.length>=2})}
  function restoreFields(data){if(!data?.fields)return;restoring=true;controls().forEach((el,i)=>{const row=data.fields[keyFor(el,i)];if(!row)return;if(row.kind==='html'&&el.matches('[contenteditable="true"]'))el.innerHTML=row.value||'';else if(row.kind==='checked')el.checked=!!row.value;else if(row.kind==='value')el.value=row.value??'';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});restoring=false;document.getElementById('kfDraftRecoveryNote')?.classList.remove('show');schedule()}
  function storeAuto(){if(restoring)return;const data=capture();try{if(meaningful(data))localStorage.setItem(PATH_KEY,JSON.stringify(data));else localStorage.removeItem(PATH_KEY)}catch(e){console.warn('Draft recovery storage:',e)}updateSavedLabel(data.savedAt)}
  function schedule(){clearTimeout(saveTimer);saveTimer=setTimeout(storeAuto,650)}
  function readAuto(){try{const data=JSON.parse(localStorage.getItem(PATH_KEY)||'null');if(data?.savedAt&&Date.now()-Number(data.savedAt)>7*24*60*60*1000){localStorage.removeItem(PATH_KEY);return null}return data}catch{return null}}
  function clearAuto(){try{localStorage.removeItem(PATH_KEY)}catch{}document.getElementById('kfDraftRecoveryNote')?.classList.remove('show')}
  function updateSavedLabel(ts){const el=document.getElementById('kfDraftSaved');if(el&&ts)el.textContent='Автосохранение: '+new Date(ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}

  function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB недоступен'));return}const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Не удалось открыть хранилище черновиков'))})}
  async function dbPut(row){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=()=>{db.close();resolve(row)};tx.onerror=()=>{db.close();reject(tx.error)}})}
  async function dbGet(){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(MANUAL_KEY);req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)}})}
  async function dbDelete(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(MANUAL_KEY);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}catch{}}
  function extrasCapture(){try{return window.KFManualDraftExtras?.capture?.()||null}catch(e){console.warn('Draft extras capture:',e);return null}}
  function extrasRestore(v){try{return window.KFManualDraftExtras?.restore?.(v)}catch(e){console.warn('Draft extras restore:',e)}}
  function status(text,error=false){const el=document.getElementById('kfManualDraftStatus');if(el){el.textContent=text||'';el.style.color=error?'#ffb7b7':'#ffe2a0'}}
  function formatStamp(ts){return new Date(ts).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  async function refreshManualState(){const load=document.getElementById('kfManualDraftLoad'),del=document.getElementById('kfManualDraftDelete');try{const row=await dbGet();if(load)load.disabled=!row;if(del)del.disabled=!row;if(row)status('Сохранённый черновик: '+formatStamp(row.savedAt));else status('Сохранённого черновика пока нет.')}catch(e){if(load)load.disabled=true;if(del)del.disabled=true;status('Хранилище черновиков недоступно.',true)}}
  async function saveManual(){const btn=document.getElementById('kfManualDraftSave');if(btn)btn.disabled=true;try{const data=capture();if(!meaningful(data)&&!extrasCapture())throw new Error('Сначала заполните хотя бы одно поле.');const row={key:MANUAL_KEY,savedAt:Date.now(),data,extras:extrasCapture()};await dbPut(row);status('Черновик сохранён: '+formatStamp(row.savedAt));await refreshManualState()}catch(e){status(e.message||'Не удалось сохранить черновик.',true);alert(e.message||'Не удалось сохранить черновик.')}finally{if(btn)btn.disabled=false}}
  async function loadManual(){try{const row=await dbGet();if(!row){status('Сохранённого черновика нет.');return}const now=capture();if(meaningful(now)&&!confirm('Загрузить сохранённый черновик и заменить текущие заполненные поля?'))return;restoring=true;await extrasRestore(row.extras);restoreFields(row.data);restoring=false;status('Черновик загружен: '+formatStamp(row.savedAt));window.scrollTo({top:editorBox()?.offsetTop||0,behavior:'smooth'})}catch(e){restoring=false;status(e.message||'Не удалось загрузить черновик.',true);alert(e.message||'Не удалось загрузить черновик.')}}
  async function deleteManual(ask=true){if(ask&&!confirm('Удалить сохранённый черновик?'))return;await dbDelete();status('Черновик удалён.');await refreshManualState()}
  function installManualPanel(root){
    if(document.getElementById('kfManualDraftPanel'))return;
    const preview=document.getElementById('previewBtn'),save=document.getElementById('saveBtn');if(!preview||!save)return;
    const panel=document.createElement('div');panel.className='kf-draft-panel';panel.id='kfManualDraftPanel';panel.innerHTML=`<div class="kf-draft-copy"><div class="kf-draft-title">Черновик</div><div class="kf-draft-help">Можно сохранить незавершённый материал без публикации и вернуться к нему позже на этом устройстве.</div><div class="kf-draft-status" id="kfManualDraftStatus"></div></div><div class="kf-draft-buttons"><button class="btn secondary" type="button" id="kfManualDraftSave">Сохранить черновик</button><button class="btn secondary" type="button" id="kfManualDraftLoad">Загрузить</button><button class="btn danger" type="button" id="kfManualDraftDelete">Удалить</button></div>`;
    preview.parentNode.insertBefore(panel,preview);
    document.getElementById('kfManualDraftSave').addEventListener('click',saveManual);document.getElementById('kfManualDraftLoad').addEventListener('click',loadManual);document.getElementById('kfManualDraftDelete').addEventListener('click',()=>deleteManual(true));refreshManualState()
  }
  function install(){
    injectStyle();const root=editorBox();if(!root)return;
    const note=document.createElement('div');note.className='kf-draft-note';note.id='kfDraftRecoveryNote';note.innerHTML=`<b>Найден автосохранённый текст.</b><br>Если страница была случайно закрыта или перезагрузилась, можно вернуть введённые поля.<div class="kf-draft-actions"><button type="button" id="kfDraftRestore">Восстановить</button><button type="button" id="kfDraftDelete">Удалить автосохранение</button></div><div class="kf-draft-saved" id="kfDraftSaved"></div>`;root.insertBefore(note,root.firstChild);
    const saved=readAuto();if(saved&&meaningful(saved)){note.classList.add('show');updateSavedLabel(saved.savedAt)}
    root.addEventListener('input',schedule,true);root.addEventListener('change',schedule,true);document.getElementById('kfDraftRestore')?.addEventListener('click',()=>restoreFields(readAuto()));document.getElementById('kfDraftDelete')?.addEventListener('click',clearAuto);
    document.getElementById('cancelBtn')?.addEventListener('click',()=>setTimeout(clearAuto,0));
    const publish=document.getElementById('saveBtn');if(publish)publish.addEventListener('click',()=>{[1800,4000,8000].forEach(ms=>setTimeout(()=>{if(!meaningful(capture())){clearAuto();deleteManual(false)}},ms))});
    window.addEventListener('beforeunload',storeAuto);installManualPanel(root)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.KFDraftRecovery={store:storeAuto,read:readAuto,restore:restoreFields,clear:clearAuto,saveManual,loadManual,deleteManual};
})();
