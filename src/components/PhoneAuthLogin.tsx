import React, { useState } from 'react';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Lock,
  Database,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { ActionOwner } from '../types';
import { auth, googleProvider } from '../utils/firebase';
import { ensureUserProfile, clearLegacySharedStorage } from '../utils/firebaseSync';

interface PhoneAuthLoginProps {
  onLoginSuccess: (user: ActionOwner, firebaseUser: FirebaseUser | null) => void;
}

export default function PhoneAuthLogin({ onLoginSuccess }: PhoneAuthLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      clearLegacySharedStorage();
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await ensureUserProfile(result.user);
      onLoginSuccess(profile, result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const message = err instanceof Error ? err.message : String(err);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError('Sign-in popup was closed before completing authentication. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setError('Your browser blocked the sign-in popup. Please allow popups for this site and try again.');
      } else {
        setError(`Sign-in failed: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background graphics */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-slate-900 to-slate-900" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/85 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl relative z-10 overflow-hidden">
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="https://1000logos.net/wp-content/uploads/2018/08/DHL-emblem.jpg"
              alt="DHL Logo"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-10 w-auto object-contain rounded-md mb-3"
            />
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              DHL Voice Workspace
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Private Per-User Data Bucket Access
            </p>
          </div>

          {/* Isolation Guarantees Card */}
          <div className="w-full bg-slate-900/75 border border-slate-700/80 rounded-xl p-4 text-left mb-6 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Your Data Stays Strictly Private</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Every account gets its own isolated cloud bucket tied to your verified identity.</span>
              </li>
              <li className="flex items-start gap-2">
                <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Upload your own Excel/CSV survey logs and Text Analytics exports anytime.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>Other users can never view, modify, or access your uploaded records.</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="w-full bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-lg flex items-start gap-2.5 mb-5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Google Sign-In CTA */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-400 text-slate-900 text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                <span>Authenticating your private bucket...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-700/60 pt-4 w-full justify-center">
            <Lock className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
            <span>Firebase Authenticated • User-Scoped Firestore Isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
