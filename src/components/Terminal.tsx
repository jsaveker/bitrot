import { useEffect, useRef } from "react";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useNavigate } from "react-router-dom";
import "xterm/css/xterm.css";
import { COMMAND_NAMES, executeCommand } from "../lib/commands";
import { loadLocalFile } from "../lib/local-files";
import { safeText } from "../lib/local-decay";
import { useEffects } from "./Shell";
export default function Terminal() {
  const ref = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null),
    instance = useRef<Xterm>();
  const effects = useEffects(),
    effectsRef = useRef(effects);
  effectsRef.current = effects;
  const stopAnimation = useRef<() => void>(() => {});
  const navigate = useNavigate();
  useEffect(() => {
    if (!effects) stopAnimation.current();
    if (instance.current) instance.current.options.cursorBlink = effects;
  }, [effects]);
  useEffect(() => {
    if (!ref.current) return;
    let disposed = false,
      line = "",
      busy = false,
      historyIndex = 0;
    const history: string[] = [];
    const term = new Xterm({
      screenReaderMode: true,
      cursorBlink: effectsRef.current,
      fontSize: 14,
      fontFamily: "monospace",
      convertEol: true,
      scrollback: 1200,
      theme: {
        background: "#0a0f08",
        foreground: "#c5dba9",
        cursor: "#d0f66b",
        selectionBackground: "#475d32",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    instance.current = term;
    const prompt = () => {
      if (!disposed) term.write("\r\n\x1b[38;5;191mbitrot\x1b[0m $ ");
    };
    const print = (text: string) => {
      if (!disposed) term.writeln(text.replace(/\r?\n/g, "\r\n"));
    };
    let animation: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (animation) {
        clearInterval(animation);
        animation = undefined;
        busy = false;
        print("Signal restored.");
        prompt();
      }
    };
    stopAnimation.current = stop;
    print("BITROT / LOCAL TERMINAL");
    print("Commands and visual controls share the same files and experiments.");
    print(
      "Type help. ↑/↓ history · Tab completes commands · Ctrl+C cancels input.",
    );
    prompt();
    const listener = term.onData(async (data) => {
      if (animation) {
        stop();
        return;
      }
      if (busy) return;
      if (data === "\x03") {
        line = "";
        term.write("^C");
        prompt();
        return;
      }
      if (data === "\x0c") {
        term.clear();
        line = "";
        prompt();
        return;
      }
      if (data === "\x1b[A" || data === "\x1b[B") {
        historyIndex = Math.max(
          0,
          Math.min(history.length, historyIndex + (data === "\x1b[A" ? -1 : 1)),
        );
        line = history[historyIndex] ?? "";
        term.write(`\r\x1b[2Kbitrot $ ${line}`);
        return;
      }
      if (data === "\t") {
        const matches = COMMAND_NAMES.filter((name) => name.startsWith(line));
        if (matches.length === 1) {
          const suffix = matches[0].slice(line.length) + " ";
          line += suffix;
          term.write(suffix);
        }
        return;
      }
      if (data === "\x7f") {
        if (line.length) {
          line = line.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      if (data === "\r") {
        const command = line;
        line = "";
        print("");
        if (command.trim()) {
          history.push(command);
          if (history.length > 100) history.shift();
          historyIndex = history.length;
        }
        busy = true;
        try {
          await executeCommand(command, {
            print,
            clear: () => term.clear(),
            navigate,
            chooseFile: () => input.current?.click(),
            art: async (name) => {
              const response = await fetch(`/ascii/${name}.txt`);
              if (!response.ok) throw new Error("ASCII art unavailable.");
              print(await response.text());
            },
            matrix: () => {
              if (!effectsRef.current) {
                print(
                  "Visual effects are off. Enable them to enter the Matrix.",
                );
                return;
              }
              print("Press any key to return.");
              animation = setInterval(() => {
                if (!disposed && effectsRef.current)
                  print(
                    Array.from({ length: Math.min(term.cols - 1, 100) }, () =>
                      Math.random() > 0.5 ? "1" : "0",
                    ).join(""),
                  );
              }, 180);
            },
          });
        } catch (error) {
          print(
            `Error: ${safeText(error instanceof Error ? error.message : "Command failed.")}`,
          );
        } finally {
          if (!animation) {
            busy = false;
            prompt();
          }
        }
        return;
      }
      if (data.startsWith("\x1b")) return;
      const text = safeText(data)
        .replace(/[^\x20-\x7e]/g, "")
        .slice(0, 1024 - line.length);
      line += text;
      term.write(text);
    });
    // Let Tab leave the terminal unless there is a command prefix to complete.
    term.attachCustomKeyEventHandler(
      (event) => !(event.key === "Tab" && (!line || event.shiftKey)),
    );
    const resize = new ResizeObserver(() => {
      if (!disposed) fit.fit();
    });
    resize.observe(ref.current);
    fit.fit();
    return () => {
      disposed = true;
      if (animation) clearInterval(animation);
      resize.disconnect();
      listener.dispose();
      term.dispose();
      instance.current = undefined;
    };
  }, [navigate]);
  return (
    <div className="terminal-body">
      <div ref={ref} style={{ height: "100%" }} />
      <input
        ref={input}
        type="file"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const loaded = await loadLocalFile(file);
            instance.current?.writeln(
              `\r\nLoaded locally: ${safeText(loaded.filename)}\r\nID: ${loaded.id}\r\nbitrot $ `,
            );
          } catch (error) {
            instance.current?.writeln(
              `\r\nError: ${safeText(error instanceof Error ? error.message : "Load failed.")}\r\nbitrot $ `,
            );
          } finally {
            if (input.current) input.current.value = "";
          }
        }}
      />
    </div>
  );
}
