// init/referees-seed.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

function seedReferees(db) {
  const refereesPath = path.join(__dirname, '../db/referees.json');

  if (!fs.existsSync(refereesPath)) {
    console.warn('⚠️ Archivo referees.json no encontrado. Se omite la carga inicial de árbitros.');
    return;
  }

  try {
    const refereesData = JSON.parse(fs.readFileSync(refereesPath, 'utf8'));

    const { total } = db.prepare('SELECT COUNT(*) AS total FROM referees').get();

    if (total === 0) {
      const insert = db.prepare(`
        INSERT INTO referees (nombre, celular, email, alias, password)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((refs) => {
        for (const ref of refs) {
          const hash = bcrypt.hashSync(ref.password, 10);
          insert.run(ref.nombre, ref.celular, ref.email, ref.alias, hash);
        }
      });

      insertMany(refereesData);
      console.log('✅ Árbitros registrados correctamente en la base de datos.');
    } else {
      console.log(`ℹ️ Ya existen ${total} árbitros en la base de datos. No se insertan duplicados.`);
    }
  } catch (err) {
    console.error('❌ Error al cargar árbitros desde referees.json:', err.message);
  }
}

module.exports = seedReferees;
