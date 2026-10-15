import scene from './scene.json';
import { buildings, createBuildingCard } from './buildings';
import { createAircraftCard } from './aircraft';
import { gameConfig } from './config';
import { diceDefinitions } from './dice';
import type { ColoniesState, PlayerState } from './state';

export function createInitialPlayer(playerID: string): PlayerState {
  return {
    coins: gameConfig.starting.coins,
    researchers: Array.from({ length: gameConfig.starting.researchers }, (_, index) => ({ id: `researcher-${playerID}-${index}` })),
    aircraft: gameConfig.starting.aircraft.map((id, index) => createAircraftCard(id, `aircraft-${playerID}-${index}`)),
    colony: gameConfig.starting.colony.map((id, index) => createBuildingCard(id, `colony-${playerID}-${index}`)),
    hand: Array.from({ length: scene.handSize }, (_, index) => ({ id: `hand-${playerID}-${index}` })),
  };
}

export function createMarket(shuffledIds: readonly string[], round: number) {
  const selected = shuffledIds.slice(0, gameConfig.market.size);
  if (selected.length !== gameConfig.market.size || new Set(selected).size !== selected.length || selected.some((id) => !gameConfig.market.installationIds.includes(id))) {
    throw new Error('Market requires four distinct eligible installation definitions');
  }
  return selected.map((id, index) => createBuildingCard(id, `market-${round}-${index}`));
}

export function createInitialState(numPlayers: number, shuffledMarketIds: readonly string[]): ColoniesState {
  if (!Number.isInteger(numPlayers) || numPlayers < 2 || numPlayers > 4) throw new Error('Supported players: 2–4');
  return {
    sections: scene.sections.map((section) => ({ ...section })),
    sectionCards: { development: Array.from({ length: scene.sectionCardCount }, (_, index) => ({ id: `development-card-${index}` })) },
    market: createMarket(shuffledMarketIds, 0),
    leaderID: '0', round: 0, dice: [],
    players: Object.fromEntries(Array.from({ length: numPlayers }, (_, index) => [String(index), createInitialPlayer(String(index))])),
  };
}

export function getPlayerBalance(player: PlayerState) {
  const balance = { coin: player.coins, weapon: 0, energy: 0 };
  for (const card of player.colony) {
    for (const token of card.slots) {
      if (token?.type === 'weapon' || token?.type === 'energy') balance[token.type] += 1;
    }
  }
  return balance;
}

// Pure calculation: existing tokens retain their IDs; only empty slots get tokens.
export function applyProduction(player: PlayerState, dice: readonly number[], round: number): PlayerState {
  const hits = { sun: 0, wind: 0 };
  dice.forEach((value, index) => {
    if (!Number.isInteger(value) || value < 1 || value > 6 || !diceDefinitions[index]) throw new Error('Invalid forecast roll');
    const face = diceDefinitions[index].faces[value - 1];
    if (face === 'sun' || face === 'wind') hits[face] += 1;
  });
  let coins = player.coins;
  const colony = player.colony.map((card) => {
    const definition = buildings[card.definitionId];
    const { production, storage } = definition;
    const activations = production.trigger === 'round' ? 1 : production.trigger ? hits[production.trigger] : 0;
    let remaining = activations * production.amount;
    if (storage.mode === 'wallet') { coins += remaining; return { ...card, slots: [] }; }
    return { ...card, slots: card.slots.map((token, index) => {
      if (token || remaining <= 0) return token;
      remaining -= 1;
      return { id: `resource-${card.id}-${round}-${index}`, type: storage.resource };
    }) };
  });
  return { ...player, coins, colony };
}

export function resolveRound(G: ColoniesState, dice: number[], shuffledMarketIds: readonly string[]): ColoniesState {
  if (dice.length !== diceDefinitions.length) throw new Error('Expected four forecast dice');
  const round = G.round + 1;
  return {
    ...G, round, dice: [...dice], market: createMarket(shuffledMarketIds, round),
    players: Object.fromEntries(Object.entries(G.players).map(([id, player]) => [id, applyProduction(player, dice, round)])),
  };
}
