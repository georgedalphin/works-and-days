/**
 * Coasts that join up. Every coastal screen keeps, for each side, which tiles along the border are sea. A neighbour
 * made later must agree: where its side is part sea and part land, the next screen is a coast with the water in the
 * same place; where it is all sea, open ocean; where it is all land, land. Inside the screen, the shoreline is drawn
 * smoothly between what the four sides say (a Coons patch over the sides, with a little noise), so a bay, a cape or
 * a long straight shore follows from the borders.
 *
 * A side's sea is a string of "0" (land) and "1" (sea), one per tile along it, west to east or north to south;
 * all-land and all-sea sides are kept as just "0" and "1".
 */
export type Side = "N" | "S" | "E" | "W";
export type Shore = Record<Side, string>;
export const SIDES: Side[] = ["N", "S", "E", "W"];

export const sideLen = (sd: Side, W: number, H: number) => (sd === "N" || sd === "S" ? W : H);
export const unpack = (p: string, n: number) => (p.length === 1 ? p.repeat(n) : p);
export const pack = (p: string) => (/^0+$/.test(p) ? "0" : /^1+$/.test(p) ? "1" : p);
export const allSea = (s: Shore) => SIDES.every((sd) => s[sd] === "1");
export const someSea = (p: string) => p.includes("1");

/** Which way the shoreline is being drawn: forced to be a coast; struck out from the open sea; or a coast rolled on dry land. */
export type Intent = "coast" | "fromSea" | "free";

/**
 * Fill in the sides no neighbour has settled. Known sides come exactly as their neighbours have them; corners agree
 * between the two sides that share them; the rest are chosen to make a plausible shore.
 */
export function fillShore(known: Partial<Record<Side, string>>, W: number, H: number, r: () => number, intent: Intent, seaSide?: Side): Shore {
  const len = (sd: Side) => sideLen(sd, W, H);
  const full: Partial<Record<Side, string[]>> = {};
  for (const sd of SIDES) if (known[sd] !== undefined) full[sd] = unpack(known[sd]!, len(sd)).split("");
  // The corners, each shared by two sides: [side, index] pairs.
  const CORNERS: Record<string, [Side, number, Side, number]> = {
    NW: ["N", 0, "W", 0], NE: ["N", W - 1, "E", 0], SW: ["S", 0, "W", H - 1], SE: ["S", W - 1, "E", H - 1],
  };
  const corner: Record<string, string | undefined> = {};
  for (const [k, [a, ia, b, ib]] of Object.entries(CORNERS)) {
    const va = full[a]?.[ia], vb = full[b]?.[ib];
    const v = va !== undefined && vb !== undefined && va !== vb ? "1" : va ?? vb; // disagreeing neighbours: the sea wins the corner
    corner[k] = v;
    if (v !== undefined) { if (full[a]) full[a]![ia] = v; if (full[b]) full[b]![ib] = v; }
  }
  // A shore rolled on dry land needs a side to put the sea on.
  if (intent === "free") {
    const open = SIDES.filter((sd) => !full[sd]);
    seaSide = seaSide && open.includes(seaSide) ? seaSide : open[Math.floor(r() * open.length)];
  }
  const touches: Record<Side, string[]> = { N: ["NW", "NE"], S: ["SW", "SE"], W: ["NW", "SW"], E: ["NE", "SE"] };
  for (const k of Object.keys(CORNERS)) if (corner[k] === undefined) {
    if (intent === "free") corner[k] = seaSide && touches[seaSide].includes(k) ? "1" : "0";
    else if (intent === "fromSea") corner[k] = "0"; // land ahead, where the sea gives out
    else corner[k] = r() < 0.5 ? "1" : "0";
  }
  const runOf = (n: number, a: number, b: number, v: string, rest: string) => { const s: string[] = []; for (let i = 0; i < n; i++) s.push(i >= a && i < b ? v : rest); return s; };
  for (const sd of SIDES) {
    if (full[sd]) continue;
    const n = len(sd), [ca, cb] = touches[sd].map((k) => corner[k]!);
    let p: string[];
    if (ca === "1" && cb === "1") {
      p = r() < (intent === "free" && sd === seaSide ? 0.6 : 0.72) ? runOf(n, 0, n, "1", "1")
        : (() => { const w = Math.floor(n * (0.2 + r() * 0.25)), a = Math.floor((n - w) * (0.3 + r() * 0.4)); return runOf(n, a, a + w, "0", "1"); })(); // a cape
    } else if (ca === "0" && cb === "0") {
      const bay = intent === "free" && sd === seaSide ? 1 : intent === "coast" ? 0.15 : 0;
      p = r() < bay ? (() => { const w = Math.floor(n * (0.4 + r() * 0.35)), a = Math.floor((n - w) * (0.3 + r() * 0.4)); return runOf(n, a, a + w, "1", "0"); })() : runOf(n, 0, n, "0", "0");
    } else {
      const t = Math.floor(n * (0.25 + r() * 0.5));
      p = ca === "1" ? runOf(n, 0, t, "1", "0") : runOf(n, t, n, "1", "0");
    }
    p[0] = ca; p[n - 1] = cb;
    full[sd] = p;
  }
  const out = {} as Shore;
  for (const sd of SIDES) out[sd] = full[sd]!.join("");
  // A coast must have both: some sea and some land on its edges (or it would be the ocean, or plain land).
  const free = SIDES.filter((sd) => known[sd] === undefined), put = seaSide && free.includes(seaSide) ? seaSide : free[0];
  if (intent !== "fromSea" && put && SIDES.every((sd) => !someSea(out[sd]))) out[put] = runOf(len(put), Math.floor(len(put) * 0.3), Math.floor(len(put) * 0.7), "1", "0").join(""); // (with no free side, it stays dry land)
  for (const sd of SIDES) out[sd] = pack(out[sd]);
  return out;
}

/** The sea, tile by tile: the border exactly as the sides say, the middle drawn smoothly between them. */
export function coastMask(shore: Shore, W: number, H: number, r: () => number): boolean[][] {
  const P = (sd: Side) => unpack(shore[sd], sideLen(sd, W, H)).split("").map(Number);
  const blur = (a: number[]) => a.map((_, i) => { let s = 0, n = 0; for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < a.length) { s += a[j]; n++; } } return s / n; });
  const n = blur(P("N")), s = blur(P("S")), w = blur(P("W")), e = blur(P("E"));
  const c00 = (n[0] + w[0]) / 2, c10 = (n[W - 1] + e[0]) / 2, c01 = (s[0] + w[H - 1]) / 2, c11 = (s[W - 1] + e[H - 1]) / 2;
  // A coarse noise, so the shore wanders.
  const CG = 6, cw = Math.ceil(W / CG) + 2, ch = Math.ceil(H / CG) + 2, coarse: number[][] = [];
  for (let y = 0; y < ch; y++) { coarse.push([]); for (let x = 0; x < cw; x++) coarse[y].push(r()); }
  const noise = (x: number, y: number) => { const fx = x / CG, fy = y / CG, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0; const a = coarse[y0][x0] * (1 - tx) + coarse[y0][x0 + 1] * tx, b = coarse[y0 + 1][x0] * (1 - tx) + coarse[y0 + 1][x0 + 1] * tx; return a * (1 - ty) + b * ty - 0.5; };
  let m: boolean[][] = [];
  for (let y = 0; y < H; y++) {
    m.push([]);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1), v = y / (H - 1);
      const f = (1 - v) * n[x] + v * s[x] + (1 - u) * w[y] + u * e[y] - ((1 - u) * (1 - v) * c00 + u * (1 - v) * c10 + (1 - u) * v * c01 + u * v * c11);
      const fade = Math.min(1, Math.min(x, y, W - 1 - x, H - 1 - y) / 5);
      m[y].push(f + noise(x, y) * 0.5 * fade > 0.5);
    }
  }
  // Tidy stray specks (a majority of neighbours), then set the border exactly.
  for (let pass = 0; pass < 2; pass++) {
    const t = m.map((row) => row.slice());
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (m[y + dy][x + dx]) k++; t[y][x] = k >= 5; }
    m = t;
  }
  const pn = P("N"), ps = P("S"), pw = P("W"), pe = P("E");
  for (let x = 0; x < W; x++) { m[0][x] = !!pn[x]; m[H - 1][x] = !!ps[x]; }
  for (let y = 0; y < H; y++) { m[y][0] = !!pw[y]; m[y][W - 1] = !!pe[y]; }
  // Each sea tile on the border keeps a sea tile inside it, so a boat can pass from one screen to the next.
  for (let x = 1; x < W - 1; x++) { if (m[0][x]) m[1][x] = true; if (m[H - 1][x]) m[H - 2][x] = true; }
  for (let y = 1; y < H - 1; y++) { if (m[y][0]) m[y][1] = true; if (m[y][W - 1]) m[y][W - 2] = true; }
  return m;
}
