(function(){
  if(window.__KF_MUSIC_PLAYER_0057__) return;
  window.__KF_MUSIC_PLAYER_0057__ = true;

  const base = new URL('.', document.baseURI);
  const TRACKS = [
    {src:new URL('kungfu-theme.mp3',base).href,title:'Тема из игры'},
    {src:new URL('kungfu-bg-32.mp3',base).href,title:'Фоновая музыка 32'},
    {src:new URL('kungfu-bg-29.mp3',base).href,title:'Фоновая музыка 29'}
  ];

  const STATE_KEY='kfMusicStateV3';
  const OWNER_KEY='kfMusicOwnerV3';
  const CHANNEL='kf-music-v3';
  const OWNER_TTL=4500;
  const tabId=(crypto.randomUUID?.()||('tab-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
  const bc=('BroadcastChannel' in window)?new BroadcastChannel(CHANNEL):null;

  const audio=document.createElement('audio');
  audio.preload='metadata';
  audio.playsInline=true;

  let state=loadState();
  let isOwner=false;
  let ownerTimer=null;
  let saveTimer=null;
  let blocked=false;
  let mediaError=false;

  function loadState(){
    try{
      const v=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      if(v&&typeof v==='object'){
        return {
          trackIndex:Number.isInteger(v.trackIndex)?Math.max(0,Math.min(TRACKS.length-1,v.trackIndex)):0,
          currentTime:Math.max(0,Number(v.currentTime)||0),
          volume:Number.isFinite(Number(v.volume))?Math.max(0,Math.min(1,Number(v.volume))):0.35,
          enabled:v.enabled!==false,
          muted:!!v.muted,
          updatedAt:Number(v.updatedAt)||Date.now()
        };
      }
    }catch{}
    return {trackIndex:0,currentTime:0,volume:.35,enabled:true,muted:false,updatedAt:Date.now()};
  }

  function saveState(patch={},broadcast=true){
    state={...state,...patch,updatedAt:Date.now()};
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch{}
    if(broadcast) bc?.postMessage({type:'state',state,from:tabId});
    render();
  }

  function getOwner(){
    try{
      const x=JSON.parse(localStorage.getItem(OWNER_KEY)||'null');
      if(x?.id && Date.now()-Number(x.ts||0)<OWNER_TTL) return x;
    }catch{}
    return null;
  }

  function claimOwner(force=false){
    const owner=getOwner();
    if(owner && owner.id!==tabId && !force) return false;
    if(owner && owner.id!==tabId && force) bc?.postMessage({type:'takeover',id:tabId});
    isOwner=true;
    try{localStorage.setItem(OWNER_KEY,JSON.stringify({id:tabId,ts:Date.now()}))}catch{}
    clearInterval(ownerTimer);
    ownerTimer=setInterval(()=>{
      if(!isOwner) return;
      try{localStorage.setItem(OWNER_KEY,JSON.stringify({id:tabId,ts:Date.now()}))}catch{}
    },1000);
    return true;
  }

  function releaseOwner(){
    if(!isOwner) return;
    isOwner=false;
    clearInterval(ownerTimer); ownerTimer=null;
    try{
      const owner=JSON.parse(localStorage.getItem(OWNER_KEY)||'null');
      if(owner?.id===tabId) localStorage.removeItem(OWNER_KEY);
    }catch{}
    bc?.postMessage({type:'release',id:tabId});
  }

  function setTrack(index,resume=true){
    state.trackIndex=Math.max(0,Math.min(TRACKS.length-1,index));
    const track=TRACKS[state.trackIndex];
    const same=audio.src===track.src;
    if(!same){
      mediaError=false;
      audio.src=track.src;
      audio.load();
    }
    audio.volume=state.volume;
    audio.muted=state.muted;

    if(resume){
      const seek=()=>{
        if(!Number.isFinite(audio.duration)||audio.duration<=0) return;
        try{
          audio.currentTime=Math.min(Math.max(0,state.currentTime||0),Math.max(0,audio.duration-.25));
        }catch{}
      };
      if(audio.readyState>=1) seek();
      else audio.addEventListener('loadedmetadata',seek,{once:true});
    }
  }

  function startSaving(){
    clearInterval(saveTimer);
    saveTimer=setInterval(()=>{
      if(!isOwner || audio.paused) return;
      saveState({
        trackIndex:state.trackIndex,
        currentTime:audio.currentTime||0,
        volume:audio.volume,
        muted:audio.muted,
        enabled:true
      });
    },1000);
  }

  function stopSaving(){
    clearInterval(saveTimer);
    saveTimer=null;
  }

  async function play({force=false,gesture=false}={}){
    if(!state.enabled) saveState({enabled:true});
    const owner=getOwner();
    if(owner && owner.id!==tabId && !force){
      render('играет в другой вкладке');
      return false;
    }
    if(!claimOwner(force)){
      render('играет в другой вкладке');
      return false;
    }

    setTrack(state.trackIndex,true);
    audio.volume=state.volume;
    audio.muted=state.muted;
    blocked=false;

    try{
      await audio.play();
      blocked=false;
      startSaving();
      saveState({enabled:true,currentTime:audio.currentTime||state.currentTime});
      return true;
    }catch(err){
      blocked=true;
      stopSaving();
      releaseOwner();
      if(mediaError){
        render('MP3 не найден на GitHub');
      }else if(gesture){
        render('браузер не дал запустить аудио');
      }else{
        render('нажмите ▶ или на страницу');
      }
      return false;
    }
  }

  function pause(){
    audio.pause();
    stopSaving();
    saveState({enabled:false,currentTime:audio.currentTime||state.currentTime});
    releaseOwner();
  }

  async function toggleMute(){
    const next=!state.muted;
    saveState({muted:next});
    audio.muted=next;
    if(!next && state.enabled && isOwner && audio.paused){
      try{await audio.play();startSaving()}catch{}
    }
    render();
  }

  async function changeTrack(dir){
    const next=(state.trackIndex+dir+TRACKS.length)%TRACKS.length;
    state.trackIndex=next;
    state.currentTime=0;
    saveState({trackIndex:next,currentTime:0,enabled:true});
    setTrack(next,false);
    if(isOwner){
      try{await audio.play();startSaving()}catch{blocked=true;render()}
    }else{
      await play({force:!!getOwner(),gesture:true});
    }
  }

  function fmt(sec){
    sec=Math.max(0,Number(sec)||0);
    return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
  }

  function speakerSvg(muted){
    if(muted){
      return `<svg viewBox="0 0 64 64" aria-hidden="true">
        <path fill="currentColor" d="M8 25h12l14-12c2-2 5-.6 5 2v34c0 2.7-3.1 4.1-5 2L20 39H8c-2.2 0-4-1.8-4-4v-6c0-2.2 1.8-4 4-4z"/>
        <path fill="none" stroke="#ff8d8d" stroke-width="6" stroke-linecap="round" d="M46 22l14 20M60 22L46 42"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <path fill="currentColor" d="M8 25h12l14-12c2-2 5-.6 5 2v34c0 2.7-3.1 4.1-5 2L20 39H8c-2.2 0-4-1.8-4-4v-6c0-2.2 1.8-4 4-4z"/>
      <path fill="none" stroke="#7fe7ff" stroke-width="5" stroke-linecap="round" d="M44 23c4 5 4 13 0 18M51 17c8 9 8 21 0 30"/>
    </svg>`;
  }

  function createUI(){
    const root=document.createElement('div');
    root.className='kf-music collapsed';
    root.id='kfMusicPlayer';
    root.innerHTML=`
      <div class="kf-music-bar">
        <button class="kf-music-toggle" type="button" title="Музыка">
          <span class="kf-music-note">♫</span>
          <span class="kf-music-toggle-text">
            <span class="kf-music-title">Музыка</span>
            <span class="kf-music-state">загрузка...</span>
          </span>
          <span class="kf-music-collapse">▾</span>
        </button>
        <button class="kf-music-mute" type="button" title="Отключить звук" aria-label="Отключить звук"></button>
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
        <div class="kf-music-hint">Если браузер запрещает автозапуск со звуком, один раз нажмите ▶ или коснитесь страницы. Во второй вкладке второй трек не запускается.</div>
      </div>`;
    document.body.appendChild(root);

    root.querySelector('.kf-music-toggle').addEventListener('click',()=>{
      root.classList.toggle('collapsed');
      render();
    });

    root.querySelector('.kf-music-mute').addEventListener('click',async e=>{
      e.stopPropagation();
      await toggleMute();
    });

    root.querySelector('.kf-music-play').addEventListener('click',async()=>{
      if(isOwner && !audio.paused){
        pause();
      }else{
        const owner=getOwner();
        saveState({enabled:true});
        await play({force:!!(owner&&owner.id!==tabId),gesture:true});
      }
    });

    root.querySelector('.kf-prev').addEventListener('click',()=>changeTrack(-1));
    root.querySelector('.kf-next').addEventListener('click',()=>changeTrack(1));

    root.querySelector('.kf-music-volume').addEventListener('input',e=>{
      const v=Number(e.target.value);
      audio.volume=v;
      saveState({volume:v});
    });

    root.querySelector('.kf-music-progress').addEventListener('input',e=>{
      if(!Number.isFinite(audio.duration)||audio.duration<=0) return;
      const next=Number(e.target.value)/1000*audio.duration;
      audio.currentTime=next;
      saveState({currentTime:next});
    });
  }

  function render(custom){
    const root=document.getElementById('kfMusicPlayer');
    if(!root) return;
    const track=TRACKS[state.trackIndex]||TRACKS[0];
    const owner=getOwner();
    root.querySelector('.kf-music-track').textContent=track.title;
    root.querySelector('.kf-music-title').textContent=track.title;

    let status=custom||'готова';
    if(mediaError) status='MP3 не найден на GitHub';
    else if(!state.enabled) status='на паузе';
    else if(owner&&owner.id!==tabId) status='играет в другой вкладке';
    else if(isOwner&&!audio.paused&&audio.muted) status='играет без звука';
    else if(isOwner&&!audio.paused) status='играет';
    else if(blocked) status='нажмите ▶ или на страницу';

    const stateNode=root.querySelector('.kf-music-state');
    stateNode.textContent=status;
    stateNode.classList.toggle('kf-music-error',mediaError);

    root.querySelector('.kf-music-play').textContent=(isOwner&&!audio.paused)?'❚❚':'▶';
    root.querySelector('.kf-music-collapse').textContent=root.classList.contains('collapsed')?'▾':'▴';

    const mute=root.querySelector('.kf-music-mute');
    mute.innerHTML=speakerSvg(state.muted);
    mute.title=state.muted?'Включить звук':'Отключить звук';
    mute.setAttribute('aria-label',mute.title);

    root.querySelector('.kf-music-volume').value=String(state.volume);
    const dur=Number.isFinite(audio.duration)?audio.duration:0;
    const cur=isOwner?audio.currentTime:state.currentTime;
    root.querySelector('.kf-music-time').textContent=`${fmt(cur)} / ${fmt(dur)}`;
    root.querySelector('.kf-music-progress').value=dur>0?String(Math.min(1000,Math.round(cur/dur*1000))):'0';
  }

  audio.addEventListener('loadedmetadata',()=>{
    mediaError=false;
    render();
  });
  audio.addEventListener('canplay',()=>{mediaError=false;render()});
  audio.addEventListener('timeupdate',()=>{if(isOwner)render()});
  audio.addEventListener('durationchange',render);
  audio.addEventListener('ended',()=>changeTrack(1));
  audio.addEventListener('error',()=>{
    mediaError=true;
    render('MP3 не найден на GitHub');
  });

  window.addEventListener('storage',e=>{
    if(e.key===STATE_KEY){
      const oldTrack=state.trackIndex;
      state=loadState();
      if(isOwner){
        audio.volume=state.volume;
        audio.muted=state.muted;
        if(oldTrack!==state.trackIndex) setTrack(state.trackIndex,true);
        if(!state.enabled){
          audio.pause();stopSaving();releaseOwner();
        }
      }
      render();
    }else if(e.key===OWNER_KEY){
      const owner=getOwner();
      if(isOwner&&owner&&owner.id!==tabId){
        audio.pause();stopSaving();isOwner=false;
      }
      render();
    }
  });

  bc?.addEventListener('message',e=>{
    const m=e.data||{};
    if(m.from===tabId) return;
    if(m.type==='state'&&m.state){
      state={...state,...m.state};
      if(isOwner){audio.volume=state.volume;audio.muted=state.muted}
      render();
    }
    if(m.type==='takeover'&&m.id!==tabId&&isOwner){
      audio.pause();stopSaving();releaseOwner();render();
    }
  });

  async function gestureStart(e){
    if(!state.enabled || state.muted || isOwner) return;
    if(e.target?.closest?.('#kfMusicPlayer')) return;
    const owner=getOwner();
    if(owner&&owner.id!==tabId) return;
    await play({gesture:true});
  }
  document.addEventListener('pointerdown',gestureStart,{passive:true});
  document.addEventListener('keydown',gestureStart);

  window.addEventListener('pagehide',()=>{
    if(isOwner){
      saveState({
        currentTime:audio.currentTime||0,
        volume:audio.volume,
        muted:audio.muted,
        enabled:state.enabled
      });
      releaseOwner();
    }
  });

  function boot(){
    createUI();
    setTrack(state.trackIndex,true);
    render();
    const owner=getOwner();
    if(state.enabled&&!owner){
      setTimeout(()=>play({gesture:false}),100);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
