(()=>{
  const KEY='kungfuSchoolsForcesSects';
  const LIMITS={
    'Школа':{neigongs:6,reworks:7},
    'Секта':{neigongs:2,reworks:0},
    'Фракция':{neigongs:1,reworks:0}
  };
  const TYPES=['Школа','Секта','Фракция'];
  const ALIGNMENTS=['Добро','Нейтральные','Зло','Особые'];
  const clone=v=>JSON.parse(JSON.stringify(v));
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
  const azureGuard={
    id:'faction-azure-guard',
    category:'Фракция',
    alignment:'Нейтральные',
    name:'Лазурная Стража',
    location:'Через Ченду',
    weapon:'Два Кольца',
    thumbImage:'assets/organizations/factions/azure-guard/icon.png',
    image:'assets/organizations/factions/azure-guard/cover.png',
    content:'Лазурная Стража — фракция убийц в лазурных одеяниях. Альтернативные названия: Павильон Синей Одежды и Цинь И. На странице можно хранить подробные правила вступления, предметы, приёмы, нейгун, реворки и дополнительные изображения.',
    howToJoin:'Быстрое вступление возможно через прогресс. Администратор или модератор может заполнять требования к вступлению, нейгуны, реворки и прикладывать инфографику отдельно от основного изображения фракции.',
    neigongCards:[
      {name:'Нейгун Лазурной Стражи',description:'Свойство: Гармония. Максимальный ранг: 72. Всего ОУ: 94.926.570.',image:'assets/organizations/factions/azure-guard/neigong.png'}
    ],
    reworkCards:[],
    skillCards:[],
    mediaCards:[
      {title:'Обзор фракции',caption:'Условия вступления, карта, титулы и общее описание Лазурной Стражи.',image:'assets/organizations/factions/azure-guard/overview.png'},
      {title:'Предметы Лазурной Стражи',caption:'Визуальная подборка предметов и их описаний.',image:'assets/organizations/factions/azure-guard/items.png'},
      {title:'Реворки приёмов',caption:'Экран с реворками и условиями обмена.',image:'assets/organizations/factions/azure-guard/reworks.png'},
      {title:'Приёмы Лазурной Стражи',caption:'Список приёмов и их эффектов.',image:'assets/organizations/factions/azure-guard/skills.png'},
      {title:'Специальные скиллы',caption:'Специальные умения фракции.',image:'assets/organizations/factions/azure-guard/special-skills.png'},
      {title:'Титульные костюмы',caption:'Набор титульных костюмов Лазурной Стражи.',image:'assets/organizations/factions/azure-guard/title-costumes.png'},
      {title:'Нейгун — подробная схема',caption:'Отдельная инфографика по нейгуну.',image:'assets/organizations/factions/azure-guard/neigong.png'}
    ],
    links:'',
    authorRole:'admin'
  };
  const DEFAULTS=[...schoolDefaults,azureGuard].map(x=>({
    ...x,
    content:x.content||'Описание будет добавлено позже.',
    howToJoin:x.howToJoin||'Информация будет добавлена позже.',
    links:x.links||'',
    image:x.image||'',
    thumbImage:x.thumbImage||x.image||'',
    mediaCards:Array.isArray(x.mediaCards)?x.mediaCards:[],
    neigongCards:Array.isArray(x.neigongCards)?x.neigongCards:[],
    reworkCards:Array.isArray(x.reworkCards)?x.reworkCards:[],
    skillCards:Array.isArray(x.skillCards)?x.skillCards:[],
    authorRole:x.authorRole||'admin'
  }));

  function category(v){const s=String(v||'').trim();if(s==='Сила'||s==='Силы'||s==='Фракции')return 'Фракция';if(s==='Секты')return 'Секта';if(s==='Школы')return 'Школа';return TYPES.includes(s)?s:'Школа'}
  function alignment(v){const s=String(v||'').trim();return ALIGNMENTS.includes(s)?s:'Особые'}
  function normalizeCard(x={}){return {name:String(x.name||x.title||'').trim(),title:String(x.title||x.name||'').trim(),description:String(x.description||x.text||'').trim(),caption:String(x.caption||'').trim(),image:String(x.image||'').trim()}}
  function trimArray(list,max){const arr=(Array.isArray(list)?list:[]).map(normalizeCard).filter(x=>x.name||x.title||x.description||x.caption||x.image);return typeof max==='number'?arr.slice(0,max):arr}
  function normalize(x={}){
    const cat=category(x.category);
    const limits=LIMITS[cat]||LIMITS['Школа'];
    const image=String(x.image||'').trim();
    return {
      ...x,
      id:x.id??('org-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),
      category:cat,
      alignment:alignment(x.alignment),
      name:String(x.name||'Без названия'),
      location:String(x.location||'Не заполнено'),
      weapon:String(x.weapon||'Не заполнено'),
      content:String(x.content||'Описание будет добавлено позже.'),
      howToJoin:String(x.howToJoin||'Информация будет добавлена позже.'),
      image,
      thumbImage:String(x.thumbImage||image||'').trim(),
      links:String(x.links||''),
      mediaCards:trimArray(x.mediaCards),
      neigongCards:trimArray(x.neigongCards,limits.neigongs),
      reworkCards:trimArray(x.reworkCards,limits.reworks),
      skillCards:trimArray(x.skillCards),
      authorRole:String(x.authorRole||'admin'),
      hidden:!!x.hidden
    };
  }
  function readStored(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.map(normalize):[]}catch{return []}}
  function loadAll(){const stored=readStored();const by=new Map(stored.map(x=>[String(x.id),x]));const merged=DEFAULTS.map(d=>by.has(String(d.id))?normalize({...d,...by.get(String(d.id))}):clone(d));const defaults=new Set(DEFAULTS.map(x=>String(x.id)));for(const x of stored)if(!defaults.has(String(x.id)))merged.push(normalize(x));return merged;}
  function saveAll(arr){localStorage.setItem(KEY,JSON.stringify((arr||[]).map(normalize)));}
  function findById(id,arr=loadAll()){return arr.find(x=>String(x.id)===String(id))||null}
  function getLimits(cat){return clone(LIMITS[category(cat)]||LIMITS['Школа'])}
  window.KFOrganizations={KEY,DEFAULTS,TYPES,ALIGNMENTS,LIMITS,getLimits,normalize,loadAll,saveAll,findById,category,alignment,normalizeCard};
})();
