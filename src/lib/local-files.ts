import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  downloadName,
  parseLevel,
  parseMode,
  parseSeed,
  validateSize,
  compareBytes,
  type ByteMetrics,
} from "./local-decay";
import { SAMPLES, type Recipe, type SampleId } from "./recipes";

export interface ExperimentRun {
  id: string;
  recipe: Recipe;
  metrics: ByteMetrics;
}
export interface LocalFile {
  id: string;
  filename: string;
  size: number;
  original: Uint8Array;
  latest: Uint8Array;
  currentLevel: number;
  sample?: SampleId;
  run?: ExperimentRun;
  history: ExperimentRun[];
}
/** Only metadata and the original/latest buffers live in this tab. Never persisted or uploaded. */
export class LocalFiles {
  private files = new Map<string, LocalFile>();
  private totalBytes = 0;
  private version = 0;
  private listeners = new Set<() => void>();
  selectedId: string | null = null;
  processing = false;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getVersion = () => this.version;
  notify() {
    this.version++;
    this.listeners.forEach((listener) => listener());
  }
  select(id: string) {
    this.get(id);
    this.selectedId = id;
    this.notify();
  }
  add(name: string, bytes: Uint8Array, sample?: SampleId): LocalFile {
    validateSize(bytes.byteLength);
    if (
      this.files.size >= MAX_FILES ||
      this.totalBytes + bytes.byteLength > MAX_TOTAL_BYTES
    )
      throw new Error(
        "This tab is full (10 files or 20 MiB). Remove a file to make room.",
      );
    const original = bytes.slice();
    const file: LocalFile = {
      id: crypto.randomUUID(),
      filename: name,
      size: bytes.byteLength,
      original,
      latest: original,
      currentLevel: 0,
      history: [],
      sample,
    };
    this.files.set(file.id, file);
    this.totalBytes += file.size;
    this.selectedId = file.id;
    this.notify();
    return file;
  }
  list(): LocalFile[] {
    return [...this.files.values()];
  }
  get(id: string): LocalFile {
    const file = this.files.get(id);
    if (!file)
      throw new Error(
        "File not found in this tab. Use load to choose it again.",
      );
    return file;
  }
  forget(id: string) {
    if (this.processing)
      throw new Error(
        "Wait for the current experiment before removing a file.",
      );
    const file = this.get(id);
    this.files.delete(id);
    this.totalBytes -= file.size;
    if (this.selectedId === id) this.selectedId = this.list()[0]?.id ?? null;
    this.notify();
  }
  saveResult(
    id: string,
    level: number,
    bytes: Uint8Array,
    run?: ExperimentRun,
  ) {
    parseLevel(String(level));
    validateSize(bytes.byteLength);
    const file = this.get(id);
    file.latest = bytes;
    file.currentLevel = level;
    file.run = run;
    if (run) file.history = [...file.history, run].slice(-12);
    this.notify();
  }
}
export const localFiles = new LocalFiles();
const pendingSamples = new Map<SampleId, Promise<LocalFile>>();
export async function loadSample(id: SampleId): Promise<LocalFile> {
  const existing = localFiles.list().find((file) => file.sample === id);
  if (existing) return existing;
  const pending = pendingSamples.get(id);
  if (pending) return pending;
  const sample = SAMPLES.find((item) => item.id === id);
  if (!sample) throw new Error("Unknown sample.");
  const request = (async () => {
    const response = await fetch(sample.path);
    if (!response.ok)
      throw new Error(
        "The sample could not load. Try again or choose a local file.",
      );
    const bytes = new Uint8Array(await response.arrayBuffer());
    return localFiles.add(sample.filename, bytes, id);
  })();
  pendingSamples.set(id, request);
  try {
    return await request;
  } finally {
    pendingSamples.delete(id);
  }
}
export async function loadLocalFile(file: File): Promise<LocalFile> {
  validateSize(file.size);
  return localFiles.add(file.name, new Uint8Array(await file.arrayBuffer()));
}
export function computeFile(
  id: string,
  rawLevel: unknown,
  rawMode: unknown,
  rawSeed: unknown = "bitrot",
  save = false,
): Promise<{ run: ExperimentRun; bytes: Uint8Array }> {
  const level = parseLevel(rawLevel),
    mode = parseMode(rawMode),
    seed = parseSeed(rawSeed);
  const file = localFiles.get(id);
  if (localFiles.processing)
    throw new Error(
      "An experiment is already running. Please wait for it to finish.",
    );
  const worker = new Worker(new URL("./decay.worker.ts", import.meta.url), {
    type: "module",
  });
  localFiles.processing = true;
  if (save) localFiles.select(id);
  else localFiles.notify();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (
      error?: Error,
      result?: { run: ExperimentRun; bytes: Uint8Array },
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      localFiles.processing = false;
      localFiles.notify();
      error ? reject(error) : resolve(result!);
    };
    const timer = setTimeout(
      () => finish(new Error("Processing timed out. Try a smaller file.")),
      5000,
    );
    worker.onmessage = ({
      data,
    }: MessageEvent<{
      bytes?: Uint8Array;
      metrics?: ByteMetrics;
      error?: string;
    }>) => {
      if (data.error) return finish(new Error(data.error));
      try {
        if (!(data.bytes instanceof Uint8Array))
          throw new Error("Invalid processing result.");
        const run: ExperimentRun = {
          id: crypto.randomUUID(),
          recipe: { v: 1, level, mode, seed, sample: file.sample },
          metrics: data.metrics ?? compareBytes(file.original, data.bytes),
        };
        if (save) localFiles.saveResult(id, level, data.bytes, run);
        finish(undefined, { run, bytes: data.bytes });
      } catch (error) {
        finish(
          error instanceof Error ? error : new Error("Processing failed."),
        );
      }
    };
    worker.onerror = () =>
      finish(new Error("This browser could not process the file."));
    try {
      const bytes = file.original.slice();
      worker.postMessage({ bytes, level, mode, seed }, [bytes.buffer]);
    } catch {
      finish(new Error("Unable to start local processing."));
    }
  });
}
export async function transformFile(
  id: string,
  rawLevel: unknown,
  rawMode: unknown,
  rawSeed: unknown = "bitrot",
): Promise<ExperimentRun> {
  return (await computeFile(id, rawLevel, rawMode, rawSeed, true)).run;
}
export function downloadFile(id: string, requestedLevel?: string): string {
  const file = localFiles.get(id),
    level =
      requestedLevel === undefined
        ? file.currentLevel
        : parseLevel(requestedLevel);
  if (level !== 0 && level !== file.currentLevel)
    throw new Error(
      "Only the original and latest result are kept. Replay that level first.",
    );
  const bytes = level === 0 ? file.original : file.latest;
  const url = URL.createObjectURL(
    new Blob([bytes.slice().buffer], { type: "application/octet-stream" }),
  );
  const name = downloadName(file.filename, level),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
