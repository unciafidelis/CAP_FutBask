// routes/tournaments.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // === Crear torneo con partidos ===
  router.post('/', (req, res) => {
    const { nombre, deporte, division, equipos } = req.body;

    if (!nombre || !deporte || !division || !Array.isArray(equipos)) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }

    try {
      const insertTorneo = db.prepare(`
        INSERT INTO tournaments (nombre, categoria, fecha_inicio, fecha_fin)
        VALUES (?, ?, NULL, NULL)
      `);
      const result = insertTorneo.run(nombre, division);
      const torneoId = result.lastInsertRowid;

      const insertMatch = db.prepare(`
        INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
        VALUES (?, ?, ?, '', '')
      `);

      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          insertMatch.run(torneoId, equipos[i], equipos[j]);
        }
      }

      res.status(201).json({ message: 'Torneo y partidos creados' });
    } catch (err) {
      console.error('❌ Error al crear torneo:', err.message);
      res.status(500).json({ message: 'Error interno al crear el torneo' });
    }
  });

  // === Obtener todos los torneos con nombres de equipos ===
  router.get('/', (req, res) => {
    try {
      const torneos = db.prepare(`SELECT * FROM tournaments ORDER BY id DESC`).all();
      const getEquipos = db.prepare(`SELECT DISTINCT equipoA, equipoB FROM matches WHERE torneo_id = ?`);
      const getNombreEquipo = db.prepare(`SELECT nombre FROM teams WHERE id = ?`);

      const data = torneos.map(t => {
        const enfrentamientos = getEquipos.all(t.id);
        const equiposSet = new Set();

        enfrentamientos.forEach(m => {
          if (m.equipoA) equiposSet.add(getNombreEquipo.get(m.equipoA)?.nombre);
          if (m.equipoB) equiposSet.add(getNombreEquipo.get(m.equipoB)?.nombre);
        });

        return {
          id: t.id,
          nombre: t.nombre,
          deporte: t.deporte || '',
          equipos: Array.from(equiposSet)
        };
      });

      res.json(data);
    } catch (err) {
      console.error('❌ Error al obtener torneos:', err.message);
      res.status(500).json({ message: 'Error interno al cargar torneos' });
    }
  });

  // === Obtener torneo por ID para edición ===
  router.get('/:id', (req, res) => {
    const id = req.params.id;

    try {
      const torneo = db.prepare(`
        SELECT id, nombre, categoria AS division FROM tournaments WHERE id = ?
      `).get(id);

      if (!torneo) return res.status(404).json({ message: 'Torneo no encontrado' });

      const enfrentamientos = db.prepare(`
        SELECT equipoA, equipoB FROM matches WHERE torneo_id = ?
      `).all(id);

      const equiposSet = new Set();
      enfrentamientos.forEach(m => {
        if (m.equipoA) equiposSet.add(m.equipoA);
        if (m.equipoB) equiposSet.add(m.equipoB);
      });

      torneo.deporte = ''; // no está en DB
      torneo.equipos = Array.from(equiposSet);

      res.json(torneo);
    } catch (err) {
      console.error('❌ Error al obtener torneo por ID:', err.message);
      res.status(500).json({ message: 'Error al obtener el torneo' });
    }
  });

  // === Actualizar torneo y regenerar partidos ===
  router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, deporte, division, equipos } = req.body;

    if (!nombre || !deporte || !division || !Array.isArray(equipos)) {
      return res.status(400).json({ error: 'Datos incompletos o inválidos' });
    }

    try {
      const update = db.prepare(`
        UPDATE tournaments
        SET nombre = ?, categoria = ?, fecha_inicio = '', fecha_fin = ''
        WHERE id = ?
      `);
      const result = update.run(nombre, division, id);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Torneo no encontrado' });
      }

      db.prepare(`DELETE FROM matches WHERE torneo_id = ?`).run(id);

      const insertMatch = db.prepare(`
        INSERT INTO matches (torneo_id, equipoA, equipoB, fecha, hora)
        VALUES (?, ?, ?, '', '')
      `);

      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          insertMatch.run(id, equipos[i], equipos[j]);
        }
      }

      res.json({ message: 'Torneo actualizado correctamente' });
    } catch (err) {
      console.error('❌ Error al actualizar torneo:', err.message);
      res.status(500).json({ error: 'Error interno al actualizar el torneo' });
    }
  });

  // === Eliminar torneo y partidos relacionados ===
  router.delete('/:id', (req, res) => {
    const id = req.params.id;

    try {
      db.prepare(`DELETE FROM matches WHERE torneo_id = ?`).run(id);
      const result = db.prepare(`DELETE FROM tournaments WHERE id = ?`).run(id);

      if (result.changes === 0) {
        return res.status(404).json({ message: 'Torneo no encontrado' });
      }

      res.json({ message: 'Torneo eliminado correctamente' });
    } catch (err) {
      console.error('❌ Error al eliminar torneo:', err.message);
      res.status(500).json({ message: 'Error al eliminar torneo' });
    }
  });

  return router;
};
