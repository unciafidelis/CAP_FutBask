// admin.js o dentro de <script> en admin.html
(function checkAuth() {
  const authenticated = sessionStorage.getItem('refereeAuthenticated');
  if (authenticated !== 'true') {
    window.location.href = 'login.html'; // redirige si no pasó por login
  }
})();

const refereeName = sessionStorage.getItem('refereeName');
if (refereeName) {
  document.getElementById('refereeName').textContent += refereeName;
}

const pages = [
  { name: 'register', title: 'Arbitros' },
  { name: 'inMatch', title: 'En vivo' },
  { name: 'player', title: 'Jugador' },
  { name: 'playerStats', title: 'Estadísticas Jugador' },
  { name: 'scheduleMatch', title: 'Programar Partido' },
  { name: 'team', title: 'Equipo' },
  { name: 'tournaments', title: 'Torneos' },
  { name: 'panel', title: 'Panel de partido' }
];

const cardDeck = document.getElementById('cardDeck');
const cardsNav = document.getElementById('cardsNav');
const contentFrame = document.getElementById('contentFrame');

pages.forEach(page => {
  const card = document.createElement('div');
  card.className = 'admin-card';
  card.textContent = page.title;
  card.addEventListener('click', () => openPage(page));
  cardDeck.appendChild(card);
});

function openPage(page) {
  contentFrame.src = `${page.name}.html`;
  cardDeck.style.display = 'none';
  contentFrame.style.display = 'block';

  cardsNav.innerHTML = '';
  pages.forEach(p => {
    const mini = document.createElement('div');
    mini.className = 'card-mini';
    mini.textContent = p.title;
    mini.onclick = () => openPage(p);
    cardsNav.appendChild(mini);
  });
}

  const toggleBtn = document.getElementById('toggleMenuBtn');
  const showBtn = document.getElementById('showMenuBtn');

  toggleBtn.addEventListener('click', () => {
    cardsNav.style.display = 'none';
    toggleBtn.classList.add('hidden');
    showBtn.classList.remove('hidden');
  });

  showBtn.addEventListener('click', () => {
    cardsNav.style.display = 'flex';
    toggleBtn.classList.remove('hidden');
    showBtn.classList.add('hidden');
  });

  // En tu admin.js
function navigateToView(filename) {
  const iframe = document.getElementById('contentFrame');
  iframe.src = filename;

  // Encripta de forma básica u ofusca el nombre
  const encoded = btoa(filename); // base64 simple
  history.pushState({ page: encoded }, '', `#view=${encoded}`);
}

// Al cargar la página, puedes leer la vista si se recargó
window.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash;
  if (hash.startsWith('#view=')) {
    const encoded = hash.split('=')[1];
    try {
      const decoded = atob(encoded);
      document.getElementById('contentFrame').src = decoded;
    } catch (err) {
      console.warn('Ruta inválida');
    }
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  const confirmLogout = confirm('¿Deseas cerrar tu sesión?');
  if (!confirmLogout) return;

  try {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (response.ok) {
      sessionStorage.clear();
      window.location.href = '/login.html';
    } else {
      alert('No se pudo cerrar sesión.');
    }
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    alert('Ocurrió un error al cerrar la sesión.');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  document.getElementById('logoutModal').classList.add('show');
});

document.getElementById('cancelLogout').addEventListener('click', () => {
  document.getElementById('logoutModal').classList.remove('show');
});

document.getElementById('confirmLogout').addEventListener('click', () => {
  fetch('/api/logout', { method: 'POST' })
    .then(() => {
      sessionStorage.clear();
      window.location.href = '/login.html';
    });
});


