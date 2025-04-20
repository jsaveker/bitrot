import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css'; // Import xterm styles

// ANSI escape codes for colors (adjust as needed)
const COLORS = {
  RESET: '\x1b[0m',
  CYBER_GREEN: '\x1b[38;5;118m', // Approx #33ff33
  CYBER_ACCENT: '\x1b[38;5;45m',  // Approx cyan/accent color
  YELLOW: '\x1b[38;5;226m',
  RED: '\x1b[38;5;196m',
  GREY: '\x1b[38;5;244m',
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
};

function Terminal() {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddon = useRef(new FitAddon());
  const [currentLine, setCurrentLine] = useState('');

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

      // --- Input Handling Logic ---
      let lineBuffer = '';
      term.onData(e => {
        const code = e.charCodeAt(0);
        
        if (code === 13) { // Enter key
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
        } else if (code >= 32 && code <= 126) { // Printable characters
          lineBuffer += e;
          term.write(e); // Echo character
        }
        // Ignore other control characters for now
      });

      // Handle resize
      const handleResize = () => {
        fitAddon.current.fit();
      };
      window.addEventListener('resize', handleResize);

      // Focus the terminal
      term.focus();

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
        xtermInstance.current = null;
      };
    }
  }, []); // Run only once on mount

  return <div ref={terminalRef} className="w-full h-full"></div>;
}

export default Terminal; 