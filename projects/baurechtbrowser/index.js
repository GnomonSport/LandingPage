/**
 * Zweck: Einstiegspunkt für das Projekt Baurechtbrowser.
 * Rendert eine Projektseite (Titel, Kurzbeschrieb, Link zur Anwendung) in Weiß auf Schwarz.
 */

const PROJECT_URL = 'https://baurechtbrowser.ch';
const PROJECT_URL_LABEL = 'baurechtbrowser.ch';
const TITLE_LINES = ['Baurecht', 'browser'];
const DESCRIPTION_TEXT = [
  'Swiss building law by parcel.',
  'Baurechtbrowser gathers the legal documents that apply to a plot of land and makes them searchable.',
].join('\n');

const FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

let cleanup = null;

function styleSecondaryText(element) {
  element.style.fontFamily = FONT_FAMILY;
  element.style.fontSize = 'var(--secondary-text-size)';
  element.style.fontWeight = '500';
  element.style.lineHeight = '1.2';
  element.style.color = '#ffffff';
}

function createTextLink({ label, href, external = false }) {
  const link = document.createElement('a');
  link.textContent = label;
  link.href = href;
  if (external) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  styleSecondaryText(link);
  link.style.textDecoration = 'none';
  return link;
}

export function mount({ appRoot, landingHref = '#/' }) {
  appRoot.textContent = '';
  appRoot.style.background = '#000000';

  const page = document.createElement('div');
  page.style.position = 'absolute';
  page.style.inset = '0';
  page.style.overflowY = 'auto';
  page.style.display = 'flex';
  page.style.flexDirection = 'column';
  page.style.alignItems = 'center';
  page.style.justifyContent = 'space-between';
  page.style.gap = '2rem';
  page.style.padding = '1rem';
  page.style.boxSizing = 'border-box';
  page.style.textAlign = 'center';

  const backLink = createTextLink({ label: 'Back', href: landingHref });

  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.alignItems = 'center';
  body.style.maxWidth = '100%';

  const title = document.createElement('h1');
  title.style.margin = '0';
  title.style.fontFamily = FONT_FAMILY;
  title.style.fontWeight = '700';
  title.style.fontSize = 'var(--title-size)';
  title.style.lineHeight = '0.95';
  title.style.letterSpacing = '0.02em';
  title.style.textTransform = 'uppercase';
  title.style.color = '#ffffff';
  for (let i = 0; i < TITLE_LINES.length; i += 1) {
    if (i > 0) {
      title.appendChild(document.createElement('br'));
    }
    title.appendChild(document.createTextNode(TITLE_LINES[i]));
  }
  body.appendChild(title);

  const description = document.createElement('p');
  description.textContent = DESCRIPTION_TEXT;
  styleSecondaryText(description);
  description.style.margin = 'clamp(0.8rem, 1.5vw, 1.2rem) 0 0 0';
  description.style.maxWidth = '32em';
  description.style.textWrap = 'balance';
  description.style.whiteSpace = 'pre-line';
  body.appendChild(description);

  const projectLink = createTextLink({
    label: PROJECT_URL_LABEL,
    href: PROJECT_URL,
    external: true,
  });

  page.appendChild(backLink);
  page.appendChild(body);
  page.appendChild(projectLink);
  appRoot.appendChild(page);

  cleanup = () => {
    page.remove();
    appRoot.style.background = '';
  };
}

export function unmount() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
}
