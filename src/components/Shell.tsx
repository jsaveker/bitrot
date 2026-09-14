import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, AudioLines, ShieldCheck } from "lucide-react";
const EffectsContext = createContext(false);
export const useEffects = () => useContext(EffectsContext);
export default function Shell({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem("bitrot-effects") !== "off";
    } catch {
      return true;
    }
  });
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(!document.hidden);
  const { pathname } = useLocation();
  const effects = enabled && !reduced && visible;
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(query.matches),
      visibility = () => setVisible(!document.hidden);
    query.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      query.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    document.title = `${pathname === "/lab" ? "Data Decay Lab" : pathname === "/learn" ? "Integrity Lessons" : "Break a few bits. See what survives."} — Bitrot`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <EffectsContext.Provider value={effects}>
      <div className="bitrot-app" data-effects={effects ? "on" : "off"}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <Link to="/" className="brand" aria-label="Bitrot home">
            <span className="brand-mark" aria-hidden="true">
              ▥
            </span>
            BITROT<span className="brand-suffix">/SH</span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Overview
            </NavLink>
            <NavLink to="/lab">The lab</NavLink>
            <NavLink to="/learn">Learn</NavLink>
          </nav>
          <button
            className="effects-button"
            aria-pressed={enabled}
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              try {
                localStorage.setItem("bitrot-effects", next ? "on" : "off");
              } catch {
                /* Preferences are optional. */
              }
            }}
            title={
              reduced ? "Reduced motion is respected" : "Toggle visual effects"
            }
          >
            <AudioLines size={16} aria-hidden="true" />
            <span>Effects {effects ? "on" : "off"}</span>
          </button>
        </header>
        {children}
        <footer className="site-footer">
          <span>
            <ShieldCheck size={15} aria-hidden="true" /> Local experiments.
            Original files stay untouched.
          </span>
          <a
            href="https://github.com/jsaveker/bitrot"
            target="_blank"
            rel="noreferrer"
          >
            Built for the curious <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <span className="footer-id">BITROT / 002</span>
        </footer>
      </div>
    </EffectsContext.Provider>
  );
}
