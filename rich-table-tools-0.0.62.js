(function(){
  if(window.__KF_RICH_TABLE_TOOLS_0062__)return;
  window.__KF_RICH_TABLE_TOOLS_0062__=true;

  let activeCell=null;

  function injectStyle(){
    if(document.getElementById('kfTableToolsStyle'))return;
    const s=document.createElement('style');
    s.id='kfTableToolsStyle';
    s.textContent=`
      .kf-table-tools{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0 4px;padding:8px;border:1px solid rgba(228,180,94,.18);border-radius:9px;background:rgba(228,180,94,.045)}
      .kf-table-tools b{color:#ffe2a0;font-size:12px;margin-right:2px}
      .kf-table-tools button{min-height:32px;border:1px solid rgba(228,180,94,.25);border-radius:7px;background:#102b3b;color:#fff;padding:0 9px;cursor:pointer;font:inherit;font-size:11px}
      .kf-table-tools button:hover{border-color:rgba(255,226,160,.6);color:#ffe2a0}
      .kf-table-tools small{width:100%;color:#91a8b2;font-size:10px}
      .kf-table-active-cell{outline:2px solid #f0c76f!important;outline-offset:-2px;background:rgba(228,180,94,.09)!important}
    `;
    document.head.appendChild(s);
  }

  function editor(){return document.getElementById('rich')}
  function selected(){
    if(activeCell&&document.body.contains(activeCell)&&editor()?.contains(activeCell))return activeCell;
    return null;
  }
  function setCell(cell){
    if(activeCell)activeCell.classList.remove('kf-table-active-cell');
    activeCell=cell||null;
    if(activeCell)activeCell.classList.add('kf-table-active-cell');
  }
  function needCell(){
    const cell=selected();
    if(!cell){
      alert('Сначала нажмите на ячейку таблицы.');
      return null;
    }
    return cell;
  }
  function span(cell){return Math.max(1,Number(cell.getAttribute('colspan')||1)||1)}
  function rowSpan(cell){return Math.max(1,Number(cell.getAttribute('rowspan')||1)||1)}
  function logicalWidth(row){
    return [...row.cells].reduce((n,c)=>n+span(c),0);
  }
  function cellStartColumn(cell){
    let col=0;
    for(const c of cell.parentElement.cells){
      if(c===cell)return col;
      col+=span(c);
    }
    return col;
  }
  function cellAtColumn(row,col){
    let start=0;
    for(const c of row.cells){
      const end=start+span(c);
      if(col>=start&&col<end)return {cell:c,start,end};
      start=end;
    }
    return null;
  }
  function newCell(tag='td',text='Текст'){
    const c=document.createElement(tag);
    c.innerHTML=text;
    return c;
  }

  function addRowBelow(){
    const cell=needCell();if(!cell)return;
    const row=cell.parentElement,table=cell.closest('table');
    const width=Math.max(1,...[...table.rows].map(logicalWidth));
    const nr=table.insertRow(row.rowIndex+1);
    for(let i=0;i<width;i++)nr.appendChild(newCell('td'));
    setCell(nr.cells[Math.min(cell.cellIndex,nr.cells.length-1)]||nr.cells[0]);
  }

  function addColumnRight(){
    const cell=needCell();if(!cell)return;
    const table=cell.closest('table');
    const insertCol=cellStartColumn(cell)+span(cell);

    for(const row of table.rows){
      const found=cellAtColumn(row,insertCol);
      if(found && found.start<insertCol){
        found.cell.setAttribute('colspan',String(span(found.cell)+1));
        continue;
      }

      let start=0,inserted=false;
      for(const c of [...row.cells]){
        const end=start+span(c);
        if(start>=insertCol){
          row.insertBefore(newCell(c.tagName.toLowerCase()),c);
          inserted=true;
          break;
        }
        start=end;
      }
      if(!inserted)row.appendChild(newCell(row.parentElement.tagName==='THEAD'?'th':'td'));
    }
  }

  function mergeRight(){
    const cell=needCell();if(!cell)return;
    const next=cell.nextElementSibling;
    if(!next||!['TD','TH'].includes(next.tagName)){
      alert('Справа нет соседней ячейки для объединения.');
      return;
    }
    const total=span(cell)+span(next);
    cell.setAttribute('colspan',String(total));
    const a=(cell.innerHTML||'').trim(),b=(next.innerHTML||'').trim();
    cell.innerHTML=(a&&b)?`${a}<br>${b}`:(a||b||'');
    next.remove();
    setCell(cell);
  }

  function mergeLeft(){
    const cell=needCell();if(!cell)return;
    const prev=cell.previousElementSibling;
    if(!prev||!['TD','TH'].includes(prev.tagName)){
      alert('Слева нет соседней ячейки для объединения.');
      return;
    }
    const total=span(prev)+span(cell);
    prev.setAttribute('colspan',String(total));
    const a=(prev.innerHTML||'').trim(),b=(cell.innerHTML||'').trim();
    prev.innerHTML=(a&&b)?`${a}<br>${b}`:(a||b||'');
    cell.remove();
    setCell(prev);
  }

  function splitCell(){
    const cell=needCell();if(!cell)return;
    const count=span(cell);
    if(count<=1){
      alert('Эта ячейка не объединена по колонкам.');
      return;
    }
    cell.removeAttribute('colspan');
    let after=cell;
    for(let i=1;i<count;i++){
      const c=newCell(cell.tagName.toLowerCase(),'Текст');
      after.insertAdjacentElement('afterend',c);
      after=c;
    }
    setCell(cell);
  }

  function deleteRow(){
    const cell=needCell();if(!cell)return;
    const table=cell.closest('table');
    if(table.rows.length<=1){alert('Нельзя удалить единственную строку.');return}
    cell.parentElement.remove();setCell(null);
  }

  function deleteColumn(){
    const cell=needCell();if(!cell)return;
    const table=cell.closest('table');
    const col=cellStartColumn(cell);
    for(const row of [...table.rows]){
      const found=cellAtColumn(row,col);
      if(!found)continue;
      if(span(found.cell)>1)found.cell.setAttribute('colspan',String(span(found.cell)-1));
      else found.cell.remove();
    }
    setCell(null);
  }

  function makeToolbar(ed){
    if(document.getElementById('kfRichTableTools'))return;
    const box=document.createElement('div');
    box.className='kf-table-tools';
    box.id='kfRichTableTools';
    box.innerHTML=`
      <b>Таблица:</b>
      <button type="button" data-act="row">+ строка ниже</button>
      <button type="button" data-act="col">+ колонка справа</button>
      <button type="button" data-act="mergeLeft">Объединить ←</button>
      <button type="button" data-act="mergeRight">Объединить →</button>
      <button type="button" data-act="split">Разъединить</button>
      <button type="button" data-act="delRow">− строка</button>
      <button type="button" data-act="delCol">− колонка</button>
      <small>Нажмите на нужную ячейку таблицы, затем выберите действие.</small>`;
    const toolbar=ed.parentElement?.querySelector('.rich-toolbar');
    if(toolbar)toolbar.insertAdjacentElement('afterend',box);
    else ed.insertAdjacentElement('beforebegin',box);

    const actions={row:addRowBelow,col:addColumnRight,mergeLeft,mergeRight,split:splitCell,delRow:deleteRow,delCol:deleteColumn};
    box.addEventListener('click',e=>{
      const btn=e.target.closest('button[data-act]');
      if(!btn)return;
      actions[btn.dataset.act]?.();
      ed.dispatchEvent(new Event('input',{bubbles:true}));
    });
  }

  function install(){
    injectStyle();
    const ed=editor();
    if(!ed)return;
    makeToolbar(ed);
    ed.addEventListener('click',e=>{
      const cell=e.target.closest('td,th');
      if(cell&&ed.contains(cell))setCell(cell);
      else if(!e.target.closest('table'))setCell(null);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  window.KFRichTableTools={install,addRowBelow,addColumnRight,mergeLeft,mergeRight,splitCell,deleteRow,deleteColumn};
})();
