import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm } from 'xterm';
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
const displayAsciiArt = async (term, filename) => {
  try {
    const response = await fetch(`/ascii/${filename}.txt`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const art = await response.text();
    term.writeln('\r\n' + art.replace(/\n/g, '\r\n')); // Ensure CRLF for terminal
  } catch (error) {
    console.error(`Error fetching ASCII art ${filename}:`, error);
    term.writeln(`${COLORS.RED}Error: Could not load ASCII art \"${filename}\".${COLORS.RESET}`);
  }
};

// Command definitions
const COMMANDS = {
  help: {
    description: 'Show this list of commands.',
    usage: 'help',
    handler: (term) => {
      term.writeln('Available commands:');
      Object.entries(COMMANDS).forEach(([name, { usage, description }]) => {
        term.writeln(`  ${COLORS.CYBER_ACCENT}${usage.padEnd(15)}${COLORS.RESET} ${description}`);
      });
    },
  },
  clear: {
    description: 'Clear the terminal screen.',
    usage: 'clear',
    handler: (term) => {
      term.clear();
    },
  },
  // --- Add more commands here later ---
  upload: {
    description: 'Upload a file via dialog to the decay chamber.',
    usage: 'upload', // Simplified usage, ignore args for now
    handler: (term, args, { triggerUpload }) => { // Added triggerUpload callback
      term.writeln(`Initiating file upload... Please select a file.`);
      triggerUpload(); // Call the function passed from the component
    },
  },
  list: {
    description: 'List your decaying files (TODO).',
    usage: 'list',
    handler: (term) => {
      term.writeln(`${COLORS.YELLOW}TODO: Implement file listing.${COLORS.RESET}`);
    },
  },
  view: {
    description: 'View a specific decay level of a file (TODO).',
    usage: 'view <id> [level]',
    handler: (term, args) => {
      term.writeln(`${COLORS.YELLOW}TODO: Implement file view for: ${args.join(' ')}${COLORS.RESET}`);
    },
  },
  rot: {
    description: 'Trigger on-demand decay (TODO).',
    usage: 'rot <id> --level N [--mode M]',
    handler: (term, args) => {
      term.writeln(`${COLORS.YELLOW}TODO: Implement on-demand rot for: ${args.join(' ')}${COLORS.RESET}`);
    },
  },
  freeze: {
    description: 'Halt decay for a file (TODO).',
    usage: 'freeze <id>',
    handler: (term, args) => {
      term.writeln(`${COLORS.YELLOW}TODO: Implement freeze for: ${args.join(' ')}${COLORS.RESET}`);
    },
  },
  lessons: {
    description: 'Read data integrity mini-tutorials (TODO).',
    usage: 'lessons',
    handler: (term) => {
      term.writeln(`${COLORS.YELLOW}TODO: Implement lessons.${COLORS.RESET}`);
    },
  },
  exit: {
    description: 'Exit the lab and return to the landing page.',
    usage: 'exit',
    handler: () => {
      window.location.href = '/'; // Simple redirect
    },
  },
  // --- Easter Eggs ---
  sudo: {
    description: 'Elevate privileges? Maybe make a sandwich?',
    usage: 'sudo make me a sandwich',
    handler: (term, args) => {
      if (args.join(' ') === 'make me a sandwich') {
        term.writeln('Okay, Jim.'); // Classic.
      } else {
        term.writeln(`${COLORS.RED}Error:${COLORS.RESET} Incorrect usage. Did you mean 'make me a sandwich'?`);
      }
    },
  },
  xyzzy: {
    description: 'A hollow voice says "Plugh".',
    usage: 'xyzzy',
    handler: (term) => {
      term.writeln('Nothing happens.');
    },
  },
  id10t: {
    description: 'Report a user error.',
    usage: 'id10t',
    handler: (term) => {
      term.writeln(`${COLORS.RED}Error:${COLORS.RESET} User fault detected between keyboard and chair.`);
    },
  },
  cow: {
    description: 'Summon an ASCII cow.',
    usage: 'cow',
    handler: async (term) => {
      await displayAsciiArt(term, 'cow');
    },
  },
  doge: {
    description: 'Such wow. Much terminal.',
    usage: 'doge',
    handler: async (term) => {
      await displayAsciiArt(term, 'doge');
    },
  },
  parrot: {
    description: 'Party time!',
    usage: 'parrot',
    handler: async (term) => {
      await displayAsciiArt(term, 'parrot');
    },
  },
  matrix: {
    description: 'Enter the matrix.',
    usage: 'matrix',
    handler: (term) => {
      term.clear();
      let intervalId = null;
      let keyListener = null;

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
        if (keyListener) keyListener.dispose();
        term.clear();
        term.write('\x1b[?25h'); // Show cursor
        prompt(); // Show prompt again
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

  const prompt = () => {
    if (xtermInstance.current) {
        xtermInstance.current.write(`\r\n${COLORS.CYBER_GREEN}$${COLORS.RESET} `);
    }
  };

  // Function to trigger the file input click
  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Async function to handle the actual file upload
  const handleFileUpload = async (file: File) => {
    const term = xtermInstance.current;
    if (!term || !file) {
      console.error("Terminal instance or file not available for upload.");
      return;
    }

    term.writeln(`${COLORS.YELLOW}Uploading \"${file.name}\" (${(file.size / 1024).toFixed(2)} KB)...${COLORS.RESET}`);
    prompt(); // Show prompt immediately after starting upload

    const formData = new FormData();
    formData.append('file', file); // Key must match backend ('file')

    try {
      const response = await fetch('/upload', { // Relative path to the function
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Throw error to be caught below, using message from backend if available
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Success
      term.write('\r\n'); // Newline before success message
      term.writeln(`${COLORS.CYBER_GREEN}Success!${COLORS.RESET} File \"${result.filename}\" uploaded.`);
      term.writeln(`Assigned ID: ${COLORS.CYBER_ACCENT}${result.fileId}${COLORS.RESET}`);
      term.writeln(`Type ${COLORS.YELLOW}'list'${COLORS.RESET} to see your files (TODO).`);

    } catch (error) {
      console.error("Upload fetch error:", error);
      term.write('\r\n'); // Newline before error message
      term.writeln(`${COLORS.RED}Upload failed for \"${file.name}\":${COLORS.RESET}`);
      term.writeln(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        // Reset the input value to allow uploading the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Write a new prompt line after completion/error
        prompt();
    }
  };

  // Command handler (passing triggerUpload)
  const handleCommand = async (term: Xterm, commandLine: string) => {
    const parts = commandLine.trim().split(' ').filter(part => part !== '');
    const commandName = parts[0];
    const args = parts.slice(1);

    if (!commandName) {
      prompt();
      return;
    }

    const command = COMMANDS[commandName];

    if (command) {
      // Pass triggerUpload callback specifically to the upload command handler
      const handlerArgs = commandName === 'upload' ? [term, args, { triggerUpload }] : [term, args];
      await command.handler(...handlerArgs);
    } else {
      term.writeln(`${COLORS.RED}Command not found:${COLORS.RESET} ${commandName}`);
      term.writeln(`Type ${COLORS.CYBER_ACCENT}'help'${COLORS.RESET} for available commands.`);
    }

    if (commandName !== 'matrix' && commandName !== 'exit' && commandName !== 'upload') {
        prompt(); // Upload handles its own prompt calls during/after fetch
    }
  };

  // Function to reset the idle timer
  const resetIdleTimer = () => {
    setIsIdle(false);
    clearTimeout(idleTimer.current);
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
      prompt(); // Initial prompt

      // --- Input Handling Logic with Idle Reset ---
      let lineBuffer = '';
      const dataListener = term.onData(e => {
        resetIdleTimer(); // Reset timer on any data input

        const code = e.charCodeAt(0);
        if (code === 13) { // Enter
            term.write('\r\n'); // Move cursor to new line
            const trimmedLine = lineBuffer.trim();
            lineBuffer = ''; // Clear buffer immediately

            if (trimmedLine) {
              // Call the async command handler and catch potential errors
              handleCommand(term!, trimmedLine).catch(err => {
                  console.error("Error processing command:", err);
                  term!.writeln(`\r\n${COLORS.RED}An error occurred processing command: ${trimmedLine}${COLORS.RESET}`);
                  prompt(); // Ensure prompt is shown after error
              }); 
            } else {
              prompt(); // Show prompt again if only Enter was pressed
            }
        } else if (code === 127) { // Backspace
          if (lineBuffer.length > 0) {
            term.write('\b \b'); // Move cursor back, write space, move back again
            lineBuffer = lineBuffer.slice(0, -1);
          }
        } else if (code >= 32 && code <= 126) { // Printable
          lineBuffer += e;
          term.write(e); // Echo character
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
              prompt();
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
        clearTimeout(idleTimer.current as NodeJS.Timeout); 
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