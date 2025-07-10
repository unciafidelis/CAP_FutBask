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
