/**
 * Universelle, projektunabhängige Hilfsfunktionen.
 * Enthält wiederverwendbare Bausteine ohne projektspezifische Logik.
 */

export function createToggleButton({
  onLabel,
  offLabel,
  initialState = false,
  onToggle = null,
}) {
  if (typeof onLabel !== 'string' || typeof offLabel !== 'string') {
    throw new Error('createToggleButton requires string labels.');
  }

  const button = document.createElement('button');
  button.type = 'button';

  let isOn = Boolean(initialState);

  function renderLabel() {
    button.textContent = isOn ? onLabel : offLabel;
  }

  function notify() {
    if (typeof onToggle === 'function') {
      onToggle({ isOn, button });
    }
  }

  function setState(nextState) {
    isOn = Boolean(nextState);
    renderLabel();
    notify();
  }

  function toggle() {
    setState(!isOn);
  }

  function handleClick() {
    toggle();
  }

  button.addEventListener('click', handleClick);
  renderLabel();

  return {
    element: button,
    getState() {
      return isOn;
    },
    setState,
    toggle,
    destroy() {
      button.removeEventListener('click', handleClick);
    },
  };
}

export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function calculateSigmoidFactor({
  value,
  min,
  max,
  steepness = 8,
} = {}) {
  if (![value, min, max, steepness].every(Number.isFinite)) {
    throw new Error('calculateSigmoidFactor requires finite numbers.');
  }

  const span = Math.max(1e-9, max - min);
  const normalized = (value - min) / span;
  const centered = normalized - 0.5;
  return sigmoid(steepness * centered);
}
