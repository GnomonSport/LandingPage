/**
 * Zweck: Einstiegspunkt für das Landing-Projekt.
 * Rendert ein rundes Pixelraster (weiß) auf schwarzem Hintergrund im Browserfenster.
 */

import { createToggleButton } from '../../lib.js';
import { createRasterController } from './controller.js';

const RASTER_PIXEL_SIZE = 6;
const ABOUT_TEXT = [
  'Gnomon Practice is a small collective based in Zurich, Switzerland.',
  'Our work is guided by a search for independence within the systems and technologies we rely on. What begins as curiosity develops into experiments we share.',
].join('\n');

let cleanup = null;

export function mount({ appRoot }) {
  appRoot.textContent = '';
  appRoot.style.background = '#000000';

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.setAttribute('aria-label', 'Rundes Pixelraster');
  appRoot.appendChild(canvas);

  const rasterController = createRasterController({
    canvas,
    pixelSize: RASTER_PIXEL_SIZE,
  });
  rasterController.resize();
  window.addEventListener('resize', rasterController.resize);

  const topBar = document.createElement('div');
  topBar.style.position = 'absolute';
  topBar.style.top = '0';
  topBar.style.left = '0';
  topBar.style.width = '100%';
  topBar.style.padding = '1rem';
  topBar.style.boxSizing = 'border-box';
  topBar.style.display = 'flex';
  topBar.style.justifyContent = 'center';
  topBar.style.pointerEvents = 'none';

  let isRasterAnimationRunning = false;
  const startPauseToggle = createToggleButton({
    onLabel: 'Pause',
    offLabel: 'Start',
    initialState: false,
    onToggle: ({ isOn }) => {
      isRasterAnimationRunning = isOn;
      if (isRasterAnimationRunning) {
        rasterController.start();
      } else {
        rasterController.pause();
      }
    },
  });
  const startPauseButton = startPauseToggle.element;
  startPauseButton.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  startPauseButton.style.fontSize = 'var(--secondary-text-size)';
  startPauseButton.style.fontWeight = '500';
  startPauseButton.style.lineHeight = '1.2';
  startPauseButton.style.color = '#ffffff';
  startPauseButton.style.background = 'transparent';
  startPauseButton.style.border = '0';
  startPauseButton.style.padding = '0';
  startPauseButton.style.cursor = 'pointer';
  startPauseButton.style.pointerEvents = 'auto';
  topBar.appendChild(startPauseButton);
  appRoot.appendChild(topBar);

  const bottomBar = document.createElement('div');
  bottomBar.style.position = 'absolute';
  bottomBar.style.bottom = '0';
  bottomBar.style.left = '0';
  bottomBar.style.width = '100%';
  bottomBar.style.padding = '1rem';
  bottomBar.style.boxSizing = 'border-box';
  bottomBar.style.display = 'flex';
  bottomBar.style.justifyContent = 'center';
  bottomBar.style.pointerEvents = 'none';

  const aboutToggle = createToggleButton({
    onLabel: ABOUT_TEXT,
    offLabel: 'About',
    initialState: false,
  });
  const aboutButton = aboutToggle.element;
  aboutButton.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  aboutButton.style.fontSize = 'var(--secondary-text-size)';
  aboutButton.style.fontWeight = '500';
  aboutButton.style.lineHeight = '1.2';
  aboutButton.style.color = '#ffffff';
  aboutButton.style.background = 'transparent';
  aboutButton.style.border = '0';
  aboutButton.style.padding = '0';
  aboutButton.style.cursor = 'pointer';
  aboutButton.style.pointerEvents = 'auto';
  aboutButton.style.whiteSpace = 'pre-line';
  aboutButton.style.textAlign = 'center';
  bottomBar.appendChild(aboutButton);
  appRoot.appendChild(bottomBar);

  cleanup = () => {
    window.removeEventListener('resize', rasterController.resize);
    startPauseToggle.destroy();
    aboutToggle.destroy();
    rasterController.destroy();
    topBar.remove();
    bottomBar.remove();
    canvas.remove();
    appRoot.style.background = '';
  };
}

export function unmount() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
