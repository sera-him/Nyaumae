// English mirror of ./catalog — same ids, English text.
import type { NctbDimension } from './types.ts';

export const NCTB_DIMENSIONS_EN: readonly NctbDimension[] = [
  { id: 'pattern', index: '01', title: 'Pattern Recognition', english: 'PATTERN', description: 'Discovering relationships among repetition, change and structure.', skill: 'Visual & abstract', accent: '#8deee0', targetQuestionCount: 8 },
  { id: 'memory', index: '02', title: 'Working Memory', english: 'MEMORY', description: 'Holding, updating and reordering information within a time limit.', skill: 'Maintain & update', accent: '#bfa8ff', targetQuestionCount: 8 },
  { id: 'space', index: '03', title: 'Spatial Reasoning', english: 'SPACE', description: 'Rotating, mapping and comparing spatial structures in the mind.', skill: 'Spatial configuration', accent: '#91c7ff', targetQuestionCount: 8 },
  { id: 'quantity', index: '04', title: 'Quantity Relations', english: 'QUANTITY', description: 'Understanding quantity, proportion, sequence and operation relations.', skill: 'Quantity modeling', accent: '#ffd17a', targetQuestionCount: 8 },
  { id: 'language', index: '05', title: 'Language Reasoning', english: 'LANGUAGE', description: 'Extracting conditions, meanings and logical relations from text.', skill: 'Semantic structure', accent: '#ff9fc8', targetQuestionCount: 8 },
  { id: 'attention', index: '06', title: 'Attention Control', english: 'ATTENTION', description: 'Maintaining goals amid interference and switching rules in time.', skill: 'Inhibition & switching', accent: '#74efe0', targetQuestionCount: 8 },
  { id: 'speed', index: '07', title: 'Speed & Accuracy', english: 'SPEED', description: 'Balancing speed and error rate under clear time recording.', skill: 'Timed performance', accent: '#ffbf7c', targetQuestionCount: 8 },
  { id: 'causality', index: '08', title: 'Causal Reasoning', english: 'CAUSALITY', description: 'Predicting outcomes from conditions and recognizing counterfactual branches.', skill: 'Causal modeling', accent: '#e8a4ff', targetQuestionCount: 8 },
  { id: 'planning', index: '09', title: 'Strategic Planning', english: 'PLANNING', description: 'Decomposing goals, managing resources and choosing next steps.', skill: 'Multi-step strategy', accent: '#a6d8ff', targetQuestionCount: 8 },
  { id: 'transfer', index: '10', title: 'Comprehensive Transfer', english: 'TRANSFER', description: 'Transferring formed strategies to new problems.', skill: 'Cross-domain transfer', accent: '#d8b5ff', targetQuestionCount: 8 },
];
