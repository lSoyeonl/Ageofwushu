(function(){
  if(window.__KF_DECOR_V0048__)return;
  window.__KF_DECOR_V0048__=true;

  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(file!=='index.html'&&file!=='')document.body.classList.add('kf-subpage-shimmer');

  const layer=document.createElement('div');
  layer.className='kf-lantern-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.appendChild(layer);

  let serial=0;
  function sparks(x,y){
    for(let i=0;i<9;i++){
      const s=document.createElement('i');
      s.className='kf-lantern-spark';
      s.style.left=x+'px';s.style.top=y+'px';
      const a=(Math.PI*2/9)*i+Math.random()*.35,r=20+Math.random()*32;
      s.style.setProperty('--sx',Math.cos(a)*r+'px');
      s.style.setProperty('--sy',Math.sin(a)*r+'px');
      document.body.appendChild(s);
      setTimeout(()=>s.remove(),650);
    }
  }

  function spawn(delay=0){
    setTimeout(()=>{
      const img=document.createElement('img');
      img.className='kf-lantern';
      img.src=(serial++%2===0)?'lantern-1.png':'lantern-2.png';
      const edge=Math.random()<.5;
      img.style.left=edge?(1+Math.random()*12)+'vw':(84+Math.random()*12)+'vw';
      img.style.setProperty('--rise',(25+Math.random()*12)+'s');
      img.style.animationDelay=(Math.random()*1.2)+'s';

      img.onclick=e=>{
        const r=img.getBoundingClientRect();
        sparks(r.left+r.width/2,r.top+r.height/2);
        img.classList.add('pop');
        setTimeout(()=>img.remove(),360);
        spawn(5000+Math.random()*5000);
      };

      img.addEventListener('animationend',e=>{
        if(e.animationName==='kfLanternRise'){
          img.remove();
          spawn(2500+Math.random()*4500);
        }
      });
      layer.appendChild(img);
    },delay);
  }

  spawn(900);
  spawn(5500);
})();