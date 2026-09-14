import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TerminalSquare } from "lucide-react";
import Workbench from "./Workbench";
import { parseRecipe } from "../lib/recipes";
const Terminal = lazy(() => import("./Terminal"));
export default function Lab() {
  const [search] = useSearchParams();
  const [terminal, setTerminal] = useState(false);
  const drawer = useRef(null);
  let recipe, error;
  try {
    recipe = parseRecipe(search.toString());
  } catch (failure) {
    error = failure.message;
  }
  useEffect(() => {
    if (terminal) drawer.current?.scrollIntoView({ block: "start" });
  }, [terminal]);
  return (
    <main id="main" className="page-width lab-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow muted">THE DATA DECAY LAB / 002</span>
          <h1>Introduce a little chaos.</h1>
          <p>Change a copy. Inspect the damage. Replay what happened.</p>
        </div>
        <button
          className="button secondary"
          aria-expanded={terminal}
          aria-controls="terminal-drawer"
          onClick={() => setTerminal((value) => !value)}
        >
          <TerminalSquare size={16} />{" "}
          {terminal ? "Close terminal" : "Open terminal"}
        </button>
      </div>
      {error ? (
        <section className="feedback error" role="alert">
          <p>{error}</p>
          <a href="/lab">Start a fresh experiment</a>
        </section>
      ) : (
        <Workbench
          key={search.toString()}
          initialRecipe={recipe}
          onTerminal={() => setTerminal(true)}
        />
      )}
      {terminal && (
        <section
          ref={drawer}
          id="terminal-drawer"
          className="terminal-drawer"
          aria-label="Terminal"
        >
          <div className="terminal-heading">
            <span>TERMINAL / SAME FILES, SAME ENGINE</span>
            <button onClick={() => setTerminal(false)}>Close</button>
          </div>
          <Suspense
            fallback={
              <div className="terminal-body" role="status">
                Starting terminal…
              </div>
            }
          >
            <Terminal />
          </Suspense>
        </section>
      )}
    </main>
  );
}
