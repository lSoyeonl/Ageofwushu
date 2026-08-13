/* Легенды Кунг-Фу 0.0.69 — Word-like rich text toolbar */

(function(){

  if(window.__KF_WORD_EDITOR_0069__) return;
  window.__KF_WORD_EDITOR_0069__ = true;


  const COLORS = [
    '#000000','#434343','#666666','#999999','#b7b7b7',
    '#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff',

    '#980000','#ff0000','#ff9900','#ffff00','#00ff00',
    '#00ffff','#4a86e8','#0000ff','#9900ff','#ff00ff',

    '#660000','#783f04','#7f6000','#274e13','#0c343d',
    '#073763','#20124d','#4c1130','#a61c00','#e69138',

    '#f1c232','#6aa84f','#45818e','#3d85c6','#674ea7',
    '#a64d79','#cc0000','#f6b26b','#ffd966','#93c47d'
  ];


  const FONTS = [
    ['Oswald','Oswald, Arial, sans-serif'],
    ['Arial','Arial, sans-serif'],
    ['Verdana','Verdana, sans-serif'],
    ['Tahoma','Tahoma, sans-serif'],
    ['Georgia','Georgia, serif'],
    ['Times New Roman','Times New Roman, serif'],
    ['Courier New','Courier New, monospace']
  ];


  let savedRange = null;
  let activeEditor = null;
  let openPalette = null;


  function escAttr(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/"/g,'&quot;')
      .replace(/</g,'&lt;');
  }


  function findEditor(toolbar){
    const id = toolbar.dataset.richEditor || 'rich';

    return document.getElementById(id) ||
           toolbar.parentElement.querySelector('.rich-editor');
  }


  function selectionIn(editor){

    const sel = window.getSelection();

    if(!sel || !sel.rangeCount){
      return false;
    }

    const r = sel.getRangeAt(0);

    return editor.contains(r.commonAncestorContainer) ||
           r.commonAncestorContainer === editor;
  }


  function remember(editor){

    if(!editor || !selectionIn(editor)){
      return;
    }

    const sel = window.getSelection();

    if(sel && sel.rangeCount){

      savedRange = sel.getRangeAt(0).cloneRange();
      activeEditor = editor;

    }
  }


  function restore(editor){

    editor = editor || activeEditor;

    if(!editor){
      return false;
    }

    editor.focus();

    if(savedRange){

      try{

        const sel = window.getSelection();

        sel.removeAllRanges();
        sel.addRange(savedRange);

        return true;

      }catch(e){}

    }

    return false;
  }


  function exec(editor,cmd,val=null){

    restore(editor);

    try{

      document.execCommand(cmd,false,val);

    }catch(e){}

    remember(editor);
  }


  function applyFontSize(editor,px){

    const n = Math.max(
      5,
      Math.min(72,Number(px) || 16)
    );

    restore(editor);


    if(
      typeof window.setRichFontSize === 'function' &&
      n <= 30
    ){

      window.setRichFontSize(editor.id,n);

    }else{

      document.execCommand(
        'fontSize',
        false,
        '7'
      );


      editor
        .querySelectorAll('font[size="7"]')
        .forEach(font=>{

          const span = document.createElement('span');

          span.style.fontSize = n + 'px';

          while(font.firstChild){
            span.appendChild(font.firstChild);
          }

          font.replaceWith(span);

        });

    }


    remember(editor);
  }


  function currentSize(input){

    const n = parseInt(input.value,10);

    return Number.isFinite(n) ? n : 16;
  }


  function changeSize(editor,input,delta){

    const n = Math.max(
      5,
      Math.min(
        72,
        currentSize(input) + delta
      )
    );

    input.value = n;

    applyFontSize(editor,n);
  }


  function createLink(editor){

    restore(editor);

    const url = prompt(
      'Вставьте ссылку (https://...)',
      'https://'
    );

    if(!url){
      return;
    }


    try{

      const u = new URL(url);

      if(
        !['http:','https:'].includes(u.protocol)
      ){
        throw new Error('protocol');
      }

      document.execCommand(
        'createLink',
        false,
        u.href
      );

    }catch(e){

      alert(
        'Введите корректную ссылку http:// или https://'
      );

    }


    remember(editor);
  }


  function applyLineHeight(editor,value){

    restore(editor);

    const sel = window.getSelection();

    if(!sel || !sel.rangeCount){
      return;
    }


    const range = sel.getRangeAt(0);

    const nodes = [];

    const root =
      range.commonAncestorContainer.nodeType === 1
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;


    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );


    let node;


    while(
      (node = walker.nextNode())
    ){

      try{

        if(
          range.intersectsNode(node) &&
          node.nodeValue.trim()
        ){
          nodes.push(node);
        }

      }catch(e){}

    }


    if(
      !nodes.length &&
      range.startContainer
    ){

      nodes.push(
        range.startContainer.nodeType === 3
          ? range.startContainer
          : range.startContainer.firstChild
      );

    }


    const seen = new Set();


    nodes
      .filter(Boolean)
      .forEach(n=>{

        let el =
          n.nodeType === 1
            ? n
            : n.parentElement;


        while(
          el &&
          el !== editor &&
          !/^(P|DIV|LI|H1|H2|H3|BLOCKQUOTE|TD|TH)$/i
            .test(el.tagName)
        ){

          el = el.parentElement;

        }


        if(
          el &&
          el !== editor &&
          !seen.has(el)
        ){

          el.style.lineHeight = value;
          seen.add(el);

        }

      });


    remember(editor);
  }


  function paletteHtml(type){

    const title =
      type === 'text'
        ? 'Стандартные цвета текста'
        : 'Стандартные цвета выделения';


    const resetText =
      type === 'text'
        ? 'Цвет по умолчанию'
        : 'Убрать выделение';


    const swatches = COLORS
      .map(c=>{

        return `
          <button
            type="button"
            class="kf-swatch"
            data-color="${c}"
            style="--swatch:${c};background-color:${c}"
            title="${c}"
            aria-label="${c}">
          </button>
        `;

      })
      .join('');


    return `
      <div
        class="kf-palette"
        data-palette="${type}">

        <div class="kf-palette-title">
          ${title}
        </div>

        <div class="kf-palette-grid">
          ${swatches}
        </div>

        <button
          type="button"
          class="kf-palette-reset"
          data-color-reset="${type}">
          ${resetText}
        </button>

      </div>
    `;
  }


  function closePalettes(){

    document
      .querySelectorAll('.kf-palette.open')
      .forEach(p=>{
        p.classList.remove('open');
      });

    openPalette = null;
  }


  function openPaletteFor(toolbar,type,button){

    const p = toolbar.querySelector(
      `[data-palette="${type}"]`
    );

    if(!p){
      return;
    }


    const was =
      p.classList.contains('open');


    closePalettes();


    if(was){
      return;
    }


    const tb =
      toolbar.getBoundingClientRect();

    const b =
      button.getBoundingClientRect();


    p.style.left =
      Math.max(
        0,
        Math.min(
          toolbar.clientWidth - 238,
          b.left - tb.left
        )
      ) + 'px';


    p.classList.add('open');

    openPalette = p;
  }


  function toolbarHtml(){

    return `

      <span class="kf-group">

        <select
          class="kf-format"
          data-action="format"
          title="Стиль абзаца">

          <option value="p">
            Обычный
          </option>

          <option value="h2">
            Заголовок 1
          </option>

          <option value="h3">
            Заголовок 2
          </option>

          <option value="blockquote">
            Цитата
          </option>

        </select>


        <select
          class="kf-font"
          data-action="font"
          title="Шрифт">

          ${FONTS.map(([n,v])=>
            `<option value="${escAttr(v)}">${n}</option>`
          ).join('')}

        </select>

      </span>


      <span class="kf-group">

        <button
          type="button"
          data-action="sizeDown"
          title="Уменьшить шрифт">
          −
        </button>

        <input
          class="kf-size-input"
          data-action="size"
          type="number"
          min="5"
          max="72"
          value="16"
          title="Размер шрифта, px">

        <button
          type="button"
          data-action="sizeUp"
          title="Увеличить шрифт">
          +
        </button>

      </span>


      <span class="kf-group">

        <button
          type="button"
          class="kf-strong"
          data-cmd="bold"
          title="Полужирный">
          B
        </button>

        <button
          type="button"
          class="kf-italic"
          data-cmd="italic"
          title="Курсив">
          I
        </button>

        <button
          type="button"
          class="kf-under"
          data-cmd="underline"
          title="Подчёркивание">
          U
        </button>

        <button
          type="button"
          class="kf-strike"
          data-cmd="strikeThrough"
          title="Зачёркивание">
          S
        </button>

      </span>


      <span class="kf-group">

        <button
          type="button"
          class="kf-color-btn"
          data-action="textColor"
          title="Цвет текста">
          A
        </button>

        <button
          type="button"
          class="kf-highlight-btn"
          data-action="highlight"
          title="Цвет выделения">
          ▰
        </button>

      </span>


      <span class="kf-group">

        <button
          type="button"
          data-action="link"
          title="Вставить ссылку">
          🔗
        </button>

        <button
          type="button"
          data-cmd="unlink"
          title="Удалить ссылку">
          ⛓
        </button>

        <button
          type="button"
          data-action="image"
          title="Вставить изображение">
          ▧+
        </button>


        <select
          id="richImageMode"
          data-action="imageMode"
          title="Положение изображения">

          <option value="inline">
            В тексте
          </option>

          <option value="wrap">
            Обтекание
          </option>

          <option value="block">
            Сверху/снизу
          </option>

          <option value="behind">
            За текстом
          </option>

          <option value="front">
            Поверх текста
          </option>

        </select>


        <select
          data-action="imageSize"
          title="Размер выделенной картинки">

          <option value="">
            Размер фото
          </option>

          <option value="auto">
            Авто
          </option>

          <option value="25">
            25%
          </option>

          <option value="40">
            40%
          </option>

          <option value="50">
            50%
          </option>

          <option value="60">
            60%
          </option>

          <option value="75">
            75%
          </option>

          <option value="100">
            100%
          </option>

        </select>


        <button
          type="button"
          data-action="imagePosition"
          title="Применить выбранное положение к картинке">
          Фото ↔
        </button>

      </span>


      <span class="kf-group">

        <button
          type="button"
          data-cmd="justifyLeft"
          title="По левому краю">
          ☰
        </button>

        <button
          type="button"
          data-cmd="justifyCenter"
          title="По центру">
          ≡
        </button>

        <button
          type="button"
          data-cmd="justifyRight"
          title="По правому краю">
          ☷
        </button>

        <button
          type="button"
          data-cmd="justifyFull"
          title="По ширине">
          ▤
        </button>


        <select
          class="kf-line"
          data-action="line"
          title="Межстрочный интервал">

          <option value="">
            Интервал
          </option>

          <option value="1">
            1,0
          </option>

          <option value="1.15">
            1,15
          </option>

          <option value="1.5">
            1,5
          </option>

          <option value="2">
            2,0
          </option>

        </select>

      </span>


      <span class="kf-group">

        <button
          type="button"
          data-cmd="insertUnorderedList"
          title="Маркированный список">
          •≡
        </button>

        <button
          type="button"
          data-cmd="insertOrderedList"
          title="Нумерованный список">
          1.≡
        </button>

        <button
          type="button"
          data-cmd="outdent"
          title="Уменьшить отступ">
          ⇤
        </button>

        <button
          type="button"
          data-cmd="indent"
          title="Увеличить отступ">
          ⇥
        </button>

      </span>


      <span class="kf-group">

        <button
          type="button"
          data-action="undo"
          title="Отменить">
          ↶
        </button>

        <button
          type="button"
          data-action="redo"
          title="Повторить">
          ↷
        </button>

        <button
          type="button"
          data-action="table"
          title="Вставить таблицу">
          ▦
        </button>

        <button
          type="button"
          data-cmd="removeFormat"
          title="Очистить форматирование">
          Tx
        </button>

      </span>


      ${paletteHtml('text')}
      ${paletteHtml('highlight')}

    `;
  }


  function bindToolbar(toolbar){

    const editor = findEditor(toolbar);

    if(!editor){
      return;
    }


    toolbar.dataset.richEditor =
      editor.id || 'rich';

    toolbar.classList.add(
      'kf-word-toolbar'
    );

    toolbar.innerHTML =
      toolbarHtml();


    editor.addEventListener(
      'keyup',
      ()=>remember(editor)
    );


    editor.addEventListener(
      'mouseup',
      ()=>remember(editor)
    );


    editor.addEventListener(
      'input',
      ()=>remember(editor)
    );


    /*
      Не даём кнопкам тулбара
      сбрасывать выделение текста.
    */

    toolbar.addEventListener(
      'mousedown',
      e=>{

        if(
          e.target.closest('button')
        ){
          e.preventDefault();
        }

      }
    );


    toolbar.addEventListener(
      'click',
      e=>{

        const b =
          e.target.closest('button');

        if(!b){
          return;
        }


        /*
          Выбор цвета.
          Проверяем ДО остальных команд.
        */

        const sw =
          b.dataset.color;

        if(sw){

          const type =
            b.closest('.kf-palette')
              ?.dataset.palette;


          exec(
            editor,
            type === 'highlight'
              ? 'hiliteColor'
              : 'foreColor',
            sw
          );


          if(type === 'text'){

            toolbar
              .querySelector('.kf-color-btn')
              ?.style.setProperty(
                '--kf-color',
                sw
              );

          }else{

            toolbar
              .querySelector('.kf-highlight-btn')
              ?.style.setProperty(
                '--kf-highlight',
                sw
              );

          }


          closePalettes();

          return;
        }


        /*
          Сброс цвета.
        */

        const reset =
          b.dataset.colorReset;


        if(reset){

          if(reset === 'highlight'){

            exec(
              editor,
              'hiliteColor',
              'transparent'
            );

            toolbar
              .querySelector('.kf-highlight-btn')
              ?.style.setProperty(
                '--kf-highlight',
                'transparent'
              );

          }else{

            /*
              Цвет текста сайта по умолчанию.
              Если браузер не поддержит removeFormat
              для конкретного span,
              будет установлен inherit.
            */

            restore(editor);

            try{

              document.execCommand(
                'foreColor',
                false,
                'inherit'
              );

            }catch(e){

              document.execCommand(
                'foreColor',
                false,
                '#ffffff'
              );

            }


            toolbar
              .querySelector('.kf-color-btn')
              ?.style.setProperty(
                '--kf-color',
                '#000000'
              );

            remember(editor);

          }


          closePalettes();

          return;
        }


        const cmd =
          b.dataset.cmd;


        if(cmd){

          exec(editor,cmd);

          return;
        }


        const action =
          b.dataset.action;


        if(action === 'sizeDown'){

          changeSize(
            editor,
            toolbar.querySelector(
              '.kf-size-input'
            ),
            -1
          );

        }


        else if(action === 'sizeUp'){

          changeSize(
            editor,
            toolbar.querySelector(
              '.kf-size-input'
            ),
            1
          );

        }


        else if(action === 'textColor'){

          openPaletteFor(
            toolbar,
            'text',
            b
          );

        }


        else if(action === 'highlight'){

          openPaletteFor(
            toolbar,
            'highlight',
            b
          );

        }


        else if(action === 'link'){

          createLink(editor);

        }


        else if(action === 'image'){

          restore(editor);

          if(
            typeof window.insertImageIntoRichEditor
              === 'function'
          ){

            window.insertImageIntoRichEditor(
              editor.id,
              document.getElementById(
                'richImageMode'
              )?.value || 'inline'
            );

          }

        }


        else if(action === 'imagePosition'){

          restore(editor);

          if(
            typeof window.setSelectedRichImageMode
              === 'function'
          ){

            window.setSelectedRichImageMode(
              editor.id,
              document.getElementById(
                'richImageMode'
              )?.value || 'inline'
            );

          }

        }


        else if(action === 'table'){

          restore(editor);

          if(
            typeof window.insertTable
              === 'function'
          ){

            window.insertTable();

          }else{

            document
              .getElementById('insertTable')
              ?.click();

          }

        }


        else if(action === 'undo'){

          exec(editor,'undo');

        }


        else if(action === 'redo'){

          exec(editor,'redo');

        }

      }
    );


    toolbar.addEventListener(
      'change',
      e=>{

        const el =
          e.target;

        const action =
          el.dataset.action;


        if(!action){
          return;
        }


        if(action === 'font'){

          exec(
            editor,
            'fontName',
            el.value
          );

        }


        else if(action === 'format'){

          exec(
            editor,
            'formatBlock',
            el.value
          );

        }


        else if(
          action === 'line' &&
          el.value
        ){

          applyLineHeight(
            editor,
            el.value
          );

          el.selectedIndex = 0;

        }


        else if(
          action === 'imageSize' &&
          el.value
        ){

          restore(editor);

          if(
            typeof window.resizeSelectedRichImage
              === 'function'
          ){

            window.resizeSelectedRichImage(
              editor.id,
              el.value
            );

          }

          el.selectedIndex = 0;

        }


        else if(action === 'size'){

          applyFontSize(
            editor,
            el.value
          );

        }

      }
    );


    toolbar
      .querySelector('.kf-size-input')
      ?.addEventListener(
        'keydown',
        e=>{

          if(e.key === 'Enter'){

            e.preventDefault();

            applyFontSize(
              editor,
              e.currentTarget.value
            );

          }

        }
      );

  }


  function init(){

    document
      .querySelectorAll('.rich-toolbar')
      .forEach(bindToolbar);

  }


  document.addEventListener(
    'selectionchange',
    ()=>{

      const ed =
        document.querySelector(
          '.rich-editor'
        );

      if(
        ed &&
        selectionIn(ed)
      ){

        remember(ed);

      }

    }
  );


  document.addEventListener(
    'click',
    e=>{

      if(
        openPalette &&
        !e.target.closest('.kf-palette') &&
        !e.target.closest(
          '[data-action="textColor"]'
        ) &&
        !e.target.closest(
          '[data-action="highlight"]'
        )
      ){

        closePalettes();

      }

    }
  );


  if(
    document.readyState === 'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {once:true}
    );

  }else{

    init();

  }

})();
