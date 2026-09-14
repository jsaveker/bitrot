import React, { useEffect, useRef, useState } from "react";
import { Terminal as Xterm, ITerminalOptions, IDisposable } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css"; // Import xterm styles
import { localFiles, transformFile, downloadFile } from "../lib/local-files";
import { safeText, validateSize } from "../lib/local-decay";
import "./Terminal.css"; // Add import for Terminal-specific CSS

// ANSI escape codes for colors (adjust as needed)
const COLORS = {
  RESET: "\x1b[0m",
  CYBER_GREEN: "\x1b[38;5;118m", // Approx #33ff33
  CYBER_ACCENT: "\x1b[38;5;45m", // Approx cyan/accent color
  YELLOW: "\x1b[38;5;226m",
  RED: "\x1b[38;5;196m",
  GREY: "\x1b[38;5;244m",
};

// Helper function to fetch and display ASCII art
const displayAsciiArt = async (term: Xterm, filename: string) => {
  try {
    const response = await fetch(`/ascii/${filename}.txt`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const art = await response.text();
    term.writeln("\r\n" + art.replace(/\n/g, "\r\n")); // Ensure CRLF for terminal
  } catch (error) {
    console.error(`Error fetching ASCII art ${filename}:`, error);
    term.writeln(
      `${COLORS.RED}Error: Could not load ASCII art "${filename}".${COLORS.RESET}`,
    );
  }
};

// Types
interface UploadTrigger {
  triggerUpload: () => void;
}
// Add writePrompt to the context
interface CommandContext extends Partial<UploadTrigger> {
  writePrompt?: () => void;
}

// Type for command handlers
type CommandHandler = (
  term: Xterm,
  args: string[],
  context?: CommandContext,
) => Promise<void> | void;

// Command definitions structure (adding index signature)
interface CommandMap {
  [key: string]: {
    description: string;
    usage: string;
    handler: CommandHandler;
  };
}

// Argument parser return type
interface ParsedArgs {
  [key: string]: string | boolean | string[]; // Allow string array for _positional
  _positional: string[]; // Ensure _positional is always a string array
}

// Simple argument parser for commands like rot
function parseArgs(args: string[]): ParsedArgs {
  // Use ParsedArgs type
  const parsed: ParsedArgs = { _positional: [] };
  const positionalArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        parsed[key] = true;
      }
    } else {
      // Directly push to the typed _positional array
      parsed._positional.push(args[i]);
    }
  }
  // parsed._positional = positionalArgs; // No longer needed
  return parsed;
}

// Type for lesson list items
interface LessonInfo {
  id: string;
  title: string;
}

const COMMANDS: CommandMap = {
  help: {
    description: "Show this list of commands.",
    usage: "help",
    handler: (term: Xterm) => {
      term.writeln("Available commands:");
      // Define modes here or fetch dynamically if they become complex
      const decayModes = "bit-flip, ascii-shuffle, color-drain";
      Object.entries(COMMANDS).forEach(([name, { usage, description }]) => {
        let line = `  ${COLORS.CYBER_ACCENT}${usage.padEnd(25)}${COLORS.RESET} ${description}`;
        // Add mode info specifically for rot
        if (name === "rot") {
          line += ` (Modes: ${decayModes})`;
        }
        term.writeln(line);
      });
    },
  },
  clear: {
    description: "Clear the terminal screen.",
    usage: "clear",
    handler: (term: Xterm) => {
      term.clear();
    },
  },
  load: {
    description: "Choose a local file. Nothing is uploaded.",
    usage: "load",
    handler: (term, args, context) => {
      term.writeln(
        "Choose a file for this tab (5 MiB maximum). It stays on your device.",
      );
      context?.triggerUpload?.();
    },
  },
  upload: {
    description: "Alias for load; files stay in this browser tab.",
    usage: "upload",
    handler: (term, args, context) =>
      COMMANDS.load.handler(term, args, context),
  },
  list: {
    description: "List files held in this browser tab.",
    usage: "list",
    handler: (term) => {
      const files = localFiles.list();
      term.writeln(
        `Local files: ${files.length} (cleared when this page reloads or closes).`,
      );
      for (const file of files) {
        term.writeln(`  ${COLORS.CYBER_ACCENT}${file.id}${COLORS.RESET}`);
        term.writeln(
          `    ${safeText(file.filename)} | ${(file.size / 1024).toFixed(1)} KiB | level ${file.currentLevel}`,
        );
      }
    },
  },
  view: {
    description: "Download the original or latest local result.",
    usage: "view <id> [level]",
    handler: (term, args) => {
      if (!args[0]) throw new Error("Usage: view <id> [level]");
      const name = downloadFile(args[0], args[1]);
      term.writeln(`Download prepared: ${safeText(name)}`);
    },
  },
  rot: {
    description:
      "Transform a local file and download the result (levels 0–10).",
    usage: "rot <id> --level N [--mode M]",
    handler: async (term, args) => {
      const parsed = parseArgs(args);
      const id = parsed._positional[0];
      if (!id) throw new Error("Usage: rot <id> --level N [--mode M]");
      term.writeln("Processing locally in your browser...");
      await transformFile(id, parsed.level, parsed.mode);
      term.writeln(`Download prepared: ${safeText(downloadFile(id))}`);
    },
  },
  freeze: {
    description: "Explain the local lab’s on-demand decay model.",
    usage: "freeze <id>",
    handler: (term, args) => {
      if (!args[0]) throw new Error("Usage: freeze <id>");
      localFiles.get(args[0]);
      term.writeln(
        "Local files never decay automatically. Your original stays unchanged.",
      );
    },
  },
  forget: {
    description: "Remove a file and its latest result from this tab.",
    usage: "forget <id>",
    handler: (term, args) => {
      if (!args[0]) throw new Error("Usage: forget <id>");
      localFiles.forget(args[0]);
      term.writeln(
        "Removed from this tab. The file on your device is unchanged.",
      );
    },
  },
  lessons: {
    description: "Read data integrity mini-tutorials.",
    usage: "lessons [list | <lesson-id>]",
    handler: async (term: Xterm, args: string[], context?: CommandContext) => {
      const subCommand = args[0] || "list";

      if (subCommand === "list") {
        term.writeln("Fetching available lessons...");
        context?.writePrompt?.();
        try {
          const response = await fetch("/lessons");
          const lessons: LessonInfo[] = await response.json();
          if (!response.ok) {
            const errorMsg =
              (lessons as any)?.error || `HTTP Error: ${response.status}`;
            throw new Error(errorMsg);
          }
          term.write("\r\nAvailable Lessons:\r\n");
          if (!lessons || lessons.length === 0) {
            term.writeln("  (No lessons found)");
          } else {
            lessons.forEach((lesson: LessonInfo) => {
              term.writeln(
                `  ${COLORS.CYBER_ACCENT}${lesson.id.padEnd(15)}${COLORS.RESET} ${lesson.title}`,
              );
            });
          }
          term.writeln(`\r\nType 'lessons <lesson-id>' to read one.`);
        } catch (error) {
          console.error("List lessons error:", error);
          term.write("\r\n");
          term.writeln(
            `${COLORS.RED}Error fetching lesson list:${COLORS.RESET}`,
          );
          term.writeln(
            `  Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        } finally {
          context?.writePrompt?.();
        }
      } else {
        // Fetch and display specific lesson content
        const lessonId = subCommand;
        term.writeln(`Fetching lesson "${lessonId}"...`);
        context?.writePrompt?.();
        try {
          // 1. Validate the ID first by fetching the list
          const listResponse = await fetch("/lessons");
          const availableLessons: LessonInfo[] = await listResponse.json();
          if (!listResponse.ok) {
            throw new Error("Failed to fetch lesson list for validation.");
          }
          const lessonExists = availableLessons.some((l) => l.id === lessonId);
          if (!lessonExists) {
            throw new Error(`Lesson ID not found: ${lessonId}`);
          }

          // 2. Fetch the static text file directly
          const lessonPath = `/lessons/${encodeURIComponent(lessonId)}.txt`;
          console.log("Attempting to fetch static lesson content:", lessonPath);
          const contentResponse = await fetch(lessonPath);
          const content = await contentResponse.text(); // Get raw text

          if (!contentResponse.ok) {
            // If fetch fails here, the file might be missing from /public
            throw new Error(
              `Could not load lesson content (HTTP ${contentResponse.status})`,
            );
          }

          term.write("\r\n---\r\n");
          content.split("\n").forEach((line) => term.writeln(line));
          term.writeln("---");
        } catch (error) {
          console.error(`Fetch lesson ${lessonId} error:`, error);
          term.write("\r\n");
          term.writeln(
            `${COLORS.RED}Error fetching lesson ${lessonId}:${COLORS.RESET}`,
          );
          term.writeln(
            `  Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        } finally {
          context?.writePrompt?.();
        }
      }
    },
  },
  exit: {
    description: "Exit the lab and return to the landing page.",
    usage: "exit",
    handler: () => {
      window.location.href = "/";
    },
  },
  sudo: {
    description: "Elevate privileges? Maybe make a sandwich?",
    usage: "sudo make me a sandwich",
    handler: (term: Xterm, args: string[]) => {
      if (args.join(" ") === "make me a sandwich") {
        term.writeln("Okay, Jim.");
      } else {
        term.writeln(
          `${COLORS.RED}Error:${COLORS.RESET} Incorrect usage. Did you mean 'make me a sandwich'?`,
        );
      }
    },
  },
  xyzzy: {
    description: 'A hollow voice says "Plugh".',
    usage: "xyzzy",
    handler: (term: Xterm) => {
      term.writeln("Nothing happens.");
    },
  },
  id10t: {
    description: "Report a user error.",
    usage: "id10t",
    handler: (term: Xterm) => {
      term.writeln(
        `${COLORS.RED}Error:${COLORS.RESET} User fault detected between keyboard and chair.`,
      );
    },
  },
  cow: {
    description: "Summon an ASCII cow.",
    usage: "cow",
    handler: async (term: Xterm) => {
      await displayAsciiArt(term, "cow");
    },
  },
  doge: {
    description: "Such wow. Much terminal.",
    usage: "doge",
    handler: async (term: Xterm) => {
      await displayAsciiArt(term, "doge");
    },
  },
  parrot: {
    description: "Party time!",
    usage: "parrot",
    handler: async (term: Xterm) => {
      await displayAsciiArt(term, "parrot");
    },
  },
  matrix: {
    description: "Enter the matrix.",
    usage: "matrix",
    handler: (term: Xterm, args: string[], context?: CommandContext) => {
      term.clear();
      let intervalId: NodeJS.Timeout | null = null;
      let keyListener: IDisposable | null = null;

      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ@#$%^&*/<>\\";
      const cols = term.cols;
      const rows = term.rows;
      let drops = Array(cols).fill(1);

      const drawMatrix = () => {
        term.write("\x1b[2J\x1b[H"); // Clear screen
        term.write("\x1b[32m"); // Green text

        let output = "";
        for (let i = 0; i < drops.length; i++) {
          const text =
            characters[Math.floor(Math.random() * characters.length)];
          // Create a string for the current column
          let colStr = Array(rows).fill(" ").join("\n");
          let dropRow = drops[i];

          // Insert the character at the drop position
          if (dropRow < rows) {
            colStr =
              colStr.substring(0, dropRow * 2) +
              text +
              colStr.substring(dropRow * 2 + 1);
          }

          // Move drop down
          drops[i]++;
          // Reset drop randomly
          if (drops[i] * Math.random() > rows * 0.95) {
            drops[i] = 0;
          }

          // This part is tricky with xterm.js write - might need direct manipulation or canvas
          // Simplified approach: write line by line (less efficient)
          // A better approach might use absolute cursor positioning '[row;colH'
          // but that gets complex fast. Let's try a simpler visual.
        }

        // Simplified visual: Just print random chars across the screen
        let screenBuffer = "";
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (Math.random() > 0.1) {
              // Density
              screenBuffer +=
                characters[Math.floor(Math.random() * characters.length)];
            } else {
              screenBuffer += " ";
            }
          }
          screenBuffer += "\r\n";
        }
        term.write(screenBuffer);
        term.writeln(
          `\x1b[${rows};1H\x1b[31mPress any key to exit Matrix mode...${COLORS.RESET}`,
        );
      };

      const stopMatrix = () => {
        if (intervalId) clearInterval(intervalId);
        keyListener?.dispose();
        term.clear();
        term.write("\x1b[?25h"); // Show cursor
        context?.writePrompt?.();
      };

      term.write("\x1b[?25l"); // Hide cursor
      intervalId = setInterval(drawMatrix, 100);

      // Stop on any key press
      keyListener = term.onKey(stopMatrix);

      // Also stop if component unmounts
      // Note: This might need better cleanup integration with the main effect hook
    },
  },
};

function Terminal() {
  const terminalRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const xtermInstance = useRef<Xterm | null>(null); // Added type for xterm instance
  const fitAddon = useRef(new FitAddon());
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null); // Added type for timer

  // Renamed function for writing the terminal prompt
  const writePrompt = () => {
    if (xtermInstance.current) {
      xtermInstance.current.write(`\r\n${COLORS.CYBER_GREEN}$${COLORS.RESET} `);
    }
  };

  // Function to trigger the file input click
  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    const term = xtermInstance.current;
    if (!term) return;
    try {
      validateSize(file.size);
      const loaded = localFiles.add(
        file.name,
        new Uint8Array(await file.arrayBuffer()),
      );
      term.writeln(
        `${COLORS.CYBER_GREEN}Loaded locally:${COLORS.RESET} ${safeText(loaded.filename)}`,
      );
      term.writeln(
        `Assigned ID: ${COLORS.CYBER_ACCENT}${loaded.id}${COLORS.RESET}`,
      );
      term.writeln(
        "Nothing was uploaded. Files disappear from this tab when the page reloads or closes.",
      );
    } catch (error) {
      term.writeln(
        `${COLORS.RED}${safeText(error instanceof Error ? error.message : "Unable to load file.")}${COLORS.RESET}`,
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      writePrompt();
    }
  };

  const handleCommand = async (term: Xterm, commandLine: string) => {
    const [commandName, ...args] = commandLine.trim().split(/\s+/);
    if (!commandName) return writePrompt();
    const command = Object.hasOwn(COMMANDS, commandName)
      ? COMMANDS[commandName]
      : undefined;
    try {
      if (!command)
        throw new Error(
          `Command not found: ${commandName}. Type help for commands.`,
        );
      // Prompt once after completion; the Matrix animation owns its exit prompt.
      await command.handler(term, args, {
        triggerUpload,
        ...(commandName === "matrix" ? { writePrompt } : {}),
      });
    } catch (error) {
      term.writeln(
        `${COLORS.RED}${safeText(error instanceof Error ? error.message : "Command failed.")}${COLORS.RESET}`,
      );
    } finally {
      if (!["load", "upload", "matrix", "exit"].includes(commandName))
        writePrompt();
    }
  };

  // Add null check for clearTimeout
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(() => {
      setIsIdle(true);
      if (xtermInstance.current) {
        // Optionally, you could write a message to the terminal
        // xtermInstance.current.writeln('\r\n*** SCREEN BURN-IN PROTECTION ACTIVATED ***');
      }
    }, 30000); // 30 seconds
  };

  useEffect(() => {
    let term: Xterm | null = null; // Variable to hold the instance for cleanup

    if (terminalRef.current && !xtermInstance.current) {
      term = new Xterm({
        cursorBlink: true,
        screenReaderMode: true,
        cursorStyle: "block",
        fontFamily: '"Source Code Pro", monospace', // Match theme
        fontSize: 14,
        theme: {
          background: "#000000",
          foreground: "#33ff33", // Cyberpunk green
          cursor: "#33ff33",
          cursorAccent: "#000000",
          selectionBackground: "#33ff33",
          selectionForeground: "#000000",
          // Add more theme colors as needed
          black: "#2e3436",
          red: "#cc0000",
          green: "#4e9a06",
          yellow: "#c4a000",
          blue: "#3465a4",
          magenta: "#75507b",
          cyan: "#06989a",
          white: "#d3d7cf",
          brightBlack: "#555753",
          brightRed: "#ef2929",
          brightGreen: "#8ae234",
          brightYellow: "#fce94f",
          brightBlue: "#729fcf",
          brightMagenta: "#ad7fa8",
          brightCyan: "#34e2e2",
          brightWhite: "#eeeeec",
        },
      });

      xtermInstance.current = term;

      // Load addons
      term.loadAddon(fitAddon.current);

      // Open the terminal in the container
      term.open(terminalRef.current);

      // Fit the terminal to the container size
      fitAddon.current.fit();

      // Write a welcome message
      term.writeln(
        `${COLORS.CYBER_GREEN}Welcome to the Bit Rot Laboratory!${COLORS.RESET}`,
      );
      term.writeln(
        `Local-only lab: files stay on your device. No cloud uploads.`,
      );
      term.writeln(
        `Use load to choose a file. Reloading or closing this page clears the tab’s files.`,
      );
      term.writeln(
        `Type ${COLORS.CYBER_ACCENT}'help'${COLORS.RESET} for available commands.`,
      );
      writePrompt();

      // --- Input Handling Logic with Idle Reset ---
      let lineBuffer = "";
      const dataListener = term.onData((e) => {
        resetIdleTimer(); // Reset timer on any data input

        const code = e.charCodeAt(0);
        if (code === 13) {
          // Enter
          if (term) term.write("\r\n"); // Add null check
          const trimmedLine = lineBuffer.trim();
          lineBuffer = ""; // Clear buffer immediately

          if (trimmedLine) {
            // Call the async command handler and catch potential errors
            if (term) {
              handleCommand(term, trimmedLine).catch((err) => {
                console.error("Error processing command:", err);
                if (term)
                  term.writeln(
                    `\r\n${COLORS.RED}An error occurred processing command: ${trimmedLine}${COLORS.RESET}`,
                  );
                writePrompt();
              });
            }
          } else {
            writePrompt(); // Show prompt again if only Enter was pressed
          }
        } else if (code === 127) {
          // Backspace
          if (lineBuffer.length > 0) {
            if (term) term.write("\b \b"); // Move cursor back, write space, move back again
            lineBuffer = lineBuffer.slice(0, -1);
          }
        } else if (code >= 32 && code <= 126) {
          // Printable
          const input = safeText(e).slice(
            0,
            Math.max(0, 1024 - lineBuffer.length),
          );
          lineBuffer += input;
          if (term) term.write(input); // Add null check
        }
        // Ignore other control characters for now
      });

      // --- File Input Change Listener ---
      const handleFileChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          handleFileUpload(file); // Call the async upload handler
        } else {
          // Optional: Handle case where user cancels file dialog
          xtermInstance.current?.writeln("File selection cancelled.");
          writePrompt();
        }
      };

      const currentFileInput = fileInputRef.current;
      if (currentFileInput) {
        currentFileInput.addEventListener("change", handleFileChange);
        currentFileInput.addEventListener("cancel", writePrompt);
      }

      // --- Resize Handling ---
      const handleResize = () => {
        resetIdleTimer(); // Also reset on resize
        fitAddon.current.fit();
      };
      window.addEventListener("resize", handleResize);
      term.focus();
      resetIdleTimer(); // Start the timer initially

      // --- Cleanup ---
      return () => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        window.removeEventListener("resize", handleResize);
        dataListener.dispose();
        if (currentFileInput) {
          currentFileInput.removeEventListener("change", handleFileChange);
          currentFileInput.removeEventListener("cancel", writePrompt);
        }
        if (term) {
          // Use the local variable `term` for cleanup
          term.dispose();
        }
        xtermInstance.current = null; // Clear the ref
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="w-full h-full relative">
      {" "}
      {/* Added relative positioning */}
      <div ref={terminalRef} className="w-full h-full"></div>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* Screen Burn Overlay */}
      {isIdle && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center pointer-events-none screen-burn-overlay">
          <div className="text-center text-cyberpunk-primary opacity-50 screen-burn-text">
            <p className="text-6xl font-bold">BITROT.SH</p>
            <p className="text-xl">Data Decay Laboratory</p>
            <p className="mt-4 text-sm">(Screen Burn-in Protection)</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Terminal;
