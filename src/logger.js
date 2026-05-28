'use strict';

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

fs.mkdirSync(LOG_DIR, { recursive: true });

const LEVELS = { debug: 0, info: 1, result: 2, error: 3 };

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

const logger = {
  debug:  (msg) => write('debug', msg),
  info:   (msg) => write('info', msg),
  result: (msg) => write('result', msg),
  error:  (msg) => write('error', msg),
};

module.exports = logger;
