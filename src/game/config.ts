import rawConfig from './game-config.json';
import { buildings } from './buildings';
import { aircraft } from './aircraft';

export type GameConfig = typeof rawConfig;
export function validateGameConfig(config: GameConfig): GameConfig {
  const fail = (field: string) => { throw new Error(`game-config.json: invalid ${field}`); };
  for (const [field, value] of Object.entries({ demoPlayers: config.demoPlayers, researchers: config.starting.researchers, coins: config.starting.coins, marketSize: config.market.size })) {
    if (!Number.isSafeInteger(value) || value < 0) fail(field);
  }
  if (config.demoPlayers < 2 || config.demoPlayers > 4) fail('demoPlayers');
  if (!config.market.size || config.market.size > config.market.installationIds.length) fail('market.size');
  if (new Set(config.market.installationIds).size !== config.market.installationIds.length) fail('market.installationIds: duplicate');
  config.market.installationIds.forEach((id) => { if (!buildings[id] || buildings[id].storage.mode !== 'slots') fail(`market.installationIds: ${id}`); });
  config.starting.colony.forEach((id) => { if (!buildings[id]) fail(`starting.colony: ${id}`); });
  config.starting.aircraft.forEach((id) => { if (!aircraft[id]) fail(`starting.aircraft: ${id}`); });
  return config;
}
export const gameConfig = validateGameConfig(rawConfig);
