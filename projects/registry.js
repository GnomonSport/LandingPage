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
];

export function getProjectRegistry() {
  return projectRegistry;
}
