(function(){
  if(window.__KF_MUSIC_PLAYER_0056__)return;
  window.__KF_MUSIC_PLAYER_0056__=true;

  const scriptBase=(()=>{try{return new URL('.',document.currentScript?.src||location.href)}catch{return new URL('.',location.href)}})();
  const asset=path=>new URL(path,scriptBase).href;
  const TRACKS=[
    {src:asset('music/kungfu-theme.mp3'),title:'Тема из игры'},
    {src:asset('music/kungfu-bg-32.mp3'),title:'Фоновая музыка 32'},
    {src:asset('music/kungfu-bg-29.mp3'),title:'Фоновая музыка 29'}
  ];
  const ICON_OFF=asset('music/sound-off.svg');
  const ICON_ON=asset('music/sound-on.svg');

  const STATE_KEY='kfMusicStateV2';
  const OWNER_KEY='kfMusicOwnerV2';
  const CHANNEL='kf-music-v2';
  const tabId=(crypto.randomUUID?.()||('tab-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
  const bc=('BroadcastChannel' in window)?new BroadcastChannel(CHANNEL):null;
  const audio=new Audio();
  audio.preload='auto';

  let state=loadState();
  let isOwner=false,ownerTimer=null,saveTimer=null,blocked=false,booted=false;

  function loadState(){
    try{
      const v=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      if(v&&typeof v==='object')return {
        trackIndex:Number.isInteger(v.trackIndex)?Math.max(0,Math.min(TRACKS.length-1,v.trackIndex)):0,
        currentTime:Math.max(0,Number(v.currentTime)||0),
        volume:Number.isFinite(Number(v.volume))?Math.max(0,Math.min(1,Number(v.volume))):0.34,
        enabled:v.enabled!==false,
        muted:!!v.muted,
        updatedAt:Number(v.updatedAt)||Date.now()
      };
    }catch{}
    return {trackIndex:0,currentTime:0,volume:.34,enabled:true,muted:false,updatedAt:Date.now()};
  }
  function saveState(patch={},broadcast=true){
    state={...state,...patch,updatedAt:Date.now()};
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch{}
    if(broadcast)bc?.postMessage({type:'state',state,from:tabId});
    render();
  }
  function getOwner(){
    try{
      const x=JSON.parse(localStorage.getItem(OWNER_KEY)||'null');
      if(x?.id&&Date.now()-Number(x.ts||0)<3800)return x;
    }catch{}
    return null;
  }
  function claimOwner(force=false){
    const owner=getOwner();
    if(owner&&owner.id!==tabId&&!force)return false;
    if(owner&&owner.id!==tabId&&force)bc?.postMessage({type:'takeover',id:tabId});
    isOwner=true;
    try{localStorage.setItem(OWNER_KEY,JSON.stringify({id:tabId,ts:Date.now()}))}catch{}
    clearInterval(ownerTimer);
    ownerTimer=setInterval(()=>{
      if(!isOwner)return;
      try{localStorage.setItem(OWNER_KEY,JSON.stringify({id:tabId,ts:Date.now()}))}catch{}
    },900);
    return true;
  }
  function releaseOwner(){
    if(!isOwner)return;
    isOwner=false;
    clearInterval(ownerTimer);ownerTimer=null;
    try{
      const x=JSON.parse(localStorage.getItem(OWNER_KEY)||'null');
      if(x?.id===tabId)localStorage.removeItem(OWNER_KEY);
    }catch{}
    bc?.postMessage({type:'release',id:tabId});
  }
  function applyTrack(resume=true){
    const tr=TRACKS[state.trackIndex]||TRACKS[0];
    if(audio.src!==tr.src)audio.src=tr.src;
    audio.volume=state.volume;
    audio.muted=state.muted;
    if(resume){
      const seek=()=>{
        try{
          const max=Number.isFinite(audio.duration)&&audio.duration>0?Math.max(0,audio.duration-.2):Infinity;
          audio.currentTime=Math.min(Math.max(0,state.currentTime||0),max);
        }catch{}
      };
      if(audio.readyState>=1)seek();else audio.addEventListener('loadedmetadata',seek,{once:true});
    }
  }
  function startSaving(){
    clearInterval(saveTimer);
    saveTimer=setInterval(()=>{
      if(!isOwner||audio.paused)return;
      saveState({trackIndex:state.trackIndex,currentTime:audio.currentTime,volume:audio.volume,enabled:true,muted:state.muted},true);
    },900);
  }
  function stopSaving(){clearInterval(saveTimer);saveTimer=null}

  async function start({force=false,gesture=false}={}){
    if(!state.enabled)return false;
    if(!claimOwner(force)){render('играет в другой вкладке');return false}
    applyTrack(true);
    audio.muted=state.muted;
    blocked=false;
    try{
      await audio.play();
      startSaving();
      saveState({enabled:true,currentTime:audio.currentTime||state.currentTime,muted:audio.muted});
      return true;
    }catch(err){
      if(!state.muted&&!gesture){
        try{
          audio.muted=true;
          await audio.play();
          blocked=true;
          startSaving();
          render('нажмите на сайт — звук включится');
          return true;
        }catch{}
      }
      blocked=true;
      stopSaving();
      releaseOwner();
      render('нажмите ▶ или на страницу');
      return false;
    }
  }
  function pause(){
    if(isOwner){
      audio.pause();stopSaving();
      saveState({enabled:false,currentTime:audio.currentTime||state.currentTime});
      releaseOwner();
    }else saveState({enabled:false});
  }
  async function resumeFromGesture(){
    if(!state.enabled||state.muted)return;
    const owner=getOwner();
    if(owner&&owner.id!==tabId)return;
    if(!isOwner){await start({gesture:true});return}
    try{
      audio.muted=false;
      await audio.play();
      blocked=false;
      saveState({muted:false,enabled:true,currentTime:audio.currentTime});
      startSaving();
    }catch{}
  }
  function nextTrack(dir=1){
    const next=(state.trackIndex+dir+TRACKS.length)%TRACKS.length;
    state.trackIndex=next;state.currentTime=0;
    saveState({trackIndex:next,currentTime:0,enabled:true});
    if(isOwner){
      applyTrack(false);
      audio.play().then(startSaving).catch(()=>render('нажмите ▶ для продолжения'));
    }else start({force:true,gesture:true});
  }
  function fmt(sec){
    sec=Math.max(0,Number(sec)||0);
    return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
  }

  function createUI(){
    const root=document.createElement('div');
    root.className='kf-music collapsed';root.id='kfMusicPlayer';
    root.innerHTML=`
      <div class="kf-music-bar">
        <button class="kf-music-toggle" type="button" title="Музыка">
          <span class="kf-music-note">♫</span>
          <span class="kf-music-toggle-text"><span class="kf-music-title">Музыка</span><span class="kf-music-state">загрузка...</span></span>
          <span class="kf-music-collapse">▾</span>
        </button>
        <button class="kf-music-mute" type="button" title="Отключить звук"><img alt="Отключить звук"></button>
      </div>
      <div class="kf-music-panel">
        <div class="kf-music-track"></div>
        <div class="kf-music-time">0:00 / 0:00</div>
        <input class="kf-music-progress" type="range" min="0" max="1000" value="0" aria-label="Позиция трека">
        <div class="kf-music-controls">
          <button class="kf-music-btn kf-prev" type="button" title="Предыдущий">⏮</button>
          <button class="kf-music-btn kf-music-play" type="button" title="Пауза / воспроизведение">▶</button>
          <button class="kf-music-btn kf-next" type="button" title="Следующий">⏭</button>
          <input class="kf-music-volume" type="range" min="0" max="1" step="0.01" value="${state.volume}" aria-label="Громкость">
        </div>
        <div class="kf-music-hint">Музыка запускается автоматически, насколько это разрешает браузер. Если браузер блокирует звук, достаточно один раз нажать на страницу. Новая вкладка не запускает второй трек.</div>
      </div>`;
    document.body.appendChild(root);

    root.querySelector('.kf-music-toggle').onclick=()=>{
      root.classList.toggle('collapsed');render();
    };
    root.querySelector('.kf-music-mute').onclick=async e=>{
      e.stopPropagation();
      const fresh=loadState();
      const muted=!fresh.muted;
      saveState({muted});
      if(isOwner){
        audio.muted=muted;
        if(!muted&&state.enabled)try{await audio.play();blocked=false}catch{blocked=true}
      }
      render();
    };
    root.querySelector('.kf-music-play').onclick=async()=>{
      const owner=getOwner();
      if(state.enabled&&(isOwner&&!audio.paused)){pause();return}
      saveState({enabled:true});
      await start({force:!!(owner&&owner.id!==tabId),gesture:true});
    };
    root.querySelector('.kf-prev').onclick=()=>nextTrack(-1);
    root.querySelector('.kf-next').onclick=()=>nextTrack(1);
    root.querySelector('.kf-music-volume').oninput=e=>{
      const v=Number(e.target.value);
      saveState({volume:v});
      if(isOwner)audio.volume=v;
    };
    root.querySelector('.kf-music-progress').oninput=e=>{
      const dur=audio.duration;
      if(!Number.isFinite(dur)||dur<=0)return;
      const next=(Number(e.target.value)/1000)*dur;
      if(isOwner)audio.currentTime=next;
      saveState({currentTime:next});
    };
  }
  function render(custom){
    const root=document.getElementById('kfMusicPlayer');if(!root)return;
    const tr=TRACKS[state.trackIndex]||TRACKS[0],owner=getOwner();
    root.querySelector('.kf-music-track').textContent=tr.title;
    root.querySelector('.kf-music-title').textContent=tr.title;
    let status=custom||'готова';
    if(!state.enabled)status='на паузе';
    else if(owner&&owner.id!==tabId)status='играет в другой вкладке';
    else if(isOwner&&!audio.paused&&audio.muted)status='играет без звука';
    else if(isOwner&&!audio.paused)status='играет';
    else if(blocked)status='нажмите на страницу';
    root.querySelector('.kf-music-state').textContent=status;
    root.querySelector('.kf-music-play').textContent=(isOwner&&!audio.paused&&state.enabled)?'❚❚':'▶';
    root.querySelector('.kf-music-collapse').textContent=root.classList.contains('collapsed')?'▾':'▴';

    const muteBtn=root.querySelector('.kf-music-mute'),muteImg=muteBtn.querySelector('img');
    if(state.muted){
      muteBtn.title='Включить звук';muteImg.src=ICON_ON;muteImg.alt='Включить звук';
    }else{
      muteBtn.title='Отключить звук';muteImg.src=ICON_OFF;muteImg.alt='Отключить звук';
    }

    root.querySelector('.kf-music-volume').value=String(state.volume);
    const dur=Number.isFinite(audio.duration)?audio.duration:0;
    const cur=isOwner?audio.currentTime:state.currentTime;
    root.querySelector('.kf-music-time').textContent=`${fmt(cur)} / ${fmt(dur)}`;
    root.querySelector('.kf-music-progress').value=dur>0?String(Math.min(1000,Math.round(cur/dur*1000))):'0';
  }

  audio.addEventListener('timeupdate',()=>{if(isOwner)render()});
  audio.addEventListener('durationchange',render);
  audio.addEventListener('ended',()=>nextTrack(1));
  audio.addEventListener('error',()=>render('ошибка загрузки MP3'));

  window.addEventListener('storage',e=>{
    if(e.key===STATE_KEY){
      const oldTrack=state.trackIndex;state=loadState();
      if(isOwner){
        audio.volume=state.volume;audio.muted=state.muted;
        if(oldTrack!==state.trackIndex){applyTrack(true);if(state.enabled)audio.play().catch(()=>{})}
        if(!state.enabled){audio.pause();stopSaving();releaseOwner()}
      }
      render();
    }else if(e.key===OWNER_KEY){
      const owner=getOwner();
      if(isOwner&&owner&&owner.id!==tabId){audio.pause();stopSaving();isOwner=false}
      render();
    }
  });
  bc?.addEventListener('message',e=>{
    const m=e.data||{};if(m.from===tabId)return;
    if(m.type==='state'&&m.state){state={...state,...m.state};if(isOwner){audio.volume=state.volume;audio.muted=state.muted}render()}
    if(m.type==='takeover'&&m.id!==tabId&&isOwner){audio.pause();stopSaving();releaseOwner();render()}
  });

  const gesture=()=>resumeFromGesture();
  ['pointerdown','keydown','touchstart'].forEach(name=>document.addEventListener(name,gesture,{passive:true}));

  window.addEventListener('pagehide',()=>{
    if(isOwner){
      saveState({currentTime:audio.currentTime,volume:audio.volume,enabled:state.enabled,muted:state.muted},true);
      releaseOwner();
    }
  });

  async function boot(){
    if(booted)return;booted=true;
    createUI();applyTrack(true);render();
    const owner=getOwner();
    if(state.enabled&&!owner)setTimeout(()=>start({force:false,gesture:false}),80);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
