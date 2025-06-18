document.addEventListener('DOMContentLoaded', async () => {
  const matches = await fetch('/api/matches').then(res => res.json());
  const tournaments = await fetch('/api/tournaments').then(res => res.json());
  const teams = await fetch('/api/teams').then(res => res.json());

  const tbody = document.querySelector('#matchesTable tbody');
  tbody.innerHTML = '';

  matches.forEach(match => {
    const torneo = tournaments.find(t => t.id == match.torneo_id);
    const equipoA = teams.find(e => e.id == match.equipo_a);
    const equipoB = teams.find(e => e.id == match.equipo_b);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${torneo ? torneo.nombre : 'Torneo desconocido'}</td>
      <td>${equipoA ? equipoA.nombre : 'Equipo A'}</td>
      <td>${equipoB ? equipoB.nombre : 'Equipo B'}</td>
      <td>${new Date(match.fecha).toLocaleDateString()}</td>
      <td>${match.hora}</td>
    `;
    tbody.appendChild(tr);
  });
});
