const urlParams = new URLSearchParams(window.location.search);
const partidoId = urlParams.get("id");

const scoreDisplay = document.getElementById("scoreDisplay");
const matchStatus = document.getElementById("matchStatus");
const actionsContainer = document.getElementById("actionsComments");
const lineupA = document.getElementById("lineupA");
const lineupB = document.getElementById("lineupB");

async function cargarPartido() {
  try {
    const res = await fetch(`/api/match/${partidoId}`);
    const data = await res.json();

    document.getElementById("teamAName").textContent = data.equipoA.nombre;
    document.getElementById("teamBName").textContent = data.equipoB.nombre;

    scoreDisplay.textContent = `${data.golesA} - ${data.golesB}`;
    matchStatus.textContent = data.estado === "finalizado" ? "Final" : "En vivo";

    renderAlineaciones(data.jugadoresA, lineupA);
    renderAlineaciones(data.jugadoresB, lineupB);

  } catch (err) {
    console.error("Error al cargar datos del partido:", err);
  }
}

function renderAlineaciones(jugadores, contenedor) {
  contenedor.innerHTML = jugadores.map(j => `
    <div class="player-lineup">
      <img src="${j.foto || 'img/avatar-default.png'}" />
      <div>
        <strong>#${j.numero}</strong> ${j.nombre}<br/>
        <small>${j.posicion}</small>
      </div>
    </div>
  `).join("");
}

async function cargarEventos() {
  try {
    const res = await fetch(`/api/events/${partidoId}`);
    const eventos = await res.json();

    actionsContainer.innerHTML = eventos.map(ev => renderBurbujaEvento(ev)).join("");
  } catch (err) {
    console.error("Error al cargar eventos:", err);
  }
}

function renderBurbujaEvento(ev) {
  return `
    <div class="chat-bubble ${ev.tipo}">
      <img src="${ev.foto || 'img/avatar-default.png'}" />
      <div class="bubble-content">
        <div class="bubble-header">
          <strong>${ev.nombre}</strong> (${ev.posicion})
        </div>
        <div class="bubble-action">
          ${renderAccionTexto(ev)}
        </div>
        <div class="bubble-time">
          ${ev.minuto}' min
        </div>
      </div>
    </div>
  `;
}

function renderAccionTexto(ev) {
  if (ev.tipo === "gol") return "⚽ Gol";
  if (ev.tipo === "tarjeta") return ev.tarjeta === "roja" ? "🟥 Tarjeta Roja" : "🟨 Tarjeta Amarilla";
  if (ev.tipo === "accion") return `🕹️ ${ev.accion}`;
  return "Evento";
}

// Carga inicial
cargarPartido();
cargarEventos();

// Refrescar cada 20s si está en vivo
setInterval(() => {
  if (matchStatus.textContent === "En vivo") {
    cargarPartido();
    cargarEventos();
  }
}, 20000);
