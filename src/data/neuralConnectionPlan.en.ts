// English mirror of ./neuralConnectionPlan — same ids, English text.
import type { NeuralSystem } from './neuralConnectionPlan';

export const NEURAL_SYSTEMS_EN: NeuralSystem[] = [
  {
    id: 'stories', index: '01', title: 'Story Directory', english: 'STORY DIRECTORY', tier: 'S',
    description: 'Five story worlds, volume-by-volume reading, reading progress and canon materials all unfold from here.', route: '/stories', accent: '#ff9fc8', icon: 'book',
  },
  {
    id: 'characters', index: '02', title: 'Character Network', english: 'CHARACTER NETWORK', tier: 'S',
    description: 'Profiles, relationships, families, factions and character timelines are all interconnected.', route: '/characters', accent: '#c2a0ff', icon: 'users',
  },
  {
    id: 'universe', index: '03', title: 'World Lore', english: 'WORLD LORE', tier: 'S',
    description: 'The shared coordinate system of chronicles, maps, organizations, rules and the future timeline.', route: '/world', accent: '#91c7ff', icon: 'globe',
  },
  {
    id: 'games', index: '04', title: 'Game Universe', english: 'GAME UNIVERSE', tier: 'S',
    description: 'AURORA ATLAS, Recursive Echo, Cat Machine and Scratch.', route: '/playground', accent: '#8caeff', icon: 'game',
  },
  {
    id: 'cognition', index: '05', title: 'Cognition Lab', english: 'COGNITION LAB', tier: 'A',
    description: 'NCTB standard exams, the ten-dimension ability atlas and historical reports.', route: '/nctb', accent: '#ffd17a', icon: 'flask',
  },
  {
    id: 'research', index: '06', title: 'Research Lab', english: 'RESEARCH LAB', tier: 'A',
    description: 'PEMS-L, FLA, the height-weight model and interactive mathematical research.', route: '/math', accent: '#75e8d5', icon: 'sigma',
  },
  {
    id: 'creative', index: '07', title: 'Creative Studio', english: 'CREATIVE STUDIO', tier: 'B',
    description: 'Star Sea dialogues, Sweet Dream Cottage, Aurora Star Words and character chats.', route: '/chat', accent: '#e8a4ff', icon: 'sparkles',
  },
  {
    id: 'neural', index: '08', title: 'In-Site AI Assistant', english: 'AI ASSISTANT', tier: 'B',
    description: 'On-demand in-site retrieval, citations, conversation, memory and canon boundaries.', route: '/chat', accent: '#74efe0', icon: 'brain',
  },
];
