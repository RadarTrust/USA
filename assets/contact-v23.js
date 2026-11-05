/* RadarTrust contact — Cloudflare Worker + Turnstile. No private keys or recipient addresses in browser. */
(()=>{
"use strict";
const ENDPOINT="https://radartrust-contact.zeiadyazaji-profile.workers.dev";
const form=document.getElementById("professional-contact-form");
const send=document.getElementById("contact-submit");
const status=document.getElementById("contact-form-status");
if(!form||!send||!status)return;
let verifiedToken="";
let busy=false;
function notice(message,state="info"){status.textContent=message;status.dataset.state=state;}
function ready(){send.disabled=busy||!verifiedToken;}
function resetChallenge(){
 verifiedToken="";
 try{window.turnstile?.reset(document.getElementById("contact-turnstile"));}catch(_){}
 ready();
}
window.radarTrustVerified=token=>{
 verifiedToken=typeof token==="string"?token:"";
 ready();
 if(verifiedToken)notice("Security verified. Your message is ready to send.","success");
};
window.radarTrustExpired=()=>{
 verifiedToken="";ready();
 notice("Verification expired. Please complete the security check again.","error");
};
window.radarTrustChallengeError=()=>{
 verifiedToken="";ready();
 notice("Security check could not load. Please refresh the page or try another browser.","error");
};
form.addEventListener("submit",async event=>{
 event.preventDefault();
 if(busy||!form.reportValidity())return;
 if(form.elements.botcheck?.checked){notice("Unable to process this request.","error");return;}
 if(!verifiedToken){notice("Complete the security check before sending.","error");return;}
 const name=form.elements.name?.value.trim();
 const email=form.elements.email?.value.trim();
 const phone=form.elements.phone?.value.trim();
 const message=form.elements.message?.value.trim();
 if(!name||!email||!phone||!message)return;
 busy=true;ready();notice("Submitting your message securely…");
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(ENDPOINT,{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({name,email,phone,message,turnstileToken:verifiedToken}),
   signal:controller.signal
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.success!==true){
   throw new Error(data.error||"The message was not accepted by the delivery provider");
  }
  form.reset();
  notice("Your message was accepted for delivery. Thank you for contacting RadarTrust!","success");
 }catch(error){
  const msg=String(error?.message||"");
  notice(msg==="Security verification failed"?"Verification failed or expired. Please try again.":"Your message could not be confirmed as sent. Please retry after verification.","error");
 }finally{
  clearTimeout(timeout);busy=false;resetChallenge();
 }
});
send.disabled=true;
notice("Complete the Cloudflare security check, then send your message.");
})();
