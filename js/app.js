/* =========================================================================
   Periyodik Tablo — application controller
   Split into app.part files during authoring; final runtime uses js/app.js
   ========================================================================= */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $id = (id) => document.getElementById(id);
  let webglProbe;
  function webglAvailable() {
    if (webglProbe !== undefined) return webglProbe;
    try {
      const probe = document.createElement("canvas");
      webglProbe = !!(probe.getContext("webgl2") || probe.getContext("webgl") || probe.getContext("experimental-webgl"));
    } catch (e) {
      webglProbe = false;
    }
    return webglProbe;
  }
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;
  const LANG_KEY = "pt.lang";
  const BEST_KEY = "pt.quiz.best";

  const CATEGORY_ORDER = [
    "alkali-metal", "alkaline-earth-metal", "transition-metal", "post-transition-metal",
    "metalloid", "nonmetal", "halogen", "noble-gas", "lanthanide", "actinide", "unknown"
  ];
  const CATEGORY_COLORS = {
    "alkali-metal": "#ff7a59", "alkaline-earth-metal": "#ffb454",
    "transition-metal": "#4cc9f0", "post-transition-metal": "#7dd3a7",
    metalloid: "#b8e986", nonmetal: "#5eead4", halogen: "#f9e76c",
    "noble-gas": "#c084fc", lanthanide: "#f472b6", actinide: "#fb7185",
    unknown: "#94a3b8"
  };
  const STATE_ORDER = ["solid", "liquid", "gas", "unknown"];
  const STATE_COLORS = { solid: "#4cc9f0", liquid: "#a78bfa", gas: "#5eead4", unknown: "#64748b" };
  const GRADIENT_PALETTES = {
    electronegativity: ["#312e81", "#2563eb", "#22d3ee", "#facc15", "#fb7185"],
    melting: ["#0c4a6e", "#0284c7", "#fbbf24", "#f97316", "#ef4444"],
    radius: ["#4c1d95", "#7c3aed", "#c084fc", "#f9a8d4"],
    discovery: ["#3b0764", "#7c3aed", "#0ea5e9", "#22c55e", "#facc15"]
  };
  const MODE_META = {
    electronegativity: { unit: "", palette: GRADIENT_PALETTES.electronegativity },
    melting: { unit: "K", palette: GRADIENT_PALETTES.melting },
    radius: { unit: "pm", palette: GRADIENT_PALETTES.radius },
    discovery: { unit: "", palette: GRADIENT_PALETTES.discovery }
  };
  const TABS = ["overview", "atom", "properties", "isotopes", "spectrum", "reactions"];
  const HALF_LIFE_UNITS = {
    nsec: { tr: "ns", en: "ns" }, psec: { tr: "ps", en: "ps" }, usec: { tr: "µs", en: "µs" },
    msec: { tr: "ms", en: "ms" }, sec: { tr: "s", en: "s" }, minute: { tr: "dk", en: "min" },
    hour: { tr: "sa", en: "h" }, day: { tr: "gün", en: "d" }, year: { tr: "yıl", en: "yr" },
    kyear: { tr: "bin yıl", en: "kyr" }, Myear: { tr: "milyon yıl", en: "Myr" },
    Gyear: { tr: "milyar yıl", en: "Gyr" }, Tyear: { tr: "trilyon yıl", en: "Tyr" },
    Pyear: { tr: "katrilyon yıl", en: "Pyr" }, Eyear: { tr: "ekzayıl", en: "Eyr" },
    Zyear: { tr: "zetayıl", en: "Zyr" }, Yyear: { tr: "yotayıl", en: "Yyr" },
    asec: { tr: "as", en: "as" }, zsec: { tr: "zs", en: "zs" }, ysec: { tr: "ys", en: "ys" }
  };
  const USE_ICONS = {
    industry: "🏭", technology: "🔬", medicine: "🩺", biology: "🧬",
    energy: "⚡", everyday: "🏠", research: "🧪", agriculture: "🌾"
  };
  const EXTRA = {
    tr: {
      listView: "Liste", tableView: "Tablo", skip: "İçeriğe geç",
      trendFoot: "Bir periyotta çekirdek yükü artarken kabuk sayısı aynı kalır; elektronlar çekirdeğe daha güçlü bağlanır. Bir grupta yeni kabuklar eklenir ve değerlik elektronları uzaklaşır.",
      ariaMainNav: "Ana görünümler", ariaMobileNav: "Mobil görünümler", ariaSearchResults: "Arama sonuçları",
      ariaTable: "Periyodik tablo", ariaColorMode: "Renklendirme ölçütü", ariaZoom: "Tablo yakınlaştırma",
      zoomIn: "Yakınlaştır", zoomOut: "Uzaklaştır", zoomReset: "Sıfırla",
      ariaLevels: "Quiz seviyesi", ariaElementA: "Birinci element", ariaElementB: "İkinci element",
      ariaSwap: "Yer değiştir", ariaTrends: "Periyodik eğilimler", ariaAtom: "3B atom modeli",
      photoCredit: "Görsel: pse-info.de / Wikimedia Commons", wiki: "Wikipedia", more: "+{n} daha",
      typeNames: {
        symbolToName: "Sembol → ad", nameToSymbol: "Ad → sembol", numberToName: "Numara → ad",
        category: "Kategori", highest: "En yüksek", lowest: "En düşük", config: "Dizilim",
        position: "Tablodaki yer", isotope: "İzotop", phase: "Fiziksel hâl"
      },
      explainBasic: "<strong>{name} ({symbol})</strong>, atom numarası {z} olan bir {category}.",
      explainProperty: "{property} değerleri: {list}.",
      explainPhase: "{name}, oda sıcaklığında {phase} hâldedir.",
      explainConfig: "Elektron dizilimi: <strong>{config}</strong>.",
      explainPosition: "{name} ({symbol}), {period}. periyotta ve {group}. grupta yer alır.",
      explainIsotope: "Nötron sayısı {n}, kütle numarası {a} → proton sayısı {a} − {n} = {z}. Bu yüzden element {name} ({symbol}).",
      explainSymbol: "Sembolü {symbol} olan element {name}.",
      explainCategory: "{name} ({symbol}) bir {category}.",
      neutronMass: "A = {a} · N = {n}",
      unknown: "Bilinmiyor",
      compareHigher: "{label}: {a} ({av}) > {b} ({bv})",
      compareSameElement: "Aynı elementi seçtin. Farklı iki element seçerek karşılaştırmayı dene.",
      atomFallback: "3B görünüm bu tarayıcıda başlatılamadı. Bohr modeli ve elektron dizilimi yine de kullanılabilir.",
      noImage: "Görsel yok", massUnit: "u",
      oldHazard: { F: "Yanıcı", T: "Toksik", Tp: "Çok toksik", Xn: "Zararlı", Xi: "Tahriş edici", C: "Aşındırıcı", N: "Çevre için tehlikeli", E: "Patlayıcı", O: "Oksitleyici" },
      nfpa: { h: "Sağlık", f: "Yanıcılık", i: "Kararsızlık", s: "Özel" },
      tabsLabel: "Element sekmeleri", spectrumLabel: "Emisyon tayfı"
    },
    en: {
      listView: "List", tableView: "Table", skip: "Skip to content",
      trendFoot: "Across a period the nuclear charge increases while the shell count stays the same, so electrons are held more tightly. Down a group new shells are added and valence electrons move farther away.",
      ariaMainNav: "Main views", ariaMobileNav: "Mobile views", ariaSearchResults: "Search results",
      ariaTable: "Periodic table", ariaColorMode: "Colour criterion", ariaZoom: "Table zoom",
      zoomIn: "Zoom in", zoomOut: "Zoom out", zoomReset: "Reset",
      ariaLevels: "Quiz level", ariaElementA: "First element", ariaElementB: "Second element",
      ariaSwap: "Swap elements", ariaTrends: "Periodic trends", ariaAtom: "3D atomic model",
      photoCredit: "Image: pse-info.de / Wikimedia Commons", wiki: "Wikipedia", more: "+{n} more",
      typeNames: {
        symbolToName: "Symbol → name", nameToSymbol: "Name → symbol", numberToName: "Number → name",
        category: "Category", highest: "Highest", lowest: "Lowest", config: "Configuration",
        position: "Table position", isotope: "Isotope", phase: "Physical state"
      },
      explainBasic: "<strong>{name} ({symbol})</strong> is an element with atomic number {z}; it is a {category}.",
      explainProperty: "{property} values: {list}.",
      explainPhase: "{name} is {phase} at room temperature.",
      explainConfig: "Electron configuration: <strong>{config}</strong>.",
      explainPosition: "{name} ({symbol}) is in period {period}, group {group}.",
      explainIsotope: "Neutrons {n}, mass number {a} → protons {a} − {n} = {z}. The element is {name} ({symbol}).",
      explainSymbol: "The element with symbol {symbol} is {name}.",
      explainCategory: "{name} ({symbol}) is a {category}.",
      neutronMass: "A = {a} · N = {n}",
      unknown: "Unknown",
      compareHigher: "{label}: {a} ({av}) > {b} ({bv})",
      compareSameElement: "You picked the same element. Try two different elements for a useful comparison.",
      atomFallback: "The 3D view could not start in this browser. The Bohr model and electron configuration are still available.",
      noImage: "No image", massUnit: "u",
      oldHazard: { F: "Flammable", T: "Toxic", Tp: "Very toxic", Xn: "Harmful", Xi: "Irritant", C: "Corrosive", N: "Dangerous for the environment", E: "Explosive", O: "Oxidizing" },
      nfpa: { h: "Health", f: "Flammability", i: "Instability", s: "Special" },
      tabsLabel: "Element tabs", spectrumLabel: "Emission spectrum"
    }
  };

  const state = {
    lang: "tr",
    view: "explore",
    elements: [],
    byZ: new Map(),
    meta: null,
    colorMode: "category",
    filter: null,
    query: "",
    searchIndex: -1,
    listView: false,
    zoom: 58,
    zoomTouched: false,
    tooltipZ: null,
    currentZ: null,
    currentTab: "overview",
    lastFocused: null,
    atomViewer: null,
    atomState: { mode: "bohr", n: null, l: null, m: 0, speed: 1, autoRotate: !(window.Atom3D && window.Atom3D.REDUCED) },
    quiz: {
      active: false, finished: false, level: "easy", questions: [], index: 0,
      selected: null, answers: [], score: 0, streak: 0, newRecord: false,
      best: loadBest()
    },
    compare: { a: 26, b: 79 }
  };

  function loadBest() {
    try {
      const raw = JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
      return { easy: +raw.easy || 0, medium: +raw.medium || 0, hard: +raw.hard || 0 };
    } catch (e) {
      return { easy: 0, medium: 0, hard: 0 };
    }
  }
  function saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(state.quiz.best)); } catch (e) {}
  }
  function X(key) {
    const table = EXTRA[state.lang] || EXTRA.en;
    return table[key] !== undefined ? table[key] : (EXTRA.en[key] !== undefined ? EXTRA.en[key] : key);
  }
  function xf(template, vars) {
    return String(template || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? "" : vars[k]));
  }
  function trOr(key, fallback) {
    const v = t(key);
    return v === key ? fallback : v;
  }
  function locale() { return state.lang === "tr" ? "tr-TR" : "en-US"; }
  function categoryName(cat) { return trOr("categories." + cat, cat || X("unknown")); }
  function phaseName(phase) { return trOr("states." + (phase || "unknown"), X("unknown")); }
  function crystalName(code) { return code ? trOr("crystals." + code, code.toUpperCase()) : "—"; }
  function magneticName(code) { return code ? trOr("magnetic." + code, code) : "—"; }
  function sup(n) { return String(n).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]); }
  function fmt(n, digits = 3) {
    if (n === null || n === undefined || n === "" || !Number.isFinite(Number(n))) return "—";
    return window.fmtNum(Number(n), digits);
  }
  function formatMass(mass) {
    if (mass === null || mass === undefined || !Number.isFinite(Number(mass))) return "—";
    const n = Number(mass);
    const digits = n < 10 ? 4 : n < 100 ? 3 : 1;
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(n);
  }
  function formatTemp(k) { return k === null || k === undefined ? "—" : fmt(k, 4) + " K"; }
  function formatDensity(v) {
    if (v === null || v === undefined) return "—";
    const g = fmt(v, 3);
    if (v < 0.01) return g + " g/cm³ <small>(" + fmt(v * 1000, 3) + " g/L)</small>";
    return g + " g/cm³";
  }
  function formatPrice(p) {
    if (p === null || p === undefined) return "—";
    return "$" + fmt(p, 3) + " <small>/ kg</small>";
  }
  function formatAbundance(v) {
    if (v === null || v === undefined) return { text: "—", unit: "", number: null };
    if (v >= 1e6) return { text: fmt(v / 1e7, 3) + " %", unit: "%", number: v / 1e7 };
    if (v >= 1e3) return { text: fmt(v / 1e3, 3) + " ppm", unit: "ppm", number: v / 1e3 };
    return { text: fmt(v, 3) + " ppb", unit: "ppb", number: v };
  }
  function discoveryLabel(el) {
    const y = el && el.discovery ? el.discovery.year : null;
    if (y === null || y === undefined) return "—";
    if (typeof y === "number") return String(y);
    return trOr("discoveryTokens." + y, String(y));
  }
  function discoveryNumeric(el) {
    const y = el && el.discovery ? el.discovery.year : null;
    if (typeof y === "number") return y;
    return { antiquity: 0, "18th-century": 1750, "19th-century": 1850, "20th-century": 1950 }[y] ?? null;
  }
  function halfLifeLabel(iso) {
    if (!iso || iso.halfLife === null || iso.halfLife === undefined) {
      return iso && iso.radioactive ? "—" : t("labels.stable");
    }
    const unit = HALF_LIFE_UNITS[iso.halfLifeUnit] || {};
    return fmt(iso.halfLife, 3) + " " + (unit[state.lang] || iso.halfLifeUnit || "");
  }
  function optionText(el) {
    return (state.lang === "tr" ? el.name.tr : el.name.en) || el.symbol;
  }
  function elementName(el) { return window.loc ? loc(el.name) : optionText(el); }
  function normalized(s) {
    return String(s || "")
      .toLocaleLowerCase(state.lang === "tr" ? "tr-TR" : "en-US")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
      .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
      .replace(/[^a-z0-9]/g, "");
  }
  function sample(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }
  function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function escapeText(s) { return window.escapeHtml(String(s === null || s === undefined ? "" : s)); }
  function hexToRgba(hex, alpha) {
    const h = String(hex).replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
  }
  function mixHex(a, b, t) {
    const pa = parseInt(String(a).replace("#", ""), 16);
    const pb = parseInt(String(b).replace("#", ""), 16);
    const ch = (shift) => Math.round((((pa >> shift) & 255) * (1 - t)) + (((pb >> shift) & 255) * t));
    return "#" + [ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  function paletteColor(palette, t) {
    const c = Math.max(0, Math.min(1, t));
    const scaled = c * (palette.length - 1);
    const i = Math.min(palette.length - 2, Math.floor(scaled));
    return mixHex(palette[i], palette[i + 1], scaled - i);
  }
  function setColorVars(node, hex) {
    node.style.setProperty("--c", hex);
    node.style.setProperty("--c-soft", hexToRgba(hex, 0.16));
    node.style.setProperty("--c-line", hexToRgba(hex, 0.38));
  }
  function clearColorVars(node) {
    node.style.removeProperty("--c");
    node.style.removeProperty("--c-soft");
    node.style.removeProperty("--c-line");
  }
  function valueForMode(el, mode) {
    if (mode === "electronegativity") return el.electronegativity;
    if (mode === "melting") return el.melting;
    if (mode === "radius") return el.atomicRadius;
    if (mode === "discovery") return discoveryNumeric(el);
    return null;
  }
  function colorRange(mode) {
    const vals = state.elements.map((el) => valueForMode(el, mode)).filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)));
    if (!vals.length) return { min: 0, max: 1 };
    let min = Math.min.apply(null, vals);
    let max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }
    return { min, max };
  }
  function modeValueLabel(v, mode) {
    if (v === null || v === undefined) return "—";
    if (mode === "discovery") {
      if (v <= 0) return trOr("discoveryTokens.antiquity", "—");
      return String(Math.round(v));
    }
    return fmt(v, 3) + (MODE_META[mode] && MODE_META[mode].unit ? " " + MODE_META[mode].unit : "");
  }
  function useIcon(type) { return USE_ICONS[type] || "•"; }
  function useTypeName(type) { return trOr("uses." + type, type); }
  function hPhrase(code) {
    const raw = String(code || "").trim();
    if (!raw || raw === "?") return null;
    const key = /^EUH/i.test(raw) ? raw.toUpperCase().replace(/\s/g, "") : "H" + raw.replace(/^H/i, "").toUpperCase();
    const phrases = window.REACTIONS && window.REACTIONS.H_PHRASES ? window.REACTIONS.H_PHRASES : {};
    const obj = phrases[key] || (window.REACTIONS ? window.REACTIONS.hPhrase(raw) : null);
    return { code: key, text: obj ? loc(obj) : "" };
  }
  function pCode(code) {
    const raw = String(code || "").trim();
    if (!raw || raw === "?") return null;
    return /^P/i.test(raw) ? raw.toUpperCase() : "P" + raw;
  }
  function ghsName(code) {
    const v = t("hazards.ghsNames." + code);
    return v === "hazards.ghsNames." + code ? "GHS " + code : v;
  }
  function ghsIcon(code) { return (window.REACTIONS && window.REACTIONS.GHS_ICON[code]) || "⚠️"; }
  function discoveryToken(y) {
    if (typeof y === "number") return String(y);
    if (!y) return "—";
    return trOr("discoveryTokens." + y, String(y));
  }
/* =========================================================================
   Table rendering, colour modes, legend, filtering, search, list view, tooltip
   ========================================================================= */

function initTable() {
  const ptable = $id("ptable");
  if (!ptable) return;
  ptable.innerHTML = "";
  ptable.setAttribute("aria-label", t("tableAria"));

  for (let g = 1; g <= 18; g++) {
    const head = document.createElement("div");
    head.className = "group-head";
    head.style.gridColumn = String(g + 1);
    head.style.gridRow = "1";
    head.textContent = String(g);
    head.setAttribute("aria-hidden", "true");
    ptable.appendChild(head);
  }

  for (let p = 1; p <= 7; p++) {
    const label = document.createElement("div");
    label.className = "period-label";
    label.style.gridColumn = "1";
    label.style.gridRow = String(p + 1);
    label.textContent = String(p);
    label.setAttribute("aria-hidden", "true");
    ptable.appendChild(label);
  }

  const divider = document.createElement("div");
  divider.className = "f-divider";
  divider.style.gridColumn = "2 / span 18";
  divider.style.gridRow = "9";
  divider.innerHTML = "<span>" + escapeText(t("fBlockNote")) + "</span>";
  divider.setAttribute("aria-hidden", "true");
  ptable.appendChild(divider);

  const fLabels = [
    { row: 10, text: "4f", title: t("lanthanides") },
    { row: 11, text: "5f", title: t("actinides") }
  ];
  fLabels.forEach((item) => {
    const label = document.createElement("div");
    label.className = "f-label";
    label.style.gridColumn = "1";
    label.style.gridRow = String(item.row);
    label.textContent = item.text;
    label.title = item.title;
    label.setAttribute("aria-label", item.title);
    ptable.appendChild(label);
  });

  state.elements.forEach((el) => ptable.appendChild(createElementCell(el)));

  [
    { period: 6, label: "57–71", cat: "lanthanide", row: 7 },
    { period: 7, label: "89–103", cat: "actinide", row: 8 }
  ].forEach((ph) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "f-placeholder";
    button.style.gridColumn = "4";
    button.style.gridRow = String(ph.row);
    button.dataset.filterCat = ph.cat;
    button.textContent = ph.label;
    button.setAttribute("aria-label", categoryName(ph.cat) + " · " + ph.label);
    button.title = categoryName(ph.cat);
    ptable.appendChild(button);
  });

  applyTableMode();
  applyFilter();
  applyZoom();
}

function createElementCell(el) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "el cat-" + (el.category || "unknown");
  cell.dataset.z = String(el.z);
  cell.style.gridColumn = String(el.x + 1);
  cell.style.gridRow = String(el.y + 1);
  cell.setAttribute("aria-label", optionText(el) + " (" + el.symbol + "), " + t("labels.atomicNumber") + " " + el.z);
  if (el.predicted) cell.classList.add("is-predicted");

  const massText = el.mass === null || el.mass === undefined
    ? "—"
    : new Intl.NumberFormat(locale(), { maximumFractionDigits: el.mass < 100 ? 2 : 1 }).format(el.mass);

  cell.innerHTML =
    '<span class="el-z">' + el.z + "</span>" +
    '<span class="el-sym">' + escapeText(el.symbol) + "</span>" +
    '<span class="el-name">' + escapeText(optionText(el)) + "</span>" +
    '<span class="el-mass">' + escapeText(massText) + "</span>" +
    (el.predicted ? '<span class="el-flag" title="' + escapeText(t("labels.predicted")) + '"></span>' : "");

  cell.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    showTooltip(el, event.clientX, event.clientY);
  });
  cell.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    positionTooltip(event.clientX, event.clientY);
  });
  cell.addEventListener("pointerleave", hideTooltip);
  cell.addEventListener("focus", () => {
    const rect = cell.getBoundingClientRect();
    showTooltip(el, rect.left + rect.width / 2, rect.top);
  });
  cell.addEventListener("blur", hideTooltip);

  return cell;
}

function categoryClass(cat) {
  return "cat-" + (cat || "unknown");
}

function applyTableMode() {
  const ptable = $id("ptable");
  if (!ptable) return;
  ptable.dataset.mode = state.colorMode;
  const gradientMode = ["electronegativity", "melting", "radius", "discovery"].includes(state.colorMode);
  const range = gradientMode ? colorRange(state.colorMode) : null;
  const meta = MODE_META[state.colorMode] || null;

  $$(".el", ptable).forEach((cell) => {
    const el = state.byZ.get(Number(cell.dataset.z));
    if (!el) return;
    CATEGORY_ORDER.forEach((cat) => cell.classList.remove(categoryClass(cat)));
    clearColorVars(cell);

    if (state.colorMode === "category") {
      cell.classList.add(categoryClass(el.category));
    } else if (state.colorMode === "state") {
      setColorVars(cell, STATE_COLORS[el.phase] || STATE_COLORS.unknown);
    } else if (gradientMode) {
      const raw = valueForMode(el, state.colorMode);
      if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) {
        setColorVars(cell, "#475569");
      } else {
        let ratio = (Number(raw) - range.min) / (range.max - range.min);
        ratio = Math.max(0, Math.min(1, ratio));
        if (state.colorMode === "melting") ratio = Math.pow(ratio, 0.4);
        if (state.colorMode === "discovery") ratio = Math.pow(ratio, 0.65);
        setColorVars(cell, paletteColor(meta.palette, ratio));
      }
    }
  });

  renderLegend(range);
  updateLegendState();
}

function renderLegend(range) {
  const legend = $id("legend");
  if (!legend) return;
  legend.innerHTML = "";

  if (state.colorMode === "category") {
    const counts = {};
    state.elements.forEach((el) => { counts[el.category] = (counts[el.category] || 0) + 1; });
    CATEGORY_ORDER.forEach((cat) => {
      if (!counts[cat]) return;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "legend-chip";
      chip.dataset.filterType = "category";
      chip.dataset.filterValue = cat;
      setColorVars(chip, CATEGORY_COLORS[cat]);
      chip.innerHTML = "<i></i><span>" + escapeText(categoryName(cat)) + " · " + counts[cat] + "</span>";
      legend.appendChild(chip);
    });
    return;
  }

  if (state.colorMode === "state") {
    const counts = {};
    state.elements.forEach((el) => { counts[el.phase || "unknown"] = (counts[el.phase || "unknown"] || 0) + 1; });
    STATE_ORDER.forEach((phase) => {
      if (!counts[phase]) return;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "legend-chip";
      chip.dataset.filterType = "state";
      chip.dataset.filterValue = phase;
      setColorVars(chip, STATE_COLORS[phase]);
      chip.innerHTML = "<i></i><span>" + escapeText(phaseName(phase)) + " · " + counts[phase] + "</span>";
      legend.appendChild(chip);
    });
    return;
  }

  const meta = MODE_META[state.colorMode];
  if (!meta || !range) return;
  const wrap = document.createElement("div");
  wrap.className = "legend-scale";
  const min = document.createElement("span");
  min.className = "legend-min";
  min.textContent = modeValueLabel(range.min, state.colorMode);
  const grad = document.createElement("span");
  grad.className = "legend-gradient";
  grad.style.setProperty("--grad", "linear-gradient(90deg," + meta.palette.join(",") + ")");
  const max = document.createElement("span");
  max.className = "legend-max";
  max.textContent = modeValueLabel(range.max, state.colorMode);
  wrap.appendChild(min);
  wrap.appendChild(grad);
  wrap.appendChild(max);
  legend.appendChild(wrap);
}

function updateLegendState() {
  const legend = $id("legend");
  if (legend) {
    $$(".legend-chip", legend).forEach((chip) => {
      const active = !!state.filter &&
        chip.dataset.filterType === state.filter.type &&
        chip.dataset.filterValue === state.filter.value;
      chip.classList.toggle("is-active", active);
    });
  }
  const clear = $id("clear-filter");
  if (clear) clear.classList.toggle("hidden", !state.filter);
}

function setFilter(type, value) {
  if (state.filter && state.filter.type === type && state.filter.value === value) {
    state.filter = null;
  } else {
    state.filter = { type, value };
  }
  applyFilter();
  updateLegendState();
  renderElementList();
  if (state.filter) toast(t("toast.filtered"));
}

function clearFilter() {
  if (!state.filter) return;
  state.filter = null;
  applyFilter();
  updateLegendState();
  renderElementList();
}

function matchesFilter(el) {
  if (!state.filter) return true;
  if (state.filter.type === "category") return el.category === state.filter.value;
  if (state.filter.type === "state") return (el.phase || "unknown") === state.filter.value;
  return true;
}

function matchesQuery(el, query) {
  if (!query) return true;
  const q = normalized(query);
  if (!q) return true;
  const haystack = [
    el.z,
    el.symbol,
    el.name && el.name.tr,
    el.name && el.name.en,
    el.category,
    el.block,
    el.group,
    el.period
  ].map(normalized).join(" ");
  return haystack.includes(q);
}

function filteredElements() {
  return state.elements.filter((el) => matchesFilter(el) && matchesQuery(el, state.query));
}

function applyFilter() {
  const ptable = $id("ptable");
  if (!ptable) return;
  $$(".el", ptable).forEach((cell) => {
    const el = state.byZ.get(Number(cell.dataset.z));
    if (!el) return;
    const visible = matchesFilter(el) && matchesQuery(el, state.query);
    cell.classList.toggle("is-dimmed", !visible);
    cell.classList.toggle("is-match", !!state.query && visible);
  });
}

function searchElements(query) {
  const raw = String(query || "").trim();
  if (!raw) return [];
  const q = normalized(raw);
  const lower = raw.toLocaleLowerCase(state.lang === "tr" ? "tr-TR" : "en-US");
  const results = [];

  state.elements.forEach((el) => {
    const sym = el.symbol.toLowerCase();
    const tr = normalized(el.name && el.name.tr);
    const en = normalized(el.name && el.name.en);
    let score = 0;
    if (sym === lower) score = 120;
    else if (String(el.z) === raw) score = 115;
    else if (tr === q || en === q) score = 110;
    else if (sym.startsWith(lower)) score = 90;
    else if (tr.startsWith(q) || en.startsWith(q)) score = 80;
    else if (tr.includes(q) || en.includes(q)) score = 60;
    else if (String(el.z).startsWith(raw)) score = 55;
    else if (sym.includes(lower)) score = 45;
    else if (normalized(categoryName(el.category)).includes(q)) score = 25;
    if (score > 0) results.push({ el, score });
  });

  return results.sort((a, b) => b.score - a.score || a.el.z - b.el.z).map((r) => r.el);
}

function renderSearchResults() {
  const wrap = $id("search-results");
  if (!wrap) return;
  const query = state.query.trim();
  if (!query) {
    wrap.classList.add("hidden");
    wrap.innerHTML = "";
    return;
  }
  const results = searchElements(query).slice(0, 9);
  if (!results.length) {
    wrap.innerHTML = '<div class="search-empty">' + escapeText(t("searchNoResults")) + "</div>";
    wrap.classList.remove("hidden");
    return;
  }
  wrap.innerHTML = results.map((el, index) =>
    '<button type="button" class="search-result' + (index === state.searchIndex ? " is-active" : "") + '" data-z="' + el.z + '" role="option" aria-selected="' + (index === state.searchIndex) + '">' +
      '<span class="sr-symbol cat-' + (el.category || "unknown") + '">' + escapeText(el.symbol) + "</span>" +
      '<span class="sr-main"><strong>' + escapeText(optionText(el)) + "</strong><small>" + escapeText(categoryName(el.category)) + " · " + phaseName(el.phase) + "</small></span>" +
      '<span class="sr-z">' + el.z + "</span>" +
    "</button>"
  ).join("");
  wrap.classList.remove("hidden");
}

function onSearchInput(value) {
  state.query = value;
  state.searchIndex = -1;
  applyFilter();
  renderSearchResults();
  renderElementList();
}

function moveSearchSelection(direction) {
  const wrap = $id("search-results");
  if (!wrap || wrap.classList.contains("hidden")) return false;
  const buttons = $$(".search-result", wrap);
  if (!buttons.length) return false;
  state.searchIndex = (state.searchIndex + direction + buttons.length) % buttons.length;
  buttons.forEach((button, index) => {
    button.classList.toggle("is-active", index === state.searchIndex);
    button.setAttribute("aria-selected", String(index === state.searchIndex));
  });
  buttons[state.searchIndex].scrollIntoView({ block: "nearest" });
  return true;
}

function renderElementList() {
  const list = $id("element-list");
  if (!list) return;
  const items = filteredElements();
  list.innerHTML = items.map((el) =>
    '<button type="button" class="el-card cat-' + (el.category || "unknown") + '" data-z="' + el.z + '">' +
      '<span class="ec-symbol">' + escapeText(el.symbol) + "</span>" +
      '<span class="ec-main"><strong>' + escapeText(optionText(el)) + "</strong><small>" + escapeText(categoryName(el.category)) + " · " + phaseName(el.phase) + "</small></span>" +
      '<span class="ec-z">' + el.z + "</span>" +
    "</button>"
  ).join("");
  const empty = $id("list-empty");
  if (empty) empty.classList.toggle("hidden", items.length > 0);
}

function setListView(force) {
  state.listView = force === undefined ? !state.listView : !!force;
  const shell = $(".ptable-shell");
  const wrap = $id("list-wrap");
  const button = $id("list-toggle");
  if (shell) shell.classList.toggle("hidden", state.listView);
  if (wrap) wrap.classList.toggle("hidden", !state.listView);
  if (button) {
    button.setAttribute("aria-pressed", String(state.listView));
    const label = $("span", button);
    if (label) label.textContent = state.listView ? X("tableView") : X("listView");
    const use = $("use", button);
    if (use) use.setAttribute("href", state.listView ? "#i-grid" : "#i-list");
  }
  if (state.listView) renderElementList();
}

function applyZoom() {
  const ptable = $id("ptable");
  if (!ptable) return;
  if (state.zoomTouched) ptable.style.setProperty("--cell", state.zoom + "px");
  else ptable.style.removeProperty("--cell");
}

function zoomBy(delta) {
  const base = state.zoomTouched
    ? state.zoom
    : (window.innerWidth <= 760 ? 50 : 58);
  state.zoom = Math.max(36, Math.min(86, base + delta));
  state.zoomTouched = true;
  applyZoom();
}

function resetZoom() {
  state.zoomTouched = false;
  state.zoom = window.innerWidth <= 760 ? 50 : 58;
  applyZoom();
}

function showTooltip(el, x, y) {
  const tip = $id("tooltip");
  if (!tip || window.innerWidth <= 760) return;
  state.tooltipZ = el.z;
  tip.innerHTML =
    '<div class="tt-head">' +
      '<span class="tt-symbol cat-' + (el.category || "unknown") + '">' + escapeText(el.symbol) + "</span>" +
      '<div><div class="tt-name">' + escapeText(optionText(el)) + '</div><div class="tt-sub">#' + el.z + " · " + escapeText(categoryName(el.category)) + "</div></div>" +
    "</div>" +
    '<div class="tt-row"><span>' + escapeText(t("labels.atomicMass")) + "</span><span>" + escapeText(formatMass(el.mass)) + " " + escapeText(X("massUnit")) + "</span></div>" +
    '<div class="tt-row"><span>' + escapeText(t("labels.phase")) + "</span><span>" + escapeText(phaseName(el.phase)) + "</span></div>" +
    '<div class="tt-row"><span>' + escapeText(t("labels.electronegativity")) + "</span><span>" + escapeText(fmt(el.electronegativity, 3)) + "</span></div>" +
    '<div class="tt-config">' + escapeText(el.electronConfig || "—") + "</div>";
  tip.classList.remove("hidden");
  positionTooltip(x, y);
}

function positionTooltip(x, y) {
  const tip = $id("tooltip");
  if (!tip || tip.classList.contains("hidden")) return;
  const width = 250;
  const left = Math.max(width / 2 + 8, Math.min(window.innerWidth - width / 2 - 8, x));
  let top = y - 12;
  if (top < 190) top = y + 150;
  tip.style.left = left + "px";
  tip.style.top = top + "px";
}

function hideTooltip() {
  const tip = $id("tooltip");
  state.tooltipZ = null;
  if (tip) tip.classList.add("hidden");
}
/* =========================================================================
   Element modal: shell, header, tabs, overview, properties, hazards
   ========================================================================= */

function openElement(z, options) {
  const el = state.byZ.get(Number(z));
  if (!el) return;
  const opts = options || {};
  state.lastFocused = document.activeElement;
  state.currentZ = el.z;
  if (!opts.keepTab) state.currentTab = opts.tab || "overview";
  if (!TABS.includes(state.currentTab)) state.currentTab = "overview";
  destroyAtomViewer();
  renderElementModal();
  document.body.classList.add("modal-open");
  try {
    const hash = "#element=" + el.z + (state.currentTab !== "overview" ? "&tab=" + state.currentTab : "");
    history.replaceState(null, "", hash);
  } catch (e) {}
  const close = $("#element-overlay .modal-close");
  if (close && window.innerWidth > 760) close.focus({ preventScroll: true });
}

function renderElementModal() {
  const el = state.byZ.get(state.currentZ);
  const root = $id("modal-root");
  if (!el || !root) return;
  const color = CATEGORY_COLORS[el.category] || CATEGORY_COLORS.unknown;

  root.innerHTML =
    '<div class="overlay" id="element-overlay" role="dialog" aria-modal="true" aria-labelledby="em-name">' +
      '<div class="element-modal cat-' + (el.category || "unknown") + '" id="element-modal">' +
        '<div class="element-modal-top" id="element-modal-top"></div>' +
        '<div class="em-body" id="em-body" role="tabpanel"></div>' +
      "</div>" +
    "</div>";

  const modal = $id("element-modal");
  if (modal) setColorVars(modal, color);
  renderElementHeader();
  renderElementBody();
}

function renderElementHeader() {
  const el = state.byZ.get(state.currentZ);
  const top = $id("element-modal-top");
  if (!el || !top) return;
  const common = (el.oxidationStates && el.oxidationStates.common) || [];
  const chips = [];
  chips.push('<span class="chip">' + escapeText(phaseName(el.phase)) + "</span>");
  chips.push('<span class="chip"><strong>' + escapeText(formatMass(el.mass)) + "</strong> " + escapeText(X("massUnit")) + "</span>");
  if (el.group) chips.push('<span class="chip">' + escapeText(t("group")) + " " + el.group + "</span>");
  chips.push('<span class="chip">' + escapeText(t("period")) + " " + el.period + "</span>");
  if (common.length) chips.push('<span class="chip">' + escapeText(t("labels.oxidationStatesShort")) + " " + common.map((n) => (n > 0 ? "+" : "") + n).join(", ") + "</span>");
  if (el.radioactive) chips.push('<span class="chip warn">' + escapeText(t("labels.radioactive")) + "</span>");
  if (el.predicted) chips.push('<span class="chip warn">' + escapeText(t("labels.predicted")) + "</span>");
  if (el.natural === false) chips.push('<span class="chip">' + escapeText(t("modal.synthetic")) + "</span>");

  top.innerHTML =
    '<div class="em-head">' +
      '<div class="symbol-tile">' +
        '<span class="st-z">' + el.z + "</span>" +
        '<span class="st-sym">' + escapeText(el.symbol) + "</span>" +
        '<span class="st-name">' + escapeText(optionText(el)) + "</span>" +
      "</div>" +
      '<div class="em-title">' +
        '<div class="em-kicker"><span class="cat-dot"></span>' + escapeText(categoryName(el.category)) + " · " + escapeText((el.block || "?").toUpperCase()) + " " + escapeText(t("labels.block").toLocaleLowerCase(locale())) + "</div>" +
        '<h2 id="em-name">' + escapeText(optionText(el)) + " <small>" + escapeText(el.symbol) + "</small></h2>" +
        '<div class="em-chips">' + chips.join("") + "</div>" +
      "</div>" +
      '<div class="em-actions">' +
        '<button class="btn btn-ghost btn-lab" type="button" data-action="lab" title="' + escapeText(t("labSend")) + '"><svg class="icon"><use href="#i-flask"/></svg><span>LAB</span></button>' +
        '<button class="btn btn-ghost btn-compare" type="button" data-action="compare">' + escapeText(t("compareThis")) + "</button>" +
        '<button class="icon-btn btn-copy" type="button" data-action="copy" aria-label="' + escapeText(t("copyLink")) + '" title="' + escapeText(t("copyLink")) + '"><svg class="icon"><use href="#i-copy"/></svg></button>' +
        '<button class="icon-btn" type="button" data-action="prev" aria-label="' + escapeText(t("previous")) + '" title="' + escapeText(t("previous")) + '"><svg class="icon"><use href="#i-left"/></svg></button>' +
        '<button class="icon-btn" type="button" data-action="next" aria-label="' + escapeText(t("next")) + '" title="' + escapeText(t("next")) + '"><svg class="icon"><use href="#i-right"/></svg></button>' +
        '<button class="icon-btn modal-close" type="button" data-action="close" aria-label="' + escapeText(t("close")) + '"><svg class="icon"><use href="#i-close"/></svg></button>' +
      "</div>" +
    "</div>" +
    '<div class="em-tabs" role="tablist" aria-label="' + escapeText(X("tabsLabel")) + '">' +
      TABS.map((tab) =>
        '<button class="em-tab' + (tab === state.currentTab ? " is-active" : "") + '" type="button" role="tab" data-tab="' + tab + '" aria-selected="' + (tab === state.currentTab) + '">' +
          escapeText(t("tabs." + tab)) +
        "</button>"
      ).join("") +
    "</div>";

  const activeTab = $(".em-tab.is-active");
  if (activeTab && activeTab.scrollIntoView) {
    try { activeTab.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) {}
  }
}

function switchElementTab(tab) {
  if (!TABS.includes(tab) || tab === state.currentTab) return;
  if (state.currentTab === "atom") destroyAtomViewer();
  state.currentTab = tab;
  $$(".em-tab").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const activeTab = $(".em-tab.is-active");
  if (activeTab && activeTab.scrollIntoView) {
    try { activeTab.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) {}
  }
  renderElementBody();
  try {
    const hash = "#element=" + state.currentZ + (tab !== "overview" ? "&tab=" + tab : "");
    history.replaceState(null, "", hash);
  } catch (e) {}
}

function renderElementBody() {
  const el = state.byZ.get(state.currentZ);
  const body = $id("em-body");
  if (!el || !body) return;
  if (state.currentTab !== "atom") destroyAtomViewer();
  body.innerHTML = "";

  if (state.currentTab === "overview") body.innerHTML = renderOverview(el);
  else if (state.currentTab === "atom") body.innerHTML = renderAtomTab(el);
  else if (state.currentTab === "properties") body.innerHTML = renderProperties(el);
  else if (state.currentTab === "isotopes") body.innerHTML = renderIsotopes(el);
  else if (state.currentTab === "spectrum") body.innerHTML = renderSpectrum(el);
  else if (state.currentTab === "reactions") body.innerHTML = renderReactions(el);

  body.scrollTop = 0;
  if (state.currentTab === "atom") initAtomTab(el);
}

function closeElement() {
  destroyAtomViewer();
  const root = $id("modal-root");
  if (root) root.innerHTML = "";
  document.body.classList.remove("modal-open");
  state.currentZ = null;
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  if (state.lastFocused && state.lastFocused.focus) {
    try { state.lastFocused.focus({ preventScroll: true }); } catch (e) {}
  }
}

function navigateElement(direction) {
  if (!state.currentZ) return;
  let z = state.currentZ + direction;
  if (z < 1) z = 118;
  if (z > 118) z = 1;
  const tab = state.currentTab;
  openElement(z, { keepTab: true, tab });
}

function copyElementLink() {
  const url = location.origin + location.pathname + "#element=" + state.currentZ;
  const done = () => toast(t("linkCopied"));
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(text, done) {
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  try { document.execCommand("copy"); done(); } catch (e) {}
  input.remove();
}

function compareElement(z) {
  state.compare.a = z;
  if (state.compare.b === z) state.compare.b = z === 118 ? 1 : z + 1;
  closeElement();
  setView("compare");
  renderCompare();
  syncComparePickers();
  toast(t("toast.compared"));
}

function wikiUrl(el) {
  const name = (el.name && (el.name.en || el.name.tr)) || el.symbol;
  return "https://en.wikipedia.org/wiki/" + encodeURIComponent(String(name).replace(/\s+/g, "_"));
}

/* ------------------------------- overview ------------------------------- */

function renderOverview(el) {
  const summary = el.summary ? loc(el.summary) : (el.appearanceEn || "");
  const summaryMeta = [];
  summaryMeta.push('<span class="chip">' + escapeText(t("labels.discovery")) + ": <strong>" + escapeText(discoveryLabel(el)) + "</strong></span>");
  if (el.discovery && el.discovery.by) summaryMeta.push('<span class="chip">' + escapeText(el.discovery.by) + "</span>");
  summaryMeta.push('<span class="chip ' + (el.natural === false ? "warn" : "good") + '">' + escapeText(el.natural === false ? t("modal.synthetic") : t("modal.natural")) + "</span>");
  if (el.radioactive) summaryMeta.push('<span class="chip bad">' + escapeText(t("labels.radioactive")) + "</span>");
  if (el.predicted) summaryMeta.push('<span class="chip warn">' + escapeText(t("labels.predicted")) + "</span>");

  const facts = [
    [t("labels.atomicMass"), formatMass(el.mass) + " " + X("massUnit"), null],
    [t("labels.category"), categoryName(el.category), null],
    [t("labels.phase"), phaseName(el.phase), null],
    [t("labels.density"), formatDensity(el.density), null],
    [t("labels.meltingPoint"), formatTemp(el.melting), null],
    [t("labels.boilingPoint"), formatTemp(el.boiling), null]
  ].map((f) =>
    '<div class="fact"><span>' + escapeText(f[0]) + "</span><strong>" + f[1] + "</strong>" + (f[2] ? "<small>" + escapeText(f[2]) + "</small>" : "") + "</div>"
  ).join("");

  const shellChips = (el.shells || []).map((count, index) => {
    const last = index === (el.shells || []).length - 1;
    return '<span class="shell-chip' + (last ? " is-valence" : "") + '"><b>' + "KLMNOPQ"[index] + "</b> " + count + "</span>";
  }).join("");

  const common = (el.oxidationStates && el.oxidationStates.common) || [];
  const all = (el.oxidationStates && el.oxidationStates.all) || [];
  const oxStates = (all.length ? all : common).slice();
  if (common.length) {
    common.forEach((value) => {
      const index = oxStates.indexOf(value);
      if (index > -1) oxStates.splice(index, 1);
    });
    oxStates.unshift.apply(oxStates, common);
  }
  const oxChips = oxStates.slice(0, 16).map((value) => {
    const isCommon = common.includes(value);
    return '<span class="ox-chip' + (isCommon ? " is-common" : "") + (value === 0 ? " is-zero" : "") + '">' + (value > 0 ? "+" : "") + value + "</span>";
  }).join("");

  const photo = renderPhotoCard(el);
  const uses = renderUsesCard(el);
  const mini = renderMiniCard(el);
  const neighbors = renderNeighborsCard(el);

  return (
    '<div class="overview-grid">' +
      '<div class="overview-main">' +
        '<article class="card">' +
          '<h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("labels.summary")) + "</h3>" +
          '<p class="summary-text">' + escapeText(summary) + "</p>" +
          '<div class="summary-meta">' + summaryMeta.join("") + "</div>" +
        "</article>" +
        '<article class="card">' +
          '<h3><svg class="icon"><use href="#i-table"/></svg>' + escapeText(t("labels.quickFacts")) + "</h3>" +
          '<div class="fact-grid">' + facts + "</div>" +
        "</article>" +
        '<article class="card">' +
          '<h3><svg class="icon"><use href="#i-atom"/></svg>' + escapeText(t("labels.electronConfig")) + "</h3>" +
          '<div class="config-line">' + escapeText(el.electronConfig || "—") + "</div>" +
          '<details class="config-details"><summary>' + escapeText(t("modal.showFullConfig")) + "</summary>" +
            '<div class="config-full">' + escapeText(el.electronConfigFull || "—") + "</div>" +
          "</details>" +
          '<div class="shell-chips">' + shellChips + "</div>" +
          '<div class="ox-chips" style="margin-top:13px">' + oxChips + "</div>" +
        "</article>" +
      "</div>" +
      '<aside class="overview-side">' +
        photo +
        uses +
        mini +
        neighbors +
      "</aside>" +
    "</div>"
  );
}

function renderPhotoCard(el) {
  const image = el.image
    ? '<img src="' + escapeText(el.image) + '" alt="' + escapeText(optionText(el)) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'">'
    : "";
  return (
    '<article class="card photo-card">' +
      '<div class="element-photo">' +
        '<div class="photo-fallback"><strong>' + escapeText(el.symbol) + '</strong><span>' + escapeText(X("noImage")) + "</span></div>" +
        image +
      "</div>" +
      '<div class="photo-credit"><span>' + escapeText(X("photoCredit")) + '</span><a href="' + escapeText(wikiUrl(el)) + '" target="_blank" rel="noopener">' + escapeText(X("wiki")) + ' ↗</a></div>' +
    "</article>"
  );
}

function renderUsesCard(el) {
  const uses = (window.REACTIONS && window.REACTIONS.getUses(el)) || [];
  const rows = uses.slice(0, 5).map((item) => {
    const text = item[state.lang === "tr" ? 1 : 2] || item[1] || item[2] || "";
    return (
      '<div class="use-item">' +
        '<span class="use-ico">' + useIcon(item[0]) + "</span>" +
        "<div><strong>" + escapeText(text) + "</strong><small>" + escapeText(useTypeName(item[0])) + "</small></div>" +
      "</div>"
    );
  }).join("");
  return (
    '<article class="card">' +
      '<h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("labels.uses")) + "</h3>" +
      (rows ? '<div class="uses-list">' + rows + "</div>" : '<p class="empty-inline">' + escapeText(t("labels.noUses")) + "</p>") +
    "</article>"
  );
}

function renderMiniCard(el) {
  const rows = [
    [t("labels.electronegativity"), fmt(el.electronegativity, 3)],
    [t("labels.atomicRadius"), el.atomicRadius === null || el.atomicRadius === undefined ? "—" : fmt(el.atomicRadius, 4) + " pm"],
    [t("labels.firstIonization"), el.ionizationEnergies && el.ionizationEnergies.length ? fmt(el.ionizationEnergies[0], 4) + " eV" : "—"],
    [t("labels.density"), formatDensity(el.density)],
    [t("labels.crystalStructure"), crystalName(el.crystal)]
  ].map((row) =>
    '<div class="mini-row"><span>' + escapeText(row[0]) + "</span><strong>" + row[1] + "</strong></div>"
  ).join("");
  return (
    '<article class="card">' +
      '<h3><svg class="icon"><use href="#i-trend"/></svg>' + escapeText(t("tabs.properties")) + "</h3>" +
      '<div class="mini-list">' + rows + "</div>" +
    "</article>"
  );
}

function renderNeighborsCard(el) {
  let groupEls;
  if (el.category === "lanthanide" || el.category === "actinide") {
    groupEls = state.elements.filter((x) => x.category === el.category && x.z !== el.z);
  } else {
    groupEls = state.elements.filter((x) => x.group === el.group && x.category !== "lanthanide" && x.category !== "actinide" && x.z !== el.z);
  }
  const periodEls = state.elements.filter((x) => x.period === el.period && x.z !== el.z);
  const chips = (arr) => {
    const shown = arr.slice(0, 9);
    const rest = arr.length - shown.length;
    return shown.map((x) =>
      '<button class="neighbor-chip" type="button" data-z="' + x.z + '" title="' + escapeText(optionText(x)) + '"><b>' + escapeText(x.symbol) + "</b> " + x.z + "</button>"
    ).join("") + (rest > 0 ? '<span class="neighbor-chip more">' + escapeText(xf(X("more"), { n: rest })) + "</span>" : "");
  };
  return (
    '<article class="card">' +
      '<h3><svg class="icon"><use href="#i-table"/></svg>' + escapeText(t("labels.neighbors")) + "</h3>" +
      '<div class="neighbor-groups">' +
        '<div class="neighbor-row"><span>' + escapeText(t("labels.sameGroup")) + '</span><div class="neighbor-list">' + chips(groupEls) + "</div></div>" +
        '<div class="neighbor-row"><span>' + escapeText(t("labels.samePeriod")) + '</span><div class="neighbor-list">' + chips(periodEls) + "</div></div>" +
      "</div>" +
    "</article>"
  );
}

/* ------------------------------- properties ------------------------------- */

function propRow(label, value, wide) {
  return (
    '<div class="prop-row' + (wide ? " is-wide" : "") + '"><span>' + escapeText(label) + "</span><strong>" + (value || "—") + "</strong></div>"
  );
}

function renderProperties(el) {
  const common = (el.oxidationStates && el.oxidationStates.common) || [];
  const all = (el.oxidationStates && el.oxidationStates.all) || [];
  const oxText = (all.length ? all : common).slice(0, 12).map((n) => (n > 0 ? "+" : "") + n).join(", ");

  const atomicRows = [
    propRow(t("labels.atomicNumber"), String(el.z)),
    propRow(t("labels.atomicMass"), formatMass(el.mass) + " " + X("massUnit")),
    propRow(t("labels.block"), (el.block || "—").toUpperCase() + " " + t("labels.block").toLocaleLowerCase(locale())),
    propRow(t("labels.group"), el.group ? String(el.group) : "—"),
    propRow(t("labels.period"), String(el.period)),
    propRow(t("labels.valence"), el.valence === null || el.valence === undefined ? "—" : String(el.valence)),
    propRow(t("labels.electronegativity"), fmt(el.electronegativity, 3)),
    propRow(t("labels.electronAffinity"), el.electronAffinity === null || el.electronAffinity === undefined ? "—" : fmt(el.electronAffinity, 4) + " eV"),
    propRow(t("labels.oxidationStates"), oxText || "—", true),
    propRow(t("labels.electronConfigFull"), escapeText(el.electronConfigFull || "—"), true)
  ].join("");

  const physicalRows = [
    propRow(t("labels.phase"), phaseName(el.phase)),
    propRow(t("labels.meltingPoint"), formatTemp(el.melting)),
    propRow(t("labels.boilingPoint"), formatTemp(el.boiling)),
    propRow(t("labels.density"), formatDensity(el.density)),
    propRow(t("labels.crystalStructure"), crystalName(el.crystal)),
    propRow(t("labels.magneticOrdering"), magneticName(el.magnetic)),
    propRow(t("labels.thermalConductivity"), el.thermalConductivity === null || el.thermalConductivity === undefined ? "—" : fmt(el.thermalConductivity, 4) + " W/(m·K)"),
    propRow(t("labels.molarHeat"), el.molarHeat === null || el.molarHeat === undefined ? "—" : fmt(el.molarHeat, 4) + " J/(mol·K)"),
    propRow(t("labels.soundSpeed"), el.soundSpeed === null || el.soundSpeed === undefined ? "—" : fmt(el.soundSpeed, 4) + " m/s")
  ].join("");

  const ions = (el.ionizationEnergies || []).slice(0, 8).map((v, i) =>
    '<span class="ion-chip">' + (i + 1) + ". " + fmt(v, 4) + " eV</span>"
  ).join("");

  const discoveryRows = [
    propRow(t("labels.discovery"), discoveryLabel(el)),
    propRow(t("labels.discoveredBy"), escapeText(el.discovery && el.discovery.by ? el.discovery.by : "—")),
    propRow(t("labels.cas"), escapeText(el.cas || "—")),
    propRow(t("labels.price"), formatPrice(el.price)),
    propRow(t("labels.natural"), el.natural === false ? t("modal.synthetic") : t("modal.natural")),
    propRow(t("labels.radioactive"), el.radioactive ? t("yes") : t("no")),
    propRow(t("labels.predicted"), el.predicted ? t("yes") : t("no")),
    propRow(t("labels.appearance"), escapeText(el.appearanceEn || "—"), true)
  ].join("");

  return (
    '<div class="prop-layout">' +
      '<section class="card prop-section"><h3><svg class="icon"><use href="#i-atom"/></svg>' + escapeText(t("labels.atomicNumber")) + " & " + escapeText(t("labels.atomicMass")) + "</h3>" +
        '<div class="prop-rows">' + atomicRows + "</div>" +
        '<p class="safety-note">' + escapeText(t("labels.oxidationNote")) + "</p>" +
      "</section>" +
      '<section class="card prop-section"><h3><svg class="icon"><use href="#i-trend"/></svg>' + escapeText(t("labels.phase")) + " & " + escapeText(t("labels.density")) + "</h3>" +
        '<div class="prop-rows">' + physicalRows + "</div>" +
      "</section>" +
      '<section class="card prop-section"><h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("labels.abundance")) + "</h3>" +
        renderAbundance(el) +
      "</section>" +
      '<section class="card prop-section"><h3><svg class="icon"><use href="#i-search"/></svg>' + escapeText(t("labels.discovery")) + "</h3>" +
        '<div class="prop-rows">' + discoveryRows + "</div>" +
        '<p class="safety-note">' + escapeText(t("labels.priceNote")) + "</p>" +
      "</section>" +
      '<section class="card prop-section"><h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("labels.ionizationEnergy")) + "</h3>" +
        (ions ? '<div class="ion-chips">' + ions + "</div>" : '<p class="empty-inline">—</p>') +
        '<p class="safety-note">' + escapeText(t("labels.firstIonization")) + ": " + (el.ionizationEnergies && el.ionizationEnergies.length ? fmt(el.ionizationEnergies[0], 4) + " eV" : "—") + "</p>" +
      "</section>" +
      '<section class="card prop-section" style="grid-column:1/-1"><h3><svg class="icon"><use href="#i-quiz"/></svg>' + escapeText(t("hazards.title")) + "</h3>" +
        renderHazardBody(el) +
      "</section>" +
    "</div>"
  );
}

function renderAbundance(el) {
  const data = el.abundance || {};
  const keys = ["universe", "crust", "water", "human", "sun", "meteorite"].filter((key) => data[key] !== undefined && data[key] !== null);
  if (!keys.length) return '<p class="empty-inline">—</p>';
  const values = keys.map((key) => Math.max(0, Number(data[key]) || 0));
  const maxLog = Math.log10(Math.max.apply(null, values.concat([1])) + 1);
  const rows = keys.map((key) => {
    const value = Math.max(0, Number(data[key]) || 0);
    const info = formatAbundance(value);
    const pct = value > 0 ? Math.max(2, Math.min(100, (Math.log10(value + 1) / maxLog) * 100)) : 0;
    return (
      '<div class="abundance-row">' +
        "<span>" + escapeText(trOr("abundance." + key, key)) + "</span>" +
        '<div class="abundance-bar"><i style="width:' + pct + '%"></i></div>' +
        "<strong>" + escapeText(info.text) + "</strong>" +
      "</div>"
    );
  }).join("");
  return '<div class="abundance-list">' + rows + "</div>";
}

function renderHazardBody(el) {
  const h = el.hazard;
  if (!h) {
    let note = t("labels.noHazard");
    if (el.radioactive) note = t("hazards.radioactiveNote");
    return '<p class="empty-inline">' + escapeText(note) + "</p>" +
      '<p class="safety-note">' + escapeText(t("hazards.safetyNote")) + "</p>";
  }

  const ghs = (h.ghs || []).filter((code) => code && code !== "?").map((code) =>
    '<div class="hazard-item"><div class="hazard-diamond"><span>' + ghsIcon(code) + "</span></div><div><strong>" + escapeText(ghsName(code)) + "</strong><small>GHS " + escapeText(code) + "</small></div></div>"
  ).join("");

  const hCodes = (h.h || []).filter((code) => code && code !== "?").map((code) => {
    const phrase = hPhrase(code);
    if (!phrase) return "";
    return '<div class="h-code"><b>' + escapeText(phrase.code) + "</b><span>" + escapeText(phrase.text || "—") + "</span></div>";
  }).join("");

  const pCodes = (h.p || []).filter((code) => code && code !== "?").map((code) =>
    '<span class="p-code">' + escapeText(pCode(code) || "") + "</span>"
  ).join("");

  const nfpa = h.nfpa
    ? '<div class="nfpa" title="NFPA 704">' +
        '<div class="nf-h" title="' + escapeText(X("nfpa").h) + '">' + escapeText(h.nfpa.h || "0") + "</div>" +
        '<div class="nf-f" title="' + escapeText(X("nfpa").f) + '">' + escapeText(h.nfpa.f || "0") + "</div>" +
        '<div class="nf-i" title="' + escapeText(X("nfpa").i) + '">' + escapeText(h.nfpa.i || "0") + "</div>" +
        (h.nfpa.s ? '<div class="nf-s" title="' + escapeText(X("nfpa").s) + '">' + escapeText(h.nfpa.s) + "</div>" : "") +
      "</div>"
    : "";

  const old = (h.hazard || []).map((code) => X("oldHazard")[code]).filter(Boolean);
  const signal = (h.ghs || []).some((code) => ["01", "05", "06", "08"].includes(code)) ? t("hazards.danger") : t("hazards.warning");
  const adr = (h.adr || []).filter(Boolean).length
    ? '<div class="prop-row" style="margin-top:8px"><span>ADR</span><strong>' + escapeText((h.adr || []).join(" · ")) + "</strong></div>"
    : "";

  return (
    '<div class="hazard-grid">' + (ghs || '<p class="empty-inline">' + escapeText(t("hazards.noHazard")) + "</p>") + "</div>" +
    '<div class="summary-meta" style="margin-top:0;margin-bottom:10px">' +
      '<span class="chip ' + (signal === t("hazards.danger") ? "bad" : "warn") + '">' + escapeText(t("hazards.signal")) + ": <strong>" + escapeText(signal) + "</strong></span>" +
      old.map((name) => '<span class="chip">' + escapeText(name) + "</span>").join("") +
    "</div>" +
    (hCodes ? '<div class="h-code-list">' + hCodes + "</div>" : "") +
    (pCodes ? '<div class="p-code-row">' + pCodes + "</div>" : "") +
    nfpa + adr +
    '<p class="safety-note">' + escapeText(t("hazards.safetyNote")) + "</p>"
  );
}
/* =========================================================================
   Isotopes, emission spectrum, reactions and 3D atom viewer
   ========================================================================= */

/* ------------------------------- isotopes ------------------------------- */

function renderIsotopes(el) {
  const isotopes = (el.isotopes || []).slice().sort((a, b) => a.massNumber - b.massNumber);
  if (!isotopes.length) {
    return '<div class="card"><p class="empty-inline">' + escapeText(t("isotopes.noData")) + "</p></div>";
  }
  const maxAbundance = Math.max.apply(null, isotopes.map((iso) => Number(iso.abundance) || 0).concat([0.0001]));
  const rows = isotopes.map((iso) => {
    const abundance = Number(iso.abundance) || 0;
    const width = abundance > 0 ? Math.max(2, (abundance / maxAbundance) * 100) : 0;
    return (
      '<tr class="' + (abundance > 0 ? "is-natural" : "") + '">' +
        "<td><strong>" + iso.massNumber + "</strong></td>" +
        "<td>" + (iso.mass === null || iso.mass === undefined ? "—" : fmt(iso.mass, 7)) + "</td>" +
        '<td><div class="iso-ab"><div class="bar"><i style="width:' + width + '%"></i></div><strong>' + (abundance > 0 ? fmt(abundance, 4) + " %" : "—") + "</strong></div></td>" +
        "<td>" + escapeText(halfLifeLabel(iso)) + "</td>" +
        "<td>" + escapeText(iso.spin || "—") + "</td>" +
        '<td>' + (iso.radioactive
          ? '<span class="radio-dot"></span>' + escapeText(t("isotopes.radioactive"))
          : '<span class="stable-dot"></span>' + escapeText(t("isotopes.stable"))) + "</td>" +
      "</tr>"
    );
  }).join("");

  return (
    '<div class="card">' +
      '<h3><svg class="icon"><use href="#i-atom"/></svg>' + escapeText(t("isotopes.title")) + " · " + escapeText(el.symbol) + "</h3>" +
      '<p class="spectrum-intro">' + escapeText(t("isotopes.intro")) + "</p>" +
      '<div class="isotope-table-wrap"><table class="isotope-table">' +
        "<thead><tr>" +
          "<th>" + escapeText(t("isotopes.massNumber")) + "</th>" +
          "<th>" + escapeText(t("isotopes.mass")) + "</th>" +
          "<th>" + escapeText(t("isotopes.abundance")) + "</th>" +
          "<th>" + escapeText(t("isotopes.halfLife")) + "</th>" +
          "<th>" + escapeText(t("isotopes.spin")) + "</th>" +
          "<th>" + escapeText(t("isotopes.type")) + "</th>" +
        "</tr></thead>" +
        "<tbody>" + rows + "</tbody>" +
      "</table></div>" +
      '<p class="iso-note">' + escapeText(t("isotopes.note")) + "</p>" +
    "</div>"
  );
}

/* ------------------------------- spectrum ------------------------------- */

function renderSpectrum(el) {
  if (!el.spectrum) {
    return (
      '<div class="card spectrum-card">' +
        '<h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("spectrum.title")) + "</h3>" +
        '<div class="spectrum-empty">' + escapeText(t("spectrum.noData")) + "</div>" +
        '<p class="spectrum-note">' + escapeText(t("labels.sourcesNote")) + "</p>" +
      "</div>"
    );
  }
  return (
    '<div class="card spectrum-card">' +
      '<h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("spectrum.title")) + " · " + escapeText(el.symbol) + "</h3>" +
      '<p class="spectrum-intro">' + escapeText(t("spectrum.intro")) + "</p>" +
      '<div class="spectrum-frame">' +
        '<div class="spectrum-strip" role="img" aria-label="' + escapeText(X("spectrumLabel") + " · " + optionText(el)) + '" style="background-image:url(\'' + el.spectrum + '\')"></div>' +
        '<div class="spectrum-scale"><span>380 nm</span><span>480 nm</span><span>580 nm</span><span>680 nm</span><span>780 nm</span></div>' +
      "</div>" +
      '<div class="spectrum-legend"><span>' + escapeText(t("spectrum.legend")) + '</span><span class="spectrum-gradient"></span></div>' +
      '<p class="spectrum-note">' + escapeText(t("spectrum.note")) + " " + escapeText(t("labels.sourcesNote")) + "</p>" +
    "</div>"
  );
}

/* ------------------------------- reactions ------------------------------- */

function renderReactions(el) {
  if (!window.REACTIONS) {
    return '<div class="card"><p class="empty-inline">' + escapeText(t("reactions.noData")) + "</p></div>";
  }
  const data = window.REACTIONS.getReactions(el);
  const level = data.level || "low";
  const bars = { high: 5, medium: 3, low: 2, inert: 1 }[level] || 2;
  const levelText = trOr("reactions." + level, level);
  const equations = (data.equations || []).map((eq) =>
    '<div class="equation">' +
      '<span class="eq-tag">' + escapeText(loc(eq.tag) || "—") + "</span>" +
      "<div><div class=\"eq-main\">" + escapeText(eq.eq || "") + "</div>" +
      (eq.note ? '<div class="eq-note">' + escapeText(loc(eq.note)) + "</div>" : "") +
      "</div>" +
    "</div>"
  ).join("");

  const compounds = (window.REACTIONS.getCompounds(el) || []).map((item) =>
    '<div class="compound"><strong>' + escapeText(item[0]) + "</strong><span>" + escapeText(state.lang === "tr" ? item[1] : item[2]) + "</span></div>"
  ).join("");

  return (
    '<div class="reaction-layout">' +
      '<section class="card">' +
        '<h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("reactions.title")) + "</h3>" +
        '<div class="reaction-profile">' +
          '<div class="reaction-meter">' +
            '<div class="meter-bars">' + Array.from({ length: 5 }, (_, i) => '<i class="' + (i < bars ? "on" : "") + '"></i>').join("") + "</div>" +
            '<span>' + escapeText(t("reactions.reactivity")) + "</span>" +
            "<strong>" + escapeText(levelText) + "</strong>" +
          "</div>" +
          "<p>" + escapeText(loc(data.text) || "") + "</p>" +
        "</div>" +
      "</section>" +
      '<section class="card">' +
        '<h3><svg class="icon"><use href="#i-reset"/></svg>' + escapeText(t("reactions.equations")) + "</h3>" +
        (equations ? '<div class="equation-list">' + equations + "</div>" : '<p class="empty-inline">' + escapeText(t("reactions.noData")) + "</p>") +
        '<p class="reaction-disclaimer" style="margin-top:12px">' + escapeText(t("reactions.disclaimer")) + "</p>" +
      "</section>" +
      (compounds
        ? '<section class="card"><h3><svg class="icon"><use href="#i-atom"/></svg>' + escapeText(t("reactions.compounds")) + '</h3><div class="compound-grid">' + compounds + "</div></section>"
        : "") +
      '<section class="card">' +
        '<h3><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("labels.uses")) + "</h3>" +
        renderUsesInline(el) +
      "</section>" +
    "</div>"
  );
}

function renderUsesInline(el) {
  const uses = (window.REACTIONS && window.REACTIONS.getUses(el)) || [];
  if (!uses.length) return '<p class="empty-inline">' + escapeText(t("labels.noUses")) + "</p>";
  return '<div class="uses-list">' + uses.map((item) =>
    '<div class="use-item"><span class="use-ico">' + useIcon(item[0]) + "</span><div><strong>" +
      escapeText(item[state.lang === "tr" ? 1 : 2] || item[1] || item[2] || "") +
      "</strong><small>" + escapeText(useTypeName(item[0])) + "</small></div></div>"
  ).join("") + "</div>";
}

/* ------------------------------- atom tab ------------------------------- */

function renderAtomTab(el) {
  const protons = el.z;
  const mass = Math.round(el.mass || el.z * 2);
  const neutrons = Math.max(0, mass - protons);
  const electrons = el.z;
  return (
    '<div class="atom-layout">' +
      '<div class="atom-stage" id="atom-stage">' +
        '<canvas id="atom-canvas" aria-label="' + escapeText(X("ariaAtom") + " · " + optionText(el)) + '"></canvas>' +
        '<div class="atom-overlay">' +
          "<span>Z = " + protons + "</span>" +
          "<span>" + protons + " " + escapeText(t("labels.protons")) + "</span>" +
          "<span>" + neutrons + " " + escapeText(t("labels.neutrons")) + "</span>" +
          "<span>" + electrons + " " + escapeText(t("labels.electrons")) + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="atom-side">' +
        '<div class="atom-panel">' +
          '<h4>' + escapeText(t("atom.mode")) + "</h4>" +
          '<div class="segmented" id="atom-mode" role="group">' +
            '<button type="button" data-atom-mode="bohr" class="' + (state.atomState.mode === "bohr" ? "is-active" : "") + '">' + escapeText(t("atom.bohr")) + "</button>" +
            '<button type="button" data-atom-mode="orbital" class="' + (state.atomState.mode === "orbital" ? "is-active" : "") + '">' + escapeText(t("atom.orbital")) + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="atom-panel">' +
          '<h4>' + escapeText(t("atom.selectSubshell")) + "</h4>" +
          '<div class="chip-row" id="subshell-chips"></div>' +
          '<h4 style="margin-top:11px">' + escapeText(t("atom.selectOrbital")) + "</h4>" +
          '<div class="chip-row" id="orbital-chips"></div>' +
          '<div class="orbital-legend" style="margin-top:10px"><span><i class="legend-pos"></i>+</span><span><i class="legend-neg"></i>−</span></div>' +
        "</div>" +
        '<div class="atom-panel">' +
          '<h4>' + escapeText(t("atom.speed")) + "</h4>" +
          '<div class="speed-row"><input type="range" id="atom-speed" min="0.2" max="2" step="0.1" value="' + state.atomState.speed + '" aria-label="' + escapeText(t("atom.speed")) + '"></div>' +
          '<div class="atom-actions" style="margin-top:9px">' +
            '<button class="btn btn-ghost" type="button" data-atom-action="rotate" aria-pressed="' + state.atomState.autoRotate + '">' + escapeText(t("atom.autoRotate")) + "</button>" +
            '<button class="btn btn-ghost" type="button" data-atom-action="reset">' + escapeText(t("atom.resetView")) + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="atom-panel">' +
          '<h4>' + escapeText(t("labels.electronShells")) + "</h4>" +
          '<div class="shell-summary" id="atom-shell-summary"></div>' +
          '<p class="atom-hint" id="atom-hint" style="margin-top:9px"></p>' +
          '<p class="atom-hint" style="margin-top:6px">' + escapeText(t("atom.dragHint")) + "</p>" +
        "</div>" +
      "</div>" +
    "</div>"
  );
}

function defaultSubshell(el) {
  const subs = window.Atom3D ? window.Atom3D.parseSubshells(el) : [];
  const withE = subs.filter((s) => s.electrons > 0);
  if (!withE.length) return { n: 1, l: 0, electrons: 1 };
  const maxN = Math.max.apply(null, withE.map((s) => s.n));
  const atN = withE.filter((s) => s.n === maxN);
  const maxL = Math.max.apply(null, atN.map((s) => s.l));
  return atN.find((s) => s.l === maxL) || atN[0];
}

function initAtomTab(el) {
  const canvas = $id("atom-canvas");
  const stage = $id("atom-stage");
  if (!canvas || !stage) return;
  if (!window.THREE || !window.Atom3D || !window.Atom3D.AtomViewer || !webglAvailable()) {
    stage.classList.add("is-fallback");
    stage.innerHTML = '<div class="spectrum-empty">' + escapeText(X("atomFallback")) + "</div>";
    renderAtomControls(el);
    return;
  }

  const subs = window.Atom3D.parseSubshells(el);
  const fallback = defaultSubshell(el);
  const valid = subs.some((s) => s.electrons > 0 && s.n === state.atomState.n && s.l === state.atomState.l);
  if (!valid) {
    state.atomState.n = fallback.n;
    state.atomState.l = fallback.l;
    state.atomState.m = 0;
  }

  try {
    const viewer = new window.Atom3D.AtomViewer(canvas, el);
    state.atomViewer = viewer;
    viewer.setSubshell(state.atomState.n, state.atomState.l);
    viewer.setM(state.atomState.m || 0);
    viewer.setMode(state.atomState.mode === "orbital" ? "orbital" : "bohr");
    viewer.setSpeed(state.atomState.speed || 1);
    viewer.toggleAutoRotate(state.atomState.autoRotate);
    renderAtomControls(el);
  } catch (error) {
    state.atomViewer = null;
    stage.classList.add("is-fallback");
    stage.innerHTML = '<div class="spectrum-empty">' + escapeText(X("atomFallback")) + "</div>";
    renderAtomControls(el);
  }
}

function renderAtomControls(el) {
  const subs = window.Atom3D ? window.Atom3D.parseSubshells(el) : [];
  const activeN = state.atomState.n;
  const activeL = state.atomState.l;
  const activeM = state.atomState.m || 0;
  const mode = state.atomState.mode;

  $$("#atom-mode button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.atomMode === mode);
  });

  const subshellRow = $id("subshell-chips");
  if (subshellRow) {
    subshellRow.innerHTML = subs.filter((s) => s.electrons > 0).map((s) =>
      '<button type="button" class="orb-chip' + (s.n === activeN && s.l === activeL ? " is-active" : "") + '" data-subshell-n="' + s.n + '" data-subshell-l="' + s.l + '">' +
        escapeText(s.n + "spdf"[s.l] + sup(s.electrons)) +
      "</button>"
    ).join("");
  }

  const orbitalRow = $id("orbital-chips");
  if (orbitalRow) {
    const l = activeL || 0;
    orbitalRow.innerHTML = Array.from({ length: l * 2 + 1 }, (_, index) => index - l).map((m) =>
      '<button type="button" class="orb-chip' + (m === activeM ? " is-active" : "") + '" data-orbital-m="' + m + '">' +
        escapeText(window.Atom3D ? window.Atom3D.orbitalName(l, m).replace(/_/g, "") : "m=" + m) +
      "</button>"
    ).join("");
  }

  const hint = $id("atom-hint");
  if (hint) hint.textContent = mode === "orbital" ? t("atom.orbitalHint") : t("atom.bohrHint");

  const speed = $id("atom-speed");
  if (speed) speed.value = String(state.atomState.speed || 1);

  const rotate = $('[data-atom-action="rotate"]');
  if (rotate) rotate.setAttribute("aria-pressed", String(state.atomState.autoRotate));

  const summary = $id("atom-shell-summary");
  if (summary) {
    summary.innerHTML = (el.shells || []).map((count, index) =>
      '<span class="shell-chip' + (index === (el.shells || []).length - 1 ? " is-valence" : "") + '"><b>' + "KLMNOPQ"[index] + "</b> " + count + "</span>"
    ).join("");
  }
}

function atomSetMode(mode) {
  if (mode !== "bohr" && mode !== "orbital") return;
  state.atomState.mode = mode;
  if (state.atomViewer) state.atomViewer.setMode(mode);
  const el = state.byZ.get(state.currentZ);
  if (el) renderAtomControls(el);
}

function atomSetSubshell(n, l) {
  state.atomState.n = n;
  state.atomState.l = l;
  state.atomState.m = 0;
  if (state.atomViewer) state.atomViewer.setSubshell(n, l);
  const el = state.byZ.get(state.currentZ);
  if (el) renderAtomControls(el);
}

function atomSetM(m) {
  state.atomState.m = m;
  state.atomState.mode = "orbital";
  if (state.atomViewer) {
    state.atomViewer.setM(m);
    state.atomViewer.setMode("orbital");
  }
  const el = state.byZ.get(state.currentZ);
  if (el) renderAtomControls(el);
}

function atomSetSpeed(value) {
  state.atomState.speed = Number(value) || 1;
  if (state.atomViewer) state.atomViewer.setSpeed(state.atomState.speed);
}

function atomToggleRotate() {
  state.atomState.autoRotate = !state.atomState.autoRotate;
  if (state.atomViewer) state.atomViewer.toggleAutoRotate(state.atomState.autoRotate);
  const el = state.byZ.get(state.currentZ);
  if (el) renderAtomControls(el);
}

function atomResetView() {
  if (state.atomViewer) state.atomViewer.resetView();
}

function destroyAtomViewer() {
  if (state.atomViewer) {
    try { state.atomViewer.dispose(); } catch (e) {}
    state.atomViewer = null;
  }
}
/* =========================================================================
   Comparison view and quiz engine
   ========================================================================= */

/* ------------------------------- compare ------------------------------- */

function initCompareSelects() {
  const a = $id("compare-select-a");
  const b = $id("compare-select-b");
  if (!a || !b) return;
  [a, b].forEach((select) => {
    select.innerHTML = state.elements.map((el) =>
      '<option value="' + el.z + '">' + el.z + " · " + escapeText(el.symbol) + " — " + escapeText(optionText(el)) + "</option>"
    ).join("");
  });
  syncComparePickers();
  renderCompare();
}

function syncComparePickers() {
  const a = $id("compare-select-a");
  const b = $id("compare-select-b");
  if (a) a.value = String(state.compare.a);
  if (b) b.value = String(state.compare.b);
}

function renderCompare() {
  const wrap = $id("compare-result");
  if (!wrap) return;
  const elA = state.byZ.get(Number(state.compare.a));
  const elB = state.byZ.get(Number(state.compare.b));
  if (!elA || !elB) {
    wrap.innerHTML = '<div class="compare-empty">' + escapeText(t("compare.selectPrompt")) + "</div>";
    return;
  }
  if (elA.z === elB.z) {
    wrap.innerHTML = '<div class="compare-empty">' + escapeText(X("compareSameElement")) + "</div>";
    return;
  }

  const card = (el) =>
    '<button type="button" class="compare-card cat-' + (el.category || "unknown") + '" data-z="' + el.z + '" style="text-align:left;width:100%;color:var(--text)">' +
      '<div class="cc-top"><span class="cc-symbol">' + escapeText(el.symbol) + '</span><span class="cc-z">#' + el.z + "</span></div>" +
      "<h3>" + escapeText(optionText(el)) + "</h3>" +
      '<div class="cc-meta">' + escapeText(categoryName(el.category)) + " · " + escapeText(phaseName(el.phase)) + " · " + escapeText(t("period")) + " " + el.period + "</div>" +
      '<div class="cc-chips">' +
        '<span class="chip"><strong>' + escapeText(formatMass(el.mass)) + "</strong> " + escapeText(X("massUnit")) + "</span>" +
        '<span class="chip">' + escapeText(t("labels.electronegativity")) + ": <strong>" + escapeText(fmt(el.electronegativity, 3)) + "</strong></span>" +
        '<span class="chip">' + escapeText(discoveryLabel(el)) + "</span>" +
      "</div>" +
    "</button>";

  const valueOf = (el, key) => {
    if (key === "ionization") return el.ionizationEnergies && el.ionizationEnergies.length ? el.ionizationEnergies[0] : null;
    if (key === "abundance") return el.abundance ? el.abundance.crust : null;
    if (key === "discovery") return discoveryNumeric(el);
    return el[key];
  };
  const formatOf = (key, value) => {
    if (value === null || value === undefined) return "—";
    if (key === "mass") return formatMass(value) + " " + X("massUnit");
    if (key === "density") return formatDensity(value);
    if (key === "melting" || key === "boiling") return formatTemp(value);
    if (key === "radius") return fmt(value, 4) + " pm";
    if (key === "ionization") return fmt(value, 4) + " eV";
    if (key === "abundance") return formatAbundance(value).text;
    if (key === "discovery") return modeValueLabel(value, "discovery");
    return fmt(value, 3);
  };
  const rows = [
    { key: "mass", label: t("labels.atomicMass") },
    { key: "electronegativity", label: t("labels.electronegativity") },
    { key: "radius", label: t("labels.atomicRadius") },
    { key: "ionization", label: t("labels.firstIonization") },
    { key: "melting", label: t("labels.meltingPoint") },
    { key: "boiling", label: t("labels.boilingPoint") },
    { key: "density", label: t("labels.density") },
    { key: "abundance", label: t("abundance.crust") },
    { key: "discovery", label: t("labels.discovery") }
  ];

  const rowsHTML = rows.map((row) => {
    const av = valueOf(elA, row.key);
    const bv = valueOf(elB, row.key);
    const aNum = Number(av);
    const bNum = Number(bv);
    const max = Math.max(Math.abs(aNum) || 0, Math.abs(bNum) || 0, 1);
    const aWidth = Number.isFinite(aNum) && av !== null ? Math.max(3, Math.min(100, (Math.abs(aNum) / max) * 100)) : 0;
    const bWidth = Number.isFinite(bNum) && bv !== null ? Math.max(3, Math.min(100, (Math.abs(bNum) / max) * 100)) : 0;
    const aWin = av !== null && bv !== null && aNum > bNum;
    const bWin = av !== null && bv !== null && bNum > aNum;
    return (
      '<div class="compare-row">' +
        '<div class="cr-val left' + (aWin ? " is-winner" : "") + '"><strong>' + formatOf(row.key, av) + '</strong><span class="cr-bar"><i style="width:' + aWidth + '%"></i></span></div>' +
        '<div class="cr-label">' + escapeText(row.label) + "</div>" +
        '<div class="cr-val right' + (bWin ? " is-winner" : "") + '"><strong>' + formatOf(row.key, bv) + '</strong><span class="cr-bar"><i style="width:' + bWidth + '%"></i></span></div>' +
      "</div>"
    );
  }).join("");

  const insights = [];
  if (elA.category === elB.category) insights.push(t("compare.sameCategory"));
  else insights.push(t("compare.differentCategory"));
  if (elA.period === elB.period) insights.push(t("compare.samePeriod"));
  if (elA.group === elB.group && elA.category !== "lanthanide" && elA.category !== "actinide") insights.push(t("compare.sameGroup"));

  const enA = Number(elA.electronegativity);
  const enB = Number(elB.electronegativity);
  if (Number.isFinite(enA) && Number.isFinite(enB) && enA !== enB) {
    const higher = enA > enB ? elA : elB;
    const lower = enA > enB ? elB : elA;
    insights.push(xf(X("compareHigher"), {
      label: t("labels.electronegativity"),
      a: escapeText(optionText(higher)),
      av: fmt(enA > enB ? enA : enB, 3),
      b: escapeText(optionText(lower)),
      bv: fmt(enA > enB ? enB : enA, 3)
    }));
  }
  const radiusA = Number(elA.atomicRadius);
  const radiusB = Number(elB.atomicRadius);
  if (Number.isFinite(radiusA) && Number.isFinite(radiusB) && radiusA !== radiusB) {
    const larger = radiusA > radiusB ? elA : elB;
    const smaller = radiusA > radiusB ? elB : elA;
    insights.push(xf(X("compareHigher"), {
      label: t("labels.atomicRadius"),
      a: escapeText(optionText(larger)),
      av: fmt(radiusA > radiusB ? radiusA : radiusB, 4) + " pm",
      b: escapeText(optionText(smaller)),
      bv: fmt(radiusA > radiusB ? radiusB : radiusA, 4) + " pm"
    }));
  }

  wrap.innerHTML =
    '<div class="compare-grid">' + card(elA) + '<div class="compare-vs"><span>' + escapeText(t("compare.vs")) + "</span></div>" + card(elB) + "</div>" +
    '<div class="compare-table">' + rowsHTML + "</div>" +
    '<div class="compare-insight">' + insights.map((line) => "<p>" + line + "</p>").join("") +
      '<p class="muted" style="margin-top:6px">' + escapeText(t("compare.tip")) + "</p>" +
    "</div>";
}

/* ------------------------------- quiz ------------------------------- */

function renderQuiz() {
  const card = $id("quiz-card");
  if (!card) return;
  if (state.quiz.finished) card.innerHTML = renderQuizResult();
  else if (!state.quiz.active) card.innerHTML = renderQuizIdle();
  else card.innerHTML = renderQuizQuestion();
  updateQuizMeta();
}

function renderQuizIdle() {
  return (
    '<div class="quiz-empty">' +
      '<div class="qe-icon"><svg class="icon"><use href="#i-quiz"/></svg></div>' +
      "<h3>" + escapeText(t("quiz.title")) + "</h3>" +
      "<p>" + escapeText(t("quiz.subtitle")) + "</p>" +
      '<button class="btn btn-primary" type="button" data-quiz-action="start"><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("quiz.start")) + "</button>" +
    "</div>"
  );
}

function renderQuizQuestion() {
  const quiz = state.quiz;
  const q = quiz.questions[quiz.index];
  if (!q) return renderQuizIdle();
  const selected = quiz.selected;
  const progress = Math.round(((quiz.index + 1) / quiz.questions.length) * 100);
  const prompt = q.promptSymbol
    ? '<div class="quiz-prompt-symbol">' + escapeText(q.promptSymbol) + "</div>"
    : q.promptBox
      ? '<div class="quiz-prompt-symbol" style="font-size:18px;height:auto;min-height:54px;padding:8px 14px;line-height:1.4">' + q.promptBox + "</div>"
      : "";

  const options = q.options.map((el, index) => {
    let cls = "quiz-option";
    if (selected !== null) {
      if (index === q.correct) cls += " is-correct";
      else if (index === selected) cls += " is-wrong";
    }
    const label = q.optionKind === "symbol" ? el.symbol : optionText(el);
    return (
      '<button type="button" class="' + cls + '" data-quiz-index="' + index + '"' + (selected !== null ? " disabled" : "") + ">" +
        '<span class="qo-key">' + "ABCD"[index] + "</span><span>" + escapeText(label) + "</span>" +
      "</button>"
    );
  }).join("");

  const correct = selected !== null && selected === q.correct;
  const feedback = selected !== null
    ? '<div class="quiz-feedback">' +
        '<div class="qf-head ' + (correct ? "good" : "bad") + '">' +
          '<svg class="icon"><use href="' + (correct ? "#i-check" : "#i-close") + '"/></svg>' +
          escapeText(correct ? t("quiz.correct") : t("quiz.wrong")) +
        "</div>" +
        '<p class="qf-text">' + q.explanation + "</p>" +
        '<button class="btn btn-primary quiz-next" type="button" data-quiz-action="next">' +
          escapeText(quiz.index + 1 >= quiz.questions.length ? t("quiz.finish") : t("quiz.next")) +
          '<svg class="icon"><use href="#i-right"/></svg>' +
        "</button>" +
      "</div>"
    : "";

  return (
    '<div class="quiz-progress">' +
      '<span class="qp-label">' + escapeText(t("quiz.question")) + " " + (quiz.index + 1) + " " + escapeText(t("quiz.of")) + " " + quiz.questions.length + "</span>" +
      '<span class="qp-bar"><i style="width:' + progress + '%"></i></span>' +
      '<span class="qp-score">' + escapeText(t("quiz.score")) + ": " + quiz.score + "</span>" +
    "</div>" +
    '<div class="quiz-body">' +
      '<div class="quiz-type">' + escapeText(X("typeNames")[q.type] || t("quiz.choose")) + "</div>" +
      prompt +
      '<div class="quiz-question">' + q.title + "</div>" +
      '<div class="quiz-options">' + options + "</div>" +
      feedback +
    "</div>"
  );
}

function renderQuizResult() {
  const quiz = state.quiz;
  const total = quiz.questions.length || 10;
  const pct = Math.round((quiz.score / total) * 100);
  const messageKey = pct === 100 ? "perfect" : pct >= 80 ? "great" : pct >= 50 ? "good" : "keep";
  const message = t("quiz.messages." + messageKey);
  const rows = quiz.answers.map((answer) => {
    const q = answer.question;
    const good = answer.selected === q.correct;
    const correctLabel = q.optionKind === "symbol" ? q.options[q.correct].symbol : optionText(q.options[q.correct]);
    const yourLabel = answer.selected !== null && answer.selected !== undefined
      ? (q.optionKind === "symbol" ? q.options[answer.selected].symbol : optionText(q.options[answer.selected]))
      : "—";
    return (
      '<div class="review-row ' + (good ? "is-good" : "is-bad") + '">' +
        '<span class="rr-icon">' + (good ? "✓" : "✕") + "</span>" +
        "<div><strong>" + escapeText(q.short) + "</strong><small>" +
          escapeText(t("quiz.correctAnswer")) + ": " + escapeText(correctLabel) +
          (good ? "" : " · " + escapeText(t("quiz.yourAnswer")) + ": " + escapeText(yourLabel)) +
        "</small></div>" +
      "</div>"
    );
  }).join("");

  return (
    '<div class="quiz-result">' +
      '<div class="result-ring" style="--p:' + pct + '"><div><strong>' + quiz.score + "/" + total + '</strong><span>' + escapeText(t("quiz.correct")) + "</span></div></div>" +
      "<h3>" + escapeText(quiz.newRecord ? t("quiz.highScore") : t("quiz.resultsTitle")) + "</h3>" +
      "<p>" + escapeText(xf(t("quiz.resultsText"), { score: quiz.score, total, message })) + "</p>" +
      '<div class="result-actions">' +
        '<button class="btn btn-primary" type="button" data-quiz-action="restart"><svg class="icon"><use href="#i-reset"/></svg>' + escapeText(t("quiz.playAgain")) + "</button>" +
        '<button class="btn btn-ghost" type="button" data-quiz-action="quit">' + escapeText(t("quiz.quit")) + "</button>" +
      "</div>" +
      (rows ? '<div class="quiz-review">' + rows + "</div>" : "") +
    "</div>"
  );
}

function updateQuizMeta() {
  const best = state.quiz.best[state.quiz.level] || 0;
  const bestEl = $id("quiz-best");
  const streakEl = $id("quiz-streak");
  const scoreEl = $id("quiz-score");
  if (bestEl) bestEl.textContent = best ? best + "/10" : "—";
  if (streakEl) streakEl.textContent = String(state.quiz.streak);
  if (scoreEl) scoreEl.textContent = String(state.quiz.score);
  $$("#quiz-levels button").forEach((button) => {
    const active = button.dataset.level === state.quiz.level;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = state.quiz.active;
  });
}

function setQuizLevel(level) {
  if (!["easy", "medium", "hard"].includes(level) || state.quiz.active) return;
  state.quiz.level = level;
  state.quiz.active = false;
  state.quiz.finished = false;
  state.quiz.answers = [];
  state.quiz.score = 0;
  state.quiz.streak = 0;
  renderQuiz();
}

function startQuiz() {
  const quiz = state.quiz;
  quiz.active = true;
  quiz.finished = false;
  quiz.index = 0;
  quiz.selected = null;
  quiz.answers = [];
  quiz.score = 0;
  quiz.streak = 0;
  quiz.newRecord = false;
  quiz.questions = buildQuiz(quiz.level);
  renderQuiz();
}

function buildQuiz(level) {
  const questions = [];
  let attempts = 0;
  while (questions.length < 10 && attempts < 300) {
    attempts++;
    const question = makeQuizQuestion(level);
    if (question) questions.push(question);
  }
  while (questions.length < 10 && questions.length > 0) {
    questions.push(questions[questions.length % questions.length]);
  }
  return questions.slice(0, 10);
}

function quizOptions(correct, pool, optionKind) {
  const others = sample(pool.filter((el) => el.z !== correct.z), 3);
  const options = sample([correct].concat(others), 4);
  return {
    options,
    correct: options.findIndex((el) => el.z === correct.z),
    optionKind: optionKind || "name"
  };
}

function nameStrong(el) {
  return "<strong>" + escapeText(optionText(el)) + " (" + el.symbol + ")</strong>";
}

function makeQuizQuestion(level) {
  const pool = level === "easy" ? state.elements.filter((el) => el.z <= 36) : state.elements;
  const easyTypes = ["symbolToName", "nameToSymbol", "numberToName", "phase", "category"];
  const mediumTypes = ["symbolToName", "nameToSymbol", "numberToName", "phase", "category", "position", "config", "highest", "lowest"];
  const hardTypes = ["symbolToName", "nameToSymbol", "numberToName", "category", "position", "config", "highest", "lowest", "isotope", "phase"];
  const type = randomOf(level === "easy" ? easyTypes : level === "hard" ? hardTypes : mediumTypes);

  if (type === "symbolToName") {
    const correct = randomOf(pool);
    const built = quizOptions(correct, pool);
    return {
      type, options: built.options, correct: built.correct, optionKind: "name",
      promptSymbol: correct.symbol,
      title: escapeText(t("quiz.types.symbolToName")),
      explanation: xf(X("explainBasic"), { name: escapeText(optionText(correct)), symbol: correct.symbol, z: correct.z, category: escapeText(categoryName(correct.category)) }),
      short: "Sembol: " + correct.symbol
    };
  }

  if (type === "nameToSymbol") {
    const correct = randomOf(pool);
    const built = quizOptions(correct, pool, "symbol");
    return {
      type, options: built.options, correct: built.correct, optionKind: "symbol",
      promptBox: escapeText(optionText(correct)),
      title: escapeText(t("quiz.types.nameToSymbol")),
      explanation: xf(X("explainSymbol"), { symbol: correct.symbol, name: escapeText(optionText(correct)) }),
      short: optionText(correct)
    };
  }

  if (type === "numberToName") {
    const correct = randomOf(pool);
    const built = quizOptions(correct, pool);
    return {
      type, options: built.options, correct: built.correct, optionKind: "name",
      title: escapeText(t("quiz.types.numberToName", { n: correct.z })),
      explanation: xf(X("explainBasic"), { name: escapeText(optionText(correct)), symbol: correct.symbol, z: correct.z, category: escapeText(categoryName(correct.category)) }),
      short: "Z = " + correct.z
    };
  }

  if (type === "category") {
    const categories = CATEGORY_ORDER.filter((cat) => state.elements.filter((el) => el.category === cat).length >= 4);
    const category = randomOf(categories);
    const members = state.elements.filter((el) => el.category === category);
    const correct = randomOf(members);
    const others = sample(state.elements.filter((el) => el.category !== category), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types.category", { category: categoryName(category) })),
      explanation: xf(X("explainCategory"), { name: escapeText(optionText(correct)), symbol: correct.symbol, category: escapeText(categoryName(category)) }),
      short: t("labels.category") + ": " + categoryName(category)
    };
  }

  if (type === "phase") {
    const phases = STATE_ORDER.filter((phase) => state.elements.filter((el) => (el.phase || "unknown") === phase).length >= 4);
    const phase = randomOf(phases);
    const members = state.elements.filter((el) => (el.phase || "unknown") === phase);
    const correct = randomOf(members);
    const others = sample(state.elements.filter((el) => (el.phase || "unknown") !== phase), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types.phase", { phase: phaseName(phase) })),
      explanation: xf(X("explainPhase"), { name: escapeText(optionText(correct)), phase: escapeText(phaseName(phase)) }),
      short: t("labels.phase") + ": " + phaseName(phase)
    };
  }

  if (type === "position") {
    const candidates = pool.filter((el) => el.group && el.category !== "lanthanide" && el.category !== "actinide");
    const correct = randomOf(candidates);
    const others = sample(state.elements.filter((el) => el.z !== correct.z), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types.position", { period: correct.period, group: correct.group })),
      explanation: xf(X("explainPosition"), { name: escapeText(optionText(correct)), symbol: correct.symbol, period: correct.period, group: correct.group }),
      short: t("period") + " " + correct.period + " · " + t("group") + " " + correct.group
    };
  }

  if (type === "config") {
    const candidates = pool.filter((el) => el.electronConfig);
    const correct = randomOf(candidates);
    const others = sample(state.elements.filter((el) => el.z !== correct.z), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      promptBox: escapeText(correct.electronConfig),
      title: escapeText(t("quiz.types.config")),
      explanation: xf(X("explainConfig"), { config: escapeText(correct.electronConfig) }),
      short: correct.electronConfig
    };
  }

  if (type === "highest" || type === "lowest") {
    const props = ["electronegativity", "melting", "atomicRadius", "ionization"];
    const prop = randomOf(props);
    const getter = (el) => prop === "ionization"
      ? (el.ionizationEnergies && el.ionizationEnergies.length ? el.ionizationEnergies[0] : null)
      : el[prop];
    let candidates = pool.filter((el) => getter(el) !== null && getter(el) !== undefined && Number.isFinite(Number(getter(el))));
    let four = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const trial = sample(candidates, 4);
      const vals = trial.map((el) => Number(getter(el)));
      if (new Set(vals).size === 4) { four = trial; break; }
    }
    if (!four) return null;
    const sorted = four.slice().sort((a, b) => Number(getter(a)) - Number(getter(b)));
    const correct = type === "highest" ? sorted[sorted.length - 1] : sorted[0];
    const options = sample(four, 4);
    const propertyLabel = prop === "ionization" ? t("labels.firstIonization") : t("labels." + prop);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types." + type, { property: propertyLabel })),
      explanation: xf(X("explainProperty"), {
        property: escapeText(propertyLabel),
        list: options.map((el) => "<strong>" + escapeText(el.symbol) + "</strong> " + fmt(getter(el), 3)).join(", ")
      }),
      short: X("typeNames." + type) + ": " + propertyLabel
    };
  }

  if (type === "isotope") {
    const candidates = pool.filter((el) => el.isotopes && el.isotopes.length);
    if (!candidates.length) return null;
    const correct = randomOf(candidates);
    const isotope = randomOf(correct.isotopes);
    const neutrons = isotope.massNumber - correct.z;
    if (neutrons < 0) return null;
    const others = sample(state.elements.filter((el) => el.z !== correct.z), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      promptBox: "A = " + isotope.massNumber + " · N = " + neutrons,
      title: escapeText(t("quiz.types.isotope")),
      explanation: xf(X("explainIsotope"), { n: neutrons, a: isotope.massNumber, z: correct.z, name: escapeText(optionText(correct)), symbol: correct.symbol }),
      short: "A = " + isotope.massNumber + " · N = " + neutrons
    };
  }

  return null;
}

function answerQuiz(index) {
  const quiz = state.quiz;
  if (!quiz.active || quiz.selected !== null) return;
  const question = quiz.questions[quiz.index];
  if (!question || !question.options[index]) return;
  quiz.selected = index;
  const correct = index === question.correct;
  if (correct) {
    quiz.score++;
    quiz.streak++;
  } else {
    quiz.streak = 0;
  }
  quiz.answers.push({ question, selected: index, correct });
  renderQuiz();
  const next = $('[data-quiz-action="next"]');
  if (next) next.focus({ preventScroll: true });
}

function nextQuizQuestion() {
  const quiz = state.quiz;
  if (!quiz.active || quiz.selected === null) return;
  if (quiz.index + 1 >= quiz.questions.length) {
    finishQuiz();
    return;
  }
  quiz.index++;
  quiz.selected = null;
  renderQuiz();
}

function finishQuiz() {
  const quiz = state.quiz;
  quiz.active = false;
  quiz.finished = true;
  const best = quiz.best[quiz.level] || 0;
  if (quiz.score > best) {
    quiz.best[quiz.level] = quiz.score;
    quiz.newRecord = true;
    saveBest();
  }
  renderQuiz();
}

function quitQuiz() {
  state.quiz.active = false;
  state.quiz.finished = false;
  state.quiz.answers = [];
  state.quiz.score = 0;
  state.quiz.streak = 0;
  renderQuiz();
}
/* =========================================================================
   Events, language switching, view routing, hero scene, boot
   ========================================================================= */

let toastTimer = 0;

function toast(message) {
  const el = $id("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1900);
}

function setView(name, scroll) {
  if (!["explore", "quiz", "compare", "lab"].includes(name)) return;
  state.view = name;
  $$(".view").forEach((view) => view.classList.toggle("hidden", view.id !== name + "-view"));
  $$("[data-view]").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  if (name === "lab") {
    if (window.Lab118) window.Lab118.enter();
  } else if (window.Lab118) {
    window.Lab118.leave();
  }
  if (name === "quiz") renderQuiz();
  if (name === "compare") {
    syncComparePickers();
    renderCompare();
  }
  if (name === "explore" && state.heroScene && state.heroScene.resize) {
    try { state.heroScene.resize(); } catch (e) {}
  }
  if (scroll !== false) {
    try { window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, 0); }
  }
  const targetHash = name === "explore" ? "" : "#" + name;
  if (location.hash !== targetHash) {
    try {
      history.replaceState(null, "", targetHash || location.pathname + location.search);
    } catch (e) {}
  }
}

function updateLangButtons() {
  $$("[data-lang]").forEach((button) => {
    const active = button.dataset.lang === state.lang;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyStaticLanguage() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === "tr"
    ? "Periyodik Tablo — İnteraktif Element Simülasyonu"
    : "Periodic Table — Interactive Element Simulation";

  $$("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    const value = t(key);
    if (value !== key) node.textContent = value;
  });
  $$("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    const value = t(key);
    if (value !== key) node.setAttribute("placeholder", value);
  });

  const skip = $(".skip-link");
  if (skip) skip.textContent = X("skip");
  const mainNav = $(".main-nav");
  if (mainNav) mainNav.setAttribute("aria-label", X("ariaMainNav"));
  const mobileNav = $(".mobile-nav");
  if (mobileNav) mobileNav.setAttribute("aria-label", X("ariaMobileNav"));
  const searchResults = $id("search-results");
  if (searchResults) searchResults.setAttribute("aria-label", X("ariaSearchResults"));
  const ptable = $id("ptable");
  if (ptable) ptable.setAttribute("aria-label", X("ariaTable"));
  const colorMode = $id("color-mode");
  if (colorMode) colorMode.setAttribute("aria-label", X("ariaColorMode"));
  const searchToggle = $id("search-toggle");
  if (searchToggle) searchToggle.setAttribute("aria-label", t("searchShort"));
  const searchInput = $id("search-input");
  if (searchInput) searchInput.setAttribute("aria-label", t("searchShort"));
  const zoom = $(".zoom-controls");
  if (zoom) zoom.setAttribute("aria-label", X("ariaZoom"));
  const zoomIn = $id("zoom-in");
  if (zoomIn) zoomIn.setAttribute("aria-label", X("zoomIn"));
  const zoomOut = $id("zoom-out");
  if (zoomOut) zoomOut.setAttribute("aria-label", X("zoomOut"));
  const zoomReset = $id("zoom-reset");
  if (zoomReset) zoomReset.setAttribute("aria-label", X("zoomReset"));
  const quizLevels = $id("quiz-levels");
  if (quizLevels) quizLevels.setAttribute("aria-label", X("ariaLevels"));
  const compareA = $id("compare-select-a");
  if (compareA) compareA.setAttribute("aria-label", X("ariaElementA"));
  const compareB = $id("compare-select-b");
  if (compareB) compareB.setAttribute("aria-label", X("ariaElementB"));
  const swap = $id("compare-swap");
  if (swap) swap.setAttribute("aria-label", X("ariaSwap"));
  const trendFoot = $(".trend-foot p");
  if (trendFoot) trendFoot.textContent = X("trendFoot");
  const trendsOk = $id("trends-ok");
  if (trendsOk) trendsOk.textContent = state.lang === "tr" ? "Anladım" : "Got it";
  const trendsClose = $id("trends-close");
  if (trendsClose) trendsClose.setAttribute("aria-label", t("close"));
  const listLabel = $("#list-toggle span");
  if (listLabel) listLabel.textContent = state.listView ? X("tableView") : X("listView");
  updateLangButtons();
}

function changeLanguage(lang) {
  if ((lang !== "tr" && lang !== "en") || lang === state.lang) return;
  state.lang = lang;
  if (window.setLang) window.setLang(lang);
  applyStaticLanguage();
  initTable();
  initCompareSelects();
  renderQuiz();
  setListView(state.listView);
  if (state.query) renderSearchResults();
  if (state.currentZ) {
    destroyAtomViewer();
    renderElementModal();
  }
  if (window.Lab118) window.Lab118.setLang(state.lang);
}

function showLoadError() {
  const ptable = $id("ptable");
  if (ptable) ptable.innerHTML = '<div class="empty-note" style="grid-column:1/-1">' + escapeText(t("loadError")) + "</div>";
  toast(t("loadError"));
}

function loadData() {
  if (window.PERIODIC_DATA && Array.isArray(window.PERIODIC_DATA.elements)) {
    return Promise.resolve(window.PERIODIC_DATA);
  }
  return fetch("assets/data/elements.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .catch(() => null);
}

function openTrends() {
  const modal = $id("trends-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  const close = $id("trends-close");
  if (close) close.focus({ preventScroll: true });
}

function closeTrends() {
  const modal = $id("trends-modal");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("hidden");
  if (!state.currentZ) document.body.classList.remove("modal-open");
}

function hideSearchResults() {
  const wrap = $id("search-results");
  if (wrap) wrap.classList.add("hidden");
  state.searchIndex = -1;
}

function openSearch() {
  const wrap = $id("search-wrap");
  const input = $id("search-input");
  if (!wrap || !input) return;
  wrap.classList.add("is-expanded");
  const toggle = $id("search-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  input.focus();
  input.select();
}

function selectSearchResult(z) {
  const input = $id("search-input");
  if (input) input.value = "";
  state.query = "";
  state.searchIndex = -1;
  applyFilter();
  renderElementList();
  hideSearchResults();
  const wrap = $id("search-wrap");
  if (wrap) wrap.classList.remove("is-expanded");
  const toggle = $id("search-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
  openElement(z);
}

function bindEvents() {
  if (state.eventsBound) return;
  state.eventsBound = true;

  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  const brand = $id("brand");
  if (brand) {
    brand.addEventListener("click", (event) => {
      event.preventDefault();
      setView("explore");
      window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    });
  }
  const heroExplore = $id("hero-explore");
  if (heroExplore) heroExplore.addEventListener("click", () => {
    const section = $(".table-section");
    if (section) section.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  });
  const heroQuiz = $id("hero-quiz");
  if (heroQuiz) heroQuiz.addEventListener("click", () => setView("quiz"));
  const heroLab = $id("hero-lab");
  if (heroLab) heroLab.addEventListener("click", () => setView("lab"));

  $$("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => changeLanguage(button.dataset.lang));
  });

  const searchToggle = $id("search-toggle");
  if (searchToggle) {
    searchToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const wrap = $id("search-wrap");
      if (!wrap) return;
      const open = wrap.classList.toggle("is-expanded");
      searchToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        const input = $id("search-input");
        if (input) input.focus();
      } else {
        hideSearchResults();
      }
    });
  }

  const searchInput = $id("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => onSearchInput(searchInput.value));
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) renderSearchResults();
    });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        if (moveSearchSelection(1)) event.preventDefault();
      } else if (event.key === "ArrowUp") {
        if (moveSearchSelection(-1)) event.preventDefault();
      } else if (event.key === "Enter") {
        const buttons = $$(".search-result");
        if (buttons.length) {
          event.preventDefault();
          const pick = state.searchIndex >= 0 ? buttons[state.searchIndex] : buttons[0];
          if (pick) selectSearchResult(Number(pick.dataset.z));
        }
      } else if (event.key === "Escape") {
        hideSearchResults();
        searchInput.blur();
      }
    });
  }

  document.addEventListener("click", (event) => {
    const wrap = $id("search-wrap");
    if (wrap && !wrap.contains(event.target)) hideSearchResults();
  });

  const searchResults = $id("search-results");
  if (searchResults) {
    searchResults.addEventListener("click", (event) => {
      const button = event.target.closest(".search-result");
      if (button) selectSearchResult(Number(button.dataset.z));
    });
  }

  const colorMode = $id("color-mode");
  if (colorMode) {
    colorMode.addEventListener("change", () => {
      state.colorMode = colorMode.value;
      applyTableMode();
      applyFilter();
    });
  }

  const legend = $id("legend");
  if (legend) {
    legend.addEventListener("click", (event) => {
      const chip = event.target.closest(".legend-chip");
      if (chip && chip.dataset.filterType) setFilter(chip.dataset.filterType, chip.dataset.filterValue);
    });
  }

  const clearFilterBtn = $id("clear-filter");
  if (clearFilterBtn) clearFilterBtn.addEventListener("click", clearFilter);

  const listToggle = $id("list-toggle");
  if (listToggle) listToggle.addEventListener("click", () => setListView());

  const zoomIn = $id("zoom-in");
  if (zoomIn) zoomIn.addEventListener("click", () => zoomBy(8));
  const zoomOut = $id("zoom-out");
  if (zoomOut) zoomOut.addEventListener("click", () => zoomBy(-8));
  const zoomReset = $id("zoom-reset");
  if (zoomReset) zoomReset.addEventListener("click", resetZoom);

  const ptable = $id("ptable");
  if (ptable) {
    ptable.addEventListener("click", (event) => {
      const placeholder = event.target.closest(".f-placeholder");
      if (placeholder) {
        setFilter("category", placeholder.dataset.filterCat);
        return;
      }
      const cell = event.target.closest(".el");
      if (cell) openElement(Number(cell.dataset.z));
    });
  }

  const list = $id("element-list");
  if (list) {
    list.addEventListener("click", (event) => {
      const card = event.target.closest(".el-card");
      if (card) openElement(Number(card.dataset.z));
    });
  }

  const trendsBtn = $id("trends-btn");
  if (trendsBtn) trendsBtn.addEventListener("click", openTrends);
  const trendsClose = $id("trends-close");
  if (trendsClose) trendsClose.addEventListener("click", closeTrends);
  const trendsOk = $id("trends-ok");
  if (trendsOk) trendsOk.addEventListener("click", closeTrends);
  const trendsModal = $id("trends-modal");
  if (trendsModal) {
    trendsModal.addEventListener("click", (event) => {
      if (event.target === trendsModal) closeTrends();
    });
  }

  const modalRoot = $id("modal-root");
  if (modalRoot) {
    modalRoot.addEventListener("click", (event) => {
      if (event.target.classList.contains("overlay")) {
        closeElement();
        return;
      }
      const action = event.target.closest("[data-action]");
      if (action) {
        const name = action.dataset.action;
        if (name === "close") closeElement();
        else if (name === "prev") navigateElement(-1);
        else if (name === "next") navigateElement(1);
        else if (name === "copy") copyElementLink();
        else if (name === "compare") compareElement(state.currentZ);
        else if (name === "lab") sendElementToLab(state.currentZ);
        return;
      }
      const tab = event.target.closest("[data-tab]");
      if (tab) {
        switchElementTab(tab.dataset.tab);
        return;
      }
      const mode = event.target.closest("[data-atom-mode]");
      if (mode) {
        atomSetMode(mode.dataset.atomMode);
        return;
      }
      const subshell = event.target.closest("[data-subshell-n]");
      if (subshell) {
        atomSetSubshell(Number(subshell.dataset.subshellN), Number(subshell.dataset.subshellL));
        return;
      }
      const orbital = event.target.closest("[data-orbital-m]");
      if (orbital) {
        atomSetM(Number(orbital.dataset.orbitalM));
        return;
      }
      const atomAction = event.target.closest("[data-atom-action]");
      if (atomAction) {
        if (atomAction.dataset.atomAction === "rotate") atomToggleRotate();
        else if (atomAction.dataset.atomAction === "reset") atomResetView();
        return;
      }
      const neighbor = event.target.closest(".neighbor-chip[data-z]");
      if (neighbor) {
        openElement(Number(neighbor.dataset.z));
        return;
      }
    });
    modalRoot.addEventListener("input", (event) => {
      if (event.target && event.target.id === "atom-speed") atomSetSpeed(event.target.value);
    });
  }

  const compareA = $id("compare-select-a");
  const compareB = $id("compare-select-b");
  if (compareA) {
    compareA.addEventListener("change", () => {
      state.compare.a = Number(compareA.value);
      renderCompare();
    });
  }
  if (compareB) {
    compareB.addEventListener("change", () => {
      state.compare.b = Number(compareB.value);
      renderCompare();
    });
  }
  const swap = $id("compare-swap");
  if (swap) {
    swap.addEventListener("click", () => {
      const a = state.compare.a;
      state.compare.a = state.compare.b;
      state.compare.b = a;
      syncComparePickers();
      renderCompare();
    });
  }
  const compareResult = $id("compare-result");
  if (compareResult) {
    compareResult.addEventListener("click", (event) => {
      const card = event.target.closest(".compare-card[data-z]");
      if (card) openElement(Number(card.dataset.z));
    });
  }

  const quizLevels = $id("quiz-levels");
  if (quizLevels) {
    quizLevels.addEventListener("click", (event) => {
      const button = event.target.closest("[data-level]");
      if (button) setQuizLevel(button.dataset.level);
    });
  }
  const quizStart = $id("quiz-start");
  if (quizStart) quizStart.addEventListener("click", startQuiz);
  const quizCard = $id("quiz-card");
  if (quizCard) {
    quizCard.addEventListener("click", (event) => {
      const option = event.target.closest("[data-quiz-index]");
      if (option) {
        answerQuiz(Number(option.dataset.quizIndex));
        return;
      }
      const action = event.target.closest("[data-quiz-action]");
      if (!action) return;
      if (action.dataset.quizAction === "start" || action.dataset.quizAction === "restart") startQuiz();
      else if (action.dataset.quizAction === "next") nextQuizQuestion();
      else if (action.dataset.quizAction === "quit") quitQuiz();
    });
  }

  window.addEventListener("scroll", () => {
    const header = $id("site-header");
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }, { passive: true });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 760 && state.listView) setListView(false);
    }, 140);
  });

  window.addEventListener("hashchange", handleHash);

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
    const typing = tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;

    if (event.key === "Escape") {
      const results = $id("search-results");
      if (results && !results.classList.contains("hidden")) {
        hideSearchResults();
        return;
      }
      if (state.currentZ) {
        closeElement();
        return;
      }
      const trends = $id("trends-modal");
      if (trends && !trends.classList.contains("hidden")) {
        closeTrends();
        return;
      }
    }

    if (typing) return;

    if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
      if (state.currentZ) return;
      event.preventDefault();
      openSearch();
      return;
    }

    if (state.currentZ && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      navigateElement(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }

    if (state.quiz.active && /^[1-4]$/.test(event.key)) {
      event.preventDefault();
      answerQuiz(Number(event.key) - 1);
    }
  });
}

function initHero() {
  const canvas = $id("hero-canvas");
  if (!canvas || !window.THREE || !window.Atom3D || !window.Atom3D.HeroScene || !webglAvailable()) {
    if (canvas) canvas.style.display = "none";
    return;
  }
  try {
    state.heroScene = new window.Atom3D.HeroScene(canvas);
  } catch (error) {
    canvas.style.display = "none";
  }
}

function handleHash() {
  const hash = location.hash || "";
  const match = hash.match(/^#element=(\d+)(?:&tab=([a-z]+))?/);
  if (match) {
    const tab = TABS.includes(match[2]) ? match[2] : "overview";
    openElement(Number(match[1]), { tab });
    return;
  }
  if (state.currentZ) {
    closeElement();
    return;
  }
  if (hash === "#quiz") setView("quiz", false);
  else if (hash === "#compare") setView("compare", false);
  else if (hash === "#lab") setView("lab", false);
  else setView("explore", false);
}

function sendElementToLab(z) {
  if (!z) return;
  closeElement();
  if (window.Lab118) {
    window.Lab118.sendElement(Number(z));
    setView("lab");
  } else {
    toast(t("loadError"));
  }
}

function boot() {
  state.lang = window.getLang ? window.getLang() : "tr";
  document.documentElement.lang = state.lang;
  applyStaticLanguage();

  loadData().then((data) => {
    if (!data || !Array.isArray(data.elements)) {
      showLoadError();
      return;
    }
    state.meta = data.meta || null;
    state.elements = data.elements.slice().sort((a, b) => a.z - b.z);
    state.byZ = new Map(state.elements.map((el) => [el.z, el]));

    initTable();
    initCompareSelects();
    renderQuiz();
    bindEvents();
    updateLangButtons();
    initHero();
    handleHash();
  }).catch(() => showLoadError());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
})();
