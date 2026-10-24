/* =========================================================================
   Comparison view and quiz engine
   ========================================================================= */

/* ------------------------------- compare ------------------------------- */

function initCompareSelects() {
  const a = $id("compare-select-a");
  const b = $id("compare-select-b");
  if (!a || !b) return;
  [a, b].forEach((select) => {
    select.innerHTML = state.elements.map((el) =>
      '<option value="' + el.z + '">' + el.z + " · " + escapeText(el.symbol) + " — " + escapeText(optionText(el)) + "</option>"
    ).join("");
  });
  syncComparePickers();
  renderCompare();
}

function syncComparePickers() {
  const a = $id("compare-select-a");
  const b = $id("compare-select-b");
  if (a) a.value = String(state.compare.a);
  if (b) b.value = String(state.compare.b);
}

function renderCompare() {
  const wrap = $id("compare-result");
  if (!wrap) return;
  const elA = state.byZ.get(Number(state.compare.a));
  const elB = state.byZ.get(Number(state.compare.b));
  if (!elA || !elB) {
    wrap.innerHTML = '<div class="compare-empty">' + escapeText(t("compare.selectPrompt")) + "</div>";
    return;
  }
  if (elA.z === elB.z) {
    wrap.innerHTML = '<div class="compare-empty">' + escapeText(X("compareSameElement")) + "</div>";
    return;
  }

  const card = (el) =>
    '<button type="button" class="compare-card cat-' + (el.category || "unknown") + '" data-z="' + el.z + '" style="text-align:left;width:100%;color:var(--text)">' +
      '<div class="cc-top"><span class="cc-symbol">' + escapeText(el.symbol) + '</span><span class="cc-z">#' + el.z + "</span></div>" +
      "<h3>" + escapeText(optionText(el)) + "</h3>" +
      '<div class="cc-meta">' + escapeText(categoryName(el.category)) + " · " + escapeText(phaseName(el.phase)) + " · " + escapeText(t("period")) + " " + el.period + "</div>" +
      '<div class="cc-chips">' +
        '<span class="chip"><strong>' + escapeText(formatMass(el.mass)) + "</strong> " + escapeText(X("massUnit")) + "</span>" +
        '<span class="chip">' + escapeText(t("labels.electronegativity")) + ": <strong>" + escapeText(fmt(el.electronegativity, 3)) + "</strong></span>" +
        '<span class="chip">' + escapeText(discoveryLabel(el)) + "</span>" +
      "</div>" +
    "</button>";

  const valueOf = (el, key) => {
    if (key === "ionization") return el.ionizationEnergies && el.ionizationEnergies.length ? el.ionizationEnergies[0] : null;
    if (key === "abundance") return el.abundance ? el.abundance.crust : null;
    if (key === "discovery") return discoveryNumeric(el);
    return el[key];
  };
  const formatOf = (key, value) => {
    if (value === null || value === undefined) return "—";
    if (key === "mass") return formatMass(value) + " " + X("massUnit");
    if (key === "density") return formatDensity(value);
    if (key === "melting" || key === "boiling") return formatTemp(value);
    if (key === "radius") return fmt(value, 4) + " pm";
    if (key === "ionization") return fmt(value, 4) + " eV";
    if (key === "abundance") return formatAbundance(value).text;
    if (key === "discovery") return modeValueLabel(value, "discovery");
    return fmt(value, 3);
  };
  const rows = [
    { key: "mass", label: t("labels.atomicMass") },
    { key: "electronegativity", label: t("labels.electronegativity") },
    { key: "radius", label: t("labels.atomicRadius") },
    { key: "ionization", label: t("labels.firstIonization") },
    { key: "melting", label: t("labels.meltingPoint") },
    { key: "boiling", label: t("labels.boilingPoint") },
    { key: "density", label: t("labels.density") },
    { key: "abundance", label: t("abundance.crust") },
    { key: "discovery", label: t("labels.discovery") }
  ];

  const rowsHTML = rows.map((row) => {
    const av = valueOf(elA, row.key);
    const bv = valueOf(elB, row.key);
    const aNum = Number(av);
    const bNum = Number(bv);
    const max = Math.max(Math.abs(aNum) || 0, Math.abs(bNum) || 0, 1);
    const aWidth = Number.isFinite(aNum) && av !== null ? Math.max(3, Math.min(100, (Math.abs(aNum) / max) * 100)) : 0;
    const bWidth = Number.isFinite(bNum) && bv !== null ? Math.max(3, Math.min(100, (Math.abs(bNum) / max) * 100)) : 0;
    const aWin = av !== null && bv !== null && aNum > bNum;
    const bWin = av !== null && bv !== null && bNum > aNum;
    return (
      '<div class="compare-row">' +
        '<div class="cr-val left' + (aWin ? " is-winner" : "") + '"><strong>' + formatOf(row.key, av) + '</strong><span class="cr-bar"><i style="width:' + aWidth + '%"></i></span></div>' +
        '<div class="cr-label">' + escapeText(row.label) + "</div>" +
        '<div class="cr-val right' + (bWin ? " is-winner" : "") + '"><strong>' + formatOf(row.key, bv) + '</strong><span class="cr-bar"><i style="width:' + bWidth + '%"></i></span></div>' +
      "</div>"
    );
  }).join("");

  const insights = [];
  if (elA.category === elB.category) insights.push(t("compare.sameCategory"));
  else insights.push(t("compare.differentCategory"));
  if (elA.period === elB.period) insights.push(t("compare.samePeriod"));
  if (elA.group === elB.group && elA.category !== "lanthanide" && elA.category !== "actinide") insights.push(t("compare.sameGroup"));

  const enA = Number(elA.electronegativity);
  const enB = Number(elB.electronegativity);
  if (Number.isFinite(enA) && Number.isFinite(enB) && enA !== enB) {
    const higher = enA > enB ? elA : elB;
    const lower = enA > enB ? elB : elA;
    insights.push(xf(X("compareHigher"), {
      label: t("labels.electronegativity"),
      a: escapeText(optionText(higher)),
      av: fmt(enA > enB ? enA : enB, 3),
      b: escapeText(optionText(lower)),
      bv: fmt(enA > enB ? enB : enA, 3)
    }));
  }
  const radiusA = Number(elA.atomicRadius);
  const radiusB = Number(elB.atomicRadius);
  if (Number.isFinite(radiusA) && Number.isFinite(radiusB) && radiusA !== radiusB) {
    const larger = radiusA > radiusB ? elA : elB;
    const smaller = radiusA > radiusB ? elB : elA;
    insights.push(xf(X("compareHigher"), {
      label: t("labels.atomicRadius"),
      a: escapeText(optionText(larger)),
      av: fmt(radiusA > radiusB ? radiusA : radiusB, 4) + " pm",
      b: escapeText(optionText(smaller)),
      bv: fmt(radiusA > radiusB ? radiusB : radiusA, 4) + " pm"
    }));
  }

  wrap.innerHTML =
    '<div class="compare-grid">' + card(elA) + '<div class="compare-vs"><span>' + escapeText(t("compare.vs")) + "</span></div>" + card(elB) + "</div>" +
    '<div class="compare-table">' + rowsHTML + "</div>" +
    '<div class="compare-insight">' + insights.map((line) => "<p>" + line + "</p>").join("") +
      '<p class="muted" style="margin-top:6px">' + escapeText(t("compare.tip")) + "</p>" +
    "</div>";
}

/* ------------------------------- quiz ------------------------------- */

function renderQuiz() {
  const card = $id("quiz-card");
  if (!card) return;
  if (state.quiz.finished) card.innerHTML = renderQuizResult();
  else if (!state.quiz.active) card.innerHTML = renderQuizIdle();
  else card.innerHTML = renderQuizQuestion();
  updateQuizMeta();
}

function renderQuizIdle() {
  return (
    '<div class="quiz-empty">' +
      '<div class="qe-icon"><svg class="icon"><use href="#i-quiz"/></svg></div>' +
      "<h3>" + escapeText(t("quiz.title")) + "</h3>" +
      "<p>" + escapeText(t("quiz.subtitle")) + "</p>" +
      '<button class="btn btn-primary" type="button" data-quiz-action="start"><svg class="icon"><use href="#i-spark"/></svg>' + escapeText(t("quiz.start")) + "</button>" +
    "</div>"
  );
}

function renderQuizQuestion() {
  const quiz = state.quiz;
  const q = quiz.questions[quiz.index];
  if (!q) return renderQuizIdle();
  const selected = quiz.selected;
  const progress = Math.round(((quiz.index + 1) / quiz.questions.length) * 100);
  const prompt = q.promptSymbol
    ? '<div class="quiz-prompt-symbol">' + escapeText(q.promptSymbol) + "</div>"
    : q.promptBox
      ? '<div class="quiz-prompt-symbol" style="font-size:18px;height:auto;min-height:54px;padding:8px 14px;line-height:1.4">' + q.promptBox + "</div>"
      : "";

  const options = q.options.map((el, index) => {
    let cls = "quiz-option";
    if (selected !== null) {
      if (index === q.correct) cls += " is-correct";
      else if (index === selected) cls += " is-wrong";
    }
    const label = q.optionKind === "symbol" ? el.symbol : optionText(el);
    return (
      '<button type="button" class="' + cls + '" data-quiz-index="' + index + '"' + (selected !== null ? " disabled" : "") + ">" +
        '<span class="qo-key">' + "ABCD"[index] + "</span><span>" + escapeText(label) + "</span>" +
      "</button>"
    );
  }).join("");

  const correct = selected !== null && selected === q.correct;
  const feedback = selected !== null
    ? '<div class="quiz-feedback">' +
        '<div class="qf-head ' + (correct ? "good" : "bad") + '">' +
          '<svg class="icon"><use href="' + (correct ? "#i-check" : "#i-close") + '"/></svg>' +
          escapeText(correct ? t("quiz.correct") : t("quiz.wrong")) +
        "</div>" +
        '<p class="qf-text">' + q.explanation + "</p>" +
        '<button class="btn btn-primary quiz-next" type="button" data-quiz-action="next">' +
          escapeText(quiz.index + 1 >= quiz.questions.length ? t("quiz.finish") : t("quiz.next")) +
          '<svg class="icon"><use href="#i-right"/></svg>' +
        "</button>" +
      "</div>"
    : "";

  return (
    '<div class="quiz-progress">' +
      '<span class="qp-label">' + escapeText(t("quiz.question")) + " " + (quiz.index + 1) + " " + escapeText(t("quiz.of")) + " " + quiz.questions.length + "</span>" +
      '<span class="qp-bar"><i style="width:' + progress + '%"></i></span>' +
      '<span class="qp-score">' + escapeText(t("quiz.score")) + ": " + quiz.score + "</span>" +
    "</div>" +
    '<div class="quiz-body">' +
      '<div class="quiz-type">' + escapeText(X("typeNames")[q.type] || t("quiz.choose")) + "</div>" +
      prompt +
      '<div class="quiz-question">' + q.title + "</div>" +
      '<div class="quiz-options">' + options + "</div>" +
      feedback +
    "</div>"
  );
}

function renderQuizResult() {
  const quiz = state.quiz;
  const total = quiz.questions.length || 10;
  const pct = Math.round((quiz.score / total) * 100);
  const messageKey = pct === 100 ? "perfect" : pct >= 80 ? "great" : pct >= 50 ? "good" : "keep";
  const message = t("quiz.messages." + messageKey);
  const rows = quiz.answers.map((answer) => {
    const q = answer.question;
    const good = answer.selected === q.correct;
    const correctLabel = q.optionKind === "symbol" ? q.options[q.correct].symbol : optionText(q.options[q.correct]);
    const yourLabel = answer.selected !== null && answer.selected !== undefined
      ? (q.optionKind === "symbol" ? q.options[answer.selected].symbol : optionText(q.options[answer.selected]))
      : "—";
    return (
      '<div class="review-row ' + (good ? "is-good" : "is-bad") + '">' +
        '<span class="rr-icon">' + (good ? "✓" : "✕") + "</span>" +
        "<div><strong>" + escapeText(q.short) + "</strong><small>" +
          escapeText(t("quiz.correctAnswer")) + ": " + escapeText(correctLabel) +
          (good ? "" : " · " + escapeText(t("quiz.yourAnswer")) + ": " + escapeText(yourLabel)) +
        "</small></div>" +
      "</div>"
    );
  }).join("");

  return (
    '<div class="quiz-result">' +
      '<div class="result-ring" style="--p:' + pct + '"><div><strong>' + quiz.score + "/" + total + '</strong><span>' + escapeText(t("quiz.correct")) + "</span></div></div>" +
      "<h3>" + escapeText(quiz.newRecord ? t("quiz.highScore") : t("quiz.resultsTitle")) + "</h3>" +
      "<p>" + escapeText(xf(t("quiz.resultsText"), { score: quiz.score, total, message })) + "</p>" +
      '<div class="result-actions">' +
        '<button class="btn btn-primary" type="button" data-quiz-action="restart"><svg class="icon"><use href="#i-reset"/></svg>' + escapeText(t("quiz.playAgain")) + "</button>" +
        '<button class="btn btn-ghost" type="button" data-quiz-action="quit">' + escapeText(t("quiz.quit")) + "</button>" +
      "</div>" +
      (rows ? '<div class="quiz-review">' + rows + "</div>" : "") +
    "</div>"
  );
}

function updateQuizMeta() {
  const best = state.quiz.best[state.quiz.level] || 0;
  const bestEl = $id("quiz-best");
  const streakEl = $id("quiz-streak");
  const scoreEl = $id("quiz-score");
  if (bestEl) bestEl.textContent = best ? best + "/10" : "—";
  if (streakEl) streakEl.textContent = String(state.quiz.streak);
  if (scoreEl) scoreEl.textContent = String(state.quiz.score);
  $$("#quiz-levels button").forEach((button) => {
    const active = button.dataset.level === state.quiz.level;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = state.quiz.active;
  });
}

function setQuizLevel(level) {
  if (!["easy", "medium", "hard"].includes(level) || state.quiz.active) return;
  state.quiz.level = level;
  state.quiz.active = false;
  state.quiz.finished = false;
  state.quiz.answers = [];
  state.quiz.score = 0;
  state.quiz.streak = 0;
  renderQuiz();
}

function startQuiz() {
  const quiz = state.quiz;
  quiz.active = true;
  quiz.finished = false;
  quiz.index = 0;
  quiz.selected = null;
  quiz.answers = [];
  quiz.score = 0;
  quiz.streak = 0;
  quiz.newRecord = false;
  quiz.questions = buildQuiz(quiz.level);
  renderQuiz();
}

function buildQuiz(level) {
  const questions = [];
  let attempts = 0;
  while (questions.length < 10 && attempts < 300) {
    attempts++;
    const question = makeQuizQuestion(level);
    if (question) questions.push(question);
  }
  while (questions.length < 10 && questions.length > 0) {
    questions.push(questions[questions.length % questions.length]);
  }
  return questions.slice(0, 10);
}

function quizOptions(correct, pool, optionKind) {
  const others = sample(pool.filter((el) => el.z !== correct.z), 3);
  const options = sample([correct].concat(others), 4);
  return {
    options,
    correct: options.findIndex((el) => el.z === correct.z),
    optionKind: optionKind || "name"
  };
}

function nameStrong(el) {
  return "<strong>" + escapeText(optionText(el)) + " (" + el.symbol + ")</strong>";
}

function makeQuizQuestion(level) {
  const pool = level === "easy" ? state.elements.filter((el) => el.z <= 36) : state.elements;
  const easyTypes = ["symbolToName", "nameToSymbol", "numberToName", "phase", "category"];
  const mediumTypes = ["symbolToName", "nameToSymbol", "numberToName", "phase", "category", "position", "config", "highest", "lowest"];
  const hardTypes = ["symbolToName", "nameToSymbol", "numberToName", "category", "position", "config", "highest", "lowest", "isotope", "phase"];
  const type = randomOf(level === "easy" ? easyTypes : level === "hard" ? hardTypes : mediumTypes);

  if (type === "symbolToName") {
    const correct = randomOf(pool);
    const built = quizOptions(correct, pool);
    return {
      type, options: built.options, correct: built.correct, optionKind: "name",
      promptSymbol: correct.symbol,
      title: escapeText(t("quiz.types.symbolToName")),
      explanation: xf(X("explainBasic"), { name: escapeText(optionText(correct)), symbol: correct.symbol, z: correct.z, category: escapeText(categoryName(correct.category)) }),
      short: "Sembol: " + correct.symbol
    };
  }

  if (type === "nameToSymbol") {
    const correct = randomOf(pool);
    const built = quizOptions(correct, pool, "symbol");
    return {
      type, options: built.options, correct: built.correct, optionKind: "symbol",
      promptBox: escapeText(optionText(correct)),
      title: escapeText(t("quiz.types.nameToSymbol")),
      explanation: xf(X("explainSymbol"), { symbol: correct.symbol, name: escapeText(optionText(correct)) }),
      short: optionText(correct)
    };
  }

  if (type === "numberToName") {
    const correct = randomOf(pool);
    const built = quizOptions(correct, pool);
    return {
      type, options: built.options, correct: built.correct, optionKind: "name",
      title: escapeText(t("quiz.types.numberToName", { n: correct.z })),
      explanation: xf(X("explainBasic"), { name: escapeText(optionText(correct)), symbol: correct.symbol, z: correct.z, category: escapeText(categoryName(correct.category)) }),
      short: "Z = " + correct.z
    };
  }

  if (type === "category") {
    const categories = CATEGORY_ORDER.filter((cat) => state.elements.filter((el) => el.category === cat).length >= 4);
    const category = randomOf(categories);
    const members = state.elements.filter((el) => el.category === category);
    const correct = randomOf(members);
    const others = sample(state.elements.filter((el) => el.category !== category), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types.category", { category: categoryName(category) })),
      explanation: xf(X("explainCategory"), { name: escapeText(optionText(correct)), symbol: correct.symbol, category: escapeText(categoryName(category)) }),
      short: t("labels.category") + ": " + categoryName(category)
    };
  }

  if (type === "phase") {
    const phases = STATE_ORDER.filter((phase) => state.elements.filter((el) => (el.phase || "unknown") === phase).length >= 4);
    const phase = randomOf(phases);
    const members = state.elements.filter((el) => (el.phase || "unknown") === phase);
    const correct = randomOf(members);
    const others = sample(state.elements.filter((el) => (el.phase || "unknown") !== phase), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types.phase", { phase: phaseName(phase) })),
      explanation: xf(X("explainPhase"), { name: escapeText(optionText(correct)), phase: escapeText(phaseName(phase)) }),
      short: t("labels.phase") + ": " + phaseName(phase)
    };
  }

  if (type === "position") {
    const candidates = pool.filter((el) => el.group && el.category !== "lanthanide" && el.category !== "actinide");
    const correct = randomOf(candidates);
    const others = sample(state.elements.filter((el) => el.z !== correct.z), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types.position", { period: correct.period, group: correct.group })),
      explanation: xf(X("explainPosition"), { name: escapeText(optionText(correct)), symbol: correct.symbol, period: correct.period, group: correct.group }),
      short: t("period") + " " + correct.period + " · " + t("group") + " " + correct.group
    };
  }

  if (type === "config") {
    const candidates = pool.filter((el) => el.electronConfig);
    const correct = randomOf(candidates);
    const others = sample(state.elements.filter((el) => el.z !== correct.z), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      promptBox: escapeText(correct.electronConfig),
      title: escapeText(t("quiz.types.config")),
      explanation: xf(X("explainConfig"), { config: escapeText(correct.electronConfig) }),
      short: correct.electronConfig
    };
  }

  if (type === "highest" || type === "lowest") {
    const props = ["electronegativity", "melting", "atomicRadius", "ionization"];
    const prop = randomOf(props);
    const getter = (el) => prop === "ionization"
      ? (el.ionizationEnergies && el.ionizationEnergies.length ? el.ionizationEnergies[0] : null)
      : el[prop];
    let candidates = pool.filter((el) => getter(el) !== null && getter(el) !== undefined && Number.isFinite(Number(getter(el))));
    let four = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const trial = sample(candidates, 4);
      const vals = trial.map((el) => Number(getter(el)));
      if (new Set(vals).size === 4) { four = trial; break; }
    }
    if (!four) return null;
    const sorted = four.slice().sort((a, b) => Number(getter(a)) - Number(getter(b)));
    const correct = type === "highest" ? sorted[sorted.length - 1] : sorted[0];
    const options = sample(four, 4);
    const propertyLabel = prop === "ionization" ? t("labels.firstIonization") : t("labels." + prop);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      title: escapeText(t("quiz.types." + type, { property: propertyLabel })),
      explanation: xf(X("explainProperty"), {
        property: escapeText(propertyLabel),
        list: options.map((el) => "<strong>" + escapeText(el.symbol) + "</strong> " + fmt(getter(el), 3)).join(", ")
      }),
      short: X("typeNames." + type) + ": " + propertyLabel
    };
  }

  if (type === "isotope") {
    const candidates = pool.filter((el) => el.isotopes && el.isotopes.length);
    if (!candidates.length) return null;
    const correct = randomOf(candidates);
    const isotope = randomOf(correct.isotopes);
    const neutrons = isotope.massNumber - correct.z;
    if (neutrons < 0) return null;
    const others = sample(state.elements.filter((el) => el.z !== correct.z), 3);
    const options = sample([correct].concat(others), 4);
    return {
      type, options, correct: options.findIndex((el) => el.z === correct.z), optionKind: "name",
      promptBox: "A = " + isotope.massNumber + " · N = " + neutrons,
      title: escapeText(t("quiz.types.isotope")),
      explanation: xf(X("explainIsotope"), { n: neutrons, a: isotope.massNumber, z: correct.z, name: escapeText(optionText(correct)), symbol: correct.symbol }),
      short: "A = " + isotope.massNumber + " · N = " + neutrons
    };
  }

  return null;
}

function answerQuiz(index) {
  const quiz = state.quiz;
  if (!quiz.active || quiz.selected !== null) return;
  const question = quiz.questions[quiz.index];
  if (!question || !question.options[index]) return;
  quiz.selected = index;
  const correct = index === question.correct;
  if (correct) {
    quiz.score++;
    quiz.streak++;
  } else {
    quiz.streak = 0;
  }
  quiz.answers.push({ question, selected: index, correct });
  renderQuiz();
  const next = $('[data-quiz-action="next"]');
  if (next) next.focus({ preventScroll: true });
}

function nextQuizQuestion() {
  const quiz = state.quiz;
  if (!quiz.active || quiz.selected === null) return;
  if (quiz.index + 1 >= quiz.questions.length) {
    finishQuiz();
    return;
  }
  quiz.index++;
  quiz.selected = null;
  renderQuiz();
}

function finishQuiz() {
  const quiz = state.quiz;
  quiz.active = false;
  quiz.finished = true;
  const best = quiz.best[quiz.level] || 0;
  if (quiz.score > best) {
    quiz.best[quiz.level] = quiz.score;
    quiz.newRecord = true;
    saveBest();
  }
  renderQuiz();
}

function quitQuiz() {
  state.quiz.active = false;
  state.quiz.finished = false;
  state.quiz.answers = [];
  state.quiz.score = 0;
  state.quiz.streak = 0;
  renderQuiz();
}
