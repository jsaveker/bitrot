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

// --- ASCII Art Definitions (Array of Lines with escaped backslashes) ---
const ASCII_ART = {
  cow: [\n    '        \\\\\\\\   ^__^',\n    '         \\\\\\\\  (oo)\\\\\\\\_______',\n    '            (__)\\\\\\\\       )\\\\\\\\/\\\\\\\\ ',\n    '                ||----w |',\n    '                ||     ||'\n  ],\n  doge: [\n    '             .--~~, __.',\n    ':-.__.\\\\'; \\\\\\\\:, \\\\'\\\\\\\\´\\\\'_.\\\\_.)         wow',\n    ' \\\\`--,; \\\\ B-\\\\`.\\\\\',-~-;\\\\`',\n    '   \\\\' U \\\\'        \\\\\\\\`\\\\\\\\`~\\\\'',\n    '        \\\\\\\\_;        ;',\n    '         |         ;',\n    '        :         :',\n    '        |####|    |',\n    '    _.--\\\\'####\\\\'--./\\\\\\\\',\n    '  .\\\\'; | \\\\|\\\\ | / |/',\n    '  |\\\\ || | \\\\' |\\\\ ||/',\n    '   \\\\`- | \\\\`-\\\\\'/\\\\ |\\\\      such terminal',\n    '    \\\\ \\\\`\\\\\'-;-;    :/',\n    '     \\\\ ___    _/',\n    '      //    ||',\n    '     //     ||',\n    '    | \\\\\\\\    )//            much art',\n    '    |  \\\\\\\\_ //\\\\' ',\n    '    | \\\\___ /',\n    '    \\\\ \\\\`--- \\\\'',\n    '     \\`------\\\\''\n  ],\n  parrot: [\n    '          .--.',\n    '         / /\\\\ \\\\\\\\\\',\n    '        ( (__) )',\n    '         \\\\\\\\ \\\\/ /',\n    '          \\`--\\'',\n    '         / \\\"\\\" \\\\\\\\\\',\n    '        / _.._ \\\\\\\\\\',\n    '       / / .. \\\\ \\\\\\\\\\',\n    '      ( ( \\\\'\\\\' ) )',\n    '       \\\\\\\\ \\__/ /',\n    '        \\`----\\'  Squawk! Party time!'\n  ],\n};\n

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
    description: 'Upload a file to the decay chamber (TODO).',
    usage: 'upload [file]',
    handler: (term, args) => {
      term.writeln(`${COLORS.YELLOW}TODO: Implement file upload for: ${args.join(' ')}${COLORS.RESET}`);
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
    handler: (term) => {
      term.writeln('\r\n' + ASCII_ART.cow.join('\r\n')); // Join lines with CRLF
    },
  },
  doge: {
    description: 'Such wow. Much terminal.',
    usage: 'doge',
    handler: (term) => {
      term.writeln('\r\n' + ASCII_ART.doge.join('\r\n'));
    },
  },
  parrot: {
    description: 'Party time!',
    usage: 'parrot',
    handler: (term) => {
      term.writeln('\r\n' + ASCII_ART.parrot.join('\r\n'));
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
  const xtermInstance = useRef(null);
  const fitAddon = useRef(new FitAddon());
  const [isIdle, setIsIdle] = useState(false);
  const idleTimer = useRef(null);

  const prompt = () => {
    if (xtermInstance.current) {
        xtermInstance.current.write(`\r\n${COLORS.CYBER_GREEN}$${COLORS.RESET} `);
    }
  };

  const handleCommand = (term, commandLine) => {
    const parts = commandLine.trim().split(' ').filter(part => part !== '');
    const commandName = parts[0];
    const args = parts.slice(1);

    if (!commandName) {
      prompt();
      return;
    }

    const command = COMMANDS[commandName];

    if (command) {
      command.handler(term, args);
    } else {
      term.writeln(`${COLORS.RED}Command not found:${COLORS.RESET} ${commandName}`);
      term.writeln(`Type ${COLORS.CYBER_ACCENT}'help'${COLORS.RESET} for available commands.`);
    }
    prompt();
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
    if (terminalRef.current && !xtermInstance.current) {
      // Initialize xterm
      const term = new Xterm({
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
            if (lineBuffer.trim()) {
              handleCommand(term, lineBuffer);
            } else {
              prompt(); // Show prompt again if only Enter was pressed
            }
            lineBuffer = ''; // Reset buffer
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
        clearTimeout(idleTimer.current); // Clear timer on unmount
        window.removeEventListener('resize', handleResize);
        dataListener.dispose(); // Dispose the data listener
        // Dispose matrix handler's key listener if it exists (complex to track here, handled internally in matrix for now)
        if (xtermInstance.current) {
           xtermInstance.current.dispose();
           xtermInstance.current = null;
        }
      };
    }
  }, []);

  return (
    <div className="w-full h-full relative"> {/* Added relative positioning */} 
      <div ref={terminalRef} className="w-full h-full"></div>
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