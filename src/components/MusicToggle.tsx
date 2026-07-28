import { Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '@/contexts/MusicContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function MusicToggle() {
  const { isPlaying, isMuted, toggleMusic } = useMusic();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-20 right-6 z-40 p-3 rounded-full shadow-lg shadow-black/30 border transition-all duration-300 ${
        isPlaying && !isMuted
          ? 'bg-nc-violet/20 border-nc-violet/40 text-nc-violet animate-pulse'
          : 'bg-nc-bg-secondary border-nc-violet/20 text-nc-text-muted hover:text-nc-text hover:border-nc-violet/40'
      }`}
      onClick={toggleMusic}
      title={isPlaying && !isMuted ? '关闭音乐' : '开启音乐'}
    >
      <AnimatePresence mode="wait">
        {isPlaying && !isMuted ? (
          <motion.div
            key="playing"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Volume2 className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="muted"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <VolumeX className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
