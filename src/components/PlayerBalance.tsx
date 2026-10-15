import type { PlayerState } from '../game/state';
import { getPlayerBalance } from '../game/rules';
import { resources, type ResourceType } from '../game/resources';
import { ResourceIcon } from './ResourceIcon';

export function PlayerBalance({ player, label = 'Баланс гравця' }: { player: PlayerState; label?: string }) {
  const balance = getPlayerBalance(player);
  return <div className="player-balance" role="group" aria-label={label} aria-live="polite" aria-atomic="true">
    {(['coin', 'weapon', 'energy'] as ResourceType[]).map((type) => <span key={type} aria-label={`${resources[type].label}: ${balance[type]}`}><strong>{balance[type]}</strong><ResourceIcon type={type} /></span>)}
  </div>;
}
