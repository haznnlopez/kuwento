// Shared app state + undo/redo history. Images live outside history; scenes reference them by id.
window.VN={W:1920,H:1080,bgs:[],sprites:[],scenes:[],cur:0,sel:null,preview:false,hist:[],hi:-1,_u:0};
VN.id=()=>'i'+(++VN._u);
VN.blank=()=>({bg:null,chars:[],type:'char',name:'',speakerId:null,flipBox:false,dim:true,text:''});
VN.cs=()=>VN.scenes[VN.cur];
VN.selChar=()=>VN.cs().chars.find(c=>c.uid===VN.sel)||null;
VN.commit=()=>{VN.hist=VN.hist.slice(0,VN.hi+1);VN.hist.push(JSON.stringify({s:VN.scenes,c:VN.cur}));if(VN.hist.length>100)VN.hist.shift();VN.hi=VN.hist.length-1;VN.Store&&VN.Store.persist()};
VN.jump=d=>{const i=VN.hi+d;if(i<0||i>=VN.hist.length)return false;VN.hi=i;const o=JSON.parse(VN.hist[i]);VN.scenes=o.s;VN.cur=o.c;VN.sel=null;return true};
VN.scenes=[VN.blank()];VN.commit();
VN.aid=()=>'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,8); // library items keep one id across all projects
// icons: inline SVG symbols defined at the top of index.html
VN.ic=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
VN.ib=(icon,label,p={})=>{const b=document.createElement('button');Object.assign(b,p);b.innerHTML=VN.ic(icon)+(label?`<span class="lbl">${label}</span>`:'');b.setAttribute('aria-label',label||p.title||icon);return b};
