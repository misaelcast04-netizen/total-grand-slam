(function(){
  "use strict";
  const SB_URL = "https://dcarjzkvzqildscomjfu.supabase.co";
  const SB_KEY = "sb_publishable_Zf1-IcES-Q7rxRuWF6bYeA_aVlMI0pX";
  const COLS = "id,date,order_no,seller,store,activation,edge,autopay,upgrade,internet,tablet,tradein,notes,verified,device_tag,created_at";

  const KEYS = ["activation","edge","autopay","upgrade","internet","tablet","tradein"];
  const LABEL = {activation:"Activación",edge:"EDGE",autopay:"AutoPay",upgrade:"Total Upgrade",internet:"Home Internet",tablet:"Tablet",tradein:"Trade-In"};
  const SHORT = {activation:"ACT",edge:"EDGE",autopay:"AUTO",upgrade:"UPG",internet:"INET",tablet:"TAB",tradein:"TRADE"};
  const EMOJI = {activation:"📶",edge:"💳",autopay:"💰",upgrade:"⬆️",internet:"🏠",tablet:"📲",tradein:"🔄"};
  const SUBLABEL = {activation:"Línea nueva",autopay:"Con activación en Total Access"};
  const COMBO = {doble:"Doble",homerun:"Home Run",grandslam:"Grand Slam"};
  const STORES_DEFAULT = ["3996 WP","40 West","4369 WP","487 E Tremont","713 E Tremont","Bergenline","Broadway","Burnside","Dyckman","E 149th St","Hartford","Morris","Passaic","Paterson","St Nicholas","Yonkers"];
  let STORES = STORES_DEFAULT.slice();
  function fillStores(){
    const sel=$("fStore"), cur=sel.value || (JSON.parse(store.get("tgs-last")||"{}").store||"");
    sel.innerHTML = `<option value="">Escoge la tienda</option>` + STORES.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join("");
    if(STORES.includes(cur)) sel.value=cur;
  }
  const SELLERS_DEFAULT = ["Alessandro Mendoza","Alexander Tejada","Dany Brito","Elian Crusel","Eslier Quezada","Felix Martinez","Gabriel Perdomo","Gerarl Uribe","Henry Diaz","Jean Alain","Jheremi Marte","Johansel Clase","Jose Rodriguez (Doctor)","Juan Miguel Perez","Juan Reynoso (Bori)","Keiry de la Cruz","Keirys Suriel","Lisandra Perez","Michael Monegro","Michael Ramos","Osvarlyn Gonzalez","Winston Tapia","Yokaira del Rosario"];
  let SELLERS = SELLERS_DEFAULT.slice();
  function fillSellers(){
    const sel=$("fSeller"); let last=""; try{ last=JSON.parse(store.get("tgs-last")||"{}").seller||""; }catch(e){}
    const cur=sel.value || last;
    sel.innerHTML = `<option value="">Escoge tu nombre</option>` + SELLERS.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join("");
    if(SELLERS.includes(cur)) sel.value=cur;
  }
  const PLACE = ["1er","2do","3er","4to","5to"], MEDAL = ["🥇","🥈","🥉","🏅","🏅"];
  const DEFAULT = {prizes:[50,35,25], endDate:"2026-10-15",
    points:{activation:3,edge:4,autopay:2,upgrade:3,internet:4,tablet:3,tradein:3},
    bonus:{doble:2,homerun:5,grandslam:10}};
  let cfg = JSON.parse(JSON.stringify(DEFAULT));
  let rows = [], sb = null, dbState = "loading", adminPin = null;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = v => "$"+v;
  const prizeList = () => cfg.prizes.map(money).join(" · ");
  const normOrder = o => String(o||"").replace(/\s+/g,"").toUpperCase();
  const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
  const sess = { get(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ v===null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v); }catch(e){} } };

  // device token: lets a seller undo their own sale for 10 minutes
  let device = store.get("tgs-device");
  if(!device || device.length < 16){ const a=new Uint8Array(16); (window.crypto||{}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_,i)=>a[i]=Math.random()*256|0); device=[...a].map(b=>b.toString(16).padStart(2,"0")).join(""); store.set("tgs-device",device); }
  const mine = new Set(JSON.parse(store.get("tgs-mine")||"[]"));
  const rememberMine = id => { mine.add(id); store.set("tgs-mine", JSON.stringify([...mine].slice(-50))); };

  function mergeCfg(d){
    const c = JSON.parse(JSON.stringify(DEFAULT)); if(!d) return c;
    if(Array.isArray(d.prizes)){ const pz=d.prizes.map(Number).filter(v=>Number.isFinite(v)&&v>0).slice(0,5); if(pz.length) c.prizes=pz; }
    if(/^\d{4}-\d{2}-\d{2}$/.test(d.end_date||"")) c.endDate=d.end_date;
    for(const k of KEYS) if(Number.isFinite(d.points?.[k])) c.points[k]=d.points[k];
    for(const k of ["doble","homerun","grandslam"]) if(Number.isFinite(d.bonus?.[k])) c.bonus[k]=d.bonus[k];
    return c;
  }
  const mapRow = r => ({id:r.id, date:r.date, order:r.order_no, seller:r.seller, store:r.store, notes:r.notes, verified:r.verified, tag:r.device_tag, createdAt:Date.parse(r.created_at), activation:r.activation, edge:r.edge, autopay:r.autopay, upgrade:r.upgrade, internet:r.internet, tablet:r.tablet, tradein:r.tradein});

  // ---------- scoring ----------
  function txScore(r){
    let base=0, n=0; for(const k of KEYS){ if(r[k]){ base+=cfg.points[k]; n++; } }
    const combo = (n>=4 && r.tradein) ? "grandslam" : n>=3 ? "homerun" : n===2 ? "doble" : null;
    const bonus = combo ? cfg.bonus[combo] : 0;
    return {n,combo,bonus,total:base+bonus};
  }
  function standings(list){
    const map = new Map();
    for(const r of list){
      const key = String(r.seller||"").trim().toLowerCase(); if(!key) continue;
      if(!map.has(key)){ const s={name:String(r.seller).trim(),stores:new Map(),doble:0,homerun:0,grandslam:0,total:0,txs:[]}; KEYS.forEach(k=>s[k]=0); map.set(key,s); }
      const s = map.get(key), sc = txScore(r);
      KEYS.forEach(k=>{ if(r[k]) s[k]++; });
      if(sc.combo) s[sc.combo]++;
      s.total += sc.total; s.txs.push(r);
      if(r.store){ const st=String(r.store).trim(); s.stores.set(st,(s.stores.get(st)||0)+1); }
    }
    const out=[...map.values()].map(s=>({...s,store:[...s.stores.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||""}));
    out.sort((a,b)=>b.total-a.total||b.grandslam-a.grandslam||b.homerun-a.homerun||a.name.localeCompare(b.name));
    out.forEach((s,i)=>{ s.pos=(i>0&&out[i-1].total===s.total)?out[i-1].pos:i+1; });
    return out;
  }
  const winners = st => cfg.prizes.map((amt,i)=>({place:i,amt,s:st[i]||null}));
  function endInfo(){
    const [y,m,d]=cfg.endDate.split("-").map(Number); const end=new Date(y,m-1,d);
    const now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return {days:Math.round((end-today)/86400000), wd:end.toLocaleDateString("es-US",{weekday:"long"}), label:end.toLocaleDateString("es-US",{weekday:"long",day:"numeric",month:"long"})};
  }
  function teamTotals(){ const t={doble:0,homerun:0,grandslam:0}; KEYS.forEach(k=>t[k]=0); rows.forEach(r=>{ KEYS.forEach(k=>{ if(r[k]) t[k]++; }); const c=txScore(r).combo; if(c) t[c]++; }); return t; }

  // ---------- render ----------
  function render(){
    const st = standings(rows);
    renderBanners(); renderBoard(st); renderRecent(); renderDatalists();
    if(adminPin){ renderAudit(st); renderWA(st); }
  }
  function renderBanners(){
    const h = dbState==="off" ? `<div class="banner warn"><b>Sin conexión.</b> Revisa el internet; el marcador se actualiza solo cuando vuelva.</div>` : "";
    $("bannerBoard").innerHTML=h; $("bannerLog").innerHTML=h;
  }
  function renderBoard(st){
    const e=endInfo();
    $("prizeV").textContent=prizeList(); $("endV").textContent=e.wd;
    $("countdown").textContent = e.days>1?`Quedan ${e.days} días`:e.days===1?"Queda 1 día":e.days===0?"Último día":"Finalizado";
    $("tagline").textContent = `${KEYS.length} prioridades. 3 ganadores.`;
    $("footRule").textContent = "Gana quien tenga más puntos";
    $("legend").innerHTML = KEYS.map(k=>`<span><b>${SHORT[k]}</b> ${esc(LABEL[k])}</span>`).join("");
    if(!st.length){
      $("lead").innerHTML="";
      $("rows").innerHTML = dbState==="loading" ? `<div class="empty"><div class="big">Cargando marcador…</div></div>` : `<div class="empty"><div class="big">El marcador está en 0</div>Registra la primera venta en <b>Registrar</b> y el ranking aparece aquí.</div>`;
    } else {
      const W=winners(st), wmap=new Map(W.filter(w=>w.s).map(w=>[w.s,w]));
      $("lead").innerHTML=`<div class="champ solo"><div class="k">🏆 Si el reto terminara hoy</div><div class="podium">${W.map(w=>`<div class="pl${w.s?"":" open"}"><span class="m">${MEDAL[w.place]}</span><span class="nm">${w.s?esc(w.s.name)+`<small>${w.s.total} pts</small>`:"Puesto libre"}</span><span class="amt num">${money(w.amt)}</span></div>`).join("")}</div></div>`;
      $("rows").innerHTML = st.map(s=>{ const w=wmap.get(s); return `<div class="row${s.pos<=3?" r"+s.pos:""}">
        <div class="rank num">${s.pos}${s.pos<=3?`<span class="medal">${MEDAL[s.pos-1]}</span>`:""}</div>
        <div class="who"><div class="name">${esc(s.name)}${s.grandslam?`<span class="gsct">⭐ GRAND SLAM${s.grandslam>1?" ×"+s.grandslam:""}</span>`:""}</div>${s.store?`<div class="store">${esc(s.store)}</div>`:""}
          ${(s.homerun||s.doble)?`<div class="store">${s.homerun?`🟡 ${s.homerun} HR`:""}${s.homerun&&s.doble?" · ":""}${s.doble?`🔵 ${s.doble} Doble${s.doble>1?"s":""}`:""}</div>`:""}${w?`<span class="prizetag">💵 ${money(w.amt)} · ${PLACE[w.place]} lugar</span>`:""}</div>
        <div class="pts"><div class="big num">${s.total}</div><div class="u">PTS</div></div>
        <div class="bases">${KEYS.map(k=>`<span class="base ${s[k]>0?"on":""}" title="${esc(LABEL[k])}">${SHORT[k]} <b class="num">${s[k]}</b></span>`).join("")}</div>
      </div>`; }).join("");
    }
    const t=teamTotals(), k=(v,l,c="")=>`<div class="kpi ${c}"><div class="v num">${v}</div><div class="k">${l}</div></div>`;
    $("kpis").innerHTML = KEYS.map(x=>k(t[x],LABEL[x])).join("") + k(t.doble,"Dobles") + k(t.homerun,"Home Runs") + k(t.grandslam,"⭐ Grand Slams","gold");
    $("updated").textContent="Actualizado: "+new Date().toLocaleString("es-US",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
    $("rules").innerHTML = `<h3>Cómo se puntúa</h3><ul>
      ${KEYS.map(x=>`<li>${EMOJI[x]} <b>${esc(LABEL[x])}</b>${SUBLABEL[x]?` (${SUBLABEL[x]})`:""} → +${cfg.points[x]}</li>`).join("")}
      <li>🔵 <b>Doble</b>: 2 prioridades en la misma orden → +${cfg.bonus.doble}</li>
      <li>🟡 <b>Home Run</b>: 3 en la misma orden → +${cfg.bonus.homerun}</li>
      <li>⭐ <b>Grand Slam</b>: Home Run + Trade-In (4 o más en la misma orden, una de ellas Trade-In) → +${cfg.bonus.grandslam}</li>
      <li>Cada orden recibe solo su bono más alto.</li>
      <li>🏆 Premios: ${cfg.prizes.map((v,i)=>`${MEDAL[i]} ${PLACE[i]} lugar <b>${money(v)}</b>`).join(" · ")}. Ganan los 3 con más puntos, después de la auditoría de órdenes.</li></ul>`;
  }
  function itemsHtml(r){
    const sc=txScore(r);
    let h=KEYS.filter(k=>r[k]).map(k=>`<span class="it">${esc(LABEL[k])}</span>`).join("");
    if(sc.combo) h+=`<span class="it ${sc.combo==="grandslam"?"gs":sc.combo==="homerun"?"hr":"cb"}">${COMBO[sc.combo]} +${sc.bonus}</span>`;
    return h;
  }
  const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("es-US",{weekday:"short",day:"numeric",month:"short"}) : "—";
  const fmtTime = t => t ? new Date(t).toLocaleString("es-US",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}) : "—";

  function renderRecent(){
    const list=[...rows].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,15), now=Date.now();
    $("recent").innerHTML = list.length ? list.map(r=>{
      const own = mine.has(r.id) && now-(r.createdAt||0) < 600000;
      return `<div class="ent"><div class="top">${esc(r.seller)} · <span class="o">#${esc(r.order||"—")}</span></div><div class="p num">+${txScore(r).total}</div>
      <div class="its">${itemsHtml(r)}</div><div class="sub">${esc(fmtDate(r.date))}${r.store?" · "+esc(r.store):""}</div>
      ${own?`<div class="acts"><button class="btn sm danger" type="button" data-undo="${esc(r.id)}">Deshacer</button></div>`:""}</div>`;
    }).join("") : `<div class="hint">Todavía no hay ventas registradas.</div>`;
  }
  function renderDatalists(){}

  // ---------- sound (synthesized; needs a tap first) ----------
  let actx=null, noiseBuf=null, soundOn = store.get("tgs-sound")!=="off";
  function audio(){
    try{
      if(!actx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; actx=new AC(); }
      if(actx.state==="suspended") actx.resume();
      if(!noiseBuf){ noiseBuf=actx.createBuffer(1,actx.sampleRate*3,actx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
      return actx;
    }catch(e){ return null; }
  }
  function tone(f,t,dur,type,g,fEnd){
    const a=actx, o=a.createOscillator(), v=a.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t); if(fEnd) o.frequency.exponentialRampToValueAtTime(fEnd,t+dur);
    v.gain.setValueAtTime(0.0001,t); v.gain.exponentialRampToValueAtTime(g,t+0.005); v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(v).connect(a.destination); o.start(t); o.stop(t+dur+0.05);
  }
  function noise(t,dur,ftype,freq,q,g,att,rel,freqEnd){
    const a=actx, src=a.createBufferSource(), f=a.createBiquadFilter(), v=a.createGain();
    src.buffer=noiseBuf; f.type=ftype; f.frequency.setValueAtTime(freq,t); f.Q.value=q;
    if(freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd,t+dur);
    v.gain.setValueAtTime(0.0001,t); v.gain.exponentialRampToValueAtTime(g,t+att); v.gain.setValueAtTime(g,t+Math.max(att,dur-rel)); v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(f).connect(v).connect(a.destination); src.start(t); src.stop(t+dur+0.05);
  }
  // ball into a leather glove
  function glove(t,strength){ const s=strength||1; noise(t,0.07,"lowpass",1400*s,0.8,0.55*s,0.002,0.06); tone(150*s,t,0.09,"sine",0.5*s,70); }
  // light bat tick
  function tick(t){ noise(t,0.035,"bandpass",2600,1.5,0.35,0.002,0.03); tone(320,t,0.04,"triangle",0.12,180); }
  function cash(t){ noise(t,0.04,"highpass",3000,0.7,0.25,0.003,0.03); tone(1318.5,t+0.02,0.14,"triangle",0.3); tone(1760,t+0.1,0.5,"triangle",0.3); tone(2637,t+0.1,0.35,"sine",0.08); }
  function crack(t){ noise(t,0.09,"bandpass",2200,0.9,1.0,0.002,0.07); tone(160,t,0.1,"square",0.25); }
  function cheer(t,dur,g){ noise(t,dur,"bandpass",1100,0.6,g,0.35,dur*0.55); noise(t+0.05,dur,"bandpass",550,0.8,g*0.8,0.45,dur*0.6); for(let i=0;i<6;i++){ const w=t+0.2+Math.random()*(dur*0.6); noise(w,0.18,"bandpass",1800+Math.random()*1400,6,g*0.6,0.02,0.12); } }
  function fanfare(t,notes,step,g){ notes.forEach((f,i)=>{ tone(f,t+i*step,i===notes.length-1?0.9:step*1.3,"sawtooth",g); tone(f*2,t+i*step,i===notes.length-1?0.7:step,"triangle",g*0.4); }); }
  function playTap(kind){
    if(!soundOn) return; const a=audio(); if(!a) return; const t=a.currentTime+0.01;
    if(kind==="on") glove(t,1.15); else if(kind==="off") tick(t); else glove(t,0.85);
  }
  function playSale(combo){
    if(!soundOn) return; const a=audio(); if(!a) return; const t=a.currentTime+0.03;
    if(combo==="grandslam"){ crack(t); noise(t+0.08,0.5,"bandpass",500,1.2,0.25,0.05,0.3,3500); fanfare(t+0.35,[523.25,659.25,783.99,1046.5],0.14,0.09); cheer(t+0.3,3.2,0.35); }
    else if(combo==="homerun"){ crack(t); noise(t+0.08,0.6,"bandpass",400,1.2,0.25,0.05,0.35,3000); cheer(t+0.35,2.2,0.3); }
    else if(combo==="doble"){ cash(t); tone(880,t+0.42,0.12,"square",0.06); tone(1174.7,t+0.54,0.22,"square",0.06); }
    else cash(t);
  }
  function setSound(on){ soundOn=on; $("soundBtn").setAttribute("aria-pressed",on?"true":"false"); $("soundBtn").textContent=on?"🔊 Sonido":"🔇 Sin sonido"; store.set("tgs-sound",on?"on":"off"); }
  setSound(soundOn);
  $("soundBtn").dataset.nosnd="1";
  $("soundBtn").addEventListener("click",()=>{ setSound(!soundOn); if(soundOn){ audio(); playTap("on"); } });
  // a ball sound on every button tap
  document.addEventListener("click",e=>{
    const b=e.target.closest("button,select"); if(!b || b.dataset.nosnd || b.disabled) return;
    if(b.classList.contains("tg")) playTap(b.getAttribute("aria-pressed")==="true"?"on":"off");
    else if(b.type==="submit" && b.id==="saveBtn") audio();
    else playTap();
  });

  // ---------- form ----------
  const form={}; KEYS.forEach(k=>form[k]=false);
  $("toggles").innerHTML = KEYS.map(k=>`<button type="button" class="tg" data-k="${k}" aria-pressed="false"><span class="e" aria-hidden="true">${EMOJI[k]}</span><span class="t">${esc(LABEL[k])}</span><span class="p" data-pts="${k}"></span><span class="ck" aria-hidden="true">✓</span></button>`).join("");
  function updateForm(){
    document.querySelectorAll("[data-pts]").forEach(el=>{ const k=el.dataset.pts; el.textContent=`+${cfg.points[k]} pts${k==="autopay"?" · Activación en TA":k==="activation"?" · Línea nueva":""}`; });
    const sc=txScore(form);
    $("combo").className="combo"+(sc.combo?" on":"")+(sc.combo==="homerun"?" hr":"")+(sc.combo==="grandslam"?" gs":"");
    $("comboBadge").textContent = sc.combo?`${COMBO[sc.combo].toUpperCase()} +${sc.bonus}`:"—";
    $("comboTxt").textContent = sc.combo==="grandslam"?`${sc.n} prioridades con Trade-In en la misma orden.`:sc.combo==="homerun"?(form.tradein?"Agrega una prioridad más para Grand Slam.":"Agrega Trade-In para convertirlo en Grand Slam."):sc.combo==="doble"?"2 prioridades en la misma orden. Una más y es Home Run.":"2 en la misma orden = Doble · 3 = Home Run · Home Run + Trade-In = Grand Slam.";
    $("calcTot").innerHTML = `${sc.total} pts<small>${sc.n?KEYS.filter(k=>form[k]).map(k=>SHORT[k]).join(" + ")+(sc.combo?" + "+COMBO[sc.combo].toUpperCase():""):"Marca lo que se vendió"}</small>`;
  }
  document.querySelectorAll(".tg[data-k]").forEach(b=>b.addEventListener("click",()=>{ const k=b.dataset.k; form[k]=!form[k]; b.setAttribute("aria-pressed",form[k]?"true":"false"); updateForm(); }));
  const todayStr=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  $("fDate").value=todayStr();
  fillSellers();
  fillStores();

  $("form").addEventListener("submit", async e=>{
    e.preventDefault();
    const msg=$("formMsg"); msg.className="msg err";
    const seller=$("fSeller").value, order=$("fOrder").value.trim();
    if(!seller){ msg.textContent="Escoge tu nombre."; $("fSeller").focus(); return; }
    if(!$("fStore").value){ msg.textContent="Escoge la tienda."; $("fStore").focus(); return; }
    if(!order){ msg.textContent="Escribe el número de orden. Es obligatorio para la auditoría."; $("fOrder").focus(); return; }
    if(!KEYS.some(k=>form[k])){ msg.textContent="Marca al menos una prioridad."; return; }
    const dupe=rows.find(r=>normOrder(r.order)===normOrder(order));
    if(dupe){ msg.textContent=`La orden #${order} ya está registrada (${dupe.seller}, ${fmtDate(dupe.date)}). Si es un error, avisa al administrador.`; $("fOrder").focus(); return; }
    if(!sb){ msg.textContent="Sin conexión. Revisa el internet e intenta otra vez."; return; }
    const rec={date:$("fDate").value||todayStr(), order, seller, store:$("fStore").value, notes:$("fNotes").value.trim()};
    KEYS.forEach(k=>rec[k]=!!form[k]);
    const sc=txScore(rec);
    $("saveBtn").disabled=true;
    try{
      const {data,error}=await sb.rpc("gs_add_tx",{p:rec,p_device:device});
      if(error) throw error;
      if(data?.error==="duplicate"){ msg.textContent=`La orden #${order} ya está registrada${data.seller?` (${data.seller})`:""}. Si es un error, avisa al administrador.`; return; }
      if(data?.error==="bad_store"){ msg.textContent="Escoge una tienda de la lista."; return; }
      if(data?.error==="bad_seller"){ msg.textContent="Escoge tu nombre de la lista. Si no apareces, avisa al administrador."; return; }
      if(data?.error==="phone_taken"){ msg.textContent=`🔒 Este celular está vinculado a ${data.seller}. Solo puede registrar ventas de ${data.seller}. Si es un error, pídele al administrador que lo desvincule. Código: ${data.tag}.`; if(SELLERS.includes(data.seller)) $("fSeller").value=data.seller; return; }
      if(data?.error==="device_locked"){ msg.textContent=`🔒 ${seller} ya está vinculado a otro celular. Si cambiaste de celular, pídele al administrador que lo autorice. Código de este celular: ${data.tag}.`; return; }
      if(data?.error){ msg.textContent="No se pudo guardar. Revisa los datos e intenta otra vez."; return; }
      rememberMine(data.id);
      store.set("tgs-last",JSON.stringify({seller:rec.seller,store:rec.store}));
      KEYS.forEach(k=>form[k]=false); document.querySelectorAll(".tg[data-k]").forEach(b=>b.setAttribute("aria-pressed","false"));
      $("fOrder").value=""; $("fNotes").value=""; updateForm();
      playSale(sc.combo);
      msg.className="msg"; msg.textContent=`✓ Guardado: ${rec.seller} · orden #${order} · +${sc.total} pts${data.bound_now?" · 🔒 Tu nombre quedó vinculado a este celular.":""}`;
      refetch();
    }catch(err){ msg.textContent="No se pudo guardar. Revisa el internet e intenta otra vez."; }
    finally{ $("saveBtn").disabled=false; }
  });

  // ---------- admin: audit ----------
  let auditSel=null, pendingDelete=null;
  function renderAudit(st){
    const sel=$("aSeller"), W=winners(st), wmap=new Map(W.filter(w=>w.s).map(w=>[w.s,w]));
    if(auditSel===null) auditSel = W[0].s ? W[0].s.name.toLowerCase() : "__all";
    sel.innerHTML = `<option value="__all">Todas las órdenes</option>` + st.map(s=>{const w=wmap.get(s); return `<option value="${esc(s.name.toLowerCase())}">${s.pos}. ${esc(s.name)} — ${s.total} pts${w?` · ${MEDAL[w.place]} ${money(w.amt)}`:""}</option>`;}).join("");
    if(![...sel.options].some(o=>o.value===auditSel)) auditSel="__all";
    sel.value=auditSel;
    // which sellers each phone registered for
    const byTag=new Map(); rows.forEach(r=>{ if(!r.tag) return; if(!byTag.has(r.tag)) byTag.set(r.tag,new Set()); byTag.get(r.tag).add(r.seller.trim()); });
    const s = st.find(x=>x.name.toLowerCase()===auditSel), txs = s ? s.txs : rows;
    const flag = r => { const f=[]; if(r.date && r.date>cfg.endDate) f.push(["warn","Fecha después del cierre"]);
      const others=[...(byTag.get(r.tag)||[])].filter(n=>n.toLowerCase()!==r.seller.trim().toLowerCase());
      if(others.length) f.push(["warn",`El mismo celular también registró ventas de ${others.join(", ")}`]); return f; };
    let h="";
    if(s){
      const ver=s.txs.filter(r=>r.verified).length, sw=wmap.get(s);
      h+=`<div class="sum"><div><div class="v num" style="color:var(--gold)">${s.total}</div><div class="k">Puntos</div></div><div><div class="v num">${s.txs.length}</div><div class="k">Órdenes</div></div><div><div class="v num" style="color:${ver===s.txs.length?"var(--go)":"var(--wait)"}">${ver}/${s.txs.length}</div><div class="k">Verificadas</div></div></div><div class="alerts">`;
      if(sw) h+=`<div class="alert ok">💵 Hoy cobraría ${money(sw.amt)} (${PLACE[sw.place]} lugar).</div>`;
      const fl=[...new Map(s.txs.flatMap(r=>flag(r).map(x=>[x[1].startsWith("El mismo")?x[1]:`#${r.order}: ${x[1]}`,x]))).entries()];
      fl.forEach(([txt,x])=>h+=`<div class="alert ${x[0]}">⚠️ ${esc(txt)}</div>`);
      if(ver<s.txs.length) { const n=s.txs.length-ver; h+=`<div class="alert warn">${n===1?"Falta 1 orden":`Faltan ${n} órdenes`} por verificar en el sistema.</div>`; }
      else if(!fl.length) h+=`<div class="alert ok">✓ Todas las órdenes verificadas y sin alertas.</div>`;
      h+=`</div><table class="brk"><tbody>`;
      KEYS.forEach(k=>{ if(s[k]) h+=`<tr><td>${esc(LABEL[k])}</td><td class="r num">${s[k]} × ${cfg.points[k]}</td><td class="r num">${s[k]*cfg.points[k]}</td></tr>`; });
      ["doble","homerun","grandslam"].forEach(c=>{ if(s[c]) h+=`<tr><td>${COMBO[c]}${s[c]>1?"s":""}</td><td class="r num">${s[c]} × ${cfg.bonus[c]}</td><td class="r num">${s[c]*cfg.bonus[c]}</td></tr>`; });
      h+=`<tr class="t"><td>Total</td><td></td><td class="r num">${s.total}</td></tr></tbody></table>`;
    } else {
      const ver=rows.filter(r=>r.verified).length;
      h+=`<div class="sum"><div><div class="v num">${rows.length}</div><div class="k">Órdenes</div></div><div><div class="v num" style="color:var(--go)">${ver}</div><div class="k">Verificadas</div></div><div><div class="v num">${st.length}</div><div class="k">Vendedores</div></div></div>`;
    }
    h+=`<div class="rowbtns" style="margin-top:12px"><button class="btn sm" type="button" id="dlSel">⬇ CSV ${s?"de "+esc(s.name):"completo"}</button><button class="btn sm" type="button" id="cpSel">Copiar para Excel</button></div><div class="msg" id="dlMsg" role="status"></div>`;
    $("auditBody").innerHTML=h;
    $("aListTitle").textContent = s ? `Órdenes de ${s.name}` : "Todas las órdenes";
    const q=$("aFilter").value.trim().toLowerCase();
    const list=[...txs].filter(r=>!q||[r.order,r.store,r.notes,r.seller].some(v=>String(v||"").toLowerCase().includes(q))).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||0)-(a.createdAt||0));
    $("aList").innerHTML = list.length ? list.map(r=>{ const f=flag(r);
      return `<div class="ent"><div class="top">${s?"":esc(r.seller)+" · "}<span class="o">#${esc(r.order||"—")}</span> <span class="it ${r.verified?"v":"nv"}">${r.verified?"✓ Verificada":"Sin verificar"}</span></div><div class="p num">+${txScore(r).total}</div>
        <div class="its">${itemsHtml(r)}</div>
        <div class="sub">${esc(fmtDate(r.date))}${r.store?" · "+esc(r.store):""} · Registrada ${esc(fmtTime(r.createdAt))} · Celular ${esc(r.tag||"—")}${r.notes?"<br>📝 "+esc(r.notes):""}${f.length?"<br>"+f.map(x=>`<span style="color:var(--wait)">⚠️ ${esc(x[1])}</span>`).join(" · "):""}</div>
        <div class="acts"><button class="btn sm" type="button" data-ver="${esc(r.id)}">${r.verified?"Quitar verificación":"✓ Marcar verificada"}</button><button class="btn sm danger" type="button" data-del="${esc(r.id)}">${pendingDelete===r.id?"¿Borrar? Toca otra vez":"Borrar"}</button></div></div>`;
    }).join("") : `<div class="hint">Nada que mostrar.</div>`;
    $("dlSel").onclick=()=>exportCsv(txs, s?s.name:"todo");
    $("cpSel").onclick=()=>copyText(toTable(txs).map(r=>r.join("\t")).join("\n"),"dlMsg","Copiado. Pégalo en Excel o Google Sheets.");
  }
  function toTable(txs){
    const head=["Fecha","# Orden","Vendedor","Tienda",...KEYS.map(k=>LABEL[k]),"Combo","Bono combo","Total orden","Verificada","Registrada el","Celular","Notas"];
    const body=[...txs].sort((a,b)=>(a.date||"").localeCompare(b.date||"")).map(r=>{ const sc=txScore(r);
      return [r.date||"",r.order||"",r.seller||"",r.store||"",...KEYS.map(k=>r[k]?"Sí":"No"),sc.combo?COMBO[sc.combo]:"",sc.bonus,sc.total,r.verified?"Sí":"No",r.createdAt?new Date(r.createdAt).toLocaleString("es-US"):"",r.tag||"",r.notes||""]; });
    return [head,...body];
  }
  function exportCsv(txs,label){
    const csv="﻿"+toTable(txs).map(r=>r.map(v=>{const s=String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}).join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    a.download=`grand-slam-auditoria-${label.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-${todayStr()}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }

  // ---------- admin: WhatsApp ----------
  function renderWA(st){
    const e=endInfo(), W=winners(st), t=teamTotals();
    const fecha=new Date().toLocaleDateString("es-US",{weekday:"long",day:"numeric",month:"long"});
    let u=`🏁 *TOTAL GRAND SLAM* — Actualización\n_${fecha}_\n\n🏆 Premios: *${cfg.prizes.map((v,i)=>MEDAL[i]+" "+money(v)).join("  ")}*\n📅 Termina: *${e.label}*\n\n*RANKING*\n`;
    if(!st.length) u+="Todavía no hay puntos. ¡La primera venta marca el ritmo! 💪\n";
    st.forEach(s=>{ u+=`${s.pos<=3?MEDAL[s.pos-1]:s.pos+"."} *${s.name}* — ${s.total} pts${s.grandslam?` · ⭐ ${s.grandslam} GS`:""}\n`; });
    if(st.length) u+=`\n💵 *Si el reto terminara hoy:*\n${W.map(w=>`${MEDAL[w.place]} ${money(w.amt)} → ${w.s?`*${w.s.name}*`:"_puesto libre_"}`).join("\n")}\n`;
    u+=`\n📊 *Equipo:* ${KEYS.map(k=>`${t[k]} ${LABEL[k]}`).join(" · ")} · ${t.doble} Dobles · ${t.homerun} Home Runs · ${t.grandslam} Grand Slams\n\n🔥 ¡A cerrar fuerte!`;
    $("waUpdate").value=u;
    $("waLaunch").value=`🏁 *TOTAL GRAND SLAM*\n_${KEYS.length} prioridades. 3 ganadores._\n\n🏆 Premios:\n${cfg.prizes.map((v,i)=>`${MEDAL[i]} ${PLACE[i]} lugar: *${money(v)}*`).join("\n")}\n📅 Termina: *${e.label}*\n\n*LAS PRIORIDADES*\n${KEYS.map(k=>`${EMOJI[k]} ${LABEL[k]}${SUBLABEL[k]?` (${SUBLABEL[k].toLowerCase()})`:""} → *+${cfg.points[k]} pts*`).join("\n")}\n\n*BONOS POR ORDEN* ⚾\n🔵 DOBLE: 2 prioridades en la misma orden → *+${cfg.bonus.doble} pts*\n🟡 HOME RUN: 3 en la misma orden → *+${cfg.bonus.homerun} pts*\n⭐ GRAND SLAM: Home Run + Trade-In (4 o más en la misma orden, una de ellas Trade-In) → *+${cfg.bonus.grandslam} pts*\n_Cada orden se lleva solo su bono más alto._\n\n🏆 *Ganan los 3 con más puntos.*\n\n📝 Registra cada venta con su *número de orden* en el marcador:\n${location.href.split("#")[0]}\n\nAl cierre se audita todo antes de entregar los premios. ¿Quién se lleva el cash? 💸`;
    $("waWin").value = st.length ? `🏆 *TOTAL GRAND SLAM — GANADORES*\n\n`+W.filter(w=>w.s).map(w=>{const c=w.s, ver=c.txs.filter(r=>r.verified).length;
      return `${MEDAL[w.place]} *${c.name}*${c.store?` (${c.store})`:""} — *${money(w.amt)}*\n⭐ ${c.total} pts · ${c.txs.length} órdenes auditadas (${ver} verificadas)\n${KEYS.filter(k=>c[k]).map(k=>`${EMOJI[k]} ${c[k]} ${LABEL[k]}`).join(" · ")}${c.grandslam?` · ⭐ ${c.grandslam} GS`:""}${c.homerun?` · 🟡 ${c.homerun} HR`:""}${c.doble?` · 🔵 ${c.doble} Dobles`:""}`;}).join("\n\n")+`\n\n¡Felicidades! 👏 Gracias a todo el equipo. Se viene el próximo reto 🔥` : "Todavía no hay ventas registradas.";
  }

  // ---------- admin: settings ----------
  function fillCfgForm(){
    ["cP1","cP2","cP3"].forEach((id,i)=>$(id).value=cfg.prizes[i]??""); $("cEnd").value=cfg.endDate;
    $("cPts").innerHTML=`<span class="h">Prioridad</span><span class="h" style="text-align:center">Pts</span><span></span>`+KEYS.map(k=>`<span>${EMOJI[k]} ${esc(LABEL[k])}</span><input type="number" id="cp-${k}" min="0" max="50" value="${cfg.points[k]}"><span></span>`).join("");
    $("cDoble").value=cfg.bonus.doble; $("cHR").value=cfg.bonus.homerun; $("cGS").value=cfg.bonus.grandslam;
  }
  const adminFail = (s,m) => { m.className="msg err"; m.textContent = s==="locked"?"Demasiados intentos fallidos. Espera 15 minutos.":s==="bad_pin"?"El código ya no es válido. Vuelve a entrar.":"No se pudo guardar. Revisa el internet."; if(s==="bad_pin") setAdmin(null); };
  async function adminCall(fn,args){ const {data,error}=await sb.rpc(fn,{p_pin:adminPin,...args}); if(error) return "error"; return data?.status||"error"; }
  $("cfgForm").addEventListener("submit",async e=>{
    e.preventDefault(); const m=$("cfgMsg");
    const num=id=>Math.max(0,Math.min(50,Math.round(Number($(id).value)||0)));
    const points={}; KEYS.forEach(k=>points[k]=num("cp-"+k));
    const prizes=["cP1","cP2","cP3"].map(id=>Math.round(Number($(id).value)||0)).filter(v=>v>0);
    const s=await adminCall("gs_admin_config",{p_cfg:{prizes:prizes.length?prizes:DEFAULT.prizes,endDate:$("cEnd").value||cfg.endDate,points,bonus:{doble:num("cDoble"),homerun:num("cHR"),grandslam:num("cGS")}}});
    if(s==="ok"){ m.className="msg"; m.textContent="Guardado."; refetch(); } else adminFail(s,m);
  });
  $("pinForm").addEventListener("submit",async e=>{
    e.preventDefault(); const a=$("pNew").value, b=$("pNew2").value, m=$("pinFormMsg");
    if(!/^\d{4}$/.test(a)){ m.className="msg err"; m.textContent="El código debe tener 4 dígitos."; return; }
    if(a!==b){ m.className="msg err"; m.textContent="Los dos códigos no coinciden."; return; }
    const s=await adminCall("gs_admin_set_pin",{p_new:a});
    if(s==="ok"){ setAdmin(a); $("pNew").value=""; $("pNew2").value=""; m.className="msg"; m.textContent="Código cambiado."; } else adminFail(s,m);
  });

  // ---------- PIN / admin session ----------
  function setAdmin(pin){
    adminPin=pin; const on=!!pin;
    $("pinBox").hidden=on; $("adminBox").hidden=!on;
    $("tab-admin").textContent = on?"Admin":"🔒"; $("tab-admin").style.flex = on?"1":"";
    sess.set("tgs-pin", pin);
    if(on){ fillCfgForm(); render(); }
  }
  $("pinIn").addEventListener("input",async()=>{
    const v=$("pinIn").value.replace(/\D/g,"").slice(0,4); $("pinIn").value=v; $("pinMsg").textContent="";
    if(v.length!==4) return;
    if(!sb){ $("pinMsg").textContent="Sin conexión."; return; }
    $("pinIn").disabled=true;
    const {data,error}=await sb.rpc("gs_admin_login",{p_pin:v});
    $("pinIn").disabled=false; $("pinIn").value="";
    const s=error?"error":data?.status;
    if(s==="ok"){ playTap("on"); setAdmin(v); }
    else { $("pinMsg").textContent = s==="locked"?"Demasiados intentos. Espera 15 minutos.":s==="bad_pin"?"Código incorrecto.":"No se pudo verificar. Revisa el internet."; $("pinIn").focus(); }
  });
  $("lockBtn").addEventListener("click",()=>{ setAdmin(null); show("board"); });
  document.querySelectorAll(".subnav button").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".subnav button").forEach(x=>x.setAttribute("aria-selected",x===b?"true":"false"));
    ["audit","team","wa","cfg"].forEach(s=>$("sub-"+s).hidden = s!==b.dataset.sub);
    if(b.dataset.sub==="cfg") fillCfgForm();
    if(b.dataset.sub==="team") loadTeam();
  }));
  $("aSeller").addEventListener("change",()=>{ auditSel=$("aSeller").value; renderAudit(standings(rows)); });
  $("aFilter").addEventListener("input",()=>renderAudit(standings(rows)));

  // ---------- admin: sellers & phones ----------
  let team=[], pendingUnlink=null;
  async function loadTeam(){
    if(!adminPin||!sb) return;
    const {data,error}=await sb.rpc("gs_admin_sellers",{p_pin:adminPin});
    if(error||data?.status!=="ok"){ adminFail(error?"error":data?.status,$("teamMsg")); return; }
    team=data.sellers||[]; renderTeam();
  }
  function renderTeam(){
    const counts=new Map(); rows.forEach(r=>counts.set(r.seller,(counts.get(r.seller)||0)+1));
    const sorted=[...team].sort((a,b)=>(b.active-a.active)||a.name.localeCompare(b.name,"es"));
    $("teamList").innerHTML = sorted.length ? sorted.map(t=>{
      const n=counts.get(t.name)||0, dev=t.devices||[];
      const allow = t.allow_until ? `<span class="it nv">⏳ Puede vincular otro celular hasta ${new Date(t.allow_until).toLocaleTimeString("es-US",{hour:"numeric",minute:"2-digit"})}</span>` : "";
      const devTxt = dev.length ? dev.map(d=>`<span class="it v">📱 ${esc(d.tag)}</span>`).join("") : `<span class="it">Sin celular aún</span>`;
      const nm=esc(t.name);
      return `<div class="ent"${t.active?"":' style="opacity:.55"'}><div class="top">${nm}${t.active?"":' <span class="it">Inactivo</span>'}</div><div class="p num" style="font-size:18px">${n} <small style="font-size:11px;color:var(--muted)">ventas</small></div>
        <div class="its">${devTxt}${allow}</div>
        ${dev.length?`<div class="sub">Vinculado desde ${esc(fmtTime(Date.parse(dev[0].since)))} · último uso ${esc(fmtTime(Date.parse(dev[dev.length-1].last)))}</div>`:""}
        <div class="acts">${t.active?`${dev.length?`<button class="btn sm" type="button" data-team="allow" data-name="${nm}">Autorizar otro celular</button><button class="btn sm danger" type="button" data-team="unlink" data-name="${nm}">${pendingUnlink===t.name?"¿Desvincular? Toca otra vez":"Desvincular"}</button>`:""}<button class="btn sm" type="button" data-team="deactivate" data-name="${nm}">Desactivar</button>`:`<button class="btn sm" type="button" data-team="activate" data-name="${nm}">Activar</button>`}</div></div>`;
    }).join("") : `<div class="hint">No hay vendedores.</div>`;
  }
  $("teamReload").addEventListener("click",loadTeam);
  $("addSellerForm").addEventListener("submit",async e=>{
    e.preventDefault(); const m=$("addSellerMsg"), name=$("newSeller").value.replace(/\s+/g," ").trim();
    if(name.length<3){ m.className="msg err"; m.textContent="Escribe el nombre completo."; return; }
    const s=await adminCall("gs_admin_seller_action",{p_name:name,p_action:"add"});
    if(s==="ok"){ $("newSeller").value=""; m.className="msg"; m.textContent=`${name} agregado.`; loadTeam(); refetch(); } else adminFail(s,m);
  });
  document.addEventListener("click",async e=>{
    const b=e.target.closest("[data-team]"); if(!b||!adminPin) return;
    const act=b.dataset.team, name=b.dataset.name, m=$("teamMsg");
    if(act==="unlink" && pendingUnlink!==name){ pendingUnlink=name; renderTeam(); setTimeout(()=>{ if(pendingUnlink===name){ pendingUnlink=null; renderTeam(); } },4000); return; }
    pendingUnlink=null; b.disabled=true;
    const s=await adminCall("gs_admin_seller_action",{p_name:name,p_action:act});
    if(s==="ok"){ m.className="msg"; m.textContent = act==="allow"?`${name} puede guardar desde un celular nuevo durante 30 minutos.`:act==="unlink"?`${name} quedó sin celular. El próximo celular con el que guarde quedará vinculado.`:act==="deactivate"?`${name} ya no aparece en la lista de vendedores.`:`${name} vuelve a aparecer en la lista.`; await loadTeam(); refetch(); }
    else adminFail(s,m);
  });

  // ---------- row actions ----------
  document.addEventListener("click",async e=>{
    const del=e.target.closest("[data-del]");
    if(del && adminPin){
      const id=del.dataset.del;
      if(pendingDelete!==id){ pendingDelete=id; renderAudit(standings(rows)); setTimeout(()=>{ if(pendingDelete===id){ pendingDelete=null; if(adminPin) renderAudit(standings(rows)); } },4000); return; }
      pendingDelete=null;
      const s=await adminCall("gs_admin_remove",{p_id:id});
      if(s==="ok"){ rows=rows.filter(r=>r.id!==id); render(); refetch(); } else adminFail(s,$("dlMsg"));
      return;
    }
    const undo=e.target.closest("[data-undo]");
    if(undo && sb){
      const {data}=await sb.rpc("gs_undo_tx",{p_id:undo.dataset.undo,p_device:device});
      const m=$("formMsg");
      if(data?.ok){ rows=rows.filter(r=>r.id!==undo.dataset.undo); render(); m.className="msg"; m.textContent="Venta deshecha."; refetch(); }
      else { m.className="msg err"; m.textContent="Ya pasaron los 10 minutos. Pídele al administrador que la borre."; }
      return;
    }
    const ver=e.target.closest("[data-ver]");
    if(ver && adminPin){
      const r=rows.find(x=>x.id===ver.dataset.ver); if(!r) return;
      const s=await adminCall("gs_admin_verify",{p_id:r.id,p_val:!r.verified});
      if(s==="ok"){ r.verified=!r.verified; render(); } else adminFail(s,$("dlMsg"));
    }
  });

  // ---------- tabs ----------
  function show(view){
    document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-selected",b.dataset.view===view?"true":"false"));
    ["board","log","admin"].forEach(v=>$("view-"+v).hidden = v!==view);
    if(view==="admin" && !adminPin) setTimeout(()=>$("pinIn").focus(),50);
    store.set("tgs-tab", view==="admin"?"board":view);
    window.scrollTo(0,0);
  }
  document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));
  if(store.get("tgs-tab")==="log" || location.hash==="#registrar") show("log");

  $("captureBtn").addEventListener("click",()=>{
    document.body.classList.add("capture"); window.scrollTo(0,0);
    const x=document.createElement("button"); x.className="btn sm"; x.textContent="Salir del modo captura";
    x.style.cssText="position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));opacity:.4;z-index:40";
    x.onclick=()=>{ document.body.classList.remove("capture"); x.remove(); }; document.body.appendChild(x);
  });
  function copyText(text,msgId,okMsg){
    const m=$(msgId);
    const fallback=()=>{ const ta=document.createElement("textarea"); ta.value=text; ta.style.cssText="position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); let ok=false; try{ ok=document.execCommand("copy"); }catch(e){} ta.remove(); m.className=ok?"msg":"msg err"; m.textContent=ok?okMsg:"No se pudo copiar automáticamente."; };
    try{ navigator.clipboard.writeText(text).then(()=>{ m.className="msg"; m.textContent=okMsg; }).catch(fallback); }catch(e){ fallback(); }
  }
  $("copyUpd").addEventListener("click",()=>copyText($("waUpdate").value,"copyUpdMsg","Copiado. Pégalo en WhatsApp."));
  $("copyLaunch").addEventListener("click",()=>copyText($("waLaunch").value,"copyLaunchMsg","Copiado. Pégalo en WhatsApp."));
  $("copyWin").addEventListener("click",()=>copyText($("waWin").value,"copyWinMsg","Copiado. Pégalo en WhatsApp."));

  updateForm(); render();

  // ---------- data ----------
  let fetching=false, again=false;
  async function refetch(){
    if(!sb) return; if(fetching){ again=true; return; } fetching=true;
    try{
      const sl=await sb.from("gs_sellers").select("name").eq("active",true);
      if(!sl.error && sl.data){ const names=sl.data.map(x=>x.name).sort((a,b)=>a.localeCompare(b,"es")); if(names.join("|")!==SELLERS.join("|")){ SELLERS=names; fillSellers(); } }
      const st=await sb.from("gs_stores").select("name,sort").order("sort");
      if(!st.error && st.data?.length){ const names=st.data.map(x=>x.name); if(names.join("|")!==STORES.join("|")){ STORES=names; fillStores(); } }
      const [tx,cf]=await Promise.all([ sb.from("gs_tx").select(COLS).order("created_at",{ascending:false}).limit(5000), sb.from("gs_config").select("prizes,end_date,points,bonus").eq("id",1).maybeSingle() ]);
      if(tx.error||cf.error) throw tx.error||cf.error;
      rows=tx.data.map(mapRow); cfg=mergeCfg(cf.data); dbState="live"; updateForm(); render();
    }catch(e){ dbState = rows.length?"live":"off"; if(!rows.length) render(); else renderBanners(); }
    fetching=false; if(again){ again=false; refetch(); }
  }
  function init(){
    if(!window.supabase){ dbState="off"; render(); return; }
    sb = window.supabase.createClient(SB_URL, SB_KEY, {auth:{persistSession:false}});
    const saved=sess.get("tgs-pin"); if(saved) setAdmin(saved);
    refetch();
    try{ sb.channel("gs-live").on("postgres_changes",{event:"*",schema:"public",table:"gs_tx"},()=>refetch()).on("postgres_changes",{event:"*",schema:"public",table:"gs_config"},()=>refetch()).subscribe(); }catch(e){}
    setInterval(refetch, 30000);
    document.addEventListener("visibilitychange",()=>{ if(!document.hidden) refetch(); });
  }
  init();
  setInterval(()=>{ renderBoard(standings(rows)); renderRecent(); },60000);
})();
