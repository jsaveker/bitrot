import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm, ITerminalOptions, IDisposable } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css'; // Import xterm styles
import './Terminal.css'; // Add import for Terminal-specific CSS

// ANSI escape codes for colors (adjust as needed)
const COLORS = {
  RESET: '\x1b[0m',
  CYBER_GREEN: '\x1b[38;5;118m', // Approx #33ff33
  CYBER_ACCENT: '\x1b[38;5;45m',  // Approx cyan/accent color
  YELLOW: '\x1b[38;5;226m',
  RED: '\x1b[38;5;196m',
  GREY: '\x1b[38;5;244m',
};

// Helper function to fetch and display ASCII art
const displayAsciiArt = async (term: Xterm, filename: string) => {
  try {
    const response = await fetch(`/ascii/${filename}.txt`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const art = await response.text();
    term.writeln('\r\n' + art.replace(/\n/g, '\r\n')); // Ensure CRLF for terminal
  } catch (error) {
    console.error(`Error fetching ASCII art ${filename}:`, error);
    term.writeln(`${COLORS.RED}Error: Could not load ASCII art "${filename}".${COLORS.RESET}`);
  }
};

// Types
interface UploadTrigger { triggerUpload: () => void; }
// Add writePrompt to the context
interface CommandContext extends Partial<UploadTrigger> { 
    writePrompt?: () => void;
}

// Type for command handlers
type CommandHandler = (term: Xterm, args: string[], context?: CommandContext) => Promise<void> | void;

// Command definitions structure (adding index signature)
interface CommandMap {
    [key: string]: {
        description: string;
        usage: string;
        handler: CommandHandler;
    }
}

// Re-define FileMetadata here for frontend use
interface FileMetadata {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

// Type for backend error response
interface ErrorResponse {
    error: string;
}

// Argument parser return type
interface ParsedArgs {
    [key: string]: string | boolean | string[]; // Allow string array for _positional
    _positional: string[]; // Ensure _positional is always a string array
}

// Simple argument parser for commands like rot
function parseArgs(args: string[]): ParsedArgs { // Use ParsedArgs type
    const parsed: ParsedArgs = { _positional: [] };
    const positionalArgs: string[] = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
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
    description: 'Show this list of commands.',
    usage: 'help',
    handler: (term: Xterm) => {
      term.writeln('Available commands:');
      // Define modes here or fetch dynamically if they become complex
      const decayModes = 'bit-flip, ascii-shuffle, color-drain'; 
      Object.entries(COMMANDS).forEach(([name, { usage, description }]) => {
        let line = `  ${COLORS.CYBER_ACCENT}${usage.padEnd(25)}${COLORS.RESET} ${description}`;
        // Add mode info specifically for rot
        if (name === 'rot') {
            line += ` (Modes: ${decayModes})`;
        }
        term.writeln(line);
      });
    },
  },
  clear: {
    description: 'Clear the terminal screen.',
    usage: 'clear',
    handler: (term: Xterm) => {
      term.clear();
    },
  },
  upload: {
    description: 'Upload a file via dialog to the decay chamber.',
    usage: 'upload',
    handler: (term: Xterm, args: string[], context?: Partial<CommandContext>) => {
      term.writeln(`Initiating file upload... Please select a file.`);
      context?.triggerUpload?.();
    },
  },
  list: {
    description: 'List your decaying files.',
    usage: 'list',
    handler: async (term: Xterm, args: string[], context?: CommandContext) => {
      term.writeln(`Fetching file list from the lab archive...`);
      context?.writePrompt?.();

      try {
        const response = await fetch('/list'); 
        const result: unknown = await response.json();

        if (!response.ok) {
           const errorMsg = (typeof result === 'object' && result !== null && 'error' in result) 
                              ? (result as ErrorResponse).error 
                              : `HTTP error! status: ${response.status}`;
           throw new Error(errorMsg); 
        }

        const files = result as FileMetadata[];
        term.write('\r\n');
        if (files.length === 0) {
            term.writeln('No files found in the decay chamber.');
        } else {
            term.writeln(`Found ${files.length} file(s):`);
            term.writeln(`  ${COLORS.CYBER_ACCENT}ID${COLORS.RESET}                                       ${COLORS.CYBER_ACCENT}Filename${COLORS.RESET}             ${COLORS.CYBER_ACCENT}Size${COLORS.RESET}      ${COLORS.CYBER_ACCENT}Created${COLORS.RESET}`);
            term.writeln(`  ------------------------------------   --------------------   --------   ----------------------------`);
            files.forEach(file => {
                const createdDate = new Date(file.createdAt).toLocaleString();
                const fileSize = (file.size / 1024).toFixed(2) + ' KB';
                term.writeln(`  ${file.id.padEnd(36)}   ${file.filename.substring(0, 18).padEnd(20)}   ${fileSize.padStart(8)}   ${createdDate}`);
            });
        }
      } catch (error) {
         console.error("List fetch error:", error);
         term.write('\r\n');
         term.writeln(`${COLORS.RED}Error fetching file list:${COLORS.RESET}`);
         term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
         context?.writePrompt?.();
      }
    },
  },
  view: {
    description: 'Download a specific decay level of a file.',
    usage: 'view <id> [level]',
    handler: async (term: Xterm, args: string[], context?: CommandContext) => {
        if (args.length < 1) {
            term.writeln(`${COLORS.RED}Usage: ${COMMANDS.view.usage}${COLORS.RESET}`);
            context?.writePrompt?.();
            return;
        }
        
        const fileId = args[0];
        const levelStr = args[1]; // Optional level
        const url = levelStr ? `/view/${fileId}/${levelStr}` : `/view/${fileId}`; // Construct URL

        term.writeln(`Fetching file ${fileId}${levelStr ? ' at level ' + levelStr : ' (latest level)'}...`);
        context?.writePrompt?.();

        try {
            const response = await fetch(url);

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    // Try to parse error JSON from backend
                    const errResult: ErrorResponse = await response.json();
                    errorMsg = errResult?.error || errorMsg;
                } catch (jsonError) {
                    // Ignore if response is not JSON
                    console.warn('Failed to parse error response as JSON:', jsonError);
                }
                throw new Error(errorMsg);
            }

            // Get filename from Content-Disposition header if possible
            const disposition = response.headers.get('content-disposition');
            let downloadFilename = `bitrot_${fileId}${levelStr ? '_level' + levelStr : ''}.bin`; // Default filename
            if (disposition && disposition.includes('filename=')) {
                const matches = /filename="?(.+?)"?$/i.exec(disposition);
                if (matches && matches[1]) {
                    downloadFilename = matches[1];
                }
            }

            term.writeln(`${COLORS.CYBER_GREEN}File data received. Preparing download for "${downloadFilename}"...${COLORS.RESET}`);
            
            // Create Blob and trigger download
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = downloadFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl); // Clean up object URL

            term.writeln(`Download initiated for ${downloadFilename}.`);

        } catch (error) {
             console.error("View fetch/download error:", error);
             term.write('\r\n');
             term.writeln(`${COLORS.RED}Error retrieving file ${fileId}:${COLORS.RESET}`);
             term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            context?.writePrompt?.();
        }
    },
  },
  rot: {
    description: 'Generate and download an on-demand decay level.',
    usage: 'rot <id> --level N [--mode M]',
    handler: async (term: Xterm, args: string[], context?: CommandContext) => {
        const parsedArgs = parseArgs(args);
        const fileId = parsedArgs._positional[0];
        const levelArg = parsedArgs.level;
        const modeArg = parsedArgs.mode;

        if (!fileId || typeof levelArg !== 'string' || !/^[0-9]+$/.test(levelArg)) {
             term.writeln(`${COLORS.RED}Usage: ${COMMANDS.rot.usage}${COLORS.RESET}`);
             term.writeln(`Example: rot abc-123 --level 5 --mode color-drain`);
             context?.writePrompt?.();
             return;
        }
        
        const urlParams = new URLSearchParams({
            id: fileId,
            level: levelArg,
        });
        if (modeArg && typeof modeArg === 'string') {
            urlParams.set('mode', modeArg);
        }

        const url = `/rot?${urlParams.toString()}`;

        const decayModeDisplay = (modeArg && typeof modeArg === 'string') ? modeArg : 'default';
        term.writeln(`Generating level ${levelArg} decay for ${fileId} using mode '${decayModeDisplay}'...`);
        context?.writePrompt?.();

        try {
            const response = await fetch(url);

            if (!response.ok) {
                let errorMsg = `HTTP error! Status: ${response.status}`;
                try {
                    const errResult: ErrorResponse = await response.json();
                    errorMsg = errResult?.error || errorMsg;
                } catch (jsonError) { /* Ignore */ }
                throw new Error(errorMsg);
            }

            // Get filename from Content-Disposition
            const disposition = response.headers.get('content-disposition');
            let downloadFilename = `bitrot_${fileId}_rot_level${levelArg}.bin`;
            if (disposition && disposition.includes('filename=')) {
                const matches = /filename="?(.+?)"?$/i.exec(disposition);
                if (matches && matches[1]) {
                    downloadFilename = matches[1];
                }
            }

            term.writeln(`${COLORS.CYBER_GREEN}Decayed data received. Preparing download for "${downloadFilename}"...${COLORS.RESET}`);
            
            // Trigger download (same as view)
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = downloadFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);

            term.writeln(`Download initiated for ${downloadFilename}.`);

        } catch (error) {
             console.error("Rot fetch/download error:", error);
             term.write('\r\n');
             term.writeln(`${COLORS.RED}Error generating decay for ${fileId}:${COLORS.RESET}`);
             term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            context?.writePrompt?.();
        }
    },
  },
  freeze: {
    description: 'Halt decay for a file.',
    usage: 'freeze <id>',
    handler: async (term: Xterm, args: string[], context?: CommandContext) => {
        const fileId = args[0];

        if (!fileId) {
            term.writeln(`${COLORS.RED}Usage: ${COMMANDS.freeze.usage}${COLORS.RESET}`);
            context?.writePrompt?.();
            return;
        }

        const url = `/freeze?id=${encodeURIComponent(fileId)}`;

        term.writeln(`Requesting freeze for file ID: ${fileId}...`);
        context?.writePrompt?.();

        try {
            const response = await fetch(url, {
                method: 'POST',
            });
            
            const result: { message?: string; error?: string; fileId?: string } = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || `HTTP error! Status: ${response.status}`);
            }

            term.write('\r\n');
            term.writeln(`${COLORS.CYBER_GREEN}${result.message || 'Operation successful.'}${COLORS.RESET}`);
            term.writeln(`(File ${fileId} is now protected from further decay)`);

        } catch (error) {
            console.error("Freeze error:", error);
            term.write('\r\n');
            term.writeln(`${COLORS.RED}Error freezing file ${fileId}:${COLORS.RESET}`);
            term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            context?.writePrompt?.();
        }
    },
  },
  lessons: {
    description: 'Read data integrity mini-tutorials.',
    usage: 'lessons [list | <lesson-id>]',
    handler: async (term: Xterm, args: string[], context?: CommandContext) => {
        const subCommand = args[0] || 'list'; 

        if (subCommand === 'list') {
            term.writeln('Fetching available lessons...');
            context?.writePrompt?.();
            try {
                const response = await fetch('/lessons');
                const lessons: LessonInfo[] = await response.json();
                if (!response.ok) {
                    const errorMsg = (lessons as any)?.error || `HTTP Error: ${response.status}`;
                    throw new Error(errorMsg);
                }
                term.write('\r\nAvailable Lessons:\r\n');
                if (!lessons || lessons.length === 0) {
                    term.writeln('  (No lessons found)');
                } else {
                    lessons.forEach((lesson: LessonInfo) => { 
                        term.writeln(`  ${COLORS.CYBER_ACCENT}${lesson.id.padEnd(15)}${COLORS.RESET} ${lesson.title}`);
                    });
                }
                term.writeln(`\r\nType 'lessons <lesson-id>' to read one.`);
            } catch (error) {
                 console.error("List lessons error:", error);
                 term.write('\r\n');
                 term.writeln(`${COLORS.RED}Error fetching lesson list:${COLORS.RESET}`);
                 term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
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
                const listResponse = await fetch('/lessons');
                const availableLessons: LessonInfo[] = await listResponse.json();
                if (!listResponse.ok) {
                     throw new Error('Failed to fetch lesson list for validation.');
                }
                const lessonExists = availableLessons.some(l => l.id === lessonId);
                if (!lessonExists) {
                    throw new Error(`Lesson ID not found: ${lessonId}`);
                }

                // 2. Fetch the static text file directly
                const lessonPath = `/lessons/${encodeURIComponent(lessonId)}.txt`;
                console.log("Attempting to fetch static lesson content:", lessonPath)
                const contentResponse = await fetch(lessonPath);
                const content = await contentResponse.text(); // Get raw text
                
                if (!contentResponse.ok) {
                    // If fetch fails here, the file might be missing from /public
                    throw new Error(`Could not load lesson content (HTTP ${contentResponse.status})`);
                }

                term.write('\r\n---\r\n');
                content.split('\n').forEach(line => term.writeln(line));
                term.writeln('---');
            } catch (error) {
                console.error(`Fetch lesson ${lessonId} error:`, error);
                term.write('\r\n');
                term.writeln(`${COLORS.RED}Error fetching lesson ${lessonId}:${COLORS.RESET}`);
                term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                 context?.writePrompt?.();
            }
        }
    },
  },
  exit: {
    description: 'Exit the lab and return to the landing page.',
    usage: 'exit',
    handler: () => {
      window.location.href = '/';
    },
  },
  sudo: {
    description: 'Elevate privileges? Maybe make a sandwich?',
    usage: 'sudo make me a sandwich',
    handler: (term: Xterm, args: string[]) => {
      if (args.join(' ') === 'make me a sandwich') {
        term.writeln('Okay, Jim.');
      } else {
        term.writeln(`${COLORS.RED}Error:${COLORS.RESET} Incorrect usage. Did you mean 'make me a sandwich'?`);
      }
    },
  },
  xyzzy: {
    description: 'A hollow voice says "Plugh".',
    usage: 'xyzzy',
    handler: (term: Xterm) => {
      term.writeln('Nothing happens.');
    },
  },
  id10t: {
    description: 'Report a user error.',
    usage: 'id10t',
    handler: (term: Xterm) => {
      term.writeln(`${COLORS.RED}Error:${COLORS.RESET} User fault detected between keyboard and chair.`);
    },
  },
  cow: {
    description: 'Summon an ASCII cow.',
    usage: 'cow',
    handler: async (term: Xterm) => {
      await displayAsciiArt(term, 'cow');
    },
  },
  doge: {
    description: 'Such wow. Much terminal.',
    usage: 'doge',
    handler: async (term: Xterm) => {
      await displayAsciiArt(term, 'doge');
    },
  },
  parrot: {
    description: 'Party time!',
    usage: 'parrot',
    handler: async (term: Xterm) => {
      await displayAsciiArt(term, 'parrot');
    },
  },
  matrix: {
    description: 'Enter the matrix.',
    usage: 'matrix',
    handler: (term: Xterm, args: string[], context?: CommandContext) => {
      term.clear();
      let intervalId: NodeJS.Timeout | null = null;
      let keyListener: IDisposable | null = null;

      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ@#$%^&*/<>\\';
      const cols = term.cols;
      const rows = term.rows;
      let drops = Array(cols).fill(1);

      const drawMatrix = () => {
        term.write('\x1b[2J\x1b[H'); // Clear screen
        term.write('\x1b[32m'); // Green text

        let output = '';
        for (let i = 0; i < drops.length; i++) {
          const text = characters[Math.floor(Math.random() * characters.length)];
          // Create a string for the current column
          let colStr = Array(rows).fill(' ').join('\n'); 
          let dropRow = drops[i];

          // Insert the character at the drop position
          if (dropRow < rows) {
             colStr = colStr.substring(0, dropRow*2) + text + colStr.substring(dropRow*2 + 1);
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
        let screenBuffer = '';
         for (let y = 0; y < rows; y++) {
             for (let x = 0; x < cols; x++) {
                 if (Math.random() > 0.1) { // Density
                     screenBuffer += characters[Math.floor(Math.random() * characters.length)];
                 } else {
                     screenBuffer += ' ';
                 }
             }
             screenBuffer += '\r\n';
         }
         term.write(screenBuffer);
         term.writeln(`\x1b[${rows};1H\x1b[31mPress any key to exit Matrix mode...${COLORS.RESET}`);
      };

      const stopMatrix = () => {
        if (intervalId) clearInterval(intervalId);
        keyListener?.dispose();
        term.clear();
        term.write('\x1b[?25h'); // Show cursor
        context?.writePrompt?.();
      };
      
      term.write('\x1b[?25l'); // Hide cursor
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

  // Fix remaining type error in handleFileUpload
  const handleFileUpload = async (file: File) => {
    const term = xtermInstance.current;
    if (!term || !file) {
      console.error("Terminal instance or file not available for upload.");
      return;
    }

    term.writeln(`${COLORS.YELLOW}Uploading "${file.name}" (${(file.size / 1024).toFixed(2)} KB)...${COLORS.RESET}`);
    writePrompt();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/upload', { method: 'POST', body: formData });
      const result: unknown = await response.json();

      if (!response.ok) {
        // Check if result is an object with an error property before asserting
        const errorResult = result as ErrorResponse; // Cast to potential error type
        const errorMsg = (typeof errorResult === 'object' && errorResult !== null && 'error' in errorResult) 
                           ? errorResult.error 
                           : `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg); 
      }

      // Check if result is an object with expected properties before asserting
      if (typeof result === 'object' && result !== null && 'filename' in result && 'fileId' in result) {
          const successResult = result as { filename: string; fileId: string }; 
          term.write('\r\n');
          term.writeln(`${COLORS.CYBER_GREEN}Success!${COLORS.RESET} File "${successResult.filename}" uploaded.`);
          term.writeln(`Assigned ID: ${COLORS.CYBER_ACCENT}${successResult.fileId}${COLORS.RESET}`);
          term.writeln(`Type ${COLORS.YELLOW}'list'${COLORS.RESET} to see your files (TODO).`);
      } else {
          throw new Error('Received unexpected success response format from upload.');
      }
    } catch (error) {
      console.error("Upload fetch error:", error);
      term.write('\r\n');
      term.writeln(`${COLORS.RED}Upload failed for "${file.name}":${COLORS.RESET}`);
      term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        // Reset the input value to allow uploading the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        writePrompt();
    }
  };

  // Pass writePrompt in context
  const handleCommand = async (term: Xterm, commandLine: string) => {
    const parts = commandLine.trim().split(' ').filter(part => part !== '');
    const commandName = parts[0];
    const args = parts.slice(1);

    if (!commandName) {
      writePrompt();
      return;
    }

    const command = COMMANDS[commandName];

    if (command) {
      const context: CommandContext = { triggerUpload, writePrompt };
      await command.handler(term, args, context);
    } else {
      term.writeln(`${COLORS.RED}Command not found:${COLORS.RESET} ${commandName}`);
      term.writeln(`Type ${COLORS.CYBER_ACCENT}'help'${COLORS.RESET} for available commands.`);
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
        cursorStyle: 'block',
        fontFamily: '"Source Code Pro", monospace', // Match theme
        fontSize: 14,
        theme: {
          background: '#000000',
          foreground: '#33ff33', // Cyberpunk green
          cursor: '#33ff33',
          cursorAccent: '#000000',
          selectionBackground: '#33ff33',
          selectionForeground: '#000000',
          // Add more theme colors as needed
          black: '#2e3436',
          red: '#cc0000',
          green: '#4e9a06',
          yellow: '#c4a000',
          blue: '#3465a4',
          magenta: '#75507b',
          cyan: '#06989a',
          white: '#d3d7cf',
          brightBlack: '#555753',
          brightRed: '#ef2929',
          brightGreen: '#8ae234',
          brightYellow: '#fce94f',
          brightBlue: '#729fcf',
          brightMagenta: '#ad7fa8',
          brightCyan: '#34e2e2',
          brightWhite: '#eeeeec'
        }
      });

      xtermInstance.current = term;

      // Load addons
      term.loadAddon(fitAddon.current);

      // Open the terminal in the container
      term.open(terminalRef.current);

      // Fit the terminal to the container size
      fitAddon.current.fit();

      // Write a welcome message
      term.writeln(`${COLORS.CYBER_GREEN}Welcome to the Bit Rot Laboratory!${COLORS.RESET}`);
      term.writeln(`Initializing ${COLORS.YELLOW}data decay${COLORS.RESET} simulation environment...`);
      term.writeln(`Type ${COLORS.CYBER_ACCENT}'help'${COLORS.RESET} for available commands.`);
      writePrompt();

      // --- Input Handling Logic with Idle Reset ---
      let lineBuffer = '';
      const dataListener = term.onData(e => {
        resetIdleTimer(); // Reset timer on any data input

        const code = e.charCodeAt(0);
        if (code === 13) { // Enter
            if (term) term.write('\r\n'); // Add null check
            const trimmedLine = lineBuffer.trim();
            lineBuffer = ''; // Clear buffer immediately

            if (trimmedLine) {
              // Call the async command handler and catch potential errors
              if (term) {
                handleCommand(term, trimmedLine).catch(err => {
                    console.error("Error processing command:", err);
                    if (term) term.writeln(`\r\n${COLORS.RED}An error occurred processing command: ${trimmedLine}${COLORS.RESET}`);
                    writePrompt();
                }); 
              }
            } else {
              writePrompt(); // Show prompt again if only Enter was pressed
            }
        } else if (code === 127) { // Backspace
          if (lineBuffer.length > 0) {
            if (term) term.write('\b \b'); // Move cursor back, write space, move back again
            lineBuffer = lineBuffer.slice(0, -1);
          }
        } else if (code >= 32 && code <= 126) { // Printable
          lineBuffer += e;
          if (term) term.write(e); // Add null check
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
          currentFileInput.addEventListener('change', handleFileChange);
      }
      
      // --- Resize Handling ---
      const handleResize = () => {
        resetIdleTimer(); // Also reset on resize
        fitAddon.current.fit();
      };
      window.addEventListener('resize', handleResize);
      term.focus();
      resetIdleTimer(); // Start the timer initially

      // --- Cleanup ---
      return () => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        window.removeEventListener('resize', handleResize);
        dataListener.dispose();
        if (currentFileInput) {
            currentFileInput.removeEventListener('change', handleFileChange);
        }
        if (term) { // Use the local variable `term` for cleanup
           term.dispose();
        }
        xtermInstance.current = null; // Clear the ref
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="w-full h-full relative"> {/* Added relative positioning */} 
      <div ref={terminalRef} className="w-full h-full"></div>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
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