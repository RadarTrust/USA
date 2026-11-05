/* RadarTrust Guide v34 — local, source-grounded assistant. No paid AI endpoints, no prompt upload. */
(async()=>{
"use strict";
const host=document.body;
let markup="";
try{
 const response=await fetch("./assets/guide-v34.html",{cache:"no-cache"});
 if(!response.ok)throw new Error("UI template unavailable");
 markup=await response.text();
}catch(_){return;}
const parsed=new DOMParser().parseFromString(markup,"text/html");
for(const el of [...parsed.body.children])host.append(document.importNode(el,true));
const $=id=>document.getElementById(id);
const launch=$("rt-guide-launch"),panel=$("rt-guide"),log=$("rt-guide-messages"),
      query=$("rt-guide-query"),status=$("rt-guide-status"),mic=$("rt-guide-mic"),
      sound=$("rt-guide-sound"),close=$("rt-guide-close");
let speaking=true,recognition=null,utterance=null,voices=[];
const skillNodes=[...document.querySelectorAll(".skills-constellation [data-skill]")];
const skills=skillNodes.map(node=>node.dataset.skill);
const getId=name=>{let value=2166136261;for(const ch of name){value^=ch.charCodeAt(0);value=Math.imul(value,16777619);}return(value>>>0).toString(16).padStart(8,"0").slice(0,6)};
const normalize=text=>String(text||"").toLowerCase().normalize("NFKD").replace(/[\u064b-\u065f]/g,"").replace(/[^\p{L}\p{N}+#]+/gu," ").trim();
const arabic=text=>/[\u0600-\u06ff]/.test(text);
const dictionary=[
 {name:"Cybersecurity",aliases:["cyber security","information security","امن سيبراني","الامن السيبراني","امن المعلومات","اختراق","اختبار الاختراق"]},
 {name:"AI",aliases:["artificial intelligence","ذكاء اصطناعي","الذكاء الاصطناعي","ال ai","machine learning"]},
 {name:"ERP",aliases:["enterprise resource planning","نظام موارد","نظام ادارة","برامج المحاسبة","erp"]},
 {name:"Control Panels",aliases:["control panels","control panel","electrical panels","لوحات التحكم","اللوحات الكهربائية","scada","سكادا","بي ال سي"]},
 {name:"Full Stack",aliases:["fullstack","web developer","برمجة ويب","تطوير المواقع","فل ستاك"]},
 {name:"Data Center",aliases:["data centers","data center","مركز بيانات","مراكز البيانات","سيرفر روم"]},
 {name:"Networking",aliases:["network","networks","شبكات","الشبكات","شبكة"]},
 {name:"Data Analysis",aliases:["data analytics","data analysis","تحليل البيانات","بيانات"]},
 {name:"Project",aliases:["project management","projects","المشاريع","ادارة المشاريع"]},
 {name:"Python",aliases:["بايثون","python"]},
 {name:"Ethical Hacking",aliases:["ethical hacking","penetration testing","هاكر اخلاقي","الاختراق الاخلاقي"]},
 {name:"SQL",aliases:["sql database","قاعدة بيانات","قواعد البيانات"]},
 {name:"Servers",aliases:["servers","server","سيرفرات","خوادم"]},
 {name:"Maintenance",aliases:["maintenance","صيانة"]},
 {name:"SI",aliases:["system integration","تكامل الانظمة"]}
];
const projects=[
 {key:"ues",match:["ppl","united electric","panel","scada","control","ues","لوحات","سكادا","كهرباء"],heading:"U.S. electrical and enterprise systems",body:"At United Electric System in Pennsylvania (2025–May 2026), Zeiad contributed to internal ERP and bill-of-material workflows and supported PPL-related electrical control panels, SCADA, wiring, troubleshooting, testing and commissioning."},
 {key:"samsung",match:["samsung","cosmos","transtek","سامسونج"],heading:"Samsung HVA · Global IT and ERP",body:"As Global IT & Programming Manager at Samsung HVA (2007–2010), Zeiad managed multi-branch IT systems and Cosmos / Transtek ERP workflows, covering programming, documentation, implementation support and user training."},
 {key:"ng",match:["new generation","data center","server","ups","مركز بيانات","مراكز البيانات","سيرفر","مدير تقنية"],heading:"Enterprise IT, cybersecurity and data centers",body:"At New Generation Group Offshore (2020–2023), Zeiad led enterprise IT, cybersecurity, ERP, database and infrastructure activities, including server and UPS-supported data-center deployments."},
 {key:"industrial",match:["siemens","s7","industrial","khayyat","infinite","مصانع","صناعي","وقود"],heading:"Industrial SCADA automation",body:"Earlier IT project management roles involved Siemens S7-400 SCADA applications and automation for industrial facilities, fuel stations and steel plants."},
 {key:"surveillance",match:["cctv","camera","surveillance","nvr","vms","كاميرات","مراقبة"],heading:"Integrated physical-security projects",body:"At Alyeser and Kabour, Zeiad worked on surveillance, CCTV, NVR, VMS, alarm and IT infrastructure projects, with implementation and team-support responsibilities."}
];
const faq=[
 {keys:["who","about zeiad","about you","experience","background","career","tell me about","من هو","من انت","خبرة","خبرات","السيرة","عرفني"],answer:"Zeiad G. Yazaji is an electronics and communications engineering professional with over 20 years of experience across enterprise IT leadership, software, ERP, databases, networking, cybersecurity, SCADA, data centers and technology training. His work spans the United States and the Middle East.",source:[["Professional portfolio","#about"],["Credentials","#credentials"]]},
 {keys:["contact","email","reach","hire","collaborate","تواصل","اتواصل","الايميل","البريد","التوظيف","استشاره"],answer:"You can reach Zeiad through the secure Contact Us form on RadarTrust. The website does not expose his private receiving email address.",source:[["Contact form","#/c/8f2a91"]]},
 {keys:["languages","programming","code","coding","javascript","python","c#","vb.net","برمجة","لغات البرمجة","مطور"],answer:"The portfolio documents experience in Python, C#, VB.NET and enterprise systems, and showcases front-end HTML, CSS and JavaScript work. Microsoft Full-Stack Developer and Microsoft Python Development course/program certificates are also listed. A course completion does not automatically constitute a vendor professional certification.",source:[["Full Stack","#/s/"+getId("Full Stack")],["Python","#/s/"+getId("Python")]]},
 {keys:["training","trainer","teach","education","تدريب","دورات","مدرب","تعليم"],answer:"In addition to engineering and technology leadership roles, Zeiad has worked as a technical trainer in programming, information technology, automation and AI/prompt-engineering workflows. Specific certificate types and issuer links are shown in the credential directory.",source:[["Career profile","#about"],["Credential directory","#credentials"]]}
];
let core=[],archive=[];
try{
 const results=await Promise.all([
  fetch("./data/credentials.json",{cache:"no-cache"}),
  fetch("./data/archive-certificates.json",{cache:"no-cache"})
 ]);
 core=results[0].ok?await results[0].json():[];
 archive=results[1].ok?await results[1].json():[];
}catch(_){}
const certs=[...core.map(c=>({title:c.title,issuer:c.issuer,url:c.url||"",type:c.status||"Documented record"})),...archive.map(c=>({title:c.title,issuer:c.issuer,url:c.verificationUrl||"",type:"Course / program completion"}))];
const certTerms=["certificate","certification","credential","badge","credly","شهاده","شهادة","شهادات","اعتماد","سرتفكيت"];
const specificity=[
 ["cyber",["cybersecurity","ecsa","ethical hacking","security analyst"]],
 ["python",["python"]],
 ["ai",["ai developer","generative ai","advanced data analytics"]],
 ["full stack",["full-stack","full stack"]],
 ["data",["data analytics","data analysis"]],
 ["project",["project management","project development"]],
 ["sql",["sql"]]
];
function addBubble(role,text,links=[]){
 const bubble=document.createElement("div");bubble.className="rt-msg "+(role==="user"?"rt-user":"rt-assistant");
 const copy=document.createElement("div");copy.textContent=text;bubble.append(copy);
 if(links.length){
  const bar=document.createElement("div");bar.className="rt-sources";
  for(const [label,href] of links.slice(0,5)){
   if(typeof href!=="string"||!href.startsWith("#")&&!/^https:\/\//.test(href))continue;
   const a=document.createElement("a");a.textContent=label;a.href=href;
   if(href.startsWith("#")&&href.includes("/")){a.addEventListener("click",()=>hidePanel());}
   if(href.startsWith("https://")){a.target="_blank";a.rel="noopener noreferrer";}
   bar.append(a);
  }
  bubble.append(bar);
 }
 log.append(bubble);log.scrollTop=log.scrollHeight;
}
function pickVoice(lang){
 voices=window.speechSynthesis?.getVoices?.()||voices;
 const options=voices.filter(v=>v.lang?.toLowerCase().startsWith(lang));
 return options.find(v=>/natural|online|neural/i.test(v.name))||options.find(v=>/microsoft|google/i.test(v.name))||options[0]||null;
}
function stopVoice(){try{window.speechSynthesis?.cancel();}catch(_){}panel.classList.remove("rt-speaking");utterance=null;}
function say(text,lang){
 if(!speaking||!window.speechSynthesis)return;
 stopVoice();
 const utter=new SpeechSynthesisUtterance(text.slice(0,1250));
 utter.lang=lang;utter.rate=.96;utter.pitch=1.03;
 const voice=pickVoice(lang.slice(0,2));if(voice)utter.voice=voice;
 utter.onstart=()=>panel.classList.add("rt-speaking");
 utter.onend=utter.onerror=()=>panel.classList.remove("rt-speaking");
 utterance=utter;window.speechSynthesis.speak(utter);
}
function normalizedMatches(text,terms){return terms.some(term=>normalize(text).includes(normalize(term)));}
function answerQuestion(input){
 const q=normalize(input),ar=arabic(input),skillLabel=ar?"مهارة":"Skill";
 const result={answer:"",links:[]};
 const certAsk=normalizedMatches(input,certTerms);
 const selectedSkill=dictionary.find(row=>normalizedMatches(input,row.aliases))?.name||
 skills.find(s=>normalize(s)===q)||
 skills.filter(s=>normalize(s).length>2).find(s=>q.includes(normalize(s)));
 if(certAsk){
  let matches=certs.filter(x=>/IBM SkillsBuild Cybersecurity|EC-Council Certified Security Analyst|Microsoft Full-Stack Developer|Microsoft Python Development|IBM AI Developer|Google Cybersecurity|Google Advanced Data Analytics/i.test(x.title));
  const target=specificity.find(([term,words])=>q.includes(term)||words.some(w=>q.includes(normalize(w))));
  if(target)matches=certs.filter(x=>target[1].some(w=>normalize(x.title).includes(normalize(w))));
  if(selectedSkill&&!target){
   const key=normalize(selectedSkill);
   matches=certs.filter(x=>normalize(x.title).includes(key)||({"Cybersecurity":/cybersecurity|ecsa|ethical hacking/i,"Full Stack":/full.stack/i,"Python":/python/i,"AI":/ai developer|generative ai/i}[selectedSkill]||/(?!x)x/).test(x.title));
  }
  matches=matches.filter((x,i,a)=>a.findIndex(y=>y.title===x.title)===i).slice(0,5);
  if(matches.length){
   result.answer=(ar?"الشهادات المرتبطة بالسؤال في سجلات المشروع:\n":"Relevant records in the project catalog:\n")+matches.map(x=>"• "+x.title+" — "+x.issuer+" ("+x.type+")").join("\n")+"\n"+(ar?"تحقق من جهة الإصدار قبل اعتبار الدورة اعتماداً مهنياً.":"Course completions are not automatically professional certifications.");
   result.links=[["All credentials","#credentials"],...matches.filter(x=>/^https:\/\//.test(x.url)).slice(0,3).map(x=>[x.issuer+" certificate",x.url])];
   return result;
  }
 }
 const project=projects.find(p=>normalizedMatches(input,p.match));
 const projectAsked=/project|worked|built|deploy|experience|portfolio|مشروع|مشاريع|نفذ|عمل|خبرة/.test(q);
 if(project&&(projectAsked||!selectedSkill)){
  result.answer=project.body;result.links=[["Experience","#about"],["Related skills","#home"]];return result;
 }
 if(selectedSkill){
  const link="#/s/"+getId(selectedSkill);
  const categories={AI:"AI-enabled workflows and applied technical automation",ERP:"enterprise applications and operational data workflows",Python:"software scripting, automation and data work",Networking:"enterprise and industrial connectivity",Cybersecurity:"enterprise security, risk management and operational safeguards", "Control Panels":"electrical panels, SCADA, testing and commissioning"};
  const detail=categories[selectedSkill]||"technical capability and engineering practice";
  result.answer=(ar?"توجد صفحة مخصصة لمهارة ":"RadarTrust has a dedicated expertise profile for ")+selectedSkill+". "+(ar?"تشرح الخبرات والمشاريع والشهادات المرتبطة بها، مع تمييز المعلومات الموثقة.":"It covers "+detail+", related résumé-backed work and the most relevant documented credentials.");
  result.links=[["Open "+selectedSkill+" profile",link],["All credentials","#credentials"]];return result;
 }
 const matching=faq.find(item=>normalizedMatches(input,item.keys));
 if(matching)return {answer:matching.answer,links:matching.source};
 if(project){return {answer:project.body,links:[["Experience","#about"]]};}
 return {answer:ar?"لم أجد إجابة موثقة لهذا السؤال في سجلات RadarTrust الحالية. يمكنني شرح الخبرات والمشاريع والشهادات والمهارات الموجودة بالموقع. جرّب أن تسأل عن SCADA أو Python أو Samsung أو شهادات الأمن السيبراني.":"I couldn't verify an answer to that question from the public RadarTrust records. Ask me about a documented skill, project, company, certificate, or how to make contact. I won't invent a claim that is not supported.",links:[["Explore expertise","#home"],["Credentials","#credentials"]]};
}
function respond(question){
 const q=String(question||"").trim().slice(0,320);if(!q)return;
 addBubble("user",q);
 const result=answerQuestion(q);
 addBubble("assistant",result.answer,result.links);
 say(result.answer,arabic(q)?"ar-SA":"en-US");
}
function showPanel(){
 panel.hidden=false;launch.hidden=true;launch.setAttribute("aria-expanded","true");
 if(!log.children.length)addBubble("assistant","Hello! I'm Radar, your portfolio knowledge guide. Ask me about Zeiad's engineering projects, skills, credentials or how to get in touch.");
 query.focus({preventScroll:true});
}
function hidePanel(){stopVoice();panel.hidden=true;launch.hidden=false;launch.setAttribute("aria-expanded","false");launch.focus({preventScroll:true});}
launch.addEventListener("click",showPanel);
close.addEventListener("click",hidePanel);
sound.addEventListener("click",()=>{
 speaking=!speaking; sound.textContent=speaking?"🔊":"🔇";
 sound.setAttribute("aria-label",speaking?"Disable speech":"Enable speech");
 if(!speaking)stopVoice();
 status.textContent=speaking?"Voice enabled":"Voice muted";
});
$("rt-guide-form").addEventListener("submit",event=>{
 event.preventDefault();const text=query.value;query.value="";respond(text);
});
for(const chip of panel.querySelectorAll("[data-rt-ask]")){
 chip.addEventListener("click",()=>respond(chip.dataset.rtAsk));
}
window.addEventListener("hashchange",()=>{if(!panel.hidden&&location.hash.startsWith("#/"))hidePanel();});
if("speechSynthesis" in window){
 voices=window.speechSynthesis.getVoices();
 window.speechSynthesis.addEventListener?.("voiceschanged",()=>{voices=window.speechSynthesis.getVoices();});
}else{speaking=false;sound.hidden=true;status.textContent="Text-only: browser speech unavailable";}
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(Recognition){
 mic.hidden=false;
 mic.addEventListener("click",()=>{
  if(recognition){recognition.stop();return;}
  const proceed=window.confirm("Voice input may be processed by your browser's speech recognition provider. Continue?");
  if(!proceed)return;
  recognition=new Recognition();recognition.lang="en-US";recognition.maxAlternatives=1;recognition.interimResults=false;
  recognition.onresult=event=>{query.value=event.results[0][0].transcript;query.focus();};
  recognition.onerror=()=>{status.textContent="Voice input unavailable";};
  recognition.onend=()=>{recognition=null;mic.textContent="🎙️";};
  try{recognition.start();mic.textContent="⏹";status.textContent="Listening…";}catch(_){recognition=null;}
 });
}
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&!panel.hidden&&!location.hash.startsWith("#/"))hidePanel();
});
})();
