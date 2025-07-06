let jugadorSeleccionado = null;
let scoreA = 0;
let scoreB = 0;

document.addEventListener('DOMContentLoaded', () => {
  const tarjetas = document.querySelectorAll('.player-card');
  const botones = document.querySelectorAll('.action-btn');
  const marcador = document.getElementById('score');
  const botonGolA = document.getElementById('golA');
  const botonGolB = document.getElementById('golB');
  const botonAmarilla = document.querySelector('.tarjeta-btn.amarilla');
  const botonRoja = document.querySelector('.tarjeta-btn.roja');

  const accionesPorPosicion = {
    GK: ['Atajada', 'Salida', 'Seguridad', 'FDR', 'SLT', 'PDP'],
    D:  ['Recuperación', 'Salida', 'ATA', 'VEL', 'FDR', 'SLT'],
    M:  ['Recuperación', 'Clave', 'Regates', 'VEL', 'FDR', 'SLT'],
    FW: ['Efectividad', 'Clave', 'Regates', 'VEL', 'FDR', 'SLT']
  };

  const tarjetasPorJugador = {};

  function actualizarMarcador() {
    marcador.textContent = `${scoreA} - ${scoreB}`;
  }

  function habilitarBotonesSegunPosicion(pos) {
    const clave = ['GK', 'D', 'M', 'FW'].includes(pos) ? pos : null;
    const permitidos = accionesPorPosicion[clave] || [];

    botones.forEach(btn => {
      btn.disabled = !permitidos.includes(btn.dataset.action);
      btn.classList.toggle('disabled-btn', btn.disabled);
    });
  }

  function marcarExpulsado(card) {
    card.classList.add('expulsado');
    card.classList.remove('selected');
    card.style.pointerEvents = 'none';
    card.style.opacity = '0.5';
    card.style.filter = 'grayscale(1)';
    card.style.border = '2px solid red';
    jugadorSeleccionado = null;

    botonGolA.disabled = true;
    botonGolB.disabled = true;

    botones.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('disabled-btn');
    });
  }

  function guardarEnLocalStorage(accion) {
    const acciones = JSON.parse(localStorage.getItem('acciones') || '[]');
    acciones.push(accion);
    localStorage.setItem('acciones', JSON.stringify(acciones));
  }

  async function registrarAccion(payload) {
    guardarEnLocalStorage(payload);
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('No se pudo sincronizar');
      }
    } catch (err) {
      console.warn('🔌 Acción almacenada localmente. Sin conexión:', payload);
    }
  }

  async function sincronizarAccionesPendientes() {
    const pendientes = JSON.parse(localStorage.getItem('acciones') || '[]');
    if (pendientes.length === 0) return;

    for (const payload of pendientes) {
      try {
        const res = await fetch('/api/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
      } catch {
        return;
      }
    }

    console.log('✅ Acciones sincronizadas');
    localStorage.removeItem('acciones');
  }

  sincronizarAccionesPendientes();

    // ================================
  // SELECCIÓN DE JUGADOR
  // ================================
  tarjetas.forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('expulsado')) {
        console.log('🚫 Este jugador ya fue expulsado.');
        return;
      }

      tarjetas.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const numero = card.querySelector('.card-number')?.textContent || '??';
      const nombre = card.querySelector('.card-name')?.textContent || 'Sin nombre';
      const posicion = card.querySelector('.card-position')?.textContent || '??';
      const equipo = card.closest('.lado-equipo')?.classList.contains('equipo-a') ? 'Equipo A' : 'Equipo B';

      jugadorSeleccionado = { nombre, numero, posicion, equipo, dom: card };

      console.log(`✅ Jugador seleccionado: ${nombre} (#${numero}) → Posición: ${posicion}`);

      habilitarBotonesSegunPosicion(posicion);
      botonGolA.disabled = false;
      botonGolB.disabled = false;
    });
  });

  // ================================
  // ACCIONES DE JUGADORES
  // ================================
  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!jugadorSeleccionado || btn.disabled) return;

      const accion = btn.textContent;

      const payload = {
        jugador: jugadorSeleccionado.nombre,
        numero: jugadorSeleccionado.numero,
        posicion: jugadorSeleccionado.posicion,
        equipo: jugadorSeleccionado.equipo,
        accion,
        tipo: 'accion',
        timestamp: new Date().toISOString()
      };

      registrarAccion(payload);
    });
  });

  // ================================
  // GOLES
  // ================================
  botonGolA.addEventListener('click', () => {
    scoreA++;
    actualizarMarcador();

    const isAutogol = jugadorSeleccionado?.equipo === 'Equipo B';
    const payload = {
      jugador: jugadorSeleccionado?.nombre || 'Desconocido',
      numero: jugadorSeleccionado?.numero || 'N/A',
      posicion: jugadorSeleccionado?.posicion || 'N/A',
      equipo: jugadorSeleccionado?.equipo || 'Equipo A',
      accion: isAutogol ? 'Autogol (Equipo B)' : 'Gol (Equipo A)',
      tipo: isAutogol ? 'autogol' : 'gol',
      timestamp: new Date().toISOString()
    };

    registrarAccion(payload);
  });

  botonGolB.addEventListener('click', () => {
    scoreB++;
    actualizarMarcador();

    const isAutogol = jugadorSeleccionado?.equipo === 'Equipo A';
    const payload = {
      jugador: jugadorSeleccionado?.nombre || 'Desconocido',
      numero: jugadorSeleccionado?.numero || 'N/A',
      posicion: jugadorSeleccionado?.posicion || 'N/A',
      equipo: jugadorSeleccionado?.equipo || 'Equipo B',
      accion: isAutogol ? 'Autogol (Equipo A)' : 'Gol (Equipo B)',
      tipo: isAutogol ? 'autogol' : 'gol',
      timestamp: new Date().toISOString()
    };

    registrarAccion(payload);
  });

  // ================================
  // TARJETAS
  // ================================
  botonAmarilla.addEventListener('click', () => {
    if (!jugadorSeleccionado) return;

    const numero = jugadorSeleccionado.numero;
    const nombre = jugadorSeleccionado.nombre;

    tarjetasPorJugador[numero] = tarjetasPorJugador[numero] || { amarillas: 0, roja: false };
    if (tarjetasPorJugador[numero].roja) return;

    tarjetasPorJugador[numero].amarillas++;

    registrarAccion({
      jugador: nombre,
      numero,
      posicion: jugadorSeleccionado.posicion,
      equipo: jugadorSeleccionado.equipo,
      accion: 'Tarjeta amarilla',
      tipo: 'tarjeta',
      timestamp: new Date().toISOString()
    });

    if (tarjetasPorJugador[numero].amarillas === 2) {
      tarjetasPorJugador[numero].roja = true;
      marcarExpulsado(jugadorSeleccionado.dom);
      registrarAccion({
        jugador: nombre,
        numero,
        posicion: jugadorSeleccionado.posicion,
        equipo: jugadorSeleccionado.equipo,
        accion: 'Expulsión por doble amarilla',
        tipo: 'expulsion',
        timestamp: new Date().toISOString()
      });
    }
  });

  botonRoja.addEventListener('click', () => {
    if (!jugadorSeleccionado) return;

    const numero = jugadorSeleccionado.numero;
    const nombre = jugadorSeleccionado.nombre;

    tarjetasPorJugador[numero] = tarjetasPorJugador[numero] || { amarillas: 0, roja: false };
    if (tarjetasPorJugador[numero].roja) return;

    tarjetasPorJugador[numero].roja = true;

    marcarExpulsado(jugadorSeleccionado.dom);

    registrarAccion({
      jugador: nombre,
      numero,
      posicion: jugadorSeleccionado.posicion,
      equipo: jugadorSeleccionado.equipo,
      accion: 'Tarjeta roja directa',
      tipo: 'expulsion',
      timestamp: new Date().toISOString()
    });
  });

  // ================================
  // COLORES POR POSICIÓN
  // ================================
  document.querySelectorAll('.card-position').forEach(pos => {
    const tipo = pos.textContent.trim();
    switch (tipo) {
      case 'GK':
        pos.style.backgroundColor = '#e67e22'; break;
      case 'D':
        pos.style.backgroundColor = '#27ae60'; break;
      case 'M':
        pos.style.backgroundColor = '#f1c40f'; pos.style.color = '#333'; break;
      case 'FW':
        pos.style.backgroundColor = '#3498db'; break;
      default:
        pos.style.backgroundColor = '#444'; break;
    }
  });

});
