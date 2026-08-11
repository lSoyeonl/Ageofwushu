(function(){
  if(window.__KF_IMAGE_TOOLS_0041__)return;
  window.__KF_IMAGE_TOOLS_0041__=true;

  const MB=1024*1024;
  let selectedImage=null;

  function blobToDataURL(blob){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=()=>reject(new Error('Не удалось прочитать изображение.'));
      r.readAsDataURL(blob);
    });
  }
  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('Формат изображения не поддерживается браузером.'));
      img.src=src;
    });
  }
  function canvasBlob(canvas,type,quality){return new Promise(resolve=>canvas.toBlob(resolve,type,quality))}

  async function process(file,opts={}){
    if(!file)return '';
    if(!String(file.type||'').startsWith('image/'))throw new Error('Выберите файл изображения.');
    if(file.size>25*MB)throw new Error('Максимальный размер исходного изображения — 25 МБ.');

    if(String(file.type).toLowerCase()==='image/gif'){
      if(file.size>8*MB)throw new Error('GIF должен быть не больше 8 МБ.');
      return blobToDataURL(file);
    }

    const maxSide=Math.max(1400,Math.min(Number(opts.maxSide)||2600,3600));
    const preserveBytes=Number(opts.preserveBytes)||4.5*MB;
    const targetBytes=Number(opts.targetBytes)||3.4*MB;
    const raw=await blobToDataURL(file);
    const img=await loadImage(raw);
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;

    // Не пережимаем уже подходящий файл.
    if(Math.max(iw,ih)<=maxSide && file.size<=preserveBytes)return raw;

    const scale=Math.min(1,maxSide/Math.max(iw,ih));
    let width=Math.max(1,Math.round(iw*scale));
    let height=Math.max(1,Math.round(ih*scale));
    let quality=.97, blob=null;

    for(let pass=0;pass<8;pass++){
      const c=document.createElement('canvas');
      c.width=width;c.height=height;
      const ctx=c.getContext('2d',{alpha:true});
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,0,0,width,height);
      blob=await canvasBlob(c,'image/webp',quality);
      if(!blob)break;
      if(blob.size<=targetBytes||Math.max(width,height)<=1500)break;
      if(quality>.88)quality-=.02;
      else{width=Math.round(width*.92);height=Math.round(height*.92)}
    }
    return blob?blobToDataURL(blob):raw;
  }

  async function processAvatar(file,size=512){
    if(!file)return '';
    if(!String(file.type||'').startsWith('image/'))throw new Error('Выберите файл изображения.');
    if(file.size>25*MB)throw new Error('Максимальный размер исходного изображения — 25 МБ.');

    const raw=await blobToDataURL(file);
    const img=await loadImage(raw);
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
    const side=Math.min(iw,ih);
    const sx=Math.max(0,Math.round((iw-side)/2));
    const sy=Math.max(0,Math.round((ih-side)/2));
    const outSize=Math.max(256,Math.min(Number(size)||512,1024));
    const c=document.createElement('canvas');
    c.width=outSize;c.height=outSize;
    const ctx=c.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#071824';ctx.fillRect(0,0,outSize,outSize);
    ctx.drawImage(img,sx,sy,side,side,0,0,outSize,outSize);
    const blob=await canvasBlob(c,'image/webp',.96);
    if(!blob)throw new Error('Не удалось подготовить аватар.');
    return blobToDataURL(blob);
  }

  function rangeInside(editor){
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount)return null;
    const r=sel.getRangeAt(0);
    return editor.contains(r.commonAncestorContainer)?r.cloneRange():null;
  }

  function modeStyle(mode){
    if(mode==='wrap')return 'float:left;max-width:48%;width:auto;height:auto;margin:6px 14px 8px 0;border-radius:8px;';
    if(mode==='block')return 'display:block;clear:both;max-width:100%;width:auto;height:auto;margin:12px auto;border-radius:8px;';
    if(mode==='behind')return 'display:block;max-width:100%;width:auto;height:auto;margin:8px auto;opacity:.42;position:relative;z-index:0;border-radius:8px;';
    if(mode==='front')return 'display:block;max-width:100%;width:auto;height:auto;margin:8px auto;position:relative;z-index:3;box-shadow:0 10px 28px rgba(0,0,0,.28);border-radius:8px;';
    return 'max-width:100%;width:auto;height:auto;vertical-align:middle;margin:5px;border-radius:8px;';
  }

  function markSelected(img){
    document.querySelectorAll('.rich-editor img.kf-selected-rich-image').forEach(x=>x.classList.remove('kf-selected-rich-image'));
    selectedImage=img||null;
    if(selectedImage)selectedImage.classList.add('kf-selected-rich-image');
  }

  function editorImageClick(e){
    const img=e.target.closest?.('img');
    if(img&&e.currentTarget.contains(img)){
      e.preventDefault();
      markSelected(img);
    }
  }

  function bindEditors(){
    document.querySelectorAll('.rich-editor').forEach(ed=>{
      if(ed.dataset.kfImageBound)return;
      ed.dataset.kfImageBound='1';
      ed.addEventListener('click',editorImageClick);
    });
  }

  async function insertIntoEditor(editorId='rich',mode='inline'){
    const editor=document.getElementById(editorId);
    if(!editor)return;
    editor.focus();
    const savedRange=rangeInside(editor);

    const input=document.createElement('input');
    input.type='file';input.accept='image/*';input.multiple=true;input.style.display='none';
    document.body.appendChild(input);

    input.onchange=async()=>{
      const files=[...(input.files||[])];input.remove();
      if(!files.length)return;
      try{
        const arr=[];
        for(const file of files)arr.push(await process(file,{maxSide:2600,preserveBytes:4.5*MB,targetBytes:3.4*MB}));

        editor.focus();
        const sel=window.getSelection();
        if(savedRange&&sel){sel.removeAllRanges();sel.addRange(savedRange)}
        else if(sel){const r=document.createRange();r.selectNodeContents(editor);r.collapse(false);sel.removeAllRanges();sel.addRange(r)}

        const style=modeStyle(mode);
        for(const src of arr){
          document.execCommand('insertHTML',false,`<img src="${src}" alt="Изображение" data-kf-image-mode="${mode}" style="${style}">`);
          if(mode!=='inline')document.execCommand('insertHTML',false,'<p><br></p>');
        }
        bindEditors();
      }catch(e){alert(e.message||'Не удалось добавить изображение.')}
    };
    input.click();
  }

  function resizeSelected(editorId='rich',value='auto'){
    const editor=document.getElementById(editorId);
    if(!selectedImage||!editor?.contains(selectedImage)){
      alert('Сначала нажмите на изображение внутри редактора.');
      return;
    }
    if(value==='auto'){
      selectedImage.style.width='auto';
      selectedImage.style.maxWidth='100%';
    }else{
      const n=Math.max(10,Math.min(100,Number(value)||100));
      selectedImage.style.width=n+'%';
      selectedImage.style.maxWidth=n+'%';
    }
    selectedImage.style.height='auto';
  }

  function setSelectedMode(editorId='rich',mode='inline'){
    const editor=document.getElementById(editorId);
    if(!selectedImage||!editor?.contains(selectedImage)){
      alert('Сначала нажмите на изображение внутри редактора.');
      return;
    }
    const keepWidth=selectedImage.style.width||'auto';
    selectedImage.style.cssText=modeStyle(mode);
    selectedImage.style.width=keepWidth;
    if(keepWidth!=='auto')selectedImage.style.maxWidth=keepWidth;
    selectedImage.dataset.kfImageMode=mode;
    selectedImage.classList.add('kf-selected-rich-image');
  }

  function setFontWeight(editorId='rich',weight=400){
    const editor=document.getElementById(editorId);
    if(!editor)return;
    const w=Number(weight)===300?300:400;
    editor.focus();
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount||sel.isCollapsed){
      editor.style.fontFamily="'Oswald', Arial, sans-serif";
      editor.style.fontWeight=String(w);
      return;
    }
    const range=sel.getRangeAt(0);
    if(!editor.contains(range.commonAncestorContainer))return;
    const span=document.createElement('span');
    span.style.fontFamily="'Oswald', Arial, sans-serif";
    span.style.fontWeight=String(w);
    try{range.surroundContents(span)}
    catch{
      const frag=range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const r=document.createRange();
    r.selectNodeContents(span);
    sel.addRange(r);
  }

  function setFontSize(editorId='rich',px=14){
    const editor=document.getElementById(editorId);
    if(!editor)return;
    const n=Math.max(5,Math.min(30,Number(px)||14));
    editor.focus();

    // execCommand остаётся наиболее совместимым для существующего contenteditable.
    document.execCommand('fontSize',false,'7');
    editor.querySelectorAll('font[size="7"]').forEach(font=>{
      const span=document.createElement('span');
      span.style.fontSize=n+'px';
      while(font.firstChild)span.appendChild(font.firstChild);
      font.replaceWith(span);
    });
  }

  document.addEventListener('DOMContentLoaded',bindEditors);

  window.KFImageTools={process,processAvatar,insertIntoEditor,resizeSelected,setSelectedMode,setFontSize,setFontWeight,bindEditors};
  window.imageToData=(file,maxSide=2600)=>process(file,{maxSide,preserveBytes:4.5*MB,targetBytes:3.4*MB});
  window.fileToData=(input,cb)=>{
    const file=input?.files?.[0];if(!file){cb('');return}
    process(file,{maxSide:2400,preserveBytes:4.0*MB,targetBytes:3.1*MB})
      .then(cb).catch(e=>{alert(e.message||'Не удалось обработать изображение.');input.value='';cb('')});
  };
  window.insertImageIntoRichEditor=insertIntoEditor;
  window.resizeSelectedRichImage=resizeSelected;
  window.setSelectedRichImageMode=setSelectedMode;
  window.setRichFontSize=setFontSize;
  window.setRichFontWeight=setFontWeight;
})();