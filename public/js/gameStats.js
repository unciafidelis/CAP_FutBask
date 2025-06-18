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
