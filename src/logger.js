'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

fs.mkdirSync(LOG_DIR, { recursive: true });

const LEVELS = { debug: 0, info: 1, result: 2, error: 3, none: 4 };

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const cfg = JSON.parse(raw).logging || {};
    return {
      consoleLevel: LEVELS[cfg.consoleLevel] ?? LEVELS.result,
      fileLevel: LEVELS[cfg.fileLevel] ?? LEVELS.debug,
    };
  } catch {
    return { consoleLevel: LEVELS.result, fileLevel: LEVELS.debug };
  }
}

function timestamp() {
  return new Date().toISOString();
}

function write(levelName, message) {
  const cfg = loadConfig();
  const levelVal = LEVELS[levelName];
  const line = `[${timestamp()}] [${levelName.toUpperCase().padEnd(6)}] ${message}\n`;

  if (levelVal >= cfg.fileLevel) {
    try {
      fs.appendFileSync(LOG_FILE, line);
    } catch {
      // cannot log file error to file — silently skip
    }
  }

  if (levelVal >= cfg.consoleLevel) {
    process.stdout.write(line);
  }
}

function panel(label, ascii) {
  const lines = ascii.split('\n');
  const inner = [`  Recognized: "${label}"`, '', ...lines, ''];
  const width = Math.max(...inner.map((l) => l.length)) + 2;
  const top    = '╔' + '═'.repeat(width) + '╗';
  const bottom = '╚' + '═'.repeat(width) + '╝';
  const body   = inner.map((l) => '║ ' + l.padEnd(width - 1) + '║').join('\n');
  const box    = `\n${top}\n${body}\n${bottom}\n`;

  // always show panel on console and write to file regardless of levels
  process.stdout.write(box);
  try { fs.appendFileSync(LOG_FILE, box); } catch { /* skip */ }
}

const logger = {
  debug:  (msg) => write('debug', msg),
  info:   (msg) => write('info', msg),
  result: (msg) => write('result', msg),
  error:  (msg) => write('error', msg),
  panel,
};

module.exports = logger;
