const express = require('express');
const router = express.Router();
const db = require('../db/db'); // ✅ Corrección aquí

// Obtener estadísticas por jugador
router.get('/player/:id', (req, res) => {
  const jugador_id = req.params.id;

  try {
    const stats = db.prepare(`
      SELECT nombre, valor
      FROM estadisticas
      WHERE jugador_id = ?
    `).all(jugador_id);

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del jugador:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Obtener estadísticas promedio por equipo
router.get('/team/:id', (req, res) => {
  const equipo_id = req.params.id;

  try {
    const promedioStats = db.prepare(`
      SELECT nombre, AVG(valor) as promedio
      FROM estadisticas
      WHERE jugador_id IN (
        SELECT id FROM jugadores WHERE equipo_id = ?
      )
      GROUP BY nombre
    `).all(equipo_id);

    res.json(promedioStats);
  } catch (error) {
    console.error('Error al obtener estadísticas del equipo:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de equipo' });
  }
});

// Guardar estadísticas manuales (POST)
router.post('/manual', (req, res) => {
  const { jugador_id, estadisticas } = req.body;

  if (!jugador_id || !Array.isArray(estadisticas)) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const insert = db.prepare(`
    INSERT INTO estadisticas (jugador_id, nombre, valor)
    VALUES (?, ?, ?)
  `);

  const deletePrev = db.prepare(`
    DELETE FROM estadisticas WHERE jugador_id = ?
  `);

  const transaction = db.transaction(() => {
    deletePrev.run(jugador_id);
    for (const stat of estadisticas) {
      insert.run(jugador_id, stat.nombre, stat.valor);
    }
  });

  try {
    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('Error al guardar estadísticas:', error);
    res.status(500).json({ error: 'Error interno al guardar' });
  }
});

module.exports = router;
