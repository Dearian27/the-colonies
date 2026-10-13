import type { Game } from 'boardgame.io';
import scene from './scene.json';
import { createBuildingCard, type BuildingCard } from './buildings';
import type { ResourceToken } from './resources';
import { diceDefinitions } from './dice';

export interface BlankCard {
  id: string;
}

export interface ColoniesState {
  sections: typeof scene.sections;
  sectionCards: Record<string, BlankCard[]>;
  leaderID: string;
  dice: number[];
  diceRollCount: number;
  players: Record<string, { colony: BuildingCard[]; hand: BlankCard[]; resources: ResourceToken[] }>;
}

// Presentation-only setup. These placeholders do not define gameplay rules.
export const Colonies: Game<ColoniesState> = {
  name: 'colonies',
  setup: ({ ctx }) => ({
    leaderID: '0',
    dice: [],
    diceRollCount: 0,
    sections: scene.sections.map((section) => ({ ...section })),
    sectionCards: Object.fromEntries(['market', 'development'].map((id) => [id,
      Array.from({ length: scene.sectionCardCount }, (_, index) => ({ id: `${id}-card-${index}` })),
    ])),
    players: Object.fromEntries(
      Array.from({ length: ctx.numPlayers }, (_, index) => [
        String(index),
        {
          colony: [createBuildingCard('main-dome', `colony-${index}-0`)],
          resources: [],
          hand: Array.from({ length: scene.handSize }, (_, cardIndex) => ({
            id: `hand-${index}-${cardIndex}`,
          })),
        },
      ]),
    ),
  }),
  moves: {
    rollDice: ({ G, random, playerID }) => {
      if (playerID !== G.leaderID) return;
      G.dice = random.D6(diceDefinitions.length);
      G.diceRollCount += 1;
    },
  },
};
