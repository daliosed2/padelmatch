let jugadores = [];

// Cargar datos almacenados si existen
window.addEventListener('DOMContentLoaded', () => {
  const almacenados = localStorage.getItem('jugadores');
  if (almacenados) {
    jugadores = JSON.parse(almacenados);
    mostrarJugadores();
    document.getElementById('registro-jugadores').style.display = 'block';
    document.getElementById('crear-evento').style.display = 'none';
  }
  document.getElementById('btnCrearEvento').addEventListener('click', crearEvento);
  document.getElementById('btnAgregarJugador').addEventListener('click', agregarJugador);
});

function crearEvento() {
  const nombre = document.getElementById('nombreEvento').value.trim();
  if (nombre === '') {
    alert('Por favor ingresa un nombre para el evento');
    return;
  }
  localStorage.setItem('nombreEvento', nombre);
  alert(`¡Evento "${nombre}" creado! 🎉`);
  document.getElementById('crear-evento').style.display = 'none';
  document.getElementById('registro-jugadores').style.display = 'block';
}

function agregarJugador() {
  const nombre = document.getElementById('nombreJugador').value.trim();
  if (nombre === '') {
    alert('Ingresa un nombre válido');
    return;
  }
  jugadores.push(nombre);
  localStorage.setItem('jugadores', JSON.stringify(jugadores));
  mostrarJugadores();
  document.getElementById('nombreJugador').value = '';
}

function mostrarJugadores() {
  const lista = document.getElementById('listaJugadores');
  lista.innerHTML = '';
  jugadores.forEach((jugador, index) => {
    const item = document.createElement('li');
    item.textContent = `${index + 1}. ${jugador}`;
    lista.appendChild(item);
  });
}
