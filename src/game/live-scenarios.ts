import { aircraft } from './aircraft';
import { gameConfig } from './config';
import { applyProduction, createInitialPlayer, createInitialState, getPlayerBalance, resolveRound } from './rules';
import { productionFixture } from './scenario-fixtures';
import type { TestScenario } from './test-scenarios';

export interface ScenarioCheck { label: string; actual: string | number | boolean; expected: string | number | boolean }
export interface ScenarioRun { checks: ScenarioCheck[]; passed: boolean }
function result(checks: ScenarioCheck[]): ScenarioRun { return { checks, passed: checks.every((check) => Object.is(check.actual, check.expected)) }; }

export const executableScenarios: TestScenario[] = [
  { id: 'START-01', category: 'Старт', title: 'Стартовий набір гравця', ruleSection: '2',
    given: 'Нова колонія перед першим кидком; жодного доходу ще не нараховано.', action: 'Створити гравця через createInitialPlayer й прочитати баланс та транспорт.',
    expected: '5 дослідників, 3 монети, Осердя без слотів і один конвертоплан 2/4/0.', note: 'Сценарій виконує ту саму фабрику, яку використовує setup гри.', result: ['5 дослідників', '3 монети', 'Конвертоплан 2/4/0'],
    execute: () => {
      const player = createInitialPlayer('scenario'); const craft = aircraft[player.aircraft[0].definitionId];
      return result([
        { label: 'Дослідники', actual: player.researchers.length, expected: 5 },
        { label: 'Монети', actual: getPlayerBalance(player).coin, expected: 3 },
        { label: 'Установки', actual: player.colony.length, expected: 1 },
        { label: 'Слоти Осердя', actual: player.colony[0].slots.length, expected: 0 },
        { label: 'Конвертоплани', actual: player.aircraft.length, expected: 1 },
        { label: 'Ініціатива', actual: craft.stats.initiative, expected: 2 },
        { label: 'Вантажність', actual: craft.stats.cargoCapacity, expected: 4 },
        { label: 'Підсилювачі', actual: player.aircraft[0].boosters.length, expected: 0 },
      ]);
    } },
  { id: 'BAL-01', category: 'Баланс', title: 'Баланс із фішок установок', ruleSection: '6',
    given: 'У гаманці 3 монети. Сонячна й вітрова установки мають по 1 енергії; збройна — 2 зброї.', action: 'Підрахувати getPlayerBalance без окремого лічильника фішок.',
    expected: 'Баланс: 3 монети, 2 енергії, 2 зброї.', note: 'Фішки розташовані у підготовленому тестовому стані, не додаються гравцям на старті.', result: ['3 монети', '2 енергії', '2 зброї'],
    execute: () => {
      const player = productionFixture();
      player.colony[1].slots[0] = { id: 'balance-solar', type: 'energy' };
      player.colony[2].slots[0] = { id: 'balance-wind', type: 'energy' };
      player.colony[3].slots[0] = { id: 'balance-weapon-0', type: 'weapon' };
      player.colony[3].slots[2] = { id: 'balance-weapon-2', type: 'weapon' };
      const balance = getPlayerBalance(player);
      return result([{ label: 'Монети', actual: balance.coin, expected: 3 }, { label: 'Енергія', actual: balance.energy, expected: 2 }, { label: 'Зброя', actual: balance.weapon, expected: 2 }]);
    } },
  { id: 'PROD-01', category: 'Виробництво', title: 'Сонце й вітер дають спільну енергію', ruleSection: '6',
    given: 'Осердя, сонячна й вітрова установки на 2 слоти та порожня збройна майстерня.', action: 'Застосувати прогноз із двома сонцями й двома вітрами.',
    expected: 'Монети: 4; енергія: 4 (по 2 на установці); зброя: 0.', note: 'Виконується applyProduction. Бойові й катастрофічні ефекти не входять у цей сценарій.', dice: ['sun', 'wind', 'sun', 'wind'], result: ['+1 монета', '4 енергії', '0 зброї'],
    execute: () => {
      const player = applyProduction(productionFixture(), [1, 2, 1, 2], 1); const balance = getPlayerBalance(player);
      return result([{ label: 'Монети', actual: balance.coin, expected: 4 }, { label: 'Сонячні фішки', actual: player.colony[1].slots.filter(Boolean).length, expected: 2 }, { label: 'Вітрові фішки', actual: player.colony[2].slots.filter(Boolean).length, expected: 2 }, { label: 'Енергія разом', actual: balance.energy, expected: 4 }, { label: 'Зброя', actual: balance.weapon, expected: 0 }]);
    } },
  { id: 'CAP-01', category: 'Виробництво', title: 'Переповнення не створює зайвих фішок', ruleSection: '6',
    given: 'Сонячна установка на 2 слоти вже має 1 фішку; прогноз — чотири сонця.', action: 'Застосувати виробництво та перевірити стару фішку й місткість.',
    expected: 'З’являється лише 1 нова енергія; стара фішка зберігає ID; вітрова установка не активується.', note: 'Надлишок не потрапляє в третю секцію. Немає окремого запасу вільних фішок.', dice: ['sun', 'sun', 'sun', 'sun'], result: ['2 фішки в сонячній', 'Стара фішка збережена', '0 у вітровій'],
    execute: () => {
      const initial = productionFixture(); initial.colony[1].slots[0] = { id: 'existing-energy', type: 'energy' };
      const player = applyProduction(initial, [1, 1, 1, 1], 1);
      return result([{ label: 'Енергія разом', actual: getPlayerBalance(player).energy, expected: 2 }, { label: 'Слоти сонячної', actual: player.colony[1].slots.length, expected: 2 }, { label: 'Стара фішка', actual: player.colony[1].slots[0]?.id ?? '', expected: 'existing-energy' }, { label: 'Вітрова енергія', actual: player.colony[2].slots.filter(Boolean).length, expected: 0 }, { label: 'Початковий стан не змінено', actual: initial.colony[1].slots.filter(Boolean).length, expected: 1 }]);
    } },
  { id: 'MARK-01', category: 'Магазин', title: 'Новий кидок оновлює магазин і дохід', ruleSection: '4',
    given: 'Три гравці на старті та 4 карти магазину до першого кидка.', action: 'Виконати resolveRound із фіксованими гранями й новим порядком карт.',
    expected: 'Коло 1, по 4 монети, чотири унікальні допустимі карти з новими ID; розвиток незмінний.', note: 'Тут порядок вибірки фіксований. Автотести boardgame.io додатково перевіряють випадковість зі seed.', dice: ['monster', 'monster', 'monster', 'wreckage'], result: ['Коло 1', '4 карти магазину', '+1 монета кожному'],
    execute: () => {
      const initial = createInitialState(3, gameConfig.market.installationIds);
      const next = resolveRound(initial, [5, 5, 5, 6], [...gameConfig.market.installationIds].reverse());
      return result([{ label: 'Коло', actual: next.round, expected: 1 }, { label: 'Карт магазину', actual: next.market.length, expected: 4 }, { label: 'Унікальних карт', actual: new Set(next.market.map((card) => card.definitionId)).size, expected: 4 }, { label: 'Нові ID всіх карт', actual: next.market.every((card) => !initial.market.some((old) => old.id === card.id)), expected: true }, { label: 'Усі мають 4 монети', actual: Object.values(next.players).every((player) => player.coins === 4), expected: true }, { label: 'Розвиток незмінний', actual: JSON.stringify(next.sectionCards) === JSON.stringify(initial.sectionCards), expected: true }]);
    } },
];
