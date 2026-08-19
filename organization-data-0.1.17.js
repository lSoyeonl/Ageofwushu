(()=>{
  const KEY='kungfuSchoolsForcesSects';
  const TYPES=['Школа','Секта','Фракция'];
  const ALIGNMENTS=['Добро','Нейтральные','Зло','Особые'];
  const NEIGONG_LIMITS={'Школа':6,'Секта':2,'Фракция':1};
  const SECTION_KEYS=['neigongs','specialEffects','specialSkills','techniques','reworks','important'];
  const clone=v=>JSON.parse(JSON.stringify(v));

  function category(v){const s=String(v||'').trim();if(s==='Сила'||s==='Силы'||s==='Фракции')return 'Фракция';if(s==='Секты')return 'Секта';if(s==='Школы')return 'Школа';return TYPES.includes(s)?s:'Школа'}
  function alignment(v){const s=String(v||'').trim();return ALIGNMENTS.includes(s)?s:'Особые'}
  function itemId(prefix='item'){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
  function normalizeDetailItem(x={}){
    return {
      id:String(x.id||itemId('detail')),
      title:String(x.title||x.name||'').trim(),
      image:String(x.image||'').trim(),
      statsText:String(x.statsText||x.stats||'').trim(),
      descriptionHtml:String(x.descriptionHtml||x.description||x.caption||'').trim()
    };
  }
  function normalizeSections(v={}){
    const out={};
    for(const key of SECTION_KEYS) out[key]=(Array.isArray(v?.[key])?v[key]:[]).map(normalizeDetailItem);
    return out;
  }

  const schoolDefaults=[
    {id:'school-kunlun',category:'Школа',alignment:'Особые',name:'Куньлунь',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/kunlun.webp',image:'assets/organizations/schools/kunlun.webp'},
    {id:'school-mingjiao',category:'Школа',alignment:'Особые',name:'Минцзяо',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/mingjiao.webp',image:'assets/organizations/schools/mingjiao.webp'},
    {id:'school-shaolin',category:'Школа',alignment:'Особые',name:'Шаолинь',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/shaolin.webp',image:'assets/organizations/schools/shaolin.webp'},
    {id:'school-emei',category:'Школа',alignment:'Особые',name:'Эмэй',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/emei.webp',image:'assets/organizations/schools/emei.webp'},
    {id:'school-tianshan',category:'Школа',alignment:'Особые',name:'Тяньшань',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/tianshan.webp',image:'assets/organizations/schools/tianshan.webp'},
    {id:'school-wudang',category:'Школа',alignment:'Особые',name:'Удан',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/wudang.webp',image:'assets/organizations/schools/wudang.webp'},
    {id:'school-gaibang',category:'Школа',alignment:'Особые',name:'Гайбан',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/gaibang.webp',image:'assets/organizations/schools/gaibang.webp'},
    {id:'school-junzitang',category:'Школа',alignment:'Особые',name:'Цзюньцзы Тан',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/junzitang.webp',image:'assets/organizations/schools/junzitang.webp'},
    {id:'school-jinyiwei',category:'Школа',alignment:'Особые',name:'Цзиньи Вэй',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/jinyiwei.webp',image:'assets/organizations/schools/jinyiwei.webp'},
    {id:'school-tangmen',category:'Школа',alignment:'Особые',name:'Танмэнь',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/tangmen.webp',image:'assets/organizations/schools/tangmen.webp'},
    {id:'school-11',category:'Школа',alignment:'Особые',name:'Школа 11',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/school-11.webp',image:'assets/organizations/schools/school-11.webp'},
    {id:'school-12',category:'Школа',alignment:'Особые',name:'Школа 12',location:'Не заполнено',weapon:'Не заполнено',thumbImage:'assets/organizations/schools/school-12.webp',image:'assets/organizations/schools/school-12.webp'}
  ];

  const azureGuard={
    id:'faction-azure-guard',category:'Фракция',alignment:'Нейтральные',name:'Лазурная Стража',
    location:'Через Ченду',weapon:'Два Кольца',
    features:'Скрытность, ближний бой, убийства в лазурных одеяниях.',
    thumbImage:'assets/organizations/factions/azure-guard/icon.webp',
    image:'assets/organizations/factions/azure-guard/cover.webp',
    content:'Лазурная Стража — фракция убийц в лазурных одеяниях с навыками ближнего боя.',
    howToJoin:'Подробные условия можно оформить отдельными блоками ниже.',
    detailContent:{
      neigongs:[{
        id:'azure-neigong-1',title:'Нейгун Лазурной Стражи',image:'assets/organizations/factions/azure-guard/neigong.webp',
        descriptionHtml:'<p><span style="color:#f4d58a"><b>Свойство:</b></span> Гармония. <span style="color:#7ee6a0"><b>Максимальный ранг:</b></span> 72.</p>'
      }],
      specialEffects:[{
        id:'azure-effect-1',title:'Специальные эффекты',image:'assets/organizations/factions/azure-guard/special-skills.webp',
        descriptionHtml:'<p>Здесь администратор или модератор может хранить любое количество специальных эффектов, изображений и пояснений.</p>'
      }],
      specialSkills:[{
        id:'azure-special-1',title:'Специальные навыки',image:'assets/organizations/factions/azure-guard/special-skills.webp',
        descriptionHtml:'<p>Навыки добавляются отдельными блоками: изображение слева и форматируемое описание справа.</p>'
      }],
      techniques:[{
        id:'azure-technique-1',title:'Приёмы Лазурной Стражи',image:'assets/organizations/factions/azure-guard/skills.webp',
        descriptionHtml:'<p>Количество приёмов не ограничено.</p>'
      }],
      reworks:[{
        id:'azure-rework-1',title:'Реворки приёмов',image:'assets/organizations/factions/azure-guard/reworks.webp',
        descriptionHtml:'<p>Реворки добавляются в любом количестве с отдельным изображением и форматируемым описанием.</p>'
      }],
      important:[]
    },
    links:'',authorRole:'admin'
  };

  const DEFAULTS=[...schoolDefaults,azureGuard].map(x=>({
    ...x,
    content:x.content||'Описание будет добавлено позже.',
    howToJoin:x.howToJoin||'Информация будет добавлена позже.',
    features:String(x.features||''),
    detailBackground:String(x.detailBackground||''),
    image:String(x.image||''),thumbImage:String(x.thumbImage||x.image||''),
    detailContent:normalizeSections(x.detailContent||{}),
    links:String(x.links||''),authorRole:x.authorRole||'admin'
  }));

  function legacySections(x={}){
    const out=normalizeSections(x.detailContent||{});
    if(!out.neigongs.length&&Array.isArray(x.neigongCards))out.neigongs=x.neigongCards.map(normalizeDetailItem);
    if(!out.reworks.length&&Array.isArray(x.reworkCards))out.reworks=x.reworkCards.map(normalizeDetailItem);
    if(!out.techniques.length&&Array.isArray(x.skillCards))out.techniques=x.skillCards.map(normalizeDetailItem);
    if(!out.specialEffects.length&&Array.isArray(x.mediaCards))out.specialEffects=x.mediaCards.map(normalizeDetailItem);
    return out;
  }

  function normalize(x={}){
    const image=String(x.image||'').trim();
    return {...x,
      id:x.id??('org-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),
      category:category(x.category),alignment:alignment(x.alignment),
      name:String(x.name||'Без названия'),location:String(x.location||'Не заполнено'),weapon:String(x.weapon||'Не заполнено'),
      features:String(x.features||'').trim(),
      detailBackground:String(x.detailBackground||'').trim(),
      content:String(x.content||'Описание будет добавлено позже.'),howToJoin:String(x.howToJoin||'Информация будет добавлена позже.'),
      image,thumbImage:String(x.thumbImage||image||'').trim(),detailContent:legacySections(x),links:String(x.links||''),
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
    if(window.KFSupabase?.configured){await window.KFSupabase.ready;const saved=await window.KFSupabase.saveStore(KEY,normalized);const merged=merge(Array.isArray(saved)?saved:normalized);saveAll(merged);return merged}
    return normalized;
  }
  function findById(id,arr=loadAll()){return arr.find(x=>String(x.id)===String(id))||null}
  function neigongLimit(cat){return NEIGONG_LIMITS[category(cat)]||1}
  window.KFOrganizations={KEY,DEFAULTS,TYPES,ALIGNMENTS,NEIGONG_LIMITS,SECTION_KEYS,normalizeDetailItem,normalizeSections,normalize,loadAll,saveAll,hydrate,persist,findById,category,alignment,neigongLimit};
})();
