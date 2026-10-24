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
