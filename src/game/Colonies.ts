import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { diceDefinitions } from './dice';
import { gameConfig } from './config';
import { createInitialState, resolveRound } from './rules';
import type { ColoniesState } from './state';

export type { ColoniesState, PlayerState, BlankCard } from './state';
export const Colonies: Game<ColoniesState> = {
  name: 'colonies',
  setup: ({ ctx, random }) => createInitialState(ctx.numPlayers, random.Shuffle(gameConfig.market.installationIds)),
  moves: {
    rollDice: ({ G, random, playerID }) => {
      if (playerID !== G.leaderID) return INVALID_MOVE;
      return resolveRound(G, random.D6(diceDefinitions.length), random.Shuffle(gameConfig.market.installationIds));
    },
  },
};
