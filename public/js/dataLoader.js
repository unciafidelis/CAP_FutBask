async function loadData(url) {
  const resp = await fetch(url);
  return resp.ok ? resp.json() : [];
}

async function fillTables() {
  const [tournaments, teams, players] = await Promise.all([
    loadData('/api/tournaments'),
    loadData('/api/teams'),
    loadData('/api/players')
  ]);

  const tt = document.getElementById('tournamentsTable');
  tt.innerHTML = '';
  tournaments.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.nombre}</td><td>${t.equipos.join(', ')}</td>`;
    tt.appendChild(tr);
  });

  const te = document.getElementById('teamsTable');
  te.innerHTML = '';
  teams.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.nombre}</td><td>${r.division}</td><td>${r.deporte}</td>`;
    te.appendChild(tr);
  });

  const tp = document.getElementById('playersTable');
  tp.innerHTML = '';
  players.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.nombre}</td><td>${p.posicion}</td><td>${p.pie}</td>`;
    tp.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', fillTables);
