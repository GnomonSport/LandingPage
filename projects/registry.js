/**
 * Zweck: Zentrale Projektdefinitionen (generiert).
 * Quelle: Projekte mit meta.js; Änderungen an dieser Datei werden beim Sync überschrieben.
 */

export const projectRegistry = [
  {
    id: '_landing',
    route: 'landing',
    isLanding: true,
    title: 'Landing',
    loader: () => import('./_landing/index.js'),
  },
  {
    id: 'baurechtbrowser',
    route: 'baurechtbrowser',
    isLanding: false,
    title: 'Baurechtbrowser',
    loader: () => import('./baurechtbrowser/index.js'),
  },
  {
    id: 'sanierungsradar',
    route: 'sanierungsradar',
    isLanding: false,
    title: 'Sanierungsradar',
    loader: () => import('./sanierungsradar/index.js'),
  },
];

export function getProjectRegistry() {
  return projectRegistry;
}
