/* Misión Total · animaciones de celebración (Órbita, Luna, fuegos artificiales) */
(function(){
"use strict";
var st=document.createElement("style");st.textContent=".moonglow{display:inline-block;width:18px;height:18px;border-radius:50%;margin-left:6px;vertical-align:-3px;background:radial-gradient(circle at 35% 35%,#FFF1C4,#FFD166 55%,#E8A93A);box-shadow:0 0 0 0 #ffd16699;animation:glow 1.8s ease-in-out infinite}\n@keyframes glow{0%,100%{box-shadow:0 0 4px 1px #ffd16666}50%{box-shadow:0 0 14px 5px #ffd166aa}}\n.rk.luna{background:linear-gradient(90deg,#ffd16614,transparent 70%);border-radius:10px;padding-inline:6px}\n.rk.luna .tr i{background:linear-gradient(90deg,#FFD166,#FFF1C4,#FFD166);background-size:200% 100%;animation:shine 2.4s linear infinite}\n@keyframes shine{to{background-position:-200% 0}}\n\n/* ===== overlay de celebraci\u00f3n ===== */\n.cel{position:fixed;inset:0;z-index:50;display:grid;place-items:center;overflow:hidden;cursor:pointer;background:radial-gradient(circle at 50% 60%,#1A2150,#040612 75%);animation:celIn .25s ease both}\n.cel.out{animation:celOut .3s ease both}\n@keyframes celIn{from{opacity:0}}@keyframes celOut{to{opacity:0}}\n.cel canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\n.cel .rocket{position:absolute;left:0;top:0;width:74px;height:118px;will-change:transform;filter:drop-shadow(0 0 14px #4fc3f766)}\n.cel .planet{position:absolute;left:50%;top:44%;width:180px;height:180px;margin:-90px 0 0 -90px;opacity:0}\n.cel .moonbig{position:absolute;left:50%;top:50%;width:260px;height:260px;margin:-130px 0 0 -130px;transform:scale(.2);opacity:0}\n.cel .flag{position:absolute;left:50%;top:62%;transform-origin:0 100%;opacity:0}\n.cel .ban{position:absolute;left:50%;bottom:9%;transform:translateX(-50%);width:min(92vw,440px);text-align:center;opacity:0}\n.cel .ban .t{font:700 clamp(30px,9vw,44px)/1 var(--d);letter-spacing:-.01em;text-shadow:0 4px 24px #000c}\n.cel .ban .s{margin-top:8px;display:inline-block;font-weight:800;font-size:16px;border-radius:999px;padding:7px 14px}\n.cel .ban .hint{margin-top:14px;font-size:12px;color:#9BA5CFaa}\n.cel.orb .ban .t{color:var(--orb)}.cel.orb .ban .s{background:var(--orb);color:#05081A}\n.cel.luna .ban .t{color:var(--moon)}.cel.luna .ban .s{background:var(--moon);color:#05081A}\n.cel.fw .ban{bottom:auto;top:50%;transform:translate(-50%,-50%)}\n.cel.fw .ban .t{font-size:clamp(26px,7.5vw,36px)}\n.cel.fw .ban .s{background:#fff;color:#05081A}\n@media (prefers-reduced-motion:reduce){.cel .rocket,.cel canvas{display:none}}\n";document.head.appendChild(st);
var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
/* ---------- sonido ---------- */
var actx=null;
function tone(f,dt,dur,type,g,f2){var t=actx.currentTime,o=actx.createOscillator(),v=actx.createGain();o.type=type;o.frequency.setValueAtTime(f,t+dt);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dt+dur);v.gain.setValueAtTime(.0001,t+dt);v.gain.exponentialRampToValueAtTime(g,t+dt+.02);v.gain.exponentialRampToValueAtTime(.0001,t+dt+dur);o.connect(v).connect(actx.destination);o.start(t+dt);o.stop(t+dt+dur+.05);}
function noise(dt,dur,g,freq){var t=actx.currentTime,n=actx.sampleRate*dur|0,buf=actx.createBuffer(1,n,actx.sampleRate),d=buf.getChannelData(0);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);var s=actx.createBufferSource();s.buffer=buf;var f=actx.createBiquadFilter();f.type="lowpass";f.frequency.value=freq||1200;var v=actx.createGain();v.gain.value=g;s.connect(f).connect(v).connect(actx.destination);s.start(t+dt);}
function snd(k,at){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();at=at||0;
  if(k==="engine"){tone(90,at,1.6,"sawtooth",.10,700);tone(180,at+.05,1.5,"triangle",.07,1300);noise(at,1.6,.25,900);}
  else if(k==="orbit")[523,659,784].forEach(function(f,i){tone(f,at+i*.1,.35,"triangle",.13);});
  else if(k==="pop"){noise(at,.5,.5,2400);tone(900,at,.15,"sine",.05,300);}
  else if(k==="whistle")tone(500,at,.5,"sine",.04,1600);
  else if(k==="fanfare"){[392,523,659,784].forEach(function(f,i){tone(f,at+i*.13,.3,"triangle",.14);});tone(1047,at+.55,.9,"triangle",.16);tone(784,at+.55,.9,"sine",.09);tone(659,at+.55,.9,"sine",.07);}
  else if(k==="thud")tone(120,at,.35,"sine",.25,50);
}catch(e){}}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}}

/* ---------- dibujos ---------- */
var ROCKET='<svg viewBox="0 0 100 160" class="rocket" aria-hidden="true"><path d="M50 4 C76 30 82 70 78 118 L22 118 C18 70 24 30 50 4 Z" fill="#EEF1FF"/><path d="M50 4 C62 16 70 30 74 46 L26 46 C30 30 38 16 50 4 Z" fill="#FF6B7A"/><circle cx="50" cy="66" r="14" fill="#4FC3F7" stroke="#141B3D" stroke-width="5"/><path d="M22 92 L4 132 L22 124 Z" fill="#FF6B7A"/><path d="M78 92 L96 132 L78 124 Z" fill="#FF6B7A"/><path d="M28 118 L72 118 L66 132 L34 132 Z" fill="#9BA5CF"/></svg>';
var PLANET='<svg viewBox="0 0 200 200" class="planet" aria-hidden="true"><defs><radialGradient id="pg" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#9BE3FF"/><stop offset=".6" stop-color="#4FC3F7"/><stop offset="1" stop-color="#1F6FA8"/></radialGradient></defs><ellipse cx="100" cy="104" rx="98" ry="26" fill="none" stroke="#FFD16688" stroke-width="6" transform="rotate(-16 100 100)"/><circle cx="100" cy="100" r="62" fill="url(#pg)"/><path d="M60 80 q20 -10 40 0 t40 4" stroke="#ffffff55" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M52 112 q24 10 50 2 t44 -6" stroke="#ffffff33" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M2 104 a98 26 0 0 0 196 0" fill="none" stroke="#FFD166" stroke-width="6" transform="rotate(-16 100 100)"/></svg>';
var MOON='<svg viewBox="0 0 260 260" class="moonbig" aria-hidden="true"><defs><radialGradient id="mg" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFF4CF"/><stop offset=".55" stop-color="#FFD166"/><stop offset="1" stop-color="#D99A2B"/></radialGradient><radialGradient id="mh" cx="50%" cy="50%" r="50%"><stop offset=".7" stop-color="#FFD16655"/><stop offset="1" stop-color="#FFD16600"/></radialGradient></defs><circle cx="130" cy="130" r="128" fill="url(#mh)"/><circle cx="130" cy="130" r="96" fill="url(#mg)"/><circle cx="98" cy="104" r="16" fill="#E2A845" opacity=".75"/><circle cx="160" cy="150" r="22" fill="#E2A845" opacity=".6"/><circle cx="118" cy="176" r="10" fill="#E2A845" opacity=".7"/><circle cx="170" cy="96" r="8" fill="#E2A845" opacity=".7"/></svg>';
function FLAG(name){return '<svg class="flag" width="120" height="96" viewBox="0 0 120 96" aria-hidden="true"><rect x="2" y="4" width="4" height="92" rx="2" fill="#EEF1FF"/><path d="M6 6 H112 L100 26 L112 46 H6 Z" fill="#FF6B7A"/><text x="54" y="32" text-anchor="middle" font-family="Space Grotesk,Inter,sans-serif" font-weight="700" font-size="17" fill="#fff">'+esc(name)+'</text></svg>';}

/* ---------- partículas ---------- */
function Stage(){
  var el=document.createElement("div");el.className="cel";
  var cv=document.createElement("canvas");el.appendChild(cv);document.body.appendChild(el);
  var ctx=cv.getContext("2d"),dpr=Math.min(2,window.devicePixelRatio||1),W,H,P=[],run=true,hooks=[];
  function size(){W=el.clientWidth;H=el.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  size();window.addEventListener("resize",size);
  function add(p){P.push(p);}
  function loop(){
    if(!run)return;
    ctx.clearRect(0,0,W,H);
    hooks.forEach(function(f){f();});
    ctx.globalCompositeOperation="lighter";
    for(var i=P.length-1;i>=0;i--){var p=P[i];
      p.life--;if(p.life<=0){if(p.onDie)p.onDie(p);P.splice(i,1);continue;}
      p.vx*=p.drag;p.vy=p.vy*p.drag+p.g;p.x+=p.vx;p.y+=p.vy;
      var a=p.life/p.max;
      if(p.trail){ctx.strokeStyle=p.c;ctx.globalAlpha=a;ctx.lineWidth=p.s;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*3,p.y-p.vy*3);ctx.stroke();}
      else{ctx.globalAlpha=p.smoke?a*.35:a;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.smoke?p.s*(2-a):p.s*(p.shrink?a:1),0,6.283);ctx.fill();}
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  var closed=false,onClose=null;
  function close(){if(closed)return;closed=true;el.classList.add("out");setTimeout(function(){run=false;el.remove();window.removeEventListener("resize",size);if(onClose)onClose();},300);}
  el.addEventListener("click",close);
  return {el:el,add:add,hook:function(f){hooks.push(f);},close:close,size:function(){return {W:W,H:H};},onClose:function(f){onClose=f;}};
}
var FW_COLORS=[["#FFD166","#FFF1C4"],["#4FC3F7","#C8F0FF"],["#FF6B7A","#FFC2C9"],["#3DDC97","#C9FFE7"],["#9C8CFF","#E2DCFF"],["#FF8A5C","#FFD3C2"]];
function burst(S,x,y,pal,n){
  pal=pal||FW_COLORS[Math.random()*FW_COLORS.length|0];n=n||70;
  for(var i=0;i<n;i++){var a=Math.random()*6.283,sp=2+Math.random()*4.2;
    S.add({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:.06,drag:.975,life:55+Math.random()*30,max:85,c:Math.random()<.3?pal[1]:pal[0],s:2.2,trail:true});}
  for(var j=0;j<18;j++)S.add({x:x,y:y,vx:(Math.random()-.5)*1.5,vy:(Math.random()-.5)*1.5,g:.02,drag:.98,life:40,max:40,c:"#fff",s:1.6,shrink:true});
}
function shell(S,x,ty,pal,delayMs){
  setTimeout(function(){var sz=S.size();snd("whistle");
    var vy=-Math.sqrt(2*.22*(sz.H-ty));
    S.add({x:x,y:sz.H+5,vx:(Math.random()-.5)*.6,vy:vy,g:.22,drag:1,life:Math.round(-vy/.22),max:200,c:"#FFE7A8",s:2.5,trail:true,
      onDie:function(p){burst(S,p.x,p.y,pal);snd("pop");}});
  },delayMs||0);
}
function exhaust(S,x,y,dx,dy,strong){
  var n=strong?6:4;
  for(var i=0;i<n;i++){
    S.add({x:x,y:y,vx:dx*(2+Math.random()*2)+(Math.random()-.5)*1.4,vy:dy*(2+Math.random()*2)+(Math.random()-.5)*1.4,g:0,drag:.93,life:18+Math.random()*10,max:28,c:Math.random()<.5?"#FFD166":"#FF8A5C",s:4+Math.random()*3,shrink:true});
  }
  S.add({x:x,y:y,vx:dx*1.2+(Math.random()-.5),vy:dy*1.2+(Math.random()-.5),g:-.01,drag:.96,life:50,max:50,c:"#9BA5CF",s:6+Math.random()*4,smoke:true});
}
function banner(S,title,sub,delay){
  var b=document.createElement("div");b.className="ban";b.innerHTML='<div class="t">'+title+'</div><div class="s">'+sub+'</div><div class="hint">Toca para cerrar</div>';
  S.el.appendChild(b);
  var tr=S.el.classList.contains("fw")?"translate(-50%,-50%)":"translateX(-50%)";
  b.animate([{opacity:0,transform:tr+" scale(.6)"},{opacity:1,transform:tr+" scale(1.08)",offset:.7},{opacity:1,transform:tr+" scale(1)"}],{duration:520,delay:delay,easing:"cubic-bezier(.2,.9,.3,1.3)",fill:"forwards"});
  return b;
}
function rocketPose(r,x,y,ang,scale){r.style.transform="translate("+(x-37)+"px,"+(y-59)+"px) rotate("+ang+"deg) scale("+(scale||1)+")";}
function tailOf(x,y,ang,scale){var a=ang*Math.PI/180,d=60*(scale||1);return {x:x-Math.sin(a)*d,y:y+Math.cos(a)*d,dx:-Math.sin(a),dy:Math.cos(a)};}

/* ---------- 1 · Órbita ---------- */
function celOrbit(sub){sub=sub||"Todo pasa a 10%";
  var S=Stage();S.el.classList.add("orb");
  if(reduce){S.el.insertAdjacentHTML("beforeend",PLANET);S.el.querySelector(".planet").style.opacity=1;banner(S,"¡EN ÓRBITA! 🌍",sub,0);setTimeout(S.close,3500);return;}
  S.el.insertAdjacentHTML("beforeend",ROCKET+PLANET);
  var r=S.el.querySelector(".rocket"),pl=S.el.querySelector(".planet"),sz=S.size(),t0=performance.now(),D=1500;
  snd("engine");buzz(60);
  var p0={x:sz.W*.15,y:sz.H+80},p1={x:sz.W*.25,y:sz.H*.35},p2={x:sz.W*1.1,y:-120};
  S.hook(function(){
    var t=(performance.now()-t0)/D;if(t>1.15)return;var u=Math.min(1,t);
    var e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
    var x=(1-e)*(1-e)*p0.x+2*(1-e)*e*p1.x+e*e*p2.x, y=(1-e)*(1-e)*p0.y+2*(1-e)*e*p1.y+e*e*p2.y;
    var tx=2*(1-e)*(p1.x-p0.x)+2*e*(p2.x-p1.x), ty=2*(1-e)*(p1.y-p0.y)+2*e*(p2.y-p1.y);
    var ang=Math.atan2(tx,-ty)*180/Math.PI;
    rocketPose(r,x,y,ang,1);
    if(u<1){var tl=tailOf(x,y,ang,1);exhaust(S,tl.x,tl.y,tl.dx,tl.dy,true);
      if(Math.random()<.5)S.add({x:x+(Math.random()-.5)*sz.W*.3,y:y+(Math.random()-.5)*60,vx:0,vy:4,g:0,drag:1,life:25,max:25,c:"#fff",s:1.4,trail:true});}
  });
  pl.animate([{opacity:0,transform:"scale(.3) rotate(-30deg)"},{opacity:1,transform:"scale(1.1) rotate(4deg)",offset:.7},{opacity:1,transform:"scale(1) rotate(0)"}],{duration:700,delay:1100,easing:"cubic-bezier(.2,.9,.3,1.2)",fill:"forwards"});
  pl.animate([{transform:"translateY(0)"},{transform:"translateY(-8px)"},{transform:"translateY(0)"}],{duration:2400,delay:1800,iterations:Infinity,composite:"add"});
  setTimeout(function(){snd("orbit");for(var i=0;i<40;i++){var a=Math.random()*6.283,sp=1+Math.random()*3,s=S.size();S.add({x:s.W/2,y:s.H*.44,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:0,drag:.97,life:50,max:50,c:i%2?"#4FC3F7":"#FFD166",s:2.4,shrink:true});}},1350);
  banner(S,"¡EN ÓRBITA! 🌍",sub,1500);
  setTimeout(S.close,4800);
}

/* ---------- 2 · Luna ---------- */
function celLuna(name,sub){sub=sub||"12% en todas";
  var S=Stage();S.el.classList.add("luna");
  if(reduce){S.el.insertAdjacentHTML("beforeend",MOON);var m0=S.el.querySelector(".moonbig");m0.style.opacity=1;m0.style.transform="scale(1)";banner(S,"¡LLEGASTE A LA LUNA! 🌕",sub,0);setTimeout(S.close,4000);return;}
  S.el.insertAdjacentHTML("beforeend",MOON+ROCKET+FLAG(name||"¡Tú!"));
  var m=S.el.querySelector(".moonbig"),r=S.el.querySelector(".rocket"),fl=S.el.querySelector(".flag"),sz=S.size();
  var mcx=sz.W/2,mcy=sz.H*.50,mr=96,top=mcy-mr;
  m.animate([{opacity:0,transform:"scale(.2)"},{opacity:1,transform:"scale(1.06)",offset:.75},{opacity:1,transform:"scale(1)"}],{duration:900,easing:"cubic-bezier(.2,.9,.3,1.2)",fill:"forwards"});
  m.animate([{rotate:"0deg"},{rotate:"360deg"}],{duration:60000,iterations:Infinity});
  var t0=performance.now()+700,D=1500,landed=false,LS=.8;
  snd("engine",.7);buzz(80);
  S.hook(function(){
    var t=(performance.now()-t0)/D;if(t<0){rocketPose(r,mcx+30,-140,0,LS);return;}
    var u=Math.min(1,t),e=1-Math.pow(1-u,3);
    var y=-140+(top-48*LS+2-(-140))*e, x=mcx+30-6*e, wob=(1-u)*Math.sin(u*20)*4;
    rocketPose(r,x,y,wob,LS);
    if(u<1){var tl=tailOf(x,y,wob,LS);exhaust(S,tl.x,tl.y,tl.dx*.6,tl.dy*.6,u>.6);}
    else if(!landed){landed=true;land();}
  });
  function land(){
    snd("thud");buzz([60,40,60]);
    for(var i=0;i<34;i++){var a=Math.PI+Math.random()*Math.PI,sp=1+Math.random()*3;S.add({x:mcx+24,y:top+4,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*.6,g:.05,drag:.95,life:45,max:45,c:"#E8C77A",s:3,smoke:true});}
    fl.style.left=(mcx-62)+"px";fl.style.top=(top-90)+"px";
    fl.animate([{opacity:1,transform:"rotate(-90deg) scale(.4)"},{opacity:1,transform:"rotate(8deg) scale(1)",offset:.7},{opacity:1,transform:"rotate(0) scale(1)"}],{duration:520,delay:200,easing:"cubic-bezier(.2,.9,.3,1.3)",fill:"forwards"});
    setTimeout(function(){snd("fanfare");buzz([120,60,200]);
      var s=S.size(),gold=["#FFD166","#FFF1C4"];
      shell(S,s.W*.22,s.H*.2,gold,0);shell(S,s.W*.78,s.H*.16,gold,250);shell(S,s.W*.5,s.H*.1,gold,500);
      shell(S,s.W*.35,s.H*.25,FW_COLORS[1],850);shell(S,s.W*.65,s.H*.22,gold,1100);shell(S,s.W*.15,s.H*.12,FW_COLORS[2],1500);shell(S,s.W*.85,s.H*.3,gold,1700);
    },500);
  }
  banner(S,"¡LLEGASTE A LA LUNA! 🌕",sub,2700);
  setTimeout(S.close,7000);
}

/* ---------- 3 · Fuegos artificiales ---------- */
function celFireworks(title,sub){
  var S=Stage();S.el.classList.add("fw");
  banner(S,title,sub,reduce?0:500);
  if(!reduce){var s=S.size();buzz(50);
    shell(S,s.W*.25,s.H*.22,null,0);shell(S,s.W*.72,s.H*.18,null,220);shell(S,s.W*.5,s.H*.3,null,480);shell(S,s.W*.84,s.H*.36,null,700);}
  setTimeout(S.close,3200);
}


window.MTCelebrate={orbit:celOrbit,luna:celLuna,fireworks:celFireworks};
})();
