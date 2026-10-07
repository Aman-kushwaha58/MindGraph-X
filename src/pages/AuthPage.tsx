import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'reset';
}

export const AuthPage: React.FC<Props> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('mindgraph_last_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // Check URL parameters on mount for reset_token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('reset_token') || params.get('token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setMode('reset');
      // Clean query parameter from browser bar without reload
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Verify token immediately
      api.verifyResetToken(tokenFromUrl).then((res) => {
        if (res.email) setEmail(res.email);
      }).catch((err) => {
        setError(err.message || 'This password reset link is invalid or has expired.');
      });
    }
  }, []);

  const switchMode = (newMode: 'login' | 'signup' | 'forgot' | 'reset') => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
    setDevResetUrl(null);
  };

  // ==========================================
  // 1. Sign In (Email + Password)
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.login(cleanEmail, password);
      try {
        localStorage.setItem('mindgraph_last_email', cleanEmail);
      } catch {}
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. Simple Signup (Name + Email + Password + Confirm)
  // ==========================================
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Name is required.');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Valid email address is required.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*...).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.signup({
        name: cleanName,
        email: cleanEmail,
        password,
        confirm_password: confirmPassword,
      });
      setSuccessMessage('Account created successfully! Logging you in...');
      try {
        localStorage.setItem('mindgraph_last_email', cleanEmail);
      } catch {}
      setTimeout(() => {
        onAuthSuccess(res.user);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. Request Password Reset Link
  // ==========================================
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(cleanEmail);
      setSuccessMessage(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        if (res.reset_url) setDevResetUrl(res.reset_url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. Update Password with Reset Token
  // ==========================================
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*...).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.resetPassword({
        token: resetToken,
        password,
        confirm_password: confirmPassword,
      });
      setSuccessMessage(res.message);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        switchMode('login');
        setSuccessMessage('Password updated! Please sign in with your new password.');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-primary text-text-primary flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Top right Theme Toggle for login/signup screens */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Background ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/15 border border-border-accent text-accent-purple text-xs font-mono font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
            <span>MindGraph X &bull; Zero-Hallucination Intelligence</span>
          </div>

          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set new password'}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {mode === 'login' && 'Enter your email and password to access your semantic knowledge graph'}
            {mode === 'signup' && 'Enter your details below to create an account and get started'}
            {mode === 'forgot' && "Enter your email address and we'll send you a secure reset link"}
            {mode === 'reset' && 'Choose a new secure password for your MindGraph X account'}
          </p>
        </div>

        {/* Mode Selector Tabs (only shown for Login & Signup) */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="flex bg-bg-elevated p-1 rounded-2xl border border-border-subtle mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-accent-purple text-white shadow-md shadow-purple-600/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-accent-purple text-white shadow-md shadow-purple-600/30'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex flex-col gap-2 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
            {error.toLowerCase().includes('already exists') && mode === 'signup' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="self-start ml-6 px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-500/40 text-rose-100 text-[11px] font-semibold transition-colors"
              >
                Switch to Sign In &rarr;
              </button>
            )}
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex flex-col gap-2.5 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>

            {/* Dev Mode Instant Jump Helper */}
            {mode === 'forgot' && resetToken && (
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setSuccessMessage(null);
                }}
                className="mt-1 px-3 py-1.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center justify-between transition-all"
              >
                <span>Follow reset link now &rarr;</span>
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN (Email + Password)                        */}
        {/* ========================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-secondary">Password</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-accent-purple hover:underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-text-secondary">Don't have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-xs font-semibold text-accent-purple hover:underline transition-colors cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CREATE ACCOUNT (Name + Email + Password + Confirm) */}
        {/* ========================================================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Password
                </label>
                <span className="text-[10px] text-text-muted">Min 8 chars (1 upper, 1 num, 1 special)</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-text-secondary">Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs font-semibold text-accent-purple hover:underline transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: FORGOT PASSWORD (Request Secure Link)             */}
        {/* ========================================================= */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send Password Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: RESET PASSWORD (Set New Password via Token Link)  */}
        {/* ========================================================= */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  New Password
                </label>
                <span className="text-[10px] text-text-muted">Min 8 chars (1 upper, 1 num, 1 special)</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-bg-elevated border border-border-subtle text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel and return to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
