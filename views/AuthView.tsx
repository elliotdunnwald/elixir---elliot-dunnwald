import React, { useState } from 'react';
import { Mail, Lock, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthViewProps {
  onAuthComplete?: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = emailRegex.test(formData.email);
    const validPassword = formData.password.length >= 6;

    if (isSignUp) {
      return validEmail && validPassword && formData.password === formData.confirmPassword;
    }

    return validEmail && validPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { user, error } = await signUp(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else if (user) {
          onAuthComplete?.();
        }
      } else {
        const { user, error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else if (user) {
          onAuthComplete?.();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full space-y-12 py-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">ELIXR</h1>
          <p className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.3em]">
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-white transition-colors" />
              <input
                autoFocus
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="EMAIL ADDRESS"
                disabled={loading}
                className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl font-black text-white text-center uppercase tracking-tighter py-4 pl-8 disabled:opacity-50"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-white transition-colors" />
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder="PASSWORD"
                disabled={loading}
                className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl font-black text-white text-center uppercase tracking-tighter py-4 pl-8 disabled:opacity-50"
              />
            </div>

            {isSignUp && (
              <div className="relative group animate-in fade-in slide-in-from-bottom-4">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-white transition-colors" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="CONFIRM PASSWORD"
                  disabled={loading}
                  className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl font-black text-white text-center uppercase tracking-tighter py-4 pl-8 disabled:opacity-50"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border-2 border-red-900 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-red-400 text-xs font-black uppercase tracking-wider text-center">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full bg-white text-black disabled:bg-zinc-900 disabled:text-zinc-700 py-7 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> LOADING
                </>
              ) : (
                <>
                  {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'} <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setFormData({ email: '', password: '', confirmPassword: '' });
              }}
              disabled={loading}
              className="w-full bg-zinc-900 text-zinc-400 hover:text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            >
              {isSignUp ? 'ALREADY HAVE AN ACCOUNT? SIGN IN' : 'NEW USER? CREATE ACCOUNT'}
            </button>
          </div>

          {isSignUp && (
            <div className="text-center animate-in fade-in">
              <p className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider leading-relaxed">
                By creating an account, you'll be able to<br />
                share your brews and connect with coffee lovers worldwide
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthView;
