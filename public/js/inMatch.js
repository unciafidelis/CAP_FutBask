document.addEventListener('DOMContentLoaded', ()=>{
  // Manejo de tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab, .tab-content').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Puedes reemplazar los siguientes datos con llamados a tu API
  const summaryData = {
    remates: [15,12],
    rematesAlArco: [8,4],
    posesion: ['48%','52%']
  };
  const teamA = { nombre:'Real Madrid' };
  const teamB = { nombre:'Manchester City' };
  const lineupA = [{num:1,name:'Courtois'}, {num:5,name:'Nacho'}];
  const lineupB = [{num:31,name:'Ederson'}, {num:2,name:'Walker'}];

  // Render encabezado
  document.getElementById('teamAName').textContent = teamA.nombre;
  document.getElementById('teamBName').textContent = teamB.nombre;

  // Render estadísticas
  const grid = document.querySelector('.stats-grid');
  Object.keys(summaryData).forEach(key=>{
    const label = key.replace(/([A-Z])/g,' $1').trim();
    const a = summaryData[key][0], b = summaryData[key][1];
    const row = document.createElement('fragment');
    grid.innerHTML += `<div class="stat-name">${label}</div><div class="stat-value teamA">${a}</div><div class="stat-value teamB">${b}</div>`;
  });

  // Alineaciones
  const renderLineup = (containerId, team, lineup) => {
    const ct = document.getElementById(containerId);
    ct.innerHTML = `<h2>${team.nombre}</h2>`;
    lineup.forEach(p => {
      const d = document.createElement('div');
      d.textContent = `#${p.num} – ${p.name}`;
      ct.appendChild(d);
    });
  };
  renderLineup('lineupA', teamA, lineupA);
  renderLineup('lineupB', teamB, lineupB);
});

fetch('/api/actions')
  .then(res => {
    if (!res.ok) throw new Error('No se pudo obtener el log de acciones');
    return res.json();
  })
  .then(actions => {
    const container = document.getElementById('actionsComments');
    container.innerHTML = ''; // Limpia comentarios previos

    const latest = actions.slice(-5).reverse(); // Últimos 5 eventos

    latest.forEach(action => {
      const comment = document.createElement('div');
      const isTeamA = action.equipo && action.equipo.toLowerCase().includes('a');
      comment.classList.add('comment-bubble');
      comment.classList.add(isTeamA ? 'comment-left' : 'comment-right');

      const time = new Date(action.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });

      comment.innerHTML = `
        <div class="meta">
          <span>${action.equipo}</span>
          <span>${time}</span>
        </div>
        <div><strong>${action.jugador} (#${action.numero})</strong> — ${action.accion}</div>
      `;

      container.appendChild(comment);
    });
  })
  .catch(err => console.error('❌ Error cargando acciones:', err));
