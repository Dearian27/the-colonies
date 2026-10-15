import { describe, expect, it } from 'vitest';
import rawCatalog from './cards.json';
import rawConfig from './game-config.json';
import { parseCardCatalog } from './cards';
import { validateGameConfig } from './config';

describe('JSON validation', () => {
  it('reads wallet without slots, seven slotted installations and aircraft 2/4/0', () => {
    const catalog = parseCardCatalog(rawCatalog);
    const core = catalog.cards.find((card) => card.id === 'main-dome');
    expect(core?.type).toBe('installation'); if (core?.type === 'installation') expect(core.storage).toEqual({ mode: 'wallet', resource: 'coin' });
    const craft = catalog.cards.find((card) => card.id === 'basic-aircraft');
    expect(craft?.type).toBe('aircraft'); if (craft?.type === 'aircraft') expect(craft.stats).toEqual({ initiative: 2, cargoCapacity: 4, boosterSlots: 0 });
  });
  it.each([
    ['unknown resource', (data: any) => { data.cards[1].production.resource = 'bad'; }],
    ['four storage slots', (data: any) => { data.cards[1].storage.slotCount = 4; }],
    ['coin slots', (data: any) => { data.cards[0].storage = { mode: 'slots', resource: 'coin', slotCount: 1 }; }],
    ['wallet slots', (data: any) => { data.cards[0].storage.slotCount = 1; }],
    ['resource mismatch', (data: any) => { data.cards[1].storage.resource = 'weapon'; }],
    ['negative production', (data: any) => { data.cards[1].production.amount = -1; }],
    ['duplicate id', (data: any) => { data.cards[1].id = data.cards[0].id; }],
    ['missing category', (data: any) => { data.cards[1].categoryId = 'missing'; }],
    ['wrong category type', (data: any) => { data.cards[1].categoryId = 'aircraft'; }],
    ['negative aircraft initiative', (data: any) => { data.cards.find((card: any) => card.type === 'aircraft').stats.initiative = -1; }],
    ['fractional aircraft cargo', (data: any) => { data.cards.find((card: any) => card.type === 'aircraft').stats.cargoCapacity = 2.5; }],
    ['negative booster slots', (data: any) => { data.cards.find((card: any) => card.type === 'aircraft').stats.boosterSlots = -1; }],
    ['unknown trigger', (data: any) => { data.cards[1].production.trigger = 'rain'; }],
  ])('rejects %s', (_, mutate) => { const data = structuredClone(rawCatalog); mutate(data); expect(() => parseCardCatalog(data)).toThrow('cards.json:'); });
  it('validates start references and market uniqueness', () => {
    expect(validateGameConfig(structuredClone(rawConfig))).toEqual(rawConfig);
    const bad = structuredClone(rawConfig); bad.market.installationIds[0] = 'main-dome'; expect(() => validateGameConfig(bad)).toThrow();
    const duplicate = structuredClone(rawConfig); duplicate.market.installationIds[1] = duplicate.market.installationIds[0]; expect(() => validateGameConfig(duplicate)).toThrow();
    const slots = structuredClone(rawConfig); slots.starting.aircraft[0] = 'missing'; expect(() => validateGameConfig(slots)).toThrow();
  });
});
