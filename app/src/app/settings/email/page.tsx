"use client";
import { useState, useEffect } from 'react';
import { Mail, Save, Play, Loader2, AlertCircle, Eye, EyeOff, Inbox, Send, Shield, Server, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '@/components/Toast';

export default function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingImap, setTestingImap] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showImapPass, setShowImapPass] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [settings, setSettings] = useState({
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: '',
    IMAP_HOST: '',
    IMAP_PORT: '993',
    IMAP_SECURE: 'true',
    IMAP_USER: '',
    IMAP_PASS: '',
    IMAP_TICKET_FOLDER: 'INBOX',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/email');
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      setToast({ message: 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setToast({ message: 'Settings saved successfully', type: 'success' });
      } else {
        throw new Error();
      }
    } catch (err) {
      setToast({ message: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/settings/email?action=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message, type: 'success' });
      } else {
        setToast({ message: data.error || 'Connection test failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to test connection', type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestImap = async () => {
    setTestingImap(true);
    try {
      const res = await fetch('/api/settings/email?action=test-imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message, type: 'success' });
      } else {
        setToast({ message: data.error || 'IMAP connection test failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to test IMAP connection', type: 'error' });
    } finally {
      setTestingImap(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-8 pb-24"
    >
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onDismiss={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative p-2">
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tight">
            <Mail className="w-10 h-10 text-blue-500 bg-blue-500/10 p-2 rounded-xl" />
            Email Configuration
          </h1>
          <p className="text-white/40 mt-3 text-lg font-medium max-w-2xl">
            Manage your SMTP and IMAP servers to enable outbound notifications and inbound ticket processing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* SMTP Section */}
        <section className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <Send className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Outgoing Mail</h2>
                <p className="text-white/30 text-sm font-medium">Configure SMTP for sending notifications</p>
              </div>
            </div>
            <button
              onClick={handleTest}
              disabled={testing || saving}
              className="flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white text-sm font-bold py-3 px-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all disabled:opacity-50 group/test active:scale-95 shadow-lg"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="text-green-500 group-hover/test:scale-110 transition-transform" />}
              Test connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            <div className="space-y-6">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-blue-500/50" />
                  <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">SMTP Host</label>
                </div>
                <input 
                  type="text"
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-mono placeholder:text-white/10"
                  value={settings.SMTP_HOST}
                  onChange={e => setSettings({...settings, SMTP_HOST: e.target.value})}
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Port</label>
                  <input 
                    type="text"
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-mono placeholder:text-white/10"
                    value={settings.SMTP_PORT}
                    onChange={e => setSettings({...settings, SMTP_PORT: e.target.value})}
                    placeholder="587"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-500/50" />
                    <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Security</label>
                  </div>
                  <select 
                    className="bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all cursor-pointer appearance-none"
                    value={settings.SMTP_SECURE}
                    onChange={e => setSettings({...settings, SMTP_SECURE: e.target.value})}
                  >
                    <option value="false" className="bg-zinc-900 px-4 py-2">STARTTLS (587)</option>
                    <option value="true" className="bg-zinc-900 px-4 py-2">SSL/TLS (465)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3">
                <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Sender Address</label>
                <input 
                  type="email"
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-mono placeholder:text-white/10"
                  value={settings.SMTP_FROM}
                  onChange={e => setSettings({...settings, SMTP_FROM: e.target.value})}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-3">
                <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Username</label>
                <input 
                  type="text"
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-mono placeholder:text-white/10"
                  value={settings.SMTP_USER}
                  onChange={e => setSettings({...settings, SMTP_USER: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Password</label>
                <div className="relative">
                  <input 
                    type={showSmtpPass ? "text" : "password"}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-mono placeholder:text-white/10 pr-12"
                    value={settings.SMTP_PASS}
                    onChange={e => setSettings({...settings, SMTP_PASS: e.target.value})}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showSmtpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <div className="flex gap-3">
                  <AlertCircle size={16} className="text-blue-400 mt-0.5" />
                  <p className="text-[11px] text-blue-300 leading-relaxed font-medium">
                    Ensure your SMTP server allows connections from the application's IP. For Gmail, use an <span className="underline decoration-blue-400/30">App Password</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IMAP Section */}
        <section className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[120px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8 mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl">
                <Inbox className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Incoming Mail</h2>
                <p className="text-white/30 text-sm font-medium">Configure IMAP for ticket creation</p>
              </div>
            </div>
            <button
              onClick={handleTestImap}
              disabled={testingImap || saving}
              className="flex items-center justify-center gap-2 bg-zinc-800/50 hover:bg-zinc-700/50 text-white text-sm font-bold py-3 px-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all disabled:opacity-50 group/test active:scale-95 shadow-lg"
            >
              {testingImap ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="text-green-500 group-hover/test:scale-110 transition-transform" />}
              Test connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            <div className="space-y-6">
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-purple-500/50" />
                  <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">IMAP Host</label>
                </div>
                <input 
                  type="text"
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-mono placeholder:text-white/10"
                  value={settings.IMAP_HOST}
                  onChange={e => setSettings({...settings, IMAP_HOST: e.target.value})}
                  placeholder="imap.gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Port</label>
                  <input 
                    type="text"
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-mono placeholder:text-white/10"
                    value={settings.IMAP_PORT}
                    onChange={e => setSettings({...settings, IMAP_PORT: e.target.value})}
                    placeholder="993"
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-purple-500/50" />
                    <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Folder</label>
                  </div>
                  <input 
                    type="text"
                    className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-mono placeholder:text-white/10"
                    value={settings.IMAP_TICKET_FOLDER}
                    onChange={e => setSettings({...settings, IMAP_TICKET_FOLDER: e.target.value})}
                    placeholder="INBOX"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-500/50" />
                  <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">Security</label>
                </div>
                <select 
                  className="bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all cursor-pointer appearance-none"
                  value={settings.IMAP_SECURE}
                  onChange={e => setSettings({...settings, IMAP_SECURE: e.target.value})}
                >
                  <option value="true" className="bg-zinc-900 px-4 py-2">SSL/TLS (993)</option>
                  <option value="false" className="bg-zinc-900 px-4 py-2">STARTTLS (143)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-3">
                <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">IMAP Username</label>
                <input 
                  type="text"
                  className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-mono placeholder:text-white/10"
                  value={settings.IMAP_USER}
                  onChange={e => setSettings({...settings, IMAP_USER: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-[11px] uppercase font-black text-white/30 tracking-[0.25em]">IMAP Password</label>
                <div className="relative">
                  <input 
                    type={showImapPass ? "text" : "password"}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all font-mono placeholder:text-white/10 pr-12"
                    value={settings.IMAP_PASS}
                    onChange={e => setSettings({...settings, IMAP_PASS: e.target.value})}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowImapPass(!showImapPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showImapPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4 p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                <div className="flex gap-3">
                  <AlertCircle size={16} className="text-purple-400 mt-0.5" />
                  <p className="text-[11px] text-purple-300 leading-relaxed font-medium">
                    The application will check the folder above for new messages and create support tickets automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button Container */}
      <div className="flex justify-end pt-6 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={saving || testing || testingImap}
          className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 px-14 rounded-[2rem] shadow-2xl shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
          {saving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Save className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
          )}
          <span className="text-lg">Save Changes</span>
        </button>
      </div>
    </motion.div>
  );
}

