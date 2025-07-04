// routes/actions.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // === Obtener todas las acciones ===
  router.get('/', (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM actions ORDER BY id DESC").all();
      res.json(rows);
    } catch (err) {
      console.error('❌ Error al obtener acciones:', err.message);
      res.status(500).json({ error: 'Error al obtener acciones' });
    }
  });

  // === Crear una nueva acción ===
  router.post('/', (req, res) => {
    const { jugador, numero, accion, timestamp, match_id } = req.body;

    if (
      !jugador || !accion || !timestamp ||
      match_id === undefined || numero === undefined
    ) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO actions (jugador, numero, accion, timestamp, match_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(jugador, numero, accion, timestamp, match_id);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Error al guardar acción:', err.message);
      res.status(500).json({ error: 'Error al guardar acción' });
    }
  });

  return router;
};
