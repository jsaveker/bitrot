import { motion } from 'framer-motion';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Lab from './components/Lab';
import AttackFlows from './components/AttackFlows';
import IncidentReport from './components/IncidentReport';
import ModernIncidentView from './components/ModernIncidentView';

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
  // User-provided BITROT art
  const art = [
    '██████╗     ██╗      ███████╗   ██████╗     ██████╗    ███████╗ ',
    '██╔══██╗    ██║      ╚══███╔╝   ██╔══██╗   ██╔═████╗   ╚══███╔╝ ',
    '██████╔╝    ██║        ██╔╝     ██████╔╝   ██║██╔██║     ██╔╝   ',
    '██╔══██╗    ██║        ██║      ██╔══██╗   ████╔╝██║     ██║    ',
    '██████╔╝    ██║        ██║      ██║  ██║   ╚██████╔╝     ██║    ',
    '╚═════╝     ╚═╝        ╚═╝      ╚═╝  ╚═╝    ╚═════╝      ╚═╝    '
  ];
  const [glitchedArt, setGlitchedArt] = useState(art.join('\n'));

  useEffect(() => {
    const intervalId = setInterval(() => {
      let newArt = '';
      for (const line of art) {
        let newLine = '';
        for (let char of line) {
          // Keep previous glitch effect settings
          newLine += Math.random() < 0.005 ? getRandomChar() : char;
        }
        newArt += newLine + '\n';
      }
      setGlitchedArt(newArt);
    }, 100); // Keep previous glitch interval
    return () => clearInterval(intervalId);
  }, []);

  // Keep font-mono for better alignment
  return <pre className="text-cyberpunk-primary text-xs md:text-sm leading-tight text-center opacity-80 mb-6 font-mono">{glitchedArt}</pre>;
}

// Landing Page Component (Extracted from App)
function LandingPage() {
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

          {/* Removed Social links */}

          {/* Link to Lab */}
          <p className="text-center text-sm text-cyberpunk-secondary mt-6 animate-flicker">
            &gt; Status nominal. Proceed to the{' '}
            <Link 
              to="/lab"
              className="text-cyberpunk-accent hover:text-white hover:bg-cyberpunk-accent px-1 underline transition-all duration-150 font-bold"
            >
               [DATA DECAY LAB]
            </Link>
             ?
          </p>

          <p className="text-center text-sm text-cyberpunk-secondary mt-4 animate-flicker">
            &gt; Or investigate a live{' '}
            <Link 
              to="/inc"
              className="text-red-400 hover:text-white hover:bg-red-600 px-1 underline transition-all duration-150 font-bold"
            >
               [SECURITY INCIDENT]
            </Link>
             - Critical threat detected.
          </p>
        </div>
      </motion.div>

      {/* Removed old decorative corners */}
    </div>
  );
}

// Main App Component for Routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/lab" element={<Lab />} />
      <Route path="/attack/*" element={<AttackFlows />} />
      <Route path="/incident" element={<IncidentReport />} />
      <Route path="/inc" element={<ModernIncidentView />} />
    </Routes>
  );
}

export default App; 