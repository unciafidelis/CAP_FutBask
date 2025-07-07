const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Obtener todos los eventos de un partido
router.get('/:matchId', (req, res) => {
  const matchId = req.params.matchId;
  try {
    const events = db.prepare('SELECT * FROM events WHERE match_id = ? ORDER BY timestamp ASC').all(matchId);
    res.json(events);
  } catch (err) {
    console.error('Error al obtener eventos:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar evento en partido
router.post("/", (req, res) => {
  const { partido_id, equipo_id, jugador_id, tipo, accion, tarjeta, minuto } = req.body;

  try {
    const insert = db.prepare(`
      INSERT INTO eventos (
        partido_id,
        equipo_id,
        jugador_id,
        tipo,
        accion,
        tarjeta,
        minuto,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      partido_id,
      equipo_id || null,
      jugador_id || null,
      tipo,
      accion || null,
      tarjeta || null,
      minuto,
      Date.now()
    );

    res.json({ mensaje: "Evento registrado correctamente" });
  } catch (err) {
    console.error("Error registrando evento:", err);
    res.status(500).json({ error: "No se pudo registrar el evento" });
  }
});

router.get("/:partidoId", (req, res) => {
  const { partidoId } = req.params;

  try {
    const query = db.prepare(`
      SELECT e.*, j.nombre, j.posicion, j.foto
      FROM eventos e
      LEFT JOIN jugadores j ON j.id = e.jugador_id
      WHERE e.partido_id = ?
      ORDER BY e.timestamp ASC
    `);

    const eventos = query.all(partidoId);
    res.json(eventos);
  } catch (err) {
    console.error("Error al obtener eventos:", err);
    res.status(500).json({ error: "No se pudieron obtener los eventos" });
  }
});

module.exports = router;
