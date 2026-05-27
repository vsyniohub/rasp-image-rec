'use strict';

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { grabFrame, preprocess, PROCESSED_PATH } = require('./src/capture');
const { recognize } = require('./src/ocr');
const { render } = require('./src/ascii');

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_DEVICE = process.env.VIDEO_DEVICE || '/dev/video0';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/stream', (req, res) => {
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

  req.on('close', () => ffmpeg.kill('SIGTERM'));
  ffmpeg.on('exit', () => res.end());
});

// Grab + preprocess only — no OCR, for tuning image quality
app.post('/capture/raw', async (req, res) => {
  try {
    await grabFrame(VIDEO_DEVICE);
    await preprocess();
    res.sendFile(PROCESSED_PATH);
  } catch (err) {
    console.error('Raw capture error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Grab + preprocess + OCR + ASCII art
app.post('/capture', async (req, res) => {
  try {
    await grabFrame(VIDEO_DEVICE);
    await preprocess();
    const text = await recognize(PROCESSED_PATH);
    const ascii = await render(text);
    res.json({ success: true, text, ascii });
  } catch (err) {
    console.error('Capture error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Running on http://0.0.0.0:${PORT}`);
  console.log(`Video device: ${VIDEO_DEVICE}`);
  console.log(`Open in browser: http://<raspberry-pi-ip>:${PORT}`);
});
