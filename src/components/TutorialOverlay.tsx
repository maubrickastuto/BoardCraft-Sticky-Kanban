import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layers, MousePointer2, Users } from 'lucide-react';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: 'Welcome to BoardCraft',
    description: 'The elegant, minimalist way to organize your tasks, projects, and life.',
    icon: <Sparkles className="w-12 h-12 text-amber-500" />,
  },
  {
    id: 2,
    title: 'Workspaces & Projects',
    description: 'Separate your personal life from work. Create unlimited projects within each workspace.',
    icon: <Layers className="w-12 h-12 text-[#10b981]" />,
  },
  {
    id: 3,
    title: 'Drag & Drop Fluidity',
    description: 'Move sticky notes effortlessly. Add colors and custom fonts to make them yours.',
    icon: <MousePointer2 className="w-12 h-12 text-[#3b82f6]" />,
  },
  {
    id: 4,
    title: 'Real-time Collaboration',
    description: 'Invite your team. See their cursors live and chat within projects natively.',
    icon: <Users className="w-12 h-12 text-[#a855f7]" />,
  }
];

export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishTutorial();
    }
  };

  const finishTutorial = () => {
    localStorage.setItem('kb_tutorial_completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] shadow-[8px_8px_0px_rgba(26,26,26,1)] dark:shadow-[8px_8px_0px_rgba(250,248,245,0.2)] w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col font-sans"
      >
        <div className="flex justify-end p-4 border-b-2 border-transparent">
          <button 
            onClick={finishTutorial}
            className="text-[#1A1A1A] dark:text-[#FAF8F5] opacity-60 hover:opacity-100 transition-opacity px-4 py-2 text-sm font-bold font-sans cursor-pointer"
          >
            Skip Tutorial
          </button>
        </div>

        <div className="relative h-[320px] flex items-center justify-center overflow-hidden p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="mb-6 p-4 rounded-full border-2 border-[#1A1A1A] dark:border-[#FAF8F5] bg-white dark:bg-[#25231F] shadow-[4px_4px_0px_rgba(26,26,26,1)] dark:shadow-[4px_4px_0px_rgba(250,248,245,0.2)]">
                {SLIDES[currentSlide].icon}
              </div>
              <h2 className="text-3xl font-bold font-serif text-[#1A1A1A] dark:text-[#FAF8F5] mb-4">
                {SLIDES[currentSlide].title}
              </h2>
              <p className="text-lg text-[#1A1A1A] dark:text-[#FAF8F5] opacity-80 max-w-md">
                {SLIDES[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 bg-[#E5E2DA]/30 dark:bg-[#2D2A24]/30 border-t-2 border-[#1A1A1A] dark:border-[#FAF8F5] flex items-center justify-between">
          <div className="flex space-x-3">
            {SLIDES.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-3 rounded-full transition-all duration-300 border-2 border-[#1A1A1A] dark:border-[#FAF8F5] ${
                  idx === currentSlide ? 'w-10 bg-[#1A1A1A] dark:bg-[#FAF8F5]' : 'w-3 bg-transparent'
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextSlide}
            className="bg-[#1A1A1A] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#1A1A1A] px-8 py-3 rounded-xl font-bold font-sans shadow-[4px_4px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.1)] transition-all active:translate-y-1 active:translate-x-1 active:shadow-none cursor-pointer"
          >
            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
