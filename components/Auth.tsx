
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

interface UserRecord {
  email: string;
  password: string;
  user: User;
}

const getUsersDB = (): Record<string, UserRecord> => {
  const db = localStorage.getItem('cc_users_db');
  return db ? JSON.parse(db) : {};
};

const saveUsersDB = (db: Record<string, UserRecord>) => {
  localStorage.setItem('cc_users_db', JSON.stringify(db));
};

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const db = getUsersDB();

    if (isLogin) {
      // Login Logic
      const userRecord = db[email];
      if (userRecord && userRecord.password === password) {
        onLogin(userRecord.user);
      } else {
        setError('Invalid credentials.');
      }
    } else {
      // Sign Up Logic
      if (db[email]) {
        setError('Email already exists in the registry.');
        return;
      }

      if (!username.trim() || !email.trim() || !password.trim()) {
        setError('All fields must be inscribed.');
        return;
      }

      const newUser: User = {
        id: 'u' + Date.now(),
        username: username,
        email: email,
        avatar: `https://picsum.photos/seed/${username}/200/200`,
        status: 'online'
      };

      const newRecord: UserRecord = {
        email,
        password,
        user: newUser
      };

      db[email] = newRecord;
      saveUsersDB(db);
      onLogin(newUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center p-4 mandala-bg">
      <div className="w-full max-w-md bg-[#080808] border border-[#3d2b0f] shadow-[0_0_60px_rgba(0,0,0,0.8)] p-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Ornamental Border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
        
        <div className="text-center mb-10 relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[#D4AF37] flex items-center justify-center bg-black/50 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <span className="text-2xl text-[#D4AF37]">⚜️</span>
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
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#8a7038] via-[#D4AF37] to-[#8a7038] text-black font-bold uppercase tracking-widest text-xs py-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-4 royal-font"
          >
            {isLogin ? 'Enter Court' : 'Sign Registry'}
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
