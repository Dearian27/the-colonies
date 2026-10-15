import { describe, expect, it, vi } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Colonies } from './Colonies';
import { aircraft } from './aircraft';
import { buildings, createBuildingCard } from './buildings';
import { gameConfig } from './config';
import { applyProduction, createInitialPlayer, createInitialState, createMarket, getPlayerBalance, resolveRound } from './rules';
import { productionFixture } from './scenario-fixtures';
import { executableScenarios } from './live-scenarios';

describe('setup', () => {
  it.each([2, 3, 4])('starts %i players with independent entities', (count) => {
    const state = createInitialState(count, gameConfig.market.installationIds);
    const ids: string[] = [];
    expect(state.round).toBe(0); expect(state.dice).toEqual([]); expect(state.market).toHaveLength(4);
    Object.values(state.players).forEach((player) => {
      expect(player.researchers).toHaveLength(5); expect(player.coins).toBe(3);
      expect(player.colony).toHaveLength(1); expect(player.colony[0].definitionId).toBe('main-dome'); expect(player.colony[0].slots).toEqual([]);
      expect(player.aircraft).toHaveLength(1); expect(player.aircraft[0].boosters).toEqual([]);
      expect(aircraft[player.aircraft[0].definitionId].stats).toEqual({ initiative: 2, cargoCapacity: 4, boosterSlots: 0 });
      ids.push(...player.researchers.map((value) => value.id), ...player.colony.map((value) => value.id), ...player.aircraft.map((value) => value.id), ...player.hand.map((value) => value.id));
      expect(getPlayerBalance(player)).toEqual({ coin: 3, energy: 0, weapon: 0 });
    });
    expect(new Set(ids).size).toBe(ids.length);
    state.players['0'].coins += 10; expect(state.players['1'].coins).toBe(3);
  });
});

describe('production and storage', () => {
  it('sums energy from solar and wind and weapons from every slot', () => {
    const player = productionFixture();
    player.colony[1].slots[1] = { id: 'solar', type: 'energy' };
    player.colony[2].slots[0] = { id: 'wind', type: 'energy' };
    player.colony[3].slots[2] = { id: 'weapon', type: 'weapon' };
    expect(getPlayerBalance(player)).toEqual({ coin: 3, energy: 2, weapon: 1 });
  });
  it('produces energy for each relevant face and keeps weapons dormant', () => {
    const initial = productionFixture(); const next = applyProduction(initial, [1, 2, 1, 2], 1);
    expect(getPlayerBalance(next)).toEqual({ coin: 4, energy: 4, weapon: 0 });
    expect(next.colony[3].slots).toEqual([null, null, null]);
    expect(initial.coins).toBe(3); expect(initial.colony[1].slots).toEqual([null, null]);
    const tokens = next.colony.flatMap((card) => card.slots.filter(Boolean));
    expect(new Set(tokens.map((token) => token!.id)).size).toBe(tokens.length);
  });
  it.each([{ dice: [1, 1, 1, 1], solar: 2, wind: 0 }, { dice: [2, 2, 2, 2], solar: 0, wind: 2 }, { dice: [3, 3, 3, 3], solar: 0, wind: 0 }])('activates only matching installations: $dice', ({ dice, solar, wind }) => {
    const next = applyProduction(productionFixture(), dice, 1);
    expect(next.colony[1].slots.filter(Boolean)).toHaveLength(solar); expect(next.colony[2].slots.filter(Boolean)).toHaveLength(wind);
  });
  it('keeps existing tokens, ignores overflow and permits later refills with new IDs', () => {
    const initial = productionFixture(); initial.colony[1].slots[0] = { id: 'existing', type: 'energy' };
    const first = applyProduction(initial, [1, 1, 1, 1], 1);
    expect(first.colony[1].slots).toHaveLength(2); expect(first.colony[1].slots[0]?.id).toBe('existing');
    const second = applyProduction(first, [1, 1, 1, 1], 2);
    expect(second.colony[1].slots).toEqual(first.colony[1].slots); expect(getPlayerBalance(second).energy).toBe(2);
    const old = second.colony[1].slots[1]!.id; second.colony[1].slots[1] = null;
    expect(applyProduction(second, [1, 1, 1, 1], 3).colony[1].slots[1]?.id).not.toBe(old);
  });
  it('has no game capacity limit on coins or coin slots', () => {
    const player = createInitialPlayer('large-wallet'); player.coins = 100000;
    const next = applyProduction(player, [5, 5, 5, 6], 1);
    expect(next.coins).toBe(100001); expect(next.colony[0].slots).toEqual([]);
  });
  it('supports one-slot installations without overflow', () => {
    const player = createInitialPlayer('single'); player.colony.push(createBuildingCard('solar-panel-1', 'single-solar'), createBuildingCard('wind-generator-1', 'single-wind'));
    const next = applyProduction(player, [1, 2, 1, 2], 1);
    expect(getPlayerBalance(next).energy).toBe(2);
  });
  it('rejects invalid forecast values', () => { expect(() => applyProduction(productionFixture(), [0, 2, 3, 4], 1)).toThrow(); });
});

describe('market and round', () => {
  it('replaces all instances with four unique eligible definitions; development unchanged', () => {
    const initial = createInitialState(3, gameConfig.market.installationIds);
    const next = resolveRound(initial, [1, 2, 3, 4], [...gameConfig.market.installationIds].reverse());
    expect(next.round).toBe(1); expect(next.dice).toEqual([1, 2, 3, 4]); expect(next.market).toHaveLength(4);
    expect(new Set(next.market.map((card) => card.definitionId)).size).toBe(4);
    next.market.forEach((card) => { expect(card.definitionId).not.toBe('main-dome'); expect(buildings[card.definitionId].status).toBe('prototype'); expect(initial.market.map((old) => old.id)).not.toContain(card.id); expect(card.slots.every((slot) => slot === null)).toBe(true); });
    expect(next.sectionCards).toEqual(initial.sectionCards); expect(initial.round).toBe(0);
    Object.values(next.players).forEach((player) => expect(player.coins).toBe(4));
  });
  it('allows recurring definitions across rounds but never duplicates within a market', () => {
    const market = createMarket(gameConfig.market.installationIds, 2);
    expect(market.map((card) => card.definitionId)).toEqual(createMarket(gameConfig.market.installationIds, 1).map((card) => card.definitionId));
  });
  it('rejects missing, duplicate or ineligible cards and incomplete dice', () => {
    expect(() => createMarket(['main-dome', ...gameConfig.market.installationIds], 0)).toThrow();
    expect(() => createMarket(Array(4).fill('solar-panel-1'), 0)).toThrow();
    expect(() => createMarket([], 0)).toThrow();
    expect(() => resolveRound(createInitialState(2, gameConfig.market.installationIds), [1], gameConfig.market.installationIds)).toThrow();
  });
});

describe('boardgame.io integration', () => {
  function seededClient(playerID = '0') { return Client({ game: { ...Colonies, seed: 'colonies-test-seed' }, numPlayers: 3, playerID, debug: false }); }
  it('uses the real move to increment rounds, replace market and grant income', () => {
    const client = seededClient(); const before = client.getState()!.G;
    client.moves.rollDice(); const next = client.getState()!.G;
    expect(next.round).toBe(1); expect(next.dice).toHaveLength(4); expect(next.market.map((card) => card.id)).not.toEqual(before.market.map((card) => card.id));
    Object.values(next.players).forEach((player) => expect(player.coins).toBe(4));
    client.moves.rollDice(); expect(client.getState()!.G.round).toBe(2); expect(client.getState()!.G.players['0'].coins).toBe(5);
  });
  it('rejects non-leader moves without changing game or random state', () => {
    const client = seededClient('1'); const before = client.getState()!;
    const expectedError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { client.moves.rollDice(); } finally { expectedError.mockRestore(); }
    const after = client.getState()!;
    expect(after.G).toEqual(before.G); expect(after.plugins.random).toEqual(before.plugins.random);
  });
  it('also enforces the leader guard when the flow permits every player to act', () => {
    const client = Client({ game: { ...Colonies, seed: 'leader-guard', turn: { activePlayers: { all: 'roll' }, stages: { roll: { moves: Colonies.moves } } } }, numPlayers: 3, playerID: '1', debug: false });
    const before = client.getState()!;
    const expectedError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { client.moves.rollDice(); } finally { expectedError.mockRestore(); }
    const after = client.getState()!;
    expect(after.G).toEqual(before.G); expect(after.plugins.random).toEqual(before.plugins.random);
  });
  it('replays identically with the same seed and actions', () => {
    const first = seededClient(); const second = seededClient();
    expect(first.getState()!.G).toEqual(second.getState()!.G);
    for (let index = 0; index < 6; index++) { first.moves.rollDice(); second.moves.rollDice(); expect(first.getState()!.G).toEqual(second.getState()!.G); }
  });
});

describe('executable documentation scenarios', () => {
  it.each(executableScenarios)('$id: $title', (scenario) => {
    const actual = scenario.execute!(); expect(actual.checks.length).toBeGreaterThan(0); expect(actual.passed).toBe(true);
    actual.checks.forEach((check) => expect(check.actual, check.label).toEqual(check.expected));
  });
});
