(function(){
  if(window.__KF_SUPABASE_V0073__)return;
  window.__KF_SUPABASE_V0073__=true;

  const cfg=window.KF_SUPABASE_CONFIG||{};
  const storageCfg=window.KF_STORAGE_CONFIG||{};
  const configured=
    !!window.supabase &&
    /^https:\/\/.+\.supabase\.co\/?$/i.test(String(cfg.url||'')) &&
    String(cfg.publishableKey||cfg.anonKey||'').length>20 &&
    !String(cfg.url||'').includes('YOUR_PROJECT') &&
    !String(cfg.publishableKey||cfg.anonKey||'').includes('YOUR_SUPABASE');

  const apiKey=String(cfg.publishableKey||cfg.anonKey||'');
  const bucket=String(cfg.storageBucket||'site-images');
  const nativeSet=Storage.prototype.setItem;
  const nativeGet=Storage.prototype.getItem;
  const nativeRemove=Storage.prototype.removeItem;
  const memory=window.__KF_SUPABASE_MEMORY__||(window.__KF_SUPABASE_MEMORY__={});
  const remoteSnapshots=window.__KF_SUPABASE_REMOTE_SNAPSHOTS__||(window.__KF_SUPABASE_REMOTE_SNAPSHOTS__={});
  let suppress=false;
  let client=null;
  let currentProfile=parse(nativeGet.call(localStorage,'kungfuCurrentUser'),null);
  let realtimeChannel=null;

  function deepClone(value){
    if(value===undefined)return undefined;
    try{return structuredClone(value)}
    catch{
      try{return JSON.parse(JSON.stringify(value))}
      catch{return value}
    }
  }

  function setRemoteSnapshot(key,value){
    if(value===undefined)delete remoteSnapshots[key];
    else remoteSnapshots[key]=deepClone(value);
  }

  function getRemoteSnapshot(key,fallback=undefined){
    return Object.prototype.hasOwnProperty.call(remoteSnapshots,key)
      ? deepClone(remoteSnapshots[key])
      : deepClone(fallback);
  }

  const discordSettingsKey='kungfuDiscordNotifications';
  const contentNotifyMap={
    kungfuUpdates:{section:'Обновления',page:'updates.html',fields:['title'],emoji:'🔥',headline:'Новое обновление'},
    kungfuTaiwanContent:{section:'О Тайвани',page:'taiwan.html',fields:['title'],emoji:'🐉',headline:'Новый материал о Тайване'},
    kungfuPirateContent:{section:'О Пиратке',page:'pirate.html',fields:['title'],emoji:'🏴',headline:'Новый материал о Пиратке'},
    kungfuBeginnerGuides:{section:'Справочник Новичкам',page:'beginners.html',fields:['title','name'],emoji:'📘',headline:'Новый материал для новичков'},
    kungfuSchoolsForcesSects:{section:'Школы, Силы, Секты',page:'schools.html',fields:['name','title'],emoji:'🏯',headline:'Новая запись о школе, силе или секте'},
    kungfuMeridians:{section:'Меридианы',page:'meridians.html',fields:['name','title'],emoji:'🌀',headline:'Новый меридиан'},
    kungfuNeigongs:{section:'Нейгуны',page:'neigongs.html',fields:['name','title'],emoji:'☯️',headline:'Новый нейгун'},
    kungfuSkills:{section:'Навыки',page:'skills.html',fields:['name','title'],emoji:'⚔️',headline:'Новый навык'},
    kungfuItems:{section:'Предметы',page:'items.html',fields:['name','title'],emoji:'🎒',headline:'Новый предмет'},
    kungfuArtifacts:{section:'Артефакты',page:'artifacts.html',fields:['name','title'],emoji:'💎',headline:'Новый артефакт'},
    kungfuHideouts:{section:'Тайники: боссы и обход',page:'hideouts.html',fields:['name','title'],emoji:'🗝️',headline:'Новый тайник'},
    kungfuBots:{section:'Боты',page:'bots.html',fields:['name','title'],emoji:'🤖',headline:'Новый бот'},
    kungfuBuffs:{section:'Баффы',page:'buffs.html',fields:['name','otherNames','title'],emoji:'✨',headline:'Новый бафф или дебафф'},
    kungfuContacts:{section:'Партнеры',page:'partners.html',fields:['nick','name','title'],emoji:'🤝',headline:'Новый партнер'}
  };

  function defaultDiscordTemplate(meta){
    return `${meta.emoji||'📢'} **${meta.headline||'Новая публикация'}**\nРаздел: **{section}**\n[{title}]({url})`;
  }

  function discordDefaults(){
    const templates={};
    for(const [key,meta] of Object.entries(contentNotifyMap)){
      templates[key]={enabled:true,template:defaultDiscordTemplate(meta)};
    }
    return {
      enabled:false,
      senderName:'',
      senderAvatarUrl:'',
      templates
    };
  }

  function normalizeDiscordSettings(value){
    const base=discordDefaults();
    const src=value&&typeof value==='object'?value:{};
    const out={
      enabled:src.enabled===true,
      senderName:String(src.senderName||'').trim().slice(0,80),
      senderAvatarUrl:String(src.senderAvatarUrl||'').trim().slice(0,500),
      templates:{}
    };
    for(const [key,meta] of Object.entries(contentNotifyMap)){
      const row=src.templates&&typeof src.templates==='object'?src.templates[key]:null;
      out.templates[key]={
        enabled:row?.enabled!==false,
        template:String(row?.template||defaultDiscordTemplate(meta)).slice(0,1800)
      };
    }
    return out;
  }

  function renderDiscordTemplate(template,values){
    const safe=String(template||'').slice(0,1800);
    return safe.replace(/\{(section|title|url|date)\}/g,(_,name)=>String(values[name]??''));
  }

  function isManagedKey(key){
    return typeof key==='string' &&
      key.startsWith('kungfu') &&
      !['kungfuCurrentUser','kungfuUsers','kungfuCaptchaPassed','kungfuEmergencyBackupV1'].includes(key);
  }

  function parse(raw,fallback=null){
    try{return raw==null?fallback:JSON.parse(raw)}catch{return fallback}
  }

  function same(a,b){
    try{return JSON.stringify(a)===JSON.stringify(b)}catch{return false}
  }

  function cacheSet(key,value){
    memory[key]=value;
    suppress=true;
    try{nativeSet.call(localStorage,key,JSON.stringify(value))}
    catch(e){console.warn('Supabase cache skipped:',key,e?.name||e)}
    finally{suppress=false}
  }

  function cacheRemove(key){
    delete memory[key];
    suppress=true;
    try{nativeRemove.call(localStorage,key)}catch{}
    finally{suppress=false}
  }

  function cacheProfile(profile){
    currentProfile=profile||null;
    suppress=true;
    try{
      if(profile)nativeSet.call(localStorage,'kungfuCurrentUser',JSON.stringify(profile));
      else nativeRemove.call(localStorage,'kungfuCurrentUser');
    }catch{}
    finally{suppress=false}
  }

  function profileObject(row,user){
    if(!row&&!user)return null;
    return {
      id:row?.id||user?.id||'',
      nickname:row?.nickname||user?.user_metadata?.nickname||String(user?.email||'Игрок').split('@')[0],
      email:row?.email||user?.email||'',
      bio:row?.bio||user?.user_metadata?.bio||'',
      avatarUrl:row?.avatar_url||'',
      role:row?.role||'user',
      createdAt:row?.created_at||user?.created_at||null,
      lastSeenAt:row?.last_seen_at||null
    };
  }

  async function profileFromUser(user){
    if(!client||!user){cacheProfile(null);return null}
    const {data,error}=await client.from('profiles')
      .select('id,nickname,email,bio,avatar_url,role,created_at,last_seen_at')
      .eq('id',user.id).maybeSingle();
    if(error&&error.code!=='PGRST116')throw error;
    const p=profileObject(data,user);
    cacheProfile(p);
    return p;
  }

  async function bootstrapStore(){
    if(!client)return false;
    const {data,error}=await client.from('site_store').select('key,value_json');
    if(error)throw error;
    const remote=new Map((data||[]).map(r=>[r.key,r.value_json]));
    let changed=false;

    // Remove stale managed cache keys that no longer exist remotely.
    const localKeys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(isManagedKey(k))localKeys.push(k);
    }
    for(const k of localKeys){
      if(!remote.has(k)){
        setRemoteSnapshot(k,undefined);
        cacheRemove(k);
        changed=true;
      }
    }

    for(const [key,value] of remote){
      setRemoteSnapshot(key,value);
      const local=parse(nativeGet.call(localStorage,key),undefined);
      if(!same(local,value)){cacheSet(key,value);changed=true}
      else memory[key]=value;
    }
    return changed;
  }

  function entryIdentity(item,index){
    if(item&&typeof item==='object'&&item.id!==undefined&&item.id!==null)return 'id:'+String(item.id);
    try{return 'json:'+JSON.stringify(item)}catch{return 'index:'+index}
  }

  function notificationTitle(item,meta){
    for(const field of meta.fields||[]){
      const value=String(item?.[field]||'').trim();
      if(value)return value.slice(0,180);
    }
    return 'Новая публикация';
  }

  async function invokeDiscord(payload){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data,error}=await client.functions.invoke('discord-publish',{body:payload});
    if(error)throw error;
    if(data&&data.ok===false)throw new Error(data.error||'Discord webhook вернул ошибку.');
    return data||{ok:true};
  }

  async function maybeNotifyNewContent(key,previous,next){
    const meta=contentNotifyMap[key];
    if(!meta)return;

    let profile=currentProfile;
    if(profile?.role!=='admin'){
      try{profile=await getCurrentProfile()}catch{}
    }
    if(profile?.role!=='admin')return;

    const raw=memory[discordSettingsKey]??parse(nativeGet.call(localStorage,discordSettingsKey),null);
    const settings=normalizeDiscordSettings(raw);
    if(settings.enabled!==true)return;

    const sectionSettings=settings.templates[key];
    if(!sectionSettings||sectionSettings.enabled===false)return;
    if(!Array.isArray(previous)||!Array.isArray(next))return;

    const oldIds=new Set(previous.map(entryIdentity));
    const added=next.filter((item,index)=>!oldIds.has(entryIdentity(item,index)));
    if(!added.length)return;

    for(const item of added.slice(-5)){
      try{
        const title=notificationTitle(item,meta);
        const publicUrl=new URL(meta.page,location.href).href;
        const content=renderDiscordTemplate(sectionSettings.template,{
          section:meta.section,
          title,
          url:publicUrl,
          date:new Date().toLocaleDateString('ru-RU')
        });
        await invokeDiscord({
          title,
          section:meta.section,
          url:publicUrl,
          entryId:item?.id==null?'':String(item.id),
          content,
          username:settings.senderName,
          avatarUrl:settings.senderAvatarUrl
        });
        window.dispatchEvent(new CustomEvent('kf-discord-notified',{detail:{key,item}}));
      }catch(e){
        console.warn('Discord notification failed:',e);
        window.dispatchEvent(new CustomEvent('kf-discord-notify-error',{detail:{key,error:e?.message||String(e)}}));
      }
    }
  }

  async function writeRemote(key,value,options={}){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError)throw userError;
    if(!user)throw new Error('Необходимо войти в аккаунт.');

    const cachedFallback=Object.prototype.hasOwnProperty.call(memory,key)
      ? memory[key]
      : parse(nativeGet.call(localStorage,key),undefined);
    const previous=Object.prototype.hasOwnProperty.call(options,'previous')
      ? deepClone(options.previous)
      : getRemoteSnapshot(key,cachedFallback);

    const prepared=await prepareValue(value,true,0,storagePurposeForKey(key));
    const row={key,value_json:prepared,updated_at:new Date().toISOString(),updated_by:user.id};
    const {error}=await client.from('site_store').upsert(row,{onConflict:'key'});
    if(error)throw error;

    cacheSet(key,prepared);
    await maybeNotifyNewContent(key,previous,prepared);
    setRemoteSnapshot(key,prepared);
    return prepared;
  }

  // Compatibility for older page code. localStorage is only a mirror/cache:
  // writes are sent to Supabase; there is no IndexedDB/local offline fallback.
  Storage.prototype.setItem=function(key,value){
    if(this!==localStorage||suppress||!isManagedKey(key)){
      return nativeSet.call(this,key,value);
    }
    if(!configured)throw new Error('Supabase не настроен: публикация не сохранена.');

    const parsed=parse(value,value);
    const cachedPrevious=parse(nativeGet.call(localStorage,key),undefined);
    const previous=getRemoteSnapshot(key,cachedPrevious);
    cacheSet(key,parsed);

    // Public pages sometimes create default UI arrays before Auth/bootstrap
    // finishes. Those defaults are cache-only and must never become database data.
    if(!currentProfile)return;

    queueMicrotask(async()=>{
      try{
        await writeRemote(key,parsed,{previous});
        window.dispatchEvent(new CustomEvent('kf-supabase-synced',{detail:{key}}));
      }catch(e){
        if(previous===undefined)cacheRemove(key);else cacheSet(key,previous);
        console.error('Supabase write failed:',e);
        alert(e.message||'Не удалось сохранить данные в Supabase.');
      }
    });
  };

  Storage.prototype.removeItem=function(key){
    if(this!==localStorage||suppress||!isManagedKey(key)){
      return nativeRemove.call(this,key);
    }
    if(!configured)throw new Error('Supabase не настроен: удаление не сохранено.');
    cacheRemove(key);
    queueMicrotask(async()=>{
      try{
        const {error}=await client.from('site_store').delete().eq('key',key);
        if(error)throw error;
        setRemoteSnapshot(key,undefined);
      }catch(e){
        console.error(e);
        alert(e.message||'Не удалось удалить данные в Supabase.');
      }
    });
  };

  function dataUrlToBlob(dataUrl){
    return fetch(dataUrl).then(r=>r.blob());
  }

  function extensionFor(type){
    const t=String(type||'').toLowerCase();
    if(t.includes('png'))return 'png';
    if(t.includes('gif'))return 'gif';
    if(t.includes('webp'))return 'webp';
    if(t.includes('svg'))return 'svg';
    return 'jpg';
  }

  function storagePurposeForKey(key){
    const k=String(key||'');
    if(['kungfuForumTopics','kungfuPlayers','kungfuAccountSales'].includes(k))return 'community';
    return 'admin';
  }

  function storageProvider(){
    const provider=String(storageCfg.provider||'auto').toLowerCase();
    const endpoint=String(storageCfg.yandexPresignEndpoint||'').trim();
    if(provider==='supabase')return 'supabase';
    if(provider==='yandex')return 'yandex';
    return endpoint?'yandex':'supabase';
  }

  async function uploadDataUrlSupabase(dataUrl){
    if(!configured||!client)throw new Error('Supabase Storage не настроен.');
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError)throw userError;
    if(!user)throw new Error('Для загрузки изображения необходимо войти.');

    const blob=await dataUrlToBlob(dataUrl);
    const ext=extensionFor(blob.type);
    const path=`${user.id}/${Date.now()}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}.${ext}`;
    const {error}=await client.storage.from(bucket).upload(path,blob,{
      contentType:blob.type||'image/jpeg',
      cacheControl:'31536000',
      upsert:false
    });
    if(error)throw error;
    const {data}=client.storage.from(bucket).getPublicUrl(path);
    if(!data?.publicUrl)throw new Error('Не удалось получить URL изображения.');
    return data.publicUrl;
  }

  async function uploadDataUrlYandex(dataUrl,options={}){
    const endpoint=String(storageCfg.yandexPresignEndpoint||'').trim();
    if(!endpoint)throw new Error('Yandex Object Storage ещё не настроен: не указан yandexPresignEndpoint.');
    if(!configured||!client)throw new Error('Supabase Auth не настроен.');
    const {data:{session},error}=await client.auth.getSession();
    if(error)throw error;
    if(!session?.access_token)throw new Error('Для загрузки изображения необходимо войти.');

    const blob=await dataUrlToBlob(dataUrl);
    const contentType=String(blob.type||'image/jpeg').toLowerCase();
    const purpose=String(options.purpose||'admin').toLowerCase()==='community'?'community':'admin';
    const ext=extensionFor(contentType);

    const signRes=await fetch(endpoint,{
      method:'POST',
      headers:{
        'X-KF-Session':session.access_token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({purpose,contentType,size:blob.size,extension:ext})
    });
    let signed=null;
    try{signed=await signRes.json()}catch{}
    if(!signRes.ok)throw new Error(signed?.error||`Yandex Cloud Function: ошибка ${signRes.status}.`);
    if(!signed?.uploadUrl||!signed?.url)throw new Error('Yandex Cloud Function не вернула ссылку для загрузки.');

    let uploadRes;
    if(signed?.fields&&typeof signed.fields==='object'){
      const form=new FormData();
      for(const [k,v] of Object.entries(signed.fields))form.append(k,String(v));
      form.append('file',blob);
      uploadRes=await fetch(signed.uploadUrl,{method:'POST',body:form});
    }else{
      uploadRes=await fetch(signed.uploadUrl,{
        method:'PUT',
        headers:{'Content-Type':contentType},
        body:blob
      });
    }
    if(!uploadRes.ok){
      let detail='';
      try{detail=(await uploadRes.text()).slice(0,240).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}catch{}
      throw new Error(`Yandex Object Storage: ошибка загрузки ${uploadRes.status}${detail?` — ${detail}`:''}.`);
    }
    return String(signed.url);
  }

  async function uploadDataUrl(dataUrl,options={}){
    if(!/^data:image\//i.test(String(dataUrl||'')))return dataUrl;
    const provider=storageProvider();
    if(provider==='yandex'){
      try{return await uploadDataUrlYandex(dataUrl,options)}
      catch(e){
        const mayFallback=storageCfg.fallbackToSupabase!==false && String(storageCfg.provider||'auto').toLowerCase()!=='yandex';
        if(!mayFallback)throw e;
        console.warn('Yandex Object Storage upload failed, using Supabase Storage fallback:',e?.message||e);
      }
    }
    return await uploadDataUrlSupabase(dataUrl);
  }

  async function transformHtml(html,options={}){
    if(typeof html!=='string'||!html.includes('data:image/'))return html;
    const tpl=document.createElement('template');
    tpl.innerHTML=html;
    const imgs=[...tpl.content.querySelectorAll('img[src^="data:image/"]')];
    for(const img of imgs){
      img.src=await uploadDataUrl(img.getAttribute('src'),options);
    }
    return tpl.innerHTML;
  }

  async function prepareValue(value,strict=true,depth=0,purpose='admin'){
    if(depth>30)return value;
    if(typeof value==='string'){
      if(/^data:image\//i.test(value))return await uploadDataUrl(value,{purpose});
      if(value.includes('data:image/'))return await transformHtml(value,{purpose});
      return value;
    }
    if(Array.isArray(value)){
      const out=[];
      for(const x of value)out.push(await prepareValue(x,strict,depth+1,purpose));
      return out;
    }
    if(value&&typeof value==='object'){
      const out={};
      for(const [k,v] of Object.entries(value))out[k]=await prepareValue(v,strict,depth+1,purpose);
      return out;
    }
    return value;
  }

  async function saveStore(key,value){
    const fallback=Object.prototype.hasOwnProperty.call(memory,key)
      ? memory[key]
      : parse(nativeGet.call(localStorage,key),undefined);
    const previous=getRemoteSnapshot(key,fallback);
    return await writeRemote(key,value,{previous});
  }

  async function getStore(key,fallback=null){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data,error}=await client.from('site_store').select('value_json').eq('key',key).maybeSingle();
    if(error&&error.code!=='PGRST116')throw error;
    const value=data?data.value_json:fallback;
    if(data){
      setRemoteSnapshot(key,value);
      cacheSet(key,value);
    }else{
      setRemoteSnapshot(key,undefined);
      cacheRemove(key);
    }
    return value;
  }

  async function register({nickname,email,password,bio}){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const redirectTo=new URL('account.html',location.href).href;
    const {data,error}=await client.auth.signUp({
      email:String(email||'').trim(),
      password:String(password||''),
      options:{
        data:{nickname:String(nickname||'').trim(),bio:String(bio||'').trim()},
        emailRedirectTo:redirectTo
      }
    });
    if(error)throw error;
    if(data.session&&data.user)await profileFromUser(data.user);
    return {user:data.user,session:data.session,needsConfirmation:!!data.user&&!data.session};
  }

  async function login(email,password){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data,error}=await client.auth.signInWithPassword({
      email:String(email||'').trim(),
      password:String(password||'')
    });
    if(error)throw error;
    return await profileFromUser(data.user);
  }

  async function adminLogin(loginValue,password){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    let email=String(loginValue||'').trim();
    if(email.toLowerCase()==='admin')email=String(cfg.adminEmail||'').trim();
    if(!email||!email.includes('@'))throw new Error('Укажите e-mail администратора.');
    const profile=await login(email,password);
    if(!profile||profile.role!=='admin'){
      await client.auth.signOut();
      cacheProfile(null);
      throw new Error('У аккаунта нет роли администратора.');
    }
    return profile;
  }

  async function logout(){
    if(client)await client.auth.signOut();
    cacheProfile(null);
  }

  async function getCurrentProfile(){
    if(!configured||!client)return null;
    const {data:{user},error}=await client.auth.getUser();
    if(error||!user){cacheProfile(null);return null}
    return await profileFromUser(user);
  }

  async function updateMyAvatar(avatarUrl){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError)throw userError;
    if(!user)throw new Error('Необходимо войти в аккаунт.');

    const {data,error}=await client.rpc('update_my_avatar',{
      new_avatar_url:String(avatarUrl||'')
    });
    if(error)throw error;

    const row=Array.isArray(data)?data[0]:data;
    const profile=profileObject(row,user);
    cacheProfile(profile);
    return profile;
  }

  async function updateMyBio(bio){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError)throw userError;
    if(!user)throw new Error('Необходимо войти в аккаунт.');

    const value=String(bio||'').trim();
    if(value.length>1000)throw new Error('Описание профиля — максимум 1000 символов.');
    const {data,error}=await client.rpc('update_my_bio',{new_bio:value});
    if(error)throw error;
    const row=Array.isArray(data)?data[0]:data;
    const profile=profileObject(row,user);
    cacheProfile(profile);
    return profile;
  }

  async function getDiscordNotifications(){
    const value=await getStore(discordSettingsKey,discordDefaults());
    return normalizeDiscordSettings(value);
  }

  async function setDiscordNotifications(value){
    const next=typeof value==='boolean'
      ? {...await getDiscordNotifications(),enabled:value}
      : normalizeDiscordSettings(value);
    return await saveStore(discordSettingsKey,next);
  }

  async function testDiscordNotification(sectionKey='kungfuUpdates',draftSettings=null){
    const settings=normalizeDiscordSettings(draftSettings||await getDiscordNotifications());
    const meta=contentNotifyMap[sectionKey]||contentNotifyMap.kungfuUpdates;
    const row=settings.templates[sectionKey]||{enabled:true,template:defaultDiscordTemplate(meta)};
    const title='Тестовая публикация';
    const url=new URL(meta.page,location.href).href;
    const content=renderDiscordTemplate(row.template,{
      section:meta.section,
      title,
      url,
      date:new Date().toLocaleDateString('ru-RU')
    });
    return await invokeDiscord({
      title,
      section:meta.section,
      url,
      content,
      username:settings.senderName,
      avatarUrl:settings.senderAvatarUrl,
      test:true
    });
  }

  function getDiscordSections(){
    return Object.entries(contentNotifyMap).map(([key,meta])=>({
      key,
      section:meta.section,
      page:meta.page,
      defaultTemplate:defaultDiscordTemplate(meta)
    }));
  }

  async function getPublicProfiles(ids=[]){
    if(!configured||!client)return [];
    let q=client.from('public_profiles').select('id,nickname,avatar_url');
    const list=[...new Set((ids||[]).map(String).filter(Boolean))];
    if(list.length)q=q.in('id',list);
    const {data,error}=await q;
    if(error)throw error;
    return (data||[]).map(x=>({
      id:x.id,
      nickname:x.nickname||'Игрок',
      avatarUrl:x.avatar_url||''
    }));
  }

  function subscribeRealtime(){
    if(!client||realtimeChannel)return;
    realtimeChannel=client.channel('kungfu-site-store-0.0.70')
      .on('postgres_changes',{event:'*',schema:'public',table:'site_store'},payload=>{
        const row=payload.new||payload.old;
        if(!row||!isManagedKey(row.key))return;
        if(payload.eventType==='DELETE'){
          setRemoteSnapshot(row.key,undefined);
          cacheRemove(row.key);
        }else{
          setRemoteSnapshot(row.key,row.value_json);
          cacheSet(row.key,row.value_json);
        }
        window.dispatchEvent(new CustomEvent('kf-supabase-synced',{detail:{key:row.key}}));
      })
      .subscribe();
  }

  const ready=(async()=>{
    if(!configured){
      window.dispatchEvent(new CustomEvent('kf-supabase-ready',{detail:{configured:false}}));
      return {configured:false};
    }
    client=window.supabase.createClient(cfg.url,apiKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });

    const {data:{session}}=await client.auth.getSession();
    if(session?.user){
      try{await profileFromUser(session.user)}catch(e){console.warn('Profile bootstrap:',e)}
    }else cacheProfile(null);

    let changed=false;
    try{changed=await bootstrapStore()}catch(e){console.error('Supabase bootstrap:',e)}

    client.auth.onAuthStateChange(async(event,session)=>{
      if(session?.user&&['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){
        try{await profileFromUser(session.user)}catch(e){console.warn(e)}
      }else if(event==='SIGNED_OUT')cacheProfile(null);
    });

    subscribeRealtime();
    window.dispatchEvent(new CustomEvent('kf-supabase-ready',{detail:{configured:true}}));

    // Legacy pages read the mirrored cache synchronously. Reload once after the
    // first successful bootstrap if the remote DB changed that cache.
    if(changed&&!sessionStorage.getItem('kf060-boot-'+location.pathname)){
      sessionStorage.setItem('kf060-boot-'+location.pathname,'1');
      setTimeout(()=>location.reload(),40);
    }
    return {configured:true};
  })();

  window.KFSupabase={
    configured,
    get client(){return client},
    ready,
    register,login,adminLogin,logout,getCurrentProfile,updateMyAvatar,updateMyBio,getPublicProfiles,
    getStore,saveStore,getDiscordNotifications,setDiscordNotifications,testDiscordNotification,getDiscordSections,
    uploadImageDataUrl:uploadDataUrl,
    uploadImageDataUrlStrict:uploadDataUrl,
    uploadAvatarDataUrlStrict:(dataUrl)=>uploadDataUrl(dataUrl,{purpose:'community'}),
    getStorageInfo:()=>({provider:storageProvider(),yandexConfigured:!!String(storageCfg.yandexPresignEndpoint||'').trim(),fallbackToSupabase:storageCfg.fallbackToSupabase!==false}),
    prepareValue,
    async refreshStore(){await ready;return await bootstrapStore()}
  };
})();