import { motion } from 'framer-motion';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { useEffect, useState } from 'react';

// Helper function for random character
const getRandomChar = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};\':",./<>?|';
  return chars[Math.floor(Math.random() * chars.length)];
};

// Glitchy text component
const GlitchText = ({ text, interval = 50, className = '' }) => {
  const [glitchedText, setGlitchedText] = useState(text);

  useEffect(() => {
    let glitchInterval;
    const startGlitch = () => {
      glitchInterval = setInterval(() => {
        let newText = '';
        for (let i = 0; i < text.length; i++) {
          newText += Math.random() < 0.08 ? getRandomChar() : text[i];
        }
        setGlitchedText(newText);
      }, interval);
    };

    const stopGlitch = () => {
      clearInterval(glitchInterval);
      setGlitchedText(text);
    };

    const timeoutId = setTimeout(() => {
      startGlitch();
      setTimeout(stopGlitch, interval * 4);
    }, Math.random() * 3000 + 1000); // Random delay before glitching

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(timeoutId);
    };
  }, [text, interval]);

  return <span className={`inline-block ${className}`}>{glitchedText}</span>;
};

// ASCII Art Component (Simple Example)
const AsciiGlitch = () => {
  const art = [
    '███╗   ███╗███████╗ ██████╗ ██╗   ██╗███████╗████████╗',
    '████╗ ████║██╔════╝██╔════╝ ██║   ██║██╔════╝╚══██╔══╝',
    '██╔████╔██║███████╗██║  ███╗██║   ██║███████╗   ██║   ',
    '██║╚██╔╝██║╚════██║██║   ██║██║   ██║╚════██║   ██║   ',
    '██║ ╚═╝ ██║███████║╚██████╔╝╚██████╔╝███████║   ██║   ',
    '╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   ',
  ];
  const [glitchedArt, setGlitchedArt] = useState(art.join('\n'));

  useEffect(() => {
    const intervalId = setInterval(() => {
      let newArt = '';
      for (const line of art) {
        let newLine = '';
        for (let char of line) {
          newLine += Math.random() < 0.005 ? getRandomChar() : char;
        }
        newArt += newLine + '\n';
      }
      setGlitchedArt(newArt);
    }, 100);
    return () => clearInterval(intervalId);
  }, []);

  return <pre className="text-cyberpunk-primary text-xs md:text-sm leading-tight text-center opacity-80 mb-6">{glitchedArt}</pre>;
}

function App() {
  const [corruptionLevel, setCorruptionLevel] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCorruptionLevel((prev) => (prev >= 100 ? Math.random() * 10 : prev + Math.random() * 5));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative animate-background-pan p-4 flex items-center justify-center text-cyberpunk-primary">
      <div className="scanline"></div>

      {/* Main terminal window */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="terminal-window w-full max-w-4xl text-cyberpunk-primary"
      >
        {/* Terminal Header */}
        <div className="terminal-header">
          <span className="terminal-button bg-red-500"></span>
          <span className="terminal-button bg-yellow-500"></span>
          <span className="terminal-button bg-green-500"></span>
          <span className="ml-auto text-xs text-gray-400">/dev/null &gt; bitrot.sh</span>
        </div>

        {/* Terminal Content */}
        <div className="p-6 md:p-8">
          {/* ASCII Art */}
          <AsciiGlitch />

          <p className="text-center text-lg md:text-xl text-cyberpunk-accent mb-4 status-line animate-flicker">
            // SYSTEM STATUS: <span className="text-red-500 font-bold">DATA CORRUPTION DETECTED</span> //
          </p>

          <div className="font-mono text-xs md:text-sm space-y-1 mb-6 bg-black bg-opacity-20 p-4 rounded border border-cyberpunk-primary/30 text-cyberpunk-primary">
            <p>&gt; Initializing connection to <GlitchText text="bitrot.sh" className="text-cyberpunk-secondary font-bold" interval={80} />...</p>
            <p>&gt; <span className="text-yellow-400">WARN:</span> Packet loss significant. Integrity compromised.</p>
            <p>&gt; Calculating data decay rate...</p>
            <p>&gt; Estimated corruption: <span className="text-green-400 font-bold">{corruptionLevel.toFixed(2)}%</span> <span className="text-gray-500">(Increasing...)</span></p>
            <p>&gt; Signal source: Unknown. Possibly a rogue AI playing Pong?</p>
            <p>&gt; <span className="text-cyan-400">INFO:</span> Full site reconstruction pending. Please wait.</p>
            <p>&gt; Do not attempt to adjust your monitor. We control the vertical and the horizontal.</p>
          </div>

          {/* Social links - REMOVED */}
          {/* 
          <div className="flex justify-center items-center gap-6 md:gap-8 border-t border-cyberpunk-primary/50 pt-5 mt-6">
            <span className="text-xs text-gray-400">// Connect:</span>
            <motion.a
              whileHover={{ scale: 1.2, y: -2, color: '#00ffff' }}
              href="https://github.com"
              target="_blank" rel="noopener noreferrer"
              className="text-cyberpunk-primary transition-all duration-200"
              aria-label="GitHub"
            >
              <FaGithub size={24} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, y: -2, color: '#00ffff' }}
              href="https://twitter.com"
              target="_blank" rel="noopener noreferrer"
              className="text-cyberpunk-primary transition-all duration-200"
              aria-label="Twitter"
            >
              <FaTwitter size={24} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, y: -2, color: '#00ffff' }}
              href="https://linkedin.com"
              target="_blank" rel="noopener noreferrer"
              className="text-cyberpunk-primary transition-all duration-200"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={24} />
            </motion.a>
          </div>
          */}

          <p className="text-center text-xs text-green-700 mt-6 animate-flicker">ETA: When it's done™</p>
        </div>
      </motion.div>

      {/* Removed old decorative corners as they are part of the terminal style now */}
    </div>
  );
}

export default App; 