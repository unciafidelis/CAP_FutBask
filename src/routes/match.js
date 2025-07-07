const express = require('express');
const router = express.Router();

let partidos = []; // Se puede reemplazar con DB real

// GET todos los partidos
router.get('/', (req, res) => {
  res.json(partidos);
});

// GET un partido específico
router.get('/:id', (req, res) => {
  const partido = partidos.find(p => p.id === parseInt(req.params.id));
  if (!partido) return res.status(404).json({ message: 'Partido no encontrado' });
  res.json(partido);
});

// POST - Crear un nuevo partido
router.post('/', (req, res) => {
  const { equipoA, equipoB, division, deporte } = req.body;
  const nuevo = {
    id: Date.now(),
    equipoA,
    equipoB,
    division,
    deporte,
    estado: 'pendiente',
    marcador: { A: 0, B: 0 },
    cronometro: 0,
    eventos: [],
    creado: new Date().toISOString()
  };
  partidos.push(nuevo);
  res.status(201).json(nuevo);
});

// Actualizar alineación de jugadores en un partido
router.post("/:id/alineacion", async (req, res) => {
  const partidoId = req.params.id;
  const { equipoA, equipoB } = req.body;

  if (!equipoA || !equipoB) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const actualizarEstado = db.prepare(`
    UPDATE jugadores_partido
    SET estado = @estado
    WHERE partido_id = @partido_id AND jugador_id = @jugador_id
  `);

  try {
    const actualizar = db.transaction((jugadores, estado) => {
      for (const j of jugadores) {
        actualizarEstado.run({
          partido_id: partidoId,
          jugador_id: j.id,
          estado: j.estado
        });
      }
    });

    actualizar(equipoA, "cancha");
    actualizar(equipoB, "cancha");

    res.json({ mensaje: "Alineación actualizada correctamente" });
  } catch (e) {
    console.error("Error actualizando alineación:", e);
    res.status(500).json({ error: "Error al actualizar alineación" });
  }
});

// PUT - Actualizar el marcador y cronometro
router.put('/:id', (req, res) => {
  const partido = partidos.find(p => p.id === parseInt(req.params.id));
  if (!partido) return res.status(404).json({ message: 'Partido no encontrado' });

  const { marcador, cronometro, estado } = req.body;
  if (marcador) partido.marcador = marcador;
  if (cronometro !== undefined) partido.cronometro = cronometro;
  if (estado) partido.estado = estado;

  res.json(partido);
});

// DELETE - Eliminar partido
router.delete('/:id', (req, res) => {
  const index = partidos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Partido no encontrado' });
  partidos.splice(index, 1);
  res.status(204).send();
});

module.exports = router;