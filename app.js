const D = window.SOP_DATA;
const $ = (s,r)=> (r||document).querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nl  = s => esc(s).replace(/\n/g,'<br>');

let PROJ = 'dameng';
const pById = id => D.projects.find(p=>p.id===id) || {};

/* ── 頁首 ───────────────────────────────── */
$('#subtitle').textContent = D.meta.org + '　·　' + D.meta.subtitle;
$('#chips').innerHTML = [
  '公版 → 各法會',
  D.items.length + ' 個布置項目',
  D.plateSpec.total + ' 道白盤',
  D.checklist.length + ' 條檢核',
  D.crosscheck.filter(c=>c.status==='已定案').length + ' 字已比對定案'
].map(t=>'<span class="chip">'+esc(t)+'</span>').join('');

/* ── 專案選擇 ───────────────────────────── */
$('#pbtns').innerHTML = D.projects.map(p=>
  '<button class="pbtn' + (p.id===PROJ?' on':'') + '" data-p="'+p.id+'">' +
    '<span class="n">'+esc(p.name)+'</span>' +
    '<span class="t">'+esc(p.type)+'　'+esc(p.venue)+'</span><br>' +
    '<span class="st '+(p.status==='本次規劃'?'now':p.status==='待建立'?'todo':'')+'">'+esc(p.status)+'</span>' +
  '</button>').join('');
$('#pbtns').addEventListener('click', e=>{
  const b = e.target.closest('.pbtn'); if(!b) return;
  PROJ = b.dataset.p;
  document.querySelectorAll('.pbtn').forEach(x=>x.classList.toggle('on', x.dataset.p===PROJ));
  render();
});

/* ── 分頁 ───────────────────────────────── */
const TABS = [
  ['t-do','照著做'], ['t-time','當日時程'], ['t-plate','普桌盤位'], ['t-zone','分區編碼'],
  ['t-ware','物料庫房'], ['t-file','檔案與照片'], ['t-pai','牌位與人力'],
  ['t-chk','檢核表'], ['t-cross','白紙↔紅紙比對'], ['t-todo','待確認']
];
$('#tabs').innerHTML = TABS.map((t,i)=>
  '<button data-t="'+t[0]+'"'+(i===0?' class="active"':'')+'>'+esc(t[1])+'</button>').join('');
$('#tabs').addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.querySelectorAll('section.tab').forEach(s=>s.classList.toggle('active', s.id===b.dataset.t));
  window.scrollTo({top:0,behavior:'smooth'});
});

/* ── ① 照著做 ───────────────────────────── */
function renderDo(){
  const p = pById(PROJ);
  const items = D.items.filter(it=> it.proj.includes(PROJ));
  let h = '<h2 class="sec">照著做　·　'+esc(p.name)+'</h2>' +
    '<p class="lead">逐項展開，照「怎麼做」執行，照「參考照片」比對成果。每一項都掛了時間、數量、庫房位置與主責。</p>';

  h += '<div class="banner"><b>核心原則　</b>'+esc(D.meta.principle)+'</div>';

  if(!items.length){
    h += '<div class="empty">這個專案還沒有依本表建立差異項目。<br>請先切到「公版（共通標準）」照公版做，' +
         '待現場定版後再把差異回填。<br><br>' + esc(p.note) + '</div>';
    $('#t-do').innerHTML = h; return;
  }

  h += '<div class="bar">' +
       '<input class="search" id="q" placeholder="搜尋項目、作法、物料…">' +
       '<button class="btn" id="openAll">全部展開</button>' +
       '<button class="btn" id="closeAll">全部收合</button>' +
       '<button class="btn p" onclick="window.print()">列印工作單</button>' +
       '<span class="cnt" id="cnt"></span></div><div id="steps">';

  items.forEach((it,i)=>{
    h += '<div class="step'+(i===0?' open':'')+'" data-k="'+esc((it.item+it.approach+it.location+it.stock+it.pattern).toLowerCase())+'">' +
      '<div class="step-h"><span class="code">'+esc(it.no)+'</span>' +
      '<h3>'+esc(it.item)+'</h3><span class="when">'+esc(it.settime)+'</span><span class="arw">▶</span></div>' +
      '<div class="step-b">' +
        '<div class="how"><span class="k">怎麼做　APPROACH</span>'+nl(it.approach)+'</div>' +
        '<div class="kv">' +
          f('位置 Location', it.location) +
          f('型式 Pattern', it.pattern) +
          f('參考照片 Fotos', it.fotos) +
          f('桌布 Cloth', it.cloth) +
          f('桌子 Table', it.table) +
          f('盤子 Plate', it.plate, true) +
          f('燈燭 Candle', it.candle) +
          f('供品盒／餐盒', it.box) +
          f('數量 Qty', it.qty, true) +
          f('布置時間', it.settime, true) +
          f('物料庫房位置', it.stock, true) +
          f('主責', it.owner) +
          f('教學／樣板', it.teach) +
        '</div>' +
        (it.remark ? '<div class="src">草稿出處　'+esc(it.remark)+'</div>' : '') +
      '</div></div>';
  });
  h += '</div>';
  $('#t-do').innerHTML = h;

  const steps = [...document.querySelectorAll('#steps .step')];
  $('#cnt').textContent = steps.length + ' 個項目';
  $('#openAll').onclick  = ()=> steps.forEach(s=>s.classList.add('open'));
  $('#closeAll').onclick = ()=> steps.forEach(s=>s.classList.remove('open'));
  $('#q').oninput = e=>{
    const q = e.target.value.trim().toLowerCase();
    let n = 0;
    steps.forEach(s=>{
      const hit = !q || s.dataset.k.includes(q);
      s.style.display = hit ? '' : 'none';
      if(hit){ n++; if(q) s.classList.add('open'); }
    });
    $('#cnt').textContent = n + ' 個項目';
  };
}
function f(k,v,em){
  if(!v || v==='—') return '<div class="f"><span class="k">'+esc(k)+'</span><span class="v" style="color:#b3a68d">—</span></div>';
  return '<div class="f"><span class="k">'+esc(k)+'</span><span class="v'+(em?' em':'')+'">'+esc(v)+'</span></div>';
}

/* ── ② 時程 ─────────────────────────────── */
function renderTime(){
  const rows = D.schedule.filter(s=> s.proj===PROJ || PROJ==='common');
  let h = '<h2 class="sec">當日時程</h2><p class="lead">兩張草稿的時間點比對後合併，每一列都標了出處。</p>';
  if(!rows.length){ $('#t-time').innerHTML = h + '<div class="empty">這個專案尚未建立時程。</div>'; return; }
  h += '<div class="card tl">' + rows.map(s=>
    '<div class="row"><div class="t">'+esc(s.time)+'</div><div>' +
    '<h4>'+esc(s.title)+'</h4><div class="d">'+esc(s.detail)+'</div>' +
    '<div class="o">主責　'+esc(s.owner)+'　｜　出處　'+esc(s.src)+'</div></div></div>').join('') + '</div>';
  $('#t-time').innerHTML = h;
}

/* ── ③ 盤位 ─────────────────────────────── */
function renderPlate(){
  const ps = D.plateSpec;
  let h = '<h2 class="sec">普桌　'+ps.total+' 道白盤　盤位圖</h2>' +
    '<p class="lead">標籤格式 '+esc(ps.labelFormat)+'。每個盤子貼一張標籤，標籤上的碼要跟平面配置圖、Excel、照片檔名四者一致。</p>' +
    '<div class="banner"><b>編碼尚未定版　</b>'+esc(ps.note)+'</div><div class="plates">';
  ps.zones.forEach(z=>{
    h += '<div class="zone"><h4>'+z+' 區</h4><div class="zn">'+esc(ps.colors[z])+
         '　·　'+ps.rowsPerZone+' 排 × '+ps.platesPerRow+' 盤 ＝ '+(ps.rowsPerZone*ps.platesPerRow)+' 盤</div>';
    for(let r=1;r<=ps.rowsPerZone;r++){
      h += '<div class="prow"><span class="rl">第'+r+'排</span>';
      for(let k=1;k<=ps.platesPerRow;k++)
        h += '<span class="p '+z.toLowerCase()+'">'+z+r+'-'+k+'</span>';
      h += '</div>';
    }
    h += '</div>';
  });
  h += '</div>';
  $('#t-plate').innerHTML = h;
}

/* ── ④ 分區編碼 ─────────────────────────── */
function renderZone(){
  const z = D.zoneRules;
  $('#t-zone').innerHTML =
    '<h2 class="sec">場地分區編碼</h2>' +
    '<p class="lead">'+esc(z.intro)+'</p>' +
    '<div class="tw"><table class="tbl"><thead><tr><th>層級</th><th>說明</th><th>寫法</th><th>出處</th></tr></thead><tbody>' +
    z.rows.map(e=>'<tr><td><b>'+esc(e[0])+'</b></td><td>'+esc(e[1])+'</td><td>'+esc(e[2])+'</td><td>'+esc(e[3])+'</td></tr>').join('') +
    '</tbody></table></div>' +
    '<div class="banner"><b>鐵則　</b>'+esc(z.iron)+'</div>';
}

/* ── ⑤ 庫房 ─────────────────────────────── */
function renderWare(){
  const w = D.warehouse;
  $('#t-ware').innerHTML =
    '<h2 class="sec">物料庫房</h2><p class="lead">'+esc(w.src)+'</p>' +
    '<div class="grid">' +
      ['平面配置圖','櫃位編號','箱子貼標','照片'].map((k,i)=>
      '<div class="card"><div class="how"><span class="k">'+esc(k)+'</span>' +
      esc([w.layout,w.cabinetRule,w.boxRule,w.photoRule][i])+'</div></div>').join('') +
    '</div>' +
    '<h2 class="sec" style="margin-top:22px">櫃位清冊</h2>' +
    '<div class="tw"><table class="tbl"><thead><tr><th>櫃位</th><th>存放內容</th><th>注意</th></tr></thead><tbody>' +
    w.cells.map(c=>'<tr><td><b>'+esc(c.code)+'</b></td><td>'+esc(c.content)+'</td><td>'+esc(c.note||'—')+'</td></tr>').join('') +
    '</tbody></table></div>' +
    '<h2 class="sec">箱子標籤固定欄位</h2>' +
    '<p class="lead">箱子標籤比照盤子標籤：貼的是可回查的編碼，不是自由書寫。</p>' +
    '<div class="card"><div class="kv">' + w.boxFields.map(x=>
      '<div class="f"><span class="k">欄位</span><span class="v em">'+esc(x)+'</span></div>').join('') + '</div></div>';
}

/* ── ⑥ 檔案 ─────────────────────────────── */
function renderFile(){
  const f = D.files;
  $('#t-file').innerHTML =
    '<h2 class="sec">檔案與照片規範</h2><p class="lead">'+esc(f.src)+'</p>' +
    '<div class="banner"><b>資料夾樹　</b>'+esc(f.tree)+'<br><b>鐵則　</b>'+esc(f.rule)+'</div>' +
    '<div class="card"><div class="kv">' +
      '<div class="f"><span class="k">命名規則</span><span class="v em">'+esc(f.naming)+'</span></div>' +
      '<div class="f"><span class="k">拍照階段</span><span class="v em">'+esc(f.stages.join(' → '))+'　每項至少三張</span></div>' +
    '</div></div>' +
    '<div class="tw"><table class="tbl"><thead><tr><th style="width:200px">資料夾</th><th>內容</th></tr></thead><tbody>' +
    f.folders.map(x=>'<tr><td><b>'+esc(x.path)+'</b></td><td>'+esc(x.content)+'</td></tr>').join('') +
    '</tbody></table></div>';
}

/* ── ⑦ 牌位與人力 ───────────────────────── */
function renderPai(){
  const m = D.manpower, p = D.paiwei;
  $('#t-pai').innerHTML =
    '<h2 class="sec">牌位作業</h2><p class="lead">'+esc(p.src)+'　·　'+esc(p.note)+'</p>' +
    '<div class="grid">' + p.flow.map((s,i)=>
      '<div class="card"><div class="how"><span class="k">第 '+(i+1)+' 段</span>'+esc(s)+'</div></div>').join('') + '</div>' +
    '<h2 class="sec" style="margin-top:24px">人力配置</h2><p class="lead">'+esc(m.src)+'</p>' +
    '<div class="card"><div class="how"><span class="k">換算規則</span>'+esc(m.rule)+'</div>' +
    '<div class="kv">' +
      '<div class="f"><span class="k">產出</span><span class="v">'+esc(m.output)+'</span></div>' +
      '<div class="f"><span class="k">造冊</span><span class="v">'+esc(m.excel)+'</span></div>' +
      '<div class="f"><span class="k">教學依據</span><span class="v">'+esc(m.teaching)+'</span></div>' +
      '<div class="f"><span class="k">主責</span><span class="v em">'+esc(m.owner)+'</span></div>' +
    '</div><div class="src">'+esc(m.ownerBasis)+'</div></div>';
}

/* ── ⑧ 檢核表 ───────────────────────────── */
function renderChk(){
  const stages = [...new Set(D.checklist.map(c=>c.stage))];
  let h = '<h2 class="sec">檢核表</h2><p class="lead">每一場都要跑一次。沒打勾不算完成。打勾狀態存在這台裝置上。</p>' +
          '<div class="bar"><button class="btn" id="clr">全部清空</button>' +
          '<button class="btn p" onclick="window.print()">列印檢核表</button>' +
          '<span class="cnt" id="ccnt"></span></div><div class="card chk" style="padding:0">';
  stages.forEach(s=>{
    h += '<div class="sg">'+esc(s)+'</div>';
    D.checklist.filter(c=>c.stage===s).forEach((c,i)=>{
      const id = 'chk_'+PROJ+'_'+esc(s)+'_'+i;
      const novel = (c.src||'').indexOf('本表新增') >= 0;
      h += '<label><input type="checkbox" data-id="'+id+'"><span>'+esc(c.text) +
           (c.src ? '<br><span class="csrc'+(novel?' novel':'')+'">'+esc(c.src)+'</span>' : '') +
           '</span></label>';
    });
  });
  h += '</div>';
  $('#t-chk').innerHTML = h;

  const boxes = [...document.querySelectorAll('#t-chk input')];
  const upd = ()=> $('#ccnt').textContent = boxes.filter(b=>b.checked).length + ' / ' + boxes.length + ' 已完成';
  boxes.forEach(b=>{
    try{ b.checked = localStorage.getItem(b.dataset.id)==='1'; }catch(e){}
    b.onchange = ()=>{ try{ localStorage.setItem(b.dataset.id, b.checked?'1':'0'); }catch(e){} upd(); };
  });
  $('#clr').onclick = ()=>{ boxes.forEach(b=>{ b.checked=false; try{localStorage.setItem(b.dataset.id,'0');}catch(e){} }); upd(); };
  upd();
}

/* ── ⑨ 比對 ─────────────────────────────── */
function renderCross(){
  const ok = D.crosscheck.filter(c=>c.status==='已定案').length;
  $('#t-cross').innerHTML =
    '<h2 class="sec">白紙 ↔ 紅紙　字跡比對表</h2>' +
    '<p class="lead">白紙認不出來的字，一律先拿紅紙同一件事的寫法去定案。' +
    '共比對 '+D.crosscheck.length+' 處，其中 '+ok+' 處已定案並寫入正表，其餘紅紙也沒有對應，不臆測。</p>' +
    '<div class="tw"><table class="tbl"><thead><tr><th style="width:20%">白紙原文</th><th style="width:22%">紅紙對應</th>' +
    '<th style="width:15%">判定</th><th>用在哪裡</th><th style="width:9%">狀態</th></tr></thead><tbody>' +
    D.crosscheck.map(c=>{
      const good = c.status==='已定案';
      return '<tr'+(good?'':' class="warn"')+'><td>'+esc(c.white)+'</td><td>'+esc(c.red)+'</td>' +
        '<td><b>'+esc(c.verdict)+'</b></td><td>'+esc(c.use)+'</td>' +
        '<td><span class="'+(good?'st-ok':'st-no')+'">'+esc(c.status)+'</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}

/* ── ⑩ 待確認 ───────────────────────────── */
function renderTodo(){
  $('#t-todo').innerHTML =
    '<h2 class="sec">待確認事項</h2>' +
    '<p class="lead">這些是紅紙也補不了、白紙也回推不了的。請口述後回填，不臆測寫進正表。</p>' +
    '<div class="tw"><table class="tbl"><thead><tr><th style="width:80px">出處</th><th>問題</th><th style="width:32%">目前處理方式</th></tr></thead><tbody>' +
    D.todo.map(t=>'<tr class="warn"><td><b>'+esc(t.src)+'</b></td><td>'+esc(t.text)+'</td><td>'+esc(t.guess)+'</td></tr>').join('') +
    '</tbody></table></div>';
}

/* 步驟卡展開／收合：只綁一次，避免每次 render 疊加監聽器 */
$('#t-do').addEventListener('click', e=>{
  const hd = e.target.closest('.step-h');
  if(hd) hd.parentElement.classList.toggle('open');
});

function render(){
  renderDo(); renderTime(); renderPlate(); renderZone(); renderWare();
  renderFile(); renderPai(); renderChk(); renderCross(); renderTodo();
  $('#foot').innerHTML = esc(D.meta.version) + '　·　' + esc(D.meta.source) +
    '<br><b>' + esc(D.meta.privacy) + '</b>';
}
render();
