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
