// routes/logMatch.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // -----------------------------------
  // 1) Registrar un evento
  //    POST /api/logMatch/matches/:matchId/events
  // -----------------------------------
  router.post('/matches/:matchId/events', (req, res) => {
    const matchId = Number(req.params.matchId);
    const { timestamp, clock, eventType, details } = req.body;
    if (!matchId || !timestamp || !eventType) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    try {
      const stmt = db.prepare(
        `INSERT INTO match_logs (match_id, timestamp, clock, event_type, details)
         VALUES (?, ?, ?, ?, ?)`
      );
      stmt.run(
        matchId,
        timestamp,
        clock || null,
        eventType,
        JSON.stringify(details || {})
      );
      return res.status(201).json({ message: 'Evento registrado' });
    } catch (err) {
      console.error('❌ Error al insertar logMatch:', err);
      return res.status(500).json({ error: 'Error al registrar evento' });
    }
  });

  // -----------------------------------
  // 2) Obtener todos los eventos de un partido
  //    GET /api/logMatch/matches/:matchId/events
  // -----------------------------------
  router.get('/matches/:matchId/events', (req, res) => {
    const matchId = Number(req.params.matchId);
    if (Number.isNaN(matchId)) {
      return res.status(400).json({ error: 'MatchId inválido' });
    }
    try {
      const rows = db.prepare(
        `SELECT
           id,
           match_id   AS matchId,
           timestamp,
           clock,
           event_type AS eventType,
           details
         FROM match_logs
         WHERE match_id = ?
         ORDER BY id ASC`
      ).all(matchId);

      // parseamos el JSON de details
      rows.forEach(r => {
        try { r.details = JSON.parse(r.details); }
        catch { r.details = {}; }
      });

      return res.json(rows);
    } catch (err) {
      console.error('❌ Error al leer logMatch:', err);
      return res.status(500).json({ error: 'Error al obtener eventos' });
    }
  });

  // -----------------------------------
  // 3) Guardar alineación
  //    POST /api/logMatch/matches/:matchId/lineup
  // -----------------------------------
  router.post('/matches/:matchId/lineup', (req, res) => {
    const matchId = Number(req.params.matchId);
    const { team, players } = req.body;
    if (!matchId || !['A','B'].includes(team) || !Array.isArray(players)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
      const stmt = db.prepare(
        `INSERT INTO lineup (match_id, team, players)
         VALUES (?, ?, ?)
         ON CONFLICT(match_id, team) DO UPDATE
           SET players = excluded.players`
      );
      stmt.run(matchId, team, JSON.stringify(players));
      return res.json({ message: 'Alineación guardada' });
    } catch (err) {
      console.error('❌ Error al guardar alineación:', err);
      return res.status(500).json({ error: 'Error al guardar alineación' });
    }
  });

  // -----------------------------------
  // 4) Obtener alineación
  //    GET /api/logMatch/matches/:matchId/lineup
  // -----------------------------------
  router.get('/matches/:matchId/lineup', (req, res) => {
    const matchId = Number(req.params.matchId);
    if (Number.isNaN(matchId)) {
      return res.status(400).json({ error: 'MatchId inválido' });
    }
    try {
      const rows = db.prepare(
        `SELECT team, players
         FROM lineup
         WHERE match_id = ?`
      ).all(matchId);

      const result = { A: [], B: [] };
      rows.forEach(r => {
        try { result[r.team] = JSON.parse(r.players); }
        catch { result[r.team] = []; }
      });

      return res.json(result);
    } catch (err) {
      console.error('❌ Error al leer alineación:', err);
      return res.status(500).json({ error: 'Error al obtener alineación' });
    }
  });

  return router;
};
