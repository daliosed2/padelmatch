/*****************************************************************
 *  PadelMatch – gestión de rondas, resultados y ranking
 *****************************************************************/

/* ---------- Variables globales ---------- */
let jugadores   = [];
let eventoNombre = "";
let rondas      = [];          // Array de rondas => [ [p1,p2], ... ]
let resultados  = {};          // { "Ana|Beto": {g1:6, g2:4} }

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);

/* ---------- Persistencia ---------- */
function guardarEstado() {
  localStorage.setItem("padelmatch",
    JSON.stringify({ eventoNombre, jugadores, rondas, resultados })
  );
}
function cargarEstado() {
  const d = JSON.parse(localStorage.getItem("padelmatch"));
  if (!d) return;
  ({ eventoNombre, jugadores, rondas, resultados } = d);
}

/* ---------- Creación de evento ---------- */
function crearEvento() {
  const nombre = $("nombreEvento").value.trim();
  if (!nombre) return alert("Pon un nombre al evento");
  eventoNombre = nombre;
  $("nombreEventoActual").textContent = `Evento: ${eventoNombre}`;
  $("crear-evento").style.display = "none";
  $("registro-jugadores").style.display = "block";
  guardarEstado();
}

/* ---------- Gestión de jugadores ---------- */
function agregarJugador() {
  const n = $("nombreJugador").value.trim();
  if (!n) return alert("Nombre vacío");
  if (jugadores.includes(n)) return alert("Ese jugador ya está");
  jugadores.push(n);
  $("nombreJugador").value = "";
  pintarJugadores();
  guardarEstado();
}
function pintarJugadores() {
  $("listaJugadores").innerHTML = jugadores
    .map((j, i) => `<li>${i + 1}. ${j}</li>`)
    .join("");
}

/* ---------- Generar rondas (round-robin) ---------- */
function generarRondas() {
  const nR = +$("numRondas").value;
  if (nR < 1) return alert("Indica un nº de rondas (≥1)");
  if (jugadores.length < 2) return alert("Mínimo 2 jugadores");

  rondas = roundRobin(jugadores, nR);
  resultados = {};          // limpiar resultados previos
  pintarRondas();
  actualizarRanking();
  $("ranking").style.display = "block";
  guardarEstado();
}

/* Algoritmo del círculo: devuelve matriz de rondas */
function roundRobin(lista, nR) {
  const p = [...lista];
  if (p.length % 2) p.push("BYE");           // si impar, añade BYE
  const total = p.length - 1;
  const res = [];

  for (let r = 0; r < Math.min(nR, total); r++) {
    const partidas = [];
    for (let i = 0; i < p.length / 2; i++) {
      const a = p[i], b = p[p.length - 1 - i];
      if (a !== "BYE" && b !== "BYE") partidas.push([a, b]);
    }
    res.push(partidas);
    /* rotación */
    p.splice(1, 0, p.pop());
  }
  return res;
}

/* ---------- Pintar rondas + inputs de games ---------- */
function pintarRondas() {
  const cont = $("rondasContainer");
  cont.innerHTML = "";

  rondas.forEach((partidos, idxR) => {
    cont.innerHTML += `<h3>Ronda ${idxR + 1}</h3><ul id="ulR${idxR}"></ul>`;
    const ul = $(`ulR${idxR}`);

    partidos.forEach((par, idxP) => {
      const key   = par.join("|");
      const g1Id  = `g1_${idxR}_${idxP}`;
      const g2Id  = `g2_${idxR}_${idxP}`;
      const g1Val = resultados[key]?.g1 ?? "";
      const g2Val = resultados[key]?.g2 ?? "";

      ul.innerHTML += `
<li>
  ${par[0]} vs ${par[1]}
  <input type="number" id="${g1Id}" min="0" placeholder="${par[0]}" value="${g1Val}"
         onchange="registrarResultado('${key}')">
  <input type="number" id="${g2Id}" min="0" placeholder="${par[1]}" value="${g2Val}"
         onchange="registrarResultado('${key}')">
</li>`;
    });
  });
}

/* ---------- Registrar resultado de un partido ---------- */
function registrarResultado(key) {
  /* localizar los dos inputs de este partido */
  const inputs = document.querySelectorAll(`input[onchange*="${key}"]`);
  const g1 = parseInt(inputs[0].value);
  const g2 = parseInt(inputs[1].value);
  if (Number.isNaN(g1) || Number.isNaN(g2)) return;  // incompleto

  resultados[key] = { g1, g2 };
  actualizarRanking();
  guardarEstado();
}

/* ---------- Calcular y mostrar ranking ---------- */
function actualizarRanking() {
  /* estructura { jugador: {vict, games} } */
  const stats = {};
  jugadores.forEach(j => stats[j] = { vict: 0, games: 0 });

  /* recorrer resultados */
  Object.entries(resultados).forEach(([key, res]) => {
    const [p1, p2] = key.split("|");
    if (!res) return;
    if (res.g1 > res.g2) stats[p1].vict++;
    else if (res.g2 > res.g1) stats[p2].vict++;

    stats[p1].games += res.g1;
    stats[p2].games += res.g2;
  });

  /* ordenar por victorias y luego games */
  const orden = Object.entries(stats).sort((a, b) => {
    if (b[1].vict !== a[1].vict) return b[1].vict - a[1].vict;
    return b[1].games - a[1].games;
  });

  /* pintar tabla */
  let html = "<tr><th>Pos</th><th>Jugador</th><th>Victorias</th><th>Games</th></tr>";
  orden.forEach(([j, s], idx) => {
    html += `<tr><td>${idx + 1}</td><td>${j}</td><td>${s.vict}</td><td>${s.games}</td></tr>`;
  });
  $("tablaRanking").innerHTML = html;
}

/* ---------- Cargar estado al abrir ---------- */
window.onload = () => {
  cargarEstado();
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
