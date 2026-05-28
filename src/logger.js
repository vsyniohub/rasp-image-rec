'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() {
  return new Date().toISOString();
}

function write(level, message) {
  const line = `[${timestamp()}] [${level}] ${message}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

const logger = {
  info:  (msg) => write('INFO ', msg),
  error: (msg) => write('ERROR', msg),
  debug: (msg) => write('DEBUG', msg),
};

module.exports = logger;
