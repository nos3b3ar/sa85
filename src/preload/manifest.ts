import type { PreloadItem } from './preloadAssets';

/**
 * Alles, was vor dem Desktop bereitliegen soll.
 * Spätere Spiele und Bilder kommen als weitere Einträge dazu,
 * module-Einträge laden den jeweiligen Chunk vor.
 */
export const preloadManifest: PreloadItem[] = [
  { id: 'ms-sans', type: 'font', family: 'MS Sans Serif', src: '/fonts/ms_sans_serif.woff2' },
  {
    id: 'ms-sans-bold',
    type: 'font',
    family: 'MS Sans Serif',
    src: '/fonts/ms_sans_serif_bold.woff2',
    weight: '700',
  },
  { id: 'portrait', type: 'image', src: '/img/stefan-andernach.jpg' },
  { id: 'about', type: 'module', load: () => import('../apps/AboutApp') },
  { id: 'skills', type: 'module', load: () => import('../apps/SkillsApp') },
  { id: 'portfolio', type: 'module', load: () => import('../apps/PortfolioApp') },
  { id: 'contact', type: 'module', load: () => import('../apps/ContactApp') },
  { id: 'explorer', type: 'module', load: () => import('../apps/explorer/Explorer') },
  { id: 'browser', type: 'module', load: () => import('../apps/BrowserApp') },
  { id: 'saver-default', type: 'module', load: () => import('../screensaver/savers/pipes') },
];
