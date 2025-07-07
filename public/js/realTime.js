let tiempoInicio = null;
let tiempoPausa = null;
let cronometroActivo = false;
let intervalo = null;

// Elemento para mostrar el minuto actual
const marcadorCentral = document.getElementById("score");

// Botones de control (pueden estar dentro del modal o visibles)
const btnIniciar = document.getElementById("btnIniciarTiempo");
const btnPausar = document.getElementById("btnPausarTiempo");
const btnReiniciar = document.getElementById("btnReiniciarTiempo");

// Asignar listeners
btnIniciar.addEventListener("click", iniciarTiempo);
btnPausar.addEventListener("click", pausarTiempo);
btnReiniciar.addEventListener("click", reiniciarTiempo);

// Iniciar cronómetro
function iniciarTiempo() {
  if (!cronometroActivo) {
    const ahora = Date.now();
    if (tiempoPausa) {
      tiempoInicio += (ahora - tiempoPausa);
    } else {
      tiempoInicio = ahora;
    }

    intervalo = setInterval(actualizarTiempo, 1000);
    cronometroActivo = true;
  }
}

// Pausar cronómetro
function pausarTiempo() {
  if (cronometroActivo) {
    clearInterval(intervalo);
    tiempoPausa = Date.now();
    cronometroActivo = false;
  }
}

// Reiniciar cronómetro
function reiniciarTiempo() {
  clearInterval(intervalo);
  tiempoInicio = null;
  tiempoPausa = null;
  cronometroActivo = false;
  marcadorCentral.innerText = "0 - 0";
}

// Actualizar tiempo en pantalla
function actualizarTiempo() {
  const minutos = obtenerMinutoFIFA();
  marcadorCentral.innerText = `${golesA} - ${golesB}  |  ${minutos}'`;
}

// Obtener minuto actual estilo FIFA
function obtenerMinutoFIFA() {
  if (!tiempoInicio) return 0;
  const ahora = Date.now();
  const transcurrido = ahora - tiempoInicio;
  return Math.floor(transcurrido / 60000); // Convertir ms a minutos
}

// Exportar a window para que otros módulos lo usen
window.obtenerMinutoFIFA = obtenerMinutoFIFA;
