/* =========================================================
   Little Ayyappa Swamy — cursor companion
   - Walks after the mouse pointer with a REAL 4-frame walk
     cycle (stride A -> pass -> stride B -> pass) played at
     footfall rate, so the legs genuinely alternate. The body
     bobs & sways once per step, squashes on landing, leans
     into the run and takes bigger little hops up/down.
   - Follow uses a soft spring (the qtology Little-Ganesha
     feel): accelerates from a stop, brakes with a gentle
     settle instead of sliding like a sticker.
   - Stops beside the cursor -> stands -> blesses (with a
     "Swamiye Sharanam Ayyappa" bubble) -> sits down & waves
   - Never blocks clicks (pointer-events: none)
   - Hidden on phones/tablets and for "reduce motion" users
   Images: /assets/buddy/ayyappa-{walka,passa,walkb,passb,
           stand,bless,sit}.webp
   ========================================================= */
(function () {
  "use strict";
  if (window.__ssBuddy) return;
  window.__ssBuddy = true;

  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  if (!mq("(hover: hover) and (pointer: fine)")) return;      // phones / tablets: off
  if (mq("(prefers-reduced-motion: reduce)")) return;         // accessibility: off

  var BASE = "/assets/buddy/ayyappa-";
  // the walk cycle, in order: leg A leads -> passing -> leg B leads -> passing
  var WALK = [BASE + "walka.webp", BASE + "passa.webp", BASE + "walkb.webp", BASE + "passb.webp"];
  var POSES = {               // CSS size of each pose (px)
    walk:  { w: 55, h: 110 },
    stand: { w: 46, h: 120 },
    bless: { w: 45, h: 120 },
    sit:   { w: 59, h: 92 }
  };
  var SAY = {
    en: "Swamiye Sharanam Ayyappa 🙏",
    te: "స్వామియే శరణం అయ్యప్ప 🙏",
    hi: "स्वामिये शरणम् अय्यप्पा 🙏",
    ml: "സ്വാമിയേ ശരണം അയ്യപ്പാ 🙏",
    kn: "ಸ್ವಾಮಿಯೇ ಶರಣಂ ಅಯ್ಯಪ್ಪ 🙏",
    ta: "சுவாமியே சரணம் ஐயப்பா 🙏"
  };

  /* ---------- styles ---------- */
  var css = document.createElement("style");
  css.textContent =
    "#ssBuddy{position:fixed;left:0;top:0;z-index:99990;pointer-events:none;will-change:transform;opacity:0;transition:opacity .5s}" +
    "#ssBuddy.on{opacity:1}" +
    "#ssBuddy.dim{opacity:.28}" +
    "#ssBuddy .bd-body{position:absolute;left:0;bottom:0;transform-origin:50% 100%}" +
    "#ssBuddy img{display:block;width:100%;height:100%;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35));-webkit-user-drag:none;user-select:none}" +
    "#ssBuddy .bd-shadow{position:absolute;left:-24px;bottom:-4px;width:48px;height:10px;border-radius:50%;" +
      "background:radial-gradient(ellipse at center,rgba(0,0,0,.32) 0%,rgba(0,0,0,0) 70%)}" +
    "#ssBuddy .bd-say{position:absolute;bottom:124px;left:0;transform:translateX(-50%) scale(.6);opacity:0;" +
      "white-space:nowrap;font:700 12px/1.2 'Noto Sans','Noto Sans Telugu',system-ui,sans-serif;color:#123F34;" +
      "background:linear-gradient(180deg,#F7D894,#F2C46A);padding:7px 11px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.35);" +
      "transition:opacity .35s,transform .35s cubic-bezier(.2,1.4,.4,1)}" +
    "#ssBuddy .bd-say:after{content:'';position:absolute;top:100%;left:50%;margin-left:-6px;border:6px solid transparent;border-top-color:#F2C46A}" +
    "#ssBuddy .bd-say.show{opacity:1;transform:translateX(-50%) scale(1)}";
  document.head.appendChild(css);

  /* ---------- element ---------- */
  var root = document.createElement("div");
  root.id = "ssBuddy";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = '<div class="bd-shadow"></div><div class="bd-body"><img alt="" draggable="false"></div><div class="bd-say"></div>';
  var bodyEl = root.querySelector(".bd-body");
  var img = root.querySelector("img");
  var say = root.querySelector(".bd-say");
  var shadow = root.querySelector(".bd-shadow");

  // preload every frame, then start
  var preload = WALK.concat([BASE + "stand.webp", BASE + "bless.webp", BASE + "sit.webp"]);
  var loaded = 0;
  preload.forEach(function (src) {
    var i = new Image();
    i.onload = i.onerror = function () { if (++loaded === preload.length) start(); };
    i.src = src;
  });

  /* ---------- state ---------- */
  var W = window.innerWidth, H = window.innerHeight;
  var x = W - 70, y = H - 20;            // his feet position (starts bottom-right)
  var vx = 0, vy = 0;                    // velocity (px per 60 fps frame)
  var mx = x, my = y;                    // mouse
  var hasMouse = false, inside = true;
  var face = -1;                         // walking direction: 1 = right, -1 = left
  var dirSmooth = -1;                    // face eased through 0 -> cartoon turn on direction change
  var stepPhase = 0;                     // walk-cycle phase (radians): 0 = foot down, PI/2 = mid-air
  var walkIdx = 0;                       // current frame in WALK[]
  var movingHold = false;                // hysteresis so the pose never flickers at a stop
  var side = 1;                          // he stands on this side of the cursor: 1 = right, -1 = left
  var pose = "";
  var lastMove = performance.now();
  var hop = 0, hopV = 0;
  var blessedAt = 0;
  var running = false;

  function setPose(p) {
    if (p === pose) return;
    pose = p;
    img.src = p === "walk" ? WALK[walkIdx] : BASE + p + ".webp";
    bodyEl.style.width = POSES[p].w + "px";
    bodyEl.style.height = POSES[p].h + "px";
    bodyEl.style.left = (-POSES[p].w / 2) + "px";
    say.style.bottom = (POSES[p].h + 4) + "px";
  }

  function lang() {
    var l = (document.documentElement.lang || "en").slice(0, 2);
    return SAY[l] ? l : "en";
  }

  var sayTimer = 0;
  function speak(ms) {
    say.textContent = SAY[lang()];
    say.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { say.classList.remove("show"); }, ms || 2600);
  }

  /* ---------- input ---------- */
  document.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    hasMouse = true; inside = true;
    lastMove = performance.now();
    // fade out when the pointer is over a form field so he never gets in the way of typing
    var t = e.target;
    var dim = !!(t && t.closest && t.closest("input,textarea,select,[contenteditable='true']"));
    root.classList.toggle("dim", dim);
  }, { passive: true });

  document.addEventListener("mouseleave", function () { inside = false; });
  document.addEventListener("mouseenter", function () { inside = true; });
  document.addEventListener("mousedown", function () { if (hop === 0) hopV = -5.2; }, { passive: true });
  window.addEventListener("resize", function () { W = window.innerWidth; H = window.innerHeight; });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false; else if (!running) { running = true; requestAnimationFrame(tick); }
  });

  /* ---------- loop ---------- */
  var t0 = performance.now(), lastT = t0;
  function tick(now) {
    if (!running) return;
    var dt = Math.min(48, now - lastT) / 16.67;   // 1.0 = one 60 fps frame
    lastT = now;

    // where he wants to stand: a little behind and below the pointer
    var gap = 46;
    // switch sides only when the pointer really passes him (prevents left-right jitter)
    if (x - mx > 14) side = 1; else if (mx - x > 14) side = -1;
    var tx = mx + side * gap;
    var ty = my + 112;
    if (!hasMouse) { tx = x; ty = y; }

    var dx = tx - x, dy = ty - y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (inside && hasMouse) {
      // soft spring toward the spot (the qtology Little-Ganesha feel):
      // a slight overshoot & settle instead of a magnet snap
      var K = 0.02, DAMP = 0.19, VMAX = 7.6;
      vx += (dx * K - vx * DAMP) * dt;
      vy += (dy * K - vy * DAMP) * dt;
      var sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > VMAX) { vx *= VMAX / sp; vy *= VMAX / sp; }
      if (vy > VMAX * 0.85) vy = VMAX * 0.85; else if (vy < -VMAX * 0.85) vy = -VMAX * 0.85;
    } else {
      // let him come to rest where he is
      var dec = Math.max(0, 1 - 0.22 * dt);
      vx *= dec; vy *= dec;
      if (Math.abs(vx) < 0.05) vx = 0;
      if (Math.abs(vy) < 0.05) vy = 0;
    }

    x += vx * dt; y += vy * dt;
    var speed = Math.sqrt(vx * vx + vy * vy);

    // hysteresis: start walking above 0.8, stop below 0.35 -> no pose flicker
    if (speed > 0.8) movingHold = true;
    else if (speed < 0.35) movingHold = false;
    var moving = movingHold && inside && hasMouse;

    // face the way he is actually going
    if (moving && Math.abs(vx) > 0.3) face = vx > 0 ? 1 : -1;

    /* ---- walk cycle: footfalls come from movement, not from a clock ---- */
    if (moving) {
      // step rate scales with speed: slow baby steps -> hurried bounding strides
      var stepHz = Math.max(1.8, Math.min(6.2, speed * 60 / 70));
      stepPhase += Math.PI * stepHz * (dt / 60);   // PI of phase = one footfall
      if (stepPhase >= Math.PI * 2) stepPhase -= Math.PI * 2;
    }
    // frame: 0 = leg A down, 1 = passing (air), 2 = leg B down, 3 = passing (air)
    var idx = Math.floor(stepPhase / (Math.PI / 2)) % 4;
    if (pose === "walk" && idx !== walkIdx) { walkIdx = idx; img.src = WALK[idx]; }

    // smooth turn-around when he changes direction
    dirSmooth += (face - dirSmooth) * Math.min(1, 0.3 * dt);

    // keep him on screen (and stop pushing against the edges)
    var pw = POSES[pose || "stand"].w, ph = POSES[pose || "stand"].h;
    if (x < pw / 2 + 4) { x = pw / 2 + 4; if (vx < 0) vx = 0; }
    if (x > W - pw / 2 - 4) { x = W - pw / 2 - 4; if (vx > 0) vx = 0; }
    if (y < ph + 6) { y = ph + 6; if (vy < 0) vy = 0; }
    if (y > H - 4) { y = H - 4; if (vy > 0) vy = 0; }

    // pose by state
    var idle = now - lastMove;
    if (!inside) {
      setPose("sit");
    } else if (moving) {
      setPose("walk");
      blessedAt = 0;
    } else if (idle > 9000) {
      setPose("sit");
    } else if (idle > 2200) {
      if (pose !== "bless") { setPose("bless"); if (!blessedAt) { blessedAt = now; speak(2800); } }
    } else {
      setPose("stand");
    }

    // little hop on click
    if (hopV !== 0 || hop !== 0) {
      hop += hopV * dt; hopV += 0.55 * dt;
      if (hop >= 0) { hop = 0; hopV = 0; }
    }

    /* ---- animate the body ---- */
    var t = (now - t0) / 1000;
    var lift = 0, bob = 0, rock = 0, sway = 0, rot = 0, sx = 1, sy = 1, flip = 1;
    if (pose === "walk" && moving) {
      var spd01 = Math.min(1, speed / 3.6);          // how energetic the steps are
      lift = Math.abs(Math.sin(stepPhase));          // 0 = foot on the ground, 1 = mid-air (matches frames)
      var amp = (1.8 + speed * 0.55) * spd01;
      if (Math.abs(vy) > Math.abs(vx)) amp *= 1.25;  // climbing up/down: bigger little hops
      bob = -lift * amp;
      // subtle only — the legs already move in the frames
      rock = Math.sin(stepPhase) * (1.4 + speed * 0.3) * spd01;
      sway = Math.sin(stepPhase) * (0.45 + speed * 0.14) * spd01 * face;
      var lean = Math.min(5.5, speed * 0.9);         // lean into the run
      sy = 1 + (lift - 0.45) * 0.05;                 // squash on landing, stretch in the air
      sx = 1 + (0.45 - lift) * 0.032;
      // Only the walking pose is mirrored. Blessing / waving poses are NEVER mirrored,
      // so Swamy always blesses with his RIGHT hand (abhaya mudra).
      flip = dirSmooth;
      rot = (lean + rock) * face;
    } else {
      // still: gentle breathing; the click-hop still works
      var br = Math.sin(t * 2.4);
      sy = 1 + br * 0.018;
      sx = 1 - br * 0.008;
      flip = 1;
    }

    bodyEl.style.transform =
      "translate(" + sway.toFixed(1) + "px," + (bob + hop).toFixed(1) + "px) " +
      "rotate(" + rot.toFixed(2) + "deg) " +
      "scale(" + (flip * sx).toFixed(3) + "," + sy.toFixed(3) + ")";

    // shadow shrinks & fades while he is off the ground -> the steps read as real
    var air = Math.min(1, lift + Math.min(1, -hop / 9));
    shadow.style.transform = "scale(" + (1 - air * 0.3).toFixed(3) + ")";
    shadow.style.opacity = (1 - air * 0.45).toFixed(2);

    root.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";

    requestAnimationFrame(tick);
  }

  function start() {
    setPose("stand");
    document.body.appendChild(root);
    requestAnimationFrame(function () { root.classList.add("on"); });
    running = true;
    requestAnimationFrame(tick);
    // first greeting after the page settles
    setTimeout(function () { if (pose !== "walk") { setPose("bless"); blessedAt = performance.now(); speak(3000); } }, 1400);
  }
})();
