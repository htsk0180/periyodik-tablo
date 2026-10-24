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
