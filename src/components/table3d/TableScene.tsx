import { useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, OrthographicCamera, PerspectiveCamera, RoundedBox } from '@react-three/drei';
import { MOUSE, TOUCH, RepeatWrapping, type Group, type Texture } from 'three';
import type { ColoniesState } from '../../game/Colonies';
import { buildings, type BuildingCard } from '../../game/buildings';
import type { ResourceType } from '../../game/resources';
import { diceFaces } from '../../game/dice';
import { blankTexture, boardTexture, buildingTexture, chipTexture, diceFaceTexture, feltTexture, labelTexture } from './textures';

export type CardInspection = { kind: 'building'; card: BuildingCard; owner: string } | { kind: 'blank'; id: string; owner?: string };
export type TableView = 'player' | 'top';

function useTexture(factory: () => Texture, key: string) {
  const texture = useMemo(factory, [key]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Surface({ texture, width, height, y = .04 }: { texture: Texture; width: number; height: number; y?: number }) {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow><planeGeometry args={[width, height]} /><meshStandardMaterial map={texture} transparent roughness={.9} /></mesh>;
}

function Label({ value, color = '#d1d3b3', width = 3.5 }: { value: string; color?: string; width?: number }) {
  const texture = useTexture(() => labelTexture(value, color), `${value}-${color}`);
  return <Surface texture={texture} width={width} height={width / 7.68} y={.035} />;
}

function Chip({ type, position }: { type: ResourceType; position: [number, number, number] }) {
  const colors = { coin: '#e4bd6e', weapon: '#9eb4b5', energy: '#e6d66f' };
  const icon = useTexture(() => chipTexture(type), type);
  return <group position={position}><mesh castShadow receiveShadow><cylinderGeometry args={[.13, .13, .07, 24]} /><meshStandardMaterial color={colors[type]} roughness={.48} metalness={.15} /></mesh><mesh position={[0, .04, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.1, .113, 24]} /><meshStandardMaterial color="#f7eac8" /></mesh><mesh position={[0, .042, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.18, .18]} /><meshBasicMaterial map={icon} transparent depthWrite={false} /></mesh></group>;
}

function TableCard({ card, hidden = false, onClick }: { card?: BuildingCard; hidden?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const definition = card ? buildings[card.definitionId] : null;
  const texture = useTexture(() => definition ? buildingTexture(definition) : blankTexture(hidden), definition ? definition.id : `blank-${hidden}`);
  return (
    <group position={[0, hovered && onClick ? .16 : .035, 0]} onPointerOver={onClick ? (event) => { event.stopPropagation(); setHovered(true); } : undefined} onPointerOut={() => setHovered(false)} onClick={onClick ? (event) => { event.stopPropagation(); onClick(); } : undefined}>
      <RoundedBox args={[.84, .045, 1.18]} radius={.018} smoothness={2} castShadow receiveShadow><meshStandardMaterial color={hovered && onClick ? '#e5c784' : '#e7e0ca'} roughness={.8} /></RoundedBox>
      <Surface texture={texture} width={.79} height={1.12} y={.027} />
      {definition && card?.slots.map((token, index) => token && <Chip key={token.id} type={token.type} position={[(index - (card.slots.length - 1) / 2) * .175, .07, .36]} />)}
    </group>
  );
}

function Die({ value, index, rollCount }: { value: number; index: number; rollCount: number }) {
  const group = useRef<Group>(null);
  const elapsed = useRef(1);
  const { invalidate } = useThree();
  const textures = useMemo(() => diceFaces.map((face) => diceFaceTexture(face.icon)), []);
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);
  useEffect(() => { elapsed.current = rollCount > 0 ? 0 : 1; invalidate(); }, [rollCount, invalidate]);
  useFrame((_, delta) => {
    if (!group.current) return;
    elapsed.current = Math.min(1, elapsed.current + delta / .75);
    const remaining = 1 - elapsed.current;
    group.current.rotation.set(remaining * Math.PI * 4, index * .12 + remaining * Math.PI * 3, remaining * Math.PI * 2);
    group.current.position.y = .34 + Math.sin(elapsed.current * Math.PI) * .55;
    if (remaining > 0) invalidate();
  });
  const top = value - 1;
  const sides = [0, 1, 2, 3, 4, 5].filter((face) => face !== top);
  const faces = [sides[0], sides[1], top, sides[2], sides[3], sides[4]];
  return <group ref={group} position={[0, .34, 0]}><mesh castShadow receiveShadow><boxGeometry args={[.52, .52, .52]} />{faces.map((face, side) => <meshStandardMaterial key={side} attach={`material-${side}`} map={textures[face]} roughness={.65} />)}</mesh></group>;
}

function DiceTray({ G }: { G: ColoniesState }) {
  return <group position={[6, .08, 3.4]}>
    <RoundedBox args={[2.4, .08, 2.25]} radius={.04} smoothness={3} receiveShadow><meshStandardMaterial color="#243f36" /></RoundedBox>
    <group position={[0, .05, -.9]}><Label value="КУБИКИ КОЛА" width={2} /></group>
    {Array.from({ length: 4 }, (_, index) => <group key={index} position={[(index % 2 - .5) * .85, 0, -.3 + Math.floor(index / 2) * .85]}><Die value={G.dice[index] ?? index + 1} index={index} rollCount={G.diceRollCount} /></group>)}
  </group>;
}

function PlayerZone({ id, G, own, onInspect }: { id: string; G: ColoniesState; own: boolean; onInspect: (value: CardInspection) => void }) {
  const player = G.players[id];
  const label = own ? 'МОЯ КОЛОНІЯ' : `КОЛОНІЯ ${Number(id) + 1}`;
  const color = ['#dfc18b', '#aac5d0', '#c6b3cc'][Number(id) % 3];
  return (
    <group>
      {G.leaderID === id && <Html position={[0, .12, -1.25]} center zIndexRange={[1, 0]}>
        <button className="leader-marker" aria-label="Лідер кола" aria-describedby={`leader-tooltip-${id}`}>
          <svg viewBox="0 0 40 32" aria-hidden="true"><path d="M5 24 2 7l10 7L20 2l8 12 10-7-3 17ZM6 29h28" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
          <span className="leader-tooltip" id={`leader-tooltip-${id}`} role="tooltip">Лідер кола</span>
        </button>
      </Html>}
      <RoundedBox args={[4.5, .025, 2]} position={[0, .013, 0]} radius={.01} smoothness={3} receiveShadow><meshStandardMaterial color="#29473f" roughness={1} /></RoundedBox>
      <group position={[0, .018, -.74]}><Label value={label} color={color} /></group>
      <mesh position={[-1.94, .045, -.72]}><cylinderGeometry args={[.07, .07, .035, 20]} /><meshStandardMaterial color={color} /></mesh>
      {player.colony.map((card, index) => <group position={[-1.18 + index * 1, .04, .12]} key={card.id}><TableCard card={card} onClick={() => onInspect({ kind: 'building', card, owner: label })} /></group>)}
      {[0, 1].map((index) => <mesh position={[-.16 + index, .033, .12]} rotation={[-Math.PI / 2, 0, 0]} key={index}><planeGeometry args={[.84, 1.18]} /><meshStandardMaterial color="#456457" opacity={.3} transparent /></mesh>)}
      {player.resources.map((token, index) => <Chip key={token.id} type={token.type} position={[1.77, .09 + Math.floor(index / 3) * .07, -.2 + (index % 3) * .3]} />)}
      <group position={[0, .025, 1.35]}><Label value={own ? 'МОЯ РУКА' : `${player.hand.length} КАРТ · ЗАКРИТО`} width={2.4} color="#a8ba9e" /></group>
      {player.hand.map((card, index) => {
        const offset = index - (player.hand.length - 1) / 2;
        return <group key={card.id} position={[offset * .48, .05 + index * .008, 2 + Math.abs(offset) * .035]} rotation={[0, -offset * .09, 0]}><TableCard hidden={!own} onClick={own ? () => onInspect({ kind: 'blank', id: card.id }) : undefined} /></group>;
      })}
    </group>
  );
}

function CameraRig({ reset, view, angle, zoom, onZoomChange }: { reset: number; view: TableView; angle: number; zoom: number; onZoomChange: (zoom: number) => void }) {
  const { camera, size } = useThree();
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const defaultTopZoom = Math.max(14, Math.min(size.width / 21, (size.height - 200) / 15.5));
  const defaultDistance = Math.hypot(7.5, 8.2) * Math.max(1, 1.1 / (size.width / size.height));
  useEffect(() => {
    if (view === 'top') {
      camera.up.set(0, 0, -1);
      camera.position.set(0, 20, 0);
      camera.zoom = Math.max(14, Math.min(size.width / 21, (size.height - 200) / 15.5));
      controls.current?.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    } else {
      // Look straight across the table from the player's seat, without diagonal yaw.
      const distanceScale = Math.max(1, 1.1 / (size.width / size.height));
      camera.up.set(0, 1, 0);
      camera.position.set(1.2, 7.5 * distanceScale, .8 + 8.2 * distanceScale);
      camera.zoom = 1;
      controls.current?.target.set(1.2, 0, .8);
      camera.lookAt(1.2, 0, .8);
    }
    camera.updateProjectionMatrix();
    controls.current?.update();
  }, [camera, size, reset, view]);
  useEffect(() => {
    if (view !== 'player' || !controls.current) return;
    const target = controls.current.target;
    const distance = camera.position.distanceTo(target);
    const radians = angle * Math.PI / 180;
    camera.position.set(target.x, target.y + Math.sin(radians) * distance, target.z + Math.cos(radians) * distance);
    camera.lookAt(target);
    controls.current.update();
  }, [camera, angle, view, reset, size]);
  useEffect(() => {
    if (!controls.current) return;
    if (view === 'top') camera.zoom = defaultTopZoom * zoom;
    else {
      const target = controls.current.target;
      camera.position.sub(target).normalize().multiplyScalar(defaultDistance / zoom).add(target);
    }
    camera.updateProjectionMatrix();
    controls.current.update();
  }, [camera, zoom, view, reset, defaultTopZoom, defaultDistance]);
  return <OrbitControls ref={controls} makeDefault enableDamping enablePan enableRotate={false} mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }} touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }} minDistance={defaultDistance / 1.8} maxDistance={defaultDistance / .5} minZoom={defaultTopZoom * .5} maxZoom={defaultTopZoom * 1.8} onEnd={() => {
    if (!controls.current) return;
    const value = view === 'top' ? camera.zoom / defaultTopZoom : defaultDistance / camera.position.distanceTo(controls.current.target);
    onZoomChange(Math.round(value * 100) / 100);
  }} />;
}

function World({ G, playerID, onInspect }: { G: ColoniesState; playerID: string; onInspect: (value: CardInspection) => void }) {
  const map = useTexture(() => boardTexture(G.sections), JSON.stringify(G.sections));
  const felt = useTexture(() => { const texture = feltTexture(); texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(14, 10); return texture; }, 'felt');
  const opponents = Object.keys(G.players).filter((id) => id !== playerID);
  return (
    <>
      <color attach="background" args={['#152927']} />
      <ambientLight intensity={.65} />
      <hemisphereLight args={['#fff5d6', '#183a32', 1]} />
      <directionalLight position={[-5, 12, 5]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={.03} shadow-radius={3} />
      <RoundedBox args={[19, .5, 13.6]} position={[0, -.36, 0]} radius={.2} smoothness={4} castShadow receiveShadow><meshStandardMaterial color="#806847" roughness={.75} /></RoundedBox>
      <RoundedBox args={[18.6, .12, 13.2]} position={[0, -.06, 0]} radius={.055} smoothness={4} receiveShadow><meshStandardMaterial map={felt} roughness={1} /></RoundedBox>
      <mesh position={[0, -.94, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#162b28" /></mesh>
      <group position={[.35, .08, -.65]}>
        <RoundedBox args={[7.7, .14, 4]} radius={.06} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#d3c9a9" /></RoundedBox>
        <Surface texture={map} width={7.58} height={3.9} y={.075} />
        {G.sections.map((section, sectionIndex) => (G.sectionCards[section.id] ?? []).map((card, cardIndex) => {
          const centerX = ((45 + sectionIndex * 365 + 174) / 1536 - .5) * 7.58;
          const centerZ = ((390 + Math.floor(cardIndex / 2) * 170) / 800 - .5) * 3.9;
          return <group key={card.id} position={[centerX + (cardIndex % 2 === 0 ? -.32 : .32), .095, centerZ]} scale={.65}>
            <TableCard onClick={() => onInspect({ kind: 'blank', id: card.id, owner: section.name })} />
          </group>;
        }))}
      </group>
      <group position={[1.2, .04, 3.1]}><PlayerZone id={playerID} G={G} own onInspect={onInspect} /></group>
      <DiceTray G={G} />
      {opponents[0] && <group position={[.5, .04, -3.7]} rotation={[0, Math.PI, 0]}><PlayerZone id={opponents[0]} G={G} own={false} onInspect={onInspect} /></group>}
      {opponents[1] && <group position={[-6.2, .04, -.4]} rotation={[0, -Math.PI / 2, 0]}><PlayerZone id={opponents[1]} G={G} own={false} onInspect={onInspect} /></group>}
      <group position={[6.65, .06, -.6]}>
        <RoundedBox args={[1.55, .05, 2.35]} radius={.02} smoothness={3} receiveShadow><meshStandardMaterial color="#243f36" /></RoundedBox>
        <group position={[0, .05, -.82]}><Label value="ФІШЕЧКИ" width={1.3} /></group>
        {(['coin', 'weapon', 'energy'] as const).map((type, index) => <Chip key={type} type={type} position={[0, .09, -.35 + index * .47]} />)}
        <group position={[0, .05, .87]}><Label value="ЗРАЗКИ" width={1} color="#869d85" /></group>
      </group>
    </>
  );
}

export function TableScene({ G, playerID, onInspect, reset, view, angle, zoom, onZoomChange }: { G: ColoniesState; playerID: string; onInspect: (value: CardInspection) => void; reset: number; view: TableView; angle: number; zoom: number; onZoomChange: (zoom: number) => void }) {
  return <Canvas shadows frameloop="demand" dpr={[1, 1.7]} fallback={<div className="webgl-fallback">Браузер не підтримує WebGL. Увімкни апаратне прискорення, щоб відкрити 3D-стіл.</div>}>
    {view === 'top' ? <OrthographicCamera makeDefault position={[0, 20, 0]} up={[0, 0, -1]} zoom={45} near={.1} far={200} /> : <PerspectiveCamera makeDefault position={[1.2, 7.5, 9]} fov={50} near={.1} far={200} />}
    <CameraRig reset={reset} view={view} angle={angle} zoom={zoom} onZoomChange={onZoomChange} /><World G={G} playerID={playerID} onInspect={onInspect} />
  </Canvas>;
}
