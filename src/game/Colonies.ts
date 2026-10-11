import type { Game } from 'boardgame.io';
import scene from './scene.json';
import { createBuildingCard, type BuildingCard } from './buildings';
import type { ResourceToken } from './resources';

export interface BlankCard {
  id: string;
}

export interface ColoniesState {
  sections: typeof scene.sections;
  players: Record<string, { colony: BuildingCard[]; hand: BlankCard[]; resources: ResourceToken[] }>;
}

// Presentation-only setup. These placeholders do not define gameplay rules.
export const Colonies: Game<ColoniesState> = {
  name: 'colonies',
  setup: ({ ctx }) => ({
    sections: scene.sections.map((section) => ({ ...section })),
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
  moves: {},
};
