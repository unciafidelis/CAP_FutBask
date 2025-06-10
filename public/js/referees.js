document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/referees');
    const referees = await response.json();

    const tableBody = document.querySelector('#refereesTable tbody');
    tableBody.innerHTML = '';

    referees.forEach(ref => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ref.id}</td>
        <td>${ref.name}</td>
        <td>${ref.phone}</td>
        <td>${ref.email}</td>
        <td>${ref.alias}</td>
      `;
      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error al cargar árbitros:', error);
  }
});
