import { createBuildingCard } from './buildings';
import { createInitialPlayer } from './rules';

// Prepared test state only: never injected into the normal game setup.
export function productionFixture() {
  const player = createInitialPlayer('fixture');
  player.colony.push(
    createBuildingCard('solar-panel-2', 'fixture-solar'),
    createBuildingCard('wind-generator-2', 'fixture-wind'),
    createBuildingCard('weapon-workshop-3', 'fixture-weapon'),
  );
  return player;
}
