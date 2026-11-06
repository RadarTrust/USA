(()=>{
"use strict";
const $=id=>document.getElementById(id);
const cards=$("cards"),status=$("status"),dialog=$("detail"),detail=$("detail-body");
const type=$("type-filter"),subject=$("subject-filter"),sort=$("sort"),search=$("search");
let records=[];
const clean=(v,max=1000)=>String(v??"").trim().slice(0,max);
const norm=v=>clean(v,5000).toLocaleLowerCase("en-US");
const yearOf=v=>{const n=Number(v);return Number.isInteger(n)&&n>=1800&&n<=2200?n:0};
const safeLink=v=>{try{const u=new URL(clean(v));return u.protocol==="https:"&&!u.username&&!u.password?u.href:""}catch{return ""}};
const safeAsset=v=>{const s=clean(v,180);return /^(?:\.\/)?(?:books|projects)\/(?:covers|evidence|images)\/[a-z0-9][a-z0-9_-]*\.(?:webp|png|jpe?g|svg)$/i.test(s)?s.replace(/^\.\//,""):null};
const node=(tag,cl,txt)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=String(txt);return x};
const rkey=r=>"rt-work-rating-v1:"+r.type+":"+r.id;
const rating=r=>{try{const n=Number(localStorage.getItem(rkey(r)));return Number.isInteger(n)&&n>=1&&n<=5?n:5}catch{return 5}};
const saveRating=(r,n)=>{try{localStorage.setItem(rkey(r),String(n))}catch{}};
const field=(dl,name,value)=>{if(!clean(value))return;const x=node("div","field");x.append(node("dt","",name),node("dd","",value));dl.append(x)};
const anchor=(value,label)=>{const url=safeLink(value);if(!url)return null;const a=node("a","",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a};
function parseRecord(raw,kind){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const title=clean(raw.title,180),id=clean(raw.id,80);
 if(!title||!/^[a-z0-9][a-z0-9_-]*$/i.test(id))return null;
 return {id,type:kind,title,year:yearOf(raw.year),subject:clean(raw.subject,100)||"Uncategorized",
 summary:clean(raw.summary,1800),author:clean(raw.author,160),publisher:clean(raw.publisher,160),
 accreditingBody:clean(raw.accreditingBody,160),accreditationDetails:clean(raw.accreditationDetails,1000),
 organization:clean(raw.organization,160),client:clean(raw.client,160),role:clean(raw.role,140),
 technologies:Array.isArray(raw.technologies)?raw.technologies.slice(0,25).map(v=>clean(v,50)):[],
 isbn:clean(raw.isbn,40),doi:clean(raw.doi,120),language:clean(raw.language,50),status:clean(raw.status,100),
 cover:safeAsset(raw.cover),evidenceImage:safeAsset(raw.evidenceImage),
 publicationUrl:safeLink(raw.publicationUrl),verificationUrl:safeLink(raw.verificationUrl),projectUrl:safeLink(raw.projectUrl)};
}
function stars(r){
 const wrap=node("div","rating"),group=node("span","stars"),value=rating(r);
 group.setAttribute("role","group");group.setAttribute("aria-label","My personal rating for "+r.title);
 for(let n=1;n<=5;n++){const b=node("button","star"+(n<=value?" on":""),"★");b.type="button";b.setAttribute("aria-label","Rate "+n+" of 5 stars");b.setAttribute("aria-pressed",String(n===value));b.addEventListener("click",()=>{saveRating(r,n);render();if(dialog.open)openDetail(r)});group.append(b)}
 wrap.append(group,node("small","","My rating: "+value+"/5"+(value===5?" (default 5)":" (saved on this device)")));return wrap;
}
function card(r){
 const a=node("article","work-card"),cover=node("div","work-cover");
 if(r.cover){const img=node("img");img.src="./"+r.cover;img.alt="Cover of "+r.title;img.loading="lazy";cover.append(img)}
 else{const pl=node("div","placeholder");pl.append(node("b","",r.type==="book"?"▤":"⬡"),node("span","",r.type==="book"?"PUBLICATION":"PROJECT"));cover.append(pl)}
 const body=node("div","work-card-body");
 body.append(node("span","tag",r.type==="book"?"Book / publication":"Engineering / software project"));
 body.append(node("h3","",r.title),node("p","work-meta",[r.author||r.organization||r.role,r.subject,r.year||""].filter(Boolean).join(" · ")));
 body.append(node("p","work-desc",r.summary?(r.summary.length>230?r.summary.slice(0,227)+"…":r.summary):"Open details for authorship, accreditation and evidence."));
 body.append(stars(r));
 const btn=node("button","work-action","Explore work →");btn.type="button";btn.addEventListener("click",()=>openDetail(r));body.append(btn);
 a.append(cover,body);return a;
}
function openDetail(r){
 detail.replaceChildren();
 detail.append(node("span","tag",r.type==="book"?"Book / publication":"Project"));
 const h=node("h2","detail-title",r.title);h.id="detail-title";detail.append(h);
 if(r.cover){const img=node("img","detail-cover");img.src="./"+r.cover;img.alt="Cover of "+r.title;detail.append(img)}
 detail.append(stars(r));const dl=node("dl","fields");
 for(const [label,value] of [["Subject",r.subject],["Year",r.year],["Author",r.author],["Publisher",r.publisher],["Accrediting organization",r.accreditingBody],["Accreditation details",r.accreditationDetails],["Organization",r.organization],["Client",r.client],["Role / contribution",r.role],["Technologies",r.technologies.join(", ")],["ISBN",r.isbn],["DOI",r.doi],["Language",r.language],["Status",r.status]])field(dl,label,value);
 detail.append(dl);
 if(r.summary)detail.append(node("h3","","Description"),node("p","detail-paragraph",r.summary));
 const evidence=node("div","evidence");
 for(const [v,label] of [[r.publicationUrl,"View publication ↗"],[r.projectUrl,"View project ↗"],[r.verificationUrl,"Official evidence ↗"]]){const a=anchor(v,label);if(a)evidence.append(a)}
 if(r.evidenceImage){const img=node("img");img.src="./"+r.evidenceImage;img.alt="Evidence image for "+r.title;evidence.append(img)}
 if(evidence.childNodes.length)detail.append(node("h3","","Links & evidence"),evidence);
 if(!r.accreditingBody&&!r.verificationUrl)detail.append(node("p","detail-paragraph","No third-party accreditation has been supplied for this work."));
 if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute("open","")}
}
function render(){
 const q=norm(search.value),t=type.value,s=subject.value;
 const data=records.filter(r=>(t==="all"||r.type===t)&&(s==="all"||r.subject===s)&&(!q||norm([r.title,r.subject,r.summary,r.author,r.publisher,r.accreditingBody,r.organization,r.client,r.role,r.technologies.join(" "),r.isbn,r.doi].join(" ")).includes(q)));
 const mode=sort.value;data.sort((a,b)=>mode==="title"?a.title.localeCompare(b.title):mode==="rating"?rating(b)-rating(a)||a.title.localeCompare(b.title):mode==="oldest"?(a.year||9999)-(b.year||9999)||a.title.localeCompare(b.title):b.year-a.year||a.title.localeCompare(b.title));
 cards.replaceChildren();for(const r of data)cards.append(card(r));
 if(!data.length){const empty=node("div","empty");empty.append(node("strong","",records.length?"No works match these filters.":"The collection is ready for your first work."),node("p","",records.length?"Try changing the search or filters.":"Add a book or project to its catalog; it will appear here automatically with a default 5-star personal rating."));cards.append(empty)}
 status.textContent=records.length?"Showing "+data.length+" of "+records.length+" works":"No publications or projects have been entered yet.";
 document.querySelectorAll(".chip").forEach(b=>{const selected=b.dataset.type===t;b.classList.toggle("selected",selected);b.setAttribute("aria-pressed",String(selected))});
}
async function init(){
 const files=[["book","./books/catalog.json"],["project","./projects/catalog.json"]];
 const loaded=await Promise.allSettled(files.map(([_,url])=>fetch(url,{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("Catalog unavailable");return r.json()})));
 const failures=[],all=[],ids=new Set();
 for(let i=0;i<loaded.length;i++){
  const v=loaded[i];if(v.status!=="fulfilled"||!Array.isArray(v.value)){failures.push(files[i][0]);continue}
  for(const raw of v.value){const r=parseRecord(raw,files[i][0]);if(!r||ids.has(r.type+":"+r.id))continue;ids.add(r.type+":"+r.id);all.push(r)}
 }
 records=all;$("total-count").textContent=all.length;$("book-count").textContent=all.filter(x=>x.type==="book").length;$("project-count").textContent=all.filter(x=>x.type==="project").length;
 for(const name of [...new Set(all.map(x=>x.subject))].sort()){const option=node("option","",name);option.value=name;subject.append(option)}
 for(const input of [type,subject,sort,search])input.addEventListener(input===search?"input":"change",render);
 for(const chip of document.querySelectorAll(".chip"))chip.addEventListener("click",()=>{type.value=chip.dataset.type;render()});
 $("close-detail").addEventListener("click",()=>dialog.close());dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
 render();if(failures.length)status.textContent="Some catalogs failed to load: "+failures.join(", ")+".";
}
init().catch(()=>{status.textContent="Unable to load this library. Refresh the page.";});
})();