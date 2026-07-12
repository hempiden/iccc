import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, KeyRound, AlertCircle, ShieldCheck, ArrowRight, 
  HelpCircle, RefreshCw, Smartphone, UserCheck, Lock, Globe, User, ShieldAlert
} from 'lucide-react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import { ActionOwner } from '../types';
import { resolveColleagueProfile, findColleagueByPhoneNumber, normalizePhoneNumber } from '../utils/firebaseSync';

interface PhoneAuthLoginProps {
  onLoginSuccess: (user: ActionOwner, firebaseUser: FirebaseUser | null) => void;
}

// Demo profiles for Sandbox Mode to easily test different roles (including Superadmin)
const DEMO_ACCOUNTS = [
  {
    name: 'Hempiden (Superadmin)',
    role: 'superadmin',
    facility: 'All',
    phone: '+15555555555',
    color: 'border-amber-400 bg-amber-400/10 text-amber-300'
  },
  {
    name: 'Rothana Art (HOD)',
    role: 'HoD',
    facility: 'All',
    phone: '+15551111111',
    color: 'border-blue-400 bg-blue-400/10 text-blue-300'
  },
  {
    name: 'Sok Chea (Agent)',
    role: 'Facility Agent',
    facility: 'PNHGTW',
    phone: '+15552222222',
    color: 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
  }
];

export default function PhoneAuthLogin({ onLoginSuccess }: PhoneAuthLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('+855');
  const [verificationCode, setVerificationCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('PNHGTW');
  const [matchedColleague, setMatchedColleague] = useState<ActionOwner | null>(null);
  
  const [step, setStep] = useState<'phone' | 'register' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  // Sandbox test bypass mode - default to false unless explicitly enabled via URL param '?sandbox=true'
  const [isSandboxMode, setIsSandboxMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('sandbox') === 'true';
  });

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize Recaptcha Verifier for Live mode
  useEffect(() => {
    if (step === 'phone' && !isSandboxMode) {
      try {
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved successfully');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please request the code again.');
          }
        });
      } catch (err: any) {
        console.error('Error initializing reCAPTCHA:', err);
        const params = new URLSearchParams(window.location.search);
        const canUseSandbox = params.get('sandbox') === 'true';
        if (canUseSandbox) {
          setError('Failed to initialize reCAPTCHA security. Switching to Sandbox Mode for full reliability.');
          setIsSandboxMode(true);
        } else {
          setError('Failed to initialize reCAPTCHA security. To use the standard free reCAPTCHA on the Spark free plan, please disable reCAPTCHA Enterprise in your Firebase Console (Build > Authentication > Settings > User sign-in).');
        }
      }
    }

    return () => {
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [step, isSandboxMode]);

  // Clean error when inputs change
  useEffect(() => {
    setError(null);
  }, [phoneNumber, verificationCode, fullName, step]);

  // Handler to search colleague by phone first
  const handleInitiateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanPhone = normalizePhoneNumber(phoneNumber);
      setPhoneNumber(cleanPhone); // Update state to display beautifully normalized format
      const existing = await findColleagueByPhoneNumber(cleanPhone);
      
      if (existing) {
        // User profile recognized! Lock name and proceed to OTP verification
        setMatchedColleague(existing);
        setFullName(existing.fullName);
        await triggerSmsOtp(cleanPhone);
      } else {
        // User not recognized. Proceed to registration to gather name
        setMatchedColleague(null);
        setLoading(false);
        setStep('register');
      }
    } catch (err) {
      console.error('Lookup failed, going to registration fallback:', err);
      setMatchedColleague(null);
      setLoading(false);
      setStep('register');
    }
  };

  // Handler to register brand new user and send code
  const handleRegisterAndSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setLoading(true);
    setError(null);
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    setPhoneNumber(cleanPhone); // Update state to display beautifully normalized format
    await triggerSmsOtp(cleanPhone);
  };

  // Master function to trigger real or simulated SMS
  const triggerSmsOtp = async (cleanPhone: string) => {
    if (isSandboxMode) {
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
        setVerificationCode('123456'); // Pre-fill sandbox code for super convenient testing
        setInfoMessage('SANDBOX OTP SIMULATED: Enter "123456" or click submit.');
      }, 1000);
      return;
    }

    // LIVE FIREBASE SMS AUTH
    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA verifier is not initialized.');
      }

      let formattedPhone = cleanPhone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;
      
      setLoading(false);
      setStep('otp');
      setInfoMessage(`SMS Verification code sent to ${formattedPhone}`);
    } catch (err: any) {
      console.error('Firebase Auth SMS Send Error:', err);
      setLoading(false);
      
      let errMsg = err.message || 'Failed to send SMS verification code.';
      if (err.code === 'auth/invalid-phone-number') {
        errMsg = 'Invalid phone number format. Please enter in international format, e.g. +1 555-555-5555';
      } else if (err.code === 'auth/unauthorized-domain') {
        errMsg = 'This domain is not authorized in your Firebase console. Use "Sandbox Mode" above to log in successfully.';
      } else if (err.code === 'auth/billing-not-enabled' || (err.message && err.message.includes('billing-not-enabled'))) {
        errMsg = 'Firebase Billing account issue (auth/billing-not-enabled). If you recently upgraded to the Blaze Plan, please note that GCP billing propagation can take 10-15 minutes to fully activate across all APIs. If you are on the Spark Free Tier, you must disable reCAPTCHA Enterprise in your Firebase Console (Build > Authentication > Settings > User sign-in) to use standard free Phone Auth.';
      }
      
      setError(errMsg);
    }
  };

  // Handler to verify OTP and complete log in
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    // SANDBOX MODE VERIFICATION
    if (isSandboxMode) {
      try {
        const cleanPhone = normalizePhoneNumber(phoneNumber) || '+15555555555';
        
        // If matched colleague already exists, use that. Otherwise, register new profile
        let resolvedUser: ActionOwner;
        if (matchedColleague) {
          resolvedUser = matchedColleague;
        } else {
          resolvedUser = await resolveColleagueProfile(cleanPhone, fullName, selectedFacility);
        }

        setLoading(false);
        if (verificationCode === '123456' || verificationCode === '888888') {
          onLoginSuccess(resolvedUser, null);
        } else {
          setError('Invalid verification code in Sandbox Mode. Use "123456" to log in.');
        }
      } catch (err: any) {
        setLoading(false);
        setError('Error resolving user details.');
      }
      return;
    }

    // LIVE FIREBASE SMS AUTH CONFIRMATION
    try {
      if (!confirmationResultRef.current) {
        throw new Error('Verification session has expired. Please request a new code.');
      }

      const result = await confirmationResultRef.current.confirm(verificationCode.trim());
      const firebaseUser = result.user;
      
      // Resolve/Register actual colleague profile
      let resolvedUser: ActionOwner;
      if (matchedColleague) {
        resolvedUser = matchedColleague;
      } else {
        resolvedUser = await resolveColleagueProfile(phoneNumber, fullName, selectedFacility);
      }
      
      setLoading(false);
      onLoginSuccess(resolvedUser, firebaseUser);
    } catch (err: any) {
      console.error('Firebase Code Verification Error:', err);
      setLoading(false);
      setError(err.code === 'auth/invalid-verification-code' 
        ? 'Invalid SMS verification code. Please check and try again.' 
        : (err.message || 'Verification failed.')
      );
    }
  };

  // Select Sandbox Demo account for instant log in
  const handleSelectDemoAccount = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setError(null);
    setPhoneNumber(demo.phone);
    setFullName(demo.name);
    
    // Auto-create matching colleague in state for clean simulation
    setMatchedColleague({
      id: demo.name.toLowerCase().replace(/\s+/g, '.') + '-demo',
      username: demo.name.toLowerCase().replace(/\s+/g, '.'),
      fullName: demo.name,
      role: demo.role,
      department: demo.role === 'superadmin' ? 'Management' : demo.role === 'HoD' ? 'Quality Assurance' : 'Operations',
      facility: demo.facility,
      phoneNumber: demo.phone,
      phoneNumbers: [demo.phone],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demo.name)}`
    });

    setStep('otp');
    setVerificationCode('123456');
    setInfoMessage(`SANDBOX ACTIVE: Selected demo profile ${demo.name} (${demo.role}). Code is prefilled!`);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background graphics */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-slate-900 to-slate-900" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl relative z-10 overflow-hidden">
        
        {/* DHL Highlight strip */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

        <div className="p-6 sm:p-8 flex flex-col items-center">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <img 
              src="https://1000logos.net/wp-content/uploads/2018/08/DHL-emblem.jpg" 
              alt="DHL Logo" 
              referrerPolicy="no-referrer"
              className="h-8 sm:h-10 w-auto object-contain rounded-md mb-3"
            />
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              DHL Voice Workspace
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Colleague Secure Access Only
            </p>
          </div>

          {/* Environment/Sandbox Toggle Banner */}
          {(new URLSearchParams(window.location.search).get('sandbox') === 'true' || isSandboxMode) && (
            <div className="w-full bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between mb-5 animate-fade-in">
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${isSandboxMode ? 'text-amber-400' : 'text-emerald-400'}`} />
                <div className="text-left">
                  <span className="text-[10px] font-bold text-white block uppercase tracking-wider">
                    {isSandboxMode ? 'Sandbox Preview' : 'Live Gateway'}
                  </span>
                  <span className="text-[9px] text-slate-400 block leading-tight">
                    {isSandboxMode ? 'Mock SMS code for sandboxed iframe' : 'Send actual OTP to real phone'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSandboxMode(!isSandboxMode);
                  setStep('phone');
                  setPhoneNumber('+855');
                  setFullName('');
                  setMatchedColleague(null);
                  setVerificationCode('');
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isSandboxMode ? 'bg-amber-400' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-900 shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isSandboxMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Form Content Steps */}
          <div className="w-full relative">
            <div id="recaptcha-container" className="hidden"></div>

            {/* Notifications */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg flex items-start gap-2.5 mb-4 text-left"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="whitespace-pre-line leading-relaxed">{error}</div>
                    
                    {/* Sandbox Bypass Trigger */}
                    {(error.includes('billing-not-enabled') || error.includes('reCAPTCHA') || error.includes('unauthorized-domain')) && (
                      <div className="pt-2 border-t border-rose-500/20">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSandboxMode(true);
                            setStep('phone');
                            setPhoneNumber('');
                            setFullName('');
                            setMatchedColleague(null);
                            setVerificationCode('');
                            setError(null);
                            setInfoMessage('Sandbox Bypass activated! Select a test profile below or use any phone number with OTP code "123456" or "888888".');
                          }}
                          className="w-full py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded text-[11px] transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Activate Sandbox Bypass Mode</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {infoMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-amber-400/15 border border-amber-400/30 text-amber-200 text-[11px] font-medium p-2.5 rounded-lg flex items-center gap-2 mb-4 text-left"
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>{infoMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 1: ENTER PHONE NUMBER FIRST */}
            {step === 'phone' && (
              <div className="space-y-4">
                <form onSubmit={handleInitiateLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                      Enter Mobile Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={isSandboxMode ? "+1 (555) 555-5555" : "International format (+855...)"}
                        className="w-full bg-slate-900 text-slate-100 text-xs pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-700 focus:outline-hidden focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      Enter your phone number. If registered, we will instantly recognize you. If not, we will register you as a brand-new Facility Agent.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 text-xs font-black uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying phone number...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue & Send OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* SANDBOX MODE QUICK DEMO LOGIN ACCOUNTS */}
                {isSandboxMode && (
                  <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-2.5">
                    <span className="block text-[9px] font-extrabold uppercase tracking-widest text-amber-400 text-center">
                      Quick Select Sandbox Demo Profiles
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {DEMO_ACCOUNTS.map((demo) => (
                        <button
                          key={demo.name}
                          type="button"
                          onClick={() => handleSelectDemoAccount(demo)}
                          className={`p-2 rounded-lg border text-left flex justify-between items-center transition-all hover:bg-slate-700/40 cursor-pointer ${demo.color}`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <div>
                              <span className="text-xs font-bold block leading-tight">{demo.name}</span>
                              <span className="text-[9px] block text-slate-400 font-normal leading-tight">
                                Phone: {demo.phone} · Facility: {demo.facility}
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-slate-900/40 rounded border border-white/10 shrink-0">
                            {demo.role === 'superadmin' ? 'Superadmin' : demo.role === 'HoD' ? 'HOD' : 'Agent'}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Explicit instruction on how to log in as Superadmin */}
                    <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg text-[10px] text-slate-300 leading-relaxed text-left flex gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-black uppercase text-amber-400 text-[9px] tracking-wider mb-0.5">
                          How to log in as Superadmin:
                        </span>
                        In <span className="font-extrabold text-amber-300">Sandbox Mode</span>, click the first demo account above to enter as Superadmin instantly. In <span className="font-extrabold text-amber-300">Live Gateway Mode</span>, the first phone number to ever register in the database is automatically set as Superadmin.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PROFILE REGISTRATION (ONLY FOR NEW UNRECOGNIZED PHONES) */}
            {step === 'register' && (
              <form onSubmit={handleRegisterAndSendCode} className="space-y-4 text-left">
                <div className="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-xl flex gap-3 text-amber-200">
                  <UserCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block text-white">New Colleague Registration</span>
                    Phone number <span className="font-mono font-bold text-amber-400">{phoneNumber}</span> is not registered yet. Please enter your details below.
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name (e.g. John Doe)"
                    className="w-full bg-slate-900 text-slate-100 text-xs px-3.5 py-2.5 rounded-lg border border-slate-700 focus:outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                    Select Assigned DHL Facility
                  </label>
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 text-xs px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-hidden focus:border-amber-400 transition-colors"
                  >
                    <option value="PNHGTW">PNHGTW (Gateway)</option>
                    <option value="PNHASC">PNHASC (ASC)</option>
                    <option value="PNHSVC">PNHSVC (SVC)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    Select your primary physical work facility. This registration requires approval from a DHL Superadmin.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-1/3 border border-slate-700 hover:bg-slate-700/40 text-slate-300 text-xs font-bold py-3 rounded-lg text-center cursor-pointer transition-colors"
                  >
                    Change Phone
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 text-xs font-black uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: OTP VERIFICATION CODE */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyCode} className="space-y-4 text-left">
                {matchedColleague && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3 text-emerald-300">
                    <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold block text-white">Recognized Profile Lock</span>
                      Welcome back, <span className="font-extrabold text-emerald-400">{matchedColleague.fullName}</span>! Registered as <span className="font-bold text-white">{matchedColleague.role}</span>.
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      6-Digit Security Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-[10px] text-amber-400 font-semibold hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="******"
                      className="w-full bg-slate-900 text-slate-100 text-xs pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-700 tracking-widest focus:outline-hidden focus:border-amber-400 text-center transition-colors font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-black uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate and Enter Portal</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Secure details footer */}
          <div className="mt-6 flex items-center gap-2 text-[9px] text-slate-400/80 border-t border-slate-700/50 pt-4 w-full justify-center">
            <Lock className="w-3 h-3 text-emerald-400/70" />
            <span>DHL Enterprise-Grade SMS Authentication Gateway</span>
          </div>

        </div>
      </div>
    </div>
  );
}
