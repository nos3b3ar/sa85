import { runLoop, type SaverStart } from '../loop';

const tex = 64;
const cells = 8;
const size = cells * 2 + 1;
const turnSeconds = 0.45;
const moveSeconds = 0.5;
const regenerateSeconds = 120;

const directions: Array<[number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]];

const start: SaverStart = (canvas) => {
  const textures = {
    wall: brickTexture(1),
    wallDark: brickTexture(0.72),
    floor: woodTexture(),
    ceiling: ceilingTexture(),
  };

  return runLoop(canvas, (ctx, width, height) => {
    const rw = Math.min(320, width);
    const rh = Math.max(60, Math.round((rw * height) / width));
    const off = document.createElement('canvas');
    off.width = rw;
    off.height = rh;
    const offCtx = off.getContext('2d')!;
    const image = offCtx.createImageData(rw, rh);
    const pixels = new Uint32Array(image.data.buffer);

    let map = generateMaze();
    let age = 0;
    const walker = {
      x: 1.5,
      y: 1.5,
      dir: 0,
      angle: 0,
      fromAngle: 0,
      toAngle: 0,
      fromX: 1.5,
      fromY: 1.5,
      toX: 1.5,
      toY: 1.5,
      phase: 'idle' as 'idle' | 'turn' | 'move',
      time: 0,
    };

    const open = (x: number, y: number) => map[y]?.[x] === 0;

    const decide = () => {
      const cx = Math.floor(walker.x);
      const cy = Math.floor(walker.y);
      for (const offset of [1, 0, 3, 2]) {
        const dir = (walker.dir + offset) % 4;
        const [dx, dy] = directions[dir];
        if (!open(cx + dx, cy + dy)) continue;
        walker.toX = cx + dx + 0.5;
        walker.toY = cy + dy + 0.5;
        walker.fromX = walker.x;
        walker.fromY = walker.y;
        if (dir !== walker.dir) {
          walker.fromAngle = walker.angle;
          const delta = ((dir - walker.dir + 4) % 4) === 3 ? -Math.PI / 2 : ((dir - walker.dir + 4) % 4) * (Math.PI / 2);
          walker.toAngle = walker.angle + delta;
          walker.phase = 'turn';
        } else {
          walker.phase = 'move';
        }
        walker.dir = dir;
        walker.time = 0;
        return;
      }
    };

    const update = (dt: number) => {
      walker.time += dt;
      if (walker.phase === 'idle') decide();
      if (walker.phase === 'turn') {
        const k = Math.min(1, walker.time / turnSeconds);
        walker.angle = walker.fromAngle + (walker.toAngle - walker.fromAngle) * ease(k);
        if (k >= 1) {
          walker.phase = 'move';
          walker.time = 0;
        }
      } else if (walker.phase === 'move') {
        const k = Math.min(1, walker.time / moveSeconds);
        walker.x = walker.fromX + (walker.toX - walker.fromX) * k;
        walker.y = walker.fromY + (walker.toY - walker.fromY) * k;
        if (k >= 1) walker.phase = 'idle';
      }
    };

    const render = () => {
      const dirX = Math.cos(walker.angle);
      const dirY = Math.sin(walker.angle);
      const planeX = -dirY * 0.66;
      const planeY = dirX * 0.66;
      const half = rh / 2;

      const rayX0 = dirX - planeX;
      const rayY0 = dirY - planeY;
      const rayX1 = dirX + planeX;
      const rayY1 = dirY + planeY;
      for (let y = Math.floor(half) + 1; y < rh; y += 1) {
        const rowDistance = half / (y - half);
        const stepX = (rowDistance * (rayX1 - rayX0)) / rw;
        const stepY = (rowDistance * (rayY1 - rayY0)) / rw;
        let floorX = walker.x + rowDistance * rayX0;
        let floorY = walker.y + rowDistance * rayY0;
        const ceilingRow = rh - y - 1;
        for (let x = 0; x < rw; x += 1) {
          const tx = Math.floor(floorX * tex) & (tex - 1);
          const ty = Math.floor(floorY * tex) & (tex - 1);
          pixels[y * rw + x] = textures.floor[ty * tex + tx];
          pixels[ceilingRow * rw + x] = textures.ceiling[ty * tex + tx];
          floorX += stepX;
          floorY += stepY;
        }
      }

      for (let x = 0; x < rw; x += 1) {
        const camera = (2 * x) / rw - 1;
        const rayX = dirX + planeX * camera;
        const rayY = dirY + planeY * camera;
        let mapX = Math.floor(walker.x);
        let mapY = Math.floor(walker.y);
        const deltaX = Math.abs(1 / rayX);
        const deltaY = Math.abs(1 / rayY);
        const stepX = rayX < 0 ? -1 : 1;
        const stepY = rayY < 0 ? -1 : 1;
        let sideX = (rayX < 0 ? walker.x - mapX : mapX + 1 - walker.x) * deltaX;
        let sideY = (rayY < 0 ? walker.y - mapY : mapY + 1 - walker.y) * deltaY;
        let side = 0;
        for (let guard = 0; guard < 64; guard += 1) {
          if (sideX < sideY) {
            sideX += deltaX;
            mapX += stepX;
            side = 0;
          } else {
            sideY += deltaY;
            mapY += stepY;
            side = 1;
          }
          if (!open(mapX, mapY)) break;
        }
        const distance = Math.max(0.05, side === 0 ? sideX - deltaX : sideY - deltaY);
        const lineHeight = Math.floor(rh / distance);
        const top = Math.floor(half - lineHeight / 2);
        let wallX = side === 0 ? walker.y + distance * rayY : walker.x + distance * rayX;
        wallX -= Math.floor(wallX);
        const texX = Math.floor(wallX * tex) & (tex - 1);
        const texture = side === 0 ? textures.wall : textures.wallDark;
        const from = Math.max(0, top);
        const to = Math.min(rh, top + lineHeight);
        for (let y = from; y < to; y += 1) {
          const texY = Math.floor(((y - top) / lineHeight) * tex) & (tex - 1);
          pixels[y * rw + x] = texture[texY * tex + texX];
        }
      }

      offCtx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, width, height);
    };

    return (dt) => {
      age += dt;
      if (age > regenerateSeconds) {
        age = 0;
        map = generateMaze();
        Object.assign(walker, { x: 1.5, y: 1.5, dir: 0, angle: 0, phase: 'idle' });
      }
      update(dt);
      render();
    };
  });
};

function ease(k: number) {
  return k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
}

function generateMaze() {
  const map = Array.from({ length: size }, () => Array<number>(size).fill(1));
  const stack: Array<[number, number]> = [[0, 0]];
  const seen = new Set(['0,0']);
  map[1][1] = 0;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = directions
      .map(([dx, dy]) => [cx + dx, cy + dy] as [number, number])
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < cells && ny < cells && !seen.has(`${nx},${ny}`));
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const [nx, ny] = next[Math.floor(Math.random() * next.length)];
    seen.add(`${nx},${ny}`);
    map[cy * 2 + 1 + (ny - cy)][cx * 2 + 1 + (nx - cx)] = 0;
    map[ny * 2 + 1][nx * 2 + 1] = 0;
    stack.push([nx, ny]);
  }
  return map;
}

function pack(r: number, g: number, b: number) {
  const c = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return (255 << 24) | (c(b) << 16) | (c(g) << 8) | c(r);
}

function brickTexture(light: number) {
  const data = new Uint32Array(tex * tex);
  for (let y = 0; y < tex; y += 1) {
    const row = Math.floor(y / 16);
    for (let x = 0; x < tex; x += 1) {
      const shifted = (x + (row % 2) * 16) % tex;
      const mortar = y % 16 < 2 || shifted % 32 < 2;
      const noise = Math.random() * 28 - 14;
      const brickTone = ((row * 7 + Math.floor(shifted / 32) * 3) % 5) * 6;
      data[y * tex + x] = mortar
        ? pack((200 + noise) * light, (196 + noise) * light, (186 + noise) * light)
        : pack((178 + brickTone + noise) * light, (52 + noise * 0.6) * light, (38 + noise * 0.5) * light);
    }
  }
  return data;
}

function woodTexture() {
  const data = new Uint32Array(tex * tex);
  for (let y = 0; y < tex; y += 1) {
    const plank = Math.floor(y / 16);
    for (let x = 0; x < tex; x += 1) {
      const seam = y % 16 === 0 || (x + plank * 23) % 64 === 0;
      const grain = Math.sin((x + plank * 11) * 0.35 + Math.sin(y * 0.9) * 2) * 10 + Math.random() * 12;
      data[y * tex + x] = seam ? pack(110, 70, 30) : pack(196 + grain, 128 + grain * 0.7, 58 + grain * 0.3);
    }
  }
  return data;
}

function ceilingTexture() {
  const data = new Uint32Array(tex * tex);
  for (let y = 0; y < tex; y += 1) {
    for (let x = 0; x < tex; x += 1) {
      const line = x % 32 === 0 || y % 32 === 0;
      const noise = Math.random() * 16;
      data[y * tex + x] = line ? pack(140, 140, 140) : pack(196 + noise, 196 + noise, 200 + noise);
    }
  }
  return data;
}

export default start;
