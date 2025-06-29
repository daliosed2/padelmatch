/*****************************************************************
 *  PadelMatch – versión “multi-jugador / multi-cancha”
 *  -------------------------------------------------------------
 *  - Modo claro/oscuro automático (CSS)
 *  - ES / EN con botón
 *  - Añadir jugador con ENTER + capitalización
 *  - Algoritmo genérico: acepta 4, 6, 8, 10, 12… jugadores
 *    · Añade "BYE" si falta para múltiplo de 4
 *    · Respeta el nº de canchas (4 jugadores por cancha)
 *  - Ranking por victorias y games
 *****************************************************************/

/* ---------- Traducciones ---------- */
const i18n = {
  es: {
    newTab: "Nueva pestaña",
    reset: "Reset / Nuevo evento",
    createEvent: "Crear Parranda / Torneo (Dobles)",
    create: "Crear",
    playerReg: "Registro de jugadores",
    genCalendar: "Generar calendario",
    ranking: "Ranking",
    howManyCourts: "¿Cuántas canchas tienes disponibles?",
    needPlayers: "Se necesitan al menos 4 jugadores",
    sliceRounds: "Rondas solicitadas exceden las posibles; se repetirán."
  },
  en: {
    newTab: "New tab",
    reset: "Reset / New event",
    createEvent: "Create Match / Tournament (Doubles)",
    create: "Create",
    playerReg: "Player registration",
    genCalendar: "Generate schedule",
    ranking: "Leaderboard",
    howManyCourts: "How many courts are available?",
    needPlayers: "At least 4 players required",
    sliceRounds: "Requested rounds exceed possible; pattern will repeat."
  }
};
let lang = "es";

/* ---------- Estado ---------- */
let jugadores = [];       // nombres
let eventoNombre = "";
let rondas = [];          // [ [ [a1,a2,b1,b2] ... ] ]  (matches por ronda)
let resultados = {};      // { key : {gA,gB} }

const $ = (id) => document.getElementById(id);

/* ---------- Utilidades ---------- */
const t = (k) => i18n[lang][k] || k;
const encodeKey = ([a1, a2, b1, b2]) => `${a1}&${a2}|${b1}&${b2}`;
const decodeKey = (key) => {
  const [tA, tB] = key.split("|");
  return [...tA.split("&"), ...tB.split("&")];
};
const formatName = (s) =>
  s ? s.trim()[0].toUpperCase() + s.trim().slice(1).toLowerCase() : s;

/* ---------- Persistencia ---------- */
function save() {
  sessionStorage.setItem(
    "padelmatch",
    JSON.stringify({ eventoNombre, jugadores, rondas, resultados, lang })
  );
}
function load() {
  const d = JSON.parse(sessionStorage.getItem("padelmatch"));
  if (!d) return;
  ({ eventoNombre, jugadores, rondas, resultados, lang } = d);
}

/* ---------- Traducción dinámica ---------- */
function applyTranslations() {
  document
    .querySelectorAll("[data-t]")
    .forEach((el) => (el.textContent = t(el.dataset.t)));
  $("langTxt").textContent = lang === "es" ? "EN" : "ES";
}

/* ---------- Lucide ---------- */
function initLucide() {
  lucide.createIcons();
}

/* ---------- Algoritmo genérico de rondas y canchas ---------- */
function groupToMatches(g) {
  if (g.includes("BYE")) return []; // no juega
  return [
    [g[0], g[1], g[2], g[3]],
    [g[0], g[2], g[1], g[3]],
    [g[0], g[3], g[1], g[2]],
  ];
}

function buildRounds(players, courts = 1) {
  const pls = [...players];
  // 1. Rellenar hasta múltiplo de 4
  const need = (4 - (pls.length % 4)) % 4;
  for (let i = 0; i < need; i++) pls.push("BYE");

  const n = pls.length;
  const groupsPerRound = n / 4;
  const baseRounds = [];
  let arr = [...pls];

  const circleRounds = n - 1; // método del círculo

  for (let r = 0; r < circleRounds; r++) {
    const groups = [];
    for (let g = 0; g < n; g += 4) groups.push(arr.slice(g, g + 4));
    baseRounds.push(groups);
    // rotar (primer elemento fijo)
    arr = [arr[0], ...arr.slice(2), arr[1]];
  }

  /* Repartir por canchas: cada "round" final tendrá máx 'courts' grupos */
  const finalRounds = [];
  baseRounds.forEach((round) => {
    for (let i = 0; i < round.length; i += courts) {
      finalRounds.push(round.slice(i, i + courts));
    }
  });

  /* Convertimos grupos→matches */
  return finalRounds.map((round) =>
    round.flatMap((g) => groupToMatches(g))
  ); // array de partidos por ronda
}

/* ---------- Botones globales ---------- */
$("btnNueva").onclick = () => window.open(location.href, "_blank");
$("btnReset").onclick = () => {
  if (confirm("Reset?")) {
    sessionStorage.clear();
    location.reload();
  }
};
$("langBtn").onclick = () => {
  lang = lang === "es" ? "en" : "es";
  applyTranslations();
  save();
};

/* ---------- Crear evento ---------- */
$("crearBtn").onclick = () => {
  const n = $("nombreEvento").value.trim();
  if (!n) return;
  eventoNombre = n;
  $("nombreEventoActual").textContent = `${t("createEvent")}: ${eventoNombre}`;
  $("crear-evento").style.display = "none";
  $("registro-jugadores").style.display = "block";
  save();
  initLucide();
};

/* ---------- Jugadores ---------- */
$("addPlayerBtn").onclick = addPlayer;
$("nombreJugador").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addPlayer();
  }
});
function addPlayer() {
  let n = formatName($("nombreJugador").value);
  if (!n) return;
  if (jugadores.map((j) => j.toLowerCase()).includes(n.toLowerCase()))
    return alert("Jugador duplicado");
  jugadores.push(n);
  $("nombreJugador").value = "";
  renderPlayers();
  save();
  initLucide();
}
function renderPlayers() {
  $("listaJugadores").innerHTML = jugadores
    .map((j) => `<li>${j}</li>`)
    .join("");
}

/* ---------- Generar calendario ---------- */
$("genRndBtn").onclick = generateSchedule;
function generateSchedule() {
  const nR = +$("numRondas").value || 1;
  if (jugadores.length < 4) return alert(t("needPlayers"));
  const courts =
    parseInt(prompt(t("howManyCourts") + " (≥1)"), 10) || 1;

  const roundsAll = buildRounds(jugadores, courts);

  // recortar o repetir según nR
  rondas = [];
  for (let i = 0; i < nR; i++) {
    rondas.push(roundsAll[i % roundsAll.length]);
    if (i >= roundsAll.length) console.warn(t("sliceRounds"));
  }

  resultados = {};
  renderRounds();
  updateRanking();
  $("ranking").style.display = "block";
  save();
  initLucide();
}

/* ---------- Pintar rondas ---------- */
function renderRounds() {
  const cont = $("rondasContainer");
  cont.innerHTML = "";

  rondas.forEach((matches, idxR) => {
    const h3 = document.createElement("h3");
    h3.textContent = `${t("ranking")} R${idxR + 1}`;
    cont.appendChild(h3);

    const ul = document.createElement("ul");
    cont.appendChild(ul);

    matches.forEach((m) => {
      const key = encodeKey(m);
      const li = document.createElement("li");
      ul.appendChild(li);

      li.innerHTML = `
        ${m[0]} & ${m[1]} <strong>vs</strong> ${m[2]} & ${m[3]}
        <input type="number" class="score-input" min="0"
               placeholder="Games ${m[0]}-${m[1]}" value="${resultados[key]?.gA ?? ""}">
        <input type="number" class="score-input" min="0"
               placeholder="Games ${m[2]}-${m[3]}" value="${resultados[key]?.gB ?? ""}">
      `;
      li
        .querySelectorAll("input")
        .forEach((inp) => (inp.onchange = () => record(key, li)));
    });
  });
}

/* ---------- Registrar resultado ---------- */
function record(key, li) {
  const inputs = li.querySelectorAll("input");
  const gA = parseInt(inputs[0].value);
  const gB = parseInt(inputs[1].value);
  if (Number.isNaN(gA) || Number.isNaN(gB)) return;
  resultados[key] = { gA, gB };
  updateRanking();
  save();
}

/* ---------- Ranking ---------- */
function updateRanking() {
  const stat = {};
  jugadores.forEach((j) => (stat[j] = { vict: 0, games: 0 }));

  Object.entries(resultados).forEach(([k, { gA, gB }]) => {
    const [a1, a2, b1, b2] = decodeKey(k);
    if (gA > gB) {
      stat[a1].vict++;
      stat[a2].vict++;
    } else if (gB > gA) {
      stat[b1].vict++;
      stat[b2].vict++;
    }
    stat[a1].games += gA;
    stat[a2].games += gA;
    stat[b1].games += gB;
    stat[b2].games += gB;
  });

  const order = Object.entries(stat).sort(
    (a, b) => b[1].vict - a[1].vict || b[1].games - a[1].games
  );

  let html = `<tr><th>#</th><th>${t("playerReg")}</th><th>V</th><th>G</th></tr>`;
  order.forEach(
    ([j, s], i) =>
      (html += `<tr><td>${i + 1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`)
  );
  $("tablaRanking").innerHTML = html;
}

/* ---------- Inicialización ---------- */
window.onload = () => {
  load();
  applyTranslations();

  if (eventoNombre) {
    $("nombreEventoActual").textContent = `${t("createEvent")}: ${eventoNombre}`;
    $("crear-evento").style.display = "none";
    $("registro-jugadores").style.display = "block";
  }
  renderPlayers();
  if (rondas.length) {
    renderRounds();
    updateRanking();
    $("ranking").style.display = "block";
  }
  initLucide();
};
