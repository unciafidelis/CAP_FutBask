// routes/teams.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Obtener todos los equipos
  router.get('/', (req, res) => {
    const rows = db.prepare("SELECT * FROM teams").all();
    res.json(rows);
  });

  router.post('/', (req, res) => {
    const { nombre, division, deporte } = req.body;

    if (!nombre || !division || !deporte) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO teams (nombre, division, deporte)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(nombre, division, deporte);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Error al insertar equipo:', err.message);
      res.status(500).json({ error: 'Error al guardar el equipo' });
    }
  });

  router.put('/:id', (req, res) => {
    const { nombre, division, deporte } = req.body;
    const id = req.params.id;

    if (!nombre || !division || !deporte) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const stmt = db.prepare(`
        UPDATE teams
        SET nombre = ?, division = ?, deporte = ?
        WHERE id = ?
      `);
      const result = stmt.run(nombre, division, deporte, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }

      res.status(200).json({ message: 'Equipo actualizado correctamente' });
    } catch (err) {
      console.error('❌ Error al actualizar equipo:', err.message);
      res.status(500).json({ error: 'Error al actualizar el equipo' });
    }
  });

  router.delete('/:id', (req, res) => {
    const id = req.params.id;

    try {
      const stmt = db.prepare("DELETE FROM teams WHERE id = ?");
      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }

      res.status(200).json({ message: 'Equipo eliminado correctamente' });
    } catch (err) {
      console.error('❌ Error al eliminar equipo:', err.message);
      res.status(500).json({ error: 'Error al eliminar el equipo' });
    }
  });

  router.get('/:id/players', (req, res) => {
    const teamId = req.params.id;

    try {
      const players = db.prepare(`
        SELECT id, nombre, posicion, numero
        FROM players
        WHERE equipo_id = ?
        ORDER BY numero ASC
      `).all(teamId);

      res.status(200).json(players);
    } catch (err) {
      console.error('❌ Error al obtener jugadores del equipo:', err.message);
      res.status(500).json({ error: 'Error interno al cargar jugadores' });
    }
  });

  return router;
};
