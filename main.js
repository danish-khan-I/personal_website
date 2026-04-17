// Danish's Room — a small pixel room with a crow that learns you.

// ---------- state ----------
const STORAGE_KEY = "danishs-room-v1";

const state = {
  visits: 0,
  lastVisitDay: null,
  trust: 0,
  muted: true,
  discovered: [],
  gifts: [],
  lastGiftDay: null,
  giftSeenToday: false,
  lampOn: true,
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch {}
  state.visits += 1;
  const today = todayKey();
  if (state.lastVisitDay !== today) {
    state.trust = Math.min(state.trust + 1, 10);
    state.lastVisitDay = today;
    state.giftSeenToday = false;
  }
  saveState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ---------- util ----------
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

// ---------- canvas ----------
const canvas = document.getElementById("room");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;   // 320
const H = canvas.height;  // 180

// ---------- palette ----------
const C = {
  wall:       "#1a2238",
  wallDark:   "#141a2c",
  floor:      "#0e1424",
  trim:       "#2c3856",
  wood:       "#4a3a28",
  woodLight:  "#6b4d34",
  woodDark:   "#2e2418",
  ink:        "#e8e6d8",
  moon:       "#9bb4c9",
  moonDeep:   "#5a7294",
  night:      "#1e2b4a",
  warm:       "#e8b76a",
  warmSoft:   "#c48a4a",
  shadow:     "#060a14",
  crowBody:   "#0d0d12",
  crowHi:     "#1f2030",
  crowBeak:   "#3a2a18",
  crowEye:    "#ffd966",
  leaf:       "#3a5a3a",
  leafLight:  "#5a7a4a",
  pot:        "#6b3a28",
};

// ---------- interactive objects (hit regions in logical px) ----------
const objects = [
  { id: "painting",  label: "a painting",      x: 50,  y: 28,  w: 42, h: 30 },
  { id: "window",    label: "the window",      x: 128, y: 22,  w: 64, h: 56 },
  { id: "musicbox",  label: "a music box",     x: 226, y: 80,  w: 22, h: 14 },
  { id: "paper",     label: "folded paper",    x: 270, y: 84,  w: 14, h: 10 },
  { id: "lamp",      label: "the lamp",        x: 152, y: 0,   w: 16, h: 26 },
  { id: "plant",     label: "a plant",         x: 14,  y: 128, w: 26, h: 42 },
  { id: "bookshelf", label: "a bookshelf",     x: 48,  y: 130, w: 46, h: 40 },
  { id: "record",    label: "a record player", x: 100, y: 144, w: 52, h: 26 },
  { id: "giftbox",   label: "the crow's gifts", x: 160, y: 158, w: 14, h: 12 },
];

const GIFT_DROP = { x: 160, y: 150 };

// ---------- weather particles (seen through window) ----------
const weather = [];
function initWeather() {
  const count = 22;
  for (let i = 0; i < count; i++) {
    weather.push({
      x: Math.random() * 58,
      y: Math.random() * 50,
      vy: 0.15 + Math.random() * 0.35,
      vx: -0.05 - Math.random() * 0.1,
    });
  }
}

// ---------- stars (seen through window) ----------
const stars = [];
function initStars() {
  const rng = mulberry32(dateSeed());
  for (let i = 0; i < 14; i++) {
    stars.push({
      x: Math.floor(rng() * 58) + 1,
      y: Math.floor(rng() * 30) + 1,
      tw: rng() * Math.PI * 2,
    });
  }
}

// ---------- pointer ----------
const pointer = { x: W / 2, y: H / 2, over: null, down: false };

function canvasPosFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left;
  const cy = (e.clientY ?? e.touches?.[0]?.clientY ?? 0) - rect.top;
  return {
    x: clamp((cx / rect.width) * W, 0, W),
    y: clamp((cy / rect.height) * H, 0, H),
  };
}

function hitObject(x, y) {
  for (const o of objects) {
    if (o.id === "giftbox" && state.gifts.length === 0) continue;
    if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return o;
  }
  return null;
}

// ---------- crow ----------
const crow = {
  x: 296, y: 86,
  facing: -1,
  bob: 0,
  stateT: 0,
  blinkT: 0,
  mode: "idle", // idle | flying
  flightFrom: null,
  flightTo: null,
  flightProgress: 0,
  flightArc: 16,
  flightSpeed: 1.0,
  onArrive: null,
  nextHopAt: 18,
};

function crowPositionForTrust() {
  const t = state.trust;
  if (t <= 1) return { x: 296, y: 86 };
  if (t <= 3) return { x: 254, y: 86 };
  if (t <= 5) return { x: 216, y: 86 };
  return { x: 210, y: 86 };
}

function validPerches() {
  return [
    { x: 216, y: 86 },
    { x: 254, y: 86 },
    { x: 296, y: 86 },
  ];
}

function pickPerch() {
  const perches = validPerches();
  const others = perches.filter(p => Math.abs(p.x - crow.x) > 6);
  if (others.length === 0) return perches[0];
  return others[Math.floor(Math.random() * others.length)];
}

function startFlight(target, arc = 16, speed = 1.1, onArrive = null) {
  crow.mode = "flying";
  crow.flightFrom = { x: crow.x, y: crow.y };
  crow.flightTo = target;
  crow.flightProgress = 0;
  crow.flightArc = arc;
  crow.flightSpeed = speed;
  crow.onArrive = onArrive;
  if (Math.abs(target.x - crow.x) > 1) {
    crow.facing = target.x > crow.x ? 1 : -1;
  }
}

function updateCrow(dt) {
  crow.bob += dt * 3;
  crow.stateT += dt;
  crow.blinkT += dt;

  if (crow.mode === "flying") {
    crow.flightProgress += dt * crow.flightSpeed;
    if (crow.flightProgress >= 1) {
      crow.x = crow.flightTo.x;
      crow.y = crow.flightTo.y;
      crow.mode = "idle";
      crow.stateT = 0;
      crow.nextHopAt = state.trust >= 2 ? (10 + Math.random() * 10) : (6 + Math.random() * 6);
      const cb = crow.onArrive;
      crow.onArrive = null;
      if (cb) cb();
      return;
    }
    const p = crow.flightProgress;
    crow.x = crow.flightFrom.x + (crow.flightTo.x - crow.flightFrom.x) * p;
    crow.y = crow.flightFrom.y + (crow.flightTo.y - crow.flightFrom.y) * p - Math.sin(Math.PI * p) * crow.flightArc;
    return;
  }

  // idle re-hopping at trust 2+
  if (state.trust >= 2 && crow.stateT > crow.nextHopAt) {
    const next = pickPerch();
    startFlight(next, 14, 1.4);
    return;
  }

  // small in-place twitch at trust 1 so it doesn't look frozen
  if (state.trust === 1 && crow.stateT > crow.nextHopAt) {
    const here = { x: crow.x, y: crow.y };
    startFlight(here, 4, 2.8);
    return;
  }

  // head tracks cursor at trust 2+
  if (state.trust >= 2) {
    const fx = pointer.x < crow.x ? -1 : 1;
    if (Math.abs(pointer.x - crow.x) > 8) crow.facing = fx;
  }
}

function scheduleGiftDelivery() {
  if (state.trust < 7) return;
  if (state.lastGiftDay === todayKey()) return;

  setTimeout(() => {
    const dropSpot = { x: GIFT_DROP.x, y: GIFT_DROP.y - 4 };
    startFlight(dropSpot, 40, 0.9, () => {
      const gift = generateGift();
      state.gifts.push(gift);
      state.lastGiftDay = todayKey();
      state.giftSeenToday = false;
      saveState();
      playCaw();
      triggerGiftSparkle();
      if (!pointer.over) hintEl.textContent = defaultHint();
      setTimeout(() => {
        startFlight(crowPositionForTrust(), 36, 0.8);
      }, 1600);
    });
  }, 4200);
}

function generateGift() {
  const seed = dateSeed() + state.gifts.length * 7;
  const rng = mulberry32(seed);
  const type = rng() > 0.5 ? "word" : "pebble";
  if (type === "word") {
    return {
      type: "word",
      word: giftWords[Math.floor(rng() * giftWords.length)],
      day: Date.now(),
    };
  }
  return {
    type: "pebble",
    seed: Math.floor(rng() * 100000),
    day: Date.now(),
  };
}

function drawCrow() {
  const x = Math.round(crow.x);
  const y = Math.round(crow.y + Math.sin(crow.bob) * 0.4);
  const f = crow.facing;

  // trust 0: just a silhouette with a dim glint of an eye
  if (state.trust === 0) {
    ctx.fillStyle = C.crowBody;
    ctx.fillRect(x + 2, y + 1, 5, 4);
    ctx.fillRect(x + 3, y, 3, 1);
    const blink = Math.sin(crow.blinkT * 0.6) > 0.9;
    if (!blink) {
      ctx.fillStyle = "rgba(255,217,102,0.55)";
      ctx.fillRect(x + 3, y + 2, 1, 1);
    }
    return;
  }

  // body
  ctx.fillStyle = C.crowBody;
  ctx.fillRect(x, y, 8, 5);
  ctx.fillRect(x + 1, y - 1, 6, 1);
  ctx.fillRect(x + 1, y + 5, 6, 1);

  // wing detail
  ctx.fillStyle = C.crowHi;
  ctx.fillRect(x + 2, y + 1, 4, 2);

  // tail
  ctx.fillStyle = C.crowBody;
  if (f < 0) ctx.fillRect(x + 7, y + 1, 2, 2);
  else ctx.fillRect(x - 1, y + 1, 2, 2);

  // head
  const hx = f > 0 ? x + 6 : x;
  ctx.fillStyle = C.crowBody;
  ctx.fillRect(hx, y - 3, 4, 3);
  ctx.fillRect(hx + (f > 0 ? 0 : 1), y - 4, 3, 1);

  // eye
  const blink = Math.sin(crow.blinkT * 0.8) > 0.98;
  if (!blink) {
    ctx.fillStyle = C.crowEye;
    ctx.fillRect(hx + (f > 0 ? 2 : 1), y - 2, 1, 1);
  }

  // beak
  ctx.fillStyle = C.crowBeak;
  ctx.fillRect(hx + (f > 0 ? 4 : -1), y - 1, 1, 1);

  // legs
  ctx.fillStyle = C.crowBeak;
  ctx.fillRect(x + 2, y + 6, 1, 2);
  ctx.fillRect(x + 5, y + 6, 1, 2);
}

// ---------- room rendering ----------
function drawRoom(t) {
  // wall gradient (faux: two bands)
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, W, 130);
  ctx.fillStyle = C.wallDark;
  for (let i = 0; i < W; i += 2) ctx.fillRect(i, 0, 1, 40);

  // floor
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 130, W, H - 130);

  // floor boards
  ctx.fillStyle = C.shadow;
  for (let i = 0; i < W; i += 16) ctx.fillRect(i, 130, 1, H - 130);

  // baseboard trim
  ctx.fillStyle = C.trim;
  ctx.fillRect(0, 128, W, 2);

  // painting
  drawPainting();

  // window
  drawWindow();

  // shelf
  drawShelf();

  // music box
  drawMusicBox(t);

  // folded paper
  drawPaper();

  // lamp
  drawLamp();

  // plant
  drawPlant();

  // bookshelf (floor, under painting)
  drawBookshelf();

  // record player (floor, center-left)
  drawRecordPlayer(t);

  // gift box (floor, center — only if there are gifts)
  if (state.gifts.length > 0) drawGiftBox(t);

  // lamp glow (on top as overlay)
  if (state.lampOn) drawLampGlow();

  // sparkle where a gift was just dropped
  if (giftSparkleT > 0) drawGiftSparkle(t);

  // hover outline
  if (pointer.over) drawHoverOutline(pointer.over);
}

function drawPainting() {
  const x = 50, y = 28, w = 42, h = 30;
  // outer frame
  ctx.fillStyle = C.wood;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  // canvas
  const ix = x + 3, iy = y + 3, iw = w - 6, ih = h - 6;
  ctx.fillStyle = "#1c2740";
  ctx.fillRect(ix, iy, iw, ih);
  // date-seeded generative composition
  const rng = mulberry32(dateSeed() + 17);
  const palette = ["#3a5a8a", "#7a9ab8", "#e8b76a", "#c46a4a", "#7a6a9a", "#4a8a7a"];
  const shapes = 8 + Math.floor(rng() * 6);
  for (let i = 0; i < shapes; i++) {
    const px = ix + Math.floor(rng() * iw);
    const py = iy + Math.floor(rng() * ih);
    const sw = 2 + Math.floor(rng() * 8);
    const sh = 2 + Math.floor(rng() * 6);
    ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
    ctx.fillRect(
      clamp(px, ix, ix + iw - sw),
      clamp(py, iy, iy + ih - sh),
      sw,
      sh,
    );
  }
  // horizon line
  ctx.fillStyle = "#e8b76a";
  ctx.fillRect(ix, iy + Math.floor(ih * 0.6), iw, 1);
}

function drawWindow() {
  const x = 128, y = 22, w = 64, h = 56;
  // outer frame
  ctx.fillStyle = C.wood;
  ctx.fillRect(x, y, w, h);
  // sill
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x - 2, y + h, w + 4, 3);

  // panes (night sky)
  const ix = x + 3, iy = y + 3, iw = w - 6, ih = h - 6;
  const grd = ctx.createLinearGradient(0, iy, 0, iy + ih);
  grd.addColorStop(0, "#0c1530");
  grd.addColorStop(1, "#1c2a50");
  ctx.fillStyle = grd;
  ctx.fillRect(ix, iy, iw, ih);

  // stars
  for (const s of stars) {
    const tw = Math.sin(performance.now() / 600 + s.tw) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(232,230,216,${0.4 + tw * 0.6})`;
    ctx.fillRect(ix + s.x, iy + s.y, 1, 1);
  }

  // moon
  ctx.fillStyle = C.ink;
  ctx.fillRect(ix + 36, iy + 6, 10, 10);
  ctx.fillRect(ix + 37, iy + 5, 8, 1);
  ctx.fillRect(ix + 37, iy + 16, 8, 1);
  ctx.fillStyle = C.moon;
  ctx.fillRect(ix + 39, iy + 7, 2, 2);
  ctx.fillRect(ix + 43, iy + 10, 2, 2);

  // weather particles (drifting snow)
  ctx.fillStyle = "rgba(232,230,216,0.75)";
  for (const p of weather) {
    ctx.fillRect(ix + Math.floor(p.x), iy + Math.floor(p.y), 1, 1);
    p.y += p.vy;
    p.x += p.vx;
    if (p.y > ih || p.x < 0) {
      p.y = 0;
      p.x = Math.random() * iw;
    }
  }

  // cross mullions
  ctx.fillStyle = C.wood;
  ctx.fillRect(x + (w >> 1) - 1, y + 2, 2, h - 4);
  ctx.fillRect(x + 2, y + (h >> 1) - 1, w - 4, 2);

  // inner highlight
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x, y, w, 1);
}

function drawShelf() {
  ctx.fillStyle = C.wood;
  ctx.fillRect(210, 94, 96, 3);
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(210, 94, 96, 1);
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(210, 96, 96, 1);
  // brackets
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(215, 97, 2, 4);
  ctx.fillRect(299, 97, 2, 4);
}

function drawMusicBox(t) {
  const x = 226, y = 80, w = 22, h = 14;
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.wood;
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x + w - 2, y, 2, h);
  // brass key
  ctx.fillStyle = C.warm;
  const keyPhase = (t / 1000) % 1;
  ctx.fillRect(x + 5, y + 5, 2, 2);
  ctx.fillRect(x + 4 + Math.floor(keyPhase * 3) % 3, y + 4, 1, 1);
  // inlay
  ctx.fillStyle = C.warmSoft;
  ctx.fillRect(x + 12, y + 4, 6, 1);
  ctx.fillRect(x + 12, y + 8, 6, 1);
  ctx.fillRect(x + 12, y + 4, 1, 5);
  ctx.fillRect(x + 17, y + 4, 1, 5);
}

function drawPaper() {
  const x = 270, y = 84, w = 14, h = 10;
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y + 2, w, h - 2);
  ctx.fillStyle = "#cfcebd";
  ctx.fillRect(x, y + 2, w, 1);
  ctx.fillStyle = "#b8b7a4";
  ctx.fillRect(x, y + h - 1, w, 1);
  // fold crease
  ctx.fillStyle = "#aeac9a";
  ctx.fillRect(x, y + 5, w, 1);
  // tiny corner curl
  ctx.fillStyle = "#cfcebd";
  ctx.fillRect(x + w - 2, y + 2, 2, 1);
}

function drawLamp() {
  const x = 152, y = 0, w = 16;
  // cord
  ctx.fillStyle = C.trim;
  ctx.fillRect(x + 7, 0, 2, 10);
  // shade
  ctx.fillStyle = C.warmSoft;
  ctx.fillRect(x, 10, w, 2);
  ctx.fillStyle = state.lampOn ? C.warm : C.trim;
  ctx.fillRect(x + 1, 12, w - 2, 10);
  ctx.fillStyle = state.lampOn ? "#fff2c8" : C.trim;
  ctx.fillRect(x + 3, 22, w - 6, 2);
  // highlight
  ctx.fillStyle = "rgba(255,242,200,0.5)";
  if (state.lampOn) ctx.fillRect(x + 2, 13, 1, 6);
}

function drawLampGlow() {
  const cx = 160, cy = 24;
  const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, 120);
  grd.addColorStop(0, "rgba(232,183,106,0.18)");
  grd.addColorStop(0.6, "rgba(232,183,106,0.05)");
  grd.addColorStop(1, "rgba(232,183,106,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

function drawPlant() {
  const x = 14, y = 128;
  // pot
  ctx.fillStyle = C.pot;
  ctx.fillRect(x + 4, y + 28, 18, 14);
  ctx.fillStyle = "#823e28";
  ctx.fillRect(x + 4, y + 28, 18, 2);
  ctx.fillStyle = "#4a2618";
  ctx.fillRect(x + 4, y + 40, 18, 2);

  // growth scales with visits (cap at 30)
  const g = clamp(state.visits / 30, 0.3, 1);
  const stem = Math.round(18 * g);
  ctx.fillStyle = C.leaf;
  ctx.fillRect(x + 12, y + 28 - stem, 2, stem);
  // leaves
  const leaves = Math.floor(3 + g * 4);
  for (let i = 0; i < leaves; i++) {
    const ly = y + 28 - Math.floor((i + 1) * stem / (leaves + 1));
    const side = i % 2 === 0 ? -1 : 1;
    const lx = side > 0 ? x + 14 : x + 8;
    ctx.fillStyle = C.leaf;
    ctx.fillRect(lx, ly, 4, 2);
    ctx.fillStyle = C.leafLight;
    ctx.fillRect(side > 0 ? lx : lx + 2, ly, 2, 1);
  }
}

function drawBookshelf() {
  const x = 48, y = 130, w = 46, h = 40;
  // carcass
  ctx.fillStyle = C.wood;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);

  // interior shadows
  ctx.fillStyle = C.shadow;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  // shelves
  const shelves = 3;
  for (let s = 0; s < shelves; s++) {
    const sy = y + 2 + Math.floor(((h - 4) / shelves) * (s + 1)) - 1;
    ctx.fillStyle = C.woodLight;
    ctx.fillRect(x + 2, sy, w - 4, 1);
  }

  // books (deterministic layout so they don't jitter)
  const bookColors = ["#5a7a4a", "#8a4a3a", "#c48a4a", "#7a6a9a", "#4a6a8a", "#6b4d34", "#aa8a5a", "#3a5a5a"];
  const rng = mulberry32(4242);
  const rowYs = [];
  for (let s = 0; s < shelves; s++) {
    const sy = y + 2 + Math.floor(((h - 4) / shelves) * s);
    const sh = Math.floor((h - 4) / shelves) - 1;
    rowYs.push({ sy, sh });
  }
  for (const { sy, sh } of rowYs) {
    let bx = x + 3;
    while (bx < x + w - 4) {
      const bw = 2 + Math.floor(rng() * 3);
      const bh = sh - 1 - Math.floor(rng() * 2);
      if (bx + bw > x + w - 3) break;
      ctx.fillStyle = bookColors[Math.floor(rng() * bookColors.length)];
      ctx.fillRect(bx, sy + (sh - bh), bw, bh);
      // tiny spine detail
      if (bw >= 3) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(bx, sy + (sh - bh), 1, bh);
      }
      bx += bw + 1;
    }
  }
}

function drawRecordPlayer(t) {
  const x = 100, y = 144, w = 52, h = 26;
  // base
  ctx.fillStyle = C.wood;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x, y + h - 2, w, 2);

  // vinyl (centered on base, slightly inset)
  const cx = x + 18;
  const cy = y + h / 2;
  const r = 10;
  ctx.fillStyle = "#0a0a10";
  fillCircle(cx, cy, r);
  // grooves
  ctx.fillStyle = "#15151c";
  fillCircle(cx, cy, r - 2);
  ctx.fillStyle = "#0a0a10";
  fillCircle(cx, cy, r - 3);
  ctx.fillStyle = "#15151c";
  fillCircle(cx, cy, r - 5);
  // label
  ctx.fillStyle = C.warm;
  fillCircle(cx, cy, 3);
  // spin notch
  const spin = (t / 1200) % (Math.PI * 2);
  const nx = cx + Math.cos(spin) * (r - 1.5);
  const ny = cy + Math.sin(spin) * (r - 1.5);
  ctx.fillStyle = C.warmSoft;
  ctx.fillRect(Math.round(nx), Math.round(ny), 1, 1);

  // tonearm
  ctx.fillStyle = C.trim;
  const armBaseX = x + w - 8;
  const armBaseY = y + 4;
  ctx.fillRect(armBaseX, armBaseY, 3, 3);
  // arm swings slightly with spin
  const swing = Math.sin(t / 2400) * 0.3;
  for (let i = 0; i < 10; i++) {
    const ax = armBaseX - Math.floor(i * (1 + swing));
    const ay = armBaseY + Math.floor(i * 0.9);
    ctx.fillRect(ax, ay, 1, 1);
  }
  // cartridge tip
  ctx.fillStyle = C.warm;
  ctx.fillRect(armBaseX - 9, armBaseY + 9, 2, 1);

  // speaker grill on right
  const sx = x + 38, sy = y + 6, sw = 10, sh = 14;
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < sw; i += 2) ctx.fillRect(sx + i, sy, 1, sh);
}

function fillCircle(cx, cy, r) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
      }
    }
  }
}

function drawGiftBox(t) {
  const x = 160, y = 158, w = 14, h = 12;
  const newGift = state.lastGiftDay === todayKey() && !state.giftSeenToday;
  const bounce = newGift ? Math.abs(Math.sin(t / 220)) * 1.5 : 0;
  const by = y - bounce;
  // body
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x, by + 2, w, h - 2);
  ctx.fillStyle = C.wood;
  ctx.fillRect(x, by + h - 2, w, 2);
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x + w - 1, by + 2, 1, h - 2);
  // lid
  ctx.fillStyle = C.wood;
  ctx.fillRect(x - 1, by, w + 2, 3);
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(x - 1, by, w + 2, 1);
  // ribbon
  ctx.fillStyle = C.warm;
  ctx.fillRect(x + Math.floor(w / 2) - 1, by, 2, h);
  ctx.fillStyle = C.crowEye;
  ctx.fillRect(x + Math.floor(w / 2) - 2, by - 1, 4, 2);
  // shimmer if new
  if (newGift) {
    const sh = Math.sin(t / 200) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255,217,102,${0.3 + sh * 0.3})`;
    ctx.fillRect(x - 2, by - 2, w + 4, 1);
  }
}

let giftSparkleT = 0;
let giftSparkleStart = 0;
function triggerGiftSparkle() {
  giftSparkleT = 1500;
  giftSparkleStart = performance.now();
}

function drawGiftSparkle(t) {
  const age = t - giftSparkleStart;
  if (age > giftSparkleT) {
    giftSparkleT = 0;
    return;
  }
  const progress = age / giftSparkleT;
  const alpha = 1 - progress;
  const cx = GIFT_DROP.x + 7;
  const cy = GIFT_DROP.y + 6;
  const rays = 6;
  ctx.fillStyle = `rgba(255,217,102,${alpha})`;
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2 + progress * 2;
    const rad = 2 + progress * 8;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillRect(cx, cy, 1, 1);
}

function drawHoverOutline(o) {
  ctx.strokeStyle = "rgba(232,230,216,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(o.x - 0.5, o.y - 0.5, o.w + 1, o.h + 1);
}

// ---------- audio ----------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, dur = 0.35, type = "triangle", gainLevel = 0.12) {
  if (state.muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(gainLevel, ac.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur + 0.05);
}

function playMusicBoxTune() {
  const seed = dateSeed();
  const rng = mulberry32(seed);
  // pentatonic scale in C major, two octaves up
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
  let t = 0;
  const notes = 10 + Math.floor(rng() * 5);
  for (let i = 0; i < notes; i++) {
    const f = scale[Math.floor(rng() * scale.length)];
    const step = 180 + Math.floor(rng() * 160);
    setTimeout(() => playTone(f, 0.55, "triangle", 0.1), t);
    // occasional harmony
    if (rng() > 0.7) {
      setTimeout(() => playTone(f * 1.5, 0.35, "sine", 0.05), t + 30);
    }
    t += step;
  }
}

let recordTuneTimers = [];
function stopRecordTune() {
  for (const id of recordTuneTimers) clearTimeout(id);
  recordTuneTimers = [];
}

function playRecordTune() {
  stopRecordTune();
  const seed = dateSeed() + 99;
  const rng = mulberry32(seed);
  // minor scale, lower octave — slow + ambient
  const scale = [174.61, 196.00, 207.65, 233.08, 261.63, 311.13, 349.23, 392.00];
  let t = 0;
  const notes = 8 + Math.floor(rng() * 4);
  for (let i = 0; i < notes; i++) {
    const f = scale[Math.floor(rng() * scale.length)];
    const step = 420 + Math.floor(rng() * 360);
    recordTuneTimers.push(setTimeout(() => playTone(f, 1.2, "sine", 0.08), t));
    recordTuneTimers.push(setTimeout(() => playTone(f * 2, 0.9, "sawtooth", 0.02), t + 80));
    t += step;
  }
}

function playCaw() {
  if (state.muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(420, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.25);
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.3);
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 600;
  filter.Q.value = 4;
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.35);
}

function playClickTick() {
  playTone(880, 0.07, "square", 0.04);
}

function playPaperRustle() {
  if (state.muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const buf = ac.createBuffer(1, ac.sampleRate * 0.25, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const env = 1 - i / d.length;
    d[i] = (Math.random() * 2 - 1) * env * 0.35;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.value = 0.25;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

// ---------- vignettes ----------
const haikus = [
  "the cabinet remembers / what the room forgot",
  "small windows open / on rooms inside other rooms",
  "the crow has been here / longer than the painting",
  "moonlight knows / the names of every drawer",
  "between two seconds / a whole world is folded",
  "paper softens / the more it is read",
  "the lamp draws a circle / and calls it home",
  "a plant grows / only when no one is watching",
  "every room contains / the sound of its own silence",
  "the window faces whatever / you need tonight",
];

const outsideLines = [
  "snow is falling over a city that isn't quite this one.",
  "the moon, as always, is exactly where you left it.",
  "a road curves out of sight. you've been there before.",
  "it is the kind of night where everything is slightly blue.",
  "nothing is happening outside. nothing is ever happening outside.",
];

const firstLines = [
  "the crow arrived on a tuesday, as crows do.",
  "she left the light on for a house that had no windows.",
  "in the year before the moons, everything was twice as small.",
  "he counted the teaspoons every morning for a reason nobody could remember.",
  "at the edge of the field, the grass knew something the trees did not.",
  "the map did not mention the stairs, and yet.",
  "every summer, the river rewrote its own name.",
  "nobody had ever seen a blue stone before, and yet there it was, on the windowsill.",
  "the clock struck a number that wasn't there.",
  "a letter arrived addressed to no one, which was, of course, how it reached the right person.",
  "the cabinet had been locked since before the house was built.",
  "nothing in the garden was poisonous, but everything had opinions.",
];

const giftWords = [
  "ember", "hinge", "argent", "hollow", "drift", "lantern", "tender", "moor",
  "smolder", "thaw", "whisper", "echo", "fathom", "riven", "woven", "plume",
  "cinder", "glass", "dusk", "marrow", "candle", "harbor", "shard", "quiet",
];

const overlay = document.getElementById("overlay");
const vignetteEl = document.getElementById("vignette");

function showVignette(html, opts = {}) {
  vignetteEl.innerHTML = html;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  if (opts.autoClose) {
    setTimeout(hideVignette, opts.autoClose);
  }
}

function hideVignette() {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function markDiscovered(id) {
  if (!state.discovered.includes(id)) state.discovered.push(id);
  saveState();
}

function openPainting() {
  markDiscovered("painting");
  // render a larger version into an offscreen canvas
  const W2 = 192, H2 = 128;
  const seed = dateSeed() + 17;
  const rng = mulberry32(seed);
  const palette = ["#3a5a8a", "#7a9ab8", "#e8b76a", "#c46a4a", "#7a6a9a", "#4a8a7a"];
  const pixels = [];
  for (let i = 0; i < 40; i++) {
    pixels.push({
      x: Math.floor(rng() * W2),
      y: Math.floor(rng() * H2),
      w: 2 + Math.floor(rng() * 24),
      h: 2 + Math.floor(rng() * 18),
      c: palette[Math.floor(rng() * palette.length)],
    });
  }
  const dateStr = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  showVignette(`
    <div class="canvas-wrap">
      <canvas id="paintingBig" width="${W2}" height="${H2}"></canvas>
    </div>
    <p><em>untitled</em>, ${dateStr}</p>
    <small>this painting hangs here today only.</small>
  `);
  const pc = document.getElementById("paintingBig");
  if (pc) {
    const pctx = pc.getContext("2d");
    pctx.imageSmoothingEnabled = false;
    pctx.fillStyle = "#1c2740";
    pctx.fillRect(0, 0, W2, H2);
    for (const p of pixels) {
      pctx.fillStyle = p.c;
      pctx.fillRect(p.x, p.y, p.w, p.h);
    }
    pctx.fillStyle = "#e8b76a";
    pctx.fillRect(0, Math.floor(H2 * 0.6), W2, 2);
  }
}

function openWindow() {
  markDiscovered("window");
  const rng = mulberry32(Date.now());
  const line = pick(outsideLines, rng);
  showVignette(`
    <p><em>outside</em></p>
    <p>${line}</p>
    <small>click anywhere to close.</small>
  `);
}

function openMusicBox() {
  markDiscovered("musicbox");
  playMusicBoxTune();
  showVignette(`<p style="font-size:2rem">♪</p><small>today's tune. tomorrow's will be different.</small>`, { autoClose: 3800 });
}

function openPaper() {
  markDiscovered("paper");
  playPaperRustle();
  const h = pick(haikus);
  showVignette(`<p><em>"${h}"</em></p><small>— folded and left on the shelf</small>`);
}

function openLamp() {
  state.lampOn = !state.lampOn;
  saveState();
  playClickTick();
}

function openPlant() {
  markDiscovered("plant");
  const v = state.visits;
  const msg = v < 5
    ? "it is still small. you've been here " + v + (v === 1 ? " time." : " times.")
    : v < 15
    ? "it has grown a little since you first came."
    : "it remembers you.";
  showVignette(`<p><em>a plant</em></p><p>${msg}</p>`);
}

function openBookshelf() {
  markDiscovered("bookshelf");
  const line = pick(firstLines);
  showVignette(`
    <p><em>from a book on the shelf</em></p>
    <p>"${line}"</p>
    <small>— first line of a novel you'll never find</small>
  `);
}

function openRecord() {
  markDiscovered("record");
  playRecordTune();
  const W2 = 120, H2 = 120;
  showVignette(`
    <div class="canvas-wrap">
      <canvas id="vinyl" width="${W2}" height="${H2}"></canvas>
    </div>
    <p><em>side B</em></p>
    <small>the record has no label. the sleeve is gone.</small>
  `);
  const vc = document.getElementById("vinyl");
  if (vc) animateVinyl(vc);
}

function animateVinyl(vc) {
  const vctx = vc.getContext("2d");
  vctx.imageSmoothingEnabled = false;
  const W2 = vc.width, H2 = vc.height;
  let running = true;
  const overlayObserver = new MutationObserver(() => {
    if (overlay.classList.contains("hidden")) {
      running = false;
      stopRecordTune();
      overlayObserver.disconnect();
    }
  });
  overlayObserver.observe(overlay, { attributes: true, attributeFilter: ["class"] });

  function frame() {
    if (!running) return;
    const t = performance.now();
    vctx.fillStyle = "#0a0e1a";
    vctx.fillRect(0, 0, W2, H2);
    const cx = W2 / 2, cy = H2 / 2, r = 52;
    vctx.fillStyle = "#0a0a10";
    circleOn(vctx, cx, cy, r);
    vctx.fillStyle = "#15151c";
    circleOn(vctx, cx, cy, r - 4);
    vctx.fillStyle = "#0a0a10";
    circleOn(vctx, cx, cy, r - 6);
    vctx.fillStyle = "#15151c";
    circleOn(vctx, cx, cy, r - 14);
    vctx.fillStyle = "#0a0a10";
    circleOn(vctx, cx, cy, r - 18);
    // label
    vctx.fillStyle = "#e8b76a";
    circleOn(vctx, cx, cy, 16);
    vctx.fillStyle = "#c48a4a";
    circleOn(vctx, cx, cy, 4);
    // spin notch
    const spin = (t / 900) % (Math.PI * 2);
    const nx = cx + Math.cos(spin) * (r - 3);
    const ny = cy + Math.sin(spin) * (r - 3);
    vctx.fillStyle = "#e8b76a";
    vctx.fillRect(Math.round(nx) - 1, Math.round(ny) - 1, 2, 2);
    // label tick
    const nx2 = cx + Math.cos(spin) * 10;
    const ny2 = cy + Math.sin(spin) * 10;
    vctx.fillStyle = "#2e2418";
    vctx.fillRect(Math.round(nx2), Math.round(ny2), 2, 2);
    requestAnimationFrame(frame);
  }
  frame();
}

function circleOn(c, cx, cy, r) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) c.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
    }
  }
}

function openGiftBox() {
  markDiscovered("giftbox");
  state.giftSeenToday = true;
  saveState();
  if (state.gifts.length === 0) return;
  const items = state.gifts.map((g, i) => renderGift(g, i)).join("");
  showVignette(`
    <p><em>the crow has brought you things</em></p>
    <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;max-height:50vh;overflow:auto;padding:0.5rem">
      ${items}
    </div>
    <small>${state.gifts.length} ${state.gifts.length === 1 ? "gift" : "gifts"} so far.</small>
  `);
}

function renderGift(g, i) {
  const d = new Date(g.day || Date.now());
  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (g.type === "word") {
    return `<div style="border:1px solid rgba(232,230,216,0.2);padding:0.75rem 1rem;border-radius:4px;min-width:6rem">
      <div style="font-size:1.2rem;color:var(--moon)"><em>${g.word}</em></div>
      <small>${dateStr}</small>
    </div>`;
  }
  // pebble: a little colored pixel tile
  const rng = mulberry32(g.seed ?? i);
  const palette = ["#5a7a4a", "#8a4a3a", "#c48a4a", "#7a6a9a", "#4a6a8a", "#9bb4c9", "#e8b76a"];
  let cells = "";
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const on = rng() > 0.35;
      const color = on ? palette[Math.floor(rng() * palette.length)] : "transparent";
      cells += `<div style="width:8px;height:8px;background:${color}"></div>`;
    }
  }
  return `<div style="border:1px solid rgba(232,230,216,0.2);padding:0.75rem;border-radius:4px">
    <div style="display:grid;grid-template-columns:repeat(5,8px);gap:1px">${cells}</div>
    <small style="margin-top:0.5rem;display:block">${dateStr}</small>
  </div>`;
}

function openObject(o) {
  switch (o.id) {
    case "painting":  return openPainting();
    case "window":    return openWindow();
    case "musicbox":  return openMusicBox();
    case "paper":     return openPaper();
    case "lamp":      return openLamp();
    case "plant":     return openPlant();
    case "bookshelf": return openBookshelf();
    case "record":    return openRecord();
    case "giftbox":   return openGiftBox();
  }
}

// ---------- input ----------
function attachInput() {
  canvas.addEventListener("pointermove", (e) => {
    const p = canvasPosFromEvent(e);
    pointer.x = p.x; pointer.y = p.y;
    const o = hitObject(p.x, p.y);
    pointer.over = o;
    canvas.style.cursor = o ? "pointer" : "crosshair";
    hintEl.textContent = o ? o.label : defaultHint();
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.over = null;
    hintEl.textContent = defaultHint();
  });
  canvas.addEventListener("click", (e) => {
    const p = canvasPosFromEvent(e);
    const o = hitObject(p.x, p.y);
    if (o) {
      playClickTick();
      openObject(o);
    }
  });

  document.getElementById("close").addEventListener("click", hideVignette);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideVignette();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideVignette();
  });

  const muteBtn = document.getElementById("mute");
  muteBtn.addEventListener("click", () => {
    state.muted = !state.muted;
    muteBtn.classList.toggle("muted", state.muted);
    muteBtn.textContent = state.muted ? "♪" : "♪";
    saveState();
    if (!state.muted) playClickTick();
  });
  muteBtn.classList.toggle("muted", state.muted);
}

// ---------- hints ----------
const hintEl = document.getElementById("hint");
function defaultHint() {
  const newGift = state.lastGiftDay === todayKey() && !state.giftSeenToday && state.gifts.length > 0;
  if (newGift) return `the crow left something for you.`;
  if (state.visits === 1) return "a room. look around.";
  if (state.trust <= 1) return `visit ${state.visits}. something watches from the shelf.`;
  if (state.trust <= 3) return `visit ${state.visits}. the crow noticed you.`;
  if (state.trust <= 5) return `visit ${state.visits}. the crow is nearer now.`;
  if (state.trust <= 6) return `visit ${state.visits}. the crow trusts you.`;
  return `visit ${state.visits}. the crow brings you things now.`;
}

// ---------- loop ----------
let lastT = 0;
function tick(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  drawRoom(t);
  updateCrow(dt);
  drawCrow();
  requestAnimationFrame(tick);
}

// ---------- boot ----------
loadState();
initWeather();
initStars();
// entry flight — crow flies in from off-screen to its perch on every load (trust 1+)
{
  const perch = crowPositionForTrust();
  if (state.trust === 0) {
    crow.x = perch.x;
    crow.y = perch.y;
  } else {
    // start above and to the right, out of frame, then fly to perch
    crow.x = W + 16;
    crow.y = -20;
    crow.facing = -1;
    crow.nextHopAt = 6 + Math.random() * 6;
    setTimeout(() => startFlight(perch, 24, 0.6), 400);
  }
}
attachInput();
hintEl.textContent = defaultHint();
scheduleGiftDelivery();
requestAnimationFrame(tick);
