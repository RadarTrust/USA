/* RadarTrust v23 — read-only display controllers; all network traffic isolated. */
(()=>{
"use strict";
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const counterIDs=["metric-years","metric-credentials","metric-issuers","metric-links"];
let metricsVisible=false;
let alreadyAnimated=new Set();
const counterGenerations=new Map();
const targetFor=id=>Math.max(0,Math.floor(Number(document.getElementById(id)?.dataset.countTarget)||0));
function paint(id,number){
 const el=document.getElementById(id);
 if(!el)return;
 const label=el.querySelector(".count-value");
 if(label)label.textContent=Math.round(number).toLocaleString("en-US");
}
function animate(id,value){
 const el=document.getElementById(id);
 if(!el)return;
 const target=Math.max(0,Math.floor(Number(value)||0));
 if(reduced){paint(id,target);el.closest(".metric")?.classList.add("counted");alreadyAnimated.add(id);return;}
 const generation=(counterGenerations.get(id)||0)+1;
 counterGenerations.set(id,generation);
 const started=performance.now(),length=1550+(Math.min(500,target)*1.4);
 const card=el.closest(".metric");
 card?.classList.add("is-counting");
 const step=(now)=>{
   if(counterGenerations.get(id)!==generation)return;
   const progress=Math.min(1,(now-started)/length);
   const eased=1-Math.pow(1-progress,3.4);
   const jitter=progress<.7?Math.round(Math.sin(progress*66)*Math.min(2,target*.04)*(1-progress)):0;
   paint(id,Math.max(0,Math.min(target,Math.round(target*eased+jitter))));
   if(progress<1)requestAnimationFrame(step);
   else{paint(id,target);card?.classList.remove("is-counting");card?.classList.add("counted");alreadyAnimated.add(id);}
 };
 requestAnimationFrame(step);
}
function update(id,value){
 const el=document.getElementById(id);
 if(!el)return;
 const target=Math.max(0,Math.floor(Number(value)||0));
 el.dataset.countTarget=String(target);
 if(metricsVisible && target>0 && !alreadyAnimated.has(id))animate(id,target);
 else if(metricsVisible && alreadyAnimated.has(id))paint(id,target);
}
window.RadarCounters={update};
const area=document.querySelector(".hero-metrics");
if(area){
 const visible=()=>{if(metricsVisible)return;metricsVisible=true;counterIDs.forEach(id=>{const n=targetFor(id);if(n>0 || id==="metric-years")animate(id,n);});};
 if(!("IntersectionObserver" in window)){visible();}
 else{
  const io=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){io.disconnect();visible();}},{rootMargin:"0px 0px -25px 0px",threshold:.15});
  io.observe(area);
 }
}

/* A freely hosted, shared, third-party page-view badge. Counts requests, not verified unique humans.
   If the independent service fails, never fabricate a number. */
const badge=document.getElementById("visitor-counter-badge");
if(badge){
 const status=document.getElementById("visitor-counter-status");
 badge.addEventListener("load",()=>{if(status)status.textContent="";});
 badge.addEventListener("error",()=>{badge.hidden=true;if(status)status.textContent="Counter temporarily unavailable";});
 const q=new URLSearchParams({
   page_id:"RadarTrust-USA-Portfolio",
   namespace:"radartrust",
   left_text:"visits",
   left_color:"083e39",
   right_color:"1c987a",
   t:String(Date.now())
 });
 badge.src="https://visitor-badge.one9x.com/badge?"+q.toString();
}

/* Contact delivery requires a recipient-verified provider access key; never expose the destination. */
})();

