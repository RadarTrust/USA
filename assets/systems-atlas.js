"use strict";
(()=>{
const mount=document.getElementById("rt-atlas-mount");if(!mount)return;
const shapes={
network:'<circle class="node" cx="140" cy="100" r="24"/><circle class="node" cx="55" cy="40" r="14"/><circle class="node" cx="225" cy="40" r="14"/><circle class="node" cx="55" cy="160" r="14"/><circle class="node" cx="225" cy="160" r="14"/><path class="signal" d="M69 50 118 85M211 50 162 85M69 150 118 115M211 150 162 115"/><path d="M130 100h20m-10-10v20"/>',
security:'<path d="M140 18 220 48v51c0 55-31 83-80 106-49-23-80-51-80-106V48z"/><path class="accent" d="m106 104 24 25 47-50"/><path class="signal" d="M140 38v19m-57 43h21m94 0h-21"/>',
cloud:'<path d="M77 150c-28 0-45-16-45-39 0-21 16-38 37-40 9-34 38-51 70-44 26 5 42 23 47 43 34-2 60 16 60 41 0 24-18 39-44 39z"/><rect class="node" x="112" y="97" width="56" height="35" rx="7"/><path class="accent" d="M140 132v29m-30 0h60m-30-64v-17"/>',
automation:'<rect class="node" x="24" y="79" width="52" height="50" rx="9"/><rect class="node" x="114" y="79" width="52" height="50" rx="9"/><rect class="node" x="204" y="79" width="52" height="50" rx="9"/><path class="signal" d="M76 104h38m52 0h38"/><path d="m100 95 14 9-14 9m90-18 14 9-14 9"/><circle cx="50" cy="104" r="9"/><path d="m133 104 7 7 12-15m67 8h20"/>',
data:'<path d="M35 176h210"/><rect class="node" x="50" y="118" width="32" height="58" rx="5"/><rect class="node" x="99" y="83" width="32" height="93" rx="5"/><rect class="node" x="148" y="100" width="32" height="76" rx="5"/><rect class="node" x="197" y="48" width="32" height="128" rx="5"/><path class="accent" d="m55 78 60-33 48 15 50-35"/>',
radar:'<circle cx="140" cy="105" r="87"/><circle cx="140" cy="105" r="61"/><circle cx="140" cy="105" r="34"/><path d="M140 18v174M53 105h174"/><path class="accent" d="m140 105 59-63"/><circle class="node" cx="182" cy="61" r="7"/><circle cx="140" cy="105" r="5" fill="#237c72"/>'
};
const data=[
{title:"Enterprise Networks",category:"systems",desc:"Topology, routing and resilient connectivity.",detail:"Network segmentation, enterprise switching, connectivity planning and infrastructure reliability.",shape:"network"},
{title:"Cybersecurity Architecture",category:"security",desc:"Layered controls and secure system boundaries.",detail:"Security assessment, defensive architecture, access control, risk evaluation and response readiness.",shape:"security"},
{title:"Cloud & Data Centers",category:"systems",desc:"Modular infrastructure built for scale.",detail:"Compute, storage, networking, systems integration and operational resilience in complex environments.",shape:"cloud"},
{title:"Industrial Automation",category:"engineering",desc:"Connected control systems and workflows.",detail:"Electrical and electronics engineering, industrial control, monitoring, integration and automation.",shape:"automation"},
{title:"Software & AI",category:"engineering",desc:"From information to intelligent applications.",detail:"Full-stack development, Python, data workflows, automation and applied AI solutions.",shape:"data"},
{title:"Threat Monitoring",category:"security",desc:"Observability and detection-oriented thinking.",detail:"Traffic analysis, monitoring, security signals and incident investigation methodologies.",shape:"radar"}
];
const section=document.createElement("section");section.className="rt-atlas";section.id="systems-atlas";section.setAttribute("aria-labelledby","rt-atlas-title");
section.innerHTML='<div class="container"><div class="rt-atlas-top"><div><span class="rt-atlas-eyebrow">04 / INTERACTIVE SYSTEMS ATLAS</span><h2 id="rt-atlas-title">Explore the engineering.</h2><p class="rt-atlas-lead">A visual map of the disciplines behind RadarTrust. Select a field and inspect the concepts that connect security, infrastructure and software.</p></div><span class="rt-atlas-count" id="rt-atlas-count" aria-live="polite"></span></div><div class="rt-atlas-tabs" role="group" aria-label="Filter engineering disciplines"></div><div class="rt-atlas-grid"></div><p class="rt-atlas-note">Original schematic illustrations. Conceptual visuals are not representations of customer deployments.</p></div>';
mount.replaceWith(section);
const grid=section.querySelector(".rt-atlas-grid");const tabs=section.querySelector(".rt-atlas-tabs");const count=section.querySelector("#rt-atlas-count");
const filters=[["all","All"],["systems","Infrastructure"],["security","Security"],["engineering","Engineering & AI"]];
const cards=[];
for(const x of data){
const article=document.createElement("article");article.className="rt-atlas-card";article.dataset.category=x.category;
const visual=document.createElement("div");visual.className="rt-atlas-visual";visual.innerHTML='<svg viewBox="0 0 280 210" role="img" aria-label="'+x.title+' conceptual diagram">'+shapes[x.shape]+'</svg>';
const copy=document.createElement("div");copy.className="rt-atlas-copy";
const label=document.createElement("span");label.className="rt-atlas-category";label.textContent=x.category;
const h=document.createElement("h3");h.textContent=x.title;
const p=document.createElement("p");p.textContent=x.desc;
const button=document.createElement("button");button.type="button";button.className="rt-atlas-detail";button.setAttribute("aria-expanded","false");button.textContent="Explore concept";
const detail=document.createElement("div");detail.className="rt-atlas-expanded";detail.hidden=true;detail.textContent=x.detail;
button.addEventListener("click",()=>{const open=button.getAttribute("aria-expanded")==="true";button.setAttribute("aria-expanded",String(!open));button.textContent=open?"Explore concept":"Close details";detail.hidden=open});
copy.append(label,h,p,button,detail);article.append(visual,copy);grid.append(article);cards.push(article);
}
for(const [id,title] of filters){const b=document.createElement("button");b.className="rt-atlas-tab";b.type="button";b.dataset.filter=id;b.textContent=title;b.setAttribute("aria-pressed",String(id==="all"));b.addEventListener("click",()=>{tabs.querySelectorAll("button").forEach(v=>v.setAttribute("aria-pressed",String(v===b)));let visible=0;for(const c of cards){c.hidden=id!=="all"&&c.dataset.category!==id;if(!c.hidden)visible++}count.textContent=visible+" / "+cards.length+" fields"});tabs.append(b)}
count.textContent=cards.length+" / "+cards.length+" fields";
})();