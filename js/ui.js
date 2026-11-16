(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],cv=$('#stage');
const el=(t,p={},...k)=>{const e=Object.assign(document.createElement(t),p);e.append(...k.flat());return e};
const UI=VN.UI={},SIDES=['left','center','right'],SX={left:.125,center:.5,right:.875};
const nm=c=>VN.Render.spr(c.sid)?.name||'Character',cap=s=>s[0].toUpperCase()+s.slice(1);
UI.toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(UI._t);UI._t=setTimeout(()=>t.classList.remove('on'),4200)};
const act=fn=>{fn();VN.commit();UI.sync()};
const loadImg=file=>new Promise((res,rej)=>{if(!/^image\/(png|jpe?g)$/.test(file.type))return rej(new Error(`"${file.name}" isn't a PNG or JPG image.`));
 const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error(`Couldn't read "${file.name}". Try re-exporting it.`));i.src=URL.createObjectURL(file)});
const setTab=t=>{$$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.pane').forEach(p=>p.hidden=p.dataset.t!==t)};
$$('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.t));
const narrow=matchMedia('(max-width:900px)');
const panel=(cls,btn)=>{const b=document.body.classList;b.toggle(cls);if(narrow.matches&&!b.contains(cls)){const o=cls==='no-l'?['no-r','#tr']:['no-l','#tl'];b.add(o[0]);$(o[1]).classList.add('off')}$(btn).classList.toggle('off',b.contains(cls))};
if(narrow.matches){document.body.classList.add('no-l','no-r');$('#tl').classList.add('off');$('#tr').classList.add('off')}
$('#tl').onclick=()=>panel('no-l','#tl');$('#tr').onclick=()=>panel('no-r','#tr');

// ---- assets
UI.confirm=(msg,yes='Delete')=>new Promise(res=>{const d=$('#dlg');$('#dlgMsg').textContent=msg;$('#dlgYes').textContent=yes;const done=v=>{d.close();res(v)};
 $('#dlgYes').onclick=()=>done(true);$('#dlgNo').onclick=()=>done(false);d.oncancel=e=>{e.preventDefault();done(false)};d.showModal();$('#dlgNo').focus()});
const dropAsset=async(kind,id,word)=>{if(!await UI.confirm(`Delete this ${word} from your library? It will also be removed from every project that uses it.`))return;await VN.Store.removeAsset(kind,id);VN.commit();UI.bgList();UI.spList();UI.itList();UI.sync()};
UI.bgList=()=>{const g=$('#bgList');g.replaceChildren(...(VN.bgs.length?VN.bgs.map(b=>el('div',{className:'tile'+(VN.cs().bg===b.id?' on':''),onclick:()=>act(()=>VN.cs().bg=b.id)},el('img',{src:b.img.src}),VN.ib('x','',{className:'x',title:'Delete from library',onclick:e=>{e.stopPropagation();dropAsset('bg',b.id,'backdrop')}}))):[el('p',{className:'note',textContent:'No backdrops yet. Uploads are kept for all your projects and cropped to fill the 16:9 frame.'})]))};
UI.itList=()=>{$('#itList').replaceChildren(...(VN.items.length?VN.items.map(s=>{const th=el('canvas',{width:s.cv.width,height:s.cv.height});th.getContext('2d').drawImage(s.cv,0,0);
 const inp=el('input',{className:'nm',value:s.name,onclick:e=>e.stopPropagation(),onchange:()=>{s.name=inp.value||s.name;VN.Store.putAsset('item',s);UI.sync()}});
 return el('div',{className:'tile'+(VN.cs().itemId===s.id?' on':''),title:'Use as the received item',onclick:()=>UI.useItem(s.id)},th,inp,VN.ib('x','',{className:'x',title:'Delete from library',onclick:e=>{e.stopPropagation();dropAsset('item',s.id,'item')}}))}):[el('p',{className:'note',textContent:'No items yet. Add a picture of something a character receives, then click it to show it in this scene.'})]))};
UI.useItem=id=>act(()=>{const s=VN.cs(),it=VN.items.find(i=>i.id===id);if(!it)return;const prev=VN.items.find(i=>i.id===s.itemId);
 s.type='item';if(s.itemId!==id){s.itemId=id;s.itemScale=Math.min(VN.H*.42/it.cv.height,VN.W*.4/it.cv.width,8);s.itemRot=0}
 if(!s.itemName||(prev&&s.itemName===prev.name))s.itemName=it.name});
UI.spList=()=>{$('#spList').replaceChildren(...VN.sprites.map(s=>{
 const th=el('canvas',{width:s.cv.width,height:s.cv.height,draggable:true,ondragstart:e=>{e.dataTransfer.setData('text/sprite',s.id);$('#host').classList.add('dragging')},ondragend:()=>$('#host').classList.remove('dragging')});
 th.getContext('2d').drawImage(s.cv,0,0);
 const inp=el('input',{className:'nm',value:s.name,onchange:()=>{s.name=inp.value||s.name;VN.Store.putAsset('sprite',s);UI.sync()}});
 return el('div',{className:'tile'},th,el('div',{className:'put'},...SIDES.map(sd=>VN.ib(sd,'',{title:'Place on the '+sd,onclick:()=>UI.place(s.id,sd)}))),inp,
  VN.ib('x','',{className:'x',title:'Delete from library',onclick:()=>dropAsset('sprite',s.id,'character')}))}))};
UI.place=(sid,side)=>act(()=>{const s=VN.Render.spr(sid),sc=VN.cs(),old=sc.chars.find(c=>c.side===side);if(old&&sc.speakerId===old.uid)sc.speakerId=null;
 sc.chars=sc.chars.filter(c=>c.side!==side);const c={uid:VN.id(),sid,side,scale:Math.min(VN.H*.8/s.cv.height,8),flip:false,view:'full',crop:.55};sc.chars.push(c);VN.sel=c.uid});
async function addBg(f){try{const img=await loadImg(f),b={id:VN.aid(),img,blob:f};VN.bgs.push(b);await VN.Store.putAsset('bg',b);act(()=>VN.cs().bg=b.id)}catch(e){UI.toast(e.message)}}
async function addSheets(files,kind='sprite'){const isItem=kind==='item',list=()=>isItem?VN.items:VN.sprites,word=isItem?'item':'character';for(const f of files){try{const img=await loadImg(f),found=VN.Sprites.detect(img);
 if(!found.length){UI.toast(`Found no ${word}s in "${f.name}". Use a transparent or plain white background.`);continue}
 for(const c of found){const s={id:VN.aid(),name:`${isItem?'Item':'Sprite'} ${list().length+1}`,cv:c};list().push(s);await VN.Store.putAsset(kind,s)}UI.toast(`Cut out ${found.length} ${word}${found.length>1?'s':''} from "${f.name}".`)}
 catch(e){UI.toast(e.message)}}isItem?UI.itList():UI.spList()}
$('#bgUp').onclick=()=>$('#bgFile').click();$('#spUp').onclick=()=>$('#spFile').click();$('#itUp').onclick=()=>$('#itFile').click();
$('#bgFile').onchange=e=>{[...e.target.files].forEach(addBg);e.target.value=''};
$('#spFile').onchange=e=>{addSheets([...e.target.files]);e.target.value='';setTab('cast')};
$('#itFile').onchange=e=>{addSheets([...e.target.files],'item');e.target.value='';setTab('items')};
$('#bgRm').onclick=()=>act(()=>VN.cs().bg=null);

// ---- script panel
const grow=()=>{const t=$('#text');t.style.height='auto';t.style.height=Math.min(240,t.scrollHeight+2)+'px'};
[['#speaker','name'],['#text','text']].forEach(([q,k])=>{$(q).oninput=e=>{VN.cs()[k]=e.target.value;if(k==='text')grow();VN.Render.paint()};$(q).onchange=()=>{VN.commit();UI.light()}});
$('#flipBox').onchange=e=>act(()=>VN.cs().flipBox=e.target.checked);$('#dim').onchange=e=>act(()=>VN.cs().dim=e.target.checked);
const pick=c=>act(()=>{const s=VN.cs();if(s.type==='char'&&s.speakerId===c.uid){s.speakerId=null;return}
 s.type='char';s.speakerId=c.uid;s.flipBox=c.side==='right';if(!s.name||VN.sprites.some(p=>p.name===s.name))s.name=nm(c)});
const face=c=>{const t=el('canvas',{width:60,height:60}),sp=VN.Render.spr(c.sid);if(sp){const w=sp.cv.width,h=Math.min(sp.cv.height,w);t.getContext('2d').drawImage(sp.cv,0,0,w,h,0,0,60,60)}return t};

// ---- character toolbar (floats over the scene)
const sizeUI=c=>{const v=Math.round(c.scale*100),n=$('#scaleNum');$('#scale').value=Math.min(1000,v);if(document.activeElement!==n)n.value=v};
UI.ctx=()=>{const c=VN.selChar(),t=$('#ctx');if(!c||VN.preview){t.hidden=true;return}t.hidden=false;
 $('#ctxName').textContent=nm(c);$$('#sides button').forEach(b=>b.classList.toggle('on',b.dataset.side===c.side));$$('#views button').forEach(b=>b.classList.toggle('on',b.dataset.view===(c.view||'full')));
 $('#cropRow').hidden=c.view!=='torso';const cv=Math.round((c.crop||.55)*100);$('#crop').value=cv;if(document.activeElement!==$('#cropNum'))$('#cropNum').value=cv;sizeUI(c)};
$('#scale').oninput=e=>{const c=VN.selChar();if(!c)return;c.scale=e.target.value/100;$('#scaleNum').value=e.target.value;VN.Render.paint()};
// size is also typable: applies live while the number is valid, clamps to 5-1000 when you finish
$('#scaleNum').oninput=e=>{const c=VN.selChar(),v=parseFloat(e.target.value);if(!c||!(v>=5&&v<=1000))return;c.scale=v/100;$('#scale').value=Math.min(1000,v);VN.Render.paint()};
$('#scaleNum').onchange=e=>{const c=VN.selChar();if(!c)return;const v=Math.min(1000,Math.max(5,Math.round(parseFloat(e.target.value))||Math.round(c.scale*100)));e.target.value=v;c.scale=v/100;VN.commit();UI.sync()};
$('#scaleNum').onkeydown=e=>{if(e.key==='Enter')e.target.blur()};
$('#ctx').onwheel=e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&e.currentTarget.scrollWidth>e.currentTarget.clientWidth){e.currentTarget.scrollLeft+=e.deltaY;e.preventDefault()}};
$$('#views button').forEach(b=>b.onclick=()=>act(()=>{const c=VN.selChar(),v=b.dataset.view;if(!c||(c.view||'full')===v)return;c.view=v;c.scale=Math.min(10,Math.max(.05,c.scale*(v==='torso'?1.5:1/1.5)))}));
$$('#views button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='torso')requestAnimationFrame(()=>{const t=$('#ctx'),a=$('#cropRow').getBoundingClientRect(),b=t.getBoundingClientRect();if(a.right>b.right)t.scrollLeft+=a.right-b.right+8})}));
$('#crop').oninput=e=>{const c=VN.selChar();if(!c)return;c.crop=e.target.value/100;$('#cropNum').value=e.target.value;VN.Render.paint()};
$('#crop').onchange=()=>{VN.commit();UI.light()};
// the cut height is typable too: live while valid (30-90), clamped when you finish
$('#cropNum').oninput=e=>{const c=VN.selChar(),v=parseFloat(e.target.value);if(!c||!(v>=30&&v<=90))return;c.crop=v/100;$('#crop').value=v;VN.Render.paint()};
$('#cropNum').onchange=e=>{const c=VN.selChar();if(!c)return;const v=Math.min(90,Math.max(30,Math.round(parseFloat(e.target.value))||Math.round((c.crop||.55)*100)));e.target.value=v;c.crop=v/100;VN.commit();UI.sync()};
$('#cropNum').onkeydown=e=>{if(e.key==='Enter')e.target.blur()};
// custom +/- steppers for the number boxes
$$('.st').forEach(b=>b.onclick=()=>{const i=$('#'+b.dataset.for);i.value=Math.min(+i.max,Math.max(+i.min,(Math.round(+i.value)||0)+ +b.dataset.step));i.dispatchEvent(new Event('input'));i.dispatchEvent(new Event('change'))});
$('#scale').onchange=()=>{VN.commit();UI.light()};
$('#flip').onclick=()=>act(()=>{const c=VN.selChar();if(c)c.flip=!c.flip});
$$('#sides button').forEach(b=>b.onclick=()=>act(()=>{const sc=VN.cs(),c=VN.selChar(),o=b.dataset.side;if(!c)return;sc.chars=sc.chars.filter(x=>x===c||x.side!==o);c.side=o;if(sc.speakerId===c.uid)sc.flipBox=o==='right'}));
$('#del').onclick=()=>act(()=>{const sc=VN.cs();if(sc.speakerId===VN.sel)sc.speakerId=null;sc.chars=sc.chars.filter(c=>c.uid!==VN.sel);VN.sel=null});
$('#front').onclick=()=>act(()=>{const a=VN.cs().chars,i=a.findIndex(c=>c.uid===VN.sel);if(i>=0)a.push(a.splice(i,1)[0])});

// ---- scene canvas: select, drag-resize handle, wheel, drop zones
const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*VN.W/r.width,(e.clientY-r.top)*VN.H/r.height]};
let rs=null,wt;
cv.onpointerdown=e=>{if(VN.preview)return;const[x,y]=pt(e),sel=VN.selChar();
 if(sel){const hd=VN.Render.handle(sel);if(hd&&Math.abs(x-hd.x)<hd.s&&Math.abs(y-hd.y)<hd.s){const ax=VN.W*SX[sel.side];rs={c:sel,ax,d0:Math.hypot(x-ax,y-VN.H),s0:sel.scale};cv.setPointerCapture(e.pointerId);return}}
 const hit=[...VN.cs().chars].reverse().find(c=>VN.Render.hit(c,x,y));VN.sel=hit?hit.uid:null;UI.sync()};
cv.onpointermove=e=>{if(!rs)return;const[x,y]=pt(e);rs.c.scale=Math.min(10,Math.max(.05,rs.s0*Math.hypot(x-rs.ax,y-VN.H)/rs.d0));VN.Render.paint();sizeUI(rs.c)};
cv.onpointerup=()=>{if(rs){rs=null;VN.commit();UI.sync()}};
cv.onwheel=e=>{const c=VN.selChar(),s0=VN.cs();if(!c){if(s0.type==='item'&&s0.itemId){e.preventDefault();s0.itemScale=clampN((s0.itemScale||1)*(e.deltaY<0?1.04:.96),.05,10);VN.Render.paint();$('#itemScale').value=Math.min(1000,Math.round(s0.itemScale*100));UI.fills();clearTimeout(wt);wt=setTimeout(()=>{VN.commit();UI.sync()},400)}return}e.preventDefault();c.scale=Math.min(10,Math.max(.05,c.scale*(e.deltaY<0?1.04:.96)));VN.Render.paint();sizeUI(c);clearTimeout(wt);wt=setTimeout(()=>{VN.commit();UI.sync()},400)};
const slotAt=e=>SIDES[Math.min(2,pt(e)[0]*3/VN.W|0)];
const guides=$('#guides');SIDES.forEach(sd=>guides.append(el('div',{className:'slot',textContent:cap(sd)})));
cv.ondragover=e=>{e.preventDefault();const i=SIDES.indexOf(slotAt(e));$$('.slot').forEach((g,j)=>g.classList.toggle('hot',i===j))};
cv.ondrop=e=>{e.preventDefault();$('#host').classList.remove('dragging');const id=e.dataTransfer.getData('text/sprite');if(id)UI.place(id,slotAt(e))};
cv.onclick=()=>{if(VN.preview)go(1)};

// ---- item scene controls: the item always stays at the centre; it can be enlarged and tilted
const clampN=(v,a,b)=>Math.min(b,Math.max(a,v)),setItem=(k,v)=>{VN.cs()[k]=v;VN.Render.paint()};
$('#itemName').oninput=e=>{VN.cs().itemName=e.target.value;VN.Render.paint()};$('#itemName').onchange=()=>{VN.commit();UI.light()};
$('#itemScale').oninput=e=>{setItem('itemScale',e.target.value/100);$('#itemScaleNum').value=e.target.value};$('#itemScale').onchange=()=>{VN.commit();UI.light()};
$('#itemScaleNum').oninput=e=>{const v=parseFloat(e.target.value);if(v>=5&&v<=1000){setItem('itemScale',v/100);$('#itemScale').value=Math.min(1000,v);UI.fills()}};
$('#itemScaleNum').onchange=e=>{const v=clampN(Math.round(parseFloat(e.target.value))||Math.round((VN.cs().itemScale||1)*100),5,1000);e.target.value=v;setItem('itemScale',v/100);VN.commit();UI.sync()};
$('#itemRot').oninput=e=>{setItem('itemRot',+e.target.value);$('#itemRotNum').value=e.target.value};$('#itemRot').onchange=()=>{VN.commit();UI.light()};
$('#itemRotNum').oninput=e=>{const v=parseFloat(e.target.value);if(v>=-180&&v<=180){setItem('itemRot',v);$('#itemRot').value=clampN(v,-45,45);UI.fills()}};
$('#itemRotNum').onchange=e=>{const v=clampN(Math.round(parseFloat(e.target.value))||0,-180,180);e.target.value=v;setItem('itemRot',v);VN.commit();UI.sync()};
['#itemScaleNum','#itemRotNum'].forEach(q=>$(q).onkeydown=e=>{if(e.key==='Enter')e.target.blur()});
$('#itemClear').onclick=()=>act(()=>{VN.cs().itemId=null});

// ---- scenes + filmstrip
const goTo=i=>{if(i<0||i>=VN.scenes.length||i===VN.cur)return;VN.cur=i;VN.sel=null;VN.commit();UI.sync()},go=d=>goTo(VN.cur+d);
$('#prev').onclick=()=>go(-1);$('#next').onclick=()=>go(1);
const addAfter=(i,data)=>act(()=>{VN.scenes.splice(i+1,0,data);VN.cur=i+1;VN.sel=null});
const rmAt=i=>act(()=>{if(VN.scenes.length>1){VN.scenes.splice(i,1);if(i<VN.cur||VN.cur>=VN.scenes.length)VN.cur--}else VN.scenes[0]=VN.blank();VN.sel=null});
const thumb=(sc,w)=>{const t=el('canvas',{width:w,height:w*9/16|0}),x=t.getContext('2d');x.save();x.scale(w/VN.W,w/VN.W);VN.Render.draw(x,sc,null);x.restore();return t};
const strip=()=>{$('#strip').replaceChildren(...VN.scenes.map((sc,i)=>{
 const d=el('div',{className:'th'+(i===VN.cur?' on':''),draggable:true,title:'Drag to reorder',onclick:()=>goTo(i),
  ondragstart:e=>e.dataTransfer.setData('text/scene',String(i)),
  ondragover:e=>{if(e.dataTransfer.types.includes('text/scene')){e.preventDefault();d.classList.add('over')}},ondragleave:()=>d.classList.remove('over'),
  ondrop:e=>{e.preventDefault();const f=+e.dataTransfer.getData('text/scene');if(f!==i)act(()=>{const[x]=VN.scenes.splice(f,1);VN.scenes.splice(i,0,x);VN.cur=i;VN.sel=null})}},
  thumb(sc,292),el('b',{textContent:i+1}),
  el('div',{className:'tools'},VN.ib('copy','',{title:'Duplicate scene',onclick:e=>{e.stopPropagation();addAfter(i,JSON.parse(JSON.stringify(sc)))}}),VN.ib('trash','',{title:'Delete scene',onclick:e=>{e.stopPropagation();rmAt(i)}})));return d}),
 VN.ib('plus','New scene',{className:'addsc',onclick:()=>addAfter(VN.cur,VN.blank())}));
 const st=$('#strip'),on=st.querySelector('.th.on');if(on){const a=on.getBoundingClientRect(),b=st.getBoundingClientRect();if(a.left<b.left)st.scrollLeft-=b.left-a.left+8;else if(a.right>b.right)st.scrollLeft+=a.right-b.right+8}};
$('#undo').onclick=()=>{if(VN.jump(-1))UI.sync()};$('#redo').onclick=()=>{if(VN.jump(1))UI.sync()};

// ---- project files
$('#saveProj').onclick=async()=>{try{UI.toast('Preparing your project file…');const r=await VN.Project.save();UI.toast(`Project saved: ${r.sprites} character${r.sprites==1?'':'s'}, ${r.bgs} backdrop${r.bgs==1?'':'s'}, ${r.mb.toFixed(1)} MB.`)}catch(e){UI.toast("Couldn't create the project file.")}};

// ---- export / preview / keys
$('#exp').onclick=()=>VN.Export.save(VN.cur);$('#expAll').onclick=()=>VN.Export.all();
const setPv=on=>{VN.preview=on;document.body.classList.toggle('preview',on);VN.sel=null;UI.sync()};
$('#preview').onclick=()=>{setPv(true);document.documentElement.requestFullscreen?.().catch(()=>{})};
document.onfullscreenchange=()=>{if(!document.fullscreenElement&&VN.preview)setPv(false)};
document.onkeydown=e=>{if(!VN.inEditor)return;const typing=/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&document.activeElement.type!=='range'&&document.activeElement.type!=='checkbox';
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(!VN.preview)$('#saveProj').click();return}
 if(VN.preview){if(e.key==='Escape'){setPv(false);document.fullscreenElement&&document.exitFullscreen()}else if(['ArrowRight',' ','Enter'].includes(e.key))go(1);else if(e.key==='ArrowLeft')go(-1);return}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();(e.shiftKey?$('#redo'):$('#undo')).click();return}
 if(typing)return;
 if((e.key==='Delete'||e.key==='Backspace')&&VN.sel)$('#del').click();
 else if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);
 else if(e.key==='[')$('#tl').click();else if(e.key===']')$('#tr').click()};

// light refresh after typing: redraw thumbnails without rebuilding the strip, so a click on a tile still lands
UI.light=()=>{$$('#strip .th canvas').forEach((c,i)=>{const sc=VN.scenes[i];if(!sc)return;const x=c.getContext('2d');x.save();x.scale(c.width/VN.W,c.width/VN.W);VN.Render.draw(x,sc,null);x.restore()});$('#undo').setAttribute('aria-disabled',VN.hi<=0);$('#redo').setAttribute('aria-disabled',VN.hi>=VN.hist.length-1)};
// slider fill follows the value (WebKit has no native filled track)
const fill=r=>r.style.setProperty('--fill',((r.value-r.min)/(r.max-r.min)*100)+'%');
$$('input[type=range]').forEach(r=>{r.addEventListener('input',()=>fill(r));fill(r)});
UI.fills=()=>$$('input[type=range]').forEach(fill);
// ---- keep every panel in step with the data
UI.sync=()=>{
 const s=VN.cs(),f=(i,v)=>{if(document.activeElement!==i)i.value=v};
 f($('#speaker'),s.name);f($('#text'),s.text);grow();$('#flipBox').checked=!!s.flipBox;$('#dim').checked=s.dim!==false;
 $('#nameRow').hidden=$('#opts').hidden=s.type!=='char';
 const isItem=s.type==='item',it=VN.items.find(i=>i.id===s.itemId);$('#itemPanel').hidden=!isItem;$('#textSec').hidden=isItem;
 if(isItem){f($('#itemName'),s.itemName||'');const pc=Math.round((s.itemScale||1)*100),ro=Math.round(s.itemRot||0),sn=$('#itemScaleNum'),rn=$('#itemRotNum');
  $('#itemScale').value=Math.min(1000,pc);if(document.activeElement!==sn)sn.value=pc;$('#itemRot').value=clampN(ro,-45,45);if(document.activeElement!==rn)rn.value=ro;
  $('#itemHint').textContent=it?`"${it.name}" shows at the center and the scene dims. Characters stay, dimmed with the background.`:'No item chosen yet. Open the Items tab on the left and click one.';
  $$('#itemPanel .ctl input,#itemPanel .ctl button,#itemClear').forEach(x=>x.disabled=!it)}
 const present=SIDES.map(sd=>s.chars.find(c=>c.side===sd)).filter(Boolean);
 $('#chips').replaceChildren(VN.ib('book','Narrator',{className:'chip nar'+(s.type==='narr'?' on':''),onclick:()=>act(()=>s.type='narr')}),VN.ib('gift','Item',{className:'chip nar'+(s.type==='item'?' on':''),title:'Show a received item',onclick:()=>act(()=>s.type='item')}),
  ...present.map(c=>el('button',{className:'chip'+(s.type==='char'&&s.speakerId===c.uid?' on':''),onclick:()=>pick(c),title:`${cap(c.side)}: ${nm(c)}`},face(c),el('span',{textContent:nm(c)}))));
 $('#tip').textContent=s.type==='item'?'An item scene: the whole scene dims, the item glows at the center, and a small box says what was received.':present.length?(s.type==='narr'?'Narration uses the plain box with no name plate.':'Pick who is speaking. The box moves to their side and the others dim.'):'Add characters from the Cast tab to choose who speaks.';
 UI.ctx();
 $('#undo').setAttribute('aria-disabled',VN.hi<=0);$('#redo').setAttribute('aria-disabled',VN.hi>=VN.hist.length-1);$('#prev').setAttribute('aria-disabled',VN.cur===0);$('#next').setAttribute('aria-disabled',VN.cur===VN.scenes.length-1);
 $('#count').textContent=`Scene ${VN.cur+1} of ${VN.scenes.length}`;
 UI.fills();UI.bgList();UI.itList();strip();VN.Render.paint();VN.Store.persist();
};
UI.bgList();UI.spList();UI.itList();UI.sync();
document.fonts.load('36px "One Little Font"').then(UI.sync).catch(()=>{});
})();
