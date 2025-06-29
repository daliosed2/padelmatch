/*****************************************************************
 *  PadelMatch – dobles 2 vs 2
 *  - Ronda única con TODAS las combinaciones de parejas (n = 4 → 3 partidos)
 *  - Puntaje por partido y ranking individual
 *  - Reset y pestañas independientes (sessionStorage)
 *****************************************************************/

/* ---------- Variables ---------- */
let jugadores    = [];                 // lista de nombres
let eventoNombre = "";
let rondas       = [];                 // [ [ [a1,a2,b1,b2], ... ] ]  (una lista por ronda)
let resultados   = {};                 // { key: {gA,gB} }

const $ = id => document.getElementById(id);

/* ---------- Helpers de clave ---------- */
const encodeKey = ([a1,a2,b1,b2]) => `${a1}&${a2}|${b1}&${b2}`;
const decodeKey = key => {
  const [tA, tB] = key.split("|");
  return [...tA.split("&"), ...tB.split("&")];
};

/* ---------- Persistencia ---------- */
function guardar() {
  sessionStorage.setItem("padelmatch",
    JSON.stringify({ eventoNombre, jugadores, rondas, resultados })
  );
}
function cargar() {
  const d = JSON.parse(sessionStorage.getItem("padelmatch"));
  if (!d) return;
  ({ eventoNombre, jugadores, rondas, resultados } = d);
}

/* ---------- Botones globales ---------- */
function abrirNuevaPestana() { window.open(location.href, "_blank"); }
function resetEvento() {
  if (confirm("¿Borrar todos los datos y comenzar de nuevo?")) {
    sessionStorage.clear();
    location.reload();
  }
}

/* ---------- Crear evento ---------- */
function crearEvento() {
  const n = $("nombreEvento").value.trim();
  if (!n) return alert("Pon un nombre al evento");
  eventoNombre = n;
  $("nombreEventoActual").textContent = `Evento: ${eventoNombre}`;
  $("crear-evento").style.display  = "none";
  $("registro-jugadores").style.display = "block";
  guardar();
}

/* ---------- Gestión de jugadores ---------- */
function agregarJugador() {
  const n = $("nombreJugador").value.trim();
  if (!n) return alert("Nombre vacío");
  if (jugadores.includes(n)) return alert("Ese jugador ya está");
  jugadores.push(n);
  $("nombreJugador").value = "";
  pintarJugadores();
  guardar();
}
function pintarJugadores() {
  $("listaJugadores").innerHTML = jugadores
    .map((j, i) => `<li>${i + 1}. ${j}</li>`).join("");
}

/* ---------- Generar rondas con TODAS las combinaciones (n = 4) ---------- */
function generarRondas() {
  const nR = +$("numRondas").value;
  if (nR < 1) return alert("Indica un nº de rondas (≥1)");
  if (jugadores.length !== 4) return alert("Esta versión necesita exactamente 4 jugadores");

  rondas = [];
  for (let r = 0; r < nR; r++) {
    rondas.push(generarTodosLosPartidos(jugadores));
  }
  resultados = {};
  pintarRondas();
  actualizarRanking();
  $("ranking").style.display = "block";
  guardar();
}

/* --- con 4 jugadores produce los 3 partidos únicos --- */
function generarTodosLosPartidos(p) {
  // p[0] se empareja con cada uno -> forma todas las parejas
  return [
    [p[0], p[1], p[2], p[3]], // P0&P1 vs P2&P3
    [p[0], p[2], p[1], p[3]], // P0&P2 vs P1&P3
    [p[0], p[3], p[1], p[2]]  // P0&P3 vs P1&P2
  ];
}

/* ---------- Pintar calendario ---------- */
function pintarRondas() {
  const cont = $("rondasContainer");
  cont.innerHTML = "";

  rondas.forEach((matches, idxR) => {
    cont.innerHTML += `<h3>Ronda ${idxR + 1}</h3><ul id="ulR${idxR}"></ul>`;
    const ul = $(`ulR${idxR}`);

    matches.forEach((m, idxM) => {
      const key  = encodeKey(m);
      const gAId = `gA_${idxR}_${idxM}`;
      const gBId = `gB_${idxR}_${idxM}`;
      const gA   = resultados[key]?.gA ?? "";
      const gB   = resultados[key]?.gB ?? "";

      ul.innerHTML += `
<li>
  ${m[0]} & ${m[1]} vs ${m[2]} & ${m[3]}
  <input  type="number" id="${gAId}" min="0" placeholder="Games ${m[0]}-${m[1]}"
          value="${gA}" onchange="registrar('${key}')">
  <input  type="number" id="${gBId}" min="0" placeholder="Games ${m[2]}-${m[3]}"
          value="${gB}" onchange="registrar('${key}')">
</li>`;
    });
  });
}

/* ---------- Registrar resultado ---------- */
function registrar(key) {
  const inputs = document.querySelectorAll(`input[onchange*="${key}"]`);
  const gA = parseInt(inputs[0].value);
  const gB = parseInt(inputs[1].value);
  if (Number.isNaN(gA) || Number.isNaN(gB)) return;

  resultados[key] = { gA, gB };
  actualizarRanking();
  guardar();
}

/* ---------- Ranking individual ---------- */
function actualizarRanking() {
  const stat = {};
  jugadores.forEach(j => stat[j] = { vict: 0, games: 0 });

  Object.entries(resultados).forEach(([key, { gA, gB }]) => {
    const [a1, a2, b1, b2] = decodeKey(key);
    if (gA > gB) { stat[a1].vict++; stat[a2].vict++; }
    else if (gB > gA) { stat[b1].vict++; stat[b2].vict++; }

    stat[a1].games += gA; stat[a2].games += gA;
    stat[b1].games += gB; stat[b2].games += gB;
  });

  const orden = Object.entries(stat).sort((a, b) => {
    if (b[1].vict !== a[1].vict) return b[1].vict - a[1].vict;
    return b[1].games - a[1].games;
  });

  let html = "<tr><th>Pos</th><th>Jugador</th><th>Victorias</th><th>Games</th></tr>";
  orden.forEach(([j, s], i) => {
    html += `<tr><td>${i + 1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`;
  });
  $("tablaRanking").innerHTML = html;
}

/* ---------- Inicializar ---------- */
window.onload = () => {
  cargar();
  if (eventoNombre) {
    $("nombreEventoActual").textContent = `Evento: ${eventoNombre}`;
    $("crear-evento").style.display  = "none";
    $("registro-jugadores").style.display = "block";
    pintarJugadores();
    if (rondas.length) {
      pintarRondas();
      actualizarRanking();
      $("ranking").style.display = "block";
    }
  }
};
