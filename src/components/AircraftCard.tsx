import { aircraft, type AircraftCard as AircraftInstance } from '../game/aircraft';
import { Symbol } from './Symbol';
import './game-ui.css';

export function AircraftCard({ card }: { card: AircraftInstance }) {
  const definition = aircraft[card.definitionId];
  return <article className="blank-card aircraft-card" aria-label={`Конвертоплан: ${definition.name}`}>
    <div className="card-inner aircraft-inner">
      <span className="installation-type">{definition.typeLabel}</span><h3>{definition.name}</h3>
      <Symbol name={definition.icon} className="aircraft-symbol" />
      <dl><dt>Ініціатива</dt><dd>+{definition.stats.initiative}</dd><dt>Вантажність</dt><dd>{definition.stats.cargoCapacity}</dd><dt>Підсилювачі</dt><dd>{definition.stats.boosterSlots}</dd></dl>
      {card.boosters.length > 0 && <div className="aircraft-booster-slots" aria-label="Слоти підсилювачів">{card.boosters.map((booster, index) => <span key={index} className="resource-slot">{booster ?? ''}</span>)}</div>}
    </div>
  </article>;
}
