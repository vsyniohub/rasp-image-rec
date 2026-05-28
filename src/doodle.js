'use strict';

const sharp = require('sharp');
const logger = require('./logger');

// Characters ordered dark → light; doubled for correct aspect ratio (chars are ~2× taller than wide)
const RAMP = '@@@###SSS%%%???***+++;;;:::,,,... ';

async function toAscii(inputPath, cols = 80, rows = 40) {
  logger.debug(`Converting doodle to ASCII: ${inputPath} (${cols}×${rows})`);
  try {
    const { data } = await sharp(inputPath)
      .resize(cols, rows, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let ascii = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const brightness = data[y * cols + x];
        const idx = Math.floor((brightness / 255) * (RAMP.length - 1));
        ascii += RAMP[idx];
      }
      ascii += '\n';
    }

    logger.debug('Doodle ASCII conversion done');
    return ascii;
  } catch (err) {
    logger.error(`Doodle conversion failed: ${err.message}`);
    throw err;
  }
}

module.exports = { toAscii };
