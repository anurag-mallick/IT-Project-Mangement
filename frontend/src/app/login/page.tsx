"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, Mail, Github, Linkedin, Cpu } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (sbError) {
        setError(sbError.message);
      } else if (data.session && data.user) {
        login(data.session.access_token, data.user as { id: string; name?: string; role: string; username?: string });
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please try again.');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bg-mesh {
            background-color: #09090b;
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(147, 51, 234, 0.1) 0px, transparent 50%);
        }
        .animate-subtle {
            animation: breathe 8s ease-in-out infinite;
        }
        @keyframes breathe {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
        }
      `}} />

      <div className="font-sans bg-[#09090b] text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 bg-mesh relative overflow-hidden">
        {/* Background Decorative Blob */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] animate-subtle"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] animate-subtle" style={{animationDelay: '-4s'}}></div>

        {/* Main Content */}
        <main className="w-full max-w-[400px] z-10 flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
              <Cpu className="text-blue-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-white">
              HORIZON<span className="text-blue-500">IT</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Enterprise Management Suite</p>
          </div>

          <div className="glass-panel w-full rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl text-center font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" size={18} />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm" 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Password</label>
                  <a className="text-[10px] text-blue-500 hover:underline font-bold transition-all" href="#">Recovery</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" size={18} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-11 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-600/10 transition-all active:scale-[0.98] mt-4 text-sm"
              >
                Launch Dashboard
              </button>
            </form>
          </div>
          
          <div className="mt-8 text-center flex flex-col items-center gap-6">
            <p className="text-slate-500 text-xs">
              © 2024 Horizon IT. All rights reserved.
            </p>

            {/* User Branding & Socials */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black">Developed By</span>
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/anurag-mallick" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  title="GitHub"
                >
                  <Github size={18} />
                </a>
                <a 
                  href="https://linkedin.com/in/anurag-mallick" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  title="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default LoginPage;
