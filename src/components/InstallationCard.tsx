import { buildings, type BuildingCard } from '../game/buildings';
import { resources } from '../game/resources';
import { ResourceSlot } from './ResourceSlot';
import { Symbol } from './Symbol';
import { ResourceIcon } from './ResourceIcon';

export function InstallationCard({ card }: { card: BuildingCard }) {
  const definition = buildings[card.definitionId];

  return (
    <article className={`blank-card installation-card installation-${definition.production.resource}`} aria-label={`Установка: ${definition.name}`}>
      <div className="card-inner installation-inner">
        <span className="installation-type">{definition.typeLabel}</span>
        <h3>{definition.name}</h3>
        <Symbol name={definition.icon} className="dome-symbol" />
        <p className="installation-description" aria-label={`${definition.production.amount} ${resources[definition.production.resource].label}`}>
          {definition.production.amount} <ResourceIcon type={definition.production.resource} />
        </p>
        {definition.storage.mode === 'slots' && <div className="installation-slots">
          {card.slots.map((token, index) => <ResourceSlot key={index} number={index + 1} resource={definition.storage.resource} token={token} />)}
        </div>}
      </div>
    </article>
  );
}
