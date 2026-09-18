import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Fish,
  HelpCircle,
  Lightbulb,
  PawPrint,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import './CatMachine.css';
import { removeStorageValue, writeJsonStorage } from '@/lib/browserStorage';
import type {
  Need,
  Phase,
  SoundKind,
  Cat,
  MachineModule,
  RoundEvent,
  RoundResult,
  SavedProgress,
} from './catMachineModel';
import {
  MODULE_INTERVAL,
  SAVE_KEY,
  NEED_ORDER,
  NEEDS,
  EVENTS,
  MODULES,
  createInitialCats,
  moduleLevel,
  levelThreshold,
  getShopLevel,
  loadSavedProgress,
  restoreCats,
  areAdjacent,
  simpleLayoutValue,
  getRank,
} from './catMachineModel';

/* ─── English overrides for model content (used only when locale is en) ─── */

const NEEDS_EN: Record<Need, { label: string; station: string; short: string }> = {
  snack: { label: 'wants fish', station: 'Feeding Bay', short: 'fish' },
  play: { label: 'wants play', station: 'Play Bay', short: 'play' },
  nap: { label: 'wants nap', station: 'Box Bay', short: 'nap' },
};

const CATS_EN: Record<string, { name: string; traitName: string; traitText: string }> = {
  'ju-bao': { name: 'Marmalade', traitName: 'Share a bite', traitText: 'When content at the Feeding Bay, each satisfied left/right neighbor adds +2 purr.' },
  'mo-mo': { name: 'Inky', traitName: 'Night patrol', traitText: 'Content, and when the three cats in a column all want different things, +4 purr.' },
  'nai-tang': { name: 'Taffy', traitName: 'Snuggles', traitText: 'Content with a satisfied neighbor beside it, +3 purr.' },
  'hua-juan': { name: 'Swirl', traitName: 'Calico', traitText: 'Content, and when the three cats on a floor all want different things, +4 purr.' },
  'dou-bao': { name: 'Doubao', traitName: 'Zoomies', traitText: 'Content at the Play Bay, +4 purr.' },
  'tuan-zhang': { name: 'Captain', traitName: 'Box bully', traitText: 'Content at the Box Bay, +4 purr.' },
  'bai-wa': { name: 'Socks', traitName: 'Edge seat', traitText: 'Content and sitting at the left or right end of a floor, +2 purr.' },
  'zhi-ma': { name: 'Sesame', traitName: 'Lucky', traitText: 'Content always adds at least +1 purr; every fourth time it lands on the lucky seat, +6.' },
  'bu-ding': { name: 'Pudding', traitName: 'Choir', traitText: 'Content, and when the whole floor of three is satisfied, +4 purr.' },
};

const EVENTS_EN: Record<string, { name: string; description: string }> = {
  sunbeam: { name: 'Afternoon sun', description: 'Warm boxes are best: each satisfied napping cat +2 purr.' },
  'paper-bag': { name: 'Paper bag drop', description: 'The paper bag smells like fish: each satisfied fish cat +2 purr.' },
  'moth-party': { name: 'Moth convention', description: 'Eyes everywhere: each satisfied playing cat +2 purr.' },
  'cat-live': { name: 'Cat livestream', description: 'Viewers love neat rows: each perfect floor +4 purr.' },
  'window-rain': { name: 'Window rain', description: 'End seats feel cozier: each satisfied edge cat +2 purr.' },
  'treat-day': { name: 'Treat payday', description: 'Each perfect floor brings back 1 extra fish snack.' },
  robot: { name: 'Robovac on the prowl', description: 'Chase time: each satisfied playing cat +3 purr.' },
  'quiet-hour': { name: 'Late-night quiet', description: 'Purrs ring clearer: each perfect floor +5 purr.' },
};

const MODULES_EN: Record<string, { name: string; description: string }> = {
  'snack-press': { name: 'Treat press', description: 'Each satisfied fish cat +2 purr.' },
  'laser-prism': { name: 'Laser prism', description: 'Each satisfied playing cat +2 purr.' },
  'warm-box': { name: 'Heated box', description: 'Each satisfied napping cat +2 purr.' },
  'purr-amp': { name: 'Purr amplifier', description: 'Each perfect floor +4 purr.' },
  'buddy-radar': { name: 'Snuggle radar', description: 'Each adjacent satisfied pair +2 purr.' },
  'paw-cache': { name: 'Paw cache', description: 'Each unused move at bell time +3 purr.' },
  'gold-polish': { name: 'Gold ball polisher', description: 'Gold purr multiplier starts at ×1.5, +0.15 per level (Lv1=×1.65, Lv2=×1.8, cap Lv6).' },
  'fish-bank': { name: 'Fish stash bank', description: 'Each perfect floor earns 1 extra fish snack.' },
  'treat-drawer': { name: 'Treat drawer', description: 'Buying an extra paw only costs 2 fish snacks.' },
};

export default function CatMachine() {
  const _en = getLocale() === 'en';
  const needLabel = (n: Need) => (_en ? NEEDS_EN[n].label : NEEDS[n].label);
  const needStation = (n: Need) => (_en ? NEEDS_EN[n].station : NEEDS[n].station);
  const needShort = (n: Need) => (_en ? NEEDS_EN[n].short : NEEDS[n].short);
  const catName = (c: Cat) => (_en ? (CATS_EN[c.id]?.name ?? c.name) : c.name);
  const catTraitName = (c: Cat) => (_en ? (CATS_EN[c.id]?.traitName ?? c.traitName) : c.traitName);
  const catTraitText = (c: Cat) => (_en ? (CATS_EN[c.id]?.traitText ?? c.traitText) : c.traitText);
  const eventName = (e: RoundEvent) => (_en ? (EVENTS_EN[e.id]?.name ?? e.name) : e.name);
  const eventDesc = (e: RoundEvent) => (_en ? (EVENTS_EN[e.id]?.description ?? e.description) : e.description);
  const moduleName = (m: MachineModule) => (_en ? (MODULES_EN[m.id]?.name ?? m.name) : m.name);
  const moduleDesc = (m: MachineModule) => (_en ? (MODULES_EN[m.id]?.description ?? m.description) : m.description);

  const [initialSave] = useState(loadSavedProgress);
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(initialSave?.round ?? 1);
  const [cats, setCats] = useState<Cat[]>(() => restoreCats(initialSave));
  const [stations, setStations] = useState<Need[]>(initialSave?.stations ?? ['snack', 'play', 'nap']);
  const [movesLeft, setMovesLeft] = useState(2);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [score, setScore] = useState((initialSave?.score ?? 0) + (initialSave?.offlineGain ?? 0));
  const [fish, setFish] = useState(initialSave?.fish ?? 4);
  const [energy, setEnergy] = useState(initialSave?.energy ?? 0);
  const [goldArmed, setGoldArmed] = useState(false);
  const [streak, setStreak] = useState(initialSave?.streak ?? 0);
  const [modules, setModules] = useState<MachineModule[]>(() => (
    initialSave?.moduleIds
      .map((id) => MODULES.find((module) => module.id === id))
      .filter((module): module is MachineModule => Boolean(module)) ?? []
  ));
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [highlightedCats, setHighlightedCats] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [extraMoveBought, setExtraMoveBought] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(Boolean(initialSave));
  const [offlineNotice, setOfflineNotice] = useState(initialSave?.offlineGain ?? 0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const resolutionTimersRef = useRef<number[]>([]);

  const event = EVENTS[((round - 1) * 5) % EVENTS.length];
  const isArrangePhase = phase === 'arrange';
  const treatDrawerLevel = moduleLevel(modules, 'treat-drawer');
  const extraMovePrice = Math.max(1, 4 - treatDrawerLevel);
  const goldReady = energy >= 100;
  const shopLevel = getShopLevel(score);
  const currentRank = getRank(shopLevel);
  const nextLevelScore = levelThreshold(shopLevel + 1);
  const currentLevelScore = levelThreshold(shopLevel);
  const levelProgress = Math.min(100, ((score - currentLevelScore) / Math.max(1, nextLevelScore - currentLevelScore)) * 100);
  const shiftsUntilModule = MODULE_INTERVAL - ((round - 1) % MODULE_INTERVAL);

  const upgradeChoices = useMemo(() => {
    const offset = (round * 2 + modules.length * 3) % MODULES.length;
    return [0, 1, 2].map((step) => MODULES[(offset + step * 2) % MODULES.length]);
  }, [modules, round]);

  const installedModules = useMemo(() => (
    MODULES
      .map((module) => ({ module, level: moduleLevel(modules, module.id) }))
      .filter(({ level }) => level > 0)
  ), [modules]);

  const validSwapIndices = useMemo(() => {
    if (selectedCat === null) return new Set<number>();
    return new Set(cats.map((_, index) => index).filter((index) => areAdjacent(selectedCat, index)));
  }, [cats, selectedCat]);

  const playSound = useCallback((kind: SoundKind) => {
    if (!soundOn) return;
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      if (context.state === 'suspended') void context.resume();

      const notes: Record<SoundKind, number[]> = {
        tap: [420],
        swap: [360, 520],
        lever: [180, 240, 320],
        score: [520, 660, 820],
        gold: [440, 660, 880, 1100],
      };
      notes[kind].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.07;
        oscillator.type = kind === 'gold' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.15);
      });
    } catch {
      // Audio is optional; the full game remains playable if Web Audio is unavailable.
    }
  }, [soundOn]);

  useEffect(() => () => {
    resolutionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    if (audioContextRef.current) void audioContextRef.current.close();
  }, []);

  useEffect(() => {
    if (phase === 'intro' || phase === 'resolving') return;
    const progress: SavedProgress = {
      version: 1,
      savedAt: Date.now(),
      round,
      cats: cats.map((cat) => ({ id: cat.id, need: cat.need })),
      stations,
      score,
      fish,
      energy,
      streak,
      moduleIds: modules.map((module) => module.id),
    };
    const saved = writeJsonStorage(SAVE_KEY, progress).persisted;
    if (!saved) return;
    const savedTimer = window.setTimeout(() => setHasSavedProgress(true), 0);
    return () => window.clearTimeout(savedTimer);
  }, [cats, energy, fish, modules, phase, round, score, stations, streak]);

  const changeStation = (row: number, need: Need) => {
    if (!isArrangePhase || movesLeft <= 0 || stations[row] === need) return;
    setStations((current) => current.map((station, index) => (index === row ? need : station)));
    setMovesLeft((moves) => moves - 1);
    setSelectedCat(null);
    setHint(null);
    playSound('tap');
  };

  const selectOrSwapCat = (index: number) => {
    if (!isArrangePhase || movesLeft <= 0) return;
    if (selectedCat === null) {
      setSelectedCat(index);
      playSound('tap');
      return;
    }
    if (selectedCat === index) {
      setSelectedCat(null);
      return;
    }
    if (!areAdjacent(selectedCat, index)) {
      setSelectedCat(index);
      playSound('tap');
      return;
    }

    setCats((current) => {
      const next = [...current];
      [next[selectedCat], next[index]] = [next[index], next[selectedCat]];
      return next;
    });
    setMovesLeft((moves) => moves - 1);
    setSelectedCat(null);
    setHint(null);
    playSound('swap');
  };

  const buyExtraMove = () => {
    if (!isArrangePhase || extraMoveBought || fish < extraMovePrice) return;
    setFish((value) => value - extraMovePrice);
    setMovesLeft((moves) => moves + 1);
    setExtraMoveBought(true);
    playSound('swap');
  };

  const revealHint = () => {
    if (!isArrangePhase) return;

    if (goldReady && !goldArmed) {
      setHint(_en
        ? 'The gold ball is fully charged. Light it up and ring the bell to multiply this shift\'s total purr.'
        : '金色毛球已经充满。点亮它，再摇铃可以把这一班的总呼噜放大。');
      playSound('tap');
      return;
    }

    let bestStationGain = 0;
    let bestStationRow = 0;
    let bestStationNeed: Need = stations[0];

    for (let row = 0; row < 3; row += 1) {
      const currentMatches = cats.slice(row * 3, row * 3 + 3).filter((cat) => cat.need === stations[row]).length;
      NEED_ORDER.forEach((need) => {
        const matches = cats.slice(row * 3, row * 3 + 3).filter((cat) => cat.need === need).length;
        if (matches - currentMatches > bestStationGain) {
          bestStationGain = matches - currentMatches;
          bestStationRow = row;
          bestStationNeed = need;
        }
      });
    }

    if (bestStationGain > 0) {
      setHint(_en
        ? `Switch floor ${bestStationRow + 1} to "${needStation(bestStationNeed)}" to immediately please ${bestStationGain} more cat(s).`
        : `把第 ${bestStationRow + 1} 层改成“${NEEDS[bestStationNeed].station}”，会立刻多照顾 ${bestStationGain} 只猫。`);
      playSound('tap');
      return;
    }

    const currentValue = simpleLayoutValue(cats, stations);
    let bestSwap: [number, number] | null = null;
    let bestSwapValue = currentValue;
    for (let a = 0; a < cats.length; a += 1) {
      for (let b = a + 1; b < cats.length; b += 1) {
        if (!areAdjacent(a, b)) continue;
        const trial = [...cats];
        [trial[a], trial[b]] = [trial[b], trial[a]];
        const value = simpleLayoutValue(trial, stations);
        if (value > bestSwapValue) {
          bestSwapValue = value;
          bestSwap = [a, b];
        }
      }
    }

    if (bestSwap) {
      setHint(_en
        ? `Try swapping "${catName(cats[bestSwap[0]])}" and "${catName(cats[bestSwap[1]])}" to build a longer purr chain.`
        : `试试交换“${cats[bestSwap[0]].name}”和“${cats[bestSwap[1]].name}”，有机会拼出更长的呼噜连锁。`);
    } else if (movesLeft > 0) {
      setHint(_en
        ? 'The layout already works. Keep paws in reserve so modules like Paw Cache can convert them into points later.'
        : '现在的站位已经很顺。可以保留猫爪，让“软爪缓存”类模块在以后把余量变成分数。');
    } else {
      setHint(_en
        ? 'This shift is set. Ring the bell and see which traits the cats trigger.'
        : '本班已经安排完毕，摇铃看看猫咪们会触发哪些天赋吧。');
    }
    playSound('tap');
  };

  const calculateRoundResult = (): RoundResult => {
    const matchedIndices = cats
      .map((cat, index) => (cat.need === stations[Math.floor(index / 3)] ? index : -1))
      .filter((index) => index >= 0);
    const matched = new Set(matchedIndices);
    const perfectRows = [0, 1, 2].filter((row) => [0, 1, 2].every((col) => matched.has(row * 3 + col)));
    const matches = matchedIndices.length;
    const base = matches * 4;

    let traitBonus = 0;
    cats.forEach((cat, index) => {
      if (!matched.has(index)) return;
      const row = Math.floor(index / 3);
      const col = index % 3;
      const leftMatched = col > 0 && matched.has(index - 1);
      const rightMatched = col < 2 && matched.has(index + 1);

      switch (cat.trait) {
        case 'share':
          if (cat.need === 'snack') traitBonus += Number(leftMatched) * 2 + Number(rightMatched) * 2;
          break;
        case 'night': {
          const columnNeeds = new Set([cats[col].need, cats[col + 3].need, cats[col + 6].need]);
          if (columnNeeds.size === 3) traitBonus += 4;
          break;
        }
        case 'cuddle':
          if (leftMatched || rightMatched) traitBonus += 3;
          break;
        case 'rainbow': {
          const rowNeeds = new Set(cats.slice(row * 3, row * 3 + 3).map((rowCat) => rowCat.need));
          if (rowNeeds.size === 3) traitBonus += 4;
          break;
        }
        case 'zoom':
          if (cat.need === 'play') traitBonus += 4;
          break;
        case 'box':
          if (cat.need === 'nap') traitBonus += 4;
          break;
        case 'socks':
          if (col === 0 || col === 2) traitBonus += 2;
          break;
        case 'lucky':
          traitBonus += (round + index) % 4 === 0 ? 6 : 1;
          break;
        case 'choir':
          if (perfectRows.includes(row)) traitBonus += 4;
          break;
      }
    });

    const nextStreak = perfectRows.length > 0 ? streak + 1 : 0;
    const harmonyBonus = new Set(stations).size === 3 && matches >= 5 ? 5 : 0;
    const rowBonus = perfectRows.length * 8 + Math.min(nextStreak, 4) * 2 + harmonyBonus;

    let moduleBonus = 0;
    moduleBonus += matchedIndices.filter((index) => cats[index].need === 'snack').length * 2 * moduleLevel(modules, 'snack-press');
    moduleBonus += matchedIndices.filter((index) => cats[index].need === 'play').length * 2 * moduleLevel(modules, 'laser-prism');
    moduleBonus += matchedIndices.filter((index) => cats[index].need === 'nap').length * 2 * moduleLevel(modules, 'warm-box');
    moduleBonus += perfectRows.length * 4 * moduleLevel(modules, 'purr-amp');
    moduleBonus += movesLeft * 3 * moduleLevel(modules, 'paw-cache');
    const buddyRadarLevel = moduleLevel(modules, 'buddy-radar');
    if (buddyRadarLevel > 0) {
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 2; col += 1) {
          const index = row * 3 + col;
          if (matched.has(index) && matched.has(index + 1)) moduleBonus += 2 * buddyRadarLevel;
        }
      }
    }

    let eventBonus = 0;
    if (event.featuredNeed && event.scorePerMatch) {
      eventBonus += matchedIndices.filter((index) => cats[index].need === event.featuredNeed).length * event.scorePerMatch;
    }
    if (event.perfectRowBonus) eventBonus += perfectRows.length * event.perfectRowBonus;
    if (event.edgeBonus) {
      eventBonus += matchedIndices.filter((index) => index % 3 === 0 || index % 3 === 2).length * event.edgeBonus;
    }

    const rawTotal = base + traitBonus + rowBonus + moduleBonus + eventBonus;
    const growthMultiplier = 1 + (shopLevel - 1) * 0.08;
    const grownTotal = Math.round(rawTotal * growthMultiplier);
    const growthBonus = grownTotal - rawTotal;
    const goldPolishLevel = moduleLevel(modules, 'gold-polish');
    const goldMultiplier = goldArmed ? 1.5 + Math.min(goldPolishLevel, 6) * 0.15 : 1;
    const total = Math.round(grownTotal * goldMultiplier);
    const goldBonus = total - grownTotal;
    const fishEarned = perfectRows.length * 2
      + (matches >= 7 ? 1 : 0)
      + (event.fishPerPerfect ?? 0) * perfectRows.length
      + moduleLevel(modules, 'fish-bank') * perfectRows.length;
    const energyGain = matches * 9 + perfectRows.length * 10;

    let headline = _en ? 'A few cats are still waiting for the right station' : '有几只猫还在等合适的工位';
    if (perfectRows.length >= 3) headline = _en ? 'Full-house chorus! The Cat Machine is boiling over' : '全楼大合唱！猫咪机彻底沸腾';
    else if (perfectRows.length === 2) headline = _en ? 'Two floors ringing, purring like a waterfall' : '两层连响，呼噜像瀑布一样';
    else if (perfectRows.length === 1) headline = _en ? 'Perfect floor! The chain is underway' : '完美整层！连锁已经启动';
    else if (matches >= 6) headline = _en ? 'Well tended; go for a full floor next shift' : '照顾得很稳，下一班冲整层';

    return {
      total,
      rawTotal,
      growthBonus,
      base,
      traitBonus,
      rowBonus,
      moduleBonus,
      eventBonus,
      goldBonus,
      fishEarned,
      energyGain,
      matches,
      perfectRows,
      matchedIndices,
      nextStreak,
      headline,
    };
  };

  const resolveRound = () => {
    if (!isArrangePhase) return;
    const result = calculateRoundResult();
    setSelectedCat(null);
    setRoundResult(result);
    setPhase('resolving');
    playSound('lever');

    const highlightTimer = window.setTimeout(() => {
      setHighlightedCats(result.matchedIndices);
    }, 260);
    const resultTimer = window.setTimeout(() => {
      setScore((value) => value + result.total);
      setFish((value) => value + result.fishEarned);
      setStreak(result.nextStreak);
      setEnergy((value) => {
        const startingEnergy = goldArmed ? 0 : value;
        return Math.min(100, startingEnergy + result.energyGain);
      });
      setGoldArmed(false);
      setPhase('result');
      playSound(result.goldBonus > 0 ? 'gold' : 'score');
    }, 1050);
    resolutionTimersRef.current.push(highlightTimer, resultTimer);
  };

  const prepareNextRound = () => {
    const departingRound = round;
    setRound((value) => value + 1);
    setCats((current) => {
      const next = current.map((cat, index) => {
        const currentNeedIndex = NEED_ORDER.indexOf(cat.need);
        const step = 1 + ((departingRound + index) % 2);
        return { ...cat, need: NEED_ORDER[(currentNeedIndex + step) % NEED_ORDER.length] };
      });
      const first = (departingRound * 2) % next.length;
      const second = (departingRound * 5 + 1) % next.length;
      [next[first], next[second]] = [next[second], next[first]];
      return next;
    });
    setStations((current) => (
      departingRound % 2 === 0
        ? [current[2], current[0], current[1]]
        : current
    ));
    setMovesLeft(2);
    setSelectedCat(null);
    setHighlightedCats([]);
    setRoundResult(null);
    setHint(null);
    setExtraMoveBought(false);
    setPhase('arrange');
  };

  const continueAfterResult = () => {
    if (round % MODULE_INTERVAL === 0) {
      setPhase('upgrade');
      return;
    }
    prepareNextRound();
  };

  const chooseModule = (module: MachineModule) => {
    setModules((current) => [...current, module]);
    playSound('gold');
    prepareNextRound();
  };

  const resetProgress = () => {
    if (!window.confirm(_en
      ? 'Reset all Cat Machine progress on this device? Shop level, modules and total purr will be wiped.'
      : '确定清空这台设备上的猫咪机进度吗？店铺等级、模块和累计呼噜都会归零。')) return;
    resolutionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    resolutionTimersRef.current = [];
    removeStorageValue(SAVE_KEY);
    removeStorageValue('cat-machine:best-score');
    setRound(1);
    setCats(createInitialCats());
    setStations(['snack', 'play', 'nap']);
    setMovesLeft(2);
    setSelectedCat(null);
    setScore(0);
    setFish(4);
    setEnergy(0);
    setGoldArmed(false);
    setStreak(0);
    setModules([]);
    setRoundResult(null);
    setHighlightedCats([]);
    setHint(null);
    setExtraMoveBought(false);
    setOfflineNotice(0);
    setHasSavedProgress(false);
    setShowGuide(false);
    setPhase('intro');
    playSound('lever');
  };

  const startGame = () => {
    setOfflineNotice(0);
    setPhase('arrange');
    playSound('gold');
  };

  return (
    <section className="cat-machine" data-phase={phase} aria-label={L("猫咪机游戏")}>
      <div className="cm-ambient cm-ambient-one" aria-hidden="true" />
      <div className="cm-ambient cm-ambient-two" aria-hidden="true" />

      <header className="cm-titlebar">
        <div className="cm-brand">
          <div className="cm-brand-mark" aria-hidden="true">
            <span>{L("猫")}</span>
            <i />
          </div>
          <div>
            <p>CAT-O-MATIC · NIGHT SHIFT</p>
            <h2>{L("猫咪机")}</h2>
            <span>{L("把九只猫送进刚刚好的工位")}</span>
          </div>
        </div>
        <div className="cm-header-actions">
          <button type="button" onClick={() => setShowGuide(true)} aria-label={L("打开玩法说明")}>
            <HelpCircle />
            <span>{L("玩法")}</span>
          </button>
          <button type="button" onClick={() => setSoundOn((value) => !value)} aria-label={_en ? (soundOn ? 'Turn off sound' : 'Turn on sound') : (soundOn ? '关闭音效' : '开启音效')}>
            {soundOn ? <Volume2 /> : <VolumeX />}
            <span>{_en ? (soundOn ? 'Sound on' : 'Muted') : (soundOn ? '有声' : '静音')}</span>
          </button>
        </div>
      </header>

      <div className="cm-scoreboard">
        <div className="cm-shift-counter" aria-label={L(`当前第 ${round} 班，无限营业`)}>
          <span className="cm-kicker">{L("无限营业中")}</span>
          <strong>SHIFT {String(round).padStart(2, '0')}</strong>
          <small>{L("再过 ")}{shiftsUntilModule} {L("班选模块")}</small>
        </div>
        <div className="cm-score-stat">
          <span>{L("累计呼噜")}</span>
          <strong>{score}</strong>
          <small>{L("永久保留")}</small>
        </div>
        <div className="cm-rank-stat">
          <span>{currentRank.icon}</span>
          <div>
            <small>{L("店铺 Lv.")}{shopLevel}</small>
            <strong>{_en ? (shopLevel >= 20 ? `Infinite Cat Tower · ${shopLevel}F` : shopLevel >= 12 ? 'Legendary cat manager' : shopLevel >= 7 ? 'Gold meowster' : shopLevel >= 4 ? 'Skilled clerk' : shopLevel >= 2 ? 'Reliable helper' : 'Trainee scooper') : currentRank.name}</strong>
          </div>
        </div>
        <div className="cm-fish-stat">
          <Fish />
          <div>
            <small>{L("鱼干")}</small>
            <strong>{fish}</strong>
          </div>
        </div>
        <button
          type="button"
          className={`cm-gold-meter ${goldReady ? 'is-ready' : ''} ${goldArmed ? 'is-armed' : ''}`}
          onClick={() => {
            if (!goldReady || !isArrangePhase) return;
            setGoldArmed((value) => !value);
            playSound('gold');
          }}
          disabled={!goldReady || !isArrangePhase}
          aria-label={_en
            ? (goldReady ? (goldArmed ? 'Cancel gold ball release' : 'Release the gold ball') : `Gold ball energy ${energy}%`)
            : (goldReady ? (goldArmed ? '取消释放金色毛球' : '释放金色毛球') : `金色毛球能量 ${energy}%`)}
        >
          <span className="cm-gold-orb"><Sparkles /></span>
          <span className="cm-gold-copy">
            <small>{_en ? (goldArmed ? 'Lit this shift' : goldReady ? 'Click to release' : 'Gold ball') : (goldArmed ? '本班已点亮' : goldReady ? '点击释放' : '金色毛球')}</small>
            <strong>{goldReady ? (_en ? (goldArmed ? '× Gold purr' : 'READY') : (goldArmed ? '× 金色呼噜' : 'READY')) : `${energy}%`}</strong>
          </span>
          <span className="cm-meter-track"><i style={{ width: `${energy}%` }} /></span>
        </button>
      </div>

      <div className="cm-event-banner">
        <span className="cm-event-icon" aria-hidden="true">{event.icon}</span>
        <div>
          <small>{L("本班突发状况 · SHIFT ")}{String(round).padStart(2, '0')}</small>
          <strong>{eventName(event)}</strong>
        </div>
        <p>{eventDesc(event)}</p>
      </div>

      <div className="cm-main-layout">
        <div className="cm-cabinet">
          <div className="cm-cabinet-marquee" aria-hidden="true">
            <span />
            <p>MEOW SERVICE MATRIX</p>
            <span />
          </div>

          <div className="cm-board" aria-label={L("三层猫咪工位")}>
            {[0, 1, 2].map((row) => {
              const rowMatches = cats
                .slice(row * 3, row * 3 + 3)
                .filter((cat) => cat.need === stations[row]).length;
              return (
                <div className="cm-board-row" key={row}>
                  <div className="cm-station-panel">
                    <div className="cm-row-label">
                      <span>0{row + 1}F</span>
                      <strong>{needStation(stations[row])}</strong>
                      <small>{rowMatches}{L("/3 对味")}</small>
                    </div>
                    <div className="cm-station-switcher" role="group" aria-label={L(`第 ${row + 1} 层工位类型`)}>
                      {NEED_ORDER.map((need) => (
                        <button
                          type="button"
                          key={need}
                          className={stations[row] === need ? 'is-active' : ''}
                          onClick={() => changeStation(row, need)}
                          disabled={!isArrangePhase || movesLeft <= 0 || stations[row] === need}
                          aria-label={L(`把第 ${row + 1} 层改成${NEEDS[need].station}`)}
                          aria-pressed={stations[row] === need}
                        >
                          <span>{NEEDS[need].icon}</span>
                          <small>{needShort(need)}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cm-cat-row">
                    {cats.slice(row * 3, row * 3 + 3).map((cat, column) => {
                      const index = row * 3 + column;
                      const selected = selectedCat === index;
                      const canSwap = validSwapIndices.has(index);
                      const matched = highlightedCats.includes(index);
                      return (
                        <motion.button
                          layout
                          type="button"
                          key={cat.id}
                          className={`cm-cat-card coat-${cat.coat} ${selected ? 'is-selected' : ''} ${canSwap ? 'can-swap' : ''} ${matched ? 'is-happy' : ''}`}
                          onClick={() => selectOrSwapCat(index)}
                          disabled={!isArrangePhase || movesLeft <= 0}
                          title={`${catTraitName(cat)}: ${catTraitText(cat)}`}
                          aria-label={L(`${cat.name}，${NEEDS[cat.need].label}。天赋${cat.traitName}：${cat.traitText}${selected ? '，已选中' : canSwap ? '，可与已选猫交换' : ''}`)}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="cm-seat-number">{index + 1}</span>
                          <span className="cm-cat-portrait" aria-hidden="true">
                            <i className="cm-ear cm-ear-left" />
                            <i className="cm-ear cm-ear-right" />
                            <b>{cat.face}</b>
                            <em />
                          </span>
                          <span className="cm-cat-name">{catName(cat)}</span>
                          <span className={`cm-need-pill need-${cat.need}`}>
                            <i>{NEEDS[cat.need].icon}</i>
                            {needLabel(cat.need)}
                          </span>
                          <span className="cm-trait-pill">
                            <i>{cat.traitIcon}</i>
                            {catTraitName(cat)}
                          </span>
                          <AnimatePresence>
                            {matched && (
                              <motion.span
                                className="cm-happy-burst"
                                initial={{ opacity: 0, scale: 0.4, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                              >
                                {L("+呼噜\n                              ")}</motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cm-control-deck">
            <div className="cm-move-panel">
              <div>
                <small>{L("本班可用猫爪")}</small>
                <span role="status" aria-label={L(`剩余 ${movesLeft} 次操作`)}>
                  {[0, 1, 2].map((index) => (
                    <PawPrint key={index} className={index < movesLeft ? 'is-live' : ''} />
                  ))}
                  {movesLeft > 3 && <b>+{movesLeft - 3}</b>}
                </span>
              </div>
              <p>
                {selectedCat === null
                  ? (_en ? 'Change a station, or tap a cat then an adjacent cat to swap.' : '改工位，或点一只猫再点相邻猫交换。')
                  : (_en ? `Selected ${catName(cats[selectedCat])}; now tap a lit adjacent seat.` : `已选 ${cats[selectedCat].name}，现在点发光的相邻座位。`)}
              </p>
            </div>

            <button
              type="button"
              className="cm-buy-paw"
              onClick={buyExtraMove}
              disabled={!isArrangePhase || extraMoveBought || fish < extraMovePrice}
            >
              <PawPrint />
              <span>
                <strong>{_en ? (extraMoveBought ? 'Upgraded this shift' : 'Add a paw') : (extraMoveBought ? '本班已加餐' : '加一只猫爪')}</strong>
                <small>{_en ? (extraMoveBought ? 'Back next shift' : `${extraMovePrice} fish · once per shift`) : (extraMoveBought ? '下班再来' : `${extraMovePrice} 鱼干 · 每班一次`)}</small>
              </span>
            </button>

            <button
              type="button"
              className={`cm-lever ${goldArmed ? 'is-gold' : ''}`}
              onClick={resolveRound}
              disabled={!isArrangePhase}
            >
              <span className="cm-lever-handle" aria-hidden="true"><i /><b /></span>
              <span>
                <small>{_en ? (phase === 'resolving' ? 'Cats are getting into place' : goldArmed ? 'Gold lever lit' : 'All set?') : (phase === 'resolving' ? '猫咪正在就位' : goldArmed ? '金色档已点亮' : '安排好了吗？')}</small>
                <strong>{_en ? (phase === 'resolving' ? 'Calculating purr…' : 'Ring the bell') : (phase === 'resolving' ? '呼噜计算中…' : '摇铃开机')}</strong>
              </span>
              <Bell />
            </button>
          </div>
        </div>

        <aside className="cm-side-panel">
          <section className="cm-side-card cm-goal-card">
            <div className="cm-side-heading">
              <span>{L("店铺成长 · Lv.")}{shopLevel}</span>
              <Trophy />
            </div>
            <strong>{L("距离 Lv.")}{shopLevel + 1} {L("还差 ")}{Math.max(0, nextLevelScore - score)} {L("呼噜")}</strong>
            <p>{L("没有最终关。店铺升级会放大每班收益，模块也可以不断叠级，但高收益仍要靠你亲手排出完美整层。")}</p>
            <div className="cm-goal-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelProgress)} aria-label={L(`店铺等级进度 ${Math.round(levelProgress)}%`)}>
              <i style={{ width: `${levelProgress}%` }} />
            </div>
          </section>

          <section className="cm-side-card">
            <div className="cm-side-heading">
              <span>{L("永久模块 · ")}{installedModules.length} {L("种")}</span>
              <Sparkles />
            </div>
            {modules.length === 0 ? (
              <div className="cm-empty-modules">
                <span>?</span>
                <p>{L("每 3 班选一个模块；抽到已有模块会升一级。")}</p>
              </div>
            ) : (
              <div className="cm-module-list">
                {installedModules.map(({ module, level }) => (
                  <div key={module.id} style={{ '--module-color': module.color } as React.CSSProperties}>
                    <span>{module.icon}</span>
                    <p>
                      <strong>{moduleName(module)}<b className="cm-module-level">Lv.{level}</b></strong>
                      <small>{moduleDesc(module)}</small>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="cm-side-card cm-hint-card">
            <div className="cm-side-heading">
              <span>{L("小爪提示")}</span>
              <Lightbulb />
            </div>
            <p>{hint ?? (_en ? 'When the best layout is unclear, the on-duty cat offers a hint. Hints cost no paws.' : '看不出最优站位时，可以让值班小猫给一句方向。提示不消耗猫爪。')}</p>
            <button type="button" onClick={revealHint} disabled={!isArrangePhase}>
              <Lightbulb />
              {hint ? (_en ? 'Peek again' : '再看一眼') : (_en ? 'Give me a hint' : '给我一点提示')}
            </button>
          </section>

          <section className="cm-side-card cm-legend-card">
            <div className="cm-side-heading">
              <span>{L("只记住这三件事")}</span>
            </div>
            <ol>
              <li><i>1</i><span>{L("愿望与工位一致，猫就满意。")}</span></li>
              <li><i>2</i><span>{L("整层满意，会触发大额连锁。")}</span></li>
              <li><i>3</i><span>{L("长按或悬停猫卡，可看天赋。")}</span></li>
            </ol>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {(phase === 'intro' || showGuide) && (
          <motion.div
            className="cm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cm-guide-title"
          >
            <motion.div
              className="cm-modal cm-guide-modal"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
            >
              {showGuide && phase !== 'intro' && (
                <button type="button" className="cm-modal-close" onClick={() => setShowGuide(false)} aria-label={L("关闭玩法说明")}>
                  <X />
                </button>
              )}
              <div className="cm-guide-kicker"><span>🐾</span> {L("一分钟上手")}</div>
              <h3 id="cm-guide-title">{L("不是抽奖，是一台会“贴贴连锁”的猫咪服务机")}</h3>
              <p className="cm-guide-lead">{L("这里没有最后一班。每班用两只猫爪调整工位与座位，摇铃赚呼噜、升级店铺，再把永久模块一层层叠高。")}</p>
              {offlineNotice > 0 && (
                <div className="cm-offline-notice">
                  <span>🌙</span>
                  <p><strong>{L("猫咪替你看了一会儿店")}</strong><small>{L("离线获得 +")}{offlineNotice} {L("呼噜（最多累计 4 小时）")}</small></p>
                </div>
              )}
              <div className="cm-guide-steps">
                <div>
                  <span>01</span>
                  <i>👀</i>
                  <strong>{L("看愿望")}</strong>
                  <p>{L("鱼、羽毛、纸箱分别对应吃、玩、睡。")}</p>
                </div>
                <div>
                  <span>02</span>
                  <i>🐾</i>
                  <strong>{L("花猫爪")}</strong>
                  <p>{L("改一层工位，或交换两只相邻猫。")}</p>
                </div>
                <div>
                  <span>03</span>
                  <i>🔔</i>
                  <strong>{L("摇铃连锁")}</strong>
                  <p>{L("整层满意、天赋、事件和模块一起结算。")}</p>
                </div>
              </div>
              <div className="cm-guide-footer">
                <p><Sparkles /> {L("进度保存在这台设备；金色毛球可以留到最漂亮的一班再释放。")}</p>
                {phase === 'intro' ? (
                  <button type="button" onClick={startGame}>{_en ? (hasSavedProgress ? 'Keep going' : 'Got it, start shift one') : (hasSavedProgress ? '继续营业' : '懂了，开第一班')} <Bell /></button>
                ) : (
                  <button type="button" onClick={() => setShowGuide(false)}>{L("继续值班 ")}<PawPrint /></button>
                )}
              </div>
              {hasSavedProgress && (
                <button type="button" className="cm-reset-progress" onClick={resetProgress}>
                  <RotateCcw /> {L("清空本机进度\n                ")}</button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'result' && roundResult && (
          <motion.div className="cm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="cm-modal cm-result-modal"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18 }}
            >
              <div className="cm-result-icon">{roundResult.perfectRows.length > 0 ? '😻' : '😺'}</div>
              <small>SHIFT {String(round).padStart(2, '0')} {L("· 结算完成")}</small>
              <h3>{roundResult.headline}</h3>
              <div className="cm-result-score">
                <span>+{roundResult.total}</span>
                <p>{L("本班呼噜")}<small>{roundResult.matches}{L("/9 只满意 · ")}{roundResult.perfectRows.length} {L("条完美整层")}</small></p>
              </div>
              <div className="cm-breakdown">
                <div><span>{L("基础照顾")}</span><strong>+{roundResult.base}</strong></div>
                <div><span>{L("猫咪天赋")}</span><strong>+{roundResult.traitBonus}</strong></div>
                <div><span>{L("整层与连班")}</span><strong>+{roundResult.rowBonus}</strong></div>
                <div><span>{L("机器模块")}</span><strong>+{roundResult.moduleBonus}</strong></div>
                <div><span>{event.icon} {eventName(event)}</span><strong>+{roundResult.eventBonus}</strong></div>
                {roundResult.growthBonus > 0 && <div><span>{L("店铺 Lv.")}{shopLevel} {L("成长")}</span><strong>+{roundResult.growthBonus}</strong></div>}
                {roundResult.goldBonus > 0 && <div className="is-gold"><span>{L("✨ 金色呼噜")}</span><strong>+{roundResult.goldBonus}</strong></div>}
              </div>
              <div className="cm-result-rewards">
                <span><Fish /> +{roundResult.fishEarned} {L("鱼干")}</span>
                <span><Sparkles /> +{roundResult.energyGain} {L("毛球能量")}</span>
              </div>
              <button type="button" onClick={continueAfterResult}>
                {round % MODULE_INTERVAL === 0 ? (_en ? 'Choose a permanent module' : '选择永久模块') : (_en ? 'Next shift' : '进入下一班')}
                <span aria-hidden="true">→</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'upgrade' && (
          <motion.div className="cm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="cm-modal cm-upgrade-modal"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18 }}
            >
              <div className="cm-guide-kicker"><span>🧰</span> {L("猫咪机升级时间")}</div>
              <h3>{L("选一个永久模块，或者把旧模块再升一级")}</h3>
              <p>{L("每 3 班都会再选一次，没有安装上限。重复模块的效果会继续叠加。")}</p>
              <div className="cm-upgrade-grid">
                {upgradeChoices.map((module) => (
                  <button
                    type="button"
                    key={module.id}
                    onClick={() => chooseModule(module)}
                    style={{ '--module-color': module.color } as React.CSSProperties}
                  >
                    <span>{module.icon}</span>
                    <small>{moduleLevel(modules, module.id) > 0 ? `Lv.${moduleLevel(modules, module.id)} → Lv.${moduleLevel(modules, module.id) + 1}` : (_en ? 'Gain Lv.1' : '获得 Lv.1')}</small>
                    <strong>{moduleName(module)}</strong>
                    <p>{moduleDesc(module)}</p>
                    <i>{moduleLevel(modules, module.id) > 0 ? (_en ? 'Upgrade it' : '升级它') : (_en ? 'Install it' : '装上它')} <b>→</b></i>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
