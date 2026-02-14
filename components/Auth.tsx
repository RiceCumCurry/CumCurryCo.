
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { socket } from '../services/socket';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure socket is connected
    socket.connect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      socket.emit('auth:login', { email, password }, (response: any) => {
        setLoading(false);
        if (response.success) {
          onLogin(response.user);
        } else {
          setError(response.error || 'Authentication failed.');
        }
      });
    } else {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('All fields must be inscribed.');
        setLoading(false);
        return;
      }

      socket.emit('auth:register', { email, password, username }, (response: any) => {
        setLoading(false);
        if (response.success) {
          onLogin(response.user);
        } else {
          setError(response.error || 'Registration failed.');
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center p-4 mandala-bg">
      <div className="w-full max-w-md bg-[#080808] border border-[#3d2b0f] shadow-[0_0_60px_rgba(0,0,0,0.8)] p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Ornamental Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
        
        <div className="text-center mb-10 relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-full border border-[#D4AF37] flex items-center justify-center bg-black/50 shadow-[0_0_20px_rgba(212,175,55,0.3)] overflow-hidden group">
              <div className="absolute inset-0 bg-[#D4AF37] opacity-5 group-hover:opacity-10 transition-opacity" />
              {/* Embedded SVG Logo */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-14 h-14 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]"
              >
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" fill="#D4AF37" fillOpacity="0.1" />
              </svg>
          </div>
          <h1 className="text-3xl royal-font font-bold text-[#F4C430] tracking-[0.2em] mb-2">CUMCURRY</h1>
          <p className="text-[#8a7038] text-xs uppercase tracking-widest font-bold">The Royal Court of Gaming</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 text-red-500 text-xs font-bold text-center uppercase tracking-wide royal-font">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-[#5c4010] uppercase tracking-widest royal-font">Designation</label>
              <input 
                required
                type="text" 
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className="w-full bg-[#0c0c0c] border border-[#3d2b0f] p-3 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all placeholder-[#2a1d0a]"
                placeholder="Name"
                disabled={loading}
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-[#5c4010] uppercase tracking-widest royal-font">Correspondence</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="w-full bg-[#0c0c0c] border border-[#3d2b0f] p-3 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all placeholder-[#2a1d0a]"
              placeholder="Email"
              disabled={loading}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-[#5c4010] uppercase tracking-widest royal-font">Secret Key</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-[#0c0c0c] border border-[#3d2b0f] p-3 text-[#F5F5DC] font-medium focus:outline-none focus:border-[#D4AF37] transition-all placeholder-[#2a1d0a]"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#8a7038] via-[#D4AF37] to-[#8a7038] text-black font-bold uppercase tracking-widest text-xs py-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-4 royal-font disabled:opacity-50"
          >
            {loading ? 'Consulting Archives...' : (isLogin ? 'Enter Court' : 'Sign Registry')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#3d2b0f] text-xs text-center font-medium">
          <span className="text-[#5c4010]">{isLogin ? "New to the kingdom?" : "Already registered?"}</span>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setPassword(''); }}
            className="text-[#D4AF37] font-bold uppercase tracking-wide ml-2 hover:text-[#F4C430] royal-font"
          >
            {isLogin ? 'Join Us' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
