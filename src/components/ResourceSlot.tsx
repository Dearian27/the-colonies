import { resources, type ResourceToken, type ResourceType } from '../game/resources';
import { ResourceIcon } from './ResourceIcon';

export function ResourceChip({ type }: { type: ResourceType }) {
  const resource = resources[type];
  return <span className={`resource-chip resource-${type}`} role="img" aria-label={`Фішечка: ${resource.label}`}><ResourceIcon type={type} /></span>;
}

export function ResourceSlot({ resource, token = null, number }: { resource: ResourceType; token?: ResourceToken | null; number: number }) {
  return (
    <div className={`resource-slot resource-slot-${resource}${token ? ' occupied' : ''}`} role="group" aria-label={`Слот ${number}: ${resources[resource].label}, ${token ? 'зайнятий' : 'вільний'}`}>
      {token ? <ResourceChip type={token.type} /> : <span className="slot-resource-hint" aria-hidden="true"><ResourceIcon type={resource} /></span>}
    </div>
  );
}
