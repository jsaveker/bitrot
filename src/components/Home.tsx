import { useState } from "react";
import { Link } from "react-router-dom";
import { useFiles } from "../hooks/useFiles";
import { PRESETS, type Recipe } from "../lib/recipes";
import Workbench from "./Workbench";

export default function Home() {
  const { file, busy } = useFiles();
  const [sampleLoading, setSampleLoading] = useState(false);
  const [selection, setSelection] = useState<{ recipe: Recipe; serial: number } | null>(null);
  return (
    <main id="main" className="home page-width">
      <div className="page-heading">
        <div>
          <h1>File decay utility</h1>
          <p>Open a sample. Alter a copy. Inspect what changed.</p>
        </div>
        <Link className="button secondary" to="/lab">Open your own file…</Link>
      </div>
      <div className="archive-layout">
        <div className="archive-workspace" id="sample-inspector" tabIndex={-1}>
          <Workbench key={selection?.serial ?? 0} compact initialRecipe={selection?.recipe} onLoadingChange={setSampleLoading} />
          <div className="manual-index">
            <span>From the field manual</span>
            <Link to="/learn"><span>01</span> Detect damage with a checksum</Link>
            <Link to="/learn?lesson=backup"><span>02</span> Recover from a backup</Link>
          </div>
        </div>
        <aside className="sample-directory" aria-label="Sample directory">
          <h2>Sample directory</h2>
          <div className="directory-count">2 files / 3 experiments</div>
          {PRESETS.map((preset, i) => {
            const selected = file?.sample === preset.recipe.sample && file?.run?.recipe.mode === preset.recipe.mode;
            return (
              <button
                key={preset.name}
                className="sample-entry"
                aria-pressed={selected}
                disabled={busy || sampleLoading}
                onClick={() => {
                  setSampleLoading(true);
                  setSelection({ recipe: preset.recipe, serial: (selection?.serial ?? 0) + 1 });
                  document.getElementById("sample-inspector")?.focus({ preventScroll: true });
                  document.getElementById("sample-inspector")?.scrollIntoView({ block: "start" });
                }}
              >
                <span className={`sample-thumbnail specimen-${i}`} aria-hidden="true">
                  {i === 0 ? <img src="/samples/lunar.png" alt="" width="160" height="100" /> :
                    <span>{i === 1 ? "DEEP SPACE NETWORK\nMISSION: VOYAGER\nSIGNAL: STILL HERE\n------------------\nAcross the dark," : "44 45 45 50 20 53\n50 41 43 45 20 4e\n45 54 57 4f 52 4b\n2f 20 41 52 43 48\n49 56 45 20 30 30"}</span>}
                </span>
                <span className="sample-filename">{i === 0 ? "lunar.png" : "transmission.txt"}</span>
                <span className="sample-operation">{preset.name}</span>
                <span className="sample-details">{i === 0 ? "PNG · NASA / 1968" : i === 1 ? "TEXT · ASCII shuffle" : "TEXT · Bit flip"}</span>
              </button>
            );
          })}
          <p className="directory-note">Bundled samples.<br />The originals stay intact.</p>
        </aside>
      </div>
    </main>
  );
}
