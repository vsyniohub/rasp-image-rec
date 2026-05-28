'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const sharp = require('sharp');
const logger = require('./logger');

const execFileAsync = promisify(execFile);

const TMP_DIR = path.join(__dirname, '..', 'tmp');
const CAPTURE_PATH = path.join(TMP_DIR, 'capture.jpg');
const PROCESSED_PATH = path.join(TMP_DIR, 'processed.png');

async function grabFrame(videoDevice) {
  logger.debug(`Grabbing frame from ${videoDevice}`);
  try {
    await execFileAsync('ffmpeg', [
      '-f', 'v4l2',
      '-input_format', 'mjpeg',
      '-frames:v', '1',
      '-i', videoDevice,
      '-y', CAPTURE_PATH,
    ]);
    logger.debug('Frame grabbed successfully');
  } catch (err) {
    logger.error(`Failed to grab frame from ${videoDevice}: ${err.message}`);
    throw err;
  }
  return CAPTURE_PATH;
}

async function preprocess() {
  return preprocessFile(CAPTURE_PATH, PROCESSED_PATH);
}

async function preprocessFile(inputPath, outputPath) {
  logger.debug(`Preprocessing file: ${inputPath}`);
  try {
    await sharp(inputPath)
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(128)
      .png()
      .toFile(outputPath);
    logger.debug(`Preprocessing done: ${outputPath}`);
  } catch (err) {
    logger.error(`Preprocessing failed for ${inputPath}: ${err.message}`);
    throw err;
  }
  return outputPath;
}

module.exports = { grabFrame, preprocess, preprocessFile, CAPTURE_PATH, PROCESSED_PATH, TMP_DIR };
