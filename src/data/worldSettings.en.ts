// English mirror of ./worldSettings — same structure, English text.

export const worldviewNotesEn = [
  'In the story, the Kezhaozhen Academy and Delansi Corporation are the core; next is (un)consciousness; then Yin Pai / Heart Realm; finally the Heart Abyss Journal (ordinary-character side stories).',
  'Note: do not conflate the characters\' profiles unless other characters are explicitly mentioned.',
  'World setting: computer scientists have discovered an AGI training method that can train an AGI of arbitrary capability n, but it requires 2^Θ(n) compute. This method is called the "coin slot machine".',
];

export const hypothesisEn = `Hypothesis: other things being equal, the higher the neural density, the greater the consciousness value, following an S-shaped curve`;

export const qetWrittenEn = {
  score: 500,
  maxApplicants: 65536,
  maxPass: 256,
  fee: 128,
  rules: 'Taken simultaneously with the national postgraduate entrance exam: 101 + 201 + 301 + school-specific papers, supervised by the education bureau; anyone can register. Max applicants 65536, max pass 256, registration fee ¥128.',
};

export const qetPracticalEn = {
  score: 500,
  maxApplicants: 256,
  maxPass: 16,
  fee: 512,
  rules: 'Max applicants 256, max pass 16, registration fee ¥512. Before solving each problem, first guess your own score (prediction); if the actual score ≥ prediction → you get the prediction; if actual < prediction → you get 0. Multiple submissions allowed; each submission\'s Penalty = submission time + 10 minutes × (number of submissions for that problem so far − 1); total time is the sum of penalties for the first highest-scoring submission of each problem. Ranking: total score first, then total time (lower is better).',
};

export const miyaCircleEn = "Miya's circle: Mimi, Qicheng, Miia, Mia, Alice, Cola, Amiya, mia³";

export const muGuangPlanEn = 'Aiefu-chan launched the "Sunlight Project". On February 20, 2026, "Heart Realm" welcomed its first event "Mu Cheng Yi Bai", with "Zero" appearing as a quest NPC.';

export const xinyuanLogEn = '"Heart Abyss Journal" — a channel run privately by Lin Qian, recording "Heart Realm" VRlogs (in essence, a diary).';

export const sheepsSongEn = `Sheep a Sheep｛22-（ey:e=utus:himer）｝Morning Song logM[0x0xC]
8:529 9:420 12:312 18:522 21:1606 22:1603 24:110`;

export const autismFeaturesEn = [
  {
    domain: 'I. Motor & Stereotyped Behaviors',
    items: [
      'Stereotyped Motor Mannerisms: persistent hand-flapping, rapid finger-waving in front of the eyes, finger-twisting, finger-snapping, picking at skin; rocking back and forth; nodding, head-shaking, lightly knocking the head against surfaces; walking on tiptoe, pacing fixed routes, abruptly stopping mid-walk, needing to step on specific floor-tile patterns; jumping, spinning, sudden running, striking fixed poses and holding them for seconds.',
      'Stereotyped Use of Objects: lining up objects in exact straight lines or symmetric patterns; repeatedly spinning wheels, plates, bottle caps; rhythmically tapping desks, walls, one\'s own teeth; holding objects tilted in front of the eyes, tracing edge lines, watching light through finger gaps; needing to carry a specific object at all times.',
      'Ritualistic Behaviors: fixed counts for opening/closing doors and lights; food must be eaten by color, shape or fixed order; dressing strictly in the same sequence; walking routes that can never be changed.',
    ],
  },
  {
    domain: 'II. Communication & Language',
    items: [
      'Spoken language spectrum: Nonverbal; Minimally Verbal; Delayed Echolalia; Immediate Echolalia; Pronoun Reversal.',
      'Nonverbal communication: pulling an adult\'s wrist to the desired object (hand-as-tool); bumping into people to express needs or emotions; emitting single, high-frequency sounds; facial expressions misaligned with emotions.',
      'Comprehension: far higher understanding of literal instructions than of abstract language; extreme sensitivity to tone and timbre; inability to understand sarcasm, metaphor or jokes.',
    ],
  },
  {
    domain: 'III. Sensory Processing',
    items: [
      'Auditory: hypersensitivity to specific frequencies (vacuum cleaners, hair dryers, children screaming, fluorescent ballast hum); auditory filtering difficulty (cannot separate voices from background noise).',
      'Visual: staring at light sources, spinning objects, fan blades; looking at objects sideways (peripheral vision).',
      'Tactile: defensive (resisting hugs, specific fabric textures, wet-hand contact); seeking (loving tight pressure, rubbing rough surfaces with the hands).',
      'Vestibular & proprioceptive: spinning without dizziness; loving upside-down positions, hanging, jumping from heights; stomping hard while walking to get ground feedback.',
      'Interoception: difficulty sensing hunger, fullness, thirst, heat/cold, the need to use the toilet; abnormal responses to pain; inability to describe where and how the body feels unwell.',
    ],
  },
  {
    domain: 'IV. Daily Living & Self-care',
    items: [
      'Eating: extremely picky; rejecting whole plates because of mixed colors, smells or textures; drinking only from a specific cup.',
      'Toileting: toilet training difficulties, even lifelong diaper dependence; fear of bathrooms.',
      'Sleep: trouble falling asleep, fragmented sleep, early waking; a fixed bedtime ritual must be performed.',
      'Safety & danger awareness: lacking risk prediction for heights, traffic, hot water, sharp objects; elopement risk.',
    ],
  },
  {
    domain: 'V. Emotional & Behavioral Outbursts',
    items: [
      'Meltdown (nervous-system overload collapse): triggers — sensory overload, broken routines, inability to express needs; manifestations — screaming, self-injury, attacking others, destroying objects, collapsing, vomiting, loss of continence.',
      'Shutdown: sudden stillness, blank stare, no response to calls, body going limp or rigid.',
      'Self-injurious behaviors (SIB): head-banging, biting oneself, scratching the skin until it breaks, pulling out hair.',
      'Aggression: scratching, biting, hair-pulling, kicking, throwing objects at people.',
    ],
  },
  {
    domain: 'VI. Cognition & Interests',
    items: [
      'Narrow interests: encyclopedic memory of very few topics; actively filtering out any other input.',
      'Uneven cognitive profile: fragmented high ability in specific domains, while simple causal relations cannot be grasped and two-step instructions cannot be followed.',
      'Extreme resistance to change: moved furniture, changed daily order, changed caregivers, school holidays — all can trigger weeks of behavioral regression.',
    ],
  },
  {
    domain: 'VII. Sociality & Attachment',
    items: [
      'Response to others: possible faint discrimination toward familiar people; ignoring strangers or lacking social distance; lacking joint attention.',
      'Attachment style: may be anxious attachment; or over-attachment to specific objects, with attachment to objects stronger than to people.',
    ],
  },
];

export const fourDimensionTestEn = {
  title: 'Four-Dimension Test: Ox-Horse Persona vs Cat-Meo Persona',
  dimensions: [
    {
      name: 'Interruption Resistance',
      human: 'Can go back: after being interrupted, seamlessly resumes the previous task (a skill oxen-and-horses are forced to train).',
      cat: 'Can\'t go back: once interrupted, that attention is gone for good and never returns.',
    },
    {
      name: 'Action Alarm',
      human: 'Objective time: time to get up, wash up, brush teeth.',
      cat: 'Body clock: sleepy? hungry? want to? — all matter more than what time it is now.',
    },
    {
      name: 'Focus Mode',
      human: 'Active willpower: can make oneself focus through willpower. "Trying hard" is possible.',
      cat: 'Passive switching: willpower is useless! When the state comes, do it; when it doesn\'t, lie down; the body switches automatically.',
    },
    {
      name: 'Reading the Room',
      human: 'Of course: isn\'t this automatic? Interpreting people is a background resident process.',
      cat: 'Not at all: of course it\'s not automatic! The brain doesn\'t scan for that kind of information by default.',
    },
  ],
  results: [
    { id: 'No.0',  desc: 'Human-Human-Human-Human: you live exactly as society expects. Is that really you? Who knows.' },
    { id: 'No.1',  desc: 'Human-Human-Human-Cat: interruption-proof, schedule-driven, willpower-focused — but you alone find reading the room non-automatic. Socializing is deliberate homework for you.' },
    { id: 'No.2',  desc: 'Human-Human-Cat-Human: strong interruption recovery, punctual, reading the room is a given — but "trying hard" means nothing to you.' },
    { id: 'No.4',  desc: 'Human-Cat-Human-Human: interruptions roll right off, focus comes by willpower, social reading is default — but your body listens only to itself.' },
    { id: 'No.8',  desc: 'Cat-Human-Human-Human: schedule-driven, max agency, reading the room is a given — but once interrupted you never go back. You\'re a precision instrument with no pause memory.' },
    { id: 'No.3',  desc: 'Human-Human-Cat-Cat: interruption resistance and objective time maxed out, yet you trust neither "trying" nor automatic socializing — a machine that runs on commands, with no soul switch.' },
    { id: 'No.5',  desc: 'Human-Cat-Human-Cat: you resume after interruptions and believe in agency, but your schedule follows your body and your socializing follows your mood — a lone-wolf worker.' },
    { id: 'No.6',  desc: 'Human-Cat-Cat-Human: your only human traits are interruption recovery and default social reading; everything else goes with the flow — a cat coasting through the workplace on muscle memory.' },
    { id: 'No.9',  desc: 'Cat-Human-Human-Cat: punctual, agentic, but you don\'t trust automatic social reading and interruptions erase your memory — a disciplined cat that can never figure out why humans smile at each other.' },
    { id: 'No.10', desc: 'Cat-Human-Cat-Human: your schedule is human and social reading is default, but you can neither exert effort nor recover attention — a pet trained into a polite shell, with a wild wind still inside.' },
    { id: 'No.12', desc: 'Cat-Cat-Human-Human: agency and social reading are your only human plugins; everything else is cat base-system — you work hard to play a normal person in the cracks of human society.' },
    { id: 'No.7',  desc: 'Human-Cat-Cat-Cat: you have exactly one superpower — seamlessly resuming after interruptions. The rest of the time you\'re a wild animal that needs to be fed inspiration and sleep.' },
    { id: 'No.11', desc: 'Cat-Human-Cat-Cat: you eat on schedule, and that\'s it. Attention, effort and social intuition are all up to fate — a cat that can read a wall clock.' },
    { id: 'No.13', desc: 'Cat-Cat-Human-Cat: you actually believe in "trying", but your attention is a bubble, your schedule is the tide and socializing is a puzzle — a cat trying to fight its species\' nature with willpower.' },
    { id: 'No.14', desc: 'Cat-Cat-Cat-Human: interruptions erase you, your body runs the show, effort is alien to you — but you find reading the room automatic. Probably because humans have raised you for too long.' },
    { id: 'No.15', desc: 'Cat-Cat-Cat-Cat: you live as a cat that does whatever it wants. What do humans think? NBCS.' },
    { id: 'No.16', desc: 'Roll-Roll-Roll-Roll: I\'m not doing your silly test.' },
  ],
  questions: [
    { dim: 0, human: 'I can return to what I was doing immediately after an interruption', cat: 'Once interrupted, I completely forget what I was thinking' },
    { dim: 0, human: 'I can handle multiple tasks at once', cat: 'I absolutely cannot start the next thing before finishing the current one' },
    { dim: 0, human: 'I can still write code after being called into a meeting', cat: 'I go for a glass of water and come back with no idea what I was doing' },
    { dim: 1, human: 'I wake up on time when the alarm is set', cat: 'I turn the alarm off and keep sleeping until I wake naturally' },
    { dim: 1, human: 'I strictly follow a timetable', cat: 'I do things when I feel like it, and not when I don\'t' },
    { dim: 1, human: 'I arrive 10 minutes early to meetings', cat: 'I forget about appointments and only remember once I\'m already late' },
    { dim: 2, human: 'I can will myself into a focused state', cat: 'When the state comes I do it; when it doesn\'t I lie down; urging myself is useless' },
    { dim: 2, human: 'I tell myself that effort raises efficiency', cat: 'Effort is a lie; the body only follows its own rhythm' },
    { dim: 2, human: 'I force myself to start working even without the mood', cat: 'Forcing myself to start without the mood only makes things worse' },
    { dim: 3, human: 'I automatically sense the emotions of people around me', cat: 'Other people\'s emotions? I didn\'t notice at all' },
    { dim: 3, human: 'I read between the lines in conversation', cat: 'People mean exactly what they say; I don\'t guess subtext' },
    { dim: 3, human: 'I can feel when the atmosphere in a room is off', cat: 'Atmosphere? I only look at facts and data' },
  ],
};

export const moralPrinciplesNoteEn = '"Paternalism-critique framework": Principle 5 checks procedural symmetry but does not guarantee risk-sharing; Principle 1 implies risk-sharing but does not affect the justification of the act, only distinguishing innocent from voluntary sacrifice. Principles 7–9 draw the ethical boundary of "deciding for others".';

export const lawValuesNoteEn = 'Mainstream values hold that law exists to reduce social harm, but the law view of the Guan Academy at Zhehua School holds: law should exist to reduce the number of innocent people harmed for objective reasons (such as lacking common knowledge).';

export const moralPrinciplesEn = [
  { id: '1', title: 'Primacy of Autonomy', content: 'A rational subject bears all foreseeable consequences of their voluntary choices — all costs to themselves, however noble the motive. And if you can foresee that an act may harm anyone in society, then you can also foresee harming yourself.' },
  { id: '2', title: 'Waivable Rights', content: 'The right to life, safety, etc. can, on a purely moral level, be voluntarily placed at risk, or even waived.' },
  { id: '3', title: 'Moral Universalism', content: 'Any act A can enter the discussion of "whether its punishment should be reduced"; there is no a priori "unforgivable" category.' },
  { id: '4', title: 'Separation of Responsibility', content: 'Attribution of the foreseeable consequences of a victim\'s own autonomous act must be strictly separated from evaluation of the moral or legal responsibility of the perpetrator\'s act; no discourse about the former may weaken the independence and integrity of the latter, logically, institutionally or pragmatically.' },
  { id: '5', title: 'Reversibility Test', content: 'If an act A causes substantial harm to another, and that harm was not necessary to avoid a greater irreversible harm, or was not carried out on an understandable, exitable consent basis, then whoever claims A is justified must be able to accept becoming the object of A under the same objective conditions; if they refuse, then A is not universalizable in practical reason.' },
  { id: '6', title: 'The nyaumæ Rule', content: 'nyaumæ is a 2nd-grade student.' },
  { id: '7', title: 'Autonomy Barrier', content: 'Moral responsibility cannot be achieved at the cost of personal autonomy.' },
  { id: '8', title: 'Inaction Exemption', content: 'Even if someone "is capable of preventing harm", as long as intervening would restrict others\' free choice, that "inaction" should not be condemned.' },
  { id: '9', title: 'The Evil of Paternalism', content: 'The real "evil" is not "failing to save someone", but "deciding for others".' },
  { id: '10', title: 'Anti-Paternalism', content: 'Coercion may not be used merely to protect a person from their own voluntary self-harm.' },
  { id: '11', title: 'Anti-Proxy Indicators', content: 'Institutions should target the facts that actually matter, and must not treat conveniently measurable proxy variables as the goal itself.' },
  { id: '12', title: 'Pure Deterrence View of Punishment', content: 'The only legitimate purpose of punishment is to reduce crime by changing future behavior.' },
];

export const nyaumaeismPrinciplesEn = [
  { id: 'I',   title: 'Humans as Ends',    content: 'Humans are the fundamental end. AI may surpass humans, but it cannot replace them.' },
  { id: 'II',  title: 'Collective Emergence', content: 'Individual agency is limited; only a highly coordinated collective produces emergent agency.' },
  { id: 'III', title: 'Instant Consent, Revocable Anytime', content: 'When all affected parties consent at the moment, the act is absolutely lawful; but consent can in some cases be broken by exit, and the breaking itself is lawful.' },
  { id: 'IV',  title: 'Stillness Is Movement', content: 'Stillness is a special type of movement.' },
  { id: 'V',   title: 'Open Rules', content: '(With low probability) there may be meta-rules that change rules, even infinitely nested; a final rule need not exist.' },
  { id: 'VI',  title: 'Society and Philosophy Untied', content: 'Social development does not necessarily bring philosophical development.' },
  { id: 'VII', title: 'Civilization as Label', content: 'Civilization is merely a neutral label of a society; it carries no value hierarchy.' },
];

export const catTrueNameTableEn = [
  { cat: 'Bengal Cat', real: 'Bengal Tiger' },
  { cat: 'Siberian Cat', real: 'Siberian Tiger' },
  { cat: 'South China Cat', real: 'South China Tiger' },
  { cat: 'Sumatran Cat', real: 'Sumatran Tiger' },
  { cat: 'Indochinese Cat', real: 'Indochinese Tiger' },
  { cat: 'Malayan Cat', real: 'Malayan Tiger' },
  { cat: 'African Perm Cat', real: 'African Lion' },
  { cat: 'Asian Perm Cat', real: 'Asiatic Lion' },
  { cat: 'American Cat', real: 'Jaguar' },
  { cat: 'African Money Cat', real: 'Leopard' },
  { cat: 'Snow Cat', real: 'Snow Leopard' },
  { cat: 'Cloud Cat', real: 'Clouded Leopard' },
  { cat: 'Sunda Cloud Cat', real: 'Sunda Clouded Leopard' },
  { cat: 'American Golden Cat', real: 'Puma' },
  { cat: 'Speed Cat', real: 'Cheetah' },
  { cat: 'Mountain Cat', real: 'Lynx' },
  { cat: 'Bobcat', real: 'Bobcat' },
  { cat: 'Canada Mountain Cat', real: 'Canada Lynx' },
  { cat: 'Iberian Mountain Cat', real: 'Iberian Lynx' },
  { cat: 'Serval Cat', real: 'Serval' },
  { cat: 'Caracal Cat', real: 'Caracal' },
  { cat: 'African Golden Cat', real: 'African Golden Cat' },
  { cat: 'Borneo Golden Cat', real: 'Borneo Bay Cat' },
  { cat: 'Asian Golden Cat', real: 'Asian Golden Cat' },
  { cat: 'Square-Face Cat', real: "Pallas's Cat" },
  { cat: 'Leopard Cat', real: 'Leopard Cat' },
  { cat: 'Fishing Cat', real: 'Fishing Cat' },
  { cat: 'Flat-Headed Cat', real: 'Flat-Headed Cat' },
  { cat: 'Rusty-Spotted Leopard Cat', real: 'Rusty-Spotted Cat' },
  { cat: 'Black-Footed Cat', real: 'Black-Footed Cat' },
  { cat: 'Desert Cat', real: 'Sand Cat' },
  { cat: 'Jungle Cat', real: 'Jungle Cat' },
  { cat: 'Chinese Desert Cat', real: 'Chinese Mountain Cat' },
  { cat: 'House Cat', real: 'Domestic Cat' },
  { cat: 'European Wild Cat', real: 'European Wildcat' },
  { cat: 'Tiger Cat', real: 'Ocelot' },
  { cat: 'Long-Tailed Tiger Cat', real: 'Margay' },
  { cat: 'Small-Spotted Tiger Cat', real: 'Oncilla' },
  { cat: 'South American Forest Cat', real: 'Kodkod' },
  { cat: "Geoffroy's Cat", real: "Geoffroy's Cat" },
  { cat: 'Andean Cat', real: 'Andean Mountain Cat' },
  { cat: 'Pampas Cat', real: 'Pampas Cat' },
  { cat: 'Marbled Cat', real: 'Marbled Cat' },
  { cat: 'Slender-Waisted Cat', real: 'Jaguarundi' },
];

export const citizenLevelSystemEn = `Starting point: at age 6 you automatically receive Level 6. Level 6 corresponds to age 6 in reality: parental guardianship, no criminal responsibility, no property rights, no contracting capacity, and the right to education.

Leveling up: voluntary application; you may rise but never fall, and may not exceed your biological age. If you never level up, you stay at your current level forever, and no authority may force you to level up. Once raised, a level cannot be lowered — this prevents exploiting a higher level to sign contracts and then lowering it to escape liability. Whichever level you choose, the law treats you as the corresponding real-world age group.

Rights unlocked: higher levels unlock the corresponding rights, including voting, marriage, childbirth, tax obligations, criminal responsibility, and so on.

Level-up conditions: biological age reached + voluntary application + passing the citizenry basics test for that level. Anyone already at Level 25 or above is exempt from the test.

Examination: a button is embedded at birth; it can only send, not receive. Pressing the button opens the exam interface, which you may exit. You may choose any exam level from your current level +1 up to your biological age. The content is simple. Those who repeatedly fail the exam are uniformly deemed incapacitated, whether intentional or not. The incapacitated take a different exam paper that can identify the truly incapacitated, and customized laws apply to them. They no longer hold a level; their goal is to regain one.

Compulsory education: 12 years, covering up to Level 18. If you don't reach Level 18, you keep attending school. Lunch is on your own; there is no free board and lodging. After reaching Level 18, schooling is no longer mandatory.

Guardianship: the parents of a Level 6 citizen are the legal guardians; they may not shirk the duty, but it can be legally revoked. Parents themselves cannot be Level 6–17, because that is below the age of reproductive rights. Orphans are placed under state guardianship, with their property held in trust.

Responsibility: criminal handling mirrors reality exactly — if that age bears no criminal responsibility, the person is released after corrective education; if it does, they are sentenced and serve time according to law. Lower levels pay no taxes, lack full contracting capacity, and cannot work independently.

Reproduction and welfare: when a legal minor gives birth, the child is raised by the minor's parents; both the child and the parents have the right to decide on abortion (neither side may unilaterally decide to give birth — all must agree). Pensions are tied to contribution records; those who did not contribute during low-level periods cannot receive a pension.`;

export const teacherVotingRuleEn = `Every graduate may vote every year for every teacher who has ever taught them, giving each teacher a score between -10 and +10; not voting counts as 0. The teacher with the lowest final score — if that score is negative — loses their entire year-end bonus.`;

export const workplaceBlindnessRuleEn = `Namely: while at work, no one can acquire or remember any age-related feature information of others.

While at work, no one (except doctors) can acquire or remember any physiological feature information of others.`;

export const specialChildrenNotesEn = [
  {
    title: 'Stereotypy and Ritualization',
    content: 'These children may not speak, and their eyes rarely meet people. They repeat the same action over and over (like spinning in circles or flipping light switches), and life must follow a completely fixed routine — for example, they must drink water from the same cup; if it is changed, they cry and scream in distress, even bang their heads. This is not misbehavior; their brains are simply "stuck" and cannot flex.',
  },
  {
    title: 'Hallucinations and Catatonia',
    content: 'These children may see things others cannot see (hallucinations), or suddenly freeze motionless, holding one pose for a long time like a "wooden statue" (much like the "mechanical" state you described). Sometimes they erupt in sudden rage, with strength adults cannot restrain. It is as if the signal wires in the brain have "shorted out".',
  },
  {
    title: 'Self-Care and Development',
    content: 'These children, perhaps because of oxygen deprivation at birth or genetic issues, cannot use the toilet or eat by themselves, and may even eat inedible things (like paper scraps or modeling clay). They walk unsteadily, or rock their bodies nonstop.',
  },
  {
    title: 'Why They Refuse School',
    content: 'These children may refuse school because, in the first semester of third grade, the school teaches advanced courses such as generalized linear models, artificial intelligence, operating systems, and computer architecture.',
  },
  {
    title: 'Third-Grade Curriculum Proposal',
    content: 'I propose replacing the third-grade curriculum of generalized linear models, artificial intelligence, operating systems, and compiler principles with: teaching them to pound a soft cushion instead of banging their heads; pointing at a picture when they want water, without needing to read the character "water"; allowing stereotypy, while secretly slipping 0.1% of new variation into it.',
  },
];
