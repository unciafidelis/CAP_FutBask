const express = require('express');
const router = express.Router();
const db = require('../db/db');

// === Obtener estadísticas individuales de un jugador ===
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

// === Obtener promedio de estadísticas por equipo ===
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

// === Guardar estadísticas manuales ===
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

// === Generar tabla de posiciones ===
router.get('/tabla-posiciones', (req, res) => {
  try {
    const partidos = db.prepare(`
      SELECT * FROM partidos
    `).all();

    const eventos = db.prepare(`
      SELECT * FROM eventos
    `).all();

    const tabla = {};

    eventos.forEach(evento => {
      const { equipo, tipo } = evento;
      if (!tabla[equipo]) {
        tabla[equipo] = { PJ: 0, G: 0, E: 0, P: 0, GF: 0, GC: 0, DG: 0, Pts: 0 };
      }

      if (tipo === 'gol') {
        tabla[equipo].GF++;
      } else if (tipo === 'autogol') {
        tabla[equipo].GC++;
      }
    });

    // Calcula PJ, G, E, P por partido
    partidos.forEach(p => {
      const equipoA = p.equipoA;
      const equipoB = p.equipoB;

      const golesA = eventos.filter(e => e.partido_id === p.id && e.tipo === 'gol' && e.equipo === equipoA).length;
      const autogolesB = eventos.filter(e => e.partido_id === p.id && e.tipo === 'autogol' && e.equipo === equipoB).length;
      const totalA = golesA + autogolesB;

      const golesB = eventos.filter(e => e.partido_id === p.id && e.tipo === 'gol' && e.equipo === equipoB).length;
      const autogolesA = eventos.filter(e => e.partido_id === p.id && e.tipo === 'autogol' && e.equipo === equipoA).length;
      const totalB = golesB + autogolesA;

      tabla[equipoA].PJ++;
      tabla[equipoB].PJ++;

      tabla[equipoA].GF += totalA;
      tabla[equipoA].GC += totalB;

      tabla[equipoB].GF += totalB;
      tabla[equipoB].GC += totalA;

      if (totalA > totalB) {
        tabla[equipoA].G++;
        tabla[equipoB].P++;
        tabla[equipoA].Pts += 3;
      } else if (totalA < totalB) {
        tabla[equipoB].G++;
        tabla[equipoA].P++;
        tabla[equipoB].Pts += 3;
      } else {
        tabla[equipoA].E++;
        tabla[equipoB].E++;
        tabla[equipoA].Pts += 1;
        tabla[equipoB].Pts += 1;
      }
    });

    // Calcula DG
    for (const equipo in tabla) {
      tabla[equipo].DG = tabla[equipo].GF - tabla[equipo].GC;
    }

    res.json(tabla);
  } catch (error) {
    console.error('Error al generar tabla de posiciones:', error);
    res.status(500).json({ error: 'Error generando tabla de posiciones' });
  }
});

module.exports = router;
