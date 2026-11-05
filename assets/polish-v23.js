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

/* Same original independent visit counter; hidden badge records the page view.
   /count?read=true exposes the actual stored integer; no invented display totals. */
const badge=document.getElementById("visitor-counter-badge");
const odo=document.getElementById("odometer-machine");
const digits=[...document.querySelectorAll("#odometer-digits .odo-digit")];
const countStatus=document.getElementById("visitor-counter-status");
if(badge && odo && digits.length===7){
 const page_id="RadarTrust-USA-Portfolio",namespace="radartrust";
 const params=new URLSearchParams({page_id,namespace});
 const base="https://visitor-badge.one9x.com";
 const readURL=base+"/count?"+params+"&read=true&_="+Date.now();
 const showStatus=(message)=>{if(countStatus)countStatus.textContent=message;};
 function draw(number){
  const n=Math.max(0,Math.floor(number));
  const visual=String(n).padStart(7,"0").slice(-7);
  let current=digits.map(x=>x.textContent).join("");
  // Cascade like seven individual mechanical number reels.
  let step=0;
  for(let idx=0;idx<digits.length;idx++){
   const digit=digits[idx];
   if(digit.textContent===visual[idx])continue;
   const old=Number(digit.textContent);
   const next=Number(visual[idx]);
   const transitions=Number.isInteger(old)?Math.min(8,((next-old+10)%10)||10):Math.min(7,next+1);
   const delay=(digits.length-idx-1)*105;
   const from=Number.isInteger(old)?old:0;
   for(let k=1;k<=transitions;k++){
    const result=k===transitions?next:(from+k)%10;
    window.setTimeout(()=>{digit.textContent=String(result);digit.classList.remove("flip");void digit.offsetWidth;digit.classList.add("flip");},delay+(k-1)*65);
   }
   step=Math.max(step,delay+transitions*65);
  }
  odo.setAttribute("aria-label",n.toLocaleString("en-US")+" recorded page views");
  if(n>9999999)showStatus("Displaying the last seven digits of the total.");
  else showStatus("Recorded page views · independent counter");
 }
 async function readCounter(){
  const options={cache:"no-store",headers:{Accept:"application/json"}};
  const urls=[readURL,"https://proxy.cors.dev/"+readURL];
  for(const url of urls){
   try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),6500);
    let response;
    try{response=await fetch(url,{...options,signal:controller.signal})}
    finally{clearTimeout(timer)}
    if(!response.ok)continue;
    const data=await response.json();
    const value=Number(data?.value);
    if(!Number.isSafeInteger(value)||value<0)continue;
    draw(value);return;
   }catch(e){/* Retry read-only request from public CORS relay. */}
  }
  showStatus("Live visit total temporarily unavailable");
  odo.setAttribute("aria-label","Live visit total temporarily unavailable");
 }
 badge.onload=()=>{readCounter()};
 badge.onerror=()=>{showStatus("Visit tracking offline; fetching last recorded total");readCounter()};
 const badgeParams=new URLSearchParams({page_id,namespace,left_text:"visits",left_color:"083e39",right_color:"1c987a",t:String(Date.now())});
 badge.src=base+"/badge?"+badgeParams;
 // Do not increment again during fallback: badges record once; count endpoint is read-only.
}

/* Contact delivery requires a recipient-verified provider access key; never expose the destination. */
})();

