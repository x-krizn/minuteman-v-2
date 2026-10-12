/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bitmap Level Parser:
 * Enables external pixel art mini-maps and multi-screen rooms to be parsed into
 * playable world collision grids, enemy spawns, items, and transition gateways.
 * 
 * 1 pixel in the source image = 1 tile (16x16 px) in the game engine.
 * Standard single room = 10x9 pixels.
 * Multi-screen room = e.g. 20x9 (2x1 wide), 10x18 (1x2 tall shaft), 20x18 (2x2 arena).
 */

export interface ColorMapping {
  char: string;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

export const BITMAP_PALETTE: ColorMapping[] = [
  { char: '#', name: 'Solid Wall', hex: '#000000', r: 0, g: 0, b: 0 },
  { char: '.', name: 'Empty Air', hex: '#ffffff', r: 255, g: 255, b: 255 },
  { char: 'E', name: 'Enemy Spawn', hex: '#ff0000', r: 255, g: 0, b: 0 },
  { char: 'o', name: 'Coin Drop', hex: '#ffff00', r: 255, g: 255, b: 0 },
  { char: 'K', name: 'Key', hex: '#00ffff', r: 0, g: 255, b: 255 },
  { char: 'H', name: 'Healing Flask', hex: '#00ff00', r: 0, g: 255, b: 0 },
  { char: '1', name: 'Double Jump / Relic', hex: '#ff00ff', r: 255, g: 0, b: 255 },
  { char: 'D', name: 'Dash Relic', hex: '#ff8c00', r: 255, g: 140, b: 0 },
  { char: 'L', name: 'Locked Door', hex: '#8b4513', r: 139, g: 69, b: 19 },
  { char: '>', name: 'Stairs Down', hex: '#8a2be2', r: 138, g: 43, b: 226 },
  { char: '<', name: 'Stairs Up / Return', hex: '#1e90ff', r: 30, g: 144, b: 255 },
  { char: 'P', name: 'Portal Gateway', hex: '#9370db', r: 147, g: 112, b: 219 },
  { char: 'O', name: 'Bonfire Checkpoint', hex: '#2e8b57', r: 46, g: 139, b: 87 },
  { char: 'G', name: 'Greatsword Drop', hex: '#ff1493', r: 255, g: 20, b: 147 },
  { char: 'B', name: 'Shield Drop', hex: '#20b2aa', r: 32, g: 178, b: 170 },
  { char: 'Y', name: 'Secondary Weapon Drop', hex: '#708090', r: 112, g: 128, b: 144 },
];

/**
 * Palette matching the user-defined tutorial map specification:
 * FFFFFFFF = walls and floor
 * 000000FF = background
 * 00FF00FF = hero spawn/respawn
 * FF0000FF = enemy spawn
 * FF9800FF = key
 * 0000FFFF = room door
 * FFFF00FF = doublejump
 * 9900FFFF = boss door
 * 00FFFFFF = campfire/checkpoint/respawn2
 * FF00FFFF = boss loot
 * FF0098FF = boss
 */
export const TUTORIAL_BITMAP_PALETTE: ColorMapping[] = [
  { char: '#', name: 'Walls and Floor', hex: '#ffffff', r: 255, g: 255, b: 255 },
  { char: '.', name: 'Background', hex: '#000000', r: 0, g: 0, b: 0 },
  { char: 'P', name: 'Hero Spawn', hex: '#00ff00', r: 0, g: 255, b: 0 },
  { char: 'E', name: 'Enemy Spawn', hex: '#ff0000', r: 255, g: 0, b: 0 },
  { char: 'K', name: 'Key', hex: '#ff9800', r: 255, g: 152, b: 0 },
  { char: 'D', name: 'Room Door', hex: '#0000ff', r: 0, g: 0, b: 255 },
  { char: '1', name: 'Double Jump', hex: '#ffff00', r: 255, g: 255, b: 0 },
  { char: 'L', name: 'Boss Door', hex: '#9900ff', r: 153, g: 0, b: 255 },
  { char: 'O', name: 'Campfire Checkpoint', hex: '#00ffff', r: 0, g: 255, b: 255 },
  { char: 'H', name: 'Boss Loot', hex: '#ff00ff', r: 255, g: 0, b: 255 },
  { char: 'B', name: 'Boss', hex: '#ff0098', r: 255, g: 0, b: 152 },
];

/**
 * Matches an RGBA pixel to the closest palette tile character using color distance.
 */
export function colorToTileChar(
  r: number,
  g: number,
  b: number,
  a: number,
  palette: ColorMapping[] = TUTORIAL_BITMAP_PALETTE
): string {
  // Transparent or semi-transparent pixels default to empty air
  if (a < 64) {
    return '.';
  }

  // Exact matches for white/black depending on palette
  const wallEntry = palette.find((p) => p.char === '#');
  const airEntry = palette.find((p) => p.char === '.');
  if (wallEntry && wallEntry.r === 255 && r > 240 && g > 240 && b > 240) {
    return '#';
  }
  if (airEntry && airEntry.r === 0 && r < 20 && g < 20 && b < 20) {
    return '.';
  }

  let closestChar = '.';
  let minDistance = Infinity;

  for (const entry of palette) {
    if (entry.char === '.' || entry.char === '#') continue;

    const dr = r - entry.r;
    const dg = g - entry.g;
    const db = b - entry.b;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq < minDistance) {
      minDistance = distSq;
      closestChar = entry.char;
    }
  }

  // If distance to nearest special color is too high (> 9000), default based on luminance
  if (minDistance > 9000) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum < 128 ? '.' : '#';
  }

  return closestChar;
}

/**
 * Returns hex color representation of an ASCII tile char.
 */
export function tileCharToColor(char: string): string {
  const match = BITMAP_PALETTE.find((p) => p.char === char);
  return match ? match.hex : '#ffffff';
}

/**
 * Converts ImageData directly into a 2D array of tile rows (ASCII strings).
 */
export function parseImageDataToRoom(imageData: ImageData): {
  tiles: string[];
  cols: number;
  rows: number;
} {
  const cols = imageData.width;
  const rows = imageData.height;
  const data = imageData.data;
  const tiles: string[] = [];

  for (let y = 0; y < rows; y++) {
    let rowStr = '';
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      rowStr += colorToTileChar(r, g, b, a);
    }
    tiles.push(rowStr);
  }

  return { tiles, cols, rows };
}

/**
 * Converts an HTMLImageElement into room tile rows.
 */
export function parseImageElementToRoom(img: HTMLImageElement): {
  tiles: string[];
  cols: number;
  rows: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return parseImageDataToRoom(imageData);
}

/**
 * Asynchronously loads a Data URI or image URL and converts to room tiles.
 */
export async function parseImageUrlToRoom(url: string): Promise<{
  tiles: string[];
  cols: number;
  rows: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        resolve(parseImageElementToRoom(img));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(new Error('Failed to load bitmap image: ' + err));
    img.src = url;
  });
}

/**
 * Converts an ASCII room back into a downloadable pixel art PNG canvas.
 */
export function roomToCanvas(room: string[]): HTMLCanvasElement {
  const rows = room.length;
  const cols = room[0]?.length || 10;
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  for (let y = 0; y < rows; y++) {
    const row = room[y];
    for (let x = 0; x < cols; x++) {
      const char = row[x] || '.';
      ctx.fillStyle = tileCharToColor(char);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas;
}

/**
 * Converts an ASCII room to a PNG Data URI for preview or download.
 */
export function roomToDataUri(room: string[]): string {
  const canvas = roomToCanvas(room);
  return canvas.toDataURL('image/png');
}

/**
 * Parses an entire world map image subdivided into rooms of width `roomCols` and height `roomRows`.
 * Can also detect connected multi-screen rooms.
 */
export function parseWorldMapAtlas(
  imageData: ImageData,
  roomCols = 10,
  roomRows = 9
): {
  rooms: Record<string, string[]>;
  mapCols: number;
  mapRows: number;
} {
  const totalCols = imageData.width;
  const totalRows = imageData.height;
  const mapCols = Math.floor(totalCols / roomCols);
  const mapRows = Math.floor(totalRows / roomRows);
  const data = imageData.data;
  const rooms: Record<string, string[]> = {};

  for (let ry = 0; ry < mapRows; ry++) {
    for (let rx = 0; rx < mapCols; rx++) {
      const roomKey = `${rx},${ry}`;
      const roomLines: string[] = [];
      let hasContent = false;

      for (let y = 0; y < roomRows; y++) {
        let rowStr = '';
        for (let x = 0; x < roomCols; x++) {
          const globalX = rx * roomCols + x;
          const globalY = ry * roomRows + y;
          const idx = (globalY * totalCols + globalX) * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          const char = colorToTileChar(r, g, b, a);
          rowStr += char;
          if (char !== '.') hasContent = true;
        }
        roomLines.push(rowStr);
      }

      // Only store room if it contains tiles
      if (hasContent) {
        rooms[roomKey] = roomLines;
      }
    }
  }

  return { rooms, mapCols, mapRows };
}

export const BITMAP_ROOM_CACHE: Record<string, string[]> = {};

// Auto-discover any committed static maps or atlases in assets/maps
const staticMapFiles = import.meta.glob(
  [
    '../assets/maps/*.png',
    '../assets/maps/static/*.png',
    '../assets/maps/*/*.png',
  ],
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

/**
 * Loads and populates rooms defined by committed PNG URLs or dropped-in PNG files.
 */
export async function loadAreaBitmaps(
  area: { id?: string; rooms: Record<string, string[]>; bitmapRooms?: Record<string, string> }
): Promise<Record<string, string[]>> {
  const areaId = area.id?.toLowerCase() || '';

  // 1. Check auto-discovered files matching the area ID
  for (const [path, url] of Object.entries(staticMapFiles)) {
    const filename = path.split('/').pop()?.toLowerCase() || '';
    const nameWithoutExt = filename.replace('.png', '');

    // Check if filename matches area (e.g. "tutorial.png", "tutorial1.png", "boss_sanctum.png")
    if (areaId && (nameWithoutExt === areaId || nameWithoutExt.startsWith(areaId))) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        // If dimensions are a multi-room atlas (e.g. 30x27 or multiple of 10x9)
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (canvas.width > 10 || canvas.height > 9) {
            const atlas = parseWorldMapAtlas(imageData, 10, 9);
            Object.assign(area.rooms, atlas.rooms);
          } else {
            const single = parseImageDataToRoom(imageData);
            area.rooms['0,0'] = single.tiles;
          }
        }
      } catch (err) {
        console.warn(`Failed to auto-load map atlas ${path}:`, err);
      }
    }

    // Check subfolder format: e.g. "maps/tutorial/0,0.png"
    if (path.includes(`/${areaId}/`)) {
      const roomKey = nameWithoutExt;
      try {
        const parsed = await parseImageUrlToRoom(url);
        area.rooms[roomKey] = parsed.tiles;
      } catch (err) {
        console.warn(`Failed to auto-load room slice ${path}:`, err);
      }
    }
  }

  // 2. Explicit bitmapRooms overrides
  if (area.bitmapRooms) {
    for (const [key, url] of Object.entries(area.bitmapRooms)) {
      if (BITMAP_ROOM_CACHE[url]) {
        area.rooms[key] = BITMAP_ROOM_CACHE[url];
      } else {
        try {
          const parsed = await parseImageUrlToRoom(url);
          BITMAP_ROOM_CACHE[url] = parsed.tiles;
          area.rooms[key] = parsed.tiles;
        } catch (err) {
          console.warn(`Failed to parse bitmap for room ${key}:`, err);
        }
      }
    }
  }

  return area.rooms;
}
