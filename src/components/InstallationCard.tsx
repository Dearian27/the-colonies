import { buildings, type BuildingCard } from '../game/buildings';
import { resources } from '../game/resources';
import { ResourceSlot } from './ResourceSlot';
import { Symbol } from './Symbol';

export function InstallationCard({ card }: { card: BuildingCard }) {
  const definition = buildings[card.definitionId];

  return (
    <article className="blank-card installation-card" aria-label={`Установка: ${definition.name}`}>
      <div className="card-inner installation-inner">
        <span className="installation-type">УСТАНОВКА</span>
        <h3>{definition.name}</h3>
        <Symbol name={definition.icon} className="dome-symbol" />
        <p className="installation-description" aria-label={`${definition.production.amount} ${resources[definition.production.resource].label}`}>
          {definition.production.amount} <span aria-hidden="true">{resources[definition.production.resource].symbol}</span>
        </p>
        <div className="installation-slots">
          {card.slots.map((token, index) => <ResourceSlot key={index} number={index + 1} resource={definition.storage.resource} token={token} />)}
        </div>
      </div>
    </article>
  );
}
