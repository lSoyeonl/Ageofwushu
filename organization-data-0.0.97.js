(()=>{
  const KEY='kungfuSchoolsForcesSects';
  const DEFAULTS=[
    {id:'school-kunlun',category:'Школа',alignment:'Особые',name:'Куньлунь',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/kunlun.png'},
    {id:'school-mingjiao',category:'Школа',alignment:'Особые',name:'Минцзяо',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/mingjiao.png'},
    {id:'school-shaolin',category:'Школа',alignment:'Особые',name:'Шаолинь',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/shaolin.png'},
    {id:'school-emei',category:'Школа',alignment:'Особые',name:'Эмэй',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/emei.png'},
    {id:'school-tianshan',category:'Школа',alignment:'Особые',name:'Тяньшань',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/tianshan.png'},
    {id:'school-wudang',category:'Школа',alignment:'Особые',name:'Удан',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/wudang.png'},
    {id:'school-gaibang',category:'Школа',alignment:'Особые',name:'Гайбан',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/gaibang.png'},
    {id:'school-junzitang',category:'Школа',alignment:'Особые',name:'Цзюньцзы Тан',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/junzitang.png'},
    {id:'school-jinyiwei',category:'Школа',alignment:'Особые',name:'Цзиньи Вэй',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/jinyiwei.png'},
    {id:'school-tangmen',category:'Школа',alignment:'Особые',name:'Танмэнь',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/tangmen.png'},
    {id:'school-11',category:'Школа',alignment:'Особые',name:'Школа 11',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/school-11.png'},
    {id:'school-12',category:'Школа',alignment:'Особые',name:'Школа 12',location:'Не заполнено',weapon:'Не заполнено',image:'assets/organizations/schools/school-12.png'}
  ].map(x=>({...x,content:'Описание будет добавлено позже.',howToJoin:'Информация будет добавлена позже.',links:'',neigongCards:[],skillCards:[],authorRole:'admin'}));
  const TYPES=['Школа','Секта','Фракция'];
  const ALIGNMENTS=['Добро','Нейтральные','Зло','Особые'];
  const clone=v=>JSON.parse(JSON.stringify(v));
  function category(v){const s=String(v||'').trim();if(s==='Сила'||s==='Силы'||s==='Фракции')return 'Фракция';if(s==='Секты')return 'Секта';if(s==='Школы')return 'Школа';return TYPES.includes(s)?s:'Школа'}
  function alignment(v){const s=String(v||'').trim();return ALIGNMENTS.includes(s)?s:'Особые'}
  function normalize(x={}){return {...x,id:x.id??('org-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)),category:category(x.category),alignment:alignment(x.alignment),name:String(x.name||'Без названия'),location:String(x.location||'Не заполнено'),weapon:String(x.weapon||'Не заполнено'),content:String(x.content||'Описание будет добавлено позже.'),howToJoin:String(x.howToJoin||'Информация будет добавлена позже.'),image:String(x.image||''),links:String(x.links||''),neigongCards:Array.isArray(x.neigongCards)?x.neigongCards:[],skillCards:Array.isArray(x.skillCards)?x.skillCards:[]};}
  function readStored(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.map(normalize):[]}catch{return []}}
  function loadAll(){const stored=readStored();const by=new Map(stored.map(x=>[String(x.id),x]));const merged=DEFAULTS.map(d=>by.has(String(d.id))?normalize(by.get(String(d.id))):clone(d));const defaults=new Set(DEFAULTS.map(x=>String(x.id)));for(const x of stored)if(!defaults.has(String(x.id)))merged.push(normalize(x));return merged;}
  function saveAll(arr){localStorage.setItem(KEY,JSON.stringify((arr||[]).map(normalize)));}
  function findById(id,arr=loadAll()){return arr.find(x=>String(x.id)===String(id))||null}
  window.KFOrganizations={KEY,DEFAULTS,TYPES,ALIGNMENTS,normalize,loadAll,saveAll,findById,category,alignment};
})();
