/* RadarTrust Contact v23: no recipient email address is shipped to browsers. */
(()=>{
 "use strict";
 const form=document.getElementById("professional-contact-form");
 const submit=document.getElementById("contact-submit");
 const status=document.getElementById("contact-form-status");
 if(!form||!submit||!status)return;
 let publicAccessKey="";
 function notify(message,kind="info"){status.textContent=message;status.dataset.state=kind;}
 async function configure(){
  try{
   const response=await fetch("./data/contact-config.json",{cache:"no-store"});
   if(!response.ok)throw Error("configuration unavailable");
   const config=await response.json();
   if(config.provider!=="web3forms"||!(/^[a-f\d-]{25,45}$/i.test(String(config.access_key||"")))){
    notify("Contact delivery is awaiting activation. The form is ready, but sending is temporarily unavailable.","info");
    submit.disabled=true;
    return;
   }
   publicAccessKey=config.access_key;
   submit.disabled=false;
   notify("Secure form ready. Complete all fields and press Send message.","info");
  }catch(error){
   notify("Contact delivery is temporarily unavailable. Please check back later.","error");
   submit.disabled=true;
  }
 }
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!publicAccessKey){notify("Form delivery has not been activated yet. No message was sent.","error");return;}
  if(!form.reportValidity())return;
  if(form.elements.botcheck?.checked){notify("Unable to submit this request.","error");return;}
  submit.disabled=true;
  notify("Sending your message securely…","info");
  const fd=new FormData(form);
  fd.set("access_key",publicAccessKey);
  fd.set("from_name","RadarTrust Professional Portfolio");
  const abort=new AbortController();
  const timer=setTimeout(()=>abort.abort(),20000);
  try{
   const res=await fetch("https://api.web3forms.com/submit",{
    method:"POST",body:fd,signal:abort.signal,headers:{Accept:"application/json"}
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok||data.success!==true)throw Error(data.message||"Provider did not confirm delivery");
   form.reset();
   notify("Your message has been submitted successfully. Thank you for reaching out!","success");
  }catch(error){
   notify("Your message was not confirmed as delivered. Please try again later. No success has been recorded.","error");
  }finally{
   clearTimeout(timer);submit.disabled=false;
  }
 });
 configure();
})();
