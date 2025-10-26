## Features

-  **Ghost System**: Ghosts that slide, teleport, peek, follow cursor, and stare
-  **Spider Creatures**: CSS-animated spiders that walk, drop, and react to cursor
-  **Webpage Corruption**: Text mutations, layout tilt, cursor effects, color shifts
-  **Environmental Effects**: Fog, shadows, glitches, blood drips, shadow hands
-  **Audio**: Synthesized whispers, drones, heartbeats (respects autoplay policies)
-  **Full Control**: Horror themed UI with sliders, a whitelist and a blacklist
-  **Safety**: Auto disables on banking, government, healthcare sites

## Installation

### Chrome/Edge
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Drop all folders

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from the `extension` folder

## Privacy

This extension does not collect any data. All settings are stored locally.

## Technical Details

All visuals are generated using CSS and Canvas/WebGL - no external images or assets.

## Tech Stack

- Platform: Chrome/Chromium Extensions (Manifest V3)
- Languages: JavaScript (ES Modules), HTML, CSS
- Content/UI:
	- Content script orchestrator and effects: `content.js` (built into `content-bundle.js`)
	- Popup UI: `popup.html`, `popup.css`, `popup.js`
	- Injected styles: `content.css`
- Background and storage:
	- Service worker background: `background.js`
	- Settings via `chrome.storage.sync`: `shared/settings.js`, used across popup/background/content
- Effects systems:
	- Ghosts (Canvas rendering): `ghosts.js`
	- Spiders (CSS rendering): `spiders.js`
	- Corruption (DOM distortions): `corruption.js`
	- Environment (fog, shadows, glitches, blood): `environment.js`
	- Audio (Web Audio API): `audio.js`
- Shared modules: `shared/constants.js`, `shared/utils.js`
- Build tooling: Node-based build script (e.g., `build.js`) producing `content-bundle.js`

APIs and browser features:
- Chrome Extensions API: `chrome.runtime`, `chrome.tabs`, `chrome.storage.sync`
- Web platform: Canvas 2D, Web Audio API, DOM/CSS animations, requestAnimationFrame
