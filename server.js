'use strict';

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./src/logger');
const { grabFrame, preprocess, preprocessFile, PROCESSED_PATH, TMP_DIR } = require('./src/capture');
const { recognize } = require('./src/ocr');
const { render } = require('./src/ascii');
const { toAscii } = require('./src/doodle');

const GALLERY_DIR  = path.join(__dirname, 'gallery');
const GALLERY_FILE = path.join(GALLERY_DIR, 'ascii.txt');

// Ensure runtime directories exist
fs.mkdirSync(TMP_DIR,     { recursive: true });
fs.mkdirSync(GALLERY_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_DEVICE = process.env.VIDEO_DEVICE || '/dev/video0';

const DRAWING_PATH = path.join(TMP_DIR, 'drawing.png');
const DRAWING_PROCESSED_PATH = path.join(TMP_DIR, 'drawing_processed.png');
const DOODLE_PATH = path.join(TMP_DIR, 'doodle.png');

app.use(express.static(path.join(__dirname, 'public')));

// Page routes
app.get('/camera', (req, res) => res.sendFile(path.join(__dirname, 'public', 'camera.html')));
app.get('/draw', (req, res) => res.sendFile(path.join(__dirname, 'public', 'draw.html')));
app.get('/doodle', (req, res) => res.sendFile(path.join(__dirname, 'public', 'doodle.html')));

// HDMI live stream
app.get('/stream', (req, res) => {
  logger.info('Stream started');
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'close',
  });

  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2',
    '-input_format', 'mjpeg',
    '-framerate', '15',
    '-i', VIDEO_DEVICE,
    '-vf', 'scale=1280:720',
    '-f', 'mjpeg',
    '-q:v', '5',
    'pipe:1',
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  let buffer = Buffer.alloc(0);
  const SOI = Buffer.from([0xff, 0xd8]);
  const EOI = Buffer.from([0xff, 0xd9]);

  ffmpeg.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    let start = 0;
    while (true) {
      const soiIdx = buffer.indexOf(SOI, start);
      if (soiIdx === -1) break;
      const eoiIdx = buffer.indexOf(EOI, soiIdx + 2);
      if (eoiIdx === -1) break;
      const frame = buffer.slice(soiIdx, eoiIdx + 2);
      res.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
      res.write(frame);
      res.write('\r\n');
      start = eoiIdx + 2;
    }
    if (start > 0) buffer = buffer.slice(start);
  });

  req.on('close', () => {
    logger.info('Stream closed');
    ffmpeg.kill('SIGTERM');
  });
  ffmpeg.on('exit', () => res.end());
});

// Camera: grab + preprocess only (tuning)
app.post('/capture/raw', async (req, res) => {
  logger.info('Raw capture requested');
  try {
    await grabFrame(VIDEO_DEVICE);
    await preprocess();
    logger.info('Raw capture complete');
    res.sendFile(PROCESSED_PATH);
  } catch (err) {
    logger.error(`Raw capture failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Camera: grab + preprocess + OCR + ASCII
app.post('/capture', async (req, res) => {
  logger.info('Capture requested');
  try {
    await grabFrame(VIDEO_DEVICE);
    logger.debug('Frame grabbed');
    await preprocess();
    logger.debug('Preprocessing done');
    const text = await recognize(PROCESSED_PATH);
    const ascii = await render(text.toUpperCase());
    logger.panel(text, ascii);
    res.json({ success: true, text, ascii });
  } catch (err) {
    logger.error(`Capture failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Doodle canvas: receive PNG blob → pixel-to-ASCII conversion
app.post('/capture/doodle', (req, res) => {
  logger.info('Doodle capture requested');
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('error', (err) => {
    logger.error(`Doodle request stream error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  });
  req.on('end', async () => {
    try {
      fs.writeFileSync(DOODLE_PATH, Buffer.concat(chunks));
      logger.debug('Doodle saved');
      const ascii = await toAscii(DOODLE_PATH);
      logger.panel('doodle', ascii);
      res.json({ success: true, ascii });
    } catch (err) {
      logger.error(`Doodle conversion failed: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });
});

// Drawing canvas: receive PNG blob → OCR + ASCII
app.post('/capture/drawing', (req, res) => {
  logger.info('Drawing capture requested');
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      fs.writeFileSync(DRAWING_PATH, Buffer.concat(chunks));
      logger.debug('Drawing saved');
      await preprocessFile(DRAWING_PATH, DRAWING_PROCESSED_PATH);
      logger.debug('Drawing preprocessed');
      const text = await recognize(DRAWING_PROCESSED_PATH, 8);
      const ascii = await render(text.toUpperCase());
      logger.panel(text, ascii);
      res.json({ success: true, text, ascii });
    } catch (err) {
      logger.error(`Drawing capture failed: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  });
});

// Gallery: append ASCII entry to gallery/ascii.txt
app.post('/gallery/save', express.json(), (req, res) => {
  const { ascii, label } = req.body || {};
  if (!ascii) return res.status(400).json({ success: false, error: 'No ascii provided' });
  const header = `\n${'='.repeat(60)}\n[${new Date().toISOString()}] ${label || 'untitled'}\n${'='.repeat(60)}\n`;
  try {
    fs.appendFileSync(GALLERY_FILE, header + ascii + '\n');
    logger.info(`Gallery saved: ${label || 'untitled'}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Gallery save failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server started on port ${PORT}`);
  logger.info(`Video device: ${VIDEO_DEVICE}`);
  logger.info(`Open in browser: http://<raspberry-pi-ip>:${PORT}`);
});
