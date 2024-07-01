const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql2')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const port = process.env.port||3000

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')))

// MySQL
const db = mysql.createConnection({
    host: 'b4dlndpkuwqn161etajx-mysql.services.clever-cloud.com',
    user: 'uqvs8fqnb7pmimsn',
    password: 'IXFpNX0fFOgEj8KPzjSV',
    database: 'b4dlndpkuwqn161etajx'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack)
        return;
    }
    console.log('Connected to database');
});

// generar token
const generateToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' })
};

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return res.sendStatus(403)

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user;
        next();
    });
};
// Ruta para registrar usuario
app.post('/register', (req, res) => {
    const { username, password } = req.body

    // Chequea si usuario ya existe
    db.query('SELECT * FROM usuarios WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length > 0) return res.status(400).json({ message: 'El usuario ingresado ya existe.' })

        // hashear password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ error: err });

            // guardar usuario nuevo en db
            db.query('INSERT INTO usuarios (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
                if (err) return res.status(500).json({ error: err });
                res.status(201).json({ message: 'Usuario registrado' });
            });
        });
    });
});
// Rutas
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM usuarios WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(401).json({ message: 'Usuario no encontrado' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: err });
            if (!isMatch) return res.status(401).json({ message: 'Contraseña inválida' });

            const token = generateToken(user);
            res.json({ token });
        });
    });
});

app.get('/movies', authenticateToken, (req, res) => {
    db.query('SELECT * FROM movies', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/movies/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM movies WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Película no encontrada' });
        res.json(results[0]);
    });
});

app.post('/movies', authenticateToken, (req, res) => {
    const { title, director, year, genre } = req.body;
    db.query('INSERT INTO movies (title, director, year, genre) VALUES (?, ?, ?, ?)', [title, director, year, genre], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ message: 'Película agregada exitosamente', id: results.insertId });
    });
});

app.put('/movies/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, director, year, genre } = req.body;
    db.query('UPDATE movies SET title = ?, director = ?, year = ?, genre = ? WHERE id = ?', [title, director, year, genre, id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Película no encontrada' });
        res.json({ message: 'Película actualizada exitosamente' });
    });
});

app.delete('/movies/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM movies WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Película no encontrada' });
        res.json({ message: 'Película eliminada' });
    });
});
// server
app.listen(port, () => {
    console.log(`servidor corriendo en puerto ${port}`);
});
