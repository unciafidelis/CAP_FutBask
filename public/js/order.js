document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('th[data-sort="true"]').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const table = header.closest('table');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const columnIndex = Array.from(header.parentNode.children).indexOf(header);
      const isAscending = header.dataset.order !== 'asc';

      rows.sort((a, b) => {
        const aText = a.children[columnIndex].textContent.trim().toLowerCase();
        const bText = b.children[columnIndex].textContent.trim().toLowerCase();
        return isAscending ? aText.localeCompare(bText) : bText.localeCompare(aText);
      });

      header.dataset.order = isAscending ? 'asc' : 'desc';

      rows.forEach(row => tbody.appendChild(row));
    });
  });
});
