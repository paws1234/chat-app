const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');

router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

router.post('/send', (req, res) => {
    const { receiverName, message } = req.body;
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });

    const senderId = req.session.userId;

    db.query('SELECT id FROM users WHERE username = ?', [receiverName], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        const receiverId = results[0].id;
        db.query('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)', [senderId, receiverId, message], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Message sent' });
        });
    });
});

router.post('/send-file', upload.single('file'), (req, res) => {
    const { receiverName } = req.body;
    const file = req.file;
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });

    const senderId = req.session.userId;

    db.query('SELECT id FROM users WHERE username = ?', [receiverName], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        const receiverId = results[0].id;
        const filePath = path.join('/uploads', file.filename);

        db.query('INSERT INTO messages (sender_id, receiver_id, message, file_path) VALUES (?, ?, ?, ?)', [senderId, receiverId, '', filePath], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'File sent', filePath });
        });
    });
});

router.get('/messages/:username', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });

    const receiverName = req.params.username;

    db.query('SELECT id FROM users WHERE username = ?', [receiverName], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length === 0) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        const receiverId = results[0].id;

        db.query(`
            SELECT m.*, u.username AS sender_name 
            FROM messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) 
            ORDER BY m.timestamp ASC`, 
            [req.session.userId, receiverId, receiverId, req.session.userId], (err, messages) => {
                if (err) return res.status(500).json({ error: err });

                const modifiedMessages = messages.map(message => {
                    if (message.file_path) {
                        message.file_url = `${req.protocol}://${req.get('host')}${message.file_path}`;
                    }
                    return message;
                });

                res.json(modifiedMessages);
            });
    });
});

router.get('/users', (req, res) => {
    const username = req.query.username;
    db.query('SELECT username FROM users WHERE username LIKE ? LIMIT 5', [`%${username}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

module.exports = router;
