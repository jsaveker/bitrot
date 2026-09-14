import { Component, Suspense, lazy } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Shell from "./components/Shell";
const Home = lazy(() => import("./components/Home"));
const Learn = lazy(() => import("./components/Learn"));
const Lab = lazy(() => import("./components/Lab"));
const AttackFlows = lazy(() => import("./components/AttackFlows"));
const IncidentReport = lazy(() => import("./components/IncidentReport"));
const ModernIncidentView = lazy(
  () => import("./components/ModernIncidentView"),
);
class RouteError extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main id="main" className="page-width route-message">
        <h1>The signal was interrupted.</h1>
        <p>This page could not load.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Reload page
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <Shell>
      <RouteError>
        <Suspense
          fallback={
            <main id="main" className="page-width route-message" role="status">
              Opening the archive…
            </main>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/attack/*" element={<AttackFlows />} />
            <Route path="/incident" element={<IncidentReport />} />
            <Route path="/inc" element={<ModernIncidentView />} />
            <Route
              path="*"
              element={
                <main id="main" className="page-width route-message">
                  <h1>Signal not found.</h1>
                  <Link to="/">Return to Bitrot</Link>
                </main>
              }
            />
          </Routes>
        </Suspense>
      </RouteError>
    </Shell>
  );
}
