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
