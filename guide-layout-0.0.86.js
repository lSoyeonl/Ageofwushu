/* Легенды Кунг-Фу — guide layout 0.0.86 */
(function(){
  if(window.__KF_GUIDE_LAYOUT_0086__)return;
  window.__KF_GUIDE_LAYOUT_0086__=true;

  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const supported=['beginners.html','taiwan.html','pirate.html'];
  if(!supported.includes(file))return;
  document.body.classList.add('kf-guide-reference');

  const pageMeta={
    'beginners.html':{title:'Справочник новичкам',kind:'guide',root:'#content'},
    'taiwan.html':{title:'О Тайвани',kind:'posts',root:'#posts'},
    'pirate.html':{title:'О Пиратке',kind:'posts',root:'#posts'}
  }[file];

  let sidebar=null, nav=null, toolbar=null, input=null, status=null, backdrop=null;
  let observer=null, mutation=null, query='';

  const norm=s=>String(s||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function articleNodes(){
    const root=document.querySelector(pageMeta.root);
    if(!root)return [];
    return [...root.querySelectorAll(pageMeta.kind==='guide'?'.beginner-card':'.post')];
  }
  function titleOf(card){return card.querySelector('h2')?.childNodes?.[0]?.textContent?.trim()||card.querySelector('h2')?.textContent?.trim()||'Без заголовка'}
  function introOf(card){return card.querySelector('.article-intro,.beginner-collapsed-preview')?.textContent?.trim()||''}
  function ensureId(card,i){
    if(!card.id)card.id=`kf-guide-${file.replace('.html','')}-${i+1}`;
    return card.id;
  }
  function cardText(card){return norm(`${titleOf(card)} ${introOf(card)} ${card.innerText||''}`)}

  function makeToolbar(parent,beforeNode){
    toolbar=document.createElement('div');toolbar.className='kf-guide-toolbar';
    toolbar.innerHTML=`<button class="kf-guide-menu-btn" type="button" aria-label="Открыть оглавление">☰ Оглавление</button>
      <div class="kf-guide-search-wrap"><input class="kf-guide-search" type="search" autocomplete="off" placeholder="Поиск по этому разделу..."><button class="kf-guide-clear" type="button" title="Очистить">×</button></div>
      <div class="kf-guide-search-status"></div>`;
    parent.insertBefore(toolbar,beforeNode||parent.firstChild);
    input=toolbar.querySelector('.kf-guide-search');status=toolbar.querySelector('.kf-guide-search-status');
    toolbar.querySelector('.kf-guide-menu-btn').onclick=toggleSidebar;
    toolbar.querySelector('.kf-guide-clear').onclick=()=>{input.value='';query='';applySearch();input.focus()};
    input.addEventListener('input',()=>{query=norm(input.value);applySearch()});
  }

  function createSidebar(){
    sidebar=document.createElement('aside');sidebar.className='kf-guide-sidebar';
    sidebar.innerHTML=`<div class="kf-guide-side-head"><div class="kf-guide-side-kicker">Раздел</div><div class="kf-guide-side-title">${esc(pageMeta.title)}</div><div class="kf-guide-side-count"></div></div><nav class="kf-guide-nav"></nav>`;
    nav=sidebar.querySelector('.kf-guide-nav');
  }

  function enhanceBeginners(){
    const two=document.querySelector('.two-col'), toc=document.querySelector('.toc'), content=document.querySelector('#content');
    if(!two||!toc||!content)return false;
    sidebar=toc;nav=toc.querySelector('#toc');
    makeToolbar(content.parentElement,content);
    addBackdrop();
    return true;
  }

  function enhancePostPage(){
    const posts=document.querySelector(pageMeta.root), main=document.querySelector('main.wrap');
    if(!posts||!main)return false;
    createSidebar();
    const shell=document.createElement('div');shell.className='kf-guide-shell';
    const maincol=document.createElement('section');maincol.className='kf-guide-main';
    posts.parentNode.insertBefore(shell,posts);shell.append(sidebar,maincol);maincol.appendChild(posts);
    makeToolbar(maincol,posts);
    addBackdrop();
    return true;
  }

  function addBackdrop(){
    backdrop=document.createElement('div');backdrop.className='kf-guide-backdrop';backdrop.onclick=closeSidebar;document.body.appendChild(backdrop);
  }
  function toggleSidebar(){sidebar?.classList.toggle('open');backdrop?.classList.toggle('open',sidebar?.classList.contains('open'))}
  function closeSidebar(){sidebar?.classList.remove('open');backdrop?.classList.remove('open')}

  function rebuildNav(){
    const cards=articleNodes();
    if(pageMeta.kind==='guide'){
      /* В beginners исходное оглавление строит сама страница. Мы только добавляем счётчик и поиск. */
      const h=sidebar?.querySelector('h3');if(h)h.textContent=`Оглавление · ${cards.length}`;
      bindExistingBeginnerLinks(cards);
      updateStatus(cards.length,cards.length);
      return;
    }
    if(!nav)return;
    const rows=cards.map((card,i)=>{
      const id=ensureId(card,i), title=titleOf(card), important=!!card.querySelector('.important-tag');
      return `<a class="kf-guide-link${important?' is-important':''}" href="#${encodeURIComponent(id)}" data-target="${esc(id)}"><span>${esc(title)}</span>${important?'<small>Важный материал</small>':''}</a>`;
    });
    nav.innerHTML=rows.length?rows.join(''):'<div class="kf-guide-empty-nav">Материалов пока нет</div>';
    sidebar.querySelector('.kf-guide-side-count').textContent=`Материалов: ${cards.length}`;
    [...nav.querySelectorAll('.kf-guide-link')].forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault();activateCard(a.dataset.target,true);closeSidebar();
    }));
    setupIntersection();
    applySearch();
  }

  function bindExistingBeginnerLinks(cards){
    const links=[...sidebar.querySelectorAll('.toc-item')];
    links.forEach((a,i)=>{
      const card=cards[i];
      /* точное соответствие берём по заголовку, потому порядок TOC сгруппирован */
      const label=norm(a.querySelector('b')?.textContent||a.textContent);
      const target=cards.find(c=>norm(titleOf(c))===label);
      if(target){ensureId(target,i);a.dataset.target=target.id;a.setAttribute('href','#'+encodeURIComponent(target.id))}
    });
    setupIntersection();applySearch();
  }

  function activateCard(id,scroll=true){
    const card=document.getElementById(id);if(!card)return;
    if(card.classList.contains('is-collapsed')){
      const btn=card.querySelector('.article-expand-btn,.beginner-expand-btn');
      if(btn)btn.click();
      setTimeout(()=>activateCard(id,scroll),80);return;
    }
    setCurrent(id);
    if(scroll)card.scrollIntoView({behavior:'smooth',block:'start'});
    try{history.replaceState(null,'','#'+encodeURIComponent(id))}catch{}
  }

  function setCurrent(id){
    articleNodes().forEach(c=>c.classList.toggle('kf-guide-current',c.id===id));
    if(pageMeta.kind==='guide'){
      sidebar.querySelectorAll('.toc-item').forEach(a=>a.classList.toggle('active',a.dataset.target===id));
    }else{
      nav?.querySelectorAll('.kf-guide-link').forEach(a=>a.classList.toggle('active',a.dataset.target===id));
    }
  }

  function setupIntersection(){
    observer?.disconnect();
    if(!('IntersectionObserver' in window))return;
    observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(visible[0])setCurrent(visible[0].target.id);
    },{rootMargin:'-145px 0px -58% 0px',threshold:[0,.1,.25]});
    articleNodes().forEach(c=>observer.observe(c));
  }

  function applySearch(){
    const cards=articleNodes();let shown=0;
    cards.forEach(card=>{
      const hit=!query||cardText(card).includes(query);card.classList.toggle('kf-guide-filtered',!hit);if(hit)shown++;
    });
    if(pageMeta.kind==='guide'){
      const links=[...sidebar.querySelectorAll('.toc-item')];
      links.forEach(a=>{const card=document.getElementById(a.dataset.target||'');const hit=!query||!!card&&!card.classList.contains('kf-guide-filtered');a.classList.toggle('kf-guide-hidden',!hit)});
      sidebar.querySelectorAll('.toc-group').forEach(group=>{
        let el=group.nextElementSibling,any=false;
        while(el&&!el.classList.contains('toc-group')){if(el.classList.contains('toc-item')&&!el.classList.contains('kf-guide-hidden'))any=true;el=el.nextElementSibling}
        group.classList.toggle('kf-guide-hidden',!any&&!!query);
      });
    }else{
      nav?.querySelectorAll('.kf-guide-link').forEach(a=>{const card=document.getElementById(a.dataset.target);a.classList.toggle('is-hidden',!!query&&(!card||card.classList.contains('kf-guide-filtered')))});
    }
    updateStatus(shown,cards.length);
  }
  function updateStatus(shown,total){if(status)status.textContent=query?`Найдено: ${shown} из ${total}`:`Материалов: ${total}`}

  function openHash(){
    if(!location.hash)return;
    const id=decodeURIComponent(location.hash.slice(1));
    setTimeout(()=>activateCard(id,true),140);
  }

  const ready=pageMeta.kind==='guide'?enhanceBeginners():enhancePostPage();
  if(!ready)return;
  rebuildNav();
  const watch=document.querySelector(pageMeta.root);
  if(watch&&'MutationObserver' in window){
    let timer=0;
    mutation=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(rebuildNav,70)});
    mutation.observe(watch,{childList:true,subtree:true});
  }
  addEventListener('hashchange',openHash);
  addEventListener('keydown',e=>{if(e.key==='Escape')closeSidebar();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'&&input){e.preventDefault();input.focus();input.select()}});
  openHash();
})();
