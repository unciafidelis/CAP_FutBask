document.addEventListener('DOMContentLoaded', () => {
  const matchForm = document.getElementById('matchForm');
  const torneoSelect = document.getElementById('torneo');
  const equipoASelect = document.getElementById('equipoA');
  const equipoBSelect = document.getElementById('equipoB');
  const fechaInput = document.getElementById('fecha');
  const horaHour = document.getElementById('horaHour');
  const horaMinute = document.getElementById('horaMinute');
  const horaAmPm = document.getElementById('horaAmPm');

  const openModalBtn = document.getElementById('openModal');
  const matchModal = document.getElementById('matchModal');
  const closeModal = document.getElementById('closeModal');
  const matchesTableBody = document.querySelector('#matchesTable tbody');
  const matchPagination = document.getElementById('matchPagination');

  const itemsPerPage = 5;
  let matches = [];
  let torneos = [];
  let equiposDisponibles = [];
  let editingMatchId = null;
  let currentPage = 1;

  // === Inicializar ===
  populateHoras();
  loadTorneos();
  loadEquipos();
  loadMatches();

  function populateHoras() {
    for (let h = 1; h <= 12; h++) {
      horaHour.innerHTML += `<option value="${h}">${h.toString().padStart(2, '0')}</option>`;
    }
    for (let m = 0; m < 60; m += 5) {
      horaMinute.innerHTML += `<option value="${m}">${m.toString().padStart(2, '0')}</option>`;
    }
    ['AM', 'PM'].forEach(p => {
      horaAmPm.innerHTML += `<option value="${p}">${p}</option>`;
    });
  }

  async function loadTorneos() {
    const res = await fetch('/api/tournaments');
    torneos = await res.json();
    torneoSelect.innerHTML = '<option value="">Selecciona Torneo</option>';
    torneos.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.nombre;
      torneoSelect.appendChild(opt);
    });
  }

  async function loadEquipos() {
    const res = await fetch('/api/teams');
    equiposDisponibles = await res.json();
    renderEquipos();
  }

  function renderEquipos() {
    equipoASelect.innerHTML = '<option value="">Selecciona Equipo A</option>';
    equipoBSelect.innerHTML = '<option value="">Selecciona Equipo B</option>';

    equiposDisponibles.forEach(eq => {
      const optionA = document.createElement('option');
      optionA.value = eq.id;
      optionA.textContent = eq.nombre;
      equipoASelect.appendChild(optionA);
    });

    updateEquipoBOptions(); // Para evitar que se repitan
  }

  equipoASelect.addEventListener('change', () => {
    updateEquipoBOptions();
  });

  function updateEquipoBOptions() {
    const selectedA = equipoASelect.value;
    equipoBSelect.innerHTML = '<option value="">Selecciona Equipo B</option>';
    equiposDisponibles.forEach(eq => {
      if (eq.id.toString() !== selectedA) {
        const optionB = document.createElement('option');
        optionB.value = eq.id;
        optionB.textContent = eq.nombre;
        equipoBSelect.appendChild(optionB);
      }
    });
  }
  let isSubmitting = false;
    matchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  console.log("🟡 Se envió el formulario");

  const torneo_id = torneoSelect.value;
  const equipoA = equipoASelect.value;
  const equipoB = equipoBSelect.value;
  const fecha = fechaInput.value;
  const hora = `${horaHour.value}:${horaMinute.value} ${horaAmPm.value}`;

  if (!torneo_id || !equipoA || !equipoB || !fecha || !hora) {
    alert('Todos los campos son requeridos');
    isSubmitting = false; // ✅ se libera aquí solo si hubo error
    return;
  }

  const body = {
    torneo_id,
    equipoA,
    equipoB,
    fecha,
    hora
  };

  try {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await res.json();

    if (res.ok) {
      alert('Partido guardado exitosamente');

      editingMatchId = null;
      matchForm.reset();
      equipoBSelect.innerHTML = '<option value="">Selecciona Equipo B</option>';
      await loadMatches();
    } else {
      console.error('❌ Error:', result.error);
      alert('Error al guardar partido: ' + (result.error || 'Desconocido'));
    }
  } catch (err) {
    console.error('❌ Error de red o fetch:', err);
    alert('Error al conectar con el servidor');
  } finally {
    isSubmitting = false; // ✅ se libera siempre al final del try/catch
  }
});


  async function loadMatches() {
    const res = await fetch('/api/matches');
    matches = await res.json();
    renderMatches();
  }

  function renderMatches() {
    matchesTableBody.innerHTML = '';
    matchPagination.innerHTML = '';
    

    const validMatches = matches.filter(m => m.torneo_id && m.equipoA && m.equipoB && m.fecha && m.hora);
const totalPages = Math.ceil(validMatches.length / itemsPerPage);
const start = (currentPage - 1) * itemsPerPage;
const currentMatches = validMatches.slice(start, start + itemsPerPage);

    currentMatches.forEach(match => {
      const torneo = torneos.find(t => t.id === match.torneo_id);
      const equipoA = equiposDisponibles.find(e => e.id === match.equipoA);
      const equipoB = equiposDisponibles.find(e => e.id === match.equipoB);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${torneo ? torneo.nombre : '—'}</td>
        <td>${equipoA ? equipoA.nombre : '—'}</td>
        <td>${equipoB ? equipoB.nombre : '—'}</td>
        <td>${match.fecha}</td>
        <td>${match.hora}</td>
        <td>
          <button onclick="editMatch(${match.id})">Editar</button>
          <button onclick="deleteMatch(${match.id})">Eliminar</button>
        </td>
      `;
      matchesTableBody.appendChild(tr);
    });

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => {
        currentPage = i;
        renderMatches();
      };
      matchPagination.appendChild(btn);
    }
  }

  window.editMatch = function (id) {
    const match = matches.find(m => m.id === id);
    if (!match) return;

    torneoSelect.value = match.torneo_id;
    equipoASelect.value = match.equipoA;
    updateEquipoBOptions();
    equipoBSelect.value = match.equipoB;
    fechaInput.value = match.fecha;

    const [hora, minuto] = match.hora.split(':');
    const [min, ampm] = minuto.split(' ');
    horaHour.value = parseInt(hora);
    horaMinute.value = parseInt(min);
    horaAmPm.value = ampm;

    editingMatchId = id;
    matchModal.classList.remove('hidden');
  };

  window.deleteMatch = async function (id) {
    if (!confirm('¿Eliminar este partido?')) return;
    const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Partido eliminado');
      loadMatches();
    } else {
      alert('Error al eliminar');
    }
  };

  openModalBtn.addEventListener('click', () => {
    matchModal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    matchModal.classList.add('hidden');
  });
});
