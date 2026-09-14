import { useFiles } from "../hooks/useFiles";

const letters = [
  ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
];

export default function Wordmark() {
  const { file } = useFiles();
  const damage = file?.run?.recipe.level ?? 0;
  return (
    <svg className="wordmark" viewBox="0 0 72 16" aria-hidden="true" fill="currentColor">
      {letters.flatMap((rows, letter) => rows.flatMap((row, y) => Array.from(row, (pixel, x) => {
        if (pixel === "0") return null;
        const worn = letter > 2 && (x * 3 + y * 7 + letter) % 23 < damage / 2;
        return <rect key={`${letter}-${x}-${y}`} x={(letter * 6 + x) * 2 + (worn ? 0.6 : 0)} y={y * 2 + (worn ? 1 : 0)} width="1.65" height="1.65" className={worn ? "worn-pixel" : undefined} />;
      })))}
    </svg>
  );
}
