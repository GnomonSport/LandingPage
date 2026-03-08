/**
 * Zweck: App-Start und Laden des Landing-Projekts.
 * Verhalten: Lädt beim Start direkt das als Landing markierte Projekt.
 */

import { getProjectRegistry } from './projects/registry.js';
import { calculateSigmoidFactor } from './lib.js';

function getLandingProject(registry) {
  return registry.find((project) => project.isLanding === true) || null;
}

function createAppFontScaleController(root = document.documentElement) {
  function readNumberVar(name, fallback) {
    const raw = getComputedStyle(root).getPropertyValue(name).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function update() {
    const width = window.innerWidth;
    const wMin = readNumberVar('--font-w-min', 600);
    const wMax = readNumberVar('--font-w-max', 1200);
    const steepness = readNumberVar('--font-sigmoid-steepness', 8);

    const factor = calculateSigmoidFactor({
      value: width,
      min: wMin,
      max: wMax,
      steepness,
    });

    root.style.setProperty('--font-scale-factor', String(factor));
  }

  update();
  window.addEventListener('resize', update);
}

async function loadAndMountProject(project) {
  const projectModule = await project.loader();

  if (typeof projectModule.mount !== 'function') {
    throw new Error(`Project '${project.id}' has no mount() export.`);
  }

  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error("Missing app root element '#app'.");
  }

  projectModule.mount({ appRoot, project });
}

async function initApp() {
  createAppFontScaleController();

  const registry = getProjectRegistry();
  const landingProject = getLandingProject(registry);

  if (!landingProject) {
    throw new Error('No landing project configured.');
  }
  await loadAndMountProject(landingProject);
}

initApp().catch((error) => {
  console.error(error);
});
