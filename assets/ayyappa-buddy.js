/* =========================================================
   Little Ayyappa Swamy — cursor companion
   - Walks after the mouse pointer with a REAL step cycle:
     footfalls come from distance & speed (never a fixed timer),
     the body bobs & sways once per step, squashes on landing and
     stretches in the air, leans into the run, turns smoothly,
     and takes bigger little hops when climbing up or down.
     The walk pose is mirrored every footfall -> the other leg
     leads (a 2-frame stride cycle from one picture).
   - Stops beside the cursor -> stands -> blesses (with a
     "Swamiye Sharanam Ayyappa" bubble) -> sits down & waves
   - Never blocks clicks (pointer-events: none)
   - Hidden on phones/tablets and for "reduce motion" users
   Images: /assets/buddy/ayyappa-{walk,stand,bless,sit}.webp
   ========================================================= */
(function () {
  "use strict";
  if (window.__ssBuddy) return;
  window.__ssBuddy = true;

  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  if (!mq("(hover: hover) and (pointer: fine)")) return;      // phones / tablets: off
  if (mq("(prefers-reduced-motion: reduce)")) return;         // accessibility: off

  var BASE = "/assets/buddy/ayyappa-";
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
      "white-space:nowrap;font:700 12px/1.2 'Noto Sans','Noto Sans Telugu',system-ui,sans-serif;color:#071A2B;" +
      "background:linear-gradient(180deg,#FFE9A8,#D4AF37);padding:7px 11px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.35);" +
      "transition:opacity .35s,transform .35s cubic-bezier(.2,1.4,.4,1)}" +
    "#ssBuddy .bd-say:after{content:'';position:absolute;top:100%;left:50%;margin-left:-6px;border:6px solid transparent;border-top-color:#D4AF37}" +
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

  // preload all poses, then start
  var loaded = 0, names = Object.keys(POSES);
  names.forEach(function (n) {
    var i = new Image();
    i.onload = i.onerror = function () { if (++loaded === names.length) start(); };
    i.src = BASE + n + ".webp";
  });

  /* ---------- state ---------- */
  var W = window.innerWidth, H = window.innerHeight;
  var x = W - 70, y = H - 20;            // his feet position (starts bottom-right)
  var vx = 0, vy = 0;                    // velocity (px per 60 fps frame) -> accel / brake feel
  var mx = x, my = y;                    // mouse
  var hasMouse = false, inside = true;
  var face = -1;                         // walking direction: 1 = right, -1 = left
  var dirSmooth = -1;                    // face eased through 0 -> cartoon turn when he turns around
  var strideFlip = 1;                    // mirrors the walk pose every footfall = the other leg leads
  var stepPhase = 0, stepK = 0;          // walk-cycle phase (radians) and footfall counter
  var side = 1;                          // he stands on this side of the cursor: 1 = right, -1 = left
  var pose = "";
  var lastMove = performance.now();
  var hop = 0, hopV = 0;
  var blessedAt = 0;
  var running = false;

  function setPose(p) {
    if (p === pose) return;
    pose = p;
    img.src = BASE + p + ".webp";
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
    var want = inside && hasMouse && dist > 7;

    if (want) {
      // full tilt far away, smooth brake close to the spot -> no magnet snap
      var vmax = 7.6;
      var a = Math.min(1, dist / 150);
      var brake = a * a * (3 - 2 * a);              // smoothstep
      var desX = (dx / dist) * vmax * brake;
      var desY = (dy / dist) * vmax * brake * 0.82;
      var acc = Math.min(1, 0.13 * dt);             // ease into the new speed (acceleration)
      vx += (desX - vx) * acc;
      vy += (desY - vy) * acc;
    } else {
      // skid to a natural stop instead of freezing mid-slide
      var dec = Math.max(0, 1 - 0.22 * dt);
      vx *= dec; vy *= dec;
      if (Math.abs(vx) < 0.05) vx = 0;
      if (Math.abs(vy) < 0.05) vy = 0;
    }

    x += vx * dt; y += vy * dt;
    var speed = Math.sqrt(vx * vx + vy * vy);
    var moving = speed > 0.5 && inside && hasMouse;

    // face the way he is actually going (not the way the target is)
    if (moving && Math.abs(vx) > 0.3) face = vx > 0 ? 1 : -1;

    /* ---- walk cycle: footfalls come from movement, not from a clock ---- */
    if (moving) {
      // step rate scales with speed: slow baby steps -> hurried bounding strides
      var stepHz = Math.max(1.8, Math.min(6.5, speed * 60 / 70));
      stepPhase += Math.PI * stepHz * (dt / 60);   // PI of phase = one footfall
      // swap the leading leg in mid-air (mirrored walk pose = the other leg forward)
      var k = Math.floor(stepPhase / Math.PI + 0.5);
      if (k !== stepK) { stepK = k; strideFlip = -strideFlip; }
    }

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
      lift = Math.abs(Math.sin(stepPhase));          // 0 = foot on the ground, 1 = mid-air
      var amp = (2.4 + speed * 0.8) * spd01;
      if (Math.abs(vy) > Math.abs(vx)) amp *= 1.3;   // climbing up/down: bigger little hops
      bob = -lift * amp;                             // body rises once per footfall
      rock = Math.sin(stepPhase) * (2.6 + speed * 0.55) * spd01;
      sway = Math.sin(stepPhase) * (0.7 + speed * 0.22) * spd01 * face;
      var lean = Math.min(7, speed * 1.15);          // lean into the run
      // squash on landing, stretch in the air
      sy = 1 + (lift - 0.45) * 0.075;
      sx = 1 + (0.45 - lift) * 0.048;
      // Only the walking pose is mirrored. Blessing / waving poses are NEVER mirrored,
      // so Swamy always blesses with his RIGHT hand (abhaya mudra).
      flip = dirSmooth * strideFlip;
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
