import { useEffect, useState } from "react";
import {
  computeFile,
  type LocalFile,
  type ExperimentRun,
} from "../lib/local-files";
import { useFiles } from "../hooks/useFiles";
import BytePreview from "./BytePreview";
export default function RunComparison({ file }: { file: LocalFile }) {
  const { busy } = useFiles();
  const [first, setFirst] = useState(file.history.at(-2)!.id),
    [second, setSecond] = useState(file.history.at(-1)!.id);
  const [comparison, setComparison] = useState<{
      file: LocalFile;
      a: ExperimentRun;
      b: ExperimentRun;
    } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!file.history.some((run) => run.id === first))
      setFirst(file.history.at(-2)!.id);
    if (!file.history.some((run) => run.id === second))
      setSecond(file.history.at(-1)!.id);
  }, [file.history, first, second]);
  return (
    <section className="run-comparison" aria-label="Compare two runs">
      <div className="section-line">
        <h3>Compare two runs</h3>
        <span>Recomputed from the same original</span>
      </div>
      <div className="comparison-pickers">
        {[false, true].map((right) => (
          <label className="field" key={String(right)}>
            {right ? "Run B" : "Run A"}
            <select
              value={right ? second : first}
              disabled={busy || loading}
              onChange={(event) => {
                (right ? setSecond : setFirst)(event.target.value);
                setComparison(null);
              }}
            >
              {file.history.map((run, i) => (
                <option value={run.id} key={run.id}>
                  {i + 1}. Level {run.recipe.level} · {run.recipe.mode} ·{" "}
                  {run.recipe.seed}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          className="button secondary"
          disabled={busy || loading}
          onClick={async () => {
            setLoading(true);
            setError("");
            setComparison(null);
            try {
              const a = file.history.find((run) => run.id === first)!,
                b = file.history.find((run) => run.id === second)!;
              const left = await computeFile(
                file.id,
                String(a.recipe.level),
                a.recipe.mode,
                a.recipe.seed,
              );
              const right = await computeFile(
                file.id,
                String(b.recipe.level),
                b.recipe.mode,
                b.recipe.seed,
              );
              setComparison({
                file: { ...file, original: left.bytes, latest: right.bytes },
                a,
                b,
              });
            } catch (error) {
              setError(
                error instanceof Error ? error.message : "Comparison failed.",
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Comparing…" : "Compare runs"}
        </button>
      </div>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      {comparison && (
        <BytePreview
          file={comparison.file}
          beforeLabel={`A / LEVEL ${comparison.a.recipe.level}`}
          afterLabel={`B / LEVEL ${comparison.b.recipe.level}`}
        />
      )}
    </section>
  );
}
