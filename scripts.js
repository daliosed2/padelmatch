let jugadores = [];

function crearEvento() {
  const nombre = document.getElementById("nombreEvento").value.trim();
  if (nombre === "") {
    alert("Por favor ingresa un nombre para el evento");
    return;
  }
  alert(`¡Evento "${nombre}" creado! 🎉`);
  document.getElementById("crear-evento").style.display = "none";
  document.getElementById("registro-jugadores").style.display = "block";
}

function agregarJugador() {
  const nombre = document.getElementById("nombreJugador").value.trim();
  if (nombre === "") {
    alert("Ingresa un nombre válido");
    return;
  }
  jugadores.push(nombre);
  mostrarJugadores();
  document.getElementById("nombreJugador").value = "";
}

function mostrarJugadores() {
  const lista = document.getElementById("listaJugadores");
  lista.innerHTML = "";
  jugadores.forEach((jugador, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${jugador}`;
    lista.appendChild(item);
  });
}
