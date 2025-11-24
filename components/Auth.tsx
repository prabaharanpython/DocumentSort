
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { IconFile, IconLock, IconUser, IconCheck } from './Icons';

interface AuthProps {
  onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for UX
    await new Promise(r => setTimeout(r, 600));

    try {
      if (!username.trim()) {
        setError("Username is required");
        setLoading(false);
        return;
      }

      if (isLogin) {
        const success = await authService.login(username, password);
        if (success) {
           onLogin(username);
        } else {
           setError("Invalid Username or Password");
        }
      } else {
        // Register Logic
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            setLoading(false);
            return;
        }
        
        const success = await authService.register(username, password);
        if (success) {
            onLogin(username);
        } else {
            setError("Username already taken. Try another.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* Brand Header */}
      <div className="mb-8 text-center animate-fade-in-down">
        <div className="bg-brand-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
             <IconFile className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">DocuSort</h1>
        <p className="text-slate-500 mt-2">Secure Personal Document Organizer</p>
      </div>

      {/* Auth Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
         
         <div className="flex border-b border-slate-100">
            <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${isLogin ? 'text-brand-600 bg-brand-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Log In
            </button>
            <button 
                 onClick={() => { setIsLogin(false); setError(''); }}
                 className={`flex-1 py-4 text-sm font-semibold transition-colors ${!isLogin ? 'text-brand-600 bg-brand-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Create Account
            </button>
         </div>
         
         <form onSubmit={handleSubmit} className="p-8 space-y-5">
            
            {/* Username Field */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <div className="relative">
                    <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-slate-800 font-medium"
                        placeholder="Enter username"
                        autoComplete="username"
                    />
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isLogin ? 'Password' : 'Create Password'}
                </label>
                <div className="relative">
                    <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-slate-800 font-medium tracking-widest"
                        placeholder="••••••"
                        autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                        <IconCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all text-slate-800 font-medium tracking-widest"
                            placeholder="••••••"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg text-center animate-fade-in">
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 active:scale-[0.98] transition-all shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
            >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLogin ? 'Secure Login' : 'Create Vault'}
            </button>
         </form>
      </div>

      <p className="mt-8 text-xs text-slate-400 max-w-xs text-center">
        DocuSort stores your data encrypted locally. Ensure you remember your credentials as there is no cloud recovery.
      </p>
    </div>
  );
};

export default Auth;
