import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Fingerprint,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import lessons from "../generated/lessons.json";
import { compareBytes } from "../lib/local-decay";
import { flipOneBit, sha256 } from "../lib/integrity";
const original = new TextEncoder().encode("THE SIGNAL IS STILL HERE.");
export default function Learn() {
  const [search, setSearch] = useSearchParams();
  const selected = search.get("lesson") === "backup" ? 1 : 0;
  const [working, setWorking] = useState<Uint8Array>(original.slice()),
    [backup, setBackup] = useState<Uint8Array | null>(null);
  const [hashes, setHashes] = useState<{
      original: string;
      working: string;
    } | null>(null),
    [error, setError] = useState("");
  const [finished, setFinished] = useState<string[]>([]),
    [restored, setRestored] = useState(false);
  const lesson = lessons[selected],
    damaged = compareBytes(original, working).bits > 0;
  useEffect(() => {
    setWorking(original.slice());
    setBackup(null);
    setRestored(false);
  }, [selected]);
  useEffect(() => {
    let active = true;
    setHashes(null);
    setError("");
    Promise.all([sha256(original), sha256(working)])
      .then(([a, b]) => {
        if (active) setHashes({ original: a, working: b });
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [working]);
  useEffect(() => {
    if (
      hashes &&
      ((lesson.kind === "checksum" && damaged) ||
        (lesson.kind === "backup" && restored))
    )
      setFinished((previous) =>
        previous.includes(lesson.id) ? previous : [...previous, lesson.id],
      );
  }, [hashes, damaged, restored, lesson.id, lesson.kind]);
  const reset = () => {
    setWorking(original.slice());
    setBackup(null);
    setRestored(false);
  };
  return (
    <main id="main" className="page-width learn-page">
      <div className="page-heading">
        <div>
          <h1>Field manual</h1>
          <p>Detect a damaged file. Recover an intact copy.</p>
        </div>
        <span className="lesson-progress mono">
          {finished.length} / {lessons.length} explored
        </span>
      </div>
      <div className="lesson-layout">
        <aside className="lesson-sidebar">
          <div className="eyebrow muted">Contents</div>
          {lessons.map((item, i) => (
            <button
              key={item.id}
              aria-pressed={selected === i}
              onClick={() => {
                setSearch(item.kind === "backup" ? { lesson: "backup" } : {});
              }}
            >
              <span className="lesson-number">
                {finished.includes(item.id) ? <Check size={18} /> : `0${i + 1}`}
              </span>
              <span>
                <strong>
                  {item.kind === "checksum" ? "Checksums" : "Backups"}
                </strong>
                <small>
                  {item.kind === "checksum"
                    ? "Detect the damage"
                    : "Recover the original"}
                </small>
              </span>
            </button>
          ))}
          <div className="sidebar-note">
            <ShieldCheck size={20} />
            <p>
              These exercises run on your device. Reloading clears your work.
            </p>
          </div>
          <Link to="/lab" className="text-link">
            Open workbench →
          </Link>
        </aside>
        <article className="lesson-content">
          <div className="lesson-intro">
            <span className="eyebrow">
              {String(selected + 1).padStart(2, "0")} / {lesson.kind === "checksum" ? "Damage detection" : "File recovery"}
            </span>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
          </div>
          <div className="challenge">
            <div className="workbench-bar">
              <span className="eyebrow">YOUR WORKING MESSAGE</span>
              <span className={`integrity-status ${damaged ? "damaged" : ""}`}>
                {damaged ? "CHANGED" : restored ? "RESTORED" : "INTACT"}
              </span>
            </div>
            <div className="message-bytes" aria-label="Working message bytes">
              {Array.from(working, (byte, i) => (
                <span
                  key={i}
                  className={byte !== original[i] ? "is-flipped" : ""}
                >
                  <strong>
                    {String.fromCharCode(byte) === " "
                      ? "␣"
                      : String.fromCharCode(byte)}
                  </strong>
                  <small>{byte.toString(16).padStart(2, "0")}</small>
                </span>
              ))}
            </div>
            <div className="challenge-actions">
              {lesson.kind === "backup" && (
                <button
                  className="button secondary"
                  disabled={damaged || !!backup}
                  onClick={() => setBackup(working.slice())}
                >
                  <Copy size={16} />
                  {backup ? "Backup saved" : "1. Save backup"}
                </button>
              )}
              <button
                className="button primary"
                disabled={damaged}
                onClick={() => {
                  setWorking(flipOneBit(original));
                  setRestored(false);
                }}
              >
                <Zap size={16} />
                {lesson.kind === "backup" ? "2. Damage copy" : "Flip one bit"}
              </button>
              {lesson.kind === "backup" && (
                <button
                  className="button secondary"
                  disabled={!backup || !damaged}
                  onClick={() => {
                    if (backup) {
                      setWorking(backup.slice());
                      setRestored(true);
                    }
                  }}
                >
                  <ShieldCheck size={16} />
                  3. Restore backup
                </button>
              )}
              <button
                className="icon-button"
                aria-label="Restart lesson"
                onClick={reset}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="hash-comparison">
              <div>
                <span className="eyebrow">ORIGINAL / SHA-256</span>
                <code aria-label="Original SHA-256">
                  {hashes?.original ?? "Calculating…"}
                </code>
              </div>
              <div>
                <span className="eyebrow">WORKING COPY / SHA-256</span>
                <code aria-label="Working SHA-256">
                  {hashes
                    ? Array.from(hashes.working, (digit, i) => (
                        <span
                          key={i}
                          className={
                            digit !== hashes.original[i] ? "hash-change" : ""
                          }
                        >
                          {digit}
                        </span>
                      ))
                    : "Calculating…"}
                </code>
              </div>
            </div>
            <div className="lesson-outcome" role="status">
              <Fingerprint size={22} />
              <div>
                <strong>
                  {error
                    ? "Hash calculation unavailable"
                    : !hashes
                      ? "Calculating fingerprints…"
                      : restored
                        ? "Recovered. Both fingerprints match."
                        : damaged
                          ? "One bit changed. The fingerprint changed with it."
                          : "Both fingerprints match."}
                </strong>
                <p>
                  {error ||
                    (restored
                      ? "You restored the saved bytes. The hash verifies the recovery; the backup made it possible."
                      : lesson.kind === "backup"
                        ? damaged && !backup
                          ? "There is no saved copy to restore. Restart, save a backup, and try again."
                          : backup
                            ? "Your intact copy is saved in this tab. Damage the working copy, then restore it."
                            : "Save a backup before damaging the message. The hash alone cannot recover it."
                        : damaged
                          ? "A hash detects a difference. It cannot tell you how to undo the damage."
                          : "Flip one bit and compare the highlighted hash characters.")}
                </p>
              </div>
            </div>
          </div>
          <div className="lesson-prose">
            {lesson.body.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="lesson-bottom">
            <span className="muted">
              {finished.includes(lesson.id)
                ? "✓ Experiment explored"
                : "Try the experiment above"}
            </span>
            {selected === 0 ? (
              <button
                className="text-link"
                onClick={() => {
                  setSearch({ lesson: "backup" });
                }}
              >
                Next: recover the original →
              </button>
            ) : (
              <Link to="/lab" className="text-link">
                Experiment with your own file →
              </Link>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
