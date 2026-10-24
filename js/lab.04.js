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
