import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Wordmark from "./Wordmark";
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
    document.title = `${pathname === "/lab" ? "Workbench" : pathname === "/learn" ? "Field manual" : "File decay utility"} — Bitrot`;
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
            <Wordmark /><span className="brand-suffix">.sh</span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              Samples
            </NavLink>
            <NavLink to="/lab">Workbench</NavLink>
            <NavLink to="/learn">Field manual</NavLink>
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
            <span className="motion-check" aria-hidden="true">{effects ? "×" : " "}</span>
            <span>Motion {effects ? "on" : "off"}</span>
          </button>
        </header>
        {children}
        <footer className="site-footer">
          <span>Local processing. Original files stay untouched.</span>
          <a
            href="https://github.com/jsaveker/bitrot"
            target="_blank"
            rel="noreferrer"
          >
            Source code
          </a>
          <span className="footer-id">bitrot.sh</span>
        </footer>
      </div>
    </EffectsContext.Provider>
  );
}
