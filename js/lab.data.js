/* LAB 118 — experiment data: flame colours, spectral lines, reagents,
   curated reactions, electrochemical series and research cases. */
(function () {
  "use strict";

  const bi = (tr, en) => ({ tr, en });

  const FLAME = {
    1: { mode: "discharge", color: "#ff6b8a", name: bi("pembe-kırmızı", "pink-red"), lines: [656.3], confidence: "literature" },
    2: { mode: "discharge", color: "#fde68a", name: bi("sarı", "yellow"), lines: [587.6, 501.6, 471.3], confidence: "literature" },
    3: { mode: "flame", color: "#ff3b30", name: bi("kırmızı", "crimson"), lines: [670.8, 610.4], confidence: "literature" },
    5: { mode: "flame", color: "#4ade80", name: bi("yeşil", "green"), lines: [518.0], confidence: "indicative" },
    6: { mode: "flame", color: "#fbbf24", name: bi("turuncu kıvılcım", "orange sparks"), lines: [516.5], confidence: "indicative" },
    7: { mode: "discharge", color: "#f9a8d4", name: bi("pembe", "pink"), lines: [500.5, 568.0], confidence: "indicative" },
    8: { mode: "discharge", color: "#93c5fd", name: bi("mavi", "blue"), lines: [777.4, 844.6], confidence: "indicative" },
    9: { mode: "discharge", color: "#fef08a", name: bi("soluk sarı", "pale yellow"), lines: [685.6, 703.7], confidence: "indicative" },
    10: { mode: "discharge", color: "#fb7185", name: bi("turuncu-kırmızı", "orange-red"), lines: [585.2, 640.2, 614.3], confidence: "literature" },
    11: { mode: "flame", color: "#ffd23f", name: bi("altın sarısı", "golden yellow"), lines: [589.0, 589.6], confidence: "literature" },
    12: { mode: "flame", color: "#f8fafc", name: bi("parlak beyaz", "brilliant white"), lines: [383.8, 518.4], confidence: "literature" },
    13: { mode: "flame", color: "#e2e8f0", name: bi("beyaz", "white"), lines: [396.2, 394.4], confidence: "indicative" },
    14: { mode: "flame", color: "#f97316", name: bi("turuncu", "orange"), lines: [634.7, 637.1], confidence: "indicative" },
    15: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [525.0, 542.0], confidence: "indicative" },
    16: { mode: "flame", color: "#60a5fa", name: bi("mavi", "blue"), lines: [469.4, 471.0], confidence: "literature" },
    17: { mode: "discharge", color: "#86efac", name: bi("yeşil", "green"), lines: [452.6, 481.0, 542.3], confidence: "indicative" },
    18: { mode: "discharge", color: "#f87171", name: bi("kırmızı", "red"), lines: [696.5, 706.7, 750.4], confidence: "literature" },
    19: { mode: "flame", color: "#c084fc", name: bi("leylak", "lilac"), lines: [766.5, 769.9], confidence: "literature" },
    20: { mode: "flame", color: "#fb923c", name: bi("turuncu-kırmızı", "orange-red"), lines: [622.0, 553.0], confidence: "literature" },
    22: { mode: "flame", color: "#fbbf24", name: bi("altın", "gold"), lines: [498.2, 517.4], confidence: "indicative" },
    24: { mode: "flame", color: "#4ade80", name: bi("yeşil", "green"), lines: [425.4, 427.5, 429.0], confidence: "indicative" },
    25: { mode: "flame", color: "#a3e635", name: bi("sarı-yeşil", "yellow-green"), lines: [403.1, 403.3, 403.4], confidence: "indicative" },
    26: { mode: "flame", color: "#fbbf24", name: bi("altın kıvılcım", "golden sparks"), lines: [438.4, 527.0, 532.8], confidence: "indicative" },
    27: { mode: "flame", color: "#60a5fa", name: bi("mavi", "blue"), lines: [345.4, 340.5], confidence: "indicative" },
    28: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [341.5, 352.5], confidence: "indicative" },
    29: { mode: "flame", color: "#2dd4bf", name: bi("mavi-yeşil", "blue-green"), lines: [510.6, 515.3, 521.8, 578.2], confidence: "literature" },
    30: { mode: "flame", color: "#5eead4", name: bi("mavi-yeşil", "blue-green"), lines: [468.0, 472.2, 481.1], confidence: "indicative" },
    31: { mode: "flame", color: "#c084fc", name: bi("mor", "violet"), lines: [417.2, 403.3], confidence: "indicative" },
    32: { mode: "flame", color: "#93c5fd", name: bi("mavi-beyaz", "blue-white"), lines: [422.7, 438.9], confidence: "indicative" },
    33: { mode: "flame", color: "#60a5fa", name: bi("mavi", "blue"), lines: [228.8, 234.9], confidence: "indicative" },
    34: { mode: "flame", color: "#3b82f6", name: bi("mavi", "blue"), lines: [530.0, 545.0], confidence: "indicative" },
    35: { mode: "discharge", color: "#fb923c", name: bi("kırmızı-kahve", "red-brown"), lines: [478.5, 470.5], confidence: "indicative" },
    36: { mode: "discharge", color: "#a5b4fc", name: bi("soluk mavi", "pale blue"), lines: [557.0, 587.1], confidence: "literature" },
    37: { mode: "flame", color: "#e879f9", name: bi("kırmızı-mor", "red-violet"), lines: [780.0, 794.8], confidence: "literature" },
    38: { mode: "flame", color: "#f43f5e", name: bi("koyu kırmızı", "crimson"), lines: [606.0, 460.7], confidence: "literature" },
    47: { mode: "flame", color: "#c7d2fe", name: bi("mavi-beyaz", "blue-white"), lines: [328.1, 338.3], confidence: "indicative" },
    53: { mode: "discharge", color: "#c084fc", name: bi("mor", "violet"), lines: [546.5, 576.1], confidence: "indicative" },
    54: { mode: "discharge", color: "#818cf8", name: bi("mavi", "blue"), lines: [467.1, 462.4], confidence: "literature" },
    55: { mode: "flame", color: "#818cf8", name: bi("mavi-mor", "blue-violet"), lines: [852.1, 894.4], confidence: "literature" },
    56: { mode: "flame", color: "#bef264", name: bi("sarı-yeşil", "yellow-green"), lines: [553.5, 455.4], confidence: "literature" },
    57: { mode: "flame", color: "#fbbf24", name: bi("sarı", "yellow"), lines: [624.0, 617.0], confidence: "indicative" },
    58: { mode: "flame", color: "#fde68a", name: bi("sarı", "yellow"), lines: [566.0, 550.0], confidence: "indicative" },
    59: { mode: "flame", color: "#bef264", name: bi("yeşil", "green"), lines: [495.0, 513.0], confidence: "indicative" },
    60: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [492.0, 510.0], confidence: "indicative" },
    62: { mode: "flame", color: "#fbbf24", name: bi("sarı", "yellow"), lines: [560.0, 580.0], confidence: "indicative" },
    63: { mode: "flame", color: "#f87171", name: bi("kırmızı", "red"), lines: [610.0, 620.0], confidence: "indicative" },
    64: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [560.0, 575.0], confidence: "indicative" },
    65: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [550.0, 570.0], confidence: "indicative" },
    66: { mode: "flame", color: "#fde68a", name: bi("sarı", "yellow"), lines: [580.0, 590.0], confidence: "indicative" },
    67: { mode: "flame", color: "#f87171", name: bi("kırmızı", "red"), lines: [620.0, 640.0], confidence: "indicative" },
    68: { mode: "flame", color: "#fbbf24", name: bi("sarı", "yellow"), lines: [550.0, 560.0], confidence: "indicative" },
    69: { mode: "flame", color: "#c084fc", name: bi("mor", "violet"), lines: [580.0, 600.0], confidence: "indicative" },
    70: { mode: "flame", color: "#fde68a", name: bi("sarı", "yellow"), lines: [555.0, 570.0], confidence: "indicative" },
    71: { mode: "flame", color: "#f87171", name: bi("kırmızı", "red"), lines: [600.0, 620.0], confidence: "indicative" },
    72: { mode: "flame", color: "#93c5fd", name: bi("mavi", "blue"), lines: [480.0, 500.0], confidence: "indicative" },
    73: { mode: "flame", color: "#60a5fa", name: bi("mavi", "blue"), lines: [480.0, 500.0], confidence: "indicative" },
    74: { mode: "flame", color: "#bef264", name: bi("yeşil", "green"), lines: [500.0, 520.0], confidence: "indicative" },
    75: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [480.0, 500.0], confidence: "indicative" },
    76: { mode: "flame", color: "#93c5fd", name: bi("mavi", "blue"), lines: [450.0, 470.0], confidence: "indicative" },
    77: { mode: "flame", color: "#60a5fa", name: bi("mavi", "blue"), lines: [450.0, 470.0], confidence: "indicative" },
    78: { mode: "flame", color: "#fde68a", name: bi("sarı", "yellow"), lines: [550.0, 570.0], confidence: "indicative" },
    79: { mode: "flame", color: "#fbbf24", name: bi("altın", "gold"), lines: [267.6, 274.8], confidence: "indicative" },
    80: { mode: "discharge", color: "#34d399", name: bi("yeşil", "green"), lines: [404.7, 435.8, 546.1, 577.0], confidence: "literature" },
    81: { mode: "flame", color: "#bef264", name: bi("yeşil", "green"), lines: [535.0, 377.6], confidence: "indicative" },
    82: { mode: "flame", color: "#c7d2fe", name: bi("mavi-beyaz", "blue-white"), lines: [405.8, 368.3], confidence: "indicative" },
    83: { mode: "flame", color: "#bfdbfe", name: bi("mavi-beyaz", "blue-white"), lines: [306.8, 472.2], confidence: "indicative" },
    86: { mode: "discharge", color: "#f472b6", name: bi("kırmızı", "red"), lines: [745.0, 705.0], confidence: "predicted" },
    92: { mode: "flame", color: "#86efac", name: bi("yeşil", "green"), lines: [424.0, 435.0], confidence: "indicative" }
  };

  const LINES = {
    H: [656.3, 486.1, 434.0, 410.2],
    He: [587.6, 501.6, 471.3, 447.1],
    Li: [670.8, 610.4, 460.3],
    Na: [589.0, 589.6, 568.8, 498.3],
    K: [766.5, 769.9, 404.4],
    Ca: [422.7, 393.4, 396.8, 616.2],
    Sr: [460.7, 407.8, 421.6],
    Ba: [553.5, 455.4, 493.4],
    Cu: [324.8, 327.4, 510.6, 515.3, 521.8, 578.2],
    Fe: [438.4, 527.0, 532.8, 358.1],
    Ne: [585.2, 640.2, 614.3, 703.2],
    Ar: [696.5, 706.7, 750.4, 811.5],
    Kr: [557.0, 587.1, 760.2],
    Xe: [467.1, 462.4, 823.2],
    Hg: [404.7, 435.8, 546.1, 577.0, 579.1],
    Cd: [228.8, 326.1, 508.6],
    Zn: [213.9, 330.3, 468.0, 472.2, 481.1],
    Mg: [285.2, 383.8, 518.4],
    Al: [396.2, 394.4, 309.3],
    Si: [251.6, 288.2, 390.6],
    P: [525.0, 542.0, 604.3],
    S: [469.4, 471.0, 921.3],
    Cl: [452.6, 481.0, 542.3],
    Br: [478.5, 470.5, 447.8],
    I: [546.5, 576.1, 612.7]
  };

  const POTENTIALS = {
    Li: -3.04, K: -2.93, Rb: -2.93, Cs: -2.92, Ba: -2.90, Sr: -2.89,
    Ca: -2.87, Na: -2.71, Mg: -2.37, Al: -1.66, Mn: -1.18, Zn: -0.76,
    Cr: -0.74, Fe: -0.44, Cd: -0.40, Co: -0.28, Ni: -0.25, Sn: -0.14,
    Pb: -0.13, H: 0, Cu: 0.34, Ag: 0.80, Hg: 0.85, Pt: 1.18, Au: 1.50
  };

  const REAGENTS = [
    {
      id: "H2O", formula: "H₂O", name: bi("Su", "Water"), kind: "aqueous",
      note: bi("25 °C saf su; sulu ortam.", "Pure water at 25 °C; aqueous medium."),
      maxTempC: 100, hazard: false
    },
    {
      id: "O2", formula: "O₂", name: bi("Oksijen", "Oxygen"), kind: "gas",
      note: bi("Hava yerine zenginleştirilmiş O₂ atmosferi.", "Oxygen-enriched atmosphere instead of air."),
      maxTempC: 1200, hazard: false
    },
    {
      id: "HCl", formula: "HCl (1 M)", name: bi("Hidroklorik asit", "Hydrochloric acid"), kind: "aqueous",
      note: bi("1 M sulu HCl; 25 °C.", "1 M aqueous HCl at 25 °C."),
      maxTempC: 100, hazard: true
    },
    {
      id: "Cl2", formula: "Cl₂", name: bi("Klor", "Chlorine"), kind: "gas",
      note: bi("Kuru klor gazı; çeker ocak zorunlu.", "Dry chlorine gas; fume hood required."),
      maxTempC: 400, hazard: true, requiresHood: true
    },
    {
      id: "NaOH", formula: "NaOH (1 M)", name: bi("Sodyum hidroksit", "Sodium hydroxide"), kind: "aqueous",
      note: bi("1 M sulu NaOH; amfoterik metaller için.", "1 M aqueous NaOH; for amphoteric metals."),
      maxTempC: 100, hazard: true
    }
  ];

  const R = (equation, obsTr, obsEn, opts) => Object.assign({
    equation,
    observation: bi(obsTr, obsEn),
    phenomena: [],
    confidence: "literature",
    requiresHood: false,
    minTempC: 0,
    maxTempC: 1200
  }, opts || {});

  const REACTIONS = {
    "1|O2": R("2H₂ + O₂ → 2H₂O", "Kıvılcımla patlama; açık mavi alev ve ısı.", "Explosive with a spark; pale blue flame and heat.", { phenomena: ["flame", "heat", "gas"], color: "#bfdbfe", requiresHood: true }),
    "1|Cl2": R("H₂ + Cl₂ → 2HCl", "Işıkla hızlı tepkime; keskin kokulu HCl gazı.", "Rapid reaction in light; pungent HCl gas.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "1|H2O": R("—", "Gözle görülür tepkime yok; H₂ suda çok az çözünür.", "No visible reaction; H₂ is only sparingly soluble.", { phenomena: ["none"] }),
    "1|HCl": R("—", "Gözle görülür tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "1|NaOH": R("—", "Gözle görülür tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "3|H2O": R("2Li + 2H₂O → 2LiOH + H₂", "Düzenli gaz çıkışı; çözelti ısınır ve baziklesir.", "Steady gas evolution; the solution warms and becomes basic.", { phenomena: ["gas", "heat", "alkaline"], requiresHood: true }),
    "3|O2": R("4Li + O₂ → 2Li₂O", "Kırmızı alev; beyaz Li₂O oluşur.", "Crimson flame; white Li₂O forms.", { phenomena: ["flame", "heat"], color: "#ff3b30" }),
    "3|HCl": R("2Li + 2HCl → 2LiCl + H₂", "Hızlı gaz çıkışı; berrak çözelti.", "Rapid gas evolution; clear solution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "3|Cl2": R("2Li + Cl₂ → 2LiCl", "Parlak alev; beyaz LiCl dumanı.", "Bright flame; white LiCl smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#ff3b30", requiresHood: true }),
    "3|NaOH": R("—", "Sulu NaOH içinde belirgin yeni bir tepkime gözlenmez.", "No distinct reaction in aqueous NaOH.", { phenomena: ["none"] }),

    "11|H2O": R("2Na + 2H₂O → 2NaOH + H₂", "Şiddetli gaz çıkışı, yoğun ısınma; H₂ tutuşabilir.", "Vigorous gas evolution and strong heating; H₂ is flammable.", { phenomena: ["gas", "heat", "flame", "alkaline"], color: "#ffd23f", requiresHood: true }),
    "11|O2": R("4Na + O₂ → 2Na₂O", "Parlak sarı alev; beyaz Na₂O oluşur.", "Bright yellow flame; white Na₂O forms.", { phenomena: ["flame", "heat"], color: "#ffd23f" }),
    "11|HCl": R("2Na + 2HCl → 2NaCl + H₂", "Çok hızlı gaz çıkışı; ısınma.", "Very rapid gas evolution; heating.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "11|Cl2": R("2Na + Cl₂ → 2NaCl", "Parlak sarı alev ve beyaz duman.", "Bright yellow flame and white smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#ffd23f", requiresHood: true }),
    "11|NaOH": R("—", "NaOH çözeltisinde belirgin değişim yok.", "No distinct change in NaOH solution.", { phenomena: ["none"] }),

    "19|H2O": R("2K + 2H₂O → 2KOH + H₂", "Çok şiddetli; mor alev ve sıçrama gözlenebilir.", "Very vigorous; lilac flame and spattering may occur.", { phenomena: ["gas", "heat", "flame", "alkaline"], color: "#c084fc", requiresHood: true }),
    "19|O2": R("K + O₂ → KO₂", "Mor alev; turuncu K₂O₂ ve sarı KO₂ karışımı.", "Lilac flame; mixture of orange K₂O₂ and yellow KO₂.", { phenomena: ["flame", "heat"], color: "#c084fc" }),
    "19|HCl": R("2K + 2HCl → 2KCl + H₂", "Çok hızlı gaz çıkışı; ısınma.", "Very rapid gas evolution; heating.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "19|Cl2": R("2K + Cl₂ → 2KCl", "Parlak alev; beyaz KCl dumanı.", "Bright flame; white KCl smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#c084fc", requiresHood: true }),
    "19|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "37|H2O": R("2Rb + 2H₂O → 2RbOH + H₂", "Patlamaya yakın şiddet; kırmızı-mor alev.", "Near-explosive vigour; red-violet flame.", { phenomena: ["gas", "heat", "flame", "alkaline"], color: "#e879f9", requiresHood: true }),
    "37|O2": R("Rb + O₂ → RbO₂", "Kırmızı-mor alev; süperoksit oluşur.", "Red-violet flame; superoxide forms.", { phenomena: ["flame", "heat"], color: "#e879f9" }),
    "37|HCl": R("2Rb + 2HCl → 2RbCl + H₂", "Patlamaya yakın gaz çıkışı.", "Near-explosive gas evolution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "37|Cl2": R("2Rb + Cl₂ → 2RbCl", "Şiddetli alev; beyaz duman.", "Violent flame; white smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#e879f9", requiresHood: true }),
    "37|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "55|H2O": R("2Cs + 2H₂O → 2CsOH + H₂", "Patlayıcı; mavi-mor alev ve yoğun ısı.", "Explosive; blue-violet flame and intense heat.", { phenomena: ["gas", "heat", "flame", "alkaline"], color: "#818cf8", requiresHood: true }),
    "55|O2": R("Cs + O₂ → CsO₂", "Mavi-mor alev; süperoksit oluşur.", "Blue-violet flame; superoxide forms.", { phenomena: ["flame", "heat"], color: "#818cf8" }),
    "55|HCl": R("2Cs + 2HCl → 2CsCl + H₂", "Patlayıcı gaz çıkışı.", "Explosive gas evolution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "55|Cl2": R("2Cs + Cl₂ → 2CsCl", "Şiddetli alev; beyaz duman.", "Violent flame; white smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#818cf8", requiresHood: true }),
    "55|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "4|O2": R("2Be + O₂ → 2BeO", "Yüksek sıcaklıkta parlak beyaz yanma; BeO oluşur.", "Bright white combustion at high temperature; BeO forms.", { phenomena: ["flame", "heat"], minTempC: 600, color: "#e2e8f0" }),
    "4|HCl": R("Be + 2HCl → BeCl₂ + H₂", "Gaz çıkışı; berrak çözelti.", "Gas evolution; clear solution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "4|H2O": R("—", "Yüzeyde koruyucu oksit tabakası; belirgin tepkime yok.", "Protective oxide layer; no visible reaction.", { phenomena: ["none"] }),
    "4|Cl2": R("Be + Cl₂ → BeCl₂", "Isıyla ilerleyen klorürleşme.", "Chlorination promoted by heat.", { phenomena: ["heat", "smoke"], minTempC: 300, requiresHood: true }),
    "4|NaOH": R("Be + 2NaOH → Na₂BeO₂ + H₂", "Amfoterik çözünme; gaz çıkışı.", "Amphoteric dissolution; gas evolution.", { phenomena: ["gas", "dissolve"], requiresHood: true }),

    "12|O2": R("2Mg + O₂ → 2MgO", "Göz kamaştırıcı beyaz alev; beyaz MgO dumanı.", "Blinding white flame; white MgO smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#f8fafc" }),
    "12|H2O": R("Mg + 2H₂O → Mg(OH)₂ + H₂", "Soğukta yavaş; sıcak suda hızlı gaz çıkışı.", "Slow when cold; rapid gas evolution in hot water.", { phenomena: ["gas", "heat", "precipitate"], color: "#e2e8f0", minTempC: 60, requiresHood: true }),
    "12|HCl": R("Mg + 2HCl → MgCl₂ + H₂", "Hızlı gaz çıkışı; çözelti ısınır.", "Rapid gas evolution; the solution warms.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "12|Cl2": R("Mg + Cl₂ → MgCl₂", "Parlak yanma; beyaz duman.", "Bright combustion; white smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#f8fafc", requiresHood: true }),
    "12|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "20|H2O": R("Ca + 2H₂O → Ca(OH)₂ + H₂", "Gaz çıkışı, ısınma; beyaz Ca(OH)₂ bulanıklığı.", "Gas evolution, heating; white Ca(OH)₂ turbidity.", { phenomena: ["gas", "heat", "precipitate", "alkaline"], color: "#e2e8f0", requiresHood: true }),
    "20|O2": R("2Ca + O₂ → 2CaO", "Turuncu-kırmızı alev; beyaz CaO.", "Orange-red flame; white CaO.", { phenomena: ["flame", "heat"], color: "#fb923c" }),
    "20|HCl": R("Ca + 2HCl → CaCl₂ + H₂", "Hızlı gaz çıkışı.", "Rapid gas evolution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "20|Cl2": R("Ca + Cl₂ → CaCl₂", "Parlak yanma; beyaz duman.", "Bright combustion; white smoke.", { phenomena: ["flame", "smoke", "heat"], color: "#fb923c", requiresHood: true }),
    "20|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "38|H2O": R("Sr + 2H₂O → Sr(OH)₂ + H₂", "Hızlı gaz çıkışı; bazik çözelti.", "Rapid gas evolution; basic solution.", { phenomena: ["gas", "heat", "alkaline"], requiresHood: true }),
    "38|O2": R("2Sr + O₂ → 2SrO", "Koyu kırmızı alev; beyaz SrO.", "Crimson flame; white SrO.", { phenomena: ["flame", "heat"], color: "#f43f5e" }),
    "38|HCl": R("Sr + 2HCl → SrCl₂ + H₂", "Hızlı gaz çıkışı.", "Rapid gas evolution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "38|Cl2": R("Sr + Cl₂ → SrCl₂", "Parlak yanma.", "Bright combustion.", { phenomena: ["flame", "smoke", "heat"], color: "#f43f5e", requiresHood: true }),
    "38|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "56|H2O": R("Ba + 2H₂O → Ba(OH)₂ + H₂", "Hızlı gaz çıkışı; çözelti kuvvetle bazikleşir.", "Rapid gas evolution; the solution becomes strongly basic.", { phenomena: ["gas", "heat", "alkaline"], requiresHood: true }),
    "56|O2": R("2Ba + O₂ → 2BaO", "Sarı-yeşil alev; beyaz BaO.", "Yellow-green flame; white BaO.", { phenomena: ["flame", "heat"], color: "#bef264" }),
    "56|HCl": R("Ba + 2HCl → BaCl₂ + H₂", "Hızlı gaz çıkışı.", "Rapid gas evolution.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "56|Cl2": R("Ba + Cl₂ → BaCl₂", "Parlak yanma.", "Bright combustion.", { phenomena: ["flame", "smoke", "heat"], color: "#bef264", requiresHood: true }),
    "56|NaOH": R("—", "Belirgin değişim yok.", "No distinct change.", { phenomena: ["none"] }),

    "5|O2": R("4B + 3O₂ → 2B₂O₃", "Yeşil alev; camımsı B₂O₃ oluşur.", "Green flame; glassy B₂O₃ forms.", { phenomena: ["flame", "heat"], minTempC: 700, color: "#4ade80" }),
    "5|Cl2": R("2B + 3Cl₂ → 2BCl₃", "Isıyla klorürleşme; duman.", "Chlorination with heat; fumes.", { phenomena: ["smoke", "heat"], minTempC: 400, requiresHood: true }),
    "5|H2O": R("—", "Kristalin bor suda belirgin tepkime vermez.", "Crystalline boron does not react visibly with water.", { phenomena: ["none"] }),
    "5|HCl": R("—", "Seyreltik HCl ile belirgin tepkime yok.", "No visible reaction with dilute HCl.", { phenomena: ["none"] }),
    "5|NaOH": R("—", "Soğuk NaOH ile belirgin tepkime yok.", "No visible reaction with cold NaOH.", { phenomena: ["none"] }),

    "6|O2": R("C + O₂ → CO₂", "Kırmızı-turuncu kor; CO₂ oluşur. Sınırlı O₂'de CO.", "Red-orange glow; CO₂ forms. Limited O₂ gives CO.", { phenomena: ["flame", "heat", "gas"], minTempC: 700, color: "#fb923c", requiresHood: true }),
    "6|H2O": R("C + H₂O → CO + H₂", "Yüksek sıcaklıkta su gazı tepkimesi; sentez gazı.", "Steam reaction at high temperature; synthesis gas.", { phenomena: ["gas", "heat"], minTempC: 800, requiresHood: true }),
    "6|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "6|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "6|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "7|O2": R("N₂ + O₂ → 2NO", "Yalnızca çok yüksek sıcaklıkta; renksiz NO.", "Only at very high temperature; colourless NO.", { phenomena: ["gas", "heat"], minTempC: 2000, requiresHood: true }),
    "7|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "7|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "7|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "7|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "8|O2": R("—", "O₂ kendi başına tepkime vermez.", "O₂ does not react with itself.", { phenomena: ["none"] }),
    "8|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "8|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "8|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "8|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "9|H2O": R("2F₂ + 2H₂O → 4HF + O₂", "Şiddetli; HF ve O₂ açığa çıkar.", "Violent; HF and O₂ are released.", { phenomena: ["gas", "heat", "flame"], requiresHood: true }),
    "9|HCl": R("F₂ + 2HCl → 2HF + Cl₂", "Hızlı gaz değişimi; HF ve Cl₂.", "Rapid gas exchange; HF and Cl₂.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "9|O2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "9|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "9|NaOH": R("2F₂ + 2NaOH → 2NaF + H₂O + OF₂", "Şiddetli; OF₂ ve NaF oluşur.", "Violent; OF₂ and NaF form.", { phenomena: ["gas", "heat"], requiresHood: true }),

    "17|H2O": R("Cl₂ + H₂O ⇌ HCl + HOCl", "Sarı-yeşil gaz; asidik ve oksitleyici çözelti.", "Yellow-green gas; acidic and oxidizing solution.", { phenomena: ["dissolve", "gas"], requiresHood: true }),
    "17|NaOH": R("Cl₂ + 2NaOH → NaCl + NaClO + H₂O", "Gaz absorbe edilir; çamaşır suyu oluşur.", "Gas is absorbed; bleach forms.", { phenomena: ["dissolve", "heat"], requiresHood: true }),
    "17|O2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "17|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "17|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "35|H2O": R("Br₂ + H₂O ⇌ HBr + HOBr", "Kırmızı-kahve sıvı; asidik çözelti.", "Red-brown liquid; acidic solution.", { phenomena: ["dissolve", "gas"], requiresHood: true }),
    "35|NaOH": R("Br₂ + 2NaOH → NaBr + NaBrO + H₂O", "Kahve rengi kaybolur; hipobromit oluşur.", "Brown colour fades; hypobromite forms.", { phenomena: ["dissolve", "heat"], requiresHood: true }),
    "35|O2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "35|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "35|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "53|H2O": R("I₂ + H₂O ⇌ HI + HOI", "Çok az çözünür; mor-kahve renk.", "Only slightly soluble; violet-brown colour.", { phenomena: ["dissolve"], requiresHood: true }),
    "53|NaOH": R("3I₂ + 6NaOH → 5NaI + NaIO₃ + 3H₂O", "Mor renk kaybolur; iyodat oluşur.", "Violet colour fades; iodate forms.", { phenomena: ["dissolve", "heat"], requiresHood: true }),
    "53|O2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "53|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "53|Cl2": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "13|O2": R("4Al + 3O₂ → 2Al₂O₃", "Oda sıcaklığında koruyucu oksit; yüksek sıcaklıkta parlak yanma.", "Protective oxide at room temperature; bright combustion when hot.", { phenomena: ["flame", "heat", "passivation"], minTempC: 600, color: "#e2e8f0" }),
    "13|HCl": R("2Al + 6HCl → 2AlCl₃ + 3H₂", "Oksit tabakası çözülünce hızlı gaz çıkışı.", "Rapid gas evolution after the oxide layer dissolves.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "13|NaOH": R("2Al + 2NaOH + 6H₂O → 2Na[Al(OH)₄] + 3H₂", "Amfoterik çözünme; güçlü gaz çıkışı.", "Amphoteric dissolution; vigorous gas evolution.", { phenomena: ["gas", "dissolve"], requiresHood: true }),
    "13|H2O": R("—", "Koruyucu Al₂O₃ tabakası nedeniyle belirgin tepkime yok.", "No visible reaction due to the protective Al₂O₃ layer.", { phenomena: ["none"] }),
    "13|Cl2": R("2Al + 3Cl₂ → 2AlCl₃", "Isıyla şiddetli klorürleşme; duman.", "Vigorous chlorination with heat; fumes.", { phenomena: ["flame", "smoke", "heat"], minTempC: 200, requiresHood: true }),

    "14|O2": R("Si + O₂ → SiO₂", "Yüksek sıcaklıkta oksit filmi; camımsı SiO₂.", "Oxide film at high temperature; glassy SiO₂.", { phenomena: ["heat", "passivation"], minTempC: 900 }),
    "14|NaOH": R("Si + 2NaOH + H₂O → Na₂SiO₃ + 2H₂", "Bazda çözünme; hidrojen gazı.", "Dissolution in base; hydrogen gas.", { phenomena: ["gas", "dissolve"], requiresHood: true }),
    "14|HCl": R("—", "Seyreltik HCl ile belirgin tepkime yok.", "No visible reaction with dilute HCl.", { phenomena: ["none"] }),
    "14|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "14|Cl2": R("Si + 2Cl₂ → SiCl₄", "Isıyla uçucu SiCl₄ oluşur.", "Volatile SiCl₄ forms with heat.", { phenomena: ["smoke", "heat"], minTempC: 300, requiresHood: true }),

    "15|O2": R("P₄ + 5O₂ → P₄O₁₀", "Beyaz duman ve parlak alev; P₄O₁₀ oluşur.", "White smoke and bright flame; P₄O₁₀ forms.", { phenomena: ["flame", "smoke", "heat"], color: "#86efac", requiresHood: true }),
    "15|Cl2": R("P₄ + 6Cl₂ → 4PCl₃", "Yeşil-sarı alev; duman.", "Green-yellow flame; fumes.", { phenomena: ["flame", "smoke", "heat"], color: "#86efac", requiresHood: true }),
    "15|H2O": R("—", "Beyaz fosfor su altında saklanır; belirgin tepkime yok.", "White phosphorus is stored under water; no visible reaction.", { phenomena: ["none"] }),
    "15|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "15|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "16|O2": R("S + O₂ → SO₂", "Mavi alev; keskin kokulu SO₂.", "Blue flame; pungent SO₂.", { phenomena: ["flame", "gas", "heat"], minTempC: 250, color: "#60a5fa", requiresHood: true }),
    "16|Cl2": R("2S + Cl₂ → S₂Cl₂", "Isıyla kükürt klorürleri oluşur.", "Sulfur chlorides form with heat.", { phenomena: ["smoke", "heat"], minTempC: 200, requiresHood: true }),
    "16|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "16|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "16|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "26|O2": R("4Fe + 3O₂ → 2Fe₂O₃", "Nemli havada pas; yüksek sıcaklıkta oksit pulları.", "Rust in moist air; oxide scale at high temperature.", { phenomena: ["heat", "passivation"], minTempC: 300 }),
    "26|H2O": R("3Fe + 4H₂O → Fe₃O₄ + 4H₂", "Yüksek sıcaklıkta buhar tepkimesi.", "Steam reaction at high temperature.", { phenomena: ["gas", "heat"], minTempC: 500, requiresHood: true }),
    "26|HCl": R("Fe + 2HCl → FeCl₂ + H₂", "Gaz çıkışı; soluk yeşil Fe²⁺ çözeltisi.", "Gas evolution; pale green Fe²⁺ solution.", { phenomena: ["gas", "heat", "color"], requiresHood: true }),
    "26|Cl2": R("2Fe + 3Cl₂ → 2FeCl₃", "Isıyla kahverengi FeCl₃ dumanı.", "Brown FeCl₃ fumes with heat.", { phenomena: ["smoke", "heat"], minTempC: 200, requiresHood: true }),
    "26|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "29|O2": R("2Cu + O₂ → 2CuO", "Isıtıldığında siyah CuO filmi.", "Black CuO film when heated.", { phenomena: ["heat", "color"], minTempC: 300, color: "#1f2937" }),
    "29|HCl": R("—", "Cu, H⁺'yi indirgeyemez; gözle görülür tepkime yok.", "Cu cannot reduce H⁺; no visible reaction.", { phenomena: ["none"] }),
    "29|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "29|Cl2": R("Cu + Cl₂ → CuCl₂", "Isıyla kahverengi-sarı CuCl₂.", "Brown-yellow CuCl₂ with heat.", { phenomena: ["smoke", "heat"], minTempC: 200, requiresHood: true }),
    "29|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "30|O2": R("2Zn + O₂ → 2ZnO", "Isıtıldığında beyaz ZnO.", "White ZnO when heated.", { phenomena: ["heat", "color"], minTempC: 300, color: "#f8fafc" }),
    "30|HCl": R("Zn + 2HCl → ZnCl₂ + H₂", "Hızlı gaz çıkışı; çözelti ısınır.", "Rapid gas evolution; the solution warms.", { phenomena: ["gas", "heat"], requiresHood: true }),
    "30|NaOH": R("Zn + 2NaOH + 2H₂O → Na₂[Zn(OH)₄] + H₂", "Amfoterik çözünme; gaz çıkışı.", "Amphoteric dissolution; gas evolution.", { phenomena: ["gas", "dissolve"], requiresHood: true }),
    "30|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "30|Cl2": R("Zn + Cl₂ → ZnCl₂", "Isıyla beyaz duman.", "White fumes with heat.", { phenomena: ["smoke", "heat"], minTempC: 200, requiresHood: true }),

    "47|O2": R("—", "Belirgin oksitlenme yok.", "No visible oxidation.", { phenomena: ["none"] }),
    "47|HCl": R("—", "Ag, H⁺'yi indirgeyemez; tepkime yok.", "Ag cannot reduce H⁺; no reaction.", { phenomena: ["none"] }),
    "47|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "47|Cl2": R("2Ag + Cl₂ → 2AgCl", "Beyaz AgCl filmi; ışıkla morarır.", "White AgCl film; darkens in light.", { phenomena: ["precipitate", "color"], color: "#f8fafc", requiresHood: true }),
    "47|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "79|O2": R("—", "Altın oksijenle belirgin tepkime vermez.", "Gold does not react visibly with oxygen.", { phenomena: ["none"] }),
    "79|HCl": R("—", "Altın seyreltik HCl'de çözünmez.", "Gold does not dissolve in dilute HCl.", { phenomena: ["none"] }),
    "79|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "79|Cl2": R("2Au + 3Cl₂ → 2AuCl₃", "Yüksek sıcaklıkta altın klorürü oluşur.", "Gold chloride forms at high temperature.", { phenomena: ["smoke", "heat"], minTempC: 200, requiresHood: true }),
    "79|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "80|O2": R("2Hg + O₂ → 2HgO", "Yavaş oksitlenme; kırmızı HgO.", "Slow oxidation; red HgO.", { phenomena: ["heat", "color"], minTempC: 300, color: "#ef4444" }),
    "80|HCl": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "80|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "80|Cl2": R("Hg + Cl₂ → HgCl₂", "Beyaz HgCl₂ oluşur.", "White HgCl₂ forms.", { phenomena: ["smoke", "heat"], requiresHood: true }),
    "80|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),

    "82|O2": R("2Pb + O₂ → 2PbO", "Isıtıldığında sarı PbO.", "Yellow PbO when heated.", { phenomena: ["heat", "color"], minTempC: 300, color: "#fde68a" }),
    "82|HCl": R("Pb + 2HCl → PbCl₂ + H₂", "Yavaş gaz çıkışı; beyaz PbCl₂ çökeleği.", "Slow gas evolution; white PbCl₂ precipitate.", { phenomena: ["gas", "precipitate"], requiresHood: true }),
    "82|H2O": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] }),
    "82|Cl2": R("Pb + Cl₂ → PbCl₂", "Beyaz PbCl₂ oluşur.", "White PbCl₂ forms.", { phenomena: ["precipitate", "heat"], requiresHood: true }),
    "82|NaOH": R("Pb + 2NaOH + 2H₂O → Na₂[Pb(OH)₄] + H₂", "Amfoterik çözünme; gaz çıkışı.", "Amphoteric dissolution; gas evolution.", { phenomena: ["gas", "dissolve"], requiresHood: true }),

    "92|O2": R("U + O₂ → UO₂", "Toz halinde piroforik; koyu UO₂.", "Pyrophoric as powder; dark UO₂.", { phenomena: ["flame", "heat", "smoke"], color: "#fbbf24", requiresHood: true, requiresShield: true }),
    "92|H2O": R("U + 2H₂O → UO₂ + 2H₂", "Yüksek sıcaklıkta buharla tepkime.", "Reacts with steam at high temperature.", { phenomena: ["gas", "heat"], minTempC: 300, requiresHood: true, requiresShield: true }),
    "92|HCl": R("U + 4HCl → UCl₄ + 2H₂", "Gaz çıkışı; yeşil UCl₄ çözeltisi.", "Gas evolution; green UCl₄ solution.", { phenomena: ["gas", "heat", "color"], requiresHood: true, requiresShield: true }),
    "92|Cl2": R("U + 2Cl₂ → UCl₄", "Isıyla yeşil UCl₄ oluşur.", "Green UCl₄ forms with heat.", { phenomena: ["smoke", "heat"], requiresHood: true, requiresShield: true }),
    "92|NaOH": R("—", "Belirgin tepkime yok.", "No visible reaction.", { phenomena: ["none"] })
  };

  // Noble gases: no conventional wet chemistry under these conditions.
  ["2", "10", "18", "36", "54", "86", "118"].forEach((z) => {
    REAGENTS.forEach((reagent) => {
      REACTIONS[z + "|" + reagent.id] = R(
        "—",
        z === "118"
          ? "Oganesson için deneysel çözelti kimyası yok; yalnızca teorik öngörüler var."
          : "Asal gaz; kapalı elektron kabuğu nedeniyle bu koşullarda tepkime vermez.",
        z === "118"
          ? "No experimental solution chemistry exists for oganesson; only theoretical predictions."
          : "Noble gas; the closed electron shell prevents reaction under these conditions.",
        { phenomena: ["none"], confidence: z === "118" ? "predicted" : "literature" }
      );
    });
  });

  const MISSIONS = {
    A01: {
      id: "A01",
      code: "VAKA 001",
      targetZ: 11,
      title: bi("Etiketsiz numune A-01", "Unlabeled sample A-01"),
      subtitle: bi("Gümüşi, yumuşak katı; mineral yağ altında saklanıyor.", "Silvery, soft solid stored under mineral oil."),
      brief: bi(
        "Laboratuvara bir kargo kutusu geldi. İçinde etiketsiz bir numune ve tek bir not var: “A-01 — analiz edin.” Numune mineral yağ altında; nemle teması kesilmiş. Alev testi, yoğunluk ölçümü ve reaksiyon hücresiyle kimliğini belirle.",
        "A cargo box arrived at the laboratory. Inside is an unlabeled sample and a single note: “A-01 — analyse.” The sample is stored under mineral oil, protected from moisture. Identify it using flame tests, density measurement and the reaction cell."
      ),
      objective: bi(
        "En az iki bağımsız kanıtla numunenin elementini belirle.",
        "Identify the element using at least two independent lines of evidence."
      ),
      storage: bi("Mineral yağ altında, argon atmosferi", "Under mineral oil, argon atmosphere"),
      candidates: [3, 11, 19, 20, 38, 29],
      hints: [
        bi("Alev rengi ve tayf çizgileri alkali metaller için çok belirgindir.", "Flame colour and spectral lines are very distinctive for alkali metals."),
        bi("Yoğunluk 1 g/cm³'ün altındaysa numune suda yüzer.", "If density is below 1 g/cm³, the sample floats on water."),
        bi("Suyla şiddetli gaz çıkışı ve bazik çözelti, aktif bir alkali metal işaretidir.", "Vigorous gas evolution with water and a basic solution indicate an active alkali metal.")
      ]
    }
  };

  window.LAB_DATA = {
    FLAME,
    LINES,
    POTENTIALS,
    REAGENTS,
    REACTIONS,
    MISSIONS
  };
})();
