"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { HelpCircle, Hexagon, Lock, Eye, EyeOff, Mail } from 'lucide-react';

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
        login(data.session.access_token, data.user as any);
      } else {
        setError('Login failed no session');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection error. Is the internet connected?');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .glass-panel {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .mesh-gradient {
            background-color: #161022;
            background-image: 
                radial-gradient(at 0% 0%, rgba(89, 13, 242, 0.3) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.2) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(89, 13, 242, 0.3) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(139, 92, 246, 0.2) 0px, transparent 50%);
        }
        .text-primary { color: #590df2; }
        .bg-primary { background-color: #590df2; }
        .bg-primary\\/20 { background-color: rgba(89, 13, 242, 0.2); }
        .bg-primary\\/90 { background-color: rgba(89, 13, 242, 0.9); }
        .border-primary { border-color: #590df2; }
        .border-primary\\/30 { border-color: rgba(89, 13, 242, 0.3); }
        .shadow-primary\\/20 { box-shadow: 0 4px 14px 0 rgba(89, 13, 242, 0.39); }
        .focus\\:ring-primary\\/50:focus { --tw-ring-color: rgba(89, 13, 242, 0.5); }
        .group-focus-within\\:text-primary:focus-within { color: #590df2; }
      `}} />

      <div className="font-sans bg-[#161022] text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 mesh-gradient relative">
        {/* Top Navigation / Logo Area */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg border border-primary/30 flex items-center justify-center">
              <Hexagon className="text-primary" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Antigravity<span className="text-primary">PM</span></span>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            <HelpCircle size={24} />
          </button>
        </div>

        {/* Main Login Card */}
        <main className="w-full max-w-sm z-10">
          <div className="glass-panel rounded-xl p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-slate-400 text-sm">Elevate your workflow today.</p>
            </div>

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl text-center font-medium">{error}</div>}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" size={20} />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <a className="text-xs text-primary hover:underline" href="#">Forgot?</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" size={20} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary hover:bg-[rgba(89,13,242,0.8)] text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4"
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-grow h-px bg-white/10"></div>
              <span className="px-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">Or continue with</span>
              <div class="flex-grow h-px bg-white/10"></div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 transition-colors active:scale-95">
                <img alt="Google" className="w-4 h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX1QxlBaPax4YiuLNhRkTtdAh8HLH1bqTPjhTyqVOQ-ftxilA5sMWQoesLUQ8agn7sFkHX66UEMIrmZuxChdAOXd-CPBidczjhUtM4u-Yb-RJJvdFJq-SPSl3oiPzknLDu9GApuSU4-0vd3VeTp-wgE2UUJMHJ3WQCCdg33h-EFkLGhPgdhX5gdWQdZVBCrsii2svHhe0f1k_8ii9-5wFoQuGAdNdeyn5P7oElz9V2HovX3qABH3wUw8TCUYuBW-drQQgGSsxISLPF" />
                <span className="text-sm font-medium text-slate-200">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 transition-colors active:scale-95">
                <svg aria-hidden="true" className="w-4 h-4 fill-slate-200" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path>
                </svg>
                <span className="text-sm font-medium text-slate-200">GitHub</span>
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center relative z-10">
            <p className="text-slate-500 text-sm">
              New to PM? <a className="text-primary font-bold hover:underline" href="#">Create Account</a>
            </p>
          </div>
        </main>

        {/* Bottom Decorative Elements */}
        <div className="mt-auto pb-6 pt-4 flex flex-col items-center gap-4 relative z-10">
          <div className="flex gap-6">
            <a className="text-xs text-slate-500 hover:text-slate-300 transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs text-slate-500 hover:text-slate-300 transition-colors" href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
