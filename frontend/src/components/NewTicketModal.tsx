"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { TicketStatus, Priority, User } from '../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// P0 = Critical (highest), P1 = High, P2 = Normal (default), P3 = Low
const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'P0', label: 'P0 – Critical' },
  { value: 'P1', label: 'P1 – High' },
  { value: 'P2', label: 'P2 – Normal' },
  { value: 'P3', label: 'P3 – Low' },
];

const NewTicketModal = ({ isOpen, onClose, onSuccess }: NewTicketModalProps) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<User[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: Priority;
    status: TicketStatus;
    assignedToId: string;
  }>({
    title: '',
    description: '',
    priority: 'P2',
    status: 'TODO',
    assignedToId: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData({ title: '', description: '', priority: 'P2', status: 'TODO', assignedToId: '' });
      fetch(${process.env.NEXT_PUBLIC_API_URL}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => setStaff(Array.isArray(data) ? data.filter((u: User) => u.isActive) : []))
        .catch(() => setStaff([]));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
      };
      if (formData.assignedToId) body.assignedToId = parseInt(formData.assignedToId);

      const res = await fetch(${process.env.NEXT_PUBLIC_API_URL}, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to create ticket');
      }
    } catch (_) {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card w-full max-w-xl relative p-8 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-1">Create New Ticket</h2>
        <p className="text-white/30 text-xs mb-6">Fill in the details below to create a new IT ticket.</p>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Title *</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Brief summary of the issue"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Initial Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as TicketStatus})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Assign To</label>
            <select 
              value={formData.assignedToId}
              onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            >
              <option value="">Unassigned</option>
              {staff.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1 block">Description *</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the problem or task in detail..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
