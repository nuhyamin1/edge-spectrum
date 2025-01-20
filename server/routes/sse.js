const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionEvents = require('../services/sessionEvents');

router.get('/session-updates', auth, (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection message
    res.write('data: {"type":"connected"}\n\n');

    // Handler for session updates
    const sendSessionUpdate = (sessionData) => {
        res.write(`data: ${JSON.stringify(sessionData)}\n\n`);
    };

    // Subscribe to session events
    sessionEvents.on('sessionUpdate', sendSessionUpdate);

    // Clean up on client disconnect
    req.on('close', () => {
        sessionEvents.off('sessionUpdate', sendSessionUpdate);
    });
});

module.exports = router;
