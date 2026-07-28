import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  images: { src: string; alt?: string }[];
  interval?: number;
}

export default function ImageCarousel({ images, interval = 4000 }: Props) {
  const [index, setIndex] = useState(0);

  const go = useCallback((next: number) => {
    setIndex((next + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => go(index + 1), interval);
    return () => clearInterval(id);
  }, [index, interval, go, images.length]);

  if (!images.length) return null;

  return (
    <div className="relative w-full aspect-video max-h-[75vh] overflow-hidden rounded-2xl bg-nc-bg">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index].src}
          alt={images[index].alt ?? ''}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === index ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
