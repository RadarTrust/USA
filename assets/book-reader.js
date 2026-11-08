(()=>{
"use strict";
const books={
 "zya-guard-ai-security-v13":{
  title:"ZYA-GUARD: AI Security Master Course — V13 Edition",
  subject:"AI Security & Cybersecurity",
  cover:"./books/covers/zya-guard-ai-security.svg",
  expectedPages:46
 },
 "converged-intelligence-infrastructure-2026":{
  title:"Converged Intelligence Infrastructure: Hybrid AI Data Center + Enterprise Cloud Data Center Architecture",
  subject:"AI Infrastructure, Data Centers & Cloud",
  cover:"./books/covers/converged-intelligence-infrastructure.svg",
  expectedPages:58
 }
};
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const id=params.get("book")||"";
const meta=Object.hasOwn(books,id)?books[id]:null;
let pages=[],current=1,zoom=1,touchX=null,touchY=null;
const status=$("status"),input=$("page-number"),paper=$("paper");
function message(value){status.textContent=value}
function failure(){message("This book is unavailable in the reading room.");$("page-text").textContent="Select a publication from My Publications & Projects.";for(const n of ["prev-page","next-page","page-number","zoom-in","zoom-out","zoom-reset"])$(n).disabled=true;}
function storePage(){try{localStorage.setItem("radartrust-reader-page:"+id,String(current))}catch{}}
function restorePage(){try{const p=Number(localStorage.getItem("radartrust-reader-page:"+id));return Number.isInteger(p)&&p>=1&&p<=pages.length?p:1}catch{return 1}}
function showPage(n,scroll=true){
 if(!pages.length)return;
 current=Math.max(1,Math.min(pages.length,Math.trunc(Number(n)||1)));
 const page=pages[current-1];
 $("page-text").textContent=typeof page.t==="string"?page.t:"";
 input.value=String(current);
 $("paper-count").textContent="Page "+current+" of "+pages.length;
 $("total-pages").textContent="/ "+pages.length;
 $("page-summary").textContent=pages.length+" pages · Online reading edition";
 $("prev-page").disabled=current===1;
 $("next-page").disabled=current===pages.length;
 const progress=Math.round(current/pages.length*100);
 $("progress-bar").style.width=progress+"%";
 document.querySelector(".reading-progress").setAttribute("aria-valuenow",String(progress));
 message("Page "+current+" of "+pages.length);
 storePage();
 if(scroll)document.querySelector(".reading-area").scrollIntoView({behavior:"smooth",block:"start"});
}
function setZoom(z){
 zoom=Math.max(.85,Math.min(1.65,z));
 paper.style.setProperty("--font-scale",zoom.toFixed(2));
 $("zoom-value").textContent=Math.round(zoom*100)+"%";
}
function navigate(dir){showPage(current+dir)}
async function init(){
 if(!meta){document.title="Book unavailable | RadarTrust";failure();return;}
 $("book-title").textContent=meta.title;
 $("side-title").textContent=meta.title;
 $("subject").textContent=meta.subject;
 $("book-cover").src=meta.cover;
 $("book-cover").alt="Illustrated cover preview for "+meta.title;
 document.title=meta.title+" | RadarTrust Reader";
 message("Loading online reading edition…");
 try{
  const response=await fetch("./books/readers/"+id+"/pages.json",{cache:"no-store"});
  if(!response.ok)throw Error("Invalid response");
  const data=await response.json();
  if(data.id!==id||!Array.isArray(data.pages)||data.pages.length!==meta.expectedPages||data.pageCount!==meta.expectedPages)throw Error("Invalid publication manifest");
  for(let i=0;i<data.pages.length;i++){const p=data.pages[i];if(!p||p.n!==i+1||typeof p.t!=="string")throw Error("Page manifest invalid")}
  pages=data.pages;
  $("page-number").max=String(pages.length);
  showPage(restorePage(),false);
 }catch{failure();return;}
 $("prev-page").addEventListener("click",()=>navigate(-1));
 $("next-page").addEventListener("click",()=>navigate(1));
 input.addEventListener("change",()=>showPage(input.value,false));
 input.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();showPage(input.value);input.blur()}});
 $("zoom-in").addEventListener("click",()=>setZoom(zoom+.1));
 $("zoom-out").addEventListener("click",()=>setZoom(zoom-.1));
 $("zoom-reset").addEventListener("click",()=>setZoom(1));
 document.addEventListener("keydown",ev=>{
  if(ev.ctrlKey||ev.altKey||ev.metaKey||["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
  if(ev.key==="ArrowRight"){ev.preventDefault();navigate(1)}
  if(ev.key==="ArrowLeft"){ev.preventDefault();navigate(-1)}
 });
 paper.addEventListener("touchstart",ev=>{if(ev.touches.length!==1)return;touchX=ev.touches[0].clientX;touchY=ev.touches[0].clientY},{passive:true});
 paper.addEventListener("touchend",ev=>{if(touchX===null||!ev.changedTouches.length)return;const dx=ev.changedTouches[0].clientX-touchX,dy=ev.changedTouches[0].clientY-touchY;touchX=touchY=null;if(Math.abs(dx)>85&&Math.abs(dx)>Math.abs(dy)*1.3)navigate(dx<0?1:-1)},{passive:true});
}
init();
})();
