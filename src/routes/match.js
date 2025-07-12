// routes/match.js
const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // En memoria (puedes reemplazar con SELECT/UPDATE reales si migras a BD)
  let partidos = [];

  // UPSERT para posiciones
  const upsertPos = db.prepare(`
    INSERT INTO posiciones (torneo, equipo, PJ, G, E, P, GF, GC, DG, Pts)
      VALUES (@torneo,@equipo,@PJ,@G,@E,@P,@GF,@GC,@DG,@Pts)
    ON CONFLICT(torneo, equipo) DO UPDATE SET
      PJ = PJ + @PJ,
      G  = G  + @G,
      E  = E  + @E,
      P  = P  + @P,
      GF = GF + @GF,
      GC = GC + @GC,
      DG = DG + @DG,
      Pts= Pts+ @Pts
  `);

  // GET todos
  router.get('/', (req, res) => {
    res.json(partidos);
  });

  // GET uno
  router.get('/:id', (req, res) => {
    const id = +req.params.id;
    const p  = partidos.find(x => x.id === id);
    if (!p) return res.status(404).json({ message: 'Partido no encontrado' });
    res.json(p);
  });

  // POST crear
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

  // POST alineación
  router.post('/:id/alineacion', (req, res) => {
    // tu lógica...
    res.json({ mensaje: 'Alineación (mock) actualizada' });
  });

  // PUT actualizar marcador/estado/cronómetro
  router.put('/:id', (req, res) => {
    const id = +req.params.id;
    const p  = partidos.find(x => x.id === id);
    if (!p) return res.status(404).json({ message: 'Partido no encontrado' });
    const { marcador, cronometro, estado } = req.body;
    if (marcador)   p.marcador   = marcador;
    if (cronometro !== undefined) p.cronometro = cronometro;
    if (estado)     p.estado     = estado;
    res.json(p);
  });

  // DELETE
  router.delete('/:id', (req, res) => {
    const id = +req.params.id;
    const idx = partidos.findIndex(x => x.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Partido no encontrado' });
    partidos.splice(idx, 1);
    res.status(204).send();
  });

  // POST finalize -> calcula y guarda posiciones
  router.post('/:id/finalize', (req, res) => {
    const id = +req.params.id;
    const p  = partidos.find(x => x.id === id);
    if (!p) return res.status(404).json({ message: 'Partido no encontrado' });
    if (p.estado === 'finalizado') {
      return res.status(400).json({ message: 'Partido ya finalizado' });
    }
    // Marca finalizado
    p.estado = 'finalizado';

    const A = p.marcador.A;
    const B = p.marcador.B;
    const [GA, EA, PA] = A > B ? [1,0,0] : A === B ? [0,1,0] : [0,0,1];
    const [GB, EB, PB] = B > A ? [1,0,0] : A === B ? [0,1,0] : [0,0,1];
    const GF_A = A, GC_A = B;
    const GF_B = B, GC_B = A;
    const DG_A = GF_A - GC_A;
    const DG_B = GF_B - GC_B;
    const Pts_A = GA*3 + EA;
    const Pts_B = GB*3 + EB;
    const torneo = p.division || 'general';

    const trx = db.transaction(() => {
      upsertPos.run({ torneo, equipo: p.equipoA,
        PJ:1, G:GA, E:EA, P:PA, GF:GF_A, GC:GC_A, DG:DG_A, Pts:Pts_A });
      upsertPos.run({ torneo, equipo: p.equipoB,
        PJ:1, G:GB, E:EB, P:PB, GF:GF_B, GC:GC_B, DG:DG_B, Pts:Pts_B });
    });
    trx();

    res.json({ message: 'Partido finalizado y posiciones actualizadas', partido:p });
  });

  return router;
};
