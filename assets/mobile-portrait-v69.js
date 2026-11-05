/* RadarTrust v69: move the existing portrait, not a clone, ahead of the radar on
   mobile/tablet. Reparenting preserves its profile click/keyboard listeners.
   On desktop, restore the original orbit stage and all animations. */
(()=>{
 "use strict";
 const mq=window.matchMedia("(max-width: 1050px)");
 const portrait=document.querySelector(".hero .hero-aside .universe-stage .portrait-photo");
 const stage=portrait?.parentElement;
 const lockup=document.querySelector(".hero .hero-content .radar-hero-lockup");
 if(!portrait||!stage||!lockup)return;
 const home=portrait.nextSibling;
 function sync(){
  if(mq.matches){
   if(portrait.parentElement!==lockup.parentElement)
    lockup.parentElement.insertBefore(portrait,lockup);
   portrait.classList.add("rt-mobile-portrait");
  }else{
   portrait.classList.remove("rt-mobile-portrait");
   if(portrait.parentElement!==stage)stage.insertBefore(portrait,home&&home.parentElement===stage?home:stage.querySelector(".neon-constellation"));
  }
 }
 sync();
 mq.addEventListener?.("change",sync);
})();