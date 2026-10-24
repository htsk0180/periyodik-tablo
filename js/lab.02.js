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
