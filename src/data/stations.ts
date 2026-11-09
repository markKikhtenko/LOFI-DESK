import type { Station } from '../types';

function somaStation(
  id: string,
  channel: string,
  name: string,
  description: string,
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
    '#8298ff',
  ),
  somaStation(
    'somafm-beat-blender',
    'beatblender',
    'Beat Blender',
    'Дип-хаус, downtempo и мягкие ночные биты.',
    '#7fc7b0',
  ),
  somaStation(
    'somafm-vaporwaves',
    'vaporwaves',
    'Vaporwaves',
    'Vaporwave, future funk и тёплая кассетная lo-fi эстетика.',
    '#e58db6',
  ),
  somaStation(
    'somafm-groove-salad-2',
    'groovesalad2',
    'Groove Salad 2',
    'Другой микс chilled ambient и неторопливых битов.',
    '#9a7be8',
  ),
  somaStation(
    'somafm-lush',
    'lush',
    'Lush',
    'Мелодичная электроника с мягким женским вокалом.',
    '#ce8d80',
  ),
  somaStation(
    'somafm-drone-zone',
    'dronezone',
    'Drone Zone',
    'Протяжный ambient без ритма для глубокого фокуса.',
    '#75a7bd',
  ),
  somaStation(
    'somafm-groove-salad-classic',
    'gsclassic',
    'Groove Salad Classic',
    'Классический микс Groove Salad начала 2000-х.',
    '#d39b6a',
  ),
];
