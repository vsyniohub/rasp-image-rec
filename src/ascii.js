'use strict';

const { promisify } = require('util');
const figlet = require('figlet');
const logger = require('./logger');

const figletAsync = promisify(figlet);

async function render(text, font = 'Big') {
  logger.debug(`Rendering ASCII art for: "${text}" (font: ${font})`);
  try {
    const ascii = await figletAsync(text, { font });
    logger.debug('ASCII art rendered successfully');
    return ascii;
  } catch (err) {
    logger.error(`ASCII render failed for "${text}": ${err.message}`);
    throw err;
  }
}

module.exports = { render };
