(function(){
  if(window.__KF_SUPABASE_V0058__)return;
  window.__KF_SUPABASE_V0058__=true;

  const cfg=window.KF_SUPABASE_CONFIG||{};
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
  let suppress=false;
  let client=null;
  let currentProfile=parse(nativeGet.call(localStorage,'kungfuCurrentUser'),null);
  let realtimeChannel=null;

  const discordSettingsKey='kungfuDiscordNotifications';
  const contentNotifyMap={
    kungfuUpdates:{section:'Обновления',page:'updates.html',fields:['title']},
    kungfuTaiwanContent:{section:'О Тайвани',page:'taiwan.html',fields:['title']},
    kungfuPirateContent:{section:'О Пиратке',page:'pirate.html',fields:['title']},
    kungfuBeginnerGuides:{section:'Справочник Новичкам',page:'beginners.html',fields:['title','name']},
    kungfuSchoolsForcesSects:{section:'Школы, Силы, Секты',page:'schools.html',fields:['name','title']},
    kungfuMeridians:{section:'Меридианы',page:'meridians.html',fields:['name','title']},
    kungfuNeigongs:{section:'Нейгуны',page:'neigongs.html',fields:['name','title']},
    kungfuSkills:{section:'Навыки',page:'skills.html',fields:['name','title']},
    kungfuItems:{section:'Предметы',page:'items.html',fields:['name','title']},
    kungfuArtifacts:{section:'Артефакты',page:'artifacts.html',fields:['name','title']},
    kungfuHideouts:{section:'Тайники: боссы и обход',page:'hideouts.html',fields:['name','title']},
    kungfuBots:{section:'Боты',page:'bots.html',fields:['name','title']},
    kungfuContacts:{section:'Партнеры',page:'partners.html',fields:['nick','name','title']}
  };

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
        cacheRemove(k);
        changed=true;
      }
    }

    for(const [key,value] of remote){
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
    if(!meta||currentProfile?.role!=='admin')return;
    const settings=memory[discordSettingsKey]??parse(nativeGet.call(localStorage,discordSettingsKey),null);
    if(!settings||settings.enabled!==true)return;
    if(!Array.isArray(previous)||!Array.isArray(next))return;

    const oldIds=new Set(previous.map(entryIdentity));
    const added=next.filter((item,index)=>!oldIds.has(entryIdentity(item,index)));
    if(!added.length)return;

    for(const item of added.slice(-5)){
      try{
        await invokeDiscord({
          title:notificationTitle(item,meta),
          section:meta.section,
          url:new URL(meta.page,location.href).href,
          entryId:item?.id==null?'':String(item.id)
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

    const previous=Object.prototype.hasOwnProperty.call(options,'previous')
      ? options.previous
      : (Object.prototype.hasOwnProperty.call(memory,key)?memory[key]:parse(nativeGet.call(localStorage,key),undefined));
    const prepared=await prepareValue(value,true);
    const row={key,value_json:prepared,updated_at:new Date().toISOString(),updated_by:user.id};
    const {error}=await client.from('site_store').upsert(row,{onConflict:'key'});
    if(error)throw error;
    cacheSet(key,prepared);
    await maybeNotifyNewContent(key,previous,prepared);
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
    const previous=parse(nativeGet.call(localStorage,key),undefined);
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

  async function uploadDataUrl(dataUrl){
    if(!/^data:image\//i.test(String(dataUrl||'')))return dataUrl;
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

  async function transformHtml(html){
    if(typeof html!=='string'||!html.includes('data:image/'))return html;
    const tpl=document.createElement('template');
    tpl.innerHTML=html;
    const imgs=[...tpl.content.querySelectorAll('img[src^="data:image/"]')];
    for(const img of imgs){
      img.src=await uploadDataUrl(img.getAttribute('src'));
    }
    return tpl.innerHTML;
  }

  async function prepareValue(value,strict=true,depth=0){
    if(depth>30)return value;
    if(typeof value==='string'){
      if(/^data:image\//i.test(value))return await uploadDataUrl(value);
      if(value.includes('data:image/'))return await transformHtml(value);
      return value;
    }
    if(Array.isArray(value)){
      const out=[];
      for(const x of value)out.push(await prepareValue(x,strict,depth+1));
      return out;
    }
    if(value&&typeof value==='object'){
      const out={};
      for(const [k,v] of Object.entries(value))out[k]=await prepareValue(v,strict,depth+1);
      return out;
    }
    return value;
  }

  async function saveStore(key,value){
    const previous=Object.prototype.hasOwnProperty.call(memory,key)?memory[key]:parse(nativeGet.call(localStorage,key),undefined);
    return await writeRemote(key,value,{previous});
  }

  async function getStore(key,fallback=null){
    if(!configured||!client)throw new Error('Supabase не настроен.');
    const {data,error}=await client.from('site_store').select('value_json').eq('key',key).maybeSingle();
    if(error&&error.code!=='PGRST116')throw error;
    const value=data?data.value_json:fallback;
    if(data)cacheSet(key,value);else cacheRemove(key);
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
    const value=await getStore(discordSettingsKey,{enabled:false});
    return value&&typeof value==='object'?{enabled:value.enabled===true}:{enabled:false};
  }

  async function setDiscordNotifications(enabled){
    return await saveStore(discordSettingsKey,{enabled:!!enabled});
  }

  async function testDiscordNotification(){
    return await invokeDiscord({
      title:'Тестовое уведомление',
      section:'Руководство Легенды Кунг-Фу',
      url:new URL('index.html',location.href).href,
      test:true
    });
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
    realtimeChannel=client.channel('kungfu-site-store-0.0.58')
      .on('postgres_changes',{event:'*',schema:'public',table:'site_store'},payload=>{
        const row=payload.new||payload.old;
        if(!row||!isManagedKey(row.key))return;
        if(payload.eventType==='DELETE')cacheRemove(row.key);
        else cacheSet(row.key,row.value_json);
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
    if(changed&&!sessionStorage.getItem('kf058-boot-'+location.pathname)){
      sessionStorage.setItem('kf058-boot-'+location.pathname,'1');
      setTimeout(()=>location.reload(),40);
    }
    return {configured:true};
  })();

  window.KFSupabase={
    configured,
    get client(){return client},
    ready,
    register,login,adminLogin,logout,getCurrentProfile,updateMyAvatar,updateMyBio,getPublicProfiles,
    getStore,saveStore,getDiscordNotifications,setDiscordNotifications,testDiscordNotification,
    uploadImageDataUrl:uploadDataUrl,
    uploadImageDataUrlStrict:uploadDataUrl,
    prepareValue,
    async refreshStore(){await ready;return await bootstrapStore()}
  };
})();