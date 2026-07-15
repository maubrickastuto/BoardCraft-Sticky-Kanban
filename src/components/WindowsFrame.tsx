import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Minus, 
  Square, 
  X, 
  HelpCircle, 
  Monitor, 
  Cpu, 
  Info, 
  Keyboard, 
  Download, 
  Sun, 
  Moon, 
  RefreshCw, 
  Power,
  AppWindow,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WindowsFrameProps {
  children: ReactNode;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportProject: () => void;
  activeProjectName?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onAddTask: () => void;
}

export default function WindowsFrame({
  children,
  isDarkMode,
  onToggleDarkMode,
  onExportProject,
  activeProjectName,
  isSidebarOpen,
  onToggleSidebar,
  onAddTask
}: WindowsFrameProps) {

  const [windowState, setWindowState] = useState<'maximized' | 'windowed' | 'minimized' | 'closed'>('maximized');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [biosProgress, setBiosProgress] = useState(0);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (windowState === 'closed') return;

      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleSidebar();
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onToggleDarkMode();
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onExportProject();
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setWindowState(prev => prev === 'maximized' ? 'windowed' : 'maximized');
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onAddTask();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowState, onToggleSidebar, onToggleDarkMode, onExportProject, onAddTask]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (windowState === 'closed') {
      setBiosProgress(0);
    }
  }, [windowState]);

  const handleReboot = () => {
    setWindowState('minimized');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setBiosProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setWindowState('maximized');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    }, 80);
  };

  const windowTitle = activeProjectName 
    ? `${activeProjectName} - BoardCraft Desktop v1.4.0`
    : `BoardCraft Desktop v1.4.0`;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#E1DDD3] dark:bg-[#0A0A09] transition-colors duration-300">
      <AnimatePresence>
        {windowState === 'closed' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black text-emerald-500 font-mono p-6 z-50 flex flex-col justify-between"
          >
            <div>
              <p className="text-emerald-400 mb-2">BOARDCRAFT BIOS V4.01.26 - RELEASE: 07/09/2026</p>
              <p className="mb-1">CPU: AMD Ryzen Threadripper PRO 3995WX @ 3.50GHz</p>
              <p className="mb-1">MEMORY TEST: 65536MB OK</p>
              <p className="mb-4">DETECTING PRIMARY STORAGE... SECURE FIRESTORE ACTIVE</p>
              {biosProgress > 0 && (
                <div className="space-y-1">
                  <p>LOADING SYSTEM KERNEL...</p>
                  <div className="w-64 h-4 bg-emerald-950 border border-emerald-500 overflow-hidden relative">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${biosProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-emerald-600">{biosProgress}% Complete</p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-12 max-w-md mx-auto text-center">
              <Power className="w-16 h-16 text-emerald-500 animate-pulse mb-4" />
              <h2 className="text-lg font-bold tracking-wider mb-2">SYSTEM SHUT DOWN</h2>
              <p className="text-xs text-emerald-600/80 mb-6">
                BoardCraft window has been exited successfully. Your boards remain safely stored in the cloud.
              </p>
              <button
                onClick={handleReboot}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-xs border-2 border-emerald-300 shadow-[4px_4px_0px_#044225] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Relaunch BoardCraft
              </button>
            </div>

            <p className="text-center text-[10px] text-emerald-700">
              BOARDCRAFT DESKTOP CO. ALL RIGHTS RESERVED.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {windowState === 'minimized' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 bg-[#E8E4D9] dark:bg-[#161513] flex flex-col items-center justify-center p-8 z-30"
            style={{
              backgroundImage: isDarkMode 
                ? 'radial-gradient(#1e1d1b 1.5px, transparent 1.5px)' 
                : 'radial-gradient(#d3cfc4 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px'
            }}
          >
            <div className="text-center max-w-sm p-6 bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] rounded-2xl shadow-[8px_8px_0px_rgba(26,26,26,0.15)] dark:shadow-[8px_8px_0px_rgba(250,248,245,0.15)]">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-[#8C887D] dark:text-[#7A756B]" />
              <h3 className="font-serif italic font-bold text-lg text-[#1A1A1A] dark:text-[#FAF8F5]">BoardCraft Minimized</h3>
              <p className="text-xs text-[#5C5850] dark:text-[#BEB9AD] mt-2 mb-6">
                The application is running in the background. Click the button below or double-click to restore.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setWindowState('maximized')}
                  className="px-4 py-2 border-2 border-[#1A1A1A] dark:border-[#FAF8F5] text-[10px] uppercase font-bold tracking-widest hover:bg-[#1A1A1A] hover:text-white dark:hover:bg-[#FAF8F5] dark:hover:text-[#121211] text-[#1A1A1A] dark:text-[#FAF8F5] transition-all cursor-pointer shadow-[3px_3px_0px_rgba(26,26,26,0.15)] active:translate-y-0.5"
                >
                  Restore Window
                </button>
                <button
                  onClick={() => setWindowState('closed')}
                  className="px-4 py-2 border-2 border-red-500 hover:bg-red-500 hover:text-white text-red-500 text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer shadow-[3px_3px_0px_rgba(239,68,68,0.15)] active:translate-y-0.5"
                >
                  Close App
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
          windowState === 'windowed' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: isDarkMode ? '#11100F' : '#ECE8DF',
          backgroundImage: isDarkMode 
            ? 'radial-gradient(#1e1d1b 2px, transparent 2px), linear-gradient(to right, #181716 1px, transparent 1px), linear-gradient(to bottom, #181716 1px, transparent 1px)' 
            : 'radial-gradient(#d5d1c5 2px, transparent 2px), linear-gradient(to right, #e2ded4 1px, transparent 1px), linear-gradient(to bottom, #e2ded4 1px, transparent 1px)',
          backgroundSize: '24px 24px, 120px 120px, 120px 120px',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute top-4 left-4 flex flex-col items-center gap-1 opacity-60">
          <Cpu className="w-8 h-8 text-[#1A1A1A] dark:text-[#FAF8F5]" />
          <span className="text-[9px] font-mono font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">SYSTEM_CORE</span>
        </div>
      </div>

      <div 
        className={`w-full h-full flex flex-col transition-all duration-300 ease-in-out ${
          windowState === 'windowed' 
            ? 'max-w-[92vw] max-h-[85vh] m-auto absolute inset-0 border-2 border-[#1A1A1A] dark:border-[#FAF8F5] rounded-xl shadow-[10px_10px_0px_rgba(26,26,26,0.3)] dark:shadow-[10px_10px_0px_rgba(250,248,245,0.15)] overflow-hidden bg-[#FAF8F5] dark:bg-[#121211]'
            : windowState === 'maximized'
            ? 'w-full h-full relative'
            : 'hidden'
        }`}
      >

        <div className="flex-1 flex overflow-hidden relative">
          {children}
        </div>
      </div>

      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 bg-[#1A1A1A]/50 dark:bg-black/75 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] rounded-2xl p-6 shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#FAF8F5]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <AppWindow className="w-6 h-6 text-[#10b981]" />
                  <h3 className="text-sm font-mono font-bold tracking-tight text-[#1A1A1A] dark:text-[#FAF8F5]">
                    ABOUT BOARDCRAFT
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="p-1 hover:bg-[#D9D5C9] dark:hover:bg-[#2D2A24] rounded-lg border border-transparent hover:border-[#1A1A1A] dark:hover:border-[#FAF8F5] text-[#5C5850] dark:text-[#BEB9AD] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs text-[#5C5850] dark:text-[#BEB9AD] border-t-2 border-b-2 border-dashed border-[#E5E2DA] dark:border-[#2D2A24] py-4 my-4">
                <p>
                  <span className="font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Product:</span> BoardCraft Collaborative Kanban
                </p>
                <p>
                  <span className="font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Version:</span> 1.4.0 (Windows Native Wrapper Ready)
                </p>
                <p>
                  <span className="font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Engine:</span> Vite + React 19 + Firebase Firestore
                </p>
                <p>
                  <span className="font-bold text-[#1A1A1A] dark:text-[#FAF8F5]">Platform:</span> Standalone PWA & Native Desktop Environment
                </p>
              </div>

              <p className="text-[11px] text-[#8C887D] dark:text-[#7A756B] leading-relaxed mb-6">
                Designed to run with zero installation directly on Windows. Installable from your browser menu as a standalone desktop app!
              </p>

              <button
                onClick={() => setIsAboutOpen(false)}
                className="w-full py-2 bg-[#1A1A1A] dark:bg-[#FAF8F5] hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] text-white dark:text-[#121211] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Close System Diagnostics
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShortcutsOpen && (
          <div className="fixed inset-0 bg-[#1A1A1A]/50 dark:bg-black/75 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#FAF8F5] dark:bg-[#1C1B17] border-2 border-[#1A1A1A] dark:border-[#FAF8F5] rounded-2xl p-6 shadow-[8px_8px_0px_#1A1A1A] dark:shadow-[8px_8px_0px_#FAF8F5]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-6 h-6 text-[#10b981]" />
                  <h3 className="text-sm font-mono font-bold tracking-tight text-[#1A1A1A] dark:text-[#FAF8F5]">
                    KEYBOARD HOTKEYS REFERENCE
                  </h3>
                </div>
                <button 
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1 hover:bg-[#D9D5C9] dark:hover:bg-[#2D2A24] rounded-lg border border-transparent hover:border-[#1A1A1A] dark:hover:border-[#FAF8F5] text-[#5C5850] dark:text-[#BEB9AD] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 font-mono text-xs text-[#1A1A1A] dark:text-[#FAF8F5] my-4 max-h-[250px] overflow-y-auto pr-2">
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#E5E2DA] dark:border-[#2D2A24]">
                  <span>Create New Note</span>
                  <kbd className="px-1.5 py-0.5 bg-[#ECE9DF] dark:bg-[#25231F] border border-[#C5C2B9] dark:border-[#3D3A35] rounded font-bold">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#E5E2DA] dark:border-[#2D2A24]">
                  <span>Toggle Left Sidebar</span>
                  <kbd className="px-1.5 py-0.5 bg-[#ECE9DF] dark:bg-[#25231F] border border-[#C5C2B9] dark:border-[#3D3A35] rounded font-bold">Ctrl + B</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#E5E2DA] dark:border-[#2D2A24]">
                  <span>Export Kanban Board</span>
                  <kbd className="px-1.5 py-0.5 bg-[#ECE9DF] dark:bg-[#25231F] border border-[#C5C2B9] dark:border-[#3D3A35] rounded font-bold">Ctrl + E</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#E5E2DA] dark:border-[#2D2A24]">
                  <span>Toggle Dark/Light Mode</span>
                  <kbd className="px-1.5 py-0.5 bg-[#ECE9DF] dark:bg-[#25231F] border border-[#C5C2B9] dark:border-[#3D3A35] rounded font-bold">Ctrl + D</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#E5E2DA] dark:border-[#2D2A24]">
                  <span>Toggle Window Maximize</span>
                  <kbd className="px-1.5 py-0.5 bg-[#ECE9DF] dark:bg-[#25231F] border border-[#C5C2B9] dark:border-[#3D3A35] rounded font-bold">Ctrl + M</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-dashed border-[#E5E2DA] dark:border-[#2D2A24]">
                  <span>Open Help Dialog</span>
                  <kbd className="px-1.5 py-0.5 bg-[#ECE9DF] dark:bg-[#25231F] border border-[#C5C2B9] dark:border-[#3D3A35] rounded font-bold">Ctrl + H</kbd>
                </div>
              </div>

              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="w-full mt-4 py-2 bg-[#1A1A1A] dark:bg-[#FAF8F5] hover:bg-[#2E2E2E] dark:hover:bg-[#ECE8DF] text-white dark:text-[#121211] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Dismiss Reference
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
