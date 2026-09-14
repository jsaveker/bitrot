import {
  ArrowRight,
  ArrowUpRight,
  Fingerprint,
  Radio,
  ScanLine,
} from "lucide-react";
import { Link } from "react-router-dom";
import Workbench from "./Workbench";
import { PRESETS, recipeSearch } from "../lib/recipes";
export default function Home() {
  return (
    <main id="main" className="home page-width">
      <div className="hero-topline">
        <span className="eyebrow">AN EXPERIMENT IN DIGITAL ENTROPY</span>
        <span className="mono muted">EST. 2025 / STILL DECAYING</span>
      </div>
      <div className="hero">
        <div>
          <h1>
            Break a few bits.
            <br />
            <span>See what survives.</span>
          </h1>
          <p>
            Nothing digital lasts forever. Turn up the noise, pull apart a file,
            and discover what holds it together.
          </p>
        </div>
        <div className="hero-aside">
          <span className="ascii-signature" aria-hidden="true">
            {"01000010\n01001001\n01010100"}
          </span>
          <span className="eyebrow">
            A LITTLE DAMAGE.
            <br />A LOT TO DISCOVER.
          </span>
        </div>
      </div>
      <Workbench compact />
      <section
        className="experiments-section"
        aria-labelledby="experiments-title"
      >
        <div className="section-line">
          <h2 id="experiments-title">Pick something to break.</h2>
          <span>THREE WAYS TO LOSE THE SIGNAL</span>
        </div>
        <div className="experiment-cards">
          {PRESETS.map((preset, i) => {
            const Icon = [ScanLine, Radio, Fingerprint][i];
            return (
              <Link
                key={preset.name}
                to={`/lab?${recipeSearch(preset.recipe)}`}
                className="experiment-card"
              >
                <div className="card-index">
                  <span>EXPERIMENT / 0{i + 1}</span>
                  <Icon size={22} />
                </div>
                <h3>{preset.name}</h3>
                <p>{preset.description}</p>
                <span className="card-link">
                  Try experiment <ArrowUpRight size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <Link className="learn-banner" to="/learn">
        <span className="eyebrow">UNDERSTAND THE DAMAGE</span>
        <strong>
          A checksum can spot it.
          <br />A backup can save it.
        </strong>
        <span>
          Learn by breaking things <ArrowRight size={20} />
        </span>
      </Link>
    </main>
  );
}
