document.addEventListener("DOMContentLoaded", async () => {
  // Tabs
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });

  // === Cargar datos desde JSONs
  const teams = await fetch('/api/teams').then(res => res.json());
  const players = await fetch('/api/players').then(res => res.json());
  const tournaments = await fetch('/api/tournaments').then(res => res.json());

  // === Mostrar torneo actual (tomo el primero por defecto)
  if (tournaments.length > 0) {
    const torneo = tournaments[0];
    document.getElementById('matchTitle').textContent = `${torneo.nombre} • Partido n.º 1`;
  }

  // === Mostrar nombres de equipos (tomo los 2 primeros por defecto)
  const teamA = teams[0] || { nombre: 'EQUIPO A' };
  const teamB = teams[1] || { nombre: 'EQUIPO B' };

  document.getElementById('teamA').textContent = teamA.nombre;
  document.getElementById('teamB').textContent = teamB.nombre;

  document.getElementById('labelTeamA').textContent = teamA.nombre;
  document.getElementById('labelTeamB').textContent = teamB.nombre;

  // === Mostrar jugadores separados por equipo
  const playersTeamA = players.filter(p => p.equipo_id == teamA.id);
  const playersTeamB = players.filter(p => p.equipo_id == teamB.id);

  const listA = document.getElementById('playersTeamA');
  const listB = document.getElementById('playersTeamB');

  playersTeamA.forEach(j => {
    const li = document.createElement('li');
    li.textContent = `${j.numero} - ${j.nombre}`;
    listA.appendChild(li);
  });

  playersTeamB.forEach(j => {
    const li = document.createElement('li');
    li.textContent = `${j.numero} - ${j.nombre}`;
    listB.appendChild(li);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const eventsTableBody = document.getElementById('eventsTableBody');
  let eventosRecientes = [];

  async function cargarEventos() {
    try {
      const res = await fetch('/api/actions');
      if (!res.ok) throw new Error('No se pudo obtener el log');
      const data = await res.json();

      // Ordenar por fecha descendente (más reciente primero)
      const eventosOrdenados = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Tomar los 5 más recientes
      eventosRecientes = eventosOrdenados.slice(0, 5);
      renderizarTabla(eventosRecientes);
    } catch (error) {
      console.error('Error al cargar acciones:', error);
    }
  }

  function renderizarTabla(eventos) {
    eventsTableBody.innerHTML = '';

    eventos.forEach(ev => {
      const tr = document.createElement('tr');

      const equipo = document.createElement('td');
      equipo.textContent = ev.equipo || '-';

      const jugador = document.createElement('td');
      jugador.textContent = ev.jugador || `#${ev.numero}`;

      const accion = document.createElement('td');
      accion.textContent = ev.accion || '-';

      const minuto = document.createElement('td');
      minuto.textContent = calcularMinuto(ev.timestamp);

      tr.appendChild(equipo);
      tr.appendChild(jugador);
      tr.appendChild(accion);
      tr.appendChild(minuto);
      eventsTableBody.appendChild(tr);
    });
  }

  function calcularMinuto(timestamp) {
    const fecha = new Date(timestamp);
    const ahora = new Date();
    const diferencia = Math.floor((ahora - fecha) / 60000); // minutos
    return `-${diferencia}ʼ`;
  }

  // Recarga automática cada 10 segundos
  cargarEventos();
  setInterval(cargarEventos, 10000);
});
