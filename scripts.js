let jugadores = [];
let partidos = [];
let eventoNombre = "";

// =========================
// Función para crear evento
// =========================
function crearEvento() {
  const nombre = document.getElementById("nombreEvento").value.trim();
  if (nombre === "") {
    alert("Por favor ingresa un nombre para el evento");
    return;
  }
  eventoNombre = nombre;
  document.getElementById("crear-evento").style.display = "none";
  document.getElementById("registro-jugadores").style.display = "block";
  document.getElementById("nombreEventoActual").textContent = `Evento: ${eventoNombre}`;
  guardarEnLocalStorage();
}

// ==========================
// Función para agregar jugador
// ==========================
function agregarJugador() {
  const nombre = document.getElementById("nombreJugador").value.trim();
  if (nombre === "") {
    alert("Ingresa un nombre válido");
    return;
  }
  if (jugadores.includes(nombre)) {
    alert("Ese jugador ya está en la lista");
    return;
  }
  jugadores.push(nombre);
  mostrarJugadores();
  document.getElementById("nombreJugador").value = "";
  guardarEnLocalStorage();
}

// ===================================
// Mostrar lista actual de jugadores
// ===================================
function mostrarJugadores() {
  const lista = document.getElementById("listaJugadores");
  lista.innerHTML = "";
  jugadores.forEach((jugador, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${jugador}`;
    lista.appendChild(item);
  });
}

// ===========================
// Generar partidos 2 vs 2
// ===========================
function generarPartidos() {
  if (jugadores.length < 4) {
    alert("Se necesitan al menos 4 jugadores para generar partidos dobles.");
    return;
  }

  partidos = [];
  const combinaciones = obtenerCombinaciones(jugadores, 4);

  combinaciones.forEach((grupo) => {
    const [a1, a2, b1, b2] = grupo;
    partidos.push({
      equipoA: [a1, a2],
      equipoB: [b1, b2]
    });
  });

  mostrarPartidos(partidos);
  guardarEnLocalStorage();
}

// ===================================
// Obtener combinaciones de 4 jugadores
// ===================================
function obtenerCombinaciones(array, size) {
  const resultados = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      for (let k = 0; k < array.length; k++) {
        if (k === i || k === j) continue;
        for (let l = k + 1; l < array.length; l++) {
          if (l === i || l === j) continue;
          resultados.push([array[i], array[j], array[k], array[l]]);
        }
      }
    }
  }
  return resultados;
}

// ============================
// Mostrar partidos generados
// ============================
function mostrarPartidos(partidos) {
  const lista = document.getElementById("listaPartidos");
  lista.innerHTML = "";
  partidos.forEach((partido, index) => {
    const item = document.createElement("li");
    item.textContent = `Partido ${index + 1}: ${partido.equipoA.join(" & ")} vs ${partido.equipoB.join(" & ")}`;
    lista.appendChild(item);
  });
}

// ============================
// Guardar datos en localStorage
// ============================
function guardarEnLocalStorage() {
  localStorage.setItem("evento", JSON.stringify({
    nombre: eventoNombre,
    jugadores: jugadores,
    partidos: partidos
  }));
}

// =============================
// Cargar datos desde localStorage
// =============================
function cargarDesdeLocalStorage() {
  const data = JSON.parse(localStorage.getItem("evento"));
  if (data) {
    eventoNombre = data.nombre;
    jugadores = data.jugadores || [];
    partidos = data.partidos || [];

    document.getElementById("crear-evento").style.display = "none";
    document.getElementById("registro-jugadores").style.display = "block";

    document.getElementById("nombreEventoActual").textContent = `Evento: ${eventoNombre}`;
    mostrarJugadores();
    mostrarPartidos(partidos);
  }
}

// =============================
// Cargar datos al abrir la página
// =============================
window.onload = cargarDesdeLocalStorage;
