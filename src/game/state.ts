import scene from './scene.json';
import type { BuildingCard } from './buildings';
import type { AircraftCard } from './aircraft';

export interface BlankCard { id: string }
export interface ResearcherToken { id: string }
export interface PlayerState {
  colony: BuildingCard[];
  hand: BlankCard[];
  coins: number;
  researchers: ResearcherToken[];
  aircraft: AircraftCard[];
}
export interface ColoniesState {
  sections: typeof scene.sections;
  sectionCards: Record<string, BlankCard[]>;
  market: BuildingCard[];
  leaderID: string;
  round: number;
  dice: number[];
  players: Record<string, PlayerState>;
}
