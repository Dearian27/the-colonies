import { aircraftDefinitions, type AircraftDefinition } from './cards';

export interface AircraftCard { id: string; definitionId: string; boosters: (string | null)[] }
export const aircraft: Record<string, AircraftDefinition> = Object.fromEntries(aircraftDefinitions.map((definition) => [definition.id, definition]));
export function createAircraftCard(definitionId: string, id: string): AircraftCard {
  const definition = aircraft[definitionId];
  if (!definition) throw new Error(`Unknown aircraft: ${definitionId}`);
  return { id, definitionId, boosters: Array.from({ length: definition.stats.boosterSlots }, () => null) };
}
