"use strict";

const http = require('http');
const fs   = require('fs');
const path = require('path');

function createHttpServer(projectRoot, rooms, getTransactions, clearTransactions) {
    const frontendPath = path.join(projectRoot, 'frontend');

    const server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin',  '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

        // ── API routes ────────────────────────────────────────────────────────
        if (req.url === '/api/transactions' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(getTransactions()));
            return;
        }
        if (req.url === '/api/transactions/clear' && req.method === 'POST') {
            clearTransactions();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: '交易记录已清空' }));
            return;
        }
        if (req.url === '/api/volunteer/stats' && req.method === 'GET') {
            const stats = [];
            rooms.forEach(room => {
                room.players.forEach(player => {
                    if (player.gameState.volunteerCount > 0) {
                        stats.push({
                            playerName:          player.playerName,
                            volunteerCount:      player.gameState.volunteerCount,
                            volunteerShieldUsed: (player.gameState.volunteerShieldInitial || 0)
                                - (player.gameState.volunteerShield || 0)
                        });
                    }
                });
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stats));
            return;
        }

        // ── Static file serving ───────────────────────────────────────────────
        let filePath = _decodeUrl(req.url);

        if (filePath === '/' || filePath === '/index.html') filePath = '/frontend/index.html';
        if (filePath === '/record.html') filePath = '/frontend/record.html';

        // Card images
        if (_isCardImage(filePath)) {
            _serveCardImage(filePath, projectRoot, res);
            return;
        }

        const fullPath = path.join(projectRoot, filePath);
        const ext      = path.extname(fullPath).toLowerCase();
        const ct       = _contentType(ext);

        fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (err) {
                const alt = path.join(frontendPath, path.basename(filePath));
                fs.access(alt, fs.constants.F_OK, (err2) => {
                    if (!err2) { _serveFile(alt, ct, res); }
                    else       { res.writeHead(404); res.end('Not Found'); }
                });
            } else {
                _serveFile(fullPath, ct, res);
            }
        });
    });

    return server;
}

// ── Private ───────────────────────────────────────────────────────────────────

function _decodeUrl(str) {
    try { return decodeURIComponent(str); } catch (e) { return str; }
}

function _isCardImage(filePath) {
    return (filePath.includes('/cards/') || filePath.includes('../cards/'))
        && !filePath.endsWith('.js')
        && !filePath.endsWith('.css')
        && !filePath.endsWith('.html');
}

function _serveCardImage(filePath, projectRoot, res) {
    let relative = filePath.replace(/\.\.\//g, '');
    if (relative.startsWith('/')) relative = relative.substring(1);
    const imagePath = path.join(projectRoot, relative);

    if (fs.existsSync(imagePath)) {
        const ext = path.extname(imagePath).toLowerCase();
        const ct  = _contentType(ext);
        fs.readFile(imagePath, (err, data) => {
            if (err) { res.writeHead(404); res.end(); }
            else     { res.writeHead(200, { 'Content-Type': ct }); res.end(data); }
        });
    } else {
        res.writeHead(404); res.end();
    }
}

function _serveFile(filePath, contentType, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(500); res.end('Server Error'); }
        else     { res.writeHead(200, { 'Content-Type': contentType }); res.end(data); }
    });
}

function _contentType(ext) {
    return {
        '.html': 'text/html',
        '.js':   'application/javascript',
        '.css':  'text/css',
        '.png':  'image/png',
        '.jpg':  'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif':  'image/gif',
        '.mp3':  'audio/mpeg',
        '.wav':  'audio/wav',
        '.ico':  'image/x-icon',
        '.json': 'application/json'
    }[ext] || 'text/plain';
}

module.exports = { createHttpServer };