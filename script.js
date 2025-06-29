/*****************************************************************
 * PadelMatch Pro – v2.4 (Sintaxis Corregida)
 * - Se corrige el error "Unexpected end of input" por una coma faltante.
 *****************************************************************/
const PadelMatchApp = {
  state: {
    jugadores: [],
    eventoNombre: "",
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
    try {
      this.cacheElements();
      this.loadState();
      this.addEventListeners();
      this.render();
      console.log("PadelMatchApp inicializado correctamente.");
    } catch (error) {
      console.error("Error fatal durante la inicialización de PadelMatchApp:", error);
      alert("Error grave en la aplicación. Revisa la consola de desarrollador (F12) para más detalles.");
    }
  },

  cacheElements() {
    const elementIds = [
      'crear-evento', 'app-view', 'ranking', 'rondasContainer', 'listaJugadores',
      'tablaRanking', 'nombreEvento', 'crearBtn', 'nombreJugador', 'addPlayerBtn',
      'numRondas', 'genRndBtn', 'nombreEventoActual', 'langTxt', 'btnNueva',
      'btnReset', 'langBtn', 'registro-jugadores'
    ];
    elementIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`Elemento de HTML con id "${id}" no fue encontrado.`);
      const camelCaseId = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
      this.elements[camelCaseId] = el;
    });
  },

  addEventListeners() {
    this.elements.crearBtn.onclick = () => this.createEvent();
    this.elements.addPlayerBtn.onclick = () => this.addPlayer();
    this.elements.genRndBtn.onclick = () => this.generateSchedule();
    this.elements.nombreJugador.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addPlayer();
      }
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

  createEvent() {
    const n = this.elements.nombreEvento.value.trim();
    if (!n) return;
    this.state.eventoNombre = n;
    this.elements.nombreEvento.value = "";
    this.saveAndRender();
  },

  addPlayer() {
    const n = this.formatName(this.elements.nombreJugador.value);
    if (!n) return;
    if (this.state.jugadores.map(j => j.toLowerCase()).includes(n.toLowerCase())) {
      alert("Jugador duplicado");
      return;
    }
    this.state.jugadores.push(n);
    this.elements.nombreJugador.value = "";
    this.elements.nombreJugador.focus();
    this.saveAndRender();
  },

  generateSchedule() {
    if (this.state.jugadores.length < 4) {
      alert(this.t("needPlayers"));
      return;
    }
    const nR = +this.elements.numRondas.value || 3;
    const courts = parseInt(prompt(this.t("howManyCourts") + " (≥1)"), 10) || 1;
    const allPossibleRounds = this.buildRounds(this.state.jugadores, courts);
    this.state.rondas = [];
    for (let i = 0; i < nR; i++) {
      this.state.rondas.push(allPossibleRounds[i % allPossibleRounds.length]);
      if (i >= allPossibleRounds.length) console.warn(this.t("sliceRounds"));
    }
    this.state.resultados = {};
    this.saveAndRender();
  },

  recordResult(inputElement) {
    const li = inputElement.closest('.match-list__item');
    if (!li) return;
    const key = li.dataset.key;
    const inputs = li.querySelectorAll('.score-input');
    const gA_val = inputs[0].value;
    const gB_val = inputs[1].value;
    const gA = gA_val === "" ? "" : parseInt(gA_val, 10);
    const gB = gB_val === "" ? "" : parseInt(gB_val, 10);
    if (gA === "" && gB === "") {
      delete this.state.resultados[key];
    } else {
      this.state.resultados[key] = {
        gA: isNaN(gA) ? "" : gA,
        gB: isNaN(gB) ? "" : gB
      };
    }
    this.saveState();
    this.updateRanking();
  },

  render() {
    const hasEvent = !!this.state.eventoNombre;
    this.elements.crearEvento.classList.toggle('hidden', hasEvent);
    this.elements.appView.classList.toggle('hidden', !hasEvent);
    if (hasEvent) {
      this.elements.nombreEventoActual.textContent = this.state.eventoNombre;
      this.renderPlayers();
      const hasRounds = this.state.rondas && this.state.rondas.length > 0;
      this.elements.rondasContainer.classList.toggle('hidden', !hasRounds);
      this.elements.ranking.classList.toggle('hidden', !hasRounds);
      if (hasRounds) {
        this.renderRounds();
        this.updateRanking();
      }
    }
    this.applyTranslations();
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderPlayers() {
    this.elements.listaJugadores.innerHTML = this.state.jugadores
      .map(j => `<li class="player-list__item">${j}</li>`).join("");
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
              </div>
            </li>`;
        }).join('')}
      </ul>`).join('');
  },

  updateRanking() {
    const stats = {};
    this.state.jugadores.forEach(j => (stats[j] = { vict: 0, games: 0 }));
    Object.entries(this.state.resultados).forEach(([k, { gA, gB }]) => {
      if (typeof gA === 'number' && typeof gB === 'number') {
        const [a1, a2, b1, b2] = this.decodeKey(k);
        if (gA > gB) {
          stats[a1].vict++; stats[a2].vict++;
        } else if (gB > gA) {
          stats[b1].vict++; stats[b2].vict++;
        }
        stats[a1].games += gA; stats[a2].games += gA;
        stats[b1].games += gB; stats[b2].games += gB;
      }
    });
    const order = Object.entries(stats).sort((a, b) => b[1].vict - a[1].vict || b[1].games - a[1].games);
    let html = `<thead><tr><th>#</th><th>${this.t("playerReg")}</th><th>V</th><th>G</th></tr></thead><tbody>`;
    order.forEach(([j, s], i) => {
      html += `<tr><td>${i + 1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`;
    });
    html += `</tbody>`;
    this.elements.tablaRanking.innerHTML = html;
  },

  applyTranslations() {
    document.querySelectorAll("[data-t]").forEach(el => {
      const textKey = el.dataset.t;
      if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
        el.textContent = this.t(textKey);
      } else {
        const textNode = Array.from(el.childNodes).find(node => node.nodeType === 3);
        if (textNode) {
          textNode.textContent = ` ${this.t(textKey)} `;
        }
      }
    });
    this.elements.langTxt.textContent = this.state.lang === "es" ? "EN" : "ES";
  },

  saveState() {
    sessionStorage.setItem("padelmatch_pro", JSON.stringify(this.state));
  },
  loadState() {
    const savedData = sessionStorage.getItem("padelmatch_pro");
    if (savedData) this.state = JSON.parse(savedData);
  },
  saveAndRender() {
    this.saveState();
    this.render();
  },
  t(key) { return this.i18n[this.state.lang]?.[key] || key; },
  encodeKey: (m) => `${m[0]}&${m[1]}|${m[2]}&${m[3]}`,
  decodeKey: (k) => {
    const [tA, tB] = k.split("|");
    return [...tA.split("&"), ...tB.split("&")];
  },
  
  formatName: (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : "",
  
  // *** LA COMA FALTANTE ESTABA AQUÍ (después de la línea de formatName) ***
  
  buildRounds(players, courts = 1) {
    const pls = [...players];
    const need = (4 - (pls.length % 4)) % 4;
    for (let i = 0; i < need; i++) pls.push("BYE");
    const n = pls.length;
    const baseRounds = [];
    let arr = [...pls];
    const circleRounds = n - 1;
    for (let r = 0; r < circleRounds; r++) {
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
