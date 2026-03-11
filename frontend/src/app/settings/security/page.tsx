"use client";
import React, { useState } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsLoading(true);

    try {
      // Supabase handles the password update for the currently authenticated user
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Also update the public.User table password mirror (for legacy/custom tools if used)
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
           await fetch('/api/users/update-password', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: user.email, password: newPassword }),
           });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          Security Settings
        </h1>
        <p className="text-white/40 mt-2">Manage your account security and password.</p>
      </div>

      <div className="bg-zinc-950/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
            <Lock className="text-blue-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
            <p className="text-xs text-white/30 uppercase tracking-widest font-bold mt-1">Updates your account credentials</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-6">
          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">New Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[10px] uppercase font-black text-blue-500 hover:text-blue-400 transition-colors"
                >
                  {showPasswords ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  required
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  required
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/10 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield size={18} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-10 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Security Note</p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Changing your password will sign you out of all other sessions. Ensure your new password is secure and includes a mix of characters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
