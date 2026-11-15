// Custom tooltips: replaces the browser's plain title pop-ups. Any element with a title="" gets one; "(Ctrl+Z)" / "  [" endings become key caps.
(()=>{
const tip=document.getElementById('tt');let timer,cur=null;
const hide=()=>{clearTimeout(timer);tip.classList.remove('on');cur=null};
const place=el=>{const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,below=r.bottom+h+14<innerHeight||r.top<h+14;
 let x=Math.min(innerWidth-w-8,Math.max(8,r.left+r.width/2-w/2));
 tip.style.left=x+'px';tip.style.top=(below?r.bottom+9:r.top-h-9)+'px';tip.style.setProperty('--ax',(r.left+r.width/2-x)+'px');tip.classList.toggle('below',below);tip.classList.toggle('above',!below)};
const show=el=>{if(el.title){el.dataset.tip=el.title;el.removeAttribute('title')}  // the native pop-up would double up
 const txt=el.dataset.tip;if(!txt||!el.isConnected)return;
 const m=txt.match(/^(.*?)(?:\s+\(([^)]+)\)|\s{2}(\S+))$/),label=m?m[1]:txt,key=m&&(m[2]||m[3]);
 tip.replaceChildren(label);if(key){const k=document.createElement('kbd');k.textContent=key;tip.append(k)}
 cur=el;tip.classList.add('on');place(el)};
const target=e=>e.target.closest&&e.target.closest('[title],[data-tip]');
const arm=(el,delay)=>{clearTimeout(timer);if(el.title){el.dataset.tip=el.title;el.removeAttribute('title')}timer=setTimeout(()=>show(el),delay)};
document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const el=target(e);if(!el){return}if(el===cur)return;hide();arm(el,tip.classList.contains('on')?0:380)});
document.addEventListener('pointerout',e=>{const el=target(e);if(el&&!el.contains(e.relatedTarget))hide()});
document.addEventListener('focusin',e=>{const el=target(e);if(el&&e.target.matches(':focus-visible'))arm(el,150)});
document.addEventListener('focusout',hide);
['pointerdown','keydown','wheel','dragstart'].forEach(ev=>document.addEventListener(ev,hide,true));
addEventListener('scroll',hide,true);addEventListener('resize',hide);
setInterval(()=>{if(cur&&!cur.isConnected)hide()},400);
})();
