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
      return generic("4" + sym + " + " + (n === 2 ? "3O₂ → 2" + sym + "₂O₃" : "O₂ → 2" + sym + "₂O"),
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
    const massText = gas ? fmt(mass * 1000, 2) + " mg" : fmt(mass, 3) + " g";
    const volText = gas ? fmt(measuredVol, 1) + " mL" : fmt(measuredVol, 2) + " cm³";
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
      equation: below ? "—" : equation,
      equationNote: below
        ? L("Eşik sıcaklığın altında denklem uygulanmaz.", "The equation does not apply below the threshold temperature.")
        : L("Dengeli ana denklem", "Balanced main equation"),
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
    let best = Infinity;
    points.forEach((p) => {
      const d = Math.abs(p.y - target);
      if (d < best) { best = d; current = p; }
    });
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
