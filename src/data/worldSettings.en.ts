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

Reproduction and welfare: when a legal minor gives birth, the child is raised by the minor's parents; both the child and the parents have the right to decide on abortion (neither side may unilaterally decide to give birth — all must agree). Pensions are tied to contribution records; those who did not contribute during low-level periods cannot receive a pension.

Temporary grades (supplement)

1. Establishment: when illness, trauma or ageing causes anyone to lose, or significantly reduce, their cognitive capacity, a statutory assessment procedure can grant them a temporary grade no higher than their permanent grade. In civil matters they are treated at the temporary grade (guardianship, contracting and property management all step down accordingly); criminal responsibility is unaffected and still mirrors reality by the permanent grade.

2. Sole entry point: assessment. The establishment, adjustment and revocation of a temporary grade can happen only through a formal assessment carried out by an independent assessment body. No individual — spouse, parent or child — may declare someone else demoted on their own authority. Those who disagree may apply for reassessment; during reassessment the status quo holds, or the higher grade is applied protectively for the time being (the exact orientation can be decided later, but procedurally there must be an appeal channel).

3. Reversible: a temporary grade does not void the permanent grade. Once recovered and the assessment passes, it is revoked and the permanent grade resumes exactly as it was: no breach arises in the interim, no debt acceleration, and accumulated pension contribution records are not lost.

4. No abuse: anyone who applies to demote someone else using false material is treated as fraud; an assessment body with an interest in the applicant must recuse itself. This one is hard law — because the greatest risk of demotion is not the system itself but relatives who want to turn a troublesome adult back into a child (the Līlā analysis in the archive is a live specimen of exactly this risk: the guardian could not wait to be rid of them). A temporary grade must be "the result of a state assessment" and can never become "a tool of family exile".`;

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

// English mirror of miiaSchoolRules. Same order, same length.
export const miiaSchoolRulesEn = [
  {
    title: 'Teachers',
    content: 'The dogs chase the teachers out too, even when a teacher is asleep. The staff includes people who went to school in the 80s, in the 90s, and in 2017. 1990s cleanup takes 20 minutes and is very slow; they have gotten smarter now, and it takes under 3 minutes.',
  },
  {
    title: 'Layout book',
    content: 'Every teacher has a little notebook called a layout book: it records where each thing is placed, page after page of tables. Teachers use their own layout book to remember how things are arranged, so next time they put them back exactly as they were. The children have little notebooks too — but the teachers and the dogs hold and use them on the child\'s behalf.',
  },
  {
    title: 'Timekeeper hounds',
    content: 'They are called timekeeper hounds — dogs that keep watch over the time. Every hound wears a watch. It does not bite, it does not listen to the teacher, it only listens to the watch. Each hound looks after exactly one desk — whether a child or a teacher sits there, it applies. Teachers may feed them, children may not; once a hound has eaten, it resets its watch. They are all Chinese rural dogs and they all look exactly the same, which is a bit boring — it would be more fun if they differed: border collies, golden retrievers, corgis, Shiba Inus, huskies, and so on.',
  },
  {
    title: 'Class period',
    content: 'A class period is 45 minutes, which is very long — ordinary schools use 40. A dog watch is about 45 minutes too, the same length as a class, and when time is up the dog chases everyone out. If a child is chased out, the teacher reassigns seats and toys; if a teacher is chased out, someone else takes over. Cleanup now takes 3 minutes, leaving about 42 minutes for class or play; back when cleanup took 20 minutes, the dogs had to wait a long time before chasing anyone out, otherwise all the time would go to cleanup, and the children could neither study nor play.',
  },
  {
    title: 'The ink accident',
    content: 'If you spill ink, the exam papers and exercise books get dirty and the dogs chase people out too; after that the teacher cleans up. This is done so nobody steps in the ink, nobody dirties anyone else, and the teacher gets to clean up properly. If you spill it, stop your hands at once, do not wipe with your hands, step back, and tell the teacher quietly. Do not run and do not push.',
  },
  {
    title: 'Between classes',
    content: 'School is free here, so you may dismiss yourself. You must pack away your bag and your things; anything left lying around, the school will throw away. Everything must be packed and taken home, which makes the bag very heavy. You may bring books according to the timetable, clear your bag out every day, sort things into separate bags, and use light stationery.',
  },
  {
    title: 'The safe',
    content: 'The school has a safe, and inside it are maps and many other things. You may copy toys over, and nobody loses the original; you may broadcast to the whole school, and do all sorts of things. But to get anything you have to go into the trap. The trap is like a game of animal chess: everyone knows it is a trap, and still people walk into it.',
  },
  {
    title: 'The trap',
    content: 'Go into the trap and you lose your memory and automatically become a teacher; only a teacher can open the safe. It is not you — it is a proxy teacher. The teacher is very clever, and if you want to invade someone else’s privacy, the teacher will not help. Once the teacher has done everything everyone wanted done, you may turn back into a child. Once you turn back you get your memory again, but from then on you can never touch the safe again, until the next time you go into the trap.',
  },
  {
    title: 'Grades',
    content: 'Grades 1 to 4 have about the same number of children; grade 5 has very very few; grade 6 basically has none — maybe because a sixth-grader can become a teacher? Grade 1 learns math first, grade 2 learns about layout books, homework, other children, and blueprints, and grade 3 learns about the school, how to turn a blueprint into a child’s body, and smart children.',
  },
  {
    title: 'What children may do',
    content: 'On your own you can do homework and play with toys; you can find a teacher to report that you want to sleep, set an alarm, zone out until the swing frees up, tidy your bag, go home, look in the mirror, drink water, or use the toilet. With other children you can chat, pass notes, read together, build with blocks together, queue for the swing, lock the door so nobody else can get in, agree to leave together — you can also each wait for the other, and end up neither of you moving at all.',
  },
];

/**
 * Longevity genes and the elder system: why authority once belonged to the old
 * by default. A volcanic eruption brought subterranean microbes to the surface;
 * their metabolic products slow both development and ageing in a genetic
 * minority, and in agrarian / early-industrial societies that translated
 * straight into elder authority.
 */
export const elderSystemNoteEn = `Origin: an 18th-century volcanic eruption turned over microbes that had been buried deep underground. Those microbes produce a particular substance as they metabolise, and of the people exposed to it roughly 8.6% — a difference traced to their genes — are affected: both their growth and their ageing are slowed by about one sixth.

How authority formed: slower development and slower ageing together mean a much longer life. In agrarian societies and early industry, experience accumulated with time and authority accumulated with seniority, so the long-lived came to occupy the position of elder almost by default. Elder rule became the default order.

The child-labour ban: those very elders had been the slow-developing children — always scorned as useless at work, and some of their peers may even have been starved to death for being unable to keep up. Once in power they laid down the rule: children are not allowed to work.

Demographic consequence: if children may not work, raising one is extremely costly, so people chose to have far fewer. The population therefore stayed small, and its age distribution unusually even — everyone's ageing had been flattened onto the same stretched schedule.

Ebb: once society was no longer agrarian or early-industrial, experience stopped being the only scarce resource. Elder rule receded with it, and a great many young people came to power.`;

/** Order-of-magnitude intuition for model energy use: a 100T-parameter model runs a whole night on one kilowatt-hour. */
export const aiEnergyNoteEn = `Artificial intelligence: a 100T-parameter model needs only one kilowatt-hour for a whole night.

Conversion: 1 kWh = 860 kcal, taken over a 12-hour night, i.e. 860 kcal / 12h.`;

/** Combat skill table: computing-power cost versus offensive and defensive effect. */
export const combatSkillCostsEn = {
  intro: 'Numerical table for skill duels. Defensive skills spend computing power to cancel or reflect an incoming attack; offensive skills spend it to strike at a given strength.',
  defense: [
    { name: 'Coin', cost: 0, effect: 'Computing power +1' },
    { name: 'Grounding', cost: 0, effect: 'Blocks discharge, double discharge, high voltage' },
    { name: 'Mirror', cost: 1, effect: 'Reflects laser' },
    { name: 'Cage', cost: 1, effect: 'Blocks railgun' },
    { name: 'Shield', cost: 3, effect: 'Blocks discharge, double discharge, high voltage, railgun, laser' },
    { name: 'Net guard', cost: 1, effect: 'Blocks virus' },
    { name: 'Net police', cost: 2, effect: 'Reflects virus' },
    { name: 'Compute guard', cost: 3, effect: 'Blocks virus, DDOS' },
    { name: 'Super shield', cost: 5, effect: 'Blocks everything' },
  ],
  attack: [
    { name: 'Discharge', cost: 1, effect: 'Attack 1' },
    { name: 'Double discharge', cost: 2, effect: 'Attack 2' },
    { name: 'High voltage', cost: 3, effect: 'Attack 3' },
    { name: 'Laser', cost: 4, effect: 'Attack 4' },
    { name: 'Railgun', cost: 6, effect: 'Attack 4' },
    { name: 'Virus', cost: 6, effect: 'Attack 5' },
    { name: 'DDOS', cost: 8, effect: 'Attack 5' },
  ],
  rules: [
    'When you attack, you ignore any attack whose attack value is less than or equal to yours.',
    'If both attack at once, the higher attack value wins; a reflected attack loses; a blocked attack means the duel continues; an unblocked attack wins.',
    'In a multi-player duel, and only when attacking, you must name your target.',
  ],
};

/**
 * Sentencing: punishment is anchored to the total damage the offender
 * themselves expected to cause, and legislators buy leniency out of their own
 * pocket, which prices cheap sympathy out of the market.
 */
export const sentencingRuleEn = [
  {
    title: 'I. Core axiom',
    content: 'Punishment = the total damage the offender expected, in their own understanding, to cause. It holds even with no actual victim (drink driving, for instance). Attempt and completion are punished alike; the luck of the outcome does not change the sentence.',
  },
  {
    title: 'II. Real-world exceptions',
    content: 'One may depart from the axiom for the sake of a benefit — leniency for voluntary surrender, which lowers the cost of capture — but that is a utilitarian compromise, not the axiom itself.',
  },
  {
    title: 'III. Buying a lighter sentence',
    content: 'A lighter sentence is available (for minors, for instance); I consent to it but do not endorse it. The difference is paid by the legislators who voted yes, out of their own pockets; private guarantees are forbidden, or the arrangement would be unequal. Pricing: every year of sentence remitted costs one year multiplied by (the legislator’s actual annual income − the subsistence minimum). Actual income includes grey income — the more corrupt you are, the less mercy you can afford. Anyone who cannot pay enters the infinite space and works it off at the minimum wage plus statutory benefits (roughly 40,000 a year), with no interest.',
  },
  {
    title: 'IV. Divine clauses',
    content: 'Omniscience: coercion in voting is detected, the coercer is charged double, and the price is set against their actual income. Inside the infinite space, ledger time is frozen (no interest) while personal time flows (real labour, real experience).',
  },
  {
    title: 'V. Purpose',
    content: 'To give those who sincerely argue for leniency a route that needs no majority persuasion, only payment for their conviction; the price gate filters out cheap sympathy. Mercy is a subscription: it runs while you keep paying and rolls back when you stop.',
  },
];

/**
 * zam-zam (fictional condition): in a 5°C room, close your eyes —
 * if you have this condition, you can "see" through your skin.
 * An indescribable sensation that stays with you forever.
 */
export const zamZamNoteEn = `zam-zam (fictional condition): in a 5°C room, close your eyes — if you have this condition, you can "see" through your skin.

That feeling is one you never forget.`;

/**
 * Mind-ball race level (dream record): telekinetically steer a colored ball
 * through a barrier-laned world against 8 CPU balls; best-of-3, last place is out.
 */
export const mindBallRaceNoteEn = `Mind-ball race level:
Using something like a brain-wave/telekinetic grip, you steer a ball of your own — its color changes every round — through the same physical world, but a world partitioned by pull-back road barriers, from start to finish. The course is tens of meters, maybe a hundred-plus. Eight other balls are controlled by the computer, and they're all within a narrow speed band.

Format: 3 rounds. In any round, finishing last loses the whole level; only a win lets your score go on the leaderboard.

Round 1: first place. Round 2: sixth. Round 3: you zone out at the start and by the time you snap back the CPU balls are halfway in. Just as you think you've lost, someone walks over, picks up your ball, carries it past the finish line, and sets it down behind the line. So you then pick up another sky-blue ball — the same color as your own this round — and set it behind the finish line too, effectively finishing this round first twice.

Final tally: three firsts + one sixth. By that logic, the leaderboard's top spot for this level is yours.`;

/**
 * Winter-break homework & the fifth-grade guarantee: first graders hand the
 * school's handout to a 高三 "big friend" and write a 200+ character report;
 * extrapolated to sixth grade that'd be 1200 characters, except there is no
 * sixth grade — everyone who attends fifth grade gets into a 985 med school.
 */
export const winterBreakNoteEn = `First-grade winter break practical assignment: hand the school's handout to a 高三 "big friend", then write a report of at least 200 characters.

By that ratio, sixth graders should write 200 × 6 = 1200 characters — except our school doesn't have a sixth grade.

Another feature of the school: everyone who has ever attended fifth grade gets into a 985 university's medical school (or equivalent) on the gaokao. So far, without exception.`;

/**
 * The reverse-talk teacher. She described her teacher terribly,
 * and only on meeting him did I realize every word was irony. To see the
 * teacher you have to leap between two rows of stools; lying on a round
 * platform in daylight, held close, I shouted "I hate you for now!";
 * only afterward did it hit me — she hasn't started university. She's 10.
 */
export const reverseTeacherDreamNoteEn = `She introduced her teacher to me — badly — then took me to meet him. Only then did I realize: everything she'd said was irony, the exact opposite.

The setup was strange: to see the teacher, you have to leap across (see image below).

It was daytime. We were lying on a round platform, holding each other tight. I shouted at her: "I hate you for now!" She brushed the dirt off my clothes.

Near the end, I found myself wondering what year of college she was in.

In reality, she hasn't started university yet. She's 10.`;

/**
 * Swing scheduling rules: OS scheduling algorithms explained through the
 * metaphor of kids queuing for a swing at school — FIFO / SJF / STCF /
 * RR / MLFQ, plus Lottery and Stride.
 */
export const swingSchedulingNoteEn = `1. FIFO — First In First Out
Whoever arrives at the queue first plays first. The person ahead isn't done? Everyone behind just stares. One swing, one line, nothing else.
 ✅ Simplest, fairest, needs no information.
 ❌ Stand behind a big kid (who plays forever) and the whole line waits; tail-end waiters wait forever.

2. SJF — Shortest Job First
The dog doesn't care who came first; it asks "how long will you play?" Shortest self-reported time goes first. No preemption — once up, you stay till done.
 ✅ Mathematically proven minimum average turnaround time.
 ❌ Requires predicting playtime up front (in practice, guessing — one wrong guess wrecks it); long reporters may starve at the tail.

3. STCF — Shortest Time-to-Completion First
Like SJF but preemptive: the currently-playing kid can be pulled off. If a newcomer reports a shorter remaining time than yours, you step down.
 ✅ Slightly better average turnaround than SJF; near-done kids get instant response.
 ❌ Needs live "remaining time" estimates (even more fortune-telling); ongoing players get yanked repeatedly; long tasks still starve.

4. RR — Round Robin
No job length, no arrival order. Everyone gets a fixed slice (say 1 minute); the dog's watch beeps and the next kid comes up. Like musical chairs.
 ✅ Best response time — nobody feels forgotten; no predictions; no starvation.
 ❌ Context-switch cost (sitting down and standing back up takes time); picking the slice length is tricky — too short wastes effort, too long becomes FIFO.

5. MLFQ — Multi-Level Feedback Queue
The school sets up several rows of swings, each "higher" than the last. New arrivals start at the top row and get a short slice (like RR). Cut short without finishing? Drop to the next row. Stuck too long in a low row? Get promoted back up. The rules adapt to behavior; nobody has to predict anything.
 ✅ Good response and turnaround; self-tuning, no predictions; promotion prevents starvation.
 ❌ Complex: number of rows, slice length, promotion interval — tune poorly and it all falls apart; kids can game it by just barely leaving each row early to stay at the top.

The five MLFQ rules
Rule 1: Higher row always wins. If A is in a higher row than B, A plays and B waits.
Rule 2: Same row = RR. Within a row, rotate in round-robin slices.
Rule 3: New arrivals go to the top row. Everyone starts with the best treatment — the system assumes each kid will finish quickly.
Rule 4: Time quantum used up → demote. Each kid has a top-row budget (say 10 seconds total). Once spent — whether by finishing or by repeated preemption — drop to the next row. Partial slices still count; being interrupted 10 times for 1 second each still burns the budget. This blocks gamers who try to linger at the top by leaving early.
Rule 5: Periodic boost. Every interval S (say 5 minutes), everyone is promoted back to the top row. Even a very long task stuck at the bottom eventually gets another shot — no permanent starvation.

Comparison:
              Fortune-telling?   Response       Turnaround       Starves?
FIFO          No                 Luck-based     Blocked by hog   Yes
SJF           "Total time"       Short wins     Best average     Yes
STCF          "Remaining time"   Short wins     Best average     Yes
RR            No                 Best           Okay             No
MLFQ          No (auto-learned)  Good           Good             No (boosts)

Lottery Scheduling
Each kid gets lottery tickets proportional to their share. A kid with 50% share holds half the tickets. Every so often a ticket is drawn at random; the holder plays for a slice, then the next draw.
 ✅ Provably fair over the long run — each kid's number of turns matches their share; dead simple; tickets can even be lent (e.g. to a sick classmate).
 ❌ Wild in the short run — you might be drawn three times in a row, or not at all for ages; depends entirely on an honest random-number generator.

Stride Scheduling
No lottery — a race. The track's total length is fixed; each kid's stride is set by their share (big share = 10m strides, small share = 2m). The dog always sends whoever is currently farthest behind forward one step. Over time, each kid reaches the finish exactly in proportion to their share — no randomness at all.
 ✅ Precise fairness — Lottery is "roughly right", Stride is "exactly right"; nobody blames the randomizer.
 ❌ Rigid — a new transfer student forces a stride recalculation for everyone; must know the total share pool up front; hard to handle joiners/leavers.

Lottery vs Stride:
              How it decides        Fairness              Flexibility       Mood
Lottery       Random draw          Long-run true, noisy  Great (lendable)  "I hate the randomizer"
Stride        Farthest-back runs   Exact at all times    Poor (hard to add) "Strict but fair"`;

/**
 * Sacrifice one hundred million: five lottery schemes as an ethics thought
 * experiment, alongside the moral principles and paternalism critique.
 */
export const sacrificeNoteEn = `If you must sacrifice a large group of people, how do you choose?

1. Everyone is drawn at random (including children).

2. All adults are drawn at random (children exempt).

3. Children exempt; anyone may volunteer to join the sacrifice pool. Non-volunteers keep the risk from option 1; the remaining risk is spread among the pool.

4. Children exempt; anyone may opt out of the scheme. Those who exit keep the risk from option 1 (baseline preserved); the remaining risk is spread among those who stay.

5. Take the top consumers by resource consumption — but attribute consumption to whoever is paying, not whoever is using. For example, spending on your child counts against you. This incidentally protects children, since they rarely spend their own money, and never at this level.

Note: joining and exiting are not the same thing. Between the two sits a third group — people who are indifferent to life, who don't care whether they live or die. They will neither join nor exit.`;

/**
 * A cryptic ascending aphorism: from "done" down to "crawling",
 * ending on "crawling beats being dead".
 */
export const mysticSayingNoteEn = `"Done beats being, being beats non-being; flying beats running, running beats walking, walking beats crawling, crawling beats being dead."`;

/**
 * Reverse-aging law: future tech can revert a person (mind included) to a
 * child; how the law treats that. Mirror of the citizen-level system.
 */
export const reverseToChildNoteEn = `Background: future technology can revert a person (mind included) into a child.

Rules:
1. Before reverting: must pass a licensing assessment; settle all debts and lawsuits first, and sign a statute-of-limitations suspension.
2. After reverting: legally identical to a natural-born child — crimes are not prosecuted, only therapeutic correction; compensation comes out of the person's own assets; placed under guardianship; no right to revert back on their own.
3. Unlawful reverting: forcefully reversed, then prosecuted.
4. Want to revert again: reassessed on file; prior records count against you, but you may present evidence to overturn it.
5. Repeat reverting-and-offending: presumption of denial, but can be rehabilitated.`;

/**
 * Medication access principle: don't make the patient prove they're sick;
 * make the system find out. Gate the process, not the door; divert, don't just block.
 */
export const medicationAccessNoteEn = `Don't make the person asking for medication prove they have a problem — make the system find out whether they do:

1. Don't gate the entrance, gate the process. Anyone can start cheaply (initial screening, trial). Staying on the drug is decided by follow-up data, not by a single diagnosis that lasts forever.

2. Screening out isn't the end — triage is. People who are filtered out leave with somewhere to go: sleep disorders get sleep treatment, environmental problems get environmental fixes, and those who'd do nothing at least didn't take the risk for nothing.`;

/**
 * Meeting someone mid-Meltdown in the wild is handled exactly like meeting a
 * cute feral cat: don't stare, don't shout, don't turn and bolt, give space.
 */
export const meltdownFieldNoteEn = `Meeting a cute stray cat in the wild, and meeting someone mid-Meltdown in the wild — you should do the exact same thing: don't stare, don't shout, don't turn and run, and give them space.`;

/**
 * Couplet: arithmetic cannot compute wealth; logarithms and roots cannot solve poverty.
 */
export const mathCoupletNoteEn = `Add-subtract-multiply-divide cannot reckon out mortal wealth;
logs-exponents-roots-powers cannot dissolve the world's poverty.`;

/**
 * Punned saying: in one second light travels 3e8 m; optogenetics wins a Nobel.
 */
export const lightPunNoteEn = `In one second, light travels 3e8 m; optogenetics wins a scientist a Nobel Prize.`;

/**
 * Poem "Rules and Cats": learning social rules the way a cat learns human footsteps.
 */
export const rulesAndCatPoemEn = `Rules and Cats

I learn rules the way a cat learns human footsteps —
not born knowing,
but writing down every trial:
how many seconds of eye contact is right,
how far a joke may go,
when to speak,
and when silence is the polite thing.

I once had a cat.
It never wore its love on its sleeve the way a dog does.
It just lay beside the keyboard while I typed,
and on the night I broke down,
it rested a paw lightly on the back of my hand.

Later I understood:
it and I spoke the same language —
connection need not be loud,
it only needs "I am here."

If love is a dialect,
I may speak it with an accent.
But I don't ask to be corrected,
only to be understood a little.

Like a cat that doesn't explain
why it curls up in the corner,
yet is still allowed to stay in the room.`;

/**
 * Chain of beats: one bean > money > scissors > bomb > mole > terrorist >
 * rescue worker > flood > dam.
 */
export const beanChainNoteEn = `⚖️ One bean (in Zimbabwe)
  > 💰 Money
  [Purchasing power] ✅ Under hyperinflation a single bean outpowers cash; the bean buys more.

💰 Money
  > ✂️ Scissors
  [Ownership] ✅ Money buys the scissors and commands them; money beats scissors.

⚖️ Scissors (cutting the fuse)
  > 💣 Bomb
  [Cut the fuse] ✅ Scissors snip the bomb's fuse, so the bomb never goes off.

⚖️ Bomb (with fuse)
  > 🕵️ Mole
  [Demolition] ✅ The mole carries and plants the bomb; the bomb's destructive force outclasses the mole himself.

🕵️ Mole
  > 💣 Terrorist
  [Infiltration] ✅ The mole hides inside the terrorist cell and can quietly sabotage it.

💣 Terrorist
  > 🛟 Rescue worker
  [Attack suppression] ✅ Terrorists attack the rescue workers' operation, suppressing the top of the chain.

🛟 Rescue worker
  > 💧 Flood
  [Control] ✅ When the dam bursts and floods out, trained rescue workers manage the deluge effectively.

💧 Flood
  > 🏗️ Dam
  [Wear down] ✅ A sustained flood eventually overwhelms and breaches the dam, closing the loop.

Therefore: one bean > the dam.`;

/**
 * What's the ingredient list of this suffering? If society made it, fix society;
 * if nature damaged it, research repair, keep it voluntary, beware the irreversible.
 */
export const painConstitutionNoteEn = `"What is the ingredient list of this suffering?"

If the ingredients were manufactured by society, fix society. If the damage is natural, research repair, keep it voluntary, and beware the irreversible.`;

/**
 * Day-of-week pun holiday rules: why each day off or on.
 */
export const weekdayPunNoteEn = `• Monday: Monday. Monkey = Mon + key = the Monday key. Monkeys unlock their cages and escape, everyone is busy chasing them — day off.

• Tuesday: Tuesday = "too-dead day" (tǔ sǐ = rabbit-dead day). In Rabbit-Head Territory they slaughter and eat fresh rabbit heads, everyone works and eats. Other regions stay home to avoid being spiced to death.

• Wednesday: Wednesday sounds like "wen si day" — the day mosquitoes die. Perfect for camping, day off.

• Thursday: Thursday = thirsty day. In Rabbit-Head Territory the twice-cooked rabbit heads are so spicy everyone's steaming; they get a day off to rehydrate. Other regions get rain, free water, normal workday.

• Friday: Friday = fry day. Everyone gathers at school for a BBQ, workday.

• Weekend: Weekend. Work is over, day off.`;

/**
 * The nyaumæ era: not a supernova era — everyone's age is taken mod 12.
 */
export const nyaumaeEraNoteEn = `Supernova era? No — I want the nyaumæ era: everyone's age is taken modulo 12.`;

/**
 * Living arrangements: everyone has their own room, plus many shared playrooms.
 */
export const livingSpaceNoteEn = `Everyone has a room of their own; besides that there are many playrooms where you can play all sorts of things.`;

/**
 * Ten rules of fair play: no guesswork, double standards are cheating,
 * apologies require repair, betrayal is the worst, etc.
 */
export const fairnessRulesNoteEn = `• "Don't make me guess. Rules must be written down, written clearly, and changes announced in advance; penalties added on the spot are void."

• "Double standards are cheating. An adult who errs is punished the same as a child; a weaker person who lies is as guilty as a powerful one."

• "Whoever bullies me immediately loses their advantage; no comeback allowed through crying, age, status, or connections."

• "An apology must come with repair: return what was taken, fix what was broken, clarify publicly; 'sorry' alone doesn't count."

• "No humiliation. Punish if you must, but don't put me on display as a joke."

• "The strong must first prove they won't abuse their power; if they can't, the power gets scaled down."

• "Threats are taken seriously, but saying 'I hate you' doesn't mean I'm going to hit."

• "Betrayal is the worst. Leaking secrets, pretending to be on my side, then turning around and selling me out — those get the heaviest penalty."

• "No vague 'it's for your own good'. The benefit must be visible, and the harm must be acknowledged."

• "Except for police and those acting under legal duty, do not name-and-shame another person's negatives to anyone else; when seeking help from doctors, lawyers, therapists and other confidentiality-bound professionals, state only the necessary facts without naming names; a trusted acquaintance who learns something in confidence has no right to spread it."`;

/**
 * Sentencing range: actual sentence sits between the convict's inner judgment
 * and the legislator's inner judgment. The "legislator" here is the author of
 * these new rules, not the incumbent legislature.
 */
export const sentencingRangeNoteEn = `The "legislator" below means the author of these new rules, not the current legislature.

Premise: future technology can precisely infer a person's true inner judgment of what punishment is deserved; lying is useless.

A: The convict thinks — "If the legislator had committed this crime, what punishment do I think they deserve?" Get A.

B: The legislator thinks — "If I had committed this crime, what punishment do I think I deserve?" Get B.

The actual sentence for any convict is chosen somewhere in the range from A to B.`;

/**
 * How to destigmatize unchosen differences — and why "differences of thought"
 * are excluded, even though anyone who's been on psychiatric medication knows
 * that thought isn't freely chosen either.
 */
export const destigmatizationNoteEn = `How do we destigmatize all the unchosen differences between people?

There's a scope here: this definitely does not include differences of thought.

But why? Anyone who's been on psychiatric medication knows — thought isn't freely chosen either.`;

/**
 * The Parents Pay Law: non-parents pay nothing; parents pay double; accidental
 * parents are paid for by whoever made them accidental — hence free abortion.
 */
export const parentPayingLawNoteEn = `The Parents Pay Law

Article 1: Anyone who is not a parent bears no cost whatsoever.

Article 2: Parents bear double cost — their own, plus the child's.

Article 3: Whoever becomes a parent by accident — whoever caused that accident bears all the cost of both you and the child. (Which is why the state has a duty to provide free abortion.)`;

/**
 * Top-down parsing in five steps: nullable → FIRST → FOLLOW → SELECT → LL(1) table.
 */
export const ll1ParsingNoteEn = `Top-down parsing, top to bottom: ① nullable → ② FIRST → ③ FOLLOW → ④ SELECT → ⑤ LL(1) parse table.
FOLLOW(S) is initialized to { $ } at step 0, or equivalently use S' → S $.

① nullable — "Can you derive the empty string?"

② FIRST — "Which terminals can start you off?"

③ FOLLOW — "What can follow you?"

④ SELECT — "After you derive something, who comes first? If you can be empty, take the left-hand side's FOLLOW; otherwise take your FIRST."

⑤ LL(1) parse table — "Given terminal a, which production do I apply?"

If a production needs backtracking, rewrite the grammar: extract left common prefixes, or eliminate left recursion.`;

/**
 * Balanced or random: to avoid the Matthew effect, you may choose either balanced
 * or random before birth. In reality the balanced people chose it themselves;
 * the high and low scorers were random. Which do you pick?
 */
export const balanceOrRandomNoteEn = `Suppose that, to avoid the Matthew effect, you are only allowed to choose between balanced and random.

In reality, everyone who ended up balanced chose it themselves before being born; everyone who ended up high (like Eileen Gu — family, talent, drive, all three) and everyone who ended up low was drawn at random.

So — do you want balanced, or random?`;

/**
 * Child autonomy principle: if nobody has the right to do X in the first place,
 * but not doing X also costs the child something, then the right to X must be
 * granted to the child themselves.
 */
export const childAutonomyNoteEn = `If there is something (say, intervening in a child's sexual orientation) that nobody has the right to do in the first place, yet not doing it also imposes a cost on the child — then that right must be granted to the child themselves.`;
