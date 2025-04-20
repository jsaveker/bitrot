import React from 'react';
import Terminal from './Terminal'; // Import the Terminal component

function Lab() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-cyberpunk-primary font-mono">
      {/* Header (optional, could be part of the terminal output) */}
      {/* 
      <header className="p-2 text-center bg-gray-900 border-b border-cyberpunk-primary/50">
        <h1 className="text-lg text-cyberpunk-accent animate-flicker">Bit Rot Laboratory</h1>
      </header> 
      */}

      {/* Terminal takes up the main space */}
      <main className="flex-grow p-2 overflow-hidden">
        <Terminal />
      </main>

      {/* Footer (optional, could show status or link back) */}
      <footer className="p-1 text-xs text-center text-gray-600 border-t border-cyberpunk-primary/30">
        <a href="/" className="hover:text-cyberpunk-secondary">// Exit Lab</a> | Status: Nominal
      </footer>
    </div>
  );
}

export default Lab; 