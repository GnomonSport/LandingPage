/**
 * Zweck: App-Start und Laden der Projekte.
 * Verhalten: Lädt das Projekt, dessen Route im URL-Hash steht (#/route);
 * ohne oder mit unbekannter Route das als Landing markierte Projekt.
 */

import { getProjectRegistry } from './projects/registry.js';
import { calculateSigmoidFactor } from './lib.js';

const LANDING_HREF = '#/';

function getLandingProject(registry) {
  return registry.find((project) => project.isLanding === true) || null;
}

function getProjectHref(project) {
  return project.isLanding ? LANDING_HREF : `#/${project.route}`;
}

function readRouteFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  try {
    return decodeURIComponent(raw);
  } catch (error) {
    return '';
  }
}

function resolveProject(registry, route) {
  const landingProject = getLandingProject(registry);
  if (!route) {
    return landingProject;
  }
  return registry.find((project) => project.route === route) || landingProject;
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

function createProjectRouter(registry) {
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error("Missing app root element '#app'.");
  }

  const siteBrand = document.getElementById('site-brand');
  const landingDocumentTitle = document.title;
  const projectLinks = registry
    .filter((project) => project.isLanding !== true)
    .map((project) => ({ title: project.title, href: getProjectHref(project) }));

  let mounted = null;
  let requestId = 0;

  async function show(project) {
    // Zuerst zählen: so verfällt auch ein noch laufender Ladevorgang,
    // wenn zur bereits angezeigten Seite zurückgewechselt wird.
    requestId += 1;
    const currentRequestId = requestId;

    if (mounted && mounted.project === project) {
      return;
    }

    const projectModule = await project.loader();

    // Ein späterer Routenwechsel hat diesen Ladevorgang überholt.
    if (currentRequestId !== requestId) {
      return;
    }

    if (typeof projectModule.mount !== 'function') {
      throw new Error(`Project '${project.id}' has no mount() export.`);
    }

    if (mounted && typeof mounted.module.unmount === 'function') {
      mounted.module.unmount();
    }

    if (siteBrand) {
      siteBrand.hidden = project.isLanding !== true;
    }
    document.title = project.isLanding ? landingDocumentTitle : project.title;

    projectModule.mount({
      appRoot,
      project,
      projectLinks,
      landingHref: LANDING_HREF,
    });
    mounted = { project, module: projectModule };
  }

  function showCurrentRoute() {
    const project = resolveProject(registry, readRouteFromHash());
    if (!project) {
      throw new Error('No landing project configured.');
    }
    return show(project);
  }

  function handleHashChange() {
    showCurrentRoute().catch((error) => {
      console.error(error);
    });
  }

  window.addEventListener('hashchange', handleHashChange);
  return { showCurrentRoute };
}

async function initApp() {
  createAppFontScaleController();

  const registry = getProjectRegistry();
  if (!getLandingProject(registry)) {
    throw new Error('No landing project configured.');
  }

  const router = createProjectRouter(registry);
  await router.showCurrentRoute();
}

initApp().catch((error) => {
  console.error(error);
});
