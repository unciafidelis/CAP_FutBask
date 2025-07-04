document.addEventListener('DOMContentLoaded', () => {
  const tournamentSelect = document.getElementById('tournamentSelect');
  const equipoASelect = document.getElementById('equipoA');
  const equipoBSelect = document.getElementById('equipoB');
  const matchForm = document.getElementById('matchForm');
  const fechaInput = document.getElementById('fecha');
  const horaInput = document.getElementById('hora');

  let torneos = [];
  let equipos = [];

  // Cargar torneos
  async function loadTorneos() {
    const res = await fetch('/api/tournaments');
    torneos = await res.json();

    tournamentSelect.innerHTML = '<option value="">Selecciona Torneo</option>';
    torneos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.nombre} (${t.division} - ${t.deporte})`;
      tournamentSelect.appendChild(opt);
    });
  }

  // Cargar equipos del torneo seleccionado
  tournamentSelect.addEventListener('change', async () => {
    const torneoId = parseInt(tournamentSelect.value);

    equipoASelect.innerHTML = '<option value="">Selecciona Equipo A</option>';
    equipoBSelect.innerHTML = '<option value="">Selecciona Equipo B</option>';

    const torneo = torneos.find(t => t.id === torneoId);
    if (!torneo) return;

    const allEquipos = await (await fetch('/api/teams')).json();
    equipos = allEquipos.filter(eq => torneo.equipos.includes(eq.id));

    equipos.forEach(eq => {
      const optA = document.createElement('option');
      optA.value = eq.id;
      optA.textContent = eq.nombre;
      equipoASelect.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = eq.id;
      optB.textContent = eq.nombre;
      equipoBSelect.appendChild(optB);
    });
  });

  // Evitar que se seleccione el mismo equipo
  equipoASelect.addEventListener('change', () => {
    const selected = parseInt(equipoASelect.value);
    equipoBSelect.innerHTML = '<option value="">Selecciona Equipo B</option>';
    equipos.forEach(eq => {
      if (eq.id !== selected) {
        const opt = document.createElement('option');
        opt.value = eq.id;
        opt.textContent = eq.nombre;
        equipoBSelect.appendChild(opt);
      }
    });
  });

  // Actualiza disponibilidad sin perder selección
  function actualizarDisponibilidadEquipos() {
    const idA = parseInt(equipoASelect.value);
    const idB = parseInt(equipoBSelect.value);

    [...equipoASelect.options].forEach(opt => {
      opt.disabled = parseInt(opt.value) === idB;
    });

    [...equipoBSelect.options].forEach(opt => {
      opt.disabled = parseInt(opt.value) === idA;
    });
  }

  equipoASelect.addEventListener('change', actualizarDisponibilidadEquipos);
  equipoBSelect.addEventListener('change', actualizarDisponibilidadEquipos);

  // Enviar formulario
  matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      torneo_id: parseInt(tournamentSelect.value),
      equipoA: parseInt(equipoASelect.value),
      equipoB: parseInt(equipoBSelect.value),
      fecha: fechaInput.value,
      hora: horaInput.value
    };

    if (!data.torneo_id || !data.equipoA || !data.equipoB || !data.fecha || !data.hora) {
      alert('Todos los campos son obligatorios.');
      console.warn('Datos enviados incompletos:', data);
      return;
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert('Partido guardado correctamente.');
        matchForm.reset();
        equipoASelect.innerHTML = '<option value="">Selecciona Equipo A</option>';
        equipoBSelect.innerHTML = '<option value="">Selecciona Equipo B</option>';
      } else {
        const text = await res.text();
        alert('Error en el servidor: ' + text);
      }
    } catch (err) {
      console.error('Error de red:', err);
      alert('Fallo en la red o el servidor no está disponible.');
    }
  });

  loadTorneos();
});
