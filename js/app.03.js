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
