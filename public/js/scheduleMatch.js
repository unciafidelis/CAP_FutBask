document.addEventListener('DOMContentLoaded', async () => {
  const torneoSelect = document.getElementById('torneo');
  const equipoASelect = document.getElementById('equipoA');
  const equipoBSelect = document.getElementById('equipoB');
  const form = document.getElementById('matchForm');

  let allTeams = [];
  let tournaments = [];

  // Cargar torneos
  tournaments = await fetch('/api/tournaments').then(res => res.json());
  tournaments.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nombre;
    torneoSelect.appendChild(opt);
  });

  // Cambiar lista de equipos según torneo
  torneoSelect.addEventListener('change', async () => {
    const selectedTorneoId = parseInt(torneoSelect.value);
    equipoASelect.innerHTML = '<option value="">Selecciona equipo A</option>';
    equipoBSelect.innerHTML = '<option value="">Selecciona equipo B</option>';

    if (!selectedTorneoId) return;

    const teams = await fetch('/api/teams').then(res => res.json());
    allTeams = teams.filter(t => t.torneo_id == selectedTorneoId);

    allTeams.forEach(team => {
      const optA = new Option(team.nombre, team.id);
      const optB = new Option(team.nombre, team.id);
      equipoASelect.appendChild(optA);
      equipoBSelect.appendChild(optB);
    });
  });

  // Remover equipo A de lista B
  equipoASelect.addEventListener('change', () => {
    const equipoAId = equipoASelect.value;
    equipoBSelect.innerHTML = '<option value="">Selecciona equipo B</option>';

    allTeams
      .filter(t => t.id != equipoAId)
      .forEach(team => {
        const opt = new Option(team.nombre, team.id);
        equipoBSelect.appendChild(opt);
      });
  });

  // Enviar formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const partido = {
      torneo_id: parseInt(torneoSelect.value),
      equipo_a: parseInt(equipoASelect.value),
      equipo_b: parseInt(equipoBSelect.value),
      fecha: document.getElementById('fecha').value,
      hora: document.getElementById('hora').value
    };

    const response = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partido)
    });

    if (response.ok) {
      alert('Partido programado correctamente.');
      form.reset();
      equipoASelect.innerHTML = '<option value="">Selecciona equipo A</option>';
      equipoBSelect.innerHTML = '<option value="">Selecciona equipo B</option>';
    } else {
      alert('Error al guardar partido');
    }
  });
});
