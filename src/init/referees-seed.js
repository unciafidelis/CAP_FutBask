// init/referees-seed.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

function seedReferees(db) {
  const refereesPath = path.join(__dirname, '../db/referees.json');

  if (!fs.existsSync(refereesPath)) {
    console.warn('⚠️ Archivo referees.json no encontrado. Se omite carga inicial.');
    return;
  }

  const refereesData = JSON.parse(fs.readFileSync(refereesPath, 'utf8'));
  const existing = db.prepare('SELECT COUNT(*) AS total FROM referees').get().total;

  if (existing === 0) {
    const insert = db.prepare(`
      INSERT INTO referees (nombre, celular, email, alias, password)
      VALUES (?, ?, ?, ?, ?)
    `);

    refereesData.forEach(ref => {
      const hash = bcrypt.hashSync(ref.password, 10);
      insert.run(ref.nombre, ref.celular, ref.email, ref.alias, hash);
    });

    console.log('✅ Árbitros registrados correctamente en la base de datos.');
  } else {
    console.log('ℹ️ Árbitros ya registrados. No se insertan duplicados.');
  }
}

module.exports = seedReferees;
