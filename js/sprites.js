// Sprite-sheet detection: flood-fill the white background from the edges, label the remaining
// shapes, merge nearby fragments, crop each group with a transparent background.
(()=>{
const S=VN.Sprites={};
S.detect=img=>{
 const w=img.naturalWidth,h=img.naturalHeight,N=w*h,cv=document.createElement('canvas');cv.width=w;cv.height=h;
 const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const src=x.getImageData(0,0,w,h),d=src.data;
 let tr=0;for(let i=3;i<d.length;i+=4)if(d[i]<250)tr++;
 const hasA=tr>N*.005; // sheet already has a transparent background: keep pixels exactly as they are
 const near=i=>{const j=i*4;return d[j+3]<12||(d[j]>238&&d[j+1]>238&&d[j+2]>238)};
 const bg=new Uint8Array(N),st=new Int32Array(N);let sp=0;
 const push=i=>{if(!bg[i]&&near(i)){bg[i]=1;st[sp++]=i}};
 for(let i=0;i<w;i++){push(i);push(N-w+i)}for(let j=0;j<h;j++){push(j*w);push(j*w+w-1)}
 while(sp){const i=st[--sp],px=i%w;if(px>0)push(i-1);if(px<w-1)push(i+1);if(i>=w)push(i-w);if(i<N-w)push(i+w)}
 for(let i=0;i<N;i++)if(d[i*4+3]<12)bg[i]=1;
 if(hasA)for(let i=0;i<N;i++)bg[i]=d[i*4+3]<4?1:0;
 // strip the light halo: peel light pixels that touch the background (3 passes)
 const touch=i=>{const px=i%w;return(px>0&&bg[i-1])||(px<w-1&&bg[i+1])||(i>=w&&bg[i-w])||(i<N-w&&bg[i+w])};
 for(let p=0;p<(hasA?0:3);p++){const fr=[];for(let i=0;i<N;i++){if(bg[i])continue;const j=i*4;if(Math.min(d[j],d[j+1],d[j+2])>190&&touch(i))fr.push(i)}fr.forEach(i=>bg[i]=1)}
 // connected components (8-neighbour)
 const lab=new Int32Array(N),box=[0];let n=0;
 for(let s=0;s<N;s++){if(bg[s]||lab[s])continue;n++;const b=[w,h,0,0,0];box.push(b);lab[s]=n;sp=0;st[sp++]=s;
  while(sp){const i=st[--sp],px=i%w,py=i/w|0;b[0]=Math.min(b[0],px);b[1]=Math.min(b[1],py);b[2]=Math.max(b[2],px);b[3]=Math.max(b[3],py);b[4]++;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const qx=px+dx,qy=py+dy;if(qx<0||qy<0||qx>=w||qy>=h)continue;const q=qy*w+qx;if(!bg[q]&&!lab[q]){lab[q]=n;st[sp++]=q}}}}
 // big shapes = sprites; small fragments (sparkles, loose bits) attach to the nearest sprite or are dropped
 let mx=0;for(let i=1;i<=n;i++)mx=Math.max(mx,box[i][4]);
 const big=[],G={},owner=new Int32Array(n+1);
 for(let i=1;i<=n;i++)if(box[i][4]>=mx*.05&&box[i][4]>=300){big.push(i);owner[i]=i;G[i]={x0:box[i][0],y0:box[i][1],x1:box[i][2],y1:box[i][3],area:box[i][4]}}
 const E=28;
 for(let i=1;i<=n;i++){if(owner[i]||box[i][4]<12)continue;const q=box[i];
  const t=big.find(k=>{const p=box[k];return p[0]-E<=q[2]&&q[0]-E<=p[2]&&p[1]-E<=q[3]&&q[1]-E<=p[3]});
  if(t){owner[i]=t;const g=G[t];g.x0=Math.min(g.x0,q[0]);g.y0=Math.min(g.y0,q[1]);g.x1=Math.max(g.x1,q[2]);g.y1=Math.max(g.y1,q[3])}}
 let gs=Object.entries(G);
 // reading order: rows then left to right
 gs.sort((a,b)=>a[1].y0+a[1].y1-b[1].y0-b[1].y1);const rows=[];
 gs.forEach(g=>{const cy=(g[1].y0+g[1].y1)/2,hh=g[1].y1-g[1].y0,row=rows.find(r=>Math.abs(r.cy-cy)<hh*.5);row?row.g.push(g):rows.push({cy,g:[g]})});
 gs=rows.flatMap(r=>r.g.sort((a,b)=>a[1].x0-b[1].x0));
 return gs.map(([root,g])=>{const cw=g.x1-g.x0+1,ch=g.y1-g.y0+1,out=document.createElement('canvas');out.width=cw;out.height=ch;
  const ox=out.getContext('2d'),im=ox.createImageData(cw,ch);
  for(let y=0;y<ch;y++)for(let xx=0;xx<cw;xx++){const i=(y+g.y0)*w+xx+g.x0,l=lab[i];if(l&&owner[l]==+root){const o=(y*cw+xx)*4,j=i*4;let r=d[j],gr=d[j+1],bl=d[j+2],al=d[j+3];
   if(!hasA&&touch(i)){const m=Math.min(r,gr,bl);if(m>140){const k=Math.max(.3,(255-m)/115),u=v=>Math.max(0,Math.min(255,(v-255*(1-k))/k));r=u(r);gr=u(gr);bl=u(bl);al*=k}}
   im.data[o]=r;im.data[o+1]=gr;im.data[o+2]=bl;im.data[o+3]=al}}
  ox.putImageData(im,0,0);return out});
};
})();
