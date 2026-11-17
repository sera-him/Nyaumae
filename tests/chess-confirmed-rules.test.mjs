import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, getPiece } from '../src/game/chess/board.ts';
import { executeMove } from '../src/game/chess/engine.ts';
import { getRawMoves } from '../src/game/chess/moves.ts';
import { getAntennaPushTargets } from '../src/game/chess/rules.ts';
import { chessPieces } from '../src/data/chess.ts';
import { useChessStore } from '../src/stores/chessStore.ts';

const piece = (type, owner = 'white') => ({ type, owner });
const key = (pos) => `${pos.row},${pos.col}`;

function emptyState() {
  const state = createInitialState();
  const board = Array.from({ length: 12 }, () => Array(12).fill(null));
  board[0][11] = piece('K', 'black');
  board[11][11] = piece('K', 'white');
  return {
    ...state,
    board,
    currentPlayer: 'white',
    phase: 'playing',
    moveCount: 0,
    poison: {},
    fears: {},
    history: [],
    stateHashes: [],
    hasOstrich: { white: false, black: false },
  };
}

function resetStore(gameState, overrides = {}) {
  useChessStore.setState({
    gameState,
    gameStarted: true,
    selectedPos: null,
    legalMoves: [],
    promoteChoice: null,
    witchSkillMode: 'none',
    selectedCheeseType: 'CY',
    antennaPushMode: false,
    antennaPushTargets: [],
    antennaPushPlayer: null,
    skillConfirmTarget: null,
    ostrichRevertChoice: null,
    starshipDeployMode: false,
    starshipDeployTarget: null,
    clockRunning: false,
    ...overrides,
  });
}

function pieceCount(board) {
  return board.flat().filter((cell) => cell && typeof cell === 'object').length;
}

function selectAndMove(from, to) {
  useChessStore.getState().selectCell(from);
  assert.ok(
    useChessStore.getState().legalMoves.some((move) => key(move.to) === key(to)),
    `expected ${key(from)} -> ${key(to)} to be legal`,
  );
  useChessStore.getState().confirmMove(to);
}

test('ostrich slides and captures like a queen without jumping', () => {
  const state = emptyState();
  state.board[5][5] = piece('O');
  state.board[5][8] = piece('R', 'black');
  state.board[4][4] = piece('N');

  const moves = getRawMoves(state.board, { row: 5, col: 5 }, piece('O'));
  const capture = moves.find((move) => key(move.to) === '5,8');
  assert.equal(capture?.isCapture, true, 'ostrich can capture the first enemy in a line');
  assert.equal(moves.some((move) => key(move.to) === '5,9'), false, 'ostrich cannot jump the captured piece');
  assert.equal(moves.some((move) => key(move.to) === '4,4'), false, 'ostrich cannot capture its own piece');

  const rule = chessPieces.find((entry) => entry.letter === 'O');
  assert.notEqual(rule?.eat, '不可吃子');
});

test('antenna only offers a throw when the opposite square exists and is empty', () => {
  const offboard = emptyState().board;
  offboard[0][0] = piece('A');
  offboard[0][1] = piece('P');
  assert.deepEqual(getAntennaPushTargets(offboard, { row: 0, col: 0 }), []);

  const occupied = emptyState().board;
  occupied[5][5] = piece('A');
  occupied[5][4] = piece('P');
  occupied[5][6] = piece('R', 'black');
  assert.deepEqual(getAntennaPushTargets(occupied, { row: 5, col: 5 }), []);

  const whaleZone = emptyState().board;
  whaleZone[5][5] = piece('A');
  whaleZone[5][4] = piece('P');
  whaleZone[5][7] = piece('H', 'black');
  assert.deepEqual(getAntennaPushTargets(whaleZone, { row: 5, col: 5 }), []);
});

test('only the antenna that just jumped triggers a throw', () => {
  const nonAntenna = emptyState();
  nonAntenna.board[8][8] = piece('R');
  nonAntenna.board[5][5] = piece('A');
  nonAntenna.board[5][4] = piece('P');
  resetStore(nonAntenna);
  selectAndMove({ row: 8, col: 8 }, { row: 7, col: 8 });
  assert.equal(useChessStore.getState().antennaPushMode, false, 'another piece moving must not trigger antennas');

  const sidestep = emptyState();
  sidestep.board[5][5] = piece('A');
  sidestep.board[5][7] = piece('P');
  resetStore(sidestep);
  selectAndMove({ row: 5, col: 5 }, { row: 5, col: 6 });
  assert.equal(useChessStore.getState().antennaPushMode, false, 'a one-square antenna move must not trigger');

  const jump = emptyState();
  jump.board[5][5] = piece('A');
  jump.board[7][7] = piece('P');
  jump.board[2][2] = piece('A');
  jump.board[2][1] = piece('P');
  resetStore(jump);
  selectAndMove({ row: 5, col: 5 }, { row: 7, col: 6 });

  const triggered = useChessStore.getState();
  assert.equal(triggered.antennaPushMode, true);
  assert.deepEqual(
    triggered.antennaPushTargets.map((target) => `${key(target.from)}->${key(target.to)}`),
    ['7,7->7,5'],
    'other ready antennas must not join this trigger',
  );

  const beforeCount = pieceCount(triggered.gameState.board);
  triggered.executeAntennaPush({ row: 7, col: 7 });
  const thrown = useChessStore.getState().gameState;
  assert.equal(getPiece(thrown.board, { row: 7, col: 7 }), null);
  assert.deepEqual(getPiece(thrown.board, { row: 7, col: 5 }), piece('P'));
  assert.equal(pieceCount(thrown.board), beforeCount, 'throwing relocates a piece and never removes it');
});

test('antenna rejects a stale throw into an occupied square without removing either piece', () => {
  const state = emptyState();
  state.board[5][5] = piece('A');
  state.board[5][4] = piece('P');
  state.board[5][6] = piece('R', 'black');
  const thrownPiece = getPiece(state.board, { row: 5, col: 4 });
  resetStore(state, {
    antennaPushMode: true,
    antennaPushPlayer: 'white',
    antennaPushTargets: [{ from: { row: 5, col: 4 }, to: { row: 5, col: 6 }, piece: thrownPiece }],
  });

  const beforeCount = pieceCount(state.board);
  useChessStore.getState().executeAntennaPush({ row: 5, col: 4 });
  const result = useChessStore.getState().gameState;
  assert.equal(result, state, 'an invalid throw must not consume or mutate the game state');
  assert.deepEqual(getPiece(result.board, { row: 5, col: 4 }), piece('P'));
  assert.deepEqual(getPiece(result.board, { row: 5, col: 6 }), piece('R', 'black'));
  assert.equal(pieceCount(result.board), beforeCount);
});

test('self-destruct never spawns inside a whale zone', () => {
  const state = emptyState();
  state.board[5][5] = piece('H', 'black');
  state.board[4][7] = piece('W');

  const result = executeMove(state, {
    from: { row: 4, col: 7 },
    to: { row: 4, col: 7 },
    isWitchSkill: 'self_destruct',
  });
  assert.deepEqual(getPiece(result.board, { row: 4, col: 7 }), piece('Z'));
  assert.equal(getPiece(result.board, { row: 4, col: 6 }), null, 'the left birth square is inside the whale zone');
  assert.deepEqual(getPiece(result.board, { row: 4, col: 8 }), piece('Z'));
});

test('newborn Z and IZ promote immediately on their qualifying baselines', () => {
  const skeleton = emptyState();
  skeleton.board[0][4] = piece('W');
  const skeletonResult = executeMove(skeleton, {
    from: { row: 0, col: 4 },
    to: { row: 0, col: 4 },
    isWitchSkill: 'self_destruct',
  });
  for (const col of [3, 4, 5]) {
    assert.deepEqual(getPiece(skeletonResult.board, { row: 0, col }), piece('IW'));
  }

  const antiSkeleton = emptyState();
  antiSkeleton.board[11][4] = piece('IW');
  const antiResult = executeMove(antiSkeleton, {
    from: { row: 11, col: 4 },
    to: { row: 11, col: 4 },
    isWitchSkill: 'self_destruct',
  });
  for (const col of [3, 4, 5]) {
    assert.deepEqual(getPiece(antiResult.board, { row: 11, col }), piece('W'));
  }

  const deployed = emptyState();
  deployed.board[4][4] = piece('S');
  const deployResult = executeMove(deployed, {
    from: { row: 4, col: 4 },
    to: { row: 0, col: 4 },
    isStarshipDeploy: true,
    starshipDeployType: 'Z',
  });
  assert.deepEqual(getPiece(deployResult.board, { row: 0, col: 4 }), piece('IW'));
});

test('all engine-side generation paths reject whale zones', () => {
  for (const generated of [
    { isWitchSkill: 'poison' },
    { isWitchSkill: 'make_cheese', cheeseType: 'CY' },
  ]) {
    const state = emptyState();
    state.board[0][5] = piece('H', 'black');
    state.board[4][4] = piece('W');
    const result = executeMove(state, {
      from: { row: 4, col: 4 },
      to: { row: 4, col: 4 },
      witchSkillTarget: { row: 0, col: 4 },
      ...generated,
    });
    assert.equal(result, state, 'invalid poison/cheese generation must be rejected by the engine');
    assert.equal(result.board[0][4], null);
  }

  const deployment = emptyState();
  deployment.board[0][5] = piece('H', 'black');
  deployment.board[4][4] = piece('S');
  const result = executeMove(deployment, {
    from: { row: 4, col: 4 },
    to: { row: 0, col: 4 },
    isStarshipDeploy: true,
    starshipDeployType: 'Z',
  });
  assert.equal(result, deployment, 'invalid deployment must not consume a turn');
  assert.equal(result.board[0][4], null);
});

test('anti-witch has the same poison and cheese generation skills as witch', () => {
  for (const [skill, expected] of [
    ['poison', 'poison'],
    ['make_cheese', 'CY'],
  ]) {
    const state = emptyState();
    state.board[4][4] = piece('IW');
    const result = executeMove(state, {
      from: { row: 4, col: 4 },
      to: { row: 4, col: 4 },
      isWitchSkill: skill,
      witchSkillTarget: { row: 4, col: 5 },
      cheeseType: 'CY',
    });
    assert.equal(result.board[4][5], expected);
  }

  const text = chessPieces.find((entry) => entry.letter === 'IW')?.notes || '';
  assert.match(text, /下毒/);
  assert.match(text, /制作奶酪/);
});
