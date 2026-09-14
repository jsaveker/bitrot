import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Copy,
  FolderOpen,
  Play,
  RotateCcw,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFiles } from "../hooks/useFiles";
import {
  downloadFile,
  loadLocalFile,
  loadSample,
  localFiles,
  transformFile,
} from "../lib/local-files";
import {
  PRESETS,
  recipeSearch,
  type Recipe,
} from "../lib/recipes";
import type { DecayMode } from "../lib/local-decay";
import RunComparison from "./RunComparison";
import BytePreview, { ByteMap } from "./BytePreview";
const modeLabels = {
  "color-drain": "Colour drain",
  "ascii-shuffle": "ASCII shuffle",
  "bit-flip": "Bit flip",
};
export default function Workbench({
  compact = false,
  initialRecipe,
  onTerminal,
  onLoadingChange,
}: {
  compact?: boolean;
  initialRecipe?: Recipe | null;
  onTerminal?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const { file, files, busy } = useFiles();
  const [level, setLevel] = useState(initialRecipe?.level ?? 4),
    [mode, setMode] = useState<DecayMode>(initialRecipe?.mode ?? "color-drain"),
    [seed, setSeed] = useState(initialRecipe?.seed ?? "apollo");
  const [view, setView] = useState<"compare" | "bytes">("compare");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    initialized = useRef(false),
    debounce = useRef<ReturnType<typeof setTimeout>>();
  const run = async (
    id: string,
    recipe: Pick<Recipe, "level" | "mode" | "seed">,
  ) => {
    setError("");
    setNotice("");
    try {
      await transformFile(id, String(recipe.level), recipe.mode, recipe.seed);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Experiment failed.");
    }
  };
  const applyRecipe = async (recipe: Recipe) => {
    setLoading(true);
    onLoadingChange?.(true);
    setError("");
    setMode(recipe.mode);
    setLevel(recipe.level);
    setSeed(recipe.seed);
    setView("compare");
    try {
      const sample = await loadSample(recipe.sample!);
      localFiles.select(sample.id);
      await run(sample.id, recipe);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sample unavailable.");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (initialRecipe) {
      void applyRecipe(initialRecipe);
      return;
    }
    if (!localFiles.selectedId)
      void applyRecipe({
        v: 1,
        sample: "lunar",
        level: 4,
        mode: "color-drain",
        seed: "apollo",
      });
    else {
      const selected = localFiles.get(localFiles.selectedId);
      if (selected.run) {
        setLevel(selected.run.recipe.level);
        setMode(selected.run.recipe.mode);
        setSeed(selected.run.recipe.seed);
      }
    }
  }, []);
  useEffect(() => {
    if (file?.run) {
      setLevel(file.run.recipe.level);
      setMode(file.run.recipe.mode);
      setSeed(file.run.recipe.seed);
    } else if (file) {
      setLevel(0);
      setMode(
        file.original[0] === 137
          ? "color-drain"
          : file.original.every((byte) => byte <= 127)
            ? "ascii-shuffle"
            : "bit-flip",
      );
    }
  }, [file?.run?.id, file?.id]);
  useEffect(() => () => clearTimeout(debounce.current), []);
  const metrics = file?.run?.metrics;
  const percent = metrics ? (metrics.changed / metrics.total) * 100 : 0;
  const changeLevel = (value: number) => {
    setLevel(value);
    if (compact && file) {
      clearTimeout(debounce.current);
      debounce.current = setTimeout(
        () => void run(file.id, { level: value, mode, seed }),
        160,
      );
    }
  };
  const importFile = async (selected?: File) => {
    if (!selected) return;
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const loaded = await loadLocalFile(selected);
      setLevel(0);
      setMode(
        loaded.original[0] === 137
          ? "color-drain"
          : loaded.original.every((byte) => byte <= 127)
            ? "ascii-shuffle"
            : "bit-flip",
      );
      setView("compare");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load file.");
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  };
  const disabled = busy || loading;
  return (
    <section
      className={`workbench ${compact ? "compact" : ""}`}
      aria-label="Data decay experiment"
      aria-busy={disabled}
      data-processing={disabled}
    >
      <div className="workbench-bar">
        <span className="eyebrow">
          File inspector
        </span>
        <span className="muted mono">
          {disabled ? "Working…" : "Ready"}
        </span>
      </div>
      {!compact && (
        <div className="file-toolbar">
          <label className="file-select">
            File
            <select
              aria-label="Selected file"
              value={file?.id ?? ""}
              disabled={disabled}
              onChange={(event) => localFiles.select(event.target.value)}
            >
              {!files.length && <option value="">No file selected</option>}
              {files.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.filename}
                  {item.sample ? " · sample" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary"
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            <FolderOpen size={16} /> Choose local file
          </button>
          <button
            className="icon-button"
            aria-label="Remove selected file from this tab"
            disabled={!file || disabled}
            onClick={() => {
              if (file) localFiles.forget(file.id);
            }}
          >
            <Trash2 size={17} />
          </button>
          <input
            ref={input}
            type="file"
            hidden
            onChange={(event) => void importFile(event.target.files?.[0])}
          />
        </div>
      )}
      <div className="workbench-body">
        <div className="controls-column">
          <div className="control-heading">
              <span className="eyebrow">Alter working copy</span>
            <span className="mono muted">00—10</span>
          </div>
          <label className="field">
            Transformation
            <select
              value={mode}
              disabled={disabled}
              onChange={(event) => {
                const next = event.target.value as DecayMode;
                setMode(next);
                if (compact && file)
                  void run(file.id, { level, mode: next, seed });
              }}
            >
              {Object.entries(modeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="level-label">
            <label htmlFor="decay-level">Intensity</label>
            <output htmlFor="decay-level">
              {String(level).padStart(2, "0")}
              <span>/10</span>
            </output>
          </div>
          <input
            id="decay-level"
            type="range"
            min="0"
            max="10"
            step="1"
            value={level}
            disabled={disabled}
            onChange={(event) => changeLevel(Number(event.target.value))}
          />
          <div className="range-labels">
            <span>Untouched</span>
            <span>Maximum</span>
          </div>
          {!compact && (
            <label className="field">
              Experiment seed
              <input
                value={seed}
                maxLength={32}
                disabled={disabled}
                onChange={(event) => setSeed(event.target.value)}
                spellCheck={false}
              />
              <span className="field-help">
                Same original + seed + settings = repeatable byte changes.
                Colour drain uses intensity only.
              </span>
            </label>
          )}
          <button
            className="button primary run-button"
            disabled={!file || disabled}
            onClick={() => file && void run(file.id, { level, mode, seed })}
          >
            <Play size={16} fill="currentColor" />
            {disabled
              ? "Processing…"
              : compact
                ? "Apply decay"
                : "Apply decay"}
          </button>
          {!compact && (
            <div className="action-pair">
              <button
                className="button secondary"
                disabled={!file || disabled}
                onClick={() =>
                  file && void run(file.id, { level: 0, mode, seed })
                }
              >
                <RotateCcw size={15} /> Reset
              </button>
              <button
                className="button secondary"
                disabled={!file || disabled}
                onClick={() => {
                  if (file) {
                    downloadFile(file.id);
                    setNotice("Download prepared.");
                  }
                }}
              >
                <ArrowDownToLine size={15} /> Download
              </button>
            </div>
          )}
          {compact ? (
            <Link to="/lab" className="text-link">
              Full workbench <ArrowUpRight size={16} />
            </Link>
          ) : (
            <>
              <button
                className="text-link"
                disabled={!file?.sample || !file.run || disabled}
                onClick={async () => {
                  if (!file?.sample || !file.run) return;
                  const url = `${location.origin}/lab?${recipeSearch(file.run.recipe)}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    setNotice(
                      "Recipe link copied. Only the bundled sample and settings are shared.",
                    );
                  } catch {
                    setNotice(url);
                  }
                }}
              >
                <Copy size={15} /> Copy sample recipe
              </button>
              <button className="text-link" onClick={onTerminal}>
                <TerminalSquare size={16} /> Open terminal
              </button>
            </>
          )}
          <p className="local-note">
            {compact
              ? "Working copy only. Your original stays intact."
              : "Files stay in this tab. Reloading clears them. Up to 5 MiB per file."}
          </p>
        </div>
        <div className="preview-column">
          <div className="preview-bar">
            <span className="mono file-label">
              {file?.filename ?? "NO FILE SELECTED"}{" "}
              <span className="muted">
                {file ? `/ ${(file.size / 1024).toFixed(1)} KiB` : ""}
              </span>
            </span>
            <div className="segmented" aria-label="Preview mode">
              <button
                aria-pressed={view === "compare"}
                onClick={() => setView("compare")}
              >
                Compare
              </button>
              <button
                aria-pressed={view === "bytes"}
                onClick={() => setView("bytes")}
              >
                Bytes
              </button>
            </div>
          </div>
          {file ? (
            <BytePreview file={file} view={view} />
          ) : (
            <div className="empty-preview">
              <FolderOpen size={32} />
              <h3>
                {loading
                  ? "Opening the archive…"
                  : "No file open"}
              </h3>
              <p>Choose a sample below or load a local file.</p>
              <button
                className="button secondary"
                disabled={disabled}
                onClick={() => void applyRecipe(PRESETS[0].recipe)}
              >
                Try the lunar sample
              </button>
            </div>
          )}
          <div className="measurement-strip">
            <div>
              <span className="eyebrow">
                {metrics?.image ? "RGB INTENSITY RETAINED" : "BYTES CHANGED"}
              </span>
              <strong>
                {(metrics?.image?.intensityRetained ?? percent).toFixed(2)}
                <small>%</small>
              </strong>
            </div>
            <div>
              <span className="eyebrow">
                {metrics?.image ? "PIXELS CHANGED" : "BITS CHANGED"}
              </span>
              <strong>
                {(
                  metrics?.image?.pixelsChanged ??
                  metrics?.bits ??
                  0
                ).toLocaleString()}
              </strong>
            </div>
            <div className="map-measurement">
              <span className="eyebrow">CHANGE DISTRIBUTION</span>
              <ByteMap metrics={metrics} />
            </div>
          </div>
          <p className="measurement-note">
            {file?.run?.recipe.mode === "color-drain"
              ? "Intensity is measured from mean RGB values. The byte map includes PNG re-encoding."
              : "Measurements compare the complete result with the untouched original."}
          </p>
        </div>
      </div>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="feedback" role="status">
          {notice}
        </p>
      )}
      {!compact && (
        <div className="history">
          <div className="section-line">
            <h3>Run history</h3>
            <span>Replay from the original · last 12 runs</span>
          </div>
          {file?.history.length ? (
            <div className="history-runs">
              {file.history.map((item, i) => (
                <button
                  key={item.id}
                  disabled={disabled}
                  className={item.id === file.run?.id ? "selected" : ""}
                  onClick={() => void run(file.id, item.recipe)}
                  aria-label={`Replay run ${i + 1}, ${modeLabels[item.recipe.mode]}, level ${item.recipe.level}, seed ${item.recipe.seed}`}
                >
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  <strong>Level {item.recipe.level}</strong>
                  <span>{modeLabels[item.recipe.mode]}</span>
                  <small>{item.recipe.seed}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">
              Your runs will appear here. Every run starts from your original
              file.
            </p>
          )}
        </div>
      )}
      {!compact && file && file.history.length > 1 && (
        <RunComparison key={file.id} file={file} />
      )}
      {!compact && (
        <div className="preset-strip">
          <span className="eyebrow">Sample presets</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              disabled={disabled}
              onClick={() => void applyRecipe(preset.recipe)}
            >
              {preset.name}
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
