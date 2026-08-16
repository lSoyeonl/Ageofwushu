/* Легенды Кунг-Фу 0.0.87 — Wiki Reader helpers */
(function(){
  if(window.KFWiki&&window.KFWiki.version==='0.0.87')return;
  const api={version:'0.0.87'};
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
  api.sectionSwitch=function(active){
    const rows=[
      ['beginners','beginners.html','📖','Новичкам'],
      ['taiwan','taiwan.html','🌏','О Тайване'],
      ['pirate','pirate.html','☠','О пиратке']
    ];
    return '<div class="wiki-section-switch">'+rows.map(([id,href,ico,label])=>`<a class="${id===active?'active':''}" href="${href}"><span>${ico}</span><span>${label}</span></a>`).join('')+'</div>';
  };
  api.sidebarChrome=function(active,placeholder,count){
    return `<div class="wiki-close-row"><button type="button" onclick="KFWiki.closeToc()">✕</button></div><div class="wiki-sidebar-title"><span>Оглавление</span><span class="wiki-count" id="wikiCount">${count||0}</span></div>${api.sectionSwitch(active)}<div class="wiki-search-wrap"><input class="wiki-search" id="wikiSearch" autocomplete="off" placeholder="${api.esc(placeholder||'Поиск по разделу…')}"><button class="wiki-search-clear" id="wikiSearchClear" type="button" title="Очистить">×</button></div><div class="wiki-nav-list" id="wikiNav"></div>`;
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
    })
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
