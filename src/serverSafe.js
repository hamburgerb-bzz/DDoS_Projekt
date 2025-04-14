const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const slowDown = require('express-slow-down');

const app = express();

// Grundlegende Sicherheitsmiddlewares
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['http://10.62.144.174:3000'] : '*',
    methods: ['GET']
}));

// Rate Limiting für HTTP
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 Minute
    max: 100, // Max 100 Requests/IP/Minute
    message: 'Zu viele Anfragen von dieser IP'
});

// Request-Verlangsamung
const speedLimiter = slowDown({
    windowMs: 5 * 60 * 1000, // 5 Minuten
    delayAfter: 50, // Nach 50 Requests
    delayMs: 500 // Jede weitere Anfrage um 500ms verlangsamen
});

app.use(speedLimiter);
app.use(limiter);

const server = http.createServer(app);



// Verbindungslimits
let connectionCount = 0;
const MAX_CONNECTIONS = 100;

io.use((socket, next) => {
    if (connectionCount >= MAX_CONNECTIONS) {
        return next(new Error('Maximale Verbindungen erreicht'));
    }
    connectionCount++;
    socket.on('disconnect', () => connectionCount--);
    next();
});

// 6. Request-Tracking mit Schutz
let requestCount = 0;
const ipRequestCounts = new Map();

app.get('*', (req, res) => {
    const ip = req.ip;
    const now = Date.now();

    // IP-basiertes Tracking
    if (!ipRequestCounts.has(ip)) {
        ipRequestCounts.set(ip, { count: 1, lastRequest: now });
    } else {
        const ipData = ipRequestCounts.get(ip);
        ipData.count++;
        ipData.lastRequest = now;
    }

    // Cleanup alte IPs
    if (requestCount % 100 === 0) {
        const cutoff = now - 60000; // 1 Minute
        ipRequestCounts.forEach((value, key) => {
            if (value.lastRequest < cutoff) ipRequestCounts.delete(key);
        });
    }

    requestCount++;

    // Schutz gegen Massenanfragen
    const ipData = ipRequestCounts.get(ip);
    if (ipData.count > 500) {
        return res.status(429).send('Zu viele Anfragen');
    }

    const requestData = {
        ip,
        method: req.method,
        path: req.path,
        time: new Date().toISOString()
    };

    io.emit('newRequest', requestData);
    io.emit('requestCount', requestCount);
    res.sendStatus(200);
});

// 7. Systemüberwachung mit Schutz
setInterval(() => {
    const load = os.loadavg()[0];
    const mem = process.memoryUsage();
    const memoryMB = (mem.rss / 1024 / 1024).toFixed(2);
    const connections = io.engine.clientsCount;

    // Automatische Drosselung bei hoher Last
    if (load > 5.0 || memoryMB > 500) {
        io.emit('systemOverload');
        console.log('⚠️ Systemüberlastung - Drosselung aktiv');
    }

    console.log(` STATUS | Verbindungen: ${connections}/${MAX_CONNECTIONS} | ` +
        `Requests: ${requestCount} | CPU: ${load.toFixed(2)} | RAM: ${memoryMB} MB`);
}, 10000); // Update alle 10 Sekunden

// 8. Port-Konfiguration mit Failover
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(` Geschützter Server läuft: http://10.62.144.11:${PORT}`);
});

// 9. Prozess-Sicherheit
process.on('uncaughtException', (err) => {
    console.error('⚠ Kritischer Fehler:', err);
    // Hier könnte man einen Neustart einleiten
});