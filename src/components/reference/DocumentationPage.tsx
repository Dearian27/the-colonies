import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rules from '../../../docs/game-design.md?raw';
import rulesUrl from '../../../docs/game-design.md?url';
import { ReferenceLayout } from './ReferenceLayout';

// Organize the original Markdown for reading without copying its rules into UI code.
const headings = [...rules.matchAll(/^## (\d+)\. (.+)$/gm)];
const revisionDate = rules.match(/Останнє уточнення правил: (\d{4})-(\d{2})-(\d{2})/);
const revisionLabel = revisionDate ? `${revisionDate[3]}.${revisionDate[2]}.${revisionDate[1]}` : 'Робоча редакція';
const sections = headings.map((heading, index) => ({
  id: heading[1], title: heading[2],
  markdown: rules.slice(heading.index, headings[index + 1]?.index ?? rules.length).trim(),
}));
const groups = [
  { title: 'Світ і перебіг гри', ids: ['1', '2', '3', '4'] },
  { title: 'Механіки й компоненти', ids: ['5', '6', '7', '8', '9'] },
  { title: 'Дизайн і відкриті питання', ids: ['10', '11'] },
];

export function DocumentationPage({ sectionId }: { sectionId: string | null }) {
  const [query, setQuery] = useState('');
  const selected = sections.find((section) => section.id === sectionId) ?? sections[0];
  const matches = sections.filter((section) => section.markdown.toLocaleLowerCase('uk').includes(query.trim().toLocaleLowerCase('uk')));
  const selectedIndex = sections.indexOf(selected);
  return <ReferenceLayout active="rules">
    <div className="reference-hero"><div><span className="eyebrow">ДОВІДНИК КОЛОНІСТА</span><h1>Світ. Правила. Можливості.</h1><p>Єдина робоча редакція задуму — від лору до деталей механік.</p></div><span className="reference-badge">Робочі правила · {revisionLabel}</span></div>
    <div className="reference-grid">
      <aside className="reference-sidebar">
        <label className="reference-search">Пошук у правилах<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Монстри, ініціатива…" /></label>
        {query && <p className="search-count">Знайдено розділів: {matches.length}</p>}
        <nav aria-label="Розділи правил">{groups.map((group) => {
          const items = matches.filter((section) => group.ids.includes(section.id));
          return items.length ? <div className="sidebar-group" key={group.title}><h2>{group.title}</h2>{items.map((section) => <a href={`#/rules?section=${section.id}`} key={section.id} aria-current={selected.id === section.id ? 'page' : undefined}><span>{section.id.padStart(2, '0')}</span>{section.title}</a>)}</div> : null;
        })}</nav>
        {!matches.length && <p>Нічого не знайдено. Спробуй інше слово.</p>}
        <a className="source-download" href={rulesUrl} download="colonies-rules.md">Завантажити Markdown ↓</a>
      </aside>
      <div className="reference-content">
        <div className="reference-notice"><span>↳</span><p>Це робочий задум, не завершений набір правил. Підтверджені механіки, числові приклади та відкриті рішення позначені в тексті.</p></div>
        <article className="rules-article" key={selected.id} aria-label={selected.title}>
          <div className="article-meta"><span>РОЗДІЛ {selected.id.padStart(2, '0')} / {sections.length}</span><code>docs/game-design.md</code></div>
          <Markdown remarkPlugins={[remarkGfm]} components={{ table: ({ children }) => <div className="markdown-table"><table>{children}</table></div> }}>{selected.markdown}</Markdown>
        </article>
        <nav className="article-pagination" aria-label="Перехід між розділами">
          {selectedIndex > 0 ? <a href={`#/rules?section=${sections[selectedIndex - 1].id}`}>← {sections[selectedIndex - 1].title}</a> : <span />}
          {selectedIndex < sections.length - 1 && <a href={`#/rules?section=${sections[selectedIndex + 1].id}`}>{sections[selectedIndex + 1].title} →</a>}
        </nav>
      </div>
    </div>
  </ReferenceLayout>;
}
