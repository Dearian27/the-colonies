import type { ResourceToken } from './resources';
import { installationDefinitions, type InstallationDefinition } from './cards';

export type SlotCount = 1 | 2 | 3;

export type BuildingDefinition = InstallationDefinition;

export interface BuildingCard {
  id: string;
  definitionId: string;
  slots: (ResourceToken | null)[];
}

export const buildings: Record<string, BuildingDefinition> = Object.fromEntries(
  installationDefinitions.map((definition) => [definition.id, definition]),
);

export function createBuildingCard(definitionId: string, instanceId: string): BuildingCard {
  const definition = buildings[definitionId];
  if (!definition) throw new Error(`Unknown building: ${definitionId}`);
  return {
    id: instanceId,
    definitionId,
    slots: Array.from({ length: definition.storage.mode === 'slots' ? definition.storage.slotCount : 0 }, () => null),
  };
}
