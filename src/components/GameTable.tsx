import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { BoardProps } from "boardgame.io/react";
import type { ColoniesState } from "../game/Colonies";
import { Symbol } from "./Symbol";
import { InstallationCard } from "./InstallationCard";
import { ResourceChip } from "./ResourceSlot";
import { ResourceIcon } from "./ResourceIcon";
import { buildings } from "../game/buildings";
import { resources } from "../game/resources";
import { diceDefinitions, diceFaces, getDiceFace } from "../game/dice";
import type { CardInspection, TableView } from "./table3d/TableScene";

const TableScene = lazy(() =>
  import("./table3d/TableScene").then((module) => ({
    default: module.TableScene,
  }))
);

type TableProps = BoardProps<ColoniesState> & { onExit: () => void };

function CardPreview({
  inspection,
  onClose,
}: {
  inspection: CardInspection;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      className="card-preview"
      ref={dialogRef}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="preview-title"
    >
      <div className="preview-content">
        <button
          className="preview-close"
          onClick={onClose}
          aria-label="Закрити перегляд"
        >
          ×
        </button>
        <span className="eyebrow" id="preview-title">
          {inspection.owner ?? "МОЯ РУКА"}
        </span>
        {inspection.kind === "building" ? (
          <InstallationCard card={inspection.card} />
        ) : (
          <div
            className="blank-card preview-blank"
            role="img"
            aria-label={inspection.owner ? "Порожня карта секції" : "Порожня карта підсилення"}
          >
            <div className="card-inner" />
          </div>
        )}
        <p>
          {inspection.kind === "building"
            ? "Установка колонії"
            : inspection.owner
              ? "Карта секції · властивості додамо пізніше."
              : "Тут з’являться карти підсилення."}
        </p>
      </div>
    </dialog>
  );
}

export function GameTable({ G, playerID, moves, onExit }: TableProps) {
  const [inspection, setInspection] = useState<CardInspection | null>(null);
  const [reset, setReset] = useState(0);
  const [view, setView] = useState<TableView>("player");
  const [cameraAngle, setCameraAngle] = useState(62);
  const [cameraZoom, setCameraZoom] = useState<Record<TableView, number>>({
    player: 1,
    top: 1,
  });
  const changeZoom = (zoom: number) =>
    setCameraZoom((current) =>
      current[view] === zoom ? current : { ...current, [view]: zoom }
    );
  const id = playerID ?? "0";
  const player = G.players[id];
  return (
    <main className="table3d-screen">
      <header className="table-header">
        <button className="back-button" onClick={onExit}>
          <Symbol name="back" />
          Меню
        </button>
        <div className="table-brand">
          <Symbol name="compass" />
          <span>COLONIES</span>
        </div>
        <span className="scene-label">
          <span className="status-dot" />
          3D-стіл · {Object.keys(G.players).length} гравці
        </span>
      </header>
      <div
        className="scene-canvas"
        aria-label="Тривимірний стіл із колоніями трьох гравців, центральним планшетом і руками карт"
      >
        <Suspense
          fallback={<div className="scene-loading">Готуємо ігровий стіл…</div>}
        >
          <TableScene
            G={G}
            playerID={id}
            onInspect={setInspection}
            reset={reset}
            view={view}
            angle={cameraAngle}
            zoom={cameraZoom[view]}
            onZoomChange={changeZoom}
          />
        </Suspense>
      </div>
      <div className="scene-toolbar">
        <span>Перетягни — переміщення · колесо — масштаб</span>
        <div className="view-controls" role="group" aria-label="Вигляд столу">
          <button
            aria-pressed={view === "player"}
            onClick={() => setView("player")}
          >
            Від гравця
          </button>
          <button aria-pressed={view === "top"} onClick={() => setView("top")}>
            Зверху
          </button>
          <button
            onClick={() => {
              changeZoom(1);
              setReset((value) => value + 1);
            }}
          >
            Початковий ракурс
          </button>
        </div>
      </div>
      <details className="camera-debug" open>
        <summary>Камера · дебаг</summary>
        <label htmlFor="camera-angle">
          Кут над столом{" "}
          <output htmlFor="camera-angle">
            {view === "top" ? "90°" : `${cameraAngle}°`}
          </output>
        </label>
        <input
          id="camera-angle"
          type="range"
          min="20"
          max="80"
          step="1"
          value={cameraAngle}
          disabled={view === "top"}
          onChange={(event) => setCameraAngle(Number(event.target.value))}
        />
        <div className="camera-angle-range">
          <span>20° · нижче</span>
          <span>80° · вище</span>
        </div>
        <p>
          {view === "top"
            ? "Огляд зверху має фіксований кут 90°."
            : "Кут змінюється наживо, без зміни масштабу."}
        </p>
        <button onClick={() => setCameraAngle(55)}>Скинути кут</button>
        <label htmlFor="camera-zoom">
          Зум{" "}
          <output htmlFor="camera-zoom">
            {Math.round(cameraZoom[view] * 100)}%
          </output>
        </label>
        <input
          id="camera-zoom"
          type="range"
          min="50"
          max="180"
          step="1"
          value={Math.round(cameraZoom[view] * 100)}
          onChange={(event) => changeZoom(Number(event.target.value) / 100)}
        />
        <div className="camera-angle-range">
          <span>50% · далі</span>
          <span>180% · ближче</span>
        </div>
        <button onClick={() => changeZoom(1)}>Скинути зум</button>
      </details>
      <section className="dice-controls" aria-label="Кидок кубиків">
        <span className="eyebrow">КУБИКИ КОЛА</span>
        <button onClick={() => moves.rollDice()} disabled={id !== G.leaderID}>Кинути 4 кубики</button>
        <div className="dice-results" aria-live="polite" aria-atomic="true">
          {G.dice.length ? G.dice.map((value, index) => {
            const face = getDiceFace(index, value);
            return <span key={index} title={face.label} aria-label={`Кубик ${index + 1}: ${face.label}`}>{face.icon}</span>;
          }) : <p>Очікують першого кидка</p>}
        </div>
        <p>{G.diceRollCount ? `Кидок №${G.diceRollCount} · ефекти ще не реалізовані` : 'Чотири різні кубики прогнозу'}</p>
        <details className="dice-face-list">
          <summary>Грані кубиків</summary>
          {diceDefinitions.map((die, index) => <div key={die.id} aria-label={`Грані кубика ${index + 1}`}><span>{index + 1}</span>{die.faces.map((face, faceIndex) => <span key={faceIndex} title={diceFaces[face].label} aria-label={diceFaces[face].label}>{diceFaces[face].icon}</span>)}</div>)}
        </details>
      </section>
      <aside className="colony-summary" aria-label="Моя колонія">
        <span className="eyebrow">МІЙ ПРИХИСТОК</span>
        <h2>Колонія 1</h2>
        {player.colony.map((card) => {
          const definition = buildings[card.definitionId];
          return (
            <button
              className="colony-shortcut"
              key={card.id}
              onClick={() =>
                setInspection({ kind: "building", card, owner: "МОЯ КОЛОНІЯ" })
              }
            >
              <Symbol name={definition.icon} />
              <span>{definition.name}</span>
              <span>
                {definition.production.amount}{" "}
                <ResourceIcon type={definition.production.resource} />
              </span>
            </button>
          );
        })}
        {player.resources.length > 0 && (
          <div className="resource-pool">
            {player.resources.map((token) => (
              <ResourceChip key={token.id} type={token.type} />
            ))}
          </div>
        )}
        <p>Відкрий карту, щоб роздивитися.</p>
      </aside>
      <section className="hand-dock" aria-labelledby="hand-title">
        <div className="dock-heading">
          <span className="eyebrow" id="hand-title">
            МОЯ РУКА
          </span>
          <span>{player.hand.length} карт</span>
        </div>
        <div className="dock-cards">
          {player.hand.map((card, index) => (
            <button
              key={card.id}
              className="blank-card dock-card"
              style={
                {
                  "--card-angle": `${
                    (index - (player.hand.length - 1) / 2) * 4
                  }deg`,
                } as CSSProperties
              }
              aria-label={`Переглянути карту підсилення ${index + 1}`}
              onClick={() => setInspection({ kind: "blank", id: card.id })}
            >
              <span className="card-inner" />
            </button>
          ))}
        </div>
      </section>
      {inspection && (
        <CardPreview
          inspection={inspection}
          onClose={() => setInspection(null)}
        />
      )}
    </main>
  );
}
