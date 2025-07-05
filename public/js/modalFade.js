const showPlayersList = () => {
  const teams = document.getElementById('teamsListContainer');
  const players = document.getElementById('playersListContainer');

  teams.classList.add('hidden-fade');
  players.classList.remove('hidden');
  setTimeout(() => {
    teams.classList.add('hidden');
    teams.classList.remove('hidden-fade');
    players.style.opacity = 1;
  }, 300); // tiempo igual al de la transición
};

const showTeamsList = () => {
  const teams = document.getElementById('teamsListContainer');
  const players = document.getElementById('playersListContainer');

  players.classList.add('hidden-fade');
  teams.classList.remove('hidden');
  setTimeout(() => {
    players.classList.add('hidden');
    players.classList.remove('hidden-fade');
    teams.style.opacity = 1;
  }, 300);
};

// Botón "← Volver a Equipos"
document.getElementById('backToTeams').addEventListener('click', showTeamsList);
