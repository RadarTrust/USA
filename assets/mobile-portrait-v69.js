/* RadarTrust v69: move the existing portrait, not a clone, ahead of the radar on
   mobile/tablet. Reparenting preserves its profile click/keyboard listeners.
   On desktop, restore the original orbit stage and all animations. */
(()=>{
 "use strict";
 const mq=window.matchMedia("(max-width: 1050px)");
 const portrait=document.querySelector(".hero .hero-aside .universe-stage .portrait-photo");
 const stage=portrait?.parentElement;
 const radarCenter=document.querySelector(".hero .hero-content .radar-hero-lockup .radar-hero-center");
 if(!portrait||!stage||!radarCenter)return;
 const home=portrait.nextSibling;
 function sync(){
  if(mq.matches){
   // Place the SAME interactive portrait directly on top of the radar dial.
   // Absolute positioning means the hero height does not increase.
   if(portrait.parentElement!==radarCenter)radarCenter.appendChild(portrait);
   portrait.classList.add("rt-mobile-portrait");
  }else{
   portrait.classList.remove("rt-mobile-portrait");
   if(portrait.parentElement!==stage)stage.insertBefore(portrait,home&&home.parentElement===stage?home:stage.querySelector(".neon-constellation"));
  }
 }
 sync();
 mq.addEventListener?.("change",sync);
})();