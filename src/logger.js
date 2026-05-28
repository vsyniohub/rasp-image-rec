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

function panel(label, ascii) {
  const lines = ascii.split('\n');
  const inner = [`  Recognized: "${label}"`, '', ...lines, ''];
  const width = Math.max(...inner.map((l) => l.length)) + 2;
  const top    = '╔' + '═'.repeat(width) + '╗';
  const bottom = '╚' + '═'.repeat(width) + '╝';
  const body   = inner.map((l) => '║ ' + l.padEnd(width - 1) + '║').join('\n');
  const box    = `\n${top}\n${body}\n${bottom}\n`;
  process.stdout.write(box);
  fs.appendFileSync(LOG_FILE, box);
}

const logger = {
  info:  (msg) => write('INFO ', msg),
  error: (msg) => write('ERROR', msg),
  debug: (msg) => write('DEBUG', msg),
  panel,
};

module.exports = logger;
