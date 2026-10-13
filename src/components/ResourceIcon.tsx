import { resources, type ResourceType } from '../game/resources';
import { Symbol } from './Symbol';

export function ResourceIcon({ type }: { type: ResourceType }) {
  return <span className={`resource-symbol resource-symbol-${type}`} aria-hidden="true">{type === 'weapon' ? <Symbol name="weapon" /> : resources[type].symbol}</span>;
}
