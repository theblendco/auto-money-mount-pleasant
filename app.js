(function(){
  "use strict";
  var KEY = "auto-money-mtpleasant-demo-v1";
  var TOTAL = 10;
  var CATS = ["Car","Truck","SUV","Van","Motorcycle","Other"];
  var WEEKDAY_TIMES = ["9:30 AM","11:00 AM","1:00 PM","3:30 PM"];
  var SAT_TIMES = ["11:00 AM","1:00 PM","3:30 PM"];
  function timesFor(d){ return (d && d.getDay() === 6) ? SAT_TIMES : WEEKDAY_TIMES; }
  var CAPS = [
    ["They raise a hand","A customer taps Get cash today on IG or the website, or gets a text back after a missed store call."],
    ["Instant reply","A text and email go out right away with one button: Start my estimate."],
    ["Quick form","Name, vehicle type, year/make/model, mileage, city and best phone."],
    ["Nearest store","The Mount Pleasant store on Johnnie Dodds Blvd. They see the address, hours and a tap-to-call number."],
    ["Car photos","Guided shots: front, back, both sides, odometer, VIN plate and title."],
    ["Your car's estimate","The store reviews the photos and confirms the amount. No numbers shown online."],
    ["E-signature","They sign the request on their phone. The application is finished in store."],
    ["What to bring","A tap-to-check list: title, ID, income, residence, registration, insurance, spare key."],
    ["Book store visit","They pick a time during Mount Pleasant hours: Mon–Fri 9am–6pm, Sat 10am–4pm. Closed Sunday."],
    ["Store view","A new application lands at the Mount Pleasant store with photos, details and the store checklist started."]
  ];
  // Mount Pleasant-only demo. Store tuple: [store name, city, phone]
  var STORE = {
    addr: "796 Johnnie Dodds Blvd, Suite A",
    cityline: "Mount Pleasant, SC 29464",
    hours: "Mon–Fri 9am–6pm, Sat 10am–4pm, Sun closed",
    maps: "https://maps.google.com/?q=796+Johnnie+Dodds+Blvd+Suite+A+Mount+Pleasant+SC+29464",
    landmark: "On the frontage road south of Chick-fil-A in Lafayette Village · Spanish available",
    tel: "tel:+18433880513",
    phone: "843-388-0513"
  };
  var METROS = [
    {k:"Charleston",st:"SC",keys:["charleston","summerville","goose creek","moncks corner","ladson","hanahan","mt pleasant","mount pleasant","west ashley","james island","johns island","ridgeville","st george","walterboro","294"],s:[["Mount Pleasant","Mount Pleasant","843-388-0513"]]}
  ];
  var SHOTS = [["front","Front"],["back","Back"],["dside","Driver side"],["pside","Passenger side"],["odo","Odometer (mileage)"],["vin","VIN plate"],["title","Your title"]];
  // Example photos (real, freely licensed; see brand/PHOTO_CREDITS.md). Title never has an example.
  var EX = {front:"ex-front.jpg",back:"ex-back.jpg",dside:"ex-dside.jpg",pside:"ex-pside.jpg",odo:"ex-odo.jpg",vin:"ex-vin.jpg"};
  function src(v){ return v && v.indexOf("ex:") === 0 ? v.slice(3) : v; }
  var DOCS = ["Lien-free title in your name","Government-issued ID","Proof of income (recent pay stub)","Proof of residence (utility bill)","Current registration","Proof of insurance","Spare key","Your vehicle"];

  // ---------- state ----------
  function fresh(){ return {step:1,name:"",cat:"",veh:"",miles:"",area:"",email:"",phone:"",store:"",photos:{},sig:"",agree:false,docs:[],day:"",time:""}; }
  var state = (function(){ try{ var s = JSON.parse(localStorage.getItem(KEY)); if(s && typeof s === "object"){ s = Object.assign(fresh(), s); if(!s.photos || typeof s.photos !== "object") s.photos = {}; if(!Array.isArray(s.docs)) s.docs = []; return s; } }catch(e){} return fresh(); })();
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  var $ = function(id){ return document.getElementById(id); };
  var screens = [].slice.call(document.querySelectorAll(".screen"));
  var scroller = $("screens");

  // ---------- helpers ----------
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  function fmtDate(d, o){ return d.toLocaleDateString("en-US", o || {month:"short", day:"numeric", year:"numeric"}); }
  function firstName(){ return state.name.trim().split(/\s+/)[0] || ""; }
  function metro(){ return METROS[0]; }
  function isNC(){ return false; }
  function curMetro(){ return METROS[0]; }
  function storeObj(){ var m = curMetro(), all = METROS.reduce(function(a, x){ return a.concat(x.s.map(function(s){ return {s:s, st:x.st}; })); }, []); for(var i = 0; i < all.length; i++){ if(all[i].s[0] === state.store) return all[i]; } return {s:m.s[0], st:m.st}; }
  function product(){ return storeObj().st === "GA" ? "title pawn" : "title loan"; }
  function milesNum(){ var d = (state.miles || "").replace(/[^\d]/g, ""); return d ? (+d).toLocaleString("en-US") : ""; }
  function vehName(){ return state.veh.trim() || (state.cat || "Your vehicle"); }
  function photoCount(){ return SHOTS.filter(function(s){ var v = state.photos[s[0]]; return v && v !== "skip"; }).length; }
  function telOf(p){ return "tel:+1" + p.replace(/\D/g, ""); }
  function iso(d){ return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2); }
  function parseIso(v){ var a = (v||"").split("-"); return a.length === 3 ? new Date(+a[0], +a[1]-1, +a[2], 12) : null; }
  function today(){ var d = new Date(); d.setHours(12,0,0,0); return d; }

  // ---------- navigation ----------
  function go(n, opts){
    opts = opts || {};
    n = Math.max(1, Math.min(TOTAL, n));
    var rev = n < state.step;
    state.step = n; save();
    screens.forEach(function(s){
      var on = +s.dataset.step === n;
      s.classList.toggle("active", on);
      s.classList.toggle("rev", on && rev && !opts.initial);
      if(on) $("clock").textContent = s.dataset.time;
    });
    $("stepnum").textContent = "Step " + n + " of " + TOTAL;
    $("backBtn").classList.toggle("hide", n === 1);
    $("capNum").textContent = n; $("capT").textContent = CAPS[n-1][0]; $("capD").textContent = CAPS[n-1][1];
    render(n);
    scroller.scrollTop = 0;
    if(!opts.initial){ window.scrollTo(0,0); }
  }
  document.addEventListener("click", function(e){
    if(e.target.closest("[data-next]")) go(state.step + 1);
    else if(e.target.closest("[data-prev]")) go(state.step - 1);
  });
  $("backBtn").addEventListener("click", function(){ go(state.step - 1); });

  // ---------- errors ----------
  function setErr(id, msg, target){
    msg = ""; // click-through demo: no validation errors
    var p = $("e-" + id); if(p) p.textContent = msg || "";
    if(target){ target.classList.toggle("invalid", !!msg); if(target.tagName === "INPUT" || target.tagName === "TEXTAREA"){ if(msg){ target.setAttribute("aria-invalid","true"); target.setAttribute("aria-describedby","e-"+id); } else target.removeAttribute("aria-invalid"); } }
  }

  // ---------- 3 intake ----------
  var F = {name:$("f-name"), veh:$("f-veh"), miles:$("f-miles"), area:$("f-area"), email:$("f-email"), phone:$("f-phone")};
  function digits(s){ return (s||"").replace(/\D/g,""); }
  function fmtPhone(s){
    var d = digits(s); if(d.length === 11 && d[0] === "1") d = d.slice(1); d = d.slice(0,10);
    if(d.length < 4) return d;
    if(d.length < 7) return "(" + d.slice(0,3) + ") " + d.slice(3);
    return "(" + d.slice(0,3) + ") " + d.slice(3,6) + "-" + d.slice(6);
  }
  var checks = {
    name:function(){ return state.name.trim().length < 2 ? "Add your name." : ""; },
    cat:function(){ return !state.cat ? "Pick your vehicle type." : ""; },
    veh:function(){ return state.veh.trim().length < 3 ? "Add the year, make and model." : ""; },
    miles:function(){ var v = state.miles.trim(); if(!v) return ""; var d = +v.replace(/[^\d]/g, ""); return (d >= 1 && d <= 999999) ? "" : "Enter a rough number, like 247,000."; },
    area:function(){ return state.area.trim().length < 3 ? "Add your city or ZIP." : ""; },
    email:function(){ var v = state.email.trim(); return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter an email like you@example.com."; },
    phone:function(){ var d = digits(state.phone); if(d.length === 11 && d[0] === "1") d = d.slice(1); return d.length === 10 ? "" : "Enter a 10-digit phone number."; }
  };
  Object.keys(F).forEach(function(k){
    var inp = F[k];
    inp.addEventListener("input", function(){
      if(k === "phone") inp.value = fmtPhone(inp.value);
      state[k] = inp.value; if(k === "area") state.store = ""; save();
      if(checks[k] && inp.classList.contains("invalid")) setErr(k, checks[k](), inp);
    });
    inp.addEventListener("blur", function(){ if(checks[k] && inp.value) setErr(k, checks[k](), inp); });
  });
  function buildCats(){
    var box = $("catChips"); box.innerHTML = "";
    CATS.forEach(function(c){
      var b = el("button", "chip", c); b.type = "button"; b.setAttribute("role","radio");
      b.setAttribute("aria-checked", state.cat === c ? "true" : "false");
      b.addEventListener("click", function(){
        state.cat = c; save();
        [].forEach.call(box.children, function(x){ x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        setErr("cat", "", box);
      });
      box.appendChild(b);
    });
  }
  $("intake").addEventListener("submit", function(e){
    e.preventDefault();
    var first = null;
    ["name","cat","veh","miles","area","phone","email"].forEach(function(k){
      var m = checks[k](); setErr(k, m, k === "cat" ? $("catChips") : F[k]);
      if(m && !first) first = k;
    });
    go(4);
  });

  // ---------- 4 store ----------
  function buildStores(){
    $("storeOk").hidden = false; $("storeNc").hidden = true;
    var m = METROS[0], list = m.s.slice();
    if(!state.store || !list.some(function(s){ return s[0] === state.store; })){ state.store = list[0][0]; save(); }
    $("storeSub").textContent = "Title loans \u00b7 Auto Money \u00b7 Mount Pleasant";
    var box = $("stores"); box.innerHTML = "";
    list.forEach(function(s){
      var on = s[0] === state.store;
      var b = el("button", "slot radio store" + (on ? " on" : "")); b.type = "button"; b.setAttribute("role","radio"); b.setAttribute("aria-checked", on);
      b.appendChild(el("span","rad"));
      var t = el("span","st"); t.appendChild(el("b", null, s[0]));
      t.appendChild(el("span", "sm2", STORE.addr));
      t.appendChild(el("span", "sm2", STORE.cityline));
      t.appendChild(el("span", "hrs", STORE.hours));
      t.appendChild(el("span", "hrs", STORE.landmark));
      b.appendChild(t);
      b.addEventListener("click", function(){ state.store = s[0]; save(); setErr("store",""); buildStores(); });
      box.appendChild(b);
      if(on){
        var a = el("a", "call", "Call the Mount Pleasant store \u00b7 " + STORE.phone); a.href = STORE.tel; box.appendChild(a);
        var d = el("a", "dirs", "Get directions"); d.href = STORE.maps; d.target = "_blank"; d.rel = "noopener"; box.appendChild(d);
      }
    });
  }
  $("storeBtn").addEventListener("click", function(){ if(!state.store){ state.store = METROS[0].s[0][0]; save(); } go(5); });

  // ---------- 5 photos ----------
  function thumb(file, cb){
    var r = new FileReader();
    r.onload = function(){
      var img = new Image();
      img.onload = function(){ var c = document.createElement("canvas"), s = 220 / Math.max(img.width, img.height); c.width = Math.round(img.width * Math.min(1, s)); c.height = Math.round(img.height * Math.min(1, s)); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", .72)); };
      img.onerror = function(){ cb(""); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }
  function buildShots(){
    var box = $("shots"); box.innerHTML = "";
    SHOTS.forEach(function(sh){
      var v = state.photos[sh[0]], has = v && v !== "skip";
      var card = el("div", "shot" + (has ? " has" : v === "skip" ? " skipped" : ""));
      var lab = el("label", "pick"); lab.setAttribute("aria-label", "Take photo: " + sh[1]);
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture","environment"); inp.id = "ph-" + sh[0]; inp.className = "file";
      inp.addEventListener("change", function(){ var f = inp.files && inp.files[0]; if(!f) return; thumb(f, function(d){ state.photos[sh[0]] = d || "skip"; save(); buildShots(); }); });
      lab.appendChild(inp);
      if(has){ var im = el("img"); im.src = src(v); im.alt = sh[1] + " photo"; lab.appendChild(im); lab.appendChild(el("span","ok","\u2713")); }
      else { if(EX[sh[0]] && v !== "skip"){ var gi = el("img","guide"); gi.src = EX[sh[0]]; gi.alt = ""; lab.appendChild(gi); lab.appendChild(el("span","exb","Example")); } var ic = document.createElementNS("http://www.w3.org/2000/svg","svg"); ic.setAttribute("class","camic"); var u = document.createElementNS("http://www.w3.org/2000/svg","use"); u.setAttribute("href","#i-cam"); ic.appendChild(u); lab.appendChild(ic); if(v === "skip") lab.appendChild(el("span","sk","Skipped")); }
      card.appendChild(lab);
      var row = el("div","shotrow"); row.appendChild(el("span","sn",sh[1]));
      var sk = el("button","skip", has ? "Retake" : v === "skip" ? "Undo" : "Skip"); sk.type = "button";
      sk.addEventListener("click", function(){ if(has){ inp.click(); return; } if(v === "skip") delete state.photos[sh[0]]; else state.photos[sh[0]] = "skip"; save(); buildShots(); });
      row.appendChild(sk); card.appendChild(row);
      box.appendChild(card);
    });
    var n = photoCount(), done = SHOTS.filter(function(s){ return state.photos[s[0]]; }).length;
    $("photoCount").textContent = n + " of " + SHOTS.length + " taken";
    $("photosBtn").textContent = n ? "Send my photos" : done === SHOTS.length ? "Continue without photos" : "Send my photos";
  }
  $("photosBtn").addEventListener("click", function(){ go(6); });
  $("exBtn").addEventListener("click", function(){ SHOTS.forEach(function(sh){ var v = state.photos[sh[0]]; if(!v || v === "skip" || v.indexOf("ex:") === 0) state.photos[sh[0]] = EX[sh[0]] ? "ex:" + EX[sh[0]] : "skip"; }); save(); buildShots(); });

  // ---------- 6 pdf ----------
  $("pdfBtn").addEventListener("click", function(){ window.print(); });

  // ---------- 7 signature ----------
  var cv = $("sig"), ctx = cv.getContext("2d"), drawing = false, hasInk = !!state.sig, last = null;
  function sizeCanvas(){
    var r = cv.getBoundingClientRect(); if(!r.width) return;
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1d1d1f"; ctx.lineWidth = 2.6;
    if(state.sig){ var img = new Image(); img.onload = function(){ ctx.drawImage(img, 0, 0, r.width, r.height); }; img.src = state.sig; }
    $("sigHint").classList.toggle("gone", hasInk);
  }
  function pt(e){ var r = cv.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; }
  cv.addEventListener("pointerdown", function(e){
    e.preventDefault(); drawing = true; last = pt(e);
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, Math.PI*2); ctx.fillStyle = "#1d1d1f"; ctx.fill();
    if(!hasInk){ hasInk = true; $("sigHint").classList.add("gone"); }
  });
  cv.addEventListener("pointermove", function(e){
    if(!drawing) return; e.preventDefault();
    var p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y);
    var mx = (last.x + p.x)/2, my = (last.y + p.y)/2;
    ctx.quadraticCurveTo(last.x, last.y, mx, my); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
  });
  function endStroke(){ if(!drawing) return; drawing = false; state.sig = cv.toDataURL("image/png"); save(); setErr("sig", "", $("sigbox")); }
  cv.addEventListener("pointerup", endStroke); cv.addEventListener("pointercancel", endStroke); cv.addEventListener("pointerleave", endStroke);
  $("clearSig").addEventListener("click", function(){ ctx.clearRect(0,0,cv.width,cv.height); state.sig = ""; hasInk = false; save(); $("sigHint").classList.remove("gone"); });
  $("f-agree").addEventListener("change", function(){ state.agree = this.checked; save(); if(this.checked) setErr("agree",""); });
  function tab(which){
    var sign = which === "sign";
    $("tabSign").setAttribute("aria-selected", sign); $("tabReview").setAttribute("aria-selected", !sign);
    $("paneSign").hidden = !sign; $("paneReview").hidden = sign;
    if(sign) requestAnimationFrame(sizeCanvas);
  }
  $("tabSign").addEventListener("click", function(){ tab("sign"); });
  $("tabReview").addEventListener("click", function(){ tab("review"); });
  $("toSign").addEventListener("click", function(){ tab("sign"); });
  $("signForm").addEventListener("submit", function(e){
    e.preventDefault(); var ok = true;
    if(ok) go(8);
  });
  var rt; window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ if(state.step === 7 && !$("paneSign").hidden) sizeCanvas(); }, 150); });

  // ---------- 8 what to bring ----------
  function buildDocs(){
    var box = $("docs"); box.innerHTML = "";
    DOCS.forEach(function(d, i){
      var on = state.docs.indexOf(i) > -1;
      var b = el("button", "slot doc" + (on ? " on" : "")); b.type = "button"; b.setAttribute("role","checkbox"); b.setAttribute("aria-checked", on);
      var bx = el("span", "bx" + (on ? " d" : "")); bx.innerHTML = '<svg><use href="#i-check"/></svg>'; b.appendChild(bx); b.appendChild(el("span", null, d));
      b.addEventListener("click", function(){ var k = state.docs.indexOf(i); if(k > -1) state.docs.splice(k, 1); else state.docs.push(i); save(); buildDocs(); });
      box.appendChild(b);
    });
    $("docNote").textContent = state.docs.length + " of " + DOCS.length + " ready \u00b7 The store will go over anything missing.";
  }

  // ---------- 9 calendar ----------
  var monthOffset = 0;
  function bookable(d){ var t = today(); var max = new Date(t); max.setDate(max.getDate() + 45); var w = d.getDay(); return d > t && d <= max && w !== 0; }
  function firstOpenDay(){ var d = today(); for(var i = 0; i < 60; i++){ d.setDate(d.getDate() + 1); if(bookable(d)) return iso(d); } return iso(today()); }
  function buildCal(){
    var t = today(), base = new Date(t.getFullYear(), t.getMonth() + monthOffset, 1, 12);
    $("monthLbl").textContent = base.toLocaleDateString("en-US", {month:"long", year:"numeric"});
    $("prevM").disabled = monthOffset === 0; $("nextM").disabled = monthOffset >= 1;
    var g = $("cal"); g.innerHTML = "";
    ["S","M","T","W","T","F","S"].forEach(function(d){ g.appendChild(el("div","dw",d)); });
    var days = new Date(base.getFullYear(), base.getMonth()+1, 0).getDate();
    var startDn = 1;
    if(monthOffset === 0){ var ws = new Date(t); ws.setDate(t.getDate() - t.getDay() - 7); if(ws.getMonth() === t.getMonth()) startDn = ws.getDate(); }
    var lead = new Date(base.getFullYear(), base.getMonth(), startDn).getDay();
    for(var i = 0; i < lead; i++) g.appendChild(el("span","e",""));
    for(var dn = startDn; dn <= days; dn++){
      var d = new Date(base.getFullYear(), base.getMonth(), dn, 12), id = iso(d);
      if(bookable(d)){
        var b = el("button", null, dn); b.type = "button"; b.dataset.d = id;
        b.setAttribute("aria-pressed", state.day === id ? "true" : "false");
        b.setAttribute("aria-label", fmtDate(d, {weekday:"long", month:"long", day:"numeric"}));
        b.addEventListener("click", function(){ state.day = this.dataset.d; save(); setErr("day",""); buildCal(); buildSlots(); });
        g.appendChild(b);
      } else {
        var s = el("span", "x" + (iso(t) === id ? " today" : ""), dn); s.setAttribute("aria-hidden","true"); g.appendChild(s);
      }
    }
  }
  function buildSlots(){
    var d = parseIso(state.day);
    $("dayLbl").textContent = d ? fmtDate(d, {weekday:"long", month:"short", day:"numeric"}) : "Pick a day, then a time";
    var box = $("slots"); box.innerHTML = "";
    var times = d ? timesFor(d) : WEEKDAY_TIMES;
    if(state.time && times.indexOf(state.time) < 0){ state.time = ""; save(); }
    times.forEach(function(t){
      var b = el("button", "slot radio" + (state.time === t ? " on" : "")); b.type = "button"; b.setAttribute("role","radio"); b.setAttribute("aria-checked", state.time === t);
      b.appendChild(el("span","rad")); b.appendChild(document.createTextNode(t));
      b.addEventListener("click", function(){ state.time = t; save(); setErr("time",""); buildSlots(); });
      box.appendChild(b);
    });
  }
  $("prevM").addEventListener("click", function(){ if(monthOffset > 0){ monthOffset--; buildCal(); } });
  $("nextM").addEventListener("click", function(){ if(monthOffset < 1){ monthOffset++; buildCal(); } });
  $("bookBtn").addEventListener("click", function(){
    var ok = true;
    if(!state.day || !bookable(parseIso(state.day))) state.day = firstOpenDay();
    var times = timesFor(parseIso(state.day));
    if(!state.time || times.indexOf(state.time) < 0) state.time = times[0];
    save();
    if(ok) go(10);
  });

  // ---------- 10 ----------
  $("folderBtn").addEventListener("click", function(){ $("toast").hidden = false; });
  $("restart").addEventListener("click", function(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    state = fresh(); hasInk = false; monthOffset = 0; hydrate();
    document.querySelectorAll(".invalid").forEach(function(x){ x.classList.remove("invalid"); });
    document.querySelectorAll(".err").forEach(function(x){ x.textContent = ""; });
    $("toast").hidden = true;
    go(1);
  });

  // ---------- per-screen fill ----------
  function render(n){
    var who = state.name.trim() || "New customer", mi = milesNum(), so = storeObj();
    if(n === 2){
      $("hiLine").textContent = firstName() ? "Hi " + firstName() + "," : "Hi there,";
      $("toLine").textContent = "to " + (firstName() || "you") + " \u00b7 just now";
    }
    if(n === 4) buildStores();
    if(n === 5) buildShots();
    if(n === 6){
      var pr = $("prepared"); pr.textContent = "";
      pr.appendChild(document.createTextNode("Prepared for " + (state.name.trim() || "you"))); pr.appendChild(el("br"));
      pr.appendChild(document.createTextNode((so.st === "GA" ? "Title pawn" : "Title loan") + " \u00b7 " + fmtDate(today())));
      $("vehLine").textContent = vehName() + (mi ? ", " + mi + " mi" : "");
      $("photoLine").textContent = photoCount() + " of " + SHOTS.length;
      $("storeLine").textContent = so.s[0] + " \u00b7 " + STORE.addr;
    }
    if(n === 7){
      $("signName").textContent = state.name.trim() || "Your name";
      $("signDate").textContent = fmtDate(today());
      $("f-agree").checked = !!state.agree;
      requestAnimationFrame(sizeCanvas);
    }
    if(n === 8) buildDocs();
    if(n === 9){
      $("withLine").textContent = "At " + so.s[0] + ", " + STORE.addr + " \u00b7 Bring your car and title.";
      if(state.day){ var dd = parseIso(state.day); if(!dd || !bookable(dd)) { state.day = ""; save(); } else { var t = today(); monthOffset = (dd.getFullYear() - t.getFullYear()) * 12 + dd.getMonth() - t.getMonth(); } }
      buildCal(); buildSlots();
    }
    if(n === 10){
      $("barTxt").textContent = so.s[0];
      $("cBiz").textContent = who;
      $("cMeta").textContent = [vehName(), mi ? mi + " mi" : "", product()].filter(Boolean).join(" \u00b7 ");
      if($("cLoc")) $("cLoc").textContent = STORE.addr + " \u00b7 " + STORE.hours;
      var tb = $("cThumbs"); tb.innerHTML = "";
      SHOTS.forEach(function(s){ var v = state.photos[s[0]]; if(v && v !== "skip"){ var im = el("img"); im.src = src(v); im.alt = s[1]; tb.appendChild(im); } });
      tb.hidden = !tb.children.length;
      var pc = photoCount(); $("cPhotos").lastChild.textContent = " " + pc + " photo" + (pc === 1 ? "" : "s");
      var d = parseIso(state.day);
      $("cCall").textContent = d ? "Visit " + fmtDate(d, {weekday:"short"}) + " " + state.time.replace(":00","") : "Visit booked";
    }
  }

  function hydrate(){
    Object.keys(F).forEach(function(k){ F[k].value = state[k] || ""; });
    buildCats();
    $("f-agree").checked = !!state.agree;
    ctx.clearRect(0,0,cv.width,cv.height); $("sigHint").classList.toggle("gone", hasInk);
    tab("sign");
  }

  hydrate();
  go(state.step || 1, {initial:true});
})();
