/* RadarTrust v77: mobile visitors tap once to unveil a card, then tap
   again to open its full-resolution image. Desktop hover stays instant. */
(()=>{
 "use strict";
 const cards=[...document.querySelectorAll(
  ".connect-section .connect-business-card, .about-card-section .about-card-frame"
 )];
 if(!cards.length)return;
 const coarse=window.matchMedia("(hover:none) and (pointer:coarse)");
 for(const card of cards){
  card.addEventListener("click",e=>{
   if(!coarse.matches)return;
   if(!card.classList.contains("rt-card-revealed")){
    e.preventDefault();
    card.classList.add("rt-card-revealed");
    card.setAttribute("aria-label",(card.getAttribute("aria-label")||"Professional card")+". Tap again to open full size.");
   }
  });
  document.addEventListener("pointerdown",e=>{
   if(coarse.matches&&!card.contains(e.target))card.classList.remove("rt-card-revealed");
  },{passive:true});
  card.addEventListener("keydown",e=>{
   if(e.key==="Escape")card.classList.remove("rt-card-revealed");
  });
 }
})();