// routes/stats.js
const express = require('express');
const router  = express.Router();
const db      = require('../db/db');

// === Obtener estadísticas individuales de un jugador ===
// GET /api/stats/player/:id
router.get('/player/:id', (req, res) => {
  const jugador_id = Number(req.params.id);
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
// GET /api/stats/team/:id
router.get('/team/:id', (req, res) => {
  const equipo_id = Number(req.params.id);
  try {
    const promedioStats = db.prepare(`
      SELECT nombre, AVG(valor) AS promedio
      FROM estadisticas
      WHERE jugador_id IN (
        SELECT id FROM players WHERE equipo_id = ?
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
// POST /api/stats/manual
router.post('/manual', (req, res) => {
  const { jugador_id, estadisticas } = req.body;
  if (!jugador_id || !Array.isArray(estadisticas)) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const deletePrev = db.prepare(`DELETE FROM estadisticas WHERE jugador_id = ?`);
  const insert     = db.prepare(`INSERT INTO estadisticas (jugador_id, nombre, valor) VALUES (?, ?, ?)`);
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
// GET /api/stats/tabla-posiciones
router.get('/tabla-posiciones', (req, res) => {
  try {
    // Usar tabla 'matches' en lugar de 'partidos'
    const matches = db.prepare(`SELECT * FROM matches`).all();
    const eventos = db.prepare(`SELECT * FROM eventos`).all();

    const tabla = {};
    // Inicializa estructura para cada equipo
    matches.forEach(p => {
      tabla[p.equipoA] = tabla[p.equipoA] || { PJ:0, G:0, E:0, P:0, GF:0, GC:0, DG:0, Pts:0 };
      tabla[p.equipoB] = tabla[p.equipoB] || { PJ:0, G:0, E:0, P:0, GF:0, GC:0, DG:0, Pts:0 };
    });
    // Acumula goles y autogoles
    eventos.forEach(e => {
      if (e.tipo === 'gol') tabla[e.equipo].GF++;
      if (e.tipo === 'autogol') tabla[e.equipo].GC++;
    });
    // Calcula PJ/G/E/P y puntos
    matches.forEach(p => {
      const A = tabla[p.equipoA], B = tabla[p.equipoB];
      A.PJ++; B.PJ++;
      const golesA = eventos.filter(e =>
        e.partido_id === p.id &&
        ((e.tipo==='gol' && e.equipo===p.equipoA) || (e.tipo==='autogol' && e.equipo===p.equipoB))
      ).length;
      const golesB = eventos.filter(e =>
        e.partido_id === p.id &&
        ((e.tipo==='gol' && e.equipo===p.equipoB) || (e.tipo==='autogol' && e.equipo===p.equipoA))
      ).length;
      A.GF += golesA; A.GC += golesB;
      B.GF += golesB; B.GC += golesA;
      if (golesA > golesB)      { A.G++; B.P++; A.Pts += 3; }
      else if (golesA < golesB) { B.G++; A.P++; B.Pts += 3; }
      else                      { A.E++; B.E++; A.Pts++; B.Pts++; }
    });
    // Diferencia de goles
    Object.values(tabla).forEach(r => r.DG = r.GF - r.GC);

    res.json(tabla);
  } catch (error) {
    console.error('Error al generar tabla de posiciones:', error);
    res.status(500).json({ error: 'Error generando tabla de posiciones' });
  }
});

// === Finalizar partido y guardar estadísticas completas ===
// POST /api/stats/match/:matchId/complete
router.post('/match/:matchId/complete', (req, res) => {
  const matchId = Number(req.params.matchId);
  if (isNaN(matchId)) {
    return res.status(400).json({ error: 'MatchId inválido' });
  }

  try {
    // 1) Recuperar partido de la BD usando 'matches'
    const partido = db.prepare(
      `SELECT id, equipoA, equipoB FROM matches WHERE id = ?`
    ).get(matchId);
    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // 2) Obtener marcador y stats del body
    const { marcador, stats } = req.body;

    // 3) Insertar cada estadística de jugador en 'estadisticas_completas'
    const insertFinal = db.prepare(
      `INSERT INTO estadisticas_completas
        (match_id, jugador_id, goles, cambios, amarillas, rojas)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const trx = db.transaction(rows => {
      for (const r of rows.players) {
        insertFinal.run(
          matchId,
          r.jugador_id,
          r.goles     || 0,
          r.cambios   || 0,
          r.amarillas || 0,
          r.rojas     || 0
        );
      }
    });
    trx(stats);

    res.json({
      success: true,
      message: 'Partido finalizado y estadísticas guardadas.'
    });
  } catch (err) {
    console.error('Error finalizando estadísticas del partido:', err);
    res.status(500).json({ error: 'Error interno al completar estadísticas' });
  }
});

module.exports = router;
