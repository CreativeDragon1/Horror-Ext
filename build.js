const fs = require('fs');
const path = require('path');

console.log('Building Haunted Web Extension...');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('✓ Icons directory ready');
console.log('');
console.log('Build complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Open extension/icons/generate-icons.html in a browser');
console.log('2. Download the three icon files (16x16, 48x48, 128x128)');
console.log('3. Save them in the extension/icons/ folder');
console.log('4. Load the extension in your browser:');
console.log('   - Chrome: chrome://extensions/ → Load unpacked → Select extension folder');
console.log('   - Firefox: about:debugging → Load Temporary Add-on → Select manifest.json');
console.log('');
console.log('👻 Happy Haunting!');
