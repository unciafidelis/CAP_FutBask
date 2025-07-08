// panel.js

// ————————————— Variables globales —————————————
let partidoActivo = null;
let equipoActualSeleccion = null; // "A" o "B"

const positionColors = {
  GK: 'position-GK',
  D:  'position-D',
  M:  'position-M',
  FW: 'position-FW'
};

// ————————————— Referencias DOM —————————————
const partidoSelect        = document.getElementById("partidoSelect");
const modalSeleccion       = document.getElementById("modalSeleccion");
const playerModal          = document.getElementById("playerModal");
const playersContainer     = document.getElementById("playersContainer");
const closeModalBtn        = document.getElementById("closeModal");
const guardarAlineacionBtn = document.getElementById("guardarAlineacion");
const btnAbrirModal        = document.getElementById("btnAbrirModal");
const btnConfigMain        = document.getElementById("btnConfigMain");
const configOptions        = document.getElementById("configOptions");
const toggleLeft           = document.getElementById('toggleLeft');
const sidebarLeft          = document.getElementById('sidebarLeft');
const toggleRight          = document.getElementById('toggleRight');
const sidebarRight         = document.getElementById('sidebarRight');
const btnCambioA           = document.getElementById('btnRealizarCambioA');
const btnCambioB           = document.getElementById('btnRealizarCambioB');

let jugadorCanchaSeleccionado = null;
let jugadorBancaSeleccionado  = null;

// ————————— Mostrar modal principal al cargar ————————
window.addEventListener("load", () => {
  modalSeleccion.style.display = "flex";
});

// ————————— Control Modal Principal ——————————
btnAbrirModal.addEventListener("click", () => modalSeleccion.style.display = "flex");
window.cerrarModal = () => modalSeleccion.style.display = "none";
window.guardarSeleccion = () => {
  const selectedId = partidoSelect.value;
  if (!selectedId) {
    alert("Selecciona un partido válido.");
    return;
  }
  localStorage.setItem("partidoActivo", selectedId);
  cargarDatosPartido(selectedId);
  cerrarModal();
};

// ————————— Cargar datos de un partido —————————
function cargarDatosPartido(partidoId) {
  fetch(`/api/matches/${partidoId}`)
    .then(res => res.json())
    .then(partido => {
      partidoActivo = partido;
      localStorage.setItem("equipoA_id", partido.equipoA_id);
      localStorage.setItem("equipoB_id", partido.equipoB_id);
      // Actualizar nombres
      [
        ["nombreEquipoA", partido.equipoA],
        ["nombreEquipoB", partido.equipoB],
        ["nombreFooterA", partido.equipoA],
        ["nombreFooterB", partido.equipoB],
        ["nombreModalEquipoA", partido.equipoA],
        ["nombreModalEquipoB", partido.equipoB],
      ].forEach(([id, text]) => document.getElementById(id).textContent = text);
      // Actualizar logos
      document.getElementById("logoFooterA").src  = partido.logoA || "placeholderA.png";
      document.getElementById("logoFooterB").src  = partido.logoB || "placeholderB.png";
      document.getElementById("logoEquipoA").src = partido.logoA || "placeholderA.png";
      document.getElementById("logoEquipoB").src = partido.logoB || "placeholderB.png";
    })
    .catch(err => {
      console.error("❌ Error al cargar datos del partido:", err);
      alert("No se pudo cargar la información del partido.");
    });
}

// ————————— Carga inicial de partidos en el select —————————
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/matches")
    .then(res => res.json())
    .then(partidos => {
      partidoSelect.innerHTML = '';
      if (partidos.length === 0) {
        partidoSelect.innerHTML = `<option value="">No hay partidos disponibles</option>`;
        modalSeleccion.style.display = "flex";
        return;
      }
      partidos.forEach(p => {
        const opt = document.createElement("option");
        opt.value       = p.id;
        opt.textContent = `${p.nombreEquipoA} vs ${p.nombreEquipoB} (${p.fecha} ${p.hora})`;
        partidoSelect.appendChild(opt);
      });
      const pid = localStorage.getItem("partidoActivo");
      if (pid && partidos.some(p => p.id == pid)) {
        partidoSelect.value = pid;
        cargarDatosPartido(pid);
      } else {
        setTimeout(() => modalSeleccion.style.display = "flex", 300);
      }
    })
    .catch(err => {
      console.error("❌ Error al cargar partidos:", err);
      partidoSelect.innerHTML = `<option value="">Error al obtener partidos</option>`;
    });
});

// ———————— Preview al cambiar de partido en el select ————————
partidoSelect.addEventListener("change", () => {
  const id = partidoSelect.value;
  if (!id) return;
  fetch(`/api/matches/${id}`)
    .then(res => res.json())
    .then(p => {
      document.getElementById("nombreModalEquipoA").textContent = p.equipoA;
      document.getElementById("nombreModalEquipoB").textContent = p.equipoB;
      document.getElementById("logoEquipoA").src = p.fotoA || "placeholderA.png";
      document.getElementById("logoEquipoB").src = p.fotoB || "placeholderB.png";
    })
    .catch(err => console.error("❌ Error preview partido:", err));
});

// ————————— Modal de selección de jugadores —————————
function abrirModalJugadores(equipoId, equipoLado) {
  equipoActualSeleccion = equipoLado;
  playerModal.classList.remove("hidden");
  playersContainer.innerHTML = '';
  fetch(`/api/teams/${equipoId}/players`)
    .then(res => res.json())
    .then(jugadores => {
      jugadores.forEach(j => {
        const card = document.createElement('div');
        card.className  = 'player-card';
        card.dataset.id = j.id;
        card.innerHTML  = `
          <img src="${j.foto||'/img/playerImg/avatar.png'}" class="foto-jugador" />
          <div class="info-nombre">${j.nombre}</div>
          <div class="info-posicion ${positionColors[j.posicion]||''}">${j.posicion}</div>
          <div class="info-pie">${j.pie}</div>
          <div class="info-numero">${j.numero}</div>
          <div class="posiciones-select">
            <label><input type="radio" name="pos-${j.id}" value="GK">GK</label>
            <label><input type="radio" name="pos-${j.id}" value="D">D</label>
            <label><input type="radio" name="pos-${j.id}" value="M">M</label>
            <label><input type="radio" name="pos-${j.id}" value="FW">FW</label>
          </div>
          <button class="btn-cancha-toggle">Enviar a cancha</button>
        `;
        card.querySelector(".btn-cancha-toggle")
            .addEventListener("click", () => card.classList.toggle("en-cancha"));
        playersContainer.appendChild(card);
      });
    });
}
closeModalBtn.addEventListener("click", () => {
  playerModal.classList.add("hidden");
  equipoActualSeleccion = null;
});

// —————— Guardar alineación desde el modal de jugadores ——————
guardarAlineacionBtn.addEventListener("click", () => {
  const cards = playersContainer.querySelectorAll('.player-card');
  const jugadores = [];
  cards.forEach(card => {
    const id       = +card.dataset.id;
    const nombre   = card.querySelector('.info-nombre').textContent;
    const numero   = card.querySelector('.info-numero').textContent.replace('#','');
    const foto     = card.querySelector('img').src;
    const pie      = card.querySelector('.info-pie').textContent;
    const defaultPos = card.querySelector('.info-posicion').textContent.trim();
    const posSel     = card.querySelector('input[type="radio"]:checked')?.value;
    const enCancha   = card.classList.contains('en-cancha');
    const posicion   = posSel || defaultPos;
    jugadores.push({ id, nombre, numero, foto, pie, posicion, enCancha });
  });
  actualizarVistaJugadores(equipoActualSeleccion, jugadores);
  playerModal.classList.add("hidden");
  modalSeleccion.style.display = "flex";
  equipoActualSeleccion = null;
});

// ————— Actualiza sidebar y cancha tras guardar alineación —————
function actualizarVistaJugadores(equipoLado, jugadores) {
  const cancha = jugadores.filter(j => j.enCancha);
  const banca  = jugadores.filter(j => !j.enCancha);
  renderSidebarJugadores(equipoLado, cancha, banca);
  renderJugadoresEnCancha(equipoLado, cancha);
}

// ————— Renderizado sidebar (cancha / banca) —————
function renderSidebarJugadores(equipoLado, jugadoresCancha, jugadoresBanca) {
  const enCancha = document.getElementById(`enCancha${equipoLado}`);
  const enBanca  = document.getElementById(`enBanca${equipoLado}`);
  enCancha.innerHTML = '';
  enBanca.innerHTML  = '';

  const crearLi = (j, tipo) => {
    const li = document.createElement('li');
    li.className        = 'sidebar-jugador';
    li.dataset.id       = j.id;
    li.dataset.tipo     = tipo;
    li.dataset.posicion = j.posicion;
    li.innerHTML = `
      <img src="${j.foto}" />
      <span>${j.numero}</span>
      <span>${j.nombre}</span>
      <div class="card-position-li position-${j.posicion}">${j.posicion}</div>
    `;
    li.addEventListener('click', () => seleccionarParaCambio(li));
    return li;
  };

  jugadoresCancha.forEach(j => enCancha.appendChild(crearLi(j, 'cancha')));
  jugadoresBanca .forEach(j => enBanca .appendChild(crearLi(j, 'banca')));
}

// ————— Selección de jugador para cambio —————
function seleccionarParaCambio(el) {
  const tipo = el.dataset.tipo;
  if (tipo === 'cancha') {
    if (!jugadorCanchaSeleccionado) {
      el.classList.add('selected');
      jugadorCanchaSeleccionado = el;
    } else if (!jugadorBancaSeleccionado) {
      el.classList.add('selected');
      jugadorBancaSeleccionado = el;
    }
  } else {
    if (jugadorBancaSeleccionado) jugadorBancaSeleccionado.classList.remove('selected');
    el.classList.add('selected');
    jugadorBancaSeleccionado = el;
  }
}

// ————— Botones de cambio en sidebar —————
if (btnCambioA) btnCambioA.addEventListener('click', () => realizarCambio('A'));
if (btnCambioB) btnCambioB.addEventListener('click', () => realizarCambio('B'));

// ————— Función de cambio (bench↔field o swap posiciones cancha) —————
function realizarCambio(equipoLado) {
  if (!jugadorCanchaSeleccionado || !jugadorBancaSeleccionado) {
    alert("Selecciona dos jugadores válidos (campo o banco).");
    return;
  }
  const enC = document.getElementById(`enCancha${equipoLado}`);
  const enB = document.getElementById(`enBanca${equipoLado}`);

  // intercambio de posiciones si ambos en cancha
  if (jugadorBancaSeleccionado.dataset.tipo === 'cancha') {
    const pos1 = jugadorCanchaSeleccionado.dataset.posicion;
    const pos2 = jugadorBancaSeleccionado.dataset.posicion;
    jugadorCanchaSeleccionado.dataset.posicion = pos2;
    jugadorBancaSeleccionado.dataset.posicion  = pos1;
  } else {
    const posCancha = jugadorCanchaSeleccionado.dataset.posicion;
    jugadorBancaSeleccionado.dataset.posicion = posCancha;
    enC.appendChild(jugadorBancaSeleccionado);
    enB.appendChild(jugadorCanchaSeleccionado);
    jugadorBancaSeleccionado.dataset.tipo = 'cancha';
    jugadorCanchaSeleccionado.dataset.tipo = 'banca';
  }

  // reconstruir lista y refrescar
  const updated = [];
  document.querySelectorAll(`#enCancha${equipoLado} .sidebar-jugador`).forEach(li => {
    updated.push({
      id: +li.dataset.id,
      nombre: li.children[2].textContent,
      numero: li.children[1].textContent.replace('#',''),
      foto: li.children[0].src,
      posicion: li.dataset.posicion,
      enCancha: true
    });
  });
  document.querySelectorAll(`#enBanca${equipoLado} .sidebar-jugador`).forEach(li => {
    updated.push({
      id: +li.dataset.id,
      nombre: li.children[2].textContent,
      numero: li.children[1].textContent.replace('#',''),
      foto: li.children[0].src,
      posicion: li.dataset.posicion,
      enCancha: false
    });
  });
  actualizarVistaJugadores(equipoLado, updated);

  // limpiar selección
  jugadorCanchaSeleccionado.classList.remove('selected');
  jugadorBancaSeleccionado.classList.remove('selected');
  jugadorCanchaSeleccionado = null;
  jugadorBancaSeleccionado  = null;
}

// ————— Renderizado de la cancha (cards) —————
function renderJugadoresEnCancha(equipoLado, jugadores) {
  const filaArriba = document.getElementById(`filaArriba${equipoLado}`);
  const filaAbajo  = document.getElementById(`filaAbajo${equipoLado}`);
  filaArriba.innerHTML = '';
  filaAbajo.innerHTML  = '';

  jugadores.forEach(j => {
    const card = document.createElement("div");
    card.className = `player-card position-${j.posicion}`;
    card.dataset.posicion = j.posicion;
    card.dataset.id       = j.id;

    card.innerHTML = `
    <div class="card-position position-${j.posicion}">${j.posicion}</div>
      <div class="card-image">
        <img src="${j.foto}" alt="${j.nombre}" />
      </div>
      <div class="card-number">${j.numero}</div>
      <div class="card-name">${j.nombre}</div>
    `;
    const abajo = 
      (equipoLado==='B' && (j.posicion==='GK'||j.posicion==='D')) ||
      (equipoLado==='A' && (j.posicion==='M'||j.posicion==='FW'));
    if (abajo) filaAbajo.appendChild(card);
    else       filaArriba.appendChild(card);
  });
}

