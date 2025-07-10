let golesA = 0, golesB = 0;
let minutos = 0, segundos = 0, intervalo = null;

document.addEventListener('DOMContentLoaded', () => {
  const gearToggle    = document.getElementById('gearToggle');
  const controlMenu   = document.getElementById('controlMenu');
  const btnConfigure  = document.getElementById('btnConfigureTeams');
  const configModal   = document.getElementById('configModal');
  const startMatchBtn = document.getElementById('startMatchBtn');
  const toggleIcon    = document.getElementById('toggleIcon');
  const btnPause      = document.getElementById('btnPauseResume');
  const btnEnd        = document.getElementById('btnEnd');
  const btnGolA       = document.getElementById('btnGolA');
  const btnGolB       = document.getElementById('btnGolB');

  // 1) Toggle menú de control
  gearToggle.addEventListener('click', () => {
    controlMenu.classList.toggle('active');
  });

  // 2) Abrir modal de configuración
  btnConfigure.addEventListener('click', () => {
    controlMenu.classList.remove('active');
    configModal.classList.add('active');
  });

  // 3) Iniciar partido
  startMatchBtn.addEventListener('click', () => {
    const a = document.getElementById('inputEquipoA').value.trim();
    const b = document.getElementById('inputEquipoB').value.trim();
    const tournament = document.getElementById('inputTournamentName').value.trim();
    if (!a || !b || !tournament) {
      alert('Debes ingresar todos los campos.');
      return;
    }
    document.getElementById('teamAName').textContent = a;
    document.getElementById('teamBName').textContent = b;
    document.getElementById('tournamentName').textContent = tournament;
    document.getElementById('matchStatus').textContent = 'En vivo';
    configModal.classList.remove('active');
    startTimer();
    actualizarNombresBotones();
  });

  // 4) Botones de gol
  btnGolA.addEventListener('click', () => sumarGol('A'));
  btnGolB.addEventListener('click', () => sumarGol('B'));

  // 5) Pausa/Reanuda
  btnPause.addEventListener('click', toggleTiempo);

  // 6) Finalizar
  btnEnd.addEventListener('click', finalizarPartido);
});

// — Funciones auxiliares — //

function sumarGol(equipo) {
  if (equipo === 'A') golesA++;
  else golesB++;
  actualizarMarcador();
}

function actualizarMarcador() {
  document.getElementById('scoreDisplay').textContent = `${golesA} - ${golesB}`;
}

function toggleTiempo() {
  const statusEl = document.getElementById('matchStatus');
  const iconEl   = document.getElementById('toggleIcon');
  if (intervalo) {
    clearInterval(intervalo);
    intervalo = null;
    statusEl.textContent = 'Pausado';
    iconEl.textContent   = 'play_arrow';
  } else {
    startTimer();
    statusEl.textContent = 'En vivo';
    iconEl.textContent   = 'pause';
  }
}

function startTimer() {
  if (intervalo) return;
  intervalo = setInterval(() => {
    segundos++;
    if (segundos >= 60) {
      minutos++;
      segundos = 0;
    }
    document.getElementById('matchTime').textContent =
      `${String(minutos).padStart(2,'0')}:${String(segundos).padStart(2,'0')}'`;
  }, 1000);
}

function finalizarPartido() {
  if (intervalo) clearInterval(intervalo);
  intervalo = null;
  document.getElementById('matchStatus').textContent = 'Finalizado';
  alert('Partido Finalizado');
}

// 7) Obtener el botón de cambio de deporte
const btnChangeSport = document.getElementById('btnChangeSport');
btnChangeSport.addEventListener('click', () => {
  // alterna entre mostrar solo goles de 1 punto y mostrar multi-puntuación
  document.querySelector('.mode-soccer').classList.toggle('hidden');
  document.querySelector('.mode-basketball').classList.toggle('hidden');
});

/**
 * Suma N puntos al marcador del equipo dado y actualiza.
 * @param {string} equipo  'A' o 'B'
 * @param {number} puntos  cantidad de puntos a sumar
 */
function sumarPuntos(equipo, puntos) {
  if (equipo === 'A') golesA += puntos;
  else golesB += puntos;
  actualizarMarcador();
}

function actualizarNombresBotones() {
  // Obtiene los nombres del header
  const nombreA = document.querySelector('.match-header #teamAName').textContent;
  const nombreB = document.querySelector('.match-header #teamBName').textContent;

  // Actualiza todos los spans dentro de .bottom-goals con id="teamAName"
  document
    .querySelectorAll('.bottom-goals #teamAName')
    .forEach(el => el.textContent = nombreA);

  // Actualiza todos los spans dentro de .bottom-goals con id="teamBName"
  document
    .querySelectorAll('.bottom-goals #teamBName')
    .forEach(el => el.textContent = nombreB);
}