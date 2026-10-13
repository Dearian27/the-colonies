import config from './dice-config.json';

export const diceFaces: Record<string, { icon: string; label: string }> = {
  sun: { icon: '☀️', label: 'Сонце' },
  wind: { icon: '🌬️', label: 'Вітер' },
  deposits: { icon: '🪨', label: 'Оголені поклади' },
  wreckage: { icon: '⚙️', label: 'Уламки старого світу' },
  monster: { icon: '👹', label: 'Монстр' },
};

// Every array entry is one equally likely face, including duplicates.
export const diceDefinitions = config.dice;

export function getDiceFace(dieIndex: number, rolledValue: number) {
  return diceFaces[diceDefinitions[dieIndex].faces[rolledValue - 1]];
}
