// routes/players.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Obtener todos los jugadores
  router.get('/', (req, res) => {
    try {
      const stmt = db.prepare(`
        SELECT players.*, teams.nombre AS equipo_nombre
        FROM players
        LEFT JOIN teams ON players.equipo_id = teams.id
        ORDER BY players.id DESC
      `);
      const jugadores = stmt.all();
      res.json(jugadores);
    } catch (err) {
      console.error('❌ Error al obtener jugadores:', err.message);
      res.status(500).json({ error: 'Error al cargar jugadores' });
    }
  });

  // ✅ Obtener un jugador por ID (para edición)
  router.get('/:id', (req, res) => {
    const { id } = req.params;

    try {
      const jugador = db.prepare(`SELECT * FROM players WHERE id = ?`).get(id);

      if (!jugador) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      res.json(jugador);
    } catch (err) {
      console.error('❌ Error al obtener jugador por ID:', err.message);
      res.status(500).json({ error: 'Error al obtener el jugador' });
    }
  });

  // Crear un nuevo jugador
  router.post('/', (req, res) => {
    const { nombre, posicion, pie, numero, equipo_id } = req.body;

    if (!nombre || !posicion || !pie || !numero || !equipo_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO players (nombre, posicion, pie, numero, equipo_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(nombre, posicion, pie, numero, equipo_id);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error('❌ Error al insertar jugador:', err.message);
      res.status(500).json({ error: 'Error al guardar el jugador' });
    }
  });

  // Actualizar jugador
  router.put('/:id', (req, res) => {
    const { nombre, posicion, pie, numero, equipo_id } = req.body;
    const { id } = req.params;

    if (!nombre || !posicion || !pie || !numero || !equipo_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
      const stmt = db.prepare(`
        UPDATE players
        SET nombre = ?, posicion = ?, pie = ?, numero = ?, equipo_id = ?
        WHERE id = ?
      `);
      const result = stmt.run(nombre, posicion, pie, numero, equipo_id, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      res.json({ message: 'Jugador actualizado correctamente' });
    } catch (err) {
      console.error('❌ Error al actualizar jugador:', err.message);
      res.status(500).json({ error: 'Error al actualizar el jugador' });
    }
  });

  // Eliminar jugador
  router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
      const stmt = db.prepare('DELETE FROM players WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
      }

      res.json({ message: 'Jugador eliminado correctamente' });
    } catch (err) {
      console.error('❌ Error al eliminar jugador:', err.message);
      res.status(500).json({ error: 'Error al eliminar el jugador' });
    }
  });

  return router;
};
