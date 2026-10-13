import { iconPaths } from './icon-paths';

type SymbolName = 'compass' | 'structure' | 'growth' | 'layers' | 'arrow' | 'back' | 'dome';

export function Symbol({ name, className = '' }: { name: SymbolName | string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]?.map((path, index) => <path key={index} d={path} />)}
      {name === 'compass' && <><circle cx="20" cy="20" r="15" /><path d="m26 14-4 8-8 4 4-8 8-4Z" /><path d="M20 2v5m0 26v5M2 20h5m26 0h5" /></>}
      {name === 'structure' && <><path d="M7 31V17l13-9 13 9v14H7Z" /><path d="M15 31V20h10v11M4 17l16-12 16 12M11 36h18" /></>}
      {name === 'dome' && <><path d="M5 29a15 15 0 0 1 30 0H5ZM20 14c-5 4-8 9-8 15m8-15c5 4 8 9 8 15M20 14v15M4 33h32M7 23h26" /></>}
      {name === 'growth' && <><path d="M20 34V17M20 25c-10 0-13-7-13-14 9 0 13 5 13 14ZM20 19c0-8 5-13 13-13 0 8-4 13-13 13Z" /><path d="M11 34h18" /></>}
      {name === 'layers' && <><path d="m20 7 15 8-15 8-15-8 15-8Zm-15 15 15 8 15-8M5 29l15 8 15-8" /></>}
      {name === 'arrow' && <path d="M8 20h24m-9-9 9 9-9 9" />}
      {name === 'back' && <path d="M32 20H8m9-9-9 9 9 9" />}
    </svg>
  );
}
