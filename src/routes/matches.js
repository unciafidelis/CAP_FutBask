// routes/matches.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // === Obtener todos los partidos ===
  router.get('/', (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM matches ORDER BY id DESC").all();
      res.json(rows);
    } catch (err) {
      console.error('❌ Error al obtener partidos:', err.message);
      res.status(500).json({ error: 'Error al obtener los partidos' });
    }
  });

  // === Crear un nuevo partido ===
  router.post('/', (req, res) => {
    const { torneo_id, equipoA, equipoB, fecha, hora } = req.body;

    if (!torneo_id || !equipoA || !equipoB || !fecha || !hora) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(torneo_id, equipoA, equipoB, fecha, hora);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Error al crear partido:', err.message);
      res.status(500).json({ error: 'Error al crear el partido' });
    }
  });

  // === Actualizar partido ===
router.put('/:id', (req, res) => {
  const { torneo_id, equipoA, equipoB, fecha, hora } = req.body;
  const id = req.params.id;

  try {
    const stmt = db.prepare(`
      UPDATE matches
      SET torneo_id = ?, equipoA = ?, equipoB = ?, fecha = ?, hora = ?
      WHERE id = ?
    `);
    const result = stmt.run(torneo_id, equipoA, equipoB, fecha, hora, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    res.json({ message: 'Partido actualizado correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar partido:', err.message);
    res.status(500).json({ error: 'Error al actualizar el partido' });
  }
});

// === Eliminar partido ===
router.delete('/:id', (req, res) => {
  const id = req.params.id;

  try {
    const stmt = db.prepare("DELETE FROM matches WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    res.json({ message: 'Partido eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar partido:', err.message);
    res.status(500).json({ error: 'Error al eliminar el partido' });
  }
});


  return router;
};
