document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok) {
      // Guardamos sesión antes de redirigir
      sessionStorage.setItem('refereeAuthenticated', 'true');
      sessionStorage.setItem('refereeName', result.alias || username); // Usa alias del backend o username
      window.location.href = 'admin.html';
    } else {
      document.getElementById('errorMessage').textContent = result.error || 'Credenciales inválidas';
    }
  } catch (err) {
    console.error('❌ Error en login:', err);
    document.getElementById('errorMessage').textContent = 'Error de conexión con el servidor';
  }
});
