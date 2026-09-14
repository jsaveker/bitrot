import {
  decayBytes,
  parseLevel,
  parseMode,
  pngDimensions,
  validateSize,
  seededRandom,
  parseSeed,
  compareBytes,
} from "./local-decay";

self.onmessage = async ({
  data,
}: MessageEvent<{
  bytes: Uint8Array;
  mode: string;
  level: number;
  seed: string;
}>) => {
  try {
    const { bytes } = data;
    validateSize(bytes.byteLength);
    const mode = parseMode(data.mode),
      level = parseLevel(String(data.level));
    const seed = parseSeed(data.seed);
    let result: Uint8Array;
    let imageMetrics:
      | {
          intensityRetained: number;
          pixelsChanged: number;
          totalPixels: number;
        }
      | undefined;
    if (mode !== "color-drain" || level === 0) {
      result = decayBytes(
        bytes,
        mode === "color-drain" ? "bit-flip" : mode,
        level,
        seededRandom(seed),
      );
    } else {
      const { width, height } = pngDimensions(bytes);
      const bitmap = await createImageBitmap(
        new Blob([bytes.slice().buffer], { type: "image/png" }),
      );
      try {
        if (bitmap.width !== width || bitmap.height !== height)
          throw new Error("PNG dimensions do not match its header.");
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d");
        if (!context)
          throw new Error("Image processing is unavailable in this browser.");
        context.drawImage(bitmap, 0, 0);
        const image = context.getImageData(0, 0, width, height);
        const factor = 1 - Math.min(0.8, level * 0.08);
        let before = 0,
          after = 0,
          pixelsChanged = 0;
        for (let i = 0; i < image.data.length; i += 4) {
          const old = image.data[i] + image.data[i + 1] + image.data[i + 2];
          before += old;
          image.data[i] = Math.floor(image.data[i] * factor);
          image.data[i + 1] = Math.floor(image.data[i + 1] * factor);
          image.data[i + 2] = Math.floor(image.data[i + 2] * factor);
          const next = image.data[i] + image.data[i + 1] + image.data[i + 2];
          after += next;
          if (old !== next) pixelsChanged++;
        }
        imageMetrics = {
          intensityRetained: before ? (after / before) * 100 : 100,
          pixelsChanged,
          totalPixels: width * height,
        };
        context.putImageData(image, 0, 0);
        const blob = await canvas.convertToBlob({ type: "image/png" });
        validateSize(blob.size);
        result = new Uint8Array(await blob.arrayBuffer());
      } finally {
        bitmap.close();
      }
    }
    self.postMessage(
      {
        bytes: result,
        metrics: { ...compareBytes(bytes, result), image: imageMetrics },
      },
      { transfer: [result.buffer] },
    );
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Unable to transform this file.",
    });
  }
};
