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

/* =========================================================================
   LAB 118 — runtime, part 2
   Chrome, sample card, protocol list, mission card, navigation and boot.
   ========================================================================= */

  function applyChrome() {
    const setText = (id, text) => { const el = $id(id); if (el) el.textContent = text; };
    setText("lab-title", L("Element Araştırma Laboratuvarı", "Element Research Laboratory"));
    setText("lab-subtitle", L("Analitik kimya · Gerçek zamanlı simülasyon", "Analytical chemistry · real-time simulation"));
    setText("lab-live-label", L("OTURUM AKTİF", "SESSION ACTIVE"));
    setText("lab-sample-heading", L("Numune", "Sample"));
    setText("lab-pick-sample", L("Değiştir", "Change"));
    setText("lab-station-label", L(stationMeta(state.station).label[0], stationMeta(state.station).label[1]));

    const protocolHeading = $(".lab-protocol-block .lab-block-head h2");
    if (protocolHeading) protocolHeading.textContent = L("Protokol", "Protocol");
    const controlHeading = $(".lab-right > .lab-block-head h2");
    if (controlHeading) controlHeading.textContent = L("Deney kontrolü", "Experiment control");

    const back = $id("lab-back");
    if (back) {
      back.setAttribute("aria-label", L("Tabloya dön", "Back to table"));
      const span = back.querySelector("span");
      if (span) span.textContent = L("Tabloya dön", "Back to table");
    }
    const profileName = $id("lab-profile-name");
    if (profileName) profileName.textContent = researcherName();
    const notebookBtn = $id("lab-notebook-btn");
    if (notebookBtn) notebookBtn.setAttribute("aria-label", L("Laboratuvar defterini aç", "Open laboratory notebook"));
    const settingsBtn = $id("lab-settings-btn");
    if (settingsBtn) settingsBtn.setAttribute("aria-label", L("Laboratuvar profili ve güvenlik ayarları", "Laboratory profile and safety settings"));
    const profileBtn = $id("lab-profile-btn");
    if (profileBtn) profileBtn.setAttribute("aria-label", L("Araştırmacı profili", "Researcher profile"));

    $$("#lab-stations [data-station]").forEach((btn) => {
      const meta = stationMeta(btn.dataset.station);
      const span = btn.querySelector("span");
      if (span) span.textContent = L(meta.label[0], meta.label[1]);
      const active = btn.dataset.station === state.station;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const fallback = $id("lab-fallback-text");
    if (fallback) fallback.textContent = L(
      "3B laboratuvar bu tarayıcıda başlatılamadı. Enstrüman paneli ve deney motoru çalışmaya devam ediyor.",
      "The 3D laboratory could not start in this browser. The instrument panel and experiment engine remain fully functional."
    );

    applyProfileChrome();
    applyPickerChrome();
    applyNotebookChrome();
    const missionClose = $("#lab-mission-overlay .lab-overlay-close");
    if (missionClose) missionClose.setAttribute("aria-label", L("Kapat", "Close"));
  }

  function applyProfileChrome() {
    const overlay = $id("lab-profile-overlay");
    if (!overlay) return;
    const eyebrow = overlay.querySelector(".lab-eyebrow");
    if (eyebrow) eyebrow.textContent = L("LAB 118 · ARAŞTIRMACI GİRİŞİ", "LAB 118 · RESEARCHER ACCESS");
    const title = $id("lab-profile-title");
    if (title) title.textContent = L("Laboratuvarına hoş geldin.", "Welcome to your laboratory.");
    const desc = overlay.querySelector(".lab-modal-head p");
    if (desc) desc.textContent = L(
      "Bu laboratuvar senin. İsmini ve çalışma alanını tanımla; deney defteri ve raporlar bu kimlikle imzalanacak.",
      "This laboratory is yours. Define your name and workspace; the notebook and reports will be signed with this identity."
    );
    const nameInput = $id("lab-profile-input-name");
    const labInput = $id("lab-profile-input-lab");
    if (nameInput) {
      nameInput.placeholder = L("Dr. Ada Lovelace", "Dr. Ada Lovelace");
      const label = nameInput.closest(".lab-field");
      const span = label && label.querySelector("span");
      if (span) span.textContent = L("Araştırmacı adı", "Researcher name");
    }
    if (labInput) {
      labInput.placeholder = L("Analitik Kimya Laboratuvarı", "Analytical Chemistry Laboratory");
      const label = labInput.closest(".lab-field");
      const span = label && label.querySelector("span");
      if (span) span.textContent = L("Laboratuvar adı", "Laboratory name");
    }
    const note = overlay.querySelector(".lab-profile-note p");
    if (note) note.textContent = L(
      "Bu bir eğitim simülasyonudur. Gerçek kimyasal prosedürler için güncel SDS ve kurumsal güvenlik protokollerini kullanın.",
      "This is an educational simulation. For real chemical procedures, use current SDS documents and institutional safety protocols."
    );
    const skip = $id("lab-profile-skip");
    if (skip) skip.textContent = L("Misafir olarak devam et", "Continue as guest");
    const submit = overlay.querySelector('button[type="submit"]');
    if (submit) submit.textContent = L("Laboratuvarı aç", "Open laboratory");
    const close = overlay.querySelector(".lab-overlay-close");
    if (close) close.setAttribute("aria-label", L("Kapat", "Close"));
  }

  function applyPickerChrome() {
    const overlay = $id("lab-picker-overlay");
    if (!overlay) return;
    const eyebrow = overlay.querySelector(".lab-eyebrow");
    if (eyebrow) eyebrow.textContent = L("NUMUNE ARŞİVİ · 118 ELEMENT", "SAMPLE ARCHIVE · 118 ELEMENTS");
    const title = $id("lab-picker-title");
    if (title) title.textContent = L("Numune seç", "Select a sample");
    const desc = overlay.querySelector(".lab-modal-head p");
    if (desc) desc.textContent = L(
      "Periyodik tablodan bir element seç ve tezgâha gönder.",
      "Choose an element from the periodic table and send it to the bench."
    );
    const search = $id("lab-picker-search");
    if (search) search.placeholder = L("Sembol, ad veya atom numarası…", "Symbol, name or atomic number…");
    const random = $id("lab-picker-random");
    if (random) random.textContent = L("Rastgele", "Random");
    const close = overlay.querySelector(".lab-overlay-close");
    if (close) close.setAttribute("aria-label", L("Kapat", "Close"));
  }

  function applyNotebookChrome() {
    const overlay = $id("lab-notebook-overlay");
    if (!overlay) return;
    const eyebrow = overlay.querySelector(".lab-eyebrow");
    if (eyebrow) eyebrow.textContent = L("LAB 118 · KAYITLAR", "LAB 118 · RECORDS");
    const title = $id("lab-notebook-title");
    if (title) title.textContent = L("Laboratuvar defteri", "Laboratory notebook");
    const desc = overlay.querySelector(".lab-modal-head p");
    if (desc) desc.textContent = L(
      "Her deney; ölçümler, gözlemler ve güvenilirlik etiketiyle kaydedilir.",
      "Every experiment is recorded with measurements, observations and a confidence label."
    );
    const exportBtn = $id("lab-notebook-export");
    if (exportBtn) exportBtn.innerHTML = icon("i-download") + L("Rapor indir", "Download report");
    const printBtn = $id("lab-notebook-print");
    if (printBtn) printBtn.innerHTML = icon("i-print") + L("Yazdır", "Print");
    const clearBtn = $id("lab-notebook-clear");
    if (clearBtn) clearBtn.innerHTML = icon("i-trash") + L("Temizle", "Clear");
    const close = overlay.querySelector(".lab-overlay-close");
    if (close) close.setAttribute("aria-label", L("Kapat", "Close"));
    renderNotebookCount();
  }

  function renderAll() {
    applyChrome();
    renderSample();
    renderProtocols();
    renderMissionCard();
    renderControls();
    renderSafety();
    renderResults();
    renderNotebookCount();
    if (state.overlay === "notebook") renderNotebook();
    if (state.overlay === "picker") renderPicker();
    if (state.overlay === "mission") renderMission();
  }

  function renderSample() {
    const root = $id("lab-sample-card");
    if (!root) return;
    const el = currentElement();
    if (!el) {
      root.innerHTML = '<div class="lab-results-empty"><strong>' + esc(L("Numune yok", "No sample")) + "</strong></div>";
      return;
    }
    const blind = isBlind();
    const color = blind ? "#fbbf24" : (CAT_COLORS[el.category] || CAT_COLORS.unknown);
    const tags = [];
    if (blind) {
      tags.push('<span class="lab-tag is-warn">' + esc(L("ETİKETSİZ", "UNLABELED")) + "</span>");
      tags.push('<span class="lab-tag">A-01</span>');
      tags.push('<span class="lab-tag">' + esc(phaseName(el.phase)) + "</span>");
      tags.push('<span class="lab-tag is-accent">' + esc(L("KİMLİK GİZLİ", "IDENTITY MASKED")) + "</span>");
    } else {
      tags.push('<span class="lab-tag is-accent">' + esc(categoryName(el.category)) + "</span>");
      tags.push('<span class="lab-tag">' + esc(phaseName(el.phase)) + "</span>");
      if (el.radioactive) tags.push('<span class="lab-tag is-danger">' + esc(L("RADYOAKTİF", "RADIOACTIVE")) + "</span>");
      if (el.predicted) tags.push('<span class="lab-tag is-warn">' + esc(L("ÖNGÖRÜLEN", "PREDICTED")) + "</span>");
      if (el.hazard && el.hazard.ghs && el.hazard.ghs.length) {
        tags.push('<span class="lab-tag is-warn">GHS ' + esc(el.hazard.ghs.join(" · ")) + "</span>");
      }
    }

    const note = blind
      ? '<div class="lab-sample-note"><svg class="icon"><use href="#i-target"/></svg><span>' +
        esc(L("Kimlik maskeli. En az iki bağımsız kanıtla elementi belirle; sonuçlar ve denklemler M sembolüyle gösterilir.",
          "Identity masked. Identify the element with at least two independent lines of evidence; results and equations use the placeholder M.")) +
        "</span></div>"
      : el.radioactive
        ? '<div class="lab-sample-note"><svg class="icon"><use href="#i-radiation"/></svg><span>' +
          esc(L("Radyoaktif numune. Kurşun siper, çeker ocak ve dozimetre zorunludur.", "Radioactive sample. Lead shield, fume hood and dosimeter are mandatory.")) + "</span></div>"
        : el.hazard && el.hazard.ghs && el.hazard.ghs.length
          ? '<div class="lab-sample-note"><svg class="icon"><use href="#i-shield"/></svg><span>' +
            esc(L("Tehlikeli madde: çalışma öncesi GHS etiketini ve KKE gereksinimlerini kontrol et.",
              "Hazardous substance: review the GHS label and PPE requirements before work.")) + "</span></div>"
          : '<div class="lab-sample-note is-info"><svg class="icon"><use href="#i-check"/></svg><span>' +
            esc(L("Numune tezgâhta hazır. Bir protokol seç ve çalıştır.", "Sample ready on the bench. Select a protocol and run it.")) + "</span></div>";

    const meta = blind
      ? [
          [L("Fiziksel hâl", "Physical state"), phaseName(el.phase)],
          [L("Depolama", "Storage"), L("Mineral yağ / argon", "Mineral oil / argon")],
          [L("Yoğunluk", "Density"), L("Ölçülmedi", "Not measured")],
          [L("Erime noktası", "Melting point"), L("Ölçülmedi", "Not measured")]
        ]
      : [
          [L("Yoğunluk", "Density"), fmtDensity(el.density)],
          [L("Erime", "Melting"), el.melting == null ? "—" : fmtTemp(el.melting)],
          [L("Kaynama", "Boiling"), el.boiling == null ? "—" : fmtTemp(el.boiling)],
          [L("Kristal", "Crystal"), crystalName(el.crystal)]
        ];

    root.innerHTML =
      '<div class="lab-sample-main">' +
        '<div class="lab-sample-symbol" style="--sc:' + color + '"><small>' + (blind ? "A-01" : "Z=" + el.z) + "</small>" +
          (blind ? "?" : esc(el.symbol)) + "</div>" +
        '<div class="lab-sample-id"><strong>' + esc(sampleName(el)) + "</strong>" +
          "<span>" + (blind ? esc(L("Etiketsiz numune · analiz bekliyor", "Unlabeled sample · awaiting analysis")) : esc(el.symbol + " · Z=" + el.z + " · " + categoryName(el.category))) + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="lab-sample-tags">' + tags.join("") + "</div>" +
      '<div class="lab-sample-meta">' + meta.map((pair) =>
        '<div class="lab-meta-item"><span>' + esc(pair[0]) + "</span><strong>" + esc(pair[1]) + "</strong></div>"
      ).join("") + "</div>" +
      note;
  }

  function renderProtocols() {
    const root = $id("lab-protocols");
    if (!root) return;
    root.innerHTML = PROTOCOLS.map((p) => {
      const active = p.id === state.protocol;
      const done = state.missionActive && state.evidence[p.id];
      return '<button type="button" class="lab-protocol' + (active ? " is-active" : "") + '" data-protocol="' + p.id + '" aria-pressed="' + (active ? "true" : "false") + '">' +
        '<span class="lab-protocol-icon">' + icon(p.icon) + "</span>" +
        '<span class="lab-protocol-text"><strong>' + esc(L(p.name[0], p.name[1])) + "</strong><small>" + esc(L(p.desc[0], p.desc[1])) + "</small></span>" +
        (done ? '<span class="lab-protocol-flag">' + esc(L("KANIT", "EVIDENCE")) + "</span>" : "") +
      "</button>";
    }).join("");
  }

  function renderMissionCard() {
    const root = $id("lab-mission-card");
    if (!root) return;
    const done = EVIDENCE.filter((e) => state.evidence[e.key]).length;
    if (state.missionSolved) {
      const target = elementByZ(MISSION.targetZ);
      root.innerHTML =
        '<div class="lab-mission-eyebrow">' + icon("i-check") + esc(sampleCode()) + " · " + esc(L("ÇÖZÜLDÜ", "SOLVED")) + "</div>" +
        "<h3>" + esc(L("Vaka kapatıldı", "Case closed")) + "</h3>" +
        "<p>" + esc(L("Numune kimliği doğrulandı: ", "Sample identity confirmed: ")) + "<b>" + esc(target ? loc(target.name) : "") + "</b></p>" +
        '<div class="lab-mission-status is-solved">' + icon("i-check") + esc(L("Kanıt zinciri tamam", "Evidence chain complete")) + "</div>" +
        '<div class="lab-mission-actions">' +
          '<button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-open">' + esc(L("Dosyayı aç", "Open file")) + "</button>" +
          '<button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-reset">' + esc(L("Yeniden", "Replay")) + "</button>" +
        "</div>";
      return;
    }
    if (state.missionActive) {
      root.innerHTML =
        '<div class="lab-mission-eyebrow">' + icon("i-target") + esc(sampleCode()) + " · " + esc(L("AKTİF", "ACTIVE")) + "</div>" +
        "<h3>" + esc(L("Etiketsiz numune A-01", "Unlabeled sample A-01")) + "</h3>" +
        "<p>" + esc(L("En az iki bağımsız kanıtla kimliği belirle. Şu an ", "Identify with at least two independent lines of evidence. Currently ")) + done + "/" + EVIDENCE.length + " " + esc(L("kanıt toplandı.", "evidence collected.")) + "</p>" +
        '<div class="lab-mission-progress">' + EVIDENCE.map((e) => '<i class="' + (state.evidence[e.key] ? "is-done" : "") + '"></i>').join("") + "</div>" +
        '<div class="lab-mission-actions">' +
          '<button class="btn btn-primary btn-small" type="button" data-lab-action="mission-open">' + esc(L("Vakayı incele", "Review case")) + "</button>" +
          '<button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-hint">' + esc(L("İpucu", "Hint")) + "</button>" +
        "</div>";
      return;
    }
    root.innerHTML =
      '<div class="lab-mission-eyebrow">' + icon("i-spark") + esc(L("ARAŞTIRMA VAKASI", "RESEARCH CASE")) + "</div>" +
      "<h3>" + esc(L("Vaka 001 · Etiketsiz numune", "Case 001 · Unlabeled sample")) + "</h3>" +
      "<p>" + esc(L("Mineral yağ altında gelen A-01 numunesinin kimliğini belirle.", "Identify sample A-01, delivered under mineral oil.")) + "</p>" +
      '<div class="lab-mission-actions">' +
        '<button class="btn btn-lab-cta btn-small" type="button" data-lab-action="mission-start">' + esc(L("Vakayı başlat", "Start case")) + "</button>" +
        '<button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-open">' + esc(L("Dosya", "File")) + "</button>" +
      "</div>";
  }

  function renderNotebookCount() {
    const count = $id("lab-notebook-count");
    if (count) count.textContent = String(state.notebook.length);
    const meta = $id("lab-notebook-meta");
    if (meta) meta.textContent = state.notebook.length + " " + L("kayıt", "records");
  }

  function setProtocol(id, opts) {
    const meta = protocolMeta(id);
    if (!meta) return;
    state.protocol = meta.id;
    state.station = meta.station;
    state.lastResult = null;
    state.lastRun = null;
    renderProtocols();
    renderControls();
    renderSafety();
    renderResults();
    applyChrome();
    sceneSetMode(meta.id === "flame" ? "flame" : meta.id === "reaction" ? "reaction" : meta.id === "thermal" ? "thermal" : "idle");
    sceneFocus(meta.station);
    if (!opts || !opts.silent) status(L("Protokol hazır: ", "Protocol ready: ") + L(meta.name[0], meta.name[1]));
  }

  function setStation(id) {
    if (id === "notebook") { openNotebook(); return; }
    const station = stationMeta(id);
    if (!station) return;
    state.station = station.id;
    const candidates = PROTOCOLS.filter((p) => p.station === id);
    if (candidates.length && !candidates.some((p) => p.id === state.protocol)) {
      setProtocol(candidates[0].id, { silent: true });
    } else {
      renderAll();
    }
    sceneFocus(station.id);
    status(L("İstasyon: ", "Station: ") + L(station.label[0], station.label[1]));
  }

  function openNotebook() {
    renderNotebook();
    openOverlay("notebook");
  }

  function openPicker() {
    if (isBlind()) {
      toast(L("Aktif vaka sırasında numune değiştirilemez. Önce vakayı çöz veya sıfırla.", "The sample is locked during an active case. Solve or reset the case first."), "warn");
      return;
    }
    state.pickerQuery = "";
    const search = $id("lab-picker-search");
    if (search) search.value = "";
    renderPicker();
    openOverlay("picker");
  }

  function openMission() {
    renderMission();
    openOverlay("mission");
  }

  function pickSample() { openPicker(); }

  function setSample(z, opts) {
    const el = elementByZ(z);
    if (!el) return false;
    if (isBlind() && Number(z) !== MISSION.targetZ) {
      toast(L("Aktif vaka sırasında numune değiştirilemez.", "The sample is locked during an active case."), "warn");
      return false;
    }
    state.z = Number(z);
    state.lastResult = null;
    state.lastRun = null;
    renderAll();
    sceneSetSample(el, isBlind());
    if (!opts || !opts.silent) {
      toast(isBlind() ? L("A-01 tezgâhta.", "A-01 is on the bench.") : L("Numune tezgâhta: ", "Sample on the bench: ") + loc(el.name), "success");
    }
    status(L("Numune yüklendi: ", "Sample loaded: ") + sampleName(el));
    return true;
  }

  function sendElement(z) {
    ensureInit();
    if (!elementByZ(z)) return;
    if (!state.entered) enter();
    if (isBlind() && Number(z) !== MISSION.targetZ) {
      toast(L("Aktif vaka sırasında numune değiştirilemez.", "The sample is locked during an active case."), "warn");
      return;
    }
    if (state.missionSolved && Number(z) !== MISSION.targetZ) {
      state.missionActive = false;
    }
    setSample(Number(z));
  }

  function enter() {
    if (!state.initialized) {
      if (document.readyState === "loading") { state.pendingEnter = true; return; }
      init();
    }
    if (state.entered) { sceneResume(); return; }
    state.entered = true;
    document.body.classList.add("lab-mode");
    const el = currentElement();
    if (el) sceneSetSample(el, isBlind());
    renderAll();
    sceneResume();
    requestAnimationFrame(() => { sceneResize(); sceneFocus(state.station, true); });
    status(L("Sistem hazır · numune bekleniyor", "System ready · awaiting sample"));
    if (!readStore(KEYS.profile, null)) {
      setTimeout(() => {
        if (state.entered && !state.overlay) {
          const name = $id("lab-profile-input-name");
          const lab = $id("lab-profile-input-lab");
          if (name) name.value = state.profile.name || "";
          if (lab) lab.value = state.profile.lab || "";
          openOverlay("profile");
        }
      }, 450);
    }
  }

  function leave() {
    state.entered = false;
    document.body.classList.remove("lab-mode");
    closeAllOverlays();
    scenePause();
  }

  function setLang(lang) {
    if (lang !== "tr" && lang !== "en") return;
    state.lang = lang;
    applyChrome();
    relocalizeNotebook();
    renderAll();
    if (state.lastRun) {
      state.lastResult = computeResult(state.lastRun.z, state.lastRun.protocol, state.lastRun.inputs, { silent: true });
      renderResults();
    }
    if (state.overlay === "notebook") renderNotebook();
    if (state.overlay === "picker") renderPicker();
    if (state.overlay === "mission") renderMission();
  }

  function saveProfile(name, lab, guest) {
    state.profile = {
      name: String(name || "").trim(),
      lab: String(lab || "").trim(),
      guest: !!guest
    };
    writeStore(KEYS.profile, state.profile);
    applyChrome();
    closeOverlay("profile");
    toast(L("Laboratuvar kimliği kaydedildi.", "Laboratory identity saved."), "success");
  }

  function onProfileSubmit(event) {
    event.preventDefault();
    const name = $id("lab-profile-input-name");
    const lab = $id("lab-profile-input-lab");
    saveProfile(name ? name.value : "", lab ? lab.value : "", false);
  }

  function onProfileSkip() {
    saveProfile("", "", true);
  }

  function onControlInput(event) {
    const target = event.target;
    if (!target || !target.id) return;
    const id = target.id;
    const value = target.type === "checkbox" ? target.checked : target.value;
    if (id === "lab-mass") state.inputs.density.mass = Number(value);
    else if (id === "lab-method") state.inputs.density.method = value;
    else if (id === "lab-surface") state.inputs.inspect.surface = value;
    else if (id === "lab-flame-mode") state.inputs.flame.mode = value;
    else if (id === "lab-flame-duration") state.inputs.flame.duration = Number(value);
    else if (id === "lab-reagent") state.inputs.reaction.reagent = value;
    else if (id === "lab-temp") state.inputs.reaction.temp = Number(value);
    else if (id === "lab-amount") state.inputs.reaction.amount = Number(value);
    else if (id === "lab-stir") state.inputs.reaction.stir = !!value;
    else if (id === "lab-target") state.inputs.thermal.temp = Number(value);
    else if (id === "lab-atmosphere") state.inputs.thermal.atmosphere = value;
    else if (id === "lab-rate") state.inputs.thermal.rate = Number(value);
    else if (id === "lab-safety-goggles" || id === "lab-safety-gloves" || id === "lab-safety-coat" ||
             id === "lab-safety-hood" || id === "lab-safety-shield" || id === "lab-safety-risk") {
      const key = id.replace("lab-safety-", "");
      state.safety[key] = !!value;
      saveSafety();
      renderSafety();
      return;
    }
    updateControlValue(id);
    updateGate();
  }

  function updateControlValue(id) {
    const map = {
      "lab-mass": [state.inputs.density.mass.toFixed(1) + " g", "mass"],
      "lab-temp": [fmt(state.inputs.reaction.temp, 0) + " °C", "temp"],
      "lab-amount": [state.inputs.reaction.amount.toFixed(1) + " g", "amount"],
      "lab-flame-duration": [fmt(state.inputs.flame.duration, 0) + " s", "flame-duration"],
      "lab-target": [fmt(state.inputs.thermal.temp, 0) + " °C", "target"],
      "lab-rate": [fmt(state.inputs.thermal.rate, 0) + " K/dk", "rate"]
    };
    const item = map[id];
    if (!item) return;
    const el = document.querySelector('[data-value-for="' + item[1] + '"]');
    if (el) el.textContent = item[0];
  }

  function onPickerSearch(event) {
    state.pickerQuery = String(event.target.value || "").toLowerCase();
    renderPicker();
  }

  function randomSample() {
    const z = 1 + Math.floor(Math.random() * 118);
    const ok = setSample(z);
    if (ok) closeOverlay("picker");
  }

  function bindDom() {
    const shell = $id("lab-shell");
    if (!shell) return;
    shell.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close]");
      if (close) { closeOverlay(close.dataset.close); return; }
      const overlay = event.target.closest(".lab-overlay");
      if (overlay && event.target === overlay) { closeOverlay(overlay.id.replace("lab-", "").replace("-overlay", "")); return; }
      const station = event.target.closest("[data-station]");
      if (station) { setStation(station.dataset.station); return; }
      const protocol = event.target.closest("[data-protocol]");
      if (protocol) { setProtocol(protocol.dataset.protocol); return; }
      const action = event.target.closest("[data-lab-action]");
      if (action) { onLabAction(action.dataset.labAction, action); return; }
    });

    const profileBtn = $id("lab-profile-btn");
    if (profileBtn) profileBtn.addEventListener("click", () => {
      const name = $id("lab-profile-input-name");
      const lab = $id("lab-profile-input-lab");
      if (name) name.value = state.profile.name || "";
      if (lab) lab.value = state.profile.lab || "";
      openOverlay("profile");
    });
    const settingsBtn = $id("lab-settings-btn");
    if (settingsBtn) settingsBtn.addEventListener("click", () => {
      toast(L("Profil ve güvenlik ayarları", "Profile and safety settings"));
      const name = $id("lab-profile-input-name");
      const lab = $id("lab-profile-input-lab");
      if (name) name.value = state.profile.name || "";
      if (lab) lab.value = state.profile.lab || "";
      openOverlay("profile");
    });
    const notebookBtn = $id("lab-notebook-btn");
    if (notebookBtn) notebookBtn.addEventListener("click", openNotebook);
    const pickBtn = $id("lab-pick-sample");
    if (pickBtn) pickBtn.addEventListener("click", pickSample);

    const profileForm = $id("lab-profile-form");
    if (profileForm) profileForm.addEventListener("submit", onProfileSubmit);
    const skip = $id("lab-profile-skip");
    if (skip) skip.addEventListener("click", onProfileSkip);

    const search = $id("lab-picker-search");
    if (search) search.addEventListener("input", onPickerSearch);
    const random = $id("lab-picker-random");
    if (random) random.addEventListener("click", randomSample);

    const controls = $id("lab-controls");
    if (controls) {
      controls.addEventListener("input", onControlInput);
      controls.addEventListener("change", onControlInput);
    }
    const safety = $id("lab-safety");
    if (safety) {
      safety.addEventListener("change", onControlInput);
      safety.addEventListener("input", onControlInput);
    }

    const notebookExport = $id("lab-notebook-export");
    if (notebookExport) notebookExport.addEventListener("click", exportReport);
    const notebookPrint = $id("lab-notebook-print");
    if (notebookPrint) notebookPrint.addEventListener("click", printReport);
    const notebookClear = $id("lab-notebook-clear");
    if (notebookClear) notebookClear.addEventListener("click", clearNotebook);

    const missionBody = $id("lab-mission-body");
    if (missionBody) missionBody.addEventListener("click", onMissionClick);

    document.addEventListener("keydown", (event) => {
      if (!state.entered) return;
      if (event.key === "Escape" && state.overlay) { closeOverlay(); }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !state.overlay) {
        event.preventDefault();
        runExperiment();
      }
    });
    window.addEventListener("resize", () => {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(sceneResize, 140);
    });
    document.addEventListener("visibilitychange", () => {
      if (!state.entered) return;
      if (document.hidden) scenePause(); else sceneResume();
    });
  }

  function onLabAction(action, button) {
    switch (action) {
      case "pick": openPicker(); break;
      case "random": randomSample(); break;
      case "run": runExperiment(); break;
      case "reset":
        state.lastResult = null; state.lastRun = null; renderResults();
        sceneSetMode(state.protocol);
        status(L("Deney sıfırlandı.", "Experiment reset."));
        break;
      case "repeat":
        if (state.lastRun) {
          state.inputs[state.lastRun.protocol] = Object.assign({}, state.lastRun.inputs);
          renderControls();
          runExperiment();
        }
        break;
      case "notebook": openNotebook(); break;
      case "mission-open": openMission(); break;
      case "mission-start": startMission(); break;
      case "mission-hint": revealHint(); break;
      case "mission-reset": resetMission(); break;
      case "save": saveRecord(state.lastResult); break;
      case "pick-element":
        if (button && button.dataset.z) {
          if (setSample(Number(button.dataset.z))) closeOverlay("picker");
        }
        break;
      case "delete-record":
        if (button && button.dataset.record) deleteRecord(button.dataset.record);
        break;
      default: break;
    }
  }

  function init() {
    if (state.initialized) return;
    loadState();
    bindDom();
    state.initialized = true;
    applyChrome();
    renderAll();
    renderPicker();
    renderNotebook();
    initScene();
    if (state.pendingEnter) {
      state.pendingEnter = false;
      enter();
    }
  }

  function ensureInit() {
    if (state.initialized) return;
    if (document.readyState === "loading") { state.pendingEnter = true; return; }
    init();
  }
/* =========================================================================
   LAB 118 — runtime, part 3
   Protocol controls, safety requirements, PPE panel and run gate.
   ========================================================================= */

  function thermalMax(el) {
    if (!el) return 1200;
    const topK = el.boiling || el.melting || 1200;
    return clamp(Math.ceil(K2C(topK) + 220), 500, 4000);
  }

  function renderControls() {
    const root = $id("lab-controls");
    if (!root) return;
    const el = currentElement();
    const p = protocolMeta(state.protocol);
    if (!el) {
      root.innerHTML = '<div class="lab-results-empty"><strong>' + esc(L("Numune seç", "Select a sample")) + "</strong></div>";
      return;
    }
    let fields = "";
    if (state.protocol === "density") fields = densityFields(el);
    else if (state.protocol === "inspect") fields = inspectFields(el);
    else if (state.protocol === "flame") fields = flameFields(el);
    else if (state.protocol === "reaction") fields = reactionFields(el);
    else if (state.protocol === "thermal") fields = thermalFields(el);

    root.innerHTML =
      '<div class="lab-controls-head">' +
        '<div class="lab-eyebrow">' + esc(L("PROTOKOL", "PROTOCOL")) + " · " + esc(L(p.tag[0], p.tag[1])) + "</div>" +
        "<h3>" + esc(L(p.name[0], p.name[1])) + "</h3>" +
        "<p>" + esc(L(p.desc[0], p.desc[1])) + "</p>" +
      "</div>" +
      '<div class="lab-form-grid">' + fields + "</div>" +
      '<div class="lab-run-row">' +
        '<button class="lab-run" id="lab-run-btn" type="button" data-lab-action="run">' + icon("i-play") +
          "<span>" + esc(L("Deneyi çalıştır", "Run experiment")) + "</span></button>" +
        '<button class="lab-run-reset" type="button" data-lab-action="reset" aria-label="' + esc(L("Sıfırla", "Reset")) + '">' + icon("i-reset") + "</button>" +
      "</div>" +
      '<div class="lab-gate" id="lab-gate"></div>' +
      '<div class="lab-progress"><i id="lab-progress-bar"></i></div>' +
      '<div class="lab-run-meta"><span id="lab-run-meta-left">' + esc(L("HAZIR", "READY")) + '</span><span id="lab-run-meta-right">' +
        esc(L("Ctrl/⌘ + Enter", "Ctrl/⌘ + Enter")) + "</span></div>";
    updateGate();
  }

  function densityFields(el) {
    const phase = el.phase || "solid";
    const methods = [
      ["auto", L("Otomatik (önerilen)", "Automatic (recommended)")],
      ["displacement", L("Su yer değiştirme", "Water displacement")],
      ["pycnometer", L("Piknometre", "Pycnometer")],
      ["syringe", L("Gaz şırıngası", "Gas syringe")]
    ];
    return fieldRange("lab-mass", L("Numune kütlesi", "Sample mass"), state.inputs.density.mass, 0.1, 5, 0.1, state.inputs.density.mass.toFixed(1) + " g", "mass") +
      '<label class="lab-field"><span>' + esc(L("Hacim yöntemi", "Volume method")) + "</span>" +
        '<select id="lab-method">' + methods.map((m) =>
          '<option value="' + m[0] + '"' + (state.inputs.density.method === m[0] ? " selected" : "") + ">" + esc(m[1]) + "</option>"
        ).join("") + "</select>" +
        "<small>" + esc(phase === "gas"
          ? L("Gaz numunede hacim, kapalı şırıngada basınç ve sıcaklıkla ölçülür.", "For gases, volume is measured in a sealed syringe with pressure and temperature.")
          : phase === "liquid"
            ? L("Sıvı numunede piknometre, bilinen hacimde kütle ölçümü sağlar.", "For liquids, a pycnometer gives mass in a known volume.")
            : L("Katı numunede taşan su hacmi, numunenin hacmini verir.", "For solids, displaced water volume gives the sample volume.")) + "</small>" +
      "</label>" +
      '<div class="lab-gate is-ready">' + icon("i-check") + "<span>" +
        esc(L("Ölçüm belirsizliği: kütle ±0.001 g, hacim ±0.05 cm³. Sonuç iki anlamlı basamağa yuvarlanır.",
          "Measurement uncertainty: mass ±0.001 g, volume ±0.05 cm³. The result is rounded to two significant figures.")) +
      "</span></div>";
  }

  function inspectFields(el) {
    const surfaces = [
      ["as-received", L("Teslim alındığı gibi", "As received")],
      ["polished", L("Parlatılmış", "Polished")],
      ["fractured", L("Taze kırık yüzey", "Fresh fracture")]
    ];
    return '<label class="lab-field"><span>' + esc(L("Yüzey hazırlığı", "Surface preparation")) + "</span>" +
      '<select id="lab-surface">' + surfaces.map((s) =>
        '<option value="' + s[0] + '"' + (state.inputs.inspect.surface === s[0] ? " selected" : "") + ">" + esc(s[1]) + "</option>"
      ).join("") + "</select><small>" +
      esc(L("Yüzey hazırlığı görünüm ve parlaklık değerlendirmesini etkiler; kristal yapı ve manyetizma hacimsel özelliklerdir.",
        "Surface preparation affects appearance and lustre; crystal structure and magnetism are bulk properties.")) + "</small></label>" +
      '<div class="lab-gate is-ready">' + icon("i-search") + "<span>" +
        esc(L("Gözlem; görünüm, faz, kristal yapı, manyetizma ve termal iletkenlik üzerinden raporlanır.",
          "Observation reports appearance, phase, crystal structure, magnetism and thermal conductivity.")) + "</span></div>";
  }

  function flameFields(el) {
    const hasFlame = !!FLAME[el.z];
    const modes = [
      ["auto", L("Otomatik", "Automatic")],
      ["flame", L("Alev testi (nichrome halka)", "Flame test (nichrome loop)")],
      ["discharge", L("Deşarj tüpü", "Discharge tube")]
    ];
    return '<label class="lab-field"><span>' + esc(L("Uyarma yöntemi", "Excitation method")) + "</span>" +
      '<select id="lab-flame-mode">' + modes.map((m) =>
        '<option value="' + m[0] + '"' + (state.inputs.flame.mode === m[0] ? " selected" : "") + ">" + esc(m[1]) + "</option>"
      ).join("") + "</select><small>" +
      esc(hasFlame
        ? L("Bu numune için alev/tayf verisi mevcut. Otomatik mod, veri türüne göre uygun yöntemi seçer.", "Flame/spectral data are available for this sample. Automatic mode selects the appropriate method.")
        : L("Bu numune için karakteristik alev verisi sınırlı; deşarj tüpü veya ICP-MS önerilir.", "Characteristic flame data are limited for this sample; a discharge tube or ICP-MS is recommended.")) +
      "</small></label>" +
      fieldRange("lab-flame-duration", L("Pozlama süresi", "Exposure time"), state.inputs.flame.duration, 1, 10, 1, fmt(state.inputs.flame.duration, 0) + " s", "flame-duration") +
      '<div class="lab-gate is-warn">' + icon("i-flame") + "<span>" +
        esc(L("Açık alev: yanıcı buharlardan uzak çalış, saçları bağla ve çeker ocağı aç.", "Open flame: work away from flammable vapours, tie hair back and use the fume hood.")) + "</span></div>";
  }

  function reactionFields(el) {
    const reagent = reagentById(state.inputs.reaction.reagent);
    return '<label class="lab-field"><span>' + esc(L("Reaktif", "Reagent")) + "</span>" +
      '<select id="lab-reagent">' + REAGENTS.map((r) =>
        '<option value="' + esc(r.id) + '"' + (state.inputs.reaction.reagent === r.id ? " selected" : "") + ">" +
          esc(r.formula + " · " + loc(r.name)) + "</option>"
      ).join("") + "</select><small>" + esc(loc(reagent.note)) + "</small></label>" +
      fieldRange("lab-temp", L("Sıcaklık", "Temperature"), state.inputs.reaction.temp, 0, 1200, 5, fmt(state.inputs.reaction.temp, 0) + " °C", "temp") +
      fieldRange("lab-amount", L("Numune miktarı", "Sample amount"), state.inputs.reaction.amount, 0.1, 5, 0.1, state.inputs.reaction.amount.toFixed(1) + " g", "amount") +
      '<label class="lab-checkline"><input type="checkbox" id="lab-stir"' + (state.inputs.reaction.stir ? " checked" : "") + ">" +
        "<span>" + esc(L("Manyetik karıştırıcı açık", "Magnetic stirrer on")) + "</span></label>" +
      '<div class="lab-gate is-warn">' + icon("i-beaker") + "<span>" +
        esc(L("Reaksiyon hücresi kapalı sistemdir; gaz çıkışı ve sıcaklık artışı sensörlerle izlenir.",
          "The reaction cell is a closed system; gas evolution and temperature rise are monitored by sensors.")) + "</span></div>";
  }

  function thermalFields(el) {
    const max = thermalMax(el);
    if (state.inputs.thermal.temp > max) state.inputs.thermal.temp = max;
    if (state.inputs.thermal.temp < -200) state.inputs.thermal.temp = -200;
    return fieldRange("lab-target", L("Hedef sıcaklık", "Target temperature"), state.inputs.thermal.temp, -200, max, 5, fmt(state.inputs.thermal.temp, 0) + " °C", "target") +
      '<label class="lab-field"><span>' + esc(L("Atmosfer", "Atmosphere")) + "</span>" +
        '<select id="lab-atmosphere">' +
          '<option value="air"' + (state.inputs.thermal.atmosphere === "air" ? " selected" : "") + ">" + esc(L("Hava", "Air")) + "</option>" +
          '<option value="argon"' + (state.inputs.thermal.atmosphere === "argon" ? " selected" : "") + ">" + esc(L("Argon (inert)", "Argon (inert)")) + "</option>" +
        "</select><small>" + esc(L("Reaktif metaller için inert atmosfer oksitlenmeyi azaltır.", "An inert atmosphere reduces oxidation for reactive metals.")) + "</small></label>" +
      fieldRange("lab-rate", L("Isıtma hızı", "Heating rate"), state.inputs.thermal.rate, 1, 20, 1, fmt(state.inputs.thermal.rate, 0) + " K/dk", "rate") +
      '<div class="lab-gate is-warn">' + icon("i-thermo") + "<span>" +
        esc(L("Yüksek sıcaklık: sıcak yüzeylere dokunma; termal kamera ve ısı kalkanı kullan.",
          "High temperature: do not touch hot surfaces; use a thermal camera and heat shield.")) + "</span></div>";
  }

  function fieldRange(id, label, value, min, max, step, display, valueKey) {
    return '<label class="lab-field"><span>' + esc(label) + " <b>" + esc(display) + "</b></span>" +
      '<div class="lab-range-row"><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '">' +
      '<span class="lab-range-val" data-value-for="' + valueKey + '">' + esc(display) + "</span></div></label>";
  }

  function safetyRequirements() {
    const req = { goggles: true, gloves: true, coat: true, hood: false, shield: false, risk: false };
    const el = currentElement();
    if (!el) return req;
    if (isBlind()) { req.hood = true; req.risk = true; }
    if (state.protocol === "flame") req.risk = true;
    if (state.protocol === "thermal") {
      const tC = Number(state.inputs.thermal.temp);
      if (tC >= 300) req.risk = true;
      if (tC >= 600) req.hood = true;
      if (el.radioactive) { req.hood = true; req.shield = true; req.risk = true; }
    }
    if (state.protocol === "reaction") {
      const reagent = reagentById(state.inputs.reaction.reagent);
      const reaction = getReaction(el, reagent.id, Number(state.inputs.reaction.temp));
      if (reagent.hazard || reaction.requiresHood || el.radioactive) req.hood = true;
      if (reaction.requiresShield || el.radioactive) req.shield = true;
      if (reagent.hazard || reaction.requiresHood || (reaction.phenomena || []).includes("flame")) req.risk = true;
    }
    if (el.radioactive) { req.hood = true; req.shield = true; req.risk = true; }
    return req;
  }

  function renderSafety() {
    const root = $id("lab-safety");
    if (!root) return;
    const el = currentElement();
    const req = safetyRequirements();
    const blind = isBlind();
    const ppe = [
      ["goggles", L("Gözlük", "Goggles")],
      ["gloves", L("Eldiven", "Gloves")],
      ["coat", L("Önlük", "Lab coat")],
      ["hood", L("Çeker ocak", "Fume hood")],
      ["shield", L("Kurşun siper", "Lead shield")]
    ];
    const missing = ppe.filter((p) => req[p[0]] && !state.safety[p[0]]).map((p) => p[1]);
    const stateClass = missing.length ? "is-blocked" : "";
    const stateLabel = missing.length
      ? L("KKE EKSİK", "PPE INCOMPLETE")
      : L("GÜVENLİ", "SAFE");

    const hazardHtml = blind
      ? '<div class="lab-hazard-empty">' + esc(L("Etiketsiz numune: GHS sınıflandırması bilinmiyor. Temkinli varsayılan uygulanır.", "Unlabeled sample: GHS classification unknown. Conservative defaults apply.")) + "</div>"
      : hazardChips(el);

    const nfpa = !blind && el.hazard && el.hazard.nfpa
      ? '<div class="lab-nfpa">' +
        '<span class="nfpa-h">H <b>' + esc(el.hazard.nfpa.h || "0") + "</b></span>" +
        '<span class="nfpa-f">F <b>' + esc(el.hazard.nfpa.f || "0") + "</b></span>" +
        '<span class="nfpa-i">I <b>' + esc(el.hazard.nfpa.i || "0") + "</b></span>" +
        '<span class="nfpa-s">S <b>' + esc(el.hazard.nfpa.s || "0") + "</b></span></div>"
      : "";

    const hphrases = !blind && el.hazard && Array.isArray(el.hazard.h)
      ? '<div class="lab-hphrase-list">' + el.hazard.h.slice(0, 4).map((code) => {
          const phrase = window.REACTIONS && window.REACTIONS.hPhrase ? window.REACTIONS.hPhrase(code) : null;
          return '<span class="lab-hphrase"><b>H' + esc(code) + "</b> " + esc(phrase ? loc(phrase) : L("Güvenlik bilgi formuna bakın.", "Consult the safety data sheet.")) + "</span>";
        }).join("") + "</div>"
      : "";

    root.innerHTML =
      '<div class="lab-safety-head">' + icon("i-shield") + "<h3>" + esc(L("Güvenlik ve KKE", "Safety and PPE")) + "</h3>" +
        '<span class="lab-safety-state ' + stateClass + '">' + esc(stateLabel) + "</span></div>" +
      '<div class="lab-ppe-grid">' + ppe.map((p) =>
        '<label class="lab-ppe' + (req[p[0]] ? " is-required" : "") + (state.safety[p[0]] ? " is-on" : "") + '">' +
          '<input type="checkbox" id="lab-safety-' + p[0] + '"' + (state.safety[p[0]] ? " checked" : "") + ">" +
          "<span>" + esc(p[1]) + "</span>" +
          (req[p[0]] ? "<small>" + esc(L("gerekli", "required")) + "</small>" : "") +
        "</label>"
      ).join("") + "</div>" +
      '<label class="lab-risk"><input type="checkbox" id="lab-safety-risk"' + (state.safety.risk ? " checked" : "") + ">" +
        "<span>" + esc(L("Risk değerlendirmesini okudum; prosedürü güvenli koşullarda uygulayacağım.", "I have read the risk assessment and will follow the procedure under safe conditions.")) + "</span></label>" +
      '<div class="lab-hazard-list">' + hazardHtml + "</div>" +
      nfpa + hphrases +
      '<div class="lab-safety-note">' + esc(blind
        ? L("Bilinmeyen numune için çeker ocak ve risk onayı zorunludur. Kimlik çözülene kadar radyoaktivite varsayımıyla çalış.",
          "A fume hood and risk acknowledgement are mandatory for the unknown sample. Work under the assumption of radioactivity until identification.")
        : L("Bu panel eğitim amaçlıdır; gerçek çalışmada güncel SDS, risk değerlendirmesi ve kurum prosedürleri esastır.",
          "This panel is educational; in real work, current SDS documents, risk assessments and institutional procedures take precedence.")) + "</div>";
    updateGate();
  }

  function hazardChips(el) {
    const hazard = el && el.hazard;
    if (!hazard) return '<div class="lab-hazard-empty">' + esc(L("GHS sınıflandırması yok.", "No GHS classification.")) + "</div>";
    const chips = [];
    if (Array.isArray(hazard.ghs)) {
      hazard.ghs.forEach((code) => {
        chips.push('<span class="lab-hazard"><b>GHS' + esc(code) + "</b></span>");
      });
    }
    if (el.radioactive) chips.push('<span class="lab-hazard is-radio"><b>' + esc(L("RADYOAKTİF", "RADIOACTIVE")) + "</b></span>");
    if (Array.isArray(hazard.hazard)) {
      hazard.hazard.forEach((code) => chips.push('<span class="lab-hazard"><b>' + esc(code) + "</b></span>"));
    }
    return chips.length ? chips.join("") : '<div class="lab-hazard-empty">' + esc(L("Özel tehlike sınıfı yok.", "No specific hazard class.")) + "</div>";
  }

  function updateGate() {
    const gate = $id("lab-gate");
    const run = $id("lab-run-btn");
    if (!gate || !run) return;
    const el = currentElement();
    if (!el) {
      gate.className = "lab-gate is-blocked";
      gate.innerHTML = icon("i-close") + "<span>" + esc(L("Önce bir numune seç.", "Select a sample first.")) + "</span>";
      run.disabled = true;
      return;
    }
    if (state.running) {
      gate.className = "lab-gate is-warn";
      gate.innerHTML = icon("i-play") + "<span>" + esc(L("Deney çalışıyor; sensörler veri topluyor.", "Experiment running; sensors are collecting data.")) + "</span>";
      run.disabled = true;
      return;
    }
    const req = safetyRequirements();
    const labels = {
      goggles: L("gözlük", "goggles"), gloves: L("eldiven", "gloves"), coat: L("önlük", "lab coat"),
      hood: L("çeker ocak", "fume hood"), shield: L("kurşun siper", "lead shield"), risk: L("risk onayı", "risk acknowledgement")
    };
    const missing = Object.keys(req).filter((key) => req[key] && !state.safety[key]).map((key) => labels[key]);
    if (missing.length) {
      gate.className = "lab-gate is-blocked";
      gate.innerHTML = icon("i-shield") + "<span>" + esc(L("Güvenlik kilidi: ", "Safety lock: ")) + esc(missing.join(", ")) + "</span>";
      run.disabled = true;
      return;
    }
    gate.className = "lab-gate is-ready";
    gate.innerHTML = icon("i-check") + "<span>" + esc(L("Güvenlik kontrolü tamam. Deney başlatılabilir.", "Safety check complete. Experiment may start.")) + "</span>";
    run.disabled = false;
  }
/* =========================================================================
   LAB 118 — runtime, part 4
   Result cards, notebook, sample archive, mission file and report export.
   ========================================================================= */

  function emptyResults() {
    return '<div class="lab-results-empty">' + icon("i-flask") +
      "<strong>" + esc(L("Sonuçlar burada görünecek", "Results will appear here")) + "</strong>" +
      "<p>" + esc(L("Numuneyi seç, protokolü ayarla ve deneyi çalıştır. Her çalıştırma ölçüm, gözlem ve güvenilirlik etiketiyle kaydedilir.",
        "Select a sample, configure a protocol and run it. Every run is recorded with measurements, observations and a confidence label.")) + "</p>" +
      "<ol><li>" + esc(L("Güvenlik kontrolünü tamamla", "Complete the safety check")) + "</li>" +
      "<li>" + esc(L("Ölçüm parametrelerini ayarla", "Set measurement parameters")) + "</li>" +
      "<li>" + esc(L("Deneyi çalıştır ve gözle", "Run and observe")) + "</li>" +
      "<li>" + esc(L("Sonucu defterde sakla", "Keep the result in the notebook")) + "</li></ol></div>";
  }

  function renderResults() {
    const root = $id("lab-results");
    if (!root) return;
    const result = state.lastResult;
    if (!result) { root.innerHTML = emptyResults(); return; }
    const p = protocolMeta(result.protocol);
    const blind = !!result.masked;
    const measures = (result.measurements || []).map((m) =>
      '<div class="lab-measure"><span>' + esc(m.label) + "</span><strong>" + esc(m.value) + "</strong>" +
      (m.note ? "<em>" + esc(m.note) + "</em>" : "") + "</div>"
    ).join("");
    const thermo = (result.thermo || []).map((t) =>
      "<span>" + esc(t.label) + " <b>" + esc(t.value) + "</b></span>"
    ).join("");
    const notes = (result.notes || []).map((n) => '<div class="lab-note">' + esc(n) + "</div>").join("");
    const evidenceCount = EVIDENCE.filter((e) => state.evidence[e.key]).length;
    const identify = blind
      ? '<div class="lab-identify-card"><h4>' + esc(L("Kimlik maskeli", "Identity masked")) + "</h4>" +
        "<p>" + esc(L("Bu sonuç kimliği açığa çıkarmaz. En az iki bağımsız kanıt toplayıp vaka dosyasından kimliği doğrula.",
          "This result does not reveal the identity. Collect at least two independent lines of evidence, then verify the identity in the case file.")) + "</p>" +
        '<div class="lab-identify-progress"><i><b style="width:' + Math.round((evidenceCount / EVIDENCE.length) * 100) + '%"></b></i>' +
          "<span>" + evidenceCount + "/" + EVIDENCE.length + " " + esc(L("kanıt", "evidence")) + "</span></div>" +
        '<button class="btn btn-lab-cta btn-small" type="button" data-lab-action="mission-open">' + esc(L("Vaka dosyasını aç", "Open case file")) + "</button></div>"
      : result.identityRevealed
        ? '<div class="lab-identify-card" style="border-color:rgba(52,211,153,.32);background:rgba(52,211,153,.05)">' +
          "<h4 style=\"color:#a7f3d0\">" + esc(L("Kimlik doğrulandı", "Identity confirmed")) + "</h4>" +
          '<div class="lab-solved-identity"><b>' + esc(result.symbol) + "</b><span>" + esc(result.name) + " · Z=" + esc(result.z) + "</span></div></div>"
        : "";

    root.innerHTML =
      '<div class="lab-result-head">' +
        '<div class="lab-result-icon">' + icon(p.icon) + "</div>" +
        '<div class="lab-result-title"><h3>' + esc(result.title) + "</h3><p>" + esc(result.subtitle || "") + "</p></div>" +
        confBadge(result.confidence) +
      "</div>" +
      (measures ? '<div class="lab-result-section"><h4>' + esc(L("Ölçümler", "Measurements")) + '</h4><div class="lab-measure-grid">' + measures + "</div></div>" : "") +
      '<div class="lab-result-section"><h4>' + esc(L("Gözlem", "Observation")) + '</h4><p class="lab-observation">' + esc(result.observation) + "</p></div>" +
      (result.equation ? '<div class="lab-equation' + (blind ? " is-masked" : "") + '">' + esc(result.equation) +
        (result.equationNote ? "<small>" + esc(result.equationNote) + "</small>" : "") + "</div>" : "") +
      (thermo ? '<div class="lab-thermo">' + thermo + "</div>" : "") +
      (result.spectrum ? renderSpectrum(result.spectrum) : "") +
      (result.curve ? renderCurve(result.curve) : "") +
      (notes ? '<div class="lab-result-section"><h4>' + esc(L("Analiz notları", "Analysis notes")) + '</h4><div class="lab-notes">' + notes + "</div></div>" : "") +
      identify +
      '<div class="lab-result-actions">' +
        '<button class="btn btn-ghost btn-small" type="button" data-lab-action="repeat">' + icon("i-reset") + esc(L("Tekrar çalıştır", "Run again")) + "</button>" +
        '<button class="btn btn-ghost btn-small" type="button" data-lab-action="notebook">' + icon("i-notebook") + esc(L("Defter", "Notebook")) + "</button>" +
        (result.recordId ? '<span class="lab-saved">' + icon("i-check") + esc(L("Deftere kaydedildi", "Saved to notebook")) + "</span>" : "") +
      "</div>";
  }

  function renderSpectrum(spec) {
    const width = 320, height = 82, left = 12, right = 8;
    const min = spec.min || 380, max = spec.max || 780;
    const span = max - min;
    const lines = (spec.lines || []).filter((l) => l >= min && l <= max);
    const visible = (spec.lines || []).filter((l) => l < min || l > max);
    const bars = lines.map((l) => {
      const x = left + ((l - min) / span) * (width - left - right);
      return '<line x1="' + x.toFixed(1) + '" y1="12" x2="' + x.toFixed(1) + '" y2="' + (height - 18) + '" stroke="' + esc(spec.color || "#67e8f9") + '" stroke-width="1.6" opacity="0.95"/>' +
        '<line x1="' + x.toFixed(1) + '" y1="12" x2="' + x.toFixed(1) + '" y2="' + (height - 18) + '" stroke="' + esc(spec.color || "#67e8f9") + '" stroke-width="5" opacity="0.12"/>';
    }).join("");
    const labels = lines.slice(0, 3).map((l) => {
      const x = left + ((l - min) / span) * (width - left - right);
      return '<text x="' + x.toFixed(1) + '" y="' + (height - 4) + '" fill="#8aa2bd" font-size="6.5" text-anchor="middle" font-family="monospace">' + l.toFixed(0) + "</text>";
    }).join("");
    const ticks = [400, 500, 600, 700].map((l) => {
      const x = left + ((l - min) / span) * (width - left - right);
      return '<line x1="' + x.toFixed(1) + '" y1="' + (height - 18) + '" x2="' + x.toFixed(1) + '" y2="' + (height - 15) + '" stroke="#31465f" stroke-width="1"/>' +
        '<text x="' + x.toFixed(1) + '" y="' + (height - 6) + '" fill="#5f7895" font-size="5.5" text-anchor="middle" font-family="monospace">' + l + "</text>";
    }).join("");
    return '<div class="lab-result-section"><h4>' + esc(L("Emisyon tayfı", "Emission spectrum")) + "</h4>" +
      '<div class="lab-spectrum-wrap"><svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + esc(L("Görünür emisyon tayfı", "Visible emission spectrum")) + '">' +
        '<rect x="0" y="0" width="' + width + '" height="' + height + '" fill="#03060d"/>' +
        '<rect x="' + left + '" y="10" width="' + (width - left - right) + '" height="' + (height - 28) + '" fill="#060b16" stroke="#16263c" stroke-width="0.6"/>' +
        bars + labels + ticks +
      "</svg>" +
      '<div class="lab-spectrum-caption"><span>' + esc(L("Görünür bölge 380–780 nm", "Visible range 380–780 nm")) + "</span>" +
        "<b>" + (lines.length ? lines.map((l) => l.toFixed(1)).join(" · ") + " nm" : esc(L("çizgi yok", "no lines"))) + "</b></div></div>" +
      (visible.length ? '<div class="lab-note">' + esc(L("Görünür bölge dışı çizgiler: ", "Lines outside the visible range: ") + visible.map((l) => l.toFixed(1)).join(" · ") + " nm") + "</div>" : "") +
      "</div>";
  }

  function renderCurve(curve) {
    const width = 320, height = 122, padL = 30, padR = 10, padT = 12, padB = 22;
    const points = curve.points || [];
    if (!points.length) return "";
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    const sx = (x) => padL + ((x - minX) / (maxX - minX || 1)) * (width - padL - padR);
    const sy = (y) => height - padB - ((y - minY) / (maxY - minY || 1)) * (height - padT - padB);
    const d = points.map((p, i) => (i ? "L" : "M") + sx(p.x).toFixed(1) + " " + sy(p.y).toFixed(1)).join(" ");
    const markers = (curve.markers || []).map((m) =>
      '<line x1="' + sx(m.x).toFixed(1) + '" y1="' + padT + '" x2="' + sx(m.x).toFixed(1) + '" y2="' + (height - padB) + '" stroke="#31465f" stroke-width="0.8" stroke-dasharray="3 3"/>' +
      '<text x="' + sx(m.x).toFixed(1) + '" y="' + (height - 5) + '" fill="#8aa2bd" font-size="6" text-anchor="middle" font-family="monospace">' + esc(m.label) + "</text>"
    ).join("");
    const current = curve.current
      ? '<circle cx="' + sx(curve.current.x).toFixed(1) + '" cy="' + sy(curve.current.y).toFixed(1) + '" r="3" fill="#67e8f9"/>' +
        '<circle cx="' + sx(curve.current.x).toFixed(1) + '" cy="' + sy(curve.current.y).toFixed(1) + '" r="7" fill="#67e8f9" opacity="0.16"/>'
      : "";
    return '<div class="lab-result-section"><h4>' + esc(L("Şematik ısıtma eğrisi", "Schematic heating curve")) + "</h4>" +
      '<div class="lab-curve-wrap"><svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + esc(L("Sıcaklık–enerji eğrisi", "Temperature–energy curve")) + '">' +
        '<rect width="' + width + '" height="' + height + '" fill="#03060d"/>' +
        '<line x1="' + padL + '" y1="' + (height - padB) + '" x2="' + (width - padR) + '" y2="' + (height - padB) + '" stroke="#16263c"/>' +
        '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (height - padB) + '" stroke="#16263c"/>' +
        '<path d="' + d + '" fill="none" stroke="#67e8f9" stroke-width="1.8"/>' +
        markers + current +
        '<text x="4" y="' + (padT + 6) + '" fill="#5f7895" font-size="5.5" font-family="monospace">T</text>' +
        '<text x="' + (width - padR) + '" y="' + (height - 7) + '" fill="#5f7895" font-size="5.5" text-anchor="end" font-family="monospace">Q</text>' +
      "</svg></div>" +
      '<div class="lab-note">' + esc(L("Eğri şematiktir; platformlar erime ve kaynama geçişlerini gösterir.", "The curve is schematic; plateaus indicate melting and boiling transitions.")) + "</div></div>";
  }

  function renderNotebook() {
    const root = $id("lab-notebook-list");
    if (!root) return;
    renderNotebookCount();
    if (!state.notebook.length) {
      root.innerHTML = '<div class="lab-notebook-empty">' + esc(L("Defter henüz boş. İlk deneyini çalıştır; ölçümler otomatik olarak buraya işlenecek.",
        "The notebook is empty. Run your first experiment; measurements will be recorded here automatically.")) + "</div>";
      return;
    }
    root.innerHTML = state.notebook.map((record) => {
      const measures = (record.measurements || []).slice(0, 4).map((m) =>
        "<span>" + esc(m.label) + ": " + esc(m.value) + "</span>"
      ).join("");
      return '<article class="lab-record">' +
        '<div class="lab-record-head"><div><strong>' + esc(record.title) + "</strong><span>" +
          esc(formatDate(record.ts)) + " · " + esc(record.protocolName) + " · " + esc(record.symbol || "?") +
          (record.mission ? " · " + esc(record.mission) : "") + "</span></div>" +
          confBadge(record.confidence) +
          '<button class="lab-icon-btn" type="button" data-lab-action="delete-record" data-record="' + esc(record.id) + '" aria-label="' + esc(L("Kaydı sil", "Delete record")) + '">' + icon("i-trash") + "</button></div>" +
        '<div class="lab-record-body"><p>' + esc(record.observation) + "</p>" +
          (record.equation ? '<div class="lab-record-eq">' + esc(record.equation) + "</div>" : "") +
          (measures ? '<div class="lab-record-meta">' + measures + "</div>" : "") +
        "</div></article>";
    }).join("");
  }

  function clearNotebook() {
    if (!state.notebook.length) { toast(L("Defter zaten boş.", "The notebook is already empty.")); return; }
    if (!window.confirm(L("Tüm laboratuvar kayıtları silinsin mi? Bu işlem geri alınamaz.", "Delete all laboratory records? This cannot be undone."))) return;
    state.notebook = [];
    saveNotebook();
    renderNotebook();
    toast(L("Laboratuvar defteri temizlendi.", "Laboratory notebook cleared."), "warn");
  }

  function deleteRecord(id) {
    state.notebook = state.notebook.filter((r) => r.id !== id);
    saveNotebook();
    renderNotebook();
    toast(L("Kayıt silindi.", "Record deleted."));
  }

  function recordFromResult(result) {
    const blind = !!result.masked;
    return {
      id: "L" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      z: blind ? null : result.z,
      symbol: blind ? "?" : result.symbol,
      name: blind ? "A-01" : result.name,
      protocol: result.protocol,
      protocolName: L(protocolMeta(result.protocol).name[0], protocolMeta(result.protocol).name[1]),
      title: result.title,
      observation: result.observation,
      equation: result.equation || "",
      inputs: result.inputs || null,
      confidence: result.confidence,
      measurements: (result.measurements || []).map((m) => ({ label: m.label, value: m.value })),
      notes: result.notes || [],
      mission: state.missionActive ? "A01" : null,
      masked: blind
    };
  }

  function persistResult(result) {
    if (!result || result.recordId) return;
    const record = recordFromResult(result);
    result.recordId = record.id;
    state.notebook.unshift(record);
    saveNotebook();
    if (state.overlay === "notebook") renderNotebook();
  }

  function saveRecord(result) {
    if (!result) return;
    if (result.recordId) { toast(L("Bu sonuç zaten defterde.", "This result is already in the notebook.")); return; }
    persistResult(result);
    renderResults();
    toast(L("Sonuç deftere kaydedildi.", "Result saved to the notebook."), "success");
  }

  function revealMissionRecords() {
    let changed = false;
    const el = elementByZ(MISSION.targetZ);
    state.notebook.forEach((record) => {
      if (record.mission !== "A01" || !record.masked) return;
      record.masked = false;
      record.z = MISSION.targetZ;
      record.symbol = el ? el.symbol : "?";
      record.name = el ? loc(el.name) : "A-01";
      if (record.inputs) {
        const fresh = computeResult(MISSION.targetZ, record.protocol, record.inputs, { reveal: true });
        if (fresh) {
          record.title = fresh.title;
          record.observation = fresh.observation;
          record.equation = fresh.equation || "";
          record.confidence = fresh.confidence;
          record.measurements = (fresh.measurements || []).map((m) => ({ label: m.label, value: m.value }));
          record.notes = fresh.notes || [];
        }
      } else if (el) {
        record.title = String(record.title || "").replace(/A-01/g, el.symbol);
      }
      changed = true;
    });
    if (changed) saveNotebook();
  }

  function relocalizeNotebook() {
    let changed = false;
    state.notebook.forEach((record) => {
      if (!record.protocol || !record.inputs) return;
      const z = record.z != null ? record.z : (record.mission === "A01" ? MISSION.targetZ : null);
      if (z == null) return;
      const fresh = computeResult(z, record.protocol, record.inputs, { reveal: !record.masked });
      if (!fresh) return;
      if (!record.masked) {
        const el = elementByZ(z);
        if (el) { record.symbol = el.symbol; record.name = loc(el.name); }
      }
      record.protocolName = L(protocolMeta(record.protocol).name[0], protocolMeta(record.protocol).name[1]);
      record.title = fresh.title;
      record.observation = fresh.observation;
      record.equation = fresh.equation || "";
      record.confidence = fresh.confidence;
      record.measurements = (fresh.measurements || []).map((m) => ({ label: m.label, value: m.value }));
      record.notes = fresh.notes || [];
      changed = true;
    });
    if (changed) saveNotebook();
  }

  function renderPicker() {
    const root = $id("lab-picker-grid");
    if (!root) return;
    const data = window.PERIODIC_DATA;
    if (!data || !Array.isArray(data.elements)) {
      root.innerHTML = '<div class="lab-picker-empty">' + esc(L("Element verisi yüklenemedi.", "Element data could not be loaded.")) + "</div>";
      return;
    }
    const q = (state.pickerQuery || "").trim().toLowerCase();
    const items = data.elements.filter((el) => {
      if (!q) return true;
      const nameTr = (el.name && el.name.tr ? el.name.tr : "").toLowerCase();
      const nameEn = (el.name && el.name.en ? el.name.en : "").toLowerCase();
      return String(el.z) === q || el.symbol.toLowerCase().includes(q) || nameTr.includes(q) || nameEn.includes(q);
    }).sort((a, b) => a.z - b.z);
    if (!items.length) {
      root.innerHTML = '<div class="lab-picker-empty">' + esc(L("Eşleşen element yok.", "No matching element.")) + "</div>";
      return;
    }
    root.innerHTML = items.map((el) => {
      const color = CAT_COLORS[el.category] || CAT_COLORS.unknown;
      const current = !isBlind() && el.z === state.z;
      return '<button type="button" class="lab-picker-item' + (current ? " is-current" : "") + '" data-lab-action="pick-element" data-z="' + el.z + '" style="--pc:' + color + '">' +
        '<span class="pi-top"><span class="pi-sym">' + esc(el.symbol) + '</span><span class="pi-z">' + el.z + "</span></span>" +
        '<span class="pi-name">' + esc(loc(el.name)) + "</span></button>";
    }).join("");
  }

  function renderMission() {
    const body = $id("lab-mission-body");
    if (!body) return;
    const target = elementByZ(MISSION.targetZ);
    const eyebrow = $id("lab-mission-eyebrow");
    const title = $id("lab-mission-title");
    const subtitle = $id("lab-mission-subtitle");
    if (eyebrow) eyebrow.textContent = sampleCode() + " · " + L("VAKA DOSYASI", "CASE FILE");
    if (title) title.textContent = state.missionSolved ? L("Vaka kapatıldı", "Case closed") : L("Vaka 001", "Case 001");
    if (subtitle) subtitle.textContent = state.missionSolved
      ? (target ? loc(target.name) + " · " + target.symbol : "")
      : loc(MISSION.subtitle);

    if (state.missionSolved) {
      const evidenceRows = EVIDENCE.map((e) => missionEvidenceRow(e)).join("");
      body.innerHTML =
        '<div class="lab-solved-card"><h3>' + icon("i-check") + esc(L("Kimlik doğrulandı", "Identity confirmed")) + "</h3>" +
          '<div class="lab-solved-identity"><b>' + esc(target ? target.symbol : "?") + "</b><span>" + esc(target ? loc(target.name) : "") + " · Z=" + esc(MISSION.targetZ) + " · " + esc(target ? categoryName(target.category) : "") + "</span></div>" +
          "<p>" + esc(L("Numune A-01'in kimliği kanıt zinciriyle doğrulandı. Tüm maskeli kayıtlar açıldı ve vaka deftere işlendi.",
            "The identity of sample A-01 was confirmed by the evidence chain. All masked records were revealed and the case was entered in the notebook.")) + "</p></div>" +
        '<div class="lab-mission-grid"><div class="lab-mission-box"><h4>' + esc(L("Kanıt zinciri", "Evidence chain")) + "</h4>" +
          '<div class="lab-evidence-list">' + evidenceRows + "</div></div>" +
          '<div class="lab-mission-box"><h4>' + esc(L("Dosya özeti", "File summary")) + "</h4><p>" + esc(loc(MISSION.brief)) + "</p></div></div>" +
        '<div class="lab-mission-actions-row"><button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-reset">' + icon("i-reset") + esc(L("Vakayı yeniden oyna", "Replay case")) + "</button>" +
          '<button class="btn btn-ghost btn-small" type="button" data-lab-action="notebook">' + icon("i-notebook") + esc(L("Defteri aç", "Open notebook")) + "</button></div>";
      return;
    }

    const done = EVIDENCE.filter((e) => state.evidence[e.key]).length;
    const candidateButtons = (MISSION.candidates || []).map((z) => {
      const el = elementByZ(z);
      if (!el) return "";
      const selected = state.missionDraft === z;
      return '<button type="button" class="lab-candidate' + (selected ? " is-selected" : "") + '" data-candidate="' + z + '">' +
        "<b>" + esc(el.symbol) + "</b><span>" + esc(loc(el.name)) + "</span></button>";
    }).join("");
    const hints = (MISSION.hints || []).slice(0, state.missionHints).map((h) => '<div class="lab-hint">' + esc(loc(h)) + "</div>").join("");
    const canIdentify = done >= MIN_EVIDENCE && state.missionDraft;
    const feedback = state.missionFeedback
      ? '<div class="lab-mission-feedback is-' + (state.missionFeedback.type === "good" ? "good" : "error") + '">' + esc(state.missionFeedback.text) + "</div>"
      : "";

    body.innerHTML =
      '<div class="lab-mission-hero">' + icon("i-target") + "<div><h3>" + esc(loc(MISSION.title)) + "</h3><p>" + esc(loc(MISSION.brief)) + "</p></div></div>" +
      '<div class="lab-mission-grid">' +
        '<div class="lab-mission-box"><h4>' + esc(L("Hedef", "Objective")) + "</h4><p>" + esc(loc(MISSION.objective)) + "</p></div>" +
        '<div class="lab-mission-box"><h4>' + esc(L("Depolama", "Storage")) + "</h4><p>" + esc(loc(MISSION.storage)) + "</p></div>" +
      "</div>" +
      '<div class="lab-mission-box"><h4>' + esc(L("Kanıtlar", "Evidence")) + " · " + done + "/" + EVIDENCE.length + '</h4><div class="lab-evidence-list">' +
        EVIDENCE.map((e) => missionEvidenceRow(e)).join("") + "</div></div>" +
      (hints ? '<div class="lab-mission-hints">' + hints + "</div>" : "") +
      '<div class="lab-mission-form"><h4>' + esc(L("Adaylar ve kimlik doğrulama", "Candidates and identity verification")) + "</h4>" +
        "<p>" + esc(L("Adaylardan birini seç. En az " + MIN_EVIDENCE + " bağımsız kanıt gerekir.",
          "Select one of the candidates. At least " + MIN_EVIDENCE + " independent lines of evidence are required.")) + "</p>" +
        '<div class="lab-candidates">' + candidateButtons + "</div>" +
        '<button class="btn btn-primary" type="button" data-mission-action="identify"' + (canIdentify ? "" : " disabled") + ">" + esc(L("Kimliği doğrula", "Verify identity")) + "</button>" +
        feedback + "</div>" +
      '<div class="lab-mission-actions-row">' +
        (state.missionActive
          ? '<button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-hint">' + icon("i-spark") + esc(L("İpucu ver", "Give a hint")) + "</button>"
          : '<button class="btn btn-lab-cta btn-small" type="button" data-lab-action="mission-start">' + icon("i-play") + esc(L("Vakayı başlat", "Start case")) + "</button>") +
        '<button class="btn btn-ghost btn-small" type="button" data-lab-action="mission-reset">' + icon("i-reset") + esc(L("Sıfırla", "Reset")) + "</button>" +
      "</div>";
  }

  function missionEvidenceRow(e) {
    const ev = state.evidence[e.key];
    return '<div class="lab-evidence' + (ev ? " is-done" : "") + '">' +
      '<span class="lab-evidence-icon">' + icon(e.icon) + "</span>" +
      "<div><strong>" + esc(L(e.label[0], e.label[1])) + "</strong><p>" +
        esc(ev ? ev.summary : L("Henüz kanıt toplanmadı.", "No evidence collected yet.")) + "</p></div>" +
      (ev ? confBadge(ev.confidence) : "") + "</div>";
  }

  function onMissionClick(event) {
    const candidate = event.target.closest("[data-candidate]");
    if (candidate) {
      state.missionDraft = Number(candidate.dataset.candidate);
      state.missionFeedback = null;
      renderMission();
      return;
    }
    const action = event.target.closest("[data-mission-action]");
    if (!action) return;
    if (action.dataset.missionAction === "identify") identifyMission();
  }

  function revealHint() {
    const hints = MISSION.hints || [];
    if (state.missionHints >= hints.length) {
      toast(L("Tüm ipuçları açıldı.", "All hints are revealed."), "warn");
      return;
    }
    state.missionHints += 1;
    saveMission();
    renderMissionCard();
    if (state.overlay === "mission") renderMission();
    toast(loc(hints[state.missionHints - 1]), "warn");
  }

  function buildReportMarkdown() {
    const lines = [];
    lines.push("# LAB 118 — " + L("Laboratuvar Raporu", "Laboratory Report"));
    lines.push("");
    lines.push("- **" + L("Araştırmacı", "Researcher") + ":** " + researcherName());
    lines.push("- **" + L("Laboratuvar", "Laboratory") + ":** " + labName());
    lines.push("- **" + L("Tarih", "Date") + ":** " + formatDate(Date.now()));
    lines.push("- **" + L("Kayıt sayısı", "Records") + ":** " + state.notebook.length);
    lines.push("");
    lines.push("> " + L("Bu rapor LAB 118 eğitim simülasyonunda üretilmiştir. Ölçümler simüle edilmiştir; gerçek laboratuvar verisi değildir.",
      "This report was generated in the LAB 118 educational simulation. Measurements are simulated, not real laboratory data."));
    lines.push("");
    state.notebook.forEach((record, index) => {
      lines.push("## " + (index + 1) + ". " + record.title);
      lines.push("");
      lines.push("- **" + L("Tarih", "Date") + ":** " + formatDate(record.ts));
      lines.push("- **" + L("Protokol", "Protocol") + ":** " + record.protocolName);
      lines.push("- **" + L("Numune", "Sample") + ":** " + (record.masked ? "A-01 (" + L("kimlik gizli", "identity masked") + ")" : (record.name + " (" + record.symbol + ")")));
      lines.push("- **" + L("Güvenilirlik", "Confidence") + ":** " + confLabel(record.confidence));
      if (record.mission) lines.push("- **" + L("Vaka", "Case") + ":** " + record.mission);
      lines.push("");
      if (record.measurements && record.measurements.length) {
        record.measurements.forEach((m) => lines.push("- " + m.label + ": **" + m.value + "**"));
        lines.push("");
      }
      lines.push(record.observation);
      if (record.equation) { lines.push(""); lines.push("```"); lines.push(record.equation); lines.push("```"); }
      if (record.notes && record.notes.length) {
        lines.push("");
        record.notes.forEach((n) => lines.push("- " + n));
      }
      lines.push("");
    });
    return lines.join("\n");
  }

  function exportReport() {
    if (!state.notebook.length) { toast(L("Rapor için önce en az bir deney çalıştır.", "Run at least one experiment before exporting a report."), "warn"); return; }
    try {
      const blob = new Blob([buildReportMarkdown()], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "LAB118-rapor-" + new Date().toISOString().slice(0, 10) + ".md";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      toast(L("Rapor indirildi.", "Report downloaded."), "success");
    } catch (e) {
      toast(L("Rapor oluşturulamadı.", "The report could not be created."), "error");
    }
  }

  function printReport() {
    if (!state.notebook.length) { toast(L("Yazdırmak için önce bir deney çalıştır.", "Run an experiment before printing."), "warn"); return; }
    const rows = state.notebook.map((record, index) => {
      const measures = (record.measurements || []).map((m) =>
        "<tr><td>" + esc(m.label) + "</td><td>" + esc(m.value) + "</td></tr>"
      ).join("");
      return '<article><h2>' + (index + 1) + ". " + esc(record.title) + "</h2>" +
        "<p class=\"meta\">" + esc(formatDate(record.ts)) + " · " + esc(record.protocolName) + " · " + esc(record.symbol || "?") + " · " + esc(confLabel(record.confidence)) + "</p>" +
        "<p>" + esc(record.observation) + "</p>" +
        (measures ? "<table>" + measures + "</table>" : "") +
        (record.equation ? "<pre>" + esc(record.equation) + "</pre>" : "") + "</article>";
    }).join("");
    const html = '<!doctype html><html lang="' + state.lang + '"><head><meta charset="utf-8"><title>LAB 118 — ' +
      esc(L("Laboratuvar Raporu", "Laboratory Report")) + '</title><style>body{font:12px/1.5 -apple-system,Segoe UI,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 20px}h1{font-size:22px}h2{font-size:15px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}.meta{color:#666;font-size:11px}table{border-collapse:collapse;width:100%;margin:8px 0}td{border-bottom:1px solid #eee;padding:3px 6px;font-size:11px}pre{background:#f5f5f5;padding:8px;font-size:11px;white-space:pre-wrap}footer{margin-top:30px;color:#777;font-size:10px;border-top:1px solid #ddd;padding-top:8px}</style></head><body>' +
      "<h1>LAB 118 — " + esc(L("Laboratuvar Raporu", "Laboratory Report")) + "</h1>" +
      "<p class=\"meta\">" + esc(researcherName()) + " · " + esc(labName()) + " · " + esc(formatDate(Date.now())) + "</p>" +
      rows + "<footer>" + esc(L("Bu rapor eğitim simülasyonunda üretilmiştir; ölçümler simüle edilmiştir.", "Generated in an educational simulation; measurements are simulated.")) + "</footer></body></html>";
    const win = window.open("", "_blank");
    if (!win) { toast(L("Yazdırma penceresi engellendi. Raporu indirmeyi dene.", "The print window was blocked. Try downloading the report."), "error"); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { try { win.focus(); win.print(); } catch (e) { /* ignore */ } }, 300);
  }
/* =========================================================================
   LAB 118 — runtime, part 5
   Scientific engine: density, inspection, flame/emission, reaction cell,
   thermal analysis, mission evidence and the run sequence.
   ========================================================================= */

  const SUB = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };
  function sub(n) { return String(n).split("").map((d) => SUB[d] || d).join(""); }
  function chargeOf(el) {
    const common = el && el.oxidationStates && Array.isArray(el.oxidationStates.common) ? el.oxidationStates.common : [];
    const positive = common.filter((n) => Number(n) > 0);
    if (positive.length) return Math.max.apply(null, positive);
    if (el && el.group && el.group <= 2) return el.group;
    return 3;
  }
  function estimateDensity(el) {
    if (el && el.density != null) return { value: el.density, predicted: !!el.predicted };
    if (!el) return { value: 1, predicted: true };
    if (el.category === "noble-gas") return { value: 0.001, predicted: true };
    if (el.phase === "gas") return { value: 0.0015, predicted: true };
    if (el.z >= 104) return { value: 5 + (el.z - 104) * 0.35, predicted: true };
    return { value: 7, predicted: true };
  }
  function localizeAppearance(text) {
    if (!text) return "—";
    if (state.lang !== "tr") return text;
    const map = {
      silvery: "gümüşi", silver: "gümüş", white: "beyaz", gray: "gri", grey: "gri", grayish: "grimsi", greyish: "grimsi",
      black: "siyah", colorless: "renksiz", colourless: "renksiz", metallic: "metalik", lustrous: "parlak",
      shiny: "parlak", dull: "mat", soft: "yumuşak", hard: "sert", brittle: "kırılgan", crystalline: "kristalin",
      gas: "gaz", liquid: "sıvı", solid: "katı", pale: "soluk", yellow: "sarı", green: "yeşil", blue: "mavi",
      red: "kırmızı", orange: "turuncu", brown: "kahverengi", violet: "mor", pink: "pembe", with: "ile", and: "ve",
      a: "bir", tinge: "ton", glow: "parıltı", exhibiting: "gösteren", cloudy: "bulutlu", bright: "parlak",
      dark: "koyu", light: "açık", reddish: "kırmızımsı", yellowish: "sarımsı", greenish: "yeşilimsi",
      bluish: "mavimsi", brownish: "kahverengimsi", violetish: "morumsu", golden: "altın", yellowgreen: "sarı-yeşil"
    };
    return String(text).replace(/\b[a-zA-Z]+\b/g, (word) => map[word.toLowerCase()] || word);
  }

  function maskSymbol(text, el) {
    if (!text || !el) return text;
    const sym = el.symbol;
    let out = String(text);
    out = out.replace(new RegExp("(^|[^A-Za-z])" + sym + "(?![a-z])", "g"), (m, pre) => pre + "M");
    const names = [el.name && el.name.tr, el.name && el.name.en].filter(Boolean);
    names.forEach((name) => {
      out = out.replace(new RegExp("\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi"), "M");
    });
    return out;
  }

  function getReaction(el, reagentId, tempC) {
    const key = el.z + "|" + reagentId;
    if (REACTIONS[key]) return Object.assign({}, REACTIONS[key], { key: key });
    return fallbackReaction(el, reagentById(reagentId), tempC);
  }

  function fallbackReaction(el, reagent, tempC) {
    const sym = el.symbol;
    const n = chargeOf(el);
    const cat = el.category;
    const potential = POTENTIALS[sym];
    const no = (tr, en, conf) => ({
      equation: "—",
      observation: { tr: tr, en: en },
      phenomena: ["none"],
      confidence: conf || "indicative",
      requiresHood: false,
      minTempC: 0,
      maxTempC: 1200
    });
    const generic = (equation, tr, en, phenomena, conf, hood) => ({
      equation: equation,
      observation: { tr: tr, en: en },
      phenomena: phenomena || [],
      confidence: conf || "indicative",
      requiresHood: !!hood,
      minTempC: 0,
      maxTempC: 1200
    });

    if (reagent.id === "H2O") {
      if (cat === "alkali-metal") {
        return generic("2" + sym + " + 2H₂O → 2" + sym + "OH + H₂↑",
          "Su ile şiddetli gaz çıkışı ve ısınma; çözelti bazikleşir.", "Vigorous gas evolution and heating with water; the solution becomes basic.",
          ["gas", "heat", "alkaline"], "literature", true);
      }
      if (cat === "alkaline-earth-metal") {
        return generic(sym + " + 2H₂O → " + sym + "(OH)₂ + H₂↑",
          "Gaz çıkışı ve ısınma; hidroksit oluşur.", "Gas evolution and heating; the hydroxide forms.",
          ["gas", "heat", "alkaline", "precipitate"], "literature", true);
      }
      if (cat === "lanthanide" || cat === "actinide") {
        return generic("2" + sym + " + 6H₂O → 2" + sym + "(OH)₃ + 3H₂↑",
          "Yavaş gaz çıkışı; hidroksit oluşur.", "Slow gas evolution; the hydroxide forms.",
          ["gas", "heat", "precipitate"], "indicative", true);
      }
      return no("Su ile gözle görülür bir tepkime yok.", "No visible reaction with water.");
    }

    if (reagent.id === "O2") {
      if (cat === "noble-gas") return no("Asal gaz; bu koşullarda oksijenle tepkime vermez.", "Noble gas; does not react with oxygen under these conditions.", "literature");
      if (cat === "halogen") return no("Halojen; oksijenle doğrudan tepkime vermez.", "Halogen; does not react directly with oxygen.");
      if (cat === "nonmetal") {
        return generic(sym + " + O₂ → " + sym + "O" + sub(Math.min(n, 3)),
          "Isıtıldığında oksit oluşur; renk ve duman elemente bağlıdır.", "An oxide forms on heating; colour and fumes depend on the element.",
          ["heat", "smoke"], "indicative", false);
      }
      const oxideEq = n === 1
        ? "4" + sym + " + O₂ → 2" + sym + "₂O"
        : n === 2
          ? "2" + sym + " + O₂ → 2" + sym + "O"
          : "4" + sym + " + " + n + "O₂ → 2" + sym + "₂O" + sub(n);
      return generic(oxideEq,
        "Isıtıldığında yüzeyde oksit tabakası oluşur.", "An oxide layer forms on the surface when heated.",
        ["heat", "passivation"], "indicative", false);
    }

    if (reagent.id === "HCl") {
      if (potential != null && potential < 0) {
        const eq = n % 2 === 0
          ? sym + " + " + n + "HCl → " + sym + "Cl" + sub(n) + " + " + (n / 2) + "H₂↑"
          : "2" + sym + " + " + (2 * n) + "HCl → 2" + sym + "Cl" + sub(n) + " + " + n + "H₂↑";
        return generic(eq,
          "Asitle gaz çıkışı; metal çözünür ve çözelti ısınır.", "Gas evolution with acid; the metal dissolves and the solution warms.",
          ["gas", "heat", "dissolve"], "literature", true);
      }
      if (potential != null && potential >= 0) {
        return no("Metal, H⁺ iyonunu indirgeyemez; seyreltik HCl ile gözle görülür tepkime yok.", "The metal cannot reduce H⁺; no visible reaction with dilute HCl.", "literature");
      }
      return no("Bu koşullarda HCl ile belirgin tepkime gözlenmez.", "No distinct reaction with HCl under these conditions.");
    }

    if (reagent.id === "Cl2") {
      if (cat === "noble-gas") return no("Asal gaz; klor ile tepkime vermez.", "Noble gas; does not react with chlorine.", "literature");
      const eq = n % 2 === 0
        ? sym + " + " + (n / 2) + "Cl₂ → " + sym + "Cl" + sub(n)
        : "2" + sym + " + " + n + "Cl₂ → 2" + sym + "Cl" + sub(n);
      return generic(eq,
        "Isıyla klorürleşme; duman ve ısı açığa çıkar.", "Chlorination with heat; fumes and heat are released.",
        ["smoke", "heat"], "indicative", true);
    }

    if (reagent.id === "NaOH") {
      const amphoteric = ["Be", "Al", "Zn", "Ga", "Sn", "Pb"].includes(sym);
      if (amphoteric) {
        return generic(sym + " + 2NaOH + 2H₂O → Na₂[" + sym + "(OH)₄] + H₂↑",
          "Amfoterik çözünme; gaz çıkışı gözlenir.", "Amphoteric dissolution; gas evolution is observed.",
          ["gas", "dissolve"], "literature", true);
      }
      return no("NaOH çözeltisinde belirgin bir değişim yok.", "No distinct change in NaOH solution.");
    }

    return no("Bu koşullarda gözle görülür tepkime yok.", "No visible reaction under these conditions.");
  }

  function reactionThermo(el, reagent) {
    const out = [];
    const pot = POTENTIALS[el.symbol];
    if (pot == null) return out;
    const n = chargeOf(el);
    if (reagent.id === "HCl" && pot < 0) {
      const e = -pot;
      out.push({ label: "E°hücre", value: "+" + fmt(e, 2) + " V" });
      out.push({ label: "ΔG°", value: fmt(-n * 96485 * e / 1000, 0) + " kJ/mol" });
    }
    if (reagent.id === "Cl2") {
      const e = 1.36 - pot;
      if (e > 0) {
        out.push({ label: "E°hücre", value: "+" + fmt(e, 2) + " V" });
        out.push({ label: "ΔG°", value: fmt(-n * 96485 * e / 1000, 0) + " kJ/mol" });
      }
    }
    return out;
  }

  function densityResult(el, inputs) {
    const phase = el.phase || "solid";
    const method = inputs.method === "auto"
      ? (phase === "gas" ? "syringe" : phase === "liquid" ? "pycnometer" : "displacement")
      : inputs.method;
    const trueD = estimateDensity(el);
    const gas = phase === "gas";
    const mass = gas ? Math.max(0.0001, trueD.value * 100) : Number(inputs.mass);
    const volume = mass / trueD.value;
    const volErr = gas ? 0.35 : 0.05 + volume * 0.012;
    const measuredVol = Math.max(0.001, volume + jitter(el.z, 3, volErr));
    const measuredD = mass / measuredVol;
    const massErr = gas ? 0.00005 : 0.001;
    const rel = Math.sqrt(Math.pow(massErr / mass, 2) + Math.pow(volErr / measuredVol, 2));
    const unc = measuredD * rel;
    const delta = ((measuredD - trueD.value) / trueD.value) * 100;
    const methodLabel = {
      displacement: L("Su yer değiştirme", "Water displacement"),
      pycnometer: L("Piknometre", "Pycnometer"),
      syringe: L("Gaz şırıngası (100 mL)", "Gas syringe (100 mL)")
    }[method] || method;
    const massText = gas ? fmtFixed(mass * 1000, 2) + " mg" : fmtFixed(mass, 3) + " g";
    const volText = gas ? fmtFixed(measuredVol, 1) + " mL" : fmtFixed(measuredVol, 2) + " cm³";
    const blind = isBlind();
    const observations = blind
      ? L("Ölçülen yoğunluk " + fmtDensity(measuredD) + " ± " + fmtDensity(unc) + ". Literatür karşılaştırması kimlik çözülene kadar gizli.",
        "Measured density " + fmtDensity(measuredD) + " ± " + fmtDensity(unc) + ". Literature comparison is hidden until identification.")
      : L("Ölçülen yoğunluk " + fmtDensity(measuredD) + " ± " + fmtDensity(unc) + "; literatür değeri " + fmtDensity(trueD.value) + ". Sapma " + fmt(delta, 1) + "%.",
        "Measured density " + fmtDensity(measuredD) + " ± " + fmtDensity(unc) + "; literature value " + fmtDensity(trueD.value) + ". Deviation " + fmt(delta, 1) + "%.");
    const measurements = [
      { label: L("Kütle", "Mass"), value: massText, note: gas ? L("100 mL gazdan hesaplandı", "Calculated from 100 mL gas") : L("Analitik terazi", "Analytical balance") },
      { label: L("Hacim", "Volume"), value: volText, note: methodLabel },
      { label: L("Yoğunluk", "Density"), value: fmtDensity(measuredD) + " ± " + fmtDensity(unc), note: L("1σ belirsizlik", "1σ uncertainty") },
      { label: L("Sıcaklık", "Temperature"), value: "25 °C", note: L("Sabit sıcaklık banyosu", "Constant-temperature bath") }
    ];
    if (!blind) measurements.push({ label: L("Literatür", "Literature"), value: fmtDensity(trueD.value), note: trueD.predicted ? L("öngörülen", "predicted") : L("referans", "reference") });
    const notes = [
      L("Yoğunluk sıcaklığa ve safsızlıklara duyarlıdır; sonuç 25 °C için raporlanır.", "Density depends on temperature and impurities; the result is reported for 25 °C."),
      L("Belirsizlik bütçesi kütle ve hacim ölçümlerini birleştirir.", "The uncertainty budget combines mass and volume measurements."),
      L("Gazlarda ölçüm, ideal gaz yaklaşımıyla 100 mL hacim üzerinden yapılır.", "For gases, the measurement uses a 100 mL volume with the ideal-gas approximation.")
    ];
    return {
      title: L("Yoğunluk ölçümü", "Density measurement") + " · " + (blind ? "A-01" : el.symbol),
      subtitle: L("Protokol: yoğunluk", "Protocol: density") + " · " + formatDate(Date.now()),
      confidence: "measured",
      observation: observations,
      equation: "ρ = m / V",
      equationNote: L("Yoğunluk, kütlenin hacme oranıdır.", "Density is mass divided by volume."),
      measurements: measurements,
      notes: notes,
      evidence: {
        key: "density",
        summary: L("ρ = " + fmtDensity(measuredD) + " ± " + fmtDensity(unc) + (measuredD < 1 ? "; 1 g/cm³'ün altında." : "; 1 g/cm³'ün üzerinde."),
          "ρ = " + fmtDensity(measuredD) + " ± " + fmtDensity(unc) + (measuredD < 1 ? "; below 1 g/cm³." : "; above 1 g/cm³.")),
        confidence: "measured"
      }
    };
  }

  function inspectResult(el, inputs) {
    const appearance = localizeAppearance(el.appearanceEn);
    const surface = inputs.surface;
    const surfaceLabel = surface === "polished" ? L("Parlatılmış", "Polished") : surface === "fractured" ? L("Taze kırık", "Fresh fracture") : L("Teslim alındığı gibi", "As received");
    const thermal = el.thermalConductivity == null ? "—" : fmt(el.thermalConductivity, 1) + " W/(m·K)";
    const oxidation = el.oxidationStates && el.oxidationStates.common ? el.oxidationStates.common.join(", ") : "—";
    const blind = isBlind();
    const observations = blind
      ? L("Yüzey: " + appearance + ". Fiziksel hâl: " + phaseName(el.phase) + ". Kristal yapı: " + crystalName(el.crystal) + ". Manyetizma: " + magneticName(el.magnetic) + ". Termal iletkenlik: " + thermal + ".",
        "Surface: " + appearance + ". Physical state: " + phaseName(el.phase) + ". Crystal structure: " + crystalName(el.crystal) + ". Magnetism: " + magneticName(el.magnetic) + ". Thermal conductivity: " + thermal + ".")
      : L("Yüzey: " + appearance + " (" + surfaceLabel + "). Fiziksel hâl: " + phaseName(el.phase) + ". Kristal yapı: " + crystalName(el.crystal) + ". Manyetizma: " + magneticName(el.magnetic) + ". Termal iletkenlik: " + thermal + ".",
        "Surface: " + appearance + " (" + surfaceLabel + "). Physical state: " + phaseName(el.phase) + ". Crystal structure: " + crystalName(el.crystal) + ". Magnetism: " + magneticName(el.magnetic) + ". Thermal conductivity: " + thermal + ".");
    return {
      title: L("Yüzey ve özellik analizi", "Surface and property analysis") + " · " + (blind ? "A-01" : el.symbol),
      subtitle: L("Protokol: gözlem", "Protocol: inspection") + " · " + formatDate(Date.now()),
      confidence: "literature",
      observation: observations,
      measurements: [
        { label: L("Görünüm", "Appearance"), value: appearance, note: surfaceLabel },
        { label: L("Fiziksel hâl", "Physical state"), value: phaseName(el.phase), note: L("25 °C, 1 atm", "25 °C, 1 atm") },
        { label: L("Kristal yapı", "Crystal structure"), value: crystalName(el.crystal), note: L("XRD / literatür", "XRD / literature") },
        { label: L("Manyetizma", "Magnetism"), value: magneticName(el.magnetic), note: L("SQUID / literatür", "SQUID / literature") },
        { label: L("Termal iletkenlik", "Thermal conductivity"), value: thermal, note: L("literatür", "literature") },
        { label: L("Oksidasyon basamakları", "Oxidation states"), value: oxidation, note: L("yaygın", "common") }
      ],
      notes: [
        L("Görünüm, yüzey hazırlığına ve aydınlatmaya göre değişebilir.", "Appearance can vary with surface preparation and illumination."),
        L("Kristal yapı ve manyetizma hacimsel özelliklerdir; yüzey filminden etkilenmez.", "Crystal structure and magnetism are bulk properties; they are not affected by surface films."),
        L("Sertlik ve kırılganlık bu protokolde nicel olarak ölçülmez.", "Hardness and brittleness are not measured quantitatively in this protocol.")
      ],
      evidence: {
        key: "inspect",
        summary: L("Görünüm: " + appearance + "; kristal: " + crystalName(el.crystal) + "; manyetizma: " + magneticName(el.magnetic) + ".",
          "Appearance: " + appearance + "; crystal: " + crystalName(el.crystal) + "; magnetism: " + magneticName(el.magnetic) + "."),
        confidence: "literature"
      }
    };
  }

  function flameResult(el, inputs) {
    const data = FLAME[el.z];
    const lines = (data && data.lines) || LINES[el.symbol] || [];
    const mode = inputs.mode === "auto" ? (data ? data.mode : "flame") : inputs.mode;
    const color = data ? data.color : (CAT_COLORS[el.category] || "#94a3b8");
    const colorName = data ? loc(data.name) : L("karakteristik değil", "not characteristic");
    const confidence = data ? (data.confidence || "literature") : (lines.length ? "literature" : "indicative");
    const modeLabel = mode === "discharge" ? L("Deşarj tüpü", "Discharge tube") : L("Alev testi", "Flame test");
    const lineText = lines.length ? lines.map((l) => fmt(l, 1)).join(" · ") + " nm" : L("görünür çizgi yok", "no visible lines");
    const blind = isBlind();
    let observation;
    if (data) {
      observation = mode === "discharge"
        ? L("Deşarj tüpünde " + colorName + " parıltı. Görünür emisyon çizgileri: " + lineText + ".",
          "A " + colorName + " glow in the discharge tube. Visible emission lines: " + lineText + ".")
        : L("Alev testinde " + colorName + " alev. Görünür emisyon çizgileri: " + lineText + ".",
          "A " + colorName + " flame in the flame test. Visible emission lines: " + lineText + ".");
    } else {
      observation = L("Bu numune alev testinde karakteristik bir renk vermedi. Görünür tayf çizgileri: " + lineText + ". Kimlik için deşarj tüpü veya ICP-MS önerilir.",
        "This sample gave no characteristic colour in the flame test. Visible spectral lines: " + lineText + ". A discharge tube or ICP-MS is recommended for identification.");
    }
    const measurements = [
      { label: L("Alev rengi", "Flame colour"), value: colorName, note: modeLabel },
      { label: L("Baskın çizgi", "Dominant line"), value: lines.length ? fmt(lines[0], 1) + " nm" : "—", note: L("görünür bölge", "visible region") },
      { label: L("Görünür çizgiler", "Visible lines"), value: lineText, note: L("spektrometre", "spectrometer") },
      { label: L("Uyarma", "Excitation"), value: modeLabel, note: L("nichrome / düşük basınç", "nichrome / low pressure") }
    ];
    return {
      title: L("Alev ve emisyon analizi", "Flame and emission analysis") + " · " + (blind ? "A-01" : el.symbol),
      subtitle: L("Protokol: alev ve tayf", "Protocol: flame and spectrum") + " · " + formatDate(Date.now()),
      confidence: confidence,
      observation: observation,
      measurements: measurements,
      spectrum: { lines: lines, color: color, min: 380, max: 780 },
      notes: [
        L("Alev rengi gözlemciye, numune saflığına ve ortam ışığına bağlıdır.", "Flame colour depends on the observer, sample purity and ambient light."),
        L("Renk tek başına kimlik için yeterli değildir; tayf çizgileri ve diğer kanıtlarla doğrulanmalıdır.", "Colour alone is not sufficient for identification; confirm with spectral lines and other evidence."),
        L("Görünür bölge dışındaki çizgiler UV/VIS spektrometre ile ölçülmelidir.", "Lines outside the visible region should be measured with a UV/VIS spectrometer.")
      ],
      evidence: {
        key: "flame",
        summary: L("Alev: " + colorName + "; çizgiler: " + lineText + ".", "Flame: " + colorName + "; lines: " + lineText + "."),
        confidence: confidence
      }
    };
  }

  function reactionResult(el, inputs) {
    const reagent = reagentById(inputs.reagent);
    const reaction = getReaction(el, reagent.id, Number(inputs.temp));
    const tempC = Number(inputs.temp);
    const threshold = Number(reaction.minTempC) || 0;
    const maxTemp = Number(reaction.maxTempC) || 1200;
    const below = tempC < threshold;
    const above = tempC > maxTemp;
    const phenomena = reaction.phenomena || [];
    const occurs = !below && phenomena.some((p) => p !== "none");
    const noReaction = !below && !occurs;
    const blind = isBlind();
    const equation = blind ? maskSymbol(reaction.equation, el) : reaction.equation;
    let observation = loc(reaction.observation);
    if (below) {
      observation = L("Tepkime eşiği " + fmt(threshold, 0) + " °C; mevcut sıcaklık " + fmt(tempC, 0) + " °C. Bu koşulda gözle görülür tepkime yok.",
        "Reaction threshold " + fmt(threshold, 0) + " °C; current temperature " + fmt(tempC, 0) + " °C. No visible reaction under these conditions.");
    } else if (above) {
      observation += " " + L("Uyarı: reaktif bu sıcaklıkta buharlaşabilir veya bozunabilir; sonuç yarı niceldir.",
        "Warning: the reagent may vaporize or decompose at this temperature; the result is semi-quantitative.");
    }
    if (blind) observation = maskSymbol(observation, el);
    const measurements = [
      { label: L("Reaktif", "Reagent"), value: reagent.formula, note: loc(reagent.name) },
      { label: L("Sıcaklık", "Temperature"), value: fmt(tempC, 0) + " °C", note: L("hücre sensörü", "cell sensor") },
      { label: L("Miktar", "Amount"), value: fmt(inputs.amount, 1) + " g", note: L("tartım", "weighed") },
      { label: L("Gaz çıkışı", "Gas evolution"), value: phenomena.includes("gas") && !below ? L("gözlendi", "observed") : L("yok", "none"), note: L("basınç sensörü", "pressure sensor") }
    ];
    const thermo = reactionThermo(el, reagent);
    const notes = [
      L("Dengeli denklem, gözlenen ana ürünü gösterir; yan ürünler ve çözelti kimyası basitleştirilmiştir.", "The balanced equation shows the main observed product; side products and solution chemistry are simplified."),
      L("Tepkime hızı yüzey alanı, karıştırma ve safsızlıklara bağlıdır.", "Reaction rate depends on surface area, stirring and impurities."),
      L("Gaz çıkışı ve ısınma gözlemleri kapalı hücrede sensörlerle izlenir.", "Gas evolution and heating are monitored by sensors in the closed cell.")
    ];
    if (thermo.length) notes.push(L("E° ve ΔG° değerleri standart koşullar (1 M, 25 °C, 1 atm) içindir.", "E° and ΔG° values are for standard conditions (1 M, 25 °C, 1 atm)."));
    if (above) notes.push(L("Sıcaklık reaktifin kararlılık aralığının üzerinde.", "The temperature is above the reagent's stability range."));
    return {
      title: L("Reaksiyon hücresi", "Reaction cell") + " · " + (blind ? "A-01" : el.symbol),
      subtitle: L("Protokol: reaksiyon", "Protocol: reaction") + " · " + formatDate(Date.now()),
      confidence: below ? "predicted" : reaction.confidence || "literature",
      observation: observation,
      equation: below ? "—" : noReaction ? "" : equation,
      equationNote: below
        ? L("Eşik sıcaklığın altında denklem uygulanmaz.", "The equation does not apply below the threshold temperature.")
        : noReaction ? "" : L("Dengeli ana denklem", "Balanced main equation"),
      measurements: measurements,
      thermo: thermo,
      notes: notes,
      reaction: { color: reaction.color || "#67e8f9", phenomena: phenomena, occurs: occurs },
      evidence: {
        key: "reaction",
        summary: below
          ? L("Tepkime eşiği " + fmt(threshold, 0) + " °C; bu koşulda tepkime yok.", "Reaction threshold " + fmt(threshold, 0) + " °C; no reaction under these conditions.")
          : L("Reaktif " + reagent.formula + ": " + loc(reaction.observation), "Reagent " + reagent.formula + ": " + loc(reaction.observation)),
        confidence: below ? "predicted" : reaction.confidence || "literature"
      }
    };
  }

  function buildHeatingCurve(el, targetC) {
    const tmC = el.melting == null ? null : K2C(el.melting);
    const tbC = el.boiling == null ? null : K2C(el.boiling);
    const start = -200;
    const max = thermalMax(el);
    const points = [{ x: 0, y: start }];
    const markers = [];
    let x = 0;
    const add = (dx, y) => { x += dx; points.push({ x: x, y: y }); };
    if (tmC != null && tmC > start && tmC < max) {
      add(1.0, tmC);
      markers.push({ x: x, label: "Tm" });
      add(0.7, tmC);
      if (tbC != null && tbC > tmC && tbC < max) {
        add(1.2, tbC);
        markers.push({ x: x, label: "Tb" });
        add(1.5, tbC);
        add(0.8, max);
      } else {
        add(1.8, max);
      }
    } else if (tbC != null && tbC > start && tbC < max) {
      add(1.2, tbC);
      markers.push({ x: x, label: "Tb" });
      add(1.5, tbC);
      add(0.8, max);
    } else {
      add(2.4, max);
    }
    const target = clamp(Number(targetC), start, max);
    let current = points[0];
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      if (target >= lo && target <= hi) {
        if (a.y === b.y) { current = a; }
        else {
          const t = (target - a.y) / (b.y - a.y);
          current = { x: a.x + (b.x - a.x) * t, y: target };
        }
        break;
      }
      current = b;
    }
    return { points: points, markers: markers, current: current, min: start, max: max };
  }

  function thermalResult(el, inputs) {
    const tm = el.melting;
    const tb = el.boiling;
    const tmC = tm == null ? null : K2C(tm);
    const tbC = tb == null ? null : K2C(tb);
    const targetC = Number(inputs.temp);
    let phase = "unknown";
    if (tmC == null) phase = "unknown";
    else if (targetC < tmC) phase = "solid";
    else if (tbC == null || targetC < tbC) phase = "liquid";
    else phase = "gas";
    const blind = isBlind();
    const atmosphere = inputs.atmosphere === "argon" ? L("Argon (inert)", "Argon (inert)") : L("Hava", "Air");
    const obs = tmC == null
      ? L("Erime ve kaynama verileri eksik; faz davranışı öngörülüyor. Hedef sıcaklık: " + fmt(targetC, 0) + " °C.",
        "Melting and boiling data are unavailable; phase behaviour is predicted. Target temperature: " + fmt(targetC, 0) + " °C.")
      : L("Hedef " + fmt(targetC, 0) + " °C: " + phaseName(phase) + ". Erime " + fmt(tmC, 1) + " °C, kaynama " + (tbC == null ? "—" : fmt(tbC, 1) + " °C") + ".",
        "Target " + fmt(targetC, 0) + " °C: " + phaseName(phase) + ". Melting " + fmt(tmC, 1) + " °C, boiling " + (tbC == null ? "—" : fmt(tbC, 1) + " °C") + ".");
    const curve = buildHeatingCurve(el, targetC);
    const measurements = [
      { label: L("Hedef sıcaklık", "Target temperature"), value: fmt(targetC, 0) + " °C", note: L("programlanabilir ısıtıcı", "programmable heater") },
      { label: L("Faz", "Phase"), value: phaseName(phase), note: L("1 atm", "1 atm") },
      { label: L("Erime noktası", "Melting point"), value: tm == null ? "—" : fmtTemp(tm), note: tm == null ? L("veri yok", "no data") : L("literatür", "literature") },
      { label: L("Kaynama noktası", "Boiling point"), value: tb == null ? "—" : fmtTemp(tb), note: tb == null ? L("veri yok", "no data") : L("literatür", "literature") },
      { label: L("Atmosfer", "Atmosphere"), value: atmosphere, note: L("hücre gazı", "cell gas") },
      { label: L("Isıtma hızı", "Heating rate"), value: fmt(inputs.rate, 0) + " K/dk", note: L("sıcaklık programı", "temperature program") }
    ];
    const notes = [
      L("Isıtma eğrisi şematiktir; gerçek termal analizde DSC/TGA eğrileri kullanılır.", "The heating curve is schematic; real thermal analysis uses DSC/TGA curves."),
      L("Erime ve kaynama noktaları 1 atm basınç içindir; basınçla değişir.", "Melting and boiling points are for 1 atm; they change with pressure."),
      L("Hava atmosferinde reaktif metaller oksitlenebilir; inert atmosfer bu etkiyi azaltır.", "Reactive metals may oxidize in air; an inert atmosphere reduces this effect.")
    ];
    return {
      title: L("Termal ve faz analizi", "Thermal and phase analysis") + " · " + (blind ? "A-01" : el.symbol),
      subtitle: L("Protokol: termal", "Protocol: thermal") + " · " + formatDate(Date.now()),
      confidence: el.predicted ? "predicted" : (tm == null ? "indicative" : "literature"),
      observation: obs,
      measurements: measurements,
      curve: curve,
      notes: notes,
      thermal: { temp: targetC, phase: phase, atmosphere: inputs.atmosphere },
      evidence: {
        key: "thermal",
        summary: tm == null
          ? L("Faz geçiş verileri eksik; hedef " + fmt(targetC, 0) + " °C.", "Phase transition data unavailable; target " + fmt(targetC, 0) + " °C.")
          : L("Erime " + fmt(tmC, 1) + " °C; kaynama " + (tbC == null ? "—" : fmt(tbC, 1) + " °C") + "; hedef " + fmt(targetC, 0) + " °C'de " + phaseName(phase) + ".",
            "Melting " + fmt(tmC, 1) + " °C; boiling " + (tbC == null ? "—" : fmt(tbC, 1) + " °C") + "; " + phaseName(phase) + " at " + fmt(targetC, 0) + " °C."),
        confidence: el.predicted ? "predicted" : "literature"
      }
    };
  }

  function computeResult(z, protocol, inputs, opts) {
    const el = elementByZ(z);
    if (!el) return null;
    const blind = isBlind() && !(opts && opts.reveal);
    let result;
    if (protocol === "density") result = densityResult(el, inputs);
    else if (protocol === "inspect") result = inspectResult(el, inputs);
    else if (protocol === "flame") result = flameResult(el, inputs);
    else if (protocol === "reaction") result = reactionResult(el, inputs);
    else if (protocol === "thermal") result = thermalResult(el, inputs);
    else result = densityResult(el, inputs);
    result.z = blind ? null : el.z;
    result.symbol = blind ? "?" : el.symbol;
    result.name = blind ? "A-01" : loc(el.name);
    result.protocol = protocol;
    result.inputs = JSON.parse(JSON.stringify(inputs || {}));
    result.masked = blind;
    result.identityRevealed = !blind && state.missionSolved && el.z === MISSION.targetZ;
    if (blind) {
      result.title = result.title.replace(/·\s*[A-Za-z]{1,3}$/, "· A-01");
      result.observation = maskSymbol(result.observation, el);
      if (result.equation) result.equation = maskSymbol(result.equation, el);
      if (result.equationNote) result.equationNote = maskSymbol(result.equationNote, el);
      result.measurements = (result.measurements || []).map((m) => ({
        label: maskSymbol(m.label, el), value: maskSymbol(m.value, el), note: m.note ? maskSymbol(m.note, el) : ""
      }));
      result.notes = (result.notes || []).map((n) => maskSymbol(n, el));
      if (result.evidence) result.evidence.summary = maskSymbol(result.evidence.summary, el);
    }
    return result;
  }

  function applyEvidence(result) {
    if (!state.missionActive || !result || !result.evidence) return;
    state.evidence[result.evidence.key] = {
      summary: result.evidence.summary,
      confidence: result.evidence.confidence,
      ts: Date.now()
    };
    renderProtocols();
    renderMissionCard();
    if (state.overlay === "mission") renderMission();
  }

  function updateRunUI(running) {
    const btn = $id("lab-run-btn");
    const bar = $id("lab-progress-bar");
    const left = $id("lab-run-meta-left");
    const right = $id("lab-run-meta-right");
    if (btn) {
      btn.disabled = !!running;
      btn.classList.toggle("is-running", !!running);
      btn.innerHTML = icon(running ? "i-reset" : "i-play") + "<span>" +
        esc(running ? L("Ölçüm alınıyor…", "Collecting data…") : L("Deneyi çalıştır", "Run experiment")) + "</span>";
    }
    if (bar) bar.style.width = running ? "8%" : "100%";
    if (left) left.textContent = running ? L("ÇALIŞIYOR", "RUNNING") : L("TAMAM", "COMPLETE");
    if (right) right.textContent = running ? L("sensörler aktif", "sensors active") : formatDate(Date.now());
    if (!running) updateGate();
  }

  function setProgress(p) {
    const bar = $id("lab-progress-bar");
    if (bar) bar.style.width = Math.round(clamp(p, 0, 1) * 100) + "%";
    sceneSetProgress(clamp(p, 0, 1));
  }

  function runExperiment() {
    if (state.running) return;
    const el = currentElement();
    if (!el) { toast(L("Önce bir numune seç.", "Select a sample first."), "warn"); return; }
    const req = safetyRequirements();
    const missing = Object.keys(req).filter((k) => req[k] && !state.safety[k]);
    if (missing.length) {
      renderSafety();
      toast(L("Güvenlik kilidi: gerekli KKE tamamlanmadan deney başlatılamaz.", "Safety lock: complete the required PPE before starting."), "error");
      return;
    }
    const protocol = state.protocol;
    const inputs = JSON.parse(JSON.stringify(state.inputs[protocol]));
    state.running = true;
    state.runToken += 1;
    const token = state.runToken;
    updateRunUI(true);
    setProgress(0.04);
    sceneSetMode(protocol === "flame" ? "flame" : protocol === "reaction" ? "reaction" : protocol === "thermal" ? "thermal" : "bench");
    status(L("Deney çalışıyor: ", "Experiment running: ") + L(protocolMeta(protocol).name[0], protocolMeta(protocol).name[1]), "warn");
    const duration = protocol === "thermal" ? 2200 : protocol === "reaction" ? 2000 : 1500;
    const started = performance.now();
    const tick = () => {
      if (token !== state.runToken) return;
      const t = clamp((performance.now() - started) / duration, 0, 1);
      setProgress(0.04 + t * 0.92);
      if (t < 1) requestAnimationFrame(tick);
      else finish();
    };
    const finish = () => {
      if (token !== state.runToken) return;
      const result = computeResult(state.z, protocol, inputs);
      state.running = false;
      state.lastRun = { z: state.z, protocol: protocol, inputs: inputs, ts: Date.now() };
      state.lastResult = result;
      applyEvidence(result);
      persistResult(result);
      setProgress(1);
      renderResults();
      renderMissionCard();
      renderProtocols();
      updateRunUI(false);
      sceneEffect(protocol, result, el);
      status(L("Deney tamamlandı: ", "Experiment complete: ") + result.title, "good");
      toast(L("Sonuç deftere kaydedildi.", "Result saved to the notebook."), "success");
    };
    requestAnimationFrame(tick);
  }

  function startMission() {
    state.missionActive = true;
    state.missionSolved = false;
    state.missionAttempts = 0;
    state.missionHints = 0;
    state.missionDraft = null;
    state.missionFeedback = null;
    state.evidence = {};
    state.z = MISSION.targetZ;
    state.protocol = "density";
    state.station = "bench";
    state.lastResult = null;
    state.lastRun = null;
    saveMission();
    closeAllOverlays();
    renderAll();
    const el = currentElement();
    sceneSetSample(el, true);
    sceneSetMode("idle");
    sceneFocus("bench", true);
    status(L("Vaka 001 açıldı · numune kimliği maskeli", "Case 001 opened · sample identity masked"), "warn");
    toast(L("A-01 tezgâhta. En az iki bağımsız kanıt topla.", "A-01 is on the bench. Collect at least two independent lines of evidence."), "warn");
  }

  function identifyMission() {
    if (!state.missionActive) {
      toast(L("Aktif vaka yok. Önce vakayı başlat.", "No active case. Start the case first."), "warn");
      return;
    }
    const done = EVIDENCE.filter((e) => state.evidence[e.key]).length;
    if (done < MIN_EVIDENCE) {
      state.missionFeedback = { type: "error", text: L("En az " + MIN_EVIDENCE + " bağımsız kanıt gerekir. Şu an " + done + " kanıt var.", "At least " + MIN_EVIDENCE + " independent lines of evidence are required. Currently " + done + ".") };
      renderMission();
      return;
    }
    if (!state.missionDraft) {
      state.missionFeedback = { type: "error", text: L("Bir aday seç.", "Select a candidate.") };
      renderMission();
      return;
    }
    if (Number(state.missionDraft) === MISSION.targetZ) {
      state.missionActive = false;
      state.missionSolved = true;
      state.missionFeedback = { type: "good", text: L("Kimlik doğrulandı. Kanıt zinciri tutarlı.", "Identity confirmed. The evidence chain is consistent.") };
      saveMission();
      revealMissionRecords();
      const el = currentElement();
      const previous = state.lastResult;
      if (state.lastRun) {
        const fresh = computeResult(state.z, state.lastRun.protocol, state.lastRun.inputs);
        fresh.identityRevealed = true;
        if (previous && previous.recordId) {
          const rec = state.notebook.find((r) => r.id === previous.recordId);
          if (rec) {
            rec.masked = false;
            rec.z = state.z;
            rec.symbol = el.symbol;
            rec.name = loc(el.name);
            rec.title = fresh.title;
            rec.observation = fresh.observation;
            rec.equation = fresh.equation || "";
            rec.confidence = fresh.confidence;
            rec.measurements = (fresh.measurements || []).map((m) => ({ label: m.label, value: m.value }));
            fresh.recordId = rec.id;
            saveNotebook();
          }
        }
        state.lastResult = fresh;
      }
      renderAll();
      renderMission();
      sceneSetSample(el, false);
      sceneSetMode("idle");
      toast(L("Vaka çözüldü: ", "Case solved: ") + loc(el.name) + " (" + el.symbol + ")", "success");
      status(L("Kimlik doğrulandı · vaka kapatıldı", "Identity confirmed · case closed"), "good");
      return;
    }
    state.missionAttempts += 1;
    state.missionHints = Math.min((MISSION.hints || []).length, state.missionHints + 1);
    state.missionFeedback = {
      type: "error",
      text: L("Bu aday kanıtlarla uyuşmuyor. Alev rengi, yoğunluk ve reaksiyon gözlemlerini yeniden karşılaştır.",
        "This candidate is not consistent with the evidence. Re-examine the flame colour, density and reaction observations.")
    };
    saveMission();
    renderMission();
    renderMissionCard();
    toast(L("Kimlik doğrulanamadı. İpucu eklendi.", "Identity not confirmed. A hint was added."), "error");
  }

  function resetMission() {
    if (!state.missionActive && !state.missionSolved) {
      toast(L("Sıfırlanacak aktif vaka yok.", "There is no active case to reset."), "warn");
      return;
    }
    if (!window.confirm(L("Vaka ilerlemesi ve kanıtlar sıfırlansın mı? Defter kayıtları korunur.", "Reset case progress and evidence? Notebook records are kept."))) return;
    state.missionActive = false;
    state.missionSolved = false;
    state.missionAttempts = 0;
    state.missionHints = 0;
    state.missionDraft = null;
    state.missionFeedback = null;
    state.evidence = {};
    state.lastResult = null;
    state.lastRun = null;
    saveMission();
    renderAll();
    renderMission();
    const el = currentElement();
    if (el) sceneSetSample(el, false);
    sceneSetMode("idle");
    toast(L("Vaka sıfırlandı.", "Case reset."), "warn");
  }
/* =========================================================================
   LAB 118 — runtime, part 6
   Three.js laboratory scene, instrument effects, public API and boot.
   ========================================================================= */

  const FOCUS = {
    bench: { pos: [0, 4.4, 9.6], target: [0, 1.0, 0.5] },
    flame: { pos: [2.6, 3.6, 7.4], target: [2.4, 1.15, 0.2] },
    reaction: { pos: [1.8, 3.7, 7.6], target: [1.3, 0.9, 1.2] },
    thermal: { pos: [-1.8, 3.6, 7.5], target: [-1.3, 0.9, 1.2] }
  };

  function initScene() {
    if (state.scene) return state.scene;
    const canvas = $id("lab-canvas");
    if (!canvas || !window.THREE) { showSceneFallback(); return null; }
    try {
      const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x04070f);
      scene.fog = new THREE.FogExp2(0x04070f, 0.045);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
      camera.position.set(0, 4.4, 9.6);

      const controls = new THREE.OrbitControls(camera, canvas);
      controls.target.set(0, 1.0, 0.5);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.minDistance = 5.4;
      controls.maxDistance = 14;
      controls.minPolarAngle = 0.32;
      controls.maxPolarAngle = 1.43;
      controls.autoRotate = false;

      const clock = new THREE.Clock();
      const s = {
        renderer: renderer, scene: scene, camera: camera, controls: controls, clock: clock,
        running: false, raf: 0, time: 0, mode: "idle", progress: 0, sampleHidden: false,
        focus: { active: false, t: 0, pos: new THREE.Vector3(), target: new THREE.Vector3() },
        flameBase: 0, bubbles: [], dust: null, labelTexture: null, balanceTexture: null
      };

      scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x04070d, 0.58));
      const key = new THREE.DirectionalLight(0xc7ecff, 1.05);
      key.position.set(4.5, 8, 5.5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -7; key.shadow.camera.right = 7;
      key.shadow.camera.top = 6; key.shadow.camera.bottom = -4;
      key.shadow.bias = -0.0005;
      scene.add(key);
      const warm = new THREE.PointLight(0xffd2a1, 0.55, 14, 2);
      warm.position.set(-4.5, 4.4, 2.4);
      scene.add(warm);
      const rim = new THREE.PointLight(0x22d3ee, 0.7, 12, 2);
      rim.position.set(5.2, 2.6, -1.8);
      scene.add(rim);
      const spot = new THREE.SpotLight(0xbfefff, 0.9, 12, 0.42, 0.55, 1.4);
      spot.position.set(0, 6.5, 4.5);
      spot.target.position.set(0, 0.4, 0.4);
      scene.add(spot); scene.add(spot.target);

      const floorMat = new THREE.MeshStandardMaterial({ color: 0x050a12, roughness: 0.92, metalness: 0.25 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.25;
      floor.receiveShadow = true;
      scene.add(floor);
      const grid = new THREE.GridHelper(30, 30, 0x123047, 0x0a1826);
      grid.position.y = -2.24;
      grid.material.transparent = true;
      grid.material.opacity = 0.38;
      scene.add(grid);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x07101d, roughness: 0.88, metalness: 0.2 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 0.35), wallMat);
      wall.position.set(0, 1.8, -5.1);
      wall.receiveShadow = true;
      scene.add(wall);
      const wallTrim = new THREE.Mesh(new THREE.BoxGeometry(22, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0x16425a }));
      wallTrim.position.set(0, -2.05, -4.9);
      scene.add(wallTrim);

      const benchMat = new THREE.MeshStandardMaterial({ color: 0x0a1424, roughness: 0.48, metalness: 0.55 });
      const bench = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.36, 4.8), benchMat);
      bench.position.set(0, 0, 0.45);
      bench.receiveShadow = true;
      bench.castShadow = true;
      scene.add(bench);
      const benchEdge = new THREE.Mesh(new THREE.BoxGeometry(10.85, 0.035, 4.85), new THREE.MeshBasicMaterial({ color: 0x1d607a }));
      benchEdge.position.set(0, 0.2, 0.45);
      scene.add(benchEdge);
      const benchFront = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.9, 0.25), new THREE.MeshStandardMaterial({ color: 0x060d18, roughness: 0.6, metalness: 0.45 }));
      benchFront.position.set(0, -0.5, 2.75);
      scene.add(benchFront);

      buildShelves(scene);
      buildWallSign(scene);
      buildSample(scene, s);
      buildBalance(scene, s);
      buildBurner(scene, s);
      buildBeaker(scene, s);
      buildThermalStage(scene, s);
      buildDust(scene, s);

      controls.addEventListener("start", () => { s.focus.active = false; });
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        showSceneFallback();
      });
      canvas.addEventListener("webglcontextrestored", () => {
        hideSceneFallback();
        sceneResize();
        if (state.entered) sceneResume();
      });

      state.scene = s;
      hideSceneFallback();
      sceneSetSample(currentElement(), isBlind());
      sceneFocus(state.station, true);
      sceneResize();
      if (state.entered) sceneResume();
      return s;
    } catch (error) {
      showSceneFallback();
      return null;
    }
  }

  function buildShelves(scene) {
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x0b1727, roughness: 0.6, metalness: 0.4 });
    [2.35, 3.35].forEach((y, row) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 0.55), shelfMat);
      shelf.position.set(0, y, -4.72);
      scene.add(shelf);
      for (let i = 0; i < 9; i += 1) {
        const color = [0x67e8f9, 0xa78bfa, 0xfbbf24, 0x34d399, 0xfb7185][(i + row) % 5];
        const vial = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.38, 12),
          new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.7, roughness: 0.35 })
        );
        vial.position.set(-3.6 + i * 0.9, y + 0.23, -4.7);
        scene.add(vial);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x1f3448, metalness: 0.8, roughness: 0.3 }));
        cap.position.set(vial.position.x, y + 0.45, -4.7);
        scene.add(cap);
      }
    });
    const glow = new THREE.PointLight(0x2dd4bf, 0.35, 6, 2);
    glow.position.set(0, 3.2, -3.6);
    scene.add(glow);
  }

  function buildWallSign(scene) {
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,10,20,0.86)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(103,232,249,0.45)";
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = "#67e8f9";
      ctx.font = "700 62px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("LAB 118", w / 2, 78);
      ctx.fillStyle = "#6b8aa8";
      ctx.font = "18px ui-monospace, Menlo, monospace";
      ctx.fillText("ANALYTICAL CHEMISTRY · 118", w / 2, 108);
    }, 512, 128);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
    sign.position.set(0, 3.42, -4.88);
    scene.add(sign);
  }

  function buildSample(scene, s) {
    const group = new THREE.Group();
    group.position.set(0, 0.2, 0.95);
    const glass = new THREE.MeshPhongMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.16, shininess: 90, side: THREE.DoubleSide, depthWrite: false });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 28, 1, true), glass);
    body.position.y = 0.5;
    group.add(body);
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.035, 28), new THREE.MeshStandardMaterial({ color: 0x102235, metalness: 0.7, roughness: 0.3 }));
    bottom.position.y = 0.02;
    group.add(bottom);
    const liquidMat = new THREE.MeshStandardMaterial({ color: 0xff7a59, emissive: 0xff7a59, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.1 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.52, 24), liquidMat);
    liquid.position.y = 0.3;
    group.add(liquid);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x1c3045, metalness: 0.85, roughness: 0.28 }));
    cap.position.y = 1.04;
    group.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.008, 8, 64), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.6 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.55;
    group.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.006, 8, 64), new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.35 }));
    ring2.rotation.x = Math.PI / 2.4;
    ring2.position.y = 0.55;
    group.add(ring2);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xff7a59, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(1.8, 1.8, 1);
    glow.position.y = 0.5;
    group.add(glow);
    scene.add(group);
    s.sample = group; s.sampleLiquid = liquid; s.sampleRing = ring; s.sampleRing2 = ring2; s.sampleGlow = glow;
    s.sampleBaseY = group.position.y;
    s.labelSprite = makeTextSprite("Na", "#67e8f9", "Z=11");
    s.labelSprite.position.set(0, 1.72, 0.95);
    scene.add(s.labelSprite);
  }

  function buildBalance(scene, s) {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x122033, metalness: 0.7, roughness: 0.35 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.22, 0.95), baseMat);
    base.position.set(-2.7, 0.11, 0.55);
    base.castShadow = true;
    scene.add(base);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.035, 32), new THREE.MeshStandardMaterial({ color: 0x8fb3c9, metalness: 0.9, roughness: 0.2 }));
    pan.position.set(-2.7, 0.3, 0.55);
    scene.add(pan);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12), baseMat);
    post.position.set(-2.7, 0.2, 0.55);
    scene.add(post);
    s.balanceTexture = makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = "#041019"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#16425a"; ctx.lineWidth = 3; ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = "#67e8f9"; ctx.font = "700 30px ui-monospace, Menlo, monospace"; ctx.textAlign = "right";
      ctx.fillText("0.000 g", w - 14, 42);
      ctx.fillStyle = "#5f7895"; ctx.font = "12px ui-monospace, Menlo, monospace"; ctx.textAlign = "left";
      ctx.fillText("BALANCE · 0.001 g", 12, 60);
    }, 256, 72);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), new THREE.MeshBasicMaterial({ map: s.balanceTexture, transparent: true }));
    display.position.set(-2.7, 0.16, 1.035);
    scene.add(display);
    s.balanceDisplay = display;
  }

  function buildBurner(scene, s) {
    const metal = new THREE.MeshStandardMaterial({ color: 0x223448, metalness: 0.85, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.2, 24), metal);
    base.position.set(2.5, 0.1, 0.25);
    scene.add(base);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 16), metal);
    tube.position.set(2.5, 0.7, 0.25);
    scene.add(tube);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x3b5a70, metalness: 0.8, roughness: 0.3 }));
    collar.position.set(2.5, 1.14, 0.25);
    scene.add(collar);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.23, 1.0, 18, 1, true), flameMat);
    flame.position.set(2.5, 1.72, 0.25);
    flame.visible = false;
    scene.add(flame);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x93e7ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.55, 14, 1, true), innerMat);
    inner.position.set(2.5, 1.52, 0.25);
    inner.visible = false;
    scene.add(inner);
    const light = new THREE.PointLight(0xffa94d, 0, 5, 2);
    light.position.set(2.5, 1.65, 0.25);
    scene.add(light);
    s.flame = flame; s.flameInner = inner; s.flameLight = light; s.flameBase = 0;
  }

  function buildBeaker(scene, s) {
    const group = new THREE.Group();
    group.position.set(1.35, 0.2, 1.55);
    const glass = new THREE.MeshPhongMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.18, shininess: 90, side: THREE.DoubleSide, depthWrite: false });
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 28, 1, true), glass);
    beaker.position.y = 0.48;
    group.add(beaker);
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 28), glass);
    bottom.position.y = 0.01;
    group.add(bottom);
    const liquidMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x0f766e, emissiveIntensity: 0.4, transparent: true, opacity: 0.7, roughness: 0.25 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.42, 24), liquidMat);
    liquid.position.y = 0.24;
    group.add(liquid);
    const stirrer = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }));
    stirrer.position.set(0.12, 0.35, 0);
    group.add(stirrer);
    const bubbles = new THREE.Group();
    for (let i = 0; i < 14; i += 1) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.018 + Math.random() * 0.022, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xbdf7ff, transparent: true, opacity: 0.55 })
      );
      bubble.position.set((Math.random() - 0.5) * 0.45, 0.08 + Math.random() * 0.42, (Math.random() - 0.5) * 0.45);
      bubble.userData.speed = 0.18 + Math.random() * 0.35;
      bubbles.add(bubble);
    }
    bubbles.visible = false;
    group.add(bubbles);
    scene.add(group);
    s.beaker = group; s.beakerLiquid = liquid; s.bubblesGroup = bubbles;
    s.bubbles = bubbles.children.slice();
  }

  function buildThermalStage(scene, s) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.24, 0.95), new THREE.MeshStandardMaterial({ color: 0x111e2e, metalness: 0.65, roughness: 0.4 }));
    body.position.set(-1.35, 0.12, 1.55);
    scene.add(body);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x31465f, emissive: 0x0b2a3a, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.3 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.045, 0.7), plateMat);
    plate.position.set(-1.35, 0.27, 1.55);
    scene.add(plate);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(-1.35, 0.3, 1.55);
    scene.add(glow);
    const light = new THREE.PointLight(0x67e8f9, 0, 4, 2);
    light.position.set(-1.35, 0.55, 1.55);
    scene.add(light);
    s.stagePlate = plate; s.stageGlow = glow; s.stageLight = light;
  }

  function buildDust(scene, s) {
    const count = 110;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 6 - 1.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9 - 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.018, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    s.dust = points;
  }

  function makeGlowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.18, "rgba(255,255,255,0.6)");
    g.addColorStop(0.5, "rgba(120,220,255,0.18)");
    g.addColorStop(1, "rgba(80,160,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeCanvasTexture(draw, w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function makeTextSprite(symbol, color, subtext) {
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,10,20,0.72)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, 6, 6, w - 12, h - 12, 16);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "700 58px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(symbol, w / 2, 70);
      ctx.fillStyle = "#7f9ab5";
      ctx.font = "15px ui-monospace, Menlo, monospace";
      ctx.fillText(subtext || "", w / 2, 100);
    }, 256, 128);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(1.25, 0.62, 1);
    return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function updateLabel(symbol, color, subtext) {
    const s = state.scene;
    if (!s || !s.labelSprite) return;
    const old = s.labelSprite.material.map;
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(4,10,20,0.74)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, 6, 6, w - 12, h - 12, 16);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "700 58px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(symbol, w / 2, 70);
      ctx.fillStyle = "#7f9ab5";
      ctx.font = "15px ui-monospace, Menlo, monospace";
      ctx.fillText(subtext || "", w / 2, 100);
    }, 256, 128);
    s.labelSprite.material.map = texture;
    s.labelSprite.material.needsUpdate = true;
    if (old) old.dispose();
  }

  function sceneSetSample(el, hidden) {
    const s = state.scene;
    if (!s || !el) return;
    const color = hidden ? 0xfbbf24 : hexToInt(CAT_COLORS[el.category] || CAT_COLORS.unknown);
    s.sampleHidden = !!hidden;
    if (s.sampleLiquid) {
      s.sampleLiquid.material.color.setHex(color);
      s.sampleLiquid.material.emissive.setHex(color);
      s.sampleLiquid.material.emissiveIntensity = hidden ? 0.7 : 0.55;
      s.sampleLiquid.scale.y = el.phase === "gas" ? 0.15 : el.phase === "liquid" ? 0.65 : 1;
    }
    if (s.sampleGlow) s.sampleGlow.material.color.setHex(color);
    updateLabel(hidden ? "?" : el.symbol, hidden ? "#fbbf24" : (CAT_COLORS[el.category] || "#67e8f9"), hidden ? "A-01 · MASKED" : "Z=" + el.z + " · " + (el.phase || ""));
  }

  function hexToInt(hex) { return parseInt(String(hex).replace("#", ""), 16) || 0x67e8f9; }

  function sceneSetMode(mode) {
    const s = state.scene;
    if (!s) return;
    s.mode = mode;
    if (s.flame) s.flame.visible = mode === "flame";
    if (s.flameInner) s.flameInner.visible = mode === "flame";
    if (s.flameLight) s.flameLight.intensity = mode === "flame" ? 0.9 : 0;
    if (s.bubblesGroup) s.bubblesGroup.visible = mode === "reaction";
    if (s.stageGlow) s.stageGlow.material.opacity = mode === "thermal" ? 0.5 : 0;
    if (s.stageLight) s.stageLight.intensity = mode === "thermal" ? 0.8 : 0;
  }

  function sceneSetProgress(p) {
    const s = state.scene;
    if (!s) return;
    s.progress = p;
    if (s.sampleRing) s.sampleRing.material.opacity = 0.35 + p * 0.5;
    if (s.sampleRing2) s.sampleRing2.material.opacity = 0.2 + p * 0.4;
  }

  function sceneFocus(station, immediate) {
    const s = state.scene;
    if (!s) return;
    const focus = FOCUS[station] || FOCUS.bench;
    const pos = new THREE.Vector3(focus.pos[0], focus.pos[1], focus.pos[2]);
    const target = new THREE.Vector3(focus.target[0], focus.target[1], focus.target[2]);
    s.focus.pos.copy(pos);
    s.focus.target.copy(target);
    s.focus.t = 0;
    if (immediate) {
      s.camera.position.copy(pos);
      s.controls.target.copy(target);
      s.controls.update();
      s.focus.active = false;
    } else {
      s.focus.active = true;
    }
  }

  function sceneEffect(protocol, result, el) {
    const s = state.scene;
    if (!s) return;
    sceneSetMode(protocol === "flame" ? "flame" : protocol === "reaction" ? "reaction" : protocol === "thermal" ? "thermal" : "idle");
    if (protocol === "density") {
      const value = (result.measurements || []).find((m) => m.label && (m.label.indexOf("Yoğunluk") >= 0 || m.label.indexOf("Density") >= 0));
      updateBalance(value ? value.value : "—");
      if (s.sampleGlow) s.sampleGlow.material.opacity = 0.85;
    } else if (protocol === "inspect") {
      if (s.sampleRing) s.sampleRing.material.opacity = 0.9;
    } else if (protocol === "flame") {
      const color = hexToInt(result.spectrum ? result.spectrum.color : "#ffb347");
      if (s.flame) s.flame.material.color.setHex(color);
      if (s.flameLight) { s.flameLight.color.setHex(color); s.flameLight.intensity = 1.6; }
      if (s.flameInner) s.flameInner.material.color.setHex(0xdffbff);
    } else if (protocol === "reaction") {
      const reaction = result.reaction || {};
      const color = hexToInt(reaction.color || "#2dd4bf");
      if (s.beakerLiquid) { s.beakerLiquid.material.color.setHex(color); s.beakerLiquid.material.emissive.setHex(color); }
      if (s.bubblesGroup) s.bubblesGroup.visible = (reaction.phenomena || []).some((p) => p !== "none");
      if (s.flame && (reaction.phenomena || []).includes("flame")) {
        s.flame.visible = true; s.flame.material.color.setHex(color);
        if (s.flameLight) { s.flameLight.color.setHex(color); s.flameLight.intensity = 1.4; }
      }
    } else if (protocol === "thermal") {
      const temp = result.thermal ? result.thermal.temp : 25;
      const hot = clamp((temp + 200) / 1400, 0, 1);
      const color = hot > 0.55 ? 0xff7a59 : hot > 0.25 ? 0xfbbf24 : 0x67e8f9;
      if (s.stageGlow) { s.stageGlow.material.color.setHex(color); s.stageGlow.material.opacity = 0.35 + hot * 0.55; }
      if (s.stageLight) { s.stageLight.color.setHex(color); s.stageLight.intensity = 0.4 + hot * 1.4; }
      if (s.stagePlate) { s.stagePlate.material.emissive.setHex(color); s.stagePlate.material.emissiveIntensity = 0.2 + hot; }
    }
    if (s.sampleGlow) {
      setTimeout(() => { if (state.scene) state.scene.sampleGlow.material.opacity = 0.5; }, 900);
    }
  }

  function updateBalance(text) {
    const s = state.scene;
    if (!s || !s.balanceDisplay) return;
    const old = s.balanceDisplay.material.map;
    const texture = makeCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = "#041019"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#16425a"; ctx.lineWidth = 3; ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = "#67e8f9"; ctx.font = "700 26px ui-monospace, Menlo, monospace"; ctx.textAlign = "right";
      ctx.fillText(String(text).slice(0, 18), w - 14, 42);
      ctx.fillStyle = "#5f7895"; ctx.font = "11px ui-monospace, Menlo, monospace"; ctx.textAlign = "left";
      ctx.fillText("BALANCE · 0.001 g", 12, 60);
    }, 256, 72);
    s.balanceDisplay.material.map = texture;
    s.balanceDisplay.material.needsUpdate = true;
    if (old) old.dispose();
  }

  function updateScene(s, dt) {
    s.time += dt;
    s.controls.update();
    if (s.focus.active) {
      s.focus.t += dt;
      const k = 1 - Math.exp(-dt * 4.8);
      s.camera.position.lerp(s.focus.pos, k);
      s.controls.target.lerp(s.focus.target, k);
      if (s.focus.t > 1.5) s.focus.active = false;
    }
    if (s.sample) s.sample.position.y = s.sampleBaseY + Math.sin(s.time * 1.3) * 0.018;
    if (s.sampleRing) s.sampleRing.rotation.z += dt * 0.35;
    if (s.sampleRing2) s.sampleRing2.rotation.z -= dt * 0.22;
    if (s.sampleGlow) s.sampleGlow.material.opacity = 0.38 + Math.sin(s.time * 2.1) * 0.12;
    if (s.flame && s.flame.visible) {
      const flicker = 0.86 + Math.sin(s.time * 19) * 0.07 + Math.sin(s.time * 7.3) * 0.05;
      s.flame.scale.set(1, flicker, 1);
      s.flame.rotation.y += dt * 0.8;
      if (s.flameInner) s.flameInner.scale.set(1, 0.9 + Math.sin(s.time * 23) * 0.08, 1);
      if (s.flameLight) s.flameLight.intensity = (s.mode === "flame" ? 1.2 : 0.6) * flicker;
    }
    if (s.bubblesGroup && s.bubblesGroup.visible) {
      s.bubbles.forEach((bubble) => {
        bubble.position.y += dt * bubble.userData.speed;
        if (bubble.position.y > 0.52) bubble.position.y = 0.08;
      });
    }
    if (s.stageGlow && s.stageGlow.material.opacity > 0) {
      s.stageGlow.material.opacity = clamp(s.stageGlow.material.opacity + Math.sin(s.time * 3.2) * 0.02, 0.2, 0.9);
    }
    if (s.dust) {
      s.dust.rotation.y += dt * 0.012;
      s.dust.position.y = Math.sin(s.time * 0.3) * 0.05;
    }
  }

  function animateScene() {
    const s = state.scene;
    if (!s || !s.running) return;
    s.raf = requestAnimationFrame(animateScene);
    const dt = Math.min(s.clock.getDelta(), 0.05);
    updateScene(s, dt);
    try {
      s.renderer.render(s.scene, s.camera);
    } catch (error) {
      showSceneFallback();
      scenePause();
    }
  }

  function sceneResume() {
    const s = state.scene;
    if (!s) return;
    if (s.running) return;
    s.running = true;
    s.clock.getDelta();
    animateScene();
  }

  function scenePause() {
    const s = state.scene;
    if (!s) return;
    s.running = false;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = 0;
  }

  function sceneResize() {
    const s = state.scene;
    if (!s) return;
    const canvas = $id("lab-canvas");
    if (!canvas) return;
    const shell = $id("lab-shell");
    let w = canvas.clientWidth || (shell ? shell.clientWidth : 0);
    let h = canvas.clientHeight || (shell ? shell.clientHeight : 0);
    if (!w || !h) return;
    s.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    s.renderer.setSize(w, h, false);
    s.camera.aspect = w / h;
    s.camera.updateProjectionMatrix();
  }

  function showSceneFallback() {
    const fallback = $id("lab-fallback");
    if (fallback) fallback.classList.remove("hidden");
    const canvas = $id("lab-canvas");
    if (canvas) canvas.style.opacity = "0.25";
    if (state.scene) scenePause();
  }

  function hideSceneFallback() {
    const fallback = $id("lab-fallback");
    if (fallback) fallback.classList.add("hidden");
    const canvas = $id("lab-canvas");
    if (canvas) canvas.style.opacity = "1";
  }

  window.Lab118 = {
    enter: function () { ensureInit(); enter(); },
    leave: function () { leave(); },
    setLang: function (lang) { ensureInit(); setLang(lang); },
    sendElement: function (z) { ensureInit(); sendElement(z); },
    openMission: function () { ensureInit(); openMission(); },
    getState: function () { return { z: state.z, protocol: state.protocol, missionActive: state.missionActive, missionSolved: state.missionSolved, records: state.notebook.length }; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
