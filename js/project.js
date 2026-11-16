// Project files: everything (scenes, cropped sprites, backdrops) in one portable .kuwento.json file.
(()=>{
const P=VN.Project={};
const toURL=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b)});
const blobOf=cv=>new Promise(r=>cv.toBlob(r,'image/png'));
const slug=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project';
P.parse=text=>{const bad=()=>new Error("That file isn't a Kuwento project.");let d;try{d=JSON.parse(text)}catch{throw bad()}
 if(!d||d.app!=='kuwento'||!Array.isArray(d.scenes)||!d.scenes.length||!Array.isArray(d.sprites)||!Array.isArray(d.bgs))throw bad();return d};
P.maxId=d=>{let mx=d.uid|0;d.scenes.forEach(s=>(s.chars||[]).forEach(c=>{const n=+String(c.uid).replace(/\D/g,'');if(n>mx)mx=n}));return mx};
const ser=async o=>{const sprites=[],bgs=[],items=[];
 for(const s of o.items||[])items.push({id:s.id,name:s.name,png:await toURL(s.blob)});
 for(const s of o.sprites)sprites.push({id:s.id,name:s.name,png:await toURL(s.blob)});
 for(const b of o.bgs)bgs.push({id:b.id,data:await toURL(b.blob)});
 const blob=new Blob([JSON.stringify({app:'kuwento',version:3,name:o.name,saved:new Date().toISOString(),uid:o.uid,cur:o.cur,scenes:o.scenes,sprites,bgs,items})],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=`${slug(o.name)}-${new Date().toISOString().slice(0,10)}.kuwento.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
 return{sprites:sprites.length,bgs:bgs.length,mb:blob.size/1048576}};
const used=scenes=>{const u=new Set();scenes.forEach(s=>{if(s.bg)u.add(s.bg);if(s.itemId)u.add(s.itemId);(s.chars||[]).forEach(c=>u.add(c.sid))});return u};
const pack=async o=>{const u=used(o.scenes),sp=VN.sprites.filter(s=>u.has(s.id)),bg=VN.bgs.filter(b=>u.has(b.id)),it=VN.items.filter(i=>u.has(i.id));for(const s of[...sp,...it])s.blob=s.blob||await blobOf(s.cv);return ser({...o,sprites:sp,bgs:bg,items:it})};
P.save=()=>pack({name:VN.pname,uid:VN._u,cur:VN.cur,scenes:VN.scenes});
P.saveRecord=async id=>{const r=await VN.Store.get(id);return pack({name:r.name,uid:r.uid,cur:r.cur,scenes:r.scenes})};
})();
