export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 10;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
export const MAX_LEVEL = 10;
export const MAX_PIXELS = 4_000_000;
export const MAX_OPERATIONS = 1_000_000;
export type DecayMode = "bit-flip" | "ascii-shuffle" | "color-drain";

export function parseSeed(value: unknown = "bitrot"): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,32}$/.test(value))
    throw new Error(
      "Use a seed of 1–32 letters, numbers, hyphens or underscores.",
    );
  return value;
}

/** FNV-1a + Mulberry32. Part of recipe v1: never change without a version bump. */
export function seededRandom(seed: string): () => number {
  parseSeed(seed);
  let state = 2166136261;
  for (const character of seed)
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ByteMetrics {
  changed: number;
  bits: number;
  total: number;
  buckets: number[];
  image?: {
    intensityRetained: number;
    pixelsChanged: number;
    totalPixels: number;
  };
}

export function compareBytes(
  original: Uint8Array,
  result: Uint8Array,
): ByteMetrics {
  const total = Math.max(original.length, result.length);
  let changed = 0,
    bits = 0;
  const buckets = Array<number>(64).fill(0),
    counts = Array<number>(64).fill(0);
  for (let i = 0; i < total; i++) {
    const bucket = Math.min(63, Math.floor((i * 64) / total));
    counts[bucket]++;
    if (original[i] === result[i]) continue;
    changed++;
    buckets[bucket]++;
    let xor =
      i >= original.length || i >= result.length
        ? 255
        : original[i] ^ result[i];
    while (xor) {
      bits++;
      xor &= xor - 1;
    }
  }
  return {
    changed,
    bits,
    total,
    buckets: buckets.map((n, i) => (counts[i] ? n / counts[i] : 0)),
  };
}

export function parseLevel(value: unknown): number {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`Choose a whole-number level from 0 to ${MAX_LEVEL}.`);
  }
  const level = Number(value);
  if (!Number.isSafeInteger(level) || level > MAX_LEVEL) {
    throw new Error(`Choose a whole-number level from 0 to ${MAX_LEVEL}.`);
  }
  return level;
}

export function parseMode(value: unknown): DecayMode {
  if (value === undefined) return "bit-flip";
  if (
    value !== "bit-flip" &&
    value !== "ascii-shuffle" &&
    value !== "color-drain"
  ) {
    throw new Error("Choose bit-flip, ascii-shuffle, or color-drain.");
  }
  return value;
}

export function validateSize(size: number): void {
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
    throw new Error("Choose a non-empty file no larger than 5 MiB.");
  }
}

export function safeText(text: string): string {
  // Remove terminal controls and bidirectional overrides from untrusted labels.
  return text.replace(/[\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/g, "");
}

export function downloadName(name: string, level: number): string {
  const safe =
    safeText(name)
      .replace(/[\\/:*?"<>|]/g, "_")
      .slice(0, 160) || "sample.bin";
  const dot = safe.lastIndexOf(".");
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const extension = dot > 0 ? safe.slice(dot) : ".bin";
  return `${stem}_level${level}${extension}`;
}

export function pngDimensions(bytes: Uint8Array): {
  width: number;
  height: number;
} {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 33 ||
    !signature.every((n, i) => bytes[i] === n) ||
    bytes[12] !== 73 ||
    bytes[13] !== 72 ||
    bytes[14] !== 68 ||
    bytes[15] !== 82
  ) {
    throw new Error("Colour drain requires a valid PNG file.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16),
    height = view.getUint32(20);
  if (
    !width ||
    !height ||
    width * height > MAX_PIXELS ||
    width > 4096 ||
    height > 4096
  ) {
    throw new Error(
      "Use a PNG up to 4 million pixels and 4096 pixels per side.",
    );
  }
  return { width, height };
}

export function decayBytes(
  input: Uint8Array,
  mode: "bit-flip" | "ascii-shuffle",
  level: number,
  random = Math.random,
): Uint8Array {
  validateSize(input.byteLength);
  parseLevel(String(level));
  if (level === 0) return input.slice();
  const iterations = Math.min(
    MAX_OPERATIONS,
    Math.max(1, Math.floor(input.length * 0.01 * level)),
  );
  const output = input.slice();
  if (mode === "bit-flip") {
    for (let i = 0; i < iterations; i++) {
      const index = Math.floor(random() * output.length);
      output[index] ^= 1 << Math.floor(random() * 8);
    }
    return output;
  }
  if (mode !== "ascii-shuffle")
    throw new Error("Unsupported byte transformation.");
  if (input.some((byte) => byte > 127))
    throw new Error("ASCII shuffle requires plain ASCII text.");
  if (output.length < 2) return output;
  for (let i = 0; i < iterations; i++) {
    const a = Math.floor(random() * output.length);
    const b =
      (a + 1 + Math.floor(random() * (output.length - 1))) % output.length;
    [output[a], output[b]] = [output[b], output[a]];
  }
  return output;
}
