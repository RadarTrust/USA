/* RadarTrust v49: reusable certificate detail viewer for all expertise pages.
 * Public catalog only. No third-party API, secrets, or invented verification links. */
(()=>{
 "use strict";
 const entries=[...document.querySelectorAll(".credentials .credential")];
 if(!entries.length)return;
 const node=(tag,cl,text)=>{
   const e=document.createElement(tag);
   if(cl)e.className=cl;
   if(text!==undefined)e.textContent=String(text);
   return e;
 };
 const escUrl=v=>typeof v==="string" && /^https:\/\//i.test(v)?v:"";
 const pathImage=v=>typeof v==="string" && /^\.\/assets\/[a-z0-9_./-]+$/i.test(v)?"../"+v.slice(2):"";
 let records=[];
 const catalog=Promise.allSettled([
  fetch("../data/credentials.json",{cache:"no-cache"}).then(r=>r.ok?r.json():[]),
  fetch("../data/archive-certificates.json",{cache:"no-cache"}).then(r=>r.ok?r.json():[])
 ]).then(out=>{
  const a=out[0].status==="fulfilled" && Array.isArray(out[0].value)?out[0].value:[];
  const b=out[1].status==="fulfilled" && Array.isArray(out[1].value)?out[1].value:[];
  records=[...a.map(r=>({...r,_kind:"Primary credential",_verify:r.url||r.link||""})),
           ...b.map(r=>({...r,_kind:"Course / program completion",_verify:r.verificationUrl||""}))];
 }).catch(()=>{});
 const normalize=v=>String(v||"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"");
 const dialog=node("dialog","rt-cert-modal");
 dialog.setAttribute("aria-label","Certificate details");
 const head=node("div","rt-cert-head");
 const heading=node("span","", "QUALIFICATION DETAILS");
 const close=node("button","rt-cert-close","✕");close.type="button";close.setAttribute("aria-label","Close certificate details");
 head.append(heading,close);
 const body=node("div","rt-cert-body");
 dialog.append(head,body);document.body.append(dialog);
 close.addEventListener("click",()=>dialog.close());
 dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});
 const row=(term,value)=>{
  const wrapper=node("div","rt-cert-dlrow");
  wrapper.append(node("dt","",term),node("dd","",value||"Not provided"));
  return wrapper;
 };
 async function show(card){
  await catalog;
  body.replaceChildren();
  const title=card.querySelector("h3")?.textContent?.trim()||"Documented certificate";
  const issuer=card.querySelector("small")?.textContent?.trim()||"Issuer not specified";
  const record=records.find(r=>normalize(r.title)===normalize(title) && normalize(r.issuer)===normalize(issuer))||
               records.find(r=>normalize(r.title)===normalize(title));
  const verified=escUrl(record?._verify||"");
  const imgSrc=pathImage(record?.viewImage||"")||card.querySelector("img")?.getAttribute("src")||"";
  body.append(node("h2","rt-cert-title",title));
  body.append(node("p","rt-cert-type",record?._kind||card.querySelector(".type")?.textContent||"Documented credential"));
  const dl=node("dl","rt-cert-data");
  dl.append(row("Issuing organization",record?.issuer||issuer),
            row("Subject area",record?.category||"Related skill"),
            row("Credential type",record?.level||record?.status||record?._kind||"Supporting document"),
            row("Source",record?.source||record?.documentShown||"Published portfolio record"));
  body.append(dl);
  if(record?.detail)body.append(node("p","rt-cert-note",record.detail));
  if(verified){
   const a=node("a","rt-cert-verify","Open original issuer record ↗");
   a.href=verified;a.target="_blank";a.rel="noopener noreferrer";body.append(a);
  }
  if(imgSrc){
   const holder=node("div","rt-cert-imagebox");
   const toolbar=node("div","rt-cert-toolbar");
   toolbar.append(node("span","","Certificate image · Zoom to read"));
   const group=node("div","rt-cert-zoom-controls");
   const minus=node("button","","−"),reset=node("button","","100%"),plus=node("button","","+");
   for(const btn of [minus,reset,plus])btn.type="button";
   minus.setAttribute("aria-label","Zoom out");plus.setAttribute("aria-label","Zoom in");reset.setAttribute("aria-label","Reset zoom");
   group.append(minus,reset,plus);toolbar.append(group);
   const viewport=node("div","rt-cert-viewport");
   const img=node("img","rt-cert-large");
   img.src=imgSrc;img.alt="Certificate document: "+title;img.loading="eager";img.decoding="async";
   viewport.append(img);holder.append(toolbar,viewport);body.append(holder);
   let scale=1;
   const apply=(n)=>{scale=Math.max(.6,Math.min(3,n));img.style.width=Math.round(scale*100)+"%";reset.textContent=Math.round(scale*100)+"%";};
   minus.addEventListener("click",()=>apply(scale-.25));
   plus.addEventListener("click",()=>apply(scale+.25));
   reset.addEventListener("click",()=>apply(1));
   img.addEventListener("error",()=>{
     viewport.replaceChildren(node("p","rt-cert-note","The original image is unavailable. Use the issuer link if provided."));
   });
  }
  body.append(node("p","rt-cert-note",verified?
    "The certificate image is shown for reference. Verification and standing are determined by the issuing organization.":
    "No direct public issuer verification URL is supplied for this record; the portfolio displays the available supporting document."));
  if(typeof dialog.showModal==="function")dialog.showModal();
  else dialog.setAttribute("open","");
 }
 for(const card of entries){
  card.setAttribute("tabindex","0");card.setAttribute("role","button");
  card.setAttribute("aria-label","View certificate details and document: "+(card.querySelector("h3")?.textContent||"certificate"));
  card.classList.add("rt-cert-interactive");
  card.addEventListener("click",event=>{event.preventDefault();show(card);});
  card.addEventListener("keydown",event=>{
   if(event.key==="Enter"||event.key===" "){event.preventDefault();show(card);}
  });
 }
})();
