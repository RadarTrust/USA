"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const elements = {
    grid: $("credentials-grid"),
    label: $("results-label"),
    total: $("records-total"),
    search: $("search"),
    issuer: $("issuer-filter"),
    type: $("type-filter"),
    sort: $("sort-filter"),
    tabs: $("category-tabs"),
    reset: $("clear-filters"),
    more: $("load-more"),
    empty: $("no-results"),
    dialog: $("credential-dialog"),
    dialogBody: $("dialog-body")
  };
  const categories = ["All","Cybersecurity","AI & Data","Software & Cloud","Engineering","Professional"];
  const acronym = {"Google":"G","IBM":"IBM","Microsoft":"MS","Cisco":"C","InterNACHI":"IN","EC-Council":"EC","Kennesaw State University":"KSU","Pearson / Coursera":"P","Packt / Coursera":"P","SkillUp":"S","University at Buffalo":"UB","L&T EduTech":"L&T"};
  const state = {records:[],category:"All",term:"",issuer:"all",type:"all",sort:"featured",page:1,pageSize:18};

  function node(tag, className, value) {
    const el = document.createElement(tag);
    if(className)el.className=className;
    if(value!==undefined)el.textContent=String(value);
    return el;
  }
  function linkSafe(raw) {
    try {
      const u = new URL(raw);
      return u.protocol === "https:" ? u.href : null;
    } catch {return null}
  }
  function deriveCategory(title) {
    if(/security|ethical hack|cyber|threat|incident|metasploit|penetration|risk|network security|openvas|vulnerab|identity management|defen[sc]/i.test(title))return "Cybersecurity";
    if(/data|analytics|artificial intelligence|generative|prompt|\bAI\b|machine learning|statistic|python|database agent/i.test(title))return "AI & Data";
    if(/developer|engineering|C#|blazor|web development|software|coding|devops|front.end|back.end|full.stack|database integration/i.test(title))return "Software & Cloud";
    if(/inspect|electrical|power systems|fireplace|ladder safety|electricity|home inspector/i.test(title))return "Engineering";
    return "Professional";
  }
  function normalizeArchive(r, i) {
    return {
      id: r.id || "archive-"+i,
      title: String(r.title||"").trim(),
      issuer: String(r.issuer||"Other").trim(),
      category: r.category || deriveCategory(String(r.title||"")),
      type: r.level || "Course completion",
      verificationUrl:linkSafe(r.verificationUrl),
      status:r.status || "Record provided",
      source:"Certificate scan available in public view-only gallery",
      pdfOnline:false,
      pdfPath:"",
      previewPath:typeof r.previewPath==="string" && /^\.\/assets\/previews\/archive-[0-9]+\.webp$/.test(r.previewPath)?r.previewPath:"",
      viewImage:typeof r.viewImage==="string" && /^\.\/assets\/certificates-full\/archive-[0-9]+\.webp$/.test(r.viewImage)?r.viewImage:"",
      featured:r.level==="Program & specialization"
    };
  }
  function normalizeExisting(r, i) {
    return {
      id:r.id||"existing-"+i,
      title:String(r.title||"").trim(),
      issuer:String(r.issuer||"Other").trim(),
      category:deriveCategory(String(r.title||"")),
      type: r.status==="Issuer link"?"Course completion":r.title?.includes("ECSA")?"Professional certification":"Additional professional record",
      verificationUrl:linkSafe(r.url||""),
      status:r.status||"Additional record",
      source:"Previously cataloged professional record",
      pdfOnline:false,
      pdfPath:"",
      previewPath:typeof r.previewPath==="string" && /^\.\/assets\/(featured-certs|previews)\/[a-z0-9_-]+\.webp$/.test(r.previewPath)?r.previewPath:"",
      viewImage:typeof r.viewImage==="string" && /^\.\/assets\/(featured-certs|certificates-full)\/[a-z0-9_-]+\.webp$/.test(r.viewImage)?r.viewImage:"",
      badgeImage:typeof r.badgeImage==="string" && /^\.\/assets\/featured-certs\/[a-z0-9-]+\.webp$/.test(r.badgeImage)?r.badgeImage:"",
      featured:!!r.title?.includes("ECSA")||r.id==="cred-001"
    };
  }
  function unique(records) {
    const out=[], seen=new Set();
    for(const record of records){
      if(!record.title)continue;
      const key=record.verificationUrl && /coursera\.org|credential\.net/.test(record.verificationUrl)
        ? "url:"+record.verificationUrl.toLowerCase().replace(/\/$/,"")
        : "name:"+record.title.toLowerCase().replace(/[^a-z0-9]/g,"")+"|"+record.issuer.toLowerCase().replace(/[^a-z0-9]/g,"");
      if(seen.has(key))continue;
      seen.add(key);
      out.push(record);
    }
    return out;
  }
  function buildFilters(){
    const issuers=[...new Set(state.records.map(r=>r.issuer))].sort((a,b)=>a.localeCompare(b));
    for(const issuer of issuers){const option=node("option","",issuer);option.value=issuer;elements.issuer.append(option)}
    const types=[...new Set(state.records.map(r=>r.type))].sort();
    for(const type of types){const option=node("option","",type);option.value=type;elements.type.append(option)}
    for(const category of categories){
      const count=category==="All"?state.records.length:state.records.filter(r=>r.category===category).length;
      const button=node("button","tab"+(category===state.category?" active":""));
      button.type="button";
      button.setAttribute("aria-pressed",String(category===state.category));
      button.append(document.createTextNode(category),node("span","tab-count",String(count)));
      button.addEventListener("click",()=>{
        state.category=category;state.page=1;
        for(const b of elements.tabs.querySelectorAll("button")){const selected=b===button;b.classList.toggle("active",selected);b.setAttribute("aria-pressed",String(selected))}
        render();
      });
      elements.tabs.append(button);
    }
  }
  function filteredRecords(){
    const q=state.term.toLowerCase();
    const data=state.records.filter(r=>
      (state.category==="All"||r.category===state.category)
      &&(state.issuer==="all"||r.issuer===state.issuer)
      &&(state.type==="all"||r.type===state.type)
      &&(!q||[r.title,r.issuer,r.category,r.type].join(" ").toLowerCase().includes(q))
    );
    if(state.sort==="az")data.sort((a,b)=>a.title.localeCompare(b.title));
    else if(state.sort==="issuer")data.sort((a,b)=>a.issuer.localeCompare(b.issuer)||a.title.localeCompare(b.title));
    else {
      const ranks={"cred-001":10000,"archive-009":9900,"cred-010":9800,"archive-005":9750,"cred-002":9700,"archive-016":9600,"archive-011":9550,"archive-003":9500,"archive-017":9450,"archive-007":9400,"archive-004":9300,"archive-010":9200,"archive-001":9100,"archive-015":9000};
      const score=r=>ranks[r.id]||(r.type==="Professional certification"?8600:/Program & specialization/.test(r.type)?8000:/(Certified|Certification)/i.test(r.title)&&r.viewImage?6800:r.id==="cred-013"?5500:/badge/i.test(r.title)?5000:r.viewImage?3000:1000);
      data.sort((a,b)=>score(b)-score(a)||a.title.localeCompare(b.title));
    }
    return data;
  }
  function issuerMark(name){
    if(name.startsWith("Google"))return "G";
    if(name.startsWith("IBM"))return "IBM";
    if(name.startsWith("Microsoft"))return "MS";
    if(name.startsWith("InterNACHI"))return "IN";
    return acronym[name] || (name.match(/[A-Z]/g)||[]).slice(0,2).join("") || name[0];
  }
  function createCard(r){
    const card=node("article","cred-card");
    if(r.previewPath){
      const preview=node("button","cred-preview");
      preview.type="button";
      preview.setAttribute("aria-label","Preview "+r.title);
      const image=node("img","cred-preview-img");
      image.src=r.previewPath;image.alt="First page preview of "+r.title;
      image.loading="lazy";image.decoding="async";
      image.addEventListener("error",()=>{
        const fallback=node("div","cred-preview-failed",issuerMark(r.issuer));
        preview.replaceChildren(fallback,node("span","preview-label","View certificate ↗"));
      },{once:true});
      preview.append(image,node("span","preview-label","View certificate ↗"));
      preview.addEventListener("click",()=>showDetails(r));
      card.append(preview);
    } else {
      const placeholder=node("div","cred-preview cred-preview-placeholder");
      placeholder.append(node("span","",issuerMark(r.issuer)),node("small","","CREDENTIAL DOCUMENT"));
      card.append(placeholder);
    }
    const top=node("div","cred-top");
    top.append(node("div","cred-mark",issuerMark(r.issuer)));
    if(r.badgeImage){
      const stamp=node("img","credential-badge-icon");
      stamp.src=r.badgeImage;
      stamp.alt=r.issuer+" digital badge artwork";
      stamp.width=48;stamp.height=48;
      stamp.loading="lazy";
      stamp.addEventListener("error",()=>stamp.remove(),{once:true});
      top.append(stamp);
    }
    top.append(node("span","cred-badge"+(!r.verificationUrl?" pending":""),r.verificationUrl?"↗ Issuer link":r.viewImage?"View certificate":"Record only"));
    card.append(top);
    card.append(node("div","cred-issuer",r.issuer.toUpperCase()));
    card.append(node("h3","",r.title));
    card.append(node("p","cred-level",r.type));
    const footer=node("div","cred-footer");
    footer.append(node("span","cred-category",r.category));
    const actionGroup=node("div","cred-actions");
    const button=node("button","cred-open","Details ↗");button.type="button";button.setAttribute("aria-label","Details for "+r.title);button.addEventListener("click",()=>showDetails(r));
    actionGroup.append(button);footer.append(actionGroup);card.append(footer);
    return card;
  }
  function createDetailPair(list,label,value){
    const dt=node("dt","",label),dd=node("dd","",value);
    list.append(dt,dd);
  }
  function showDetails(r){
    elements.dialogBody.replaceChildren();
    const box=node("div","dialog-content");
    box.append(node("div","cred-mark",issuerMark(r.issuer)));
    box.append(node("h2","",r.title));
    const badge=node("span","cred-badge"+(r.verificationUrl?"":" pending"),r.verificationUrl?"Issuer verification link available":r.viewImage?"Original certificate image available":"Document not yet available");
    box.append(badge);
    const dl=node("dl");
    createDetailPair(dl,"Issuing organization",r.issuer);
    createDetailPair(dl,"Area",r.category);
    createDetailPair(dl,"Credential type",r.type);
    createDetailPair(dl,"Source",r.source);
    box.append(dl);
    const actions=node("div","dialog-actions");
    if(r.verificationUrl){
      const a=node("a","button button-lime","Open issuer verification ↗");
      a.href=r.verificationUrl;a.target="_blank";a.rel="noopener noreferrer";
      actions.append(a);
    }
    box.append(actions);
    if(r.viewImage){
      const holder=node("div","certificate-viewer");
      const controls=node("div","viewer-toolbar");
      controls.append(node("span","viewer-hint","Certificate image · Zoom to read"));
      const minus=node("button","viewer-control","−"),reset=node("button","viewer-control","100%"),plus=node("button","viewer-control","+");
      minus.type=reset.type=plus.type="button";
      minus.setAttribute("aria-label","Zoom out");
      plus.setAttribute("aria-label","Zoom in");
      reset.setAttribute("aria-label","Reset zoom");
      controls.append(minus,reset,plus);
      const viewport=node("div","viewer-viewport");
      const img=node("img","viewer-image");
      img.src=r.viewImage;
      img.alt="Full readable certificate: "+r.title;
      img.loading="eager";img.decoding="async";img.draggable=false;
      viewport.append(img);
      holder.append(controls,viewport);
      box.append(holder);
      let zoom=1;
      function applyZoom(next){
        zoom=Math.max(.65,Math.min(3,next));
        img.style.width=Math.round(zoom*100)+"%";
        reset.textContent=Math.round(zoom*100)+"%";
      }
      minus.addEventListener("click",()=>applyZoom(zoom-.25));
      plus.addEventListener("click",()=>applyZoom(zoom+.25));
      reset.addEventListener("click",()=>applyZoom(1));
    }
    box.append(node("p","dialog-footnote",r.verificationUrl?"The issuer maintains the original record. Certificate images are for reading inside this website.":r.viewImage?"The original certificate image is displayed here. No direct issuer verification URL was provided.":"This record has no public scan or direct verification URL yet."));
    elements.dialogBody.append(box);
    if(typeof elements.dialog.showModal==="function")elements.dialog.showModal();
    else elements.dialog.setAttribute("open","");
  }
  function render(){
    const records=filteredRecords();
    const visible=records.slice(0,state.page*state.pageSize);
    const frag=document.createDocumentFragment();
    for(const record of visible)frag.append(createCard(record));
    elements.grid.replaceChildren(frag);
    elements.label.textContent=records.length+" matching "+(records.length===1?"record":"records")+" · Showing "+visible.length;
    elements.empty.hidden=records.length>0;
    elements.more.hidden=visible.length>=records.length;
  }
  function reset(){
    state.term="";state.issuer="all";state.type="all";state.sort="featured";state.category="All";state.page=1;
    elements.search.value="";elements.issuer.value="all";elements.type.value="all";elements.sort.value="featured";
    elements.tabs.querySelectorAll("button").forEach((b,i)=>{b.classList.toggle("active",i===0);b.setAttribute("aria-pressed",String(i===0))});
    render();
  }
  async function load(){
    const sources=await Promise.allSettled([
      fetch("./data/archive-certificates.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("Archive catalog HTTP "+r.status);return r.json()}),
      fetch("./data/credentials.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("Core catalog HTTP "+r.status);return r.json()})
    ]);
    const archive=sources[0].status==="fulfilled" && Array.isArray(sources[0].value)?sources[0].value.map(normalizeArchive):[];
    const original=sources[1].status==="fulfilled" && Array.isArray(sources[1].value)?sources[1].value.map(normalizeExisting):[];
    state.records=unique([...archive,...original]);
    if(!state.records.length){elements.label.textContent="Credential directory is temporarily unavailable. Please try again.";return}
    elements.total.textContent=state.records.length;
    $("metric-credentials").textContent=state.records.length;
    $("metric-issuers").textContent=new Set(state.records.map(x=>x.issuer.replace(/\s*\/.*$/,""))).size;
    $("metric-links").textContent=state.records.filter(x=>x.verificationUrl).length;
    buildFilters();render();
  }
  elements.search.addEventListener("input",e=>{state.term=e.target.value.trim();state.page=1;render()});
  elements.issuer.addEventListener("change",e=>{state.issuer=e.target.value;state.page=1;render()});
  elements.type.addEventListener("change",e=>{state.type=e.target.value;state.page=1;render()});
  elements.sort.addEventListener("change",e=>{state.sort=e.target.value;render()});
  elements.reset.addEventListener("click",reset);
  elements.more.addEventListener("click",()=>{state.page++;render()});
  $("close-dialog").addEventListener("click",()=>elements.dialog.close());
  elements.dialog.addEventListener("click",e=>{if(e.target===elements.dialog)elements.dialog.close()});
  document.addEventListener("keydown",e=>{
    if(e.key==="/"&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){
      e.preventDefault();elements.search.focus();
    }
  });
  const nav=$("main-nav"),menu=$("menu-toggle");
  menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close menu":"Open menu")});
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false")}));
  document.addEventListener("pointerdown",e=>{
    if(nav.classList.contains("open") && !document.getElementById("header").contains(e.target)){
      nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Open menu");
    }
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&nav.classList.contains("open")){
      nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Open menu");menu.focus();
    }
  });
  const toggle=$("theme-toggle");
  try{if(localStorage.getItem("zy-theme")==="dark")document.body.classList.add("theme-dark")}catch{}
  function updateTheme(){toggle.setAttribute("aria-label",document.body.classList.contains("theme-dark")?"Switch to light mode":"Switch to dark mode");$("theme-glyph").textContent=document.body.classList.contains("theme-dark")?"☀":"☾"}
  toggle.addEventListener("click",()=>{document.body.classList.toggle("theme-dark");try{localStorage.setItem("zy-theme",document.body.classList.contains("theme-dark")?"dark":"light")}catch{}updateTheme()});
  updateTheme();
  $("current-year").textContent=new Date().getFullYear();
  if("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");io.unobserve(entry.target)}})},{rootMargin:"0px 0px -45px 0px",threshold:.07});
    document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
  } else document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));
  let raf=false;
  document.addEventListener("scroll",()=>{if(raf)return;raf=true;requestAnimationFrame(()=>{
    const root=document.documentElement,max=root.scrollHeight-root.clientHeight;
    $("reading-progress").style.width=(max?Math.min(100,window.scrollY/max*100):0)+"%";
    $("header").classList.toggle("scrolled",window.scrollY>10);
    raf=false;
  })},{passive:true});

  // On hover, freeze every orbit and present an upright 3x circle.
  // Touch uses tap to expand, tap outside to resume. Keyboard uses Enter/Space/Escape.
  function initSkillOrbitMagnifier(){
    const aside=document.querySelector(".hero-aside");
    const constellation=aside?.querySelector(".skills-constellation");
    if(!aside||!constellation)return;
    let current=null,zoom=null,openedByKeyboard=false;
    const nodes=[...constellation.querySelectorAll(".skill-node")];
    function close(){
      zoom?.remove();
      zoom=null;
      current?.classList.remove("is-zoom-source");
      current=null;
      aside.classList.remove("orbit-hover-freeze");
      openedByKeyboard=false;
    }
    function open(node,byKeyboard=false){
      if(current===node)return;
      close();
      const original=node.querySelector(".skill-pill");
      if(!original)return;
      aside.classList.add("orbit-hover-freeze");
      const r=original.getBoundingClientRect(),a=aside.getBoundingClientRect();
      const diameter=Math.round(r.width*3);
      const label=original.textContent.trim();
      const expanded=document.createElement("div");
      expanded.className="skill-zoom-orb";
      if(node.closest(".skill-track--middle"))expanded.classList.add("zoom-middle");
      if(node.closest(".skill-track--outer"))expanded.classList.add("zoom-outer");
      expanded.setAttribute("role","presentation");
      expanded.setAttribute("aria-hidden","true");
      expanded.style.setProperty("--zoom-x",(r.left+r.width/2-a.left)+"px");
      expanded.style.setProperty("--zoom-y",(r.top+r.height/2-a.top)+"px");
      expanded.style.setProperty("--zoom-diameter",diameter+"px");
      expanded.style.setProperty("--zoom-font",Math.min(25,Math.max(17,diameter*.20))+"px");
      const text=document.createElement("span");
      text.className="skill-zoom-label";
      text.textContent=label;
      const logo=original.querySelector(".neon-skill-icon");
      if(logo){const copy=logo.cloneNode(true);copy.setAttribute("aria-hidden","true");expanded.append(copy);}
      expanded.append(text);
      current=node;
      openedByKeyboard=byKeyboard;
      node.classList.add("is-zoom-source");
      aside.append(expanded);
      zoom=expanded;
      requestAnimationFrame(()=>expanded.classList.add("zoom-visible"));
      expanded.addEventListener("pointerleave",e=>{
        if(e.pointerType!=="touch"&&!openedByKeyboard)close();
      });
      expanded.addEventListener("pointerdown",e=>{
        if(e.pointerType==="touch"){e.preventDefault();close();}
      });
    }
    nodes.forEach(node=>{
      node.tabIndex=0;
      node.setAttribute("role","button");
      node.setAttribute("aria-label","Magnify "+node.textContent.trim()+" skill");
      node.addEventListener("pointerenter",e=>{
        if(e.pointerType==="mouse"||e.pointerType==="pen")open(node);
      });
      node.addEventListener("pointerdown",e=>{
        if(e.pointerType==="touch"){
          e.preventDefault();
          if(current===node)close();else open(node);
        }
      });
      node.addEventListener("keydown",e=>{
        if(e.key==="Escape"){close();return;}
        if(e.key==="Enter"||e.key===" "){
          e.preventDefault();
          if(current===node)close();else open(node,true);
        }
      });
      node.addEventListener("blur",()=>{
        if(current===node&&openedByKeyboard)close();
      });
    });
    aside.addEventListener("pointerleave",e=>{
      if(e.pointerType!=="touch"&&!openedByKeyboard)close();
    });
    document.addEventListener("pointerdown",e=>{
      if(current&&!aside.contains(e.target))close();
    });
    document.addEventListener("keydown",e=>{
      if(e.key==="Escape"&&current)close();
    });
    window.addEventListener("resize",close,{passive:true});
  }
  initSkillOrbitMagnifier();

  load();
})();
