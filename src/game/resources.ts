export type ResourceType = 'coin' | 'weapon' | 'energy';

export interface ResourceToken {
  id: string;
  type: ResourceType;
}

export const resources: Record<ResourceType, { label: string; symbol: string }> = {
  coin: { label: 'Монета', symbol: '🪙' },
  weapon: { label: 'Зброя', symbol: '⚔️' },
  energy: { label: 'Енергія', symbol: '⚡' },
};
