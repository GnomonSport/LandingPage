/**
 * Zweck: Einstiegspunkt für das Landing-Projekt.
 * Rendert ein rundes Pixelraster (weiß) auf schwarzem Hintergrund im Browserfenster.
 */

import { createToggleButton } from '../../lib.js';

const RASTER_PIXEL_SIZE = 4;
const ABOUT_TEXT = 'Gnomon Practice is about...';

let cleanup = null;

function drawRoundPixelRaster(canvas, pixelSize) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context unavailable.');
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const step = Math.max(1, Number(pixelSize) || 1);
  const radius = Math.max(1, step * 0.35);

  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const whiteRatio = 0.1 + Math.random() * 0.8;
      const grayValue = Math.round(whiteRatio * 255);
      ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function mount({ appRoot }) {
  appRoot.textContent = '';
  appRoot.style.margin = '0';
  appRoot.style.background = '#000000';

  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.setAttribute('aria-label', 'Rundes Pixelraster');
  appRoot.appendChild(canvas);

  const render = () => drawRoundPixelRaster(canvas, RASTER_PIXEL_SIZE);
  render();
  window.addEventListener('resize', render);

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
  bottomBar.appendChild(aboutButton);
  appRoot.appendChild(bottomBar);

  cleanup = () => {
    window.removeEventListener('resize', render);
    startPauseToggle.destroy();
    aboutToggle.destroy();
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
