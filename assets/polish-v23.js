/* RadarTrust v23 — read-only display controllers; all network traffic isolated. */
(()=>{
"use strict";
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const counterIDs=["metric-years","metric-credentials","metric-issuers","metric-links"];
const counterGenerations=new Map();
const targetFor=id=>Math.max(0,Math.floor(Number(document.getElementById(id)?.dataset.countTarget)||0));
let metricsVisible=false,cycleTimeout=null,started=false;
const pauseAfterCount=3800;
const cycleLength=6200;
function paint(id,number){
 const label=document.getElementById(id)?.querySelector(".count-value");
 if(label)label.textContent=Math.round(number).toLocaleString("en-US");
}
function invalidate(){
 for(const id of counterIDs)counterGenerations.set(id,(counterGenerations.get(id)||0)+1);
}
function animate(id,target){
 const el=document.getElementById(id);
 if(!el)return;
 const finalValue=Math.max(0,Math.floor(Number(target)||0));
 const generation=(counterGenerations.get(id)||0)+1;
 counterGenerations.set(id,generation);
 const card=el.closest(".metric");
 card?.classList.remove("counted");
 card?.classList.add("is-counting");
 const duration=1600+Math.min(550,finalValue*1.2);
 const startedAt=performance.now();
 const tick=now=>{
  if(counterGenerations.get(id)!==generation)return;
  const progress=Math.min(1,(now-startedAt)/duration);
  const eased=1-Math.pow(1-progress,3.2);
  paint(id,Math.min(finalValue,Math.round(finalValue*eased)));
  if(progress<1)requestAnimationFrame(tick);
  else{
   paint(id,finalValue);
   card?.classList.remove("is-counting");
   card?.classList.add("counted");
  }
 };
 requestAnimationFrame(tick);
}
function stopCycle(){
 if(cycleTimeout!==null){clearTimeout(cycleTimeout);cycleTimeout=null;}
 invalidate();
 for(const id of counterIDs){
  document.getElementById(id)?.closest(".metric")?.classList.remove("is-counting");
 }
 started=false;
}
function cycle(){
 if(!metricsVisible||document.hidden||reduced)return;
 invalidate();
 for(const id of counterIDs){
  const card=document.getElementById(id)?.closest(".metric");
  card?.classList.remove("counted","is-counting");
  paint(id,0);
 }
 for(const id of counterIDs)animate(id,targetFor(id));
 started=true;
 cycleTimeout=setTimeout(cycle,cycleLength);
}
function update(id,value){
 const el=document.getElementById(id);
 if(!el)return;
 const target=Math.max(0,Math.floor(Number(value)||0));
 el.dataset.countTarget=String(target);
 if(reduced){paint(id,target);return;}
 if(metricsVisible&&!document.hidden){
  // If data arrives after the first cycle starts, animate its genuine final total.
  if(target>0&&!started)cycle();
  else if(target>0)animate(id,target);
 }
}
window.RadarCounters={update};
const area=document.querySelector(".hero-metrics");
if(area){
 const resume=()=>{
  metricsVisible=true;
  if(reduced){counterIDs.forEach(id=>paint(id,targetFor(id)));return;}
  if(!document.hidden&&cycleTimeout===null)cycle();
 };
 const suspend=()=>{
  metricsVisible=false;
  stopCycle();
  if(reduced)return;
  counterIDs.forEach(id=>paint(id,targetFor(id)));
 };
 if(!("IntersectionObserver" in window))resume();
 else{
  const io=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting))resume();
   else suspend();
  },{rootMargin:"0px 0px -25px 0px",threshold:.12});
  io.observe(area);
 }
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden)stopCycle();
  else if(metricsVisible)resume();
 });
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


/* v33 — 34 non-descriptive skill routes + contact route; routes aren't security controls. */
(()=>{
 "use strict";
 const contactRoute="#/c/8f2a91";
 const aboutRoute="#/a/6db3e1";
 const surface=document.getElementById("radar-hash-route");
 const frame=document.getElementById("radar-route-frame");
 const close=document.getElementById("radar-route-close");
 const back=surface?.querySelector(".radar-route-back");
 const caption=surface?.querySelector(".radar-route-domain");
 if(!surface||!frame||!close)return;
 const idFor=name=>{
  let h=2166136261;
  for(const c of name){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16).padStart(8,"0").slice(0,6);
 };
 const nodes=[...document.querySelectorAll(".skills-constellation .skill-node[data-skill]")];
 const skillRoutes=new Map(nodes.map(node=>[idFor(node.dataset.skill),node.dataset.skill]));
 function current(){
  if(location.hash===contactRoute)return{src:"./contact.html",title:"Contact Us",kind:"contact"};
  if(location.hash===aboutRoute)return{src:"./about.html",title:"About Zeiad G. Yazaji | RadarTrust",kind:"about"};
  const match=location.hash.match(/^#\/s\/([a-f0-9]{6})$/);
  if(match&&skillRoutes.has(match[1]))return{
   src:"./skills/"+match[1]+".html",
   title:skillRoutes.get(match[1])+" | RadarTrust",
   kind:"skill"
  };
  return null;
 }
 let priorFocus=null;
 let activeKind="";
 function update(){
  const view=current();
  const active=Boolean(view);
  surface.hidden=!active;
  document.body.classList.toggle("radar-route-open",active);
  if(active){
   priorFocus=priorFocus||document.activeElement;
   if(frame.getAttribute("src")!==view.src)frame.setAttribute("src",view.src);
   frame.title=view.title;
   surface.setAttribute("aria-label",view.title);
   document.title=view.title;
   activeKind=view.kind;
   if(caption)caption.textContent=view.kind==="contact"?"RADARTRUST / SECURE CONTACT":view.kind==="about"?"RADARTRUST / ABOUT":"RADARTRUST / EXPERTISE PROFILE";
   if(back)back.href=view.kind==="contact"?"#connect":"#home";
   close.focus({preventScroll:true});
  }else{
   document.title="Zeiad G. Yazaji — Professional Portfolio & Credentials";
   activeKind="";
   if(priorFocus&&document.contains(priorFocus))priorFocus.focus({preventScroll:true});
   priorFocus=null;
  }
 }
 const dismiss=()=>{location.hash=activeKind==="contact"?"#connect":"#home";};
 close.addEventListener("click",dismiss);
 window.addEventListener("hashchange",update);
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&current()){e.preventDefault();dismiss();}
 });
 function openSkill(node){
  if(!node)return;
  location.hash="#/s/"+idFor(node.dataset.skill);
 }
 nodes.forEach(node=>{
  node.setAttribute("aria-label","Open "+node.dataset.skill+" expertise, projects and certificates");
  node.setAttribute("title","Explore "+node.dataset.skill+" expertise");
  node.addEventListener("click",e=>{e.preventDefault();openSkill(node);});
  node.addEventListener("pointerdown",e=>{
   if(e.pointerType==="touch"){e.preventDefault();e.stopImmediatePropagation();openSkill(node);}
  },true);
  node.addEventListener("keydown",e=>{
   if(e.key==="Enter"||e.key===" "){
    e.preventDefault();e.stopImmediatePropagation();openSkill(node);
   }
  },true);
 });
 /* v52: portrait is a link-like target. Hover reveals for two seconds, expands 1.5x, opens About. */
 const portrait=document.querySelector(".hero .hero-aside .portrait-photo");
 if(portrait){
  portrait.classList.add("rt-about-target");
  portrait.setAttribute("role","link");
  portrait.setAttribute("tabindex","0");
  portrait.setAttribute("aria-label","Explore Zeiad G. Yazaji's professional About page");
  portrait.setAttribute("title","About Zeiad — hover to explore or click to open");
  let clearTimer=null,navTimer=null,openStarted=false;
  const clear=()=>{
   if(clearTimer!==null)clearTimeout(clearTimer);
   if(navTimer!==null)clearTimeout(navTimer);
   clearTimer=null;navTimer=null;openStarted=false;
   portrait.classList.remove("rt-peek","rt-expanding");
  };
  const proceed=()=>{
   if(location.hash===aboutRoute)return;
   clear();
   location.hash=aboutRoute;
  };
  const reveal=(immediate=false)=>{
   if(openStarted)return;
   openStarted=true;
   portrait.classList.add("rt-peek");
   const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
   if(reduced){proceed();return;}
   clearTimer=setTimeout(()=>{
    portrait.classList.add("rt-expanding");
    navTimer=setTimeout(proceed,700);
   },immediate?60:2000);
  };
  portrait.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse"||e.pointerType==="pen")reveal();});
  portrait.addEventListener("pointerleave",clear);
  portrait.addEventListener("click",e=>{e.preventDefault();if(!openStarted)reveal(true);else if(!portrait.classList.contains("rt-expanding")){clear();reveal(true);}});
  portrait.addEventListener("keydown",e=>{
   if(e.key==="Enter"||e.key===" "){e.preventDefault();clear();reveal(true);}
   if(e.key==="Escape")clear();
  });
  window.addEventListener("hashchange",clear);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)clear();});
 }
 document.querySelector(".hero-aside")?.addEventListener("click",e=>{
  const zoom=e.target.closest(".skill-zoom-orb");
  if(!zoom)return;
  const source=document.querySelector(".skills-constellation .skill-node.is-zoom-source");
  if(source){e.preventDefault();openSkill(source);}
 });
 update();
})();
