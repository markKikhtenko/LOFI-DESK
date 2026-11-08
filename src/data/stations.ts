import type { Station } from '../types';

export const DEFAULT_STATIONS: Station[] = [
  {
    id: 'somafm-groove-salad',
    name: 'Groove Salad',
    description: 'Мягкий ambient и downtempo для спокойной работы.',
    streamUrl: 'https://ice5.somafm.com/groovesalad-128-mp3',
    metadataUrl: 'https://somafm.com/songs/groovesalad.json',
    accent: '#8298ff',
    isBuiltIn: true,
  },
  {
    id: 'somafm-groove-salad-classic',
    name: 'Groove Salad Classic',
    description: 'Классический микс Groove Salad начала 2000-х.',
    streamUrl: 'https://ice5.somafm.com/gsclassic-128-mp3',
    metadataUrl: 'https://somafm.com/songs/gsclassic.json',
    accent: '#d39b6a',
    isBuiltIn: true,
  },
  {
    id: 'somafm-groove-salad-2',
    name: 'Groove Salad 2',
    description: 'Другой микс chilled ambient и неторопливых битов.',
    streamUrl: 'https://ice5.somafm.com/groovesalad2-128-mp3',
    metadataUrl: 'https://somafm.com/songs/groovesalad2.json',
    accent: '#9a7be8',
    isBuiltIn: true,
  },
];

