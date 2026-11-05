/* RadarTrust v57 — deterministic one-shot typewriter with guaranteed completion.
   Finishes in <= 3.4 s even when rendering is slow. Keeps semantic bold nodes. */
(()=>{
"use strict";
const intro=document.querySelector(".hero-copy.rt-typewriter");
if(!intro)return;
const original=intro.innerHTML;
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduced){intro.classList.add("rt-finished");return;}
const source=intro.cloneNode(true),queue=[];
function collect(node,parent){
 for(const child of node.childNodes){
  if(child.nodeType===Node.TEXT_NODE){
   const dest=document.createTextNode("");
   parent.appendChild(dest);
   for(const char of Array.from(child.textContent||""))queue.push({dest,char});
  }else if(child.nodeType===Node.ELEMENT_NODE){
   const dest=child.cloneNode(false);
   parent.appendChild(dest);
   collect(child,dest);
  }
 }
}
intro.replaceChildren();
collect(source,intro);
if(!queue.length){intro.innerHTML=original;intro.classList.add("rt-finished");return;}
intro.classList.add("rt-writing");
intro.style.visibility="visible";
let index=0,finished=false;
const duration=2600;
const started=performance.now();
let guarantee=null;
function finish(){
 if(finished)return;
 finished=true;
 if(guarantee!==null)clearTimeout(guarantee);
 intro.innerHTML=original;
 intro.classList.remove("rt-writing");
 intro.classList.add("rt-finished");
 intro.style.visibility="visible";
}
function tick(now){
 if(finished)return;
 if(document.hidden){finish();return;}
 const progress=Math.min(1,Math.max(0,(now-started)/duration));
 const target=Math.min(queue.length,Math.ceil(queue.length*progress));
 while(index<target){
  const {dest,char}=queue[index++];
  dest.textContent+=char;
 }
 if(progress>=1||index>=queue.length)finish();
 else requestAnimationFrame(tick);
}
guarantee=setTimeout(finish,3400);
requestAnimationFrame(tick);
document.addEventListener("visibilitychange",()=>{if(document.hidden)finish();},{once:true});
})();
