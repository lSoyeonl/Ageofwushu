(()=>{
  const D=window.KFOrganizations;if(!D)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let all=D.loadAll(), type='Школа', align='Особые', selectedId=null, staff=false, editingId=null;
  let pendingImage='', pendingThumb='', pendingNeigongs=[], pendingReworks=[], pendingMedia=[];
  const typeLabel={Школа:'Школы',Секта:'Секты',Фракция:'Фракции'};

  function clone(v){return JSON.parse(JSON.stringify(v||[]))}
  function currentCategory(){return D.category($('edCategory')?.value || type)}
  function visible(){return all.filter(x=>!x.hidden&&D.category(x.category)===type&&D.alignment(x.alignment)===align)}
  function current(){const list=visible();let x=list.find(v=>String(v.id)===String(selectedId));if(!x)x=list[0]||null;if(x)selectedId=x.id;return x}
  async function role(){let u=null;try{u=JSON.parse(localStorage.getItem('kungfuCurrentUser')||'null')}catch{};staff=!!u&&['admin','moderator'].includes(u.role||'user');if(window.KFSupabase?.ready){try{await window.KFSupabase.ready;const p=await window.KFSupabase.getCurrentProfile();if(p){staff=['admin','moderator'].includes(p.role||'user');localStorage.setItem('kungfuCurrentUser',JSON.stringify(p))}}catch{}}$('orgStaff').classList.toggle('show',staff)}
  function renderTabs(){document.querySelectorAll('.org-tab').forEach(b=>b.classList.toggle('active',b.dataset.type===type));document.querySelectorAll('.org-align').forEach(b=>b.classList.toggle('active',b.dataset.align===align))}
  function summary(text,max=220){const v=String(text||'').trim().replace(/\s+/g,' ');return v.length>max?v.slice(0,max-1)+'…':v}

  function render(){
    renderTabs();
    const x=current(), list=visible();
    const stage=$('orgStage');
    if(!x){
      stage.innerHTML=`<div class="org-empty"><strong>${typeLabel[type]}</strong>В категории «${esc(align)}» пока нет записей.${staff?'<div style="margin-top:15px"><button class="org-btn primary" id="emptyAdd">+ Добавить</button></div>':''}</div>`;
      if(staff&&$('emptyAdd'))$('emptyAdd').onclick=()=>openEditor(null);
      $('orgThumbs').innerHTML='';
      return;
    }
    const icon=x.thumbImage||x.image||'';
    stage.innerHTML=`<div class="org-grid"><div class="org-copy"><div class="org-copy-head">${icon?`<div class="org-icon-badge"><img src="${esc(icon)}" alt="${esc(x.name)}"></div>`:''}<div class="org-copy-main"><span class="org-kicker">${esc(type)} · ${esc(align)}</span><h2 class="org-name">${esc(x.name)}</h2></div></div><div class="org-facts"><div class="org-fact"><b>Расположение</b><span>${esc(x.location||'Не заполнено')}</span></div><div class="org-fact"><b>Оружие</b><span>${esc(x.weapon||'Не заполнено')}</span></div></div><p class="org-summary">${esc(summary(x.content||'Описание будет добавлено позже.'))}</p><div class="org-actions"><a class="org-btn primary" href="school-detail.html?id=${encodeURIComponent(x.id)}">Подробнее</a>${staff?`<button class="org-btn" id="quickEdit">Редактировать</button>`:''}</div></div><div class="org-image-wrap">${x.image?`<img class="org-image" src="${esc(x.image)}" alt="${esc(x.name)}" loading="eager">`:'<div class="org-empty">Большое изображение не добавлено</div>'}</div></div>`;
    if(staff&&$('quickEdit'))$('quickEdit').onclick=()=>openEditor(x.id);
    $('orgThumbs').innerHTML=list.map(v=>{const thumb=v.thumbImage||v.image||'';return `<button class="org-thumb ${String(v.id)===String(x.id)?'active':''}" data-id="${esc(v.id)}" title="${esc(v.name)}">${thumb?`<img src="${esc(thumb)}" alt="">`:`<div class="thumb-fallback">Нет иконки</div>`}<small>${esc(v.name)}</small></button>`}).join('');
    $('orgThumbs').querySelectorAll('.org-thumb').forEach(b=>b.onclick=()=>{selectedId=b.dataset.id;render()});
  }

  function move(dir){const list=visible();if(!list.length)return;let i=list.findIndex(x=>String(x.id)===String(selectedId));if(i<0)i=0;i=(i+dir+list.length)%list.length;selectedId=list[i].id;render();document.querySelector('.org-thumb.active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})}
  function imgToData(file,max=1600){return new Promise((resolve,reject)=>{if(!file)return resolve('');if(file.size>5*1024*1024)return reject(new Error('Файл больше 5 МБ'));const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',.88))};im.onerror=reject;im.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}

  function renderPreview(imgId,value){const el=$(imgId);if(!el)return;if(value){el.src=value;el.classList.add('show')}else{el.removeAttribute('src');el.classList.remove('show')}}
  function limitConfig(){return D.getLimits(currentCategory())}
  function updateLimitBlocks(){
    const limits=limitConfig();
    $('edNeigongLimit').textContent=`Лимит: ${limits.neigongs}`;
    $('edReworkLimit').textContent=limits.reworks?`Лимит: ${limits.reworks}`:'Для этого типа организации реворки не предусмотрены';
    const reworkSection=$('edReworks').closest('.org-repeat-section');
    reworkSection.style.display=limits.reworks?'block':'none';
    $('addRework').style.display=limits.reworks?'inline-flex':'none';
  }

  function itemRow(kind,item,index){
    const labelMap={neigongs:'Нейгун',reworks:'Реворк',media:'Изображение'};
    const titleLabel=kind==='media'?'Заголовок':'Название';
    const descLabel=kind==='media'?'Подпись / текст':'Описание';
    const title=item.title||item.name||'';
    const desc=kind==='media'?(item.caption||item.description||''):(item.description||item.caption||'');
    return `<div class="org-repeat-item"><div class="org-repeat-top"><div class="org-repeat-title">${labelMap[kind]} ${index+1}</div><button class="org-btn danger" type="button" data-kind="${kind}" data-action="remove" data-index="${index}">Удалить</button></div><div class="org-repeat-grid"><div class="preview-wrap">${item.image?`<img src="${esc(item.image)}" alt="">`:`<div class="preview-empty">Изображение не добавлено</div>`}<div class="org-helper">PNG, JPG, WEBP — до 5 МБ</div><input type="file" accept="image/*" data-kind="${kind}" data-action="image" data-index="${index}" style="margin-top:10px;width:100%"></div><div class="org-repeat-fields"><div><input data-kind="${kind}" data-field="title" data-index="${index}" value="${esc(title)}" placeholder="${titleLabel}"></div><div><textarea data-kind="${kind}" data-field="description" data-index="${index}" placeholder="${descLabel}">${esc(desc)}</textarea></div></div></div></div>`;
  }
  function renderRepeater(kind){
    const map={neigongs:pendingNeigongs,reworks:pendingReworks,media:pendingMedia};
    const targetId={neigongs:'edNeigongs',reworks:'edReworks',media:'edMedia'}[kind];
    const arr=map[kind];
    const target=$(targetId);
    target.innerHTML=`<div class="org-repeat-list">${arr.length?arr.map((item,index)=>itemRow(kind,item,index)).join(''):`<div class="org-helper">${kind==='media'?'Здесь будут храниться изображения фракции, предметов, карт, костюмов и другой визуальный материал.':'Пока ничего не добавлено.'}</div>`}</div>`;
    target.querySelectorAll('[data-field]').forEach(el=>el.oninput=()=>{
      const idx=Number(el.dataset.index); const field=el.dataset.field; const list=map[el.dataset.kind];
      if(!list[idx])return;
      if(kind==='media'){
        if(field==='title')list[idx].title=el.value; else list[idx].caption=el.value;
      }else{
        if(field==='title')list[idx].name=el.value; else list[idx].description=el.value;
      }
    });
    target.querySelectorAll('[data-action="remove"]').forEach(btn=>btn.onclick=()=>{
      const list=map[btn.dataset.kind]; list.splice(Number(btn.dataset.index),1); renderRepeater(btn.dataset.kind);
    });
    target.querySelectorAll('[data-action="image"]').forEach(input=>input.onchange=async()=>{
      try{const idx=Number(input.dataset.index);const list=map[input.dataset.kind];if(!list[idx])return;list[idx].image=await imgToData(input.files[0]);renderRepeater(input.dataset.kind)}catch(e){alert(e.message)}});
  }
  function addRepeater(kind){
    const limits=limitConfig();
    const map={neigongs:pendingNeigongs,reworks:pendingReworks,media:pendingMedia};
    const limit=kind==='neigongs'?limits.neigongs:(kind==='reworks'?limits.reworks:Infinity);
    if(map[kind].length>=limit){alert(`Достигнут лимит для раздела: ${limit}`);return}
    map[kind].push(kind==='media'?{title:'',caption:'',image:''}:{name:'',description:'',image:''});
    renderRepeater(kind);
  }

  function openEditor(id){
    if(!staff)return;
    editingId=id;
    const x=id?all.find(v=>String(v.id)===String(id)):null;
    pendingThumb=x?.thumbImage||x?.image||'';
    pendingImage=x?.image||'';
    pendingNeigongs=clone(x?.neigongCards||[]);
    pendingReworks=clone(x?.reworkCards||[]);
    pendingMedia=clone(x?.mediaCards||[]);
    $('edTitle').textContent=x?'Редактировать организацию':'Добавить организацию';
    $('edCategory').value=x?D.category(x.category):type;
    $('edAlign').value=x?D.alignment(x.alignment):align;
    $('edName').value=x?.name||'';
    $('edLocation').value=x?.location||'';
    $('edWeapon').value=x?.weapon||'';
    $('edContent').value=x?.content||'';
    $('edJoin').value=x?.howToJoin||'';
    $('edImage').value=''; $('edThumb').value='';
    renderPreview('edPreview',pendingImage); renderPreview('edThumbPreview',pendingThumb);
    updateLimitBlocks(); renderRepeater('neigongs'); renderRepeater('reworks'); renderRepeater('media');
    $('orgModal').classList.add('open');
  }
  function closeEditor(){$('orgModal').classList.remove('open');editingId=null;pendingImage='';pendingThumb='';pendingNeigongs=[];pendingReworks=[];pendingMedia=[]}
  async function saveEditor(){
    if(!staff)return;
    const name=$('edName').value.trim();
    if(!name)return alert('Укажите название');
    const old=editingId?all.find(v=>String(v.id)===String(editingId)):null;
    const item=D.normalize({
      ...old,
      id:old?.id||('org-'+Date.now()),
      category:$('edCategory').value,
      alignment:$('edAlign').value,
      name,
      location:$('edLocation').value.trim()||'Не заполнено',
      weapon:$('edWeapon').value.trim()||'Не заполнено',
      content:$('edContent').value.trim()||'Описание будет добавлено позже.',
      howToJoin:$('edJoin').value.trim()||'Информация будет добавлена позже.',
      image:pendingImage,
      thumbImage:pendingThumb,
      neigongCards:pendingNeigongs,
      reworkCards:pendingReworks,
      mediaCards:pendingMedia,
      hidden:false,
      authorRole:old?.authorRole||JSON.parse(localStorage.getItem('kungfuCurrentUser')||'{}').role||'admin'
    });
    if(old){const i=all.indexOf(old);all[i]=item}else all.push(item);
    D.saveAll(all); all=D.loadAll();
    type=item.category; align=item.alignment; selectedId=item.id;
    closeEditor(); render();
  }
  function del(){if(!staff)return;const x=current();if(!x||!confirm(`Удалить «${x.name}»?`))return;const i=all.findIndex(v=>String(v.id)===String(x.id));if(i>=0)all[i]={...all[i],hidden:true};D.saveAll(all);all=D.loadAll();selectedId=null;render()}

  document.querySelectorAll('.org-tab').forEach(b=>b.onclick=()=>{type=b.dataset.type;const entries=all.filter(x=>!x.hidden&&D.category(x.category)===type);align=entries.some(x=>D.alignment(x.alignment)==='Особые')?'Особые':'Добро';selectedId=null;render()});
  document.querySelectorAll('.org-align').forEach(b=>b.onclick=()=>{align=b.dataset.align;selectedId=null;render()});
  $('prevOrg').onclick=()=>move(-1); $('nextOrg').onclick=()=>move(1); $('staffAdd').onclick=()=>openEditor(null); $('staffEdit').onclick=()=>{const x=current();if(x)openEditor(x.id)}; $('staffDelete').onclick=del;
  $('edClose').onclick=closeEditor; $('edCancel').onclick=closeEditor; $('edSave').onclick=saveEditor; $('orgModal').onclick=e=>{if(e.target===$('orgModal'))closeEditor()};
  $('edImage').onchange=async()=>{try{pendingImage=await imgToData($('edImage').files[0]);renderPreview('edPreview',pendingImage)}catch(e){alert(e.message)}};
  $('edThumb').onchange=async()=>{try{pendingThumb=await imgToData($('edThumb').files[0],900);renderPreview('edThumbPreview',pendingThumb)}catch(e){alert(e.message)}};
  $('edCategory').onchange=()=>{updateLimitBlocks();renderRepeater('neigongs');renderRepeater('reworks')};
  $('addNeigong').onclick=()=>addRepeater('neigongs'); $('addRework').onclick=()=>addRepeater('reworks'); $('addMedia').onclick=()=>addRepeater('media');

  const q=new URLSearchParams(location.search); if(q.get('type'))type=D.category(q.get('type')); if(q.get('align'))align=D.alignment(q.get('align')); if(q.get('id'))selectedId=q.get('id');
  role().finally(()=>{all=D.loadAll();render();if(q.get('edit')&&staff)openEditor(q.get('edit'))});
})();
