import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BuildingDefinition } from '../../game/buildings';
import type { ColoniesState } from '../../game/Colonies';
import { resources, type ResourceType } from '../../game/resources';
import { iconPaths } from '../icon-paths';

function vectorIcon(ctx: CanvasRenderingContext2D, icon: string, x: number, y: number, size: number, color: string) {
  ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 40, size / 40);
  ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const path of iconPaths[icon] ?? []) ctx.stroke(new Path2D(path));
  ctx.restore();
}

function resourceIcon(ctx: CanvasRenderingContext2D, resource: ResourceType, x: number, baseline: number, size: number, color = '#354d46') {
  if (resource === 'weapon') vectorIcon(ctx, 'weapon', x, baseline - size * .35, size, '#bd4141');
  else text(ctx, resources[resource].symbol, x, baseline, size, color, 700);
}

function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#354d46', weight = 500) {
  ctx.font = `${weight} ${size}px sans-serif`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(value, x, y);
}

function dome(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.strokeStyle = '#82947b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, radius, Math.PI, 0); ctx.lineTo(x - radius, y); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, radius * .5, radius, 0, Math.PI, 0); ctx.moveTo(x, y - radius); ctx.lineTo(x, y); ctx.moveTo(x - radius * .86, y - radius * .5); ctx.lineTo(x + radius * .86, y - radius * .5); ctx.moveTo(x - radius - 5, y + 9); ctx.lineTo(x + radius + 5, y + 9); ctx.stroke();
}

export function buildingTexture(definition: BuildingDefinition) {
  return canvasTexture(384, 540, (ctx) => {
    ctx.fillStyle = '#efe9d9'; ctx.fillRect(0, 0, 384, 540);
    ctx.strokeStyle = '#c7c4ad'; ctx.lineWidth = 3; ctx.strokeRect(18, 18, 348, 504);
    text(ctx, definition.typeLabel, 192, 56, 15, '#85937b');
    text(ctx, definition.name, 192, 108, definition.name.length > 16 ? 24 : 30, '#354d46', 700);
    if (definition.icon === 'dome') dome(ctx, 192, 265, 70);
    if (iconPaths[definition.icon]) vectorIcon(ctx, definition.icon, 192, 230, 125, definition.production.resource === 'weapon' ? '#bd4141' : '#82947b');
    text(ctx, String(definition.production.amount), 163, 372, 44, '#354d46', 700);
    resourceIcon(ctx, definition.production.resource, 215, 372, 44);
    const slotSize = 70, gap = 12;
    const total = definition.storage.slotCount * slotSize + (definition.storage.slotCount - 1) * gap;
    for (let index = 0; index < definition.storage.slotCount; index++) {
      const x = (384 - total) / 2 + index * (slotSize + gap);
      ctx.setLineDash([6, 5]); ctx.strokeStyle = '#9bab90'; ctx.lineWidth = 2; ctx.strokeRect(x, 415, slotSize, slotSize); ctx.setLineDash([]);
      resourceIcon(ctx, definition.storage.resource, x + slotSize / 2, 462, 25, '#9bab90');
    }
  });
}

export function blankTexture(back = false) {
  return canvasTexture(256, 360, (ctx) => {
    ctx.fillStyle = back ? '#34564e' : '#efe9dc'; ctx.fillRect(0, 0, 256, 360);
    ctx.strokeStyle = back ? '#bdc0a1' : '#c8c3ae'; ctx.lineWidth = 2; ctx.strokeRect(13, 13, 230, 334);
    if (back) {
      ctx.strokeStyle = '#a4b79b';
      ctx.beginPath(); ctx.arc(128, 173, 44, 0, Math.PI * 2); ctx.moveTo(128, 117); ctx.lineTo(128, 229); ctx.moveTo(72, 173); ctx.lineTo(184, 173); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(147, 151); ctx.lineTo(135, 181); ctx.lineTo(110, 195); ctx.lineTo(120, 163); ctx.closePath(); ctx.stroke();
      text(ctx, 'COLONIES', 128, 284, 18, '#c1c9ab');
    }
  });
}

export function boardTexture(sections: ColoniesState['sections']) {
  return canvasTexture(1536, 800, (ctx) => {
    ctx.fillStyle = '#eee8d7'; ctx.fillRect(0, 0, 1536, 800);
    ctx.strokeStyle = '#c5c4ae'; ctx.lineWidth = 3; ctx.strokeRect(17, 17, 1502, 766);
    text(ctx, 'ЗА МЕЖАМИ КОЛОНІЇ', 768, 85, 35, '#354d46', 700);
    text(ctx, 'СПІЛЬНЕ ПОЛЕ · COLONIES', 768, 121, 17, '#88957d');
    const colors = ['#e9e6d5', '#dfe6d6', '#e4dfd0', '#d2e0d5'];
    sections.forEach((section, index) => {
      const x = 45 + index * 365;
      const hasCards = section.id === 'market' || section.id === 'development';
      ctx.fillStyle = colors[index]; ctx.fillRect(x, 162, 348, 550);
      ctx.strokeStyle = '#afbba5'; ctx.strokeRect(x, 162, 348, 550);
      text(ctx, `0${section.number}`, x + 45, 211, 26, '#7b8b73');
      text(ctx, section.name, x + 174, hasCards ? 243 : 377, 29, '#354d46', 700);
      text(ctx, section.caption, x + 174, hasCards ? 277 : 417, 18, '#7b8b73');
      const workerY = hasCards ? 650 : 579;
      ctx.setLineDash([8, 6]); ctx.strokeRect(x + 28, workerY, 292, hasCards ? 48 : 87); ctx.setLineDash([]);
      for (let dot = 0; dot < 3; dot++) { ctx.beginPath(); ctx.arc(x + 128 + dot * 46, workerY + (hasCards ? 24 : 43), 13, 0, Math.PI * 2); ctx.stroke(); }
      if (!hasCards) {
        if (section.symbol === 'structure') dome(ctx, x + 174, 310, 45);
        else { ctx.beginPath(); ctx.arc(x + 174, 280, 31, 0, Math.PI * 2); ctx.moveTo(x + 174, 237); ctx.lineTo(x + 174, 323); ctx.moveTo(x + 131, 280); ctx.lineTo(x + 217, 280); ctx.stroke(); }
      }
    });
    text(ctx, 'ДОСЛІДЖУЙ · РОЗБУДОВУЙ · ВИЖИВАЙ', 768, 757, 16, '#88957d');
  });
}

export function labelTexture(label: string, color: string) {
  return canvasTexture(768, 100, (ctx) => { ctx.clearRect(0, 0, 768, 100); text(ctx, label, 384, 65, 34, color, 700); });
}

export function chipTexture(type: ResourceType) {
  return canvasTexture(128, 128, (ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    resourceIcon(ctx, type, 64, 93, 76, '#344b42');
  });
}

export function diceFaceTexture(icon: string) {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#efe9d9'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#c7b891'; ctx.lineWidth = 8; ctx.strokeRect(9, 9, 238, 238);
    text(ctx, icon, 128, 173, 116, '#354d46', 700);
  });
}

export function feltTexture() {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#31524a'; ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 4) { ctx.fillStyle = x % 8 ? '#35564d' : '#2d4e46'; ctx.fillRect(x, 0, 1, 256); }
    for (let y = 0; y < 256; y += 4) { ctx.fillStyle = '#45645422'; ctx.fillRect(0, y, 256, 1); }
  });
}
