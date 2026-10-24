/* =========================================================================
   LAB 118 — runtime, part 1
   Setup, bilingual strings, protocol metadata, state, storage and helpers.
   Shipped file is js/lab.js (concatenate lab.01..lab.06).
   ========================================================================= */
(function () {
  "use strict";

  const DATA = window.LAB_DATA || {};
  const FLAME = DATA.FLAME || {};
  const LINES = DATA.LINES || {};
  const POTENTIALS = DATA.POTENTIALS || {};
  const REAGENTS = DATA.REAGENTS || [];
  const REACTIONS = DATA.REACTIONS || {};
  const MISSION = (DATA.MISSIONS && DATA.MISSIONS.A01) || {
    id: "A01", code: "VAKA 001", targetZ: 11, candidates: [3, 11, 19, 20, 38, 29]
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const $id = (id) => document.getElementById(id);
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const KEYS = {
    profile: "pt.lab.profile",
    notebook: "pt.lab.notebook",
    mission: "pt.lab.mission",
    safety: "pt.lab.safety"
  };

  const CAT_COLORS = {
    "alkali-metal": "#ff7a59",
    "alkaline-earth-metal": "#ffb454",
    "transition-metal": "#4cc9f0",
    "post-transition-metal": "#7dd3a7",
    metalloid: "#b8e986",
    nonmetal: "#5eead4",
    halogen: "#f9e76c",
    "noble-gas": "#c084fc",
    lanthanide: "#f472b6",
    actinide: "#fb7185",
    unknown: "#94a3b8"
  };

  const PROTOCOLS = [
    {
      id: "density", station: "bench", icon: "i-scale",
      name: ["Yoğunluk ölçümü", "Density measurement"],
      desc: ["Kütle ve hacimden yoğunluk; belirsizlik ve karşılaştırma.", "Density from mass and volume; uncertainty and comparison."],
      tag: ["ÖLÇÜM", "MEASUREMENT"]
    },
    {
      id: "inspect", station: "bench", icon: "i-search",
      name: ["Yüzey ve özellikler", "Surface and properties"],
      desc: ["Görünüm, kristal yapı, manyetizma ve iletkenlik.", "Appearance, crystal structure, magnetism and conductivity."],
      tag: ["GÖZLEM", "OBSERVATION"]
    },
    {
      id: "flame", station: "flame", icon: "i-flame",
      name: ["Alev ve emisyon", "Flame and emission"],
      desc: ["Alev rengi, görünür tayf çizgileri ve deşarj tüpü.", "Flame colour, visible spectral lines and discharge tube."],
      tag: ["TAYF", "SPECTRUM"]
    },
    {
      id: "reaction", station: "reaction", icon: "i-beaker",
      name: ["Reaksiyon hücresi", "Reaction cell"],
      desc: ["Reaktif, sıcaklık ve miktar kontrollü tepkime.", "Reaction with controlled reagent, temperature and amount."],
      tag: ["KİMYA", "CHEMISTRY"]
    },
    {
      id: "thermal", station: "thermal", icon: "i-thermo",
      name: ["Termal ve faz", "Thermal and phase"],
      desc: ["Faz geçişleri, ısıtma eğrisi ve kararlılık.", "Phase transitions, heating curve and stability."],
      tag: ["TERMAL", "THERMAL"]
    }
  ];

  const STATIONS = [
    { id: "bench", icon: "i-grid", label: ["Tezgâh", "Bench"] },
    { id: "flame", icon: "i-flame", label: ["Alev ve Tayf", "Flame & Spectrum"] },
    { id: "reaction", icon: "i-beaker", label: ["Reaksiyon", "Reaction"] },
    { id: "thermal", icon: "i-thermo", label: ["Termal", "Thermal"] },
    { id: "notebook", icon: "i-notebook", label: ["Defter", "Notebook"] }
  ];

  const EVIDENCE = [
    { key: "flame", icon: "i-flame", label: ["Alev ve tayf", "Flame and spectrum"] },
    { key: "density", icon: "i-scale", label: ["Yoğunluk", "Density"] },
    { key: "reaction", icon: "i-beaker", label: ["Reaksiyon", "Reaction"] },
    { key: "thermal", icon: "i-thermo", label: ["Termal davranış", "Thermal behaviour"] },
    { key: "inspect", icon: "i-search", label: ["Yüzey ve özellik", "Surface and properties"] }
  ];
  const MIN_EVIDENCE = 2;

  const CONF = {
    literature: ["Literatür", "Literature"],
    measured: ["Ölçüldü", "Measured"],
    predicted: ["Öngörü", "Predicted"],
    indicative: ["Gösterge", "Indicative"],
    symbolic: ["Sembolik", "Symbolic"]
  };

  const state = {
    lang: "tr",
    initialized: false,
    entered: false,
    pendingEnter: false,
    z: 11,
    protocol: "density",
    station: "bench",
    missionActive: false,
    missionSolved: false,
    missionAttempts: 0,
    missionHints: 0,
    evidence: {},
    profile: { name: "", lab: "", guest: true },
    safety: { goggles: true, gloves: true, coat: true, hood: false, shield: false, risk: false },
    inputs: defaultInputs(),
    running: false,
    runToken: 0,
    lastRun: null,
    lastResult: null,
    notebook: [],
    overlay: null,
    scene: null,
    pickerQuery: "",
    toastTimer: 0,
    statusTimer: 0,
    lastFocus: null,
    resizeObserver: null
  };

  function defaultInputs() {
    return {
      density: { mass: 2.0, method: "auto" },
      inspect: { surface: "as-received" },
      flame: { mode: "auto", duration: 4 },
      reaction: { reagent: "H2O", temp: 25, amount: 1.0, stir: true },
      thermal: { temp: 25, atmosphere: "air", rate: 5 }
    };
  }

  function L(tr, en) { return state.lang === "en" ? en : tr; }
  function loc(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] || obj.en || obj.tr || "";
  }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#' + name + '"/></svg>';
  }
  function fmt(n, digits) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    const v = Number(n);
    const d = digits == null ? 3 : Math.max(0, Math.min(20, digits));
    if (v !== 0 && (Math.abs(v) < 0.001 || Math.abs(v) >= 1e7)) {
      return v.toExponential(Math.max(1, Math.min(3, d))).replace("e+", "×10^").replace("e-", "×10^−");
    }
    return v.toLocaleString(state.lang === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: d });
  }
  function fmtFixed(n, digits) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return Number(n).toLocaleString(state.lang === "tr" ? "tr-TR" : "en-US", {
      minimumFractionDigits: digits, maximumFractionDigits: digits
    });
  }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function K2C(k) { return k == null ? null : k - 273.15; }
  function fmtK(k) {
    if (k == null) return "—";
    return fmt(k, 2) + " K <small>(" + fmt(K2C(k), 1) + " °C)</small>";
  }
  function fmtTemp(k) {
    if (k == null) return "—";
    return fmt(K2C(k), 1) + " °C";
  }
  function fmtDensity(d) {
    if (d == null) return "—";
    if (d < 0.01) return fmt(d * 1000, 4) + " g/L";
    return fmt(d, 3) + " g/cm³";
  }
  function categoryName(cat) {
    const key = "categories." + cat;
    const translated = window.t ? window.t(key) : key;
    if (translated && translated !== key) return translated;
    return cat || "—";
  }
  function phaseName(phase) {
    const key = "states." + (phase || "unknown");
    const translated = window.t ? window.t(key) : key;
    return translated && translated !== key ? translated : (phase || "—");
  }
  function crystalName(code) {
    if (!code) return "—";
    const key = "crystals." + code;
    const translated = window.t ? window.t(key) : key;
    return translated && translated !== key ? translated : code;
  }
  function magneticName(code) {
    if (!code) return "—";
    const key = "magnetic." + code;
    const translated = window.t ? window.t(key) : key;
    return translated && translated !== key ? translated : code;
  }
  function confLabel(conf) {
    const item = CONF[conf] || CONF.indicative;
    return L(item[0], item[1]);
  }
  function confBadge(conf) {
    const c = conf || "indicative";
    return '<span class="lab-confidence c-' + esc(c) + '">' + esc(confLabel(c)) + "</span>";
  }
  function protocolMeta(id) {
    return PROTOCOLS.find((p) => p.id === id) || PROTOCOLS[0];
  }
  function stationMeta(id) {
    return STATIONS.find((s) => s.id === id) || STATIONS[0];
  }
  function elementByZ(z) {
    const data = window.PERIODIC_DATA;
    if (!data || !Array.isArray(data.elements)) return null;
    return data.elements.find((el) => el.z === Number(z)) || null;
  }
  function currentElement() { return elementByZ(state.z); }
  function reagentById(id) { return REAGENTS.find((r) => r.id === id) || REAGENTS[0]; }
  function isBlind() { return state.missionActive && !state.missionSolved; }
  function sampleCode() { return MISSION.code || "VAKA 001"; }
  function sampleName(el) {
    if (isBlind()) return L("Etiketsiz numune A-01", "Unlabeled sample A-01");
    return el ? loc(el.name) : "—";
  }
  function sampleSymbol(el) { return isBlind() ? "?" : (el ? el.symbol : "?"); }
  function hashNoise(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function jitter(z, salt, amp) { return (hashNoise(z * 7.13 + salt * 13.77) - 0.5) * 2 * amp; }
  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString(state.lang === "tr" ? "tr-TR" : "en-US", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { return new Date(ts).toISOString(); }
  }
  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function loadState() {
    state.lang = (window.getLang && window.getLang()) || "tr";
    const profile = readStore(KEYS.profile, null);
    if (profile && typeof profile === "object") {
      state.profile = {
        name: String(profile.name || ""),
        lab: String(profile.lab || ""),
        guest: !!profile.guest
      };
    }
    const safety = readStore(KEYS.safety, null);
    if (safety && typeof safety === "object") {
      Object.keys(state.safety).forEach((key) => {
        if (typeof safety[key] === "boolean") state.safety[key] = safety[key];
      });
    }
    const mission = readStore(KEYS.mission, null);
    if (mission && typeof mission === "object") {
      state.missionSolved = !!mission.solved;
      state.missionAttempts = Number(mission.attempts) || 0;
      state.missionHints = Number(mission.hints) || 0;
    }
    const notebook = readStore(KEYS.notebook, []);
    state.notebook = Array.isArray(notebook) ? notebook.filter((r) => r && r.id).slice(0, 250) : [];
  }
  function saveSafety() { writeStore(KEYS.safety, state.safety); }
  function saveMission() {
    writeStore(KEYS.mission, {
      solved: state.missionSolved,
      attempts: state.missionAttempts,
      hints: state.missionHints,
      ts: Date.now()
    });
  }
  function saveNotebook() {
    state.notebook = state.notebook.slice(0, 250);
    writeStore(KEYS.notebook, state.notebook);
    renderNotebookCount();
  }
  function researcherName() {
    if (state.profile && state.profile.guest) return L("Misafir Araştırmacı", "Guest Researcher");
    return (state.profile && state.profile.name) || L("Dr. Araştırmacı", "Dr. Researcher");
  }
  function labName() {
    return state.profile.lab || L("Analitik Kimya Laboratuvarı", "Analytical Chemistry Laboratory");
  }
  function toast(message, kind) {
    const el = $id("lab-toast");
    if (!el) return;
    el.textContent = message;
    el.className = "lab-toast is-visible" + (kind ? " is-" + kind : "");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { el.className = "lab-toast"; }, 2600);
  }
  function status(message, kind) {
    const el = $id("lab-status");
    if (!el) return;
    el.textContent = message;
    el.className = "lab-status" + (kind ? " is-" + kind : "");
    clearTimeout(state.statusTimer);
    if (kind) {
      state.statusTimer = setTimeout(() => {
        el.className = "lab-status";
        el.textContent = L("Sistem hazır · numune bekleniyor", "System ready · awaiting sample");
      }, 5200);
    }
  }
  function openOverlay(name) {
    const el = $id("lab-" + name + "-overlay");
    if (!el) return;
    state.lastFocus = document.activeElement;
    $$(".lab-overlay").forEach((o) => o.classList.add("hidden"));
    el.classList.remove("hidden");
    state.overlay = name;
    const focusable = el.querySelector("input, select, textarea, button");
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 60);
  }
  function closeOverlay(name) {
    const target = name || state.overlay;
    if (!target) return;
    const el = $id("lab-" + target + "-overlay");
    if (el) el.classList.add("hidden");
    if (state.overlay === target) state.overlay = null;
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      try { state.lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }
  function closeAllOverlays() {
    $$(".lab-overlay").forEach((o) => o.classList.add("hidden"));
    state.overlay = null;
  }

