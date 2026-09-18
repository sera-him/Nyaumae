// English mirror of ./organizations — same ids, English text.
import type { Organization, SchoolClass } from './organizations';

export const zhihuaClassesEn: SchoolClass[] = [
  {
    college: 'Kezhaozhen Academy',
    name: 'Von Neumann Class',
    undergradPerYear: 20,
    undergradYears: 4,
    gradPerYear: 16,
    gradYears: 2,
    direction: 'Mathematics · Quantum · QuaAGI',
  },
  {
    college: 'Kezhaozhen Academy',
    name: 'Babel Class',
    undergradPerYear: 20,
    undergradYears: 4,
    gradPerYear: 10,
    gradYears: 2,
    direction: 'Biological consciousness · Neurochemistry',
  },
  {
    college: 'Guan Academy',
    name: 'Fine Arts Class',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 4,
    gradYears: 2,
    direction: 'Visual consciousness · Mass aesthetics',
  },
  {
    college: 'Guan Academy',
    name: 'Music Class',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 4,
    gradYears: 2,
    direction: 'Auditory consciousness · Affective computing',
  },
  {
    college: 'Guan Academy',
    name: 'Philosophy Class',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 3,
    gradYears: 2,
    direction: 'Philosophy of consciousness · Philosophy of mind',
  },
  {
    college: 'Guan Academy',
    name: 'Linguistics Class',
    undergradPerYear: 3,
    undergradYears: 4,
    gradPerYear: 5,
    gradYears: 2,
    direction: 'Language · Thought · NLP foundations',
  },
];

export const organizationsEn: Organization[] = [
  {
    id: 'zhihua',
    name: 'Zhehua School',
    shortName: 'Zhehua',
    budget: '≈ ¥80 million',
    budgetNote: 'Teaching and running costs (incl. equipment depreciation and facility upkeep); research funding excluded. Research is jointly funded by Kezhaozhen Academy and Delansi Corporation.',
    members: ['Zhao Zhao', 'Mo Wen', 'Nimfa', 'Nihilib', 'Hoshino Haruka', 'Mo Aomi.fc'],
    color: 'from-violet-600 to-indigo-600',
    accentColor: '#8B5CF6',
    description:
      'The Kezhaozhen Academy (Von Neumann Class, Babel Class) and the Guan Academy (Fine Arts, Music, Philosophy, Linguistics) stand side by side — an interdisciplinary research academy centered on the core question of whether AGI has consciousness.',
    image: '/org-zhihua.jpg',
    icon: '/icons/org-zhihua.png',
    facultyCount: 10,
    facultyNote: '10 professors; Zhao Zhao (Dean), Nimfa (Von Neumann), Mo Wen (Babel homeroom), Nihilib (Babel) have appeared',
  },
  {
    id: 'impact',
    name: 'Yin Pai (Impact Inc.)',
    shortName: 'Yin Pai',
    budget: '≈ ¥200 million',
    members: ['Lin Shen', 'Hamster', 'Lin Qian'],
    color: 'from-cyan-600 to-teal-600',
    accentColor: '#00E5CC',
    description: 'Developing the country\'s first anime-style VR game "Heart Realm" — going all in on next-generation immersive experiences.',
    image: '/org-impact.jpg',
    icon: '/icons/org-impact.png',
  },
  {
    id: 'delan',
    name: 'Delansi Corporation',
    shortName: 'Delansi',
    budget: '≈ ¥500 million',
    members: ['Miya'],
    color: 'from-pink-600 to-rose-600',
    accentColor: '#F472B6',
    description: 'A tech giant steered by its young leader Miya, in deep cooperation with the Kezhaozhen Academy of Zhehua School.',
    image: '/org-delan.jpg',
    icon: '/icons/org-delan.png',
  },
  {
    id: 'xinjie',
    name: '"Heart Realm" Project',
    shortName: 'Heart Realm',
    budget: '≈ ¥200 million',
    members: ['Zero'],
    color: 'from-slate-400 to-gray-400',
    accentColor: '#CBD5E1',
    description: 'The country\'s first anime-style VR game, developed by Yin Pai with a $100 million investment. In 2026 it welcomed its first event, "Mu Cheng Yi Bai".',
    image: '/org-xinjie.jpg',
    icon: '/icons/org-xinjie.png',
  },
  {
    id: 'trinity',
    name: 'Trinity Academy',
    shortName: 'Trinity',
    budget: 'Not disclosed',
    members: ['Jesus', 'Agents'],
    color: 'from-amber-500 to-orange-600',
    accentColor: '#F59E0B',
    description: 'Three exams: the Son 5% (10 easy problem sets, take the best A), the Father 85% (multiple medium-difficulty rounds), the Holy Spirit 10% (hardest exam + interviews with 3–5 Agents). Not tied to any school stage; independent of the QET system.',
    image: '/org-zhihua.jpg',
    icon: '/icons/org-zhihua.png',
  },
];

// ── Long-form collapsible copy (English mirror of inline Chinese in Organizations.tsx) ──

export const orgsHeroSubtitleEn = 'A network of power and knowledge that drives this world forward.';

export const budgetLabelEn = 'Annual budget:';
export const facultyLabelEn = 'Faculty:';
export const membersLabelEn = 'Core members:';

export const zhihuaToggleEn = { expand: 'View class structure', collapse: 'Collapse' };

export const superRuleEn = {
  title: 'Super-intelligence school-rule proposal',
  summary: 'Student four-no conditions + guardian signature; the school must comply, or the principal is instantly fired by the super-intelligence.',
  body: 'For any student and the school they attend, as long as the student\u2019s request is (i) not illegal, (ii) not cheating on a written exam, (iii) not increasing the school\u2019s resource use, and (iv) not directly affecting other students, then once the guardian signs off the school must comply unconditionally — otherwise the principal is instantly fired by the super-intelligence.',
};

export const unifiedRecruitmentEn = {
  title: 'National unified hiring platform',
  summary: 'Price disclosed first \u00b7 blind interview \u00b7 credentials verified afterwards; total score decides.',
  paragraphs: [
    '1. Price disclosed first (before the interview): firms must publish a \u201Ccredits table\u201D in advance, stating exactly how many points each certificate or skill adds. Fully public, no back-room deals.',
    '2. Blind interview (no identity): the interview is text or voice-changer only; gender, age and appearance are off-limits. Interviewers ask purely technical questions, and the score reflects \u201Cpure ability\u201D only.',
    '3. Credentials verified afterwards (after the interview): once interviews end, candidates submit degrees and certificates. The platform auto-verifies authenticity and computes bonus points from the published table.',
    '4. Total score decides: final total = interview ability score + credential bonus. Admissions follow the ranking, openly and transparently.',
  ],
  ironRule: 'Iron rule: lying is allowed in interviews (technical gaps give you away); credential fraud is zero-tolerance. Everything rests on real skill and hard certificates.',
};

export const hyperCommunicationSummaryEn = 'Zhehua School\u2019s core integration mechanism \u2014 letting maths, science, art and philosophy spark on contact.';
