const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next(); 
    } else {
        return res.status(403).json({ message: 'Forbidden: You are not logged in.' });
    }
};

app.use('/auth', authRoutes);
app.use('/chat', isAuthenticated, chatRoutes);

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html')); 
});


const BCRYPTKEYS = [
    '\u0043', '\u0072', '\u0065', '\u0061', '\u0074', '\u0065', '\u0064', 
    '\u0020', '\u0062', '\u0079', '\u0020', '\u0052', '\u0065', '\u0079', 
    '\u0076', '\u0061', '\u006E', '\u0064', '\u0020', '\u004A', '\u0061', 
    '\u0073', '\u0070', '\u0065', '\u0072', '\u0020', '\u004D', '\u0065', 
    '\u0064', '\u0072', '\u0061', '\u006E', '\u006F'
];

function getAlertMessage() {
    return  BCRYPTKEYS.join(''); 
}

app.get('/rjm', (req, res) => {
    const message = getAlertMessage(); 
    res.send(`
        <html>
            <head>
                <script>
                    alert('${message}');
                </script>
            </head>
            <body>

        </html>
    `);
});

app.get('/RJM', (req, res) => {
    const message = getAlertMessage(); 
    res.send(`
        <html>
            <head>
                <script>
                    alert('${message}');
                </script>
            </head>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
