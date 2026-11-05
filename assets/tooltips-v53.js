/* RadarTrust v53 | one consistent tooltip for all clickable site controls.
   Native title tooltip text is migrated into accessible styled tooltips. */
(()=>{
"use strict";
if(document.documentElement.dataset.rtTooltipV53==="1")return;
document.documentElement.dataset.rtTooltipV53="1";
const SELECTOR='a[title],button[title],[role="button"][title],[role="link"][title],[data-tooltip],.portrait-photo.rt-about-target,.skills-constellation .skill-node,.floating-dock [aria-label],.rt-guide [aria-label],.rt-guide-launch[aria-label],.rt-cert-interactive[aria-label],.rt-cert-zoom-controls button[aria-label],.rt-cert-close[aria-label],.back[aria-label],.topbar button[aria-label]';
const instances=new WeakSet();
let fallback=null;
function tooltipText(el){
 const explicit=el.getAttribute("data-tooltip")||el.getAttribute("title");
 const aria=el.getAttribute("aria-label");
 const skill=el.getAttribute("data-skill");
 return (explicit||aria||(skill?"Explore "+skill+" expertise and credentials":"")).trim();
}
function init(el){
 if(instances.has(el))return;
 const content=tooltipText(el);
 if(!content)return;
 instances.add(el);
 // Prevent the browser's standard yellow tooltip on hovered/focused elements.
 if(el.hasAttribute("title"))el.removeAttribute("title");
 if(el._tippy)return; // Existing floating dock uses the same premium theme.
 if(typeof window.tippy==="function"){
  const placement=el.closest(".hero-aside")?"top":el.closest(".floating-dock")?"left":"top";
  window.tippy(el,{content,theme:"radar-premium",arrow:true,animation:"fade",duration:[180,110],delay:[110,0],placement,trigger:"mouseenter focus",touch:false,interactive:false,appendTo:()=>document.body,maxWidth:230,offset:[0,11],popperOptions:{modifiers:[{name:"preventOverflow",options:{padding:12}},{name:"flip",options:{fallbackPlacements:["bottom","right","left"]}}]}});
 } else {
  if(!fallback){fallback=document.createElement("div");fallback.className="rt-premium-tooltip-fallback";fallback.setAttribute("role","tooltip");document.body.append(fallback);}
  const show=()=>{
   fallback.textContent=content;
   const box=el.getBoundingClientRect();
   fallback.style.left=Math.max(10,Math.min(window.innerWidth-240,box.left+box.width/2-100))+"px";
   fallback.style.top=Math.max(10,box.top-57)+"px";
   fallback.classList.add("rt-show");
  };
  const hide=()=>fallback.classList.remove("rt-show");
  el.addEventListener("mouseenter",show);el.addEventListener("focus",show);
  el.addEventListener("mouseleave",hide);el.addEventListener("blur",hide);
 }
}
function scan(root){
 if(root.nodeType!==1&&root.nodeType!==9)return;
 if(root.matches?.(SELECTOR))init(root);
 root.querySelectorAll?.(SELECTOR).forEach(init);
}
scan(document);
const observer=new MutationObserver(changes=>{
 for(const record of changes){
  if(record.type==="attributes"&&record.target.matches?.(SELECTOR))init(record.target);
  for(const element of record.addedNodes)scan(element);
 }
});
observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["title","aria-label","data-tooltip"]});
})();
