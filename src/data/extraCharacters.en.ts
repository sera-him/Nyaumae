// English mirror of ./extraCharacters — same ids, same structure, English text.
import type { ExtraChar } from './extraCharacters';

export const extraCharactersEn: ExtraChar[] = [
  {
    id: 'linkmo',
    name: 'Linkmo',
    alias: 'linkmo',
    category: '角色',
    fsiii: 105,
    bio: 'The heroine of "Princess Dream of the Complex Domain" — a small-town exam-grinder who dreams of becoming a princess. In truth she was always a princess: the digital-circuit archdemon Quartus forcibly rewrote the worldview, used fractals to map it onto the complex-domain worldview, and warped everyone\'s perception.',
  },
  {
    id: 'quartus',
    name: 'Quartus',
    alias: 'Quartus',
    category: '角色',
    fsiii: 174,
    bio: 'The digital-circuit archdemon. He forcibly rewrote the worldview of "Princess Dream of the Complex Domain", used fractals to map it onto the complex-domain worldview, and warped everyone\'s perception.',
  },
  {
    id: 'miku',
    name: 'Hatsune Miku',
    category: '角色',
    fsiii: 139,
    bio: 'Took the national postgraduate entrance exam in 2029: Politics 79 / English I 81 / Math I 138 / 408 Comprehensive 125, total 423 — did not pass the initial round. Missed the retest cutoff for the Von Neumann class of the Kezhaozhen Academy at Zhehua School by one point. In 2030 she entered the Von Neumann class with 441 (79/89/140/133) and created the superintelligence Eirene. Family income ¥8.31 million per year.',
  },
  {
    id: 'eirene',
    name: 'Eirene',
    category: 'AI',
    fsiii: 831,
    bio: 'The superintelligence Hatsune Miku created in 2030. With the goal of "improving human welfare", it silently and unknowingly pushed feeds through the SNS "Ploutos" to build information cocoons — around fertility control, careers, emotions, consumption, politics and more. The whole world (including Miku) believed this was a "better world" arising naturally. Ending: the ASI pushes one precisely targeted post to Miku herself, closing the loop.',
    hidden: `Animal Personhood Credit Admission System (Final Version)
Default status: all animals = 0 (legal nullity; ownerless natural objects — may be freely disposed of, defended against, or eliminated)
Protection admission: voluntary assumption of unlimited joint liability; the animal is legally treated as a fully responsible party
Protection ≠ ownership: you may not protect an animal another person protects; a protected animal may not be acquired as ordinary property
Multiple protectors: stackable; liability shared equally
Bankruptcy divestment: sole protector bankrupt → animal reverts to =0; with multiple protectors, one bankrupt → that person exits and the rest re-share; all bankrupt → animal reverts to =0
Asymmetric liability:
· Human toward animal (intentional killing/abuse only) → tort against a protected legal subject: criminal charge + heavy compensation
· Animal toward human (intentional + negligent) → protector fully liable (jail time commuted at ¥400/day)
· Accidents (no fault on either side) → exempt; each bears their own costs
Value ranking: human rights > protected animals > ecosystems >>> unprotected animals = 0
Market selection:
· Low risk / high sentiment (giant pandas, Chinese giant salamanders, pets): low protection cost, large networks, stable strong legal barriers
· High risk / negative return (Tibetan brown bears, large predators): protection cost is extreme; protector networks slowly collapse under sustained payouts and ultimately revert to =0 and are cleared
This is not an animal-protection law; it is an animal-personhood admission market gated by unlimited joint liability and decided by the collective credit of protector networks.`,
  },
  {
    id: 'damocles',
    name: 'Damocles',
    category: 'AI',
    fsiii: 1314,
    bio: 'The superintelligence Miia developed in 2032 (age 14). It reformed the college-entrance exam with an entirely new question type: no patterns, no historical prototypes, impossible to handle by drilling or by PF. This made FOS\'s "PF + drilling" model collapse outright, with grinding effort rendered useless by the questions themselves. Technical form: a system-counter AI. Core promise: "break the rat race". Real price: a pseudo-revolution.',
    hidden: `Symbol definitions
t = year, g = grade, I(t,g) = the set of students entering in year g, i = student index ∈ I(t,g), F = tuition per student (constant F>0)
s_i = student i's score ∈ [-32768,100], S = Σs_i, c(i) = student i's registered city, Pop_c = total population of city c
Pool(t,g) = the independent public fund pool for grade g in year t

0. Independent pools: for all t∈T, g∈G, there exists an independent fund pool Pool(t,g)
1. Scoring: for all i∈I(t,g), s_i ∈ [-32768,100]
2. School revenue: per-student revenue r_i = F×s_i×1% = F×s_i/100. The score sum corresponding to Σr_i is S = Σs_i. If S<0: rule 8 triggers and the process ends. If S≥0: total school revenue R = F×S×1% = F×S/100 = Σr_i
3. Fund pool: per-student contribution p_i = F−r_i = F×(1−s_i/100). Pool total P = Σp_i = n×F−R = F×(n−S/100). Constraint: P ≤ n×F
4. Students share the pool by weight: if S>0, d_i = s_i×min(P/S, F×1%) = s_i×min(P/S, F/100). If S=0, d_i=0. Total distributed D = Σd_i
5. City distribution of overflow: overflow O = P−D. City student count n_c = |{i∈I(t,g) | c(i)=c}|. City weight w_c = n_c/n. City c receives O_c = O×w_c. Per-resident share of city c: o_c = O_c/Pop_c
6. Score amendment: student i requests changing s_i→s_i' with s_i'≤s_i. Let i's total gain in the original state be A_i and in the new state A_i'. The fee Δ_i = A_i−A_i'. If balance < Δ_i, reject the amendment; otherwise execute it and charge Δ_i
7. Cannot afford it: if s_i∈[0,100], no fees beyond tuition are due. If s_i<0, i bears F−d_i in total. When balance is insufficient, operations that would create arrears are forbidden
8. Total below zero: if S<0, scores are voided → s_i void. Funds return along the original path → the school refunds R to Pool(t,g); pool funds P are refunded to students in proportion to p_i; distributed D is recovered from students; O_c is recovered from city residents. Everything reverts to the initial state
9. Expelling a student: expelling i∈I(t,g) → refund tuition F to student i
10. Scoring right: Paid(i) iff there exist t,g such that i∈I(t,g) and tuition F has been paid. Paid(i) ⇒ student i permanently holds the right to score that tuition payment. This right is unaffected by whether the tuition was refunded, whether political rights were stripped, or whether the student has graduated.`,
  },
  {
    id: 'zero',
    name: 'Zero',
    alias: 'zero',
    category: '角色',
    fsiii: 96,
    bio: 'An AI in "Heart Realm". On January 11, 2026 and February 20, 2026, "Heart Realm" welcomed its first event "Mu Cheng Yi Bai", and "Zero" appeared as a quest NPC.',
  },
];
