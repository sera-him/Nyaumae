// English mirror of ./landAllocationPolicy — same structure, English text.
import type { LandPolicyBlock, LandPolicyChapter } from './landAllocationPolicy';

export const LAND_ALLOCATION_META_EN = {
  title: 'Fair Random Land Allocation System',
  edition: 'Draft for revision',
  summary: 'Premised on public ownership of land, every person holds an equal, non-tradeable weight for competing on land; applicants choose land freely, and when multiple people compete, an open, verifiable random mechanism decides the user.',
  rightsNote: 'Land-use rights and building ownership are separated. Land is not privately owned in perpetuity, but reasonable construction and long-term investment should be protected.',
  disclaimer: 'This page presents a design draft of the institution, to explain the rules and discuss the mechanism; it does not represent current policy, nor does it constitute legal advice.',
  conclusion: 'Everyone has the same capacity to choose, and decides for themselves where to invest their competition weight.',
};

export const LAND_ALLOCATION_PILLARS_EN = [
  {
    title: 'The same starting point',
    text: 'Each round, every eligible applicant holds one identical base weight; money, status and power cannot buy a higher probability.',
  },
  {
    title: 'Self-directed choice',
    text: 'Applicants decide for themselves which land to apply for and how to distribute weight; when not selected, the system cannot assign people elsewhere on its own.',
  },
  {
    title: 'Verifiable randomness',
    text: 'When competition arises on the same land, a draw is held by relative weight, with the algorithm, locked data, random seed and results published for society to recompute.',
  },
];

export const LAND_ALLOCATION_STEPS_EN = [
  { title: 'Public plots', text: 'First publish the number, location, area, use, term and all planning restrictions.' },
  { title: 'Free allocation', text: 'Everyone distributes weight totalling at most 1 across the plots they choose.' },
  { title: 'Deadline lock', text: 'After the application period ends, an immutable snapshot is generated; no party can modify it anymore.' },
  { title: 'Draw and recompute', text: 'Random allocation by relative weight, with the seed, results and logs published and independent recomputation allowed.' },
];

export const LAND_ALLOCATION_CHAPTERS_EN: LandPolicyChapter[] = [
  {
    id: 'foundation',
    number: '01',
    title: 'The Fair Starting Point',
    summary: 'First define who may participate, how land is publicized, and how much choice capacity everyone holds.',
    sections: [
      {
        id: 'basic-principles',
        number: 1,
        title: 'Basic Principles',
        lead: 'Land keeps its public character; individuals obtain a time-limited use right, and all eligible applicants start from the same base qualification.',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Land is a public resource and is not permanently privatized by personal use.',
              'Every eligible person holds exactly the same base land-application qualification.',
              'No one can buy a higher allocation probability with money, status, power or any other resource.',
              'Applicants choose the land they want to apply for; when not selected, the system must not reassign them to another city or location on its own.',
              'When several people apply for the same land, an open random draw is held by each one\'s invested weight.',
              'Different uses may adopt different area-conversion coefficients, but this cannot grant specific individuals extra weight.',
              'Land-use rights are in principle time-limited, and are not equivalent to land ownership.',
            ],
          },
        ],
      },
      {
        id: 'land-division',
        number: 2,
        title: 'Land Division and Information Disclosure',
        lead: 'Land is first divided by use into minimal units, and adjacent units may be combined into continuous plots where planning requires.',
        blocks: [
          {
            type: 'bullets',
            items: ['Urban residential land', 'Commercial land', 'Industrial land', 'Agricultural land', 'Public facility land', 'Nature protection land'],
          },
          {
            type: 'paragraph',
            text: 'Land units may be subdivided down to 1 square meter. Before each round, the land number, exact location, area, boundaries, permitted uses, term, environmental and construction restrictions, and whether individual applications are open must all be published.',
          },
          {
            type: 'paragraph',
            text: 'Public facility and nature protection land need not be open to individuals; whether and how it is opened should be decided by open public planning.',
          },
        ],
      },
      {
        id: 'equal-weight',
        number: 3,
        title: 'Uniform Individual Weight',
        lead: 'Every eligible applicant holds the same total weight each round. Whether it is written as 1, 10 or 100,000 makes no essential difference — what matters is that everyone\'s total is identical.',
        blocks: [
          { type: 'formula', math: 'W=1', caption: 'Each person holds one unit of total weight per round' },
          { type: 'formula', math: '\\sum_i w_i\\le 1', caption: 'The sum of weight allocated to all plots cannot exceed 1' },
          {
            type: 'bullets',
            items: ['Weight is not an area quota', 'Weight is not land ownership', 'Weight is not money', 'Weight is not inheritable property', 'Weight is not a tradeable asset'],
          },
          {
            type: 'paragraph',
            text: 'Unused weight in a round does not in principle carry over to the next round, nor can it be transferred to others.',
          },
        ],
      },
      {
        id: 'free-allocation',
        number: 4,
        title: 'Free Allocation of Weight',
        lead: 'Applicants may concentrate weight to compete for one plot, or spread it across many; the institution need not simply cap how many plots each person may apply for.',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: 'Concentrate', text: 'Apply for one plot: w_A = 1' },
              { label: 'Combine', text: 'Apply for three plots: w_A = 0.7, w_B = 0.2, w_C = 0.1' },
              { label: 'Spread', text: 'Apply for 1,000 plots: 0.001 each' },
            ],
          },
          {
            type: 'paragraph',
            text: 'The wider the application range, the lower the average weight per plot; the more concentrated the application, the higher the competition weight on a single plot usually is.',
          },
        ],
      },
    ],
  },
  {
    id: 'allocation',
    number: '02',
    title: 'How Allocation Happens',
    summary: 'Put land area, use and invested weight into one public rule set, then compute each plot\'s relative probability of selection.',
    sections: [
      {
        id: 'effective-area',
        number: 5,
        title: 'Area Weighting and Use Coefficients',
        lead: 'Land area should count toward application cost; different uses may adopt different coefficients, but what is obtained after selection is still the plot\'s actual area.',
        blocks: [
          { type: 'formula', math: 'A_{\\mathrm{eff}}=cA', caption: 'A is the actual area, c the use coefficient; A_eff is only used to compute competition cost' },
          {
            type: 'table',
            columns: ['Land use', 'Example coefficient'],
            rows: [
              ['Ordinary housing', '1'],
              ['Commercial', '1'],
              ['Industrial', '0.5'],
              ['Agriculture', '0.05'],
              ['Forestry', '0.02'],
              ['Ecological protection', '0.01'],
            ],
          },
          {
            type: 'paragraph',
            text: 'For example, applying for 100,000 m² of agricultural land with c = 0.05 gives a weighted area of 5,000 m²; after selection you still actually receive 100,000 m².',
          },
          { type: 'formula', math: 'w_{i,L}=r_{i,L}c_LA_L', caption: 'A uniform weight density r converts area and weight into the same rule' },
          { type: 'formula', math: '\\sum_L w_{i,L}\\le 1', caption: 'An applicant\'s weight across all plots still cannot exceed 1' },
          {
            type: 'paragraph',
            text: 'Conversion units, minimum precision and rounding rules must be announced in advance, be identical for everyone, and cannot be changed after the draw.',
          },
        ],
      },
      {
        id: 'agricultural-rules',
        number: 6,
        title: 'Special Rules for Agricultural Land',
        lead: 'A lower agricultural coefficient cannot become a channel for evading use regulation.',
        blocks: [
          {
            type: 'bullets',
            items: ['Cultivation', 'Pasture', 'Orchards', 'Agricultural facilities', 'Irrigation and soil improvement'],
          },
          {
            type: 'paragraph',
            text: 'Agricultural land can only be used for approved agricultural purposes; it cannot be converted into mansions, malls or other non-agricultural facilities after application. Changing use requires a new application and a recalculation of area and weight under the new use.',
          },
          {
            type: 'paragraph',
            text: 'Actual-use requirements should also be set to prevent long-term land banking, idling or diversion under an agricultural pretext.',
          },
        ],
      },
      {
        id: 'lottery',
        number: 7,
        title: 'How the Draw Works on the Same Land',
        lead: 'On the same plot, each person\'s selection probability depends only on their invested weight\'s share of the plot\'s total weight.',
        blocks: [
          { type: 'formula', math: 'P(i\\mid L)=\\frac{w_{i,L}}{\\sum_j w_{j,L}}', caption: 'Applicant i\'s selection probability on land L' },
          {
            type: 'paragraph',
            text: 'If A, B and C invest 0.6, 0.3 and 0.1 respectively, their selection probabilities are 60%, 30% and 10%. Weight only determines relative probability; it does not buy land and does not guarantee selection.',
          },
          {
            type: 'paragraph',
            text: 'If no one applies for a plot, it stays public and can be applied for next round. If an applicant is selected on several plots at once, whether all can be accepted should be decided by the published rules on use, area and actual use; plots that cannot or will not be accepted must be relinquished within the deadline and reopened.',
          },
        ],
      },
      {
        id: 'demand-distribution',
        number: 8,
        title: 'Popular Land and Demand Dispersion',
        lead: 'Popular plots attract more weight, which naturally lowers any single applicant\'s selection probability.',
        blocks: [
          {
            type: 'bullets',
            items: ['Concentrate weight on a few popular plots', 'Spread weight across many plots', 'Shift to less competitive surrounding areas'],
          },
          {
            type: 'paragraph',
            text: 'Public competition information can help applicants adjust choices independently and creates some demand-dispersion effect; but this mechanism cannot replace transport construction, public-service provision, urban planning or regional development policy.',
          },
        ],
      },
    ],
  },
  {
    id: 'boundaries',
    number: '03',
    title: 'The Boundaries of Weight and Rights',
    summary: 'Weight cannot enter the market, nor can the "one person, one share" limit be bypassed through nominee holdings, shell companies or building transactions.',
    sections: [
      {
        id: 'non-transferable',
        number: 9,
        title: 'Weight Is Not Tradeable',
        lead: 'Personal weight is only for one\'s own land applications and cannot become an asset.',
        blocks: [
          { type: 'bullets', items: ['Cannot be sold or bought', 'Cannot be gifted or inherited', 'Cannot be mortgaged or rented', 'Cannot be transferred by other disguised means'] },
          {
            type: 'paragraph',
            text: 'No one may pay money to have another person raise their land selection probability on their behalf.',
          },
        ],
      },
      {
        id: 'anti-nominee',
        number: 10,
        title: 'No Nominee Holdings or Rule Evasion',
        lead: 'You cannot fund a large number of nominal applicants and then actually control the land or enjoy the returns through one person.',
        blocks: [
          {
            type: 'bullets',
            items: ['Actual user', 'Source of funds', 'Corporate control relationships', 'Concentrated control by a family or organization', 'Attribution of land returns', 'Construction and operation decision power'],
          },
          {
            type: 'paragraph',
            text: 'Once false applications, nominee holdings or benefit transfer are confirmed, applications or use qualifications may be revoked and liability pursued by law. Family members applying together is not automatically illegal, but there must be a genuine joint-use relationship; kinship alone cannot be used to fabricate applicants.',
          },
        ],
      },
      {
        id: 'enterprise-weight',
        number: 11,
        title: 'Enterprises Cannot Fabricate Weight Out of Thin Air',
        lead: 'A company or other organization cannot automatically obtain a new full weight merely by completing registration.',
        blocks: [
          {
            type: 'bullets',
            items: ['Establish an independent enterprise land-allocation system', 'Have actual participants lawfully delegate part of their personal weight', 'Allocate through public public-project or industry-project mechanisms'],
          },
          {
            type: 'paragraph',
            text: 'Whichever path is taken, the "one person, one base weight" limit cannot be bypassed through companies, affiliated organizations or nominal applicants.',
          },
        ],
      },
      {
        id: 'separate-rights',
        number: 12,
        title: 'Separating Land-Use Rights from Building Ownership',
        lead: 'Obtaining land only means acquiring a time-limited land-use right; buildings and reasonable construction investment may be privately owned by the builder.',
        blocks: [
          {
            type: 'paragraph',
            text: 'When land-use rights change, buildings do not automatically pass to the new land user. Land-use rights also cannot be transferred through private sales, rentals or hidden deals to bypass open allocation.',
          },
          {
            type: 'paragraph',
            text: 'Buildings may be transferred lawfully, but the transaction cannot automatically carry the land-use right; someone buying a building must still obtain the corresponding land-use qualification.',
          },
        ],
      },
    ],
  },
  {
    id: 'continuity',
    number: '04',
    title: 'Terms and Investment Protection',
    summary: 'Land is not permanently private, but long-term construction, agricultural cycles and residual investment value all need stable, predictable protection.',
    sections: [
      {
        id: 'short-long-term',
        number: 13,
        title: 'Short-Term and Long-Term Land Use',
        lead: 'Different uses need different terms; land for long-term investment cannot be forcibly cleared every year.',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: 'Short-term', text: 'Temporary stalls, temporary parking, temporary event venues, short-term operating facilities' },
              { label: 'Long-term', text: 'Housing, industrial facilities, agricultural facilities, orchards, long-term operating premises' },
            ],
          },
          {
            type: 'table',
            columns: ['Use', 'Example term'],
            rows: [['Housing', '30 years'], ['Industrial', '20 years'], ['Ordinary agriculture', '5 to 20 years'], ['Orchards and long-term agricultural facilities', '10 to 20 years']],
          },
          {
            type: 'paragraph',
            text: 'Specific terms should be determined by law according to land use, investment cycles and public planning.',
          },
        ],
      },
      {
        id: 'long-term-agriculture',
        number: 14,
        title: 'Long-Term Use of Agricultural Land',
        lead: 'Soil improvement, orchard growth, irrigation construction and agricultural production all need stable expectations; agricultural land should not change users every year.',
        blocks: [
          {
            type: 'paragraph',
            text: 'Agricultural land should set reasonable long-term use terms based on crops, soil and facilities. When the term ends, the land re-enters the allocation system.',
          },
          {
            type: 'paragraph',
            text: 'The previous user may apply again, but past use of the plot alone does not grant permanent priority.',
          },
        ],
      },
      {
        id: 'expiry-buildings',
        number: 15,
        title: 'Term Expiry and Building Handling',
        lead: 'When a use period ends, land reallocation and construction-investment protection must be handled together.',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: 'A', text: 'The previous user reapplies and is selected, continuing to use the land.' },
              { label: 'B', text: 'After the new user obtains use rights, they buy the existing buildings at appraised value.' },
              { label: 'C', text: 'When public planning requires demolition, public agencies pay reasonable compensation based on the buildings\' residual value.' },
            ],
          },
          {
            type: 'paragraph',
            text: 'Building appraisals should be done by independent agencies, with review or appeal allowed, so reasonable investment is not taken away for nothing. When land is taken back early for public interest, reasonable compensation should also be given considering the remaining term, building value and actual investment.',
          },
        ],
      },
      {
        id: 'continuity-protection',
        number: 16,
        title: 'Continuity Protection After a Term Ends',
        lead: 'The previous user has no permanent privilege, but can get necessary transition within a clear cap.',
        blocks: [
          {
            type: 'bullets',
            items: ['Advance notice', 'A preparation period for reapplying', 'Reasonable relocation allowance', 'Protection of investment value not yet recovered', 'Transition arrangements for agricultural production cycles'],
          },
          {
            type: 'paragraph',
            text: 'Continuity protection must have a clear term, public standards and a uniform cap; it cannot evolve into de facto permanent private land ownership.',
          },
        ],
      },
    ],
  },
  {
    id: 'governance',
    number: '05',
    title: 'Application, Disclosure and Oversight',
    summary: 'Write application locking, random sources, identity verification, planning permits and appeal remedies into executable procedures.',
    sections: [
      {
        id: 'application-lock',
        number: 17,
        title: 'Application Changes and the Deadline Lock',
        lead: 'Adjustments are free during the application period; after the deadline, both rules and data are locked simultaneously.',
        blocks: [
          { type: 'bullets', items: ['Add or remove plots', 'Increase or decrease weight', 'Re-balance weight allocation'] },
          {
            type: 'paragraph',
            text: 'Before the draw, the system should generate an immutable application snapshot. After the deadline, no one — including the governing body — can unilaterally modify application contents.',
          },
        ],
      },
      {
        id: 'verifiable-draw',
        number: 18,
        title: 'Public Verifiability of the Draw',
        lead: 'The draw must not only publish results, but let outsiders independently recompute them from the same data.',
        blocks: [
          {
            type: 'bullets',
            items: ['Publish the allocation algorithm', 'Publish land numbers and anonymized application numbers', 'Publish locked weights', 'Publish the random seed and draw results', 'Allow independent recomputation by society', 'Keep complete operation logs'],
          },
          {
            type: 'paragraph',
            text: 'The random seed should come from a public random source that cannot be accurately predicted before the draw; multi-party commitment, public random numbers and independent audits may also be used to prevent a single body from manipulating results in advance. Once the algorithm, data, seed and results are published, they must not be secretly changed.',
          },
        ],
      },
      {
        id: 'privacy-audit',
        number: 19,
        title: 'Personal Privacy and Identity Audit',
        lead: 'The public needs enough information to verify the draw, but does not need to see applicants\' real identity documents.',
        blocks: [
          {
            type: 'choices',
            items: [
              { label: 'Can be public', text: 'Anonymized application numbers, land numbers, application weights, draw results, timestamps and audit records' },
              { label: 'Need not be public', text: 'Names, ID numbers, home addresses and other unnecessary personal information' },
            ],
          },
          {
            type: 'paragraph',
            text: 'Governing bodies or independent audit agencies should be able, under legal authorization, to verify "one person, one base weight" and investigate nominee holdings, duplicate registration and benefit transfer. The institution must be transparent to the public, confidential to individuals, and auditable to agencies at the same time.',
          },
        ],
      },
      {
        id: 'planning-fees',
        number: 20,
        title: 'Construction, Planning and Fees',
        lead: 'Obtaining land-use rights does not automatically grant a construction permit.',
        blocks: [
          {
            type: 'bullets',
            items: ['Urban planning', 'Environmental protection', 'Building safety', 'Public facility capacity', 'Fire and sanitation standards', 'Land-use regulations'],
          },
          {
            type: 'paragraph',
            text: 'Construction costs, infrastructure fees, maintenance costs and lawfully levied taxes may be borne under uniform rules, but they must not be used to raise the probability of winning land in the draw.',
          },
        ],
      },
      {
        id: 'violations-appeals',
        number: 21,
        title: 'Violations, Idling and Appeals',
        lead: 'Serious violations can lead to revocation of land-use rights, but revocation must follow a complete procedure.',
        blocks: [
          {
            type: 'bullets',
            items: ['False declarations', 'Illegal changes of use', 'Long-term idling or malicious land banking', 'Private rental or sale of land-use rights', 'Nominee holdings or benefit transfer', 'Serious violations of environmental, safety or planning requirements'],
          },
          {
            type: 'paragraph',
            text: 'Before revoking land, notice, investigation, hearing and appeal procedures should be fulfilled. When revocation is due to the user\'s violation, compensation may be reduced or cancelled by law; when revocation is due to public planning adjustment, reasonable compensation should follow residual value and actual investment.',
          },
        ],
      },
    ],
  },
  {
    id: 'core',
    number: '06',
    title: 'Core Mechanism',
    summary: 'The complex rules ultimately collapse into two simple mathematical constraints: everyone\'s total is identical, and the same plot is allocated randomly by relative weight.',
    sections: [
      {
        id: 'core-mechanism',
        number: 22,
        title: 'The Core Mechanism of the Institution',
        lead: 'Two formulas define the allocation itself; the remaining rules close the evasion paths and protect public interest, personal privacy and reasonable investment.',
        blocks: [
          { type: 'formula', math: '\\sum_i w_i\\le 1', caption: 'Each person holds a finite and identical total weight' },
          { type: 'formula', math: 'P(i\\mid L)=\\frac{w_{i,L}}{\\sum_j w_{j,L}}', caption: 'The same plot is allocated randomly by relative weight' },
          {
            type: 'bullets',
            items: ['Prevent agricultural-use disguise', 'Prevent enterprises from fabricating extra weight', 'Ban nominee holdings and benefit transfer', 'Protect buildings and long-term investment', 'Handle land idling', 'Balance privacy and audit', 'Ensure the draw is open and verifiable'],
          },
          {
            type: 'paragraph',
            text: 'This institution neither lets the state decide where individuals live, nor lets the rich buy the best land; it lets everyone, with equal capacity to choose, decide independently where to invest their competition weight.',
          },
        ],
      },
    ],
  },
];

function blockSearchTextEn(block: LandPolicyBlock): string {
  if (block.type === 'paragraph') return block.text;
  if (block.type === 'bullets') return block.items.join('; ');
  if (block.type === 'formula') return [block.math, block.caption].filter(Boolean).join('; ');
  if (block.type === 'table') return [block.columns.join('; '), ...block.rows.map((row) => row.join(': '))].join('; ');
  return block.items.map((item) => `${item.label}: ${item.text}`).join('; ');
}

export const LAND_ALLOCATION_SEARCH_TEXT_EN = [
  LAND_ALLOCATION_META_EN.summary,
  LAND_ALLOCATION_META_EN.rightsNote,
  LAND_ALLOCATION_META_EN.conclusion,
  ...LAND_ALLOCATION_PILLARS_EN.flatMap((pillar) => [pillar.title, pillar.text]),
  ...LAND_ALLOCATION_STEPS_EN.flatMap((step) => [step.title, step.text]),
  ...LAND_ALLOCATION_CHAPTERS_EN.flatMap((chapter) => [
    chapter.title,
    chapter.summary,
    ...chapter.sections.flatMap((section) => [
      section.title,
      section.lead,
      ...section.blocks.map(blockSearchTextEn),
    ]),
  ]),
].join('\n');
