import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Loader2 } from 'lucide-react';
import { COLLABORATOR_COLORS } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (userData: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    color: string;
    rememberMe: boolean;
  }) => void;
  isDarkMode: boolean;
}

const getErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/wrong-password': return 'Incorrect password. Please try again.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user': return 'Sign-in window was closed. Please try again.';
    case 'auth/popup-blocked': return 'Pop-up was blocked. Please allow pop-ups for this app.';
    case 'auth/network-request-failed': return 'Network error. Please check your connection.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/cancelled-popup-request': return '';
    case 'auth/account-exists-with-different-credential': return 'An account with this email already uses a different sign-in method.';
    default: return 'Something went wrong. Please try again.';
  }
};

const StickyNoteIcon = () => (
  <svg viewBox="0 0 512 512" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="58" y="98" width="380" height="370" rx="12" fill="#000000" fillOpacity="0.06" transform="rotate(3 248 283)"/>
    <g transform="rotate(3 248 283)">
      <rect x="48" y="88" width="380" height="370" rx="12" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="3"/>
      <path d="M 390 458 L 428 420 L 428 458 Z" fill="#FDE68A"/>
      <path d="M 390 458 L 428 420" stroke="#FBBF24" strokeWidth="2" fill="none"/>
      <path d="M 115 205 Q 180 195 245 205 Q 310 215 370 203" stroke="#92400E" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.3"/>
      <path d="M 115 270 Q 165 262 215 270 Q 268 278 330 265" stroke="#92400E" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.24"/>
      <path d="M 115 335 Q 155 328 190 335 Q 222 341 255 332" stroke="#92400E" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.18"/>
    </g>
    <line x1="250" y1="108" x2="250" y2="60" stroke="#9CA3AF" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="250" cy="40" r="30" fill="#EF4444"/>
    <circle cx="250" cy="40" r="20" fill="#DC2626"/>
    <circle cx="241" cy="31" r="8" fill="#FCA5A5" opacity="0.7"/>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleLogo = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

export default function LoginScreen({ onLoginSuccess, isDarkMode }: LoginScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const clearError = () => setError(null);

  const getRandomColor = () =>
    COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];

  const completeLogin = (uid: string, name: string, userEmail: string, photoURL: string | null) => {
    const color = localStorage.getItem('kanban_user_color') || getRandomColor();
    onLoginSuccess({ uid, displayName: name, email: userEmail, photoURL, color, rememberMe });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim()) return;

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      } catch (err: any) {
        setError(getErrorMessage(err.code));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) return;
    setIsLoading(true);

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Please enter your name.');
          setIsLoading(false);
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
        completeLogin(credential.user.uid, displayName.trim(), credential.user.email || '', null);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        completeLogin(
          credential.user.uid,
          credential.user.displayName || credential.user.email || 'User',
          credential.user.email || '',
          credential.user.photoURL
        );
      }
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      completeLogin(
        result.user.uid,
        result.user.displayName || result.user.email || 'User',
        result.user.email || '',
        result.user.photoURL
      );
    } catch (err: any) {
      const msg = getErrorMessage(err.code);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    clearError();
    setIsLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      const result = await signInWithPopup(auth, provider);
      completeLogin(
        result.user.uid,
        result.user.displayName || result.user.email || 'User',
        result.user.email || '',
        result.user.photoURL
      );
    } catch (err: any) {
      const msg = getErrorMessage(err.code);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    clearError();
    setResetSent(false);
  };

  const inputBase = `w-full text-sm border rounded-lg px-3 py-2.5 transition-colors focus:outline-none ${
    isDarkMode
      ? 'bg-[#25231F] border-[#2D2A24] text-[#FAF8F5] placeholder-[#5C5850] focus:border-[#FAF8F5]/50'
      : 'bg-white border-[#E5E2DA] text-[#1A1A1A] placeholder-[#BEB9AD] focus:border-[#1A1A1A]/40'
  }`;

  const labelBase = `block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
    isDarkMode ? 'text-[#7A756B]' : 'text-[#8C887D]'
  }`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gradient-to-br from-[#121211] via-[#1C1B17] to-[#121211]'
        : 'bg-gradient-to-br from-[#FAF8F5] via-[#F4F1EA] to-[#FAF8F5]'
    }`}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute top-1/4 left-1/6 w-72 h-72 rounded-full blur-3xl ${isDarkMode ? 'bg-amber-900/8' : 'bg-amber-200/25'}`} />
        <div className={`absolute bottom-1/4 right-1/6 w-80 h-80 rounded-full blur-3xl ${isDarkMode ? 'bg-rose-900/8' : 'bg-rose-200/15'}`} />
      </div>

      <div className="relative w-full max-w-[420px]">

        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="drop-shadow-lg"
          >
            <StickyNoteIcon />
          </motion.div>

          <h1 className={`mt-4 text-3xl font-serif italic font-bold tracking-tight ${
            isDarkMode ? 'text-[#FAF8F5]' : 'text-[#1A1A1A]'
          }`}>
            BoardCraft
          </h1>
          <p className={`mt-1.5 text-[10px] font-mono uppercase tracking-[0.2em] ${
            isDarkMode ? 'text-[#7A756B]' : 'text-[#8C887D]'
          }`}>
            Your Minimalist Kanban Board
          </p>
        </motion.div>

        <motion.div
          className={`rounded-2xl border p-6 shadow-xl backdrop-blur-sm ${
            isDarkMode
              ? 'bg-[#1C1B17]/95 border-[#2D2A24] shadow-black/30'
              : 'bg-white/95 border-[#E5E2DA] shadow-[#1A1A1A]/8'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >

          {mode !== 'forgot' && (
            <div className={`flex mb-6 rounded-lg overflow-hidden border ${
              isDarkMode ? 'border-[#2D2A24]' : 'border-[#E5E2DA]'
            }`}>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'signin'
                    ? isDarkMode
                      ? 'bg-[#FAF8F5] text-[#121211]'
                      : 'bg-[#1A1A1A] text-white'
                    : isDarkMode
                      ? 'text-[#7A756B] hover:text-[#BEB9AD]'
                      : 'text-[#8C887D] hover:text-[#5C5850]'
                }`}
                aria-label="Switch to sign in"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'signup'
                    ? isDarkMode
                      ? 'bg-[#FAF8F5] text-[#121211]'
                      : 'bg-[#1A1A1A] text-white'
                    : isDarkMode
                      ? 'text-[#7A756B] hover:text-[#BEB9AD]'
                      : 'text-[#8C887D] hover:text-[#5C5850]'
                }`}
                aria-label="Switch to create account"
              >
                Create Account
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`text-[10px] uppercase tracking-wider font-medium mb-3 cursor-pointer transition-colors ${
                  isDarkMode ? 'text-[#7A756B] hover:text-[#FAF8F5]' : 'text-[#8C887D] hover:text-[#1A1A1A]'
                }`}
              >
                ← Back to Sign In
              </button>
              <h2 className={`text-sm font-serif italic font-bold ${
                isDarkMode ? 'text-[#FAF8F5]' : 'text-[#1A1A1A]'
              }`}>
                Reset your password
              </h2>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#7A756B]' : 'text-[#8C887D]'}`}>
                We'll send a reset link to your email.
              </p>
            </div>
          )}

          {resetSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-center py-6 rounded-lg ${
                isDarkMode ? 'bg-emerald-950/30' : 'bg-emerald-50'
              }`}
            >
              <div className="text-3xl mb-2">✉️</div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Reset link sent!
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#7A756B]' : 'text-[#8C887D]'}`}>
                Check your inbox for {email}
              </p>
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`mt-4 text-[10px] uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                  isDarkMode ? 'text-[#FAF8F5] hover:text-[#BEB9AD]' : 'text-[#1A1A1A] hover:text-[#5C5850]'
                }`}
              >
                Back to Sign In
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">

              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label htmlFor="login-name" className={labelBase}>Your Name</label>
                    <div className="relative">
                      <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-[#5C5850]' : 'text-[#BEB9AD]'}`} />
                      <input
                        id="login-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="How should we call you?"
                        className={`${inputBase} pl-10`}
                        maxLength={20}
                        autoComplete="name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="login-email" className={labelBase}>Email</label>
                <div className="relative">
                  <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-[#5C5850]' : 'text-[#BEB9AD]'}`} />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${inputBase} pl-10`}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <label htmlFor="login-password" className={labelBase}>Password</label>
                  <div className="relative">
                    <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-[#5C5850]' : 'text-[#BEB9AD]'}`} />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                      className={`${inputBase} pl-10 pr-11`}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${
                        isDarkMode ? 'text-[#5C5850] hover:text-[#BEB9AD]' : 'text-[#BEB9AD] hover:text-[#5C5850]'
                      }`}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode !== 'forgot' && (
                <label
                  htmlFor="login-remember"
                  className={`flex items-center gap-2.5 cursor-pointer select-none py-1 ${
                    isDarkMode ? 'text-[#BEB9AD]' : 'text-[#5C5850]'
                  }`}
                >
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1A1A1A] dark:accent-[#FAF8F5] cursor-pointer"
                  />
                  <span className="text-xs">Remember me for 30 days</span>
                </label>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`flex items-start gap-2.5 rounded-lg p-3 text-xs leading-relaxed ${
                      isDarkMode ? 'bg-red-950/30 text-red-400' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-[#FAF8F5] text-[#121211] hover:bg-[#ECE8DF] active:bg-[#DDD8CC]'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#2E2E2E] active:bg-[#3A3A3A]'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : mode === 'signin' ? (
                  'Sign In'
                ) : mode === 'signup' ? (
                  'Create Account'
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {mode === 'signin' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className={`text-[10px] uppercase tracking-wider font-medium cursor-pointer transition-colors ${
                      isDarkMode ? 'text-[#7A756B] hover:text-[#FAF8F5]' : 'text-[#8C887D] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </form>
          )}

          {mode !== 'forgot' && !resetSent && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className={`flex-1 h-px ${isDarkMode ? 'bg-[#2D2A24]' : 'bg-[#E5E2DA]'}`} />
                <span className={`text-[10px] uppercase tracking-wider font-medium ${
                  isDarkMode ? 'text-[#7A756B]' : 'text-[#8C887D]'
                }`}>
                  or continue with
                </span>
                <div className={`flex-1 h-px ${isDarkMode ? 'bg-[#2D2A24]' : 'bg-[#E5E2DA]'}`} />
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? 'bg-[#25231F] border-[#2D2A24] text-[#FAF8F5] hover:bg-[#2D2A24] hover:border-[#3D3930]'
                      : 'bg-white border-[#E5E2DA] text-[#1A1A1A] hover:bg-[#F4F1EA] hover:border-[#C5C2B9]'
                  }`}
                  aria-label="Sign in with Google"
                >
                  <GoogleLogo />
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-900'
                  }`}
                  aria-label="Sign in with Apple"
                >
                  <AppleLogo className={isDarkMode ? 'text-black' : 'text-white'} />
                  <span>Continue with Apple</span>
                </button>
              </div>
            </>
          )}
        </motion.div>

        <motion.p
          className={`text-center mt-6 text-[10px] tracking-wider ${
            isDarkMode ? 'text-[#5C5850]' : 'text-[#BEB9AD]'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Secure authentication powered by Firebase
        </motion.p>
      </div>
    </div>
  );
}
