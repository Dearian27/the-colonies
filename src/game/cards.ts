import rawCatalog from './cards.json';
import { resources, type ResourceType } from './resources';

export type CardType = 'installation' | 'booster' | 'monster' | 'aircraft';
const cardTypes: readonly CardType[] = ['installation', 'booster', 'monster', 'aircraft'];
export interface CardCategory {
  id: string; type: CardType; title: string; symbol: string; description: string; rule: string; note: string;
}
interface CardBase {
  id: string; categoryId: string; type: CardType; status: 'prototype' | 'placeholder';
  name: string; icon: string; iconKind: 'symbol' | 'emoji'; typeLabel: string; note: string;
}
export interface InstallationDefinition extends CardBase {
  type: 'installation';
  production: { resource: ResourceType; amount: number; trigger: 'round' | 'sun' | 'wind' | null };
  storage: { mode: 'wallet'; resource: 'coin' } | { mode: 'slots'; resource: 'weapon' | 'energy'; slotCount: 1 | 2 | 3 };
}
export interface AircraftDefinition extends CardBase {
  type: 'aircraft';
  stats: { initiative: number; cargoCapacity: number; boosterSlots: number };
}
export interface EffectCardDefinition extends CardBase {
  type: 'booster' | 'monster';
  // Descriptive content, not executable gameplay effects.
  effects: { label: string; text: string | null }[];
}
export type CardDefinition = InstallationDefinition | EffectCardDefinition | AircraftDefinition;
export interface CardCatalog { schemaVersion: number; categories: CardCategory[]; cards: CardDefinition[] }

function fail(path: string, message: string): never { throw new Error(`cards.json: ${path} — ${message}`); }
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'очікується об’єкт');
  return value as Record<string, unknown>;
}
function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'очікується масив');
  return value;
}
function string(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) fail(path, 'очікується текст');
  return value;
}
function choice<T extends string>(value: unknown, options: readonly T[], path: string): T {
  if (typeof value !== 'string' || !options.includes(value as T)) fail(path, `дозволено: ${options.join(', ')}`);
  return value as T;
}
function resource(value: unknown, path: string): ResourceType {
  return choice(value, Object.keys(resources) as ResourceType[], path);
}
function unique(items: { id: string }[], path: string) {
  const ids = new Set<string>();
  for (const item of items) { if (ids.has(item.id)) fail(path, `повторний id: ${item.id}`); ids.add(item.id); }
}
function nonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) fail(path, 'очікується невід’ємне ціле число');
  return value;
}

export function parseCardCatalog(input: unknown): CardCatalog {
  const root = object(input, 'catalog');
  if (root.schemaVersion !== 2) fail('schemaVersion', 'підтримується версія 2');
  const categories = array(root.categories, 'categories').map((value, index): CardCategory => {
    const path = `categories[${index}]`; const item = object(value, path);
    return {
      id: string(item.id, `${path}.id`), type: choice(item.type, cardTypes, `${path}.type`),
      title: string(item.title, `${path}.title`), symbol: string(item.symbol, `${path}.symbol`),
      description: string(item.description, `${path}.description`), rule: string(item.rule, `${path}.rule`), note: string(item.note, `${path}.note`, true),
    };
  });
  unique(categories, 'categories');
  const cards = array(root.cards, 'cards').map((value, index): CardDefinition => {
    const path = `cards[${index}]`; const item = object(value, path);
    const base: CardBase = {
      id: string(item.id, `${path}.id`), categoryId: string(item.categoryId, `${path}.categoryId`),
      type: choice(item.type, cardTypes, `${path}.type`),
      status: choice(item.status, ['prototype', 'placeholder'], `${path}.status`),
      name: string(item.name, `${path}.name`), icon: string(item.icon, `${path}.icon`),
      iconKind: choice(item.iconKind, ['symbol', 'emoji'], `${path}.iconKind`),
      typeLabel: string(item.typeLabel, `${path}.typeLabel`), note: string(item.note, `${path}.note`, true),
    };
    const category = categories.find((entry) => entry.id === base.categoryId);
    if (!category) fail(`${path}.categoryId`, 'категорію не знайдено');
    if (category.type !== base.type) fail(`${path}.type`, 'тип не відповідає категорії');
    if (base.type === 'aircraft') {
      const stats = object(item.stats, `${path}.stats`);
      if (base.iconKind !== 'symbol') fail(`${path}.iconKind`, 'транспорт використовує symbol');
      return { ...base, type: 'aircraft', stats: {
        initiative: nonNegativeInteger(stats.initiative, `${path}.stats.initiative`),
        cargoCapacity: nonNegativeInteger(stats.cargoCapacity, `${path}.stats.cargoCapacity`),
        boosterSlots: nonNegativeInteger(stats.boosterSlots, `${path}.stats.boosterSlots`),
      } };
    }
    if (base.type === 'installation') {
      const production = object(item.production, `${path}.production`);
      const storage = object(item.storage, `${path}.storage`);
      const amount = nonNegativeInteger(production.amount, `${path}.production.amount`);
      const produced = resource(production.resource, `${path}.production.resource`);
      let parsedStorage: InstallationDefinition['storage'];
      const mode = choice(storage.mode, ['wallet', 'slots'], `${path}.storage.mode`);
      if (mode === 'wallet') {
        if (storage.resource !== 'coin' || produced !== 'coin') fail(`${path}.storage`, 'гаманець призначений лише для монет');
        if ('slotCount' in storage) fail(`${path}.storage.slotCount`, 'гаманець не має слотів');
        parsedStorage = { mode, resource: 'coin' };
      } else {
        if (storage.slotCount !== 1 && storage.slotCount !== 2 && storage.slotCount !== 3) fail(`${path}.storage.slotCount`, 'дозволено 1, 2 або 3');
        const stored = choice(storage.resource, ['weapon', 'energy'], `${path}.storage.resource`);
        if (stored !== produced) fail(`${path}.storage.resource`, 'ресурс виробництва й слотів має збігатися');
        parsedStorage = { mode, resource: stored, slotCount: storage.slotCount };
      }
      if (base.iconKind !== 'symbol') fail(`${path}.iconKind`, 'установки використовують symbol');
      const trigger = production.trigger == null ? null : choice(production.trigger, ['round', 'sun', 'wind'], `${path}.production.trigger`);
      return { ...base, type: 'installation', production: { resource: produced, amount, trigger }, storage: parsedStorage };
    }
    const effects = array(item.effects, `${path}.effects`).map((value, effectIndex) => {
      const effectPath = `${path}.effects[${effectIndex}]`; const effect = object(value, effectPath);
      return { label: string(effect.label, `${effectPath}.label`), text: effect.text === null ? null : string(effect.text, `${effectPath}.text`) };
    });
    return { ...base, type: base.type, effects };
  });
  unique(cards, 'cards');
  return { schemaVersion: 2, categories, cards };
}

export const cardCatalog = parseCardCatalog(rawCatalog);
export const installationDefinitions = cardCatalog.cards.filter((card): card is InstallationDefinition => card.type === 'installation' && card.status === 'prototype');
export const aircraftDefinitions = cardCatalog.cards.filter((card): card is AircraftDefinition => card.type === 'aircraft' && card.status === 'prototype');
