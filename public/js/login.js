document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const user = document.getElementById('user').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirige a stats.html
        window.location.href = 'stats.html';
      } else {
        alert(result.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error de red. Intenta de nuevo.');
    }
  });
});
