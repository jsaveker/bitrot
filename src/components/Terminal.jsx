import React, { useEffect, useRef } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css'; // Import xterm styles

function Terminal() {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddon = useRef(new FitAddon());

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
      term.writeln('Welcome to the Bit Rot Laboratory!');
      term.writeln('Initializing data decay simulation...');
      term.writeln('Type \'help\' for available commands.');
      term.write('\r\n$ '); // Prompt

      // Example: Handle input (basic echo for now)
      term.onData(e => {
        term.write(e);
        if (e === '\r') { // Enter key
          term.write('\r\n$ ');
        }
        // Add command handling logic here later
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