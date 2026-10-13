import { useState } from 'react';
import { createBuildingCard } from '../../game/buildings';
import { cardCatalog, type EffectCardDefinition } from '../../game/cards';
import { resources } from '../../game/resources';
import { InstallationCard } from '../InstallationCard';
import { Symbol } from '../Symbol';
import { ResourceIcon } from '../ResourceIcon';
import { ReferenceLayout } from './ReferenceLayout';

function EffectCard({ card }: { card: EffectCardDefinition }) {
  const placeholder = card.status === 'placeholder';
  return <article className={`catalog-template ${card.type === 'monster' ? 'monster-template' : ''}`} aria-label={`${placeholder ? 'Заготовка' : 'Карта'}: ${card.name}`}>
    <span className="template-kind">{card.typeLabel}</span><h3>{card.name}</h3>
    <div className="template-icon" aria-hidden="true">{card.iconKind === 'emoji' ? card.icon : <Symbol name={card.icon} />}</div>
    <div className="template-effects">{card.effects.map((effect, index) => <div key={index}><strong>{effect.label}</strong><span>{effect.text ?? 'Ще не визначено'}</span></div>)}</div>
    <span className="template-stamp">{placeholder ? 'ЗАГОТОВКА · НЕ ІГРОВА КАРТА' : 'КАРТА ПРОТОТИПУ'}</span>
  </article>;
}

export function CardsPage() {
  const [category, setCategory] = useState('all');
  const definedCount = cardCatalog.cards.filter((card) => card.status === 'prototype').length;
  const visible = cardCatalog.categories.filter((item) => category === 'all' || item.id === category);
  return <ReferenceLayout active="cards">
    <div className="reference-hero"><div><span className="eyebrow">КАРТОТЕКА КОЛОНІЙ</span><h1>Карти, з яких складається світ.</h1><p>Установки, оснащення й загрози — в одному каталозі.</p></div><span className="reference-badge">Контент прототипу · визначено карт: {definedCount}</span></div>
    <div className="catalog-content">
      <div className="reference-notice"><span>↳</span><p>Усі категорії та карти завантажуються з <code>src/game/cards.json</code>. Заготовки позначені окремо й не додаються до ігрових колод. Текст ефекту в каталозі ще не означає його реалізацію в рушії.</p></div>
      <nav className="catalog-filters" aria-label="Категорії карт"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Усі категорії</button>{cardCatalog.categories.map((item) => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.title}</button>)}</nav>
      <div className="catalog-sections">{visible.map((item) => {
        const cards = cardCatalog.cards.filter((card) => card.categoryId === item.id);
        const defined = cards.filter((card) => card.status === 'prototype').length;
        return <section className={`catalog-section catalog-section-${item.id}`} key={item.id} aria-labelledby={`category-${item.id}`}>
          <header><Symbol name={item.symbol} /><div><h2 id={`category-${item.id}`}>{item.title}</h2><span>{defined ? `Карт у прототипі: ${defined}` : 'Карти ще не визначені'}</span></div></header>
          <p className="catalog-description">{item.description}</p>
          <div className="catalog-entries">{cards.map((card) => <div className="catalog-entry" key={card.id}>
            <div className="catalog-card-preview">{card.type === 'installation' && card.status === 'prototype' ? <InstallationCard card={createBuildingCard(card.id, `catalog-${card.id}`)} /> : card.type !== 'installation' ? <EffectCard card={card} /> : <article className="catalog-template" aria-label={`Заготовка: ${card.name}`}><span className="template-kind">{card.typeLabel}</span><h3>{card.name}</h3><div className="template-icon"><Symbol name={card.icon} /></div><span className="template-stamp">ЗАГОТОВКА · НЕ ІГРОВА КАРТА</span></article>}</div>
            <div className="catalog-entry-caption"><strong>{card.name}</strong><code>{card.id}</code></div>
            {card.type === 'installation' ? <details className="catalog-properties"><summary>Параметри карти</summary><dl><dt>Вихід у макеті</dt><dd>{card.production.amount} <ResourceIcon type={card.production.resource} /></dd><dt>Слоти</dt><dd>{card.storage.slotCount}</dd><dt>Тип ресурсу</dt><dd>{resources[card.storage.resource].label}</dd><dt>Умова</dt><dd>{card.production.trigger === 'sun' ? '☀️ Сонце' : card.production.trigger === 'wind' ? '🌬️ Вітер' : 'Не визначено'}</dd></dl>{card.note && <p>{card.note}</p>}</details> : card.note && <p className="catalog-placeholder-note">{card.note}</p>}
          </div>)}</div>
          {!cards.length && <p className="catalog-placeholder-note">У цій категорії поки немає карт.</p>}
          {item.note && <p className="catalog-placeholder-note">{item.note}</p>}
          <a className="catalog-rule-link" href={`#/rules?section=${item.rule}`}>Правила категорії ↗</a>
        </section>;
      })}</div>
    </div>
  </ReferenceLayout>;
}
