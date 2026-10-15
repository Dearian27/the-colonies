import { gameConfig } from '../game/config';

export function RoundHelp() {
  return <details className="round-help"><summary>Картка-підказка · фази кола</summary>
    <ol>{gameConfig.phases.map((phase) => <li key={phase.id}><div><strong>{phase.name}</strong><span className={phase.implemented ? 'phase-ready' : 'phase-planned'}>{phase.implemented ? 'Реалізовано' : 'Заплановано'}</span></div><p>{phase.description}</p></li>)}</ol>
    <p className="round-help-note">Події монстрів і дебафи ще не розігруються. Кожен кидок починає нове коло; лідер поки не змінюється.</p>
  </details>;
}
