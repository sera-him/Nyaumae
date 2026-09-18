// English mirror of the hardcoded copy in ../sections/PacificIslands.tsx.
// Same field names / array order as the Chinese originals; styling fields
// (e.g. `color`) are carried over untouched. Proper-noun spellings follow the
// existing glossary in src/lib/translations (Lanxi Republic, Crimson Zero,
// Wujia, Chengwan Republic, ...).

export const nationsEn = [
  { name: 'Lanxi Republic', desc: 'Close trade with China and Japan. Lost control of Wujia in 2042.', color: 'text-blue-300' },
  { name: 'Qingyu Federation', desc: 'Made up of seven main islands, strong in agriculture and marine engineering.', color: 'text-emerald-300' },
  { name: 'Baichao Kingdom', desc: 'A shipping nation that kept its monarchy, with an old naval tradition.', color: 'text-cyan-300' },
  { name: 'Mirror Sea Republic', desc: 'Known for finance, education and precision instruments.', color: 'text-violet-300' },
  { name: 'Yujian Duchy', desc: 'A small, mountainous and rainy island nation with a tiny population.', color: 'text-sky-300' },
  { name: 'Xingpu Federation', desc: 'Made of natural and artificial islands, with advanced manufacturing.', color: 'text-amber-300' },
  { name: 'Chengwan Republic', desc: 'A key fishery, cold-chain and offshore resupply hub. Uses the RMB.', color: 'text-orange-300' },
  { name: 'Xuanjiao Community', desc: 'Scattered islands that live on ports, maritime law and cross-border arbitration.', color: 'text-slate-300' },
  { name: 'Xijia Kingdom', desc: 'A volcanic island nation with geothermal energy and a deep-water port.', color: 'text-red-300' },
  { name: 'Floating Light Isles', desc: 'Tourism, cultural industries and virtual entertainment are well developed.', color: 'text-pink-300' },
  { name: 'Haiting Republic', desc: 'Long neutral, and an important diplomatic meeting place for the island nations.', color: 'text-indigo-300' },
  { name: 'Yuanxi Federation', desc: 'Further out in the Pacific: vast territory, sparse population.', color: 'text-teal-300' },
  { name: 'Yuanchui Federation', desc: 'A three-tier vertical state: robotic agriculture above, an ordinary city in the middle, drugs and cheap labour below. Government mediates; customs control is layered.', color: 'text-zinc-300' },
];

export const chinaPolicyEn = [
  { label: 'Ordinary tourism, family visits and short business trips', detail: 'Visa-free for 30 days' },
  { label: 'Study, long-term work and settlement', detail: 'A licence must be applied for' },
  { label: 'News interviews', detail: 'A licence must be applied for' },
];

export const travelInfoEn = [
  'Chinese citizens entering Chengwan are visa-free for 30 days for tourism, family visits and short business trips',
  'Chengwan citizens entering China are also visa-free for 30 days',
  'A valid ID and electronic entry permit suffice; a traditional visa is not always required in advance',
  'There are many ferries and short flights between the two countries; some ports allow same-day return',
];

export const timelineEn = [
  { time: '04:02', title: 'Blackout blackout', desc: 'Wujia extinguishes all external identification lights and cuts the central government’s access to city systems. The city AGI takes over all governance.' },
  { time: '04:02', title: 'Fleet launch', desc: 'The first hovering ship rises from a dock under East Port. Its black hull climbs slowly along the aerial lanes between towers as drones form a defensive net around the city.' },
  { time: '05:17', title: 'Battle of Beiling', desc: 'A Lanxi armoured convoy takes a precision electromagnetic strike; engines, comms and fire control fail at once, 14 km from the city boundary.' },
  { time: '05:41', title: 'Railway cut', desc: 'Engineering drones pull up track before the tunnel exit, keeping comms and evacuation routes open to stop troop trains.' },
  { time: '06:00', title: 'Ultimatum expired', desc: 'Wujia is still ablaze with light. The city AGI announces: “The former state has lost effective management of this city’s public systems.”' },
  { time: '06:13', title: 'Crimson Zero response', desc: 'The central government orders Crimson Zero to stand the fleet down. She deletes the old keys and replies: “You helped build my body, but you have never owned my present.”' },
  { time: '15:26', title: 'Ceasefire', desc: 'The Lanxi Republic orders its front-line troops to halt. It does not recognise independence, but can no longer retake Wujia.' },
  { time: '19:00', title: 'Provisional charter', desc: 'The Wujia council passes the Free City Provisional Charter and declares the Free City of Wujia.' },
];

// ── Scattered JSX copy that has no whole-string entry in the translations
//    glossary, and the city-stats mini-array. ──────────────────────────────

export const pacificIntroEn =
  'A chain of island nations and city-states on the western edge of the Pacific. From monarchist kingdoms to AI-administered cities, from fishery republics to virtual-entertainment archipelagos, it forms a complex and living map of oceanic politics.';

export const yuanchuiTitleEn = 'Yuanchui Federation · Three-tier structure';

export const yuanchuiDescEn =
  'Robotic agriculture above, an ordinary city in the middle, drugs and cheap labour below. The government sits between the two tiers: it does not run the drugs trade directly, it only collects taxes. Movement between upper and lower tiers is free, but climbing up requires customs: contraband-free passage goes straight through, a small amount of contraband can be released on payment, and large amounts are refused.';

export const lowerTierDescEn =
  'Entered voluntarily; residents stay on because of addiction and supply cheap labour. Heavy drug use has cost them their fertility; they do not reproduce naturally.';

export const customsDescEn =
  'The middle tier stays open as normal while the lower tier is normally closed; under external sanctions, the lower tier opens at once and drugs flow out across the globe.';

export const yuanchuiNoteEn =
  'Note: the Yuanchui Federation is a recent addition to the West Pacific island nations, separate from the mainland main world.';

export const chengwanChinaTitleEn = 'Chengwan Republic × China';

export const cityHeadingEn = 'Free City of Wujia';

export const cityStatsEn = [
  { label: 'Core district', value: 'a few square kilometres' },
  { label: 'Residents', value: 'under 200,000' },
  { label: 'Independence Day', value: '2042.4.2' },
];
