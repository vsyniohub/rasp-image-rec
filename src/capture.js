'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const sharp = require('sharp');

const execFileAsync = promisify(execFile);

const TMP_DIR = path.join(__dirname, '..', 'tmp');
const CAPTURE_PATH = path.join(TMP_DIR, 'capture.jpg');
const PROCESSED_PATH = path.join(TMP_DIR, 'processed.png');

async function grabFrame(videoDevice) {
  await execFileAsync('ffmpeg', [
    '-f', 'v4l2',
    '-input_format', 'mjpeg',
    '-frames:v', '1',
    '-i', videoDevice,
    '-y', CAPTURE_PATH,
  ]);
  return CAPTURE_PATH;
}

async function preprocess() {
  await sharp(CAPTURE_PATH)
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(128)
    .png()
    .toFile(PROCESSED_PATH);
  return PROCESSED_PATH;
}

module.exports = { grabFrame, preprocess, CAPTURE_PATH, PROCESSED_PATH };
