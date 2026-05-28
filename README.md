# rasp-image-rec

Node.js app for Raspberry Pi 3 that captures handwritten letters via HDMI or an on-screen canvas, runs OCR, and renders the result as ASCII art.

## Quick start

```bash
git clone <repo-url>
cd rasp-image-rec
npm install
npm start
```

Open `http://<raspberry-pi-ip>:3000` in a browser.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/camera` | Live HDMI stream + capture |
| `/draw` | Canvas drawing + recognize |

## Logging

Configured in `config.json`:

```json
{
  "logging": {
    "consoleLevel": "none",
    "fileLevel": "debug"
  }
}
```

### Levels (low → high)

| Level | When used |
|-------|-----------|
| `debug` | Detailed internal steps (frame grab, preprocessing) |
| `info` | Route activity (request received, stream started) |
| `result` | Final OCR output |
| `error` | Failures and exceptions |
| `none` | Suppress all regular log output |

- **`consoleLevel`** — minimum level printed to the terminal. Set to `"none"` to show only the ASCII art panel on screen.
- **`fileLevel`** — minimum level written to `logs/app.log`. Defaults to `"debug"` (everything).

The result panel (the large box with ASCII art) always prints to both the terminal and the log file, regardless of level settings.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `VIDEO_DEVICE` | `/dev/video0` | V4L2 capture device |

## Dependencies

- `express` — HTTP server
- `sharp` — image preprocessing
- `figlet` — ASCII art rendering
- `tesseract` — OCR (system binary, install with `sudo apt-get install -y tesseract-ocr tesseract-ocr-eng`)
- `ffmpeg` — frame capture and MJPEG streaming (system binary)
