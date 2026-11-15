// Single renderer used for the editor canvas, thumbnails, preview and PNG export (WYSIWYG).
(()=>{
const A=window.VN_ASSETS,MARGIN=64,FONT='"One Little Font",cursive',box={};
const SLOT={left:.125,center:.5,right:.875},DIM=.5;
for(const k in A){box[k]=new Image();box[k].src=A[k].src}
const R=VN.Render={};
R.spr=id=>VN.sprites.find(s=>s.id===id);
// characters sit in two fixed slots (left/center/right), bottom-anchored; only size (proportional) and flip vary
R.frac=c=>c.view==='torso'?(c.crop||.55):1; // torso-up keeps only the top part of the sprite
R.rect=c=>{const s=R.spr(c.sid);if(!s)return null;const w=s.cv.width*c.scale,h=s.cv.height*R.frac(c)*c.scale;return{x:VN.W*SLOT[c.side]-w/2,y:VN.H-h,w,h}};
R.handle=c=>{const r=R.rect(c);return r&&{x:Math.min(VN.W-20,r.x+r.w),y:Math.max(20,r.y),s:36}};
R.hit=(c,px,py)=>{const s=R.spr(c.sid),r=R.rect(c);if(!s||px<r.x||py<r.y||px>r.x+r.w||py>r.y+r.h)return false;
 let u=(px-r.x)/r.w;if(c.flip)u=1-u;const ix=Math.min(s.cv.width-1,u*s.cv.width|0),iy=Math.min(s.cv.height-1,(py-r.y)/r.h*s.cv.height*R.frac(c)|0);
 if(!s.a)s.a=s.cv.getContext('2d').getImageData(0,0,s.cv.width,s.cv.height).data;return s.a[(iy*s.cv.width+ix)*4+3]>20};
function sil(s){if(!s.sil){const c=document.createElement('canvas');c.width=s.cv.width;c.height=s.cv.height;const x=c.getContext('2d');x.drawImage(s.cv,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);s.sil=c}return s.sil}
function wrap(ctx,t,mw){const out=[];t.split('\n').forEach(p=>{let l='';p.split(' ').forEach(w=>{const test=l?l+' '+w:w;if(ctx.measureText(test).width<=mw){l=test;return}
 if(l)out.push(l);l=w;while(ctx.measureText(l).width>mw&&l.length>1){let i=l.length-1;while(i>1&&ctx.measureText(l.slice(0,i)).width>mw)i--;out.push(l.slice(0,i));l=l.slice(i)}});out.push(l)});return out}
// character box: 1360px wide; narrator box: 400px tall (both scaled proportionally)
function dialog(ctx,s){
 const a=A[s.type],K=s.type==='char'?1360/a.w:400/a.h,w=a.w*K,h=a.h*K,x=(VN.W-w)/2,y=VN.H-MARGIN-h,fl=s.flipBox;
 const fx=(l,r)=>fl?[1-r,1-l]:[l,r];
 ctx.save();ctx.imageSmoothingQuality='high';
 if(fl){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(box[s.type],0,0,w,h)}else ctx.drawImage(box[s.type],x,y,w,h);
 ctx.restore();
 ctx.fillStyle='#56250c';ctx.textBaseline='middle';ctx.textAlign='center';
 if(s.type==='char'&&s.name){const n=a.name,[l,r]=fx(n[0],n[2]),nx=x+l*w,ny=y+n[1]*h,nw=(r-l)*w,nh=(n[3]-n[1])*h;let fs=40;
  do{ctx.font=`${fs}px ${FONT}`;fs-=2}while(ctx.measureText(s.name).width>nw-24&&fs>14);
  ctx.fillText(s.name,nx+nw/2,ny+nh/2+2)}
 if(!s.text)return;
 const c=a.cream,[l,r]=fx(c[0],c[2]),padX=56,padY=28,tx=x+l*w+padX,ty=y+c[1]*h+padY,tw=(r-l)*w-padX*2,th=(c[3]-c[1])*h-padY*2;
 let fs=36,lines;for(;;){ctx.font=`${fs}px ${FONT}`;lines=wrap(ctx,s.text,tw);if(lines.length*fs*1.25<=th||fs<=16)break;fs-=2}
 const lh=fs*1.25,top=ty+th/2-lines.length*lh/2;
 lines.forEach((t,i)=>ctx.fillText(t,tx+tw/2,top+(i+.5)*lh));
}
R.draw=(ctx,s,sel)=>{
 const{W,H}=VN;ctx.save();ctx.clearRect(0,0,W,H);ctx.fillStyle='#14121a';ctx.fillRect(0,0,W,H);ctx.imageSmoothingQuality='high';
 const bg=VN.bgs.find(b=>b.id===s.bg);
 if(bg){const k=Math.max(W/bg.img.naturalWidth,H/bg.img.naturalHeight),w=bg.img.naturalWidth*k,h=bg.img.naturalHeight*k;ctx.drawImage(bg.img,(W-w)/2,(H-h)/2,w,h)}
 s.chars.forEach(c=>{const r=R.rect(c),sp=R.spr(c.sid);if(!r)return;
  const dim=s.type==='char'&&s.dim&&s.speakerId&&c.uid!==s.speakerId;
  ctx.save();ctx.translate(r.x+r.w/2,r.y+r.h/2);if(c.flip)ctx.scale(-1,1);
  if(dim){ctx.drawImage(sil(sp),0,0,sp.cv.width,sp.cv.height*R.frac(c),-r.w/2,-r.h/2,r.w,r.h);ctx.globalAlpha=DIM} // black backing so the background doesn't show through
  ctx.drawImage(sp.cv,0,0,sp.cv.width,sp.cv.height*R.frac(c),-r.w/2,-r.h/2,r.w,r.h);ctx.restore()});
 dialog(ctx,s);
 const c=sel&&s.chars.find(c=>c.uid===sel),r=c&&R.rect(c);
 if(r){ctx.strokeStyle='#4aa3ff';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.strokeRect(r.x,r.y,r.w,r.h);const h=R.handle(c);ctx.setLineDash([]);ctx.fillStyle='#4aa3ff';ctx.fillRect(h.x-h.s/2,h.y-h.s/2,h.s,h.s);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(h.x-h.s/2,h.y-h.s/2,h.s,h.s)}
 ctx.restore()};
R.paint=()=>R.draw(document.getElementById('stage').getContext('2d'),VN.cs(),VN.preview?null:VN.sel);
})();
