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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createVerticalSlider({
  label,
  min,
  max,
  initialValue,
  onInput,
}) {
  const root = document.createElement('div');
  root.style.position = 'relative';
  root.style.width = '4.8rem';
  root.style.height = '10.5rem';
  root.style.isolation = 'isolate';
  root.style.pointerEvents = 'auto';

  const text = document.createElement('div');
  text.textContent = label;
  text.style.position = 'absolute';
  text.style.top = '0.1rem';
  text.style.left = '0';
  text.style.width = '100%';
  text.style.textAlign = 'center';
  text.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  text.style.fontSize = '0.62rem';
  text.style.fontWeight = '500';
  text.style.lineHeight = '1';
  text.style.textTransform = 'lowercase';
  text.style.color = '#ffffff';
  text.style.mixBlendMode = 'difference';
  text.style.pointerEvents = 'none';
  text.style.display = 'none';
  root.appendChild(text);

  const track = document.createElement('div');
  track.style.position = 'absolute';
  track.style.left = '50%';
  track.style.top = '1.35rem';
  track.style.bottom = '0.1rem';
  track.style.width = '1rem';
  track.style.transform = 'translateX(-50%)';
  track.style.border = '1px solid #ffffff';
  track.style.background = 'transparent';
  track.style.boxSizing = 'border-box';
  track.style.cursor = 'ns-resize';
  root.appendChild(track);

  const fill = document.createElement('div');
  fill.style.position = 'absolute';
  fill.style.left = '0';
  fill.style.right = '0';
  fill.style.bottom = '0';
  fill.style.height = '0%';
  fill.style.background = '#ffffff';
  track.appendChild(fill);

  const handle = document.createElement('div');
  handle.style.position = 'absolute';
  handle.style.left = '50%';
  handle.style.width = '1.2rem';
  handle.style.height = '0.2rem';
  handle.style.border = '1px solid #ffffff';
  handle.style.background = '#ffffff';
  handle.style.transform = 'translate(-50%, 50%)';
  handle.style.bottom = '0%';
  handle.style.boxSizing = 'border-box';
  track.appendChild(handle);

  let value = clamp(initialValue, min, max);

  function render() {
    const t = (value - min) / (max - min);
    const pct = clamp(t, 0, 1) * 100;
    fill.style.height = `${pct}%`;
    handle.style.bottom = `${pct}%`;
  }

  function setValue(nextValue, emit = true) {
    value = clamp(nextValue, min, max);
    render();
    if (emit) {
      onInput(value);
    }
  }

  function valueFromPointer(clientY) {
    const rect = track.getBoundingClientRect();
    const t = clamp((rect.bottom - clientY) / rect.height, 0, 1);
    return min + (max - min) * t;
  }

  function handlePointerMove(event) {
    setValue(valueFromPointer(event.clientY));
  }

  function handlePointerUp() {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  function handlePointerDown(event) {
    event.preventDefault();
    setValue(valueFromPointer(event.clientY));
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  track.addEventListener('pointerdown', handlePointerDown);
  render();

  return {
    element: root,
    setValue(nextValue) {
      setValue(nextValue, false);
    },
    destroy() {
      track.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
  };
}

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

  const topControls = document.createElement('div');
  topControls.style.display = 'flex';
  topControls.style.flexDirection = 'column';
  topControls.style.alignItems = 'center';
  topControls.style.gap = '0.65rem';
  topControls.style.pointerEvents = 'none';

  let isRasterAnimationRunning = false;
  const startPauseToggle = createToggleButton({
    onLabel: 'Pause',
    offLabel: 'Start',
    initialState: false,
    onToggle: ({ isOn }) => {
      isRasterAnimationRunning = isOn;
      if (isRasterAnimationRunning) {
        rasterController.start();
        sliderPanel.style.display = 'flex';
      } else {
        rasterController.pause();
        sliderPanel.style.display = 'none';
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
  topControls.appendChild(startPauseButton);

  const sliderPanel = document.createElement('div');
  sliderPanel.style.display = 'none';
  sliderPanel.style.flexDirection = 'row';
  sliderPanel.style.alignItems = 'flex-start';
  sliderPanel.style.justifyContent = 'center';
  sliderPanel.style.gap = '0.55rem';
  sliderPanel.style.pointerEvents = 'auto';

  const sliderDefs = [
    {
      label: 'wind direction',
      min: 0,
      max: 360,
      initialValue: 26.565,
      onInput: (value) => rasterController.setWindDirection(value),
    },
    {
      label: 'main direction',
      min: 0.1,
      max: 1.0,
      initialValue: 0.2,
      onInput: (value) => rasterController.setNoiseInfluence(value),
    },
    {
      label: 'turbulence',
      min: 0.001,
      max: 0.1,
      initialValue: 0.01,
      onInput: (value) => rasterController.setTurbulence(value),
    },
    {
      label: 'wind strength',
      min: 10,
      max: 10000,
      initialValue: 600,
      onInput: (value) => rasterController.setWindStrength(value),
    },
    {
      label: 'transfer rate',
      min: 0.001,
      max: 0.1,
      initialValue: 0.003,
      onInput: (value) => rasterController.setTransferRate(value),
    },
    {
      label: 'smoothness',
      min: 0.01,
      max: 0.1,
      initialValue: 0.1,
      onInput: (value) => rasterController.setPixelSmooth(value),
    },
  ];

  const sliders = sliderDefs.map((definition) => createVerticalSlider(definition));
  for (let i = 0; i < sliders.length; i += 1) {
    sliderPanel.appendChild(sliders[i].element);
    sliders[i].setValue(sliderDefs[i].initialValue);
    sliderDefs[i].onInput(sliderDefs[i].initialValue);
  }

  topControls.appendChild(sliderPanel);
  topBar.appendChild(topControls);
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
    for (let i = 0; i < sliders.length; i += 1) {
      sliders[i].destroy();
    }
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
