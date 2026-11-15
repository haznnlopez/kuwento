(()=>{
const E=VN.Export={},wait=ms=>new Promise(r=>setTimeout(r,ms));
E.blob=async i=>{await document.fonts.load('36px "One Little Font"').catch(()=>{});const cv=document.createElement('canvas');cv.width=VN.W;cv.height=VN.H;
 VN.Render.draw(cv.getContext('2d'),VN.scenes[i],null);return new Promise(r=>cv.toBlob(r,'image/png'))};
E.save=async i=>{const b=await E.blob(i),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`scene-${String(i+1).padStart(2,'0')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)};
E.all=async()=>{for(let i=0;i<VN.scenes.length;i++){await E.save(i);await wait(400)}};
})();
