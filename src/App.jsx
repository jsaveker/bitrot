import { motion } from 'framer-motion';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

function App() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Scanline effect */}
      <div className="scanline"></div>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-4 animate-glow">
            bitrot.sh
          </h1>
          <p className="text-2xl md:text-3xl text-cyberpunk-primary mb-8">
            Cyber Security & Technology
          </p>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-lg mb-8">
              Exploring the intersection of security, technology, and the future.
              Join us in the digital frontier.
            </p>
            
            <div className="flex justify-center gap-4 mb-12">
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href="https://github.com"
                className="cyber-button"
              >
                Projects
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href="#contact"
                className="cyber-button"
              >
                Contact
              </motion.a>
            </div>
          </div>
          
          {/* Social links */}
          <div className="flex justify-center gap-6">
            <motion.a
              whileHover={{ scale: 1.2 }}
              href="https://github.com"
              className="text-cyberpunk-primary hover:text-cyberpunk-accent"
            >
              <FaGithub size={24} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2 }}
              href="https://twitter.com"
              className="text-cyberpunk-primary hover:text-cyberpunk-accent"
            >
              <FaTwitter size={24} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2 }}
              href="https://linkedin.com"
              className="text-cyberpunk-primary hover:text-cyberpunk-accent"
            >
              <FaLinkedin size={24} />
            </motion.a>
          </div>
        </motion.div>
      </main>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-1 h-20 bg-cyberpunk-primary"></div>
        <div className="absolute top-0 right-0 w-1 h-20 bg-cyberpunk-primary"></div>
        <div className="absolute bottom-0 left-0 w-1 h-20 bg-cyberpunk-primary"></div>
        <div className="absolute bottom-0 right-0 w-1 h-20 bg-cyberpunk-primary"></div>
      </div>
    </div>
  );
}

export default App; 