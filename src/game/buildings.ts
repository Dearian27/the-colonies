import type { ResourceToken, ResourceType } from './resources';

export type SlotCount = 1 | 2 | 3;

export interface BuildingDefinition {
  id: string;
  name: string;
  icon: string;
  production: { resource: ResourceType; amount: number };
  storage: { resource: ResourceType; slotCount: SlotCount };
}

export interface BuildingCard {
  id: string;
  definitionId: string;
  slots: (ResourceToken | null)[];
}

export const buildings: Record<string, BuildingDefinition> = {
  'main-dome': {
    id: 'main-dome',
    name: 'Осердя',
    icon: 'dome',
    production: { resource: 'coin', amount: 1 },
    // One coin slot is a visual prototype default; its gameplay capacity is not settled.
    storage: { resource: 'coin', slotCount: 1 },
  },
};

export function createBuildingCard(definitionId: string, instanceId: string): BuildingCard {
  const definition = buildings[definitionId];
  if (!definition) throw new Error(`Unknown building: ${definitionId}`);
  return {
    id: instanceId,
    definitionId,
    slots: Array.from({ length: definition.storage.slotCount }, () => null),
  };
}
