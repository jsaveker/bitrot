import { motion } from 'framer-motion';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { useEffect, useState } from 'react';

// Helper function for random character
const getRandomChar = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};\':",./<>?|';
  return chars[Math.floor(Math.random() * chars.length)];
};

// Glitchy text component
const GlitchText = ({ text, interval = 50 }) => {
  const [glitchedText, setGlitchedText] = useState(text);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      let newText = '';
      for (let i = 0; i < text.length; i++) {
        newText += Math.random() < 0.05 ? getRandomChar() : text[i];
      }
      setGlitchedText(newText);
    }, interval);

    // Reset after a short delay
    const resetTimeout = setTimeout(() => {
      clearInterval(glitchInterval);
      setGlitchedText(text);
    }, interval * 5);

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(resetTimeout);
    };
  }, [text, interval]);

  return <span>{glitchedText}</span>;
};

function App() {
  const [corruptionLevel, setCorruptionLevel] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCorruptionLevel((prev) => (prev >= 100 ? 0 : prev + Math.random() * 5));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-cyberpunk-darker font-cyber text-white p-4 flex items-center justify-center">
      {/* Enhanced Scanline / Grid effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 157, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <div className="scanline"></div>

      {/* Main content container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        className="relative z-10 border-2 border-cyberpunk-primary p-8 md:p-12 bg-cyberpunk-dark bg-opacity-80 max-w-3xl text-center shadow-lg shadow-cyberpunk-primary/30"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-cyberpunk-secondary animate-glow">
          <GlitchText text="bitrot.sh" interval={100} />
        </h1>
        <p className="text-xl md:text-2xl text-cyberpunk-accent mb-6">
          // SYSTEM STATUS: <span className="text-red-500">CRITICAL</span> //
        </p>

        <div className="text-left mb-8 space-y-2 text-sm md:text-base">
          <p>&gt; Analyzing domain integrity...</p>
          <p>&gt; <span className="text-yellow-400">Warning:</span> Significant data degradation detected.</p>
          <p>&gt; Estimated data corruption: <span className="text-cyberpunk-primary">{corruptionLevel.toFixed(2)}%</span></p>
          <p>&gt; Cause: Suspected spontaneous entropy spike (or maybe cosmic rays?).</p>
          <p>&gt; Recommendation: Apply percussive maintenance? <span className="text-gray-500">(Probably not.)</span></p>
          <p>&gt; Stand by for neural uplink... or just check back later.</p>
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-6 border-t-2 border-cyberpunk-primary pt-6 mt-8">
          <motion.a
            whileHover={{ scale: 1.2, color: '#00ffff' }}
            href="https://github.com"
            target="_blank" rel="noopener noreferrer"
            className="text-cyberpunk-primary transition-colors duration-300"
            aria-label="GitHub"
          >
            <FaGithub size={28} />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.2, color: '#00ffff' }}
            href="https://twitter.com"
            target="_blank" rel="noopener noreferrer"
            className="text-cyberpunk-primary transition-colors duration-300"
            aria-label="Twitter"
          >
            <FaTwitter size={28} />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.2, color: '#00ffff' }}
            href="https://linkedin.com"
            target="_blank" rel="noopener noreferrer"
            className="text-cyberpunk-primary transition-colors duration-300"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={28} />
          </motion.a>
        </div>
        
        <p className="text-xs text-gray-500 mt-8">Initializing full site... ETA: [REDACTED]</p>

      </motion.div>
      
      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-cyberpunk-secondary opacity-70"></div>
      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-cyberpunk-secondary opacity-70"></div>
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-cyberpunk-secondary opacity-70"></div>
      <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-cyberpunk-secondary opacity-70"></div>
    </div>
  );
}

export default App; 