(()=>{
const E=VN.Export={},wait=ms=>new Promise(r=>setTimeout(r,ms));
E.blob=async i=>{await document.fonts.load('36px "One Little Font"').catch(()=>{});const cv=document.createElement('canvas');cv.width=VN.W;cv.height=VN.H;
 VN.Render.draw(cv.getContext('2d'),VN.scenes[i],null);return new Promise(r=>cv.toBlob(r,'image/png'))};
const say=m=>VN.UI&&VN.UI.toast(m);
E.save=async i=>{try{const b=await E.blob(i);if(!b)throw new Error('The image came out empty (the browser may be low on memory).');VN.download(b,`scene-${String(i+1).padStart(2,'0')}.png`)}catch(err){say("Couldn't export this scene: "+(err.message||err))}};
// "Export all" bundles every scene into one .zip (PNGs are already compressed, so files are stored as-is)
const T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=~0;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(~c)>>>0};
E.zip=files=>{const enc=new TextEncoder(),parts=[],cd=[];let off=0,cdSize=0;const d=new Date(),dt=(d.getFullYear()-1980)<<9|(d.getMonth()+1)<<5|d.getDate(),tm=d.getHours()<<11|d.getMinutes()<<5|d.getSeconds()>>1;
 for(const f of files){const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
  const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(10,tm,true);lh.setUint16(12,dt,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);
  const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);ch.setUint32(16,crc,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
  parts.push(lh.buffer,nm,f.data);cd.push(ch.buffer,nm);off+=30+nm.length+sz;cdSize+=46+nm.length}
 const end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,off,true);
 return new Blob([...parts,...cd,end.buffer],{type:'application/zip'})};
const slug=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'scenes';
E.busy=false;
E.all=async()=>{if(E.busy)return;E.busy=true;const n=VN.scenes.length,files=[],failed=[];
 try{for(let i=0;i<n;i++){say(`Rendering scene ${i+1} of ${n}…`);
   try{const b=await E.blob(i);if(!b)throw new Error('empty');files.push({name:`scene-${String(i+1).padStart(2,'0')}.png`,data:new Uint8Array(await b.arrayBuffer())})}catch(err){failed.push(i+1)}
   await wait(0)}
  if(!files.length)throw new Error('no scene could be rendered');
  const blob=E.zip(files),name=`${slug(VN.pname)}-scenes.zip`;VN.download(blob,name);
  const msg=`Exported ${files.length} of ${n} scene${n>1?'s':''} as a zip${failed.length?` (couldn't render scene ${failed.join(', ')})`:''}.`;
  VN.UI.notice?VN.UI.notice(msg,'Download again',()=>VN.download(blob,name)):say(msg); // second chance if the browser blocked the first download
 }catch(err){say("Couldn't create the zip: "+(err.message||err)+". Try Export scene to save them one at a time.")}finally{E.busy=false}};
})();
