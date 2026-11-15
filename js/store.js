// Browser storage (IndexedDB). 'library' = every upload, shared by all projects. 'projects' = scenes that point at library items.
// 'index' = light info for the projects page.
(()=>{
const S=VN.Store={ready:false,sig:'',warned:false};
const kindOf={sprite:'sprites',bg:'bgs'};
// ---- open / migrate
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('kuwento',3);
 r.onupgradeneeded=e=>{const db=r.result,t=r.transaction;
  for(const n of['kv','projects','index','library'])if(!db.objectStoreNames.contains(n))db.createObjectStore(n,n==='kv'?undefined:{keyPath:'id'});
  const now=Date.now();
  // older versions kept sprites/backdrops inside each project: move them to the shared library and re-point the scenes
  const convert=p=>{const map={},L=t.objectStore('library');
   (p.sprites||[]).forEach(s=>{const id=VN.aid();map[s.id]=id;L.put({id,kind:'sprite',name:s.name,blob:s.blob,added:now})});
   (p.bgs||[]).forEach(b=>{const id=VN.aid();map[b.id]=id;L.put({id,kind:'bg',name:'Backdrop',blob:b.blob,added:now})});
   p.scenes.forEach(sc=>{if(sc.bg)sc.bg=map[sc.bg]||null;(sc.chars||[]).forEach(c=>{if(map[c.sid])c.sid=map[c.sid]})});
   const q={...p};delete q.sprites;delete q.bgs;return q};
  if(e.oldVersion===1)t.objectStore('kv').get('project').onsuccess=ev=>{const p=ev.target.result;if(!p)return;const id='p'+now.toString(36),q=convert(p);
   t.objectStore('projects').put({...q,id,name:'My first project',created:now,updated:now});t.objectStore('index').put({id,name:'My first project',created:now,updated:now,scenes:p.scenes.length,thumb:null})};
  if(e.oldVersion===2)t.objectStore('projects').openCursor().onsuccess=ev=>{const c=ev.target.result;if(!c)return;c.update(convert(c.value));c.continue()}};
 r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=(names,mode,fn)=>new Promise((res,rej)=>{const t=S.db.transaction(names,mode),q=fn(...[].concat(names).map(n=>t.objectStore(n)));t.oncomplete=()=>res(q&&q.result);t.onerror=t.onabort=()=>rej(t.error)});
const blobOf=cv=>new Promise(r=>cv.toBlob(r,'image/png'));
const newId=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const sigOf=()=>JSON.stringify([VN.pname,VN.scenes,VN.cur]);
const thumb=()=>{const c=document.createElement('canvas');c.width=400;c.height=225;const x=c.getContext('2d');x.scale(400/VN.W,400/VN.W);VN.Render.draw(x,VN.scenes[0],null);return c.toDataURL('image/jpeg',.8)};
S.status=t=>{const e=document.getElementById('saveState');if(e)e.textContent=t};

// ---- shared library of uploads
S.loadLibrary=async()=>{const items=(await tx('library','readonly',s=>s.getAll())).sort((a,b)=>a.added-b.added);
 VN.sprites=await Promise.all(items.filter(i=>i.kind==='sprite').map(async o=>{const bm=await createImageBitmap(o.blob),cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;cv.getContext('2d').drawImage(bm,0,0);return{id:o.id,name:o.name,cv,blob:o.blob,added:o.added}}));
 VN.bgs=await Promise.all(items.filter(i=>i.kind==='bg').map(async o=>{const img=new Image();img.src=URL.createObjectURL(o.blob);await img.decode();return{id:o.id,img,blob:o.blob,added:o.added}}))};
S.putAsset=async(kind,a)=>{if(!S.ready)return;try{a.added=a.added||Date.now();if(!a.blob)a.blob=await blobOf(a.cv);
 await tx('library','readwrite',l=>l.put({id:a.id,kind,name:a.name||'',blob:a.blob,added:a.added}))}
 catch(e){S.status('Not saved');if(!S.warned){S.warned=true;VN.UI&&VN.UI.toast("Couldn't save your upload to this browser. Private windows or a full disk can block it.")}}};
// removing an upload also removes it from every project that used it
S.removeAsset=async(kind,id)=>{const fix=sc=>{let ch=false;if(sc.bg===id){sc.bg=null;ch=true}const n=(sc.chars||[]).length;sc.chars=(sc.chars||[]).filter(c=>c.sid!==id);if(sc.speakerId&&!sc.chars.some(c=>c.uid===sc.speakerId))sc.speakerId=null;return ch||sc.chars.length!==n};
 if(S.ready)await tx(['library','projects'],'readwrite',(l,p)=>{l.delete(id);p.openCursor().onsuccess=ev=>{const c=ev.target.result;if(!c)return;const v=c.value;if(v.scenes.map(fix).some(Boolean))c.update(v);c.continue()}});
 VN[kindOf[kind]]=VN[kindOf[kind]].filter(a=>a.id!==id);VN.scenes.forEach(fix);VN.sel=null};

// ---- projects
S.init=async()=>{try{S.db=await open();navigator.storage?.persist?.();await S.loadLibrary();S.ready=true}catch(e){console.warn('Saving unavailable',e)}};
S.kvGet=k=>tx('kv','readonly',st=>st.get(k));
S.kvSet=(k,v)=>tx('kv','readwrite',st=>st.put(v,k));
S.list=()=>tx('index','readonly',s=>s.getAll()).then(a=>a.sort((x,y)=>y.updated-x.updated));
S.get=id=>tx('projects','readonly',s=>s.get(id));
S.create=async()=>{const id=newId(),now=Date.now(),name=`Untitled ${(await S.list()).length+1}`;
 await tx(['projects','index'],'readwrite',(p,i)=>{p.put({id,name,created:now,updated:now,scenes:[VN.blank()],cur:0,uid:0});return i.put({id,name,created:now,updated:now,scenes:1,thumb:null})});return id};
S.load=async id=>{const p=await S.get(id);if(!p)throw new Error('missing');
 VN.pid=null;VN.scenes=p.scenes;VN.cur=Math.min(p.cur||0,p.scenes.length-1);VN.sel=null;VN._u=p.uid||0;VN.pname=p.name;VN.created=p.created;
 VN.hist=[];VN.hi=-1;VN.commit();VN.pid=id;S.sig=sigOf();S.status('Saved in this browser')};
S.save=async()=>{
 if(!VN.pid||!S.ready)return;const sig=sigOf();if(sig===S.sig)return;
 const id=VN.pid,name=VN.pname,created=VN.created||Date.now(),scenes=JSON.parse(JSON.stringify(VN.scenes)),cur=VN.cur,uid=VN._u,th=thumb(),now=Date.now();
 try{await tx(['projects','index'],'readwrite',(p,i)=>{p.put({id,name,created,updated:now,scenes,cur,uid});return i.put({id,name,created,updated:now,scenes:scenes.length,thumb:th})});
  if(VN.pid===id)S.sig=sig;S.status('Saved in this browser');
 }catch(e){S.status('Not saved');if(!S.warned){S.warned=true;VN.UI&&VN.UI.toast("Couldn't save to this browser. Private windows or a full disk can block it. Download your project file to be safe.")}}};
S.persist=()=>{if(!S.ready||!VN.pid||sigOf()===S.sig)return;S.status('Saving…');clearTimeout(S.t);S.t=setTimeout(S.save,500)};
S.flush=async()=>{clearTimeout(S.t);await S.save()};
S.rename=async(id,name)=>{await tx(['projects','index'],'readwrite',(p,i)=>{p.get(id).onsuccess=e=>{if(e.target.result)p.put({...e.target.result,name})};return i.get(id).onsuccess=e=>{if(e.target.result)i.put({...e.target.result,name})}})};
S.duplicate=async id=>{const p=await S.get(id),ix=await tx('index','readonly',s=>s.get(id)),nid=newId(),now=Date.now(),name=p.name+' copy';
 await tx(['projects','index'],'readwrite',(P,I)=>{P.put({...p,id:nid,name,created:now,updated:now});return I.put({...ix,id:nid,name,created:now,updated:now})});return nid};
S.remove=id=>tx(['projects','index'],'readwrite',(p,i)=>{p.delete(id);return i.delete(id)}); // uploads stay in the library
// files: uploads join the shared library (same id = already there); ids from older files get fresh ones so projects can't clash
S.importData=async(d,fallback)=>{const id=newId(),now=Date.now(),blob=async u=>(await fetch(u)).blob(),isG=x=>/^a[0-9a-z]{9,}$/.test(x),have=new Set([...VN.sprites,...VN.bgs].map(a=>a.id)),map={},add=[],name=(d.name||fallback||'Imported project').slice(0,80);
 for(const[kind,list,src]of[['sprite',d.sprites,'png'],['bg',d.bgs,'data']])for(const a of list){const nid=isG(a.id)?a.id:VN.aid();map[a.id]=nid;if(!have.has(nid))add.push({id:nid,kind,name:kind==='bg'?'Backdrop':a.name,blob:await blob(a[src]),added:now})}
 const scenes=JSON.parse(JSON.stringify(d.scenes));scenes.forEach(sc=>{if(sc.bg)sc.bg=map[sc.bg]||null;(sc.chars||[]).forEach(c=>{if(map[c.sid])c.sid=map[c.sid]})});
 await tx(['library','projects','index'],'readwrite',(l,p,i)=>{add.forEach(a=>l.put(a));p.put({id,name,created:now,updated:now,scenes,cur:d.cur|0,uid:VN.Project.maxId(d)});return i.put({id,name,created:now,updated:now,scenes:scenes.length,thumb:null})});
 if(add.length)await S.loadLibrary();return id};
})();
