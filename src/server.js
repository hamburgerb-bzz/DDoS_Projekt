const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let requestCount = 0;

app.get('*', (req, res) => {
    const requestData = {
        ip: req.ip,
        method: req.method,
        path: req.path,
        time: new Date().toISOString(),
        headers: req.headers
    };

    requestCount++;
    io.emit('newRequest', requestData);
    io.emit('requestCount', requestCount);

    res.sendStatus(200);
});

io.on('connection', (socket) => {
    socket.emit('requestCount', requestCount);
});

setInterval(() => {
    const load = os.loadavg();
    const mem = process.memoryUsage();
    const memoryMB = (mem.rss / 1024 / 1024).toFixed(2);
    const connections = io.engine.clientsCount;

    console.log(`📊 STATUS | Verbindungen: ${connections} | HTTP-Requests: ${requestCount} | CPU: ${load[0].toFixed(2)} | RAM: ${memoryMB} MB`);
}, 1000);

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server läuft: http://10.62.144.11:${PORT}`);
});
