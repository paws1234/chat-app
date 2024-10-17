const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err });
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'User registered successfully' });
        });
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) return res.status(500).json({ error: err });
            if (!match) return res.status(401).json({ message: 'Invalid credentials' });

            req.session.userId = user.id;
            res.json({ message: 'Login successful', userId: user.id });
        });
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
