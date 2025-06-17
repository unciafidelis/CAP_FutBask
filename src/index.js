const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, '../db/referees.json');

app.use(express.json());
app.use(express.static('public'));

function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
    return Date.now().toString();
}

// GET all referees
app.get('/api/referees', (req, res) => {
    const data = readData();
    res.json(data);
});

// GET one referee by ID
app.get('/api/referees/:id', (req, res) => {
    const data = readData();
    const referee = data.find(r => r.id === req.params.id);
    if (referee) {
        res.json(referee);
    } else {
        res.status(404).json({ message: 'Árbitro no encontrado.' });
    }
});

// CREATE new referee
app.post('/api/register-referee', (req, res) => {
    const data = readData();
    const newReferee = {
        id: generateId(),
        ...req.body,
        created_at: new Date().toISOString()
    };
    data.push(newReferee);
    writeData(data);
    res.status(201).json(newReferee);
});

// UPDATE referee by ID
app.put('/api/referees/:id', (req, res) => {
    const data = readData();
    const index = data.findIndex(r => r.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'Árbitro no encontrado.' });
    }

    data[index] = {
        ...data[index],
        ...req.body,
    };
    writeData(data);
    res.json(data[index]);
});

// DELETE referee by ID
app.delete('/api/referees/:id', (req, res) => {
    let data = readData();
    const index = data.findIndex(r => r.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: 'Árbitro no encontrado.' });
    }

    const deleted = data.splice(index, 1);
    writeData(data);
    res.json({ message: 'Árbitro eliminado.', deleted: deleted[0] });
});

// Start server
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
