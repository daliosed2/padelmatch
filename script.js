/*****************************************************************
 * PadelMatch Pro – v3.0 (Selector de Modalidad)
 * - Añadido el flujo para seleccionar el tipo de juego.
 * - La lógica de 'Liguilla' está funcional.
 * - 'Americano' y 'Eliminatoria' están preparados para el futuro.
 *****************************************************************/
const PadelMatchApp = {
  state: {
    jugadores: [],
    eventoNombre: "",
    gameMode: null, // 'liguilla', 'americano', 'eliminatoria'
    rondas: [],
    resultados: {},
    lang: "es",
  },

  i18n: {
    es: { newTab: "Nueva pestaña", reset: "Reset / Nuevo evento", createEvent: "Crear partida / Torneo", create: "Crear", playerReg: "Registro de jugadores", genCalendar: "Generar calendario", ranking: "Ranking", howManyCourts: "¿Cuántas canchas tienes disponibles?", needPlayers: "Se necesitan al menos 4 jugadores", sliceRounds: "Rondas solicitadas exceden las posibles; se repetirán." },
    en: { newTab: "New tab", reset: "Reset / New event", createEvent: "Create Match / Tournament (Doubles)", create: "Create", playerReg: "Player registration", genCalendar: "Generate schedule", ranking: "Leaderboard", howManyCourts: "How many courts are available?", needPlayers: "At least 4 players required", sliceRounds: "Requested rounds exceed possible; pattern will repeat." }
  },

  elements: {},

  init() {
    this.cacheElements();
    this.addEventListeners();
    this.loadState();
    this.render();
  },

  cacheElements() {
    const ids = [
      'crear-evento', 'seleccion-modalidad', 'app-view', 'ranking', 'rondasContainer', 'listaJugadores',
      'tablaRanking', 'nombreEvento', 'crearBtn', 'nombreJugador', 'addPlayerBtn',
      'numRondas', 'genRndBtn', 'nombreEventoActual', 'langTxt', 'btnNueva',
      'btnReset', 'langBtn', 'registro-jugadores'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const camelCaseId = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
        this.elements[camelCaseId] = el;
      }
    });
  },

  addEventListeners() {
    this.elements.crearBtn.onclick = () => this.createEvent();
    document.querySelectorAll('.btn-modalidad').forEach(button => {
      button.onclick = () => this.selectGameMode(button.dataset.mode);
    });
    this.elements.addPlayerBtn.onclick = () => this.addPlayer();
    this.elements.genRndBtn.onclick = () => this.generateSchedule();
    this.elements.nombreJugador.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this.addPlayer(); }
    });
    this.elements.rondasContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('score-input')) this.recordResult(e.target);
    });
    this.elements.btnNueva.onclick = () => window.open(location.href, "_blank");
    this.elements.btnReset.onclick = () => {
      if (confirm(this.t("reset") + "?")) {
        sessionStorage.clear();
        location.reload();
      }
    };
    this.elements.langBtn.onclick = () => {
      this.state.lang = this.state.lang === "es" ? "en" : "es";
      this.saveAndRender();
    };
  },

  // --- LÓGICA DE FLUJO ---
  createEvent() {
    const n = this.elements.nombreEvento.value.trim();
    if (!n) return;
    this.state.eventoNombre = n;
    this.saveAndRender();
  },

  selectGameMode(mode) {
    this.state.gameMode = mode;
    this.saveAndRender();
  },

  generateSchedule() {
    if (this.state.jugadores.length < 4) {
      alert(this.t("needPlayers"));
      return;
    }
    const nR = +this.elements.numRondas.value || 3;
    const courts = parseInt(prompt(this.t("howManyCourts") + " (≥1)"), 10) || 1;
    let allPossibleRounds = [];

    switch (this.state.gameMode) {
        case 'liguilla':
            allPossibleRounds = this.buildLiguillaRounds(this.state.jugadores, courts);
            break;
        case 'americano':
            alert("¡Modalidad 'Torneo Americano' aún no implementada!");
            return;
        case 'eliminatoria':
            alert("¡Modalidad 'Eliminatoria' aún no implementada!");
            return;
        default:
            return;
    }

    this.state.rondas = [];
    for (let i = 0; i < nR; i++) {
      this.state.rondas.push(allPossibleRounds[i % allPossibleRounds.length]);
      if (i >= allPossibleRounds.length) console.warn(this.t("sliceRounds"));
    }
    this.state.resultados = {};
    this.saveAndRender();
  },

  addPlayer() {
    const n = this.formatName(this.elements.nombreJugador.value);
    if (!n || this.state.jugadores.map(j => j.toLowerCase()).includes(n.toLowerCase())) return;
    this.state.jugadores.push(n);
    this.elements.nombreJugador.value = "";
    this.elements.nombreJugador.focus();
    this.saveAndRender();
  },

  recordResult(inputElement) {
    const li = inputElement.closest('.match-list__item');
    if (!li) return;
    const key = li.dataset.key;
    const inputs = li.querySelectorAll('.score-input');
    const gA = inputs[0].value === "" ? "" : parseInt(inputs[0].value, 10);
    const gB = inputs[1].value === "" ? "" : parseInt(inputs[1].value, 10);
    if (gA === "" && gB === "") {
        delete this.state.resultados[key];
    } else {
        this.state.resultados[key] = { gA: isNaN(gA) ? "" : gA, gB: isNaN(gB) ? "" : gB };
    }
    this.saveState();
    this.updateRanking();
  },

  // --- LÓGICA DE RENDERIZADO ---
  render() {
    const { eventoNombre, gameMode, rondas } = this.state;
    this.elements.crearEvento.classList.toggle('hidden', !!eventoNombre);
    this.elements.seleccionModalidad.classList.toggle('hidden', !eventoNombre || !!gameMode);
    this.elements.appView.classList.toggle('hidden', !gameMode);

    if (eventoNombre) this.elements.nombreEventoActual.textContent = eventoNombre;
    
    if (gameMode) {
      this.renderPlayers();
      const hasRounds = rondas && rondas.length > 0;
      this.elements.rondasContainer.classList.toggle('hidden', !hasRounds);
      this.elements.ranking.classList.toggle('hidden', !hasRounds);
      if (hasRounds) {
        this.renderRounds();
        this.updateRanking();
      }
    }
    this.applyTranslations();
    if (window.lucide) lucide.createIcons();
  },

  renderPlayers() {
    this.elements.listaJugadores.innerHTML = this.state.jugadores.map(j => `<li class="player-list__item">${j}</li>`).join("");
  },

  renderRounds() {
    this.elements.rondasContainer.innerHTML = this.state.rondas.map((matches, idxR) => `
      <h3 class="card__title">Ronda ${idxR + 1}</h3>
      <ul class="match-list">
        ${matches.map(m => {
          const key = this.encodeKey(m);
          const res = this.state.resultados[key] || { gA: "", gB: "" };
          return `<li class="match-list__item" data-key="${key}">
              <span class="match-list__teams">${m[0]} & ${m[1]} <strong>vs</strong> ${m[2]} & ${m[3]}</span>
              <div class="match-list__inputs">
                <input type="number" class="score-input" min="0" placeholder="-" value="${res.gA}">
                <input type="number" class="score-input" min="0" placeholder="-" value="${res.gB}">
              </div></li>`;
        }).join('')}</ul>`).join('');
  },

  updateRanking() {
    const stats = {};
    this.state.jugadores.forEach(j => (stats[j] = { vict: 0, games: 0 }));
    Object.entries(this.state.resultados).forEach(([k, { gA, gB }]) => {
      if (typeof gA === 'number' && typeof gB === 'number') {
        const [a1, a2, b1, b2] = this.decodeKey(k);
        if (gA > gB) { stats[a1].vict++; stats[a2].vict++; }
        else if (gB > gA) { stats[b1].vict++; stats[b2].vict++; }
        stats[a1].games += gA; stats[a2].games += gA;
        stats[b1].games += gB; stats[b2].games += gB;
      }
    });
    const order = Object.entries(stats).sort((a, b) => b[1].vict - a[1].vict || b[1].games - a[1].games);
    let html = `<thead><tr><th>#</th><th>${this.t("playerReg")}</th><th>V</th><th>G</th></tr></thead><tbody>`;
    order.forEach(([j, s], i) => {
      html += `<tr><td>${i + 1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`;
    });
    this.elements.tablaRanking.innerHTML = html;
  },
  
  applyTranslations() { /* ... sin cambios ... */ },
  saveState() { sessionStorage.setItem("padelmatch_pro", JSON.stringify(this.state)); },
  loadState() {
    const savedData = sessionStorage.getItem("padelmatch_pro");
    if (savedData) this.state = JSON.parse(savedData);
  },
  saveAndRender() { this.saveState(); this.render(); },
  t(key) { return this.i18n[this.state.lang]?.[key] || key; },
  encodeKey: (m) => `${m[0]}&${m[1]}|${m[2]}&${m[3]}`,
  decodeKey: (k) => k.split('|').flatMap(p => p.split('&')),
  formatName: (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : "",

  // --- LÓGICAS DE GENERACIÓN DE RONDAS ---
  buildLiguillaRounds(players, courts = 1) {
    const pls = [...players];
    const need = (4 - (pls.length % 4)) % 4;
    for (let i = 0; i < need; i++) pls.push("BYE");
    const n = pls.length;
    const baseRounds = [];
    let arr = [...pls];
    for (let r = 0; r < n - 1; r++) {
      const groups = [];
      for (let g = 0; g < n; g += 4) groups.push(arr.slice(g, g + 4));
      baseRounds.push(groups);
      arr = [arr[0], ...arr.slice(2), arr[1]];
    }
    const finalRounds = [];
    baseRounds.forEach(round => {
      for (let i = 0; i < round.length; i += courts) {
        finalRounds.push(round.slice(i, i + courts));
      }
    });
    const groupToMatches = (g) => g.includes("BYE") ? [] : [[g[0], g[1], g[2], g[3]], [g[0], g[2], g[1], g[3]], [g[0], g[3], g[1], g[2]]];
    return finalRounds.map(round => round.flatMap(groupToMatches));
  },
};

document.addEventListener('DOMContentLoaded', () => PadelMatchApp.init());
