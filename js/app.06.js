/* =========================================================================
   Events, language switching, view routing, hero scene, boot
   ========================================================================= */

let toastTimer = 0;

function toast(message) {
  const el = $id("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1900);
}

function setView(name, scroll) {
  if (!["explore", "quiz", "compare", "lab"].includes(name)) return;
  state.view = name;
  $$(".view").forEach((view) => view.classList.toggle("hidden", view.id !== name + "-view"));
  $$("[data-view]").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  if (name === "lab") {
    if (window.Lab118) window.Lab118.enter();
  } else if (window.Lab118) {
    window.Lab118.leave();
  }
  if (name === "quiz") renderQuiz();
  if (name === "compare") {
    syncComparePickers();
    renderCompare();
  }
  if (name === "explore" && state.heroScene && state.heroScene.resize) {
    try { state.heroScene.resize(); } catch (e) {}
  }
  if (scroll !== false) {
    try { window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, 0); }
  }
}

function updateLangButtons() {
  $$("[data-lang]").forEach((button) => {
    const active = button.dataset.lang === state.lang;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyStaticLanguage() {
  document.documentElement.lang = state.lang;
  document.title = state.lang === "tr"
    ? "Periyodik Tablo — İnteraktif Element Simülasyonu"
    : "Periodic Table — Interactive Element Simulation";

  $$("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    const value = t(key);
    if (value !== key) node.textContent = value;
  });
  $$("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    const value = t(key);
    if (value !== key) node.setAttribute("placeholder", value);
  });

  const skip = $(".skip-link");
  if (skip) skip.textContent = X("skip");
  const mainNav = $(".main-nav");
  if (mainNav) mainNav.setAttribute("aria-label", X("ariaMainNav"));
  const mobileNav = $(".mobile-nav");
  if (mobileNav) mobileNav.setAttribute("aria-label", X("ariaMobileNav"));
  const searchResults = $id("search-results");
  if (searchResults) searchResults.setAttribute("aria-label", X("ariaSearchResults"));
  const ptable = $id("ptable");
  if (ptable) ptable.setAttribute("aria-label", X("ariaTable"));
  const colorMode = $id("color-mode");
  if (colorMode) colorMode.setAttribute("aria-label", X("ariaColorMode"));
  const searchToggle = $id("search-toggle");
  if (searchToggle) searchToggle.setAttribute("aria-label", t("searchShort"));
  const searchInput = $id("search-input");
  if (searchInput) searchInput.setAttribute("aria-label", t("searchShort"));
  const zoom = $(".zoom-controls");
  if (zoom) zoom.setAttribute("aria-label", X("ariaZoom"));
  const zoomIn = $id("zoom-in");
  if (zoomIn) zoomIn.setAttribute("aria-label", X("zoomIn"));
  const zoomOut = $id("zoom-out");
  if (zoomOut) zoomOut.setAttribute("aria-label", X("zoomOut"));
  const zoomReset = $id("zoom-reset");
  if (zoomReset) zoomReset.setAttribute("aria-label", X("zoomReset"));
  const quizLevels = $id("quiz-levels");
  if (quizLevels) quizLevels.setAttribute("aria-label", X("ariaLevels"));
  const compareA = $id("compare-select-a");
  if (compareA) compareA.setAttribute("aria-label", X("ariaElementA"));
  const compareB = $id("compare-select-b");
  if (compareB) compareB.setAttribute("aria-label", X("ariaElementB"));
  const swap = $id("compare-swap");
  if (swap) swap.setAttribute("aria-label", X("ariaSwap"));
  const trendFoot = $(".trend-foot p");
  if (trendFoot) trendFoot.textContent = X("trendFoot");
  const trendsOk = $id("trends-ok");
  if (trendsOk) trendsOk.textContent = state.lang === "tr" ? "Anladım" : "Got it";
  const trendsClose = $id("trends-close");
  if (trendsClose) trendsClose.setAttribute("aria-label", t("close"));
  const listLabel = $("#list-toggle span");
  if (listLabel) listLabel.textContent = state.listView ? X("tableView") : X("listView");
  updateLangButtons();
}

function changeLanguage(lang) {
  if ((lang !== "tr" && lang !== "en") || lang === state.lang) return;
  state.lang = lang;
  if (window.setLang) window.setLang(lang);
  applyStaticLanguage();
  initTable();
  initCompareSelects();
  renderQuiz();
  setListView(state.listView);
  if (state.query) renderSearchResults();
  if (state.currentZ) {
    destroyAtomViewer();
    renderElementModal();
  }
  if (window.Lab118) window.Lab118.setLang(state.lang);
}

function showLoadError() {
  const ptable = $id("ptable");
  if (ptable) ptable.innerHTML = '<div class="empty-note" style="grid-column:1/-1">' + escapeText(t("loadError")) + "</div>";
  toast(t("loadError"));
}

function loadData() {
  if (window.PERIODIC_DATA && Array.isArray(window.PERIODIC_DATA.elements)) {
    return Promise.resolve(window.PERIODIC_DATA);
  }
  return fetch("assets/data/elements.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .catch(() => null);
}

function openTrends() {
  const modal = $id("trends-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  const close = $id("trends-close");
  if (close) close.focus({ preventScroll: true });
}

function closeTrends() {
  const modal = $id("trends-modal");
  if (!modal || modal.classList.contains("hidden")) return;
  modal.classList.add("hidden");
  if (!state.currentZ) document.body.classList.remove("modal-open");
}

function hideSearchResults() {
  const wrap = $id("search-results");
  if (wrap) wrap.classList.add("hidden");
  state.searchIndex = -1;
}

function openSearch() {
  const wrap = $id("search-wrap");
  const input = $id("search-input");
  if (!wrap || !input) return;
  wrap.classList.add("is-expanded");
  const toggle = $id("search-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
  input.focus();
  input.select();
}

function selectSearchResult(z) {
  const input = $id("search-input");
  if (input) input.value = "";
  state.query = "";
  state.searchIndex = -1;
  applyFilter();
  renderElementList();
  hideSearchResults();
  const wrap = $id("search-wrap");
  if (wrap) wrap.classList.remove("is-expanded");
  const toggle = $id("search-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
  openElement(z);
}

function bindEvents() {
  if (state.eventsBound) return;
  state.eventsBound = true;

  $$("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  const brand = $id("brand");
  if (brand) {
    brand.addEventListener("click", (event) => {
      event.preventDefault();
      setView("explore");
      window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    });
  }
  const heroExplore = $id("hero-explore");
  if (heroExplore) heroExplore.addEventListener("click", () => {
    const section = $(".table-section");
    if (section) section.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  });
  const heroQuiz = $id("hero-quiz");
  if (heroQuiz) heroQuiz.addEventListener("click", () => setView("quiz"));
  const heroLab = $id("hero-lab");
  if (heroLab) heroLab.addEventListener("click", () => setView("lab"));

  $$("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => changeLanguage(button.dataset.lang));
  });

  const searchToggle = $id("search-toggle");
  if (searchToggle) {
    searchToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const wrap = $id("search-wrap");
      if (!wrap) return;
      const open = wrap.classList.toggle("is-expanded");
      searchToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        const input = $id("search-input");
        if (input) input.focus();
      } else {
        hideSearchResults();
      }
    });
  }

  const searchInput = $id("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => onSearchInput(searchInput.value));
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) renderSearchResults();
    });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        if (moveSearchSelection(1)) event.preventDefault();
      } else if (event.key === "ArrowUp") {
        if (moveSearchSelection(-1)) event.preventDefault();
      } else if (event.key === "Enter") {
        const buttons = $$(".search-result");
        if (buttons.length) {
          event.preventDefault();
          const pick = state.searchIndex >= 0 ? buttons[state.searchIndex] : buttons[0];
          if (pick) selectSearchResult(Number(pick.dataset.z));
        }
      } else if (event.key === "Escape") {
        hideSearchResults();
        searchInput.blur();
      }
    });
  }

  document.addEventListener("click", (event) => {
    const wrap = $id("search-wrap");
    if (wrap && !wrap.contains(event.target)) hideSearchResults();
  });

  const searchResults = $id("search-results");
  if (searchResults) {
    searchResults.addEventListener("click", (event) => {
      const button = event.target.closest(".search-result");
      if (button) selectSearchResult(Number(button.dataset.z));
    });
  }

  const colorMode = $id("color-mode");
  if (colorMode) {
    colorMode.addEventListener("change", () => {
      state.colorMode = colorMode.value;
      applyTableMode();
      applyFilter();
    });
  }

  const legend = $id("legend");
  if (legend) {
    legend.addEventListener("click", (event) => {
      const chip = event.target.closest(".legend-chip");
      if (chip && chip.dataset.filterType) setFilter(chip.dataset.filterType, chip.dataset.filterValue);
    });
  }

  const clearFilterBtn = $id("clear-filter");
  if (clearFilterBtn) clearFilterBtn.addEventListener("click", clearFilter);

  const listToggle = $id("list-toggle");
  if (listToggle) listToggle.addEventListener("click", () => setListView());

  const zoomIn = $id("zoom-in");
  if (zoomIn) zoomIn.addEventListener("click", () => zoomBy(8));
  const zoomOut = $id("zoom-out");
  if (zoomOut) zoomOut.addEventListener("click", () => zoomBy(-8));
  const zoomReset = $id("zoom-reset");
  if (zoomReset) zoomReset.addEventListener("click", resetZoom);

  const ptable = $id("ptable");
  if (ptable) {
    ptable.addEventListener("click", (event) => {
      const placeholder = event.target.closest(".f-placeholder");
      if (placeholder) {
        setFilter("category", placeholder.dataset.filterCat);
        return;
      }
      const cell = event.target.closest(".el");
      if (cell) openElement(Number(cell.dataset.z));
    });
  }

  const list = $id("element-list");
  if (list) {
    list.addEventListener("click", (event) => {
      const card = event.target.closest(".el-card");
      if (card) openElement(Number(card.dataset.z));
    });
  }

  const trendsBtn = $id("trends-btn");
  if (trendsBtn) trendsBtn.addEventListener("click", openTrends);
  const trendsClose = $id("trends-close");
  if (trendsClose) trendsClose.addEventListener("click", closeTrends);
  const trendsOk = $id("trends-ok");
  if (trendsOk) trendsOk.addEventListener("click", closeTrends);
  const trendsModal = $id("trends-modal");
  if (trendsModal) {
    trendsModal.addEventListener("click", (event) => {
      if (event.target === trendsModal) closeTrends();
    });
  }

  const modalRoot = $id("modal-root");
  if (modalRoot) {
    modalRoot.addEventListener("click", (event) => {
      if (event.target.classList.contains("overlay")) {
        closeElement();
        return;
      }
      const action = event.target.closest("[data-action]");
      if (action) {
        const name = action.dataset.action;
        if (name === "close") closeElement();
        else if (name === "prev") navigateElement(-1);
        else if (name === "next") navigateElement(1);
        else if (name === "copy") copyElementLink();
        else if (name === "compare") compareElement(state.currentZ);
        else if (name === "lab") sendElementToLab(state.currentZ);
        return;
      }
      const tab = event.target.closest("[data-tab]");
      if (tab) {
        switchElementTab(tab.dataset.tab);
        return;
      }
      const mode = event.target.closest("[data-atom-mode]");
      if (mode) {
        atomSetMode(mode.dataset.atomMode);
        return;
      }
      const subshell = event.target.closest("[data-subshell-n]");
      if (subshell) {
        atomSetSubshell(Number(subshell.dataset.subshellN), Number(subshell.dataset.subshellL));
        return;
      }
      const orbital = event.target.closest("[data-orbital-m]");
      if (orbital) {
        atomSetM(Number(orbital.dataset.orbitalM));
        return;
      }
      const atomAction = event.target.closest("[data-atom-action]");
      if (atomAction) {
        if (atomAction.dataset.atomAction === "rotate") atomToggleRotate();
        else if (atomAction.dataset.atomAction === "reset") atomResetView();
        return;
      }
      const neighbor = event.target.closest(".neighbor-chip[data-z]");
      if (neighbor) {
        openElement(Number(neighbor.dataset.z));
        return;
      }
    });
    modalRoot.addEventListener("input", (event) => {
      if (event.target && event.target.id === "atom-speed") atomSetSpeed(event.target.value);
    });
  }

  const compareA = $id("compare-select-a");
  const compareB = $id("compare-select-b");
  if (compareA) {
    compareA.addEventListener("change", () => {
      state.compare.a = Number(compareA.value);
      renderCompare();
    });
  }
  if (compareB) {
    compareB.addEventListener("change", () => {
      state.compare.b = Number(compareB.value);
      renderCompare();
    });
  }
  const swap = $id("compare-swap");
  if (swap) {
    swap.addEventListener("click", () => {
      const a = state.compare.a;
      state.compare.a = state.compare.b;
      state.compare.b = a;
      syncComparePickers();
      renderCompare();
    });
  }
  const compareResult = $id("compare-result");
  if (compareResult) {
    compareResult.addEventListener("click", (event) => {
      const card = event.target.closest(".compare-card[data-z]");
      if (card) openElement(Number(card.dataset.z));
    });
  }

  const quizLevels = $id("quiz-levels");
  if (quizLevels) {
    quizLevels.addEventListener("click", (event) => {
      const button = event.target.closest("[data-level]");
      if (button) setQuizLevel(button.dataset.level);
    });
  }
  const quizStart = $id("quiz-start");
  if (quizStart) quizStart.addEventListener("click", startQuiz);
  const quizCard = $id("quiz-card");
  if (quizCard) {
    quizCard.addEventListener("click", (event) => {
      const option = event.target.closest("[data-quiz-index]");
      if (option) {
        answerQuiz(Number(option.dataset.quizIndex));
        return;
      }
      const action = event.target.closest("[data-quiz-action]");
      if (!action) return;
      if (action.dataset.quizAction === "start" || action.dataset.quizAction === "restart") startQuiz();
      else if (action.dataset.quizAction === "next") nextQuizQuestion();
      else if (action.dataset.quizAction === "quit") quitQuiz();
    });
  }

  window.addEventListener("scroll", () => {
    const header = $id("site-header");
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }, { passive: true });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth <= 760 && state.listView) setListView(false);
    }, 140);
  });

  window.addEventListener("hashchange", handleHash);

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
    const typing = tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;

    if (event.key === "Escape") {
      const results = $id("search-results");
      if (results && !results.classList.contains("hidden")) {
        hideSearchResults();
        return;
      }
      if (state.currentZ) {
        closeElement();
        return;
      }
      const trends = $id("trends-modal");
      if (trends && !trends.classList.contains("hidden")) {
        closeTrends();
        return;
      }
    }

    if (typing) return;

    if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
      if (state.currentZ) return;
      event.preventDefault();
      openSearch();
      return;
    }

    if (state.currentZ && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
      event.preventDefault();
      navigateElement(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }

    if (state.quiz.active && /^[1-4]$/.test(event.key)) {
      event.preventDefault();
      answerQuiz(Number(event.key) - 1);
    }
  });
}

function initHero() {
  const canvas = $id("hero-canvas");
  if (!canvas || !window.THREE || !window.Atom3D || !window.Atom3D.HeroScene || !webglAvailable()) {
    if (canvas) canvas.style.display = "none";
    return;
  }
  try {
    state.heroScene = new window.Atom3D.HeroScene(canvas);
  } catch (error) {
    canvas.style.display = "none";
  }
}

function handleHash() {
  const hash = location.hash || "";
  const match = hash.match(/^#element=(\d+)(?:&tab=([a-z]+))?/);
  if (match) {
    const tab = TABS.includes(match[2]) ? match[2] : "overview";
    openElement(Number(match[1]), { tab });
    return;
  }
  if (state.currentZ) {
    closeElement();
    return;
  }
  if (hash === "#quiz") setView("quiz", false);
  else if (hash === "#compare") setView("compare", false);
  else if (hash === "#lab") setView("lab", false);
}

function sendElementToLab(z) {
  if (!z) return;
  closeElement();
  if (window.Lab118) {
    window.Lab118.sendElement(Number(z));
    setView("lab");
  } else {
    toast(t("loadError"));
  }
}

function boot() {
  state.lang = window.getLang ? window.getLang() : "tr";
  document.documentElement.lang = state.lang;
  applyStaticLanguage();

  loadData().then((data) => {
    if (!data || !Array.isArray(data.elements)) {
      showLoadError();
      return;
    }
    state.meta = data.meta || null;
    state.elements = data.elements.slice().sort((a, b) => a.z - b.z);
    state.byZ = new Map(state.elements.map((el) => [el.z, el]));

    initTable();
    initCompareSelects();
    renderQuiz();
    bindEvents();
    updateLangButtons();
    initHero();
    handleHash();
  }).catch(() => showLoadError());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
})();
