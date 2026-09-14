import { useEffect, useRef, useState } from "react";
import { pngDimensions, type ByteMetrics } from "../lib/local-decay";
import type { LocalFile } from "../lib/local-files";

export function isPng(bytes: Uint8Array) {
  try {
    pngDimensions(bytes);
    return true;
  } catch {
    return false;
  }
}
function PngCanvas({ bytes, label }: { bytes: Uint8Array; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    const canvas = ref.current;
    if (canvas)
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    (async () => {
      const { width, height } = pngDimensions(bytes);
      const bitmap = await createImageBitmap(
        new Blob([bytes.slice().buffer], { type: "image/png" }),
      );
      try {
        if (bitmap.width !== width || bitmap.height !== height)
          throw new Error("Invalid dimensions");
        if (!active || !canvas) return;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(bitmap, 0, 0);
      } finally {
        bitmap.close();
      }
    })().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [bytes]);
  return (
    <>
      <canvas ref={ref} role="img" aria-label={label} hidden={error} />
      {error && (
        <div className="decode-error">
          <span>×</span>
          <strong>Image can no longer be decoded</strong>
          <p>
            The changed bytes broke this PNG. Switch to the byte view to inspect
            the damage.
          </p>
        </div>
      )}
    </>
  );
}
const printable = (byte?: number) =>
  byte === undefined
    ? "·"
    : byte === 10
      ? "\n"
      : byte >= 32 && byte <= 126
        ? String.fromCharCode(byte)
        : "·";
export default function BytePreview({
  file,
  view = "compare",
  beforeLabel = "ORIGINAL",
  afterLabel = "RESULT",
}: {
  file: LocalFile;
  view?: "compare" | "bytes";
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [split, setSplit] = useState(50);
  const png = isPng(file.original);
  if (view === "bytes" || (!png && file.original.some((byte) => byte > 127))) {
    return (
      <div className="hex-preview">
        <div className="pane-label">
          <span>OFFSET</span>
          <span>ORIGINAL → RESULT / HEX</span>
        </div>
        <div className="hex-grid">
          {Array.from(file.latest.slice(0, 192), (byte, i) => (
            <span
              key={i}
              className={byte !== file.original[i] ? "changed" : ""}
              title={`Offset ${i}: ${file.original[i]?.toString(16).padStart(2, "0") ?? "absent"} → ${byte.toString(16).padStart(2, "0")}`}
            >
              {byte.toString(16).padStart(2, "0")}
            </span>
          ))}
        </div>
        <p className="preview-note">
          First {Math.min(192, file.latest.length)} bytes · highlighted bytes
          differ from the original. Full-file measurements below.
        </p>
      </div>
    );
  }
  if (!png)
    return (
      <div className="text-comparison">
        {[false, true].map((result) => (
          <div className="text-pane" key={String(result)}>
            <div className="pane-label">
              {result ? afterLabel : beforeLabel}
            </div>
            <pre aria-label={result ? "Transformed text" : "Original text"}>
              {Array.from(
                (result ? file.latest : file.original).slice(0, 1800),
                (byte, i) => (
                  <span
                    key={i}
                    className={
                      result && byte !== file.original[i] ? "changed" : ""
                    }
                  >
                    {printable(byte)}
                  </span>
                ),
              )}
            </pre>
          </div>
        ))}
        {file.original.length > 1800 && (
          <p className="preview-note">
            Preview limited to the first 1,800 bytes. Measurements cover the
            complete file.
          </p>
        )}
      </div>
    );
  return (
    <div className="image-comparison">
      <div className="image-stage">
        <PngCanvas bytes={file.original} label={beforeLabel} />
        <div
          className="result-layer"
          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
        >
          <PngCanvas bytes={file.latest} label={afterLabel} />
        </div>
        <div className="comparison-labels" aria-hidden="true">
          <span>{beforeLabel}</span>
          <span>{afterLabel}</span>
        </div>
        <div
          className="comparison-line"
          style={{ left: `${split}%` }}
          aria-hidden="true"
        >
          <span>↔</span>
        </div>
        <input
          className="comparison-range"
          aria-label="Image comparison position"
          aria-valuetext={`${split}% original, ${100 - split}% result`}
          type="range"
          min="0"
          max="100"
          value={split}
          onChange={(event) => setSplit(Number(event.target.value))}
        />
      </div>
      <div className="image-caption">
        <span>Drag to compare</span>
        {file.sample === "lunar" && (
          <a
            href="https://science.nasa.gov/resource/image-earthrise/"
            target="_blank"
            rel="noreferrer"
          >
            Earthrise · NASA / Bill Anders
          </a>
        )}
      </div>
    </div>
  );
}
export function ByteMap({ metrics }: { metrics?: ByteMetrics }) {
  return (
    <div
      className="byte-map"
      role="img"
      aria-label={
        metrics
          ? `Byte change map: ${metrics.changed} of ${metrics.total} bytes changed. Brighter cells indicate more changes.`
          : "Byte change map: unchanged original"
      }
    >
      {(metrics?.buckets ?? Array(64).fill(0)).map((value, i) => (
        <span
          key={i}
          style={{
            backgroundColor: value
              ? `rgba(208, 246, 107, ${0.2 + value * 0.8})`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}
