import type { ReactNode } from 'react';
import { Symbol } from '../Symbol';
import './reference.css';

export function ReferenceLayout({ active, children }: { active: 'rules' | 'tests' | 'cards'; children: ReactNode }) {
  return <main className="reference-screen">
    <header className="reference-header">
      <a className="reference-brand" href="#/"><Symbol name="compass" /><span>COLONIES <small>МАЙСТЕРНЯ ГРИ</small></span></a>
      <nav aria-label="Навігація майстерні">
        <a href="#/rules" aria-current={active === 'rules' ? 'page' : undefined}>Правила</a>
        <a href="#/cards" aria-current={active === 'cards' ? 'page' : undefined}>Карти</a>
        <a href="#/tests" aria-current={active === 'tests' ? 'page' : undefined}>Тест-кейси</a>
        <a href="#/">До меню ↗</a>
      </nav>
    </header>
    {children}
    <footer className="reference-footer">COLONIES / ПРОТОТИП <span>Правила розвиваються разом із грою.</span></footer>
  </main>;
}
