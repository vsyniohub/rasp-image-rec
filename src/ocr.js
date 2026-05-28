'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const execFileAsync = promisify(execFile);

const OCR_BASE = path.join(__dirname, '..', 'tmp', 'ocr_out');

async function recognize(imagePath) {
  logger.debug(`Running Tesseract on: ${imagePath}`);
  await execFileAsync('tesseract', [
    imagePath,
    OCR_BASE,
    '--psm', '10',
    '--oem', '3',
    '-c', 'tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ]);

  const text = fs.readFileSync(`${OCR_BASE}.txt`, 'utf8').trim();
  if (!text) throw new Error('No text detected. Try better lighting or a clearer sheet.');
  return text;
}

module.exports = { recognize };
