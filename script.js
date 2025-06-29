/*****************************************************************
 * PadelMatch Pro – v2.1 (Corregido)
 * -------------------------------------------------------------
 * Refactorizado para ser más modular, escalable y mantenible.
 * - Lógica encapsulada en el objeto PadelMatchApp.
 * - Estado centralizado.
 * - Renderizado declarativo.
 * - Delegación de eventos.
 * - Corrección en el registro de marcadores.
 *****************************************************************/

const PadelMatchApp = {
  // --- Estado centralizado de la aplicación ---
  state: {
    jugadores: [],
    eventoNombre: "",
    rondas: [],
    resultados: {}, // { matchKey: { gA, gB } }
    lang: "es",
  },

  // --- Traducciones ---
  i18n: {
    es: { newTab: "Nueva pestaña", reset: "Reset / Nuevo evento", createEvent: "Crear partida / Torneo", create: "Crear", playerReg: "Registro de jugadores", genCalendar: "Generar calendario", ranking: "Ranking", howManyCourts: "¿Cuántas canchas tienes disponibles?", needPlayers: "Se necesitan al menos 4 jugadores", sliceRounds: "Rondas solicitadas exceden las posibles; se repetirán." },
    en: { newTab: "New tab", reset: "Reset / New event", createEvent: "Create Match / Tournament (Doubles)", create: "Create", playerReg: "Player registration", genCalendar: "Generate schedule", ranking: "Leaderboard", howManyCourts: "How many courts are available?", needPlayers: "At least 4 players required", sliceRounds: "Requested rounds exceed possible; pattern will repeat." }
  },

  // --- Selectores del DOM cacheados ---
  elements: {},

  // =================================================================
  // MÉTODO PRINCIPAL DE INICIALIZACIÓN
  // =================================================================
  init() {
    this.elements = {
      crearEventoView: document.getElementById('crear-evento'),
      appView: document.getElementById('app-view'),
      rankingView: document.getElementById('ranking'),
      rondasContainer: document.getElementById('rondasContainer'),
      listaJugadores: document.getElementById('listaJugadores'),
      tablaRanking: document.getElementById('tablaRanking'),
      nombreEvento: document.getElementById('nombreEvento'),
      crearBtn: document.getElementById('crearBtn'),
      nombreJugador: document.getElementById('nombreJugador'),
      addPlayerBtn: document.getElementById('addPlayerBtn'),
      numRondas: document.getElementById('numRondas'),
      genRndBtn: document.getElementById('genRndBtn'),
      nombreEventoActual: document.getElementById('nombreEventoActual'),
      langTxt: document.getElementById('langTxt'),
      btnNueva: document.getElementById('btnNueva'),
      btnReset: document.getElementById('btnReset'),
      langBtn: document.getElementById('langBtn'),
    };

    this.loadState();
    this.addEventListeners();
    this.render();
  },

  // =================================================================
  // GESTIÓN DE EVENTOS
  // =================================================================
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
      if (e.target.classList.contains('score-input')) {
        this.recordResult(e.target);
      }
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

  // =================================================================
  // LÓGICA DE LA APLICACIÓN
  // =================================================================
  createEvent() {
    const n = this.elements.nombreEvento.value.trim();
    if (!n) return;
    this.state.eventoNombre = n;
    this.elements.nombreEvento.value = "";
    this.saveAndRender();
  },

  addPlayer() {
    let n = this.formatName(this.elements.nombreJugador.value);
    if (!n) return;
    if (this.state.jugadores.map((j) => j.toLowerCase()).includes(n.toLowerCase())) {
      alert("Jugador duplicado");
      return;
    }
    this.state.jugadores.push(n);
    this.elements.nombreJugador.value = "";
    this.saveAndRender();
  },

  generateSchedule() {
    const nR = +this.elements.numRondas.value || 1;
    if (this.state.jugadores.length < 4) {
      alert(this.t("needPlayers"));
      return;
    }
    const courts = parseInt(prompt(this.t("howManyCourts") + " (≥1)"), 10) || 1;

    const roundsAll = this.buildRounds(this.state.jugadores, courts);

    this.state.rondas = [];
    for (let i = 0; i < nR; i++) {
      this.state.rondas.push(roundsAll[i % roundsAll.length]);
      if (i >= roundsAll.length) console.warn(this.t("sliceRounds"));
    }

    this.state.resultados = {};
    this.saveAndRender();
  },

  recordResult(inputElement) {
    const li = inputElement.closest('.match-list__item');
    const key = li.dataset.key;
    const inputs = li.querySelectorAll('.score-input');
    const gA_val = inputs[0].value;
    const gB_val = inputs[1].value;

    const gA = !isNaN(parseInt(gA_val, 10)) ? parseInt(gA_val, 10) : "";
    const gB = !isNaN(parseInt(gB_val, 10)) ? parseInt(gB_val, 10) : "";

    if (gA === "" && gB === "") {
      delete this.state.resultados[key];
    } else {
      this.state.resultados[key] = { gA, gB };
    }

    // Corrección: Solo guardamos estado y actualizamos ranking, sin re-renderizar todo.
    this.saveState();
    this.updateRanking();
  },

  // =================================================================
  // RENDERIZADO (PINTAR LA UI)
  // =================================================================
  render() {
    this.applyTranslations();

    const hasEvent = !!this.state.eventoNombre;
    this.elements.crearEventoView.classList.toggle('hidden', hasEvent);
    this.elements.appView.classList.toggle('hidden', !hasEvent);

    if (hasEvent) {
      this.elements.nombreEventoActual.textContent = this.state.eventoNombre;
      this.renderPlayers();

      const hasRounds = this.state.rondas.length > 0;
      this.elements.rankingView.classList.toggle('hidden', !hasRounds);
      this.elements.rondasContainer.classList.toggle('hidden', !hasRounds);

      if (hasRounds) {
        this.renderRounds();
        this.updateRanking();
      }
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderPlayers() {
    this.elements.listaJugadores.innerHTML = this.state.jugadores
      .map(j => `<li class="player-list__item">${j}</li>`)
      .join("");
  },

  renderRounds() {
    this.elements.rondasContainer.innerHTML = this.state.rondas.map((matches, idxR) => `
      <h3 class="card__title">Ronda ${idxR + 1}</h3>
      <ul class="match-list">
        ${matches.map(m => {
          const key = this.encodeKey(m);
          const res = this.state.resultados[key] || { gA: "", gB: "" };
          return `
            <li class="match-list__item" data-key="${key}">
              <span class="match-list__teams">${m[0]} & ${m[1]} <strong>vs</strong> ${m[2]} & ${m[3]}</span>
              <div class="match-list__inputs">
                <input type="number" class="score-input" min="0" placeholder="-" value="${res.gA}">
                <input type="number" class="score-input" min="0" placeholder="-" value="${res.gB}">
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    `).join('');
  },

  updateRanking() {
    const stats = {};
    this.state.jugadores.forEach((j) => (stats[j] = { vict: 0, games: 0 }));

    Object.entries(this.state.resultados).forEach(([k, { gA, gB }]) => {
      // Corrección: Solo computar si ambos marcadores son números.
      if (typeof gA === 'number' && typeof gB === 'number') {
        const [a1, a2, b1, b2] = this.decodeKey(k);
        if (gA > gB) {
          stats[a1].vict++;
          stats[a2].vict++;
        } else if (gB > gA) {
          stats[b1].vict++;
          stats[b2].vict++;
        }
        stats[a1].games += gA;
        stats[a2].games += gA;
        stats[b1].games += gB;
        stats[b2].games += gB;
      }
    });

    const order = Object.entries(stats).sort(
      (a, b) => b[1].vict - a[1].vict || b[1].games - a[1].games
    );

    let html = `<thead><tr><th>#</th><th>${this.t("playerReg")}</th><th>V</th><th>G</th></tr></thead><tbody>`;
    order.forEach(
      ([j, s], i) =>
      (html += `<tr><td>${i + 1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`)
    );
    html += `</tbody>`;
    this.elements.tablaRanking.innerHTML = html;
  },

  applyTranslations() {
    document.querySelectorAll("[data-t]").forEach((el) => {
      const key = el.dataset.t;
      // Solo actualiza si el elemento no tiene hijos de tipo elemento (para no sobreescribir los íconos)
      if (el.children.length === 0) {
        el.textContent = this.t(key);
      } else {
        // Si tiene hijos (como el ícono), busca el nodo de texto para actualizar
        const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
        if (textNode) {
          textNode.textContent = ` ${this.t(key)} `;
        }
      }
    });
    this.elements.langTxt.textContent = this.state.lang === "es" ? "EN" : "ES";
  },

  // =================================================================
  // PERSISTENCIA Y UTILIDADES
  // =================================================================
  saveState() {
    sessionStorage.setItem("padelmatch_pro", JSON.stringify(this.state));
  },

  loadState() {
    const savedData = sessionStorage.getItem("padelmatch_pro");
    if (savedData) {
      this.state = JSON.parse(savedData);
    }
  },

  saveAndRender() {
    this.saveState();
    this.render();
  },

  t(key) { return this.i18n[this.state.lang][key] || key },
  encodeKey: ([a1, a2, b1, b2]) => `${a1}&${a2}|${b1}&${b2}`,
  decodeKey: (key) => {
    const [tA, tB] = key.split("|");
    return [...tA.split("&"), ...tB.split("&")];
  },
  formatName: (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s,

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
    baseRounds.forEach((round) => {
      for (let i = 0; i < round.length; i += courts) {
        finalRounds.push(round.slice(i, i + courts));
      }
    });

    const groupToMatches = (g) => g.includes("BYE") ? [] : [[g[0], g[1], g[2], g[3]], [g[0], g[2], g[1], g[3]], [g[0], g[3], g[1], g[2]]];
    return finalRounds.map((round) => round.flatMap(groupToMatches));
  },
};

document.addEventListener('DOMContentLoaded', () => PadelMatchApp.init());
