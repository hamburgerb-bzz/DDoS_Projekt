const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // ⚠️ Achtung: In Produktion einschränken!
        methods: ["GET", "POST"]
    }
});

let requestHistory = [];
let requestCount = 0;

app.get('*', (req, res) => {
    const requestData = {
        ip: req.ip,
        method: req.method,
        path: req.path,
        time: new Date().toISOString(),
        headers: req.headers
    };

    requestHistory.push(requestData);
    requestCount++;
    io.emit('newRequest', requestData);
    io.emit('requestCount', requestCount);
    res.sendStatus(200);
});

io.on('connection', (socket) => {
    socket.emit('initialData', requestHistory);
    socket.emit('requestCount', requestCount);
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server läuft im Netzwerk: http://10.62.145.47:${PORT}`);
});