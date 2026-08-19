(()=>{
  const D=window.KFOrganizations;if(!D)return;
  const SECTIONS=[
    {key:'neigongs',title:'Нейгуны',add:'Добавить нейгун',singular:'нейгун'},
    {key:'specialEffects',title:'Специальные эффекты',add:'Добавить эффект',singular:'эффект'},
    {key:'specialSkills',title:'Специальные навыки',add:'Добавить навык',singular:'навык'},
    {key:'techniques',title:'Приёмы',add:'Добавить приём',singular:'приём'},
    {key:'reworks',title:'Реворки приёмов',add:'Добавить реворк',singular:'реворк'}
  ];
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let all=D.loadAll(),orgId=new URLSearchParams(location.search).get('id');
  let item=D.findById(orgId,all),staff=false,editingSection='',editingItemId='',pendingImage='';

  function cleanRich(html){
    const t=document.createElement('template');t.innerHTML=html||'';
    t.content.querySelectorAll('script,iframe,object,embed,style,link').forEach(x=>x.remove());
    t.content.querySelectorAll('*').forEach(el=>[...el.attributes].forEach(a=>{
      if(/^on/i.test(a.name))el.removeAttribute(a.name);
      if((a.name==='href'||a.name==='src')&&/^javascript:/i.test(a.value))el.removeAttribute(a.name);
      if(a.name==='style'){
        const cleaned=String(a.value||'').split(';').map(x=>x.trim()).filter(Boolean).filter(rule=>{
          const prop=(rule.split(':')[0]||'').trim().toLowerCase();
          if(['overflow','overflow-x','overflow-y','max-height','min-height','position','top','right','bottom','left'].includes(prop))return false;
          if(prop==='height'&&el.tagName!=='IMG')return false;
          return true;
        }).join('; ');
        if(cleaned)el.setAttribute('style',cleaned);else el.removeAttribute('style');
      }
    }));
    return t.innerHTML;
  }
  function safeSrc(v){v=String(v||'').trim();if(!v||/^javascript:/i.test(v))return'';return v}
  window.orgCleanRich=cleanRich;
  window.fmt=(cmd,val=null)=>{document.execCommand(cmd,false,val);$('dRich')?.focus()};
  window.insertTable=()=>{let rows=parseInt(prompt('Количество строк таблицы','3'),10),cols=parseInt(prompt('Количество колонок','3'),10);if(!Number.isFinite(rows)||!Number.isFinite(cols)||rows<1||cols<1||rows>30||cols>12)return;let html='<table><tbody>';for(let r=0;r<rows;r++){html+='<tr>';for(let c=0;c<cols;c++)html+=`<td>${r===0?'Заголовок':'Текст'}</td>`;html+='</tr>'}html+='</tbody></table><p><br></p>';$('dRich').focus();document.execCommand('insertHTML',false,html)};

  function content(){return D.normalizeSections(item?.detailContent||{})}
  function limitFor(key){return key==='neigongs'?D.neigongLimit(item?.category||'Фракция'):Infinity}
  function sectionMeta(key){return SECTIONS.find(x=>x.key===key)||SECTIONS[0]}
  function sectionCountLabel(key,count){const max=limitFor(key);return Number.isFinite(max)?`${count} / ${max}`:'без ограничений'}

  function renderEntry(key,row,index){
    const img=safeSrc(row.image),body=cleanRich(row.descriptionHtml||''),stats=String(row.statsText||'').trim();
    const hasLeft=!!(img||stats);
    return `<article class="org-content-entry" data-entry="${esc(row.id)}">
      <div class="org-content-entry-head"><div class="org-content-number">${index+1}</div><h3>${esc(row.title||'Без названия')}</h3>${staff?`<div class="org-entry-actions"><button class="org-btn" type="button" data-edit-section="${esc(key)}" data-edit-id="${esc(row.id)}">Редактировать</button><button class="org-btn danger" type="button" data-delete-section="${esc(key)}" data-delete-id="${esc(row.id)}">Удалить</button></div>`:''}</div>
      <div class="org-content-entry-main ${hasLeft?'':'no-image'}">${hasLeft?`<div class="org-content-media">${img?`<div class="org-content-image"><img src="${esc(img)}" alt="${esc(row.title||'')}"></div>`:''}${stats?`<div class="org-content-stats"><div class="org-content-stats-title">Статы</div><div class="org-content-stats-text">${esc(stats).replace(/\n/g,'<br>')}</div></div>`:''}</div>`:''}${body?`<div class="org-content-body rich-output">${body}</div>`:`<div class="org-content-body org-content-empty-text">Описание не добавлено.</div>`}</div>
    </article>`;
  }

  function renderSection(meta,arr){
    const max=limitFor(meta.key),atLimit=Number.isFinite(max)&&arr.length>=max;
    return `<section class="org-panel org-content-section" id="section-${esc(meta.key)}">
      <div class="org-content-section-head"><div><h2>${esc(meta.title)}</h2><div class="org-content-section-count">${esc(sectionCountLabel(meta.key,arr.length))}</div></div>${staff?`<button class="org-btn primary" type="button" data-add-section="${esc(meta.key)}" ${atLimit?'disabled':''}>${atLimit?'Лимит достигнут':'+ '+esc(meta.add)}</button>`:''}</div>
      <div class="org-content-stack">${arr.length?arr.map((row,i)=>renderEntry(meta.key,row,i)).join(''):`<div class="org-section-empty">Пока ничего не добавлено.${staff?' Используйте кнопку добавления выше.':''}</div>`}</div>
    </section>`;
  }

  function bindRenderedActions(){
    document.querySelectorAll('[data-add-section]').forEach(b=>b.onclick=()=>openEditor(b.dataset.addSection,''));
    document.querySelectorAll('[data-edit-section]').forEach(b=>b.onclick=()=>openEditor(b.dataset.editSection,b.dataset.editId));
    document.querySelectorAll('[data-delete-section]').forEach(b=>b.onclick=()=>deleteEntry(b.dataset.deleteSection,b.dataset.deleteId));
    if(staff&&$('detailCardEdit'))$('detailCardEdit').onclick=()=>{location.href=`schools.html?type=${encodeURIComponent(item.category)}&align=${encodeURIComponent(item.alignment)}&id=${encodeURIComponent(item.id)}&edit=${encodeURIComponent(item.id)}`};
  }

  function applyDetailBackground(){
    const bg=safeSrc(item?.detailBackground||'');
    if(bg){
      document.body.classList.add('org-detail-custom-bg');
      document.body.style.setProperty('--org-detail-bg-url',`url("${bg.replace(/"/g,'%22')}")`);
    }else{
      document.body.classList.remove('org-detail-custom-bg');
      document.body.style.removeProperty('--org-detail-bg-url');
    }
  }

  function render(){
    if(!item||item.hidden){$('detailApp').innerHTML='<div class="detail-empty">Материал не найден.</div>';return}
    applyDetailBackground();
    document.title=`${item.name} — Легенды Кунг-Фу`;
    const icon=safeSrc(item.thumbImage||item.image||''),hero=safeSrc(item.image||''),sections=content(),features=String(item.features||'').trim();
    $('detailApp').innerHTML=`<div class="detail-breadcrumb"><a href="schools.html?type=${encodeURIComponent(item.category)}&align=${encodeURIComponent(item.alignment)}">Школы, секты и фракции</a><span>›</span><span>${esc(item.name)}</span></div>
      <section class="detail-hero org-panel"><div class="detail-copy"><div class="detail-copy-head">${icon?`<div class="org-icon-badge"><img src="${esc(icon)}" alt=""></div>`:''}<div><span class="org-kicker">${esc(item.category)} · ${esc(item.alignment)}</span><h1>${esc(item.name)}</h1></div></div><div class="detail-facts"><div><b>Локация</b><span>${esc(item.location||'Не заполнено')}</span></div><div><b>Оружия</b><span>${esc(item.weapon||'Не заполнено')}</span></div></div>${features?`<div class="detail-feature-box"><b>Особенности</b><span>${esc(features)}</span></div>`:''}<p class="detail-intro">${esc(item.content||'Описание будет добавлено позже.').replace(/\n/g,'<br>')}</p>${staff?'<div class="org-actions"><button class="org-btn" id="detailCardEdit" type="button">Редактировать карточку</button></div>':''}</div><div class="detail-image">${hero?`<img src="${esc(hero)}" alt="${esc(item.name)}">`:''}</div></section>
      <div class="org-content-all">${SECTIONS.map(meta=>renderSection(meta,sections[meta.key]||[])).join('')}</div>
      <div class="detail-bottom"><a class="org-btn" href="schools.html?type=${encodeURIComponent(item.category)}&align=${encodeURIComponent(item.alignment)}">← Вернуться к витрине</a></div>`;
    bindRenderedActions();
  }

  async function role(){let u=null;try{u=JSON.parse(localStorage.getItem('kungfuCurrentUser')||'null')}catch{};staff=!!u&&['admin','moderator'].includes(u.role||'user');if(window.KFSupabase?.ready){try{await window.KFSupabase.ready;const p=await window.KFSupabase.getCurrentProfile();if(p)staff=['admin','moderator'].includes(p.role||'user')}catch{}}}
  function imgToData(file,max=2200){return window.KFImageTools?.process?window.KFImageTools.process(file,{maxSide:max,preserveBytes:4.5*1024*1024,targetBytes:3.4*1024*1024}):new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
  function preview(value){const p=$('dItemPreview');if(value){p.src=value;p.classList.add('show')}else{p.removeAttribute('src');p.classList.remove('show')}}

  function openEditor(sectionKey,rowId=''){
    if(!staff||!item)return;
    const meta=sectionMeta(sectionKey),sections=content(),rows=sections[sectionKey]||[];
    if(!rowId&&rows.length>=limitFor(sectionKey)){alert(`Для раздела «${meta.title}» достигнут лимит.`);return}
    const row=rowId?rows.find(x=>String(x.id)===String(rowId)):null;
    editingSection=sectionKey;editingItemId=rowId||'';pendingImage=row?.image||'';
    $('dSectionLabel').textContent=meta.title;
    $('dEditorTitle').textContent=row?`Редактировать: ${meta.singular}`:`Добавить: ${meta.singular}`;
    $('dItemTitle').value=row?.title||'';
    $('dItemImage').value='';
    $('dItemStats').value=row?.statsText||'';
    $('dRich').innerHTML=row?.descriptionHtml||'';
    $('dSaveStatus').textContent='';
    preview(pendingImage);
    $('detailModal').classList.add('open');
    setTimeout(()=>{window.KFImageTools?.bindEditors?.();$('dItemTitle').focus()},0);
  }
  function closeEditor(){$('detailModal').classList.remove('open');editingSection='';editingItemId='';pendingImage='';$('dSaveStatus').textContent=''}

  async function saveEditor(){
    if(!staff||!item||!editingSection)return;
    const title=$('dItemTitle').value.trim();if(!title)return alert('Укажите название.');
    const sections=content(),rows=sections[editingSection]||[];
    if(!editingItemId&&rows.length>=limitFor(editingSection))return alert('Достигнут лимит нейгунов для этого типа организации.');
    const row=D.normalizeDetailItem({id:editingItemId||undefined,title,image:pendingImage,statsText:$('dItemStats').value.trim(),descriptionHtml:cleanRich($('dRich').innerHTML)});
    const idx=rows.findIndex(x=>String(x.id)===String(editingItemId));if(idx>=0)rows[idx]=row;else rows.push(row);sections[editingSection]=rows;
    const orgIndex=all.findIndex(x=>String(x.id)===String(item.id));if(orgIndex<0)return;
    all[orgIndex]=D.normalize({...item,detailContent:sections,authorRole:item.authorRole||JSON.parse(localStorage.getItem('kungfuCurrentUser')||'{}').role||'admin'});
    $('dSave').disabled=true;$('dSaveStatus').textContent='Сохраняю…';
    try{all=await D.persist(all);item=D.findById(orgId,all);$('dSaveStatus').textContent='Сохранено.';setTimeout(()=>{closeEditor();render()},220)}catch(e){$('dSaveStatus').textContent='Ошибка сохранения.';alert(e.message||'Не удалось сохранить материал')}finally{$('dSave').disabled=false}
  }

  async function deleteEntry(sectionKey,rowId){
    if(!staff||!item)return;const meta=sectionMeta(sectionKey);if(!confirm(`Удалить ${meta.singular}?`))return;
    const sections=content();sections[sectionKey]=(sections[sectionKey]||[]).filter(x=>String(x.id)!==String(rowId));
    const orgIndex=all.findIndex(x=>String(x.id)===String(item.id));if(orgIndex<0)return;all[orgIndex]=D.normalize({...item,detailContent:sections});
    try{all=await D.persist(all);item=D.findById(orgId,all);render()}catch(e){alert(e.message||'Не удалось удалить материал')}
  }

  $('dClose').onclick=closeEditor;$('dCancel').onclick=closeEditor;$('dSave').onclick=saveEditor;$('detailModal').onclick=e=>{if(e.target===$('detailModal'))closeEditor()};
  $('dItemImage').onchange=async()=>{try{pendingImage=await imgToData($('dItemImage').files[0]);preview(pendingImage)}catch(e){alert(e.message)}};
  $('dRemoveImage').onclick=()=>{pendingImage='';$('dItemImage').value='';preview('')};

  Promise.all([role(),D.hydrate().then(v=>{all=v;item=D.findById(orgId,all)})]).finally(render);
})();
