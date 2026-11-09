import type { Station, StationCategory } from '../types';

export const STATION_CATEGORIES: Array<{ id: StationCategory; label: string; description: string }> = [
  { id: 'downtempo', label: 'Даунтемпо', description: 'Мягкий ритм и электронные грувы' },
  { id: 'ambient', label: 'Эмбиент', description: 'Фоновые текстуры без резких переходов' },
  { id: 'chillout', label: 'Чиллаут', description: 'Лаунж, вокал и расслабленная электроника' },
  { id: 'custom', label: 'Мои станции', description: 'Добавленные вручную потоки' },
];

function somaStation(
  id: string,
  channel: string,
  name: string,
  description: string,
  category: StationCategory,
  accent: string,
): Station {
  const streamPath = `${channel}-128-mp3`;
  return {
    id,
    name,
    description,
    streamUrl: `https://ice5.somafm.com/${streamPath}`,
    streamFallbackUrls: [
      `https://ice2.somafm.com/${streamPath}`,
      `https://ice6.somafm.com/${streamPath}`,
    ],
    metadataUrl: `https://somafm.com/songs/${channel}.json`,
    category,
    accent,
    isBuiltIn: true,
  };
}

export const DEFAULT_STATIONS: Station[] = [
  somaStation(
    'somafm-groove-salad',
    'groovesalad',
    'Groove Salad',
    'Мягкий ambient и downtempo для спокойной работы.',
    'downtempo',
    '#8298ff',
  ),
  somaStation(
    'somafm-beat-blender',
    'beatblender',
    'Beat Blender',
    'Дип-хаус, downtempo и мягкие ночные биты.',
    'downtempo',
    '#7fc7b0',
  ),
  somaStation(
    'somafm-vaporwaves',
    'vaporwaves',
    'Vaporwaves',
    'Vaporwave, future funk и тёплая кассетная lo-fi эстетика.',
    'chillout',
    '#e58db6',
  ),
  somaStation(
    'somafm-groove-salad-2',
    'groovesalad2',
    'Groove Salad 2',
    'Другой микс chilled ambient и неторопливых битов.',
    'downtempo',
    '#9a7be8',
  ),
  somaStation(
    'somafm-lush',
    'lush',
    'Lush',
    'Мелодичная электроника с мягким женским вокалом.',
    'chillout',
    '#ce8d80',
  ),
  somaStation(
    'somafm-drone-zone',
    'dronezone',
    'Drone Zone',
    'Протяжный ambient без ритма для глубокого фокуса.',
    'ambient',
    '#75a7bd',
  ),
  somaStation(
    'somafm-groove-salad-classic',
    'gsclassic',
    'Groove Salad Classic',
    'Классический микс Groove Salad начала 2000-х.',
    'downtempo',
    '#d39b6a',
  ),
  somaStation(
    'somafm-secret-agent',
    'secretagent',
    'Secret Agent',
    'Кинематографичный downtempo, мягкий лаунж и спокойный ретро-грув.',
    'downtempo',
    '#b6936f',
  ),
  somaStation(
    'somafm-deep-space-one',
    'deepspaceone',
    'Deep Space One',
    'Глубокий электронный ambient и медленные космические текстуры.',
    'ambient',
    '#778fc2',
  ),
  somaStation(
    'somafm-space-station',
    'spacestation',
    'Space Station Soma',
    'Пространственный ambient и неторопливая mid-tempo электроника.',
    'ambient',
    '#6ea6a7',
  ),
  somaStation(
    'somafm-synphaera',
    'synphaera',
    'Synphaera Radio',
    'Современный электронный ambient для ровного фонового звучания.',
    'ambient',
    '#8b83bd',
  ),
  somaStation(
    'somafm-illinois-street-lounge',
    'illstreet',
    'Illinois Street Lounge',
    'Винтажный lounge, exotica и лёгкая музыка середины века.',
    'chillout',
    '#c88972',
  ),
];
