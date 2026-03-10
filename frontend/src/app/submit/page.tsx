"use client";
import React, { useState } from 'react';

const PublicTicketForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requesterName: '',
    priority: 'MEDIUM'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      alert('Failed to submit ticket. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-12 text-center max-w-lg mx-auto mt-20">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
        <h2 className="text-2xl mb-2">Ticket Submitted</h2>
        <p className="text-white/40 mb-8">Your request has been received. Our IT team will review it shortly. No login is required to track this.</p>
        <button onClick={() => setSubmitted(false)} className="text-indigo-400 hover:underline text-sm font-medium">Submit another request</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="h-14 border-b border-white/5 flex items-center px-8 gap-4 bg-black/20 backdrop-blur-md">
        <a href="/" className="text-white/40 hover:text-white text-sm font-medium transition-colors flex items-center gap-2">
          ← Back to Dashboard
        </a>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-sm font-bold text-white/60">Submit Support Request</span>
      </header>
      <div className="max-w-2xl mx-auto py-16 px-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl mb-4">Support Request</h1>
        <p className="text-white/40">Need help? Fill out the form below and our IT team will get back to you. Anonymity is supported.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Your Name (Optional)</label>
            <input 
              type="text" 
              value={formData.requesterName}
              onChange={(e) => setFormData({...formData, requesterName: e.target.value})}
              placeholder="e.g. John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Priority</label>
            <select 
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Issue Title</label>
          <input 
            required
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="What's going on?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Full Description</label>
          <textarea 
            required
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Please provide as much detail as possible..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
          ></textarea>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
    </div>
  );
};

export default PublicTicketForm;
