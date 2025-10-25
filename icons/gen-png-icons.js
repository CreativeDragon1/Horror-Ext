// Simple PNG generator for extension icons (16, 48, 128)
// Generates flat-color spooky icons without external deps.
// Usage: node gen-png-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = u32(data.length);
  const crc = u32(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function pngBuffer(width, height, rgba) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Image data: each row has a filter byte (0) + width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  const [r, g, b, a] = rgba;
  for (let y = 0; y < height; y++) {
    const off = y * rowSize;
    raw[off] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const p = off + 1 + x * 4;
      raw[p + 0] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
      raw[p + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);

  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeIcon(size, rgba, name) {
  const outDir = __dirname;
  ensureDir(outDir);
  const file = path.join(outDir, name);
  const buf = pngBuffer(size, size, rgba);
  fs.writeFileSync(file, buf);
  console.log('Wrote', file);
}

// Colors: a deep eerie purple and a brighter accent.
const base = [28, 0, 38, 255]; // #1c0026
const accent = [120, 0, 180, 255]; // #7800b4

// We'll do sizes with slight color variations to distinguish.
writeIcon(16, base, 'icon16.png');
writeIcon(48, accent, 'icon48.png');
writeIcon(128, base, 'icon128.png');

console.log('Done.');
