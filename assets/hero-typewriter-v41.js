/* RadarTrust v41 | Accessible, one-shot, keyboard-style introduction. */
(()=>{
 "use strict";
 const intro=document.querySelector(".hero-copy.rt-typewriter");
 if(!intro)return;
 const original=intro.innerHTML;
 const noMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(noMotion){intro.classList.add("rt-finished");return;}
 const source=intro.cloneNode(true);
 const queue=[];
 const collect=(node,target)=>{
  for(const child of node.childNodes){
   if(child.nodeType===Node.TEXT_NODE){
    const write=document.createTextNode("");
    target.appendChild(write);
    for(const character of Array.from(child.textContent||""))queue.push({write,character});
   }else if(child.nodeType===Node.ELEMENT_NODE){
    const element=child.cloneNode(false);
    target.appendChild(element);
    collect(child,element);
   }
  }
 };
 intro.replaceChildren();
 collect(source,intro);
 if(!queue.length){intro.innerHTML=original;return;}
 intro.classList.add("rt-writing");
 let position=0,previous=0;
 const finish=()=>{
  intro.innerHTML=original;
  intro.classList.remove("rt-writing");
  intro.classList.add("rt-finished");
 };
 const step=(time)=>{
  if(document.hidden){finish();return;}
  if(!previous)previous=time;
  const elapsed=time-previous;
  if(elapsed>=21){
   const count=Math.max(1,Math.min(4,Math.floor(elapsed/21)));
   for(let n=0;n<count&&position<queue.length;n++){
    const {write,character}=queue[position++];
    write.textContent+=character;
   }
   previous=time;
  }
  if(position<queue.length)requestAnimationFrame(step);
  else finish();
 };
 setTimeout(()=>{
  if(document.hidden){finish();return;}
  intro.style.visibility="visible";
  requestAnimationFrame(step);
 },280);
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&intro.classList.contains("rt-writing"))finish();
 },{once:true});
})();
