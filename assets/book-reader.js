(()=>{
"use strict";
const books={
"zya-guard-ai-security-v13":{title:"ZYA-GUARD: AI Security Master Course — V13 Edition",subject:"AI Security & Cybersecurity",cover:"./books/covers/zya-guard-ai-security.svg",expectedPages:46},
"converged-intelligence-infrastructure-2026":{title:"Converged Intelligence Infrastructure: Hybrid AI Data Center + Enterprise Cloud Data Center Architecture",subject:"AI Infrastructure, Data Centers & Cloud",cover:"./books/covers/converged-intelligence-infrastructure.svg",expectedPages:58}
};
const $=id=>document.getElementById(id);
const id=new URLSearchParams(location.search).get("book")||"";
const meta=Object.hasOwn(books,id)?books[id]:null;
let pages=[],current=1,zoom=1,touchX=null,touchY=null;
const paper=$("paper"),input=$("page-number"),status=$("status");
const message=t=>{status.textContent=t};
function failure(){message("This book is unavailable in the reading room.");$("page-image").hidden=true;for(const n of ["prev-page","next-page","page-number","zoom-in","zoom-out","zoom-reset"])$(n).disabled=true;}
function storePage(){try{localStorage.setItem("radartrust-reader-page:"+id,String(current))}catch{}}
function restorePage(){try{const n=Number(localStorage.getItem("radartrust-reader-page:"+id));return Number.isInteger(n)&&n>=1&&n<=pages.length?n:1}catch{return 1}}
function showPage(n,scroll=true){
 if(!pages.length)return;
 current=Math.max(1,Math.min(pages.length,Math.trunc(Number(n)||1)));
 const img=$("page-image");
 img.hidden=false;img.alt=`${meta.title} — original PDF page ${current} of ${pages.length}`;
 img.src=`./books/readers/${id}/${pages[current-1].image}`;
 input.value=String(current);

 $("total-pages").textContent=`/ ${pages.length}`;
 $("page-summary").textContent=`${pages.length} pages · Original PDF page images`;
 $("prev-page").disabled=current===1;$("next-page").disabled=current===pages.length;
 const progress=Math.round(current/pages.length*100);
 $("progress-bar").style.width=progress+"%";
 document.querySelector(".reading-progress").setAttribute("aria-valuenow",String(progress));
 message(`Page ${current} of ${pages.length}`);
 storePage();
 if(scroll)document.querySelector(".reading-area").scrollIntoView({behavior:"smooth",block:"start"});
}
function setZoom(n){zoom=Math.max(.65,Math.min(2.5,n));paper.style.setProperty("--page-zoom",zoom.toFixed(2));$("zoom-value").textContent=Math.round(zoom*100)+"%"}
async function init(){
 if(!meta){failure();return}
 $("book-title").textContent=meta.title;$("side-title").textContent=meta.title;$("subject").textContent=meta.subject;
 $("book-cover").src=meta.cover;$("book-cover").alt="Cover for "+meta.title;
 document.title=meta.title+" | RadarTrust Reader";
 try{
  const response=await fetch(`./books/readers/${id}/pages.json`,{cache:"no-store"});
  if(!response.ok)throw Error("Manifest unavailable");
  const data=await response.json();
  if(data.id!==id||data.pageCount!==meta.expectedPages||!Array.isArray(data.pages)||data.pages.length!==meta.expectedPages)throw Error("Invalid manifest");
  for(let i=0;i<data.pages.length;i++)if(data.pages[i]?.n!==i+1||data.pages[i].image!==`page-${String(i+1).padStart(3,"0")}.webp`)throw Error("Invalid page");
  pages=data.pages;input.max=String(pages.length);showPage(restorePage(),false);
 }catch{failure();return}
 $("page-image").addEventListener("error",()=>message("Page image failed to load. Please retry."));
 $("prev-page").addEventListener("click",()=>showPage(current-1));
 $("next-page").addEventListener("click",()=>showPage(current+1));
 input.addEventListener("change",()=>showPage(input.value,false));
 input.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();showPage(input.value);input.blur()}});
 $("zoom-in").addEventListener("click",()=>setZoom(zoom+.15));
 $("zoom-out").addEventListener("click",()=>setZoom(zoom-.15));
 $("zoom-reset").addEventListener("click",()=>setZoom(1));
 document.addEventListener("keydown",ev=>{if(ev.ctrlKey||ev.altKey||ev.metaKey||["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;if(ev.key==="ArrowRight"){ev.preventDefault();showPage(current+1)}if(ev.key==="ArrowLeft"){ev.preventDefault();showPage(current-1)}});
 paper.addEventListener("touchstart",ev=>{if(ev.touches.length!==1)return;touchX=ev.touches[0].clientX;touchY=ev.touches[0].clientY},{passive:true});
 paper.addEventListener("touchend",ev=>{if(touchX===null||!ev.changedTouches.length)return;const dx=ev.changedTouches[0].clientX-touchX,dy=ev.changedTouches[0].clientY-touchY;touchX=touchY=null;if(Math.abs(dx)>85&&Math.abs(dx)>Math.abs(dy)*1.3)showPage(current+(dx<0?1:-1))},{passive:true});
}
init();
})();
