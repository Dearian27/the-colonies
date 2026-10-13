import { useState } from 'react';
import { testScenarios } from '../../game/test-scenarios';
import { diceFaces } from '../../game/dice';
import { ReferenceLayout } from './ReferenceLayout';

const stages = ['Початковий стан', 'Дія', 'Очікуваний результат'];
export function TestCasesPage() {
  const [selectedId, setSelectedId] = useState(testScenarios[0].id);
  const [category, setCategory] = useState('Усі');
  const [query, setQuery] = useState('');
  const [step, setStep] = useState(0);
  const selected = testScenarios.find((scenario) => scenario.id === selectedId)!;
  const filtered = testScenarios.filter((scenario) => (category === 'Усі' || scenario.category === category) && `${scenario.id} ${scenario.title} ${scenario.given}`.toLocaleLowerCase('uk').includes(query.toLocaleLowerCase('uk')));
  return <ReferenceLayout active="tests">
    <div className="reference-hero"><div><span className="eyebrow">ЛАБОРАТОРІЯ МЕХАНІК</span><h1>Правила в конкретних ситуаціях.</h1><p>Розкладай сценарій на кроки й дивись, що має відбутися.</p></div><span className="reference-badge">Макет · без запуску автотестів</span></div>
    <div className="test-overview"><div><strong>{testScenarios.length}</strong><span>демонстраційних сценаріїв</span></div><div><strong>3</strong><span>категорії механік</span></div><div><strong>—</strong><span>результати запуску ще не підключені</span></div></div>
    <div className="reference-grid">
      <aside className="reference-sidebar">
        <label className="reference-search">Пошук сценарію<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Монстр, транспорт, INI-01…" /></label>
        <label className="scenario-filter">Механіка<select value={category} onChange={(event) => setCategory(event.target.value)}>{['Усі', 'Ініціатива', 'Монстри', 'Кубики'].map((value) => <option key={value}>{value}</option>)}</select></label>
        <nav className="scenario-list" aria-label="Тестові сценарії">{filtered.map((scenario) => <button key={scenario.id} aria-current={selected.id === scenario.id ? 'page' : undefined} onClick={() => { setSelectedId(scenario.id); setStep(0); }}><span>{scenario.id} · {scenario.category}</span>{scenario.title}<small>Демонстрація</small></button>)}</nav>
        {!filtered.length && <p>Сценаріїв не знайдено.</p>}
      </aside>
      <div className="reference-content">
        <div className="reference-notice"><span>↳</span><p>Це інтерактивний макет сценаріїв. Кроки показують задані приклади, не виконують ігровий рушій і не підтверджують проходження тестів.</p></div>
        <section className="scenario-detail" aria-labelledby="scenario-title">
          <div className="article-meta"><span>{selected.id} / {selected.category}</span><a href={`#/rules?section=${selected.ruleSection}`}>Пов’язане правило ↗</a></div>
          <h2 id="scenario-title">{selected.title}</h2>
          <nav className="scenario-steps" aria-label="Кроки сценарію">{stages.map((stage, index) => <button key={stage} aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}><span>{index + 1}</span>{stage}</button>)}</nav>
          <div className="scenario-stage" aria-live="polite">
            <span className="eyebrow">{stages[step]}</span><p>{[selected.given, selected.action, selected.expected][step]}</p>
            {step < 2 && selected.groups && <div className="group-visuals">{selected.groups.map((group) => <div className="group-visual" key={group.name}><h3>{group.name} {group.leader && '👑'}</h3><div className="researcher-tokens" aria-label={`${group.researchers} дослідники`}>{Array.from({ length: group.researchers }, (_, index) => <span key={index}>●</span>)}</div><p>{group.aircraft ? `Конвертоплан · +${group.aircraft}` : 'Пішки · без бонусу'}</p>{step === 1 && <strong>Ініціатива: {group.researchers} + {group.aircraft} = {group.initiative}</strong>}</div>)}</div>}
            {step < 2 && selected.dice && <div className="scenario-dice">{selected.dice.map((face, index) => <span key={index} title={diceFaces[face].label} aria-label={diceFaces[face].label}>{diceFaces[face].icon}</span>)}</div>}
            {step === 2 && <ol className="expected-flow">{selected.result.map((result) => <li key={result}>{result}</li>)}</ol>}
          </div>
          <div className="scenario-note">Примітка до прикладу<p>{selected.note}</p></div>
          <div className="scenario-playback"><button disabled={step === 0} onClick={() => setStep(step - 1)}>← Попередній крок</button><span>Крок {step + 1} із 3</span><button disabled={step === 2} onClick={() => setStep(step + 1)}>Наступний крок →</button></div>
        </section>
      </div>
    </div>
  </ReferenceLayout>;
}
