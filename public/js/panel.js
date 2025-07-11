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
        ["nombreEquipoA", partido.nombreEquipoA],
        ["nombreEquipoB", partido.nombreEquipoB],
        ["nombreFooterA", partido.nombreEquipoA],
        ["nombreFooterB", partido.nombreEquipoB],
        ["nombreModalEquipoA", partido.nombreEquipoA],
        ["nombreModalEquipoB", partido.nombreEquipoB],
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
// ———————— Preview inmediato al cambiar de partido ————————
partidoSelect.addEventListener("change", async () => {
  const id = partidoSelect.value;
  if (!id) return;
  try {
    const res = await fetch(`/api/matches/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const p = await res.json();
    // Ahora usamos los campos correctos:
    document.getElementById("nombreModalEquipoA").textContent = p.nombreEquipoA;
    document.getElementById("nombreModalEquipoB").textContent = p.nombreEquipoB;
    document.getElementById("logoEquipoA").src = p.logoA || "placeholderA.png";
    document.getElementById("logoEquipoB").src = p.logoB || "placeholderB.png";
  } catch (err) {
    console.error("❌ Error preview partido:", err);
  }
});


// ————————— Modal de selección de jugadores —————————
// ————————— Modal de selección de jugadores con radios y limitaciones —————————
// ————————————————
// 1) Abrir modal y cargar jugadores con <select> de posición
// ————————————————
async function abrirModalJugadores(equipoId, equipoLado) {
  equipoActualSeleccion = equipoLado;
  playerModal.classList.remove("hidden");
  playersContainer.innerHTML = '';

  try {
    const res = await fetch(`/api/teams/${equipoId}/players`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const jugadores = await res.json();

    jugadores.forEach(j => {
      const card = document.createElement('div');
      card.className  = 'player-card';
      card.dataset.id = j.id;
      card.dataset.posicion = 'bench';

      card.innerHTML = `
        <img src="${j.foto||'/img/playerImg/avatar.png'}" class="foto-jugador" />
        <div class="info-nombre">${j.nombre}</div>
        <div class="info-numero">#${j.numero}</div>
        <select class="pos-select">
          <option value="bench">Banca</option>
          <option value="GK">GK</option>
          <option value="D">D</option>
          <option value="M">M</option>
          <option value="FW">FW</option>
        </select>
      `;

      // 1.1) Preseleccionar según posición por defecto
      const sel = card.querySelector('.pos-select');
      const def = j.posicion || 'bench';
      sel.value = def;
      card.dataset.posicion = def;
      if (def !== 'bench') card.classList.add('in-cancha');

      // 1.2) Cambios en <select>
      sel.addEventListener('change', () => {
        const newPos = sel.value;
        const inCancha = newPos !== 'bench';
        const canchaCards = playersContainer.querySelectorAll('.player-card.in-cancha');

        // Límite de 5 en cancha
        if (inCancha && !card.classList.contains('in-cancha') && canchaCards.length >= 5) {
          alert('Solo 5 jugadores pueden estar en cancha.');
          sel.value = card.dataset.posicion;
          return;
        }
        // Solo 1 GK
        if (newPos === 'GK' && (!card.classList.contains('in-cancha') || card.dataset.posicion !== 'GK')) {
          const gkCount = playersContainer.querySelectorAll(
            '.player-card.in-cancha[data-posicion="GK"]'
          ).length;
          if (gkCount >= 1) {
            alert('Solo un portero (GK) puede estar en cancha.');
            sel.value = card.dataset.posicion;
            return;
          }
        }

        // Aplicar cambio
        card.dataset.posicion = newPos;
        card.classList.toggle('in-cancha', inCancha);
      });

      playersContainer.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Error cargando jugadores:", err);
    alert("No se pudo cargar la lista de jugadores.");
  }
}

closeModalBtn.addEventListener("click", () => {
  playerModal.classList.add("hidden");
  equipoActualSeleccion = null;
});

// —————— Guardar alineación desde el modal de jugadores ——————
guardarAlineacionBtn.addEventListener("click", async () => {
  // 1) Recolectar TODOS los cards (cancha + banca)
  const cards = Array.from(playersContainer.querySelectorAll('.player-card'));
  const jugadores = cards.map(card => {
    return {
      id:       +card.dataset.id,
      nombre:   card.querySelector('.info-nombre').textContent,
      numero:   card.querySelector('.info-numero').textContent.replace('#',''),
      foto:     card.querySelector('img').src,
      posicion: card.dataset.posicion,
      enCancha: card.classList.contains('in-cancha')
    };
  });

  // 2) Validaciones
  const cancha = jugadores.filter(j => j.enCancha);
  if (cancha.length > 5) {
    return alert('Solo 5 jugadores pueden quedar en cancha.');
  }
  const gkCount = cancha.filter(j => j.posicion === 'GK').length;
  if (gkCount !== 1) {
    return alert('Debe haber exactamente un portero (GK) en cancha.');
  }

  // 3) Enviar TODO al endpoint de lineup
  try {
    await fetch(`/api/logMatch/matches/${partidoActivo.id}/lineup`, {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body:    JSON.stringify({
        team:    equipoActualSeleccion,
        players: jugadores
      })
    });
  } catch (e) {
    console.error('Error guardando alineación:', e);
    return alert('Error guardando alineación.');
  }

  // 4) Refrescar sidebar y cancha pasándole el array completo
  actualizarVistaJugadores(equipoActualSeleccion, jugadores);

  // 5) Cerrar modal
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
  jugadoresCancha.forEach(j => enCancha.appendChild(crearLi(j,'cancha')));
  jugadoresBanca .forEach(j => enBanca .appendChild(crearLi(j,'banca')));
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
    card.dataset.id       = j.id;
    card.dataset.posicion = j.posicion;
    card.innerHTML = `
      <div class="card-position position-${j.posicion}">${j.posicion}</div>
      <div class="card-image"><img src="${j.foto}" alt="${j.nombre}" /></div>
      <div class="card-number">${j.numero}</div>
      <div class="card-name">${j.nombre}</div>
    `;
    // ubicación según posición
    const placeBelow = 
      (equipoLado==='B' && ['GK','D'].includes(j.posicion)) ||
      (equipoLado==='A' && ['M','FW'].includes(j.posicion));
    if (placeBelow) filaAbajo.appendChild(card);
    else            filaArriba.appendChild(card);
  });
}
// ————— Cronómetro estilo FIFA con minutos y segundos —————
let segundosTranscurridos = 0, minutos = 0, intervalo = null;
function formatearTiempo(mins, secs) {
  return `${mins}:${String(secs).padStart(2,'0')}'`;
}
document.getElementById("btnIniciarTiempo").addEventListener("click", () => {
  if (!intervalo) intervalo = setInterval(() => {
    segundosTranscurridos++;
    if (segundosTranscurridos === 60) { minutos++; segundosTranscurridos = 0; }
    document.getElementById("minutero").textContent =
      formatearTiempo(minutos, segundosTranscurridos);
  }, 1000);
});
document.getElementById("btnPausarTiempo").addEventListener("click", () => {
  clearInterval(intervalo); intervalo = null;
});
document.getElementById("btnReiniciarTiempo").addEventListener("click", () => {
  clearInterval(intervalo); intervalo = null;
  segundosTranscurridos = minutos = 0;
  document.getElementById("minutero").textContent = formatearTiempo(0,0);
});

// ————— Toggle sidebars —————
toggleLeft.addEventListener('click', () => {
  sidebarLeft.classList.toggle('open');
  toggleLeft.innerHTML = sidebarLeft.classList.contains('open') ? '&#9664;' : '&#9654;';
});
toggleRight.addEventListener('click', () => {
  sidebarRight.classList.toggle('open');
  toggleRight.innerHTML = sidebarRight.classList.contains('open') ? '&#9654;' : '&#9664;';
});

// ————— Botón de configuración flotante —————
btnConfigMain.addEventListener("click", () => configOptions.classList.toggle("active"));

// ————— Abrir modal de jugadores desde el modal principal —————
document.getElementById("equipoModalA").addEventListener("click", () => {
  if (partidoActivo?.equipoA_id) abrirModalJugadores(partidoActivo.equipoA_id, 'A');
});
document.getElementById("equipoModalB").addEventListener("click", () => {
  if (partidoActivo?.equipoB_id) abrirModalJugadores(partidoActivo.equipoB_id, 'B');
});
