# Haunted Web Extension - Installation Guide

## Quick Start

### Step 1: Generate Icons

The extension needs three icon files. You have two options:

#### Option A: Use SVG Icons (Recommended)
The `extension/icons/` folder already contains SVG icon files (icon16.svg, icon48.svg, icon128.svg). Many browsers support SVG icons directly. Try loading the extension first - if it works, you're done!

#### Option B: Generate PNG Icons
If your browser requires PNG icons:

1. Open `extension/icons/generate-icons.html` in your browser
2. Click the download buttons for each size:
   - Download 16x16 → saves as `icon16.png`
   - Download 48x48 → saves as `icon48.png`
   - Download 128x128 → saves as `icon128.png`
3. Move the downloaded PNG files to `extension/icons/` folder
4. Update `manifest.json` to use `.png` extensions instead of `.svg` (if needed)

### Step 2: Load the Extension

#### For Chrome/Edge/Brave:
1. Open your browser and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to and select the `extension` folder
5. The Haunted Web icon should appear in your extensions toolbar!

#### For Firefox:
1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to the `extension` folder
4. Select the `manifest.json` file
5. The extension will be loaded (note: temporary add-ons are removed when Firefox closes)

**For permanent Firefox installation:**
1. The extension needs to be packaged as an XPI and signed by Mozilla
2. For development/testing, the temporary method above works fine

### Step 3: Configure & Test

1. Click the Haunted Web extension icon in your toolbar
2. The horror-themed control panel will open
3. Adjust settings to your preference:
   - Toggle features on/off
   - Adjust intensity and frequencies
   - Add sites to whitelist (effects disabled)
4. Navigate to any website to see the effects!
5. Use the **PANIC BUTTON** to instantly disable all effects

## Troubleshooting

### Icons Not Showing
- Check that icon files exist in `extension/icons/`
- Try generating PNG icons if SVG doesn't work
- Make sure `manifest.json` points to the correct file extensions

### Extension Not Loading
- Verify all files are present in the `extension` folder
- Check browser console for errors (F12 → Console)
- Make sure you're selecting the `extension` folder, not a parent folder

### Effects Not Appearing
- Check if the extension is enabled (click icon → master toggle)
- Verify the current site isn't in your whitelist
- Check if the site is auto-blocked (banking, gov, healthcare, etc.)
- Look for browser console errors

### Audio Not Playing
- Audio requires user interaction first (click or key press on the page)
- Check audio toggle in control panel
- Verify audio volume slider isn't at 0
- Some browsers block audio by default - check site permissions

### Performance Issues
- Lower the intensity slider
- Reduce frequency sliders
- Disable heavy effects like fog or glitches
- Add performance-sensitive sites to whitelist

## File Structure

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content-bundle.js      # Main content script (bundled)
├── content.css           # Effect styles
├── popup.html            # Control panel HTML
├── popup.css             # Control panel styles
├── popup.js              # Control panel logic
├── build.js              # Build helper
├── README.md             # Documentation
└── icons/
    ├── generate-icons.html  # Icon generator tool
    ├── icon16.svg          # 16x16 icon
    ├── icon48.svg          # 48x48 icon
    └── icon128.svg         # 128x128 icon
```

## Development

### Making Changes
1. Edit files in the `extension` folder
2. Go to `chrome://extensions/` (or Firefox equivalent)
3. Click the reload button on the Haunted Web extension card
4. Refresh any open web pages to see changes

### Debugging
- **Background Script**: chrome://extensions/ → Haunted Web → "service worker" link
- **Content Script**: F12 on any webpage → Console
- **Popup**: Right-click extension icon → Inspect popup

## Safety Features

The extension automatically disables on:
- Banking and payment sites (paypal, stripe, checkout, etc.)
- Government sites (.gov domains)
- Healthcare sites
- Login/authentication pages
- Video conferencing (Zoom, Teams, Google Meet, etc.)

You can add additional sites to the whitelist in the control panel.

## Uninstalling

1. Go to `chrome://extensions/` (or your browser's extension page)
2. Find "Haunted Web"
3. Click "Remove"
4. Confirm removal

All settings will be cleared automatically.

## Support

For issues or questions:
1. Check this installation guide
2. Review the main README.md
3. Check browser console for error messages
4. Verify all files are present and correctly named

## Credits

Built with pure JavaScript, CSS, and Web Audio API. No external libraries or frameworks.
All visual effects are generated using CSS and Canvas - no image files used.

👻 Enjoy your haunted browsing experience!
