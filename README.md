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
| `/camera` | Live HDMI stream + capture + OCR |
| `/draw` | Canvas drawing + letter recognition |
| `/doodle` | Canvas drawing → pixel-to-ASCII art (no OCR) |

## Features

### Letter recognition (`/draw`, `/camera`)
Draw or photograph a letter. The app preprocesses the image with `sharp`, runs Tesseract OCR, and renders the detected character as large ASCII art using `figlet`. The result is shown both in the browser and as a panel in the terminal.

### Gallery
Both `/draw` and `/doodle` have a **Save** button (enabled after a result is shown). Pressing it appends the ASCII art to `gallery/ascii.txt` with a timestamp and label. The file is excluded from git and the directory is auto-created on startup.

### Doodle to ASCII (`/doodle`)
Draw anything freely. The drawing is converted to ASCII art by sampling pixel brightness across an 80×40 grid and mapping each pixel to a character from a dark-to-light ramp (`@#S%?*+;:,. `). No OCR involved — works for any shape or picture.

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

- **`consoleLevel`** — minimum level printed to the terminal. Set to `"none"` to show only the ASCII art panel and errors on screen.
- **`fileLevel`** — minimum level written to `logs/app.log`. Defaults to `"debug"` (everything).

The result panel (the large box with ASCII art) always prints to both the terminal and the log file, regardless of level settings. Errors always print to the terminal regardless of `consoleLevel`.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `VIDEO_DEVICE` | `/dev/video0` | V4L2 capture device |

## Dependencies

- `express` — HTTP server
- `sharp` — image preprocessing and pixel sampling
- `figlet` — ASCII art rendering from text
- `tesseract` — OCR (system binary, install with `sudo apt-get install -y tesseract-ocr tesseract-ocr-eng`)
- `ffmpeg` — frame capture and MJPEG streaming (system binary)
