(()=>{
  const KEY='kungfuSchoolsForcesSects';
  const TYPES=['Школа','Секта','Фракция'];
  const ALIGNMENTS=['Добро','Нейтральные','Зло','Особые'];
  const CONTENT_HINTS={
    'Школа':{neigongs:6,reworks:7},
    'Секта':{neigongs:2,reworks:0},
    'Фракция':{neigongs:1,reworks:0}
  };
  const clone=v=>JSON.parse(JSON.stringify(v));
  function category(v){const s=String(v||'').trim();if(s==='Сила'||s==='Силы'||s==='Фракции')return 'Фракция';if(s==='Секты')return 'Секта';if(s==='Школы')return 'Школа';return TYPES.includes(s)?s:'Школа'}
  function alignment(v){const s=String(v||'').trim();return ALIGNMENTS.includes(s)?s:'Особые'}

  const schoolDefaults=[
    {id:'school-kunlun',category:'Школа',alignment:'Особые',name:'Куньлунь',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/kunlun.png',image:'assets/organizations/schools/kunlun.png'},
    {id:'school-mingjiao',category:'Школа',alignment:'Особые',name:'Минцзяо',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/mingjiao.png',image:'assets/organizations/schools/mingjiao.png'},
    {id:'school-shaolin',category:'Школа',alignment:'Особые',name:'Шаолинь',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/shaolin.png',image:'assets/organizations/schools/shaolin.png'},
    {id:'school-emei',category:'Школа',alignment:'Особые',name:'Эмэй',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/emei.png',image:'assets/organizations/schools/emei.png'},
    {id:'school-tianshan',category:'Школа',alignment:'Особые',name:'Тяньшань',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/tianshan.png',image:'assets/organizations/schools/tianshan.png'},
    {id:'school-wudang',category:'Школа',alignment:'Особые',name:'Удан',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/wudang.png',image:'assets/organizations/schools/wudang.png'},
    {id:'school-gaibang',category:'Школа',alignment:'Особые',name:'Гайбан',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/gaibang.png',image:'assets/organizations/schools/gaibang.png'},
    {id:'school-junzitang',category:'Школа',alignment:'Особые',name:'Цзюньцзы Тан',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/junzitang.png',image:'assets/organizations/schools/junzitang.png'},
    {id:'school-jinyiwei',category:'Школа',alignment:'Особые',name:'Цзиньи Вэй',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/jinyiwei.png',image:'assets/organizations/schools/jinyiwei.png'},
    {id:'school-tangmen',category:'Школа',alignment:'Особые',name:'Танмэнь',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/tangmen.png',image:'assets/organizations/schools/tangmen.png'},
    {id:'school-11',category:'Школа',alignment:'Особые',name:'Школа 11',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/school-11.png',image:'assets/organizations/schools/school-11.png'},
    {id:'school-12',category:'Школа',alignment:'Особые',name:'Школа 12',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/school-12.png',image:'assets/organizations/schools/school-12.png'}
  ];

  const azureArticle=`
    <div class="org-reference-grid">
      <section class="org-reference-card org-reference-text">
        <h2>Условия вступления</h2>
        <h3>Общие требования</h3>
        <p>Нейгун 2; повторное вступление через 24 дня; не в розыске; нет должности.</p>
        <h3>Личные требования</h3>
        <p>Не в браке; игрок без школы или под маской; биржа не «Зло»; не евнух. Дополнительные условия администратор или модератор может дополнять прямо здесь.</p>
        <h3>Боевые требования</h3>
        <p>Ранг «Гроза Царей». Условия и примечания можно редактировать как обычный текст.</p>
      </section>
      <section class="org-reference-card">
        <h2>Карта фракции</h2>
        <img src="assets/organizations/factions/azure-guard/map-crop.png" alt="Карта Лазурной Стражи" style="display:block;width:100%;height:auto;margin:10px auto;border-radius:10px;">
        <p>Обмен Силы: 1133,1250.<br>Обмен Нейгуна: 1133,1263.<br>Спец. скиллы: 1147,1242.</p>
      </section>
      <section class="org-reference-card">
        <h2>Титулы фракции</h2>
        <img src="assets/organizations/factions/azure-guard/titles-crop.png" alt="Титулы Лазурной Стражи" style="display:block;width:100%;height:auto;margin:10px auto;border-radius:10px;">
        <p>Титулы и требования можно дополнять или полностью заменить своим текстом.</p>
      </section>
    </div>
    <section class="org-reference-section"><h2>Предметы Лазурной Стражи</h2><img src="assets/organizations/factions/azure-guard/items.png" alt="Предметы Лазурной Стражи"></section>
    <section class="org-reference-section"><h2>Реворки приёмов</h2><img src="assets/organizations/factions/azure-guard/reworks.png" alt="Реворки приёмов"></section>
    <section class="org-reference-section"><h2>Приёмы Лазурной Стражи</h2><img src="assets/organizations/factions/azure-guard/skills.png" alt="Приёмы Лазурной Стражи"></section>
    <section class="org-reference-section"><h2>Специальные скиллы</h2><img src="assets/organizations/factions/azure-guard/special-skills.png" alt="Специальные скиллы"></section>
    <section class="org-reference-section"><h2>Титульные костюмы</h2><img src="assets/organizations/factions/azure-guard/title-costumes.png" alt="Титульные костюмы"></section>
    <section class="org-reference-section"><h2>Нейгун Лазурной Стражи</h2><img src="assets/organizations/factions/azure-guard/neigong.png" alt="Нейгун Лазурной Стражи"></section>`;

  const azureGuard={
    id:'faction-azure-guard',category:'Фракция',alignment:'Нейтральные',name:'Лазурная Стража',
    location:'Через Ченду',weapon:'Два Кольца',
    thumbImage:'assets/organizations/factions/azure-guard/icon.png',
    image:'assets/organizations/factions/azure-guard/cover.png',
    content:'Лазурная Стража — фракция убийц в лазурных одеяниях. Здесь собраны условия вступления, карта, титулы, предметы, приёмы, специальные навыки, костюмы и нейгун.',
    howToJoin:'Подробные условия размещены в материале ниже.',
    articleHtml:azureArticle,
    links:'',authorRole:'admin'
  };

  const DEFAULTS=[...schoolDefaults,azureGuard].map(x=>({
    ...x,
    content:x.content||'Описание будет добавлено позже.',
    howToJoin:x.howToJoin||'Информация будет добавлена позже.',
    articleHtml:String(x.articleHtml||''),
    links:x.links||'',image:x.image||'',thumbImage:x.thumbImage||x.image||'',authorRole:x.authorRole||'admin'
  }));

  function legacyArticle(x={}){
    const parts=[];
    const section=(title,arr)=>{
      if(!Array.isArray(arr)||!arr.length)return;
      parts.push(`<section class="org-reference-section"><h2>${title}</h2>`);
      for(const row of arr){
        const n=String(row?.name||row?.title||'').trim();const d=String(row?.description||row?.caption||'').trim();const img=String(row?.image||'').trim();
        parts.push(`<div class="org-legacy-row">${img?`<img src="${img}" alt="">`:''}<div>${n?`<h3>${n}</h3>`:''}${d?`<p>${d}</p>`:''}</div></div>`);
      }
      parts.push('</section>');
    };
    section('Нейгуны',x.neigongCards);section('Реворки',x.reworkCards);section('Навыки',x.skillCards);
    if(Array.isArray(x.mediaCards)&&x.mediaCards.length){parts.push('<section class="org-reference-section"><h2>Материалы</h2>');for(const row of x.mediaCards){const t=String(row?.title||row?.name||'').trim(),d=String(row?.caption||row?.description||'').trim(),img=String(row?.image||'').trim();parts.push(`<div class="org-legacy-media">${t?`<h3>${t}</h3>`:''}${img?`<img src="${img}" alt="">`:''}${d?`<p>${d}</p>`:''}</div>`)}parts.push('</section>')}
    return parts.join('');
  }

  function normalize(x={}){
    const image=String(x.image||'').trim();
    const article=String(x.articleHtml||'').trim()||legacyArticle(x);
    return {...x,
      id:x.id??('org-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),
      category:category(x.category),alignment:alignment(x.alignment),
      name:String(x.name||'Без названия'),location:String(x.location||'Не заполнено'),weapon:String(x.weapon||'Не заполнено'),
      content:String(x.content||'Описание будет добавлено позже.'),howToJoin:String(x.howToJoin||'Информация будет добавлена позже.'),
      image,thumbImage:String(x.thumbImage||image||'').trim(),articleHtml:article,links:String(x.links||''),
      authorRole:String(x.authorRole||'admin'),hidden:!!x.hidden
    };
  }
  function readStored(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.map(normalize):[]}catch{return []}}
  function merge(list){const stored=Array.isArray(list)?list.map(normalize):[];const by=new Map(stored.map(x=>[String(x.id),x]));const merged=DEFAULTS.map(d=>by.has(String(d.id))?normalize({...d,...by.get(String(d.id))}):clone(d));const defaults=new Set(DEFAULTS.map(x=>String(x.id)));for(const x of stored)if(!defaults.has(String(x.id)))merged.push(normalize(x));return merged}
  function loadAll(){return merge(readStored())}
  function saveAll(arr){localStorage.setItem(KEY,JSON.stringify((arr||[]).map(normalize)))}
  async function hydrate(){
    if(!window.KFSupabase?.configured)return loadAll();
    try{await window.KFSupabase.ready;const remote=await window.KFSupabase.getStore(KEY,null);if(Array.isArray(remote)){const merged=merge(remote);saveAll(merged);return merged}}catch(e){console.warn('Не удалось загрузить организации из Supabase:',e)}
    return loadAll();
  }
  async function persist(arr){
    const normalized=(arr||[]).map(normalize);saveAll(normalized);
    if(window.KFSupabase?.configured){
      await window.KFSupabase.ready;
      const saved=await window.KFSupabase.saveStore(KEY,normalized);
      const merged=merge(Array.isArray(saved)?saved:normalized);saveAll(merged);return merged;
    }
    return normalized;
  }
  function findById(id,arr=loadAll()){return arr.find(x=>String(x.id)===String(id))||null}
  function contentHints(cat){return clone(CONTENT_HINTS[category(cat)]||CONTENT_HINTS['Школа'])}
  window.KFOrganizations={KEY,DEFAULTS,TYPES,ALIGNMENTS,CONTENT_HINTS,normalize,loadAll,saveAll,hydrate,persist,findById,category,alignment,contentHints};
})();
