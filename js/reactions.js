/* Reaction profiles, common compounds, curated uses and hazard phrase translations */
(function () {
  const bi = (tr, en) => ({ tr, en });
  const R = (eq, tagTr, tagEn, noteTr, noteEn) => ({
    eq,
    tag: bi(tagTr, tagEn),
    note: noteTr || noteEn ? bi(noteTr || "", noteEn || "") : null
  });

  const REACTIVITY = {
    "alkali-metal": {
      level: "high",
      text: bi(
        "Alkali metaller en aktif metal grubudur. Tek değerlik elektronlarını kolayca kaybeder; su, oksijen ve halojenlerle şiddetli tepkime verir. Reaksiyon hızı grupta aşağı indikçe artar.",
        "Alkali metals are the most reactive metal group. They readily lose their single valence electron and react vigorously with water, oxygen and halogens. Reactivity increases down the group."
      )
    },
    "alkaline-earth-metal": {
      level: "medium",
      text: bi(
        "Toprak alkali metaller iki değerlik elektronu verir ve +2 oksidasyon basamağında bulunur. Su ve oksijenle tepkime verir; aktiflik grupta aşağı indikçe artar.",
        "Alkaline earth metals lose two valence electrons and form +2 states. They react with water and oxygen; reactivity increases down the group."
      )
    },
    "transition-metal": {
      level: "medium",
      text: bi(
        "Geçiş metalleri değişken oksidasyon basamakları gösterir, kompleks ve renkli bileşikler oluşturur. Asitlerle hidrojen gazı açığa çıkarabilir; soy metaller (Au, Pt, Os, Ir) yalnızca güçlü oksitleyicilerle çözünür.",
        "Transition metals show variable oxidation states and form colourful complexes. Many dissolve in acids releasing hydrogen; noble metals (Au, Pt, Os, Ir) require strong oxidizers."
      )
    },
    "post-transition-metal": {
      level: "low",
      text: bi(
        "Geçiş sonrası metaller daha yumuşak ve düşük erime noktalıdır. Oksijen ve halojenlerle tepkime verir; bazıları amfoterik oksit oluşturur (Al, Ga, Sn, Pb).",
        "Post-transition metals are softer with lower melting points. They react with oxygen and halogens; some form amphoteric oxides (Al, Ga, Sn, Pb)."
      )
    },
    metalloid: {
      level: "low",
      text: bi(
        "Metaloidler metallerle ametaller arasında davranır. Yüksek sıcaklıkta oksijen ve halojenlerle tepkime verir; yarı iletken özellikleriyle bilinir.",
        "Metalloids behave between metals and nonmetals. They react with oxygen and halogens at elevated temperatures and are known for semiconducting properties."
      )
    },
    nonmetal: {
      level: "medium",
      text: bi(
        "Ametaller elektron alarak anyon oluşturur veya kovalent bağ yapar. Oksijen ve hidrojenle tepkimeleri elementin periyodik konumuna bağlıdır. Oda sıcaklığında farklı fiziksel hâllerde bulunur.",
        "Nonmetals gain electrons to form anions or share electrons covalently. Their reactions with oxygen and hydrogen depend on periodic position. They occur in different physical states at room temperature."
      )
    },
    halogen: {
      level: "high",
      text: bi(
        "Halojenler yedi değerlik elektronuna sahiptir ve bir elektron alarak -1 iyonu oluşturur. Aktiflik F > Cl > Br > I sırasındadır; daha aktif halojen daha az aktif olanı tuzundan ayırır.",
        "Halogens have seven valence electrons and gain one to form -1 ions. Reactivity follows F > Cl > Br > I; a more reactive halogen displaces a less reactive one from its salt."
      )
    },
    "noble-gas": {
      level: "inert",
      text: bi(
        "Soy gazların kabukları doludur; normal koşullarda tepkimeye girmezler. Yalnızca ksenon ve kripton, özel koşullarda flor ile bileşik oluşturabilir.",
        "Noble gases have full shells and are inert under normal conditions. Only xenon and krypton can form compounds with fluorine under special conditions."
      )
    },
    lanthanide: {
      level: "high",
      text: bi(
        "Lantanitler oldukça aktif metallerdir; çoğunlukla +3 oksidasyon basamağında bulunur. Oksijen, su ve asitlerle tepkime verir; havada kararırlar.",
        "Lanthanides are quite reactive metals, mostly forming +3 states. They react with oxygen, water and acids, and tarnish in air."
      )
    },
    actinide: {
      level: "high",
      text: bi(
        "Aktinitler radyoaktif ve oldukça aktif metallerdir. Çoğu +3 ile +6 arasında oksidasyon basamakları gösterir; oksijen ve asitlerle tepkime verir. Nükleer özellikleri kimyasal davranışlarını gölgeler.",
        "Actinides are radioactive and highly reactive metals. Many show oxidation states between +3 and +6 and react with oxygen and acids. Their nuclear properties dominate their handling."
      )
    },
    unknown: {
      level: "low",
      text: bi(
        "Bu süper ağır element için deneysel kimyasal veri yok denecek kadar azdır. Özellikleri periyodik konumuna göre öngörülür; izotopları saniyeler mertebesinde bozunur.",
        "Experimental chemical data for this superheavy element is extremely limited. Properties are predicted from its periodic position; isotopes decay within seconds or less."
      )
    }
  };

  const NOBLE = new Set(["He", "Ne", "Ar"]);
  const NOBLE_SPECIAL = { Kr: true, Xe: true, Rn: true, Og: true };
  const NOBLE_METALS = new Set(["Ru", "Rh", "Pd", "Ag", "Os", "Ir", "Pt", "Au"]);
  const PASSIVE = new Set(["Ti", "Zr", "Hf", "Nb", "Ta"]);

  const sub = (n) => String(n).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d]);
  const sup = (n) => String(n).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]);

  function chargeOf(el) {
    const common = (el.oxidationStates?.common || []).filter((x) => x > 0);
    if (!common.length) return 2;
    // prefer the highest positive state for oxide/chloride examples, but cap at 7
    return Math.min(7, Math.max(...common));
  }

  function metalOxide(sym, n, name) {
    const eqs = {
      1: `4${sym} + O₂ → 2${sym}₂O`,
      2: `2${sym} + O₂ → 2${sym}O`,
      3: `4${sym} + 3O₂ → 2${sym}₂O₃`,
      4: `${sym} + O₂ → ${sym}O₂`,
      5: `4${sym} + 5O₂ → 2${sym}₂O₅`,
      6: `2${sym} + 3O₂ → 2${sym}O₃`,
      7: `4${sym} + 7O₂ → 2${sym}₂O₇`
    };
    return R(eqs[n] || `4${sym} + ${n}O₂ → 2${sym}₂O${sub(n)}`, "Oksijenle", "With oxygen", "Isıtıldığında oksit oluşur.", "Forms an oxide when heated.");
  }

  function metalChloride(sym, n) {
    const eqs = {
      1: `2${sym} + Cl₂ → 2${sym}Cl`,
      2: `${sym} + Cl₂ → ${sym}Cl₂`,
      3: `2${sym} + 3Cl₂ → 2${sym}Cl₃`,
      4: `${sym} + 2Cl₂ → ${sym}Cl₄`,
      5: `2${sym} + 5Cl₂ → 2${sym}Cl₅`,
      6: `${sym} + 3Cl₂ → ${sym}Cl₆`
    };
    return R(eqs[n] || `2${sym} + ${n}Cl₂ → 2${sym}Cl${sub(n)}`, "Halojenle", "With a halogen", "Kuru ortamda metal klorür oluşur.", "Forms a metal chloride in dry conditions.");
  }

  function metalAcid(sym, n) {
    const eqs = {
      1: `2${sym} + 2HCl → 2${sym}Cl + H₂↑`,
      2: `${sym} + 2HCl → ${sym}Cl₂ + H₂↑`,
      3: `2${sym} + 6HCl → 2${sym}Cl₃ + 3H₂↑`,
      4: `${sym} + 4HCl → ${sym}Cl₄ + 2H₂↑`
    };
    return R(eqs[n] || `2${sym} + ${2 * n}HCl → 2${sym}Cl${sub(n)} + ${n}H₂↑`, "Asitle", "With acid", "Hidrojen gazı açığa çıkar.", "Hydrogen gas is released.");
  }

  const CURATED = {
    H: [
      R("2H₂ + O₂ → 2H₂O", "Yanma", "Combustion", "Ateşleme ile patlayıcı tepkime.", "Explosive reaction on ignition."),
      R("H₂ + Cl₂ → 2HCl", "Halojenle", "With halogen", "Işıkta zincirleme tepkime.", "Chain reaction in light."),
      R("N₂ + 3H₂ ⇌ 2NH₃", "Haber–Bosch", "Haber–Bosch", "Yüksek basınç ve demir katalizörü.", "High pressure and an iron catalyst.")
    ],
    Li: [
      R("2Li + 2H₂O → 2LiOH + H₂↑", "Su ile", "With water", "Güçlü fakat sodyumdan daha yavaş.", "Vigorous but slower than sodium."),
      R("4Li + O₂ → 2Li₂O", "Oksijenle", "With oxygen", "Lityum oksit oluşur.", "Lithium oxide forms."),
      R("2Li + Cl₂ → 2LiCl", "Klorla", "With chlorine", "Beyaz lityum klorür.", "White lithium chloride.")
    ],
    Na: [
      R("2Na + 2H₂O → 2NaOH + H₂↑", "Su ile", "With water", "Şiddetli; hidrojen tutuşabilir.", "Vigorous; hydrogen may ignite."),
      R("4Na + O₂ → 2Na₂O", "Oksijenle", "With oxygen", "Havada hızla oksitlenir.", "Oxidises rapidly in air."),
      R("2Na + Cl₂ → 2NaCl", "Klorla", "With chlorine", "Parlak sarı alevle yanar.", "Burns with a bright yellow flame.")
    ],
    K: [
      R("2K + 2H₂O → 2KOH + H₂↑", "Su ile", "With water", "Sodyumdan daha şiddetli; alevlenebilir.", "More vigorous than sodium; may ignite."),
      R("4K + O₂ → 2K₂O", "Oksijenle", "With oxygen", "Yüzeyde hızla oksitlenir.", "Oxidises rapidly at the surface.")
    ],
    Mg: [
      R("2Mg + O₂ → 2MgO", "Oksijenle", "With oxygen", "Göz kamaştırıcı beyaz ışık.", "Brilliant white light."),
      R("Mg + 2HCl → MgCl₂ + H₂↑", "Asitle", "With acid", "Hidrojen açığa çıkar.", "Hydrogen is released."),
      R("Mg + H₂O(g) → MgO + H₂", "Buharla", "With steam", "Sıcak su buharıyla tepkime.", "Reacts with steam when heated.")
    ],
    Al: [
      R("4Al + 3O₂ → 2Al₂O₃", "Oksijenle", "With oxygen", "Yüzeyde koruyucu oksit tabakası oluşur.", "A protective oxide layer forms."),
      R("2Al + 6HCl → 2AlCl₃ + 3H₂↑", "Asitle", "With acid", "Oksit tabakası çözündükten sonra hızlı.", "Fast after the oxide layer dissolves."),
      R("2Al + Fe₂O₃ → Al₂O₃ + 2Fe", "Termit", "Thermite", "Yüksek ısı açığa çıkar; metal kaynağı.", "Highly exothermic; used for welding.")
    ],
    C: [
      R("C + O₂ → CO₂", "Yanma", "Combustion", "Tam yanma ürünü.", "Product of complete combustion."),
      R("2C + O₂ → 2CO", "Sınırlı oksijen", "Limited oxygen", "Karbon monoksit oluşur.", "Carbon monoxide forms."),
      R("C + 2H₂ ⇌ CH₄", "Hidrojenle", "With hydrogen", "Yüksek sıcaklık ve katalizör.", "High temperature and catalyst.")
    ],
    N: [
      R("N₂ + 3H₂ ⇌ 2NH₃", "Haber–Bosch", "Haber–Bosch", "Amonyak sentezi; demir katalizörü.", "Ammonia synthesis; iron catalyst."),
      R("N₂ + O₂ → 2NO", "Elektrik arkı", "Electric arc", "Yüksek sıcaklıkta azot oksit.", "Nitrogen oxide at high temperature."),
      R("3Mg + N₂ → Mg₃N₂", "Metal ile", "With metal", "Metal nitrür oluşur.", "A metal nitride forms.")
    ],
    O: [
      R("2H₂ + O₂ → 2H₂O", "Yanma", "Combustion", "Su oluşumu; yüksek enerji.", "Water formation; highly energetic."),
      R("2Mg + O₂ → 2MgO", "Metal ile", "With metal", "Parlak beyaz yanma.", "Bright white combustion."),
      R("O₂ + 2H₂ → 2H₂O", "Yakıt hücresi", "Fuel cell", "Elektrokimyasal enerji dönüşümü.", "Electrochemical energy conversion.")
    ],
    F: [
      R("H₂ + F₂ → 2HF", "Hidrojenle", "With hydrogen", "Oda sıcaklığında patlayıcı.", "Explosive at room temperature."),
      R("2Na + F₂ → 2NaF", "Metalle", "With metal", "Beyaz sodyum florür.", "White sodium fluoride."),
      R("2F₂ + 2H₂O → 4HF + O₂", "Su ile", "With water", "Suyu oksitler.", "Oxidises water.")
    ],
    Cl: [
      R("H₂ + Cl₂ → 2HCl", "Hidrojenle", "With hydrogen", "Işıkla hızlanır.", "Accelerated by light."),
      R("Cl₂ + 2NaBr → 2NaCl + Br₂", "Yerdeğiştirme", "Displacement", "Daha aktif halojen daha az aktifini ayırır.", "A more reactive halogen displaces a less reactive one."),
      R("Cl₂ + H₂O ⇌ HCl + HClO", "Su ile", "With water", "Hipokloröz asit dezenfektan etkisi verir.", "Hypochlorous acid provides disinfection.")
    ],
    Si: [
      R("Si + O₂ → SiO₂", "Oksijenle", "With oxygen", "Silika oluşur.", "Silica forms."),
      R("Si + 2Cl₂ → SiCl₄", "Klorla", "With chlorine", "Uçucu silisyum klorür.", "Volatile silicon chloride.")
    ],
    P: [
      R("P₄ + 5O₂ → P₄O₁₀", "Oksijenle", "With oxygen", "Beyaz duman; fosfor pentoksit.", "White fumes; phosphorus pentoxide."),
      R("P₄ + 6H₂ → 4PH₃", "Hidrojenle", "With hydrogen", "Dolaylı yolla fosfin.", "Phosphine via indirect routes.")
    ],
    S: [
      R("S + O₂ → SO₂", "Oksijenle", "With oxygen", "Mavi alev; sülfür dioksit.", "Blue flame; sulfur dioxide."),
      R("S + H₂ → H₂S", "Hidrojenle", "With hydrogen", "Çürük yumurta kokusu.", "Rotten-egg smell."),
      R("Fe + S → FeS", "Metalle", "With metal", "Isıtıldığında demir sülfür.", "Iron sulfide when heated.")
    ],
    Ca: [
      R("Ca + 2H₂O → Ca(OH)₂ + H₂↑", "Su ile", "With water", "Oda sıcaklığında belirgin tepkime.", "Noticeable reaction at room temperature."),
      R("2Ca + O₂ → 2CaO", "Oksijenle", "With oxygen", "Kalsiyum oksit (sönmemiş kireç).", "Calcium oxide (quicklime).")
    ],
    Fe: [
      R("4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃", "Paslanma", "Rusting", "Nemli havada hidratlı demir oksit.", "Hydrated iron oxide in moist air."),
      R("Fe + 2HCl → FeCl₂ + H₂↑", "Asitle", "With acid", "Demir(II) klorür oluşur.", "Iron(II) chloride forms."),
      R("Fe + CuSO₄ → FeSO₄ + Cu", "Yerdeğiştirme", "Displacement", "Demir bakırı çözeltiden ayırır.", "Iron displaces copper from solution.")
    ],
    Cu: [
      R("2Cu + O₂ → 2CuO", "Oksijenle", "With oxygen", "Isıtıldığında siyah bakır(II) oksit.", "Black copper(II) oxide when heated."),
      R("Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O", "Nitrik asit", "Nitric acid", "Yoğun asitle kahverengi NO₂.", "Brown NO₂ with concentrated acid."),
      R("Cu + 2H₂SO₄ → CuSO₄ + SO₂↑ + 2H₂O", "Sıcak sülfürik asit", "Hot sulfuric acid", "Seyreltik asitle tepkime yok.", "No reaction with dilute acid.")
    ],
    Zn: [
      R("Zn + 2HCl → ZnCl₂ + H₂↑", "Asitle", "With acid", "Hidrojen açığa çıkar.", "Hydrogen is released."),
      R("2Zn + O₂ → 2ZnO", "Oksijenle", "With oxygen", "Beyaz çinko oksit.", "White zinc oxide."),
      R("Zn + CuSO₄ → ZnSO₄ + Cu", "Yerdeğiştirme", "Displacement", "Daha aktif metal bakırı ayırır.", "The more active metal displaces copper.")
    ],
    Ag: [
      R("2Ag + H₂S → Ag₂S + H₂", "Kararma", "Tarnishing", "Gümüş sülfür siyah tabaka.", "Black silver sulfide layer."),
      R("Ag + 2HNO₃ → AgNO₃ + NO₂↑ + H₂O", "Nitrik asit", "Nitric acid", "Gümüş nitrat çözeltisi.", "Silver nitrate solution.")
    ],
    Au: [
      R("Au + 4HCl + HNO₃ → HAuCl₄ + NO↑ + 2H₂O", "Kral suyu", "Aqua regia", "Altını çözen tek yaygın asit karışımı.", "The common acid mixture that dissolves gold."),
      R("4Au + 3O₂ → 2Au₂O₃", "Oksijenle", "With oxygen", "Yalnızca zorlu koşullarda; altın asaldır.", "Only under forcing conditions; gold is noble.")
    ],
    Hg: [
      R("Hg + S → HgS", "Kükürt ile", "With sulfur", "Cıvayı bağlayarak zararsızlaştırır.", "Binds mercury into a safer solid."),
      R("2Hg + O₂ → 2HgO", "Oksijenle", "With oxygen", "Isıtıldığında kırmızı cıva oksit.", "Red mercury(II) oxide when heated.")
    ],
    Pb: [
      R("2Pb + O₂ → 2PbO", "Oksijenle", "With oxygen", "Kurşun(II) oksit.", "Lead(II) oxide."),
      R("Pb + 4HNO₃ → Pb(NO₃)₂ + 2NO₂↑ + 2H₂O", "Nitrik asit", "Nitric acid", "Kurşun nitrat çözeltisi.", "Lead nitrate solution.")
    ],
    U: [
      R("U + O₂ → UO₂", "Oksijenle", "With oxygen", "Uranyum dioksit; nükleer yakıt.", "Uranium dioxide; nuclear fuel."),
      R("U + 4HF → UF₄ + 2H₂↑", "Hidrojen florür", "Hydrogen fluoride", "UF₄, zenginleştirme zincirinin ara ürünü.", "UF₄ is an intermediate in enrichment."),
      R("U + 2H₂O → UO₂ + 2H₂↑", "Buharla", "With steam", "Yüksek sıcaklıkta oksitlenir.", "Oxidises at high temperature.")
    ],
    Xe: [
      R("Xe + 2F₂ → XeF₄", "Florla", "With fluorine", "400 °C ve basınç altında.", "At 400 °C and elevated pressure."),
      R("XeF₆ + 3H₂O → XeO₃ + 6HF", "Hidroliz", "Hydrolysis", "Ksenon trioksit ve hidrojen florür.", "Xenon trioxide and hydrogen fluoride.")
    ],
    Kr: [
      R("Kr + F₂ → KrF₂", "Florla", "With fluorine", "Yalnızca düşük sıcaklık ve elektrik boşalmasıyla.", "Only at low temperature with electric discharge.")
    ],
    Rn: [
      R("Rn + F₂ → RnF₂", "Florla", "With fluorine", "Çok düşük sıcaklıklarda kararlı olabilir.", "May be stable only at very low temperatures.")
    ],
    Og: [
      R("Og + F₂ → OgF₂", "Florla (öngörü)", "With fluorine (predicted)", "Relativistik etkiler Og için daha yüksek kimyasal etkinlik öngörür.", "Relativistic effects predict higher chemical reactivity for Og.")
    ]
  };

  const COMPOUNDS = {
    H: [["H₂O", "Su", "Water"], ["H₂O₂", "Hidrojen peroksit", "Hydrogen peroxide"], ["NH₃", "Amonyak", "Ammonia"], ["CH₄", "Metan", "Methane"]],
    He: [],
    Li: [["Li₂CO₃", "Lityum karbonat", "Lithium carbonate"], ["LiCl", "Lityum klorür", "Lithium chloride"], ["LiCoO₂", "Lityum kobalt oksit", "Lithium cobalt oxide"]],
    Be: [["BeO", "Berilyum oksit", "Beryllium oxide"], ["BeCl₂", "Berilyum klorür", "Beryllium chloride"]],
    B: [["B₂O₃", "Bor oksit", "Boron oxide"], ["H₃BO₃", "Borik asit", "Boric acid"], ["Na₂B₄O₇", "Boraks", "Borax"]],
    C: [["CO₂", "Karbondioksit", "Carbon dioxide"], ["CH₄", "Metan", "Methane"], ["CaCO₃", "Kalsiyum karbonat", "Calcium carbonate"], ["C₆H₁₂O₆", "Glikoz", "Glucose"]],
    N: [["NH₃", "Amonyak", "Ammonia"], ["HNO₃", "Nitrik asit", "Nitric acid"], ["NO₂", "Azot dioksit", "Nitrogen dioxide"], ["N₂O", "Diazot monoksit", "Nitrous oxide"]],
    O: [["H₂O", "Su", "Water"], ["O₃", "Ozon", "Ozone"], ["CO₂", "Karbondioksit", "Carbon dioxide"], ["SiO₂", "Silika", "Silica"]],
    F: [["HF", "Hidrojen florür", "Hydrogen fluoride"], ["NaF", "Sodyum florür", "Sodium fluoride"], ["CaF₂", "Florit", "Fluorite"], ["PTFE", "Teflon", "Teflon"]],
    Na: [["NaCl", "Sodyum klorür", "Sodium chloride"], ["NaOH", "Sodyum hidroksit", "Sodium hydroxide"], ["NaHCO₃", "Sodyum bikarbonat", "Sodium bicarbonate"], ["Na₂CO₃", "Sodyum karbonat", "Sodium carbonate"]],
    Mg: [["MgO", "Magnezyum oksit", "Magnesium oxide"], ["Mg(OH)₂", "Magnezyum hidroksit", "Magnesium hydroxide"], ["MgCl₂", "Magnezyum klorür", "Magnesium chloride"], ["MgSO₄", "Magnezyum sülfat", "Magnesium sulfate"]],
    Al: [["Al₂O₃", "Alüminyum oksit", "Aluminium oxide"], ["AlCl₃", "Alüminyum klorür", "Aluminium chloride"], ["Al(OH)₃", "Alüminyum hidroksit", "Aluminium hydroxide"], ["KAl(SO₄)₂", "Şap", "Alum"]],
    Si: [["SiO₂", "Silika", "Silica"], ["SiC", "Silisyum karbür", "Silicon carbide"], ["Na₂SiO₃", "Sodyum silikat", "Sodium silicate"]],
    P: [["H₃PO₄", "Fosforik asit", "Phosphoric acid"], ["P₄O₁₀", "Fosfor pentoksit", "Phosphorus pentoxide"], ["Ca₃(PO₄)₂", "Kalsiyum fosfat", "Calcium phosphate"], ["PH₃", "Fosfin", "Phosphine"]],
    S: [["H₂SO₄", "Sülfürik asit", "Sulfuric acid"], ["SO₂", "Sülfür dioksit", "Sulfur dioxide"], ["SO₃", "Sülfür trioksit", "Sulfur trioxide"], ["FeS₂", "Pirit", "Pyrite"]],
    Cl: [["HCl", "Hidrojen klorür", "Hydrogen chloride"], ["NaClO", "Sodyum hipoklorit", "Sodium hypochlorite"], ["NaCl", "Sodyum klorür", "Sodium chloride"], ["ClO₂", "Klor dioksit", "Chlorine dioxide"]],
    K: [["KCl", "Potasyum klorür", "Potassium chloride"], ["KOH", "Potasyum hidroksit", "Potassium hydroxide"], ["KNO₃", "Potasyum nitrat", "Potassium nitrate"], ["K₂CO₃", "Potasyum karbonat", "Potassium carbonate"]],
    Ca: [["CaCO₃", "Kalsiyum karbonat", "Calcium carbonate"], ["CaO", "Kalsiyum oksit", "Calcium oxide"], ["Ca(OH)₂", "Sönmüş kireç", "Slaked lime"], ["CaSO₄·2H₂O", "Alçı", "Gypsum"]],
    Ti: [["TiO₂", "Titanyum dioksit", "Titanium dioxide"], ["TiCl₄", "Titanyum tetraklorür", "Titanium tetrachloride"]],
    Cr: [["K₂Cr₂O₇", "Potasyum dikromat", "Potassium dichromate"], ["Cr₂O₃", "Krom(III) oksit", "Chromium(III) oxide"], ["CrO₃", "Krom trioksit", "Chromium trioxide"]],
    Mn: [["KMnO₄", "Potasyum permanganat", "Potassium permanganate"], ["MnO₂", "Manganez dioksit", "Manganese dioxide"], ["MnSO₄", "Manganez sülfat", "Manganese sulfate"]],
    Fe: [["Fe₂O₃", "Demir(III) oksit", "Iron(III) oxide"], ["Fe₃O₄", "Manyetit", "Magnetite"], ["FeSO₄·7H₂O", "Demir sülfat", "Iron sulfate"], ["FeCl₃", "Demir(III) klorür", "Iron(III) chloride"]],
    Co: [["CoCl₂", "Kobalt(II) klorür", "Cobalt(II) chloride"], ["Co₃O₄", "Kobalt oksit", "Cobalt oxide"]],
    Ni: [["NiSO₄", "Nikel sülfat", "Nickel sulfate"], ["Ni(OH)₂", "Nikel hidroksit", "Nickel hydroxide"], ["Ni(CO)₄", "Nikel karbonil", "Nickel carbonyl"]],
    Cu: [["CuSO₄·5H₂O", "Bakır sülfat", "Copper sulfate"], ["CuO", "Bakır(II) oksit", "Copper(II) oxide"], ["CuCl₂", "Bakır(II) klorür", "Copper(II) chloride"], ["Cu₂O", "Bakır(I) oksit", "Copper(I) oxide"]],
    Zn: [["ZnO", "Çinko oksit", "Zinc oxide"], ["ZnSO₄", "Çinko sülfat", "Zinc sulfate"], ["ZnCl₂", "Çinko klorür", "Zinc chloride"], ["ZnS", "Çinko sülfür", "Zinc sulfide"]],
    Ga: [["GaAs", "Galyum arsenit", "Gallium arsenide"], ["GaN", "Galyum nitrür", "Gallium nitride"], ["Ga₂O₃", "Galyum oksit", "Gallium oxide"]],
    Ge: [["GeO₂", "Germanyum dioksit", "Germanium dioxide"], ["GeCl₄", "Germanyum tetraklorür", "Germanium tetrachloride"]],
    As: [["As₂O₃", "Arsenik trioksit", "Arsenic trioxide"], ["AsH₃", "Arsin", "Arsine"], ["GaAs", "Galyum arsenit", "Gallium arsenide"]],
    Se: [["SeO₂", "Selenyum dioksit", "Selenium dioxide"], ["H₂Se", "Hidrojen selenür", "Hydrogen selenide"], ["Na₂SeO₃", "Sodyum selenit", "Sodium selenite"]],
    Br: [["HBr", "Hidrojen bromür", "Hydrogen bromide"], ["NaBr", "Sodyum bromür", "Sodium bromide"], ["AgBr", "Gümüş bromür", "Silver bromide"]],
    Kr: [["KrF₂", "Kripton diflorür", "Krypton difluoride"]],
    Rb: [["RbCl", "Rubidyum klorür", "Rubidium chloride"], ["RbOH", "Rubidyum hidroksit", "Rubidium hydroxide"]],
    Sr: [["SrCO₃", "Stronsiyum karbonat", "Strontium carbonate"], ["SrO", "Stronsiyum oksit", "Strontium oxide"], ["SrCl₂", "Stronsiyum klorür", "Strontium chloride"]],
    Y: [["Y₂O₃", "İtriyum oksit", "Yttrium oxide"], ["Y₃Al₅O₁₂", "YAG", "YAG"]],
    Zr: [["ZrO₂", "Zirkonyum dioksit", "Zirconium dioxide"], ["ZrCl₄", "Zirkonyum tetraklorür", "Zirconium tetrachloride"], ["ZrSiO₄", "Zirkon", "Zircon"]],
    Nb: [["Nb₂O₅", "Niyobyum pentoksit", "Niobium pentoxide"], ["NbC", "Niyobyum karbür", "Niobium carbide"]],
    Mo: [["MoS₂", "Molibden disülfür", "Molybdenum disulfide"], ["MoO₃", "Molibden trioksit", "Molybdenum trioxide"]],
    Tc: [["TcO₄⁻", "Perteknetat", "Pertechnetate"], ["Tc₂O₇", "Teknesyum heptoksit", "Technetium heptoxide"]],
    Ru: [["RuO₂", "Rutenyum dioksit", "Ruthenium dioxide"], ["RuCl₃", "Rutenyum klorür", "Ruthenium chloride"]],
    Pd: [["PdCl₂", "Paladyum klorür", "Palladium chloride"], ["Pd(OAc)₂", "Paladyum asetat", "Palladium acetate"]],
    Ag: [["AgNO₃", "Gümüş nitrat", "Silver nitrate"], ["AgCl", "Gümüş klorür", "Silver chloride"], ["AgBr", "Gümüş bromür", "Silver bromide"], ["Ag₂S", "Gümüş sülfür", "Silver sulfide"]],
    Cd: [["CdS", "Kadmiyum sülfür", "Cadmium sulfide"], ["CdTe", "Kadmiyum tellür", "Cadmium telluride"], ["CdCl₂", "Kadmiyum klorür", "Cadmium chloride"]],
    In: [["In₂O₃", "İndiyum oksit", "Indium oxide"], ["InP", "İndiyum fosfür", "Indium phosphide"], ["InCl₃", "İndiyum klorür", "Indium chloride"]],
    Sn: [["SnO₂", "Kalay dioksit", "Tin dioxide"], ["SnCl₂", "Kalay(II) klorür", "Tin(II) chloride"], ["SnF₂", "Kalay(II) florür", "Tin(II) fluoride"]],
    Sb: [["Sb₂O₃", "Antimon trioksit", "Antimony trioxide"], ["SbCl₃", "Antimon triklorür", "Antimony trichloride"], ["Sb₂S₃", "Antimon sülfür", "Antimony sulfide"]],
    Te: [["TeO₂", "Tellür dioksit", "Tellurium dioxide"], ["CdTe", "Kadmiyum tellür", "Cadmium telluride"], ["Na₂TeO₃", "Sodyum tellürit", "Sodium tellurite"]],
    I: [["KI", "Potasyum iyodür", "Potassium iodide"], ["AgI", "Gümüş iyodür", "Silver iodide"], ["HIO₃", "İyodik asit", "Iodic acid"]],
    Xe: [["XeF₂", "Ksenon diflorür", "Xenon difluoride"], ["XeF₄", "Ksenon tetraflorür", "Xenon tetrafluoride"], ["XeO₃", "Ksenon trioksit", "Xenon trioxide"]],
    Cs: [["CsCl", "Sezyum klorür", "Caesium chloride"], ["CsOH", "Sezyum hidroksit", "Caesium hydroxide"], ["CsI", "Sezyum iyodür", "Caesium iodide"]],
    Ba: [["BaSO₄", "Baryum sülfat", "Barium sulfate"], ["BaCO₃", "Baryum karbonat", "Barium carbonate"], ["BaCl₂", "Baryum klorür", "Barium chloride"], ["BaTiO₃", "Baryum titanat", "Barium titanate"]],
    La: [["La₂O₃", "Lantan oksit", "Lanthanum oxide"], ["LaCl₃", "Lantan klorür", "Lanthanum chloride"], ["LaNi₅", "Lantan nikel", "Lanthanum nickel"]],
    Ce: [["CeO₂", "Seryum dioksit", "Cerium dioxide"], ["CeCl₃", "Seryum klorür", "Cerium chloride"]],
    Nd: [["Nd₂O₃", "Neodim oksit", "Neodymium oxide"], ["NdFeB", "Neodim mıknatıs", "Neodymium magnet"]],
    Sm: [["Sm₂O₃", "Samaryum oksit", "Samarium oxide"], ["SmCo₅", "Samaryum kobalt", "Samarium cobalt"]],
    Eu: [["Eu₂O₃", "Evropyum oksit", "Europium oxide"], ["EuCl₃", "Evropyum klorür", "Europium chloride"]],
    Gd: [["Gd₂O₃", "Gadolinyum oksit", "Gadolinium oxide"], ["Gd-DTPA", "MRI kontrast maddesi", "MRI contrast agent"]],
    Tb: [["Tb₂O₃", "Terbiyum oksit", "Terbium oxide"], ["TbF₃", "Terbiyum florür", "Terbium fluoride"]],
    Dy: [["Dy₂O₃", "Disprozyum oksit", "Dysprosium oxide"], ["DyF₃", "Disprozyum florür", "Dysprosium fluoride"]],
    Er: [["Er₂O₃", "Erbiyum oksit", "Erbium oxide"], ["ErCl₃", "Erbiyum klorür", "Erbium chloride"]],
    Yb: [["Yb₂O₃", "İterbiyum oksit", "Ytterbium oxide"], ["YbCl₃", "İterbiyum klorür", "Ytterbium chloride"]],
    Lu: [["Lu₂O₃", "Lutesyum oksit", "Lutetium oxide"], ["LuCl₃", "Lutesyum klorür", "Lutetium chloride"]],
    Hf: [["HfO₂", "Hafniyum dioksit", "Hafnium dioxide"], ["HfCl₄", "Hafniyum tetraklorür", "Hafnium tetrachloride"]],
    Ta: [["Ta₂O₅", "Tantal pentoksit", "Tantalum pentoxide"], ["TaC", "Tantal karbür", "Tantalum carbide"]],
    W: [["WO₃", "Tungsten trioksit", "Tungsten trioxide"], ["WC", "Tungsten karbür", "Tungsten carbide"], ["Na₂WO₄", "Sodyum tungstat", "Sodium tungstate"]],
    Re: [["Re₂O₇", "Renyum heptoksit", "Rhenium heptoxide"], ["ReO₂", "Renyum dioksit", "Rhenium dioxide"]],
    Os: [["OsO₄", "Osmiyum tetroksit", "Osmium tetroxide"], ["OsCl₃", "Osmiyum klorür", "Osmium chloride"]],
    Ir: [["IrO₂", "İridyum dioksit", "Iridium dioxide"], ["IrCl₃", "İridyum klorür", "Iridium chloride"]],
    Pt: [["PtCl₂", "Platin klorür", "Platinum chloride"], ["H₂PtCl₆", "Kloroplatinik asit", "Chloroplatinic acid"], ["Pt(NH₃)₂Cl₂", "Sisplatin", "Cisplatin"]],
    Au: [["HAuCl₄", "Kloroaurik asit", "Chloroauric acid"], ["AuCl₃", "Altın(III) klorür", "Gold(III) chloride"], ["Au₂O₃", "Altın(III) oksit", "Gold(III) oxide"]],
    Hg: [["HgS", "Cıva sülfür", "Mercury sulfide"], ["HgO", "Cıva(II) oksit", "Mercury(II) oxide"], ["HgCl₂", "Cıva(II) klorür", "Mercury(II) chloride"], ["Hg₂Cl₂", "Kalomel", "Calomel"]],
    Tl: [["Tl₂O₃", "Talyum oksit", "Thallium oxide"], ["TlCl", "Talyum klorür", "Thallium chloride"]],
    Pb: [["PbO", "Kurşun(II) oksit", "Lead(II) oxide"], ["PbO₂", "Kurşun(IV) oksit", "Lead(IV) oxide"], ["PbSO₄", "Kurşun sülfat", "Lead sulfate"], ["Pb(NO₃)₂", "Kurşun nitrat", "Lead nitrate"]],
    Bi: [["Bi₂O₃", "Bizmut oksit", "Bismuth oxide"], ["BiCl₃", "Bizmut klorür", "Bismuth chloride"], ["Bi₂S₃", "Bizmut sülfür", "Bismuth sulfide"]],
    Po: [["PoO₂", "Polonyum dioksit", "Polonium dioxide"], ["PoCl₄", "Polonyum tetraklorür", "Polonium tetrachloride"]],
    Ra: [["RaCl₂", "Radyum klorür", "Radium chloride"], ["RaSO₄", "Radyum sülfat", "Radium sulfate"]],
    Ac: [["Ac₂O₃", "Aktinyum oksit", "Actinium oxide"], ["AcCl₃", "Aktinyum klorür", "Actinium chloride"]],
    Th: [["ThO₂", "Toryum dioksit", "Thorium dioxide"], ["ThF₄", "Toryum tetraflorür", "Thorium tetrafluoride"]],
    Pa: [["Pa₂O₅", "Protaktinyum pentoksit", "Protactinium pentoxide"], ["PaCl₅", "Protaktinyum pentaklorür", "Protactinium pentachloride"]],
    U: [["UO₂", "Uranyum dioksit", "Uranium dioxide"], ["U₃O₈", "Triuranium oktoksit", "Triuranium octoxide"], ["UF₆", "Uranyum heksaflorür", "Uranium hexafluoride"]],
    Np: [["NpO₂", "Neptünyum dioksit", "Neptunium dioxide"], ["NpF₆", "Neptünyum heksaflorür", "Neptunium hexafluoride"]],
    Pu: [["PuO₂", "Plütonyum dioksit", "Plutonium dioxide"], ["PuF₆", "Plütonyum heksaflorür", "Plutonium hexafluoride"]],
    Am: [["AmO₂", "Amerikyum dioksit", "Americium dioxide"], ["AmF₃", "Amerikyum florür", "Americium fluoride"]],
    Cm: [["Cm₂O₃", "Küriyum oksit", "Curium oxide"], ["CmF₃", "Küriyum florür", "Curium fluoride"]]
  };

  const USES = {
    H: [["energy", "Yakıt hücreleri ve roket yakıtı", "Fuel cells and rocket propellant"], ["industry", "Amonyak ve metanol üretimi", "Ammonia and methanol production"], ["energy", "Temiz enerji depolama", "Clean energy storage"]],
    He: [["technology", "MRI ve süper iletken soğutma", "MRI and superconductor cooling"], ["everyday", "Balonlar ve koruyucu atmosfer", "Balloons and protective atmospheres"], ["industry", "Sızıntı dedektörleri", "Leak detection"]],
    Li: [["energy", "Li-iyon piller", "Li-ion batteries"], ["medicine", "Bipolar bozukluk tedavisi", "Bipolar disorder treatment"], ["industry", "Cam, seramik ve alaşımlar", "Glass, ceramics and alloys"]],
    Be: [["technology", "X-ışını pencereleri", "X-ray windows"], ["industry", "Havacılık alaşımları", "Aerospace alloys"], ["energy", "Nükleer moderatör", "Nuclear moderator"]],
    B: [["industry", "Borosilikat cam ve deterjan", "Borosilicate glass and detergents"], ["energy", "Nükleer kontrol çubukları", "Nuclear control rods"], ["technology", "Zırh ve kompozitler", "Armour and composites"]],
    C: [["energy", "Yakıt ve indirgeyici", "Fuel and reducing agent"], ["industry", "Çelik üretimi ve karbon fiber", "Steelmaking and carbon fibre"], ["everyday", "Elmas, grafit ve mürekkep", "Diamond, graphite and ink"]],
    N: [["industry", "Gübre ve amonyak", "Fertilizers and ammonia"], ["everyday", "Gıda ambalajı ve soğutma", "Food packaging and cooling"], ["medicine", "Kriyoterapi", "Cryotherapy"]],
    O: [["medicine", "Tıbbi oksijen ve solunum desteği", "Medical oxygen and respiratory support"], ["industry", "Çelik üretimi ve kesme", "Steelmaking and cutting"], ["energy", "Roket oksitleyici ve yakıt hücresi", "Rocket oxidizer and fuel cells"]],
    F: [["everyday", "Diş macunu ve florürlü su", "Toothpaste and fluoridated water"], ["industry", "Teflon ve soğutucu gazlar", "Teflon and refrigerants"], ["energy", "Uranyum zenginleştirme", "Uranium enrichment"]],
    Ne: [["everyday", "Neon ışık tabelaları", "Neon signs"], ["technology", "Lazerler ve yüksek gerilim göstergeleri", "Lasers and high-voltage indicators"], ["industry", "Kriyojenik soğutma", "Cryogenic cooling"]],
    Na: [["everyday", "Tuz ve kabartma tozu", "Salt and baking soda"], ["industry", "Sabun, cam ve kâğıt", "Soap, glass and paper"], ["energy", "Sodyum-soğutmalı reaktörler", "Sodium-cooled reactors"]],
    Mg: [["everyday", "Magnezyum takviyeleri", "Magnesium supplements"], ["industry", "Hafif alaşımlar", "Lightweight alloys"], ["technology", "Parlama ve piroteknik", "Flares and pyrotechnics"]],
    Al: [["everyday", "İçecek kutuları ve folyo", "Cans and foil"], ["industry", "Havacılık ve otomotiv", "Aerospace and automotive"], ["technology", "Elektronik ve inşaat", "Electronics and construction"]],
    Si: [["technology", "Yarı iletken çipler", "Semiconductor chips"], ["industry", "Cam, beton ve seramik", "Glass, concrete and ceramics"], ["energy", "Güneş panelleri", "Solar panels"]],
    P: [["industry", "Gübre ve deterjan", "Fertilizers and detergents"], ["biology", "DNA, ATP ve kemik yapısı", "DNA, ATP and bones"], ["everyday", "Kibrit ve havai fişek", "Matches and fireworks"]],
    S: [["industry", "Sülfürik asit üretimi", "Sulfuric acid production"], ["medicine", "Sülfa ilaçları ve merhemler", "Sulfa drugs and ointments"], ["everyday", "Vulkanizasyon ve gübre", "Vulcanization and fertilizers"]],
    Cl: [["everyday", "Su dezenfeksiyonu ve tuz", "Water disinfection and salt"], ["industry", "PVC ve çözücüler", "PVC and solvents"], ["medicine", "İlaç sentezi", "Drug synthesis"]],
    Ar: [["industry", "Kaynak koruyucu gazı", "Welding shielding gas"], ["technology", "Ampuller ve çift cam", "Light bulbs and insulated glazing"], ["biology", "Hassas atmosfer ve hücre kültürü", "Inert atmospheres and cell culture"]],
    K: [["biology", "Sinir iletimi ve hücre dengesi", "Nerve signalling and cell balance"], ["industry", "Gübre ve sabun", "Fertilizers and soap"], ["everyday", "Muz ve kuru meyve", "Bananas and dried fruit"]],
    Ca: [["biology", "Kemik ve diş yapısı", "Bones and teeth"], ["industry", "Çimento ve kireç", "Cement and lime"], ["medicine", "Kalsiyum takviyeleri", "Calcium supplements"]],
    Ti: [["industry", "Havacılık ve tıbbi implantlar", "Aerospace and medical implants"], ["technology", "Beyaz pigment (TiO₂)", "White pigment (TiO₂)"], ["everyday", "Saat ve spor ekipmanları", "Watches and sports gear"]],
    Cr: [["industry", "Paslanmaz çelik", "Stainless steel"], ["technology", "Krom kaplama ve pigment", "Chrome plating and pigments"], ["biology", "İnsülin etkisinde iz element", "Trace element in insulin action"]],
    Mn: [["industry", "Çelik ve alaşımlar", "Steel and alloys"], ["energy", "Kuru pil ve bataryalar", "Dry cells and batteries"], ["agriculture", "Gübre ve enzimler", "Fertilizers and enzymes"]],
    Fe: [["industry", "Çelik ve inşaat", "Steel and construction"], ["biology", "Hemoglobin ve oksijen taşınımı", "Haemoglobin and oxygen transport"], ["everyday", "Mıknatıslar ve mutfak eşyaları", "Magnets and cookware"]],
    Co: [["energy", "Li-iyon pil katotları", "Li-ion battery cathodes"], ["technology", "Süper alaşımlar ve mıknatıslar", "Superalloys and magnets"], ["medicine", "Kobalt-60 radyoterapisi", "Cobalt-60 radiotherapy"]],
    Ni: [["industry", "Paslanmaz çelik ve alaşımlar", "Stainless steel and alloys"], ["energy", "Piller ve yakıt hücreleri", "Batteries and fuel cells"], ["everyday", "Madeni paralar ve kaplama", "Coins and plating"]],
    Cu: [["technology", "Elektrik kabloları ve elektronik", "Electrical wiring and electronics"], ["industry", "Alaşımlar ve borular", "Alloys and pipes"], ["biology", "Bakır enzimleri", "Copper enzymes"]],
    Zn: [["industry", "Galvanizleme ve alaşımlar", "Galvanizing and alloys"], ["biology", "Bağışıklık ve enzimler", "Immunity and enzymes"], ["everyday", "Pil ve çinko takviyeleri", "Batteries and zinc supplements"]],
    Ga: [["technology", "LED ve yarı iletkenler", "LEDs and semiconductors"], ["medicine", "Ga-68 görüntüleme", "Ga-68 imaging"], ["everyday", "Düşük sıcaklık lehimleri", "Low-temperature solders"]],
    Ge: [["technology", "Kızılötesi optik ve fiber", "Infrared optics and fibre"], ["energy", "Güneş hücreleri", "Solar cells"], ["industry", "Alaşımlar ve katalizörler", "Alloys and catalysts"]],
    As: [["technology", "GaAs yarı iletkenleri", "GaAs semiconductors"], ["industry", "Ahşap koruyucu ve alaşımlar", "Wood preservatives and alloys"], ["medicine", "Bazı lösemi tedavileri", "Some leukaemia treatments"]],
    Se: [["everyday", "Cam ve seramik renklendirme", "Glass and ceramic colouring"], ["biology", "Antioksidan iz element", "Antioxidant trace element"], ["technology", "Fotokopi ve güneş hücreleri", "Photocopiers and solar cells"]],
    Br: [["industry", "Alev geciktiriciler", "Flame retardants"], ["medicine", "Bazı ilaç ve antiseptikler", "Some drugs and antiseptics"], ["everyday", "Fotoğrafçılık ve su arıtma", "Photography and water treatment"]],
    Kr: [["technology", "Yüksek performanslı aydınlatma", "High-performance lighting"], ["industry", "Lazer ve yalıtım gazı", "Lasers and insulating gas"], ["energy", "Nükleer fisyon ölçümü", "Nuclear fission measurement"]],
    Rb: [["technology", "Atom saatleri", "Atomic clocks"], ["medicine", "Rb-82 PET görüntüleme", "Rb-82 PET imaging"], ["industry", "Fotoelektrik hücreler", "Photoelectric cells"]],
    Sr: [["everyday", "Havai fişek ve kırmızı fosfor", "Fireworks and red phosphors"], ["medicine", "Sr-89 kemik ağrısı tedavisi", "Sr-89 bone pain treatment"], ["technology", "Seramik ve mıknatıslar", "Ceramics and magnets"]],
    Y: [["technology", "LED fosforları ve YAG lazerleri", "LED phosphors and YAG lasers"], ["industry", "Seramik ve süper iletkenler", "Ceramics and superconductors"], ["medicine", "Y-90 radyoterapisi", "Y-90 radiotherapy"]],
    Zr: [["energy", "Nükleer yakıt kaplaması", "Nuclear fuel cladding"], ["industry", "Zirkonya seramikleri", "Zirconia ceramics"], ["technology", "Kimyasal reaktörler", "Chemical reactors"]],
    Nb: [["energy", "Süper iletken mıknatıslar", "Superconducting magnets"], ["industry", "Yüksek mukavemetli çelik", "High-strength steel"], ["technology", "MRI ve parçacık hızlandırıcılar", "MRI and particle accelerators"]],
    Mo: [["industry", "Çelik alaşımları", "Steel alloys"], ["biology", "Nitrojenaz ve enzimler", "Nitrogenase and enzymes"], ["technology", "Yağlayıcı ve katalizör", "Lubricants and catalysts"]],
    Tc: [["medicine", "Tc-99m tanı görüntüleme", "Tc-99m diagnostic imaging"], ["industry", "Korozyon inhibitörü", "Corrosion inhibitor"], ["research", "Radyoaktif izleyici", "Radioactive tracer"]],
    Ru: [["technology", "Elektronik ve katalizörler", "Electronics and catalysts"], ["industry", "Sert disk kaplamaları", "Hard-disk coatings"], ["medicine", "Kanser araştırmaları", "Cancer research"]],
    Rh: [["industry", "Otomotiv katalizörleri", "Automotive catalysts"], ["technology", "Elektronik kontaklar", "Electrical contacts"], ["everyday", "Mücevher kaplama", "Jewellery plating"]],
    Pd: [["industry", "Katalizörler ve hidrojen arıtma", "Catalysts and hydrogen purification"], ["technology", "Elektronik ve sensörler", "Electronics and sensors"], ["medicine", "Diş hekimliği alaşımları", "Dental alloys"]],
    Ag: [["technology", "Elektrik iletkenleri ve aynalar", "Electrical conductors and mirrors"], ["medicine", "Antibakteriyel yaralar", "Antibacterial wound care"], ["everyday", "Mücevher ve fotoğrafçılık", "Jewellery and photography"]],
    Cd: [["energy", "CdTe güneş hücreleri", "CdTe solar cells"], ["industry", "Pigmentler ve kaplama", "Pigments and plating"], ["technology", "Ni-Cd piller", "Ni-Cd batteries"]],
    In: [["technology", "Dokunmatik ekranlar (ITO)", "Touchscreens (ITO)"], ["energy", "CIGS güneş hücreleri", "CIGS solar cells"], ["industry", "Lehimler ve yarı iletkenler", "Solders and semiconductors"]],
    Sn: [["industry", "Lehim ve kalay kaplama", "Solder and tin plating"], ["everyday", "Konserve kutuları ve bronz", "Cans and bronze"], ["technology", "PVC stabilizatörü", "PVC stabilizer"]],
    Sb: [["industry", "Alev geciktiriciler", "Flame retardants"], ["technology", "Yarı iletkenler ve alaşımlar", "Semiconductors and alloys"], ["everyday", "Pil ve lehim", "Batteries and solder"]],
    Te: [["energy", "CdTe güneş hücreleri", "CdTe solar cells"], ["technology", "Termoelektrik cihazlar", "Thermoelectric devices"], ["industry", "Metal işleme ve alaşımlar", "Metal machining and alloys"]],
    I: [["medicine", "Antiseptik ve tiroid tedavisi", "Antiseptics and thyroid treatment"], ["everyday", "İyotlu tuz", "Iodized salt"], ["industry", "Fotoğraf ve ilaç sentezi", "Photography and drug synthesis"]],
    Xe: [["technology", "Yüksek yoğunluklu aydınlatma", "High-intensity lighting"], ["medicine", "Anestezi ve Xe-133 görüntüleme", "Anaesthesia and Xe-133 imaging"], ["energy", "İyon iticileri", "Ion thrusters"]],
    Cs: [["technology", "Atom saatleri", "Atomic clocks"], ["energy", "Petrol sondaj sıvıları", "Oil drilling fluids"], ["medicine", "Cs-137 radyoterapisi", "Cs-137 radiotherapy"]],
    Ba: [["medicine", "Baryum kontrast görüntüleme", "Barium contrast imaging"], ["industry", "Sondaj ve cam", "Drilling and glass"], ["everyday", "Havai fişek (yeşil)", "Fireworks (green)"]],
    La: [["technology", "Kamera lensleri ve fosforlar", "Camera lenses and phosphors"], ["energy", "NiMH piller", "NiMH batteries"], ["industry", "Katalizörler", "Catalysts"]],
    Ce: [["industry", "Cam parlatma ve katalizör", "Glass polishing and catalysts"], ["everyday", "Çakmak taşı", "Lighter flints"], ["technology", "LED fosforları", "LED phosphors"]],
    Nd: [["technology", "NdFeB süper mıknatıslar", "NdFeB supermagnets"], ["energy", "Rüzgar türbinleri ve EV motorları", "Wind turbines and EV motors"], ["medicine", "Nd:YAG lazerleri", "Nd:YAG lasers"]],
    Sm: [["technology", "SmCo mıknatıslar", "SmCo magnets"], ["energy", "Nükleer reaktör kontrolü", "Nuclear reactor control"], ["medicine", "Sm-153 ağrı tedavisi", "Sm-153 pain treatment"]],
    Eu: [["technology", "Kırmızı fosforlar ve LED", "Red phosphors and LEDs"], ["everyday", "Euro banknot güvenlik mürekkebi", "Euro banknote security ink"], ["medicine", "Floresan sensörler", "Fluorescent sensors"]],
    Gd: [["medicine", "MRI kontrast maddesi", "MRI contrast agent"], ["technology", "Manyetik soğutma", "Magnetic refrigeration"], ["energy", "Nötron absorbe edici", "Neutron absorber"]],
    Tb: [["technology", "Yeşil fosforlar", "Green phosphors"], ["energy", "Manyetostriktif sensörler", "Magnetostrictive sensors"], ["industry", "Yakıt hücresi katalizörleri", "Fuel-cell catalysts"]],
    Dy: [["technology", "Yüksek sıcaklık mıknatısları", "High-temperature magnets"], ["energy", "EV motorları", "EV motors"], ["industry", "Nükleer kontrol çubukları", "Nuclear control rods"]],
    Er: [["technology", "Fiber optik yükselteçler", "Fibre-optic amplifiers"], ["medicine", "Er:YAG lazerleri", "Er:YAG lasers"], ["industry", "Cam renklendirme", "Glass colouring"]],
    Yb: [["technology", "Fiber lazerler ve atom saatleri", "Fibre lasers and atomic clocks"], ["energy", "Yb:YAG lazerleri", "Yb:YAG lasers"], ["research", "Stres ölçüm sensörleri", "Stress sensors"]],
    Lu: [["medicine", "Lu-177 radyoterapisi", "Lu-177 radiotherapy"], ["technology", "PET dedektörleri", "PET detectors"], ["industry", "Katalizörler", "Catalysts"]],
    Hf: [["technology", "Yüksek-k dielektrik yalıtkanlar", "High-k dielectrics"], ["energy", "Nükleer kontrol çubukları", "Nuclear control rods"], ["industry", "Süper alaşımlar", "Superalloys"]],
    Ta: [["technology", "Mini kondansatörler", "Miniature capacitors"], ["medicine", "Cerrahi implantlar", "Surgical implants"], ["industry", "Kesici takımlar", "Cutting tools"]],
    W: [["industry", "Kesici takımlar ve tungsten karbür", "Cutting tools and tungsten carbide"], ["technology", "Ampul filamentleri ve elektrotlar", "Lamp filaments and electrodes"], ["energy", "Nükleer kalkanlama", "Nuclear shielding"]],
    Re: [["technology", "Jet motoru süper alaşımları", "Jet-engine superalloys"], ["industry", "Katalizörler", "Catalysts"], ["medicine", "Re-188 tedavisi", "Re-188 therapy"]],
    Os: [["industry", "Çok sert alaşımlar", "Very hard alloys"], ["technology", "Elektrik kontakları", "Electrical contacts"], ["research", "OsO₄ doku boyama", "OsO₄ tissue staining"]],
    Ir: [["technology", "Buji ve elektrotlar", "Spark plugs and electrodes"], ["industry", "Katalizörler", "Catalysts"], ["everyday", "Kalem uçları", "Pen nibs"]],
    Pt: [["industry", "Otomotiv katalizörleri", "Automotive catalysts"], ["medicine", "Kanser ilaçları (sisplatin)", "Cancer drugs (cisplatin)"], ["everyday", "Mücevher ve laboratuvar ekipmanı", "Jewellery and lab equipment"]],
    Au: [["everyday", "Mücevher ve rezerv para", "Jewellery and reserves"], ["technology", "Elektronik kontaklar ve uzay kaplama", "Electronic contacts and space coatings"], ["medicine", "Romatizma ve kanser tedavisi", "Arthritis and cancer therapy"]],
    Hg: [["technology", "Floresan lambalar ve sensörler", "Fluorescent lamps and sensors"], ["industry", "Klor-alkali süreç (geçmişte)", "Chlor-alkali process (historically)"], ["medicine", "Termometre ve tansiyon ölçer (geçmişte)", "Thermometers and blood pressure devices (historically)"]],
    Tl: [["technology", "Kızılötesi dedektörler", "Infrared detectors"], ["medicine", "Tl-201 kalp görüntüleme", "Tl-201 cardiac imaging"], ["industry", "Yüksek sıcaklık süper iletkenleri", "High-temperature superconductors"]],
    Pb: [["energy", "Kurşun-asit aküler", "Lead-acid batteries"], ["industry", "Radyasyon kalkanlama", "Radiation shielding"], ["everyday", "Lehim ve eski borular", "Solder and legacy pipes"]],
    Bi: [["medicine", "Mide ilaçları ve bizmut bileşikleri", "Stomach medicines and bismuth compounds"], ["industry", "Düşük erime noktalı alaşımlar", "Low-melting alloys"], ["everyday", "Kozmetik ve pigment", "Cosmetics and pigments"]],
    Po: [["research", "Alfa kaynağı ve statik giderici", "Alpha source and static eliminator"], ["energy", "Uzay termoelektrik güç kaynağı", "Space thermoelectric power"], ["medicine", "Radyoterapi araştırmaları", "Radiotherapy research"]],
    At: [["research", "Astatini araştırma ve hedefe yönelik tedavi", "Astatine research and targeted therapy"]],
    Rn: [["medicine", "Radon tedavisi (tarihsel)", "Radon therapy (historical)"], ["research", "Jeolojik izleyici", "Geological tracer"]],
    Fr: [["research", "Temel atom fiziği araştırmaları", "Fundamental atomic physics"]],
    Ra: [["medicine", "Ra-223 kemik kanseri tedavisi", "Ra-223 bone cancer therapy"], ["research", "Radyum saati ve kalibrasyon", "Radium clocks and calibration"]],
    Ac: [["medicine", "Ac-225 hedefe yönelik alfa tedavisi", "Ac-225 targeted alpha therapy"], ["research", "Nükleer araştırma", "Nuclear research"]],
    Th: [["energy", "Toryum yakıt döngüsü", "Thorium fuel cycle"], ["industry", "Yüksek sıcaklık seramikleri", "High-temperature ceramics"], ["technology", "Gaz lambası örtüsü (geçmişte)", "Gas mantles (historically)"]],
    Pa: [["research", "Nükleer yapı araştırmaları", "Nuclear structure research"]],
    U: [["energy", "Nükleer yakıt", "Nuclear fuel"], ["medicine", "U-235 izotop üretimi", "U-235 isotope production"], ["industry", "Zırh ve denge ağırlığı", "Armour and counterweights"]],
    Np: [["research", "Nükleer izleyici", "Nuclear tracer"], ["energy", "Np-237 yakıt döngüsü araştırmaları", "Np-237 fuel-cycle research"]],
    Pu: [["energy", "Nükleer yakıt ve RTG", "Nuclear fuel and RTG"], ["research", "Nükleer silah araştırmaları", "Nuclear weapons research"]],
    Am: [["everyday", "İyonizasyonlu duman dedektörü", "Ionization smoke detectors"], ["research", "Nötron kaynağı", "Neutron source"]],
    Cm: [["energy", "Uzay RTG güç kaynağı", "Space RTG power"], ["research", "Alfa parçacık kaynağı", "Alpha particle source"]]
  };

  const CATEGORY_USES = {
    "alkali-metal": [["industry", "Kimyasal sentez ve elektrolitler", "Chemical synthesis and electrolytes"], ["energy", "Pil ve reaktör soğutucuları", "Batteries and reactor coolants"]],
    "alkaline-earth-metal": [["industry", "Alaşımlar ve refrakter malzemeler", "Alloys and refractory materials"], ["everyday", "İlaç, gıda ve inşaat", "Medicine, food and construction"]],
    "transition-metal": [["industry", "Alaşımlar ve katalizörler", "Alloys and catalysts"], ["technology", "Elektronik ve manyetik malzemeler", "Electronics and magnetic materials"]],
    "post-transition-metal": [["industry", "Alaşımlar ve lehimler", "Alloys and solders"], ["everyday", "Kaplama, pigment ve ambalaj", "Coatings, pigments and packaging"]],
    metalloid: [["technology", "Yarı iletkenler ve sensörler", "Semiconductors and sensors"], ["industry", "Cam, seramik ve alaşımlar", "Glass, ceramics and alloys"]],
    nonmetal: [["biology", "Biyolojik moleküller ve solunum", "Biomolecules and respiration"], ["industry", "Kimyasal sentez ve yakıtlar", "Chemical synthesis and fuels"]],
    halogen: [["everyday", "Dezenfeksiyon ve tuzlar", "Disinfection and salts"], ["industry", "Polimerler ve ilaçlar", "Polymers and pharmaceuticals"]],
    "noble-gas": [["industry", "Koruyucu atmosfer ve kaynak", "Protective atmospheres and welding"], ["technology", "Aydınlatma, lazer ve kriyojeni", "Lighting, lasers and cryogenics"]],
    lanthanide: [["technology", "Mıknatıslar ve fosforlar", "Magnets and phosphors"], ["energy", "Pil, katalizör ve rüzgar türbini", "Batteries, catalysts and wind turbines"]],
    actinide: [["energy", "Nükleer yakıt ve araştırma", "Nuclear fuel and research"], ["medicine", "Hedefe yönelik alfa tedavisi", "Targeted alpha therapy"]],
    unknown: [["research", "Temel nükleer araştırma", "Fundamental nuclear research"]]
  };

  const GHS_ICON = {
    "01": "💥", "02": "🔥", "03": "⭕", "04": "💨",
    "05": "🧪", "06": "☠️", "07": "⚠️", "08": "🫁", "09": "🌍"
  };

  const H_PHRASES = {
    H220: bi("Son derece yanıcı gaz.", "Extremely flammable gas."),
    H221: bi("Yanıcı gaz.", "Flammable gas."),
    H222: bi("Son derece yanıcı aerosol.", "Extremely flammable aerosol."),
    H223: bi("Yanıcı aerosol.", "Flammable aerosol."),
    H224: bi("Son derece yanıcı sıvı ve buhar.", "Extremely flammable liquid and vapour."),
    H225: bi("Kolayca alev alan sıvı ve buhar.", "Highly flammable liquid and vapour."),
    H226: bi("Yanıcı sıvı ve buhar.", "Flammable liquid and vapour."),
    H227: bi("Yanabilir sıvı.", "Combustible liquid."),
    H228: bi("Yanıcı katı.", "Flammable solid."),
    H229: bi("Basınçlı kap; ısıtılırsa patlayabilir.", "Pressurised container: may burst if heated."),
    H250: bi("Havaya maruz kaldığında kendiliğinden tutuşur.", "Catches fire spontaneously if exposed to air."),
    H251: bi("Kendiliğinden ısınır; yangın riski.", "Self-heating; may catch fire."),
    H260: bi("Su ile temas ettiğinde yanıcı gaz açığa çıkarır.", "In contact with water releases flammable gases."),
    H261: bi("Su ile temas ettiğinde yanıcı gaz açığa çıkarır.", "In contact with water releases flammable gas."),
    H270: bi("Yangına yol açabilir veya yangını şiddetlendirebilir; oksitleyici.", "May cause or intensify fire; oxidizer."),
    H271: bi("Yangına veya patlamaya yol açabilir; güçlü oksitleyici.", "May cause fire or explosion; strong oxidizer."),
    H272: bi("Yangını şiddetlendirebilir; oksitleyici.", "May intensify fire; oxidizer."),
    H280: bi("Basınçlı gaz içerir; ısıtılırsa patlayabilir.", "Contains gas under pressure; may explode if heated."),
    H281: bi("Soğutulmuş gaz içerir; soğuk yanıklarına yol açabilir.", "Contains refrigerated gas; may cause cryogenic burns."),
    H290: bi("Metalleri aşındırabilir.", "May be corrosive to metals."),
    H300: bi("Yutulduğunda ölümcüldür.", "Fatal if swallowed."),
    H301: bi("Yutulduğunda toksiktir.", "Toxic if swallowed."),
    H302: bi("Yutulduğunda zararlıdır.", "Harmful if swallowed."),
    H304: bi("Yutulup solunum yoluna ulaşırsa ölümcül olabilir.", "May be fatal if swallowed and enters airways."),
    H310: bi("Cilt ile temasında ölümcüldür.", "Fatal in contact with skin."),
    H311: bi("Cilt ile temasında toksiktir.", "Toxic in contact with skin."),
    H312: bi("Cilt ile temasında zararlıdır.", "Harmful in contact with skin."),
    H314: bi("Ciddi cilt yanıklarına ve göz hasarına yol açar.", "Causes severe skin burns and eye damage."),
    H315: bi("Cilt tahrişine yol açar.", "Causes skin irritation."),
    H317: bi("Alerjik cilt reaksiyonuna yol açabilir.", "May cause an allergic skin reaction."),
    H318: bi("Ciddi göz hasarına yol açar.", "Causes serious eye damage."),
    H319: bi("Ciddi göz tahrişine yol açar.", "Causes serious eye irritation."),
    H330: bi("Solunduğunda ölümcüldür.", "Fatal if inhaled."),
    H331: bi("Solunduğunda toksiktir.", "Toxic if inhaled."),
    H332: bi("Solunduğunda zararlıdır.", "Harmful if inhaled."),
    H335: bi("Solunum yolu tahrişine yol açabilir.", "May cause respiratory irritation."),
    H336: bi("Uyuşukluk veya baş dönmesine yol açabilir.", "May cause drowsiness or dizziness."),
    H340: bi("Genetik hasara yol açabilir.", "May cause genetic defects."),
    H350: bi("Kansere yol açabilir.", "May cause cancer."),
    H351: bi("Kansere yol açtığından şüphelenilmektedir.", "Suspected of causing cancer."),
    H360: bi("Doğurganlığa veya doğmamış çocuğa zarar verebilir.", "May damage fertility or the unborn child."),
    H360D: bi("Doğmamış çocuğa zarar verebilir.", "May damage the unborn child."),
    H361: bi("Doğurganlığa veya doğmamış çocuğa zarar verebilir.", "Suspected of damaging fertility or the unborn child."),
    H370: bi("Organlara hasar verir.", "Causes damage to organs."),
    H372: bi("Uzun süreli maruziyette organlara hasar verir.", "Causes damage to organs through prolonged exposure."),
    H373: bi("Uzun süreli maruziyette organlara hasar verebilir.", "May cause damage to organs through prolonged exposure."),
    H400: bi("Sucul yaşam için çok toksiktir.", "Very toxic to aquatic life."),
    H410: bi("Uzun süreli etkilerle sucul yaşam için çok toksiktir.", "Very toxic to aquatic life with long-lasting effects."),
    H411: bi("Uzun süreli etkilerle sucul yaşam için toksiktir.", "Toxic to aquatic life with long-lasting effects."),
    H412: bi("Uzun süreli etkilerle sucul yaşam için zararlıdır.", "Harmful to aquatic life with long-lasting effects."),
    H413: bi("Sucul yaşam için uzun süreli zararlı etkileri olabilir.", "May cause long-lasting harmful effects to aquatic life."),
    EUH014: bi("Su ile şiddetle tepkime verir.", "Reacts violently with water."),
    EUH029: bi("Su ile temasında toksik gaz açığa çıkarır.", "Contact with water liberates toxic gas."),
    EUH031: bi("Asitlerle temasında toksik gaz açığa çıkarır.", "Contact with acids liberates toxic gas."),
    EUH032: bi("Asitlerle temasında çok toksik gaz açığa çıkarır.", "Contact with acids liberates very toxic gas."),
    EUH044: bi("Kapalı ortamda ısıtıldığında patlama riski.", "Risk of explosion if heated under confinement."),
    EUH059: bi("Ozon tabakası için tehlikelidir.", "Hazardous to the ozone layer."),
    EUH201: bi("Kurşun içerir; çocukların erişemeyeceği yerde saklayın.", "Contains lead; keep out of reach of children."),
    EUH202: bi("Siyanoakrilat; cilde ve gözlere yapışır.", "Cyanoacrylate; bonds skin and eyes."),
    EUH203: bi("Krom(VI) içerir; alerjiye yol açabilir.", "Contains chromium(VI); may cause an allergic reaction."),
    EUH204: bi("İzosiyanat içerir; alerjiye yol açabilir.", "Contains isocyanates; may cause an allergic reaction."),
    EUH205: bi("Epoksi bileşenleri içerir; alerjiye yol açabilir.", "Contains epoxy constituents; may cause an allergic reaction."),
    EUH206: bi("Dikkat: Basınçlı kaplarla birlikte kullanmayın.", "Warning: do not use with pressurised containers."),
    EUH207: bi("Dikkat: Kadmiyum içerir; toksik buhar oluşturur.", "Warning: contains cadmium; toxic fumes."),
    EUH208: bi("Alerjik reaksiyona yol açabilir.", "May produce an allergic reaction."),
    EUH209: bi("Kullanım sırasında kolayca yanıcı hâle gelebilir.", "Can become highly flammable in use."),
    EUH210: bi("Talep üzerine güvenlik bilgi formu sağlanır.", "Safety data sheet available on request."),
    EUH211: bi("Dikkat: Püskürtme sırasında tehlikeli solunabilir damlacıklar oluşabilir.", "Warning: hazardous respirable droplets may be formed when spraying."),
    EUH401: bi("İnsan sağlığı ve çevreye yönelik riskleri önlemek için kullanım talimatlarına uyun.", "Follow the instructions to avoid risks to human health and the environment.")
  };

  function hPhrase(code) {
    const key = "H" + String(code).split(/[A-Za-z+]/)[0];
    return H_PHRASES[key] || H_PHRASES["H" + code] || null;
  }

  function genericReactions(el) {
    const cat = el.category;
    const sym = el.symbol;
    const n = chargeOf(el);
    const out = [];
    if (cat === "alkali-metal") {
      out.push(R(`2${sym} + 2H₂O → 2${sym}OH + H₂↑`, "Su ile", "With water", "Şiddetli tepkime; hidrojen açığa çıkar.", "Vigorous reaction; hydrogen is released."));
      out.push(metalOxide(sym, 1));
      out.push(metalChloride(sym, 1));
    } else if (cat === "alkaline-earth-metal") {
      if (["Be", "Mg"].includes(sym)) {
        out.push(R(`${sym} + H₂O(g) → ${sym}O + H₂`, "Buharla", "With steam", "Yalnızca ısıtıldığında belirgin.", "Significant only when heated."));
      } else {
        out.push(R(`${sym} + 2H₂O → ${sym}(OH)₂ + H₂↑`, "Su ile", "With water", "Hidroksit ve hidrojen oluşur.", "Hydroxide and hydrogen form."));
      }
      out.push(metalOxide(sym, 2));
      out.push(metalAcid(sym, 2));
    } else if (cat === "transition-metal" || cat === "post-transition-metal") {
      out.push(metalOxide(sym, n));
      if (NOBLE_METALS.has(sym)) {
        out.push(R(`${sym} + HNO₃ + 3HCl → ${sym}Cl${sub(n)} + NO + 2H₂O`, "Kral suyu", "Aqua regia", "Yalnızca güçlü oksitleyici karışımlarla çözünür.", "Dissolves only in strongly oxidizing mixtures."));
      } else if (PASSIVE.has(sym)) {
        out.push(R(`${sym} + 4HCl → ${sym}Cl₄ + 2H₂↑`, "Asitle (sıcak)", "With acid (hot)", "Oda sıcaklığında pasif oksit tabakası korur.", "A passive oxide layer protects it at room temperature."));
      } else if (["Cu", "Ag", "Hg"].includes(sym)) {
        out.push(R(`${sym} + 4HNO₃ → ${sym}(NO₃)${sub(n)} + 2NO₂↑ + 2H₂O`, "Nitrik asit", "Nitric acid", "Seyreltik HCl ile tepkime vermez.", "Does not react with dilute HCl."));
      } else {
        out.push(metalAcid(sym, n));
      }
      out.push(metalChloride(sym, n));
    } else if (cat === "metalloid") {
      out.push(metalOxide(sym, n));
      out.push(metalChloride(sym, n));
    } else if (cat === "nonmetal") {
      if (sym === "O") {
        out.push(R("2H₂ + O₂ → 2H₂O", "Hidrojenle", "With hydrogen", "Su oluşur.", "Water forms."));
      } else if (sym === "C") {
        out.push(R("C + O₂ → CO₂", "Oksijenle", "With oxygen", "Tam yanma.", "Complete combustion."));
      } else if (sym === "N") {
        out.push(R("N₂ + 3H₂ ⇌ 2NH₃", "Hidrojenle", "With hydrogen", "Haber–Bosch süreci.", "Haber–Bosch process."));
      } else if (sym === "P") {
        out.push(R("P₄ + 5O₂ → P₄O₁₀", "Oksijenle", "With oxygen", "Beyaz duman.", "White fumes."));
      } else if (sym === "S") {
        out.push(R("S + O₂ → SO₂", "Oksijenle", "With oxygen", "Mavi alev.", "Blue flame."));
      } else if (sym === "Se" || sym === "Te") {
        out.push(R(`${sym} + O₂ → ${sym}O₂`, "Oksijenle", "With oxygen", "Isıtıldığında oksit.", "Oxide when heated."));
      }
      out.push(R(`2${sym} + 3H₂ → 2${sym}H₃`, "Hidrojenle", "With hydrogen", "Katalizör ve ısı gerekebilir.", "Catalyst and heat may be required."));
    } else if (cat === "halogen") {
      out.push(R(`H₂ + ${sym}₂ → 2H${sym}`, "Hidrojenle", "With hydrogen", "Hidrojen halojenür oluşur.", "Hydrogen halide forms."));
      out.push(R(`2Na + ${sym}₂ → 2Na${sym}`, "Metalle", "With metal", "Sodyum halojenür oluşur.", "Sodium halide forms."));
      out.push(R(`${sym}₂ + H₂O ⇌ H${sym} + H${sym}O`, "Su ile", "With water", "Disproporsiyon; asidik çözelti.", "Disproportionation; acidic solution."));
    } else if (cat === "noble-gas") {
      if (NOBLE.has(sym)) {
        out.push(R("—", "Tepkime yok", "No reaction", "Kararlı elektron kabuğu nedeniyle normal koşullarda asaldır.", "Inert under normal conditions due to a full electron shell."));
      }
    } else if (cat === "lanthanide") {
      out.push(R(`4${sym} + 3O₂ → 2${sym}₂O₃`, "Oksijenle", "With oxygen", "Havada kararır; seskioksit oluşur.", "Tarnishes in air; sesquioxide forms."));
      out.push(R(`2${sym} + 6H₂O → 2${sym}(OH)₃ + 3H₂↑`, "Sıcak suyla", "With hot water", "Hidroksit ve hidrojen.", "Hydroxide and hydrogen."));
      out.push(R(`2${sym} + 6HCl → 2${sym}Cl₃ + 3H₂↑`, "Asitle", "With acid", "Tipik +3 klorür.", "Typical +3 chloride."));
    } else if (cat === "actinide") {
      out.push(R(`${sym} + O₂ → ${sym}O₂`, "Oksijenle", "With oxygen", "Genellikle dioksit oluşur.", "Usually forms a dioxide."));
      out.push(R(`${sym} + 4HCl → ${sym}Cl₄ + 2H₂↑`, "Asitle", "With acid", "Klorür ve hidrojen.", "Chloride and hydrogen."));
    }
    return out;
  }

  function getReactions(el) {
    const curated = CURATED[el.symbol];
    if (curated && curated.length) {
      return { ...(REACTIVITY[el.category] || REACTIVITY.unknown), equations: curated };
    }
    return { ...(REACTIVITY[el.category] || REACTIVITY.unknown), equations: genericReactions(el) };
  }

  function getUses(el) {
    return USES[el.symbol] || CATEGORY_USES[el.category] || [];
  }

  function getCompounds(el) {
    return COMPOUNDS[el.symbol] || [];
  }

  window.REACTIONS = {
    REACTIVITY,
    getReactions,
    getUses,
    getCompounds,
    CATEGORY_USES,
    H_PHRASES,
    GHS_ICON,
    hPhrase
  };
})();
