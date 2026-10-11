import { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { Colonies } from './game/Colonies';
import { GameTable } from './components/GameTable';
import { Symbol } from './components/Symbol';

const GameClient = Client({ game: Colonies, board: GameTable, numPlayers: 3, debug: false });

export default function App() {
  const [playing, setPlaying] = useState(false);

  if (playing) return <GameClient playerID="0" onExit={() => setPlaying(false)} />;

  return (
    <main className="menu-screen">
      <div className="menu-top"><span>НАСТІЛЬНА ГРА</span><span>ПРОТОТИП / 0.1</span></div>
      <div className="menu-orbit orbit-one" aria-hidden="true" /><div className="menu-orbit orbit-two" aria-hidden="true" />
      <section className="menu-content" aria-labelledby="game-title">
        <div className="menu-emblem"><Symbol name="compass" /></div>
        <span className="eyebrow">ПРИХИСТОК СЕРЕД БУРІ</span>
        <h1 id="game-title">COLONIES<span>КОЛОНІЇ</span></h1>
        <p>Світ змінився.<br />Знайди своє місце в ньому.</p>
        <button className="start-button" onClick={() => setPlaying(true)}><span>Старт</span><Symbol name="arrow" /></button>
        <span className="menu-note">Розбудовуй. Досліджуй. Відкривай минуле.</span>
      </section>
      <footer className="menu-footer"><span>НОВИЙ СВІТ ЧЕКАЄ</span><span>∞</span><span>THE COLONIES</span></footer>
    </main>
  );
}
