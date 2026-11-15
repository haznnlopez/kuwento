// App shell: loading screen, projects page, and routing (#/ = projects, #/p/<id> = editor).
(()=>{
const $=s=>document.querySelector(s);
const el=(t,p={},...k)=>{const e=Object.assign(document.createElement(t),p);e.append(...k.flat());return e};
const toast=m=>VN.UI.toast(m);
const show=v=>{VN.inEditor=v==='editor';$('#home').hidden=v!=='home';$('#editor').hidden=v!=='editor';document.title=v==='editor'?`${VN.pname} - Kuwento`:'Kuwento'};

// ---- light / dark: follows the system until you choose, then remembers your choice
const root=document.documentElement,tc=document.querySelector('meta[name=theme-color]');
const setTheme=(t,save)=>{root.dataset.theme=t;document.querySelectorAll('.themeBtn').forEach(b=>{const l=t==='dark'?'Light':'Dark';b.innerHTML=VN.ic(t==='dark'?'sun':'moon')+`<span class="lbl">${l}</span>`;b.setAttribute('aria-label',`Switch to ${l.toLowerCase()} mode`);b.setAttribute('aria-pressed',t==='dark')});tc&&(tc.content=t==='dark'?'#0f1315':'#1d2427');if(save)try{localStorage.setItem('kuwento-theme',t)}catch(e){}};
setTheme(root.dataset.theme||'light');
document.querySelectorAll('.themeBtn').forEach(b=>b.onclick=()=>setTheme(root.dataset.theme==='dark'?'light':'dark',true));
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',e=>{let s=null;try{s=localStorage.getItem('kuwento-theme')}catch(x){}if(!s)setTheme(e.matches?'dark':'light')});

// ---- the font: One Little Font from the fonts/ folder, a local install, or a file added here (kept in this browser)
const Font={
 async has(){await document.fonts.load('16px "One Little Font"').catch(()=>{});return[...document.fonts].some(f=>f.family.replace(/["']/g,'')==='One Little Font'&&f.status==='loaded')},
 async apply(buf){const ff=new FontFace('One Little Font',buf);await ff.load();document.fonts.add(ff);if(Font.face)document.fonts.delete(Font.face);Font.face=ff},
 async restore(){if(!VN.Store.ready)return;try{const f=await VN.Store.kvGet('font');if(f)await Font.apply(await f.blob.arrayBuffer())}catch(e){console.warn('Saved font could not be loaded',e)}},
 async add(file){
  if(!/\.(ttf|otf|woff2?)$/i.test(file.name))return toast("That isn't a font file. Use .ttf, .otf, .woff or .woff2.");
  if(file.size>15*1048576)return toast('That font file is too large (15 MB max).');
  try{await Font.apply(await file.arrayBuffer())}catch(e){return toast("Couldn't read that font file. It may be damaged.")}
  if(VN.Store.ready)try{await VN.Store.kvSet('font',{name:file.name,blob:file})}catch(e){toast("The font works now, but this browser wouldn't save it.")}
  $('#fontNote').hidden=true;VN.UI.sync();VN.UI.light();toast('Font added. It is used everywhere now, including exported images.')}};
document.querySelectorAll('.fontBtn').forEach(b=>b.onclick=()=>$('#fontFile').click());
$('#fontFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)Font.add(f)};

// ---- loading screen
const L={t0:Date.now(),
 show(msg,pct){const l=$('#loader');l.classList.remove('gone');$('#loadMsg').textContent=msg;L.set(pct);L.t0=Date.now()},
 set(p){$('#loadBar').style.width=p+'%'},
 async hide(min){const w=min-(Date.now()-L.t0);if(w>0)await new Promise(r=>setTimeout(r,w));$('#loader').classList.add('gone')}};

// ---- projects page
const ago=t=>{const s=(Date.now()-t)/1000;if(s<60)return'just now';const m=s/60;if(m<60)return`${m|0} minute${m<2?'':'s'} ago`;const h=m/60;if(h<24)return`${h|0} hour${h<2?'':'s'} ago`;const d=h/24;if(d<7)return`${d|0} day${d<2?'':'s'} ago`;return'on '+new Date(t).toLocaleDateString()};
const go=id=>{location.hash='#/p/'+id};
const newProject=async()=>go(await VN.Store.create());
const card=p=>{
 const nm=el('input',{className:'pn',value:p.name,'aria-label':'Project name',onchange:async()=>{const v=nm.value.trim()||p.name;nm.value=v;await VN.Store.rename(p.id,v)}});
 nm.onkeydown=e=>{if(e.key==='Enter')nm.blur()};
 return el('article',{className:'proj'},
  el('button',{className:'open',title:`Open ${p.name}`,onclick:()=>go(p.id)},p.thumb?el('img',{src:p.thumb,alt:''}):el('span',{className:'noth',textContent:'Open to see a preview'})),
  el('div',{className:'pinfo'},nm,el('span',{className:'pm',textContent:`${p.scenes} scene${p.scenes==1?'':'s'}, edited ${ago(p.updated)}`})),
  el('div',{className:'pact'},
   VN.ib('copy','Duplicate',{onclick:async()=>{await VN.Store.duplicate(p.id);renderHome()}}),
   VN.ib('file','Download',{onclick:async()=>{try{await VN.Project.saveRecord(p.id)}catch(e){toast("Couldn't create the project file.")}}}),
   VN.ib('trash','Delete',{className:'danger',onclick:async()=>{if(await VN.UI.confirm(`Delete "${p.name}"? This can't be undone. Download it first if you might want it back.`)){await VN.Store.remove(p.id);renderHome()}}})))};
const newCard=()=>{const n=el('button',{className:'newp',onclick:newProject});n.innerHTML=VN.ic('plus')+'<b>New project</b><span>Start from a blank scene</span>';return n};
const renderHome=async()=>{const list=await VN.Store.list();
 $('#plist').replaceChildren(newCard(),...list.map(card));
 $('#pEmpty').hidden=list.length>0};
const showHome=async()=>{await VN.Store.flush();VN.pid=null;VN.sel=null;show('home');if(VN.Store.ready)await renderHome()};

// ---- editor
const openEditor=async(id,first)=>{
 if(VN.pid===id&&VN.inEditor)return;
 if(!first)L.show('Opening your project',20);
 try{await VN.Store.flush();L.set(45);await VN.Store.load(id)}
 catch(e){toast("That project isn't in this browser anymore.");history.replaceState(null,'','#/');await showHome();if(!first)await L.hide(0);return}
 L.set(80);show('editor');$('#pname').value=VN.pname;VN.UI.bgList();VN.UI.spList();VN.UI.sync();
 if(!first)await L.hide(350)};
const route=async first=>{const m=location.hash.match(/^#\/p\/([\w-]+)$/);m?await openEditor(m[1],first):await showHome()};
window.addEventListener('hashchange',()=>route(false));
['pagehide'].forEach(ev=>addEventListener(ev,()=>VN.Store.flush()));
document.addEventListener('visibilitychange',()=>{if(document.hidden)VN.Store.flush()});

$('#toHome').onclick=()=>{location.hash='#/'};
$('#pname').oninput=e=>{VN.pname=e.target.value;VN.Store.persist()};
$('#pname').onchange=e=>{if(!e.target.value.trim()){VN.pname='Untitled project';e.target.value=VN.pname;VN.Store.persist()}document.title=`${VN.pname} - Kuwento`};
$('#pname').onkeydown=e=>{if(e.key==='Enter')e.target.blur()};
$('#newBtn').onclick=newProject;$('#newBtn2').onclick=newProject;
$('#importBtn').onclick=()=>$('#projFile').click();
$('#projFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const d=VN.Project.parse(await f.text());L.show('Importing project',30);const id=await VN.Store.importData(d,f.name.replace(/\.kuwento\.json$|\.json$/i,''));L.set(70);go(id);setTimeout(()=>L.hide(200),0)}
 catch(err){L.hide(0);toast(/^That file/.test(err.message)?err.message:"Couldn't open that file. It may be damaged.")}};

// name every icon-only button for screen readers
document.querySelectorAll('button:not([aria-label])').forEach(b=>{const t=(b.querySelector('.lbl')||b).textContent.trim()||b.title;if(t)b.setAttribute('aria-label',t)});

// ---- start up: fonts, database, then whichever page the address points to
(async()=>{
 $('#loadImg').src=VN_ASSETS.narr.src;L.set(8);
 await Promise.race([document.fonts.load('36px "One Little Font"').catch(()=>{}),new Promise(r=>setTimeout(r,2500))]);L.set(35);$('#loadMsg').textContent='Loading your library';
 await VN.Store.init();await Font.restore();L.set(65);const haveFont=await Font.has();
 if(/^#\/p\//.test(location.hash))history.replaceState(null,'',location.pathname+location.search+'#/'); // every visit starts at the projects page
 if(VN.Store.ready)await route(true);
 else{VN.pname='Untitled project';show('editor');VN.Store.status('Saving unavailable');toast("This browser can't save projects here, so work won't be kept. Download a project file to keep it.");VN.UI.sync()}
 $('#fontNote').hidden=haveFont;L.set(100);await L.hide(650);
})();
})();
