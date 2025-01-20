const EventEmitter = require('events');

class SessionEventEmitter extends EventEmitter {}

const sessionEvents = new SessionEventEmitter();

module.exports = sessionEvents;
