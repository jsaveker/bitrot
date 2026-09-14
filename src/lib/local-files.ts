import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  downloadName,
  parseLevel,
  parseMode,
  validateSize,
} from "./local-decay";

interface LocalFile {
  id: string;
  filename: string;
  size: number;
  original: Uint8Array;
  latest: Uint8Array;
  currentLevel: number;
}

/** Tab-memory only. No cookies, IndexedDB, localStorage, network, or cloud fallback. */
export class LocalFiles {
  private files = new Map<string, LocalFile>();
  private totalBytes = 0;

  add(name: string, bytes: Uint8Array): LocalFile {
    validateSize(bytes.byteLength);
    if (
      this.files.size >= MAX_FILES ||
      this.totalBytes + bytes.byteLength > MAX_TOTAL_BYTES
    ) {
      throw new Error(
        "This tab is full (10 files or 20 MiB). Use forget <id> to make room.",
      );
    }
    const original = bytes.slice();
    const file = {
      id: crypto.randomUUID(),
      filename: name,
      size: bytes.byteLength,
      original,
      latest: original,
      currentLevel: 0,
    };
    this.files.set(file.id, file);
    this.totalBytes += file.size;
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

  forget(id: string): void {
    const file = this.get(id);
    this.files.delete(id);
    this.totalBytes -= file.size;
  }

  saveResult(id: string, level: number, bytes: Uint8Array): void {
    parseLevel(String(level));
    validateSize(bytes.byteLength);
    const file = this.get(id);
    file.latest = bytes;
    file.currentLevel = level;
  }
}

export const localFiles = new LocalFiles();
let processing = false;

export function transformFile(
  id: string,
  rawLevel: unknown,
  rawMode: unknown,
): Promise<void> {
  const level = parseLevel(rawLevel),
    mode = parseMode(rawMode);
  const file = localFiles.get(id);
  if (processing)
    throw new Error(
      "An experiment is already running. Please wait for it to finish.",
    );
  const worker = new Worker(new URL("./decay.worker.ts", import.meta.url), {
    type: "module",
  });
  processing = true;
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      worker.terminate();
      processing = false;
      error ? reject(error) : resolve();
    };
    const timer = setTimeout(
      () => finish(new Error("Processing timed out. Try a smaller file.")),
      5000,
    );
    worker.onmessage = ({
      data,
    }: MessageEvent<{ bytes?: Uint8Array; error?: string }>) => {
      if (data.error) return finish(new Error(data.error));
      try {
        if (!(data.bytes instanceof Uint8Array))
          throw new Error("Invalid processing result.");
        localFiles.saveResult(id, level, data.bytes);
        finish();
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
      worker.postMessage({ bytes, level, mode }, [bytes.buffer]);
    } catch {
      finish(new Error("Unable to start local processing."));
    }
  });
}

export function downloadFile(id: string, requestedLevel?: string): string {
  const file = localFiles.get(id);
  const level =
    requestedLevel === undefined
      ? file.currentLevel
      : parseLevel(requestedLevel);
  if (level !== 0 && level !== file.currentLevel)
    throw new Error(
      "Only the original and latest result are kept. Use rot to generate that level.",
    );
  const bytes = level === 0 ? file.original : file.latest;
  // Never navigate to or preview user-controlled HTML/SVG. Downloads are opaque bytes.
  const url = URL.createObjectURL(
    new Blob([bytes.slice().buffer], { type: "application/octet-stream" }),
  );
  const name = downloadName(file.filename, level);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
