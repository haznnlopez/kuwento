// Single renderer used for the editor canvas, thumbnails, preview and PNG export (WYSIWYG).
(()=>{
const A=window.VN_ASSETS,MARGIN=64,FONT='"One Little Font",cursive',box={};
const SLOT={left:.125,center:.5,right:.875},DIM=.5;
for(const k in A){box[k]=new Image();box[k].src=A[k].src}
const R=VN.Render={};
R.spr=id=>{const s=VN.sprites.find(s=>s.id===id);return s&&s.cv?s:null}; // only sprites whose pixels are loaded
// characters sit in two fixed slots (left/center/right), bottom-anchored; only size (proportional) and flip vary
R.frac=c=>c.view==='torso'?(c.crop||.55):1; // torso-up keeps only the top part of the sprite
R.rect=c=>{const s=R.spr(c.sid);if(!s)return null;const w=s.cv.width*c.scale,h=s.cv.height*R.frac(c)*c.scale;return{x:VN.W*SLOT[c.side]-w/2,y:VN.H-h,w,h}};
R.handle=c=>{const r=R.rect(c);return r&&{x:Math.min(VN.W-20,r.x+r.w),y:Math.max(20,r.y),s:36}};
function mask(s){if(!s.m){const k=Math.min(1,256/Math.max(s.cv.width,s.cv.height)),w=Math.max(1,Math.round(s.cv.width*k)),h=Math.max(1,Math.round(s.cv.height*k)),c=document.createElement('canvas');c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(s.cv,0,0,w,h);s.m={w,h,d:x.getImageData(0,0,w,h).data}}return s.m} // small alpha map for clicking
R.hit=(c,px,py)=>{const s=R.spr(c.sid),r=R.rect(c);if(!s||px<r.x||py<r.y||px>r.x+r.w||py>r.y+r.h)return false;
 let u=(px-r.x)/r.w;if(c.flip)u=1-u;const m=mask(s),ix=Math.min(m.w-1,u*m.w|0),iy=Math.min(m.h-1,(py-r.y)/r.h*m.h*R.frac(c)|0);return m.d[(iy*m.w+ix)*4+3]>20};
function sil(s){if(!s.sil){const k=Math.min(1,1024/Math.max(s.cv.width,s.cv.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(s.cv.width*k));c.height=Math.max(1,Math.round(s.cv.height*k));
 const x=c.getContext('2d');x.drawImage(s.cv,0,0,c.width,c.height);x.globalCompositeOperation='source-in';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);s.sil=c}return s.sil}
// the backdrop is scaled to fill the 16:9 frame once, then every redraw is a plain copy
function cover(bg){if(!bg._c){const c=document.createElement('canvas');c.width=VN.W;c.height=VN.H;const x=c.getContext('2d');x.imageSmoothingQuality='high';
 const iw=bg.img.naturalWidth,ih=bg.img.naturalHeight,k=Math.max(VN.W/iw,VN.H/ih),w=iw*k,h=ih*k;x.drawImage(bg.img,(VN.W-w)/2,(VN.H-h)/2,w,h);bg._c=c}return bg._c}
function wrap(ctx,t,mw){const out=[];t.split('\n').forEach(p=>{let l='';p.split(' ').forEach(w=>{const test=l?l+' '+w:w;if(ctx.measureText(test).width<=mw){l=test;return}
 if(l)out.push(l);l=w;while(ctx.measureText(l).width>mw&&l.length>1){let i=l.length-1;while(i>1&&ctx.measureText(l.slice(0,i)).width>mw)i--;out.push(l.slice(0,i));l=l.slice(i)}});out.push(l)});return out}
// character box: 1360px wide; narrator box: 400px tall (both scaled proportionally)
function dialog(ctx,s){
 const item=s.type==='item',key=item?'narr':s.type,a=A[key],K=item?190/a.h:(s.type==='char'?1360/a.w:400/a.h),w=a.w*K,h=a.h*K,x=(VN.W-w)/2,y=VN.H-MARGIN-h,fl=item?false:s.flipBox; // item scenes use a small narrator box
 const fx=(l,r)=>fl?[1-r,1-l]:[l,r];
 ctx.save();ctx.imageSmoothingQuality='high';
 if(fl){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(box[key],0,0,w,h)}else ctx.drawImage(box[key],x,y,w,h);
 ctx.restore();
 ctx.fillStyle='#56250c';ctx.textBaseline='middle';ctx.textAlign='center';
 if(s.type==='char'&&s.name){const n=a.name,[l,r]=fx(n[0],n[2]),nx=x+l*w,ny=y+n[1]*h,nw=(r-l)*w,nh=(n[3]-n[1])*h;let fs=40;
  do{ctx.font=`${fs}px ${FONT}`;fs-=2}while(ctx.measureText(s.name).width>nw-24&&fs>14);
  ctx.fillText(s.name,nx+nw/2,ny+nh/2+2)}
 const msg=item?('Received: '+(s.itemName||'')).trim():s.text;if(!msg)return;
 const c=a.cream,[l,r]=fx(c[0],c[2]),padX=item?34:56,padY=item?20:28,tx=x+l*w+padX,ty=y+c[1]*h+padY,tw=(r-l)*w-padX*2,th=(c[3]-c[1])*h-padY*2;
 let fs=36,lines;for(;;){ctx.font=`${fs}px ${FONT}`;lines=wrap(ctx,msg,tw);if(lines.length*fs*1.25<=th||fs<=16)break;fs-=2}
 const lh=fs*1.25,top=ty+th/2-lines.length*lh/2;
 lines.forEach((t,i)=>ctx.fillText(t,tx+tw/2,top+(i+.5)*lh));
}
// faint golden glow and soft rays behind a received item
function shine(ctx,cx,cy,r){ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='screen';
 const rr=Math.max(120,r)*1.45,g=ctx.createRadialGradient(0,0,0,0,0,rr);g.addColorStop(0,'rgba(255,214,120,.42)');g.addColorStop(.45,'rgba(255,190,80,.17)');g.addColorStop(1,'rgba(255,180,60,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.fill();
 for(let i=0;i<14;i++){ctx.save();ctx.rotate(i/14*Math.PI*2+.2);const len=rr*1.2,lg=ctx.createLinearGradient(0,0,len,0);lg.addColorStop(0,'rgba(255,220,130,.075)');lg.addColorStop(1,'rgba(255,220,130,0)');
  ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len,-len*.05);ctx.lineTo(len,len*.05);ctx.closePath();ctx.fill();ctx.restore()}
 ctx.restore()}
R.draw=(ctx,s,sel,fast)=>{
 const{W,H}=VN;ctx.save();ctx.clearRect(0,0,W,H);ctx.fillStyle='#14121a';ctx.fillRect(0,0,W,H);ctx.imageSmoothingQuality=fast?'low':'high';
 const bg=VN.bgs.find(b=>b.id===s.bg);
 if(bg&&bg.img)ctx.drawImage(cover(bg),0,0,W,H);
 s.chars.forEach(c=>{const r=R.rect(c),sp=R.spr(c.sid);if(!r)return;
  const dim=s.type==='char'&&s.dim&&s.speakerId&&c.uid!==s.speakerId;
  ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);if(c.flip)ctx.scale(-1,1);
  if(dim){const q=sil(sp);ctx.drawImage(q,0,0,q.width,q.height*R.frac(c),-r.w/2,-r.h/2,r.w,r.h);ctx.globalAlpha=DIM} // black backing so the background doesn't show through
  ctx.drawImage(sp.cv,0,0,sp.cv.width,sp.cv.height*R.frac(c),-r.w/2,-r.h/2,r.w,r.h);ctx.restore()});
 if(s.type==='item'){const it=VN.items.find(i=>i.id===s.itemId);ctx.fillStyle='rgba(6,8,14,.7)';ctx.fillRect(0,0,W,H); // everything behind the item dims
  if(it&&it.cv){const k=s.itemScale||1,w=it.cv.width*k,h=it.cv.height*k;shine(ctx,W/2,H/2,Math.max(w,h)/2);
   ctx.save();ctx.translate(W/2,H/2);ctx.rotate((s.itemRot||0)*Math.PI/180);ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=28;ctx.drawImage(it.cv,-w/2,-h/2,w,h);ctx.restore()}}
 dialog(ctx,s);
 const c=sel&&s.chars.find(c=>c.uid===sel),r=c&&R.rect(c);
 if(r){ctx.strokeStyle='#4aa3ff';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.strokeRect(r.x,r.y,r.w,r.h);const h=R.handle(c);ctx.setLineDash([]);ctx.fillStyle='#4aa3ff';ctx.fillRect(h.x-h.s/2,h.y-h.s/2,h.s,h.s);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(h.x-h.s/2,h.y-h.s/2,h.s,h.s)}
 ctx.restore()};
// the editor canvas is drawn at the size it is shown (not always 1920x1080) and redraws are batched to one per frame
R._paint=()=>{const cv=document.getElementById('stage');if(!cv)return;const fw=cv.clientWidth||960,tw=Math.max(640,Math.min(1920,Math.round(fw*Math.min(2,devicePixelRatio||1))));
 if(cv.width!==tw){cv.width=tw;cv.height=Math.round(tw*9/16)}
 const x=cv.getContext('2d'),k=cv.width/VN.W;x.save();x.setTransform(k,0,0,k,0,0);R.draw(x,VN.cs(),VN.preview?null:VN.sel,true);x.restore()};
R.paint=()=>{if(R._raf)return;R._raf=requestAnimationFrame(()=>{R._raf=0;R._paint()})};
R.paintNow=()=>{cancelAnimationFrame(R._raf);R._raf=0;R._paint()};
const fr=document.querySelector('.frame');if(fr&&window.ResizeObserver)new ResizeObserver(()=>R.paint()).observe(fr);
})();
