/* Легенды Кунг-Фу 0.0.88 — Wiki Reader helpers */
(function(){
  if(window.KFWiki&&window.KFWiki.version==='0.0.88')return;
  const api={version:'0.0.88'};
  api.esc=function(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))};
  api.plain=function(html){const d=document.createElement('div');d.innerHTML=html||'';return (d.innerText||d.textContent||'').replace(/\s+/g,' ').trim()};
  api.itemDate=function(x){
    const n=Number(x?.updatedAt||x?.createdAt||x?.id||0);
    if(!Number.isFinite(n)||n<946684800000||n>Date.now()+86400000)return '';
    try{return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(n))}catch{return ''}
  };
  api.author=function(x){return String(x?.author||'').trim()||((x?.authorRole==='moderator')?'Модератор':'Команда проекта')};
  api.hashId=function(prefix){
    const raw=(location.hash||'').replace(/^#/,'');
    const m=raw.match(new RegExp('^'+prefix+'\\/(.+)$'));
    if(!m)return null;try{return decodeURIComponent(m[1])}catch{return m[1]}
  };
  api.setHash=function(prefix,id,replace=false){
    const h='#'+prefix+'/'+encodeURIComponent(String(id));
    if(location.hash===h)return;
    if(replace)history.replaceState(null,'',h);else history.pushState(null,'',h);
  };
  api.copyLink=async function(prefix,id,btn){
    const url=new URL(location.href);url.hash=prefix+'/'+encodeURIComponent(String(id));
    try{
      await navigator.clipboard.writeText(url.href);
      if(btn){
        const old=btn.textContent;
        btn.textContent='Ссылка скопирована';
        btn.classList.add('copied');
        setTimeout(()=>{btn.textContent=old;btn.classList.remove('copied')},1300)
      }
    }catch{prompt('Скопируйте ссылку',url.href)}
  };
  api.SECTION_STORE='kungfuWikiSections';
  api.defaultSections=function(){return [
    {id:'beginners',href:'beginners.html',icon:'📖',label:'Новичкам'},
    {id:'taiwan',href:'taiwan.html',icon:'🌏',label:'О Тайване'},
    {id:'pirate',href:'pirate.html',icon:'⚙',label:'О пиратке'}
  ]};
  api.isStaff=function(){
    try{const u=JSON.parse(localStorage.getItem('kungfuCurrentUser')||'null');return !!u&&['admin','moderator'].includes(String(u.role||'user'))}catch{return false}
  };
  api.safeSectionHref=function(value){
    const v=String(value||'').trim();
    if(!v)return '#';
    if(/^(https?:)\/\//i.test(v))return v;
    if(/^[a-z0-9_./?#=&%+-]+$/i.test(v)&&!v.startsWith('javascript:'))return v;
    return '#';
  };
  api.normalizeSections=function(value){
    const src=Array.isArray(value)?value:[];
    const rows=src.map((x,i)=>({
      id:String(x?.id||('custom-'+Date.now().toString(36)+'-'+i)).replace(/[^a-z0-9_-]/gi,'').slice(0,64)||('custom-'+i),
      href:api.safeSectionHref(x?.href||'#'),
      icon:String(x?.icon||'◆').trim().slice(0,4)||'◆',
      label:String(x?.label||'Раздел').trim().slice(0,60)||'Раздел'
    })).filter(x=>x.label&&x.href).slice(0,16);
    return rows.length?rows:api.defaultSections();
  };
  api.sectionRows=function(){
    if(Array.isArray(api._sections)&&api._sections.length)return api._sections;
    try{api._sections=api.normalizeSections(JSON.parse(localStorage.getItem(api.SECTION_STORE)||'null'))}catch{api._sections=api.defaultSections()}
    return api._sections;
  };
  api.sectionSwitch=function(active){
    const current=(location.pathname.split('/').pop()||'').toLowerCase();
    return '<div class="wiki-section-switch" data-wiki-active="'+api.esc(active||'')+'">'+api.sectionRows().map(row=>{
      const rowFile=String(row.href||'').split(/[?#]/)[0].split('/').pop().toLowerCase();
      const on=row.id===active||(!active&&rowFile===current)||(rowFile&&rowFile===current);
      return `<a class="${on?'active':''}" href="${api.esc(row.href)}"><span>${api.esc(row.icon)}</span><span>${api.esc(row.label)}</span></a>`
    }).join('')+'</div>';
  };
  api.sectionManagerButton=function(staff=api.isStaff()){return staff?'<button class="wiki-section-manage-btn" type="button" onclick="KFWiki.toggleSectionManager()">⚙ Изменить разделы</button>':''};
  api.sidebarChrome=function(active,placeholder,count,staff=api.isStaff()){
    api._staffOverride=!!staff;
    return `<div class="wiki-close-row"><button type="button" onclick="KFWiki.closeToc()">✕</button></div><div class="wiki-sidebar-title"><span>Оглавление</span><span class="wiki-count" id="wikiCount">${count||0}</span></div>${api.sectionSwitch(active)}${api.sectionManagerButton(staff)}<div class="wiki-section-manager" id="wikiSectionManager"></div><div class="wiki-search-wrap"><input class="wiki-search" id="wikiSearch" autocomplete="off" placeholder="${api.esc(placeholder||'Поиск по разделу…')}"><button class="wiki-search-clear" id="wikiSearchClear" type="button" title="Очистить">×</button></div><div class="wiki-nav-list" id="wikiNav"></div>`;
  };
  api.renderSectionManager=function(){
    const box=document.getElementById('wikiSectionManager');
    if(!box||!(api._staffOverride||api.isStaff()))return;
    const rows=api.sectionRows();
    box.innerHTML=`<div class="wiki-section-manager-head"><b>Разделы оглавления</b><small>Название, значок и ссылка</small></div><div id="wikiSectionRows">${rows.map((r,i)=>api.sectionRowMarkup(r,i)).join('')}</div><div class="wiki-section-manager-actions"><button type="button" onclick="KFWiki.addSectionRow()">+ Добавить</button><button type="button" class="primary" onclick="KFWiki.saveSectionRows()">Сохранить</button><button type="button" onclick="KFWiki.resetSectionRows()">По умолчанию</button></div>`;
  };
  api.sectionRowMarkup=function(r,i){return `<div class="wiki-section-editor-row" data-index="${i}"><input class="wiki-sec-icon" value="${api.esc(r.icon)}" maxlength="4" title="Значок"><input class="wiki-sec-label" value="${api.esc(r.label)}" maxlength="60" placeholder="Название"><input class="wiki-sec-href" value="${api.esc(r.href)}" maxlength="220" placeholder="страница.html"><button class="wiki-sec-remove" type="button" onclick="KFWiki.removeSectionRow(this)" title="Удалить">×</button><input type="hidden" class="wiki-sec-id" value="${api.esc(r.id)}"></div>`};
  api.toggleSectionManager=function(){
    const box=document.getElementById('wikiSectionManager');if(!box)return;
    if(!box.innerHTML.trim())api.renderSectionManager();
    box.classList.toggle('open')
  };
  api.addSectionRow=function(){
    const list=document.getElementById('wikiSectionRows');if(!list)return;
    const i=list.children.length,id='custom-'+Date.now().toString(36)+'-'+i;
    list.insertAdjacentHTML('beforeend',api.sectionRowMarkup({id,icon:'◆',label:'Новый раздел',href:'#'},i))
  };
  api.removeSectionRow=function(btn){btn?.closest('.wiki-section-editor-row')?.remove()};
  api.readSectionRows=function(){
    return [...document.querySelectorAll('#wikiSectionRows .wiki-section-editor-row')].map((row,i)=>({
      id:row.querySelector('.wiki-sec-id')?.value||('custom-'+Date.now().toString(36)+'-'+i),
      icon:row.querySelector('.wiki-sec-icon')?.value||'◆',
      label:row.querySelector('.wiki-sec-label')?.value||'Раздел',
      href:row.querySelector('.wiki-sec-href')?.value||'#'
    }))
  };
  api.refreshSectionSwitch=function(){
    document.querySelectorAll('.wiki-section-switch').forEach(el=>{const active=el.dataset.wikiActive||'';el.outerHTML=api.sectionSwitch(active)});
    const box=document.getElementById('wikiSectionManager');if(box?.classList.contains('open'))api.renderSectionManager()
  };
  api.saveSectionRows=async function(){
    if(!(api._staffOverride||api.isStaff()))return;
    const rows=api.normalizeSections(api.readSectionRows());
    try{
      if(window.KFSupabase?.configured){await KFSupabase.ready;api._sections=api.normalizeSections(await KFSupabase.saveStore(api.SECTION_STORE,rows))}
      else{localStorage.setItem(api.SECTION_STORE,JSON.stringify(rows));api._sections=rows}
      api.refreshSectionSwitch();
      const box=document.getElementById('wikiSectionManager');if(box){box.classList.add('open');api.renderSectionManager()}
    }catch(e){alert(e?.message||'Не удалось сохранить оглавление разделов')}
  };
  api.resetSectionRows=function(){
    const list=document.getElementById('wikiSectionRows');if(!list)return;
    list.innerHTML=api.defaultSections().map((r,i)=>api.sectionRowMarkup(r,i)).join('')
  };
  api.loadSectionConfig=async function(){
    let rows=null;
    try{
      if(window.KFSupabase?.configured){await KFSupabase.ready;rows=await KFSupabase.getStore(api.SECTION_STORE,null)}
      if(!rows)rows=JSON.parse(localStorage.getItem(api.SECTION_STORE)||'null')
    }catch{}
    api._sections=api.normalizeSections(rows||api.defaultSections());
    api.refreshSectionSwitch();
    return api._sections
  };
  api.toggleToc=function(){document.body.classList.toggle('wiki-toc-open')};
  api.closeToc=function(){document.body.classList.remove('wiki-toc-open')};
  api.ensureBackdrop=function(){
    if(document.querySelector('.wiki-toc-backdrop'))return;
    const b=document.createElement('div');
    b.className='wiki-toc-backdrop';
    b.onclick=api.closeToc;
    document.body.appendChild(b)
  };
  api.mobileButton=function(before){
    if(document.querySelector('.wiki-mobile-toggle'))return;
    const b=document.createElement('button');
    b.className='wiki-mobile-toggle';
    b.type='button';
    b.textContent='☰ Оглавление и поиск';
    b.onclick=api.toggleToc;
    before.parentNode.insertBefore(b,before)
  };
  api.bindCommon=function(){
    if(document.body.dataset.wikiCommonBound)return;
    document.body.dataset.wikiCommonBound='1';
    document.body.classList.add('kf-wiki-reader');
    api.ensureBackdrop();
    const bar=document.createElement('div');
    bar.className='wiki-progress';
    document.body.appendChild(bar);
    const update=()=>{
      const d=document.documentElement;
      const max=Math.max(1,d.scrollHeight-innerHeight);
      bar.style.width=Math.min(100,scrollY/max*100)+'%'
    };
    addEventListener('scroll',update,{passive:true});
    update();
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
        const s=document.getElementById('wikiSearch');
        if(s){e.preventDefault();s.focus();s.select();api.toggleTocIfMobile()}
      }
      if(e.key==='Escape')api.closeToc()
    });
    addEventListener('kf-public-data-change',e=>{if(e.detail&&e.detail.key===api.SECTION_STORE){api._sections=null;api.loadSectionConfig()}});
    addEventListener('kf-supabase-synced',e=>{if(e.detail&&e.detail.key===api.SECTION_STORE){api._sections=null;api.loadSectionConfig()}})
  };
  api.toggleTocIfMobile=function(){if(matchMedia('(max-width:900px)').matches)document.body.classList.add('wiki-toc-open')};

  api.parseTocLines=function(value){
    const rows=Array.isArray(value)?value:String(value||'').split(/\r?\n/);
    return rows.map(x=>String(x||'').trim()).filter(Boolean).slice(0,40)
  };
  api.tocMode=function(x){
    const mode=String(x?.tocMode||'auto').toLowerCase();
    return ['auto','manual','none'].includes(mode)?mode:'auto'
  };
  api.tocEditorMarkup=function(prefix='wiki'){
    return `<div class="wiki-toc-editor-box">
      <div class="field"><label>Оглавление статьи</label><select id="${prefix}TocMode"><option value="auto">Автоматически по заголовкам</option><option value="manual">Настроить вручную</option><option value="none">Не показывать</option></select></div>
      <div class="field wiki-toc-manual-field" id="${prefix}TocManualWrap"><label>Пункты оглавления — по одному на строку</label><textarea id="${prefix}TocItems" rows="5" placeholder="Предисловие\nОсновные понятия\nПеред началом"></textarea><div class="muted" style="font-size:11px;margin-top:5px">Строки можно добавлять, удалять и менять местами. Для ссылки пункт должен совпадать с заголовком H2/H3/H4 в содержании.</div></div>
      <label class="checkline wiki-toc-list-toggle"><input id="${prefix}ShowInToc" type="checkbox" checked> <span>Показывать материал в левом оглавлении</span></label>
    </div>`
  };
  api.bindTocEditor=function(prefix='wiki'){
    const mode=document.getElementById(prefix+'TocMode'),wrap=document.getElementById(prefix+'TocManualWrap');
    if(!mode||!wrap)return;
    const sync=()=>{wrap.style.display=mode.value==='manual'?'block':'none'};
    if(!mode.dataset.wikiTocBound){mode.addEventListener('change',sync);mode.dataset.wikiTocBound='1'}
    sync()
  };
  api.readTocEditor=function(prefix='wiki'){
    return {
      tocMode:document.getElementById(prefix+'TocMode')?.value||'auto',
      tocItems:api.parseTocLines(document.getElementById(prefix+'TocItems')?.value||''),
      showInToc:document.getElementById(prefix+'ShowInToc')?.checked!==false
    }
  };
  api.fillTocEditor=function(x,prefix='wiki'){
    const mode=document.getElementById(prefix+'TocMode'),items=document.getElementById(prefix+'TocItems'),show=document.getElementById(prefix+'ShowInToc');
    if(mode)mode.value=api.tocMode(x);
    if(items)items.value=api.parseTocLines(x?.tocItems||[]).join('\n');
    if(show)show.checked=x?.showInToc!==false;
    api.bindTocEditor(prefix)
  };
  api.resetTocEditor=function(prefix='wiki'){
    const mode=document.getElementById(prefix+'TocMode'),items=document.getElementById(prefix+'TocItems'),show=document.getElementById(prefix+'ShowInToc');
    if(mode)mode.value='auto';if(items)items.value='';if(show)show.checked=true;api.bindTocEditor(prefix)
  };

  api.decorateHeadings=function(article,options={}){
    if(!article)return;
    const body=article.querySelector('.rich-output');
    if(!body)return;
    article.querySelector('.wiki-on-page')?.remove();
    const mode=api.tocMode(options);
    if(mode==='none')return;
    const hs=[...body.querySelectorAll('h2,h3,h4')].filter(x=>(x.textContent||'').trim());
    if(!hs.length)return;
    hs.forEach((h,i)=>{if(!h.id)h.id='wiki-heading-'+i+'-'+Math.random().toString(36).slice(2,6)});
    let chosen=[];
    if(mode==='manual'){
      const wanted=api.parseTocLines(options?.tocItems||[]);
      const used=new Set();
      const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
      wanted.forEach(label=>{
        const n=norm(label);
        let idx=hs.findIndex((h,i)=>!used.has(i)&&norm(h.textContent)===n);
        if(idx<0)idx=hs.findIndex((h,i)=>!used.has(i)&&(norm(h.textContent).includes(n)||n.includes(norm(h.textContent))));
        if(idx>=0){used.add(idx);chosen.push({h:hs[idx],label})}
      });
    }else{
      if(hs.length<2)return;
      chosen=hs.map(h=>({h,label:(h.textContent||'').trim()}))
    }
    if(!chosen.length)return;
    const d=document.createElement('details');
    d.className='wiki-on-page';d.open=true;
    d.innerHTML='<summary>На этой странице</summary><div class="wiki-on-page-links">'+chosen.map(({h,label})=>`<a href="#${h.id}" data-local-heading="1">${api.esc(label)}</a>`).join('')+'</div>';
    body.parentNode.insertBefore(d,body);
    d.querySelectorAll('[data-local-heading]').forEach(a=>a.onclick=e=>{
      e.preventDefault();document.getElementById(a.getAttribute('href').slice(1))?.scrollIntoView({behavior:'smooth',block:'start'})
    })
  };
  window.KFWiki=api;
})();
